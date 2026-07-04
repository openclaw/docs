---
read_when:
    - การเพิ่ม/เปลี่ยนแปลง endpoints
    - การดีบักคำขอ CLI ↔ รีจิสทรี
summary: ข้อมูลอ้างอิง HTTP API (สาธารณะ + จุดปลายทาง CLI + การยืนยันตัวตน)
x-i18n:
    generated_at: "2026-07-04T18:24:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

URL ฐาน: `https://clawhub.ai` (ค่าเริ่มต้น)

พาธ v1 ทั้งหมดอยู่ภายใต้ `/api/v1/...`
`/api/...` และ `/api/cli/...` แบบเก่ายังคงอยู่เพื่อความเข้ากันได้ (ดู `DEPRECATIONS.md`)
OpenAPI: `/api/v1/openapi.json`

## การใช้แค็ตตาล็อกสาธารณะซ้ำ

ไดเรกทอรีของบุคคลที่สามอาจใช้ปลายทางอ่านแบบสาธารณะเพื่อแสดงรายการหรือค้นหา ClawHub Skills โปรดแคชผลลัพธ์ เคารพ `429`/`Retry-After` ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub แบบมาตรฐาน (`https://clawhub.ai/<owner>/skills/<slug>`) และหลีกเลี่ยงการสื่อว่า ClawHub รับรองไซต์บุคคลที่สามนั้น อย่าพยายามมิเรอร์เนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกโดยการกลั่นกรองออกนอกพื้นผิว API สาธารณะ

ทางลัด slug บนเว็บจะ resolve ข้ามกลุ่มรีจิสทรีได้ แต่ไคลเอนต์ API ควรใช้
URL มาตรฐานที่ปลายทางอ่านส่งกลับมา แทนการประกอบลำดับความสำคัญของ route
ขึ้นใหม่เอง

## ขีดจำกัดอัตรา

รูปแบบการบังคับใช้:

- คำขอไม่ระบุตัวตน: บังคับใช้ต่อ IP
- คำขอที่ยืนยันตัวตนแล้ว (โทเค็น Bearer ที่ถูกต้อง): บังคับใช้ต่อ bucket ของผู้ใช้
- หากโทเค็นหายไป/ไม่ถูกต้อง ลักษณะการทำงานจะ fallback ไปใช้การบังคับใช้ตาม IP
- ปลายทางเขียนที่ยืนยันตัวตนแล้วไม่ควรส่งคืนเพียง `Unauthorized` เปล่าๆ เมื่อ
  เซิร์ฟเวอร์รู้เหตุผล โทเค็นที่หายไป โทเค็นที่ไม่ถูกต้อง/ถูกเพิกถอน และ
  บัญชีที่ถูกลบ/แบน/ปิดใช้งาน ควรได้รับข้อความที่ดำเนินการต่อได้ เพื่อให้ไคลเอนต์
  CLI บอกผู้ใช้ได้ว่าอะไรบล็อกอยู่

- อ่าน: 3000/นาที ต่อ IP, 12000/นาที ต่อ key
- เขียน: 300/นาที ต่อ IP, 3000/นาที ต่อ key
- ดาวน์โหลด: 1200/นาที ต่อ IP, 6000/นาที ต่อ key (ปลายทางดาวน์โหลด)

ส่วนหัว:

- ความเข้ากันได้แบบเก่า: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- แบบมาตรฐาน: `RateLimit-Limit`, `RateLimit-Reset`
- เมื่อเป็น `429`: `X-RateLimit-Remaining: 0` และ `RateLimit-Remaining: 0`
- เมื่อเป็น `429`: `Retry-After`

ความหมายของส่วนหัว:

- `X-RateLimit-Reset`: วินาที Unix epoch แบบสัมบูรณ์
- `RateLimit-Reset`: จำนวนวินาทีจนกว่าจะรีเซ็ต (ดีเลย์)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: งบประมาณที่เหลือแน่นอนเมื่อมีอยู่
  คำขอที่สำเร็จแบบ sharded จะละเว้นส่วนหัวนี้ แทนการส่งคืนค่ารวมโดยประมาณแบบทั่วโลก
- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่ (ดีเลย์) เมื่อเป็น `429`

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

Rate limit exceeded
```

คำแนะนำสำหรับไคลเอนต์:

- หากมี `Retry-After` ให้รอจำนวนวินาทีนั้นก่อนลองใหม่
- ใช้ backoff แบบมี jitter เพื่อหลีกเลี่ยงการลองใหม่พร้อมกัน
- หากไม่มี `Retry-After` ให้ fallback ไปใช้ `RateLimit-Reset` (หรือคำนวณจาก `X-RateLimit-Reset`)

แหล่งที่มาของ IP:

- ใช้ส่วนหัว IP ไคลเอนต์ที่เชื่อถือได้ รวมถึง `cf-connecting-ip` เฉพาะเมื่อ
  deployment เปิดใช้ส่วนหัว forwarded ที่เชื่อถือได้อย่างชัดเจน
- ClawHub ใช้ส่วนหัว forwarding ที่เชื่อถือได้เพื่อระบุ IP ของไคลเอนต์ที่ edge
- หากไม่มี IP ไคลเอนต์ที่เชื่อถือได้ คำขอไม่ระบุตัวตนจะใช้ bucket fallback
  ที่มีขอบเขตเฉพาะตามชนิดของขีดจำกัดอัตรา bucket fallback เหล่านี้จะไม่รวม
  พาธ slug ชื่อแพ็กเกจ เวอร์ชัน query string หรือพารามิเตอร์ artifact อื่นๆ
  ที่ผู้เรียกส่งมา

## การตอบกลับข้อผิดพลาด

การตอบกลับข้อผิดพลาด v1 สาธารณะเป็นข้อความธรรมดาพร้อม `content-type: text/plain; charset=utf-8`
ซึ่งรวมถึงความล้มเหลวในการตรวจสอบ (`400`), ทรัพยากรสาธารณะที่หายไป (`404`), ความล้มเหลวด้าน auth และ
สิทธิ์ (`401`/`403`), ขีดจำกัดอัตรา (`429`) และการดาวน์โหลดที่ถูกบล็อก ไคลเอนต์
ควรอ่านข้อความใน body การตอบกลับเป็นสตริงที่มนุษย์อ่านได้ พารามิเตอร์ query ที่ไม่รู้จักจะ
ถูกละเว้นเพื่อความเข้ากันได้ แต่พารามิเตอร์ query ที่รู้จักซึ่งมีค่าไม่ถูกต้องจะส่งคืน
`400`

## ปลายทางสาธารณะ (ไม่มี auth)

### `GET /api/v1/search`

พารามิเตอร์ query:

- `q` (จำเป็น): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม
- `highlightedOnly` (ไม่บังคับ): `true` เพื่อกรองให้เหลือเฉพาะ Skills ที่ถูกไฮไลต์
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias แบบเก่าสำหรับ `nonSuspiciousOnly`

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

- ผลลัพธ์จะถูกส่งคืนตามลำดับความเกี่ยวข้อง (ความคล้ายของ embedding + การ boost token ของ slug/name ที่ตรงแบบแม่นยำ + ค่าความนิยมพื้นฐานเล็กน้อย)
- ความเกี่ยวข้องมีน้ำหนักมากกว่าความนิยม slug ที่แม่นยำหรือ token ของชื่อที่แสดงที่ตรงกัน อาจจัดอันดับสูงกว่าการตรงกันที่หลวมกว่าซึ่งมี engagement สูงกว่ามาก
- ข้อความ ASCII จะถูกแบ่ง token ตามขอบเขตคำและเครื่องหมายวรรคตอน ตัวอย่างเช่น `personal-map` มี token `map` แบบเดี่ยว ในขณะที่ `amap-jsapi-skill` มี `amap`, `jsapi` และ `skill`; ดังนั้นการค้นหา `map` จึงทำให้ `personal-map` มีการตรงกันเชิงคำศัพท์ที่แข็งแรงกว่า `amap-jsapi-skill`
- ความนิยมถูกปรับด้วย log และจำกัดเพดาน Skills ที่มี engagement สูงอาจจัดอันดับต่ำกว่าได้เมื่อข้อความคำค้นตรงกันอ่อนกว่า
- สถานะการกลั่นกรองที่น่าสงสัยหรือซ่อนอยู่สามารถนำ Skill ออกจากการค้นหาสาธารณะได้ ขึ้นอยู่กับตัวกรองของผู้เรียกและสถานะการกลั่นกรองปัจจุบัน

คำแนะนำด้านการค้นพบสำหรับผู้เผยแพร่:

- ใส่คำที่ผู้ใช้จะค้นหาจริงๆ ในชื่อที่แสดง สรุป และแท็ก ใช้ token slug แบบเดี่ยวเฉพาะเมื่อมันเป็นตัวตนที่เสถียรซึ่งคุณต้องการเก็บไว้ด้วย
- อย่าเปลี่ยนชื่อ slug เพียงเพื่อไล่ตามคำค้นเดียว เว้นแต่ slug ใหม่จะเป็นชื่อมาตรฐานระยะยาวที่ดีกว่า slug เก่าจะกลายเป็น alias redirect แต่ URL มาตรฐาน slug ที่แสดง และ digest การค้นหาในอนาคตจะใช้ slug ใหม่
- alias จากการเปลี่ยนชื่อจะรักษาการ resolve สำหรับ URL เก่าและการติดตั้งที่ resolve ผ่านรีจิสทรี แต่การจัดอันดับการค้นหาจะอิงตามเมตาดาต้า Skill มาตรฐานหลังจากการเปลี่ยนชื่อถูกทำดัชนีแล้ว สถิติเดิมจะคงอยู่กับ Skill
- หาก Skill หายไปจากการมองเห็นอย่างไม่คาดคิด ให้ตรวจสถานะการกลั่นกรองก่อนด้วย `clawhub inspect @owner/slug` ขณะล็อกอิน ก่อนเปลี่ยนเมตาดาต้าที่เกี่ยวกับการจัดอันดับ

### `GET /api/v1/skills`

พารามิเตอร์ query:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–200)
- `cursor` (ไม่บังคับ): cursor แบ่งหน้าสำหรับการเรียงลำดับที่ไม่ใช่ `trending`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), alias การติดตั้งแบบเก่า `installsCurrent`/`installs`/`installsAllTime` map ไปยัง `downloads`, `trending`
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias แบบเก่าสำหรับ `nonSuspiciousOnly`

ค่า `sort` ที่ไม่ถูกต้องจะส่งคืน `400`

หมายเหตุ:

- `recommended` ใช้สัญญาณ engagement และความใหม่
- `trending` จัดอันดับตามการติดตั้งใน 7 วันที่ผ่านมา (อิง telemetry)
- `createdAt` เสถียรสำหรับการ crawl Skill ใหม่; `updated` เปลี่ยนเมื่อ Skills เดิมถูกเผยแพร่ซ้ำ
- เมื่อ `nonSuspiciousOnly=true` การเรียงลำดับแบบใช้ cursor อาจส่งคืนรายการน้อยกว่า `limit` ในหนึ่งหน้า เพราะ Skills ที่น่าสงสัยถูกกรองหลังจากดึงหน้าแล้ว
- ใช้ `nextCursor` เพื่อดำเนินการแบ่งหน้าต่อเมื่อมีอยู่ หน้าที่สั้นไม่ได้หมายความว่าเป็นจุดสิ้นสุดของผลลัพธ์ด้วยตัวเอง

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

- slug เก่าที่สร้างโดย flow การเปลี่ยนชื่อ/merge ของเจ้าของจะ resolve ไปยัง Skill มาตรฐาน
- `metadata.os`: ข้อจำกัด OS ที่ประกาศใน frontmatter ของ Skill (เช่น `["macos"]`, `["linux"]`) เป็น `null` หากไม่ได้ประกาศ
- `metadata.systems`: เป้าหมายระบบ Nix (เช่น `["aarch64-darwin", "x86_64-linux"]`) เป็น `null` หากไม่ได้ประกาศ
- `metadata` เป็น `null` หาก Skill ไม่มีเมตาดาต้าแพลตฟอร์ม
- `moderation` จะถูกรวมไว้เฉพาะเมื่อ Skill ถูก flag หรือเจ้าของกำลังดูอยู่

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

- เจ้าของและผู้กลั่นกรองสามารถเข้าถึงรายละเอียดการกลั่นกรองสำหรับ Skills ที่ซ่อนอยู่ได้
- ผู้เรียกสาธารณะจะได้รับ `200` เฉพาะสำหรับ Skills ที่มองเห็นได้และถูก flag แล้ว
- หลักฐานจะถูก redacted สำหรับผู้เรียกสาธารณะ และรวม raw snippets เฉพาะสำหรับเจ้าของ/ผู้กลั่นกรองเท่านั้น

### `POST /api/v1/skills/{slug}/report`

รายงาน Skill เพื่อให้ผู้กลั่นกรองตรวจสอบ รายงานอยู่ระดับ Skill, อาจลิงก์กับ
เวอร์ชันได้ และป้อนเข้าสู่คิวรายงาน Skill

Auth:

- ต้องใช้โทเค็น API

คำขอ:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
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

ปลายทางผู้กลั่นกรอง/admin สำหรับรับรายงาน Skill

พารามิเตอร์ query:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `confirmed`, `dismissed` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-200)
- `cursor` (ไม่บังคับ): cursor แบ่งหน้า

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

ปลายทางผู้กลั่นกรอง/admin สำหรับ resolve หรือเปิดรายงาน Skill อีกครั้ง

คำขอ:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` จำเป็นสำหรับ `confirmed` และ `dismissed`; อาจละเว้นได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "hide"` พร้อมรายงานที่ triage แล้ว
เพื่อซ่อน Skill ใน workflow เดียวกันที่ตรวจสอบย้อนหลังได้

### `GET /api/v1/skills/{slug}/versions`

พารามิเตอร์ query:

- `limit` (ไม่บังคับ): จำนวนเต็ม
- `cursor` (ไม่บังคับ): cursor แบ่งหน้า

### `GET /api/v1/skills/{slug}/versions/{version}`

ส่งคืนเมตาดาต้าเวอร์ชัน + รายการไฟล์

- `version.security` รวมสถานะการยืนยันการสแกนที่ normalize แล้วและรายละเอียด scanner
  (VirusTotal + LLM) เมื่อมีอยู่

### `GET /api/v1/skills/{slug}/scan`

ส่งคืนรายละเอียดการยืนยันการสแกนความปลอดภัยสำหรับเวอร์ชัน Skill

พารามิเตอร์ query:

- `version` (ไม่บังคับ): สตริงเวอร์ชันเฉพาะ
- `tag` (ไม่บังคับ): resolve เวอร์ชันที่ติดแท็ก (ตัวอย่างเช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- รวมสถานะการตรวจสอบที่ทำให้เป็นมาตรฐานแล้ว พร้อมรายละเอียดเฉพาะของตัวสแกน
- `security.hasScanResult` เป็น `true` เฉพาะเมื่อตัวสแกนให้คำตัดสินที่ชัดเจน (`clean`, `suspicious`, หรือ `malicious`)
- `moderation` คือสแนปช็อตการกลั่นกรองระดับ Skill ปัจจุบันที่ได้จากเวอร์ชันล่าสุด
- เมื่อสอบถามเวอร์ชันในอดีต ให้ตรวจสอบ `moderation.matchesRequestedVersion` และ `moderation.sourceVersion` ก่อนถือว่า `moderation` และ `security` อยู่ในบริบทเวอร์ชันเดียวกัน

### `POST /api/v1/skills/-/scan`

ปลายทางส่งงานที่ต้องยืนยันตัวตนสำหรับงาน ClawScan ใหม่

ไม่รองรับการสแกนอัปโหลดในเครื่องอีกต่อไป คำขอที่ใช้
`multipart/form-data` หรือ `{ "source": { "kind": "upload" } }` จะส่งคืน `410`

การสแกนที่เผยแพร่แล้วใช้ JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

หมายเหตุ:

- เพย์โหลดคำขอสแกนและรายงานที่ดาวน์โหลดได้จะหมดอายุจากที่เก็บคำขอสแกนหลังพ้นช่วงเวลาเก็บรักษา
- การสแกนที่เผยแพร่แล้วต้องมีสิทธิ์จัดการของเจ้าของ/ผู้เผยแพร่ หรืออำนาจผู้ดูแล/ผู้ดูแลระบบของแพลตฟอร์ม
- การสแกนที่เผยแพร่แล้วจะเขียนกลับเฉพาะเมื่อ `update: true` และการสแกนเสร็จสมบูรณ์
- การตอบกลับคือ `202` พร้อม `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`
- งานสแกนเป็นแบบอะซิงโครนัส คำขอสแกนด้วยตนเองจะได้รับลำดับความสำคัญก่อนงานเผยแพร่/เติมย้อนหลังปกติ แต่การเสร็จสิ้นยังขึ้นอยู่กับความพร้อมของ worker

### `GET /api/v1/skills/-/scan/{scanId}`

ปลายทาง polling ที่ต้องยืนยันตัวตนสำหรับการสแกนที่ส่งแล้ว

- ส่งคืนสถานะ queued/running/succeeded/failed
- ส่งคืน `queue.queuedAhead` และ `queue.position` ขณะอยู่ในคิว เพื่อให้ไคลเอนต์แสดงจำนวนการสแกนด้วยตนเองที่มีลำดับความสำคัญซึ่งอยู่ก่อนคำขอได้ คิวที่ใหญ่มากจะถูกจำกัดและรายงานด้วย `queuedAheadIsEstimate: true`
- เมื่อพร้อมใช้งาน `report` จะมีส่วน `clawscan`, `skillspector`, `staticAnalysis`, และ `virustotal`
- งานสแกนที่ล้มเหลวจะส่งคืน `status: "failed"` พร้อม `lastError`

### `GET /api/v1/skills/-/scan/{scanId}/download`

ปลายทางคลังรายงานที่ต้องยืนยันตัวตน

- ต้องเป็นการสแกนที่สำเร็จแล้ว การสแกนที่ยังไม่สิ้นสุดจะส่งคืน `409`
- ส่งคืน ZIP ที่มี `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, และ `README.md`

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

ปลายทางคลังรายงานที่จัดเก็บไว้ซึ่งต้องยืนยันตัวตนสำหรับเวอร์ชันที่ส่งแล้ว

- ต้องมีสิทธิ์จัดการของเจ้าของ/ผู้เผยแพร่ต่อ Skill หรือ Plugin หรืออำนาจผู้ดูแล/ผู้ดูแลระบบของแพลตฟอร์ม
- ส่งคืนผลการสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งมาตรงกันพอดี รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อนไว้
- `kind` มีค่าเริ่มต้นเป็น `skill`; ใช้ `kind=plugin` สำหรับการสแกน Plugin/แพ็กเกจ
- ส่งคืนรูปแบบ ZIP เดียวกับการดาวน์โหลดคำขอสแกน

### `POST /api/v1/skills/-/scan/batch`

เส้นทางสแกนซ้ำแบบชุด canonical สำหรับผู้ดูแลระบบเท่านั้น รับรูปแบบเพย์โหลดเดียวกับ `POST /api/v1/skills/-/rescan-batch` แบบเดิม

### `POST /api/v1/skills/-/scan/batch/status`

เส้นทางสถานะแบบชุด canonical สำหรับผู้ดูแลระบบเท่านั้น รับ `{ "jobIds": ["..."] }` และส่งคืนตัวนับรวมเดียวกับ `POST /api/v1/skills/-/rescan-batch/status` แบบเดิม

### `GET /api/v1/skills/{slug}/verify`

ส่งคืนซองการตรวจสอบ Skill Card ที่ใช้โดย `clawhub skill verify`

พารามิเตอร์คำค้น:

- `version` (ไม่บังคับ): สตริงเวอร์ชันที่ระบุ
- `tag` (ไม่บังคับ): แปลงแท็กเป็นเวอร์ชัน (เช่น `latest`)

หมายเหตุ:

- `ok` เป็น `true` เฉพาะเมื่อเวอร์ชันที่เลือกมี Skill Card ที่สร้างแล้ว ไม่ถูกการกลั่นกรองบล็อกว่าเป็นมัลแวร์ และการตรวจสอบ ClawScan เป็น clean
- ข้อมูลระบุตัวตนของ Skill, ข้อมูลระบุตัวตนของผู้เผยแพร่, และเมทาดาทาของเวอร์ชันที่เลือกเป็นฟิลด์ระดับบนสุดของซอง (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) เพื่อให้ระบบอัตโนมัติใน shell อ่านได้โดยไม่ต้องแกะ wrapper ซ้อนกัน
- `security` คือคำตัดสิน ClawScan/security ระดับบนสุด ระบบอัตโนมัติควรอ้างอิงจาก `ok`, `decision`, `reasons`, และ `security.status`
- `security.signals` มีหลักฐานสนับสนุนจากตัวสแกน เช่น `staticScan`, `virusTotal`, และ `skillSpector`
- `security.signals.dependencyRegistry` ถูกคงไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่ตัวสแกนการมีอยู่ของ dependency registry ถูกเลิกใช้แล้ว และคีย์นี้เป็น `null` เสมอ
- `provenance` เป็น `server-resolved-github-import` เฉพาะเมื่อ ClawHub แปลงและจัดเก็บ GitHub repo/ref/commit/path ระหว่างเผยแพร่หรือนำเข้าเท่านั้น ไม่เช่นนั้นจะเป็น `unavailable`

### `POST /api/v1/skills/-/security-verdicts`

ส่งคืนคำตัดสินด้านความปลอดภัยแบบย่อปัจจุบันสำหรับเวอร์ชัน Skill ที่ระบุชัดเจน
ปลายทางคอลเลกชันนี้มีไว้สำหรับไคลเอนต์ที่รู้อยู่แล้วว่าต้องแสดง
เวอร์ชัน Skill ของ ClawHub ที่ติดตั้งใดบ้าง เช่น OpenClaw Control UI

คำขอ:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

หมายเหตุ:

- `items` ต้องมีคู่ `{ slug, version }` ที่ไม่ซ้ำกัน 1-100 คู่
- ผลลัพธ์แยกตามแต่ละรายการ Skill หรือเวอร์ชันที่หายไปหนึ่งรายการจะไม่ทำให้การตอบกลับทั้งหมดล้มเหลว
- การตอบกลับมีเฉพาะข้อมูลความปลอดภัย ไม่รวมข้อมูล Skill Card, สถานะการ์ดที่สร้างแล้ว, รายการไฟล์อาร์ติแฟกต์, หรือเพย์โหลดตัวสแกนแบบละเอียด
- `security.signals` มีเฉพาะหลักฐานสนับสนุนระดับสถานะ ใช้ `/scan` หรือหน้า security-audit ของ ClawHub สำหรับรายละเอียดตัวสแกนแบบเต็ม
- `security.signals.dependencyRegistry` ถูกคงไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่ตัวสแกนการมีอยู่ของ dependency registry ถูกเลิกใช้แล้ว และคีย์นี้เป็น `null` เสมอ
- การไม่มี Skill Card ไม่กระทบต่อ `ok`, `decision`, หรือ `reasons` ของปลายทางนี้ ไคลเอนต์ควรอ่าน `skill-card.md` ที่ติดตั้งไว้ในเครื่องเมื่อต้องการเนื้อหาการ์ด
- ใช้ `/verify` เมื่อต้องการซองการตรวจสอบ Skill Card สำหรับ Skill เดียว, `/card` เมื่อต้องการ markdown ของการ์ดที่สร้างแล้ว, และ `/scan` เมื่อต้องการข้อมูลตัวสแกนแบบละเอียด

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

พารามิเตอร์ Query:

- `path` (จำเป็น)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือเวอร์ชันล่าสุด
- ขีดจำกัดขนาดไฟล์: 200KB

### `GET /api/v1/packages`

ปลายทางแค็ตตาล็อกรวมสำหรับ:

- Skills
- Plugin แบบโค้ด
- Plugin แบบบันเดิล

พารามิเตอร์ Query:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า
- `family` (ไม่บังคับ): `skill`, `code-plugin`, หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community`, หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended`, `trending`, `downloads`, alias ดั้งเดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอถูกจำกัดขอบเขตไปยังแพ็กเกจ Plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, หรือปลายทางแพ็กเกจที่มี
  `family=code-plugin`/`family=bundle-plugin`) หมวดหมู่ที่ควบคุมไว้และ
  alias ตัวกรอง v1 ดั้งเดิมมีเอกสารอยู่ภายใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` หรือ `sort` จะส่งคืน `400` พารามิเตอร์ Query ที่ไม่รู้จักจะถูกละเว้น
- `GET /api/v1/code-plugins` และ `GET /api/v1/bundle-plugins` ยังคงเป็น alias แบบตระกูลคงที่
- รายการ Skill ยังคงอิงกับรีจิสทรี Skill และยังเผยแพร่ได้ผ่าน `POST /api/v1/skills` เท่านั้น
- `POST /api/v1/packages` ยังคงใช้สำหรับรีลีส code-plugin และ bundle-plugin เท่านั้น
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องแพ็กเกจสาธารณะเท่านั้น
- ผู้เรียกที่ผ่านการตรวจสอบสิทธิ์สามารถเห็นแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดในผลลัพธ์รายการ/การค้นหา
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ผ่านการตรวจสอบสิทธิ์สามารถอ่านได้

### `GET /api/v1/packages/search`

ค้นหาแค็ตตาล็อกรวมใน Skills + แพ็กเกจ Plugin

พารามิเตอร์ Query:

- `q` (จำเป็น): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `family` (ไม่บังคับ): `skill`, `code-plugin`, หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community`, หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอถูกจำกัดขอบเขตไปยังแพ็กเกจ Plugin หมวดหมู่ที่ควบคุมไว้และ alias ตัวกรอง
  v1 ดั้งเดิมมีเอกสารอยู่ภายใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured` หรือ
  `highlightedOnly` จะส่งคืน `400` พารามิเตอร์ Query ที่ไม่รู้จักจะถูกละเว้น
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องแพ็กเกจสาธารณะเท่านั้น
- ผู้เรียกที่ผ่านการตรวจสอบสิทธิ์สามารถค้นหาแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดได้
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ผ่านการตรวจสอบสิทธิ์สามารถอ่านได้

### `GET /api/v1/plugins`

เรียกดูแค็ตตาล็อกเฉพาะ Plugin ครอบคลุมแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์ Query:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `recommended` (ค่าเริ่มต้น), `trending`, `downloads`, `updated`, alias ดั้งเดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

alias ตัวกรอง v1 ดั้งเดิมยังคงยอมรับบนปลายทางการอ่าน:

- `mcp-tooling`, `data` และ `automation` จะถูกแปลงเป็น `tools`
- `observability` และ `deployment` จะถูกแปลงเป็น `gateway`
- `dev-tools` จะถูกแปลงเป็น `runtime`

`trending` เป็นตารางอันดับการติดตั้ง/ดาวน์โหลดในช่วงเจ็ดวัน และไม่ได้ใช้ยอดรวมตลอดเวลา
บนปลายทางรวม `/api/v1/packages` ค่านี้ใช้เฉพาะกับ Plugin เท่านั้น ใช้
`/api/v1/skills?sort=trending` สำหรับแค็ตตาล็อก Skill

alias ดั้งเดิมไม่ถูกยอมรับเป็นค่าหมวดหมู่ที่จัดเก็บหรือที่ผู้เขียนประกาศ

### `GET /api/v1/skills/export`

ส่งออก Skills สาธารณะล่าสุดเป็นชุดสำหรับการวิเคราะห์แบบออฟไลน์

การตรวจสอบสิทธิ์:

- ต้องมีโทเค็น API

พารามิเตอร์ Query:

- `startDate` (จำเป็น): ขอบเขตล่างเป็นมิลลิวินาที Unix สำหรับ `updatedAt` ของ Skill
- `endDate` (จำเป็น): ขอบเขตบนเป็นมิลลิวินาที Unix สำหรับ `updatedAt` ของ Skill
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าจากการตอบกลับก่อนหน้า

การตอบกลับ:

- Body: ไฟล์เก็บถาวร ZIP
- Skill ที่ส่งออกแต่ละรายการมีรากอยู่ที่ `{publisher}/{slug}/`
- Skill ที่โฮสต์ไว้จะรวมไฟล์เวอร์ชันที่จัดเก็บล่าสุด และถูกระบุไว้ใน
  `_manifest.json` พร้อม `sourceRef: "public-clawhub"`
- Skill ปัจจุบันที่อิงกับ GitHub ซึ่งมีการสแกนเป็น `clean` หรือ `suspicious` จะรวม
  `_source_handoff.json` พร้อม `sourceRef: "public-github"`, repo, commit, path,
  แฮชเนื้อหา และ URL ไฟล์เก็บถาวร โดยจะไม่รวมไฟล์ซอร์สที่โฮสต์บน ClawHub
- Skill แต่ละรายการจะรวม `_export_skill_meta.json`
- `_manifest.json` จะถูกรวมไว้ที่ราก ZIP เสมอ
- `_errors.json` จะถูกรวมไว้เมื่อไม่สามารถส่งออก Skill หรือไฟล์แต่ละรายการได้

ส่วนหัว:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

ส่งออกชุดใหญ่ของรุ่นเผยแพร่ล่าสุดของ Plugin สาธารณะสำหรับการวิเคราะห์แบบออฟไลน์

การยืนยันตัวตน:

- ต้องใช้โทเค็น API

พารามิเตอร์คำค้น:

- `startDate` (จำเป็น): ขอบเขตล่างแบบมิลลิวินาที Unix สำหรับ `updatedAt` ของ Plugin
- `endDate` (จำเป็น): ขอบเขตบนแบบมิลลิวินาที Unix สำหรับ `updatedAt` ของ Plugin
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าจากการตอบกลับก่อนหน้า
- `family` (ไม่บังคับ): `code-plugin` หรือ `bundle-plugin` หากละไว้หมายถึงทั้งสอง
  ตระกูล Plugin

การตอบกลับ:

- เนื้อหา: ไฟล์ ZIP archive
- Plugin ที่ส่งออกแต่ละรายการมีรูทอยู่ที่ `{family}/{packageName}/`
- Plugin ที่ส่งออกแต่ละรายการมีไฟล์ที่จัดเก็บไว้ของรุ่นเผยแพร่ล่าสุด
- เมทาดาทาการส่งออกต่อ Plugin ถูกจัดเก็บไว้ที่
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`
- `_manifest.json` จะถูกรวมไว้ที่รูทของ ZIP เสมอ
- `_errors.json` จะถูกรวมไว้เมื่อไม่สามารถส่งออก Plugin หรือไฟล์บางรายการได้

ส่วนหัว:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

ค้นหาเฉพาะ Plugin ในแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์คำค้น:

- `q` (จำเป็น): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

หมายเหตุ:

- นามแฝงตัวกรอง v1 แบบเดิมที่บันทึกไว้ใต้ `GET /api/v1/plugins` ก็รองรับด้วย
- การกรองหมวดหมู่เป็นตัวกรอง API จริงที่อ้างอิงแถวไดเจสต์หมวดหมู่ของ Plugin
  ไม่ใช่การเขียนคำค้นใหม่
- ผลลัพธ์ถูกส่งคืนตามลำดับความเกี่ยวข้อง และปัจจุบันยังไม่มีการแบ่งหน้า
- ตัวควบคุมการจัดเรียงใน UI เบราว์เซอร์สำหรับการค้นหา Plugin จะจัดเรียงผลลัพธ์ความเกี่ยวข้องที่โหลดแล้วใหม่
  ให้ตรงกับพฤติกรรมการเรียกดู `/skills` ปัจจุบัน

### `GET /api/v1/packages/{name}`

ส่งคืนเมทาดาทารายละเอียดแพ็กเกจ

หมายเหตุ:

- Skills สามารถ resolve ผ่านเส้นทางนี้ในแค็ตตาล็อกแบบรวมได้เช่นกัน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะสามารถอ่านผู้เผยแพร่ที่เป็นเจ้าของได้

### `DELETE /api/v1/packages/{name}`

ลบแพ็กเกจและรุ่นเผยแพร่ทั้งหมดแบบ soft-delete

หมายเหตุ:

- ต้องใช้โทเค็น API สำหรับเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลผู้เผยแพร่องค์กร,
  ผู้ดูแลแพลตฟอร์ม หรือผู้ดูแลระบบแพลตฟอร์ม

### `GET /api/v1/packages/{name}/versions`

ส่งคืนประวัติเวอร์ชัน

พารามิเตอร์คำค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

หมายเหตุ:

- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะสามารถอ่านผู้เผยแพร่ที่เป็นเจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}`

ส่งคืนแพ็กเกจหนึ่งเวอร์ชัน รวมถึงเมทาดาทาไฟล์ ความเข้ากันได้
การตรวจสอบ เมทาดาทาอาร์ติแฟกต์ และข้อมูลการสแกน

หมายเหตุ:

- `version.artifact.kind` คือ `legacy-zip` สำหรับไฟล์ archive แพ็กเกจแบบเก่า หรือ
  `npm-pack` สำหรับรุ่นเผยแพร่ที่อิง ClawPack
- รุ่นเผยแพร่ ClawPack มีฟิลด์ที่เข้ากันได้กับ npm ได้แก่ `npmIntegrity`, `npmShasum` และ
  `npmTarballName`
- `version.sha256hash` เป็นเมทาดาทาความเข้ากันได้ที่เลิกใช้แล้วสำหรับไคลเอนต์เก่า โดย
  แฮชไบต์ ZIP ที่แน่นอนซึ่งส่งคืนโดย `/api/v1/packages/{name}/download`
  ไคลเอนต์สมัยใหม่ควรใช้ `version.artifact.sha256` ซึ่งระบุ
  อาร์ติแฟกต์รุ่นเผยแพร่แบบมาตรฐาน
- `version.vtAnalysis`, `version.llmAnalysis` และ `version.staticScan` จะถูกรวมไว้
  เมื่อมีข้อมูลการสแกน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะสามารถอ่านผู้เผยแพร่ที่เป็นเจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}/security`

ส่งคืนสรุปความปลอดภัยและความน่าเชื่อถือของรุ่นเผยแพร่แพ็กเกจที่แน่นอนสำหรับไคลเอนต์ติดตั้ง
นี่คือพื้นผิวการใช้งานสาธารณะของ OpenClaw สำหรับตัดสินใจว่า
รุ่นเผยแพร่ที่ resolve แล้วสามารถติดตั้งได้หรือไม่

การยืนยันตัวตน:

- เอนด์พอยต์อ่านแบบสาธารณะ ไม่ต้องใช้โทเค็นเจ้าของ ผู้เผยแพร่ ผู้ดูแล หรือผู้ดูแลระบบ

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
  แพ็กเกจรีจิสทรีที่ resolve แล้ว
- `release.releaseId`, `release.version` และ `release.createdAt` ระบุ
  รุ่นเผยแพร่ที่แน่นอนซึ่งถูกประเมิน
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` และ `release.npmTarballName` จะมีอยู่เมื่อทราบสำหรับ
  อาร์ติแฟกต์รุ่นเผยแพร่
- `trust.scanStatus` คือสถานะความน่าเชื่อถือที่มีผลซึ่งได้มาจากอินพุตของสแกนเนอร์
  และการกลั่นกรองรุ่นเผยแพร่ด้วยตนเอง
- `trust.moderationState` สามารถเป็นค่าว่างได้ โดยเป็น `null` เมื่อไม่มีการกลั่นกรองรุ่นเผยแพร่ด้วยตนเอง
- `trust.blockedFromDownload` คือสัญญาณบล็อกการติดตั้ง OpenClaw และไคลเอนต์ติดตั้งอื่น
  ควรบล็อกการติดตั้งเมื่อค่านี้เป็น `true` แทนที่จะ
  คำนวณกฎการบล็อกใหม่จากฟิลด์สแกนเนอร์หรือการกลั่นกรอง
- `trust.reasons` คือรายการคำอธิบายสำหรับผู้ใช้และการตรวจสอบ รหัสเหตุผล
  เป็นสตริงสั้นที่เสถียร เช่น `manual:quarantined`, `scan:malicious`
  และ `package:malicious`
- `trust.pending` หมายความว่าอินพุตความน่าเชื่อถือหนึ่งรายการขึ้นไปยังรอการดำเนินการให้เสร็จ
- `trust.stale` หมายความว่าสรุปความน่าเชื่อถือถูกคำนวณจากอินพุตที่ล้าสมัย และ
  ควรถูกปฏิบัติเสมือนต้องรีเฟรชก่อนตัดสินใจอนุญาตด้วยความมั่นใจสูง

หมายเหตุ:

- เอนด์พอยต์นี้เจาะจงตามเวอร์ชัน ไคลเอนต์ควรเรียกหลังจาก resolve
  เวอร์ชันแพ็กเกจที่ตั้งใจจะติดตั้ง ไม่ใช่เพียงหลังจากอ่านเมทาดาทา
  แพ็กเกจล่าสุด
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะสามารถอ่านผู้เผยแพร่ที่เป็นเจ้าของได้
- เอนด์พอยต์นี้ตั้งใจให้แคบกว่าเอนด์พอยต์การกลั่นกรองของเจ้าของ/ผู้ดูแล
  โดยเปิดเผยการตัดสินใจติดตั้งและคำอธิบายสาธารณะ ไม่ใช่
  ตัวตนผู้รายงาน เนื้อหารายงาน หลักฐานส่วนตัว หรือไทม์ไลน์การตรวจสอบภายใน

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

ส่งคืนเมทาดาทาตัว resolve อาร์ติแฟกต์อย่างชัดเจนสำหรับเวอร์ชันแพ็กเกจ

หมายเหตุ:

- เวอร์ชันแพ็กเกจแบบเดิมส่งคืนอาร์ติแฟกต์ `legacy-zip` และ
  `downloadUrl` ของ ZIP แบบเดิม
- เวอร์ชัน ClawPack ส่งคืนอาร์ติแฟกต์ `npm-pack`, ฟิลด์ integrity ของ npm,
  `tarballUrl` และ URL ความเข้ากันได้ของ ZIP แบบเดิม
- นี่คือพื้นผิวตัว resolve ของ OpenClaw ซึ่งหลีกเลี่ยงการเดารูปแบบ archive จาก
  URL ที่ใช้ร่วมกัน

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ดาวน์โหลดอาร์ติแฟกต์ของเวอร์ชันผ่านเส้นทางตัว resolve ที่ชัดเจน

หมายเหตุ:

- เวอร์ชัน ClawPack สตรีมไบต์ `.tgz` ของ npm-pack ที่อัปโหลดไว้แบบตรงตัว
- เวอร์ชัน ZIP แบบเดิมเปลี่ยนเส้นทางไปยัง `/api/v1/packages/{name}/download?version=`
- ใช้บักเก็ตอัตราการดาวน์โหลด

### `GET /api/v1/packages/{name}/readiness`

ส่งคืนความพร้อมที่คำนวณแล้วสำหรับการใช้งาน OpenClaw ในอนาคต

การตรวจสอบความพร้อมครอบคลุม:

- สถานะช่องทางทางการ
- ความพร้อมใช้งานของเวอร์ชันล่าสุด
- ความพร้อมใช้งานของอาร์ติแฟกต์ npm-pack ของ ClawPack
- ไดเจสต์อาร์ติแฟกต์
- แหล่งที่มาจาก repo ต้นทางและ commit
- เมทาดาทาความเข้ากันได้ของ OpenClaw
- เป้าหมายโฮสต์
- สถานะการสแกน

การตอบกลับ:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "ClawPack artifact",
      "status": "fail",
      "message": "Latest version is legacy ZIP-only."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

เอนด์พอยต์ผู้ดูแลสำหรับแสดงรายการแถวการย้าย Plugin ทางการของ OpenClaw

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คำค้น:

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
      "blockers": ["missing ClawPack"],
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

เอนด์พอยต์ผู้ดูแลระบบสำหรับสร้างหรืออัปเดตแถวการย้าย Plugin ทางการ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลระบบ

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
  "blockers": ["missing ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "waiting on publisher upload"
}
```

หมายเหตุ:

- `bundledPluginId` ถูกทำให้เป็นตัวพิมพ์เล็กและเป็นคีย์ upsert ที่เสถียร
- `packageName` ถูกปรับให้อยู่ในรูปแบบชื่อ npm; แพ็กเกจอาจไม่มีสำหรับการย้าย
  ที่วางแผนไว้
- สิ่งนี้ติดตามเฉพาะความพร้อมของการย้ายเท่านั้น ไม่ได้แก้ไข OpenClaw หรือสร้าง
  ClawPacks

### `GET /api/v1/packages/moderation/queue`

เอนด์พอยต์ผู้ดูแล/ผู้ดูแลระบบสำหรับคิวตรวจสอบรุ่นเผยแพร่แพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คำค้น:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `blocked`, `manual` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

ความหมายของสถานะ:

- `open`: รุ่นเผยแพร่ที่น่าสงสัย เป็นอันตราย รอดำเนินการ ถูกกักกัน ถูกเพิกถอน หรือถูกรายงาน
- `blocked`: รุ่นเผยแพร่ที่ถูกกักกัน ถูกเพิกถอน หรือเป็นอันตราย
- `manual`: รุ่นเผยแพร่ใดๆ ที่มีการแทนที่การกลั่นกรองด้วยตนเอง
- `all`: รุ่นเผยแพร่ใดๆ ที่มีการแทนที่ด้วยตนเอง สถานะการสแกนที่ไม่สะอาด หรือรายงานแพ็กเกจ

การตอบกลับ:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "manual review",
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

รายงานแพ็กเกจเพื่อให้ผู้ดูแลตรวจสอบ รายงานอยู่ในระดับแพ็กเกจ และอาจ
เชื่อมโยงกับเวอร์ชันได้ รายงานเหล่านี้ป้อนเข้าสู่คิวการกลั่นกรอง แต่ไม่ซ่อนอัตโนมัติหรือ
บล็อกการดาวน์โหลดด้วยตัวเอง ผู้ดูแลควรใช้การกลั่นกรองรุ่นเผยแพร่เพื่อ
อนุมัติ กักกัน หรือเพิกถอนอาร์ติแฟกต์

การยืนยันตัวตน:

- ต้องใช้โทเค็น API

คำขอ:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
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

การตรวจสอบสิทธิ์:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คำขอ:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `confirmed`, `dismissed` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์สำหรับการแบ่งหน้า

การตอบกลับ:

```json
{
  "items": [
    {
      "reportId": "packageReports:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Suspicious native binary",
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

### `GET /api/v1/packages/{name}/moderation`

ปลายทางสำหรับเจ้าของ/ผู้ดูแลเพื่อดูสถานะการดูแลแพ็กเกจ

การตรวจสอบสิทธิ์:

- ต้องใช้โทเค็น API สำหรับเจ้าของแพ็กเกจ สมาชิกผู้เผยแพร่ ผู้ดูแล หรือ
  ผู้ดูแลระบบ

การตอบกลับ:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
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
    "moderationReason": "manual review",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

ปลายทางสำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อปิดผลหรือเปิดรายงานแพ็กเกจอีกครั้ง

คำขอ:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

ต้องระบุ `note` สำหรับ `confirmed` และ `dismissed`; สามารถละเว้นได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "quarantine"` หรือ
`finalAction: "revoke"` พร้อมรายงานที่ยืนยันแล้วเพื่อใช้การดูแลรุ่นเผยแพร่ใน
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

ปลายทางสำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อตรวจสอบรุ่นเผยแพร่ของแพ็กเกจ

คำขอ:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

สถานะที่รองรับ:

- `approved`: ตรวจสอบด้วยตนเองแล้วและอนุญาต
- `quarantined`: ถูกบล็อกระหว่างรอการติดตามผล
- `revoked`: ถูกบล็อกหลังจากรุ่นเผยแพร่เคยได้รับความเชื่อถือมาก่อน

รุ่นเผยแพร่ที่ถูกกักกันและเพิกถอนจะคืนค่า `403` จากเส้นทางดาวน์โหลดอาร์ทิแฟกต์
ทุกการเปลี่ยนแปลงจะเขียนรายการบันทึกการตรวจสอบ

### `GET /api/v1/packages/{name}/file`

คืนค่าเนื้อหาข้อความดิบสำหรับไฟล์ของแพ็กเกจ

พารามิเตอร์คำขอ:

- `path` (จำเป็น)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือรุ่นเผยแพร่ล่าสุด
- ใช้บัคเก็ตอัตราการอ่าน ไม่ใช่บัคเก็ตการดาวน์โหลด
- ไฟล์ไบนารีคืนค่า `415`
- ขนาดไฟล์สูงสุด: 200KB
- การสแกน VirusTotal ที่ยังรอดำเนินการจะไม่บล็อกการอ่าน; รุ่นเผยแพร่ที่เป็นอันตรายอาจยังถูกระงับไว้ที่อื่น
- แพ็กเกจส่วนตัวคืนค่า `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่ที่เป็นเจ้าของได้

### `GET /api/v1/packages/{name}/download`

ดาวน์โหลดไฟล์ ZIP แบบกำหนดซ้ำได้รุ่นเก่าสำหรับรุ่นเผยแพร่ของแพ็กเกจ

พารามิเตอร์คำขอ:

- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือรุ่นเผยแพร่ล่าสุด
- Skills เปลี่ยนเส้นทางไปยัง `GET /api/v1/download`
- ไฟล์เก็บถาวร Plugin/แพ็กเกจเป็นไฟล์ zip ที่มีราก `package/` เพื่อให้ไคลเอนต์ OpenClaw
  รุ่นเก่ายังคงทำงานได้
- เส้นทางนี้ยังคงเป็น ZIP เท่านั้น และไม่สตรีมไฟล์ ClawPack `.tgz`
- การตอบกลับมีส่วนหัว `ETag`, `Digest`, `X-ClawHub-Artifact-Type` และ
  `X-ClawHub-Artifact-Sha256` สำหรับการตรวจสอบความสมบูรณ์ของตัวแก้ไข
- เมตาดาต้าที่มีเฉพาะในรีจิสทรีจะไม่ถูกแทรกเข้าไปในไฟล์เก็บถาวรที่ดาวน์โหลด
- การสแกน VirusTotal ที่ยังรอดำเนินการจะไม่บล็อกการดาวน์โหลด; รุ่นเผยแพร่ที่เป็นอันตรายคืนค่า `403`
- แพ็กเกจส่วนตัวคืนค่า `404` เว้นแต่ผู้เรียกจะเป็นเจ้าของ

### `GET /api/npm/{package}`

คืนค่า packument ที่เข้ากันได้กับ npm สำหรับเวอร์ชันแพ็กเกจที่มี ClawPack รองรับ

หมายเหตุ:

- แสดงเฉพาะเวอร์ชันที่อัปโหลดทาร์บอล npm-pack ของ ClawPack แล้ว
- จงใจละเว้นเวอร์ชันรุ่นเก่าที่เป็น ZIP เท่านั้น
- `dist.tarball`, `dist.integrity` และ `dist.shasum` ใช้ฟิลด์ที่เข้ากันได้กับ npm
  เพื่อให้ผู้ใช้สามารถชี้ npm ไปยังมิเรอร์ได้หากต้องการ
- packument ของแพ็กเกจแบบมีขอบเขตรองรับทั้ง `/api/npm/@scope/name` และเส้นทางคำขอ
  `/api/npm/@scope%2Fname` ที่เข้ารหัสของ npm

### `GET /api/npm/{package}/-/{tarball}.tgz`

สตรีมไบต์ทาร์บอล ClawPack ที่อัปโหลดไว้แบบตรงตามต้นฉบับสำหรับไคลเอนต์มิเรอร์ npm

หมายเหตุ:

- ใช้บัคเก็ตอัตราการดาวน์โหลด
- ส่วนหัวการดาวน์โหลดมี SHA-256 ของ ClawHub รวมถึงเมตาดาต้า integrity/shasum ของ npm
- การดูแลและการตรวจสอบสิทธิ์เข้าถึงแพ็กเกจส่วนตัวยังคงมีผล

### `GET /api/v1/resolve`

CLI ใช้เพื่อแมปลายนิ้วมือภายในเครื่องกับเวอร์ชันที่รู้จัก

พารามิเตอร์คำขอ:

- `slug` (จำเป็น)
- `hash` (จำเป็น): sha256 ฐานสิบหก 64 อักขระของลายนิ้วมือบันเดิล

การตอบกลับ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ดาวน์โหลด ZIP เวอร์ชัน Skills ที่โฮสต์ไว้ หรือคืนค่าการส่งต่อไปยังซอร์ส GitHub สำหรับ
Skills ปัจจุบันที่รองรับด้วย GitHub ซึ่งมีการสแกน `clean` หรือ `suspicious` และไม่มี
เวอร์ชันที่โฮสต์ไว้

พารามิเตอร์คำขอ:

- `slug` (จำเป็น)
- `version` (ไม่บังคับ): สตริง semver
- `tag` (ไม่บังคับ): ชื่อแท็ก (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- เวอร์ชันที่ถูกลบแบบกู้คืนได้คืนค่า `410`
- การส่งต่อ Skills ที่รองรับด้วย GitHub จะไม่พร็อกซีหรือมิเรอร์ไบต์ การตอบกลับ JSON
  มี `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  และ `archiveUrl`; สถานะการสแกน/ปัจจุบันเป็นเกตและไม่รวมเป็นเมตาดาต้าเพย์โหลดเมื่อสำเร็จ
- สถิติการดาวน์โหลดนับเป็นตัวตนที่ไม่ซ้ำกันต่อวัน UTC (`userId` เมื่อโทเค็น API ถูกต้อง มิฉะนั้นใช้ IP)

## ปลายทางการตรวจสอบสิทธิ์ (โทเค็น Bearer)

ปลายทางทั้งหมดต้องใช้:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

ตรวจสอบโทเค็นและคืนค่าแฮนเดิลผู้ใช้

### `POST /api/v1/skills`

เผยแพร่เวอร์ชันใหม่

- แนะนำ: `multipart/form-data` พร้อม JSON `payload` + บล็อบ `files[]`
- ยอมรับบอดี้ JSON ที่มี `files` (อิงตาม storageId) ด้วย
- ฟิลด์เพย์โหลดไม่บังคับ: `ownerHandle` เมื่อมีอยู่ API จะแก้ไขผู้เผยแพร่นั้น
  ฝั่งเซิร์ฟเวอร์และกำหนดให้ผู้ดำเนินการมีสิทธิ์เข้าถึงผู้เผยแพร่
- ฟิลด์เพย์โหลดไม่บังคับ: `migrateOwner` เมื่อเป็น `true` พร้อม `ownerHandle`
  Skills ที่มีอยู่สามารถย้ายไปยังเจ้าของนั้นได้ หากผู้ดำเนินการเป็นผู้ดูแลระบบ/เจ้าของบนทั้ง
  ผู้เผยแพร่ปัจจุบันและปลายทาง หากไม่มีการเลือกเข้าร่วมนี้ การเปลี่ยนเจ้าของจะ
  ถูกปฏิเสธ

### `POST /api/v1/packages`

เผยแพร่รุ่นเผยแพร่ code-plugin หรือ bundle-plugin

- ต้องใช้การตรวจสอบสิทธิ์ด้วยโทเค็น Bearer
- ต้องใช้ `multipart/form-data`
- ฟิลด์ฟอร์มที่อนุญาตคือ `payload`, บล็อบ `files` ที่ทำซ้ำได้ หรือข้อมูลอ้างอิงทาร์บอล
  `clawpack` หนึ่งรายการ `clawpack` อาจเป็นบล็อบ `.tgz` หรือรหัสที่เก็บข้อมูลที่คืนค่าจาก
  โฟลว์ upload-url การเผยแพร่ด้วย storage-id ที่จัดเตรียมไว้ต้องรวม
  `clawpackUploadTicket` ที่คืนค่าพร้อม URL อัปโหลดนั้นด้วย
- ใช้ `files` หรือ `clawpack` อย่างใดอย่างหนึ่งเท่านั้น ห้ามใช้ทั้งสองอย่างในคำขอเดียวกัน
- บอดี้ JSON และเมตาดาต้า `payload.files` / `payload.artifact`
  ที่ผู้เรียกจัดส่งมาจะถูกปฏิเสธ
- คำขอเผยแพร่แบบ multipart โดยตรงจำกัดไว้ที่ 18MB ทาร์บอล ClawPack สามารถ
  ใช้โฟลว์ upload-url ได้จนถึงขีดจำกัดทาร์บอล 120MB
- ฟิลด์เพย์โหลดไม่บังคับ: `ownerHandle` เมื่อมีอยู่ เฉพาะผู้ดูแลระบบเท่านั้นที่เผยแพร่แทนเจ้าของนั้นได้

จุดสำคัญในการตรวจสอบความถูกต้อง:

- `family` ต้องเป็น `code-plugin` หรือ `bundle-plugin`
- แพ็กเกจ Plugin ต้องมี `openclaw.plugin.json` การอัปโหลด ClawPack `.tgz` ต้อง
  มีไฟล์นี้ที่ `package/openclaw.plugin.json`
- code plugins ต้องมี `package.json`, เมตาดาต้ารีโพซอร์ส, เมตาดาต้าคอมมิตซอร์ส,
  เมตาดาต้า schema การกำหนดค่า, `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion`
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมตาดาต้าที่ไม่บังคับ
- เฉพาะผู้เผยแพร่ขององค์กร `openclaw` และผู้เผยแพร่ส่วนตัวของสมาชิกองค์กร `openclaw`
  ปัจจุบันเท่านั้นที่สามารถเผยแพร่ไปยังช่อง `official`
- การเผยแพร่แทนผู้อื่นยังคงตรวจสอบคุณสมบัติสำหรับช่อง official เทียบกับบัญชีเจ้าของปลายทาง

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

ลบแบบกู้คืนได้ / กู้คืน Skills (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)

บอดี้ JSON ไม่บังคับ:

```json
{ "reason": "Held for moderation pending legal review." }
```

เมื่อมีอยู่ `reason` จะถูกเก็บเป็นบันทึกการดูแล Skills และคัดลอกไปยังบันทึกการตรวจสอบ
การลบแบบกู้คืนได้ที่เริ่มโดยเจ้าของจะสงวน slug ไว้ 30 วัน จากนั้นผู้เผยแพร่
รายอื่นจึงสามารถอ้างสิทธิ์ slug ได้ การตอบกลับการลบมี `slugReservedUntil` เมื่อการหมดอายุนี้มีผล
การซ่อนโดยผู้ดูแล/ผู้ดูแลระบบและการนำออกด้วยเหตุผลด้านความปลอดภัยจะไม่หมดอายุด้วยวิธีนี้

การตอบกลับการลบ:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

รหัสสถานะ:

- `200`: ตกลง
- `401`: ไม่ได้รับอนุญาต
- `403`: ต้องห้าม
- `404`: ไม่พบ Skills/ผู้ใช้
- `500`: ข้อผิดพลาดภายในเซิร์ฟเวอร์

### `POST /api/v1/users/publisher`

สำหรับผู้ดูแลระบบเท่านั้น ตรวจสอบให้แน่ใจว่ามีผู้เผยแพร่ขององค์กรสำหรับแฮนเดิล หากแฮนเดิลยังชี้ไปยัง
ผู้ใช้ร่วม/ผู้เผยแพร่ส่วนตัวรุ่นเก่า ปลายทางจะย้ายไปเป็นผู้เผยแพร่ขององค์กรก่อน
สำหรับองค์กรที่สร้างใหม่ ให้ระบุ `memberHandle`; ผู้ดูแลระบบที่ดำเนินการจะไม่ถูกเพิ่มเป็นสมาชิก
`memberRole` มีค่าเริ่มต้นเป็น `owner`

- บอดี้: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- การตอบกลับ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

การสร้างผู้เผยแพร่ขององค์กรแบบบริการตนเองที่ผ่านการตรวจสอบสิทธิ์แล้ว สร้างผู้เผยแพร่ขององค์กรใหม่และเพิ่ม
ผู้เรียกเป็นเจ้าของ ปลายทางนี้จะไม่ย้ายแฮนเดิลผู้ใช้/ส่วนตัวที่มีอยู่ และ
ไม่ทำเครื่องหมายผู้เผยแพร่ว่าเชื่อถือได้/official

- บอดี้: `{ "handle": "opik", "displayName": "Opik" }`
- การตอบกลับ: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- คืนค่า `409` เมื่อแฮนเดิลถูกใช้โดยผู้เผยแพร่ ผู้ใช้ หรือผู้เผยแพร่ส่วนตัวแล้ว

### `POST /api/v1/users/reserve`

สำหรับผู้ดูแลระบบเท่านั้น สงวน slug รากและชื่อแพ็กเกจให้เจ้าของที่ชอบธรรมโดยไม่เผยแพร่
รุ่นเผยแพร่ ชื่อแพ็กเกจจะกลายเป็นแพ็กเกจตัวแทนส่วนตัวที่ไม่มีแถวรุ่นเผยแพร่ เพื่อให้เจ้าของเดียวกัน
สามารถเผยแพร่รุ่นเผยแพร่ code-plugin หรือ bundle-plugin จริงลงในชื่อนั้นได้ในภายหลัง

- บอดี้: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- การตอบกลับ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

สำหรับผู้ดูแลระบบเท่านั้น กู้คืนผู้เผยแพร่ส่วนตัวสำหรับ GitHub OAuth principal ทดแทนที่ตรวจสอบแล้ว
โดยไม่แก้ไขแถวบัญชี Convex Auth คำขอต้องระบุรหัสบัญชีผู้ให้บริการ GitHub
ที่เปลี่ยนแปลงไม่ได้ทั้งสองรายการ; แฮนเดิลที่เปลี่ยนแปลงได้ใช้เป็นตัวป้องกันสำหรับผู้ปฏิบัติงานเท่านั้น

เอนด์พอยต์มีค่าเริ่มต้นเป็นดรายรัน การใช้การกู้คืนจริงต้องใช้ `dryRun: false` และ
`confirmIdentityVerified: true` หลังจากเจ้าหน้าที่ตรวจสอบความต่อเนื่องระหว่าง
GitHub principals ทั้งสองฝ่ายอย่างอิสระแล้ว การกู้คืนจะล้มเหลวแบบปิดเมื่อผู้เผยแพร่ส่วนบุคคลปัจจุบัน
ของผู้ใช้ปลายทางมี Skills, แพ็กเกจ หรือแหล่งที่มา Skill ของ GitHub อยู่
การกู้คืนยังย้ายฟิลด์ `ownerUserId` แบบเดิมสำหรับ Skills ของผู้เผยแพร่ที่กู้คืน,
นามแฝง slug ของ Skill, แพ็กเกจ, คำเตือนจากตัวตรวจสอบแพ็กเกจ และแถวไดเจสต์การค้นหาที่ได้มา เพื่อให้
เส้นทางเจ้าของโดยตรงตรงกับอำนาจผู้เผยแพร่ใหม่ การจอง protected-handle
ที่ยังใช้งานอยู่สำหรับ handle ที่กู้คืนจะถูกโอนให้ผู้ใช้ที่มาแทนด้วย เพื่อไม่ให้การซิงโครไนซ์
โปรไฟล์ภายหลังคืนค่าอำนาจที่แข่งขันกันของผู้ใช้เดิม แต่ละตารางหลักถูกจำกัดไว้ที่
100 แถวต่อธุรกรรม apply; การกู้คืนที่ใหญ่กว่านี้ต้องใช้การย้ายเจ้าของแบบทำต่อได้ก่อน
แหล่งที่มา Skill ของ GitHub มีขอบเขตตามผู้เผยแพร่ และรายงานเป็นรายการที่ตรวจสอบแล้วแทนที่จะเขียนใหม่

- เนื้อหา: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- การตอบกลับ: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### เอนด์พอยต์จัดการ slug ของเจ้าของ

- `POST /api/v1/skills/{slug}/rename`
  - เนื้อหา: `{ "newSlug": "new-canonical-slug" }`
  - การตอบกลับ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - เนื้อหา: `{ "targetSlug": "canonical-target-slug" }`
  - การตอบกลับ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

หมายเหตุ:

- เอนด์พอยต์ทั้งสองต้องใช้การยืนยันตัวตนด้วยโทเค็น API และทำงานได้เฉพาะกับเจ้าของ Skill เท่านั้น
- `rename` เก็บ slug เดิมไว้เป็นนามแฝงสำหรับเปลี่ยนเส้นทาง
- `merge` ซ่อนรายการต้นทางและเปลี่ยนเส้นทาง slug ต้นทางไปยังรายการเป้าหมาย

### เอนด์พอยต์โอนความเป็นเจ้าของ

- `POST /api/v1/skills/{slug}/transfer`
  - เนื้อหา: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - การตอบกลับ: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - การตอบกลับ (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - รูปแบบการตอบกลับ: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

แบนผู้ใช้และลบ Skills ที่เป็นเจ้าของแบบถาวร (เฉพาะผู้ดูแล/moderator หรือผู้ดูแลระบบ/admin)

เนื้อหา:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

หรือ

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

การตอบกลับ:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

ยกเลิกแบนผู้ใช้และกู้คืน Skills ที่เข้าเกณฑ์ (เฉพาะผู้ดูแลระบบ/admin)

เนื้อหา:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

หรือ

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

การตอบกลับ:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

เปลี่ยนเหตุผลที่จัดเก็บไว้สำหรับการแบนที่มีอยู่ โดยไม่ยกเลิกแบนหรือกู้คืน
เนื้อหา (เฉพาะผู้ดูแลระบบ/admin) ค่าเริ่มต้นเป็นดรายรัน เว้นแต่ `dryRun` เป็น `false`

เนื้อหา:

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

หรือ

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

การตอบกลับ:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "malware auto-ban",
  "nextReason": "bulk publishing spam",
  "changed": true
}
```

### `POST /api/v1/users/role`

เปลี่ยนบทบาทผู้ใช้ (เฉพาะผู้ดูแลระบบ/admin)

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

แสดงรายการหรือค้นหาผู้ใช้ (เฉพาะผู้ดูแลระบบ/admin)

พารามิเตอร์ query:

- `q` (ไม่บังคับ): คำค้นหา
- `query` (ไม่บังคับ): นามแฝงของ `q`
- `limit` (ไม่บังคับ): จำนวนผลลัพธ์สูงสุด (ค่าเริ่มต้น 20, สูงสุด 200)

การตอบกลับ:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "User",
      "name": "User",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

เพิ่ม/ลบดาว (ไฮไลต์) เอนด์พอยต์ทั้งสองเป็น idempotent

การตอบกลับ:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## เอนด์พอยต์ CLI แบบเดิม (เลิกใช้แล้ว)

ยังรองรับสำหรับ CLI เวอร์ชันเก่า:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

ดู `DEPRECATIONS.md` สำหรับแผนการลบออก

`POST /api/cli/upload-url` ส่งคืน `uploadUrl` และ `uploadTicket` การเผยแพร่แพ็กเกจ
ที่เตรียม ClawPack tarball ต้องส่ง storage id ที่ได้เป็น
`clawpack` และ ticket ที่ส่งคืนเป็น `clawpackUploadTicket`

## การค้นพบรีจิสทรี (`/.well-known/clawhub.json`)

CLI สามารถค้นพบการตั้งค่ารีจิสทรี/การยืนยันตัวตนจากไซต์:

- `/.well-known/clawhub.json` (JSON, แนะนำ)
- `/.well-known/clawdhub.json` (แบบเดิม)

สคีมา:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

หากคุณโฮสต์เอง ให้เสิร์ฟไฟล์นี้ (หรือตั้งค่า `CLAWHUB_REGISTRY` อย่างชัดเจน; `CLAWDHUB_REGISTRY` แบบเดิม)
