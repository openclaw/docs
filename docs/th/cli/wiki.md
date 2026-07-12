---
read_when:
    - คุณต้องการใช้ CLI ของ memory-wiki
    - คุณกำลังจัดทำเอกสารหรือเปลี่ยนแปลง `openclaw wiki`
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw wiki` (สถานะคลัง memory-wiki, การค้นหา, การคอมไพล์, การตรวจสอบ, การนำไปใช้, บริดจ์, การนำเข้าจาก ChatGPT และเครื่องมือช่วยสำหรับ Obsidian)
title: วิกิ
x-i18n:
    generated_at: "2026-07-12T16:03:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

ตรวจสอบและบำรุงรักษาคลัง `memory-wiki` ซึ่งมาจาก Plugin `memory-wiki` ที่รวมมาให้

ที่เกี่ยวข้อง: [Plugin Memory Wiki](/th/plugins/memory-wiki), [ภาพรวมหน่วยความจำ](/th/concepts/memory), [CLI: หน่วยความจำ](/th/cli/memory)

## คำสั่งที่ใช้บ่อย

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "who should I ask about Teams?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import
openclaw wiki chatgpt import --export ./chatgpt-export --dry-run
openclaw wiki chatgpt rollback <run-id>

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## การเลือกเอเจนต์

เมื่อ `plugins.entries.memory-wiki.config.vault.scope` เป็น `agent` ให้เลือก
คลังด้วยตัวเลือกระดับบนสุด `--agent <id>`:

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "refund policy"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

ในการตั้งค่าที่มีเอเจนต์หลายตัว `--agent` เป็นตัวเลือกที่จำเป็นสำหรับการดำเนินการผ่าน CLI
เพื่อป้องกันไม่ให้คำสั่งอ่านหรือเขียนคลังเริ่มต้นใด ๆ โดยพลการ หากกำหนดค่า
เอเจนต์ไว้เพียงตัวเดียว เอเจนต์นั้นยังคงเป็นค่าเริ่มต้น รหัสเอเจนต์ที่ไม่รู้จัก
จะทำให้การทำงานล้มเหลวก่อนเริ่มดำเนินการกับคลัง ตัวเลือกนี้ไม่เปลี่ยนพาธที่เลือก
เมื่อ `vault.scope` เป็น `global`

ไคลเอนต์ Gateway ใช้กฎเดียวกัน: ส่ง `agentId` ในคำขอ `wiki.*`
ที่อิงคลังในการตั้งค่าแบบหลายเอเจนต์ซึ่งแยกขอบเขตตามเอเจนต์ รหัสที่ขาดหายหรือไม่รู้จักถือเป็น
ข้อผิดพลาด เทิร์นของเอเจนต์ เครื่องมือวิกิ ส่วนเสริมคลังข้อมูลหน่วยความจำ และไดเจสต์พรอมต์
ที่คอมไพล์แล้วมีบริบทเอเจนต์รันไทม์ที่ใช้งานอยู่แนบมาด้วยอยู่แล้ว

## คำสั่ง

### `wiki status`

แสดงโหมดและขอบเขตของคลัง เอเจนต์ที่ได้รับการแก้ค่าแล้ว สถานะความพร้อม และความพร้อมใช้งานของ Obsidian CLI ใช้คำสั่งนี้ก่อนเพื่อตรวจสอบว่าคลังที่ต้องการได้รับการเริ่มต้นแล้วหรือไม่ โหมดบริดจ์ทำงานเป็นปกติหรือไม่ หรือพร้อมใช้งานการผสานรวมกับ Obsidian หรือไม่

เมื่อโหมดบริดจ์ทำงานและกำหนดค่าให้อ่านอาร์ติแฟกต์หน่วยความจำ คำสั่งนี้จะสอบถาม Gateway ที่กำลังทำงาน เพื่อให้มองเห็นบริบท Plugin หน่วยความจำที่ใช้งานอยู่เดียวกันกับหน่วยความจำของเอเจนต์/รันไทม์

### `wiki doctor`

เรียกใช้การตรวจสอบสถานะของวิกิและรายงานวิธีแก้ไขที่นำไปดำเนินการได้ จบการทำงานด้วยค่าที่ไม่ใช่ศูนย์เมื่อสถานะไม่พร้อมใช้งาน

เมื่อโหมดบริดจ์ทำงานและกำหนดค่าให้อ่านอาร์ติแฟกต์หน่วยความจำ คำสั่งนี้จะสอบถาม Gateway ที่กำลังทำงานก่อนสร้างรายงาน การนำเข้าผ่านบริดจ์ที่ปิดใช้งานและการกำหนดค่าบริดจ์ที่ไม่อ่านอาร์ติแฟกต์หน่วยความจำจะยังคงทำงานภายในเครื่อง/ออฟไลน์

ปัญหาที่พบบ่อย:

- เปิดใช้โหมดบริดจ์โดยไม่มีอาร์ติแฟกต์หน่วยความจำสาธารณะ
- โครงสร้างคลังไม่ถูกต้องหรือขาดหาย
- ไม่มี Obsidian CLI ภายนอกเมื่อคาดว่าจะใช้โหมด Obsidian

### `wiki init`

สร้างโครงสร้างคลังวิกิและหน้าเริ่มต้น รวมถึงดัชนีระดับบนสุดและไดเรกทอรีแคช

### `wiki ingest <path>`

นำเข้าไฟล์ Markdown หรือไฟล์ข้อความภายในเครื่องไปยังโฟลเดอร์ `sources/` ของวิกิในฐานะหน้าต้นทาง `<path>` ต้องเป็นพาธไฟล์ภายในเครื่อง ปัจจุบันยังไม่รองรับการนำเข้าจาก URL ปฏิเสธไฟล์ไบนารี

หน้าต้นทางที่นำเข้าจะมีฟรอนต์แมตเทอร์ระบุแหล่งที่มา (`sourceType: local-file`, `sourcePath`, `ingestedAt`) การนำเข้าจะคอมไพล์คลังใหม่ในภายหลังเสมอ

แฟล็ก: `--title <title>` ใช้แทนชื่อเรื่องของต้นทาง (ค่าเริ่มต้น: สร้างจากชื่อไฟล์)

### `wiki okf import <path>`

นำเข้าบันเดิล Open Knowledge Format ที่แตกไฟล์แล้วเป็นหน้าแนวคิดของวิกิ

ตัวนำเข้าจะอ่านเอกสารแนวคิด `.md` ทุกไฟล์ที่ไม่ได้สงวนไว้ในโครงสร้างไดเรกทอรี OKF กำหนดให้ฟิลด์ `type` ต้องไม่ว่าง และถือว่าค่า `type` ของ OKF ที่ไม่รู้จักเป็นแนวคิดทั่วไป ไฟล์ `index.md` และ `log.md` ที่ OKF สงวนไว้จะไม่ถูกนำเข้าเป็นแนวคิด

หน้าที่นำเข้าจะถูกจัดให้อยู่ในระดับเดียวกันภายใต้ `concepts/` เพื่อให้กระบวนการคอมไพล์ ค้นหา อ่าน ไดเจสต์ และแดชบอร์ดของวิกิที่มีอยู่มองเห็นได้ทันที รหัสแนวคิด OKF เดิม, `type`, `resource`, `tags`, การประทับเวลา, พาธต้นทาง และฟรอนต์แมตเทอร์ทั้งหมดจะได้รับการเก็บรักษาไว้ในฟรอนต์แมตเทอร์ของหน้า ลิงก์ Markdown ภายในของ OKF จะถูกเขียนใหม่ให้ชี้ไปยังหน้าวิกิที่สร้างขึ้น ส่วนลิงก์เสียหรือลิงก์ภายนอกจะไม่ถูกเปลี่ยนแปลง การนำเข้าจะคอมไพล์คลังใหม่ในภายหลังเสมอ

ตัวอย่าง:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

สร้างดัชนี บล็อกที่เกี่ยวข้อง แดชบอร์ด และไดเจสต์ที่คอมไพล์แล้วขึ้นใหม่ เขียนอาร์ติแฟกต์สำหรับเครื่องที่มีความเสถียรไว้ภายใต้:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

หากเปิดใช้ `render.createDashboards` การคอมไพล์จะรีเฟรชหน้ารายงานด้วย

### `wiki lint`

ตรวจสอบคลังและเขียนรายงานที่ครอบคลุม:

- ปัญหาด้านโครงสร้าง (ลิงก์เสีย รหัสขาดหาย/ซ้ำ ไม่มีประเภทหน้าหรือชื่อเรื่อง ฟรอนต์แมตเทอร์ไม่ถูกต้อง)
- ช่องว่างด้านแหล่งที่มา (ไม่มีรหัสต้นทาง ไม่มีข้อมูลแหล่งที่มาของการนำเข้า)
- ความขัดแย้ง (ความขัดแย้งที่ถูกทำเครื่องหมาย ข้อกล่าวอ้างที่ขัดแย้งกัน)
- คำถามที่ยังไม่มีคำตอบ
- หน้าและข้อกล่าวอ้างที่มีความเชื่อมั่นต่ำ
- หน้าและข้อกล่าวอ้างที่ล้าสมัย

เรียกใช้คำสั่งนี้หลังจากอัปเดตวิกิในส่วนสำคัญ

### `wiki search <query>`

ค้นหาเนื้อหาวิกิ ลักษณะการทำงานขึ้นอยู่กับการกำหนดค่า:

- `search.backend`: `shared` หรือ `local`
- `search.corpus`: `wiki`, `memory` หรือ `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` หรือ `raw-claim`

ใช้ `wiki search` สำหรับการจัดอันดับและข้อมูลแหล่งที่มาเฉพาะวิกิ สำหรับการเรียกคืนข้อมูลร่วมแบบกว้างในครั้งเดียว ให้เลือกใช้ `openclaw memory search` เมื่อ Plugin หน่วยความจำที่ใช้งานอยู่เปิดเผยการค้นหาร่วม

โหมดการค้นหา:

- `find-person`: นามแฝง ชื่อบัญชี โซเชียล รหัสมาตรฐาน และหน้าบุคคล
- `route-question`: คำใบ้ว่าให้สอบถามใคร/เหมาะใช้เพื่อสิ่งใดมากที่สุด และบริบทความสัมพันธ์
- `source-evidence`: หน้าต้นทางและฟิลด์หลักฐานที่มีโครงสร้าง
- `raw-claim`: ข้อความข้อกล่าวอ้างที่มีโครงสร้าง พร้อมเมทาดาทาของข้อกล่าวอ้าง/หลักฐาน

ตัวอย่าง:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

เอาต์พุตข้อความจะมีบรรทัด `Claim:` และ `Evidence:` เมื่อผลลัพธ์ตรงกับข้อกล่าวอ้างที่มีโครงสร้าง เอาต์พุต JSON จะแสดง `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` และ `evidenceSourceIds` เพิ่มเติม เพื่อให้เอเจนต์เจาะลึกรายละเอียดได้

### `wiki get <lookup>`

อ่านหน้าวิกิตามรหัสหรือพาธสัมพัทธ์

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

ใช้การเปลี่ยนแปลงแบบจำกัดขอบเขตโดยไม่แก้ไขหน้าอย่างอิสระ:

- `apply synthesis <title>`: สร้างหรือรีเฟรชหน้าสังเคราะห์พร้อมเนื้อหาสรุปที่ระบบจัดการ
- `apply metadata <lookup>`: อัปเดตเมทาดาทาบนหน้าที่มีอยู่

ทั้งสองคำสั่งรองรับ `--source-id`, `--contradiction`, `--question` (ระบุซ้ำได้แต่ละรายการ), `--confidence <n>` (0-1) และ `--status <status>` นอกจากนี้ `apply metadata` ยังรองรับ `--clear-confidence` เพื่อลบค่าความเชื่อมั่นที่จัดเก็บไว้ นี่เป็นวิธีที่รองรับอย่างเป็นทางการในการพัฒนาหน้าวิกิ โดยคงบล็อกที่สร้างและจัดการโดยระบบไว้ครบถ้วน

### `wiki bridge import`

นำเข้าอาร์ติแฟกต์หน่วยความจำสาธารณะจาก Plugin หน่วยความจำที่ใช้งานอยู่ไปยังหน้าต้นทางที่อิงบริดจ์ ใช้คำสั่งนี้ในโหมด `bridge` เพื่อดึงอาร์ติแฟกต์หน่วยความจำที่ส่งออกล่าสุดเข้ามายังคลังวิกิ

สำหรับการอ่านอาร์ติแฟกต์บริดจ์ที่ใช้งานอยู่ CLI จะกำหนดเส้นทางการนำเข้าผ่าน Gateway RPC เพื่อใช้บริบท Plugin หน่วยความจำของรันไทม์ หากปิดใช้การนำเข้าผ่านบริดจ์หรือปิดการอ่านอาร์ติแฟกต์ คำสั่งจะคงลักษณะการทำงานแบบนำเข้าเป็นศูนย์ภายในเครื่อง/ออฟไลน์ การรีเฟรชดัชนีหลังนำเข้าถูกควบคุมโดย `ingest.autoCompile`

### `wiki unsafe-local import`

นำเข้าจากพาธภายในเครื่องที่กำหนดไว้อย่างชัดเจน (`unsafeLocal.paths`) ในโหมด `unsafe-local` เป็นฟีเจอร์ทดลองโดยเจตนาและใช้ได้เฉพาะในเครื่องเดียวกัน การรีเฟรชดัชนีหลังนำเข้าถูกควบคุมโดย `ingest.autoCompile`

### `wiki chatgpt import`

นำเข้าไฟล์ส่งออกของ ChatGPT เป็นหน้าต้นทางฉบับร่างของวิกิ

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| แฟล็ก             | ค่าเริ่มต้น | คำอธิบาย                                                         |
| ----------------- | ---------- | ---------------------------------------------------------------- |
| `--export <path>` | (จำเป็น)   | ไดเรกทอรีไฟล์ส่งออกของ ChatGPT หรือพาธ `conversations.json`      |
| `--dry-run`       | `false`    | แสดงตัวอย่างจำนวนรายการที่สร้าง/อัปเดต/ข้ามโดยไม่เขียนหน้า       |

การนำเข้าที่ไม่ใช่การทดลองทำงานและเปลี่ยนแปลงหน้าใด ๆ จะบันทึกรหัสรอบการนำเข้า ซึ่งแสดงในสรุปและจำเป็นสำหรับการย้อนกลับ

### `wiki chatgpt rollback <run-id>`

ย้อนกลับรอบการนำเข้า ChatGPT ที่ใช้ไปก่อนหน้านี้ โดยลบหน้าที่สร้างและคืนค่าหน้าที่ถูกเขียนทับ ไม่ดำเนินการใด ๆ (และรายงาน `alreadyRolledBack`) หากรอบดังกล่าวถูกย้อนกลับไปแล้ว

### `wiki obsidian ...`

คำสั่งตัวช่วย Obsidian สำหรับคลังที่ทำงานในโหมดที่เป็นมิตรกับ Obsidian ได้แก่ `status`, `search`, `open`, `command`, `daily` คำสั่งเหล่านี้ต้องใช้ CLI `obsidian` อย่างเป็นทางการใน `PATH` เมื่อเปิดใช้ `obsidian.useOfficialCli`

การตรวจสอบความถูกต้องของการกำหนดค่าจะปฏิเสธ `obsidian.useOfficialCli: true` เมื่อ
`vault.scope` เป็น `agent` เนื่องจาก `obsidian.vaultName` เป็นการตั้งค่าร่วมรายการเดียว
ไม่ใช่การแมปแยกตามเอเจนต์ การเรนเดอร์ Markdown ที่เป็นมิตรกับ Obsidian ยังคง
พร้อมใช้งาน

## แนวทางการใช้งานจริง

- ใช้ `wiki search` + `wiki get` เมื่อข้อมูลแหล่งที่มาและอัตลักษณ์ของหน้ามีความสำคัญ
- ใช้ `wiki apply` แทนการแก้ไขส่วนที่สร้างและจัดการโดยระบบด้วยตนเอง
- ใช้ `wiki lint` ก่อนเชื่อถือเนื้อหาที่ขัดแย้งกันหรือมีความเชื่อมั่นต่ำ
- ใช้ `wiki compile` หลังการนำเข้าจำนวนมากหรือการเปลี่ยนแปลงต้นทาง เมื่อต้องการแดชบอร์ดและไดเจสต์ที่คอมไพล์แล้วซึ่งเป็นข้อมูลล่าสุดทันที
- ใช้ `wiki okf import` เมื่อแค็ตตาล็อกข้อมูล ไฟล์ส่งออกเอกสาร หรือไปป์ไลน์เสริมข้อมูลของเอเจนต์สร้างบันเดิล Markdown แบบ OKF อยู่แล้ว
- ใช้ `wiki bridge import` เมื่อโหมดบริดจ์ต้องพึ่งพาอาร์ติแฟกต์หน่วยความจำที่เพิ่งส่งออก

## การกำหนดค่าที่เกี่ยวข้อง

ลักษณะการทำงานของ `openclaw wiki` ถูกกำหนดโดย:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.vault.scope`
- `plugins.entries.memory-wiki.config.vault.path`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

ดูโมเดลการกำหนดค่าฉบับเต็มได้ที่ [Plugin Memory Wiki](/th/plugins/memory-wiki)

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [วิกิหน่วยความจำ](/th/plugins/memory-wiki)
