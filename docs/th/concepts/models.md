---
read_when:
    - การเพิ่มหรือแก้ไข CLI สำหรับโมเดล (models list/set/scan/aliases/fallbacks)
    - การเปลี่ยนพฤติกรรมการ fallback ของโมเดลหรือ UX การเลือก
    - กำลังอัปเดตโพรบสแกนโมเดล (เครื่องมือ/รูปภาพ)
sidebarTitle: Models CLI
summary: 'CLI สำหรับโมเดล: แสดงรายการ, ตั้งค่า, นามแฝง, กลไกสำรอง, สแกน, สถานะ'
title: CLI โมเดล
x-i18n:
    generated_at: "2026-06-27T17:28:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c7d4cbe1e0854a281f57f39dac9ac5f54c65f50da08cf37dfd298f8f1dd5536
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="การสลับโมเดลเมื่อขัดข้อง" href="/th/concepts/model-failover">
    การหมุนเวียนโปรไฟล์การยืนยันตัวตน ช่วงพัก และวิธีที่สิ่งนี้ทำงานร่วมกับ fallback
  </Card>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers">
    ภาพรวมผู้ให้บริการแบบรวดเร็วและตัวอย่าง
  </Card>
  <Card title="รันไทม์ของเอเจนต์" href="/th/concepts/agent-runtimes">
    OpenClaw, Codex และรันไทม์ลูปของเอเจนต์อื่นๆ
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/config-agents#agent-defaults">
    คีย์การกำหนดค่าโมเดล
  </Card>
</CardGroup>

การอ้างอิงโมเดลจะเลือกผู้ให้บริการและโมเดล โดยปกติจะไม่เลือก runtime เอเจนต์ระดับต่ำโดยตรง การอ้างอิงเอเจนต์ OpenAI เป็นข้อยกเว้นหลัก: `openai/gpt-5.5` จะทำงานผ่าน runtime app-server ของ Codex ตามค่าเริ่มต้นบนผู้ให้บริการ OpenAI อย่างเป็นทางการ การอ้างอิง Copilot แบบสมัครสมาชิก (`github-copilot/*`) ยังสามารถเลือกใช้ Plugin runtime เอเจนต์ GitHub Copilot ภายนอกได้ด้วย — เส้นทางนั้นยังคงต้องระบุอย่างชัดเจน (ไม่มี fallback แบบ `auto`) การ override runtime อย่างชัดเจนควรอยู่ในนโยบายผู้ให้บริการ/โมเดล ไม่ใช่ที่เอเจนต์หรือเซสชันทั้งหมด ในโหมด runtime ของ Codex การอ้างอิง `openai/gpt-*` ไม่ได้หมายถึงการคิดค่าบริการผ่าน API key; การยืนยันตัวตนอาจมาจากบัญชี Codex หรือโปรไฟล์ OAuth ของ `openai` ดู [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes) และ [runtime เอเจนต์ GitHub Copilot](/th/plugins/copilot)

## วิธีการเลือกโมเดลทำงาน

OpenClaw เลือกโมเดลตามลำดับนี้:

<Steps>
  <Step title="โมเดลหลัก">
    `agents.defaults.model.primary` (หรือ `agents.defaults.model`)
  </Step>
  <Step title="Fallback">
    `agents.defaults.model.fallbacks` (ตามลำดับ)
  </Step>
  <Step title="การสลับการยืนยันตัวตนของผู้ให้บริการเมื่อขัดข้อง">
    การสลับการยืนยันตัวตนเมื่อขัดข้องเกิดขึ้นภายในผู้ให้บริการก่อนจะย้ายไปยังโมเดลถัดไป
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="พื้นผิวโมเดลที่เกี่ยวข้อง">
    - `agents.defaults.models` คือ allowlist/แคตตาล็อกของโมเดลที่ OpenClaw สามารถใช้ได้ (รวมถึง alias) ใช้รายการ `provider/*` เพื่อจำกัดผู้ให้บริการที่มองเห็นได้ ขณะยังคงให้การค้นหาผู้ให้บริการเป็นแบบไดนามิก
    - `agents.defaults.imageModel` ใช้ **เฉพาะเมื่อ** โมเดลหลักรับภาพไม่ได้
    - `agents.defaults.pdfModel` ใช้โดยเครื่องมือ `pdf` หากละไว้ เครื่องมือจะ fallback ไปที่ `agents.defaults.imageModel` แล้วจึงไปที่โมเดลของเซสชัน/ค่าเริ่มต้นที่ resolve แล้ว
    - `agents.defaults.imageGenerationModel` ใช้โดยความสามารถสร้างภาพร่วมกัน หากละไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นลองผู้ให้บริการสร้างภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id หากคุณตั้งค่าผู้ให้บริการ/โมเดลแบบเฉพาะ ให้กำหนดค่าการยืนยันตัวตน/API key ของผู้ให้บริการนั้นด้วย
    - `agents.defaults.musicGenerationModel` ใช้โดยความสามารถสร้างเพลงร่วมกัน หากละไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นลองผู้ให้บริการสร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id หากคุณตั้งค่าผู้ให้บริการ/โมเดลแบบเฉพาะ ให้กำหนดค่าการยืนยันตัวตน/API key ของผู้ให้บริการนั้นด้วย
    - `agents.defaults.videoGenerationModel` ใช้โดยความสามารถสร้างวิดีโอร่วมกัน หากละไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นลองผู้ให้บริการสร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id หากคุณตั้งค่าผู้ให้บริการ/โมเดลแบบเฉพาะ ให้กำหนดค่าการยืนยันตัวตน/API key ของผู้ให้บริการนั้นด้วย
    - ค่าเริ่มต้นต่อเอเจนต์สามารถ override `agents.defaults.model` ผ่าน `agents.list[].model` พร้อม binding ได้ (ดู [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent))

  </Accordion>
</AccordionGroup>

## แหล่งที่มาของการเลือกและพฤติกรรม fallback

`provider/model` เดียวกันอาจหมายถึงคนละอย่าง ขึ้นอยู่กับว่ามาจากที่ใด:

- ค่าเริ่มต้นที่กำหนดค่าไว้ (`agents.defaults.model.primary` และโมเดลหลักเฉพาะเอเจนต์) เป็นจุดเริ่มต้นปกติและใช้ `agents.defaults.model.fallbacks`
- การเลือก fallback อัตโนมัติเป็นสถานะกู้คืนชั่วคราว ระบบจะจัดเก็บพร้อม `modelOverrideSource: "auto"` เพื่อให้ turn ถัดไปยังใช้ fallback chain ต่อได้โดยไม่ต้อง probe โมเดลหลักที่รู้ว่าใช้งานไม่ได้ทุกครั้ง; OpenClaw จะ probe โมเดลหลักเดิมอีกครั้งเป็นระยะ ล้างการเลือกอัตโนมัติเมื่อโมเดลกลับมาทำงาน และประกาศการเปลี่ยนผ่าน fallback/การกู้คืนหนึ่งครั้งต่อการเปลี่ยนสถานะ
- การเลือกของเซสชันผู้ใช้เป็นแบบแน่นอน `/model`, ตัวเลือกโมเดล, `session_status(model=...)` และ `sessions.patch` จะจัดเก็บ `modelOverrideSource: "user"`; หากผู้ให้บริการ/โมเดลที่เลือกนั้นเข้าถึงไม่ได้ OpenClaw จะแสดงความล้มเหลวให้เห็นชัดเจนแทนที่จะไหลต่อไปยังโมเดลอื่นที่กำหนดค่าไว้
- การเปลี่ยน `agents.defaults.model.primary` จะไม่เขียนทับการเลือกของเซสชันที่มีอยู่ หากสถานะแจ้งว่า `This session is pinned to X; config primary Y will apply to new/unpinned sessions.` ให้ล้างการเลือกของเซสชันปัจจุบันด้วย `/model default` เพื่อให้รับค่าจากโมเดลหลักที่กำหนดค่าไว้อีกครั้ง
- Cron `--model` / payload `model` คือโมเดลหลักต่อ job และยังคงใช้ fallback ที่กำหนดค่าไว้ เว้นแต่ job จะส่ง payload `fallbacks` อย่างชัดเจน (ใช้ `fallbacks: []` สำหรับการรัน cron แบบเข้มงวด)
- ตัวเลือก default-model และ allowlist ของ CLI เคารพ `models.mode: "replace"` โดยแสดงรายการ `models.providers.*.models` ที่ระบุไว้อย่างชัดเจนแทนการโหลดแคตตาล็อกในตัวทั้งหมด
- ตัวเลือกโมเดลของ Control UI จะถาม Gateway เพื่อรับมุมมองโมเดลที่กำหนดค่าไว้: ใช้ `agents.defaults.models` เมื่อมีอยู่ รวมถึงรายการ `provider/*` แบบครอบคลุมผู้ให้บริการ มิฉะนั้นใช้ `models.providers.*.models` ที่ระบุไว้อย่างชัดเจนพร้อมผู้ให้บริการที่มีการยืนยันตัวตนใช้งานได้ แคตตาล็อกในตัวทั้งหมดสงวนไว้สำหรับมุมมองการเรียกดูอย่างชัดเจน เช่น `models.list` พร้อม `view: "all"` หรือ `openclaw models list --all`

## นโยบายโมเดลแบบรวดเร็ว

- ตั้งค่าโมเดลหลักเป็นโมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดที่คุณมีสิทธิ์ใช้
- ใช้ fallback สำหรับงานที่อ่อนไหวต่อค่าใช้จ่าย/latency และแชตที่มีความเสี่ยงต่ำกว่า
- สำหรับเอเจนต์ที่เปิดใช้เครื่องมือหรืออินพุตที่ไม่น่าเชื่อถือ ให้หลีกเลี่ยงระดับโมเดลที่เก่ากว่า/อ่อนกว่า

## Onboarding (แนะนำ)

หากคุณไม่ต้องการแก้ config ด้วยตนเอง ให้รัน onboarding:

```bash
openclaw onboard
```

เครื่องมือนี้สามารถตั้งค่าโมเดล + การยืนยันตัวตนสำหรับผู้ให้บริการทั่วไป รวมถึง **OpenAI Code (Codex) subscription** (OAuth) และ **Anthropic** (API key หรือ Claude CLI)

## คีย์การกำหนดค่า (ภาพรวม)

- `agents.defaults.model.primary` และ `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` และ `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` และ `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` และ `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` และ `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + alias + พารามิเตอร์ผู้ให้บริการ + รายการผู้ให้บริการไดนามิก `provider/*`)
- `models.providers` (ผู้ให้บริการแบบกำหนดเองที่เขียนลงใน `models.json`)

<Note>
การอ้างอิงโมเดลจะถูก normalize เป็นตัวพิมพ์เล็ก ส่วน ID ผู้ให้บริการต้องตรงแบบ exact; ใช้
ID ผู้ให้บริการที่ Plugin ประกาศไว้

ตัวอย่างการกำหนดค่าผู้ให้บริการ (รวมถึง OpenCode) อยู่ใน [OpenCode](/th/providers/opencode)
</Note>

### การแก้ allowlist อย่างปลอดภัย

ใช้การเขียนแบบเพิ่มเมื่ออัปเดต `agents.defaults.models` ด้วยตนเอง:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="กฎการป้องกันการเขียนทับ">
    `openclaw config set` ปกป้อง map ของโมเดล/ผู้ให้บริการจากการเขียนทับโดยไม่ตั้งใจ การกำหนดค่า object แบบธรรมดาให้กับ `agents.defaults.models`, `models.providers` หรือ `models.providers.<id>.models` จะถูกปฏิเสธเมื่ออาจลบรายการที่มีอยู่ ใช้ `--merge` สำหรับการเปลี่ยนแปลงแบบเพิ่ม; ใช้ `--replace` เฉพาะเมื่อค่าที่ให้มาควรกลายเป็นค่าเป้าหมายทั้งหมด

    การตั้งค่าผู้ให้บริการแบบ interactive และ `openclaw configure --section model` จะ merge การเลือกที่อยู่ในขอบเขตผู้ให้บริการเข้ากับ allowlist ที่มีอยู่เช่นกัน ดังนั้นการเพิ่ม Codex, Ollama หรือผู้ให้บริการอื่นจะไม่ทิ้งรายการโมเดลที่ไม่เกี่ยวข้อง Configure จะรักษา `agents.defaults.model.primary` ที่มีอยู่เมื่อมีการใช้การยืนยันตัวตนของผู้ให้บริการอีกครั้ง คำสั่งตั้งค่า default อย่างชัดเจน เช่น `openclaw models auth login --provider <id> --set-default` และ `openclaw models set <model>` ยังคงแทนที่ `agents.defaults.model.primary`

  </Accordion>
</AccordionGroup>

## "ไม่อนุญาตให้ใช้โมเดล" (และเหตุผลที่คำตอบหยุด)

หากตั้งค่า `agents.defaults.models` ไว้ ค่านั้นจะกลายเป็น **allowlist** สำหรับ `/model` และสำหรับการ override เซสชัน เมื่อผู้ใช้เลือกโมเดลที่ไม่ได้อยู่ใน allowlist นั้น OpenClaw จะส่งคืน:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
เหตุการณ์นี้เกิดขึ้น **ก่อน** ที่จะสร้างคำตอบปกติ ดังนั้นข้อความอาจให้ความรู้สึกเหมือนว่า "ไม่ได้ตอบกลับ" วิธีแก้คือทำอย่างใดอย่างหนึ่ง:

- เพิ่มโมเดลใน `agents.defaults.models` หรือ
- ล้าง allowlist (ลบ `agents.defaults.models`) หรือ
- เลือกโมเดลจาก `/model list`

</Warning>

เมื่อคำสั่งที่ถูกปฏิเสธมี runtime override เช่น `/model openai/gpt-5.5 --runtime codex` ให้แก้ allowlist ก่อน แล้วลองคำสั่ง `/model ... --runtime ...` เดิมอีกครั้ง สำหรับการดำเนินการ Codex แบบ native โมเดลที่เลือกยังคงเป็น `openai/gpt-5.5`; runtime `codex` จะเลือก harness และใช้การยืนยันตัวตน Codex แยกต่างหาก

สำหรับโมเดล local/GGUF ให้จัดเก็บการอ้างอิงแบบมี provider prefix เต็มใน allowlist
เช่น `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` หรือ
provider/model ที่ตรงตามที่ `openclaw models list --provider <provider>` แสดง
ชื่อไฟล์ local แบบเปล่าๆ หรือชื่อแสดงผลไม่เพียงพอเมื่อ allowlist
เปิดใช้งานอยู่

หากคุณต้องการจำกัดผู้ให้บริการโดยไม่ต้องระบุทุกโมเดลด้วยตนเอง ให้เพิ่ม
รายการ `provider/*` ไปยัง `agents.defaults.models`:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

ด้วยนโยบายนี้ `/model`, `/models` และตัวเลือกโมเดลจะแสดงแคตตาล็อกที่ค้นพบ
สำหรับผู้ให้บริการเหล่านั้นเท่านั้น โมเดลใหม่จากผู้ให้บริการที่เลือกสามารถ
ปรากฏได้โดยไม่ต้องแก้ allowlist รายการ `provider/model` แบบ exact สามารถผสม
กับรายการ `provider/*` ได้เมื่อคุณต้องการโมเดลเฉพาะหนึ่งรายการจากผู้ให้บริการอื่น

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

คุณสามารถสลับโมเดลสำหรับเซสชันปัจจุบันได้โดยไม่ต้องรีสตาร์ต:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

<AccordionGroup>
  <Accordion title="พฤติกรรมของตัวเลือก">
    - `/model` (และ `/model list`) เป็นตัวเลือกแบบกระชับ มีหมายเลขกำกับ (ตระกูลโมเดล + ผู้ให้บริการที่มีอยู่)
    - บน Discord, `/model` และ `/models` จะเปิดตัวเลือกแบบ interactive พร้อม dropdown ผู้ให้บริการและโมเดล รวมถึงขั้นตอน Submit
    - บน Telegram การเลือกในตัวเลือก `/models` จะอยู่ในขอบเขตเซสชัน; การเลือกเหล่านี้จะไม่เปลี่ยนค่าเริ่มต้นถาวรของเอเจนต์ใน `openclaw.json`
    - `/models add` ถูกเลิกใช้แล้ว และตอนนี้จะส่งคืนข้อความเลิกใช้แทนการลงทะเบียนโมเดลจากแชต
    - `/model <#>` เลือกจากตัวเลือกนั้น

  </Accordion>
  <Accordion title="การคงอยู่และการสลับแบบสด">
    - `/model` จะคงการเลือกเซสชันใหม่ทันที
    - หาก agent ว่างอยู่ การรันครั้งถัดไปจะใช้โมเดลใหม่ทันที
    - หากมีการรันทำงานอยู่แล้ว OpenClaw จะทำเครื่องหมายการสลับแบบสดเป็นรายการที่รอดำเนินการ และจะรีสตาร์ตเข้าสู่โมเดลใหม่เฉพาะที่จุดลองใหม่ที่สะอาดเท่านั้น
    - หากกิจกรรมของเครื่องมือหรือเอาต์พุตคำตอบเริ่มไปแล้ว การสลับที่รอดำเนินการอาจยังคงอยู่ในคิวจนกว่าจะมีโอกาสลองใหม่ภายหลังหรือถึงเทิร์นถัดไปของผู้ใช้
    - `/model default` จะล้างการเลือกของเซสชันและคืนเซสชันไปยังโมเดลเริ่มต้นที่กำหนดค่าไว้
    - ref `/model` ที่ผู้ใช้เลือกจะเข้มงวดสำหรับเซสชันนั้น: หาก provider/model ที่เลือกเข้าถึงไม่ได้ คำตอบจะล้มเหลวให้เห็นอย่างชัดเจนแทนที่จะตอบแบบเงียบ ๆ จาก `agents.defaults.model.fallbacks` ซึ่งต่างจากค่าเริ่มต้นที่กำหนดค่าไว้และรายการหลักของงาน cron ที่ยังสามารถใช้เชน fallback ได้
    - `/model status` คือมุมมองแบบละเอียด (ตัวเลือก auth และเมื่อกำหนดค่าไว้ จะแสดง endpoint `baseUrl` ของ provider + โหมด `api`)

  </Accordion>
  <Accordion title="การแยกวิเคราะห์ ref">
    - ref ของโมเดลจะถูกแยกวิเคราะห์โดยแบ่งที่ `/` ตัว **แรก** ใช้ `provider/model` เมื่อพิมพ์ `/model <ref>`
    - หาก ID ของโมเดลมี `/` อยู่ในตัวเอง (สไตล์ OpenRouter) คุณต้องใส่ prefix ของ provider (ตัวอย่าง: `/model openrouter/moonshotai/kimi-k2`)
    - หากคุณละ provider ไว้ OpenClaw จะ resolve อินพุตตามลำดับนี้:
      1. ตรงกับ alias
      2. ตรงกับ provider ที่กำหนดค่าไว้แบบไม่ซ้ำสำหรับ model id แบบไม่มี prefix นั้นพอดี
      3. fallback ที่เลิกใช้แล้วไปยัง provider เริ่มต้นที่กำหนดค่าไว้ — หาก provider นั้นไม่ได้เปิดเผยโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะ fallback ไปยัง provider/model แรกที่กำหนดค่าไว้แทน เพื่อหลีกเลี่ยงการแสดงค่าเริ่มต้นของ provider ที่ถูกลบซึ่งล้าสมัย
  </Accordion>
</AccordionGroup>

พฤติกรรม/การกำหนดค่าคำสั่งฉบับเต็ม: [คำสั่ง Slash](/th/tools/slash-commands)

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

แสดงโมเดลที่กำหนดค่าไว้/พร้อมใช้งานด้วย auth โดยค่าเริ่มต้น แฟล็กที่มีประโยชน์:

<ParamField path="--all" type="boolean">
  แค็ตตาล็อกเต็ม รวมแถวแค็ตตาล็อกแบบสแตติกที่ provider แบบ bundled เป็นเจ้าของก่อนที่จะกำหนดค่า auth ดังนั้นมุมมองสำหรับการค้นพบเท่านั้นจึงสามารถแสดงโมเดลที่ยังไม่พร้อมใช้งานจนกว่าคุณจะเพิ่มข้อมูลรับรองของ provider ที่ตรงกัน
</ParamField>
<ParamField path="--local" type="boolean">
  เฉพาะ provider ภายในเครื่องเท่านั้น
</ParamField>
<ParamField path="--provider <id>" type="string">
  กรองตาม ID ของ provider เช่น `moonshot` ไม่ยอมรับป้ายกำกับที่แสดงจากตัวเลือกแบบโต้ตอบ
</ParamField>
<ParamField path="--plain" type="boolean">
  หนึ่งโมเดลต่อหนึ่งบรรทัด
</ParamField>
<ParamField path="--json" type="boolean">
  เอาต์พุตที่เครื่องอ่านได้
</ParamField>

### `models status`

แสดงโมเดลหลักที่ resolve แล้ว, fallback, โมเดลภาพ และภาพรวม auth ของ provider ที่กำหนดค่าไว้ นอกจากนี้ยังแสดงสถานะการหมดอายุของ OAuth สำหรับโปรไฟล์ที่พบในที่เก็บ auth (โดยค่าเริ่มต้นจะเตือนภายใน 24 ชั่วโมง) `--plain` จะพิมพ์เฉพาะโมเดลหลักที่ resolve แล้ว

<AccordionGroup>
  <Accordion title="พฤติกรรม auth และ probe">
    - สถานะ OAuth จะแสดงเสมอ (และรวมอยู่ในเอาต์พุต `--json`) หาก provider ที่กำหนดค่าไว้ไม่มีข้อมูลรับรอง `models status` จะพิมพ์ส่วน **Missing auth**
    - JSON มี `auth.oauth` (หน้าต่างเตือน + โปรไฟล์) และ `auth.providers` (auth ที่มีผลต่อ provider แต่ละราย รวมถึงข้อมูลรับรองที่อิง env) `auth.oauth` เป็นเฉพาะสุขภาพของโปรไฟล์ในที่เก็บ auth เท่านั้น; provider ที่มีเฉพาะ env จะไม่ปรากฏที่นั่น
    - ใช้ `--check` สำหรับ automation (ออกด้วย `1` เมื่อขาดหาย/หมดอายุ, `2` เมื่อใกล้หมดอายุ)
    - ใช้ `--probe` สำหรับการตรวจสอบ auth แบบสด; แถว probe อาจมาจากโปรไฟล์ auth, ข้อมูลรับรอง env หรือ `models.json`
    - หาก `auth.order.<provider>` ที่ระบุชัดเจนละโปรไฟล์ที่จัดเก็บไว้ probe จะรายงาน `excluded_by_auth_order` แทนที่จะลองใช้โปรไฟล์นั้น หากมี auth อยู่แต่ไม่สามารถ resolve โมเดลที่ probe ได้สำหรับ provider นั้น probe จะรายงาน `status: no_model`

  </Accordion>
</AccordionGroup>

<Note>
การเลือก auth ขึ้นอยู่กับ provider/account สำหรับโฮสต์ Gateway ที่เปิดตลอดเวลา API key มักคาดเดาได้มากที่สุด; ยังรองรับการใช้ Claude CLI ซ้ำและโปรไฟล์ Anthropic OAuth/token ที่มีอยู่ด้วย
</Note>

ตัวอย่าง (Claude CLI):

```bash
claude auth login
openclaw models status
```

## การสแกน (โมเดลฟรีของ OpenRouter)

`openclaw models scan` ตรวจสอบ **แค็ตตาล็อกโมเดลฟรี** ของ OpenRouter และสามารถ probe โมเดลสำหรับการรองรับเครื่องมือและภาพได้ตามต้องการ

<ParamField path="--no-probe" type="boolean">
  ข้าม probe แบบสด (เฉพาะ metadata)
</ParamField>
<ParamField path="--min-params <b>" type="number">
  ขนาดพารามิเตอร์ขั้นต่ำ (พันล้าน)
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  ข้ามโมเดลที่เก่ากว่า
</ParamField>
<ParamField path="--provider <name>" type="string">
  ตัวกรอง prefix ของ provider
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  ขนาดรายการ fallback
</ParamField>
<ParamField path="--set-default" type="boolean">
  ตั้งค่า `agents.defaults.model.primary` เป็นตัวเลือกแรก
</ParamField>
<ParamField path="--set-image" type="boolean">
  ตั้งค่า `agents.defaults.imageModel.primary` เป็นตัวเลือกภาพแรก
</ParamField>

<Note>
แค็ตตาล็อก `/models` ของ OpenRouter เป็นสาธารณะ ดังนั้นการสแกนเฉพาะ metadata จึงสามารถแสดงรายการตัวเลือกฟรีได้โดยไม่ต้องมี key การ probe และ inference ยังคงต้องใช้ API key ของ OpenRouter (จากโปรไฟล์ auth หรือ `OPENROUTER_API_KEY`) หากไม่มี key ให้ใช้ `openclaw models scan` จะ fallback ไปยังเอาต์พุตเฉพาะ metadata และปล่อยการกำหนดค่าไว้เหมือนเดิม ใช้ `--no-probe` เพื่อขอโหมดเฉพาะ metadata อย่างชัดเจน
</Note>

ผลลัพธ์การสแกนจัดอันดับตาม:

1. การรองรับภาพ
2. เวลาแฝงของเครื่องมือ
3. ขนาด context
4. จำนวนพารามิเตอร์

อินพุต:

- รายการ `/models` ของ OpenRouter (ตัวกรอง `:free`)
- probe แบบสดต้องใช้ API key ของ OpenRouter จากโปรไฟล์ auth หรือ `OPENROUTER_API_KEY` (ดู [ตัวแปรสภาพแวดล้อม](/th/help/environment))
- ตัวกรองเสริม: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- การควบคุม request/probe: `--timeout`, `--concurrency`

เมื่อ probe แบบสดทำงานใน TTY คุณสามารถเลือก fallback แบบโต้ตอบได้ ในโหมดไม่โต้ตอบ ให้ส่ง `--yes` เพื่อยอมรับค่าเริ่มต้น ผลลัพธ์เฉพาะ metadata มีไว้เพื่อให้ข้อมูล; `--set-default` และ `--set-image` ต้องใช้ probe แบบสด เพื่อให้ OpenClaw ไม่กำหนดค่าโมเดล OpenRouter ที่ไม่มี key และใช้งานไม่ได้

## รีจิสทรีโมเดล (`models.json`)

provider แบบกำหนดเองใน `models.providers` จะถูกเขียนลงใน `models.json` ใต้ไดเรกทอรี agent (ค่าเริ่มต้น `~/.openclaw/agents/<agentId>/agent/models.json`) แค็ตตาล็อกของ provider-plugin จะถูกจัดเก็บเป็น shard แค็ตตาล็อกที่สร้างขึ้นและเป็นของ Plugin ใต้สถานะ Plugin ของ agent และโหลดโดยอัตโนมัติ ไฟล์นี้จะถูก merge โดยค่าเริ่มต้น เว้นแต่ `models.mode` จะถูกตั้งค่าเป็น `replace`

<AccordionGroup>
  <Accordion title="ลำดับความสำคัญของโหมด merge">
    ลำดับความสำคัญของโหมด merge สำหรับ ID provider ที่ตรงกัน:

    - `baseUrl` ที่ไม่ว่างซึ่งมีอยู่แล้วใน `models.json` ของ agent จะชนะ
    - `apiKey` ที่ไม่ว่างใน `models.json` ของ agent จะชนะเฉพาะเมื่อ provider นั้นไม่ได้ถูกจัดการโดย SecretRef ใน context config/auth-profile ปัจจุบัน
    - ค่า `apiKey` ของ provider ที่จัดการโดย SecretRef จะถูกรีเฟรชจาก marker ต้นทาง (`ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs) แทนที่จะคง secret ที่ resolve แล้ว
    - ค่า header ของ provider ที่จัดการโดย SecretRef จะถูกรีเฟรชจาก marker ต้นทาง (`secretref-env:ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs)
    - `apiKey`/`baseUrl` ของ agent ที่ว่างหรือขาดหายจะ fallback ไปยัง config `models.providers`
    - ฟิลด์ provider อื่น ๆ จะถูกรีเฟรชจาก config และข้อมูลแค็ตตาล็อกที่ normalize แล้ว

  </Accordion>
</AccordionGroup>

<Note>
การคงอยู่ของ marker ยึดต้นทางเป็นแหล่งอ้างอิง: OpenClaw เขียน marker จาก snapshot config ต้นทางที่ใช้งานอยู่ (ก่อนการ resolve) ไม่ใช่จากค่า secret ของ runtime ที่ resolve แล้ว สิ่งนี้มีผลทุกครั้งที่ OpenClaw สร้าง `models.json` ใหม่ รวมถึงเส้นทางที่ขับเคลื่อนด้วยคำสั่ง เช่น `openclaw agent`
</Note>

## ที่เกี่ยวข้อง

- [runtime ของ agent](/th/concepts/agent-runtimes) — OpenClaw, Codex และ runtime ลูป agent อื่น ๆ
- [อ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) — key การกำหนดค่าโมเดล
- [การสร้างภาพ](/th/tools/image-generation) — การกำหนดค่าโมเดลภาพ
- [failover ของโมเดล](/th/concepts/model-failover) — เชน fallback
- [provider ของโมเดล](/th/concepts/model-providers) — การกำหนดเส้นทาง provider และ auth
- [การสร้างเพลง](/th/tools/music-generation) — การกำหนดค่าโมเดลเพลง
- [การสร้างวิดีโอ](/th/tools/video-generation) — การกำหนดค่าโมเดลวิดีโอ
