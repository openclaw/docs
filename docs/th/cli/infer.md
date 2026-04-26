---
read_when:
    - กำลังเพิ่มหรือแก้ไขคำสั่ง `openclaw infer`
    - กำลังออกแบบระบบอัตโนมัติด้านความสามารถแบบเฮดเลสที่เสถียร
summary: CLI แบบอนุมานก่อนสำหรับเวิร์กโฟลว์โมเดล รูปภาพ เสียง TTS วิดีโอ เว็บ และ embedding ที่ทำงานผ่านผู้ให้บริการ
title: Inference CLI
x-i18n:
    generated_at: "2026-04-26T11:26:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf07b306d80535b58d811aa33c0bbe2ecac57b22c3ab27f6f2ae6518ceb21e49
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` คือพื้นผิวแบบเฮดเลสที่เป็นมาตรฐานสำหรับเวิร์กโฟลว์การอนุมานที่ทำงานผ่านผู้ให้บริการ

ตั้งใจออกแบบให้เปิดเผยเป็นตระกูลความสามารถ ไม่ใช่ชื่อ Gateway RPC แบบดิบ และไม่ใช่ id ของเครื่องมือเอเจนต์แบบดิบ

## เปลี่ยน infer ให้เป็น skill

คัดลอกและวางสิ่งนี้ให้เอเจนต์:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

skill ที่อิงกับ infer ที่ดีควร:

- แมปเจตนาของผู้ใช้ที่พบบ่อยไปยังคำสั่งย่อย infer ที่ถูกต้อง
- มีตัวอย่าง infer มาตรฐานเล็กน้อยสำหรับเวิร์กโฟลว์ที่ครอบคลุม
- ใช้ `openclaw infer ...` เป็นหลักในตัวอย่างและคำแนะนำ
- หลีกเลี่ยงการนำพื้นผิว infer ทั้งหมดมาเขียนเอกสารซ้ำในเนื้อหา skill

ขอบเขตของ skill ที่เน้น infer โดยทั่วไป:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## เหตุผลที่ควรใช้ infer

`openclaw infer` มอบ CLI ที่สอดคล้องกันเพียงชุดเดียวสำหรับงานอนุมานที่ทำงานผ่านผู้ให้บริการภายใน OpenClaw

ข้อดี:

- ใช้ผู้ให้บริการและโมเดลที่กำหนดค่าไว้ใน OpenClaw อยู่แล้ว แทนการสร้าง wrapper แบบเฉพาะกิจแยกตาม backend
- รวมเวิร์กโฟลว์โมเดล รูปภาพ การถอดเสียง TTS วิดีโอ เว็บ และ embedding ไว้ภายใต้โครงสร้างคำสั่งเดียว
- ใช้รูปแบบเอาต์พุต `--json` ที่เสถียรสำหรับสคริปต์ ระบบอัตโนมัติ และเวิร์กโฟลว์ที่ขับเคลื่อนด้วยเอเจนต์
- เลือกใช้พื้นผิว OpenClaw แบบ first-party เมื่องานนั้นเป็น “รันการอนุมาน” โดยพื้นฐาน
- ใช้เส้นทาง local ปกติโดยไม่ต้องพึ่ง Gateway สำหรับคำสั่ง infer ส่วนใหญ่

สำหรับการตรวจสอบผู้ให้บริการแบบ end-to-end ให้เลือก `openclaw infer ...` เมื่อการทดสอบผู้ให้บริการระดับล่างผ่านแล้ว โดยจะทดสอบ CLI ที่จัดส่งจริง การโหลด config การ resolve เอเจนต์เริ่มต้น การเปิดใช้งาน Plugin ที่รวมมา การซ่อมแซม dependency ขณะรัน และรันไทม์ความสามารถที่ใช้ร่วมกัน ก่อนที่จะมีการส่งคำขอไปยังผู้ให้บริการ

## แผนผังคำสั่ง

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## งานที่พบบ่อย

ตารางนี้แมปงานอนุมานที่พบบ่อยไปยังคำสั่ง infer ที่สอดคล้องกัน

| Task                    | Command                                                                | Notes |
| ----------------------- | ---------------------------------------------------------------------- | ----- |
| รันพรอมต์ข้อความ/โมเดล | `openclaw infer model run --prompt "..." --json`                       | ใช้เส้นทาง local ปกติเป็นค่าเริ่มต้น |
| สร้างรูปภาพ            | `openclaw infer image generate --prompt "..." --json`                  | ใช้ `image edit` เมื่อต้องเริ่มจากไฟล์ที่มีอยู่แล้ว |
| อธิบายไฟล์รูปภาพ       | `openclaw infer image describe --file ./image.png --json`              | `--model` ต้องเป็น `<provider/model>` ที่รองรับภาพ |
| ถอดเสียงไฟล์เสียง      | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` ต้องเป็น `<provider/model>` |
| สังเคราะห์เสียงพูด    | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` เน้นการทำงานฝั่ง gateway |
| สร้างวิดีโอ            | `openclaw infer video generate --prompt "..." --json`                  | รองรับคำใบ้เฉพาะผู้ให้บริการ เช่น `--resolution` |
| อธิบายไฟล์วิดีโอ       | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` ต้องเป็น `<provider/model>` |
| ค้นหาเว็บ              | `openclaw infer web search --query "..." --json`                       |       |
| ดึงหน้าเว็บ            | `openclaw infer web fetch --url https://example.com --json`            |       |
| สร้าง embeddings       | `openclaw infer embedding create --text "..." --json`                  |       |

## พฤติกรรม

- `openclaw infer ...` เป็นพื้นผิว CLI หลักสำหรับเวิร์กโฟลว์เหล่านี้
- ใช้ `--json` เมื่อเอาต์พุตจะถูกนำไปใช้โดยคำสั่งหรือสคริปต์อื่น
- ใช้ `--provider` หรือ `--model provider/model` เมื่อต้องการ backend ที่เฉพาะเจาะจง
- สำหรับ `image describe`, `audio transcribe` และ `video describe`, `--model` ต้องใช้รูปแบบ `<provider/model>`
- สำหรับ `image describe` การระบุ `--model` แบบชัดเจนจะรัน provider/model นั้นโดยตรง โมเดลต้องรองรับภาพในแค็ตตาล็อกโมเดลหรือ config ของผู้ให้บริการ `codex/<model>` จะรันเทิร์นการทำความเข้าใจภาพผ่าน Codex app-server แบบมีขอบเขตจำกัด; `openai-codex/<model>` ใช้เส้นทางผู้ให้บริการ OpenAI Codex OAuth
- คำสั่งรันแบบไร้สถานะใช้ local เป็นค่าเริ่มต้น
- คำสั่งสถานะที่จัดการโดย Gateway ใช้ gateway เป็นค่าเริ่มต้น
- เส้นทาง local ปกติไม่จำเป็นต้องให้ Gateway กำลังทำงานอยู่
- `model run` เป็นแบบ one-shot เซิร์ฟเวอร์ MCP ที่เปิดผ่านรันไทม์เอเจนต์สำหรับคำสั่งนั้นจะถูกปิดหลังจากตอบกลับ ทั้งในการรันแบบ local และ `--gateway` ดังนั้นการเรียกแบบสคริปต์ซ้ำ ๆ จะไม่ทำให้โปรเซสลูก MCP แบบ stdio ยังทำงานค้างอยู่

## Model

ใช้ `model` สำหรับการอนุมานข้อความผ่านผู้ให้บริการ และการตรวจสอบโมเดล/ผู้ให้บริการ

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

หมายเหตุ:

- `model run` ใช้รันไทม์เอเจนต์ร่วมกัน ดังนั้นการแทนที่ผู้ให้บริการ/โมเดลจึงมีพฤติกรรมเหมือนการรันเอเจนต์ปกติ
- เนื่องจาก `model run` ออกแบบมาสำหรับระบบอัตโนมัติแบบเฮดเลส จึงจะไม่เก็บรันไทม์ MCP แบบรวมต่อเซสชันไว้หลังคำสั่งจบ
- `model auth login`, `model auth logout` และ `model auth status` ใช้จัดการสถานะการยืนยันตัวตนของผู้ให้บริการที่บันทึกไว้

## Image

ใช้ `image` สำหรับการสร้าง แก้ไข และอธิบายภาพ

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

หมายเหตุ:

- ใช้ `image edit` เมื่อต้องเริ่มจากไฟล์อินพุตที่มีอยู่แล้ว
- ใช้ `--size`, `--aspect-ratio` หรือ `--resolution` กับ `image edit` สำหรับผู้ให้บริการ/โมเดลที่รองรับคำใบ้ด้านเรขาคณิตในการแก้ไขภาพอ้างอิง
- ใช้ `--output-format png --background transparent` กับ `--model openai/gpt-image-1.5` สำหรับเอาต์พุต OpenAI PNG แบบพื้นหลังโปร่งใส; `--openai-background` ยังคงใช้ได้ในฐานะ alias เฉพาะของ OpenAI ผู้ให้บริการที่ไม่ได้ประกาศการรองรับพื้นหลังจะรายงานคำใบ้นี้เป็นการแทนที่ที่ถูกละเลย
- ใช้ `image providers --json` เพื่อตรวจสอบว่าผู้ให้บริการภาพที่รวมมาใดบ้างที่ถูกค้นพบ กำหนดค่าไว้ ถูกเลือกไว้ และผู้ให้บริการแต่ละรายเปิดเผยความสามารถด้านการสร้าง/แก้ไขอะไรบ้าง
- ใช้ `image generate --model <provider/model> --json` เป็นการทดสอบ CLI แบบ live ที่แคบที่สุดสำหรับการเปลี่ยนแปลงด้านการสร้างภาพ ตัวอย่าง:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  การตอบกลับแบบ JSON จะรายงาน `ok`, `provider`, `model`, `attempts` และพาธเอาต์พุตที่ถูกเขียนไว้ เมื่อมีการตั้ง `--output` นามสกุลสุดท้ายอาจเป็นไปตาม MIME type ที่ผู้ให้บริการส่งกลับ

- สำหรับ `image describe`, `--model` ต้องเป็น `<provider/model>` ที่รองรับภาพ
- สำหรับโมเดล vision ของ Ollama ในเครื่อง ให้ดึงโมเดลมาก่อนและตั้ง `OLLAMA_API_KEY` เป็นค่า placeholder ใดก็ได้ เช่น `ollama-local` ดู [Ollama](/th/providers/ollama#vision-and-image-description)

## Audio

ใช้ `audio` สำหรับการถอดเสียงไฟล์

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

หมายเหตุ:

- `audio transcribe` ใช้สำหรับการถอดเสียงไฟล์ ไม่ใช่การจัดการเซสชันแบบเรียลไทม์
- `--model` ต้องเป็น `<provider/model>`

## TTS

ใช้ `tts` สำหรับการสังเคราะห์เสียงพูดและสถานะผู้ให้บริการ TTS

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

หมายเหตุ:

- `tts status` ใช้ gateway เป็นค่าเริ่มต้น เพราะสะท้อนสถานะ TTS ที่จัดการโดย gateway
- ใช้ `tts providers`, `tts voices` และ `tts set-provider` เพื่อตรวจสอบและกำหนดค่าพฤติกรรม TTS

## Video

ใช้ `video` สำหรับการสร้างและอธิบายวิดีโอ

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

หมายเหตุ:

- `video generate` รองรับ `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` และ `--timeout-ms` และจะส่งต่อค่าเหล่านี้ไปยังรันไทม์การสร้างวิดีโอ
- `--model` ต้องเป็น `<provider/model>` สำหรับ `video describe`

## Web

ใช้ `web` สำหรับเวิร์กโฟลว์การค้นหาและดึงข้อมูลเว็บ

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

หมายเหตุ:

- ใช้ `web providers` เพื่อตรวจสอบผู้ให้บริการที่พร้อมใช้งาน ถูกกำหนดค่าไว้ และถูกเลือกไว้

## Embedding

ใช้ `embedding` สำหรับการสร้างเวกเตอร์และการตรวจสอบผู้ให้บริการ embedding

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## เอาต์พุต JSON

คำสั่ง infer จะทำให้เอาต์พุต JSON เป็นมาตรฐานภายใต้ envelope ที่ใช้ร่วมกัน:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

ฟิลด์ระดับบนสุดมีความเสถียร:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

สำหรับคำสั่งสร้างสื่อ `outputs` จะมีไฟล์ที่ OpenClaw เขียนไว้ ใช้ `path`, `mimeType`, `size` และมิติที่เฉพาะกับสื่อใด ๆ ในอาร์เรย์นั้นสำหรับระบบอัตโนมัติ แทนการแยกวิเคราะห์ stdout ที่มนุษย์อ่านได้

## ข้อผิดพลาดที่พบบ่อย

```bash
# ไม่ดี
openclaw infer media image generate --prompt "friendly lobster"

# ดี
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# ไม่ดี
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# ดี
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## หมายเหตุ

- `openclaw capability ...` เป็น alias ของ `openclaw infer ...`

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Models](/th/concepts/models)
