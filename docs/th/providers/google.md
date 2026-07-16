---
read_when:
    - คุณต้องการใช้โมเดล Google Gemini กับ OpenClaw
    - คุณต้องใช้คีย์ API หรือขั้นตอนการยืนยันตัวตนด้วย OAuth
summary: การตั้งค่า Google Gemini (คีย์ API + OAuth, การสร้างรูปภาพ, การทำความเข้าใจสื่อ, TTS, การค้นหาเว็บ)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-16T19:40:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fe8a58044bea7ce2598da94787334af2bb4a2ff58872c62115697fa0079daf0a
    source_path: providers/google.md
    workflow: 16
---

ปลั๊กอิน Google ให้การเข้าถึงโมเดล Gemini ผ่าน Google AI Studio พร้อมทั้งการสร้างรูปภาพ การทำความเข้าใจสื่อ (รูปภาพ/เสียง/วิดีโอ) การแปลงข้อความเป็นเสียงพูด และการค้นหาเว็บผ่าน Gemini Grounding

- ผู้ให้บริการ: `google`
- การตรวจสอบสิทธิ์: `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`
- API: Google Gemini API
- ตัวเลือกรันไทม์: `agentRuntime.id: "google-gemini-cli"` ใช้ OAuth ของ Gemini CLI ซ้ำ โดยคงการอ้างอิงโมเดลตามรูปแบบมาตรฐานเป็น `google/*`

## เริ่มต้นใช้งาน

เลือกวิธีการตรวจสอบสิทธิ์ที่ต้องการและทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="คีย์ API">
    **เหมาะที่สุดสำหรับ:** การเข้าถึง Gemini API แบบมาตรฐานผ่าน Google AI Studio

    <Steps>
      <Step title="รับคีย์ API">
        สร้างคีย์ฟรีใน [Google AI Studio](https://aistudio.google.com/apikey)
      </Step>
      <Step title="เรียกใช้การเริ่มต้นระบบ">
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
    รองรับทั้ง `GEMINI_API_KEY` และ `GOOGLE_API_KEY` ใช้ตัวที่กำหนดค่าไว้อยู่แล้ว
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **เหมาะที่สุดสำหรับ:** การลงชื่อเข้าใช้ด้วยบัญชี Google ผ่าน OAuth ของ Gemini CLI แทนการใช้คีย์ API แยกต่างหาก

    <Warning>
    ผู้ให้บริการ `google-gemini-cli` เป็นการผสานรวมที่ไม่เป็นทางการ ผู้ใช้บางราย
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
        รูปแบบไดเรกทอรี Windows/npm ที่ใช้กันทั่วไป
      </Step>
      <Step title="ลงชื่อเข้าใช้ผ่าน OAuth">
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

    รหัสโมเดล Gemini API ของ Gemini 3.1 Pro คือ `gemini-3.1-pro-preview` OpenClaw รองรับ `google/gemini-3.1-pro` ที่สั้นกว่าเป็นนามแฝงเพื่อความสะดวก และปรับให้อยู่ในรูปแบบมาตรฐานก่อนเรียกผู้ให้บริการ

    **ตัวแปรสภาพแวดล้อม:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    หากคำขอ OAuth ของ Gemini CLI ล้มเหลวหลังจากลงชื่อเข้าใช้ ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ
    `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway แล้วลองอีกครั้ง
    </Note>

    <Note>
    หากการลงชื่อเข้าใช้ล้มเหลวก่อนเริ่มขั้นตอนในเบราว์เซอร์ ตรวจสอบให้แน่ใจว่าคำสั่ง `gemini`
    ในเครื่องได้รับการติดตั้งและอยู่บน `PATH`
    </Note>

    การตรวจหาอัตโนมัติระหว่างการเริ่มต้นระบบจะแสดงรายการการลงชื่อเข้าใช้ Gemini CLI ที่มีอยู่ แต่จะไม่
    ทดสอบโดยอัตโนมัติ เนื่องจาก Gemini CLI ไม่มีการตรวจสอบที่ไม่ใช้เครื่องมือ เลือก OAuth ของ Gemini CLI
    หรือคีย์ Gemini API เพื่อดำเนินการต่อ

    การอ้างอิงโมเดล `google-gemini-cli/*` เป็นนามแฝงเพื่อความเข้ากันได้กับระบบเดิม การกำหนดค่าใหม่
    ควรใช้การอ้างอิงโมเดล `google/*` ร่วมกับรันไทม์ `google-gemini-cli`
    เมื่อต้องการเรียกใช้ Gemini CLI ในเครื่อง

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` ยุติการใช้งานเมื่อ 2026-03-09 โปรดใช้ `google/gemini-3.1-pro-preview` แทน การเรียกใช้การตั้งค่าคีย์ Gemini API อีกครั้ง (`openclaw onboard --auth-choice gemini-api-key` หรือ `openclaw models auth login --provider google`) จะเขียนค่าเริ่มต้นที่กำหนดค่าไว้แต่ล้าสมัยใหม่ให้เป็นโมเดลปัจจุบัน
</Note>

## ความสามารถ

| ความสามารถ             | รองรับ                         |
| ---------------------- | ----------------------------- |
| การเติมข้อความแชตให้สมบูรณ์ | ใช่                           |
| การสร้างรูปภาพ          | ใช่                           |
| การสร้างเพลง            | ใช่                           |
| การแปลงข้อความเป็นเสียงพูด | ใช่                           |
| เสียงแบบเรียลไทม์       | ใช่ (Google Live API)         |
| การทำความเข้าใจรูปภาพ   | ใช่                           |
| การถอดเสียง             | ใช่                           |
| การทำความเข้าใจวิดีโอ   | ใช่                           |
| การค้นหาเว็บ (Grounding) | ใช่                           |
| การคิด/การให้เหตุผล     | ใช่ (Gemini 2.5+ / Gemini 3+) |
| โมเดล Gemma 4           | ใช่                           |

## การค้นหาเว็บ

ผู้ให้บริการค้นหาเว็บ `gemini` ที่รวมมาด้วยใช้การทำ Grounding ของ Google Search ผ่าน Gemini
กำหนดค่าคีย์สำหรับการค้นหาโดยเฉพาะภายใต้ `plugins.entries.google.config.webSearch`
หรือให้ใช้ `models.providers.google.apiKey` ซ้ำหลังจาก `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // ไม่จำเป็นหากตั้งค่า GEMINI_API_KEY หรือ models.providers.google.apiKey แล้ว
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // หากไม่มีจะใช้ models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

ลำดับความสำคัญของข้อมูลประจำตัวคือ `webSearch.apiKey` โดยเฉพาะ ตามด้วย `GEMINI_API_KEY`
และ `models.providers.google.apiKey` ส่วน `webSearch.baseUrl` เป็นตัวเลือกและ
มีไว้สำหรับพร็อกซีของผู้ดำเนินการหรือปลายทาง Gemini API ที่เข้ากันได้ เมื่อไม่ระบุ
การค้นหาเว็บของ Gemini จะใช้ `models.providers.google.baseUrl` ซ้ำ ดูพฤติกรรมเครื่องมือเฉพาะผู้ให้บริการได้ที่
[การค้นหาด้วย Gemini](/th/tools/gemini-search)

<Tip>
โมเดล Gemini 3 ใช้ `thinkingLevel` แทน `thinkingBudget` OpenClaw จะแมป
การควบคุมการให้เหตุผลของ Gemini 3, Gemini 3.1 และนามแฝง `gemini-*-latest` ไปยัง
`thinkingLevel` เพื่อให้การทำงานแบบเริ่มต้น/เวลาแฝงต่ำไม่ส่งค่า
`thinkingBudget` ที่ปิดใช้งาน

`/think adaptive` จะคงความหมายของการคิดแบบไดนามิกของ Google แทนการเลือกระดับ
OpenClaw แบบตายตัว Gemini 3 และ Gemini 3.1 จะไม่ระบุ `thinkingLevel` แบบตายตัว เพื่อให้
Google เลือกระดับได้ ส่วน Gemini 2.5 จะส่งค่าเซนทิเนลแบบไดนามิกของ Google
`thinkingBudget: -1`

โมเดล Gemma 4 (เช่น `gemma-4-26b-a4b-it`) รองรับโหมดการคิด OpenClaw
จะแปลง `thinkingBudget` เป็น `thinkingLevel` ของ Google ที่รองรับสำหรับ Gemma 4
การตั้งค่าการคิดเป็น `off` จะคงการปิดใช้งานการคิดไว้ แทนที่จะแมปเป็น
`MINIMAL`

Gemini 2.5 Pro ทำงานได้เฉพาะในโหมดการคิดและจะปฏิเสธ
`thinkingBudget: 0` ที่ระบุอย่างชัดเจน OpenClaw จะตัดค่านั้นออกจากคำขอ Gemini 2.5 Pro
แทนที่จะส่งไป
</Tip>

## การสร้างรูปภาพ

ผู้ให้บริการสร้างรูปภาพ `google` ที่รวมมาด้วยใช้
`google/gemini-3.1-flash-image-preview` เป็นค่าเริ่มต้น

- รองรับ `google/gemini-3-pro-image-preview` ด้วย
- การสร้าง: สูงสุด 4 รูปภาพต่อคำขอ
- โหมดแก้ไข: เปิดใช้งาน รองรับรูปภาพอินพุตสูงสุด 5 รูป
- การควบคุมเรขาคณิต: `size`, `aspectRatio` และ `resolution`

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
ดูพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรมการสลับระบบเมื่อขัดข้องได้ที่ [การสร้างรูปภาพ](/th/tools/image-generation)
</Note>

## การสร้างวิดีโอ

ปลั๊กอิน `google` ที่รวมมาด้วยยังลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือ
`video_generate` ที่ใช้ร่วมกัน

- โมเดลวิดีโอเริ่มต้น: `google/veo-3.1-fast-generate-preview`
- โหมด: ข้อความเป็นวิดีโอ รูปภาพเป็นวิดีโอ และโฟลว์การอ้างอิงวิดีโอรายการเดียว
- รองรับ `aspectRatio` (`16:9`, `9:16`) และ `resolution` (`720P`, `1080P`) ปัจจุบัน Veo ไม่รองรับเอาต์พุตเสียง
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
ดูพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรมการสลับระบบเมื่อขัดข้องได้ที่ [การสร้างวิดีโอ](/th/tools/video-generation)
</Note>

## การสร้างเพลง

ปลั๊กอิน `google` ที่รวมมาด้วยยังลงทะเบียนการสร้างเพลงผ่านเครื่องมือ
`music_generate` ที่ใช้ร่วมกัน

- โมเดลเพลงเริ่มต้น: `google/lyria-3-clip-preview`
- รองรับ `google/lyria-3-pro-preview` ด้วย
- การควบคุมพรอมต์: `lyrics` และ `instrumental`
- รูปแบบเอาต์พุต: ค่าเริ่มต้นคือ `mp3` และมี `wav` บน `google/lyria-3-pro-preview`
- อินพุตอ้างอิง: สูงสุด 10 รูปภาพ
- การทำงานที่มีเซสชันรองรับจะแยกไปดำเนินการผ่านโฟลว์งาน/สถานะที่ใช้ร่วมกัน รวมถึง `action: "status"`

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
ดูพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรมการสลับระบบเมื่อขัดข้องได้ที่ [การสร้างเพลง](/th/tools/music-generation)
</Note>

## การแปลงข้อความเป็นเสียงพูด

ผู้ให้บริการเสียงพูด `google` ที่รวมมาด้วยใช้เส้นทาง TTS ของ Gemini API กับ
`gemini-3.1-flash-tts-preview`

- เสียงเริ่มต้น: `Kore`
- การตรวจสอบสิทธิ์: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`
- เอาต์พุต: WAV สำหรับไฟล์แนบ TTS ปกติ, Opus สำหรับปลายทางบันทึกเสียง และ PCM สำหรับ Talk/โทรศัพท์
- เอาต์พุตบันทึกเสียง: PCM ของ Google จะถูกห่อเป็น WAV และแปลงเป็น Opus 48 kHz ด้วย `ffmpeg`

เส้นทาง Gemini TTS แบบแบตช์ของ Google จะส่งคืนเสียงที่สร้างขึ้นในคำตอบ
`generateContent` ที่เสร็จสมบูรณ์ สำหรับการสนทนาด้วยเสียงที่มีเวลาแฝงต่ำที่สุด ให้ใช้
ผู้ให้บริการเสียงแบบเรียลไทม์ของ Google ซึ่งทำงานด้วย Gemini Live API แทน TTS
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
          audioProfile: "พูดอย่างเป็นมืออาชีพด้วยน้ำเสียงสงบ",
        },
      },
    },
  },
}
```

Gemini API TTS ใช้พรอมต์ภาษาธรรมชาติสำหรับควบคุมรูปแบบ ตั้งค่า
`audioProfile` เพื่อเติมพรอมต์รูปแบบที่ใช้ซ้ำได้ไว้หน้าข้อความที่จะพูด ตั้งค่า
`speakerName` เมื่อข้อความพรอมต์อ้างถึงผู้พูดที่มีชื่อ

Gemini API TTS ยังรองรับแท็กเสียงเชิงอารมณ์ในวงเล็บเหลี่ยมภายในข้อความ
เช่น `[whispers]` หรือ `[laughs]` หากต้องการไม่ให้แท็กปรากฏในคำตอบแชตที่มองเห็น
แต่ยังคงส่งไปยัง TTS ให้ใส่ไว้ภายในบล็อก `[[tts:text]]...[[/tts:text]]`:

```text
นี่คือข้อความตอบกลับที่ไม่มีแท็ก

[[tts:text]][whispers] นี่คือเวอร์ชันเสียงพูด[[/tts:text]]
```

<Note>
คีย์ API ของ Google Cloud Console ที่จำกัดไว้สำหรับ Gemini API สามารถใช้กับ
ผู้ให้บริการนี้ได้ นี่ไม่ใช่เส้นทาง Cloud Text-to-Speech API ที่แยกต่างหาก
</Note>

## เสียงแบบเรียลไทม์

ปลั๊กอิน `google` ที่รวมมาด้วยจะลงทะเบียนผู้ให้บริการเสียงแบบเรียลไทม์ซึ่งทำงานด้วย
Gemini Live API สำหรับบริดจ์เสียงแบ็กเอนด์ เช่น Voice Call และ Google Meet

| การตั้งค่า               | พาธการกำหนดค่า                                                         | ค่าเริ่มต้น                                                                               |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| โมเดล                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                       |
| เสียง                 | `...google.voice`                                                   | `Kore`                                                                                |
| อุณหภูมิ           | `...google.temperature`                                             | (ไม่ได้ตั้งค่า)                                                                               |
| ความไวในการเริ่ม VAD | `...google.startSensitivity`                                        | (ไม่ได้ตั้งค่า)                                                                               |
| ความไวในการสิ้นสุด VAD   | `...google.endSensitivity`                                          | (ไม่ได้ตั้งค่า)                                                                               |
| ระยะเวลาความเงียบ      | `...google.silenceDurationMs`                                       | (ไม่ได้ตั้งค่า)                                                                               |
| การจัดการกิจกรรม     | `...google.activityHandling`                                        | ค่าเริ่มต้นของ Google, `start-of-activity-interrupts`                                        |
| ความครอบคลุมของเทิร์น         | `...google.turnCoverage`                                            | ค่าเริ่มต้นของ Google, `audio-activity-and-all-video`                                        |
| ปิดใช้ VAD อัตโนมัติ      | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| การดำเนินเซสชันต่อ    | `...google.sessionResumption`                                       | `true`                                                                                |
| การบีบอัดบริบท   | `...google.contextWindowCompression`                                | `true`                                                                                |
| คีย์ API               | `...google.apiKey`                                                  | ใช้ `models.providers.google.apiKey`, `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` เป็นทางเลือกสำรอง |

ตัวอย่างการกำหนดค่าเรียลไทม์สำหรับการโทรด้วยเสียง:

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
คงการเรียกใช้เครื่องมือไว้ในสัญญาเสียงเรียลไทม์ที่ใช้ร่วมกัน ปล่อย `temperature`
ไว้โดยไม่ตั้งค่า เว้นแต่ต้องการเปลี่ยนแปลงการสุ่มตัวอย่าง OpenClaw จะละเว้นค่าที่ไม่เป็นบวก
เนื่องจาก Google Live อาจส่งคืนข้อความถอดเสียงโดยไม่มีเสียงสำหรับ `temperature: 0`
การถอดเสียงของ Gemini API เปิดใช้งานโดยไม่ต้องใช้ `languageCodes`; SDK ของ Google
เวอร์ชันปัจจุบันปฏิเสธคำใบ้รหัสภาษาบนพาธ API นี้
</Note>

<Note>
Gemini 3.1 Live รับข้อความสนทนาผ่านอินพุตแบบเรียลไทม์และใช้
การเรียกใช้ฟังก์ชันตามลำดับ OpenClaw ละเว้น `NON_BLOCKING` รุ่นเก่า การกำหนดเวลา
การตอบกลับของฟังก์ชัน และฟิลด์บทสนทนาเชิงอารมณ์สำหรับโมเดลนี้ ควรใช้
`thinkingLevel`; ค่า `thinkingBudget` เชิงบวกที่กำหนดไว้จะถูกจับคู่กับ
ระดับที่รองรับซึ่งใกล้ที่สุด ขณะที่ `-1` จะคงค่าเริ่มต้นของ Google ไว้ ดู
[การเปรียบเทียบความสามารถของ Gemini Live](https://ai.google.dev/gemini-api/docs/live-api/capabilities)
</Note>

<Note>
Talk ของ Control UI รองรับเซสชัน Google Live ในเบราว์เซอร์ด้วยโทเค็นแบบใช้ครั้งเดียว
ที่มีข้อจำกัด ผู้ให้บริการเสียงเรียลไทม์ที่ทำงานเฉพาะแบ็กเอนด์ยังสามารถทำงานผ่าน
การขนส่งรีเลย์ทั่วไปของ Gateway ซึ่งเก็บข้อมูลประจำตัวของผู้ให้บริการไว้บน Gateway
</Note>

สำหรับการตรวจสอบแบบสดโดยผู้ดูแล ให้เรียกใช้
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
การทดสอบเบื้องต้นยังครอบคลุมพาธแบ็กเอนด์/WebRTC ของ OpenAI โดยส่วนของ Google จะสร้าง
โทเค็น Live API แบบมีข้อจำกัดรูปแบบเดียวกับที่ Talk ของ Control UI ใช้ เปิดปลายทาง
WebSocket ของเบราว์เซอร์ ส่งเพย์โหลดการตั้งค่าเริ่มต้น และรอ
`setupComplete`

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การใช้แคช Gemini โดยตรงซ้ำ">
    สำหรับการเรียกใช้ Gemini API โดยตรง (`api: "google-generative-ai"`) OpenClaw
    จะส่งแฮนเดิล `cachedContent` ที่กำหนดค่าไว้ไปยังคำขอ Gemini

    - กำหนดค่าพารามิเตอร์สำหรับแต่ละโมเดลหรือส่วนกลางด้วย
      `cachedContent` หรือ `cached_content` แบบเดิม
    - พารามิเตอร์จากขอบเขตที่เฉพาะเจาะจงกว่า (ระดับโมเดลเหนือกว่าส่วนกลาง) จะมีผลเหนือกว่าเสมอ
      ภายในขอบเขตเดียวกัน หากตั้งค่าทั้งสองคีย์ `cached_content` จะมีผลเหนือกว่า
      ใช้เพียงหนึ่งคีย์ต่อขอบเขตเพื่อหลีกเลี่ยงผลลัพธ์ที่ไม่คาดคิด
    - ค่าตัวอย่าง: `cachedContents/prebuilt-context`
    - การใช้งานจากแคชที่ตรงกันของ Gemini จะถูกปรับให้เป็น `cacheRead` ของ OpenClaw จาก
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

  <Accordion title="หมายเหตุการใช้งาน Gemini CLI">
    เมื่อใช้ผู้ให้บริการ OAuth `google-gemini-cli` OpenClaw จะใช้เอาต์พุต
    `stream-json` ของ Gemini CLI เป็นค่าเริ่มต้น และปรับการใช้งานจากเพย์โหลด
    `stats` สุดท้าย การแทนที่ด้วย `--output-format json` แบบเดิมยังคงใช้
    ตัวแยกวิเคราะห์ JSON

    - ข้อความตอบกลับแบบสตรีมมาจากเหตุการณ์ `message` ของผู้ช่วย
    - สำหรับเอาต์พุต JSON แบบเดิม ข้อความตอบกลับมาจากฟิลด์ `response` ใน JSON ของ CLI
    - การใช้งานจะใช้ `stats` เป็นทางเลือกสำรองเมื่อ CLI ปล่อย `usage` ว่างไว้
    - `stats.cached` จะถูกปรับให้เป็น `cacheRead` ของ OpenClaw
    - หากไม่มี `stats.input` OpenClaw จะคำนวณโทเค็นอินพุตจาก
      `stats.input_tokens - stats.cached`

  </Accordion>

  <Accordion title="การตั้งค่าสภาพแวดล้อมและดีมอน">
    หาก Gateway ทำงานเป็นดีมอน (launchd/systemd) ตรวจสอบให้แน่ใจว่า `GEMINI_API_KEY`
    พร้อมใช้งานสำหรับโปรเซสนั้น (เช่น ใน `~/.openclaw/.env` หรือผ่าน
    `env.shellEnv`)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อเกิดการสลับไปใช้ระบบสำรอง
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
