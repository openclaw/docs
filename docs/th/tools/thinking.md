---
read_when:
    - ปรับการแยกวิเคราะห์หรือค่าเริ่มต้นของไดเรกทีฟ thinking, fast-mode หรือ verbose
summary: ไวยากรณ์ของคำสั่งกำกับสำหรับ /think, /fast, /verbose, /trace และการมองเห็นการให้เหตุผล
title: ระดับการคิด
x-i18n:
    generated_at: "2026-05-06T09:35:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19fed0d7d8499d177361d125027ca5001dfe73a4ea5bc7f7475faa10541c7a83
    source_path: tools/thinking.md
    workflow: 16
---

## สิ่งที่ทำ

- คำสั่งแบบอินไลน์ในเนื้อหาขาเข้าใด ๆ: `/t <level>`, `/think:<level>` หรือ `/thinking <level>`
- ระดับ (นามแฝง): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "คิด"
  - low → "คิดให้หนัก"
  - medium → "คิดให้หนักขึ้น"
  - high → "คิดอย่างลึกมาก" (งบสูงสุด)
  - xhigh → "คิดอย่างลึกมาก+" (โมเดล GPT-5.2+ และ Codex รวมถึง effort ของ Anthropic Claude Opus 4.7)
  - adaptive → การคิดแบบปรับตัวที่ผู้ให้บริการจัดการ (รองรับสำหรับ Claude 4.6 บน Anthropic/Bedrock, Anthropic Claude Opus 4.7 และการคิดแบบไดนามิกของ Google Gemini)
  - max → การให้เหตุผลสูงสุดของผู้ให้บริการ (Anthropic Claude Opus 4.7; Ollama จับค่านี้ไปยัง effort `think` ดั้งเดิมที่สูงที่สุด)
  - `x-high`, `x_high`, `extra-high`, `extra high` และ `extra_high` จับคู่เป็น `xhigh`
  - `highest` จับคู่เป็น `high`
- หมายเหตุของผู้ให้บริการ:
  - เมนูและตัวเลือกการคิดขับเคลื่อนโดยโปรไฟล์ผู้ให้บริการ Plugin ของผู้ให้บริการประกาศชุดระดับที่แน่นอนสำหรับโมเดลที่เลือก รวมถึงป้ายกำกับอย่างไบนารี `on`
  - `adaptive`, `xhigh` และ `max` จะแสดงเฉพาะสำหรับโปรไฟล์ผู้ให้บริการ/โมเดลที่รองรับเท่านั้น คำสั่งที่พิมพ์สำหรับระดับที่ไม่รองรับจะถูกปฏิเสธพร้อมตัวเลือกที่ใช้ได้ของโมเดลนั้น
  - ระดับที่ไม่รองรับซึ่งถูกจัดเก็บไว้เดิมจะถูกจับคู่ใหม่ตามอันดับโปรไฟล์ผู้ให้บริการ `adaptive` จะถอยกลับเป็น `medium` บนโมเดลที่ไม่ปรับตัว ส่วน `xhigh` และ `max` จะถอยกลับเป็นระดับที่ไม่ใช่ off สูงสุดที่โมเดลที่เลือกรองรับ
  - โมเดล Anthropic Claude 4.6 ใช้ค่าเริ่มต้นเป็น `adaptive` เมื่อไม่ได้ตั้งค่าระดับการคิดอย่างชัดเจน
  - Anthropic Claude Opus 4.7 ไม่ได้ใช้การคิดแบบปรับตัวเป็นค่าเริ่มต้น ค่าเริ่มต้น effort ของ API ยังคงเป็นสิ่งที่ผู้ให้บริการเป็นเจ้าของ เว้นแต่คุณตั้งค่าระดับการคิดอย่างชัดเจน
  - Anthropic Claude Opus 4.7 จับคู่ `/think xhigh` ไปยังการคิดแบบปรับตัวพร้อม `output_config.effort: "xhigh"` เพราะ `/think` เป็นคำสั่งการคิด และ `xhigh` เป็นการตั้งค่า effort ของ Opus 4.7
  - Anthropic Claude Opus 4.7 ยังเปิดให้ใช้ `/think max`; โดยจับคู่ไปยังเส้นทาง effort สูงสุดที่ผู้ให้บริการเป็นเจ้าของเส้นทางเดียวกัน
  - โมเดล DeepSeek V4 โดยตรงเปิดให้ใช้ `/think xhigh|max`; ทั้งคู่จับคู่ไปยัง DeepSeek `reasoning_effort: "max"` ส่วนระดับที่ไม่ใช่ off ที่ต่ำกว่าจะจับคู่เป็น `high`
  - โมเดล DeepSeek V4 ที่ส่งผ่าน OpenRouter เปิดให้ใช้ `/think xhigh` และส่งค่า `reasoning_effort` ที่ OpenRouter รองรับ การ override `max` ที่จัดเก็บไว้จะถอยกลับเป็น `xhigh`
  - โมเดล Ollama ที่รองรับการคิดเปิดให้ใช้ `/think low|medium|high|max`; `max` จับคู่เป็น `think: "high"` ดั้งเดิม เพราะ API ดั้งเดิมของ Ollama รับสตริง effort `low`, `medium` และ `high`
  - โมเดล OpenAI GPT จับคู่ `/think` ผ่านการรองรับ effort ของ Responses API เฉพาะโมเดล `/think off` ส่ง `reasoning.effort: "none"` เฉพาะเมื่อโมเดลเป้าหมายรองรับเท่านั้น ไม่เช่นนั้น OpenClaw จะละ payload การให้เหตุผลที่ปิดใช้งานไว้แทนการส่งค่าที่ไม่รองรับ
  - รายการแค็ตตาล็อกแบบกำหนดเองที่เข้ากันได้กับ OpenAI สามารถเลือกใช้ `/think xhigh` ได้โดยตั้งค่า `models.providers.<provider>.models[].compat.supportedReasoningEfforts` ให้รวม `"xhigh"` ค่านี้ใช้เมตาดาตาความเข้ากันได้เดียวกันที่จับคู่ payload effort การให้เหตุผลของ OpenAI ขาออก ดังนั้นเมนู การตรวจสอบเซสชัน agent CLI และ `llm-task` จะสอดคล้องกับพฤติกรรมการขนส่ง
  - ref ของ OpenRouter Hunter Alpha ที่กำหนดค่าไว้ล้าสมัยจะข้ามการฉีดการให้เหตุผลของ proxy เพราะเส้นทางที่เลิกใช้แล้วนั้นอาจส่งคืนข้อความคำตอบสุดท้ายผ่านฟิลด์การให้เหตุผล
  - Google Gemini จับคู่ `/think adaptive` ไปยังการคิดแบบไดนามิกที่ผู้ให้บริการเป็นเจ้าของของ Gemini คำขอ Gemini 3 จะละ `thinkingLevel` แบบคงที่ ส่วนคำขอ Gemini 2.5 จะส่ง `thinkingBudget: -1`; ระดับแบบคงที่ยังคงจับคู่ไปยัง `thinkingLevel` หรืองบประมาณของ Gemini ที่ใกล้ที่สุดสำหรับตระกูลโมเดลนั้น
  - MiniMax (`minimax/*`) บนเส้นทางสตรีมมิงที่เข้ากันได้กับ Anthropic ใช้ค่าเริ่มต้นเป็น `thinking: { type: "disabled" }` เว้นแต่คุณตั้งค่าการคิดอย่างชัดเจนในพารามิเตอร์โมเดลหรือพารามิเตอร์คำขอ วิธีนี้หลีกเลี่ยงเดลตา `reasoning_content` ที่รั่วจากรูปแบบสตรีม Anthropic แบบไม่ดั้งเดิมของ MiniMax
  - Z.AI (`zai/*`) รองรับเฉพาะการคิดแบบไบนารี (`on`/`off`) ระดับใด ๆ ที่ไม่ใช่ `off` จะถือเป็น `on` (จับคู่เป็น `low`)
  - Moonshot (`moonshot/*`) จับคู่ `/think off` เป็น `thinking: { type: "disabled" }` และระดับใด ๆ ที่ไม่ใช่ `off` เป็น `thinking: { type: "enabled" }` เมื่อเปิดใช้การคิด Moonshot จะรับเฉพาะ `tool_choice` `auto|none`; OpenClaw จะปรับค่าที่เข้ากันไม่ได้เป็น `auto`

## ลำดับการแก้ค่า

1. คำสั่งแบบอินไลน์บนข้อความ (ใช้กับข้อความนั้นเท่านั้น)
2. การ override ของเซสชัน (ตั้งค่าโดยส่งข้อความที่มีเฉพาะคำสั่ง)
3. ค่าเริ่มต้นต่อ agent (`agents.list[].thinkingDefault` ใน config)
4. ค่าเริ่มต้นส่วนกลาง (`agents.defaults.thinkingDefault` ใน config)
5. ค่าถอยกลับ: ค่าเริ่มต้นที่ผู้ให้บริการประกาศเมื่อมีให้ใช้ มิฉะนั้นโมเดลที่รองรับการให้เหตุผลจะแก้ค่าเป็น `medium` หรือระดับที่ไม่ใช่ `off` ที่รองรับใกล้ที่สุดสำหรับโมเดลนั้น และโมเดลที่ไม่รองรับการให้เหตุผลจะคงเป็น `off`

## การตั้งค่าเริ่มต้นของเซสชัน

- ส่งข้อความที่มี **เฉพาะ** คำสั่ง (อนุญาตช่องว่าง) เช่น `/think:medium` หรือ `/t high`
- ค่านี้จะติดอยู่กับเซสชันปัจจุบัน (ค่าเริ่มต้นคือต่อผู้ส่ง); ล้างได้ด้วย `/think:off` หรือการรีเซ็ตเมื่อเซสชันว่างนาน
- มีการส่งคำตอบยืนยัน (`Thinking level set to high.` / `Thinking disabled.`) หากระดับไม่ถูกต้อง (เช่น `/thinking big`) คำสั่งจะถูกปฏิเสธพร้อมคำแนะนำ และสถานะเซสชันจะไม่เปลี่ยน
- ส่ง `/think` (หรือ `/think:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับการคิดปัจจุบัน

## การนำไปใช้ตาม agent

- **Pi แบบฝัง**: ระดับที่แก้ค่าแล้วจะถูกส่งไปยังรันไทม์ agent Pi ในโปรเซส
- **แบ็กเอนด์ Claude CLI**: ระดับที่ไม่ใช่ off จะถูกส่งไปยัง Claude Code เป็น `--effort` เมื่อใช้ `claude-cli`; ดู [แบ็กเอนด์ CLI](/th/gateway/cli-backends)

## โหมดเร็ว (/fast)

- ระดับ: `on|off`
- ข้อความที่มีเฉพาะคำสั่งจะสลับการ override โหมดเร็วของเซสชันและตอบกลับ `Fast mode enabled.` / `Fast mode disabled.`
- ส่ง `/fast` (หรือ `/fast status`) โดยไม่มีโหมดเพื่อดูสถานะโหมดเร็วที่มีผลอยู่ปัจจุบัน
- OpenClaw แก้ค่าโหมดเร็วตามลำดับนี้:
  1. แบบอินไลน์/มีเฉพาะคำสั่ง `/fast on|off`
  2. การ override ของเซสชัน
  3. ค่าเริ่มต้นต่อ agent (`agents.list[].fastModeDefault`)
  4. config ต่อโมเดล: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. ค่าถอยกลับ: `off`
- สำหรับ `openai/*` โหมดเร็วจะจับคู่ไปยังการประมวลผลลำดับความสำคัญของ OpenAI โดยส่ง `service_tier=priority` บนคำขอ Responses ที่รองรับ
- สำหรับ `openai-codex/*` โหมดเร็วจะส่งแฟล็ก `service_tier=priority` เดียวกันบน Codex Responses OpenClaw ใช้สวิตช์ `/fast` ร่วมกันตัวเดียวในทั้งสองเส้นทาง auth
- สำหรับคำขอ `anthropic/*` สาธารณะโดยตรง รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย OAuth และส่งไปยัง `api.anthropic.com` โหมดเร็วจะจับคู่ไปยัง service tier ของ Anthropic: `/fast on` ตั้งค่า `service_tier=auto`, `/fast off` ตั้งค่า `service_tier=standard_only`
- สำหรับ `minimax/*` บนเส้นทางที่เข้ากันได้กับ Anthropic, `/fast on` (หรือ `params.fastMode: true`) จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`
- พารามิเตอร์โมเดล Anthropic `serviceTier` / `service_tier` ที่ระบุชัดเจนจะ override ค่าเริ่มต้นของโหมดเร็วเมื่อทั้งคู่ถูกตั้งค่า OpenClaw ยังคงข้ามการฉีด service-tier ของ Anthropic สำหรับ URL ฐาน proxy ที่ไม่ใช่ Anthropic
- `/status` แสดง `Fast` เฉพาะเมื่อเปิดใช้โหมดเร็ว

## คำสั่ง verbose (/verbose หรือ /v)

- ระดับ: `on` (ขั้นต่ำ) | `full` | `off` (ค่าเริ่มต้น)
- ข้อความที่มีเฉพาะคำสั่งจะสลับ verbose ของเซสชันและตอบกลับ `Verbose logging enabled.` / `Verbose logging disabled.`; ระดับที่ไม่ถูกต้องจะส่งคืนคำแนะนำโดยไม่เปลี่ยนสถานะ
- `/verbose off` จัดเก็บการ override ของเซสชันอย่างชัดเจน; ล้างผ่าน UI ของเซสชันโดยเลือก `inherit`
- คำสั่งแบบอินไลน์มีผลกับข้อความนั้นเท่านั้น; มิฉะนั้นจะใช้ค่าเริ่มต้นของเซสชัน/ส่วนกลาง
- ส่ง `/verbose` (หรือ `/verbose:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับ verbose ปัจจุบัน
- เมื่อเปิด verbose, agent ที่ปล่อยผลลัพธ์เครื่องมือแบบมีโครงสร้าง (Pi, agent JSON อื่น ๆ) จะส่งการเรียกเครื่องมือแต่ละครั้งกลับมาเป็นข้อความที่มีเฉพาะเมตาดาตาของตัวเอง นำหน้าด้วย `<emoji> <tool-name>: <arg>` เมื่อมีให้ใช้ สรุปเครื่องมือเหล่านี้จะถูกส่งทันทีที่เครื่องมือแต่ละรายการเริ่มทำงาน (บับเบิลแยกกัน) ไม่ใช่เดลตาแบบสตรีมมิง
- สรุปความล้มเหลวของเครื่องมือยังคงมองเห็นได้ในโหมดปกติ แต่ส่วนต่อท้ายรายละเอียดข้อผิดพลาดดิบจะถูกซ่อน เว้นแต่ verbose เป็น `on` หรือ `full`
- เมื่อ verbose เป็น `full` ผลลัพธ์เครื่องมือจะถูกส่งต่อหลังเสร็จสิ้นด้วย (บับเบิลแยกกัน ตัดให้เหลือความยาวที่ปลอดภัย) หากคุณสลับ `/verbose on|full|off` ระหว่างที่การรันกำลังดำเนินอยู่ บับเบิลเครื่องมือถัดไปจะเคารพการตั้งค่าใหม่
- `agents.defaults.toolProgressDetail` ควบคุมรูปแบบของสรุปเครื่องมือ `/verbose` และบรรทัดเครื่องมือในร่างความคืบหน้า ใช้ `"explain"` (ค่าเริ่มต้น) สำหรับป้ายกำกับอ่านง่ายแบบกระชับ เช่น `🛠️ Exec: checking JS syntax`; ใช้ `"raw"` เมื่อคุณต้องการแนบคำสั่ง/รายละเอียดดิบสำหรับการดีบักด้วย `agents.list[].toolProgressDetail` ต่อ agent จะ override ค่าเริ่มต้น
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## คำสั่งติดตาม Plugin (/trace)

- ระดับ: `on` | `off` (ค่าเริ่มต้น)
- ข้อความที่มีเฉพาะคำสั่งจะสลับเอาต์พุตการติดตาม Plugin ของเซสชันและตอบกลับ `Plugin trace enabled.` / `Plugin trace disabled.`
- คำสั่งแบบอินไลน์มีผลกับข้อความนั้นเท่านั้น; มิฉะนั้นจะใช้ค่าเริ่มต้นของเซสชัน/ส่วนกลาง
- ส่ง `/trace` (หรือ `/trace:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับการติดตามปัจจุบัน
- `/trace` แคบกว่า `/verbose`: จะแสดงเฉพาะบรรทัด trace/debug ที่ Plugin เป็นเจ้าของ เช่น สรุปดีบัก Active Memory
- บรรทัด trace อาจปรากฏใน `/status` และเป็นข้อความวินิจฉัยติดตามผลหลังคำตอบปกติของผู้ช่วย

## การมองเห็นการให้เหตุผล (/reasoning)

- ระดับ: `on|off|stream`
- ข้อความที่มีเฉพาะคำสั่งจะสลับว่าจะให้แสดงบล็อกการคิดในคำตอบหรือไม่
- เมื่อเปิดใช้ การให้เหตุผลจะถูกส่งเป็น **ข้อความแยกต่างหาก** นำหน้าด้วย `Reasoning:`
- `stream` (เฉพาะ Telegram): สตรีมการให้เหตุผลเข้าไปในบับเบิลร่างของ Telegram ขณะที่กำลังสร้างคำตอบ จากนั้นส่งคำตอบสุดท้ายโดยไม่มีการให้เหตุผล
- นามแฝง: `/reason`
- ส่ง `/reasoning` (หรือ `/reasoning:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับการให้เหตุผลปัจจุบัน
- ลำดับการแก้ค่า: คำสั่งแบบอินไลน์ จากนั้นการ override ของเซสชัน จากนั้นค่าเริ่มต้นต่อ agent (`agents.list[].reasoningDefault`) จากนั้นค่าถอยกลับ (`off`)

แท็กการให้เหตุผลของโมเดลท้องถิ่นที่มีรูปแบบผิดจะถูกจัดการอย่างระมัดระวัง บล็อก `<think>...</think>` ที่ปิดแล้วจะยังถูกซ่อนในคำตอบปกติ และการให้เหตุผลที่ไม่ปิดหลังจากข้อความที่มองเห็นแล้วก็ถูกซ่อนเช่นกัน หากคำตอบถูกห่อทั้งหมดในแท็กเปิดที่ไม่ปิดเพียงแท็กเดียวและมิฉะนั้นจะส่งเป็นข้อความว่าง OpenClaw จะลบแท็กเปิดที่มีรูปแบบผิดและส่งข้อความที่เหลือ

## ที่เกี่ยวข้อง

- เอกสารโหมดยกระดับอยู่ใน [โหมดยกระดับ](/th/tools/elevated)

## Heartbeats

- เนื้อหา probe ของ Heartbeat คือพรอมป์ heartbeat ที่กำหนดค่าไว้ (ค่าเริ่มต้น: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`) คำสั่งแบบอินไลน์ในข้อความ heartbeat จะมีผลตามปกติ (แต่หลีกเลี่ยงการเปลี่ยนค่าเริ่มต้นของเซสชันจาก heartbeats)
- การส่ง Heartbeat ใช้ค่าเริ่มต้นเป็น payload สุดท้ายเท่านั้น หากต้องการส่งข้อความ `Reasoning:` แยกต่างหากด้วย (เมื่อมีให้ใช้) ให้ตั้งค่า `agents.defaults.heartbeat.includeReasoning: true` หรือต่อ agent `agents.list[].heartbeat.includeReasoning: true`

## UI เว็บแชต

- ตัวเลือกระดับการคิดของเว็บแชตสะท้อนระดับที่จัดเก็บของเซสชันจาก session store/config ขาเข้าเมื่อโหลดหน้า
- การเลือกระดับอื่นจะเขียนการ override ของเซสชันทันทีผ่าน `sessions.patch`; ไม่ต้องรอการส่งครั้งถัดไป และไม่ใช่การ override แบบใช้ครั้งเดียว `thinkingOnce`
- ตัวเลือกแรกเป็น `Default (<resolved level>)` เสมอ โดยค่าเริ่มต้นที่แก้ค่าแล้วมาจากโปรไฟล์การคิดของผู้ให้บริการของโมเดลในเซสชันที่ใช้งานอยู่ บวกกับตรรกะถอยกลับเดียวกันที่ `/status` และ `session_status` ใช้
- ตัวเลือกใช้ `thinkingLevels` ที่ส่งคืนโดยแถว/ค่าเริ่มต้นของเซสชัน Gateway โดยคง `thinkingOptions` ไว้เป็นรายการป้ายกำกับเดิม UI ของเบราว์เซอร์ไม่ได้เก็บรายการ regex ของผู้ให้บริการเอง; Plugin เป็นเจ้าของชุดระดับเฉพาะโมเดล
- `/think:<level>` ยังคงใช้งานได้และอัปเดตระดับเซสชันที่จัดเก็บเดียวกัน ดังนั้นคำสั่งแชตและตัวเลือกจะยังซิงก์กัน

## โปรไฟล์ผู้ให้บริการ

- Plugin ของผู้ให้บริการสามารถเปิดเผย `resolveThinkingProfile(ctx)` เพื่อกำหนดระดับที่โมเดลรองรับและค่าเริ่มต้น
- Plugin ของผู้ให้บริการที่ทำ proxy โมเดล Claude ควรใช้ `resolveClaudeThinkingProfile(modelId)` จาก `openclaw/plugin-sdk/provider-model-shared` ซ้ำ เพื่อให้แค็ตตาล็อกของ Anthropic โดยตรงและ proxy สอดคล้องกัน
- แต่ละระดับโปรไฟล์มี `id` แบบ canonical ที่จัดเก็บไว้ (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` หรือ `max`) และอาจมี `label` สำหรับแสดงผล ผู้ให้บริการแบบไบนารีใช้ `{ id: "low", label: "on" }`
- Plugin เครื่องมือที่ต้องตรวจสอบการ override thinking แบบระบุชัดเจนควรใช้ `api.runtime.agent.resolveThinkingPolicy({ provider, model })` ร่วมกับ `api.runtime.agent.normalizeThinkingLevel(...)`; ไม่ควรเก็บรายการระดับของผู้ให้บริการ/โมเดลไว้เอง
- Plugin เครื่องมือที่เข้าถึงเมตาดาต้าโมเดลแบบกำหนดเองที่ตั้งค่าไว้ได้สามารถส่ง `catalog` เข้าไปใน `resolveThinkingPolicy` เพื่อให้การ opt-in ของ `compat.supportedReasoningEfforts` สะท้อนในการตรวจสอบฝั่ง Plugin
- hook รุ่นเก่าที่เผยแพร่แล้ว (`supportsXHighThinking`, `isBinaryThinking` และ `resolveDefaultThinkingLevel`) ยังคงอยู่ในฐานะอะแดปเตอร์ความเข้ากันได้ แต่ชุดระดับแบบกำหนดเองใหม่ควรใช้ `resolveThinkingProfile`
- แถว/ค่าเริ่มต้นของ Gateway เปิดเผย `thinkingLevels`, `thinkingOptions` และ `thinkingDefault` เพื่อให้ไคลเอนต์ ACP/แชทเรนเดอร์ id และป้ายกำกับของโปรไฟล์เดียวกับที่การตรวจสอบ runtime ใช้
