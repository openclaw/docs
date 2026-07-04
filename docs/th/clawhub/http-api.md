---
read_when:
    - การเพิ่ม/เปลี่ยนแปลงปลายทาง
    - การดีบักคำขอ CLI ↔ registry
summary: เอกสารอ้างอิง HTTP API (ปลายทางสาธารณะ + ปลายทาง CLI + การยืนยันตัวตน).
x-i18n:
    generated_at: "2026-07-04T15:40:18Z"
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
ยังคงรองรับ `/api/...` และ `/api/cli/...` แบบเดิมเพื่อความเข้ากันได้ (ดู `DEPRECATIONS.md`)
OpenAPI: `/api/v1/openapi.json`

## การนำแค็ตตาล็อกสาธารณะกลับมาใช้

ไดเรกทอรีของบุคคลที่สามอาจใช้เอนด์พอยต์อ่านแบบสาธารณะเพื่อแสดงรายการหรือค้นหา Skills ของ ClawHub โปรดแคชผลลัพธ์ เคารพ `429`/`Retry-After` ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ต้นฉบับ (`https://clawhub.ai/<owner>/skills/<slug>`) และหลีกเลี่ยงการสื่อว่า ClawHub รับรองเว็บไซต์บุคคลที่สามนั้น อย่าพยายามทำสำเนาเนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกโดยการดูแลเนื้อหาออกนอกพื้นผิว API สาธารณะ

ทางลัด slug บนเว็บจะ resolve ข้ามกลุ่มรีจิสทรี แต่ไคลเอนต์ API ควรใช้
URL ต้นฉบับที่เอนด์พอยต์อ่านส่งคืน แทนการประกอบลำดับความสำคัญของ route
ขึ้นมาใหม่

## ขีดจำกัดอัตรา

โมเดลการบังคับใช้:

- คำขอแบบไม่ระบุตัวตน: บังคับใช้ต่อ IP
- คำขอที่ยืนยันตัวตนแล้ว (Bearer token ที่ถูกต้อง): บังคับใช้ต่อบัคเก็ตของผู้ใช้
- หาก token ขาดหาย/ไม่ถูกต้อง พฤติกรรมจะถอยกลับไปใช้การบังคับใช้ตาม IP
- เอนด์พอยต์เขียนที่ยืนยันตัวตนแล้วไม่ควรส่งคืนแค่ `Unauthorized` เมื่อ
  เซิร์ฟเวอร์ทราบเหตุผล token ที่ขาดหาย token ที่ไม่ถูกต้อง/ถูกเพิกถอน และ
  บัญชีที่ถูกลบ/ถูกแบน/ถูกปิดใช้งานควรได้รับข้อความที่ดำเนินการต่อได้เพื่อให้ไคลเอนต์
  CLI บอกผู้ใช้ได้ว่าอะไรบล็อกพวกเขา

- อ่าน: 3000/นาที ต่อ IP, 12000/นาที ต่อคีย์
- เขียน: 300/นาที ต่อ IP, 3000/นาที ต่อคีย์
- ดาวน์โหลด: 1200/นาที ต่อ IP, 6000/นาที ต่อคีย์ (เอนด์พอยต์ดาวน์โหลด)

Headers:

- ความเข้ากันได้แบบเดิม: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- แบบมาตรฐาน: `RateLimit-Limit`, `RateLimit-Reset`
- เมื่อเป็น `429`: `X-RateLimit-Remaining: 0` และ `RateLimit-Remaining: 0`
- เมื่อเป็น `429`: `Retry-After`

ความหมายของ header:

- `X-RateLimit-Reset`: วินาที Unix epoch แบบสัมบูรณ์
- `RateLimit-Reset`: จำนวนวินาทีจนกว่าจะรีเซ็ต (ดีเลย์)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: งบประมาณที่เหลืออยู่แบบแม่นยำเมื่อมีอยู่
  คำขอที่สำเร็จแบบ sharded จะละเว้น header นี้แทนการส่งคืนค่าทั่วโลกแบบประมาณ
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

แนวทางสำหรับไคลเอนต์:

- หากมี `Retry-After` ให้รอจำนวนวินาทีนั้นก่อนลองใหม่
- ใช้ backoff พร้อม jitter เพื่อหลีกเลี่ยงการลองใหม่พร้อมกัน
- หากไม่มี `Retry-After` ให้ถอยไปใช้ `RateLimit-Reset` (หรือคำนวณจาก `X-RateLimit-Reset`)

แหล่งที่มาของ IP:

- ใช้ trusted client IP headers รวมถึง `cf-connecting-ip` เฉพาะเมื่อ
  deployment เปิดใช้ trusted forwarded headers อย่างชัดเจน
- ClawHub ใช้ trusted forwarding headers เพื่อระบุ IP ของไคลเอนต์ที่ edge
- หากไม่มี IP ของไคลเอนต์ที่เชื่อถือได้ คำขอแบบไม่ระบุตัวตนจะใช้บัคเก็ตสำรอง
  ที่กำหนดขอบเขตเฉพาะตามชนิดขีดจำกัดอัตรา บัคเก็ตสำรองเหล่านี้จะไม่รวม
  พาธ slug ชื่อแพ็กเกจ เวอร์ชัน query string หรือพารามิเตอร์ artifact อื่น ๆ
  ที่ผู้เรียกส่งมา

## การตอบกลับข้อผิดพลาด

การตอบกลับข้อผิดพลาด v1 แบบสาธารณะเป็นข้อความธรรมดาพร้อม `content-type: text/plain; charset=utf-8`
ซึ่งรวมถึงความล้มเหลวของการตรวจสอบ (`400`), ทรัพยากรสาธารณะที่ขาดหาย (`404`), ความล้มเหลวด้าน auth และ
สิทธิ์ (`401`/`403`), ขีดจำกัดอัตรา (`429`) และการดาวน์โหลดที่ถูกบล็อก ไคลเอนต์
ควรอ่าน body ของการตอบกลับเป็นสตริงที่มนุษย์อ่านได้ พารามิเตอร์ query ที่ไม่รู้จักจะถูก
ละเว้นเพื่อความเข้ากันได้ แต่พารามิเตอร์ query ที่รู้จักและมีค่าที่ไม่ถูกต้องจะส่งคืน
`400`

## เอนด์พอยต์สาธารณะ (ไม่ต้อง auth)

### `GET /api/v1/search`

พารามิเตอร์ query:

- `q` (จำเป็น): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม
- `highlightedOnly` (ไม่บังคับ): `true` เพื่อกรองเฉพาะ Skills ที่ไฮไลต์
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias แบบเดิมของ `nonSuspiciousOnly`

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

- ผลลัพธ์จะถูกส่งคืนตามลำดับความเกี่ยวข้อง (embedding similarity + การบูสต์ token ของ slug/name ที่ตรงกันแบบ exact + popularity prior เล็กน้อย)
- ความเกี่ยวข้องมีน้ำหนักมากกว่าความนิยม token ของ slug หรือ display-name ที่ตรงอย่างแม่นยำสามารถจัดอันดับสูงกว่าการจับคู่ที่หลวมกว่าแม้มี engagement สูงกว่ามาก
- ข้อความ ASCII จะถูก tokenized ตามขอบเขตคำและเครื่องหมายวรรคตอน ตัวอย่างเช่น `personal-map` มี token `map` แบบเดี่ยว ขณะที่ `amap-jsapi-skill` มี `amap`, `jsapi` และ `skill`; ดังนั้นการค้นหา `map` จึงให้ `personal-map` มี lexical match ที่แข็งแรงกว่า `amap-jsapi-skill`
- ความนิยมใช้สเกล log และมีเพดาน Skills ที่มี engagement สูงอาจจัดอันดับต่ำกว่าเมื่อข้อความคำค้นจับคู่ได้อ่อนกว่า
- สถานะการดูแลเนื้อหาที่น่าสงสัยหรือซ่อนอยู่อาจนำ Skill ออกจากการค้นหาสาธารณะ ขึ้นอยู่กับตัวกรองของผู้เรียกและสถานะการดูแลเนื้อหาปัจจุบัน

แนวทางการค้นพบสำหรับผู้เผยแพร่:

- ใส่คำที่ผู้ใช้จะค้นหาจริงไว้ในชื่อที่แสดง สรุป และแท็ก ใช้ token slug แบบเดี่ยวเฉพาะเมื่อมันเป็นตัวตนที่เสถียรซึ่งคุณต้องการเก็บไว้ด้วย
- อย่าเปลี่ยนชื่อ slug เพียงเพื่อไล่ตามคำค้นหนึ่งคำ เว้นแต่ slug ใหม่จะเป็นชื่อต้นฉบับระยะยาวที่ดีกว่า slug เก่าจะกลายเป็น redirect aliases แต่ URL ต้นฉบับ slug ที่แสดง และ search digests ในอนาคตจะใช้ slug ใหม่
- Rename aliases รักษาการ resolve สำหรับ URL เก่าและการติดตั้งที่ resolve ผ่านรีจิสทรี แต่การจัดอันดับค้นหาจะอิงตาม metadata ของ Skill ต้นฉบับหลังจาก rename ถูก indexed แล้ว สถิติเดิมยังคงอยู่กับ Skill
- หาก Skill มองไม่เห็นอย่างไม่คาดคิด ให้ตรวจสอบสถานะการดูแลเนื้อหาก่อนด้วย `clawhub inspect @owner/slug` ขณะล็อกอิน ก่อนเปลี่ยน metadata ที่เกี่ยวกับการจัดอันดับ

### `GET /api/v1/skills`

พารามิเตอร์ query:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–200)
- `cursor` (ไม่บังคับ): pagination cursor สำหรับการเรียงลำดับใด ๆ ที่ไม่ใช่ `trending`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), install aliases แบบเดิม `installsCurrent`/`installs`/`installsAllTime` map ไปยัง `downloads`, `trending`
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias แบบเดิมของ `nonSuspiciousOnly`

ค่า `sort` ที่ไม่ถูกต้องจะส่งคืน `400`

หมายเหตุ:

- `recommended` ใช้สัญญาณ engagement และความใหม่
- `trending` จัดอันดับตามการติดตั้งใน 7 วันที่ผ่านมา (อิง telemetry)
- `createdAt` เสถียรสำหรับการ crawl Skill ใหม่; `updated` จะเปลี่ยนเมื่อ Skills เดิมถูกเผยแพร่ใหม่
- เมื่อ `nonSuspiciousOnly=true` การเรียงลำดับแบบ cursor-based อาจส่งคืนรายการน้อยกว่า `limit` ในหนึ่งหน้า เพราะ Skills ที่น่าสงสัยถูกกรองหลังจากดึงหน้าแล้ว
- ใช้ `nextCursor` เพื่อทำ pagination ต่อเมื่อมีอยู่ หน้าที่สั้นไม่ได้หมายความว่าเป็นจุดสิ้นสุดของผลลัพธ์โดยตัวมันเอง

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

- slug เก่าที่สร้างโดย flow การ rename/merge ของ owner จะ resolve ไปยัง Skill ต้นฉบับ
- `metadata.os`: ข้อจำกัด OS ที่ประกาศใน frontmatter ของ Skill (เช่น `["macos"]`, `["linux"]`) เป็น `null` หากไม่ได้ประกาศ
- `metadata.systems`: เป้าหมายระบบ Nix (เช่น `["aarch64-darwin", "x86_64-linux"]`) เป็น `null` หากไม่ได้ประกาศ
- `metadata` เป็น `null` หาก Skill ไม่มี platform metadata
- `moderation` จะรวมอยู่เฉพาะเมื่อ Skill ถูก flag หรือ owner กำลังดูอยู่

### `GET /api/v1/skills/{slug}/moderation`

ส่งคืนสถานะการดูแลเนื้อหาแบบมีโครงสร้าง

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

- Owners และ moderators สามารถเข้าถึงรายละเอียดการดูแลเนื้อหาสำหรับ Skills ที่ซ่อนอยู่
- ผู้เรียกสาธารณะจะได้รับ `200` เฉพาะสำหรับ Skills ที่มองเห็นได้และถูก flag อยู่แล้ว
- หลักฐานจะถูก redacted สำหรับผู้เรียกสาธารณะ และรวม raw snippets เฉพาะสำหรับ owners/moderators

### `POST /api/v1/skills/{slug}/report`

รายงาน Skill เพื่อให้ moderator ตรวจสอบ รายงานเป็นระดับ Skill โดยอาจลิงก์
กับเวอร์ชันได้ และจะเข้าสู่คิวรายงาน Skill

Auth:

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

เอนด์พอยต์ moderator/admin สำหรับรับรายงาน Skill

พารามิเตอร์ query:

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

เอนด์พอยต์ moderator/admin สำหรับแก้ไขหรือเปิดรายงาน Skill อีกครั้ง

คำขอ:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

ต้องมี `note` สำหรับ `confirmed` และ `dismissed`; อาจละเว้นได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "hide"` พร้อมรายงานที่ triaged แล้ว
เพื่อซ่อน Skill ใน workflow เดียวกันที่ตรวจสอบย้อนหลังได้

### `GET /api/v1/skills/{slug}/versions`

พารามิเตอร์ query:

- `limit` (ไม่บังคับ): จำนวนเต็ม
- `cursor` (ไม่บังคับ): pagination cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

ส่งคืน metadata ของเวอร์ชัน + รายการไฟล์

- `version.security` รวมสถานะการยืนยันการสแกนที่ normalize แล้วและรายละเอียด scanner
  (VirusTotal + LLM) เมื่อมี

### `GET /api/v1/skills/{slug}/scan`

ส่งคืนรายละเอียดการยืนยันการสแกนความปลอดภัยสำหรับเวอร์ชันของ Skill

พารามิเตอร์ query:

- `version` (ไม่บังคับ): สตริงเวอร์ชันเฉพาะ
- `tag` (ไม่บังคับ): resolve เวอร์ชันที่ tagged (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- รวมสถานะการตรวจสอบที่ปรับให้อยู่ในรูปแบบมาตรฐาน พร้อมรายละเอียดเฉพาะของสแกนเนอร์
- `security.hasScanResult` เป็น `true` เฉพาะเมื่อสแกนเนอร์ให้คำตัดสินที่แน่ชัด (`clean`, `suspicious` หรือ `malicious`)
- `moderation` คือสแนปช็อตการกลั่นกรองระดับ skill ปัจจุบันที่ได้มาจากเวอร์ชันล่าสุด
- เมื่อสืบค้นเวอร์ชันย้อนหลัง ให้ตรวจสอบ `moderation.matchesRequestedVersion` และ `moderation.sourceVersion` ก่อนถือว่า `moderation` และ `security` อยู่ในบริบทเวอร์ชันเดียวกัน

### `POST /api/v1/skills/-/scan`

เอนด์พอยต์ส่งคำขอแบบยืนยันตัวตนสำหรับงาน ClawScan ใหม่

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
- การสแกนที่เผยแพร่แล้วต้องมีสิทธิ์จัดการของเจ้าของ/ผู้เผยแพร่ หรือสิทธิ์ผู้กลั่นกรอง/ผู้ดูแลแพลตฟอร์ม
- การสแกนที่เผยแพร่แล้วจะเขียนกลับเฉพาะเมื่อ `update: true` และการสแกนเสร็จสมบูรณ์สำเร็จ
- การตอบกลับคือ `202` พร้อม `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`
- งานสแกนเป็นแบบอะซิงโครนัส คำขอสแกนด้วยตนเองจะได้รับลำดับความสำคัญก่อนงานเผยแพร่/เติมข้อมูลย้อนหลังตามปกติ แต่การเสร็จสมบูรณ์ยังขึ้นอยู่กับความพร้อมของ worker

### `GET /api/v1/skills/-/scan/{scanId}`

เอนด์พอยต์โพลแบบยืนยันตัวตนสำหรับการสแกนที่ส่งแล้ว

- คืนค่าสถานะอยู่ในคิว/กำลังทำงาน/สำเร็จ/ล้มเหลว
- คืนค่า `queue.queuedAhead` และ `queue.position` ขณะอยู่ในคิว เพื่อให้ไคลเอนต์แสดงได้ว่ามีการสแกนด้วยตนเองที่มีลำดับความสำคัญอยู่ก่อนคำขอกี่รายการ คิวที่ใหญ่มากจะถูกจำกัดขอบเขตและรายงานด้วย `queuedAheadIsEstimate: true`
- เมื่อพร้อมใช้งาน `report` จะมีส่วน `clawscan`, `skillspector`, `staticAnalysis` และ `virustotal`
- งานสแกนที่ล้มเหลวจะคืนค่า `status: "failed"` พร้อม `lastError`

### `GET /api/v1/skills/-/scan/{scanId}/download`

เอนด์พอยต์คลังรายงานแบบยืนยันตัวตน

- ต้องเป็นการสแกนที่สำเร็จแล้ว การสแกนที่ยังไม่สิ้นสุดจะคืนค่า `409`
- คืนค่า ZIP ที่มี `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

เอนด์พอยต์คลังรายงานที่จัดเก็บไว้แบบยืนยันตัวตนสำหรับเวอร์ชันที่ส่งแล้ว

- ต้องมีสิทธิ์จัดการของเจ้าของ/ผู้เผยแพร่ต่อ skill หรือ Plugin หรือมีสิทธิ์ผู้กลั่นกรอง/ผู้ดูแลแพลตฟอร์ม
- คืนค่าผลการสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งอย่างตรงกัน รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อนไว้
- `kind` มีค่าเริ่มต้นเป็น `skill`; ใช้ `kind=plugin` สำหรับการสแกน plugin/package
- คืนค่า ZIP รูปแบบเดียวกับการดาวน์โหลดคำขอสแกน

### `POST /api/v1/skills/-/scan/batch`

เส้นทางสแกนซ้ำแบบกลุ่มที่เป็นมาตรฐานสำหรับผู้ดูแลเท่านั้น รับเพย์โหลดรูปแบบเดียวกับ `POST /api/v1/skills/-/rescan-batch` แบบเดิม

### `POST /api/v1/skills/-/scan/batch/status`

เส้นทางสถานะแบบกลุ่มที่เป็นมาตรฐานสำหรับผู้ดูแลเท่านั้น รับ `{ "jobIds": ["..."] }` และคืนค่าตัวนับรวมแบบเดียวกับ `POST /api/v1/skills/-/rescan-batch/status` แบบเดิม

### `GET /api/v1/skills/{slug}/verify`

คืนค่าเอนเวโลปการตรวจสอบการ์ด Skill ที่ใช้โดย `clawhub skill verify`

พารามิเตอร์คำค้น:

- `version` (ไม่บังคับ): สตริงเวอร์ชันที่ระบุ
- `tag` (ไม่บังคับ): แปลงแท็กเป็นเวอร์ชันที่แท็กไว้ (เช่น `latest`)

หมายเหตุ:

- `ok` เป็น `true` เฉพาะเมื่อเวอร์ชันที่เลือกมีการ์ด Skill ที่สร้างแล้ว ไม่ถูกการกลั่นกรองบล็อกว่าเป็นมัลแวร์ และการตรวจสอบ ClawScan สะอาด
- ตัวตนของ Skill, ตัวตนของผู้เผยแพร่ และเมทาดาทาของเวอร์ชันที่เลือกเป็นฟิลด์ระดับบนสุดของเอนเวโลป (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) เพื่อให้ระบบอัตโนมัติในเชลล์อ่านได้โดยไม่ต้องแกะ wrapper ที่ซ้อนกัน
- `security` คือคำตัดสิน ClawScan/security ระดับบนสุด ระบบอัตโนมัติควรอิงจาก `ok`, `decision`, `reasons` และ `security.status`
- `security.signals` มีหลักฐานสนับสนุนจากสแกนเนอร์ เช่น `staticScan`, `virusTotal` และ `skillSpector`
- `security.signals.dependencyRegistry` ถูกคงไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่สแกนเนอร์ตรวจการมีอยู่ของรีจิสทรี dependency ถูกเลิกใช้แล้ว และคีย์นี้เป็น `null` เสมอ
- `provenance` เป็น `server-resolved-github-import` เฉพาะเมื่อ ClawHub แปลงและจัดเก็บ repo/ref/commit/path ของ GitHub ระหว่างการเผยแพร่หรือนำเข้า มิฉะนั้นจะเป็น `unavailable`

### `POST /api/v1/skills/-/security-verdicts`

คืนค่าคำตัดสินด้านความปลอดภัยแบบย่อปัจจุบันสำหรับเวอร์ชัน skill ที่ตรงกัน เอนด์พอยต์คอลเลกชันนี้มีไว้สำหรับไคลเอนต์ที่รู้อยู่แล้วว่าต้องแสดงเวอร์ชัน skill ของ ClawHub ที่ติดตั้งไว้รายการใด เช่น OpenClaw Control UI

คำขอ:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

หมายเหตุ:

- `items` ต้องมีคู่ `{ slug, version }` ที่ไม่ซ้ำกัน 1-100 คู่
- ผลลัพธ์แยกตามแต่ละรายการ การขาด skill หรือเวอร์ชันหนึ่งรายการจะไม่ทำให้การตอบกลับทั้งหมดล้มเหลว
- การตอบกลับมีเฉพาะข้อมูลความปลอดภัย ไม่รวมข้อมูลการ์ด Skill, สถานะการ์ดที่สร้างแล้ว, รายการไฟล์ artifact หรือเพย์โหลดสแกนเนอร์แบบละเอียด
- `security.signals` มีเฉพาะหลักฐานสนับสนุนระดับสถานะ ใช้ `/scan` หรือหน้าตรวจสอบความปลอดภัยของ ClawHub สำหรับรายละเอียดสแกนเนอร์แบบเต็ม
- `security.signals.dependencyRegistry` ถูกคงไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่สแกนเนอร์ตรวจการมีอยู่ของรีจิสทรี dependency ถูกเลิกใช้แล้ว และคีย์นี้เป็น `null` เสมอ
- การไม่มีการ์ด Skill ไม่มีผลต่อ `ok`, `decision` หรือ `reasons` ของเอนด์พอยต์นี้ ไคลเอนต์ควรอ่าน `skill-card.md` ที่ติดตั้งไว้ในเครื่องเมื่อต้องการเนื้อหาการ์ด
- ใช้ `/verify` เมื่อต้องการเอนเวโลปการตรวจสอบการ์ด Skill สำหรับ skill เดียว, `/card` เมื่อต้องการ markdown ของการ์ดที่สร้างแล้ว และ `/scan` เมื่อต้องการข้อมูลสแกนเนอร์แบบละเอียด

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

endpoint แค็ตตาล็อกแบบรวมสำหรับ:

- Skills
- Plugin โค้ด
- Plugin แบบบันเดิล

พารามิเตอร์ Query:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): cursor สำหรับการแบ่งหน้า
- `family` (ไม่บังคับ): `skill`, `code-plugin`, หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community`, หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended`, `trending`, `downloads`, alias เดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอจำกัดขอบเขตไว้ที่แพ็กเกจ Plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, หรือ endpoint ของแพ็กเกจที่มี
  `family=code-plugin`/`family=bundle-plugin`) หมวดหมู่ที่ควบคุมและ
  alias ตัวกรอง v1 เดิมมีเอกสารอยู่ภายใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, หรือ `sort` จะส่งคืน `400` พารามิเตอร์ query ที่ไม่รู้จักจะถูกละเว้น
- `GET /api/v1/code-plugins` และ `GET /api/v1/bundle-plugins` ยังคงเป็น alias แบบ family คงที่
- รายการ Skills ยังคงรองรับโดย skill registry และยังเผยแพร่ได้เฉพาะผ่าน `POST /api/v1/skills`
- `POST /api/v1/packages` ยังคงใช้เฉพาะสำหรับ release ของ code-plugin และ bundle-plugin
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ยืนยันตัวตนแล้วสามารถเห็นแพ็กเกจส่วนตัวของ publisher ที่ตนสังกัดในผลลัพธ์รายการ/ค้นหา
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ยืนยันตัวตนแล้วอ่านได้

### `GET /api/v1/packages/search`

การค้นหาแค็ตตาล็อกแบบรวมทั่วทั้ง Skills + แพ็กเกจ Plugin

พารามิเตอร์ Query:

- `q` (จำเป็น): สตริง query
- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `family` (ไม่บังคับ): `skill`, `code-plugin`, หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community`, หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอจำกัดขอบเขตไว้ที่แพ็กเกจ Plugin หมวดหมู่ที่ควบคุมและ alias ตัวกรอง v1
  เดิมมีเอกสารอยู่ภายใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured`, หรือ
  `highlightedOnly` จะส่งคืน `400` พารามิเตอร์ query ที่ไม่รู้จักจะถูกละเว้น
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ยืนยันตัวตนแล้วสามารถค้นหาแพ็กเกจส่วนตัวของ publisher ที่ตนสังกัด
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ยืนยันตัวตนแล้วอ่านได้

### `GET /api/v1/plugins`

เรียกดูแค็ตตาล็อกเฉพาะ Plugin ทั่วทั้งแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์ Query:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): cursor สำหรับการแบ่งหน้า
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `recommended` (ค่าเริ่มต้น), `trending`, `downloads`, `updated`, alias เดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

alias ตัวกรอง v1 เดิมยังคงยอมรับบน endpoint แบบอ่าน:

- `mcp-tooling`, `data`, และ `automation` resolve เป็น `tools`
- `observability` และ `deployment` resolve เป็น `gateway`
- `dev-tools` resolve เป็น `runtime`

`trending` คือ leaderboard การติดตั้ง/ดาวน์โหลดเจ็ดวัน และไม่ใช้ยอดรวมตลอดกาล
บน endpoint รวม `/api/v1/packages` จะใช้กับ Plugin เท่านั้น; ใช้
`/api/v1/skills?sort=trending` สำหรับแค็ตตาล็อก Skills

alias เดิมจะไม่ถูกยอมรับเป็นค่าหมวดหมู่ที่จัดเก็บหรือที่ผู้เขียนประกาศ

### `GET /api/v1/skills/export`

ส่งออก Skills สาธารณะล่าสุดจำนวนมากสำหรับการวิเคราะห์แบบออฟไลน์

Auth:

- ต้องใช้ API token

พารามิเตอร์ Query:

- `startDate` (จำเป็น): ขอบเขตล่างเป็น Unix milliseconds สำหรับ `updatedAt` ของ skill
- `endDate` (จำเป็น): ขอบเขตบนเป็น Unix milliseconds สำหรับ `updatedAt` ของ skill
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): cursor สำหรับการแบ่งหน้าจากการตอบกลับก่อนหน้า

การตอบกลับ:

- Body: ไฟล์ ZIP archive
- skill แต่ละรายการที่ส่งออกมี root อยู่ที่ `{publisher}/{slug}/`
- Skills ที่โฮสต์จะรวมไฟล์เวอร์ชันล่าสุดที่จัดเก็บไว้ และแสดงรายการใน
  `_manifest.json` พร้อม `sourceRef: "public-clawhub"`
- Skills ปัจจุบันที่รองรับโดย GitHub และมีการสแกนเป็น `clean` หรือ `suspicious` จะรวม
  `_source_handoff.json` พร้อม `sourceRef: "public-github"`, repo, commit, path,
  content hash และ archive URL โดยจะไม่รวมไฟล์ซอร์สที่โฮสต์บน ClawHub
- skill แต่ละรายการรวม `_export_skill_meta.json`
- `_manifest.json` จะถูกรวมไว้ที่ root ของ ZIP เสมอ
- `_errors.json` จะถูกรวมไว้เมื่อไม่สามารถส่งออก Skills หรือไฟล์บางรายการได้

Headers:

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

- `startDate` (จำเป็น): ขอบเขตล่างแบบมิลลิวินาที Unix สำหรับ `updatedAt` ของ Plugin
- `endDate` (จำเป็น): ขอบเขตบนแบบมิลลิวินาที Unix สำหรับ `updatedAt` ของ Plugin
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าจากการตอบกลับก่อนหน้า
- `family` (ไม่บังคับ): `code-plugin` หรือ `bundle-plugin` หากไม่ระบุหมายถึงทั้งสองตระกูล
  Plugin

การตอบกลับ:

- เนื้อหา: ไฟล์เก็บถาวร ZIP
- Plugin ที่ส่งออกแต่ละรายการมีรากอยู่ที่ `{family}/{packageName}/`
- Plugin ที่ส่งออกแต่ละรายการรวมไฟล์ที่จัดเก็บไว้ของรีลีสล่าสุด
- เมทาดาทาการส่งออกต่อ Plugin จัดเก็บไว้ที่
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

ค้นหาเฉพาะ Plugin ในแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์คำค้น:

- `q` (จำเป็น): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

หมายเหตุ:

- นามแฝงตัวกรอง v1 แบบเดิมที่บันทึกไว้ใต้ `GET /api/v1/plugins` ก็ยอมรับเช่นกัน
- การกรองหมวดหมู่เป็นตัวกรอง API จริงที่รองรับด้วยแถวไดเจสต์หมวดหมู่ Plugin
  ไม่ใช่การเขียนคำค้นใหม่
- ผลลัพธ์จะถูกส่งกลับตามลำดับความเกี่ยวข้อง และปัจจุบันยังไม่มีการแบ่งหน้า
- ตัวควบคุมการเรียงลำดับ UI เบราว์เซอร์สำหรับการค้นหา Plugin จะเรียงผลลัพธ์ความเกี่ยวข้องที่โหลดแล้วใหม่
  ให้ตรงกับพฤติกรรมการเรียกดู `/skills` ปัจจุบัน

### `GET /api/v1/packages/{name}`

ส่งกลับเมทาดาทารายละเอียดแพ็กเกจ

หมายเหตุ:

- Skills สามารถ resolve ผ่านเส้นทางนี้ในแค็ตตาล็อกรวมได้เช่นกัน
- แพ็กเกจส่วนตัวจะส่งกลับ `404` เว้นแต่ผู้เรียกจะอ่าน publisher เจ้าของได้

### `DELETE /api/v1/packages/{name}`

ลบแพ็กเกจและรีลีสทั้งหมดแบบ soft-delete

หมายเหตุ:

- ต้องใช้โทเค็น API สำหรับเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแล publisher ขององค์กร,
  ผู้ตรวจสอบแพลตฟอร์ม หรือผู้ดูแลแพลตฟอร์ม

### `GET /api/v1/packages/{name}/versions`

ส่งกลับประวัติเวอร์ชัน

พารามิเตอร์คำค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

หมายเหตุ:

- แพ็กเกจส่วนตัวจะส่งกลับ `404` เว้นแต่ผู้เรียกจะอ่าน publisher เจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}`

ส่งกลับแพ็กเกจหนึ่งเวอร์ชัน รวมถึงเมทาดาทาไฟล์ ความเข้ากันได้
การยืนยัน เมทาดาทาอาร์ติแฟกต์ และข้อมูลการสแกน

หมายเหตุ:

- `version.artifact.kind` เป็น `legacy-zip` สำหรับไฟล์เก็บถาวรแพ็กเกจแบบเก่า หรือ
  `npm-pack` สำหรับรีลีสที่รองรับโดย ClawPack
- รีลีส ClawPack มีฟิลด์ที่เข้ากันได้กับ npm ได้แก่ `npmIntegrity`, `npmShasum` และ
  `npmTarballName`
- `version.sha256hash` เป็นเมทาดาทาความเข้ากันได้ที่เลิกใช้แล้วสำหรับไคลเอนต์เก่า ซึ่ง
  แฮชไบต์ ZIP ที่แน่นอนที่ส่งกลับโดย `/api/v1/packages/{name}/download`
  ไคลเอนต์สมัยใหม่ควรใช้ `version.artifact.sha256` ซึ่งระบุ
  อาร์ติแฟกต์รีลีสมาตรฐาน
- `version.vtAnalysis`, `version.llmAnalysis` และ `version.staticScan` จะถูกรวมไว้
  เมื่อมีข้อมูลการสแกน
- แพ็กเกจส่วนตัวจะส่งกลับ `404` เว้นแต่ผู้เรียกจะอ่าน publisher เจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}/security`

ส่งกลับสรุปความปลอดภัยและความน่าเชื่อถือของรีลีสแพ็กเกจที่แน่นอนสำหรับไคลเอนต์ติดตั้ง
นี่คือพื้นผิวการใช้งานสาธารณะของ OpenClaw สำหรับตัดสินว่า
รีลีสที่ resolve แล้วสามารถติดตั้งได้หรือไม่

การยืนยันตัวตน:

- เอนด์พอยต์อ่านสาธารณะ ไม่ต้องใช้โทเค็นเจ้าของ, publisher, ผู้ตรวจสอบ หรือผู้ดูแล

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
  รีลีสที่แน่นอนซึ่งถูกประเมิน
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` และ `release.npmTarballName` จะแสดงเมื่อทราบค่าสำหรับ
  อาร์ติแฟกต์รีลีส
- `trust.scanStatus` คือสถานะความน่าเชื่อถือที่มีผล ซึ่งได้มาจากอินพุตของสแกนเนอร์
  และการตรวจสอบรีลีสแบบ manual
- `trust.moderationState` เป็น nullable โดยเป็น `null` เมื่อไม่มีการตรวจสอบรีลีสแบบ
  manual
- `trust.blockedFromDownload` คือสัญญาณบล็อกการติดตั้ง OpenClaw และไคลเอนต์ติดตั้งอื่น
  ควรบล็อกการติดตั้งเมื่อค่านี้เป็น `true` แทนที่จะ
  คำนวณกฎการบล็อกซ้ำจากฟิลด์สแกนเนอร์หรือการตรวจสอบ
- `trust.reasons` คือรายการคำอธิบายสำหรับผู้ใช้และการตรวจสอบย้อนหลัง รหัสเหตุผล
  เป็นสตริงที่เสถียรและกะทัดรัด เช่น `manual:quarantined`, `scan:malicious`
  และ `package:malicious`
- `trust.pending` หมายถึงอินพุตความน่าเชื่อถือหนึ่งรายการขึ้นไปยังรอการดำเนินการให้เสร็จสิ้น
- `trust.stale` หมายถึงสรุปความน่าเชื่อถือถูกคำนวณจากอินพุตที่ล้าสมัย และ
  ควรถูกถือว่าต้องรีเฟรชก่อนการตัดสินใจอนุญาตที่มีความมั่นใจสูง

หมายเหตุ:

- เอนด์พอยต์นี้เจาะจงตามเวอร์ชัน ไคลเอนต์ควรเรียกหลังจาก resolve
  เวอร์ชันแพ็กเกจที่ตั้งใจจะติดตั้ง ไม่ใช่เพียงหลังจากอ่าน
  เมทาดาทาแพ็กเกจล่าสุด
- แพ็กเกจส่วนตัวจะส่งกลับ `404` เว้นแต่ผู้เรียกจะอ่าน publisher เจ้าของได้
- เอนด์พอยต์นี้ตั้งใจให้แคบกว่าเอนด์พอยต์การตรวจสอบของเจ้าของ/ผู้ตรวจสอบ
  โดยเปิดเผยการตัดสินใจติดตั้งและคำอธิบายสาธารณะ ไม่ใช่
  ตัวตนผู้รายงาน เนื้อหารายงาน หลักฐานส่วนตัว หรือไทม์ไลน์การตรวจสอบภายใน

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

ส่งกลับเมทาดาทา resolver อาร์ติแฟกต์แบบชัดเจนสำหรับเวอร์ชันแพ็กเกจ

หมายเหตุ:

- เวอร์ชันแพ็กเกจแบบเดิมส่งกลับอาร์ติแฟกต์ `legacy-zip` และ
  `downloadUrl` ของ ZIP แบบเดิม
- เวอร์ชัน ClawPack ส่งกลับอาร์ติแฟกต์ `npm-pack`, ฟิลด์ integrity ของ npm,
  `tarballUrl` และ URL ความเข้ากันได้ของ ZIP แบบเดิม
- นี่คือพื้นผิว resolver ของ OpenClaw ซึ่งหลีกเลี่ยงการเดารูปแบบไฟล์เก็บถาวรจาก
  URL ที่ใช้ร่วมกัน

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ดาวน์โหลดอาร์ติแฟกต์เวอร์ชันผ่านเส้นทาง resolver แบบชัดเจน

หมายเหตุ:

- เวอร์ชัน ClawPack สตรีมไบต์ `.tgz` ของ npm-pack ที่อัปโหลดไว้อย่างแน่นอน
- เวอร์ชัน ZIP แบบเดิมเปลี่ยนเส้นทางไปที่ `/api/v1/packages/{name}/download?version=`
- ใช้ bucket อัตราการดาวน์โหลด

### `GET /api/v1/packages/{name}/readiness`

ส่งกลับ readiness ที่คำนวณแล้วสำหรับการใช้งาน OpenClaw ในอนาคต

การตรวจ readiness ครอบคลุม:

- สถานะช่องทางทางการ
- ความพร้อมใช้งานของเวอร์ชันล่าสุด
- ความพร้อมใช้งานของอาร์ติแฟกต์ ClawPack npm-pack
- ไดเจสต์อาร์ติแฟกต์
- repo แหล่งที่มาและที่มาของคอมมิต
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

เอนด์พอยต์ผู้ตรวจสอบสำหรับแสดงรายการแถวการย้าย Plugin ทางการของ OpenClaw

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ผู้ตรวจสอบหรือผู้ดูแล

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

เอนด์พอยต์ผู้ดูแลสำหรับสร้างหรืออัปเดตแถวการย้าย Plugin ทางการ

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

- `bundledPluginId` ถูกทำให้เป็นตัวพิมพ์เล็ก และเป็นคีย์ upsert ที่เสถียร
- `packageName` ถูกทำให้เป็นรูปแบบชื่อ npm มาตรฐาน; แพ็กเกจอาจไม่มีได้สำหรับการย้ายที่วางแผนไว้
- สิ่งนี้ติดตามเฉพาะ readiness ของการย้ายเท่านั้น ไม่ได้เปลี่ยนแปลง OpenClaw หรือสร้าง
  ClawPacks

### `GET /api/v1/packages/moderation/queue`

เอนด์พอยต์ผู้ตรวจสอบ/ผู้ดูแลสำหรับคิวตรวจสอบรีลีสแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ผู้ตรวจสอบหรือผู้ดูแล

พารามิเตอร์คำค้น:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `blocked`, `manual` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

ความหมายของสถานะ:

- `open`: รีลีสที่น่าสงสัย เป็นอันตราย รอดำเนินการ ถูกกักกัน ถูกเพิกถอน หรือถูกรายงาน
- `blocked`: รีลีสที่ถูกกักกัน ถูกเพิกถอน หรือเป็นอันตราย
- `manual`: รีลีสใดก็ตามที่มีการแทนที่การตรวจสอบแบบ manual
- `all`: รีลีสใดก็ตามที่มีการแทนที่แบบ manual, สถานะการสแกนที่ไม่สะอาด หรือรายงานแพ็กเกจ

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

รายงานแพ็กเกจเพื่อให้ผู้ตรวจสอบตรวจทาน รายงานอยู่ในระดับแพ็กเกจ และอาจ
ลิงก์กับเวอร์ชันได้ รายงานเหล่านี้ป้อนเข้าสู่คิวตรวจสอบ แต่ไม่ได้ซ่อนอัตโนมัติหรือ
บล็อกการดาวน์โหลดด้วยตัวเอง; ผู้ตรวจสอบควรใช้การตรวจสอบรีลีสเพื่อ
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

ปลายทางสำหรับ moderator/admin เพื่อรับรายงานแพ็กเกจ

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

ปลายทางสำหรับ owner/moderator เพื่อดูสถานะการกลั่นกรองแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้ API token สำหรับเจ้าของแพ็กเกจ สมาชิกผู้เผยแพร่, moderator หรือ
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

ปลายทางสำหรับ moderator/admin เพื่อปิดเคสหรือเปิดรายงานแพ็กเกจอีกครั้ง

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
`finalAction: "revoke"` พร้อมรายงานที่ได้รับการยืนยันเพื่อใช้การกลั่นกรอง release ใน
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

ปลายทางสำหรับ moderator/admin เพื่อตรวจสอบ release ของแพ็กเกจ

คำขอ:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

สถานะที่รองรับ:

- `approved`: ตรวจสอบด้วยตนเองแล้วและอนุญาต
- `quarantined`: ถูกบล็อกระหว่างรอการติดตามผล
- `revoked`: ถูกบล็อกหลังจาก release เคยได้รับความเชื่อถือแล้ว

release ที่ถูกกักกันและถูกเพิกถอนจะส่งคืน `403` จากเส้นทางดาวน์โหลด artifact
ทุกการเปลี่ยนแปลงจะเขียนรายการ audit log

### `GET /api/v1/packages/{name}/file`

ส่งคืนเนื้อหาข้อความดิบสำหรับไฟล์แพ็กเกจ

พารามิเตอร์ Query:

- `path` (บังคับ)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือ release ล่าสุด
- ใช้ read rate bucket ไม่ใช่ download bucket
- ไฟล์ไบนารีส่งคืน `415`
- ขีดจำกัดขนาดไฟล์: 200KB
- การสแกน VirusTotal ที่ยังค้างอยู่จะไม่บล็อกการอ่าน; release ที่เป็นอันตรายอาจยังถูกระงับไว้ที่อื่น
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่ที่เป็นเจ้าของได้

### `GET /api/v1/packages/{name}/download`

ดาวน์โหลด ZIP archive แบบ deterministic เดิมสำหรับ release ของแพ็กเกจ

พารามิเตอร์ Query:

- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือ release ล่าสุด
- Skills เปลี่ยนเส้นทางไปยัง `GET /api/v1/download`
- archive ของ Plugin/แพ็กเกจเป็นไฟล์ zip ที่มี root `package/` เพื่อให้ client OpenClaw
  รุ่นเก่ายังคงทำงานได้
- เส้นทางนี้คงไว้เฉพาะ ZIP เท่านั้น ไม่ stream ไฟล์ ClawPack `.tgz`
- การตอบกลับมี header `ETag`, `Digest`, `X-ClawHub-Artifact-Type` และ
  `X-ClawHub-Artifact-Sha256` สำหรับการตรวจสอบความถูกต้องของ resolver
- metadata ที่มีเฉพาะใน registry จะไม่ถูกแทรกเข้าไปใน archive ที่ดาวน์โหลด
- การสแกน VirusTotal ที่ยังค้างอยู่จะไม่บล็อกการดาวน์โหลด; release ที่เป็นอันตรายส่งคืน `403`
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะเป็นเจ้าของ

### `GET /api/npm/{package}`

ส่งคืน packument ที่เข้ากันได้กับ npm สำหรับเวอร์ชันแพ็กเกจที่ใช้ ClawPack เป็นฐาน

หมายเหตุ:

- แสดงเฉพาะเวอร์ชันที่อัปโหลด ClawPack npm-pack tarball แล้ว
- เวอร์ชันเดิมที่มีเฉพาะ ZIP จะถูกละไว้โดยตั้งใจ
- `dist.tarball`, `dist.integrity` และ `dist.shasum` ใช้ฟิลด์ที่เข้ากันได้กับ npm
  เพื่อให้ผู้ใช้ชี้ npm ไปยัง mirror ได้หากเลือกใช้
- packument ของแพ็กเกจแบบ scoped รองรับทั้ง `/api/npm/@scope/name` และ path คำขอ
  `/api/npm/@scope%2Fname` ที่เข้ารหัสแบบ npm

### `GET /api/npm/{package}/-/{tarball}.tgz`

stream byte ของ ClawPack tarball ที่อัปโหลดไว้ตรงตามต้นฉบับสำหรับ client mirror ของ npm

หมายเหตุ:

- ใช้ download rate bucket
- header การดาวน์โหลดมี ClawHub SHA-256 รวมถึง metadata integrity/shasum ของ npm
- การตรวจสอบการกลั่นกรองและการเข้าถึงแพ็กเกจส่วนตัวยังคงมีผล

### `GET /api/v1/resolve`

ใช้โดย CLI เพื่อจับคู่ fingerprint ภายในเครื่องกับเวอร์ชันที่รู้จัก

พารามิเตอร์ Query:

- `slug` (บังคับ)
- `hash` (บังคับ): sha256 แบบ hex ความยาว 64 อักขระของ fingerprint ของ bundle

การตอบกลับ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ดาวน์โหลด ZIP ของเวอร์ชัน Skill ที่โฮสต์ไว้ หรือส่งคืน handoff ของซอร์ส GitHub สำหรับ
Skill ปัจจุบันที่ใช้ GitHub เป็นฐาน ซึ่งมีผลสแกน `clean` หรือ `suspicious` และไม่มีเวอร์ชันที่โฮสต์ไว้

พารามิเตอร์ Query:

- `slug` (บังคับ)
- `version` (ไม่บังคับ): สตริง semver
- `tag` (ไม่บังคับ): ชื่อ tag (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- เวอร์ชันที่ถูก soft-delete ส่งคืน `410`
- handoff ของ Skill ที่ใช้ GitHub เป็นฐานจะไม่ proxy หรือ mirror byte การตอบกลับ JSON
  มี `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  และ `archiveUrl`; สถานะ scan/current เป็น gate และไม่รวมอยู่เป็น metadata payload
  ของความสำเร็จ
- สถิติการดาวน์โหลดนับเป็น identity ที่ไม่ซ้ำต่อวัน UTC (`userId` เมื่อ API token ถูกต้อง มิฉะนั้นใช้ IP)

## ปลายทางการยืนยันตัวตน (Bearer token)

ทุกปลายทางต้องมี:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

ตรวจสอบ token และส่งคืน handle ของผู้ใช้

### `POST /api/v1/skills`

เผยแพร่เวอร์ชันใหม่

- แนะนำ: `multipart/form-data` พร้อม JSON `payload` + blob `files[]`
- รองรับ JSON body ที่มี `files` (อิง `storageId`) ด้วย
- ฟิลด์ payload ที่ไม่บังคับ: `ownerHandle` เมื่อระบุ API จะ resolve
  ผู้เผยแพร่นั้นทางฝั่ง server และกำหนดให้ actor ต้องมีสิทธิ์เข้าถึงผู้เผยแพร่
- ฟิลด์ payload ที่ไม่บังคับ: `migrateOwner` เมื่อเป็น `true` พร้อม `ownerHandle`
  Skill ที่มีอยู่สามารถย้ายไปยังเจ้าของนั้นได้หาก actor เป็น admin/owner ในทั้ง
  ผู้เผยแพร่ปัจจุบันและเป้าหมาย หากไม่มี opt-in นี้ การเปลี่ยนเจ้าของจะ
  ถูกปฏิเสธ

### `POST /api/v1/packages`

เผยแพร่ release ของ code-plugin หรือ bundle-plugin

- ต้องใช้การยืนยันตัวตนด้วย Bearer token
- ต้องใช้ `multipart/form-data`
- ฟิลด์ฟอร์มที่อนุญาตคือ `payload`, blob `files` ซ้ำหลายรายการ หรือ reference tarball `clawpack`
  หนึ่งรายการ `clawpack` อาจเป็น blob `.tgz` หรือ storage id ที่ส่งคืนโดย
  flow upload-url การเผยแพร่ด้วย storage-id ที่จัดเตรียมไว้ต้องรวม
  `clawpackUploadTicket` ที่ส่งคืนมากับ URL อัปโหลดนั้นด้วย
- ใช้ `files` หรือ `clawpack` อย่างใดอย่างหนึ่งเท่านั้น ห้ามใช้ทั้งคู่ในคำขอเดียวกัน
- JSON body และ metadata `payload.files` / `payload.artifact` ที่ผู้เรียกส่งมา
  จะถูกปฏิเสธ
- คำขอเผยแพร่ multipart โดยตรงถูกจำกัดไว้ที่ 18MB ClawPack tarball อาจ
  ใช้ flow upload-url ได้ถึงขีดจำกัด tarball 120MB
- ฟิลด์ payload ที่ไม่บังคับ: `ownerHandle` เมื่อระบุ เฉพาะ admin เท่านั้นที่เผยแพร่ในนามของเจ้าของนั้นได้

ไฮไลต์การตรวจสอบความถูกต้อง:

- `family` ต้องเป็น `code-plugin` หรือ `bundle-plugin`
- แพ็กเกจ Plugin ต้องมี `openclaw.plugin.json` การอัปโหลด ClawPack `.tgz` ต้อง
  มีไฟล์นี้ที่ `package/openclaw.plugin.json`
- code plugin ต้องมี `package.json`, metadata repo ซอร์ส, metadata commit ซอร์ส,
  metadata schema config, `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion`
- `openclaw.hostTargets` และ `openclaw.environment` เป็น metadata ที่ไม่บังคับ
- เฉพาะผู้เผยแพร่ org `openclaw` และผู้เผยแพร่ส่วนตัวของสมาชิก org `openclaw`
  ปัจจุบันเท่านั้นที่เผยแพร่ไปยัง channel `official` ได้
- การเผยแพร่ในนามผู้อื่นยังคงตรวจสอบสิทธิ์ channel official กับบัญชีเจ้าของเป้าหมาย

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

soft-delete / กู้คืน Skill (owner, moderator หรือ admin)

JSON body ที่ไม่บังคับ:

```json
{ "reason": "Held for moderation pending legal review." }
```

เมื่อระบุ `reason` จะถูกเก็บเป็นหมายเหตุการกลั่นกรองของ Skill และคัดลอกลงใน audit log
การ soft delete ที่เริ่มโดย owner จะสงวน slug ไว้ 30 วัน จากนั้น slug จะถูกอ้างสิทธิ์โดย
ผู้เผยแพร่รายอื่นได้ การตอบกลับการลบมี `slugReservedUntil` เมื่อมีวันหมดอายุนี้
การซ่อนโดย moderator/admin และการนำออกด้านความปลอดภัยจะไม่หมดอายุในลักษณะนี้

การตอบกลับการลบ:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

รหัสสถานะ:

- `200`: ตกลง
- `401`: ไม่ได้รับอนุญาต
- `403`: ถูกห้าม
- `404`: ไม่พบ Skill/ผู้ใช้
- `500`: ข้อผิดพลาดภายใน server

### `POST /api/v1/users/publisher`

เฉพาะ admin เท่านั้น ตรวจให้แน่ใจว่ามีผู้เผยแพร่ org สำหรับ handle หาก handle ยังชี้ไปที่
ผู้ใช้/ผู้เผยแพร่ส่วนตัวแบบ shared เดิม ปลายทางจะ migrate ให้เป็นผู้เผยแพร่ org ก่อน
สำหรับ org ที่สร้างใหม่ ให้ระบุ `memberHandle`; admin ที่ดำเนินการจะไม่ถูกเพิ่มเป็นสมาชิก
ค่าเริ่มต้นของ `memberRole` คือ `owner`

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- การตอบกลับ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

การสร้างผู้เผยแพร่ org แบบ self-serve ที่ยืนยันตัวตนแล้ว สร้างผู้เผยแพร่ org ใหม่และเพิ่ม
ผู้เรียกเป็น owner ปลายทางนี้จะไม่ migrate handle ของผู้ใช้/ส่วนตัวที่มีอยู่ และจะ
ไม่ทำเครื่องหมายผู้เผยแพร่ว่า trusted/official

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- การตอบกลับ: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- ส่งคืน `409` เมื่อ handle ถูกใช้แล้วโดยผู้เผยแพร่ ผู้ใช้ หรือผู้เผยแพร่ส่วนตัว

### `POST /api/v1/users/reserve`

เฉพาะ admin เท่านั้น สงวน root slug และชื่อแพ็กเกจสำหรับเจ้าของที่ถูกต้องโดยไม่เผยแพร่
release ชื่อแพ็กเกจจะกลายเป็นแพ็กเกจ placeholder ส่วนตัวที่ไม่มีแถว release เพื่อให้
เจ้าของรายเดิมสามารถเผยแพร่ release ของ code-plugin หรือ bundle-plugin จริงลงในชื่อนั้นภายหลังได้

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- การตอบกลับ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

เฉพาะ admin เท่านั้น กู้คืนผู้เผยแพร่ส่วนตัวสำหรับ principal GitHub OAuth ตัวแทนที่ยืนยันแล้ว
โดยไม่แก้ไขแถวบัญชี Convex Auth คำขอต้องระบุ id บัญชี provider GitHub
ที่เปลี่ยนไม่ได้ทั้งสองรายการ; handle ที่เปลี่ยนแปลงได้ใช้เป็น guard สำหรับ operator เท่านั้น

ปลายทางมีค่าเริ่มต้นเป็น dry-run การใช้การกู้คืนต้องตั้งค่า `dryRun: false` และ
`confirmIdentityVerified: true` หลังจากเจ้าหน้าที่ตรวจสอบความต่อเนื่องระหว่าง
GitHub principals ทั้งสองฝ่ายอย่างเป็นอิสระแล้ว การกู้คืนจะล้มเหลวแบบปิดเมื่อ personal
publisher ปัจจุบันของผู้ใช้ปลายทางมี skills, packages หรือ GitHub skill sources
การกู้คืนยังย้ายฟิลด์ `ownerUserId` แบบเดิมสำหรับ skills ของ publisher ที่กู้คืน,
skill slug aliases, packages, package inspector warnings และ derived search digest rows เพื่อให้
เส้นทาง direct-owner สอดคล้องกับ authority ของ publisher ใหม่ การจอง protected-handle
ที่ยังใช้งานอยู่สำหรับ handle ที่กู้คืนจะถูกมอบหมายใหม่ให้ผู้ใช้ทดแทนด้วย เพื่อไม่ให้การซิงโครไนซ์
โปรไฟล์ภายหลังคืนค่า authority ที่แข่งขันกันของผู้ใช้เดิมได้ แต่ละตารางหลักจำกัดไว้ที่
100 แถวต่อธุรกรรม apply; การกู้คืนที่ใหญ่กว่านี้ต้องใช้ owner migration ที่ทำต่อได้ก่อน
GitHub skill sources มีขอบเขตตาม publisher และรายงานว่า checked แทนที่จะถูกเขียนใหม่

- เนื้อหา: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- การตอบกลับ: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### ปลายทางจัดการ owner slug

- `POST /api/v1/skills/{slug}/rename`
  - เนื้อหา: `{ "newSlug": "new-canonical-slug" }`
  - การตอบกลับ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - เนื้อหา: `{ "targetSlug": "canonical-target-slug" }`
  - การตอบกลับ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

หมายเหตุ:

- ปลายทางทั้งสองต้องใช้ API token auth และทำงานได้เฉพาะสำหรับเจ้าของ skill เท่านั้น
- `rename` เก็บ slug ก่อนหน้าไว้เป็น redirect alias
- `merge` ซ่อนรายการต้นทางและเปลี่ยนเส้นทาง slug ต้นทางไปยังรายการเป้าหมาย

### ปลายทางโอน ownership

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

ยกเลิกแบนผู้ใช้และกู้คืน skills ที่มีสิทธิ์ (เฉพาะ admin)

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

## ปลายทาง CLI แบบเดิม (เลิกใช้แล้ว)

ยังรองรับสำหรับ CLI เวอร์ชันเก่า:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

ดู `DEPRECATIONS.md` สำหรับแผนการลบ

`POST /api/cli/upload-url` ส่งคืน `uploadUrl` และ `uploadTicket` การเผยแพร่ Package
ที่ stage ClawPack tarball ต้องส่ง storage id ที่ได้เป็น
`clawpack` และ ticket ที่ส่งคืนเป็น `clawpackUploadTicket`

## การค้นพบ registry (`/.well-known/clawhub.json`)

CLI สามารถค้นพบการตั้งค่า registry/auth จากไซต์ได้:

- `/.well-known/clawhub.json` (JSON, แนะนำ)
- `/.well-known/clawdhub.json` (เดิม)

สคีมา:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

หากคุณโฮสต์เอง ให้ให้บริการไฟล์นี้ (หรือตั้งค่า `CLAWHUB_REGISTRY` โดยตรง; แบบเดิมคือ `CLAWDHUB_REGISTRY`)
