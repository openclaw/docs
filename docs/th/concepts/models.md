---
read_when:
    - การเพิ่มหรือแก้ไข CLI ของโมเดล (`models list/set/scan/aliases/fallbacks`)
    - การเปลี่ยนพฤติกรรม fallback ของโมเดลหรือ UX ของการเลือก model
    - การอัปเดต probes การสแกนโมเดล (tools/images)
summary: 'CLI ของโมเดล: แสดงรายการ ตั้งค่า aliases fallbacks สแกน และสถานะ'
title: CLI ของโมเดล
x-i18n:
    generated_at: "2026-04-25T13:45:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 370453529596e87e724c4de7d2ae9d20334c29393116059bc01363b47c017d5d
    source_path: concepts/models.md
    workflow: 15
---

ดู [/concepts/model-failover](/th/concepts/model-failover) สำหรับการหมุนเวียนโปรไฟล์การยืนยันตัวตน คูลดาวน์ และวิธีที่สิ่งเหล่านั้นทำงานร่วมกับ fallbacks
ภาพรวมผู้ให้บริการแบบรวดเร็วพร้อมตัวอย่าง: [/concepts/model-providers](/th/concepts/model-providers)
Model refs ใช้เลือกผู้ให้บริการและโมเดล โดยปกติจะไม่ได้เลือกระดับ runtime ของ agent โดยตรง
ตัวอย่างเช่น `openai/gpt-5.5` สามารถทำงานผ่านเส้นทางผู้ให้บริการ OpenAI ปกติ หรือผ่าน runtime แบบ app-server ของ Codex ได้ ขึ้นอยู่กับ
`agents.defaults.embeddedHarness.runtime` ดู
[/concepts/agent-runtimes](/th/concepts/agent-runtimes)

## การเลือกโมเดลทำงานอย่างไร

OpenClaw เลือกโมเดลตามลำดับนี้:

1. โมเดล **หลัก** (`agents.defaults.model.primary` หรือ `agents.defaults.model`)
2. **Fallbacks** ใน `agents.defaults.model.fallbacks` (ตามลำดับ)
3. **Provider auth failover** จะเกิดขึ้นภายในผู้ให้บริการก่อนย้ายไปยังโมเดลถัดไป

ที่เกี่ยวข้อง:

- `agents.defaults.models` คือ allowlist/catalog ของโมเดลที่ OpenClaw ใช้ได้ (รวม aliases)
- `agents.defaults.imageModel` จะใช้ **เฉพาะเมื่อ** โมเดลหลักไม่สามารถรับภาพได้
- `agents.defaults.pdfModel` ถูกใช้โดย tool `pdf` หากไม่ได้กำหนด tool จะ fallback ไปใช้ `agents.defaults.imageModel` แล้วจึงใช้โมเดล session/default ที่ resolve แล้ว
- `agents.defaults.imageGenerationModel` ถูกใช้โดยความสามารถสร้างภาพแบบใช้ร่วมกัน หากไม่ได้กำหนด `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มี auth ได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id หากคุณตั้งผู้ให้บริการ/โมเดลแบบเฉพาะเจาะจง ให้กำหนด auth/API key ของผู้ให้บริการนั้นด้วย
- `agents.defaults.musicGenerationModel` ถูกใช้โดยความสามารถสร้างเพลงแบบใช้ร่วมกัน หากไม่ได้กำหนด `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มี auth ได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id หากคุณตั้งผู้ให้บริการ/โมเดลแบบเฉพาะเจาะจง ให้กำหนด auth/API key ของผู้ให้บริการนั้นด้วย
- `agents.defaults.videoGenerationModel` ถูกใช้โดยความสามารถสร้างวิดีโอแบบใช้ร่วมกัน หากไม่ได้กำหนด `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มี auth ได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id หากคุณตั้งผู้ให้บริการ/โมเดลแบบเฉพาะเจาะจง ให้กำหนด auth/API key ของผู้ให้บริการนั้นด้วย
- ค่าเริ่มต้นแยกตาม agent สามารถ override `agents.defaults.model` ได้ผ่าน `agents.list[].model` พร้อม bindings (ดู [/concepts/multi-agent](/th/concepts/multi-agent))

## นโยบายโมเดลแบบรวดเร็ว

- ตั้งค่าโมเดลหลักของคุณเป็นโมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดเท่าที่คุณใช้งานได้
- ใช้ fallbacks สำหรับงานที่ไวต่อค่าใช้จ่าย/เวลาแฝง และการแชตที่มีความสำคัญต่ำกว่า
- สำหรับ agents ที่เปิดใช้ tools หรืออินพุตที่ไม่น่าเชื่อถือ ให้หลีกเลี่ยงโมเดลรุ่นเก่าหรือระดับที่อ่อนกว่า

## Onboarding (แนะนำ)

หากคุณไม่ต้องการแก้ไข config ด้วยตนเอง ให้รัน onboarding:

```bash
openclaw onboard
```

มันสามารถตั้งค่า model + auth สำหรับผู้ให้บริการยอดนิยมได้ รวมถึง **การสมัคร OpenAI Code (Codex)** (OAuth) และ **Anthropic** (API key หรือ Claude CLI)

## คีย์ config (ภาพรวม)

- `agents.defaults.model.primary` และ `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` และ `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` และ `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` และ `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` และ `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + aliases + provider params)
- `models.providers` (ผู้ให้บริการแบบกำหนดเองที่เขียนลงใน `models.json`)

Model refs จะถูกทำให้เป็นตัวพิมพ์เล็กทั้งหมด Provider aliases เช่น `z.ai/*` จะถูกทำให้เป็น `zai/*`

ตัวอย่างการกำหนดค่าผู้ให้บริการ (รวมถึง OpenCode) อยู่ใน
[/providers/opencode](/th/providers/opencode)

### การแก้ไข allowlist อย่างปลอดภัย

ใช้การเขียนแบบ additive เมื่ออัปเดต `agents.defaults.models` ด้วยตนเอง:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` ป้องกันไม่ให้ model/provider maps ถูกเขียนทับโดยไม่ตั้งใจ การกำหนด plain object ไปที่ `agents.defaults.models`, `models.providers` หรือ `models.providers.<id>.models` โดยตรงจะถูกปฏิเสธ หากจะทำให้รายการที่มีอยู่หายไป ใช้ `--merge` สำหรับการเปลี่ยนแปลงแบบ additive; ใช้ `--replace` เฉพาะเมื่อค่าที่ให้มาควรกลายเป็นค่าเป้าหมายทั้งหมด

การตั้งค่าผู้ให้บริการแบบ interactive และ `openclaw configure --section model` จะ merge การเลือกในขอบเขตผู้ให้บริการเข้ากับ allowlist เดิมด้วย ดังนั้นการเพิ่ม Codex, Ollama หรือผู้ให้บริการอื่น จะไม่ทำให้รายการโมเดลที่ไม่เกี่ยวข้องหายไป
Configure จะคง `agents.defaults.model.primary` เดิมไว้เมื่อมีการใช้ provider auth ซ้ำอีกครั้ง คำสั่งตั้งค่าค่าเริ่มต้นแบบ explicit เช่น
`openclaw models auth login --provider <id> --set-default` และ
`openclaw models set <model>` จะยังคงแทนที่ `agents.defaults.model.primary`

## “Model is not allowed” (และเหตุใดการตอบกลับจึงหยุด)

หากมีการตั้ง `agents.defaults.models` ไว้ มันจะกลายเป็น **allowlist** สำหรับ `/model` และสำหรับ session overrides เมื่อผู้ใช้เลือกโมเดลที่ไม่ได้อยู่ใน allowlist นั้น OpenClaw จะส่งกลับว่า:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

สิ่งนี้เกิดขึ้น **ก่อน** ที่จะมีการสร้างการตอบกลับตามปกติ ดังนั้นข้อความอาจให้ความรู้สึกเหมือน “ไม่ตอบกลับ” วิธีแก้คือ:

- เพิ่มโมเดลนั้นลงใน `agents.defaults.models` หรือ
- ล้าง allowlist (ลบ `agents.defaults.models`) หรือ
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

คุณสามารถสลับโมเดลสำหรับ session ปัจจุบันได้โดยไม่ต้องรีสตาร์ต:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

หมายเหตุ:

- `/model` (และ `/model list`) เป็นตัวเลือกแบบกะทัดรัดที่มีหมายเลขกำกับ (ตระกูลโมเดล + ผู้ให้บริการที่พร้อมใช้งาน)
- บน Discord คำสั่ง `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบที่มี dropdown สำหรับผู้ให้บริการและโมเดล พร้อมขั้นตอน Submit
- `/models add` เลิกใช้งานแล้ว และตอนนี้จะส่งข้อความ deprecation กลับมาแทนการลงทะเบียนโมเดลจากในแชต
- `/model <#>` จะเลือกจากตัวเลือกนั้น
- `/model` จะบันทึกการเลือก session ใหม่ทันที
- หาก agent ว่างอยู่ การรันครั้งถัดไปจะใช้โมเดลใหม่ทันที
- หากมีการรันที่กำลังทำงานอยู่แล้ว OpenClaw จะทำเครื่องหมายการสลับแบบ live ว่ากำลังรอดำเนินการ และจะรีสตาร์ตเข้าโมเดลใหม่เมื่อถึงจุด retry ที่เหมาะสม
- หากกิจกรรมของ tool หรือเอาต์พุตการตอบกลับเริ่มขึ้นแล้ว การสลับที่รอดำเนินการอาจยังคงค้างอยู่จนกว่าจะมีโอกาส retry ครั้งถัดไป หรือจนถึง user turn ถัดไป
- `/model status` คือมุมมองแบบละเอียด (auth candidates และเมื่อมีการกำหนดค่าไว้ จะรวม provider endpoint `baseUrl` + โหมด `api`)
- Model refs ถูก parse โดยแยกที่ `/` **ตัวแรก** ใช้รูปแบบ `provider/model` เมื่อต้องพิมพ์ `/model <ref>`
- หาก model ID เองมี `/` อยู่ด้วย (สไตล์ OpenRouter) คุณต้องใส่ provider prefix ด้วย (ตัวอย่าง: `/model openrouter/moonshotai/kimi-k2`)
- หากคุณไม่ระบุ provider OpenClaw จะ resolve อินพุตตามลำดับนี้:
  1. ตรงกับ alias
  2. ตรงกับ configured-provider แบบไม่ซ้ำสำหรับ model id แบบไม่ใส่ prefix นั้น
  3. fallback แบบ deprecated ไปยัง configured default provider
     หากผู้ให้บริการนั้นไม่เปิดเผยโมเดลค่าเริ่มต้นที่กำหนดไว้อีกต่อไป OpenClaw
     จะ fallback ไปยัง provider/model ตัวแรกที่กำหนดค่าไว้แทน เพื่อหลีกเลี่ยง
     การแสดงค่าเริ่มต้นของผู้ให้บริการที่เก่าและถูกถอดออกแล้ว

พฤติกรรม/การกำหนดค่าของคำสั่งแบบเต็ม: [Slash commands](/th/tools/slash-commands)

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

จะแสดงโมเดลที่กำหนดค่าไว้โดยค่าเริ่มต้น flags ที่มีประโยชน์:

- `--all`: catalog แบบเต็ม
- `--local`: เฉพาะผู้ให้บริการในเครื่อง
- `--provider <id>`: กรองตาม provider id เช่น `moonshot`; ไม่รองรับ display labels จาก interactive pickers
- `--plain`: หนึ่งโมเดลต่อหนึ่งบรรทัด
- `--json`: เอาต์พุตที่เครื่องอ่านได้

`--all` จะรวมแถว static catalog แบบ bundled ที่ผู้ให้บริการเป็นเจ้าของไว้ก่อนที่ auth จะถูกกำหนดค่า ดังนั้นมุมมองแบบ discovery-only จึงสามารถแสดงโมเดลที่ยังใช้งานไม่ได้จนกว่าคุณจะเพิ่มข้อมูลรับรองของผู้ให้บริการที่ตรงกัน

### `models status`

แสดงโมเดลหลักที่ resolve แล้ว, fallbacks, image model และภาพรวม auth ของผู้ให้บริการที่กำหนดค่าไว้ นอกจากนี้ยังแสดงสถานะการหมดอายุของ OAuth สำหรับโปรไฟล์ที่พบใน auth store (จะแจ้งเตือนภายใน 24 ชั่วโมงเป็นค่าเริ่มต้น) `--plain` จะแสดงเฉพาะโมเดลหลักที่ resolve แล้ว
สถานะ OAuth จะแสดงเสมอ (และรวมอยู่ในเอาต์พุต `--json`) หากผู้ให้บริการที่กำหนดค่าไว้ไม่มีข้อมูลรับรอง `models status` จะแสดงส่วน **Missing auth** JSON จะมี `auth.oauth` (ช่วงเวลาเตือน + โปรไฟล์) และ `auth.providers`
(auth ที่มีผลจริงต่อผู้ให้บริการ รวมถึงข้อมูลรับรองจาก env) `auth.oauth`
เป็นสถานะสุขภาพของโปรไฟล์ใน auth store เท่านั้น; ผู้ให้บริการที่ใช้เฉพาะ env จะไม่ปรากฏที่นี่
ใช้ `--check` สำหรับระบบอัตโนมัติ (exit `1` เมื่อขาดหาย/หมดอายุ, `2` เมื่อใกล้หมดอายุ)
ใช้ `--probe` สำหรับการตรวจสอบ auth แบบ live; แถว probe อาจมาจาก auth profiles, ข้อมูลรับรองจาก env หรือ `models.json`
หาก `auth.order.<provider>` แบบ explicit ไม่รวมโปรไฟล์ที่เก็บไว้ probe จะรายงาน
`excluded_by_auth_order` แทนการลองใช้ หากมี auth แต่ไม่สามารถ resolve โมเดลที่ probe ได้สำหรับผู้ให้บริการนั้น probe จะรายงาน `status: no_model`

การเลือก auth ขึ้นอยู่กับผู้ให้บริการ/บัญชี สำหรับโฮสต์ Gateway ที่เปิดใช้งานตลอดเวลา API keys มักจะคาดการณ์ได้มากที่สุด; รองรับการใช้ Claude CLI ซ้ำและโปรไฟล์ OAuth/token ของ Anthropic ที่มีอยู่เดิมด้วย

ตัวอย่าง (Claude CLI):

```bash
claude auth login
openclaw models status
```

## การสแกน (โมเดลฟรีของ OpenRouter)

`openclaw models scan` จะตรวจสอบ **free model catalog** ของ OpenRouter และสามารถเลือก probe โมเดลเพื่อดูการรองรับ tools และภาพได้

flags สำคัญ:

- `--no-probe`: ข้าม live probes (เฉพาะ metadata)
- `--min-params <b>`: ขนาดพารามิเตอร์ขั้นต่ำ (พันล้าน)
- `--max-age-days <days>`: ข้ามโมเดลที่เก่ากว่า
- `--provider <name>`: ตัวกรอง provider prefix
- `--max-candidates <n>`: ขนาดของรายการ fallback
- `--set-default`: ตั้ง `agents.defaults.model.primary` เป็นตัวเลือกแรก
- `--set-image`: ตั้ง `agents.defaults.imageModel.primary` เป็นตัวเลือกภาพตัวแรก

catalog `/models` ของ OpenRouter เป็นสาธารณะ ดังนั้นการสแกนแบบ metadata-only สามารถแสดงผู้สมัครแบบฟรีได้โดยไม่ต้องใช้คีย์ แต่การ probe และ inference ยังคงต้องใช้ OpenRouter API key (จาก auth profiles หรือ `OPENROUTER_API_KEY`) หากไม่มีคีย์ `openclaw models scan` จะ fallback ไปเป็นเอาต์พุตแบบ metadata-only และจะไม่เปลี่ยน config ใช้ `--no-probe` เพื่อขอโหมด metadata-only อย่างชัดเจน

ผลการสแกนจะถูกจัดอันดับตาม:

1. การรองรับภาพ
2. เวลาแฝงของ tool
3. ขนาด context
4. จำนวนพารามิเตอร์

อินพุต

- รายการ `/models` ของ OpenRouter (กรอง `:free`)
- live probes ต้องใช้ OpenRouter API key จาก auth profiles หรือ `OPENROUTER_API_KEY` (ดู [/environment](/th/help/environment))
- ตัวกรองแบบไม่บังคับ: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- ตัวควบคุมคำขอ/การ probe: `--timeout`, `--concurrency`

เมื่อมีการรัน live probes ใน TTY คุณสามารถเลือก fallbacks แบบโต้ตอบได้ ในโหมดไม่โต้ตอบ ให้ส่ง `--yes` เพื่อยอมรับค่าเริ่มต้น ผลลัพธ์แบบ metadata-only มีไว้เพื่อให้ข้อมูล; `--set-default` และ `--set-image` ต้องใช้ live probes เพื่อไม่ให้ OpenClaw กำหนดค่าโมเดล OpenRouter ที่ใช้ไม่ได้เพราะไม่มีคีย์

## Models registry (`models.json`)

ผู้ให้บริการแบบกำหนดเองใน `models.providers` จะถูกเขียนลงใน `models.json` ภายใต้ไดเรกทอรีของ agent (ค่าเริ่มต้นคือ `~/.openclaw/agents/<agentId>/agent/models.json`) ไฟล์นี้จะถูก merge โดยค่าเริ่มต้น เว้นแต่จะตั้ง `models.mode` เป็น `replace`

ลำดับความสำคัญของโหมด merge สำหรับ provider IDs ที่ตรงกัน:

- `baseUrl` ที่ไม่ว่างและมีอยู่แล้วใน `models.json` ของ agent จะมีความสำคัญกว่า
- `apiKey` ที่ไม่ว่างใน `models.json` ของ agent จะมีความสำคัญกว่า เฉพาะเมื่อผู้ให้บริการนั้นไม่ได้ถูกจัดการด้วย SecretRef ในบริบท config/auth-profile ปัจจุบัน
- ค่า `apiKey` ของผู้ให้บริการที่จัดการด้วย SecretRef จะถูกรีเฟรชจาก source markers (`ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs) แทนการเก็บซีเคร็ตที่ resolve แล้ว
- ค่า header ของผู้ให้บริการที่จัดการด้วย SecretRef จะถูกรีเฟรชจาก source markers (`secretref-env:ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs)
- `apiKey`/`baseUrl` ของ agent ที่ว่างหรือไม่มี จะ fallback ไปใช้ `models.providers` ใน config
- ฟิลด์อื่น ๆ ของผู้ให้บริการจะถูกรีเฟรชจาก config และข้อมูล catalog ที่ทำให้เป็นมาตรฐานแล้ว

การคงอยู่ของ marker ยึดตาม source เป็นหลัก: OpenClaw จะเขียน markers จาก snapshot ของ source config ที่กำลังใช้งานอยู่ (ก่อน resolve) ไม่ใช่จากค่า secret ของ runtime ที่ resolve แล้ว
สิ่งนี้ใช้ทุกครั้งที่ OpenClaw สร้าง `models.json` ใหม่ รวมถึงเส้นทางที่ขับเคลื่อนด้วยคำสั่ง เช่น `openclaw agent`

## ที่เกี่ยวข้อง

- [Model Providers](/th/concepts/model-providers) — การกำหนดเส้นทางผู้ให้บริการและ auth
- [Agent Runtimes](/th/concepts/agent-runtimes) — Pi, Codex และ runtime ของ agent loop อื่น ๆ
- [Model Failover](/th/concepts/model-failover) — สายโซ่ fallback
- [Image Generation](/th/tools/image-generation) — การกำหนดค่าโมเดลสร้างภาพ
- [Music Generation](/th/tools/music-generation) — การกำหนดค่าโมเดลสร้างเพลง
- [Video Generation](/th/tools/video-generation) — การกำหนดค่าโมเดลสร้างวิดีโอ
- [Configuration Reference](/th/gateway/config-agents#agent-defaults) — คีย์ config ของโมเดล
