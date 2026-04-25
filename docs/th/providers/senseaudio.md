---
read_when:
    - คุณต้องการการแปลงเสียงเป็นข้อความของ SenseAudio สำหรับไฟล์แนบเสียง
    - คุณต้องการตัวแปร env ของ API key สำหรับ SenseAudio หรือพาธ config เสียง
summary: การแปลงเสียงเป็นข้อความแบบแบตช์ของ SenseAudio สำหรับข้อความเสียงขาเข้า
title: SenseAudio
x-i18n:
    generated_at: "2026-04-25T13:57:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c39e195458af94f710eb31e46d588a2c61ffe1e3461a9156c9638adae9943f8
    source_path: providers/senseaudio.md
    workflow: 15
---

# SenseAudio

SenseAudio สามารถถอดเสียงไฟล์แนบเสียง/ข้อความเสียงขาเข้าผ่านไปป์ไลน์ `tools.media.audio` ที่ใช้ร่วมกันของ OpenClaw ได้ OpenClaw จะส่งเสียงแบบ multipart ไปยัง endpoint การถอดเสียงที่เข้ากันได้กับ OpenAI และแทรกข้อความที่ส่งกลับเป็น `{{Transcript}}` พร้อมบล็อก `[Audio]`

| Detail        | Value                                            |
| ------------- | ------------------------------------------------ |
| Website       | [senseaudio.cn](https://senseaudio.cn)           |
| Docs          | [senseaudio.cn/docs](https://senseaudio.cn/docs) |
| Auth          | `SENSEAUDIO_API_KEY`                             |
| Default model | `senseaudio-asr-pro-1.5-260319`                  |
| Default URL   | `https://api.senseaudio.cn/v1`                   |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า API key ของคุณ">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="เปิดใช้ provider เสียง">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="ส่งข้อความเสียง">
    ส่งข้อความเสียงผ่านช่องทางที่เชื่อมต่อช่องทางใดก็ได้ OpenClaw จะอัปโหลดเสียงไปยัง SenseAudio และใช้ทรานสคริปต์ในไปป์ไลน์การตอบกลับ
  </Step>
</Steps>

## ตัวเลือก

| Option     | Path                                  | Description                         |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | model id ของ ASR ของ SenseAudio     |
| `language` | `tools.media.audio.models[].language` | คำใบ้ภาษาที่เป็นทางเลือก            |
| `prompt`   | `tools.media.audio.prompt`            | prompt สำหรับการถอดเสียงที่เป็นทางเลือก |
| `baseUrl`  | `tools.media.audio.baseUrl` or model  | override base ที่เข้ากันได้กับ OpenAI |
| `headers`  | `tools.media.audio.request.headers`   | request headers เพิ่มเติม            |

<Note>
SenseAudio รองรับเฉพาะ STT แบบแบตช์ใน OpenClaw เท่านั้น การถอดเสียงแบบ realtime ของ Voice Call ยังคงใช้ providers ที่รองรับ STT แบบสตรีมมิง
</Note>
