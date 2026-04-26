---
read_when:
    - คุณต้องการใช้การสังเคราะห์เสียง Azure Speech สำหรับคำตอบขาออก
    - คุณต้องการเอาต์พุตเสียงบันทึกแบบ Ogg Opus ดั้งเดิมจาก Azure Speech
summary: การแปลงข้อความเป็นเสียงด้วย Azure AI Speech สำหรับคำตอบของ OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-04-26T11:39:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59baf0865e0eba1076ae5c074b5978e1f5f104b3395c816c30c546da41a303b9
    source_path: providers/azure-speech.md
    workflow: 15
---

Azure Speech เป็นผู้ให้บริการแปลงข้อความเป็นเสียงของ Azure AI Speech ใน OpenClaw
ระบบจะใช้สังเคราะห์เสียงคำตอบขาออกเป็น MP3 โดยค่าเริ่มต้น, เป็น Ogg/Opus แบบดั้งเดิมสำหรับ voice
notes และเป็นเสียง mulaw 8 kHz สำหรับช่องทางโทรศัพท์ เช่น Voice Call

OpenClaw ใช้ Azure Speech REST API โดยตรงร่วมกับ SSML และส่ง
รูปแบบเอาต์พุตที่ผู้ให้บริการกำหนดผ่าน `X-Microsoft-OutputFormat`

| Detail                  | Value                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| เว็บไซต์                | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| เอกสาร                  | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| การยืนยันตัวตน          | `AZURE_SPEECH_KEY` plus `AZURE_SPEECH_REGION`                                                                  |
| เสียงเริ่มต้น           | `en-US-JennyNeural`                                                                                            |
| เอาต์พุตไฟล์เริ่มต้น    | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| ไฟล์ voice note เริ่มต้น | `ogg-24khz-16bit-mono-opus`                                                                                    |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="สร้างทรัพยากร Azure Speech">
    ใน Azure portal ให้สร้างทรัพยากร Speech คัดลอก **KEY 1** จาก
    Resource Management > Keys and Endpoint และคัดลอกตำแหน่งของทรัพยากร
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
    ส่งคำตอบผ่านช่องทางที่เชื่อมต่อไว้ช่องทางใดก็ได้ OpenClaw จะสังเคราะห์เสียง
    ด้วย Azure Speech และส่งเป็น MP3 สำหรับเสียงมาตรฐาน หรือเป็น Ogg/Opus เมื่อ
    ช่องทางนั้นคาดหวัง voice note
  </Step>
</Steps>

## ตัวเลือกการกำหนดค่า

| Option                  | Path                                                        | Description                                                                                           |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | คีย์ทรัพยากร Azure Speech หากไม่มีจะ fallback ไปใช้ `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` หรือ `SPEECH_KEY` |
| `region`                | `messages.tts.providers.azure-speech.region`                | region ของทรัพยากร Azure Speech หากไม่มีจะ fallback ไปใช้ `AZURE_SPEECH_REGION` หรือ `SPEECH_REGION`                 |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | ตัวเลือก override สำหรับ endpoint/base URL ของ Azure Speech                                                     |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | ตัวเลือก override สำหรับ base URL ของ Azure Speech                                                              |
| `voice`                 | `messages.tts.providers.azure-speech.voice`                 | Azure voice ShortName (ค่าเริ่มต้น `en-US-JennyNeural`)                                                  |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | รหัสภาษา SSML (ค่าเริ่มต้น `en-US`)                                                                 |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | รูปแบบเอาต์พุตไฟล์เสียง (ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`)                                 |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | รูปแบบเอาต์พุต voice note (ค่าเริ่มต้น `ogg-24khz-16bit-mono-opus`)                                       |

## หมายเหตุ

<AccordionGroup>
  <Accordion title="การยืนยันตัวตน">
    Azure Speech ใช้คีย์ทรัพยากร Speech ไม่ใช่คีย์ Azure OpenAI โดยคีย์
    จะถูกส่งเป็น `Ocp-Apim-Subscription-Key`; OpenClaw จะสร้าง
    `https://<region>.tts.speech.microsoft.com` จาก `region` เว้นแต่คุณ
    จะระบุ `endpoint` หรือ `baseUrl`
  </Accordion>
  <Accordion title="ชื่อเสียง">
    ใช้ค่า `ShortName` ของเสียง Azure Speech เช่น
    `en-US-JennyNeural` ผู้ให้บริการที่มาพร้อมกันสามารถแสดงรายการเสียงผ่าน
    ทรัพยากร Speech เดียวกัน และจะกรองเสียงที่ถูกทำเครื่องหมายว่า deprecated หรือ retired ออก
  </Accordion>
  <Accordion title="เอาต์พุตเสียง">
    Azure รองรับรูปแบบเอาต์พุต เช่น `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` และ `riff-24khz-16bit-mono-pcm` OpenClaw
    จะขอ Ogg/Opus สำหรับเป้าหมาย `voice-note` เพื่อให้ช่องทางต่าง ๆ สามารถส่ง
    voice bubble แบบดั้งเดิมได้โดยไม่ต้องแปลงจาก MP3 เพิ่มเติม
  </Accordion>
  <Accordion title="Alias">
    `azure` ยอมรับเป็น alias ของผู้ให้บริการได้สำหรับ PR ที่มีอยู่และ config ของผู้ใช้
    แต่ config ใหม่ควรใช้ `azure-speech` เพื่อหลีกเลี่ยงความสับสนกับ
    ผู้ให้บริการโมเดล Azure OpenAI
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การแปลงข้อความเป็นเสียง" href="/th/tools/tts" icon="waveform-lines">
    ภาพรวม TTS, ผู้ให้บริการ และ config `messages.tts`
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าแบบเต็ม รวมถึงการตั้งค่า `messages.tts`
  </Card>
  <Card title="Providers" href="/th/providers" icon="grid">
    Providers ทั้งหมดของ OpenClaw ที่มาพร้อมกัน
  </Card>
  <Card title="การแก้ปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและขั้นตอนการดีบัก
  </Card>
</CardGroup>
