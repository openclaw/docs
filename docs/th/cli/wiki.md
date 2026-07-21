---
read_when:
    - คุณต้องการใช้ CLI ของ memory-wiki
    - คุณกำลังจัดทำเอกสารหรือเปลี่ยนแปลง `openclaw wiki`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw wiki` (สถานะคลัง memory-wiki, การค้นหา, คอมไพล์, lint, นำไปใช้, bridge, นำเข้าจาก ChatGPT และตัวช่วย Obsidian)
title: วิกิ
x-i18n:
    generated_at: "2026-07-21T15:18:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1f793d52de270068cf3a06b13f52242bb66738235718639486e090a2de213e73
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

ตรวจสอบและบำรุงรักษาคลัง `memory-wiki` ซึ่งจัดหาโดย Plugin `memory-wiki` แบบไม่บังคับที่รวมมาให้ เปิดใช้งานก่อนใช้ครั้งแรก:

```bash
openclaw plugins enable memory-wiki
openclaw gateway restart
```

ที่เกี่ยวข้อง: [Plugin Memory Wiki](/th/plugins/memory-wiki), [ภาพรวมหน่วยความจำ](/th/concepts/memory), [CLI: หน่วยความจำ](/th/cli/memory)

## คำสั่งทั่วไป

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
คลังด้วยตัวเลือก `--agent <id>` ระดับบนสุด:

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "refund policy"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

ในการตั้งค่าที่มีเอเจนต์หลายตัวซึ่งกำหนดค่าไว้ จำเป็นต้องใช้ `--agent` สำหรับการดำเนินการผ่าน CLI
เพื่อไม่ให้คำสั่งอ่านหรือเขียนคลังเริ่มต้นใด ๆ โดยพลการ หาก
กำหนดค่าเอเจนต์ไว้เพียงตัวเดียว เอเจนต์นั้นจะยังคงเป็นค่าเริ่มต้น รหัสเอเจนต์ที่ไม่รู้จัก
จะทำให้การทำงานล้มเหลวก่อนเริ่มดำเนินการกับคลัง ตัวเลือกนี้ไม่เปลี่ยนพาธที่เลือก
เมื่อ `vault.scope` เป็น `global`

ไคลเอนต์ Gateway ใช้กฎเดียวกัน: ส่ง `agentId` ในคำขอ `wiki.*`
ที่ใช้คลังเป็นแบ็กเอนด์ในการตั้งค่าแบบหลายเอเจนต์ซึ่งมีขอบเขตตามเอเจนต์ การไม่มีรหัสหรือใช้รหัสที่ไม่รู้จักถือเป็น
ข้อผิดพลาด รอบการทำงานของเอเจนต์ เครื่องมือ wiki ส่วนเสริมคลังข้อมูลหน่วยความจำ และไดเจสต์พรอมต์
ที่คอมไพล์แล้วมีบริบทเอเจนต์รันไทม์ที่ใช้งานอยู่ติดมาด้วยอยู่แล้ว

## คำสั่ง

### `wiki status`

แสดงโหมดและขอบเขตของคลัง เอเจนต์ที่ผ่านการแก้ค่าแล้ว สถานะความพร้อมใช้งาน และความพร้อมใช้งานของ CLI Obsidian ใช้คำสั่งนี้ก่อนเพื่อตรวจสอบว่าคลังที่ต้องการได้รับการกำหนดค่าเริ่มต้นแล้วหรือไม่ โหมดบริดจ์ทำงานเป็นปกติหรือไม่ หรือพร้อมใช้งานการผสานรวมกับ Obsidian หรือไม่

เมื่อโหมดบริดจ์ทำงานอยู่และกำหนดค่าให้อ่านอาร์ติแฟกต์หน่วยความจำ คำสั่งนี้จะสืบค้น Gateway ที่กำลังทำงาน เพื่อให้เห็นบริบท Plugin หน่วยความจำที่ใช้งานอยู่เดียวกับหน่วยความจำของเอเจนต์/รันไทม์

### `wiki doctor`

เรียกใช้การตรวจสอบความพร้อมใช้งานของ wiki และรายงานวิธีแก้ไขที่ดำเนินการได้ ออกจากโปรแกรมด้วยรหัสที่ไม่ใช่ศูนย์เมื่อระบบไม่พร้อมใช้งาน

เมื่อโหมดบริดจ์ทำงานอยู่และกำหนดค่าให้อ่านอาร์ติแฟกต์หน่วยความจำ คำสั่งนี้จะสืบค้น Gateway ที่กำลังทำงานก่อนสร้างรายงาน การนำเข้าผ่านบริดจ์ที่ปิดใช้งานและการกำหนดค่าบริดจ์ที่ไม่อ่านอาร์ติแฟกต์หน่วยความจำจะยังคงทำงานแบบภายในเครื่อง/ออฟไลน์

ปัญหาที่พบบ่อย:

- เปิดใช้โหมดบริดจ์โดยไม่มีอาร์ติแฟกต์หน่วยความจำสาธารณะ
- โครงสร้างคลังไม่ถูกต้องหรือไม่มีอยู่
- ไม่มี CLI Obsidian ภายนอกเมื่อคาดว่าจะใช้โหมด Obsidian

### `wiki init`

สร้างโครงสร้างคลัง wiki และหน้าเริ่มต้น รวมถึงดัชนีระดับบนสุดและไดเรกทอรีแคช

### `wiki ingest <path>`

นำเข้าไฟล์ Markdown หรือข้อความภายในเครื่องไปยังโฟลเดอร์ `sources/` ของ wiki เป็นหน้าต้นฉบับ `<path>` ต้องเป็นพาธไฟล์ภายในเครื่อง ปัจจุบันยังไม่รองรับการนำเข้าจาก URL ปฏิเสธไฟล์ไบนารี

หน้าต้นฉบับที่นำเข้าจะมี frontmatter แหล่งที่มา (`sourceType: local-file`, `sourcePath`, `ingestedAt`) การนำเข้าจะคอมไพล์คลังใหม่หลังจากนั้นเสมอ

แฟล็ก: `--title <title>` ใช้แทนชื่อเรื่องของต้นฉบับ (ค่าเริ่มต้น: สร้างจากชื่อไฟล์)

### `wiki okf import <path>`

นำเข้าบันเดิล Open Knowledge Format ที่แตกไฟล์แล้วไปยังหน้าแนวคิดของ wiki

ตัวนำเข้าจะอ่านเอกสารแนวคิด `.md` ที่ไม่สงวนไว้ทุกไฟล์ในโครงสร้างไดเรกทอรี OKF กำหนดให้มีฟิลด์ `type` ที่ไม่ว่าง และถือว่าค่า `type` ของ OKF ที่ไม่รู้จักเป็นแนวคิดทั่วไป ไฟล์ `index.md` และ `log.md` ที่ OKF สงวนไว้จะไม่ถูกนำเข้าเป็นแนวคิด

หน้าที่นำเข้าจะถูกจัดให้อยู่ในระดับเดียวกันภายใต้ `concepts/` เพื่อให้ขั้นตอนคอมไพล์ ค้นหา อ่าน ไดเจสต์ และแดชบอร์ดของ wiki ที่มีอยู่มองเห็นได้ทันที รหัสแนวคิด OKF เดิม, `type`, `resource`, `tags`, การประทับเวลา พาธต้นฉบับ และ frontmatter ทั้งหมดจะถูกเก็บรักษาไว้ใน frontmatter ของหน้า ลิงก์ Markdown ภายใน OKF จะถูกเขียนใหม่ให้ชี้ไปยังหน้า wiki ที่สร้างขึ้น ส่วนลิงก์ที่เสียหายหรือลิงก์ภายนอกจะคงไว้โดยไม่เปลี่ยนแปลง การนำเข้าจะคอมไพล์คลังใหม่หลังจากนั้นเสมอ

ตัวอย่าง:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

สร้างดัชนี บล็อกที่เกี่ยวข้อง แดชบอร์ด และสแนปช็อตคำค้นหา/พรอมต์ที่คอมไพล์แล้วใหม่ สแนปช็อตจะถูกจัดเก็บถาวรในสถานะ Plugin SQLite ที่ใช้ร่วมกันของ OpenClaw และเก็บไว้ในหน่วยความจำสำหรับการฉายพรอมต์แบบซิงโครนัส โดยจะไม่สร้างไฟล์แคชในคลัง

หากเปิดใช้ `render.createDashboards` การคอมไพล์จะรีเฟรชหน้ารายงานด้วย

### `wiki lint`

ตรวจสอบคลังด้วยลินต์และเขียนรายงานที่ครอบคลุม:

- ปัญหาเชิงโครงสร้าง (ลิงก์เสีย รหัสหาย/ซ้ำ ไม่มีประเภทหน้าหรือชื่อเรื่อง frontmatter ไม่ถูกต้อง)
- ช่องว่างด้านแหล่งที่มา (ไม่มีรหัสต้นฉบับ ไม่มีแหล่งที่มาของการนำเข้า)
- ข้อขัดแย้ง (ข้อขัดแย้งที่ถูกทำเครื่องหมาย คำกล่าวอ้างที่ขัดแย้งกัน)
- คำถามที่ยังไม่มีคำตอบ
- หน้าและคำกล่าวอ้างที่มีความเชื่อมั่นต่ำ
- หน้าและคำกล่าวอ้างที่ล้าสมัย

เรียกใช้คำสั่งนี้หลังจากมีการอัปเดต wiki ที่สำคัญ

### `wiki search <query>`

ค้นหาเนื้อหา wiki ลักษณะการทำงานขึ้นอยู่กับการกำหนดค่า:

- `search.backend`: `shared` หรือ `local`
- `search.corpus`: `wiki`, `memory` หรือ `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` หรือ `raw-claim`

ใช้ `wiki search` สำหรับการจัดอันดับและแหล่งที่มาที่เฉพาะเจาะจงกับ wiki สำหรับการเรียกคืนข้อมูลที่ใช้ร่วมกันแบบกว้างเพียงรอบเดียว ให้เลือก `openclaw memory search` เมื่อ Plugin หน่วยความจำที่ใช้งานอยู่เปิดให้ใช้การค้นหาร่วมกัน

โหมดการค้นหา:

- `find-person`: นามแฝง แฮนเดิล บัญชีโซเชียล รหัสมาตรฐาน และหน้าบุคคล
- `route-question`: คำแนะนำว่าควรถามใคร/เหมาะใช้สำหรับอะไร และบริบทความสัมพันธ์
- `source-evidence`: หน้าต้นฉบับและฟิลด์หลักฐานที่มีโครงสร้าง
- `raw-claim`: ข้อความคำกล่าวอ้างที่มีโครงสร้างพร้อมข้อมูลเมตาของคำกล่าวอ้าง/หลักฐาน

ตัวอย่าง:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

เอาต์พุตข้อความจะมีบรรทัด `Claim:` และ `Evidence:` เมื่อผลลัพธ์ตรงกับคำกล่าวอ้างที่มีโครงสร้าง เอาต์พุต JSON จะแสดง `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` และ `evidenceSourceIds` เพิ่มเติม เพื่อให้เอเจนต์เจาะดูรายละเอียดได้

### `wiki get <lookup>`

อ่านหน้า wiki ตามรหัสหรือพาธสัมพัทธ์

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

ใช้การเปลี่ยนแปลงแบบจำกัดขอบเขตโดยไม่แก้ไขหน้าอย่างอิสระ:

- `apply synthesis <title>`: สร้างหรือรีเฟรชหน้าสังเคราะห์ด้วยเนื้อหาสรุปที่มีการจัดการ
- `apply metadata <lookup>`: อัปเดตข้อมูลเมตาบนหน้าที่มีอยู่

ทั้งสองคำสั่งรับ `--source-id`, `--contradiction`, `--question` (ระบุซ้ำได้แต่ละรายการ), `--confidence <n>` (0-1) และ `--status <status>` นอกจากนี้ `apply metadata` ยังรับ `--clear-confidence` เพื่อลบค่าความเชื่อมั่นที่จัดเก็บไว้ นี่คือวิธีที่รองรับสำหรับพัฒนาหน้า wiki โดยยังคงรักษาบล็อกที่สร้างและจัดการไว้ให้สมบูรณ์

### `wiki bridge import`

นำเข้าอาร์ติแฟกต์หน่วยความจำสาธารณะจาก Plugin หน่วยความจำที่ใช้งานอยู่ไปยังหน้าต้นฉบับที่ใช้บริดจ์เป็นแบ็กเอนด์ ใช้คำสั่งนี้ในโหมด `bridge` เพื่อดึงอาร์ติแฟกต์หน่วยความจำที่ส่งออกล่าสุดเข้ามาในคลัง wiki

สำหรับการอ่านอาร์ติแฟกต์ผ่านบริดจ์ที่ใช้งานอยู่ CLI จะกำหนดเส้นทางการนำเข้าผ่าน RPC ของ Gateway เพื่อให้ใช้บริบท Plugin หน่วยความจำของรันไทม์ หากปิดใช้การนำเข้าผ่านบริดจ์หรือปิดการอ่านอาร์ติแฟกต์ คำสั่งจะยังคงทำงานแบบไม่มีการนำเข้าภายในเครื่อง/ออฟไลน์ การรีเฟรชดัชนีหลังนำเข้าถูกควบคุมโดย `ingest.autoCompile`

### `wiki unsafe-local import`

นำเข้าจากพาธภายในเครื่องที่กำหนดค่าไว้อย่างชัดเจน (`unsafeLocal.paths`) ในโหมด `unsafe-local` ฟังก์ชันนี้เป็นการทดลองโดยเจตนาและใช้ได้เฉพาะบนเครื่องเดียวกัน การรีเฟรชดัชนีหลังนำเข้าถูกควบคุมโดย `ingest.autoCompile`

### `wiki chatgpt import`

นำเข้าข้อมูลส่งออกจาก ChatGPT ไปยังหน้าต้นฉบับฉบับร่างของ wiki

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| แฟล็ก              | ค่าเริ่มต้น    | คำอธิบาย                                                   |
| ----------------- | ---------- | ------------------------------------------------------------- |
| `--export <path>` | (จำเป็น) | ไดเรกทอรีข้อมูลส่งออกของ ChatGPT หรือพาธ `conversations.json`        |
| `--dry-run`       | `false`    | ดูตัวอย่างจำนวนรายการที่สร้าง/อัปเดต/ข้ามโดยไม่เขียนหน้า |

การนำเข้าที่ไม่ใช่โหมดทดลองและเปลี่ยนแปลงหน้าใด ๆ จะบันทึกรหัสรอบการนำเข้า ซึ่งแสดงในสรุปและจำเป็นสำหรับการย้อนกลับ

### `wiki chatgpt rollback <run-id>`

ย้อนกลับรอบการนำเข้าจาก ChatGPT ที่ใช้ไปก่อนหน้านี้ โดยลบหน้าที่รอบนั้นสร้างและคืนค่าหน้าที่รอบนั้นเขียนทับ หากย้อนกลับรอบนั้นแล้ว จะไม่ดำเนินการใด ๆ (และรายงาน `alreadyRolledBack`)

### `wiki obsidian ...`

คำสั่งตัวช่วย Obsidian สำหรับคลังที่ทำงานในโหมดที่เป็นมิตรกับ Obsidian: `status`, `search`, `open`, `command`, `daily` คำสั่งเหล่านี้ต้องใช้ CLI `obsidian` อย่างเป็นทางการบน `PATH` เมื่อเปิดใช้ `obsidian.useOfficialCli`

การตรวจสอบความถูกต้องของการกำหนดค่าจะปฏิเสธ `obsidian.useOfficialCli: true` เมื่อ
`vault.scope` เป็น `agent` เนื่องจาก `obsidian.vaultName` เป็นการตั้งค่าส่วนกลางเพียงค่าเดียว
ไม่ใช่การแมปแยกตามเอเจนต์ การเรนเดอร์ Markdown ที่เป็นมิตรกับ Obsidian ยังคง
พร้อมใช้งาน

## แนวทางการใช้งานจริง

- ใช้ `wiki search` + `wiki get` เมื่อแหล่งที่มาและอัตลักษณ์ของหน้ามีความสำคัญ
- ใช้ `wiki apply` แทนการแก้ไขส่วนที่สร้างและจัดการไว้ด้วยตนเอง
- ใช้ `wiki lint` ก่อนเชื่อถือเนื้อหาที่ขัดแย้งกันหรือมีความเชื่อมั่นต่ำ
- ใช้ `wiki compile` หลังจากนำเข้าจำนวนมากหรือเปลี่ยนแปลงต้นฉบับ เมื่อต้องการแดชบอร์ดและไดเจสต์ที่คอมไพล์แล้วซึ่งเป็นข้อมูลล่าสุดทันที
- ใช้ `wiki okf import` เมื่อแค็ตตาล็อกข้อมูล ข้อมูลส่งออกจากเอกสาร หรือไปป์ไลน์การเสริมข้อมูลของเอเจนต์สร้างบันเดิล Markdown แบบ OKF อยู่แล้ว
- ใช้ `wiki bridge import` เมื่อโหมดบริดจ์ขึ้นอยู่กับอาร์ติแฟกต์หน่วยความจำที่เพิ่งส่งออก

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

ดูโมเดลการกำหนดค่าทั้งหมดได้ที่ [Plugin Memory Wiki](/th/plugins/memory-wiki)

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Wiki หน่วยความจำ](/th/plugins/memory-wiki)
