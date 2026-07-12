---
read_when:
    - การเพิ่มหรือแก้ไขคำสั่ง `openclaw infer`
    - การออกแบบระบบอัตโนมัติสำหรับความสามารถแบบไร้ส่วนติดต่อที่เสถียร
summary: CLI ที่เน้นการอนุมานก่อนสำหรับเวิร์กโฟลว์โมเดล รูปภาพ เสียง การแปลงข้อความเป็นเสียง วิดีโอ เว็บ และการฝังข้อมูลที่รองรับโดยผู้ให้บริการ
title: CLI สำหรับการอนุมาน
x-i18n:
    generated_at: "2026-07-12T16:00:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ec90377d3fb6049e63f5eb1dddfb085562982152b1b2ba7bd4e4d2535ab3c06f
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` คืออินเทอร์เฟซแบบไม่ใช้หน้าจอหลักสำหรับการอนุมานที่ทำงานผ่านผู้ให้บริการ โดยเปิดเผยกลุ่มความสามารถ (`model`, `image`, `audio`, `tts`, `video`, `web`, `embedding`) ไม่ใช่ชื่อ RPC ดิบของ Gateway หรือรหัสเครื่องมือของเอเจนต์ `openclaw capability ...` เป็นนามแฝงของโครงสร้างคำสั่งเดียวกัน

เหตุผลที่ควรเลือกใช้แทนตัวห่อหุ้มผู้ให้บริการที่สร้างขึ้นเฉพาะกิจ:

- ใช้ผู้ให้บริการและโมเดลที่กำหนดค่าไว้ใน OpenClaw แล้วซ้ำได้
- มีเอนเวโลป `--json` ที่เสถียรสำหรับสคริปต์และระบบอัตโนมัติที่ขับเคลื่อนโดยเอเจนต์ (ดู [เอาต์พุต JSON](#json-output))
- สำหรับคำสั่งย่อยส่วนใหญ่ จะทำงานผ่านเส้นทางภายในเครื่องตามปกติโดยไม่ใช้ Gateway
- สำหรับการตรวจสอบผู้ให้บริการแบบต้นทางถึงปลายทาง คำสั่งนี้จะทดสอบ CLI ที่เผยแพร่จริง การโหลดการกำหนดค่า การระบุเอเจนต์เริ่มต้น การเปิดใช้งาน Plugin ที่รวมมาให้ และรันไทม์ความสามารถที่ใช้ร่วมกัน ก่อนส่งคำขอไปยังผู้ให้บริการ

## เปลี่ยน infer ให้เป็น Skills

คัดลอกและวางข้อความนี้ให้เอเจนต์:

```text
อ่าน https://docs.openclaw.ai/cli/infer แล้วสร้าง Skills ที่กำหนดเส้นทางเวิร์กโฟลว์ทั่วไปของฉันไปยัง `openclaw infer`
เน้นการเรียกใช้โมเดล การสร้างภาพ การสร้างวิดีโอ การถอดเสียง การสังเคราะห์เสียงพูด การค้นหาเว็บ และเวกเตอร์ฝังตัว
```

Skills ที่ใช้ infer อย่างเหมาะสมจะจับคู่เจตนาทั่วไปของผู้ใช้กับคำสั่งย่อยที่ถูกต้อง มีตัวอย่างมาตรฐานสองสามรายการต่อเวิร์กโฟลว์ เลือกใช้ `openclaw infer ...` แทนทางเลือกระดับล่าง และไม่จัดทำเอกสารอินเทอร์เฟซ infer ทั้งหมดซ้ำในเนื้อหา Skills

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
    personas
    status
    enable
    disable
    set-provider
    set-persona

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

`infer list` / `infer inspect --name <capability>` แสดงโครงสร้างนี้ในรูปแบบข้อมูล (รหัสความสามารถ การรับส่งข้อมูล คำอธิบาย)

## งานทั่วไป

| งาน                           | คำสั่ง                                                                                        | หมายเหตุ                                               |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| เรียกใช้พรอมต์ข้อความ/โมเดล       | `openclaw infer model run --prompt "..." --json`                                              | ใช้ภายในเครื่องโดยค่าเริ่มต้น                              |
| เรียกใช้พรอมต์โมเดลกับภาพ          | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | ใช้ `--file` ซ้ำสำหรับหลายภาพ                           |
| สร้างภาพ                       | `openclaw infer image generate --prompt "..." --json`                                         | ใช้ `image edit` เมื่อเริ่มจากไฟล์ที่มีอยู่                    |
| อธิบายไฟล์ภาพหรือ URL            | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` ต้องเป็น `<provider/model>` ที่รองรับภาพ         |
| ถอดเสียง                       | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` ต้องเป็น `<provider/model>`                  |
| สังเคราะห์เสียงพูด                | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` ทำงานผ่าน Gateway เท่านั้น                 |
| สร้างวิดีโอ                      | `openclaw infer video generate --prompt "..." --json`                                         | รองรับคำแนะนำเฉพาะผู้ให้บริการ เช่น `--resolution`          |
| อธิบายไฟล์วิดีโอ                  | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` ต้องเป็น `<provider/model>`                  |
| ค้นหาเว็บ                       | `openclaw infer web search --query "..." --json`                                              |                                                       |
| ดึงข้อมูลหน้าเว็บ                  | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| สร้างเวกเตอร์ฝังตัว                | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## ลักษณะการทำงาน

- ใช้ `--json` เมื่อเอาต์พุตจะถูกส่งต่อให้คำสั่งหรือสคริปต์อื่น มิฉะนั้นให้ใช้เอาต์พุตข้อความ
- ใช้ `--provider` หรือ `--model provider/model` เพื่อระบุแบ็กเอนด์ที่ต้องการ
- ใช้ `model run --thinking <level>` เพื่อแทนที่ระดับการคิด/การให้เหตุผลสำหรับการเรียกครั้งเดียว: `off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` หรือ `max`
- สำหรับ `image describe`, `audio transcribe` และ `video describe` ค่า `--model` ต้องอยู่ในรูปแบบ `<provider/model>`
- สำหรับ `image describe` ค่า `--file` รับพาธภายในเครื่องและ URL แบบ HTTP(S) โดย URL ระยะไกลจะผ่านนโยบาย SSRF สำหรับการดึงสื่อตามปกติ
- คำสั่งที่ทำงานแบบไร้สถานะ (`model run`, `image *`, `audio *`, `video *`, `web *`, `embedding *`) ใช้ภายในเครื่องโดยค่าเริ่มต้น ส่วนคำสั่งสถานะที่ Gateway จัดการ (`tts status`) ใช้ Gateway โดยค่าเริ่มต้น
- เส้นทางภายในเครื่องไม่จำเป็นต้องให้ Gateway ทำงานอยู่
- `model run` ภายในเครื่องคือการสร้างผลลัพธ์จากผู้ให้บริการแบบครั้งเดียวที่กระชับ โดยจะระบุโมเดลและข้อมูลยืนยันตัวตนของเอเจนต์ที่กำหนดค่าไว้ แต่จะไม่เริ่มรอบการสนทนาของเอเจนต์ โหลดเครื่องมือ หรือเปิดเซิร์ฟเวอร์ MCP ที่รวมมาให้
- `model run --file` แนบไฟล์ภาพ (ตรวจหาชนิด MIME อัตโนมัติ) ไปกับพรอมต์ ใช้ `--file` ซ้ำสำหรับหลายภาพ ระบบจะปฏิเสธไฟล์ที่ไม่ใช่ภาพ ให้ใช้ `infer audio transcribe` หรือ `infer video describe` แทน
- `model run --gateway` ทดสอบการกำหนดเส้นทางของ Gateway ข้อมูลยืนยันตัวตนที่บันทึกไว้ การเลือกผู้ให้บริการ และรันไทม์แบบฝัง แต่ยังคงเป็นการตรวจสอบโมเดลดิบ โดยไม่มีบทสนทนาจากเซสชันก่อนหน้า บริบทบูตสแตรป/AGENTS เครื่องมือ หรือเซิร์ฟเวอร์ MCP ที่รวมมาให้
- `model run --gateway --model <provider/model>` ต้องใช้ข้อมูลประจำตัว Gateway ของผู้ดำเนินการที่เชื่อถือได้ เพราะเป็นการขอให้ Gateway ใช้การแทนที่ผู้ให้บริการ/โมเดลแบบครั้งเดียว

## โมเดล

การอนุมานข้อความและการตรวจสอบโมเดล/ผู้ให้บริการ

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

ใช้การอ้างอิง `<provider/model>` แบบเต็มกับ `--local` เพื่อทดสอบเบื้องต้นผู้ให้บริการหนึ่งรายโดยไม่เริ่ม Gateway หรือโหลดอินเทอร์เฟซเครื่องมือของเอเจนต์:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

หมายเหตุ:

- `model run` ภายในเครื่องคือการทดสอบเบื้องต้นผ่าน CLI ที่มีขอบเขตแคบที่สุดสำหรับตรวจสอบความพร้อมของผู้ให้บริการ/โมเดล/ข้อมูลยืนยันตัวตน โดยสำหรับผู้ให้บริการที่ไม่ใช่ ChatGPT-Codex ระบบจะส่งเฉพาะพรอมต์ที่ระบุเท่านั้น
- `model run --model <provider/model>` ภายในเครื่องสามารถระบุแถวในแค็ตตาล็อกแบบคงที่ที่รวมมาให้ได้อย่างแม่นยำ (แถวเดียวกับที่ `openclaw models list --all` แสดง) ก่อนเขียนผู้ให้บริการนั้นลงในการกำหนดค่า ยังคงต้องมีข้อมูลยืนยันตัวตนของผู้ให้บริการ หากไม่มีข้อมูลประจำตัว ระบบจะล้มเหลวด้วยข้อผิดพลาดการยืนยันตัวตน ไม่ใช่ `Unknown model`
- สำหรับการตรวจสอบการให้เหตุผลของ Mistral Medium 3.5 ให้เว้นค่าอุณหภูมิไว้โดยไม่กำหนดหรือใช้ค่าเริ่มต้น Mistral ปฏิเสธ `reasoning_effort="high"` เมื่อใช้ `temperature: 0` ให้ใช้อุณหภูมิเริ่มต้นหรือค่าที่ไม่ใช่ศูนย์ เช่น `0.7`
- การตรวจสอบภายในเครื่องด้วย OpenAI ChatGPT/Codex OAuth (API `openai-chatgpt-responses`) จะเพิ่มคำสั่งระบบขั้นต่ำเพื่อให้การรับส่งข้อมูลเติมฟิลด์ `instructions` ที่จำเป็นได้ โดยไม่มีบริบทเอเจนต์แบบเต็ม เครื่องมือ หน่วยความจำ หรือบทสนทนาของเซสชัน
- `model run --file` แนบเนื้อหาภาพไปยังข้อความผู้ใช้รายการเดียวโดยตรง รูปแบบทั่วไป (PNG, JPEG, WebP) ใช้งานได้เมื่อตรวจพบชนิด MIME เป็น `image/*` ส่วนไฟล์ที่ไม่รองรับหรือระบุชนิดไม่ได้จะล้มเหลวก่อนเรียกผู้ให้บริการ ใช้ `infer image describe` แทนเมื่อต้องการการกำหนดเส้นทางและกลไกสำรองของโมเดลภาพจาก OpenClaw แทนการตรวจสอบโมเดลหลายรูปแบบโดยตรง
- โมเดลที่เลือกต้องรองรับอินพุตภาพ โมเดลที่รองรับเฉพาะข้อความอาจปฏิเสธคำขอที่ชั้นผู้ให้บริการ
- `model run --prompt` ต้องมีข้อความที่ไม่ใช่เพียงอักขระช่องว่าง ระบบจะปฏิเสธพรอมต์ว่างก่อนเรียกผู้ให้บริการหรือ Gateway
- `model run` ภายในเครื่องจะจบการทำงานด้วยรหัสที่ไม่ใช่ศูนย์เมื่อผู้ให้บริการไม่ส่งเอาต์พุตข้อความ เพื่อไม่ให้ผู้ให้บริการที่เข้าถึงไม่ได้และผลลัพธ์ว่างดูเหมือนการตรวจสอบที่สำเร็จ
- ใช้ `model run --gateway` เพื่อทดสอบการกำหนดเส้นทางของ Gateway หรือการตั้งค่ารันไทม์เอเจนต์ โดยยังคงอินพุตโมเดลแบบดิบ ใช้ `openclaw agent` หรืออินเทอร์เฟซแชตเมื่อต้องการบริบทเอเจนต์ เครื่องมือ หน่วยความจำ และบทสนทนาของเซสชันแบบเต็ม
- `--thinking adaptive` จับคู่กับระดับ `medium` ของรันไทม์การสร้างผลลัพธ์ ส่วน `--thinking max` จับคู่กับ `max` สำหรับโมเดล OpenAI ที่รองรับระดับความพยายามสูงสุดโดยตรง มิฉะนั้นจะใช้ `xhigh`
- `model auth login`, `model auth logout` และ `model auth status` ใช้จัดการสถานะข้อมูลยืนยันตัวตนของผู้ให้บริการที่บันทึกไว้

## ภาพ

การสร้าง การแก้ไข และการอธิบาย

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

- ใช้ `image edit` เมื่อเริ่มต้นจากไฟล์อินพุตที่มีอยู่ โดย `--size`, `--aspect-ratio` หรือ `--resolution` จะเพิ่มคำใบ้ด้านเรขาคณิตสำหรับผู้ให้บริการ/โมเดลที่รองรับ
- `--output-format png --background transparent` ร่วมกับ `--model openai/gpt-image-1.5` จะสร้างเอาต์พุต PNG พื้นหลังโปร่งใสจาก OpenAI โดย `--openai-background` เป็นนามแฝงเฉพาะ OpenAI สำหรับคำใบ้เดียวกัน ผู้ให้บริการที่ไม่ได้ประกาศว่ารองรับพื้นหลังจะรายงานว่าเป็นการกำหนดค่าทับที่ถูกละเว้น (ดู `ignoredOverrides` ใน[ซองข้อมูล JSON](#json-output))
- `--quality low|medium|high|auto` ใช้ได้กับผู้ให้บริการที่รองรับคำใบ้ด้านคุณภาพรูปภาพ รวมถึง OpenAI นอกจากนี้ OpenAI ยังยอมรับ `--openai-moderation low|auto`
- `image providers --json` แสดงรายการผู้ให้บริการรูปภาพแบบรวมมาให้ที่ระบบค้นพบได้ กำหนดค่าแล้ว เลือกใช้อยู่ และความสามารถด้านการสร้าง/แก้ไขที่แต่ละรายเปิดให้ใช้
- `image generate --model <provider/model> --json` เป็นการทดสอบควันแบบสดที่เจาะจงที่สุดสำหรับการเปลี่ยนแปลงด้านการสร้างรูปภาพ:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  การตอบกลับจะรายงาน `ok`, `provider`, `model`, `attempts` และพาธของเอาต์พุตที่เขียนแล้ว เมื่อกำหนด `--output` นามสกุลสุดท้ายอาจเปลี่ยนตามชนิด MIME ที่ผู้ให้บริการส่งกลับ

- สำหรับ `image describe` และ `image describe-many` ให้ใช้ `--prompt` เพื่อระบุคำสั่งเฉพาะงาน (OCR, การเปรียบเทียบ, การตรวจสอบ UI, การสร้างคำบรรยายแบบกระชับ)
- ใช้ `--timeout-ms` สำหรับโมเดลการมองเห็นภายในเครื่องที่ทำงานช้า หรือการเริ่มต้น Ollama แบบเย็น
- สำหรับ `image describe` ระบบจะเรียกใช้ `--model` ที่ระบุอย่างชัดเจน (ต้องเป็น `<provider/model>` ที่รองรับรูปภาพ) ก่อน จากนั้นจะลองใช้ `agents.defaults.imageModel.fallbacks` ที่กำหนดค่าไว้หากการเรียกนั้นล้มเหลว ข้อผิดพลาดในการเตรียมอินพุต (ไฟล์หาย, URL ที่ไม่รองรับ) จะทำให้ล้มเหลวก่อนลองใช้ตัวสำรองใด ๆ และโมเดลต้องรองรับรูปภาพในแคตตาล็อกโมเดลหรือการกำหนดค่าผู้ให้บริการ
- สำหรับโมเดลการมองเห็น Ollama ภายในเครื่อง ให้ดึงโมเดลมาก่อนและตั้งค่า `OLLAMA_API_KEY` เป็นค่าตัวยึดตำแหน่งใด ๆ เช่น `ollama-local` ดู [Ollama](/th/providers/ollama#vision-and-image-description)

## เสียง

การถอดเสียงไฟล์ (ไม่ใช่การจัดการเซสชันแบบเรียลไทม์)

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` ต้องเป็น `<provider/model>`

## TTS

การสังเคราะห์เสียงพูดและสถานะผู้ให้บริการ/บุคลิกเสียงของ TTS

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

หมายเหตุ:

- `tts status` รองรับเฉพาะ `--gateway` (คำสั่งนี้สะท้อนสถานะ TTS ที่ Gateway จัดการ)
- ใช้ `tts providers`, `tts voices`, `tts personas`, `tts set-provider` และ `tts set-persona` เพื่อตรวจสอบและกำหนดค่าพฤติกรรม TTS

## วิดีโอ

การสร้างและการอธิบาย

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

หมายเหตุ:

- `video generate` ยอมรับ `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` และ `--timeout-ms` ซึ่งจะถูกส่งต่อไปยังรันไทม์การสร้างวิดีโอ
- `--model` ต้องเป็น `<provider/model>` สำหรับ `video describe`

## เว็บ

การค้นหาและการดึงข้อมูล

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` แสดงรายการผู้ให้บริการที่พร้อมใช้งาน กำหนดค่าแล้ว และเลือกใช้อยู่สำหรับการค้นหาและการดึงข้อมูล

## การฝังเวกเตอร์

การสร้างเวกเตอร์และการตรวจสอบผู้ให้บริการการฝังเวกเตอร์

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## เอาต์พุต JSON

คำสั่ง Infer ปรับเอาต์พุต JSON ให้อยู่ภายใต้ซองข้อมูลร่วม:

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
- `inputs` (ไฟล์แนบรูปภาพที่ส่งพร้อมคำขอ เมื่อเกี่ยวข้อง)
- `outputs`
- `ignoredOverrides` (คีย์คำใบ้ที่ผู้ให้บริการไม่รองรับ เมื่อเกี่ยวข้อง)
- `error`

สำหรับคำสั่งสร้างสื่อ `outputs` จะมีไฟล์ที่ OpenClaw เขียนไว้ สำหรับระบบอัตโนมัติ ให้ใช้ `path`, `mimeType`, `size` และมิติเฉพาะสื่อใด ๆ ในอาร์เรย์นั้น แทนการแยกวิเคราะห์ stdout ที่มนุษย์อ่านได้

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

## เนื้อหาที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [โมเดล](/th/concepts/models)
