---
read_when:
    - การปรับการแยกวิเคราะห์หรือค่าเริ่มต้นของคำสั่ง thinking, fast-mode หรือ verbose
summary: ไวยากรณ์ของคำสั่ง directive สำหรับ /think, /fast, /verbose, /trace และการมองเห็นการให้เหตุผล
title: ระดับการคิด
x-i18n:
    generated_at: "2026-06-27T18:32:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cea488a92c6d2a5371dbe0488199f41a56b44616a2936b077644f8a8324e8129
    source_path: tools/thinking.md
    workflow: 16
---

## ทำอะไรได้บ้าง

- คำสั่งแบบอินไลน์ในเนื้อหาขาเข้าทุกแบบ: `/t <level>`, `/think:<level>` หรือ `/thinking <level>`
- ระดับ (นามแฝง): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "คิด"
  - low → "คิดให้หนัก"
  - medium → "คิดให้หนักขึ้น"
  - high → "ultrathink" (งบสูงสุด)
  - xhigh → "ultrathink+" (โมเดล GPT-5.2+ และ Codex รวมถึง effort ของ Anthropic Claude Opus 4.7+)
  - adaptive → การคิดแบบปรับตัวที่จัดการโดยผู้ให้บริการ (รองรับสำหรับ Claude 4.6 บน Anthropic/Bedrock, Anthropic Claude Opus 4.7+ และการคิดแบบไดนามิกของ Google Gemini)
  - max → การให้เหตุผลสูงสุดของผู้ให้บริการ (Anthropic Claude Opus 4.7+; Ollama จะแมปค่านี้ไปยัง effort `think` แบบเนทีฟที่สูงที่สุด)
  - `x-high`, `x_high`, `extra-high`, `extra high` และ `extra_high` จะแมปไปที่ `xhigh`
  - `highest` จะแมปไปที่ `high`
- หมายเหตุสำหรับผู้ให้บริการ:
  - เมนูและตัวเลือกการคิดขับเคลื่อนด้วยโปรไฟล์ผู้ให้บริการ Plugin ผู้ให้บริการประกาศชุดระดับที่แน่นอนสำหรับโมเดลที่เลือก รวมถึงป้ายกำกับอย่าง `on` แบบไบนารี
  - `adaptive`, `xhigh` และ `max` จะแสดงเฉพาะสำหรับโปรไฟล์ผู้ให้บริการ/โมเดลที่รองรับเท่านั้น คำสั่งแบบพิมพ์สำหรับระดับที่ไม่รองรับจะถูกปฏิเสธพร้อมตัวเลือกที่ถูกต้องของโมเดลนั้น
  - ระดับที่เก็บไว้เดิมแต่ไม่รองรับจะถูกแมปใหม่ตามลำดับชั้นของโปรไฟล์ผู้ให้บริการ `adaptive` จะถอยกลับเป็น `medium` บนโมเดลที่ไม่ใช่ adaptive ส่วน `xhigh` และ `max` จะถอยกลับเป็นระดับที่รองรับสูงที่สุดซึ่งไม่ใช่ `off` สำหรับโมเดลที่เลือก
  - โมเดล Anthropic Claude 4.6 ใช้ค่าเริ่มต้นเป็น `adaptive` เมื่อไม่ได้ตั้งระดับการคิดไว้อย่างชัดเจน
  - Anthropic Claude Opus 4.8 และ Opus 4.7 จะปิดการคิดไว้ เว้นแต่คุณจะตั้งระดับการคิดอย่างชัดเจน ค่าเริ่มต้น effort ที่ผู้ให้บริการเป็นเจ้าของของ Opus 4.8 คือ `high` หลังจากเปิดใช้การคิดแบบ adaptive
  - Anthropic Claude Opus 4.7+ แมป `/think xhigh` ไปยังการคิดแบบ adaptive พร้อม `output_config.effort: "xhigh"` เพราะ `/think` เป็นคำสั่งการคิด และ `xhigh` เป็นการตั้งค่า effort ของ Opus
  - Anthropic Claude Opus 4.7+ ยังเปิดให้ใช้ `/think max`; โดยจะแมปไปยังเส้นทาง effort สูงสุดที่ผู้ให้บริการเป็นเจ้าของเดียวกัน
  - โมเดล Direct DeepSeek V4 เปิดให้ใช้ `/think xhigh|max`; ทั้งสองจะแมปไปยัง DeepSeek `reasoning_effort: "max"` ส่วนระดับที่ต่ำกว่าและไม่ใช่ off จะแมปไปยัง `high`
  - โมเดล DeepSeek V4 ที่ส่งผ่าน OpenRouter เปิดให้ใช้ `/think xhigh` และส่งค่า `reasoning_effort` ที่ OpenRouter รองรับ ค่า override `max` ที่เก็บไว้จะถอยกลับเป็น `xhigh`
  - โมเดล Ollama ที่รองรับการคิดเปิดให้ใช้ `/think low|medium|high|max`; `max` จะแมปไปยัง `think: "high"` แบบเนทีฟ เพราะ API เนทีฟของ Ollama รับสตริง effort `low`, `medium` และ `high`
  - โมเดล OpenAI GPT แมป `/think` ผ่านการรองรับ effort ของ Responses API เฉพาะโมเดล `/think off` จะส่ง `reasoning.effort: "none"` เฉพาะเมื่อโมเดลเป้าหมายรองรับเท่านั้น มิฉะนั้น OpenClaw จะละเว้น payload การให้เหตุผลที่ปิดไว้แทนการส่งค่าที่ไม่รองรับ
  - รายการแค็ตตาล็อกที่เข้ากันได้กับ OpenAI แบบกำหนดเองสามารถเลือกใช้ `/think xhigh` ได้โดยตั้งค่า `models.providers.<provider>.models[].compat.supportedReasoningEfforts` ให้รวม `"xhigh"` ไว้ด้วย ค่านี้ใช้ metadata ความเข้ากันได้เดียวกันกับที่แมป payload effort การให้เหตุผลของ OpenAI ขาออก ดังนั้นเมนู การตรวจสอบเซสชัน agent CLI และ `llm-task` จะสอดคล้องกับพฤติกรรมของการส่งข้อมูล
  - การอ้างอิง OpenRouter Hunter Alpha ที่ตั้งค่าไว้และล้าสมัยจะข้ามการฉีดการให้เหตุผลผ่านพร็อกซี เพราะเส้นทางที่เลิกใช้แล้วนั้นอาจส่งข้อความคำตอบสุดท้ายผ่านฟิลด์การให้เหตุผล
  - Google Gemini แมป `/think adaptive` ไปยังการคิดแบบไดนามิกที่ผู้ให้บริการเป็นเจ้าของของ Gemini คำขอ Gemini 3 จะละเว้น `thinkingLevel` แบบคงที่ ส่วนคำขอ Gemini 2.5 จะส่ง `thinkingBudget: -1`; ระดับคงที่จะยังแมปไปยัง `thinkingLevel` หรือ budget ของ Gemini ที่ใกล้ที่สุดสำหรับตระกูลโมเดลนั้น
  - MiniMax M2.x (`minimax/MiniMax-M2*`) บนเส้นทางสตรีมมิงที่เข้ากันได้กับ Anthropic ใช้ค่าเริ่มต้นเป็น `thinking: { type: "disabled" }` เว้นแต่คุณจะตั้งค่าการคิดอย่างชัดเจนในพารามิเตอร์โมเดลหรือพารามิเตอร์คำขอ วิธีนี้หลีกเลี่ยงเดลตา `reasoning_content` ที่รั่วจากรูปแบบสตรีม Anthropic ที่ไม่ใช่เนทีฟของ M2.x MiniMax-M3 (และ M3.x) ได้รับการยกเว้น: M3 ปล่อยบล็อกการคิด Anthropic ที่ถูกต้องและคืนเนื้อหาว่างเมื่อปิดการคิด ดังนั้น OpenClaw จะคง M3 ไว้บนเส้นทางการคิดแบบละเว้น/adaptive ของผู้ให้บริการ
  - Z.AI (`zai/*`) เป็นแบบไบนารี (`on`/`off`) สำหรับโมเดล GLM ส่วนใหญ่ GLM-5.2 เป็นข้อยกเว้น: เปิดให้ใช้ `/think off|low|high|max`, แมป `low` และ `high` ไปยัง Z.AI `reasoning_effort: "high"` และแมป `max` ไปยัง `reasoning_effort: "max"`
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) คิดเสมอ โปรไฟล์ของโมเดลนี้เปิดให้ใช้เฉพาะ `on` และ OpenClaw จะละเว้นฟิลด์ `thinking` ขาออกตามที่ Moonshot กำหนด โมเดล `moonshot/*` อื่นจะแมป `/think off` ไปยัง `thinking: { type: "disabled" }` และระดับใดก็ตามที่ไม่ใช่ `off` ไปยัง `thinking: { type: "enabled" }` เมื่อเปิดใช้การคิด Moonshot รับเฉพาะ `tool_choice` `auto|none`; OpenClaw จะทำให้ค่าที่เข้ากันไม่ได้เป็น `auto`

## ลำดับการตัดสินค่า

1. คำสั่งแบบอินไลน์บนข้อความ (มีผลเฉพาะข้อความนั้น)
2. ค่า override ของเซสชัน (ตั้งโดยส่งข้อความที่มีเฉพาะคำสั่ง)
3. ค่าเริ่มต้นราย agent (`agents.list[].thinkingDefault` ใน config)
4. ค่าเริ่มต้นส่วนกลาง (`agents.defaults.thinkingDefault` ใน config)
5. ค่าถอยกลับ: ค่าเริ่มต้นที่ผู้ให้บริการประกาศไว้เมื่อมี มิฉะนั้นโมเดลที่รองรับการให้เหตุผลจะตัดสินเป็น `medium` หรือระดับที่รองรับใกล้ที่สุดซึ่งไม่ใช่ `off` สำหรับโมเดลนั้น และโมเดลที่ไม่รองรับการให้เหตุผลจะคงเป็น `off`

## การตั้งค่าเริ่มต้นของเซสชัน

- ส่งข้อความที่เป็น **เฉพาะ** คำสั่ง (อนุญาตช่องว่างได้) เช่น `/think:medium` หรือ `/t high`
- ค่านั้นจะติดกับเซสชันปัจจุบัน (ค่าเริ่มต้นคือแยกตามผู้ส่ง) ใช้ `/think default` เพื่อล้างค่า override ของเซสชันและสืบทอดค่าเริ่มต้นจาก config/ผู้ให้บริการ; นามแฝงรวมถึง `inherit`, `clear`, `reset` และ `unpin`
- `/think off` จะเก็บค่า override แบบปิดอย่างชัดเจน โดยปิดการคิดจนกว่าคุณจะเปลี่ยนหรือล้างค่า override ของเซสชัน
- จะมีการส่งข้อความยืนยัน (`Thinking level set to high.` / `Thinking disabled.`) หากระดับไม่ถูกต้อง (เช่น `/thinking big`) คำสั่งจะถูกปฏิเสธพร้อมคำแนะนำ และสถานะเซสชันจะไม่เปลี่ยนแปลง
- ส่ง `/think` (หรือ `/think:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับการคิดปัจจุบัน

## การใช้งานตาม agent

- **OpenClaw แบบฝังตัว**: ระดับที่ตัดสินแล้วจะถูกส่งไปยังรันไทม์ agent ของ OpenClaw ในโปรเซส
- **แบ็กเอนด์ Claude CLI**: ระดับที่ไม่ใช่ off จะถูกส่งไปยัง Claude Code เป็น `--effort` เมื่อใช้ `claude-cli`; ดู [แบ็กเอนด์ CLI](/th/gateway/cli-backends)

## โหมดเร็ว (/fast)

- ระดับ: `auto|on|off|default`
- ข้อความที่มีเฉพาะคำสั่งจะสลับค่า override โหมดเร็วของเซสชันและตอบกลับ `Fast mode set to auto.`, `Fast mode enabled.` หรือ `Fast mode disabled.` ใช้ `/fast default` เพื่อล้างค่า override ของเซสชันและสืบทอดค่าเริ่มต้นที่กำหนดไว้; นามแฝงรวมถึง `inherit`, `clear`, `reset` และ `unpin`
- ส่ง `/fast` (หรือ `/fast status`) โดยไม่มีโหมดเพื่อดูสถานะโหมดเร็วที่มีผลอยู่ปัจจุบัน
- OpenClaw ตัดสินโหมดเร็วตามลำดับนี้:
  1. ค่า override `/fast auto|on|off` แบบอินไลน์/เฉพาะคำสั่ง (`/fast default` ล้างชั้นนี้)
  2. ค่า override ของเซสชัน
  3. ค่าเริ่มต้นราย agent (`agents.list[].fastModeDefault`)
  4. config รายโมเดล: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. ค่าถอยกลับ: `off`
- `auto` จะคงโหมดเซสชัน/config เป็น auto แต่ตัดสินการเรียกโมเดลใหม่แต่ละครั้งแยกกัน การเรียกที่เริ่มก่อนจุดตัด auto จะเปิดใช้โหมดเร็ว; การลองใหม่ ค่าถอยกลับ ผลลัพธ์จากเครื่องมือ หรือการเรียกต่อเนื่องภายหลังจะเริ่มโดยปิดโหมดเร็ว จุดตัดมีค่าเริ่มต้นที่ 60 วินาที; ตั้ง `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` บนโมเดลที่ใช้งานอยู่เพื่อเปลี่ยนค่านี้
- สำหรับ `openai/*` โหมดเร็วแมปไปยังการประมวลผลลำดับความสำคัญของ OpenAI โดยส่ง `service_tier=priority` บนคำขอ Responses ที่รองรับ
- สำหรับโมเดล `openai/*` / `openai-codex/*` ที่ใช้ Codex หนุนหลัง โหมดเร็วจะส่งแฟล็ก `service_tier=priority` เดียวกันบน Codex Responses เทิร์น app-server ของ Codex แบบเนทีฟจะได้รับ tier เฉพาะบน `turn/start` หรือการเริ่ม/กลับมาเธรดเท่านั้น ดังนั้น `auto` จึงไม่สามารถเปลี่ยน tier ให้เทิร์น app-server ที่กำลังรันอยู่แล้วได้; จะมีผลกับเทิร์นโมเดลถัดไปที่ OpenClaw เริ่ม
- สำหรับคำขอ `anthropic/*` สาธารณะโดยตรง รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย OAuth ซึ่งส่งไปยัง `api.anthropic.com` โหมดเร็วแมปไปยัง service tier ของ Anthropic: `/fast on` ตั้งค่า `service_tier=auto`, `/fast off` ตั้งค่า `service_tier=standard_only`
- สำหรับ `minimax/*` บนเส้นทางที่เข้ากันได้กับ Anthropic, `/fast on` (หรือ `params.fastMode: true`) จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`
- พารามิเตอร์โมเดล Anthropic `serviceTier` / `service_tier` ที่ตั้งอย่างชัดเจนจะ override ค่าเริ่มต้นของโหมดเร็วเมื่อมีการตั้งทั้งคู่ OpenClaw ยังคงข้ามการฉีด service-tier ของ Anthropic สำหรับ URL ฐานพร็อกซีที่ไม่ใช่ Anthropic
- `/status` แสดง `Fast` เมื่อเปิดใช้โหมดเร็ว และ `Fast:auto` เมื่อโหมดที่กำหนดไว้เป็น auto

## คำสั่ง verbose (/verbose หรือ /v)

- ระดับ: `on` (น้อยที่สุด) | `full` | `off` (ค่าเริ่มต้น)
- ข้อความที่มีเฉพาะคำสั่งจะสลับ verbose ของเซสชันและตอบกลับ `Verbose logging enabled.` / `Verbose logging disabled.`; ระดับที่ไม่ถูกต้องจะคืนคำแนะนำโดยไม่เปลี่ยนสถานะ
- `/verbose off` จะเก็บค่า override ของเซสชันแบบชัดเจน; ล้างผ่าน UI เซสชันโดยเลือก `inherit`
- ผู้ส่งจากช่องทางภายนอกที่ได้รับอนุญาตอาจคงค่า override verbose ของเซสชันไว้ได้ ไคลเอนต์ Gateway/webchat ภายในต้องมี `operator.admin` เพื่อคงค่านี้
- คำสั่งแบบอินไลน์มีผลเฉพาะข้อความนั้น; มิฉะนั้นจะใช้ค่าเริ่มต้นของเซสชัน/ส่วนกลาง
- ส่ง `/verbose` (หรือ `/verbose:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับ verbose ปัจจุบัน
- เมื่อเปิด verbose, agent ที่ปล่อยผลลัพธ์เครื่องมือแบบมีโครงสร้างจะส่งแต่ละการเรียกเครื่องมือกลับเป็นข้อความ metadata-only ของตัวเอง นำหน้าด้วย `<emoji> <tool-name>: <arg>` เมื่อมี สรุปเครื่องมือเหล่านี้จะถูกส่งทันทีที่แต่ละเครื่องมือเริ่ม (เป็นบับเบิลแยก) ไม่ใช่เป็นเดลตาสตรีมมิง
- สรุปความล้มเหลวของเครื่องมือยังคงมองเห็นในโหมดปกติ แต่ suffix รายละเอียดข้อผิดพลาดดิบจะถูกซ่อนไว้ เว้นแต่ verbose เป็น `full`
- เมื่อ verbose เป็น `full` เอาต์พุตเครื่องมือจะถูกส่งต่อหลังเสร็จสิ้นด้วย (บับเบิลแยก ถูกตัดให้มีความยาวปลอดภัย) หากคุณสลับ `/verbose on|full|off` ขณะที่รันกำลังดำเนินอยู่ บับเบิลเครื่องมือถัดไปจะเคารพการตั้งค่าใหม่
- `agents.defaults.toolProgressDetail` ควบคุมรูปแบบของสรุปเครื่องมือ `/verbose` และบรรทัดเครื่องมือใน progress-draft ใช้ `"explain"` (ค่าเริ่มต้น) สำหรับป้ายกำกับมนุษย์แบบกระชับ เช่น `🛠️ Exec: checking JS syntax`; ใช้ `"raw"` เมื่อคุณต้องการแนบคำสั่ง/รายละเอียดดิบเพื่อดีบักด้วย `agents.list[].toolProgressDetail` ราย agent จะ override ค่าเริ่มต้น
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## คำสั่ง trace ของ Plugin (/trace)

- ระดับ: `on` | `off` (ค่าเริ่มต้น)
- ข้อความที่มีเฉพาะคำสั่งจะสลับเอาต์พุต trace ของ Plugin ในเซสชันและตอบกลับ `Plugin trace enabled.` / `Plugin trace disabled.`
- คำสั่งแบบอินไลน์มีผลเฉพาะข้อความนั้น; มิฉะนั้นจะใช้ค่าเริ่มต้นของเซสชัน/ส่วนกลาง
- ส่ง `/trace` (หรือ `/trace:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับ trace ปัจจุบัน
- `/trace` แคบกว่า `/verbose`: เปิดเผยเฉพาะบรรทัด trace/debug ที่ Plugin เป็นเจ้าของ เช่น สรุป debug ของ Active Memory
- บรรทัด trace อาจปรากฏใน `/status` และเป็นข้อความวินิจฉัยติดตามหลังคำตอบปกติของผู้ช่วย

## การมองเห็นการให้เหตุผล (/reasoning)

- ระดับ: `on|off|stream`
- ข้อความที่มีเฉพาะคำสั่งจะสลับว่าจะแสดงบล็อกการคิดในคำตอบหรือไม่
- เมื่อเปิดใช้ การให้เหตุผลจะถูกส่งเป็น **ข้อความแยกต่างหาก** ที่ขึ้นต้นด้วย `Thinking`
- `stream`: สตรีมการให้เหตุผลระหว่างที่กำลังสร้างคำตอบ เมื่อช่องทางที่ใช้งานอยู่รองรับตัวอย่างการให้เหตุผล แล้วจึงส่งคำตอบสุดท้ายโดยไม่มีการให้เหตุผล
- นามแฝง: `/reason`
- ส่ง `/reasoning` (หรือ `/reasoning:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับการให้เหตุผลปัจจุบัน
- ลำดับการตัดสินค่า: คำสั่งแบบอินไลน์ จากนั้นค่า override ของเซสชัน จากนั้นค่าเริ่มต้นราย agent (`agents.list[].reasoningDefault`) จากนั้นค่าเริ่มต้นส่วนกลาง (`agents.defaults.reasoningDefault`) จากนั้นค่าถอยกลับ (`off`)

OpenClaw จัดการแท็ก reasoning ของโมเดลในเครื่องที่มีรูปแบบผิดอย่างระมัดระวัง บล็อก `<think>...</think>` ที่ปิดแล้วจะยังถูกซ่อนไว้ในการตอบกลับปกติ และ reasoning ที่ไม่ได้ปิดหลังจากมีข้อความที่มองเห็นแล้วก็จะถูกซ่อนไว้ด้วย หากการตอบกลับถูกครอบทั้งหมดด้วยแท็กเปิดที่ไม่ได้ปิดเพียงแท็กเดียวและมิฉะนั้นจะส่งเป็นข้อความว่าง OpenClaw จะลบแท็กเปิดที่มีรูปแบบผิดออกและส่งข้อความที่เหลือ

## ที่เกี่ยวข้อง

- เอกสารโหมดสิทธิ์สูงอยู่ใน [โหมดสิทธิ์สูง](/th/tools/elevated)

## Heartbeats

- เนื้อหา probe ของ Heartbeat คือพรอมป์ heartbeat ที่กำหนดค่าไว้ (ค่าเริ่มต้น: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`) คำสั่งแบบ inline ในข้อความ heartbeat จะมีผลตามปกติ (แต่หลีกเลี่ยงการเปลี่ยนค่าเริ่มต้นของเซสชันจาก heartbeats)
- การส่ง Heartbeat มีค่าเริ่มต้นเป็นเฉพาะ payload สุดท้ายเท่านั้น หากต้องการส่งข้อความ `Thinking` แยกต่างหากด้วย (เมื่อมี) ให้ตั้งค่า `agents.defaults.heartbeat.includeReasoning: true` หรือ `agents.list[].heartbeat.includeReasoning: true` ราย agent

## UI แชตบนเว็บ

- ตัวเลือก thinking ของแชตบนเว็บจะสะท้อนระดับที่จัดเก็บไว้ของเซสชันจาก session store/config ขาเข้าเมื่อโหลดหน้า
- การเลือกระดับอื่นจะเขียน session override ทันทีผ่าน `sessions.patch`; ไม่ต้องรอการส่งครั้งถัดไป และไม่ใช่ override แบบครั้งเดียว `thinkingOnce`
- ตัวเลือกแรกเป็นตัวเลือกเพื่อล้าง override เสมอ โดยจะแสดง `Inherited: <resolved level>` รวมถึง `Inherited: Off` เมื่อ thinking ที่สืบทอดมาถูกปิดใช้งาน
- ตัวเลือกใน picker ที่ระบุชัดเจนจะใช้ป้ายระดับโดยตรง พร้อมคงป้ายของ provider ไว้เมื่อมี (เช่น `Maximum` สำหรับตัวเลือก `max` ที่มีป้ายจาก provider)
- picker ใช้ `thinkingLevels` ที่ส่งกลับจากแถว/defaults ของเซสชัน Gateway โดยเก็บ `thinkingOptions` ไว้เป็นรายการป้ายแบบ legacy UI ของเบราว์เซอร์จะไม่เก็บรายการ regex ของ provider เอง; plugins เป็นเจ้าของชุดระดับเฉพาะของโมเดล
- `/think:<level>` ยังทำงานและอัปเดตระดับเซสชันที่จัดเก็บเดียวกัน ดังนั้นคำสั่งในแชตและ picker จึงซิงก์กันอยู่เสมอ

## โปรไฟล์ Provider

- Provider plugins สามารถเปิดเผย `resolveThinkingProfile(ctx)` เพื่อกำหนดระดับที่โมเดลรองรับและค่าเริ่มต้น
- Provider plugins ที่ proxy โมเดล Claude ควรใช้ `resolveClaudeThinkingProfile(modelId)` จาก `openclaw/plugin-sdk/provider-model-shared` ซ้ำ เพื่อให้แคตตาล็อกของ Anthropic โดยตรงและ proxy สอดคล้องกัน
- แต่ละระดับของโปรไฟล์มี `id` canonical ที่จัดเก็บไว้ (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, หรือ `max`) และอาจมี `label` สำหรับแสดงผล Provider แบบไบนารีใช้ `{ id: "low", label: "on" }`
- profile hooks จะได้รับข้อเท็จจริงของแคตตาล็อกที่รวมแล้วเมื่อมี รวมถึง `reasoning`, `compat.thinkingFormat`, และ `compat.supportedReasoningEfforts` ใช้ข้อเท็จจริงเหล่านั้นเพื่อเปิดเผยโปรไฟล์แบบไบนารีหรือแบบกำหนดเองเฉพาะเมื่อสัญญาคำขอที่กำหนดค่าไว้รองรับ payload ที่ตรงกัน
- Tool plugins ที่ต้องตรวจสอบ thinking override แบบชัดเจนควรใช้ `api.runtime.agent.resolveThinkingPolicy({ provider, model })` ร่วมกับ `api.runtime.agent.normalizeThinkingLevel(...)`; ไม่ควรเก็บรายการระดับของ provider/model เอง
- Tool plugins ที่เข้าถึง metadata ของโมเดลกำหนดเองที่ตั้งค่าไว้ได้สามารถส่ง `catalog` เข้าไปใน `resolveThinkingPolicy` เพื่อให้ opt-ins ของ `compat.supportedReasoningEfforts` สะท้อนในการตรวจสอบฝั่ง plugin
- hooks แบบ legacy ที่เผยแพร่แล้ว (`supportsXHighThinking`, `isBinaryThinking`, และ `resolveDefaultThinkingLevel`) ยังคงอยู่เป็น adapters เพื่อความเข้ากันได้ แต่ชุดระดับแบบกำหนดเองใหม่ควรใช้ `resolveThinkingProfile`
- แถว/defaults ของ Gateway เปิดเผย `thinkingLevels`, `thinkingOptions`, และ `thinkingDefault` เพื่อให้ไคลเอนต์ ACP/chat แสดง ids และป้ายของโปรไฟล์เดียวกับที่การตรวจสอบ runtime ใช้
