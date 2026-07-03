---
read_when:
    - การปรับการแยกวิเคราะห์หรือค่าเริ่มต้นของคำสั่ง thinking, fast-mode หรือ verbose
summary: ไวยากรณ์ไดเรกทีฟสำหรับ /think, /fast, /verbose, /trace และการมองเห็นการให้เหตุผล
title: ระดับการคิด
x-i18n:
    generated_at: "2026-07-03T10:06:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6383ac18fbef0d06a97df5c204d57829ae4993b8287f8ef60aeae197ea711722
    source_path: tools/thinking.md
    workflow: 16
---

## สิ่งที่ทำ

- คำสั่งแบบ inline ในเนื้อหาขาเข้าใด ๆ: `/t <level>`, `/think:<level>` หรือ `/thinking <level>`
- ระดับ (นามแฝง): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (งบประมาณสูงสุด)
  - xhigh → "ultrathink+" (โมเดล GPT-5.2+ และ Codex รวมถึง effort ของ Anthropic Claude Opus 4.7+)
  - adaptive → การคิดแบบปรับตัวที่จัดการโดยผู้ให้บริการ (รองรับสำหรับ Claude 4.6 บน Anthropic/Bedrock, Anthropic Claude Opus 4.7+ และการคิดแบบไดนามิกของ Google Gemini)
  - max → การให้เหตุผลสูงสุดของผู้ให้บริการ (Anthropic Claude Opus 4.7+; Ollama แมปค่านี้ไปยัง effort `think` แบบ native ที่สูงที่สุด)
  - `x-high`, `x_high`, `extra-high`, `extra high` และ `extra_high` แมปไปที่ `xhigh`
  - `highest` แมปไปที่ `high`
- หมายเหตุของผู้ให้บริการ:
  - เมนูและตัวเลือกการคิดขับเคลื่อนโดยโปรไฟล์ผู้ให้บริการ Plugin ผู้ให้บริการประกาศชุดระดับที่แน่นอนสำหรับโมเดลที่เลือก รวมถึงป้ายกำกับอย่าง `on` แบบไบนารี
  - `adaptive`, `xhigh` และ `max` จะแสดงเฉพาะสำหรับโปรไฟล์ผู้ให้บริการ/โมเดลที่รองรับเท่านั้น คำสั่งแบบพิมพ์สำหรับระดับที่ไม่รองรับจะถูกปฏิเสธพร้อมตัวเลือกที่ใช้ได้ของโมเดลนั้น
  - ระดับที่ไม่รองรับซึ่งจัดเก็บไว้เดิมจะถูกแมปใหม่ตามลำดับชั้นของโปรไฟล์ผู้ให้บริการ `adaptive` จะย้อนกลับไปที่ `medium` บนโมเดลที่ไม่รองรับ adaptive ขณะที่ `xhigh` และ `max` จะย้อนกลับไปยังระดับ non-off ที่รองรับสูงสุดสำหรับโมเดลที่เลือก
  - โมเดล Anthropic Claude 4.6 มีค่าเริ่มต้นเป็น `adaptive` เมื่อไม่ได้ตั้งค่าระดับการคิดไว้อย่างชัดเจน
  - Anthropic Claude Opus 4.8 และ Opus 4.7 จะปิดการคิดไว้ เว้นแต่คุณจะตั้งค่าระดับการคิดอย่างชัดเจน ค่าเริ่มต้น effort ที่ผู้ให้บริการเป็นเจ้าของของ Opus 4.8 คือ `high` หลังจากเปิดใช้การคิดแบบ adaptive
  - Anthropic Claude Opus 4.7+ แมป `/think xhigh` ไปยังการคิดแบบ adaptive พร้อม `output_config.effort: "xhigh"` เพราะ `/think` เป็นคำสั่งการคิด และ `xhigh` เป็นการตั้งค่า effort ของ Opus
  - Anthropic Claude Opus 4.7+ ยังเปิดเผย `/think max`; ซึ่งแมปไปยังเส้นทาง max effort เดียวกันที่ผู้ให้บริการเป็นเจ้าของ
  - โมเดล Direct DeepSeek V4 เปิดเผย `/think xhigh|max`; ทั้งสองค่าแมปไปยัง DeepSeek `reasoning_effort: "max"` ขณะที่ระดับ non-off ที่ต่ำกว่าจะแมปไปที่ `high`
  - โมเดล DeepSeek V4 ที่ส่งผ่าน OpenRouter เปิดเผย `/think xhigh` และส่งค่า `reasoning.effort` ที่ OpenRouter รองรับ แทน `reasoning_effort` ระดับบนสุดแบบ native ของ DeepSeek ระดับ non-off ที่ต่ำกว่าจะแมปไปที่ `high` และการ override `max` ที่จัดเก็บไว้จะย้อนกลับไปที่ `xhigh`
  - โมเดล Ollama ที่รองรับการคิดเปิดเผย `/think low|medium|high|max`; `max` แมปไปยัง `think: "high"` แบบ native เพราะ API แบบ native ของ Ollama ยอมรับสตริง effort `low`, `medium` และ `high`
  - โมเดล OpenAI GPT แมป `/think` ผ่านการรองรับ effort ของ Responses API เฉพาะโมเดล `/think off` ส่ง `reasoning.effort: "none"` เฉพาะเมื่อโมเดลเป้าหมายรองรับเท่านั้น มิฉะนั้น OpenClaw จะละ payload การให้เหตุผลที่ปิดไว้แทนการส่งค่าที่ไม่รองรับ
  - รายการแค็ตตาล็อกที่เข้ากันได้กับ OpenAI แบบกำหนดเองสามารถเลือกใช้ `/think xhigh` ได้โดยตั้งค่า `models.providers.<provider>.models[].compat.supportedReasoningEfforts` ให้มี `"xhigh"` ซึ่งใช้ metadata ความเข้ากันได้ชุดเดียวกับที่แมป payload effort การให้เหตุผลของ OpenAI ขาออก ดังนั้นเมนู การตรวจสอบ session, agent CLI และ `llm-task` จะสอดคล้องกับพฤติกรรมการส่งข้อมูล
  - ref ของ OpenRouter Hunter Alpha ที่กำหนดค่าไว้และล้าสมัยจะข้ามการฉีด proxy reasoning เพราะเส้นทางที่เลิกใช้แล้วนั้นอาจส่งข้อความคำตอบสุดท้ายผ่านฟิลด์ reasoning
  - Google Gemini แมป `/think adaptive` ไปยังการคิดแบบไดนามิกที่ผู้ให้บริการเป็นเจ้าของของ Gemini คำขอ Gemini 3 จะละ `thinkingLevel` แบบคงที่ ขณะที่คำขอ Gemini 2.5 ส่ง `thinkingBudget: -1`; ระดับแบบคงที่ยังคงแมปไปยัง `thinkingLevel` หรือ budget ของ Gemini ที่ใกล้ที่สุดสำหรับตระกูลโมเดลนั้น
  - MiniMax M2.x (`minimax/MiniMax-M2*`) บนเส้นทาง streaming ที่เข้ากันได้กับ Anthropic มีค่าเริ่มต้นเป็น `thinking: { type: "disabled" }` เว้นแต่คุณจะตั้งค่าการคิดอย่างชัดเจนใน model params หรือ request params วิธีนี้หลีกเลี่ยง delta ของ `reasoning_content` ที่รั่วจากรูปแบบ stream ที่ไม่ใช่ native Anthropic ของ M2.x MiniMax-M3 (และ M3.x) ได้รับการยกเว้น: M3 ส่งบล็อกการคิดของ Anthropic ที่ถูกต้องและคืนเนื้อหาว่างเมื่อปิดการคิด ดังนั้น OpenClaw จึงคง M3 ไว้บนเส้นทางการคิดแบบละไว้/adaptive ของผู้ให้บริการ
  - Z.AI (`zai/*`) เป็นแบบไบนารี (`on`/`off`) สำหรับโมเดล GLM ส่วนใหญ่ GLM-5.2 เป็นข้อยกเว้น: เปิดเผย `/think off|low|high|max`, แมป `low` และ `high` ไปยัง Z.AI `reasoning_effort: "high"` และแมป `max` ไปยัง `reasoning_effort: "max"`
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) คิดเสมอ โปรไฟล์ของมันเปิดเผยเฉพาะ `on` และ OpenClaw ละฟิลด์ `thinking` ขาออกตามที่ Moonshot ต้องการ โมเดล `moonshot/*` อื่น ๆ แมป `/think off` ไปยัง `thinking: { type: "disabled" }` และระดับที่ไม่ใช่ `off` ใด ๆ ไปยัง `thinking: { type: "enabled" }` เมื่อเปิดใช้การคิด Moonshot ยอมรับเฉพาะ `tool_choice` `auto|none`; OpenClaw ทำให้ค่าที่เข้ากันไม่ได้เป็น `auto`

## ลำดับการแก้ค่า

1. คำสั่งแบบ inline ในข้อความ (ใช้กับข้อความนั้นเท่านั้น)
2. การ override ของ session (ตั้งค่าโดยส่งข้อความที่มีเฉพาะคำสั่ง)
3. ค่าเริ่มต้นราย agent (`agents.list[].thinkingDefault` ใน config)
4. ค่าเริ่มต้นส่วนกลาง (`agents.defaults.thinkingDefault` ใน config)
5. ค่าย้อนกลับ: ค่าเริ่มต้นที่ผู้ให้บริการประกาศเมื่อมีให้ใช้ มิฉะนั้นโมเดลที่รองรับการให้เหตุผลจะแก้ค่าเป็น `medium` หรือระดับ non-`off` ที่รองรับใกล้ที่สุดสำหรับโมเดลนั้น และโมเดลที่ไม่รองรับการให้เหตุผลจะคงอยู่ที่ `off`

## การตั้งค่า session default

- ส่งข้อความที่เป็นคำสั่ง **เท่านั้น** (อนุญาตให้มีช่องว่าง) เช่น `/think:medium` หรือ `/t high`
- ค่านั้นจะคงอยู่สำหรับ session ปัจจุบัน (ค่าเริ่มต้นคือแยกตามผู้ส่ง) ใช้ `/think default` เพื่อล้างการ override ของ session และสืบทอดค่าเริ่มต้นจาก config/ผู้ให้บริการ; นามแฝงประกอบด้วย `inherit`, `clear`, `reset` และ `unpin`
- `/think off` จัดเก็บการ override แบบปิดอย่างชัดเจน ซึ่งปิดการคิดจนกว่าคุณจะเปลี่ยนหรือล้างการ override ของ session
- จะส่งคำตอบยืนยัน (`Thinking level set to high.` / `Thinking disabled.`) หากระดับไม่ถูกต้อง (เช่น `/thinking big`) คำสั่งจะถูกปฏิเสธพร้อมคำแนะนำ และสถานะ session จะไม่เปลี่ยนแปลง
- ส่ง `/think` (หรือ `/think:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับการคิดปัจจุบัน

## การใช้งานตาม agent

- **OpenClaw แบบฝังตัว**: ระดับที่แก้ค่าแล้วจะถูกส่งไปยัง runtime ของ OpenClaw agent ภายในโปรเซส
- **Claude CLI backend**: ระดับที่ไม่ใช่ off จะถูกส่งไปยัง Claude Code เป็น `--effort` เมื่อใช้ `claude-cli`; ดู [CLI backend](/th/gateway/cli-backends)

## โหมดเร็ว (/fast)

- ระดับ: `auto|on|off|default`
- ข้อความที่มีเฉพาะคำสั่งจะสลับการ override โหมดเร็วของ session และตอบกลับ `Fast mode set to auto.`, `Fast mode enabled.` หรือ `Fast mode disabled.` ใช้ `/fast default` เพื่อล้างการ override ของ session และสืบทอดค่าเริ่มต้นที่กำหนดค่าไว้; นามแฝงประกอบด้วย `inherit`, `clear`, `reset` และ `unpin`
- ส่ง `/fast` (หรือ `/fast status`) โดยไม่มีโหมดเพื่อดูสถานะโหมดเร็วที่มีผลอยู่ปัจจุบัน
- OpenClaw แก้ค่าโหมดเร็วตามลำดับนี้:
  1. การ override `/fast auto|on|off` แบบ inline/เฉพาะคำสั่ง (`/fast default` ล้างชั้นนี้)
  2. การ override ของ session
  3. ค่าเริ่มต้นราย agent (`agents.list[].fastModeDefault`)
  4. config รายโมเดล: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. ค่าย้อนกลับ: `off`
- `auto` คงโหมด session/config เป็น auto แต่จะแก้ค่าแต่ละการเรียกโมเดลใหม่แยกกัน การเรียกที่เริ่มก่อนจุดตัด auto จะเปิดใช้โหมดเร็ว; การเรียก retry, fallback, tool-result หรือ continuation ภายหลังจะเริ่มโดยปิดโหมดเร็ว จุดตัดมีค่าเริ่มต้นเป็น 60 วินาที; ตั้งค่า `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` บนโมเดลที่ใช้งานอยู่เพื่อเปลี่ยนค่า
- สำหรับ `openai/*` โหมดเร็วแมปไปยังการประมวลผลแบบ priority ของ OpenAI โดยส่ง `service_tier=priority` ในคำขอ Responses ที่รองรับ
- สำหรับโมเดล `openai/*` / `openai-codex/*` ที่ใช้ Codex เป็น backend โหมดเร็วจะส่งแฟล็ก `service_tier=priority` เดียวกันใน Codex Responses เทิร์นของ app-server แบบ native ของ Codex จะได้รับ tier เฉพาะใน `turn/start` หรือการเริ่ม/กลับมาใช้ thread ดังนั้น `auto` จึงไม่สามารถเปลี่ยน tier ของเทิร์น app-server ที่กำลังทำงานอยู่แล้วได้; มันจะใช้กับเทิร์นโมเดลถัดไปที่ OpenClaw เริ่ม
- สำหรับคำขอ `anthropic/*` สาธารณะโดยตรง รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย OAuth ที่ส่งไปยัง `api.anthropic.com` โหมดเร็วแมปไปยัง service tier ของ Anthropic: `/fast on` ตั้งค่า `service_tier=auto`, `/fast off` ตั้งค่า `service_tier=standard_only`
- สำหรับ `minimax/*` บนเส้นทางที่เข้ากันได้กับ Anthropic, `/fast on` (หรือ `params.fastMode: true`) เขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`
- Anthropic `serviceTier` / `service_tier` model params ที่ระบุชัดเจนจะ override ค่าเริ่มต้นของโหมดเร็วเมื่อทั้งสองถูกตั้งค่า OpenClaw ยังคงข้ามการฉีด service-tier ของ Anthropic สำหรับ URL ฐาน proxy ที่ไม่ใช่ Anthropic
- `/status` แสดง `Fast` เมื่อเปิดใช้โหมดเร็ว และ `Fast:auto` เมื่อโหมดที่กำหนดค่าไว้เป็น auto

## คำสั่ง verbose (/verbose หรือ /v)

- ระดับ: `on` (ขั้นต่ำ) | `full` | `off` (ค่าเริ่มต้น)
- ข้อความที่มีเฉพาะคำสั่งจะสลับ verbose ของ session และตอบกลับ `Verbose logging enabled.` / `Verbose logging disabled.`; ระดับที่ไม่ถูกต้องจะส่งคำแนะนำกลับโดยไม่เปลี่ยนสถานะ
- `/verbose off` จัดเก็บการ override ของ session แบบชัดเจน; ล้างผ่าน UI Sessions โดยเลือก `inherit`
- ผู้ส่งจากช่องทางภายนอกที่ได้รับอนุญาตอาจคงการ override verbose ของ session ไว้ได้ ไคลเอนต์ gateway/webchat ภายในต้องมี `operator.admin` จึงจะคงค่าไว้ได้
- คำสั่งแบบ inline มีผลเฉพาะกับข้อความนั้น มิฉะนั้นจะใช้ค่าเริ่มต้นของ session/ส่วนกลาง
- ส่ง `/verbose` (หรือ `/verbose:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับ verbose ปัจจุบัน
- เมื่อเปิด verbose agent ที่ส่งผลลัพธ์เครื่องมือแบบมีโครงสร้างจะส่งการเรียกเครื่องมือแต่ละครั้งกลับมาเป็นข้อความ metadata-only แยกต่างหาก โดยนำหน้าด้วย `<emoji> <tool-name>: <arg>` เมื่อมีให้ใช้ สรุปเครื่องมือเหล่านี้จะถูกส่งทันทีเมื่อแต่ละเครื่องมือเริ่มทำงาน (เป็นบับเบิลแยก) ไม่ใช่เป็น streaming deltas
- สรุปความล้มเหลวของเครื่องมือยังคงมองเห็นได้ในโหมดปกติ แต่ suffix รายละเอียดข้อผิดพลาดดิบจะถูกซ่อน เว้นแต่ verbose เป็น `full`
- เมื่อ verbose เป็น `full` เอาต์พุตของเครื่องมือจะถูกส่งต่อหลังเสร็จสิ้นด้วย (บับเบิลแยก ตัดให้มีความยาวที่ปลอดภัย) หากคุณสลับ `/verbose on|full|off` ระหว่างที่ run กำลังดำเนินอยู่ บับเบิลเครื่องมือถัดไปจะทำตามการตั้งค่าใหม่
- `agents.defaults.toolProgressDetail` ควบคุมรูปแบบของสรุปเครื่องมือ `/verbose` และบรรทัดเครื่องมือ progress-draft ใช้ `"explain"` (ค่าเริ่มต้น) สำหรับป้ายกำกับแบบมนุษย์ที่กระชับ เช่น `🛠️ Exec: checking JS syntax`; ใช้ `"raw"` เมื่อคุณต้องการให้แนบคำสั่ง/รายละเอียดดิบเพื่อการดีบักด้วย `agents.list[].toolProgressDetail` ราย agent จะ override ค่าเริ่มต้น
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## คำสั่ง trace ของ Plugin (/trace)

- ระดับ: `on` | `off` (ค่าเริ่มต้น)
- ข้อความที่มีเฉพาะคำสั่งจะสลับเอาต์พุต trace ของ Plugin ใน session และตอบกลับ `Plugin trace enabled.` / `Plugin trace disabled.`
- คำสั่งแบบ inline มีผลเฉพาะกับข้อความนั้น มิฉะนั้นจะใช้ค่าเริ่มต้นของ session/ส่วนกลาง
- ส่ง `/trace` (หรือ `/trace:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับ trace ปัจจุบัน
- `/trace` แคบกว่า `/verbose`: มันเปิดเผยเฉพาะบรรทัด trace/debug ที่ Plugin เป็นเจ้าของ เช่น สรุป debug ของ Active Memory
- บรรทัด trace อาจปรากฏใน `/status` และเป็นข้อความวินิจฉัยต่อท้ายหลังคำตอบปกติของ assistant

## การมองเห็นการให้เหตุผล (/reasoning)

- ระดับ: `on|off|stream`
- ข้อความที่มีเฉพาะคำสั่งจะสลับว่าจะแสดงบล็อกการคิดในคำตอบหรือไม่
- เมื่อเปิดใช้ การให้เหตุผลจะถูกส่งเป็น **ข้อความแยกต่างหาก** ที่นำหน้าด้วย `Thinking`
- `stream`: stream การให้เหตุผลระหว่างที่กำลังสร้างคำตอบ เมื่อช่องทางที่ใช้งานอยู่รองรับตัวอย่างการให้เหตุผล จากนั้นส่งคำตอบสุดท้ายโดยไม่มีการให้เหตุผล
- นามแฝง: `/reason`
- ส่ง `/reasoning` (หรือ `/reasoning:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับการให้เหตุผลปัจจุบัน
- ลำดับการแก้ค่า: คำสั่งแบบ inline จากนั้นการ override ของ session จากนั้นค่าเริ่มต้นราย agent (`agents.list[].reasoningDefault`) จากนั้นค่าเริ่มต้นส่วนกลาง (`agents.defaults.reasoningDefault`) จากนั้นค่าย้อนกลับ (`off`)

แท็กการให้เหตุผลของโมเดลภายในเครื่องที่ผิดรูปแบบจะถูกจัดการอย่างระมัดระวัง บล็อก `<think>...</think>` ที่ปิดแล้วจะยังคงถูกซ่อนไว้ในการตอบกลับปกติ และการให้เหตุผลที่ไม่ได้ปิดหลังจากข้อความที่มองเห็นแล้วก็จะถูกซ่อนไว้ด้วย หากการตอบกลับถูกครอบทั้งหมดด้วยแท็กเปิดที่ไม่ได้ปิดเพียงแท็กเดียว และมิฉะนั้นจะถูกส่งเป็นข้อความว่าง OpenClaw จะลบแท็กเปิดที่ผิดรูปแบบนั้นออกและส่งข้อความที่เหลือ

## ที่เกี่ยวข้อง

- เอกสารโหมดสิทธิ์ยกระดับอยู่ใน [โหมดสิทธิ์ยกระดับ](/th/tools/elevated)

## Heartbeats

- เนื้อหาการตรวจสอบ Heartbeat คือพรอมป์ Heartbeat ที่กำหนดค่าไว้ (ค่าเริ่มต้น: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`) คำสั่งแบบอินไลน์ในข้อความ Heartbeat จะมีผลตามปกติ (แต่หลีกเลี่ยงการเปลี่ยนค่าเริ่มต้นของเซสชันจาก Heartbeats)
- การส่ง Heartbeat มีค่าเริ่มต้นเป็นเพย์โหลดสุดท้ายเท่านั้น หากต้องการส่งข้อความ `Thinking` แยกต่างหากด้วย (เมื่อมี) ให้ตั้งค่า `agents.defaults.heartbeat.includeReasoning: true` หรือ `agents.list[].heartbeat.includeReasoning: true` รายเอเจนต์

## UI เว็บแชท

- ตัวเลือกการคิดของเว็บแชทจะสะท้อนระดับที่จัดเก็บไว้ของเซสชันจากที่เก็บ/การกำหนดค่าเซสชันขาเข้าเมื่อโหลดหน้า
- การเลือกระดับอื่นจะเขียนการแทนที่ของเซสชันทันทีผ่าน `sessions.patch`; ไม่รอการส่งครั้งถัดไป และไม่ใช่การแทนที่แบบใช้ครั้งเดียว `thinkingOnce`
- ตัวเลือกแรกเป็นตัวเลือกล้างการแทนที่เสมอ โดยแสดง `Inherited: <resolved level>` รวมถึง `Inherited: Off` เมื่อการคิดที่สืบทอดมาถูกปิดใช้งาน
- ตัวเลือกที่เลือกอย่างชัดเจนจะใช้ป้ายชื่อระดับโดยตรง พร้อมคงป้ายชื่อของผู้ให้บริการไว้เมื่อมีอยู่ (เช่น `Maximum` สำหรับตัวเลือก `max` ที่มีป้ายชื่อจากผู้ให้บริการ)
- ตัวเลือกนี้ใช้ `thinkingLevels` ที่ส่งกลับโดยแถว/ค่าเริ่มต้นของเซสชัน Gateway โดยยังคง `thinkingOptions` ไว้เป็นรายการป้ายชื่อเดิม UI เบราว์เซอร์ไม่ได้เก็บรายการ regex ของผู้ให้บริการเอง; Plugins เป็นเจ้าของชุดระดับเฉพาะโมเดล
- `/think:<level>` ยังใช้งานได้และอัปเดตระดับเซสชันที่จัดเก็บเดียวกัน ดังนั้นคำสั่งแชทและตัวเลือกจึงซิงค์กันอยู่เสมอ

## โปรไฟล์ผู้ให้บริการ

- Plugins ผู้ให้บริการสามารถเปิดเผย `resolveThinkingProfile(ctx)` เพื่อกำหนดระดับที่โมเดลรองรับและค่าเริ่มต้น
- Plugins ผู้ให้บริการที่พร็อกซีโมเดล Claude ควรใช้ `resolveClaudeThinkingProfile(modelId)` จาก `openclaw/plugin-sdk/provider-model-shared` ซ้ำ เพื่อให้แค็ตตาล็อก Anthropic โดยตรงและแค็ตตาล็อกพร็อกซีสอดคล้องกัน
- ระดับโปรไฟล์แต่ละระดับมี `id` มาตรฐานที่จัดเก็บไว้ (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, หรือ `max`) และอาจมี `label` สำหรับแสดงผล ผู้ให้บริการแบบไบนารีใช้ `{ id: "low", label: "on" }`
- ฮุกโปรไฟล์จะได้รับข้อมูลแค็ตตาล็อกที่ผสานแล้วเมื่อมี รวมถึง `reasoning`, `compat.thinkingFormat` และ `compat.supportedReasoningEfforts` ใช้ข้อมูลเหล่านี้เพื่อเปิดเผยโปรไฟล์แบบไบนารีหรือแบบกำหนดเองเฉพาะเมื่อสัญญาคำขอที่กำหนดค่ารองรับเพย์โหลดที่ตรงกัน
- Tool plugins ที่ต้องตรวจสอบการแทนที่การคิดอย่างชัดเจนควรใช้ `api.runtime.agent.resolveThinkingPolicy({ provider, model })` ร่วมกับ `api.runtime.agent.normalizeThinkingLevel(...)`; ไม่ควรเก็บรายการระดับผู้ให้บริการ/โมเดลของตนเอง
- Tool plugins ที่เข้าถึงเมทาดาทาโมเดลแบบกำหนดเองที่กำหนดค่าไว้สามารถส่ง `catalog` เข้าไปใน `resolveThinkingPolicy` เพื่อให้การเลือกใช้ `compat.supportedReasoningEfforts` สะท้อนในการตรวจสอบฝั่ง Plugin
- ฮุกเดิมที่เผยแพร่แล้ว (`supportsXHighThinking`, `isBinaryThinking` และ `resolveDefaultThinkingLevel`) ยังคงอยู่ในฐานะอะแดปเตอร์ความเข้ากันได้ แต่ชุดระดับแบบกำหนดเองใหม่ควรใช้ `resolveThinkingProfile`
- แถว/ค่าเริ่มต้นของ Gateway เปิดเผย `thinkingLevels`, `thinkingOptions` และ `thinkingDefault` เพื่อให้ไคลเอนต์ ACP/แชทแสดงผล id และป้ายชื่อโปรไฟล์เดียวกับที่การตรวจสอบรันไทม์ใช้
