---
read_when:
    - การเพิ่มหรือแก้ไข CLI ของ models (models list/set/scan/aliases/fallbacks)
    - การเปลี่ยนลักษณะการทำงานของโมเดลสำรองหรือประสบการณ์ผู้ใช้ในการเลือก
    - กำลังอัปเดตโพรบสแกนโมเดล (เครื่องมือ/รูปภาพ)
sidebarTitle: Models CLI
summary: 'CLI สำหรับโมเดล: แสดงรายการ, ตั้งค่า, นามแฝง, ทางเลือกสำรอง, สแกน, สถานะ'
title: CLI สำหรับโมเดล
x-i18n:
    generated_at: "2026-05-11T20:28:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 346f0edaf0d821bc8e65b73bf1d2385fb343c4b93127e6a20e9dd783c5138c52
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="การสลับไปใช้โมเดลสำรอง" href="/th/concepts/model-failover">
    การหมุนเวียนโปรไฟล์การยืนยันตัวตน ช่วงคูลดาวน์ และวิธีที่สิ่งนี้ทำงานร่วมกับตัวสำรอง
  </Card>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers">
    ภาพรวมผู้ให้บริการแบบรวดเร็วและตัวอย่าง
  </Card>
  <Card title="รันไทม์ของเอเจนต์" href="/th/concepts/agent-runtimes">
    PI, Codex และรันไทม์ลูปของเอเจนต์อื่นๆ
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/config-agents#agent-defaults">
    คีย์การกำหนดค่าโมเดล
  </Card>
</CardGroup>

การอ้างอิงโมเดลจะเลือกผู้ให้บริการและโมเดล โดยปกติจะไม่เลือก รันไทม์ของเอเจนต์ ระดับต่ำ การอ้างอิงเอเจนต์ OpenAI เป็นข้อยกเว้นหลัก: `openai/gpt-5.5` ทำงานผ่านรันไทม์ app-server ของ Codex เป็นค่าเริ่มต้นบนผู้ให้บริการ OpenAI อย่างเป็นทางการ การ override รันไทม์แบบชัดเจนควรอยู่ในนโยบายผู้ให้บริการ/โมเดล ไม่ใช่ทั้งเอเจนต์หรือเซสชัน ในโหมดรันไทม์ Codex การอ้างอิง `openai/gpt-*` ไม่ได้หมายถึงการเรียกเก็บเงินผ่าน API key; การยืนยันตัวตนอาจมาจากบัญชี Codex หรือโปรไฟล์การยืนยันตัวตน `openai-codex` ดู [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes)

## วิธีการเลือกโมเดลทำงาน

OpenClaw เลือกโมเดลตามลำดับนี้:

<Steps>
  <Step title="โมเดลหลัก">
    `agents.defaults.model.primary` (หรือ `agents.defaults.model`)
  </Step>
  <Step title="ตัวสำรอง">
    `agents.defaults.model.fallbacks` (ตามลำดับ)
  </Step>
  <Step title="การสลับการยืนยันตัวตนของผู้ให้บริการ">
    การสลับการยืนยันตัวตนเกิดขึ้นภายในผู้ให้บริการก่อนย้ายไปยังโมเดลถัดไป
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="พื้นผิวโมเดลที่เกี่ยวข้อง">
    - `agents.defaults.models` คือ allowlist/แค็ตตาล็อกของโมเดลที่ OpenClaw ใช้ได้ (รวมถึง alias) ใช้รายการ `provider/*` เพื่อจำกัดผู้ให้บริการที่มองเห็นได้ ในขณะที่ยังคงให้การค้นพบผู้ให้บริการเป็นแบบไดนามิก
    - `agents.defaults.imageModel` ใช้ **เฉพาะเมื่อ** โมเดลหลักรับรูปภาพไม่ได้
    - `agents.defaults.pdfModel` ใช้โดยเครื่องมือ `pdf` หากละไว้ เครื่องมือจะ fallback ไปที่ `agents.defaults.imageModel` แล้วจึงเป็นโมเดลเซสชัน/ค่าเริ่มต้นที่แก้ค่าได้
    - `agents.defaults.imageGenerationModel` ใช้โดยความสามารถสร้างรูปภาพที่ใช้ร่วมกัน หากละไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน แล้วจึงลองผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id หากคุณตั้งค่าผู้ให้บริการ/โมเดลเฉพาะ ให้กำหนดค่าการยืนยันตัวตน/API key ของผู้ให้บริการนั้นด้วย
    - `agents.defaults.musicGenerationModel` ใช้โดยความสามารถสร้างเพลงที่ใช้ร่วมกัน หากละไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน แล้วจึงลองผู้ให้บริการสร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id หากคุณตั้งค่าผู้ให้บริการ/โมเดลเฉพาะ ให้กำหนดค่าการยืนยันตัวตน/API key ของผู้ให้บริการนั้นด้วย
    - `agents.defaults.videoGenerationModel` ใช้โดยความสามารถสร้างวิดีโอที่ใช้ร่วมกัน หากละไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน แล้วจึงลองผู้ให้บริการสร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id หากคุณตั้งค่าผู้ให้บริการ/โมเดลเฉพาะ ให้กำหนดค่าการยืนยันตัวตน/API key ของผู้ให้บริการนั้นด้วย
    - ค่าเริ่มต้นต่อเอเจนต์สามารถ override `agents.defaults.model` ผ่าน `agents.list[].model` พร้อม bindings (ดู [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent))

  </Accordion>
</AccordionGroup>

## แหล่งที่มาของการเลือกและพฤติกรรม fallback

`provider/model` เดียวกันอาจหมายถึงสิ่งต่างกันได้ ขึ้นอยู่กับว่ามาจากที่ใด:

- ค่าเริ่มต้นที่กำหนดค่าไว้ (`agents.defaults.model.primary` และโมเดลหลักเฉพาะเอเจนต์) เป็นจุดเริ่มต้นปกติและใช้ `agents.defaults.model.fallbacks`
- การเลือก fallback อัตโนมัติเป็นสถานะการกู้คืนชั่วคราว โดยจัดเก็บพร้อม `modelOverrideSource: "auto"` เพื่อให้เทิร์นภายหลังยังใช้เชน fallback ต่อได้โดยไม่ต้อง probe โมเดลหลักที่รู้ว่าเสียก่อน
- การเลือกเซสชันของผู้ใช้เป็นแบบตรงตัว `/model`, ตัวเลือกโมเดล, `session_status(model=...)` และ `sessions.patch` จัดเก็บ `modelOverrideSource: "user"`; หากผู้ให้บริการ/โมเดลที่เลือกนั้นเข้าถึงไม่ได้ OpenClaw จะล้มเหลวให้เห็นชัดเจนแทนที่จะตกไปยังโมเดลที่กำหนดค่าไว้อื่น
- Cron `--model` / payload `model` เป็นโมเดลหลักต่อ job ยังคงใช้ fallback ที่กำหนดค่าไว้ เว้นแต่งานจะระบุ payload `fallbacks` อย่างชัดเจน (ใช้ `fallbacks: []` สำหรับการรัน cron แบบเข้มงวด)
- ตัวเลือก default-model และ allowlist ของ CLI เคารพ `models.mode: "replace"` โดยแสดงรายการ `models.providers.*.models` ที่ระบุชัดเจน แทนที่จะโหลดแค็ตตาล็อก built-in ทั้งหมด
- ตัวเลือกโมเดลใน Control UI จะถาม Gateway สำหรับมุมมองโมเดลที่กำหนดค่าไว้: `agents.defaults.models` เมื่อมีอยู่ รวมถึงรายการ `provider/*` ที่ครอบคลุมทั้งผู้ให้บริการ มิฉะนั้นจะใช้ `models.providers.*.models` ที่ระบุชัดเจน รวมถึงผู้ให้บริการที่มีการยืนยันตัวตนที่ใช้ได้ แค็ตตาล็อก built-in ทั้งหมดสงวนไว้สำหรับมุมมองเรียกดูแบบชัดเจน เช่น `models.list` พร้อม `view: "all"` หรือ `openclaw models list --all`

## นโยบายโมเดลแบบรวดเร็ว

- ตั้งค่าโมเดลหลักเป็นโมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดที่คุณเข้าถึงได้
- ใช้ fallback สำหรับงานที่อ่อนไหวต่อค่าใช้จ่าย/เวลาแฝง และแชตที่มีความเสี่ยงต่ำกว่า
- สำหรับเอเจนต์ที่เปิดใช้เครื่องมือหรืออินพุตที่ไม่น่าเชื่อถือ ให้หลีกเลี่ยงระดับโมเดลที่เก่ากว่า/อ่อนแอกว่า

## การเริ่มต้นใช้งาน (แนะนำ)

หากคุณไม่ต้องการแก้ไขการกำหนดค่าด้วยมือ ให้รัน onboarding:

```bash
openclaw onboard
```

คำสั่งนี้สามารถตั้งค่าโมเดล + การยืนยันตัวตนสำหรับผู้ให้บริการทั่วไป รวมถึง **การสมัครสมาชิก OpenAI Code (Codex)** (OAuth) และ **Anthropic** (API key หรือ Claude CLI)

## คีย์การกำหนดค่า (ภาพรวม)

- `agents.defaults.model.primary` และ `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` และ `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` และ `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` และ `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` และ `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + alias + พารามิเตอร์ผู้ให้บริการ + รายการผู้ให้บริการแบบไดนามิก `provider/*`)
- `models.providers` (ผู้ให้บริการแบบกำหนดเองที่เขียนลงใน `models.json`)

<Note>
การอ้างอิงโมเดลถูกทำให้เป็นตัวพิมพ์เล็ก Provider alias อย่าง `z.ai/*` จะ normalize เป็น `zai/*`

ตัวอย่างการกำหนดค่าผู้ให้บริการ (รวมถึง OpenCode) อยู่ใน [OpenCode](/th/providers/opencode)
</Note>

### การแก้ไข allowlist อย่างปลอดภัย

ใช้การเขียนแบบเพิ่มเมื่ออัปเดต `agents.defaults.models` ด้วยมือ:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="กฎการป้องกันการเขียนทับ">
    `openclaw config set` ปกป้องแผนที่โมเดล/ผู้ให้บริการจากการเขียนทับโดยไม่ตั้งใจ การกำหนด object ธรรมดาให้กับ `agents.defaults.models`, `models.providers` หรือ `models.providers.<id>.models` จะถูกปฏิเสธเมื่อจะทำให้รายการเดิมถูกลบ ใช้ `--merge` สำหรับการเปลี่ยนแปลงแบบเพิ่ม; ใช้ `--replace` เฉพาะเมื่อค่าที่ให้มาควรกลายเป็นค่าปลายทางทั้งหมด

    การตั้งค่าผู้ให้บริการแบบโต้ตอบและ `openclaw configure --section model` ยัง merge การเลือกที่อยู่ในขอบเขตผู้ให้บริการเข้าไปใน allowlist ที่มีอยู่ ดังนั้นการเพิ่ม Codex, Ollama หรือผู้ให้บริการอื่นจะไม่ทำให้รายการโมเดลที่ไม่เกี่ยวข้องหายไป Configure จะรักษา `agents.defaults.model.primary` ที่มีอยู่เมื่อมีการใช้การยืนยันตัวตนผู้ให้บริการซ้ำ คำสั่งตั้งค่า default อย่างชัดเจน เช่น `openclaw models auth login --provider <id> --set-default` และ `openclaw models set <model>` ยังคงแทนที่ `agents.defaults.model.primary`

  </Accordion>
</AccordionGroup>

## "ไม่อนุญาตให้ใช้โมเดล" (และเหตุผลที่การตอบกลับหยุด)

หากตั้งค่า `agents.defaults.models` ไว้ ค่านี้จะกลายเป็น **allowlist** สำหรับ `/model` และสำหรับ session overrides เมื่อผู้ใช้เลือกโมเดลที่ไม่ได้อยู่ใน allowlist นั้น OpenClaw จะส่งคืน:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
สิ่งนี้เกิดขึ้น **ก่อน** การสร้างคำตอบปกติ ดังนั้นข้อความอาจรู้สึกเหมือนว่า "ไม่ได้ตอบกลับ" วิธีแก้คือทำอย่างใดอย่างหนึ่ง:

- เพิ่มโมเดลลงใน `agents.defaults.models` หรือ
- ล้าง allowlist (ลบ `agents.defaults.models`) หรือ
- เลือกโมเดลจาก `/model list`

</Warning>

เมื่อคำสั่งที่ถูกปฏิเสธมีการ override รันไทม์ เช่น `/model openai/gpt-5.5 --runtime codex` ให้แก้ allowlist ก่อน แล้วลองคำสั่ง `/model ... --runtime ...` เดิมอีกครั้ง สำหรับการรัน Codex แบบ native โมเดลที่เลือกยังคงเป็น `openai/gpt-5.5`; รันไทม์ `codex` จะเลือก harness และใช้การยืนยันตัวตน Codex แยกต่างหาก

สำหรับโมเดล local/GGUF ให้เก็บ ref แบบเต็มที่มีคำนำหน้าผู้ให้บริการไว้ใน allowlist
เช่น `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` หรือ
provider/model ตรงตามที่แสดงโดย `openclaw models list --provider <provider>`
ชื่อไฟล์ local แบบเปล่าๆ หรือชื่อที่ใช้แสดงผลยังไม่เพียงพอเมื่อ allowlist
เปิดใช้งานอยู่

หากคุณต้องการจำกัดผู้ให้บริการโดยไม่ต้องแสดงรายการทุกโมเดลด้วยมือ ให้เพิ่ม
รายการ `provider/*` ลงใน `agents.defaults.models`:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai-codex/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

ด้วยนโยบายนี้ `/model`, `/models` และตัวเลือกโมเดลจะแสดงแค็ตตาล็อกที่ค้นพบ
สำหรับผู้ให้บริการเหล่านั้นเท่านั้น โมเดลใหม่จากผู้ให้บริการที่เลือกสามารถ
ปรากฏได้โดยไม่ต้องแก้ไข allowlist รายการ `provider/model` ที่ระบุชัดเจนสามารถผสม
กับรายการ `provider/*` ได้เมื่อคุณต้องการโมเดลเฉพาะหนึ่งตัวจากผู้ให้บริการอื่น

ตัวอย่างการกำหนดค่า allowlist:

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
}
```

## การสลับโมเดลในแชต (`/model`)

คุณสามารถสลับโมเดลสำหรับเซสชันปัจจุบันได้โดยไม่ต้องเริ่มใหม่:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="พฤติกรรมของตัวเลือก">
    - `/model` (และ `/model list`) เป็นตัวเลือกแบบกะทัดรัดที่มีหมายเลข (ตระกูลโมเดล + ผู้ให้บริการที่พร้อมใช้งาน)
    - บน Discord, `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบพร้อม dropdown ผู้ให้บริการและโมเดล รวมถึงขั้นตอน Submit
    - บน Telegram การเลือกในตัวเลือก `/models` อยู่ในขอบเขตเซสชัน; จะไม่เปลี่ยนค่าเริ่มต้นถาวรของเอเจนต์ใน `openclaw.json`
    - `/models add` ถูกเลิกใช้แล้วและตอนนี้ส่งคืนข้อความแจ้งเลิกใช้แทนการลงทะเบียนโมเดลจากแชต
    - `/model <#>` เลือกจากตัวเลือกนั้น

  </Accordion>
  <Accordion title="การคงค่าและการสลับแบบสด">
    - `/model` คงค่าการเลือกเซสชันใหม่ทันที
    - หากเอเจนต์ว่างอยู่ การรันถัดไปจะใช้โมเดลใหม่ทันที
    - หากมีการรันที่กำลังทำงานอยู่ OpenClaw จะทำเครื่องหมายการสลับแบบสดเป็น pending และจะเริ่มใหม่ด้วยโมเดลใหม่เฉพาะที่จุด retry ที่สะอาด
    - หากกิจกรรมเครื่องมือหรือเอาต์พุตการตอบกลับเริ่มไปแล้ว การสลับที่ pending อาจยังเข้าคิวอยู่จนกว่าจะมีโอกาส retry ภายหลังหรือเทิร์นผู้ใช้ถัดไป
    - ref `/model` ที่ผู้ใช้เลือกเป็นแบบเข้มงวดสำหรับเซสชันนั้น: หากผู้ให้บริการ/โมเดลที่เลือกเข้าถึงไม่ได้ การตอบกลับจะล้มเหลวให้เห็นชัดเจนแทนที่จะตอบจาก `agents.defaults.model.fallbacks` อย่างเงียบๆ สิ่งนี้แตกต่างจากค่าเริ่มต้นที่กำหนดค่าไว้และโมเดลหลักของ cron job ซึ่งยังสามารถใช้เชน fallback ได้
    - `/model status` เป็นมุมมองแบบละเอียด (ผู้สมัครการยืนยันตัวตน และเมื่อกำหนดค่าไว้ endpoint ผู้ให้บริการ `baseUrl` + โหมด `api`)

  </Accordion>
  <Accordion title="การแยกวิเคราะห์ ref">
    - Model refs จะถูกแยกวิเคราะห์โดยแบ่งที่ `/` ตัว **แรก** ใช้ `provider/model` เมื่อพิมพ์ `/model <ref>`
    - หาก model ID เองมี `/` (สไตล์ OpenRouter) คุณต้องใส่คำนำหน้าผู้ให้บริการด้วย (ตัวอย่าง: `/model openrouter/moonshotai/kimi-k2`)
    - หากคุณละผู้ให้บริการไว้ OpenClaw จะแก้ค่าอินพุตตามลำดับนี้:
      1. ตรงกับ alias
      2. ตรงกับผู้ให้บริการที่กำหนดค่าไว้เพียงรายเดียวสำหรับ model id แบบไม่มีคำนำหน้านั้นพอดี
      3. fallback แบบเลิกใช้แล้วไปยังผู้ให้บริการเริ่มต้นที่กำหนดค่าไว้ — หากผู้ให้บริการนั้นไม่เปิดเผยโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะ fallback ไปยังผู้ให้บริการ/โมเดลแรกที่กำหนดค่าไว้แทน เพื่อหลีกเลี่ยงการแสดงค่าเริ่มต้นของผู้ให้บริการเก่าที่ถูกลบไปแล้ว
  </Accordion>
</AccordionGroup>

พฤติกรรม/การกำหนดค่าคำสั่งแบบเต็ม: [คำสั่งสแลช](/th/tools/slash-commands).

## คำสั่ง CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (ไม่มีคำสั่งย่อย) เป็นทางลัดสำหรับ `models status`

### `models list`

แสดงโมเดลที่กำหนดค่าไว้/พร้อมใช้งานด้วย auth ตามค่าเริ่มต้น แฟล็กที่มีประโยชน์:

<ParamField path="--all" type="boolean">
  แค็ตตาล็อกเต็ม รวมแถวแค็ตตาล็อกแบบคงที่ของผู้ให้บริการที่บันเดิลมาซึ่งผู้ให้บริการเป็นเจ้าของ ก่อนที่จะกำหนดค่า auth ดังนั้นมุมมองสำหรับการค้นพบเท่านั้นจึงสามารถแสดงโมเดลที่ยังใช้งานไม่ได้จนกว่าคุณจะเพิ่มข้อมูลประจำตัวของผู้ให้บริการที่ตรงกัน
</ParamField>
<ParamField path="--local" type="boolean">
  เฉพาะผู้ให้บริการภายในเครื่อง
</ParamField>
<ParamField path="--provider <id>" type="string">
  กรองตาม provider id เช่น `moonshot` ไม่รับป้ายชื่อที่แสดงจากตัวเลือกแบบโต้ตอบ
</ParamField>
<ParamField path="--plain" type="boolean">
  หนึ่งโมเดลต่อบรรทัด
</ParamField>
<ParamField path="--json" type="boolean">
  เอาต์พุตที่เครื่องอ่านได้
</ParamField>

### `models status`

แสดงโมเดลหลักที่แก้ค่าแล้ว, fallbacks, โมเดลภาพ และภาพรวม auth ของผู้ให้บริการที่กำหนดค่าไว้ นอกจากนี้ยังแสดงสถานะการหมดอายุของ OAuth สำหรับโปรไฟล์ที่พบใน auth store (เตือนภายใน 24 ชม. ตามค่าเริ่มต้น) `--plain` จะพิมพ์เฉพาะโมเดลหลักที่แก้ค่าแล้ว

<AccordionGroup>
  <Accordion title="พฤติกรรม Auth และ probe">
    - สถานะ OAuth จะแสดงเสมอ (และรวมอยู่ในเอาต์พุต `--json`) หากผู้ให้บริการที่กำหนดค่าไว้ไม่มีข้อมูลประจำตัว `models status` จะพิมพ์ส่วน **Auth หายไป**
    - JSON รวม `auth.oauth` (หน้าต่างเตือน + โปรไฟล์) และ `auth.providers` (auth ที่มีผลต่อผู้ให้บริการแต่ละราย รวมถึงข้อมูลประจำตัวที่มาจาก env) `auth.oauth` เป็นเฉพาะสุขภาพของโปรไฟล์ใน auth-store เท่านั้น; ผู้ให้บริการที่มีเฉพาะ env จะไม่ปรากฏที่นั่น
    - ใช้ `--check` สำหรับระบบอัตโนมัติ (exit `1` เมื่อหายไป/หมดอายุ, `2` เมื่อใกล้หมดอายุ)
    - ใช้ `--probe` สำหรับการตรวจสอบ auth แบบสด; แถว probe อาจมาจากโปรไฟล์ auth, ข้อมูลประจำตัว env หรือ `models.json`
    - หาก `auth.order.<provider>` ที่ระบุไว้ชัดเจนละเว้นโปรไฟล์ที่จัดเก็บไว้ probe จะรายงาน `excluded_by_auth_order` แทนที่จะลองใช้โปรไฟล์นั้น หากมี auth อยู่แต่ไม่สามารถแก้ค่าเป็นโมเดลที่ probe ได้สำหรับผู้ให้บริการนั้น probe จะรายงาน `status: no_model`

  </Accordion>
</AccordionGroup>

<Note>
การเลือก Auth ขึ้นอยู่กับผู้ให้บริการ/บัญชี สำหรับโฮสต์ Gateway ที่เปิดตลอดเวลา โดยปกติ API keys จะคาดเดาได้มากที่สุด; ยังรองรับการใช้ Claude CLI ซ้ำและโปรไฟล์ Anthropic OAuth/token ที่มีอยู่ด้วย
</Note>

ตัวอย่าง (Claude CLI):

```bash
claude auth login
openclaw models status
```

## การสแกน (โมเดลฟรีของ OpenRouter)

`openclaw models scan` ตรวจสอบ **แค็ตตาล็อกโมเดลฟรี** ของ OpenRouter และสามารถเลือก probe โมเดลเพื่อดูการรองรับเครื่องมือและรูปภาพได้

<ParamField path="--no-probe" type="boolean">
  ข้าม probe แบบสด (เฉพาะเมทาดาทา)
</ParamField>
<ParamField path="--min-params <b>" type="number">
  ขนาดพารามิเตอร์ขั้นต่ำ (พันล้าน)
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  ข้ามโมเดลที่เก่ากว่า
</ParamField>
<ParamField path="--provider <name>" type="string">
  ตัวกรองคำนำหน้าผู้ให้บริการ
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  ขนาดรายการ fallback
</ParamField>
<ParamField path="--set-default" type="boolean">
  ตั้ง `agents.defaults.model.primary` เป็นตัวเลือกแรก
</ParamField>
<ParamField path="--set-image" type="boolean">
  ตั้ง `agents.defaults.imageModel.primary` เป็นตัวเลือกภาพแรก
</ParamField>

<Note>
แค็ตตาล็อก `/models` ของ OpenRouter เป็นสาธารณะ ดังนั้นการสแกนเฉพาะเมทาดาทาสามารถแสดงรายการแคนดิเดตฟรีได้โดยไม่ต้องมีคีย์ การ probe และ inference ยังต้องใช้ OpenRouter API key (จากโปรไฟล์ auth หรือ `OPENROUTER_API_KEY`) หากไม่มีคีย์ `openclaw models scan` จะ fallback เป็นเอาต์พุตเฉพาะเมทาดาทาและปล่อยการกำหนดค่าไว้ไม่เปลี่ยน ใช้ `--no-probe` เพื่อขอโหมดเฉพาะเมทาดาทาอย่างชัดเจน
</Note>

ผลการสแกนจัดอันดับตาม:

1. การรองรับรูปภาพ
2. เวลาแฝงของเครื่องมือ
3. ขนาดคอนเท็กซ์
4. จำนวนพารามิเตอร์

อินพุต:

- รายการ `/models` ของ OpenRouter (ตัวกรอง `:free`)
- probe แบบสดต้องใช้ OpenRouter API key จากโปรไฟล์ auth หรือ `OPENROUTER_API_KEY` (ดู [ตัวแปรสภาพแวดล้อม](/th/help/environment))
- ตัวกรองเสริม: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- ตัวควบคุมคำขอ/probe: `--timeout`, `--concurrency`

เมื่อ probe แบบสดทำงานใน TTY คุณสามารถเลือก fallbacks แบบโต้ตอบได้ ในโหมดไม่โต้ตอบ ให้ส่ง `--yes` เพื่อยอมรับค่าเริ่มต้น ผลลัพธ์เฉพาะเมทาดาทาเป็นข้อมูลเพื่ออ้างอิง; `--set-default` และ `--set-image` ต้องใช้ probe แบบสดเพื่อให้ OpenClaw ไม่กำหนดค่าโมเดล OpenRouter ที่ไม่มีคีย์และใช้งานไม่ได้

## รีจิสทรีโมเดล (`models.json`)

ผู้ให้บริการแบบกำหนดเองใน `models.providers` จะถูกเขียนลงใน `models.json` ใต้ไดเรกทอรีเอเจนต์ (ค่าเริ่มต้น `~/.openclaw/agents/<agentId>/agent/models.json`) ไฟล์นี้จะถูกรวมตามค่าเริ่มต้น เว้นแต่ `models.mode` จะตั้งเป็น `replace`

<AccordionGroup>
  <Accordion title="ลำดับความสำคัญของโหมดรวม">
    ลำดับความสำคัญของโหมดรวมสำหรับ provider IDs ที่ตรงกัน:

    - `baseUrl` ที่ไม่ว่างและมีอยู่แล้วใน `models.json` ของเอเจนต์จะชนะ
    - `apiKey` ที่ไม่ว่างใน `models.json` ของเอเจนต์จะชนะเฉพาะเมื่อผู้ให้บริการนั้นไม่ได้ถูกจัดการโดย SecretRef ในคอนเท็กซ์ config/auth-profile ปัจจุบัน
    - ค่า `apiKey` ของผู้ให้บริการที่ถูกจัดการโดย SecretRef จะถูกรีเฟรชจากมาร์กเกอร์ต้นทาง (`ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs) แทนที่จะคง secret ที่แก้ค่าแล้ว
    - ค่าหัวข้อของผู้ให้บริการที่ถูกจัดการโดย SecretRef จะถูกรีเฟรชจากมาร์กเกอร์ต้นทาง (`secretref-env:ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs)
    - `apiKey`/`baseUrl` ของเอเจนต์ที่ว่างหรือหายไปจะ fallback ไปยัง config `models.providers`
    - ฟิลด์ผู้ให้บริการอื่นๆ จะถูกรีเฟรชจาก config และข้อมูลแค็ตตาล็อกที่ปรับให้อยู่ในรูปแบบมาตรฐาน

  </Accordion>
</AccordionGroup>

<Note>
การคงอยู่ของมาร์กเกอร์ยึดต้นทางเป็นแหล่งอ้างอิง: OpenClaw เขียนมาร์กเกอร์จากสแนปชอตการกำหนดค่าต้นทางที่ใช้งานอยู่ (ก่อนการแก้ค่า) ไม่ใช่จากค่า secret ของรันไทม์ที่แก้ค่าแล้ว ข้อนี้ใช้ทุกครั้งที่ OpenClaw สร้าง `models.json` ใหม่ รวมถึงเส้นทางที่ขับเคลื่อนด้วยคำสั่ง เช่น `openclaw agent`
</Note>

## ที่เกี่ยวข้อง

- [รันไทม์เอเจนต์](/th/concepts/agent-runtimes) — PI, Codex และรันไทม์ลูปเอเจนต์อื่นๆ
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) — คีย์การกำหนดค่าโมเดล
- [การสร้างรูปภาพ](/th/tools/image-generation) — การกำหนดค่าโมเดลรูปภาพ
- [Model failover](/th/concepts/model-failover) — เชน fallback
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers) — การกำหนดเส้นทางผู้ให้บริการและ auth
- [การสร้างเพลง](/th/tools/music-generation) — การกำหนดค่าโมเดลเพลง
- [การสร้างวิดีโอ](/th/tools/video-generation) — การกำหนดค่าโมเดลวิดีโอ
