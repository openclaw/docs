---
read_when:
    - การเพิ่มหรือแก้ไขคำสั่ง `openclaw infer`
    - การออกแบบระบบอัตโนมัติของความสามารถแบบไร้ส่วนติดต่อที่เสถียร
summary: CLI ที่เน้นการอนุมานเป็นอันดับแรกสำหรับเวิร์กโฟลว์โมเดล รูปภาพ เสียง TTS วิดีโอ เว็บ และการฝังข้อมูลที่รองรับโดยผู้ให้บริการ
title: CLI สำหรับการอนุมาน
x-i18n:
    generated_at: "2026-07-19T07:06:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3147bb516a08e12c4eacd6bd527af62049ecae25b5fde9439da6a4431c147b07
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` เป็นอินเทอร์เฟซแบบไม่มีส่วนติดต่อผู้ใช้หลักสำหรับการอนุมานที่ทำงานผ่านผู้ให้บริการ โดยเปิดเผยกลุ่มความสามารถ (`model`, `image`, `audio`, `tts`, `video`, `web`, `embedding`) ไม่ใช่ชื่อ RPC ดิบของ Gateway หรือรหัสเครื่องมือของเอเจนต์ `openclaw capability ...` เป็นนามแฝงสำหรับโครงสร้างคำสั่งเดียวกัน

เหตุผลที่ควรเลือกใช้แทนตัวหุ้มผู้ให้บริการที่สร้างขึ้นเฉพาะกิจ:

- นำผู้ให้บริการและโมเดลที่กำหนดค่าไว้แล้วใน OpenClaw มาใช้ซ้ำ
- รูปแบบครอบ `--json` ที่เสถียรสำหรับสคริปต์และระบบอัตโนมัติที่ขับเคลื่อนโดยเอเจนต์ (ดู [เอาต์พุต JSON](#json-output))
- เรียกใช้เส้นทางภายในเครื่องตามปกติโดยไม่ผ่าน Gateway สำหรับคำสั่งย่อยส่วนใหญ่
- สำหรับการตรวจสอบผู้ให้บริการตั้งแต่ต้นจนจบ ระบบจะทดสอบ CLI ที่เผยแพร่แล้ว การโหลดการกำหนดค่า การระบุเอเจนต์เริ่มต้น การเปิดใช้งาน Plugin ที่มาพร้อมระบบ และรันไทม์ความสามารถที่ใช้ร่วมกัน ก่อนส่งคำขอไปยังผู้ให้บริการ

## เปลี่ยน infer ให้เป็น Skills

คัดลอกและวางข้อความนี้ให้เอเจนต์:

```text
อ่าน https://docs.openclaw.ai/cli/infer จากนั้นสร้าง Skills ที่กำหนดเส้นทางเวิร์กโฟลว์ทั่วไปของฉันไปยัง `openclaw infer`
เน้นการเรียกใช้โมเดล การสร้างภาพ การสร้างวิดีโอ การถอดเสียง การแปลงข้อความเป็นเสียงพูด การค้นหาเว็บ และเวกเตอร์ฝัง
```

Skills ที่อิงกับ infer ซึ่งออกแบบมาอย่างดีจะจับคู่เจตนาทั่วไปของผู้ใช้กับคำสั่งย่อยที่เหมาะสม มีตัวอย่างมาตรฐานสองสามรายการต่อเวิร์กโฟลว์ เลือกใช้ `openclaw infer ...` แทนทางเลือกระดับล่าง และไม่เขียนเอกสารพื้นผิว infer ทั้งหมดซ้ำในเนื้อหาของ Skills

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

`infer list` / `infer inspect --name <capability>` แสดงโครงสร้างนี้ในรูปแบบข้อมูล (รหัสความสามารถ การขนส่ง คำอธิบาย)

## งานทั่วไป

| งาน                           | คำสั่ง                                                                                        | หมายเหตุ                                              |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| เรียกใช้พรอมต์ข้อความ/โมเดล   | `openclaw infer model run --prompt "..." --json`                                              | ใช้ภายในเครื่องโดยค่าเริ่มต้น                         |
| เรียกใช้พรอมต์โมเดลกับภาพ     | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | ใช้ `--file` ซ้ำสำหรับหลายภาพ                      |
| สร้างภาพ                      | `openclaw infer image generate --prompt "..." --json`                                         | ใช้ `image edit` เมื่อเริ่มจากไฟล์ที่มีอยู่           |
| อธิบายไฟล์ภาพหรือ URL         | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` ต้องเป็น `<provider/model>` ที่รองรับภาพ |
| ถอดเสียง                      | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` ต้องเป็น `<provider/model>`                   |
| สังเคราะห์เสียงพูด            | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` ทำงานผ่าน Gateway เท่านั้น              |
| สร้างวิดีโอ                   | `openclaw infer video generate --prompt "..." --json`                                         | รองรับคำใบ้ผู้ให้บริการ เช่น `--resolution`            |
| อธิบายไฟล์วิดีโอ              | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` ต้องเป็น `<provider/model>`                   |
| ค้นหาเว็บ                     | `openclaw infer web search --query "..." --json`                                              |                                                       |
| ดึงข้อมูลหน้าเว็บ             | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| สร้างเวกเตอร์ฝัง              | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## ลักษณะการทำงาน

- ใช้ `--json` เมื่อจะส่งเอาต์พุตให้คำสั่งหรือสคริปต์อื่น มิฉะนั้นให้ใช้เอาต์พุตข้อความ
- ใช้ `--provider` หรือ `--model provider/model` เพื่อตรึงแบ็กเอนด์ที่ระบุ
- ใช้ `model run --thinking <level>` เพื่อแทนที่การคิด/การให้เหตุผลแบบครั้งเดียว: `off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` หรือ `max`
- สำหรับ `image describe`, `audio transcribe` และ `video describe` นั้น `--model` ต้องใช้รูปแบบ `<provider/model>`
- สำหรับ `image describe` นั้น `--file` รองรับพาธภายในเครื่องและ HTTP(S) URL ส่วน URL ระยะไกลจะอยู่ภายใต้นโยบาย SSRF สำหรับการดึงสื่อตามปกติ
- คำสั่งดำเนินการแบบไร้สถานะ (`model run`, `image *`, `audio *`, `video *`, `web *`, `embedding *`) ใช้ภายในเครื่องโดยค่าเริ่มต้น ส่วนคำสั่งสถานะที่จัดการโดย Gateway (`tts status`) ใช้ Gateway โดยค่าเริ่มต้น
- เส้นทางภายในเครื่องไม่จำเป็นต้องให้ Gateway ทำงานอยู่
- `model run` ภายในเครื่องเป็นการเติมคำตอบจากผู้ให้บริการแบบครั้งเดียวที่กระชับ โดยระบุโมเดลและข้อมูลรับรองความถูกต้องของเอเจนต์ที่กำหนดค่าไว้ แต่จะไม่เริ่มเทิร์นของแชตเอเจนต์ โหลดเครื่องมือ หรือเปิดเซิร์ฟเวอร์ MCP ที่มาพร้อมระบบ
- `model run --file` แนบไฟล์ภาพ (ตรวจหาประเภท MIME โดยอัตโนมัติ) เข้ากับพรอมต์ ใช้ `--file` ซ้ำสำหรับหลายภาพ ไฟล์ที่ไม่ใช่ภาพจะถูกปฏิเสธ — ให้ใช้ `infer audio transcribe` หรือ `infer video describe` แทน
- `model run --gateway` ทดสอบการกำหนดเส้นทางของ Gateway ข้อมูลรับรองความถูกต้องที่บันทึกไว้ การเลือกผู้ให้บริการ และรันไทม์แบบฝัง แต่ยังคงเป็นการตรวจสอบโมเดลดิบ: ไม่มีทรานสคริปต์เซสชันก่อนหน้า บริบทบูตสแตรป/AGENTS เครื่องมือ หรือเซิร์ฟเวอร์ MCP ที่มาพร้อมระบบ
- `model run --gateway --model <provider/model>` ต้องใช้ข้อมูลรับรอง Gateway ของผู้ดำเนินการที่เชื่อถือได้ เนื่องจากเป็นการขอให้ Gateway เรียกใช้การแทนที่ผู้ให้บริการ/โมเดลแบบครั้งเดียว

## โมเดล

การอนุมานข้อความและการตรวจสอบโมเดล/ผู้ให้บริการ

```bash
openclaw infer model run --prompt "ตอบกลับด้วยข้อความนี้เท่านั้น: smoke-ok" --json
openclaw infer model run --prompt "สรุปรายการบันทึกการเปลี่ยนแปลงนี้" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "อธิบายภาพนี้ในหนึ่งประโยค" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "ใช้การให้เหตุผลมากขึ้นตรงนี้" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

ใช้การอ้างอิง `<provider/model>` แบบเต็มร่วมกับ `--local` เพื่อทดสอบขั้นต้นผู้ให้บริการรายหนึ่งโดยไม่ต้องเริ่ม Gateway หรือโหลดพื้นผิวเครื่องมือของเอเจนต์:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "ตอบกลับด้วยข้อความนี้เท่านั้น: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "ตอบกลับด้วยข้อความนี้เท่านั้น: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "ตอบกลับด้วยข้อความนี้เท่านั้น: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "ตอบกลับด้วยข้อความนี้เท่านั้น: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "ตอบกลับด้วยข้อความนี้เท่านั้น: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "ตอบกลับด้วยข้อความนี้เท่านั้น: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "ตอบกลับด้วยข้อความนี้เท่านั้น: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "อธิบายภาพนี้" --file ./photo.jpg --json
```

หมายเหตุ:

- `model run` ภายในเครื่องเป็นการทดสอบขั้นต้นผ่าน CLI ที่แคบที่สุดสำหรับตรวจสอบสถานะของผู้ให้บริการ/โมเดล/การรับรองความถูกต้อง โดยสำหรับผู้ให้บริการที่ไม่ใช่ ChatGPT-Codex ระบบจะส่งเฉพาะพรอมต์ที่ระบุ
- `model run --model <provider/model>` ภายในเครื่องสามารถระบุแถวที่ตรงกันทุกประการจากแค็ตตาล็อกแบบคงที่ที่มาพร้อมระบบ (แถวเดียวกับที่ `openclaw models list --all` แสดง) ก่อนเขียนผู้ให้บริการนั้นลงในการกำหนดค่า ยังคงต้องมีการรับรองความถูกต้องของผู้ให้บริการ หากขาดข้อมูลรับรอง ระบบจะล้มเหลวด้วยข้อผิดพลาดการรับรองความถูกต้อง ไม่ใช่ `Unknown model`
- สำหรับการตรวจสอบการให้เหตุผลของ Mistral Medium 3.5 ให้ปล่อยค่าอุณหภูมิเป็นไม่กำหนด/ค่าเริ่มต้น Mistral ปฏิเสธ `reasoning_effort="high"` ด้วย `temperature: 0` ให้ใช้ค่าอุณหภูมิเริ่มต้นหรือค่าที่ไม่ใช่ศูนย์ เช่น `0.7`
- การตรวจสอบภายในเครื่องด้วย OpenAI ChatGPT/Codex OAuth (API `openai-chatgpt-responses`) จะเพิ่มคำสั่งระบบขั้นต่ำเพื่อให้การขนส่งสามารถใส่ข้อมูลในฟิลด์ `instructions` ที่จำเป็นได้ — โดยไม่มีบริบทเอเจนต์แบบเต็ม เครื่องมือ หน่วยความจำ หรือทรานสคริปต์เซสชัน
- `model run --file` แนบเนื้อหาภาพโดยตรงกับข้อความผู้ใช้รายการเดียว รูปแบบทั่วไป (PNG, JPEG, WebP) ใช้งานได้เมื่อตรวจพบประเภท MIME เป็น `image/*` ส่วนไฟล์ที่ไม่รองรับหรือไม่รู้จักจะล้มเหลวก่อนเรียกผู้ให้บริการ ให้ใช้ `infer image describe` แทนเมื่อต้องการการกำหนดเส้นทางโมเดลภาพและกลไกสำรองของ OpenClaw แทนการตรวจสอบโมเดลหลายสื่อโดยตรง
- โมเดลที่เลือกต้องรองรับอินพุตภาพ โมเดลที่รองรับเฉพาะข้อความอาจปฏิเสธคำขอที่ชั้นผู้ให้บริการ
- `model run --prompt` ต้องมีข้อความที่ไม่ใช่ช่องว่าง พรอมต์ว่างจะถูกปฏิเสธก่อนเรียกผู้ให้บริการหรือ Gateway
- `model run` ภายในเครื่องจะจบการทำงานด้วยรหัสที่ไม่ใช่ศูนย์เมื่อผู้ให้บริการไม่ส่งเอาต์พุตข้อความ เพื่อไม่ให้ผู้ให้บริการที่เข้าถึงไม่ได้และการเติมคำตอบที่ว่างเปล่าดูเหมือนเป็นการตรวจสอบที่สำเร็จ
- ใช้ `model run --gateway` เพื่อทดสอบการกำหนดเส้นทางของ Gateway หรือการตั้งค่ารันไทม์เอเจนต์ โดยคงอินพุตโมเดลเป็นข้อมูลดิบ ใช้ `openclaw agent` หรือพื้นผิวแชตสำหรับบริบทเอเจนต์แบบเต็ม เครื่องมือ หน่วยความจำ และทรานสคริปต์เซสชัน
- `--thinking adaptive` แมปกับ `medium` ระดับรันไทม์การเติมคำตอบ ส่วน `--thinking max` แมปกับ `max` สำหรับโมเดล OpenAI ที่รองรับระดับความพยายามสูงสุดแบบเนทีฟ มิฉะนั้นจะเป็น `xhigh`
- `model auth login`, `model auth logout` และ `model auth status` จัดการสถานะการรับรองความถูกต้องของผู้ให้บริการที่บันทึกไว้

## ภาพ

การสร้าง การแก้ไข และการอธิบาย

```bash
openclaw infer image generate --prompt "ภาพประกอบกุ้งล็อบสเตอร์ที่ดูเป็นมิตร" --json
openclaw infer image generate --prompt "ภาพถ่ายผลิตภัณฑ์หูฟังสไตล์ภาพยนตร์" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "สติกเกอร์วงกลมสีแดงเรียบง่ายบนพื้นหลังโปร่งใส" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "โปสเตอร์ฉบับร่างต้นทุนต่ำ" --json
openclaw infer image generate --prompt "แบ็กเอนด์ภาพที่ทำงานช้า" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "คงโลโก้ไว้และลบพื้นหลัง" --json
openclaw infer image edit --file ./poster.png --prompt "ทำให้เป็นโฆษณาสตอรีแนวตั้ง" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "แยกชื่อร้านค้า วันที่ และยอดรวม" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "เปรียบเทียบภาพหน้าจอและแสดงรายการการเปลี่ยนแปลง UI ที่มองเห็นได้" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "อธิบายภาพนี้ในหนึ่งประโยค" --timeout-ms 300000 --json
```

หมายเหตุ:

- ใช้ `image edit` เมื่อเริ่มจากไฟล์อินพุตที่มีอยู่แล้ว ส่วน `--size`, `--aspect-ratio` หรือ `--resolution` จะเพิ่มคำใบ้เกี่ยวกับรูปทรงเรขาคณิตให้กับผู้ให้บริการ/โมเดลที่รองรับ
- `--output-format png --background transparent` ร่วมกับ `--model openai/gpt-image-1.5` จะสร้างเอาต์พุต PNG ของ OpenAI ที่มีพื้นหลังโปร่งใส ส่วน `--openai-background` เป็นนามแฝงเฉพาะ OpenAI สำหรับคำใบ้เดียวกัน ผู้ให้บริการที่ไม่ได้ประกาศว่ารองรับพื้นหลังจะรายงานว่าเป็นการแทนค่าที่ถูกละเว้น (ดู `ignoredOverrides` ใน [เอนเวโลป JSON](#json-output))
- `--quality low|medium|high|auto` ใช้ได้กับผู้ให้บริการที่รองรับคำใบ้ด้านคุณภาพภาพ รวมถึง OpenAI นอกจากนี้ OpenAI ยังยอมรับ `--openai-moderation low|auto`
- `image providers --json` แสดงรายการผู้ให้บริการภาพที่รวมมาให้ซึ่งระบบค้นพบได้ กำหนดค่าแล้ว เลือกใช้อยู่ และความสามารถในการสร้าง/แก้ไขที่แต่ละรายเปิดให้ใช้
- `image generate --model <provider/model> --json` เป็นการทดสอบควันแบบสดที่มีขอบเขตแคบที่สุดสำหรับการเปลี่ยนแปลงด้านการสร้างภาพ:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image \
    --prompt "ภาพทดสอบแบบแบนเรียบง่าย: สี่เหลี่ยมสีน้ำเงินหนึ่งรูปบนพื้นหลังสีขาว ไม่มีข้อความ" \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  การตอบกลับรายงาน `ok`, `provider`, `model`, `attempts` และพาธเอาต์พุตที่เขียนไว้ เมื่อตั้งค่า `--output` นามสกุลไฟล์สุดท้ายอาจเป็นไปตามชนิด MIME ที่ผู้ให้บริการส่งกลับ

- สำหรับ `image describe` และ `image describe-many` ให้ใช้ `--prompt` สำหรับคำสั่งเฉพาะงาน (OCR, การเปรียบเทียบ, การตรวจสอบ UI, การสร้างคำบรรยายแบบกระชับ)
- ใช้ `--timeout-ms` สำหรับโมเดลการมองเห็นในเครื่องที่ทำงานช้า หรือการเริ่ม Ollama แบบเย็น
- สำหรับ `image describe` ระบบจะเรียก `--model` ที่ระบุไว้อย่างชัดเจน (ต้องเป็น `<provider/model>` ที่รองรับภาพ) ก่อน จากนั้นหากการเรียกนั้นล้มเหลว จะลองใช้ `agents.defaults.imageModel.fallbacks` ที่กำหนดค่าไว้ ข้อผิดพลาดในการเตรียมอินพุต (ไฟล์หาย, URL ที่ไม่รองรับ) จะทำให้ล้มเหลวก่อนพยายามใช้ตัวสำรอง และโมเดลต้องรองรับภาพในแค็ตตาล็อกโมเดลหรือการกำหนดค่าผู้ให้บริการ
- สำหรับโมเดลการมองเห็น Ollama ในเครื่อง ให้ดึงโมเดลมาก่อนและตั้งค่า `OLLAMA_API_KEY` เป็นค่าตัวยึดตำแหน่งใดก็ได้ เช่น `ollama-local` ดู [Ollama](/th/providers/ollama#vision-and-image-description)

## เสียง

การถอดเสียงไฟล์ (ไม่ใช่การจัดการเซสชันแบบเรียลไทม์)

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "เน้นชื่อและรายการงานที่ต้องดำเนินการ" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` ต้องเป็น `<provider/model>`

## TTS

การสังเคราะห์เสียงพูดและสถานะผู้ให้บริการ/บุคลิกเสียง TTS

```bash
openclaw infer tts convert --text "สวัสดีจาก openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "การสร้างของคุณเสร็จสมบูรณ์แล้ว" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

หมายเหตุ:

- `tts status` รองรับเฉพาะ `--gateway` (สะท้อนสถานะ TTS ที่ Gateway จัดการ)
- ใช้ `tts providers`, `tts voices`, `tts personas`, `tts set-provider` และ `tts set-persona` เพื่อตรวจสอบและกำหนดค่าพฤติกรรม TTS

## วิดีโอ

การสร้างและการอธิบาย

```bash
openclaw infer video generate --prompt "พระอาทิตย์ตกเหนือมหาสมุทรในบรรยากาศแบบภาพยนตร์" --json
openclaw infer video generate --prompt "ภาพโดรนเคลื่อนช้าเหนือทะเลสาบกลางป่า" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

หมายเหตุ:

- `video generate` ยอมรับ `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` และ `--timeout-ms` ซึ่งจะถูกส่งต่อไปยังรันไทม์การสร้างวิดีโอ
- `--model` ต้องเป็น `<provider/model>` สำหรับ `video describe`

## เว็บ

การค้นหาและการดึงข้อมูล

```bash
openclaw infer web search --query "เอกสาร OpenClaw" --json
openclaw infer web search --query "ผู้ให้บริการเว็บ infer ของ OpenClaw" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` แสดงรายการผู้ให้บริการที่พร้อมใช้งาน กำหนดค่าแล้ว และเลือกใช้อยู่สำหรับการค้นหาและการดึงข้อมูล

## การฝังเวกเตอร์

การสร้างเวกเตอร์และการตรวจสอบผู้ให้บริการการฝังเวกเตอร์

```bash
openclaw infer embedding create --text "ล็อบสเตอร์ที่เป็นมิตร" --json
openclaw infer embedding create --text "ตั๋วฝ่ายสนับสนุนลูกค้า: การจัดส่งล่าช้า" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## เอาต์พุต JSON

คำสั่ง Infer ปรับเอาต์พุต JSON ให้อยู่ภายใต้เอนเวโลปร่วม:

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

ฟิลด์ระดับบนสุดที่คงที่:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `inputs` (ไฟล์แนบภาพที่ส่งไปพร้อมกับคำขอ เมื่อใช้ได้)
- `outputs`
- `ignoredOverrides` (คีย์คำใบ้ที่ผู้ให้บริการไม่รองรับ เมื่อใช้ได้)
- `error`

สำหรับคำสั่งสื่อที่สร้างขึ้น `outputs` ประกอบด้วยไฟล์ที่ OpenClaw เขียนไว้ ให้ใช้ `path`, `mimeType`, `size` และมิติเฉพาะสื่อใดๆ ในอาร์เรย์นั้นสำหรับการทำงานอัตโนมัติ แทนการแยกวิเคราะห์ stdout ที่มนุษย์อ่านได้

## ข้อผิดพลาดที่พบบ่อย

```bash
# ไม่ถูกต้อง
openclaw infer media image generate --prompt "ล็อบสเตอร์ที่เป็นมิตร"

# ถูกต้อง
openclaw infer image generate --prompt "ล็อบสเตอร์ที่เป็นมิตร"
```

```bash
# ไม่ถูกต้อง
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# ถูกต้อง
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [โมเดล](/th/concepts/models)
