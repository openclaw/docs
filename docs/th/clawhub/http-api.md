---
read_when:
    - การเพิ่ม/เปลี่ยนแปลง endpoint
    - การดีบักคำขอ CLI ↔ รีจิสทรี
summary: เอกสารอ้างอิง HTTP API (ปลายทางสาธารณะ + ปลายทาง CLI + การยืนยันตัวตน)
x-i18n:
    generated_at: "2026-07-05T08:51:00Z"
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
พาธเดิม `/api/...` และ `/api/cli/...` ยังคงอยู่เพื่อความเข้ากันได้ (ดู `DEPRECATIONS.md`)
OpenAPI: `/api/v1/openapi.json`

## การนำแคตตาล็อกสาธารณะกลับมาใช้

ไดเรกทอรีของบุคคลที่สามอาจใช้ endpoint แบบอ่านสาธารณะเพื่อแสดงรายการหรือค้นหา Skills ของ ClawHub ได้ โปรดแคชผลลัพธ์ เคารพ `429`/`Retry-After` ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ต้นทางที่เป็นทางการ (`https://clawhub.ai/<owner>/skills/<slug>`) และหลีกเลี่ยงการสื่อว่า ClawHub รับรองเว็บไซต์บุคคลที่สามนั้น ห้ามพยายามทำสำเนาเนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกโดยการกลั่นกรองออกนอกพื้นผิว API สาธารณะ

ทางลัด Web slug จะ resolve ข้ามตระกูล registry แต่ไคลเอนต์ API ควรใช้
URL ต้นทางที่เป็นทางการซึ่ง endpoint แบบอ่านส่งกลับ แทนการสร้างลำดับความสำคัญของ route
ขึ้นใหม่เอง

## ขีดจำกัดอัตรา

รูปแบบการบังคับใช้:

- คำขอแบบไม่ระบุตัวตน: บังคับใช้ต่อ IP
- คำขอที่ยืนยันตัวตนแล้ว (Bearer token ที่ถูกต้อง): บังคับใช้ต่อ bucket ของผู้ใช้
- หาก token หายไป/ไม่ถูกต้อง พฤติกรรมจะ fallback ไปใช้การบังคับใช้ตาม IP
- endpoint แบบเขียนที่ยืนยันตัวตนแล้วไม่ควรส่งกลับเพียง `Unauthorized` แบบเปล่า ๆ เมื่อ
  เซิร์ฟเวอร์รู้เหตุผล token ที่ขาดหาย token ที่ไม่ถูกต้อง/ถูกเพิกถอน และ
  บัญชีที่ถูกลบ/ถูกแบน/ถูกปิดใช้งาน ควรได้ข้อความที่นำไปดำเนินการได้ เพื่อให้ไคลเอนต์
  CLI บอกผู้ใช้ได้ว่าอะไรบล็อกพวกเขา

- อ่าน: 3000/นาที ต่อ IP, 12000/นาที ต่อ key
- เขียน: 300/นาที ต่อ IP, 3000/นาที ต่อ key
- ดาวน์โหลด: 1200/นาที ต่อ IP, 6000/นาที ต่อ key (endpoint ดาวน์โหลด)

Headers:

- ความเข้ากันได้แบบเดิม: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- แบบมาตรฐาน: `RateLimit-Limit`, `RateLimit-Reset`
- เมื่อเป็น `429`: `X-RateLimit-Remaining: 0` และ `RateLimit-Remaining: 0`
- เมื่อเป็น `429`: `Retry-After`

ความหมายของ Header:

- `X-RateLimit-Reset`: วินาทีแบบ Unix epoch สัมบูรณ์
- `RateLimit-Reset`: จำนวนวินาทีจนกว่าจะ reset (delay)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: งบประมาณที่เหลือแบบแน่นอนเมื่อมีอยู่
  คำขอที่สำเร็จแบบ sharded จะละเว้น header นี้ แทนการส่งค่ารวมทั่วระบบแบบประมาณกลับมา
- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อน retry (delay) เมื่อเป็น `429`

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

- หากมี `Retry-After` ให้รอจำนวนวินาทีนั้นก่อน retry
- ใช้ backoff แบบมี jitter เพื่อหลีกเลี่ยงการ retry พร้อมกัน
- หากไม่มี `Retry-After` ให้ fallback ไปใช้ `RateLimit-Reset` (หรือคำนวณจาก `X-RateLimit-Reset`)

แหล่งที่มาของ IP:

- ใช้ trusted client IP headers รวมถึง `cf-connecting-ip` เฉพาะเมื่อ
  การ deploy เปิดใช้งาน trusted forwarded headers อย่างชัดเจน
- ClawHub ใช้ trusted forwarding headers เพื่อระบุ IP ของไคลเอนต์ที่ edge
- หากไม่มี trusted client IP คำขอแบบไม่ระบุตัวตนจะใช้ bucket สำรอง
  ที่ scoped ตามชนิดของ rate-limit เท่านั้น bucket สำรองเหล่านี้ไม่รวม
  path, slug, ชื่อ package, version, query string หรือพารามิเตอร์ artifact อื่น ๆ
  ที่ผู้เรียกส่งมา

## การตอบกลับข้อผิดพลาด

การตอบกลับข้อผิดพลาด v1 สาธารณะเป็นข้อความล้วนพร้อม `content-type: text/plain; charset=utf-8`
ซึ่งรวมถึงการตรวจสอบข้อมูลไม่ผ่าน (`400`), ทรัพยากรสาธารณะที่หายไป (`404`), ความล้มเหลวด้าน auth และ
permission (`401`/`403`), ขีดจำกัดอัตรา (`429`) และการดาวน์โหลดที่ถูกบล็อก ไคลเอนต์
ควรอ่านข้อความใน response body เป็นสตริงที่มนุษย์อ่านได้ พารามิเตอร์ query ที่ไม่รู้จักจะถูก
ละเว้นเพื่อความเข้ากันได้ แต่พารามิเตอร์ query ที่รู้จักและมีค่าไม่ถูกต้องจะส่งกลับ
`400`

## Endpoint สาธารณะ (ไม่ต้อง auth)

### `GET /api/v1/search`

พารามิเตอร์ Query:

- `q` (จำเป็น): สตริง query
- `limit` (ไม่บังคับ): จำนวนเต็ม
- `highlightedOnly` (ไม่บังคับ): `true` เพื่อกรองให้เหลือเฉพาะ Skills ที่ถูกเน้น
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias เดิมสำหรับ `nonSuspiciousOnly`

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

- ผลลัพธ์จะถูกส่งกลับตามลำดับความเกี่ยวข้อง (embedding similarity + การ boost token ของ slug/name ที่ตรงแบบ exact + popularity prior เล็กน้อย)
- ความเกี่ยวข้องมีน้ำหนักมากกว่าความนิยม token ของ slug หรือ display-name ที่ตรงอย่างแม่นยำสามารถอยู่เหนือผลลัพธ์ที่ตรงแบบหลวมกว่าแม้มี engagement สูงกว่ามาก
- ข้อความ ASCII จะถูกแบ่ง token ตามขอบเขตคำและเครื่องหมายวรรคตอน ตัวอย่างเช่น `personal-map` มี token `map` แบบ standalone ขณะที่ `amap-jsapi-skill` มี `amap`, `jsapi` และ `skill`; ดังนั้นการค้นหา `map` จึงทำให้ `personal-map` มี lexical match ที่แรงกว่า `amap-jsapi-skill`
- ความนิยมถูกปรับแบบ log-scaled และมีเพดาน Skills ที่มี engagement สูงอาจจัดอันดับต่ำกว่าเมื่อข้อความ query ตรงกันอ่อนกว่า
- สถานะการกลั่นกรองที่น่าสงสัยหรือถูกซ่อนสามารถนำ Skill ออกจากการค้นหาสาธารณะได้ ขึ้นอยู่กับตัวกรองของผู้เรียกและสถานะการกลั่นกรองปัจจุบัน

คำแนะนำด้านการค้นพบสำหรับผู้เผยแพร่:

- ใส่คำที่ผู้ใช้จะค้นหาจริง ๆ ไว้ใน display name, summary และ tags ใช้ token slug แบบ standalone เฉพาะเมื่อมันเป็นตัวตนที่เสถียรซึ่งคุณต้องการเก็บไว้ด้วย
- อย่าเปลี่ยนชื่อ slug เพียงเพื่อไล่ตาม query เดียว เว้นแต่ slug ใหม่จะเป็นชื่อ canonical ระยะยาวที่ดีกว่า slug เก่าจะกลายเป็น redirect aliases แต่ URL canonical, slug ที่แสดง และ digest การค้นหาในอนาคตจะใช้ slug ใหม่
- Rename aliases จะรักษาการ resolve สำหรับ URL เก่าและการติดตั้งที่ resolve ผ่าน registry แต่การจัดอันดับค้นหาจะอิงจาก metadata ของ Skill canonical หลังจากการ rename ถูกจัดทำดัชนีแล้ว สถิติที่มีอยู่จะยังคงอยู่กับ Skill
- หาก Skill หายไปอย่างไม่คาดคิด ให้ตรวจสอบสถานะการกลั่นกรองก่อนด้วย `clawhub inspect @owner/slug` ขณะเข้าสู่ระบบ ก่อนเปลี่ยน metadata ที่เกี่ยวข้องกับการจัดอันดับ

### `GET /api/v1/skills`

พารามิเตอร์ Query:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–200)
- `cursor` (ไม่บังคับ): cursor สำหรับ pagination สำหรับ sort ใด ๆ ที่ไม่ใช่ `trending`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), alias การติดตั้งแบบเดิม `installsCurrent`/`installs`/`installsAllTime` map ไปที่ `downloads`, `trending`
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias เดิมสำหรับ `nonSuspiciousOnly`

ค่า `sort` ที่ไม่ถูกต้องจะส่งกลับ `400`

หมายเหตุ:

- `recommended` ใช้สัญญาณ engagement และ recency
- `trending` จัดอันดับตามการติดตั้งในช่วง 7 วันที่ผ่านมา (อิง telemetry)
- `createdAt` เสถียรสำหรับการ crawl Skill ใหม่; `updated` จะเปลี่ยนเมื่อ Skill ที่มีอยู่ถูกเผยแพร่ซ้ำ
- เมื่อ `nonSuspiciousOnly=true` การ sort แบบใช้ cursor อาจส่งกลับรายการน้อยกว่า `limit` ในหนึ่งหน้า เพราะ Skills ที่น่าสงสัยถูกกรองหลังจากดึงหน้าแล้ว
- ใช้ `nextCursor` เพื่อทำ pagination ต่อเมื่อมีอยู่ หน้าสั้นไม่ได้หมายความว่าเป็นจุดสิ้นสุดของผลลัพธ์โดยตัวมันเอง

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

- slug เก่าที่สร้างโดย flow การ rename/merge ของ owner จะ resolve ไปยัง Skill canonical
- `metadata.os`: ข้อจำกัด OS ที่ประกาศใน frontmatter ของ Skill (เช่น `["macos"]`, `["linux"]`) `null` หากไม่ได้ประกาศ
- `metadata.systems`: เป้าหมายระบบ Nix (เช่น `["aarch64-darwin", "x86_64-linux"]`) `null` หากไม่ได้ประกาศ
- `metadata` เป็น `null` หาก Skill ไม่มี platform metadata
- `moderation` จะถูกรวมไว้เฉพาะเมื่อ Skill ถูก flag หรือ owner กำลังดูอยู่

### `GET /api/v1/skills/{slug}/moderation`

ส่งกลับสถานะการกลั่นกรองแบบมีโครงสร้าง

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

- Owners และ moderators สามารถเข้าถึงรายละเอียดการกลั่นกรองสำหรับ Skills ที่ซ่อนอยู่ได้
- ผู้เรียกสาธารณะจะได้ `200` เฉพาะสำหรับ Skills ที่มองเห็นได้และถูก flag แล้ว
- Evidence จะถูก redacted สำหรับผู้เรียกสาธารณะ และรวม raw snippets เฉพาะสำหรับ owners/moderators เท่านั้น

### `POST /api/v1/skills/{slug}/report`

รายงาน Skill เพื่อให้ moderator ตรวจสอบ รายงานอยู่ระดับ Skill และอาจลิงก์
กับ version ได้ และจะป้อนเข้าสู่คิวรายงาน Skill

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

Endpoint สำหรับ moderator/admin เพื่อรับรายงาน Skill

พารามิเตอร์ Query:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `confirmed`, `dismissed` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-200)
- `cursor` (ไม่บังคับ): cursor สำหรับ pagination

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

Endpoint สำหรับ moderator/admin เพื่อ resolve หรือเปิดรายงาน Skill อีกครั้ง

Request:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

ต้องมี `note` สำหรับ `confirmed` และ `dismissed`; อาจละเว้นได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "hide"` พร้อมรายงานที่ triaged แล้ว
เพื่อซ่อน Skill ใน workflow เดียวกันที่ตรวจสอบย้อนหลังได้

### `GET /api/v1/skills/{slug}/versions`

พารามิเตอร์ Query:

- `limit` (ไม่บังคับ): จำนวนเต็ม
- `cursor` (ไม่บังคับ): cursor สำหรับ pagination

### `GET /api/v1/skills/{slug}/versions/{version}`

ส่งกลับ version metadata + รายการไฟล์

- `version.security` รวมสถานะการตรวจสอบ scan ที่ normalize แล้วและรายละเอียด scanner
  (VirusTotal + LLM) เมื่อมี

### `GET /api/v1/skills/{slug}/scan`

ส่งกลับรายละเอียดการตรวจสอบ security scan สำหรับ version ของ Skill

พารามิเตอร์ Query:

- `version` (ไม่บังคับ): สตริง version เฉพาะ
- `tag` (ไม่บังคับ): resolve version ที่ถูก tag (ตัวอย่างเช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- รวมสถานะการตรวจสอบที่ปรับให้อยู่ในรูปแบบมาตรฐาน พร้อมรายละเอียดเฉพาะของสแกนเนอร์
- `security.hasScanResult` เป็น `true` เฉพาะเมื่อสแกนเนอร์ให้คำตัดสินที่ชัดเจน (`clean`, `suspicious` หรือ `malicious`)
- `moderation` คือสแนปช็อตการตรวจสอบระดับ Skills ปัจจุบันที่ได้มาจากเวอร์ชันล่าสุด
- เมื่อค้นหาเวอร์ชันในอดีต ให้ตรวจสอบ `moderation.matchesRequestedVersion` และ `moderation.sourceVersion` ก่อนถือว่า `moderation` และ `security` อยู่ในบริบทเวอร์ชันเดียวกัน

### `POST /api/v1/skills/-/scan`

ปลายทางส่งงานที่ต้องยืนยันตัวตนสำหรับงาน ClawScan ใหม่

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
- การสแกนที่เผยแพร่แล้วต้องมีสิทธิ์จัดการของเจ้าของ/ผู้เผยแพร่ หรือสิทธิ์ผู้ตรวจสอบ/ผู้ดูแลแพลตฟอร์ม
- การสแกนที่เผยแพร่แล้วจะเขียนกลับเฉพาะเมื่อ `update: true` และการสแกนเสร็จสมบูรณ์สำเร็จ
- การตอบกลับคือ `202` พร้อม `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`
- งานสแกนเป็นแบบอะซิงโครนัส คำขอสแกนด้วยตนเองจะได้รับลำดับความสำคัญก่อนงานเผยแพร่/เติมย้อนหลังปกติ แต่การเสร็จสมบูรณ์ยังขึ้นอยู่กับความพร้อมของเวิร์กเกอร์

### `GET /api/v1/skills/-/scan/{scanId}`

ปลายทางโพลที่ต้องยืนยันตัวตนสำหรับสแกนที่ส่งแล้ว

- คืนค่าสถานะ queued/running/succeeded/failed
- คืนค่า `queue.queuedAhead` และ `queue.position` ระหว่างอยู่ในคิว เพื่อให้ไคลเอนต์แสดงจำนวนสแกนด้วยตนเองที่มีลำดับความสำคัญและอยู่ก่อนหน้าคำขอได้ คิวที่ใหญ่มากจะถูกจำกัดขอบเขตและรายงานด้วย `queuedAheadIsEstimate: true`
- เมื่อมีข้อมูล `report` จะมีส่วน `clawscan`, `skillspector`, `staticAnalysis` และ `virustotal`
- งานสแกนที่ล้มเหลวจะคืนค่า `status: "failed"` พร้อม `lastError`

### `GET /api/v1/skills/-/scan/{scanId}/download`

ปลายทางคลังรายงานที่ต้องยืนยันตัวตน

- ต้องเป็นสแกนที่สำเร็จแล้ว สแกนที่ยังไม่สิ้นสุดจะคืนค่า `409`
- คืนค่า ZIP ที่มี `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

ปลายทางคลังรายงานที่จัดเก็บไว้ซึ่งต้องยืนยันตัวตนสำหรับเวอร์ชันที่ส่งแล้ว

- ต้องมีสิทธิ์จัดการของเจ้าของ/ผู้เผยแพร่สำหรับ Skills หรือ Plugin หรือสิทธิ์ผู้ตรวจสอบ/ผู้ดูแลแพลตฟอร์ม
- คืนค่าผลลัพธ์การสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งมาแบบตรงกันทุกประการ รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อนไว้
- `kind` มีค่าเริ่มต้นเป็น `skill`; ใช้ `kind=plugin` สำหรับการสแกน Plugin/แพ็กเกจ
- คืนค่า ZIP รูปแบบเดียวกับการดาวน์โหลดคำขอสแกน

### `POST /api/v1/skills/-/scan/batch`

เส้นทางสแกนซ้ำแบบชุดตามรูปแบบมาตรฐานสำหรับผู้ดูแลเท่านั้น รับเพย์โหลดรูปแบบเดียวกับ `POST /api/v1/skills/-/rescan-batch` แบบเดิม

### `POST /api/v1/skills/-/scan/batch/status`

เส้นทางสถานะแบบชุดตามรูปแบบมาตรฐานสำหรับผู้ดูแลเท่านั้น รับ `{ "jobIds": ["..."] }` และคืนค่าตัวนับรวมแบบเดียวกับ `POST /api/v1/skills/-/rescan-batch/status` แบบเดิม

### `GET /api/v1/skills/{slug}/verify`

คืนค่าซองการตรวจสอบ Skill Card ที่ `clawhub skill verify` ใช้

พารามิเตอร์คำค้นหา:

- `version` (ไม่บังคับ): สตริงเวอร์ชันเฉพาะ
- `tag` (ไม่บังคับ): แก้ค่าเป็นเวอร์ชันที่ติดแท็กไว้ (เช่น `latest`)

หมายเหตุ:

- `ok` เป็น `true` เฉพาะเมื่อเวอร์ชันที่เลือกมี Skill Card ที่สร้างแล้ว ไม่ได้ถูกบล็อกเป็นมัลแวร์โดยการตรวจสอบ และการตรวจสอบ ClawScan เป็น clean
- ข้อมูลประจำตัวของ Skills, ข้อมูลประจำตัวของผู้เผยแพร่ และเมทาดาทาของเวอร์ชันที่เลือกเป็นฟิลด์ระดับบนสุดของซอง (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) เพื่อให้อัตโนมัติของเชลล์อ่านได้โดยไม่ต้องแกะตัวห่อที่ซ้อนอยู่
- `security` คือคำตัดสิน ClawScan/ความปลอดภัยระดับบนสุด งานอัตโนมัติควรอ้างอิงจาก `ok`, `decision`, `reasons` และ `security.status`
- `security.signals` มีหลักฐานสแกนเนอร์ประกอบ เช่น `staticScan`, `virusTotal` และ `skillSpector`
- `security.signals.dependencyRegistry` ถูกเก็บไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่สแกนเนอร์ตรวจสอบการมีอยู่ของทะเบียนดีเพนเดนซีถูกเลิกใช้แล้ว และคีย์นี้จะเป็น `null` เสมอ
- `provenance` เป็น `server-resolved-github-import` เฉพาะเมื่อ ClawHub แก้ค่าและจัดเก็บ repo/ref/commit/path ของ GitHub ระหว่างการเผยแพร่หรือนำเข้า มิฉะนั้นจะเป็น `unavailable`

### `POST /api/v1/skills/-/security-verdicts`

คืนค่าคำตัดสินความปลอดภัยแบบย่อปัจจุบันสำหรับเวอร์ชัน Skills ที่ตรงกันทุกประการ ปลายทางคอลเลกชันนี้มีไว้สำหรับไคลเอนต์ที่รู้อยู่แล้วว่าต้องแสดงเวอร์ชัน Skills ของ ClawHub ที่ติดตั้งใด เช่น OpenClaw Control UI

คำขอ:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

หมายเหตุ:

- `items` ต้องมีคู่ `{ slug, version }` ที่ไม่ซ้ำกัน 1-100 คู่
- ผลลัพธ์แยกตามรายการ Skills หรือเวอร์ชันที่หายไปหนึ่งรายการจะไม่ทำให้การตอบกลับทั้งหมดล้มเหลว
- การตอบกลับเป็นข้อมูลความปลอดภัยเท่านั้น ไม่รวมข้อมูล Skill Card, สถานะการ์ดที่สร้างแล้ว, รายการไฟล์อาร์ติแฟกต์ หรือเพย์โหลดสแกนเนอร์โดยละเอียด
- `security.signals` มีเฉพาะหลักฐานประกอบระดับสถานะเท่านั้น ใช้ `/scan` หรือหน้าตรวจสอบความปลอดภัยของ ClawHub สำหรับรายละเอียดสแกนเนอร์แบบเต็ม
- `security.signals.dependencyRegistry` ถูกเก็บไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่สแกนเนอร์ตรวจสอบการมีอยู่ของทะเบียนดีเพนเดนซีถูกเลิกใช้แล้ว และคีย์นี้จะเป็น `null` เสมอ
- การไม่มี Skill Card ไม่ส่งผลต่อ `ok`, `decision` หรือ `reasons` ของปลายทางนี้ ไคลเอนต์ควรอ่าน `skill-card.md` ที่ติดตั้งไว้ในเครื่องเมื่อจำเป็นต้องใช้เนื้อหาการ์ด
- ใช้ `/verify` เมื่อต้องการซองการตรวจสอบ Skill Card สำหรับ Skills เดียว, `/card` เมื่อต้องการมาร์กดาวน์การ์ดที่สร้างแล้ว และ `/scan` เมื่อต้องการข้อมูลสแกนเนอร์โดยละเอียด

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

พารามิเตอร์คำค้นหา:

- `path` (จำเป็น)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นเป็นเวอร์ชันล่าสุด
- ขีดจำกัดขนาดไฟล์: 200KB

### `GET /api/v1/packages`

ปลายทางแค็ตตาล็อกแบบรวมสำหรับ:

- Skills
- code plugins
- bundle plugins

พารามิเตอร์คำค้นหา:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended`, `trending`, `downloads`, นามแฝงเดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอจำกัดขอบเขตไปยังแพ็กเกจ Plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` หรือปลายทางแพ็กเกจที่มี
  `family=code-plugin`/`family=bundle-plugin`) หมวดหมู่ที่ควบคุมและ
  นามแฝงตัวกรอง v1 เดิมมีเอกสารอยู่ภายใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` หรือ `sort` จะส่งคืน `400` ระบบจะละเว้นพารามิเตอร์คำค้นหาที่ไม่รู้จัก
- `GET /api/v1/code-plugins` และ `GET /api/v1/bundle-plugins` ยังคงเป็นนามแฝงแบบ family คงที่
- รายการ Skill ยังคงมีข้อมูลรองรับจากรีจิสทรี Skill และยังเผยแพร่ได้ผ่าน `POST /api/v1/skills` เท่านั้น
- `POST /api/v1/packages` ยังคงใช้สำหรับการเผยแพร่ code-plugin และ bundle-plugin เท่านั้น
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถเห็นแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดอยู่ในผลลัพธ์รายการ/การค้นหา
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ผ่านการยืนยันตัวตนอ่านได้

### `GET /api/v1/packages/search`

การค้นหาแค็ตตาล็อกแบบรวมใน Skills + แพ็กเกจ Plugin

พารามิเตอร์คำค้นหา:

- `q` (จำเป็น): สตริงคำค้นหา
- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอจำกัดขอบเขตไปยังแพ็กเกจ Plugin หมวดหมู่ที่ควบคุมและนามแฝงตัวกรอง v1
  เดิมมีเอกสารอยู่ภายใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured` หรือ
  `highlightedOnly` จะส่งคืน `400` ระบบจะละเว้นพารามิเตอร์คำค้นหาที่ไม่รู้จัก
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถค้นหาแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดอยู่
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ผ่านการยืนยันตัวตนอ่านได้

### `GET /api/v1/plugins`

การเรียกดูแค็ตตาล็อกเฉพาะ Plugin ในแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์คำค้นหา:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `recommended` (ค่าเริ่มต้น), `trending`, `downloads`, `updated`, นามแฝงเดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

นามแฝงตัวกรอง v1 เดิมยังคงยอมรับในปลายทางการอ่าน:

- `mcp-tooling`, `data` และ `automation` จะแปลงเป็น `tools`
- `observability` และ `deployment` จะแปลงเป็น `gateway`
- `dev-tools` จะแปลงเป็น `runtime`

`trending` เป็นตารางอันดับการติดตั้ง/ดาวน์โหลดในรอบเจ็ดวัน และไม่ได้ใช้ยอดรวมตลอดกาล
ในปลายทางแบบรวม `/api/v1/packages` จะใช้กับ Plugin เท่านั้น ใช้
`/api/v1/skills?sort=trending` สำหรับแค็ตตาล็อก Skill

นามแฝงเดิมจะไม่ถูกยอมรับเป็นค่าหมวดหมู่ที่จัดเก็บหรือผู้เขียนประกาศไว้

### `GET /api/v1/skills/export`

การส่งออก Skills สาธารณะเวอร์ชันล่าสุดแบบกลุ่มสำหรับการวิเคราะห์แบบออฟไลน์

การยืนยันตัวตน:

- ต้องใช้โทเค็น API

พารามิเตอร์คำค้นหา:

- `startDate` (จำเป็น): ขอบเขตล่างในหน่วยมิลลิวินาที Unix สำหรับ `updatedAt` ของ Skill
- `endDate` (จำเป็น): ขอบเขตบนในหน่วยมิลลิวินาที Unix สำหรับ `updatedAt` ของ Skill
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าจากการตอบกลับก่อนหน้า

การตอบกลับ:

- เนื้อหา: ไฟล์ ZIP archive
- Skill ที่ส่งออกแต่ละรายการมีรากอยู่ที่ `{publisher}/{slug}/`
- Skills ที่โฮสต์ไว้จะรวมไฟล์เวอร์ชันล่าสุดที่จัดเก็บไว้และแสดงอยู่ใน
  `_manifest.json` พร้อม `sourceRef: "public-clawhub"`
- Skills ปัจจุบันที่มีแหล่งที่มาจาก GitHub พร้อมผลสแกน `clean` หรือ `suspicious` จะรวม
  `_source_handoff.json` พร้อม `sourceRef: "public-github"`, repo, commit, path,
  แฮชเนื้อหา และ URL ของ archive โดยจะไม่รวมไฟล์ต้นฉบับที่โฮสต์บน ClawHub
- Skill แต่ละรายการรวม `_export_skill_meta.json`
- `_manifest.json` จะถูกรวมไว้ที่รากของ ZIP เสมอ
- `_errors.json` จะถูกรวมไว้เมื่อไม่สามารถส่งออก Skills หรือไฟล์แต่ละรายการได้

ส่วนหัว:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

ส่งออกเป็นชุดของรุ่นเผยแพร่ Plugin สาธารณะล่าสุดสำหรับการวิเคราะห์แบบออฟไลน์

การยืนยันตัวตน:

- ต้องใช้โทเค็น API

พารามิเตอร์ Query:

- `startDate` (จำเป็น): ขอบเขตล่างเป็นมิลลิวินาที Unix สำหรับ `updatedAt` ของ Plugin
- `endDate` (จำเป็น): ขอบเขตบนเป็นมิลลิวินาที Unix สำหรับ `updatedAt` ของ Plugin
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าจากคำตอบก่อนหน้า
- `family` (ไม่บังคับ): `code-plugin` หรือ `bundle-plugin` หากละไว้หมายถึงทั้งสอง
  ตระกูล Plugin

คำตอบ:

- เนื้อหา: ไฟล์เก็บถาวร ZIP
- Plugin ที่ส่งออกแต่ละรายการมีรากอยู่ที่ `{family}/{packageName}/`
- Plugin ที่ส่งออกแต่ละรายการมีไฟล์ที่จัดเก็บไว้ของรุ่นเผยแพร่ล่าสุด
- เมตาดาทาการส่งออกต่อ Plugin จะถูกจัดเก็บที่
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

ค้นหาเฉพาะ Plugin ครอบคลุมแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์ Query:

- `q` (จำเป็น): สตริงคำค้นหา
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

หมายเหตุ:

- นามแฝงตัวกรอง v1 เดิมที่ระบุไว้ใต้ `GET /api/v1/plugins` ก็ยัง
  ยอมรับได้
- การกรองหมวดหมู่เป็นตัวกรอง API จริงที่รองรับด้วยแถว digest หมวดหมู่ Plugin
  ไม่ใช่การเขียนคำค้นหาใหม่
- ผลลัพธ์จะถูกส่งคืนตามลำดับความเกี่ยวข้อง และปัจจุบันยังไม่มีการแบ่งหน้า
- ตัวควบคุมการเรียงลำดับ UI เบราว์เซอร์สำหรับการค้นหา Plugin จะเรียงผลลัพธ์ความเกี่ยวข้องที่โหลดแล้วใหม่
  ให้ตรงกับพฤติกรรมการเรียกดู `/skills` ปัจจุบัน

### `GET /api/v1/packages/{name}`

ส่งคืนเมตาดาทารายละเอียดแพ็กเกจ

หมายเหตุ:

- Skills สามารถ resolve ผ่านเส้นทางนี้ในแคตตาล็อกรวมได้เช่นกัน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่เจ้าของได้

### `DELETE /api/v1/packages/{name}`

ลบแบบ soft-delete แพ็กเกจและรุ่นเผยแพร่ทั้งหมด

หมายเหตุ:

- ต้องใช้โทเค็น API สำหรับเจ้าของแพ็กเกจ เจ้าของ/ผู้ดูแลผู้เผยแพร่องค์กร
  ผู้ดูแลแพลตฟอร์ม หรือผู้ดูแลระบบแพลตฟอร์ม

### `GET /api/v1/packages/{name}/versions`

ส่งคืนประวัติเวอร์ชัน

พารามิเตอร์ Query:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

หมายเหตุ:

- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่เจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}`

ส่งคืนเวอร์ชันแพ็กเกจหนึ่งรายการ รวมถึงเมตาดาทาไฟล์ ความเข้ากันได้
การตรวจสอบยืนยัน เมตาดาทาอาร์ติแฟกต์ และข้อมูลการสแกน

หมายเหตุ:

- `version.artifact.kind` เป็น `legacy-zip` สำหรับไฟล์เก็บถาวรแพ็กเกจแบบเก่า หรือ
  `npm-pack` สำหรับรุ่นเผยแพร่ที่รองรับโดย ClawPack
- รุ่นเผยแพร่ ClawPack มีฟิลด์ที่เข้ากันได้กับ npm ได้แก่ `npmIntegrity`, `npmShasum` และ
  `npmTarballName`
- `version.sha256hash` เป็นเมตาดาทาความเข้ากันได้ที่เลิกแนะนำแล้วสำหรับไคลเอนต์เก่า โดย
  แฮชไบต์ ZIP ที่แน่นอนซึ่งส่งคืนโดย `/api/v1/packages/{name}/download`
  ไคลเอนต์สมัยใหม่ควรใช้ `version.artifact.sha256` ซึ่งระบุ
  อาร์ติแฟกต์รุ่นเผยแพร่มาตรฐาน
- `version.vtAnalysis`, `version.llmAnalysis` และ `version.staticScan` จะ
  ถูกรวมไว้เมื่อมีข้อมูลการสแกน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่เจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}/security`

ส่งคืนสรุปความปลอดภัยและความน่าเชื่อถือของรุ่นเผยแพร่แพ็กเกจที่แน่นอนสำหรับไคลเอนต์ติดตั้ง
นี่คือพื้นผิวการใช้งานสาธารณะของ OpenClaw สำหรับตัดสินใจว่า
รุ่นเผยแพร่ที่ resolve แล้วสามารถติดตั้งได้หรือไม่

การยืนยันตัวตน:

- ปลายทางอ่านแบบสาธารณะ ไม่ต้องใช้โทเค็นเจ้าของ ผู้เผยแพร่ ผู้ดูแล หรือผู้ดูแลระบบ

คำตอบ:

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

ฟิลด์คำตอบ:

- `package.name`, `package.displayName` และ `package.family` ระบุ
  แพ็กเกจรีจิสทรีที่ resolve แล้ว
- `release.releaseId`, `release.version` และ `release.createdAt` ระบุ
  รุ่นเผยแพร่ที่แน่นอนซึ่งถูกประเมิน
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` และ `release.npmTarballName` จะมีอยู่เมื่อทราบข้อมูลสำหรับ
  อาร์ติแฟกต์รุ่นเผยแพร่
- `trust.scanStatus` คือสถานะความน่าเชื่อถือที่มีผล ซึ่งได้มาจากอินพุตของสแกนเนอร์
  และการดูแลรุ่นเผยแพร่ด้วยตนเอง
- `trust.moderationState` เป็น nullable โดยเป็น `null` เมื่อไม่มี
  การดูแลรุ่นเผยแพร่ด้วยตนเอง
- `trust.blockedFromDownload` คือสัญญาณบล็อกการติดตั้ง OpenClaw และ
  ไคลเอนต์ติดตั้งอื่นควรบล็อกการติดตั้งเมื่อค่านี้เป็น `true` แทนที่จะ
  คำนวณกฎการบล็อกใหม่จากฟิลด์สแกนเนอร์หรือการดูแล
- `trust.reasons` คือรายการคำอธิบายสำหรับผู้ใช้และการตรวจสอบ รหัสเหตุผล
  เป็นสตริงที่เสถียรและกระชับ เช่น `manual:quarantined`, `scan:malicious`
  และ `package:malicious`
- `trust.pending` หมายถึงอินพุตความน่าเชื่อถือหนึ่งรายการขึ้นไปยังรอการเสร็จสิ้น
- `trust.stale` หมายถึงสรุปความน่าเชื่อถือคำนวณจากอินพุตที่ล้าสมัย และ
  ควรถูกถือว่าต้องรีเฟรชก่อนตัดสินใจอนุญาตด้วยความมั่นใจสูง

หมายเหตุ:

- ปลายทางนี้ระบุเวอร์ชันอย่างแม่นยำ ไคลเอนต์ควรเรียกใช้หลังจาก resolve
  เวอร์ชันแพ็กเกจที่ต้องการติดตั้ง ไม่ใช่แค่หลังจากอ่าน
  เมตาดาทาแพ็กเกจล่าสุด
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่เจ้าของได้
- ปลายทางนี้ตั้งใจให้แคบกว่าปลายทางการดูแลของเจ้าของ/ผู้ดูแล
  โดยเปิดเผยการตัดสินใจติดตั้งและคำอธิบายสาธารณะ ไม่ใช่
  ตัวตนผู้รายงาน เนื้อหารายงาน หลักฐานส่วนตัว หรือไทม์ไลน์การตรวจสอบภายใน

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

ส่งคืนเมตาดาทาตัว resolve อาร์ติแฟกต์แบบชัดเจนสำหรับเวอร์ชันแพ็กเกจ

หมายเหตุ:

- เวอร์ชันแพ็กเกจเดิมส่งคืนอาร์ติแฟกต์ `legacy-zip` และ
  `downloadUrl` ของ ZIP เดิม
- เวอร์ชัน ClawPack ส่งคืนอาร์ติแฟกต์ `npm-pack`, ฟิลด์ integrity ของ npm,
  `tarballUrl` และ URL ความเข้ากันได้ของ ZIP เดิม
- นี่คือพื้นผิวตัว resolve ของ OpenClaw ซึ่งหลีกเลี่ยงการเดารูปแบบไฟล์เก็บถาวรจาก
  URL ที่ใช้ร่วมกัน

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ดาวน์โหลดอาร์ติแฟกต์เวอร์ชันผ่านเส้นทางตัว resolve แบบชัดเจน

หมายเหตุ:

- เวอร์ชัน ClawPack สตรีมไบต์ `.tgz` ของ npm-pack ที่อัปโหลดไว้อย่างแน่นอน
- เวอร์ชัน ZIP เดิม redirect ไปยัง `/api/v1/packages/{name}/download?version=`
- ใช้บัคเก็ตอัตราการดาวน์โหลด

### `GET /api/v1/packages/{name}/readiness`

ส่งคืนความพร้อมที่คำนวณแล้วสำหรับการใช้งาน OpenClaw ในอนาคต

การตรวจสอบความพร้อมครอบคลุม:

- สถานะช่องทางทางการ
- ความพร้อมใช้งานของเวอร์ชันล่าสุด
- ความพร้อมใช้งานของอาร์ติแฟกต์ ClawPack npm-pack
- digest ของอาร์ติแฟกต์
- แหล่งที่มาของ repo ต้นทางและ commit
- เมตาดาทาความเข้ากันได้กับ OpenClaw
- เป้าหมายโฮสต์
- สถานะการสแกน

คำตอบ:

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

- ต้องใช้โทเค็น API สำหรับผู้ใช้ผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์ Query:

- `phase` (ไม่บังคับ): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` หรือ
  `all` (ค่าเริ่มต้น)
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

คำตอบ:

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

- ต้องใช้โทเค็น API สำหรับผู้ใช้ผู้ดูแลระบบ

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
- `packageName` ถูกทำให้เป็นรูปแบบชื่อ npm มาตรฐาน แพ็กเกจอาจหายไปได้สำหรับการย้ายที่วางแผนไว้
- สิ่งนี้ติดตามเฉพาะความพร้อมของการย้ายเท่านั้น ไม่ได้แก้ไข OpenClaw หรือสร้าง
  ClawPacks

### `GET /api/v1/packages/moderation/queue`

ปลายทางผู้ดูแล/ผู้ดูแลระบบสำหรับคิวตรวจสอบรุ่นเผยแพร่แพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์ Query:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `blocked`, `manual` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

ความหมายของสถานะ:

- `open`: รุ่นเผยแพร่ที่น่าสงสัย เป็นอันตราย รอดำเนินการ ถูกกักกัน ถูกเพิกถอน หรือถูกรายงาน
- `blocked`: รุ่นเผยแพร่ที่ถูกกักกัน ถูกเพิกถอน หรือเป็นอันตราย
- `manual`: รุ่นเผยแพร่ใดๆ ที่มีการแทนที่การดูแลด้วยตนเอง
- `all`: รุ่นเผยแพร่ใดๆ ที่มีการแทนที่ด้วยตนเอง สถานะการสแกนที่ไม่สะอาด หรือรายงานแพ็กเกจ

คำตอบ:

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
เชื่อมกับเวอร์ชันได้ รายงานจะป้อนเข้าสู่คิวการดูแล แต่จะไม่ซ่อนอัตโนมัติหรือ
บล็อกการดาวน์โหลดด้วยตัวเอง ผู้ดูแลควรใช้การดูแลรุ่นเผยแพร่เพื่อ
อนุมัติ กักกัน หรือเพิกถอนอาร์ติแฟกต์

การยืนยันตัวตน:

- ต้องใช้โทเค็น API

คำขอ:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

คำตอบ:

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

จุดเชื่อมต่อสำหรับ moderator/admin เพื่อรับรายงานแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็น moderator หรือ admin

พารามิเตอร์ Query:

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

จุดเชื่อมต่อสำหรับเจ้าของ/moderator เพื่อดูสถานะการดูแลแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับเจ้าของแพ็กเกจ สมาชิกผู้เผยแพร่, moderator หรือ
  ผู้ใช้ admin

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

จุดเชื่อมต่อสำหรับ moderator/admin เพื่อแก้ไขหรือเปิดรายงานแพ็กเกจอีกครั้ง

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
`finalAction: "revoke"` พร้อมรายงานที่ยืนยันแล้ว เพื่อใช้การดูแลรีลีสใน
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

จุดเชื่อมต่อสำหรับ moderator/admin เพื่อตรวจสอบรีลีสของแพ็กเกจ

คำขอ:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

สถานะที่รองรับ:

- `approved`: ตรวจสอบด้วยตนเองและอนุญาตแล้ว
- `quarantined`: ถูกบล็อกระหว่างรอการติดตามผล
- `revoked`: ถูกบล็อกหลังจากรีลีสเคยได้รับความเชื่อถือมาก่อน

รีลีสที่ถูกกักกันและถูกเพิกถอนจะส่งคืน `403` จากเส้นทางดาวน์โหลดอาร์ติแฟกต์
ทุกการเปลี่ยนแปลงจะเขียนรายการบันทึกการตรวจสอบ

### `GET /api/v1/packages/{name}/file`

ส่งคืนเนื้อหาข้อความดิบสำหรับไฟล์แพ็กเกจ

พารามิเตอร์ Query:

- `path` (บังคับ)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นเป็นรีลีสล่าสุด
- ใช้บัคเก็ตอัตราการอ่าน ไม่ใช่บัคเก็ตการดาวน์โหลด
- ไฟล์ไบนารีส่งคืน `415`
- ขีดจำกัดขนาดไฟล์: 200KB
- การสแกน VirusTotal ที่ค้างอยู่ไม่บล็อกการอ่าน; รีลีสที่เป็นอันตรายอาจยังถูกระงับไว้ในที่อื่น
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่ที่เป็นเจ้าของได้

### `GET /api/v1/packages/{name}/download`

ดาวน์โหลดไฟล์เก็บถาวร ZIP แบบกำหนดได้ซ้ำเดิมสำหรับรีลีสของแพ็กเกจ

พารามิเตอร์ Query:

- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นเป็นรีลีสล่าสุด
- Skills เปลี่ยนเส้นทางไปยัง `GET /api/v1/download`
- ไฟล์เก็บถาวรของ Plugin/แพ็กเกจเป็นไฟล์ zip ที่มีราก `package/` เพื่อให้ไคลเอนต์ OpenClaw
  รุ่นเก่ายังทำงานต่อได้
- เส้นทางนี้คงไว้เฉพาะ ZIP เท่านั้น ไม่สตรีมไฟล์ ClawPack `.tgz`
- การตอบกลับมีส่วนหัว `ETag`, `Digest`, `X-ClawHub-Artifact-Type` และ
  `X-ClawHub-Artifact-Sha256` สำหรับการตรวจสอบความถูกต้องของตัวแก้ไข
- เมทาดาทาที่มีเฉพาะในรีจิสทรีจะไม่ถูกฉีดเข้าไปในไฟล์เก็บถาวรที่ดาวน์โหลด
- การสแกน VirusTotal ที่ค้างอยู่ไม่บล็อกการดาวน์โหลด; รีลีสที่เป็นอันตรายส่งคืน `403`
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะเป็นเจ้าของ

### `GET /api/npm/{package}`

ส่งคืน packument ที่เข้ากันได้กับ npm สำหรับเวอร์ชันแพ็กเกจที่รองรับด้วย ClawPack

หมายเหตุ:

- แสดงเฉพาะเวอร์ชันที่มีการอัปโหลดทาร์บอล ClawPack npm-pack แล้ว
- เวอร์ชันเดิมที่มีเฉพาะ ZIP จะถูกละไว้โดยตั้งใจ
- `dist.tarball`, `dist.integrity` และ `dist.shasum` ใช้ฟิลด์ที่เข้ากันได้กับ npm
  เพื่อให้ผู้ใช้ชี้ npm ไปยังมิเรอร์ได้หากเลือกทำเช่นนั้น
- packument ของแพ็กเกจแบบ scoped รองรับทั้งเส้นทางคำขอ `/api/npm/@scope/name` และ
  `/api/npm/@scope%2Fname` ที่เข้ารหัสตามแบบ npm

### `GET /api/npm/{package}/-/{tarball}.tgz`

สตรีมไบต์ของทาร์บอล ClawPack ที่อัปโหลดไว้จริงสำหรับไคลเอนต์มิเรอร์ npm

หมายเหตุ:

- ใช้บัคเก็ตอัตราการดาวน์โหลด
- ส่วนหัวการดาวน์โหลดมี SHA-256 ของ ClawHub พร้อมเมทาดาทา integrity/shasum ของ npm
- การตรวจสอบการดูแลและการเข้าถึงแพ็กเกจส่วนตัวยังคงมีผล

### `GET /api/v1/resolve`

ใช้โดย CLI เพื่อแมปลายนิ้วมือภายในเครื่องไปยังเวอร์ชันที่รู้จัก

พารามิเตอร์ Query:

- `slug` (บังคับ)
- `hash` (บังคับ): sha256 แบบ hex 64 อักขระของลายนิ้วมือบันเดิล

การตอบกลับ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ดาวน์โหลด ZIP ของเวอร์ชัน Skills ที่โฮสต์ไว้ หรือส่งคืนการส่งต่อไปยังซอร์ส GitHub สำหรับ
Skills ปัจจุบันที่รองรับด้วย GitHub ซึ่งมีผลสแกน `clean` หรือ `suspicious` และไม่มีเวอร์ชัน
ที่โฮสต์ไว้

พารามิเตอร์ Query:

- `slug` (บังคับ)
- `version` (ไม่บังคับ): สตริง semver
- `tag` (ไม่บังคับ): ชื่อแท็ก (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- เวอร์ชันที่ถูกลบแบบ soft-delete ส่งคืน `410`
- การส่งต่อ Skills ที่รองรับด้วย GitHub จะไม่พร็อกซีหรือมิเรอร์ไบต์ การตอบกลับ JSON
  มี `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  และ `archiveUrl`; สถานะการสแกน/ปัจจุบันเป็น gate และไม่รวมเป็นเมทาดาทาเพย์โหลดความสำเร็จ
- สถิติการดาวน์โหลดนับเป็นตัวตนที่ไม่ซ้ำต่อวัน UTC (`userId` เมื่อโทเค็น API ถูกต้อง มิฉะนั้นใช้ IP)

## จุดเชื่อมต่อการยืนยันตัวตน (Bearer token)

จุดเชื่อมต่อทั้งหมดต้องมี:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

ตรวจสอบความถูกต้องของโทเค็นและส่งคืน handle ของผู้ใช้

### `POST /api/v1/skills`

เผยแพร่เวอร์ชันใหม่

- แนะนำให้ใช้: `multipart/form-data` พร้อม JSON `payload` + blob `files[]`
- ยอมรับ body แบบ JSON ที่มี `files` (อิง `storageId`) ด้วย
- ฟิลด์เพย์โหลดไม่บังคับ: `ownerHandle` เมื่อมีอยู่ API จะแก้ไข
  ผู้เผยแพร่นั้นฝั่งเซิร์ฟเวอร์และกำหนดให้ actor ต้องมีสิทธิ์เข้าถึงผู้เผยแพร่
- ฟิลด์เพย์โหลดไม่บังคับ: `migrateOwner` เมื่อเป็น `true` พร้อม `ownerHandle`
  Skills ที่มีอยู่สามารถย้ายไปยังเจ้าของนั้นได้ หาก actor เป็น admin/owner ทั้งบน
  ผู้เผยแพร่ปัจจุบันและเป้าหมาย หากไม่มีการ opt-in นี้ การเปลี่ยนเจ้าของจะ
  ถูกปฏิเสธ

### `POST /api/v1/packages`

เผยแพร่รีลีส code-plugin หรือ bundle-plugin

- ต้องใช้การยืนยันตัวตนด้วย Bearer token
- ต้องใช้ `multipart/form-data`
- ฟิลด์ฟอร์มที่อนุญาตคือ `payload`, blob `files` ซ้ำหลายรายการ หรือการอ้างอิงทาร์บอล `clawpack`
  หนึ่งรายการ `clawpack` อาจเป็น blob `.tgz` หรือ storage id ที่ส่งคืนโดย
  โฟลว์ upload-url การเผยแพร่ด้วย storage-id ที่ staging ไว้ต้องรวม
  `clawpackUploadTicket` ที่ส่งคืนพร้อม URL อัปโหลดนั้นด้วย
- ใช้ `files` หรือ `clawpack` อย่างใดอย่างหนึ่ง ห้ามใช้ทั้งคู่ในคำขอเดียวกัน
- body แบบ JSON และเมทาดาทา `payload.files` / `payload.artifact`
  ที่ผู้เรียกส่งมาเองจะถูกปฏิเสธ
- คำขอเผยแพร่ multipart โดยตรงถูกจำกัดไว้ที่ 18MB ทาร์บอล ClawPack อาจ
  ใช้โฟลว์ upload-url ได้ถึงขีดจำกัดทาร์บอล 120MB
- ฟิลด์เพย์โหลดไม่บังคับ: `ownerHandle` เมื่อมีอยู่ เฉพาะ admin เท่านั้นที่เผยแพร่แทนเจ้าของนั้นได้

จุดสำคัญของการตรวจสอบ:

- `family` ต้องเป็น `code-plugin` หรือ `bundle-plugin`
- แพ็กเกจ Plugin ต้องมี `openclaw.plugin.json` การอัปโหลด ClawPack `.tgz` ต้อง
  มีไฟล์นี้ที่ `package/openclaw.plugin.json`
- Code plugins ต้องมี `package.json`, เมทาดาทารีโปซอร์ส, เมทาดาทาคอมมิตซอร์ส,
  เมทาดาทาสคีมาการกำหนดค่า, `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion`
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมทาดาทาไม่บังคับ
- เฉพาะผู้เผยแพร่ org `openclaw` และผู้เผยแพร่ส่วนตัวของสมาชิก org `openclaw`
  ปัจจุบันเท่านั้นที่เผยแพร่ไปยังช่อง `official` ได้
- การเผยแพร่แทนผู้อื่นยังตรวจสอบคุณสมบัติช่องทาง official กับบัญชีเจ้าของเป้าหมาย

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

ลบแบบ soft-delete / กู้คืน Skills (เจ้าของ, moderator หรือ admin)

body แบบ JSON ไม่บังคับ:

```json
{ "reason": "Held for moderation pending legal review." }
```

เมื่อมีอยู่ `reason` จะถูกจัดเก็บเป็นหมายเหตุการดูแล Skills และคัดลอกไปยังบันทึกการตรวจสอบ
การลบแบบ soft delete ที่เริ่มโดยเจ้าของจะสงวน slug ไว้ 30 วัน จากนั้น slug จะถูกอ้างสิทธิ์โดย
ผู้เผยแพร่รายอื่นได้ การตอบกลับการลบมี `slugReservedUntil` เมื่อวันหมดอายุนี้มีผล
การซ่อนโดย moderator/admin และการลบด้วยเหตุผลด้านความปลอดภัยจะไม่หมดอายุด้วยวิธีนี้

การตอบกลับการลบ:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

รหัสสถานะ:

- `200`: ok
- `401`: ไม่ได้รับอนุญาต
- `403`: ต้องห้าม
- `404`: ไม่พบ Skills/ผู้ใช้
- `500`: ข้อผิดพลาดภายในเซิร์ฟเวอร์

### `POST /api/v1/users/publisher`

เฉพาะ admin เท่านั้น รับรองว่ามีผู้เผยแพร่แบบ org สำหรับ handle หาก handle ยังชี้ไปยัง
ผู้เผยแพร่ผู้ใช้/ส่วนตัวแบบใช้ร่วมกันรุ่นเก่า จุดเชื่อมต่อจะย้ายให้เป็นผู้เผยแพร่แบบ org ก่อน
สำหรับ org ที่สร้างใหม่ ให้ระบุ `memberHandle`; admin ที่ดำเนินการจะไม่ถูกเพิ่มเป็นสมาชิก
ค่าเริ่มต้นของ `memberRole` คือ `owner`

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

การสร้างผู้เผยแพร่แบบ org ด้วยตนเองสำหรับผู้ที่ยืนยันตัวตนแล้ว สร้างผู้เผยแพร่แบบ org ใหม่และเพิ่ม
ผู้เรียกเป็นเจ้าของ จุดเชื่อมต่อนี้ไม่ย้าย handle ผู้ใช้/ส่วนตัวที่มีอยู่และ
ไม่ทำเครื่องหมายผู้เผยแพร่ว่า trusted/official

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- ส่งคืน `409` เมื่อ handle ถูกใช้โดยผู้เผยแพร่ ผู้ใช้ หรือผู้เผยแพร่ส่วนตัวอยู่แล้ว

### `POST /api/v1/users/reserve`

เฉพาะ admin เท่านั้น สงวน root slugs และชื่อแพ็กเกจสำหรับเจ้าของที่ถูกต้องโดยไม่เผยแพร่
รีลีส ชื่อแพ็กเกจจะกลายเป็นแพ็กเกจ placeholder ส่วนตัวที่ไม่มีแถวรีลีส เพื่อให้เจ้าของรายเดียวกัน
เผยแพร่รีลีส code-plugin หรือ bundle-plugin จริงภายใต้ชื่อนั้นในภายหลังได้

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

เฉพาะ admin เท่านั้น กู้คืนผู้เผยแพร่ส่วนตัวสำหรับ principal GitHub OAuth ทดแทนที่ตรวจสอบแล้ว
โดยไม่แก้ไขแถวบัญชี Convex Auth คำขอต้องระบุ id บัญชีผู้ให้บริการ GitHub
ที่เปลี่ยนแปลงไม่ได้ทั้งสองรายการ; handle ที่เปลี่ยนแปลงได้ใช้เป็น guard สำหรับ operator เท่านั้น

ค่าเริ่มต้นของ endpoint คือ dry-run การใช้การกู้คืนจริงต้องตั้ง `dryRun: false` และ
`confirmIdentityVerified: true` หลังจากเจ้าหน้าที่ตรวจสอบความต่อเนื่องระหว่าง
GitHub principals ทั้งสองรายการอย่างเป็นอิสระแล้ว การกู้คืนจะล้มเหลวแบบปิดเมื่อผู้ใช้ปลายทางมี
publisher ส่วนบุคคลปัจจุบันที่มี skills, packages หรือ GitHub skill sources
การกู้คืนยังย้ายฟิลด์ `ownerUserId` แบบ legacy สำหรับ skills ของ publisher ที่กู้คืน,
alias ของ skill slug, packages, คำเตือนจาก package inspector และแถว search digest ที่ได้มา เพื่อให้
เส้นทาง direct-owner สอดคล้องกับอำนาจของ publisher ใหม่ นอกจากนี้ reservation ของ protected-handle
ที่ active สำหรับ handle ที่กู้คืนจะถูกมอบหมายใหม่ให้ผู้ใช้ทดแทน เพื่อไม่ให้การซิงโครไนซ์โปรไฟล์ในภายหลัง
คืนค่าอำนาจที่แข่งขันกันของผู้ใช้เดิมได้ แต่ละตารางหลักถูกจำกัดไว้ที่
100 แถวต่อธุรกรรม apply; การกู้คืนที่ใหญ่กว่านี้ต้องใช้ owner migration แบบดำเนินต่อได้ก่อน
GitHub skill sources เป็นแบบ publisher-scoped และจะถูกรายงานว่าตรวจสอบแล้วแทนการเขียนใหม่

- เนื้อความ: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- การตอบกลับ: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### endpoints สำหรับการจัดการ owner slug

- `POST /api/v1/skills/{slug}/rename`
  - เนื้อความ: `{ "newSlug": "new-canonical-slug" }`
  - การตอบกลับ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - เนื้อความ: `{ "targetSlug": "canonical-target-slug" }`
  - การตอบกลับ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

หมายเหตุ:

- endpoints ทั้งสองต้องใช้การยืนยันตัวตนด้วย API token และใช้งานได้เฉพาะกับเจ้าของ skill เท่านั้น
- `rename` เก็บ slug ก่อนหน้าไว้เป็น redirect alias
- `merge` ซ่อน listing ต้นทางและ redirect slug ต้นทางไปยัง listing เป้าหมาย

### endpoints สำหรับโอนความเป็นเจ้าของ

- `POST /api/v1/skills/{slug}/transfer`
  - เนื้อความ: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - การตอบกลับ: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - การตอบกลับ (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - รูปแบบการตอบกลับ: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

แบนผู้ใช้และลบ skills ที่เป็นเจ้าของแบบถาวร (เฉพาะ moderator/admin)

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

ยกเลิกการแบนผู้ใช้และกู้คืน skills ที่เข้าเงื่อนไข (เฉพาะ admin)

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
เนื้อหา (เฉพาะ admin) ค่าเริ่มต้นเป็น dry-run เว้นแต่ `dryRun` เป็น `false`

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

เปลี่ยนบทบาทผู้ใช้ (เฉพาะ admin)

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

แสดงรายการหรือค้นหาผู้ใช้ (เฉพาะ admin)

พารามิเตอร์ query:

- `q` (ไม่บังคับ): query สำหรับค้นหา
- `query` (ไม่บังคับ): alias สำหรับ `q`
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

เพิ่ม/ลบ star (รายการไฮไลต์) endpoints ทั้งสองเป็น idempotent

การตอบกลับ:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## endpoints ของ CLI แบบ legacy (เลิกใช้แล้ว)

ยังรองรับสำหรับ CLI เวอร์ชันเก่า:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

ดูแผนการลบได้ที่ `DEPRECATIONS.md`

`POST /api/cli/upload-url` ส่งคืน `uploadUrl` และ `uploadTicket` การ publish package
ที่ stage ไฟล์ tarball ของ ClawPack ต้องส่ง storage id ที่ได้เป็น
`clawpack` และ ticket ที่ส่งคืนเป็น `clawpackUploadTicket`

## การค้นหา registry (`/.well-known/clawhub.json`)

CLI สามารถค้นพบการตั้งค่า registry/auth จากไซต์ได้:

- `/.well-known/clawhub.json` (JSON, แนะนำ)
- `/.well-known/clawdhub.json` (legacy)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

หากคุณ self-host ให้ให้บริการไฟล์นี้ (หรือตั้งค่า `CLAWHUB_REGISTRY` โดยตรง; legacy `CLAWDHUB_REGISTRY`)
