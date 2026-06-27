---
read_when:
    - การเพิ่มหรือแก้ไขคำสั่ง `openclaw infer`
    - ออกแบบระบบอัตโนมัติสำหรับความสามารถแบบ headless ที่เสถียร
summary: CLI แบบอนุมานก่อนสำหรับเวิร์กโฟลว์โมเดล รูปภาพ เสียง TTS วิดีโอ เว็บ และ embedding ที่รองรับโดยผู้ให้บริการ
title: CLI สำหรับการอนุมาน
x-i18n:
    generated_at: "2026-06-27T17:21:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93ebb2a830bfbe6aad58cfa7aa2252cf016a6c9cb99b7592406593627e41fdd1
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` คือพื้นผิวแบบ headless มาตรฐานสำหรับเวิร์กโฟลว์การอนุมานที่มีผู้ให้บริการรองรับ

โดยตั้งใจเปิดเผย capability families ไม่ใช่ชื่อ gateway RPC ดิบ และไม่ใช่ raw agent tool ids ดิบ

## เปลี่ยน infer ให้เป็น skill

คัดลอกและวางสิ่งนี้ให้ agent:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

skill ที่ดีซึ่งอิง infer ควร:

- จับคู่เจตนาทั่วไปของผู้ใช้กับ infer subcommand ที่ถูกต้อง
- มีตัวอย่าง infer มาตรฐานไม่กี่ตัวอย่างสำหรับเวิร์กโฟลว์ที่ครอบคลุม
- เลือกใช้ `openclaw infer ...` ในตัวอย่างและคำแนะนำ
- หลีกเลี่ยงการเขียนเอกสารพื้นผิว infer ทั้งหมดซ้ำภายในเนื้อหา skill

ขอบเขตทั่วไปของ skill ที่เน้น infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## เหตุผลที่ใช้ infer

`openclaw infer` ให้ CLI เดียวที่สอดคล้องกันสำหรับงานการอนุมานที่มีผู้ให้บริการรองรับภายใน OpenClaw

ประโยชน์:

- ใช้ผู้ให้บริการและโมเดลที่กำหนดค่าไว้แล้วใน OpenClaw แทนการต่อ wrapper เฉพาะกิจสำหรับ backend แต่ละตัว
- เก็บเวิร์กโฟลว์โมเดล รูปภาพ การถอดเสียง เสียงเป็นข้อความ วิดีโอ เว็บ และ embedding ไว้ภายใต้ command tree เดียว
- ใช้รูปแบบเอาต์พุต `--json` ที่เสถียรสำหรับสคริปต์ ระบบอัตโนมัติ และเวิร์กโฟลว์ที่ขับเคลื่อนด้วย agent
- เลือกใช้พื้นผิว OpenClaw แบบ first-party เมื่องานนั้นโดยพื้นฐานคือ "รันการอนุมาน"
- ใช้เส้นทาง local ปกติโดยไม่ต้องใช้ gateway สำหรับคำสั่ง infer ส่วนใหญ่

สำหรับการตรวจสอบผู้ให้บริการแบบ end-to-end ให้เลือกใช้ `openclaw infer ...` เมื่อการทดสอบ
ผู้ให้บริการระดับล่างผ่านแล้ว คำสั่งนี้ทดสอบ CLI ที่จัดส่งจริง การโหลด config
การ resolve default-agent การเปิดใช้งาน bundled Plugin และ runtime ของ capability
ร่วมกันก่อนส่งคำขอไปยังผู้ให้บริการ

## Command tree

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

ตารางนี้จับคู่งานการอนุมานทั่วไปกับคำสั่ง infer ที่สอดคล้องกัน

| งาน                           | คำสั่ง                                                                                        | หมายเหตุ                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| รันพรอมป์ข้อความ/โมเดล       | `openclaw infer model run --prompt "..." --json`                                              | ใช้เส้นทาง local ปกติเป็นค่าเริ่มต้น                 |
| รันพรอมป์โมเดลกับรูปภาพ      | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | ระบุ `--file` ซ้ำสำหรับอินพุตรูปภาพหลายรายการ       |
| สร้างรูปภาพ                  | `openclaw infer image generate --prompt "..." --json`                                         | ใช้ `image edit` เมื่อเริ่มจากไฟล์ที่มีอยู่          |
| อธิบายไฟล์รูปภาพหรือ URL     | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` ต้องเป็น `<provider/model>` ที่รองรับรูปภาพ |
| ถอดเสียง                     | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` ต้องเป็น `<provider/model>`                 |
| สังเคราะห์เสียงพูด           | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` มุ่งเน้น Gateway                         |
| สร้างวิดีโอ                  | `openclaw infer video generate --prompt "..." --json`                                         | รองรับคำใบ้สำหรับผู้ให้บริการ เช่น `--resolution`    |
| อธิบายไฟล์วิดีโอ             | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` ต้องเป็น `<provider/model>`                 |
| ค้นหาเว็บ                    | `openclaw infer web search --query "..." --json`                                              |                                                       |
| ดึงหน้าเว็บ                  | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| สร้าง embeddings             | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## พฤติกรรม

- `openclaw infer ...` คือพื้นผิว CLI หลักสำหรับเวิร์กโฟลว์เหล่านี้
- ใช้ `--json` เมื่อเอาต์พุตจะถูกใช้โดยคำสั่งหรือสคริปต์อื่น
- ใช้ `--provider` หรือ `--model provider/model` เมื่อต้องการ backend เฉพาะ
- ใช้ `model run --thinking <level>` เพื่อส่งระดับ thinking/reasoning แบบ one-shot (`off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` หรือ `max`) โดยยังคงให้การรันเป็นแบบ raw
- สำหรับ `image describe`, `audio transcribe` และ `video describe` นั้น `--model` ต้องใช้รูปแบบ `<provider/model>`
- สำหรับ `image describe` นั้น `--file` รับ path local และ URL รูปภาพ HTTP(S) URL ระยะไกลใช้ media-fetch SSRF policy ปกติ
- สำหรับ `image describe` นั้น `--model` ที่ระบุชัดเจนจะรัน provider/model นั้นโดยตรง โมเดลต้องรองรับรูปภาพใน model catalog หรือ provider config `codex/<model>` รันรอบการเข้าใจรูปภาพของ Codex app-server แบบมีขอบเขต; `openai/<model>` ใช้เส้นทางผู้ให้บริการ OpenAI พร้อม auth แบบ API-key หรือ ChatGPT/Codex OAuth
- คำสั่งการทำงานแบบ stateless ใช้ local เป็นค่าเริ่มต้น
- คำสั่งสถานะที่ Gateway จัดการใช้ gateway เป็นค่าเริ่มต้น
- เส้นทาง local ปกติไม่จำเป็นต้องให้ gateway ทำงานอยู่
- `model run` แบบ local คือ provider completion แบบ one-shot ที่กระชับ โดย resolve โมเดลและ auth ของ agent ที่กำหนดค่าไว้ แต่ไม่เริ่มรอบ chat-agent ไม่โหลด tools และไม่เปิด bundled MCP servers
- `model run --file` รับไฟล์รูปภาพ ตรวจจับ MIME type และส่งไปพร้อมพรอมป์ที่ระบุไปยังโมเดลที่เลือก ระบุ `--file` ซ้ำสำหรับหลายรูปภาพ
- `model run --file` ปฏิเสธอินพุตที่ไม่ใช่รูปภาพ ใช้ `infer audio transcribe` สำหรับไฟล์เสียง และ `infer video describe` สำหรับไฟล์วิดีโอ
- `model run --gateway` ทดสอบการ routing ของ Gateway, auth ที่บันทึกไว้, การเลือกผู้ให้บริการ และ runtime แบบฝังตัว แต่ยังคงรันเป็น raw model probe: ส่งพรอมป์ที่ให้มาและไฟล์แนบรูปภาพใดๆ โดยไม่มี transcript ของ session ก่อนหน้า, บริบท bootstrap/AGENTS, การประกอบ context-engine, tools หรือ bundled MCP servers
- `model run --gateway --model <provider/model>` ต้องใช้ credential ของ operator gateway ที่เชื่อถือได้ เพราะคำขอให้ Gateway รัน provider/model override แบบ one-off
- `model run --thinking` แบบ local ใช้เส้นทาง provider-completion ที่กระชับ; ระดับเฉพาะผู้ให้บริการ เช่น `adaptive` และ `max` จะถูก map ไปยังระดับ simple-completion แบบ portable ที่ใกล้ที่สุด

## โมเดล

ใช้ `model` สำหรับการอนุมานข้อความที่มีผู้ให้บริการรองรับ และการตรวจสอบโมเดล/ผู้ให้บริการ

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

ใช้ refs แบบเต็ม `<provider/model>` เพื่อ smoke-test ผู้ให้บริการเฉพาะรายโดยไม่ต้อง
เริ่ม Gateway หรือโหลดพื้นผิว agent tool ทั้งหมด:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

หมายเหตุ:

- `model run` แบบ local คือ smoke CLI ที่แคบที่สุดสำหรับสุขภาพของผู้ให้บริการ/โมเดล/auth เพราะสำหรับผู้ให้บริการที่ไม่ใช่ Codex คำสั่งนี้ส่งเฉพาะพรอมป์ที่ให้มาไปยังโมเดลที่เลือก
- `model run --model <provider/model>` แบบ local สามารถใช้แถว static catalog แบบ bundled ที่แน่นอนจาก `models list --all` ก่อนที่จะเขียนผู้ให้บริการนั้นลง config ได้ ยังต้องใช้ auth ของผู้ให้บริการอยู่; credential ที่หายไปจะล้มเหลวเป็นข้อผิดพลาด auth ไม่ใช่ `Unknown model`
- สำหรับ reasoning probes ของ Mistral Medium 3.5 ให้ปล่อย temperature เป็น unset/default Mistral ปฏิเสธ `reasoning_effort="high"` พร้อม `temperature: 0`; ใช้ `mistral/mistral-medium-3-5` กับ temperature ค่าเริ่มต้น หรือค่า reasoning-mode ที่ไม่ใช่ศูนย์ เช่น `0.7`
- local probes ของ Codex Responses เป็นข้อยกเว้นแคบๆ: OpenClaw เพิ่มคำสั่งระบบขั้นต่ำเพื่อให้ transport เติมฟิลด์ `instructions` ที่จำเป็นได้ โดยไม่เพิ่มบริบท agent แบบเต็ม tools, memory หรือ transcript ของ session
- `model run --file` แบบ local คงเส้นทางที่กระชับนั้นไว้ และแนบเนื้อหารูปภาพเข้ากับข้อความผู้ใช้เดียวโดยตรง ไฟล์รูปภาพทั่วไป เช่น PNG, JPEG และ WebP ใช้งานได้เมื่อ MIME type ถูกตรวจพบเป็น `image/*`; ไฟล์ที่ไม่รองรับหรือไม่รู้จักจะล้มเหลวก่อนเรียกผู้ให้บริการ
- `model run --file` เหมาะที่สุดเมื่อคุณต้องการทดสอบโมเดลข้อความ multimodal ที่เลือกโดยตรง ใช้ `infer image describe` เมื่อคุณต้องการการเลือกผู้ให้บริการด้านการเข้าใจรูปภาพของ OpenClaw และการ routing โมเดลรูปภาพเริ่มต้น
- โมเดลที่เลือกต้องรองรับอินพุตรูปภาพ; โมเดลข้อความอย่างเดียวอาจปฏิเสธคำขอที่ชั้นผู้ให้บริการ
- `model run --prompt` ต้องมีข้อความที่ไม่ใช่ช่องว่าง; พรอมป์ว่างจะถูกปฏิเสธก่อนเรียกผู้ให้บริการ local หรือ Gateway
- `model run` แบบ local ออกด้วยสถานะ non-zero เมื่อผู้ให้บริการไม่ส่งเอาต์พุตข้อความกลับมา ดังนั้นผู้ให้บริการ local ที่เข้าถึงไม่ได้และ completion ว่างจะไม่ดูเหมือน probe ที่สำเร็จ
- ใช้ `model run --gateway` เมื่อคุณต้องทดสอบการ routing ของ Gateway, การตั้งค่า agent-runtime หรือสถานะผู้ให้บริการที่ Gateway จัดการ โดยยังคงให้อินพุตโมเดลเป็น raw ใช้ `openclaw agent` หรือพื้นผิวแชทเมื่อคุณต้องการบริบท agent แบบเต็ม tools, memory และ transcript ของ session
- `model auth login`, `model auth logout` และ `model auth status` จัดการสถานะ auth ของผู้ให้บริการที่บันทึกไว้

## รูปภาพ

ใช้ `image` สำหรับการสร้าง การแก้ไข และคำอธิบาย

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "low-cost draft poster" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

หมายเหตุ:

- ใช้ `image edit` เมื่อเริ่มจากไฟล์อินพุตที่มีอยู่แล้ว
- ใช้ `--size`, `--aspect-ratio` หรือ `--resolution` กับ `image edit` สำหรับ
  ผู้ให้บริการ/โมเดลที่รองรับคำใบ้เรขาคณิตในการแก้ไขรูปภาพอ้างอิง
- ใช้ `--output-format png --background transparent` กับ
  `--model openai/gpt-image-1.5` สำหรับเอาต์พุต PNG ของ OpenAI ที่มีพื้นหลังโปร่งใส;
  `--openai-background` ยังคงพร้อมใช้งานในฐานะ alias เฉพาะของ OpenAI ผู้ให้บริการ
  ที่ไม่ได้ประกาศการรองรับพื้นหลังจะรายงานคำใบ้นี้เป็น override ที่ถูกละเว้น
- ใช้ `--quality low|medium|high|auto` สำหรับผู้ให้บริการที่รองรับคำใบ้คุณภาพรูปภาพ
  รวมถึง OpenAI ด้วย OpenAI ยังยอมรับ `--openai-moderation low|auto` สำหรับ
  คำใบ้การกลั่นกรองเฉพาะผู้ให้บริการ
- ใช้ `image providers --json` เพื่อตรวจสอบว่าผู้ให้บริการรูปภาพที่รวมมา
  ค้นพบได้ กำหนดค่าแล้ว ถูกเลือก และความสามารถในการสร้าง/แก้ไขใดบ้าง
  ที่แต่ละผู้ให้บริการเปิดเผย
- ใช้ `image generate --model <provider/model> --json` เป็นการทดสอบ live
  CLI smoke ที่แคบที่สุดสำหรับการเปลี่ยนแปลงการสร้างรูปภาพ ตัวอย่าง:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  การตอบกลับ JSON จะรายงาน `ok`, `provider`, `model`, `attempts` และพาธเอาต์พุต
  ที่เขียนไว้ เมื่อกำหนด `--output` แล้ว นามสกุลสุดท้ายอาจตาม MIME type
  ที่ผู้ให้บริการส่งกลับมา

- สำหรับ `image describe` และ `image describe-many` ให้ใช้ `--prompt` เพื่อให้คำสั่งเฉพาะงานแก่โมเดลวิชัน เช่น OCR, การเปรียบเทียบ, การตรวจสอบ UI หรือคำบรรยายสั้นกระชับ
- ใช้ `--timeout-ms` กับโมเดลวิชันภายในเครื่องที่ช้า หรือการเริ่ม Ollama แบบเย็น
- สำหรับ `image describe`, `--model` ต้องเป็น `<provider/model>` ที่รองรับรูปภาพ
- สำหรับโมเดลวิชัน Ollama ภายในเครื่อง ให้ดึงโมเดลก่อนและตั้งค่า `OLLAMA_API_KEY` เป็นค่าตัวยึดตำแหน่งใดก็ได้ เช่น `ollama-local` ดู [Ollama](/th/providers/ollama#vision-and-image-description)

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

ใช้ `tts` สำหรับการสังเคราะห์เสียงพูดและสถานะผู้ให้บริการ TTS

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

ใช้ `video` สำหรับการสร้างและการอธิบาย

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

หมายเหตุ:

- `video generate` ยอมรับ `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` และ `--timeout-ms` แล้วส่งต่อไปยังรันไทม์การสร้างวิดีโอ
- `--model` ต้องเป็น `<provider/model>` สำหรับ `video describe`

## เว็บ

ใช้ `web` สำหรับเวิร์กโฟลว์การค้นหาและการดึงข้อมูล

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

หมายเหตุ:

- ใช้ `web providers` เพื่อตรวจสอบผู้ให้บริการที่พร้อมใช้งาน กำหนดค่าแล้ว และถูกเลือก

## Embedding

ใช้ `embedding` สำหรับการสร้างเวกเตอร์และการตรวจสอบผู้ให้บริการ embedding

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## เอาต์พุต JSON

คำสั่ง infer ทำให้เอาต์พุต JSON อยู่ใน envelope ร่วมแบบมาตรฐาน:

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

- `openclaw capability ...` เป็น alias สำหรับ `openclaw infer ...`

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [โมเดล](/th/concepts/models)
