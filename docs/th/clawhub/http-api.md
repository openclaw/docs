---
read_when:
    - การเพิ่ม/เปลี่ยนแปลง endpoints
    - การดีบักคำขอ CLI ↔ registry
summary: เอกสารอ้างอิง HTTP API (สาธารณะ + ปลายทาง CLI + การยืนยันตัวตน)
x-i18n:
    generated_at: "2026-07-03T01:04:52Z"
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
พาธเดิม `/api/...` และ `/api/cli/...` ยังคงอยู่เพื่อความเข้ากันได้ (ดู `DEPRECATIONS.md`)
OpenAPI: `/api/v1/openapi.json`

## การนำแค็ตตาล็อกสาธารณะกลับมาใช้ซ้ำ

ไดเรกทอรีของบุคคลที่สามสามารถใช้ปลายทางอ่านแบบสาธารณะเพื่อแสดงรายการหรือค้นหา Skills ของ ClawHub ได้ โปรดแคชผลลัพธ์ เคารพ `429`/`Retry-After` ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ต้นฉบับ (`https://clawhub.ai/<owner>/skills/<slug>`) และหลีกเลี่ยงการสื่อเป็นนัยว่า ClawHub รับรองไซต์บุคคลที่สาม อย่าพยายามมิเรอร์เนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกจากการดูแลตรวจสอบ นอกเหนือจากพื้นผิว API สาธารณะ

ทางลัด slug บนเว็บจะ resolve ข้ามตระกูลรีจิสทรี แต่ไคลเอนต์ API ควรใช้
URL ต้นฉบับที่ปลายทางอ่านส่งกลับ แทนการสร้างลำดับความสำคัญของ route
ขึ้นใหม่เอง

## ขีดจำกัดอัตรา

โมเดลการบังคับใช้:

- คำขอแบบไม่ระบุตัวตน: บังคับใช้ต่อ IP
- คำขอที่ยืนยันตัวตนแล้ว (โทเค็น Bearer ที่ถูกต้อง): บังคับใช้ต่อ bucket ของผู้ใช้
- หากโทเค็นหายไป/ไม่ถูกต้อง พฤติกรรมจะ fallback ไปใช้การบังคับใช้ตาม IP
- ปลายทางเขียนที่ยืนยันตัวตนแล้วไม่ควรส่งกลับเพียง `Unauthorized` เมื่อ
  เซิร์ฟเวอร์ทราบเหตุผล โทเค็นที่หายไป โทเค็นที่ไม่ถูกต้อง/ถูกเพิกถอน และ
  บัญชีที่ถูกลบ/แบน/ปิดใช้งาน ควรได้รับข้อความที่นำไปดำเนินการได้ เพื่อให้ไคลเอนต์
  CLI บอกผู้ใช้ได้ว่าอะไรปิดกั้นพวกเขา

- อ่าน: 3000/นาทีต่อ IP, 12000/นาทีต่อคีย์
- เขียน: 300/นาทีต่อ IP, 3000/นาทีต่อคีย์
- ดาวน์โหลด: 1200/นาทีต่อ IP, 6000/นาทีต่อคีย์ (ปลายทางดาวน์โหลด)

ส่วนหัว:

- ความเข้ากันได้แบบเดิม: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- แบบมาตรฐาน: `RateLimit-Limit`, `RateLimit-Reset`
- เมื่อเป็น `429`: `X-RateLimit-Remaining: 0` และ `RateLimit-Remaining: 0`
- เมื่อเป็น `429`: `Retry-After`

ความหมายของส่วนหัว:

- `X-RateLimit-Reset`: วินาที Unix epoch แบบสัมบูรณ์
- `RateLimit-Reset`: จำนวนวินาทีจนกว่าจะรีเซ็ต (หน่วงเวลา)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: งบประมาณที่เหลือที่แน่นอนเมื่อมีอยู่
  คำขอที่สำเร็จแบบ sharded จะละเว้นส่วนหัวนี้ แทนการส่งค่าทั่วโลกโดยประมาณกลับมา
- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่ (หน่วงเวลา) เมื่อเป็น `429`

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

- หากมี `Retry-After` ให้รอตามจำนวนวินาทีนั้นก่อนลองใหม่
- ใช้ backoff แบบมี jitter เพื่อหลีกเลี่ยงการลองใหม่พร้อมกัน
- หากไม่มี `Retry-After` ให้ fallback ไปใช้ `RateLimit-Reset` (หรือคำนวณจาก `X-RateLimit-Reset`)

แหล่งที่มาของ IP:

- ใช้ส่วนหัว IP ไคลเอนต์ที่เชื่อถือได้ รวมถึง `cf-connecting-ip` เฉพาะเมื่อ
  การ deploy เปิดใช้ส่วนหัว forwarded ที่เชื่อถือได้อย่างชัดเจน
- ClawHub ใช้ส่วนหัว forwarding ที่เชื่อถือได้เพื่อระบุ IP ไคลเอนต์ที่ edge
- หากไม่มี IP ไคลเอนต์ที่เชื่อถือได้ คำขอแบบไม่ระบุตัวตนจะใช้ bucket fallback
  ที่ scoped ตามชนิดของ rate-limit เท่านั้น bucket fallback เหล่านี้จะไม่รวม
  พาธ slug ชื่อแพ็กเกจ เวอร์ชัน สตริงคิวรี หรือพารามิเตอร์อาร์ติแฟกต์อื่น ๆ
  ที่ผู้เรียกส่งมา

## การตอบกลับข้อผิดพลาด

การตอบกลับข้อผิดพลาด v1 สาธารณะเป็นข้อความธรรมดาพร้อม `content-type: text/plain; charset=utf-8`
ซึ่งรวมถึงความล้มเหลวในการตรวจสอบความถูกต้อง (`400`) ทรัพยากรสาธารณะที่หายไป (`404`) ความล้มเหลวด้าน auth และ
สิทธิ์ (`401`/`403`) ขีดจำกัดอัตรา (`429`) และการดาวน์โหลดที่ถูกบล็อก ไคลเอนต์
ควรอ่านเนื้อหาการตอบกลับเป็นสตริงที่มนุษย์อ่านได้ พารามิเตอร์คิวรีที่ไม่รู้จักจะถูก
ละเว้นเพื่อความเข้ากันได้ แต่พารามิเตอร์คิวรีที่รู้จักและมีค่าไม่ถูกต้องจะส่งกลับ
`400`

## ปลายทางสาธารณะ (ไม่ต้อง auth)

### `GET /api/v1/search`

พารามิเตอร์คิวรี:

- `q` (จำเป็น): สตริงคิวรี
- `limit` (ไม่บังคับ): จำนวนเต็ม
- `highlightedOnly` (ไม่บังคับ): `true` เพื่อกรองเฉพาะ Skills ที่ถูกไฮไลต์
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
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

- ผลลัพธ์จะถูกส่งกลับตามลำดับความเกี่ยวข้อง (embedding similarity + การ boost token ของ slug/name ที่ตรงกันแบบ exact + popularity prior เล็กน้อย)
- ความเกี่ยวข้องมีน้ำหนักมากกว่าความนิยม slug ที่แม่นยำหรือ token ของ display-name ที่ตรงกันสามารถจัดอันดับสูงกว่าการจับคู่ที่หลวมกว่าแต่มี engagement มากกว่ามากได้
- ข้อความ ASCII จะถูก tokenized ตามขอบเขตคำและเครื่องหมายวรรคตอน ตัวอย่างเช่น `personal-map` มี token `map` แบบ standalone ขณะที่ `amap-jsapi-skill` มี `amap`, `jsapi` และ `skill`; ดังนั้นการค้นหา `map` จึงให้ lexical match แก่ `personal-map` มากกว่า `amap-jsapi-skill`
- ความนิยมถูกปรับแบบ log-scaled และ capped Skills ที่มี engagement สูงอาจจัดอันดับต่ำกว่าเมื่อข้อความคิวรีจับคู่ได้อ่อนกว่า
- สถานะการดูแลตรวจสอบที่น่าสงสัยหรือซ่อนอยู่สามารถนำ Skill ออกจากการค้นหาสาธารณะได้ ขึ้นอยู่กับตัวกรองของผู้เรียกและสถานะการดูแลตรวจสอบปัจจุบัน

คำแนะนำด้านการค้นพบสำหรับผู้เผยแพร่:

- ใส่คำที่ผู้ใช้จะค้นหาจริง ๆ ในชื่อที่แสดง สรุป และแท็ก ใช้ token slug แบบ standalone เฉพาะเมื่อเป็นอัตลักษณ์ที่เสถียรที่คุณต้องการเก็บไว้ด้วย
- อย่าเปลี่ยนชื่อ slug เพียงเพื่อไล่ตามคิวรีเดียว เว้นแต่ slug ใหม่จะเป็นชื่อ canonical ระยะยาวที่ดีกว่า slug เก่าจะกลายเป็น redirect aliases แต่ canonical URL, slug ที่แสดง และ digest การค้นหาในอนาคตจะใช้ slug ใหม่
- Rename aliases จะคงการ resolve สำหรับ URL เก่าและการติดตั้งที่ resolve ผ่านรีจิสทรี แต่การจัดอันดับการค้นหาขึ้นอยู่กับ metadata ของ Skill canonical หลังจากการเปลี่ยนชื่อถูก index แล้ว สถิติที่มีอยู่จะยังอยู่กับ Skill
- หาก Skill ล่องหนโดยไม่คาดคิด ให้ตรวจสอบสถานะการดูแลตรวจสอบก่อนด้วย `clawhub inspect @owner/slug` ขณะเข้าสู่ระบบ ก่อนเปลี่ยน metadata ที่เกี่ยวข้องกับการจัดอันดับ

### `GET /api/v1/skills`

พารามิเตอร์คิวรี:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–200)
- `cursor` (ไม่บังคับ): pagination cursor สำหรับการเรียงลำดับใด ๆ ที่ไม่ใช่ `trending`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), alias การติดตั้งแบบเดิม `installsCurrent`/`installs`/`installsAllTime` map ไปยัง `downloads`, `trending`
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias แบบเดิมสำหรับ `nonSuspiciousOnly`

ค่า `sort` ที่ไม่ถูกต้องจะส่งกลับ `400`

หมายเหตุ:

- `recommended` ใช้สัญญาณ engagement และ recency
- `trending` จัดอันดับตามการติดตั้งใน 7 วันที่ผ่านมา (อิง telemetry)
- `createdAt` เสถียรสำหรับการ crawl Skill ใหม่; `updated` เปลี่ยนเมื่อ Skill ที่มีอยู่ถูกเผยแพร่ใหม่
- เมื่อ `nonSuspiciousOnly=true` การเรียงลำดับแบบใช้ cursor อาจส่งคืนรายการน้อยกว่า `limit` ในหนึ่งหน้า เพราะ Skills ที่น่าสงสัยถูกกรองหลังจากดึงหน้าแล้ว
- ใช้ `nextCursor` เพื่อทำ pagination ต่อเมื่อมีอยู่ หน้าสั้นไม่ได้หมายความว่าเป็นจุดสิ้นสุดของผลลัพธ์ด้วยตัวมันเอง

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

- slug เก่าที่สร้างจาก flow การเปลี่ยนชื่อ/merge ของเจ้าของจะ resolve ไปยัง Skill canonical
- `metadata.os`: ข้อจำกัด OS ที่ประกาศใน frontmatter ของ Skill (เช่น `["macos"]`, `["linux"]`) `null` หากไม่ได้ประกาศ
- `metadata.systems`: เป้าหมายระบบ Nix (เช่น `["aarch64-darwin", "x86_64-linux"]`) `null` หากไม่ได้ประกาศ
- `metadata` เป็น `null` หาก Skill ไม่มี metadata แพลตฟอร์ม
- `moderation` จะรวมอยู่เฉพาะเมื่อ Skill ถูก flagged หรือเจ้าของกำลังดูอยู่

### `GET /api/v1/skills/{slug}/moderation`

ส่งกลับสถานะการดูแลตรวจสอบแบบมีโครงสร้าง

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

- เจ้าของและ moderator สามารถเข้าถึงรายละเอียดการดูแลตรวจสอบสำหรับ Skills ที่ซ่อนอยู่ได้
- ผู้เรียกสาธารณะจะได้รับ `200` เฉพาะสำหรับ Skills ที่มองเห็นได้และถูก flagged แล้ว
- หลักฐานจะถูก redacted สำหรับผู้เรียกสาธารณะ และรวม raw snippets เฉพาะสำหรับเจ้าของ/moderator

### `POST /api/v1/skills/{slug}/report`

รายงาน Skill เพื่อให้ moderator ตรวจสอบ รายงานอยู่ในระดับ Skill อาจเชื่อมโยง
กับเวอร์ชันได้ และป้อนเข้าสู่คิวรายงาน Skill

Auth:

- ต้องใช้โทเค็น API

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

ปลายทาง moderator/admin สำหรับรับรายงาน Skill

พารามิเตอร์คิวรี:

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

ปลายทาง moderator/admin สำหรับแก้ไขหรือเปิดรายงาน Skill ใหม่

คำขอ:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` จำเป็นสำหรับ `confirmed` และ `dismissed`; อาจละเว้นได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "hide"` พร้อมรายงานที่ triaged แล้ว
เพื่อซ่อน Skill ใน workflow เดียวกันที่ audit ได้

### `GET /api/v1/skills/{slug}/versions`

พารามิเตอร์คิวรี:

- `limit` (ไม่บังคับ): จำนวนเต็ม
- `cursor` (ไม่บังคับ): pagination cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

ส่งกลับ metadata ของเวอร์ชัน + รายการไฟล์

- `version.security` รวมสถานะการตรวจสอบ scan ที่ normalize แล้วและรายละเอียด scanner
  (VirusTotal + LLM) เมื่อมี

### `GET /api/v1/skills/{slug}/scan`

ส่งกลับรายละเอียดการตรวจสอบ scan ความปลอดภัยสำหรับเวอร์ชัน Skill

พารามิเตอร์คิวรี:

- `version` (ไม่บังคับ): สตริงเวอร์ชันเฉพาะ
- `tag` (ไม่บังคับ): resolve เวอร์ชันที่ติดแท็ก (ตัวอย่างเช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- รวมสถานะการตรวจสอบยืนยันที่ทำให้เป็นรูปแบบมาตรฐานแล้ว พร้อมรายละเอียดเฉพาะของสแกนเนอร์
- `security.hasScanResult` เป็น `true` เฉพาะเมื่อสแกนเนอร์ให้คำตัดสินที่แน่ชัด (`clean`, `suspicious` หรือ `malicious`)
- `moderation` คือสแนปช็อตการกลั่นกรองระดับ Skill ปัจจุบันที่ได้มาจากเวอร์ชันล่าสุด
- เมื่อค้นหาเวอร์ชันย้อนหลัง ให้ตรวจสอบ `moderation.matchesRequestedVersion` และ `moderation.sourceVersion` ก่อนถือว่า `moderation` และ `security` อยู่ในบริบทเวอร์ชันเดียวกัน

### `POST /api/v1/skills/-/scan`

เอนด์พอยต์ส่งงานที่ต้องยืนยันตัวตนสำหรับงาน ClawScan ใหม่

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
- การสแกนที่เผยแพร่แล้วต้องมีสิทธิ์เข้าถึงการจัดการของเจ้าของ/ผู้เผยแพร่ หรืออำนาจผู้กลั่นกรอง/ผู้ดูแลระบบแพลตฟอร์ม
- การสแกนที่เผยแพร่แล้วจะเขียนกลับเฉพาะเมื่อ `update: true` และการสแกนเสร็จสมบูรณ์สำเร็จ
- การตอบกลับคือ `202` พร้อม `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`
- งานสแกนเป็นแบบอะซิงโครนัส คำขอสแกนแบบแมนนวลจะได้รับลำดับความสำคัญก่อนงานเผยแพร่/เติมข้อมูลย้อนหลังปกติ แต่การเสร็จสมบูรณ์ยังขึ้นอยู่กับความพร้อมของเวิร์กเกอร์

### `GET /api/v1/skills/-/scan/{scanId}`

เอนด์พอยต์โพลที่ต้องยืนยันตัวตนสำหรับการสแกนที่ส่งแล้ว

- ส่งคืนสถานะ queued/running/succeeded/failed
- ส่งคืน `queue.queuedAhead` และ `queue.position` ขณะอยู่ในคิว เพื่อให้ไคลเอนต์แสดงจำนวนการสแกนแบบแมนนวลที่มีลำดับความสำคัญซึ่งอยู่ก่อนหน้าคำขอได้ คิวที่ใหญ่มากจะถูกจำกัดขอบเขตและรายงานด้วย `queuedAheadIsEstimate: true`
- เมื่อมีให้ใช้งาน `report` จะมีส่วน `clawscan`, `skillspector`, `staticAnalysis` และ `virustotal`
- งานสแกนที่ล้มเหลวจะส่งคืน `status: "failed"` พร้อม `lastError`

### `GET /api/v1/skills/-/scan/{scanId}/download`

เอนด์พอยต์คลังรายงานที่ต้องยืนยันตัวตน

- ต้องเป็นการสแกนที่สำเร็จแล้ว การสแกนที่ยังไม่สิ้นสุดจะส่งคืน `409`
- ส่งคืน ZIP ที่มี `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

เอนด์พอยต์คลังรายงานที่จัดเก็บไว้ซึ่งต้องยืนยันตัวตนสำหรับเวอร์ชันที่ส่งแล้ว

- ต้องมีสิทธิ์เข้าถึงการจัดการของเจ้าของ/ผู้เผยแพร่ต่อ Skill หรือ Plugin หรือมีอำนาจผู้กลั่นกรอง/ผู้ดูแลระบบแพลตฟอร์ม
- ส่งคืนผลการสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งมาตรงกัน รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อน
- `kind` มีค่าเริ่มต้นเป็น `skill`; ใช้ `kind=plugin` สำหรับการสแกน Plugin/แพ็กเกจ
- ส่งคืนรูปแบบ ZIP เดียวกับการดาวน์โหลดคำขอสแกน

### `POST /api/v1/skills/-/scan/batch`

เส้นทางสแกนซ้ำแบบแบตช์ตามแบบแผนสำหรับผู้ดูแลระบบเท่านั้น รับรูปแบบเพย์โหลดเดียวกับ `POST /api/v1/skills/-/rescan-batch` แบบเดิม

### `POST /api/v1/skills/-/scan/batch/status`

เส้นทางสถานะแบบแบตช์ตามแบบแผนสำหรับผู้ดูแลระบบเท่านั้น รับ `{ "jobIds": ["..."] }` และส่งคืนตัวนับรวมเดียวกับ `POST /api/v1/skills/-/rescan-batch/status` แบบเดิม

### `GET /api/v1/skills/{slug}/verify`

ส่งคืนซองข้อมูลการตรวจสอบยืนยัน Skill Card ที่ใช้โดย `clawhub skill verify`

พารามิเตอร์คิวรี:

- `version` (ไม่บังคับ): สตริงเวอร์ชันเฉพาะ
- `tag` (ไม่บังคับ): แปลงเป็นเวอร์ชันที่ติดแท็กไว้ (เช่น `latest`)

หมายเหตุ:

- `ok` เป็น `true` เฉพาะเมื่อเวอร์ชันที่เลือกมี Skill Card ที่สร้างแล้ว ไม่ถูกการกลั่นกรองบล็อกว่าเป็นมัลแวร์ และการตรวจสอบยืนยัน ClawScan เป็น clean
- อัตลักษณ์ Skill, อัตลักษณ์ผู้เผยแพร่ และเมทาดาทาเวอร์ชันที่เลือกเป็นฟิลด์ซองข้อมูลระดับบนสุด (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) เพื่อให้ระบบอัตโนมัติของเชลล์อ่านได้โดยไม่ต้องแกะตัวห่อซ้อน
- `security` คือคำตัดสิน ClawScan/ความปลอดภัยระดับบนสุด ระบบอัตโนมัติควรอิงจาก `ok`, `decision`, `reasons` และ `security.status`
- `security.signals` มีหลักฐานสแกนเนอร์สนับสนุน เช่น `staticScan`, `virusTotal` และ `skillSpector`
- `security.signals.dependencyRegistry` ถูกคงไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่สแกนเนอร์ตรวจสอบการมีอยู่ของรีจิสทรี dependency ถูกเลิกใช้แล้ว และคีย์นี้จะเป็น `null` เสมอ
- `provenance` เป็น `server-resolved-github-import` เฉพาะเมื่อ ClawHub แปลงและจัดเก็บ repo/ref/commit/path ของ GitHub ระหว่างการเผยแพร่หรือนำเข้า มิฉะนั้นจะเป็น `unavailable`

### `POST /api/v1/skills/-/security-verdicts`

ส่งคืนคำตัดสินความปลอดภัยแบบย่อปัจจุบันสำหรับเวอร์ชัน Skill ที่ระบุแน่นอน เอนด์พอยต์คอลเลกชันนี้มีไว้สำหรับไคลเอนต์ที่รู้อยู่แล้วว่าต้องแสดงเวอร์ชัน Skill ของ ClawHub ที่ติดตั้งใดบ้าง เช่น OpenClaw Control UI

คำขอ:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

หมายเหตุ:

- `items` ต้องมีคู่ `{ slug, version }` ที่ไม่ซ้ำกันจำนวน 1-100 คู่
- ผลลัพธ์เป็นรายรายการ Skill หรือเวอร์ชันที่หายไปหนึ่งรายการจะไม่ทำให้การตอบกลับทั้งหมดล้มเหลว
- การตอบกลับเป็นข้อมูลความปลอดภัยเท่านั้น ไม่รวมข้อมูล Skill Card, สถานะการ์ดที่สร้างแล้ว, รายการไฟล์อาร์ติแฟกต์ หรือเพย์โหลดสแกนเนอร์โดยละเอียด
- `security.signals` มีเฉพาะหลักฐานสนับสนุนระดับสถานะ ใช้ `/scan` หรือหน้า security-audit ของ ClawHub สำหรับรายละเอียดสแกนเนอร์แบบเต็ม
- `security.signals.dependencyRegistry` ถูกคงไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่สแกนเนอร์ตรวจสอบการมีอยู่ของรีจิสทรี dependency ถูกเลิกใช้แล้ว และคีย์นี้จะเป็น `null` เสมอ
- การไม่มี Skill Card ไม่ส่งผลต่อ `ok`, `decision` หรือ `reasons` ของเอนด์พอยต์นี้ ไคลเอนต์ควรอ่าน `skill-card.md` ที่ติดตั้งไว้ในเครื่องเมื่อต้องการเนื้อหาการ์ด
- ใช้ `/verify` เมื่อต้องการซองข้อมูลการตรวจสอบยืนยัน Skill Card สำหรับ Skill เดียว, `/card` เมื่อต้องการ markdown ของการ์ดที่สร้างแล้ว และ `/scan` เมื่อต้องการข้อมูลสแกนเนอร์โดยละเอียด

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

- ค่าเริ่มต้นเป็นเวอร์ชันล่าสุด
- ขีดจำกัดขนาดไฟล์: 200KB

### `GET /api/v1/packages`

ปลายทางแค็ตตาล็อกรวมสำหรับ:

- Skills
- Plugin แบบโค้ด
- Plugin แบบบันเดิล

พารามิเตอร์ Query:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์สำหรับการแบ่งหน้า
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended`, `trending`, `downloads`, นามแฝงเดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอถูกจำกัดขอบเขตไว้ที่แพ็กเกจ Plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` หรือปลายทางแพ็กเกจที่มี
  `family=code-plugin`/`family=bundle-plugin`) หมวดหมู่ที่ควบคุมและ
  นามแฝงตัวกรอง v1 เดิมมีเอกสารอยู่ภายใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` หรือ `sort` จะส่งคืน `400` พารามิเตอร์ Query ที่ไม่รู้จักจะถูกละเว้น
- `GET /api/v1/code-plugins` และ `GET /api/v1/bundle-plugins` ยังคงเป็นนามแฝงแบบตระกูลคงที่
- รายการ Skills ยังคงอิงกับรีจิสทรี Skills และยังเผยแพร่ได้ผ่าน `POST /api/v1/skills` เท่านั้น
- `POST /api/v1/packages` ยังคงใช้สำหรับรีลีส code-plugin และ bundle-plugin เท่านั้น
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะเท่านั้น
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถเห็นแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดอยู่ในผลลัพธ์รายการ/การค้นหา
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ผ่านการยืนยันตัวตนอ่านได้เท่านั้น

### `GET /api/v1/packages/search`

การค้นหาแค็ตตาล็อกรวมใน Skills + แพ็กเกจ Plugin

พารามิเตอร์ Query:

- `q` (จำเป็น): สตริงคำค้นหา
- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอถูกจำกัดขอบเขตไว้ที่แพ็กเกจ Plugin หมวดหมู่ที่ควบคุมและนามแฝง
  ตัวกรอง v1 เดิมมีเอกสารอยู่ภายใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured` หรือ
  `highlightedOnly` จะส่งคืน `400` พารามิเตอร์ Query ที่ไม่รู้จักจะถูกละเว้น
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะเท่านั้น
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถค้นหาแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดอยู่ได้
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ผ่านการยืนยันตัวตนอ่านได้เท่านั้น

### `GET /api/v1/plugins`

การเรียกดูแค็ตตาล็อกเฉพาะ Plugin ในแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์ Query:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์สำหรับการแบ่งหน้า
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `recommended` (ค่าเริ่มต้น), `trending`, `downloads`, `updated`, นามแฝงเดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

นามแฝงตัวกรอง v1 เดิมยังคงยอมรับบนปลายทางการอ่าน:

- `mcp-tooling`, `data` และ `automation` จะแปลงเป็น `tools`
- `observability` และ `deployment` จะแปลงเป็น `gateway`
- `dev-tools` จะแปลงเป็น `runtime`

`trending` เป็นลีดเดอร์บอร์ดการติดตั้ง/ดาวน์โหลดในรอบเจ็ดวัน และไม่ใช้ยอดรวมตลอดเวลา
บนปลายทางรวม `/api/v1/packages` จะใช้ได้เฉพาะ Plugin เท่านั้น ใช้
`/api/v1/skills?sort=trending` สำหรับแค็ตตาล็อก Skills

ไม่ยอมรับนามแฝงเดิมเป็นค่าหมวดหมู่ที่จัดเก็บหรือที่ผู้เขียนประกาศ

### `GET /api/v1/skills/export`

การส่งออก Skills สาธารณะล่าสุดเป็นชุดสำหรับการวิเคราะห์แบบออฟไลน์

การยืนยันตัวตน:

- ต้องใช้โทเค็น API

พารามิเตอร์ Query:

- `startDate` (จำเป็น): ขอบเขตล่างแบบมิลลิวินาที Unix สำหรับ `updatedAt` ของ Skills
- `endDate` (จำเป็น): ขอบเขตบนแบบมิลลิวินาที Unix สำหรับ `updatedAt` ของ Skills
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์สำหรับการแบ่งหน้าจากการตอบกลับก่อนหน้า

การตอบกลับ:

- เนื้อหา: ไฟล์ ZIP
- Skills ที่ส่งออกแต่ละรายการมีรากอยู่ที่ `{publisher}/{slug}/`
- Skills ที่โฮสต์ไว้จะรวมไฟล์เวอร์ชันล่าสุดที่จัดเก็บไว้ และถูกระบุใน
  `_manifest.json` พร้อม `sourceRef: "public-clawhub"`
- Skills ปัจจุบันที่อิง GitHub และมีการสแกน `clean` หรือ `suspicious` จะรวม
  `_source_handoff.json` พร้อม `sourceRef: "public-github"`, repo, commit, path,
  แฮชเนื้อหา และ URL ไฟล์เก็บถาวร โดยจะไม่รวมไฟล์ซอร์สที่โฮสต์บน ClawHub
- Skills แต่ละรายการมี `_export_skill_meta.json`
- `_manifest.json` จะถูกรวมไว้ที่รากของ ZIP เสมอ
- `_errors.json` จะถูกรวมไว้เมื่อไม่สามารถส่งออก Skills หรือไฟล์บางรายการได้

ส่วนหัว:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

ส่งออก release สาธารณะล่าสุดของ Plugin แบบกลุ่มสำหรับการวิเคราะห์แบบออฟไลน์

Auth:

- ต้องใช้ API token

พารามิเตอร์ Query:

- `startDate` (จำเป็น): ขอบเขตล่างของ `updatedAt` ของ Plugin เป็น Unix milliseconds
- `endDate` (จำเป็น): ขอบเขตบนของ `updatedAt` ของ Plugin เป็น Unix milliseconds
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): cursor สำหรับการแบ่งหน้าจากการตอบกลับก่อนหน้า
- `family` (ไม่บังคับ): `code-plugin` หรือ `bundle-plugin` หากละไว้หมายถึงทั้งสอง
  ตระกูล Plugin

การตอบกลับ:

- Body: ZIP archive
- Plugin ที่ส่งออกแต่ละรายการมี root ที่ `{family}/{packageName}/`
- Plugin ที่ส่งออกแต่ละรายการรวมไฟล์ที่จัดเก็บไว้ของ release ล่าสุด
- metadata การส่งออกของแต่ละ Plugin จัดเก็บไว้ที่
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`
- `_manifest.json` จะถูกรวมไว้ที่ root ของ ZIP เสมอ
- `_errors.json` จะถูกรวมไว้เมื่อ Plugin หรือไฟล์บางรายการไม่สามารถ
  ส่งออกได้

Headers:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

การค้นหาเฉพาะ Plugin ในแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์ Query:

- `q` (จำเป็น): query string
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

หมายเหตุ:

- alias ตัวกรอง v1 เดิมที่บันทึกไว้ใต้ `GET /api/v1/plugins` ยังได้รับการ
  ยอมรับ
- การกรองหมวดหมู่เป็นตัวกรอง API จริงที่รองรับด้วยแถว digest หมวดหมู่ Plugin
  ไม่ใช่การเขียน search-query ใหม่
- ผลลัพธ์จะถูกส่งกลับตามลำดับความเกี่ยวข้อง และปัจจุบันยังไม่มีการแบ่งหน้า
- ตัวควบคุมการเรียงลำดับใน Browser UI สำหรับการค้นหา Plugin จะจัดลำดับผลลัพธ์
  ความเกี่ยวข้องที่โหลดแล้วใหม่ ให้ตรงกับพฤติกรรมการเรียกดู `/skills` ปัจจุบัน

### `GET /api/v1/packages/{name}`

ส่งกลับ metadata รายละเอียดของแพ็กเกจ

หมายเหตุ:

- Skills สามารถ resolve ผ่าน route นี้ได้เช่นกันในแค็ตตาล็อกแบบรวม
- แพ็กเกจส่วนตัวจะส่งกลับ `404` เว้นแต่ผู้เรียกจะสามารถอ่าน publisher เจ้าของได้

### `DELETE /api/v1/packages/{name}`

ลบแพ็กเกจและ release ทั้งหมดแบบ soft-delete

หมายเหตุ:

- ต้องใช้ API token สำหรับเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแล publisher ขององค์กร,
  moderator ของแพลตฟอร์ม หรือ admin ของแพลตฟอร์ม

### `GET /api/v1/packages/{name}/versions`

ส่งกลับประวัติเวอร์ชัน

พารามิเตอร์ Query:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): cursor สำหรับการแบ่งหน้า

หมายเหตุ:

- แพ็กเกจส่วนตัวจะส่งกลับ `404` เว้นแต่ผู้เรียกจะสามารถอ่าน publisher เจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}`

ส่งกลับเวอร์ชันแพ็กเกจหนึ่งรายการ รวมถึง metadata ของไฟล์, ความเข้ากันได้,
การยืนยัน, metadata ของ artifact และข้อมูลการสแกน

หมายเหตุ:

- `version.artifact.kind` เป็น `legacy-zip` สำหรับ archive แพ็กเกจแบบเก่า หรือ
  `npm-pack` สำหรับ release ที่รองรับโดย ClawPack
- release ของ ClawPack รวมฟิลด์ `npmIntegrity`, `npmShasum` และ
  `npmTarballName` ที่เข้ากันได้กับ npm
- `version.sha256hash` เป็น metadata ความเข้ากันได้ที่เลิกใช้แล้วสำหรับ client เก่า
  ค่านี้ hash bytes ของ ZIP ที่ส่งกลับโดย `/api/v1/packages/{name}/download`
  แบบตรงตัว client สมัยใหม่ควรใช้ `version.artifact.sha256` ซึ่งระบุ
  artifact release แบบ canonical
- `version.vtAnalysis`, `version.llmAnalysis` และ `version.staticScan` จะถูกรวมไว้
  เมื่อมีข้อมูลการสแกนอยู่
- แพ็กเกจส่วนตัวจะส่งกลับ `404` เว้นแต่ผู้เรียกจะสามารถอ่าน publisher เจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}/security`

ส่งกลับสรุปความปลอดภัยและความน่าเชื่อถือของ release แพ็กเกจแบบตรงตัวสำหรับ
client ติดตั้ง นี่คือ surface การใช้งานสาธารณะของ OpenClaw สำหรับตัดสินว่า
release ที่ resolve แล้วสามารถติดตั้งได้หรือไม่

Auth:

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

- `package.name`, `package.displayName` และ `package.family` ระบุแพ็กเกจ registry
  ที่ resolve แล้ว
- `release.releaseId`, `release.version` และ `release.createdAt` ระบุ release
  แบบตรงตัวที่ได้รับการประเมิน
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` และ `release.npmTarballName` จะมีอยู่เมื่อทราบค่าสำหรับ
  artifact ของ release
- `trust.scanStatus` คือสถานะความน่าเชื่อถือที่มีผล ซึ่ง derive จาก input ของ scanner
  และการ moderation release แบบ manual
- `trust.moderationState` อาจเป็น null ได้ โดยเป็น `null` เมื่อไม่มีการ moderation
  release แบบ manual
- `trust.blockedFromDownload` คือสัญญาณการบล็อกการติดตั้ง OpenClaw และ client
  ติดตั้งอื่นควรบล็อกการติดตั้งเมื่อค่านี้เป็น `true` แทนที่จะ derive กฎการบล็อก
  ใหม่จากฟิลด์ scanner หรือ moderation
- `trust.reasons` คือรายการคำอธิบายสำหรับผู้ใช้และการ audit รหัสเหตุผลเป็น string
  ที่เสถียรและกะทัดรัด เช่น `manual:quarantined`, `scan:malicious` และ
  `package:malicious`
- `trust.pending` หมายความว่า input ด้านความน่าเชื่อถือหนึ่งรายการขึ้นไปยังรอการทำให้เสร็จ
- `trust.stale` หมายความว่าสรุปความน่าเชื่อถือถูกคำนวณจาก input ที่ล้าสมัย และ
  ควรถูกปฏิบัติว่าต้อง refresh ก่อนตัดสินใจอนุญาตด้วยความมั่นใจสูง

หมายเหตุ:

- endpoint นี้เจาะจงเวอร์ชัน client ควรเรียกหลังจาก resolve เวอร์ชันแพ็กเกจที่
  ตั้งใจจะติดตั้งแล้ว ไม่ใช่เพียงหลังจากอ่าน metadata แพ็กเกจล่าสุด
- แพ็กเกจส่วนตัวจะส่งกลับ `404` เว้นแต่ผู้เรียกจะสามารถอ่าน publisher เจ้าของได้
- endpoint นี้ตั้งใจให้แคบกว่า endpoint moderation ของเจ้าของ/moderator โดยเปิดเผย
  การตัดสินใจติดตั้งและคำอธิบายสาธารณะ ไม่ใช่ตัวตนของผู้รายงาน, เนื้อหารายงาน,
  หลักฐานส่วนตัว หรือ timeline การ review ภายใน

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

ส่งกลับ metadata resolver ของ artifact แบบชัดเจนสำหรับเวอร์ชันแพ็กเกจ

หมายเหตุ:

- เวอร์ชันแพ็กเกจ legacy ส่งกลับ artifact `legacy-zip` และ `downloadUrl` ของ ZIP legacy
- เวอร์ชัน ClawPack ส่งกลับ artifact `npm-pack`, ฟิลด์ integrity ของ npm,
  `tarballUrl` และ URL ความเข้ากันได้ของ ZIP legacy
- นี่คือ surface resolver ของ OpenClaw ซึ่งหลีกเลี่ยงการเดารูปแบบ archive จาก URL ที่ใช้ร่วมกัน

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ดาวน์โหลด artifact ของเวอร์ชันผ่าน path resolver แบบชัดเจน

หมายเหตุ:

- เวอร์ชัน ClawPack stream bytes ของ `.tgz` npm-pack ที่อัปโหลดมาแบบตรงตัว
- เวอร์ชัน ZIP legacy redirect ไปยัง `/api/v1/packages/{name}/download?version=`
- ใช้ bucket อัตราการดาวน์โหลด

### `GET /api/v1/packages/{name}/readiness`

ส่งกลับความพร้อมที่คำนวณแล้วสำหรับการใช้งาน OpenClaw ในอนาคต

การตรวจสอบความพร้อมครอบคลุม:

- สถานะ channel ทางการ
- ความพร้อมใช้งานของเวอร์ชันล่าสุด
- ความพร้อมใช้งานของ artifact npm-pack ของ ClawPack
- digest ของ artifact
- provenance ของ source repo และ commit
- metadata ความเข้ากันได้กับ OpenClaw
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

endpoint ของ moderator สำหรับแสดงรายการแถว migration ของ Plugin OpenClaw ทางการ

Auth:

- ต้องใช้ API token สำหรับผู้ใช้ที่เป็น moderator หรือ admin

พารามิเตอร์ Query:

- `phase` (ไม่บังคับ): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` หรือ
  `all` (ค่าเริ่มต้น)
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): cursor สำหรับการแบ่งหน้า

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

endpoint ของ admin สำหรับสร้างหรืออัปเดตแถว migration ของ Plugin ทางการ

Auth:

- ต้องใช้ API token สำหรับผู้ใช้ที่เป็น admin

Request body:

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

- `bundledPluginId` จะถูก normalize เป็นตัวพิมพ์เล็กและเป็น key สำหรับ upsert ที่เสถียร
- `packageName` จะถูก normalize เป็นชื่อ npm; แพ็กเกจอาจไม่มีอยู่สำหรับ migration ที่วางแผนไว้
- สิ่งนี้ติดตามเฉพาะความพร้อมของ migration เท่านั้น ไม่ได้ mutate OpenClaw หรือสร้าง
  ClawPacks

### `GET /api/v1/packages/moderation/queue`

endpoint ของ moderator/admin สำหรับ queue review release ของแพ็กเกจ

Auth:

- ต้องใช้ API token สำหรับผู้ใช้ที่เป็น moderator หรือ admin

พารามิเตอร์ Query:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `blocked`, `manual` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): cursor สำหรับการแบ่งหน้า

ความหมายของสถานะ:

- `open`: release ที่น่าสงสัย, เป็นอันตราย, pending, quarantined, revoked หรือถูกรายงาน
- `blocked`: release ที่ quarantined, revoked หรือเป็นอันตราย
- `manual`: release ใด ๆ ที่มี manual moderation override
- `all`: release ใด ๆ ที่มี manual override, สถานะการสแกนที่ไม่ clean หรือรายงานแพ็กเกจ

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

รายงานแพ็กเกจเพื่อให้ moderator review รายงานอยู่ระดับแพ็กเกจ และอาจเชื่อมโยงกับ
เวอร์ชันได้ รายงานเหล่านี้ป้อนเข้า queue moderation แต่จะไม่ซ่อนหรือบล็อกการดาวน์โหลด
โดยอัตโนมัติด้วยตัวเอง moderator ควรใช้ release moderation เพื่อ approve, quarantine
หรือ revoke artifact

Auth:

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

จุดปลายทางสำหรับผู้ดูแล/แอดมินเพื่อรับรายงานแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลหรือแอดมิน

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

จุดปลายทางสำหรับเจ้าของ/ผู้ดูแลเพื่อดูสถานะการกลั่นกรองแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับเจ้าของแพ็กเกจ สมาชิกผู้เผยแพร่ ผู้ดูแล หรือ
  ผู้ใช้แอดมิน

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

จุดปลายทางสำหรับผู้ดูแล/แอดมินเพื่อแก้ไขหรือเปิดรายงานแพ็กเกจอีกครั้ง

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

จุดปลายทางสำหรับผู้ดูแล/แอดมินเพื่อตรวจสอบรีลีสแพ็กเกจ

คำขอ:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

สถานะที่รองรับ:

- `approved`: ตรวจสอบด้วยตนเองแล้วและอนุญาต
- `quarantined`: ถูกบล็อกระหว่างรอการติดตามผล
- `revoked`: ถูกบล็อกหลังจากรีลีสเคยได้รับความเชื่อถือก่อนหน้านี้

รีลีสที่ถูกกักกันและถูกเพิกถอนจะส่งคืน `403` จากเส้นทางดาวน์โหลดอาร์ติแฟกต์
ทุกการเปลี่ยนแปลงจะเขียนรายการบันทึกการตรวจสอบ

### `GET /api/v1/packages/{name}/file`

ส่งคืนเนื้อหาข้อความดิบสำหรับไฟล์แพ็กเกจ

พารามิเตอร์คิวรี:

- `path` (บังคับ)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือรีลีสล่าสุด
- ใช้บัคเก็ตอัตราการอ่าน ไม่ใช่บัคเก็ตการดาวน์โหลด
- ไฟล์ไบนารีส่งคืน `415`
- ขีดจำกัดขนาดไฟล์: 200KB
- การสแกน VirusTotal ที่ค้างอยู่จะไม่บล็อกการอ่าน; รีลีสที่เป็นอันตรายอาจยังถูกระงับในที่อื่น
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่ที่เป็นเจ้าของได้

### `GET /api/v1/packages/{name}/download`

ดาวน์โหลดไฟล์ ZIP แบบกำหนดได้ซ้ำของรุ่นเก่าสำหรับรีลีสแพ็กเกจ

พารามิเตอร์คิวรี:

- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือรีลีสล่าสุด
- Skills เปลี่ยนเส้นทางไปยัง `GET /api/v1/download`
- อาร์ไคฟ์ Plugin/แพ็กเกจเป็นไฟล์ zip ที่มีราก `package/` เพื่อให้ไคลเอนต์ OpenClaw
  รุ่นเก่ายังคงทำงานได้
- เส้นทางนี้คงไว้เฉพาะ ZIP เท่านั้น และไม่สตรีมไฟล์ ClawPack `.tgz`
- การตอบกลับมีเฮดเดอร์ `ETag`, `Digest`, `X-ClawHub-Artifact-Type` และ
  `X-ClawHub-Artifact-Sha256` สำหรับการตรวจสอบความถูกต้องของตัวแก้ไข
- เมทาดาทาที่มีเฉพาะในรีจิสทรีจะไม่ถูกแทรกเข้าไปในอาร์ไคฟ์ที่ดาวน์โหลด
- การสแกน VirusTotal ที่ค้างอยู่จะไม่บล็อกการดาวน์โหลด; รีลีสที่เป็นอันตรายส่งคืน `403`
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะเป็นเจ้าของ

### `GET /api/npm/{package}`

ส่งคืน packument ที่เข้ากันได้กับ npm สำหรับเวอร์ชันแพ็กเกจที่มี ClawPack เป็นแบ็กเอนด์

หมายเหตุ:

- แสดงเฉพาะเวอร์ชันที่อัปโหลดทาร์บอล ClawPack npm-pack แล้ว
- เวอร์ชันรุ่นเก่าที่มีเฉพาะ ZIP จะถูกละไว้โดยตั้งใจ
- `dist.tarball`, `dist.integrity` และ `dist.shasum` ใช้ฟิลด์ที่เข้ากันได้กับ npm
  เพื่อให้ผู้ใช้สามารถชี้ npm ไปยังมิเรอร์ได้หากต้องการ
- packument ของแพ็กเกจแบบมี scope รองรับทั้ง `/api/npm/@scope/name` และพาธคำขอ
  `/api/npm/@scope%2Fname` ที่ npm เข้ารหัสไว้

### `GET /api/npm/{package}/-/{tarball}.tgz`

สตรีมไบต์ทาร์บอล ClawPack ที่อัปโหลดไว้ตรงตามต้นฉบับสำหรับไคลเอนต์มิเรอร์ npm

หมายเหตุ:

- ใช้บัคเก็ตอัตราการดาวน์โหลด
- เฮดเดอร์ดาวน์โหลดมี ClawHub SHA-256 พร้อมเมทาดาทา npm integrity/shasum
- การตรวจสอบการกลั่นกรองและการเข้าถึงแพ็กเกจส่วนตัวยังคงมีผล

### `GET /api/v1/resolve`

CLI ใช้เพื่อแมปลายนิ้วมือในเครื่องกับเวอร์ชันที่รู้จัก

พารามิเตอร์คิวรี:

- `slug` (บังคับ)
- `hash` (บังคับ): sha256 ฐานสิบหก 64 อักขระของลายนิ้วมือบันเดิล

การตอบกลับ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ดาวน์โหลด ZIP เวอร์ชัน skill ที่โฮสต์ไว้ หรือส่งคืนการส่งต่อซอร์ส GitHub สำหรับ
skill ปัจจุบันที่มี GitHub เป็นแบ็กเอนด์ซึ่งมีผลสแกน `clean` หรือ `suspicious` และไม่มี
เวอร์ชันที่โฮสต์ไว้

พารามิเตอร์คิวรี:

- `slug` (บังคับ)
- `version` (ไม่บังคับ): สตริง semver
- `tag` (ไม่บังคับ): ชื่อแท็ก (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- เวอร์ชันที่ถูกลบแบบกู้คืนได้ส่งคืน `410`
- การส่งต่อ skill ที่มี GitHub เป็นแบ็กเอนด์จะไม่พร็อกซีหรือมิเรอร์ไบต์ การตอบกลับ JSON
  มี `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  และ `archiveUrl`; สถานะการสแกน/ปัจจุบันเป็นเกตและไม่ได้รวมเป็นเมทาดาทาเพย์โหลดสำเร็จ
- สถิติการดาวน์โหลดนับเป็นตัวตนที่ไม่ซ้ำต่อวัน UTC (`userId` เมื่อโทเค็น API ถูกต้อง มิฉะนั้นใช้ IP)

## จุดปลายทางการยืนยันตัวตน (โทเค็น Bearer)

ทุกจุดปลายทางต้องมี:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

ตรวจสอบโทเค็นและส่งคืน handle ของผู้ใช้

### `POST /api/v1/skills`

เผยแพร่เวอร์ชันใหม่

- แนะนำ: `multipart/form-data` พร้อม JSON `payload` + บล็อบ `files[]`
- รองรับ body แบบ JSON ที่มี `files` (อิงตาม storageId) ด้วย
- ฟิลด์เพย์โหลดไม่บังคับ: `ownerHandle` เมื่อมี ฟิลด์นี้ API จะแก้ค่า
  ผู้เผยแพร่ฝั่งเซิร์ฟเวอร์และกำหนดให้ผู้กระทำมีสิทธิ์เข้าถึงผู้เผยแพร่
- ฟิลด์เพย์โหลดไม่บังคับ: `migrateOwner` เมื่อเป็น `true` พร้อม `ownerHandle`
  skill ที่มีอยู่สามารถย้ายไปยังเจ้าของนั้นได้ หากผู้กระทำเป็นแอดมิน/เจ้าของทั้งใน
  ผู้เผยแพร่ปัจจุบันและผู้เผยแพร่เป้าหมาย หากไม่มีการเลือกใช้นี้ การเปลี่ยนเจ้าของจะ
  ถูกปฏิเสธ

### `POST /api/v1/packages`

เผยแพร่รีลีส code-plugin หรือ bundle-plugin

- ต้องใช้การยืนยันตัวตนด้วยโทเค็น Bearer
- ต้องใช้ `multipart/form-data`
- ฟิลด์ฟอร์มที่อนุญาตคือ `payload`, บล็อบ `files` ซ้ำหลายรายการ หรือการอ้างอิงทาร์บอล
  `clawpack` หนึ่งรายการ `clawpack` อาจเป็นบล็อบ `.tgz` หรือ storage id ที่ส่งคืนโดย
  โฟลว์ upload-url การเผยแพร่ด้วย storage-id ที่จัดเตรียมไว้ต้องรวม
  `clawpackUploadTicket` ที่ส่งคืนมากับ URL อัปโหลดนั้นด้วย
- ใช้ `files` หรือ `clawpack` อย่างใดอย่างหนึ่งเท่านั้น ห้ามใช้ทั้งสองอย่างในคำขอเดียวกัน
- body แบบ JSON และเมทาดาทา `payload.files` / `payload.artifact`
  ที่ผู้เรียกส่งมาเองจะถูกปฏิเสธ
- คำขอเผยแพร่ multipart โดยตรงจำกัดไว้ที่ 18MB ทาร์บอล ClawPack อาจใช้
  โฟลว์ upload-url ได้จนถึงขีดจำกัดทาร์บอล 120MB
- ฟิลด์เพย์โหลดไม่บังคับ: `ownerHandle` เมื่อมี เฉพาะแอดมินเท่านั้นที่เผยแพร่แทนเจ้าของนั้นได้

จุดสำคัญในการตรวจสอบความถูกต้อง:

- `family` ต้องเป็น `code-plugin` หรือ `bundle-plugin`
- แพ็กเกจ Plugin ต้องมี `openclaw.plugin.json` การอัปโหลด ClawPack `.tgz` ต้อง
  มีไฟล์นี้ที่ `package/openclaw.plugin.json`
- Code plugin ต้องมี `package.json`, เมทาดาทารีโพซอร์ส, เมทาดาทาคอมมิตซอร์ส,
  เมทาดาทาสคีมาการกำหนดค่า, `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion`
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมทาดาทาไม่บังคับ
- เฉพาะผู้เผยแพร่ org `openclaw` และผู้เผยแพร่ส่วนบุคคลของสมาชิก org `openclaw`
  ปัจจุบันเท่านั้นที่เผยแพร่ไปยังช่องทาง `official` ได้
- การเผยแพร่แทนผู้อื่นยังคงตรวจสอบสิทธิ์ใช้งานช่องทาง official กับบัญชีเจ้าของเป้าหมาย

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

ลบแบบกู้คืนได้ / กู้คืน skill (เจ้าของ ผู้ดูแล หรือแอดมิน)

body JSON ไม่บังคับ:

```json
{ "reason": "Held for moderation pending legal review." }
```

เมื่อมี `reason` จะถูกเก็บเป็นบันทึกการกลั่นกรอง skill และคัดลอกเข้าไปในบันทึกการตรวจสอบ
การลบแบบกู้คืนได้ที่เริ่มโดยเจ้าของจะสงวน slug ไว้ 30 วัน จากนั้นผู้เผยแพร่รายอื่นจึงอ้างสิทธิ์
slug ได้ การตอบกลับการลบจะมี `slugReservedUntil` เมื่อการหมดอายุนี้มีผล
การซ่อนโดยผู้ดูแล/แอดมินและการลบเพื่อความปลอดภัยจะไม่หมดอายุในลักษณะนี้

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

สำหรับแอดมินเท่านั้น รับประกันว่าผู้เผยแพร่ org มีอยู่สำหรับ handle หาก handle ยังชี้ไปที่
ผู้ใช้ร่วมรุ่นเก่า/ผู้เผยแพร่ส่วนบุคคล จุดปลายทางจะย้ายไปเป็นผู้เผยแพร่ org ก่อน
สำหรับ org ที่สร้างใหม่ ให้ระบุ `memberHandle`; แอดมินที่ดำเนินการจะไม่ถูกเพิ่มเป็นสมาชิก
`memberRole` มีค่าเริ่มต้นเป็น `owner`

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- การตอบกลับ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

การสร้างผู้เผยแพร่ org แบบบริการตนเองที่ยืนยันตัวตนแล้ว สร้างผู้เผยแพร่ org ใหม่และเพิ่ม
ผู้เรียกเป็นเจ้าของ จุดปลายทางนี้จะไม่ย้าย handle ผู้ใช้/ส่วนบุคคลที่มีอยู่ และจะ
ไม่ทำเครื่องหมายผู้เผยแพร่ว่าเชื่อถือได้/official

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- การตอบกลับ: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- ส่งคืน `409` เมื่อ handle ถูกใช้โดยผู้เผยแพร่ ผู้ใช้ หรือผู้เผยแพร่ส่วนบุคคลแล้ว

### `POST /api/v1/users/reserve`

สำหรับแอดมินเท่านั้น สงวน slug รากและชื่อแพ็กเกจให้เจ้าของที่ชอบธรรมโดยไม่เผยแพร่
รีลีส ชื่อแพ็กเกจจะกลายเป็นแพ็กเกจตัวยึดตำแหน่งส่วนตัวที่ไม่มีแถวรีลีส เพื่อให้เจ้าของเดิม
เผยแพร่รีลีส code-plugin หรือ bundle-plugin จริงลงในชื่อนั้นได้ภายหลัง

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- การตอบกลับ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

สำหรับแอดมินเท่านั้น กู้คืนผู้เผยแพร่ส่วนบุคคลสำหรับ GitHub OAuth principal ทดแทนที่ผ่านการยืนยัน
โดยไม่แก้ไขแถวบัญชี Convex Auth คำขอต้องระบุ id บัญชีผู้ให้บริการ GitHub
ที่เปลี่ยนไม่ได้ทั้งสองรายการ; handle ที่เปลี่ยนได้ใช้เป็นตัวป้องกันสำหรับผู้ปฏิบัติงานเท่านั้น

ปลายทางมีค่าเริ่มต้นเป็น dry-run การใช้การกู้คืนต้องมี `dryRun: false` และ
`confirmIdentityVerified: true` หลังจากเจ้าหน้าที่ตรวจสอบความต่อเนื่องระหว่าง
GitHub principals ทั้งสองอย่างอิสระแล้ว การกู้คืนจะล้มเหลวแบบปิดเมื่อผู้ใช้ปลายทางมี
publisher ส่วนตัวปัจจุบันที่มี skills, packages หรือ GitHub skill sources
การกู้คืนยังย้ายฟิลด์ `ownerUserId` แบบเดิมสำหรับ skills ของ publisher ที่กู้คืน,
skill slug aliases, packages, package inspector warnings และแถว derived search digest เพื่อให้
เส้นทาง direct-owner สอดคล้องกับ authority ของ publisher ใหม่ การจอง protected-handle
ที่ยังใช้งานอยู่สำหรับ handle ที่กู้คืนจะถูกกำหนดใหม่ให้ผู้ใช้ทดแทนด้วย เพื่อให้การ
ซิงโครไนซ์โปรไฟล์ภายหลังไม่สามารถกู้คืน authority ที่แข่งขันกันของผู้ใช้เดิมได้ แต่ละตารางหลักถูกจำกัดไว้ที่
100 แถวต่อ apply transaction; การกู้คืนขนาดใหญ่กว่านี้ต้องใช้ resumable owner migration ก่อน
GitHub skill sources มีขอบเขตตาม publisher และถูกรายงานว่าตรวจสอบแล้วแทนที่จะถูกเขียนใหม่

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

- ทั้งสองปลายทางต้องใช้ API token auth และทำงานได้เฉพาะสำหรับเจ้าของ skill เท่านั้น
- `rename` เก็บ slug ก่อนหน้าไว้เป็น redirect alias
- `merge` ซ่อนรายการต้นทางและ redirect slug ต้นทางไปยังรายการเป้าหมาย

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

แบนผู้ใช้และลบ skills ที่เป็นเจ้าของแบบ hard-delete (เฉพาะ moderator/admin)

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

ยกเลิกแบนผู้ใช้และกู้คืน skills ที่มีสิทธิ์ (เฉพาะ admin)

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

เปลี่ยนเหตุผลที่จัดเก็บไว้สำหรับการแบนที่มีอยู่โดยไม่ยกเลิกแบนหรือกู้คืน
เนื้อหา (เฉพาะ admin) ค่าเริ่มต้นเป็น dry-run เว้นแต่ `dryRun` จะเป็น `false`

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

เปลี่ยนบทบาทของผู้ใช้ (เฉพาะ admin)

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

Query params:

- `q` (ไม่บังคับ): คำค้นหา
- `query` (ไม่บังคับ): alias สำหรับ `q`
- `limit` (ไม่บังคับ): ผลลัพธ์สูงสุด (ค่าเริ่มต้น 20, สูงสุด 200)

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

เพิ่ม/ลบดาว (ไฮไลต์) ทั้งสองปลายทางเป็น idempotent

Responses:

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

ดู `DEPRECATIONS.md` สำหรับแผนการนำออก

`POST /api/cli/upload-url` ส่งคืน `uploadUrl` และ `uploadTicket` Package
publishes ที่ stage tarball ของ ClawPack ต้องส่ง storage id ที่ได้เป็น
`clawpack` และ ticket ที่ส่งคืนเป็น `clawpackUploadTicket`

## การค้นพบ registry (`/.well-known/clawhub.json`)

CLI สามารถค้นพบการตั้งค่า registry/auth จากไซต์ได้:

- `/.well-known/clawhub.json` (JSON, แนะนำ)
- `/.well-known/clawdhub.json` (แบบเดิม)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

หากคุณ self-host ให้ serve ไฟล์นี้ (หรือตั้งค่า `CLAWHUB_REGISTRY` อย่างชัดเจน; `CLAWDHUB_REGISTRY` แบบเดิม)
