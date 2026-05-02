---
read_when:
    - การเพิ่มหรือแก้ไขคำสั่ง `openclaw infer`
    - การออกแบบระบบอัตโนมัติของความสามารถแบบไม่มีส่วนติดต่อผู้ใช้ให้เสถียร
summary: CLI ที่เน้นการอนุมานเป็นหลักสำหรับกระบวนงานโมเดล รูปภาพ เสียง TTS วิดีโอ เว็บ และการฝังเวกเตอร์ที่รองรับโดยผู้ให้บริการ
title: CLI สำหรับการอนุมาน
x-i18n:
    generated_at: "2026-05-02T10:11:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 04f8b4aeb70e960835612eedcc0a22202957803ca4e5eeb3f1e107e8c736e458
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` คือพื้นผิวแบบ headless มาตรฐานสำหรับเวิร์กโฟลว์ inference ที่มี provider รองรับ

คำสั่งนี้จงใจเปิดเผยกลุ่มความสามารถ ไม่ใช่ชื่อ gateway RPC ดิบ และไม่ใช่ id ของ agent tool ดิบ

## เปลี่ยน infer ให้เป็น Skill

คัดลอกและวางข้อความนี้ให้เอเจนต์:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Skill ที่อิงตาม infer ที่ดีควร:

- จับคู่ความต้องการทั่วไปของผู้ใช้กับคำสั่งย่อย infer ที่ถูกต้อง
- มีตัวอย่าง infer มาตรฐานบางส่วนสำหรับเวิร์กโฟลว์ที่ครอบคลุม
- เลือกใช้ `openclaw infer ...` ในตัวอย่างและคำแนะนำ
- หลีกเลี่ยงการเขียนเอกสารซ้ำทั้งพื้นผิว infer ไว้ในเนื้อหา Skill

ขอบเขตทั่วไปของ Skill ที่เน้น infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## เหตุผลที่ใช้ infer

`openclaw infer` ให้ CLI ที่สอดคล้องกันหนึ่งชุดสำหรับงาน inference ที่มี provider รองรับภายใน OpenClaw

ประโยชน์:

- ใช้ providers และ models ที่กำหนดค่าไว้แล้วใน OpenClaw แทนการต่อ wrapper เฉพาะกิจสำหรับแต่ละ backend
- รวมเวิร์กโฟลว์ model, image, audio transcription, TTS, video, web และ embedding ไว้ใต้ command tree เดียว
- ใช้รูปแบบเอาต์พุต `--json` ที่เสถียรสำหรับสคริปต์ ระบบอัตโนมัติ และเวิร์กโฟลว์ที่ขับเคลื่อนโดยเอเจนต์
- เลือกใช้พื้นผิวของ OpenClaw เองเมื่อภารกิจโดยแก่นคือ "run inference"
- ใช้เส้นทาง local ปกติโดยไม่ต้องใช้ gateway สำหรับคำสั่ง infer ส่วนใหญ่

สำหรับการตรวจสอบ provider แบบ end-to-end ให้เลือกใช้ `openclaw infer ...` เมื่อการทดสอบ
provider ระดับล่างเป็นสีเขียวแล้ว คำสั่งนี้ทดสอบ CLI ที่จัดส่งจริง การโหลด config
การ resolve เอเจนต์เริ่มต้น การเปิดใช้ bundled Plugin และ capability
runtime ร่วม ก่อนจะส่งคำขอไปยัง provider

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

ตารางนี้จับคู่งาน inference ทั่วไปกับคำสั่ง infer ที่เกี่ยวข้อง

| งาน                         | คำสั่ง                                                                                       | หมายเหตุ                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| รัน prompt แบบ text/model      | `openclaw infer model run --prompt "..." --json`                                              | ใช้เส้นทาง local ปกติเป็นค่าเริ่มต้น                 |
| รัน model prompt กับรูปภาพ | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | ใช้ `--file` ซ้ำสำหรับอินพุตรูปภาพหลายไฟล์             |
| สร้างรูปภาพ            | `openclaw infer image generate --prompt "..." --json`                                         | ใช้ `image edit` เมื่อเริ่มจากไฟล์ที่มีอยู่  |
| อธิบายไฟล์รูปภาพ       | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` ต้องเป็น `<provider/model>` ที่รองรับรูปภาพ |
| ถอดเสียงจากเสียง             | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` ต้องเป็น `<provider/model>`                  |
| สังเคราะห์เสียงพูด            | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` มุ่งใช้กับ gateway                      |
| สร้างวิดีโอ             | `openclaw infer video generate --prompt "..." --json`                                         | รองรับ hint ของ provider เช่น `--resolution`        |
| อธิบายไฟล์วิดีโอ        | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` ต้องเป็น `<provider/model>`                  |
| ค้นหาเว็บ               | `openclaw infer web search --query "..." --json`                                              |                                                       |
| ดึงข้อมูลหน้าเว็บ             | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| สร้าง embeddings            | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## ลักษณะการทำงาน

- `openclaw infer ...` คือพื้นผิว CLI หลักสำหรับเวิร์กโฟลว์เหล่านี้
- ใช้ `--json` เมื่อเอาต์พุตจะถูกใช้โดยคำสั่งหรือสคริปต์อื่น
- ใช้ `--provider` หรือ `--model provider/model` เมื่อจำเป็นต้องใช้ backend เฉพาะ
- สำหรับ `image describe`, `audio transcribe` และ `video describe`, `--model` ต้องใช้รูปแบบ `<provider/model>`
- สำหรับ `image describe` การระบุ `--model` อย่างชัดเจนจะรัน provider/model นั้นโดยตรง model ต้องรองรับรูปภาพใน model catalog หรือ provider config `codex/<model>` จะรันรอบการทำความเข้าใจรูปภาพผ่าน Codex app-server แบบมีขอบเขตจำกัด; `openai-codex/<model>` ใช้เส้นทาง provider ของ OpenAI Codex OAuth
- คำสั่ง execution แบบ stateless ใช้ local เป็นค่าเริ่มต้น
- คำสั่งสถานะที่จัดการโดย Gateway ใช้ gateway เป็นค่าเริ่มต้น
- เส้นทาง local ปกติไม่จำเป็นต้องมี gateway ทำงานอยู่
- `model run` แบบ local คือ provider completion แบบ one-shot ที่เบาและกระชับ โดย resolve model และ auth ของเอเจนต์ที่กำหนดค่าไว้ แต่ไม่เริ่มรอบ chat-agent ไม่โหลด tools และไม่เปิด bundled MCP servers
- `model run --file` รับไฟล์รูปภาพ ตรวจจับ MIME type และส่งไปพร้อม prompt ที่ให้ไว้ยัง model ที่เลือก ใช้ `--file` ซ้ำสำหรับหลายรูปภาพ
- `model run --file` ปฏิเสธอินพุตที่ไม่ใช่รูปภาพ ใช้ `infer audio transcribe` สำหรับไฟล์เสียง และ `infer video describe` สำหรับไฟล์วิดีโอ
- `model run --gateway` ทดสอบ Gateway routing, saved auth, provider selection และ embedded runtime แต่ยังคงรันเป็น raw model probe: ส่ง prompt ที่ให้มาและไฟล์แนบรูปภาพใดๆ โดยไม่มี transcript ของ session ก่อนหน้า, บริบท bootstrap/AGENTS, การประกอบ context-engine, tools หรือ bundled MCP servers
- `model run --gateway --model <provider/model>` ต้องใช้ credential ของ trusted operator gateway เพราะคำขอนี้สั่งให้ Gateway รัน provider/model override แบบ one-off

## Model

ใช้ `model` สำหรับ text inference ที่มี provider รองรับ และการตรวจสอบ model/provider

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

ใช้ refs แบบเต็ม `<provider/model>` เพื่อ smoke-test provider เฉพาะโดยไม่ต้อง
เริ่ม Gateway หรือโหลดพื้นผิว agent tool เต็มรูปแบบ:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

หมายเหตุ:

- `model run` แบบ local คือ CLI smoke ที่แคบที่สุดสำหรับสุขภาพของ provider/model/auth เพราะส่งเฉพาะ prompt ที่ให้ไว้ไปยัง model ที่เลือก
- `model run --file` แบบ local คงเส้นทางที่เบานั้นไว้และแนบเนื้อหารูปภาพไปยังข้อความผู้ใช้หนึ่งรายการโดยตรง ไฟล์รูปภาพทั่วไป เช่น PNG, JPEG และ WebP ใช้งานได้เมื่อ MIME type ถูกตรวจพบเป็น `image/*`; ไฟล์ที่ไม่รองรับหรือจำแนกไม่ได้จะล้มเหลวก่อนเรียก provider
- `model run --file` เหมาะที่สุดเมื่อคุณต้องการทดสอบ multimodal text model ที่เลือกโดยตรง ใช้ `infer image describe` เมื่อคุณต้องการการเลือก provider สำหรับการทำความเข้าใจรูปภาพของ OpenClaw และการ routing ไปยัง image-model เริ่มต้น
- model ที่เลือกต้องรองรับอินพุตรูปภาพ; model แบบ text-only อาจปฏิเสธคำขอที่ชั้น provider
- `model run --prompt` ต้องมีข้อความที่ไม่ใช่ whitespace; prompt ว่างจะถูกปฏิเสธก่อนเรียก local providers หรือ Gateway
- `model run` แบบ local ออกด้วยสถานะ non-zero เมื่อ provider ไม่ส่งเอาต์พุตข้อความกลับมา ดังนั้น local providers ที่เข้าถึงไม่ได้และ completions ว่างจะไม่ดูเหมือน probes ที่สำเร็จ
- ใช้ `model run --gateway` เมื่อคุณต้องทดสอบ Gateway routing, การตั้งค่า agent-runtime หรือสถานะ provider ที่จัดการโดย Gateway โดยยังคงอินพุต model เป็น raw ใช้ `openclaw agent` หรือพื้นผิว chat เมื่อต้องการบริบทเอเจนต์เต็มรูปแบบ tools, memory และ transcript ของ session
- `model auth login`, `model auth logout` และ `model auth status` จัดการสถานะ auth ของ provider ที่บันทึกไว้

## Image

ใช้ `image` สำหรับการสร้าง การแก้ไข และการอธิบาย

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

หมายเหตุ:

- ใช้ `image edit` เมื่อเริ่มจากไฟล์อินพุตที่มีอยู่
- ใช้ `--size`, `--aspect-ratio` หรือ `--resolution` กับ `image edit` สำหรับ
  providers/models ที่รองรับ geometry hints ในการแก้ไข reference-image
- ใช้ `--output-format png --background transparent` กับ
  `--model openai/gpt-image-1.5` สำหรับเอาต์พุต PNG ของ OpenAI ที่มี transparent-background;
  `--openai-background` ยังคงใช้ได้ในฐานะ alias เฉพาะของ OpenAI Providers
  ที่ไม่ได้ประกาศการรองรับ background จะรายงาน hint ว่าเป็น override ที่ถูกละเว้น
- ใช้ `image providers --json` เพื่อตรวจสอบว่า bundled image providers ใด
  ค้นพบได้ กำหนดค่าแล้ว ถูกเลือก และแต่ละ provider เปิดเผยความสามารถ
  generation/edit ใดบ้าง
- ใช้ `image generate --model <provider/model> --json` เป็น live
  CLI smoke ที่แคบที่สุดสำหรับการเปลี่ยนแปลงการสร้างรูปภาพ ตัวอย่าง:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  การตอบกลับ JSON รายงาน `ok`, `provider`, `model`, `attempts` และพาธเอาต์พุตที่เขียนแล้ว เมื่อกำหนด `--output` นามสกุลสุดท้ายอาจเป็นไปตามชนิด MIME ที่ผู้ให้บริการส่งคืน

- สำหรับ `image describe` และ `image describe-many` ให้ใช้ `--prompt` เพื่อให้คำสั่งเฉพาะงานกับโมเดลวิชัน เช่น OCR, การเปรียบเทียบ, การตรวจสอบ UI หรือการสร้างคำบรรยายสั้น ๆ
- ใช้ `--timeout-ms` กับโมเดลวิชันในเครื่องที่ทำงานช้า หรือเมื่อ Ollama เริ่มแบบ cold start
- สำหรับ `image describe` ค่า `--model` ต้องเป็น `<provider/model>` ที่รองรับรูปภาพ
- สำหรับโมเดลวิชันของ Ollama ในเครื่อง ให้ดึงโมเดลก่อน แล้วตั้งค่า `OLLAMA_API_KEY` เป็นค่าตัวแทนใดก็ได้ เช่น `ollama-local` ดู [Ollama](/th/providers/ollama#vision-and-image-description)

## เสียง

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

- `tts status` มีค่าเริ่มต้นเป็น Gateway เพราะสะท้อนสถานะ TTS ที่ Gateway จัดการ
- ใช้ `tts providers`, `tts voices` และ `tts set-provider` เพื่อตรวจสอบและกำหนดค่าพฤติกรรม TTS

## วิดีโอ

ใช้ `video` สำหรับการสร้างและการอธิบาย

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

หมายเหตุ:

- `video generate` รับ `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` และ `--timeout-ms` แล้วส่งต่อไปยังรันไทม์การสร้างวิดีโอ
- `--model` ต้องเป็น `<provider/model>` สำหรับ `video describe`

## เว็บ

ใช้ `web` สำหรับเวิร์กโฟลว์การค้นหาและดึงข้อมูล

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

หมายเหตุ:

- ใช้ `web providers` เพื่อตรวจสอบผู้ให้บริการที่มีอยู่ ที่กำหนดค่าแล้ว และที่เลือกอยู่

## เอ็มเบดดิง

ใช้ `embedding` สำหรับการสร้างเวกเตอร์และการตรวจสอบผู้ให้บริการเอ็มเบดดิง

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## เอาต์พุต JSON

คำสั่ง Infer ทำให้เอาต์พุต JSON เป็นมาตรฐานภายใต้กรอบร่วม:

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

สำหรับคำสั่งสร้างสื่อ `outputs` จะมีไฟล์ที่ OpenClaw เขียนไว้ ใช้ `path`, `mimeType`, `size` และมิติที่เฉพาะกับสื่อในอาร์เรย์นั้นสำหรับการทำงานอัตโนมัติ แทนการแยกวิเคราะห์ stdout ที่มนุษย์อ่านได้

## ข้อผิดพลาดที่พบบ่อย

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## หมายเหตุ

- `openclaw capability ...` เป็นชื่อแทนสำหรับ `openclaw infer ...`

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [โมเดล](/th/concepts/models)
