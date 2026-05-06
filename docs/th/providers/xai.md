---
read_when:
    - คุณต้องการใช้โมเดล Grok ใน OpenClaw
    - คุณกำลังกำหนดค่าการยืนยันตัวตนของ xAI หรือรหัสโมเดล
summary: ใช้โมเดล xAI Grok ใน OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-06T09:29:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0e682ba31829faeeb992818aa6a36ab4d18b79723009c5f37559c28160af499
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw มาพร้อมกับ Plugin ผู้ให้บริการ `xai` แบบ bundled สำหรับโมเดล Grok

## เริ่มต้นใช้งาน

<Steps>
  <Step title="สร้าง API key">
    สร้าง API key ใน [คอนโซล xAI](https://console.x.ai/)
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
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw ใช้ xAI Responses API เป็นการขนส่ง xAI แบบ bundled โดย `XAI_API_KEY`
เดียวกันยังสามารถใช้กับ `web_search` ที่ทำงานด้วย Grok, `x_search` แบบ
first-class และ `code_execution` ระยะไกลได้ด้วย
หากคุณเก็บคีย์ xAI ไว้ใต้ `plugins.entries.xai.config.webSearch.apiKey`
ผู้ให้บริการโมเดล xAI แบบ bundled จะนำคีย์นั้นกลับมาใช้เป็น fallback ด้วย
ตั้งค่า `plugins.entries.xai.config.webSearch.baseUrl` เพื่อกำหนดเส้นทาง
Grok `web_search` และโดยค่าเริ่มต้น `x_search` ผ่านพร็อกซี xAI Responses ของผู้ปฏิบัติการ
การปรับแต่ง `code_execution` อยู่ใต้ `plugins.entries.xai.config.codeExecution`
</Note>

## แค็ตตาล็อกในตัว

OpenClaw รวมตระกูลโมเดล xAI เหล่านี้มาให้ตั้งแต่ต้น:

| ตระกูล         | รหัสโมเดล                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Plugin ยัง resolve ไปข้างหน้าให้กับรหัส `grok-4*` และ `grok-code-fast*` ที่ใหม่กว่าเมื่อรหัสเหล่านั้น
ใช้รูปแบบ API เดียวกัน

<Tip>
`grok-4.3`, `grok-4-fast`, `grok-4-1-fast` และ variants `grok-4.20-beta-*`
คือ refs ของ Grok ที่รองรับรูปภาพในปัจจุบันภายในแค็ตตาล็อกแบบ bundled
</Tip>

## การครอบคลุมฟีเจอร์ของ OpenClaw

Plugin แบบ bundled จับคู่พื้นผิว API สาธารณะปัจจุบันของ xAI เข้ากับสัญญา
ผู้ให้บริการและเครื่องมือร่วมของ OpenClaw ความสามารถที่ไม่เข้ากับสัญญาร่วม
เช่น TTS แบบสตรีมมิงและเสียงแบบเรียลไทม์ จะไม่ถูกเปิดให้ใช้ - ดูตาราง
ด้านล่าง

| ความสามารถของ xAI             | พื้นผิว OpenClaw                          | สถานะ                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| แชต / Responses           | ผู้ให้บริการโมเดล `xai/<model>`              | ใช่                                                                 |
| การค้นหาเว็บฝั่งเซิร์ฟเวอร์     | ผู้ให้บริการ `web_search` `grok`              | ใช่                                                                 |
| การค้นหา X ฝั่งเซิร์ฟเวอร์       | เครื่องมือ `x_search`                           | ใช่                                                                 |
| การประมวลผลโค้ดฝั่งเซิร์ฟเวอร์ | เครื่องมือ `code_execution`                     | ใช่                                                                 |
| รูปภาพ                     | `image_generate`                          | ใช่                                                                 |
| วิดีโอ                     | `video_generate`                          | ใช่                                                                 |
| แปลงข้อความเป็นเสียงแบบแบตช์       | `messages.tts.provider: "xai"` / `tts`    | ใช่                                                                 |
| TTS แบบสตรีมมิง              | -                                         | ไม่เปิดให้ใช้; สัญญา TTS ของ OpenClaw คืนบัฟเฟอร์เสียงที่สมบูรณ์ |
| แปลงเสียงเป็นข้อความแบบแบตช์       | `tools.media.audio` / การทำความเข้าใจสื่อ | ใช่                                                                 |
| แปลงเสียงเป็นข้อความแบบสตรีมมิง   | Voice Call `streaming.provider: "xai"`    | ใช่                                                                 |
| เสียงแบบเรียลไทม์             | -                                         | ยังไม่เปิดให้ใช้; ใช้สัญญาเซสชัน/WebSocket ที่แตกต่างกัน               |
| ไฟล์ / แบตช์            | ความเข้ากันได้กับ API โมเดลทั่วไปเท่านั้น      | ไม่ใช่เครื่องมือ first-class ของ OpenClaw                                     |

<Note>
OpenClaw ใช้ API รูปภาพ/วิดีโอ/TTS/STT แบบ REST ของ xAI สำหรับการสร้างสื่อ
เสียง และการถอดเสียงแบบแบตช์, ใช้ WebSocket STT แบบสตรีมมิงของ xAI สำหรับการถอดเสียง
voice-call สด และใช้ Responses API สำหรับโมเดล เครื่องมือค้นหา และ
code-execution ฟีเจอร์ที่ต้องใช้สัญญา OpenClaw แบบอื่น เช่น
เซสชันเสียงแบบเรียลไทม์ จะถูกบันทึกไว้ที่นี่ในฐานะความสามารถ upstream
ไม่ใช่พฤติกรรม Plugin ที่ซ่อนอยู่
</Note>

### การแมปโหมดเร็ว

`/fast on` หรือ `agents.defaults.models["xai/<model>"].params.fastMode: true`
เขียนคำขอ xAI แบบ native ใหม่ดังนี้:

| โมเดลต้นทาง  | เป้าหมายโหมดเร็ว   |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### alias ความเข้ากันได้แบบเดิม

alias แบบเดิมยังคง normalize ไปยังรหัส bundled ที่เป็น canonical:

| alias แบบเดิม              | รหัส canonical                          |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## ฟีเจอร์

<AccordionGroup>
  <Accordion title="การค้นหาเว็บ">
    ผู้ให้บริการค้นหาเว็บ `grok` แบบ bundled ใช้ `XAI_API_KEY` ด้วย:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="การสร้างวิดีโอ">
    Plugin `xai` แบบ bundled ลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือร่วม
    `video_generate`

    - โมเดลวิดีโอเริ่มต้น: `xai/grok-imagine-video`
    - โหมด: text-to-video, image-to-video, การสร้างด้วย reference-image, การแก้ไขวิดีโอระยะไกล และการขยายวิดีโอระยะไกล
    - อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - ความละเอียด: `480P`, `720P`
    - ระยะเวลา: 1-15 วินาทีสำหรับการสร้าง/image-to-video, 1-10 วินาทีเมื่อ
      ใช้บทบาท `reference_image`, 2-10 วินาทีสำหรับการขยาย
    - การสร้างด้วย reference-image: ตั้งค่า `imageRoles` เป็น `reference_image` สำหรับ
      ทุกภาพที่ส่งให้; xAI ยอมรับภาพประเภทนี้ได้สูงสุด 7 ภาพ

    <Warning>
    ไม่รับบัฟเฟอร์วิดีโอในเครื่อง ใช้ URL `http(s)` ระยะไกลสำหรับ
    อินพุตแก้ไข/ขยายวิดีโอ image-to-video รับบัฟเฟอร์ภาพในเครื่องได้เพราะ
    OpenClaw สามารถเข้ารหัสสิ่งเหล่านั้นเป็น data URL สำหรับ xAI ได้
    </Warning>

    หากต้องการใช้ xAI เป็นผู้ให้บริการวิดีโอเริ่มต้น:

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
    ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือร่วม
    การเลือกผู้ให้บริการ และพฤติกรรม failover
    </Note>

  </Accordion>

  <Accordion title="การสร้างรูปภาพ">
    Plugin `xai` แบบ bundled ลงทะเบียนการสร้างรูปภาพผ่านเครื่องมือร่วม
    `image_generate`

    - โมเดลรูปภาพเริ่มต้น: `xai/grok-imagine-image`
    - โมเดลเพิ่มเติม: `xai/grok-imagine-image-pro`
    - โหมด: text-to-image และการแก้ไข reference-image
    - อินพุตอ้างอิง: `image` หนึ่งรายการหรือ `images` สูงสุดห้ารายการ
    - อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - ความละเอียด: `1K`, `2K`
    - จำนวน: สูงสุด 4 ภาพ

    OpenClaw ขอการตอบกลับรูปภาพแบบ `b64_json` จาก xAI เพื่อให้สื่อที่สร้างขึ้นสามารถ
    ถูกจัดเก็บและส่งผ่านเส้นทางไฟล์แนบของช่องทางปกติได้ ภาพอ้างอิงในเครื่อง
    จะถูกแปลงเป็น data URL; อ้างอิง `http(s)` ระยะไกลจะถูกส่งต่อไปตามเดิม

    หากต้องการใช้ xAI เป็นผู้ให้บริการรูปภาพเริ่มต้น:

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
    xAI ยังบันทึก `quality`, `mask`, `user` และอัตราส่วน native เพิ่มเติม
    เช่น `1:2`, `2:1`, `9:20` และ `20:9` OpenClaw ส่งต่อเฉพาะ
    ตัวควบคุมรูปภาพร่วมข้ามผู้ให้บริการในปัจจุบัน; ปุ่มปรับ native-only ที่ไม่รองรับ
    จะไม่ถูกเปิดให้ใช้ผ่าน `image_generate` โดยตั้งใจ
    </Note>

  </Accordion>

  <Accordion title="แปลงข้อความเป็นเสียง">
    Plugin `xai` แบบ bundled ลงทะเบียนการแปลงข้อความเป็นเสียงผ่านพื้นผิวผู้ให้บริการ `tts`
    ร่วม

    - เสียง: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - เสียงเริ่มต้น: `eve`
    - รูปแบบ: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - ภาษา: รหัส BCP-47 หรือ `auto`
    - ความเร็ว: การแทนที่ความเร็วแบบ native ของผู้ให้บริการ
    - ไม่รองรับรูปแบบบันทึกเสียง Opus แบบ native

    หากต้องการใช้ xAI เป็นผู้ให้บริการ TTS เริ่มต้น:

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
    OpenClaw ใช้ endpoint `/v1/tts` แบบแบตช์ของ xAI xAI ยังมี TTS แบบสตรีมมิง
    ผ่าน WebSocket แต่สัญญาผู้ให้บริการเสียงพูดของ OpenClaw ในปัจจุบันคาดหวัง
    บัฟเฟอร์เสียงที่สมบูรณ์ก่อนส่งคำตอบ
    </Note>

  </Accordion>

  <Accordion title="แปลงเสียงเป็นข้อความ">
    Plugin `xai` แบบ bundled ลงทะเบียนการแปลงเสียงเป็นข้อความแบบแบตช์ผ่านพื้นผิว
    การถอดเสียงเพื่อทำความเข้าใจสื่อของ OpenClaw

    - โมเดลเริ่มต้น: `grok-stt`
    - Endpoint: xAI REST `/v1/stt`
    - เส้นทางอินพุต: การอัปโหลดไฟล์เสียงแบบ multipart
    - รองรับโดย OpenClaw ในทุกที่ที่การถอดเสียงขาเข้าใช้
      `tools.media.audio` รวมถึงเซกเมนต์ช่องเสียงของ Discord และ
      ไฟล์แนบเสียงของช่องทาง

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

    สามารถระบุภาษาผ่าน config สื่อเสียงร่วม หรือผ่านคำขอถอดเสียง
    แบบรายครั้งได้ คำใบ้ prompt เป็นที่ยอมรับโดยพื้นผิว OpenClaw ร่วม
    แต่การผสานรวม REST STT ของ xAI จะส่งต่อเฉพาะไฟล์ โมเดล และ
    ภาษา เพราะสิ่งเหล่านั้นแมปกับ endpoint สาธารณะปัจจุบันของ xAI ได้ชัดเจน

  </Accordion>

  <Accordion title="แปลงเสียงเป็นข้อความแบบสตรีมมิง">
    Plugin `xai` แบบ bundled ยังลงทะเบียนผู้ให้บริการถอดเสียงแบบเรียลไทม์
    สำหรับเสียง voice-call สดด้วย

    - Endpoint: xAI WebSocket `wss://api.x.ai/v1/stt`
    - การเข้ารหัสเริ่มต้น: `mulaw`
    - sample rate เริ่มต้น: `8000`
    - endpointing เริ่มต้น: `800ms`
    - transcript ชั่วคราว: เปิดใช้โดยค่าเริ่มต้น

    สตรีมสื่อ Twilio ของ Voice Call ส่งเฟรมเสียง G.711 µ-law ดังนั้น
    ผู้ให้บริการ xAI จึงสามารถส่งต่อเฟรมเหล่านั้นโดยตรงโดยไม่ต้องแปลงรหัส:

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

    การกำหนดค่าที่ Provider เป็นเจ้าของอยู่ใต้
    `plugins.entries.voice-call.config.streaming.providers.xai` คีย์ที่รองรับ
    คือ `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw`, หรือ
    `alaw`), `interimResults`, `endpointingMs`, และ `language`

    <Note>
    Provider สตรีมมิงนี้ใช้สำหรับเส้นทางถอดเสียงแบบเรียลไทม์ของ Voice Call
    ปัจจุบัน Discord voice จะบันทึกเป็นช่วงสั้น ๆ และใช้เส้นทางถอดเสียงแบบแบตช์
    `tools.media.audio` แทน
    </Note>

  </Accordion>

  <Accordion title="การกำหนดค่า x_search">
    Plugin xAI ที่มาพร้อมกันเปิดเผย `x_search` เป็นเครื่องมือ OpenClaw สำหรับค้นหา
    เนื้อหา X (เดิมคือ Twitter) ผ่าน Grok

    เส้นทางการกำหนดค่า: `plugins.entries.xai.config.xSearch`

    | คีย์               | ประเภท  | ค่าเริ่มต้น        | คำอธิบาย                              |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | เปิดหรือปิดใช้งาน x_search           |
    | `model`            | string  | `grok-4-1-fast`    | Model ที่ใช้สำหรับคำขอ x_search      |
    | `baseUrl`          | string  | -                  | ค่าแทนที่ URL ฐานของ xAI Responses   |
    | `inlineCitations`  | boolean | -                  | รวมการอ้างอิงแบบอินไลน์ในผลลัพธ์     |
    | `maxTurns`         | number  | -                  | จำนวนรอบสนทนาสูงสุด                  |
    | `timeoutSeconds`   | number  | -                  | ระยะหมดเวลาของคำขอเป็นวินาที         |
    | `cacheTtlMinutes`  | number  | -                  | อายุแคชเป็นนาที                       |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                baseUrl: "https://api.x.ai/v1",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="การกำหนดค่าการรันโค้ด">
    Plugin xAI ที่มาพร้อมกันเปิดเผย `code_execution` เป็นเครื่องมือ OpenClaw สำหรับ
    การรันโค้ดระยะไกลในสภาพแวดล้อม sandbox ของ xAI

    เส้นทางการกำหนดค่า: `plugins.entries.xai.config.codeExecution`

    | คีย์              | ประเภท  | ค่าเริ่มต้น              | คำอธิบาย                              |
    | ----------------- | ------- | ------------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true` (หากมีคีย์พร้อมใช้) | เปิดหรือปิดใช้งานการรันโค้ด       |
    | `model`           | string  | `grok-4-1-fast`          | Model ที่ใช้สำหรับคำขอรันโค้ด           |
    | `maxTurns`        | number  | -                        | จำนวนรอบสนทนาสูงสุด                     |
    | `timeoutSeconds`  | number  | -                        | ระยะหมดเวลาของคำขอเป็นวินาที            |

    <Note>
    นี่คือการรันใน sandbox xAI ระยะไกล ไม่ใช่ [`exec`](/th/tools/exec) ในเครื่อง
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

  <Accordion title="ข้อจำกัดที่ทราบ">
    - ปัจจุบันการตรวจสอบสิทธิ์ใช้ API key เท่านั้น ยังไม่มีโฟลว์ xAI OAuth หรือ device-code ใน
      OpenClaw
    - `grok-4.20-multi-agent-experimental-beta-0304` ไม่รองรับบนเส้นทาง Provider xAI
      ปกติ เพราะต้องใช้พื้นผิว API ต้นทางที่ต่างจาก transport xAI มาตรฐานของ OpenClaw
    - xAI Realtime voice ยังไม่ได้ลงทะเบียนเป็น Provider ของ OpenClaw ต้องใช้
      สัญญาเซสชันเสียงสองทิศทางที่ต่างจาก STT แบบแบตช์หรือการถอดเสียงแบบสตรีมมิง
    - `quality` ของภาพ xAI, `mask` ของภาพ และอัตราส่วนภาพเพิ่มเติมที่มีเฉพาะ native
      จะไม่ถูกเปิดเผยจนกว่าเครื่องมือ `image_generate` ที่ใช้ร่วมกันจะมีตัวควบคุม
      ข้าม Provider ที่สอดคล้องกัน
  </Accordion>

  <Accordion title="หมายเหตุขั้นสูง">
    - OpenClaw ใช้การแก้ไขความเข้ากันได้ของ tool-schema และ tool-call เฉพาะ xAI
      โดยอัตโนมัติบนเส้นทาง runner ที่ใช้ร่วมกัน
    - คำขอ xAI แบบ native ตั้งค่าเริ่มต้นเป็น `tool_stream: true` ตั้งค่า
      `agents.defaults.models["xai/<model>"].params.tool_stream` เป็น `false` เพื่อ
      ปิดใช้งาน
    - wrapper xAI ที่มาพร้อมกันจะตัดแฟล็ก strict tool-schema และคีย์ reasoning payload
      ที่ไม่รองรับออกก่อนส่งคำขอ xAI แบบ native
    - `web_search`, `x_search`, และ `code_execution` ถูกเปิดเผยเป็นเครื่องมือ OpenClaw
      OpenClaw จะเปิดใช้งาน built-in ของ xAI ที่ต้องใช้ภายในคำขอเครื่องมือแต่ละรายการ
      แทนที่จะผูกเครื่องมือ native ทั้งหมดกับทุก chat turn
    - Grok `web_search` อ่าน `plugins.entries.xai.config.webSearch.baseUrl`
      `x_search` อ่าน `plugins.entries.xai.config.xSearch.baseUrl` จากนั้น
      fallback ไปยัง URL ฐานของ Grok web-search
    - `x_search` และ `code_execution` เป็นของ Plugin xAI ที่มาพร้อมกัน แทนที่จะ
      hardcode ไว้ใน runtime Model หลัก
    - `code_execution` คือการรันใน sandbox xAI ระยะไกล ไม่ใช่
      [`exec`](/th/tools/exec) ในเครื่อง
  </Accordion>
</AccordionGroup>

## การทดสอบแบบ live

เส้นทางสื่อของ xAI ครอบคลุมโดย unit test และชุดทดสอบ live แบบเลือกเปิดใช้ คำสั่ง live
จะโหลด secret จาก login shell ของคุณ รวมถึง `~/.profile` ก่อนตรวจสอบ
`XAI_API_KEY`

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

ไฟล์ live เฉพาะ Provider จะสังเคราะห์ TTS ปกติ, TTS แบบ PCM ที่เหมาะกับโทรศัพท์,
ถอดเสียงผ่าน xAI batch STT, สตรีม PCM เดียวกันผ่าน xAI realtime STT,
สร้างผลลัพธ์ text-to-image และแก้ไขรูปภาพอ้างอิง ไฟล์ image live ที่ใช้ร่วมกันจะตรวจสอบ
Provider xAI เดียวกันผ่านเส้นทางการเลือก runtime, fallback, normalization และการแนบสื่อ
ของ OpenClaw

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือก Model" href="/th/concepts/model-providers" icon="layers">
    การเลือก Provider, การอ้างอิง Model และพฤติกรรม failover
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือก Provider
  </Card>
  <Card title="Provider ทั้งหมด" href="/th/providers/index" icon="grid-2">
    ภาพรวม Provider ที่กว้างขึ้น
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาและวิธีแก้ไขที่พบบ่อย
  </Card>
</CardGroup>
