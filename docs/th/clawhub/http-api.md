---
read_when:
    - การเพิ่ม/เปลี่ยนแปลง endpoints
    - การดีบักคำขอ CLI ↔ registry
summary: ข้อมูลอ้างอิง HTTP API (ปลายทางสาธารณะ + ปลายทางของ CLI + การยืนยันตัวตน).
x-i18n:
    generated_at: "2026-07-04T20:45:14Z"
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
`/api/...` และ `/api/cli/...` แบบเดิมยังคงอยู่เพื่อความเข้ากันได้ (ดู `DEPRECATIONS.md`)
OpenAPI: `/api/v1/openapi.json`

## การนำแคตตาล็อกสาธารณะไปใช้ซ้ำ

ไดเรกทอรีของบุคคลที่สามอาจใช้ endpoint อ่านสาธารณะเพื่อแสดงรายการหรือค้นหา ClawHub skills โปรดแคชผลลัพธ์ เคารพ `429`/`Retry-After` ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ตามมาตรฐาน (`https://clawhub.ai/<owner>/skills/<slug>`) และหลีกเลี่ยงการสื่อว่า ClawHub รับรองเว็บไซต์บุคคลที่สามนั้น อย่าพยายามทำมิเรอร์เนื้อหาที่ซ่อน เป็นส่วนตัว หรือถูกบล็อกจากการกลั่นกรองภายนอกพื้นผิว API สาธารณะ

ทางลัด slug บนเว็บจะ resolve ข้ามตระกูลรีจิสทรี แต่ไคลเอนต์ API ควรใช้
URL ตามมาตรฐานที่ endpoint อ่านส่งกลับมาแทนการประกอบลำดับความสำคัญของ route
ขึ้นใหม่เอง

## ขีดจำกัดอัตรา

โมเดลการบังคับใช้:

- คำขอแบบไม่ระบุตัวตน: บังคับใช้ต่อ IP
- คำขอที่ยืนยันตัวตนแล้ว (Bearer token ที่ถูกต้อง): บังคับใช้ต่อ bucket ของผู้ใช้
- หาก token หายไป/ไม่ถูกต้อง พฤติกรรมจะ fallback ไปใช้การบังคับใช้ตาม IP
- endpoint เขียนที่ยืนยันตัวตนแล้วไม่ควรส่งคืนเพียง `Unauthorized` เปล่าๆ เมื่อ
  เซิร์ฟเวอร์ทราบเหตุผล token ที่หายไป token ที่ไม่ถูกต้อง/ถูกเพิกถอน และ
  บัญชีที่ถูกลบ/ถูกแบน/ถูกปิดใช้งานควรได้ข้อความที่ดำเนินการต่อได้ เพื่อให้ไคลเอนต์
  CLI บอกผู้ใช้ได้ว่าอะไรบล็อกพวกเขาอยู่

- อ่าน: 3000/นาที ต่อ IP, 12000/นาที ต่อ key
- เขียน: 300/นาที ต่อ IP, 3000/นาที ต่อ key
- ดาวน์โหลด: 1200/นาที ต่อ IP, 6000/นาที ต่อ key (endpoint ดาวน์โหลด)

ส่วนหัว:

- ความเข้ากันได้แบบเดิม: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- แบบมาตรฐาน: `RateLimit-Limit`, `RateLimit-Reset`
- เมื่อเป็น `429`: `X-RateLimit-Remaining: 0` และ `RateLimit-Remaining: 0`
- เมื่อเป็น `429`: `Retry-After`

ความหมายของส่วนหัว:

- `X-RateLimit-Reset`: วินาที Unix epoch แบบสัมบูรณ์
- `RateLimit-Reset`: จำนวนวินาทีจนกว่าจะรีเซ็ต (หน่วงเวลา)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: งบประมาณที่เหลือแบบแน่นอนเมื่อมีอยู่
  คำขอที่สำเร็จแบบ sharded จะละเว้นส่วนหัวนี้แทนการส่งคืนค่ารวมทั่วโลกโดยประมาณ
- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่ (หน่วงเวลา) เมื่อเป็น `429`

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
- ใช้ backoff แบบมี jitter เพื่อหลีกเลี่ยงการลองใหม่พร้อมกัน
- หากไม่มี `Retry-After` ให้ fallback ไปใช้ `RateLimit-Reset` (หรือคำนวณจาก `X-RateLimit-Reset`)

แหล่งที่มาของ IP:

- ใช้ส่วนหัว IP ไคลเอนต์ที่เชื่อถือได้ รวมถึง `cf-connecting-ip` เฉพาะเมื่อ
  การปรับใช้เปิดใช้งาน forwarded headers ที่เชื่อถือได้อย่างชัดเจน
- ClawHub ใช้ forwarding headers ที่เชื่อถือได้เพื่อระบุ IP ไคลเอนต์ที่ edge
- หากไม่มี IP ไคลเอนต์ที่เชื่อถือได้ คำขอแบบไม่ระบุตัวตนจะใช้ bucket fallback
  ที่ scope เฉพาะตามชนิดของขีดจำกัดอัตรา bucket fallback เหล่านี้ไม่รวม
  พาธ slug ชื่อ package เวอร์ชัน query string หรือพารามิเตอร์ artifact อื่นๆ
  ที่ caller ส่งมา

## Response ข้อผิดพลาด

response ข้อผิดพลาด v1 สาธารณะเป็นข้อความธรรมดาพร้อม `content-type: text/plain; charset=utf-8`
ซึ่งรวมถึง validation failures (`400`), ทรัพยากรสาธารณะที่หายไป (`404`), ความล้มเหลวด้าน auth และ
สิทธิ์ (`401`/`403`), ขีดจำกัดอัตรา (`429`) และการดาวน์โหลดที่ถูกบล็อก ไคลเอนต์
ควรอ่านข้อความใน response body เป็นสตริงที่มนุษย์อ่านได้ พารามิเตอร์ query ที่ไม่รู้จักจะ
ถูกละเว้นเพื่อความเข้ากันได้ แต่พารามิเตอร์ query ที่รู้จักและมีค่าที่ไม่ถูกต้องจะส่งคืน
`400`

## Endpoint สาธารณะ (ไม่มี auth)

### `GET /api/v1/search`

พารามิเตอร์ query:

- `q` (จำเป็น): สตริง query
- `limit` (ไม่บังคับ): จำนวนเต็ม
- `highlightedOnly` (ไม่บังคับ): `true` เพื่อกรองให้เหลือเฉพาะ skills ที่ถูกไฮไลต์
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน skills ที่น่าสงสัย (`flagged.suspicious`)
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

- ผลลัพธ์จะถูกส่งคืนตามลำดับความเกี่ยวข้อง (embedding similarity + การเพิ่มคะแนนจาก token slug/name ที่ตรงเป๊ะ + ค่าความนิยมล่วงหน้าเล็กน้อย)
- ความเกี่ยวข้องสำคัญกว่าความนิยม slug ที่แม่นยำหรือ token display-name ที่ตรงกันสามารถอยู่เหนือ match ที่หลวมกว่าแม้จะมี engagement สูงกว่ามาก
- ข้อความ ASCII จะถูก tokenized ตามขอบเขตคำและเครื่องหมายวรรคตอน ตัวอย่างเช่น `personal-map` มี token `map` แบบ standalone ขณะที่ `amap-jsapi-skill` มี `amap`, `jsapi` และ `skill`; ดังนั้นการค้นหา `map` จึงทำให้ `personal-map` มี lexical match ที่แรงกว่า `amap-jsapi-skill`
- ความนิยมถูกปรับแบบ log-scaled และมีเพดาน skills ที่มี engagement สูงอาจจัดอันดับต่ำกว่าเมื่อข้อความ query เป็น match ที่อ่อนกว่า
- สถานะการกลั่นกรองที่น่าสงสัยหรือซ่อนอยู่อาจทำให้ skill ถูกนำออกจากการค้นหาสาธารณะตามตัวกรองของ caller และสถานะการกลั่นกรองปัจจุบัน

คำแนะนำด้าน discoverability สำหรับผู้เผยแพร่:

- ใส่คำที่ผู้ใช้จะค้นหาจริงๆ ไว้ในชื่อที่แสดง สรุป และแท็ก ใช้ token slug แบบ standalone เฉพาะเมื่อมันเป็นตัวตนที่เสถียรที่คุณต้องการคงไว้ด้วย
- อย่าเปลี่ยนชื่อ slug เพียงเพื่อไล่ตาม query เดียว เว้นแต่ว่า slug ใหม่จะเป็นชื่อมาตรฐานระยะยาวที่ดีกว่า slug เก่าจะกลายเป็น redirect aliases แต่ URL ตามมาตรฐาน slug ที่แสดง และ digest การค้นหาในอนาคตจะใช้ slug ใหม่
- rename aliases จะคงการ resolve สำหรับ URL เก่าและการติดตั้งที่ resolve ผ่าน registry แต่การจัดอันดับการค้นหาจะอิงตาม metadata skill ตามมาตรฐานหลังจาก rename ถูก indexed แล้ว สถิติที่มีอยู่จะยังอยู่กับ skill
- หาก skill หายไปจากการมองเห็นโดยไม่คาดคิด ให้ตรวจสอบสถานะการกลั่นกรองก่อนด้วย `clawhub inspect @owner/slug` ขณะล็อกอิน ก่อนเปลี่ยน metadata ที่เกี่ยวข้องกับการจัดอันดับ

### `GET /api/v1/skills`

พารามิเตอร์ query:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–200)
- `cursor` (ไม่บังคับ): cursor การแบ่งหน้าสำหรับ sort ใดๆ ที่ไม่ใช่ `trending`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), alias การติดตั้งแบบเดิม `installsCurrent`/`installs`/`installsAllTime` map ไปยัง `downloads`, `trending`
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias แบบเดิมสำหรับ `nonSuspiciousOnly`

ค่า `sort` ที่ไม่ถูกต้องจะส่งคืน `400`

หมายเหตุ:

- `recommended` ใช้สัญญาณ engagement และความใหม่
- `trending` จัดอันดับตามการติดตั้งใน 7 วันที่ผ่านมา (อิง telemetry)
- `createdAt` เสถียรสำหรับการ crawl skill ใหม่; `updated` จะเปลี่ยนเมื่อ skills ที่มีอยู่ถูกเผยแพร่ซ้ำ
- เมื่อ `nonSuspiciousOnly=true` sort แบบใช้ cursor อาจส่งคืนรายการน้อยกว่า `limit` ในหน้าใดหน้าหนึ่ง เพราะ skills ที่น่าสงสัยถูกกรองหลังจากดึงข้อมูลหน้าแล้ว
- ใช้ `nextCursor` เพื่อทำ pagination ต่อเมื่อมีอยู่ หน้าสั้นไม่ได้หมายความว่าเป็นจุดสิ้นสุดของผลลัพธ์โดยตัวมันเอง

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

- slug เก่าที่สร้างโดย flow การเปลี่ยนชื่อ/รวม owner จะ resolve ไปยัง skill ตามมาตรฐาน
- `metadata.os`: ข้อจำกัด OS ที่ประกาศใน frontmatter ของ skill (เช่น `["macos"]`, `["linux"]`) เป็น `null` หากไม่ได้ประกาศ
- `metadata.systems`: เป้าหมายระบบ Nix (เช่น `["aarch64-darwin", "x86_64-linux"]`) เป็น `null` หากไม่ได้ประกาศ
- `metadata` เป็น `null` หาก skill ไม่มี metadata แพลตฟอร์ม
- `moderation` จะรวมอยู่เฉพาะเมื่อ skill ถูก flag หรือ owner กำลังดูอยู่

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

- Owners และ moderators สามารถเข้าถึงรายละเอียดการกลั่นกรองสำหรับ skills ที่ซ่อนอยู่
- caller สาธารณะจะได้ `200` เฉพาะสำหรับ skills ที่มองเห็นได้และถูก flag แล้ว
- หลักฐานจะถูก redact สำหรับ caller สาธารณะ และรวม snippet ดิบเฉพาะสำหรับ owners/moderators เท่านั้น

### `POST /api/v1/skills/{slug}/report`

รายงาน skill เพื่อให้ moderator ตรวจสอบ รายงานอยู่ในระดับ skill อาจลิงก์
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

Endpoint สำหรับ moderator/admin เพื่อรับรายงาน skill

พารามิเตอร์ query:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `confirmed`, `dismissed` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-200)
- `cursor` (ไม่บังคับ): cursor การแบ่งหน้า

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

Endpoint สำหรับ moderator/admin เพื่อ resolve หรือ reopen รายงาน skill

Request:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

ต้องมี `note` สำหรับ `confirmed` และ `dismissed`; อาจละเว้นได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "hide"` พร้อมรายงานที่ triage แล้ว
เพื่อซ่อน skill ใน workflow ที่ตรวจสอบย้อนหลังได้เดียวกัน

### `GET /api/v1/skills/{slug}/versions`

พารามิเตอร์ query:

- `limit` (ไม่บังคับ): จำนวนเต็ม
- `cursor` (ไม่บังคับ): cursor การแบ่งหน้า

### `GET /api/v1/skills/{slug}/versions/{version}`

ส่งคืน metadata เวอร์ชัน + รายการไฟล์

- `version.security` รวมสถานะการตรวจสอบ scan ที่ normalized และรายละเอียด scanner
  (VirusTotal + LLM) เมื่อมีอยู่

### `GET /api/v1/skills/{slug}/scan`

ส่งคืนรายละเอียดการตรวจสอบ scan ความปลอดภัยสำหรับเวอร์ชัน skill

พารามิเตอร์ query:

- `version` (ไม่บังคับ): สตริงเวอร์ชันเฉพาะ
- `tag` (ไม่บังคับ): resolve เวอร์ชันที่มี tag (ตัวอย่างเช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- รวมสถานะการตรวจสอบที่ทำให้เป็นมาตรฐานแล้ว พร้อมรายละเอียดเฉพาะของสแกนเนอร์
- `security.hasScanResult` เป็น `true` เฉพาะเมื่อสแกนเนอร์ให้ผลตัดสินที่ชัดเจน (`clean`, `suspicious` หรือ `malicious`)
- `moderation` คือสแนปช็อตการกลั่นกรองระดับสกิลปัจจุบันที่ได้จากเวอร์ชันล่าสุด
- เมื่อสืบค้นเวอร์ชันย้อนหลัง ให้ตรวจสอบ `moderation.matchesRequestedVersion` และ `moderation.sourceVersion` ก่อนถือว่า `moderation` และ `security` อยู่ในบริบทเวอร์ชันเดียวกัน

### `POST /api/v1/skills/-/scan`

เอนด์พอยต์ส่งงานที่ต้องยืนยันตัวตนสำหรับงาน ClawScan ใหม่

ไม่รองรับการสแกนการอัปโหลดในเครื่องอีกต่อไป คำขอที่ใช้
`multipart/form-data` หรือ `{ "source": { "kind": "upload" } }` จะส่งคืน `410`

การสแกนที่เผยแพร่แล้วใช้ JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

หมายเหตุ:

- เพย์โหลดคำขอสแกนและรายงานที่ดาวน์โหลดได้จะหมดอายุจากคลังคำขอสแกนหลังพ้นช่วงเวลาเก็บรักษา
- การสแกนที่เผยแพร่แล้วต้องมีสิทธิ์เข้าถึงการจัดการของเจ้าของ/ผู้เผยแพร่ หรืออำนาจผู้ดูแล/ผู้ดูแลระบบของแพลตฟอร์ม
- การสแกนที่เผยแพร่แล้วจะเขียนกลับเฉพาะเมื่อ `update: true` และการสแกนเสร็จสมบูรณ์สำเร็จ
- การตอบกลับคือ `202` พร้อม `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`
- งานสแกนเป็นแบบอะซิงโครนัส คำขอสแกนด้วยตนเองจะได้รับลำดับความสำคัญก่อนงานเผยแพร่/เติมย้อนหลังตามปกติ แต่การเสร็จสมบูรณ์ยังขึ้นอยู่กับความพร้อมของ worker

### `GET /api/v1/skills/-/scan/{scanId}`

เอนด์พอยต์สำรวจสถานะที่ต้องยืนยันตัวตนสำหรับการสแกนที่ส่งแล้ว

- ส่งคืนสถานะ queued/running/succeeded/failed
- ส่งคืน `queue.queuedAhead` และ `queue.position` ขณะอยู่ในคิว เพื่อให้ไคลเอนต์แสดงได้ว่ามีการสแกนด้วยตนเองแบบมีลำดับความสำคัญอยู่ข้างหน้าคำขอกี่รายการ คิวที่ใหญ่มากจะถูกจำกัดและรายงานด้วย `queuedAheadIsEstimate: true`
- เมื่อพร้อมใช้งาน `report` จะมีส่วน `clawscan`, `skillspector`, `staticAnalysis` และ `virustotal`
- งานสแกนที่ล้มเหลวจะส่งคืน `status: "failed"` พร้อม `lastError`

### `GET /api/v1/skills/-/scan/{scanId}/download`

เอนด์พอยต์ไฟล์เก็บถาวรรายงานที่ต้องยืนยันตัวตน

- ต้องเป็นการสแกนที่สำเร็จแล้ว การสแกนที่ยังไม่สิ้นสุดจะส่งคืน `409`
- ส่งคืน ZIP ที่มี `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

เอนด์พอยต์ไฟล์เก็บถาวรรายงานที่จัดเก็บไว้และต้องยืนยันตัวตนสำหรับเวอร์ชันที่ส่งแล้ว

- ต้องมีสิทธิ์เข้าถึงการจัดการของเจ้าของ/ผู้เผยแพร่สำหรับสกิลหรือ plugin หรืออำนาจผู้ดูแล/ผู้ดูแลระบบของแพลตฟอร์ม
- ส่งคืนผลการสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งมาตรงกันทุกประการ รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อนอยู่
- `kind` มีค่าเริ่มต้นเป็น `skill`; ใช้ `kind=plugin` สำหรับการสแกน plugin/แพ็กเกจ
- ส่งคืนรูปแบบ ZIP เดียวกับการดาวน์โหลดคำขอสแกน

### `POST /api/v1/skills/-/scan/batch`

เส้นทางสแกนซ้ำแบบชุดที่เป็นมาตรฐานสำหรับผู้ดูแลระบบเท่านั้น รองรับรูปแบบเพย์โหลดเดียวกับ `POST /api/v1/skills/-/rescan-batch` แบบเดิม

### `POST /api/v1/skills/-/scan/batch/status`

เส้นทางสถานะแบบชุดที่เป็นมาตรฐานสำหรับผู้ดูแลระบบเท่านั้น รองรับ `{ "jobIds": ["..."] }` และส่งคืนตัวนับรวมเดียวกับ `POST /api/v1/skills/-/rescan-batch/status` แบบเดิม

### `GET /api/v1/skills/{slug}/verify`

ส่งคืนซองตรวจสอบ Skill Card ที่ใช้โดย `clawhub skill verify`

พารามิเตอร์คำสืบค้น:

- `version` (ไม่บังคับ): สตริงเวอร์ชันเฉพาะ
- `tag` (ไม่บังคับ): แปลงเป็นเวอร์ชันที่ติดแท็กไว้ (เช่น `latest`)

หมายเหตุ:

- `ok` เป็น `true` เฉพาะเมื่อเวอร์ชันที่เลือกมี Skill Card ที่สร้างแล้ว ไม่ถูกการกลั่นกรองบล็อกว่าเป็นมัลแวร์ และการตรวจสอบ ClawScan เป็น clean
- ข้อมูลระบุตัวตนของสกิล ข้อมูลระบุตัวตนของผู้เผยแพร่ และเมทาดาทาเวอร์ชันที่เลือกเป็นฟิลด์ระดับบนสุดของซอง (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) เพื่อให้ระบบอัตโนมัติของเชลล์อ่านได้โดยไม่ต้องแกะ wrapper ที่ซ้อนกัน
- `security` คือผลตัดสิน ClawScan/ความปลอดภัยระดับบนสุด ระบบอัตโนมัติควรยึดตาม `ok`, `decision`, `reasons` และ `security.status`
- `security.signals` มีหลักฐานสนับสนุนจากสแกนเนอร์ เช่น `staticScan`, `virusTotal` และ `skillSpector`
- `security.signals.dependencyRegistry` ถูกคงไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่สแกนเนอร์ตรวจการมีอยู่ของรีจิสทรี dependency ถูกเลิกใช้แล้ว และคีย์นี้จะเป็น `null` เสมอ
- `provenance` เป็น `server-resolved-github-import` เฉพาะเมื่อ ClawHub แปลงและจัดเก็บ repo/ref/commit/path ของ GitHub ระหว่างการเผยแพร่หรือนำเข้า มิฉะนั้นจะเป็น `unavailable`

### `POST /api/v1/skills/-/security-verdicts`

ส่งคืนผลตัดสินความปลอดภัยแบบย่อปัจจุบันสำหรับเวอร์ชันสกิลที่ตรงกันทุกประการ
เอนด์พอยต์คอลเลกชันนี้มีไว้สำหรับไคลเอนต์ที่รู้อยู่แล้วว่าต้องแสดงเวอร์ชันสกิล ClawHub ที่ติดตั้งใดบ้าง เช่น OpenClaw Control UI

คำขอ:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

หมายเหตุ:

- `items` ต้องมีคู่ `{ slug, version }` ที่ไม่ซ้ำกัน 1-100 คู่
- ผลลัพธ์แยกตามรายการ สกิลหรือเวอร์ชันที่หายไปหนึ่งรายการจะไม่ทำให้การตอบกลับทั้งหมดล้มเหลว
- การตอบกลับมีเฉพาะความปลอดภัยเท่านั้น ไม่รวมข้อมูล Skill Card, สถานะการ์ดที่สร้างแล้ว, รายการไฟล์ artifact หรือเพย์โหลดสแกนเนอร์แบบละเอียด
- `security.signals` มีเฉพาะหลักฐานสนับสนุนระดับสถานะเท่านั้น ใช้ `/scan` หรือหน้า security-audit ของ ClawHub เพื่อดูรายละเอียดสแกนเนอร์ทั้งหมด
- `security.signals.dependencyRegistry` ถูกคงไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่สแกนเนอร์ตรวจการมีอยู่ของรีจิสทรี dependency ถูกเลิกใช้แล้ว และคีย์นี้จะเป็น `null` เสมอ
- การไม่มี Skill Card ไม่มีผลต่อ `ok`, `decision` หรือ `reasons` ของเอนด์พอยต์นี้ ไคลเอนต์ควรอ่าน `skill-card.md` ที่ติดตั้งไว้ในเครื่องเมื่อต้องการเนื้อหาการ์ด
- ใช้ `/verify` เมื่อต้องการซองตรวจสอบ Skill Card สำหรับสกิลเดียว, `/card` เมื่อต้องการ Markdown ของการ์ดที่สร้างแล้ว และ `/scan` เมื่อต้องการข้อมูลสแกนเนอร์แบบละเอียด

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

- ค่าเริ่มต้นเป็นเวอร์ชันล่าสุด
- ขีดจำกัดขนาดไฟล์: 200KB

### `GET /api/v1/packages`

ปลายทางแค็ตตาล็อกรวมสำหรับ:

- ทักษะ
- code plugins
- bundle plugins

พารามิเตอร์คิวรี:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended`, `trending`, `downloads`, นามแฝงแบบเดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อคำขอถูกจำกัดขอบเขตไปยังแพ็กเกจ Plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` หรือปลายทางแพ็กเกจที่มี
  `family=code-plugin`/`family=bundle-plugin`) หมวดหมู่ที่ควบคุมและนามแฝงตัวกรอง v1 แบบเดิมมีบันทึกไว้ภายใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` หรือ `sort` จะส่งคืน `400` พารามิเตอร์คิวรีที่ไม่รู้จักจะถูกละเว้น
- `GET /api/v1/code-plugins` และ `GET /api/v1/bundle-plugins` ยังคงเป็นนามแฝงแบบตระกูลคงที่
- รายการทักษะยังคงอิงกับรีจิสทรีทักษะ และยังเผยแพร่ได้เฉพาะผ่าน `POST /api/v1/skills`
- `POST /api/v1/packages` ยังคงใช้สำหรับรีลีส code-plugin และ bundle-plugin เท่านั้น
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถเห็นแพ็กเกจส่วนตัวสำหรับผู้เผยแพร่ที่ตนเป็นสมาชิกอยู่ในผลลัพธ์รายการ/การค้นหา
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ผ่านการยืนยันตัวตนมีสิทธิ์อ่าน

### `GET /api/v1/packages/search`

การค้นหาแค็ตตาล็อกรวมครอบคลุมทักษะ + แพ็กเกจ Plugin

พารามิเตอร์คิวรี:

- `q` (จำเป็น): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อคำขอถูกจำกัดขอบเขตไปยังแพ็กเกจ Plugin หมวดหมู่ที่ควบคุมและนามแฝงตัวกรอง v1 แบบเดิมมีบันทึกไว้ภายใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured` หรือ
  `highlightedOnly` จะส่งคืน `400` พารามิเตอร์คิวรีที่ไม่รู้จักจะถูกละเว้น
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถค้นหาแพ็กเกจส่วนตัวสำหรับผู้เผยแพร่ที่ตนเป็นสมาชิกอยู่ได้
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ผ่านการยืนยันตัวตนมีสิทธิ์อ่าน

### `GET /api/v1/plugins`

การเรียกดูแค็ตตาล็อกเฉพาะ Plugin ครอบคลุมแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์คิวรี:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `recommended` (ค่าเริ่มต้น), `trending`, `downloads`, `updated`, นามแฝงแบบเดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

นามแฝงตัวกรอง v1 แบบเดิมยังคงยอมรับบนปลายทางการอ่าน:

- `mcp-tooling`, `data` และ `automation` แปลงเป็น `tools`
- `observability` และ `deployment` แปลงเป็น `gateway`
- `dev-tools` แปลงเป็น `runtime`

`trending` เป็นลีดเดอร์บอร์ดการติดตั้ง/ดาวน์โหลดในช่วงเจ็ดวัน และไม่ใช้ยอดรวมตลอดเวลา
บนปลายทางรวม `/api/v1/packages` จะใช้ได้เฉพาะ Plugin เท่านั้น ให้ใช้
`/api/v1/skills?sort=trending` สำหรับแค็ตตาล็อกทักษะ

นามแฝงแบบเดิมไม่ได้รับการยอมรับเป็นค่าหมวดหมู่ที่จัดเก็บหรือที่ผู้เขียนประกาศไว้

### `GET /api/v1/skills/export`

การส่งออกทักษะสาธารณะล่าสุดเป็นชุดสำหรับการวิเคราะห์แบบออฟไลน์

การยืนยันตัวตน:

- ต้องใช้โทเค็น API

พารามิเตอร์คิวรี:

- `startDate` (จำเป็น): ขอบเขตล่างเป็นมิลลิวินาที Unix สำหรับ `updatedAt` ของทักษะ
- `endDate` (จำเป็น): ขอบเขตบนเป็นมิลลิวินาที Unix สำหรับ `updatedAt` ของทักษะ
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าจากการตอบกลับก่อนหน้า

การตอบกลับ:

- เนื้อหา: ไฟล์ ZIP
- ทักษะแต่ละรายการที่ส่งออกมีรากอยู่ที่ `{publisher}/{slug}/`
- ทักษะที่โฮสต์จะรวมไฟล์เวอร์ชันที่จัดเก็บล่าสุด และถูกระบุไว้ใน
  `_manifest.json` พร้อม `sourceRef: "public-clawhub"`
- ทักษะปัจจุบันที่อิงกับ GitHub ซึ่งมีการสแกนเป็น `clean` หรือ `suspicious` จะรวม
  `_source_handoff.json` พร้อม `sourceRef: "public-github"`, repo, commit, path,
  แฮชเนื้อหา และ URL ของไฟล์เก็บถาวร โดยจะไม่รวมไฟล์ซอร์สที่โฮสต์โดย ClawHub
- ทักษะแต่ละรายการจะรวม `_export_skill_meta.json`
- `_manifest.json` จะถูกรวมไว้ที่รากของ ZIP เสมอ
- `_errors.json` จะถูกรวมไว้เมื่อไม่สามารถส่งออกทักษะหรือไฟล์บางรายการได้

ส่วนหัว:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

ส่งออกรีลีส Plugin สาธารณะล่าสุดแบบเป็นชุดสำหรับการวิเคราะห์แบบออฟไลน์

การยืนยันตัวตน:

- ต้องใช้โทเค็น API

พารามิเตอร์คำค้น:

- `startDate` (จำเป็น): ขอบเขตล่างของ `updatedAt` ของ Plugin เป็นมิลลิวินาที Unix
- `endDate` (จำเป็น): ขอบเขตบนของ `updatedAt` ของ Plugin เป็นมิลลิวินาที Unix
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้นคือ `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าจากการตอบกลับก่อนหน้า
- `family` (ไม่บังคับ): `code-plugin` หรือ `bundle-plugin` หากละไว้หมายถึงทั้งสอง
  ตระกูล Plugin

การตอบกลับ:

- เนื้อหา: ไฟล์เก็บถาวร ZIP
- Plugin ที่ส่งออกแต่ละรายการมีรากอยู่ที่ `{family}/{packageName}/`
- Plugin ที่ส่งออกแต่ละรายการรวมไฟล์ที่จัดเก็บของรีลีสล่าสุดไว้ด้วย
- เมตาดาต้าการส่งออกต่อ Plugin จัดเก็บไว้ที่
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

การค้นหาเฉพาะ Plugin ในแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์คำค้น:

- `q` (จำเป็น): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

หมายเหตุ:

- นามแฝงตัวกรอง v1 เดิมที่จัดทำเอกสารไว้ใต้ `GET /api/v1/plugins` ยัง
  ยอมรับได้เช่นกัน
- การกรองหมวดหมู่เป็นตัวกรอง API จริงที่รองรับด้วยแถวไดเจสต์หมวดหมู่ Plugin
  ไม่ใช่การเขียนคำค้นใหม่
- ผลลัพธ์จะส่งคืนตามลำดับความเกี่ยวข้อง และปัจจุบันยังไม่มีการแบ่งหน้า
- ตัวควบคุมการเรียงลำดับ UI ของเบราว์เซอร์สำหรับการค้นหา Plugin จะจัดเรียงผลลัพธ์ความเกี่ยวข้องที่โหลดแล้วใหม่
  ให้ตรงกับพฤติกรรมการเรียกดู `/skills` ปัจจุบัน

### `GET /api/v1/packages/{name}`

ส่งคืนเมตาดาต้ารายละเอียดแพ็กเกจ

หมายเหตุ:

- Skills สามารถ resolve ผ่านเส้นทางนี้ในแค็ตตาล็อกแบบรวมได้เช่นกัน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่าน publisher ที่เป็นเจ้าของได้

### `DELETE /api/v1/packages/{name}`

ลบแพ็กเกจและรีลีสทั้งหมดแบบ soft delete

หมายเหตุ:

- ต้องใช้โทเค็น API สำหรับเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแล publisher ขององค์กร,
  ผู้ดูแลแพลตฟอร์ม หรือผู้ดูแลระบบแพลตฟอร์ม

### `GET /api/v1/packages/{name}/versions`

ส่งคืนประวัติเวอร์ชัน

พารามิเตอร์คำค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

หมายเหตุ:

- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่าน publisher ที่เป็นเจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}`

ส่งคืนแพ็กเกจหนึ่งเวอร์ชัน รวมถึงเมตาดาต้าไฟล์ ความเข้ากันได้
การยืนยัน เมตาดาต้าอาร์ติแฟกต์ และข้อมูลการสแกน

หมายเหตุ:

- `version.artifact.kind` เป็น `legacy-zip` สำหรับไฟล์เก็บถาวรแพ็กเกจแบบเก่า หรือ
  `npm-pack` สำหรับรีลีสที่รองรับด้วย ClawPack
- รีลีส ClawPack รวมฟิลด์ที่เข้ากันได้กับ npm ได้แก่ `npmIntegrity`, `npmShasum` และ
  `npmTarballName`
- `version.sha256hash` เป็นเมตาดาต้าความเข้ากันได้ที่เลิกแนะนำแล้วสำหรับไคลเอนต์เก่า โดยจะ
  แฮชไบต์ ZIP ตรงตามที่ `/api/v1/packages/{name}/download` ส่งคืน
  ไคลเอนต์สมัยใหม่ควรใช้ `version.artifact.sha256` ซึ่งระบุ
  อาร์ติแฟกต์รีลีสมาตรฐาน
- `version.vtAnalysis`, `version.llmAnalysis` และ `version.staticScan` จะ
  ถูกรวมไว้เมื่อมีข้อมูลการสแกน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่าน publisher ที่เป็นเจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}/security`

ส่งคืนสรุปความปลอดภัยและความเชื่อถือของรีลีสแพ็กเกจที่แน่นอนสำหรับไคลเอนต์ติดตั้ง
นี่คือพื้นผิวการใช้งานสาธารณะของ OpenClaw สำหรับตัดสินใจว่า
รีลีสที่ resolve แล้วสามารถติดตั้งได้หรือไม่

การยืนยันตัวตน:

- ปลายทางอ่านแบบสาธารณะ ไม่ต้องใช้โทเค็นของเจ้าของ, publisher, ผู้ดูแล หรือผู้ดูแลระบบ

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
  รีลีสที่แน่นอนซึ่งได้รับการประเมิน
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` และ `release.npmTarballName` จะมีอยู่เมื่อทราบสำหรับ
  อาร์ติแฟกต์รีลีส
- `trust.scanStatus` คือสถานะความเชื่อถือที่มีผล ซึ่งได้มาจากอินพุตของสแกนเนอร์
  และการกลั่นกรองรีลีสด้วยตนเอง
- `trust.moderationState` เป็นค่าว่างได้ โดยเป็น `null` เมื่อไม่มี
  การกลั่นกรองรีลีสด้วยตนเอง
- `trust.blockedFromDownload` คือสัญญาณบล็อกการติดตั้ง OpenClaw และไคลเอนต์ติดตั้งอื่นๆ
  ควรบล็อกการติดตั้งเมื่อค่านี้เป็น `true` แทนการ
  คำนวณกฎการบล็อกใหม่จากฟิลด์สแกนเนอร์หรือการกลั่นกรอง
- `trust.reasons` คือรายการคำอธิบายสำหรับผู้ใช้และการตรวจสอบ โค้ดเหตุผล
  เป็นสตริงที่เสถียรและกะทัดรัด เช่น `manual:quarantined`, `scan:malicious`
  และ `package:malicious`
- `trust.pending` หมายความว่าอินพุตความเชื่อถืออย่างน้อยหนึ่งรายการยังรอการดำเนินการให้เสร็จ
- `trust.stale` หมายความว่าสรุปความเชื่อถือคำนวณจากอินพุตที่ล้าสมัย และ
  ควรถือว่าต้องรีเฟรชก่อนตัดสินใจอนุญาตด้วยความมั่นใจสูง

หมายเหตุ:

- ปลายทางนี้เจาะจงเวอร์ชัน ไคลเอนต์ควรเรียกใช้หลังจาก resolve
  เวอร์ชันแพ็กเกจที่ตั้งใจจะติดตั้ง ไม่ใช่แค่หลังจากอ่าน
  เมตาดาต้าแพ็กเกจล่าสุด
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่าน publisher ที่เป็นเจ้าของได้
- ปลายทางนี้ตั้งใจให้แคบกว่าปลายทางการกลั่นกรองของเจ้าของ/ผู้ดูแล
  โดยเปิดเผยการตัดสินใจติดตั้งและคำอธิบายสาธารณะ ไม่ใช่
  ตัวตนผู้รายงาน เนื้อหารายงาน หลักฐานส่วนตัว หรือไทม์ไลน์การตรวจสอบภายใน

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

ส่งคืนเมตาดาต้า resolver อาร์ติแฟกต์แบบชัดเจนสำหรับเวอร์ชันแพ็กเกจ

หมายเหตุ:

- เวอร์ชันแพ็กเกจเดิมจะส่งคืนอาร์ติแฟกต์ `legacy-zip` และ
  `downloadUrl` ของ ZIP เดิม
- เวอร์ชัน ClawPack จะส่งคืนอาร์ติแฟกต์ `npm-pack`, ฟิลด์ integrity ของ npm,
  `tarballUrl` และ URL ความเข้ากันได้ของ ZIP เดิม
- นี่คือพื้นผิว resolver ของ OpenClaw ซึ่งหลีกเลี่ยงการเดารูปแบบไฟล์เก็บถาวรจาก
  URL ที่ใช้ร่วมกัน

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ดาวน์โหลดอาร์ติแฟกต์เวอร์ชันผ่านพาธ resolver แบบชัดเจน

หมายเหตุ:

- เวอร์ชัน ClawPack จะสตรีมไบต์ `.tgz` ของ npm-pack ที่อัปโหลดไว้อย่างแน่นอน
- เวอร์ชัน ZIP เดิมจะเปลี่ยนเส้นทางไปยัง `/api/v1/packages/{name}/download?version=`
- ใช้บัคเก็ตอัตราการดาวน์โหลด

### `GET /api/v1/packages/{name}/readiness`

ส่งคืน readiness ที่คำนวณแล้วสำหรับการใช้งาน OpenClaw ในอนาคต

การตรวจสอบ readiness ครอบคลุม:

- สถานะแชนเนลทางการ
- ความพร้อมใช้งานของเวอร์ชันล่าสุด
- ความพร้อมใช้งานของอาร์ติแฟกต์ ClawPack npm-pack
- ไดเจสต์อาร์ติแฟกต์
- ที่มาของรีโปซอร์สและคอมมิต
- เมตาดาต้าความเข้ากันได้กับ OpenClaw
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

- `bundledPluginId` จะถูกทำให้เป็นตัวพิมพ์เล็กและเป็นคีย์ upsert ที่เสถียร
- `packageName` จะถูกปรับให้อยู่ในรูปแบบชื่อ npm; แพ็กเกจอาจไม่มีสำหรับการย้ายที่วางแผนไว้
- สิ่งนี้ติดตามเฉพาะ readiness ของการย้ายเท่านั้น ไม่ได้แก้ไข OpenClaw หรือสร้าง
  ClawPacks

### `GET /api/v1/packages/moderation/queue`

ปลายทางผู้ดูแล/ผู้ดูแลระบบสำหรับคิวตรวจสอบรีลีสแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คำค้น:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `blocked`, `manual` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

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

รายงานแพ็กเกจเพื่อให้ผู้ดูแลตรวจสอบ รายงานอยู่ระดับแพ็กเกจ และอาจ
เชื่อมโยงกับเวอร์ชันได้ รายงานจะป้อนเข้าสู่คิวการกลั่นกรอง แต่ไม่ซ่อนหรือ
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

endpoint สำหรับ moderator/admin เพื่อรับรายงานแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้ API token สำหรับผู้ใช้ที่เป็น moderator หรือ admin

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

endpoint สำหรับเจ้าของ/moderator เพื่อดูสถานะการดูแลแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้ API token สำหรับเจ้าของแพ็กเกจ, สมาชิก publisher, moderator หรือ
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

endpoint สำหรับ moderator/admin เพื่อแก้ไขสถานะหรือเปิดรายงานแพ็กเกจอีกครั้ง

คำขอ:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

ต้องระบุ `note` สำหรับ `confirmed` และ `dismissed`; สามารถละไว้ได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "quarantine"` หรือ
`finalAction: "revoke"` พร้อมรายงานที่ยืนยันแล้วเพื่อใช้การดูแล release ใน
workflow เดียวกันที่ตรวจสอบย้อนหลังได้

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

endpoint สำหรับ moderator/admin เพื่อรีวิว release ของแพ็กเกจ

คำขอ:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

สถานะที่รองรับ:

- `approved`: ตรวจสอบด้วยตนเองแล้วและอนุญาต
- `quarantined`: ถูกบล็อกระหว่างรอการติดตามผล
- `revoked`: ถูกบล็อกหลังจาก release เคยได้รับความไว้วางใจมาก่อน

release ที่ถูกกักกันและถูกเพิกถอนจะส่งคืน `403` จาก route ดาวน์โหลด artifact
ทุกการเปลี่ยนแปลงจะเขียนรายการ audit log

### `GET /api/v1/packages/{name}/file`

ส่งคืนเนื้อหาข้อความดิบสำหรับไฟล์แพ็กเกจ

พารามิเตอร์ Query:

- `path` (บังคับ)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือ release ล่าสุด
- ใช้บัคเก็ตอัตราการอ่าน ไม่ใช่บัคเก็ตการดาวน์โหลด
- ไฟล์ไบนารีส่งคืน `415`
- ขีดจำกัดขนาดไฟล์: 200KB
- การสแกน VirusTotal ที่รอดำเนินการไม่บล็อกการอ่าน; release ที่เป็นอันตรายอาจยังถูกระงับไว้ในที่อื่น
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะอ่าน publisher เจ้าของได้

### `GET /api/v1/packages/{name}/download`

ดาวน์โหลด archive ZIP แบบ deterministic เดิมสำหรับ release ของแพ็กเกจ

พารามิเตอร์ Query:

- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือ release ล่าสุด
- Skills เปลี่ยนทางไปยัง `GET /api/v1/download`
- archive ของ Plugin/แพ็กเกจเป็นไฟล์ zip ที่มี root `package/` เพื่อให้ไคลเอนต์
  OpenClaw รุ่นเก่ายังทำงานต่อได้
- route นี้ยังคงเป็น ZIP เท่านั้น ไม่ stream ไฟล์ ClawPack `.tgz`
- การตอบกลับมี header `ETag`, `Digest`, `X-ClawHub-Artifact-Type` และ
  `X-ClawHub-Artifact-Sha256` สำหรับการตรวจสอบความสมบูรณ์ของ resolver
- metadata ที่มีเฉพาะใน registry จะไม่ถูก inject เข้าไปใน archive ที่ดาวน์โหลด
- การสแกน VirusTotal ที่รอดำเนินการไม่บล็อกการดาวน์โหลด; release ที่เป็นอันตรายส่งคืน `403`
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะเป็นเจ้าของ

### `GET /api/npm/{package}`

ส่งคืน packument ที่เข้ากันได้กับ npm สำหรับเวอร์ชันแพ็กเกจที่อิง ClawPack

หมายเหตุ:

- แสดงเฉพาะเวอร์ชันที่มี tarball ClawPack npm-pack อัปโหลดไว้
- เวอร์ชันเดิมที่มีเฉพาะ ZIP ถูกละไว้โดยตั้งใจ
- `dist.tarball`, `dist.integrity` และ `dist.shasum` ใช้ฟิลด์ที่เข้ากันได้กับ npm
  เพื่อให้ผู้ใช้ชี้ npm ไปยัง mirror ได้หากเลือกทำเช่นนั้น
- packument ของแพ็กเกจแบบ scoped รองรับทั้ง path คำขอ `/api/npm/@scope/name` และ
  `/api/npm/@scope%2Fname` ที่เข้ารหัสแบบ npm

### `GET /api/npm/{package}/-/{tarball}.tgz`

stream ไบต์ tarball ClawPack ที่อัปโหลดไว้แบบตรงทุกไบต์สำหรับไคลเอนต์ npm mirror

หมายเหตุ:

- ใช้บัคเก็ตอัตราการดาวน์โหลด
- header การดาวน์โหลดมี SHA-256 ของ ClawHub พร้อม metadata integrity/shasum ของ npm
- การดูแลและการตรวจสอบสิทธิ์เข้าถึงแพ็กเกจส่วนตัวยังคงมีผล

### `GET /api/v1/resolve`

CLI ใช้เพื่อ map fingerprint ในเครื่องกับเวอร์ชันที่รู้จัก

พารามิเตอร์ Query:

- `slug` (บังคับ)
- `hash` (บังคับ): sha256 แบบ hex 64 อักขระของ fingerprint ของ bundle

การตอบกลับ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ดาวน์โหลด ZIP ของเวอร์ชัน skill ที่โฮสต์ไว้ หรือส่งคืนการส่งต่อไปยังซอร์ส GitHub สำหรับ
skill ปัจจุบันที่อิง GitHub ซึ่งมีผลสแกน `clean` หรือ `suspicious` และไม่มี
เวอร์ชันที่โฮสต์ไว้

พารามิเตอร์ Query:

- `slug` (บังคับ)
- `version` (ไม่บังคับ): สตริง semver
- `tag` (ไม่บังคับ): ชื่อแท็ก (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- เวอร์ชันที่ soft-delete แล้วส่งคืน `410`
- การส่งต่อ skill ที่อิง GitHub จะไม่ proxy หรือ mirror ไบต์ การตอบกลับ JSON
  มี `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  และ `archiveUrl`; สถานะ scan/current เป็น gate และไม่ได้รวมเป็น metadata payload
  เมื่อสำเร็จ
- สถิติการดาวน์โหลดนับเป็นตัวตนที่ไม่ซ้ำต่อวัน UTC (`userId` เมื่อ API token ถูกต้อง มิฉะนั้นใช้ IP)

## endpoint การยืนยันตัวตน (Bearer token)

endpoint ทั้งหมดต้องใช้:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

ตรวจสอบ token และส่งคืน handle ของผู้ใช้

### `POST /api/v1/skills`

เผยแพร่เวอร์ชันใหม่

- แนะนำ: `multipart/form-data` พร้อม JSON `payload` + blob `files[]`
- ยอมรับ body JSON ที่มี `files` (อิง storageId) เช่นกัน
- ฟิลด์ payload ไม่บังคับ: `ownerHandle` เมื่อมีอยู่ API จะ resolve publisher นั้น
  ฝั่งเซิร์ฟเวอร์และกำหนดให้นักแสดงมีสิทธิ์เข้าถึง publisher
- ฟิลด์ payload ไม่บังคับ: `migrateOwner` เมื่อเป็น `true` พร้อม `ownerHandle`
  skill ที่มีอยู่สามารถย้ายไปยังเจ้าของนั้นได้ หากนักแสดงเป็น admin/owner ทั้งใน
  publisher ปัจจุบันและเป้าหมาย หากไม่มี opt-in นี้ การเปลี่ยนเจ้าของจะถูกปฏิเสธ

### `POST /api/v1/packages`

เผยแพร่ release ของ code-plugin หรือ bundle-plugin

- ต้องใช้การยืนยันตัวตนด้วย Bearer token
- ต้องใช้ `multipart/form-data`
- ฟิลด์ฟอร์มที่อนุญาตคือ `payload`, blob `files` ซ้ำหลายรายการ หรือการอ้างอิง tarball
  `clawpack` หนึ่งรายการ `clawpack` อาจเป็น blob `.tgz` หรือ storage id ที่ส่งคืนจาก
  flow upload-url การเผยแพร่ด้วย storage-id ที่ staged ไว้ต้องมี
  `clawpackUploadTicket` ที่ส่งคืนพร้อม URL อัปโหลดนั้นด้วย
- ใช้ `files` หรือ `clawpack` อย่างใดอย่างหนึ่ง ห้ามใช้ทั้งคู่ในคำขอเดียวกัน
- body JSON และ metadata `payload.files` / `payload.artifact` ที่ผู้เรียกส่งมา
  จะถูกปฏิเสธ
- คำขอเผยแพร่ multipart โดยตรงจำกัดที่ 18MB tarball ClawPack สามารถ
  ใช้ flow upload-url ได้ถึงขีดจำกัด tarball 120MB
- ฟิลด์ payload ไม่บังคับ: `ownerHandle` เมื่อมีอยู่ เฉพาะ admin เท่านั้นที่เผยแพร่ในนามเจ้าของนั้นได้

จุดสำคัญของการตรวจสอบ:

- `family` ต้องเป็น `code-plugin` หรือ `bundle-plugin`
- แพ็กเกจ Plugin ต้องมี `openclaw.plugin.json` การอัปโหลด ClawPack `.tgz` ต้อง
  มีไฟล์นี้ที่ `package/openclaw.plugin.json`
- Code plugins ต้องมี `package.json`, metadata ของ source repo, metadata ของ source commit,
  metadata ของ config schema, `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion`
- `openclaw.hostTargets` และ `openclaw.environment` เป็น metadata ไม่บังคับ
- เฉพาะ publisher ของ org `openclaw` และ publisher ส่วนตัวของสมาชิก org `openclaw`
  ปัจจุบันเท่านั้นที่เผยแพร่ไปยัง channel `official` ได้
- การเผยแพร่ในนามผู้อื่นยังคงตรวจสอบสิทธิ์ channel official กับบัญชีเจ้าของเป้าหมาย

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

soft-delete / กู้คืน skill (เจ้าของ, moderator หรือ admin)

body JSON ไม่บังคับ:

```json
{ "reason": "Held for moderation pending legal review." }
```

เมื่อมี `reason` จะถูกเก็บเป็นหมายเหตุการดูแล skill และคัดลอกเข้า audit log
การ soft delete ที่เจ้าของเริ่มต้นจะสงวน slug ไว้ 30 วัน จากนั้น publisher อื่นจึงสามารถอ้างสิทธิ์
slug ได้ การตอบกลับการลบมี `slugReservedUntil` เมื่อวันหมดอายุนี้มีผล
การซ่อนโดย moderator/admin และการลบเพื่อความปลอดภัยจะไม่หมดอายุในลักษณะนี้

การตอบกลับการลบ:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

รหัสสถานะ:

- `200`: ok
- `401`: unauthorized
- `403`: forbidden
- `404`: ไม่พบ skill/user
- `500`: ข้อผิดพลาดภายในเซิร์ฟเวอร์

### `POST /api/v1/users/publisher`

สำหรับ admin เท่านั้น ตรวจสอบให้แน่ใจว่ามี publisher ของ org สำหรับ handle หาก handle ยังชี้ไปยัง
ผู้ใช้ร่วมเดิม/publisher ส่วนตัวเดิม endpoint จะ migrate ไปเป็น publisher ของ org ก่อน
สำหรับ org ที่สร้างใหม่ ให้ระบุ `memberHandle`; admin ที่ดำเนินการจะไม่ถูกเพิ่มเป็นสมาชิก
`memberRole` มีค่าเริ่มต้นเป็น `owner`

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

การสร้าง publisher ของ org แบบ self-serve ที่ยืนยันตัวตนแล้ว สร้าง publisher ของ org ใหม่และเพิ่ม
ผู้เรียกเป็นเจ้าของ endpoint นี้ไม่ migrate handle ของผู้ใช้/ส่วนตัวที่มีอยู่และไม่
ทำเครื่องหมาย publisher ว่า trusted/official

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- ส่งคืน `409` เมื่อ handle ถูกใช้โดย publisher, user หรือ personal publisher อยู่แล้ว

### `POST /api/v1/users/reserve`

สำหรับ admin เท่านั้น สงวน root slug และชื่อแพ็กเกจให้เจ้าของที่มีสิทธิ์โดยไม่เผยแพร่
release ชื่อแพ็กเกจจะกลายเป็นแพ็กเกจ placeholder ส่วนตัวที่ไม่มีแถว release เพื่อให้เจ้าของเดิม
สามารถเผยแพร่ release code-plugin หรือ bundle-plugin จริงลงในชื่อนั้นได้ภายหลัง

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

สำหรับ admin เท่านั้น กู้คืน publisher ส่วนตัวสำหรับ GitHub OAuth principal ทดแทนที่ตรวจสอบแล้ว
โดยไม่แก้ไขแถวบัญชี Convex Auth คำขอต้องระบุ id บัญชี provider GitHub แบบ immutable ทั้งสองค่า;
handle ที่เปลี่ยนแปลงได้ใช้เป็น guard สำหรับ operator เท่านั้น

ปลายทางนี้มีค่าเริ่มต้นเป็นโหมด dry-run การใช้การกู้คืนจริงต้องระบุ `dryRun: false` และ
`confirmIdentityVerified: true` หลังจากเจ้าหน้าที่ตรวจสอบความต่อเนื่องระหว่าง
GitHub principals ทั้งสองรายโดยอิสระแล้ว การกู้คืนจะปิดอย่างปลอดภัยเมื่อผู้เผยแพร่ส่วนบุคคลปัจจุบัน
ของผู้ใช้ปลายทางมีสกิล แพ็กเกจ หรือแหล่งที่มาของสกิล GitHub
การกู้คืนยังย้ายฟิลด์ `ownerUserId` เดิมสำหรับสกิลของผู้เผยแพร่ที่กู้คืน,
นามแฝง slug ของสกิล, แพ็กเกจ, คำเตือนจากตัวตรวจสอบแพ็กเกจ และแถว digest การค้นหาที่ได้มา เพื่อให้
เส้นทาง direct-owner ตรงกับอำนาจของผู้เผยแพร่ใหม่ การจอง protected-handle
ที่ใช้งานอยู่สำหรับแฮนเดิลที่กู้คืนจะถูกมอบหมายใหม่ให้ผู้ใช้ทดแทนด้วย เพื่อให้การซิงโครไนซ์
โปรไฟล์ภายหลังไม่สามารถกู้คืนอำนาจที่แข่งขันกันของผู้ใช้เดิมได้ แต่ละตารางหลักถูกจำกัดไว้ที่
100 แถวต่อธุรกรรม apply; การกู้คืนที่ใหญ่กว่านี้ต้องใช้ owner migration แบบทำต่อได้ก่อน
แหล่งที่มาของสกิล GitHub มีขอบเขตตามผู้เผยแพร่ และถูกรายงานว่าตรวจสอบแล้วแทนที่จะถูกเขียนใหม่

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

- ปลายทางทั้งสองต้องใช้การยืนยันตัวตนด้วยโทเค็น API และใช้งานได้เฉพาะกับเจ้าของสกิลเท่านั้น
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

แบนผู้ใช้และลบสกิลที่เป็นเจ้าของแบบถาวร (เฉพาะ moderator/admin)

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

ยกเลิกการแบนผู้ใช้และกู้คืนสกิลที่เข้าเกณฑ์ (เฉพาะ admin)

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

พารามิเตอร์ query:

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

เพิ่ม/ลบดาว (ไฮไลต์) ปลายทางทั้งสองเป็น idempotent

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

ดู `DEPRECATIONS.md` สำหรับแผนการนำออก

`POST /api/cli/upload-url` ส่งคืน `uploadUrl` และ `uploadTicket` การเผยแพร่แพ็กเกจ
ที่ stage ไฟล์ tarball ของ ClawPack ต้องส่ง storage id ที่ได้เป็น
`clawpack` และ ticket ที่ส่งคืนเป็น `clawpackUploadTicket`

## การค้นพบ registry (`/.well-known/clawhub.json`)

CLI สามารถค้นพบการตั้งค่า registry/auth จากไซต์ได้:

- `/.well-known/clawhub.json` (JSON, แนะนำ)
- `/.well-known/clawdhub.json` (เดิม)

สคีมา:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

หากคุณโฮสต์เอง ให้ให้บริการไฟล์นี้ (หรือตั้งค่า `CLAWHUB_REGISTRY` อย่างชัดเจน; เดิมคือ `CLAWDHUB_REGISTRY`)
