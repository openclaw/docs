---
read_when:
    - การเพิ่ม/เปลี่ยนแปลงเอนด์พอยต์
    - การดีบักคำขอ CLI ↔ รีจิสทรี
summary: เอกสารอ้างอิง HTTP API (จุดปลายทางสาธารณะ + จุดปลายทาง CLI + การตรวจสอบสิทธิ์).
x-i18n:
    generated_at: "2026-05-12T15:42:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

URL ฐาน: `https://clawhub.ai` (ค่าเริ่มต้น)

เส้นทาง v1 ทั้งหมดอยู่ภายใต้ `/api/v1/...`
เส้นทางเดิม `/api/...` และ `/api/cli/...` ยังคงอยู่เพื่อความเข้ากันได้ (ดู `DEPRECATIONS.md`)
OpenAPI: `/api/v1/openapi.json`

## การนำแค็ตตาล็อกสาธารณะไปใช้ซ้ำ

ไดเรกทอรีของบุคคลที่สามอาจใช้ปลายทางอ่านแบบสาธารณะเพื่อแสดงรายการหรือค้นหา Skills ของ ClawHub ได้ โปรดแคชผลลัพธ์ เคารพ `429`/`Retry-After` ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ตามรูปแบบบัญญัติ (`https://clawhub.ai/<owner>/<slug>`) และหลีกเลี่ยงการสื่อว่า ClawHub รับรองเว็บไซต์ของบุคคลที่สามนั้น อย่าพยายามมิเรอร์เนื้อหาที่ซ่อน เป็นส่วนตัว หรือถูกบล็อกโดยการกลั่นกรองนอกเหนือจากพื้นผิว API สาธารณะ

ทางลัด slug บนเว็บ resolve ข้ามตระกูลรีจิสทรีได้ แต่ไคลเอนต์ API ควรใช้
URL ตามรูปแบบบัญญัติที่ปลายทางอ่านส่งกลับมา แทนการสร้างลำดับความสำคัญ
ของ route ขึ้นใหม่เอง

## ขีดจำกัดอัตรา

โมเดลการบังคับใช้:

- คำขอแบบไม่ระบุตัวตน: บังคับใช้ต่อ IP
- คำขอที่ยืนยันตัวตนแล้ว (Bearer token ที่ถูกต้อง): บังคับใช้ต่อบัคเก็ตผู้ใช้
- หากไม่มีโทเค็นหรือโทเค็นไม่ถูกต้อง พฤติกรรมจะถอยกลับไปใช้การบังคับใช้ตาม IP
- ปลายทางเขียนที่ยืนยันตัวตนแล้วไม่ควรส่งกลับเพียง `Unauthorized` แบบเปล่าเมื่อ
  เซิร์ฟเวอร์รู้สาเหตุ โทเค็นที่หายไป โทเค็นไม่ถูกต้อง/ถูกเพิกถอน และ
  บัญชีที่ถูกลบ/ถูกแบน/ถูกปิดใช้งาน ควรได้รับข้อความที่นำไปปฏิบัติได้แยกกัน เพื่อให้ไคลเอนต์
  CLI บอกผู้ใช้ได้ว่าอะไรบล็อกพวกเขาอยู่

- อ่าน: 600/นาที ต่อ IP, 2400/นาที ต่อคีย์
- เขียน: 45/นาที ต่อ IP, 180/นาที ต่อคีย์
- ดาวน์โหลด: 30/นาที ต่อ IP, 180/นาที ต่อคีย์ (`/api/v1/download`)

ส่วนหัว:

- ความเข้ากันได้แบบเดิม: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- แบบมาตรฐาน: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- เมื่อเป็น `429`: `Retry-After`

ความหมายของส่วนหัว:

- `X-RateLimit-Reset`: วินาทีแบบ Unix epoch สัมบูรณ์
- `RateLimit-Reset`: จำนวนวินาทีจนกว่าจะรีเซ็ต (ความหน่วง)
- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่ (ความหน่วง) เมื่อเป็น `429`

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
- ใช้ backoff พร้อม jitter เพื่อหลีกเลี่ยงการลองใหม่พร้อมกัน
- หากไม่มี `Retry-After` ให้ถอยไปใช้ `RateLimit-Reset` (หรือคำนวณจาก `X-RateLimit-Reset`)

แหล่งที่มาของ IP:

- ใช้ `cf-connecting-ip` (Cloudflare) เป็น IP ของไคลเอนต์โดยค่าเริ่มต้น
- ClawHub ใช้ส่วนหัวการส่งต่อที่เชื่อถือได้เพื่อระบุ IP ของไคลเอนต์ที่ขอบเครือข่าย
- หากไม่มี IP ไคลเอนต์ที่เชื่อถือได้ คำขอดาวน์โหลดแบบไม่ระบุตัวตนจะใช้บัคเก็ตสำรองที่จำกัดขอบเขตตามปลายทาง แทนบัคเก็ต `ip:unknown` ทั่วโลกเพียงบัคเก็ตเดียว คำขออ่าน/เขียนแบบไม่ระบุตัวตนยังคงใช้บัคเก็ต unknown ร่วมกัน เพื่อให้การ route ที่ไม่มี IP ยังคงมองเห็นได้และมีความระมัดระวัง

## ปลายทางสาธารณะ (ไม่ต้องยืนยันตัวตน)

### `GET /api/v1/search`

พารามิเตอร์ query:

- `q` (จำเป็น): สตริงคำค้นหา
- `limit` (ไม่บังคับ): จำนวนเต็ม
- `highlightedOnly` (ไม่บังคับ): `true` เพื่อกรองเฉพาะ Skills ที่ถูกไฮไลต์
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias เดิมของ `nonSuspiciousOnly`

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

- ผลลัพธ์จะถูกส่งกลับตามลำดับความเกี่ยวข้อง (ความคล้ายของ embedding + การเพิ่มน้ำหนัก token slug/name ที่ตรงกันแบบ exact + prior ความนิยมจากการดาวน์โหลด)
- ความเกี่ยวข้องมีน้ำหนักมากกว่าความนิยม การตรงกับ token ของ slug หรือ display-name อย่างแม่นยำอาจมีอันดับสูงกว่าการตรงแบบหลวมกว่าที่มีจำนวนดาวน์โหลดมากกว่ามาก
- ข้อความ ASCII จะถูก tokenized ตามขอบเขตของคำและเครื่องหมายวรรคตอน ตัวอย่างเช่น `personal-map` มี token `map` แบบ standalone ในขณะที่ `amap-jsapi-skill` มี `amap`, `jsapi` และ `skill`; ดังนั้นการค้นหา `map` จึงให้ lexical match ของ `personal-map` ที่แข็งแรงกว่า `amap-jsapi-skill`
- การดาวน์โหลดถูกใช้เป็น prior แบบ log-scale ขนาดเล็กและตัวตัดสินกรณีเสมอ ไม่ใช่สัญญาณจัดอันดับหลัก Skills ที่มียอดดาวน์โหลดสูงอาจมีอันดับต่ำกว่าเมื่อข้อความ query ตรงกันอ่อนกว่า
- สถานะการกลั่นกรองที่น่าสงสัยหรือซ่อนอยู่อาจทำให้ Skill ถูกนำออกจากการค้นหาสาธารณะ ขึ้นอยู่กับตัวกรองของผู้เรียกและสถานะการกลั่นกรองปัจจุบัน

คำแนะนำด้านการค้นพบสำหรับผู้เผยแพร่:

- ใส่คำที่ผู้ใช้จะค้นหาจริงลงใน display name, summary และ tags ใช้ token slug แบบ standalone เฉพาะเมื่อสิ่งนั้นเป็นอัตลักษณ์ที่เสถียรและต้องการเก็บไว้ด้วย
- อย่าเปลี่ยนชื่อ slug เพียงเพื่อไล่ตาม query หนึ่งรายการ เว้นแต่ slug ใหม่จะเป็นชื่อบัญญัติระยะยาวที่ดีกว่า slug เก่าจะกลายเป็น redirect aliases แต่ URL ตามรูปแบบบัญญัติ, slug ที่แสดง และ digest การค้นหาในอนาคตจะใช้ slug ใหม่
- Rename aliases รักษาการ resolve สำหรับ URL เก่าและการติดตั้งที่ resolve ผ่านรีจิสทรี แต่การจัดอันดับค้นหาจะอิง metadata ของ Skill ตามรูปแบบบัญญัติหลังจากการเปลี่ยนชื่อถูกทำ index แล้ว สถิติที่มีอยู่จะยังอยู่กับ Skill
- หาก Skill มองไม่เห็นโดยไม่คาดคิด ให้ตรวจสอบสถานะการกลั่นกรองก่อนด้วย `clawhub inspect <slug>` ขณะเข้าสู่ระบบ ก่อนเปลี่ยน metadata ที่เกี่ยวข้องกับการจัดอันดับ

### `GET /api/v1/skills`

พารามิเตอร์ query:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–200)
- `cursor` (ไม่บังคับ): cursor สำหรับ pagination ของการเรียงลำดับใดๆ ที่ไม่ใช่ `trending`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias เดิมของ `nonSuspiciousOnly`

หมายเหตุ:

- `trending` จัดอันดับตามการติดตั้งในช่วง 7 วันที่ผ่านมา (อิง telemetry)
- `createdAt` เสถียรสำหรับการ crawl Skills ใหม่; `updated` เปลี่ยนเมื่อ Skills ที่มีอยู่ถูกเผยแพร่ซ้ำ
- เมื่อ `nonSuspiciousOnly=true` การเรียงลำดับแบบ cursor-based อาจส่งกลับรายการในหน้าน้อยกว่า `limit` เพราะ Skills ที่น่าสงสัยถูกกรองหลังการดึงหน้า
- ใช้ `nextCursor` เพื่อทำ pagination ต่อเมื่อมีอยู่ หน้าแบบสั้นไม่ได้หมายความว่าถึงจุดสิ้นสุดของผลลัพธ์โดยตัวมันเอง

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

- slug เก่าที่สร้างโดย flow การเปลี่ยนชื่อ/ผสานเจ้าของจะ resolve ไปยัง Skill ตามรูปแบบบัญญัติ
- `metadata.os`: ข้อจำกัด OS ที่ประกาศใน frontmatter ของ Skill (เช่น `["macos"]`, `["linux"]`) เป็น `null` หากไม่ได้ประกาศ
- `metadata.systems`: เป้าหมายระบบ Nix (เช่น `["aarch64-darwin", "x86_64-linux"]`) เป็น `null` หากไม่ได้ประกาศ
- `metadata` เป็น `null` หาก Skill ไม่มี metadata แพลตฟอร์ม
- `moderation` จะถูกรวมเฉพาะเมื่อ Skill ถูก flag หรือเจ้าของกำลังดูอยู่

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

- เจ้าของและผู้ดูแลสามารถเข้าถึงรายละเอียดการกลั่นกรองสำหรับ Skills ที่ซ่อนอยู่ได้
- ผู้เรียกสาธารณะจะได้รับ `200` เฉพาะสำหรับ Skills ที่มองเห็นได้และถูก flag แล้ว
- หลักฐานถูกปกปิดสำหรับผู้เรียกสาธารณะ และรวม raw snippets เฉพาะสำหรับเจ้าของ/ผู้ดูแลเท่านั้น

### `POST /api/v1/skills/{slug}/report`

รายงาน Skill เพื่อให้ผู้ดูแลตรวจสอบ รายงานอยู่ในระดับ Skill สามารถเชื่อมโยง
กับ version ได้แบบไม่บังคับ และป้อนเข้าสู่คิวรายงาน Skill

การยืนยันตัวตน:

- ต้องมีโทเค็น API

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

ปลายทางผู้ดูแล/แอดมินสำหรับการรับรายงาน Skill

พารามิเตอร์ query:

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

ปลายทางผู้ดูแล/แอดมินสำหรับแก้ไขหรือเปิดรายงาน Skill ใหม่

คำขอ:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` จำเป็นสำหรับ `confirmed` และ `dismissed`; อาจละได้เมื่อ
ตั้ง `status` กลับเป็น `open` ส่ง `finalAction: "hide"` พร้อมรายงานที่ผ่าน triage แล้ว
เพื่อซ่อน Skill ใน workflow เดียวกันที่ตรวจสอบย้อนหลังได้

### `GET /api/v1/skills/{slug}/versions`

พารามิเตอร์ query:

- `limit` (ไม่บังคับ): จำนวนเต็ม
- `cursor` (ไม่บังคับ): cursor สำหรับ pagination

### `GET /api/v1/skills/{slug}/versions/{version}`

ส่งกลับ metadata ของ version + รายการไฟล์

- `version.security` รวมสถานะการยืนยันจากการสแกนที่ทำให้เป็นมาตรฐานแล้วและรายละเอียด scanner
  (VirusTotal + LLM) เมื่อมี

### `GET /api/v1/skills/{slug}/scan`

ส่งกลับรายละเอียดการยืนยันจากการสแกนความปลอดภัยสำหรับ version ของ Skill

พารามิเตอร์ query:

- `version` (ไม่บังคับ): สตริง version เฉพาะ
- `tag` (ไม่บังคับ): resolve version ที่ถูก tag (ตัวอย่างเช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้ version ล่าสุด
- รวมสถานะการยืนยันที่ทำให้เป็นมาตรฐานแล้วพร้อมรายละเอียดเฉพาะของ scanner
- `security.capabilityTags` รวมป้ายกำกับ capability/risk แบบ deterministic เช่น
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` และ `posts-externally` เมื่อพบ
- `security.hasScanResult` เป็น `true` เฉพาะเมื่อ scanner ให้ verdict ที่ชัดเจน (`clean`, `suspicious` หรือ `malicious`)
- `moderation` เป็น snapshot การกลั่นกรองระดับ Skill ปัจจุบันที่ได้มาจาก version ล่าสุด
- เมื่อ query version ในอดีต ให้ตรวจสอบ `moderation.matchesRequestedVersion` และ `moderation.sourceVersion` ก่อนปฏิบัติกับ `moderation` และ `security` ว่าเป็นบริบท version เดียวกัน

### `GET /api/v1/skills/{slug}/file`

ส่งกลับเนื้อหาข้อความดิบ

พารามิเตอร์ query:

- `path` (จำเป็น)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นเป็น version ล่าสุด
- ขีดจำกัดขนาดไฟล์: 200KB

### `GET /api/v1/packages`

ปลายทางแค็ตตาล็อกแบบรวมสำหรับ:

- Skills
- code plugins
- bundle plugins

พารามิเตอร์ query:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `executesCode` (ไม่บังคับ): `true` หรือ `false`
- `capabilityTag` (ไม่บังคับ): ตัวกรองความสามารถสำหรับแพ็กเกจ Plugin
- `target` / `hostTarget` (ไม่บังคับ): ชวเลขสำหรับ `host:<target>`
- `os`, `arch`, `libc` (ไม่บังคับ): ชวเลขสำหรับตัวกรองความสามารถของโฮสต์
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (ไม่บังคับ): ชวเลข `true`/`1` สำหรับแท็กข้อกำหนดของสภาพแวดล้อม
- `externalService`, `binary`, `osPermission` (ไม่บังคับ): ชวเลขสำหรับแท็ก
  ข้อกำหนดของสภาพแวดล้อมที่ระบุชื่อ
- `artifactKind` (ไม่บังคับ): `legacy-zip` หรือ `npm-pack`
- `npmMirror` (ไม่บังคับ): `true`/`1` เพื่อแสดงเวอร์ชันแพ็กเกจที่รองรับโดย ClawPack
  ซึ่งพร้อมใช้งานผ่าน npm mirror

หมายเหตุ:

- `GET /api/v1/code-plugins` และ `GET /api/v1/bundle-plugins` ยังคงเป็นนามแฝงแบบตระกูลคงที่
- รายการ Skills ยังคงรองรับโดยรีจิสทรี Skills และยังเผยแพร่ได้เฉพาะผ่าน `POST /api/v1/skills`
- `POST /api/v1/packages` ยังคงใช้ได้เฉพาะสำหรับรีลีส code-plugin และ bundle-plugin
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ยืนยันตัวตนแล้วสามารถเห็นแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดอยู่ในผลลัพธ์รายการ/ค้นหา
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ยืนยันตัวตนแล้วอ่านได้

### `GET /api/v1/packages/search`

การค้นหาแค็ตตาล็อกรวมสำหรับ Skills + แพ็กเกจ Plugin

พารามิเตอร์คิวรี:

- `q` (จำเป็น): สตริงคิวรี
- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `executesCode` (ไม่บังคับ): `true` หรือ `false`
- `capabilityTag` (ไม่บังคับ): ตัวกรองความสามารถสำหรับแพ็กเกจ Plugin
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` และ
  `osPermission` รองรับเป็นชวเลขสำหรับแท็กความสามารถทั่วไป
- `artifactKind` (ไม่บังคับ): `legacy-zip` หรือ `npm-pack`
- `npmMirror` (ไม่บังคับ): `true`/`1` เพื่อค้นหาเวอร์ชันแพ็กเกจที่รองรับโดย ClawPack
  ซึ่งพร้อมใช้งานผ่าน npm mirror

หมายเหตุ:

- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ยืนยันตัวตนแล้วสามารถค้นหาแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดอยู่ได้
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ยืนยันตัวตนแล้วอ่านได้
- ตัวกรองอาร์ทิแฟกต์รองรับโดยแท็กความสามารถที่ทำดัชนีไว้:
  `artifact:legacy-zip`, `artifact:npm-pack` และ `npm-mirror:available`

### `GET /api/v1/packages/{name}`

ส่งคืนเมตาดาต้ารายละเอียดแพ็กเกจ

หมายเหตุ:

- Skills สามารถ resolve ผ่านเส้นทางนี้ในแค็ตตาล็อกรวมได้ด้วย
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่เจ้าของได้

### `DELETE /api/v1/packages/{name}`

ลบแพ็กเกจและรีลีสทั้งหมดแบบ soft-delete

หมายเหตุ:

- ต้องใช้โทเค็น API สำหรับเจ้าของแพ็กเกจ, เจ้าของ/admin ของผู้เผยแพร่องค์กร,
  ผู้ดูแลแพลตฟอร์ม หรือ admin แพลตฟอร์ม

### `GET /api/v1/packages/{name}/versions`

ส่งคืนประวัติเวอร์ชัน

พารามิเตอร์คิวรี:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

หมายเหตุ:

- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่เจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}`

ส่งคืนเวอร์ชันแพ็กเกจหนึ่งรายการ รวมถึงเมตาดาต้าไฟล์ ความเข้ากันได้
ความสามารถ การตรวจสอบยืนยัน เมตาดาต้าอาร์ทิแฟกต์ และข้อมูลการสแกน

หมายเหตุ:

- `version.artifact.kind` คือ `legacy-zip` สำหรับอาร์ไคฟ์แพ็กเกจแบบเก่า หรือ
  `npm-pack` สำหรับรีลีสที่รองรับโดย ClawPack
- รีลีส ClawPack มีฟิลด์ `npmIntegrity`, `npmShasum` และ
  `npmTarballName` ที่เข้ากันได้กับ npm
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` และ `version.staticScan` จะรวมอยู่เมื่อมีข้อมูลการสแกน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่เจ้าของได้

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

ส่งคืนเมตาดาต้าตัว resolve อาร์ทิแฟกต์แบบชัดเจนสำหรับเวอร์ชันแพ็กเกจ

หมายเหตุ:

- เวอร์ชันแพ็กเกจแบบดั้งเดิมจะส่งคืนอาร์ทิแฟกต์ `legacy-zip` และ
  `downloadUrl` ของ ZIP แบบดั้งเดิม
- เวอร์ชัน ClawPack จะส่งคืนอาร์ทิแฟกต์ `npm-pack`, ฟิลด์ integrity ของ npm,
  `tarballUrl` และ URL ความเข้ากันได้ของ ZIP แบบดั้งเดิม
- นี่คือพื้นผิวตัว resolve ของ OpenClaw ซึ่งหลีกเลี่ยงการเดารูปแบบอาร์ไคฟ์จาก
  URL ที่ใช้ร่วมกัน

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ดาวน์โหลดอาร์ทิแฟกต์เวอร์ชันผ่านเส้นทางตัว resolve แบบชัดเจน

หมายเหตุ:

- เวอร์ชัน ClawPack จะสตรีมไบต์ `.tgz` ของ npm-pack ที่อัปโหลดไว้อย่างตรงตัว
- เวอร์ชัน ZIP แบบดั้งเดิมจะเปลี่ยนเส้นทางไปยัง `/api/v1/packages/{name}/download?version=`
- ใช้บัคเก็ตอัตราการดาวน์โหลด

### `GET /api/v1/packages/{name}/readiness`

ส่งคืนความพร้อมที่คำนวณแล้วสำหรับการใช้งาน OpenClaw ในอนาคต

การตรวจสอบความพร้อมครอบคลุม:

- สถานะช่องทาง official
- ความพร้อมใช้งานของเวอร์ชันล่าสุด
- ความพร้อมใช้งานของอาร์ทิแฟกต์ ClawPack npm-pack
- ไดเจสต์ของอาร์ทิแฟกต์
- แหล่งที่มาของ repo และ commit
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

ปลายทางสำหรับผู้ดูแลเพื่อแสดงรายการแถวการย้าย Plugin ทางการของ OpenClaw

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลหรือ admin

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

ปลายทางสำหรับ admin เพื่อสร้างหรืออัปเดตแถวการย้าย Plugin ทางการ

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

- `bundledPluginId` ถูกทำให้เป็นตัวพิมพ์เล็กและเป็นคีย์ upsert ที่เสถียร
- `packageName` ถูกปรับให้อยู่ในรูปชื่อ npm มาตรฐาน แพ็กเกจอาจไม่มีอยู่สำหรับ
  การย้ายที่วางแผนไว้
- สิ่งนี้ติดตามเฉพาะความพร้อมของการย้ายเท่านั้น ไม่ได้แก้ไข OpenClaw หรือสร้าง
  ClawPacks

### `GET /api/v1/packages/moderation/queue`

ปลายทางสำหรับผู้ดูแล/admin สำหรับคิวตรวจสอบรีลีสแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลหรือ admin

พารามิเตอร์คิวรี:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `blocked`, `manual` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

ความหมายของสถานะ:

- `open`: รีลีสที่น่าสงสัย เป็นอันตราย รอดำเนินการ ถูกกักกัน ถูกเพิกถอน หรือถูกรายงาน
- `blocked`: รีลีสที่ถูกกักกัน ถูกเพิกถอน หรือเป็นอันตราย
- `manual`: รีลีสใดก็ตามที่มีการ override การดูแลแบบ manual
- `all`: รีลีสใดก็ตามที่มีการ override แบบ manual, สถานะการสแกนที่ไม่สะอาด หรือรายงานแพ็กเกจ

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

รายงานแพ็กเกจเพื่อให้ผู้ดูแลตรวจสอบ รายงานอยู่ในระดับแพ็กเกจ และอาจ
ลิงก์กับเวอร์ชันได้ รายงานเหล่านี้ป้อนเข้าสู่คิวการดูแล แต่ไม่ซ่อนอัตโนมัติหรือ
บล็อกการดาวน์โหลดด้วยตัวเอง ผู้ดูแลควรใช้การดูแลรีลีสเพื่อ
อนุมัติ กักกัน หรือเพิกถอนอาร์ทิแฟกต์

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

ปลายทางสำหรับผู้ดูแล/admin สำหรับการรับรายงานแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลหรือ admin

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

ปลายทางสำหรับเจ้าของ/ผู้ดูแลสำหรับการมองเห็นการดูแลแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับเจ้าของแพ็กเกจ, สมาชิกผู้เผยแพร่, ผู้ดูแล หรือ
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

ปลายทางสำหรับผู้ดูแล/admin เพื่อแก้ไขหรือเปิดรายงานแพ็กเกจอีกครั้ง

คำขอ:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` จำเป็นสำหรับ `confirmed` และ `dismissed`; สามารถละไว้ได้เมื่อตั้งค่า
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

ปลายทางสำหรับผู้ดูแล/แอดมินเพื่อรีวิวรีลีสของแพ็กเกจ

คำขอ:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

สถานะที่รองรับ:

- `approved`: ผ่านการรีวิวด้วยตนเองและอนุญาตแล้ว
- `quarantined`: ถูกบล็อกระหว่างรอการติดตามผล
- `revoked`: ถูกบล็อกหลังจากรีลีสเคยได้รับความเชื่อถือมาก่อน

รีลีสที่ถูกกักกันและถูกเพิกถอนจะส่งคืน `403` จากเส้นทางดาวน์โหลดอาร์ติแฟกต์
ทุกการเปลี่ยนแปลงจะเขียนรายการบันทึกการตรวจสอบย้อนหลัง

### `POST /api/v1/packages/backfill/artifacts`

ปลายทางบำรุงรักษาสำหรับแอดมินเท่านั้น เพื่อใส่ป้ายกำกับรีลีสแพ็กเกจเก่าด้วย
เมตาดาต้าชนิดอาร์ติแฟกต์ที่ชัดเจน

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
- รีลีสที่ไม่มีพื้นที่จัดเก็บ ClawPack จะถูกติดป้ายกำกับเป็น `legacy-zip`
- แถวที่รองรับด้วย ClawPack อยู่แล้วแต่ไม่มี `artifactKind` จะถูกซ่อมเป็น
  `npm-pack`
- สิ่งนี้จะไม่สร้าง ClawPacks หรือแก้ไขไบต์ของอาร์ติแฟกต์

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
- การสแกน VirusTotal ที่ยังรอดำเนินการไม่บล็อกการอ่าน; รีลีสที่เป็นอันตรายอาจยังถูกระงับไว้ที่อื่น
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่ที่เป็นเจ้าของได้

### `GET /api/v1/packages/{name}/download`

ดาวน์โหลดไฟล์ ZIP แบบกำหนดแน่นอนดั้งเดิมสำหรับรีลีสแพ็กเกจ

พารามิเตอร์คิวรี:

- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นเป็นรีลีสล่าสุด
- Skills เปลี่ยนเส้นทางไปที่ `GET /api/v1/download`
- อาร์ไคฟ์ Plugin/แพ็กเกจเป็นไฟล์ zip ที่มีรูท `package/` เพื่อให้ไคลเอนต์ OpenClaw
  เก่ายังคงทำงานได้
- เส้นทางนี้คงไว้สำหรับ ZIP เท่านั้น ไม่สตรีมไฟล์ ClawPack `.tgz`
- การตอบกลับมีส่วนหัว `ETag`, `Digest`, `X-ClawHub-Artifact-Type` และ
  `X-ClawHub-Artifact-Sha256` สำหรับการตรวจสอบความสมบูรณ์ของตัวแก้ไข
- เมตาดาต้าเฉพาะ Registry จะไม่ถูกแทรกเข้าไปในอาร์ไคฟ์ที่ดาวน์โหลด
- การสแกน VirusTotal ที่ยังรอดำเนินการไม่บล็อกการดาวน์โหลด; รีลีสที่เป็นอันตรายส่งคืน `403`
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะเป็นเจ้าของ

### `GET /api/npm/{package}`

ส่งคืน packument ที่เข้ากันได้กับ npm สำหรับเวอร์ชันแพ็กเกจที่รองรับด้วย ClawPack

หมายเหตุ:

- แสดงเฉพาะเวอร์ชันที่มีการอัปโหลดทาร์บอล npm-pack ของ ClawPack
- เวอร์ชันเก่าที่มีเฉพาะ ZIP จะถูกละไว้โดยตั้งใจ
- `dist.tarball`, `dist.integrity` และ `dist.shasum` ใช้ฟิลด์ที่เข้ากันได้กับ npm
  เพื่อให้ผู้ใช้ชี้ npm ไปยังมิเรอร์ได้หากต้องการ
- packument ของแพ็กเกจแบบมี scope รองรับทั้ง `/api/npm/@scope/name` และพาธคำขอแบบเข้ารหัสของ npm
  `/api/npm/@scope%2Fname`

### `GET /api/npm/{package}/-/{tarball}.tgz`

สตรีมไบต์ทาร์บอล ClawPack ที่อัปโหลดจริงสำหรับไคลเอนต์มิเรอร์ npm

หมายเหตุ:

- ใช้บัคเก็ตอัตราการดาวน์โหลด
- ส่วนหัวการดาวน์โหลดมี SHA-256 ของ ClawHub รวมถึงเมตาดาต้า integrity/shasum ของ npm
- การตรวจสอบการกลั่นกรองและการเข้าถึงแพ็กเกจส่วนตัวยังคงมีผล

### `GET /api/v1/resolve`

CLI ใช้เพื่อแมปลายนิ้วมือภายในเครื่องกับเวอร์ชันที่รู้จัก

พารามิเตอร์คิวรี:

- `slug` (จำเป็น)
- `hash` (จำเป็น): sha256 แบบเลขฐานสิบหก 64 ตัวอักษรของลายนิ้วมือบันเดิล

การตอบกลับ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ดาวน์โหลด zip ของเวอร์ชัน Skills

พารามิเตอร์คิวรี:

- `slug` (จำเป็น)
- `version` (ไม่บังคับ): สตริง semver
- `tag` (ไม่บังคับ): ชื่อแท็ก (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- เวอร์ชันที่ถูกลบแบบ soft-delete ส่งคืน `410`
- สถิติการดาวน์โหลดนับเป็นข้อมูลประจำตัวที่ไม่ซ้ำต่อชั่วโมง (`userId` เมื่อ API token ถูกต้อง มิฉะนั้นใช้ IP)

## ปลายทางการยืนยันตัวตน (โทเค็น Bearer)

ทุกปลายทางต้องมี:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

ตรวจสอบความถูกต้องของโทเค็นและส่งคืน handle ของผู้ใช้

### `POST /api/v1/skills`

เผยแพร่เวอร์ชันใหม่

- แนะนำ: `multipart/form-data` พร้อม JSON `payload` + blob `files[]`
- ยอมรับเนื้อหา JSON ที่มี `files` (อิงตาม storageId) ด้วย
- ฟิลด์ payload ที่ไม่บังคับ: `ownerHandle` เมื่อมีอยู่ API จะ resolve
  ผู้เผยแพร่นั้นฝั่งเซิร์ฟเวอร์และกำหนดให้ actor ต้องมีสิทธิ์เข้าถึงผู้เผยแพร่
- ฟิลด์ payload ที่ไม่บังคับ: `migrateOwner` เมื่อเป็น `true` พร้อม `ownerHandle`
  Skills ที่มีอยู่สามารถย้ายไปยังเจ้าของนั้นได้หาก actor เป็นแอดมิน/เจ้าของทั้งใน
  ผู้เผยแพร่ปัจจุบันและเป้าหมาย หากไม่มีการเลือกเข้าร่วมนี้ การเปลี่ยนเจ้าของจะถูกปฏิเสธ

### `POST /api/v1/packages`

เผยแพร่รีลีส code-plugin หรือ bundle-plugin

- ต้องใช้การยืนยันตัวตนด้วยโทเค็น Bearer
- แนะนำ: `multipart/form-data` พร้อม JSON `payload` + blob `files[]`
- ยอมรับเนื้อหา JSON ที่มี `files` (อิงตาม storageId) ด้วย
- ฟิลด์ payload ที่ไม่บังคับ: `ownerHandle` เมื่อมีอยู่ เฉพาะแอดมินเท่านั้นที่เผยแพร่แทนเจ้าของนั้นได้

ประเด็นสำคัญในการตรวจสอบ:

- `family` ต้องเป็น `code-plugin` หรือ `bundle-plugin`
- แพ็กเกจ Plugin ต้องมี `openclaw.plugin.json` การอัปโหลด ClawPack `.tgz` ต้อง
  มีไฟล์นี้ที่ `package/openclaw.plugin.json`
- Code Plugin ต้องมี `package.json`, เมตาดาต้า repo ต้นทาง, เมตาดาต้า commit
  ต้นทาง, เมตาดาต้า schema การกำหนดค่า, `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion`
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมตาดาต้าที่ไม่บังคับ
- เฉพาะผู้เผยแพร่ที่เชื่อถือได้เท่านั้นที่เผยแพร่ไปยังช่อง `official` ได้
- การเผยแพร่แทนยังคงตรวจสอบคุณสมบัติในการใช้ช่อง official กับบัญชีเจ้าของเป้าหมาย

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

ลบแบบ soft-delete / กู้คืน Skills (เจ้าของ ผู้กลั่นกรอง หรือแอดมิน)

เนื้อหา JSON ที่ไม่บังคับ:

```json
{ "reason": "Held for moderation pending legal review." }
```

เมื่อมี `reason` จะถูกเก็บเป็นหมายเหตุการกลั่นกรองของ Skills และคัดลอกเข้าไปในบันทึกการตรวจสอบย้อนหลัง
การลบแบบ soft delete ที่เริ่มโดยเจ้าของจะจอง slug ไว้ 30 วัน จากนั้น slug จะถูกอ้างสิทธิ์โดย
ผู้เผยแพร่รายอื่นได้ การตอบกลับการลบมี `slugReservedUntil` เมื่อการหมดอายุนี้มีผล
การซ่อนโดยผู้กลั่นกรอง/แอดมินและการลบออกด้วยเหตุผลด้านความปลอดภัยจะไม่หมดอายุในลักษณะนี้

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

สำหรับแอดมินเท่านั้น ตรวจสอบให้แน่ใจว่ามีผู้เผยแพร่องค์กรสำหรับ handle หาก handle ยังชี้ไปที่
ผู้ใช้ร่วม/ผู้เผยแพร่ส่วนบุคคลแบบเก่า ปลายทางจะย้ายไปเป็นผู้เผยแพร่องค์กรก่อน

- เนื้อหา: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- การตอบกลับ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

สำหรับแอดมินเท่านั้น จอง root slug และชื่อแพ็กเกจให้เจ้าของที่ถูกต้องโดยไม่เผยแพร่
รีลีส ชื่อแพ็กเกจจะกลายเป็นแพ็กเกจ placeholder แบบส่วนตัวที่ไม่มีแถวรีลีส เพื่อให้
เจ้าของเดียวกันสามารถเผยแพร่รีลีส code-plugin หรือ bundle-plugin จริงลงในชื่อนั้นภายหลังได้

- เนื้อหา: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- การตอบกลับ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### ปลายทางการจัดการ slug ของเจ้าของ

- `POST /api/v1/skills/{slug}/rename`
  - เนื้อหา: `{ "newSlug": "new-canonical-slug" }`
  - การตอบกลับ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - เนื้อหา: `{ "targetSlug": "canonical-target-slug" }`
  - การตอบกลับ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

หมายเหตุ:

- ทั้งสองปลายทางต้องใช้การยืนยันตัวตนด้วย API token และทำงานเฉพาะกับเจ้าของ Skills เท่านั้น
- `rename` เก็บ slug ก่อนหน้าไว้เป็น alias สำหรับเปลี่ยนเส้นทาง
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

แบนผู้ใช้และลบ Skills ที่เป็นเจ้าของแบบถาวร (เฉพาะผู้กลั่นกรอง/แอดมิน)

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

ยกเลิกแบนผู้ใช้และกู้คืน Skills ที่มีสิทธิ์ (เฉพาะแอดมิน)

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

เปลี่ยนบทบาทผู้ใช้ (เฉพาะแอดมิน)

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

แสดงรายการหรือค้นหาผู้ใช้ (เฉพาะแอดมิน)

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

เพิ่ม/ลบดาว (ไฮไลต์) ทั้งสองปลายทางเป็น idempotent

การตอบกลับ:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## ปลายทาง CLI แบบเก่า (เลิกใช้แล้ว)

ยังรองรับสำหรับเวอร์ชัน CLI เก่า:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

ดูแผนการลบได้ที่ `DEPRECATIONS.md`

## การค้นหา Registry (`/.well-known/clawhub.json`)

CLI สามารถค้นพบการตั้งค่า registry/auth จากไซต์ได้:

- `/.well-known/clawhub.json` (JSON, แนะนำ)
- `/.well-known/clawdhub.json` (แบบเก่า)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

หากคุณโฮสต์เอง ให้ให้บริการไฟล์นี้ (หรือตั้งค่า `CLAWHUB_REGISTRY` อย่างชัดเจน; แบบเก่า `CLAWDHUB_REGISTRY`)
