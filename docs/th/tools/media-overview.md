---
read_when:
    - กำลังมองหาภาพรวมของความสามารถด้านสื่อ
    - การตัดสินใจว่าจะกำหนดค่า media provider ใด
    - ทำความเข้าใจว่าการสร้างสื่อแบบ async ทำงานอย่างไร
summary: หน้าเริ่มต้นแบบรวมศูนย์สำหรับความสามารถด้านการสร้างสื่อ การทำความเข้าใจสื่อ และการสังเคราะห์เสียงพูด
title: ภาพรวมสื่อ
x-i18n:
    generated_at: "2026-04-25T14:00:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: c674df701b88c807842078b2e2e53821f1b2fc6037fd2e4d688caea147e769f1
    source_path: tools/media-overview.md
    workflow: 15
---

# การสร้างและทำความเข้าใจสื่อ

OpenClaw สามารถสร้างรูปภาพ วิดีโอ และเพลง เข้าใจสื่อขาเข้า (รูปภาพ เสียง วิดีโอ) และพูดคำตอบออกเสียงด้วย text-to-speech ความสามารถด้านสื่อทั้งหมดขับเคลื่อนด้วยเครื่องมือ: agent จะตัดสินใจว่าเมื่อใดควรใช้ตามบริบทของการสนทนา และแต่ละเครื่องมือจะปรากฏเฉพาะเมื่อมีการกำหนดค่า backing provider อย่างน้อยหนึ่งรายแล้วเท่านั้น

## ความสามารถโดยสรุป

| Capability           | Tool             | Providers                                                                                    | สิ่งที่ทำ                                                   |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| การสร้างรูปภาพ       | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | สร้างหรือแก้ไขรูปภาพจากข้อความพรอมป์หรือข้อมูลอ้างอิง       |
| การสร้างวิดีโอ       | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | สร้างวิดีโอจากข้อความ รูปภาพ หรือวิดีโอที่มีอยู่แล้ว         |
| การสร้างเพลง         | `music_generate` | ComfyUI, Google, MiniMax                                                                     | สร้างเพลงหรือแทร็กเสียงจากข้อความพรอมป์                    |
| Text-to-speech (TTS) | `tts`            | ElevenLabs, Google, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI, Xiaomi MiMo  | แปลงคำตอบขาออกเป็นเสียงพูด                                 |
| การทำความเข้าใจสื่อ  | (อัตโนมัติ)      | ผู้ให้บริการโมเดลที่รองรับ vision/audio ทุกราย รวมถึง CLI fallbacks                         | สรุปรูปภาพ เสียง และวิดีโอขาเข้า                           |

## เมทริกซ์ความสามารถของ Provider

ตารางนี้แสดงว่า providers ใดรองรับความสามารถด้านสื่อใดบ้างในแพลตฟอร์ม

| Provider    | Image | Video | Music | TTS | STT / การถอดเสียง | เสียง Realtime | การทำความเข้าใจสื่อ |
| ----------- | ----- | ----- | ----- | --- | ------------------ | -------------- | ------------------- |
| Alibaba     |       | Yes   |       |     |                    |                |                     |
| BytePlus    |       | Yes   |       |     |                    |                |                     |
| ComfyUI     | Yes   | Yes   | Yes   |     |                    |                |                     |
| Deepgram    |       |       |       |     | Yes                | Yes            |                     |
| ElevenLabs  |       |       |       | Yes | Yes                |                |                     |
| fal         | Yes   | Yes   |       |     |                    |                |                     |
| Google      | Yes   | Yes   | Yes   | Yes |                    | Yes            | Yes                 |
| Gradium     |       |       |       | Yes |                    |                |                     |
| Local CLI   |       |       |       | Yes |                    |                |                     |
| Microsoft   |       |       |       | Yes |                    |                |                     |
| MiniMax     | Yes   | Yes   | Yes   | Yes |                    |                |                     |
| Mistral     |       |       |       |     | Yes                |                |                     |
| OpenAI      | Yes   | Yes   |       | Yes | Yes                | Yes            | Yes                 |
| Qwen        |       | Yes   |       |     |                    |                |                     |
| Runway      |       | Yes   |       |     |                    |                |                     |
| SenseAudio  |       |       |       |     | Yes                |                |                     |
| Together    |       | Yes   |       |     |                    |                |                     |
| Vydra       | Yes   | Yes   |       | Yes |                    |                |                     |
| xAI         | Yes   | Yes   |       | Yes | Yes                |                | Yes                 |
| Xiaomi MiMo | Yes   |       |       | Yes |                    |                | Yes                 |

<Note>
การทำความเข้าใจสื่อใช้โมเดลที่รองรับ vision หรือ audio ใดก็ได้ที่ลงทะเบียนไว้ในการกำหนดค่า provider ของคุณ ตารางด้านบนเน้น providers ที่รองรับการทำความเข้าใจสื่อโดยเฉพาะ; ผู้ให้บริการ LLM ส่วนใหญ่ที่มีโมเดลมัลติโหมด (Anthropic, Google, OpenAI ฯลฯ) ก็สามารถเข้าใจสื่อขาเข้าได้เช่นกันเมื่อกำหนดค่าเป็นโมเดลตอบกลับที่ใช้งานอยู่
</Note>

## การสร้างแบบ async ทำงานอย่างไร

การสร้างวิดีโอและเพลงจะทำงานเป็นงานเบื้องหลัง เพราะการประมวลผลของ provider มักใช้เวลาตั้งแต่ 30 วินาทีไปจนถึงหลายนาที เมื่อ agent เรียก `video_generate` หรือ `music_generate` OpenClaw จะส่งคำขอไปยัง provider ส่งกลับ task ID ทันที และติดตามงานใน task ledger agent จะยังคงตอบข้อความอื่นต่อไปได้ขณะที่งานกำลังทำงาน เมื่อ provider ทำเสร็จ OpenClaw จะปลุก agent เพื่อให้โพสต์สื่อที่เสร็จแล้วกลับไปยังช่องทางเดิม การสร้างรูปภาพและ TTS เป็นแบบ synchronous และเสร็จสิ้นในบรรทัดเดียวกับการตอบกลับ

Deepgram, ElevenLabs, Mistral, OpenAI, SenseAudio และ xAI สามารถถอดเสียง
เสียงขาเข้าผ่านเส้นทาง batch `tools.media.audio` ได้เมื่อมีการกำหนดค่าไว้
Deepgram, ElevenLabs, Mistral, OpenAI และ xAI ยังลงทะเบียนผู้ให้บริการ STT แบบสตรีมมิงสำหรับ Voice Call
ดังนั้นเสียงโทรศัพท์สดจึงสามารถส่งต่อไปยังผู้ให้บริการที่เลือกได้
โดยไม่ต้องรอการบันทึกที่เสร็จสมบูรณ์

Google แมปเข้ากับพื้นผิวการทำงานของ OpenClaw สำหรับรูปภาพ วิดีโอ เพลง batch TTS เสียง backend realtime และการทำความเข้าใจสื่อ OpenAI แมปเข้ากับพื้นผิวการทำงานของ OpenClaw สำหรับรูปภาพ วิดีโอ batch TTS batch STT Voice Call streaming STT เสียง backend realtime และ memory embeddings xAI ปัจจุบันแมปเข้ากับพื้นผิวการทำงานของ OpenClaw สำหรับรูปภาพ วิดีโอ search code-execution batch TTS batch STT และ Voice Call streaming STT
xAI Realtime voice เป็นความสามารถของต้นทาง แต่ยังไม่ได้
ลงทะเบียนใน OpenClaw จนกว่าสัญญา shared realtime voice จะสามารถแทนมันได้

## ลิงก์ด่วน

- [การสร้างรูปภาพ](/th/tools/image-generation) -- การสร้างและแก้ไขรูปภาพ
- [การสร้างวิดีโอ](/th/tools/video-generation) -- text-to-video, image-to-video และ video-to-video
- [การสร้างเพลง](/th/tools/music-generation) -- การสร้างเพลงและแทร็กเสียง
- [Text-to-Speech](/th/tools/tts) -- การแปลงคำตอบเป็นเสียงพูด
- [การทำความเข้าใจสื่อ](/th/nodes/media-understanding) -- การทำความเข้าใจรูปภาพ เสียง และวิดีโอขาเข้า

## ที่เกี่ยวข้อง

- [การสร้างรูปภาพ](/th/tools/image-generation)
- [การสร้างวิดีโอ](/th/tools/video-generation)
- [การสร้างเพลง](/th/tools/music-generation)
- [Text-to-speech](/th/tools/tts)
