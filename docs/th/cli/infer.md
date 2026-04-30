---
read_when:
    - การเพิ่มหรือแก้ไขคำสั่ง `openclaw infer`
    - การออกแบบระบบอัตโนมัติด้านความสามารถแบบไม่มีส่วนติดต่อผู้ใช้ที่เสถียร
summary: CLI แบบเน้นการอนุมานเป็นหลักสำหรับเวิร์กโฟลว์โมเดล รูปภาพ เสียง TTS วิดีโอ เว็บ และการฝังเวกเตอร์ที่ขับเคลื่อนโดยผู้ให้บริการ
title: CLI สำหรับการอนุมาน
x-i18n:
    generated_at: "2026-04-30T09:43:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a154cf11a09f6c60117740f42937da3a0e6942931dde6eee6d902fb6e0ba461
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` เป็นพื้นผิวแบบ headless ตามหลักสำหรับเวิร์กโฟลว์ inference ที่มี provider รองรับ

ตั้งใจเปิดเผยเป็นกลุ่มความสามารถ ไม่ใช่ชื่อ gateway RPC ดิบ และไม่ใช่ id เครื่องมือ agent ดิบ

## เปลี่ยน infer ให้เป็น skill

คัดลอกและวางสิ่งนี้ให้ agent:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

skill ที่อิง infer ที่ดีควร:

- แมปเจตนาทั่วไปของผู้ใช้กับคำสั่งย่อย infer ที่ถูกต้อง
- มีตัวอย่าง infer ตามหลักสองสามรายการสำหรับเวิร์กโฟลว์ที่ครอบคลุม
- เลือกใช้ `openclaw infer ...` ในตัวอย่างและข้อเสนอแนะ
- หลีกเลี่ยงการเขียนเอกสารพื้นผิว infer ทั้งหมดซ้ำภายในเนื้อหา skill

ขอบเขตทั่วไปของ skill ที่เน้น infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## เหตุผลที่ใช้ infer

`openclaw infer` ให้ CLI เดียวที่สอดคล้องกันสำหรับงาน inference ที่มี provider รองรับภายใน OpenClaw

ประโยชน์:

- ใช้ provider และโมเดลที่กำหนดค่าไว้แล้วใน OpenClaw แทนการต่อ wrapper แบบเฉพาะกิจสำหรับแต่ละ backend
- เก็บเวิร์กโฟลว์โมเดล รูปภาพ การถอดเสียงเสียง TTS วิดีโอ เว็บ และ embedding ไว้ภายใต้ต้นไม้คำสั่งเดียว
- ใช้รูปแบบเอาต์พุต `--json` ที่เสถียรสำหรับสคริปต์ ระบบอัตโนมัติ และเวิร์กโฟลว์ที่ขับเคลื่อนด้วย agent
- เลือกใช้พื้นผิว OpenClaw แบบ first-party เมื่องานนั้นโดยพื้นฐานคือ “run inference”
- ใช้เส้นทาง local ปกติโดยไม่ต้องใช้ Gateway สำหรับคำสั่ง infer ส่วนใหญ่

สำหรับการตรวจสอบ provider แบบ end-to-end ให้เลือกใช้ `openclaw infer ...` เมื่อการทดสอบ provider ระดับล่างผ่านแล้ว คำสั่งนี้จะใช้งาน CLI ที่จัดส่งจริง การโหลด config การ resolve default-agent การเปิดใช้งาน Plugin ที่ bundled มา การซ่อมแซม runtime-dependency และ runtime ความสามารถที่ใช้ร่วมกัน ก่อนส่งคำขอไปยัง provider

## ต้นไม้คำสั่ง

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

ตารางนี้แมปงาน inference ทั่วไปกับคำสั่ง infer ที่สอดคล้องกัน

| งาน                          | คำสั่ง                                                                                       | หมายเหตุ                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| รันพรอมป์ข้อความ/โมเดล       | `openclaw infer model run --prompt "..." --json`                                              | ใช้เส้นทาง local ปกติเป็นค่าเริ่มต้น                 |
| รันพรอมป์โมเดลบนรูปภาพ       | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | ระบุ `--file` ซ้ำสำหรับอินพุตรูปภาพหลายรายการ       |
| สร้างรูปภาพ                  | `openclaw infer image generate --prompt "..." --json`                                         | ใช้ `image edit` เมื่อเริ่มจากไฟล์ที่มีอยู่แล้ว      |
| อธิบายไฟล์รูปภาพ             | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` ต้องเป็น `<provider/model>` ที่รองรับรูปภาพ |
| ถอดเสียงเสียง                | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` ต้องเป็น `<provider/model>`                 |
| สังเคราะห์เสียงพูด           | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` มุ่งเน้น Gateway                         |
| สร้างวิดีโอ                  | `openclaw infer video generate --prompt "..." --json`                                         | รองรับ hint ของ provider เช่น `--resolution`         |
| อธิบายไฟล์วิดีโอ             | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` ต้องเป็น `<provider/model>`                 |
| ค้นหาเว็บ                    | `openclaw infer web search --query "..." --json`                                              |                                                       |
| ดึงข้อมูลหน้าเว็บ            | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| สร้าง embeddings             | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## พฤติกรรม

- `openclaw infer ...` เป็นพื้นผิว CLI หลักสำหรับเวิร์กโฟลว์เหล่านี้
- ใช้ `--json` เมื่อเอาต์พุตจะถูกใช้โดยคำสั่งหรือสคริปต์อื่น
- ใช้ `--provider` หรือ `--model provider/model` เมื่อจำเป็นต้องใช้ backend เฉพาะ
- สำหรับ `image describe`, `audio transcribe` และ `video describe`, `--model` ต้องใช้รูปแบบ `<provider/model>`
- สำหรับ `image describe` การระบุ `--model` อย่างชัดเจนจะรัน provider/model นั้นโดยตรง โมเดลต้องรองรับรูปภาพในแคตตาล็อกโมเดลหรือ config ของ provider `codex/<model>` จะรัน turn ความเข้าใจรูปภาพของ app-server Codex แบบจำกัดขอบเขต; `openai-codex/<model>` ใช้เส้นทาง provider OpenAI Codex OAuth
- คำสั่ง execution แบบ stateless ใช้ local เป็นค่าเริ่มต้น
- คำสั่ง state ที่จัดการโดย Gateway ใช้ Gateway เป็นค่าเริ่มต้น
- เส้นทาง local ปกติไม่จำเป็นต้องให้ Gateway ทำงานอยู่
- `model run` แบบ local เป็น provider completion แบบ one-shot ที่เบา โดย resolve โมเดลและ auth ของ agent ที่กำหนดค่าไว้ แต่ไม่เริ่ม turn ของ chat-agent, โหลดเครื่องมือ หรือเปิด bundled MCP servers
- `model run --file` รับไฟล์รูปภาพ ตรวจจับ MIME type และส่งพร้อมพรอมป์ที่ให้มาไปยังโมเดลที่เลือก ระบุ `--file` ซ้ำสำหรับหลายรูปภาพ
- `model run --file` ปฏิเสธอินพุตที่ไม่ใช่รูปภาพ ใช้ `infer audio transcribe` สำหรับไฟล์เสียง และ `infer video describe` สำหรับไฟล์วิดีโอ
- `model run --gateway` ใช้งานการ route ของ Gateway, auth ที่บันทึกไว้, การเลือก provider และ runtime แบบ embedded แต่ยังคงรันเป็น probe โมเดลดิบ: ส่งพรอมป์ที่ให้มาและไฟล์แนบรูปภาพใด ๆ โดยไม่มี transcript ของ session ก่อนหน้า, context bootstrap/AGENTS, การประกอบ context-engine, เครื่องมือ หรือ bundled MCP servers
- `model run --gateway --model <provider/model>` ต้องใช้ credential ของ trusted operator gateway เพราะคำขอให้ Gateway รัน override provider/model แบบ one-off

## โมเดล

ใช้ `model` สำหรับ text inference ที่มี provider รองรับ และการตรวจสอบโมเดล/provider

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

ใช้ ref แบบเต็ม `<provider/model>` เพื่อ smoke-test provider เฉพาะโดยไม่ต้องเริ่ม Gateway หรือโหลดพื้นผิวเครื่องมือ agent แบบเต็ม:

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

- `model run` แบบ local เป็น smoke ของ CLI ที่แคบที่สุดสำหรับสุขภาพของ provider/model/auth เพราะส่งเฉพาะพรอมป์ที่ให้มาไปยังโมเดลที่เลือก
- `model run --file` แบบ local ยังคงใช้เส้นทางที่เบา และแนบเนื้อหารูปภาพโดยตรงกับข้อความผู้ใช้รายการเดียว ไฟล์รูปภาพทั่วไปเช่น PNG, JPEG และ WebP ใช้งานได้เมื่อ MIME type ถูกตรวจพบเป็น `image/*`; ไฟล์ที่ไม่รองรับหรือระบุไม่ได้จะล้มเหลวก่อนเรียก provider
- `model run --file` เหมาะที่สุดเมื่อคุณต้องการทดสอบโมเดลข้อความแบบ multimodal ที่เลือกโดยตรง ใช้ `infer image describe` เมื่อคุณต้องการการเลือก provider สำหรับความเข้าใจรูปภาพของ OpenClaw และการ route โมเดลรูปภาพเริ่มต้น
- โมเดลที่เลือกต้องรองรับอินพุตรูปภาพ; โมเดลแบบข้อความเท่านั้นอาจปฏิเสธคำขอที่ชั้น provider
- `model run --prompt` ต้องมีข้อความที่ไม่ใช่ช่องว่างเปล่า; พรอมป์ว่างจะถูกปฏิเสธก่อนเรียก provider แบบ local หรือ Gateway
- `model run` แบบ local ออกด้วยสถานะไม่เป็นศูนย์เมื่อ provider ไม่คืนเอาต์พุตข้อความ ดังนั้น provider แบบ local ที่เข้าถึงไม่ได้และ completion ว่างจะไม่ดูเหมือน probe ที่สำเร็จ
- ใช้ `model run --gateway` เมื่อคุณต้องทดสอบการ route ของ Gateway, การตั้งค่า agent-runtime หรือ state ของ provider ที่จัดการโดย Gateway ขณะยังคงให้อินพุตโมเดลเป็นแบบดิบ ใช้ `openclaw agent` หรือพื้นผิวแชตเมื่อคุณต้องการ context, เครื่องมือ, memory และ transcript ของ session แบบเต็มของ agent
- `model auth login`, `model auth logout` และ `model auth status` จัดการ state auth ของ provider ที่บันทึกไว้

## รูปภาพ

ใช้ `image` สำหรับการสร้าง การแก้ไข และคำอธิบาย

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
- ใช้ `--size`, `--aspect-ratio` หรือ `--resolution` กับ `image edit` สำหรับ provider/โมเดลที่รองรับ hint ทางเรขาคณิตในการแก้ไขรูปภาพอ้างอิง
- ใช้ `--output-format png --background transparent` กับ `--model openai/gpt-image-1.5` สำหรับเอาต์พุต OpenAI PNG แบบพื้นหลังโปร่งใส; `--openai-background` ยังคงมีให้ใช้เป็น alias เฉพาะของ OpenAI provider ที่ไม่ประกาศการรองรับพื้นหลังจะรายงาน hint นี้เป็น override ที่ถูกละเว้น
- ใช้ `image providers --json` เพื่อตรวจสอบว่า provider รูปภาพที่ bundled มาใดถูกค้นพบ กำหนดค่า เลือกใช้งาน และแต่ละ provider เปิดเผยความสามารถ generation/edit ใดบ้าง
- ใช้ `image generate --model <provider/model> --json` เป็น smoke ของ CLI แบบ live ที่แคบที่สุดสำหรับการเปลี่ยนแปลงด้านการสร้างรูปภาพ ตัวอย่าง:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  การตอบกลับ JSON รายงาน `ok`, `provider`, `model`, `attempts` และเส้นทางเอาต์พุต
  ที่เขียนไว้ เมื่อกำหนด `--output` นามสกุลสุดท้ายอาจเป็นไปตามชนิด MIME
  ที่ผู้ให้บริการส่งกลับมา

- สำหรับ `image describe` และ `image describe-many` ให้ใช้ `--prompt` เพื่อให้คำสั่งเฉพาะงานแก่โมเดลวิชัน เช่น OCR, การเปรียบเทียบ, การตรวจสอบ UI หรือการสร้างคำบรรยายสั้นๆ
- ใช้ `--timeout-ms` กับโมเดลวิชันแบบ local ที่ช้า หรือการเริ่มต้น Ollama แบบ cold start
- สำหรับ `image describe` ต้องให้ `--model` เป็น `<provider/model>` ที่รองรับรูปภาพ
- สำหรับโมเดลวิชัน Ollama แบบ local ให้ดึงโมเดลก่อนและตั้งค่า `OLLAMA_API_KEY` เป็นค่าตัวแทนใดก็ได้ เช่น `ollama-local` ดู [Ollama](/th/providers/ollama#vision-and-image-description)

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

- `tts status` ใช้ค่าเริ่มต้นเป็น Gateway เพราะสะท้อนสถานะ TTS ที่จัดการโดย Gateway
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

- ใช้ `web providers` เพื่อตรวจสอบผู้ให้บริการที่พร้อมใช้งาน ที่กำหนดค่าไว้ และที่เลือกอยู่

## Embedding

ใช้ `embedding` สำหรับการสร้างเวกเตอร์และการตรวจสอบผู้ให้บริการ embedding

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## เอาต์พุต JSON

คำสั่ง Infer ทำให้เอาต์พุต JSON เป็นรูปแบบมาตรฐานภายใต้ envelope ที่ใช้ร่วมกัน:

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

สำหรับคำสั่งสื่อที่สร้างขึ้น `outputs` จะมีไฟล์ที่ OpenClaw เขียนไว้ ใช้
`path`, `mimeType`, `size` และมิติใดๆ ที่เฉพาะกับสื่อในอาร์เรย์นั้น
สำหรับการทำงานอัตโนมัติ แทนการแยกวิเคราะห์ stdout ที่อ่านได้โดยมนุษย์

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

- `openclaw capability ...` เป็น alias สำหรับ `openclaw infer ...`

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [โมเดล](/th/concepts/models)
