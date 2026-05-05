---
read_when:
    - การเพิ่มหรือแก้ไข CLI ของ models (models list/set/scan/aliases/fallbacks)
    - การเปลี่ยนพฤติกรรมการใช้โมเดลสำรองหรือประสบการณ์ผู้ใช้ในการเลือก
    - การอัปเดตโพรบการสแกนโมเดล (เครื่องมือ/รูปภาพ)
sidebarTitle: Models CLI
summary: 'CLI สำหรับโมเดล: list, set, aliases, fallbacks, scan, status'
title: CLI โมเดล
x-i18n:
    generated_at: "2026-05-05T01:45:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a1dcdb046b914d35513974d4b69fec03a415118d11860dd1c5107efc754ed4f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="การสลับไปใช้โมเดลสำรอง" href="/th/concepts/model-failover">
    การหมุนเวียนโปรไฟล์ยืนยันตัวตน ช่วงพัก และวิธีที่สิ่งนั้นทำงานร่วมกับตัวสำรอง
  </Card>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers">
    ภาพรวมผู้ให้บริการแบบย่อและตัวอย่าง
  </Card>
  <Card title="รันไทม์ของเอเจนต์" href="/th/concepts/agent-runtimes">
    PI, Codex และรันไทม์ลูปเอเจนต์อื่นๆ
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/config-agents#agent-defaults">
    คีย์การกำหนดค่าโมเดล
  </Card>
</CardGroup>

การอ้างอิงโมเดลจะเลือกผู้ให้บริการและโมเดล โดยปกติจะไม่ได้เลือกรันไทม์เอเจนต์ระดับล่าง ตัวอย่างเช่น `openai/gpt-5.5` สามารถทำงานผ่านเส้นทางผู้ให้บริการ OpenAI ปกติ หรือผ่านรันไทม์เซิร์ฟเวอร์แอป Codex ได้ ขึ้นอยู่กับ `agents.defaults.agentRuntime.id` ในโหมดรันไทม์ Codex การอ้างอิง `openai/gpt-*` ไม่ได้หมายถึงการคิดค่าใช้จ่ายด้วยคีย์ API การยืนยันตัวตนอาจมาจากบัญชี Codex หรือโปรไฟล์ยืนยันตัวตน `openai-codex` ดู [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes)

## วิธีการทำงานของการเลือกโมเดล

OpenClaw เลือกโมเดลตามลำดับนี้:

<Steps>
  <Step title="โมเดลหลัก">
    `agents.defaults.model.primary` (หรือ `agents.defaults.model`)
  </Step>
  <Step title="ตัวสำรอง">
    `agents.defaults.model.fallbacks` (ตามลำดับ)
  </Step>
  <Step title="การสลับยืนยันตัวตนผู้ให้บริการ">
    การสลับยืนยันตัวตนเกิดขึ้นภายในผู้ให้บริการก่อนย้ายไปยังโมเดลถัดไป
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="พื้นผิวโมเดลที่เกี่ยวข้อง">
    - `agents.defaults.models` คือรายการอนุญาต/แค็ตตาล็อกของโมเดลที่ OpenClaw ใช้ได้ (รวมถึงนามแฝง)
    - `agents.defaults.imageModel` ใช้ **เฉพาะเมื่อ** โมเดลหลักรับรูปภาพไม่ได้
    - `agents.defaults.pdfModel` ใช้โดยเครื่องมือ `pdf` หากไม่ได้ระบุ เครื่องมือจะถอยกลับไปใช้ `agents.defaults.imageModel` แล้วจึงใช้โมเดลของเซสชัน/ค่าเริ่มต้นที่ resolve แล้ว
    - `agents.defaults.imageGenerationModel` ใช้โดยความสามารถสร้างรูปภาพที่ใช้ร่วมกัน หากไม่ได้ระบุ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน แล้วจึงลองผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับรหัสผู้ให้บริการ หากคุณตั้งค่าผู้ให้บริการ/โมเดลเฉพาะ ให้กำหนดค่าการยืนยันตัวตน/คีย์ API ของผู้ให้บริการนั้นด้วย
    - `agents.defaults.musicGenerationModel` ใช้โดยความสามารถสร้างเพลงที่ใช้ร่วมกัน หากไม่ได้ระบุ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน แล้วจึงลองผู้ให้บริการสร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับรหัสผู้ให้บริการ หากคุณตั้งค่าผู้ให้บริการ/โมเดลเฉพาะ ให้กำหนดค่าการยืนยันตัวตน/คีย์ API ของผู้ให้บริการนั้นด้วย
    - `agents.defaults.videoGenerationModel` ใช้โดยความสามารถสร้างวิดีโอที่ใช้ร่วมกัน หากไม่ได้ระบุ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน แล้วจึงลองผู้ให้บริการสร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับรหัสผู้ให้บริการ หากคุณตั้งค่าผู้ให้บริการ/โมเดลเฉพาะ ให้กำหนดค่าการยืนยันตัวตน/คีย์ API ของผู้ให้บริการนั้นด้วย
    - ค่าเริ่มต้นรายเอเจนต์สามารถแทนที่ `agents.defaults.model` ผ่าน `agents.list[].model` พร้อมการผูกได้ (ดู [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent))

  </Accordion>
</AccordionGroup>

## แหล่งที่มาของการเลือกและพฤติกรรมตัวสำรอง

`provider/model` เดียวกันอาจมีความหมายต่างกัน ขึ้นอยู่กับว่ามาจากที่ใด:

- ค่าเริ่มต้นที่กำหนดค่าไว้ (`agents.defaults.model.primary` และโมเดลหลักเฉพาะเอเจนต์) คือจุดเริ่มต้นปกติและใช้ `agents.defaults.model.fallbacks`
- การเลือกตัวสำรองอัตโนมัติเป็นสถานะกู้คืนชั่วคราว โดยจัดเก็บพร้อม `modelOverrideSource: "auto"` เพื่อให้รอบถัดไปใช้ห่วงโซ่ตัวสำรองต่อไปได้โดยไม่ต้องลองโมเดลหลักที่รู้ว่าเสียก่อน
- การเลือกเซสชันของผู้ใช้เป็นแบบเจาะจง `/model`, ตัวเลือกโมเดล, `session_status(model=...)` และ `sessions.patch` จะจัดเก็บ `modelOverrideSource: "user"` หากผู้ให้บริการ/โมเดลที่เลือกนั้นเข้าถึงไม่ได้ OpenClaw จะล้มเหลวให้เห็นชัดแทนที่จะถอยไปยังโมเดลอื่นที่กำหนดค่าไว้
- Cron `--model` / เพย์โหลด `model` เป็นโมเดลหลักรายงาน ยังใช้ตัวสำรองที่กำหนดค่าไว้ เว้นแต่งานจะระบุเพย์โหลด `fallbacks` อย่างชัดเจน (ใช้ `fallbacks: []` สำหรับการรัน Cron แบบเข้มงวด)
- ตัวเลือกโมเดลเริ่มต้นและรายการอนุญาตของ CLI จะเคารพ `models.mode: "replace"` โดยแสดง `models.providers.*.models` ที่ระบุชัดเจน แทนการโหลดแค็ตตาล็อกในตัวทั้งหมด
- ตัวเลือกโมเดลใน Control UI จะถาม Gateway เพื่อดูมุมมองโมเดลที่กำหนดค่าไว้: `agents.defaults.models` เมื่อมีอยู่ ไม่เช่นนั้นใช้ `models.providers.*.models` ที่ระบุชัดเจนพร้อมผู้ให้บริการที่มีการยืนยันตัวตนใช้งานได้ แค็ตตาล็อกในตัวทั้งหมดสงวนไว้สำหรับมุมมองเรียกดูแบบชัดเจน เช่น `models.list` พร้อม `view: "all"` หรือ `openclaw models list --all`

## นโยบายโมเดลแบบย่อ

- ตั้งค่าโมเดลหลักเป็นโมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดที่คุณมีสิทธิ์ใช้
- ใช้ตัวสำรองสำหรับงานที่ไวต่อค่าใช้จ่าย/เวลาแฝง และแชตที่มีความเสี่ยงต่ำกว่า
- สำหรับเอเจนต์ที่เปิดใช้เครื่องมือหรืออินพุตที่ไม่น่าเชื่อถือ ให้หลีกเลี่ยงระดับโมเดลที่เก่ากว่า/อ่อนกว่า

## การเริ่มต้นใช้งาน (แนะนำ)

หากคุณไม่ต้องการแก้ไขการกำหนดค่าด้วยมือ ให้รันการเริ่มต้นใช้งาน:

```bash
openclaw onboard
```

สามารถตั้งค่าโมเดล + การยืนยันตัวตนสำหรับผู้ให้บริการทั่วไป รวมถึง **การสมัครใช้งาน OpenAI Code (Codex)** (OAuth) และ **Anthropic** (คีย์ API หรือ Claude CLI)

## คีย์การกำหนดค่า (ภาพรวม)

- `agents.defaults.model.primary` และ `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` และ `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` และ `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` และ `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` และ `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (รายการอนุญาต + นามแฝง + พารามิเตอร์ผู้ให้บริการ)
- `models.providers` (ผู้ให้บริการกำหนดเองที่เขียนลงใน `models.json`)

<Note>
การอ้างอิงโมเดลจะถูกทำให้เป็นตัวพิมพ์เล็ก นามแฝงผู้ให้บริการอย่าง `z.ai/*` จะ normalize เป็น `zai/*`

ตัวอย่างการกำหนดค่าผู้ให้บริการ (รวมถึง OpenCode) อยู่ใน [OpenCode](/th/providers/opencode)
</Note>

### การแก้ไขรายการอนุญาตอย่างปลอดภัย

ใช้การเขียนแบบเพิ่มเมื่ออัปเดต `agents.defaults.models` ด้วยมือ:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="กฎป้องกันการเขียนทับ">
    `openclaw config set` ปกป้องแมปโมเดล/ผู้ให้บริการจากการเขียนทับโดยไม่ตั้งใจ การกำหนดออบเจ็กต์ปกติให้กับ `agents.defaults.models`, `models.providers` หรือ `models.providers.<id>.models` จะถูกปฏิเสธเมื่อจะทำให้รายการเดิมถูกลบ ใช้ `--merge` สำหรับการเปลี่ยนแปลงแบบเพิ่ม ใช้ `--replace` เฉพาะเมื่อค่าที่ให้มาควรกลายเป็นค่าปลายทางทั้งหมด

    การตั้งค่าผู้ให้บริการแบบโต้ตอบและ `openclaw configure --section model` จะรวมการเลือกในขอบเขตผู้ให้บริการเข้ากับรายการอนุญาตเดิมด้วย ดังนั้นการเพิ่ม Codex, Ollama หรือผู้ให้บริการอื่นจะไม่ลบรายการโมเดลที่ไม่เกี่ยวข้อง Configure จะรักษา `agents.defaults.model.primary` ที่มีอยู่เมื่อมีการใช้การยืนยันตัวตนผู้ให้บริการซ้ำ คำสั่งตั้งค่าเริ่มต้นอย่างชัดเจน เช่น `openclaw models auth login --provider <id> --set-default` และ `openclaw models set <model>` ยังจะแทนที่ `agents.defaults.model.primary`

  </Accordion>
</AccordionGroup>

## "ไม่อนุญาตให้ใช้โมเดล" (และเหตุผลที่การตอบหยุด)

หากตั้งค่า `agents.defaults.models` ไว้ ค่านี้จะกลายเป็น **รายการอนุญาต** สำหรับ `/model` และสำหรับการแทนที่ในเซสชัน เมื่อผู้ใช้เลือกโมเดลที่ไม่ได้อยู่ในรายการอนุญาตนั้น OpenClaw จะส่งคืน:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
สิ่งนี้เกิดขึ้น **ก่อน** ที่จะสร้างคำตอบปกติ ดังนั้นข้อความอาจรู้สึกเหมือนว่า “ไม่ได้ตอบ” วิธีแก้คือทำอย่างใดอย่างหนึ่ง:

- เพิ่มโมเดลลงใน `agents.defaults.models` หรือ
- ล้างรายการอนุญาต (ลบ `agents.defaults.models`) หรือ
- เลือกโมเดลจาก `/model list`

</Warning>

เมื่อคำสั่งที่ถูกปฏิเสธรวมการแทนที่รันไทม์ เช่น `/model openai/gpt-5.5 --runtime codex` ให้แก้ไขรายการอนุญาตก่อน แล้วจึงลองคำสั่ง `/model ... --runtime ...` เดิมอีกครั้ง สำหรับการดำเนินการ Codex แบบเนทีฟ โมเดลที่เลือกยังคงเป็น `openai/gpt-5.5`; รันไทม์ `codex` จะเลือก harness และใช้การยืนยันตัวตน Codex แยกต่างหาก

สำหรับโมเดล local/GGUF ให้จัดเก็บการอ้างอิงแบบเต็มที่มีคำนำหน้าผู้ให้บริการในรายการอนุญาต
เช่น `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` หรือ
provider/model แบบตรงตามที่แสดงโดย `openclaw models list --provider <provider>`
ชื่อไฟล์ local แบบไม่มีคำนำหน้าหรือชื่อที่แสดงยังไม่เพียงพอเมื่อรายการอนุญาต
เปิดใช้งานอยู่

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
  <Accordion title="พฤติกรรมตัวเลือก">
    - `/model` (และ `/model list`) เป็นตัวเลือกแบบกระชับที่มีหมายเลข (ตระกูลโมเดล + ผู้ให้บริการที่พร้อมใช้งาน)
    - บน Discord, `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบที่มีดรอปดาวน์ผู้ให้บริการและโมเดล พร้อมขั้นตอน Submit
    - บน Telegram การเลือกในตัวเลือก `/models` จะอยู่ในขอบเขตเซสชัน และจะไม่เปลี่ยนค่าเริ่มต้นถาวรของเอเจนต์ใน `openclaw.json`
    - `/models add` เลิกใช้แล้ว และตอนนี้จะส่งคืนข้อความเลิกใช้แทนการลงทะเบียนโมเดลจากแชต
    - `/model <#>` เลือกจากตัวเลือกนั้น

  </Accordion>
  <Accordion title="การคงค่าและการสลับแบบสด">
    - `/model` จะคงค่าการเลือกเซสชันใหม่ทันที
    - หากเอเจนต์ว่างอยู่ การรันถัดไปจะใช้โมเดลใหม่ทันที
    - หากมีการรันที่ใช้งานอยู่แล้ว OpenClaw จะทำเครื่องหมายการสลับแบบสดเป็นรอดำเนินการ และจะรีสตาร์ตเข้าสู่โมเดลใหม่เฉพาะที่จุดลองใหม่ที่สะอาด
    - หากกิจกรรมเครื่องมือหรือเอาต์พุตคำตอบเริ่มไปแล้ว การสลับที่รอดำเนินการอาจยังคงอยู่ในคิวจนกว่าจะมีโอกาสลองใหม่ในภายหลังหรือในรอบผู้ใช้ถัดไป
    - การอ้างอิง `/model` ที่ผู้ใช้เลือกจะเข้มงวดสำหรับเซสชันนั้น: หากผู้ให้บริการ/โมเดลที่เลือกเข้าถึงไม่ได้ คำตอบจะล้มเหลวให้เห็นชัดแทนที่จะตอบแบบเงียบๆ จาก `agents.defaults.model.fallbacks` ซึ่งแตกต่างจากค่าเริ่มต้นที่กำหนดค่าไว้และโมเดลหลักของงาน Cron ที่ยังสามารถใช้ห่วงโซ่ตัวสำรองได้
    - `/model status` คือมุมมองรายละเอียด (ตัวเลือกการยืนยันตัวตน และเมื่อกำหนดค่าไว้ จะมี endpoint ผู้ให้บริการ `baseUrl` + โหมด `api`)

  </Accordion>
  <Accordion title="การแยกวิเคราะห์การอ้างอิง">
    - การอ้างอิงโมเดลจะแยกโดยตัดที่ `/` ตัว **แรก** ใช้ `provider/model` เมื่อพิมพ์ `/model <ref>`
    - หากรหัสโมเดลเองมี `/` (สไตล์ OpenRouter) คุณต้องใส่คำนำหน้าผู้ให้บริการ (ตัวอย่าง: `/model openrouter/moonshotai/kimi-k2`)
    - หากคุณละผู้ให้บริการ OpenClaw จะ resolve อินพุตตามลำดับนี้:
      1. ตรงกับนามแฝง
      2. ตรงกับผู้ให้บริการที่กำหนดค่าไว้แบบไม่ซ้ำสำหรับรหัสโมเดลที่ไม่มีคำนำหน้านั้นแบบตรงตัว
      3. ถอยกลับแบบเลิกใช้ไปยังผู้ให้บริการค่าเริ่มต้นที่กำหนดค่าไว้ — หากผู้ให้บริการนั้นไม่เปิดเผยโมเดลค่าเริ่มต้นที่กำหนดค่าไว้แล้ว OpenClaw จะถอยกลับไปยังผู้ให้บริการ/โมเดลที่กำหนดค่าไว้รายการแรกแทน เพื่อหลีกเลี่ยงการแสดงค่าเริ่มต้นของผู้ให้บริการที่ถูกลบไปแล้วซึ่งล้าสมัย
  </Accordion>
</AccordionGroup>

พฤติกรรมคำสั่ง/การกำหนดค่าแบบเต็ม: [คำสั่งสแลช](/th/tools/slash-commands)

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

แสดงโมเดลที่กำหนดค่าไว้/มี auth พร้อมใช้งานตามค่าเริ่มต้น แฟล็กที่มีประโยชน์:

<ParamField path="--all" type="boolean">
  แคตตาล็อกแบบเต็ม รวมแถวแคตตาล็อกแบบสแตติกที่มาพร้อมระบบและเป็นของผู้ให้บริการก่อนที่จะกำหนดค่า auth ดังนั้นมุมมองสำหรับการสำรวจอย่างเดียวจึงสามารถแสดงโมเดลที่ยังไม่พร้อมใช้งานจนกว่าคุณจะเพิ่มข้อมูลรับรองของผู้ให้บริการที่ตรงกัน
</ParamField>
<ParamField path="--local" type="boolean">
  ผู้ให้บริการภายในเครื่องเท่านั้น
</ParamField>
<ParamField path="--provider <id>" type="string">
  กรองตาม id ผู้ให้บริการ เช่น `moonshot` ไม่ยอมรับป้ายกำกับที่แสดงจากตัวเลือกแบบโต้ตอบ
</ParamField>
<ParamField path="--plain" type="boolean">
  หนึ่งโมเดลต่อบรรทัด
</ParamField>
<ParamField path="--json" type="boolean">
  เอาต์พุตที่เครื่องอ่านได้
</ParamField>

### `models status`

แสดงโมเดลหลักที่ resolve แล้ว, fallback, โมเดลรูปภาพ และภาพรวม auth ของผู้ให้บริการที่กำหนดค่าไว้ นอกจากนี้ยังแสดงสถานะการหมดอายุของ OAuth สำหรับโปรไฟล์ที่พบในที่เก็บ auth (เตือนภายใน 24 ชม. ตามค่าเริ่มต้น) `--plain` พิมพ์เฉพาะโมเดลหลักที่ resolve แล้ว

<AccordionGroup>
  <Accordion title="Auth and probe behavior">
    - สถานะ OAuth จะแสดงเสมอ (และรวมอยู่ในเอาต์พุต `--json`) หากผู้ให้บริการที่กำหนดค่าไว้ไม่มีข้อมูลรับรอง `models status` จะพิมพ์ส่วน **ไม่มี auth**
    - JSON รวม `auth.oauth` (ช่วงเวลาเตือน + โปรไฟล์) และ `auth.providers` (auth ที่มีผลต่อผู้ให้บริการแต่ละราย รวมถึงข้อมูลรับรองที่มาจาก env) `auth.oauth` เป็นสถานะสุขภาพของโปรไฟล์ในที่เก็บ auth เท่านั้น ผู้ให้บริการที่มีเฉพาะ env จะไม่ปรากฏที่นั่น
    - ใช้ `--check` สำหรับ automation (exit `1` เมื่อขาดหาย/หมดอายุ, `2` เมื่อใกล้หมดอายุ)
    - ใช้ `--probe` สำหรับการตรวจสอบ auth แบบสด แถว probe อาจมาจากโปรไฟล์ auth, ข้อมูลรับรอง env หรือ `models.json`
    - หาก `auth.order.<provider>` ที่ระบุอย่างชัดเจนละเว้นโปรไฟล์ที่จัดเก็บไว้ probe จะรายงาน `excluded_by_auth_order` แทนการลองใช้โปรไฟล์นั้น หากมี auth แต่ไม่สามารถ resolve โมเดลที่ probe ได้สำหรับผู้ให้บริการนั้น probe จะรายงาน `status: no_model`

  </Accordion>
</AccordionGroup>

<Note>
การเลือก auth ขึ้นอยู่กับผู้ให้บริการ/บัญชี สำหรับโฮสต์ Gateway ที่เปิดตลอดเวลา โดยทั่วไป API key จะคาดการณ์ได้ดีที่สุด และยังรองรับการใช้ Claude CLI ซ้ำ รวมถึงโปรไฟล์ Anthropic OAuth/token ที่มีอยู่ด้วย
</Note>

ตัวอย่าง (Claude CLI):

```bash
claude auth login
openclaw models status
```

## การสแกน (โมเดลฟรีของ OpenRouter)

`openclaw models scan` ตรวจสอบ **แคตตาล็อกโมเดลฟรี** ของ OpenRouter และสามารถ probe โมเดลเพื่อตรวจสอบการรองรับเครื่องมือและรูปภาพได้ตามต้องการ

<ParamField path="--no-probe" type="boolean">
  ข้าม live probes (เฉพาะ metadata)
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
  ตั้งค่า `agents.defaults.model.primary` เป็นรายการที่เลือกแรก
</ParamField>
<ParamField path="--set-image" type="boolean">
  ตั้งค่า `agents.defaults.imageModel.primary` เป็นรายการรูปภาพที่เลือกแรก
</ParamField>

<Note>
แคตตาล็อก OpenRouter `/models` เป็นสาธารณะ ดังนั้นการสแกนเฉพาะ metadata จึงสามารถแสดงรายการ candidate ฟรีได้โดยไม่ต้องใช้คีย์ การ probe และ inference ยังต้องใช้ OpenRouter API key (จากโปรไฟล์ auth หรือ `OPENROUTER_API_KEY`) หากไม่มีคีย์ `openclaw models scan` จะ fallback ไปใช้เอาต์พุตเฉพาะ metadata และปล่อย config ไว้ไม่เปลี่ยนแปลง ใช้ `--no-probe` เพื่อขอโหมดเฉพาะ metadata อย่างชัดเจน
</Note>

ผลการสแกนจัดอันดับตาม:

1. การรองรับรูปภาพ
2. Latency ของเครื่องมือ
3. ขนาดบริบท
4. จำนวนพารามิเตอร์

อินพุต:

- รายการ OpenRouter `/models` (ตัวกรอง `:free`)
- Live probes ต้องใช้ OpenRouter API key จากโปรไฟล์ auth หรือ `OPENROUTER_API_KEY` (ดู [ตัวแปรสภาพแวดล้อม](/th/help/environment))
- ตัวกรองที่เลือกได้: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- การควบคุม request/probe: `--timeout`, `--concurrency`

เมื่อ live probes ทำงานใน TTY คุณสามารถเลือก fallback แบบโต้ตอบได้ ในโหมดไม่โต้ตอบ ให้ส่ง `--yes` เพื่อยอมรับค่าเริ่มต้น ผลลัพธ์เฉพาะ metadata เป็นข้อมูลประกอบเท่านั้น `--set-default` และ `--set-image` ต้องใช้ live probes เพื่อให้ OpenClaw ไม่กำหนดค่าโมเดล OpenRouter ที่ไม่มีคีย์และใช้งานไม่ได้

## รีจิสทรีโมเดล (`models.json`)

ผู้ให้บริการแบบกำหนดเองใน `models.providers` จะถูกเขียนลงใน `models.json` ใต้ไดเรกทอรี agent (ค่าเริ่มต้น `~/.openclaw/agents/<agentId>/agent/models.json`) ไฟล์นี้จะถูก merge ตามค่าเริ่มต้น เว้นแต่ `models.mode` จะตั้งค่าเป็น `replace`

<AccordionGroup>
  <Accordion title="Merge mode precedence">
    ลำดับความสำคัญของโหมด merge สำหรับ provider IDs ที่ตรงกัน:

    - `baseUrl` ที่ไม่ว่างและมีอยู่แล้วใน `models.json` ของ agent จะชนะ
    - `apiKey` ที่ไม่ว่างใน `models.json` ของ agent จะชนะเฉพาะเมื่อผู้ให้บริการนั้นไม่ได้จัดการด้วย SecretRef ในบริบท config/auth-profile ปัจจุบัน
    - ค่า `apiKey` ของผู้ให้บริการที่จัดการด้วย SecretRef จะรีเฟรชจากเครื่องหมายแหล่งที่มา (`ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs) แทนการคงค่า secret ที่ resolve แล้ว
    - ค่า header ของผู้ให้บริการที่จัดการด้วย SecretRef จะรีเฟรชจากเครื่องหมายแหล่งที่มา (`secretref-env:ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs)
    - `apiKey`/`baseUrl` ของ agent ที่ว่างหรือหายไปจะ fallback ไปยัง config `models.providers`
    - ฟิลด์ผู้ให้บริการอื่นจะรีเฟรชจาก config และข้อมูลแคตตาล็อกที่ normalize แล้ว

  </Accordion>
</AccordionGroup>

<Note>
การคงอยู่ของ marker ยึดแหล่งที่มาเป็นหลัก: OpenClaw เขียน marker จาก snapshot config ของแหล่งที่มาที่ใช้งานอยู่ (ก่อน resolution) ไม่ใช่จากค่า secret runtime ที่ resolve แล้ว สิ่งนี้มีผลทุกครั้งที่ OpenClaw สร้าง `models.json` ใหม่ รวมถึงเส้นทางที่ขับเคลื่อนด้วยคำสั่ง เช่น `openclaw agent`
</Note>

## ที่เกี่ยวข้อง

- [รันไทม์ของ agent](/th/concepts/agent-runtimes) — PI, Codex และรันไทม์ลูป agent อื่น ๆ
- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) — คีย์ config ของโมเดล
- [การสร้างรูปภาพ](/th/tools/image-generation) — การกำหนดค่าโมเดลรูปภาพ
- [Model failover](/th/concepts/model-failover) — เชน fallback
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers) — การกำหนดเส้นทางผู้ให้บริการและ auth
- [การสร้างเพลง](/th/tools/music-generation) — การกำหนดค่าโมเดลเพลง
- [การสร้างวิดีโอ](/th/tools/video-generation) — การกำหนดค่าโมเดลวิดีโอ
