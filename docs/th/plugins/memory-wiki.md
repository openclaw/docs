---
read_when:
    - คุณต้องการความรู้แบบถาวรที่เหนือกว่าโน้ต MEMORY.md ธรรมดา
    - คุณกำลังกำหนดค่า Plugin memory-wiki ที่รวมมาให้
    - คุณต้องการทำความเข้าใจ `wiki_search`, `wiki_get` หรือโหมด bridge
summary: 'memory-wiki: คลังความรู้ที่คอมไพล์แล้วพร้อมที่มา ข้ออ้าง แดชบอร์ด และโหมดบริดจ์'
title: วิกิหน่วยความจำ
x-i18n:
    generated_at: "2026-06-27T17:57:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91512fbab8bfa87d3be29a75c217f99dbae11d9d7065fcc5ae9aa2c51847ec42
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` คือ Plugin ที่รวมมา ซึ่งเปลี่ยนหน่วยความจำถาวรให้เป็นคลังความรู้ที่คอมไพล์แล้ว

มัน **ไม่ได้** แทนที่ Plugin หน่วยความจำที่ใช้งานอยู่ Plugin หน่วยความจำที่ใช้งานอยู่ยังคง
เป็นเจ้าของการเรียกคืน การโปรโมต การทำดัชนี และ Dreaming `memory-wiki` อยู่เคียงข้างมัน
และคอมไพล์ความรู้ถาวรให้เป็นวิกิที่นำทางได้ พร้อมหน้าที่กำหนดแน่นอน
ข้อกล่าวอ้างที่มีโครงสร้าง แหล่งที่มา แดชบอร์ด และไดเจสต์ที่เครื่องอ่านได้

ใช้เมื่อคุณต้องการให้หน่วยความจำทำงานเหมือนเลเยอร์ความรู้ที่ได้รับการดูแลมากขึ้น และ
เหมือนกองไฟล์ Markdown น้อยลง

## สิ่งที่เพิ่มเข้ามา

- คลังวิกิโดยเฉพาะพร้อมเลย์เอาต์หน้าที่กำหนดแน่นอน
- เมตาดาต้าข้อกล่าวอ้างและหลักฐานที่มีโครงสร้าง ไม่ใช่แค่ร้อยแก้ว
- แหล่งที่มา ความเชื่อมั่น ข้อขัดแย้ง และคำถามที่เปิดอยู่ในระดับหน้า
- ไดเจสต์ที่คอมไพล์แล้วสำหรับผู้ใช้ระดับ agent/runtime
- เครื่องมือค้นหา/ดึง/ปรับใช้/lint แบบวิกิโดยตรง
- การนำเข้า Open Knowledge Format เข้าสู่แนวคิดวิกิที่คอมไพล์แล้ว
- โหมด bridge เสริมที่นำเข้าอาร์ติแฟกต์สาธารณะจาก Plugin หน่วยความจำที่ใช้งานอยู่
- โหมดเรนเดอร์ที่เป็นมิตรกับ Obsidian และการผสานรวม CLI แบบเสริม

## วิธีที่เข้ากับหน่วยความจำ

ให้คิดถึงการแยกแบบนี้:

| เลเยอร์                                                   | เป็นเจ้าของ                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin หน่วยความจำที่ใช้งานอยู่ (`memory-core`, QMD, Honcho, ฯลฯ) | การเรียกคืน การค้นหาเชิงความหมาย การโปรโมต Dreaming runtime หน่วยความจำ                               |
| `memory-wiki`                                           | หน้าวิกิที่คอมไพล์แล้ว การสังเคราะห์ที่มีแหล่งที่มาสมบูรณ์ แดชบอร์ด การค้นหา/ดึง/ปรับใช้เฉพาะวิกิ |

ถ้า Plugin หน่วยความจำที่ใช้งานอยู่เปิดเผยอาร์ติแฟกต์การเรียกคืนแบบแชร์ OpenClaw จะค้นหา
ทั้งสองเลเยอร์ได้ในครั้งเดียวด้วย `memory_search corpus=all`

เมื่อคุณต้องการการจัดอันดับเฉพาะวิกิ แหล่งที่มา หรือการเข้าถึงหน้าโดยตรง ให้ใช้
เครื่องมือแบบวิกิโดยตรงแทน

## รูปแบบไฮบริดที่แนะนำ

ค่าเริ่มต้นที่แข็งแรงสำหรับการตั้งค่าแบบ local-first คือ:

- QMD เป็น backend หน่วยความจำที่ใช้งานอยู่สำหรับการเรียกคืนและการค้นหาเชิงความหมายแบบกว้าง
- `memory-wiki` ในโหมด `bridge` สำหรับหน้าความรู้ถาวรที่สังเคราะห์แล้ว

การแยกแบบนั้นทำงานได้ดีเพราะแต่ละเลเยอร์ยังคงมีจุดโฟกัสของตัวเอง:

- QMD ทำให้โน้ตดิบ การส่งออกเซสชัน และคอลเลกชันเพิ่มเติมค้นหาได้
- `memory-wiki` คอมไพล์เอนทิตี ข้อกล่าวอ้าง แดชบอร์ด และหน้าต้นทางที่เสถียร

กฎเชิงปฏิบัติ:

- ใช้ `memory_search` เมื่อคุณต้องการเรียกคืนแบบกว้างครั้งเดียวทั่วหน่วยความจำ
- ใช้ `wiki_search` และ `wiki_get` เมื่อคุณต้องการผลลัพธ์วิกิที่รับรู้แหล่งที่มา
- ใช้ `memory_search corpus=all` เมื่อคุณต้องการให้การค้นหาแบบแชร์ครอบคลุมทั้งสองเลเยอร์

ถ้าโหมด bridge รายงานว่าไม่มีอาร์ติแฟกต์ที่ส่งออกเลย แปลว่า Plugin หน่วยความจำที่ใช้งานอยู่
ยังไม่ได้เปิดเผยอินพุต bridge สาธารณะในตอนนี้ ให้รัน `openclaw wiki doctor` ก่อน
แล้วค่อยยืนยันว่า Plugin หน่วยความจำที่ใช้งานอยู่รองรับอาร์ติแฟกต์สาธารณะ

เมื่อโหมด bridge เปิดใช้งานอยู่และเปิด `bridge.readMemoryArtifacts`
`openclaw wiki status`, `openclaw wiki doctor` และ `openclaw wiki bridge
import` จะอ่านผ่าน Gateway ที่กำลังทำงานอยู่ วิธีนี้ทำให้การตรวจ bridge ผ่าน CLI สอดคล้อง
กับบริบท Plugin หน่วยความจำของ runtime ถ้า bridge ถูกปิดหรือปิดการอ่านอาร์ติแฟกต์
คำสั่งเหล่านั้นจะยังคงพฤติกรรมแบบ local/offline ของตัวเองไว้

## โหมดคลัง

`memory-wiki` รองรับโหมดคลังสามแบบ:

### `isolated`

คลังของตัวเอง แหล่งข้อมูลของตัวเอง ไม่มีการพึ่งพา `memory-core`

ใช้เมื่อต้องการให้วิกิเป็นแหล่งเก็บความรู้ที่คัดสรรเอง

### `bridge`

อ่านอาร์ติแฟกต์หน่วยความจำสาธารณะและอีเวนต์หน่วยความจำจาก Plugin หน่วยความจำที่ใช้งานอยู่
ผ่านขอบเขต public plugin SDK

ใช้เมื่อต้องการให้วิกิคอมไพล์และจัดระเบียบอาร์ติแฟกต์ที่ Plugin หน่วยความจำส่งออก
โดยไม่เข้าไปใน internals ส่วนตัวของ Plugin

โหมด bridge ทำดัชนีได้:

- อาร์ติแฟกต์หน่วยความจำที่ส่งออก
- รายงาน dream
- โน้ตรายวัน
- ไฟล์รากของหน่วยความจำ
- ล็อกอีเวนต์หน่วยความจำ

### `unsafe-local`

ช่องทางออกแบบ same-machine ที่ชัดเจนสำหรับพาธส่วนตัวในเครื่อง

โหมดนี้ตั้งใจให้เป็นเชิงทดลองและไม่พกพาได้ ใช้เฉพาะเมื่อคุณ
เข้าใจขอบเขตความไว้วางใจและต้องการเข้าถึงระบบไฟล์ในเครื่องโดยเฉพาะ ซึ่ง
โหมด bridge ให้ไม่ได้

## เลย์เอาต์คลัง

Plugin เริ่มต้นคลังแบบนี้:

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

เนื้อหาที่จัดการจะอยู่ภายในบล็อกที่สร้างขึ้น บล็อกโน้ตของมนุษย์จะถูกเก็บรักษาไว้

กลุ่มหน้าหลักคือ:

- `sources/` สำหรับวัตถุดิบนำเข้าและหน้าที่หนุนด้วย bridge
- `entities/` สำหรับสิ่งต่าง ๆ บุคคล ระบบ โปรเจกต์ และวัตถุที่ถาวร
- `concepts/` สำหรับไอเดีย นามธรรม รูปแบบ และนโยบาย
- `syntheses/` สำหรับสรุปที่คอมไพล์แล้วและ rollup ที่ดูแลไว้
- `reports/` สำหรับแดชบอร์ดที่สร้างขึ้น

## การนำเข้า Open Knowledge Format

`memory-wiki` สามารถนำเข้าบันเดิล Open Knowledge Format ที่แตกไฟล์แล้วด้วย:

```bash
openclaw wiki okf import ./bundles/ga4
```

นี่เป็นรูปแบบที่เหมาะที่สุดเมื่อแค็ตตาล็อกข้อมูล crawler เอกสาร หรือ
agent เสริมข้อมูลผลิต OKF อยู่แล้ว: เก็บ OKF เป็นอาร์ติแฟกต์แลกเปลี่ยนแบบพกพา
จากนั้นให้ `memory-wiki` เปลี่ยนมันเป็นหน้าแนวคิดแบบ OpenClaw-native และ
ไดเจสต์ที่คอมไพล์แล้ว

ตัวนำเข้าทำตามรูปทรง OKF v0.1:

- ไฟล์ `.md` ที่ไม่สงวนไว้เป็นเอกสารแนวคิด
- แนวคิดที่นำเข้าแต่ละรายการต้องมีฟิลด์ frontmatter `type` ที่ไม่ว่าง
- ค่า `type` ของ OKF ที่ไม่รู้จักจะถูกยอมรับ
- ไฟล์ `index.md` และ `log.md` ที่สงวนไว้จะไม่ถูกนำเข้าเป็นแนวคิด
- ลิงก์ markdown ที่เสียหรือเป็นภายนอกจะถูกเก็บรักษาไว้

หน้าแนวคิดที่นำเข้าจะถูก flatten ไว้ใต้ `concepts/` เพื่อให้เส้นทาง compile,
search, get, dashboard และ prompt-digest ที่มีอยู่เห็นได้โดยไม่ต้องเพิ่ม
ต้นไม้วิกิที่สอง แต่ละหน้าจะเก็บ ID แนวคิด OKF เดิม พาธต้นทาง `type`,
`resource`, `tags`, timestamp และ frontmatter จาก producer ทั้งหมด ลิงก์ OKF ภายใน
จะถูกเขียนใหม่ไปยังหน้าแนวคิดวิกิที่สร้างขึ้น และยังถูกปล่อยออกมาเป็นรายการ
`relationships` แบบมีโครงสร้างพร้อม `kind: okf-link`

## ข้อกล่าวอ้างและหลักฐานแบบมีโครงสร้าง

หน้าสามารถมี frontmatter `claims` แบบมีโครงสร้าง ไม่ใช่แค่ข้อความอิสระ

แต่ละข้อกล่าวอ้างมีได้:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

รายการหลักฐานมีได้:

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

นี่คือสิ่งที่ทำให้วิกิทำตัวเหมือนเลเยอร์ความเชื่อมากกว่ากองโน้ตแบบนิ่ง
ข้อกล่าวอ้างสามารถถูกติดตาม ให้คะแนน โต้แย้ง และโยงกลับไปยังแหล่งข้อมูลได้

## เมตาดาต้าเอนทิตีสำหรับ agent

หน้าเอนทิตียังสามารถมีเมตาดาต้า routing สำหรับใช้งานโดย agent ได้ด้วย นี่เป็น
frontmatter ทั่วไป จึงใช้ได้กับบุคคล ทีม ระบบ โปรเจกต์ หรือ
เอนทิตีประเภทอื่นใด

ฟิลด์ทั่วไปประกอบด้วย:

- `entityType`: เช่น `person`, `team`, `system` หรือ `project`
- `canonicalId`: คีย์ตัวตนที่เสถียรซึ่งใช้ข้าม alias และการนำเข้า
- `aliases`: ชื่อ handle หรือ label ที่ควร resolve ไปยังหน้าเดียวกัน
- `privacyTier`: `public`, `local-private`, `sensitive` หรือ `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: คำใบ้ routing แบบกระชับ
- `lastRefreshedAt`: timestamp การรีเฟรชแหล่งข้อมูลที่แยกจากเวลาแก้ไขหน้า
- `personCard`: การ์ด routing เฉพาะบุคคลแบบเสริม พร้อม handles, socials,
  emails, timezone, lane, ask-for, avoid-asking-for, confidence และ privacy
- `relationships`: edge แบบมีชนิดไปยังหน้าที่เกี่ยวข้อง พร้อม target, kind, weight,
  confidence, evidence kind, privacy tier และ note

สำหรับวิกิบุคคล โดยปกติ agent ควรเริ่มที่
`reports/person-agent-directory.md` จากนั้นเปิดหน้าบุคคลด้วย `wiki_get`
ก่อนใช้รายละเอียดการติดต่อหรือข้อเท็จจริงที่อนุมานมา

ตัวอย่าง:

```yaml
pageType: entity
entityType: person
id: entity.brad-groux
canonicalId: maintainer.brad-groux
aliases:
  - Brad
  - bgroux
privacyTier: local-private
bestUsedFor:
  - Microsoft Teams and Azure routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@bgroux"
  socials:
    - "https://x.example/bgroux"
  emails:
    - brad@example.com
  timezone: America/Chicago
  lane: Microsoft ecosystem
  askFor:
    - Teams rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.alice
    targetTitle: Alice
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.brad.teams
    text: Brad is useful for Microsoft Teams routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```

## pipeline การคอมไพล์

ขั้นตอนการคอมไพล์อ่านหน้าวิกิ normalize สรุป และปล่อยอาร์ติแฟกต์
สำหรับเครื่องที่เสถียรไว้ใต้:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

ไดเจสต์เหล่านี้มีไว้เพื่อให้ agents และโค้ด runtime ไม่ต้อง scrape หน้า Markdown

เอาต์พุตที่คอมไพล์แล้วยังขับเคลื่อน:

- การทำดัชนีวิกิรอบแรกสำหรับ flow การค้นหา/ดึง
- การ lookup claim-id กลับไปยังหน้าที่เป็นเจ้าของ
- ส่วนเสริม prompt แบบกระชับ
- การสร้างรายงาน/แดชบอร์ด

## แดชบอร์ดและรายงานสุขภาพ

เมื่อเปิดใช้งาน `render.createDashboards` การคอมไพล์จะดูแลแดชบอร์ดไว้ใต้
`reports/`

รายงานในตัวประกอบด้วย:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`
- `reports/person-agent-directory.md`
- `reports/relationship-graph.md`
- `reports/provenance-coverage.md`
- `reports/privacy-review.md`

รายงานเหล่านี้ติดตามสิ่งต่าง ๆ เช่น:

- คลัสเตอร์โน้ตข้อขัดแย้ง
- คลัสเตอร์ข้อกล่าวอ้างที่แข่งขันกัน
- ข้อกล่าวอ้างที่ไม่มีหลักฐานแบบมีโครงสร้าง
- หน้าและข้อกล่าวอ้างที่มีความเชื่อมั่นต่ำ
- ความสดใหม่ที่ล้าสมัยหรือไม่ทราบ
- หน้าที่มีคำถามยังไม่ resolved
- การ์ด routing ของบุคคล/เอนทิตี
- edge ความสัมพันธ์แบบมีโครงสร้าง
- ความครอบคลุมของชั้นหลักฐาน
- privacy tier ที่ไม่เป็นสาธารณะซึ่งต้องตรวจทานก่อนใช้

## การค้นหาและการดึงข้อมูล

`memory-wiki` รองรับ backend การค้นหาสองแบบ:

- `shared`: ใช้ flow การค้นหาหน่วยความจำแบบแชร์เมื่อมี
- `local`: ค้นหาวิกิในเครื่อง

ยังรองรับ corpora สามแบบด้วย:

- `wiki`
- `memory`
- `all`

พฤติกรรมสำคัญ:

- `wiki_search` และ `wiki_get` ใช้ไดเจสต์ที่คอมไพล์แล้วเป็นรอบแรกเมื่อทำได้
- claim ids สามารถ resolve กลับไปยังหน้าที่เป็นเจ้าของได้
- ข้อกล่าวอ้างที่ถูกโต้แย้ง/ล้าสมัย/สดใหม่มีผลต่อการจัดอันดับ
- label แหล่งที่มาสามารถอยู่รอดไปถึงผลลัพธ์ได้
- โหมดค้นหาสามารถ bias การจัดอันดับสำหรับการค้นหาบุคคล routing คำถาม หลักฐาน
  จากแหล่งข้อมูล หรือข้อกล่าวอ้างดิบ

กฎเชิงปฏิบัติ:

- ใช้ `memory_search corpus=all` สำหรับการเรียกคืนแบบกว้างครั้งเดียว
- ใช้ `wiki_search` + `wiki_get` เมื่อคุณให้ความสำคัญกับการจัดอันดับเฉพาะวิกิ
  แหล่งที่มา หรือโครงสร้างความเชื่อระดับหน้า

โหมดค้นหา:

- `auto`: ค่าเริ่มต้นแบบสมดุล
- `find-person`: boost เอนทิตีที่เหมือนบุคคล alias, handle, social และ
  canonical ID
- `route-question`: boost การ์ด agent, คำใบ้ ask-for, คำใบ้ best-used-for และ
  บริบทความสัมพันธ์
- `source-evidence`: boost หน้าต้นทางและเมตาดาต้าหลักฐานแบบมีโครงสร้าง
- `raw-claim`: boost ข้อกล่าวอ้างแบบมีโครงสร้างที่ตรงกัน และส่งคืนเมตาดาต้า
  claim/evidence ในผลลัพธ์

เมื่อผลลัพธ์ตรงกับข้อกล่าวอ้างแบบมีโครงสร้าง `wiki_search` สามารถส่งคืน
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` และ `evidenceSourceIds` ใน payload รายละเอียดได้ เอาต์พุตข้อความ
ยังรวมบรรทัด `Claim:` และ `Evidence:` แบบกระชับเมื่อมี

## เครื่องมือสำหรับ agent

Plugin ลงทะเบียนเครื่องมือเหล่านี้:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

สิ่งที่เครื่องมือทำ:

- `wiki_status`: โหมดคลังปัจจุบัน สุขภาพ ความพร้อมใช้งานของ Obsidian CLI
- `wiki_search`: ค้นหาหน้าวิกิ และเมื่อกำหนดค่าไว้ ค้นหา corpora หน่วยความจำแบบแชร์;
  รับ `mode` สำหรับการค้นหาบุคคล routing คำถาม หลักฐานจากแหล่งข้อมูล หรือการ drilldown
  ข้อกล่าวอ้างดิบ
- `wiki_get`: อ่านหน้าวิกิตาม id/path หรือ fallback ไปยัง corpus หน่วยความจำแบบแชร์
- `wiki_apply`: การกลายพันธุ์ synthesis/metadata แบบแคบโดยไม่ผ่าตัดหน้าแบบ freeform
- `wiki_lint`: การตรวจโครงสร้าง ช่องว่างแหล่งที่มา ข้อขัดแย้ง คำถามที่เปิดอยู่

Plugin ยังลงทะเบียนส่วนเสริมคลังข้อมูลหน่วยความจำแบบไม่ผูกขาดด้วย ดังนั้น
`memory_search` และ `memory_get` ที่ใช้ร่วมกันจึงเข้าถึง wiki ได้เมื่อ Plugin หน่วยความจำที่ใช้งานอยู่
รองรับการเลือกคลังข้อมูล

## พฤติกรรมของพรอมป์และบริบท

เมื่อเปิดใช้ `context.includeCompiledDigestPrompt` ส่วนพรอมป์หน่วยความจำ
จะเพิ่มสแนปช็อตที่คอมไพล์แล้วแบบกระชับจาก `agent-digest.json`

สแนปช็อตนั้นตั้งใจให้มีขนาดเล็กและมีสัญญาณสำคัญสูง:

- เฉพาะหน้าสำคัญที่สุด
- เฉพาะข้อกล่าวอ้างสำคัญที่สุด
- จำนวนข้อขัดแย้ง
- จำนวนคำถาม
- ตัวระบุคุณภาพด้านความมั่นใจ/ความสดใหม่

ตัวเลือกนี้เป็นแบบ opt-in เพราะมันเปลี่ยนรูปทรงพรอมป์ และมีประโยชน์เป็นหลักสำหรับเอนจินบริบท
หรือการประกอบพรอมป์แบบเดิมที่ใช้ส่วนเสริมหน่วยความจำอย่างชัดเจน

## การกำหนดค่า

ใส่การกำหนดค่าไว้ใต้ `plugins.entries.memory-wiki.config`:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

สวิตช์สำคัญ:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` หรือ `obsidian`
- `bridge.readMemoryArtifacts`: นำเข้าอาร์ติแฟกต์สาธารณะของ Plugin หน่วยความจำที่ใช้งานอยู่
- `bridge.followMemoryEvents`: รวมบันทึกเหตุการณ์ในโหมด bridge
- `search.backend`: `shared` หรือ `local`
- `search.corpus`: `wiki`, `memory`, หรือ `all`
- `context.includeCompiledDigestPrompt`: เพิ่มสแนปช็อต digest แบบกระชับต่อท้ายส่วนพรอมป์หน่วยความจำ
- `render.createBacklinks`: สร้างบล็อกที่เกี่ยวข้องแบบกำหนดได้ซ้ำเสมอ
- `render.createDashboards`: สร้างหน้าแดชบอร์ด

### ตัวอย่าง: โหมด QMD + bridge

ใช้ตัวเลือกนี้เมื่อคุณต้องการ QMD สำหรับการเรียกคืน และ `memory-wiki` สำหรับชั้นความรู้
ที่ดูแลรักษาไว้:

```json5
{
  memory: {
    backend: "qmd",
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

สิ่งนี้จะคงไว้:

- QMD รับผิดชอบการเรียกคืน Active Memory
- `memory-wiki` มุ่งเน้นหน้าที่คอมไพล์แล้วและแดชบอร์ด
- รูปทรงพรอมป์ไม่เปลี่ยนแปลงจนกว่าคุณจะเปิดใช้พรอมป์ digest ที่คอมไพล์แล้วโดยตั้งใจ

## CLI

`memory-wiki` ยังเปิดเผยพื้นผิว CLI ระดับบนสุดด้วย:

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

ดูข้อมูลอ้างอิงคำสั่งฉบับเต็มได้ที่ [CLI: wiki](/th/cli/wiki)

## การรองรับ Obsidian

เมื่อ `vault.renderMode` เป็น `obsidian` Plugin จะเขียน Markdown
ที่เป็นมิตรกับ Obsidian และสามารถเลือกใช้ CLI ทางการ `obsidian` ได้

เวิร์กโฟลว์ที่รองรับประกอบด้วย:

- การตรวจสอบสถานะ
- การค้นหา vault
- การเปิดหน้า
- การเรียกใช้คำสั่ง Obsidian
- การข้ามไปยังโน้ตประจำวัน

ส่วนนี้เป็นทางเลือก wiki ยังคงทำงานในโหมด native ได้โดยไม่มี Obsidian

## เวิร์กโฟลว์ที่แนะนำ

1. เก็บ Plugin หน่วยความจำที่ใช้งานอยู่ของคุณไว้สำหรับการเรียกคืน/การเลื่อนระดับ/Dreaming
2. เปิดใช้ `memory-wiki`
3. เริ่มด้วยโหมด `isolated` เว้นแต่คุณต้องการโหมด bridge อย่างชัดเจน
4. ใช้ `wiki_search` / `wiki_get` เมื่อแหล่งที่มามีความสำคัญ
5. ใช้ `wiki_apply` สำหรับการสังเคราะห์แบบแคบหรือการอัปเดตเมทาดาทา
6. รัน `wiki_lint` หลังจากมีการเปลี่ยนแปลงสำคัญ
7. เปิดแดชบอร์ดหากคุณต้องการมองเห็นความล้าสมัย/ข้อขัดแย้ง

## เอกสารที่เกี่ยวข้อง

- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
- [CLI: memory](/th/cli/memory)
- [CLI: wiki](/th/cli/wiki)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
