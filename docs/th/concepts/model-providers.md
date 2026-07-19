---
read_when:
    - คุณต้องการเอกสารอ้างอิงการตั้งค่าโมเดลแยกตามผู้ให้บริการแต่ละราย
    - คุณต้องการตัวอย่างการกำหนดค่าหรือคำสั่งเริ่มต้นใช้งานผ่าน CLI สำหรับผู้ให้บริการโมเดล
sidebarTitle: Model providers
summary: ภาพรวมผู้ให้บริการโมเดล พร้อมตัวอย่างการกำหนดค่าและขั้นตอนการใช้งาน CLI
title: ผู้ให้บริการโมเดล
x-i18n:
    generated_at: "2026-07-19T07:07:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4c0240811ced123bb58c862b08bb91110d211bc74074f7a48acb5bb87295838d
    source_path: concepts/model-providers.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับ **ผู้ให้บริการ LLM/โมเดล** (ไม่ใช่ช่องทางแชตอย่าง WhatsApp/Telegram) สำหรับกฎการเลือกโมเดล โปรดดู [โมเดล](/th/concepts/models)

## กฎฉบับย่อ

<AccordionGroup>
  <Accordion title="การอ้างอิงโมเดลและตัวช่วย CLI">
    - การอ้างอิงโมเดลใช้ `provider/model` (ตัวอย่าง: `opencode/claude-opus-4-6`)
    - `agents.defaults.models` จัดเก็บนามแฝงและการตั้งค่ารายโมเดล ส่วน `agents.defaults.modelPolicy.allow` คือรายการอนุญาตสำหรับการแทนที่แบบระบุชัดเจนที่เป็นทางเลือก
    - ตัวช่วย CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` ตั้งค่าเริ่มต้นระดับผู้ให้บริการ ส่วน `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` ใช้แทนที่ค่าเหล่านั้นเป็นรายโมเดล
    - กฎการสำรอง การตรวจสอบช่วงพักการใช้งาน และการคงอยู่ของการแทนที่ระดับเซสชัน: [การสลับโมเดลเมื่อเกิดข้อผิดพลาด](/th/concepts/model-failover)

  </Accordion>
  <Accordion title="การเพิ่มการยืนยันตัวตนของผู้ให้บริการจะไม่เปลี่ยนโมเดลหลัก">
    `openclaw configure` จะคง `agents.defaults.model.primary` ที่มีอยู่ไว้เมื่อเพิ่มหรือยืนยันตัวตนของผู้ให้บริการอีกครั้ง `openclaw models auth login` ทำเช่นเดียวกัน เว้นแต่จะส่ง `--set-default` Plugin ของผู้ให้บริการอาจยังส่งคืนโมเดลเริ่มต้นที่แนะนำในแพตช์การกำหนดค่าการยืนยันตัวตน แต่เมื่อมีโมเดลหลักอยู่แล้ว OpenClaw จะตีความสิ่งนี้ว่า "ทำให้โมเดลนี้พร้อมใช้งาน" ไม่ใช่ "แทนที่โมเดลหลักปัจจุบัน"

    หากต้องการเปลี่ยนโมเดลเริ่มต้นโดยตั้งใจ ให้ใช้ `openclaw models set <provider/model>` หรือ `openclaw models auth login --provider <id> --set-default`

  </Accordion>
  <Accordion title="การแยกผู้ให้บริการ/รันไทม์ของ OpenAI">
    การอ้างอิงโมเดล OpenAI และรันไทม์เอเจนต์แยกออกจากกัน:

    - `openai/<model>` เลือกผู้ให้บริการและโมเดล OpenAI มาตรฐาน คำนำหน้าเพียงอย่างเดียวจะไม่เลือก Codex
    - เมื่อไม่ได้ตั้งค่านโยบายรันไทม์ระดับผู้ให้บริการ/โมเดล หรือกำหนดเป็น `auto` OpenAI อาจเลือก Codex โดยนัยได้เฉพาะสำหรับเส้นทาง HTTPS อย่างเป็นทางการที่ตรงกันทุกประการของ Platform Responses หรือ ChatGPT Responses ซึ่งไม่มีการแทนที่คำขอที่ผู้ใช้กำหนด
    - อะแดปเตอร์ Completions ที่กำหนดขึ้นเอง ปลายทางแบบกำหนดเอง และเส้นทางที่มีพฤติกรรมคำขอที่กำหนดขึ้นเองจะยังคงทำงานบน OpenClaw ปลายทาง HTTP แบบข้อความธรรมดาอย่างเป็นทางการจะถูกปฏิเสธ
    - การอ้างอิงโมเดล Codex แบบเดิมคือการกำหนดค่าแบบเดิมที่ doctor จะเขียนใหม่เป็น `openai/<model>`
    - `agentRuntime.id: "openclaw"` ระดับผู้ให้บริการ/โมเดลจะกำหนดให้เส้นทางที่มีคุณสมบัติเหมาะสมยังคงทำงานบน OpenClaw อย่างชัดเจน ส่วน `agentRuntime.id: "codex"` กำหนดให้ต้องใช้ Codex และจะปิดการทำงานเมื่อเกิดข้อผิดพลาด หากเส้นทางที่มีผลไม่เข้ากันกับ Codex

    โปรดดู [รันไทม์เอเจนต์โดยนัยของ OpenAI](/th/providers/openai#implicit-agent-runtime) และ [ชุดควบคุม Codex](/th/plugins/codex-harness) หากการแยกผู้ให้บริการ/รันไทม์ทำให้สับสน ให้อ่าน [รันไทม์เอเจนต์](/th/concepts/agent-runtimes) ก่อน

    การเปิดใช้ Plugin อัตโนมัติเป็นไปตามขอบเขตเดียวกัน: เส้นทางที่มีผลและเข้ากันกับ Codex โดยนัยสามารถเปิดใช้ Plugin Codex ได้ ขณะที่ `agentRuntime.id: "codex"` ระดับผู้ให้บริการ/โมเดลแบบระบุชัดเจน หรือการอ้างอิง `codex/<model>` แบบเดิมกำหนดให้ต้องใช้ Plugin นี้ คำนำหน้า `openai/*` เพียงอย่างเดียวไม่กำหนดให้ใช้

    การตั้งค่า OpenAI ใหม่ใช้การอ้างอิง GPT-5.6 ที่เฉพาะเจาะจงตามเส้นทาง: การตั้งค่าด้วยคีย์ API จะเลือก
    `openai/gpt-5.6` (รหัส API โดยตรงแบบไม่มีส่วนขยายจะชี้ไปยัง Sol) ขณะที่
    OAuth ของ ChatGPT/Codex จะเลือก `openai/gpt-5.6-sol` ที่ตรงกันทุกประการสำหรับแค็ตตาล็อก Codex
    แบบเนทีฟ โมเดลหลักแบบระบุชัดเจนที่มีอยู่ รวมถึง `openai/gpt-5.5` จะถูก
    คงไว้เมื่อเพิ่มหรือรีเฟรชการยืนยันตัวตน OpenAI GPT-5.5 ยังคงพร้อมใช้งาน
    ผ่านรันไทม์ทั้งสองในฐานะตัวเลือกการกู้คืนแบบระบุชัดเจนสำหรับบัญชีที่ไม่มี
    สิทธิ์เข้าถึง GPT-5.6

  </Accordion>
  <Accordion title="รันไทม์ CLI">
    รันไทม์ CLI ใช้การแยกแบบเดียวกัน: เลือกการอ้างอิงโมเดลมาตรฐาน เช่น `anthropic/claude-*` หรือ `google/gemini-*` จากนั้นตั้งค่านโยบายรันไทม์ระดับผู้ให้บริการ/โมเดลเป็น `claude-cli` หรือ `google-gemini-cli` เมื่อต้องการแบ็กเอนด์ CLI ภายในเครื่อง

    การอ้างอิง `claude-cli/*` และ `google-gemini-cli/*` แบบเดิมจะย้ายกลับไปเป็นการอ้างอิงผู้ให้บริการมาตรฐาน โดยบันทึกรันไทม์แยกต่างหาก การอ้างอิง `codex-cli/*` แบบเดิมจะย้ายไปยัง `openai/*` และใช้เส้นทางเซิร์ฟเวอร์แอป Codex โดย OpenClaw ไม่ได้เก็บแบ็กเอนด์ CLI ของ Codex ที่รวมมาในชุดอีกต่อไป

  </Accordion>
</AccordionGroup>

## กำหนดค่าผู้ให้บริการใน Control UI

เปิด **Settings → Model Providers** ใน Control UI เพื่อเพิ่ม แทนที่ หรือลบคีย์ API ของผู้ให้บริการที่จัดเก็บไว้ใน `models.providers.<id>.apiKey` หน้านี้ระบุว่าคีย์ API แต่ละรายการมาจากการกำหนดค่า OpenClaw หรือตัวแปรสภาพแวดล้อม โดยไม่แสดงข้อมูลประจำตัว คีย์ที่มาจากสภาพแวดล้อมจะยังคงได้รับการจัดการโดยสภาพแวดล้อมของกระบวนการ Gateway

ใช้ **Test connection** เพื่อเรียกใช้การตรวจสอบผู้ให้บริการแบบสด และดูเวลาแฝงหรือข้อผิดพลาดที่จัดหมวดหมู่เป็นการยืนยันตัวตน ขีดจำกัดอัตรา การเรียกเก็บเงิน หมดเวลา หรือการตอบกลับ การตรวจสอบจะส่งคำขอจริงไปยังผู้ให้บริการและอาจใช้โทเค็นจำนวนเล็กน้อย นอกจากนี้ยังสามารถออกจากระบบโปรไฟล์ OAuth และโทเค็นจากการ์ดผู้ให้บริการได้

การ์ด **Default models** ใช้จัดการโมเดลหลัก โมเดลสำรองตามลำดับ และโมเดลยูทิลิตีจากแค็ตตาล็อกโมเดลที่กำหนดค่าไว้ เลือกโมเดล แล้วบันทึกพร้อมกันไปยังการตั้งค่า `agents.defaults.model` และ `agents.defaults.utilityModel` ที่มีอยู่ สำหรับโมเดลยูทิลิตี **Automatic** จะไม่ตั้งค่า และ **Disabled** จะจัดเก็บสตริงว่างเพื่อปิดการกำหนดเส้นทางยูทิลิตี

## พฤติกรรมผู้ให้บริการที่ Plugin เป็นเจ้าของ

ตรรกะเฉพาะของผู้ให้บริการส่วนใหญ่อยู่ใน Plugin ของผู้ให้บริการ (`registerProvider(...)`) ขณะที่ OpenClaw เก็บลูปการอนุมานทั่วไปไว้ Plugin เป็นเจ้าของการเริ่มต้นใช้งาน แค็ตตาล็อกโมเดล การแมปตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน การทำให้การขนส่ง/การกำหนดค่าเป็นมาตรฐาน การล้างสคีมาเครื่องมือ การจำแนกการสลับเมื่อเกิดข้อผิดพลาด การรีเฟรช OAuth การรายงานการใช้งาน โปรไฟล์การคิด/การให้เหตุผล และอื่นๆ

รายการฮุกของ SDK สำหรับผู้ให้บริการและตัวอย่าง Plugin ที่รวมมาในชุดทั้งหมดอยู่ใน [Plugin ของผู้ให้บริการ](/th/plugins/sdk-provider-plugins) ผู้ให้บริการที่ต้องใช้ตัวดำเนินการคำขอแบบกำหนดเองทั้งหมดถือเป็นพื้นผิวส่วนขยายอีกระดับหนึ่งที่ลึกกว่าและแยกต่างหาก

<Note>
พฤติกรรมรันเนอร์ที่ผู้ให้บริการเป็นเจ้าของอยู่บนฮุกผู้ให้บริการแบบระบุชัดเจน เช่น นโยบายการเล่นซ้ำ การทำให้สคีมาเครื่องมือเป็นมาตรฐาน การห่อสตรีม และตัวช่วยการขนส่ง/คำขอ ชุดค่าคงที่ `ProviderPlugin.capabilities` แบบเดิมมีไว้เพื่อความเข้ากันได้เท่านั้น และตรรกะรันเนอร์ที่ใช้ร่วมกันจะไม่อ่านอีกต่อไป
</Note>

## การหมุนเวียนคีย์ API

<AccordionGroup>
  <Accordion title="แหล่งที่มาของคีย์และลำดับความสำคัญ">
    กำหนดค่าคีย์หลายรายการผ่าน:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (การแทนที่แบบสดรายการเดียว มีลำดับความสำคัญสูงสุด)
    - `<PROVIDER>_API_KEYS` (รายการคั่นด้วยจุลภาคหรืออัฒภาค)
    - `<PROVIDER>_API_KEY` (คีย์หลัก)
    - `<PROVIDER>_API_KEY_*` (รายการแบบมีหมายเลข เช่น `<PROVIDER>_API_KEY_1`)

    สำหรับผู้ให้บริการ Google จะรวม `GOOGLE_API_KEY` เป็นตัวสำรองด้วย ลำดับการเลือกคีย์จะรักษาลำดับความสำคัญและลบค่าที่ซ้ำกัน

  </Accordion>
  <Accordion title="การหมุนเวียนเริ่มทำงานเมื่อใด">
    - คำขอจะถูกลองใหม่ด้วยคีย์ถัดไปเฉพาะเมื่อได้รับการตอบกลับเกี่ยวกับขีดจำกัดอัตราเท่านั้น (ตัวอย่างเช่น `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` หรือข้อความขีดจำกัดการใช้งานเป็นระยะ)
    - ความล้มเหลวที่ไม่เกี่ยวกับขีดจำกัดอัตราจะล้มเหลวทันที โดยจะไม่พยายามหมุนเวียนคีย์
    - เมื่อคีย์ที่เป็นตัวเลือกทั้งหมดล้มเหลว ระบบจะส่งคืนข้อผิดพลาดสุดท้ายจากความพยายามครั้งล่าสุด

  </Accordion>
</AccordionGroup>

## Plugin ผู้ให้บริการอย่างเป็นทางการ

Plugin ผู้ให้บริการอย่างเป็นทางการเผยแพร่แถวแค็ตตาล็อกโมเดลของตนเอง ผู้ให้บริการเหล่านี้ **ไม่ต้องใช้** รายการโมเดล `models.providers` เพียงเปิดใช้ Plugin ผู้ให้บริการ ตั้งค่าการยืนยันตัวตน และเลือกโมเดล ใช้ `models.providers` เฉพาะสำหรับผู้ให้บริการแบบกำหนดเองที่ระบุชัดเจน หรือการตั้งค่าคำขอเฉพาะด้าน เช่น การหมดเวลา

### OpenAI

- ผู้ให้บริการ: `openai`
- การยืนยันตัวตน: `OPENAI_API_KEY`
- การหมุนเวียนที่เป็นทางเลือก: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` รวมถึง `OPENCLAW_LIVE_OPENAI_KEY` (การแทนที่รายการเดียว)
- ค่าเริ่มต้นสำหรับการตั้งค่าใหม่: `openai/gpt-5.6`; บน API โดยตรง รหัสแบบไม่มีส่วนขยายจะชี้ไปยัง Sol
- ตัวอย่างโมเดล: `openai/gpt-5.6`, `openai/gpt-5.6-terra`, `openai/gpt-5.6-luna`, `openai/gpt-5.5`
- ตรวจสอบความพร้อมใช้งานของบัญชี/โมเดลด้วย `openclaw models list --provider openai` หากการติดตั้งหรือคีย์ API เฉพาะรายการมีพฤติกรรมแตกต่างออกไป
- CLI: `openclaw onboard --auth-choice openai-api-key`
- การขนส่งเริ่มต้นคือ `auto`; OpenClaw จะส่งตัวเลือกการขนส่งไปยังรันไทม์โมเดลที่ใช้ร่วมกัน
- แทนที่เป็นรายโมเดลผ่าน `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- สามารถเปิดใช้การประมวลผลแบบมีลำดับความสำคัญของ OpenAI ผ่าน `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` และ `params.fastMode` จะแมปคำขอ Responses `openai/*` โดยตรงไปยัง `service_tier=priority` บน `api.openai.com`
- ใช้ `params.serviceTier` เมื่อต้องการระดับแบบระบุชัดเจนแทนสวิตช์ `/fast` ที่ใช้ร่วมกัน
- ส่วนหัวการระบุแหล่งที่มาของ OpenClaw ที่ซ่อนอยู่ (`originator`, `version`, `User-Agent`) จะใช้เฉพาะกับการรับส่งข้อมูล OpenAI แบบเนทีฟไปยัง `api.openai.com` ไม่ใช้กับพร็อกซีที่เข้ากันได้กับ OpenAI แบบทั่วไป
- เส้นทาง OpenAI แบบเนทีฟยังคงเก็บ `store` ของ Responses คำใบ้แคชพรอมต์ และการจัดรูปเพย์โหลดที่เข้ากันได้กับการให้เหตุผลของ OpenAI ส่วนเส้นทางพร็อกซีจะไม่เก็บ
- `openai/gpt-5.3-codex-spark` พร้อมใช้งานผ่าน OAuth ของ ChatGPT/Codex เท่านั้น เส้นทางคีย์ API ของ OpenAI โดยตรงและคีย์ API ของ Azure จะปฏิเสธ

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
}
```

หากองค์กร API ไม่ได้เปิดให้ใช้ GPT-5.6 ให้ตั้งค่า
`openai/gpt-5.5` อย่างชัดเจน การเริ่มต้นใช้งานและการยืนยันตัวตนอีกครั้งตามปกติจะคง
โมเดลหลักแบบระบุชัดเจนที่มีอยู่ไว้ ส่วน `models auth login --set-default` และ
`models set` คือเส้นทางสำหรับการแทนที่โดยตั้งใจ

### Anthropic

- ผู้ให้บริการ: `anthropic`
- การยืนยันตัวตน: `ANTHROPIC_API_KEY`
- การหมุนเวียนที่เป็นทางเลือก: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` รวมถึง `OPENCLAW_LIVE_ANTHROPIC_KEY` (การแทนที่รายการเดียว)
- ตัวอย่างโมเดล: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- คำขอ Anthropic สาธารณะโดยตรงรองรับสวิตช์ `/fast` ที่ใช้ร่วมกันและ `params.fastMode` รวมถึงการรับส่งข้อมูลที่ยืนยันตัวตนด้วยคีย์ API และ OAuth ซึ่งส่งไปยัง `api.anthropic.com`; OpenClaw จะแมปสิ่งนี้ไปยัง `service_tier` ของ Anthropic (`auto` เทียบกับ `standard_only`)
- การกำหนดค่า Claude CLI ที่แนะนำจะคงการอ้างอิงโมเดลให้เป็นมาตรฐานและเลือกแบ็กเอนด์
  CLI แยกต่างหาก: `anthropic/claude-opus-4-8` พร้อม
  `agentRuntime.id: "claude-cli"` ที่มีขอบเขตระดับโมเดล การอ้างอิง
  `claude-cli/claude-opus-4-7` แบบเดิมยังคงทำงานเพื่อความเข้ากันได้

<Note>
การใช้ Claude CLI ซ้ำ (`claude -p`) เป็นเส้นทางการผสานรวม OpenClaw ที่ได้รับอนุญาต การยืนยันตัวตนด้วยโทเค็นการตั้งค่าของ Anthropic ยังคงรองรับ แต่ OpenClaw แนะนำให้ใช้ Claude CLI ซ้ำเมื่อพร้อมใช้งาน
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth ของ OpenAI ChatGPT/Codex

- ผู้ให้บริการ: `openai`
- การยืนยันตัวตน: OAuth (ChatGPT)
- การอ้างอิง harness ของ Codex app-server แบบเนทีฟสำหรับการตั้งค่าใหม่: `openai/gpt-5.6-sol`
- เอกสาร harness ของ Codex app-server แบบเนทีฟ: [Codex harness](/th/plugins/codex-harness)
- การอ้างอิงโมเดลแบบเดิม: `codex/gpt-*`, `openai-codex/gpt-*`
- ขอบเขต Plugin: `openai/*` โหลด Plugin ของ OpenAI โดยนโยบายรันไทม์ที่ระบุไว้อย่างชัดเจนหรือเส้นทางที่มีผลซึ่งผู้ให้บริการเป็นเจ้าของจะเป็นตัวกำหนดว่าจะเลือก Plugin ของ Codex app-server แบบเนทีฟหรือไม่
- CLI: `openclaw onboard --auth-choice openai` หรือ `openclaw models auth login --provider openai`
- การรับส่งข้อมูล ChatGPT Responses ที่ฝังอยู่ใน OpenClaw ใช้ค่าเริ่มต้นเป็น `auto` (ใช้ WebSocket ก่อน และสำรองด้วย SSE)
- `agents.defaults.models["openai/<model>"].params.transport`, `params.serviceTier` และ `params.fastMode` เป็นการตั้งค่าคำขอแบบฝังที่กำหนดไว้ โดยคงการเลือกรันไทม์โดยนัยไว้ที่ OpenClaw ส่วน Codex แบบเนทีฟจะควบคุมการรับส่งข้อมูล app-server และระดับบริการของตนเอง
- ส่วนหัวระบุแหล่งที่มาของ OpenClaw ที่ซ่อนไว้ (`originator`, `version`, `User-Agent`) จะแนบเฉพาะกับทราฟฟิก Codex แบบเนทีฟที่ส่งไปยัง `chatgpt.com/backend-api` เท่านั้น ไม่ใช่พร็อกซีทั่วไปที่เข้ากันได้กับ OpenAI
- ตัวสลับ `/fast` ที่ใช้ร่วมกันยังคงพร้อมใช้งานเป็นตัวควบคุมรันไทม์ และแยกต่างหากจากพารามิเตอร์โมเดลที่กำหนดไว้
- แค็ตตาล็อก Codex แบบเนทีฟสามารถแสดงการอ้างอิง `openai/gpt-5.6-sol`, `openai/gpt-5.6-terra` และ `openai/gpt-5.6-luna` ที่ตรงกันทุกประการตามสิทธิ์การเข้าถึงของบัญชี โดยจะไม่นำนามแฝงเปล่า `gpt-5.6` ของ API โดยตรงมาใช้ในฝั่งไคลเอนต์
- `openai/gpt-5.5` ใช้ `contextWindow = 400000` แบบเนทีฟของแค็ตตาล็อก Codex และรันไทม์เริ่มต้น `contextTokens = 272000`; เขียนทับขีดจำกัดรันไทม์ด้วย `models.providers.openai.models[].contextTokens`
- ลงชื่อเข้าใช้ด้วยการยืนยันตัวตน `openai` และใช้ `openai/gpt-5.6-sol` สำหรับการตั้งค่าใหม่ที่รองรับด้วยการสมัครสมาชิก เลือก `openai/gpt-5.5` อย่างชัดเจนหากพื้นที่ทำงาน Codex นั้นไม่เปิดให้ใช้ GPT-5.6
- ใช้ผู้ให้บริการ/โมเดล `agentRuntime.id: "openclaw"` เพื่อคงเส้นทางที่มีคุณสมบัติเหมาะสมไว้บนรันไทม์ในตัว หากไม่ได้ตั้งค่ารันไทม์หรือใช้ `auto` จะมีเพียงเส้นทาง HTTPS Responses/ChatGPT อย่างเป็นทางการที่ตรงกันทุกประการและไม่มีการเขียนทับคำขอที่กำหนดไว้เท่านั้นที่อาจเลือก Codex โดยนัย
- การอ้างอิง Codex GPT แบบเดิมเป็นสถานะเก่า ไม่ใช่เส้นทางผู้ให้บริการที่ใช้งานอยู่ ใช้การอ้างอิง `openai/*` มาตรฐานสำหรับการกำหนดค่าเอเจนต์ใหม่ และเรียกใช้ `openclaw doctor --fix` เพื่อย้ายการอ้างอิง `codex/*` และ `openai-codex/*` พร้อมคงความหมายของ Codex แบบเนทีฟไว้ด้วย `agentRuntime.id: "codex"` ที่กำหนดขอบเขตตามโมเดล การเลือก `openai/gpt-5.5` มาตรฐานที่ระบุไว้อย่างชัดเจนซึ่งมีอยู่แล้วจะไม่ได้รับการอัปเกรด

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
    },
  },
}
```

```json5
{
  models: {
    providers: {
      openai: {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### ตัวเลือกโฮสต์รูปแบบการสมัครสมาชิกอื่นๆ

<CardGroup cols={3}>
  <Card title="MiniMax" href="/th/providers/minimax">
    เข้าถึง MiniMax Coding Plan ผ่าน OAuth หรือคีย์ API
  </Card>
  <Card title="Qwen Cloud" href="/th/providers/qwen">
    อินเทอร์เฟซผู้ให้บริการ Qwen Cloud พร้อมการแมปปลายทาง Alibaba DashScope และ Coding Plan
  </Card>
  <Card title="Z.AI (GLM)" href="/th/providers/zai">
    Coding Plan ของ Z.AI หรือปลายทาง API ทั่วไป
  </Card>
</CardGroup>

### OpenCode

- การยืนยันตัวตน: `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`)
- ผู้ให้บริการรันไทม์ Zen: `opencode`
- ผู้ให้บริการรันไทม์ Go: `opencode-go`
- โมเดลตัวอย่าง: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` หรือ `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (คีย์ API)

- ผู้ให้บริการ: `google`
- การยืนยันตัวตน: `GEMINI_API_KEY`
- การหมุนเวียนที่เลือกใช้ได้: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, การสำรองด้วย `GOOGLE_API_KEY` และ `OPENCLAW_LIVE_GEMINI_KEY` (เขียนทับรายการเดียว)
- โมเดลตัวอย่าง: `google/gemini-3.1-pro-preview`, `google/gemini-3.5-flash`
- ความเข้ากันได้: การกำหนดค่า OpenClaw แบบเดิมที่ใช้ `google/gemini-3.1-flash-preview` จะถูกปรับให้อยู่ในรูปแบบ `google/gemini-3-flash-preview`
- นามแฝง: ระบบยอมรับ `google/gemini-3.1-pro` และปรับให้อยู่ในรูปแบบ ID ของ Gemini API ที่ใช้งานจริงของ Google ซึ่งก็คือ `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- การคิด: `/think adaptive` ใช้การคิดแบบไดนามิกของ Google โดย Gemini 3/3.1 จะละเว้น `thinkingLevel` แบบคงที่ ส่วน Gemini 2.5 จะส่ง `thinkingBudget: -1`
- การเรียกใช้ Gemini โดยตรงยังยอมรับ `agents.defaults.models["google/<model>"].params.cachedContent` (หรือ `cached_content` แบบเดิม) เพื่อส่งต่อแฮนเดิล `cachedContents/...` แบบเนทีฟของผู้ให้บริการ โดยแคชฮิตของ Gemini จะแสดงเป็น `cacheRead` ของ OpenClaw

### Google Vertex และ Gemini CLI

- ผู้ให้บริการ: `google-vertex`, `google-gemini-cli`
- การยืนยันตัวตน: Vertex ใช้ gcloud ADC ส่วน Gemini CLI ใช้ขั้นตอน OAuth ของตนเอง

<Warning>
Gemini CLI OAuth ใน OpenClaw เป็นการผสานรวมที่ไม่เป็นทางการ ผู้ใช้บางรายรายงานว่าบัญชี Google ถูกจำกัดหลังจากใช้ไคลเอนต์ของบุคคลที่สาม โปรดตรวจสอบข้อกำหนดของ Google และใช้บัญชีที่ไม่สำคัญหากเลือกดำเนินการต่อ
</Warning>

Gemini CLI จัดส่งเป็นส่วนหนึ่งของ Plugin `google` ที่รวมมาให้

<Steps>
  <Step title="ติดตั้ง Gemini CLI">
    <Tabs>
      <Tab title="brew">
        ```bash
        brew install gemini-cli
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @google/gemini-cli
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="เปิดใช้งาน Plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="เข้าสู่ระบบ">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    โมเดลเริ่มต้น: `google-gemini-cli/gemini-3-flash-preview` ไม่ต้องวาง Client ID หรือ Secret ลงใน `openclaw.json` ขั้นตอนเข้าสู่ระบบของ CLI จะจัดเก็บโทเค็นไว้ในโปรไฟล์การยืนยันตัวตนบนโฮสต์ Gateway

  </Step>
  <Step title="ตั้งค่าโปรเจกต์ (หากจำเป็น)">
    หากคำขอล้มเหลวหลังจากเข้าสู่ระบบ ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway
  </Step>
</Steps>

Gemini CLI ใช้ `stream-json` เป็นค่าเริ่มต้น OpenClaw จะอ่านข้อความสตรีม
ของผู้ช่วยและปรับ `stats.cached` ให้อยู่ในรูปแบบ `cacheRead`; การเขียนทับ
`--output-format json` แบบเดิมยังคงอ่านข้อความตอบกลับจาก `response`

### Z.AI (GLM)

- ผู้ให้บริการ: `zai`
- การยืนยันตัวตน: `ZAI_API_KEY`
- โมเดลตัวอย่าง: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - การอ้างอิงโมเดลใช้ ID ผู้ให้บริการ `zai/*` มาตรฐาน
  - `zai-api-key` ตรวจหาปลายทาง Z.AI ที่ตรงกันโดยอัตโนมัติ ส่วน `zai-coding-global`, `zai-coding-cn`, `zai-global` และ `zai-cn` จะบังคับใช้อินเทอร์เฟซที่ระบุ

### Vercel AI Gateway

- ผู้ให้บริการ: `vercel-ai-gateway`
- การยืนยันตัวตน: `AI_GATEWAY_API_KEY`
- โมเดลตัวอย่าง: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Plugin ผู้ให้บริการอื่นๆ ที่รวมมาให้

| ผู้ให้บริการ                             | Id                               | ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน              | โมเดลตัวอย่าง                                           |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| Arcee                                   | `arcee`                          | `ARCEEAI_API_KEY` หรือ `OPENROUTER_API_KEY`            | `arcee/trinity-large-thinking`                         |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                        |
| Cerebras                                | `cerebras`                       | `CEREBRAS_API_KEY`                                   | `cerebras/zai-glm-4.7`                                 |
| Chutes                                  | `chutes`                         | `CHUTES_API_KEY` หรือ `CHUTES_OAUTH_TOKEN`             | `chutes/zai-org/GLM-5-TEE`                             |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`               |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-plus-05-2026`                        |
| DeepInfra                               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                  | `deepinfra/deepseek-ai/DeepSeek-V4-Flash`              |
| DeepSeek                                | `deepseek`                       | `DEEPSEEK_API_KEY`                                   | `deepseek/deepseek-v4-flash`                           |
| Featherless AI                          | `featherless`                    | `FEATHERLESS_API_KEY`                                | `featherless/Qwen/Qwen3-32B`                           |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                      |
| GMI Cloud                               | `gmi`                            | `GMI_API_KEY`                                        | `gmi/google/gemini-3.1-flash-lite`                     |
| Groq                                    | `groq`                           | `GROQ_API_KEY`                                       | `groq/llama-3.3-70b-versatile`                         |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` หรือ `HF_TOKEN`                | `huggingface/deepseek-ai/DeepSeek-R1`                  |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                   |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                         |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                   |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`             |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                     |
| [Ollama Cloud](/th/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                               |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth หรือ `OPENROUTER_API_KEY`             | `openrouter/auto`                                      |
| Qianfan                                 | `qianfan`                        | `QIANFAN_API_KEY`                                    | `qianfan/deepseek-v3.2`                                |
| Tencent TokenHub                        | `tencent-tokenhub`               | `TOKENHUB_API_KEY`                                   | `tencent-tokenhub/hy3-preview`                         |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`     |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                      |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`          |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                      |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth หรือ `XAI_API_KEY`           | `xai/grok-4.3`                                         |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2.5` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### ลักษณะเฉพาะที่ควรทราบ

<AccordionGroup>
  <Accordion title="OpenRouter">
    ใช้ส่วนหัวการระบุแหล่งที่มาของแอปและเครื่องหมาย Anthropic `cache_control` เฉพาะในเส้นทาง `openrouter.ai` ที่ผ่านการตรวจสอบแล้วเท่านั้น การอ้างอิง DeepSeek, Moonshot และ ZAI มีสิทธิ์ใช้ TTL ของแคชสำหรับการแคชพรอมต์ที่จัดการโดย OpenRouter แต่จะไม่ได้รับเครื่องหมายแคชของ Anthropic เนื่องจากเป็นเส้นทางที่เข้ากันได้กับ OpenAI แบบพร็อกซี จึงข้ามการปรับรูปแบบที่ใช้เฉพาะกับ OpenAI แบบเนทีฟ (`serviceTier`, Responses `store`, คำแนะนำแคชพรอมต์ และความเข้ากันได้ด้านการให้เหตุผลของ OpenAI) การอ้างอิงที่ใช้ Gemini เป็นระบบเบื้องหลังจะคงไว้เฉพาะการปรับลายเซ็นความคิดให้ปลอดภัยสำหรับ Gemini แบบพร็อกซี
  </Accordion>
  <Accordion title="Kilo Gateway">
    การอ้างอิงที่ใช้ Gemini เป็นระบบเบื้องหลังจะใช้เส้นทางการปรับให้ปลอดภัยสำหรับ Gemini แบบพร็อกซีเดียวกัน ส่วน `kilocode/kilo-auto/balanced` และการอ้างอิงอื่นที่ไม่รองรับการให้เหตุผลผ่านพร็อกซีจะข้ามการแทรกข้อมูลการให้เหตุผลของพร็อกซี
  </Accordion>
  <Accordion title="MiniMax">
    การเริ่มต้นใช้งานด้วยคีย์ API จะเขียนคำจำกัดความโมเดลแชต M3 และ M2.7 อย่างชัดเจน ส่วนการทำความเข้าใจรูปภาพยังคงใช้ผู้ให้บริการสื่อ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
  </Accordion>
  <Accordion title="NVIDIA">
    Id ของโมเดลใช้เนมสเปซ `nvidia/<vendor>/<model>` (ตัวอย่างเช่น `nvidia/nvidia/nemotron-...`) ตัวเลือกจะรักษาองค์ประกอบ `<provider>/<model-id>` ตามตัวอักษรไว้ ขณะที่คีย์มาตรฐานซึ่งส่งไปยัง API ยังคงมีคำนำหน้าเพียงชุดเดียว
  </Accordion>
  <Accordion title="xAI">
    ใช้เส้นทาง Responses ของ xAI เส้นทางที่แนะนำคือ SuperGrok/X Premium OAuth ส่วนคีย์ API ยังคงใช้งานได้ผ่าน `XAI_API_KEY` หรือการกำหนดค่า Plugin และ Grok `web_search` จะนำโปรไฟล์การยืนยันตัวตนเดียวกันมาใช้ซ้ำก่อนสำรองไปใช้คีย์ API สามารถเลือก Grok 4.5 สำหรับงานแชต การเขียนโค้ด และงานแบบเอเจนต์ได้ในพื้นที่ที่พร้อมให้ใช้งาน ส่วน `grok-4.3` ยังคงเป็นค่าเริ่มต้นแบบรวมชุดที่ปลอดภัยตามภูมิภาค การกำหนดค่า `/fast` และ `params.fastMode: true` รุ่นเก่ายังคงได้รับการแก้ไขผ่านการเปลี่ยนเส้นทางความเข้ากันได้ของ Grok 4.3 ของ xAI แต่การกำหนดค่าใหม่ควรเลือกโมเดลปัจจุบันโดยตรง `tool_stream` เปิดใช้งานเป็นค่าเริ่มต้น ปิดใช้งานผ่าน `agents.defaults.models["xai/<model>"].params.tool_stream=false`
  </Accordion>
</AccordionGroup>

## ผู้ให้บริการผ่าน `models.providers` (URL กำหนดเอง/URL ฐาน)

ใช้ `models.providers` (หรือ `models.json`) เพื่อเพิ่มผู้ให้บริการ **กำหนดเอง** หรือพร็อกซีที่เข้ากันได้กับ OpenAI/Anthropic

Plugin ผู้ให้บริการแบบรวมชุดจำนวนมากด้านล่างเผยแพร่แค็ตตาล็อกเริ่มต้นอยู่แล้ว ใช้รายการ `models.providers.<id>` ที่ระบุอย่างชัดเจนเฉพาะเมื่อต้องการแทนที่ URL ฐาน ส่วนหัว หรือรายการโมเดลเริ่มต้น

การตรวจสอบความสามารถของโมเดลโดย Gateway จะอ่านข้อมูลเมตา `models.providers.<id>.models[]` ที่ระบุอย่างชัดเจนด้วย หากโมเดลกำหนดเองหรือโมเดลพร็อกซีรับรูปภาพได้ ให้ตั้งค่า `input: ["text", "image"]` ในโมเดลนั้น เพื่อให้เส้นทางไฟล์แนบจาก WebChat และ Node ส่งรูปภาพเป็นอินพุตโมเดลแบบเนทีฟแทนการอ้างอิงสื่อแบบข้อความเท่านั้น

`agents.defaults.models["provider/model"]` ควบคุมนามแฝงและข้อมูลเมตารายโมเดลสำหรับเอเจนต์ โดยตัวมันเองไม่ได้จำกัดการแทนที่หรือลงทะเบียนโมเดลรันไทม์ใหม่ สำหรับโมเดลของผู้ให้บริการกำหนดเอง ให้เพิ่ม `models.providers.<provider>.models[]` พร้อม `id` ที่ตรงกันเป็นอย่างน้อยด้วย และใช้ `agents.defaults.modelPolicy.allow` แยกต่างหากเมื่อต้องการจำกัดการแทนที่

### Moonshot AI (Kimi)

ติดตั้ง `@openclaw/moonshot-provider` ก่อนเริ่มต้นใช้งาน เพิ่มรายการ `models.providers.moonshot` ที่ระบุอย่างชัดเจนเฉพาะเมื่อต้องการแทนที่ URL ฐานหรือข้อมูลเมตาของโมเดล:

- ผู้ให้บริการ: `moonshot`
- การยืนยันตัวตน: `MOONSHOT_API_KEY`
- โมเดลตัวอย่าง: `moonshot/kimi-k3`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` หรือ `openclaw onboard --auth-choice moonshot-api-key-cn`

Id โมเดล Kimi:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k3`
- `moonshot/kimi-k2.7-code`
- `moonshot/kimi-k2.7-code-highspeed`
- `moonshot/kimi-k2.5`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

ดูคู่มือการตั้งค่าฉบับเต็มที่ [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)

### Kimi Coding

Kimi Coding ใช้เอนด์พอยต์ของ Moonshot AI ที่เข้ากันได้กับ Anthropic:

- ผู้ให้บริการ: `kimi`
- การยืนยันตัวตน: `KIMI_API_KEY`
- Kimi K3: `kimi/k3` (256K) หรือ `kimi/k3[1m]` (แผน 1M)
- Kimi Code: `kimi/kimi-for-coding`
- Kimi Code HighSpeed: `kimi/kimi-for-coding-highspeed`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

`kimi/kimi-code` และ `kimi/k2p5` แบบเดิมยังคงได้รับการยอมรับในฐานะ Id โมเดลเพื่อความเข้ากันได้ และจะถูกปรับให้เป็น Id โมเดล API ที่เสถียรของ Kimi

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) ให้การเข้าถึง Doubao และโมเดลอื่นๆ ในประเทศจีน

- ผู้ให้บริการ: `volcengine` (การเขียนโค้ด: `volcengine-plan`)
- การยืนยันตัวตน: `VOLCANO_ENGINE_API_KEY`
- โมเดลตัวอย่าง: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

การเริ่มต้นใช้งานใช้พื้นผิวสำหรับการเขียนโค้ดเป็นค่าเริ่มต้น แต่แค็ตตาล็อกทั่วไป `volcengine/*` จะได้รับการลงทะเบียนพร้อมกัน

ในตัวเลือกโมเดลสำหรับการเริ่มต้นใช้งาน/การกำหนดค่า ตัวเลือกการยืนยันตัวตนของ Volcengine จะให้ความสำคัญกับทั้งแถว `volcengine/*` และ `volcengine-plan/*` หากโมเดลเหล่านั้นยังไม่ถูกโหลด OpenClaw จะสำรองไปใช้แค็ตตาล็อกที่ไม่ผ่านการกรอง แทนที่จะแสดงตัวเลือกที่จำกัดขอบเขตตามผู้ให้บริการซึ่งว่างเปล่า

<Tabs>
  <Tab title="โมเดลมาตรฐาน">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2)

  </Tab>
  <Tab title="โมเดลสำหรับการเขียนโค้ด (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`

  </Tab>
</Tabs>

### BytePlus (ระหว่างประเทศ)

BytePlus ARK ให้การเข้าถึงโมเดลเดียวกันกับ Volcano Engine สำหรับผู้ใช้ระหว่างประเทศ

- ผู้ให้บริการ: `byteplus` (การเขียนโค้ด: `byteplus-plan`)
- การยืนยันตัวตน: `BYTEPLUS_API_KEY`
- โมเดลตัวอย่าง: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

การเริ่มต้นใช้งานจะใช้พื้นผิวการเขียนโค้ดเป็นค่าเริ่มต้น แต่แค็ตตาล็อก `byteplus/*` ทั่วไปจะได้รับการลงทะเบียนพร้อมกัน

ในตัวเลือกโมเดลของการเริ่มต้นใช้งาน/การกำหนดค่า ตัวเลือกการยืนยันตัวตน BytePlus จะให้ความสำคัญกับทั้งแถว `byteplus/*` และ `byteplus-plan/*` หากยังไม่ได้โหลดโมเดลเหล่านั้น OpenClaw จะย้อนกลับไปใช้แค็ตตาล็อกที่ไม่ได้กรองแทนการแสดงตัวเลือกที่จำกัดขอบเขตตามผู้ให้บริการแบบว่างเปล่า

<Tabs>
  <Tab title="โมเดลมาตรฐาน">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="โมเดลการเขียนโค้ด (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic ให้บริการโมเดลที่เข้ากันได้กับ Anthropic ผ่านผู้ให้บริการ `synthetic`:

- ผู้ให้บริการ: `synthetic`
- การยืนยันตัวตน: `SYNTHETIC_API_KEY`
- โมเดลตัวอย่าง: `synthetic/hf:MiniMaxAI/MiniMax-M3`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M3" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M3", name: "MiniMax M3" }],
      },
    },
  },
}
```

### MiniMax

กำหนดค่า MiniMax ผ่าน `models.providers` เนื่องจากใช้ปลายทางแบบกำหนดเอง:

- MiniMax OAuth (ทั่วโลก): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (จีน): `--auth-choice minimax-cn-oauth`
- คีย์ API ของ MiniMax (ทั่วโลก): `--auth-choice minimax-global-api`
- คีย์ API ของ MiniMax (จีน): `--auth-choice minimax-cn-api`
- การยืนยันตัวตน: `MINIMAX_API_KEY` สำหรับ `minimax`; `MINIMAX_OAUTH_TOKEN` หรือ `MINIMAX_API_KEY` สำหรับ `minimax-portal`

ดูรายละเอียดการตั้งค่า ตัวเลือกโมเดล และส่วนย่อยการกำหนดค่าได้ที่ [/providers/minimax](/th/providers/minimax)

<Note>
ในเส้นทางการสตรีมที่เข้ากันได้กับ Anthropic ของ MiniMax นั้น OpenClaw จะปิดการคิดเป็นค่าเริ่มต้นสำหรับตระกูล M2.x เว้นแต่จะตั้งค่าไว้อย่างชัดเจน ส่วน MiniMax-M3 (และ M3.x) จะคงอยู่ในเส้นทางการคิดแบบละไว้/ปรับตามสถานการณ์ของผู้ให้บริการโดยค่าเริ่มต้น `/fast on` จะแปลง `MiniMax-M2.7` เป็น `MiniMax-M2.7-highspeed`
</Note>

การแบ่งความสามารถที่ Plugin เป็นเจ้าของ:

- ค่าเริ่มต้นของข้อความ/แชตยังคงใช้ `minimax/MiniMax-M3`
- การสร้างรูปภาพใช้ `minimax/image-01` หรือ `minimax-portal/image-01`
- การทำความเข้าใจรูปภาพเป็น `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของในเส้นทางการยืนยันตัวตน MiniMax ทั้งสองเส้นทาง
- การค้นหาเว็บยังคงใช้รหัสผู้ให้บริการ `minimax`

### LM Studio

LM Studio จัดส่งมาในรูปแบบ Plugin ผู้ให้บริการที่รวมมาให้ ซึ่งใช้ API แบบเนทีฟ:

- ผู้ให้บริการ: `lmstudio`
- การยืนยันตัวตน: `LM_API_TOKEN`
- URL ฐานสำหรับการอนุมานเริ่มต้น: `http://localhost:1234/v1`

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งในรหัสที่ `http://localhost:1234/api/v1/models` ส่งคืน):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw ใช้ `/api/v1/models` และ `/api/v1/models/load` แบบเนทีฟของ LM Studio สำหรับการค้นพบและการโหลดอัตโนมัติ โดยใช้ `/v1/chat/completions` สำหรับการอนุมานเป็นค่าเริ่มต้น หากต้องการให้การโหลดแบบ JIT, TTL และการขับออกอัตโนมัติของ LM Studio เป็นผู้จัดการวงจรชีวิตของโมเดล ให้ตั้งค่า `models.providers.lmstudio.params.preload: false` ดูการตั้งค่าและการแก้ไขปัญหาได้ที่ [/providers/lmstudio](/th/providers/lmstudio)

### Ollama

Ollama จัดส่งมาในรูปแบบ Plugin ผู้ให้บริการที่รวมมาให้ และใช้ API แบบเนทีฟของ Ollama:

- ผู้ให้บริการ: `ollama`
- การยืนยันตัวตน: ไม่จำเป็น (เซิร์ฟเวอร์ภายในเครื่อง)
- โมเดลตัวอย่าง: `ollama/llama3.3`
- การติดตั้ง: [https://ollama.com/download](https://ollama.com/download)

```bash
# ติดตั้ง Ollama แล้วดึงโมเดล:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

ระบบจะตรวจพบ Ollama ภายในเครื่องที่ `http://127.0.0.1:11434` เมื่อเลือกเข้าร่วมด้วย `OLLAMA_API_KEY` และ Plugin ผู้ให้บริการที่รวมมาให้จะเพิ่ม Ollama โดยตรงลงใน `openclaw onboard` และตัวเลือกโมเดล ดูการเริ่มต้นใช้งาน โหมดคลาวด์/ภายในเครื่อง และการกำหนดค่าแบบกำหนดเองได้ที่ [/providers/ollama](/th/providers/ollama)

### vLLM

vLLM จัดส่งมาในรูปแบบ Plugin ผู้ให้บริการที่รวมมาให้ สำหรับเซิร์ฟเวอร์ภายในเครื่อง/โฮสต์เองที่เข้ากันได้กับ OpenAI:

- ผู้ให้บริการ: `vllm`
- การยืนยันตัวตน: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์)
- URL ฐานเริ่มต้น: `http://127.0.0.1:8000/v1`

หากต้องการเลือกใช้การค้นพบอัตโนมัติภายในเครื่อง (ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ไม่ได้บังคับใช้การยืนยันตัวตน):

```bash
export VLLM_API_KEY="vllm-local"
```

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งในรหัสที่ `/v1/models` ส่งคืน):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

ดูรายละเอียดได้ที่ [/providers/vllm](/th/providers/vllm)

### SGLang

SGLang จัดส่งมาในรูปแบบ Plugin ผู้ให้บริการที่รวมมาให้ สำหรับเซิร์ฟเวอร์ที่โฮสต์เองแบบรวดเร็วและเข้ากันได้กับ OpenAI:

- ผู้ให้บริการ: `sglang`
- การยืนยันตัวตน: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์)
- URL ฐานเริ่มต้น: `http://127.0.0.1:30000/v1`

หากต้องการเลือกใช้การค้นพบอัตโนมัติภายในเครื่อง (ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ไม่ได้บังคับใช้การยืนยันตัวตน):

```bash
export SGLANG_API_KEY="sglang-local"
```

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งในรหัสที่ `/v1/models` ส่งคืน):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

ดูรายละเอียดได้ที่ [/providers/sglang](/th/providers/sglang)

### พร็อกซีภายในเครื่อง (LM Studio, vLLM, LiteLLM ฯลฯ)

ตัวอย่าง (เข้ากันได้กับ OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="ฟิลด์ทางเลือกเริ่มต้น">
    สำหรับผู้ให้บริการแบบกำหนดเอง `reasoning`, `input`, `cost`, `contextWindow` และ `maxTokens` เป็นตัวเลือก หากละไว้ OpenClaw จะใช้ค่าเริ่มต้นดังนี้:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    แนะนำ: ตั้งค่าอย่างชัดเจนให้ตรงกับขีดจำกัดของพร็อกซี/โมเดล

  </Accordion>
  <Accordion title="กฎการปรับรูปแบบเส้นทางพร็อกซี">
    - สำหรับ `api: "openai-completions"` บนปลายทางที่ไม่ใช่แบบเนทีฟ (`baseUrl` ที่ไม่ว่างและโฮสต์ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับ `compat.supportsDeveloperRole: false` เพื่อหลีกเลี่ยงข้อผิดพลาด 400 จากผู้ให้บริการสำหรับบทบาท `developer` ที่ไม่รองรับ
    - เส้นทางที่เข้ากันได้กับ OpenAI แบบพร็อกซีจะข้ามการปรับรูปแบบคำขอเฉพาะ OpenAI แบบเนทีฟด้วย ได้แก่ ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มี Completions `store`, ไม่มีคำใบ้แคชพรอมต์, ไม่มีการปรับเพย์โหลดเพื่อความเข้ากันได้ด้านการให้เหตุผลของ OpenAI และไม่มีส่วนหัวการระบุแหล่งที่มา OpenClaw ที่ซ่อนอยู่
    - สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI ซึ่งต้องใช้ฟิลด์เฉพาะผู้จำหน่าย ให้ตั้งค่า `agents.defaults.models["provider/model"].params.extra_body` (หรือ `extraBody`) เพื่อผสาน JSON เพิ่มเติมลงในเนื้อหาคำขอขาออก
    - สำหรับการควบคุมเทมเพลตแชตของ vLLM ให้ตั้งค่า `agents.defaults.models["provider/model"].params.chat_template_kwargs` Plugin vLLM ที่รวมมาให้จะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติสำหรับ `vllm/nemotron-3-*` เมื่อปิดระดับการคิดของเซสชัน
    - สำหรับโมเดลภายในเครื่องที่ทำงานช้า หรือโฮสต์ LAN/tailnet ระยะไกล ให้ตั้งค่า `models.providers.<id>.timeoutSeconds` ค่านี้จะขยายเวลาการจัดการคำขอ HTTP ของโมเดลผู้ให้บริการ รวมถึงการเชื่อมต่อ ส่วนหัว การสตรีมเนื้อหา และการยกเลิก guarded-fetch โดยรวม โดยไม่เพิ่มระยะหมดเวลาของรันไทม์เอเจนต์ทั้งหมด หาก `agents.defaults.timeoutSeconds` หรือระยะหมดเวลาเฉพาะการรันต่ำกว่า ให้เพิ่มเพดานนั้นด้วย ระยะหมดเวลาของผู้ให้บริการไม่สามารถขยายเวลาการรันทั้งหมดได้
    - การเรียก HTTP ของผู้ให้บริการโมเดลจะอนุญาตคำตอบ DNS แบบ fake-IP ของ Surge, Clash และ sing-box ใน `198.18.0.0/15` และ `fc00::/7` เฉพาะสำหรับชื่อโฮสต์ `baseUrl` ของผู้ให้บริการที่กำหนดค่าไว้เท่านั้น ปลายทางผู้ให้บริการแบบกำหนดเอง/ภายในเครื่องยังเชื่อถือ origin `scheme://host:port` ที่กำหนดค่าไว้อย่างตรงกันสำหรับคำขอโมเดลที่มีการป้องกัน ซึ่งรวมถึงโฮสต์ loopback, LAN และ tailnet นี่ไม่ใช่ตัวเลือกการกำหนดค่าใหม่ โดย `baseUrl` ที่กำหนดค่าจะขยายนโยบายคำขอเฉพาะสำหรับ origin นั้นเท่านั้น การอนุญาตชื่อโฮสต์แบบ fake-IP และการเชื่อถือ origin ที่ตรงกันเป็นกลไกที่แยกจากกัน ปลายทางส่วนตัว, loopback, link-local, metadata อื่น ๆ และพอร์ตที่แตกต่างกันยังคงต้องเลือกใช้ `models.providers.<id>.request.allowPrivateNetwork: true` อย่างชัดเจน ตั้งค่า `models.providers.<id>.request.allowPrivateNetwork: false` เพื่อเลือกไม่ใช้การเชื่อถือ origin ที่ตรงกัน
    - หาก `baseUrl` ว่างเปล่า/ถูกละไว้ OpenClaw จะคงพฤติกรรม OpenAI เริ่มต้น (ซึ่งได้ค่าเป็น `api.openai.com`)
    - เพื่อความปลอดภัย `compat.supportsDeveloperRole: true` ที่กำหนดไว้อย่างชัดเจนจะยังคงถูกแทนที่บนปลายทาง `openai-completions` ที่ไม่ใช่แบบเนทีฟ
    - สำหรับ `api: "anthropic-messages"` บนปลายทางที่ไม่ใช่แบบตรง (ผู้ให้บริการใด ๆ ที่ไม่ใช่ `anthropic` ตามมาตรฐาน หรือ `models.providers.anthropic.baseUrl` แบบกำหนดเองซึ่งมีโฮสต์ที่ไม่ใช่ปลายทาง `api.anthropic.com` สาธารณะ) OpenClaw จะระงับส่วนหัว Anthropic รุ่นเบต้าโดยนัย เช่น `claude-code-20250219`, `interleaved-thinking-2025-05-14` และเครื่องหมาย OAuth เพื่อไม่ให้พร็อกซีแบบกำหนดเองที่เข้ากันได้กับ Anthropic ปฏิเสธแฟล็กเบต้าที่ไม่รองรับ ตั้งค่า `models.providers.<id>.headers["anthropic-beta"]` อย่างชัดเจนหากพร็อกซีต้องใช้คุณสมบัติเบต้าเฉพาะ

  </Accordion>
</AccordionGroup>

## ตัวอย่าง CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

ดูเพิ่มเติม: [การกำหนดค่า](/th/gateway/configuration) สำหรับตัวอย่างการกำหนดค่าแบบเต็ม

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) - คีย์การกำหนดค่าโมเดล
- [การสลับโมเดลเมื่อเกิดข้อผิดพลาด](/th/concepts/model-failover) - ลำดับการย้อนกลับและพฤติกรรมการลองใหม่
- [โมเดล](/th/concepts/models) - การกำหนดค่าโมเดลและนามแฝง
- [ผู้ให้บริการ](/th/providers) - คู่มือการตั้งค่าสำหรับแต่ละผู้ให้บริการ
