---
read_when:
    - การเพิ่มหรือแก้ไขคำสั่ง `openclaw infer`
    - การออกแบบระบบอัตโนมัติของความสามารถแบบไม่มีส่วนติดต่อผู้ใช้ให้เสถียร
summary: CLI แบบเน้นการอนุมานก่อนสำหรับเวิร์กโฟลว์โมเดล รูปภาพ เสียง TTS วิดีโอ เว็บ และเวกเตอร์ฝังตัวที่รองรับโดยผู้ให้บริการ
title: CLI สำหรับการอนุมาน
x-i18n:
    generated_at: "2026-05-06T09:05:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 232bf8165ff74b19aaf84431519d9f9f99f20831420b73935f73ffd9412bd04a
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` เป็นพื้นผิวแบบไม่มีหัวสำหรับเวิร์กโฟลว์การอนุมานที่รองรับโดยผู้ให้บริการตามมาตรฐาน

ตั้งใจเปิดเผยตระกูลความสามารถ ไม่ใช่ชื่อ RPC ของ gateway แบบดิบ และไม่ใช่ id เครื่องมือของ agent แบบดิบ

## เปลี่ยน infer ให้เป็น Skills

คัดลอกและวางสิ่งนี้ให้ agent:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Skills ที่ใช้ infer เป็นฐานที่ดีควร:

- จับคู่เจตนาทั่วไปของผู้ใช้กับคำสั่งย่อย infer ที่ถูกต้อง
- รวมตัวอย่าง infer มาตรฐานไม่กี่รายการสำหรับเวิร์กโฟลว์ที่ครอบคลุม
- เลือกใช้ `openclaw infer ...` ในตัวอย่างและคำแนะนำ
- หลีกเลี่ยงการทำเอกสารพื้นผิว infer ทั้งหมดซ้ำภายในเนื้อหา Skills

ขอบเขตทั่วไปของ Skills ที่เน้น infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## ทำไมจึงใช้ infer

`openclaw infer` ให้ CLI เดียวที่สอดคล้องกันสำหรับงานอนุมานที่รองรับโดยผู้ให้บริการภายใน OpenClaw

ประโยชน์:

- ใช้ผู้ให้บริการและโมเดลที่กำหนดค่าไว้แล้วใน OpenClaw แทนการต่อ wrapper เฉพาะกิจสำหรับ backend แต่ละตัว
- เก็บเวิร์กโฟลว์โมเดล รูปภาพ การถอดเสียงเสียงพูด TTS วิดีโอ เว็บ และ embedding ไว้ใต้แผนผังคำสั่งเดียว
- ใช้รูปแบบเอาต์พุต `--json` ที่เสถียรสำหรับสคริปต์ ระบบอัตโนมัติ และเวิร์กโฟลว์ที่ขับเคลื่อนโดย agent
- เลือกใช้พื้นผิว OpenClaw แบบ first-party เมื่องานนั้นโดยพื้นฐานคือ “รันการอนุมาน”
- ใช้เส้นทาง local ปกติโดยไม่ต้องใช้ gateway สำหรับคำสั่ง infer ส่วนใหญ่

สำหรับการตรวจสอบผู้ให้บริการแบบ end-to-end ให้เลือกใช้ `openclaw infer ...` เมื่อการทดสอบผู้ให้บริการระดับล่างเป็นสีเขียวแล้ว คำสั่งนี้จะใช้ CLI ที่จัดส่งจริง การโหลด config การแก้ค่า agent เริ่มต้น การเปิดใช้งาน Plugin ที่ bundled และ runtime ความสามารถที่ใช้ร่วมกัน ก่อนที่จะส่งคำขอไปยังผู้ให้บริการ

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

## งานทั่วไป

ตารางนี้จับคู่งานอนุมานทั่วไปกับคำสั่ง infer ที่เกี่ยวข้อง

| งาน                         | คำสั่ง                                                                                       | หมายเหตุ                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| รัน prompt ข้อความ/โมเดล      | `openclaw infer model run --prompt "..." --json`                                              | ใช้เส้นทาง local ปกติโดยค่าเริ่มต้น                 |
| รัน prompt โมเดลบนรูปภาพ | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | ใช้ `--file` ซ้ำสำหรับอินพุตรูปภาพหลายรายการ             |
| สร้างรูปภาพ            | `openclaw infer image generate --prompt "..." --json`                                         | ใช้ `image edit` เมื่อเริ่มจากไฟล์ที่มีอยู่  |
| อธิบายไฟล์รูปภาพ       | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` ต้องเป็นโมเดลที่รองรับรูปภาพในรูปแบบ `<provider/model>` |
| ถอดเสียงเสียงพูด             | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` ต้องเป็น `<provider/model>`                  |
| สังเคราะห์เสียงพูด            | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` มุ่งเน้น Gateway                      |
| สร้างวิดีโอ             | `openclaw infer video generate --prompt "..." --json`                                         | รองรับ hint ของผู้ให้บริการ เช่น `--resolution`        |
| อธิบายไฟล์วิดีโอ        | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` ต้องเป็น `<provider/model>`                  |
| ค้นหาเว็บ               | `openclaw infer web search --query "..." --json`                                              |                                                       |
| ดึงข้อมูลหน้าเว็บ             | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| สร้าง embeddings            | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## พฤติกรรม

- `openclaw infer ...` เป็นพื้นผิว CLI หลักสำหรับเวิร์กโฟลว์เหล่านี้
- ใช้ `--json` เมื่อเอาต์พุตจะถูกใช้โดยคำสั่งหรือสคริปต์อื่น
- ใช้ `--provider` หรือ `--model provider/model` เมื่อต้องใช้ backend เฉพาะ
- สำหรับ `image describe`, `audio transcribe` และ `video describe`, `--model` ต้องใช้รูปแบบ `<provider/model>`
- สำหรับ `image describe`, `--model` ที่ระบุอย่างชัดเจนจะรัน provider/model นั้นโดยตรง โมเดลต้องรองรับรูปภาพในแค็ตตาล็อกโมเดลหรือ config ของผู้ให้บริการ `codex/<model>` จะรันรอบการทำความเข้าใจรูปภาพผ่าน app-server ของ Codex แบบมีขอบเขตจำกัด; `openai-codex/<model>` ใช้เส้นทางผู้ให้บริการ OAuth ของ OpenAI Codex
- คำสั่งการดำเนินการแบบไร้สถานะมีค่าเริ่มต้นเป็น local
- คำสั่งสถานะที่จัดการโดย Gateway มีค่าเริ่มต้นเป็น gateway
- เส้นทาง local ปกติไม่ต้องให้ gateway ทำงานอยู่
- `model run` แบบ local เป็นการเติมเต็มโดยผู้ให้บริการแบบ one-shot ที่เบา คำสั่งนี้แก้ค่าโมเดลและ auth ของ agent ที่กำหนดค่าไว้ แต่จะไม่เริ่มรอบ chat-agent โหลดเครื่องมือ หรือเปิดเซิร์ฟเวอร์ MCP ที่ bundled
- `model run --file` รับไฟล์รูปภาพ ตรวจจับชนิด MIME และส่งไฟล์เหล่านั้นพร้อม prompt ที่ระบุไปยังโมเดลที่เลือก ใช้ `--file` ซ้ำสำหรับรูปภาพหลายรายการ
- `model run --file` ปฏิเสธอินพุตที่ไม่ใช่รูปภาพ ใช้ `infer audio transcribe` สำหรับไฟล์เสียง และ `infer video describe` สำหรับไฟล์วิดีโอ
- `model run --gateway` ใช้การกำหนดเส้นทางของ Gateway, auth ที่บันทึกไว้, การเลือกผู้ให้บริการ และ runtime ที่ฝังอยู่ แต่ยังคงรันเป็นการ probe โมเดลดิบ: คำสั่งนี้ส่ง prompt ที่ระบุและไฟล์แนบรูปภาพใดๆ โดยไม่มี transcript เซสชันก่อนหน้า, บริบท bootstrap/AGENTS, การประกอบ context-engine, เครื่องมือ หรือเซิร์ฟเวอร์ MCP ที่ bundled
- `model run --gateway --model <provider/model>` ต้องใช้ credential ของ operator gateway ที่เชื่อถือได้ เพราะคำขอขอให้ Gateway รันการ override provider/model แบบเฉพาะกิจ

## โมเดล

ใช้ `model` สำหรับการอนุมานข้อความที่รองรับโดยผู้ให้บริการ และการตรวจสอบโมเดล/ผู้ให้บริการ

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

ใช้ ref แบบเต็ม `<provider/model>` เพื่อ smoke-test ผู้ให้บริการเฉพาะโดยไม่ต้องเริ่ม Gateway หรือโหลดพื้นผิวเครื่องมือ agent ทั้งหมด:

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

- `model run` แบบ local เป็น CLI smoke ที่แคบที่สุดสำหรับสุขภาพของ provider/model/auth เพราะสำหรับผู้ให้บริการที่ไม่ใช่ Codex คำสั่งนี้จะส่งเฉพาะ prompt ที่ระบุไปยังโมเดลที่เลือก
- probe แบบ local ของ `openai-codex/*` เป็นข้อยกเว้นแบบแคบ: OpenClaw เพิ่ม system instruction ขั้นต่ำ เพื่อให้ transport ของ Codex Responses เติมฟิลด์ `instructions` ที่ต้องใช้ได้ โดยไม่เพิ่มบริบท agent เต็มรูปแบบ เครื่องมือ หน่วยความจำ หรือ transcript เซสชัน
- `model run --file` แบบ local รักษาเส้นทางที่เบานั้นไว้และแนบเนื้อหารูปภาพเข้ากับข้อความผู้ใช้เดียวโดยตรง ไฟล์รูปภาพทั่วไป เช่น PNG, JPEG และ WebP ใช้ได้เมื่อชนิด MIME ถูกตรวจพบเป็น `image/*`; ไฟล์ที่ไม่รองรับหรือไม่รู้จักจะล้มเหลวก่อนเรียกผู้ให้บริการ
- `model run --file` เหมาะที่สุดเมื่อคุณต้องการทดสอบโมเดลข้อความแบบ multimodal ที่เลือกโดยตรง ใช้ `infer image describe` เมื่อคุณต้องการการเลือกผู้ให้บริการทำความเข้าใจรูปภาพและการกำหนดเส้นทางโมเดลรูปภาพเริ่มต้นของ OpenClaw
- โมเดลที่เลือกต้องรองรับอินพุตรูปภาพ; โมเดลที่รองรับเฉพาะข้อความอาจปฏิเสธคำขอที่ชั้นผู้ให้บริการ
- `model run --prompt` ต้องมีข้อความที่ไม่ใช่ whitespace; prompt ว่างจะถูกปฏิเสธก่อนเรียกผู้ให้บริการ local หรือ Gateway
- `model run` แบบ local ออกด้วยสถานะ non-zero เมื่อผู้ให้บริการไม่ส่งคืนเอาต์พุตข้อความ ดังนั้นผู้ให้บริการ local ที่เข้าถึงไม่ได้และการเติมเต็มที่ว่างจะไม่ดูเหมือนเป็น probe ที่สำเร็จ
- ใช้ `model run --gateway` เมื่อคุณต้องทดสอบการกำหนดเส้นทางของ Gateway, การตั้งค่า agent-runtime หรือสถานะผู้ให้บริการที่จัดการโดย Gateway โดยยังคงให้อินพุตโมเดลเป็นแบบดิบ ใช้ `openclaw agent` หรือพื้นผิวแชทเมื่อคุณต้องการบริบท agent เต็มรูปแบบ เครื่องมือ หน่วยความจำ และ transcript เซสชัน
- `model auth login`, `model auth logout` และ `model auth status` จัดการสถานะ auth ของผู้ให้บริการที่บันทึกไว้

## รูปภาพ

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
  providers/models ที่รองรับคำแนะนำด้านเรขาคณิตในการแก้ไขรูปภาพอ้างอิง
- ใช้ `--output-format png --background transparent` กับ
  `--model openai/gpt-image-1.5` สำหรับเอาต์พุต PNG ของ OpenAI ที่มีพื้นหลังโปร่งใส;
  `--openai-background` ยังคงมีให้ใช้เป็น alias เฉพาะของ OpenAI providers
  ที่ไม่ได้ประกาศว่ารองรับพื้นหลังจะรายงานคำแนะนำนี้เป็นการ override ที่ถูกละเว้น
- ใช้ `image providers --json` เพื่อตรวจสอบว่า bundled image providers ใด
  สามารถค้นพบได้ กำหนดค่าแล้ว ถูกเลือก และแต่ละ provider เปิดเผยความสามารถด้านการสร้าง/แก้ไขใดบ้าง
- ใช้ `image generate --model <provider/model> --json` เป็น live
  CLI smoke ที่แคบที่สุดสำหรับการเปลี่ยนแปลงด้านการสร้างรูปภาพ ตัวอย่าง:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  การตอบกลับ JSON จะรายงาน `ok`, `provider`, `model`, `attempts` และเส้นทางเอาต์พุต
  ที่เขียนไว้ เมื่อตั้งค่า `--output` แล้ว นามสกุลสุดท้ายอาจเป็นไปตามประเภท MIME
  ที่ provider ส่งกลับ

- สำหรับ `image describe` และ `image describe-many` ให้ใช้ `--prompt` เพื่อให้คำสั่งเฉพาะงานแก่ vision model เช่น OCR การเปรียบเทียบ การตรวจสอบ UI หรือการสร้างคำบรรยายแบบกระชับ
- ใช้ `--timeout-ms` กับ vision models ภายในเครื่องที่ช้า หรือเมื่อ Ollama เริ่มทำงานแบบ cold start
- สำหรับ `image describe`, `--model` ต้องเป็น `<provider/model>` ที่รองรับรูปภาพ
- สำหรับ Ollama vision models ภายในเครื่อง ให้ดึงโมเดลก่อนและตั้งค่า `OLLAMA_API_KEY` เป็นค่าตัวแทนใดก็ได้ เช่น `ollama-local` ดู [Ollama](/th/providers/ollama#vision-and-image-description)

## เสียง

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

ใช้ `tts` สำหรับการสังเคราะห์เสียงพูดและสถานะ TTS provider

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

หมายเหตุ:

- `tts status` มีค่าเริ่มต้นเป็น gateway เพราะสะท้อนสถานะ TTS ที่จัดการโดย gateway
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

- `video generate` รองรับ `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` และ `--timeout-ms` แล้วส่งต่อไปยัง runtime สำหรับการสร้างวิดีโอ
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

- ใช้ `web providers` เพื่อตรวจสอบ providers ที่พร้อมใช้งาน กำหนดค่าแล้ว และถูกเลือก

## การฝัง

ใช้ `embedding` สำหรับการสร้างเวกเตอร์และการตรวจสอบ embedding provider

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## เอาต์พุต JSON

คำสั่ง Infer จะปรับเอาต์พุต JSON ให้อยู่ภายใต้ envelope ร่วม:

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
`path`, `mimeType`, `size` และมิติใดๆ เฉพาะสื่อในอาร์เรย์นั้น
สำหรับงานอัตโนมัติแทนการแยกวิเคราะห์ stdout ที่อ่านได้โดยมนุษย์

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
