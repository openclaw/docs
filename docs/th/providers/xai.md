---
read_when:
    - คุณต้องการใช้โมเดล Grok ใน OpenClaw
    - คุณกำลังกำหนดค่าการยืนยันตัวตนของ xAI หรือรหัสโมเดล
summary: ใช้โมเดล xAI Grok ใน OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-06-27T18:18:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b89c1037f9800366c03bdd1313a8c4ff05e8675effa60ed1e2985d38f045aad4
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw มาพร้อม Plugin ผู้ให้บริการ `xai` แบบบันเดิลสำหรับโมเดล Grok สำหรับผู้ใช้ส่วนใหญ่
เส้นทางที่แนะนำคือ Grok OAuth พร้อมการสมัครสมาชิก SuperGrok หรือ X Premium
ที่เข้าเกณฑ์ OpenClaw ยังคงเน้นการทำงานบนเครื่องเป็นหลัก: Gateway, การกำหนดค่า, การกำหนดเส้นทาง และ
เครื่องมือจะทำงานบนเครื่องของคุณ ส่วนคำขอโมเดล Grok จะยืนยันตัวตนผ่าน xAI
และส่งไปยัง API ของ xAI

OAuth ไม่ต้องใช้คีย์ API ของ xAI และไม่ต้องใช้แอป Grok Build
xAI อาจยังแสดง Grok Build บนหน้าจอขอความยินยอม เนื่องจาก OpenClaw ใช้
OAuth client แบบใช้ร่วมกันของ xAI

## เลือกเส้นทางการตั้งค่าของคุณ

ใช้เส้นทางที่ตรงกับสถานะการติดตั้ง OpenClaw ของคุณ:

<Steps>
  <Step title="New OpenClaw install">
    เรียกใช้การเริ่มต้นใช้งานพร้อมติดตั้ง daemon เมื่อคุณกำลังตั้งค่า Gateway
    ภายในเครื่องใหม่ จากนั้นเลือกตัวเลือก xAI/Grok OAuth ในขั้นตอนโมเดล/การยืนยันตัวตน:

    ```bash
    openclaw onboard --install-daemon
    ```

    บน VPS หรือผ่าน SSH ให้เลือก xAI OAuth โดยตรง; OpenClaw ใช้การตรวจสอบด้วย device-code
    และไม่ต้องใช้ localhost callback:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    OAuth ไม่ต้องใช้คีย์ API ของ xAI OpenClaw ไม่ต้องใช้แอป Grok
    Build xAI อาจยังติดป้ายแอปขอความยินยอมเป็น Grok Build เนื่องจาก
    OpenClaw ใช้ OAuth client แบบใช้ร่วมกันของ xAI

  </Step>
  <Step title="Existing OpenClaw install">
    หากกำหนดค่า OpenClaw ไว้แล้ว ให้ลงชื่อเข้าใช้ xAI เท่านั้น อย่าเรียกใช้การเริ่มต้นใช้งานเต็มรูปแบบซ้ำ
    หรือติดตั้ง daemon ใหม่เพียงเพื่อเชื่อมต่อ Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    หากต้องการทำให้ Grok เป็นโมเดลเริ่มต้นหลังลงชื่อเข้าใช้ ให้ตั้งค่าแยกต่างหาก:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    เรียกใช้การเริ่มต้นใช้งานเต็มรูปแบบซ้ำเฉพาะเมื่อคุณตั้งใจจะเปลี่ยน Gateway,
    daemon, ช่องทาง, พื้นที่ทำงาน หรือตัวเลือกการตั้งค่าอื่น ๆ

  </Step>
  <Step title="API-key path">
    การตั้งค่าด้วยคีย์ API ยังคงใช้งานได้สำหรับคีย์ xAI Console และสำหรับพื้นผิวสื่อที่
    ต้องใช้การกำหนดค่าผู้ให้บริการที่มีคีย์รองรับ:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="Pick a model">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw ใช้ xAI Responses API เป็นการขนส่ง xAI แบบบันเดิล ข้อมูลรับรองเดียวกัน
จาก `openclaw models auth login --provider xai --method oauth` หรือ
`openclaw models auth login --provider xai --method api-key` ยังใช้ขับเคลื่อน
`web_search`, `x_search`, `code_execution` ระยะไกล และการสร้างภาพ/วิดีโอของ xAI
แบบ first-class ได้ด้วย
ขณะนี้เสียงพูดและการถอดเสียงต้องใช้ `XAI_API_KEY` หรือการกำหนดค่าผู้ให้บริการ
`web_search` ที่รองรับด้วย Grok จะเลือกใช้ xAI OAuth ก่อน และถอยกลับไปใช้ `XAI_API_KEY` หรือ
การกำหนดค่า Plugin web-search
หากคุณเก็บคีย์ xAI ไว้ใต้ `plugins.entries.xai.config.webSearch.apiKey`
ผู้ให้บริการโมเดล xAI แบบบันเดิลจะนำคีย์นั้นมาใช้เป็น fallback ด้วย
ตั้งค่า `plugins.entries.xai.config.webSearch.baseUrl` เพื่อกำหนดเส้นทาง Grok `web_search`
และโดยค่าเริ่มต้น `x_search` ผ่านพร็อกซี xAI Responses ของผู้ปฏิบัติการ
การปรับแต่ง `code_execution` อยู่ใต้ `plugins.entries.xai.config.codeExecution`
</Note>

## การแก้ปัญหา OAuth

- สำหรับ SSH, Docker, VPS หรือการตั้งค่าระยะไกลอื่น ๆ ให้ใช้
  `openclaw models auth login --provider xai --method oauth`; xAI OAuth ใช้
  การตรวจสอบด้วย device-code แทน localhost callback
- หากลงชื่อเข้าใช้สำเร็จแต่ Grok ไม่ใช่โมเดลเริ่มต้น ให้เรียกใช้
  `openclaw models set xai/grok-4.3`
- หากต้องการตรวจสอบโปรไฟล์การยืนยันตัวตน xAI ที่บันทึกไว้ ให้เรียกใช้:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI เป็นผู้ตัดสินใจว่าบัญชีใดสามารถรับ OAuth API tokens ได้ หากบัญชีไม่
  เข้าเกณฑ์ ให้ลองใช้เส้นทางคีย์ API หรือตรวจสอบการสมัครสมาชิกฝั่ง xAI

<Tip>
ใช้ `xai-oauth` เมื่อลงชื่อเข้าใช้จาก SSH, Docker หรือ VPS OpenClaw จะแสดง
URL ของ xAI และรหัสสั้น ๆ; ดำเนินการลงชื่อเข้าใช้ให้เสร็จในเบราว์เซอร์ภายในเครื่องใดก็ได้ ขณะที่กระบวนการระยะไกล
poll xAI เพื่อแลกเปลี่ยน token ให้เสร็จสมบูรณ์
</Tip>

## แค็ตตาล็อกในตัว

OpenClaw มีโมเดลแชต xAI ปัจจุบันมาให้ตั้งแต่ต้น โดยเรียงจากใหม่ที่สุด
ก่อนในตัวเลือกโมเดล:

| ตระกูล         | ID โมเดล                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

Plugin ยังคง forward-resolve slug เก่าอย่าง Grok 3, Grok 4, Grok 4 Fast, Grok 4.1
Fast และ Grok Code สำหรับการกำหนดค่าที่มีอยู่ alias อย่างเป็นทางการของ Grok Code Fast
จะ normalize เป็น `grok-build-0.1`; OpenClaw จะไม่แสดง slug upstream ที่เลิกใช้แล้วอื่น ๆ
ในแค็ตตาล็อกที่เลือกได้อีกต่อไป

<Tip>
ใช้ `grok-4.3` สำหรับแชตทั่วไป และ `grok-build-0.1` สำหรับ workload ที่เน้นการ build/เขียนโค้ด
เว้นแต่คุณต้องใช้ alias เบต้าของ Grok 4.20 โดยเฉพาะ
</Tip>

## การครอบคลุมฟีเจอร์ของ OpenClaw

Plugin แบบบันเดิลจะแมปพื้นผิว API สาธารณะปัจจุบันของ xAI เข้ากับสัญญา
ผู้ให้บริการและเครื่องมือแบบใช้ร่วมกันของ OpenClaw ความสามารถที่ไม่เข้ากับสัญญาแบบใช้ร่วมกัน
(เช่น streaming TTS และเสียงแบบ realtime) จะไม่ถูกเปิดเผย - ดูตาราง
ด้านล่าง

| ความสามารถของ xAI             | พื้นผิว OpenClaw                          | สถานะ                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | ผู้ให้บริการโมเดล `xai/<model>`              | ใช่                                                                 |
| การค้นเว็บฝั่งเซิร์ฟเวอร์     | ผู้ให้บริการ `web_search` `grok`              | ใช่                                                                 |
| การค้น X ฝั่งเซิร์ฟเวอร์       | เครื่องมือ `x_search`                           | ใช่                                                                 |
| การรันโค้ดฝั่งเซิร์ฟเวอร์ | เครื่องมือ `code_execution`                     | ใช่                                                                 |
| รูปภาพ                     | `image_generate`                          | ใช่                                                                 |
| วิดีโอ                     | `video_generate`                          | ใช่                                                                 |
| Batch text-to-speech       | `messages.tts.provider: "xai"` / `tts`    | ใช่                                                                 |
| Streaming TTS              | -                                         | ไม่เปิดเผย; สัญญา TTS ของ OpenClaw ส่งคืนบัฟเฟอร์เสียงที่สมบูรณ์ |
| Batch speech-to-text       | `tools.media.audio` / ความเข้าใจสื่อ | ใช่                                                                 |
| Streaming speech-to-text   | Voice Call `streaming.provider: "xai"`    | ใช่                                                                 |
| เสียงแบบ Realtime             | -                                         | ยังไม่เปิดเผย; ใช้สัญญา session/WebSocket ที่แตกต่างกัน               |
| ไฟล์ / batches            | เฉพาะความเข้ากันได้กับ API โมเดลทั่วไป      | ไม่ใช่เครื่องมือ OpenClaw แบบ first-class                                     |

<Note>
OpenClaw ใช้ REST API ของ xAI สำหรับ image/video/TTS/STT เพื่อสร้างสื่อ,
เสียงพูด และการถอดเสียงแบบ batch, ใช้ WebSocket STT แบบ streaming ของ xAI สำหรับการถอดเสียง
voice-call แบบ live และใช้ Responses API สำหรับโมเดล, การค้นหา และ
เครื่องมือ code-execution ฟีเจอร์ที่ต้องใช้สัญญา OpenClaw ที่แตกต่างกัน เช่น
session เสียง Realtime จะถูกบันทึกไว้ที่นี่ในฐานะความสามารถ upstream แทนที่จะเป็น
พฤติกรรม Plugin ที่ซ่อนอยู่
</Note>

### การแมปโหมดเร็ว

`/fast on` หรือ `agents.defaults.models["xai/<model>"].params.fastMode: true`
จะเขียนคำขอ xAI แบบ native ใหม่ดังนี้:

| โมเดลต้นทาง  | เป้าหมายโหมดเร็ว   |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### alias ความเข้ากันได้แบบ legacy

alias แบบ legacy ยังคง normalize ไปยัง ID แบบบันเดิลที่เป็น canonical:

| alias แบบ legacy              | ID canonical                          |
| ------------------------- | ------------------------------------- |
| `grok-code-fast-1`        | `grok-build-0.1`                      |
| `grok-code-fast`          | `grok-build-0.1`                      |
| `grok-code-fast-1-0825`   | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## ฟีเจอร์

<AccordionGroup>
  <Accordion title="Web search">
    ผู้ให้บริการ web-search `grok` แบบบันเดิลจะเลือกใช้ xAI OAuth ก่อน แล้วจึงถอยกลับ
    ไปใช้ `XAI_API_KEY` หรือคีย์ web-search ของ Plugin:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Video generation">
    Plugin `xai` แบบบันเดิลลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือแบบใช้ร่วมกัน
    `video_generate`

    - โมเดลวิดีโอเริ่มต้น: `xai/grok-imagine-video`
    - โหมด: text-to-video, image-to-video, การสร้าง reference-image, การแก้ไขวิดีโอระยะไกล
      และการต่อขยายวิดีโอระยะไกล
    - อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - ความละเอียด: `480P`, `720P`
    - ระยะเวลา: 1-15 วินาทีสำหรับการสร้าง/image-to-video, 1-10 วินาทีเมื่อ
      ใช้บทบาท `reference_image`, 2-10 วินาทีสำหรับการต่อขยาย
    - การสร้าง reference-image: ตั้งค่า `imageRoles` เป็น `reference_image` สำหรับ
      รูปภาพที่ให้มาทุกภาพ; xAI รับรูปภาพดังกล่าวได้สูงสุด 7 ภาพ
    - timeout การดำเนินการเริ่มต้น: 600 วินาที เว้นแต่จะตั้งค่า `video_generate.timeoutMs`
      หรือ `agents.defaults.videoGenerationModel.timeoutMs`

    <Warning>
    ไม่รองรับบัฟเฟอร์วิดีโอภายในเครื่อง ใช้ URL `http(s)` ระยะไกลสำหรับ
    อินพุตแก้ไข/ต่อขยายวิดีโอ image-to-video รองรับบัฟเฟอร์รูปภาพภายในเครื่อง เพราะ
    OpenClaw สามารถเข้ารหัสเป็น data URL สำหรับ xAI ได้
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
    ดู [Video Generation](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือแบบใช้ร่วมกัน,
    การเลือกผู้ให้บริการ และพฤติกรรม failover
    </Note>

  </Accordion>

  <Accordion title="Image generation">
    Plugin `xai` แบบบันเดิลลงทะเบียนการสร้างรูปภาพผ่านเครื่องมือแบบใช้ร่วมกัน
    `image_generate`

    - โมเดลรูปภาพเริ่มต้น: `xai/grok-imagine-image`
    - โมเดลเพิ่มเติม: `xai/grok-imagine-image-quality`
    - โหมด: text-to-image และการแก้ไข reference-image
    - อินพุตอ้างอิง: `image` หนึ่งรายการ หรือ `images` สูงสุดห้ารายการ
    - อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - ความละเอียด: `1K`, `2K`
    - จำนวน: สูงสุด 4 รูปภาพ
    - timeout การดำเนินการเริ่มต้น: 600 วินาที เว้นแต่จะตั้งค่า `image_generate.timeoutMs`
      หรือ `agents.defaults.imageGenerationModel.timeoutMs`

    OpenClaw ขอการตอบกลับรูปภาพแบบ `b64_json` จาก xAI เพื่อให้สื่อที่สร้างขึ้นสามารถ
    จัดเก็บและส่งผ่านเส้นทางไฟล์แนบของช่องทางปกติได้ รูปภาพอ้างอิงภายในเครื่อง
    จะถูกแปลงเป็น data URL; การอ้างอิง `http(s)` ระยะไกลจะถูกส่งผ่านตามเดิม

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
    xAI ยังจัดทำเอกสารสำหรับ `quality`, `mask`, `user` และอัตราส่วนเนทีฟเพิ่มเติม
    เช่น `1:2`, `2:1`, `9:20` และ `20:9` ปัจจุบัน OpenClaw ส่งต่อเฉพาะ
    ตัวควบคุมรูปภาพแบบข้ามผู้ให้บริการที่ใช้ร่วมกันเท่านั้น; ปุ่มปรับแต่งที่เป็นเนทีฟเท่านั้นและยังไม่รองรับ
    จึงตั้งใจไม่เปิดให้ใช้ผ่าน `image_generate`
    </Note>

  </Accordion>

  <Accordion title="ข้อความเป็นเสียงพูด">
    Plugin `xai` ที่รวมมาให้ลงทะเบียนข้อความเป็นเสียงพูดผ่านพื้นผิวผู้ให้บริการ `tts`
    ที่ใช้ร่วมกัน

    - เสียง: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - เสียงเริ่มต้น: `eve`
    - รูปแบบ: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - ภาษา: รหัส BCP-47 หรือ `auto`
    - ความเร็ว: การแทนที่ความเร็วแบบเนทีฟของผู้ให้บริการ
    - ไม่รองรับรูปแบบข้อความเสียง Opus แบบเนทีฟ

    หากต้องการใช้ xAI เป็นผู้ให้บริการ TTS เริ่มต้น:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              speakerVoiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw ใช้ปลายทางแบบแบตช์ `/v1/tts` ของ xAI นอกจากนี้ xAI ยังมี TTS แบบสตรีม
    ผ่าน WebSocket แต่สัญญาผู้ให้บริการเสียงพูดของ OpenClaw ในปัจจุบันคาดว่าจะได้รับ
    บัฟเฟอร์เสียงที่สมบูรณ์ก่อนส่งคำตอบ
    </Note>

  </Accordion>

  <Accordion title="เสียงพูดเป็นข้อความ">
    Plugin `xai` ที่รวมมาให้ลงทะเบียนเสียงพูดเป็นข้อความแบบแบตช์ผ่านพื้นผิวการถอดเสียง
    เพื่อทำความเข้าใจสื่อของ OpenClaw

    - โมเดลเริ่มต้น: `grok-stt`
    - ปลายทาง: xAI REST `/v1/stt`
    - เส้นทางอินพุต: การอัปโหลดไฟล์เสียงแบบ multipart
    - OpenClaw รองรับทุกที่ที่การถอดเสียงขาเข้าใช้
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

    สามารถระบุภาษาได้ผ่านการกำหนดค่าสื่อเสียงที่ใช้ร่วมกัน หรือผ่านคำขอถอดเสียง
    รายครั้ง พื้นผิว OpenClaw ที่ใช้ร่วมกันยอมรับคำใบ้พรอมป์ แต่การผสานรวม xAI REST STT
    จะส่งต่อเฉพาะไฟล์ โมเดล และภาษา เพราะสิ่งเหล่านี้แมปกับปลายทาง xAI สาธารณะ
    ในปัจจุบันได้อย่างชัดเจน

  </Accordion>

  <Accordion title="เสียงพูดเป็นข้อความแบบสตรีม">
    Plugin `xai` ที่รวมมาให้ยังลงทะเบียนผู้ให้บริการถอดเสียงแบบเรียลไทม์
    สำหรับเสียงการโทรสด

    - ปลายทาง: xAI WebSocket `wss://api.x.ai/v1/stt`
    - การเข้ารหัสเริ่มต้น: `mulaw`
    - อัตราสุ่มตัวอย่างเริ่มต้น: `8000`
    - การกำหนดจุดสิ้นสุดเริ่มต้น: `800ms`
    - ข้อความถอดเสียงระหว่างทาง: เปิดใช้เป็นค่าเริ่มต้น

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

    การกำหนดค่าที่ผู้ให้บริการเป็นเจ้าของอยู่ภายใต้
    `plugins.entries.voice-call.config.streaming.providers.xai` คีย์ที่รองรับคือ
    `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` หรือ
    `alaw`), `interimResults`, `endpointingMs` และ `language`

    <Note>
    ผู้ให้บริการสตรีมนี้มีไว้สำหรับเส้นทางการถอดเสียงแบบเรียลไทม์ของ Voice Call
    ปัจจุบันเสียงของ Discord บันทึกเป็นเซกเมนต์สั้นๆ และใช้เส้นทางการถอดเสียงแบบแบตช์
    `tools.media.audio` แทน
    </Note>

  </Accordion>

  <Accordion title="การกำหนดค่า x_search">
    Plugin xAI ที่รวมมาให้เปิดเผย `x_search` เป็นเครื่องมือของ OpenClaw สำหรับค้นหา
    เนื้อหา X (เดิมคือ Twitter) ผ่าน Grok

    เส้นทางการกำหนดค่า: `plugins.entries.xai.config.xSearch`

    | คีย์               | ประเภท   | ค่าเริ่มต้น        | คำอธิบาย                            |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | เปิดหรือปิดใช้ x_search             |
    | `model`            | string  | `grok-4-1-fast`    | โมเดลที่ใช้สำหรับคำขอ x_search      |
    | `baseUrl`          | string  | -                  | การแทนที่ URL ฐานของ xAI Responses |
    | `inlineCitations`  | boolean | -                  | รวมการอ้างอิงแบบอินไลน์ในผลลัพธ์   |
    | `maxTurns`         | number  | -                  | จำนวนรอบสนทนาสูงสุด                 |
    | `timeoutSeconds`   | number  | -                  | หมดเวลาคำขอเป็นวินาที               |
    | `cacheTtlMinutes`  | number  | -                  | อายุการใช้งานแคชเป็นนาที            |

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

  <Accordion title="การกำหนดค่าการเรียกใช้โค้ด">
    Plugin xAI ที่รวมมาให้เปิดเผย `code_execution` เป็นเครื่องมือของ OpenClaw สำหรับ
    การเรียกใช้โค้ดระยะไกลในสภาพแวดล้อมแซนด์บ็อกซ์ของ xAI

    เส้นทางการกำหนดค่า: `plugins.entries.xai.config.codeExecution`

    | คีย์              | ประเภท   | ค่าเริ่มต้น               | คำอธิบาย                              |
    | ----------------- | ------- | ------------------------- | ---------------------------------------- |
    | `enabled`         | boolean | `true` (หากมีคีย์พร้อมใช้) | เปิดหรือปิดใช้การเรียกใช้โค้ด       |
    | `model`           | string  | `grok-4-1-fast`           | โมเดลที่ใช้สำหรับคำขอเรียกใช้โค้ด     |
    | `maxTurns`        | number  | -                         | จำนวนรอบสนทนาสูงสุด                    |
    | `timeoutSeconds`  | number  | -                         | หมดเวลาคำขอเป็นวินาที                  |

    <Note>
    นี่คือการเรียกใช้แซนด์บ็อกซ์ xAI ระยะไกล ไม่ใช่ [`exec`](/th/tools/exec) ภายในเครื่อง
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
    - การยืนยันตัวตน xAI สามารถใช้คีย์ API, ตัวแปรสภาพแวดล้อม, ค่าถอยกลับจากการกำหนดค่า Plugin
      หรือ OAuth กับบัญชี xAI ที่เข้าเกณฑ์ OAuth ใช้การยืนยันด้วยรหัสอุปกรณ์
      โดยไม่มี callback localhost xAI เป็นผู้ตัดสินว่าบัญชีใดรับโทเค็น API
      ผ่าน OAuth ได้ และหน้าความยินยอมอาจแสดง Grok Build แม้ว่า OpenClaw
      จะไม่ต้องใช้แอป Grok Build
    - ปัจจุบัน OpenClaw ยังไม่เปิดเผยตระกูลโมเดลหลายเอเจนต์ของ xAI xAI
      ให้บริการโมเดลเหล่านี้ผ่าน Responses API แต่โมเดลเหล่านี้ไม่รับ
      เครื่องมือฝั่งไคลเอนต์หรือเครื่องมือกำหนดเองที่ลูปเอเจนต์ร่วมของ OpenClaw ใช้ ดู
      [ข้อจำกัดหลายเอเจนต์ของ xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations)
    - เสียง xAI Realtime ยังไม่ได้ลงทะเบียนเป็นผู้ให้บริการ OpenClaw
      จำเป็นต้องมีสัญญาเซสชันเสียงสองทิศทางที่ต่างจาก STT แบบแบตช์หรือ
      การถอดเสียงแบบสตรีม
    - รูปภาพ xAI `quality`, รูปภาพ `mask` และอัตราส่วนภาพเพิ่มเติมที่เป็นเนทีฟเท่านั้น
      จะไม่ถูกเปิดเผยจนกว่าเครื่องมือ `image_generate` ที่ใช้ร่วมกันจะมี
      ตัวควบคุมแบบข้ามผู้ให้บริการที่สอดคล้องกัน
  </Accordion>

  <Accordion title="หมายเหตุขั้นสูง">
    - OpenClaw ใช้การแก้ไขความเข้ากันได้ของสคีมาเครื่องมือและการเรียกเครื่องมือเฉพาะ xAI
      โดยอัตโนมัติบนเส้นทางตัวรันที่ใช้ร่วมกัน
    - คำขอ xAI แบบเนทีฟตั้งค่าเริ่มต้นเป็น `tool_stream: true` ตั้งค่า
      `agents.defaults.models["xai/<model>"].params.tool_stream` เป็น `false` เพื่อ
      ปิดใช้
    - ตัวห่อ xAI ที่รวมมาให้จะตัดแฟล็กสคีมาเครื่องมือแบบเข้มงวดที่ไม่รองรับ และ
      คีย์เพย์โหลด *effort* สำหรับการให้เหตุผลออกก่อนส่งคำขอ xAI แบบเนทีฟ มีเพียง
      `grok-4.3` / `grok-4.3-*` เท่านั้นที่ประกาศว่าสามารถกำหนด effort สำหรับการให้เหตุผลได้; โมเดล xAI
      อื่นทั้งหมดที่มีความสามารถในการให้เหตุผลยังคงขอ
      `include: ["reasoning.encrypted_content"]` เพื่อให้สามารถเล่นซ้ำการให้เหตุผลที่เข้ารหัสก่อนหน้า
      ในรอบติดตามผลได้
    - `web_search`, `x_search` และ `code_execution` ถูกเปิดเผยเป็นเครื่องมือของ OpenClaw
      OpenClaw เปิดใช้ built-in เฉพาะของ xAI ที่ต้องการภายในคำขอเครื่องมือแต่ละรายการ
      แทนที่จะผูกเครื่องมือเนทีฟทั้งหมดเข้ากับทุกๆ รอบแชต
    - Grok `web_search` อ่าน `plugins.entries.xai.config.webSearch.baseUrl`
      `x_search` อ่าน `plugins.entries.xai.config.xSearch.baseUrl` แล้ว
      ถอยกลับไปใช้ URL ฐานของ Grok web-search
    - `x_search` และ `code_execution` เป็นของ Plugin xAI ที่รวมมาให้
      แทนที่จะ hardcode ลงในรันไทม์โมเดลหลัก
    - `code_execution` คือการเรียกใช้แซนด์บ็อกซ์ xAI ระยะไกล ไม่ใช่
      [`exec`](/th/tools/exec) ภายในเครื่อง
  </Accordion>
</AccordionGroup>

## การทดสอบสด

เส้นทางสื่อ xAI ครอบคลุมด้วยยูนิตเทสต์และชุดทดสอบสดแบบเลือกเปิดใช้ ส่งออก
`XAI_API_KEY` ในสภาพแวดล้อมของกระบวนการก่อนรันโพรบสด

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

ไฟล์สดเฉพาะผู้ให้บริการสังเคราะห์ TTS ปกติ, TTS แบบ PCM ที่เป็นมิตรกับโทรศัพท์,
ถอดเสียงผ่าน xAI batch STT, สตรีม PCM เดียวกันผ่าน xAI realtime STT,
สร้างผลลัพธ์ข้อความเป็นรูปภาพ และแก้ไขรูปภาพอ้างอิง ไฟล์สดรูปภาพที่ใช้ร่วมกัน
ตรวจสอบผู้ให้บริการ xAI เดียวกันผ่านเส้นทางการเลือก รันไทม์ ค่าถอยกลับ
การทำให้เป็นมาตรฐาน และไฟล์แนบสื่อของ OpenClaw

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="ผู้ให้บริการทั้งหมด" href="/th/providers/index" icon="grid-2">
    ภาพรวมผู้ให้บริการที่กว้างขึ้น
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาและการแก้ไขทั่วไป
  </Card>
</CardGroup>
