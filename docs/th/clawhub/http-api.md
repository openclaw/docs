---
read_when:
    - การเพิ่ม/เปลี่ยนแปลงเอนด์พอยต์
    - การดีบักคำขอระหว่าง CLI ↔ รีจิสทรี
summary: ข้อมูลอ้างอิง HTTP API (ปลายทางสาธารณะ + ปลายทาง CLI + การยืนยันตัวตน)
x-i18n:
    generated_at: "2026-07-21T15:31:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d9b3e64cbb9dce522b3c112a8082a5df32eb118c1ce0c97a28d2c397d1cdfbe3
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

URL ฐาน: `https://clawhub.ai` (ค่าเริ่มต้น)

พาธ v1 ทั้งหมดอยู่ภายใต้ `/api/v1/...`
`/api/...` และ `/api/cli/...` แบบเดิมยังคงไว้เพื่อความเข้ากันได้ (ดู `DEPRECATIONS.md`)
OpenAPI: `/api/v1/openapi.json`

## การนำแคตตาล็อกสาธารณะมาใช้ซ้ำ

ไดเรกทอรีของบุคคลที่สามอาจใช้เอนด์พอยต์การอ่านสาธารณะเพื่อแสดงรายการหรือค้นหา Skills ของ ClawHub โปรดแคชผลลัพธ์ ปฏิบัติตาม `429`/`Retry-After` ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub หลัก (`https://clawhub.ai/<owner>/skills/<slug>`) และหลีกเลี่ยงการสื่อเป็นนัยว่า ClawHub รับรองเว็บไซต์ของบุคคลที่สาม อย่าพยายามทำสำเนาเนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกโดยการกลั่นกรองนอกขอบเขต API สาธารณะ

ทางลัด slug บนเว็บสามารถแก้ไขข้ามตระกูลรีจิสทรีได้ แต่ไคลเอนต์ API ควรใช้
URL หลักที่เอนด์พอยต์การอ่านส่งกลับ แทนการสร้างลำดับความสำคัญของเส้นทาง
ขึ้นใหม่

## ขีดจำกัดอัตรา

รูปแบบการบังคับใช้:

- คำขอแบบไม่ระบุตัวตน: บังคับใช้ต่อ IP
- คำขอที่ยืนยันตัวตนแล้ว (Bearer token ที่ถูกต้อง): บังคับใช้ตามบัคเก็ตของผู้ใช้
- หากไม่มีโทเค็นหรือโทเค็นไม่ถูกต้อง ลักษณะการทำงานจะย้อนกลับไปใช้การบังคับใช้ตาม IP
- เอนด์พอยต์การเขียนที่ยืนยันตัวตนแล้วไม่ควรส่งคืนเพียง `Unauthorized` เมื่อ
  เซิร์ฟเวอร์ทราบสาเหตุ โทเค็นที่หายไป โทเค็นที่ไม่ถูกต้อง/ถูกเพิกถอน และ
  บัญชีที่ถูกลบ/แบน/ปิดใช้งานควรได้รับข้อความที่นำไปดำเนินการได้แยกกัน เพื่อให้ไคลเอนต์
  CLI สามารถแจ้งผู้ใช้ได้ว่าอะไรขัดขวางการทำงาน

- อ่าน: 3000/นาทีต่อ IP, 12000/นาทีต่อคีย์
- เขียน: 300/นาทีต่อ IP, 3000/นาทีต่อคีย์
- ดาวน์โหลด: 1200/นาทีต่อ IP, 6000/นาทีต่อคีย์ (เอนด์พอยต์ดาวน์โหลด)

ส่วนหัว:

- ความเข้ากันได้แบบเดิม: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- แบบมาตรฐาน: `RateLimit-Limit`, `RateLimit-Reset`
- เมื่อเป็น `429`: `X-RateLimit-Remaining: 0` และ `RateLimit-Remaining: 0`
- เมื่อเป็น `429`: `Retry-After`

ความหมายของส่วนหัว:

- `X-RateLimit-Reset`: จำนวนวินาที Unix epoch แบบสัมบูรณ์
- `RateLimit-Reset`: จำนวนวินาทีจนกว่าจะรีเซ็ต (ระยะหน่วง)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: โควตาที่เหลืออย่างแม่นยำเมื่อมีค่า
  คำขอแบบแบ่งชาร์ดที่สำเร็จจะละเว้นส่วนหัวนี้ แทนการส่งคืนค่าโดยรวมโดยประมาณ
- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่ (ระยะหน่วง) เมื่อเป็น `429`

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

คำแนะนำสำหรับไคลเอนต์:

- หากมี `Retry-After` ให้รอตามจำนวนวินาทีนั้นก่อนลองใหม่
- ใช้การถอยกลับที่เพิ่มค่าความสุ่มเพื่อหลีกเลี่ยงการลองใหม่พร้อมกัน
- หากไม่มี `Retry-After` ให้ย้อนกลับไปใช้ `RateLimit-Reset` (หรือคำนวณจาก `X-RateLimit-Reset`)

แหล่งที่มาของ IP:

- ใช้ส่วนหัว IP ของไคลเอนต์ที่เชื่อถือได้ รวมถึง `cf-connecting-ip` เฉพาะเมื่อ
  การปรับใช้เปิดใช้ส่วนหัวที่ส่งต่อน่าเชื่อถือไว้อย่างชัดเจน
- ClawHub ใช้ส่วนหัวการส่งต่อที่เชื่อถือได้เพื่อระบุ IP ของไคลเอนต์ที่เอดจ์
- หากไม่มี IP ของไคลเอนต์ที่เชื่อถือได้ คำขอแบบไม่ระบุตัวตนจะใช้บัคเก็ตสำรอง
  ที่กำหนดขอบเขตตามชนิดขีดจำกัดอัตราเท่านั้น บัคเก็ตสำรองเหล่านี้ไม่รวม
  พาธ slug ชื่อแพ็กเกจ เวอร์ชัน สตริงการค้นหา หรือพารามิเตอร์
  อาร์ติแฟกต์อื่นที่ผู้เรียกส่งมา

## การตอบกลับข้อผิดพลาด

การตอบกลับข้อผิดพลาด v1 สาธารณะเป็นข้อความธรรมดาพร้อม `content-type: text/plain; charset=utf-8`
ซึ่งรวมถึงความล้มเหลวในการตรวจสอบความถูกต้อง (`400`) ทรัพยากรสาธารณะที่ไม่พบ (`404`) ความล้มเหลวด้านการยืนยันตัวตนและ
สิทธิ์ (`401`/`403`) ขีดจำกัดอัตรา (`429`) และการดาวน์โหลดที่ถูกบล็อก ไคลเอนต์
ควรอ่านเนื้อหาการตอบกลับเป็นสตริงที่มนุษย์อ่านเข้าใจได้ ระบบจะละเว้นพารามิเตอร์การค้นหาที่ไม่รู้จัก
เพื่อความเข้ากันได้ แต่พารามิเตอร์การค้นหาที่ระบบรู้จักแต่มีค่าไม่ถูกต้องจะส่งคืน
`400`

## เอนด์พอยต์สาธารณะ (ไม่ต้องยืนยันตัวตน)

### `GET /api/v1/search`

พารามิเตอร์การค้นหา:

- `q` (จำเป็น): สตริงการค้นหา
- `limit` (ไม่บังคับ): จำนวนเต็ม
- `highlightedOnly` (ไม่บังคับ): `true` เพื่อกรองเฉพาะ Skills ที่ได้รับการเน้น
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

- ผลลัพธ์จะส่งคืนตามลำดับความเกี่ยวข้อง (ความคล้ายคลึงของ embedding + การเพิ่มคะแนนจากโทเค็น slug/ชื่อที่ตรงกันทั้งหมด + ค่าน้ำหนักความนิยมเล็กน้อย)
- ความเกี่ยวข้องมีน้ำหนักมากกว่าความนิยม การตรงกับโทเค็น slug หรือชื่อที่แสดงอย่างแม่นยำอาจมีอันดับสูงกว่าการตรงแบบหลวมที่มีการมีส่วนร่วมสูงกว่ามาก
- ข้อความ ASCII จะถูกแยกเป็นโทเค็นตามขอบเขตคำและเครื่องหมายวรรคตอน ตัวอย่างเช่น `personal-map` มีโทเค็น `map` ที่แยกเดี่ยว ขณะที่ `amap-jsapi-skill` มี `amap`, `jsapi` และ `skill`; ดังนั้นการค้นหา `map` จึงทำให้ `personal-map` ตรงกันในเชิงคำศัพท์มากกว่า `amap-jsapi-skill`
- ความนิยมจะถูกปรับด้วยลอการิทึมและจำกัดเพดาน Skills ที่มีการมีส่วนร่วมสูงอาจมีอันดับต่ำกว่าเมื่อข้อความค้นหาตรงกันน้อยกว่า
- สถานะการกลั่นกรองว่าน่าสงสัยหรือซ่อนอยู่อาจทำให้ Skill ถูกนำออกจากการค้นหาสาธารณะ โดยขึ้นอยู่กับตัวกรองของผู้เรียกและสถานะการกลั่นกรองปัจจุบัน

คำแนะนำด้านการค้นพบสำหรับผู้เผยแพร่:

- ใส่คำที่ผู้ใช้จะค้นหาตามตัวอักษรไว้ในชื่อที่แสดง สรุป และแท็ก ใช้โทเค็น slug แบบแยกเดี่ยวเฉพาะเมื่อเป็นอัตลักษณ์ที่เสถียรซึ่งต้องการเก็บไว้ด้วย
- อย่าเปลี่ยนชื่อ slug เพียงเพื่อไล่ตามคำค้นหาเดียว เว้นแต่ slug ใหม่จะเป็นชื่อหลักระยะยาวที่ดีกว่า slug เก่าจะกลายเป็นนามแฝงเปลี่ยนเส้นทาง แต่ URL หลัก slug ที่แสดง และข้อมูลสรุปการค้นหาในอนาคตจะใช้ slug ใหม่
- นามแฝงจากการเปลี่ยนชื่อยังคงรองรับการแก้ไข URL เก่าและการติดตั้งที่แก้ไขผ่านรีจิสทรี แต่การจัดอันดับการค้นหาจะอิงตามข้อมูลเมตา Skill หลักหลังการเปลี่ยนชื่อถูกจัดทำดัชนีแล้ว สถิติเดิมจะยังคงอยู่กับ Skill
- หาก Skill มองไม่เห็นโดยไม่คาดคิด ให้ตรวจสอบสถานะการกลั่นกรองก่อนด้วย `clawhub inspect @owner/slug` ขณะเข้าสู่ระบบ ก่อนเปลี่ยนข้อมูลเมตาที่เกี่ยวข้องกับการจัดอันดับ

### `GET /api/v1/skills`

พารามิเตอร์การค้นหา:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–200)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าสำหรับการเรียงลำดับที่ไม่ใช่ `trending`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended` (นามแฝง: `default`), `createdAt` (นามแฝง: `newest`), `downloads`, `stars` (นามแฝง: `rating`), นามแฝงการติดตั้งแบบเดิม `installsCurrent`/`installs`/`installsAllTime` แมปไปยัง `downloads`, `trending`
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): นามแฝงแบบเดิมสำหรับ `nonSuspiciousOnly`

ค่า `sort` ที่ไม่ถูกต้องจะส่งคืน `400`

หมายเหตุ:

- `recommended` ใช้สัญญาณการมีส่วนร่วมและความใหม่
- `trending` จัดอันดับตามจำนวนการติดตั้งในช่วง 7 วันที่ผ่านมา (อิงตามข้อมูลเทเลเมทรี)
- `createdAt` มีความเสถียรสำหรับการรวบรวมข้อมูล Skill ใหม่; `updated` จะเปลี่ยนเมื่อ Skills เดิมได้รับการเผยแพร่ซ้ำ
- เมื่อ `nonSuspiciousOnly=true` การเรียงลำดับแบบใช้เคอร์เซอร์อาจส่งคืนรายการในหนึ่งหน้าน้อยกว่า `limit` เนื่องจาก Skills ที่น่าสงสัยจะถูกกรองหลังจากดึงข้อมูลหน้าแล้ว
- ใช้ `nextCursor` เพื่อแบ่งหน้าต่อเมื่อมีค่า หน้าที่มีรายการน้อยไม่ได้หมายความว่าผลลัพธ์สิ้นสุดแล้วเสมอไป

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

- slug เก่าที่สร้างโดยขั้นตอนการเปลี่ยนชื่อ/ผสานของเจ้าของจะแก้ไขไปยัง Skill หลัก
- `metadata.os`: ข้อจำกัดระบบปฏิบัติการที่ประกาศใน frontmatter ของ Skill (เช่น `["macos"]`, `["linux"]`) เป็น `null` หากไม่ได้ประกาศ
- `metadata.systems`: เป้าหมายระบบ Nix (เช่น `["aarch64-darwin", "x86_64-linux"]`) เป็น `null` หากไม่ได้ประกาศ
- `metadata` เป็น `null` หาก Skill ไม่มีข้อมูลเมตาแพลตฟอร์ม
- จะรวม `moderation` เฉพาะเมื่อ Skill ถูกทำเครื่องหมายหรือเจ้าของกำลังดู Skill นั้น

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
    "summary": "ตรวจพบ: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "ตรวจพบการเรียกใช้โค้ดแบบไดนามิก",
        "evidence": ""
      }
    ]
  }
}
```

หมายเหตุ:

- เจ้าของและผู้ดูแลสามารถเข้าถึงรายละเอียดการกลั่นกรองสำหรับ Skills ที่ซ่อนอยู่
- ผู้เรียกสาธารณะจะได้รับเฉพาะ `200` สำหรับ Skills ที่มองเห็นและถูกทำเครื่องหมายไว้แล้ว
- หลักฐานจะถูกปกปิดสำหรับผู้เรียกสาธารณะ และจะรวมข้อความดิบเฉพาะสำหรับเจ้าของ/ผู้ดูแล

### `POST /api/v1/skills/{slug}/report`

รายงาน Skill เพื่อให้ผู้ดูแลตรวจสอบ รายงานมีขอบเขตระดับ Skill สามารถเชื่อมโยง
กับเวอร์ชันได้โดยไม่บังคับ และจะถูกส่งเข้าสู่คิวรายงาน Skill

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

เอนด์พอยต์สำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อรับรายงาน Skill

พารามิเตอร์การค้นหา:

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
      "reason": "ขั้นตอนการติดตั้งน่าสงสัย",
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

### `POST /api/v1/skills/-/reports/{reportId}/triage`

ปลายทางสำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อดำเนินการหรือเปิดรายงาน Skills อีกครั้ง

คำขอ:

```json
{ "status": "confirmed", "note": "ตรวจสอบและซ่อนเวอร์ชันที่ได้รับผลกระทบแล้ว", "finalAction": "hide" }
```

จำเป็นต้องระบุ `note` สำหรับ `confirmed` และ `dismissed`; สามารถละเว้นได้เมื่อตั้งค่า
`status` กลับเป็น `open` ส่ง `finalAction: "hide"` พร้อมกับรายงานที่คัดกรองแล้ว
เพื่อซ่อน Skills ภายในเวิร์กโฟลว์เดียวกันที่ตรวจสอบย้อนหลังได้

### `GET /api/v1/skills/{slug}/versions`

พารามิเตอร์การสืบค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

### `GET /api/v1/skills/{slug}/versions/{version}`

ส่งคืนข้อมูลเมตาของเวอร์ชันและรายการไฟล์

- `version.security` มีสถานะการยืนยันผลการสแกนที่ปรับให้เป็นมาตรฐานและรายละเอียดของเครื่องสแกน
  (VirusTotal + LLM) เมื่อมีข้อมูล

### `GET /api/v1/skills/{slug}/scan`

ส่งคืนรายละเอียดการยืนยันผลการสแกนความปลอดภัยสำหรับเวอร์ชันของ Skills

พารามิเตอร์การสืบค้น:

- `version` (ไม่บังคับ): สตริงเวอร์ชันที่เจาะจง
- `tag` (ไม่บังคับ): แปลงแท็กเป็นเวอร์ชัน (ตัวอย่างเช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` ระบบจะใช้เวอร์ชันล่าสุด
- ประกอบด้วยสถานะการยืนยันที่ปรับให้เป็นมาตรฐานและรายละเอียดเฉพาะของเครื่องสแกน
- `security.hasScanResult` จะเป็น `true` เฉพาะเมื่อเครื่องสแกนให้ผลการตัดสินที่ชัดเจน (`clean`, `suspicious` หรือ `malicious`)
- `moderation` คือสแนปช็อตการดูแลระดับ Skills ในปัจจุบันที่ได้มาจากเวอร์ชันล่าสุด
- เมื่อสืบค้นเวอร์ชันในอดีต ให้ตรวจสอบ `moderation.matchesRequestedVersion` และ `moderation.sourceVersion` ก่อนถือว่า `moderation` และ `security` อยู่ในบริบทเวอร์ชันเดียวกัน

### `POST /api/v1/skills/-/scan`

ปลายทางส่งงานที่ต้องยืนยันตัวตนสำหรับงาน ClawScan ใหม่

ระบบไม่รองรับการสแกนไฟล์อัปโหลดในเครื่องอีกต่อไป คำขอที่ใช้
`multipart/form-data` หรือ `{ "source": { "kind": "upload" } }` จะส่งคืน `410`

การสแกนรายการที่เผยแพร่แล้วใช้ JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

หมายเหตุ:

- เพย์โหลดคำขอสแกนและรายงานที่ดาวน์โหลดได้จะหมดอายุและถูกนำออกจากที่จัดเก็บคำขอสแกนหลังพ้นระยะเวลาเก็บรักษา
- การสแกนรายการที่เผยแพร่แล้วต้องมีสิทธิ์จัดการในฐานะเจ้าของ/ผู้เผยแพร่ หรืออำนาจผู้ดูแล/ผู้ดูแลระบบของแพลตฟอร์ม
- การสแกนรายการที่เผยแพร่แล้วจะเขียนผลกลับเฉพาะเมื่อ `update: true` และการสแกนเสร็จสมบูรณ์
- การตอบกลับคือ `202` พร้อม `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`
- งานสแกนทำงานแบบอะซิงโครนัส คำขอสแกนด้วยตนเองจะได้รับลำดับความสำคัญก่อนงานเผยแพร่/เติมข้อมูลย้อนหลังตามปกติ แต่การเสร็จสิ้นยังคงขึ้นอยู่กับความพร้อมของเวิร์กเกอร์

### `GET /api/v1/skills/-/scan/{scanId}`

ปลายทางสำรวจสถานะที่ต้องยืนยันตัวตนสำหรับงานสแกนที่ส่งแล้ว

- ส่งคืนสถานะเข้าคิว/กำลังทำงาน/สำเร็จ/ล้มเหลว
- ส่งคืน `queue.queuedAhead` และ `queue.position` ขณะอยู่ในคิว เพื่อให้ไคลเอนต์แสดงจำนวนการสแกนด้วยตนเองที่จัดลำดับความสำคัญและอยู่ก่อนหน้าคำขอนี้ได้ คิวขนาดใหญ่มากจะถูกจำกัดและรายงานด้วย `queuedAheadIsEstimate: true`
- เมื่อมีข้อมูล `report` จะประกอบด้วยส่วน `clawscan`, `skillspector`, `staticAnalysis` และ `virustotal`
- งานสแกนที่ล้มเหลวจะส่งคืน `status: "failed"` พร้อม `lastError`

### `GET /api/v1/skills/-/scan/{scanId}/download`

ปลายทางคลังรายงานที่ต้องยืนยันตัวตน

- ต้องเป็นการสแกนที่สำเร็จแล้ว การสแกนที่ยังไม่สิ้นสุดจะส่งคืน `409`
- ส่งคืนไฟล์ ZIP ที่มี `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

ปลายทางคลังรายงานที่จัดเก็บไว้และต้องยืนยันตัวตนสำหรับเวอร์ชันที่ส่งแล้ว

- ต้องมีสิทธิ์จัดการ Skills หรือ Plugin ในฐานะเจ้าของ/ผู้เผยแพร่ หรืออำนาจผู้ดูแล/ผู้ดูแลระบบของแพลตฟอร์ม
- ส่งคืนผลการสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งอย่างตรงกัน รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อน
- `kind` มีค่าเริ่มต้นเป็น `skill`; ใช้ `kind=plugin` สำหรับการสแกน Plugin/แพ็กเกจ
- ส่งคืน ZIP ที่มีโครงสร้างเดียวกับการดาวน์โหลดคำขอสแกน

### `POST /api/v1/skills/-/scan/batch`

เส้นทางสแกนซ้ำแบบกลุ่มมาตรฐานสำหรับผู้ดูแลระบบเท่านั้น โดยรับเพย์โหลดรูปแบบเดียวกับ `POST /api/v1/skills/-/rescan-batch` แบบเดิม

### `POST /api/v1/skills/-/scan/batch/status`

เส้นทางสถานะแบบกลุ่มมาตรฐานสำหรับผู้ดูแลระบบเท่านั้น โดยรับ `{ "jobIds": ["..."] }` และส่งคืนตัวนับรวมแบบเดียวกับ `POST /api/v1/skills/-/rescan-batch/status` แบบเดิม

### `GET /api/v1/skills/{slug}/verify`

ส่งคืนเอนเวโลปการยืนยัน Skill Card ที่ `clawhub skill verify` ใช้

พารามิเตอร์การสืบค้น:

- `version` (ไม่บังคับ): สตริงเวอร์ชันที่เจาะจง
- `tag` (ไม่บังคับ): แปลงแท็กเป็นเวอร์ชัน (ตัวอย่างเช่น `latest`)

หมายเหตุ:

- `ok` จะเป็น `true` เฉพาะเมื่อเวอร์ชันที่เลือกมี Skill Card ที่สร้างแล้ว ไม่ถูกการดูแลบล็อกว่าเป็นมัลแวร์ และการยืนยัน ClawScan ระบุว่าสะอาด
- ข้อมูลประจำตัวของ Skills ข้อมูลประจำตัวของผู้เผยแพร่ และข้อมูลเมตาของเวอร์ชันที่เลือกเป็นฟิลด์ระดับบนสุดของเอนเวโลป (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) เพื่อให้ระบบอัตโนมัติของเชลล์อ่านได้โดยไม่ต้องแกะตัวห่อหุ้มที่ซ้อนกัน
- `security` คือผลการตัดสิน ClawScan/ความปลอดภัยระดับบนสุด ระบบอัตโนมัติควรอ้างอิง `ok`, `decision`, `reasons` และ `security.status`
- `security.signals` มีหลักฐานสนับสนุนจากเครื่องสแกน เช่น `staticScan`, `virusTotal` และ `skillSpector`
- ยังคงเก็บ `security.signals.dependencyRegistry` ไว้เพื่อความเข้ากันได้กับการตอบกลับ v1 แต่เครื่องสแกนตรวจสอบการมีอยู่ในรีจิสทรีของการขึ้นต่อกันได้ยุติการใช้งานแล้ว และคีย์นี้จะเป็น `null` เสมอ
- `provenance` จะเป็น `server-resolved-github-import` เฉพาะเมื่อ ClawHub แปลงและจัดเก็บรีโพ GitHub/ref/คอมมิต/พาธระหว่างการเผยแพร่หรือนำเข้า มิฉะนั้นจะเป็น `unavailable`

### `POST /api/v1/skills/-/security-verdicts`

ส่งคืนผลการตัดสินด้านความปลอดภัยแบบย่อในปัจจุบันสำหรับเวอร์ชันของ Skills ที่ตรงกัน ปลายทาง
คอลเลกชันนี้มีไว้สำหรับไคลเอนต์ที่ทราบอยู่แล้วว่าต้องแสดง
Skills ของ ClawHub เวอร์ชันใดที่ติดตั้งไว้ เช่น OpenClaw Control UI

คำขอ:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

หมายเหตุ:

- `items` ต้องมีคู่ `{ slug, version }` ที่ไม่ซ้ำกัน 1-100 คู่
- ผลลัพธ์แยกตามแต่ละรายการ การไม่พบ Skills หรือเวอร์ชันหนึ่งรายการจะไม่ทำให้การตอบกลับทั้งหมดล้มเหลว
- การตอบกลับมีเฉพาะข้อมูลความปลอดภัย โดยไม่มีข้อมูล Skill Card สถานะการสร้างการ์ด รายการไฟล์อาร์ติแฟกต์ หรือเพย์โหลดโดยละเอียดของเครื่องสแกน
- `security.signals` มีเฉพาะหลักฐานสนับสนุนระดับสถานะ ใช้ `/scan` หรือหน้าตรวจสอบความปลอดภัยของ ClawHub สำหรับรายละเอียดทั้งหมดของเครื่องสแกน
- ยังคงเก็บ `security.signals.dependencyRegistry` ไว้เพื่อความเข้ากันได้กับการตอบกลับ v1 แต่เครื่องสแกนตรวจสอบการมีอยู่ในรีจิสทรีของการขึ้นต่อกันได้ยุติการใช้งานแล้ว และคีย์นี้จะเป็น `null` เสมอ
- การไม่มี Skill Card ไม่ส่งผลต่อ `ok`, `decision` หรือ `reasons` ของปลายทางนี้ ไคลเอนต์ควรอ่าน `skill-card.md` ที่ติดตั้งไว้ภายในเครื่องเมื่อต้องการเนื้อหาการ์ด
- ใช้ `/verify` เมื่อต้องการเอนเวโลปการยืนยัน Skill Card สำหรับ Skills เดียว ใช้ `/card` เมื่อต้องการ Markdown ของการ์ดที่สร้างแล้ว และใช้ `/scan` เมื่อต้องการข้อมูลโดยละเอียดของเครื่องสแกน

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
      "error": { "code": "version_not_found", "message": "ไม่พบเวอร์ชัน" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

ส่งคืนไบต์ของไฟล์ที่จัดเก็บไว้อย่างตรงกันในรูปแบบการดาวน์โหลด เพิ่ม `preview=1` เพื่อขอตัวอย่างข้อความแบบเอสเคปที่มีขนาดจำกัด
สามารถดูตัวอย่างไฟล์ใดก็ได้ที่มีไบต์ UTF-8 ที่ถูกต้อง โดยไม่ขึ้นอยู่กับนามสกุลหรือข้อมูลเมตา
MIME ของไฟล์

พารามิเตอร์การสืบค้น:

- `path` (จำเป็น)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)
- `preview=1` (ไม่บังคับ; ส่งคืน `text/plain` หรือ `415` เมื่อไบต์ไม่ใช่ UTF-8 ที่ถูกต้อง)

หมายเหตุ:

- ค่าเริ่มต้นคือเวอร์ชันล่าสุด
- ขีดจำกัดการดาวน์โหลดข้อมูลดิบ: 10MB
- ขีดจำกัดตัวอย่างข้อความ: 200KB

### `GET /api/v1/packages`

ปลายทางแค็ตตาล็อกแบบรวมสำหรับ:

- Skills
- Plugin โค้ด
- Plugin แบบบันเดิล

พารามิเตอร์การสืบค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended`, `trending`, `downloads`, นามแฝงแบบเดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอจำกัดขอบเขตไว้ที่แพ็กเกจ Plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` หรือปลายทางแพ็กเกจที่มี
  `family=code-plugin`/`family=bundle-plugin`) หมวดหมู่ที่ควบคุมและ
  นามแฝงตัวกรอง v1 แบบเดิมมีเอกสารอยู่ใน `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` หรือ `sort` จะส่งคืน `400` ระบบจะละเว้นพารามิเตอร์การสืบค้นที่ไม่รู้จัก
- `GET /api/v1/code-plugins` และ `GET /api/v1/bundle-plugins` ยังคงเป็นนามแฝงของตระกูลแบบคงที่
- รายการ Skills ยังคงอ้างอิงรีจิสทรีของ Skills และยังเผยแพร่ได้ผ่าน `POST /api/v1/skills` เท่านั้น
- `POST /api/v1/packages` ยังคงใช้สำหรับรุ่นของ Plugin โค้ดและ Plugin แบบบันเดิลเท่านั้น
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ยืนยันตัวตนแล้วสามารถเห็นแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดในผลลัพธ์รายการ/การค้นหา
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกซึ่งยืนยันตัวตนแล้วมีสิทธิ์อ่าน

### `GET /api/v1/packages/search`

การค้นหาแค็ตตาล็อกแบบรวมสำหรับ Skills และแพ็กเกจ Plugin

พารามิเตอร์การสืบค้น:

- `q` (จำเป็น): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอจำกัดขอบเขตไว้ที่แพ็กเกจ Plugin หมวดหมู่ที่ควบคุมและนามแฝงตัวกรอง
  v1 แบบเดิมมีเอกสารอยู่ใน `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured` หรือ
  `highlightedOnly` จะส่งคืน `400` ระบบจะละเว้นพารามิเตอร์คำค้นที่ไม่รู้จัก
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการตรวจสอบสิทธิ์สามารถค้นหาแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดอยู่
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกซึ่งผ่านการตรวจสอบสิทธิ์มีสิทธิ์อ่าน

### `GET /api/v1/plugins`

การเรียกดูแค็ตตาล็อกเฉพาะ Plugin ครอบคลุมแพ็กเกจ Plugin แบบโค้ดและ Plugin แบบบันเดิล

พารามิเตอร์คำค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `recommended` (ค่าเริ่มต้น), `trending`, `downloads`, `updated`, นามแฝงแบบเดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

ปลายทางการอ่านยังคงยอมรับนามแฝงตัวกรอง v1 แบบเดิม:

- `mcp-tooling`, `data` และ `automation` จะแปลงเป็น `tools`
- `observability` และ `deployment` จะแปลงเป็น `gateway`
- `dev-tools` จะแปลงเป็น `runtime`

`trending` เป็นตารางจัดอันดับการติดตั้ง/ดาวน์โหลดในช่วงเจ็ดวัน และไม่ใช้ยอดรวมตลอดเวลา
ในปลายทางรวม `/api/v1/packages` ค่านี้ใช้ได้เฉพาะ Plugin ให้ใช้
`/api/v1/skills?sort=trending` สำหรับแค็ตตาล็อก Skills

ระบบไม่ยอมรับนามแฝงแบบเดิมเป็นค่าหมวดหมู่ที่จัดเก็บหรือที่ผู้เขียนประกาศ

### `GET /api/v1/skills/export`

การส่งออก Skills สาธารณะเวอร์ชันล่าสุดจำนวนมากสำหรับการวิเคราะห์แบบออฟไลน์

การตรวจสอบสิทธิ์:

- จำเป็นต้องใช้โทเค็น API

พารามิเตอร์คำค้น:

- `startDate` (จำเป็น): ขอบเขตล่างเป็นมิลลิวินาที Unix สำหรับ `updatedAt` ของ Skill
- `endDate` (จำเป็น): ขอบเขตบนเป็นมิลลิวินาที Unix สำหรับ `updatedAt` ของ Skill
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าจากการตอบกลับก่อนหน้า

การตอบกลับ:

- เนื้อหา: ไฟล์เก็บถาวร ZIP
- Skill ที่ส่งออกแต่ละรายการมีรากอยู่ที่ `{publisher}/{slug}/`
- Skills ที่โฮสต์ไว้จะมีไฟล์เวอร์ชันล่าสุดที่จัดเก็บ และแสดงรายการใน
  `_manifest.json` พร้อม `sourceRef: "public-clawhub"`
- Skills ปัจจุบันที่ใช้ GitHub เป็นแหล่งข้อมูลและมีการสแกน `clean` หรือ `suspicious` จะมี
  `_source_handoff.json` พร้อม `sourceRef: "public-github"`, ที่เก็บ, คอมมิต, พาธ,
  แฮชเนื้อหา และ URL ไฟล์เก็บถาวร โดยจะไม่มีไฟล์ต้นฉบับที่โฮสต์บน ClawHub
- Skill แต่ละรายการมี `_export_skill_meta.json`
- ZIP จะมี `_manifest.json` ที่ระดับรากเสมอ
- ระบบจะรวม `_errors.json` เมื่อไม่สามารถ
  ส่งออก Skills หรือไฟล์บางรายการได้

ส่วนหัว:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

การส่งออกรีลีส Plugin สาธารณะเวอร์ชันล่าสุดจำนวนมากสำหรับการวิเคราะห์แบบออฟไลน์

การตรวจสอบสิทธิ์:

- จำเป็นต้องใช้โทเค็น API

พารามิเตอร์คำค้น:

- `startDate` (จำเป็น): ขอบเขตล่างเป็นมิลลิวินาที Unix สำหรับ `updatedAt` ของ Plugin
- `endDate` (จำเป็น): ขอบเขตบนเป็นมิลลิวินาที Unix สำหรับ `updatedAt` ของ Plugin
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าจากการตอบกลับก่อนหน้า
- `family` (ไม่บังคับ): `code-plugin` หรือ `bundle-plugin` หากละไว้จะหมายถึง
  Plugin ทั้งสองตระกูล

การตอบกลับ:

- เนื้อหา: ไฟล์เก็บถาวร ZIP
- Plugin ที่ส่งออกแต่ละรายการมีรากอยู่ที่ `{family}/{packageName}/`
- Plugin ที่ส่งออกแต่ละรายการมีไฟล์ที่จัดเก็บของรีลีสล่าสุด
- ข้อมูลเมตาการส่งออกของแต่ละ Plugin จัดเก็บไว้ที่
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`
- ZIP จะมี `_manifest.json` ที่ระดับรากเสมอ
- ระบบจะรวม `_errors.json` เมื่อไม่สามารถ
  ส่งออก Plugin หรือไฟล์บางรายการได้

ส่วนหัว:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

การค้นหาเฉพาะ Plugin ครอบคลุมแพ็กเกจ Plugin แบบโค้ดและ Plugin แบบบันเดิล

พารามิเตอร์คำค้น:

- `q` (จำเป็น): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

หมายเหตุ:

- ระบบยอมรับนามแฝงตัวกรอง v1 แบบเดิมที่มีเอกสารอยู่ใน `GET /api/v1/plugins`
  เช่นกัน
- การกรองหมวดหมู่เป็นตัวกรอง API จริงที่อิงกับแถวไดเจสต์หมวดหมู่ Plugin
  ไม่ใช่การเขียนคำค้นใหม่
- ระบบส่งคืนผลลัพธ์ตามลำดับความเกี่ยวข้อง และปัจจุบันไม่มีการแบ่งหน้า
- ตัวควบคุมการเรียงลำดับใน UI ของเบราว์เซอร์สำหรับการค้นหา Plugin จะจัดลำดับผลลัพธ์ความเกี่ยวข้องที่โหลดแล้วใหม่
  ซึ่งตรงกับลักษณะการเรียกดู `/skills` ในปัจจุบัน

### `GET /api/v1/packages/{name}`

ส่งคืนข้อมูลเมตารายละเอียดแพ็กเกจ

หมายเหตุ:

- Skills สามารถแก้ไขผ่านเส้นทางนี้ในแค็ตตาล็อกรวมได้เช่นกัน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกมีสิทธิ์อ่านผู้เผยแพร่ที่เป็นเจ้าของ

### `DELETE /api/v1/packages/{name}`

ลบแพ็กเกจและรีลีสทั้งหมดแบบซอฟต์

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

ส่งคืนแพ็กเกจหนึ่งเวอร์ชัน รวมถึงข้อมูลเมตาของไฟล์ ความเข้ากันได้
การตรวจสอบยืนยัน ข้อมูลเมตาของอาร์ติแฟกต์ และข้อมูลการสแกน

หมายเหตุ:

- `version.artifact.kind` คือ `legacy-zip` สำหรับไฟล์เก็บถาวรแพ็กเกจแบบเดิม หรือ
  `npm-pack` สำหรับรีลีสที่ใช้ ClawPack
- รีลีส ClawPack มีฟิลด์ `npmIntegrity`, `npmShasum` และ
  `npmTarballName` ที่เข้ากันได้กับ npm
- `version.sha256hash` เป็นข้อมูลเมตาความเข้ากันได้ที่เลิกแนะนำแล้วสำหรับไคลเอนต์รุ่นเก่า โดย
  แฮชไบต์ ZIP ที่ตรงกับข้อมูลที่ `/api/v1/packages/{name}/download` ส่งคืนทุกประการ
  ไคลเอนต์สมัยใหม่ควรใช้ `version.artifact.sha256` ซึ่งระบุ
  อาร์ติแฟกต์รีลีสหลัก
- ระบบจะรวม `version.vtAnalysis`, `version.llmAnalysis` และ `version.staticScan`
  เมื่อมีข้อมูลการสแกน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกมีสิทธิ์อ่านผู้เผยแพร่ที่เป็นเจ้าของ

### `GET /api/v1/packages/{name}/versions/{version}/security`

ส่งคืนข้อมูลสรุปความปลอดภัยและความน่าเชื่อถือของรีลีสแพ็กเกจที่ตรงกันทุกประการสำหรับไคลเอนต์
การติดตั้ง นี่คือพื้นผิวการใช้งานสาธารณะของ OpenClaw สำหรับตัดสินว่า
สามารถติดตั้งรีลีสที่แก้ไขแล้วได้หรือไม่

การตรวจสอบสิทธิ์:

- ปลายทางอ่านสาธารณะ ไม่จำเป็นต้องใช้โทเค็นของเจ้าของ ผู้เผยแพร่ ผู้ควบคุม หรือผู้ดูแลระบบ

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
  แพ็กเกจรีจิสทรีที่แก้ไขแล้ว
- `release.releaseId`, `release.version` และ `release.createdAt` ระบุ
  รีลีสที่ได้รับการประเมินอย่างเจาะจง
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` และ `release.npmTarballName` จะปรากฏเมื่อทราบค่าสำหรับ
  อาร์ติแฟกต์รีลีส
- `trust.scanStatus` คือสถานะความน่าเชื่อถือที่มีผล ซึ่งได้มาจากอินพุตของเครื่องสแกน
  และการควบคุมรีลีสด้วยตนเอง
- `trust.moderationState` เป็นค่าว่างได้ โดยเป็น `null` เมื่อไม่มีการควบคุมรีลีส
  ด้วยตนเอง
- `trust.blockedFromDownload` คือสัญญาณบล็อกการติดตั้ง OpenClaw และไคลเอนต์
  การติดตั้งอื่นควรบล็อกการติดตั้งเมื่อค่านี้เป็น `true` แทนที่จะ
  คำนวณกฎการบล็อกใหม่จากฟิลด์เครื่องสแกนหรือการควบคุม
- `trust.reasons` คือรายการคำอธิบายสำหรับผู้ใช้และการตรวจสอบ รหัสเหตุผล
  เป็นสตริงสั้นที่คงที่ เช่น `manual:quarantined`, `scan:malicious`
  และ `package:malicious`
- `trust.pending` หมายความว่าอินพุตความน่าเชื่อถืออย่างน้อยหนึ่งรายการยังรอการดำเนินการให้เสร็จสิ้น
- `trust.stale` หมายความว่าข้อมูลสรุปความน่าเชื่อถือคำนวณจากอินพุตที่ล้าสมัย และ
  ควรถือว่าต้องรีเฟรชก่อนตัดสินใจอนุญาตด้วยความมั่นใจสูง

หมายเหตุ:

- ปลายทางนี้ระบุเวอร์ชันอย่างเจาะจง ไคลเอนต์ควรเรียกใช้หลังจากแก้ไข
  เวอร์ชันแพ็กเกจที่ตั้งใจจะติดตั้งแล้ว ไม่ใช่เพียงหลังจากอ่านข้อมูลเมตา
  แพ็กเกจล่าสุด
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกมีสิทธิ์อ่านผู้เผยแพร่ที่เป็นเจ้าของ
- ปลายทางนี้จงใจมีขอบเขตแคบกว่าปลายทางการควบคุมของเจ้าของ/ผู้ควบคุม
  โดยเปิดเผยการตัดสินใจติดตั้งและคำอธิบายสาธารณะ แต่ไม่เปิดเผย
  ตัวตนผู้รายงาน เนื้อหารายงาน หลักฐานส่วนตัว หรือไทม์ไลน์การตรวจสอบ
  ภายใน

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

ส่งคืนข้อมูลเมตาตัวแก้ไขอาร์ติแฟกต์ที่ระบุชัดเจนสำหรับแพ็กเกจหนึ่งเวอร์ชัน

หมายเหตุ:

- แพ็กเกจเวอร์ชันเดิมจะส่งคืนอาร์ติแฟกต์ `legacy-zip` และ ZIP แบบเดิม
  `downloadUrl`
- เวอร์ชัน ClawPack จะส่งคืนอาร์ติแฟกต์ `npm-pack`, ฟิลด์ความสมบูรณ์ของ npm,
  `tarballUrl` และ URL ความเข้ากันได้กับ ZIP แบบเดิม
- นี่คือพื้นผิวตัวแก้ไขของ OpenClaw ซึ่งหลีกเลี่ยงการคาดเดารูปแบบไฟล์เก็บถาวรจาก
  URL ที่ใช้ร่วมกัน

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ดาวน์โหลดอาร์ติแฟกต์ของเวอร์ชันผ่านพาธตัวแก้ไขที่ระบุชัดเจน

หมายเหตุ:

- เวอร์ชัน ClawPack สตรีมไบต์ `.tgz` ของ npm-pack ที่อัปโหลดไว้แบบตรงทุกประการ
- เวอร์ชัน ZIP แบบเดิมเปลี่ยนเส้นทางไปยัง `/api/v1/packages/{name}/download?version=`
- ใช้บักเก็ตอัตราการดาวน์โหลด

### `GET /api/v1/packages/{name}/readiness`

ส่งคืนความพร้อมที่คำนวณแล้วสำหรับการใช้งานโดย OpenClaw ในอนาคต

การตรวจสอบความพร้อมครอบคลุม:

- สถานะช่องทางอย่างเป็นทางการ
- ความพร้อมใช้งานของเวอร์ชันล่าสุด
- ความพร้อมใช้งานของอาร์ติแฟกต์ npm-pack ของ ClawPack
- ไดเจสต์ของอาร์ติแฟกต์
- ที่มาของรีโพซิทอรีต้นทางและคอมมิต
- ข้อมูลเมตาความเข้ากันได้กับ OpenClaw
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
      "message": "เวอร์ชันล่าสุดมีเฉพาะ ZIP แบบเดิม"
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

ปลายทางสำหรับผู้ดูแลเพื่อแสดงรายการแถวการย้าย Plugin อย่างเป็นทางการของ OpenClaw

การยืนยันตัวตน:

- ต้องใช้โทเค็น API ของผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คิวรี:

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
      "blockers": ["ไม่มี ClawPack"],
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

ปลายทางสำหรับผู้ดูแลระบบเพื่อสร้างหรืออัปเดตแถวการย้าย Plugin อย่างเป็นทางการ

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
  "blockers": ["ไม่มี ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "กำลังรอผู้เผยแพร่อัปโหลด"
}
```

หมายเหตุ:

- `bundledPluginId` จะถูกปรับเป็นตัวพิมพ์เล็กและเป็นคีย์ upsert แบบคงที่
- `packageName` จะถูกปรับรูปแบบเป็นชื่อ npm โดยแพ็กเกจอาจยังไม่มีสำหรับการย้าย
  ที่วางแผนไว้
- ส่วนนี้ติดตามเฉพาะความพร้อมในการย้าย โดยไม่แก้ไข OpenClaw หรือสร้าง
  ClawPack

### `GET /api/v1/packages/moderation/queue`

ปลายทางสำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อจัดการคิวรีวิวรุ่นแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API ของผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คิวรี:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `blocked`, `manual` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

ความหมายของสถานะ:

- `open`: รุ่นที่น่าสงสัย เป็นอันตราย รอดำเนินการ ถูกกักกัน ถูกเพิกถอน หรือถูกรายงาน
- `blocked`: รุ่นที่ถูกกักกัน ถูกเพิกถอน หรือเป็นอันตราย
- `manual`: รุ่นใดก็ตามที่มีการแทนค่าการตรวจสอบโดยผู้ดูแลด้วยตนเอง
- `all`: รุ่นใดก็ตามที่มีการแทนค่าด้วยตนเอง สถานะการสแกนไม่สะอาด หรือรายงานแพ็กเกจ

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
      "moderationReason": "การรีวิวด้วยตนเอง",
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

รายงานแพ็กเกจให้ผู้ดูแลตรวจสอบ รายงานมีผลในระดับแพ็กเกจและอาจ
เชื่อมโยงกับเวอร์ชันได้ รายงานจะเข้าสู่คิวการตรวจสอบ แต่จะไม่ซ่อนหรือ
บล็อกการดาวน์โหลดโดยอัตโนมัติ ผู้ดูแลควรใช้การตรวจสอบรุ่นเพื่อ
อนุมัติ กักกัน หรือเพิกถอนอาร์ติแฟกต์

การยืนยันตัวตน:

- ต้องใช้โทเค็น API

คำขอ:

```json
{ "reason": "ไบนารีแบบเนทีฟที่น่าสงสัย", "version": "1.2.3" }
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

ปลายทางสำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อรับรายงานแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API ของผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คิวรี:

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
      "reason": "ไบนารีแบบเนทีฟที่น่าสงสัย",
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

ปลายทางสำหรับเจ้าของ/ผู้ดูแลเพื่อดูข้อมูลการตรวจสอบแพ็กเกจ

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
    "moderationReason": "การรีวิวด้วยตนเอง",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

ปลายทางสำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อปิดหรือเปิดรายงานแพ็กเกจอีกครั้ง

คำขอ:

```json
{
  "status": "confirmed",
  "note": "ตรวจสอบและกักกันรุ่นที่ได้รับผลกระทบแล้ว",
  "finalAction": "quarantine"
}
```

ต้องระบุ `note` สำหรับ `confirmed` และ `dismissed` แต่อาจละเว้นได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "quarantine"` หรือ
`finalAction: "revoke"` พร้อมรายงานที่ยืนยันแล้วเพื่อใช้การตรวจสอบรุ่นภายใน
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

ปลายทางสำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อรีวิวรุ่นแพ็กเกจ

คำขอ:

```json
{ "state": "quarantined", "reason": "เพย์โหลดแบบเนทีฟที่น่าสงสัย" }
```

สถานะที่รองรับ:

- `approved`: ตรวจสอบด้วยตนเองและอนุญาตแล้ว
- `quarantined`: ถูกบล็อกระหว่างรอการติดตามผล
- `revoked`: ถูกบล็อกหลังจากรุ่นเคยได้รับความเชื่อถือแล้ว

รุ่นที่ถูกกักกันและถูกเพิกถอนจะส่งคืน `403` จากเส้นทางดาวน์โหลดอาร์ติแฟกต์
ทุกการเปลี่ยนแปลงจะเขียนรายการลงในบันทึกการตรวจสอบ

### `GET /api/v1/packages/{name}/file`

ส่งคืนไบต์ไฟล์แพ็กเกจที่จัดเก็บไว้แบบตรงทุกประการเพื่อดาวน์โหลด เพิ่ม `preview=1` เพื่อขอตัวอย่างข้อความ
UTF-8 แบบจำกัดขนาดเดียวกับที่ใช้สำหรับไฟล์ Skills

พารามิเตอร์คิวรี:

- `path` (จำเป็น)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)
- `preview=1` (ไม่บังคับ; ส่งคืน `text/plain` หรือ `415` เมื่อไบต์ไม่ใช่ UTF-8 ที่ถูกต้อง)

หมายเหตุ:

- ค่าเริ่มต้นคือรุ่นล่าสุด
- ใช้บักเก็ตอัตราการอ่าน ไม่ใช่บักเก็ตการดาวน์โหลด
- ขีดจำกัดการดาวน์โหลดแบบดิบ: 10MB
- ขีดจำกัดตัวอย่างข้อความ: 200KB; ไฟล์ทึบแสงจะส่งคืน `415` เฉพาะคำขอตัวอย่างเท่านั้น
- การสแกน VirusTotal ที่รอดำเนินการจะไม่บล็อกการอ่าน แต่รุ่นที่เป็นอันตรายอาจยังถูกระงับในส่วนอื่น
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านข้อมูลของผู้เผยแพร่ที่เป็นเจ้าของได้

### `GET /api/v1/packages/{name}/download`

ดาวน์โหลดไฟล์เก็บถาวร ZIP แบบกำหนดผลลัพธ์แน่นอนรุ่นเดิมสำหรับรุ่นแพ็กเกจ

พารามิเตอร์คิวรี:

- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือรุ่นล่าสุด
- Skills เปลี่ยนเส้นทางไปยัง `GET /api/v1/download`
- ไฟล์เก็บถาวรของ Plugin/แพ็กเกจเป็นไฟล์ zip ที่มีรูท `package/` เพื่อให้ไคลเอนต์ OpenClaw
  รุ่นเก่ายังคงทำงานได้
- เส้นทางนี้รองรับเฉพาะ ZIP และไม่สตรีมไฟล์ ClawPack `.tgz`
- การตอบกลับมีส่วนหัว `ETag`, `Digest`, `X-ClawHub-Artifact-Type` และ
  `X-ClawHub-Artifact-Sha256` สำหรับการตรวจสอบความสมบูรณ์ของตัวแก้ไข
- ข้อมูลเมตาที่มีเฉพาะในรีจิสทรีจะไม่ถูกแทรกลงในไฟล์เก็บถาวรที่ดาวน์โหลด
- การสแกน VirusTotal ที่รอดำเนินการจะไม่บล็อกการดาวน์โหลด แต่รุ่นที่เป็นอันตรายจะส่งคืน `403`
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะเป็นเจ้าของ

### `GET /api/npm/{package}`

ส่งคืน packument ที่เข้ากันได้กับ npm สำหรับเวอร์ชันแพ็กเกจที่ใช้ ClawPack

หมายเหตุ:

- แสดงรายการเฉพาะเวอร์ชันที่มี tarball npm-pack ของ ClawPack อัปโหลดไว้
- จงใจละเว้นเวอร์ชันแบบเดิมที่มีเฉพาะ ZIP
- `dist.tarball`, `dist.integrity` และ `dist.shasum` ใช้ฟิลด์ที่เข้ากันได้กับ npm
  เพื่อให้ผู้ใช้ชี้ npm ไปยังมิเรอร์ได้หากต้องการ
- packument ของแพ็กเกจแบบมีขอบเขตรองรับทั้ง `/api/npm/@scope/name` และพาธคำขอ
  `/api/npm/@scope%2Fname` ที่เข้ารหัสตามรูปแบบของ npm

### `GET /api/npm/{package}/-/{tarball}.tgz`

สตรีมไบต์ tarball ของ ClawPack ที่อัปโหลดไว้แบบตรงทุกประการสำหรับไคลเอนต์มิเรอร์ npm

หมายเหตุ:

- ใช้บักเก็ตอัตราการดาวน์โหลด
- ส่วนหัวการดาวน์โหลดมี SHA-256 ของ ClawHub พร้อมข้อมูลเมตา integrity/shasum ของ npm
- การตรวจสอบและการตรวจสิทธิ์เข้าถึงแพ็กเกจส่วนตัวยังคงมีผล

### `GET /api/v1/resolve`

CLI ใช้เพื่อจับคู่ลายนิ้วมือในเครื่องกับเวอร์ชันที่รู้จัก

พารามิเตอร์คิวรี:

- `slug` (จำเป็น)
- `hash` (จำเป็น): sha256 เลขฐานสิบหก 64 อักขระของลายนิ้วมือบันเดิล

การตอบกลับ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ดาวน์โหลด ZIP ของเวอร์ชัน skill ที่โฮสต์ไว้ หรือส่งคืนข้อมูลส่งต่อไปยังซอร์ส GitHub สำหรับ
skill ปัจจุบันที่ใช้ GitHub เป็นแหล่งข้อมูล ซึ่งผ่านการสแกน `clean` หรือ `suspicious` และไม่มีเวอร์ชัน
ที่โฮสต์ไว้

พารามิเตอร์การค้นหา:

- `slug` (จำเป็น)
- `version` (ไม่บังคับ): สตริง semver
- `tag` (ไม่บังคับ): ชื่อแท็ก (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` ระบบจะใช้เวอร์ชันล่าสุด
- เวอร์ชันที่ลบแบบ soft-delete จะส่งคืน `410`
- การส่งต่อ skill ที่ใช้ GitHub เป็นแหล่งข้อมูลจะไม่พร็อกซีหรือทำสำเนาไบต์ การตอบกลับ JSON
  ประกอบด้วย `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  และ `archiveUrl`; สถานะการสแกน/สถานะปัจจุบันเป็นเงื่อนไขควบคุม และไม่รวมอยู่ในข้อมูลเมตาของเพย์โหลด
  เมื่อสำเร็จ
- สถิติการดาวน์โหลดจะนับข้อมูลระบุตัวตนที่ไม่ซ้ำกันต่อวันตาม UTC (`userId` เมื่อโทเค็น API ถูกต้อง มิฉะนั้นใช้ IP)

## เอ็นด์พอยต์การยืนยันตัวตน (Bearer token)

เอ็นด์พอยต์ทั้งหมดต้องใช้:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

ตรวจสอบความถูกต้องของโทเค็นและส่งคืนแฮนเดิลของผู้ใช้

### `POST /api/v1/skills`

เผยแพร่เวอร์ชันใหม่

- แนะนำให้ใช้: `multipart/form-data` พร้อม JSON `payload` + บล็อบ `files[]`
- ยอมรับเนื้อหา JSON ที่มี `files` (อ้างอิงด้วย storageId) เช่นกัน
- ฟิลด์เพย์โหลดที่ไม่บังคับ: `ownerHandle` เมื่อระบุ API จะค้นหาผู้เผยแพร่นั้น
  ทางฝั่งเซิร์ฟเวอร์ และกำหนดให้ผู้ดำเนินการต้องมีสิทธิ์เข้าถึงผู้เผยแพร่
- ฟิลด์เพย์โหลดที่ไม่บังคับ: `migrateOwner` เมื่อ `true` พร้อม `ownerHandle`
  skill ที่มีอยู่สามารถย้ายไปยังเจ้าของรายนั้นได้ หากผู้ดำเนินการเป็นผู้ดูแลระบบ/เจ้าของของผู้เผยแพร่ทั้ง
  รายปัจจุบันและรายเป้าหมาย หากไม่เลือกใช้ตัวเลือกนี้ การเปลี่ยนเจ้าของ
  จะถูกปฏิเสธ

### `POST /api/v1/packages`

เผยแพร่รีลีส code-plugin หรือ bundle-plugin

- ต้องยืนยันตัวตนด้วย Bearer token
- ต้องมี `multipart/form-data`
- ฟิลด์แบบฟอร์มที่อนุญาต ได้แก่ `payload`, บล็อบ `files` ที่ระบุซ้ำ หรือข้อมูลอ้างอิง tarball `clawpack`
  หนึ่งรายการ `clawpack` อาจเป็นบล็อบ `.tgz` หรือรหัสพื้นที่จัดเก็บที่ขั้นตอน upload-url ส่งคืน
  การเผยแพร่ด้วย storage-id ที่จัดเตรียมไว้ต้องระบุ
  `clawpackUploadTicket` ที่ส่งคืนพร้อม URL อัปโหลดนั้นด้วย
- ใช้ `files` หรือ `clawpack` อย่างใดอย่างหนึ่งเท่านั้น ห้ามใช้ทั้งคู่ในคำขอเดียวกัน
- เนื้อหา JSON และข้อมูลเมตา `payload.files` / `payload.artifact`
  ที่ผู้เรียกเป็นผู้ระบุจะถูกปฏิเสธ
- คำขอเผยแพร่แบบ multipart โดยตรงจำกัดไว้ที่ 18MB ส่วน tarball ของ ClawPack
  สามารถใช้ขั้นตอน upload-url ได้จนถึงขีดจำกัด tarball 120MB
- ฟิลด์เพย์โหลดที่ไม่บังคับ: `ownerHandle` เมื่อระบุ มีเพียงผู้ดูแลระบบเท่านั้นที่เผยแพร่ในนามของเจ้าของรายนั้นได้

ประเด็นสำคัญของการตรวจสอบความถูกต้อง:

- `family` ต้องเป็น `code-plugin` หรือ `bundle-plugin`
- แพ็กเกจ Plugin ต้องมี `openclaw.plugin.json` การอัปโหลด `.tgz` ของ ClawPack ต้อง
  มีรายการนี้ที่ `package/openclaw.plugin.json`
- code plugin ต้องมี `package.json`, ข้อมูลเมตาของรีโพซิทอรีซอร์ส, ข้อมูลเมตาของคอมมิตซอร์ส,
  ข้อมูลเมตาของสคีมาการกำหนดค่า, `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion`
- `openclaw.hostTargets` และ `openclaw.environment` เป็นข้อมูลเมตาที่ไม่บังคับ
- เฉพาะผู้เผยแพร่องค์กร `openclaw` และผู้เผยแพร่ส่วนบุคคลของสมาชิกองค์กร `openclaw`
  ปัจจุบันเท่านั้นที่เผยแพร่ไปยังช่องทาง `official` ได้
- การเผยแพร่ในนามของผู้อื่นยังคงตรวจสอบสิทธิ์การใช้ช่องทางอย่างเป็นทางการกับบัญชีเจ้าของเป้าหมาย

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

ลบแบบ soft-delete / กู้คืน skill (เจ้าของ ผู้ควบคุม หรือผู้ดูแลระบบ)

เนื้อหา JSON ที่ไม่บังคับ:

```json
{ "reason": "ระงับไว้เพื่อการควบคุมเนื้อหาระหว่างรอการตรวจสอบทางกฎหมาย" }
```

เมื่อระบุ `reason` ระบบจะจัดเก็บเป็นหมายเหตุการควบคุมของ skill และคัดลอกลงในบันทึกการตรวจสอบ
การลบแบบ soft-delete ที่เจ้าของเป็นผู้ดำเนินการจะสงวน slug ไว้ 30 วัน หลังจากนั้นผู้เผยแพร่
รายอื่นสามารถอ้างสิทธิ์ slug ได้ การตอบกลับการลบจะมี `slugReservedUntil` เมื่อมีการหมดอายุนี้
การซ่อนโดยผู้ควบคุม/ผู้ดูแลระบบและการนำออกด้วยเหตุผลด้านความปลอดภัยจะไม่หมดอายุในลักษณะนี้

การตอบกลับการลบ:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

รหัสสถานะ:

- `200`: สำเร็จ
- `401`: ไม่ได้รับอนุญาต
- `403`: ถูกห้าม
- `404`: ไม่พบ skill/ผู้ใช้
- `500`: ข้อผิดพลาดภายในเซิร์ฟเวอร์

### `POST /api/v1/users/publisher`

สำหรับผู้ดูแลระบบเท่านั้น ตรวจสอบให้แน่ใจว่ามีผู้เผยแพร่องค์กรสำหรับแฮนเดิล หากแฮนเดิลยังชี้ไปยัง
ผู้ใช้ร่วม/ผู้เผยแพร่ส่วนบุคคลแบบเดิม เอ็นด์พอยต์จะย้ายข้อมูลดังกล่าวไปเป็นผู้เผยแพร่องค์กรก่อน
สำหรับองค์กรที่สร้างใหม่ ให้ระบุ `memberHandle`; ผู้ดูแลระบบที่ดำเนินการจะไม่ถูกเพิ่มเป็นสมาชิก
`memberRole` มีค่าเริ่มต้นเป็น `owner`

- เนื้อหา: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- การตอบกลับ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

การสร้างผู้เผยแพร่องค์กรแบบบริการตนเองที่ผ่านการยืนยันตัวตน สร้างผู้เผยแพร่องค์กรใหม่และเพิ่ม
ผู้เรียกเป็นเจ้าของ เอ็นด์พอยต์นี้จะไม่ย้ายแฮนเดิลผู้ใช้/ส่วนบุคคลที่มีอยู่ และจะไม่
กำหนดให้ผู้เผยแพร่เป็นที่เชื่อถือ/เป็นทางการ

- เนื้อหา: `{ "handle": "opik", "displayName": "Opik" }`
- การตอบกลับ: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- ส่งคืน `409` เมื่อแฮนเดิลถูกใช้โดยผู้เผยแพร่ ผู้ใช้ หรือผู้เผยแพร่ส่วนบุคคลอยู่แล้ว

### `POST /api/v1/users/reserve`

สำหรับผู้ดูแลระบบเท่านั้น สงวน root slug และชื่อแพ็กเกจให้เจ้าของที่ชอบธรรมโดยไม่เผยแพร่
รีลีส ชื่อแพ็กเกจจะกลายเป็นแพ็กเกจตัวยึดตำแหน่งแบบส่วนตัวที่ไม่มีแถวรีลีส เพื่อให้เจ้าของรายเดิม
สามารถเผยแพร่รีลีส code-plugin หรือ bundle-plugin จริงไปยังชื่อนั้นได้ในภายหลัง

- เนื้อหา: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- การตอบกลับ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

สำหรับผู้ดูแลระบบเท่านั้น กู้คืนผู้เผยแพร่ส่วนบุคคลให้กับข้อมูลประจำตัว GitHub OAuth ทดแทนที่ผ่านการตรวจสอบ
โดยไม่แก้ไขแถวบัญชี Convex Auth คำขอต้องระบุรหัสบัญชีผู้ให้บริการ GitHub แบบแก้ไขไม่ได้ทั้งสองรายการ
ส่วนแฮนเดิลที่แก้ไขได้จะใช้เป็นเงื่อนไขป้องกันสำหรับผู้ปฏิบัติงานเท่านั้น

เอ็นด์พอยต์มีค่าเริ่มต้นเป็นการทดลองทำ การนำการกู้คืนไปใช้ต้องมี `dryRun: false` และ
`confirmIdentityVerified: true` หลังจากเจ้าหน้าที่ตรวจสอบความต่อเนื่องระหว่างข้อมูลประจำตัว GitHub
ทั้งสองรายการอย่างอิสระ การกู้คืนจะปฏิเสธโดยค่าเริ่มต้นเมื่อผู้เผยแพร่ส่วนบุคคลปัจจุบันของผู้ใช้ปลายทาง
มี skill, แพ็กเกจ หรือซอร์ส skill ของ GitHub
การกู้คืนยังย้ายข้อมูลฟิลด์ `ownerUserId` แบบเดิมสำหรับ skill ของผู้เผยแพร่ที่กู้คืน
นามแฝง slug ของ skill, แพ็กเกจ, คำเตือนจากตัวตรวจสอบแพ็กเกจ และแถวสรุปย่อการค้นหาที่สร้างขึ้น เพื่อให้
เส้นทางเจ้าของโดยตรงสอดคล้องกับอำนาจของผู้เผยแพร่รายใหม่ การสงวนแฮนเดิลที่มีการป้องกันและยังทำงานอยู่
สำหรับแฮนเดิลที่กู้คืนจะถูกกำหนดใหม่ให้ผู้ใช้ทดแทนด้วย เพื่อให้การซิงโครไนซ์โปรไฟล์ในภายหลัง
ไม่สามารถกู้คืนอำนาจที่ขัดแย้งกันของผู้ใช้เดิมได้ แต่ละตารางหลักจำกัดไว้ที่
100 แถวต่อธุรกรรมการนำไปใช้ การกู้คืนที่ใหญ่กว่านี้ต้องใช้การย้ายเจ้าของที่ดำเนินการต่อได้ก่อน
ซอร์ส skill ของ GitHub มีขอบเขตตามผู้เผยแพร่ และจะรายงานว่าตรวจสอบแล้วแทนที่จะเขียนใหม่

- เนื้อหา: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- การตอบกลับ: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### เอ็นด์พอยต์การจัดการ slug ของเจ้าของ

- `POST /api/v1/skills/{slug}/rename`
  - เนื้อหา: `{ "newSlug": "new-canonical-slug" }`
  - การตอบกลับ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - เนื้อหา: `{ "targetSlug": "canonical-target-slug" }`
  - การตอบกลับ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

หมายเหตุ:

- เอ็นด์พอยต์ทั้งสองต้องยืนยันตัวตนด้วยโทเค็น API และใช้ได้เฉพาะกับเจ้าของ skill เท่านั้น
- `rename` จะเก็บ slug ก่อนหน้าไว้เป็นนามแฝงสำหรับการเปลี่ยนเส้นทาง
- `merge` จะซ่อนรายการต้นทางและเปลี่ยนเส้นทาง slug ต้นทางไปยังรายการเป้าหมาย

### เอ็นด์พอยต์การโอนความเป็นเจ้าของ

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

แบนผู้ใช้และลบ skill ที่เป็นเจ้าของแบบถาวร (เฉพาะผู้ควบคุม/ผู้ดูแลระบบ)

เนื้อหา:

```json
{ "handle": "user_handle", "reason": "เหตุผลในการแบนที่ไม่บังคับ" }
```

หรือ

```json
{ "userId": "users_...", "reason": "เหตุผลในการแบนที่ไม่บังคับ" }
```

การตอบกลับ:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

ยกเลิกการแบนผู้ใช้และกู้คืน skill ที่มีสิทธิ์ (เฉพาะผู้ดูแลระบบ)

เนื้อหา:

```json
{ "handle": "user_handle", "reason": "เหตุผลในการยกเลิกการแบนที่ไม่บังคับ" }
```

หรือ

```json
{ "userId": "users_...", "reason": "เหตุผลในการยกเลิกการแบนที่ไม่บังคับ" }
```

การตอบกลับ:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

เปลี่ยนเหตุผลที่จัดเก็บไว้สำหรับการแบนที่มีอยู่ โดยไม่ยกเลิกการแบนหรือกู้คืน
เนื้อหา (เฉพาะผู้ดูแลระบบ) มีค่าเริ่มต้นเป็นการทดลองทำ เว้นแต่ `dryRun` จะเป็น `false`

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

พารามิเตอร์การค้นหา:

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

เพิ่ม/นำดาวออก (รายการเด่น) เอ็นด์พอยต์ทั้งสองเป็นแบบ idempotent

การตอบกลับ:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## เอ็นด์พอยต์ CLI แบบเดิม (เลิกใช้แล้ว)

ยังคงรองรับสำหรับ CLI เวอร์ชันเก่า:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

ดูแผนการนำออกที่ `DEPRECATIONS.md`

`POST /api/cli/upload-url` ส่งคืน `uploadUrl` และ `uploadTicket` การเผยแพร่
แพ็กเกจที่จัดเตรียม tarball ของ ClawPack ต้องส่งรหัสพื้นที่จัดเก็บที่ได้เป็น
`clawpack` และตั๋วที่ส่งคืนเป็น `clawpackUploadTicket`

## การค้นหารีจิสทรี (`/.well-known/clawhub.json`)

CLI สามารถค้นหาการตั้งค่ารีจิสทรี/การยืนยันตัวตนจากเว็บไซต์:

- `/.well-known/clawhub.json` (JSON, แนะนำให้ใช้)
- `/.well-known/clawdhub.json` (แบบเดิม)

สคีมา:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

หากโฮสต์ด้วยตนเอง ให้ให้บริการไฟล์นี้ (หรือกำหนด `CLAWHUB_REGISTRY` อย่างชัดเจน; แบบเดิมใช้ `CLAWDHUB_REGISTRY`)
