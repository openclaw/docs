---
read_when:
    - การเพิ่ม/เปลี่ยน endpoints
    - การดีบักคำขอระหว่าง CLI ↔ รีจิสทรี
summary: เอกสารอ้างอิง HTTP API (ปลายทางสาธารณะ + ปลายทาง CLI + การตรวจสอบสิทธิ์)
x-i18n:
    generated_at: "2026-07-01T15:32:27Z"
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
พาธดั้งเดิม `/api/...` และ `/api/cli/...` ยังคงมีอยู่เพื่อความเข้ากันได้ (ดู `DEPRECATIONS.md`)
OpenAPI: `/api/v1/openapi.json`

## การนำแค็ตตาล็อกสาธารณะกลับมาใช้

ไดเรกทอรีของบุคคลที่สามอาจใช้ endpoint อ่านสาธารณะเพื่อแสดงรายการหรือค้นหา Skills ของ ClawHub ได้ โปรดแคชผลลัพธ์ เคารพ `429`/`Retry-After` ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ที่เป็นต้นฉบับ (`https://clawhub.ai/<owner>/skills/<slug>`) และหลีกเลี่ยงการสื่อว่า ClawHub รับรองไซต์ของบุคคลที่สาม อย่าพยายามทำมิเรอร์เนื้อหาที่ซ่อน เป็นส่วนตัว หรือถูกบล็อกโดยการดูแลออกนอกพื้นผิว API สาธารณะ

ทางลัด slug บนเว็บ resolve ข้ามครอบครัวรีจิสทรีได้ แต่ไคลเอนต์ API ควรใช้
URL ต้นฉบับที่ endpoint อ่านส่งคืน แทนการประกอบลำดับความสำคัญของ route
ขึ้นมาเอง

## ขีดจำกัดอัตรา

โมเดลการบังคับใช้:

- คำขอแบบไม่ระบุตัวตน: บังคับใช้ต่อ IP
- คำขอที่ยืนยันตัวตนแล้ว (Bearer token ที่ถูกต้อง): บังคับใช้ต่อ bucket ผู้ใช้
- หาก token หายไป/ไม่ถูกต้อง พฤติกรรมจะ fallback ไปใช้การบังคับใช้ตาม IP
- endpoint เขียนที่ยืนยันตัวตนแล้วไม่ควรส่งคืนเพียง `Unauthorized` เปล่า ๆ เมื่อ
  เซิร์ฟเวอร์รู้เหตุผล token ที่หายไป, token ที่ไม่ถูกต้อง/ถูกเพิกถอน และ
  บัญชีที่ถูกลบ/แบน/ปิดใช้งาน ควรได้ข้อความที่ดำเนินการต่อได้แต่ละแบบ เพื่อให้ไคลเอนต์
  CLI บอกผู้ใช้ได้ว่าอะไรบล็อกพวกเขา

- อ่าน: 3000/นาที ต่อ IP, 12000/นาที ต่อ key
- เขียน: 300/นาที ต่อ IP, 3000/นาที ต่อ key
- ดาวน์โหลด: 1200/นาที ต่อ IP, 6000/นาที ต่อ key (endpoint ดาวน์โหลด)

Headers:

- ความเข้ากันได้แบบดั้งเดิม: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- แบบมาตรฐาน: `RateLimit-Limit`, `RateLimit-Reset`
- เมื่อเป็น `429`: `X-RateLimit-Remaining: 0` และ `RateLimit-Remaining: 0`
- เมื่อเป็น `429`: `Retry-After`

ความหมายของ header:

- `X-RateLimit-Reset`: วินาที Unix epoch แบบสัมบูรณ์
- `RateLimit-Reset`: วินาทีจนกว่าจะรีเซ็ต (delay)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: งบประมาณที่เหลือแบบแม่นยำเมื่อมีอยู่
  คำขอที่สำเร็จแบบ sharded จะละเว้น header นี้แทนการส่งคืนค่ารวมทั่วโลกแบบประมาณ
- `Retry-After`: วินาทีที่ต้องรอก่อนลองใหม่ (delay) เมื่อเป็น `429`

ตัวอย่าง response `429`:

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
- ใช้ backoff พร้อม jitter เพื่อหลีกเลี่ยงการลองใหม่พร้อมกัน
- หากไม่มี `Retry-After` ให้ fallback ไปใช้ `RateLimit-Reset` (หรือคำนวณจาก `X-RateLimit-Reset`)

แหล่งที่มาของ IP:

- ใช้ header IP ไคลเอนต์ที่เชื่อถือได้ รวมถึง `cf-connecting-ip` เฉพาะเมื่อ
  deployment เปิดใช้ header ที่ forward มาอย่างเชื่อถือได้โดยชัดเจน
- ClawHub ใช้ header การ forwarding ที่เชื่อถือได้เพื่อระบุ IP ไคลเอนต์ที่ edge
- หากไม่มี IP ไคลเอนต์ที่เชื่อถือได้ คำขอแบบไม่ระบุตัวตนจะใช้ bucket fallback
  ที่ scoped เฉพาะตามชนิดของขีดจำกัดอัตรา bucket fallback เหล่านี้จะไม่รวม
  พาธ, slug, ชื่อแพ็กเกจ, เวอร์ชัน, query string หรือพารามิเตอร์ artifact อื่น ๆ
  ที่ผู้เรียกส่งมา

## Error responses

error response v1 สาธารณะเป็นข้อความธรรมดาพร้อม `content-type: text/plain; charset=utf-8`
ซึ่งรวมถึง validation failures (`400`), ทรัพยากรสาธารณะที่หายไป (`404`), ความล้มเหลวด้าน auth และ
permission (`401`/`403`), ขีดจำกัดอัตรา (`429`) และการดาวน์โหลดที่ถูกบล็อก ไคลเอนต์
ควรอ่าน response body เป็น string ที่มนุษย์อ่านได้ query parameter ที่ไม่รู้จักจะถูก
ละเว้นเพื่อความเข้ากันได้ แต่ query parameter ที่รู้จักและมีค่าไม่ถูกต้องจะส่งคืน
`400`

## endpoint สาธารณะ (ไม่มี auth)

### `GET /api/v1/search`

Query params:

- `q` (required): query string
- `limit` (optional): integer
- `highlightedOnly` (optional): `true` เพื่อกรองเฉพาะ Skills ที่ถูกไฮไลต์
- `nonSuspiciousOnly` (optional): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (optional): alias ดั้งเดิมสำหรับ `nonSuspiciousOnly`

Response:

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

- ผลลัพธ์จะถูกส่งคืนตามลำดับความเกี่ยวข้อง (embedding similarity + การ boost token slug/name แบบตรงตัว + popularity prior เล็กน้อย)
- ความเกี่ยวข้องมีน้ำหนักมากกว่าความนิยม การจับคู่ token ของ slug หรือ display-name ที่แม่นยำอาจอยู่สูงกว่าการจับคู่ที่หลวมกว่าแต่มี engagement สูงกว่ามาก
- ข้อความ ASCII จะถูก tokenize ตามขอบเขตคำและเครื่องหมายวรรคตอน ตัวอย่างเช่น `personal-map` มี token `map` แบบแยกเดี่ยว ขณะที่ `amap-jsapi-skill` มี `amap`, `jsapi` และ `skill`; ดังนั้นการค้นหา `map` จึงทำให้ `personal-map` มีการจับคู่เชิงคำที่แข็งแรงกว่า `amap-jsapi-skill`
- ความนิยมถูกปรับด้วย log scale และมีเพดาน Skills ที่มี engagement สูงอาจจัดอันดับต่ำกว่าเมื่อข้อความ query จับคู่ได้อ่อนกว่า
- สถานะการดูแลที่น่าสงสัยหรือถูกซ่อนอาจนำ Skill ออกจากการค้นหาสาธารณะ ขึ้นอยู่กับตัวกรองของผู้เรียกและสถานะการดูแลปัจจุบัน

คำแนะนำด้านการค้นพบสำหรับผู้เผยแพร่:

- ใส่คำที่ผู้ใช้จะค้นหาจริง ๆ ใน display name, summary และ tags ใช้ token slug แบบแยกเดี่ยวเฉพาะเมื่อมันเป็นตัวตนที่เสถียรที่คุณต้องการเก็บไว้ด้วย
- อย่าเปลี่ยนชื่อ slug เพียงเพื่อไล่ตาม query เดียว เว้นแต่ slug ใหม่จะเป็นชื่อ canonical ระยะยาวที่ดีกว่า slug เก่าจะกลายเป็น redirect aliases แต่ canonical URL, slug ที่แสดง และ digest การค้นหาในอนาคตจะใช้ slug ใหม่
- alias จากการเปลี่ยนชื่อจะคงการ resolve สำหรับ URL เก่าและการติดตั้งที่ resolve ผ่านรีจิสทรี แต่การจัดอันดับการค้นหาจะอิงจาก metadata ของ Skill canonical หลังจากการเปลี่ยนชื่อถูกทำดัชนีแล้ว สถิติเดิมจะคงอยู่กับ Skill
- หาก Skill มองไม่เห็นโดยไม่คาดคิด ให้ตรวจสอบสถานะการดูแลก่อนด้วย `clawhub inspect @owner/slug` ขณะเข้าสู่ระบบ ก่อนเปลี่ยน metadata ที่เกี่ยวข้องกับการจัดอันดับ

### `GET /api/v1/skills`

Query params:

- `limit` (optional): integer (1–200)
- `cursor` (optional): pagination cursor สำหรับ sort ใด ๆ ที่ไม่ใช่ `trending`
- `sort` (optional): `updated` (default), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), alias การติดตั้งดั้งเดิม `installsCurrent`/`installs`/`installsAllTime` map ไปที่ `downloads`, `trending`
- `nonSuspiciousOnly` (optional): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (optional): alias ดั้งเดิมสำหรับ `nonSuspiciousOnly`

ค่า `sort` ที่ไม่ถูกต้องจะส่งคืน `400`

หมายเหตุ:

- `recommended` ใช้สัญญาณ engagement และความใหม่
- `trending` จัดอันดับตามการติดตั้งใน 7 วันที่ผ่านมา (อิง telemetry)
- `createdAt` เสถียรสำหรับการ crawl Skill ใหม่; `updated` เปลี่ยนเมื่อ Skill เดิมถูกเผยแพร่ใหม่
- เมื่อ `nonSuspiciousOnly=true` sort แบบ cursor-based อาจส่งคืน item น้อยกว่า `limit` ในหนึ่งหน้า เพราะ Skills ที่น่าสงสัยถูกกรองหลังจากดึงหน้าแล้ว
- ใช้ `nextCursor` เพื่อทำ pagination ต่อเมื่อมีอยู่ หน้าสั้นไม่ได้หมายความว่าเป็นจุดสิ้นสุดของผลลัพธ์ด้วยตัวมันเอง

Response:

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

Response:

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

- slug เก่าที่สร้างโดย flow การเปลี่ยนชื่อ/merge เจ้าของจะ resolve ไปยัง Skill canonical
- `metadata.os`: ข้อจำกัด OS ที่ประกาศใน frontmatter ของ Skill (เช่น `["macos"]`, `["linux"]`) เป็น `null` หากไม่ได้ประกาศ
- `metadata.systems`: เป้าหมายระบบ Nix (เช่น `["aarch64-darwin", "x86_64-linux"]`) เป็น `null` หากไม่ได้ประกาศ
- `metadata` เป็น `null` หาก Skill ไม่มี metadata ของแพลตฟอร์ม
- `moderation` จะรวมอยู่เฉพาะเมื่อ Skill ถูก flag หรือเจ้าของกำลังดูอยู่

### `GET /api/v1/skills/{slug}/moderation`

ส่งคืนสถานะการดูแลแบบมีโครงสร้าง

Response:

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

- เจ้าของและ moderator สามารถเข้าถึงรายละเอียดการดูแลสำหรับ Skills ที่ซ่อนอยู่ได้
- ผู้เรียกสาธารณะจะได้ `200` เฉพาะสำหรับ Skills ที่มองเห็นได้และถูก flag แล้ว
- หลักฐานจะถูก redacted สำหรับผู้เรียกสาธารณะ และรวม snippet ดิบเฉพาะสำหรับเจ้าของ/moderator เท่านั้น

### `POST /api/v1/skills/{slug}/report`

รายงาน Skill เพื่อให้ moderator ตรวจสอบ รายงานอยู่ในระดับ Skill โดยอาจเชื่อมโยง
กับเวอร์ชัน และป้อนเข้าสู่คิวรายงาน Skill

Auth:

- ต้องใช้ API token

Request:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

Response:

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

endpoint สำหรับ moderator/admin เพื่อรับรายงาน Skill

Query params:

- `status` (optional): `open` (default), `confirmed`, `dismissed`, หรือ `all`
- `limit` (optional): integer (1-200)
- `cursor` (optional): pagination cursor

Response:

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

endpoint สำหรับ moderator/admin เพื่อ resolve หรือ reopen รายงาน Skill

Request:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` จำเป็นสำหรับ `confirmed` และ `dismissed`; อาจละเว้นได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "hide"` พร้อมรายงานที่ triaged แล้ว
เพื่อซ่อน Skill ใน workflow เดียวกันที่ตรวจสอบย้อนหลังได้

### `GET /api/v1/skills/{slug}/versions`

Query params:

- `limit` (optional): integer
- `cursor` (optional): pagination cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

ส่งคืน metadata ของเวอร์ชัน + รายการไฟล์

- `version.security` รวมสถานะการยืนยันการสแกนที่ normalize แล้วและรายละเอียด scanner
  (VirusTotal + LLM) เมื่อมีอยู่

### `GET /api/v1/skills/{slug}/scan`

ส่งคืนรายละเอียดการยืนยันการสแกนความปลอดภัยสำหรับเวอร์ชันของ Skill

Query params:

- `version` (optional): string เวอร์ชันเฉพาะ
- `tag` (optional): resolve เวอร์ชันที่ติด tag (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- รวมสถานะการตรวจสอบที่ปรับให้อยู่ในรูปแบบมาตรฐานพร้อมรายละเอียดเฉพาะของสแกนเนอร์
- `security.hasScanResult` เป็น `true` เฉพาะเมื่อสแกนเนอร์ให้คำตัดสินที่ชัดเจน (`clean`, `suspicious` หรือ `malicious`)
- `moderation` คือสแนปช็อตการกลั่นกรองระดับ Skills ปัจจุบันที่ได้มาจากเวอร์ชันล่าสุด
- เมื่อสืบค้นเวอร์ชันย้อนหลัง ให้ตรวจสอบ `moderation.matchesRequestedVersion` และ `moderation.sourceVersion` ก่อนถือว่า `moderation` และ `security` อยู่ในบริบทเวอร์ชันเดียวกัน

### `POST /api/v1/skills/-/scan`

เอนด์พอยต์ส่งงานแบบยืนยันตัวตนสำหรับงาน ClawScan ใหม่

ไม่รองรับการสแกนอัปโหลดในเครื่องอีกต่อไป คำขอที่ใช้
`multipart/form-data` หรือ `{ "source": { "kind": "upload" } }` จะคืนค่า `410`

การสแกนที่เผยแพร่แล้วใช้ JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

หมายเหตุ:

- เพย์โหลดคำขอสแกนและรายงานที่ดาวน์โหลดได้จะหมดอายุจากที่เก็บคำขอสแกนหลังพ้นช่วงเวลาเก็บรักษา
- การสแกนที่เผยแพร่แล้วต้องมีสิทธิ์จัดการของเจ้าของ/ผู้เผยแพร่ หรืออำนาจของผู้ดูแล/ผู้ดูแลระบบของแพลตฟอร์ม
- การสแกนที่เผยแพร่แล้วจะเขียนกลับเฉพาะเมื่อ `update: true` และการสแกนเสร็จสมบูรณ์สำเร็จ
- การตอบกลับคือ `202` พร้อม `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`
- งานสแกนเป็นแบบอะซิงโครนัส คำขอสแกนด้วยตนเองจะมีลำดับความสำคัญก่อนงานเผยแพร่/เติมย้อนหลังปกติ แต่การเสร็จสิ้นยังขึ้นอยู่กับความพร้อมของ worker

### `GET /api/v1/skills/-/scan/{scanId}`

เอนด์พอยต์โพลแบบยืนยันตัวตนสำหรับการสแกนที่ส่งแล้ว

- คืนค่าสถานะ queued/running/succeeded/failed
- คืนค่า `queue.queuedAhead` และ `queue.position` ขณะอยู่ในคิว เพื่อให้ไคลเอนต์แสดงจำนวนการสแกนด้วยตนเองที่ถูกจัดลำดับความสำคัญก่อนคำขอนี้ได้ คิวที่ใหญ่มากจะถูกจำกัดและรายงานด้วย `queuedAheadIsEstimate: true`
- เมื่อพร้อมใช้งาน `report` จะมีส่วน `clawscan`, `skillspector`, `staticAnalysis` และ `virustotal`
- งานสแกนที่ล้มเหลวจะคืนค่า `status: "failed"` พร้อม `lastError`

### `GET /api/v1/skills/-/scan/{scanId}/download`

เอนด์พอยต์คลังรายงานแบบยืนยันตัวตน

- ต้องเป็นการสแกนที่สำเร็จแล้ว การสแกนที่ยังไม่ถึงสถานะปลายทางจะคืนค่า `409`
- คืนค่า ZIP พร้อม `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

เอนด์พอยต์คลังรายงานที่เก็บไว้แบบยืนยันตัวตนสำหรับเวอร์ชันที่ส่งแล้ว

- ต้องมีสิทธิ์จัดการของเจ้าของ/ผู้เผยแพร่สำหรับ Skills หรือ Plugin หรืออำนาจของผู้ดูแล/ผู้ดูแลระบบของแพลตฟอร์ม
- คืนค่าผลการสแกนที่เก็บไว้สำหรับเวอร์ชันที่ส่งตรงกันทุกประการ รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อน
- `kind` มีค่าเริ่มต้นเป็น `skill`; ใช้ `kind=plugin` สำหรับการสแกน Plugin/แพ็กเกจ
- คืนค่ารูปแบบ ZIP เดียวกับการดาวน์โหลดคำขอสแกน

### `POST /api/v1/skills/-/scan/batch`

เส้นทางสแกนซ้ำแบบกลุ่มมาตรฐานสำหรับผู้ดูแลระบบเท่านั้น รับรูปแบบเพย์โหลดเดียวกับ `POST /api/v1/skills/-/rescan-batch` แบบเดิม

### `POST /api/v1/skills/-/scan/batch/status`

เส้นทางสถานะแบบกลุ่มมาตรฐานสำหรับผู้ดูแลระบบเท่านั้น รับ `{ "jobIds": ["..."] }` และคืนค่าตัวนับรวมเดียวกับ `POST /api/v1/skills/-/rescan-batch/status` แบบเดิม

### `GET /api/v1/skills/{slug}/verify`

คืนค่า envelope การตรวจสอบ Skill Card ที่ใช้โดย `clawhub skill verify`

พารามิเตอร์ query:

- `version` (ไม่บังคับ): สตริงเวอร์ชันเฉพาะ
- `tag` (ไม่บังคับ): แปลงเป็นเวอร์ชันที่มีแท็กกำกับ (เช่น `latest`)

หมายเหตุ:

- `ok` เป็น `true` เฉพาะเมื่อเวอร์ชันที่เลือกมี Skill Card ที่สร้างแล้ว ไม่ถูกการกลั่นกรองบล็อกในฐานะมัลแวร์ และการตรวจสอบ ClawScan เป็น clean
- ข้อมูลระบุตัวตนของ Skills, ข้อมูลระบุตัวตนของผู้เผยแพร่ และเมตาดาต้าของเวอร์ชันที่เลือกเป็นฟิลด์ระดับบนสุดของ envelope (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) เพื่อให้ automation ใน shell อ่านได้โดยไม่ต้องแกะ wrapper ที่ซ้อนกัน
- `security` คือคำตัดสิน ClawScan/security ระดับบนสุด Automation ควรอ้างอิงจาก `ok`, `decision`, `reasons` และ `security.status`
- `security.signals` มีหลักฐานสนับสนุนจากสแกนเนอร์ เช่น `staticScan`, `virusTotal` และ `skillSpector`
- `security.signals.dependencyRegistry` ถูกคงไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่สแกนเนอร์ตรวจสอบการมีอยู่ของรีจิสทรี dependency ถูกยกเลิกแล้ว และคีย์นี้จะเป็น `null` เสมอ
- `provenance` เป็น `server-resolved-github-import` เฉพาะเมื่อ ClawHub แปลงและเก็บ repo/ref/commit/path ของ GitHub ระหว่างการเผยแพร่หรือนำเข้า มิฉะนั้นจะเป็น `unavailable`

### `POST /api/v1/skills/-/security-verdicts`

คืนค่าคำตัดสินความปลอดภัยแบบย่อปัจจุบันสำหรับเวอร์ชัน Skills ที่ตรงกันทุกประการ
เอนด์พอยต์คอลเลกชันนี้มีไว้สำหรับไคลเอนต์ที่รู้อยู่แล้วว่าต้องแสดง
เวอร์ชัน Skills ของ ClawHub ที่ติดตั้งใดบ้าง เช่น OpenClaw Control UI

คำขอ:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

หมายเหตุ:

- `items` ต้องมีคู่ `{ slug, version }` ที่ไม่ซ้ำกันจำนวน 1-100 คู่
- ผลลัพธ์แยกตามแต่ละรายการ Skills หรือเวอร์ชันที่หายไปหนึ่งรายการจะไม่ทำให้การตอบกลับทั้งหมดล้มเหลว
- การตอบกลับมีเฉพาะข้อมูลความปลอดภัย ไม่รวมข้อมูล Skill Card, สถานะ card ที่สร้างแล้ว, รายการไฟล์ artifact หรือเพย์โหลดสแกนเนอร์แบบละเอียด
- `security.signals` มีเฉพาะหลักฐานสนับสนุนระดับสถานะเท่านั้น ใช้ `/scan` หรือหน้า security-audit ของ ClawHub สำหรับรายละเอียดสแกนเนอร์แบบเต็ม
- `security.signals.dependencyRegistry` ถูกคงไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่สแกนเนอร์ตรวจสอบการมีอยู่ของรีจิสทรี dependency ถูกยกเลิกแล้ว และคีย์นี้จะเป็น `null` เสมอ
- การไม่มี Skill Card ไม่มีผลต่อ `ok`, `decision` หรือ `reasons` ของเอนด์พอยต์นี้ ไคลเอนต์ควรอ่าน `skill-card.md` ที่ติดตั้งไว้ในเครื่องเมื่อต้องการเนื้อหา card
- ใช้ `/verify` เมื่อต้องการ envelope การตรวจสอบ Skill Card สำหรับ Skills เดียว, `/card` เมื่อต้องการ markdown ของ card ที่สร้างแล้ว และ `/scan` เมื่อต้องการข้อมูลสแกนเนอร์แบบละเอียด

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

พารามิเตอร์คิวรี:

- `path` (จำเป็น)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือเวอร์ชันล่าสุด
- ขีดจำกัดขนาดไฟล์: 200KB

### `GET /api/v1/packages`

ปลายทางแค็ตตาล็อกแบบรวมสำหรับ:

- สกิล
- Plugin โค้ด
- Plugin แบบบันเดิล

พารามิเตอร์คิวรี:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า
- `family` (ไม่บังคับ): `skill`, `code-plugin`, หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community`, หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended`, `trending`, `downloads`, นามแฝงเดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอถูกจำกัดขอบเขตไปยังแพ็กเกจ Plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, หรือปลายทางแพ็กเกจที่มี
  `family=code-plugin`/`family=bundle-plugin`) หมวดหมู่ที่ควบคุมและ
  นามแฝงตัวกรอง v1 เดิมมีเอกสารอยู่ภายใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, หรือ `sort` จะส่งคืน `400` พารามิเตอร์คิวรีที่ไม่รู้จักจะถูกละเว้น
- `GET /api/v1/code-plugins` และ `GET /api/v1/bundle-plugins` ยังคงเป็นนามแฝงแบบ family คงที่
- รายการสกิลยังคงมี registry ของสกิลรองรับ และยังเผยแพร่ได้เฉพาะผ่าน `POST /api/v1/skills`
- `POST /api/v1/packages` ยังคงใช้เฉพาะสำหรับรีลีส code-plugin และ bundle-plugin
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ยืนยันตัวตนแล้วสามารถเห็นแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดในผลลัพธ์รายการ/การค้นหา
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ยืนยันตัวตนแล้วอ่านได้

### `GET /api/v1/packages/search`

การค้นหาแค็ตตาล็อกแบบรวมในสกิล + แพ็กเกจ Plugin

พารามิเตอร์คิวรี:

- `q` (จำเป็น): สตริงคิวรี
- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `family` (ไม่บังคับ): `skill`, `code-plugin`, หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community`, หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอถูกจำกัดขอบเขตไปยังแพ็กเกจ Plugin หมวดหมู่ที่ควบคุมและนามแฝง
  ตัวกรอง v1 เดิมมีเอกสารอยู่ภายใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured`, หรือ
  `highlightedOnly` จะส่งคืน `400` พารามิเตอร์คิวรีที่ไม่รู้จักจะถูกละเว้น
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ยืนยันตัวตนแล้วสามารถค้นหาแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดได้
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ยืนยันตัวตนแล้วอ่านได้

### `GET /api/v1/plugins`

การเรียกดูแค็ตตาล็อกเฉพาะ Plugin ในแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์คิวรี:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `recommended` (ค่าเริ่มต้น), `trending`, `downloads`, `updated`, นามแฝงเดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

นามแฝงตัวกรอง v1 เดิมยังคงยอมรับในปลายทางสำหรับอ่าน:

- `mcp-tooling`, `data`, และ `automation` จะแปลงเป็น `tools`
- `observability` และ `deployment` จะแปลงเป็น `gateway`
- `dev-tools` จะแปลงเป็น `runtime`

`trending` เป็นกระดานอันดับการติดตั้ง/ดาวน์โหลดเจ็ดวัน และไม่ใช้ยอดรวมตลอดเวลา
บนปลายทางแบบรวม `/api/v1/packages` จะใช้ได้เฉพาะ Plugin เท่านั้น ใช้
`/api/v1/skills?sort=trending` สำหรับแค็ตตาล็อกสกิล

ไม่ยอมรับนามแฝงเดิมเป็นค่าหมวดหมู่ที่จัดเก็บหรือผู้เขียนประกาศ

### `GET /api/v1/skills/export`

การส่งออกสกิลสาธารณะเวอร์ชันล่าสุดแบบกลุ่มสำหรับการวิเคราะห์แบบออฟไลน์

การยืนยันตัวตน:

- ต้องใช้โทเค็น API

พารามิเตอร์คิวรี:

- `startDate` (จำเป็น): ขอบเขตล่างเป็นมิลลิวินาทีแบบ Unix สำหรับ `updatedAt` ของสกิล
- `endDate` (จำเป็น): ขอบเขตบนเป็นมิลลิวินาทีแบบ Unix สำหรับ `updatedAt` ของสกิล
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าจากการตอบกลับก่อนหน้า

การตอบกลับ:

- เนื้อหา: ไฟล์เก็บถาวร ZIP
- สกิลแต่ละรายการมีรากอยู่ที่ `{publisher}/{slug}/`
- สกิลที่โฮสต์ไว้จะรวมไฟล์เวอร์ชันที่จัดเก็บล่าสุด และถูกระบุไว้ใน
  `_manifest.json` พร้อม `sourceRef: "public-clawhub"`
- สกิลปัจจุบันที่มี GitHub รองรับและมีการสแกน `clean` หรือ `suspicious` จะรวม
  `_source_handoff.json` พร้อม `sourceRef: "public-github"`, repo, commit, path,
  แฮชเนื้อหา และ URL ไฟล์เก็บถาวร โดยจะไม่รวมไฟล์ซอร์สที่โฮสต์บน ClawHub
- สกิลแต่ละรายการจะรวม `_export_skill_meta.json`
- `_manifest.json` จะถูกรวมไว้ที่รากของ ZIP เสมอ
- `_errors.json` จะถูกรวมไว้เมื่อไม่สามารถส่งออกสกิลหรือไฟล์บางรายการได้

ส่วนหัว:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

ส่งออกรีลีส Plugin สาธารณะล่าสุดแบบกลุ่มสำหรับการวิเคราะห์แบบออฟไลน์

การยืนยันตัวตน:

- ต้องใช้โทเค็น API

พารามิเตอร์คิวรี:

- `startDate` (ต้องระบุ): ขอบเขตล่างเป็นมิลลิวินาที Unix สำหรับ `updatedAt` ของ Plugin
- `endDate` (ต้องระบุ): ขอบเขตบนเป็นมิลลิวินาที Unix สำหรับ `updatedAt` ของ Plugin
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าจากการตอบกลับก่อนหน้า
- `family` (ไม่บังคับ): `code-plugin` หรือ `bundle-plugin` หากละไว้หมายถึงทั้งสอง
  ตระกูล Plugin

การตอบกลับ:

- เนื้อหา: ไฟล์เก็บถาวร ZIP
- Plugin ที่ส่งออกแต่ละรายการมีรากอยู่ที่ `{family}/{packageName}/`
- Plugin ที่ส่งออกแต่ละรายการมีไฟล์ที่จัดเก็บไว้ของรีลีสล่าสุด
- เมตาดาต้าการส่งออกต่อ Plugin ถูกจัดเก็บที่
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`
- `_manifest.json` จะถูกรวมไว้ที่ราก ZIP เสมอ
- `_errors.json` จะถูกรวมไว้เมื่อไม่สามารถส่งออก Plugin หรือไฟล์บางรายการได้

ส่วนหัว:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

การค้นหาเฉพาะ Plugin ข้ามแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์คิวรี:

- `q` (ต้องระบุ): สตริงคิวรี
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

หมายเหตุ:

- ระบบยอมรับนามแฝงตัวกรอง v1 แบบเดิมที่บันทึกไว้ภายใต้ `GET /api/v1/plugins` ด้วย
- การกรองหมวดหมู่เป็นตัวกรอง API จริงที่รองรับด้วยแถวไดเจสต์หมวดหมู่ Plugin
  ไม่ใช่การเขียนคิวรีค้นหาใหม่
- ผลลัพธ์จะถูกส่งคืนตามลำดับความเกี่ยวข้อง และปัจจุบันยังไม่แบ่งหน้า
- ตัวควบคุมการเรียงลำดับใน UI เบราว์เซอร์สำหรับการค้นหา Plugin จะจัดลำดับผลลัพธ์ความเกี่ยวข้องที่โหลดแล้วใหม่
  ให้ตรงกับพฤติกรรมเรียกดู `/skills` ปัจจุบัน

### `GET /api/v1/packages/{name}`

ส่งคืนเมตาดาต้ารายละเอียดแพ็กเกจ

หมายเหตุ:

- Skills ยังสามารถ resolve ผ่าน route นี้ในแค็ตตาล็อกรวมได้ด้วย
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกสามารถอ่าน publisher เจ้าของได้

### `DELETE /api/v1/packages/{name}`

ลบแพ็กเกจและรีลีสทั้งหมดแบบ soft-delete

หมายเหตุ:

- ต้องใช้โทเค็น API สำหรับเจ้าของแพ็กเกจ เจ้าของ/ผู้ดูแล publisher ขององค์กร
  ผู้ดูแลแพลตฟอร์ม หรือผู้ดูแลระบบแพลตฟอร์ม

### `GET /api/v1/packages/{name}/versions`

ส่งคืนประวัติเวอร์ชัน

พารามิเตอร์คิวรี:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

หมายเหตุ:

- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกสามารถอ่าน publisher เจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}`

ส่งคืนเวอร์ชันแพ็กเกจหนึ่งรายการ รวมถึงเมตาดาต้าไฟล์ ความเข้ากันได้
การตรวจสอบ เมตาดาต้า artifact และข้อมูลการสแกน

หมายเหตุ:

- `version.artifact.kind` คือ `legacy-zip` สำหรับไฟล์เก็บถาวรแพ็กเกจแบบเก่า หรือ
  `npm-pack` สำหรับรีลีสที่รองรับโดย ClawPack
- รีลีส ClawPack มีฟิลด์ที่เข้ากันได้กับ npm ได้แก่ `npmIntegrity`, `npmShasum` และ
  `npmTarballName`
- `version.sha256hash` เป็นเมตาดาต้าความเข้ากันได้ที่เลิกใช้แล้วสำหรับไคลเอนต์เก่า โดย
  แฮชไบต์ ZIP ตรงตามที่ส่งคืนโดย `/api/v1/packages/{name}/download`
  ไคลเอนต์สมัยใหม่ควรใช้ `version.artifact.sha256` ซึ่งระบุ
  artifact รีลีส canonical
- `version.vtAnalysis`, `version.llmAnalysis` และ `version.staticScan` จะถูกรวมไว้
  เมื่อมีข้อมูลการสแกน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกสามารถอ่าน publisher เจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}/security`

ส่งคืนสรุปความปลอดภัยและความน่าเชื่อถือของรีลีสแพ็กเกจแบบตรงรุ่นสำหรับไคลเอนต์ติดตั้ง
นี่คือพื้นผิวการใช้งานสาธารณะของ OpenClaw สำหรับตัดสินใจว่า
รีลีสที่ resolve แล้วสามารถติดตั้งได้หรือไม่

การยืนยันตัวตน:

- ปลายทางอ่านแบบสาธารณะ ไม่ต้องใช้โทเค็นเจ้าของ publisher ผู้ดูแล หรือผู้ดูแลระบบ

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
  แพ็กเกจ registry ที่ resolve แล้ว
- `release.releaseId`, `release.version` และ `release.createdAt` ระบุ
  รีลีสตรงรุ่นที่ถูกประเมิน
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` และ `release.npmTarballName` จะมีอยู่เมื่อทราบสำหรับ
  artifact รีลีส
- `trust.scanStatus` คือสถานะความน่าเชื่อถือที่มีผล ซึ่งได้มาจากอินพุตตัวสแกน
  และการกลั่นกรองรีลีสแบบแมนนวล
- `trust.moderationState` อาจเป็น null ได้ โดยเป็น `null` เมื่อไม่มี
  การกลั่นกรองรีลีสแบบแมนนวล
- `trust.blockedFromDownload` คือสัญญาณบล็อกการติดตั้ง OpenClaw และ
  ไคลเอนต์ติดตั้งอื่นควรบล็อกการติดตั้งเมื่อค่านี้เป็น `true` แทนการ
  คำนวณกฎการบล็อกใหม่จากฟิลด์ตัวสแกนหรือการกลั่นกรอง
- `trust.reasons` คือรายการคำอธิบายสำหรับผู้ใช้และการตรวจสอบ โค้ดเหตุผล
  เป็นสตริงสั้นที่เสถียร เช่น `manual:quarantined`, `scan:malicious`,
  และ `package:malicious`
- `trust.pending` หมายถึงอินพุตความน่าเชื่อถือหนึ่งรายการขึ้นไปยังรอการดำเนินการให้เสร็จ
- `trust.stale` หมายถึงสรุปความน่าเชื่อถือถูกคำนวณจากอินพุตที่ล้าสมัย และ
  ควรถูกถือว่าต้องรีเฟรชก่อนตัดสินใจอนุญาตด้วยความมั่นใจสูง

หมายเหตุ:

- ปลายทางนี้ตรงตามเวอร์ชัน ไคลเอนต์ควรเรียกใช้หลังจาก resolve
  เวอร์ชันแพ็กเกจที่ตั้งใจจะติดตั้ง ไม่ใช่แค่หลังอ่าน
  เมตาดาต้าแพ็กเกจล่าสุด
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกสามารถอ่าน publisher เจ้าของได้
- ปลายทางนี้จงใจแคบกว่าปลายทางการกลั่นกรองของเจ้าของ/ผู้ดูแล
  โดยเปิดเผยการตัดสินใจติดตั้งและคำอธิบายสาธารณะ ไม่ใช่
  ตัวตนผู้รายงาน เนื้อหารายงาน หลักฐานส่วนตัว หรือไทม์ไลน์การตรวจสอบภายใน

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

ส่งคืนเมตาดาต้า resolver ของ artifact แบบชัดเจนสำหรับเวอร์ชันแพ็กเกจ

หมายเหตุ:

- เวอร์ชันแพ็กเกจแบบเดิมจะส่งคืน artifact `legacy-zip` และ
  `downloadUrl` ของ ZIP แบบเดิม
- เวอร์ชัน ClawPack จะส่งคืน artifact `npm-pack`, ฟิลด์ integrity ของ npm,
  `tarballUrl` และ URL ความเข้ากันได้ของ ZIP แบบเดิม
- นี่คือพื้นผิว resolver ของ OpenClaw; ช่วยหลีกเลี่ยงการเดารูปแบบไฟล์เก็บถาวรจาก
  URL ที่ใช้ร่วมกัน

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ดาวน์โหลด artifact ของเวอร์ชันผ่านเส้นทาง resolver ที่ชัดเจน

หมายเหตุ:

- เวอร์ชัน ClawPack จะสตรีมไบต์ `.tgz` ของ npm-pack ที่อัปโหลดไว้ตรงตามจริง
- เวอร์ชัน ZIP แบบเดิมจะ redirect ไปที่ `/api/v1/packages/{name}/download?version=`
- ใช้ bucket อัตราการดาวน์โหลด

### `GET /api/v1/packages/{name}/readiness`

ส่งคืนความพร้อมที่คำนวณแล้วสำหรับการใช้งาน OpenClaw ในอนาคต

การตรวจความพร้อมครอบคลุม:

- สถานะช่องทางทางการ
- ความพร้อมใช้งานของเวอร์ชันล่าสุด
- ความพร้อมใช้งานของ artifact ClawPack npm-pack
- ไดเจสต์ artifact
- แหล่งที่มาของ repo ต้นทางและ commit
- เมตาดาต้าความเข้ากันได้กับ OpenClaw
- เป้าหมาย host
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

ปลายทางผู้ดูแลสำหรับแสดงรายการแถวการย้าย Plugin ทางการของ OpenClaw

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

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

ปลายทางผู้ดูแลระบบสำหรับสร้างหรืออัปเดตแถวการย้าย Plugin ทางการ

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

- `bundledPluginId` จะถูก normalize เป็นตัวพิมพ์เล็กและเป็นคีย์ upsert ที่เสถียร
- `packageName` จะถูก normalize ตามชื่อ npm; แพ็กเกจอาจไม่มีอยู่สำหรับการย้ายที่วางแผนไว้
- สิ่งนี้ติดตามเฉพาะความพร้อมในการย้ายเท่านั้น ไม่ได้แก้ไข OpenClaw หรือสร้าง
  ClawPacks

### `GET /api/v1/packages/moderation/queue`

ปลายทางผู้ดูแล/ผู้ดูแลระบบสำหรับคิวการตรวจสอบรีลีสแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คิวรี:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `blocked`, `manual` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

ความหมายของสถานะ:

- `open`: รีลีสที่น่าสงสัย เป็นอันตราย รอดำเนินการ ถูกกักกัน ถูกเพิกถอน หรือถูกรายงาน
- `blocked`: รีลีสที่ถูกกักกัน ถูกเพิกถอน หรือเป็นอันตราย
- `manual`: รีลีสใดๆ ที่มีการ override การกลั่นกรองแบบแมนนวล
- `all`: รีลีสใดๆ ที่มีการ override แบบแมนนวล สถานะการสแกนที่ไม่สะอาด หรือรายงานแพ็กเกจ

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
เชื่อมโยงกับเวอร์ชันได้ รายงานจะป้อนเข้าสู่คิวการกลั่นกรอง แต่จะไม่ซ่อนอัตโนมัติหรือ
บล็อกการดาวน์โหลดด้วยตัวเอง ผู้ดูแลควรใช้การกลั่นกรองรีลีสเพื่อ
อนุมัติ กักกัน หรือเพิกถอน artifact

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

ปลายทางสำหรับ moderator/admin เพื่อรับรายงานแพ็กเกจ.

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็น moderator หรือ admin.

พารามิเตอร์คำค้น:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `confirmed`, `dismissed` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์แบ่งหน้า

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

ปลายทางสำหรับเจ้าของ/moderator เพื่อดูข้อมูลการกำกับดูแลแพ็กเกจ.

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับเจ้าของแพ็กเกจ, สมาชิกผู้เผยแพร่, moderator หรือ
  ผู้ใช้ admin.

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

ปลายทางสำหรับ moderator/admin เพื่อแก้ไขหรือเปิดรายงานแพ็กเกจอีกครั้ง.

คำขอ:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

ต้องมี `note` สำหรับ `confirmed` และ `dismissed`; สามารถละเว้นได้เมื่อตั้งค่า
`status` กลับเป็น `open`. ส่ง `finalAction: "quarantine"` หรือ
`finalAction: "revoke"` พร้อมรายงานที่ยืนยันแล้วเพื่อใช้การกำกับดูแลรีลีสใน
เวิร์กโฟลว์เดียวกันที่ตรวจสอบย้อนหลังได้.

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

ปลายทางสำหรับ moderator/admin เพื่อรีวิวรีลีสแพ็กเกจ.

คำขอ:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

สถานะที่รองรับ:

- `approved`: รีวิวด้วยตนเองแล้วและอนุญาต.
- `quarantined`: ถูกบล็อกระหว่างรอการติดตามผล.
- `revoked`: ถูกบล็อกหลังจากรีลีสเคยได้รับความเชื่อถือก่อนหน้านี้.

รีลีสที่ถูกกักกันและถูกเพิกถอนจะคืนค่า `403` จากเส้นทางดาวน์โหลดอาร์ติแฟกต์.
ทุกการเปลี่ยนแปลงจะเขียนรายการบันทึกการตรวจสอบ.

### `GET /api/v1/packages/{name}/file`

คืนเนื้อหาข้อความดิบสำหรับไฟล์แพ็กเกจ.

พารามิเตอร์คำค้น:

- `path` (ต้องระบุ)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือรีลีสล่าสุด.
- ใช้บัคเก็ตอัตราการอ่าน ไม่ใช่บัคเก็ตการดาวน์โหลด.
- ไฟล์ไบนารีคืนค่า `415`.
- ขีดจำกัดขนาดไฟล์: 200KB.
- การสแกน VirusTotal ที่รอดำเนินการจะไม่บล็อกการอ่าน; รีลีสที่เป็นอันตรายอาจยังถูกระงับไว้ที่อื่น.
- แพ็กเกจส่วนตัวคืนค่า `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่เจ้าของได้.

### `GET /api/v1/packages/{name}/download`

ดาวน์โหลดไฟล์ ZIP แบบกำหนดได้ซ้ำสำหรับระบบเดิมของรีลีสแพ็กเกจ.

พารามิเตอร์คำค้น:

- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือรีลีสล่าสุด.
- Skills เปลี่ยนเส้นทางไปที่ `GET /api/v1/download`.
- คลัง Plugin/แพ็กเกจเป็นไฟล์ zip ที่มีราก `package/` เพื่อให้ไคลเอนต์ OpenClaw
  เก่ายังคงทำงานได้.
- เส้นทางนี้ยังคงรองรับเฉพาะ ZIP. ไม่สตรีมไฟล์ ClawPack `.tgz`.
- การตอบกลับมีส่วนหัว `ETag`, `Digest`, `X-ClawHub-Artifact-Type` และ
  `X-ClawHub-Artifact-Sha256` สำหรับการตรวจสอบความสมบูรณ์ของตัวแก้ไข.
- เมตาดาต้าที่มีเฉพาะในรีจิสทรีจะไม่ถูกฉีดเข้าไปในคลังที่ดาวน์โหลด.
- การสแกน VirusTotal ที่รอดำเนินการจะไม่บล็อกการดาวน์โหลด; รีลีสที่เป็นอันตรายคืนค่า `403`.
- แพ็กเกจส่วนตัวคืนค่า `404` เว้นแต่ผู้เรียกจะเป็นเจ้าของ.

### `GET /api/npm/{package}`

คืน packument ที่เข้ากันได้กับ npm สำหรับเวอร์ชันแพ็กเกจที่รองรับด้วย ClawPack.

หมายเหตุ:

- แสดงเฉพาะเวอร์ชันที่มี tarball npm-pack ของ ClawPack ที่อัปโหลดแล้ว.
- เวอร์ชันระบบเดิมที่มีเฉพาะ ZIP จะถูกละเว้นโดยตั้งใจ.
- `dist.tarball`, `dist.integrity` และ `dist.shasum` ใช้ฟิลด์ที่เข้ากันได้กับ npm
  เพื่อให้ผู้ใช้ชี้ npm ไปยังมิเรอร์ได้หากเลือก.
- packument ของแพ็กเกจแบบ scoped รองรับทั้ง `/api/npm/@scope/name` และพาธคำขอ
  `/api/npm/@scope%2Fname` ที่เข้ารหัสของ npm.

### `GET /api/npm/{package}/-/{tarball}.tgz`

สตรีมไบต์ tarball ของ ClawPack ที่อัปโหลดจริงสำหรับไคลเอนต์มิเรอร์ npm.

หมายเหตุ:

- ใช้บัคเก็ตอัตราการดาวน์โหลด.
- ส่วนหัวดาวน์โหลดมี SHA-256 ของ ClawHub รวมถึงเมตาดาต้า integrity/shasum ของ npm.
- การตรวจสอบการกำกับดูแลและการเข้าถึงแพ็กเกจส่วนตัวยังคงมีผล.

### `GET /api/v1/resolve`

CLI ใช้เพื่อจับคู่ลายนิ้วมือในเครื่องกับเวอร์ชันที่รู้จัก.

พารามิเตอร์คำค้น:

- `slug` (ต้องระบุ)
- `hash` (ต้องระบุ): sha256 แบบเลขฐานสิบหก 64 อักขระของลายนิ้วมือบันเดิล

การตอบกลับ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ดาวน์โหลด ZIP เวอร์ชันสกิลที่โฮสต์ไว้ หรือคืนการส่งต่อไปยังซอร์ส GitHub สำหรับ
สกิลปัจจุบันที่รองรับด้วย GitHub ซึ่งมีการสแกนเป็น `clean` หรือ `suspicious` และไม่มี
เวอร์ชันที่โฮสต์ไว้.

พารามิเตอร์คำค้น:

- `slug` (ต้องระบุ)
- `version` (ไม่บังคับ): สตริง semver
- `tag` (ไม่บังคับ): ชื่อแท็ก (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด.
- เวอร์ชันที่ถูกลบแบบ soft-delete คืนค่า `410`.
- การส่งต่อสกิลที่รองรับด้วย GitHub จะไม่พร็อกซีหรือมิเรอร์ไบต์. การตอบกลับ JSON
  มี `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  และ `archiveUrl`; สถานะการสแกน/ปัจจุบันเป็นด่านตรวจและไม่รวมเป็นเมตาดาต้าเพย์โหลดสำเร็จ.
- สถิติการดาวน์โหลดนับเป็นตัวตนไม่ซ้ำต่อวัน UTC (`userId` เมื่อโทเค็น API ถูกต้อง มิฉะนั้นใช้ IP).

## ปลายทางการยืนยันตัวตน (โทเค็น Bearer)

ทุกปลายทางต้องมี:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

ตรวจสอบโทเค็นและคืน handle ของผู้ใช้.

### `POST /api/v1/skills`

เผยแพร่เวอร์ชันใหม่.

- แนะนำ: `multipart/form-data` พร้อม JSON `payload` + บล็อบ `files[]`.
- ยอมรับ body JSON ที่มี `files` (อิงตาม storageId) ด้วย.
- ฟิลด์เพย์โหลดไม่บังคับ: `ownerHandle`. เมื่อมี API จะแก้ไขผู้เผยแพร่นั้น
  ฝั่งเซิร์ฟเวอร์และกำหนดให้ผู้ดำเนินการมีสิทธิ์เข้าถึงผู้เผยแพร่.
- ฟิลด์เพย์โหลดไม่บังคับ: `migrateOwner`. เมื่อเป็น `true` พร้อม `ownerHandle`,
  สกิลที่มีอยู่สามารถย้ายไปยังเจ้าของนั้นได้หากผู้ดำเนินการเป็น admin/owner ทั้งใน
  ผู้เผยแพร่ปัจจุบันและเป้าหมาย. หากไม่มีการเลือกใช้นี้ การเปลี่ยนเจ้าของจะ
  ถูกปฏิเสธ.

### `POST /api/v1/packages`

เผยแพร่รีลีส code-plugin หรือ bundle-plugin.

- ต้องยืนยันตัวตนด้วยโทเค็น Bearer.
- ต้องใช้ `multipart/form-data`.
- ฟิลด์ฟอร์มที่อนุญาตคือ `payload`, บล็อบ `files` ซ้ำหลายรายการ หรือการอ้างอิง tarball
  `clawpack` หนึ่งรายการ. `clawpack` อาจเป็นบล็อบ `.tgz` หรือ storage id ที่คืนจาก
  โฟลว์ upload-url. การเผยแพร่ด้วย storage-id ที่ staged ต้องรวม
  `clawpackUploadTicket` ที่คืนมากับ URL อัปโหลดนั้นด้วย.
- ใช้ `files` หรือ `clawpack` อย่างใดอย่างหนึ่งเท่านั้น ห้ามใช้ทั้งคู่ในคำขอเดียวกัน.
- body JSON และเมตาดาต้า `payload.files` / `payload.artifact`
  ที่ผู้เรียกจัดเตรียมจะถูกปฏิเสธ.
- คำขอเผยแพร่ multipart โดยตรงจำกัดที่ 18MB. tarball ของ ClawPack สามารถ
  ใช้โฟลว์ upload-url ได้สูงสุดถึงขีดจำกัด tarball 120MB.
- ฟิลด์เพย์โหลดไม่บังคับ: `ownerHandle`. เมื่อมี เฉพาะ admin เท่านั้นที่เผยแพร่แทนเจ้าของนั้นได้.

จุดสำคัญของการตรวจสอบ:

- `family` ต้องเป็น `code-plugin` หรือ `bundle-plugin`.
- แพ็กเกจ Plugin ต้องมี `openclaw.plugin.json`. การอัปโหลด `.tgz` ของ ClawPack ต้อง
  มีไฟล์นี้ที่ `package/openclaw.plugin.json`.
- code plugins ต้องมี `package.json`, เมตาดาต้า repo ซอร์ส, เมตาดาต้า commit ซอร์ส,
  เมตาดาต้า schema การกำหนดค่า, `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมตาดาต้าไม่บังคับ.
- เฉพาะผู้เผยแพร่ org `openclaw` และผู้เผยแพร่ส่วนบุคคลของสมาชิก org `openclaw`
  ปัจจุบันเท่านั้นที่เผยแพร่ไปยังช่องทาง `official` ได้.
- การเผยแพร่แทนผู้อื่นยังคงตรวจสอบสิทธิ์ช่องทาง official กับบัญชีเจ้าของเป้าหมาย.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

ลบแบบ soft-delete / กู้คืนสกิล (เจ้าของ, moderator หรือ admin).

body JSON ไม่บังคับ:

```json
{ "reason": "Held for moderation pending legal review." }
```

เมื่อมี `reason` จะถูกเก็บเป็นบันทึกการกำกับดูแลสกิลและคัดลอกไปยังบันทึกการตรวจสอบ.
การลบแบบ soft delete ที่เริ่มโดยเจ้าของจะสงวน slug ไว้ 30 วัน จากนั้นผู้เผยแพร่
รายอื่นจึงอ้างสิทธิ์ slug ได้. การตอบกลับการลบมี `slugReservedUntil` เมื่อการหมดอายุนี้มีผล.
การซ่อนโดย moderator/admin และการลบด้วยเหตุผลด้านความปลอดภัยจะไม่หมดอายุด้วยวิธีนี้.

การตอบกลับการลบ:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

รหัสสถานะ:

- `200`: ตกลง
- `401`: ไม่ได้รับอนุญาต
- `403`: ถูกห้าม
- `404`: ไม่พบสกิล/ผู้ใช้
- `500`: ข้อผิดพลาดภายในเซิร์ฟเวอร์

### `POST /api/v1/users/publisher`

สำหรับ admin เท่านั้น. ตรวจให้แน่ใจว่ามีผู้เผยแพร่ org สำหรับ handle หนึ่ง. หาก handle ยังชี้ไปที่
ผู้ใช้ร่วม/ผู้เผยแพร่ส่วนบุคคลแบบระบบเดิม ปลายทางจะย้ายไปเป็นผู้เผยแพร่ org ก่อน.
สำหรับ org ที่สร้างใหม่ ให้ระบุ `memberHandle`; admin ที่ดำเนินการจะไม่ถูกเพิ่มเป็นสมาชิก.
`memberRole` มีค่าเริ่มต้นเป็น `owner`.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

การสร้างผู้เผยแพร่ org แบบ self-serve ที่ยืนยันตัวตนแล้ว. สร้างผู้เผยแพร่ org ใหม่และเพิ่ม
ผู้เรียกเป็น owner. ปลายทางนี้จะไม่ย้าย handle ผู้ใช้/ส่วนบุคคลที่มีอยู่และจะ
ไม่ทำเครื่องหมายผู้เผยแพร่ว่า trusted/official.

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- คืนค่า `409` เมื่อ handle ถูกใช้แล้วโดยผู้เผยแพร่, ผู้ใช้ หรือผู้เผยแพร่ส่วนบุคคล.

### `POST /api/v1/users/reserve`

สำหรับ admin เท่านั้น. สงวน root slug และชื่อแพ็กเกจให้เจ้าของที่ถูกต้องโดยไม่ต้องเผยแพร่
รีลีส. ชื่อแพ็กเกจจะกลายเป็นแพ็กเกจ placeholder ส่วนตัวที่ไม่มีแถวรีลีส เพื่อให้เจ้าของรายเดิม
เผยแพร่รีลีส code-plugin หรือ bundle-plugin จริงลงในชื่อนั้นภายหลังได้.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

สำหรับ admin เท่านั้น. กู้คืนผู้เผยแพร่ส่วนบุคคลให้กับ principal GitHub OAuth ทดแทนที่ตรวจสอบแล้ว
โดยไม่แก้ไขแถวบัญชี Convex Auth. คำขอต้องระบุ id บัญชีผู้ให้บริการ GitHub
ที่เปลี่ยนไม่ได้ทั้งสองรายการ; handle ที่เปลี่ยนแปลงได้ใช้เป็นเพียงตัวป้องกันที่แสดงต่อผู้ปฏิบัติงาน.

เอนด์พอยต์มีค่าเริ่มต้นเป็นโหมดจำลองการทำงาน การใช้การกู้คืนต้องตั้งค่า `dryRun: false` และ
`confirmIdentityVerified: true` หลังจากเจ้าหน้าที่ตรวจสอบความต่อเนื่องระหว่างตัวตนหลักทั้งสองของ
GitHub อย่างเป็นอิสระแล้ว การกู้คืนจะล้มเหลวแบบปิดกั้นเมื่อผู้ใช้ปลายทางมีผู้เผยแพร่ส่วนบุคคลปัจจุบัน
ที่มี skills, packages หรือแหล่งที่มา Skill ของ GitHub
การกู้คืนยังย้ายฟิลด์ `ownerUserId` เดิมสำหรับ Skills ของผู้เผยแพร่ที่กู้คืน,
นามแฝง slug ของ Skill, packages, คำเตือนจากตัวตรวจสอบ package และแถวไดเจสต์การค้นหาที่ได้มา เพื่อให้
เส้นทางเจ้าของโดยตรงสอดคล้องกับอำนาจผู้เผยแพร่ใหม่ การจอง handle ที่ได้รับการป้องกันและยังใช้งานอยู่
สำหรับ handle ที่กู้คืนจะถูกกำหนดใหม่ไปยังผู้ใช้ทดแทนด้วย เพื่อให้การซิงโครไนซ์โปรไฟล์ภายหลัง
ไม่สามารถกู้อำนาจที่แข่งขันกันของผู้ใช้เดิมกลับมาได้ แต่ละตารางหลักจำกัดไว้ที่
100 แถวต่อธุรกรรมการใช้จริงหนึ่งครั้ง; การกู้คืนที่ใหญ่กว่านี้ต้องใช้การย้ายเจ้าของแบบกลับมาทำต่อได้ก่อน
แหล่งที่มา Skill ของ GitHub อยู่ในขอบเขตผู้เผยแพร่และถูกรายงานว่าตรวจสอบแล้วแทนการเขียนใหม่

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

- เอนด์พอยต์ทั้งสองต้องใช้การยืนยันตัวตนด้วยโทเค็น API และทำงานได้เฉพาะสำหรับเจ้าของ Skill เท่านั้น
- `rename` เก็บ slug ก่อนหน้าไว้เป็นนามแฝงสำหรับเปลี่ยนเส้นทาง
- `merge` ซ่อนรายการต้นทางและเปลี่ยนเส้นทาง slug ต้นทางไปยังรายการปลายทาง

### เอนด์พอยต์การโอนความเป็นเจ้าของ

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

แบนผู้ใช้และลบ Skills ที่เป็นเจ้าของแบบถาวร (เฉพาะผู้ดูแล/ผู้ดูแลระบบ)

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

ยกเลิกการแบนผู้ใช้และกู้คืน Skills ที่มีสิทธิ์ (เฉพาะผู้ดูแลระบบ)

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

เปลี่ยนเหตุผลที่จัดเก็บไว้สำหรับการแบนที่มีอยู่ โดยไม่ยกเลิกการแบนหรือกู้คืน
เนื้อหา (เฉพาะผู้ดูแลระบบ) ค่าเริ่มต้นเป็นโหมดจำลองการทำงาน เว้นแต่ `dryRun` จะเป็น `false`

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

พารามิเตอร์คิวรี:

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
      "displayName": "User",
      "name": "User",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

เพิ่ม/ลบดาว (รายการที่เน้น) เอนด์พอยต์ทั้งสองเป็นแบบทำซ้ำได้ผลลัพธ์เดิม

การตอบกลับ:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## เอนด์พอยต์ CLI เดิม (เลิกใช้แล้ว)

ยังรองรับสำหรับ CLI เวอร์ชันเก่า:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

ดู `DEPRECATIONS.md` สำหรับแผนการนำออก

`POST /api/cli/upload-url` ส่งคืน `uploadUrl` และ `uploadTicket` การเผยแพร่ package
ที่จัดเตรียม tarball ของ ClawPack ต้องส่ง id ของที่จัดเก็บผลลัพธ์เป็น
`clawpack` และ ticket ที่ส่งคืนเป็น `clawpackUploadTicket`

## การค้นพบรีจิสทรี (`/.well-known/clawhub.json`)

CLI สามารถค้นพบการตั้งค่ารีจิสทรี/การยืนยันตัวตนจากไซต์ได้:

- `/.well-known/clawhub.json` (JSON, แนะนำ)
- `/.well-known/clawdhub.json` (เดิม)

สคีมา:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

หากคุณโฮสต์เอง ให้ให้บริการไฟล์นี้ (หรือตั้งค่า `CLAWHUB_REGISTRY` อย่างชัดเจน; `CLAWDHUB_REGISTRY` เดิม)
