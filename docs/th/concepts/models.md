---
read_when:
    - การเพิ่มหรือแก้ไข CLI สำหรับโมเดล (models list/set/scan/aliases/fallbacks)
    - การเปลี่ยนพฤติกรรมการใช้โมเดลสำรองหรือประสบการณ์ผู้ใช้ในการเลือก
    - กำลังอัปเดตโพรบการสแกนโมเดล (เครื่องมือ/รูปภาพ)
sidebarTitle: Models CLI
summary: 'CLI สำหรับโมเดล: แสดงรายการ, ตั้งค่า, นามแฝง, ตัวสำรอง, สแกน, สถานะ'
title: CLI สำหรับโมเดล
x-i18n:
    generated_at: "2026-05-10T19:34:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b4d473b9b437e213f8cd2b40cf0ae6000d8fb4a8fa3522813e14659cecc5450
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="การสำรองโมเดลเมื่อเกิดข้อผิดพลาด" href="/th/concepts/model-failover">
    การหมุนเวียนโปรไฟล์การยืนยันตัวตน ช่วงพัก และวิธีที่สิ่งนี้โต้ตอบกับตัวสำรอง
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

การอ้างอิงโมเดลจะเลือกผู้ให้บริการและโมเดล โดยปกติจะไม่ได้เลือกรันไทม์ของเอเจนต์ระดับต่ำ การอ้างอิงเอเจนต์ OpenAI เป็นข้อยกเว้นหลัก: `openai/gpt-5.5` ทำงานผ่านรันไทม์เซิร์ฟเวอร์แอป Codex ตามค่าเริ่มต้นบนผู้ให้บริการ OpenAI อย่างเป็นทางการ การแทนที่รันไทม์อย่างชัดเจนควรอยู่ในนโยบายผู้ให้บริการ/โมเดล ไม่ใช่ทั้งเอเจนต์หรือเซสชัน ในโหมดรันไทม์ Codex การอ้างอิง `openai/gpt-*` ไม่ได้หมายถึงการเรียกเก็บเงินผ่านคีย์ API; การยืนยันตัวตนอาจมาจากบัญชี Codex หรือโปรไฟล์การยืนยันตัวตน `openai-codex` ดู [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes)

## วิธีการทำงานของการเลือกโมเดล

OpenClaw เลือกโมเดลตามลำดับนี้:

<Steps>
  <Step title="โมเดลหลัก">
    `agents.defaults.model.primary` (หรือ `agents.defaults.model`)
  </Step>
  <Step title="ตัวสำรอง">
    `agents.defaults.model.fallbacks` (ตามลำดับ)
  </Step>
  <Step title="การสำรองการยืนยันตัวตนของผู้ให้บริการเมื่อเกิดข้อผิดพลาด">
    การสำรองการยืนยันตัวตนเมื่อเกิดข้อผิดพลาดเกิดขึ้นภายในผู้ให้บริการ ก่อนย้ายไปยังโมเดลถัดไป
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="พื้นผิวโมเดลที่เกี่ยวข้อง">
    - `agents.defaults.models` คือรายการอนุญาต/แค็ตตาล็อกของโมเดลที่ OpenClaw ใช้ได้ (รวมถึงนามแฝง) ใช้รายการ `provider/*` เพื่อจำกัดผู้ให้บริการที่มองเห็นได้ขณะที่ยังคงให้การค้นหาผู้ให้บริการเป็นแบบไดนามิก
    - `agents.defaults.imageModel` ใช้ **เฉพาะเมื่อ** โมเดลหลักไม่สามารถรับรูปภาพได้
    - `agents.defaults.pdfModel` ใช้โดยเครื่องมือ `pdf` หากละไว้ เครื่องมือจะถอยกลับไปใช้ `agents.defaults.imageModel` แล้วจึงใช้โมเดลเซสชัน/ค่าเริ่มต้นที่แก้ไขแล้ว
    - `agents.defaults.imageGenerationModel` ใช้โดยความสามารถการสร้างรูปภาพที่ใช้ร่วมกัน หากละไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับรหัสผู้ให้บริการ หากคุณตั้งผู้ให้บริการ/โมเดลเฉพาะ ให้กำหนดค่าการยืนยันตัวตน/คีย์ API ของผู้ให้บริการนั้นด้วย
    - `agents.defaults.musicGenerationModel` ใช้โดยความสามารถการสร้างเพลงที่ใช้ร่วมกัน หากละไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับรหัสผู้ให้บริการ หากคุณตั้งผู้ให้บริการ/โมเดลเฉพาะ ให้กำหนดค่าการยืนยันตัวตน/คีย์ API ของผู้ให้บริการนั้นด้วย
    - `agents.defaults.videoGenerationModel` ใช้โดยความสามารถการสร้างวิดีโอที่ใช้ร่วมกัน หากละไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับรหัสผู้ให้บริการ หากคุณตั้งผู้ให้บริการ/โมเดลเฉพาะ ให้กำหนดค่าการยืนยันตัวตน/คีย์ API ของผู้ให้บริการนั้นด้วย
    - ค่าเริ่มต้นรายเอเจนต์สามารถแทนที่ `agents.defaults.model` ผ่าน `agents.list[].model` รวมถึงการผูกค่าได้ (ดู [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent))

  </Accordion>
</AccordionGroup>

## แหล่งที่มาของการเลือกและพฤติกรรมการถอยกลับ

`provider/model` เดียวกันอาจหมายถึงสิ่งที่ต่างกัน ขึ้นอยู่กับว่ามาจากที่ใด:

- ค่าเริ่มต้นที่กำหนดค่าไว้ (`agents.defaults.model.primary` และโมเดลหลักเฉพาะเอเจนต์) เป็นจุดเริ่มต้นปกติและใช้ `agents.defaults.model.fallbacks`
- การเลือกตัวสำรองอัตโนมัติเป็นสถานะการกู้คืนชั่วคราว โดยจัดเก็บพร้อม `modelOverrideSource: "auto"` เพื่อให้รอบถัดๆ ไปยังคงใช้เชนตัวสำรองได้โดยไม่ต้องลองโมเดลหลักที่รู้ว่าใช้ไม่ได้ก่อน
- การเลือกของผู้ใช้ในเซสชันเป็นแบบตรงตัว `/model`, ตัวเลือกโมเดล, `session_status(model=...)` และ `sessions.patch` จะจัดเก็บ `modelOverrideSource: "user"`; หากผู้ให้บริการ/โมเดลที่เลือกนั้นเข้าถึงไม่ได้ OpenClaw จะแสดงความล้มเหลวอย่างชัดเจนแทนที่จะตกไปใช้โมเดลอื่นที่กำหนดค่าไว้
- Cron `--model` / เพย์โหลด `model` เป็นโมเดลหลักรายงาน ยังคงใช้ตัวสำรองที่กำหนดค่าไว้ เว้นแต่งานจะระบุเพย์โหลด `fallbacks` อย่างชัดเจน (ใช้ `fallbacks: []` สำหรับการรัน cron แบบเข้มงวด)
- ตัวเลือก default-model ของ CLI และตัวเลือกรายการอนุญาตเคารพ `models.mode: "replace"` โดยแสดงรายการ `models.providers.*.models` ที่ระบุชัดเจน แทนการโหลดแค็ตตาล็อกในตัวทั้งหมด
- ตัวเลือกโมเดลของ Control UI จะถาม Gateway เพื่อขอมุมมองโมเดลที่กำหนดค่าไว้: `agents.defaults.models` เมื่อมีอยู่ รวมถึงรายการทั้งผู้ให้บริการ `provider/*` มิฉะนั้นจะใช้ `models.providers.*.models` ที่ระบุชัดเจน รวมถึงผู้ให้บริการที่มีการยืนยันตัวตนที่ใช้ได้ แค็ตตาล็อกในตัวทั้งหมดสงวนไว้สำหรับมุมมองการเรียกดูที่ระบุชัดเจน เช่น `models.list` ที่มี `view: "all"` หรือ `openclaw models list --all`

## นโยบายโมเดลแบบรวดเร็ว

- ตั้งโมเดลหลักของคุณเป็นโมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดที่คุณเข้าถึงได้
- ใช้ตัวสำรองสำหรับงานที่ไวต่อค่าใช้จ่าย/เวลาแฝง และแชตที่มีความเสี่ยงต่ำกว่า
- สำหรับเอเจนต์ที่เปิดใช้เครื่องมือหรืออินพุตที่ไม่น่าเชื่อถือ ให้หลีกเลี่ยงระดับโมเดลที่เก่ากว่า/อ่อนกว่า

## การเริ่มต้นใช้งาน (แนะนำ)

หากคุณไม่ต้องการแก้ไขการกำหนดค่าด้วยตนเอง ให้รันการเริ่มต้นใช้งาน:

```bash
openclaw onboard
```

สิ่งนี้สามารถตั้งค่าโมเดล + การยืนยันตัวตนสำหรับผู้ให้บริการทั่วไป รวมถึง **OpenAI Code (Codex) subscription** (OAuth) และ **Anthropic** (คีย์ API หรือ Claude CLI)

## คีย์การกำหนดค่า (ภาพรวม)

- `agents.defaults.model.primary` และ `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` และ `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` และ `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` และ `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` และ `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (รายการอนุญาต + นามแฝง + พารามิเตอร์ผู้ให้บริการ + รายการผู้ให้บริการไดนามิก `provider/*`)
- `models.providers` (ผู้ให้บริการแบบกำหนดเองที่เขียนลงใน `models.json`)

<Note>
การอ้างอิงโมเดลถูกปรับให้อยู่ในรูปตัวพิมพ์เล็ก นามแฝงผู้ให้บริการเช่น `z.ai/*` จะปรับเป็น `zai/*`

ตัวอย่างการกำหนดค่าผู้ให้บริการ (รวมถึง OpenCode) อยู่ใน [OpenCode](/th/providers/opencode)
</Note>

### การแก้ไขรายการอนุญาตอย่างปลอดภัย

ใช้การเขียนแบบเพิ่มเข้าไปเมื่ออัปเดต `agents.defaults.models` ด้วยตนเอง:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="กฎการป้องกันการเขียนทับ">
    `openclaw config set` ปกป้องแผนที่โมเดล/ผู้ให้บริการจากการเขียนทับโดยไม่ตั้งใจ การกำหนดออบเจ็กต์ธรรมดาให้กับ `agents.defaults.models`, `models.providers` หรือ `models.providers.<id>.models` จะถูกปฏิเสธเมื่อการกำหนดนั้นจะลบรายการที่มีอยู่ ใช้ `--merge` สำหรับการเปลี่ยนแปลงแบบเพิ่มเข้าไป; ใช้ `--replace` เฉพาะเมื่อค่าที่ให้มาควรกลายเป็นค่าเป้าหมายทั้งหมด

    การตั้งค่าผู้ให้บริการแบบโต้ตอบและ `openclaw configure --section model` จะรวมการเลือกที่มีขอบเขตตามผู้ให้บริการเข้ากับรายการอนุญาตที่มีอยู่ด้วย ดังนั้นการเพิ่ม Codex, Ollama หรือผู้ให้บริการอื่นจะไม่ทำให้รายการโมเดลที่ไม่เกี่ยวข้องหลุดหาย Configure จะรักษา `agents.defaults.model.primary` ที่มีอยู่เมื่อมีการใช้การยืนยันตัวตนของผู้ให้บริการอีกครั้ง คำสั่งตั้งค่าเริ่มต้นอย่างชัดเจน เช่น `openclaw models auth login --provider <id> --set-default` และ `openclaw models set <model>` ยังจะแทนที่ `agents.defaults.model.primary`

  </Accordion>
</AccordionGroup>

## "ไม่อนุญาตให้ใช้โมเดล" (และเหตุใดการตอบกลับจึงหยุด)

หากตั้งค่า `agents.defaults.models` ไว้ ค่านั้นจะกลายเป็น **รายการอนุญาต** สำหรับ `/model` และสำหรับการแทนที่เซสชัน เมื่อผู้ใช้เลือกโมเดลที่ไม่ได้อยู่ในรายการอนุญาตนั้น OpenClaw จะส่งคืน:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
สิ่งนี้เกิดขึ้น **ก่อน** สร้างการตอบกลับปกติ ดังนั้นข้อความอาจรู้สึกเหมือนว่า "ไม่ได้ตอบกลับ" วิธีแก้คือทำอย่างใดอย่างหนึ่ง:

- เพิ่มโมเดลลงใน `agents.defaults.models` หรือ
- ล้างรายการอนุญาต (ลบ `agents.defaults.models`) หรือ
- เลือกโมเดลจาก `/model list`

</Warning>

เมื่อคำสั่งที่ถูกปฏิเสธมีการแทนที่รันไทม์ เช่น `/model openai/gpt-5.5 --runtime codex` ให้แก้รายการอนุญาตก่อน แล้วลองคำสั่ง `/model ... --runtime ...` เดิมอีกครั้ง สำหรับการทำงานของ Codex แบบเนทีฟ โมเดลที่เลือกยังคงเป็น `openai/gpt-5.5`; รันไทม์ `codex` จะเลือกฮาร์เนสและใช้การยืนยันตัวตน Codex แยกต่างหาก

สำหรับโมเดลโลคัล/GGUF ให้จัดเก็บการอ้างอิงเต็มที่มีคำนำหน้าผู้ให้บริการในรายการอนุญาต
เช่น `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` หรือ
provider/model ที่ตรงตามที่แสดงโดย `openclaw models list --provider <provider>`
ชื่อไฟล์โลคัลแบบเปล่าหรือชื่อที่ใช้แสดงยังไม่เพียงพอเมื่อรายการอนุญาต
เปิดใช้งานอยู่

หากคุณต้องการจำกัดผู้ให้บริการโดยไม่ต้องแสดงรายการทุกโมเดลด้วยตนเอง ให้เพิ่ม
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
ปรากฏได้โดยไม่ต้องแก้ไขรายการอนุญาต รายการ `provider/model` แบบตรงตัวสามารถผสม
กับรายการ `provider/*` ได้เมื่อคุณต้องการโมเดลเฉพาะหนึ่งรายการจากผู้ให้บริการอื่น

ตัวอย่างการกำหนดค่ารายการอนุญาต:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## การสลับโมเดลในแชต (`/model`)

คุณสามารถสลับโมเดลสำหรับเซสชันปัจจุบันได้โดยไม่ต้องรีสตาร์ต:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="พฤติกรรมของตัวเลือก">
    - `/model` (และ `/model list`) เป็นตัวเลือกแบบกะทัดรัดที่มีหมายเลขกำกับ (ตระกูลโมเดล + ผู้ให้บริการที่ใช้ได้)
    - บน Discord, `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบที่มีดรอปดาวน์ผู้ให้บริการและโมเดล พร้อมขั้นตอน Submit
    - บน Telegram การเลือกจากตัวเลือก `/models` มีขอบเขตเฉพาะเซสชัน; จะไม่เปลี่ยนค่าเริ่มต้นถาวรของเอเจนต์ใน `openclaw.json`
    - `/models add` เลิกใช้แล้ว และตอนนี้จะส่งคืนข้อความเลิกใช้แทนการลงทะเบียนโมเดลจากแชต
    - `/model <#>` เลือกจากตัวเลือกนั้น

  </Accordion>
  <Accordion title="การคงค่าและการสลับแบบสด">
    - `/model` คงค่าการเลือกเซสชันใหม่ทันที
    - หากเอเจนต์ว่างอยู่ การรันถัดไปจะใช้โมเดลใหม่ทันที
    - หากมีการรันที่กำลังทำงานอยู่แล้ว OpenClaw จะทำเครื่องหมายการสลับแบบสดเป็นรอดำเนินการ และจะรีสตาร์ตเข้าสู่โมเดลใหม่เฉพาะที่จุดลองใหม่ที่สะอาดเท่านั้น
    - หากกิจกรรมเครื่องมือหรือเอาต์พุตตอบกลับเริ่มไปแล้ว การสลับที่รอดำเนินการอาจยังคงอยู่ในคิวจนกว่าจะมีโอกาสลองใหม่ในภายหลัง หรือรอบผู้ใช้ถัดไป
    - การอ้างอิง `/model` ที่ผู้ใช้เลือกจะเข้มงวดสำหรับเซสชันนั้น: หากผู้ให้บริการ/โมเดลที่เลือกเข้าถึงไม่ได้ การตอบกลับจะล้มเหลวอย่างชัดเจนแทนที่จะตอบอย่างเงียบๆ จาก `agents.defaults.model.fallbacks` สิ่งนี้ต่างจากค่าเริ่มต้นที่กำหนดค่าไว้และโมเดลหลักของงาน cron ซึ่งยังสามารถใช้เชนตัวสำรองได้
    - `/model status` เป็นมุมมองแบบละเอียด (ตัวเลือกการยืนยันตัวตน และเมื่อกำหนดค่าไว้ ปลายทางผู้ให้บริการ `baseUrl` + โหมด `api`)

  </Accordion>
  <Accordion title="Ref parsing">
    - การอ้างอิงโมเดลถูกแยกวิเคราะห์โดยแบ่งที่ `/` ตัว**แรก** ใช้ `provider/model` เมื่อพิมพ์ `/model <ref>`
    - หาก ID โมเดลเองมี `/` (สไตล์ OpenRouter) คุณต้องใส่คำนำหน้าผู้ให้บริการ (ตัวอย่าง: `/model openrouter/moonshotai/kimi-k2`)
    - หากคุณละผู้ให้บริการไว้ OpenClaw จะ resolve อินพุตตามลำดับนี้:
      1. ตรงกับ alias
      2. ตรงกับผู้ให้บริการที่กำหนดค่าไว้แบบไม่ซ้ำ สำหรับ ID โมเดลแบบไม่มีคำนำหน้านั้นพอดี
      3. fallback ที่เลิกใช้แล้วไปยังผู้ให้บริการเริ่มต้นที่กำหนดค่าไว้ — หากผู้ให้บริการนั้นไม่เปิดเผยโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะ fallback ไปยังคู่ผู้ให้บริการ/โมเดลแรกที่กำหนดค่าไว้แทน เพื่อหลีกเลี่ยงการแสดงค่าเริ่มต้นของผู้ให้บริการที่ถูกลบไปแล้วและล้าสมัย
  </Accordion>
</AccordionGroup>

พฤติกรรม/การกำหนดค่าคำสั่งแบบเต็ม: [คำสั่ง Slash](/th/tools/slash-commands).

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

แสดงโมเดลที่กำหนดค่าไว้/พร้อมใช้งานจากการยืนยันตัวตนโดยค่าเริ่มต้น แฟล็กที่มีประโยชน์:

<ParamField path="--all" type="boolean">
  แคตตาล็อกแบบเต็ม รวมแถวแคตตาล็อกแบบคงที่ที่เป็นของผู้ให้บริการที่มาพร้อมระบบ ก่อนที่จะมีการกำหนดค่าการยืนยันตัวตน ดังนั้นมุมมองสำหรับการค้นพบอย่างเดียวจึงสามารถแสดงโมเดลที่ยังใช้งานไม่ได้จนกว่าคุณจะเพิ่มข้อมูลประจำตัวของผู้ให้บริการที่ตรงกัน
</ParamField>
<ParamField path="--local" type="boolean">
  ผู้ให้บริการในเครื่องเท่านั้น
</ParamField>
<ParamField path="--provider <id>" type="string">
  กรองตาม ID ผู้ให้บริการ เช่น `moonshot` ไม่รับป้ายกำกับที่แสดงจากตัวเลือกแบบโต้ตอบ
</ParamField>
<ParamField path="--plain" type="boolean">
  หนึ่งโมเดลต่อหนึ่งบรรทัด
</ParamField>
<ParamField path="--json" type="boolean">
  เอาต์พุตที่เครื่องอ่านได้
</ParamField>

### `models status`

แสดงโมเดลหลักที่ resolve แล้ว, fallbacks, โมเดลรูปภาพ และภาพรวมการยืนยันตัวตนของผู้ให้บริการที่กำหนดค่าไว้ นอกจากนี้ยังแสดงสถานะการหมดอายุของ OAuth สำหรับโปรไฟล์ที่พบในที่เก็บการยืนยันตัวตน (เตือนภายใน 24 ชม. โดยค่าเริ่มต้น) `--plain` พิมพ์เฉพาะโมเดลหลักที่ resolve แล้ว

<AccordionGroup>
  <Accordion title="Auth and probe behavior">
    - สถานะ OAuth จะแสดงเสมอ (และรวมอยู่ในเอาต์พุต `--json`) หากผู้ให้บริการที่กำหนดค่าไว้ไม่มีข้อมูลประจำตัว `models status` จะพิมพ์ส่วน **ไม่มีการยืนยันตัวตน**
    - JSON มี `auth.oauth` (ช่วงเวลาเตือน + โปรไฟล์) และ `auth.providers` (การยืนยันตัวตนที่มีผลต่อผู้ให้บริการแต่ละราย รวมถึงข้อมูลประจำตัวที่มาจาก env) `auth.oauth` เป็นสถานะสุขภาพของโปรไฟล์ในที่เก็บการยืนยันตัวตนเท่านั้น; ผู้ให้บริการที่มีเฉพาะ env จะไม่ปรากฏที่นั่น
    - ใช้ `--check` สำหรับการทำงานอัตโนมัติ (ออกด้วย `1` เมื่อขาด/หมดอายุ, `2` เมื่อใกล้หมดอายุ)
    - ใช้ `--probe` สำหรับการตรวจสอบการยืนยันตัวตนแบบสด; แถว probe อาจมาจากโปรไฟล์การยืนยันตัวตน, ข้อมูลประจำตัว env, หรือ `models.json`
    - หาก `auth.order.<provider>` ที่ระบุอย่างชัดเจนละเว้นโปรไฟล์ที่จัดเก็บไว้ probe จะรายงาน `excluded_by_auth_order` แทนที่จะลองใช้โปรไฟล์นั้น หากมีการยืนยันตัวตนแต่ไม่สามารถ resolve โมเดลที่ probe ได้สำหรับผู้ให้บริการนั้น probe จะรายงาน `status: no_model`

  </Accordion>
</AccordionGroup>

<Note>
ตัวเลือกการยืนยันตัวตนขึ้นอยู่กับผู้ให้บริการ/บัญชี สำหรับโฮสต์ Gateway ที่เปิดตลอดเวลา API keys มักคาดเดาได้มากที่สุด; รองรับการใช้ Claude CLI ซ้ำและโปรไฟล์ Anthropic OAuth/token ที่มีอยู่ด้วย
</Note>

ตัวอย่าง (Claude CLI):

```bash
claude auth login
openclaw models status
```

## การสแกน (โมเดลฟรีของ OpenRouter)

`openclaw models scan` ตรวจสอบ**แคตตาล็อกโมเดลฟรี**ของ OpenRouter และสามารถ probe โมเดลสำหรับการรองรับเครื่องมือและรูปภาพได้ตามต้องการ

<ParamField path="--no-probe" type="boolean">
  ข้ามการ probe แบบสด (เฉพาะ metadata)
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
  ตั้ง `agents.defaults.imageModel.primary` เป็นตัวเลือกรูปภาพแรก
</ParamField>

<Note>
แคตตาล็อก `/models` ของ OpenRouter เป็นสาธารณะ ดังนั้นการสแกนเฉพาะ metadata จึงสามารถแสดงผู้สมัครฟรีได้โดยไม่ต้องใช้คีย์ การ probe และ inference ยังต้องใช้ OpenRouter API key (จากโปรไฟล์การยืนยันตัวตนหรือ `OPENROUTER_API_KEY`) หากไม่มีคีย์ `openclaw models scan` จะ fallback ไปยังเอาต์พุตเฉพาะ metadata และปล่อยการกำหนดค่าไว้ไม่เปลี่ยนแปลง ใช้ `--no-probe` เพื่อขอโหมดเฉพาะ metadata อย่างชัดเจน
</Note>

ผลการสแกนจัดอันดับตาม:

1. การรองรับรูปภาพ
2. เวลาแฝงของเครื่องมือ
3. ขนาด context
4. จำนวนพารามิเตอร์

อินพุต:

- รายการ `/models` ของ OpenRouter (ตัวกรอง `:free`)
- การ probe แบบสดต้องใช้ OpenRouter API key จากโปรไฟล์การยืนยันตัวตนหรือ `OPENROUTER_API_KEY` (ดู [ตัวแปรสภาพแวดล้อม](/th/help/environment))
- ตัวกรองที่เลือกได้: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- การควบคุมคำขอ/probe: `--timeout`, `--concurrency`

เมื่อการ probe แบบสดทำงานใน TTY คุณสามารถเลือก fallbacks แบบโต้ตอบได้ ในโหมดไม่โต้ตอบ ให้ส่ง `--yes` เพื่อยอมรับค่าเริ่มต้น ผลลัพธ์เฉพาะ metadata มีไว้เพื่อให้ข้อมูล; `--set-default` และ `--set-image` ต้องใช้การ probe แบบสด เพื่อให้ OpenClaw ไม่กำหนดค่าโมเดล OpenRouter ที่ไม่มีคีย์และใช้งานไม่ได้

## รีจิสทรีโมเดล (`models.json`)

ผู้ให้บริการที่กำหนดเองใน `models.providers` จะถูกเขียนลงใน `models.json` ใต้ไดเรกทอรีของ agent (ค่าเริ่มต้น `~/.openclaw/agents/<agentId>/agent/models.json`) ไฟล์นี้จะถูกผสานโดยค่าเริ่มต้น เว้นแต่ตั้ง `models.mode` เป็น `replace`

<AccordionGroup>
  <Accordion title="Merge mode precedence">
    ลำดับความสำคัญของโหมดผสานสำหรับ ID ผู้ให้บริการที่ตรงกัน:

    - `baseUrl` ที่ไม่ว่างและมีอยู่แล้วใน `models.json` ของ agent ชนะ
    - `apiKey` ที่ไม่ว่างใน `models.json` ของ agent ชนะเฉพาะเมื่อผู้ให้บริการนั้นไม่ได้จัดการโดย SecretRef ในบริบท config/auth-profile ปัจจุบัน
    - ค่า `apiKey` ของผู้ให้บริการที่จัดการโดย SecretRef จะถูกรีเฟรชจากเครื่องหมายแหล่งที่มา (`ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs) แทนการคงค่าความลับที่ resolve แล้ว
    - ค่าส่วนหัวของผู้ให้บริการที่จัดการโดย SecretRef จะถูกรีเฟรชจากเครื่องหมายแหล่งที่มา (`secretref-env:ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs)
    - `apiKey`/`baseUrl` ของ agent ที่ว่างหรือขาดหายจะ fallback ไปยัง config `models.providers`
    - ฟิลด์ผู้ให้บริการอื่นๆ จะถูกรีเฟรชจาก config และข้อมูลแคตตาล็อกที่ normalize แล้ว

  </Accordion>
</AccordionGroup>

<Note>
การคงอยู่ของ marker ยึดแหล่งที่มาเป็นอำนาจสูงสุด: OpenClaw เขียน markers จากสแนปช็อต config แหล่งที่มาที่ใช้งานอยู่ (ก่อน resolve) ไม่ใช่จากค่าความลับ runtime ที่ resolve แล้ว สิ่งนี้มีผลทุกครั้งที่ OpenClaw สร้าง `models.json` ใหม่ รวมถึงเส้นทางที่ขับเคลื่อนด้วยคำสั่ง เช่น `openclaw agent`
</Note>

## ที่เกี่ยวข้อง

- [รันไทม์ของ agent](/th/concepts/agent-runtimes) — PI, Codex, และรันไทม์ลูปของ agent อื่นๆ
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) — คีย์ config ของโมเดล
- [การสร้างรูปภาพ](/th/tools/image-generation) — การกำหนดค่าโมเดลรูปภาพ
- [การสลับโมเดลเมื่อเกิดความล้มเหลว](/th/concepts/model-failover) — เชน fallback
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers) — การกำหนดเส้นทางผู้ให้บริการและการยืนยันตัวตน
- [การสร้างเพลง](/th/tools/music-generation) — การกำหนดค่าโมเดลเพลง
- [การสร้างวิดีโอ](/th/tools/video-generation) — การกำหนดค่าโมเดลวิดีโอ
