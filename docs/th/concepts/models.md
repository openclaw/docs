---
read_when:
    - การเพิ่มหรือแก้ไข CLI ของโมเดล (models list/set/scan/aliases/fallbacks)
    - การเปลี่ยนพฤติกรรม fallback ของโมเดลหรือ UX การเลือกโมเดล
    - การอัปเดตการ probe ของ model scan (tools/images)
summary: 'CLI ของโมเดล: list, set, aliases, fallbacks, scan, status'
title: CLI ของโมเดล
x-i18n:
    generated_at: "2026-04-23T10:17:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46916d9600a4e4aebdb026aa42df39149d8b6d438a8a7e85a61053dfc8f76dcc
    source_path: concepts/models.md
    workflow: 15
---

# CLI ของโมเดล

ดู [/concepts/model-failover](/th/concepts/model-failover) สำหรับการหมุนเวียน
auth profile, cooldown และวิธีที่สิ่งเหล่านั้นทำงานร่วมกับ fallback
ภาพรวม provider แบบรวดเร็ว + ตัวอย่าง: [/concepts/model-providers](/th/concepts/model-providers)

## การเลือกโมเดลทำงานอย่างไร

OpenClaw เลือกโมเดลตามลำดับนี้:

1. โมเดล **Primary** (`agents.defaults.model.primary` หรือ `agents.defaults.model`)
2. **Fallbacks** ใน `agents.defaults.model.fallbacks` (ตามลำดับ)
3. **Provider auth failover** จะเกิดขึ้นภายใน provider ก่อนจะย้ายไปยัง
   โมเดลถัดไป

ที่เกี่ยวข้อง:

- `agents.defaults.models` คือ allowlist/catalog ของโมเดลที่ OpenClaw ใช้งานได้ (รวมทั้ง alias)
- `agents.defaults.imageModel` จะถูกใช้ **เฉพาะเมื่อ** โมเดล primary ไม่รองรับรูปภาพ
- `agents.defaults.pdfModel` ถูกใช้โดยเครื่องมือ `pdf` หากไม่ได้กำหนดไว้ เครื่องมือ
  จะ fallback ไปที่ `agents.defaults.imageModel` จากนั้นจึงเป็นโมเดล session/default
  ที่ resolve แล้ว
- `agents.defaults.imageGenerationModel` ถูกใช้โดยความสามารถสร้างภาพแบบใช้ร่วมกัน หากไม่ได้กำหนดไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มี auth รองรับได้ โดยจะลอง provider ค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง provider สำหรับการสร้างภาพที่ลงทะเบียนไว้อื่น ๆ ตามลำดับ provider-id หากคุณกำหนด provider/model แบบเฉพาะเจาะจง ให้กำหนด auth/API key ของ provider นั้นด้วย
- `agents.defaults.musicGenerationModel` ถูกใช้โดยความสามารถสร้างเพลงแบบใช้ร่วมกัน หากไม่ได้กำหนดไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มี auth รองรับได้ โดยจะลอง provider ค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง provider สำหรับการสร้างเพลงที่ลงทะเบียนไว้อื่น ๆ ตามลำดับ provider-id หากคุณกำหนด provider/model แบบเฉพาะเจาะจง ให้กำหนด auth/API key ของ provider นั้นด้วย
- `agents.defaults.videoGenerationModel` ถูกใช้โดยความสามารถสร้างวิดีโอแบบใช้ร่วมกัน หากไม่ได้กำหนดไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มี auth รองรับได้ โดยจะลอง provider ค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง provider สำหรับการสร้างวิดีโอที่ลงทะเบียนไว้อื่น ๆ ตามลำดับ provider-id หากคุณกำหนด provider/model แบบเฉพาะเจาะจง ให้กำหนด auth/API key ของ provider นั้นด้วย
- ค่าเริ่มต้นราย agent สามารถ override `agents.defaults.model` ได้ผ่าน `agents.list[].model` พร้อม bindings (ดู [/concepts/multi-agent](/th/concepts/multi-agent))

## นโยบายโมเดลแบบรวดเร็ว

- ตั้งค่า primary ของคุณเป็นโมเดลรุ่นล่าสุดที่มีความสามารถสูงที่สุดที่คุณใช้งานได้
- ใช้ fallback สำหรับงานที่ไวต่อค่าใช้จ่าย/latency และการแชตที่ความเสี่ยงต่ำกว่า
- สำหรับ agent ที่เปิดใช้เครื่องมือหรือมีอินพุตที่ไม่น่าเชื่อถือ ให้หลีกเลี่ยงโมเดลรุ่นเก่า/ชั้นที่อ่อนกว่า

## Onboarding (แนะนำ)

หากคุณไม่ต้องการแก้ไข config ด้วยตนเอง ให้รัน onboarding:

```bash
openclaw onboard
```

ระบบสามารถตั้งค่าโมเดล + auth สำหรับ provider ทั่วไปได้ รวมถึง **OpenAI Code (Codex)
subscription** (OAuth) และ **Anthropic** (API key หรือ Claude CLI)

## คีย์ config (ภาพรวม)

- `agents.defaults.model.primary` และ `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` และ `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` และ `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` และ `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` และ `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + alias + พารามิเตอร์ provider)
- `models.providers` (provider แบบกำหนดเองที่เขียนลงใน `models.json`)

model ref จะถูก normalize เป็นตัวพิมพ์เล็ก alias ของ provider เช่น `z.ai/*` จะถูก normalize
เป็น `zai/*`

ตัวอย่างการกำหนดค่า provider (รวมถึง OpenCode) อยู่ใน
[/providers/opencode](/th/providers/opencode)

### การแก้ไข allowlist อย่างปลอดภัย

ใช้การเขียนแบบเพิ่มรายการเมื่ออัปเดต `agents.defaults.models` ด้วยตนเอง:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` ป้องกัน model/provider map จากการถูกเขียนทับโดยไม่ได้ตั้งใจ การกำหนดค่า
plain object ให้กับ `agents.defaults.models`, `models.providers` หรือ
`models.providers.<id>.models` โดยตรงจะถูกปฏิเสธเมื่ออาจทำให้รายการเดิม
หายไป ใช้ `--merge` สำหรับการเปลี่ยนแปลงแบบเพิ่มรายการ; ใช้ `--replace` เฉพาะเมื่อ
ค่าที่ให้มาควรกลายเป็นค่าเป้าหมายทั้งหมด

การตั้งค่า provider แบบโต้ตอบและ `openclaw configure --section model` ก็จะ merge
ค่าที่เลือกในขอบเขต provider เข้ากับ allowlist ที่มีอยู่เช่นกัน ดังนั้นการเพิ่ม Codex,
Ollama หรือ provider อื่นจะไม่ทำให้รายการโมเดลที่ไม่เกี่ยวข้องหายไป

## "Model is not allowed" (และเหตุใดการตอบกลับจึงหยุด)

หากมีการตั้งค่า `agents.defaults.models` ไว้ มันจะกลายเป็น **allowlist** สำหรับ `/model` และสำหรับ
session override เมื่อผู้ใช้เลือกโมเดลที่ไม่อยู่ใน allowlist นั้น
OpenClaw จะส่งกลับ:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

สิ่งนี้เกิดขึ้น **ก่อน** ที่จะสร้างการตอบกลับตามปกติ ดังนั้นข้อความอาจให้ความรู้สึกเหมือน
“ไม่ได้ตอบกลับ” วิธีแก้คือ:

- เพิ่มโมเดลเข้าไปใน `agents.defaults.models`, หรือ
- ล้าง allowlist (ลบ `agents.defaults.models`), หรือ
- เลือกโมเดลจาก `/model list`

ตัวอย่าง config ของ allowlist:

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

หมายเหตุ:

- `/model` (และ `/model list`) เป็นตัวเลือกแบบกระชับที่มีหมายเลขกำกับ (ตระกูลโมเดล + provider ที่พร้อมใช้งาน)
- บน Discord, `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบพร้อม dropdown ของ provider และโมเดล รวมถึงขั้นตอน Submit
- `/models add` เปิดใช้งานโดยค่าเริ่มต้น และสามารถปิดได้ด้วย `commands.modelsWrite=false`
- เมื่อเปิดใช้งาน `/models add <provider> <modelId>` คือเส้นทางที่เร็วที่สุด; การใช้ `/models add` แบบไม่มีอาร์กิวเมนต์จะเริ่ม flow แบบมีคำแนะนำที่เลือก provider ก่อนในระบบที่รองรับ
- หลังจากใช้ `/models add` โมเดลใหม่จะพร้อมใช้งานใน `/models` และ `/model` โดยไม่ต้องรีสตาร์ต gateway
- `/model <#>` ใช้เลือกจากตัวเลือกนั้น
- `/model` จะบันทึกการเลือกเซสชันใหม่ทันที
- หาก agent ว่างอยู่ การรันครั้งถัดไปจะใช้โมเดลใหม่ทันที
- หากมีการรันที่กำลังทำงานอยู่ OpenClaw จะทำเครื่องหมายการสลับสดไว้เป็น pending และจะรีสตาร์ตไปใช้โมเดลใหม่เฉพาะเมื่อถึงจุด retry ที่สะอาด
- หากกิจกรรมของเครื่องมือหรือเอาต์พุตการตอบกลับเริ่มขึ้นแล้ว การสลับที่ pending อาจยังคงอยู่ในคิวจนกว่าจะมีโอกาส retry ในภายหลังหรือถึงเทิร์นถัดไปของผู้ใช้
- `/model status` คือมุมมองแบบละเอียด (auth candidate และเมื่อมีการกำหนดค่าไว้ จะรวม `baseUrl` + โหมด `api` ของปลายทาง provider)
- model ref จะถูกแยกโดยแบ่งที่ `/` **ตัวแรก** ใช้รูปแบบ `provider/model` เมื่อพิมพ์ `/model <ref>`
- หาก model ID เองมี `/` อยู่ด้วย (แบบ OpenRouter) คุณต้องใส่คำนำหน้า provider ด้วย (ตัวอย่าง: `/model openrouter/moonshotai/kimi-k2`)
- หากคุณละ provider ไว้ OpenClaw จะ resolve อินพุตตามลำดับนี้:
  1. ตรงกับ alias
  2. ตรงกับ configured-provider แบบไม่ซ้ำสำหรับ model id แบบไม่ใส่คำนำหน้าเดียวกัน
  3. fallback แบบเดิมไปยัง provider ค่าเริ่มต้นที่กำหนดไว้
     หาก provider นั้นไม่เปิดให้ใช้โมเดลค่าเริ่มต้นที่กำหนดไว้อีกต่อไป OpenClaw
     จะ fallback ไปยัง provider/model รายการแรกที่กำหนดไว้แทน เพื่อหลีกเลี่ยง
     การแสดงค่าเริ่มต้นของ provider ที่ถูกลบไปแล้วและล้าสมัย

พฤติกรรม/การกำหนดค่าของคำสั่งแบบเต็ม: [Slash commands](/th/tools/slash-commands)

ตัวอย่าง:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

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

จะแสดงโมเดลที่กำหนดค่าไว้โดยค่าเริ่มต้น แฟลกที่มีประโยชน์:

- `--all`: catalog ทั้งหมด
- `--local`: เฉพาะ provider ในเครื่อง
- `--provider <id>`: กรองตาม provider id เช่น `moonshot`; ไม่รองรับ display
  label จากตัวเลือกแบบโต้ตอบ
- `--plain`: หนึ่งโมเดลต่อหนึ่งบรรทัด
- `--json`: เอาต์พุตที่เครื่องอ่านได้

`--all` จะรวมแถว catalog แบบคงที่ที่เป็นของ provider และมาพร้อมระบบก่อนที่จะมีการกำหนด auth
ดังนั้นมุมมองที่ใช้เพื่อการค้นหาอย่างเดียวจึงสามารถแสดงโมเดลที่ยังไม่พร้อมใช้งานได้จนกว่าคุณจะเพิ่มข้อมูลรับรองของ provider ที่ตรงกัน

### `models status`

แสดงโมเดล primary ที่ resolve แล้ว, fallback, image model และภาพรวม auth
ของ provider ที่กำหนดค่าไว้ นอกจากนี้ยังแสดงสถานะการหมดอายุของ OAuth สำหรับ profile ที่พบ
ใน auth store (เตือนภายใน 24 ชม. โดยค่าเริ่มต้น) `--plain` จะพิมพ์เฉพาะ
โมเดล primary ที่ resolve แล้ว
สถานะ OAuth จะแสดงเสมอ (และรวมอยู่ในเอาต์พุต `--json`) หาก provider
ที่กำหนดค่าไว้ไม่มีข้อมูลรับรอง `models status` จะแสดงส่วน **Missing auth**
JSON จะรวม `auth.oauth` (หน้าต่างการเตือน + profile) และ `auth.providers`
(auth ที่มีผลจริงต่อ provider รวมถึงข้อมูลรับรองจาก env) `auth.oauth`
เป็นเพียงสถานะสุขภาพของ profile ใน auth-store เท่านั้น; provider ที่ใช้ env-only จะไม่ปรากฏในส่วนนั้น
ใช้ `--check` สำหรับระบบอัตโนมัติ (ออกด้วยรหัส `1` เมื่อไม่มี/หมดอายุ, `2` เมื่อกำลังจะหมดอายุ)
ใช้ `--probe` สำหรับการตรวจสอบ auth แบบสด; แถวของ probe อาจมาจาก auth profile, ข้อมูลรับรองใน env
หรือ `models.json`
หาก `auth.order.<provider>` ที่กำหนดไว้อย่างชัดเจนละ profile ที่จัดเก็บไว้บางรายการออกไป probe จะรายงาน
`excluded_by_auth_order` แทนที่จะลองใช้งาน หากมี auth แต่ไม่สามารถ resolve โมเดลที่ probe ได้
สำหรับ provider นั้น probe จะรายงาน `status: no_model`

การเลือก auth ขึ้นอยู่กับ provider/บัญชี สำหรับโฮสต์ gateway ที่ทำงานตลอดเวลา API
key มักคาดการณ์ได้ง่ายที่สุด; ยังรองรับการใช้ Claude CLI ซ้ำและ profile OAuth/token ของ Anthropic ที่มีอยู่เดิมด้วย

ตัวอย่าง (Claude CLI):

```bash
claude auth login
openclaw models status
```

## การสแกน (โมเดลฟรีของ OpenRouter)

`openclaw models scan` จะตรวจสอบ **catalog โมเดลฟรี** ของ OpenRouter และสามารถ
probe โมเดลเพิ่มเติมได้เพื่อทดสอบการรองรับเครื่องมือและรูปภาพ

แฟลกสำคัญ:

- `--no-probe`: ข้ามการ probe แบบสด (เฉพาะ metadata)
- `--min-params <b>`: ขนาดพารามิเตอร์ขั้นต่ำ (พันล้าน)
- `--max-age-days <days>`: ข้ามโมเดลที่เก่ากว่า
- `--provider <name>`: ตัวกรองคำนำหน้า provider
- `--max-candidates <n>`: ขนาดรายการ fallback
- `--set-default`: ตั้งค่า `agents.defaults.model.primary` เป็นตัวเลือกแรก
- `--set-image`: ตั้งค่า `agents.defaults.imageModel.primary` เป็นตัวเลือกภาพตัวแรก

การ probe ต้องใช้ OpenRouter API key (จาก auth profile หรือ
`OPENROUTER_API_KEY`) หากไม่มีคีย์ ให้ใช้ `--no-probe` เพื่อแสดงเฉพาะ candidate

ผลลัพธ์การสแกนจะถูกจัดอันดับตาม:

1. การรองรับรูปภาพ
2. latency ของเครื่องมือ
3. ขนาด context
4. จำนวนพารามิเตอร์

อินพุต

- รายการ `/models` ของ OpenRouter (กรอง `:free`)
- ต้องใช้ OpenRouter API key จาก auth profile หรือ `OPENROUTER_API_KEY` (ดู [/environment](/th/help/environment))
- ตัวกรองเพิ่มเติม: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- ตัวควบคุมการ probe: `--timeout`, `--concurrency`

เมื่อรันใน TTY คุณสามารถเลือก fallback แบบโต้ตอบได้ ในโหมดไม่โต้ตอบ
ให้ส่ง `--yes` เพื่อยอมรับค่าเริ่มต้น

## รีจิสทรีโมเดล (`models.json`)

provider แบบกำหนดเองใน `models.providers` จะถูกเขียนลงใน `models.json` ภายใต้
ไดเรกทอรี agent (ค่าเริ่มต้น `~/.openclaw/agents/<agentId>/agent/models.json`) ไฟล์นี้
จะถูก merge โดยค่าเริ่มต้น เว้นแต่จะตั้ง `models.mode` เป็น `replace`

ลำดับความสำคัญของโหมด merge สำหรับ provider ID ที่ตรงกัน:

- `baseUrl` ที่ไม่ว่างและมีอยู่แล้วใน `models.json` ของ agent จะมีลำดับความสำคัญกว่า
- `apiKey` ที่ไม่ว่างใน `models.json` ของ agent จะมีลำดับความสำคัญกว่าเฉพาะเมื่อ provider นั้นไม่ได้ถูกจัดการด้วย SecretRef ในบริบท config/auth-profile ปัจจุบัน
- ค่า `apiKey` ของ provider ที่จัดการด้วย SecretRef จะถูกรีเฟรชจาก marker ของแหล่งที่มา (`ENV_VAR_NAME` สำหรับ env ref, `secretref-managed` สำหรับ file/exec ref) แทนการเก็บ secret ที่ resolve แล้ว
- ค่า header ของ provider ที่จัดการด้วย SecretRef จะถูกรีเฟรชจาก marker ของแหล่งที่มา (`secretref-env:ENV_VAR_NAME` สำหรับ env ref, `secretref-managed` สำหรับ file/exec ref)
- `apiKey`/`baseUrl` ของ agent ที่ว่างหรือไม่มีอยู่จะ fallback ไปใช้ `models.providers` จาก config
- ฟิลด์ provider อื่น ๆ จะถูกรีเฟรชจาก config และข้อมูล catalog ที่ถูก normalize แล้ว

การคงอยู่ของ marker ยึดแหล่งที่มาเป็นหลัก: OpenClaw จะเขียน marker จาก snapshot config ของแหล่งที่มาที่ใช้งานอยู่ (ก่อน resolve) ไม่ใช่จากค่า secret ของรันไทม์ที่ resolve แล้ว
สิ่งนี้มีผลทุกครั้งที่ OpenClaw สร้าง `models.json` ใหม่ รวมถึงเส้นทางที่ขับเคลื่อนด้วยคำสั่ง เช่น `openclaw agent`

## ที่เกี่ยวข้อง

- [Model Providers](/th/concepts/model-providers) — การกำหนดเส้นทาง provider และ auth
- [Model Failover](/th/concepts/model-failover) — สายโซ่ fallback
- [Image Generation](/th/tools/image-generation) — การกำหนดค่าโมเดลภาพ
- [Music Generation](/th/tools/music-generation) — การกำหนดค่าโมเดลเพลง
- [Video Generation](/th/tools/video-generation) — การกำหนดค่าโมเดลวิดีโอ
- [Configuration Reference](/th/gateway/configuration-reference#agent-defaults) — คีย์ config ของ agent ค่าเริ่มต้น
