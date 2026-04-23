---
read_when:
    - การปรับการคิด การแยกวิเคราะห์หรือค่าเริ่มต้นของโหมด fast หรือ verbose directive
summary: ไวยากรณ์ของ directive สำหรับ /think, /fast, /verbose, /trace และการมองเห็น reasoning
title: ระดับการคิด
x-i18n:
    generated_at: "2026-04-23T10:24:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66033bb9272c9b9ea8fc85dc91e33e95ce4c469c56a8cd10c19632a5aa8a2338
    source_path: tools/thinking.md
    workflow: 15
---

# ระดับการคิด (/think directives)

## สิ่งที่ทำได้

- Inline directive ในเนื้อหาขาเข้าใดก็ได้: `/t <level>`, `/think:<level>` หรือ `/thinking <level>`.
- ระดับ (aliases): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (งบประมาณสูงสุด)
  - xhigh → “ultrathink+” (GPT-5.2 + Codex models และ effort ของ Anthropic Claude Opus 4.7)
  - adaptive → การคิดแบบปรับตัวโดยผู้ให้บริการเป็นผู้จัดการ (รองรับสำหรับ Claude 4.6 บน Anthropic/Bedrock และ Anthropic Claude Opus 4.7)
  - max → reasoning สูงสุดของผู้ให้บริการ (ปัจจุบันคือ Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` และ `extra_high` จะถูกแมปเป็น `xhigh`
  - `highest` จะถูกแมปเป็น `high`
- หมายเหตุเกี่ยวกับผู้ให้บริการ:
  - เมนูและตัวเลือกของการคิดขับเคลื่อนด้วย provider profile ผู้ให้บริการ Plugins จะประกาศชุดระดับที่แน่นอนสำหรับโมเดลที่เลือก รวมถึงป้ายกำกับอย่าง `on` แบบไบนารี
  - `adaptive`, `xhigh` และ `max` จะถูกโฆษณาเฉพาะสำหรับ provider/model profiles ที่รองรับเท่านั้น Typed directives สำหรับระดับที่ไม่รองรับจะถูกปฏิเสธพร้อมตัวเลือกที่ใช้ได้ของโมเดลนั้น
  - ระดับที่จัดเก็บไว้เดิมแต่ไม่รองรับจะถูก remap ตามลำดับ rank ของ provider profile `adaptive` จะ fallback ไปเป็น `medium` บนโมเดลที่ไม่รองรับ adaptive ส่วน `xhigh` และ `max` จะ fallback ไปยังระดับที่รองรับสูงสุดซึ่งไม่ใช่ `off` สำหรับโมเดลที่เลือก
  - โมเดล Anthropic Claude 4.6 ใช้ค่าเริ่มต้นเป็น `adaptive` เมื่อไม่มีการตั้งระดับการคิดอย่างชัดเจน
  - Anthropic Claude Opus 4.7 ไม่ได้ใช้ adaptive thinking เป็นค่าเริ่มต้น ค่าเริ่มต้น effort ของ API ยังคงเป็นของผู้ให้บริการ เว้นแต่คุณจะตั้งระดับการคิดอย่างชัดเจน
  - Anthropic Claude Opus 4.7 จะแมป `/think xhigh` ไปยัง adaptive thinking พร้อม `output_config.effort: "xhigh"` เพราะ `/think` เป็น thinking directive และ `xhigh` คือการตั้งค่า effort ของ Opus 4.7
  - Anthropic Claude Opus 4.7 ยังเปิดให้ใช้ `/think max`; โดยมันจะถูกแมปไปยังเส้นทาง max effort เดียวกันที่ผู้ให้บริการเป็นเจ้าของ
  - OpenAI GPT models จะแมป `/think` ผ่านการรองรับ effort ของ Responses API ที่เฉพาะกับแต่ละโมเดล `/think off` จะส่ง `reasoning.effort: "none"` เฉพาะเมื่อโมเดลเป้าหมายรองรับเท่านั้น; มิฉะนั้น OpenClaw จะละเว้น payload สำหรับปิด reasoning แทนการส่งค่าที่ไม่รองรับ
  - MiniMax (`minimax/*`) บนเส้นทางสตรีมที่เข้ากันได้กับ Anthropic จะใช้ค่าเริ่มต้น `thinking: { type: "disabled" }` เว้นแต่คุณจะตั้ง thinking อย่างชัดเจนใน model params หรือ request params วิธีนี้ช่วยหลีกเลี่ยง `reasoning_content` deltas ที่รั่วออกมาจากรูปแบบสตรีม Anthropic ที่ไม่ใช่เนทีฟของ MiniMax
  - Z.AI (`zai/*`) รองรับเฉพาะการคิดแบบไบนารี (`on`/`off`) ระดับใดก็ตามที่ไม่ใช่ `off` จะถือเป็น `on` (แมปเป็น `low`)
  - Moonshot (`moonshot/*`) จะแมป `/think off` ไปเป็น `thinking: { type: "disabled" }` และระดับใดก็ตามที่ไม่ใช่ `off` เป็น `thinking: { type: "enabled" }` เมื่อเปิด thinking แล้ว Moonshot จะยอมรับ `tool_choice` ได้เฉพาะ `auto|none`; OpenClaw จะ normalize ค่าที่ไม่เข้ากันให้เป็น `auto`

## ลำดับการ resolve

1. Inline directive บนข้อความ (มีผลกับข้อความนั้นเท่านั้น)
2. Session override (ตั้งโดยส่งข้อความที่มีแต่ directive)
3. ค่าเริ่มต้นต่อเอเจนต์ (`agents.list[].thinkingDefault` ใน config)
4. ค่าเริ่มต้นแบบโกลบอล (`agents.defaults.thinkingDefault` ใน config)
5. Fallback: ค่าเริ่มต้นที่ผู้ให้บริการประกาศเมื่อมี, `low` สำหรับ catalog models อื่นที่ถูกทำเครื่องหมายว่ารองรับ reasoning, และ `off` ในกรณีอื่น

## การตั้งค่า session default

- ส่งข้อความที่เป็น **directive เท่านั้น** (อนุญาตให้มี whitespace) เช่น `/think:medium` หรือ `/t high`
- ค่านี้จะคงอยู่สำหรับเซสชันปัจจุบัน (ต่อผู้ส่งเป็นค่าเริ่มต้น); ล้างได้ด้วย `/think:off` หรือ session idle reset
- จะมีการส่งข้อความยืนยัน (`Thinking level set to high.` / `Thinking disabled.`) หากระดับไม่ถูกต้อง (เช่น `/thinking big`) คำสั่งจะถูกปฏิเสธพร้อมคำแนะนำ และสถานะของเซสชันจะไม่เปลี่ยน
- ส่ง `/think` (หรือ `/think:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับการคิดปัจจุบัน

## การนำไปใช้โดยเอเจนต์

- **Embedded Pi**: ระดับที่ resolve แล้วจะถูกส่งไปยัง runtime ของ Pi agent ภายใน process

## โหมด Fast (/fast)

- ระดับ: `on|off`
- ข้อความที่มีแต่ directive จะสลับ session fast-mode override และตอบกลับ `Fast mode enabled.` / `Fast mode disabled.`
- ส่ง `/fast` (หรือ `/fast status`) โดยไม่มีโหมดเพื่อดูสถานะ fast-mode ที่มีผลอยู่จริงในปัจจุบัน
- OpenClaw จะ resolve fast mode ตามลำดับนี้:
  1. `/fast on|off` แบบ inline/directive-only
  2. Session override
  3. ค่าเริ่มต้นต่อเอเจนต์ (`agents.list[].fastModeDefault`)
  4. การกำหนดค่าต่อโมเดล: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- สำหรับ `openai/*`, fast mode จะถูกแมปเป็นการประมวลผลแบบลำดับความสำคัญของ OpenAI โดยส่ง `service_tier=priority` บน Requests ของ Responses ที่รองรับ
- สำหรับ `openai-codex/*`, fast mode จะส่งแฟล็ก `service_tier=priority` เดียวกันบน Codex Responses OpenClaw ใช้สวิตช์ `/fast` ร่วมกันหนึ่งตัวข้ามทั้งสองเส้นทาง auth
- สำหรับคำขอ `anthropic/*` แบบ public โดยตรง รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย OAuth ที่ส่งไปยัง `api.anthropic.com`, fast mode จะถูกแมปไปยัง Anthropic service tiers: `/fast on` ตั้ง `service_tier=auto`, `/fast off` ตั้ง `service_tier=standard_only`
- สำหรับ `minimax/*` บนเส้นทางที่เข้ากันได้กับ Anthropic, `/fast on` (หรือ `params.fastMode: true`) จะเขียนทับ `MiniMax-M2.7` เป็น `MiniMax-M2.7-highspeed`
- model params แบบ `serviceTier` / `service_tier` ของ Anthropic ที่ระบุอย่างชัดเจน จะมีสิทธิ์เหนือค่าเริ่มต้นของ fast-mode เมื่อทั้งสองอย่างถูกตั้งไว้ OpenClaw ยังคงข้ามการ inject Anthropic service-tier สำหรับ base URL ของพร็อกซีที่ไม่ใช่ Anthropic
- `/status` จะแสดง `Fast` เฉพาะเมื่อเปิด fast mode

## Verbose directives (/verbose หรือ /v)

- ระดับ: `on` (minimal) | `full` | `off` (ค่าเริ่มต้น)
- ข้อความที่มีแต่ directive จะสลับ session verbose และตอบกลับ `Verbose logging enabled.` / `Verbose logging disabled.`; ระดับที่ไม่ถูกต้องจะคืนคำแนะนำโดยไม่เปลี่ยนสถานะ
- `/verbose off` จะจัดเก็บ session override แบบชัดเจน; ล้างได้ผ่าน Sessions UI โดยเลือก `inherit`
- Inline directive มีผลกับข้อความนั้นเท่านั้น; มิฉะนั้นจะใช้ session/global defaults
- ส่ง `/verbose` (หรือ `/verbose:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับ verbose ปัจจุบัน
- เมื่อเปิด verbose เอเจนต์ที่ปล่อย structured tool results (Pi, JSON agents อื่นๆ) จะส่งแต่ละ tool call กลับมาเป็นข้อความ metadata-only ของตัวเอง โดยเติมคำนำหน้าด้วย `<emoji> <tool-name>: <arg>` เมื่อมี (path/command) สรุป tool เหล่านี้จะถูกส่งทันทีที่แต่ละ tool เริ่มทำงาน (เป็นบับเบิลแยก) ไม่ใช่สตรีมมิงเดลตา
- สรุปความล้มเหลวของ tool ยังคงมองเห็นได้ในโหมดปกติ แต่ suffix รายละเอียดข้อผิดพลาดแบบดิบจะถูกซ่อนไว้ เว้นแต่ verbose จะเป็น `on` หรือ `full`
- เมื่อ verbose เป็น `full` เอาต์พุตของ tool จะถูกส่งต่อหลังเสร็จสิ้นด้วย (บับเบิลแยก ถูกตัดให้สั้นในระดับปลอดภัย) หากคุณสลับ `/verbose on|full|off` ขณะที่กำลังมี run อยู่ บับเบิลของ tool ที่ตามมาจะใช้การตั้งค่าใหม่

## Plugin trace directives (/trace)

- ระดับ: `on` | `off` (ค่าเริ่มต้น)
- ข้อความที่มีแต่ directive จะสลับ session plugin trace output และตอบกลับ `Plugin trace enabled.` / `Plugin trace disabled.`
- Inline directive มีผลกับข้อความนั้นเท่านั้น; มิฉะนั้นจะใช้ session/global defaults
- ส่ง `/trace` (หรือ `/trace:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับ trace ปัจจุบัน
- `/trace` แคบกว่า `/verbose`: มันเปิดเผยเฉพาะบรรทัด trace/debug ที่ Plugin เป็นเจ้าของ เช่น Active Memory debug summaries
- บรรทัด trace อาจปรากฏใน `/status` และเป็นข้อความวินิจฉัยติดตามผลหลังคำตอบปกติของ assistant

## การมองเห็น reasoning (/reasoning)

- ระดับ: `on|off|stream`
- ข้อความที่มีแต่ directive จะสลับว่าจะให้แสดงบล็อกการคิดในคำตอบหรือไม่
- เมื่อเปิดใช้งาน reasoning จะถูกส่งเป็น **ข้อความแยก** โดยมีคำนำหน้า `Reasoning:`
- `stream` (Telegram เท่านั้น): สตรีม reasoning เข้าไปใน Telegram draft bubble ระหว่างกำลังสร้างคำตอบ จากนั้นส่งคำตอบสุดท้ายโดยไม่มี reasoning
- Alias: `/reason`
- ส่ง `/reasoning` (หรือ `/reasoning:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับ reasoning ปัจจุบัน
- ลำดับการ resolve: inline directive, ตามด้วย session override, จากนั้นค่าเริ่มต้นต่อเอเจนต์ (`agents.list[].reasoningDefault`) แล้ว fallback (`off`)

## ที่เกี่ยวข้อง

- เอกสารโหมด Elevated อยู่ที่ [Elevated mode](/th/tools/elevated)

## Heartbeats

- เนื้อหาของ Heartbeat probe คือ heartbeat prompt ที่กำหนดค่าไว้ (ค่าเริ่มต้น: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`) Inline directives ใน heartbeat message จะมีผลตามปกติ (แต่ควรหลีกเลี่ยงการเปลี่ยน session defaults จาก heartbeats)
- โดยค่าเริ่มต้นการส่ง Heartbeat จะส่งเฉพาะ payload สุดท้าย หากต้องการส่งข้อความ `Reasoning:` แยกด้วย (เมื่อมี) ให้ตั้ง `agents.defaults.heartbeat.includeReasoning: true` หรือแบบต่อเอเจนต์ `agents.list[].heartbeat.includeReasoning: true`

## Web chat UI

- ตัวเลือกการคิดในเว็บแชตจะสะท้อนระดับที่จัดเก็บไว้ของเซสชันจาก inbound session store/config ตอนที่โหลดหน้า
- การเลือกอีกระดับหนึ่งจะเขียน session override ทันทีผ่าน `sessions.patch`; จะไม่รอการส่งครั้งถัดไป และไม่ใช่ one-shot `thinkingOnce` override
- ตัวเลือกแรกจะเป็น `Default (<resolved level>)` เสมอ โดย resolved default จะมาจาก provider thinking profile ของโมเดลที่ใช้งานอยู่ในเซสชัน
- ตัวเลือกจะใช้ `thinkingOptions` ที่ส่งกลับมาจาก gateway session row Browser UI จะไม่เก็บรายการ provider regex ของตัวเอง; Plugins เป็นเจ้าของชุดระดับที่เฉพาะกับโมเดล
- `/think:<level>` ยังคงใช้งานได้และอัปเดตระดับของเซสชันที่จัดเก็บไว้เดียวกัน ดังนั้น chat directives และตัวเลือกจึงสอดคล้องกัน

## Provider profiles

- Provider plugins สามารถเปิดเผย `resolveThinkingProfile(ctx)` เพื่อกำหนดระดับที่รองรับและค่าเริ่มต้นของโมเดล
- แต่ละระดับใน profile จะมี `id` แบบ canonical ที่จัดเก็บไว้ (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` หรือ `max`) และอาจมี `label` สำหรับการแสดงผล ผู้ให้บริการแบบไบนารีใช้ `{ id: "low", label: "on" }`
- hooks แบบเดิมที่เผยแพร่อยู่แล้ว (`supportsXHighThinking`, `isBinaryThinking` และ `resolveDefaultThinkingLevel`) ยังคงอยู่ในฐานะ compatibility adapters แต่ชุดระดับแบบกำหนดเองใหม่ควรใช้ `resolveThinkingProfile`
- Gateway rows จะเปิดเผย `thinkingOptions` และ `thinkingDefault` เพื่อให้ ACP/chat clients เรนเดอร์ profile เดียวกันกับที่ runtime validation ใช้
