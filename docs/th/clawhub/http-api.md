---
read_when:
    - การเพิ่ม/เปลี่ยนแปลงเอนด์พอยต์
    - การดีบักคำขอระหว่าง CLI ↔ รีจิสทรี
summary: เอกสารอ้างอิง API HTTP (จุดปลายทางสาธารณะ + จุดปลายทางของ CLI + การยืนยันตัวตน)
x-i18n:
    generated_at: "2026-05-11T20:24:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1580df58fe2342858dd2c86ebaf659993157b11508c0fc03530e541bd0118ae
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

URL ฐาน: `https://clawhub.ai` (ค่าเริ่มต้น).

เส้นทาง v1 ทั้งหมดอยู่ภายใต้ `/api/v1/...`.
เส้นทางเดิม `/api/...` และ `/api/cli/...` ยังคงอยู่เพื่อความเข้ากันได้ (ดู `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## การนำแค็ตตาล็อกสาธารณะกลับมาใช้

ไดเรกทอรีของบุคคลที่สามอาจใช้ endpoint สำหรับอ่านแบบสาธารณะเพื่อแสดงรายการหรือค้นหา ClawHub skills โปรดแคชผลลัพธ์ เคารพ `429`/`Retry-After` ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ต้นทางที่เป็นทางการ (`https://clawhub.ai/<owner>/<slug>`) และหลีกเลี่ยงการสื่อว่า ClawHub รับรองไซต์บุคคลที่สามนั้น อย่าพยายามทำสำเนาเนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกโดยการกลั่นกรองไว้นอกพื้นผิว API สาธารณะ

ทางลัด Web slug จะแก้ค่าได้ข้ามตระกูลรีจิสทรี แต่ไคลเอนต์ API ควรใช้
URL ต้นทางที่เป็นทางการซึ่งส่งกลับโดย endpoint สำหรับอ่าน แทนการสร้างลำดับความสำคัญของ route
ขึ้นมาใหม่

## ขีดจำกัดอัตรา

โมเดลการบังคับใช้:

- คำขอแบบไม่ระบุตัวตน: บังคับใช้ต่อ IP
- คำขอที่ผ่านการยืนยันตัวตน (Bearer token ที่ถูกต้อง): บังคับใช้ต่อ bucket ของผู้ใช้
- หาก token หายไป/ไม่ถูกต้อง พฤติกรรมจะย้อนกลับไปใช้การบังคับใช้ตาม IP
- endpoint สำหรับเขียนที่ผ่านการยืนยันตัวตนไม่ควรส่งคืนเพียง `Unauthorized` แบบเปล่าเมื่อ
  เซิร์ฟเวอร์รู้เหตุผล token ที่หายไป, token ที่ไม่ถูกต้อง/ถูกเพิกถอน และ
  บัญชีที่ถูกลบ/ถูกแบน/ถูกปิดใช้งาน ควรได้รับข้อความที่นำไปดำเนินการได้เพื่อให้ไคลเอนต์
  CLI บอกผู้ใช้ได้ว่าอะไรบล็อกพวกเขาอยู่

- อ่าน: 600/นาทีต่อ IP, 2400/นาทีต่อ key
- เขียน: 45/นาทีต่อ IP, 180/นาทีต่อ key
- ดาวน์โหลด: 30/นาทีต่อ IP, 180/นาทีต่อ key (`/api/v1/download`)

Header:

- ความเข้ากันได้แบบเดิม: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- แบบมาตรฐาน: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- เมื่อเป็น `429`: `Retry-After`

ความหมายของ Header:

- `X-RateLimit-Reset`: วินาที Unix epoch แบบสัมบูรณ์
- `RateLimit-Reset`: วินาทีจนกว่าจะรีเซ็ต (ดีเลย์)
- `Retry-After`: วินาทีที่ต้องรอก่อนลองใหม่ (ดีเลย์) เมื่อเป็น `429`

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

- หากมี `Retry-After` ให้รอตามจำนวนนั้นเป็นวินาทีก่อนลองใหม่
- ใช้ backoff แบบมี jitter เพื่อหลีกเลี่ยงการลองใหม่พร้อมกัน
- หากไม่มี `Retry-After` ให้ fallback ไปใช้ `RateLimit-Reset` (หรือคำนวณจาก `X-RateLimit-Reset`)

แหล่งที่มาของ IP:

- ใช้ `cf-connecting-ip` (Cloudflare) เป็นค่าเริ่มต้นสำหรับ IP ของไคลเอนต์
- ClawHub ใช้ header การ forward ที่เชื่อถือได้เพื่อระบุ IP ของไคลเอนต์ที่ edge
- หากไม่มี IP ของไคลเอนต์ที่เชื่อถือได้ คำขอดาวน์โหลดแบบไม่ระบุตัวตนจะใช้ bucket สำรองที่ผูกกับ endpoint แทน bucket `ip:unknown` ระดับ global เดียว คำขออ่าน/เขียนแบบไม่ระบุตัวตนยังคงใช้ bucket unknown ที่ใช้ร่วมกัน เพื่อให้การ routing ที่ไม่มี IP ยังคงมองเห็นได้และเป็นไปอย่างระมัดระวัง

## endpoint สาธารณะ (ไม่ต้องยืนยันตัวตน)

### `GET /api/v1/search`

พารามิเตอร์ Query:

- `q` (จำเป็น): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม
- `highlightedOnly` (ไม่บังคับ): `true` เพื่อกรองให้เหลือเฉพาะ skills ที่ถูกไฮไลต์
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias แบบเดิมสำหรับ `nonSuspiciousOnly`

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
      "updatedAt": 1730000000000
    }
  ]
}
```

หมายเหตุ:

- ผลลัพธ์จะถูกส่งกลับตามลำดับความเกี่ยวข้อง (ความคล้ายกันของ embedding + การเพิ่มคะแนน token ของ slug/name ที่ตรงแบบเป๊ะ + prior ด้านความนิยมจากการดาวน์โหลด)
- ความเกี่ยวข้องมีน้ำหนักมากกว่าความนิยม token ของ slug หรือ display-name ที่ตรงอย่างแม่นยำอาจมีอันดับสูงกว่าการจับคู่ที่หลวมกว่าซึ่งมีจำนวนดาวน์โหลดมากกว่ามาก
- ข้อความ ASCII จะถูกแบ่ง token ตามขอบเขตคำและเครื่องหมายวรรคตอน ตัวอย่างเช่น `personal-map` มี token `map` แบบแยกเดี่ยว ในขณะที่ `amap-jsapi-skill` มี `amap`, `jsapi` และ `skill`; ดังนั้นการค้นหา `map` จะให้ `personal-map` มีการจับคู่เชิงคำที่แข็งแรงกว่า `amap-jsapi-skill`
- การดาวน์โหลดถูกใช้เป็น prior ขนาดเล็กแบบ log-scaled และตัวตัดสินเมื่อเสมอกัน ไม่ใช่สัญญาณการจัดอันดับหลัก skills ที่มีการดาวน์โหลดสูงอาจอยู่อันดับต่ำกว่าเมื่อข้อความคำค้นจับคู่ได้อ่อนกว่า
- สถานะการกลั่นกรองที่น่าสงสัยหรือซ่อนอยู่สามารถนำ skill ออกจากการค้นหาสาธารณะได้ ขึ้นอยู่กับตัวกรองของผู้เรียกและสถานะการกลั่นกรองปัจจุบัน

คำแนะนำด้านการค้นพบสำหรับผู้เผยแพร่:

- ใส่คำที่ผู้ใช้จะค้นหาจริงใน display name, summary และ tags ใช้ token ของ slug แบบแยกเดี่ยวเฉพาะเมื่อมันเป็นอัตลักษณ์ที่เสถียรซึ่งคุณต้องการเก็บไว้ด้วย
- อย่าเปลี่ยนชื่อ slug เพียงเพื่อไล่ตามคำค้นเดียว เว้นแต่ slug ใหม่จะเป็นชื่อต้นทางที่เป็นทางการที่ดีกว่าในระยะยาว slug เก่าจะกลายเป็น redirect alias แต่ URL ต้นทางที่เป็นทางการ, slug ที่แสดง และ digest การค้นหาในอนาคตจะใช้ slug ใหม่
- alias จากการเปลี่ยนชื่อจะรักษาการแก้ค่าสำหรับ URL เก่าและการติดตั้งที่แก้ค่าผ่านรีจิสทรี แต่การจัดอันดับการค้นหาจะอิงจากข้อมูลเมตา skill ต้นทางที่เป็นทางการหลังจากการเปลี่ยนชื่อถูกจัดทำดัชนีแล้ว สถิติที่มีอยู่ยังคงอยู่กับ skill
- หาก skill มองไม่เห็นโดยไม่คาดคิด ให้ตรวจสอบสถานะการกลั่นกรองก่อนด้วย `clawhub inspect <slug>` ขณะล็อกอิน ก่อนเปลี่ยนข้อมูลเมตาที่เกี่ยวกับการจัดอันดับ

### `GET /api/v1/skills`

พารามิเตอร์ Query:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–200)
- `cursor` (ไม่บังคับ): cursor สำหรับการแบ่งหน้าสำหรับการเรียงลำดับใดๆ ที่ไม่ใช่ `trending`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias แบบเดิมสำหรับ `nonSuspiciousOnly`

หมายเหตุ:

- `trending` จัดอันดับตามการติดตั้งในช่วง 7 วันที่ผ่านมา (อิงตาม telemetry)
- `createdAt` เสถียรสำหรับการ crawl skill ใหม่; `updated` เปลี่ยนเมื่อ skills ที่มีอยู่ถูกเผยแพร่ซ้ำ
- เมื่อ `nonSuspiciousOnly=true` การเรียงลำดับแบบอิง cursor อาจส่งคืนรายการในหน้าหนึ่งน้อยกว่า `limit` เพราะ skills ที่น่าสงสัยถูกกรองหลังดึงข้อมูลหน้า
- ใช้ `nextCursor` เพื่อแบ่งหน้าต่อเมื่อมีอยู่ หน้าสั้นไม่ได้หมายความว่าถึงท้ายผลลัพธ์เสมอไป

การตอบกลับ:

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

การตอบกลับ:

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

- slug เก่าที่สร้างโดย flow การเปลี่ยนชื่อ/รวมเจ้าของจะแก้ค่าไปยัง skill ต้นทางที่เป็นทางการ
- `metadata.os`: ข้อจำกัด OS ที่ประกาศใน frontmatter ของ skill (เช่น `["macos"]`, `["linux"]`) `null` หากไม่ได้ประกาศ
- `metadata.systems`: เป้าหมายระบบ Nix (เช่น `["aarch64-darwin", "x86_64-linux"]`) `null` หากไม่ได้ประกาศ
- `metadata` เป็น `null` หาก skill ไม่มีข้อมูลเมตาแพลตฟอร์ม
- `moderation` จะรวมอยู่เฉพาะเมื่อ skill ถูก flag หรือเจ้าของกำลังดูอยู่

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

- เจ้าของและ moderator สามารถเข้าถึงรายละเอียดการกลั่นกรองสำหรับ skills ที่ซ่อนอยู่ได้
- ผู้เรียกสาธารณะจะได้รับ `200` เฉพาะสำหรับ skills ที่มองเห็นได้และถูก flag แล้ว
- หลักฐานจะถูก redact สำหรับผู้เรียกสาธารณะ และจะรวม snippet ดิบเฉพาะสำหรับเจ้าของ/moderator เท่านั้น

### `POST /api/v1/skills/{slug}/report`

รายงาน skill เพื่อให้ moderator ตรวจสอบ รายงานอยู่ระดับ skill และเชื่อมโยง
กับเวอร์ชันได้แบบไม่บังคับ จากนั้นป้อนเข้าสู่คิวรายงาน skill

การยืนยันตัวตน:

- ต้องใช้ API token

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

### `POST /api/v1/skills/{slug}/appeal`

endpoint สำหรับเจ้าของ/ผู้เผยแพร่ skill เพื่ออุทธรณ์การกลั่นกรองบน skill

การยืนยันตัวตน:

- ต้องใช้ API token สำหรับเจ้าของ skill หรือสมาชิกผู้เผยแพร่

คำขอ:

```json
{ "version": "1.2.3", "message": "The flagged command is documented setup." }
```

การอุทธรณ์ได้รับการยอมรับสำหรับผลลัพธ์ skill ที่ถูกซ่อน ถูกนำออก น่าสงสัย เป็นอันตราย หรือ
ถูก flag โดย scanner ClawHub เก็บคำอุทธรณ์ที่เปิดอยู่หนึ่งรายการต่อ skill

การตอบกลับ:

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

ร้องขอให้สแกนความปลอดภัยซ้ำสำหรับเวอร์ชัน skill ที่เผยแพร่ล่าสุด

การยืนยันตัวตน:

- ต้องใช้ API token สำหรับเจ้าของ skill, admin ของผู้เผยแพร่, platform
  moderator หรือ platform admin
- เจ้าของและ admin ของผู้เผยแพร่อยู่ภายใต้ขีดจำกัดการกู้คืนของเจ้าของต่อเวอร์ชัน
  ส่วน platform moderator และ admin ไม่อยู่ภายใต้ขีดจำกัดนี้ แต่ ClawHub ยังอนุญาตให้มี
  การสแกนซ้ำที่ active ได้เพียงหนึ่งรายการต่อเวอร์ชัน

การตอบกลับ:

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

endpoint สำหรับ moderator/admin เพื่อรับรายงาน skill เข้า

พารามิเตอร์ Query:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `confirmed`, `dismissed` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-200)
- `cursor` (ไม่บังคับ): cursor สำหรับการแบ่งหน้า

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

endpoint สำหรับ moderator/admin เพื่อแก้ไขหรือเปิดรายงาน skill อีกครั้ง

คำขอ:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

ต้องมี `note` สำหรับ `confirmed` และ `dismissed`; อาจละไว้ได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "hide"` พร้อมรายงานที่ถูก triage
เพื่อซ่อน skill ใน workflow เดียวกันที่ตรวจสอบย้อนหลังได้

### `GET /api/v1/skills/-/appeals`

endpoint สำหรับ moderator/admin เพื่อรับคำอุทธรณ์ skill เข้า

พารามิเตอร์ Query:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `accepted`, `rejected` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-200)
- `cursor` (ไม่บังคับ): cursor สำหรับการแบ่งหน้า

### `POST /api/v1/skills/-/appeals/{appealId}/resolve`

endpoint สำหรับ moderator/admin เพื่อยอมรับ ปฏิเสธ หรือเปิดคำอุทธรณ์ skill อีกครั้ง
ต้องมี `note` สำหรับ `accepted` และ `rejected`; อาจละไว้ได้เมื่อตั้งค่า
`status` กลับเป็น `open` ส่ง `finalAction: "restore"` พร้อมคำอุทธรณ์ที่ได้รับการยอมรับ
เพื่อทำให้ skill พร้อมใช้งานอีกครั้ง

### `GET /api/v1/skills/{slug}/versions`

พารามิเตอร์คำค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม
- `cursor` (ไม่บังคับ): เคอร์เซอร์สำหรับแบ่งหน้า

### `GET /api/v1/skills/{slug}/versions/{version}`

ส่งคืนเมทาดาทาของเวอร์ชัน + รายการไฟล์

- `version.security` รวมสถานะการยืนยันการสแกนที่ปรับให้เป็นมาตรฐานและรายละเอียดสแกนเนอร์
  (VirusTotal + LLM) เมื่อมีข้อมูล

### `GET /api/v1/skills/{slug}/scan`

ส่งคืนรายละเอียดการยืนยันการสแกนความปลอดภัยสำหรับเวอร์ชัน Skills

พารามิเตอร์คำค้น:

- `version` (ไม่บังคับ): สตริงเวอร์ชันเฉพาะ
- `tag` (ไม่บังคับ): แปลงแท็กเป็นเวอร์ชันที่ระบุ (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` หรือ `tag` จะใช้เวอร์ชันล่าสุด
- รวมสถานะการยืนยันที่ปรับให้เป็นมาตรฐาน พร้อมรายละเอียดเฉพาะของสแกนเนอร์
- `security.capabilityTags` รวมป้ายกำกับความสามารถ/ความเสี่ยงแบบกำหนดแน่นอน เช่น
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` และ `posts-externally` เมื่อตรวจพบ
- `security.hasScanResult` เป็น `true` เฉพาะเมื่อสแกนเนอร์ให้ผลตัดสินที่ชัดเจน (`clean`, `suspicious` หรือ `malicious`)
- `moderation` คือสแนปช็อตการกลั่นกรองระดับ Skills ปัจจุบันที่ได้จากเวอร์ชันล่าสุด
- เมื่อค้นหาเวอร์ชันย้อนหลัง ให้ตรวจสอบ `moderation.matchesRequestedVersion` และ `moderation.sourceVersion` ก่อนถือว่า `moderation` และ `security` อยู่ในบริบทเวอร์ชันเดียวกัน

### `GET /api/v1/skills/{slug}/file`

ส่งคืนเนื้อหาข้อความดิบ

พารามิเตอร์คำค้น:

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
- Plugin บันเดิล

พารามิเตอร์คำค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์สำหรับแบ่งหน้า
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
- `externalService`, `binary`, `osPermission` (ไม่บังคับ): รูปย่อสำหรับแท็กข้อกำหนดสภาพแวดล้อมแบบระบุชื่อ
- `artifactKind` (ไม่บังคับ): `legacy-zip` หรือ `npm-pack`
- `npmMirror` (ไม่บังคับ): `true`/`1` เพื่อแสดงเวอร์ชันแพ็กเกจที่รองรับโดย ClawPack
  ซึ่งพร้อมใช้งานผ่าน npm mirror

หมายเหตุ:

- `GET /api/v1/code-plugins` และ `GET /api/v1/bundle-plugins` ยังคงเป็นนามแฝงแบบครอบครัวคงที่
- รายการ Skills ยังคงอิงกับรีจิสทรี Skills และยังเผยแพร่ได้ผ่าน `POST /api/v1/skills` เท่านั้น
- `POST /api/v1/packages` ยังคงใช้เฉพาะสำหรับรีลีส code-plugin และ bundle-plugin
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถเห็นแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนเป็นสมาชิกในผลลัพธ์รายการ/การค้นหา
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ผ่านการยืนยันตัวตนอ่านได้

### `GET /api/v1/packages/search`

การค้นหาแค็ตตาล็อกรวมข้าม Skills + แพ็กเกจ Plugin

พารามิเตอร์คำค้น:

- `q` (บังคับ): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `executesCode` (ไม่บังคับ): `true` หรือ `false`
- `capabilityTag` (ไม่บังคับ): ตัวกรองความสามารถสำหรับแพ็กเกจ Plugin
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` และ
  `osPermission` รองรับเป็นรูปย่อสำหรับแท็กความสามารถทั่วไป
- `artifactKind` (ไม่บังคับ): `legacy-zip` หรือ `npm-pack`
- `npmMirror` (ไม่บังคับ): `true`/`1` เพื่อค้นหาเวอร์ชันแพ็กเกจที่รองรับโดย ClawPack
  ซึ่งพร้อมใช้งานผ่าน npm mirror

หมายเหตุ:

- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถค้นหาแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนเป็นสมาชิกได้
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ผ่านการยืนยันตัวตนอ่านได้
- ตัวกรองอาร์ติแฟกต์อิงกับแท็กความสามารถที่ทำดัชนีไว้:
  `artifact:legacy-zip`, `artifact:npm-pack` และ `npm-mirror:available`

### `GET /api/v1/packages/{name}`

ส่งคืนเมทาดาทารายละเอียดแพ็กเกจ

หมายเหตุ:

- Skills สามารถแปลงผ่านเส้นทางนี้ในแค็ตตาล็อกรวมได้เช่นกัน
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่เจ้าของได้

### `DELETE /api/v1/packages/{name}`

ลบแพ็กเกจและรีลีสทั้งหมดแบบกู้คืนได้

หมายเหตุ:

- ต้องใช้โทเค็น API สำหรับเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลผู้เผยแพร่ขององค์กร,
  ผู้กลั่นกรองแพลตฟอร์ม หรือผู้ดูแลแพลตฟอร์ม

### `GET /api/v1/packages/{name}/versions`

ส่งคืนประวัติเวอร์ชัน

พารามิเตอร์คำค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์สำหรับแบ่งหน้า

หมายเหตุ:

- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่เจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}`

ส่งคืนเวอร์ชันแพ็กเกจหนึ่งรายการ รวมถึงเมทาดาทาไฟล์ ความเข้ากันได้
ความสามารถ การยืนยัน เมทาดาทาอาร์ติแฟกต์ และข้อมูลการสแกน

หมายเหตุ:

- `version.artifact.kind` คือ `legacy-zip` สำหรับไฟล์เก็บถาวรแพ็กเกจแบบเก่า หรือ
  `npm-pack` สำหรับรีลีสที่รองรับโดย ClawPack
- รีลีส ClawPack รวมฟิลด์ที่เข้ากันได้กับ npm ได้แก่ `npmIntegrity`, `npmShasum` และ
  `npmTarballName`
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` และ `version.staticScan` จะรวมอยู่เมื่อมีข้อมูลการสแกน
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่เจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

ส่งคืนเมทาดาทาตัวแก้ไขอาร์ติแฟกต์อย่างชัดเจนสำหรับเวอร์ชันแพ็กเกจ

หมายเหตุ:

- เวอร์ชันแพ็กเกจเดิมส่งคืนอาร์ติแฟกต์ `legacy-zip` และ ZIP เดิม
  `downloadUrl`
- เวอร์ชัน ClawPack ส่งคืนอาร์ติแฟกต์ `npm-pack`, ฟิลด์ความสมบูรณ์ของ npm,
  `tarballUrl` และ URL ความเข้ากันได้กับ ZIP เดิม
- นี่คือพื้นผิวตัวแก้ไขของ OpenClaw ซึ่งหลีกเลี่ยงการเดารูปแบบไฟล์เก็บถาวรจาก
  URL ที่ใช้ร่วมกัน

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ดาวน์โหลดอาร์ติแฟกต์ของเวอร์ชันผ่านเส้นทางตัวแก้ไขอย่างชัดเจน

หมายเหตุ:

- เวอร์ชัน ClawPack สตรีมไบต์ `.tgz` ของ npm-pack ที่อัปโหลดไว้จริง
- เวอร์ชัน ZIP เดิมเปลี่ยนเส้นทางไปยัง `/api/v1/packages/{name}/download?version=`
- ใช้บัคเก็ตอัตราการดาวน์โหลด

### `GET /api/v1/packages/{name}/readiness`

ส่งคืนความพร้อมที่คำนวณแล้วสำหรับการใช้งาน OpenClaw ในอนาคต

การตรวจสอบความพร้อมครอบคลุม:

- สถานะช่องทาง official
- ความพร้อมใช้งานของเวอร์ชันล่าสุด
- ความพร้อมใช้งานของอาร์ติแฟกต์ ClawPack npm-pack
- ไดเจสต์อาร์ติแฟกต์
- ที่มาของรีโปซอร์สและคอมมิต
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

ปลายทางผู้กลั่นกรองสำหรับแสดงรายการแถวการย้ายข้อมูล Plugin official ของ OpenClaw

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ผู้กลั่นกรองหรือผู้ดูแล

พารามิเตอร์คำค้น:

- `phase` (ไม่บังคับ): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` หรือ
  `all` (ค่าเริ่มต้น)
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์สำหรับแบ่งหน้า

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

ปลายทางผู้ดูแลสำหรับสร้างหรืออัปเดตแถวการย้ายข้อมูล Plugin official

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ผู้ดูแล

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
- `packageName` ถูกปรับให้เป็นรูปแบบชื่อ npm; แพ็กเกจอาจไม่มีอยู่สำหรับการย้ายข้อมูลที่วางแผนไว้
- สิ่งนี้ติดตามเฉพาะความพร้อมของการย้ายข้อมูลเท่านั้น ไม่ได้เปลี่ยนแปลง OpenClaw หรือสร้าง
  ClawPacks

### `GET /api/v1/packages/moderation/queue`

ปลายทางผู้กลั่นกรอง/ผู้ดูแลสำหรับคิวตรวจสอบรีลีสแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ผู้กลั่นกรองหรือผู้ดูแล

พารามิเตอร์คำค้น:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `blocked`, `manual` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์สำหรับแบ่งหน้า

ความหมายของสถานะ:

- `open`: รีลีสที่น่าสงสัย เป็นอันตราย รอดำเนินการ ถูกกักกัน ถูกเพิกถอน หรือถูกรายงาน
- `blocked`: รีลีสที่ถูกกักกัน ถูกเพิกถอน หรือเป็นอันตราย
- `manual`: รีลีสใดๆ ที่มีการแทนที่การกลั่นกรองด้วยตนเอง
- `all`: รีลีสใดๆ ที่มีการแทนที่ด้วยตนเอง สถานะการสแกนไม่สะอาด หรือรายงานแพ็กเกจ

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

รายงานแพ็กเกจเพื่อให้ผู้กลั่นกรองตรวจสอบ รายงานอยู่ระดับแพ็กเกจ และเชื่อมโยงกับเวอร์ชันได้แบบไม่บังคับ รายงานเหล่านี้ส่งต่อไปยังคิวกลั่นกรอง แต่จะไม่ซ่อนอัตโนมัติหรือ
บล็อกการดาวน์โหลดด้วยตัวเอง ผู้กลั่นกรองควรใช้การกลั่นกรองรีลีสเพื่อ
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

ปลายทางเจ้าของ/ผู้เผยแพร่แพ็กเกจสำหรับอุทธรณ์การกลั่นกรองบนรีลีส

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับเจ้าของแพ็กเกจหรือสมาชิกผู้เผยแพร่

คำขอ:

```json
{
  "version": "1.2.3",
  "message": "The native binary is signed and matches the linked source release."
}
```

คำอุทธรณ์จะถูกรับเฉพาะสำหรับรีลีสที่ถูกกักกัน ถูกเพิกถอน
น่าสงสัย หรือเป็นอันตราย ClawHub เก็บคำอุทธรณ์ที่เปิดอยู่หนึ่งรายการต่อรีลีส

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

ขอสแกนความปลอดภัยซ้ำสำหรับรุ่นแพ็กเกจที่เผยแพร่ล่าสุด

การยืนยันตัวตน:

- ต้องใช้ API token สำหรับเจ้าของแพ็กเกจ, ผู้ดูแลผู้เผยแพร่, ผู้ควบคุมแพลตฟอร์ม หรือผู้ดูแลแพลตฟอร์ม
- เจ้าของและผู้ดูแลผู้เผยแพร่อยู่ภายใต้ขีดจำกัดการกู้คืนของเจ้าของต่อรุ่น ผู้ควบคุมและผู้ดูแลแพลตฟอร์มไม่อยู่ภายใต้ขีดจำกัดนี้ แต่ ClawHub ยังอนุญาตให้มีการสแกนซ้ำที่ใช้งานอยู่ได้เพียงหนึ่งรายการต่อรุ่นเท่านั้น

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

ปลายทางสำหรับผู้ควบคุม/ผู้ดูแลเพื่อรับคำอุทธรณ์แพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้ API token สำหรับผู้ใช้ที่เป็นผู้ควบคุมหรือผู้ดูแล

พารามิเตอร์คำค้น:

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

ปลายทางสำหรับผู้ควบคุม/ผู้ดูแลเพื่อยอมรับ ปฏิเสธ หรือเปิดคำอุทธรณ์อีกครั้ง

คำขอ:

```json
{ "status": "accepted", "note": "False positive confirmed.", "finalAction": "approve" }
```

ต้องระบุ `note` สำหรับ `accepted` และ `rejected`; สามารถละเว้นได้เมื่อตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "approve"` พร้อมคำอุทธรณ์ที่ยอมรับแล้วเพื่ออนุมัติรุ่นที่ได้รับผลกระทบในเวิร์กโฟลว์เดียวกันที่ตรวจสอบย้อนหลังได้

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

ปลายทางสำหรับผู้ควบคุม/ผู้ดูแลเพื่อรับรายงานแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้ API token สำหรับผู้ใช้ที่เป็นผู้ควบคุมหรือผู้ดูแล

พารามิเตอร์คำค้น:

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

ปลายทางสำหรับเจ้าของ/ผู้ควบคุมเพื่อดูสถานะการควบคุมแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้ API token สำหรับเจ้าของแพ็กเกจ, สมาชิกผู้เผยแพร่, ผู้ควบคุม หรือผู้ใช้ที่เป็นผู้ดูแล

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

ปลายทางสำหรับผู้ควบคุม/ผู้ดูแลเพื่อแก้ไขหรือเปิดรายงานแพ็กเกจอีกครั้ง

คำขอ:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

ต้องระบุ `note` สำหรับ `confirmed` และ `dismissed`; สามารถละเว้นได้เมื่อตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "quarantine"` หรือ `finalAction: "revoke"` พร้อมรายงานที่ยืนยันแล้วเพื่อใช้การควบคุมรุ่นในเวิร์กโฟลว์เดียวกันที่ตรวจสอบย้อนหลังได้

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

ปลายทางสำหรับผู้ควบคุม/ผู้ดูแลเพื่อตรวจสอบรุ่นแพ็กเกจ

คำขอ:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

สถานะที่รองรับ:

- `approved`: ตรวจสอบด้วยตนเองและอนุญาตแล้ว
- `quarantined`: ถูกบล็อกระหว่างรอการติดตามผล
- `revoked`: ถูกบล็อกหลังจากที่รุ่นเคยได้รับความเชื่อถือมาก่อน

รุ่นที่ถูกกักกันและถูกเพิกถอนจะส่งคืน `403` จากเส้นทางดาวน์โหลดอาร์ติแฟกต์ ทุกการเปลี่ยนแปลงจะเขียนรายการบันทึกการตรวจสอบ

### `POST /api/v1/packages/backfill/artifacts`

ปลายทางบำรุงรักษาสำหรับผู้ดูแลเท่านั้น เพื่อกำกับรุ่นแพ็กเกจเก่าด้วยเมทาดาทาชนิดอาร์ติแฟกต์ที่ชัดเจน

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

- ค่าเริ่มต้นเป็นการทดลองรัน
- รุ่นที่ไม่มีพื้นที่จัดเก็บ ClawPack จะถูกกำกับเป็น `legacy-zip`
- แถวที่มี ClawPack รองรับอยู่แล้วแต่ไม่มี `artifactKind` จะได้รับการซ่อมเป็น `npm-pack`
- รายการนี้ไม่สร้าง ClawPack และไม่แก้ไขไบต์อาร์ติแฟกต์

### `GET /api/v1/packages/{name}/file`

ส่งคืนเนื้อหาข้อความดิบสำหรับไฟล์แพ็กเกจ

พารามิเตอร์คำค้น:

- `path` (บังคับ)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นเป็นรุ่นล่าสุด
- ใช้บักเก็ตอัตราการอ่าน ไม่ใช่บักเก็ตการดาวน์โหลด
- ไฟล์ไบนารีส่งคืน `415`
- ขีดจำกัดขนาดไฟล์: 200KB
- การสแกน VirusTotal ที่ค้างอยู่ไม่บล็อกการอ่าน; รุ่นที่เป็นอันตรายอาจยังถูกระงับไว้ที่อื่น
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่ที่เป็นเจ้าของได้

### `GET /api/v1/packages/{name}/download`

ดาวน์โหลดไฟล์ ZIP แบบกำหนดแน่นอนเดิมสำหรับรุ่นแพ็กเกจ

พารามิเตอร์คำค้น:

- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นเป็นรุ่นล่าสุด
- Skills เปลี่ยนเส้นทางไปยัง `GET /api/v1/download`
- อาร์ไคฟ์ Plugin/แพ็กเกจเป็นไฟล์ zip ที่มีรูท `package/` เพื่อให้ไคลเอนต์ OpenClaw รุ่นเก่ายังคงทำงานได้
- เส้นทางนี้คงไว้เฉพาะ ZIP เท่านั้น ไม่สตรีมไฟล์ ClawPack `.tgz`
- การตอบกลับมีส่วนหัว `ETag`, `Digest`, `X-ClawHub-Artifact-Type` และ `X-ClawHub-Artifact-Sha256` สำหรับการตรวจสอบความสมบูรณ์ของตัวแก้ไข
- เมทาดาทาที่มีเฉพาะในรีจิสทรีจะไม่ถูกแทรกเข้าไปในอาร์ไคฟ์ที่ดาวน์โหลด
- การสแกน VirusTotal ที่ค้างอยู่ไม่บล็อกการดาวน์โหลด; รุ่นที่เป็นอันตรายส่งคืน `403`
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะเป็นเจ้าของ

### `GET /api/npm/{package}`

ส่งคืน packument ที่เข้ากันได้กับ npm สำหรับเวอร์ชันแพ็กเกจที่มี ClawPack รองรับ

หมายเหตุ:

- แสดงเฉพาะเวอร์ชันที่มีการอัปโหลด tarball แบบ ClawPack npm-pack
- เวอร์ชันที่มีเฉพาะ ZIP แบบเดิมจะถูกละเว้นโดยตั้งใจ
- `dist.tarball`, `dist.integrity` และ `dist.shasum` ใช้ฟิลด์ที่เข้ากันได้กับ npm เพื่อให้ผู้ใช้ชี้ npm ไปยังมิเรอร์ได้หากต้องการ
- packument ของแพ็กเกจแบบมี scope รองรับทั้ง `/api/npm/@scope/name` และพาธคำขอที่เข้ารหัสของ npm คือ `/api/npm/@scope%2Fname`

### `GET /api/npm/{package}/-/{tarball}.tgz`

สตรีมไบต์ tarball ของ ClawPack ที่อัปโหลดไว้แบบตรงตามต้นฉบับสำหรับไคลเอนต์มิเรอร์ npm

หมายเหตุ:

- ใช้บักเก็ตอัตราการดาวน์โหลด
- ส่วนหัวการดาวน์โหลดมี SHA-256 ของ ClawHub รวมถึงเมทาดาทา integrity/shasum ของ npm
- การควบคุมและการตรวจสอบสิทธิ์เข้าถึงแพ็กเกจส่วนตัวยังคงมีผล

### `GET /api/v1/resolve`

CLI ใช้เพื่อแมปลายนิ้วมือในเครื่องกับเวอร์ชันที่รู้จัก

พารามิเตอร์คำค้น:

- `slug` (บังคับ)
- `hash` (บังคับ): sha256 แบบ hex 64 อักขระของลายนิ้วมือบันเดิล

การตอบกลับ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ดาวน์โหลด zip ของเวอร์ชัน skill

พารามิเตอร์คำค้น:

- `slug` (บังคับ)
- `version` (ไม่บังคับ): สตริง semver
- `tag` (ไม่บังคับ): ชื่อแท็ก (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- เวอร์ชันที่ถูกลบแบบ soft-delete ส่งคืน `410`
- สถิติการดาวน์โหลดนับเป็นตัวตนที่ไม่ซ้ำต่อชั่วโมง (`userId` เมื่อ API token ถูกต้อง มิฉะนั้นใช้ IP)

## ปลายทางการยืนยันตัวตน (Bearer token)

ปลายทางทั้งหมดต้องมี:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

ตรวจสอบ token และส่งคืน handle ของผู้ใช้

### `POST /api/v1/skills`

เผยแพร่เวอร์ชันใหม่

- แนะนำ: `multipart/form-data` พร้อม JSON `payload` + blob `files[]`
- ยอมรับเนื้อหา JSON ที่มี `files` (อ้างอิงจาก storageId) ด้วย
- ฟิลด์ payload ที่ไม่บังคับ: `ownerHandle` เมื่อมีฟิลด์นี้ API จะแก้ไขผู้เผยแพร่นั้นฝั่งเซิร์ฟเวอร์และกำหนดให้นักแสดงต้องมีสิทธิ์เข้าถึงผู้เผยแพร่
- ฟิลด์ payload ที่ไม่บังคับ: `migrateOwner` เมื่อเป็น `true` พร้อม `ownerHandle` skill ที่มีอยู่สามารถย้ายไปยังเจ้าของนั้นได้หากนักแสดงเป็นผู้ดูแล/เจ้าของทั้งในผู้เผยแพร่ปัจจุบันและผู้เผยแพร่เป้าหมาย หากไม่มีการเลือกใช้นี้ การเปลี่ยนเจ้าของจะถูกปฏิเสธ

### `POST /api/v1/packages`

เผยแพร่รุ่น code-plugin หรือ bundle-plugin

- ต้องมีการยืนยันตัวตนด้วย Bearer token
- แนะนำ: `multipart/form-data` พร้อม JSON `payload` + blob `files[]`
- ยอมรับเนื้อหา JSON ที่มี `files` (อ้างอิงจาก storageId) ด้วย
- ฟิลด์ payload ที่ไม่บังคับ: `ownerHandle` เมื่อมีฟิลด์นี้ เฉพาะผู้ดูแลเท่านั้นที่สามารถเผยแพร่ในนามของเจ้าของนั้นได้

ประเด็นสำคัญในการตรวจสอบ:

- `family` ต้องเป็น `code-plugin` หรือ `bundle-plugin`
- แพ็กเกจ Plugin ต้องมี `openclaw.plugin.json` การอัปโหลด ClawPack `.tgz` ต้องมีไฟล์นี้ที่ `package/openclaw.plugin.json`
- Plugin แบบโค้ดต้องมี `package.json`, เมทาดาทารีโปซอร์ส, เมทาดาทาคอมมิตซอร์ส, เมทาดาทาสคีมาการกำหนดค่า, `openclaw.compat.pluginApi` และ `openclaw.build.openclawVersion`
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมทาดาทาที่ไม่บังคับ
- เฉพาะผู้เผยแพร่ที่เชื่อถือได้เท่านั้นที่เผยแพร่ไปยังแชนเนล `official` ได้
- การเผยแพร่ในนามผู้อื่นยังคงตรวจสอบสิทธิ์การใช้แชนเนลทางการกับบัญชีเจ้าของเป้าหมาย

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

ลบแบบ soft-delete / กู้คืน skill (เจ้าของ, ผู้ควบคุม หรือผู้ดูแล)

เนื้อหา JSON ที่ไม่บังคับ:

```json
{ "reason": "Held for moderation pending legal review." }
```

เมื่อมี `reason` จะถูกจัดเก็บเป็นหมายเหตุการควบคุม skill และคัดลอกไปยังบันทึกการตรวจสอบ การลบแบบ soft-delete ที่เริ่มโดยเจ้าของจะสงวน slug ไว้ 30 วัน จากนั้นผู้เผยแพร่อื่นจึงสามารถอ้างสิทธิ์ slug ได้ การตอบกลับการลบมี `slugReservedUntil` เมื่อการหมดอายุนี้มีผล การซ่อนโดยผู้ควบคุม/ผู้ดูแลและการนำออกด้วยเหตุผลด้านความปลอดภัยจะไม่หมดอายุในลักษณะนี้

การตอบกลับการลบ:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

รหัสสถานะ:

- `200`: ตกลง
- `401`: ไม่ได้รับอนุญาต
- `403`: ถูกห้าม
- `404`: ไม่พบ skill/ผู้ใช้
- `500`: ข้อผิดพลาดภายในเซิร์ฟเวอร์

### `POST /api/v1/users/publisher`

สำหรับผู้ดูแลเท่านั้น รับประกันว่ามีผู้เผยแพร่องค์กรสำหรับ handle หาก handle ยังชี้ไปยังผู้เผยแพร่ผู้ใช้/ส่วนบุคคลแบบใช้ร่วมกันเดิม ปลายทางจะย้ายไปเป็นผู้เผยแพร่องค์กรก่อน

- เนื้อหา: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- การตอบกลับ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

สำหรับผู้ดูแลระบบเท่านั้น สงวน slug ระดับรากและชื่อแพ็กเกจให้เจ้าของที่ชอบธรรมโดยไม่เผยแพร่
รีลีส ชื่อแพ็กเกจจะกลายเป็นแพ็กเกจตัวแทนแบบส่วนตัวที่ไม่มีแถวรีลีส เพื่อให้เจ้าของรายเดิม
สามารถเผยแพร่รีลีส code-plugin หรือ bundle-plugin จริงลงในชื่อนั้นได้ในภายหลัง

- เนื้อหา: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- การตอบกลับ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Endpoint สำหรับจัดการ slug ของเจ้าของ

- `POST /api/v1/skills/{slug}/rename`
  - เนื้อหา: `{ "newSlug": "new-canonical-slug" }`
  - การตอบกลับ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - เนื้อหา: `{ "targetSlug": "canonical-target-slug" }`
  - การตอบกลับ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

หมายเหตุ:

- Endpoint ทั้งสองต้องใช้การยืนยันตัวตนด้วยโทเค็น API และทำงานได้เฉพาะสำหรับเจ้าของ Skills เท่านั้น
- `rename` จะเก็บ slug ก่อนหน้าไว้เป็นนามแฝงสำหรับเปลี่ยนเส้นทาง
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

ยกเลิกการแบนผู้ใช้และกู้คืน Skills ที่เข้าเกณฑ์ (เฉพาะ admin)

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

พารามิเตอร์คำค้น:

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

เพิ่ม/ลบดาว (ไฮไลต์) Endpoint ทั้งสองเป็นแบบ idempotent

การตอบกลับ:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Endpoint CLI เดิม (เลิกใช้แล้ว)

ยังรองรับสำหรับ CLI เวอร์ชันเก่า:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

ดู `DEPRECATIONS.md` สำหรับแผนการนำออก

## การค้นพบรีจิสทรี (`/.well-known/clawhub.json`)

CLI สามารถค้นพบการตั้งค่ารีจิสทรี/การยืนยันตัวตนจากเว็บไซต์ได้:

- `/.well-known/clawhub.json` (JSON, แนะนำ)
- `/.well-known/clawdhub.json` (แบบเดิม)

สคีมา:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

หากคุณโฮสต์เอง ให้ให้บริการไฟล์นี้ (หรือตั้งค่า `CLAWHUB_REGISTRY` อย่างชัดเจน; แบบเดิมคือ `CLAWDHUB_REGISTRY`)
