---
read_when:
    - คุณต้องการใช้การสังเคราะห์เสียงของ Azure Speech สำหรับการตอบกลับขาออก
    - คุณต้องใช้เอาต์พุตบันทึกเสียง Ogg Opus แบบเนทีฟจาก Azure Speech
summary: การอ่านออกเสียงข้อความของ Azure AI Speech สำหรับการตอบกลับของ OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-06-27T18:10:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c14b1f3c2fda9b2f820e537d7133b1dbf71573b7d735207c6a4ca19432a8d8c3
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech เป็นผู้ให้บริการแปลงข้อความเป็นเสียงของ Azure AI Speech ใน OpenClaw จะ
สังเคราะห์เสียงตอบกลับขาออกเป็น MP3 ตามค่าเริ่มต้น, Ogg/Opus แบบเนทีฟสำหรับข้อความเสียง,
และเสียง mulaw 8 kHz สำหรับช่องทางโทรศัพท์ เช่น Voice Call

OpenClaw ใช้ Azure Speech REST API โดยตรงพร้อม SSML และส่งรูปแบบเอาต์พุต
ที่ผู้ให้บริการเป็นเจ้าของผ่าน `X-Microsoft-OutputFormat`

| รายละเอียด              | ค่า                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| เว็บไซต์                | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| เอกสาร                  | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| การยืนยันตัวตน          | `AZURE_SPEECH_KEY` พร้อม `AZURE_SPEECH_REGION`                                                                |
| เสียงเริ่มต้น           | `en-US-JennyNeural`                                                                                            |
| เอาต์พุตไฟล์เริ่มต้น    | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| ไฟล์ข้อความเสียงเริ่มต้น | `ogg-24khz-16bit-mono-opus`                                                                                    |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="สร้างทรัพยากร Azure Speech">
    ในพอร์ทัล Azure ให้สร้างทรัพยากร Speech คัดลอก **KEY 1** จาก
    Resource Management > Keys and Endpoint และคัดลอกตำแหน่งที่ตั้งของทรัพยากร
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
              speakerVoice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="ส่งข้อความ">
    ส่งการตอบกลับผ่านช่องทางที่เชื่อมต่อใดก็ได้ OpenClaw จะสังเคราะห์เสียง
    ด้วย Azure Speech และส่ง MP3 สำหรับเสียงมาตรฐาน หรือ Ogg/Opus เมื่อ
    ช่องทางคาดว่าจะเป็นข้อความเสียง
  </Step>
</Steps>

## ตัวเลือกการกำหนดค่า

| ตัวเลือก                | พาธ                                                        | คำอธิบาย                                                                                               |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | คีย์ทรัพยากร Azure Speech ถอยกลับไปใช้ `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` หรือ `SPEECH_KEY` |
| `region`                | `messages.tts.providers.azure-speech.region`                | ภูมิภาคของทรัพยากร Azure Speech ถอยกลับไปใช้ `AZURE_SPEECH_REGION` หรือ `SPEECH_REGION`             |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | การแทนที่ endpoint/base URL ของ Azure Speech ที่เป็นทางเลือก                                         |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | การแทนที่ base URL ของ Azure Speech ที่เป็นทางเลือก                                                  |
| `speakerVoice`          | `messages.tts.providers.azure-speech.speakerVoice`          | ShortName ของเสียง Azure (ค่าเริ่มต้น `en-US-JennyNeural`) ชื่อแฝงเดิม: `voice`                      |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | โค้ดภาษา SSML (ค่าเริ่มต้น `en-US`)                                                                  |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | รูปแบบเอาต์พุตไฟล์เสียง (ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`)                              |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | รูปแบบเอาต์พุตข้อความเสียง (ค่าเริ่มต้น `ogg-24khz-16bit-mono-opus`)                                 |

## หมายเหตุ

<AccordionGroup>
  <Accordion title="การยืนยันตัวตน">
    Azure Speech ใช้คีย์ทรัพยากร Speech ไม่ใช่คีย์ Azure OpenAI คีย์จะถูกส่งเป็น
    `Ocp-Apim-Subscription-Key`; OpenClaw จะอนุมาน
    `https://<region>.tts.speech.microsoft.com` จาก `region` เว้นแต่คุณจะ
    ระบุ `endpoint` หรือ `baseUrl`
  </Accordion>
  <Accordion title="ชื่อเสียง">
    ใช้ค่า `ShortName` ของเสียง Azure Speech ตัวอย่างเช่น
    `en-US-JennyNeural` ผู้ให้บริการที่รวมมาด้วยสามารถแสดงรายการเสียงผ่าน
    ทรัพยากร Speech เดียวกัน และกรองเสียงที่ถูกทำเครื่องหมายว่าเลิกใช้หรือยุติแล้ว
  </Accordion>
  <Accordion title="เอาต์พุตเสียง">
    Azure ยอมรับรูปแบบเอาต์พุต เช่น `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` และ `riff-24khz-16bit-mono-pcm` OpenClaw
    จะขอ Ogg/Opus สำหรับเป้าหมาย `voice-note` เพื่อให้ช่องทางส่ง
    ฟองข้อความเสียงแบบเนทีฟได้โดยไม่ต้องแปลง MP3 เพิ่มเติม
  </Accordion>
  <Accordion title="ชื่อแฝง">
    `azure` ได้รับการยอมรับเป็นชื่อแฝงของผู้ให้บริการสำหรับ PR ที่มีอยู่และการกำหนดค่าของผู้ใช้
    แต่การกำหนดค่าใหม่ควรใช้ `azure-speech` เพื่อหลีกเลี่ยงความสับสนกับผู้ให้บริการโมเดล
    Azure OpenAI
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="แปลงข้อความเป็นเสียง" href="/th/tools/tts" icon="waveform-lines">
    ภาพรวม TTS, ผู้ให้บริการ และการกำหนดค่า `messages.tts`
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่าแบบเต็ม รวมถึงการตั้งค่า `messages.tts`
  </Card>
  <Card title="ผู้ให้บริการ" href="/th/providers" icon="grid">
    ผู้ให้บริการ OpenClaw ที่รวมมาทั้งหมด
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาทั่วไปและขั้นตอนการดีบัก
  </Card>
</CardGroup>
