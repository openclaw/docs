---
read_when:
    - การปรับการแยกวิเคราะห์หรือค่าเริ่มต้นของคำสั่งกำกับ thinking, fast-mode หรือ verbose
summary: ไวยากรณ์คำสั่งกำกับสำหรับ /think, /fast, /verbose, /trace และการมองเห็นการให้เหตุผล
title: ระดับการคิด
x-i18n:
    generated_at: "2026-05-10T20:01:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: c75e2360a260aaf4571f2da6c7519fb4987e4c8c7947e3dc37f94a0ad260ad55
    source_path: tools/thinking.md
    workflow: 16
---

## สิ่งที่ทำ

- คำสั่งแบบอินไลน์ในเนื้อหาขาเข้าใดก็ได้: `/t <level>`, `/think:<level>`, หรือ `/thinking <level>`
- ระดับ (นามแฝง): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (งบประมาณสูงสุด)
  - xhigh → "ultrathink+" (โมเดล GPT-5.2+ และ Codex รวมถึง effort ของ Anthropic Claude Opus 4.7)
  - adaptive → การคิดแบบปรับตัวได้ที่จัดการโดยผู้ให้บริการ (รองรับสำหรับ Claude 4.6 บน Anthropic/Bedrock, Anthropic Claude Opus 4.7 และการคิดแบบไดนามิกของ Google Gemini)
  - max → การให้เหตุผลสูงสุดของผู้ให้บริการ (Anthropic Claude Opus 4.7; Ollama จับคู่ค่านี้กับ effort `think` ดั้งเดิมระดับสูงสุดของตัวเอง)
  - `x-high`, `x_high`, `extra-high`, `extra high` และ `extra_high` จับคู่กับ `xhigh`
  - `highest` จับคู่กับ `high`
- หมายเหตุผู้ให้บริการ:
  - เมนูและตัวเลือกการคิดขับเคลื่อนด้วยโปรไฟล์ผู้ให้บริการ Plugin ผู้ให้บริการประกาศชุดระดับที่แน่นอนสำหรับโมเดลที่เลือก รวมถึงป้ายกำกับอย่างไบนารี `on`
  - `adaptive`, `xhigh` และ `max` จะแสดงเฉพาะสำหรับโปรไฟล์ผู้ให้บริการ/โมเดลที่รองรับเท่านั้น คำสั่งแบบพิมพ์สำหรับระดับที่ไม่รองรับจะถูกปฏิเสธพร้อมตัวเลือกที่ใช้ได้ของโมเดลนั้น
  - ระดับที่เก็บไว้เดิมซึ่งไม่รองรับจะถูกจับคู่ใหม่ตามอันดับโปรไฟล์ผู้ให้บริการ `adaptive` จะย้อนกลับเป็น `medium` บนโมเดลที่ไม่รองรับ adaptive ส่วน `xhigh` และ `max` จะย้อนกลับเป็นระดับ non-off ที่ใหญ่ที่สุดที่โมเดลที่เลือกรองรับ
  - โมเดล Anthropic Claude 4.6 ใช้ค่าเริ่มต้นเป็น `adaptive` เมื่อไม่ได้ตั้งค่าระดับการคิดไว้อย่างชัดเจน
  - Anthropic Claude Opus 4.7 ไม่ได้ใช้ค่าเริ่มต้นเป็นการคิดแบบ adaptive ค่าเริ่มต้น effort ของ API ยังคงเป็นของผู้ให้บริการ เว้นแต่คุณจะตั้งค่าระดับการคิดไว้อย่างชัดเจน
  - Anthropic Claude Opus 4.7 จับคู่ `/think xhigh` กับการคิดแบบ adaptive พร้อม `output_config.effort: "xhigh"` เพราะ `/think` เป็นคำสั่งการคิด และ `xhigh` เป็นการตั้งค่า effort ของ Opus 4.7
  - Anthropic Claude Opus 4.7 ยังเปิดให้ใช้ `/think max`; ซึ่งจับคู่กับเส้นทาง max effort เดียวกันที่ผู้ให้บริการเป็นเจ้าของ
  - โมเดล Direct DeepSeek V4 เปิดให้ใช้ `/think xhigh|max`; ทั้งคู่จับคู่กับ DeepSeek `reasoning_effort: "max"` ขณะที่ระดับ non-off ที่ต่ำกว่าจะจับคู่กับ `high`
  - โมเดล DeepSeek V4 ที่ส่งผ่าน OpenRouter เปิดให้ใช้ `/think xhigh` และส่งค่า `reasoning_effort` ที่ OpenRouter รองรับ ค่า override `max` ที่เก็บไว้จะย้อนกลับเป็น `xhigh`
  - โมเดล Ollama ที่รองรับการคิดเปิดให้ใช้ `/think low|medium|high|max`; `max` จับคู่กับ `think: "high"` ดั้งเดิม เพราะ API ดั้งเดิมของ Ollama รับสตริง effort `low`, `medium` และ `high`
  - โมเดล OpenAI GPT จับคู่ `/think` ผ่านการรองรับ effort ของ Responses API เฉพาะโมเดล `/think off` ส่ง `reasoning.effort: "none"` เฉพาะเมื่อโมเดลเป้าหมายรองรับเท่านั้น มิฉะนั้น OpenClaw จะละเว้น payload การให้เหตุผลที่ปิดใช้งานแทนการส่งค่าที่ไม่รองรับ
  - รายการแค็ตตาล็อกแบบเข้ากันได้กับ OpenAI ที่กำหนดเองสามารถเลือกใช้ `/think xhigh` ได้โดยตั้งค่า `models.providers.<provider>.models[].compat.supportedReasoningEfforts` ให้รวม `"xhigh"` ข้อมูลนี้ใช้ metadata compat เดียวกันที่จับคู่ payload effort การให้เหตุผลของ OpenAI ขาออก ดังนั้นเมนู การตรวจสอบเซสชัน CLI ของเอเจนต์ และ `llm-task` จึงสอดคล้องกับพฤติกรรมการส่งข้อมูล
  - ref ของ OpenRouter Hunter Alpha ที่ตั้งค่าไว้แต่เก่าจะข้ามการฉีด reasoning ของ proxy เพราะ route ที่เลิกใช้นั้นอาจส่งคืนข้อความคำตอบสุดท้ายผ่านฟิลด์ reasoning
  - Google Gemini จับคู่ `/think adaptive` กับการคิดแบบไดนามิกที่ผู้ให้บริการเป็นเจ้าของของ Gemini คำขอ Gemini 3 จะละเว้น `thinkingLevel` แบบคงที่ ส่วนคำขอ Gemini 2.5 จะส่ง `thinkingBudget: -1`; ระดับแบบคงที่ยังคงจับคู่กับ `thinkingLevel` หรือ budget ของ Gemini ที่ใกล้เคียงที่สุดสำหรับตระกูลโมเดลนั้น
  - MiniMax (`minimax/*`) บนเส้นทางสตรีมมิงที่เข้ากันได้กับ Anthropic ใช้ค่าเริ่มต้นเป็น `thinking: { type: "disabled" }` เว้นแต่คุณจะตั้งค่าการคิดไว้อย่างชัดเจนในพารามิเตอร์โมเดลหรือพารามิเตอร์คำขอ วิธีนี้หลีกเลี่ยง delta `reasoning_content` ที่รั่วจากรูปแบบสตรีม Anthropic แบบไม่ดั้งเดิมของ MiniMax
  - Z.AI (`zai/*`) รองรับเฉพาะการคิดแบบไบนารี (`on`/`off`) ระดับใดก็ตามที่ไม่ใช่ `off` จะถือเป็น `on` (จับคู่กับ `low`)
  - Moonshot (`moonshot/*`) จับคู่ `/think off` กับ `thinking: { type: "disabled" }` และระดับใดก็ตามที่ไม่ใช่ `off` กับ `thinking: { type: "enabled" }` เมื่อเปิดใช้การคิด Moonshot รับเฉพาะ `tool_choice` `auto|none`; OpenClaw ปรับค่าที่เข้ากันไม่ได้ให้เป็น `auto`

## ลำดับการแก้ค่า

1. คำสั่งแบบอินไลน์ในข้อความ (มีผลเฉพาะกับข้อความนั้น)
2. ค่า override ของเซสชัน (ตั้งค่าโดยส่งข้อความที่มีเฉพาะคำสั่ง)
3. ค่าเริ่มต้นรายเอเจนต์ (`agents.list[].thinkingDefault` ใน config)
4. ค่าเริ่มต้นส่วนกลาง (`agents.defaults.thinkingDefault` ใน config)
5. ค่า fallback: ค่าเริ่มต้นที่ผู้ให้บริการประกาศเมื่อมีให้ใช้; มิฉะนั้นโมเดลที่รองรับการให้เหตุผลจะแก้ค่าเป็น `medium` หรือระดับ non-`off` ที่รองรับที่ใกล้ที่สุดสำหรับโมเดลนั้น และโมเดลที่ไม่รองรับการให้เหตุผลจะยังคงเป็น `off`

## การตั้งค่าเริ่มต้นของเซสชัน

- ส่งข้อความที่เป็นคำสั่ง **เท่านั้น** (อนุญาตให้มีช่องว่างได้) เช่น `/think:medium` หรือ `/t high`
- ค่านี้จะคงอยู่สำหรับเซสชันปัจจุบัน (ค่าเริ่มต้นเป็นรายผู้ส่ง) ใช้ `/think default` เพื่อล้างค่า override ของเซสชันและสืบทอดค่าเริ่มต้นจาก config/ผู้ให้บริการ; นามแฝงรวมถึง `inherit`, `clear`, `reset` และ `unpin`
- `/think off` เก็บค่า override off อย่างชัดเจน ซึ่งจะปิดใช้งานการคิดจนกว่าคุณจะเปลี่ยนหรือล้างค่า override ของเซสชัน
- ระบบจะส่งการตอบกลับยืนยัน (`Thinking level set to high.` / `Thinking disabled.`) หากระดับไม่ถูกต้อง (เช่น `/thinking big`) คำสั่งจะถูกปฏิเสธพร้อมคำแนะนำ และสถานะเซสชันจะไม่เปลี่ยนแปลง
- ส่ง `/think` (หรือ `/think:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับการคิดปัจจุบัน

## การนำไปใช้ตามเอเจนต์

- **Pi แบบฝังตัว**: ระดับที่แก้ค่าแล้วจะถูกส่งไปยัง runtime ของเอเจนต์ Pi ในโปรเซส
- **แบ็กเอนด์ Claude CLI**: ระดับที่ไม่ใช่ off จะถูกส่งไปยัง Claude Code เป็น `--effort` เมื่อใช้ `claude-cli`; ดู [แบ็กเอนด์ CLI](/th/gateway/cli-backends)

## โหมดเร็ว (/fast)

- ระดับ: `on|off|default`
- ข้อความที่มีเฉพาะคำสั่งจะสลับค่า override โหมดเร็วของเซสชันและตอบกลับ `Fast mode enabled.` / `Fast mode disabled.` ใช้ `/fast default` เพื่อล้างค่า override ของเซสชันและสืบทอดค่าเริ่มต้นที่ตั้งค่าไว้; นามแฝงรวมถึง `inherit`, `clear`, `reset` และ `unpin`
- ส่ง `/fast` (หรือ `/fast status`) โดยไม่มีโหมดเพื่อดูสถานะโหมดเร็วที่มีผลในปัจจุบัน
- OpenClaw แก้ค่าโหมดเร็วตามลำดับนี้:
  1. ค่า override `/fast on|off` แบบอินไลน์/เฉพาะคำสั่ง (`/fast default` ล้างชั้นนี้)
  2. ค่า override ของเซสชัน
  3. ค่าเริ่มต้นรายเอเจนต์ (`agents.list[].fastModeDefault`)
  4. config รายโมเดล: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. ค่า fallback: `off`
- สำหรับ `openai/*` โหมดเร็วจะจับคู่กับการประมวลผลลำดับความสำคัญของ OpenAI โดยส่ง `service_tier=priority` ในคำขอ Responses ที่รองรับ
- สำหรับ `openai-codex/*` โหมดเร็วส่งแฟล็ก `service_tier=priority` เดียวกันใน Codex Responses OpenClaw ใช้สวิตช์ `/fast` ร่วมกันหนึ่งตัวในทั้งสองเส้นทางการตรวจสอบสิทธิ์
- สำหรับคำขอ `anthropic/*` สาธารณะโดยตรง รวมถึงทราฟฟิกที่ตรวจสอบสิทธิ์ด้วย OAuth และส่งไปยัง `api.anthropic.com` โหมดเร็วจะจับคู่กับ service tier ของ Anthropic: `/fast on` ตั้งค่า `service_tier=auto`, `/fast off` ตั้งค่า `service_tier=standard_only`
- สำหรับ `minimax/*` บนเส้นทางที่เข้ากันได้กับ Anthropic, `/fast on` (หรือ `params.fastMode: true`) เขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`
- พารามิเตอร์โมเดล Anthropic `serviceTier` / `service_tier` ที่ชัดเจนจะ override ค่าเริ่มต้นของโหมดเร็วเมื่อทั้งสองถูกตั้งค่า OpenClaw ยังคงข้ามการฉีด service-tier ของ Anthropic สำหรับ URL ฐาน proxy ที่ไม่ใช่ Anthropic
- `/status` แสดง `Fast` เฉพาะเมื่อเปิดใช้โหมดเร็ว

## คำสั่ง verbose (/verbose หรือ /v)

- ระดับ: `on` (น้อยที่สุด) | `full` | `off` (ค่าเริ่มต้น)
- ข้อความที่มีเฉพาะคำสั่งจะสลับ verbose ของเซสชันและตอบกลับ `Verbose logging enabled.` / `Verbose logging disabled.`; ระดับที่ไม่ถูกต้องจะส่งคำแนะนำกลับโดยไม่เปลี่ยนสถานะ
- `/verbose off` เก็บค่า override ของเซสชันอย่างชัดเจน; ล้างผ่าน UI เซสชันโดยเลือก `inherit`
- คำสั่งแบบอินไลน์มีผลเฉพาะกับข้อความนั้น; นอกนั้นจะใช้ค่าเริ่มต้นของเซสชัน/ส่วนกลาง
- ส่ง `/verbose` (หรือ `/verbose:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับ verbose ปัจจุบัน
- เมื่อเปิด verbose เอเจนต์ที่ปล่อยผลลัพธ์เครื่องมือแบบมีโครงสร้าง (Pi, เอเจนต์ JSON อื่นๆ) จะส่งแต่ละ tool call กลับมาเป็นข้อความ metadata-only ของตัวเอง โดยขึ้นต้นด้วย `<emoji> <tool-name>: <arg>` เมื่อมีให้ใช้ สรุปเครื่องมือเหล่านี้จะถูกส่งทันทีที่แต่ละเครื่องมือเริ่มทำงาน (บับเบิลแยกกัน) ไม่ใช่ delta แบบสตรีมมิง
- สรุปความล้มเหลวของเครื่องมือยังคงมองเห็นได้ในโหมดปกติ แต่ suffix รายละเอียดข้อผิดพลาดดิบจะถูกซ่อนไว้ เว้นแต่ verbose เป็น `on` หรือ `full`
- เมื่อ verbose เป็น `full` เอาต์พุตเครื่องมือจะถูกส่งต่อหลังเสร็จสิ้นด้วย (บับเบิลแยกกัน ตัดให้เหลือความยาวที่ปลอดภัย) หากคุณสลับ `/verbose on|full|off` ขณะที่การรันกำลังดำเนินอยู่ บับเบิลเครื่องมือถัดไปจะใช้การตั้งค่าใหม่
- `agents.defaults.toolProgressDetail` ควบคุมรูปแบบของสรุปเครื่องมือ `/verbose` และบรรทัดเครื่องมือ draft ความคืบหน้า ใช้ `"explain"` (ค่าเริ่มต้น) สำหรับป้ายกำกับแบบกระชับที่มนุษย์อ่านได้ เช่น `🛠️ Exec: checking JS syntax`; ใช้ `"raw"` เมื่อคุณต้องการต่อท้ายคำสั่ง/รายละเอียดดิบสำหรับการดีบักด้วย `agents.list[].toolProgressDetail` รายเอเจนต์จะ override ค่าเริ่มต้น
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## คำสั่ง trace ของ Plugin (/trace)

- ระดับ: `on` | `off` (ค่าเริ่มต้น)
- ข้อความที่มีเฉพาะคำสั่งจะสลับเอาต์พุต trace ของ Plugin ในเซสชันและตอบกลับ `Plugin trace enabled.` / `Plugin trace disabled.`
- คำสั่งแบบอินไลน์มีผลเฉพาะกับข้อความนั้น; นอกนั้นจะใช้ค่าเริ่มต้นของเซสชัน/ส่วนกลาง
- ส่ง `/trace` (หรือ `/trace:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับ trace ปัจจุบัน
- `/trace` แคบกว่า `/verbose`: แสดงเฉพาะบรรทัด trace/debug ที่ Plugin เป็นเจ้าของ เช่น สรุปดีบักของ Active Memory
- บรรทัด trace อาจปรากฏใน `/status` และเป็นข้อความวินิจฉัยตามหลังหลังการตอบกลับปกติของผู้ช่วย

## การมองเห็นการให้เหตุผล (/reasoning)

- ระดับ: `on|off|stream`
- ข้อความที่มีเฉพาะคำสั่งจะสลับว่าจะให้แสดงบล็อกการคิดในคำตอบหรือไม่
- เมื่อเปิดใช้งาน การให้เหตุผลจะถูกส่งเป็น **ข้อความแยกต่างหาก** โดยขึ้นต้นด้วย `Reasoning:`
- `stream` (เฉพาะ Telegram): สตรีมการให้เหตุผลลงในบับเบิล draft ของ Telegram ขณะที่กำลังสร้างคำตอบ จากนั้นส่งคำตอบสุดท้ายโดยไม่มีการให้เหตุผล
- นามแฝง: `/reason`
- ส่ง `/reasoning` (หรือ `/reasoning:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับการให้เหตุผลปัจจุบัน
- ลำดับการแก้ค่า: คำสั่งแบบอินไลน์ จากนั้นค่า override ของเซสชัน จากนั้นค่าเริ่มต้นรายเอเจนต์ (`agents.list[].reasoningDefault`) จากนั้นค่าเริ่มต้นส่วนกลาง (`agents.defaults.reasoningDefault`) จากนั้นค่า fallback (`off`)

แท็กการให้เหตุผลของโมเดลภายในที่มีรูปแบบผิดปกติจะถูกจัดการอย่างระมัดระวัง บล็อก `<think>...</think>` ที่ปิดแล้วจะยังคงถูกซ่อนในคำตอบปกติ และการให้เหตุผลที่ไม่ได้ปิดหลังข้อความที่มองเห็นแล้วก็จะถูกซ่อนเช่นกัน หากคำตอบถูกครอบทั้งหมดด้วยแท็กเปิดที่ไม่ได้ปิดเพียงแท็กเดียวและมิฉะนั้นจะส่งออกเป็นข้อความว่าง OpenClaw จะลบแท็กเปิดที่มีรูปแบบผิดปกติและส่งข้อความที่เหลือ

## ที่เกี่ยวข้อง

- เอกสารโหมดยกระดับอยู่ใน [โหมดยกระดับ](/th/tools/elevated)

## Heartbeats

- เนื้อหา probe ของ Heartbeat คือพรอมป์ heartbeat ที่ตั้งค่าไว้ (ค่าเริ่มต้น: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`) คำสั่งแบบอินไลน์ในข้อความ heartbeat จะมีผลตามปกติ (แต่หลีกเลี่ยงการเปลี่ยนค่าเริ่มต้นของเซสชันจาก heartbeats)
- การส่ง Heartbeat มีค่าเริ่มต้นเป็น payload สุดท้ายเท่านั้น หากต้องการส่งข้อความ `Reasoning:` แยกต่างหากด้วย (เมื่อมีให้ใช้) ให้ตั้งค่า `agents.defaults.heartbeat.includeReasoning: true` หรือรายเอเจนต์ `agents.list[].heartbeat.includeReasoning: true`

## UI เว็บแชต

- ตัวเลือกการคิดของเว็บแชตจะสะท้อนระดับที่จัดเก็บไว้ของเซสชันจากที่จัดเก็บ/การกำหนดค่าเซสชันขาเข้าเมื่อหน้าโหลด
- การเลือกระดับอื่นจะเขียนการแทนที่ของเซสชันทันทีผ่าน `sessions.patch`; โดยไม่รอการส่งครั้งถัดไป และไม่ใช่การแทนที่แบบครั้งเดียวของ `thinkingOnce`
- ตัวเลือกแรกเป็นตัวเลือกสำหรับล้างการแทนที่เสมอ โดยจะแสดง `Inherited: <resolved level>` เมื่อเซสชันสืบทอดค่าเริ่มต้นที่มีผลซึ่งไม่ใช่ปิดอยู่ หรือ `Off` เมื่อการคิดที่สืบทอดมาถูกปิดใช้งาน
- ตัวเลือกในตัวเลือกที่ระบุอย่างชัดเจนจะถูกระบุว่าเป็นการแทนที่ ขณะเดียวกันยังคงรักษาป้ายกำกับของผู้ให้บริการเมื่อมีอยู่ (ตัวอย่างเช่น `Override: maximum` สำหรับตัวเลือก `max` ที่ผู้ให้บริการติดป้ายกำกับไว้)
- ตัวเลือกใช้ `thinkingLevels` ที่ส่งคืนโดยแถวเซสชัน/ค่าเริ่มต้นของ Gateway โดยยังคง `thinkingOptions` ไว้เป็นรายการป้ายกำกับแบบเดิม UI ของเบราว์เซอร์ไม่ได้เก็บรายการ regex ของผู้ให้บริการเอง; Plugins เป็นเจ้าของชุดระดับเฉพาะของโมเดล
- `/think:<level>` ยังคงใช้งานได้และอัปเดตระดับเซสชันที่จัดเก็บเดียวกัน ดังนั้นคำสั่งกำกับในแชตและตัวเลือกจึงซิงค์กันอยู่เสมอ

## โปรไฟล์ผู้ให้บริการ

- Provider Plugins สามารถเปิดเผย `resolveThinkingProfile(ctx)` เพื่อกำหนดระดับที่โมเดลรองรับและค่าเริ่มต้น
- Provider Plugins ที่พร็อกซีโมเดล Claude ควรใช้ `resolveClaudeThinkingProfile(modelId)` จาก `openclaw/plugin-sdk/provider-model-shared` ซ้ำ เพื่อให้แค็ตตาล็อกของ Anthropic โดยตรงและพร็อกซีสอดคล้องกัน
- แต่ละระดับของโปรไฟล์มี `id` ตามรูปแบบมาตรฐานที่จัดเก็บไว้ (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` หรือ `max`) และอาจมี `label` สำหรับแสดงผล ผู้ให้บริการแบบไบนารีใช้ `{ id: "low", label: "on" }`
- Tool Plugins ที่ต้องตรวจสอบการแทนที่การคิดอย่างชัดเจนควรใช้ `api.runtime.agent.resolveThinkingPolicy({ provider, model })` ร่วมกับ `api.runtime.agent.normalizeThinkingLevel(...)`; ไม่ควรเก็บรายการระดับของผู้ให้บริการ/โมเดลเอง
- Tool Plugins ที่เข้าถึงเมทาดาทาของโมเดลกำหนดเองที่กำหนดค่าไว้ได้ สามารถส่ง `catalog` เข้าไปใน `resolveThinkingPolicy` เพื่อให้การเลือกใช้ `compat.supportedReasoningEfforts` สะท้อนในการตรวจสอบฝั่ง Plugin
- ฮุกแบบเดิมที่เผยแพร่แล้ว (`supportsXHighThinking`, `isBinaryThinking` และ `resolveDefaultThinkingLevel`) ยังคงอยู่ในฐานะตัวปรับความเข้ากันได้ แต่ชุดระดับกำหนดเองชุดใหม่ควรใช้ `resolveThinkingProfile`
- แถว/ค่าเริ่มต้นของ Gateway เปิดเผย `thinkingLevels`, `thinkingOptions` และ `thinkingDefault` เพื่อให้ไคลเอนต์ ACP/แชตแสดง id และป้ายกำกับของโปรไฟล์เดียวกับที่การตรวจสอบขณะรันไทม์ใช้
