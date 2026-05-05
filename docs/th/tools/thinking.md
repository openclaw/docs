---
read_when:
    - การปรับการแยกวิเคราะห์หรือค่าเริ่มต้นของ thinking, fast-mode หรือคำสั่ง verbose
summary: ไวยากรณ์คำสั่งกำกับสำหรับ /think, /fast, /verbose, /trace และการมองเห็นการให้เหตุผล
title: ระดับการคิด
x-i18n:
    generated_at: "2026-05-05T01:51:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2282c9eccda4693680bbfbfc42de508021f4472b00d40a1a8c1bc19a4516012
    source_path: tools/thinking.md
    workflow: 16
---

## สิ่งที่ทำ

- คำสั่งกำกับแบบอินไลน์ในเนื้อหาขาเข้าใดๆ: `/t <level>`, `/think:<level>` หรือ `/thinking <level>`
- ระดับ (นามแฝง): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “คิด”
  - low → “คิดให้หนัก”
  - medium → “คิดให้หนักขึ้น”
  - high → “คิดแบบละเอียดมาก” (งบสูงสุด)
  - xhigh → “คิดแบบละเอียดมาก+” (โมเดล GPT-5.2+ และ Codex รวมถึง effort ของ Anthropic Claude Opus 4.7)
  - adaptive → การคิดแบบปรับตัวที่ผู้ให้บริการจัดการ (รองรับสำหรับ Claude 4.6 บน Anthropic/Bedrock, Anthropic Claude Opus 4.7 และการคิดแบบไดนามิกของ Google Gemini)
  - max → reasoning สูงสุดของผู้ให้บริการ (Anthropic Claude Opus 4.7; Ollama แมปค่านี้ไปยัง effort `think` ดั้งเดิมสูงสุดของตัวเอง)
  - `x-high`, `x_high`, `extra-high`, `extra high` และ `extra_high` แมปไปยัง `xhigh`
  - `highest` แมปไปยัง `high`
- หมายเหตุสำหรับผู้ให้บริการ:
  - เมนูและตัวเลือกการคิดขับเคลื่อนด้วยโปรไฟล์ผู้ให้บริการ Plugin ของผู้ให้บริการประกาศชุดระดับที่แน่นอนสำหรับโมเดลที่เลือก รวมถึงป้ายกำกับอย่าง `on` แบบไบนารี
  - `adaptive`, `xhigh` และ `max` จะแสดงเฉพาะสำหรับโปรไฟล์ผู้ให้บริการ/โมเดลที่รองรับเท่านั้น คำสั่งกำกับที่พิมพ์สำหรับระดับที่ไม่รองรับจะถูกปฏิเสธพร้อมตัวเลือกที่ใช้ได้ของโมเดลนั้น
  - ระดับที่เก็บไว้เดิมซึ่งไม่รองรับจะถูกแมปใหม่ตามลำดับอันดับโปรไฟล์ผู้ให้บริการ `adaptive` จะถอยกลับเป็น `medium` บนโมเดลที่ไม่รองรับ adaptive ขณะที่ `xhigh` และ `max` จะถอยกลับเป็นระดับ non-off ที่ใหญ่ที่สุดซึ่งโมเดลที่เลือกรองรับ
  - โมเดล Anthropic Claude 4.6 ใช้ค่าเริ่มต้นเป็น `adaptive` เมื่อไม่ได้ตั้งค่าระดับการคิดไว้อย่างชัดเจน
  - Anthropic Claude Opus 4.7 ไม่ได้ใช้การคิดแบบปรับตัวเป็นค่าเริ่มต้น ค่าเริ่มต้น effort ของ API ยังคงเป็นของผู้ให้บริการ เว้นแต่คุณจะตั้งค่าระดับการคิดอย่างชัดเจน
  - Anthropic Claude Opus 4.7 แมป `/think xhigh` ไปยังการคิดแบบปรับตัวร่วมกับ `output_config.effort: "xhigh"` เพราะ `/think` เป็นคำสั่งกำกับการคิด และ `xhigh` เป็นการตั้งค่า effort ของ Opus 4.7
  - Anthropic Claude Opus 4.7 ยังเปิดใช้ `/think max`; โดยแมปไปยังเส้นทาง max effort เดียวกันที่ผู้ให้บริการเป็นเจ้าของ
  - โมเดล Direct DeepSeek V4 เปิดใช้ `/think xhigh|max`; ทั้งสองแมปไปยัง DeepSeek `reasoning_effort: "max"` ขณะที่ระดับ non-off ที่ต่ำกว่าจะถูกแมปไปยัง `high`
  - โมเดล DeepSeek V4 ที่ส่งผ่าน OpenRouter เปิดใช้ `/think xhigh` และส่งค่า `reasoning_effort` ที่ OpenRouter รองรับ การแทนที่ `max` ที่เก็บไว้จะถอยกลับเป็น `xhigh`
  - โมเดล Ollama ที่รองรับการคิดเปิดใช้ `/think low|medium|high|max`; `max` แมปไปยัง `think: "high"` ดั้งเดิม เพราะ API ดั้งเดิมของ Ollama รับสตริง effort `low`, `medium` และ `high`
  - โมเดล OpenAI GPT แมป `/think` ผ่านการรองรับ effort ของ Responses API ตามแต่ละโมเดล `/think off` ส่ง `reasoning.effort: "none"` เฉพาะเมื่อโมเดลเป้าหมายรองรับเท่านั้น มิฉะนั้น OpenClaw จะละเว้น payload reasoning ที่ปิดใช้งานแทนการส่งค่าที่ไม่รองรับ
  - รายการแค็ตตาล็อกแบบเข้ากันได้กับ OpenAI ที่กำหนดเองสามารถเลือกใช้ `/think xhigh` ได้โดยตั้งค่า `models.providers.<provider>.models[].compat.supportedReasoningEfforts` ให้รวม `"xhigh"` สิ่งนี้ใช้เมตาดาต้า compat เดียวกันที่แมป payload effort ของ OpenAI reasoning ขาออก ดังนั้นเมนู การตรวจสอบเซสชัน agent CLI และ `llm-task` จึงสอดคล้องกับพฤติกรรมการขนส่ง
  - refs OpenRouter Hunter Alpha ที่กำหนดค่าไว้แต่ล้าสมัยจะข้ามการฉีด reasoning ของ proxy เพราะเส้นทางที่เลิกใช้แล้วนั้นอาจส่งข้อความคำตอบสุดท้ายผ่านฟิลด์ reasoning
  - Google Gemini แมป `/think adaptive` ไปยังการคิดแบบไดนามิกของ Gemini ที่ผู้ให้บริการเป็นเจ้าของ คำขอ Gemini 3 จะละเว้น `thinkingLevel` แบบคงที่ ขณะที่คำขอ Gemini 2.5 จะส่ง `thinkingBudget: -1`; ระดับแบบคงที่ยังคงแมปไปยัง `thinkingLevel` หรือ budget ของ Gemini ที่ใกล้ที่สุดสำหรับตระกูลโมเดลนั้น
  - MiniMax (`minimax/*`) บนเส้นทางสตรีมมิงที่เข้ากันได้กับ Anthropic มีค่าเริ่มต้นเป็น `thinking: { type: "disabled" }` เว้นแต่คุณจะตั้งค่าการคิดอย่างชัดเจนในพารามิเตอร์โมเดลหรือพารามิเตอร์คำขอ วิธีนี้หลีกเลี่ยงเดลตา `reasoning_content` ที่รั่วจากรูปแบบสตรีม Anthropic ที่ไม่ใช่ดั้งเดิมของ MiniMax
  - Z.AI (`zai/*`) รองรับเฉพาะการคิดแบบไบนารี (`on`/`off`) ระดับใดๆ ที่ไม่ใช่ `off` จะถูกถือเป็น `on` (แมปไปยัง `low`)
  - Moonshot (`moonshot/*`) แมป `/think off` ไปยัง `thinking: { type: "disabled" }` และระดับใดๆ ที่ไม่ใช่ `off` ไปยัง `thinking: { type: "enabled" }` เมื่อเปิดใช้การคิด Moonshot รับเฉพาะ `tool_choice` `auto|none`; OpenClaw ปรับค่าที่เข้ากันไม่ได้ให้เป็น `auto`

## ลำดับการแก้ค่า

1. คำสั่งกำกับแบบอินไลน์บนข้อความ (ใช้กับข้อความนั้นเท่านั้น)
2. การแทนที่ของเซสชัน (ตั้งค่าโดยส่งข้อความที่มีเฉพาะคำสั่งกำกับ)
3. ค่าเริ่มต้นราย agent (`agents.list[].thinkingDefault` ใน config)
4. ค่าเริ่มต้นส่วนกลาง (`agents.defaults.thinkingDefault` ใน config)
5. ค่าถอยกลับ: ค่าเริ่มต้นที่ผู้ให้บริการประกาศเมื่อมีให้ใช้ มิฉะนั้นโมเดลที่รองรับ reasoning จะแก้ค่าเป็น `medium` หรือระดับ non-`off` ที่ใกล้ที่สุดซึ่งโมเดลนั้นรองรับ และโมเดลที่ไม่รองรับ reasoning จะยังคงเป็น `off`

## การตั้งค่าเริ่มต้นของเซสชัน

- ส่งข้อความที่เป็น **เฉพาะ** คำสั่งกำกับ (อนุญาตให้มีช่องว่าง) เช่น `/think:medium` หรือ `/t high`
- ค่านี้จะคงอยู่สำหรับเซสชันปัจจุบัน (ค่าเริ่มต้นคือแยกตามผู้ส่ง); ล้างได้ด้วย `/think:off` หรือการรีเซ็ตเมื่อเซสชันว่างนาน
- จะส่งข้อความยืนยัน (`Thinking level set to high.` / `Thinking disabled.`) หากระดับไม่ถูกต้อง (เช่น `/thinking big`) คำสั่งจะถูกปฏิเสธพร้อมคำใบ้ และสถานะเซสชันจะไม่เปลี่ยน
- ส่ง `/think` (หรือ `/think:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับการคิดปัจจุบัน

## การใช้ตาม agent

- **Pi แบบฝังตัว**: ระดับที่แก้ค่าแล้วจะถูกส่งไปยัง runtime ของ Pi agent ในกระบวนการ
- **แบ็กเอนด์ Claude CLI**: ระดับที่ไม่ใช่ off จะถูกส่งไปยัง Claude Code เป็น `--effort` เมื่อใช้ `claude-cli`; ดู [แบ็กเอนด์ CLI](/th/gateway/cli-backends)

## โหมดเร็ว (/fast)

- ระดับ: `on|off`
- ข้อความที่มีเฉพาะคำสั่งกำกับจะสลับการแทนที่ fast-mode ของเซสชัน และตอบกลับ `Fast mode enabled.` / `Fast mode disabled.`
- ส่ง `/fast` (หรือ `/fast status`) โดยไม่มีโหมดเพื่อดูสถานะ fast-mode ที่มีผลปัจจุบัน
- OpenClaw แก้ค่า fast mode ตามลำดับนี้:
  1. `/fast on|off` แบบอินไลน์/เฉพาะคำสั่งกำกับ
  2. การแทนที่ของเซสชัน
  3. ค่าเริ่มต้นราย agent (`agents.list[].fastModeDefault`)
  4. config รายโมเดล: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. ค่าถอยกลับ: `off`
- สำหรับ `openai/*` fast mode แมปไปยังการประมวลผลแบบ priority ของ OpenAI โดยส่ง `service_tier=priority` บนคำขอ Responses ที่รองรับ
- สำหรับ `openai-codex/*` fast mode ส่งแฟล็ก `service_tier=priority` เดียวกันบน Codex Responses OpenClaw ใช้สวิตช์ `/fast` ร่วมกันตัวเดียวข้ามทั้งสองเส้นทาง auth
- สำหรับคำขอ `anthropic/*` สาธารณะโดยตรง รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย OAuth ซึ่งส่งไปยัง `api.anthropic.com` fast mode แมปไปยัง service tiers ของ Anthropic: `/fast on` ตั้งค่า `service_tier=auto`, `/fast off` ตั้งค่า `service_tier=standard_only`
- สำหรับ `minimax/*` บนเส้นทางที่เข้ากันได้กับ Anthropic `/fast on` (หรือ `params.fastMode: true`) จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`
- พารามิเตอร์โมเดล Anthropic `serviceTier` / `service_tier` ที่ตั้งไว้อย่างชัดเจนจะแทนที่ค่าเริ่มต้น fast-mode เมื่อมีการตั้งค่าทั้งคู่ OpenClaw ยังคงข้ามการฉีด service-tier ของ Anthropic สำหรับ base URL proxy ที่ไม่ใช่ Anthropic
- `/status` แสดง `Fast` เฉพาะเมื่อเปิดใช้ fast mode

## คำสั่งกำกับแบบละเอียด (/verbose หรือ /v)

- ระดับ: `on` (น้อยที่สุด) | `full` | `off` (ค่าเริ่มต้น)
- ข้อความที่มีเฉพาะคำสั่งกำกับจะสลับ verbose ของเซสชัน และตอบกลับ `Verbose logging enabled.` / `Verbose logging disabled.`; ระดับที่ไม่ถูกต้องจะส่งคืนคำใบ้โดยไม่เปลี่ยนสถานะ
- `/verbose off` เก็บการแทนที่ของเซสชันไว้อย่างชัดเจน; ล้างผ่าน UI เซสชันโดยเลือก `inherit`
- คำสั่งกำกับแบบอินไลน์มีผลเฉพาะข้อความนั้น มิฉะนั้นจะใช้ค่าเริ่มต้นของเซสชัน/ส่วนกลาง
- ส่ง `/verbose` (หรือ `/verbose:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับ verbose ปัจจุบัน
- เมื่อเปิด verbose, agents ที่ปล่อยผลลัพธ์เครื่องมือแบบมีโครงสร้าง (Pi และ JSON agents อื่นๆ) จะส่งแต่ละ tool call กลับเป็นข้อความของตัวเองที่มีเฉพาะเมตาดาต้า โดยขึ้นต้นด้วย `<emoji> <tool-name>: <arg>` เมื่อมีให้ใช้ สรุปเครื่องมือเหล่านี้จะถูกส่งทันทีที่แต่ละเครื่องมือเริ่มทำงาน (เป็นบับเบิลแยกกัน) ไม่ใช่เดลตาสตรีมมิง
- สรุปความล้มเหลวของเครื่องมือยังคงมองเห็นได้ในโหมดปกติ แต่ suffix รายละเอียดข้อผิดพลาดดิบจะถูกซ่อน เว้นแต่ verbose เป็น `on` หรือ `full`
- เมื่อ verbose เป็น `full` เอาต์พุตของเครื่องมือจะถูกส่งต่อหลังเสร็จสิ้นด้วย (บับเบิลแยกกัน และตัดทอนให้มีความยาวที่ปลอดภัย) หากคุณสลับ `/verbose on|full|off` ขณะที่รันกำลังทำงาน บับเบิลเครื่องมือถัดไปจะเคารพการตั้งค่าใหม่
- `agents.defaults.toolProgressDetail` ควบคุมรูปแบบของสรุปเครื่องมือ `/verbose` และบรรทัดเครื่องมือ progress-draft ใช้ `"explain"` (ค่าเริ่มต้น) สำหรับป้ายกำกับมนุษย์แบบกระชับ เช่น `🛠️ Exec: checking JS syntax`; ใช้ `"raw"` เมื่อต้องการให้แนบคำสั่ง/รายละเอียดดิบสำหรับดีบักด้วย `agents.list[].toolProgressDetail` ราย agent จะแทนที่ค่าเริ่มต้น
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## คำสั่งกำกับ trace ของ Plugin (/trace)

- ระดับ: `on` | `off` (ค่าเริ่มต้น)
- ข้อความที่มีเฉพาะคำสั่งกำกับจะสลับเอาต์พุต trace ของ Plugin ของเซสชัน และตอบกลับ `Plugin trace enabled.` / `Plugin trace disabled.`
- คำสั่งกำกับแบบอินไลน์มีผลเฉพาะข้อความนั้น มิฉะนั้นจะใช้ค่าเริ่มต้นของเซสชัน/ส่วนกลาง
- ส่ง `/trace` (หรือ `/trace:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับ trace ปัจจุบัน
- `/trace` แคบกว่า `/verbose`: เปิดเผยเฉพาะบรรทัด trace/debug ที่ Plugin เป็นเจ้าของ เช่น สรุปดีบักของ Active Memory
- บรรทัด trace อาจปรากฏใน `/status` และเป็นข้อความวินิจฉัยตามหลังหลังจากคำตอบปกติของผู้ช่วย

## การมองเห็น reasoning (/reasoning)

- ระดับ: `on|off|stream`
- ข้อความที่มีเฉพาะคำสั่งกำกับจะสลับว่าจะให้แสดงบล็อกการคิดในคำตอบหรือไม่
- เมื่อเปิดใช้ reasoning จะถูกส่งเป็น **ข้อความแยกต่างหาก** โดยขึ้นต้นด้วย `Reasoning:`
- `stream` (เฉพาะ Telegram): สตรีม reasoning เข้าไปในบับเบิลร่างของ Telegram ขณะที่กำลังสร้างคำตอบ จากนั้นส่งคำตอบสุดท้ายโดยไม่มี reasoning
- นามแฝง: `/reason`
- ส่ง `/reasoning` (หรือ `/reasoning:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับ reasoning ปัจจุบัน
- ลำดับการแก้ค่า: คำสั่งกำกับแบบอินไลน์ จากนั้นการแทนที่ของเซสชัน จากนั้นค่าเริ่มต้นราย agent (`agents.list[].reasoningDefault`) จากนั้นค่าถอยกลับ (`off`)

แท็ก reasoning ของโมเดลในเครื่องที่ผิดรูปจะถูกจัดการอย่างระมัดระวัง บล็อก `<think>...</think>` ที่ปิดครบจะยังถูกซ่อนในการตอบกลับปกติ และ reasoning ที่ไม่ปิดหลังข้อความที่มองเห็นแล้วก็จะถูกซ่อนเช่นกัน หากคำตอบถูกห่อทั้งหมดด้วยแท็กเปิดที่ไม่ปิดเพียงแท็กเดียว และไม่เช่นนั้นจะส่งเป็นข้อความว่าง OpenClaw จะลบแท็กเปิดที่ผิดรูปออกและส่งข้อความที่เหลือ

## ที่เกี่ยวข้อง

- เอกสารโหมด Elevated อยู่ใน [โหมด Elevated](/th/tools/elevated)

## Heartbeats

- เนื้อหา probe ของ Heartbeat คือพรอมป์ heartbeat ที่กำหนดค่าไว้ (ค่าเริ่มต้น: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`) คำสั่งกำกับแบบอินไลน์ในข้อความ heartbeat จะมีผลตามปกติ (แต่หลีกเลี่ยงการเปลี่ยนค่าเริ่มต้นของเซสชันจาก heartbeats)
- การส่ง Heartbeat มีค่าเริ่มต้นเป็น payload สุดท้ายเท่านั้น หากต้องการส่งข้อความ `Reasoning:` แยกต่างหากด้วย (เมื่อมีให้ใช้) ให้ตั้งค่า `agents.defaults.heartbeat.includeReasoning: true` หรือราย agent `agents.list[].heartbeat.includeReasoning: true`

## UI เว็บแชต

- ตัวเลือกการคิดของเว็บแชตจะสะท้อนระดับที่เก็บไว้ของเซสชันจาก inbound session store/config เมื่อโหลดหน้า
- การเลือกอีกระดับหนึ่งจะเขียนการแทนที่ของเซสชันทันทีผ่าน `sessions.patch`; ไม่รอการส่งครั้งถัดไป และไม่ใช่การแทนที่ `thinkingOnce` แบบครั้งเดียว
- ตัวเลือกแรกคือ `Default (<resolved level>)` เสมอ โดยค่าเริ่มต้นที่แก้ค่าแล้วมาจากโปรไฟล์การคิดของผู้ให้บริการของโมเดลเซสชันที่ใช้งานอยู่ ร่วมกับตรรกะถอยกลับเดียวกันที่ `/status` และ `session_status` ใช้
- ตัวเลือกใช้ `thinkingLevels` ที่ส่งคืนโดยแถว/defaults ของเซสชัน Gateway โดยเก็บ `thinkingOptions` ไว้เป็นรายการป้ายกำกับ legacy UI เบราว์เซอร์ไม่เก็บรายการ regex ของผู้ให้บริการเอง; plugins เป็นเจ้าของชุดระดับเฉพาะโมเดล
- `/think:<level>` ยังคงทำงานและอัปเดตระดับเซสชันที่เก็บไว้เดียวกัน ดังนั้นคำสั่งกำกับแชตและตัวเลือกจึงซิงก์กัน

## โปรไฟล์ผู้ให้บริการ

- Provider Plugin สามารถเปิดเผย `resolveThinkingProfile(ctx)` เพื่อกำหนดระดับที่โมเดลรองรับและค่าเริ่มต้นของโมเดลได้
- Provider Plugin ที่พร็อกซีโมเดล Claude ควรนำ `resolveClaudeThinkingProfile(modelId)` จาก `openclaw/plugin-sdk/provider-model-shared` มาใช้ซ้ำ เพื่อให้แค็ตตาล็อกของ Anthropic โดยตรงและแบบพร็อกซียังคงสอดคล้องกัน
- แต่ละระดับของโปรไฟล์มี `id` เชิงมาตรฐานที่จัดเก็บไว้ (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, หรือ `max`) และอาจมี `label` สำหรับแสดงผล Provider แบบไบนารีใช้ `{ id: "low", label: "on" }`
- Tool Plugin ที่ต้องตรวจสอบการแทนที่ค่าการคิดอย่างชัดเจนควรใช้ `api.runtime.agent.resolveThinkingPolicy({ provider, model })` ร่วมกับ `api.runtime.agent.normalizeThinkingLevel(...)` และไม่ควรเก็บรายการระดับของ provider/model ไว้เอง
- Tool Plugin ที่เข้าถึงเมตาดาต้าของโมเดลแบบกำหนดเองที่ตั้งค่าไว้ได้ สามารถส่ง `catalog` เข้าไปใน `resolveThinkingPolicy` เพื่อให้การเลือกใช้ `compat.supportedReasoningEfforts` สะท้อนในการตรวจสอบฝั่ง Plugin
- Hook รุ่นเก่าที่เผยแพร่แล้ว (`supportsXHighThinking`, `isBinaryThinking`, และ `resolveDefaultThinkingLevel`) ยังคงอยู่ในฐานะอะแดปเตอร์เพื่อความเข้ากันได้ แต่ชุดระดับแบบกำหนดเองใหม่ควรใช้ `resolveThinkingProfile`
- แถว/ค่าเริ่มต้นของ Gateway เปิดเผย `thinkingLevels`, `thinkingOptions`, และ `thinkingDefault` เพื่อให้ไคลเอนต์ ACP/แชตแสดง id และป้ายกำกับของโปรไฟล์เดียวกันกับที่การตรวจสอบ runtime ใช้
