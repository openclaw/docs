---
read_when:
    - การเพิ่ม/เปลี่ยน endpoint
    - การดีบักคำขอ CLI ↔ รีจิสทรี
summary: เอกสารอ้างอิง HTTP API (สาธารณะ + endpoint ของ CLI + การยืนยันตัวตน)
x-i18n:
    generated_at: "2026-06-28T07:41:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API ผ่าน HTTP

URL ฐาน: `https://clawhub.ai` (ค่าเริ่มต้น)

พาธ v1 ทั้งหมดอยู่ภายใต้ `/api/v1/...`
พาธเดิม `/api/...` และ `/api/cli/...` ยังคงอยู่เพื่อความเข้ากันได้ (ดู `DEPRECATIONS.md`)
OpenAPI: `/api/v1/openapi.json`

## การนำแคตตาล็อกสาธารณะกลับมาใช้

ไดเรกทอรีของบุคคลที่สามอาจใช้ endpoint แบบอ่านสาธารณะเพื่อแสดงรายการหรือค้นหา ClawHub Skills ได้ โปรดแคชผลลัพธ์ เคารพ `429`/`Retry-After` ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub หลัก (`https://clawhub.ai/<owner>/skills/<slug>`) และหลีกเลี่ยงการสื่อว่า ClawHub รับรองเว็บไซต์ของบุคคลที่สามนั้น อย่าพยายามมิเรอร์เนื้อหาที่ซ่อน เป็นส่วนตัว หรือถูกบล็อกโดยการดูแลเนื้อหาออกนอกพื้นผิว API สาธารณะ

ทางลัด slug บนเว็บจะ resolve ข้ามตระกูล registry แต่ client ของ API ควรใช้
URL หลักที่ endpoint แบบอ่านส่งคืน แทนการประกอบลำดับความสำคัญของ route
ขึ้นใหม่เอง

## ขีดจำกัดอัตรา

โมเดลการบังคับใช้:

- คำขอแบบไม่ระบุตัวตน: บังคับใช้ต่อ IP
- คำขอที่ยืนยันตัวตนแล้ว (Bearer token ที่ถูกต้อง): บังคับใช้ต่อ bucket ของผู้ใช้
- หาก token หายไป/ไม่ถูกต้อง พฤติกรรมจะ fallback ไปใช้การบังคับใช้ตาม IP
- endpoint แบบเขียนที่ยืนยันตัวตนแล้วไม่ควรส่งคืน `Unauthorized` เปล่า ๆ เมื่อ
  server รู้เหตุผล token ที่หายไป token ที่ไม่ถูกต้อง/ถูกเพิกถอน และ
  บัญชีที่ถูกลบ/ถูกแบน/ถูกปิดใช้งาน ควรได้ข้อความที่ดำเนินการต่อได้ในแต่ละกรณี เพื่อให้ client
  CLI บอกผู้ใช้ได้ว่าอะไรบล็อกพวกเขาอยู่

- อ่าน: 3000/นาที ต่อ IP, 12000/นาที ต่อ key
- เขียน: 300/นาที ต่อ IP, 3000/นาที ต่อ key
- ดาวน์โหลด: 1200/นาที ต่อ IP, 6000/นาที ต่อ key (endpoint ดาวน์โหลด)

Headers:

- ความเข้ากันได้แบบเดิม: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- แบบมาตรฐาน: `RateLimit-Limit`, `RateLimit-Reset`
- เมื่อเป็น `429`: `X-RateLimit-Remaining: 0` และ `RateLimit-Remaining: 0`
- เมื่อเป็น `429`: `Retry-After`

ความหมายของ header:

- `X-RateLimit-Reset`: วินาที Unix epoch แบบสัมบูรณ์
- `RateLimit-Reset`: วินาทีจนกว่าจะ reset (delay)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: งบที่เหลือแบบแน่นอนเมื่อมีค่า
  คำขอที่สำเร็จแบบ sharded จะละ header นี้แทนการส่งค่ารวมทั่วระบบแบบประมาณการ
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

คำแนะนำสำหรับ client:

- หากมี `Retry-After` ให้รอจำนวนวินาทีนั้นก่อนลองใหม่
- ใช้ backoff ที่มี jitter เพื่อหลีกเลี่ยงการลองใหม่พร้อมกัน
- หากไม่มี `Retry-After` ให้ fallback ไปใช้ `RateLimit-Reset` (หรือคำนวณจาก `X-RateLimit-Reset`)

แหล่งที่มาของ IP:

- ใช้ header IP client ที่เชื่อถือได้ รวมถึง `cf-connecting-ip` เฉพาะเมื่อ
  deployment เปิดใช้ trusted forwarded headers อย่างชัดเจน
- ClawHub ใช้ trusted forwarding headers เพื่อระบุ IP ของ client ที่ edge
- หากไม่มี IP client ที่เชื่อถือได้ คำขอแบบไม่ระบุตัวตนจะใช้ bucket fallback
  ที่ scope ตามชนิดของ rate-limit เท่านั้น bucket fallback เหล่านี้จะไม่รวม
  พาธ, slug, ชื่อ package, version, query string หรือพารามิเตอร์ artifact อื่น ๆ
  ที่ผู้เรียกส่งมา

## Error responses

error response สาธารณะของ v1 เป็นข้อความธรรมดาพร้อม `content-type: text/plain; charset=utf-8`
ซึ่งรวมถึง validation failures (`400`), resource สาธารณะที่หายไป (`404`), auth และ
permission failures (`401`/`403`), rate limits (`429`) และการดาวน์โหลดที่ถูกบล็อก Client
ควรอ่านข้อความใน response body เป็น string ที่มนุษย์อ่านได้ พารามิเตอร์ query ที่ไม่รู้จักจะ
ถูกละเว้นเพื่อความเข้ากันได้ แต่พารามิเตอร์ query ที่รู้จักและมีค่าไม่ถูกต้องจะส่งคืน
`400`

## Endpoint สาธารณะ (ไม่ต้อง auth)

### `GET /api/v1/search`

Query params:

- `q` (จำเป็น): query string
- `limit` (ไม่บังคับ): integer
- `highlightedOnly` (ไม่บังคับ): `true` เพื่อกรองเหลือเฉพาะ Skills ที่ถูกไฮไลต์
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias แบบเดิมสำหรับ `nonSuspiciousOnly`

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
- ความเกี่ยวข้องมีน้ำหนักมากกว่าความนิยม การจับคู่ token ของ slug หรือ display-name ที่แม่นยำสามารถอยู่เหนือการจับคู่ที่หลวมกว่าแม้มี engagement สูงกว่ามากได้
- ข้อความ ASCII จะถูก tokenize ตามขอบเขตของคำและเครื่องหมายวรรคตอน ตัวอย่างเช่น `personal-map` มี token `map` แบบ standalone ขณะที่ `amap-jsapi-skill` มี `amap`, `jsapi` และ `skill`; ดังนั้นการค้นหา `map` จะทำให้ `personal-map` ได้ lexical match ที่แข็งแรงกว่า `amap-jsapi-skill`
- ความนิยมถูก log-scale และมีเพดาน Skills ที่มี engagement สูงอาจจัดอันดับต่ำกว่าเมื่อข้อความ query จับคู่ได้น้อยกว่า
- สถานะการดูแลเนื้อหาที่น่าสงสัยหรือซ่อนอยู่อาจทำให้ Skill ถูกนำออกจากการค้นหาสาธารณะ ขึ้นอยู่กับตัวกรองของผู้เรียกและสถานะการดูแลเนื้อหาปัจจุบัน

คำแนะนำด้านการค้นพบสำหรับผู้เผยแพร่:

- ใส่คำที่ผู้ใช้จะค้นหาจริง ๆ ใน display name, summary และ tags ใช้ token slug แบบ standalone เฉพาะเมื่อมันเป็น identity ที่เสถียรและคุณต้องการเก็บไว้ด้วย
- อย่าเปลี่ยนชื่อ slug เพียงเพื่อไล่ตาม query หนึ่งรายการ เว้นแต่ slug ใหม่จะเป็นชื่อหลักระยะยาวที่ดีกว่า slug เก่าจะกลายเป็น redirect aliases แต่ URL หลัก, slug ที่แสดง และ search digest ในอนาคตจะใช้ slug ใหม่
- Rename aliases จะรักษาการ resolve สำหรับ URL เก่าและการติดตั้งที่ resolve ผ่าน registry แต่ search ranking จะอิง metadata ของ Skill หลักหลังจาก rename ถูก index แล้ว stats เดิมจะยังอยู่กับ Skill
- หาก Skill มองไม่เห็นโดยไม่คาดคิด ให้ตรวจสอบสถานะการดูแลเนื้อหาก่อนด้วย `clawhub inspect @owner/slug` ขณะ logged in ก่อนเปลี่ยน metadata ที่เกี่ยวกับ ranking

### `GET /api/v1/skills`

Query params:

- `limit` (ไม่บังคับ): integer (1–200)
- `cursor` (ไม่บังคับ): pagination cursor สำหรับ sort ใด ๆ ที่ไม่ใช่ `trending`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), legacy install aliases `installsCurrent`/`installs`/`installsAllTime` map ไปที่ `downloads`, `trending`
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias แบบเดิมสำหรับ `nonSuspiciousOnly`

ค่า `sort` ที่ไม่ถูกต้องจะส่งคืน `400`

หมายเหตุ:

- `recommended` ใช้สัญญาณ engagement และความใหม่
- `trending` จัดอันดับตามการติดตั้งใน 7 วันที่ผ่านมา (อิง telemetry)
- `createdAt` เสถียรสำหรับการ crawl Skill ใหม่; `updated` เปลี่ยนเมื่อ Skill ที่มีอยู่ถูกเผยแพร่ใหม่
- เมื่อ `nonSuspiciousOnly=true` การ sort แบบ cursor-based อาจส่งคืน item น้อยกว่า `limit` ในหนึ่งหน้า เพราะ Skills ที่น่าสงสัยถูกกรองหลังดึงหน้าแล้ว
- ใช้ `nextCursor` เพื่อทำ pagination ต่อเมื่อมีอยู่ หน้าแบบสั้นไม่ได้หมายความว่าเป็นจุดสิ้นสุดของผลลัพธ์โดยตัวมันเอง

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

- slug เก่าที่สร้างโดย flow การ rename/merge ของ owner จะ resolve ไปยัง Skill หลัก
- `metadata.os`: ข้อจำกัด OS ที่ประกาศใน frontmatter ของ Skill (เช่น `["macos"]`, `["linux"]`) `null` หากไม่ได้ประกาศ
- `metadata.systems`: target ของระบบ Nix (เช่น `["aarch64-darwin", "x86_64-linux"]`) `null` หากไม่ได้ประกาศ
- `metadata` เป็น `null` หาก Skill ไม่มี metadata ของแพลตฟอร์ม
- `moderation` จะรวมอยู่เฉพาะเมื่อ Skill ถูก flag หรือ owner กำลังดูอยู่

### `GET /api/v1/skills/{slug}/moderation`

ส่งคืนสถานะการดูแลเนื้อหาแบบ structured

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

- Owner และ moderator สามารถเข้าถึงรายละเอียดการดูแลเนื้อหาสำหรับ Skills ที่ซ่อนอยู่ได้
- ผู้เรียกสาธารณะจะได้ `200` เฉพาะกับ Skills ที่มองเห็นได้และถูก flag แล้ว
- Evidence จะถูก redact สำหรับผู้เรียกสาธารณะ และจะรวม raw snippets เฉพาะสำหรับ owner/moderator เท่านั้น

### `POST /api/v1/skills/{slug}/report`

รายงาน Skill เพื่อให้ moderator ตรวจสอบ รายงานเป็นระดับ Skill โดยอาจลิงก์
กับ version ได้ และจะป้อนเข้าสู่ queue รายงาน Skill

Auth:

- ต้องมี API token

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

Endpoint สำหรับ moderator/admin เพื่อรับรายงาน Skill เข้า

Query params:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `confirmed`, `dismissed` หรือ `all`
- `limit` (ไม่บังคับ): integer (1-200)
- `cursor` (ไม่บังคับ): pagination cursor

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

Endpoint สำหรับ moderator/admin เพื่อ resolve หรือ reopen รายงาน Skill

Request:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

ต้องมี `note` สำหรับ `confirmed` และ `dismissed`; อาจละไว้ได้เมื่อ
ตั้ง `status` กลับเป็น `open` ส่ง `finalAction: "hide"` พร้อมรายงานที่ triage แล้ว
เพื่อซ่อน Skill ใน workflow เดียวกันที่ audit ได้

### `GET /api/v1/skills/{slug}/versions`

Query params:

- `limit` (ไม่บังคับ): integer
- `cursor` (ไม่บังคับ): pagination cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

ส่งคืน metadata ของ version + รายการไฟล์

- `version.security` รวมสถานะการยืนยันการสแกนที่ normalize แล้วและรายละเอียด scanner
  (VirusTotal + LLM) เมื่อมี

### `GET /api/v1/skills/{slug}/scan`

ส่งคืนรายละเอียดการยืนยันการสแกนความปลอดภัยสำหรับ version ของ Skill

Query params:

- `version` (ไม่บังคับ): string version เฉพาะ
- `tag` (ไม่บังคับ): resolve version ที่ tag ไว้ (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- รวมสถานะการตรวจสอบที่ปรับให้อยู่ในรูปแบบมาตรฐาน พร้อมรายละเอียดเฉพาะของสแกนเนอร์
- `security.hasScanResult` เป็น `true` เฉพาะเมื่อสแกนเนอร์สร้างคำตัดสินที่ชัดเจน (`clean`, `suspicious` หรือ `malicious`)
- `moderation` คือสแนปช็อตการกลั่นกรองระดับ Skill ปัจจุบันที่ได้มาจากเวอร์ชันล่าสุด
- เมื่อค้นหาเวอร์ชันในอดีต ให้ตรวจสอบ `moderation.matchesRequestedVersion` และ `moderation.sourceVersion` ก่อนถือว่า `moderation` และ `security` อยู่ในบริบทเวอร์ชันเดียวกัน

### `POST /api/v1/skills/-/scan`

เอนด์พอยต์ส่งแบบยืนยันตัวตนสำหรับงาน ClawScan ใหม่

ไม่รองรับการสแกนอัปโหลดในเครื่องอีกต่อไป คำขอที่ใช้
`multipart/form-data` หรือ `{ "source": { "kind": "upload" } }` จะส่งกลับ `410`

การสแกนที่เผยแพร่แล้วใช้ JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

หมายเหตุ:

- เพย์โหลดคำขอสแกนและรายงานที่ดาวน์โหลดได้จะหมดอายุจากที่เก็บคำขอสแกนหลังพ้นช่วงเวลาการเก็บรักษา
- การสแกนที่เผยแพร่แล้วต้องมีสิทธิ์จัดการของเจ้าของ/ผู้เผยแพร่ หรืออำนาจของผู้กลั่นกรอง/ผู้ดูแลแพลตฟอร์ม
- การสแกนที่เผยแพร่แล้วจะเขียนกลับเฉพาะเมื่อ `update: true` และการสแกนเสร็จสมบูรณ์สำเร็จ
- การตอบกลับคือ `202` พร้อม `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`
- งานสแกนเป็นแบบอะซิงโครนัส คำขอสแกนด้วยตนเองจะได้รับลำดับความสำคัญก่อนงานเผยแพร่/เติมย้อนหลังตามปกติ แต่การเสร็จสมบูรณ์ยังขึ้นอยู่กับความพร้อมของเวิร์กเกอร์

### `GET /api/v1/skills/-/scan/{scanId}`

เอนด์พอยต์สำรวจแบบยืนยันตัวตนสำหรับการสแกนที่ส่งแล้ว

- ส่งกลับสถานะเข้าคิว/กำลังทำงาน/สำเร็จ/ล้มเหลว
- ส่งกลับ `queue.queuedAhead` และ `queue.position` ระหว่างอยู่ในคิว เพื่อให้ไคลเอนต์แสดงจำนวนการสแกนด้วยตนเองแบบมีลำดับความสำคัญที่อยู่ก่อนคำขอได้ คิวที่ใหญ่มากจะถูกจำกัดขอบเขตและรายงานด้วย `queuedAheadIsEstimate: true`
- เมื่อพร้อมใช้งาน `report` จะมีส่วน `clawscan`, `skillspector`, `staticAnalysis` และ `virustotal`
- งานสแกนที่ล้มเหลวจะส่งกลับ `status: "failed"` พร้อม `lastError`

### `GET /api/v1/skills/-/scan/{scanId}/download`

เอนด์พอยต์คลังรายงานแบบยืนยันตัวตน

- ต้องเป็นการสแกนที่สำเร็จแล้ว; การสแกนที่ยังไม่สิ้นสุดจะส่งกลับ `409`
- ส่งกลับ ZIP ที่มี `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

เอนด์พอยต์คลังรายงานที่จัดเก็บไว้แบบยืนยันตัวตนสำหรับเวอร์ชันที่ส่งแล้ว

- ต้องมีสิทธิ์จัดการของเจ้าของ/ผู้เผยแพร่สำหรับ Skill หรือ Plugin หรืออำนาจของผู้กลั่นกรอง/ผู้ดูแลแพลตฟอร์ม
- ส่งกลับผลสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งอย่างตรงตัว รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อนไว้
- `kind` มีค่าเริ่มต้นเป็น `skill`; ใช้ `kind=plugin` สำหรับการสแกน Plugin/แพ็กเกจ
- ส่งกลับรูปแบบ ZIP เดียวกับการดาวน์โหลดคำขอสแกน

### `POST /api/v1/skills/-/scan/batch`

เส้นทางสแกนซ้ำแบบแบตช์มาตรฐานสำหรับผู้ดูแลเท่านั้น รับรูปแบบเพย์โหลดเดียวกับ `POST /api/v1/skills/-/rescan-batch` แบบเดิม

### `POST /api/v1/skills/-/scan/batch/status`

เส้นทางสถานะแบบแบตช์มาตรฐานสำหรับผู้ดูแลเท่านั้น รับ `{ "jobIds": ["..."] }` และส่งกลับตัวนับรวมเดียวกับ `POST /api/v1/skills/-/rescan-batch/status` แบบเดิม

### `GET /api/v1/skills/{slug}/verify`

ส่งกลับซองการตรวจสอบ Skill Card ที่ใช้โดย `clawhub skill verify`

พารามิเตอร์คิวรี:

- `version` (ไม่บังคับ): สตริงเวอร์ชันเฉพาะ
- `tag` (ไม่บังคับ): แปลงแท็กเป็นเวอร์ชันที่ผูกไว้ (เช่น `latest`)

หมายเหตุ:

- `ok` เป็น `true` เฉพาะเมื่อเวอร์ชันที่เลือกมี Skill Card ที่สร้างแล้ว ไม่ถูกการกลั่นกรองบล็อกว่าเป็นมัลแวร์ และการตรวจสอบ ClawScan สะอาด
- ตัวตนของ Skill, ตัวตนของผู้เผยแพร่ และเมตาดาต้าเวอร์ชันที่เลือกเป็นฟิลด์ซองระดับบนสุด (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) เพื่อให้ระบบอัตโนมัติของเชลล์อ่านได้โดยไม่ต้องแกะ wrapper ที่ซ้อนกัน
- `security` คือคำตัดสิน ClawScan/ความปลอดภัยระดับบนสุด ระบบอัตโนมัติควรอ้างอิง `ok`, `decision`, `reasons` และ `security.status`
- `security.signals` มีหลักฐานสนับสนุนจากสแกนเนอร์ เช่น `staticScan`, `virusTotal` และ `skillSpector`
- `security.signals.dependencyRegistry` ยังคงไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่สแกนเนอร์ตรวจการมีอยู่ของรีจิสทรี dependency ถูกเลิกใช้แล้ว และคีย์นี้เป็น `null` เสมอ
- `provenance` เป็น `server-resolved-github-import` เฉพาะเมื่อ ClawHub แปลงและจัดเก็บ repo/ref/commit/path ของ GitHub ระหว่างเผยแพร่หรือนำเข้า; มิฉะนั้นจะเป็น `unavailable`

### `POST /api/v1/skills/-/security-verdicts`

ส่งกลับคำตัดสินด้านความปลอดภัยแบบย่อปัจจุบันสำหรับเวอร์ชัน Skill ที่ตรงตัว
เอนด์พอยต์คอลเลกชันนี้มีไว้สำหรับไคลเอนต์ที่รู้เวอร์ชัน Skill ของ ClawHub ที่ติดตั้งไว้แล้วซึ่งต้องแสดงผล เช่น OpenClaw Control UI

คำขอ:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

หมายเหตุ:

- `items` ต้องมีคู่ `{ slug, version }` ที่ไม่ซ้ำกัน 1-100 คู่
- ผลลัพธ์แยกตามรายการ; Skill หรือเวอร์ชันที่หายไปหนึ่งรายการจะไม่ทำให้การตอบกลับทั้งหมดล้มเหลว
- การตอบกลับเป็นข้อมูลความปลอดภัยเท่านั้น ไม่รวมข้อมูล Skill Card, สถานะการ์ดที่สร้างแล้ว, รายการไฟล์ artifact หรือเพย์โหลดสแกนเนอร์แบบละเอียด
- `security.signals` มีเฉพาะหลักฐานสนับสนุนระดับสถานะ; ใช้ `/scan` หรือหน้า security-audit ของ ClawHub สำหรับรายละเอียดสแกนเนอร์แบบเต็ม
- `security.signals.dependencyRegistry` ยังคงไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่สแกนเนอร์ตรวจการมีอยู่ของรีจิสทรี dependency ถูกเลิกใช้แล้ว และคีย์นี้เป็น `null` เสมอ
- การไม่มี Skill Card ไม่มีผลต่อ `ok`, `decision` หรือ `reasons` ของเอนด์พอยต์นี้; ไคลเอนต์ควรอ่าน `skill-card.md` ที่ติดตั้งไว้ในเครื่องเมื่อจำเป็นต้องใช้เนื้อหาการ์ด
- ใช้ `/verify` เมื่อคุณต้องการซองการตรวจสอบ Skill Card สำหรับ Skill เดียว, `/card` เมื่อคุณต้องการ Markdown ของการ์ดที่สร้างแล้ว และ `/scan` เมื่อคุณต้องการข้อมูลสแกนเนอร์แบบละเอียด

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

ปลายทางแคตตาล็อกแบบรวมสำหรับ:

- skills
- code plugins
- bundle plugins

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
  นามแฝงตัวกรอง v1 เดิมมีเอกสารอยู่ใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, หรือ `sort` จะส่งคืน `400` พารามิเตอร์คิวรีที่ไม่รู้จักจะถูกละเว้น
- `GET /api/v1/code-plugins` และ `GET /api/v1/bundle-plugins` ยังคงเป็นนามแฝงแบบตระกูลคงที่
- รายการ Skill ยังคงอิงจากทะเบียน Skill และยังเผยแพร่ได้ผ่าน `POST /api/v1/skills` เท่านั้น
- `POST /api/v1/packages` ยังคงใช้สำหรับรีลีส code-plugin และ bundle-plugin เท่านั้น
- ผู้เรียกแบบไม่ระบุชื่อจะเห็นเฉพาะช่องแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถเห็นแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดในผลลัพธ์รายการ/ค้นหา
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ผ่านการยืนยันตัวตนอ่านได้

### `GET /api/v1/packages/search`

การค้นหาแคตตาล็อกแบบรวมใน Skills + แพ็กเกจ Plugin

พารามิเตอร์คิวรี:

- `q` (จำเป็น): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `family` (ไม่บังคับ): `skill`, `code-plugin`, หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community`, หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอถูกจำกัดขอบเขตไปยังแพ็กเกจ Plugin หมวดหมู่ที่ควบคุมและนามแฝง
  ตัวกรอง v1 เดิมมีเอกสารอยู่ใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured`, หรือ
  `highlightedOnly` จะส่งคืน `400` พารามิเตอร์คิวรีที่ไม่รู้จักจะถูกละเว้น
- ผู้เรียกแบบไม่ระบุชื่อจะเห็นเฉพาะช่องแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถค้นหาแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดได้
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ผ่านการยืนยันตัวตนอ่านได้

### `GET /api/v1/plugins`

การเรียกดูแคตตาล็อกเฉพาะ Plugin ในแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์คิวรี:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `recommended` (ค่าเริ่มต้น), `trending`, `downloads`, `updated`, นามแฝงเดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

นามแฝงตัวกรอง v1 เดิมยังคงยอมรับในปลายทางอ่าน:

- `mcp-tooling`, `data`, และ `automation` จะแปลงเป็น `tools`
- `observability` และ `deployment` จะแปลงเป็น `gateway`
- `dev-tools` จะแปลงเป็น `runtime`

`trending` คือกระดานจัดอันดับการติดตั้ง/ดาวน์โหลดเจ็ดวัน และไม่ได้ใช้ยอดรวมตลอดกาล
บนปลายทางแบบรวม `/api/v1/packages` ค่านี้ใช้ได้เฉพาะ Plugin; ใช้
`/api/v1/skills?sort=trending` สำหรับแคตตาล็อก Skill

นามแฝงเดิมไม่ถูกยอมรับเป็นค่าหมวดหมู่ที่จัดเก็บหรือผู้เขียนประกาศ

### `GET /api/v1/skills/export`

การส่งออก Skills สาธารณะล่าสุดแบบเป็นชุดเพื่อการวิเคราะห์ออฟไลน์

การยืนยันตัวตน:

- ต้องใช้โทเค็น API

พารามิเตอร์คิวรี:

- `startDate` (จำเป็น): ขอบเขตล่างแบบมิลลิวินาที Unix สำหรับ `updatedAt` ของ Skill
- `endDate` (จำเป็น): ขอบเขตบนแบบมิลลิวินาที Unix สำหรับ `updatedAt` ของ Skill
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าจากการตอบกลับก่อนหน้า

การตอบกลับ:

- เนื้อหา: ไฟล์ ZIP
- Skill ที่ส่งออกแต่ละรายการมีรากอยู่ที่ `{publisher}/{slug}/`
- Skills ที่โฮสต์รวมไฟล์เวอร์ชันล่าสุดที่จัดเก็บไว้ และถูกระบุใน
  `_manifest.json` พร้อม `sourceRef: "public-clawhub"`
- Skills ปัจจุบันที่อิง GitHub และมีการสแกนเป็น `clean` หรือ `suspicious` รวม
  `_source_handoff.json` พร้อม `sourceRef: "public-github"`, repo, commit, path,
  แฮชเนื้อหา และ URL ของอาร์ไคฟ์ โดยไม่รวมไฟล์ซอร์สที่โฮสต์บน ClawHub
- Skill แต่ละรายการรวม `_export_skill_meta.json`
- `_manifest.json` จะรวมอยู่ที่รากของ ZIP เสมอ
- `_errors.json` จะรวมอยู่เมื่อไม่สามารถส่งออก Skills หรือไฟล์บางรายการได้

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

พารามิเตอร์คำค้น:

- `startDate` (ต้องระบุ): ขอบเขตล่างแบบมิลลิวินาที Unix สำหรับ `updatedAt` ของ Plugin
- `endDate` (ต้องระบุ): ขอบเขตบนแบบมิลลิวินาที Unix สำหรับ `updatedAt` ของ Plugin
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์แบ่งหน้าจากการตอบกลับก่อนหน้า
- `family` (ไม่บังคับ): `code-plugin` หรือ `bundle-plugin` หากละไว้หมายถึงทั้งสอง
  ตระกูล Plugin

การตอบกลับ:

- เนื้อหา: อาร์ไคฟ์ ZIP
- Plugin ที่ส่งออกแต่ละรายการมีรากอยู่ที่ `{family}/{packageName}/`
- Plugin ที่ส่งออกแต่ละรายการมีไฟล์ที่จัดเก็บไว้ของรีลีสล่าสุด
- เมทาดาทาการส่งออกต่อ Plugin ถูกจัดเก็บที่
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`
- มี `_manifest.json` รวมอยู่ที่ราก ZIP เสมอ
- มี `_errors.json` รวมอยู่เมื่อ Plugin หรือไฟล์บางรายการไม่สามารถ
  ส่งออกได้

ส่วนหัว:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

ค้นหาเฉพาะ Plugin ในแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์คำค้น:

- `q` (ต้องระบุ): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

หมายเหตุ:

- นามแฝงตัวกรอง v1 เดิมที่บันทึกไว้ใน `GET /api/v1/plugins` ก็
  รองรับเช่นกัน
- การกรองหมวดหมู่เป็นตัวกรอง API จริงที่อ้างอิงจากแถวไดเจสต์หมวดหมู่ Plugin
  ไม่ใช่การเขียนคำค้นหาใหม่
- ผลลัพธ์ส่งกลับตามลำดับความเกี่ยวข้องและปัจจุบันยังไม่มีการแบ่งหน้า
- ตัวควบคุมการเรียงลำดับใน UI เบราว์เซอร์สำหรับการค้นหา Plugin จะเรียงผลลัพธ์ความเกี่ยวข้องที่โหลดแล้วใหม่
  ให้ตรงกับพฤติกรรมการเรียกดู `/skills` ปัจจุบัน

### `GET /api/v1/packages/{name}`

ส่งกลับเมทาดาทารายละเอียดแพ็กเกจ

หมายเหตุ:

- Skills สามารถ resolve ผ่านเส้นทางนี้ในแค็ตตาล็อกรวมได้เช่นกัน
- แพ็กเกจส่วนตัวจะส่งกลับ `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่ที่เป็นเจ้าของได้

### `DELETE /api/v1/packages/{name}`

ลบแพ็กเกจและรีลีสทั้งหมดแบบนิ่ม

หมายเหตุ:

- ต้องใช้โทเค็น API สำหรับเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลผู้เผยแพร่องค์กร,
  ผู้ดูแลแพลตฟอร์ม หรือผู้ดูแลระบบแพลตฟอร์ม

### `GET /api/v1/packages/{name}/versions`

ส่งกลับประวัติเวอร์ชัน

พารามิเตอร์คำค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์แบ่งหน้า

หมายเหตุ:

- แพ็กเกจส่วนตัวจะส่งกลับ `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่ที่เป็นเจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}`

ส่งกลับแพ็กเกจหนึ่งเวอร์ชัน รวมถึงเมทาดาทาไฟล์ ความเข้ากันได้
การยืนยัน เมทาดาทาอาร์ติแฟกต์ และข้อมูลการสแกน

หมายเหตุ:

- `version.artifact.kind` คือ `legacy-zip` สำหรับอาร์ไคฟ์แพ็กเกจแบบเก่า หรือ
  `npm-pack` สำหรับรีลีสที่รองรับโดย ClawPack
- รีลีส ClawPack มีฟิลด์ `npmIntegrity`, `npmShasum` และ
  `npmTarballName` ที่เข้ากันได้กับ npm
- `version.sha256hash` เป็นเมทาดาทาความเข้ากันได้ที่เลิกใช้แล้วสำหรับไคลเอนต์เก่า ซึ่ง
  แฮชไบต์ ZIP ตรงตามที่ส่งกลับโดย `/api/v1/packages/{name}/download`
  ไคลเอนต์สมัยใหม่ควรใช้ `version.artifact.sha256` ซึ่งระบุ
  อาร์ติแฟกต์รีลีสมาตรฐาน
- มี `version.vtAnalysis`, `version.llmAnalysis` และ `version.staticScan`
  รวมอยู่เมื่อมีข้อมูลการสแกน
- แพ็กเกจส่วนตัวจะส่งกลับ `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่ที่เป็นเจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}/security`

ส่งกลับสรุปความปลอดภัยและความน่าเชื่อถือของรีลีสแพ็กเกจที่ตรงกันสำหรับไคลเอนต์ติดตั้ง
นี่คือพื้นผิวการใช้งานสาธารณะของ OpenClaw สำหรับตัดสินใจว่า
รีลีสที่ resolve แล้วสามารถติดตั้งได้หรือไม่

การยืนยันตัวตน:

- ปลายทางอ่านแบบสาธารณะ ไม่ต้องใช้โทเค็นของเจ้าของ ผู้เผยแพร่ ผู้ดูแล
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
  แพ็กเกจรีจิสทรีที่ resolve แล้ว
- `release.releaseId`, `release.version` และ `release.createdAt` ระบุ
  รีลีสที่ถูกประเมินอย่างตรงตัว
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` และ `release.npmTarballName` จะมีอยู่เมื่อทราบค่าสำหรับ
  อาร์ติแฟกต์รีลีส
- `trust.scanStatus` คือสถานะความน่าเชื่อถือที่มีผล ซึ่งได้มาจากอินพุตของสแกนเนอร์
  และการกลั่นกรองรีลีสด้วยตนเอง
- `trust.moderationState` อาจเป็น null ได้ โดยเป็น `null` เมื่อไม่มี
  การกลั่นกรองรีลีสด้วยตนเอง
- `trust.blockedFromDownload` คือสัญญาณบล็อกการติดตั้ง OpenClaw และ
  ไคลเอนต์ติดตั้งอื่นควรบล็อกการติดตั้งเมื่อค่านี้เป็น `true` แทนการ
  คำนวณกฎการบล็อกใหม่จากฟิลด์สแกนเนอร์หรือการกลั่นกรอง
- `trust.reasons` คือรายการคำอธิบายสำหรับผู้ใช้และการตรวจสอบ โค้ดเหตุผล
  เป็นสตริงที่เสถียรและกะทัดรัด เช่น `manual:quarantined`, `scan:malicious`,
  และ `package:malicious`
- `trust.pending` หมายถึงอินพุตความน่าเชื่อถือหนึ่งรายการขึ้นไปยังรอการดำเนินการให้เสร็จสมบูรณ์
- `trust.stale` หมายถึงสรุปความน่าเชื่อถือถูกคำนวณจากอินพุตที่ล้าสมัย และ
  ควรถูกถือว่าต้องรีเฟรชก่อนตัดสินใจอนุญาตด้วยความมั่นใจสูง

หมายเหตุ:

- ปลายทางนี้ตรงตามเวอร์ชัน ไคลเอนต์ควรเรียกหลังจาก resolve
  เวอร์ชันแพ็กเกจที่ตั้งใจจะติดตั้ง ไม่ใช่เพียงหลังจากอ่าน
  เมทาดาทาแพ็กเกจล่าสุด
- แพ็กเกจส่วนตัวจะส่งกลับ `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่ที่เป็นเจ้าของได้
- ปลายทางนี้ตั้งใจให้แคบกว่าปลายทางการกลั่นกรองของเจ้าของ/ผู้ดูแล
  โดยเปิดเผยการตัดสินใจติดตั้งและคำอธิบายสาธารณะ ไม่ใช่
  ตัวตนผู้รายงาน เนื้อหารายงาน หลักฐานส่วนตัว หรือไทม์ไลน์การตรวจสอบภายใน

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

ส่งกลับเมทาดาทา resolver ของอาร์ติแฟกต์แบบชัดเจนสำหรับเวอร์ชันแพ็กเกจ

หมายเหตุ:

- เวอร์ชันแพ็กเกจเดิมส่งกลับอาร์ติแฟกต์ `legacy-zip` และ
  `downloadUrl` ของ ZIP เดิม
- เวอร์ชัน ClawPack ส่งกลับอาร์ติแฟกต์ `npm-pack`, ฟิลด์ความสมบูรณ์ของ npm,
  `tarballUrl` และ URL ความเข้ากันได้ของ ZIP เดิม
- นี่คือพื้นผิว resolver ของ OpenClaw โดยหลีกเลี่ยงการเดารูปแบบอาร์ไคฟ์จาก
  URL ร่วม

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ดาวน์โหลดอาร์ติแฟกต์เวอร์ชันผ่านเส้นทาง resolver ที่ชัดเจน

หมายเหตุ:

- เวอร์ชัน ClawPack สตรีมไบต์ `.tgz` ของ npm-pack ที่อัปโหลดไว้ตรงตามจริง
- เวอร์ชัน ZIP เดิมเปลี่ยนเส้นทางไปที่ `/api/v1/packages/{name}/download?version=`
- ใช้บักเก็ตอัตราการดาวน์โหลด

### `GET /api/v1/packages/{name}/readiness`

ส่งกลับความพร้อมที่คำนวณแล้วสำหรับการใช้งาน OpenClaw ในอนาคต

การตรวจสอบความพร้อมครอบคลุม:

- สถานะช่องทางทางการ
- ความพร้อมใช้งานของเวอร์ชันล่าสุด
- ความพร้อมใช้งานของอาร์ติแฟกต์ ClawPack npm-pack
- ไดเจสต์อาร์ติแฟกต์
- ที่มาของ repo ต้นทางและคอมมิต
- เมทาดาทาความเข้ากันได้กับ OpenClaw
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

ปลายทางผู้ดูแลสำหรับแสดงรายการแถวการย้าย Plugin ทางการของ OpenClaw

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คำค้น:

- `phase` (ไม่บังคับ): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` หรือ
  `all` (ค่าเริ่มต้น)
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์แบ่งหน้า

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

- `bundledPluginId` ถูกปรับให้เป็นตัวพิมพ์เล็กและเป็นคีย์ upsert ที่เสถียร
- `packageName` ถูกปรับให้เป็นรูปแบบชื่อ npm; แพ็กเกจอาจไม่มีอยู่สำหรับการย้ายที่วางแผนไว้
- สิ่งนี้ติดตามเฉพาะความพร้อมของการย้ายเท่านั้น ไม่ได้เปลี่ยนแปลง OpenClaw หรือสร้าง
  ClawPacks

### `GET /api/v1/packages/moderation/queue`

ปลายทางผู้ดูแล/ผู้ดูแลระบบสำหรับคิวตรวจสอบรีลีสแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คำค้น:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `blocked`, `manual` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์แบ่งหน้า

ความหมายของสถานะ:

- `open`: รีลีสที่น่าสงสัย เป็นอันตราย รอดำเนินการ ถูกกักกัน ถูกเพิกถอน หรือถูกรายงาน
- `blocked`: รีลีสที่ถูกกักกัน ถูกเพิกถอน หรือเป็นอันตราย
- `manual`: รีลีสใดๆ ที่มีการแทนที่การกลั่นกรองด้วยตนเอง
- `all`: รีลีสใดๆ ที่มีการแทนที่ด้วยตนเอง สถานะการสแกนที่ไม่สะอาด หรือรายงานแพ็กเกจ

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
บล็อกการดาวน์โหลดโดยอัตโนมัติด้วยตัวเอง ผู้ดูแลควรใช้การกลั่นกรองรีลีสเพื่อ
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

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คำค้น:

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

ปลายทางสำหรับเจ้าของ/ผู้ดูแลเพื่อดูข้อมูลการกลั่นกรองแพ็กเกจ

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

ต้องมี `note` สำหรับ `confirmed` และ `dismissed`; อาจละไว้ได้เมื่อ
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

ปลายทางสำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อตรวจสอบรีลีสแพ็กเกจ

คำขอ:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

สถานะที่รองรับ:

- `approved`: ตรวจสอบด้วยตนเองแล้วและอนุญาต
- `quarantined`: ถูกบล็อกระหว่างรอการติดตามผล
- `revoked`: ถูกบล็อกหลังจากรีลีสเคยได้รับความเชื่อถือมาก่อน

รีลีสที่ถูกกักกันและถูกเพิกถอนจะส่งคืน `403` จากเส้นทางดาวน์โหลดอาร์ติแฟกต์
การเปลี่ยนแปลงทุกครั้งจะเขียนรายการบันทึกการตรวจสอบ

### `GET /api/v1/packages/{name}/file`

ส่งคืนเนื้อหาข้อความดิบสำหรับไฟล์แพ็กเกจ

พารามิเตอร์คำค้น:

- `path` (ต้องระบุ)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือรีลีสล่าสุด
- ใช้บักเก็ตอัตราการอ่าน ไม่ใช่บักเก็ตการดาวน์โหลด
- ไฟล์ไบนารีส่งคืน `415`
- ขีดจำกัดขนาดไฟล์: 200KB
- การสแกน VirusTotal ที่ยังรอดำเนินการไม่บล็อกการอ่าน; รีลีสที่เป็นอันตรายอาจยังถูกระงับไว้ที่อื่น
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่ที่เป็นเจ้าของได้

### `GET /api/v1/packages/{name}/download`

ดาวน์โหลดไฟล์ ZIP แบบกำหนดแน่นอนดั้งเดิมสำหรับรีลีสแพ็กเกจ

พารามิเตอร์คำค้น:

- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือรีลีสล่าสุด
- Skills เปลี่ยนเส้นทางไปยัง `GET /api/v1/download`
- คลัง Plugin/แพ็กเกจเป็นไฟล์ zip ที่มีราก `package/` เพื่อให้ไคลเอนต์ OpenClaw
  รุ่นเก่ายังคงทำงานได้
- เส้นทางนี้คงไว้เฉพาะ ZIP เท่านั้น และไม่สตรีมไฟล์ ClawPack `.tgz`
- การตอบกลับมีส่วนหัว `ETag`, `Digest`, `X-ClawHub-Artifact-Type` และ
  `X-ClawHub-Artifact-Sha256` สำหรับการตรวจสอบความถูกต้องของตัวแก้ค่า
- เมตาดาต้าที่มีเฉพาะในรีจิสทรีจะไม่ถูกฉีดเข้าไปในคลังที่ดาวน์โหลด
- การสแกน VirusTotal ที่ยังรอดำเนินการไม่บล็อกการดาวน์โหลด; รีลีสที่เป็นอันตรายส่งคืน `403`
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะเป็นเจ้าของ

### `GET /api/npm/{package}`

ส่งคืน packument ที่เข้ากันได้กับ npm สำหรับเวอร์ชันแพ็กเกจที่รองรับด้วย ClawPack

หมายเหตุ:

- แสดงเฉพาะเวอร์ชันที่มีการอัปโหลดทาร์บอล ClawPack npm-pack แล้ว
- เวอร์ชันดั้งเดิมที่มีเฉพาะ ZIP ถูกละไว้โดยตั้งใจ
- `dist.tarball`, `dist.integrity` และ `dist.shasum` ใช้ฟิลด์ที่เข้ากันได้กับ npm
  เพื่อให้ผู้ใช้ชี้ npm ไปยังมิเรอร์ได้หากต้องการ
- packument ของแพ็กเกจแบบมี scope รองรับทั้ง `/api/npm/@scope/name` และเส้นทางคำขอ
  แบบเข้ารหัสของ npm `/api/npm/@scope%2Fname`

### `GET /api/npm/{package}/-/{tarball}.tgz`

สตรีมไบต์ของทาร์บอล ClawPack ที่อัปโหลดไว้จริงสำหรับไคลเอนต์มิเรอร์ npm

หมายเหตุ:

- ใช้บักเก็ตอัตราการดาวน์โหลด
- ส่วนหัวการดาวน์โหลดมี SHA-256 ของ ClawHub พร้อมเมตาดาต้า integrity/shasum ของ npm
- การกลั่นกรองและการตรวจสอบการเข้าถึงแพ็กเกจส่วนตัวยังคงมีผล

### `GET /api/v1/resolve`

ใช้โดย CLI เพื่อจับคู่ลายนิ้วมือภายในเครื่องกับเวอร์ชันที่รู้จัก

พารามิเตอร์คำค้น:

- `slug` (ต้องระบุ)
- `hash` (ต้องระบุ): sha256 แบบเลขฐานสิบหก 64 อักขระของลายนิ้วมือบันเดิล

การตอบกลับ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ดาวน์โหลด ZIP ของเวอร์ชัน skill ที่โฮสต์ไว้ หรือส่งคืนการส่งต่อไปยังซอร์ส GitHub สำหรับ
skill ปัจจุบันที่รองรับด้วย GitHub ซึ่งมีการสแกน `clean` หรือ `suspicious` และไม่มี
เวอร์ชันที่โฮสต์ไว้

พารามิเตอร์คำค้น:

- `slug` (ต้องระบุ)
- `version` (ไม่บังคับ): สตริง semver
- `tag` (ไม่บังคับ): ชื่อแท็ก (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- เวอร์ชันที่ถูกลบแบบ soft-delete ส่งคืน `410`
- การส่งต่อ skill ที่รองรับด้วย GitHub จะไม่พร็อกซีหรือมิเรอร์ไบต์ การตอบกลับ JSON
  มี `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  และ `archiveUrl`; สถานะการสแกน/ปัจจุบันเป็นด่านตรวจและไม่รวมอยู่เป็นเมตาดาต้า payload
  ของความสำเร็จ
- สถิติการดาวน์โหลดนับเป็นตัวตนที่ไม่ซ้ำต่อวัน UTC (`userId` เมื่อโทเค็น API ถูกต้อง มิฉะนั้นใช้ IP)

## ปลายทางการยืนยันตัวตน (Bearer token)

ปลายทางทั้งหมดต้องมี:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

ตรวจสอบโทเค็นและส่งคืน handle ของผู้ใช้

### `POST /api/v1/skills`

เผยแพร่เวอร์ชันใหม่

- แนะนำ: `multipart/form-data` พร้อม JSON `payload` + blob `files[]`
- รองรับ body แบบ JSON ที่มี `files` (อิง `storageId`) ด้วย
- ฟิลด์ payload ที่ไม่บังคับ: `ownerHandle` เมื่อมีอยู่ API จะ resolve
  ผู้เผยแพร่นั้นฝั่งเซิร์ฟเวอร์และกำหนดให้ผู้กระทำมีสิทธิ์เข้าถึงผู้เผยแพร่
- ฟิลด์ payload ที่ไม่บังคับ: `migrateOwner` เมื่อเป็น `true` พร้อม `ownerHandle`
  skill ที่มีอยู่สามารถย้ายไปยังเจ้าของนั้นได้ หากผู้กระทำเป็นผู้ดูแลระบบ/เจ้าของทั้งบน
  ผู้เผยแพร่ปัจจุบันและเป้าหมาย หากไม่มีการเลือกใช้นี้ การเปลี่ยนเจ้าของจะถูกปฏิเสธ

### `POST /api/v1/packages`

เผยแพร่รีลีส code-plugin หรือ bundle-plugin

- ต้องใช้การยืนยันตัวตนด้วย Bearer token
- ต้องใช้ `multipart/form-data`
- ฟิลด์ฟอร์มที่อนุญาตคือ `payload`, blob `files` ซ้ำหลายรายการ หรือการอ้างอิงทาร์บอล
  `clawpack` หนึ่งรายการ `clawpack` อาจเป็น blob `.tgz` หรือรหัส storage ที่ส่งคืนโดย
  โฟลว์ upload-url การเผยแพร่ด้วย storage-id ที่ staging ไว้ต้องมี
  `clawpackUploadTicket` ที่ส่งคืนมาพร้อม URL อัปโหลดนั้นด้วย
- ใช้ `files` หรือ `clawpack` อย่างใดอย่างหนึ่งเท่านั้น ห้ามใช้ทั้งคู่ในคำขอเดียวกัน
- body แบบ JSON และเมตาดาต้า `payload.files` / `payload.artifact`
  ที่ผู้เรียกส่งมาเองจะถูกปฏิเสธ
- คำขอเผยแพร่ multipart โดยตรงถูกจำกัดไว้ที่ 18MB ทาร์บอล ClawPack อาจ
  ใช้โฟลว์ upload-url ได้ถึงขีดจำกัดทาร์บอล 120MB
- ฟิลด์ payload ที่ไม่บังคับ: `ownerHandle` เมื่อมีอยู่ เฉพาะผู้ดูแลระบบเท่านั้นที่เผยแพร่ในนามเจ้าของนั้นได้

จุดสำคัญในการตรวจสอบความถูกต้อง:

- `family` ต้องเป็น `code-plugin` หรือ `bundle-plugin`
- แพ็กเกจ Plugin ต้องมี `openclaw.plugin.json` การอัปโหลด ClawPack `.tgz` ต้อง
  มีไฟล์นี้ที่ `package/openclaw.plugin.json`
- code plugins ต้องมี `package.json`, เมตาดาต้า repo ซอร์ส, เมตาดาต้า commit
  ซอร์ส, เมตาดาต้า config schema, `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion`
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมตาดาต้าที่ไม่บังคับ
- เฉพาะผู้เผยแพร่องค์กร `openclaw` และผู้เผยแพร่ส่วนบุคคลของสมาชิกองค์กร `openclaw`
  ปัจจุบันเท่านั้นที่เผยแพร่ไปยังช่องทาง `official` ได้
- การเผยแพร่ในนามผู้อื่นยังคงตรวจสอบสิทธิ์ความเหมาะสมสำหรับช่องทางทางการกับบัญชีเจ้าของเป้าหมาย

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

ลบแบบ soft-delete / กู้คืน skill (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)

body แบบ JSON ที่ไม่บังคับ:

```json
{ "reason": "Held for moderation pending legal review." }
```

เมื่อมีอยู่ `reason` จะถูกจัดเก็บเป็นหมายเหตุการกลั่นกรอง skill และคัดลอกไปยังบันทึกการตรวจสอบ
การลบแบบ soft delete ที่เริ่มโดยเจ้าของจะสงวน slug ไว้ 30 วัน จากนั้น slug จะถูกอ้างสิทธิ์โดย
ผู้เผยแพร่รายอื่นได้ การตอบกลับการลบมี `slugReservedUntil` เมื่อมีการหมดอายุนี้
การซ่อนโดยผู้ดูแล/ผู้ดูแลระบบและการลบเพื่อความปลอดภัยจะไม่หมดอายุด้วยวิธีนี้

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

เฉพาะผู้ดูแลระบบเท่านั้น ตรวจสอบให้แน่ใจว่ามีผู้เผยแพร่องค์กรสำหรับ handle หาก handle ยังชี้ไปที่
ผู้ใช้/ผู้เผยแพร่ส่วนบุคคลแบบแชร์ดั้งเดิม ปลายทางจะย้ายเข้าเป็นผู้เผยแพร่องค์กรก่อน
สำหรับองค์กรที่สร้างใหม่ ให้ระบุ `memberHandle`; ผู้ดูแลระบบที่ดำเนินการจะไม่ถูกเพิ่มเป็นสมาชิก
`memberRole` มีค่าเริ่มต้นเป็น `owner`

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

การสร้างผู้เผยแพร่องค์กรแบบบริการตนเองที่ต้องยืนยันตัวตน สร้างผู้เผยแพร่องค์กรใหม่และเพิ่ม
ผู้เรียกเป็นเจ้าของ ปลายทางนี้จะไม่ย้าย handle ของผู้ใช้/ส่วนบุคคลที่มีอยู่ และจะ
ไม่ทำเครื่องหมายผู้เผยแพร่ว่า trusted/official

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- ส่งคืน `409` เมื่อ handle ถูกใช้แล้วโดยผู้เผยแพร่ ผู้ใช้ หรือผู้เผยแพร่ส่วนบุคคล

### `POST /api/v1/users/reserve`

เฉพาะผู้ดูแลระบบเท่านั้น สงวน root slug และชื่อแพ็กเกจให้เจ้าของที่ชอบธรรมโดยไม่เผยแพร่
รีลีส ชื่อแพ็กเกจจะกลายเป็นแพ็กเกจ placeholder ส่วนตัวที่ไม่มีแถวรีลีส เพื่อให้เจ้าของเดิม
เผยแพร่รีลีส code-plugin หรือ bundle-plugin จริงลงในชื่อนั้นได้ภายหลัง

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

เฉพาะผู้ดูแลระบบเท่านั้น กู้คืนผู้เผยแพร่ส่วนบุคคลสำหรับ GitHub OAuth principal ทดแทนที่ตรวจสอบแล้ว
โดยไม่แก้ไขแถวบัญชี Convex Auth คำขอต้องระบุรหัสบัญชีผู้ให้บริการ GitHub
แบบแก้ไขไม่ได้ทั้งสองรายการ; handle ที่แก้ไขได้ใช้เป็นตัวป้องกันสำหรับผู้ปฏิบัติงานเท่านั้น

ปลายทางมีค่าเริ่มต้นเป็นการรันแบบ dry-run การใช้การกู้คืนจริงต้องกำหนด `dryRun: false` และ
`confirmIdentityVerified: true` หลังจากเจ้าหน้าที่ตรวจสอบความต่อเนื่องระหว่าง
GitHub principals ทั้งสองอย่างอิสระแล้ว การกู้คืนจะล้มเหลวแบบปิดเมื่อผู้เผยแพร่ส่วนบุคคลปัจจุบันของผู้ใช้ปลายทาง
มี skills, packages หรือแหล่งที่มา GitHub skill
การกู้คืนยังย้ายฟิลด์ `ownerUserId` แบบเดิมสำหรับ skills ของผู้เผยแพร่ที่กู้คืนแล้ว,
นามแฝง slug ของ skill, packages, คำเตือน package inspector และแถว digest การค้นหาที่ได้มา เพื่อให้
เส้นทางเจ้าของโดยตรงตรงกับอำนาจผู้เผยแพร่ใหม่ การจอง protected-handle ที่ใช้งานอยู่
สำหรับ handle ที่กู้คืนแล้วจะถูกกำหนดใหม่ให้กับผู้ใช้ทดแทนด้วย เพื่อให้การซิงโครไนซ์
โปรไฟล์ภายหลังไม่สามารถกู้คืนอำนาจที่แข่งขันกันของผู้ใช้เดิมได้ ตารางหลักแต่ละตารางถูกจำกัดไว้ที่
100 แถวต่อธุรกรรม apply; การกู้คืนที่ใหญ่กว่านั้นต้องใช้การย้ายเจ้าของแบบดำเนินต่อได้ก่อน
แหล่งที่มา GitHub skill มีขอบเขตตามผู้เผยแพร่และถูกรายงานว่าตรวจสอบแล้วแทนที่จะถูกเขียนใหม่

- เนื้อหา: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- การตอบกลับ: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### ปลายทางการจัดการ slug ของเจ้าของ

- `POST /api/v1/skills/{slug}/rename`
  - เนื้อหา: `{ "newSlug": "new-canonical-slug" }`
  - การตอบกลับ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - เนื้อหา: `{ "targetSlug": "canonical-target-slug" }`
  - การตอบกลับ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

หมายเหตุ:

- ปลายทางทั้งสองต้องใช้การยืนยันตัวตนด้วยโทเค็น API และใช้งานได้เฉพาะกับเจ้าของ skill เท่านั้น
- `rename` เก็บ slug ก่อนหน้าไว้เป็นนามแฝงสำหรับเปลี่ยนเส้นทาง
- `merge` ซ่อนรายการต้นทางและเปลี่ยนเส้นทาง slug ต้นทางไปยังรายการเป้าหมาย

### ปลายทางการโอนความเป็นเจ้าของ

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

แบนผู้ใช้และลบ skills ที่เป็นเจ้าของแบบถาวร (เฉพาะ moderator/admin)

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

ยกเลิกการแบนผู้ใช้และกู้คืน skills ที่เข้าเกณฑ์ (เฉพาะ admin)

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

เปลี่ยนเหตุผลที่จัดเก็บไว้สำหรับการแบนที่มีอยู่โดยไม่ยกเลิกการแบนหรือกู้คืน
เนื้อหา (เฉพาะ admin) ค่าเริ่มต้นเป็น dry-run เว้นแต่ `dryRun` เป็น `false`

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

เปลี่ยนบทบาทผู้ใช้ (เฉพาะ admin)

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

แสดงรายการหรือค้นหาผู้ใช้ (เฉพาะ admin)

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

เพิ่ม/ลบดาว (ไฮไลต์) ปลายทางทั้งสองเป็นแบบ idempotent

การตอบกลับ:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## ปลายทาง CLI เดิม (เลิกใช้แล้ว)

ยังรองรับสำหรับ CLI เวอร์ชันเก่า:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

ดูแผนการนำออกได้ใน `DEPRECATIONS.md`

`POST /api/cli/upload-url` ส่งคืน `uploadUrl` และ `uploadTicket` การเผยแพร่ package
ที่ stage ไฟล์ tarball ของ ClawPack ต้องส่ง id ของ storage ที่ได้เป็น
`clawpack` และ ticket ที่ส่งคืนเป็น `clawpackUploadTicket`

## การค้นพบ registry (`/.well-known/clawhub.json`)

CLI สามารถค้นพบการตั้งค่า registry/auth จากไซต์ได้:

- `/.well-known/clawhub.json` (JSON, แนะนำ)
- `/.well-known/clawdhub.json` (เดิม)

สคีมา:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

หากคุณโฮสต์เอง ให้ให้บริการไฟล์นี้ (หรือตั้งค่า `CLAWHUB_REGISTRY` อย่างชัดเจน; `CLAWDHUB_REGISTRY` แบบเดิม)
