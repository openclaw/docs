---
read_when:
    - การเพิ่มหรือแก้ไขคำสั่ง `openclaw infer`
    - การออกแบบระบบอัตโนมัติด้านความสามารถแบบไร้ส่วนติดต่อผู้ใช้ที่เสถียร
summary: CLI ที่เน้นการอนุมานก่อนสำหรับเวิร์กโฟลว์โมเดล รูปภาพ เสียง TTS วิดีโอ เว็บ และการฝังเวกเตอร์ที่ขับเคลื่อนโดยผู้ให้บริการ
title: CLI สำหรับการอนุมาน
x-i18n:
    generated_at: "2026-07-01T08:46:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb63996dd1364bffba58d4b132849ac4157fb612555c009da795c963142f9368
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` คือพื้นผิวแบบไม่มีส่วนหัวมาตรฐานสำหรับเวิร์กโฟลว์การอนุมานที่มีผู้ให้บริการรองรับ

ตั้งใจเปิดเผยกลุ่มความสามารถ ไม่ใช่ชื่อ gateway RPC ดิบ และไม่ใช่รหัสเครื่องมือ agent ดิบ

## เปลี่ยน infer ให้เป็น skill

คัดลอกและวางสิ่งนี้ให้ agent:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

skill ที่อิง infer ที่ดีควร:

- แมปเจตนาผู้ใช้ทั่วไปไปยังคำสั่งย่อย infer ที่ถูกต้อง
- มีตัวอย่าง infer มาตรฐานไม่กี่รายการสำหรับเวิร์กโฟลว์ที่ครอบคลุม
- เลือกใช้ `openclaw infer ...` ในตัวอย่างและคำแนะนำ
- หลีกเลี่ยงการจัดทำเอกสารพื้นผิว infer ทั้งหมดซ้ำภายในเนื้อหา skill

ขอบเขตทั่วไปของ skill ที่เน้น infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## เหตุผลที่ใช้ infer

`openclaw infer` มี CLI เดียวที่สอดคล้องกันสำหรับงานอนุมานที่มีผู้ให้บริการรองรับภายใน OpenClaw

ประโยชน์:

- ใช้ผู้ให้บริการและโมเดลที่กำหนดค่าไว้แล้วใน OpenClaw แทนการต่อ wrapper เฉพาะกิจสำหรับแต่ละ backend
- เก็บเวิร์กโฟลว์โมเดล รูปภาพ การถอดเสียงเสียง TTS วิดีโอ เว็บ และ embedding ไว้ใต้แผนผังคำสั่งเดียว
- ใช้รูปแบบเอาต์พุต `--json` ที่เสถียรสำหรับสคริปต์ ระบบอัตโนมัติ และเวิร์กโฟลว์ที่ขับเคลื่อนโดย agent
- เลือกใช้พื้นผิว OpenClaw แบบ first-party เมื่องานนั้นโดยพื้นฐานคือ "รันการอนุมาน"
- ใช้เส้นทาง local ปกติโดยไม่ต้องใช้ gateway สำหรับคำสั่ง infer ส่วนใหญ่

สำหรับการตรวจสอบผู้ให้บริการแบบครบวงจร ให้เลือกใช้ `openclaw infer ...` หลังจากการทดสอบ
ผู้ให้บริการระดับต่ำกว่าผ่านแล้ว คำสั่งนี้ทดสอบ CLI ที่จัดส่งจริง การโหลด config
การแก้ค่า agent เริ่มต้น การเปิดใช้งาน Plugin ที่ bundled มา และ runtime ความสามารถร่วม
ก่อนที่จะส่งคำขอไปยังผู้ให้บริการ

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

ตารางนี้แมปงานอนุมานทั่วไปกับคำสั่ง infer ที่สอดคล้องกัน

| งาน                          | คำสั่ง                                                                                       | หมายเหตุ                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| รันพรอมป์ข้อความ/โมเดล       | `openclaw infer model run --prompt "..." --json`                                              | ใช้เส้นทาง local ปกติโดยค่าเริ่มต้น                 |
| รันพรอมป์โมเดลบนรูปภาพ  | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | ใช้ `--file` ซ้ำสำหรับอินพุตรูปภาพหลายรายการ             |
| สร้างรูปภาพ             | `openclaw infer image generate --prompt "..." --json`                                         | ใช้ `image edit` เมื่อเริ่มจากไฟล์ที่มีอยู่  |
| อธิบายไฟล์รูปภาพหรือ URL | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` ต้องเป็น `<provider/model>` ที่รองรับรูปภาพ |
| ถอดเสียงเสียง              | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` ต้องเป็น `<provider/model>`                  |
| สังเคราะห์เสียงพูด             | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` มุ่งเน้น gateway                      |
| สร้างวิดีโอ              | `openclaw infer video generate --prompt "..." --json`                                         | รองรับ hint ของผู้ให้บริการ เช่น `--resolution`        |
| อธิบายไฟล์วิดีโอ         | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` ต้องเป็น `<provider/model>`                  |
| ค้นหาเว็บ                | `openclaw infer web search --query "..." --json`                                              |                                                       |
| ดึงหน้าเว็บ              | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| สร้าง embeddings             | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## พฤติกรรม

- `openclaw infer ...` คือพื้นผิว CLI หลักสำหรับเวิร์กโฟลว์เหล่านี้
- ใช้ `--json` เมื่อเอาต์พุตจะถูกนำไปใช้โดยคำสั่งหรือสคริปต์อื่น
- ใช้ `--provider` หรือ `--model provider/model` เมื่อต้องการ backend เฉพาะ
- ใช้ `model run --thinking <level>` เพื่อส่งระดับ thinking/reasoning แบบครั้งเดียว (`off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` หรือ `max`) โดยยังคงให้การรันเป็นแบบ raw
- สำหรับ `image describe`, `audio transcribe` และ `video describe`, `--model` ต้องใช้รูปแบบ `<provider/model>`
- สำหรับ `image describe`, `--file` รับเส้นทาง local และ URL รูปภาพ HTTP(S) URL ระยะไกลใช้นโยบาย SSRF สำหรับการดึงสื่อปกติ
- สำหรับ `image describe`, `--model` ที่ระบุชัดเจนจะรัน provider/model นั้นก่อน แล้วจึงลอง `agents.defaults.imageModel.fallbacks` ที่กำหนดค่าไว้เมื่อการเรียกโมเดลล้มเหลว ข้อผิดพลาดในการเตรียมอินพุต เช่น ไฟล์หายหรือ URL ไม่รองรับ จะล้มเหลวก่อนความพยายาม fallback โมเดลต้องรองรับรูปภาพในแค็ตตาล็อกโมเดลหรือ config ของผู้ให้บริการ `codex/<model>` รัน turn การทำความเข้าใจรูปภาพของ app-server Codex แบบมีขอบเขต; `openai/<model>` ใช้เส้นทางผู้ให้บริการ OpenAI พร้อม auth แบบ API-key หรือ ChatGPT/Codex OAuth
- คำสั่งการทำงานแบบไร้สถานะใช้ local เป็นค่าเริ่มต้น
- คำสั่งสถานะที่ Gateway จัดการใช้ gateway เป็นค่าเริ่มต้น
- เส้นทาง local ปกติไม่จำเป็นต้องให้ gateway กำลังทำงานอยู่
- `model run` แบบ local เป็นการเติมเต็มจากผู้ให้บริการแบบครั้งเดียวที่กระชับ จะแก้ค่าโมเดล agent และ auth ที่กำหนดค่าไว้ แต่จะไม่เริ่ม turn ของ chat-agent โหลดเครื่องมือ หรือเปิดเซิร์ฟเวอร์ MCP ที่ bundled มา
- `model run --file` รับไฟล์รูปภาพ ตรวจจับชนิด MIME และส่งไปพร้อมพรอมป์ที่ให้มาไปยังโมเดลที่เลือก ใช้ `--file` ซ้ำสำหรับรูปภาพหลายรายการ
- `model run --file` ปฏิเสธอินพุตที่ไม่ใช่รูปภาพ ใช้ `infer audio transcribe` สำหรับไฟล์เสียงและ `infer video describe` สำหรับไฟล์วิดีโอ
- `model run --gateway` ทดสอบการ routing ของ Gateway, auth ที่บันทึกไว้, การเลือกผู้ให้บริการ และ runtime แบบ embedded แต่ยังรันเป็นการ probe โมเดลแบบ raw: ส่งพรอมป์ที่ให้มาและไฟล์แนบรูปภาพใด ๆ โดยไม่มี transcript ของเซสชันก่อนหน้า, บริบท bootstrap/AGENTS, การประกอบ context-engine, เครื่องมือ หรือเซิร์ฟเวอร์ MCP ที่ bundled มา
- `model run --gateway --model <provider/model>` ต้องใช้ข้อมูลรับรอง gateway ของผู้ปฏิบัติการที่เชื่อถือได้ เพราะคำขอขอให้ Gateway รันการ override provider/model แบบครั้งเดียว
- `model run --thinking` แบบ local ใช้เส้นทางการเติมเต็มจากผู้ให้บริการแบบกระชับ ระดับเฉพาะผู้ให้บริการ เช่น `adaptive` และ `max` จะถูกแมปไปยังระดับ simple-completion แบบ portable ที่ใกล้เคียงที่สุด

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

ใช้ ref แบบเต็ม `<provider/model>` เพื่อ smoke-test ผู้ให้บริการเฉพาะโดยไม่ต้อง
เริ่ม Gateway หรือโหลดพื้นผิวเครื่องมือ agent ทั้งหมด:

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

- `model run` แบบ local คือ CLI smoke ที่แคบที่สุดสำหรับสุขภาพ provider/model/auth เพราะสำหรับผู้ให้บริการที่ไม่ใช่ Codex จะส่งเฉพาะพรอมป์ที่ให้มาไปยังโมเดลที่เลือก
- `model run --model <provider/model>` แบบ local สามารถใช้แถวแค็ตตาล็อก static ที่ bundled มาแบบตรงจาก `models list --all` ก่อนที่ผู้ให้บริการนั้นจะถูกเขียนลง config ยังต้องมี auth ของผู้ให้บริการ; ข้อมูลรับรองที่หายไปล้มเหลวเป็นข้อผิดพลาด auth ไม่ใช่ `Unknown model`
- สำหรับ probe reasoning ของ Mistral Medium 3.5 ให้ปล่อย temperature ไม่ตั้งค่า/ค่าเริ่มต้น Mistral ปฏิเสธ `reasoning_effort="high"` พร้อม `temperature: 0`; ใช้ `mistral/mistral-medium-3-5` กับ temperature เริ่มต้นหรือค่า reasoning-mode ที่ไม่เป็นศูนย์ เช่น `0.7`
- probe local ของ Codex Responses เป็นข้อยกเว้นที่แคบ: OpenClaw เพิ่ม system instruction ขั้นต่ำเพื่อให้ transport เติมฟิลด์ `instructions` ที่จำเป็นได้ โดยไม่เพิ่มบริบท agent เต็มรูปแบบ เครื่องมือ หน่วยความจำ หรือ transcript ของเซสชัน
- `model run --file` แบบ local คงเส้นทางกระชับนั้นไว้และแนบเนื้อหารูปภาพเข้ากับข้อความผู้ใช้เดียวโดยตรง ไฟล์รูปภาพทั่วไป เช่น PNG, JPEG และ WebP ใช้ได้เมื่อชนิด MIME ถูกตรวจจับเป็น `image/*`; ไฟล์ที่ไม่รองรับหรือไม่รู้จักจะล้มเหลวก่อนเรียกผู้ให้บริการ
- `model run --file` เหมาะที่สุดเมื่อคุณต้องการทดสอบโมเดลข้อความหลายโหมดที่เลือกโดยตรง ใช้ `infer image describe` เมื่อคุณต้องการการเลือกผู้ให้บริการเพื่อทำความเข้าใจรูปภาพของ OpenClaw และการ routing โมเดลรูปภาพเริ่มต้น
- โมเดลที่เลือกต้องรองรับอินพุตรูปภาพ; โมเดลข้อความอย่างเดียวอาจปฏิเสธคำขอที่เลเยอร์ผู้ให้บริการ
- `model run --prompt` ต้องมีข้อความที่ไม่ใช่ช่องว่าง; พรอมป์ว่างจะถูกปฏิเสธก่อนเรียกผู้ให้บริการ local หรือ Gateway
- `model run` แบบ local ออกด้วยรหัสไม่เป็นศูนย์เมื่อผู้ให้บริการไม่ส่งคืนเอาต์พุตข้อความ ดังนั้นผู้ให้บริการ local ที่เข้าถึงไม่ได้และการเติมเต็มว่างจะไม่ดูเหมือน probe ที่สำเร็จ
- ใช้ `model run --gateway` เมื่อคุณต้องทดสอบการ routing ของ Gateway, การตั้งค่า agent-runtime หรือสถานะผู้ให้บริการที่ Gateway จัดการ โดยยังคงให้อินพุตโมเดลเป็นแบบ raw ใช้ `openclaw agent` หรือพื้นผิวแชตเมื่อคุณต้องการบริบท agent เต็มรูปแบบ เครื่องมือ หน่วยความจำ และ transcript ของเซสชัน
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

- ใช้ `image edit` เมื่อเริ่มจากไฟล์อินพุตที่มีอยู่
- ใช้ `--size`, `--aspect-ratio` หรือ `--resolution` กับ `image edit` สำหรับ
  ผู้ให้บริการ/โมเดลที่รองรับคำใบ้เรขาคณิตในการแก้ไขรูปภาพอ้างอิง
- ใช้ `--output-format png --background transparent` กับ
  `--model openai/gpt-image-1.5` สำหรับเอาต์พุต PNG พื้นหลังโปร่งใสของ OpenAI;
  `--openai-background` ยังคงใช้งานได้ในฐานะนามแฝงเฉพาะ OpenAI ผู้ให้บริการ
  ที่ไม่ได้ประกาศการรองรับพื้นหลังจะรายงานคำใบ้นี้เป็นการแทนที่ที่ถูกละเว้น
- ใช้ `--quality low|medium|high|auto` สำหรับผู้ให้บริการที่รองรับคำใบ้คุณภาพรูปภาพ
  รวมถึง OpenAI ด้วย OpenAI ยังรับ `--openai-moderation low|auto` สำหรับ
  คำใบ้การกลั่นกรองเฉพาะผู้ให้บริการ
- ใช้ `image providers --json` เพื่อตรวจสอบว่าผู้ให้บริการรูปภาพที่รวมมาใด
  ค้นพบได้ กำหนดค่าแล้ว ถูกเลือก และแต่ละผู้ให้บริการเปิดเผยความสามารถ
  ในการสร้าง/แก้ไขใดบ้าง
- ใช้ `image generate --model <provider/model> --json` เป็น smoke CLI แบบ live
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
  ที่เขียนแล้ว เมื่อกำหนด `--output` นามสกุลสุดท้ายอาจเป็นไปตามชนิด MIME
  ที่ผู้ให้บริการส่งกลับ

- สำหรับ `image describe` และ `image describe-many` ให้ใช้ `--prompt` เพื่อให้คำสั่งเฉพาะงานแก่โมเดล vision เช่น OCR, การเปรียบเทียบ, การตรวจสอบ UI หรือคำบรรยายภาพแบบกระชับ
- ใช้ `--timeout-ms` กับโมเดล vision ภายในเครื่องที่ทำงานช้า หรือการเริ่ม Ollama แบบเย็น
- สำหรับ `image describe`, `--model` ต้องเป็น `<provider/model>` ที่รองรับรูปภาพ
  เมื่อกำหนดแล้ว OpenClaw จะลองโมเดลที่ระบุอย่างชัดเจนนั้นก่อน จากนั้นจึงใช้
  fallback ของโมเดลรูปภาพที่กำหนดค่าไว้หากการเรียกโมเดลล้มเหลว
- สำหรับโมเดล vision ของ Ollama ภายในเครื่อง ให้ pull โมเดลก่อน และตั้งค่า `OLLAMA_API_KEY` เป็นค่าตัวยึดใดก็ได้ เช่น `ollama-local` ดู [Ollama](/th/providers/ollama#vision-and-image-description)

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
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
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

- ใช้ `web providers` เพื่อตรวจสอบผู้ให้บริการที่มีอยู่ กำหนดค่าแล้ว และถูกเลือก

## การฝังเวกเตอร์

ใช้ `embedding` สำหรับการสร้างเวกเตอร์และการตรวจสอบผู้ให้บริการ embedding

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## เอาต์พุต JSON

คำสั่ง infer ทำให้เอาต์พุต JSON อยู่ในรูปแบบซองร่วมเดียวกัน:

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
`path`, `mimeType`, `size` และมิติใด ๆ เฉพาะสื่อในอาร์เรย์นั้น
สำหรับการทำงานอัตโนมัติ แทนการแยกวิเคราะห์ stdout ที่มนุษย์อ่านได้

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

- [คู่มืออ้างอิง CLI](/th/cli)
- [โมเดล](/th/concepts/models)
