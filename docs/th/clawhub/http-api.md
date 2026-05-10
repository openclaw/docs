---
read_when:
    - การเพิ่ม/เปลี่ยนแปลงเอนด์พอยต์
    - การดีบักคำขอระหว่าง CLI ↔ รีจิสทรี
summary: เอกสารอ้างอิง HTTP API (เอนด์พอยต์สาธารณะ + เอนด์พอยต์ CLI + การยืนยันตัวตน).
x-i18n:
    generated_at: "2026-05-10T19:26:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1580df58fe2342858dd2c86ebaf659993157b11508c0fc03530e541bd0118ae
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

URL พื้นฐาน: `https://clawhub.ai` (ค่าเริ่มต้น)

พาธ v1 ทั้งหมดอยู่ใต้ `/api/v1/...`
`/api/...` และ `/api/cli/...` แบบเดิมยังคงอยู่เพื่อความเข้ากันได้ (ดู `DEPRECATIONS.md`)
OpenAPI: `/api/v1/openapi.json`

## การใช้แคตตาล็อกสาธารณะซ้ำ

ไดเรกทอรีของบุคคลที่สามอาจใช้เอนด์พอยต์อ่านแบบสาธารณะเพื่อแสดงรายการหรือค้นหา Skills ของ ClawHub โปรดแคชผลลัพธ์ เคารพ `429`/`Retry-After` ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ต้นทาง (`https://clawhub.ai/<owner>/<slug>`) และหลีกเลี่ยงการสื่อว่า ClawHub รับรองเว็บไซต์ของบุคคลที่สาม อย่าพยายามทำสำเนาเนื้อหาที่ซ่อน เป็นส่วนตัว หรือถูกบล็อกโดยการกลั่นกรองไว้ภายนอกพื้นผิว API สาธารณะ

ชอร์ตคัต slug บนเว็บจะ resolve ข้ามตระกูลรีจิสทรี แต่ไคลเอนต์ API ควรใช้
URL ต้นทางที่เอนด์พอยต์อ่านส่งกลับ แทนการสร้างลำดับความสำคัญของ route
ขึ้นมาใหม่

## ขีดจำกัดอัตรา

โมเดลการบังคับใช้:

- คำขอแบบไม่ระบุตัวตน: บังคับใช้ต่อ IP
- คำขอที่ผ่านการยืนยันตัวตนแล้ว (Bearer token ที่ถูกต้อง): บังคับใช้ต่อ bucket ของผู้ใช้
- หาก token ขาดหาย/ไม่ถูกต้อง พฤติกรรมจะถอยกลับไปใช้การบังคับใช้ตาม IP
- เอนด์พอยต์เขียนที่ผ่านการยืนยันตัวตนแล้วไม่ควรส่งคืนเพียง `Unauthorized` เปล่า ๆ เมื่อ
  เซิร์ฟเวอร์รู้เหตุผล Token ที่ขาดหาย, token ที่ไม่ถูกต้อง/ถูกเพิกถอน และ
  บัญชีที่ถูกลบ/ถูกแบน/ถูกปิดใช้งาน ควรได้ข้อความที่นำไปดำเนินการได้ เพื่อให้ไคลเอนต์
  CLI บอกผู้ใช้ได้ว่าอะไรบล็อกพวกเขาอยู่

- อ่าน: 600/นาที ต่อ IP, 2400/นาที ต่อคีย์
- เขียน: 45/นาที ต่อ IP, 180/นาที ต่อคีย์
- ดาวน์โหลด: 30/นาที ต่อ IP, 180/นาที ต่อคีย์ (`/api/v1/download`)

Headers:

- ความเข้ากันได้แบบเดิม: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- แบบมาตรฐาน: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- เมื่อเป็น `429`: `Retry-After`

ความหมายของ header:

- `X-RateLimit-Reset`: วินาที Unix epoch แบบสัมบูรณ์
- `RateLimit-Reset`: จำนวนวินาทีจนกว่าจะ reset (delay)
- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่ (delay) เมื่อเป็น `429`

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

- หากมี `Retry-After` ให้รอตามจำนวนวินาทีนั้นก่อนลองใหม่
- ใช้ backoff ที่มี jitter เพื่อหลีกเลี่ยงการลองใหม่พร้อมกัน
- หากไม่มี `Retry-After` ให้ถอยไปใช้ `RateLimit-Reset` (หรือคำนวณจาก `X-RateLimit-Reset`)

แหล่งที่มาของ IP:

- ใช้ `cf-connecting-ip` (Cloudflare) เป็น IP ของไคลเอนต์โดยค่าเริ่มต้น
- ClawHub ใช้ forwarding headers ที่เชื่อถือได้เพื่อระบุ IP ของไคลเอนต์ที่ edge
- หากไม่มี IP ไคลเอนต์ที่เชื่อถือได้ คำขอดาวน์โหลดแบบไม่ระบุตัวตนจะใช้ bucket สำรองที่ scoped ต่อเอนด์พอยต์แทน bucket `ip:unknown` ส่วนกลางหนึ่งรายการ คำขออ่าน/เขียนแบบไม่ระบุตัวตนยังคงใช้ bucket unknown ร่วมกัน เพื่อให้ routing ที่ขาด IP ยังคงมองเห็นได้และเป็นไปอย่างระมัดระวัง

## เอนด์พอยต์สาธารณะ (ไม่ต้องยืนยันตัวตน)

### `GET /api/v1/search`

พารามิเตอร์ query:

- `q` (จำเป็น): สตริง query
- `limit` (ไม่บังคับ): จำนวนเต็ม
- `highlightedOnly` (ไม่บังคับ): `true` เพื่อกรองให้เหลือเฉพาะ Skills ที่ไฮไลต์
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias เดิมของ `nonSuspiciousOnly`

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
      "updatedAt": 1730000000000
    }
  ]
}
```

หมายเหตุ:

- ผลลัพธ์ถูกส่งคืนตามลำดับความเกี่ยวข้อง (embedding similarity + การ boost token ของ slug/name ที่ตรงแบบ exact + popularity prior จากยอดดาวน์โหลด)
- ความเกี่ยวข้องมีน้ำหนักมากกว่าความนิยม การจับคู่ token ของ slug หรือ display-name ที่แม่นยำสามารถอยู่เหนือการจับคู่ที่หลวมกว่าแต่มีดาวน์โหลดมากกว่ามากได้
- ข้อความ ASCII จะถูก tokenize ตามขอบเขตคำและเครื่องหมายวรรคตอน ตัวอย่างเช่น `personal-map` มี token `map` แบบเดี่ยว ในขณะที่ `amap-jsapi-skill` มี `amap`, `jsapi` และ `skill`; ดังนั้นการค้นหา `map` จะให้ `personal-map` มีการจับคู่เชิงคำศัพท์ที่แรงกว่า `amap-jsapi-skill`
- ยอดดาวน์โหลดถูกใช้เป็น prior และตัวตัดสินกรณีคะแนนเท่ากันแบบ log-scaled ขนาดเล็ก ไม่ใช่สัญญาณหลักในการจัดอันดับ Skills ที่มียอดดาวน์โหลดสูงอาจอยู่ต่ำกว่าเมื่อข้อความ query เป็นการจับคู่ที่อ่อนกว่า
- สถานะการกลั่นกรองที่น่าสงสัยหรือถูกซ่อนอาจลบ Skill ออกจากการค้นหาสาธารณะ ขึ้นกับตัวกรองของผู้เรียกและสถานะการกลั่นกรองปัจจุบัน

คำแนะนำด้านการค้นพบสำหรับผู้เผยแพร่:

- ใส่คำที่ผู้ใช้จะค้นหาจริง ๆ ไว้ใน display name, summary และ tags ใช้ token slug แบบเดี่ยวเฉพาะเมื่อมันเป็นตัวตนที่เสถียรที่คุณต้องการเก็บไว้ด้วย
- อย่าเปลี่ยนชื่อ slug เพียงเพื่อไล่ตาม query หนึ่งรายการ เว้นแต่ slug ใหม่จะเป็นชื่อ canonical ระยะยาวที่ดีกว่า Slug เก่าจะกลายเป็น redirect aliases แต่ URL canonical, slug ที่แสดง และ search digests ในอนาคตจะใช้ slug ใหม่
- Rename aliases รักษาการ resolve สำหรับ URL เก่าและการติดตั้งที่ resolve ผ่านรีจิสทรี แต่การจัดอันดับค้นหาจะอิง metadata ของ Skill canonical หลังจากการเปลี่ยนชื่อถูกจัดทำดัชนีแล้ว สถิติเดิมจะยังอยู่กับ Skill
- หาก Skill มองไม่เห็นโดยไม่คาดคิด ให้ตรวจสอบสถานะการกลั่นกรองก่อนด้วย `clawhub inspect <slug>` ขณะเข้าสู่ระบบ ก่อนเปลี่ยน metadata ที่เกี่ยวกับการจัดอันดับ

### `GET /api/v1/skills`

พารามิเตอร์ query:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–200)
- `cursor` (ไม่บังคับ): cursor สำหรับการแบ่งหน้าสำหรับ sort ใด ๆ ที่ไม่ใช่ `trending`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias เดิมของ `nonSuspiciousOnly`

หมายเหตุ:

- `trending` จัดอันดับตามจำนวนการติดตั้งในช่วง 7 วันที่ผ่านมา (อิง telemetry)
- `createdAt` เสถียรสำหรับการ crawl Skill ใหม่; `updated` เปลี่ยนเมื่อ Skill ที่มีอยู่ถูกเผยแพร่ใหม่
- เมื่อ `nonSuspiciousOnly=true` การ sort แบบใช้ cursor อาจส่งคืนรายการน้อยกว่า `limit` ในหนึ่งหน้า เพราะ Skills ที่น่าสงสัยถูกกรองหลังจากดึงหน้ามาแล้ว
- ใช้ `nextCursor` เพื่อดำเนินการแบ่งหน้าต่อเมื่อมีอยู่ หน้าสั้นไม่ได้หมายความว่าสิ้นสุดผลลัพธ์เสมอไป

Response:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
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

- Slug เก่าที่สร้างโดย flow การเปลี่ยนชื่อ/merge เจ้าของจะ resolve ไปยัง Skill canonical
- `metadata.os`: ข้อจำกัด OS ที่ประกาศใน frontmatter ของ Skill (เช่น `["macos"]`, `["linux"]`) เป็น `null` หากไม่ได้ประกาศ
- `metadata.systems`: เป้าหมายระบบ Nix (เช่น `["aarch64-darwin", "x86_64-linux"]`) เป็น `null` หากไม่ได้ประกาศ
- `metadata` เป็น `null` หาก Skill ไม่มี metadata ของแพลตฟอร์ม
- `moderation` จะรวมอยู่เฉพาะเมื่อ Skill ถูก flag หรือเจ้าของกำลังดูอยู่

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

- เจ้าของและผู้กลั่นกรองสามารถเข้าถึงรายละเอียดการกลั่นกรองสำหรับ Skills ที่ซ่อนอยู่
- ผู้เรียกสาธารณะจะได้รับ `200` เฉพาะสำหรับ Skills ที่มองเห็นได้และถูก flag แล้ว
- Evidence จะถูก redacted สำหรับผู้เรียกสาธารณะ และมี raw snippets เฉพาะสำหรับเจ้าของ/ผู้กลั่นกรอง

### `POST /api/v1/skills/{slug}/report`

รายงาน Skill เพื่อให้ผู้กลั่นกรองตรวจสอบ รายงานอยู่ระดับ Skill สามารถลิงก์
กับเวอร์ชันได้ และจะป้อนเข้าสู่คิวรายงาน Skill

การยืนยันตัวตน:

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

### `POST /api/v1/skills/{slug}/appeal`

เอนด์พอยต์สำหรับเจ้าของ/ผู้เผยแพร่ Skill เพื่อยื่นอุทธรณ์การกลั่นกรองบน Skill

การยืนยันตัวตน:

- ต้องมี API token สำหรับเจ้าของ Skill หรือสมาชิกผู้เผยแพร่

Request:

```json
{ "version": "1.2.3", "message": "The flagged command is documented setup." }
```

ยอมรับการอุทธรณ์สำหรับผลลัพธ์ของ Skill ที่ถูกซ่อน ถูกลบ น่าสงสัย เป็นอันตราย หรือ
ถูก scanner flag ClawHub เก็บการอุทธรณ์ที่เปิดอยู่หนึ่งรายการต่อ Skill

Response:

```json
{
  "ok": true,
  "submitted": true,
  "alreadyOpen": false,
  "appealId": "skillAppeals:...",
  "skillId": "skills:...",
  "status": "open"
}
```

### `POST /api/v1/skills/{slug}/rescan`

ขอให้สแกนความปลอดภัยซ้ำสำหรับเวอร์ชัน Skill ที่เผยแพร่ล่าสุด

การยืนยันตัวตน:

- ต้องมี API token สำหรับเจ้าของ Skill, ผู้ดูแลผู้เผยแพร่, ผู้กลั่นกรองแพลตฟอร์ม
  หรือผู้ดูแลแพลตฟอร์ม
- เจ้าของและผู้ดูแลผู้เผยแพร่อยู่ภายใต้ขีดจำกัดการกู้คืนของเจ้าของต่อเวอร์ชัน
  ผู้กลั่นกรองแพลตฟอร์มและผู้ดูแลไม่อยู่ภายใต้ขีดจำกัดนี้ แต่ ClawHub ยังอนุญาตให้มี
  การ rescan ที่ active เพียงหนึ่งรายการต่อเวอร์ชัน

Response:

```json
{
  "ok": true,
  "targetKind": "skill",
  "name": "gifgrep",
  "version": "1.2.3",
  "status": "in_progress",
  "remainingRequests": 2,
  "maxRequests": 3,
  "pendingRequestId": "rescanRequests:..."
}
```

### `GET /api/v1/skills/-/reports`

เอนด์พอยต์ผู้กลั่นกรอง/ผู้ดูแลสำหรับรับรายงาน Skill

พารามิเตอร์ query:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `confirmed`, `dismissed` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-200)
- `cursor` (ไม่บังคับ): cursor สำหรับการแบ่งหน้า

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

เอนด์พอยต์ผู้กลั่นกรอง/ผู้ดูแลสำหรับ resolve หรือ reopen รายงาน Skill

Request:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

ต้องมี `note` สำหรับ `confirmed` และ `dismissed`; อาจละเว้นได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "hide"` พร้อมรายงานที่ triage แล้ว
เพื่อซ่อน Skill ใน workflow เดียวกันที่ตรวจสอบย้อนหลังได้

### `GET /api/v1/skills/-/appeals`

เอนด์พอยต์ผู้กลั่นกรอง/ผู้ดูแลสำหรับรับการอุทธรณ์ Skill

พารามิเตอร์ query:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `accepted`, `rejected` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-200)
- `cursor` (ไม่บังคับ): cursor สำหรับการแบ่งหน้า

### `POST /api/v1/skills/-/appeals/{appealId}/resolve`

เอนด์พอยต์ผู้กลั่นกรอง/ผู้ดูแลสำหรับยอมรับ ปฏิเสธ หรือ reopen การอุทธรณ์ Skill
ต้องมี `note` สำหรับ `accepted` และ `rejected`; อาจละเว้นได้เมื่อตั้งค่า
`status` กลับเป็น `open` ส่ง `finalAction: "restore"` พร้อมการอุทธรณ์ที่ยอมรับแล้ว
เพื่อทำให้ Skill พร้อมใช้งานอีกครั้ง

### `GET /api/v1/skills/{slug}/versions`

พารามิเตอร์คิวรี:

- `limit` (ไม่บังคับ): จำนวนเต็ม
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

### `GET /api/v1/skills/{slug}/versions/{version}`

ส่งคืนเมตาดาต้าเวอร์ชัน + รายการไฟล์

- `version.security` รวมสถานะการยืนยันการสแกนที่ปรับให้อยู่ในรูปแบบมาตรฐานและรายละเอียดตัวสแกน
  (VirusTotal + LLM) เมื่อมี

### `GET /api/v1/skills/{slug}/scan`

ส่งคืนรายละเอียดการยืนยันการสแกนความปลอดภัยสำหรับเวอร์ชันของ Skill

พารามิเตอร์คิวรี:

- `version` (ไม่บังคับ): สตริงเวอร์ชันที่ระบุ
- `tag` (ไม่บังคับ): แปลงแท็กเป็นเวอร์ชัน (ตัวอย่างเช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- รวมสถานะการยืนยันที่ปรับให้อยู่ในรูปแบบมาตรฐานพร้อมรายละเอียดเฉพาะของตัวสแกน
- `security.capabilityTags` รวมป้ายกำกับความสามารถ/ความเสี่ยงที่กำหนดได้แน่นอน เช่น
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` และ `posts-externally` เมื่อตรวจพบ
- `security.hasScanResult` เป็น `true` เฉพาะเมื่อตัวสแกนสร้างคำตัดสินที่ชัดเจน (`clean`, `suspicious` หรือ `malicious`)
- `moderation` คือสแนปช็อตการกลั่นกรองระดับ Skill ปัจจุบันที่ได้มาจากเวอร์ชันล่าสุด
- เมื่อคิวรีเวอร์ชันย้อนหลัง ให้ตรวจสอบ `moderation.matchesRequestedVersion` และ `moderation.sourceVersion` ก่อนถือว่า `moderation` และ `security` อยู่ในบริบทเวอร์ชันเดียวกัน

### `GET /api/v1/skills/{slug}/file`

ส่งคืนเนื้อหาข้อความดิบ

พารามิเตอร์คิวรี:

- `path` (บังคับ)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือเวอร์ชันล่าสุด
- ขีดจำกัดขนาดไฟล์: 200KB

### `GET /api/v1/packages`

ปลายทางแค็ตตาล็อกรวมสำหรับ:

- Skills
- Plugin โค้ด
- Plugin แบบบันเดิล

พารามิเตอร์คิวรี:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `executesCode` (ไม่บังคับ): `true` หรือ `false`
- `capabilityTag` (ไม่บังคับ): ตัวกรองความสามารถสำหรับแพ็กเกจ Plugin
- `target` / `hostTarget` (ไม่บังคับ): รูปย่อสำหรับ `host:<target>`
- `os`, `arch`, `libc` (ไม่บังคับ): รูปย่อสำหรับตัวกรองความสามารถของโฮสต์
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (ไม่บังคับ): รูปย่อ `true`/`1` สำหรับแท็กข้อกำหนดสภาพแวดล้อม
- `externalService`, `binary`, `osPermission` (ไม่บังคับ): รูปย่อสำหรับแท็กข้อกำหนดสภาพแวดล้อมที่มีชื่อ
- `artifactKind` (ไม่บังคับ): `legacy-zip` หรือ `npm-pack`
- `npmMirror` (ไม่บังคับ): `true`/`1` เพื่อแสดงเวอร์ชันแพ็กเกจที่รองรับโดย ClawPack
  ซึ่งพร้อมใช้งานผ่าน npm mirror

หมายเหตุ:

- `GET /api/v1/code-plugins` และ `GET /api/v1/bundle-plugins` ยังคงเป็นนามแฝงแบบครอบครัวคงที่
- รายการ Skill ยังคงรองรับโดยรีจิสทรี Skill และยังเผยแพร่ได้เฉพาะผ่าน `POST /api/v1/skills`
- `POST /api/v1/packages` ยังคงใช้สำหรับการเผยแพร่ code-plugin และ bundle-plugin เท่านั้น
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ยืนยันตัวตนแล้วสามารถเห็นแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนเป็นสมาชิกอยู่ในผลลัพธ์รายการ/การค้นหา
- `channel=private` ส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ยืนยันตัวตนแล้วอ่านได้

### `GET /api/v1/packages/search`

การค้นหาแค็ตตาล็อกรวมใน Skills + แพ็กเกจ Plugin

พารามิเตอร์คิวรี:

- `q` (บังคับ): สตริงคิวรี
- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `executesCode` (ไม่บังคับ): `true` หรือ `false`
- `capabilityTag` (ไม่บังคับ): ตัวกรองความสามารถสำหรับแพ็กเกจ Plugin
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` และ
  `osPermission` ได้รับการยอมรับเป็นรูปย่อสำหรับแท็กความสามารถทั่วไป
- `artifactKind` (ไม่บังคับ): `legacy-zip` หรือ `npm-pack`
- `npmMirror` (ไม่บังคับ): `true`/`1` เพื่อค้นหาเวอร์ชันแพ็กเกจที่รองรับโดย ClawPack
  ซึ่งพร้อมใช้งานผ่าน npm mirror

หมายเหตุ:

- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ยืนยันตัวตนแล้วสามารถค้นหาแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนเป็นสมาชิกอยู่ได้
- `channel=private` ส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ยืนยันตัวตนแล้วอ่านได้
- ตัวกรองอาร์ติแฟกต์รองรับโดยแท็กความสามารถที่จัดทำดัชนีไว้:
  `artifact:legacy-zip`, `artifact:npm-pack` และ `npm-mirror:available`

### `GET /api/v1/packages/{name}`

ส่งคืนเมตาดาต้ารายละเอียดแพ็กเกจ

หมายเหตุ:

- Skills สามารถแปลงผ่านเส้นทางนี้ในแค็ตตาล็อกรวมได้เช่นกัน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่ที่เป็นเจ้าของได้

### `DELETE /api/v1/packages/{name}`

ลบแพ็กเกจและการเผยแพร่ทั้งหมดแบบซอฟต์ดีลีต

หมายเหตุ:

- ต้องใช้โทเค็น API สำหรับเจ้าของแพ็กเกจ เจ้าของ/ผู้ดูแลผู้เผยแพร่องค์กร
  ผู้กลั่นกรองแพลตฟอร์ม หรือผู้ดูแลแพลตฟอร์ม

### `GET /api/v1/packages/{name}/versions`

ส่งคืนประวัติเวอร์ชัน

พารามิเตอร์คิวรี:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

หมายเหตุ:

- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่ที่เป็นเจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}`

ส่งคืนเวอร์ชันแพ็กเกจหนึ่งรายการ รวมถึงเมตาดาต้าไฟล์ ความเข้ากันได้
ความสามารถ การยืนยัน เมตาดาต้าอาร์ติแฟกต์ และข้อมูลการสแกน

หมายเหตุ:

- `version.artifact.kind` เป็น `legacy-zip` สำหรับอาร์ไคฟ์แพ็กเกจแบบเดิม หรือ
  `npm-pack` สำหรับการเผยแพร่ที่รองรับโดย ClawPack
- การเผยแพร่ ClawPack รวมฟิลด์ `npmIntegrity`, `npmShasum` และ
  `npmTarballName` ที่เข้ากันได้กับ npm
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` และ `version.staticScan` จะถูกรวมเมื่อมีข้อมูลการสแกน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่ที่เป็นเจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

ส่งคืนเมตาดาต้าตัวแปลงอาร์ติแฟกต์แบบชัดเจนสำหรับเวอร์ชันแพ็กเกจ

หมายเหตุ:

- เวอร์ชันแพ็กเกจเดิมส่งคืนอาร์ติแฟกต์ `legacy-zip` และ
  `downloadUrl` ของ ZIP เดิม
- เวอร์ชัน ClawPack ส่งคืนอาร์ติแฟกต์ `npm-pack`, ฟิลด์ความถูกต้องของ npm,
  `tarballUrl` และ URL ความเข้ากันได้ของ ZIP เดิม
- นี่คือพื้นผิวตัวแปลงของ OpenClaw; หลีกเลี่ยงการคาดเดารูปแบบอาร์ไคฟ์จาก
  URL ที่ใช้ร่วมกัน

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ดาวน์โหลดอาร์ติแฟกต์เวอร์ชันผ่านเส้นทางตัวแปลงแบบชัดเจน

หมายเหตุ:

- เวอร์ชัน ClawPack สตรีมไบต์ `.tgz` ของ npm-pack ที่อัปโหลดจริง
- เวอร์ชัน ZIP เดิมเปลี่ยนเส้นทางไปที่ `/api/v1/packages/{name}/download?version=`
- ใช้บัคเก็ตอัตราการดาวน์โหลด

### `GET /api/v1/packages/{name}/readiness`

ส่งคืนความพร้อมที่คำนวณแล้วสำหรับการใช้งาน OpenClaw ในอนาคต

การตรวจสอบความพร้อมครอบคลุม:

- สถานะช่องทาง official
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

ปลายทางผู้กลั่นกรองสำหรับแสดงรายการแถวการย้าย Plugin OpenClaw อย่างเป็นทางการ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็นผู้กลั่นกรองหรือผู้ดูแล

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

ปลายทางผู้ดูแลสำหรับสร้างหรืออัปเดตแถวการย้าย Plugin อย่างเป็นทางการ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแล

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

- `bundledPluginId` ถูกปรับให้อยู่ในรูปแบบตัวพิมพ์เล็กและเป็นคีย์ upsert ที่เสถียร
- `packageName` ถูกปรับให้อยู่ในรูปแบบชื่อ npm; แพ็กเกจอาจไม่มีอยู่สำหรับการย้ายที่วางแผนไว้
- สิ่งนี้ติดตามเฉพาะความพร้อมของการย้าย ไม่ได้เปลี่ยนแปลง OpenClaw หรือสร้าง
  ClawPacks

### `GET /api/v1/packages/moderation/queue`

ปลายทางผู้กลั่นกรอง/ผู้ดูแลสำหรับคิวตรวจสอบการเผยแพร่แพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็นผู้กลั่นกรองหรือผู้ดูแล

พารามิเตอร์คิวรี:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `blocked`, `manual` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

ความหมายของสถานะ:

- `open`: การเผยแพร่ที่น่าสงสัย เป็นอันตราย รอดำเนินการ ถูกกักกัน ถูกเพิกถอน หรือถูกรายงาน
- `blocked`: การเผยแพร่ที่ถูกกักกัน ถูกเพิกถอน หรือเป็นอันตราย
- `manual`: การเผยแพร่ใด ๆ ที่มีการแทนที่การกลั่นกรองด้วยตนเอง
- `all`: การเผยแพร่ใด ๆ ที่มีการแทนที่ด้วยตนเอง สถานะการสแกนไม่สะอาด หรือรายงานแพ็กเกจ

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

รายงานแพ็กเกจเพื่อให้ผู้กลั่นกรองตรวจสอบ รายงานอยู่ระดับแพ็กเกจ และเลือกเชื่อมโยงกับเวอร์ชันได้
รายงานเหล่านี้จะป้อนเข้าสู่คิวการกลั่นกรอง แต่จะไม่ซ่อนอัตโนมัติหรือ
บล็อกการดาวน์โหลดด้วยตัวเอง; ผู้กลั่นกรองควรใช้การกลั่นกรองการเผยแพร่เพื่อ
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

### `POST /api/v1/packages/{name}/appeal`

ปลายทางเจ้าของแพ็กเกจ/ผู้เผยแพร่สำหรับอุทธรณ์การกลั่นกรองของการเผยแพร่

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับเจ้าของแพ็กเกจหรือสมาชิกผู้เผยแพร่

คำขอ:

```json
{
  "version": "1.2.3",
  "message": "The native binary is signed and matches the linked source release."
}
```

การอุทธรณ์ได้รับการยอมรับเฉพาะสำหรับการเผยแพร่ที่ถูกกักกัน ถูกเพิกถอน
น่าสงสัย หรือเป็นอันตราย ClawHub เก็บการอุทธรณ์ที่เปิดอยู่หนึ่งรายการต่อการเผยแพร่

การตอบกลับ:

```json
{
  "ok": true,
  "submitted": true,
  "alreadyOpen": false,
  "appealId": "packageAppeals:...",
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "status": "open"
}
```

### `POST /api/v1/packages/{name}/rescan`

ร้องขอการสแกนความปลอดภัยซ้ำสำหรับรีลีสแพ็กเกจที่เผยแพร่ล่าสุด

การยืนยันตัวตน:

- ต้องมีโทเค็น API สำหรับเจ้าของแพ็กเกจ ผู้ดูแลผู้เผยแพร่ ผู้ดูแลแพลตฟอร์ม
  หรือผู้ดูแลระบบแพลตฟอร์ม
- เจ้าของและผู้ดูแลผู้เผยแพร่อยู่ภายใต้ขีดจำกัดการกู้คืนของเจ้าของต่อรีลีส
  ผู้ดูแลแพลตฟอร์มและผู้ดูแลระบบไม่อยู่ภายใต้ขีดจำกัดนี้ แต่ ClawHub ยังคงอนุญาตให้มี
  การสแกนซ้ำที่ทำงานอยู่ได้เพียงหนึ่งรายการต่อรีลีส

การตอบกลับ:

```json
{
  "ok": true,
  "targetKind": "package",
  "name": "@openclaw/example-plugin",
  "version": "1.2.3",
  "status": "in_progress",
  "remainingRequests": 2,
  "maxRequests": 3,
  "pendingRequestId": "rescanRequests:..."
}
```

### `GET /api/v1/packages/appeals`

ปลายทางสำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อรับคำอุทธรณ์ของแพ็กเกจ

การยืนยันตัวตน:

- ต้องมีโทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คิวรี:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `accepted`, `rejected` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

การตอบกลับ:

```json
{
  "items": [
    {
      "appealId": "packageAppeals:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "message": "The native binary is signed.",
      "status": "open",
      "createdAt": 1730000000000,
      "submitter": {
        "userId": "users:...",
        "handle": "publisher",
        "displayName": "Publisher"
      },
      "resolvedAt": null,
      "resolvedBy": null,
      "resolutionNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/appeals/{appealId}/resolve`

ปลายทางสำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อยอมรับ ปฏิเสธ หรือเปิดคำอุทธรณ์อีกครั้ง

คำขอ:

```json
{ "status": "accepted", "note": "False positive confirmed.", "finalAction": "approve" }
```

ต้องระบุ `note` สำหรับ `accepted` และ `rejected`; อาจละไว้ได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "approve"` พร้อมคำอุทธรณ์ที่ได้รับการยอมรับ
เพื่ออนุมัติรีลีสที่ได้รับผลกระทบในเวิร์กโฟลว์เดียวกันที่ตรวจสอบย้อนหลังได้

การตอบกลับ:

```json
{
  "ok": true,
  "appealId": "packageAppeals:...",
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "status": "rejected"
}
```

### `GET /api/v1/packages/reports`

ปลายทางสำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อรับรายงานแพ็กเกจ

การยืนยันตัวตน:

- ต้องมีโทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

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

ปลายทางสำหรับเจ้าของ/ผู้ดูแลเพื่อดูสถานะการกลั่นกรองแพ็กเกจ

การยืนยันตัวตน:

- ต้องมีโทเค็น API สำหรับเจ้าของแพ็กเกจ สมาชิกผู้เผยแพร่ ผู้ดูแล หรือ
  ผู้ใช้ที่เป็นผู้ดูแลระบบ

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
- `revoked`: ถูกบล็อกหลังจากรีลีสเคยได้รับความไว้วางใจก่อนหน้านี้

รีลีสที่ถูกกักกันและถูกเพิกถอนจะส่งคืน `403` จากเส้นทางดาวน์โหลดอาร์ติแฟกต์
การเปลี่ยนแปลงทุกครั้งจะเขียนรายการบันทึกการตรวจสอบ

### `POST /api/v1/packages/backfill/artifacts`

ปลายทางบำรุงรักษาสำหรับผู้ดูแลระบบเท่านั้น เพื่อกำกับรีลีสแพ็กเกจรุ่นเก่าด้วย
เมทาดาทาชนิดอาร์ติแฟกต์แบบชัดเจน

เนื้อหาคำขอ:

```json
{
  "cursor": null,
  "batchSize": 100,
  "dryRun": true
}
```

การตอบกลับ:

```json
{
  "ok": true,
  "scanned": 100,
  "updated": 12,
  "nextCursor": "cursor...",
  "done": false,
  "dryRun": true
}
```

หมายเหตุ:

- ค่าเริ่มต้นเป็นการทดลองทำ
- รีลีสที่ไม่มีพื้นที่จัดเก็บ ClawPack จะถูกกำกับเป็น `legacy-zip`
- แถวที่ใช้ ClawPack อยู่แล้วแต่ไม่มี `artifactKind` จะถูกซ่อมเป็น
  `npm-pack`
- การดำเนินการนี้ไม่สร้าง ClawPack หรือเปลี่ยนไบต์ของอาร์ติแฟกต์

### `GET /api/v1/packages/{name}/file`

ส่งคืนเนื้อหาข้อความดิบสำหรับไฟล์ในแพ็กเกจ

พารามิเตอร์คิวรี:

- `path` (จำเป็น)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นเป็นรีลีสล่าสุด
- ใช้บักเก็ตอัตราการอ่าน ไม่ใช่บักเก็ตการดาวน์โหลด
- ไฟล์ไบนารีจะส่งคืน `415`
- ขีดจำกัดขนาดไฟล์: 200KB
- การสแกน VirusTotal ที่รอดำเนินการไม่บล็อกการอ่าน; รีลีสที่เป็นอันตรายอาจยังถูกระงับไว้ที่อื่น
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะสามารถอ่านผู้เผยแพร่ที่เป็นเจ้าของได้

### `GET /api/v1/packages/{name}/download`

ดาวน์โหลดไฟล์ ZIP แบบกำหนดแน่นอนรุ่นเดิมสำหรับรีลีสแพ็กเกจ

พารามิเตอร์คิวรี:

- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นเป็นรีลีสล่าสุด
- Skills เปลี่ยนเส้นทางไปที่ `GET /api/v1/download`
- อาร์ไคฟ์ Plugin/แพ็กเกจเป็นไฟล์ zip ที่มีราก `package/` เพื่อให้ไคลเอนต์ OpenClaw
  รุ่นเก่ายังคงทำงานได้
- เส้นทางนี้ยังคงรองรับเฉพาะ ZIP เท่านั้น ไม่สตรีมไฟล์ ClawPack `.tgz`
- การตอบกลับมีส่วนหัว `ETag`, `Digest`, `X-ClawHub-Artifact-Type` และ
  `X-ClawHub-Artifact-Sha256` สำหรับการตรวจสอบความสมบูรณ์ของตัวแก้ข้อมูล
- เมทาดาทาที่มีเฉพาะในรีจิสทรีจะไม่ถูกแทรกเข้าไปในอาร์ไคฟ์ที่ดาวน์โหลด
- การสแกน VirusTotal ที่รอดำเนินการไม่บล็อกการดาวน์โหลด; รีลีสที่เป็นอันตรายจะส่งคืน `403`
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะเป็นเจ้าของ

### `GET /api/npm/{package}`

ส่งคืนแพ็กคิวเมนต์ที่เข้ากันได้กับ npm สำหรับเวอร์ชันแพ็กเกจที่ใช้ ClawPack

หมายเหตุ:

- แสดงเฉพาะเวอร์ชันที่อัปโหลดทาร์บอล ClawPack npm-pack แล้วเท่านั้น
- เวอร์ชันรุ่นเดิมที่มีเฉพาะ ZIP จะถูกละไว้โดยเจตนา
- `dist.tarball`, `dist.integrity` และ `dist.shasum` ใช้
  ฟิลด์ที่เข้ากันได้กับ npm เพื่อให้ผู้ใช้ชี้ npm ไปยังมิเรอร์ได้หากต้องการ
- แพ็กคิวเมนต์ของแพ็กเกจแบบมีสโคปรองรับทั้งเส้นทางคำขอ `/api/npm/@scope/name` และ
  `/api/npm/@scope%2Fname` ที่เข้ารหัสตามแบบของ npm

### `GET /api/npm/{package}/-/{tarball}.tgz`

สตรีมไบต์ทาร์บอล ClawPack ที่อัปโหลดไว้ตรงตามต้นฉบับสำหรับไคลเอนต์มิเรอร์ npm

หมายเหตุ:

- ใช้บักเก็ตอัตราการดาวน์โหลด
- ส่วนหัวการดาวน์โหลดมี SHA-256 ของ ClawHub พร้อมเมทาดาทา integrity/shasum ของ npm
- การกลั่นกรองและการตรวจสอบสิทธิ์เข้าถึงแพ็กเกจส่วนตัวยังคงมีผล

### `GET /api/v1/resolve`

ใช้โดย CLI เพื่อแมปลายนิ้วมือในเครื่องกับเวอร์ชันที่รู้จัก

พารามิเตอร์คิวรี:

- `slug` (จำเป็น)
- `hash` (จำเป็น): sha256 แบบเลขฐานสิบหก 64 อักขระของลายนิ้วมือบันเดิล

การตอบกลับ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ดาวน์โหลด zip ของเวอร์ชันสกิล

พารามิเตอร์คิวรี:

- `slug` (จำเป็น)
- `version` (ไม่บังคับ): สตริง semver
- `tag` (ไม่บังคับ): ชื่อแท็ก (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` ระบบจะใช้เวอร์ชันล่าสุด
- เวอร์ชันที่ลบแบบนุ่มนวลจะส่งคืน `410`
- สถิติการดาวน์โหลดนับเป็นตัวตนที่ไม่ซ้ำกันต่อชั่วโมง (`userId` เมื่อโทเค็น API ถูกต้อง มิฉะนั้นใช้ IP)

## ปลายทางการยืนยันตัวตน (โทเค็น Bearer)

ทุกปลายทางต้องมี:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

ตรวจสอบโทเค็นและส่งคืนแฮนเดิลของผู้ใช้

### `POST /api/v1/skills`

เผยแพร่เวอร์ชันใหม่

- แนะนำ: `multipart/form-data` พร้อม JSON ใน `payload` + บล็อบ `files[]`
- ยอมรับเนื้อหา JSON ที่มี `files` (อิงตาม storageId) ด้วย
- ฟิลด์เพย์โหลดไม่บังคับ: `ownerHandle` เมื่อมีอยู่ API จะแก้ผู้เผยแพร่นั้น
  ฝั่งเซิร์ฟเวอร์และกำหนดให้ผู้ดำเนินการต้องมีสิทธิ์เข้าถึงผู้เผยแพร่
- ฟิลด์เพย์โหลดไม่บังคับ: `migrateOwner` เมื่อเป็น `true` พร้อม `ownerHandle`
  สกิลที่มีอยู่สามารถย้ายไปยังเจ้าของนั้นได้หากผู้ดำเนินการเป็นผู้ดูแลระบบ/เจ้าของทั้งใน
  ผู้เผยแพร่ปัจจุบันและเป้าหมาย หากไม่มีการเลือกใช้นี้ การเปลี่ยนเจ้าของจะ
  ถูกปฏิเสธ

### `POST /api/v1/packages`

เผยแพร่รีลีส code-plugin หรือ bundle-plugin

- ต้องใช้การยืนยันตัวตนด้วยโทเค็น Bearer
- แนะนำ: `multipart/form-data` พร้อม JSON ใน `payload` + บล็อบ `files[]`
- ยอมรับเนื้อหา JSON ที่มี `files` (อิงตาม storageId) ด้วย
- ฟิลด์เพย์โหลดไม่บังคับ: `ownerHandle` เมื่อมีอยู่ เฉพาะผู้ดูแลระบบเท่านั้นที่เผยแพร่ในนามของเจ้าของนั้นได้

ประเด็นสำคัญของการตรวจสอบความถูกต้อง:

- `family` ต้องเป็น `code-plugin` หรือ `bundle-plugin`
- แพ็กเกจ Plugin ต้องมี `openclaw.plugin.json` การอัปโหลด ClawPack `.tgz` ต้อง
  มีไฟล์นี้ที่ `package/openclaw.plugin.json`
- โค้ด Plugin ต้องมี `package.json`, เมทาดาทารีโปซอร์ส, เมทาดาทาคอมมิตซอร์ส,
  เมทาดาทาสคีมาคอนฟิก, `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion`
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมทาดาทาที่ไม่บังคับ
- เฉพาะผู้เผยแพร่ที่เชื่อถือได้เท่านั้นที่เผยแพร่ไปยังช่องทาง `official` ได้
- การเผยแพร่ในนามผู้อื่นยังคงตรวจสอบสิทธิ์การใช้ช่องทาง official กับบัญชีเจ้าของเป้าหมาย

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

ลบแบบนุ่มนวล / กู้คืนสกิล (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)

เนื้อหา JSON ที่ไม่บังคับ:

```json
{ "reason": "Held for moderation pending legal review." }
```

เมื่อมีอยู่ `reason` จะถูกจัดเก็บเป็นหมายเหตุการกลั่นกรองของสกิลและคัดลอกไปยังบันทึกการตรวจสอบ
การลบแบบนุ่มนวลที่เริ่มโดยเจ้าของจะสงวน slug ไว้ 30 วัน จากนั้น slug จะสามารถถูกอ้างสิทธิ์โดย
ผู้เผยแพร่อื่นได้ การตอบกลับการลบมี `slugReservedUntil` เมื่อการหมดอายุนี้มีผล
การซ่อนโดยผู้ดูแล/ผู้ดูแลระบบและการนำออกด้านความปลอดภัยจะไม่หมดอายุในลักษณะนี้

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

สำหรับผู้ดูแลระบบเท่านั้น ตรวจให้แน่ใจว่ามีผู้เผยแพร่แบบองค์กรสำหรับแฮนเดิล หากแฮนเดิลยังคงชี้ไปที่
ผู้เผยแพร่ผู้ใช้ร่วม/ส่วนบุคคลรุ่นเดิม ปลายทางจะย้ายไปเป็นผู้เผยแพร่แบบองค์กรก่อน

- เนื้อหา: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- การตอบกลับ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

สำหรับผู้ดูแลระบบเท่านั้น สงวน root slug และชื่อแพ็กเกจให้เจ้าของที่ถูกต้องโดยไม่เผยแพร่
release ชื่อแพ็กเกจจะกลายเป็นแพ็กเกจ placeholder ส่วนตัวที่ไม่มีแถว release เพื่อให้เจ้าของรายเดิม
สามารถเผยแพร่ release ของ code-plugin หรือ bundle-plugin จริงลงในชื่อนั้นได้ภายหลัง

- เนื้อหา: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- การตอบกลับ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Endpoint สำหรับการจัดการ slug ของเจ้าของ

- `POST /api/v1/skills/{slug}/rename`
  - เนื้อหา: `{ "newSlug": "new-canonical-slug" }`
  - การตอบกลับ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - เนื้อหา: `{ "targetSlug": "canonical-target-slug" }`
  - การตอบกลับ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

หมายเหตุ:

- Endpoint ทั้งสองต้องใช้การยืนยันตัวตนด้วย API token และใช้งานได้เฉพาะเจ้าของ skill เท่านั้น
- `rename` จะเก็บ slug ก่อนหน้าไว้เป็น alias สำหรับเปลี่ยนเส้นทาง
- `merge` จะซ่อนรายการต้นทางและเปลี่ยนเส้นทาง slug ต้นทางไปยังรายการเป้าหมาย

### Endpoint สำหรับโอนความเป็นเจ้าของ

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

แบนผู้ใช้และลบ skill ที่เป็นเจ้าของแบบถาวร (เฉพาะ moderator/admin)

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

ยกเลิกการแบนผู้ใช้และกู้คืน skill ที่เข้าเกณฑ์ (เฉพาะ admin)

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

เพิ่ม/ลบดาว (ไฮไลต์) Endpoint ทั้งสองเป็น idempotent

การตอบกลับ:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Endpoint CLI แบบเดิม (เลิกใช้แล้ว)

ยังรองรับสำหรับ CLI เวอร์ชันเก่า:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

ดู `DEPRECATIONS.md` สำหรับแผนการนำออก

## การค้นหา registry (`/.well-known/clawhub.json`)

CLI สามารถค้นหาการตั้งค่า registry/auth จากไซต์ได้:

- `/.well-known/clawhub.json` (JSON, แนะนำ)
- `/.well-known/clawdhub.json` (แบบเดิม)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

หากคุณโฮสต์เอง ให้ให้บริการไฟล์นี้ (หรือตั้งค่า `CLAWHUB_REGISTRY` อย่างชัดเจน; `CLAWDHUB_REGISTRY` แบบเดิม)
