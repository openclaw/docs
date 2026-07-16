---
read_when:
    - คุณต้องการใช้การสังเคราะห์เสียงพูดของ Azure สำหรับการตอบกลับขาออก
    - คุณต้องการเอาต์พุตข้อความเสียง Ogg Opus แบบเนทีฟจาก Azure Speech
summary: การแปลงข้อความเป็นเสียงด้วย Azure AI Speech สำหรับการตอบกลับของ OpenClaw
title: เสียงพูด Azure
x-i18n:
    generated_at: "2026-07-16T19:39:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5eab231afee8f606c5257465f958d42838efab7fde1642578cad987c564c700
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech เป็นผู้ให้บริการแปลงข้อความเป็นเสียงพูดของ Azure AI Speech ที่รวมมาให้ OpenClaw
เรียกใช้ Azure Speech REST API โดยตรงด้วย SSML เพื่อสังเคราะห์ MP3 สำหรับ
การตอบกลับมาตรฐาน, Ogg/Opus แบบเนทีฟสำหรับข้อความเสียง และ mulaw 8 kHz สำหรับ
ช่องทางโทรศัพท์ เช่น Voice Call คำขอจะส่งรูปแบบเอาต์พุตที่ผู้ให้บริการเป็นเจ้าของ
ผ่านส่วนหัว `X-Microsoft-OutputFormat`

| รายละเอียด                  | ค่า                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| ID ผู้ให้บริการ             | `azure-speech` (นามแฝง: `azure`)                                                                                |
| เว็บไซต์                 | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| เอกสาร                    | [การแปลงข้อความเป็นเสียงพูดด้วย Speech REST](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| การยืนยันตัวตน                    | `AZURE_SPEECH_KEY` ร่วมกับ `AZURE_SPEECH_REGION`                                                                  |
| เสียงเริ่มต้น           | `en-US-JennyNeural`                                                                                            |
| เอาต์พุตไฟล์เริ่มต้น     | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| ไฟล์ข้อความเสียงเริ่มต้น | `ogg-24khz-16bit-mono-opus`                                                                                    |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="สร้างทรัพยากร Azure Speech">
    ในพอร์ทัล Azure ให้สร้างทรัพยากร Speech คัดลอก **KEY 1** จาก
    Resource Management > Keys and Endpoint แล้วคัดลอกตำแหน่งที่ตั้งของทรัพยากร
    เช่น `eastus`

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="เลือก Azure Speech ใน messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              voice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="ส่งข้อความ">
    ส่งการตอบกลับผ่านช่องทางที่เชื่อมต่ออยู่ช่องทางใดก็ได้ OpenClaw จะสังเคราะห์เสียง
    ด้วย Azure Speech และส่ง MP3 สำหรับเสียงมาตรฐาน หรือ Ogg/Opus เมื่อ
    ช่องทางต้องการข้อความเสียง
  </Step>
</Steps>

## ตัวเลือกการกำหนดค่า

ตัวเลือกทั้งหมดอยู่ภายใต้ `messages.tts.providers["azure-speech"]`

| ตัวเลือก                  | คำอธิบาย                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | คีย์ทรัพยากร Azure Speech หากไม่ได้ตั้งค่าจะใช้ `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` หรือ `SPEECH_KEY` แทน |
| `region`                | ภูมิภาคของทรัพยากร Azure Speech หากไม่ได้ตั้งค่าจะใช้ `AZURE_SPEECH_REGION` หรือ `SPEECH_REGION` แทน                 |
| `endpoint`              | การแทนที่ปลายทาง Azure Speech ที่กำหนดหรือไม่ก็ได้ หากไม่ได้ตั้งค่าจะใช้ `AZURE_SPEECH_ENDPOINT` ที่เชื่อถือได้แทน               |
| `baseUrl`               | การแทนที่ URL ฐานของ Azure Speech ที่กำหนดหรือไม่ก็ได้                                                              |
| `voice`                 | ShortName ของเสียง Azure (ค่าเริ่มต้น `en-US-JennyNeural`) นามแฝงแบบเดิม: `voiceId`                         |
| `lang`                  | รหัสภาษา SSML (ค่าเริ่มต้น `en-US`)                                                                 |
| `outputFormat`          | รูปแบบเอาต์พุตไฟล์เสียง (ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`)                                 |
| `voiceNoteOutputFormat` | รูปแบบเอาต์พุตข้อความเสียง (ค่าเริ่มต้น `ogg-24khz-16bit-mono-opus`)                                       |
| `timeoutMs`             | การแทนที่ระยะหมดเวลาของคำขอเป็นมิลลิวินาที หากไม่ได้ตั้งค่าจะใช้ `messages.tts.timeoutMs` ส่วนกลางแทน          |

ระบบจะถือว่าผู้ให้บริการได้รับการกำหนดค่าแล้วเมื่อตั้งค่า `apiKey` พร้อมกับหนึ่งใน
`region`, `endpoint` หรือ `baseUrl` ระบบจะตรวจสอบตัวแปรสภาพแวดล้อมเป็นทางเลือกสำรอง
เฉพาะสำหรับคีย์การกำหนดค่าที่ยังไม่ได้ตั้งค่าเท่านั้น ไฟล์ `.env` ของเวิร์กสเปซไม่สามารถตั้งค่า
`AZURE_SPEECH_ENDPOINT` ได้ ให้ใช้สภาพแวดล้อมของกระบวนการ, dotenv ของรันไทม์ส่วนกลาง
หรือการกำหนดค่าอย่างชัดเจนสำหรับการกำหนดเส้นทางปลายทาง

## หมายเหตุ

<AccordionGroup>
  <Accordion title="การยืนยันตัวตน">
    Azure Speech ใช้คีย์ทรัพยากร Speech ไม่ใช่คีย์ Azure OpenAI โดยจะส่งคีย์
    เป็น `Ocp-Apim-Subscription-Key`; OpenClaw จะอนุมาน
    `https://<region>.tts.speech.microsoft.com` จาก `region` เว้นแต่จะ
    ระบุ `endpoint` หรือ `baseUrl`
  </Accordion>
  <Accordion title="ชื่อเสียง">
    ใช้ค่า `ShortName` ของเสียง Azure Speech เช่น
    `en-US-JennyNeural` ผู้ให้บริการที่รวมมาให้สามารถแสดงรายการเสียงผ่าน
    ทรัพยากร Speech เดียวกัน และกรองเสียงที่ทำเครื่องหมายว่าเลิกสนับสนุน เลิกใช้งาน
    หรือปิดใช้งานออก
  </Accordion>
  <Accordion title="เอาต์พุตเสียง">
    Azure รองรับรูปแบบเอาต์พุต เช่น `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` และ `riff-24khz-16bit-mono-pcm` OpenClaw
    จะขอ Ogg/Opus สำหรับเป้าหมาย `voice-note` เพื่อให้ช่องทางส่ง
    บับเบิลเสียงแบบเนทีฟได้โดยไม่ต้องแปลงเป็น MP3 เพิ่มเติม และบังคับใช้
    `raw-8khz-8bit-mono-mulaw` สำหรับเป้าหมายโทรศัพท์
  </Accordion>
  <Accordion title="นามแฝง">
    ระบบยอมรับ `azure` เป็นนามแฝงของผู้ให้บริการสำหรับการกำหนดค่าที่มีอยู่ แต่การกำหนดค่าใหม่
    ควรใช้ `azure-speech` เพื่อหลีกเลี่ยงความสับสนกับผู้ให้บริการโมเดล
    Azure OpenAI
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การแปลงข้อความเป็นเสียงพูด" href="/th/tools/tts" icon="waveform-lines">
    ภาพรวม TTS, ผู้ให้บริการ และการกำหนดค่า `messages.tts`
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่าฉบับเต็ม รวมถึงการตั้งค่า `messages.tts`
  </Card>
  <Card title="ผู้ให้บริการ" href="/th/providers" icon="grid">
    ผู้ให้บริการ OpenClaw ทั้งหมดที่รวมมาให้
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและขั้นตอนการดีบัก
  </Card>
</CardGroup>
