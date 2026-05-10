---
read_when:
    - การเพิ่มหรือแก้ไขคำสั่ง `openclaw infer`
    - การออกแบบการทำงานอัตโนมัติของความสามารถแบบไร้ส่วนติดต่อผู้ใช้ให้เสถียร
summary: CLI ที่เน้นการอนุมานเป็นหลักสำหรับเวิร์กโฟลว์โมเดล รูปภาพ เสียง TTS วิดีโอ เว็บ และการฝังเวกเตอร์ที่รองรับโดยผู้ให้บริการ
title: CLI สำหรับการอนุมาน
x-i18n:
    generated_at: "2026-05-10T19:30:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05496c5278650c30e5a52dceba105b703258040765f0a3f75268bb514270f15d
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` คือพื้นผิวแบบ headless ตามหลักสำหรับเวิร์กโฟลว์ inference ที่รองรับโดยผู้ให้บริการ

ตั้งใจเปิดเผยตระกูลความสามารถ ไม่ใช่ชื่อ RPC ของ Gateway แบบดิบ และไม่ใช่ id เครื่องมือ agent แบบดิบ

## เปลี่ยน infer ให้เป็น Skill

คัดลอกและวางสิ่งนี้ให้ agent:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Skill ที่ดีซึ่งอิง infer ควร:

- แมปเจตนาทั่วไปของผู้ใช้ไปยังคำสั่งย่อย infer ที่ถูกต้อง
- มีตัวอย่าง infer ตามหลักสองสามรายการสำหรับเวิร์กโฟลว์ที่ครอบคลุม
- เลือกใช้ `openclaw infer ...` ในตัวอย่างและคำแนะนำ
- หลีกเลี่ยงการทำเอกสารพื้นผิว infer ทั้งหมดซ้ำภายในเนื้อหา Skill

ขอบเขตทั่วไปของ Skill ที่เน้น infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## ทำไมจึงใช้ infer

`openclaw infer` ให้ CLI เดียวที่สอดคล้องกันสำหรับงาน inference ที่รองรับโดยผู้ให้บริการภายใน OpenClaw

ประโยชน์:

- ใช้ผู้ให้บริการและโมเดลที่กำหนดค่าไว้แล้วใน OpenClaw แทนการต่อ wrapper เฉพาะกิจสำหรับแต่ละ backend
- เก็บเวิร์กโฟลว์โมเดล รูปภาพ การถอดเสียงเสียงพูด TTS วิดีโอ เว็บ และ embedding ไว้ใต้แผนผังคำสั่งเดียว
- ใช้รูปแบบเอาต์พุต `--json` ที่เสถียรสำหรับสคริปต์ ระบบอัตโนมัติ และเวิร์กโฟลว์ที่ขับเคลื่อนโดย agent
- เลือกใช้พื้นผิวของ OpenClaw โดยตรงเมื่อภารกิจมีแก่นคือ "รัน inference"
- ใช้เส้นทาง local ปกติโดยไม่ต้องใช้ Gateway สำหรับคำสั่ง infer ส่วนใหญ่

สำหรับการตรวจสอบผู้ให้บริการแบบ end-to-end ให้เลือกใช้ `openclaw infer ...` เมื่อการทดสอบผู้ให้บริการระดับต่ำกว่าเป็นสีเขียวแล้ว คำสั่งนี้จะใช้งาน CLI ที่จัดส่งจริง การโหลด config การ resolve agent เริ่มต้น การเปิดใช้งาน Plugin ที่ bundled และ runtime ความสามารถร่วมกันก่อนส่งคำขอไปยังผู้ให้บริการ

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

ตารางนี้แมปงาน inference ทั่วไปกับคำสั่ง infer ที่เกี่ยวข้อง

| งาน                          | คำสั่ง                                                                                        | หมายเหตุ                                              |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| รัน prompt ข้อความ/โมเดล     | `openclaw infer model run --prompt "..." --json`                                              | ใช้เส้นทาง local ปกติโดยค่าเริ่มต้น                  |
| รัน prompt โมเดลกับรูปภาพ    | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | ใช้ `--file` ซ้ำสำหรับอินพุตรูปภาพหลายรายการ         |
| สร้างรูปภาพ                  | `openclaw infer image generate --prompt "..." --json`                                         | ใช้ `image edit` เมื่อเริ่มจากไฟล์ที่มีอยู่แล้ว      |
| อธิบายไฟล์รูปภาพ             | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` ต้องเป็น `<provider/model>` ที่รองรับรูปภาพ |
| ถอดเสียงเสียงพูด             | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` ต้องเป็น `<provider/model>`                 |
| สังเคราะห์เสียงพูด           | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` มุ่งเน้น Gateway                         |
| สร้างวิดีโอ                  | `openclaw infer video generate --prompt "..." --json`                                         | รองรับคำใบ้ของผู้ให้บริการ เช่น `--resolution`       |
| อธิบายไฟล์วิดีโอ             | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` ต้องเป็น `<provider/model>`                 |
| ค้นหาเว็บ                    | `openclaw infer web search --query "..." --json`                                              |                                                       |
| ดึงหน้าเว็บ                  | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| สร้าง embeddings             | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## พฤติกรรม

- `openclaw infer ...` คือพื้นผิว CLI หลักสำหรับเวิร์กโฟลว์เหล่านี้
- ใช้ `--json` เมื่อเอาต์พุตจะถูกใช้โดยคำสั่งหรือสคริปต์อื่น
- ใช้ `--provider` หรือ `--model provider/model` เมื่อจำเป็นต้องใช้ backend เฉพาะ
- ใช้ `model run --thinking <level>` เพื่อส่งระดับ thinking/reasoning แบบครั้งเดียว (`off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh`, หรือ `max`) โดยยังคงให้การรันเป็นแบบดิบ
- สำหรับ `image describe`, `audio transcribe`, และ `video describe`, `--model` ต้องใช้รูปแบบ `<provider/model>`
- สำหรับ `image describe` การระบุ `--model` อย่างชัดเจนจะรันผู้ให้บริการ/โมเดลนั้นโดยตรง โมเดลต้องรองรับรูปภาพในแค็ตตาล็อกโมเดลหรือ config ของผู้ให้บริการ `codex/<model>` จะรันเทิร์นการทำความเข้าใจรูปภาพของแอปเซิร์ฟเวอร์ Codex แบบมีขอบเขต; `openai-codex/<model>` ใช้เส้นทางผู้ให้บริการ OpenAI Codex OAuth
- คำสั่งการทำงานแบบ stateless มีค่าเริ่มต้นเป็น local
- คำสั่ง state ที่จัดการโดย Gateway มีค่าเริ่มต้นเป็น Gateway
- เส้นทาง local ปกติไม่จำเป็นต้องมี Gateway กำลังรันอยู่
- `model run` แบบ local คือการ completion ของผู้ให้บริการแบบครั้งเดียวที่บางเบา โดยจะ resolve โมเดลและ auth ของ agent ที่กำหนดค่าไว้ แต่จะไม่เริ่มเทิร์น chat-agent, โหลดเครื่องมือ, หรือเปิดเซิร์ฟเวอร์ MCP ที่ bundled
- `model run --file` รับไฟล์รูปภาพ ตรวจจับชนิด MIME และส่งไฟล์เหล่านั้นพร้อม prompt ที่ให้มาไปยังโมเดลที่เลือก ใช้ `--file` ซ้ำสำหรับหลายรูปภาพ
- `model run --file` ปฏิเสธอินพุตที่ไม่ใช่รูปภาพ ใช้ `infer audio transcribe` สำหรับไฟล์เสียง และ `infer video describe` สำหรับไฟล์วิดีโอ
- `model run --gateway` ทดสอบการ routing ของ Gateway, auth ที่บันทึกไว้, การเลือกผู้ให้บริการ และ runtime ที่ฝังไว้ แต่ยังคงรันเป็น probe โมเดลดิบ: ส่ง prompt ที่ให้มาและไฟล์แนบรูปภาพใด ๆ โดยไม่มี transcript เซสชันก่อนหน้า, บริบท bootstrap/AGENTS, การประกอบ context-engine, เครื่องมือ, หรือเซิร์ฟเวอร์ MCP ที่ bundled
- `model run --gateway --model <provider/model>` ต้องใช้ credential ของ Gateway สำหรับผู้ปฏิบัติการที่เชื่อถือได้ เพราะคำขอขอให้ Gateway รันการ override ผู้ให้บริการ/โมเดลแบบครั้งเดียว
- `model run --thinking` แบบ local ใช้เส้นทาง provider-completion ที่บางเบา; ระดับเฉพาะของผู้ให้บริการ เช่น `adaptive` และ `max` จะถูกแมปไปยังระดับ simple-completion แบบพกพาที่ใกล้ที่สุด

## โมเดล

ใช้ `model` สำหรับ inference ข้อความที่รองรับโดยผู้ให้บริการ และการตรวจสอบโมเดล/ผู้ให้บริการ

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

ใช้ ref แบบเต็ม `<provider/model>` เพื่อ smoke-test ผู้ให้บริการเฉพาะโดยไม่ต้องเริ่ม Gateway หรือโหลดพื้นผิวเครื่องมือ agent ทั้งหมด:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

หมายเหตุ:

- `model run` แบบ local คือ CLI smoke ที่แคบที่สุดสำหรับสุขภาพของผู้ให้บริการ/โมเดล/auth เพราะสำหรับผู้ให้บริการที่ไม่ใช่ Codex จะส่งเฉพาะ prompt ที่ให้มาไปยังโมเดลที่เลือก
- `model run --model <provider/model>` แบบ local สามารถใช้แถวแค็ตตาล็อกสแตติกที่ bundled แบบตรงตัวจาก `models list --all` ก่อนที่ผู้ให้บริการนั้นจะถูกเขียนลง config ได้ ยังคงต้องใช้ auth ของผู้ให้บริการ; credential ที่ขาดหายจะล้มเหลวเป็นข้อผิดพลาด auth ไม่ใช่ `Unknown model`
- สำหรับ probe reasoning ของ Mistral Medium 3.5 ให้ปล่อย temperature เป็น unset/default Mistral ปฏิเสธ `reasoning_effort="high"` ร่วมกับ `temperature: 0`; ใช้ `mistral/mistral-medium-3-5` พร้อม temperature เริ่มต้น หรือค่าของโหมด reasoning ที่ไม่เป็นศูนย์ เช่น `0.7`
- probe แบบ local ของ `openai-codex/*` เป็นข้อยกเว้นแคบ ๆ: OpenClaw เพิ่มคำสั่งระบบขั้นต่ำ เพื่อให้ transport ของ Codex Responses เติมฟิลด์ `instructions` ที่จำเป็นได้ โดยไม่เพิ่มบริบท agent เต็ม เครื่องมือ หน่วยความจำ หรือ transcript เซสชัน
- `model run --file` แบบ local คงเส้นทางที่บางเบานั้นไว้ และแนบเนื้อหารูปภาพโดยตรงไปยังข้อความผู้ใช้เดียว ไฟล์รูปภาพทั่วไป เช่น PNG, JPEG และ WebP ใช้งานได้เมื่อชนิด MIME ถูกตรวจพบเป็น `image/*`; ไฟล์ที่ไม่รองรับหรือไม่รู้จักจะล้มเหลวก่อนเรียกผู้ให้บริการ
- `model run --file` เหมาะที่สุดเมื่อคุณต้องการทดสอบโมเดลข้อความ multimodal ที่เลือกโดยตรง ใช้ `infer image describe` เมื่อคุณต้องการการเลือกผู้ให้บริการสำหรับการทำความเข้าใจรูปภาพของ OpenClaw และ routing โมเดลรูปภาพเริ่มต้น
- โมเดลที่เลือกต้องรองรับอินพุตรูปภาพ; โมเดลที่รองรับเฉพาะข้อความอาจปฏิเสธคำขอที่ชั้นผู้ให้บริการ
- `model run --prompt` ต้องมีข้อความที่ไม่ใช่ whitespace; prompt ว่างจะถูกปฏิเสธก่อนเรียกผู้ให้บริการ local หรือ Gateway
- `model run` แบบ local ออกด้วยสถานะไม่เป็นศูนย์เมื่อผู้ให้บริการไม่ส่งคืนเอาต์พุตข้อความ ดังนั้นผู้ให้บริการ local ที่เข้าถึงไม่ได้และ completion ว่างจะไม่ดูเหมือน probe ที่สำเร็จ
- ใช้ `model run --gateway` เมื่อคุณต้องทดสอบการ routing ของ Gateway, การตั้งค่า agent-runtime, หรือ state ของผู้ให้บริการที่จัดการโดย Gateway โดยคงอินพุตโมเดลให้เป็นแบบดิบ ใช้ `openclaw agent` หรือพื้นผิวแชตเมื่อคุณต้องการบริบท agent เต็ม เครื่องมือ หน่วยความจำ และ transcript เซสชัน
- `model auth login`, `model auth logout`, และ `model auth status` จัดการ state auth ของผู้ให้บริการที่บันทึกไว้

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
- ใช้ `--size`, `--aspect-ratio` หรือ `--resolution` กับ `image edit` สำหรับ
  providers/models ที่รองรับคำใบ้ด้านเรขาคณิตในการแก้ไขรูปภาพอ้างอิง
- ใช้ `--output-format png --background transparent` กับ
  `--model openai/gpt-image-1.5` สำหรับเอาต์พุต PNG พื้นหลังโปร่งใสของ OpenAI;
  `--openai-background` ยังคงใช้ได้ในฐานะนามแฝงเฉพาะของ OpenAI Providers
  ที่ไม่ได้ประกาศการรองรับพื้นหลังจะรายงานคำใบ้นี้เป็นการแทนที่ที่ถูกละเว้น
- ใช้ `image providers --json` เพื่อตรวจสอบว่า providers รูปภาพที่มาพร้อมชุดติดตั้งใด
  สามารถค้นพบได้ กำหนดค่าแล้ว ถูกเลือก และแต่ละ provider เปิดเผยความสามารถ
  ในการสร้าง/แก้ไขใดบ้าง
- ใช้ `image generate --model <provider/model> --json` เป็น CLI smoke แบบ live
  ที่แคบที่สุดสำหรับการเปลี่ยนแปลงการสร้างรูปภาพ ตัวอย่าง:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  การตอบกลับ JSON จะรายงาน `ok`, `provider`, `model`, `attempts` และพาธเอาต์พุต
  ที่เขียนไว้ เมื่อกำหนด `--output` นามสกุลสุดท้ายอาจเป็นไปตามชนิด MIME
  ที่ provider ส่งกลับ

- สำหรับ `image describe` และ `image describe-many` ให้ใช้ `--prompt` เพื่อให้คำสั่งเฉพาะงานแก่โมเดล vision เช่น OCR การเปรียบเทียบ การตรวจสอบ UI หรือการสร้างคำบรรยายสั้นๆ
- ใช้ `--timeout-ms` กับโมเดล vision ในเครื่องที่ช้า หรือการเริ่มต้น Ollama แบบเย็น
- สำหรับ `image describe`, `--model` ต้องเป็น `<provider/model>` ที่รองรับรูปภาพ
- สำหรับโมเดล vision ของ Ollama ในเครื่อง ให้ pull โมเดลก่อนและตั้งค่า `OLLAMA_API_KEY` เป็นค่าตัวแทนใดก็ได้ เช่น `ollama-local` ดู [Ollama](/th/providers/ollama#vision-and-image-description)

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

ใช้ `tts` สำหรับการสังเคราะห์เสียงพูดและสถานะของ provider TTS

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

หมายเหตุ:

- `tts status` มีค่าเริ่มต้นเป็น gateway เพราะสะท้อนสถานะ TTS ที่ Gateway จัดการ
- ใช้ `tts providers`, `tts voices` และ `tts set-provider` เพื่อตรวจสอบและกำหนดค่าพฤติกรรม TTS

## วิดีโอ

ใช้ `video` สำหรับการสร้างและคำอธิบาย

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

- ใช้ `web providers` เพื่อตรวจสอบ providers ที่มีอยู่ กำหนดค่าแล้ว และถูกเลือก

## การฝังเวกเตอร์

ใช้ `embedding` สำหรับการสร้างเวกเตอร์และการตรวจสอบ provider embedding

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## เอาต์พุต JSON

คำสั่ง Infer ทำให้เอาต์พุต JSON อยู่ในซองร่วมที่เป็นมาตรฐาน:

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
`path`, `mimeType`, `size` และมิติที่เฉพาะกับสื่อใดๆ ในอาร์เรย์นั้น
สำหรับระบบอัตโนมัติ แทนการแยกวิเคราะห์ stdout ที่มนุษย์อ่านได้

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

- `openclaw capability ...` เป็นนามแฝงของ `openclaw infer ...`

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [โมเดล](/th/concepts/models)
