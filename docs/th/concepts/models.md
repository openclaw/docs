---
read_when:
    - การเพิ่มหรือแก้ไข CLI ของโมเดล (models list/set/scan/aliases/fallbacks)
    - การเปลี่ยนพฤติกรรมการใช้โมเดลสำรองหรือประสบการณ์ผู้ใช้ในการเลือก
    - การอัปเดตโพรบสแกนโมเดล (เครื่องมือ/รูปภาพ)
sidebarTitle: Models CLI
summary: 'CLI สำหรับโมเดล: แสดงรายการ, ตั้งค่า, นามแฝง, ตัวเลือกสำรอง, สแกน, สถานะ'
title: CLI สำหรับโมเดล
x-i18n:
    generated_at: "2026-05-02T10:14:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: d362c8cc41801b5e480560c8d34be53e1ada53a23c49af99adb7874e265ddb1f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="การสำรองการทำงานของโมเดล" href="/th/concepts/model-failover">
    การหมุนเวียนโปรไฟล์การยืนยันตัวตน ช่วงพัก และวิธีที่สิ่งเหล่านี้ทำงานร่วมกับตัวสำรอง
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

การอ้างอิงโมเดลจะเลือกผู้ให้บริการและโมเดล โดยปกติจะไม่เลือก agent runtime ระดับต่ำ ตัวอย่างเช่น `openai/gpt-5.5` สามารถทำงานผ่านเส้นทางผู้ให้บริการ OpenAI ตามปกติ หรือผ่านรันไทม์ app-server ของ Codex ได้ ขึ้นอยู่กับ `agents.defaults.agentRuntime.id` ในโหมดรันไทม์ Codex การอ้างอิง `openai/gpt-*` ไม่ได้หมายถึงการเรียกเก็บเงินด้วย API key การยืนยันตัวตนอาจมาจากบัญชี Codex หรือโปรไฟล์การยืนยันตัวตน `openai-codex` ดู [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes)

## การเลือกโมเดลทำงานอย่างไร

OpenClaw เลือกโมเดลตามลำดับนี้:

<Steps>
  <Step title="โมเดลหลัก">
    `agents.defaults.model.primary` (หรือ `agents.defaults.model`)
  </Step>
  <Step title="ตัวสำรอง">
    `agents.defaults.model.fallbacks` (ตามลำดับ)
  </Step>
  <Step title="การสำรองการยืนยันตัวตนของผู้ให้บริการ">
    การสำรองการยืนยันตัวตนเกิดขึ้นภายในผู้ให้บริการก่อนย้ายไปยังโมเดลถัดไป
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="พื้นผิวโมเดลที่เกี่ยวข้อง">
    - `agents.defaults.models` คือ allowlist/แค็ตตาล็อกของโมเดลที่ OpenClaw ใช้ได้ (รวมถึง alias)
    - `agents.defaults.imageModel` ใช้ **เฉพาะเมื่อ** โมเดลหลักรับรูปภาพไม่ได้
    - `agents.defaults.pdfModel` ใช้โดยเครื่องมือ `pdf` หากละไว้ เครื่องมือจะถอยกลับไปใช้ `agents.defaults.imageModel` จากนั้นจึงเป็นโมเดลที่ resolve ได้ของเซสชัน/ค่าเริ่มต้น
    - `agents.defaults.imageGenerationModel` ใช้โดยความสามารถสร้างรูปภาพร่วมกัน หากละไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนไว้ที่เหลือ ตามลำดับ provider-id หากคุณตั้งค่าผู้ให้บริการ/โมเดลเฉพาะ ให้กำหนดค่าการยืนยันตัวตน/API key ของผู้ให้บริการนั้นด้วย
    - `agents.defaults.musicGenerationModel` ใช้โดยความสามารถสร้างเพลงร่วมกัน หากละไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างเพลงที่ลงทะเบียนไว้ที่เหลือ ตามลำดับ provider-id หากคุณตั้งค่าผู้ให้บริการ/โมเดลเฉพาะ ให้กำหนดค่าการยืนยันตัวตน/API key ของผู้ให้บริการนั้นด้วย
    - `agents.defaults.videoGenerationModel` ใช้โดยความสามารถสร้างวิดีโอร่วมกัน หากละไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือ ตามลำดับ provider-id หากคุณตั้งค่าผู้ให้บริการ/โมเดลเฉพาะ ให้กำหนดค่าการยืนยันตัวตน/API key ของผู้ให้บริการนั้นด้วย
    - ค่าเริ่มต้นต่อเอเจนต์สามารถแทนที่ `agents.defaults.model` ผ่าน `agents.list[].model` พร้อม binding ได้ (ดู [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent))

  </Accordion>
</AccordionGroup>

## แหล่งที่มาของการเลือกและพฤติกรรมตัวสำรอง

`provider/model` เดียวกันอาจมีความหมายต่างกัน ขึ้นอยู่กับว่ามาจากที่ใด:

- ค่าเริ่มต้นที่กำหนดไว้ (`agents.defaults.model.primary` และโมเดลหลักเฉพาะเอเจนต์) เป็นจุดเริ่มต้นตามปกติและใช้ `agents.defaults.model.fallbacks`
- การเลือกตัวสำรองอัตโนมัติเป็นสถานะกู้คืนชั่วคราว โดยจัดเก็บพร้อม `modelOverrideSource: "auto"` เพื่อให้ turn ภายหลังใช้เชนตัวสำรองต่อได้โดยไม่ต้อง probe โมเดลหลักที่รู้ว่าเสียก่อน
- การเลือกของผู้ใช้ในเซสชันเป็นแบบเจาะจงพอดี `/model`, ตัวเลือกโมเดล, `session_status(model=...)` และ `sessions.patch` จัดเก็บ `modelOverrideSource: "user"` หาก provider/model ที่เลือกนั้นเข้าถึงไม่ได้ OpenClaw จะล้มเหลวให้เห็นชัดเจนแทนที่จะไหลต่อไปยังโมเดลที่กำหนดไว้อื่น
- Cron `--model` / payload `model` เป็นโมเดลหลักต่อ job โดยยังใช้ตัวสำรองที่กำหนดไว้ เว้นแต่งานจะส่ง payload `fallbacks` อย่างชัดเจน (ใช้ `fallbacks: []` สำหรับการรัน cron แบบเคร่งครัด)
- ตัวเลือก default-model และ allowlist ของ CLI เคารพ `models.mode: "replace"` โดยแสดง `models.providers.*.models` ที่ระบุไว้อย่างชัดเจน แทนที่จะโหลดแค็ตตาล็อกในตัวทั้งหมด
- ตัวเลือกโมเดลใน Control UI ขอ Gateway สำหรับมุมมองโมเดลที่กำหนดไว้: `agents.defaults.models` เมื่อมีอยู่ มิฉะนั้นจะใช้ `models.providers.*.models` ที่ระบุไว้อย่างชัดเจน รวมกับผู้ให้บริการที่มีการยืนยันตัวตนใช้งานได้ แค็ตตาล็อกในตัวทั้งหมดสงวนไว้สำหรับมุมมองเรียกดูอย่างชัดเจน เช่น `models.list` พร้อม `view: "all"` หรือ `openclaw models list --all`

## นโยบายโมเดลแบบย่อ

- ตั้งค่าโมเดลหลักของคุณเป็นโมเดลเจเนอเรชันล่าสุดที่แข็งแกร่งที่สุดที่คุณเข้าถึงได้
- ใช้ตัวสำรองสำหรับงานที่อ่อนไหวต่อค่าใช้จ่าย/เวลาแฝง และแชตที่มีความเสี่ยงต่ำกว่า
- สำหรับเอเจนต์ที่เปิดใช้เครื่องมือหรืออินพุตที่ไม่น่าเชื่อถือ ให้หลีกเลี่ยง tier โมเดลที่เก่ากว่า/อ่อนกว่า

## การเริ่มต้นใช้งาน (แนะนำ)

หากคุณไม่ต้องการแก้ไข config ด้วยมือ ให้รัน onboarding:

```bash
openclaw onboard
```

คำสั่งนี้สามารถตั้งค่าโมเดล + การยืนยันตัวตนสำหรับผู้ให้บริการทั่วไป รวมถึง **การสมัครใช้บริการ OpenAI Code (Codex)** (OAuth) และ **Anthropic** (API key หรือ Claude CLI)

## คีย์การกำหนดค่า (ภาพรวม)

- `agents.defaults.model.primary` และ `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` และ `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` และ `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` และ `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` และ `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + alias + พารามิเตอร์ผู้ให้บริการ)
- `models.providers` (ผู้ให้บริการแบบกำหนดเองที่เขียนลงใน `models.json`)

<Note>
การอ้างอิงโมเดลถูกทำให้เป็นตัวพิมพ์เล็ก Provider alias เช่น `z.ai/*` จะ normalize เป็น `zai/*`

ตัวอย่างการกำหนดค่าผู้ให้บริการ (รวมถึง OpenCode) อยู่ใน [OpenCode](/th/providers/opencode)
</Note>

### การแก้ไข allowlist อย่างปลอดภัย

ใช้การเขียนแบบเพิ่มเข้าไปเมื่ออัปเดต `agents.defaults.models` ด้วยมือ:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="กฎป้องกันการเขียนทับ">
    `openclaw config set` ปกป้อง map ของโมเดล/ผู้ให้บริการจากการเขียนทับโดยไม่ตั้งใจ การกำหนด object ธรรมดาให้ `agents.defaults.models`, `models.providers` หรือ `models.providers.<id>.models` จะถูกปฏิเสธเมื่อการกำหนดนั้นจะลบรายการที่มีอยู่ ใช้ `--merge` สำหรับการเปลี่ยนแปลงแบบเพิ่มเข้าไป ใช้ `--replace` เฉพาะเมื่อค่าที่ให้มาควรกลายเป็นค่าเป้าหมายทั้งหมด

    การตั้งค่าผู้ให้บริการแบบโต้ตอบและ `openclaw configure --section model` จะ merge การเลือกที่อยู่ใน scope ผู้ให้บริการเข้าไปใน allowlist ที่มีอยู่เช่นกัน ดังนั้นการเพิ่ม Codex, Ollama หรือผู้ให้บริการอื่นจะไม่ลบรายการโมเดลที่ไม่เกี่ยวข้อง Configure จะรักษา `agents.defaults.model.primary` ที่มีอยู่เมื่อมีการใช้การยืนยันตัวตนของผู้ให้บริการซ้ำ คำสั่งตั้งค่าเริ่มต้นอย่างชัดเจน เช่น `openclaw models auth login --provider <id> --set-default` และ `openclaw models set <model>` ยังคงแทนที่ `agents.defaults.model.primary`

  </Accordion>
</AccordionGroup>

## "ไม่อนุญาตให้ใช้โมเดล" (และเหตุผลที่การตอบกลับหยุด)

หากตั้งค่า `agents.defaults.models` ไว้ ค่านั้นจะกลายเป็น **allowlist** สำหรับ `/model` และสำหรับการ override เซสชัน เมื่อผู้ใช้เลือกโมเดลที่ไม่ได้อยู่ใน allowlist นั้น OpenClaw จะส่งคืน:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
สิ่งนี้เกิดขึ้น **ก่อน** ที่จะสร้างคำตอบตามปกติ ดังนั้นข้อความอาจทำให้รู้สึกเหมือนระบบ "ไม่ได้ตอบกลับ" วิธีแก้คือทำอย่างใดอย่างหนึ่ง:

- เพิ่มโมเดลลงใน `agents.defaults.models` หรือ
- ล้าง allowlist (ลบ `agents.defaults.models`) หรือ
- เลือกโมเดลจาก `/model list`

</Warning>

สำหรับโมเดล local/GGUF ให้เก็บการอ้างอิงแบบเต็มที่มี prefix ผู้ให้บริการไว้ใน allowlist
เช่น `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` หรือ
provider/model ที่ตรงกันซึ่งแสดงโดย `openclaw models list --provider <provider>`
ชื่อไฟล์ local แบบเปล่าๆ หรือชื่อที่แสดงยังไม่เพียงพอเมื่อ allowlist
ใช้งานอยู่

ตัวอย่าง config allowlist:

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
    - `/model` (และ `/model list`) เป็นตัวเลือกแบบกะทัดรัด มีหมายเลขกำกับ (ตระกูลโมเดล + ผู้ให้บริการที่พร้อมใช้งาน)
    - บน Discord, `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบที่มี dropdown ผู้ให้บริการและโมเดล พร้อมขั้นตอน Submit
    - บน Telegram การเลือกในตัวเลือก `/models` จะอยู่ในขอบเขตเซสชัน และไม่เปลี่ยนค่าเริ่มต้นถาวรของเอเจนต์ใน `openclaw.json`
    - `/models add` เลิกใช้แล้ว และตอนนี้จะส่งข้อความแจ้งการเลิกใช้แทนการลงทะเบียนโมเดลจากแชต
    - `/model <#>` เลือกจากตัวเลือกนั้น

  </Accordion>
  <Accordion title="การคงอยู่และการสลับสด">
    - `/model` บันทึกการเลือกเซสชันใหม่ทันที
    - หากเอเจนต์ว่างอยู่ การรันถัดไปจะใช้โมเดลใหม่ทันที
    - หากมีการรันที่กำลังทำงานอยู่ OpenClaw จะทำเครื่องหมายการสลับสดเป็น pending และจะรีสตาร์ทเข้าสู่โมเดลใหม่เฉพาะที่จุด retry ที่สะอาดเท่านั้น
    - หากกิจกรรมเครื่องมือหรือเอาต์พุตคำตอบเริ่มต้นแล้ว การสลับที่ pending อาจยังค้างคิวไว้จนกว่าจะมีโอกาส retry ภายหลัง หรือถึง turn ถัดไปของผู้ใช้
    - การอ้างอิง `/model` ที่ผู้ใช้เลือกจะเป็นแบบเคร่งครัดสำหรับเซสชันนั้น: หาก provider/model ที่เลือกเข้าถึงไม่ได้ คำตอบจะล้มเหลวให้เห็นชัดเจนแทนที่จะตอบแบบเงียบๆ จาก `agents.defaults.model.fallbacks` สิ่งนี้ต่างจากค่าเริ่มต้นที่กำหนดไว้และโมเดลหลักของ cron job ซึ่งยังสามารถใช้เชนตัวสำรองได้
    - `/model status` คือมุมมองแบบละเอียด (ตัวเลือกการยืนยันตัวตน และเมื่อกำหนดค่าไว้ endpoint ผู้ให้บริการ `baseUrl` + โหมด `api`)

  </Accordion>
  <Accordion title="การแยกวิเคราะห์ ref">
    - การอ้างอิงโมเดลถูกแยกวิเคราะห์โดยแบ่งที่ `/` ตัว **แรก** ใช้ `provider/model` เมื่อพิมพ์ `/model <ref>`
    - หาก ID โมเดลเองมี `/` (สไตล์ OpenRouter) คุณต้องใส่ prefix ผู้ให้บริการด้วย (ตัวอย่าง: `/model openrouter/moonshotai/kimi-k2`)
    - หากคุณละผู้ให้บริการ OpenClaw จะ resolve อินพุตตามลำดับนี้:
      1. ตรงกับ alias
      2. ตรงกับผู้ให้บริการที่กำหนดไว้แบบไม่ซ้ำสำหรับ model id ที่ไม่มี prefix นั้นพอดี
      3. ตัวสำรองที่เลิกใช้แล้วไปยังผู้ให้บริการค่าเริ่มต้นที่กำหนดไว้ — หากผู้ให้บริการนั้นไม่ได้เปิดเผยโมเดลค่าเริ่มต้นที่กำหนดไว้อีกต่อไป OpenClaw จะถอยกลับไปยัง provider/model ที่กำหนดไว้รายการแรกแทน เพื่อหลีกเลี่ยงการแสดงค่าเริ่มต้นของผู้ให้บริการที่ถูกลบไปแล้วซึ่งค้างอยู่
  </Accordion>
</AccordionGroup>

พฤติกรรมคำสั่ง/config แบบเต็ม: [คำสั่ง Slash](/th/tools/slash-commands)

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

`openclaw models` (ไม่มี subcommand) เป็นทางลัดสำหรับ `models status`

### `models list`

แสดงโมเดลที่กำหนดค่าไว้/พร้อมใช้งานผ่านการยืนยันตัวตนตามค่าเริ่มต้น แฟล็กที่มีประโยชน์:

<ParamField path="--all" type="boolean">
  แคตตาล็อกแบบเต็ม รวมแถวแคตตาล็อกแบบสแตติกที่มาพร้อมระบบและเป็นของผู้ให้บริการไว้ก่อนที่จะกำหนดค่าการยืนยันตัวตน เพื่อให้มุมมองสำหรับการค้นพบอย่างเดียวแสดงโมเดลที่ยังใช้งานไม่ได้จนกว่าคุณจะเพิ่มข้อมูลรับรองของผู้ให้บริการที่ตรงกัน
</ParamField>
<ParamField path="--local" type="boolean">
  เฉพาะผู้ให้บริการในเครื่องเท่านั้น
</ParamField>
<ParamField path="--provider <id>" type="string">
  กรองตาม id ของผู้ให้บริการ เช่น `moonshot` ไม่รองรับป้ายชื่อที่แสดงจากตัวเลือกแบบโต้ตอบ
</ParamField>
<ParamField path="--plain" type="boolean">
  หนึ่งโมเดลต่อบรรทัด
</ParamField>
<ParamField path="--json" type="boolean">
  เอาต์พุตที่เครื่องอ่านได้
</ParamField>

### `models status`

แสดงโมเดลหลักที่ถูก resolve แล้ว, fallback, โมเดลรูปภาพ และภาพรวมการยืนยันตัวตนของผู้ให้บริการที่กำหนดค่าไว้ นอกจากนี้ยังแสดงสถานะการหมดอายุของ OAuth สำหรับโปรไฟล์ที่พบใน auth store (ค่าเริ่มต้นคือเตือนภายใน 24 ชั่วโมง) `--plain` จะแสดงเฉพาะโมเดลหลักที่ถูก resolve แล้ว

<AccordionGroup>
  <Accordion title="พฤติกรรมการยืนยันตัวตนและการ probe">
    - สถานะ OAuth จะแสดงเสมอ (และรวมอยู่ในเอาต์พุต `--json`) หากผู้ให้บริการที่กำหนดค่าไว้ไม่มีข้อมูลรับรอง `models status` จะแสดงส่วน **การยืนยันตัวตนขาดหาย**
    - JSON รวม `auth.oauth` (ช่วงเวลาเตือน + โปรไฟล์) และ `auth.providers` (การยืนยันตัวตนที่มีผลจริงต่อผู้ให้บริการแต่ละราย รวมถึงข้อมูลรับรองที่อิง env) `auth.oauth` เป็นเฉพาะสถานะสุขภาพของโปรไฟล์ใน auth-store เท่านั้น ผู้ให้บริการแบบ env-only จะไม่ปรากฏในนั้น
    - ใช้ `--check` สำหรับงานอัตโนมัติ (ออกด้วย `1` เมื่อขาดหาย/หมดอายุ, `2` เมื่อใกล้หมดอายุ)
    - ใช้ `--probe` สำหรับการตรวจสอบการยืนยันตัวตนแบบสด แถว probe อาจมาจากโปรไฟล์การยืนยันตัวตน, ข้อมูลรับรอง env หรือ `models.json`
    - หาก `auth.order.<provider>` ที่ระบุอย่างชัดเจนละเว้นโปรไฟล์ที่จัดเก็บไว้ probe จะรายงาน `excluded_by_auth_order` แทนที่จะลองใช้โปรไฟล์นั้น หากมีการยืนยันตัวตนอยู่แต่ไม่สามารถ resolve โมเดลที่ probe ได้สำหรับผู้ให้บริการนั้น probe จะรายงาน `status: no_model`

  </Accordion>
</AccordionGroup>

<Note>
การเลือกการยืนยันตัวตนขึ้นอยู่กับผู้ให้บริการ/บัญชี สำหรับโฮสต์ Gateway ที่เปิดทำงานตลอดเวลา API key มักคาดเดาได้มากที่สุด นอกจากนี้ยังรองรับการใช้ Claude CLI ซ้ำและโปรไฟล์ Anthropic OAuth/token ที่มีอยู่ด้วย
</Note>

ตัวอย่าง (Claude CLI):

```bash
claude auth login
openclaw models status
```

## การสแกน (โมเดลฟรีของ OpenRouter)

`openclaw models scan` ตรวจสอบ **แคตตาล็อกโมเดลฟรี** ของ OpenRouter และเลือก probe โมเดลเพื่อตรวจสอบการรองรับเครื่องมือและรูปภาพได้

<ParamField path="--no-probe" type="boolean">
  ข้าม live probe (เฉพาะ metadata)
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
  ตั้งค่า `agents.defaults.model.primary` เป็นรายการแรกที่เลือก
</ParamField>
<ParamField path="--set-image" type="boolean">
  ตั้งค่า `agents.defaults.imageModel.primary` เป็นรายการรูปภาพแรกที่เลือก
</ParamField>

<Note>
แคตตาล็อก `/models` ของ OpenRouter เป็นสาธารณะ ดังนั้นการสแกนเฉพาะ metadata จึงแสดงรายชื่อตัวเลือกฟรีได้โดยไม่ต้องมี key การ probe และ inference ยังต้องใช้ OpenRouter API key (จากโปรไฟล์การยืนยันตัวตนหรือ `OPENROUTER_API_KEY`) หากไม่มี key ให้ใช้ `openclaw models scan` จะ fallback ไปยังเอาต์พุตเฉพาะ metadata และไม่เปลี่ยนการกำหนดค่า ใช้ `--no-probe` เพื่อขอโหมดเฉพาะ metadata อย่างชัดเจน
</Note>

ผลการสแกนจัดอันดับตาม:

1. การรองรับรูปภาพ
2. เวลาแฝงของเครื่องมือ
3. ขนาด context
4. จำนวนพารามิเตอร์

อินพุต:

- รายการ `/models` ของ OpenRouter (ตัวกรอง `:free`)
- live probe ต้องใช้ OpenRouter API key จากโปรไฟล์การยืนยันตัวตนหรือ `OPENROUTER_API_KEY` (ดู [ตัวแปรสภาพแวดล้อม](/th/help/environment))
- ตัวกรองเสริม: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- การควบคุม request/probe: `--timeout`, `--concurrency`

เมื่อ live probe ทำงานใน TTY คุณสามารถเลือก fallback แบบโต้ตอบได้ ในโหมดไม่โต้ตอบ ให้ส่ง `--yes` เพื่อยอมรับค่าเริ่มต้น ผลลัพธ์เฉพาะ metadata มีไว้เพื่อให้ข้อมูลเท่านั้น `--set-default` และ `--set-image` ต้องใช้ live probe เพื่อให้ OpenClaw ไม่กำหนดค่าโมเดล OpenRouter ที่ไม่มี key และใช้งานไม่ได้

## รีจิสทรีโมเดล (`models.json`)

ผู้ให้บริการแบบกำหนดเองใน `models.providers` จะถูกเขียนลงใน `models.json` ภายใต้ไดเรกทอรีของ agent (ค่าเริ่มต้นคือ `~/.openclaw/agents/<agentId>/agent/models.json`) ไฟล์นี้จะถูกผสานตามค่าเริ่มต้น เว้นแต่ว่า `models.mode` ถูกตั้งค่าเป็น `replace`

<AccordionGroup>
  <Accordion title="ลำดับความสำคัญของโหมดผสาน">
    ลำดับความสำคัญของโหมดผสานสำหรับ ID ผู้ให้บริการที่ตรงกัน:

    - `baseUrl` ที่ไม่ว่างและมีอยู่แล้วใน `models.json` ของ agent จะชนะ
    - `apiKey` ที่ไม่ว่างใน `models.json` ของ agent จะชนะเฉพาะเมื่อผู้ให้บริการนั้นไม่ได้จัดการโดย SecretRef ในบริบท config/auth-profile ปัจจุบัน
    - ค่า `apiKey` ของผู้ให้บริการที่จัดการโดย SecretRef จะถูกรีเฟรชจาก source markers (`ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs) แทนการคงค่าความลับที่ resolve แล้วไว้
    - ค่า header ของผู้ให้บริการที่จัดการโดย SecretRef จะถูกรีเฟรชจาก source markers (`secretref-env:ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs)
    - `apiKey`/`baseUrl` ของ agent ที่ว่างหรือไม่มีอยู่จะ fallback ไปยัง `models.providers` ในการกำหนดค่า
    - ฟิลด์ผู้ให้บริการอื่นๆ จะถูกรีเฟรชจากการกำหนดค่าและข้อมูลแคตตาล็อกที่ normalized แล้ว

  </Accordion>
</AccordionGroup>

<Note>
การคงอยู่ของ marker ยึด source เป็นแหล่งอ้างอิงหลัก: OpenClaw เขียน marker จาก snapshot การกำหนดค่า source ที่ใช้งานอยู่ (ก่อนการ resolve) ไม่ใช่จากค่าความลับ runtime ที่ resolve แล้ว สิ่งนี้มีผลทุกครั้งที่ OpenClaw สร้าง `models.json` ใหม่ รวมถึงเส้นทางที่ขับเคลื่อนด้วยคำสั่ง เช่น `openclaw agent`
</Note>

## ที่เกี่ยวข้อง

- [runtime ของ agent](/th/concepts/agent-runtimes) — PI, Codex และ runtime วงรอบ agent อื่นๆ
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) — key การกำหนดค่าโมเดล
- [การสร้างรูปภาพ](/th/tools/image-generation) — การกำหนดค่าโมเดลรูปภาพ
- [model failover](/th/concepts/model-failover) — เชน fallback
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers) — การกำหนดเส้นทางผู้ให้บริการและการยืนยันตัวตน
- [การสร้างเพลง](/th/tools/music-generation) — การกำหนดค่าโมเดลเพลง
- [การสร้างวิดีโอ](/th/tools/video-generation) — การกำหนดค่าโมเดลวิดีโอ
