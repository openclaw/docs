---
read_when:
    - คุณต้องการใช้โมเดล Grok ใน OpenClaw
    - คุณกำลังกำหนดค่าการยืนยันตัวตนของ xAI หรือรหัสโมเดล
summary: ใช้โมเดล xAI Grok ใน OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-02T10:27:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f36b597fd5c47b61724080deb0d545bca024aca17744fc8aa6a0eb4872d12d2
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw มาพร้อมกับ Plugin ผู้ให้บริการ `xai` สำหรับโมเดล Grok

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
OpenClaw ใช้ xAI Responses API เป็นทรานสปอร์ต xAI ที่มาพร้อมกัน `XAI_API_KEY`
เดียวกันยังใช้ขับเคลื่อน `web_search` ที่รองรับด้วย Grok, `x_search`
แบบชั้นหนึ่ง และ `code_execution` ระยะไกลได้ด้วย
หากคุณเก็บคีย์ xAI ไว้ภายใต้ `plugins.entries.xai.config.webSearch.apiKey`
ผู้ให้บริการโมเดล xAI ที่มาพร้อมกันจะนำคีย์นั้นมาใช้ซ้ำเป็นค่าทดแทนด้วย
ตั้งค่า `plugins.entries.xai.config.webSearch.baseUrl` เพื่อกำหนดเส้นทาง Grok
`web_search` และโดยค่าเริ่มต้นคือ `x_search` ผ่านพร็อกซี xAI Responses
ของผู้ปฏิบัติงาน การปรับแต่ง `code_execution` อยู่ภายใต้
`plugins.entries.xai.config.codeExecution`
</Note>

## แค็ตตาล็อกในตัว

OpenClaw มีตระกูลโมเดล xAI เหล่านี้ให้ใช้งานทันที:

| ตระกูล         | รหัสโมเดล                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Plugin ยังส่งต่อและแก้รหัส `grok-4*` และ `grok-code-fast*` รุ่นใหม่กว่าเมื่อรหัสเหล่านั้น
เป็นไปตามรูปแบบ API เดียวกัน

<Tip>
`grok-4.3`, `grok-4-fast`, `grok-4-1-fast` และตัวแปร `grok-4.20-beta-*`
คืออ้างอิง Grok ที่รองรับรูปภาพในปัจจุบันในแค็ตตาล็อกที่มาพร้อมกัน
</Tip>

## ความครอบคลุมฟีเจอร์ของ OpenClaw

Plugin ที่มาพร้อมกันแมปพื้นผิว API สาธารณะปัจจุบันของ xAI ไปยังสัญญา
ผู้ให้บริการและเครื่องมือร่วมของ OpenClaw ความสามารถที่ไม่เข้ากับสัญญาร่วม
(เช่น TTS แบบสตรีมและเสียงแบบเรียลไทม์) จะไม่ถูกเปิดเผย โปรดดูตาราง
ด้านล่าง

| ความสามารถของ xAI             | พื้นผิวของ OpenClaw                          | สถานะ                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| แชต / Responses           | ผู้ให้บริการโมเดล `xai/<model>`              | ใช่                                                                 |
| การค้นเว็บฝั่งเซิร์ฟเวอร์     | ผู้ให้บริการ `web_search` `grok`              | ใช่                                                                 |
| การค้น X ฝั่งเซิร์ฟเวอร์       | เครื่องมือ `x_search`                           | ใช่                                                                 |
| การเรียกใช้โค้ดฝั่งเซิร์ฟเวอร์ | เครื่องมือ `code_execution`                     | ใช่                                                                 |
| รูปภาพ                     | `image_generate`                          | ใช่                                                                 |
| วิดีโอ                     | `video_generate`                          | ใช่                                                                 |
| การแปลงข้อความเป็นเสียงแบบแบตช์       | `messages.tts.provider: "xai"` / `tts`    | ใช่                                                                 |
| TTS แบบสตรีม              | —                                         | ไม่เปิดเผย; สัญญา TTS ของ OpenClaw ส่งคืนบัฟเฟอร์เสียงที่สมบูรณ์ |
| การแปลงเสียงเป็นข้อความแบบแบตช์       | `tools.media.audio` / ความเข้าใจสื่อ | ใช่                                                                 |
| การแปลงเสียงเป็นข้อความแบบสตรีม   | Voice Call `streaming.provider: "xai"`    | ใช่                                                                 |
| เสียงแบบเรียลไทม์             | —                                         | ยังไม่เปิดเผย; ใช้สัญญาเซสชัน/WebSocket ที่ต่างกัน               |
| ไฟล์ / แบตช์            | ความเข้ากันได้กับ API โมเดลทั่วไปเท่านั้น      | ไม่ใช่เครื่องมือ OpenClaw แบบชั้นหนึ่ง                                     |

<Note>
OpenClaw ใช้ API รูปภาพ/วิดีโอ/TTS/STT แบบ REST ของ xAI สำหรับการสร้างสื่อ
เสียงพูด และการถอดเสียงแบบแบตช์ ใช้ WebSocket STT แบบสตรีมของ xAI
สำหรับการถอดเสียงการโทรด้วยเสียงสด และใช้ Responses API สำหรับโมเดล
เครื่องมือค้นหา และเครื่องมือเรียกใช้โค้ด ฟีเจอร์ที่ต้องใช้สัญญา OpenClaw
ที่ต่างออกไป เช่น เซสชันเสียงแบบเรียลไทม์ ได้รับการบันทึกไว้ที่นี่ในฐานะ
ความสามารถต้นทาง แทนที่จะเป็นพฤติกรรม Plugin ที่ซ่อนอยู่
</Note>

### การแมปโหมดเร็ว

`/fast on` หรือ `agents.defaults.models["xai/<model>"].params.fastMode: true`
เขียนคำขอ xAI ดั้งเดิมใหม่ดังนี้:

| โมเดลต้นทาง  | เป้าหมายโหมดเร็ว   |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### นามแฝงความเข้ากันได้แบบเดิม

นามแฝงแบบเดิมยังคงถูกปรับให้เป็นรหัสที่มาพร้อมกันแบบเป็นทางการ:

| นามแฝงแบบเดิม              | รหัสแบบเป็นทางการ                          |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## ฟีเจอร์

<AccordionGroup>
  <Accordion title="การค้นเว็บ">
    ผู้ให้บริการค้นเว็บ `grok` ที่มาพร้อมกันใช้ `XAI_API_KEY` ด้วย:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="การสร้างวิดีโอ">
    Plugin `xai` ที่มาพร้อมกันลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือร่วม
    `video_generate`

    - โมเดลวิดีโอเริ่มต้น: `xai/grok-imagine-video`
    - โหมด: ข้อความเป็นวิดีโอ, รูปภาพเป็นวิดีโอ, การสร้างจากรูปภาพอ้างอิง, การแก้ไขวิดีโอระยะไกล และการต่อขยายวิดีโอระยะไกล
    - อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - ความละเอียด: `480P`, `720P`
    - ระยะเวลา: 1-15 วินาทีสำหรับการสร้าง/รูปภาพเป็นวิดีโอ, 1-10 วินาทีเมื่อใช้บทบาท `reference_image`, 2-10 วินาทีสำหรับการต่อขยาย
    - การสร้างจากรูปภาพอ้างอิง: ตั้งค่า `imageRoles` เป็น `reference_image` สำหรับรูปภาพที่ให้มาทุกภาพ; xAI รับรูปภาพดังกล่าวได้สูงสุด 7 ภาพ

    <Warning>
    ไม่รองรับบัฟเฟอร์วิดีโอในเครื่อง ใช้ URL `http(s)` ระยะไกลสำหรับอินพุต
    การแก้ไข/ต่อขยายวิดีโอ รูปภาพเป็นวิดีโอรองรับบัฟเฟอร์รูปภาพในเครื่อง
    เพราะ OpenClaw สามารถเข้ารหัสเป็น URL ข้อมูลให้ xAI ได้
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
    การเลือกผู้ให้บริการ และพฤติกรรมเฟลโอเวอร์
    </Note>

  </Accordion>

  <Accordion title="การสร้างรูปภาพ">
    Plugin `xai` ที่มาพร้อมกันลงทะเบียนการสร้างรูปภาพผ่านเครื่องมือร่วม
    `image_generate`

    - โมเดลรูปภาพเริ่มต้น: `xai/grok-imagine-image`
    - โมเดลเพิ่มเติม: `xai/grok-imagine-image-pro`
    - โหมด: ข้อความเป็นรูปภาพและการแก้ไขรูปภาพอ้างอิง
    - อินพุตอ้างอิง: `image` หนึ่งรายการหรือ `images` สูงสุดห้ารายการ
    - อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - ความละเอียด: `1K`, `2K`
    - จำนวน: สูงสุด 4 รูปภาพ

    OpenClaw ขอการตอบกลับรูปภาพแบบ `b64_json` จาก xAI เพื่อให้สื่อที่สร้างขึ้น
    ถูกจัดเก็บและส่งมอบผ่านเส้นทางไฟล์แนบของช่องทางปกติได้ รูปภาพอ้างอิง
    ในเครื่องจะถูกแปลงเป็น URL ข้อมูล; อ้างอิง `http(s)` ระยะไกลจะถูกส่งผ่านตามเดิม

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
    xAI ยังบันทึก `quality`, `mask`, `user` และอัตราส่วนดั้งเดิมเพิ่มเติม
    เช่น `1:2`, `2:1`, `9:20` และ `20:9` ด้วย ปัจจุบัน OpenClaw ส่งต่อเฉพาะ
    ตัวควบคุมรูปภาพข้ามผู้ให้บริการร่วมเท่านั้น; ปุ่มปรับเฉพาะแบบดั้งเดิมที่ไม่รองรับ
    ถูกตั้งใจไม่ให้เปิดเผยผ่าน `image_generate`
    </Note>

  </Accordion>

  <Accordion title="การแปลงข้อความเป็นเสียง">
    Plugin `xai` ที่มาพร้อมกันลงทะเบียนการแปลงข้อความเป็นเสียงผ่านพื้นผิว
    ผู้ให้บริการ `tts` ร่วม

    - เสียง: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - เสียงเริ่มต้น: `eve`
    - รูปแบบ: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - ภาษา: รหัส BCP-47 หรือ `auto`
    - ความเร็ว: การแทนที่ความเร็วแบบดั้งเดิมของผู้ให้บริการ
    - ไม่รองรับรูปแบบบันทึกเสียง Opus แบบดั้งเดิม

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
    OpenClaw ใช้เอ็นด์พอยต์แบบแบตช์ `/v1/tts` ของ xAI xAI ยังมี TTS
    แบบสตรีมผ่าน WebSocket ด้วย แต่สัญญาผู้ให้บริการเสียงพูดของ OpenClaw
    ปัจจุบันคาดหวังบัฟเฟอร์เสียงที่สมบูรณ์ก่อนส่งคำตอบ
    </Note>

  </Accordion>

  <Accordion title="การแปลงเสียงเป็นข้อความ">
    Plugin `xai` ที่มาพร้อมกันลงทะเบียนการแปลงเสียงเป็นข้อความแบบแบตช์ผ่าน
    พื้นผิวการถอดเสียงเพื่อความเข้าใจสื่อของ OpenClaw

    - โมเดลเริ่มต้น: `grok-stt`
    - เอ็นด์พอยต์: xAI REST `/v1/stt`
    - เส้นทางอินพุต: การอัปโหลดไฟล์เสียงแบบ multipart
    - OpenClaw รองรับในทุกที่ที่การถอดเสียงเสียงขาเข้าใช้ `tools.media.audio` รวมถึงช่วงเสียงในช่องเสียงของ Discord และไฟล์แนบเสียงของช่องทาง

    หากต้องการบังคับใช้ xAI สำหรับการถอดเสียงเสียงขาเข้า:

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

    สามารถระบุภาษาได้ผ่านการกำหนดค่าสื่อเสียงร่วม หรือคำขอถอดเสียงต่อการเรียก
    คำใบ้พรอมป์ได้รับการยอมรับโดยพื้นผิวร่วมของ OpenClaw แต่การผสานรวม xAI
    REST STT ส่งต่อเฉพาะไฟล์ โมเดล และภาษา เพราะสิ่งเหล่านั้นแมปกับเอ็นด์พอยต์
    xAI สาธารณะปัจจุบันได้อย่างชัดเจน

  </Accordion>

  <Accordion title="การแปลงเสียงเป็นข้อความแบบสตรีม">
    Plugin `xai` ที่มาพร้อมกันยังลงทะเบียนผู้ให้บริการการถอดเสียงแบบเรียลไทม์
    สำหรับเสียงการโทรด้วยเสียงสด

    - เอ็นด์พอยต์: xAI WebSocket `wss://api.x.ai/v1/stt`
    - การเข้ารหัสเริ่มต้น: `mulaw`
    - อัตราสุ่มตัวอย่างเริ่มต้น: `8000`
    - การกำหนดจุดสิ้นสุดเริ่มต้น: `800ms`
    - ทรานสคริปต์ชั่วคราว: เปิดใช้โดยค่าเริ่มต้น

    สตรีมสื่อ Twilio ของ Voice Call ส่งเฟรมเสียง G.711 µ-law ดังนั้นผู้ให้บริการ
    xAI จึงสามารถส่งต่อเฟรมเหล่านั้นได้โดยตรงโดยไม่ต้องแปลงรหัส:

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

    Provider-owned config จะอยู่ใต้
    `plugins.entries.voice-call.config.streaming.providers.xai` คีย์ที่รองรับคือ
    `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` หรือ
    `alaw`), `interimResults`, `endpointingMs` และ `language`

    <Note>
    ผู้ให้บริการสตรีมมิงนี้มีไว้สำหรับเส้นทางการถอดเสียงแบบเรียลไทม์ของ Voice Call
    ขณะนี้เสียงของ Discord จะบันทึกช่วงสั้น ๆ และใช้เส้นทางการถอดเสียงแบบแบตช์
    `tools.media.audio` แทน
    </Note>

  </Accordion>

  <Accordion title="x_search configuration">
    Plugin xAI ที่รวมมาด้วยเปิดเผย `x_search` เป็นเครื่องมือ OpenClaw สำหรับค้นหา
    เนื้อหา X (เดิมคือ Twitter) ผ่าน Grok

    เส้นทางการกำหนดค่า: `plugins.entries.xai.config.xSearch`

    | คีย์               | ประเภท  | ค่าเริ่มต้น        | คำอธิบาย                            |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | เปิดหรือปิดใช้งาน x_search           |
    | `model`            | string  | `grok-4-1-fast`    | โมเดลที่ใช้สำหรับคำขอ x_search       |
    | `baseUrl`          | string  | —                  | การแทนที่ URL ฐานของ xAI Responses  |
    | `inlineCitations`  | boolean | —                  | รวมการอ้างอิงแบบอินไลน์ในผลลัพธ์    |
    | `maxTurns`         | number  | —                  | จำนวนรอบการสนทนาสูงสุด              |
    | `timeoutSeconds`   | number  | —                  | เวลาหมดอายุของคำขอเป็นวินาที        |
    | `cacheTtlMinutes`  | number  | —                  | อายุแคชเป็นนาที                      |

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

  <Accordion title="Code execution configuration">
    Plugin xAI ที่รวมมาด้วยเปิดเผย `code_execution` เป็นเครื่องมือ OpenClaw สำหรับ
    การประมวลผลโค้ดระยะไกลในสภาพแวดล้อม sandbox ของ xAI

    เส้นทางการกำหนดค่า: `plugins.entries.xai.config.codeExecution`

    | คีย์              | ประเภท  | ค่าเริ่มต้น              | คำอธิบาย                              |
    | ----------------- | ------- | ------------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true` (หากมีคีย์พร้อมใช้) | เปิดหรือปิดใช้งานการประมวลผลโค้ด |
    | `model`           | string  | `grok-4-1-fast`          | โมเดลที่ใช้สำหรับคำขอประมวลผลโค้ด       |
    | `maxTurns`        | number  | —                        | จำนวนรอบการสนทนาสูงสุด                  |
    | `timeoutSeconds`  | number  | —                        | เวลาหมดอายุของคำขอเป็นวินาที            |

    <Note>
    นี่คือการประมวลผลใน sandbox ระยะไกลของ xAI ไม่ใช่ [`exec`](/th/tools/exec) ในเครื่อง
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

  <Accordion title="Known limits">
    - การยืนยันตัวตนในวันนี้รองรับเฉพาะคีย์ API ยังไม่มีโฟลว์ xAI OAuth หรือ device-code ใน
      OpenClaw
    - `grok-4.20-multi-agent-experimental-beta-0304` ไม่รองรับบนเส้นทางผู้ให้บริการ xAI
      ปกติ เพราะต้องใช้พื้นผิว API upstream ที่แตกต่างจาก transport xAI มาตรฐานของ OpenClaw
    - เสียง xAI Realtime ยังไม่ได้ลงทะเบียนเป็นผู้ให้บริการ OpenClaw ต้องใช้สัญญา
      เซสชันเสียงสองทิศทางที่แตกต่างจาก STT แบบแบตช์หรือการถอดเสียงแบบสตรีมมิง
    - `quality` ของรูปภาพ xAI, `mask` ของรูปภาพ และอัตราส่วนภาพเพิ่มเติมที่เป็น native-only
      ยังไม่ถูกเปิดเผยจนกว่าเครื่องมือ `image_generate` แบบใช้ร่วมกันจะมีการควบคุม
      ข้ามผู้ให้บริการที่สอดคล้องกัน
  </Accordion>

  <Accordion title="Advanced notes">
    - OpenClaw ใช้การแก้ไขความเข้ากันได้เฉพาะ xAI สำหรับ tool-schema และ tool-call
      โดยอัตโนมัติบนเส้นทาง runner ที่ใช้ร่วมกัน
    - คำขอ xAI แบบ native มีค่าเริ่มต้น `tool_stream: true` ตั้งค่า
      `agents.defaults.models["xai/<model>"].params.tool_stream` เป็น `false` เพื่อ
      ปิดใช้งาน
    - wrapper xAI ที่รวมมาด้วยจะตัดแฟล็ก strict tool-schema และคีย์ payload ของ reasoning
      ที่ไม่รองรับออกก่อนส่งคำขอ xAI แบบ native
    - `web_search`, `x_search` และ `code_execution` ถูกเปิดเผยเป็นเครื่องมือ OpenClaw
      OpenClaw จะเปิดใช้ built-in เฉพาะของ xAI ที่ต้องใช้ภายในคำขอของแต่ละเครื่องมือ
      แทนการแนบเครื่องมือ native ทั้งหมดไปกับทุกเทิร์นของแชต
    - Grok `web_search` อ่าน `plugins.entries.xai.config.webSearch.baseUrl`
      `x_search` อ่าน `plugins.entries.xai.config.xSearch.baseUrl` แล้วจึง
      fallback ไปยัง URL ฐานของการค้นหาเว็บ Grok
    - `x_search` และ `code_execution` เป็นของ Plugin xAI ที่รวมมาด้วย
      ไม่ได้ hardcode ไว้ใน runtime โมเดลหลัก
    - `code_execution` คือการประมวลผลใน sandbox ระยะไกลของ xAI ไม่ใช่
      [`exec`](/th/tools/exec) ในเครื่อง
  </Accordion>
</AccordionGroup>

## การทดสอบแบบ live

เส้นทางสื่อของ xAI ครอบคลุมด้วยการทดสอบหน่วยและชุดทดสอบ live ที่เลือกเปิดใช้ คำสั่ง live
จะโหลดความลับจาก login shell ของคุณ รวมถึง `~/.profile` ก่อนตรวจสอบ
`XAI_API_KEY`

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

ไฟล์ live เฉพาะผู้ให้บริการจะสังเคราะห์ TTS ปกติ, TTS แบบ PCM ที่เหมาะกับระบบโทรศัพท์,
ถอดเสียงผ่าน xAI batch STT, สตรีม PCM เดียวกันผ่าน xAI realtime STT,
สร้างผลลัพธ์ text-to-image และแก้ไขรูปภาพอ้างอิง ไฟล์ live รูปภาพแบบใช้ร่วมกันจะตรวจสอบ
ผู้ให้บริการ xAI เดียวกันผ่านเส้นทางการเลือก runtime, fallback, normalization และการแนบสื่อของ OpenClaw

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="Video generation" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอแบบใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="All providers" href="/th/providers/index" icon="grid-2">
    ภาพรวมผู้ให้บริการที่กว้างขึ้น
  </Card>
  <Card title="Troubleshooting" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาทั่วไปและวิธีแก้ไข
  </Card>
</CardGroup>
