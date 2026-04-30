---
read_when:
    - คุณต้องการความรู้ที่คงอยู่ถาวรมากกว่าบันทึก MEMORY.md แบบธรรมดา
    - คุณกำลังกำหนดค่า Plugin memory-wiki ที่รวมมาให้
    - คุณต้องการทำความเข้าใจ wiki_search, wiki_get หรือโหมดบริดจ์
summary: 'memory-wiki: คลังความรู้ที่รวบรวมแล้วพร้อมที่มา ข้อกล่าวอ้าง แดชบอร์ด และโหมดบริดจ์'
title: วิกิความจำ
x-i18n:
    generated_at: "2026-04-30T10:06:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 744d569f8b0c9b668ea54dc057f808544359eaae87d5557de2e6acd1b31acd89
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` เป็น Plugin ที่มาพร้อมชุด OpenClaw ซึ่งเปลี่ยนหน่วยความจำถาวรให้เป็นคลังความรู้ที่คอมไพล์แล้ว

มัน **ไม่** แทนที่ Plugin Active Memory Plugin Active Memory ยังคง
รับผิดชอบการเรียกคืน การโปรโมต การทำดัชนี และ Dreaming อยู่ `memory-wiki` ทำงานอยู่ข้าง ๆ
และคอมไพล์ความรู้ถาวรให้เป็นวิกิที่นำทางได้ พร้อมหน้าที่กำหนดแน่นอน
ข้อกล่าวอ้างแบบมีโครงสร้าง แหล่งที่มา แดชบอร์ด และไดเจสต์ที่เครื่องอ่านได้

ใช้มันเมื่อคุณต้องการให้หน่วยความจำทำงานคล้ายเลเยอร์ความรู้ที่ได้รับการดูแล
มากกว่ากองไฟล์ Markdown

## สิ่งที่เพิ่มเข้ามา

- คลังวิกิเฉพาะพร้อมเลย์เอาต์หน้าที่กำหนดแน่นอน
- เมทาดาทาข้อกล่าวอ้างและหลักฐานแบบมีโครงสร้าง ไม่ใช่แค่ข้อความร้อยแก้ว
- แหล่งที่มา ความมั่นใจ ข้อขัดแย้ง และคำถามเปิดในระดับหน้า
- ไดเจสต์ที่คอมไพล์แล้วสำหรับผู้บริโภคฝั่งเอเจนต์/รันไทม์
- เครื่องมือค้นหา/ดึงข้อมูล/นำไปใช้/ตรวจสอบของวิกิโดยตรง
- โหมดบริดจ์เสริมที่นำเข้าอาร์ติแฟกต์สาธารณะจาก Plugin Active Memory
- โหมดเรนเดอร์ที่เป็นมิตรกับ Obsidian และการผสานรวม CLI แบบเสริม

## ความสัมพันธ์กับหน่วยความจำ

ให้คิดถึงการแบ่งหน้าที่แบบนี้:

| เลเยอร์                                                   | รับผิดชอบ                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin Active Memory (`memory-core`, QMD, Honcho ฯลฯ) | การเรียกคืน การค้นหาเชิงความหมาย การโปรโมต Dreaming รันไทม์หน่วยความจำ                               |
| `memory-wiki`                                           | หน้าวิกิที่คอมไพล์แล้ว การสังเคราะห์ที่อุดมด้วยแหล่งที่มา แดชบอร์ด การค้นหา/ดึงข้อมูล/นำไปใช้เฉพาะวิกิ |

หาก Plugin Active Memory เปิดเผยอาร์ติแฟกต์การเรียกคืนที่ใช้ร่วมกัน OpenClaw จะค้นหา
ทั้งสองเลเยอร์ได้ในรอบเดียวด้วย `memory_search corpus=all`

เมื่อคุณต้องการการจัดอันดับเฉพาะวิกิ แหล่งที่มา หรือการเข้าถึงหน้าโดยตรง ให้ใช้
เครื่องมือของวิกิโดยตรงแทน

## รูปแบบไฮบริดที่แนะนำ

ค่าเริ่มต้นที่แข็งแรงสำหรับการตั้งค่าแบบ local-first คือ:

- QMD เป็นแบ็กเอนด์ Active Memory สำหรับการเรียกคืนและการค้นหาเชิงความหมายแบบกว้าง
- `memory-wiki` ในโหมด `bridge` สำหรับหน้าความรู้ถาวรที่สังเคราะห์แล้ว

การแบ่งแบบนั้นทำงานได้ดีเพราะแต่ละเลเยอร์ยังคงมีจุดโฟกัสของตัวเอง:

- QMD ทำให้โน้ตดิบ การส่งออกเซสชัน และคอลเลกชันเพิ่มเติมค้นหาได้
- `memory-wiki` คอมไพล์เอนทิตี ข้อกล่าวอ้าง แดชบอร์ด และหน้าต้นทางที่เสถียร

กฎใช้งานจริง:

- ใช้ `memory_search` เมื่อคุณต้องการการเรียกคืนแบบกว้างครั้งเดียวทั่วหน่วยความจำ
- ใช้ `wiki_search` และ `wiki_get` เมื่อคุณต้องการผลลัพธ์วิกิที่รับรู้แหล่งที่มา
- ใช้ `memory_search corpus=all` เมื่อคุณต้องการให้การค้นหาที่ใช้ร่วมกันครอบคลุมทั้งสองเลเยอร์

หากโหมดบริดจ์รายงานว่าอาร์ติแฟกต์ที่ส่งออกเป็นศูนย์ แปลว่า Plugin Active Memory
ยังไม่ได้เปิดเผยอินพุตบริดจ์สาธารณะในขณะนี้ ให้รัน `openclaw wiki doctor` ก่อน
แล้วจึงยืนยันว่า Plugin Active Memory รองรับอาร์ติแฟกต์สาธารณะ

เมื่อโหมดบริดจ์ทำงานอยู่และเปิดใช้งาน `bridge.readMemoryArtifacts`
`openclaw wiki status`, `openclaw wiki doctor`, และ `openclaw wiki bridge
import` จะอ่านผ่าน Gateway ที่กำลังทำงานอยู่ ซึ่งทำให้การตรวจบริดจ์ของ CLI สอดคล้อง
กับบริบทของ Plugin หน่วยความจำในรันไทม์ หากปิดบริดจ์หรือปิดการอ่านอาร์ติแฟกต์
คำสั่งเหล่านั้นจะยังคงพฤติกรรมแบบโลคัล/ออฟไลน์ไว้

## โหมดคลัง

`memory-wiki` รองรับโหมดคลังสามแบบ:

### `isolated`

คลังของตัวเอง แหล่งข้อมูลของตัวเอง ไม่มีการพึ่งพา `memory-core`

ใช้โหมดนี้เมื่อคุณต้องการให้วิกิเป็นคลังความรู้ที่คัดสรรเอง

### `bridge`

อ่านอาร์ติแฟกต์หน่วยความจำสาธารณะและเหตุการณ์หน่วยความจำจาก Plugin Active Memory
ผ่านส่วนเชื่อมต่อ Plugin SDK สาธารณะ

ใช้โหมดนี้เมื่อคุณต้องการให้วิกิคอมไพล์และจัดระเบียบอาร์ติแฟกต์ที่ Plugin หน่วยความจำ
ส่งออก โดยไม่เข้าถึงภายในส่วน Plugin ที่เป็นส่วนตัว

โหมดบริดจ์สามารถทำดัชนี:

- อาร์ติแฟกต์หน่วยความจำที่ส่งออก
- รายงานความฝัน
- โน้ตรายวัน
- ไฟล์รากของหน่วยความจำ
- บันทึกเหตุการณ์หน่วยความจำ

### `unsafe-local`

ช่องทางหลุดออกอย่างชัดเจนสำหรับพาธส่วนตัวบนเครื่องเดียวกัน

โหมดนี้ตั้งใจให้เป็นแบบทดลองและไม่สามารถพกพาได้ ใช้เฉพาะเมื่อคุณ
เข้าใจขอบเขตความเชื่อถือและต้องการการเข้าถึงระบบไฟล์โลคัลที่
โหมดบริดจ์ให้ไม่ได้โดยเฉพาะ

## เลย์เอาต์คลัง

Plugin จะเริ่มต้นคลังแบบนี้:

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

เนื้อหาที่จัดการแล้วจะอยู่ภายในบล็อกที่สร้างขึ้น บล็อกโน้ตของมนุษย์จะถูกเก็บรักษาไว้

กลุ่มหน้าหลักคือ:

- `sources/` สำหรับวัตถุดิบนำเข้าและหน้าที่มีบริดจ์หนุนหลัง
- `entities/` สำหรับสิ่งที่คงทน บุคคล ระบบ โปรเจกต์ และวัตถุ
- `concepts/` สำหรับแนวคิด นามธรรม รูปแบบ และนโยบาย
- `syntheses/` สำหรับสรุปที่คอมไพล์แล้วและรายงานรวบยอดที่ดูแลไว้
- `reports/` สำหรับแดชบอร์ดที่สร้างขึ้น

## ข้อกล่าวอ้างและหลักฐานแบบมีโครงสร้าง

หน้าสามารถมี frontmatter `claims` แบบมีโครงสร้างได้ ไม่ใช่แค่ข้อความรูปแบบอิสระ

ข้อกล่าวอ้างแต่ละรายการสามารถรวม:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

รายการหลักฐานสามารถรวม:

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

นี่คือสิ่งที่ทำให้วิกิทำหน้าที่คล้ายเลเยอร์ความเชื่อมากกว่าที่ทิ้งโน้ตแบบนิ่ง ๆ
ข้อกล่าวอ้างสามารถติดตาม ให้คะแนน โต้แย้ง และย้อนกลับไปยังแหล่งที่มาได้

## เมทาดาทาเอนทิตีสำหรับเอเจนต์

หน้าเอนทิตียังสามารถมีเมทาดาทาการกำหนดเส้นทางสำหรับให้เอเจนต์ใช้ได้ด้วย นี่เป็น
frontmatter ทั่วไป จึงใช้ได้กับบุคคล ทีม ระบบ โปรเจกต์ หรือเอนทิตีชนิดอื่นใด

ฟิลด์ทั่วไปได้แก่:

- `entityType`: ตัวอย่างเช่น `person`, `team`, `system`, หรือ `project`
- `canonicalId`: คีย์ตัวตนที่เสถียรซึ่งใช้ข้ามนามแฝงและการนำเข้า
- `aliases`: ชื่อ แฮนเดิล หรือป้ายกำกับที่ควรชี้ไปยังหน้าเดียวกัน
- `privacyTier`: `public`, `local-private`, `sensitive`, หรือ `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: คำใบ้การกำหนดเส้นทางแบบกะทัดรัด
- `lastRefreshedAt`: เวลาประทับการรีเฟรชแหล่งข้อมูลที่แยกจากเวลาแก้ไขหน้า
- `personCard`: การ์ดกำหนดเส้นทางเฉพาะบุคคลแบบเสริม พร้อมแฮนเดิล โซเชียล
  อีเมล เขตเวลา เลน สิ่งที่ควรถาม สิ่งที่ควรหลีกเลี่ยงการถาม ความมั่นใจ และความเป็นส่วนตัว
- `relationships`: ขอบแบบมีชนิดไปยังหน้าที่เกี่ยวข้อง พร้อมเป้าหมาย ชนิด น้ำหนัก
  ความมั่นใจ ชนิดหลักฐาน ระดับความเป็นส่วนตัว และโน้ต

สำหรับวิกิบุคคล โดยปกติเอเจนต์ควรเริ่มจาก
`reports/person-agent-directory.md` แล้วเปิดหน้าบุคคลด้วย `wiki_get`
ก่อนใช้รายละเอียดติดต่อหรือข้อเท็จจริงที่อนุมาน

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

## ไปป์ไลน์การคอมไพล์

ขั้นตอนคอมไพล์จะอ่านหน้าวิกิ ทำให้สรุปอยู่ในรูปแบบปกติ และปล่อยอาร์ติแฟกต์
สำหรับเครื่องที่เสถียรไว้ภายใต้:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

ไดเจสต์เหล่านี้มีอยู่เพื่อให้เอเจนต์และโค้ดรันไทม์ไม่ต้องสแกนหน้า Markdown

เอาต์พุตที่คอมไพล์แล้วยังขับเคลื่อน:

- การทำดัชนีวิกิรอบแรกสำหรับโฟลว์ค้นหา/ดึงข้อมูล
- การค้นหา claim-id ย้อนกลับไปยังหน้าที่เป็นเจ้าของ
- ส่วนเสริมพรอมป์แบบกะทัดรัด
- การสร้างรายงาน/แดชบอร์ด

## แดชบอร์ดและรายงานสุขภาพ

เมื่อเปิดใช้งาน `render.createDashboards` การคอมไพล์จะดูแลแดชบอร์ดภายใต้
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

- กลุ่มโน้ตข้อขัดแย้ง
- กลุ่มข้อกล่าวอ้างที่แข่งขันกัน
- ข้อกล่าวอ้างที่ขาดหลักฐานแบบมีโครงสร้าง
- หน้าและข้อกล่าวอ้างที่มีความมั่นใจต่ำ
- ความสดใหม่ที่เก่าหรือไม่ทราบ
- หน้าที่มีคำถามที่ยังไม่คลี่คลาย
- การ์ดกำหนดเส้นทางบุคคล/เอนทิตี
- ขอบความสัมพันธ์แบบมีโครงสร้าง
- ความครอบคลุมของคลาสหลักฐาน
- ระดับความเป็นส่วนตัวที่ไม่ใช่สาธารณะซึ่งต้องตรวจทานก่อนใช้

## การค้นหาและการดึงข้อมูล

`memory-wiki` รองรับแบ็กเอนด์การค้นหาสองแบบ:

- `shared`: ใช้โฟลว์ค้นหาหน่วยความจำที่ใช้ร่วมกันเมื่อพร้อมใช้งาน
- `local`: ค้นหาวิกิแบบโลคัล

มันยังรองรับคลังข้อมูลสามแบบ:

- `wiki`
- `memory`
- `all`

พฤติกรรมสำคัญ:

- `wiki_search` และ `wiki_get` ใช้ไดเจสต์ที่คอมไพล์แล้วเป็นรอบแรกเมื่อเป็นไปได้
- id ของข้อกล่าวอ้างสามารถชี้กลับไปยังหน้าที่เป็นเจ้าของได้
- ข้อกล่าวอ้างที่ถูกโต้แย้ง/เก่า/สดใหม่มีผลต่อการจัดอันดับ
- ป้ายแหล่งที่มาสามารถคงอยู่ในผลลัพธ์
- โหมดค้นหาสามารถเอนการจัดอันดับไปทางการค้นหาบุคคล การกำหนดเส้นทางคำถาม
  หลักฐานจากแหล่งที่มา หรือข้อกล่าวอ้างดิบ

กฎใช้งานจริง:

- ใช้ `memory_search corpus=all` สำหรับการเรียกคืนแบบกว้างครั้งเดียว
- ใช้ `wiki_search` + `wiki_get` เมื่อคุณสนใจการจัดอันดับเฉพาะวิกิ
  แหล่งที่มา หรือโครงสร้างความเชื่อระดับหน้า

โหมดค้นหา:

- `auto`: ค่าเริ่มต้นที่สมดุล
- `find-person`: เพิ่มน้ำหนักเอนทิตีที่คล้ายบุคคล นามแฝง แฮนเดิล โซเชียล และ
  ID แบบ canonical
- `route-question`: เพิ่มน้ำหนักการ์ดเอเจนต์ คำใบ้สิ่งที่ควรถาม คำใบ้สิ่งที่เหมาะจะใช้ และ
  บริบทความสัมพันธ์
- `source-evidence`: เพิ่มน้ำหนักหน้าต้นทางและเมทาดาทาหลักฐานแบบมีโครงสร้าง
- `raw-claim`: เพิ่มน้ำหนักข้อกล่าวอ้างแบบมีโครงสร้างที่ตรงกัน และคืนเมทาดาทา
  ข้อกล่าวอ้าง/หลักฐานในผลลัพธ์

เมื่อผลลัพธ์ตรงกับข้อกล่าวอ้างแบบมีโครงสร้าง `wiki_search` สามารถคืน
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds`, และ `evidenceSourceIds` ในเพย์โหลดรายละเอียดได้ เอาต์พุตข้อความ
ยังมีบรรทัด `Claim:` และ `Evidence:` แบบกะทัดรัดเมื่อพร้อมใช้งาน

## เครื่องมือเอเจนต์

Plugin ลงทะเบียนเครื่องมือเหล่านี้:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

สิ่งที่ทำ:

- `wiki_status`: โหมดคลังปัจจุบัน สุขภาพ ความพร้อมใช้งานของ CLI Obsidian
- `wiki_search`: ค้นหาหน้าวิกิ และเมื่อกำหนดค่าไว้ ค้นหาคลังหน่วยความจำที่ใช้ร่วมกัน;
  รับ `mode` สำหรับการค้นหาบุคคล การกำหนดเส้นทางคำถาม หลักฐานจากแหล่งที่มา หรือการเจาะลึก
  ข้อกล่าวอ้างดิบ
- `wiki_get`: อ่านหน้าวิกิตาม id/path หรือถอยกลับไปใช้คลังหน่วยความจำที่ใช้ร่วมกัน
- `wiki_apply`: การกลายพันธุ์ด้านการสังเคราะห์/เมทาดาทาแบบแคบ โดยไม่ผ่าตัดหน้าแบบรูปแบบอิสระ
- `wiki_lint`: การตรวจโครงสร้าง ช่องว่างแหล่งที่มา ข้อขัดแย้ง คำถามเปิด

Plugin ยังลงทะเบียนส่วนเสริมคลังหน่วยความจำแบบไม่ผูกขาด ดังนั้น
`memory_search` และ `memory_get` ที่ใช้ร่วมกันจึงเข้าถึงวิกิได้เมื่อ Plugin Active Memory
รองรับการเลือกคลังข้อมูล

## พฤติกรรมพรอมป์และบริบท

เมื่อเปิดใช้งาน `context.includeCompiledDigestPrompt` ส่วนพรอมป์หน่วยความจำ
จะต่อท้ายสแนปชอตที่คอมไพล์แบบกะทัดรัดจาก `agent-digest.json`

สแนปชอตนั้นตั้งใจให้เล็กและมีสัญญาณสูง:

- เฉพาะหน้าสำคัญอันดับต้น ๆ
- เฉพาะข้อกล่าวอ้างสำคัญอันดับต้น ๆ
- จำนวนข้อขัดแย้ง
- จำนวนคำถาม
- ตัวกำหนดคุณสมบัติความมั่นใจ/ความสดใหม่

นี่เป็นแบบเลือกเปิด เพราะมันเปลี่ยนรูปทรงพรอมป์และมีประโยชน์หลักสำหรับเอนจินบริบท
หรือการประกอบพรอมป์แบบเดิมที่บริโภคส่วนเสริมหน่วยความจำอย่างชัดเจน

## การกำหนดค่า

ใส่การกำหนดค่าไว้ภายใต้ `plugins.entries.memory-wiki.config`:

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

ตัวสลับสำคัญ:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` หรือ `obsidian`
- `bridge.readMemoryArtifacts`: นำเข้าอาร์ติแฟกต์สาธารณะของ Plugin Active Memory
- `bridge.followMemoryEvents`: รวมบันทึกเหตุการณ์ในโหมด bridge
- `search.backend`: `shared` หรือ `local`
- `search.corpus`: `wiki`, `memory`, หรือ `all`
- `context.includeCompiledDigestPrompt`: ผนวกสแนปช็อตไดเจสต์แบบย่อเข้ากับส่วนพรอมต์หน่วยความจำ
- `render.createBacklinks`: สร้างบล็อกที่เกี่ยวข้องแบบกำหนดผลลัพธ์ซ้ำได้
- `render.createDashboards`: สร้างหน้าแดชบอร์ด

### ตัวอย่าง: QMD + โหมด bridge

ใช้ค่านี้เมื่อคุณต้องการ QMD สำหรับการเรียกคืน และ `memory-wiki` สำหรับเลเยอร์ความรู้ที่ดูแลรักษาไว้:

```json5
{
  memory: {
    backend: "qmd",
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

การตั้งค่านี้คงไว้ซึ่ง:

- QMD รับผิดชอบการเรียกคืน Active Memory
- `memory-wiki` มุ่งเน้นหน้าที่คอมไพล์แล้วและแดชบอร์ด
- รูปแบบพรอมต์ไม่เปลี่ยนแปลงจนกว่าคุณจะเปิดใช้พรอมต์ไดเจสต์ที่คอมไพล์แล้วโดยตั้งใจ

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

ดู [CLI: wiki](/th/cli/wiki) สำหรับข้อมูลอ้างอิงคำสั่งฉบับเต็ม

## การรองรับ Obsidian

เมื่อ `vault.renderMode` เป็น `obsidian` Plugin จะเขียน Markdown ที่เป็นมิตรกับ Obsidian และสามารถเลือกใช้ CLI ทางการของ `obsidian` ได้

เวิร์กโฟลว์ที่รองรับประกอบด้วย:

- การตรวจสอบสถานะ
- การค้นหา vault
- การเปิดหน้า
- การเรียกใช้คำสั่ง Obsidian
- การข้ามไปยังบันทึกประจำวัน

ส่วนนี้เป็นตัวเลือก wiki ยังคงทำงานในโหมด native ได้โดยไม่ต้องใช้ Obsidian

## เวิร์กโฟลว์ที่แนะนำ

1. คง Plugin Active Memory ของคุณไว้สำหรับการเรียกคืน/การโปรโมต/Dreaming
2. เปิดใช้ `memory-wiki`
3. เริ่มด้วยโหมด `isolated` เว้นแต่คุณต้องการโหมด bridge อย่างชัดเจน
4. ใช้ `wiki_search` / `wiki_get` เมื่อแหล่งที่มาสำคัญ
5. ใช้ `wiki_apply` สำหรับการสังเคราะห์แบบจำกัดขอบเขตหรือการอัปเดตเมทาดาทา
6. เรียกใช้ `wiki_lint` หลังจากมีการเปลี่ยนแปลงสำคัญ
7. เปิดแดชบอร์ดหากคุณต้องการมองเห็นเนื้อหาที่ล้าสมัย/ขัดแย้งกัน

## เอกสารที่เกี่ยวข้อง

- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
- [CLI: memory](/th/cli/memory)
- [CLI: wiki](/th/cli/wiki)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
