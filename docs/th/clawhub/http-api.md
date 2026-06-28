---
read_when:
    - การเพิ่ม/เปลี่ยนแปลง endpoint
    - การดีบักคำขอ CLI ↔ รีจิสทรี
summary: เอกสารอ้างอิง HTTP API (สาธารณะ + เอนด์พอยต์ CLI + การยืนยันตัวตน).
x-i18n:
    generated_at: "2026-06-28T05:06:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

URL พื้นฐาน: `https://clawhub.ai` (ค่าเริ่มต้น)

พาธ v1 ทั้งหมดอยู่ภายใต้ `/api/v1/...`
`/api/...` และ `/api/cli/...` แบบเดิมยังคงอยู่เพื่อความเข้ากันได้ (ดู `DEPRECATIONS.md`)
OpenAPI: `/api/v1/openapi.json`

## การใช้แค็ตตาล็อกสาธารณะซ้ำ

ไดเรกทอรีของบุคคลที่สามอาจใช้เอนด์พอยต์อ่านแบบสาธารณะเพื่อแสดงรายการหรือค้นหา ClawHub skills ได้ โปรดแคชผลลัพธ์ เคารพ `429`/`Retry-After` ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ตามหลักที่ถูกต้อง (`https://clawhub.ai/<owner>/skills/<slug>`) และหลีกเลี่ยงการสื่อว่า ClawHub รับรองไซต์บุคคลที่สามนั้น อย่าพยายามมิเรอร์เนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกโดยการมอดูแลออกนอกพื้นผิว API สาธารณะ

ทางลัด slug บนเว็บจะ resolve ข้ามตระกูลรีจิสทรี แต่ไคลเอนต์ API ควรใช้
URL ตามหลักที่ถูกต้องซึ่งเอนด์พอยต์อ่านส่งกลับ แทนการสร้างลำดับความสำคัญ
ของ route ขึ้นใหม่เอง

## ขีดจำกัดอัตรา

โมเดลการบังคับใช้:

- คำขอแบบไม่ระบุตัวตน: บังคับใช้ต่อ IP
- คำขอที่ยืนยันตัวตนแล้ว (Bearer token ที่ถูกต้อง): บังคับใช้ต่อ bucket ของผู้ใช้
- หาก token หายไป/ไม่ถูกต้อง พฤติกรรมจะถอยกลับไปใช้การบังคับใช้ตาม IP
- เอนด์พอยต์เขียนที่ยืนยันตัวตนแล้วไม่ควรส่งคืนเพียง `Unauthorized` เมื่อ
  เซิร์ฟเวอร์รู้เหตุผล Token ที่หายไป, token ที่ไม่ถูกต้อง/ถูกเพิกถอน และ
  บัญชีที่ถูกลบ/ถูกแบน/ถูกปิดใช้งาน ควรได้ข้อความที่นำไปดำเนินการได้ เพื่อให้ไคลเอนต์
  CLI บอกผู้ใช้ได้ว่าอะไรบล็อกพวกเขาอยู่

- อ่าน: 3000/นาที ต่อ IP, 12000/นาที ต่อ key
- เขียน: 300/นาที ต่อ IP, 3000/นาที ต่อ key
- ดาวน์โหลด: 1200/นาที ต่อ IP, 6000/นาที ต่อ key (เอนด์พอยต์ดาวน์โหลด)

เฮดเดอร์:

- ความเข้ากันได้แบบเดิม: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- แบบมาตรฐาน: `RateLimit-Limit`, `RateLimit-Reset`
- เมื่อเป็น `429`: `X-RateLimit-Remaining: 0` และ `RateLimit-Remaining: 0`
- เมื่อเป็น `429`: `Retry-After`

ความหมายของเฮดเดอร์:

- `X-RateLimit-Reset`: เวลา Unix epoch แบบสัมบูรณ์เป็นวินาที
- `RateLimit-Reset`: จำนวนวินาทีจนกว่าจะรีเซ็ต (การหน่วงเวลา)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: งบประมาณที่เหลือแบบแน่นอนเมื่อมีอยู่
  คำขอสำเร็จแบบ sharded จะละเว้นเฮดเดอร์นี้แทนการส่งค่าทั่วโลกโดยประมาณกลับมา
- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่ (การหน่วงเวลา) เมื่อเป็น `429`

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
- ใช้ backoff แบบมี jitter เพื่อหลีกเลี่ยงการลองใหม่พร้อมกัน
- หากไม่มี `Retry-After` ให้ fallback ไปที่ `RateLimit-Reset` (หรือคำนวณจาก `X-RateLimit-Reset`)

แหล่งที่มาของ IP:

- ใช้เฮดเดอร์ IP ไคลเอนต์ที่เชื่อถือได้ รวมถึง `cf-connecting-ip` เฉพาะเมื่อ
  deployment เปิดใช้ trusted forwarded headers อย่างชัดเจน
- ClawHub ใช้ trusted forwarding headers เพื่อระบุ IP ของไคลเอนต์ที่ edge
- หากไม่มี IP ไคลเอนต์ที่เชื่อถือได้ คำขอแบบไม่ระบุตัวตนจะใช้ fallback buckets
  ที่กำหนดขอบเขตเฉพาะตามชนิดของขีดจำกัดอัตราเท่านั้น fallback buckets เหล่านี้ไม่รวม
  พาธ, slugs, ชื่อ package, เวอร์ชัน, query strings หรือพารามิเตอร์
  artifact อื่น ๆ ที่ผู้เรียกส่งมา

## Error responses

response ข้อผิดพลาด v1 สาธารณะเป็นข้อความธรรมดาพร้อม `content-type: text/plain; charset=utf-8`
ซึ่งรวมถึงความล้มเหลวในการตรวจสอบความถูกต้อง (`400`), ทรัพยากรสาธารณะที่หายไป (`404`), ความล้มเหลวด้าน auth และ
permission (`401`/`403`), ขีดจำกัดอัตรา (`429`) และการดาวน์โหลดที่ถูกบล็อก ไคลเอนต์
ควรอ่านเนื้อหา response เป็นสตริงที่มนุษย์อ่านได้ พารามิเตอร์ query ที่ไม่รู้จักจะถูก
ละเว้นเพื่อความเข้ากันได้ แต่พารามิเตอร์ query ที่รู้จักและมีค่าไม่ถูกต้องจะส่งคืน
`400`

## เอนด์พอยต์สาธารณะ (ไม่ต้อง auth)

### `GET /api/v1/search`

พารามิเตอร์ query:

- `q` (จำเป็น): สตริง query
- `limit` (ไม่บังคับ): integer
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

- ผลลัพธ์จะถูกส่งคืนตามลำดับความเกี่ยวข้อง (ความคล้ายกันของ embedding + การ boost token ของ slug/name ที่ตรงแบบ exact + popularity prior เล็กน้อย)
- ความเกี่ยวข้องมีน้ำหนักมากกว่าความนิยม การตรงกับ token ของ slug หรือ display-name แบบแม่นยำอาจจัดอันดับสูงกว่าการตรงแบบหลวมกว่า แม้จะมี engagement สูงกว่ามาก
- ข้อความ ASCII จะถูก tokenized ตามขอบเขตคำและเครื่องหมายวรรคตอน ตัวอย่างเช่น `personal-map` มี token `map` แบบ standalone ขณะที่ `amap-jsapi-skill` มี `amap`, `jsapi` และ `skill`; ดังนั้นการค้นหา `map` จึงให้ lexical match กับ `personal-map` ที่แรงกว่า `amap-jsapi-skill`
- ความนิยมถูกปรับสเกลแบบ log และมีเพดาน skills ที่มี engagement สูงอาจได้อันดับต่ำกว่าเมื่อข้อความ query ตรงกันน้อยกว่า
- สถานะการมอดูแลที่น่าสงสัยหรือซ่อนอยู่สามารถทำให้ skill ถูกนำออกจากการค้นหาสาธารณะได้ ขึ้นกับตัวกรองของผู้เรียกและสถานะการมอดูแลปัจจุบัน

คำแนะนำด้านการค้นพบสำหรับผู้เผยแพร่:

- ใส่คำที่ผู้ใช้จะค้นหาจริง ๆ ไว้ใน display name, summary และ tags ใช้ token slug แบบ standalone เฉพาะเมื่อเป็นตัวตนที่เสถียรซึ่งคุณต้องการเก็บไว้ด้วย
- อย่าเปลี่ยนชื่อ slug เพียงเพื่อไล่ตาม query เดียว เว้นแต่ slug ใหม่จะเป็นชื่อตามหลักที่ถูกต้องในระยะยาวที่ดีกว่า slug เก่าจะกลายเป็น redirect aliases แต่ URL ตามหลักที่ถูกต้อง, slug ที่แสดง และ digest การค้นหาในอนาคตจะใช้ slug ใหม่
- Rename aliases จะรักษาการ resolve สำหรับ URL เก่าและการติดตั้งเก่าที่ resolve ผ่านรีจิสทรี แต่การจัดอันดับการค้นหาจะอิงตาม metadata ของ skill ตามหลักที่ถูกต้องหลังจากการเปลี่ยนชื่อถูกทำดัชนีแล้ว สถิติที่มีอยู่จะยังอยู่กับ skill
- หาก skill ล่องหนโดยไม่คาดคิด ให้ตรวจสอบสถานะการมอดูแลก่อนด้วย `clawhub inspect @owner/slug` ขณะเข้าสู่ระบบ ก่อนเปลี่ยน metadata ที่เกี่ยวข้องกับการจัดอันดับ

### `GET /api/v1/skills`

พารามิเตอร์ query:

- `limit` (ไม่บังคับ): integer (1–200)
- `cursor` (ไม่บังคับ): cursor การแบ่งหน้าสำหรับการเรียงลำดับที่ไม่ใช่ `trending`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), aliases การติดตั้งแบบเดิม `installsCurrent`/`installs`/`installsAllTime` map ไปที่ `downloads`, `trending`
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias แบบเดิมสำหรับ `nonSuspiciousOnly`

ค่า `sort` ที่ไม่ถูกต้องจะส่งคืน `400`

หมายเหตุ:

- `recommended` ใช้สัญญาณ engagement และความใหม่
- `trending` จัดอันดับตามการติดตั้งในช่วง 7 วันที่ผ่านมา (อิง telemetry)
- `createdAt` เสถียรสำหรับการ crawl skill ใหม่; `updated` เปลี่ยนเมื่อ skills ที่มีอยู่ถูก publish ใหม่
- เมื่อ `nonSuspiciousOnly=true` การเรียงลำดับแบบใช้ cursor อาจส่งคืนรายการในหน้าน้อยกว่า `limit` เพราะ skills ที่น่าสงสัยจะถูกกรองหลังจากดึงหน้าแล้ว
- ใช้ `nextCursor` เพื่อแบ่งหน้าต่อเมื่อมีอยู่ หน้าสั้น ๆ ไม่ได้หมายความว่าเป็นจุดสิ้นสุดของผลลัพธ์โดยตัวมันเอง

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

- slug เก่าที่สร้างโดย flow การเปลี่ยนชื่อ/merge เจ้าของจะ resolve ไปยัง skill ตามหลักที่ถูกต้อง
- `metadata.os`: ข้อจำกัด OS ที่ประกาศใน frontmatter ของ skill (เช่น `["macos"]`, `["linux"]`) `null` หากไม่ได้ประกาศ
- `metadata.systems`: เป้าหมายระบบ Nix (เช่น `["aarch64-darwin", "x86_64-linux"]`) `null` หากไม่ได้ประกาศ
- `metadata` เป็น `null` หาก skill ไม่มี metadata แพลตฟอร์ม
- `moderation` จะถูกรวมไว้เฉพาะเมื่อ skill ถูก flag หรือเจ้าของกำลังดูอยู่

### `GET /api/v1/skills/{slug}/moderation`

ส่งคืนสถานะการมอดูแลแบบมีโครงสร้าง

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

- เจ้าของและผู้มอดูแลสามารถเข้าถึงรายละเอียดการมอดูแลสำหรับ skills ที่ซ่อนอยู่ได้
- ผู้เรียกสาธารณะจะได้ `200` เฉพาะสำหรับ skills ที่มองเห็นได้และถูก flag แล้ว
- Evidence จะถูก redact สำหรับผู้เรียกสาธารณะ และรวม raw snippets เฉพาะสำหรับเจ้าของ/ผู้มอดูแลเท่านั้น

### `POST /api/v1/skills/{slug}/report`

รายงาน skill เพื่อให้ผู้มอดูแลตรวจสอบ รายงานอยู่ในระดับ skill และอาจลิงก์
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

เอนด์พอยต์ผู้มอดูแล/admin สำหรับรับรายงาน skill

พารามิเตอร์ query:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `confirmed`, `dismissed` หรือ `all`
- `limit` (ไม่บังคับ): integer (1-200)
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

เอนด์พอยต์ผู้มอดูแล/admin สำหรับแก้ไขสถานะหรือเปิดรายงาน skill อีกครั้ง

Request:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

ต้องมี `note` สำหรับ `confirmed` และ `dismissed`; อาจละเว้นได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "hide"` พร้อมรายงานที่ triaged แล้ว
เพื่อซ่อน skill ใน workflow เดียวกันที่ตรวจสอบย้อนหลังได้

### `GET /api/v1/skills/{slug}/versions`

พารามิเตอร์ query:

- `limit` (ไม่บังคับ): integer
- `cursor` (ไม่บังคับ): cursor การแบ่งหน้า

### `GET /api/v1/skills/{slug}/versions/{version}`

ส่งคืน metadata ของเวอร์ชัน + รายการไฟล์

- `version.security` รวมสถานะการตรวจสอบการสแกนที่ normalized และรายละเอียด scanner
  (VirusTotal + LLM) เมื่อมี

### `GET /api/v1/skills/{slug}/scan`

ส่งคืนรายละเอียดการตรวจสอบการสแกนความปลอดภัยสำหรับเวอร์ชันของ skill

พารามิเตอร์ query:

- `version` (ไม่บังคับ): สตริงเวอร์ชันเฉพาะ
- `tag` (ไม่บังคับ): resolve เวอร์ชันที่ติด tag (ตัวอย่างเช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- รวมสถานะการตรวจสอบที่ทำให้เป็นมาตรฐานแล้ว พร้อมรายละเอียดเฉพาะของสแกนเนอร์
- `security.hasScanResult` เป็น `true` เฉพาะเมื่อสแกนเนอร์ให้คำตัดสินที่แน่ชัด (`clean`, `suspicious` หรือ `malicious`)
- `moderation` คือสแนปช็อตการกลั่นกรองระดับ Skill ปัจจุบันที่ได้มาจากเวอร์ชันล่าสุด
- เมื่อสืบค้นเวอร์ชันย้อนหลัง ให้ตรวจสอบ `moderation.matchesRequestedVersion` และ `moderation.sourceVersion` ก่อนถือว่า `moderation` และ `security` อยู่ในบริบทเวอร์ชันเดียวกัน

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
- การสแกนที่เผยแพร่แล้วต้องมีสิทธิ์จัดการของเจ้าของ/ผู้เผยแพร่ หรืออำนาจผู้กลั่นกรอง/ผู้ดูแลแพลตฟอร์ม
- การสแกนที่เผยแพร่แล้วจะเขียนกลับเฉพาะเมื่อ `update: true` และการสแกนเสร็จสมบูรณ์
- การตอบกลับคือ `202` พร้อม `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`
- งานสแกนเป็นแบบอะซิงโครนัส คำขอสแกนด้วยตนเองจะได้รับลำดับความสำคัญก่อนงานเผยแพร่/เติมข้อมูลย้อนหลังตามปกติ แต่การเสร็จสิ้นยังขึ้นอยู่กับความพร้อมของเวิร์กเกอร์

### `GET /api/v1/skills/-/scan/{scanId}`

ปลายทางโพลที่ต้องยืนยันตัวตนสำหรับการสแกนที่ส่งแล้ว

- ส่งคืนสถานะ queued/running/succeeded/failed
- ส่งคืน `queue.queuedAhead` และ `queue.position` ขณะอยู่ในคิว เพื่อให้ไคลเอนต์แสดงจำนวนการสแกนด้วยตนเองที่มีลำดับความสำคัญซึ่งอยู่ก่อนคำขอได้ คิวที่ใหญ่มากจะถูกจำกัดและรายงานด้วย `queuedAheadIsEstimate: true`
- เมื่อมีให้ใช้งาน `report` จะมีส่วน `clawscan`, `skillspector`, `staticAnalysis` และ `virustotal`
- งานสแกนที่ล้มเหลวจะส่งคืน `status: "failed"` พร้อม `lastError`

### `GET /api/v1/skills/-/scan/{scanId}/download`

ปลายทางไฟล์เก็บถาวรรายงานที่ต้องยืนยันตัวตน

- ต้องเป็นการสแกนที่สำเร็จแล้ว การสแกนที่ยังไม่สิ้นสุดจะส่งคืน `409`
- ส่งคืน ZIP ที่มี `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

ปลายทางไฟล์เก็บถาวรรายงานที่จัดเก็บไว้ซึ่งต้องยืนยันตัวตนสำหรับเวอร์ชันที่ส่งแล้ว

- ต้องมีสิทธิ์จัดการของเจ้าของ/ผู้เผยแพร่ต่อ Skill หรือ Plugin หรืออำนาจผู้กลั่นกรอง/ผู้ดูแลแพลตฟอร์ม
- ส่งคืนผลการสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งแบบตรงกันทุกประการ รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อน
- `kind` มีค่าเริ่มต้นเป็น `skill`; ใช้ `kind=plugin` สำหรับการสแกน Plugin/แพ็กเกจ
- ส่งคืนรูปแบบ ZIP เดียวกับการดาวน์โหลดคำขอสแกน

### `POST /api/v1/skills/-/scan/batch`

เส้นทางสแกนซ้ำแบบแบตช์มาตรฐานสำหรับผู้ดูแลเท่านั้น รับรูปแบบเพย์โหลดเดียวกับ `POST /api/v1/skills/-/rescan-batch` แบบเดิม

### `POST /api/v1/skills/-/scan/batch/status`

เส้นทางสถานะแบตช์มาตรฐานสำหรับผู้ดูแลเท่านั้น รับ `{ "jobIds": ["..."] }` และส่งคืนตัวนับรวมเดียวกับ `POST /api/v1/skills/-/rescan-batch/status` แบบเดิม

### `GET /api/v1/skills/{slug}/verify`

ส่งคืนซองการตรวจสอบ Skill Card ที่ใช้โดย `clawhub skill verify`

พารามิเตอร์คิวรี:

- `version` (ไม่บังคับ): สตริงเวอร์ชันที่เฉพาะเจาะจง
- `tag` (ไม่บังคับ): แปลงเป็นเวอร์ชันที่ติดแท็กไว้ (เช่น `latest`)

หมายเหตุ:

- `ok` เป็น `true` เฉพาะเมื่อเวอร์ชันที่เลือกมี Skill Card ที่สร้างแล้ว ไม่ถูกการกลั่นกรองบล็อกว่าเป็นมัลแวร์ และการตรวจสอบ ClawScan เป็นสถานะสะอาด
- ตัวตนของ Skill, ตัวตนของผู้เผยแพร่ และเมทาดาทาของเวอร์ชันที่เลือกเป็นฟิลด์ระดับบนสุดของซอง (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) เพื่อให้ระบบอัตโนมัติในเชลล์อ่านได้โดยไม่ต้องแกะตัวห่อซ้อนกัน
- `security` คือคำตัดสิน ClawScan/ความปลอดภัยระดับบนสุด ระบบอัตโนมัติควรอิงจาก `ok`, `decision`, `reasons` และ `security.status`
- `security.signals` มีหลักฐานสนับสนุนจากสแกนเนอร์ เช่น `staticScan`, `virusTotal` และ `skillSpector`
- `security.signals.dependencyRegistry` ถูกคงไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่สแกนเนอร์ตรวจสอบการมีอยู่ของรีจิสทรี dependency ถูกเลิกใช้แล้ว และคีย์นี้จะเป็น `null` เสมอ
- `provenance` เป็น `server-resolved-github-import` เฉพาะเมื่อ ClawHub แปลงและจัดเก็บ GitHub repo/ref/commit/path ระหว่างการเผยแพร่หรือนำเข้า มิฉะนั้นจะเป็น `unavailable`

### `POST /api/v1/skills/-/security-verdicts`

ส่งคืนคำตัดสินความปลอดภัยแบบย่อปัจจุบันสำหรับเวอร์ชัน Skill ที่ตรงกันทุกประการ ปลายทางคอลเลกชันนี้มีไว้สำหรับไคลเอนต์ที่รู้อยู่แล้วว่าต้องแสดงเวอร์ชัน Skill ของ ClawHub ที่ติดตั้งใด เช่น OpenClaw Control UI

คำขอ:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

หมายเหตุ:

- `items` ต้องมีคู่ `{ slug, version }` ที่ไม่ซ้ำกัน 1-100 รายการ
- ผลลัพธ์เป็นรายรายการ การขาด Skill หรือเวอร์ชันหนึ่งรายการจะไม่ทำให้การตอบกลับทั้งหมดล้มเหลว
- การตอบกลับเป็นข้อมูลความปลอดภัยเท่านั้น ไม่รวมข้อมูล Skill Card, สถานะการ์ดที่สร้างแล้ว, รายการไฟล์อาร์ติแฟกต์ หรือเพย์โหลดสแกนเนอร์แบบละเอียด
- `security.signals` มีเฉพาะหลักฐานสนับสนุนระดับสถานะเท่านั้น ใช้ `/scan` หรือหน้า security-audit ของ ClawHub สำหรับรายละเอียดสแกนเนอร์แบบเต็ม
- `security.signals.dependencyRegistry` ถูกคงไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่สแกนเนอร์ตรวจสอบการมีอยู่ของรีจิสทรี dependency ถูกเลิกใช้แล้ว และคีย์นี้จะเป็น `null` เสมอ
- การไม่มี Skill Card ไม่มีผลต่อ `ok`, `decision` หรือ `reasons` ของปลายทางนี้ ไคลเอนต์ควรอ่าน `skill-card.md` ที่ติดตั้งไว้ในเครื่องเมื่อต้องการเนื้อหาการ์ด
- ใช้ `/verify` เมื่อต้องการซองการตรวจสอบ Skill Card สำหรับ Skill เดียว, `/card` เมื่อต้องการมาร์กดาวน์ของการ์ดที่สร้างแล้ว และ `/scan` เมื่อต้องการข้อมูลสแกนเนอร์แบบละเอียด

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

เอนด์พอยต์แค็ตตาล็อกแบบรวมสำหรับ:

- Skills
- Plugin โค้ด
- Plugin บันเดิล

พารามิเตอร์คิวรี:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์สำหรับการแบ่งหน้า
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended`, `trending`, `downloads`, นามแฝงเดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอถูกจำกัดขอบเขตไปยังแพ็กเกจ Plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` หรือเอนด์พอยต์แพ็กเกจที่มี
  `family=code-plugin`/`family=bundle-plugin`) หมวดหมู่ที่ควบคุมไว้และ
  นามแฝงตัวกรอง v1 เดิมมีเอกสารอยู่ใน `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` หรือ `sort` จะส่งคืน `400` พารามิเตอร์คิวรีที่ไม่รู้จักจะถูกเพิกเฉย
- `GET /api/v1/code-plugins` และ `GET /api/v1/bundle-plugins` ยังคงเป็นนามแฝงแบบ family คงที่
- รายการ Skills ยังคงอิงจากรีจิสทรี Skills และยังเผยแพร่ได้ผ่าน `POST /api/v1/skills` เท่านั้น
- `POST /api/v1/packages` ยังคงใช้สำหรับรีลีส code-plugin และ bundle-plugin เท่านั้น
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถเห็นแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดอยู่ในผลลัพธ์รายการ/การค้นหา
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกซึ่งผ่านการยืนยันตัวตนอ่านได้

### `GET /api/v1/packages/search`

การค้นหาแค็ตตาล็อกแบบรวมครอบคลุม Skills + แพ็กเกจ Plugin

พารามิเตอร์คิวรี:

- `q` (จำเป็น): สตริงคำค้นหา
- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอถูกจำกัดขอบเขตไปยังแพ็กเกจ Plugin หมวดหมู่ที่ควบคุมไว้และ
  นามแฝงตัวกรอง v1 เดิมมีเอกสารอยู่ใน `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured` หรือ
  `highlightedOnly` จะส่งคืน `400` พารามิเตอร์คิวรีที่ไม่รู้จักจะถูกเพิกเฉย
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถค้นหาแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดอยู่
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกซึ่งผ่านการยืนยันตัวตนอ่านได้

### `GET /api/v1/plugins`

เรียกดูแค็ตตาล็อกเฉพาะ Plugin ครอบคลุมแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์คิวรี:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์สำหรับการแบ่งหน้า
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `recommended` (ค่าเริ่มต้น), `trending`, `downloads`, `updated`, นามแฝงเดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

ยังคงยอมรับนามแฝงตัวกรอง v1 เดิมในเอนด์พอยต์สำหรับอ่าน:

- `mcp-tooling`, `data` และ `automation` จะแปลงเป็น `tools`
- `observability` และ `deployment` จะแปลงเป็น `gateway`
- `dev-tools` จะแปลงเป็น `runtime`

`trending` เป็นกระดานจัดอันดับการติดตั้ง/ดาวน์โหลดในช่วงเจ็ดวัน และไม่ใช้ยอดรวมตลอดกาล
ในเอนด์พอยต์แบบรวม `/api/v1/packages` จะใช้เฉพาะ Plugin เท่านั้น; ใช้
`/api/v1/skills?sort=trending` สำหรับแค็ตตาล็อก Skills

นามแฝงเดิมจะไม่ถูกยอมรับเป็นค่าหมวดหมู่ที่จัดเก็บไว้หรือที่ผู้เขียนประกาศ

### `GET /api/v1/skills/export`

ส่งออก Skills สาธารณะล่าสุดแบบเป็นชุดสำหรับการวิเคราะห์แบบออฟไลน์

การยืนยันตัวตน:

- จำเป็นต้องใช้โทเค็น API

พารามิเตอร์คิวรี:

- `startDate` (จำเป็น): ขอบเขตล่างแบบ Unix มิลลิวินาทีสำหรับ `updatedAt` ของ Skills
- `endDate` (จำเป็น): ขอบเขตบนแบบ Unix มิลลิวินาทีสำหรับ `updatedAt` ของ Skills
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์สำหรับการแบ่งหน้าจากการตอบกลับก่อนหน้า

การตอบกลับ:

- เนื้อหา: ไฟล์เก็บถาวร ZIP
- Skills ที่ส่งออกแต่ละรายการมีรากอยู่ที่ `{publisher}/{slug}/`
- Skills แบบโฮสต์จะรวมไฟล์เวอร์ชันที่จัดเก็บล่าสุด และแสดงรายการใน
  `_manifest.json` พร้อม `sourceRef: "public-clawhub"`
- Skills ปัจจุบันที่อิง GitHub ซึ่งมีการสแกน `clean` หรือ `suspicious` จะรวม
  `_source_handoff.json` พร้อม `sourceRef: "public-github"`, repo, commit, path,
  แฮชเนื้อหา และ URL ไฟล์เก็บถาวร โดยจะไม่รวมไฟล์ซอร์สที่โฮสต์บน ClawHub
- Skills แต่ละรายการจะรวม `_export_skill_meta.json`
- `_manifest.json` จะถูกรวมไว้ที่รากของ ZIP เสมอ
- `_errors.json` จะถูกรวมไว้เมื่อไม่สามารถส่งออก Skills หรือไฟล์บางรายการได้

ส่วนหัว:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

ส่งออกชุดรวมของรีลีส Plugin สาธารณะล่าสุดสำหรับการวิเคราะห์แบบออฟไลน์

การยืนยันตัวตน:

- ต้องใช้โทเค็น API

พารามิเตอร์คิวรี:

- `startDate` (จำเป็น): ขอบเขตล่างเป็นมิลลิวินาทีแบบ Unix สำหรับ `updatedAt` ของ Plugin
- `endDate` (จำเป็น): ขอบเขตบนเป็นมิลลิวินาทีแบบ Unix สำหรับ `updatedAt` ของ Plugin
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าจากการตอบกลับก่อนหน้า
- `family` (ไม่บังคับ): `code-plugin` หรือ `bundle-plugin` หากละไว้หมายถึงทั้งสอง
  ตระกูล Plugin

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

การค้นหาเฉพาะ Plugin ในแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์คิวรี:

- `q` (จำเป็น): สตริงคิวรี
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

หมายเหตุ:

- นามแฝงตัวกรอง v1 เดิมที่บันทึกไว้ภายใต้ `GET /api/v1/plugins` ก็ยัง
  รองรับด้วย
- การกรองหมวดหมู่เป็นตัวกรอง API จริงที่อ้างอิงจากแถวสรุปหมวดหมู่ Plugin
  ไม่ใช่การเขียนคิวรีค้นหาใหม่
- ผลลัพธ์จะถูกส่งคืนตามลำดับความเกี่ยวข้อง และปัจจุบันยังไม่มีการแบ่งหน้า
- ตัวควบคุมการเรียงลำดับใน UI เบราว์เซอร์สำหรับการค้นหา Plugin จะเรียงผลลัพธ์ความเกี่ยวข้องที่โหลดแล้วใหม่
  ให้ตรงกับพฤติกรรมการเรียกดู `/skills` ปัจจุบัน

### `GET /api/v1/packages/{name}`

ส่งคืนเมทาดาทารายละเอียดแพ็กเกจ

หมายเหตุ:

- Skills ยังสามารถ resolve ผ่านเส้นทางนี้ในแค็ตตาล็อกแบบรวมได้ด้วย
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะอ่าน publisher เจ้าของได้

### `DELETE /api/v1/packages/{name}`

ลบแพ็กเกจและรีลีสทั้งหมดแบบ soft delete

หมายเหตุ:

- ต้องใช้โทเค็น API สำหรับเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแล publisher ขององค์กร,
  ผู้ดูแลแพลตฟอร์ม หรือผู้ดูแลระบบแพลตฟอร์ม

### `GET /api/v1/packages/{name}/versions`

ส่งคืนประวัติเวอร์ชัน

พารามิเตอร์คิวรี:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

หมายเหตุ:

- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะอ่าน publisher เจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}`

ส่งคืนแพ็กเกจหนึ่งเวอร์ชัน รวมถึงเมทาดาทาไฟล์ ความเข้ากันได้
การตรวจสอบยืนยัน เมทาดาทาอาร์ติแฟกต์ และข้อมูลการสแกน

หมายเหตุ:

- `version.artifact.kind` เป็น `legacy-zip` สำหรับไฟล์เก็บถาวรแพ็กเกจแบบเก่า หรือ
  `npm-pack` สำหรับรีลีสที่อ้างอิง ClawPack
- รีลีส ClawPack มีฟิลด์ที่เข้ากันได้กับ npm ได้แก่ `npmIntegrity`, `npmShasum` และ
  `npmTarballName`
- `version.sha256hash` เป็นเมทาดาทาความเข้ากันได้ที่เลิกใช้แล้วสำหรับไคลเอนต์เก่า โดย
  แฮชไบต์ ZIP ตรงตามที่ส่งคืนโดย `/api/v1/packages/{name}/download`
  ไคลเอนต์สมัยใหม่ควรใช้ `version.artifact.sha256` ซึ่งระบุ
  อาร์ติแฟกต์รีลีสตามแบบ canonical
- `version.vtAnalysis`, `version.llmAnalysis` และ `version.staticScan` จะ
  ถูกรวมไว้เมื่อมีข้อมูลการสแกน
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะอ่าน publisher เจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}/security`

ส่งคืนสรุปความปลอดภัยและความน่าเชื่อถือของรีลีสแพ็กเกจที่แน่นอนสำหรับไคลเอนต์ติดตั้ง
นี่คือพื้นผิวการใช้งานสาธารณะของ OpenClaw สำหรับตัดสินใจว่า
รีลีสที่ resolve แล้วสามารถติดตั้งได้หรือไม่

การยืนยันตัวตน:

- ปลายทางอ่านสาธารณะ ไม่จำเป็นต้องมีโทเค็นของเจ้าของ, publisher, ผู้ดูแล หรือผู้ดูแลระบบ

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
  `release.npmShasum` และ `release.npmTarballName` จะมีอยู่เมื่อทราบสำหรับ
  อาร์ติแฟกต์รีลีส
- `trust.scanStatus` คือสถานะความน่าเชื่อถือที่มีผล ซึ่งมาจากอินพุตของสแกนเนอร์
  และการกำกับดูแลรีลีสแบบ manual
- `trust.moderationState` เป็น nullable โดยจะเป็น `null` เมื่อไม่มีการกำกับดูแลรีลีสแบบ manual
- `trust.blockedFromDownload` คือสัญญาณบล็อกการติดตั้ง OpenClaw และ
  ไคลเอนต์ติดตั้งอื่นๆ ควรบล็อกการติดตั้งเมื่อค่านี้เป็น `true` แทนที่จะ
  คำนวณกฎการบล็อกใหม่จากฟิลด์สแกนเนอร์หรือการกำกับดูแล
- `trust.reasons` คือรายการคำอธิบายสำหรับผู้ใช้และการตรวจสอบย้อนหลัง รหัสเหตุผล
  เป็นสตริงที่เสถียรและกระชับ เช่น `manual:quarantined`, `scan:malicious`,
  และ `package:malicious`
- `trust.pending` หมายถึงอินพุตความน่าเชื่อถือหนึ่งรายการขึ้นไปยังรอให้เสร็จสมบูรณ์
- `trust.stale` หมายถึงสรุปความน่าเชื่อถือถูกคำนวณจากอินพุตที่ล้าสมัย และ
  ควรถูกถือว่าต้อง refresh ก่อนการตัดสินใจอนุญาตที่มีความมั่นใจสูง

หมายเหตุ:

- ปลายทางนี้ระบุเวอร์ชันอย่างแน่นอน ไคลเอนต์ควรเรียกใช้หลังจาก resolve
  เวอร์ชันแพ็กเกจที่ตั้งใจจะติดตั้ง ไม่ใช่เพียงหลังจากอ่านเมทาดาทาแพ็กเกจล่าสุด
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะอ่าน publisher เจ้าของได้
- ปลายทางนี้ตั้งใจให้แคบกว่าปลายทางการกำกับดูแลของเจ้าของ/ผู้ดูแล
  โดยเปิดเผยการตัดสินใจติดตั้งและคำอธิบายสาธารณะ ไม่ใช่
  ตัวตนผู้รายงาน เนื้อหารายงาน หลักฐานส่วนตัว หรือไทม์ไลน์การตรวจสอบภายใน

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

ส่งคืนเมทาดาทาตัว resolve อาร์ติแฟกต์แบบชัดเจนสำหรับเวอร์ชันแพ็กเกจ

หมายเหตุ:

- เวอร์ชันแพ็กเกจ legacy ส่งคืนอาร์ติแฟกต์ `legacy-zip` และ
  `downloadUrl` ของ ZIP legacy
- เวอร์ชัน ClawPack ส่งคืนอาร์ติแฟกต์ `npm-pack`, ฟิลด์ npm integrity,
  `tarballUrl` และ URL ความเข้ากันได้กับ ZIP legacy
- นี่คือพื้นผิวตัว resolve ของ OpenClaw; ช่วยหลีกเลี่ยงการเดารูปแบบไฟล์เก็บถาวรจาก
  URL ที่ใช้ร่วมกัน

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ดาวน์โหลดอาร์ติแฟกต์เวอร์ชันผ่านเส้นทางตัว resolve แบบชัดเจน

หมายเหตุ:

- เวอร์ชัน ClawPack สตรีมไบต์ `.tgz` ของ npm-pack ที่อัปโหลดแบบตรงทุกไบต์
- เวอร์ชัน ZIP legacy เปลี่ยนเส้นทางไปที่ `/api/v1/packages/{name}/download?version=`
- ใช้บักเก็ตอัตราการดาวน์โหลด

### `GET /api/v1/packages/{name}/readiness`

ส่งคืนความพร้อมที่คำนวณแล้วสำหรับการใช้งาน OpenClaw ในอนาคต

การตรวจสอบความพร้อมครอบคลุม:

- สถานะช่องทางทางการ
- ความพร้อมใช้งานของเวอร์ชันล่าสุด
- ความพร้อมใช้งานของอาร์ติแฟกต์ ClawPack npm-pack
- ไดเจสต์อาร์ติแฟกต์
- ที่มาของรีโปต้นทางและคอมมิต
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

ปลายทางผู้ดูแลสำหรับแสดงรายการแถวการย้าย Plugin อย่างเป็นทางการของ OpenClaw

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

ปลายทางผู้ดูแลระบบสำหรับสร้างหรืออัปเดตแถวการย้าย Plugin อย่างเป็นทางการ

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

- `bundledPluginId` ถูก normalize เป็นตัวพิมพ์เล็กและเป็นคีย์ upsert ที่เสถียร
- `packageName` ถูก normalize ตามชื่อ npm; แพ็กเกจอาจยังไม่มีสำหรับการย้ายที่วางแผนไว้
- สิ่งนี้ติดตามเฉพาะความพร้อมในการย้ายเท่านั้น ไม่ได้เปลี่ยนแปลง OpenClaw หรือสร้าง
  ClawPacks

### `GET /api/v1/packages/moderation/queue`

ปลายทางผู้ดูแล/ผู้ดูแลระบบสำหรับคิวตรวจสอบรีลีสแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คิวรี:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `blocked`, `manual` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

ความหมายของสถานะ:

- `open`: รีลีสที่น่าสงสัย เป็นอันตราย รอดำเนินการ ถูกกักกัน ถูกเพิกถอน หรือถูกรายงาน
- `blocked`: รีลีสที่ถูกกักกัน ถูกเพิกถอน หรือเป็นอันตราย
- `manual`: รีลีสใดๆ ที่มีการแทนที่การกำกับดูแลแบบ manual
- `all`: รีลีสใดๆ ที่มีการแทนที่แบบ manual, สถานะการสแกนที่ไม่สะอาด หรือรายงานแพ็กเกจ

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

รายงานแพ็กเกจเพื่อให้ผู้ดูแลตรวจสอบ รายงานอยู่ในระดับแพ็กเกจ และสามารถ
เชื่อมโยงกับเวอร์ชันได้ รายงานเหล่านี้ป้อนเข้าสู่คิวการกำกับดูแลแต่จะไม่ซ่อนอัตโนมัติหรือ
บล็อกการดาวน์โหลดด้วยตัวเอง ผู้ดูแลควรใช้การกำกับดูแลรีลีสเพื่อ
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

การตรวจสอบสิทธิ์:

- ต้องใช้ API token สำหรับผู้ใช้ moderator หรือ admin

พารามิเตอร์ Query:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `confirmed`, `dismissed` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): cursor สำหรับ pagination

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

ปลายทางสำหรับ owner/moderator เพื่อดูสถานะการ moderation ของแพ็กเกจ

การตรวจสอบสิทธิ์:

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

ปลายทางสำหรับ moderator/admin เพื่อแก้ไขหรือเปิดรายงานแพ็กเกจอีกครั้ง

คำขอ:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

ต้องระบุ `note` สำหรับ `confirmed` และ `dismissed`; อาจละไว้ได้เมื่อตั้งค่า
`status` กลับเป็น `open` ส่ง `finalAction: "quarantine"` หรือ
`finalAction: "revoke"` พร้อมรายงานที่ยืนยันแล้วเพื่อใช้ release moderation ใน
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

ปลายทางสำหรับ moderator/admin เพื่อ review release ของแพ็กเกจ

คำขอ:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

สถานะที่รองรับ:

- `approved`: review ด้วยตนเองแล้วและอนุญาต
- `quarantined`: ถูกบล็อกระหว่างรอการติดตามผล
- `revoked`: ถูกบล็อกหลังจาก release เคยได้รับความเชื่อถือมาก่อน

release ที่ถูกกักกันและถูกเพิกถอนจะส่งคืน `403` จาก route ดาวน์โหลด artifact
การเปลี่ยนแปลงทุกครั้งจะเขียนรายการ audit log

### `GET /api/v1/packages/{name}/file`

ส่งคืนเนื้อหาข้อความดิบสำหรับไฟล์แพ็กเกจ

พารามิเตอร์ Query:

- `path` (บังคับ)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ใช้ค่าเริ่มต้นเป็น release ล่าสุด
- ใช้ bucket อัตราการอ่าน ไม่ใช่ bucket การดาวน์โหลด
- ไฟล์ไบนารีส่งคืน `415`
- ขีดจำกัดขนาดไฟล์: 200KB
- การสแกน VirusTotal ที่รอดำเนินการไม่บล็อกการอ่าน; release ที่เป็นอันตรายอาจยังถูกระงับไว้ที่อื่น
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ caller จะอ่าน publisher เจ้าของได้

### `GET /api/v1/packages/{name}/download`

ดาวน์โหลด archive ZIP deterministic แบบ legacy สำหรับ release ของแพ็กเกจ

พารามิเตอร์ Query:

- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ใช้ค่าเริ่มต้นเป็น release ล่าสุด
- Skills redirect ไปยัง `GET /api/v1/download`
- archive ของ Plugin/แพ็กเกจเป็นไฟล์ zip ที่มี root `package/` เพื่อให้ client OpenClaw
  รุ่นเก่ายังคงทำงานได้
- route นี้ยังคงเป็น ZIP เท่านั้น ไม่ stream ไฟล์ ClawPack `.tgz`
- การตอบกลับมี header `ETag`, `Digest`, `X-ClawHub-Artifact-Type` และ
  `X-ClawHub-Artifact-Sha256` สำหรับการตรวจสอบ integrity ของ resolver
- metadata ที่มีเฉพาะใน registry จะไม่ถูกฉีดเข้าไปใน archive ที่ดาวน์โหลด
- การสแกน VirusTotal ที่รอดำเนินการไม่บล็อกการดาวน์โหลด; release ที่เป็นอันตรายส่งคืน `403`
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ caller จะเป็นเจ้าของ

### `GET /api/npm/{package}`

ส่งคืน packument ที่เข้ากันได้กับ npm สำหรับเวอร์ชันแพ็กเกจที่รองรับด้วย ClawPack

หมายเหตุ:

- แสดงเฉพาะเวอร์ชันที่มีการอัปโหลด tarball npm-pack ของ ClawPack แล้ว
- เวอร์ชัน legacy ที่เป็น ZIP-only จะถูกละไว้โดยตั้งใจ
- `dist.tarball`, `dist.integrity` และ `dist.shasum` ใช้ field ที่เข้ากันได้กับ npm
  เพื่อให้ผู้ใช้ชี้ npm ไปยัง mirror ได้หากต้องการ
- packument ของแพ็กเกจแบบ scoped รองรับทั้ง `/api/npm/@scope/name` และ path คำขอ
  ที่ encode แบบ npm คือ `/api/npm/@scope%2Fname`

### `GET /api/npm/{package}/-/{tarball}.tgz`

stream byte ของ tarball ClawPack ที่อัปโหลดไว้แบบตรงทุก byte สำหรับ client npm mirror

หมายเหตุ:

- ใช้ bucket อัตราการดาวน์โหลด
- header การดาวน์โหลดมี ClawHub SHA-256 รวมถึง metadata integrity/shasum ของ npm
- การตรวจสอบ access ของ moderation และแพ็กเกจส่วนตัวยังคงมีผล

### `GET /api/v1/resolve`

ใช้โดย CLI เพื่อ map fingerprint ภายในเครื่องไปยังเวอร์ชันที่รู้จัก

พารามิเตอร์ Query:

- `slug` (บังคับ)
- `hash` (บังคับ): sha256 hex 64 อักขระของ bundle fingerprint

การตอบกลับ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ดาวน์โหลด ZIP ของเวอร์ชัน Skill ที่ host ไว้ หรือส่งคืน GitHub source handoff สำหรับ
Skill ปัจจุบันที่รองรับด้วย GitHub ซึ่งมีการสแกนเป็น `clean` หรือ `suspicious` และไม่มี
เวอร์ชันที่ host ไว้

พารามิเตอร์ Query:

- `slug` (บังคับ)
- `version` (ไม่บังคับ): string semver
- `tag` (ไม่บังคับ): ชื่อ tag (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- เวอร์ชันที่ถูก soft-delete ส่งคืน `410`
- handoff ของ Skill ที่รองรับด้วย GitHub จะไม่ proxy หรือ mirror byte การตอบกลับ JSON
  มี `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  และ `archiveUrl`; สถานะ scan/current เป็น gate และไม่รวมเป็น metadata payload
  ของความสำเร็จ
- สถิติการดาวน์โหลดนับเป็น identity ที่ไม่ซ้ำต่อวัน UTC (`userId` เมื่อ API token ใช้งานได้ มิฉะนั้นใช้ IP)

## ปลายทางการตรวจสอบสิทธิ์ (Bearer token)

ปลายทางทั้งหมดต้องใช้:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

ตรวจสอบ token และส่งคืน handle ของผู้ใช้

### `POST /api/v1/skills`

เผยแพร่เวอร์ชันใหม่

- แนะนำ: `multipart/form-data` พร้อม `payload` JSON + blob `files[]`
- รองรับ body JSON ที่มี `files` (อิงตาม storageId) เช่นกัน
- field payload ไม่บังคับ: `ownerHandle` เมื่อมีค่า API จะ resolve publisher นั้น
  ฝั่ง server และต้องการให้ actor มีสิทธิ์เข้าถึง publisher
- field payload ไม่บังคับ: `migrateOwner` เมื่อเป็น `true` พร้อม `ownerHandle`
  Skill ที่มีอยู่สามารถย้ายไปยัง owner นั้นได้ หาก actor เป็น admin/owner ของทั้ง
  publisher ปัจจุบันและเป้าหมาย หากไม่มีการ opt-in นี้ การเปลี่ยน owner จะถูกปฏิเสธ

### `POST /api/v1/packages`

เผยแพร่ release แบบ code-plugin หรือ bundle-plugin

- ต้องใช้การตรวจสอบสิทธิ์ด้วย Bearer token
- ต้องใช้ `multipart/form-data`
- field ของ form ที่อนุญาตคือ `payload`, blob `files` ซ้ำหลายรายการ หรือ reference tarball
  `clawpack` หนึ่งรายการ `clawpack` อาจเป็น blob `.tgz` หรือ storage id ที่ส่งคืนจาก
  flow upload-url การ publish ด้วย storage-id ที่ staged ไว้ต้องมี
  `clawpackUploadTicket` ที่ส่งคืนพร้อม URL อัปโหลดนั้นด้วย
- ใช้ `files` หรือ `clawpack` อย่างใดอย่างหนึ่ง ห้ามใช้ทั้งสองอย่างในคำขอเดียวกัน
- body JSON และ metadata `payload.files` / `payload.artifact` ที่ caller ระบุเอง
  จะถูกปฏิเสธ
- คำขอ publish แบบ multipart โดยตรงจำกัดไว้ที่ 18MB tarball ClawPack อาจ
  ใช้ flow upload-url ได้ถึงขีดจำกัด tarball 120MB
- field payload ไม่บังคับ: `ownerHandle` เมื่อมีค่า เฉพาะ admin เท่านั้นที่ publish ในนาม owner นั้นได้

ไฮไลต์การ validation:

- `family` ต้องเป็น `code-plugin` หรือ `bundle-plugin`
- แพ็กเกจ Plugin ต้องมี `openclaw.plugin.json` การอัปโหลด ClawPack `.tgz` ต้อง
  มีไฟล์นี้ที่ `package/openclaw.plugin.json`
- code Plugin ต้องมี `package.json`, metadata ของ source repo, metadata ของ source commit,
  metadata ของ config schema, `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion`
- `openclaw.hostTargets` และ `openclaw.environment` เป็น metadata ไม่บังคับ
- เฉพาะ publisher org `openclaw` และ personal publisher ของสมาชิก org `openclaw`
  ปัจจุบันเท่านั้นที่ publish ไปยัง channel `official` ได้
- การ publish ในนามผู้อื่นยังคง validate สิทธิ์ของ official-channel กับบัญชี owner เป้าหมาย

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

soft-delete / restore Skill (owner, moderator หรือ admin)

body JSON ไม่บังคับ:

```json
{ "reason": "Held for moderation pending legal review." }
```

เมื่อมีค่า `reason` จะถูกจัดเก็บเป็น note moderation ของ Skill และคัดลอกเข้า audit log
soft delete ที่ owner เริ่มเองจะ reserve slug ไว้ 30 วัน จากนั้น publisher อื่นจึงอ้างสิทธิ์ slug ได้
การตอบกลับ delete มี `slugReservedUntil` เมื่อการหมดอายุนี้มีผล
การซ่อนโดย moderator/admin และการลบเพื่อความปลอดภัยจะไม่หมดอายุแบบนี้

การตอบกลับการลบ:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

รหัสสถานะ:

- `200`: ok
- `401`: unauthorized
- `403`: forbidden
- `404`: ไม่พบ Skill/ผู้ใช้
- `500`: ข้อผิดพลาดภายใน server

### `POST /api/v1/users/publisher`

สำหรับ admin เท่านั้น รับรองว่ามี org publisher สำหรับ handle หาก handle ยังชี้ไปยัง
user/personal publisher แบบ legacy ที่ใช้ร่วมกัน ปลายทางนี้จะ migrate ไปเป็น org publisher ก่อน
สำหรับ org ที่สร้างใหม่ ให้ระบุ `memberHandle`; admin ที่ดำเนินการจะไม่ถูกเพิ่มเป็นสมาชิก
`memberRole` มีค่าเริ่มต้นเป็น `owner`

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

การสร้าง org publisher แบบ self-serve ที่ต้องตรวจสอบสิทธิ์ สร้าง org publisher ใหม่และเพิ่ม
caller เป็น owner ปลายทางนี้จะไม่ migrate handle user/personal ที่มีอยู่และจะ
ไม่ทำเครื่องหมาย publisher เป็น trusted/official

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- ส่งคืน `409` เมื่อ handle ถูกใช้แล้วโดย publisher, user หรือ personal publisher

### `POST /api/v1/users/reserve`

สำหรับ admin เท่านั้น reserve root slug และชื่อแพ็กเกจให้ owner ที่มีสิทธิ์โดยไม่ต้อง publish
release ชื่อแพ็กเกจจะกลายเป็นแพ็กเกจ placeholder ส่วนตัวที่ไม่มี row ของ release เพื่อให้ owner เดิม
สามารถ publish release แบบ code-plugin หรือ bundle-plugin จริงลงในชื่อนั้นได้ในภายหลัง

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

สำหรับ admin เท่านั้น กู้คืน personal publisher สำหรับ GitHub OAuth principal สำรองที่ verified แล้ว
โดยไม่แก้ไข row บัญชี Convex Auth คำขอต้องระบุ id บัญชี provider GitHub ที่ immutable ทั้งสองค่า;
handle ที่ mutable ใช้เป็น guard สำหรับ operator เท่านั้น

ปลายทางนี้มีค่าเริ่มต้นเป็น dry-run การใช้การกู้คืนจริงต้องระบุ `dryRun: false` และ
`confirmIdentityVerified: true` หลังจากเจ้าหน้าที่ตรวจสอบความต่อเนื่องระหว่าง
GitHub principals ทั้งสองอย่างเป็นอิสระแล้ว การกู้คืนจะล้มเหลวแบบปิดกั้นเมื่อผู้เผยแพร่ส่วนบุคคลปัจจุบัน
ของผู้ใช้ปลายทางมี skills, packages หรือแหล่งที่มา GitHub ของสกิล
การกู้คืนยังย้ายฟิลด์ `ownerUserId` แบบเก่าสำหรับสกิลของผู้เผยแพร่ที่กู้คืน,
นามแฝง slug ของสกิล, packages, คำเตือนตัวตรวจสอบ package และแถว digest การค้นหาที่อนุมานมา เพื่อให้
เส้นทางเจ้าของโดยตรงสอดคล้องกับอำนาจผู้เผยแพร่ใหม่ การจอง handle ที่มีการป้องกันและยังใช้งานอยู่
สำหรับ handle ที่กู้คืนจะถูกมอบหมายใหม่ให้ผู้ใช้ทดแทนด้วย เพื่อให้การซิงโครไนซ์โปรไฟล์ในภายหลัง
ไม่สามารถกู้คืนอำนาจที่แข่งขันกันของผู้ใช้เดิมได้ แต่ละตารางหลักจำกัดไว้ที่
100 แถวต่อธุรกรรม apply; การกู้คืนที่ใหญ่กว่านี้ต้องใช้การย้ายเจ้าของแบบทำต่อได้ก่อน
แหล่งที่มา GitHub ของสกิลมีขอบเขตตามผู้เผยแพร่ และรายงานว่าได้ตรวจสอบแล้วแทนที่จะเขียนใหม่

- Body: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Response: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### ปลายทางการจัดการ slug ของเจ้าของ

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Response: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Response: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

หมายเหตุ:

- ปลายทางทั้งสองต้องใช้การยืนยันตัวตนด้วย API token และใช้งานได้เฉพาะเจ้าของสกิลเท่านั้น
- `rename` รักษา slug เดิมไว้เป็นนามแฝงสำหรับการเปลี่ยนเส้นทาง
- `merge` ซ่อนรายการต้นทางและเปลี่ยนเส้นทาง slug ต้นทางไปยังรายการเป้าหมาย

### ปลายทางการโอนความเป็นเจ้าของ

- `POST /api/v1/skills/{slug}/transfer`
  - Body: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Response: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Response (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - รูปแบบ Response: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

แบนผู้ใช้และลบสกิลที่เป็นเจ้าของแบบถาวร (เฉพาะ moderator/admin)

Body:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

หรือ

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

Response:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

ยกเลิกแบนผู้ใช้และกู้คืนสกิลที่มีสิทธิ์ (เฉพาะ admin)

Body:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

หรือ

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

Response:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

เปลี่ยนเหตุผลที่จัดเก็บไว้สำหรับการแบนที่มีอยู่ โดยไม่ยกเลิกแบนหรือกู้คืน
เนื้อหา (เฉพาะ admin) ค่าเริ่มต้นเป็น dry-run เว้นแต่ `dryRun` เป็น `false`

Body:

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

หรือ

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

Response:

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

Body:

```json
{ "handle": "user_handle", "role": "moderator" }
```

หรือ

```json
{ "userId": "users_...", "role": "admin" }
```

Response:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

แสดงรายการหรือค้นหาผู้ใช้ (เฉพาะ admin)

พารามิเตอร์ Query:

- `q` (ไม่บังคับ): คำค้นหา
- `query` (ไม่บังคับ): นามแฝงของ `q`
- `limit` (ไม่บังคับ): จำนวนผลลัพธ์สูงสุด (ค่าเริ่มต้น 20, สูงสุด 200)

Response:

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

Responses:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## ปลายทาง CLI แบบเก่า (เลิกใช้งานแล้ว)

ยังรองรับสำหรับ CLI เวอร์ชันเก่า:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

ดูแผนการลบได้ใน `DEPRECATIONS.md`

`POST /api/cli/upload-url` ส่งคืน `uploadUrl` และ `uploadTicket` การเผยแพร่ Package
ที่ stage tarball ของ ClawPack ต้องส่ง id พื้นที่จัดเก็บผลลัพธ์เป็น
`clawpack` และ ticket ที่ส่งคืนเป็น `clawpackUploadTicket`

## การค้นพบ registry (`/.well-known/clawhub.json`)

CLI สามารถค้นหาการตั้งค่า registry/auth จากไซต์ได้:

- `/.well-known/clawhub.json` (JSON, แนะนำ)
- `/.well-known/clawdhub.json` (แบบเก่า)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

หากคุณโฮสต์เอง ให้เสิร์ฟไฟล์นี้ (หรือตั้งค่า `CLAWHUB_REGISTRY` อย่างชัดเจน; `CLAWDHUB_REGISTRY` แบบเก่า)
