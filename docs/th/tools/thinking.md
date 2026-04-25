---
read_when:
    - การปรับการแยกวิเคราะห์ directive หรือค่าเริ่มต้นของโหมดคิด โหมดเร็ว หรือโหมดละเอียด
summary: ไวยากรณ์ Directive สำหรับ /think, /fast, /verbose, /trace และการมองเห็น reasoning
title: ระดับการคิด
x-i18n:
    generated_at: "2026-04-25T14:01:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0537f10d3dd3251ac41590bebd2d83ba8b2562725c322040b20f32547c8af88d
    source_path: tools/thinking.md
    workflow: 15
---

## สิ่งที่ทำได้

- Directive แบบ inline ในเนื้อหาขาเข้าใด ๆ: `/t <level>`, `/think:<level>` หรือ `/thinking <level>`
- ระดับต่าง ๆ (aliases): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (งบประมาณสูงสุด)
  - xhigh → “ultrathink+” (โมเดล GPT-5.2+ และ Codex รวมถึง effort ของ Anthropic Claude Opus 4.7)
  - adaptive → การคิดแบบ adaptive ที่ provider จัดการเอง (รองรับสำหรับ Claude 4.6 บน Anthropic/Bedrock, Anthropic Claude Opus 4.7 และ dynamic thinking ของ Google Gemini)
  - max → reasoning สูงสุดของ provider (ปัจจุบันคือ Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` และ `extra_high` จะถูกจับคู่เป็น `xhigh`
  - `highest` จะถูกจับคู่เป็น `high`
- หมายเหตุเกี่ยวกับ provider:
  - เมนูและตัวเลือก thinking ขับเคลื่อนด้วยโปรไฟล์ของ provider provider plugins จะประกาศชุดระดับที่แน่นอนสำหรับโมเดลที่เลือก รวมถึงป้ายกำกับ เช่น `on` แบบไบนารี
  - `adaptive`, `xhigh` และ `max` จะถูกประกาศเฉพาะสำหรับโปรไฟล์ provider/model ที่รองรับเท่านั้น Directive แบบพิมพ์สำหรับระดับที่ไม่รองรับจะถูกปฏิเสธพร้อมตัวเลือกที่ใช้ได้ของโมเดลนั้น
  - ระดับที่ไม่รองรับซึ่งถูกเก็บไว้อยู่ก่อนแล้วจะถูก remap ตามลำดับอันดับของโปรไฟล์ provider `adaptive` จะ fallback ไปเป็น `medium` บนโมเดลที่ไม่รองรับ adaptive ส่วน `xhigh` และ `max` จะ fallback ไปเป็นระดับที่ใหญ่ที่สุดที่ไม่ใช่ `off` และรองรับโดยโมเดลที่เลือก
  - โมเดล Anthropic Claude 4.6 ใช้ค่าเริ่มต้นเป็น `adaptive` เมื่อไม่ได้ตั้งค่าระดับ thinking อย่างชัดเจน
  - Anthropic Claude Opus 4.7 ไม่ใช้ adaptive thinking เป็นค่าเริ่มต้น ค่า effort เริ่มต้นของ API ยังคงให้ provider เป็นผู้กำหนด เว้นแต่คุณจะตั้งค่าระดับ thinking อย่างชัดเจน
  - Anthropic Claude Opus 4.7 จับคู่ `/think xhigh` ไปเป็น adaptive thinking พร้อม `output_config.effort: "xhigh"` เพราะ `/think` เป็น directive สำหรับ thinking และ `xhigh` คือค่าการตั้ง effort ของ Opus 4.7
  - Anthropic Claude Opus 4.7 ยังรองรับ `/think max`; โดยจะจับคู่ไปยังเส้นทาง max effort แบบที่ provider เป็นผู้กำหนดเช่นเดียวกัน
  - โมเดล OpenAI GPT จะจับคู่ `/think` ผ่านการรองรับ effort ของ Responses API ที่เฉพาะกับแต่ละโมเดล `/think off` จะส่ง `reasoning.effort: "none"` เฉพาะเมื่อโมเดลเป้าหมายรองรับเท่านั้น; มิฉะนั้น OpenClaw จะละ payload reasoning ที่ปิดใช้งานออกแทนการส่งค่าที่ไม่รองรับ
  - Google Gemini จับคู่ `/think adaptive` ไปเป็น dynamic thinking ที่ provider ของ Gemini เป็นผู้จัดการ คำขอ Gemini 3 จะละ `thinkingLevel` แบบคงที่ออก ขณะที่คำขอ Gemini 2.5 จะส่ง `thinkingBudget: -1`; ระดับแบบคงที่จะยังคงถูกจับคู่ไปยัง `thinkingLevel` หรือ budget ของ Gemini ที่ใกล้ที่สุดสำหรับตระกูลโมเดลนั้น
  - MiniMax (`minimax/*`) บนเส้นทางสตรีมที่เข้ากันได้กับ Anthropic จะใช้ค่าเริ่มต้นเป็น `thinking: { type: "disabled" }` เว้นแต่คุณจะตั้งค่า thinking อย่างชัดเจนใน model params หรือ request params วิธีนี้ช่วยหลีกเลี่ยงเดลตา `reasoning_content` ที่รั่วจากรูปแบบสตรีม Anthropic ที่ไม่ใช่แบบ Native ของ MiniMax
  - Z.AI (`zai/*`) รองรับ thinking แบบไบนารีเท่านั้น (`on`/`off`) ระดับใดก็ตามที่ไม่ใช่ `off` จะถือเป็น `on` (จับคู่ไปเป็น `low`)
  - Moonshot (`moonshot/*`) จับคู่ `/think off` ไปเป็น `thinking: { type: "disabled" }` และระดับใดก็ตามที่ไม่ใช่ `off` ไปเป็น `thinking: { type: "enabled" }` เมื่อเปิดใช้งาน thinking แล้ว Moonshot จะยอมรับ `tool_choice` ได้เฉพาะ `auto|none`; OpenClaw จะปรับค่าที่ไม่เข้ากันให้เป็น `auto`

## ลำดับการ resolve

1. Directive แบบ inline บนข้อความนั้น (มีผลเฉพาะข้อความนั้นเท่านั้น)
2. การ override ระดับเซสชัน (ตั้งค่าโดยส่งข้อความที่มีแต่ directive)
3. ค่าเริ่มต้นต่อ agent (`agents.list[].thinkingDefault` ใน config)
4. ค่าเริ่มต้นแบบ global (`agents.defaults.thinkingDefault` ใน config)
5. Fallback: ค่าเริ่มต้นที่ provider ประกาศไว้เมื่อมี; มิฉะนั้นโมเดลที่รองรับ reasoning จะ resolve เป็น `medium` หรือระดับที่ใกล้ที่สุดที่ไม่ใช่ `off` และรองรับโดยโมเดลนั้น ส่วนโมเดลที่ไม่รองรับ reasoning จะคงเป็น `off`

## การตั้งค่าเริ่มต้นของเซสชัน

- ส่งข้อความที่มี **เฉพาะ** directive เท่านั้น (อนุญาตให้มี whitespace ได้) เช่น `/think:medium` หรือ `/t high`
- ค่านี้จะคงอยู่สำหรับเซสชันปัจจุบัน (โดยค่าเริ่มต้นแยกตามผู้ส่ง); ล้างได้ด้วย `/think:off` หรือการรีเซ็ตเมื่อเซสชันว่างงาน
- จะมีการส่งคำตอบยืนยัน (`Thinking level set to high.` / `Thinking disabled.`) หากระดับไม่ถูกต้อง (เช่น `/thinking big`) คำสั่งจะถูกปฏิเสธพร้อมคำใบ้ และสถานะของเซสชันจะไม่เปลี่ยนแปลง
- ส่ง `/think` (หรือ `/think:`) โดยไม่ใส่อาร์กิวเมนต์เพื่อดูระดับ thinking ปัจจุบัน

## การนำไปใช้ตาม agent

- **Embedded Pi**: ระดับที่ resolve แล้วจะถูกส่งต่อไปยัง runtime ของ Pi agent ภายใน process

## โหมดเร็ว (/fast)

- ระดับ: `on|off`
- ข้อความที่มีแต่ directive จะสลับการ override โหมดเร็วระดับเซสชัน และตอบกลับ `Fast mode enabled.` / `Fast mode disabled.`
- ส่ง `/fast` (หรือ `/fast status`) โดยไม่ใส่โหมดเพื่อดูสถานะโหมดเร็วที่มีผลจริงในปัจจุบัน
- OpenClaw resolve โหมดเร็วตามลำดับนี้:
  1. `/fast on|off` แบบ inline/directive-only
  2. การ override ของเซสชัน
  3. ค่าเริ่มต้นต่อ agent (`agents.list[].fastModeDefault`)
  4. config ต่อโมเดล: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- สำหรับ `openai/*` โหมดเร็วจะจับคู่ไปยังการประมวลผลแบบ priority ของ OpenAI โดยส่ง `service_tier=priority` บนคำขอ Responses ที่รองรับ
- สำหรับ `openai-codex/*` โหมดเร็วจะส่งแฟล็ก `service_tier=priority` เดียวกันบน Codex Responses OpenClaw ใช้ตัวสลับ `/fast` ร่วมกันหนึ่งตัวระหว่างทั้งสองเส้นทางการยืนยันตัวตน
- สำหรับคำขอ `anthropic/*` สาธารณะแบบตรง รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย OAuth และถูกส่งไปยัง `api.anthropic.com` โหมดเร็วจะจับคู่ไปยัง service tier ของ Anthropic: `/fast on` ตั้งค่า `service_tier=auto`, `/fast off` ตั้งค่า `service_tier=standard_only`
- สำหรับ `minimax/*` บนเส้นทางที่เข้ากันได้กับ Anthropic, `/fast on` (หรือ `params.fastMode: true`) จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`
- model params ของ Anthropic แบบชัดเจน `serviceTier` / `service_tier` จะมีลำดับความสำคัญเหนือค่าเริ่มต้นของโหมดเร็วเมื่อมีการตั้งทั้งสองอย่าง OpenClaw ยังคงข้ามการแทรก service-tier ของ Anthropic สำหรับ proxy base URL ที่ไม่ใช่ Anthropic
- `/status` จะแสดง `Fast` เฉพาะเมื่อเปิดใช้งานโหมดเร็ว

## Directive แบบละเอียด (/verbose หรือ /v)

- ระดับ: `on` (ขั้นต่ำ) | `full` | `off` (ค่าเริ่มต้น)
- ข้อความที่มีแต่ directive จะสลับ verbose ระดับเซสชันและตอบกลับ `Verbose logging enabled.` / `Verbose logging disabled.`; ระดับที่ไม่ถูกต้องจะส่งคืนคำใบ้โดยไม่เปลี่ยนสถานะ
- `/verbose off` จะเก็บการ override ของเซสชันแบบชัดเจน; ล้างได้ผ่าน UI ของ Sessions โดยเลือก `inherit`
- Directive แบบ inline มีผลเฉพาะข้อความนั้น; นอกนั้นจะใช้ค่าเริ่มต้นระดับเซสชัน/global
- ส่ง `/verbose` (หรือ `/verbose:`) โดยไม่ใส่อาร์กิวเมนต์เพื่อดูระดับ verbose ปัจจุบัน
- เมื่อเปิด verbose, agents ที่ส่งผลลัพธ์ tool แบบมีโครงสร้าง (Pi, JSON agents อื่น ๆ) จะส่งการเรียก tool แต่ละครั้งกลับมาเป็นข้อความเฉพาะเมทาดาทาแยกกัน โดยขึ้นต้นด้วย `<emoji> <tool-name>: <arg>` เมื่อมีข้อมูล (path/command) สรุป tool เหล่านี้จะถูกส่งทันทีที่แต่ละ tool เริ่มทำงาน (เป็น bubble แยก) ไม่ใช่เป็นสตรีมมิงเดลตา
- สรุปความล้มเหลวของ tool จะยังคงมองเห็นได้ในโหมดปกติ แต่ส่วนต่อท้ายรายละเอียดข้อผิดพลาดดิบจะถูกซ่อนไว้ เว้นแต่ verbose จะเป็น `on` หรือ `full`
- เมื่อ verbose เป็น `full` เอาต์พุตของ tool จะถูกส่งต่อหลังเสร็จสิ้นด้วย (bubble แยก ถูกตัดให้สั้นอย่างปลอดภัย) หากคุณสลับ `/verbose on|full|off` ขณะกำลังมีการรันอยู่ bubble ของ tool ถัดไปจะใช้การตั้งค่าใหม่

## Directive สำหรับ Plugin trace (/trace)

- ระดับ: `on` | `off` (ค่าเริ่มต้น)
- ข้อความที่มีแต่ directive จะสลับเอาต์พุต plugin trace ระดับเซสชัน และตอบกลับ `Plugin trace enabled.` / `Plugin trace disabled.`
- Directive แบบ inline มีผลเฉพาะข้อความนั้น; นอกนั้นจะใช้ค่าเริ่มต้นระดับเซสชัน/global
- ส่ง `/trace` (หรือ `/trace:`) โดยไม่ใส่อาร์กิวเมนต์เพื่อดูระดับ trace ปัจจุบัน
- `/trace` มีขอบเขตแคบกว่า `/verbose`: จะแสดงเฉพาะบรรทัด trace/debug ที่ plugin เป็นเจ้าของ เช่นสรุป debug ของ Active Memory
- บรรทัด trace สามารถแสดงใน `/status` และเป็นข้อความวินิจฉัยต่อท้ายหลังคำตอบปกติของ assistant

## การมองเห็น reasoning (/reasoning)

- ระดับ: `on|off|stream`
- ข้อความที่มีแต่ directive จะสลับว่าจะให้แสดงบล็อก thinking ในคำตอบหรือไม่
- เมื่อเปิดใช้งาน reasoning จะถูกส่งเป็น **ข้อความแยก** โดยขึ้นต้นด้วย `Reasoning:`
- `stream` (เฉพาะ Telegram): สตรีม reasoning เข้าไปใน bubble ฉบับร่างของ Telegram ระหว่างที่กำลังสร้างคำตอบ จากนั้นส่งคำตอบสุดท้ายโดยไม่มี reasoning
- Alias: `/reason`
- ส่ง `/reasoning` (หรือ `/reasoning:`) โดยไม่ใส่อาร์กิวเมนต์เพื่อดูระดับ reasoning ปัจจุบัน
- ลำดับการ resolve: directive แบบ inline จากนั้นการ override ของเซสชัน จากนั้นค่าเริ่มต้นต่อ agent (`agents.list[].reasoningDefault`) และสุดท้าย fallback (`off`)

## ที่เกี่ยวข้อง

- เอกสารของโหมด elevated อยู่ที่ [Elevated mode](/th/tools/elevated)

## Heartbeats

- เนื้อหาของ Heartbeat probe คือ prompt ของ Heartbeat ที่กำหนดค่าไว้ (ค่าเริ่มต้น: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`) Directive แบบ inline ในข้อความ Heartbeat จะมีผลตามปกติ (แต่ควรหลีกเลี่ยงการเปลี่ยนค่าเริ่มต้นของเซสชันจาก Heartbeat)
- การส่ง Heartbeat ใช้เฉพาะ payload สุดท้ายตามค่าเริ่มต้น หากต้องการส่งข้อความ `Reasoning:` แยกต่างหากด้วย (เมื่อมี) ให้ตั้งค่า `agents.defaults.heartbeat.includeReasoning: true` หรือ `agents.list[].heartbeat.includeReasoning: true` ต่อ agent

## UI ของเว็บแชต

- ตัวเลือก thinking ของเว็บแชตจะสะท้อนระดับที่เก็บไว้ของเซสชันจาก inbound session store/config เมื่อหน้าโหลด
- การเลือกระดับอื่นจะเขียนการ override ของเซสชันทันทีผ่าน `sessions.patch`; จะไม่รอการส่งครั้งถัดไป และไม่ใช่การ override แบบใช้ครั้งเดียว `thinkingOnce`
- ตัวเลือกแรกจะเป็น `Default (<resolved level>)` เสมอ โดยค่าเริ่มต้นที่ resolve แล้วมาจากโปรไฟล์ thinking ของ provider ของโมเดลในเซสชันที่กำลังใช้งาน รวมถึงตรรกะ fallback เดียวกับที่ `/status` และ `session_status` ใช้
- ตัวเลือกนี้ใช้ `thinkingLevels` ที่ส่งกลับจากแถว/defaults ของ Gateway session โดยมี `thinkingOptions` คงไว้เป็นรายการป้ายกำกับแบบ legacy UI ของเบราว์เซอร์จะไม่เก็บรายการ regex ของ provider เอง; plugins เป็นผู้กำหนดชุดระดับเฉพาะของโมเดล
- `/think:<level>` ยังใช้งานได้และอัปเดตระดับเซสชันที่เก็บไว้ตัวเดียวกัน ดังนั้น directive ในแชตและตัวเลือกจึงคงสอดคล้องกัน

## โปรไฟล์ของ provider

- Provider plugins สามารถเปิดเผย `resolveThinkingProfile(ctx)` เพื่อกำหนดระดับและค่าเริ่มต้นที่โมเดลรองรับ
- แต่ละระดับในโปรไฟล์มี `id` แบบ canonical ที่ถูกจัดเก็บ (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` หรือ `max`) และอาจมี `label` สำหรับการแสดงผล ผู้ให้บริการแบบไบนารีจะใช้ `{ id: "low", label: "on" }`
- hook แบบ legacy ที่เผยแพร่อยู่แล้ว (`supportsXHighThinking`, `isBinaryThinking` และ `resolveDefaultThinkingLevel`) ยังคงอยู่เป็นอะแดปเตอร์เพื่อความเข้ากันได้ แต่ชุดระดับแบบกำหนดเองใหม่ควรใช้ `resolveThinkingProfile`
- แถว/defaults ของ Gateway จะเปิดเผย `thinkingLevels`, `thinkingOptions` และ `thinkingDefault` เพื่อให้ไคลเอนต์ ACP/แชตแสดง id และ label ของโปรไฟล์เดียวกับที่การตรวจสอบ runtime ใช้
