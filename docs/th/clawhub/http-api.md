---
read_when:
    - การเพิ่ม/เปลี่ยนแปลงเอนด์พอยต์
    - การดีบักคำขอระหว่าง CLI ↔ รีจิสทรี
summary: เอกสารอ้างอิง HTTP API (จุดเชื่อมต่อสาธารณะ + CLI + การยืนยันตัวตน)
x-i18n:
    generated_at: "2026-07-19T07:14:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

URL ฐาน: `https://clawhub.ai` (ค่าเริ่มต้น)

พาธ v1 ทั้งหมดอยู่ภายใต้ `/api/v1/...`
`/api/...` และ `/api/cli/...` แบบเดิมยังคงไว้เพื่อความเข้ากันได้ (ดู `DEPRECATIONS.md`)
OpenAPI: `/api/v1/openapi.json`

## การนำแค็ตตาล็อกสาธารณะมาใช้ซ้ำ

ไดเรกทอรีของบุคคลที่สามสามารถใช้เอนด์พอยต์การอ่านสาธารณะเพื่อแสดงรายการหรือค้นหา Skills ของ ClawHub ได้ โปรดแคชผลลัพธ์ ปฏิบัติตาม `429`/`Retry-After` ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub หลัก (`https://clawhub.ai/<owner>/skills/<slug>`) และหลีกเลี่ยงการสื่อเป็นนัยว่า ClawHub รับรองเว็บไซต์ของบุคคลที่สาม อย่าพยายามทำสำเนาเนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกโดยการกลั่นกรอง นอกเหนือจากพื้นผิว API สาธารณะ

ทางลัด slug บนเว็บสามารถแก้ไขข้ามตระกูลรีจิสทรีได้ แต่ไคลเอ็นต์ API ควรใช้
URL หลักที่เอนด์พอยต์การอ่านส่งคืน แทนการสร้างลำดับความสำคัญของเส้นทาง
ขึ้นใหม่

## ขีดจำกัดอัตรา

รูปแบบการบังคับใช้:

- คำขอแบบไม่ระบุตัวตน: บังคับใช้ต่อ IP
- คำขอที่ผ่านการยืนยันตัวตน (โทเค็น Bearer ที่ถูกต้อง): บังคับใช้ตามบักเก็ตของผู้ใช้
- หากโทเค็นหายไป/ไม่ถูกต้อง ลักษณะการทำงานจะกลับไปใช้การบังคับใช้ตาม IP
- เอนด์พอยต์การเขียนที่ผ่านการยืนยันตัวตนไม่ควรส่งคืนเพียง `Unauthorized` เมื่อ
  เซิร์ฟเวอร์ทราบสาเหตุ โทเค็นที่หายไป โทเค็นที่ไม่ถูกต้อง/ถูกเพิกถอน และ
  บัญชีที่ถูกลบ/แบน/ปิดใช้งาน ควรได้รับข้อความที่นำไปดำเนินการได้แยกกัน เพื่อให้ไคลเอ็นต์
  CLI สามารถแจ้งผู้ใช้ได้ว่าสิ่งใดขัดขวางพวกเขา

- อ่าน: 3000/นาที ต่อ IP, 12000/นาที ต่อคีย์
- เขียน: 300/นาที ต่อ IP, 3000/นาที ต่อคีย์
- ดาวน์โหลด: 1200/นาที ต่อ IP, 6000/นาที ต่อคีย์ (เอนด์พอยต์ดาวน์โหลด)

ส่วนหัว:

- ความเข้ากันได้แบบเดิม: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- แบบมาตรฐาน: `RateLimit-Limit`, `RateLimit-Reset`
- เมื่อเป็น `429`: `X-RateLimit-Remaining: 0` และ `RateLimit-Remaining: 0`
- เมื่อเป็น `429`: `Retry-After`

ความหมายของส่วนหัว:

- `X-RateLimit-Reset`: วินาทีของ Unix epoch แบบสัมบูรณ์
- `RateLimit-Reset`: จำนวนวินาทีจนกว่าจะรีเซ็ต (ระยะหน่วง)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: โควตาที่เหลืออย่างแม่นยำเมื่อมีค่า
  คำขอแบบแบ่งชาร์ดที่สำเร็จจะละเว้นส่วนหัวนี้ แทนการส่งคืนค่ารวมโดยประมาณ
- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองอีกครั้ง (ระยะหน่วง) เมื่อเป็น `429`

ตัวอย่างการตอบกลับ `429`:

```http
HTTP/2 429
content-type: text/plain; charset=utf-8
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34

เกินขีดจำกัดอัตรา
```

คำแนะนำสำหรับไคลเอ็นต์:

- หากมี `Retry-After` ให้รอตามจำนวนวินาทีนั้นก่อนลองอีกครั้ง
- ใช้การถอยกลับแบบสุ่มระยะหน่วงเพื่อหลีกเลี่ยงการลองซ้ำพร้อมกัน
- หากไม่มี `Retry-After` ให้กลับไปใช้ `RateLimit-Reset` (หรือคำนวณจาก `X-RateLimit-Reset`)

แหล่งที่มาของ IP:

- ใช้ส่วนหัว IP ของไคลเอ็นต์ที่เชื่อถือได้ รวมถึง `cf-connecting-ip` เฉพาะเมื่อ
  การปรับใช้เปิดใช้งานส่วนหัวที่ส่งต่อต่ออย่างชัดเจน
- ClawHub ใช้ส่วนหัวการส่งต่อที่เชื่อถือได้เพื่อระบุ IP ของไคลเอ็นต์ที่ขอบเครือข่าย
- หากไม่มี IP ของไคลเอ็นต์ที่เชื่อถือได้ คำขอแบบไม่ระบุตัวตนจะใช้บักเก็ตสำรอง
  ที่กำหนดขอบเขตตามชนิดของขีดจำกัดอัตราเท่านั้น บักเก็ตสำรองเหล่านี้จะไม่รวม
  พาธ, slug, ชื่อแพ็กเกจ, เวอร์ชัน, สตริงคำค้น หรือพารามิเตอร์อาร์ติแฟกต์อื่นๆ
  ที่ผู้เรียกส่งมา

## การตอบกลับข้อผิดพลาด

การตอบกลับข้อผิดพลาด v1 สาธารณะเป็นข้อความธรรมดาพร้อม `content-type: text/plain; charset=utf-8`
ซึ่งรวมถึงความล้มเหลวในการตรวจสอบความถูกต้อง (`400`), ทรัพยากรสาธารณะที่ไม่พบ (`404`), ความล้มเหลวด้านการยืนยันตัวตนและ
สิทธิ์ (`401`/`403`), ขีดจำกัดอัตรา (`429`) และการดาวน์โหลดที่ถูกบล็อก ไคลเอ็นต์
ควรอ่านเนื้อหาการตอบกลับเป็นสตริงที่มนุษย์อ่านเข้าใจได้ พารามิเตอร์คำค้นที่ไม่รู้จักจะถูก
ละเว้นเพื่อความเข้ากันได้ แต่พารามิเตอร์คำค้นที่ระบบรู้จักและมีค่าไม่ถูกต้องจะส่งคืน
`400`

## เอนด์พอยต์สาธารณะ (ไม่ต้องยืนยันตัวตน)

### `GET /api/v1/search`

พารามิเตอร์คำค้น:

- `q` (จำเป็น): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม
- `highlightedOnly` (ไม่บังคับ): `true` เพื่อกรองให้เหลือเฉพาะ Skills ที่ไฮไลต์
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): นามแฝงแบบเดิมสำหรับ `nonSuspiciousOnly`

การตอบกลับ:

```json
{
  "results": [
    {
      "score": 0.123,
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "version": "1.2.3",
      "updatedAt": 1730000000000,
      "ownerHandle": "openclaw",
      "owner": {
        "handle": "openclaw",
        "displayName": "OpenClaw",
        "image": "https://example.com/avatar.png"
      }
    }
  ]
}
```

หมายเหตุ:

- ผลลัพธ์จะถูกส่งคืนตามลำดับความเกี่ยวข้อง (ความคล้ายคลึงของ embedding + การเพิ่มคะแนนจากโทเค็น slug/ชื่อที่ตรงกันทุกประการ + ค่าน้ำหนักความนิยมเล็กน้อย)
- ความเกี่ยวข้องมีน้ำหนักมากกว่าความนิยม การตรงกันของโทเค็น slug หรือชื่อที่แสดงอย่างแม่นยำอาจมีอันดับสูงกว่าการตรงกันแบบหลวมๆ ที่มีการมีส่วนร่วมสูงกว่ามาก
- ข้อความ ASCII จะถูกแบ่งโทเค็นตามขอบเขตของคำและเครื่องหมายวรรคตอน ตัวอย่างเช่น `personal-map` มีโทเค็น `map` ที่แยกเดี่ยว ขณะที่ `amap-jsapi-skill` มี `amap`, `jsapi` และ `skill`; ดังนั้นการค้นหา `map` จึงทำให้ `personal-map` ตรงกันเชิงคำศัพท์มากกว่า `amap-jsapi-skill`
- ความนิยมใช้มาตราส่วนลอการิทึมและมีเพดาน Skills ที่มีการมีส่วนร่วมสูงอาจมีอันดับต่ำกว่าเมื่อข้อความคำค้นตรงกันน้อยกว่า
- สถานะการกลั่นกรองที่น่าสงสัยหรือซ่อนอยู่อาจทำให้ Skill ถูกนำออกจากการค้นหาสาธารณะ โดยขึ้นอยู่กับตัวกรองของผู้เรียกและสถานะการกลั่นกรองปัจจุบัน

คำแนะนำด้านการค้นพบสำหรับผู้เผยแพร่:

- ใส่คำที่ผู้ใช้จะค้นหาจริงๆ ไว้ในชื่อที่แสดง ข้อมูลสรุป และแท็ก ใช้โทเค็น slug แบบแยกเดี่ยวเฉพาะเมื่อโทเค็นนั้นเป็นอัตลักษณ์ที่เสถียรซึ่งต้องการเก็บไว้ด้วย
- อย่าเปลี่ยนชื่อ slug เพียงเพื่อไล่ตามคำค้นหนึ่งรายการ เว้นแต่ slug ใหม่จะเป็นชื่อหลักในระยะยาวที่ดีกว่า slug เก่าจะกลายเป็นนามแฝงสำหรับการเปลี่ยนเส้นทาง แต่ URL หลัก, slug ที่แสดง และไดเจสต์การค้นหาในอนาคตจะใช้ slug ใหม่
- นามแฝงจากการเปลี่ยนชื่อจะรักษาการแก้ไขสำหรับ URL เก่าและการติดตั้งที่แก้ไขผ่านรีจิสทรี แต่การจัดอันดับการค้นหาจะอิงตามเมตาดาต้า Skill หลักหลังจากระบบทำดัชนีการเปลี่ยนชื่อแล้ว สถิติที่มีอยู่จะยังคงอยู่กับ Skill
- หาก Skill มองไม่เห็นโดยไม่คาดคิด ให้ตรวจสอบสถานะการกลั่นกรองก่อนด้วย `clawhub inspect @owner/slug` ขณะเข้าสู่ระบบ ก่อนเปลี่ยนเมตาดาต้าที่เกี่ยวข้องกับการจัดอันดับ

### `GET /api/v1/skills`

พารามิเตอร์คำค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–200)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าสำหรับการเรียงลำดับใดๆ ที่ไม่ใช่ `trending`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended` (นามแฝง: `default`), `createdAt` (นามแฝง: `newest`), `downloads`, `stars` (นามแฝง: `rating`), นามแฝงการติดตั้งแบบเดิม `installsCurrent`/`installs`/`installsAllTime` จับคู่กับ `downloads`, `trending`
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): นามแฝงแบบเดิมสำหรับ `nonSuspiciousOnly`

ค่า `sort` ที่ไม่ถูกต้องจะส่งคืน `400`

หมายเหตุ:

- `recommended` ใช้สัญญาณการมีส่วนร่วมและความใหม่
- `trending` จัดอันดับตามการติดตั้งในช่วง 7 วันที่ผ่านมา (อิงข้อมูลเทเลเมทรี)
- `createdAt` มีความเสถียรสำหรับการรวบรวมข้อมูล Skill ใหม่; `updated` จะเปลี่ยนเมื่อมีการเผยแพร่ Skills ที่มีอยู่ซ้ำ
- เมื่อ `nonSuspiciousOnly=true` การเรียงลำดับแบบใช้เคอร์เซอร์อาจส่งคืนรายการในหนึ่งหน้าน้อยกว่า `limit` เนื่องจาก Skills ที่น่าสงสัยจะถูกกรองหลังจากดึงข้อมูลหน้าแล้ว
- ใช้ `nextCursor` เพื่อแบ่งหน้าต่อเมื่อมีค่า หน้าที่มีรายการน้อยไม่ได้หมายความว่าสิ้นสุดผลลัพธ์เสมอไป

การตอบกลับ:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "topics": ["Productivity"],
      "tags": { "latest": "1.2.3" },
      "stats": {},
      "createdAt": 0,
      "updatedAt": 0,
      "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
      "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] }
    }
  ],
  "nextCursor": null
}
```

### `GET /api/v1/skills/{slug}`

การตอบกลับ:

```json
{
  "skill": {
    "slug": "gifgrep",
    "displayName": "GifGrep",
    "summary": "…",
    "topics": ["Productivity"],
    "tags": { "latest": "1.2.3" },
    "stats": {},
    "createdAt": 0,
    "updatedAt": 0
  },
  "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
  "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] },
  "owner": { "handle": "steipete", "displayName": "Peter", "image": null },
  "moderation": {
    "isSuspicious": false,
    "isMalwareBlocked": false,
    "verdict": "clean",
    "reasonCodes": [],
    "summary": null,
    "engineVersion": "v2.0.0",
    "updatedAt": 0
  }
}
```

หมายเหตุ:

- slug เก่าที่สร้างโดยขั้นตอนการเปลี่ยนชื่อ/รวมของเจ้าของจะถูกแก้ไขไปยัง Skill หลัก
- `metadata.os`: ข้อจำกัดระบบปฏิบัติการที่ประกาศใน frontmatter ของ Skill (เช่น `["macos"]`, `["linux"]`) `null` หากไม่ได้ประกาศ
- `metadata.systems`: เป้าหมายระบบ Nix (เช่น `["aarch64-darwin", "x86_64-linux"]`) `null` หากไม่ได้ประกาศ
- `metadata` เป็น `null` หาก Skill ไม่มีเมตาดาต้าแพลตฟอร์ม
- จะรวม `moderation` เฉพาะเมื่อ Skill ถูกตั้งค่าสถานะหรือเจ้าของกำลังดู Skill นั้น

### `GET /api/v1/skills/{slug}/moderation`

ส่งคืนสถานะการกลั่นกรองแบบมีโครงสร้าง

การตอบกลับ:

```json
{
  "moderation": {
    "isSuspicious": true,
    "isMalwareBlocked": false,
    "verdict": "suspicious",
    "reasonCodes": ["suspicious.dynamic_code_execution"],
    "summary": "Detected: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "Dynamic code execution detected.",
        "evidence": ""
      }
    ]
  }
}
```

หมายเหตุ:

- เจ้าของและผู้กลั่นกรองสามารถเข้าถึงรายละเอียดการกลั่นกรองของ Skills ที่ซ่อนอยู่
- ผู้เรียกสาธารณะจะได้รับเฉพาะ `200` สำหรับ Skills ที่มองเห็นได้และถูกตั้งค่าสถานะแล้ว
- หลักฐานจะถูกปกปิดสำหรับผู้เรียกสาธารณะ และจะรวมข้อความดิบเฉพาะสำหรับเจ้าของ/ผู้กลั่นกรองเท่านั้น

### `POST /api/v1/skills/{slug}/report`

รายงาน Skill เพื่อให้ผู้กลั่นกรองตรวจสอบ รายงานอยู่ในระดับ Skill สามารถเชื่อมโยง
กับเวอร์ชันได้ตามต้องการ และจะถูกส่งไปยังคิวรายงาน Skill

การยืนยันตัวตน:

- ต้องใช้โทเค็น API

คำขอ:

```json
{ "reason": "ขั้นตอนการติดตั้งที่น่าสงสัย", "version": "1.2.3" }
```

การตอบกลับ:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "reportId": "skillReports:...",
  "skillId": "skills:...",
  "reportCount": 1
}
```

### `GET /api/v1/skills/-/reports`

เอนด์พอยต์สำหรับผู้กลั่นกรอง/ผู้ดูแลระบบเพื่อรับรายงาน Skill

พารามิเตอร์คำค้น:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `confirmed`, `dismissed` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-200)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

การตอบกลับ:

```json
{
  "items": [
    {
      "reportId": "skillReports:...",
      "skillId": "skills:...",
      "skillVersionId": "skillVersions:...",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "version": "1.2.3",
      "reason": "Suspicious install step",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/skills/-/reports/{reportId}/triage`

ปลายทางสำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อแก้ไขหรือเปิดรายงานสกิลอีกครั้ง

คำขอ:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

ต้องระบุ `note` สำหรับ `confirmed` และ `dismissed`; สามารถละเว้นได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "hide"` พร้อมกับรายงานที่ผ่านการคัดกรอง
เพื่อซ่อนสกิลในเวิร์กโฟลว์เดียวกันที่ตรวจสอบย้อนหลังได้

### `GET /api/v1/skills/{slug}/versions`

พารามิเตอร์การค้นหา:

- `limit` (ไม่บังคับ): จำนวนเต็ม
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

### `GET /api/v1/skills/{slug}/versions/{version}`

ส่งคืนข้อมูลเมตาของเวอร์ชัน + รายการไฟล์

- `version.security` มีสถานะการยืนยันผลการสแกนที่ปรับเป็นรูปแบบมาตรฐานและรายละเอียดของเครื่องสแกน
  (VirusTotal + LLM) เมื่อมีข้อมูล

### `GET /api/v1/skills/{slug}/scan`

ส่งคืนรายละเอียดการยืนยันผลการสแกนความปลอดภัยสำหรับเวอร์ชันของสกิล

พารามิเตอร์การค้นหา:

- `version` (ไม่บังคับ): สตริงเวอร์ชันที่ระบุ
- `tag` (ไม่บังคับ): แปลงแท็กเป็นเวอร์ชัน (ตัวอย่างเช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` ระบบจะใช้เวอร์ชันล่าสุด
- มีสถานะการยืนยันที่ปรับเป็นรูปแบบมาตรฐานพร้อมรายละเอียดเฉพาะของเครื่องสแกน
- `security.hasScanResult` จะเป็น `true` เฉพาะเมื่อเครื่องสแกนให้คำตัดสินที่แน่ชัด (`clean`, `suspicious` หรือ `malicious`)
- `moderation` คือสแนปช็อตการควบคุมระดับสกิลในปัจจุบันซึ่งได้มาจากเวอร์ชันล่าสุด
- เมื่อค้นหาเวอร์ชันในอดีต ให้ตรวจสอบ `moderation.matchesRequestedVersion` และ `moderation.sourceVersion` ก่อนถือว่า `moderation` และ `security` อยู่ในบริบทเวอร์ชันเดียวกัน

### `POST /api/v1/skills/-/scan`

ปลายทางการส่งงาน ClawScan ใหม่ที่ต้องผ่านการยืนยันตัวตน

ไม่รองรับการสแกนไฟล์ที่อัปโหลดภายในเครื่องอีกต่อไป คำขอที่ใช้
`multipart/form-data` หรือ `{ "source": { "kind": "upload" } }` จะส่งคืน `410`

การสแกนรายการที่เผยแพร่ใช้ JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

หมายเหตุ:

- เพย์โหลดคำขอสแกนและรายงานที่ดาวน์โหลดได้จะหมดอายุและถูกนำออกจากที่เก็บคำขอสแกนหลังพ้นช่วงเวลาการเก็บรักษา
- การสแกนรายการที่เผยแพร่ต้องมีสิทธิ์จัดการของเจ้าของ/ผู้เผยแพร่ หรืออำนาจผู้ดูแล/ผู้ดูแลระบบของแพลตฟอร์ม
- การสแกนรายการที่เผยแพร่จะเขียนผลกลับเฉพาะเมื่อ `update: true` และการสแกนเสร็จสมบูรณ์
- การตอบกลับคือ `202` พร้อม `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`
- งานสแกนทำงานแบบอะซิงโครนัส คำขอสแกนด้วยตนเองมีลำดับความสำคัญเหนือกว่างานเผยแพร่/เติมข้อมูลย้อนหลังตามปกติ แต่การดำเนินการให้เสร็จยังคงขึ้นอยู่กับความพร้อมของเวิร์กเกอร์

### `GET /api/v1/skills/-/scan/{scanId}`

ปลายทางการสำรวจสถานะสำหรับการสแกนที่ส่งแล้วซึ่งต้องผ่านการยืนยันตัวตน

- ส่งคืนสถานะเข้าคิว/กำลังทำงาน/สำเร็จ/ล้มเหลว
- ส่งคืน `queue.queuedAhead` และ `queue.position` ระหว่างอยู่ในคิว เพื่อให้ไคลเอนต์แสดงจำนวนการสแกนด้วยตนเองที่ได้รับการจัดลำดับความสำคัญและอยู่ก่อนหน้าคำขอได้ คิวที่มีขนาดใหญ่มากจะถูกจำกัดและรายงานด้วย `queuedAheadIsEstimate: true`
- เมื่อมีข้อมูล `report` จะมีส่วน `clawscan`, `skillspector`, `staticAnalysis` และ `virustotal`
- งานสแกนที่ล้มเหลวจะส่งคืน `status: "failed"` พร้อม `lastError`

### `GET /api/v1/skills/-/scan/{scanId}/download`

ปลายทางคลังรายงานที่ต้องผ่านการยืนยันตัวตน

- ต้องเป็นการสแกนที่สำเร็จแล้ว การสแกนที่ยังไม่สิ้นสุดจะส่งคืน `409`
- ส่งคืนไฟล์ ZIP ที่มี `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

ปลายทางคลังรายงานที่จัดเก็บไว้ซึ่งต้องผ่านการยืนยันตัวตน สำหรับเวอร์ชันที่ส่งแล้ว

- ต้องมีสิทธิ์จัดการของเจ้าของ/ผู้เผยแพร่สำหรับสกิลหรือปลั๊กอิน หรืออำนาจผู้ดูแล/ผู้ดูแลระบบของแพลตฟอร์ม
- ส่งคืนผลการสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งมานั้นโดยตรง รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อน
- `kind` มีค่าเริ่มต้นเป็น `skill`; ใช้ `kind=plugin` สำหรับการสแกนปลั๊กอิน/แพ็กเกจ
- ส่งคืนไฟล์ ZIP ที่มีโครงสร้างเดียวกับการดาวน์โหลดคำขอสแกน

### `POST /api/v1/skills/-/scan/batch`

เส้นทางมาตรฐานสำหรับสแกนซ้ำแบบกลุ่มที่ใช้ได้เฉพาะผู้ดูแลระบบ โดยยอมรับเพย์โหลดที่มีโครงสร้างเดียวกับ `POST /api/v1/skills/-/rescan-batch` แบบเดิม

### `POST /api/v1/skills/-/scan/batch/status`

เส้นทางมาตรฐานสำหรับสถานะแบบกลุ่มที่ใช้ได้เฉพาะผู้ดูแลระบบ โดยยอมรับ `{ "jobIds": ["..."] }` และส่งคืนตัวนับรวมแบบเดียวกับ `POST /api/v1/skills/-/rescan-batch/status` แบบเดิม

### `GET /api/v1/skills/{slug}/verify`

ส่งคืนซองข้อมูลการยืนยันการ์ดสกิลที่ `clawhub skill verify` ใช้

พารามิเตอร์การค้นหา:

- `version` (ไม่บังคับ): สตริงเวอร์ชันที่ระบุ
- `tag` (ไม่บังคับ): แปลงแท็กเป็นเวอร์ชัน (ตัวอย่างเช่น `latest`)

หมายเหตุ:

- `ok` จะเป็น `true` เฉพาะเมื่อเวอร์ชันที่เลือกมีการ์ดสกิลที่สร้างแล้ว ไม่ได้ถูกการควบคุมบล็อกเนื่องจากมัลแวร์ และผลการยืนยัน ClawScan สะอาด
- ข้อมูลระบุตัวตนของสกิล ข้อมูลระบุตัวตนของผู้เผยแพร่ และข้อมูลเมตาของเวอร์ชันที่เลือกเป็นฟิลด์ระดับบนสุดของซองข้อมูล (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) เพื่อให้ระบบอัตโนมัติของเชลล์อ่านได้โดยไม่ต้องแกะตัวห่อหุ้มแบบซ้อน
- `security` คือคำตัดสิน ClawScan/ความปลอดภัยระดับบนสุด ระบบอัตโนมัติควรใช้ `ok`, `decision`, `reasons` และ `security.status` เป็นหลัก
- `security.signals` มีหลักฐานสนับสนุนจากเครื่องสแกน เช่น `staticScan`, `virusTotal` และ `skillSpector`
- คง `security.signals.dependencyRegistry` ไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่ยกเลิกเครื่องสแกนตรวจสอบการมีอยู่ในรีจิสทรีของการขึ้นต่อกันแล้ว และคีย์นี้จะเป็น `null` เสมอ
- `provenance` จะเป็น `server-resolved-github-import` เฉพาะเมื่อ ClawHub แปลงและจัดเก็บ repo/ref/commit/path ของ GitHub ระหว่างการเผยแพร่หรือนำเข้า มิฉะนั้นจะเป็น `unavailable`

### `POST /api/v1/skills/-/security-verdicts`

ส่งคืนคำตัดสินด้านความปลอดภัยแบบกระชับในปัจจุบันสำหรับเวอร์ชันสกิลที่ระบุโดยตรง ปลายทาง
คอลเลกชันนี้มีไว้สำหรับไคลเอนต์ที่ทราบอยู่แล้วว่าต้องแสดงเวอร์ชันใดของสกิล
ClawHub ที่ติดตั้งไว้ เช่น OpenClaw Control UI

คำขอ:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

หมายเหตุ:

- `items` ต้องมีคู่ `{ slug, version }` ที่ไม่ซ้ำกันจำนวน 1-100 คู่
- ผลลัพธ์แยกตามแต่ละรายการ การไม่พบสกิลหรือเวอร์ชันหนึ่งรายการไม่ทำให้การตอบกลับทั้งหมดล้มเหลว
- การตอบกลับมีเฉพาะข้อมูลความปลอดภัย โดยไม่มีข้อมูลการ์ดสกิล สถานะการ์ดที่สร้างแล้ว รายการไฟล์อาร์ติแฟกต์ หรือเพย์โหลดโดยละเอียดของเครื่องสแกน
- `security.signals` มีเฉพาะหลักฐานสนับสนุนระดับสถานะ ใช้ `/scan` หรือหน้าการตรวจสอบความปลอดภัยของ ClawHub สำหรับรายละเอียดทั้งหมดของเครื่องสแกน
- คง `security.signals.dependencyRegistry` ไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่ยกเลิกเครื่องสแกนตรวจสอบการมีอยู่ในรีจิสทรีของการขึ้นต่อกันแล้ว และคีย์นี้จะเป็น `null` เสมอ
- การไม่มีการ์ดสกิลไม่ส่งผลต่อ `ok`, `decision` หรือ `reasons` ของปลายทางนี้ ไคลเอนต์ควรอ่าน `skill-card.md` ที่ติดตั้งไว้ภายในเครื่องเมื่อต้องการเนื้อหาของการ์ด
- ใช้ `/verify` เมื่อต้องการซองข้อมูลการยืนยันการ์ดสกิลสำหรับสกิลเดียว ใช้ `/card` เมื่อต้องการ Markdown ของการ์ดที่สร้างแล้ว และใช้ `/scan` เมื่อต้องการข้อมูลโดยละเอียดของเครื่องสแกน

การตอบกลับ:

```json
{
  "schema": "clawhub.skill.security-verdicts.v1",
  "items": [
    {
      "ok": true,
      "decision": "pass",
      "reasons": [],
      "requestedSlug": "gifgrep",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "publisherHandle": "steipete",
      "publisherDisplayName": "Peter",
      "requestedVersion": "1.2.3",
      "version": "1.2.3",
      "createdAt": 0,
      "checkedAt": 0,
      "skillUrl": "https://clawhub.ai/steipete/skills/gifgrep",
      "securityAuditUrl": "https://clawhub.ai/steipete/skills/gifgrep/security-audit?version=1.2.3",
      "security": {
        "status": "clean",
        "passed": true,
        "signals": {
          "staticScan": { "status": "clean", "reasonCodes": [] },
          "virusTotal": null,
          "skillSpector": null,
          "dependencyRegistry": null
        }
      }
    },
    {
      "ok": false,
      "decision": "fail",
      "reasons": ["version.not_found"],
      "requestedSlug": "missing-version",
      "requestedVersion": "1.0.0",
      "error": { "code": "version_not_found", "message": "Version not found" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

ส่งคืนเนื้อหาข้อความดิบ

พารามิเตอร์การค้นหา:

- `path` (บังคับ)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือเวอร์ชันล่าสุด
- ขีดจำกัดขนาดไฟล์: 200KB

### `GET /api/v1/packages`

ปลายทางแค็ตตาล็อกแบบรวมสำหรับ:

- สกิล
- ปลั๊กอินโค้ด
- ปลั๊กอินบันเดิล

พารามิเตอร์การค้นหา:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended`, `trending`, `downloads`, นามแฝงแบบเดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ปลั๊กอิน รองรับเฉพาะเมื่อ
  คำขอจำกัดขอบเขตไว้ที่แพ็กเกจปลั๊กอิน (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` หรือปลายทางแพ็กเกจที่มี
  `family=code-plugin`/`family=bundle-plugin`) หมวดหมู่ที่ควบคุมและ
  นามแฝงตัวกรอง v1 แบบเดิมมีเอกสารอยู่ภายใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` หรือ `sort` จะส่งคืน `400` ระบบจะละเว้นพารามิเตอร์การค้นหาที่ไม่รู้จัก
- `GET /api/v1/code-plugins` และ `GET /api/v1/bundle-plugins` ยังคงเป็นนามแฝงของกลุ่มประเภทตายตัว
- รายการสกิลยังคงใช้รีจิสทรีสกิลเป็นแหล่งข้อมูล และยังเผยแพร่ได้ผ่าน `POST /api/v1/skills` เท่านั้น
- `POST /api/v1/packages` ยังคงใช้สำหรับรีลีสปลั๊กอินโค้ดและปลั๊กอินบันเดิลเท่านั้น
- ผู้เรียกที่ไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการยืนยันตัวตนจะเห็นแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดในผลลัพธ์รายการ/การค้นหา
- `channel=private` ส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกซึ่งผ่านการยืนยันตัวตนมีสิทธิ์อ่าน

### `GET /api/v1/packages/search`

การค้นหาแค็ตตาล็อกแบบรวมสำหรับสกิล + แพ็กเกจปลั๊กอิน

พารามิเตอร์การค้นหา:

- `q` (จำเป็น): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอจำกัดขอบเขตไว้ที่แพ็กเกจ Plugin หมวดหมู่ที่ควบคุมและนามแฝงตัวกรอง
  v1 แบบเดิมมีการบันทึกไว้ภายใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured` หรือ
  `highlightedOnly` จะส่งคืน `400` ระบบจะเพิกเฉยต่อพารามิเตอร์คำค้นที่ไม่รู้จัก
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถค้นหาแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดได้
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกซึ่งผ่านการยืนยันตัวตนมีสิทธิ์อ่าน

### `GET /api/v1/plugins`

เรียกดูแค็ตตาล็อกเฉพาะ Plugin ครอบคลุมแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์คำค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `recommended` (ค่าเริ่มต้น), `trending`, `downloads`, `updated`, นามแฝงแบบเดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

ปลายทางการอ่านยังคงยอมรับนามแฝงตัวกรอง v1 แบบเดิม:

- `mcp-tooling`, `data` และ `automation` จะได้รับการแปลงเป็น `tools`
- `observability` และ `deployment` จะได้รับการแปลงเป็น `gateway`
- `dev-tools` จะได้รับการแปลงเป็น `runtime`

`trending` เป็นกระดานผู้นำการติดตั้ง/ดาวน์โหลดช่วงเจ็ดวัน และไม่ได้ใช้ยอดรวมตลอดเวลา
ในปลายทางรวม `/api/v1/packages` ค่านี้ใช้เฉพาะกับ Plugin ให้ใช้
`/api/v1/skills?sort=trending` สำหรับแค็ตตาล็อก Skills

ระบบไม่ยอมรับนามแฝงแบบเดิมเป็นค่าหมวดหมู่ที่จัดเก็บหรือผู้เขียนประกาศ

### `GET /api/v1/skills/export`

ส่งออก Skills สาธารณะล่าสุดจำนวนมากสำหรับการวิเคราะห์แบบออฟไลน์

การยืนยันตัวตน:

- ต้องใช้โทเค็น API

พารามิเตอร์คำค้น:

- `startDate` (จำเป็น): ขอบเขตล่างเป็นมิลลิวินาที Unix สำหรับ `updatedAt` ของ Skills
- `endDate` (จำเป็น): ขอบเขตบนเป็นมิลลิวินาที Unix สำหรับ `updatedAt` ของ Skills
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250) ค่าเริ่มต้นคือ `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าจากการตอบกลับก่อนหน้า

การตอบกลับ:

- เนื้อหา: ไฟล์เก็บถาวร ZIP
- Skills แต่ละรายการที่ส่งออกมีรากอยู่ที่ `{publisher}/{slug}/`
- Skills ที่โฮสต์จะรวมไฟล์เวอร์ชันล่าสุดที่จัดเก็บ และแสดงรายการใน
  `_manifest.json` พร้อม `sourceRef: "public-clawhub"`
- Skills ปัจจุบันที่ใช้ GitHub และมีการสแกน `clean` หรือ `suspicious` จะรวม
  `_source_handoff.json` พร้อม `sourceRef: "public-github"`, repo, commit, path,
  แฮชเนื้อหา และ URL ไฟล์เก็บถาวร โดยจะไม่รวมไฟล์ต้นฉบับที่โฮสต์บน ClawHub
- Skills แต่ละรายการจะรวม `_export_skill_meta.json`
- `_manifest.json` จะรวมอยู่ที่ราก ZIP เสมอ
- `_errors.json` จะรวมอยู่ด้วยเมื่อไม่สามารถส่งออก Skills หรือไฟล์
  บางรายการได้

ส่วนหัว:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

ส่งออกรุ่น Plugin สาธารณะล่าสุดจำนวนมากสำหรับการวิเคราะห์แบบออฟไลน์

การยืนยันตัวตน:

- ต้องใช้โทเค็น API

พารามิเตอร์คำค้น:

- `startDate` (จำเป็น): ขอบเขตล่างเป็นมิลลิวินาที Unix สำหรับ `updatedAt` ของ Plugin
- `endDate` (จำเป็น): ขอบเขตบนเป็นมิลลิวินาที Unix สำหรับ `updatedAt` ของ Plugin
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250) ค่าเริ่มต้นคือ `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าจากการตอบกลับก่อนหน้า
- `family` (ไม่บังคับ): `code-plugin` หรือ `bundle-plugin` หากละไว้หมายถึง
  Plugin ทั้งสองตระกูล

การตอบกลับ:

- เนื้อหา: ไฟล์เก็บถาวร ZIP
- Plugin แต่ละรายการที่ส่งออกมีรากอยู่ที่ `{family}/{packageName}/`
- Plugin แต่ละรายการที่ส่งออกจะรวมไฟล์ที่จัดเก็บของรุ่นล่าสุด
- ข้อมูลเมตาการส่งออกของแต่ละ Plugin จัดเก็บไว้ที่
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`
- `_manifest.json` จะรวมอยู่ที่ราก ZIP เสมอ
- `_errors.json` จะรวมอยู่ด้วยเมื่อไม่สามารถส่งออก Plugin หรือไฟล์
  บางรายการได้

ส่วนหัว:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

ค้นหาเฉพาะ Plugin ครอบคลุมแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์คำค้น:

- `q` (จำเป็น): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

หมายเหตุ:

- ระบบยังยอมรับนามแฝงตัวกรอง v1 แบบเดิมที่บันทึกไว้ภายใต้ `GET /api/v1/plugins`
- การกรองหมวดหมู่เป็นตัวกรอง API จริงที่รองรับโดยแถวไดเจสต์หมวดหมู่
  Plugin ไม่ใช่การเขียนคำค้นใหม่
- ผลลัพธ์จะส่งคืนตามลำดับความเกี่ยวข้อง และปัจจุบันไม่มีการแบ่งหน้า
- ตัวควบคุมการเรียงลำดับใน UI เบราว์เซอร์สำหรับการค้นหา Plugin จะเรียงผลลัพธ์
  ความเกี่ยวข้องที่โหลดแล้วใหม่ ให้สอดคล้องกับพฤติกรรมการเรียกดู `/skills` ปัจจุบัน

### `GET /api/v1/packages/{name}`

ส่งคืนข้อมูลเมตารายละเอียดแพ็กเกจ

หมายเหตุ:

- Skills สามารถแปลงผ่านเส้นทางนี้ในแค็ตตาล็อกรวมได้เช่นกัน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกมีสิทธิ์อ่านผู้เผยแพร่ที่เป็นเจ้าของ

### `DELETE /api/v1/packages/{name}`

ลบแพ็กเกจและรุ่นทั้งหมดแบบไม่ถาวร

หมายเหตุ:

- ต้องใช้โทเค็น API ของเจ้าของแพ็กเกจ เจ้าของ/ผู้ดูแลระบบขององค์กรผู้เผยแพร่
  ผู้ควบคุมแพลตฟอร์ม หรือผู้ดูแลระบบแพลตฟอร์ม

### `GET /api/v1/packages/{name}/versions`

ส่งคืนประวัติเวอร์ชัน

พารามิเตอร์คำค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

หมายเหตุ:

- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกมีสิทธิ์อ่านผู้เผยแพร่ที่เป็นเจ้าของ

### `GET /api/v1/packages/{name}/versions/{version}`

ส่งคืนแพ็กเกจหนึ่งเวอร์ชัน รวมถึงข้อมูลเมตาไฟล์ ความเข้ากันได้
การตรวจสอบยืนยัน ข้อมูลเมตาอาร์ติแฟกต์ และข้อมูลการสแกน

หมายเหตุ:

- `version.artifact.kind` คือ `legacy-zip` สำหรับไฟล์เก็บถาวรแพ็กเกจแบบเดิม หรือ
  `npm-pack` สำหรับรุ่นที่ใช้ ClawPack
- รุ่น ClawPack จะรวมฟิลด์ `npmIntegrity`, `npmShasum` และ
  `npmTarballName` ที่เข้ากันได้กับ npm
- `version.sha256hash` คือข้อมูลเมตาความเข้ากันได้ที่เลิกใช้แล้วสำหรับไคลเอนต์เก่า โดย
  จะแฮชไบต์ ZIP ที่ส่งคืนจาก `/api/v1/packages/{name}/download` อย่างตรงกันทุกประการ
  ไคลเอนต์สมัยใหม่ควรใช้ `version.artifact.sha256` ซึ่งระบุ
  อาร์ติแฟกต์รุ่นมาตรฐาน
- `version.vtAnalysis`, `version.llmAnalysis` และ `version.staticScan` จะ
  รวมอยู่เมื่อมีข้อมูลการสแกน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกมีสิทธิ์อ่านผู้เผยแพร่ที่เป็นเจ้าของ

### `GET /api/v1/packages/{name}/versions/{version}/security`

ส่งคืนสรุปความปลอดภัยและความน่าเชื่อถือของรุ่นแพ็กเกจอย่างตรงกันสำหรับไคลเอนต์
ติดตั้ง นี่คือพื้นผิวการใช้งาน OpenClaw สาธารณะสำหรับตัดสินใจว่า
สามารถติดตั้งรุ่นที่แปลงแล้วได้หรือไม่

การยืนยันตัวตน:

- ปลายทางการอ่านสาธารณะ ไม่จำเป็นต้องใช้โทเค็นของเจ้าของ ผู้เผยแพร่ ผู้ควบคุม
  หรือผู้ดูแลระบบ

การตอบกลับ:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin"
  },
  "release": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "artifactSha256": "0123456789abcdef...",
    "npmIntegrity": "sha512-...",
    "npmShasum": "0123456789abcdef0123456789abcdef01234567",
    "npmTarballName": "example-plugin-1.2.3.tgz",
    "createdAt": 1730000000000
  },
  "trust": {
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious"],
    "pending": false,
    "stale": false
  }
}
```

ฟิลด์การตอบกลับ:

- `package.name`, `package.displayName` และ `package.family` ระบุ
  แพ็กเกจรีจิสทรีที่แปลงแล้ว
- `release.releaseId`, `release.version` และ `release.createdAt` ระบุ
  รุ่นที่ได้รับการประเมินอย่างตรงกัน
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` และ `release.npmTarballName` จะมีอยู่เมื่อทราบค่า
  สำหรับอาร์ติแฟกต์รุ่น
- `trust.scanStatus` คือสถานะความน่าเชื่อถือที่มีผล ซึ่งอนุมานจากอินพุตของตัวสแกน
  และการควบคุมรุ่นด้วยตนเอง
- `trust.moderationState` สามารถเป็นค่าว่างได้ โดยจะเป็น `null` เมื่อไม่มีการควบคุมรุ่น
  ด้วยตนเอง
- `trust.blockedFromDownload` คือสัญญาณบล็อกการติดตั้ง OpenClaw และไคลเอนต์
  ติดตั้งอื่นควรบล็อกการติดตั้งเมื่อค่านี้เป็น `true` แทนการ
  อนุมานกฎการบล็อกใหม่จากฟิลด์ตัวสแกนหรือการควบคุม
- `trust.reasons` คือรายการคำอธิบายสำหรับผู้ใช้และการตรวจสอบ รหัสเหตุผล
  เป็นสตริงสั้นกระชับที่เสถียร เช่น `manual:quarantined`, `scan:malicious`
  และ `package:malicious`
- `trust.pending` หมายความว่าอินพุตความน่าเชื่อถืออย่างน้อยหนึ่งรายการยังรอดำเนินการให้เสร็จ
- `trust.stale` หมายความว่าสรุปความน่าเชื่อถือคำนวณจากอินพุตที่ล้าสมัย และ
  ควรถือว่าจำเป็นต้องรีเฟรชก่อนตัดสินใจอนุญาตด้วยความมั่นใจสูง

หมายเหตุ:

- ปลายทางนี้เจาะจงเวอร์ชัน ไคลเอนต์ควรเรียกใช้หลังจากแปลง
  เวอร์ชันแพ็กเกจที่ตั้งใจจะติดตั้งแล้ว ไม่ใช่เพียงหลังจากอ่านข้อมูลเมตา
  แพ็กเกจล่าสุด
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกมีสิทธิ์อ่านผู้เผยแพร่ที่เป็นเจ้าของ
- ปลายทางนี้มีขอบเขตแคบกว่าปลายทางการควบคุมของเจ้าของ/ผู้ควบคุมโดยเจตนา
  โดยเปิดเผยการตัดสินใจติดตั้งและคำอธิบายสาธารณะ ไม่ใช่
  ตัวตนของผู้รายงาน เนื้อหารายงาน หลักฐานส่วนตัว หรือไทม์ไลน์การตรวจสอบ
  ภายใน

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

ส่งคืนข้อมูลเมตาตัวแปลงอาร์ติแฟกต์ที่ระบุอย่างชัดเจนสำหรับเวอร์ชันแพ็กเกจ

หมายเหตุ:

- เวอร์ชันแพ็กเกจแบบเดิมจะส่งคืนอาร์ติแฟกต์ `legacy-zip` และ
  `downloadUrl` ของ ZIP แบบเดิม
- เวอร์ชัน ClawPack จะส่งคืนอาร์ติแฟกต์ `npm-pack` ฟิลด์ความสมบูรณ์ของ npm
  `tarballUrl` และ URL ความเข้ากันได้ของ ZIP แบบเดิม
- นี่คือพื้นผิวตัวแปลงของ OpenClaw ซึ่งหลีกเลี่ยงการคาดเดารูปแบบไฟล์เก็บถาวรจาก
  URL ที่ใช้ร่วมกัน

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ดาวน์โหลดอาร์ติแฟกต์เวอร์ชันผ่านเส้นทางตัวแปลงที่ระบุอย่างชัดเจน

หมายเหตุ:

- เวอร์ชัน ClawPack สตรีมไบต์ npm-pack `.tgz` ที่อัปโหลดไว้ทุกประการ
- เวอร์ชัน ZIP แบบเดิมเปลี่ยนเส้นทางไปยัง `/api/v1/packages/{name}/download?version=`
- ใช้บักเก็ตอัตราการดาวน์โหลด

### `GET /api/v1/packages/{name}/readiness`

ส่งคืนความพร้อมที่คำนวณแล้วสำหรับการใช้งานโดย OpenClaw ในอนาคต

การตรวจสอบความพร้อมครอบคลุม:

- สถานะแชนเนลอย่างเป็นทางการ
- ความพร้อมใช้งานของเวอร์ชันล่าสุด
- ความพร้อมใช้งานของอาร์ติแฟกต์ npm-pack ของ ClawPack
- ไดเจสต์ของอาร์ติแฟกต์
- ที่มาของรีโพซิทอรีต้นทางและคอมมิต
- เมทาดาทาความเข้ากันได้กับ OpenClaw
- เป้าหมายโฮสต์
- สถานะการสแกน

การตอบกลับ:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Plugin ตัวอย่าง",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "อาร์ติแฟกต์ ClawPack",
      "status": "fail",
      "message": "เวอร์ชันล่าสุดเป็น ZIP แบบเดิมเท่านั้น"
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

เอ็นด์พอยต์สำหรับผู้ดูแลเพื่อแสดงรายการแถวการย้าย Plugin อย่างเป็นทางการของ OpenClaw

การยืนยันตัวตน:

- ต้องใช้โทเค็น API ของผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คำขอ:

- `phase` (ไม่บังคับ): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` หรือ
  `all` (ค่าเริ่มต้น)
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

การตอบกลับ:

```json
{
  "items": [
    {
      "migrationId": "officialPluginMigrations:...",
      "bundledPluginId": "core.search",
      "packageName": "@openclaw/search-plugin",
      "packageId": "packages:...",
      "owner": "platform",
      "sourceRepo": "openclaw/openclaw",
      "sourcePath": "plugins/search",
      "sourceCommit": "abc123",
      "phase": "blocked",
      "blockers": ["ขาด ClawPack"],
      "hostTargetsComplete": true,
      "scanClean": false,
      "moderationApproved": false,
      "runtimeBundlesReady": false,
      "notes": null,
      "createdAt": 1760000000000,
      "updatedAt": 1760000000000
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/migrations`

เอ็นด์พอยต์สำหรับผู้ดูแลระบบเพื่อสร้างหรืออัปเดตแถวการย้าย Plugin อย่างเป็นทางการ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API ของผู้ใช้ที่เป็นผู้ดูแลระบบ

เนื้อหาคำขอ:

```json
{
  "bundledPluginId": "core.search",
  "packageName": "@openclaw/search-plugin",
  "owner": "platform",
  "sourceRepo": "openclaw/openclaw",
  "sourcePath": "plugins/search",
  "sourceCommit": "abc123",
  "phase": "blocked",
  "blockers": ["ขาด ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "กำลังรอผู้ออกเผยแพร่อัปโหลด"
}
```

หมายเหตุ:

- `bundledPluginId` จะถูกปรับให้เป็นตัวพิมพ์เล็กและเป็นคีย์ upsert ที่คงที่
- `packageName` จะถูกปรับชื่อให้เป็นรูปแบบ npm โดยแพ็กเกจอาจยังไม่มีสำหรับการย้าย
  ที่วางแผนไว้
- ส่วนนี้ติดตามเฉพาะความพร้อมในการย้ายเท่านั้น โดยไม่แก้ไข OpenClaw หรือสร้าง
  ClawPack

### `GET /api/v1/packages/moderation/queue`

เอ็นด์พอยต์สำหรับผู้ดูแล/ผู้ดูแลระบบสำหรับคิวตรวจสอบรีลีสของแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API ของผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คำขอ:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `blocked`, `manual` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

ความหมายของสถานะ:

- `open`: รีลีสที่น่าสงสัย เป็นอันตราย รอดำเนินการ ถูกกักกัน ถูกเพิกถอน หรือถูกรายงาน
- `blocked`: รีลีสที่ถูกกักกัน ถูกเพิกถอน หรือเป็นอันตราย
- `manual`: รีลีสใดๆ ที่มีการแทนที่การกลั่นกรองด้วยตนเอง
- `all`: รีลีสใดๆ ที่มีการแทนที่ด้วยตนเอง สถานะการสแกนไม่สะอาด หรือมีรายงานแพ็กเกจ

การตอบกลับ:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Plugin ตัวอย่าง",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "การตรวจสอบด้วยตนเอง",
      "sourceRepo": "openclaw/example-plugin",
      "sourceCommit": "abc123",
      "reportCount": 2,
      "lastReportedAt": 1730000001000,
      "reasons": ["manual:quarantined", "scan:malicious", "reports:2"]
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/{name}/report`

รายงานแพ็กเกจให้ผู้ดูแลตรวจสอบ รายงานอยู่ในระดับแพ็กเกจและอาจ
เชื่อมโยงกับเวอร์ชันได้ รายงานเหล่านี้จะเข้าสู่คิวการกลั่นกรอง แต่จะไม่ซ่อนหรือ
บล็อกการดาวน์โหลดโดยอัตโนมัติ ผู้ดูแลควรใช้การกลั่นกรองรีลีสเพื่อ
อนุมัติ กักกัน หรือเพิกถอนอาร์ติแฟกต์

การยืนยันตัวตน:

- ต้องใช้โทเค็น API

คำขอ:

```json
{ "reason": "ไบนารีเนทีฟที่น่าสงสัย", "version": "1.2.3" }
```

การตอบกลับ:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "reportCount": 1
}
```

### `GET /api/v1/packages/reports`

เอ็นด์พอยต์สำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อรับรายงานแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API ของผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คำขอ:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `confirmed`, `dismissed` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

การตอบกลับ:

```json
{
  "items": [
    {
      "reportId": "packageReports:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Plugin ตัวอย่าง",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "ไบนารีเนทีฟที่น่าสงสัย",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "ผู้รายงาน"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `GET /api/v1/packages/{name}/moderation`

เอ็นด์พอยต์สำหรับเจ้าของ/ผู้ดูแลเพื่อดูสถานะการกลั่นกรองแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API ของเจ้าของแพ็กเกจ สมาชิกผู้เผยแพร่ ผู้ดูแล หรือ
  ผู้ใช้ที่เป็นผู้ดูแลระบบ

การตอบกลับ:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Plugin ตัวอย่าง",
    "family": "code-plugin",
    "channel": "community",
    "isOfficial": false,
    "reportCount": 2,
    "lastReportedAt": 1730000001000,
    "scanStatus": "malicious"
  },
  "latestRelease": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "moderationReason": "การตรวจสอบด้วยตนเอง",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

เอ็นด์พอยต์สำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อแก้ไขหรือเปิดรายงานแพ็กเกจอีกครั้ง

คำขอ:

```json
{
  "status": "confirmed",
  "note": "ตรวจสอบและกักกันรีลีสที่ได้รับผลกระทบแล้ว",
  "finalAction": "quarantine"
}
```

ต้องระบุ `note` สำหรับ `confirmed` และ `dismissed` โดยอาจละไว้ได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "quarantine"` หรือ
`finalAction: "revoke"` พร้อมรายงานที่ยืนยันแล้วเพื่อใช้การกลั่นกรองรีลีสใน
เวิร์กโฟลว์เดียวกันที่ตรวจสอบย้อนหลังได้

การตอบกลับ:

```json
{
  "ok": true,
  "reportId": "packageReports:...",
  "packageId": "packages:...",
  "status": "confirmed",
  "reportCount": 0
}
```

### `POST /api/v1/packages/{name}/versions/{version}/moderation`

เอ็นด์พอยต์สำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อตรวจสอบรีลีสของแพ็กเกจ

คำขอ:

```json
{ "state": "quarantined", "reason": "เพย์โหลดเนทีฟที่น่าสงสัย" }
```

สถานะที่รองรับ:

- `approved`: ตรวจสอบด้วยตนเองและอนุญาตแล้ว
- `quarantined`: ถูกบล็อกระหว่างรอการติดตามผล
- `revoked`: ถูกบล็อกหลังจากรีลีสเคยได้รับความเชื่อถือ

รีลีสที่ถูกกักกันและเพิกถอนจะส่งคืน `403` จากเส้นทางดาวน์โหลดอาร์ติแฟกต์
ทุกการเปลี่ยนแปลงจะเขียนรายการลงในบันทึกการตรวจสอบ

### `GET /api/v1/packages/{name}/file`

ส่งคืนเนื้อหาข้อความดิบของไฟล์ในแพ็กเกจ

พารามิเตอร์คำขอ:

- `path` (จำเป็น)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ใช้รีลีสล่าสุดเป็นค่าเริ่มต้น
- ใช้บักเก็ตอัตราการอ่าน ไม่ใช่บักเก็ตการดาวน์โหลด
- ไฟล์ไบนารีจะส่งคืน `415`
- ขีดจำกัดขนาดไฟล์: 200KB
- การสแกน VirusTotal ที่รอดำเนินการจะไม่บล็อกการอ่าน แต่รีลีสที่เป็นอันตรายอาจยังถูกระงับไว้ในส่วนอื่น
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านข้อมูลของผู้เผยแพร่ที่เป็นเจ้าของได้

### `GET /api/v1/packages/{name}/download`

ดาวน์โหลดไฟล์เก็บถาวร ZIP แบบกำหนดผลลัพธ์แน่นอนรุ่นเดิมสำหรับรีลีสของแพ็กเกจ

พารามิเตอร์คำขอ:

- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ใช้รีลีสล่าสุดเป็นค่าเริ่มต้น
- Skills เปลี่ยนเส้นทางไปยัง `GET /api/v1/download`
- ไฟล์เก็บถาวรของ Plugin/แพ็กเกจเป็นไฟล์ zip ที่มีรูท `package/` เพื่อให้ไคลเอนต์ OpenClaw
  รุ่นเก่ายังคงทำงานได้
- เส้นทางนี้รองรับเฉพาะ ZIP เท่านั้น และไม่สตรีมไฟล์ ClawPack `.tgz`
- การตอบกลับมีส่วนหัว `ETag`, `Digest`, `X-ClawHub-Artifact-Type` และ
  `X-ClawHub-Artifact-Sha256` สำหรับการตรวจสอบความสมบูรณ์ของตัวแก้ไข
- เมทาดาทาที่ใช้เฉพาะในรีจิสทรีจะไม่ถูกแทรกลงในไฟล์เก็บถาวรที่ดาวน์โหลด
- การสแกน VirusTotal ที่รอดำเนินการจะไม่บล็อกการดาวน์โหลด แต่รีลีสที่เป็นอันตรายจะส่งคืน `403`
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะเป็นเจ้าของ

### `GET /api/npm/{package}`

ส่งคืน packument ที่เข้ากันได้กับ npm สำหรับเวอร์ชันแพ็กเกจที่มี ClawPack รองรับ

หมายเหตุ:

- แสดงรายการเฉพาะเวอร์ชันที่มี tarball npm-pack ของ ClawPack อัปโหลดไว้แล้ว
- เวอร์ชันที่มีเฉพาะ ZIP แบบเดิมจะถูกละไว้โดยตั้งใจ
- `dist.tarball`, `dist.integrity` และ `dist.shasum` ใช้ฟิลด์ที่เข้ากันได้กับ npm
  เพื่อให้ผู้ใช้สามารถกำหนดให้ npm ชี้ไปยังมิเรอร์ได้หากต้องการ
- packument ของแพ็กเกจแบบมีขอบเขตรองรับทั้ง `/api/npm/@scope/name` และพาธคำขอ
  `/api/npm/@scope%2Fname` ที่เข้ารหัสตามรูปแบบของ npm

### `GET /api/npm/{package}/-/{tarball}.tgz`

สตรีมไบต์ tarball ของ ClawPack ที่อัปโหลดไว้ทุกประการสำหรับไคลเอนต์มิเรอร์ npm

หมายเหตุ:

- ใช้บักเก็ตอัตราการดาวน์โหลด
- ส่วนหัวการดาวน์โหลดมี SHA-256 ของ ClawHub รวมถึงเมทาดาทา integrity/shasum ของ npm
- ยังคงใช้การตรวจสอบการกลั่นกรองและสิทธิ์เข้าถึงแพ็กเกจส่วนตัว

### `GET /api/v1/resolve`

CLI ใช้เพื่อจับคู่ลายนิ้วมือภายในเครื่องกับเวอร์ชันที่รู้จัก

พารามิเตอร์คำขอ:

- `slug` (จำเป็น)
- `hash` (จำเป็น): sha256 เลขฐานสิบหก 64 อักขระของลายนิ้วมือบันเดิล

การตอบกลับ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ดาวน์โหลด ZIP ของเวอร์ชัน Skills ที่โฮสต์ไว้ หรือส่งคืนการส่งต่อไปยังซอร์ส GitHub สำหรับ
Skills ปัจจุบันที่ใช้ GitHub เป็นแบ็กเอนด์ ซึ่งมีการสแกน `clean` หรือ `suspicious` และไม่มีเวอร์ชัน
ที่โฮสต์ไว้

พารามิเตอร์คำขอ:

- `slug` (จำเป็น)
- `version` (ไม่บังคับ): สตริง semver
- `tag` (ไม่บังคับ): ชื่อแท็ก (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` ระบบจะใช้เวอร์ชันล่าสุด
- เวอร์ชันที่ลบแบบซอฟต์จะส่งคืน `410`
- การส่งต่อ Skills ที่มี GitHub เป็นแบ็กเอนด์จะไม่พร็อกซีหรือทำสำเนาไบต์ การตอบกลับ JSON
  ประกอบด้วย `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  และ `archiveUrl`; สถานะการสแกน/สถานะปัจจุบันเป็นเงื่อนไขผ่านและไม่รวมอยู่ในข้อมูลเมตา
  ของเพย์โหลดเมื่อสำเร็จ
- สถิติการดาวน์โหลดนับตามข้อมูลประจำตัวที่ไม่ซ้ำกันต่อวันตาม UTC (`userId` เมื่อโทเค็น API ถูกต้อง มิฉะนั้นใช้ IP)

## เอนด์พอยต์การยืนยันตัวตน (โทเค็น Bearer)

เอนด์พอยต์ทั้งหมดกำหนดให้มี:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

ตรวจสอบความถูกต้องของโทเค็นและส่งคืนแฮนเดิลของผู้ใช้

### `POST /api/v1/skills`

เผยแพร่เวอร์ชันใหม่

- แนะนำให้ใช้: `multipart/form-data` พร้อม JSON `payload` + บล็อบ `files[]`
- รองรับเนื้อหา JSON ที่มี `files` (อิงตาม storageId) เช่นกัน
- ฟิลด์เพย์โหลดที่ไม่บังคับ: `ownerHandle` เมื่อระบุไว้ API จะค้นหา
  ผู้เผยแพร่รายนั้นที่ฝั่งเซิร์ฟเวอร์และกำหนดให้ผู้ดำเนินการมีสิทธิ์เข้าถึงผู้เผยแพร่
- ฟิลด์เพย์โหลดที่ไม่บังคับ: `migrateOwner` เมื่อ `true` พร้อม `ownerHandle`
  Skill ที่มีอยู่สามารถย้ายไปยังเจ้าของรายนั้นได้ หากผู้ดำเนินการเป็นผู้ดูแลระบบ/เจ้าของของทั้ง
  ผู้เผยแพร่ปัจจุบันและผู้เผยแพร่เป้าหมาย หากไม่เลือกใช้ตัวเลือกนี้
  ระบบจะปฏิเสธการเปลี่ยนเจ้าของ

### `POST /api/v1/packages`

เผยแพร่รุ่นของ Plugin แบบโค้ดหรือ Plugin แบบบันเดิล

- ต้องยืนยันตัวตนด้วยโทเค็น Bearer
- ต้องมี `multipart/form-data`
- ฟิลด์ฟอร์มที่อนุญาตคือ `payload`, บล็อบ `files` ที่ระบุซ้ำ หรือข้อมูลอ้างอิง tarball `clawpack` หนึ่งรายการ
  `clawpack` อาจเป็นบล็อบ `.tgz` หรือรหัสพื้นที่จัดเก็บที่ส่งคืนจาก
  ขั้นตอน upload-url การเผยแพร่ด้วยรหัสพื้นที่จัดเก็บที่พักไว้ต้องระบุ
  `clawpackUploadTicket` ที่ส่งคืนมาพร้อม URL อัปโหลดนั้นด้วย
- ใช้ `files` หรือ `clawpack` อย่างใดอย่างหนึ่งเท่านั้น ห้ามใช้ทั้งสองอย่างในคำขอเดียวกัน
- ระบบจะปฏิเสธเนื้อหา JSON และข้อมูลเมตา `payload.files` / `payload.artifact`
  ที่ผู้เรียกระบุเอง
- คำขอเผยแพร่แบบ multipart โดยตรงจำกัดไว้ที่ 18MB ส่วน tarball ของ ClawPack
  สามารถใช้ขั้นตอน upload-url ได้จนถึงขีดจำกัด tarball 120MB
- ฟิลด์เพย์โหลดที่ไม่บังคับ: `ownerHandle` เมื่อระบุไว้ เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเผยแพร่ในนามของเจ้าของรายนั้นได้

ประเด็นสำคัญในการตรวจสอบความถูกต้อง:

- `family` ต้องเป็น `code-plugin` หรือ `bundle-plugin`
- แพ็กเกจ Plugin ต้องมี `openclaw.plugin.json` การอัปโหลด `.tgz` ของ ClawPack ต้อง
  มีรายการนี้ที่ `package/openclaw.plugin.json`
- Plugin แบบโค้ดต้องมี `package.json`, ข้อมูลเมตาของที่เก็บซอร์ส, ข้อมูลเมตาของคอมมิตซอร์ส,
  ข้อมูลเมตาของสคีมาการกำหนดค่า, `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion`
- `openclaw.hostTargets` และ `openclaw.environment` เป็นข้อมูลเมตาที่ไม่บังคับ
- เฉพาะผู้เผยแพร่องค์กร `openclaw` และผู้เผยแพร่ส่วนบุคคลของสมาชิกองค์กร `openclaw` ปัจจุบัน
  เท่านั้นที่สามารถเผยแพร่ไปยังช่องทาง `official` ได้
- การเผยแพร่ในนามบุคคลอื่นยังคงตรวจสอบสิทธิ์ในการใช้ช่องทางอย่างเป็นทางการกับบัญชีเจ้าของเป้าหมาย

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

ลบแบบซอฟต์ / กู้คืน Skill (เจ้าของ ผู้ควบคุม หรือผู้ดูแลระบบ)

เนื้อหา JSON ที่ไม่บังคับ:

```json
{ "reason": "พักไว้เพื่อการควบคุมเนื้อหาระหว่างรอการตรวจสอบทางกฎหมาย" }
```

เมื่อระบุไว้ ระบบจะจัดเก็บ `reason` เป็นบันทึกการควบคุมของ Skill และคัดลอกไปยังบันทึกการตรวจสอบ
การลบแบบซอฟต์ที่เจ้าของเป็นผู้เริ่มจะสงวน slug ไว้ 30 วัน จากนั้นผู้เผยแพร่รายอื่น
สามารถอ้างสิทธิ์ slug ได้ การตอบกลับการลบจะมี `slugReservedUntil` เมื่อมีการหมดอายุนี้
การซ่อนโดยผู้ควบคุม/ผู้ดูแลระบบและการนำออกด้วยเหตุผลด้านความปลอดภัยจะไม่หมดอายุในลักษณะนี้

การตอบกลับการลบ:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

รหัสสถานะ:

- `200`: สำเร็จ
- `401`: ไม่ได้รับอนุญาต
- `403`: ถูกห้าม
- `404`: ไม่พบ Skill/ผู้ใช้
- `500`: ข้อผิดพลาดภายในเซิร์ฟเวอร์

### `POST /api/v1/users/publisher`

สำหรับผู้ดูแลระบบเท่านั้น ตรวจสอบให้แน่ใจว่ามีผู้เผยแพร่องค์กรสำหรับแฮนเดิล หากแฮนเดิลยังชี้ไปยัง
ผู้ใช้ร่วม/ผู้เผยแพร่ส่วนบุคคลแบบเดิม เอนด์พอยต์จะย้ายข้อมูลดังกล่าวไปเป็นผู้เผยแพร่องค์กรก่อน
สำหรับองค์กรที่สร้างใหม่ ให้ระบุ `memberHandle`; ระบบจะไม่เพิ่มผู้ดูแลระบบที่ดำเนินการเป็นสมาชิก
ค่าเริ่มต้นของ `memberRole` คือ `owner`

- เนื้อหา: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- การตอบกลับ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

การสร้างผู้เผยแพร่องค์กรด้วยตนเองโดยผ่านการยืนยันตัวตน สร้างผู้เผยแพร่องค์กรใหม่และเพิ่ม
ผู้เรียกเป็นเจ้าของ เอนด์พอยต์นี้ไม่ย้ายแฮนเดิลผู้ใช้/ส่วนบุคคลที่มีอยู่ และไม่
ทำเครื่องหมายผู้เผยแพร่ว่าน่าเชื่อถือ/เป็นทางการ

- เนื้อหา: `{ "handle": "opik", "displayName": "Opik" }`
- การตอบกลับ: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- ส่งคืน `409` เมื่อแฮนเดิลถูกใช้โดยผู้เผยแพร่ ผู้ใช้ หรือผู้เผยแพร่ส่วนบุคคลแล้ว

### `POST /api/v1/users/reserve`

สำหรับผู้ดูแลระบบเท่านั้น สงวน slug ระดับรูทและชื่อแพ็กเกจให้เจ้าของที่มีสิทธิ์โดยไม่เผยแพร่
รุ่น ชื่อแพ็กเกจจะกลายเป็นแพ็กเกจตัวแทนแบบส่วนตัวที่ไม่มีแถวรุ่น เพื่อให้เจ้าของรายเดิม
สามารถเผยแพร่รุ่นจริงของ Plugin แบบโค้ดหรือ Plugin แบบบันเดิลไปยังชื่อนั้นได้ภายหลัง

- เนื้อหา: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- การตอบกลับ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

สำหรับผู้ดูแลระบบเท่านั้น กู้คืนผู้เผยแพร่ส่วนบุคคลให้ตัวตนหลัก GitHub OAuth ทดแทนที่ผ่านการตรวจสอบแล้ว
โดยไม่แก้ไขแถวบัญชี Convex Auth คำขอต้องระบุรหัสบัญชีผู้ให้บริการ GitHub ที่เปลี่ยนแปลงไม่ได้ทั้งสองรายการ
ส่วนแฮนเดิลที่เปลี่ยนแปลงได้ใช้เป็นเพียงเงื่อนไขป้องกันสำหรับผู้ปฏิบัติงาน

ค่าเริ่มต้นของเอนด์พอยต์คือการทดลองทำ การใช้การกู้คืนจริงต้องมี `dryRun: false` และ
`confirmIdentityVerified: true` หลังจากเจ้าหน้าที่ตรวจสอบความต่อเนื่องระหว่าง
ตัวตนหลัก GitHub ทั้งสองอย่างเป็นอิสระ การกู้คืนจะล้มเหลวแบบปิด หากผู้เผยแพร่ส่วนบุคคลปัจจุบัน
ของผู้ใช้ปลายทางมี Skills, แพ็กเกจ หรือซอร์ส Skill จาก GitHub
การกู้คืนยังย้ายฟิลด์ `ownerUserId` แบบเดิมสำหรับ Skills ของผู้เผยแพร่ที่กู้คืน,
นามแฝง slug ของ Skill, แพ็กเกจ, คำเตือนจากตัวตรวจสอบแพ็กเกจ และแถวไดเจสต์การค้นหาที่สืบทอดมา เพื่อให้
เส้นทางเจ้าของโดยตรงสอดคล้องกับอำนาจของผู้เผยแพร่รายใหม่ การสงวนแฮนเดิลที่มีการป้องกันซึ่งยังใช้งานอยู่
สำหรับแฮนเดิลที่กู้คืนจะถูกกำหนดใหม่ให้ผู้ใช้ทดแทนด้วย เพื่อให้การซิงโครไนซ์โปรไฟล์ในภายหลัง
ไม่สามารถคืนอำนาจที่แข่งขันกันของผู้ใช้เดิมได้ แต่ละตารางหลักจำกัดไว้ที่
100 แถวต่อธุรกรรมการใช้งาน การกู้คืนที่ใหญ่กว่านี้ต้องใช้การย้ายเจ้าของแบบดำเนินการต่อได้ก่อน
ซอร์ส Skill จาก GitHub มีขอบเขตตามผู้เผยแพร่และจะถูกรายงานว่าตรวจสอบแล้วแทนที่จะถูกเขียนใหม่

- เนื้อหา: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- การตอบกลับ: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### เอนด์พอยต์การจัดการ slug ของเจ้าของ

- `POST /api/v1/skills/{slug}/rename`
  - เนื้อหา: `{ "newSlug": "new-canonical-slug" }`
  - การตอบกลับ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - เนื้อหา: `{ "targetSlug": "canonical-target-slug" }`
  - การตอบกลับ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

หมายเหตุ:

- เอนด์พอยต์ทั้งสองต้องยืนยันตัวตนด้วยโทเค็น API และใช้ได้เฉพาะกับเจ้าของ Skill เท่านั้น
- `rename` จะเก็บ slug ก่อนหน้าไว้เป็นนามแฝงสำหรับเปลี่ยนเส้นทาง
- `merge` จะซ่อนรายการต้นทางและเปลี่ยนเส้นทาง slug ต้นทางไปยังรายการเป้าหมาย

### เอนด์พอยต์การโอนความเป็นเจ้าของ

- `POST /api/v1/skills/{slug}/transfer`
  - เนื้อหา: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - การตอบกลับ: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - การตอบกลับ (ยอมรับ/ปฏิเสธ/ยกเลิก): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - รูปแบบการตอบกลับ: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

แบนผู้ใช้และลบ Skills ที่เป็นเจ้าของแบบถาวร (เฉพาะผู้ควบคุม/ผู้ดูแลระบบ)

เนื้อหา:

```json
{ "handle": "user_handle", "reason": "เหตุผลการแบนที่ไม่บังคับ" }
```

หรือ

```json
{ "userId": "users_...", "reason": "เหตุผลการแบนที่ไม่บังคับ" }
```

การตอบกลับ:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

ยกเลิกการแบนผู้ใช้และกู้คืน Skills ที่มีสิทธิ์ (เฉพาะผู้ดูแลระบบ)

เนื้อหา:

```json
{ "handle": "user_handle", "reason": "เหตุผลการยกเลิกการแบนที่ไม่บังคับ" }
```

หรือ

```json
{ "userId": "users_...", "reason": "เหตุผลการยกเลิกการแบนที่ไม่บังคับ" }
```

การตอบกลับ:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

เปลี่ยนเหตุผลที่จัดเก็บไว้สำหรับการแบนที่มีอยู่โดยไม่ยกเลิกการแบนหรือกู้คืน
เนื้อหา (เฉพาะผู้ดูแลระบบ) ค่าเริ่มต้นเป็นการทดลองทำ เว้นแต่ `dryRun` จะเป็น `false`

เนื้อหา:

```json
{ "handle": "user_handle", "reason": "สแปมจากการเผยแพร่จำนวนมาก", "dryRun": true }
```

หรือ

```json
{ "userId": "users_...", "reason": "สแปมจากการเผยแพร่จำนวนมาก", "dryRun": false }
```

การตอบกลับ:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "แบนอัตโนมัติเนื่องจากมัลแวร์",
  "nextReason": "สแปมจากการเผยแพร่จำนวนมาก",
  "changed": true
}
```

### `POST /api/v1/users/role`

เปลี่ยนบทบาทผู้ใช้ (เฉพาะผู้ดูแลระบบ)

เนื้อหา:

```json
{ "handle": "user_handle", "role": "moderator" }
```

หรือ

```json
{ "userId": "users_...", "role": "admin" }
```

การตอบกลับ:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

แสดงรายการหรือค้นหาผู้ใช้ (เฉพาะผู้ดูแลระบบ)

พารามิเตอร์การสืบค้น:

- `q` (ไม่บังคับ): คำค้นหา
- `query` (ไม่บังคับ): นามแฝงสำหรับ `q`
- `limit` (ไม่บังคับ): จำนวนผลลัพธ์สูงสุด (ค่าเริ่มต้น 20, สูงสุด 200)

การตอบกลับ:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "ผู้ใช้",
      "name": "ผู้ใช้",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

เพิ่ม/นำดาวออก (รายการเด่น) เอนด์พอยต์ทั้งสองเป็นแบบ idempotent

การตอบกลับ:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## เอนด์พอยต์ CLI แบบเดิม (เลิกใช้แล้ว)

ยังคงรองรับ CLI เวอร์ชันเก่า:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

ดูแผนการนำออกที่ `DEPRECATIONS.md`

`POST /api/cli/upload-url` ส่งคืน `uploadUrl` และ `uploadTicket` การเผยแพร่
แพ็กเกจที่พัก tarball ของ ClawPack ต้องส่งรหัสพื้นที่จัดเก็บที่ได้เป็น
`clawpack` และตั๋วที่ส่งคืนเป็น `clawpackUploadTicket`

## การค้นหารีจิสทรี (`/.well-known/clawhub.json`)

CLI สามารถค้นหาการตั้งค่ารีจิสทรี/การยืนยันตัวตนจากเว็บไซต์ได้:

- `/.well-known/clawhub.json` (JSON, แนะนำให้ใช้)
- `/.well-known/clawdhub.json` (แบบเดิม)

สคีมา:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

หากโฮสต์ด้วยตนเอง ให้ให้บริการไฟล์นี้ (หรือตั้งค่า `CLAWHUB_REGISTRY` อย่างชัดเจน; แบบเดิมใช้ `CLAWDHUB_REGISTRY`)
