---
read_when:
    - คุณต้องการใช้ CLI ของ memory-wiki
    - คุณกำลังจัดทำเอกสารหรือเปลี่ยนแปลง `openclaw wiki`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw wiki` (สถานะ vault ของ memory-wiki, search, compile, lint, apply, bridge และตัวช่วย Obsidian)
title: วิกิ
x-i18n:
    generated_at: "2026-04-30T09:45:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67fe56c9bff7b24570f890733314857dd261fca8233051681a83c171656ff27d
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

ตรวจสอบและดูแล vault ของ `memory-wiki`

จัดเตรียมโดย Plugin `memory-wiki` ที่รวมมาให้

เกี่ยวข้อง:

- [Plugin Memory Wiki](/th/plugins/memory-wiki)
- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
- [CLI: memory](/th/cli/memory)

## ใช้ทำอะไร

ใช้ `openclaw wiki` เมื่อคุณต้องการ vault ความรู้ที่รวบรวมแล้วพร้อม:

- การค้นหาแบบ wiki-native และการอ่านหน้า
- synthesis ที่มี provenance ครบถ้วน
- รายงานความขัดแย้งและความสดใหม่
- การนำเข้าแบบ bridge จาก Plugin active memory
- ตัวช่วย Obsidian CLI เสริม

## คำสั่งที่ใช้บ่อย

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
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

ตรวจสอบโหมด vault ปัจจุบัน สถานะสุขภาพ และความพร้อมใช้งานของ Obsidian CLI

ใช้คำสั่งนี้ก่อนเมื่อคุณไม่แน่ใจว่า vault ถูกเริ่มต้นแล้วหรือไม่ โหมด bridge
ทำงานปกติหรือไม่ หรือมีการผสานรวม Obsidian พร้อมใช้งานหรือไม่

เมื่อโหมด bridge เปิดใช้งานและกำหนดค่าให้อ่าน artifact ของหน่วยความจำ คำสั่งนี้
จะ query Gateway ที่กำลังทำงานอยู่เพื่อให้เห็นบริบท Plugin active memory เดียวกับ
หน่วยความจำของ agent/runtime

### `wiki doctor`

รันการตรวจสุขภาพ wiki และแสดงปัญหาการกำหนดค่าหรือ vault

เมื่อโหมด bridge เปิดใช้งานและกำหนดค่าให้อ่าน artifact ของหน่วยความจำ คำสั่งนี้
จะ query Gateway ที่กำลังทำงานอยู่ก่อนสร้างรายงาน การนำเข้า bridge ที่ปิดใช้งาน
และการกำหนดค่า bridge ที่ไม่อ่าน artifact ของหน่วยความจำจะยังคงเป็นแบบ local/offline

ปัญหาทั่วไปได้แก่:

- เปิดโหมด bridge โดยไม่มี artifact หน่วยความจำสาธารณะ
- layout ของ vault ไม่ถูกต้องหรือขาดหาย
- ไม่มี Obsidian CLI ภายนอกเมื่อคาดว่าจะใช้โหมด Obsidian

### `wiki init`

สร้าง layout ของ wiki vault และหน้าเริ่มต้น

คำสั่งนี้จะเริ่มต้นโครงสร้างราก รวมถึงดัชนีระดับบนสุดและไดเรกทอรี cache

### `wiki ingest <path-or-url>`

นำเข้าเนื้อหาเข้าสู่ชั้น source ของ wiki

หมายเหตุ:

- การ ingest URL ถูกควบคุมโดย `ingest.allowUrlIngest`
- หน้า source ที่นำเข้าจะเก็บ provenance ไว้ใน frontmatter
- auto-compile สามารถรันหลัง ingest ได้เมื่อเปิดใช้งาน

### `wiki compile`

สร้างดัชนี บล็อกที่เกี่ยวข้อง dashboard และ digest ที่คอมไพล์แล้วใหม่

คำสั่งนี้จะเขียน artifact ที่มีเสถียรภาพสำหรับเครื่องไว้ใต้:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

หากเปิดใช้งาน `render.createDashboards` การ compile จะรีเฟรชหน้ารายงานด้วย

### `wiki lint`

Lint vault และรายงาน:

- ปัญหาเชิงโครงสร้าง
- ช่องว่างของ provenance
- ความขัดแย้ง
- คำถามที่ยังเปิดอยู่
- หน้า/claim ที่มีความเชื่อมั่นต่ำ
- หน้า/claim ที่ล้าสมัย

รันคำสั่งนี้หลังจากอัปเดต wiki อย่างมีนัยสำคัญ

### `wiki search <query>`

ค้นหาเนื้อหา wiki

พฤติกรรมขึ้นอยู่กับ config:

- `search.backend`: `shared` หรือ `local`
- `search.corpus`: `wiki`, `memory` หรือ `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` หรือ
  `raw-claim`

ใช้ `wiki search` เมื่อคุณต้องการการจัดอันดับหรือรายละเอียด provenance เฉพาะของ wiki
สำหรับการ recall ร่วมแบบกว้างหนึ่งรอบ ให้ใช้ `openclaw memory search` เมื่อ
Plugin active memory เปิดเผย shared search

โหมดค้นหาช่วยให้ agent เลือก surface ที่เหมาะสม:

- `find-person`: alias, handle, social, ID canonical และหน้าบุคคล
- `route-question`: hint ว่าควรถามใคร/เหมาะใช้สำหรับอะไร และบริบทความสัมพันธ์
- `source-evidence`: หน้า source และฟิลด์ evidence แบบมีโครงสร้าง
- `raw-claim`: ข้อความ claim แบบมีโครงสร้างพร้อม metadata ของ claim/evidence

ตัวอย่าง:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

เอาต์พุตแบบข้อความมีบรรทัด `Claim:` และ `Evidence:` เมื่อผลลัพธ์ตรงกับ
claim แบบมีโครงสร้าง เอาต์พุต JSON ยังเปิดเผย `matchedClaimId`,
`matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` และ
`evidenceSourceIds` สำหรับการเจาะรายละเอียดฝั่ง agent

### `wiki get <lookup>`

อ่านหน้า wiki ตาม id หรือ path สัมพัทธ์

ตัวอย่าง:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

ใช้การกลายพันธุ์แบบแคบโดยไม่ต้องผ่าตัดหน้าแบบ freeform

โฟลว์ที่รองรับได้แก่:

- สร้าง/อัปเดตหน้า synthesis
- อัปเดต metadata ของหน้า
- แนบ source id
- เพิ่มคำถาม
- เพิ่มความขัดแย้ง
- อัปเดตความเชื่อมั่น/สถานะ
- เขียน claim แบบมีโครงสร้าง

คำสั่งนี้มีอยู่เพื่อให้ wiki พัฒนาได้อย่างปลอดภัยโดยไม่ต้องแก้ไขบล็อกที่จัดการอยู่ด้วยมือ

### `wiki bridge import`

นำเข้า artifact หน่วยความจำสาธารณะจาก Plugin active memory เข้าสู่หน้า source ที่อิง bridge

ใช้คำสั่งนี้ในโหมด `bridge` เมื่อคุณต้องการดึง artifact หน่วยความจำที่ export ล่าสุด
เข้าสู่ wiki vault

สำหรับการอ่าน artifact bridge ที่ใช้งานอยู่ CLI จะ route การนำเข้าผ่าน Gateway RPC
เพื่อให้การนำเข้าใช้บริบท Plugin หน่วยความจำของ runtime หากปิดการนำเข้า bridge
หรือปิดการอ่าน artifact คำสั่งจะคงพฤติกรรม zero-import แบบ local/offline ไว้

### `wiki unsafe-local import`

นำเข้าจาก path local ที่กำหนดค่าไว้อย่างชัดเจนในโหมด `unsafe-local`

สิ่งนี้เป็นการทดลองโดยเจตนาและใช้ได้เฉพาะเครื่องเดียวกันเท่านั้น

### `wiki obsidian ...`

คำสั่งตัวช่วย Obsidian สำหรับ vault ที่ทำงานในโหมดที่เป็นมิตรกับ Obsidian

คำสั่งย่อย:

- `status`
- `search`
- `open`
- `command`
- `daily`

คำสั่งเหล่านี้ต้องใช้ CLI `obsidian` อย่างเป็นทางการบน `PATH` เมื่อเปิดใช้งาน
`obsidian.useOfficialCli`

## คำแนะนำการใช้งานจริง

- ใช้ `wiki search` + `wiki get` เมื่อ provenance และตัวตนของหน้ามีความสำคัญ
- ใช้ `wiki apply` แทนการแก้ไข section ที่สร้างและจัดการอยู่ด้วยมือ
- ใช้ `wiki lint` ก่อนเชื่อถือเนื้อหาที่ขัดแย้งกันหรือมีความเชื่อมั่นต่ำ
- ใช้ `wiki compile` หลังการนำเข้าจำนวนมากหรือการเปลี่ยนแปลง source เมื่อคุณต้องการ
  dashboard และ digest ที่คอมไพล์แล้วแบบสดใหม่ทันที
- ใช้ `wiki bridge import` เมื่อโหมด bridge ขึ้นอยู่กับ artifact หน่วยความจำที่ export ใหม่

## การเชื่อมโยงกับการกำหนดค่า

พฤติกรรมของ `openclaw wiki` ถูกกำหนดโดย:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

ดู [Plugin Memory Wiki](/th/plugins/memory-wiki) สำหรับโมเดล config ฉบับเต็ม

## ที่เกี่ยวข้อง

- [อ้างอิง CLI](/th/cli)
- [Memory wiki](/th/plugins/memory-wiki)
