---
read_when:
    - คุณต้องการใช้โมเดล Grok ใน OpenClaw
    - คุณกำลังกำหนดค่า auth หรือ model id ของ xAI
summary: ใช้โมเดล xAI Grok ใน OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-26T11:40:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 420f60d5e80964b926e50cf74cf414d11de1c30d3a4aa8917f1861e0d56ef5b9
    source_path: providers/xai.md
    workflow: 15
---

OpenClaw มาพร้อม Plugin provider ชื่อ `xai` สำหรับโมเดล Grok

## เริ่มต้นใช้งาน

<Steps>
  <Step title="สร้าง API key">
    สร้าง API key ใน [xAI console](https://console.x.ai/)
  </Step>
  <Step title="ตั้งค่า API key ของคุณ">
    ตั้งค่า `XAI_API_KEY` หรือรัน:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="เลือกโมเดล">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw ใช้ xAI Responses API เป็นการขนส่ง xAI แบบ bundled การใช้
`XAI_API_KEY` เดียวกันยังใช้กับ `web_search` ที่ขับเคลื่อนด้วย Grok, `x_search`
แบบ first-class และ `code_execution` ระยะไกลได้ด้วย
หากคุณเก็บ xAI key ไว้ใน `plugins.entries.xai.config.webSearch.apiKey`,
provider โมเดล xAI แบบ bundled จะนำ key นั้นมาใช้ซ้ำเป็น fallback ด้วย
การปรับแต่ง `code_execution` อยู่ภายใต้ `plugins.entries.xai.config.codeExecution`
</Note>

## แค็ตตาล็อกที่มาพร้อมในชุด

OpenClaw มีตระกูลโมเดล xAI ต่อไปนี้ในตัว:

| ตระกูล         | model id                                                                 |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Plugin นี้ยัง forward-resolve model id `grok-4*` และ `grok-code-fast*` ที่ใหม่กว่าเมื่อ
พวกมันใช้รูปแบบ API แบบเดียวกัน

<Tip>
`grok-4-fast`, `grok-4-1-fast` และตัวแปร `grok-4.20-beta-*` คือ
ref ของ Grok ที่รองรับรูปภาพในแค็ตตาล็อกแบบ bundled ปัจจุบัน
</Tip>

## การรองรับฟีเจอร์ของ OpenClaw

Plugin แบบ bundled จะจับคู่พื้นผิว API สาธารณะปัจจุบันของ xAI เข้ากับ
contract ของ provider และ tool แบบใช้ร่วมกันของ OpenClaw ความสามารถที่ไม่สอดคล้องกับ contract ที่ใช้ร่วมกัน
(เช่น streaming TTS และ realtime voice) จะไม่ถูกเปิดเผย — ดูตาราง
ด้านล่าง

| ความสามารถของ xAI         | พื้นผิวของ OpenClaw                     | สถานะ                                                              |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | provider โมเดล `xai/<model>`           | ใช่                                                                 |
| Server-side web search     | provider `grok` ของ `web_search`       | ใช่                                                                 |
| Server-side X search       | tool `x_search`                         | ใช่                                                                 |
| Server-side code execution | tool `code_execution`                   | ใช่                                                                 |
| Images                     | `image_generate`                        | ใช่                                                                 |
| Videos                     | `video_generate`                        | ใช่                                                                 |
| Batch text-to-speech       | `messages.tts.provider: "xai"` / `tts`  | ใช่                                                                 |
| Streaming TTS              | —                                       | ไม่ถูกเปิดเผย; contract ของ TTS ใน OpenClaw คืนค่าเป็นบัฟเฟอร์เสียงที่สมบูรณ์ |
| Batch speech-to-text       | `tools.media.audio` / media understanding | ใช่                                                               |
| Streaming speech-to-text   | Voice Call `streaming.provider: "xai"`  | ใช่                                                                 |
| Realtime voice             | —                                       | ยังไม่ถูกเปิดเผย; มี contract ของ session/WebSocket ที่ต่างออกไป   |
| Files / batches            | ความเข้ากันได้ของ Generic model API เท่านั้น | ไม่ใช่ tool แบบ first-class ของ OpenClaw                         |

<Note>
OpenClaw ใช้ REST API ของ xAI สำหรับ image/video/TTS/STT ในการสร้างสื่อ,
เสียงพูด และ batch transcription, ใช้ WebSocket STT แบบสตรีมของ xAI สำหรับ
การถอดเสียง voice-call แบบ live และใช้ Responses API สำหรับเครื่องมือ model, search และ
code-execution ฟีเจอร์ที่ต้องใช้ contract ของ OpenClaw ที่ต่างออกไป เช่น
session แบบ Realtime voice จะถูกบันทึกไว้ที่นี่ในฐานะความสามารถของ upstream แทนที่จะเป็นพฤติกรรม Plugin แบบซ่อน
</Note>

### การแมปโหมด Fast

`/fast on` หรือ `agents.defaults.models["xai/<model>"].params.fastMode: true`
จะเขียน native xAI request ใหม่ดังนี้:

| โมเดลต้นทาง   | เป้าหมายในโหมด Fast |
| ------------- | ------------------- |
| `grok-3`      | `grok-3-fast`       |
| `grok-3-mini` | `grok-3-mini-fast`  |
| `grok-4`      | `grok-4-fast`       |
| `grok-4-0709` | `grok-4-fast`       |

### alias เพื่อความเข้ากันได้แบบเก่า

alias แบบเก่ายังคง normalize ไปเป็น id แบบ canonical ที่ bundled มา:

| alias แบบเก่า            | canonical id                          |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## ฟีเจอร์

<AccordionGroup>
  <Accordion title="Web search">
    provider `grok` สำหรับ web-search แบบ bundled ใช้ `XAI_API_KEY` เช่นกัน:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="การสร้างวิดีโอ">
    Plugin `xai` แบบ bundled ลงทะเบียนการสร้างวิดีโอผ่าน
    tool `video_generate` แบบใช้ร่วมกัน

    - โมเดลวิดีโอเริ่มต้น: `xai/grok-imagine-video`
    - โหมด: text-to-video, image-to-video, การสร้างจากภาพอ้างอิง, การแก้ไข
      วิดีโอระยะไกล และการขยายวิดีโอระยะไกล
    - อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - ความละเอียด: `480P`, `720P`
    - ระยะเวลา: 1-15 วินาทีสำหรับ generation/image-to-video, 1-10 วินาทีเมื่อ
      ใช้บทบาท `reference_image`, 2-10 วินาทีสำหรับการขยาย
    - การสร้างจากภาพอ้างอิง: ตั้ง `imageRoles` เป็น `reference_image` สำหรับ
      ทุกรูปที่ส่งมา; xAI รองรับรูปประเภทนี้ได้สูงสุด 7 รูป

    <Warning>
    ไม่รองรับ local video buffer ให้ใช้ URL `http(s)` ระยะไกลสำหรับ
    อินพุตของ video edit/extend ส่วน image-to-video รองรับ local image buffer ได้ เพราะ
    OpenClaw สามารถ encode สิ่งเหล่านั้นเป็น data URL สำหรับ xAI ได้
    </Warning>

    หากต้องการใช้ xAI เป็น provider วิดีโอค่าเริ่มต้น:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์ของ tool แบบใช้ร่วมกัน
    การเลือก provider และพฤติกรรม failover
    </Note>

  </Accordion>

  <Accordion title="การสร้างภาพ">
    Plugin `xai` แบบ bundled ลงทะเบียนการสร้างภาพผ่าน
    tool `image_generate` แบบใช้ร่วมกัน

    - โมเดลภาพเริ่มต้น: `xai/grok-imagine-image`
    - โมเดลเพิ่มเติม: `xai/grok-imagine-image-pro`
    - โหมด: text-to-image และการแก้ไขจากภาพอ้างอิง
    - อินพุตอ้างอิง: `image` หนึ่งรายการ หรือ `images` ได้สูงสุดห้ารายการ
    - อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - ความละเอียด: `1K`, `2K`
    - จำนวน: สูงสุด 4 ภาพ

    OpenClaw ขอให้ xAI ส่งผลลัพธ์ภาพแบบ `b64_json` เพื่อให้สื่อที่สร้างขึ้น
    สามารถจัดเก็บและส่งผ่านเส้นทางไฟล์แนบของ channel ตามปกติได้
    ภาพอ้างอิงในเครื่องจะถูกแปลงเป็น data URL; ส่วนภาพอ้างอิงระยะไกลแบบ `http(s)` จะ
    ถูกส่งผ่านตรงไป

    หากต้องการใช้ xAI เป็น provider ภาพค่าเริ่มต้น:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI ยังมีเอกสารสำหรับ `quality`, `mask`, `user` และอัตราส่วนแบบ native
    เพิ่มเติม เช่น `1:2`, `2:1`, `9:20` และ `20:9` ปัจจุบัน OpenClaw ส่งต่อเฉพาะ
    ตัวควบคุมภาพแบบใช้ร่วมกันข้าม provider เท่านั้น ปุ่มควบคุมที่รองรับเฉพาะ native
    และยังไม่รองรับถูกตั้งใจไม่เปิดเผยผ่าน `image_generate`
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Plugin `xai` แบบ bundled ลงทะเบียน text-to-speech ผ่านพื้นผิว provider
    แบบใช้ร่วมกันของ `tts`

    - เสียง: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - เสียงเริ่มต้น: `eve`
    - รูปแบบ: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - ภาษา: รหัส BCP-47 หรือ `auto`
    - ความเร็ว: ค่าควบคุมความเร็วแบบ native ของ provider
    - ไม่รองรับรูปแบบ native Opus voice-note

    หากต้องการใช้ xAI เป็น provider TTS ค่าเริ่มต้น:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw ใช้ endpoint แบบ batch `/v1/tts` ของ xAI xAI ยังมี streaming TTS
    ผ่าน WebSocket ด้วย แต่ปัจจุบัน contract ของ speech provider ใน OpenClaw คาดหวัง
    audio buffer ที่สมบูรณ์ก่อนส่งการตอบกลับ
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Plugin `xai` แบบ bundled ลงทะเบียน batch speech-to-text ผ่านพื้นผิว transcription
    สำหรับ media-understanding ของ OpenClaw

    - โมเดลเริ่มต้น: `grok-stt`
    - Endpoint: xAI REST `/v1/stt`
    - เส้นทางอินพุต: อัปโหลดไฟล์เสียงแบบ multipart
    - OpenClaw รองรับสิ่งนี้ทุกที่ที่การถอดเสียงขาเข้าใช้
      `tools.media.audio` รวมถึงช่วงเสียงใน Discord voice-channel และ
      ไฟล์แนบเสียงของ channel

    หากต้องการบังคับใช้ xAI สำหรับการถอดเสียงขาเข้า:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    สามารถส่งภาษาได้ผ่านคอนฟิกสื่อเสียงแบบใช้ร่วมกัน หรือผ่านคำขอถอดเสียงต่อการเรียกใช้
    คำใบ้ของ prompt ได้รับการยอมรับโดยพื้นผิว OpenClaw แบบใช้ร่วมกัน
    แต่การเชื่อมต่อ xAI REST STT จะส่งต่อเฉพาะ file, model และ
    language เพราะสิ่งเหล่านี้จับคู่กับ endpoint สาธารณะปัจจุบันของ xAI ได้อย่างชัดเจน

  </Accordion>

  <Accordion title="Streaming speech-to-text">
    Plugin `xai` แบบ bundled ยังลงทะเบียน realtime transcription provider
    สำหรับเสียงของ voice-call แบบ live ด้วย

    - Endpoint: xAI WebSocket `wss://api.x.ai/v1/stt`
    - encoding เริ่มต้น: `mulaw`
    - sample rate เริ่มต้น: `8000`
    - endpointing เริ่มต้น: `800ms`
    - interim transcript: เปิดใช้งานเป็นค่าเริ่มต้น

    สตรีมสื่อของ Twilio ใน Voice Call ส่งเฟรมเสียง G.711 µ-law ดังนั้น
    provider ของ xAI จึงสามารถส่งต่อเฟรมเหล่านั้นได้โดยตรงโดยไม่ต้องแปลงรหัส:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    คอนฟิกที่ provider เป็นเจ้าของอยู่ภายใต้
    `plugins.entries.voice-call.config.streaming.providers.xai`
    คีย์ที่รองรับคือ `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` หรือ
    `alaw`), `interimResults`, `endpointingMs` และ `language`

    <Note>
    provider แบบสตรีมนี้ใช้สำหรับเส้นทาง realtime transcription ของ Voice Call
    ส่วน Discord voice ปัจจุบันยังบันทึกเป็นช่วงสั้น ๆ และใช้เส้นทาง batch
    transcription ของ `tools.media.audio` แทน
    </Note>

  </Accordion>

  <Accordion title="การตั้งค่า x_search">
    Plugin xAI แบบ bundled เปิดเผย `x_search` เป็นเครื่องมือของ OpenClaw สำหรับค้นหา
    เนื้อหาบน X (เดิมคือ Twitter) ผ่าน Grok

    path ของคอนฟิก: `plugins.entries.xai.config.xSearch`

    | คีย์               | ประเภท  | ค่าเริ่มต้น       | คำอธิบาย                            |
    | ------------------ | ------- | ----------------- | ----------------------------------- |
    | `enabled`          | boolean | —                 | เปิดหรือปิด x_search                |
    | `model`            | string  | `grok-4-1-fast`   | โมเดลที่ใช้สำหรับคำขอ x_search      |
    | `inlineCitations`  | boolean | —                 | ใส่ citation แบบ inline ในผลลัพธ์   |
    | `maxTurns`         | number  | —                 | จำนวนรอบการสนทนาสูงสุด              |
    | `timeoutSeconds`   | number  | —                 | เวลาหมดอายุของคำขอเป็นวินาที        |
    | `cacheTtlMinutes`  | number  | —                 | เวลาอยู่ของแคชเป็นนาที              |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="การตั้งค่า Code execution">
    Plugin xAI แบบ bundled เปิดเผย `code_execution` เป็นเครื่องมือของ OpenClaw สำหรับ
    การรันโค้ดระยะไกลในสภาพแวดล้อม sandbox ของ xAI

    path ของคอนฟิก: `plugins.entries.xai.config.codeExecution`

    | คีย์              | ประเภท  | ค่าเริ่มต้น                 | คำอธิบาย                                 |
    | ----------------- | ------- | --------------------------- | ---------------------------------------- |
    | `enabled`         | boolean | `true` (หากมี key พร้อมใช้) | เปิดหรือปิด code execution               |
    | `model`           | string  | `grok-4-1-fast`             | โมเดลที่ใช้สำหรับคำขอ code execution     |
    | `maxTurns`        | number  | —                           | จำนวนรอบการสนทนาสูงสุด                   |
    | `timeoutSeconds`  | number  | —                           | เวลาหมดอายุของคำขอเป็นวินาที             |

    <Note>
    นี่คือการรัน sandbox ระยะไกลของ xAI ไม่ใช่ [`exec`](/th/tools/exec) ในเครื่อง
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="ข้อจำกัดที่ทราบแล้ว">
    - ปัจจุบัน auth รองรับเฉพาะ API key เท่านั้น ยังไม่มี xAI OAuth หรือ device-code flow
      ใน OpenClaw
    - ไม่รองรับ `grok-4.20-multi-agent-experimental-beta-0304` บน
      เส้นทาง xAI provider ปกติ เพราะต้องใช้พื้นผิว API ของ upstream
      ที่แตกต่างจาก xAI transport มาตรฐานของ OpenClaw
    - xAI Realtime voice ยังไม่ได้ลงทะเบียนเป็น provider ของ OpenClaw โดยตรง
      เพราะต้องใช้ contract ของเซสชันเสียงแบบสองทิศทางที่ต่างจาก batch STT หรือ
      streaming transcription
    - `quality` ของภาพ, `mask` ของภาพ และอัตราส่วนแบบ native-only เพิ่มเติมของ xAI
      จะยังไม่ถูกเปิดเผยจนกว่า tool `image_generate` แบบใช้ร่วมกันจะมี
      ตัวควบคุมข้าม provider ที่สอดคล้องกัน
  </Accordion>

  <Accordion title="หมายเหตุขั้นสูง">
    - OpenClaw ใช้การแก้ไขความเข้ากันได้เฉพาะของ xAI สำหรับ tool-schema และ tool-call
      โดยอัตโนมัติบนเส้นทาง runner แบบใช้ร่วมกัน
    - native xAI request ใช้ค่าเริ่มต้น `tool_stream: true` ให้ตั้ง
      `agents.defaults.models["xai/<model>"].params.tool_stream` เป็น `false` เพื่อ
      ปิดใช้งาน
    - xAI wrapper ที่ bundled จะตัดแฟล็ก strict tool-schema และ
      reasoning payload key ที่ไม่รองรับออกก่อนส่ง native xAI request
    - `web_search`, `x_search` และ `code_execution` ถูกเปิดเผยเป็นเครื่องมือของ OpenClaw
      OpenClaw จะเปิดใช้เครื่องมือ built-in เฉพาะของ xAI ที่ต้องใช้ในแต่ละคำขอของ tool
      แทนที่จะผูก native tool ทั้งหมดเข้ากับทุกเทิร์นแชต
    - `x_search` และ `code_execution` เป็นของ Plugin xAI แบบ bundled
      ไม่ได้ฝังแบบ hardcoded อยู่ใน core model runtime
    - `code_execution` คือการรัน sandbox ระยะไกลของ xAI ไม่ใช่
      [`exec`](/th/tools/exec) ในเครื่อง
  </Accordion>
</AccordionGroup>

## การทดสอบแบบ Live

เส้นทางสื่อของ xAI ถูกครอบคลุมด้วย unit test และชุดทดสอบ live แบบเลือกใช้ คำสั่ง live
จะโหลด secret จาก login shell ของคุณ รวมถึง `~/.profile` ก่อนตรวจสอบ `XAI_API_KEY`

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

ไฟล์ live เฉพาะ provider จะสังเคราะห์ TTS ปกติ, PCM TTS ที่เหมาะกับระบบโทรศัพท์,
ถอดเสียงผ่าน xAI batch STT, สตรีม PCM เดียวกันผ่าน xAI realtime STT,
สร้างผลลัพธ์แบบ text-to-image และแก้ไขภาพอ้างอิง ส่วนไฟล์ image live แบบใช้ร่วมกัน
จะตรวจสอบ provider xAI เดียวกันผ่านการเลือก runtime, fallback, normalization และ
เส้นทาง media attachment ของ OpenClaw

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของเครื่องมือวิดีโอแบบใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="provider ทั้งหมด" href="/th/providers/index" icon="grid-2">
    ภาพรวม provider ที่กว้างขึ้น
  </Card>
  <Card title="การแก้ปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและวิธีแก้
  </Card>
</CardGroup>
