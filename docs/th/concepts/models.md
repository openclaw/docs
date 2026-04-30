---
read_when:
    - การเพิ่มหรือแก้ไข CLI สำหรับโมเดล (models list/set/scan/aliases/fallbacks)
    - การเปลี่ยนพฤติกรรมการใช้โมเดลสำรองหรือประสบการณ์ผู้ใช้ในการเลือก
    - การอัปเดตโพรบการสแกนโมเดล (เครื่องมือ/รูปภาพ)
sidebarTitle: Models CLI
summary: 'CLI สำหรับโมเดล: list, set, aliases, fallbacks, scan, status'
title: CLI สำหรับโมเดล
x-i18n:
    generated_at: "2026-04-30T09:47:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64b97ddfcc6f804044580dfc9a441d426f737e9e7d007d78b0b045a52068b34f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="การทำ failover ของโมเดล" href="/th/concepts/model-failover">
    การหมุนเวียนโปรไฟล์การยืนยันตัวตน, คูลดาวน์, และวิธีที่สิ่งนี้โต้ตอบกับ fallback
  </Card>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers">
    ภาพรวมผู้ให้บริการแบบย่อและตัวอย่าง
  </Card>
  <Card title="รันไทม์ของเอเจนต์" href="/th/concepts/agent-runtimes">
    PI, Codex, และรันไทม์ลูปของเอเจนต์อื่นๆ
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/config-agents#agent-defaults">
    คีย์การกำหนดค่าโมเดล
  </Card>
</CardGroup>

การอ้างอิงโมเดลเลือกผู้ให้บริการและโมเดล โดยปกติจะไม่ได้เลือกรันไทม์ของเอเจนต์ระดับต่ำ ตัวอย่างเช่น `openai/gpt-5.5` สามารถทำงานผ่านเส้นทางผู้ให้บริการ OpenAI ปกติ หรือผ่านรันไทม์แอปเซิร์ฟเวอร์ Codex ได้ ขึ้นอยู่กับ `agents.defaults.agentRuntime.id` ดู [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes)

## วิธีการเลือกโมเดลทำงาน

OpenClaw เลือกโมเดลตามลำดับนี้:

<Steps>
  <Step title="โมเดลหลัก">
    `agents.defaults.model.primary` (หรือ `agents.defaults.model`)
  </Step>
  <Step title="Fallback">
    `agents.defaults.model.fallbacks` (ตามลำดับ)
  </Step>
  <Step title="การทำ failover การยืนยันตัวตนของผู้ให้บริการ">
    การทำ failover การยืนยันตัวตนเกิดขึ้นภายในผู้ให้บริการก่อนจะย้ายไปยังโมเดลถัดไป
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="พื้นผิวโมเดลที่เกี่ยวข้อง">
    - `agents.defaults.models` คือ allowlist/แค็ตตาล็อกของโมเดลที่ OpenClaw ใช้ได้ (รวมถึงนามแฝง)
    - `agents.defaults.imageModel` ใช้ **เฉพาะเมื่อ** โมเดลหลักไม่สามารถรับรูปภาพได้
    - `agents.defaults.pdfModel` ใช้โดยเครื่องมือ `pdf` หากละไว้ เครื่องมือจะ fallback ไปที่ `agents.defaults.imageModel` แล้วจึงไปที่โมเดลที่ resolve แล้วของเซสชัน/ค่าเริ่มต้น
    - `agents.defaults.imageGenerationModel` ใช้โดยความสามารถสร้างรูปภาพที่ใช้ร่วมกัน หากละไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน แล้วจึงลองผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id หากคุณตั้งค่าผู้ให้บริการ/โมเดลเฉพาะ ให้กำหนดค่าการยืนยันตัวตน/API key ของผู้ให้บริการนั้นด้วย
    - `agents.defaults.musicGenerationModel` ใช้โดยความสามารถสร้างเพลงที่ใช้ร่วมกัน หากละไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน แล้วจึงลองผู้ให้บริการสร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id หากคุณตั้งค่าผู้ให้บริการ/โมเดลเฉพาะ ให้กำหนดค่าการยืนยันตัวตน/API key ของผู้ให้บริการนั้นด้วย
    - `agents.defaults.videoGenerationModel` ใช้โดยความสามารถสร้างวิดีโอที่ใช้ร่วมกัน หากละไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน แล้วจึงลองผู้ให้บริการสร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id หากคุณตั้งค่าผู้ให้บริการ/โมเดลเฉพาะ ให้กำหนดค่าการยืนยันตัวตน/API key ของผู้ให้บริการนั้นด้วย
    - ค่าเริ่มต้นต่อเอเจนต์สามารถแทนที่ `agents.defaults.model` ผ่าน `agents.list[].model` พร้อมการผูกได้ (ดู [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent))

  </Accordion>
</AccordionGroup>

## แหล่งที่มาของการเลือกและพฤติกรรม fallback

`provider/model` เดียวกันอาจหมายถึงสิ่งต่างกัน ขึ้นอยู่กับว่ามาจากที่ใด:

- ค่าเริ่มต้นที่กำหนดค่าไว้ (`agents.defaults.model.primary` และโมเดลหลักเฉพาะเอเจนต์) คือจุดเริ่มต้นปกติและใช้ `agents.defaults.model.fallbacks`
- การเลือก auto fallback คือสถานะการกู้คืนชั่วคราว ซึ่งถูกจัดเก็บพร้อม `modelOverrideSource: "auto"` เพื่อให้รอบถัดไปใช้เชน fallback ต่อได้โดยไม่ต้อง probe โมเดลหลักที่ทราบว่าใช้งานไม่ได้ก่อน
- การเลือกเซสชันของผู้ใช้เป็นแบบเจาะจง `/model`, ตัวเลือกโมเดล, `session_status(model=...)`, และ `sessions.patch` จะจัดเก็บ `modelOverrideSource: "user"`; หากผู้ให้บริการ/โมเดลที่เลือกนั้นเข้าถึงไม่ได้ OpenClaw จะล้มเหลวแบบมองเห็นได้ แทนที่จะไหลไปยังโมเดลที่กำหนดค่าไว้อื่น
- Cron `--model` / payload `model` คือโมเดลหลักต่อหนึ่งงาน และยังใช้ fallback ที่กำหนดค่าไว้ เว้นแต่งานจะส่ง payload `fallbacks` ที่ชัดเจน (ใช้ `fallbacks: []` สำหรับการรัน cron แบบเข้มงวด)
- ตัวเลือก CLI default-model และ allowlist เคารพ `models.mode: "replace"` โดยแสดงรายการ `models.providers.*.models` ที่ระบุไว้ชัดเจน แทนที่จะโหลดแค็ตตาล็อกในตัวทั้งหมด
- ตัวเลือกโมเดลใน UI ควบคุมจะถาม Gateway สำหรับมุมมองโมเดลที่กำหนดค่าไว้: `agents.defaults.models` เมื่อมีอยู่ มิฉะนั้นจะใช้ `models.providers.*.models` ที่ระบุไว้ชัดเจน พร้อมผู้ให้บริการที่มีการยืนยันตัวตนที่ใช้งานได้ แค็ตตาล็อกในตัวทั้งหมดสงวนไว้สำหรับมุมมองเรียกดูแบบชัดเจน เช่น `models.list` ที่มี `view: "all"` หรือ `openclaw models list --all`

## นโยบายโมเดลแบบย่อ

- ตั้งค่าโมเดลหลักเป็นโมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดที่คุณเข้าถึงได้
- ใช้ fallback สำหรับงานที่ไวต่อค่าใช้จ่าย/เวลาแฝง และการแชตที่ความเสี่ยงต่ำกว่า
- สำหรับเอเจนต์ที่เปิดใช้เครื่องมือหรืออินพุตที่ไม่น่าเชื่อถือ ให้หลีกเลี่ยงระดับโมเดลเก่ากว่าหรืออ่อนกว่า

## การเริ่มต้นใช้งาน (แนะนำ)

หากคุณไม่ต้องการแก้ไขการกำหนดค่าด้วยมือ ให้รัน onboarding:

```bash
openclaw onboard
```

สามารถตั้งค่าโมเดล + การยืนยันตัวตนสำหรับผู้ให้บริการทั่วไปได้ รวมถึง **การสมัครสมาชิก OpenAI Code (Codex)** (OAuth) และ **Anthropic** (API key หรือ Claude CLI)

## คีย์การกำหนดค่า (ภาพรวม)

- `agents.defaults.model.primary` และ `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` และ `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` และ `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` และ `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` และ `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + นามแฝง + พารามิเตอร์ผู้ให้บริการ)
- `models.providers` (ผู้ให้บริการแบบกำหนดเองที่เขียนลงใน `models.json`)

<Note>
การอ้างอิงโมเดลถูก normalize เป็นตัวพิมพ์เล็ก นามแฝงผู้ให้บริการเช่น `z.ai/*` จะ normalize เป็น `zai/*`

ตัวอย่างการกำหนดค่าผู้ให้บริการ (รวมถึง OpenCode) อยู่ใน [OpenCode](/th/providers/opencode)
</Note>

### การแก้ไข allowlist อย่างปลอดภัย

ใช้การเขียนแบบเพิ่มเข้าไปเมื่ออัปเดต `agents.defaults.models` ด้วยมือ:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="กฎการป้องกันการเขียนทับ">
    `openclaw config set` ปกป้องแผนที่โมเดล/ผู้ให้บริการจากการเขียนทับโดยไม่ตั้งใจ การกำหนดออบเจ็กต์ธรรมดาให้กับ `agents.defaults.models`, `models.providers`, หรือ `models.providers.<id>.models` จะถูกปฏิเสธเมื่อจะลบรายการที่มีอยู่ ใช้ `--merge` สำหรับการเปลี่ยนแปลงแบบเพิ่มเข้าไป; ใช้ `--replace` เฉพาะเมื่อค่าที่ให้มาควรกลายเป็นค่าเป้าหมายทั้งหมด

    การตั้งค่าผู้ให้บริการแบบโต้ตอบและ `openclaw configure --section model` จะ merge การเลือกตามขอบเขตผู้ให้บริการเข้ากับ allowlist ที่มีอยู่ด้วย ดังนั้นการเพิ่ม Codex, Ollama, หรือผู้ให้บริการอื่นจะไม่ลบรายการโมเดลที่ไม่เกี่ยวข้อง Configure จะรักษา `agents.defaults.model.primary` ที่มีอยู่เมื่อมีการนำการยืนยันตัวตนของผู้ให้บริการกลับมาใช้ คำสั่งตั้งค่าค่าเริ่มต้นที่ชัดเจน เช่น `openclaw models auth login --provider <id> --set-default` และ `openclaw models set <model>` ยังคงแทนที่ `agents.defaults.model.primary`

  </Accordion>
</AccordionGroup>

## "ไม่อนุญาตให้ใช้โมเดล" (และเหตุผลที่การตอบกลับหยุด)

หากตั้งค่า `agents.defaults.models` ไว้ สิ่งนี้จะกลายเป็น **allowlist** สำหรับ `/model` และสำหรับการแทนที่เซสชัน เมื่อผู้ใช้เลือกโมเดลที่ไม่ได้อยู่ใน allowlist นั้น OpenClaw จะส่งคืน:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
สิ่งนี้เกิดขึ้น **ก่อน** ที่จะสร้างการตอบกลับปกติ ดังนั้นข้อความอาจรู้สึกเหมือน "ไม่ได้ตอบกลับ" วิธีแก้คือเลือกอย่างใดอย่างหนึ่ง:

- เพิ่มโมเดลลงใน `agents.defaults.models`, หรือ
- ล้าง allowlist (ลบ `agents.defaults.models`), หรือ
- เลือกโมเดลจาก `/model list`

</Warning>

สำหรับโมเดล local/GGUF ให้จัดเก็บการอ้างอิงเต็มรูปแบบที่มีคำนำหน้าผู้ให้บริการไว้ใน allowlist
เช่น `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf`, หรือ
provider/model ที่ตรงกันซึ่งแสดงโดย `openclaw models list --provider <provider>`
ชื่อไฟล์ local แบบเปล่าหรือชื่อที่ใช้แสดงยังไม่เพียงพอเมื่อ allowlist
เปิดใช้งานอยู่

ตัวอย่างการกำหนดค่า allowlist:

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

คุณสามารถสลับโมเดลสำหรับเซสชันปัจจุบันได้โดยไม่ต้องรีสตาร์ท:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="พฤติกรรมตัวเลือก">
    - `/model` (และ `/model list`) เป็นตัวเลือกแบบกะทัดรัดที่มีหมายเลข (ตระกูลโมเดล + ผู้ให้บริการที่พร้อมใช้งาน)
    - บน Discord, `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบที่มีดรอปดาวน์ผู้ให้บริการและโมเดล พร้อมขั้นตอนส่ง
    - `/models add` ถูกเลิกใช้แล้ว และตอนนี้จะส่งคืนข้อความการเลิกใช้แทนการลงทะเบียนโมเดลจากแชต
    - `/model <#>` เลือกจากตัวเลือกนั้น

  </Accordion>
  <Accordion title="การคงอยู่และการสลับแบบสด">
    - `/model` จะคงค่าการเลือกเซสชันใหม่ทันที
    - หากเอเจนต์ว่างอยู่ การรันถัดไปจะใช้โมเดลใหม่ทันที
    - หากมีการรันที่กำลังใช้งานอยู่แล้ว OpenClaw จะทำเครื่องหมายการสลับแบบสดว่าอยู่ระหว่างรอ และจะรีสตาร์ทเข้าสู่โมเดลใหม่เฉพาะที่จุด retry ที่สะอาดเท่านั้น
    - หากกิจกรรมเครื่องมือหรือเอาต์พุตการตอบกลับเริ่มไปแล้ว การสลับที่รออยู่สามารถค้างคิวไว้จนกว่าจะมีโอกาส retry ภายหลังหรือรอบผู้ใช้ถัดไป
    - การอ้างอิง `/model` ที่ผู้ใช้เลือกมีความเข้มงวดสำหรับเซสชันนั้น: หากผู้ให้บริการ/โมเดลที่เลือกเข้าถึงไม่ได้ การตอบกลับจะล้มเหลวแบบมองเห็นได้ แทนที่จะตอบอย่างเงียบๆ จาก `agents.defaults.model.fallbacks` สิ่งนี้ต่างจากค่าเริ่มต้นที่กำหนดค่าไว้และโมเดลหลักของงาน cron ซึ่งยังสามารถใช้เชน fallback ได้
    - `/model status` คือมุมมองแบบละเอียด (ตัวเลือกการยืนยันตัวตน และเมื่อกำหนดค่าไว้ จะมี endpoint `baseUrl` ของผู้ให้บริการ + โหมด `api`)

  </Accordion>
  <Accordion title="การแยกวิเคราะห์การอ้างอิง">
    - การอ้างอิงโมเดลถูกแยกวิเคราะห์โดยแบ่งที่ `/` **ตัวแรก** ใช้ `provider/model` เมื่อพิมพ์ `/model <ref>`
    - หาก ID โมเดลเองมี `/` (แบบ OpenRouter) คุณต้องใส่คำนำหน้าผู้ให้บริการ (ตัวอย่าง: `/model openrouter/moonshotai/kimi-k2`)
    - หากคุณละผู้ให้บริการ OpenClaw จะ resolve อินพุตตามลำดับนี้:
      1. ตรงกับนามแฝง
      2. ตรงกับผู้ให้บริการที่กำหนดค่าไว้แบบไม่ซ้ำกันสำหรับ model id ที่ไม่มีคำนำหน้านั้นพอดี
      3. fallback ที่เลิกใช้แล้วไปยังผู้ให้บริการค่าเริ่มต้นที่กำหนดค่าไว้ — หากผู้ให้บริการนั้นไม่เปิดเผยโมเดลค่าเริ่มต้นที่กำหนดค่าไว้แล้ว OpenClaw จะ fallback ไปยังผู้ให้บริการ/โมเดลแรกที่กำหนดค่าไว้แทน เพื่อหลีกเลี่ยงการแสดงค่าเริ่มต้นของผู้ให้บริการที่ถูกลบและล้าสมัย
  </Accordion>
</AccordionGroup>

พฤติกรรมคำสั่ง/การกำหนดค่าแบบเต็ม: [คำสั่ง Slash](/th/tools/slash-commands)

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

แสดงโมเดลที่กำหนดค่าไว้/พร้อมใช้งานจากการยืนยันตัวตนตามค่าเริ่มต้น แฟล็กที่มีประโยชน์:

<ParamField path="--all" type="boolean">
  แค็ตตาล็อกเต็ม รวมถึงแถวแค็ตตาล็อกคงที่ในตัวที่ผู้ให้บริการเป็นเจ้าของ ก่อนที่จะกำหนดค่าการยืนยันตัวตน ดังนั้นมุมมองเพื่อการค้นพบเท่านั้นสามารถแสดงโมเดลที่ยังไม่พร้อมใช้งานจนกว่าคุณจะเพิ่มข้อมูลรับรองผู้ให้บริการที่ตรงกัน
</ParamField>
<ParamField path="--local" type="boolean">
  เฉพาะผู้ให้บริการ local
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

แสดงโมเดลหลักที่แก้ไขแล้ว โมเดลสำรอง โมเดลรูปภาพ และภาพรวมการตรวจสอบสิทธิ์ของผู้ให้บริการที่กำหนดค่าไว้ นอกจากนี้ยังแสดงสถานะการหมดอายุของ OAuth สำหรับโปรไฟล์ที่พบในที่เก็บการตรวจสอบสิทธิ์ด้วย (โดยค่าเริ่มต้นจะเตือนภายใน 24 ชั่วโมง) `--plain` จะแสดงเฉพาะโมเดลหลักที่แก้ไขแล้วเท่านั้น

<AccordionGroup>
  <Accordion title="ลักษณะการทำงานของการตรวจสอบสิทธิ์และการโพรบ">
    - สถานะ OAuth จะแสดงเสมอ (และรวมอยู่ในเอาต์พุต `--json`) หากผู้ให้บริการที่กำหนดค่าไว้ไม่มีข้อมูลรับรอง `models status` จะแสดงส่วน **ขาดการตรวจสอบสิทธิ์**
    - JSON มี `auth.oauth` (ช่วงเวลาการเตือน + โปรไฟล์) และ `auth.providers` (การตรวจสอบสิทธิ์ที่มีผลต่อผู้ให้บริการแต่ละราย รวมถึงข้อมูลรับรองที่อ้างอิงจาก env) `auth.oauth` เป็นเพียงสถานะสุขภาพของโปรไฟล์ในที่เก็บการตรวจสอบสิทธิ์เท่านั้น ผู้ให้บริการที่ใช้ env อย่างเดียวจะไม่ปรากฏที่นั่น
    - ใช้ `--check` สำหรับระบบอัตโนมัติ (ออกด้วย `1` เมื่อขาดหรือหมดอายุ, `2` เมื่อใกล้หมดอายุ)
    - ใช้ `--probe` สำหรับการตรวจสอบสิทธิ์แบบสด แถวโพรบอาจมาจากโปรไฟล์การตรวจสอบสิทธิ์ ข้อมูลรับรอง env หรือ `models.json`
    - หาก `auth.order.<provider>` ที่ระบุชัดเจนละเว้นโปรไฟล์ที่จัดเก็บไว้ โพรบจะรายงาน `excluded_by_auth_order` แทนที่จะลองใช้โปรไฟล์นั้น หากมีการตรวจสอบสิทธิ์แต่ไม่สามารถแก้ไขโมเดลที่โพรบได้สำหรับผู้ให้บริการนั้น โพรบจะรายงาน `status: no_model`

  </Accordion>
</AccordionGroup>

<Note>
การเลือกการตรวจสอบสิทธิ์ขึ้นอยู่กับผู้ให้บริการ/บัญชี สำหรับโฮสต์ Gateway ที่เปิดใช้งานตลอดเวลา โดยทั่วไปคีย์ API จะคาดการณ์ได้ดีที่สุด และยังรองรับการใช้ Claude CLI ซ้ำ รวมถึงโปรไฟล์ Anthropic OAuth/token ที่มีอยู่ด้วย
</Note>

ตัวอย่าง (Claude CLI):

```bash
claude auth login
openclaw models status
```

## การสแกน (โมเดลฟรีของ OpenRouter)

`openclaw models scan` ตรวจสอบ **แค็ตตาล็อกโมเดลฟรี** ของ OpenRouter และสามารถเลือกโพรบโมเดลเพื่อดูการรองรับเครื่องมือและรูปภาพได้

<ParamField path="--no-probe" type="boolean">
  ข้ามโพรบแบบสด (เฉพาะเมทาดาทา)
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
  ขนาดรายการสำรอง
</ParamField>
<ParamField path="--set-default" type="boolean">
  ตั้งค่า `agents.defaults.model.primary` เป็นตัวเลือกแรก
</ParamField>
<ParamField path="--set-image" type="boolean">
  ตั้งค่า `agents.defaults.imageModel.primary` เป็นตัวเลือกรูปภาพแรก
</ParamField>

<Note>
แค็ตตาล็อก `/models` ของ OpenRouter เป็นสาธารณะ ดังนั้นการสแกนเฉพาะเมทาดาทาสามารถแสดงผู้สมัครฟรีได้โดยไม่ต้องใช้คีย์ การโพรบและการอนุมานยังคงต้องใช้คีย์ OpenRouter API (จากโปรไฟล์การตรวจสอบสิทธิ์หรือ `OPENROUTER_API_KEY`) หากไม่มีคีย์ `openclaw models scan` จะถอยกลับไปใช้เอาต์พุตเฉพาะเมทาดาทาและปล่อยการกำหนดค่าไว้เหมือนเดิม ใช้ `--no-probe` เพื่อขอโหมดเฉพาะเมทาดาทาอย่างชัดเจน
</Note>

ผลการสแกนจะถูกจัดอันดับตาม:

1. การรองรับรูปภาพ
2. เวลาแฝงของเครื่องมือ
3. ขนาดบริบท
4. จำนวนพารามิเตอร์

อินพุต:

- รายการ `/models` ของ OpenRouter (ตัวกรอง `:free`)
- โพรบแบบสดต้องใช้คีย์ OpenRouter API จากโปรไฟล์การตรวจสอบสิทธิ์หรือ `OPENROUTER_API_KEY` (ดู [ตัวแปรสภาพแวดล้อม](/th/help/environment))
- ตัวกรองเพิ่มเติม: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- การควบคุมคำขอ/โพรบ: `--timeout`, `--concurrency`

เมื่อโพรบแบบสดทำงานใน TTY คุณสามารถเลือกโมเดลสำรองแบบโต้ตอบได้ ในโหมดไม่โต้ตอบ ให้ส่ง `--yes` เพื่อยอมรับค่าเริ่มต้น ผลลัพธ์เฉพาะเมทาดาทามีไว้เพื่อให้ข้อมูลเท่านั้น `--set-default` และ `--set-image` ต้องใช้โพรบแบบสดเพื่อให้ OpenClaw ไม่กำหนดค่าโมเดล OpenRouter ที่ใช้ไม่ได้เมื่อไม่มีคีย์

## รีจิสทรีโมเดล (`models.json`)

ผู้ให้บริการแบบกำหนดเองใน `models.providers` จะถูกเขียนลงใน `models.json` ภายใต้ไดเรกทอรีเอเจนต์ (ค่าเริ่มต้น `~/.openclaw/agents/<agentId>/agent/models.json`) ไฟล์นี้จะถูกผสานโดยค่าเริ่มต้น เว้นแต่ `models.mode` จะถูกตั้งค่าเป็น `replace`

<AccordionGroup>
  <Accordion title="ลำดับความสำคัญของโหมดผสาน">
    ลำดับความสำคัญของโหมดผสานสำหรับ ID ผู้ให้บริการที่ตรงกัน:

    - `baseUrl` ที่ไม่ว่างและมีอยู่แล้วใน `models.json` ของเอเจนต์จะชนะ
    - `apiKey` ที่ไม่ว่างใน `models.json` ของเอเจนต์จะชนะเฉพาะเมื่อผู้ให้บริการนั้นไม่ได้ถูกจัดการโดย SecretRef ในบริบท config/auth-profile ปัจจุบัน
    - ค่า `apiKey` ของผู้ให้บริการที่จัดการโดย SecretRef จะถูกรีเฟรชจากมาร์กเกอร์แหล่งที่มา (`ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs) แทนที่จะคงค่าความลับที่แก้ไขแล้วไว้
    - ค่า header ของผู้ให้บริการที่จัดการโดย SecretRef จะถูกรีเฟรชจากมาร์กเกอร์แหล่งที่มา (`secretref-env:ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs)
    - `apiKey`/`baseUrl` ของเอเจนต์ที่ว่างหรือขาดหายจะถอยกลับไปใช้ `models.providers` ใน config
    - ฟิลด์ผู้ให้บริการอื่นจะถูกรีเฟรชจาก config และข้อมูลแค็ตตาล็อกที่ปรับให้เป็นรูปแบบมาตรฐานแล้ว

  </Accordion>
</AccordionGroup>

<Note>
การคงอยู่ของมาร์กเกอร์ยึดแหล่งที่มาเป็นอำนาจสูงสุด: OpenClaw เขียนมาร์กเกอร์จากสแนปช็อต config แหล่งที่มาที่ใช้งานอยู่ (ก่อนการแก้ไขค่า) ไม่ใช่จากค่าความลับรันไทม์ที่แก้ไขแล้ว สิ่งนี้ใช้ทุกครั้งที่ OpenClaw สร้าง `models.json` ใหม่ รวมถึงเส้นทางที่ขับเคลื่อนด้วยคำสั่ง เช่น `openclaw agent`
</Note>

## ที่เกี่ยวข้อง

- [รันไทม์เอเจนต์](/th/concepts/agent-runtimes) — PI, Codex และรันไทม์ลูปเอเจนต์อื่นๆ
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) — คีย์ config ของโมเดล
- [การสร้างรูปภาพ](/th/tools/image-generation) — การกำหนดค่าโมเดลรูปภาพ
- [การสลับไปใช้โมเดลสำรอง](/th/concepts/model-failover) — ห่วงโซ่โมเดลสำรอง
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers) — การกำหนดเส้นทางผู้ให้บริการและการตรวจสอบสิทธิ์
- [การสร้างเพลง](/th/tools/music-generation) — การกำหนดค่าโมเดลเพลง
- [การสร้างวิดีโอ](/th/tools/video-generation) — การกำหนดค่าโมเดลวิดีโอ
