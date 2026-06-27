---
read_when:
    - คุณต้องการใช้ CLI ของ memory-wiki
    - คุณกำลังจัดทำเอกสารหรือเปลี่ยนแปลง `openclaw wiki`
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw wiki` (สถานะ vault ของ memory-wiki, การค้นหา, การคอมไพล์, การ lint, การปรับใช้, bridge และตัวช่วย Obsidian)
title: วิกิ
x-i18n:
    generated_at: "2026-06-27T17:24:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6679a5aad41a19dbcad6075c190c3eb533e3ba13a6d5018d56988a23b2d9023
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

ตรวจสอบและดูแลคลัง `memory-wiki`

จัดหาโดย Plugin `memory-wiki` ที่บันเดิลมาให้

ที่เกี่ยวข้อง:

- [Plugin Memory Wiki](/th/plugins/memory-wiki)
- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
- [CLI: หน่วยความจำ](/th/cli/memory)

## ใช้ทำอะไร

ใช้ `openclaw wiki` เมื่อต้องการคลังความรู้ที่คอมไพล์แล้วพร้อมด้วย:

- การค้นหาและการอ่านหน้าแบบเนทีฟของวิกิ
- การสังเคราะห์ที่มีแหล่งที่มาอย่างละเอียด
- รายงานข้อขัดแย้งและความสดใหม่
- การนำเข้าแบบ bridge จาก Plugin หน่วยความจำที่ใช้งานอยู่
- ตัวช่วย Obsidian CLI แบบไม่บังคับ

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

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## คำสั่ง

### `wiki status`

ตรวจสอบโหมดคลังปัจจุบัน สถานะสุขภาพ และความพร้อมใช้งานของ Obsidian CLI

ใช้คำสั่งนี้ก่อนเมื่อคุณไม่แน่ใจว่าคลังเริ่มต้นแล้วหรือยัง โหมด bridge
ทำงานปกติหรือไม่ หรือมีการผสานรวม Obsidian พร้อมใช้งานหรือไม่

เมื่อโหมด bridge เปิดใช้งานและถูกกำหนดค่าให้อ่านอาร์ติแฟกต์หน่วยความจำ คำสั่งนี้
จะสอบถาม Gateway ที่กำลังทำงานอยู่เพื่อให้เห็นบริบท Plugin หน่วยความจำที่ใช้งานอยู่เดียวกันกับ
หน่วยความจำของเอเจนต์/รันไทม์

### `wiki doctor`

เรียกใช้การตรวจสอบสุขภาพของวิกิและแสดงปัญหาการกำหนดค่าหรือคลัง

เมื่อโหมด bridge เปิดใช้งานและถูกกำหนดค่าให้อ่านอาร์ติแฟกต์หน่วยความจำ คำสั่งนี้
จะสอบถาม Gateway ที่กำลังทำงานอยู่ก่อนสร้างรายงาน การนำเข้า bridge ที่ปิดใช้งาน
และการกำหนดค่า bridge ที่ไม่อ่านอาร์ติแฟกต์หน่วยความจำจะยังคงเป็นแบบโลคัล/ออฟไลน์

ปัญหาทั่วไปได้แก่:

- เปิดใช้โหมด bridge โดยไม่มีอาร์ติแฟกต์หน่วยความจำสาธารณะ
- เลย์เอาต์คลังไม่ถูกต้องหรือขาดหาย
- ไม่มี Obsidian CLI ภายนอกเมื่อคาดว่าจะใช้โหมด Obsidian

### `wiki init`

สร้างเลย์เอาต์คลังวิกิและหน้าเริ่มต้น

คำสั่งนี้เริ่มต้นโครงสร้างราก รวมถึงดัชนีระดับบนสุดและไดเรกทอรีแคช

### `wiki ingest <path-or-url>`

นำเข้าเนื้อหาเข้าสู่เลเยอร์แหล่งข้อมูลของวิกิ

หมายเหตุ:

- การนำเข้า URL ถูกควบคุมโดย `ingest.allowUrlIngest`
- หน้าต้นทางที่นำเข้าจะเก็บแหล่งที่มาไว้ใน frontmatter
- auto-compile สามารถทำงานหลังนำเข้าเมื่อเปิดใช้งาน

### `wiki okf import <path>`

นำเข้าบันเดิล Open Knowledge Format ที่แตกไฟล์แล้วเข้าสู่หน้าคอนเซปต์ของวิกิ

ตัวนำเข้าจะอ่านเอกสารคอนเซปต์ `.md` ที่ไม่สงวนไว้ทุกไฟล์ในแผนผังไดเรกทอรี OKF
ต้องมีฟิลด์ `type` ที่ไม่ว่าง และถือว่าค่า OKF `type` ที่ไม่รู้จักเป็นคอนเซปต์ทั่วไป
ไฟล์ OKF ที่สงวนไว้ `index.md` และ `log.md`
จะไม่ถูกนำเข้าเป็นคอนเซปต์

หน้าที่นำเข้าจะถูกทำให้แบนภายใต้ `concepts/` เพื่อให้โฟลว์คอมไพล์
ค้นหา get digest และแดชบอร์ดของวิกิที่มีอยู่เห็นได้ทันที ID คอนเซปต์ OKF เดิม,
`type`, `resource`, `tags`, เวลา, พาธต้นทาง และ frontmatter แบบเต็ม
จะถูกเก็บไว้ใน frontmatter ของหน้า ลิงก์มาร์กดาวน์ OKF ภายใน
จะถูกเขียนใหม่ไปยังหน้าวิกิที่สร้างขึ้น ส่วนลิงก์เสียหรือภายนอกจะคงไว้ไม่เปลี่ยนแปลง

ตัวอย่าง:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

สร้างดัชนี บล็อกที่เกี่ยวข้อง แดชบอร์ด และ digest ที่คอมไพล์แล้วใหม่

คำสั่งนี้เขียนอาร์ติแฟกต์ที่เสถียรสำหรับเครื่องภายใต้:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

หากเปิดใช้ `render.createDashboards` การคอมไพล์จะรีเฟรชหน้ารายงานด้วย

### `wiki lint`

lint คลังและรายงาน:

- ปัญหาเชิงโครงสร้าง
- ช่องว่างของแหล่งที่มา
- ข้อขัดแย้ง
- คำถามที่ยังเปิดอยู่
- หน้า/คำกล่าวอ้างที่มีความเชื่อมั่นต่ำ
- หน้า/คำกล่าวอ้างที่ล้าสมัย

เรียกใช้คำสั่งนี้หลังการอัปเดตวิกิที่มีนัยสำคัญ

### `wiki search <query>`

ค้นหาเนื้อหาวิกิ

พฤติกรรมขึ้นอยู่กับการกำหนดค่า:

- `search.backend`: `shared` หรือ `local`
- `search.corpus`: `wiki`, `memory` หรือ `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` หรือ
  `raw-claim`

ใช้ `wiki search` เมื่อต้องการการจัดอันดับเฉพาะของวิกิหรือรายละเอียดแหล่งที่มา
สำหรับการเรียกคืนข้อมูลร่วมแบบกว้างหนึ่งรอบ ให้ใช้ `openclaw memory search` เมื่อ
Plugin หน่วยความจำที่ใช้งานอยู่เปิดเผยการค้นหาร่วม

โหมดค้นหาช่วยให้เอเจนต์เลือกพื้นผิวที่ถูกต้อง:

- `find-person`: alias, handle, โซเชียล, ID แคนนอนิคัล และหน้าบุคคล
- `route-question`: คำใบ้ ask-for/best-used-for และบริบทความสัมพันธ์
- `source-evidence`: หน้าต้นทางและฟิลด์หลักฐานแบบมีโครงสร้าง
- `raw-claim`: ข้อความคำกล่าวอ้างแบบมีโครงสร้างพร้อมเมทาดาทาคำกล่าวอ้าง/หลักฐาน

ตัวอย่าง:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

เอาต์พุตข้อความมีบรรทัด `Claim:` และ `Evidence:` เมื่อผลลัพธ์ตรงกับ
คำกล่าวอ้างแบบมีโครงสร้าง เอาต์พุต JSON ยังเปิดเผย `matchedClaimId`,
`matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` และ
`evidenceSourceIds` เพิ่มเติมสำหรับการเจาะลึกฝั่งเอเจนต์

### `wiki get <lookup>`

อ่านหน้าวิกิตาม ID หรือพาธสัมพัทธ์

ตัวอย่าง:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

ใช้การกลายพันธุ์แบบแคบโดยไม่ต้องผ่าตัดหน้าแบบ freeform

โฟลว์ที่รองรับได้แก่:

- สร้าง/อัปเดตหน้าการสังเคราะห์
- อัปเดตเมทาดาทาของหน้า
- แนบ ID ต้นทาง
- เพิ่มคำถาม
- เพิ่มข้อขัดแย้ง
- อัปเดตความเชื่อมั่น/สถานะ
- เขียนคำกล่าวอ้างแบบมีโครงสร้าง

คำสั่งนี้มีอยู่เพื่อให้วิกิพัฒนาได้อย่างปลอดภัยโดยไม่ต้องแก้ไข
บล็อกที่จัดการแล้วด้วยตนเอง

### `wiki bridge import`

นำเข้าอาร์ติแฟกต์หน่วยความจำสาธารณะจาก Plugin หน่วยความจำที่ใช้งานอยู่เข้าสู่
หน้าต้นทางที่หนุนด้วย bridge

ใช้คำสั่งนี้ในโหมด `bridge` เมื่อต้องการดึงอาร์ติแฟกต์หน่วยความจำที่ส่งออกล่าสุด
เข้าสู่คลังวิกิ

สำหรับการอ่านอาร์ติแฟกต์ bridge ที่ใช้งานอยู่ CLI จะกำหนดเส้นทางการนำเข้าผ่าน Gateway RPC
เพื่อให้การนำเข้าใช้บริบท Plugin หน่วยความจำของรันไทม์ หากการนำเข้า bridge
ถูกปิดใช้งานหรือการอ่านอาร์ติแฟกต์ถูกปิด คำสั่งจะคงพฤติกรรมโลคัล/ออฟไลน์
แบบไม่นำเข้าไว้

### `wiki unsafe-local import`

นำเข้าจากพาธโลคัลที่กำหนดค่าไว้อย่างชัดเจนในโหมด `unsafe-local`

สิ่งนี้ตั้งใจให้เป็นแบบทดลองและสำหรับเครื่องเดียวกันเท่านั้น

### `wiki obsidian ...`

คำสั่งตัวช่วย Obsidian สำหรับคลังที่ทำงานในโหมดที่เป็นมิตรกับ Obsidian

คำสั่งย่อย:

- `status`
- `search`
- `open`
- `command`
- `daily`

คำสั่งเหล่านี้ต้องใช้ CLI ทางการ `obsidian` บน `PATH` เมื่อ
เปิดใช้ `obsidian.useOfficialCli`

## แนวทางการใช้งานจริง

- ใช้ `wiki search` + `wiki get` เมื่อแหล่งที่มาและตัวตนของหน้ามีความสำคัญ
- ใช้ `wiki apply` แทนการแก้ไขส่วนที่สร้างและจัดการแล้วด้วยมือ
- ใช้ `wiki lint` ก่อนเชื่อถือเนื้อหาที่ขัดแย้งกันหรือมีความเชื่อมั่นต่ำ
- ใช้ `wiki compile` หลังการนำเข้าจำนวนมากหรือการเปลี่ยนแปลงต้นทาง เมื่อต้องการ
  แดชบอร์ดและ digest ที่คอมไพล์แล้วใหม่ทันที
- ใช้ `wiki okf import` เมื่อแค็ตตาล็อกข้อมูล การส่งออกเอกสาร หรือไปป์ไลน์
  เสริมข้อมูลของเอเจนต์สร้างบันเดิลมาร์กดาวน์ OKF อยู่แล้ว
- ใช้ `wiki bridge import` เมื่อโหมด bridge พึ่งพาอาร์ติแฟกต์หน่วยความจำ
  ที่เพิ่งส่งออกใหม่

## การเชื่อมโยงกับการกำหนดค่า

พฤติกรรมของ `openclaw wiki` ถูกกำหนดโดย:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

ดู [Plugin Memory Wiki](/th/plugins/memory-wiki) สำหรับโมเดลการกำหนดค่าแบบเต็ม

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [วิกิหน่วยความจำ](/th/plugins/memory-wiki)
