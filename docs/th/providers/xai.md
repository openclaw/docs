---
read_when:
    - คุณต้องการใช้โมเดล Grok ใน OpenClaw
    - คุณกำลังกำหนดค่าการตรวจสอบสิทธิ์หรือรหัสโมเดลของ xAI
summary: ใช้โมเดล xAI Grok ใน OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-10T19:55:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: f11c31e7ff39e7e13465b48d819db3921a32ed624676a57dc38f97c0dbd21e46
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw มาพร้อมกับ Plugin ผู้ให้บริการ `xai` แบบบันเดิลสำหรับโมเดล Grok

## เริ่มต้นใช้งาน

<Steps>
  <Step title="สร้าง API key">
    สร้าง API key ใน [คอนโซล xAI](https://console.x.ai/)
  </Step>
  <Step title="ตั้งค่า API key ของคุณ">
    ตั้งค่า `XAI_API_KEY` หรือเรียกใช้:

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
OpenClaw ใช้ xAI Responses API เป็นการขนส่ง xAI แบบบันเดิล API key เดียวกัน
จาก `openclaw onboard --auth-choice xai-api-key` ยังสามารถขับเคลื่อน
`x_search` ระดับเฟิร์สต์คลาสและ `code_execution` ระยะไกลได้ด้วย; `XAI_API_KEY` หรือการกำหนดค่า
เว็บเสิร์ชของ Plugin ก็สามารถขับเคลื่อน `web_search` ที่รองรับด้วย Grok ได้เช่นกัน
หากคุณจัดเก็บคีย์ xAI ไว้ใต้ `plugins.entries.xai.config.webSearch.apiKey`
ผู้ให้บริการโมเดล xAI แบบบันเดิลจะนำคีย์นั้นมาใช้ซ้ำเป็นทางเลือกสำรองด้วย
ตั้งค่า `plugins.entries.xai.config.webSearch.baseUrl` เพื่อกำหนดเส้นทาง Grok `web_search`
และโดยค่าเริ่มต้น `x_search` ผ่านพร็อกซี xAI Responses ของผู้ปฏิบัติการ
การปรับแต่ง `code_execution` อยู่ใต้ `plugins.entries.xai.config.codeExecution`
</Note>

## แค็ตตาล็อกในตัว

OpenClaw รวมตระกูลโมเดล xAI เหล่านี้มาให้พร้อมใช้งาน:

| ตระกูล         | ID โมเดล                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Plugin ยัง forward-resolve ID `grok-4*` และ `grok-code-fast*` ที่ใหม่กว่าเมื่อ
ID เหล่านั้นใช้รูปแบบ API เดียวกัน

<Tip>
`grok-4.3`, `grok-4-fast`, `grok-4-1-fast` และตัวแปร `grok-4.20-beta-*`
คือ refs ของ Grok ที่รองรับภาพในปัจจุบันในแค็ตตาล็อกแบบบันเดิล
</Tip>

## การครอบคลุมฟีเจอร์ของ OpenClaw

Plugin แบบบันเดิลแมปพื้นผิว API สาธารณะปัจจุบันของ xAI ไปยังสัญญา
ผู้ให้บริการและเครื่องมือที่ใช้ร่วมกันของ OpenClaw ความสามารถที่ไม่พอดีกับสัญญาที่ใช้ร่วมกัน
(เช่น TTS แบบสตรีมมิงและเสียงแบบเรียลไทม์) จะไม่ถูกเปิดเผย - ดูตาราง
ด้านล่าง

| ความสามารถของ xAI             | พื้นผิว OpenClaw                          | สถานะ                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| แชท / Responses           | ผู้ให้บริการโมเดล `xai/<model>`              | ใช่                                                                 |
| เว็บเสิร์ชฝั่งเซิร์ฟเวอร์     | ผู้ให้บริการ `web_search` `grok`              | ใช่                                                                 |
| การค้นหา X ฝั่งเซิร์ฟเวอร์       | เครื่องมือ `x_search`                           | ใช่                                                                 |
| การประมวลผลโค้ดฝั่งเซิร์ฟเวอร์ | เครื่องมือ `code_execution`                     | ใช่                                                                 |
| รูปภาพ                     | `image_generate`                          | ใช่                                                                 |
| วิดีโอ                     | `video_generate`                          | ใช่                                                                 |
| ข้อความเป็นเสียงแบบแบตช์       | `messages.tts.provider: "xai"` / `tts`    | ใช่                                                                 |
| TTS แบบสตรีมมิง              | -                                         | ไม่เปิดเผย; สัญญา TTS ของ OpenClaw ส่งคืนบัฟเฟอร์เสียงแบบสมบูรณ์ |
| เสียงพูดเป็นข้อความแบบแบตช์       | `tools.media.audio` / ความเข้าใจสื่อ | ใช่                                                                 |
| เสียงพูดเป็นข้อความแบบสตรีมมิง   | Voice Call `streaming.provider: "xai"`    | ใช่                                                                 |
| เสียงแบบเรียลไทม์             | -                                         | ยังไม่เปิดเผย; สัญญาเซสชัน/WebSocket แตกต่างกัน               |
| ไฟล์ / แบตช์            | ความเข้ากันได้กับ API โมเดลทั่วไปเท่านั้น      | ไม่ใช่เครื่องมือ OpenClaw ระดับเฟิร์สต์คลาส                                     |

<Note>
OpenClaw ใช้ API REST รูปภาพ/วิดีโอ/TTS/STT ของ xAI สำหรับการสร้างสื่อ
เสียงพูด และการถอดเสียงแบบแบตช์, ใช้ WebSocket STT แบบสตรีมมิงของ xAI สำหรับการถอดเสียง
สายเสียงสด และใช้ Responses API สำหรับเครื่องมือโมเดล การค้นหา และ
การประมวลผลโค้ด ฟีเจอร์ที่ต้องใช้สัญญา OpenClaw ที่แตกต่างกัน เช่น
เซสชันเสียงแบบเรียลไทม์ จะถูกบันทึกไว้ที่นี่ในฐานะความสามารถต้นทาง
แทนที่จะเป็นพฤติกรรมของ Plugin ที่ซ่อนอยู่
</Note>

### การแมปโหมดเร็ว

`/fast on` หรือ `agents.defaults.models["xai/<model>"].params.fastMode: true`
เขียนคำขอ xAI แบบเนทีฟใหม่ดังนี้:

| โมเดลต้นทาง  | เป้าหมายโหมดเร็ว   |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### นามแฝงความเข้ากันได้แบบดั้งเดิม

นามแฝงดั้งเดิมยังคงถูก normalize เป็น ID แบบบันเดิลมาตรฐาน:

| นามแฝงดั้งเดิม              | ID มาตรฐาน                          |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## ฟีเจอร์

<AccordionGroup>
  <Accordion title="เว็บเสิร์ช">
    ผู้ให้บริการเว็บเสิร์ช `grok` แบบบันเดิลสามารถใช้ `XAI_API_KEY` หรือคีย์
    เว็บเสิร์ชของ Plugin ได้:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="การสร้างวิดีโอ">
    Plugin `xai` แบบบันเดิลลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือ
    `video_generate` ที่ใช้ร่วมกัน

    - โมเดลวิดีโอเริ่มต้น: `xai/grok-imagine-video`
    - โหมด: ข้อความเป็นวิดีโอ, ภาพเป็นวิดีโอ, การสร้างภาพอ้างอิง, การแก้ไขวิดีโอระยะไกล และการขยายวิดีโอระยะไกล
    - อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - ความละเอียด: `480P`, `720P`
    - ระยะเวลา: 1-15 วินาทีสำหรับการสร้าง/ภาพเป็นวิดีโอ, 1-10 วินาทีเมื่อใช้บทบาท `reference_image`, 2-10 วินาทีสำหรับการขยาย
    - การสร้างภาพอ้างอิง: ตั้งค่า `imageRoles` เป็น `reference_image` สำหรับภาพที่ให้มาทุกภาพ; xAI ยอมรับภาพดังกล่าวได้สูงสุด 7 ภาพ

    <Warning>
    ไม่รับบัฟเฟอร์วิดีโอในเครื่อง ใช้ URL `http(s)` ระยะไกลสำหรับ
    อินพุตการแก้ไข/ขยายวิดีโอ ภาพเป็นวิดีโอรับบัฟเฟอร์รูปภาพในเครื่องได้เพราะ
    OpenClaw สามารถเข้ารหัสเป็น URL ข้อมูลสำหรับ xAI ได้
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
    ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน
    การเลือกผู้ให้บริการ และพฤติกรรม failover
    </Note>

  </Accordion>

  <Accordion title="การสร้างรูปภาพ">
    Plugin `xai` แบบบันเดิลลงทะเบียนการสร้างรูปภาพผ่านเครื่องมือ
    `image_generate` ที่ใช้ร่วมกัน

    - โมเดลรูปภาพเริ่มต้น: `xai/grok-imagine-image`
    - โมเดลเพิ่มเติม: `xai/grok-imagine-image-pro`
    - โหมด: ข้อความเป็นรูปภาพและการแก้ไขภาพอ้างอิง
    - อินพุตอ้างอิง: `image` หนึ่งรายการหรือ `images` ได้สูงสุดห้ารายการ
    - อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - ความละเอียด: `1K`, `2K`
    - จำนวน: ได้สูงสุด 4 ภาพ

    OpenClaw ขอการตอบกลับรูปภาพแบบ `b64_json` จาก xAI เพื่อให้สื่อที่สร้างขึ้นสามารถ
    จัดเก็บและส่งผ่านเส้นทางไฟล์แนบของช่องทางปกติได้ รูปภาพอ้างอิงในเครื่อง
    จะถูกแปลงเป็น URL ข้อมูล; การอ้างอิง `http(s)` ระยะไกลจะถูกส่งผ่านตามเดิม

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
    xAI ยังบันทึก `quality`, `mask`, `user` และอัตราส่วนเนทีฟเพิ่มเติม
    เช่น `1:2`, `2:1`, `9:20` และ `20:9` ด้วย ปัจจุบัน OpenClaw ส่งต่อเฉพาะ
    ตัวควบคุมรูปภาพข้ามผู้ให้บริการที่ใช้ร่วมกัน; knob ที่เป็นเนทีฟเท่านั้นซึ่งไม่รองรับ
    จะไม่ถูกเปิดเผยผ่าน `image_generate` โดยตั้งใจ
    </Note>

  </Accordion>

  <Accordion title="ข้อความเป็นเสียง">
    Plugin `xai` แบบบันเดิลลงทะเบียนข้อความเป็นเสียงผ่านพื้นผิวผู้ให้บริการ `tts`
    ที่ใช้ร่วมกัน

    - เสียง: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - เสียงเริ่มต้น: `eve`
    - รูปแบบ: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - ภาษา: รหัส BCP-47 หรือ `auto`
    - ความเร็ว: การแทนที่ความเร็วแบบเนทีฟของผู้ให้บริการ
    - ไม่รองรับรูปแบบวอยซ์โน้ต Opus แบบเนทีฟ

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
    OpenClaw ใช้ปลายทาง `/v1/tts` แบบแบตช์ของ xAI xAI ยังมี TTS แบบสตรีมมิง
    ผ่าน WebSocket ด้วย แต่ปัจจุบันสัญญาผู้ให้บริการเสียงพูดของ OpenClaw คาดหวัง
    บัฟเฟอร์เสียงที่สมบูรณ์ก่อนส่งคำตอบ
    </Note>

  </Accordion>

  <Accordion title="เสียงพูดเป็นข้อความ">
    Plugin `xai` แบบบันเดิลลงทะเบียนเสียงพูดเป็นข้อความแบบแบตช์ผ่านพื้นผิว
    การถอดเสียงเพื่อความเข้าใจสื่อของ OpenClaw

    - โมเดลเริ่มต้น: `grok-stt`
    - ปลายทาง: xAI REST `/v1/stt`
    - เส้นทางอินพุต: อัปโหลดไฟล์เสียงแบบ multipart
    - OpenClaw รองรับในทุกที่ที่การถอดเสียงขาเข้าใช้
      `tools.media.audio` รวมถึงส่วนเสียงของช่องเสียง Discord และ
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

    สามารถระบุภาษาได้ผ่านการกำหนดค่าสื่อเสียงที่ใช้ร่วมกันหรือคำขอถอดเสียง
    รายการต่อรายการ คำใบ้พรอมป์ได้รับการยอมรับโดยพื้นผิว OpenClaw ที่ใช้ร่วมกัน
    แต่การผสานรวม xAI REST STT ส่งต่อเฉพาะไฟล์ โมเดล และ
    ภาษา เพราะสิ่งเหล่านั้นแมปกับปลายทางสาธารณะปัจจุบันของ xAI ได้อย่างชัดเจน

  </Accordion>

  <Accordion title="เสียงพูดเป็นข้อความแบบสตรีมมิง">
    Plugin `xai` แบบบันเดิลยังลงทะเบียนผู้ให้บริการการถอดเสียงแบบเรียลไทม์
    สำหรับเสียงสายเสียงสดด้วย

    - ปลายทาง: xAI WebSocket `wss://api.x.ai/v1/stt`
    - การเข้ารหัสเริ่มต้น: `mulaw`
    - อัตราสุ่มตัวอย่างเริ่มต้น: `8000`
    - endpointing เริ่มต้น: `800ms`
    - ข้อความถอดเสียงชั่วคราว: เปิดใช้งานตามค่าเริ่มต้น

    สตรีมสื่อ Twilio ของ Voice Call ส่งเฟรมเสียง G.711 µ-law ดังนั้น
    ผู้ให้บริการ xAI จึงส่งต่อเฟรมเหล่านั้นได้โดยตรงโดยไม่ต้องแปลงรหัส:

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

    การกำหนดค่าที่ provider เป็นเจ้าของอยู่ภายใต้
    `plugins.entries.voice-call.config.streaming.providers.xai` คีย์ที่รองรับ
    ได้แก่ `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` หรือ
    `alaw`), `interimResults`, `endpointingMs` และ `language`

    <Note>
    provider สำหรับสตรีมมิงนี้ใช้สำหรับเส้นทางการถอดเสียงแบบเรียลไทม์ของ Voice Call
    ปัจจุบันเสียง Discord จะบันทึกช่วงสั้น ๆ และใช้เส้นทางการถอดเสียงแบบแบตช์
    `tools.media.audio` แทน
    </Note>

  </Accordion>

  <Accordion title="การกำหนดค่า x_search">
    Plugin xAI ที่มาพร้อมชุดติดตั้งเปิดเผย `x_search` เป็นเครื่องมือ OpenClaw สำหรับค้นหา
    เนื้อหา X (เดิมคือ Twitter) ผ่าน Grok

    เส้นทางการกำหนดค่า: `plugins.entries.xai.config.xSearch`

    | คีย์                | ประเภท    | ค่าเริ่มต้น            | คำอธิบาย                          |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | เปิดหรือปิดใช้งาน x_search           |
    | `model`            | string  | `grok-4-1-fast`    | โมเดลที่ใช้สำหรับคำขอ x_search     |
    | `baseUrl`          | string  | -                  | การแทนที่ URL ฐานของ xAI Responses      |
    | `inlineCitations`  | boolean | -                  | รวมการอ้างอิงแบบอินไลน์ในผลลัพธ์  |
    | `maxTurns`         | number  | -                  | จำนวนรอบการสนทนาสูงสุด           |
    | `timeoutSeconds`   | number  | -                  | ระยะหมดเวลาของคำขอเป็นวินาที           |
    | `cacheTtlMinutes`  | number  | -                  | อายุแคชเป็นนาที        |

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

  <Accordion title="การกำหนดค่า Code execution">
    Plugin xAI ที่มาพร้อมชุดติดตั้งเปิดเผย `code_execution` เป็นเครื่องมือ OpenClaw สำหรับ
    การรันโค้ดระยะไกลในสภาพแวดล้อม sandbox ของ xAI

    เส้นทางการกำหนดค่า: `plugins.entries.xai.config.codeExecution`

    | คีย์               | ประเภท    | ค่าเริ่มต้น            | คำอธิบาย                              |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true` (หากมีคีย์) | เปิดหรือปิดใช้งานการรันโค้ด  |
    | `model`           | string  | `grok-4-1-fast`    | โมเดลที่ใช้สำหรับคำขอรันโค้ด   |
    | `maxTurns`        | number  | -                  | จำนวนรอบการสนทนาสูงสุด               |
    | `timeoutSeconds`  | number  | -                  | ระยะหมดเวลาของคำขอเป็นวินาที               |

    <Note>
    นี่คือการรันใน sandbox ของ xAI ระยะไกล ไม่ใช่ [`exec`](/th/tools/exec) ในเครื่อง
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
    - การยืนยันตัวตนในปัจจุบันใช้คีย์ API เท่านั้น คีย์ API อาจถูกเก็บไว้ในโปรไฟล์การยืนยันตัวตน xAI
      ตัวแปรสภาพแวดล้อม หรือการกำหนดค่า Plugin ยังไม่มี OAuth ของ xAI หรือ
      โฟลว์ device-code ใน OpenClaw
    - `grok-4.20-multi-agent-experimental-beta-0304` ไม่รองรับบนเส้นทาง
      provider xAI ปกติ เพราะต้องใช้พื้นผิว API ต้นทางที่แตกต่างจาก
      การขนส่ง xAI มาตรฐานของ OpenClaw
    - เสียง xAI Realtime ยังไม่ได้ลงทะเบียนเป็น provider ของ OpenClaw
      ต้องใช้สัญญาเซสชันเสียงแบบสองทิศทางที่แตกต่างจาก STT แบบแบตช์หรือ
      การถอดเสียงแบบสตรีมมิง
    - `quality` ของภาพ xAI, `mask` ของภาพ และอัตราส่วนภาพเพิ่มเติมที่ใช้ได้เฉพาะแบบ native
      ยังไม่ถูกเปิดเผยจนกว่าเครื่องมือ `image_generate` ที่ใช้ร่วมกันจะมี
      ตัวควบคุมข้าม provider ที่สอดคล้องกัน
  </Accordion>

  <Accordion title="หมายเหตุขั้นสูง">
    - OpenClaw ใช้การแก้ไขความเข้ากันได้สำหรับ schema ของเครื่องมือและการเรียกเครื่องมือที่เฉพาะกับ xAI
      โดยอัตโนมัติบนเส้นทาง runner ที่ใช้ร่วมกัน
    - คำขอ xAI แบบ native ตั้งค่าเริ่มต้นเป็น `tool_stream: true` ตั้งค่า
      `agents.defaults.models["xai/<model>"].params.tool_stream` เป็น `false` เพื่อ
      ปิดใช้งาน
    - wrapper xAI ที่มาพร้อมชุดติดตั้งจะลบแฟล็ก schema ของเครื่องมือแบบ strict ที่ไม่รองรับและ
      คีย์ payload การให้เหตุผลก่อนส่งคำขอ xAI แบบ native
    - `web_search`, `x_search` และ `code_execution` ถูกเปิดเผยเป็นเครื่องมือ OpenClaw
      OpenClaw เปิดใช้งาน built-in ของ xAI ที่ต้องใช้ภายในคำขอเครื่องมือแต่ละรายการ
      แทนการแนบเครื่องมือ native ทั้งหมดกับทุกเทิร์นของแชต
    - Grok `web_search` อ่าน `plugins.entries.xai.config.webSearch.baseUrl`
      `x_search` อ่าน `plugins.entries.xai.config.xSearch.baseUrl` จากนั้น
      fallback ไปยัง URL ฐานของการค้นหาเว็บ Grok
    - `x_search` และ `code_execution` เป็นของ Plugin xAI ที่มาพร้อมชุดติดตั้ง
      ไม่ได้ถูก hardcode ไว้ใน runtime โมเดลหลัก
    - `code_execution` คือการรันใน sandbox ของ xAI ระยะไกล ไม่ใช่
      [`exec`](/th/tools/exec) ในเครื่อง
  </Accordion>
</AccordionGroup>

## การทดสอบแบบ live

เส้นทางสื่อ xAI ครอบคลุมด้วย unit test และชุดทดสอบแบบ live ที่เลือกเปิดใช้ คำสั่ง live
จะโหลด secrets จาก shell ล็อกอินของคุณ รวมถึง `~/.profile` ก่อน
probe `XAI_API_KEY`

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

ไฟล์ live เฉพาะ provider จะสังเคราะห์ TTS ปกติ, PCM TTS ที่เหมาะกับระบบโทรศัพท์,
ถอดเสียงผ่าน STT แบบแบตช์ของ xAI, สตรีม PCM เดียวกันผ่าน STT เรียลไทม์ของ xAI,
สร้างผลลัพธ์ text-to-image และแก้ไขภาพอ้างอิง ไฟล์ live ของภาพที่ใช้ร่วมกัน
ยืนยัน provider xAI เดียวกันผ่านเส้นทางการเลือก runtime, fallback, การทำให้เป็นมาตรฐาน,
และแนบสื่อของ OpenClaw

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model refs และพฤติกรรม failover
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="provider ทั้งหมด" href="/th/providers/index" icon="grid-2">
    ภาพรวม provider ที่กว้างขึ้น
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาทั่วไปและการแก้ไข
  </Card>
</CardGroup>
