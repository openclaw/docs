---
read_when:
    - คุณต้องการความรู้ที่คงอยู่ถาวรนอกเหนือจากบันทึก MEMORY.md แบบธรรมดา
    - คุณกำลังกำหนดค่า Plugin memory-wiki ที่รวมมาให้
    - คุณต้องการทำความเข้าใจ wiki_search, wiki_get หรือโหมดบริดจ์
summary: 'memory-wiki: คลังความรู้ที่รวบรวมไว้พร้อมที่มาของข้อมูล คำกล่าวอ้าง แดชบอร์ด และโหมดบริดจ์'
title: วิกิหน่วยความจำ
x-i18n:
    generated_at: "2026-05-04T02:26:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: b070177b7c1217e9102bc57680b4009265e3584ede7ad6dc3ba7b6393260fefe
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` เป็น Plugin ที่มาพร้อมชุด ซึ่งเปลี่ยนหน่วยความจำถาวรให้เป็นคลังความรู้ที่คอมไพล์แล้ว

มัน **ไม่ได้** แทนที่ Plugin หน่วยความจำที่ทำงานอยู่ Plugin หน่วยความจำที่ทำงานอยู่ยังคง
เป็นเจ้าของการเรียกคืน การโปรโมต การจัดทำดัชนี และ Dreaming `memory-wiki` อยู่เคียงข้าง
และคอมไพล์ความรู้ถาวรให้เป็นวิกิที่นำทางได้ พร้อมหน้าที่กำหนดได้แน่นอน
claim แบบมีโครงสร้าง แหล่งที่มา แดชบอร์ด และ digest ที่เครื่องอ่านได้

ใช้เมื่อคุณต้องการให้หน่วยความจำทำงานเหมือนชั้นความรู้ที่ดูแลรักษาอยู่มากขึ้น และ
เหมือนกองไฟล์ Markdown น้อยลง

## สิ่งที่เพิ่มเข้ามา

- คลังวิกิเฉพาะพร้อมเลย์เอาต์หน้าที่กำหนดได้แน่นอน
- เมทาดาทา claim และหลักฐานแบบมีโครงสร้าง ไม่ใช่แค่ข้อความร้อยแก้ว
- แหล่งที่มา ความมั่นใจ ความขัดแย้ง และคำถามเปิดในระดับหน้า
- digest ที่คอมไพล์แล้วสำหรับผู้บริโภคฝั่งเอเจนต์/รันไทม์
- เครื่องมือค้นหา/get/apply/lint แบบเนทีฟของวิกิ
- โหมด bridge แบบเลือกได้ ซึ่งนำเข้า artifact สาธารณะจาก Plugin หน่วยความจำที่ทำงานอยู่
- โหมด render ที่เป็นมิตรกับ Obsidian และการผสานกับ CLI แบบเลือกได้

## ทำงานร่วมกับหน่วยความจำอย่างไร

ให้คิดถึงการแบ่งชั้นแบบนี้:

| ชั้น                                                   | เป็นเจ้าของ                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin หน่วยความจำที่ทำงานอยู่ (`memory-core`, QMD, Honcho ฯลฯ) | การเรียกคืน การค้นหาเชิงความหมาย การโปรโมต Dreaming รันไทม์หน่วยความจำ                               |
| `memory-wiki`                                           | หน้าวิกิที่คอมไพล์แล้ว การสังเคราะห์ที่มีแหล่งที่มาแน่นหนา แดชบอร์ด การค้นหา/get/apply เฉพาะวิกิ |

หาก Plugin หน่วยความจำที่ทำงานอยู่เปิดเผย artifact การเรียกคืนร่วม OpenClaw สามารถค้นหา
ทั้งสองชั้นได้ในรอบเดียวด้วย `memory_search corpus=all`

เมื่อคุณต้องการการจัดอันดับเฉพาะวิกิ แหล่งที่มา หรือการเข้าถึงหน้าโดยตรง ให้ใช้
เครื่องมือเนทีฟของวิกิแทน

## รูปแบบไฮบริดที่แนะนำ

ค่าเริ่มต้นที่ดีสำหรับการตั้งค่าแบบ local-first คือ:

- QMD เป็นแบ็กเอนด์หน่วยความจำที่ทำงานอยู่สำหรับการเรียกคืนและการค้นหาเชิงความหมายแบบกว้าง
- `memory-wiki` ในโหมด `bridge` สำหรับหน้าความรู้ถาวรที่สังเคราะห์แล้ว

การแบ่งแบบนั้นทำงานได้ดีเพราะแต่ละชั้นยังคงมีจุดโฟกัสของตัวเอง:

- QMD ทำให้โน้ตดิบ การส่งออกเซสชัน และคอลเลกชันเพิ่มเติมค้นหาได้
- `memory-wiki` คอมไพล์เอนทิตี claim แดชบอร์ด และหน้าต้นทางที่เสถียร

กฎใช้งานจริง:

- ใช้ `memory_search` เมื่อคุณต้องการการเรียกคืนแบบกว้างหนึ่งรอบทั่วทั้งหน่วยความจำ
- ใช้ `wiki_search` และ `wiki_get` เมื่อคุณต้องการผลลัพธ์วิกิที่รับรู้แหล่งที่มา
- ใช้ `memory_search corpus=all` เมื่อคุณต้องการให้การค้นหาร่วมครอบคลุมทั้งสองชั้น

หากโหมด bridge รายงานว่ามี artifact ที่ส่งออกเป็นศูนย์ แสดงว่า Plugin หน่วยความจำที่ทำงานอยู่ยัง
ไม่ได้เปิดเผยอินพุต bridge สาธารณะในขณะนี้ ให้รัน `openclaw wiki doctor` ก่อน
จากนั้นยืนยันว่า Plugin หน่วยความจำที่ทำงานอยู่รองรับ artifact สาธารณะ

เมื่อโหมด bridge ทำงานอยู่และเปิดใช้ `bridge.readMemoryArtifacts`
`openclaw wiki status`, `openclaw wiki doctor` และ `openclaw wiki bridge
import` จะอ่านผ่าน Gateway ที่กำลังรันอยู่ วิธีนี้ทำให้การตรวจ bridge ผ่าน CLI สอดคล้อง
กับบริบท Plugin หน่วยความจำของรันไทม์ หากปิด bridge หรือปิดการอ่าน artifact
คำสั่งเหล่านั้นจะคงพฤติกรรมแบบ local/offline ไว้

## โหมดคลัง

`memory-wiki` รองรับโหมดคลังสามแบบ:

### `isolated`

คลังของตัวเอง แหล่งข้อมูลของตัวเอง ไม่มีการพึ่งพา `memory-core`

ใช้เมื่อคุณต้องการให้วิกิเป็นคลังความรู้ที่คัดสรรเอง

### `bridge`

อ่าน artifact หน่วยความจำสาธารณะและเหตุการณ์หน่วยความจำจาก Plugin หน่วยความจำที่ทำงานอยู่
ผ่าน seam สาธารณะของ Plugin SDK

ใช้เมื่อคุณต้องการให้วิกิคอมไพล์และจัดระเบียบ artifact ที่ส่งออกจาก Plugin หน่วยความจำ
โดยไม่เข้าถึงภายในส่วนตัวของ Plugin

โหมด bridge สามารถจัดทำดัชนี:

- artifact หน่วยความจำที่ส่งออก
- รายงาน dream
- โน้ตรายวัน
- ไฟล์รากของหน่วยความจำ
- บันทึกเหตุการณ์หน่วยความจำ

### `unsafe-local`

ช่องทางหลบออกบนเครื่องเดียวกันแบบชัดเจนสำหรับพาธส่วนตัวในเครื่อง

โหมดนี้ตั้งใจให้เป็นเชิงทดลองและไม่พกพา ใช้เฉพาะเมื่อคุณ
เข้าใจขอบเขตความไว้วางใจและจำเป็นต้องใช้การเข้าถึงระบบไฟล์ในเครื่องที่
โหมด bridge ให้ไม่ได้จริง ๆ

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

เนื้อหาที่จัดการจะอยู่ภายในบล็อกที่สร้างขึ้น บล็อกโน้ตของมนุษย์จะถูกรักษาไว้

กลุ่มหน้าหลักคือ:

- `sources/` สำหรับวัตถุดิบที่นำเข้าและหน้าที่อิง bridge
- `entities/` สำหรับสิ่ง บุคคล ระบบ โครงการ และวัตถุที่คงทน
- `concepts/` สำหรับแนวคิด นามธรรม รูปแบบ และนโยบาย
- `syntheses/` สำหรับสรุปที่คอมไพล์แล้วและ rollup ที่ดูแลรักษา
- `reports/` สำหรับแดชบอร์ดที่สร้างขึ้น

## claim และหลักฐานแบบมีโครงสร้าง

หน้าสามารถมี frontmatter `claims` แบบมีโครงสร้างได้ ไม่ใช่แค่ข้อความอิสระ

claim แต่ละรายการสามารถมี:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

รายการหลักฐานสามารถมี:

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

นี่คือสิ่งที่ทำให้วิกิทำงานเหมือนชั้นความเชื่อมากกว่ากองโน้ตแบบรับอย่างเดียว
claim สามารถถูกติดตาม ให้คะแนน โต้แย้ง และโยงกลับไปยังแหล่งข้อมูลได้

## เมทาดาทาเอนทิตีสำหรับเอเจนต์

หน้าเอนทิตียังสามารถมีเมทาดาทาการกำหนดเส้นทางสำหรับการใช้งานของเอเจนต์ได้ สิ่งนี้เป็น
frontmatter ทั่วไป จึงใช้ได้กับบุคคล ทีม ระบบ โครงการ หรือ
เอนทิตีชนิดอื่นใด

ฟิลด์ทั่วไปได้แก่:

- `entityType`: ตัวอย่างเช่น `person`, `team`, `system` หรือ `project`
- `canonicalId`: คีย์ตัวตนที่เสถียรซึ่งใช้ข้ามนามแฝงและการนำเข้า
- `aliases`: ชื่อ handle หรือป้ายกำกับที่ควร resolve ไปยังหน้าเดียวกัน
- `privacyTier`: `public`, `local-private`, `sensitive` หรือ `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: คำใบ้การกำหนดเส้นทางแบบกะทัดรัด
- `lastRefreshedAt`: timestamp การรีเฟรชแหล่งข้อมูลที่แยกจากเวลาแก้ไขหน้า
- `personCard`: การ์ดกำหนดเส้นทางเฉพาะบุคคลแบบเลือกได้ พร้อม handle, socials,
  อีเมล เขตเวลา lane, ask-for, avoid-asking-for, ความมั่นใจ และความเป็นส่วนตัว
- `relationships`: edge แบบมีชนิดไปยังหน้าที่เกี่ยวข้อง พร้อมเป้าหมาย ชนิด น้ำหนัก
  ความมั่นใจ ชนิดหลักฐาน ระดับความเป็นส่วนตัว และโน้ต

สำหรับวิกิบุคคล โดยปกติเอเจนต์ควรเริ่มที่
`reports/person-agent-directory.md` จากนั้นเปิดหน้าบุคคลด้วย `wiki_get`
ก่อนใช้รายละเอียดติดต่อหรือข้อเท็จจริงที่อนุมานมา

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

ขั้นตอนคอมไพล์จะอ่านหน้าวิกิ ปรับสรุปให้เป็นมาตรฐาน และปล่อย
artifact ที่เสถียรสำหรับเครื่องภายใต้:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

digest เหล่านี้มีอยู่เพื่อให้เอเจนต์และโค้ดรันไทม์ไม่ต้อง scrape หน้า Markdown

เอาต์พุตที่คอมไพล์แล้วยังใช้ขับเคลื่อน:

- การจัดทำดัชนีวิกิรอบแรกสำหรับ flow การค้นหา/get
- การค้นหา claim-id กลับไปยังหน้าที่เป็นเจ้าของ
- ส่วนเสริม prompt แบบกะทัดรัด
- การสร้างรายงาน/แดชบอร์ด

## แดชบอร์ดและรายงานสุขภาพ

เมื่อเปิดใช้ `render.createDashboards` การคอมไพล์จะดูแลแดชบอร์ดภายใต้
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

- กลุ่มโน้ตความขัดแย้ง
- กลุ่ม claim ที่แข่งขันกัน
- claim ที่ขาดหลักฐานแบบมีโครงสร้าง
- หน้าและ claim ที่มีความมั่นใจต่ำ
- ความสดใหม่ที่ล้าสมัยหรือไม่ทราบ
- หน้าที่มีคำถามค้างอยู่
- การ์ดกำหนดเส้นทางบุคคล/เอนทิตี
- edge ความสัมพันธ์แบบมีโครงสร้าง
- ความครอบคลุมของคลาสหลักฐาน
- ระดับความเป็นส่วนตัวที่ไม่ใช่สาธารณะซึ่งต้องตรวจทานก่อนใช้

## การค้นหาและการเรียกคืน

`memory-wiki` รองรับแบ็กเอนด์การค้นหาสองแบบ:

- `shared`: ใช้ flow การค้นหาหน่วยความจำร่วมเมื่อพร้อมใช้งาน
- `local`: ค้นหาวิกิในเครื่อง

ยังรองรับ corpus สามแบบ:

- `wiki`
- `memory`
- `all`

พฤติกรรมสำคัญ:

- `wiki_search` และ `wiki_get` ใช้ digest ที่คอมไพล์แล้วเป็นรอบแรกเมื่อเป็นไปได้
- claim id สามารถ resolve กลับไปยังหน้าที่เป็นเจ้าของได้
- claim ที่ถูกโต้แย้ง/ล้าสมัย/สดใหม่มีผลต่อการจัดอันดับ
- ป้ายกำกับแหล่งที่มาสามารถคงอยู่ไปถึงผลลัพธ์
- โหมดค้นหาสามารถถ่วงน้ำหนักการจัดอันดับสำหรับการค้นหาบุคคล การกำหนดเส้นทางคำถาม หลักฐาน
  แหล่งข้อมูล หรือ claim ดิบ

กฎใช้งานจริง:

- ใช้ `memory_search corpus=all` สำหรับการเรียกคืนแบบกว้างหนึ่งรอบ
- ใช้ `wiki_search` + `wiki_get` เมื่อคุณให้ความสำคัญกับการจัดอันดับเฉพาะวิกิ
  แหล่งที่มา หรือโครงสร้างความเชื่อระดับหน้า

โหมดค้นหา:

- `auto`: ค่าเริ่มต้นแบบสมดุล
- `find-person`: เพิ่มน้ำหนักเอนทิตีที่เหมือนบุคคล นามแฝง handle, socials และ
  canonical ID
- `route-question`: เพิ่มน้ำหนักการ์ดเอเจนต์ คำใบ้ ask-for คำใบ้ best-used-for และ
  บริบทความสัมพันธ์
- `source-evidence`: เพิ่มน้ำหนักหน้าต้นทางและเมทาดาทาหลักฐานแบบมีโครงสร้าง
- `raw-claim`: เพิ่มน้ำหนัก claim แบบมีโครงสร้างที่ตรงกัน และส่งคืนเมทาดาทา claim/หลักฐาน
  ในผลลัพธ์

เมื่อผลลัพธ์ตรงกับ claim แบบมีโครงสร้าง `wiki_search` สามารถส่งคืน
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` และ `evidenceSourceIds` ใน payload รายละเอียด เอาต์พุตข้อความ
ยังรวมบรรทัด `Claim:` และ `Evidence:` แบบกะทัดรัดเมื่อมี

## เครื่องมือเอเจนต์

Plugin ลงทะเบียนเครื่องมือเหล่านี้:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

สิ่งที่ทำ:

- `wiki_status`: โหมดคลังปัจจุบัน สุขภาพ ความพร้อมใช้งานของ Obsidian CLI
- `wiki_search`: ค้นหาหน้าวิกิ และเมื่อกำหนดค่าไว้ ค้นหา corpus หน่วยความจำร่วม;
  รับ `mode` สำหรับการค้นหาบุคคล การกำหนดเส้นทางคำถาม หลักฐานแหล่งข้อมูล หรือการเจาะลึก
  claim ดิบ
- `wiki_get`: อ่านหน้าวิกิตาม id/path หรือ fallback ไปยัง corpus หน่วยความจำร่วม
- `wiki_apply`: การกลายพันธุ์ synthesis/เมทาดาทาแบบแคบโดยไม่ผ่าตัดหน้าแบบอิสระ
- `wiki_lint`: การตรวจโครงสร้าง ช่องว่างของแหล่งที่มา ความขัดแย้ง คำถามเปิด

Plugin ยังลงทะเบียนส่วนเสริม corpus หน่วยความจำแบบไม่ผูกขาด เพื่อให้
`memory_search` และ `memory_get` แบบร่วมเข้าถึงวิกิได้เมื่อ Plugin หน่วยความจำที่ทำงานอยู่
รองรับการเลือก corpus

## พฤติกรรม prompt และบริบท

เมื่อเปิดใช้ `context.includeCompiledDigestPrompt` ส่วน prompt หน่วยความจำจะ
ต่อท้าย snapshot ที่คอมไพล์แล้วแบบกะทัดรัดจาก `agent-digest.json`

snapshot นั้นตั้งใจให้เล็กและมีสัญญาณสูง:

- เฉพาะหน้ายอดนิยม
- เฉพาะ claim ยอดนิยม
- จำนวนความขัดแย้ง
- จำนวนคำถาม
- ตัวระบุความมั่นใจ/ความสดใหม่

นี่เป็นแบบ opt-in เพราะเปลี่ยนรูปทรงของ prompt และมีประโยชน์หลักสำหรับเอนจินบริบท
หรือการประกอบ prompt แบบเดิมที่บริโภคส่วนเสริมหน่วยความจำอย่างชัดเจน

## การกำหนดค่า

วาง config ใต้ `plugins.entries.memory-wiki.config`:

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
- `bridge.readMemoryArtifacts`: นำเข้าอาร์ติแฟกต์สาธารณะของ Active Memory Plugin
- `bridge.followMemoryEvents`: รวมบันทึกเหตุการณ์ในโหมด bridge
- `search.backend`: `shared` หรือ `local`
- `search.corpus`: `wiki`, `memory` หรือ `all`
- `context.includeCompiledDigestPrompt`: ผนวกสแนปช็อตไดเจสต์แบบกะทัดรัดเข้ากับส่วนพรอมต์หน่วยความจำ
- `render.createBacklinks`: สร้างบล็อกที่เกี่ยวข้องแบบกำหนดแน่นอน
- `render.createDashboards`: สร้างหน้าแดชบอร์ด

### ตัวอย่าง: โหมด QMD + bridge

ใช้สิ่งนี้เมื่อคุณต้องการ QMD สำหรับการเรียกคืน และ `memory-wiki` สำหรับชั้นความรู้ที่ได้รับการดูแลรักษา:

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

- ให้ QMD รับผิดชอบการเรียกคืน Active Memory
- ให้ `memory-wiki` มุ่งเน้นไปที่หน้าที่คอมไพล์แล้วและแดชบอร์ด
- รูปทรงของพรอมต์ไม่เปลี่ยนแปลงจนกว่าคุณจะตั้งใจเปิดใช้พรอมต์ไดเจสต์ที่คอมไพล์แล้ว

## CLI

`memory-wiki` ยังเปิดเผยพื้นผิว CLI ระดับบนด้วย:

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

ดู [CLI: wiki](/th/cli/wiki) สำหรับเอกสารอ้างอิงคำสั่งทั้งหมด

## การรองรับ Obsidian

เมื่อ `vault.renderMode` เป็น `obsidian` Plugin จะเขียน Markdown ที่เป็นมิตรกับ Obsidian และสามารถเลือกใช้ CLI `obsidian` อย่างเป็นทางการได้

เวิร์กโฟลว์ที่รองรับรวมถึง:

- การตรวจสอบสถานะ
- การค้นหา vault
- การเปิดหน้า
- การเรียกใช้คำสั่ง Obsidian
- การข้ามไปยังบันทึกประจำวัน

สิ่งนี้เป็นทางเลือก wiki ยังคงทำงานได้ในโหมด native โดยไม่มี Obsidian

## เวิร์กโฟลว์ที่แนะนำ

1. เก็บ Active Memory Plugin ของคุณไว้สำหรับการเรียกคืน/การเลื่อนระดับ/Dreaming
2. เปิดใช้ `memory-wiki`
3. เริ่มด้วยโหมด `isolated` เว้นแต่คุณต้องการโหมด bridge อย่างชัดเจน
4. ใช้ `wiki_search` / `wiki_get` เมื่อแหล่งที่มามีความสำคัญ
5. ใช้ `wiki_apply` สำหรับการสังเคราะห์แบบแคบหรือการอัปเดตเมตาดาตา
6. รัน `wiki_lint` หลังจากมีการเปลี่ยนแปลงที่มีนัยสำคัญ
7. เปิดใช้แดชบอร์ดหากคุณต้องการมองเห็นรายการล้าสมัย/ข้อขัดแย้ง

## เอกสารที่เกี่ยวข้อง

- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
- [CLI: memory](/th/cli/memory)
- [CLI: wiki](/th/cli/wiki)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
