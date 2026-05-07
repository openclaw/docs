---
read_when:
    - การปรับการแยกวิเคราะห์หรือค่าเริ่มต้นของคำสั่ง thinking, fast-mode หรือ verbose
summary: ไวยากรณ์ไดเรกทีฟสำหรับ /think, /fast, /verbose, /trace และการแสดงการให้เหตุผล
title: ระดับการคิด
x-i18n:
    generated_at: "2026-05-07T13:27:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8890563aa0171d41549f1d1a6af3279babbcba17eb19302753275e9e2ff01980
    source_path: tools/thinking.md
    workflow: 16
---

## สิ่งที่ทำ

- คำสั่งแบบอินไลน์ในเนื้อหาขาเข้าใดๆ: `/t <level>`, `/think:<level>`, หรือ `/thinking <level>`
- ระดับ (นามแฝง): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "คิด"
  - low → "คิดอย่างจริงจัง"
  - medium → "คิดให้หนักขึ้น"
  - high → "ultrathink" (งบสูงสุด)
  - xhigh → "ultrathink+" (โมเดล GPT-5.2+ และ Codex รวมถึงระดับ effort ของ Anthropic Claude Opus 4.7)
  - adaptive → การคิดแบบปรับตัวที่จัดการโดยผู้ให้บริการ (รองรับสำหรับ Claude 4.6 บน Anthropic/Bedrock, Anthropic Claude Opus 4.7 และ Google Gemini dynamic thinking)
  - max → provider max reasoning (Anthropic Claude Opus 4.7; Ollama จับคู่ค่านี้กับ `think` effort แบบเนทีฟสูงสุด)
  - `x-high`, `x_high`, `extra-high`, `extra high`, และ `extra_high` จับคู่กับ `xhigh`
  - `highest` จับคู่กับ `high`
- หมายเหตุของผู้ให้บริการ:
  - เมนูและตัวเลือกการคิดขับเคลื่อนโดยโปรไฟล์ผู้ให้บริการ Provider plugins ประกาศชุดระดับที่แน่นอนสำหรับโมเดลที่เลือก รวมถึงป้ายกำกับเช่น binary `on`
  - `adaptive`, `xhigh`, และ `max` จะแสดงเฉพาะสำหรับโปรไฟล์ผู้ให้บริการ/โมเดลที่รองรับเท่านั้น คำสั่งที่พิมพ์สำหรับระดับที่ไม่รองรับจะถูกปฏิเสธพร้อมตัวเลือกที่ถูกต้องของโมเดลนั้น
  - ระดับที่ไม่รองรับซึ่งถูกจัดเก็บไว้เดิมจะถูกจับคู่ใหม่ตามอันดับโปรไฟล์ผู้ให้บริการ `adaptive` จะถอยกลับเป็น `medium` บนโมเดลที่ไม่รองรับ adaptive ส่วน `xhigh` และ `max` จะถอยกลับเป็นระดับ non-off ที่รองรับสูงสุดสำหรับโมเดลที่เลือก
  - โมเดล Anthropic Claude 4.6 ใช้ค่าเริ่มต้นเป็น `adaptive` เมื่อไม่ได้ตั้งค่าระดับการคิดไว้อย่างชัดเจน
  - Anthropic Claude Opus 4.7 ไม่ได้ใช้ค่าเริ่มต้นเป็น adaptive thinking ค่าเริ่มต้น API effort ของมันยังคงเป็นของผู้ให้บริการ เว้นแต่คุณตั้งค่าระดับการคิดไว้อย่างชัดเจน
  - Anthropic Claude Opus 4.7 จับคู่ `/think xhigh` กับ adaptive thinking พร้อม `output_config.effort: "xhigh"` เพราะ `/think` เป็นคำสั่งการคิด และ `xhigh` เป็นการตั้งค่า effort ของ Opus 4.7
  - Anthropic Claude Opus 4.7 ยังเปิดเผย `/think max`; ค่านี้จับคู่กับเส้นทาง max effort ที่ผู้ให้บริการเป็นเจ้าของเดียวกัน
  - โมเดล Direct DeepSeek V4 เปิดเผย `/think xhigh|max`; ทั้งสองจับคู่กับ DeepSeek `reasoning_effort: "max"` ขณะที่ระดับ non-off ที่ต่ำกว่าจะจับคู่กับ `high`
  - โมเดล DeepSeek V4 ที่ส่งผ่าน OpenRouter เปิดเผย `/think xhigh` และส่งค่า `reasoning_effort` ที่ OpenRouter รองรับ ค่าทับซ้อน `max` ที่จัดเก็บไว้จะถอยกลับเป็น `xhigh`
  - โมเดล Ollama ที่รองรับการคิดเปิดเผย `/think low|medium|high|max`; `max` จับคู่กับ `think: "high"` แบบเนทีฟ เพราะ API เนทีฟของ Ollama รับสตริง effort `low`, `medium`, และ `high`
  - โมเดล OpenAI GPT จับคู่ `/think` ผ่านการรองรับ effort เฉพาะโมเดลของ Responses API `/think off` ส่ง `reasoning.effort: "none"` เฉพาะเมื่อโมเดลเป้าหมายรองรับเท่านั้น; ไม่เช่นนั้น OpenClaw จะละเว้น payload การให้เหตุผลที่ปิดใช้งานแทนการส่งค่าที่ไม่รองรับ
  - รายการแค็ตตาล็อกที่เข้ากันได้กับ OpenAI แบบกำหนดเองสามารถเลือกเปิดใช้ `/think xhigh` ได้โดยตั้งค่า `models.providers.<provider>.models[].compat.supportedReasoningEfforts` ให้รวม `"xhigh"` การทำงานนี้ใช้ metadata ความเข้ากันได้เดียวกันที่จับคู่ payload outbound OpenAI reasoning effort ดังนั้นเมนู การตรวจสอบ session, agent CLI และ `llm-task` จึงสอดคล้องกับพฤติกรรม transport
  - refs ของ OpenRouter Hunter Alpha ที่ตั้งค่าไว้แต่ล้าสมัยจะข้าม proxy reasoning injection เพราะ route ที่เลิกใช้แล้วนั้นอาจส่งข้อความคำตอบสุดท้ายผ่านฟิลด์ reasoning ได้
  - Google Gemini จับคู่ `/think adaptive` กับ dynamic thinking ที่ผู้ให้บริการของ Gemini เป็นเจ้าของ คำขอ Gemini 3 จะละเว้น `thinkingLevel` แบบคงที่ ขณะที่คำขอ Gemini 2.5 ส่ง `thinkingBudget: -1`; ระดับคงที่ยังคงจับคู่กับ `thinkingLevel` หรือ budget ของ Gemini ที่ใกล้ที่สุดสำหรับตระกูลโมเดลนั้น
  - MiniMax (`minimax/*`) บนเส้นทางสตรีมมิงที่เข้ากันได้กับ Anthropic ใช้ค่าเริ่มต้นเป็น `thinking: { type: "disabled" }` เว้นแต่คุณตั้งค่า thinking ใน model params หรือ request params อย่างชัดเจน การทำเช่นนี้หลีกเลี่ยงเดลตา `reasoning_content` ที่รั่วจากรูปแบบ Anthropic stream ที่ไม่ใช่เนทีฟของ MiniMax
  - Z.AI (`zai/*`) รองรับเฉพาะ binary thinking (`on`/`off`) ระดับใดๆ ที่ไม่ใช่ `off` จะถือเป็น `on` (จับคู่กับ `low`)
  - Moonshot (`moonshot/*`) จับคู่ `/think off` กับ `thinking: { type: "disabled" }` และระดับใดๆ ที่ไม่ใช่ `off` กับ `thinking: { type: "enabled" }` เมื่อเปิดใช้ thinking แล้ว Moonshot รับเฉพาะ `tool_choice` `auto|none`; OpenClaw จะทำให้ค่าที่เข้ากันไม่ได้เป็น `auto`

## ลำดับการแก้ไขค่า

1. คำสั่งแบบอินไลน์บนข้อความ (ใช้กับข้อความนั้นเท่านั้น)
2. การทับค่า session (ตั้งค่าโดยส่งข้อความที่มีเฉพาะคำสั่ง)
3. ค่าเริ่มต้นต่อ agent (`agents.list[].thinkingDefault` ใน config)
4. ค่าเริ่มต้นส่วนกลาง (`agents.defaults.thinkingDefault` ใน config)
5. ค่าถอยกลับ: ค่าเริ่มต้นที่ผู้ให้บริการประกาศเมื่อมี; ไม่เช่นนั้นโมเดลที่รองรับ reasoning จะแก้ค่าเป็น `medium` หรือระดับ non-`off` ที่รองรับใกล้ที่สุดสำหรับโมเดลนั้น และโมเดลที่ไม่รองรับ reasoning จะคงเป็น `off`

## การตั้งค่า session default

- ส่งข้อความที่เป็นคำสั่ง **เท่านั้น** (อนุญาต whitespace) เช่น `/think:medium` หรือ `/t high`
- ค่านั้นจะคงอยู่สำหรับ session ปัจจุบัน (ค่าเริ่มต้นต่อผู้ส่ง); ล้างด้วย `/think:off` หรือการรีเซ็ตเมื่อ session idle
- มีการส่งข้อความยืนยัน (`Thinking level set to high.` / `Thinking disabled.`) หากระดับไม่ถูกต้อง (เช่น `/thinking big`) คำสั่งจะถูกปฏิเสธพร้อมคำแนะนำและสถานะ session จะไม่เปลี่ยนแปลง
- ส่ง `/think` (หรือ `/think:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับการคิดปัจจุบัน

## การใช้งานตาม agent

- **Pi แบบฝังตัว**: ระดับที่แก้ค่าแล้วจะถูกส่งให้ runtime ของ Pi agent ใน process
- **Claude CLI backend**: ระดับที่ไม่ใช่ off จะถูกส่งให้ Claude Code เป็น `--effort` เมื่อใช้ `claude-cli`; ดู [CLI backends](/th/gateway/cli-backends)

## โหมดเร็ว (/fast)

- ระดับ: `on|off`
- ข้อความที่มีเฉพาะคำสั่งจะสลับการทับค่า fast-mode ของ session และตอบกลับ `Fast mode enabled.` / `Fast mode disabled.`
- ส่ง `/fast` (หรือ `/fast status`) โดยไม่มีโหมดเพื่อดูสถานะ fast-mode ที่มีผลอยู่ปัจจุบัน
- OpenClaw แก้ค่า fast mode ตามลำดับนี้:
  1. Inline/directive-only `/fast on|off`
  2. การทับค่า session
  3. ค่าเริ่มต้นต่อ agent (`agents.list[].fastModeDefault`)
  4. config ต่อโมเดล: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. ค่าถอยกลับ: `off`
- สำหรับ `openai/*`, fast mode จับคู่กับ OpenAI priority processing โดยส่ง `service_tier=priority` บนคำขอ Responses ที่รองรับ
- สำหรับ `openai-codex/*`, fast mode ส่งแฟล็ก `service_tier=priority` เดียวกันบน Codex Responses OpenClaw คงตัวสลับ `/fast` ร่วมกันหนึ่งตัวสำหรับ auth path ทั้งสอง
- สำหรับคำขอ public `anthropic/*` โดยตรง รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย OAuth ซึ่งส่งไปยัง `api.anthropic.com`, fast mode จับคู่กับ service tiers ของ Anthropic: `/fast on` ตั้งค่า `service_tier=auto`, `/fast off` ตั้งค่า `service_tier=standard_only`
- สำหรับ `minimax/*` บนเส้นทางที่เข้ากันได้กับ Anthropic, `/fast on` (หรือ `params.fastMode: true`) เขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`
- model params ของ Anthropic `serviceTier` / `service_tier` ที่ตั้งไว้อย่างชัดเจนจะทับค่าเริ่มต้นของ fast-mode เมื่อทั้งสองถูกตั้งค่า OpenClaw ยังคงข้ามการฉีด service-tier ของ Anthropic สำหรับ proxy base URLs ที่ไม่ใช่ Anthropic
- `/status` แสดง `Fast` เฉพาะเมื่อเปิดใช้ fast mode

## คำสั่ง verbose (/verbose หรือ /v)

- ระดับ: `on` (น้อยที่สุด) | `full` | `off` (ค่าเริ่มต้น)
- ข้อความที่มีเฉพาะคำสั่งจะสลับ verbose ของ session และตอบกลับ `Verbose logging enabled.` / `Verbose logging disabled.`; ระดับที่ไม่ถูกต้องจะส่งคำแนะนำกลับโดยไม่เปลี่ยนสถานะ
- `/verbose off` จัดเก็บการทับค่า session อย่างชัดเจน; ล้างผ่าน Sessions UI โดยเลือก `inherit`
- คำสั่งแบบอินไลน์มีผลเฉพาะกับข้อความนั้น; ค่าเริ่มต้นของ session/global จะใช้ในกรณีอื่น
- ส่ง `/verbose` (หรือ `/verbose:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับ verbose ปัจจุบัน
- เมื่อเปิด verbose, agents ที่ปล่อยผลลัพธ์ tool แบบมีโครงสร้าง (Pi, JSON agents อื่นๆ) จะส่งแต่ละ tool call กลับเป็นข้อความ metadata-only ของตัวเอง โดยขึ้นต้นด้วย `<emoji> <tool-name>: <arg>` เมื่อมี สรุป tool เหล่านี้จะถูกส่งทันทีที่แต่ละ tool เริ่มทำงาน (เป็น bubble แยก) ไม่ใช่ streaming deltas
- สรุปความล้มเหลวของ tool ยังคงมองเห็นได้ในโหมดปกติ แต่ suffix รายละเอียดข้อผิดพลาดดิบจะถูกซ่อน เว้นแต่ verbose เป็น `on` หรือ `full`
- เมื่อ verbose เป็น `full`, output ของ tool จะถูกส่งต่อหลังจบงานด้วย (bubble แยก ตัดให้เหลือความยาวที่ปลอดภัย) หากคุณสลับ `/verbose on|full|off` ขณะที่ run กำลังทำงานอยู่ bubble ของ tool ถัดไปจะเคารพการตั้งค่าใหม่
- `agents.defaults.toolProgressDetail` ควบคุมรูปแบบของสรุป tool `/verbose` และบรรทัด tool ใน progress-draft ใช้ `"explain"` (ค่าเริ่มต้น) สำหรับป้ายกำกับมนุษย์ที่กะทัดรัด เช่น `🛠️ Exec: checking JS syntax`; ใช้ `"raw"` เมื่อคุณต้องการให้แนบคำสั่ง/รายละเอียดดิบสำหรับการ debug ด้วย `agents.list[].toolProgressDetail` ต่อ agent จะทับค่าเริ่มต้น
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## คำสั่ง Plugin trace (/trace)

- ระดับ: `on` | `off` (ค่าเริ่มต้น)
- ข้อความที่มีเฉพาะคำสั่งจะสลับ output ของ session plugin trace และตอบกลับ `Plugin trace enabled.` / `Plugin trace disabled.`
- คำสั่งแบบอินไลน์มีผลเฉพาะกับข้อความนั้น; ค่าเริ่มต้นของ session/global จะใช้ในกรณีอื่น
- ส่ง `/trace` (หรือ `/trace:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับ trace ปัจจุบัน
- `/trace` แคบกว่า `/verbose`: เปิดเผยเฉพาะบรรทัด trace/debug ที่ Plugin เป็นเจ้าของ เช่น สรุป debug ของ Active Memory
- บรรทัด trace สามารถปรากฏใน `/status` และเป็นข้อความวินิจฉัยตามหลังหลังจากคำตอบปกติของ assistant

## การมองเห็น reasoning (/reasoning)

- ระดับ: `on|off|stream`
- ข้อความที่มีเฉพาะคำสั่งจะสลับว่าจะแสดง thinking blocks ในคำตอบหรือไม่
- เมื่อเปิดใช้ reasoning จะถูกส่งเป็น **ข้อความแยกต่างหาก** โดยขึ้นต้นด้วย `Reasoning:`
- `stream` (เฉพาะ Telegram): สตรีม reasoning ลงใน draft bubble ของ Telegram ระหว่างที่กำลังสร้างคำตอบ แล้วส่งคำตอบสุดท้ายโดยไม่มี reasoning
- นามแฝง: `/reason`
- ส่ง `/reasoning` (หรือ `/reasoning:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับ reasoning ปัจจุบัน
- ลำดับการแก้ไขค่า: คำสั่งแบบอินไลน์ จากนั้นการทับค่า session จากนั้นค่าเริ่มต้นต่อ agent (`agents.list[].reasoningDefault`) จากนั้นค่าถอยกลับ (`off`)

แท็ก reasoning ของ local-model ที่ผิดรูปแบบจะถูกจัดการอย่างระมัดระวัง บล็อก `<think>...</think>` ที่ปิดแล้วจะยังคงถูกซ่อนในคำตอบปกติ และ reasoning ที่ไม่ได้ปิดหลังข้อความที่มองเห็นแล้วก็จะถูกซ่อนด้วยเช่นกัน หากคำตอบถูกครอบทั้งหมดด้วยแท็กเปิดที่ไม่ได้ปิดเพียงแท็กเดียว และมิฉะนั้นจะส่งเป็นข้อความว่าง OpenClaw จะลบแท็กเปิดที่ผิดรูปแบบและส่งข้อความที่เหลือ

## ที่เกี่ยวข้อง

- เอกสารโหมด Elevated อยู่ที่ [Elevated mode](/th/tools/elevated)

## Heartbeats

- เนื้อหา Heartbeat probe คือ prompt heartbeat ที่ตั้งค่าไว้ (ค่าเริ่มต้น: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`) คำสั่งแบบอินไลน์ในข้อความ heartbeat จะใช้ตามปกติ (แต่หลีกเลี่ยงการเปลี่ยนค่าเริ่มต้น session จาก heartbeats)
- การส่ง Heartbeat ใช้ค่าเริ่มต้นเป็น payload สุดท้ายเท่านั้น หากต้องการส่งข้อความ `Reasoning:` แยกด้วย (เมื่อมี) ให้ตั้งค่า `agents.defaults.heartbeat.includeReasoning: true` หรือ `agents.list[].heartbeat.includeReasoning: true` ต่อ agent

## UI เว็บแชต

- ตัวเลือก thinking ในเว็บแชตจะสะท้อนระดับที่จัดเก็บไว้ของเซสชันจาก session store/config ขาเข้าเมื่อหน้าโหลด
- การเลือกระดับอื่นจะเขียนการ override ของเซสชันทันทีผ่าน `sessions.patch`; จะไม่รอการส่งครั้งถัดไป และไม่ใช่การ override แบบครั้งเดียวด้วย `thinkingOnce`
- ตัวเลือกแรกเป็นตัวเลือกล้างการ override เสมอ โดยจะแสดง `Inherited: <resolved level>` เมื่อเซสชันสืบทอดค่าเริ่มต้นที่มีผลซึ่งไม่ใช่ off หรือแสดง `Off` เมื่อ thinking ที่สืบทอดมาถูกปิดใช้งาน
- ตัวเลือกในตัวเลือกที่ระบุชัดเจนจะถูกติดป้ายว่าเป็นการ override พร้อมคงป้ายกำกับของผู้ให้บริการไว้เมื่อมีอยู่ (เช่น `Override: maximum` สำหรับตัวเลือก `max` ที่ผู้ให้บริการติดป้ายกำกับไว้)
- ตัวเลือกใช้ `thinkingLevels` ที่ส่งคืนโดยแถว/ค่าเริ่มต้นของเซสชัน Gateway โดยคง `thinkingOptions` ไว้เป็นรายการป้ายกำกับแบบ legacy UI ของเบราว์เซอร์จะไม่เก็บรายการ regex ของผู้ให้บริการเอง; Plugin เป็นเจ้าของชุดระดับเฉพาะโมเดล
- `/think:<level>` ยังคงทำงานและอัปเดตระดับเซสชันที่จัดเก็บเดียวกัน ดังนั้น directive ของแชตและตัวเลือกจึงซิงก์กันอยู่เสมอ

## โปรไฟล์ผู้ให้บริการ

- Plugin ของผู้ให้บริการสามารถเปิดเผย `resolveThinkingProfile(ctx)` เพื่อกำหนดระดับที่โมเดลรองรับและค่าเริ่มต้น
- Plugin ของผู้ให้บริการที่พร็อกซีโมเดล Claude ควรใช้ `resolveClaudeThinkingProfile(modelId)` จาก `openclaw/plugin-sdk/provider-model-shared` ซ้ำ เพื่อให้แค็ตตาล็อก Anthropic โดยตรงและแค็ตตาล็อกพร็อกซีสอดคล้องกัน
- แต่ละระดับของโปรไฟล์มี `id` แบบ canonical ที่จัดเก็บไว้ (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` หรือ `max`) และอาจมี `label` สำหรับแสดงผล ผู้ให้บริการแบบไบนารีใช้ `{ id: "low", label: "on" }`
- Tool Plugin ที่จำเป็นต้องตรวจสอบการ override thinking ที่ระบุชัดเจนควรใช้ `api.runtime.agent.resolveThinkingPolicy({ provider, model })` ร่วมกับ `api.runtime.agent.normalizeThinkingLevel(...)`; ไม่ควรเก็บรายการระดับของผู้ให้บริการ/โมเดลเอง
- Tool Plugin ที่เข้าถึง metadata ของโมเดลแบบกำหนดเองที่ตั้งค่าไว้ได้ สามารถส่ง `catalog` เข้าไปใน `resolveThinkingPolicy` เพื่อให้ opt-in ของ `compat.supportedReasoningEfforts` สะท้อนในการตรวจสอบฝั่ง Plugin
- hook แบบ legacy ที่เผยแพร่แล้ว (`supportsXHighThinking`, `isBinaryThinking` และ `resolveDefaultThinkingLevel`) ยังคงเป็น adapter เพื่อความเข้ากันได้ แต่ชุดระดับแบบกำหนดเองใหม่ควรใช้ `resolveThinkingProfile`
- แถว/ค่าเริ่มต้นของ Gateway เปิดเผย `thinkingLevels`, `thinkingOptions` และ `thinkingDefault` เพื่อให้ไคลเอนต์ ACP/แชตแสดงผล id และป้ายกำกับโปรไฟล์เดียวกับที่การตรวจสอบ runtime ใช้
