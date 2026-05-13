---
read_when:
    - การเพิ่ม/เปลี่ยนแปลงเอนด์พอยต์
    - การดีบักคำขอระหว่าง CLI ↔ รีจิสทรี
summary: เอกสารอ้างอิง HTTP API (ปลายทางสาธารณะ + ปลายทาง CLI + การตรวจสอบสิทธิ์).
x-i18n:
    generated_at: "2026-05-13T05:32:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1ea3f398107dd3a59fd870a3320ff8d76863a0b7995904e0e61b48d59f35a7d4
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

URL ฐาน: `https://clawhub.ai` (ค่าเริ่มต้น)

พาธ v1 ทั้งหมดอยู่ภายใต้ `/api/v1/...`
พาธเดิม `/api/...` และ `/api/cli/...` ยังคงอยู่เพื่อความเข้ากันได้ (ดู `DEPRECATIONS.md`)
OpenAPI: `/api/v1/openapi.json`

## การนำแค็ตตาล็อกสาธารณะกลับมาใช้ซ้ำ

ไดเรกทอรีของบุคคลที่สามอาจใช้ endpoint อ่านสาธารณะเพื่อแสดงรายการหรือค้นหา Skills ของ ClawHub ได้ โปรดแคชผลลัพธ์ เคารพ `429`/`Retry-After` ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub หลัก (`https://clawhub.ai/<owner>/<slug>`) และหลีกเลี่ยงการสื่อว่า ClawHub รับรองไซต์ของบุคคลที่สาม อย่าพยายามทำสำเนาเนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกโดยการกลั่นกรอง นอกเหนือจากพื้นผิว API สาธารณะ

ทางลัด slug บนเว็บจะ resolve ข้ามตระกูล registry ได้ แต่ client ของ API ควรใช้
URL หลักที่ endpoint อ่านส่งกลับมา แทนการสร้างลำดับความสำคัญของ route
ขึ้นใหม่เอง

## ขีดจำกัดอัตรา

โมเดลการบังคับใช้:

- คำขอแบบไม่ระบุตัวตน: บังคับใช้ต่อ IP
- คำขอที่ผ่านการรับรองตัวตนแล้ว (Bearer token ที่ถูกต้อง): บังคับใช้ต่อ bucket ของผู้ใช้
- หาก token ขาดหาย/ไม่ถูกต้อง พฤติกรรมจะ fallback ไปใช้การบังคับใช้ตาม IP
- endpoint สำหรับเขียนที่ผ่านการรับรองตัวตนแล้วไม่ควรส่งคืนเพียง `Unauthorized` แบบเปล่า ๆ เมื่อ
  เซิร์ฟเวอร์รู้เหตุผล token ที่ขาดหาย token ที่ไม่ถูกต้อง/ถูกเพิกถอน และ
  บัญชีที่ถูกลบ/ถูกแบน/ถูกปิดใช้งาน ควรได้รับข้อความที่นำไปดำเนินการได้แต่ละกรณี เพื่อให้ client
  CLI บอกผู้ใช้ได้ว่าอะไรบล็อกพวกเขา

- อ่าน: 600/นาที ต่อ IP, 2400/นาที ต่อ key
- เขียน: 45/นาที ต่อ IP, 180/นาที ต่อ key
- ดาวน์โหลด: 30/นาที ต่อ IP, 180/นาที ต่อ key (`/api/v1/download`)

Header:

- ความเข้ากันได้แบบเดิม: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- แบบมาตรฐาน: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- เมื่อเกิด `429`: `Retry-After`

ความหมายของ header:

- `X-RateLimit-Reset`: วินาที Unix epoch แบบสัมบูรณ์
- `RateLimit-Reset`: จำนวนวินาทีจนกว่าจะ reset (delay)
- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อน retry (delay) เมื่อเกิด `429`

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

คำแนะนำสำหรับ client:

- หากมี `Retry-After` ให้รอตามจำนวนวินาทีนั้นก่อน retry
- ใช้ backoff แบบมี jitter เพื่อหลีกเลี่ยงการ retry พร้อมกัน
- หากไม่มี `Retry-After` ให้ fallback ไปใช้ `RateLimit-Reset` (หรือคำนวณจาก `X-RateLimit-Reset`)

แหล่งที่มาของ IP:

- ใช้ `cf-connecting-ip` (Cloudflare) เป็น IP ของ client โดยค่าเริ่มต้น
- ClawHub ใช้ forwarding header ที่เชื่อถือได้เพื่อระบุ IP ของ client ที่ edge
- หากไม่มี IP ของ client ที่เชื่อถือได้ คำขอดาวน์โหลดแบบไม่ระบุตัวตนจะใช้ bucket fallback ที่ scoped ตาม endpoint แทน bucket `ip:unknown` กลาง bucket เดียว คำขออ่าน/เขียนแบบไม่ระบุตัวตนยังคงใช้ bucket unknown ที่แชร์กัน เพื่อให้การ routing ที่ไม่มี IP ยังคงมองเห็นได้และระมัดระวัง

## Endpoint สาธารณะ (ไม่ต้อง auth)

### `GET /api/v1/search`

Query params:

- `q` (จำเป็น): สตริง query
- `limit` (ไม่บังคับ): จำนวนเต็ม
- `highlightedOnly` (ไม่บังคับ): `true` เพื่อกรองให้เหลือเฉพาะ Skills ที่ถูกไฮไลต์
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias เดิมสำหรับ `nonSuspiciousOnly`

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

- ผลลัพธ์จะถูกส่งกลับตามลำดับความเกี่ยวข้อง (embedding similarity + การ boost token slug/name ที่ตรงแบบ exact + prior ความนิยมจากยอดดาวน์โหลด)
- ความเกี่ยวข้องมีน้ำหนักมากกว่าความนิยม slug ที่แม่นยำหรือ token display-name ที่ตรงกันสามารถอยู่เหนือ match ที่หลวมกว่าแม้มีจำนวนดาวน์โหลดมากกว่ามาก
- ข้อความ ASCII จะถูก tokenize ตามขอบเขตของคำและเครื่องหมายวรรคตอน ตัวอย่างเช่น `personal-map` มี token `map` แบบ standalone ขณะที่ `amap-jsapi-skill` มี `amap`, `jsapi` และ `skill`; ดังนั้นการค้นหา `map` จึงทำให้ `personal-map` มี lexical match ที่แข็งแรงกว่า `amap-jsapi-skill`
- ยอดดาวน์โหลดถูกใช้เป็น prior แบบ log-scaled ขนาดเล็กและตัวตัดสินเมื่อเท่ากัน ไม่ใช่สัญญาณหลักในการจัดอันดับ Skills ที่มียอดดาวน์โหลดสูงอาจอยู่ต่ำกว่าเมื่อข้อความ query match อ่อนกว่า
- สถานะการกลั่นกรองที่น่าสงสัยหรือซ่อนอยู่สามารถนำ Skill ออกจากการค้นหาสาธารณะได้ ขึ้นอยู่กับตัวกรองของผู้เรียกและสถานะการกลั่นกรองปัจจุบัน

คำแนะนำด้านการค้นพบสำหรับ publisher:

- ใส่คำที่ผู้ใช้จะค้นหาจริงใน display name, summary และ tags ใช้ token slug แบบ standalone เฉพาะเมื่อมันเป็นตัวตนที่เสถียรซึ่งคุณต้องการเก็บไว้ด้วย
- อย่าเปลี่ยนชื่อ slug เพียงเพื่อไล่ตาม query หนึ่งรายการ เว้นแต่ slug ใหม่จะเป็นชื่อหลักระยะยาวที่ดีกว่า slug เก่าจะกลายเป็น redirect alias แต่ URL หลัก, slug ที่แสดง และ digest การค้นหาในอนาคตจะใช้ slug ใหม่
- Rename alias จะรักษาการ resolve สำหรับ URL เก่าและการติดตั้งที่ resolve ผ่าน registry แต่การจัดอันดับการค้นหาจะอิงตาม metadata หลักของ Skill หลังจากการ rename ถูก index แล้ว สถิติที่มีอยู่จะยังอยู่กับ Skill
- หาก Skill หายไปโดยไม่คาดคิด ให้ตรวจสอบสถานะการกลั่นกรองก่อนด้วย `clawhub inspect <slug>` ขณะ logged in ก่อนเปลี่ยน metadata ที่เกี่ยวข้องกับการจัดอันดับ

### `GET /api/v1/skills`

Query params:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–200)
- `cursor` (ไม่บังคับ): pagination cursor สำหรับ sort ใด ๆ ที่ไม่ใช่ `trending`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias เดิมสำหรับ `nonSuspiciousOnly`

หมายเหตุ:

- `trending` จัดอันดับตาม installs ใน 7 วันที่ผ่านมา (อิง telemetry)
- `createdAt` เสถียรสำหรับ crawl Skill ใหม่; `updated` เปลี่ยนเมื่อ Skills ที่มีอยู่ถูก republish
- เมื่อ `nonSuspiciousOnly=true` sort แบบ cursor-based อาจส่งคืนรายการน้อยกว่า `limit` ในหน้าเดียว เพราะ Skills ที่น่าสงสัยถูกกรองหลังจากดึงหน้ามาแล้ว
- ใช้ `nextCursor` เพื่อดำเนิน pagination ต่อเมื่อมีอยู่ หน้าสั้นไม่ได้หมายความว่าสิ้นสุดผลลัพธ์ด้วยตัวเอง

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

- slug เก่าที่สร้างโดย flow การ rename/merge ของ owner จะ resolve ไปยัง Skill หลัก
- `metadata.os`: ข้อจำกัด OS ที่ประกาศใน frontmatter ของ Skill (เช่น `["macos"]`, `["linux"]`) เป็น `null` หากไม่ได้ประกาศ
- `metadata.systems`: target ระบบ Nix (เช่น `["aarch64-darwin", "x86_64-linux"]`) เป็น `null` หากไม่ได้ประกาศ
- `metadata` เป็น `null` หาก Skill ไม่มี metadata ของ platform
- `moderation` จะรวมอยู่เฉพาะเมื่อ Skill ถูก flag หรือ owner กำลังดูอยู่

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

- Owner และ moderator สามารถเข้าถึงรายละเอียดการกลั่นกรองสำหรับ Skills ที่ซ่อนอยู่ได้
- ผู้เรียกสาธารณะจะได้รับ `200` เฉพาะ Skills ที่มองเห็นได้และถูก flag แล้วเท่านั้น
- Evidence จะถูก redacted สำหรับผู้เรียกสาธารณะ และรวม raw snippets เฉพาะสำหรับ owner/moderator

### `POST /api/v1/skills/{slug}/report`

รายงาน Skill เพื่อให้ moderator ตรวจสอบ รายงานอยู่ในระดับ Skill อาจเชื่อมโยง
กับ version ได้ และป้อนเข้าสู่คิวรายงาน Skill

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

endpoint สำหรับ moderator/admin เพื่อรับรายงาน Skill

Query params:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `confirmed`, `dismissed` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-200)
- `cursor` (ไม่บังคับ): pagination cursor

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

endpoint สำหรับ moderator/admin เพื่อ resolve หรือ reopen รายงาน Skill

Request:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

ต้องระบุ `note` สำหรับ `confirmed` และ `dismissed`; อาจละเว้นได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "hide"` พร้อมรายงานที่ triage แล้ว
เพื่อซ่อน Skill ใน workflow เดียวกันที่ audit ได้

### `GET /api/v1/skills/{slug}/versions`

Query params:

- `limit` (ไม่บังคับ): จำนวนเต็ม
- `cursor` (ไม่บังคับ): pagination cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

ส่งคืน metadata ของ version + รายการไฟล์

- `version.security` รวมสถานะการตรวจสอบ scan ที่ normalize แล้วและรายละเอียด scanner
  (VirusTotal + LLM) เมื่อมี

### `GET /api/v1/skills/{slug}/scan`

ส่งคืนรายละเอียดการตรวจสอบ scan ด้านความปลอดภัยสำหรับ version ของ Skill

Query params:

- `version` (ไม่บังคับ): สตริง version เฉพาะ
- `tag` (ไม่บังคับ): resolve version ที่ tagged (ตัวอย่างเช่น `latest`)

หมายเหตุ:

- หากไม่มีทั้ง `version` และ `tag` จะใช้ version ล่าสุด
- รวมสถานะการตรวจสอบที่ normalize แล้ว พร้อมรายละเอียดเฉพาะ scanner
- `security.capabilityTags` รวมป้ายกำกับความสามารถ/ความเสี่ยงแบบ deterministic เช่น
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` และ `posts-externally` เมื่อตรวจพบ
- `security.hasScanResult` เป็น `true` เฉพาะเมื่อ scanner สร้าง verdict แบบ definitive (`clean`, `suspicious` หรือ `malicious`)
- `moderation` เป็น snapshot การกลั่นกรองระดับ Skill ปัจจุบันที่ derive จาก version ล่าสุด
- เมื่อ query version ย้อนหลัง ให้ตรวจสอบ `moderation.matchesRequestedVersion` และ `moderation.sourceVersion` ก่อนถือว่า `moderation` และ `security` อยู่ในบริบท version เดียวกัน

### `GET /api/v1/skills/{slug}/file`

ส่งคืนเนื้อหาข้อความ raw

Query params:

- `path` (จำเป็น)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นเป็น version ล่าสุด
- ขีดจำกัดขนาดไฟล์: 200KB

### `GET /api/v1/packages`

endpoint แค็ตตาล็อกรวมสำหรับ:

- Skills
- code plugins
- bundle plugins

Query params:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์สำหรับการแบ่งหน้า
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `executesCode` (ไม่บังคับ): `true` หรือ `false`
- `capabilityTag` (ไม่บังคับ): ตัวกรองความสามารถสำหรับแพ็กเกจ Plugin
- `target` / `hostTarget` (ไม่บังคับ): รูปย่อสำหรับ `host:<target>`
- `os`, `arch`, `libc` (ไม่บังคับ): รูปย่อสำหรับตัวกรองความสามารถของโฮสต์
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (ไม่บังคับ): รูปย่อ `true`/`1` สำหรับแท็กข้อกำหนดของสภาพแวดล้อม
- `externalService`, `binary`, `osPermission` (ไม่บังคับ): รูปย่อสำหรับแท็ก
  ข้อกำหนดของสภาพแวดล้อมแบบระบุชื่อ
- `artifactKind` (ไม่บังคับ): `legacy-zip` หรือ `npm-pack`
- `npmMirror` (ไม่บังคับ): `true`/`1` เพื่อแสดงเวอร์ชันแพ็กเกจที่รองรับโดย ClawPack
  ซึ่งพร้อมใช้งานผ่านมิเรอร์ npm

หมายเหตุ:

- `GET /api/v1/code-plugins` และ `GET /api/v1/bundle-plugins` ยังคงเป็นนามแฝงแบบตระกูลคงที่
- รายการ Skills ยังคงอิงจากรีจิสทรี Skills และยังเผยแพร่ได้ผ่าน `POST /api/v1/skills` เท่านั้น
- `POST /api/v1/packages` ยังคงใช้สำหรับรีลีส code-plugin และ bundle-plugin เท่านั้น
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะเท่านั้น
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถเห็นแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดในผลลัพธ์รายการ/การค้นหา
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ผ่านการยืนยันตัวตนมีสิทธิ์อ่านได้

### `GET /api/v1/packages/search`

การค้นหาแค็ตตาล็อกรวมทั่วทั้ง Skills + แพ็กเกจ Plugin

พารามิเตอร์คำค้น:

- `q` (จำเป็น): สตริงคำค้น
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
  ซึ่งพร้อมใช้งานผ่านมิเรอร์ npm

หมายเหตุ:

- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะเท่านั้น
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถค้นหาแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดได้
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ผ่านการยืนยันตัวตนมีสิทธิ์อ่านได้
- ตัวกรองอาร์ติแฟกต์อิงจากแท็กความสามารถที่ทำดัชนีไว้:
  `artifact:legacy-zip`, `artifact:npm-pack` และ `npm-mirror:available`

### `GET /api/v1/packages/{name}`

ส่งคืนเมตาดาต้ารายละเอียดของแพ็กเกจ

หมายเหตุ:

- Skills สามารถ resolve ผ่านเส้นทางนี้ในแค็ตตาล็อกรวมได้เช่นกัน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะมีสิทธิ์อ่านผู้เผยแพร่เจ้าของ

### `DELETE /api/v1/packages/{name}`

ลบแพ็กเกจและรีลีสทั้งหมดแบบ soft-delete

หมายเหตุ:

- ต้องใช้โทเค็น API สำหรับเจ้าของแพ็กเกจ เจ้าของ/ผู้ดูแลผู้เผยแพร่ขององค์กร
  ผู้ดูแลแพลตฟอร์ม หรือผู้ดูแลระบบแพลตฟอร์ม

### `GET /api/v1/packages/{name}/versions`

ส่งคืนประวัติเวอร์ชัน

พารามิเตอร์คำค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์สำหรับการแบ่งหน้า

หมายเหตุ:

- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะมีสิทธิ์อ่านผู้เผยแพร่เจ้าของ

### `GET /api/v1/packages/{name}/versions/{version}`

ส่งคืนเวอร์ชันแพ็กเกจหนึ่งรายการ รวมถึงเมตาดาต้าไฟล์ ความเข้ากันได้
ความสามารถ การตรวจสอบยืนยัน เมตาดาต้าอาร์ติแฟกต์ และข้อมูลการสแกน

หมายเหตุ:

- `version.artifact.kind` เป็น `legacy-zip` สำหรับไฟล์เก็บถาวรแพ็กเกจแบบเก่า หรือ
  `npm-pack` สำหรับรีลีสที่รองรับโดย ClawPack
- รีลีส ClawPack มีฟิลด์ `npmIntegrity`, `npmShasum` และ
  `npmTarballName` ที่เข้ากันได้กับ npm
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` และ `version.staticScan` จะรวมอยู่เมื่อมีข้อมูลการสแกน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะมีสิทธิ์อ่านผู้เผยแพร่เจ้าของ

### `GET /api/v1/packages/{name}/versions/{version}/security`

ส่งคืนสรุปความปลอดภัยและความน่าเชื่อถือของรีลีสแพ็กเกจที่แน่นอนสำหรับไคลเอนต์ติดตั้ง
นี่คือพื้นผิวการใช้งานสาธารณะของ OpenClaw สำหรับตัดสินใจว่า
รีลีสที่ resolve แล้วสามารถติดตั้งได้หรือไม่

การยืนยันตัวตน:

- ปลายทางอ่านแบบสาธารณะ ไม่จำเป็นต้องใช้โทเค็นเจ้าของ ผู้เผยแพร่ ผู้ดูแล หรือผู้ดูแลระบบ

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
  `release.npmShasum` และ `release.npmTarballName` จะมีอยู่เมื่อทราบข้อมูลสำหรับ
  อาร์ติแฟกต์ของรีลีส
- `trust.scanStatus` คือสถานะความน่าเชื่อถือที่มีผล ซึ่งได้มาจากข้อมูลของสแกนเนอร์
  และการกลั่นกรองรีลีสด้วยตนเอง
- `trust.moderationState` เป็น nullable โดยเป็น `null` เมื่อไม่มีการกลั่นกรองรีลีส
  ด้วยตนเอง
- `trust.blockedFromDownload` คือสัญญาณบล็อกการติดตั้ง OpenClaw และไคลเอนต์ติดตั้งอื่น
  ควรบล็อกการติดตั้งเมื่อค่านี้เป็น `true` แทนที่จะคำนวณกฎการบล็อกใหม่จากฟิลด์สแกนเนอร์
  หรือการกลั่นกรอง
- `trust.reasons` คือรายการคำอธิบายสำหรับผู้ใช้และการตรวจสอบย้อนหลัง รหัสเหตุผล
  เป็นสตริงที่เสถียรและกะทัดรัด เช่น `manual:quarantined`, `scan:malicious`,
  `static:malicious`, `vt:suspicious` และ `package:malicious`
- `trust.pending` หมายความว่าอินพุตความน่าเชื่อถือหนึ่งรายการขึ้นไปยังรอการดำเนินการให้เสร็จ
- `trust.stale` หมายความว่าสรุปความน่าเชื่อถือถูกคำนวณจากอินพุตที่ล้าสมัย และ
  ควรถือว่าต้องรีเฟรชก่อนตัดสินใจอนุญาตด้วยความมั่นใจสูง

หมายเหตุ:

- ปลายทางนี้เจาะจงเวอร์ชัน ไคลเอนต์ควรเรียกใช้หลังจาก resolve
  เวอร์ชันแพ็กเกจที่ตั้งใจจะติดตั้ง ไม่ใช่เพียงหลังจากอ่านเมตาดาต้าแพ็กเกจล่าสุด
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะมีสิทธิ์อ่านผู้เผยแพร่เจ้าของ
- ปลายทางนี้ตั้งใจให้แคบกว่าปลายทางการกลั่นกรองของเจ้าของ/ผู้ดูแล
  โดยเปิดเผยการตัดสินใจติดตั้งและคำอธิบายสาธารณะ ไม่ใช่ตัวตนผู้รายงาน
  เนื้อหารายงาน หลักฐานส่วนตัว หรือไทม์ไลน์การตรวจสอบภายใน

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

ส่งคืนเมตาดาต้าตัว resolve อาร์ติแฟกต์แบบชัดเจนสำหรับเวอร์ชันแพ็กเกจ

หมายเหตุ:

- เวอร์ชันแพ็กเกจแบบเก่าจะส่งคืนอาร์ติแฟกต์ `legacy-zip` และ
  `downloadUrl` ของ ZIP แบบเก่า
- เวอร์ชัน ClawPack จะส่งคืนอาร์ติแฟกต์ `npm-pack` ฟิลด์ความสมบูรณ์ของ npm
  `tarballUrl` และ URL ความเข้ากันได้กับ ZIP แบบเก่า
- นี่คือพื้นผิวตัว resolve ของ OpenClaw โดยหลีกเลี่ยงการเดารูปแบบไฟล์เก็บถาวรจาก
  URL ที่ใช้ร่วมกัน

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ดาวน์โหลดอาร์ติแฟกต์ของเวอร์ชันผ่านเส้นทางตัว resolve แบบชัดเจน

หมายเหตุ:

- เวอร์ชัน ClawPack สตรีมไบต์ `.tgz` ของ npm-pack ที่อัปโหลดไว้อย่างแน่นอน
- เวอร์ชัน ZIP แบบเก่าจะเปลี่ยนเส้นทางไปยัง `/api/v1/packages/{name}/download?version=`
- ใช้บักเก็ตอัตราการดาวน์โหลด

### `GET /api/v1/packages/{name}/readiness`

ส่งคืนความพร้อมที่คำนวณแล้วสำหรับการใช้งาน OpenClaw ในอนาคต

การตรวจสอบความพร้อมครอบคลุม:

- สถานะช่องทางทางการ
- ความพร้อมใช้งานของเวอร์ชันล่าสุด
- ความพร้อมใช้งานของอาร์ติแฟกต์ npm-pack ของ ClawPack
- ไดเจสต์อาร์ติแฟกต์
- ที่มาของ repo ต้นทางและคอมมิต
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

- ต้องใช้โทเค็น API สำหรับผู้ใช้ผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คำค้น:

- `phase` (ไม่บังคับ): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` หรือ
  `all` (ค่าเริ่มต้น)
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์สำหรับการแบ่งหน้า

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
- `packageName` ถูกปรับให้อยู่ในรูปแบบชื่อ npm; แพ็กเกจอาจยังไม่มีสำหรับ
  การย้ายที่วางแผนไว้
- ส่วนนี้ติดตามเฉพาะความพร้อมในการย้ายเท่านั้น ไม่ได้เปลี่ยนแปลง OpenClaw หรือสร้าง
  ClawPacks

### `GET /api/v1/packages/moderation/queue`

ปลายทางผู้ดูแล/ผู้ดูแลระบบสำหรับคิวการตรวจสอบรีลีสแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คำค้น:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `blocked`, `manual` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์สำหรับการแบ่งหน้า

ความหมายของสถานะ:

- `open`: รีลีสที่น่าสงสัย เป็นอันตราย รอดำเนินการ ถูกกักกัน ถูกเพิกถอน หรือถูกรายงาน
- `blocked`: รีลีสที่ถูกกักกัน ถูกเพิกถอน หรือเป็นอันตราย
- `manual`: รีลีสใดก็ตามที่มีการแทนที่การกลั่นกรองด้วยตนเอง
- `all`: รีลีสใดก็ตามที่มีการแทนที่ด้วยตนเอง สถานะการสแกนที่ไม่สะอาด หรือรายงานแพ็กเกจ

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
ลิงก์กับเวอร์ชันได้ รายงานเหล่านี้จะเข้าสู่คิวการกลั่นกรอง แต่ไม่ได้ซ่อนอัตโนมัติหรือ
บล็อกการดาวน์โหลดด้วยตัวเอง ผู้ดูแลควรใช้การกลั่นกรองรีลีสเพื่อ
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

ปลายทางสำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อรับรายงานแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API ของผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

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

ปลายทางสำหรับเจ้าของ/ผู้ดูแลเพื่อมองเห็นการกลั่นกรองแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API ของเจ้าของแพ็กเกจ สมาชิกผู้เผยแพร่ ผู้ดูแล หรือ
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

ปลายทางสำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อปิดหรือเปิดรายงานแพ็กเกจอีกครั้ง

คำขอ:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

ต้องระบุ `note` สำหรับ `confirmed` และ `dismissed`; อาจละเว้นได้เมื่อ
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

ปลายทางสำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อตรวจสอบรีลีสของแพ็กเกจ

คำขอ:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

สถานะที่รองรับ:

- `approved`: ตรวจสอบด้วยตนเองและอนุญาตแล้ว
- `quarantined`: ถูกบล็อกระหว่างรอการติดตามผล
- `revoked`: ถูกบล็อกหลังจากรีลีสเคยได้รับความเชื่อถือแล้ว

รีลีสที่ถูกกักกันและเพิกถอนจะส่งคืน `403` จากเส้นทางดาวน์โหลดอาร์ติแฟกต์
ทุกการเปลี่ยนแปลงจะเขียนรายการบันทึกการตรวจสอบ

### `POST /api/v1/packages/backfill/artifacts`

ปลายทางบำรุงรักษาสำหรับผู้ดูแลระบบเท่านั้น เพื่อใส่ป้ายกำกับรีลีสแพ็กเกจเก่าด้วย
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

- ค่าเริ่มต้นเป็นการรันแบบทดลอง
- รีลีสที่ไม่มีพื้นที่จัดเก็บ ClawPack จะถูกติดป้ายเป็น `legacy-zip`
- แถวที่อิง ClawPack อยู่แล้วแต่ไม่มี `artifactKind` จะถูกซ่อมเป็น
  `npm-pack`
- สิ่งนี้ไม่ได้สร้าง ClawPack หรือแก้ไขไบต์ของอาร์ติแฟกต์

### `GET /api/v1/packages/{name}/file`

ส่งคืนเนื้อหาข้อความดิบสำหรับไฟล์แพ็กเกจ

พารามิเตอร์คิวรี:

- `path` (จำเป็น)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นเป็นรีลีสล่าสุด
- ใช้บัคเก็ตอัตราการอ่าน ไม่ใช่บัคเก็ตดาวน์โหลด
- ไฟล์ไบนารีส่งคืน `415`
- ขีดจำกัดขนาดไฟล์: 200KB
- การสแกน VirusTotal ที่รอดำเนินการไม่บล็อกการอ่าน รีลีสที่เป็นอันตรายอาจยังถูกระงับไว้ที่อื่น
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่เจ้าของได้

### `GET /api/v1/packages/{name}/download`

ดาวน์โหลดไฟล์ ZIP แบบกำหนดแน่นอนรุ่นเดิมสำหรับรีลีสแพ็กเกจ

พารามิเตอร์คิวรี:

- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นเป็นรีลีสล่าสุด
- Skills เปลี่ยนเส้นทางไปยัง `GET /api/v1/download`
- ไฟล์เก็บถาวรของ Plugin/แพ็กเกจเป็นไฟล์ zip ที่มีราก `package/` เพื่อให้ไคลเอนต์ OpenClaw
  รุ่นเก่ายังคงทำงานได้
- เส้นทางนี้คงไว้เป็น ZIP เท่านั้น ไม่สตรีมไฟล์ ClawPack `.tgz`
- การตอบกลับมีส่วนหัว `ETag`, `Digest`, `X-ClawHub-Artifact-Type` และ
  `X-ClawHub-Artifact-Sha256` สำหรับการตรวจสอบความสมบูรณ์ของตัวแก้ไข
- เมตาดาต้าที่มีเฉพาะในรีจิสทรีจะไม่ถูกฉีดเข้าไปในไฟล์เก็บถาวรที่ดาวน์โหลด
- การสแกน VirusTotal ที่รอดำเนินการไม่บล็อกการดาวน์โหลด รีลีสที่เป็นอันตรายส่งคืน `403`
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะเป็นเจ้าของ

### `GET /api/npm/{package}`

ส่งคืน packument ที่เข้ากันได้กับ npm สำหรับเวอร์ชันแพ็กเกจที่อิง ClawPack

หมายเหตุ:

- แสดงเฉพาะเวอร์ชันที่มี ClawPack npm-pack tarball ที่อัปโหลดแล้ว
- เวอร์ชันเดิมที่มีเฉพาะ ZIP จะถูกละไว้โดยเจตนา
- `dist.tarball`, `dist.integrity` และ `dist.shasum` ใช้ฟิลด์ที่เข้ากันได้กับ npm
  เพื่อให้ผู้ใช้ชี้ npm ไปที่มิเรอร์ได้หากต้องการ
- packument ของแพ็กเกจแบบ scoped รองรับทั้ง `/api/npm/@scope/name` และเส้นทางคำขอ
  ที่เข้ารหัสแบบ npm `/api/npm/@scope%2Fname`

### `GET /api/npm/{package}/-/{tarball}.tgz`

สตรีมไบต์ ClawPack tarball ที่อัปโหลดไว้จริงสำหรับไคลเอนต์มิเรอร์ npm

หมายเหตุ:

- ใช้บัคเก็ตอัตราการดาวน์โหลด
- ส่วนหัวดาวน์โหลดมี SHA-256 ของ ClawHub พร้อมเมตาดาต้า integrity/shasum ของ npm
- การกลั่นกรองและการตรวจสอบสิทธิ์เข้าถึงแพ็กเกจส่วนตัวยังคงมีผล

### `GET /api/v1/resolve`

CLI ใช้เพื่อแมปลายนิ้วมือในเครื่องกับเวอร์ชันที่รู้จัก

พารามิเตอร์คิวรี:

- `slug` (จำเป็น)
- `hash` (จำเป็น): sha256 ฐานสิบหก 64 อักขระของลายนิ้วมือบันเดิล

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
- สถิติการดาวน์โหลดนับเป็นตัวตนที่ไม่ซ้ำต่อชั่วโมง (`userId` เมื่อโทเค็น API ถูกต้อง มิฉะนั้นใช้ IP)

## ปลายทางการยืนยันตัวตน (Bearer token)

ทุกปลายทางต้องมี:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

ตรวจสอบโทเค็นและส่งคืนแฮนเดิลผู้ใช้

### `POST /api/v1/skills`

เผยแพร่เวอร์ชันใหม่

- แนะนำ: `multipart/form-data` พร้อม JSON `payload` + blob `files[]`
- ยอมรับเนื้อหา JSON ที่มี `files` (อิง storageId) ด้วย
- ฟิลด์ payload ไม่บังคับ: `ownerHandle` เมื่อมีฟิลด์นี้ API จะ resolve
  ผู้เผยแพร่นั้นทางฝั่งเซิร์ฟเวอร์ และกำหนดให้ actor ต้องมีสิทธิ์เข้าถึงผู้เผยแพร่
- ฟิลด์ payload ไม่บังคับ: `migrateOwner` เมื่อเป็น `true` พร้อม `ownerHandle`
  Skills ที่มีอยู่สามารถย้ายไปยังเจ้าของนั้นได้ หาก actor เป็นผู้ดูแลระบบ/เจ้าของบนทั้ง
  ผู้เผยแพร่ปัจจุบันและผู้เผยแพร่เป้าหมาย หากไม่มีการเลือกใช้ตัวเลือกนี้ การเปลี่ยนเจ้าของจะ
  ถูกปฏิเสธ

### `POST /api/v1/packages`

เผยแพร่รีลีส code-plugin หรือ bundle-plugin

- ต้องใช้การยืนยันตัวตนด้วย Bearer token
- แนะนำ: `multipart/form-data` พร้อม JSON `payload` + blob `files[]`
- ยอมรับเนื้อหา JSON ที่มี `files` (อิง storageId) ด้วย
- ฟิลด์ payload ไม่บังคับ: `ownerHandle` เมื่อมีฟิลด์นี้ เฉพาะผู้ดูแลระบบเท่านั้นที่เผยแพร่ในนามเจ้าของนั้นได้

ไฮไลต์การตรวจสอบความถูกต้อง:

- `family` ต้องเป็น `code-plugin` หรือ `bundle-plugin`
- แพ็กเกจ Plugin ต้องมี `openclaw.plugin.json` การอัปโหลด ClawPack `.tgz` ต้อง
  มีไฟล์นี้ที่ `package/openclaw.plugin.json`
- Code Plugin ต้องมี `package.json`, เมตาดาต้ารีโพซิทอรีซอร์ส, เมตาดาต้าคอมมิตซอร์ส,
  เมตาดาต้า config schema, `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion`
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมตาดาต้าไม่บังคับ
- เฉพาะผู้เผยแพร่ที่เชื่อถือได้เท่านั้นที่เผยแพร่ไปยังช่องทาง `official` ได้
- การเผยแพร่ในนามผู้อื่นยังคงตรวจสอบสิทธิ์เผยแพร่ช่องทาง official กับบัญชีเจ้าของเป้าหมาย

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

ลบแบบ soft-delete / กู้คืน Skills (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)

เนื้อหา JSON ไม่บังคับ:

```json
{ "reason": "Held for moderation pending legal review." }
```

เมื่อมี `reason` จะถูกจัดเก็บเป็นหมายเหตุการกลั่นกรองของ Skills และคัดลอกลงในบันทึกการตรวจสอบ
การลบแบบ soft-delete ที่เริ่มโดยเจ้าของจะสงวน slug ไว้ 30 วัน จากนั้นผู้เผยแพร่รายอื่น
จึงสามารถอ้างสิทธิ์ slug ได้ การตอบกลับการลบมี `slugReservedUntil` เมื่อมีวันหมดอายุนี้
การซ่อนโดยผู้ดูแล/ผู้ดูแลระบบและการนำออกด้านความปลอดภัยจะไม่หมดอายุแบบนี้

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

สำหรับผู้ดูแลระบบเท่านั้น ตรวจให้แน่ใจว่ามีผู้เผยแพร่แบบองค์กรสำหรับแฮนเดิล หากแฮนเดิลยังชี้ไปที่
ผู้เผยแพร่ผู้ใช้ที่ใช้ร่วมกันรุ่นเดิม/ผู้เผยแพร่ส่วนบุคคล ปลายทางจะย้ายเป็นผู้เผยแพร่แบบองค์กรก่อน

- เนื้อหา: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- การตอบกลับ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

สำหรับผู้ดูแลระบบเท่านั้น สงวน root slug และชื่อแพ็กเกจให้เจ้าของที่ถูกต้องโดยไม่เผยแพร่
รีลีส ชื่อแพ็กเกจจะกลายเป็นแพ็กเกจ placeholder ส่วนตัวที่ไม่มีแถวรีลีส เพื่อให้เจ้าของเดิม
สามารถเผยแพร่รีลีส code-plugin หรือ bundle-plugin จริงลงในชื่อนั้นได้ภายหลัง

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

- ทั้งสองปลายทางต้องใช้การยืนยันตัวตนด้วยโทเค็น API และทำงานได้เฉพาะกับเจ้าของ Skills
- `rename` รักษา slug ก่อนหน้าไว้เป็นนามแฝงสำหรับเปลี่ยนเส้นทาง
- `merge` ซ่อนรายการต้นทางและเปลี่ยนเส้นทาง slug ต้นทางไปยังรายการเป้าหมาย

### ปลายทางการโอนความเป็นเจ้าของ

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

แบนผู้ใช้และลบ Skills ที่เป็นเจ้าของอย่างถาวร (เฉพาะผู้ดูแล/ผู้ดูแลระบบเท่านั้น)

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

ยกเลิกการแบนผู้ใช้และกู้คืน Skills ที่เข้าเงื่อนไข (เฉพาะผู้ดูแลระบบเท่านั้น)

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

เปลี่ยนบทบาทผู้ใช้ (เฉพาะผู้ดูแลระบบเท่านั้น)

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

แสดงรายการหรือค้นหาผู้ใช้ (เฉพาะผู้ดูแลระบบเท่านั้น)

พารามิเตอร์ Query:

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

เพิ่ม/ลบดาว (ไฮไลต์) ปลายทางทั้งสองเป็นแบบ idempotent

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
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

ดูแผนการนำออกได้ที่ `DEPRECATIONS.md`

## การค้นพบ Registry (`/.well-known/clawhub.json`)

CLI สามารถค้นพบการตั้งค่า registry/auth จากไซต์ได้:

- `/.well-known/clawhub.json` (JSON, แนะนำ)
- `/.well-known/clawdhub.json` (แบบเดิม)

สคีมา:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

หากคุณโฮสต์เอง ให้ให้บริการไฟล์นี้ (หรือตั้งค่า `CLAWHUB_REGISTRY` อย่างชัดเจน; แบบเดิมคือ `CLAWDHUB_REGISTRY`)
