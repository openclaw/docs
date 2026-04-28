---
read_when:
    - การเพิ่มหรือแก้ไข CLI ของโมเดล (`models list`/`set`/`scan`/`aliases`/`fallbacks`)
    - การเปลี่ยนพฤติกรรม fallback ของโมเดลหรือ UX การเลือก model
    - การอัปเดตการ probe ของ model scan (tools/images)
sidebarTitle: Models CLI
summary: 'CLI ของโมเดล: list, set, aliases, fallbacks, scan, status'
title: CLI ของโมเดล
x-i18n:
    generated_at: "2026-04-26T11:28:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70dfb3f69532c6bfff5d8854ee7a5db3134e5ede3e1875410cea95072ca42a0
    source_path: concepts/models.md
    workflow: 15
---

<CardGroup cols={2}>
  <Card title="Model failover" href="/th/concepts/model-failover">
    การหมุนเวียน auth profile, ช่วงคูลดาวน์ และการโต้ตอบกับ fallbacks
  </Card>
  <Card title="Model providers" href="/th/concepts/model-providers">
    ภาพรวมผู้ให้บริการ model แบบย่อและตัวอย่าง
  </Card>
  <Card title="Agent runtimes" href="/th/concepts/agent-runtimes">
    runtime ของลูปเอเจนต์ เช่น PI, Codex และอื่นๆ
  </Card>
  <Card title="Configuration reference" href="/th/gateway/config-agents#agent-defaults">
    คีย์คอนฟิกของ model
  </Card>
</CardGroup>

model refs ใช้เลือกผู้ให้บริการและ model โดยปกติจะไม่ได้เลือกระดับ low-level agent runtime เช่น `openai/gpt-5.5` สามารถรันผ่านเส้นทางผู้ให้บริการ OpenAI ปกติ หรือผ่าน Codex app-server runtime ก็ได้ ขึ้นอยู่กับ `agents.defaults.agentRuntime.id` ดู [Agent runtimes](/th/concepts/agent-runtimes)

## การเลือก model ทำงานอย่างไร

OpenClaw เลือก models ตามลำดับนี้:

<Steps>
  <Step title="Primary model">
    `agents.defaults.model.primary` (หรือ `agents.defaults.model`)
  </Step>
  <Step title="Fallbacks">
    `agents.defaults.model.fallbacks` (ตามลำดับ)
  </Step>
  <Step title="Provider auth failover">
    auth failover จะเกิดขึ้นภายในผู้ให้บริการก่อนจะย้ายไปยัง model ถัดไป
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="พื้นผิว model ที่เกี่ยวข้อง">
    - `agents.defaults.models` คือ allowlist/catalog ของ models ที่ OpenClaw ใช้ได้ (รวม aliases)
    - `agents.defaults.imageModel` จะใช้ **เฉพาะเมื่อ** primary model ไม่รองรับรูปภาพ
    - `agents.defaults.pdfModel` ใช้โดย tool `pdf` หากไม่กำหนด tool จะ fallback ไปที่ `agents.defaults.imageModel` จากนั้นจึงไปที่ session/default model ที่ resolve แล้ว
    - `agents.defaults.imageGenerationModel` ใช้โดยความสามารถสร้างภาพแบบใช้ร่วมกัน หากไม่กำหนด `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มี auth รองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id หากคุณกำหนด provider/model แบบเฉพาะ ให้กำหนด auth/API key ของผู้ให้บริการนั้นด้วย
    - `agents.defaults.musicGenerationModel` ใช้โดยความสามารถสร้างเพลงแบบใช้ร่วมกัน หากไม่กำหนด `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มี auth รองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id หากคุณกำหนด provider/model แบบเฉพาะ ให้กำหนด auth/API key ของผู้ให้บริการนั้นด้วย
    - `agents.defaults.videoGenerationModel` ใช้โดยความสามารถสร้างวิดีโอแบบใช้ร่วมกัน หากไม่กำหนด `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มี auth รองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id หากคุณกำหนด provider/model แบบเฉพาะ ให้กำหนด auth/API key ของผู้ให้บริการนั้นด้วย
    - ค่าเริ่มต้นต่อเอเจนต์สามารถ override `agents.defaults.model` ได้ผ่าน `agents.list[].model` ร่วมกับ bindings (ดู [Multi-agent routing](/th/concepts/multi-agent))

  </Accordion>
</AccordionGroup>

## นโยบาย model แบบย่อ

- ตั้ง primary ของคุณเป็น model รุ่นใหม่ล่าสุดที่แข็งแกร่งที่สุดที่คุณเข้าถึงได้
- ใช้ fallbacks สำหรับงานที่ไวต่อค่าใช้จ่าย/latency และแชตที่ความเสี่ยงต่ำกว่า
- สำหรับเอเจนต์ที่เปิดใช้ tools หรือมีอินพุตที่ไม่น่าเชื่อถือ ให้หลีกเลี่ยง model tiers ที่เก่ากว่า/อ่อนแอกว่า

## Onboarding (แนะนำ)

หากคุณไม่ต้องการแก้ไขคอนฟิกด้วยมือ ให้รัน onboarding:

```bash
openclaw onboard
```

ระบบสามารถตั้งค่า model + auth สำหรับผู้ให้บริการทั่วไป รวมถึง **OpenAI Code (Codex) subscription** (OAuth) และ **Anthropic** (API key หรือ Claude CLI)

## คีย์คอนฟิก (ภาพรวม)

- `agents.defaults.model.primary` และ `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` และ `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` และ `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` และ `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` และ `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + aliases + provider params)
- `models.providers` (ผู้ให้บริการแบบกำหนดเองที่เขียนลงใน `models.json`)

<Note>
model refs จะถูก normalize เป็นตัวพิมพ์เล็ก provider aliases เช่น `z.ai/*` จะถูก normalize เป็น `zai/*`

ตัวอย่างการกำหนดค่าผู้ให้บริการ (รวมถึง OpenCode) อยู่ใน [OpenCode](/th/providers/opencode)
</Note>

### การแก้ไข allowlist อย่างปลอดภัย

ใช้การเขียนแบบ additive เมื่ออัปเดต `agents.defaults.models` ด้วยมือ:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="กฎการป้องกันการเขียนทับ">
    `openclaw config set` ปกป้อง maps ของ model/provider จากการเขียนทับโดยไม่ตั้งใจ การกำหนด plain object ให้กับ `agents.defaults.models`, `models.providers` หรือ `models.providers.<id>.models` จะถูกปฏิเสธหากทำให้รายการเดิมหายไป ใช้ `--merge` สำหรับการเปลี่ยนแปลงแบบ additive; ใช้ `--replace` เฉพาะเมื่อค่าที่ระบุควรกลายเป็นค่าทั้งหมดของเป้าหมาย

    การตั้งค่าผู้ให้บริการแบบโต้ตอบและ `openclaw configure --section model` ก็จะ merge การเลือกที่อยู่ในขอบเขตของผู้ให้บริการเข้าไปใน allowlist เดิมเช่นกัน ดังนั้นการเพิ่ม Codex, Ollama หรือผู้ให้บริการอื่นจะไม่ทำให้รายการ model ที่ไม่เกี่ยวข้องหายไป Configure จะคง `agents.defaults.model.primary` ที่มีอยู่ไว้เมื่อมีการใช้ auth ของผู้ให้บริการซ้ำอีกครั้ง ส่วนคำสั่งตั้งค่าเริ่มต้นแบบ explicit เช่น `openclaw models auth login --provider <id> --set-default` และ `openclaw models set <model>` ยังคงแทนที่ `agents.defaults.model.primary`

  </Accordion>
</AccordionGroup>

## "Model is not allowed" (และเหตุใดคำตอบจึงหยุด)

หากมีการตั้งค่า `agents.defaults.models` ค่านั้นจะกลายเป็น **allowlist** สำหรับ `/model` และสำหรับ session overrides เมื่อผู้ใช้เลือก model ที่ไม่ได้อยู่ใน allowlist นั้น OpenClaw จะตอบกลับว่า:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
สิ่งนี้จะเกิดขึ้น **ก่อน** มีการสร้างคำตอบปกติ ดังนั้นจึงอาจให้ความรู้สึกเหมือน "ไม่ตอบ" วิธีแก้คือ:

- เพิ่ม model นั้นเข้าไปใน `agents.defaults.models` หรือ
- ล้าง allowlist (เอา `agents.defaults.models` ออก) หรือ
- เลือก model จาก `/model list`

</Warning>

ตัวอย่างคอนฟิก allowlist:

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

## การสลับ models ในแชต (`/model`)

คุณสามารถสลับ models สำหรับเซสชันปัจจุบันได้โดยไม่ต้องรีสตาร์ต:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="พฤติกรรมของตัวเลือก">
    - `/model` (และ `/model list`) เป็นตัวเลือกแบบกะทัดรัดที่มีหมายเลขกำกับ (ตระกูล model + ผู้ให้บริการที่พร้อมใช้งาน)
    - บน Discord, `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบที่มี dropdown สำหรับผู้ให้บริการและ model พร้อมขั้นตอน Submit
    - `/models add` เลิกใช้แล้ว และตอนนี้จะส่งกลับข้อความเลิกใช้แทนการลงทะเบียน models จากแชต
    - `/model <#>` ใช้เลือกจากตัวเลือกนั้น

  </Accordion>
  <Accordion title="การคงค่าและการสลับแบบสด">
    - `/model` จะบันทึกการเลือกเซสชันใหม่ทันที
    - หากเอเจนต์กำลังว่าง การรันครั้งถัดไปจะใช้ model ใหม่ทันที
    - หากมีการรันที่กำลังทำงานอยู่แล้ว OpenClaw จะทำเครื่องหมายการสลับแบบสดว่าเป็น pending และจะรีสตาร์ตไปยัง model ใหม่เฉพาะที่จุด retry ที่สะอาดเท่านั้น
    - หากกิจกรรมของ tool หรือการส่งออกคำตอบเริ่มขึ้นแล้ว การสลับที่ pending อาจค้างอยู่จนกว่าจะมีโอกาส retry ภายหลังหรือถึง user turn ถัดไป
    - `/model status` คือมุมมองแบบละเอียด (auth candidates และเมื่อกำหนดค่าไว้แล้ว รวมถึง provider endpoint `baseUrl` + โหมด `api`)

  </Accordion>
  <Accordion title="การ parse ref">
    - model refs จะถูก parse โดยแยกที่ `/` **ตัวแรก** ใช้ `provider/model` เมื่อพิมพ์ `/model <ref>`
    - หาก model ID เองมี `/` อยู่ด้วย (สไตล์ OpenRouter) คุณต้องใส่ provider prefix ด้วย (ตัวอย่าง: `/model openrouter/moonshotai/kimi-k2`)
    - หากคุณละ provider ออก OpenClaw จะ resolve อินพุตตามลำดับนี้:
      1. ตรงกับ alias
      2. ตรงกับ configured-provider แบบไม่กำกวมสำหรับ model id แบบไม่มี prefix นั้น
      3. fallback แบบ deprecated ไปยังผู้ให้บริการค่าเริ่มต้นที่กำหนดไว้ — หากผู้ให้บริการนั้นไม่เปิดเผย model ค่าเริ่มต้นที่กำหนดไว้อีกต่อไป OpenClaw จะ fallback ไปยัง provider/model รายการแรกที่กำหนดไว้แทน เพื่อหลีกเลี่ยงการแสดงค่าเริ่มต้นของผู้ให้บริการที่ล้าสมัยและถูกถอดออกแล้ว
  </Accordion>
</AccordionGroup>

พฤติกรรม/คอนฟิกของคำสั่งแบบเต็ม: [Slash commands](/th/tools/slash-commands)

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

`openclaw models` (ไม่มี subcommand) เป็นทางลัดของ `models status`

### `models list`

จะแสดง models ที่กำหนดค่าไว้เป็นค่าเริ่มต้น flags ที่มีประโยชน์:

<ParamField path="--all" type="boolean">
  catalog แบบเต็ม รวมแถว catalog คงที่แบบ bundled ที่ผู้ให้บริการเป็นเจ้าของไว้ก่อนจะกำหนดค่า auth ดังนั้นมุมมองแบบ discovery-only จึงสามารถแสดง models ที่ยังใช้งานไม่ได้จนกว่าคุณจะเพิ่ม credentials ของผู้ให้บริการที่ตรงกัน
</ParamField>
<ParamField path="--local" type="boolean">
  เฉพาะผู้ให้บริการแบบ local
</ParamField>
<ParamField path="--provider <id>" type="string">
  กรองตาม provider id เช่น `moonshot` ไม่รองรับ display labels จาก interactive pickers
</ParamField>
<ParamField path="--plain" type="boolean">
  หนึ่ง model ต่อหนึ่งบรรทัด
</ParamField>
<ParamField path="--json" type="boolean">
  ผลลัพธ์แบบ machine-readable
</ParamField>

### `models status`

จะแสดง primary model ที่ resolve แล้ว, fallbacks, image model และภาพรวม auth ของผู้ให้บริการที่กำหนดค่าไว้ นอกจากนี้ยังแสดงสถานะหมดอายุของ OAuth สำหรับ profiles ที่พบใน auth store ด้วย (เตือนภายใน 24 ชั่วโมงเป็นค่าเริ่มต้น) `--plain` จะพิมพ์เฉพาะ primary model ที่ resolve แล้ว

<AccordionGroup>
  <Accordion title="พฤติกรรมของ auth และ probe">
    - สถานะ OAuth จะแสดงเสมอ (และรวมอยู่ในผลลัพธ์ `--json`) หากผู้ให้บริการที่กำหนดค่าไว้ไม่มี credentials, `models status` จะพิมพ์ส่วน **Missing auth**
    - JSON จะรวม `auth.oauth` (ช่วงการเตือน + profiles) และ `auth.providers` (auth ที่มีผลจริงต่อผู้ให้บริการ รวมถึง credentials ที่มาจาก env) โดย `auth.oauth` เป็นเพียงสุขภาพของ profiles ใน auth-store เท่านั้น; ผู้ให้บริการที่ใช้เฉพาะ env จะไม่ปรากฏที่นั่น
    - ใช้ `--check` สำหรับงานอัตโนมัติ (exit `1` เมื่อขาดหาย/หมดอายุ, `2` เมื่อใกล้หมดอายุ)
    - ใช้ `--probe` สำหรับการตรวจสอบ auth แบบสด; แถว probe อาจมาจาก auth profiles, env credentials หรือ `models.json`
    - หาก `auth.order.<provider>` แบบ explicit ไม่รวม stored profile, probe จะรายงาน `excluded_by_auth_order` แทนการลองใช้ หากมี auth อยู่แต่ไม่สามารถ resolve model ที่ probe ได้สำหรับผู้ให้บริการนั้น probe จะรายงาน `status: no_model`

  </Accordion>
</AccordionGroup>

<Note>
การเลือก auth ขึ้นอยู่กับผู้ให้บริการ/บัญชี สำหรับโฮสต์ gateway ที่เปิดตลอดเวลา API keys มักคาดเดาได้มากที่สุด; รองรับการ reuse Claude CLI และ profiles แบบ Anthropic OAuth/token ที่มีอยู่แล้วด้วย
</Note>

ตัวอย่าง (Claude CLI):

```bash
claude auth login
openclaw models status
```

## การสแกน (OpenRouter free models)

`openclaw models scan` จะตรวจสอบ **catalog ของ free models** ของ OpenRouter และสามารถเลือกที่จะ probe models เพื่อดูการรองรับ tools และรูปภาพได้

<ParamField path="--no-probe" type="boolean">
  ข้ามการ probe แบบสด (เฉพาะข้อมูลเมตา)
</ParamField>
<ParamField path="--min-params <b>" type="number">
  ขนาดพารามิเตอร์ขั้นต่ำ (พันล้าน)
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  ข้าม models ที่เก่ากว่า
</ParamField>
<ParamField path="--provider <name>" type="string">
  ตัวกรอง provider prefix
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  ขนาดของรายการ fallback
</ParamField>
<ParamField path="--set-default" type="boolean">
  ตั้งค่า `agents.defaults.model.primary` เป็นตัวเลือกแรก
</ParamField>
<ParamField path="--set-image" type="boolean">
  ตั้งค่า `agents.defaults.imageModel.primary` เป็นตัวเลือกภาพตัวแรก
</ParamField>

<Note>
catalog `/models` ของ OpenRouter เป็นสาธารณะ ดังนั้นการสแกนแบบเฉพาะข้อมูลเมตาจึงสามารถแสดงผู้สมัครฟรีได้โดยไม่ต้องใช้คีย์ การ probe และการอนุมานยังคงต้องใช้ OpenRouter API key (จาก auth profiles หรือ `OPENROUTER_API_KEY`) หากไม่มีคีย์ `openclaw models scan` จะ fallback ไปเป็นผลลัพธ์แบบเฉพาะข้อมูลเมตา และจะไม่เปลี่ยนคอนฟิก ใช้ `--no-probe` หากต้องการโหมดเฉพาะข้อมูลเมตาอย่างชัดเจน
</Note>

ผลการสแกนจะถูกจัดอันดับตาม:

1. การรองรับรูปภาพ
2. latency ของ tools
3. ขนาด context
4. จำนวนพารามิเตอร์

อินพุต:

- รายการ OpenRouter `/models` (ตัวกรอง `:free`)
- การ probe แบบสดต้องใช้ OpenRouter API key จาก auth profiles หรือ `OPENROUTER_API_KEY` (ดู [ตัวแปรสภาพแวดล้อม](/th/help/environment))
- ตัวกรองแบบเลือกได้: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- ตัวควบคุม request/probe: `--timeout`, `--concurrency`

เมื่อมีการรัน live probes ใน TTY คุณสามารถเลือก fallbacks แบบโต้ตอบได้ ในโหมดที่ไม่โต้ตอบ ให้ส่ง `--yes` เพื่อยอมรับค่าเริ่มต้น ผลลัพธ์แบบเฉพาะข้อมูลเมตาเป็นเพียงข้อมูลประกอบ; `--set-default` และ `--set-image` ต้องใช้ live probes เพื่อไม่ให้ OpenClaw กำหนดค่า OpenRouter model ที่ใช้ไม่ได้เพราะไม่มีคีย์

## รีจิสทรีของโมเดล (`models.json`)

ผู้ให้บริการแบบกำหนดเองใน `models.providers` จะถูกเขียนลงใน `models.json` ภายใต้ไดเรกทอรีของเอเจนต์ (ค่าเริ่มต้นคือ `~/.openclaw/agents/<agentId>/agent/models.json`) โดยไฟล์นี้จะถูก merge เป็นค่าเริ่มต้น เว้นแต่ `models.mode` จะถูกตั้งเป็น `replace`

<AccordionGroup>
  <Accordion title="ลำดับความสำคัญของโหมด merge">
    ลำดับความสำคัญของโหมด merge สำหรับ provider IDs ที่ตรงกัน:

    - `baseUrl` ที่ไม่ว่างและมีอยู่แล้วใน `models.json` ของเอเจนต์จะมีผลเหนือกว่า
    - `apiKey` ที่ไม่ว่างใน `models.json` ของเอเจนต์จะมีผลเหนือกว่าเฉพาะเมื่อผู้ให้บริการนั้นไม่ได้ถูกจัดการแบบ SecretRef ในบริบท config/auth-profile ปัจจุบัน
    - ค่า `apiKey` ของผู้ให้บริการที่จัดการแบบ SecretRef จะถูกรีเฟรชจาก source markers (`ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs) แทนการเก็บ secrets ที่ resolve แล้ว
    - ค่า header ของผู้ให้บริการที่จัดการแบบ SecretRef จะถูกรีเฟรชจาก source markers (`secretref-env:ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs)
    - `apiKey`/`baseUrl` ของเอเจนต์ที่ว่างหรือไม่มีอยู่ จะ fallback ไปที่ config `models.providers`
    - ฟิลด์อื่นของผู้ให้บริการจะถูกรีเฟรชจาก config และข้อมูล catalog ที่ normalize แล้ว

  </Accordion>
</AccordionGroup>

<Note>
การเก็บ markers ยึดตามแหล่งที่มาเป็นหลัก: OpenClaw เขียน markers จาก snapshot คอนฟิกของแหล่งที่มาที่กำลังใช้งานอยู่ (ก่อนการ resolve) ไม่ใช่จากค่า runtime secret ที่ resolve แล้ว สิ่งนี้มีผลทุกครั้งที่ OpenClaw สร้าง `models.json` ใหม่ รวมถึงเส้นทางที่ขับเคลื่อนด้วยคำสั่งอย่าง `openclaw agent`
</Note>

## ที่เกี่ยวข้อง

- [Agent runtimes](/th/concepts/agent-runtimes) — PI, Codex และ agent loop runtimes อื่นๆ
- [Configuration reference](/th/gateway/config-agents#agent-defaults) — คีย์คอนฟิกของ model
- [Image generation](/th/tools/image-generation) — การกำหนดค่า model สำหรับภาพ
- [Model failover](/th/concepts/model-failover) — สายโซ่ fallback
- [Model providers](/th/concepts/model-providers) — การกำหนดเส้นทางผู้ให้บริการและ auth
- [Music generation](/th/tools/music-generation) — การกำหนดค่า model สำหรับเพลง
- [Video generation](/th/tools/video-generation) — การกำหนดค่า model สำหรับวิดีโอ
