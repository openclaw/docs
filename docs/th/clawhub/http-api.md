---
read_when:
    - การเพิ่ม/เปลี่ยนแปลง endpoint
    - Debugging คำขอระหว่าง CLI ↔ registry
summary: ข้อมูลอ้างอิง HTTP API (สาธารณะ + endpoint ของ CLI + การยืนยันตัวตน)
x-i18n:
    generated_at: "2026-06-28T10:14:21Z"
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

## การนำแค็ตตาล็อกสาธารณะไปใช้ซ้ำ

ไดเรกทอรีของบุคคลที่สามอาจใช้ endpoint อ่านสาธารณะเพื่อแสดงรายการหรือค้นหา Skills ของ ClawHub โปรดแคชผลลัพธ์ เคารพ `429`/`Retry-After` ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub แบบ canonical (`https://clawhub.ai/<owner>/skills/<slug>`) และหลีกเลี่ยงการสื่อว่า ClawHub รับรองเว็บไซต์ของบุคคลที่สามนั้น อย่าพยายามมิเรอร์เนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกโดยการกลั่นกรอง นอกเหนือจากพื้นผิว API สาธารณะ

ทางลัด slug บนเว็บ resolve ข้าม registry family ได้ แต่ไคลเอนต์ API ควรใช้
URL แบบ canonical ที่ endpoint อ่านส่งกลับมา แทนการสร้างลำดับความสำคัญของ route
ขึ้นใหม่เอง

## ขีดจำกัดอัตรา

โมเดลการบังคับใช้:

- คำขอแบบไม่ระบุชื่อ: บังคับใช้ต่อ IP
- คำขอที่ผ่านการยืนยันตัวตน (Bearer token ที่ถูกต้อง): บังคับใช้ต่อ bucket ของผู้ใช้
- หาก token หายไป/ไม่ถูกต้อง พฤติกรรมจะ fallback ไปใช้การบังคับใช้ตาม IP
- endpoint เขียนที่ผ่านการยืนยันตัวตนไม่ควรส่งคืนเพียง `Unauthorized` เปล่า ๆ เมื่อ
  เซิร์ฟเวอร์รู้เหตุผล token ที่หายไป, token ที่ไม่ถูกต้อง/ถูกเพิกถอน และ
  บัญชีที่ถูกลบ/ถูกแบน/ถูกปิดใช้งาน ควรได้ข้อความที่นำไปดำเนินการได้ เพื่อให้ไคลเอนต์
  CLI บอกผู้ใช้ได้ว่าอะไรบล็อกพวกเขา

- อ่าน: 3000/นาที ต่อ IP, 12000/นาที ต่อ key
- เขียน: 300/นาที ต่อ IP, 3000/นาที ต่อ key
- ดาวน์โหลด: 1200/นาที ต่อ IP, 6000/นาที ต่อ key (endpoint ดาวน์โหลด)

Header:

- ความเข้ากันได้แบบเดิม: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- แบบมาตรฐาน: `RateLimit-Limit`, `RateLimit-Reset`
- เมื่อ `429`: `X-RateLimit-Remaining: 0` และ `RateLimit-Remaining: 0`
- เมื่อ `429`: `Retry-After`

ความหมายของ Header:

- `X-RateLimit-Reset`: วินาที Unix epoch แบบสัมบูรณ์
- `RateLimit-Reset`: วินาทีจนกว่าจะรีเซ็ต (delay)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: งบประมาณที่เหลืออย่างแน่นอนเมื่อมีอยู่
  คำขอที่สำเร็จแบบ sharded จะละ Header นี้ แทนการส่งคืนค่าทั่วโลกโดยประมาณ
- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่ (delay) เมื่อ `429`

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
- ใช้ backoff แบบมี jitter เพื่อหลีกเลี่ยงการลองใหม่ที่เกิดพร้อมกัน
- หากไม่มี `Retry-After` ให้ fallback ไปใช้ `RateLimit-Reset` (หรือคำนวณจาก `X-RateLimit-Reset`)

แหล่งที่มาของ IP:

- ใช้ Header IP ของไคลเอนต์ที่เชื่อถือได้ รวมถึง `cf-connecting-ip` เฉพาะเมื่อ
  deployment เปิดใช้งาน trusted forwarded headers อย่างชัดเจน
- ClawHub ใช้ trusted forwarding headers เพื่อระบุ IP ของไคลเอนต์ที่ edge
- หากไม่มี IP ไคลเอนต์ที่เชื่อถือได้ คำขอแบบไม่ระบุชื่อจะใช้ bucket fallback
  ที่ scoped เฉพาะตามชนิด rate-limit เท่านั้น bucket fallback เหล่านี้ไม่รวม
  พาธ, slug, ชื่อ package, เวอร์ชัน, query string หรือพารามิเตอร์ artifact อื่น ๆ
  ที่ caller ส่งมา

## การตอบกลับข้อผิดพลาด

การตอบกลับข้อผิดพลาด v1 สาธารณะเป็นข้อความล้วนพร้อม `content-type: text/plain; charset=utf-8`
ซึ่งรวมถึงการตรวจสอบความถูกต้องล้มเหลว (`400`), resource สาธารณะที่หายไป (`404`), การยืนยันตัวตนและ
สิทธิ์ล้มเหลว (`401`/`403`), ขีดจำกัดอัตรา (`429`) และการดาวน์โหลดที่ถูกบล็อก ไคลเอนต์
ควรอ่านข้อความใน body ของการตอบกลับเป็นสตริงที่มนุษย์อ่านได้ พารามิเตอร์ query ที่ไม่รู้จักจะถูก
ละเว้นเพื่อความเข้ากันได้ แต่พารามิเตอร์ query ที่รู้จักซึ่งมีค่าที่ไม่ถูกต้องจะส่งคืน
`400`

## endpoint สาธารณะ (ไม่ต้องยืนยันตัวตน)

### `GET /api/v1/search`

พารามิเตอร์ Query:

- `q` (จำเป็น): สตริง query
- `limit` (ไม่บังคับ): จำนวนเต็ม
- `highlightedOnly` (ไม่บังคับ): `true` เพื่อกรองให้เหลือเฉพาะ Skills ที่ถูกไฮไลต์
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

- ผลลัพธ์จะถูกส่งคืนตามลำดับความเกี่ยวข้อง (ความคล้าย embedding + boost จาก token slug/name ที่ตรงกันแบบ exact + popularity prior เล็กน้อย)
- ความเกี่ยวข้องมีน้ำหนักมากกว่าความนิยม การจับคู่ slug หรือ token ของชื่อที่แสดงอย่างแม่นยำสามารถมีอันดับสูงกว่าการจับคู่ที่หลวมกว่าแม้มี engagement แข็งแรงกว่ามาก
- ข้อความ ASCII จะถูก tokenize ตามขอบเขตคำและเครื่องหมายวรรคตอน ตัวอย่างเช่น `personal-map` มี token `map` แบบ standalone ขณะที่ `amap-jsapi-skill` มี `amap`, `jsapi` และ `skill`; ดังนั้นการค้นหา `map` จึงให้ `personal-map` มี lexical match แข็งแรงกว่า `amap-jsapi-skill`
- ความนิยมถูกปรับสเกลแบบ log และมีเพดาน Skills ที่มี engagement สูงอาจอยู่ในอันดับต่ำกว่าเมื่อข้อความ query จับคู่ได้อ่อนกว่า
- สถานะการกลั่นกรองที่น่าสงสัยหรือซ่อนอยู่สามารถนำ Skill ออกจากการค้นหาสาธารณะได้ ขึ้นอยู่กับตัวกรองของ caller และสถานะการกลั่นกรองปัจจุบัน

คำแนะนำด้านการค้นพบสำหรับผู้เผยแพร่:

- ใส่คำที่ผู้ใช้จะค้นหาจริงในชื่อที่แสดง สรุป และแท็ก ใช้ token slug แบบ standalone เฉพาะเมื่อเป็นตัวตนที่เสถียรซึ่งคุณต้องการคงไว้ด้วย
- อย่าเปลี่ยนชื่อ slug เพียงเพื่อไล่ตาม query เดียว เว้นแต่ว่า slug ใหม่จะเป็นชื่อ canonical ระยะยาวที่ดีกว่า slug เก่าจะกลายเป็น redirect alias แต่ URL แบบ canonical, slug ที่แสดง และ search digest ในอนาคตจะใช้ slug ใหม่
- alias จากการเปลี่ยนชื่อจะรักษาการ resolve สำหรับ URL เก่าและการติดตั้งที่ resolve ผ่าน registry แต่การจัดอันดับการค้นหาจะอิงตาม metadata ของ Skill แบบ canonical หลังจากการเปลี่ยนชื่อถูก index แล้ว สถิติเดิมยังคงอยู่กับ Skill
- หาก Skill มองไม่เห็นโดยไม่คาดคิด ให้ตรวจสอบสถานะการกลั่นกรองก่อนด้วย `clawhub inspect @owner/slug` ขณะ logged in ก่อนเปลี่ยน metadata ที่เกี่ยวข้องกับการจัดอันดับ

### `GET /api/v1/skills`

พารามิเตอร์ Query:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–200)
- `cursor` (ไม่บังคับ): pagination cursor สำหรับ sort ที่ไม่ใช่ `trending`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), alias การติดตั้งเดิม `installsCurrent`/`installs`/`installsAllTime` map ไปที่ `downloads`, `trending`
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias เดิมสำหรับ `nonSuspiciousOnly`

ค่า `sort` ที่ไม่ถูกต้องจะส่งคืน `400`

หมายเหตุ:

- `recommended` ใช้สัญญาณ engagement และความใหม่
- `trending` จัดอันดับตามการติดตั้งใน 7 วันที่ผ่านมา (อิง telemetry)
- `createdAt` เสถียรสำหรับการ crawl Skill ใหม่; `updated` เปลี่ยนเมื่อ Skills ที่มีอยู่ถูกเผยแพร่ซ้ำ
- เมื่อ `nonSuspiciousOnly=true` sort แบบใช้ cursor อาจส่งคืนรายการน้อยกว่า `limit` ในหนึ่งหน้า เพราะ Skills ที่น่าสงสัยถูกกรองหลังจากดึงหน้าแล้ว
- ใช้ `nextCursor` เพื่อดำเนินการ pagination ต่อเมื่อมีอยู่ หน้าสั้นไม่ได้หมายความว่าเป็นจุดสิ้นสุดของผลลัพธ์ด้วยตัวมันเอง

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

- slug เก่าที่สร้างจาก flow การเปลี่ยนชื่อ/merge ของ owner จะ resolve ไปยัง Skill แบบ canonical
- `metadata.os`: ข้อจำกัด OS ที่ประกาศใน frontmatter ของ Skill (เช่น `["macos"]`, `["linux"]`) เป็น `null` หากไม่ได้ประกาศ
- `metadata.systems`: เป้าหมายระบบ Nix (เช่น `["aarch64-darwin", "x86_64-linux"]`) เป็น `null` หากไม่ได้ประกาศ
- `metadata` เป็น `null` หาก Skill ไม่มี metadata แพลตฟอร์ม
- `moderation` จะถูกรวมไว้เฉพาะเมื่อ Skill ถูก flag หรือ owner กำลังดูอยู่

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
- caller สาธารณะจะได้ `200` เฉพาะสำหรับ Skills ที่มองเห็นได้และถูก flag แล้ว
- หลักฐานจะถูก redact สำหรับ caller สาธารณะ และรวม snippet ดิบเฉพาะสำหรับเจ้าของ/ผู้กลั่นกรองเท่านั้น

### `POST /api/v1/skills/{slug}/report`

รายงาน Skill เพื่อให้ผู้กลั่นกรองตรวจสอบ รายงานอยู่ในระดับ Skill และอาจลิงก์
กับเวอร์ชันได้ และป้อนเข้าสู่คิวรายงาน Skill

การยืนยันตัวตน:

- ต้องมี API token

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

endpoint สำหรับ moderator/admin เพื่อรับรายงาน Skill เข้ามา

พารามิเตอร์ Query:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `confirmed`, `dismissed` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-200)
- `cursor` (ไม่บังคับ): pagination cursor

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

endpoint สำหรับ moderator/admin เพื่อ resolve หรือ reopen รายงาน Skill

คำขอ:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

ต้องมี `note` สำหรับ `confirmed` และ `dismissed`; อาจละเว้นได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "hide"` พร้อมรายงานที่ triage แล้ว
เพื่อซ่อน Skill ใน workflow ที่ตรวจสอบย้อนหลังได้เดียวกัน

### `GET /api/v1/skills/{slug}/versions`

พารามิเตอร์ Query:

- `limit` (ไม่บังคับ): จำนวนเต็ม
- `cursor` (ไม่บังคับ): pagination cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

ส่งคืน metadata ของเวอร์ชัน + รายการไฟล์

- `version.security` รวมสถานะการยืนยัน scan ที่ normalize แล้วและรายละเอียด scanner
  (VirusTotal + LLM) เมื่อมี

### `GET /api/v1/skills/{slug}/scan`

ส่งคืนรายละเอียดการยืนยัน scan ความปลอดภัยสำหรับเวอร์ชันของ Skill

พารามิเตอร์ Query:

- `version` (ไม่บังคับ): สตริงเวอร์ชันเฉพาะ
- `tag` (ไม่บังคับ): resolve เวอร์ชันที่ติด tag (ตัวอย่างเช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- รวมสถานะการตรวจสอบที่ทำให้เป็นมาตรฐานแล้ว พร้อมรายละเอียดเฉพาะของสแกนเนอร์
- `security.hasScanResult` เป็น `true` เฉพาะเมื่อสแกนเนอร์ให้คำตัดสินที่ชัดเจน (`clean`, `suspicious`, หรือ `malicious`)
- `moderation` คือสแนปช็อตการกลั่นกรองระดับ skill ปัจจุบันที่ได้มาจากเวอร์ชันล่าสุด
- เมื่อสอบถามเวอร์ชันในอดีต ให้ตรวจสอบ `moderation.matchesRequestedVersion` และ `moderation.sourceVersion` ก่อนถือว่า `moderation` และ `security` อยู่ในบริบทเวอร์ชันเดียวกัน

### `POST /api/v1/skills/-/scan`

ปลายทางส่งที่ต้องยืนยันตัวตนสำหรับงาน ClawScan ใหม่

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

- เพย์โหลดคำขอสแกนและรายงานที่ดาวน์โหลดได้จะหมดอายุจากที่เก็บคำขอสแกนหลังพ้นช่วงเวลาเก็บรักษา
- การสแกนที่เผยแพร่แล้วต้องมีสิทธิ์จัดการของเจ้าของ/ผู้เผยแพร่ หรืออำนาจผู้กลั่นกรอง/ผู้ดูแลระบบของแพลตฟอร์ม
- การสแกนที่เผยแพร่แล้วจะเขียนกลับเฉพาะเมื่อ `update: true` และการสแกนเสร็จสมบูรณ์สำเร็จ
- การตอบกลับคือ `202` พร้อม `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`
- งานสแกนเป็นแบบอะซิงโครนัส คำขอสแกนด้วยตนเองจะได้รับลำดับความสำคัญก่อนงานเผยแพร่/เติมข้อมูลย้อนหลังตามปกติ แต่การทำให้เสร็จยังขึ้นอยู่กับความพร้อมของ worker

### `GET /api/v1/skills/-/scan/{scanId}`

ปลายทางโพลที่ต้องยืนยันตัวตนสำหรับการสแกนที่ส่งแล้ว

- ส่งคืนสถานะ queued/running/succeeded/failed
- ส่งคืน `queue.queuedAhead` และ `queue.position` ขณะอยู่ในคิว เพื่อให้ไคลเอนต์แสดงจำนวนการสแกนด้วยตนเองที่มีลำดับความสำคัญซึ่งอยู่ก่อนหน้าคำขอได้ คิวที่ใหญ่มากจะถูกจำกัดและรายงานด้วย `queuedAheadIsEstimate: true`
- เมื่อมีให้ใช้งาน `report` จะมีส่วน `clawscan`, `skillspector`, `staticAnalysis`, และ `virustotal`
- งานสแกนที่ล้มเหลวจะส่งคืน `status: "failed"` พร้อม `lastError`

### `GET /api/v1/skills/-/scan/{scanId}/download`

ปลายทางคลังรายงานที่ต้องยืนยันตัวตน

- ต้องเป็นการสแกนที่สำเร็จแล้ว การสแกนที่ยังไม่สิ้นสุดจะส่งคืน `409`
- ส่งคืน ZIP พร้อม `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, และ `README.md`

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

ปลายทางคลังรายงานที่จัดเก็บไว้ซึ่งต้องยืนยันตัวตนสำหรับเวอร์ชันที่ส่งแล้ว

- ต้องมีสิทธิ์จัดการของเจ้าของ/ผู้เผยแพร่ต่อ skill หรือ plugin หรือมีอำนาจผู้กลั่นกรอง/ผู้ดูแลระบบของแพลตฟอร์ม
- ส่งคืนผลสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งตรงกันทุกประการ รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อนไว้
- `kind` มีค่าเริ่มต้นเป็น `skill`; ใช้ `kind=plugin` สำหรับการสแกน plugin/package
- ส่งคืนรูปแบบ ZIP เดียวกับการดาวน์โหลดคำขอสแกน

### `POST /api/v1/skills/-/scan/batch`

เส้นทางสแกนซ้ำแบบแบตช์หลักสำหรับผู้ดูแลระบบเท่านั้น รับรูปแบบเพย์โหลดเดียวกับ `POST /api/v1/skills/-/rescan-batch` เดิม

### `POST /api/v1/skills/-/scan/batch/status`

เส้นทางสถานะแบบแบตช์หลักสำหรับผู้ดูแลระบบเท่านั้น รับ `{ "jobIds": ["..."] }` และส่งคืนตัวนับรวมเดียวกับ `POST /api/v1/skills/-/rescan-batch/status` เดิม

### `GET /api/v1/skills/{slug}/verify`

ส่งคืนซองข้อมูลการตรวจสอบ Skill Card ที่ใช้โดย `clawhub skill verify`

พารามิเตอร์ query:

- `version` (ไม่บังคับ): สตริงเวอร์ชันที่ระบุ
- `tag` (ไม่บังคับ): แปลงเป็นเวอร์ชันที่ติดแท็ก (เช่น `latest`)

หมายเหตุ:

- `ok` เป็น `true` เฉพาะเมื่อเวอร์ชันที่เลือกมี Skill Card ที่สร้างแล้ว ไม่ถูกการกลั่นกรองบล็อกว่าเป็นมัลแวร์ และการตรวจสอบ ClawScan เป็น clean
- อัตลักษณ์ skill, อัตลักษณ์ผู้เผยแพร่ และเมทาดาทาเวอร์ชันที่เลือกเป็นฟิลด์ระดับบนสุดของซองข้อมูล (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) เพื่อให้ระบบอัตโนมัติของเชลล์อ่านได้โดยไม่ต้องแกะ wrapper ที่ซ้อนกัน
- `security` คือคำตัดสิน ClawScan/security ระดับบนสุด ระบบอัตโนมัติควรอิง `ok`, `decision`, `reasons`, และ `security.status`
- `security.signals` มีหลักฐานสนับสนุนจากสแกนเนอร์ เช่น `staticScan`, `virusTotal`, และ `skillSpector`
- `security.signals.dependencyRegistry` ถูกคงไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่สแกนเนอร์การมีอยู่ของทะเบียน dependency ถูกยกเลิกแล้ว และคีย์นี้เป็น `null` เสมอ
- `provenance` เป็น `server-resolved-github-import` เฉพาะเมื่อ ClawHub แปลงและจัดเก็บ repo/ref/commit/path ของ GitHub ระหว่างการเผยแพร่หรือนำเข้า มิฉะนั้นจะเป็น `unavailable`

### `POST /api/v1/skills/-/security-verdicts`

ส่งคืนคำตัดสินความปลอดภัยแบบย่อปัจจุบันสำหรับเวอร์ชัน skill ที่ตรงกันทุกประการ ปลายทาง
collection นี้มีไว้สำหรับไคลเอนต์ที่รู้อยู่แล้วว่าต้องแสดงเวอร์ชัน skill ของ
ClawHub ใดที่ติดตั้งไว้ เช่น OpenClaw Control UI

คำขอ:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

หมายเหตุ:

- `items` ต้องมีคู่ `{ slug, version }` ที่ไม่ซ้ำกัน 1-100 คู่
- ผลลัพธ์เป็นราย item; skill หรือเวอร์ชันที่หายไปหนึ่งรายการจะไม่ทำให้การตอบกลับทั้งหมดล้มเหลว
- การตอบกลับเป็นข้อมูลความปลอดภัยเท่านั้น ไม่รวมข้อมูล Skill Card, สถานะการ์ดที่สร้างแล้ว, รายการไฟล์ artifact หรือเพย์โหลดสแกนเนอร์แบบละเอียด
- `security.signals` มีเฉพาะหลักฐานสนับสนุนระดับสถานะเท่านั้น ใช้ `/scan` หรือหน้าการตรวจสอบความปลอดภัยของ ClawHub สำหรับรายละเอียดสแกนเนอร์เต็มรูปแบบ
- `security.signals.dependencyRegistry` ถูกคงไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่สแกนเนอร์การมีอยู่ของทะเบียน dependency ถูกยกเลิกแล้ว และคีย์นี้เป็น `null` เสมอ
- การไม่มี Skill Card ไม่ส่งผลต่อ `ok`, `decision`, หรือ `reasons` ของปลายทางนี้ ไคลเอนต์ควรอ่าน `skill-card.md` ที่ติดตั้งไว้ในเครื่องเมื่อจำเป็นต้องใช้เนื้อหาการ์ด
- ใช้ `/verify` เมื่อต้องการซองข้อมูลการตรวจสอบ Skill Card สำหรับ skill เดียว, `/card` เมื่อต้องการ markdown การ์ดที่สร้างแล้ว และ `/scan` เมื่อต้องการข้อมูลสแกนเนอร์แบบละเอียด

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

พารามิเตอร์คำค้น:

- `path` (จำเป็น)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นเป็นเวอร์ชันล่าสุด
- ขีดจำกัดขนาดไฟล์: 200KB

### `GET /api/v1/packages`

endpoint แค็ตตาล็อกรวมสำหรับ:

- skills
- code plugins
- bundle plugins

พารามิเตอร์คำค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended`, `trending`, `downloads`, alias เดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอถูกจำกัดขอบเขตเป็นแพ็กเกจ Plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` หรือ endpoint แพ็กเกจที่มี
  `family=code-plugin`/`family=bundle-plugin`) หมวดหมู่ที่ควบคุมและ
  alias ตัวกรอง v1 เดิมมีเอกสารอยู่ใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` หรือ `sort` จะส่งคืน `400` พารามิเตอร์คำค้นที่ไม่รู้จักจะถูกละเว้น
- `GET /api/v1/code-plugins` และ `GET /api/v1/bundle-plugins` ยังคงเป็น alias แบบ family คงที่
- รายการ Skill ยังคงรองรับโดยรีจิสทรี Skill และยังเผยแพร่ได้ผ่าน `POST /api/v1/skills` เท่านั้น
- `POST /api/v1/packages` ยังคงใช้ได้เฉพาะสำหรับรีลีส code-plugin และ bundle-plugin
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการตรวจสอบสิทธิ์สามารถเห็นแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดในผลลัพธ์รายการ/ค้นหา
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ผ่านการตรวจสอบสิทธิ์อ่านได้

### `GET /api/v1/packages/search`

การค้นหาแค็ตตาล็อกรวมใน Skills + แพ็กเกจ Plugin

พารามิเตอร์คำค้น:

- `q` (จำเป็น): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอถูกจำกัดขอบเขตเป็นแพ็กเกจ Plugin หมวดหมู่ที่ควบคุมและ alias ตัวกรอง
  v1 เดิมมีเอกสารอยู่ใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured` หรือ
  `highlightedOnly` จะส่งคืน `400` พารามิเตอร์คำค้นที่ไม่รู้จักจะถูกละเว้น
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการตรวจสอบสิทธิ์สามารถค้นหาแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัด
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ผ่านการตรวจสอบสิทธิ์อ่านได้

### `GET /api/v1/plugins`

เรียกดูแค็ตตาล็อกเฉพาะ Plugin ในแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์คำค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `recommended` (ค่าเริ่มต้น), `trending`, `downloads`, `updated`, alias เดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

alias ตัวกรอง v1 เดิมยังคงยอมรับบน endpoint สำหรับอ่าน:

- `mcp-tooling`, `data` และ `automation` จะแปลงเป็น `tools`
- `observability` และ `deployment` จะแปลงเป็น `gateway`
- `dev-tools` จะแปลงเป็น `runtime`

`trending` เป็นกระดานผู้นำการติดตั้ง/ดาวน์โหลดย้อนหลังเจ็ดวัน และไม่ใช้ยอดรวมตลอดกาล
บน endpoint รวม `/api/v1/packages` ค่านี้ใช้ได้เฉพาะ Plugin; ใช้
`/api/v1/skills?sort=trending` สำหรับแค็ตตาล็อก Skill

alias เดิมจะไม่ถูกยอมรับเป็นค่าหมวดหมู่ที่จัดเก็บหรือที่ผู้เขียนประกาศไว้

### `GET /api/v1/skills/export`

การส่งออก Skills สาธารณะล่าสุดแบบเป็นชุดสำหรับการวิเคราะห์แบบออฟไลน์

การตรวจสอบสิทธิ์:

- ต้องใช้โทเค็น API

พารามิเตอร์คำค้น:

- `startDate` (จำเป็น): ขอบเขตล่างเป็นมิลลิวินาที Unix สำหรับ `updatedAt` ของ Skill
- `endDate` (จำเป็น): ขอบเขตบนเป็นมิลลิวินาที Unix สำหรับ `updatedAt` ของ Skill
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าจากการตอบกลับก่อนหน้า

การตอบกลับ:

- Body: ไฟล์ ZIP archive
- Skill ที่ส่งออกแต่ละรายการมี root ที่ `{publisher}/{slug}/`
- Skills ที่โฮสต์ไว้จะรวมไฟล์เวอร์ชันที่จัดเก็บล่าสุดและถูกแสดงใน
  `_manifest.json` พร้อม `sourceRef: "public-clawhub"`
- Skills ปัจจุบันที่รองรับโดย GitHub และมีการสแกน `clean` หรือ `suspicious` จะรวม
  `_source_handoff.json` พร้อม `sourceRef: "public-github"`, repo, commit, path,
  แฮชเนื้อหา และ URL archive โดยจะไม่รวมไฟล์ซอร์สที่โฮสต์บน ClawHub
- Skill แต่ละรายการมี `_export_skill_meta.json`
- `_manifest.json` จะรวมอยู่ที่ root ของ ZIP เสมอ
- `_errors.json` จะถูกรวมเมื่อส่งออก Skills หรือไฟล์บางรายการไม่ได้

Headers:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

ส่งออกแบบกลุ่มของรุ่นเผยแพร่ Plugin สาธารณะล่าสุดสำหรับการวิเคราะห์แบบออฟไลน์

การยืนยันตัวตน:

- ต้องใช้ API token

พารามิเตอร์คิวรี:

- `startDate` (จำเป็น): ขอบเขตล่างเป็น Unix milliseconds สำหรับ `updatedAt` ของ Plugin
- `endDate` (จำเป็น): ขอบเขตบนเป็น Unix milliseconds สำหรับ `updatedAt` ของ Plugin
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์แบ่งหน้าจากการตอบกลับก่อนหน้า
- `family` (ไม่บังคับ): `code-plugin` หรือ `bundle-plugin` หากละไว้หมายถึงทั้งสอง
  ตระกูล Plugin

การตอบกลับ:

- เนื้อหา: ไฟล์ ZIP archive
- Plugin ที่ส่งออกแต่ละรายการมีรากอยู่ที่ `{family}/{packageName}/`
- Plugin ที่ส่งออกแต่ละรายการรวมไฟล์ที่จัดเก็บไว้ของรุ่นเผยแพร่ล่าสุด
- เมตาดาต้าการส่งออกต่อ Plugin ถูกจัดเก็บไว้ที่
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

ค้นหาเฉพาะ Plugin ข้ามแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์คิวรี:

- `q` (จำเป็น): สตริงคิวรี
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

หมายเหตุ:

- นามแฝงตัวกรอง v1 แบบเดิมที่จัดทำเอกสารไว้ใต้ `GET /api/v1/plugins` ก็ยัง
  ยอมรับได้
- การกรองหมวดหมู่เป็นตัวกรอง API จริงที่รองรับด้วยแถวไดเจสต์หมวดหมู่ Plugin
  ไม่ใช่การเขียนคิวรีค้นหาใหม่
- ผลลัพธ์ถูกส่งคืนตามลำดับความเกี่ยวข้องและปัจจุบันยังไม่มีการแบ่งหน้า
- ตัวควบคุมการเรียงลำดับใน UI เบราว์เซอร์สำหรับการค้นหา Plugin จะเรียงผลลัพธ์ความเกี่ยวข้องที่โหลดแล้วใหม่
  ให้ตรงกับพฤติกรรมเรียกดู `/skills` ปัจจุบัน

### `GET /api/v1/packages/{name}`

ส่งคืนเมตาดาต้ารายละเอียดแพ็กเกจ

หมายเหตุ:

- Skills สามารถ resolve ผ่าน route นี้ในแคตตาล็อกรวมได้เช่นกัน
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะอ่าน publisher เจ้าของได้

### `DELETE /api/v1/packages/{name}`

ลบแพ็กเกจและรุ่นเผยแพร่ทั้งหมดแบบ soft-delete

หมายเหตุ:

- ต้องใช้ API token สำหรับเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลระบบ org publisher,
  platform moderator หรือ platform admin

### `GET /api/v1/packages/{name}/versions`

ส่งคืนประวัติเวอร์ชัน

พารามิเตอร์คิวรี:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์แบ่งหน้า

หมายเหตุ:

- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะอ่าน publisher เจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}`

ส่งคืนแพ็กเกจหนึ่งเวอร์ชัน รวมถึงเมตาดาต้าไฟล์ ความเข้ากันได้
การยืนยัน เมตาดาต้า artifact และข้อมูลสแกน

หมายเหตุ:

- `version.artifact.kind` คือ `legacy-zip` สำหรับ package archives แบบเก่า หรือ
  `npm-pack` สำหรับรุ่นเผยแพร่ที่รองรับโดย ClawPack
- รุ่นเผยแพร่ ClawPack รวมฟิลด์ `npmIntegrity`, `npmShasum` และ
  `npmTarballName` ที่เข้ากันได้กับ npm
- `version.sha256hash` เป็นเมตาดาต้าความเข้ากันได้ที่เลิกแนะนำแล้วสำหรับไคลเอนต์เก่า ฟิลด์นี้
  แฮชไบต์ ZIP ที่ส่งคืนโดย `/api/v1/packages/{name}/download` อย่างตรงตัว
  ไคลเอนต์สมัยใหม่ควรใช้ `version.artifact.sha256` ซึ่งระบุ
  artifact รุ่นเผยแพร่แบบ canonical
- `version.vtAnalysis`, `version.llmAnalysis` และ `version.staticScan` จะ
  ถูกรวมไว้เมื่อมีข้อมูลสแกน
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะอ่าน publisher เจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}/security`

ส่งคืนสรุปความปลอดภัยและความน่าเชื่อถือของรุ่นเผยแพร่แพ็กเกจที่ตรงตัวสำหรับไคลเอนต์ติดตั้ง
นี่คือ surface การใช้งานสาธารณะของ OpenClaw สำหรับตัดสินใจว่า
รุ่นเผยแพร่ที่ resolve แล้วสามารถติดตั้งได้หรือไม่

การยืนยันตัวตน:

- endpoint อ่านสาธารณะ ไม่ต้องใช้ token ของเจ้าของ, publisher, moderator หรือ admin

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
  รุ่นเผยแพร่ที่ถูกประเมินอย่างตรงตัว
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` และ `release.npmTarballName` จะมีอยู่เมื่อทราบสำหรับ
  artifact รุ่นเผยแพร่
- `trust.scanStatus` คือสถานะความน่าเชื่อถือที่มีผล ซึ่งได้มาจากอินพุตของ scanner
  และการ moderation รุ่นเผยแพร่แบบ manual
- `trust.moderationState` เป็น nullable โดยเป็น `null` เมื่อไม่มีการ
  moderation รุ่นเผยแพร่แบบ manual
- `trust.blockedFromDownload` คือสัญญาณบล็อกการติดตั้ง OpenClaw และ
  ไคลเอนต์ติดตั้งอื่นควรบล็อกการติดตั้งเมื่อค่านี้เป็น `true` แทนการ
  คำนวณกฎการบล็อกจากฟิลด์ scanner หรือ moderation ใหม่เอง
- `trust.reasons` คือรายการคำอธิบายสำหรับผู้ใช้และ audit รหัสเหตุผล
  เป็นสตริงสั้นที่คงที่ เช่น `manual:quarantined`, `scan:malicious`,
  และ `package:malicious`
- `trust.pending` หมายถึงอินพุตความน่าเชื่อถืออย่างน้อยหนึ่งรายการยังรอให้เสร็จสิ้น
- `trust.stale` หมายถึงสรุปความน่าเชื่อถือถูกคำนวณจากอินพุตที่ล้าสมัยและ
  ควรถูกถือว่าต้อง refresh ก่อนการตัดสินใจอนุญาตที่มีความมั่นใจสูง

หมายเหตุ:

- endpoint นี้เจาะจงเวอร์ชันอย่างตรงตัว ไคลเอนต์ควรเรียกหลังจาก resolve
  เวอร์ชันแพ็กเกจที่ตั้งใจจะติดตั้ง ไม่ใช่เพียงหลังจากอ่านเมตาดาต้าแพ็กเกจล่าสุด
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะอ่าน publisher เจ้าของได้
- endpoint นี้ตั้งใจให้แคบกว่า endpoint moderation ของเจ้าของ/moderator
  โดยเปิดเผยการตัดสินใจติดตั้งและคำอธิบายสาธารณะ ไม่ใช่
  ตัวตนผู้รายงาน เนื้อหารายงาน หลักฐานส่วนตัว หรือไทม์ไลน์รีวิวภายใน

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

ส่งคืนเมตาดาต้า resolver artifact แบบชัดเจนสำหรับเวอร์ชันแพ็กเกจ

หมายเหตุ:

- เวอร์ชันแพ็กเกจแบบ legacy ส่งคืน artifact `legacy-zip` และ
  `downloadUrl` ของ ZIP แบบ legacy
- เวอร์ชัน ClawPack ส่งคืน artifact `npm-pack`, ฟิลด์ npm integrity,
  `tarballUrl` และ URL ความเข้ากันได้ของ ZIP แบบ legacy
- นี่คือ surface resolver ของ OpenClaw ซึ่งหลีกเลี่ยงการเดารูปแบบ archive จาก
  URL ที่ใช้ร่วมกัน

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ดาวน์โหลด artifact ของเวอร์ชันผ่านเส้นทาง resolver แบบชัดเจน

หมายเหตุ:

- เวอร์ชัน ClawPack สตรีมไบต์ `.tgz` ของ npm-pack ที่อัปโหลดไว้อย่างตรงตัว
- เวอร์ชัน ZIP แบบ legacy redirect ไปยัง `/api/v1/packages/{name}/download?version=`
- ใช้ download rate bucket

### `GET /api/v1/packages/{name}/readiness`

ส่งคืนความพร้อมที่คำนวณแล้วสำหรับการใช้งาน OpenClaw ในอนาคต

การตรวจความพร้อมครอบคลุม:

- สถานะช่องทางอย่างเป็นทางการ
- ความพร้อมใช้งานของเวอร์ชันล่าสุด
- ความพร้อมใช้งานของ artifact ClawPack npm-pack
- ไดเจสต์ artifact
- ที่มาของ source repo และ commit
- เมตาดาต้าความเข้ากันได้ของ OpenClaw
- host targets
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

endpoint สำหรับ moderator เพื่อแสดงแถว migration ของ Plugin OpenClaw อย่างเป็นทางการ

การยืนยันตัวตน:

- ต้องใช้ API token สำหรับผู้ใช้ moderator หรือ admin

พารามิเตอร์คิวรี:

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

endpoint สำหรับ admin เพื่อสร้างหรืออัปเดตแถว migration ของ Plugin อย่างเป็นทางการ

การยืนยันตัวตน:

- ต้องใช้ API token สำหรับผู้ใช้ admin

เนื้อหา request:

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

- `bundledPluginId` ถูก normalize เป็นตัวพิมพ์เล็กและเป็น upsert key ที่คงที่
- `packageName` ถูก normalize เป็นชื่อ npm; แพ็กเกจอาจขาดได้สำหรับ
  migration ที่วางแผนไว้
- สิ่งนี้ติดตามเฉพาะความพร้อมของ migration ไม่ได้แก้ไข OpenClaw หรือสร้าง
  ClawPacks

### `GET /api/v1/packages/moderation/queue`

endpoint สำหรับ moderator/admin สำหรับคิวรีวิวรุ่นเผยแพร่แพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้ API token สำหรับผู้ใช้ moderator หรือ admin

พารามิเตอร์คิวรี:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `blocked`, `manual` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์แบ่งหน้า

ความหมายของสถานะ:

- `open`: รุ่นเผยแพร่ที่น่าสงสัย, เป็นอันตราย, pending, quarantined, revoked หรือถูกรายงาน
- `blocked`: รุ่นเผยแพร่ที่ quarantined, revoked หรือ malicious
- `manual`: รุ่นเผยแพร่ใดๆ ที่มี manual moderation override
- `all`: รุ่นเผยแพร่ใดๆ ที่มี manual override, สถานะสแกนที่ไม่ clean หรือรายงานแพ็กเกจ

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

รายงานแพ็กเกจเพื่อให้ moderator ตรวจทาน รายงานอยู่ในระดับแพ็กเกจ และอาจ
เชื่อมโยงกับเวอร์ชันได้ รายงานเหล่านี้ป้อนเข้าสู่คิว moderation แต่จะไม่ซ่อนหรือ
บล็อกการดาวน์โหลดโดยอัตโนมัติด้วยตัวเอง; moderator ควรใช้ release moderation เพื่อ
อนุมัติ กักกัน หรือเพิกถอน artifact

การยืนยันตัวตน:

- ต้องใช้ API token

Request:

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

ปลายทางของผู้ดูแล/ผู้ดูแลระบบสำหรับรับรายงานแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

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

ปลายทางของเจ้าของ/ผู้ดูแลสำหรับการมองเห็นสถานะการดูแลแพ็กเกจ

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

ปลายทางของผู้ดูแล/ผู้ดูแลระบบสำหรับแก้ไขหรือเปิดรายงานแพ็กเกจอีกครั้ง

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

ปลายทางของผู้ดูแล/ผู้ดูแลระบบสำหรับตรวจทานรีลีสแพ็กเกจ

คำขอ:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

สถานะที่รองรับ:

- `approved`: ตรวจทานด้วยตนเองและอนุญาตแล้ว
- `quarantined`: ถูกบล็อกระหว่างรอการติดตามผล
- `revoked`: ถูกบล็อกหลังจากรีลีสเคยได้รับความเชื่อถือมาก่อน

รีลีสที่ถูกกักกันและเพิกถอนจะส่งคืน `403` จากเส้นทางดาวน์โหลดอาร์ติแฟกต์
การเปลี่ยนแปลงทุกครั้งจะเขียนรายการบันทึกการตรวจสอบ

### `GET /api/v1/packages/{name}/file`

ส่งคืนเนื้อหาข้อความดิบสำหรับไฟล์แพ็กเกจ

พารามิเตอร์คิวรี:

- `path` (จำเป็น)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นเป็นรีลีสล่าสุด
- ใช้บัคเก็ตอัตราการอ่าน ไม่ใช่บัคเก็ตการดาวน์โหลด
- ไฟล์ไบนารีส่งคืน `415`
- ขีดจำกัดขนาดไฟล์: 200KB
- การสแกน VirusTotal ที่รอดำเนินการไม่บล็อกการอ่าน; รีลีสที่เป็นอันตรายอาจยังถูกระงับในที่อื่น
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่ที่เป็นเจ้าของได้

### `GET /api/v1/packages/{name}/download`

ดาวน์โหลดไฟล์ ZIP แบบกำหนดซ้ำได้เดิมสำหรับรีลีสแพ็กเกจ

พารามิเตอร์คิวรี:

- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นเป็นรีลีสล่าสุด
- Skills เปลี่ยนเส้นทางไปยัง `GET /api/v1/download`
- ไฟล์เก็บถาวรของ Plugin/แพ็กเกจเป็นไฟล์ zip ที่มีราก `package/` เพื่อให้ไคลเอนต์ OpenClaw
  เก่ายังคงทำงานต่อได้
- เส้นทางนี้คงไว้เฉพาะ ZIP เท่านั้น ไม่สตรีมไฟล์ ClawPack `.tgz`
- การตอบกลับรวมส่วนหัว `ETag`, `Digest`, `X-ClawHub-Artifact-Type` และ
  `X-ClawHub-Artifact-Sha256` สำหรับการตรวจสอบความสมบูรณ์ของตัวแก้ไข
- เมตาดาต้าเฉพาะรีจิสทรีจะไม่ถูกฉีดเข้าไปในไฟล์เก็บถาวรที่ดาวน์โหลด
- การสแกน VirusTotal ที่รอดำเนินการไม่บล็อกการดาวน์โหลด; รีลีสที่เป็นอันตรายส่งคืน `403`
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะเป็นเจ้าของ

### `GET /api/npm/{package}`

ส่งคืนแพ็กคิวเมนต์ที่เข้ากันได้กับ npm สำหรับเวอร์ชันแพ็กเกจที่รองรับด้วย ClawPack

หมายเหตุ:

- แสดงเฉพาะเวอร์ชันที่มีการอัปโหลดทาร์บอล ClawPack npm-pack
- เวอร์ชันเดิมที่มีเฉพาะ ZIP จะถูกละไว้อย่างตั้งใจ
- `dist.tarball`, `dist.integrity` และ `dist.shasum` ใช้ฟิลด์ที่เข้ากันได้กับ npm
  เพื่อให้ผู้ใช้ชี้ npm ไปที่มิเรอร์ได้หากต้องการ
- แพ็กคิวเมนต์ของแพ็กเกจแบบ scoped รองรับทั้ง `/api/npm/@scope/name` และพาธคำขอ
  แบบเข้ารหัสของ npm `/api/npm/@scope%2Fname`

### `GET /api/npm/{package}/-/{tarball}.tgz`

สตรีมไบต์ทาร์บอล ClawPack ที่อัปโหลดจริงสำหรับไคลเอนต์มิเรอร์ npm

หมายเหตุ:

- ใช้บัคเก็ตอัตราการดาวน์โหลด
- ส่วนหัวการดาวน์โหลดรวม ClawHub SHA-256 พร้อมเมตาดาต้า integrity/shasum ของ npm
- การดูแลและการตรวจสอบการเข้าถึงแพ็กเกจส่วนตัวยังคงมีผล

### `GET /api/v1/resolve`

ใช้โดย CLI เพื่อจับคู่ลายนิ้วมือในเครื่องกับเวอร์ชันที่รู้จัก

พารามิเตอร์คิวรี:

- `slug` (จำเป็น)
- `hash` (จำเป็น): sha256 แบบ hex 64 อักขระของลายนิ้วมือบันเดิล

การตอบกลับ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ดาวน์โหลด ZIP ของเวอร์ชัน Skills ที่โฮสต์ไว้ หรือส่งคืนการส่งต่อแหล่งที่มาของ GitHub สำหรับ
Skills ปัจจุบันที่รองรับด้วย GitHub ซึ่งมีการสแกนเป็น `clean` หรือ `suspicious` และไม่มี
เวอร์ชันที่โฮสต์ไว้

พารามิเตอร์คิวรี:

- `slug` (จำเป็น)
- `version` (ไม่บังคับ): สตริง semver
- `tag` (ไม่บังคับ): ชื่อแท็ก (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- เวอร์ชันที่ถูกลบแบบกู้คืนได้ส่งคืน `410`
- การส่งต่อ Skills ที่รองรับด้วย GitHub จะไม่พร็อกซีหรือมิเรอร์ไบต์ การตอบกลับ JSON
  รวม `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  และ `archiveUrl`; สถานะการสแกน/สถานะปัจจุบันเป็นเกตและไม่ถูกรวมเป็นเมตาดาต้าเพย์โหลดความสำเร็จ
- สถิติการดาวน์โหลดนับเป็นตัวตนที่ไม่ซ้ำต่อวัน UTC (`userId` เมื่อโทเค็น API ใช้ได้ มิฉะนั้นใช้ IP)

## ปลายทางการยืนยันตัวตน (โทเค็น Bearer)

ปลายทางทั้งหมดต้องใช้:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

ตรวจสอบความถูกต้องของโทเค็นและส่งคืนแฮนเดิลผู้ใช้

### `POST /api/v1/skills`

เผยแพร่เวอร์ชันใหม่

- แนะนำ: `multipart/form-data` พร้อม JSON `payload` + บล็อบ `files[]`
- ยอมรับ body JSON พร้อม `files` (อิงตาม storageId) ด้วยเช่นกัน
- ฟิลด์เพย์โหลดไม่บังคับ: `ownerHandle` เมื่อมีอยู่ API จะแก้ไขผู้เผยแพร่นั้น
  ฝั่งเซิร์ฟเวอร์และกำหนดให้นักแสดงต้องมีสิทธิ์เข้าถึงผู้เผยแพร่
- ฟิลด์เพย์โหลดไม่บังคับ: `migrateOwner` เมื่อเป็น `true` พร้อม `ownerHandle`
  Skills ที่มีอยู่สามารถย้ายไปยังเจ้าของนั้นได้หากนักแสดงเป็นผู้ดูแลระบบ/เจ้าของทั้งใน
  ผู้เผยแพร่ปัจจุบันและเป้าหมาย หากไม่มีการเลือกใช้นี้ การเปลี่ยนเจ้าของจะ
  ถูกปฏิเสธ

### `POST /api/v1/packages`

เผยแพร่รีลีส code-plugin หรือ bundle-plugin

- ต้องใช้การยืนยันตัวตนด้วยโทเค็น Bearer
- ต้องใช้ `multipart/form-data`
- ฟิลด์ฟอร์มที่อนุญาตคือ `payload`, บล็อบ `files` ซ้ำหลายรายการ หรือการอ้างอิงทาร์บอล `clawpack`
  หนึ่งรายการ `clawpack` อาจเป็นบล็อบ `.tgz` หรือ storage id ที่ส่งคืนโดย
  โฟลว์ upload-url การเผยแพร่ด้วย storage-id ที่จัดเตรียมไว้ต้องรวม
  `clawpackUploadTicket` ที่ส่งคืนมากับ URL อัปโหลดนั้นด้วย
- ใช้ `files` หรือ `clawpack` อย่างใดอย่างหนึ่ง ห้ามใช้ทั้งสองอย่างในคำขอเดียวกัน
- body JSON และเมตาดาต้า `payload.files` / `payload.artifact`
  ที่ผู้เรียกจัดหาเองจะถูกปฏิเสธ
- คำขอเผยแพร่ multipart โดยตรงถูกจำกัดไว้ที่ 18MB ทาร์บอล ClawPack อาจ
  ใช้โฟลว์ upload-url ได้สูงสุดถึงขีดจำกัดทาร์บอล 120MB
- ฟิลด์เพย์โหลดไม่บังคับ: `ownerHandle` เมื่อมีอยู่ เฉพาะผู้ดูแลระบบเท่านั้นที่เผยแพร่แทนเจ้าของนั้นได้

จุดเด่นของการตรวจสอบความถูกต้อง:

- `family` ต้องเป็น `code-plugin` หรือ `bundle-plugin`
- แพ็กเกจ Plugin ต้องมี `openclaw.plugin.json` การอัปโหลด ClawPack `.tgz` ต้อง
  มีไฟล์นี้ที่ `package/openclaw.plugin.json`
- Code plugin ต้องมี `package.json`, เมตาดาต้ารีโปแหล่งที่มา, เมตาดาต้าคอมมิตแหล่งที่มา,
  เมตาดาต้า config schema, `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion`
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมตาดาต้าไม่บังคับ
- เฉพาะผู้เผยแพร่องค์กร `openclaw` และผู้เผยแพร่ส่วนตัวของสมาชิกองค์กร `openclaw`
  ปัจจุบันเท่านั้นที่เผยแพร่ไปยังช่องทาง `official` ได้
- การเผยแพร่แทนผู้อื่นยังคงตรวจสอบสิทธิ์ใช้งานช่องทาง official กับบัญชีเจ้าของเป้าหมาย

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

ลบแบบกู้คืนได้ / กู้คืน Skills (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)

body JSON ไม่บังคับ:

```json
{ "reason": "Held for moderation pending legal review." }
```

เมื่อมีอยู่ `reason` จะถูกเก็บเป็นบันทึกการดูแล Skills และคัดลอกเข้าไปในบันทึกการตรวจสอบ
การลบแบบกู้คืนได้ที่เริ่มโดยเจ้าของจะสงวน slug ไว้ 30 วัน จากนั้น slug จะถูกอ้างสิทธิ์โดย
ผู้เผยแพร่รายอื่นได้ การตอบกลับการลบรวม `slugReservedUntil` เมื่อการหมดอายุนี้มีผล
การซ่อนโดยผู้ดูแล/ผู้ดูแลระบบและการนำออกด้านความปลอดภัยจะไม่หมดอายุด้วยวิธีนี้

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

สำหรับผู้ดูแลระบบเท่านั้น ตรวจให้แน่ใจว่ามีผู้เผยแพร่องค์กรสำหรับแฮนเดิล หากแฮนเดิลยังชี้ไปที่
ผู้ใช้ร่วมเดิม/ผู้เผยแพร่ส่วนตัวเดิม ปลายทางจะย้ายเป็นผู้เผยแพร่องค์กรก่อน
สำหรับองค์กรที่สร้างใหม่ ให้ระบุ `memberHandle`; ผู้ดูแลระบบที่ดำเนินการจะไม่ถูกเพิ่มเป็นสมาชิก
ค่าเริ่มต้นของ `memberRole` คือ `owner`

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

การสร้างผู้เผยแพร่องค์กรแบบบริการตนเองที่ผ่านการยืนยันตัวตน สร้างผู้เผยแพร่องค์กรใหม่และเพิ่ม
ผู้เรียกเป็นเจ้าของ ปลายทางนี้ไม่ย้ายแฮนเดิลผู้ใช้/ส่วนตัวที่มีอยู่และ
ไม่ทำเครื่องหมายผู้เผยแพร่ว่าเชื่อถือได้/official

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- ส่งคืน `409` เมื่อแฮนเดิลถูกใช้แล้วโดยผู้เผยแพร่ ผู้ใช้ หรือผู้เผยแพร่ส่วนตัว

### `POST /api/v1/users/reserve`

สำหรับผู้ดูแลระบบเท่านั้น สงวน root slug และชื่อแพ็กเกจให้เจ้าของที่ถูกต้องโดยไม่เผยแพร่
รีลีส ชื่อแพ็กเกจจะกลายเป็นแพ็กเกจตัวแทนส่วนตัวที่ไม่มีแถวรีลีส เพื่อให้
เจ้าของรายเดิมสามารถเผยแพร่รีลีส code-plugin หรือ bundle-plugin จริงไปยังชื่อนั้นในภายหลังได้

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

สำหรับผู้ดูแลระบบเท่านั้น กู้คืนผู้เผยแพร่ส่วนตัวสำหรับ GitHub OAuth principal ทดแทนที่ตรวจสอบแล้ว
โดยไม่แก้ไขแถวบัญชี Convex Auth คำขอต้องระบุ id บัญชีผู้ให้บริการ GitHub
ที่เปลี่ยนไม่ได้ทั้งสองรายการ; แฮนเดิลที่เปลี่ยนได้ใช้เป็นตัวป้องกันที่ผู้ปฏิบัติงานเห็นเท่านั้น

ปลายทางมีค่าเริ่มต้นเป็นการรันแบบจำลอง การใช้การกู้คืนจริงต้องตั้ง `dryRun: false` และ
`confirmIdentityVerified: true` หลังจากเจ้าหน้าที่ตรวจสอบความต่อเนื่องระหว่าง
GitHub principals ทั้งสองรายการอย่างอิสระแล้ว การกู้คืนจะล้มเหลวแบบปิดเมื่อ personal
publisher ปัจจุบันของผู้ใช้ปลายทางมี Skills, packages หรือ GitHub skill sources
การกู้คืนยังย้ายฟิลด์ `ownerUserId` แบบดั้งเดิมสำหรับ Skills ของ publisher ที่กู้คืน,
skill slug aliases, packages, package inspector warnings และ derived search digest rows เพื่อให้
เส้นทาง direct-owner สอดคล้องกับอำนาจ publisher ใหม่ การจอง protected-handle ที่ยังใช้งานอยู่
สำหรับ handle ที่กู้คืนจะถูกกำหนดใหม่ให้ผู้ใช้ทดแทนด้วย เพื่อให้การซิงโครไนซ์โปรไฟล์ในภายหลัง
ไม่สามารถกู้คืนอำนาจที่แข่งขันกันของผู้ใช้เดิมได้ แต่ละตารางหลักถูกจำกัดไว้ที่
100 แถวต่อธุรกรรมการใช้จริง การกู้คืนที่ใหญ่กว่าต้องใช้ resumable owner migration ก่อน
GitHub skill sources มีขอบเขตตาม publisher และถูกรายงานว่าตรวจสอบแล้วแทนที่จะถูกเขียนใหม่

- เนื้อหา: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- การตอบกลับ: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### ปลายทางการจัดการ owner slug

- `POST /api/v1/skills/{slug}/rename`
  - เนื้อหา: `{ "newSlug": "new-canonical-slug" }`
  - การตอบกลับ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - เนื้อหา: `{ "targetSlug": "canonical-target-slug" }`
  - การตอบกลับ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

หมายเหตุ:

- ปลายทางทั้งสองต้องใช้การยืนยันตัวตนด้วย API token และใช้งานได้เฉพาะกับเจ้าของ skill เท่านั้น
- `rename` จะเก็บ slug ก่อนหน้าไว้เป็น alias สำหรับการเปลี่ยนเส้นทาง
- `merge` จะซ่อนรายการต้นทางและเปลี่ยนเส้นทาง slug ต้นทางไปยังรายการเป้าหมาย

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

แบนผู้ใช้และลบ Skills ที่เป็นเจ้าของแบบถาวร (เฉพาะ moderator/admin)

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

ยกเลิกแบนผู้ใช้และกู้คืน Skills ที่เข้าเงื่อนไข (เฉพาะ admin)

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

เปลี่ยนเหตุผลที่จัดเก็บไว้สำหรับการแบนที่มีอยู่โดยไม่ยกเลิกแบนหรือกู้คืน
เนื้อหา (เฉพาะ admin) ค่าเริ่มต้นเป็นการรันแบบจำลอง เว้นแต่ `dryRun` เป็น `false`

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

เพิ่ม/ลบดาว (ไฮไลต์) ปลายทางทั้งสองเป็น idempotent

การตอบกลับ:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## ปลายทาง CLI ดั้งเดิม (เลิกใช้งานแล้ว)

ยังรองรับสำหรับ CLI เวอร์ชันเก่า:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

ดู `DEPRECATIONS.md` สำหรับแผนการนำออก

`POST /api/cli/upload-url` ส่งคืน `uploadUrl` และ `uploadTicket` การเผยแพร่ Package
ที่เตรียม ClawPack tarball ต้องส่งรหัส storage ที่ได้เป็น
`clawpack` และ ticket ที่ส่งคืนเป็น `clawpackUploadTicket`

## การค้นพบ Registry (`/.well-known/clawhub.json`)

CLI สามารถค้นพบการตั้งค่า registry/auth จากไซต์ได้:

- `/.well-known/clawhub.json` (JSON, แนะนำ)
- `/.well-known/clawdhub.json` (ดั้งเดิม)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

หากคุณโฮสต์เอง ให้ให้บริการไฟล์นี้ (หรือตั้งค่า `CLAWHUB_REGISTRY` โดยตรง; `CLAWDHUB_REGISTRY` แบบดั้งเดิม)
