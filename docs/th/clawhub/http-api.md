---
read_when:
    - การเพิ่ม/การเปลี่ยนแปลง endpoints
    - การดีบักคำขอ CLI ↔ รีจิสทรี
summary: เอกสารอ้างอิง HTTP API (สาธารณะ + endpoint ของ CLI + การยืนยันตัวตน)
x-i18n:
    generated_at: "2026-07-01T13:27:06Z"
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

## การใช้แค็ตตาล็อกสาธารณะซ้ำ

ไดเรกทอรีของบุคคลที่สามอาจใช้ปลายทางอ่านสาธารณะเพื่อแสดงรายการหรือค้นหา Skills ของ ClawHub ได้ โปรดแคชผลลัพธ์ เคารพ `429`/`Retry-After` ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ต้นทางที่เป็นทางการ (`https://clawhub.ai/<owner>/skills/<slug>`) และหลีกเลี่ยงการสื่อเป็นนัยว่า ClawHub รับรองไซต์ของบุคคลที่สามนั้น อย่าพยายามมิเรอร์เนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกด้วยการควบคุมดูแลออกนอกพื้นผิว API สาธารณะ

ทางลัด slug บนเว็บจะแก้ไขข้ามตระกูลรีจิสทรีได้ แต่ไคลเอนต์ API ควรใช้
URL ต้นทางที่เป็นทางการซึ่งส่งกลับจากปลายทางอ่าน แทนการประกอบลำดับความสำคัญ
ของเส้นทางขึ้นมาใหม่

## ขีดจำกัดอัตรา

รูปแบบการบังคับใช้:

- คำขอแบบไม่ระบุตัวตน: บังคับใช้ต่อ IP
- คำขอที่ผ่านการยืนยันตัวตน (โทเค็น Bearer ที่ถูกต้อง): บังคับใช้ต่อบักเก็ตผู้ใช้
- หากโทเค็นหายไป/ไม่ถูกต้อง พฤติกรรมจะย้อนกลับไปใช้การบังคับใช้ตาม IP
- ปลายทางเขียนที่ผ่านการยืนยันตัวตนไม่ควรส่งคืน `Unauthorized` เปล่า ๆ เมื่อ
  เซิร์ฟเวอร์รู้เหตุผล โทเค็นที่หายไป โทเค็นที่ไม่ถูกต้อง/ถูกเพิกถอน และ
  บัญชีที่ถูกลบ/ถูกแบน/ถูกปิดใช้งานควรได้รับข้อความที่ดำเนินการต่อได้ เพื่อให้ไคลเอนต์
  CLI บอกผู้ใช้ได้ว่าอะไรบล็อกพวกเขา

- อ่าน: 3000/นาที ต่อ IP, 12000/นาที ต่อคีย์
- เขียน: 300/นาที ต่อ IP, 3000/นาที ต่อคีย์
- ดาวน์โหลด: 1200/นาที ต่อ IP, 6000/นาที ต่อคีย์ (ปลายทางดาวน์โหลด)

เฮดเดอร์:

- ความเข้ากันได้แบบเดิม: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- แบบมาตรฐาน: `RateLimit-Limit`, `RateLimit-Reset`
- เมื่อเป็น `429`: `X-RateLimit-Remaining: 0` และ `RateLimit-Remaining: 0`
- เมื่อเป็น `429`: `Retry-After`

ความหมายของเฮดเดอร์:

- `X-RateLimit-Reset`: วินาที epoch ของ Unix แบบสัมบูรณ์
- `RateLimit-Reset`: จำนวนวินาทีจนกว่าจะรีเซ็ต (ดีเลย์)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: งบประมาณที่เหลืออยู่แบบแน่นอนเมื่อมีอยู่
  คำขอที่สำเร็จแบบแบ่ง shard จะละเว้นเฮดเดอร์นี้ แทนการส่งคืนค่าทั่วทั้งระบบแบบประมาณ
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

คำแนะนำสำหรับไคลเอนต์:

- หากมี `Retry-After` ให้รอตามจำนวนวินาทีนั้นก่อนลองใหม่
- ใช้การถอยกลับแบบมี jitter เพื่อหลีกเลี่ยงการลองใหม่พร้อมกัน
- หากไม่มี `Retry-After` ให้ย้อนกลับไปใช้ `RateLimit-Reset` (หรือคำนวณจาก `X-RateLimit-Reset`)

แหล่งที่มาของ IP:

- ใช้เฮดเดอร์ IP ไคลเอนต์ที่เชื่อถือได้ รวมถึง `cf-connecting-ip` เฉพาะเมื่อ
  การปรับใช้เปิดใช้เฮดเดอร์ที่ส่งต่อแบบเชื่อถือได้อย่างชัดเจน
- ClawHub ใช้เฮดเดอร์การส่งต่อที่เชื่อถือได้เพื่อระบุ IP ไคลเอนต์ที่ edge
- หากไม่มี IP ไคลเอนต์ที่เชื่อถือได้ คำขอแบบไม่ระบุตัวตนจะใช้บักเก็ตสำรอง
  ที่กำหนดขอบเขตเฉพาะตามชนิดของขีดจำกัดอัตรา บักเก็ตสำรองเหล่านี้ไม่รวม
  พาธ, slug, ชื่อแพ็กเกจ, เวอร์ชัน, สตริงคิวรี หรือพารามิเตอร์อาร์ติแฟกต์อื่น ๆ
  ที่ผู้เรียกส่งมา

## การตอบกลับข้อผิดพลาด

การตอบกลับข้อผิดพลาด v1 สาธารณะเป็นข้อความธรรมดาพร้อม `content-type: text/plain; charset=utf-8`
ซึ่งรวมถึงความล้มเหลวในการตรวจสอบความถูกต้อง (`400`), ทรัพยากรสาธารณะที่หายไป (`404`), ความล้มเหลวด้านการยืนยันตัวตนและ
สิทธิ์ (`401`/`403`), ขีดจำกัดอัตรา (`429`) และการดาวน์โหลดที่ถูกบล็อก ไคลเอนต์
ควรอ่านข้อความเนื้อหาการตอบกลับเป็นสตริงที่มนุษย์อ่านได้ พารามิเตอร์คิวรีที่ไม่รู้จักจะถูก
ละเว้นเพื่อความเข้ากันได้ แต่พารามิเตอร์คิวรีที่รู้จักและมีค่าไม่ถูกต้องจะส่งคืน
`400`

## ปลายทางสาธารณะ (ไม่ต้องยืนยันตัวตน)

### `GET /api/v1/search`

พารามิเตอร์คิวรี:

- `q` (จำเป็น): สตริงคิวรี
- `limit` (ไม่บังคับ): จำนวนเต็ม
- `highlightedOnly` (ไม่บังคับ): `true` เพื่อกรองให้เหลือเฉพาะ Skills ที่ไฮไลต์
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

- ผลลัพธ์จะถูกส่งคืนตามลำดับความเกี่ยวข้อง (ความคล้ายคลึงของ embedding + การเสริมคะแนนโทเค็น slug/name ที่ตรงแบบเป๊ะ + ค่าน้ำหนักความนิยมเล็กน้อย)
- ความเกี่ยวข้องสำคัญกว่าความนิยม การจับคู่โทเค็น slug หรือชื่อที่แสดงแบบแม่นยำอาจมีอันดับสูงกว่าการจับคู่ที่หลวมกว่าซึ่งมี engagement สูงกว่ามาก
- ข้อความ ASCII จะถูกแยกโทเค็นตามขอบเขตคำและเครื่องหมายวรรคตอน ตัวอย่างเช่น `personal-map` มีโทเค็น `map` แบบแยกเดี่ยว ขณะที่ `amap-jsapi-skill` มี `amap`, `jsapi` และ `skill`; ดังนั้นการค้นหา `map` จะทำให้ `personal-map` ได้การจับคู่คำศัพท์ที่แรงกว่า `amap-jsapi-skill`
- ความนิยมถูกปรับสเกลแบบลอการิทึมและมีเพดาน Skills ที่มี engagement สูงอาจได้อันดับต่ำกว่าเมื่อข้อความคิวรีเป็นการจับคู่ที่อ่อนกว่า
- สถานะการควบคุมดูแลที่น่าสงสัยหรือซ่อนอยู่สามารถนำ Skill ออกจากการค้นหาสาธารณะได้ ขึ้นอยู่กับตัวกรองของผู้เรียกและสถานะการควบคุมดูแลปัจจุบัน

คำแนะนำด้านการค้นพบสำหรับผู้เผยแพร่:

- ใส่คำที่ผู้ใช้จะค้นหาจริง ๆ ไว้ในชื่อที่แสดง สรุป และแท็ก ใช้โทเค็น slug แบบแยกเดี่ยวเฉพาะเมื่อมันเป็นตัวตนที่เสถียรซึ่งคุณต้องการเก็บไว้ด้วย
- อย่าเปลี่ยนชื่อ slug เพียงเพื่อไล่ตามคิวรีเดียว เว้นแต่ว่า slug ใหม่จะเป็นชื่อ canonical ระยะยาวที่ดีกว่า slug เก่าจะกลายเป็น alias สำหรับ redirect แต่ URL canonical, slug ที่แสดง และ digest การค้นหาในอนาคตจะใช้ slug ใหม่
- alias จากการเปลี่ยนชื่อจะรักษาการ resolve สำหรับ URL เก่าและการติดตั้งที่ resolve ผ่านรีจิสทรี แต่การจัดอันดับการค้นหาจะอิงตามเมทาดาทา Skill แบบ canonical หลังจากการเปลี่ยนชื่อถูกทำดัชนีแล้ว สถิติที่มีอยู่จะยังอยู่กับ Skill
- หาก Skill หายไปโดยไม่คาดคิด ให้ตรวจสอบสถานะการควบคุมดูแลก่อนด้วย `clawhub inspect @owner/slug` ขณะเข้าสู่ระบบ ก่อนเปลี่ยนเมทาดาทาที่เกี่ยวข้องกับการจัดอันดับ

### `GET /api/v1/skills`

พารามิเตอร์คิวรี:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–200)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าสำหรับการเรียงลำดับใด ๆ ที่ไม่ใช่ `trending`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), alias การติดตั้งแบบเดิม `installsCurrent`/`installs`/`installsAllTime` map ไปยัง `downloads`, `trending`
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias แบบเดิมสำหรับ `nonSuspiciousOnly`

ค่า `sort` ที่ไม่ถูกต้องจะส่งคืน `400`

หมายเหตุ:

- `recommended` ใช้สัญญาณ engagement และความใหม่
- `trending` จัดอันดับตามการติดตั้งใน 7 วันที่ผ่านมา (อิง telemetry)
- `createdAt` เสถียรสำหรับการ crawl Skills ใหม่; `updated` เปลี่ยนเมื่อ Skills ที่มีอยู่ถูกเผยแพร่ซ้ำ
- เมื่อ `nonSuspiciousOnly=true` การเรียงลำดับแบบใช้เคอร์เซอร์อาจส่งคืนรายการน้อยกว่า `limit` ในหนึ่งหน้า เพราะ Skills ที่น่าสงสัยถูกกรองหลังการดึงหน้า
- ใช้ `nextCursor` เพื่อแบ่งหน้าต่อเมื่อมีอยู่ หน้าสั้นไม่ได้หมายความว่าสิ้นสุดผลลัพธ์โดยตัวมันเอง

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

- slug เก่าที่สร้างโดยโฟลว์การเปลี่ยนชื่อ/รวมเจ้าของจะ resolve ไปยัง Skill แบบ canonical
- `metadata.os`: ข้อจำกัด OS ที่ประกาศใน frontmatter ของ Skill (เช่น `["macos"]`, `["linux"]`) `null` หากไม่ได้ประกาศ
- `metadata.systems`: เป้าหมายระบบ Nix (เช่น `["aarch64-darwin", "x86_64-linux"]`) `null` หากไม่ได้ประกาศ
- `metadata` เป็น `null` หาก Skill ไม่มีเมทาดาทาแพลตฟอร์ม
- `moderation` จะรวมไว้เฉพาะเมื่อ Skill ถูก flag หรือเจ้าของกำลังดูอยู่

### `GET /api/v1/skills/{slug}/moderation`

ส่งคืนสถานะการควบคุมดูแลแบบมีโครงสร้าง

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

- เจ้าของและผู้ควบคุมดูแลสามารถเข้าถึงรายละเอียดการควบคุมดูแลสำหรับ Skills ที่ซ่อนอยู่ได้
- ผู้เรียกสาธารณะจะได้รับ `200` เฉพาะสำหรับ Skills ที่มองเห็นได้และถูก flag แล้ว
- หลักฐานจะถูก redact สำหรับผู้เรียกสาธารณะ และจะรวม snippet ดิบเฉพาะสำหรับเจ้าของ/ผู้ควบคุมดูแลเท่านั้น

### `POST /api/v1/skills/{slug}/report`

รายงาน Skill เพื่อให้ผู้ควบคุมดูแลตรวจสอบ รายงานอยู่ในระดับ Skill และอาจลิงก์
กับเวอร์ชันได้ และจะป้อนเข้าไปยังคิวรายงาน Skill

การยืนยันตัวตน:

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

ปลายทางผู้ควบคุมดูแล/ผู้ดูแลระบบสำหรับรับรายงาน Skill

พารามิเตอร์คิวรี:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `confirmed`, `dismissed` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-200)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

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

ปลายทางผู้ควบคุมดูแล/ผู้ดูแลระบบสำหรับแก้ไขหรือเปิดรายงาน Skill อีกครั้ง

คำขอ:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` จำเป็นสำหรับ `confirmed` และ `dismissed`; อาจละเว้นได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "hide"` พร้อมรายงานที่ผ่านการ triage แล้ว
เพื่อซ่อน Skill ใน workflow เดียวกันที่ตรวจสอบย้อนหลังได้

### `GET /api/v1/skills/{slug}/versions`

พารามิเตอร์คิวรี:

- `limit` (ไม่บังคับ): จำนวนเต็ม
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

### `GET /api/v1/skills/{slug}/versions/{version}`

ส่งคืนเมทาดาทาเวอร์ชัน + รายการไฟล์

- `version.security` รวมสถานะการตรวจสอบการสแกนที่ทำให้เป็นมาตรฐานและรายละเอียดสแกนเนอร์
  (VirusTotal + LLM) เมื่อมี

### `GET /api/v1/skills/{slug}/scan`

ส่งคืนรายละเอียดการตรวจสอบการสแกนความปลอดภัยสำหรับเวอร์ชัน Skill

พารามิเตอร์คิวรี:

- `version` (ไม่บังคับ): สตริงเวอร์ชันเฉพาะ
- `tag` (ไม่บังคับ): resolve เวอร์ชันที่ติดแท็ก (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- รวมสถานะการยืนยันที่ทำให้เป็นมาตรฐานแล้ว พร้อมรายละเอียดเฉพาะของสแกนเนอร์
- `security.hasScanResult` เป็น `true` เฉพาะเมื่อสแกนเนอร์สร้างคำตัดสินที่แน่ชัด (`clean`, `suspicious` หรือ `malicious`)
- `moderation` คือสแนปช็อตการกลั่นกรองระดับสกิลปัจจุบันที่ได้มาจากเวอร์ชันล่าสุด
- เมื่อคิวรีเวอร์ชันในอดีต ให้ตรวจสอบ `moderation.matchesRequestedVersion` และ `moderation.sourceVersion` ก่อนถือว่า `moderation` และ `security` อยู่ในบริบทเวอร์ชันเดียวกัน

### `POST /api/v1/skills/-/scan`

ปลายทางส่งที่ต้องยืนยันตัวตนสำหรับงาน ClawScan ใหม่

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

- เพย์โหลดคำขอสแกนและรายงานที่ดาวน์โหลดได้จะหมดอายุจากที่เก็บคำขอสแกนหลังพ้นช่วงเวลาการเก็บรักษา
- การสแกนที่เผยแพร่แล้วต้องมีสิทธิ์การจัดการของเจ้าของ/ผู้เผยแพร่ หรืออำนาจผู้ดูแลแพลตฟอร์ม/ผู้ดูแลระบบ
- การสแกนที่เผยแพร่แล้วจะเขียนกลับเฉพาะเมื่อ `update: true` และการสแกนเสร็จสมบูรณ์สำเร็จ
- การตอบกลับคือ `202` พร้อม `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`
- งานสแกนเป็นแบบอะซิงโครนัส คำขอสแกนด้วยตนเองจะได้รับลำดับความสำคัญก่อนงานเผยแพร่/เติมย้อนหลังปกติ แต่การเสร็จสมบูรณ์ยังคงขึ้นอยู่กับความพร้อมของเวิร์กเกอร์

### `GET /api/v1/skills/-/scan/{scanId}`

ปลายทางโพลล์ที่ต้องยืนยันตัวตนสำหรับการสแกนที่ส่งแล้ว

- ส่งคืนสถานะ queued/running/succeeded/failed
- ส่งคืน `queue.queuedAhead` และ `queue.position` ขณะอยู่ในคิว เพื่อให้ไคลเอนต์แสดงได้ว่ามีการสแกนด้วยตนเองแบบมีลำดับความสำคัญอยู่ข้างหน้าคำขอกี่รายการ คิวที่ใหญ่มากจะถูกจำกัดขอบเขตและรายงานพร้อม `queuedAheadIsEstimate: true`
- เมื่อพร้อมใช้งาน `report` จะมีส่วน `clawscan`, `skillspector`, `staticAnalysis` และ `virustotal`
- งานสแกนที่ล้มเหลวจะส่งคืน `status: "failed"` พร้อม `lastError`

### `GET /api/v1/skills/-/scan/{scanId}/download`

ปลายทางไฟล์เก็บถาวรรายงานที่ต้องยืนยันตัวตน

- ต้องเป็นการสแกนที่สำเร็จแล้ว การสแกนที่ยังไม่ถึงสถานะปลายทางจะส่งคืน `409`
- ส่งคืน ZIP ที่มี `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

ปลายทางไฟล์เก็บถาวรรายงานที่จัดเก็บไว้และต้องยืนยันตัวตนสำหรับเวอร์ชันที่ส่งแล้ว

- ต้องมีสิทธิ์การจัดการของเจ้าของ/ผู้เผยแพร่ต่อสกิลหรือ Plugin หรือมีอำนาจผู้ดูแลแพลตฟอร์ม/ผู้ดูแลระบบ
- ส่งคืนผลการสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งแบบตรงกันทุกประการ รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อนไว้
- `kind` มีค่าเริ่มต้นเป็น `skill`; ใช้ `kind=plugin` สำหรับการสแกน Plugin/แพ็กเกจ
- ส่งคืนรูปแบบ ZIP เดียวกับการดาวน์โหลดคำขอสแกน

### `POST /api/v1/skills/-/scan/batch`

เส้นทางสแกนซ้ำแบบแบตช์มาตรฐานสำหรับผู้ดูแลระบบเท่านั้น รับรูปแบบเพย์โหลดเดียวกับ `POST /api/v1/skills/-/rescan-batch` แบบเดิม

### `POST /api/v1/skills/-/scan/batch/status`

เส้นทางสถานะแบบแบตช์มาตรฐานสำหรับผู้ดูแลระบบเท่านั้น รับ `{ "jobIds": ["..."] }` และส่งคืนตัวนับรวมเดียวกับ `POST /api/v1/skills/-/rescan-batch/status` แบบเดิม

### `GET /api/v1/skills/{slug}/verify`

ส่งคืนเอนเวโลปการยืนยัน Skill Card ที่ `clawhub skill verify` ใช้

พารามิเตอร์คิวรี:

- `version` (ไม่บังคับ): สตริงเวอร์ชันที่เจาะจง
- `tag` (ไม่บังคับ): แก้ค่าเป็นเวอร์ชันที่ติดแท็กไว้ (เช่น `latest`)

หมายเหตุ:

- `ok` เป็น `true` เฉพาะเมื่อเวอร์ชันที่เลือกมี Skill Card ที่สร้างแล้ว ไม่ถูกการกลั่นกรองบล็อกเป็นมัลแวร์ และการยืนยัน ClawScan เป็น clean
- อัตลักษณ์สกิล อัตลักษณ์ผู้เผยแพร่ และเมทาดาทาเวอร์ชันที่เลือกเป็นฟิลด์ระดับบนสุดของเอนเวโลป (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) เพื่อให้ shell automation อ่านได้โดยไม่ต้องแกะแรปเปอร์ที่ซ้อนอยู่
- `security` คือคำตัดสิน ClawScan/ความปลอดภัยระดับบนสุด ระบบอัตโนมัติควรอิง `ok`, `decision`, `reasons` และ `security.status`
- `security.signals` มีหลักฐานสนับสนุนจากสแกนเนอร์ เช่น `staticScan`, `virusTotal` และ `skillSpector`
- `security.signals.dependencyRegistry` ยังคงไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่สแกนเนอร์ตรวจสอบการมีอยู่ของรีจิสทรี dependency ถูกเลิกใช้แล้ว และคีย์นี้เป็น `null` เสมอ
- `provenance` เป็น `server-resolved-github-import` เฉพาะเมื่อ ClawHub แก้ค่าและจัดเก็บ repo/ref/commit/path ของ GitHub ระหว่างการเผยแพร่หรือนำเข้า มิฉะนั้นจะเป็น `unavailable`

### `POST /api/v1/skills/-/security-verdicts`

ส่งคืนคำตัดสินด้านความปลอดภัยแบบย่อปัจจุบันสำหรับเวอร์ชันสกิลที่ตรงกันทุกประการ
ปลายทางคอลเลกชันนี้มีไว้สำหรับไคลเอนต์ที่รู้อยู่แล้วว่าต้องแสดงเวอร์ชันสกิล ClawHub ที่ติดตั้งใด เช่น OpenClaw Control UI

คำขอ:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

หมายเหตุ:

- `items` ต้องมีคู่ `{ slug, version }` ที่ไม่ซ้ำกัน 1-100 คู่
- ผลลัพธ์แยกตามแต่ละรายการ สกิลหรือเวอร์ชันหนึ่งที่หายไปจะไม่ทำให้การตอบกลับทั้งหมดล้มเหลว
- การตอบกลับมีเฉพาะความปลอดภัย ไม่รวมข้อมูล Skill Card, สถานะการ์ดที่สร้างแล้ว, รายการไฟล์ artifact หรือเพย์โหลดสแกนเนอร์โดยละเอียด
- `security.signals` มีเฉพาะหลักฐานสนับสนุนระดับสถานะ ใช้ `/scan` หรือหน้า security-audit ของ ClawHub สำหรับรายละเอียดสแกนเนอร์แบบเต็ม
- `security.signals.dependencyRegistry` ยังคงไว้เพื่อความเข้ากันได้ของการตอบกลับ v1 แต่สแกนเนอร์ตรวจสอบการมีอยู่ของรีจิสทรี dependency ถูกเลิกใช้แล้ว และคีย์นี้เป็น `null` เสมอ
- การไม่มี Skill Card ไม่มีผลต่อ `ok`, `decision` หรือ `reasons` ของปลายทางนี้ ไคลเอนต์ควรอ่าน `skill-card.md` ที่ติดตั้งไว้ในเครื่องเมื่อจำเป็นต้องใช้เนื้อหาการ์ด
- ใช้ `/verify` เมื่อคุณต้องการเอนเวโลปการยืนยัน Skill Card สำหรับสกิลเดียว, `/card` เมื่อคุณต้องการมาร์กดาวน์การ์ดที่สร้างแล้ว และ `/scan` เมื่อคุณต้องการข้อมูลสแกนเนอร์โดยละเอียด

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

ปลายทางแค็ตตาล็อกแบบรวมสำหรับ:

- skills
- code plugins
- bundle plugins

พารามิเตอร์คำขอ:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์แบ่งหน้า
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended`, `trending`, `downloads`, alias เดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอถูกจำกัดขอบเขตไว้ที่แพ็กเกจ Plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` หรือปลายทางแพ็กเกจที่มี
  `family=code-plugin`/`family=bundle-plugin`) หมวดหมู่ที่ควบคุมและ
  alias ตัวกรอง v1 เดิมมีเอกสารอยู่ใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` หรือ `sort` จะส่งคืน `400` พารามิเตอร์คำขอที่ไม่รู้จักจะถูกละเว้น
- `GET /api/v1/code-plugins` และ `GET /api/v1/bundle-plugins` ยังคงเป็น alias แบบ family คงที่
- รายการ Skill ยังคงอิงตามรีจิสทรี Skill และยังสามารถเผยแพร่ได้ผ่าน `POST /api/v1/skills` เท่านั้น
- `POST /api/v1/packages` ยังคงใช้สำหรับรีลีส code-plugin และ bundle-plugin เท่านั้น
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถเห็นแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดอยู่ในผลลัพธ์รายการ/การค้นหา
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ผ่านการยืนยันตัวตนอ่านได้

### `GET /api/v1/packages/search`

การค้นหาแค็ตตาล็อกแบบรวมใน Skills + แพ็กเกจ Plugin

พารามิเตอร์คำขอ:

- `q` (จำเป็น): สตริงคำค้นหา
- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอถูกจำกัดขอบเขตไว้ที่แพ็กเกจ Plugin หมวดหมู่ที่ควบคุมและ alias
  ตัวกรอง v1 เดิมมีเอกสารอยู่ใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured` หรือ
  `highlightedOnly` จะส่งคืน `400` พารามิเตอร์คำขอที่ไม่รู้จักจะถูกละเว้น
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถค้นหาแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดอยู่ได้
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ผ่านการยืนยันตัวตนอ่านได้

### `GET /api/v1/plugins`

การเรียกดูแค็ตตาล็อกเฉพาะ Plugin ครอบคลุมแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์คำขอ:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์แบ่งหน้า
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `recommended` (ค่าเริ่มต้น), `trending`, `downloads`, `updated`, alias เดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

alias ตัวกรอง v1 เดิมยังคงยอมรับบนปลายทางสำหรับอ่าน:

- `mcp-tooling`, `data` และ `automation` จะแปลงเป็น `tools`
- `observability` และ `deployment` จะแปลงเป็น `gateway`
- `dev-tools` จะแปลงเป็น `runtime`

`trending` เป็นลีดเดอร์บอร์ดการติดตั้ง/ดาวน์โหลดเจ็ดวัน และไม่ใช้ยอดรวมตลอดเวลา
บนปลายทางรวม `/api/v1/packages` จะใช้เฉพาะกับ Plugin; ใช้
`/api/v1/skills?sort=trending` สำหรับแค็ตตาล็อก Skill

alias เดิมไม่สามารถใช้เป็นค่าหมวดหมู่ที่จัดเก็บหรือที่ผู้เขียนประกาศได้

### `GET /api/v1/skills/export`

การส่งออก Skills สาธารณะล่าสุดแบบกลุ่มสำหรับการวิเคราะห์แบบออฟไลน์

การยืนยันตัวตน:

- ต้องใช้โทเค็น API

พารามิเตอร์คำขอ:

- `startDate` (จำเป็น): ขอบเขตล่างแบบ Unix มิลลิวินาทีสำหรับ `updatedAt` ของ Skill
- `endDate` (จำเป็น): ขอบเขตบนแบบ Unix มิลลิวินาทีสำหรับ `updatedAt` ของ Skill
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์แบ่งหน้าจากการตอบกลับก่อนหน้า

การตอบกลับ:

- Body: ไฟล์ ZIP archive
- Skill ที่ส่งออกแต่ละรายการมี root ที่ `{publisher}/{slug}/`
- Skills ที่โฮสต์ไว้จะรวมไฟล์เวอร์ชันล่าสุดที่จัดเก็บไว้ และถูกแสดงรายการใน
  `_manifest.json` พร้อม `sourceRef: "public-clawhub"`
- Skills ปัจจุบันที่อิง GitHub พร้อมการสแกน `clean` หรือ `suspicious` จะรวม
  `_source_handoff.json` พร้อม `sourceRef: "public-github"`, repo, commit, path,
  content hash และ URL archive โดยจะไม่รวมไฟล์ซอร์สที่โฮสต์บน ClawHub
- Skill แต่ละรายการจะรวม `_export_skill_meta.json`
- `_manifest.json` จะรวมอยู่ที่ root ของ ZIP เสมอ
- `_errors.json` จะถูกรวมไว้เมื่อไม่สามารถ
  ส่งออก Skills หรือไฟล์บางรายการได้

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

พารามิเตอร์คิวรี:

- `startDate` (จำเป็น): ขอบเขตล่างแบบมิลลิวินาที Unix สำหรับ `updatedAt` ของ Plugin
- `endDate` (จำเป็น): ขอบเขตบนแบบมิลลิวินาที Unix สำหรับ `updatedAt` ของ Plugin
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าจากการตอบกลับก่อนหน้า
- `family` (ไม่บังคับ): `code-plugin` หรือ `bundle-plugin` หากละไว้จะหมายถึงทั้งสอง
  ตระกูล Plugin

การตอบกลับ:

- เนื้อหา: ไฟล์ ZIP archive
- Plugin ที่ส่งออกแต่ละรายการจะมีรากอยู่ที่ `{family}/{packageName}/`
- Plugin ที่ส่งออกแต่ละรายการจะรวมไฟล์ที่จัดเก็บไว้ของรีลีสล่าสุด
- เมทาดาทาการส่งออกต่อ Plugin จะถูกจัดเก็บที่
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

พารามิเตอร์คิวรี:

- `q` (จำเป็น): สตริงคิวรี
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

หมายเหตุ:

- นามแฝงตัวกรอง v1 แบบเดิมที่บันทึกไว้ภายใต้ `GET /api/v1/plugins` ก็ได้รับการยอมรับเช่นกัน
- การกรองตามหมวดหมู่เป็นตัวกรอง API จริงที่รองรับด้วยแถวไดเจสต์หมวดหมู่ Plugin
  ไม่ใช่การเขียนคิวรีค้นหาใหม่
- ผลลัพธ์จะถูกส่งคืนตามลำดับความเกี่ยวข้อง และปัจจุบันยังไม่มีการแบ่งหน้า
- ตัวควบคุมการเรียงลำดับของ UI เบราว์เซอร์สำหรับการค้นหา Plugin จะจัดลำดับผลลัพธ์ความเกี่ยวข้องที่โหลดมาใหม่
  ให้ตรงกับพฤติกรรมการเรียกดู `/skills` ปัจจุบัน

### `GET /api/v1/packages/{name}`

ส่งคืนเมทาดาทารายละเอียดแพ็กเกจ

หมายเหตุ:

- Skills สามารถ resolve ผ่าน route นี้ในแคตตาล็อกรวมได้เช่นกัน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่าน publisher เจ้าของได้

### `DELETE /api/v1/packages/{name}`

ลบแพ็กเกจและรีลีสทั้งหมดแบบ soft-delete

หมายเหตุ:

- ต้องใช้โทเค็น API สำหรับเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแล publisher ขององค์กร,
  ผู้ควบคุมแพลตฟอร์ม หรือผู้ดูแลแพลตฟอร์ม

### `GET /api/v1/packages/{name}/versions`

ส่งคืนประวัติเวอร์ชัน

พารามิเตอร์คิวรี:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

หมายเหตุ:

- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่าน publisher เจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}`

ส่งคืนแพ็กเกจหนึ่งเวอร์ชัน รวมถึงเมทาดาทาไฟล์ ความเข้ากันได้
การตรวจสอบ เมทาดาทา artifact และข้อมูลการสแกน

หมายเหตุ:

- `version.artifact.kind` คือ `legacy-zip` สำหรับ package archive แบบเก่า หรือ
  `npm-pack` สำหรับรีลีสที่รองรับด้วย ClawPack
- รีลีส ClawPack รวมฟิลด์ `npmIntegrity`, `npmShasum` และ
  `npmTarballName` ที่เข้ากันได้กับ npm
- `version.sha256hash` เป็นเมทาดาทาความเข้ากันได้ที่เลิกใช้แล้วสำหรับไคลเอนต์เก่า โดย
  hash ไบต์ ZIP ตรงตามที่ส่งคืนโดย `/api/v1/packages/{name}/download`
  ไคลเอนต์สมัยใหม่ควรใช้ `version.artifact.sha256` ซึ่งระบุ
  artifact รีลีสที่เป็น canonical
- `version.vtAnalysis`, `version.llmAnalysis` และ `version.staticScan` จะถูกรวมไว้
  เมื่อมีข้อมูลการสแกน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่าน publisher เจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}/security`

ส่งคืนสรุปความปลอดภัยและความน่าเชื่อถือของรีลีสแพ็กเกจที่ตรงกันสำหรับไคลเอนต์ติดตั้ง
นี่คือพื้นผิวการใช้งาน OpenClaw สาธารณะสำหรับตัดสินใจว่า
รีลีสที่ resolve แล้วสามารถติดตั้งได้หรือไม่

การยืนยันตัวตน:

- endpoint สำหรับอ่านสาธารณะ ไม่ต้องใช้โทเค็นของเจ้าของ, publisher, moderator หรือ admin

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
  รีลีสที่ตรงกันซึ่งถูกประเมิน
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` และ `release.npmTarballName` จะมีอยู่เมื่อทราบข้อมูลสำหรับ
  artifact ของรีลีส
- `trust.scanStatus` คือสถานะความน่าเชื่อถือที่มีผล ซึ่งได้มาจากข้อมูลนำเข้าของสแกนเนอร์
  และการ moderation รีลีสแบบแมนนวล
- `trust.moderationState` เป็น nullable โดยจะเป็น `null` เมื่อไม่มีการ
  moderation รีลีสแบบแมนนวล
- `trust.blockedFromDownload` คือสัญญาณบล็อกการติดตั้ง OpenClaw และ
  ไคลเอนต์ติดตั้งอื่นควรบล็อกการติดตั้งเมื่อค่านี้เป็น `true` แทนที่จะ
  คำนวณกฎการบล็อกจากฟิลด์สแกนเนอร์หรือ moderation อีกครั้ง
- `trust.reasons` คือรายการคำอธิบายสำหรับผู้ใช้และการตรวจสอบ audit รหัสเหตุผล
  เป็นสตริงที่เสถียรและกระชับ เช่น `manual:quarantined`, `scan:malicious`
  และ `package:malicious`
- `trust.pending` หมายถึงข้อมูลนำเข้าความน่าเชื่อถือหนึ่งรายการขึ้นไปยังรอให้เสร็จสิ้น
- `trust.stale` หมายถึงสรุปความน่าเชื่อถือถูกคำนวณจากข้อมูลนำเข้าที่ล้าสมัย และ
  ควรถูกถือว่าต้อง refresh ก่อนตัดสินใจอนุญาตด้วยความมั่นใจสูง

หมายเหตุ:

- endpoint นี้ระบุเวอร์ชันอย่างแม่นยำ ไคลเอนต์ควรเรียกใช้หลังจาก resolve
  เวอร์ชันแพ็กเกจที่ตั้งใจจะติดตั้ง ไม่ใช่เพียงหลังจากอ่าน
  เมทาดาทาแพ็กเกจล่าสุด
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่าน publisher เจ้าของได้
- endpoint นี้จงใจแคบกว่า endpoint moderation ของเจ้าของ/moderator
  โดยเปิดเผยการตัดสินใจติดตั้งและคำอธิบายสาธารณะ ไม่ใช่
  ตัวตนของผู้รายงาน เนื้อหารายงาน หลักฐานส่วนตัว หรือไทม์ไลน์การตรวจทานภายใน

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

ส่งคืนเมทาดาทา artifact resolver ที่ชัดเจนสำหรับเวอร์ชันแพ็กเกจ

หมายเหตุ:

- เวอร์ชันแพ็กเกจแบบเดิมส่งคืน artifact `legacy-zip` และ
  `downloadUrl` ของ ZIP แบบเดิม
- เวอร์ชัน ClawPack ส่งคืน artifact `npm-pack`, ฟิลด์ integrity ของ npm,
  `tarballUrl` และ URL ความเข้ากันได้ของ ZIP แบบเดิม
- นี่คือพื้นผิว resolver ของ OpenClaw โดยหลีกเลี่ยงการเดารูปแบบ archive จาก
  URL ที่ใช้ร่วมกัน

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ดาวน์โหลด artifact ของเวอร์ชันผ่านเส้นทาง resolver ที่ชัดเจน

หมายเหตุ:

- เวอร์ชัน ClawPack จะ stream ไบต์ `.tgz` ของ npm-pack ที่อัปโหลดอย่างตรงกัน
- เวอร์ชัน ZIP แบบเดิมจะ redirect ไปที่ `/api/v1/packages/{name}/download?version=`
- ใช้ bucket อัตราการดาวน์โหลด

### `GET /api/v1/packages/{name}/readiness`

ส่งคืน readiness ที่คำนวณแล้วสำหรับการใช้งาน OpenClaw ในอนาคต

การตรวจสอบ readiness ครอบคลุม:

- สถานะช่องทาง official
- ความพร้อมใช้งานของเวอร์ชันล่าสุด
- ความพร้อมใช้งานของ artifact ClawPack npm-pack
- ไดเจสต์ artifact
- แหล่งที่มาของ source repo และ commit
- เมทาดาทาความเข้ากันได้กับ OpenClaw
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

endpoint สำหรับ moderator เพื่อแสดงรายการแถว migration ของ OpenClaw Plugin official

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ moderator หรือ admin

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

endpoint สำหรับ admin เพื่อสร้างหรืออัปเดตแถว migration ของ Plugin official

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ admin

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
- `packageName` ถูก normalize เป็นชื่อ npm โดยแพ็กเกจอาจไม่มีอยู่สำหรับ
  migration ที่วางแผนไว้
- สิ่งนี้ติดตามเฉพาะ readiness ของ migration เท่านั้น ไม่ได้แก้ไข OpenClaw หรือสร้าง
  ClawPacks

### `GET /api/v1/packages/moderation/queue`

endpoint สำหรับ moderator/admin สำหรับคิวตรวจทานรีลีสแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ moderator หรือ admin

พารามิเตอร์คิวรี:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `blocked`, `manual` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

ความหมายของสถานะ:

- `open`: รีลีสที่น่าสงสัย เป็นอันตราย รอดำเนินการ ถูก quarantine ถูก revoke หรือถูกรายงาน
- `blocked`: รีลีสที่ถูก quarantine ถูก revoke หรือเป็นอันตราย
- `manual`: รีลีสใด ๆ ที่มี manual moderation override
- `all`: รีลีสใด ๆ ที่มี manual override, สถานะสแกนที่ไม่ clean หรือรายงานแพ็กเกจ

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

รายงานแพ็กเกจเพื่อให้ moderator ตรวจทาน รายงานอยู่ในระดับแพ็กเกจ และสามารถ
ลิงก์กับเวอร์ชันได้ตามต้องการ รายงานเหล่านี้ป้อนเข้าสู่คิว moderation แต่จะไม่ซ่อนหรือ
บล็อกการดาวน์โหลดโดยอัตโนมัติด้วยตัวเอง moderator ควรใช้ release moderation เพื่อ
อนุมัติ quarantine หรือ revoke artifact

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

- ต้องใช้โทเค็น API สำหรับผู้ใช้ moderator หรือ admin

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

endpoint สำหรับเจ้าของ/moderator เพื่อดูสถานะการตรวจสอบแพ็กเกจ

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

endpoint สำหรับ moderator/admin เพื่อปิดผลหรือเปิดรายงานแพ็กเกจอีกครั้ง

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
`finalAction: "revoke"` พร้อมรายงานที่ยืนยันแล้ว เพื่อใช้การตรวจสอบ release ใน
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

endpoint สำหรับ moderator/admin เพื่อตรวจสอบ release ของแพ็กเกจ

คำขอ:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

สถานะที่รองรับ:

- `approved`: ตรวจสอบด้วยตนเองและอนุญาตแล้ว
- `quarantined`: ถูกบล็อกระหว่างรอการติดตามผล
- `revoked`: ถูกบล็อกหลังจากที่ release เคยได้รับความเชื่อถือมาก่อน

release ที่ถูกกักกันและเพิกถอนจะคืนค่า `403` จาก route ดาวน์โหลดอาร์ติแฟกต์
ทุกการเปลี่ยนแปลงจะเขียนรายการ audit log

### `GET /api/v1/packages/{name}/file`

คืนค่าเนื้อหาข้อความดิบสำหรับไฟล์แพ็กเกจ

พารามิเตอร์คิวรี:

- `path` (ต้องระบุ)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือ release ล่าสุด
- ใช้บักเก็ตอัตราการอ่าน ไม่ใช่บักเก็ตดาวน์โหลด
- ไฟล์ไบนารีจะคืนค่า `415`
- ขีดจำกัดขนาดไฟล์: 200KB
- การสแกน VirusTotal ที่ยังรอดำเนินการจะไม่บล็อกการอ่าน; release ที่เป็นอันตรายอาจยังถูกระงับไว้ที่อื่น
- แพ็กเกจส่วนตัวจะคืนค่า `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่ที่เป็นเจ้าของได้

### `GET /api/v1/packages/{name}/download`

ดาวน์โหลดไฟล์ ZIP archive แบบ deterministic เดิมสำหรับ release ของแพ็กเกจ

พารามิเตอร์คิวรี:

- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือ release ล่าสุด
- Skills จะเปลี่ยนเส้นทางไปที่ `GET /api/v1/download`
- archive ของ Plugin/แพ็กเกจเป็นไฟล์ zip ที่มี root `package/` เพื่อให้ไคลเอนต์ OpenClaw
  รุ่นเก่ายังคงทำงานได้
- route นี้ยังคงเป็น ZIP เท่านั้น ไม่สตรีมไฟล์ ClawPack `.tgz`
- การตอบกลับมี header `ETag`, `Digest`, `X-ClawHub-Artifact-Type` และ
  `X-ClawHub-Artifact-Sha256` สำหรับการตรวจสอบความถูกต้องของ resolver
- metadata เฉพาะ registry จะไม่ถูกฉีดเข้าไปใน archive ที่ดาวน์โหลด
- การสแกน VirusTotal ที่ยังรอดำเนินการจะไม่บล็อกการดาวน์โหลด; release ที่เป็นอันตรายจะคืนค่า `403`
- แพ็กเกจส่วนตัวจะคืนค่า `404` เว้นแต่ผู้เรียกจะเป็นเจ้าของ

### `GET /api/npm/{package}`

คืนค่า packument ที่เข้ากันได้กับ npm สำหรับเวอร์ชันแพ็กเกจที่รองรับด้วย ClawPack

หมายเหตุ:

- แสดงเฉพาะเวอร์ชันที่มี tarball npm-pack ของ ClawPack ที่อัปโหลดแล้ว
- เวอร์ชันเดิมที่มีเฉพาะ ZIP จะถูกละไว้โดยตั้งใจ
- `dist.tarball`, `dist.integrity` และ `dist.shasum` ใช้ฟิลด์ที่เข้ากันได้กับ npm
  เพื่อให้ผู้ใช้ชี้ npm ไปที่ mirror ได้หากต้องการ
- packument ของแพ็กเกจแบบ scoped รองรับทั้ง `/api/npm/@scope/name` และเส้นทางคำขอ
  ที่เข้ารหัสของ npm คือ `/api/npm/@scope%2Fname`

### `GET /api/npm/{package}/-/{tarball}.tgz`

สตรีมไบต์ tarball ของ ClawPack ที่อัปโหลดไว้แบบตรงตัวสำหรับไคลเอนต์ npm mirror

หมายเหตุ:

- ใช้บักเก็ตอัตราการดาวน์โหลด
- header ดาวน์โหลดมี SHA-256 ของ ClawHub พร้อม metadata integrity/shasum ของ npm
- การตรวจสอบ moderation และการตรวจสอบสิทธิ์เข้าถึงแพ็กเกจส่วนตัวยังคงมีผล

### `GET /api/v1/resolve`

CLI ใช้เพื่อแมปลายนิ้วมือภายในเครื่องกับเวอร์ชันที่รู้จัก

พารามิเตอร์คิวรี:

- `slug` (ต้องระบุ)
- `hash` (ต้องระบุ): sha256 hex 64 อักขระของลายนิ้วมือ bundle

การตอบกลับ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ดาวน์โหลด ZIP ของเวอร์ชัน skill ที่โฮสต์ไว้ หรือคืนค่า handoff ไปยังซอร์ส GitHub สำหรับ
skill ปัจจุบันที่รองรับด้วย GitHub ซึ่งมีการสแกนเป็น `clean` หรือ `suspicious` และไม่มี
เวอร์ชันที่โฮสต์ไว้

พารามิเตอร์คิวรี:

- `slug` (ต้องระบุ)
- `version` (ไม่บังคับ): สตริง semver
- `tag` (ไม่บังคับ): ชื่อแท็ก (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- เวอร์ชันที่ถูกลบแบบ soft-delete จะคืนค่า `410`
- handoff ของ skill ที่รองรับด้วย GitHub จะไม่ proxy หรือ mirror ไบต์ การตอบกลับ JSON
  มี `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  และ `archiveUrl`; สถานะการสแกน/สถานะปัจจุบันเป็น gate และไม่ได้รวมเป็น metadata
  payload ความสำเร็จ
- สถิติการดาวน์โหลดนับเป็น identity ที่ไม่ซ้ำต่อวัน UTC (`userId` เมื่อโทเค็น API ถูกต้อง มิฉะนั้นใช้ IP)

## endpoint การยืนยันตัวตน (Bearer token)

endpoint ทั้งหมดต้องมี:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

ตรวจสอบโทเค็นและคืนค่า handle ของผู้ใช้

### `POST /api/v1/skills`

เผยแพร่เวอร์ชันใหม่

- แนะนำ: `multipart/form-data` พร้อม JSON `payload` + blob `files[]`
- รองรับ body แบบ JSON พร้อม `files` (อิง `storageId`) ด้วย
- ฟิลด์ payload ที่ไม่บังคับ: `ownerHandle` เมื่อมีฟิลด์นี้ API จะ resolve
  ผู้เผยแพร่นั้นฝั่งเซิร์ฟเวอร์และกำหนดให้ actor ต้องมีสิทธิ์เข้าถึงผู้เผยแพร่
- ฟิลด์ payload ที่ไม่บังคับ: `migrateOwner` เมื่อเป็น `true` พร้อม `ownerHandle`
  skill ที่มีอยู่สามารถย้ายไปยังเจ้าของนั้นได้หาก actor เป็น admin/เจ้าของทั้งใน
  ผู้เผยแพร่ปัจจุบันและผู้เผยแพร่เป้าหมาย หากไม่มีการ opt-in นี้ การเปลี่ยนเจ้าของจะ
  ถูกปฏิเสธ

### `POST /api/v1/packages`

เผยแพร่ release ของ code-plugin หรือ bundle-plugin

- ต้องใช้การยืนยันตัวตนด้วย Bearer token
- ต้องใช้ `multipart/form-data`
- ฟิลด์ form ที่อนุญาตคือ `payload`, blob `files` ซ้ำ หรือการอ้างอิง tarball
  `clawpack` หนึ่งรายการ `clawpack` อาจเป็น blob `.tgz` หรือ storage id ที่คืนมาจาก
  flow upload-url การเผยแพร่ด้วย storage-id ที่จัดเตรียมไว้ต้องมี
  `clawpackUploadTicket` ที่คืนมาพร้อม URL อัปโหลดนั้นด้วย
- ใช้ `files` หรือ `clawpack` อย่างใดอย่างหนึ่งเท่านั้น ห้ามใช้ทั้งสองในคำขอเดียวกัน
- body แบบ JSON และ metadata `payload.files` / `payload.artifact` ที่ผู้เรียกระบุเอง
  จะถูกปฏิเสธ
- คำขอเผยแพร่ multipart โดยตรงถูกจำกัดไว้ที่ 18MB tarball ของ ClawPack สามารถ
  ใช้ flow upload-url ได้จนถึงขีดจำกัด tarball 120MB
- ฟิลด์ payload ที่ไม่บังคับ: `ownerHandle` เมื่อมีฟิลด์นี้ เฉพาะ admin เท่านั้นที่เผยแพร่แทนเจ้าของนั้นได้

ไฮไลต์การตรวจสอบความถูกต้อง:

- `family` ต้องเป็น `code-plugin` หรือ `bundle-plugin`
- แพ็กเกจ Plugin ต้องมี `openclaw.plugin.json` การอัปโหลด ClawPack `.tgz` ต้อง
  มีไฟล์นี้ที่ `package/openclaw.plugin.json`
- code plugin ต้องมี `package.json`, metadata repo ต้นทาง, metadata commit
  ต้นทาง, metadata schema การกำหนดค่า, `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion`
- `openclaw.hostTargets` และ `openclaw.environment` เป็น metadata ที่ไม่บังคับ
- เฉพาะผู้เผยแพร่ org `openclaw` และผู้เผยแพร่ส่วนตัวของสมาชิก org `openclaw`
  ปัจจุบันเท่านั้นที่เผยแพร่ไปยัง channel `official` ได้
- การเผยแพร่แทนผู้อื่นยังคงตรวจสอบสิทธิ์ channel official กับบัญชีเจ้าของเป้าหมาย

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

ลบแบบ soft-delete / กู้คืน skill (เจ้าของ, moderator หรือ admin)

body JSON ที่ไม่บังคับ:

```json
{ "reason": "Held for moderation pending legal review." }
```

เมื่อมี `reason` จะถูกจัดเก็บเป็นบันทึก moderation ของ skill และคัดลอกเข้า audit log
การลบแบบ soft-delete ที่เริ่มโดยเจ้าของจะสงวน slug ไว้ 30 วัน จากนั้น slug จะถูกอ้างสิทธิ์โดย
ผู้เผยแพร่รายอื่นได้ การตอบกลับการลบมี `slugReservedUntil` เมื่อการหมดอายุนี้มีผล
การซ่อนโดย moderator/admin และการลบด้านความปลอดภัยจะไม่หมดอายุด้วยวิธีนี้

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

สำหรับ admin เท่านั้น ตรวจให้แน่ใจว่ามีผู้เผยแพร่ org สำหรับ handle หาก handle ยังชี้ไปที่
ผู้ใช้ร่วมเดิม/ผู้เผยแพร่ส่วนตัวเดิม endpoint จะ migrate ไปเป็นผู้เผยแพร่ org ก่อน
สำหรับ org ที่สร้างใหม่ ให้ระบุ `memberHandle`; admin ที่ดำเนินการจะไม่ถูกเพิ่มเป็นสมาชิก
`memberRole` มีค่าเริ่มต้นเป็น `owner`

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

การสร้างผู้เผยแพร่ org แบบบริการตนเองสำหรับผู้ใช้ที่ยืนยันตัวตนแล้ว สร้างผู้เผยแพร่ org ใหม่และเพิ่ม
ผู้เรียกเป็นเจ้าของ endpoint นี้ไม่ migrate handle ผู้ใช้/ส่วนตัวที่มีอยู่ และ
ไม่ทำเครื่องหมายผู้เผยแพร่ว่า trusted/official

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- คืนค่า `409` เมื่อ handle ถูกใช้โดยผู้เผยแพร่, ผู้ใช้ หรือผู้เผยแพร่ส่วนตัวแล้ว

### `POST /api/v1/users/reserve`

สำหรับ admin เท่านั้น สงวน root slug และชื่อแพ็กเกจให้เจ้าของที่ชอบธรรมโดยไม่เผยแพร่
release ชื่อแพ็กเกจจะกลายเป็นแพ็กเกจ placeholder ส่วนตัวที่ไม่มีแถว release เพื่อให้เจ้าของเดียวกัน
เผยแพร่ release code-plugin หรือ bundle-plugin จริงในชื่อนั้นได้ภายหลัง

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

สำหรับ admin เท่านั้น กู้คืนผู้เผยแพร่ส่วนตัวสำหรับ GitHub OAuth principal ทดแทนที่ตรวจสอบแล้ว
โดยไม่แก้ไขแถวบัญชี Convex Auth คำขอต้องระบุ id บัญชี provider GitHub แบบ immutable ทั้งสองรายการ;
handle ที่เปลี่ยนแปลงได้ใช้เป็น guard ที่แสดงต่อ operator เท่านั้น

ปลายทางนี้มีค่าเริ่มต้นเป็น dry-run การใช้การกู้คืนจริงต้องระบุ `dryRun: false` และ
`confirmIdentityVerified: true` หลังจากเจ้าหน้าที่ตรวจสอบความต่อเนื่องระหว่าง
ตัวตนหลักของ GitHub ทั้งสองฝ่ายโดยอิสระแล้ว การกู้คืนจะล้มเหลวแบบปิดเมื่อผู้เผยแพร่ส่วนบุคคลปัจจุบันของผู้ใช้ปลายทาง
มี Skills, แพ็กเกจ หรือแหล่งที่มา Skill ของ GitHub
การกู้คืนยังย้ายฟิลด์ `ownerUserId` แบบเก่าสำหรับ Skills ของผู้เผยแพร่ที่กู้คืน,
นามแฝง slug ของ Skill, แพ็กเกจ, คำเตือนจากตัวตรวจสอบแพ็กเกจ และแถว digest การค้นหาที่ได้มา เพื่อให้
เส้นทางเจ้าของโดยตรงสอดคล้องกับอำนาจของผู้เผยแพร่ใหม่ การจอง handle ที่ได้รับการป้องกันซึ่งยังใช้งานอยู่
สำหรับ handle ที่กู้คืนจะถูกมอบหมายใหม่ให้ผู้ใช้ทดแทนด้วย เพื่อให้การซิงโครไนซ์โปรไฟล์ในภายหลัง
ไม่สามารถกู้คืนอำนาจที่แข่งขันกันของผู้ใช้เดิมได้ แต่ละตารางหลักถูกจำกัดไว้ที่
100 แถวต่อธุรกรรมการใช้จริงหนึ่งครั้ง; การกู้คืนที่ใหญ่กว่านี้ต้องใช้การย้ายเจ้าของแบบกลับมาทำต่อได้ก่อน
แหล่งที่มา Skill ของ GitHub อยู่ในขอบเขตผู้เผยแพร่ และรายงานว่าได้รับการตรวจสอบแล้วแทนที่จะเขียนใหม่

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

- ทั้งสองปลายทางต้องใช้การยืนยันตัวตนด้วยโทเค็น API และใช้งานได้เฉพาะกับเจ้าของ Skill เท่านั้น
- `rename` เก็บ slug ก่อนหน้าไว้เป็นนามแฝงสำหรับเปลี่ยนเส้นทาง
- `merge` ซ่อนรายการต้นทางและเปลี่ยนเส้นทาง slug ต้นทางไปยังรายการปลายทาง

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

### `POST /api/v1/users/reclassify-ban`

เปลี่ยนเหตุผลที่จัดเก็บไว้สำหรับการแบนที่มีอยู่ โดยไม่ยกเลิกการแบนหรือกู้คืน
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

เพิ่ม/ลบดาว (รายการเด่น) ทั้งสองปลายทางเป็น idempotent

การตอบกลับ:

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

ดูแผนการนำออกใน `DEPRECATIONS.md`

`POST /api/cli/upload-url` ส่งคืน `uploadUrl` และ `uploadTicket` การเผยแพร่แพ็กเกจ
ที่จัดเตรียม tarball ของ ClawPack ต้องส่ง id ของพื้นที่จัดเก็บที่ได้เป็น
`clawpack` และ ticket ที่ส่งคืนเป็น `clawpackUploadTicket`

## การค้นพบ registry (`/.well-known/clawhub.json`)

CLI สามารถค้นพบการตั้งค่า registry/auth จากไซต์ได้:

- `/.well-known/clawhub.json` (JSON, แนะนำ)
- `/.well-known/clawdhub.json` (แบบเก่า)

สคีมา:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

หากคุณโฮสต์เอง ให้ให้บริการไฟล์นี้ (หรือตั้งค่า `CLAWHUB_REGISTRY` อย่างชัดเจน; แบบเก่าคือ `CLAWDHUB_REGISTRY`)
