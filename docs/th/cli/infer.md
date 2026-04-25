---
read_when:
    - กำลังเพิ่มหรือแก้ไขคำสั่งของ `openclaw infer`
    - กำลังออกแบบระบบอัตโนมัติด้านความสามารถแบบ headless ที่เสถียร
summary: CLI แบบ infer-first สำหรับเวิร์กโฟลว์ model, image, audio, TTS, video, web และ embedding ที่ขับเคลื่อนด้วย provider
title: Inference CLI
x-i18n:
    generated_at: "2026-04-25T13:44:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 249c1074b48882a3beacb08839c8ac992050133fa80e731133620c17dfbbdfe0
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` คือพื้นผิว CLI แบบ headless หลักสำหรับเวิร์กโฟลว์การอนุมานที่ขับเคลื่อนด้วย provider

มันตั้งใจเปิดเผยตระกูลความสามารถ ไม่ใช่ชื่อ Gateway RPC ดิบ และไม่ใช่ ID ของเครื่องมือเอเจนต์แบบดิบ

## เปลี่ยน infer ให้เป็น Skill

คัดลอกและวางข้อความนี้ให้เอเจนต์:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Skill ที่ดีซึ่งอิงกับ infer ควร:

- แมปเจตนาผู้ใช้ที่พบบ่อยไปยัง infer subcommand ที่ถูกต้อง
- มีตัวอย่าง infer แบบมาตรฐานบางส่วนสำหรับเวิร์กโฟลว์ที่รองรับ
- ใช้ `openclaw infer ...` ในตัวอย่างและคำแนะนำเป็นหลัก
- หลีกเลี่ยงการนำพื้นผิว infer ทั้งหมดมาเขียนเอกสารซ้ำ داخلเนื้อหา Skill

ขอบเขตของ Skill แบบ infer ที่พบบ่อย:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## เหตุผลที่ควรใช้ infer

`openclaw infer` ให้ CLI เดียวที่สม่ำเสมอสำหรับงานอนุมานที่ขับเคลื่อนด้วย provider ภายใน OpenClaw

ข้อดี:

- ใช้ provider และ model ที่ตั้งค่าไว้ใน OpenClaw อยู่แล้ว แทนการสร้าง wrapper เฉพาะกิจสำหรับแต่ละ backend
- รวมเวิร์กโฟลว์ model, image, การถอดเสียง audio, TTS, video, web และ embedding ไว้ภายใต้ต้นคำสั่งเดียว
- ใช้รูปแบบเอาต์พุต `--json` ที่เสถียรสำหรับสคริปต์ ระบบอัตโนมัติ และเวิร์กโฟลว์ที่ขับเคลื่อนด้วยเอเจนต์
- เลือกใช้พื้นผิวแบบ first-party ของ OpenClaw เมื่องานนั้นโดยพื้นฐานคือ "รันการอนุมาน"
- ใช้เส้นทางแบบ local ตามปกติโดยไม่ต้องใช้ gateway สำหรับคำสั่ง infer ส่วนใหญ่

สำหรับการตรวจสอบ provider แบบ end-to-end ให้เลือก `openclaw infer ...` เมื่อ
การทดสอบ provider ระดับล่างผ่านแล้ว มันจะทดสอบ CLI ที่จัดส่งจริง, การโหลด config,
การ resolve เอเจนต์เริ่มต้น, การเปิดใช้งาน Plugin ที่ bundle มา,
การซ่อมแซม runtime-dependency และ shared capability runtime ก่อนส่งคำขอไปยัง provider

## โครงสร้างคำสั่ง

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

## งานทั่วไป

ตารางนี้แมปงานอนุมานที่พบบ่อยกับคำสั่ง infer ที่สอดคล้องกัน

| งาน | คำสั่ง | หมายเหตุ |
| --- | --- | --- |
| รันพรอมต์ข้อความ/model | `openclaw infer model run --prompt "..." --json` | ใช้เส้นทาง local ปกติเป็นค่าเริ่มต้น |
| สร้างภาพ | `openclaw infer image generate --prompt "..." --json` | ใช้ `image edit` เมื่อเริ่มจากไฟล์ที่มีอยู่ |
| อธิบายไฟล์ภาพ | `openclaw infer image describe --file ./image.png --json` | `--model` ต้องเป็น `<provider/model>` ที่รองรับภาพ |
| ถอดเสียง audio | `openclaw infer audio transcribe --file ./memo.m4a --json` | `--model` ต้องเป็น `<provider/model>` |
| สังเคราะห์เสียงพูด | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` เน้นการทำงานฝั่ง gateway |
| สร้างวิดีโอ | `openclaw infer video generate --prompt "..." --json` | รองรับคำใบ้ของ provider เช่น `--resolution` |
| อธิบายไฟล์วิดีโอ | `openclaw infer video describe --file ./clip.mp4 --json` | `--model` ต้องเป็น `<provider/model>` |
| ค้นหาเว็บ | `openclaw infer web search --query "..." --json` | |
| ดึงหน้าเว็บ | `openclaw infer web fetch --url https://example.com --json` | |
| สร้าง embedding | `openclaw infer embedding create --text "..." --json` | |

## พฤติกรรม

- `openclaw infer ...` คือพื้นผิว CLI หลักสำหรับเวิร์กโฟลว์เหล่านี้
- ใช้ `--json` เมื่อเอาต์พุตจะถูกนำไปใช้โดยคำสั่งหรือสคริปต์อื่น
- ใช้ `--provider` หรือ `--model provider/model` เมื่อต้องการ backend เฉพาะ
- สำหรับ `image describe`, `audio transcribe` และ `video describe`, `--model` ต้องอยู่ในรูป `<provider/model>`
- สำหรับ `image describe` หากระบุ `--model` ชัดเจน จะรัน provider/model นั้นโดยตรง model ต้องรองรับภาพใน model catalog หรือ config ของ provider `codex/<model>` จะรัน turn แบบ image-understanding ของ Codex app-server ที่มีขอบเขตจำกัด; `openai-codex/<model>` ใช้เส้นทาง OpenAI Codex OAuth provider
- คำสั่งการทำงานแบบ stateless ใช้ local เป็นค่าเริ่มต้น
- คำสั่งสถานะที่จัดการโดย Gateway ใช้ gateway เป็นค่าเริ่มต้น
- เส้นทาง local ปกติไม่จำเป็นต้องให้ gateway ทำงานอยู่
- `model run` เป็นแบบ one-shot MCP server ที่เปิดผ่าน runtime ของเอเจนต์สำหรับคำสั่งนั้นจะถูกยุติหลังจากตอบกลับเสร็จ ทั้งสำหรับ local และการรันแบบ `--gateway` ดังนั้นการเรียกใช้ซ้ำในสคริปต์จะไม่ทำให้ stdio MCP child process ค้างอยู่

## Model

ใช้ `model` สำหรับการอนุมานข้อความที่ขับเคลื่อนด้วย provider และการตรวจสอบ model/provider

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

หมายเหตุ:

- `model run` ใช้ runtime ของเอเจนต์ร่วมกัน ดังนั้นการแทนที่ provider/model จะทำงานเหมือนการทำงานของเอเจนต์ตามปกติ
- เนื่องจาก `model run` ออกแบบมาสำหรับระบบอัตโนมัติแบบ headless จึงจะไม่เก็บ bundled MCP runtime รายเซสชันไว้หลังคำสั่งเสร็จสิ้น
- `model auth login`, `model auth logout` และ `model auth status` ใช้จัดการสถานะการยืนยันตัวตนของ provider ที่บันทึกไว้

## Image

ใช้ `image` สำหรับการสร้าง การแก้ไข และการอธิบายภาพ

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

หมายเหตุ:

- ใช้ `image edit` เมื่อเริ่มจากไฟล์อินพุตที่มีอยู่
- ใช้ `image providers --json` เพื่อตรวจสอบว่า provider ด้านภาพที่ bundle มาใด
  ถูกค้นพบ กำหนดค่า ถูกเลือก และแต่ละ provider เปิดเผยความสามารถ
  ด้านการสร้าง/แก้ไขอะไรบ้าง
- ใช้ `image generate --model <provider/model> --json` เป็นการทดสอบ CLI แบบ live ที่แคบที่สุด
  สำหรับการเปลี่ยนแปลงด้านการสร้างภาพ ตัวอย่าง:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  การตอบกลับแบบ JSON จะรายงาน `ok`, `provider`, `model`, `attempts` และ
  พาธเอาต์พุตที่เขียนแล้ว เมื่อกำหนด `--output` นามสกุลสุดท้ายอาจเป็นไปตาม
  MIME type ที่ provider ส่งกลับ

- สำหรับ `image describe`, `--model` ต้องเป็น `<provider/model>` ที่รองรับภาพ
- สำหรับ Ollama vision model ในเครื่อง ให้ pull model ก่อนและตั้งค่า `OLLAMA_API_KEY` เป็นค่า placeholder ใดก็ได้ เช่น `ollama-local` ดู [Ollama](/th/providers/ollama#vision-and-image-description)

## Audio

ใช้ `audio` สำหรับการถอดเสียงจากไฟล์

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

หมายเหตุ:

- `audio transcribe` ใช้สำหรับการถอดเสียงจากไฟล์ ไม่ใช่การจัดการเซสชันแบบเรียลไทม์
- `--model` ต้องเป็น `<provider/model>`

## TTS

ใช้ `tts` สำหรับการสังเคราะห์เสียงพูดและสถานะ provider ของ TTS

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

หมายเหตุ:

- `tts status` ใช้ gateway เป็นค่าเริ่มต้น เพราะสะท้อนสถานะ TTS ที่จัดการโดย gateway
- ใช้ `tts providers`, `tts voices` และ `tts set-provider` เพื่อตรวจสอบและกำหนดค่าพฤติกรรมของ TTS

## Video

ใช้ `video` สำหรับการสร้างและการอธิบายวิดีโอ

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

หมายเหตุ:

- `video generate` รองรับ `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` และ `--timeout-ms` และจะส่งต่อไปยัง runtime สำหรับการสร้างวิดีโอ
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

- ใช้ `web providers` เพื่อตรวจสอบ provider ที่พร้อมใช้งาน ถูกกำหนดค่า และถูกเลือก

## Embedding

ใช้ `embedding` สำหรับการสร้างเวกเตอร์และการตรวจสอบ provider ของ embedding

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## เอาต์พุต JSON

คำสั่ง infer จะ normalize เอาต์พุต JSON ภายใต้ envelope ร่วมกัน:

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

ฟิลด์ระดับบนสุดที่เสถียร:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

สำหรับคำสั่งที่สร้างสื่อ `outputs` จะมีไฟล์ที่ OpenClaw เขียนออกมา ใช้
`path`, `mimeType`, `size` และมิติข้อมูลเฉพาะของสื่อใด ๆ ในอาร์เรย์นั้น
สำหรับระบบอัตโนมัติ แทนการ parse stdout แบบที่มนุษย์อ่านได้

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

- `openclaw capability ...` เป็นชื่อแทนของ `openclaw infer ...`

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Models](/th/concepts/models)
