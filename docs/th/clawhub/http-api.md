---
read_when:
    - การเพิ่ม/เปลี่ยนแปลง endpoint
    - การดีบักคำขอ CLI ↔ registry
summary: เอกสารอ้างอิง HTTP API (สาธารณะ + endpoints ของ CLI + การยืนยันตัวตน).
x-i18n:
    generated_at: "2026-07-04T04:10:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

URL พื้นฐาน: `https://clawhub.ai` (ค่าเริ่มต้น)

เส้นทาง v1 ทั้งหมดอยู่ใต้ `/api/v1/...`
เส้นทางเดิม `/api/...` และ `/api/cli/...` ยังคงอยู่เพื่อความเข้ากันได้ (ดู `DEPRECATIONS.md`)
OpenAPI: `/api/v1/openapi.json`

## การใช้แค็ตตาล็อกสาธารณะซ้ำ

ไดเรกทอรีของบุคคลที่สามสามารถใช้ endpoint แบบอ่านสาธารณะเพื่อแสดงรายการหรือค้นหา ClawHub skills ได้ โปรดแคชผลลัพธ์ เคารพ `429`/`Retry-After` ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ตามบัญญัติ (`https://clawhub.ai/<owner>/skills/<slug>`) และหลีกเลี่ยงการสื่อว่า ClawHub รับรองไซต์บุคคลที่สามนั้น อย่าพยายามทำมิเรอร์เนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกโดยการกลั่นกรองนอกพื้นผิว API สาธารณะ

ทางลัด slug บนเว็บจะ resolve ข้ามตระกูล registry ได้ แต่ไคลเอนต์ API ควรใช้
URL ตามบัญญัติที่ endpoint แบบอ่านส่งกลับ แทนการสร้างลำดับความสำคัญของ route
ขึ้นใหม่เอง

## ขีดจำกัดอัตรา

โมเดลการบังคับใช้:

- คำขอแบบไม่ระบุตัวตน: บังคับใช้ต่อ IP
- คำขอที่ผ่านการยืนยันตัวตน (Bearer token ที่ถูกต้อง): บังคับใช้ต่อ bucket ของผู้ใช้
- หาก token หายไป/ไม่ถูกต้อง พฤติกรรมจะ fallback ไปใช้การบังคับใช้ตาม IP
- endpoint เขียนที่ผ่านการยืนยันตัวตนไม่ควรส่งคืนเพียง `Unauthorized` แบบเปล่าเมื่อ
  เซิร์ฟเวอร์รู้เหตุผล token ที่หายไป, token ที่ไม่ถูกต้อง/ถูกเพิกถอน และ
  บัญชีที่ถูกลบ/แบน/ปิดใช้งาน ควรได้รับข้อความที่นำไปปฏิบัติได้ เพื่อให้ไคลเอนต์
  CLI บอกผู้ใช้ได้ว่าอะไรบล็อกพวกเขา

- อ่าน: 3000/นาที ต่อ IP, 12000/นาที ต่อคีย์
- เขียน: 300/นาที ต่อ IP, 3000/นาที ต่อคีย์
- ดาวน์โหลด: 1200/นาที ต่อ IP, 6000/นาที ต่อคีย์ (endpoint ดาวน์โหลด)

Headers:

- ความเข้ากันได้แบบเดิม: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- แบบมาตรฐาน: `RateLimit-Limit`, `RateLimit-Reset`
- เมื่อเป็น `429`: `X-RateLimit-Remaining: 0` และ `RateLimit-Remaining: 0`
- เมื่อเป็น `429`: `Retry-After`

ความหมายของ header:

- `X-RateLimit-Reset`: วินาที Unix epoch แบบสัมบูรณ์
- `RateLimit-Reset`: จำนวนวินาทีจนกว่าจะรีเซ็ต (ดีเลย์)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: งบประมาณที่เหลืออย่างแม่นยำเมื่อมีอยู่
  คำขอที่สำเร็จแบบ sharded จะละเว้น header นี้แทนการส่งค่าทั่วโลกแบบประมาณกลับมา
- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่ (ดีเลย์) เมื่อเป็น `429`

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
- ใช้ backoff ที่มี jitter เพื่อหลีกเลี่ยงการลองใหม่พร้อมกัน
- หากไม่มี `Retry-After` ให้ fallback ไปใช้ `RateLimit-Reset` (หรือคำนวณจาก `X-RateLimit-Reset`)

แหล่งที่มาของ IP:

- ใช้ header IP ไคลเอนต์ที่เชื่อถือได้ รวมถึง `cf-connecting-ip` เฉพาะเมื่อ
  deployment เปิดใช้ trusted forwarded headers อย่างชัดเจน
- ClawHub ใช้ trusted forwarding headers เพื่อระบุ IP ไคลเอนต์ที่ edge
- หากไม่มี IP ไคลเอนต์ที่เชื่อถือได้ คำขอแบบไม่ระบุตัวตนจะใช้ bucket fallback
  ที่ scoped ตามชนิดของ rate-limit เท่านั้น bucket fallback เหล่านี้ไม่รวม
  path, slug, ชื่อแพ็กเกจ, เวอร์ชัน, query string หรือพารามิเตอร์ artifact อื่น
  ที่ผู้เรียกส่งมา

## Error responses

response ข้อผิดพลาด v1 สาธารณะเป็นข้อความธรรมดาพร้อม `content-type: text/plain; charset=utf-8`
ซึ่งรวมถึง validation failures (`400`), ทรัพยากรสาธารณะที่หายไป (`404`), ความล้มเหลวด้าน auth และ
permission (`401`/`403`), rate limits (`429`) และการดาวน์โหลดที่ถูกบล็อก ไคลเอนต์
ควรอ่านข้อความใน body ของ response เป็นสตริงที่มนุษย์อ่านได้ พารามิเตอร์ query ที่ไม่รู้จักจะถูก
ละเว้นเพื่อความเข้ากันได้ แต่พารามิเตอร์ query ที่รู้จักซึ่งมีค่าไม่ถูกต้องจะส่งคืน
`400`

## Public endpoints (ไม่ต้องใช้ auth)

### `GET /api/v1/search`

Query params:

- `q` (จำเป็น): query string
- `limit` (ไม่บังคับ): จำนวนเต็ม
- `highlightedOnly` (ไม่บังคับ): `true` เพื่อกรองเหลือเฉพาะ skills ที่ถูกไฮไลต์
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias เดิมสำหรับ `nonSuspiciousOnly`

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

- ผลลัพธ์จะถูกส่งคืนตามลำดับความเกี่ยวข้อง (embedding similarity + การ boost token ของ slug/name ที่ตรงแบบ exact + popularity prior เล็กน้อย)
- ความเกี่ยวข้องมีน้ำหนักมากกว่าความนิยม การตรงกับ slug หรือ token ของ display-name อย่างแม่นยำสามารถอยู่อันดับสูงกว่าการตรงแบบหลวมที่มี engagement สูงกว่ามากได้
- ข้อความ ASCII จะถูก tokenize ตามขอบเขตคำและเครื่องหมายวรรคตอน ตัวอย่างเช่น `personal-map` มี token `map` แบบ standalone ในขณะที่ `amap-jsapi-skill` มี `amap`, `jsapi` และ `skill`; ดังนั้นการค้นหา `map` จึงทำให้ `personal-map` มี lexical match ที่แข็งแรงกว่า `amap-jsapi-skill`
- ความนิยมถูกปรับเป็น log-scale และจำกัดเพดาน skills ที่มี engagement สูงอาจมีอันดับต่ำกว่าเมื่อข้อความ query ตรงกันอ่อนกว่า
- สถานะการกลั่นกรองที่น่าสงสัยหรือซ่อนอยู่สามารถนำ skill ออกจากการค้นหาสาธารณะได้ โดยขึ้นอยู่กับตัวกรองของผู้เรียกและสถานะการกลั่นกรองปัจจุบัน

คำแนะนำด้านการค้นพบสำหรับผู้เผยแพร่:

- ใส่คำที่ผู้ใช้จะค้นหาจริงใน display name, summary และ tags ใช้ token slug แบบ standalone เฉพาะเมื่อมันเป็นตัวตนที่เสถียรที่คุณต้องการคงไว้ด้วย
- อย่าเปลี่ยนชื่อ slug เพียงเพื่อไล่ตาม query เดียว เว้นแต่ slug ใหม่จะเป็นชื่อ canonical ระยะยาวที่ดีกว่า slug เก่าจะกลายเป็น redirect aliases แต่ URL ตามบัญญัติ, slug ที่แสดง และ search digests ในอนาคตจะใช้ slug ใหม่
- Rename aliases จะรักษาการ resolve สำหรับ URL เก่าและการติดตั้งที่ resolve ผ่าน registry แต่การจัดอันดับการค้นหาจะอิง metadata ของ skill ตามบัญญัติหลังจากการเปลี่ยนชื่อถูกจัดทำดัชนีแล้ว สถิติเดิมจะยังอยู่กับ skill
- หาก skill หายไปโดยไม่คาดคิด ให้ตรวจสอบสถานะการกลั่นกรองก่อนด้วย `clawhub inspect @owner/slug` ขณะล็อกอิน ก่อนเปลี่ยน metadata ที่เกี่ยวข้องกับการจัดอันดับ

### `GET /api/v1/skills`

Query params:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–200)
- `cursor` (ไม่บังคับ): cursor สำหรับ pagination สำหรับการจัดเรียงที่ไม่ใช่ `trending`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), alias การติดตั้งเดิม `installsCurrent`/`installs`/`installsAllTime` map ไปที่ `downloads`, `trending`
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias เดิมสำหรับ `nonSuspiciousOnly`

ค่า `sort` ที่ไม่ถูกต้องจะส่งคืน `400`

หมายเหตุ:

- `recommended` ใช้สัญญาณ engagement และ recency
- `trending` จัดอันดับตามการติดตั้งในช่วง 7 วันที่ผ่านมา (อิง telemetry)
- `createdAt` เสถียรสำหรับการ crawl skills ใหม่; `updated` เปลี่ยนเมื่อ skills ที่มีอยู่ถูกเผยแพร่ซ้ำ
- เมื่อ `nonSuspiciousOnly=true` การจัดเรียงแบบ cursor-based อาจส่งคืนรายการน้อยกว่า `limit` ในหนึ่งหน้า เพราะ skills ที่น่าสงสัยถูกกรองหลังจากดึงข้อมูลหน้าแล้ว
- ใช้ `nextCursor` เพื่อทำ pagination ต่อเมื่อมีอยู่ หน้าที่สั้นไม่ได้หมายความว่าสิ้นสุดผลลัพธ์โดยตัวมันเอง

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

- slug เก่าที่เกิดจาก flow การ rename/merge ของ owner จะ resolve ไปยัง skill ตามบัญญัติ
- `metadata.os`: ข้อจำกัด OS ที่ประกาศใน frontmatter ของ skill (เช่น `["macos"]`, `["linux"]`) `null` หากไม่ได้ประกาศ
- `metadata.systems`: target ระบบ Nix (เช่น `["aarch64-darwin", "x86_64-linux"]`) `null` หากไม่ได้ประกาศ
- `metadata` เป็น `null` หาก skill ไม่มี metadata แพลตฟอร์ม
- `moderation` จะถูกรวมเฉพาะเมื่อ skill ถูก flag หรือ owner กำลังดูอยู่

### `GET /api/v1/skills/{slug}/moderation`

ส่งคืนสถานะการกลั่นกรองแบบมีโครงสร้าง

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

- Owners และ moderators สามารถเข้าถึงรายละเอียดการกลั่นกรองสำหรับ skills ที่ซ่อนอยู่ได้
- ผู้เรียกสาธารณะจะได้รับ `200` เฉพาะสำหรับ skills ที่มองเห็นได้และถูก flag แล้วเท่านั้น
- Evidence จะถูก redacted สำหรับผู้เรียกสาธารณะ และจะรวม snippets ดิบเฉพาะสำหรับ owners/moderators

### `POST /api/v1/skills/{slug}/report`

รายงาน skill เพื่อให้ moderator review รายงานอยู่ระดับ skill, อาจลิงก์
กับเวอร์ชันได้ และป้อนเข้าสู่คิวรายงาน skill

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

endpoint สำหรับ moderator/admin เพื่อรับรายงาน skill

Query params:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `confirmed`, `dismissed` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-200)
- `cursor` (ไม่บังคับ): cursor สำหรับ pagination

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

endpoint สำหรับ moderator/admin เพื่อ resolve หรือ reopen รายงาน skill

Request:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

ต้องมี `note` สำหรับ `confirmed` และ `dismissed`; อาจละเว้นได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "hide"` พร้อมรายงานที่ triaged แล้ว
เพื่อซ่อน skill ใน workflow เดียวกันที่ตรวจสอบย้อนหลังได้

### `GET /api/v1/skills/{slug}/versions`

Query params:

- `limit` (ไม่บังคับ): จำนวนเต็ม
- `cursor` (ไม่บังคับ): cursor สำหรับ pagination

### `GET /api/v1/skills/{slug}/versions/{version}`

ส่งคืน metadata ของเวอร์ชัน + รายการไฟล์

- `version.security` รวมสถานะการยืนยันการสแกนที่ normalize แล้วและรายละเอียด scanner
  (VirusTotal + LLM) เมื่อมีให้ใช้

### `GET /api/v1/skills/{slug}/scan`

ส่งคืนรายละเอียดการยืนยันการสแกนความปลอดภัยสำหรับเวอร์ชันของ skill

Query params:

- `version` (ไม่บังคับ): สตริงเวอร์ชันเฉพาะ
- `tag` (ไม่บังคับ): resolve เวอร์ชันที่ tagged (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- รวมสถานะการตรวจสอบที่ปรับให้อยู่ในรูปแบบมาตรฐาน พร้อมรายละเอียดเฉพาะของสแกนเนอร์
- `security.hasScanResult` เป็น `true` เฉพาะเมื่อสแกนเนอร์ให้คำตัดสินที่แน่นอน (`clean`, `suspicious` หรือ `malicious`)
- `moderation` คือสแนปช็อตการกลั่นกรองระดับสกิลปัจจุบันที่ได้มาจากเวอร์ชันล่าสุด
- เมื่อคิวรีเวอร์ชันในอดีต ให้ตรวจสอบ `moderation.matchesRequestedVersion` และ `moderation.sourceVersion` ก่อนถือว่า `moderation` และ `security` อยู่ในบริบทเวอร์ชันเดียวกัน

### `POST /api/v1/skills/-/scan`

เอนด์พอยต์ส่งงานที่ต้องยืนยันตัวตนสำหรับงาน ClawScan ใหม่

ไม่รองรับการสแกนอัปโหลดภายในเครื่องอีกต่อไป คำขอที่ใช้
`multipart/form-data` หรือ `{ "source": { "kind": "upload" } }` จะส่งคืน `410`

การสแกนที่เผยแพร่แล้วใช้ JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

หมายเหตุ:

- เพย์โหลดคำขอสแกนและรายงานที่ดาวน์โหลดได้จะหมดอายุจากที่เก็บคำขอสแกนหลังพ้นช่วงเวลาการเก็บรักษา
- การสแกนที่เผยแพร่แล้วต้องมีสิทธิ์เข้าถึงการจัดการของเจ้าของ/ผู้เผยแพร่ หรืออำนาจผู้ดูแลการกลั่นกรอง/ผู้ดูแลระบบของแพลตฟอร์ม
- การสแกนที่เผยแพร่แล้วจะเขียนกลับเฉพาะเมื่อ `update: true` และการสแกนเสร็จสมบูรณ์สำเร็จ
- การตอบกลับคือ `202` พร้อม `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`
- งานสแกนเป็นแบบอะซิงโครนัส คำขอสแกนแบบแมนนวลจะได้รับลำดับความสำคัญก่อนงานเผยแพร่/เติมข้อมูลย้อนหลังตามปกติ แต่การเสร็จสมบูรณ์ยังขึ้นอยู่กับความพร้อมของ worker

### `GET /api/v1/skills/-/scan/{scanId}`

เอนด์พอยต์โพลที่ต้องยืนยันตัวตนสำหรับการสแกนที่ส่งไปแล้ว

- ส่งคืนสถานะ queued/running/succeeded/failed
- ส่งคืน `queue.queuedAhead` และ `queue.position` ขณะอยู่ในคิว เพื่อให้ไคลเอนต์แสดงจำนวนการสแกนแบบแมนนวลที่มีลำดับความสำคัญซึ่งอยู่ก่อนคำขอได้ คิวที่มีขนาดใหญ่มากจะถูกจำกัดขอบเขตและรายงานด้วย `queuedAheadIsEstimate: true`
- เมื่อมีข้อมูล `report` จะมีส่วน `clawscan`, `skillspector`, `staticAnalysis` และ `virustotal`
- งานสแกนที่ล้มเหลวจะส่งคืน `status: "failed"` พร้อม `lastError`

### `GET /api/v1/skills/-/scan/{scanId}/download`

เอนด์พอยต์ไฟล์เก็บถาวรรายงานที่ต้องยืนยันตัวตน

- ต้องเป็นการสแกนที่สำเร็จแล้ว การสแกนที่ยังไม่สิ้นสุดจะส่งคืน `409`
- ส่งคืน ZIP ที่มี `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

เอนด์พอยต์ไฟล์เก็บถาวรรายงานที่จัดเก็บไว้ ซึ่งต้องยืนยันตัวตน สำหรับเวอร์ชันที่ส่งมา

- ต้องมีสิทธิ์เข้าถึงการจัดการของเจ้าของ/ผู้เผยแพร่ต่อสกิลหรือ Plugin หรืออำนาจผู้ดูแลการกลั่นกรอง/ผู้ดูแลระบบของแพลตฟอร์ม
- ส่งคืนผลลัพธ์การสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งมาอย่างตรงตัว รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อนไว้
- `kind` มีค่าเริ่มต้นเป็น `skill`; ใช้ `kind=plugin` สำหรับการสแกน Plugin/แพ็กเกจ
- ส่งคืนรูปแบบ ZIP เดียวกับการดาวน์โหลดคำขอสแกน

### `POST /api/v1/skills/-/scan/batch`

เส้นทางสแกนซ้ำแบบแบตช์มาตรฐานสำหรับผู้ดูแลระบบเท่านั้น รับรูปแบบเพย์โหลดเดียวกับ `POST /api/v1/skills/-/rescan-batch` เดิม

### `POST /api/v1/skills/-/scan/batch/status`

เส้นทางสถานะแบตช์มาตรฐานสำหรับผู้ดูแลระบบเท่านั้น รับ `{ "jobIds": ["..."] }` และส่งคืนตัวนับรวมเดียวกับ `POST /api/v1/skills/-/rescan-batch/status` เดิม

### `GET /api/v1/skills/{slug}/verify`

ส่งคืนเอนเวโลปการตรวจสอบ Skill Card ที่ใช้โดย `clawhub skill verify`

พารามิเตอร์คิวรี:

- `version` (ไม่บังคับ): สตริงเวอร์ชันเฉพาะ
- `tag` (ไม่บังคับ): แปลงเป็นเวอร์ชันที่ติดแท็กไว้ (เช่น `latest`)

หมายเหตุ:

- `ok` เป็น `true` เฉพาะเมื่อเวอร์ชันที่เลือกมี Skill Card ที่สร้างแล้ว ไม่ถูกการกลั่นกรองบล็อกว่าเป็นมัลแวร์ และการตรวจสอบ ClawScan เป็น clean
- ตัวตนของสกิล ตัวตนของผู้เผยแพร่ และเมตาดาตาของเวอร์ชันที่เลือกเป็นฟิลด์ระดับบนสุดของเอนเวโลป (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) เพื่อให้ shell automation อ่านได้โดยไม่ต้องแกะ wrapper ที่ซ้อนกัน
- `security` คือคำตัดสิน ClawScan/ความปลอดภัยระดับบนสุด ระบบอัตโนมัติควรอ้างอิง `ok`, `decision`, `reasons` และ `security.status`
- `security.signals` มีหลักฐานสนับสนุนจากสแกนเนอร์ เช่น `staticScan`, `virusTotal` และ `skillSpector`
- `security.signals.dependencyRegistry` ถูกเก็บไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่สแกนเนอร์ตรวจสอบการมีอยู่ของทะเบียน dependency ถูกเลิกใช้แล้ว และคีย์นี้เป็น `null` เสมอ
- `provenance` เป็น `server-resolved-github-import` เฉพาะเมื่อ ClawHub แปลงและจัดเก็บ GitHub repo/ref/commit/path ระหว่างเผยแพร่หรือนำเข้า มิฉะนั้นจะเป็น `unavailable`

### `POST /api/v1/skills/-/security-verdicts`

ส่งคืนคำตัดสินความปลอดภัยแบบย่อปัจจุบันสำหรับเวอร์ชันสกิลที่ตรงตัว เอนด์พอยต์คอลเลกชันนี้มีไว้สำหรับไคลเอนต์ที่รู้อยู่แล้วว่าต้องแสดงเวอร์ชันสกิล ClawHub ที่ติดตั้งไว้เวอร์ชันใด เช่น OpenClaw Control UI

คำขอ:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

หมายเหตุ:

- `items` ต้องมีคู่ `{ slug, version }` ที่ไม่ซ้ำกันจำนวน 1-100 รายการ
- ผลลัพธ์เป็นรายรายการ การขาดสกิลหรือเวอร์ชันหนึ่งรายการจะไม่ทำให้การตอบกลับทั้งหมดล้มเหลว
- การตอบกลับมีเฉพาะข้อมูลความปลอดภัย ไม่รวมข้อมูล Skill Card, สถานะการ์ดที่สร้างแล้ว, รายการไฟล์ artifact หรือเพย์โหลดสแกนเนอร์แบบละเอียด
- `security.signals` มีเฉพาะหลักฐานสนับสนุนระดับสถานะเท่านั้น ใช้ `/scan` หรือหน้า security-audit ของ ClawHub สำหรับรายละเอียดสแกนเนอร์ทั้งหมด
- `security.signals.dependencyRegistry` ถูกเก็บไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่สแกนเนอร์ตรวจสอบการมีอยู่ของทะเบียน dependency ถูกเลิกใช้แล้ว และคีย์นี้เป็น `null` เสมอ
- การไม่มี Skill Card ไม่มีผลต่อ `ok`, `decision` หรือ `reasons` ของเอนด์พอยต์นี้ ไคลเอนต์ควรอ่าน `skill-card.md` ที่ติดตั้งไว้ภายในเครื่องเมื่อจำเป็นต้องใช้เนื้อหาการ์ด
- ใช้ `/verify` เมื่อคุณต้องการเอนเวโลปการตรวจสอบ Skill Card สำหรับสกิลเดียว ใช้ `/card` เมื่อคุณต้องการ Markdown ของการ์ดที่สร้างแล้ว และใช้ `/scan` เมื่อคุณต้องการข้อมูลสแกนเนอร์แบบละเอียด

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

พารามิเตอร์คำขอ:

- `path` (จำเป็น)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นเป็นเวอร์ชันล่าสุด
- ขีดจำกัดขนาดไฟล์: 200KB

### `GET /api/v1/packages`

ปลายทางแค็ตตาล็อกรวมสำหรับ:

- Skills
- Code Plugin
- Bundle Plugin

พารามิเตอร์คำขอ:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า
- `family` (ไม่บังคับ): `skill`, `code-plugin`, หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community`, หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended`, `trending`, `downloads`, alias เดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอจำกัดขอบเขตไว้ที่แพ็กเกจ Plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, หรือปลายทางแพ็กเกจที่มี
  `family=code-plugin`/`family=bundle-plugin`) หมวดหมู่ที่ควบคุมและ
  alias ตัวกรอง v1 เดิมมีเอกสารอยู่ใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, หรือ `sort` จะส่งคืน `400` พารามิเตอร์คำขอที่ไม่รู้จักจะถูกละเว้น
- `GET /api/v1/code-plugins` และ `GET /api/v1/bundle-plugins` ยังคงเป็น alias แบบ fixed-family
- รายการ Skill ยังคงรองรับด้วยรีจิสทรี Skill และยังเผยแพร่ได้ผ่าน `POST /api/v1/skills` เท่านั้น
- `POST /api/v1/packages` ยังคงใช้สำหรับรีลีส code-plugin และ bundle-plugin เท่านั้น
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถเห็นแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดในผลลัพธ์รายการ/ค้นหา
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกซึ่งผ่านการยืนยันตัวตนอ่านได้เท่านั้น

### `GET /api/v1/packages/search`

การค้นหาแค็ตตาล็อกรวมระหว่าง Skills + แพ็กเกจ Plugin

พารามิเตอร์คำขอ:

- `q` (จำเป็น): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `family` (ไม่บังคับ): `skill`, `code-plugin`, หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community`, หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอจำกัดขอบเขตไว้ที่แพ็กเกจ Plugin หมวดหมู่ที่ควบคุมและ alias
  ตัวกรอง v1 เดิมมีเอกสารอยู่ใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured`, หรือ
  `highlightedOnly` จะส่งคืน `400` พารามิเตอร์คำขอที่ไม่รู้จักจะถูกละเว้น
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถค้นหาแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัด
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกซึ่งผ่านการยืนยันตัวตนอ่านได้เท่านั้น

### `GET /api/v1/plugins`

การเรียกดูแค็ตตาล็อกเฉพาะ Plugin ระหว่างแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์คำขอ:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `recommended` (ค่าเริ่มต้น), `trending`, `downloads`, `updated`, alias เดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

alias ตัวกรอง v1 เดิมยังคงยอมรับบนปลายทางการอ่าน:

- `mcp-tooling`, `data`, และ `automation` resolve เป็น `tools`
- `observability` และ `deployment` resolve เป็น `gateway`
- `dev-tools` resolve เป็น `runtime`

`trending` คือกระดานอันดับการติดตั้ง/ดาวน์โหลดเจ็ดวัน และไม่ใช้ยอดรวมตลอดเวลา
บนปลายทางรวม `/api/v1/packages` จะเป็นแบบเฉพาะ Plugin เท่านั้น ใช้
`/api/v1/skills?sort=trending` สำหรับแค็ตตาล็อก Skill

alias เดิมจะไม่ถูกยอมรับเป็นค่าหมวดหมู่ที่จัดเก็บหรือที่ผู้เขียนประกาศ

### `GET /api/v1/skills/export`

การส่งออก Skills สาธารณะล่าสุดแบบกลุ่มสำหรับการวิเคราะห์แบบออฟไลน์

การยืนยันตัวตน:

- ต้องใช้โทเค็น API

พารามิเตอร์คำขอ:

- `startDate` (จำเป็น): ขอบเขตล่างเป็นมิลลิวินาที Unix สำหรับ `updatedAt` ของ Skill
- `endDate` (จำเป็น): ขอบเขตบนเป็นมิลลิวินาที Unix สำหรับ `updatedAt` ของ Skill
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าจากการตอบกลับก่อนหน้า

การตอบกลับ:

- เนื้อหา: ไฟล์เก็บถาวร ZIP
- Skill ที่ส่งออกแต่ละรายการมีรากที่ `{publisher}/{slug}/`
- Skills ที่โฮสต์ไว้รวมไฟล์เวอร์ชันที่จัดเก็บล่าสุด และแสดงรายการใน
  `_manifest.json` พร้อม `sourceRef: "public-clawhub"`
- Skills ปัจจุบันที่รองรับด้วย GitHub ซึ่งมีการสแกน `clean` หรือ `suspicious` จะรวม
  `_source_handoff.json` พร้อม `sourceRef: "public-github"`, repo, commit, path,
  แฮชเนื้อหา และ URL ไฟล์เก็บถาวร โดยจะไม่รวมไฟล์ซอร์สที่โฮสต์โดย ClawHub
- Skill แต่ละรายการมี `_export_skill_meta.json`
- `_manifest.json` จะถูกรวมไว้ที่ราก ZIP เสมอ
- `_errors.json` จะถูกรวมไว้เมื่อไม่สามารถส่งออก Skills หรือไฟล์บางรายการได้

ส่วนหัว:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

ส่งออกเป็นชุดของรุ่น Plugin สาธารณะล่าสุดสำหรับการวิเคราะห์แบบออฟไลน์

การยืนยันตัวตน:

- ต้องมีโทเค็น API

พารามิเตอร์คิวรี:

- `startDate` (จำเป็น): ขอบเขตล่างแบบ Unix milliseconds สำหรับ `updatedAt` ของ Plugin
- `endDate` (จำเป็น): ขอบเขตบนแบบ Unix milliseconds สำหรับ `updatedAt` ของ Plugin
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าจากการตอบกลับก่อนหน้า
- `family` (ไม่บังคับ): `code-plugin` หรือ `bundle-plugin` หากละไว้หมายถึงทั้งสอง
  ตระกูล Plugin

การตอบกลับ:

- เนื้อหา: ไฟล์ ZIP archive
- Plugin ที่ส่งออกแต่ละรายการมีรากอยู่ที่ `{family}/{packageName}/`
- Plugin ที่ส่งออกแต่ละรายการมีไฟล์ที่จัดเก็บไว้ของรุ่นล่าสุด
- เมตาดาต้าการส่งออกต่อ Plugin ถูกจัดเก็บที่
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`
- `_manifest.json` จะถูกรวมไว้ที่รากของ ZIP เสมอ
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

- `q` (จำเป็น): สตริงคิวรี
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

หมายเหตุ:

- นามแฝงตัวกรอง v1 แบบเดิมที่บันทึกไว้ใต้ `GET /api/v1/plugins` ก็ยัง
  ยอมรับเช่นกัน
- การกรองตามหมวดหมู่เป็นตัวกรอง API จริงที่อิงกับแถวสรุปหมวดหมู่ Plugin
  ไม่ใช่การเขียนคิวรีค้นหาใหม่
- ผลลัพธ์จะถูกส่งกลับตามลำดับความเกี่ยวข้อง และปัจจุบันยังไม่มีการแบ่งหน้า
- ตัวควบคุมการเรียงลำดับใน UI เบราว์เซอร์สำหรับการค้นหา Plugin จะจัดเรียงผลลัพธ์ความเกี่ยวข้องที่โหลดแล้วใหม่
  ให้ตรงกับพฤติกรรมการเรียกดู `/skills` ปัจจุบัน

### `GET /api/v1/packages/{name}`

ส่งคืนเมตาดาต้ารายละเอียดแพ็กเกจ

หมายเหตุ:

- Skills สามารถ resolve ผ่าน route นี้ในแคตตาล็อกรวมได้เช่นกัน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่าน publisher เจ้าของได้

### `DELETE /api/v1/packages/{name}`

ลบแพ็กเกจและทุกรุ่นแบบ soft-delete

หมายเหตุ:

- ต้องมีโทเค็น API สำหรับเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลระบบของ org publisher,
  ผู้ดูแลแพลตฟอร์ม, หรือผู้ดูแลระบบแพลตฟอร์ม

### `GET /api/v1/packages/{name}/versions`

ส่งคืนประวัติเวอร์ชัน

พารามิเตอร์คิวรี:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

หมายเหตุ:

- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่าน publisher เจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}`

ส่งคืนแพ็กเกจหนึ่งเวอร์ชัน รวมถึงเมตาดาต้าไฟล์ ความเข้ากันได้
การยืนยัน เมตาดาต้า artifact และข้อมูลการสแกน

หมายเหตุ:

- `version.artifact.kind` คือ `legacy-zip` สำหรับ package archives แบบเก่า หรือ
  `npm-pack` สำหรับรุ่นที่รองรับโดย ClawPack
- รุ่น ClawPack มีฟิลด์ที่เข้ากันได้กับ npm ได้แก่ `npmIntegrity`, `npmShasum`, และ
  `npmTarballName`
- `version.sha256hash` เป็นเมตาดาต้าความเข้ากันได้ที่เลิกใช้แล้วสำหรับไคลเอนต์เก่า โดย
  hash ไบต์ ZIP ที่ส่งกลับโดย `/api/v1/packages/{name}/download` แบบตรงกันทุกประการ
  ไคลเอนต์สมัยใหม่ควรใช้ `version.artifact.sha256` ซึ่งระบุ
  artifact รุ่น canonical
- `version.vtAnalysis`, `version.llmAnalysis`, และ `version.staticScan` จะถูกรวมไว้
  เมื่อมีข้อมูลการสแกน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่าน publisher เจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}/security`

ส่งคืนสรุปความปลอดภัยและความน่าเชื่อถือของรุ่นแพ็กเกจที่แน่นอนสำหรับไคลเอนต์ติดตั้ง
นี่คือพื้นผิวการใช้งานสาธารณะของ OpenClaw สำหรับตัดสินใจว่า
รุ่นที่ resolve แล้วสามารถติดตั้งได้หรือไม่

การยืนยันตัวตน:

- endpoint อ่านสาธารณะ ไม่จำเป็นต้องมีโทเค็นของเจ้าของ, publisher, ผู้ดูแล, หรือผู้ดูแลระบบ

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

- `package.name`, `package.displayName`, และ `package.family` ระบุ
  แพ็กเกจ registry ที่ resolve แล้ว
- `release.releaseId`, `release.version`, และ `release.createdAt` ระบุ
  รุ่นที่แน่นอนซึ่งถูกประเมิน
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, และ `release.npmTarballName` จะมีอยู่เมื่อทราบสำหรับ
  artifact ของรุ่น
- `trust.scanStatus` คือสถานะความน่าเชื่อถือที่มีผล ซึ่งได้มาจากอินพุตของสแกนเนอร์
  และการกลั่นกรองรุ่นแบบ manual
- `trust.moderationState` สามารถเป็น null ได้ โดยเป็น `null` เมื่อไม่มี
  การกลั่นกรองรุ่นแบบ manual
- `trust.blockedFromDownload` คือสัญญาณบล็อกการติดตั้ง OpenClaw และ
  ไคลเอนต์ติดตั้งอื่นควรบล็อกการติดตั้งเมื่อค่านี้เป็น `true` แทนที่จะ
  คำนวณกฎการบล็อกจากฟิลด์สแกนเนอร์หรือการกลั่นกรองใหม่
- `trust.reasons` คือรายการคำอธิบายสำหรับผู้ใช้และการตรวจสอบ โค้ดเหตุผล
  เป็นสตริงที่เสถียรและกะทัดรัด เช่น `manual:quarantined`, `scan:malicious`,
  และ `package:malicious`
- `trust.pending` หมายถึงอินพุตความน่าเชื่อถืออย่างน้อยหนึ่งรายการยังรอการดำเนินการให้เสร็จ
- `trust.stale` หมายถึงสรุปความน่าเชื่อถือถูกคำนวณจากอินพุตที่ล้าสมัย และ
  ควรถูกถือว่าต้อง refresh ก่อนการตัดสินใจอนุญาตที่มีความมั่นใจสูง

หมายเหตุ:

- endpoint นี้ตรงตามเวอร์ชัน ไคลเอนต์ควรเรียกหลังจาก resolve
  เวอร์ชันแพ็กเกจที่ตั้งใจจะติดตั้งแล้ว ไม่ใช่แค่หลังจากอ่าน
  เมตาดาต้าแพ็กเกจล่าสุด
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่าน publisher เจ้าของได้
- endpoint นี้ตั้งใจให้แคบกว่า endpoint การกลั่นกรองของเจ้าของ/ผู้ดูแล
  โดยเปิดเผยการตัดสินใจติดตั้งและคำอธิบายสาธารณะ ไม่ใช่
  ตัวตนผู้รายงาน เนื้อหารายงาน หลักฐานส่วนตัว หรือไทม์ไลน์การตรวจสอบภายใน

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

ส่งคืนเมตาดาต้าตัว resolve artifact แบบชัดเจนสำหรับเวอร์ชันแพ็กเกจ

หมายเหตุ:

- เวอร์ชันแพ็กเกจแบบเดิมส่งคืน artifact `legacy-zip` และ
  `downloadUrl` ของ ZIP แบบเดิม
- เวอร์ชัน ClawPack ส่งคืน artifact `npm-pack`, ฟิลด์ npm integrity,
  `tarballUrl`, และ URL ความเข้ากันได้ของ ZIP แบบเดิม
- นี่คือพื้นผิว resolver ของ OpenClaw โดยหลีกเลี่ยงการเดารูปแบบ archive จาก
  URL ที่ใช้ร่วมกัน

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ดาวน์โหลด artifact ของเวอร์ชันผ่านเส้นทาง resolver แบบชัดเจน

หมายเหตุ:

- เวอร์ชัน ClawPack สตรีมไบต์ `.tgz` ของ npm-pack ที่อัปโหลดไว้อย่างตรงกันทุกประการ
- เวอร์ชัน ZIP แบบเดิม redirect ไปที่ `/api/v1/packages/{name}/download?version=`
- ใช้ bucket อัตราการดาวน์โหลด

### `GET /api/v1/packages/{name}/readiness`

ส่งคืน readiness ที่คำนวณแล้วสำหรับการใช้งาน OpenClaw ในอนาคต

การตรวจ readiness ครอบคลุม:

- สถานะช่องทาง official
- ความพร้อมใช้งานของเวอร์ชันล่าสุด
- ความพร้อมใช้งานของ artifact ClawPack npm-pack
- digest ของ artifact
- ที่มา source repo และ commit
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

endpoint สำหรับผู้ดูแลเพื่อแสดงรายการแถว migration ของ OpenClaw Plugin official

การยืนยันตัวตน:

- ต้องมีโทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คิวรี:

- `phase` (ไม่บังคับ): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw`, หรือ
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

endpoint สำหรับผู้ดูแลระบบเพื่อสร้างหรืออัปเดตแถว migration ของ Plugin official

การยืนยันตัวตน:

- ต้องมีโทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลระบบ

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

- `bundledPluginId` ถูก normalize เป็นตัวพิมพ์เล็ก และเป็นคีย์ upsert ที่เสถียร
- `packageName` ถูก normalize ตามชื่อ npm; แพ็กเกจสามารถไม่มีอยู่ได้สำหรับ migration
  ที่วางแผนไว้
- สิ่งนี้ติดตาม readiness ของ migration เท่านั้น ไม่ได้แก้ไข OpenClaw หรือสร้าง
  ClawPacks

### `GET /api/v1/packages/moderation/queue`

endpoint สำหรับผู้ดูแล/ผู้ดูแลระบบสำหรับคิวตรวจสอบรุ่นแพ็กเกจ

การยืนยันตัวตน:

- ต้องมีโทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คิวรี:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `blocked`, `manual`, หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

ความหมายของสถานะ:

- `open`: รุ่นที่น่าสงสัย, เป็นอันตราย, ค้างอยู่, ถูกกักกัน, ถูกเพิกถอน, หรือถูกรายงาน
- `blocked`: รุ่นที่ถูกกักกัน, ถูกเพิกถอน, หรือเป็นอันตราย
- `manual`: รุ่นใดก็ตามที่มีการ override การกลั่นกรองแบบ manual
- `all`: รุ่นใดก็ตามที่มี manual override, สถานะการสแกนที่ไม่สะอาด, หรือรายงานแพ็กเกจ

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

รายงานแพ็กเกจให้ผู้ดูแลตรวจสอบ รายงานอยู่ในระดับแพ็กเกจ และอาจ
เชื่อมโยงกับเวอร์ชันได้ รายงานเหล่านี้ป้อนเข้าคิวการกลั่นกรอง แต่ไม่ซ่อนหรือ
บล็อกการดาวน์โหลดโดยอัตโนมัติด้วยตัวเอง ผู้ดูแลควรใช้การกลั่นกรองรุ่นเพื่อ
อนุมัติ กักกัน หรือเพิกถอน artifacts

การยืนยันตัวตน:

- ต้องมีโทเค็น API

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

ปลายทางสำหรับผู้ดูแล/ผู้ดูแลระบบสำหรับรับรายงานแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คิวรี:

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

ปลายทางสำหรับเจ้าของ/ผู้ดูแลเพื่อดูข้อมูลการดูแลแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับเจ้าของแพ็กเกจ สมาชิกผู้เผยแพร่ ผู้ดูแล หรือ
  ผู้ใช้ผู้ดูแลระบบ

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

ปลายทางสำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อแก้ไขหรือเปิดรายงานแพ็กเกจอีกครั้ง

คำขอ:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

ต้องระบุ `note` สำหรับ `confirmed` และ `dismissed`; อาจละไว้ได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "quarantine"` หรือ
`finalAction: "revoke"` พร้อมรายงานที่ยืนยันแล้วเพื่อใช้การดูแลรีลีสใน
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

ปลายทางสำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อตรวจสอบรีลีสแพ็กเกจ

คำขอ:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

สถานะที่รองรับ:

- `approved`: ตรวจสอบด้วยตนเองและอนุญาตแล้ว
- `quarantined`: ถูกบล็อกระหว่างรอการติดตามผล
- `revoked`: ถูกบล็อกหลังจากรีลีสเคยได้รับความเชื่อถือมาก่อน

รีลีสที่ถูกกักกันและถูกเพิกถอนจะคืนค่า `403` จากเส้นทางดาวน์โหลดอาร์ติแฟกต์
ทุกการเปลี่ยนแปลงจะเขียนรายการบันทึกการตรวจสอบ

### `GET /api/v1/packages/{name}/file`

คืนค่าเนื้อหาข้อความดิบสำหรับไฟล์แพ็กเกจ

พารามิเตอร์คิวรี:

- `path` (จำเป็น)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือรีลีสล่าสุด
- ใช้บัคเก็ตอัตราการอ่าน ไม่ใช่บัคเก็ตการดาวน์โหลด
- ไฟล์ไบนารีคืนค่า `415`
- ขีดจำกัดขนาดไฟล์: 200KB
- การสแกน VirusTotal ที่รอดำเนินการจะไม่บล็อกการอ่าน; รีลีสที่เป็นอันตรายอาจยังถูกระงับไว้ที่อื่น
- แพ็กเกจส่วนตัวคืนค่า `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่ที่เป็นเจ้าของได้

### `GET /api/v1/packages/{name}/download`

ดาวน์โหลดไฟล์เก็บถาวร ZIP แบบกำหนดได้ซ้ำเดิมสำหรับรีลีสแพ็กเกจ

พารามิเตอร์คิวรี:

- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือรีลีสล่าสุด
- Skills เปลี่ยนเส้นทางไปยัง `GET /api/v1/download`
- ไฟล์เก็บถาวรของ Plugin/แพ็กเกจเป็นไฟล์ zip ที่มีรูท `package/` เพื่อให้ไคลเอนต์ OpenClaw
  รุ่นเก่ายังคงทำงานได้
- เส้นทางนี้ยังคงเป็น ZIP เท่านั้น ไม่สตรีมไฟล์ ClawPack `.tgz`
- การตอบกลับรวมส่วนหัว `ETag`, `Digest`, `X-ClawHub-Artifact-Type` และ
  `X-ClawHub-Artifact-Sha256` สำหรับการตรวจสอบความถูกต้องของตัวแก้ไข
- เมทาดาทาเฉพาะ Registry จะไม่ถูกฉีดเข้าไปในไฟล์เก็บถาวรที่ดาวน์โหลด
- การสแกน VirusTotal ที่รอดำเนินการจะไม่บล็อกการดาวน์โหลด; รีลีสที่เป็นอันตรายคืนค่า `403`
- แพ็กเกจส่วนตัวคืนค่า `404` เว้นแต่ผู้เรียกจะเป็นเจ้าของ

### `GET /api/npm/{package}`

คืนค่า packument ที่เข้ากันได้กับ npm สำหรับเวอร์ชันแพ็กเกจที่รองรับโดย ClawPack

หมายเหตุ:

- แสดงเฉพาะเวอร์ชันที่มีทาร์บอล ClawPack npm-pack ที่อัปโหลดแล้ว
- ตั้งใจละเว้นเวอร์ชันเดิมที่เป็น ZIP เท่านั้น
- `dist.tarball`, `dist.integrity` และ `dist.shasum` ใช้ฟิลด์ที่เข้ากันได้กับ npm
  เพื่อให้ผู้ใช้สามารถชี้ npm ไปยังมิเรอร์ได้หากเลือก
- packument ของแพ็กเกจแบบ scoped รองรับทั้งเส้นทางคำขอ `/api/npm/@scope/name` และ
  `/api/npm/@scope%2Fname` ที่เข้ารหัสตามแบบ npm

### `GET /api/npm/{package}/-/{tarball}.tgz`

สตรีมไบต์ทาร์บอล ClawPack ที่อัปโหลดจริงสำหรับไคลเอนต์มิเรอร์ npm

หมายเหตุ:

- ใช้บัคเก็ตอัตราการดาวน์โหลด
- ส่วนหัวการดาวน์โหลดรวม SHA-256 ของ ClawHub พร้อมเมทาดาทา integrity/shasum ของ npm
- การดูแลและการตรวจสอบสิทธิ์เข้าถึงแพ็กเกจส่วนตัวยังคงมีผล

### `GET /api/v1/resolve`

CLI ใช้เพื่อแมปลายนิ้วมือในเครื่องกับเวอร์ชันที่รู้จัก

พารามิเตอร์คิวรี:

- `slug` (จำเป็น)
- `hash` (จำเป็น): sha256 แบบเลขฐานสิบหก 64 อักขระของลายนิ้วมือบันเดิล

การตอบกลับ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ดาวน์โหลด ZIP เวอร์ชัน Skills ที่โฮสต์ไว้ หรือคืนค่าการส่งต่อไปยังซอร์ส GitHub สำหรับ
Skills ปัจจุบันที่รองรับโดย GitHub ซึ่งมีผลสแกน `clean` หรือ `suspicious` และไม่มี
เวอร์ชันที่โฮสต์ไว้

พารามิเตอร์คิวรี:

- `slug` (จำเป็น)
- `version` (ไม่บังคับ): สตริง semver
- `tag` (ไม่บังคับ): ชื่อแท็ก (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- เวอร์ชันที่ถูกลบแบบอ่อนคืนค่า `410`
- การส่งต่อ Skills ที่รองรับโดย GitHub จะไม่พร็อกซีหรือมิเรอร์ไบต์ การตอบกลับ JSON
  รวม `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  และ `archiveUrl`; สถานะสแกน/ปัจจุบันเป็นเกต และไม่ถูกรวมเป็นเมทาดาทาเพย์โหลดสำเร็จ
- สถิติการดาวน์โหลดนับเป็นตัวตนที่ไม่ซ้ำกันต่อวัน UTC (`userId` เมื่อโทเค็น API ถูกต้อง มิฉะนั้นใช้ IP)

## ปลายทางการยืนยันตัวตน (โทเค็น Bearer)

ปลายทางทั้งหมดต้องมี:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

ตรวจสอบโทเค็นและคืนค่าแฮนเดิลผู้ใช้

### `POST /api/v1/skills`

เผยแพร่เวอร์ชันใหม่

- แนะนำ: `multipart/form-data` พร้อม JSON `payload` + blob `files[]`
- ยอมรับ body JSON ที่มี `files` (อิง `storageId`) ด้วย
- ฟิลด์เพย์โหลดที่ไม่บังคับ: `ownerHandle` เมื่อมีอยู่ API จะแก้ไขผู้เผยแพร่นั้น
  ฝั่งเซิร์ฟเวอร์และต้องให้ผู้กระทำมีสิทธิ์เข้าถึงผู้เผยแพร่
- ฟิลด์เพย์โหลดที่ไม่บังคับ: `migrateOwner` เมื่อเป็น `true` พร้อม `ownerHandle`
  Skills ที่มีอยู่สามารถย้ายไปยังเจ้าของนั้นได้ หากผู้กระทำเป็นผู้ดูแลระบบ/เจ้าของของทั้ง
  ผู้เผยแพร่ปัจจุบันและเป้าหมาย หากไม่เลือกใช้ตัวเลือกนี้ การเปลี่ยนเจ้าของจะถูกปฏิเสธ

### `POST /api/v1/packages`

เผยแพร่รีลีส code-plugin หรือ bundle-plugin

- ต้องใช้การยืนยันตัวตนด้วยโทเค็น Bearer
- ต้องใช้ `multipart/form-data`
- ฟิลด์ฟอร์มที่อนุญาตคือ `payload`, blob `files` แบบซ้ำ หรืออ้างอิงทาร์บอล `clawpack`
  หนึ่งรายการ `clawpack` อาจเป็น blob `.tgz` หรือ id พื้นที่จัดเก็บที่คืนจาก
  โฟลว์ upload-url การเผยแพร่ด้วย storage-id ที่จัดเตรียมไว้ต้องรวม
  `clawpackUploadTicket` ที่คืนมาพร้อม URL อัปโหลดนั้นด้วย
- ใช้ `files` หรือ `clawpack` อย่างใดอย่างหนึ่งเท่านั้น ห้ามใช้ทั้งคู่ในคำขอเดียวกัน
- body JSON และเมทาดาทา `payload.files` / `payload.artifact`
  ที่ผู้เรียกระบุเองจะถูกปฏิเสธ
- คำขอเผยแพร่ multipart โดยตรงถูกจำกัดไว้ที่ 18MB ทาร์บอล ClawPack อาจ
  ใช้โฟลว์ upload-url ได้ถึงขีดจำกัดทาร์บอล 120MB
- ฟิลด์เพย์โหลดที่ไม่บังคับ: `ownerHandle` เมื่อมีอยู่ เฉพาะผู้ดูแลระบบเท่านั้นที่เผยแพร่ในนามของเจ้าของนั้นได้

ไฮไลต์การตรวจสอบความถูกต้อง:

- `family` ต้องเป็น `code-plugin` หรือ `bundle-plugin`
- แพ็กเกจ Plugin ต้องมี `openclaw.plugin.json` การอัปโหลด ClawPack `.tgz` ต้อง
  มีไฟล์นี้ที่ `package/openclaw.plugin.json`
- code plugin ต้องมี `package.json`, เมทาดาทา repo ซอร์ส, เมทาดาทา commit ซอร์ส,
  เมทาดาทา schema การกำหนดค่า, `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion`
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมทาดาทาที่ไม่บังคับ
- เฉพาะผู้เผยแพร่องค์กร `openclaw` และผู้เผยแพร่ส่วนบุคคลของสมาชิกองค์กร `openclaw`
  ปัจจุบันเท่านั้นที่เผยแพร่ไปยังช่อง `official` ได้
- การเผยแพร่ในนามผู้อื่นยังคงตรวจสอบสิทธิ์ช่อง official กับบัญชีเจ้าของเป้าหมาย

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

ลบแบบอ่อน / กู้คืน Skills (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)

body JSON ที่ไม่บังคับ:

```json
{ "reason": "Held for moderation pending legal review." }
```

เมื่อมีอยู่ `reason` จะถูกจัดเก็บเป็นบันทึกการดูแล Skills และคัดลอกลงในบันทึกการตรวจสอบ
การลบแบบอ่อนที่เจ้าของเริ่มต้นจะจอง slug ไว้ 30 วัน จากนั้นผู้เผยแพร่รายอื่นสามารถอ้างสิทธิ์ slug ได้
การตอบกลับการลบรวม `slugReservedUntil` เมื่อการหมดอายุนี้มีผล
การซ่อนโดยผู้ดูแล/ผู้ดูแลระบบและการนำออกด้วยเหตุผลด้านความปลอดภัยจะไม่หมดอายุด้วยวิธีนี้

การตอบกลับการลบ:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

รหัสสถานะ:

- `200`: ตกลง
- `401`: ไม่ได้รับอนุญาต
- `403`: ถูกห้าม
- `404`: ไม่พบ Skills/ผู้ใช้
- `500`: ข้อผิดพลาดภายในเซิร์ฟเวอร์

### `POST /api/v1/users/publisher`

สำหรับผู้ดูแลระบบเท่านั้น ตรวจสอบให้แน่ใจว่ามีผู้เผยแพร่องค์กรสำหรับแฮนเดิล หากแฮนเดิลยังชี้ไปที่
ผู้ใช้ร่วมเดิม/ผู้เผยแพร่ส่วนบุคคลเดิม ปลายทางจะย้ายแฮนเดิลนั้นไปเป็นผู้เผยแพร่องค์กรก่อน
สำหรับองค์กรที่สร้างใหม่ ให้ระบุ `memberHandle`; ผู้ดูแลระบบที่ดำเนินการจะไม่ถูกเพิ่มเป็นสมาชิก
`memberRole` มีค่าเริ่มต้นเป็น `owner`

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

การสร้างผู้เผยแพร่องค์กรแบบบริการตนเองที่ยืนยันตัวตนแล้ว สร้างผู้เผยแพร่องค์กรใหม่และเพิ่ม
ผู้เรียกเป็นเจ้าของ ปลายทางนี้จะไม่ย้ายแฮนเดิลผู้ใช้/ส่วนบุคคลที่มีอยู่ และจะไม่
ทำเครื่องหมายผู้เผยแพร่เป็น trusted/official

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- คืนค่า `409` เมื่อแฮนเดิลถูกใช้แล้วโดยผู้เผยแพร่ ผู้ใช้ หรือผู้เผยแพร่ส่วนบุคคล

### `POST /api/v1/users/reserve`

สำหรับผู้ดูแลระบบเท่านั้น จอง root slugs และชื่อแพ็กเกจสำหรับเจ้าของที่ชอบธรรมโดยไม่เผยแพร่
รีลีส ชื่อแพ็กเกจจะกลายเป็นแพ็กเกจ placeholder ส่วนตัวที่ไม่มีแถวรีลีส เพื่อให้เจ้าของเดียวกัน
สามารถเผยแพร่รีลีส code-plugin หรือ bundle-plugin จริงไปยังชื่อนั้นในภายหลังได้

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

สำหรับผู้ดูแลระบบเท่านั้น กู้คืนผู้เผยแพร่ส่วนบุคคลสำหรับ principal GitHub OAuth ทดแทนที่ตรวจสอบแล้ว
โดยไม่แก้ไขแถวบัญชี Convex Auth คำขอต้องระบุ id บัญชีผู้ให้บริการ GitHub
ที่เปลี่ยนแปลงไม่ได้ทั้งสองรายการ; แฮนเดิลที่เปลี่ยนแปลงได้ใช้เป็นเพียงการ์ดสำหรับผู้ปฏิบัติงานเท่านั้น

จุดปลาย API มีค่าเริ่มต้นเป็นโหมดจำลองการทำงาน การกู้คืนจริงต้องใช้ `dryRun: false` และ
`confirmIdentityVerified: true` หลังจากเจ้าหน้าที่ตรวจสอบความต่อเนื่องระหว่างตัวตนหลักของ
GitHub ทั้งสองฝ่ายอย่างเป็นอิสระแล้ว การกู้คืนจะล้มเหลวแบบปิดเมื่อผู้เผยแพร่ส่วนตัวปัจจุบันของผู้ใช้ปลายทาง
มีสกิล แพ็กเกจ หรือแหล่งที่มาของสกิล GitHub
การกู้คืนยังย้ายฟิลด์ `ownerUserId` เดิมสำหรับสกิลของผู้เผยแพร่ที่กู้คืนแล้ว
นามแฝง slug ของสกิล แพ็กเกจ คำเตือนจากตัวตรวจสอบแพ็กเกจ และแถวสรุปย่อยสำหรับการค้นหาที่ได้มา เพื่อให้
เส้นทางเจ้าของโดยตรงสอดคล้องกับอำนาจของผู้เผยแพร่ใหม่ การจองแฮนเดิลที่ได้รับการป้องกันซึ่งยังใช้งานอยู่
สำหรับแฮนเดิลที่กู้คืนจะถูกมอบหมายใหม่ให้ผู้ใช้ทดแทนด้วย เพื่อให้การซิงโครไนซ์โปรไฟล์ภายหลัง
ไม่สามารถกู้คืนอำนาจที่แข่งขันกันของผู้ใช้เดิมได้ แต่ละตารางหลักถูกจำกัดไว้ที่
100 แถวต่อธุรกรรมการนำไปใช้หนึ่งครั้ง การกู้คืนที่ใหญ่กว่านั้นต้องใช้การย้ายเจ้าของแบบทำต่อได้ก่อน
แหล่งที่มาของสกิล GitHub อยู่ภายใต้ขอบเขตผู้เผยแพร่ และถูกรายงานว่าตรวจสอบแล้วแทนที่จะถูกเขียนใหม่

- เนื้อความ: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- การตอบกลับ: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### จุดปลาย API สำหรับจัดการ slug ของเจ้าของ

- `POST /api/v1/skills/{slug}/rename`
  - เนื้อความ: `{ "newSlug": "new-canonical-slug" }`
  - การตอบกลับ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - เนื้อความ: `{ "targetSlug": "canonical-target-slug" }`
  - การตอบกลับ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

หมายเหตุ:

- จุดปลาย API ทั้งสองต้องใช้การตรวจสอบสิทธิ์ด้วยโทเค็น API และทำงานได้เฉพาะสำหรับเจ้าของสกิลเท่านั้น
- `rename` เก็บ slug ก่อนหน้าไว้เป็นนามแฝงสำหรับเปลี่ยนเส้นทาง
- `merge` ซ่อนรายการต้นทางและเปลี่ยนเส้นทาง slug ต้นทางไปยังรายการปลายทาง

### จุดปลาย API สำหรับโอนความเป็นเจ้าของ

- `POST /api/v1/skills/{slug}/transfer`
  - เนื้อความ: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - การตอบกลับ: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - การตอบกลับ (ยอมรับ/ปฏิเสธ/ยกเลิก): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - รูปแบบการตอบกลับ: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

แบนผู้ใช้และลบสกิลที่เป็นเจ้าของแบบถาวร (เฉพาะผู้ดูแล/ผู้ดูแลระบบเท่านั้น)

เนื้อความ:

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

ยกเลิกการแบนผู้ใช้และกู้คืนสกิลที่มีสิทธิ์กู้คืน (เฉพาะผู้ดูแลระบบเท่านั้น)

เนื้อความ:

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
เนื้อหา (เฉพาะผู้ดูแลระบบเท่านั้น) ค่าเริ่มต้นเป็นโหมดจำลองการทำงาน เว้นแต่ `dryRun` เป็น `false`

เนื้อความ:

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

เปลี่ยนบทบาทผู้ใช้ (เฉพาะผู้ดูแลระบบเท่านั้น)

เนื้อความ:

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

แสดงรายการหรือค้นหาผู้ใช้ (เฉพาะผู้ดูแลระบบเท่านั้น)

พารามิเตอร์คำค้น:

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

เพิ่ม/ลบดาว (ไฮไลต์) จุดปลาย API ทั้งสองทำซ้ำได้อย่างปลอดภัย

การตอบกลับ:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## จุดปลาย API ของ CLI แบบเดิม (เลิกใช้แล้ว)

ยังรองรับสำหรับ CLI เวอร์ชันเก่า:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

ดูแผนการนำออกได้ใน `DEPRECATIONS.md`

`POST /api/cli/upload-url` ส่งคืน `uploadUrl` และ `uploadTicket` การเผยแพร่แพ็กเกจ
ที่จัดเตรียมไฟล์เก็บถาวร ClawPack ต้องส่งรหัสพื้นที่จัดเก็บที่ได้เป็น
`clawpack` และตั๋วที่ส่งคืนเป็น `clawpackUploadTicket`

## การค้นพบรีจิสทรี (`/.well-known/clawhub.json`)

CLI สามารถค้นพบการตั้งค่ารีจิสทรี/การตรวจสอบสิทธิ์จากไซต์ได้:

- `/.well-known/clawhub.json` (JSON, แนะนำ)
- `/.well-known/clawdhub.json` (เดิม)

สคีมา:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

หากคุณโฮสต์เอง ให้ให้บริการไฟล์นี้ (หรือตั้งค่า `CLAWHUB_REGISTRY` อย่างชัดเจน; `CLAWDHUB_REGISTRY` แบบเดิม)
