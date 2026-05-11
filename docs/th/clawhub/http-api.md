---
read_when:
    - การเพิ่ม/เปลี่ยนแปลงจุดปลายทาง
    - การดีบักคำขอระหว่าง CLI ↔ รีจิสทรี
summary: เอกสารอ้างอิง HTTP API (สาธารณะ + จุดปลายทาง CLI + การยืนยันตัวตน).
x-i18n:
    generated_at: "2026-05-11T22:19:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

URL ฐาน: `https://clawhub.ai` (ค่าเริ่มต้น).

เส้นทาง v1 ทั้งหมดอยู่ภายใต้ `/api/v1/...`.
เส้นทางเดิม `/api/...` และ `/api/cli/...` ยังคงอยู่เพื่อความเข้ากันได้ (ดู `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## การนำแค็ตตาล็อกสาธารณะกลับมาใช้

ไดเรกทอรีของบุคคลที่สามอาจใช้ endpoint อ่านสาธารณะเพื่อแสดงรายการหรือค้นหา Skills ของ ClawHub โปรดแคชผลลัพธ์ เคารพ `429`/`Retry-After` ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ต้นทางที่เป็นมาตรฐาน (`https://clawhub.ai/<owner>/<slug>`) และหลีกเลี่ยงการสื่อว่า ClawHub รับรองไซต์บุคคลที่สามนั้น อย่าพยายามทำสำเนาเนื้อหาที่ถูกซ่อน เป็นส่วนตัว หรือถูกบล็อกโดยการดูแลออกนอกพื้นผิว API สาธารณะ

ทางลัด slug บนเว็บ resolve ข้ามตระกูล registry ได้ แต่ client ของ API ควรใช้
URL มาตรฐานที่ endpoint อ่านส่งกลับมา แทนการสร้างลำดับความสำคัญของ route
ขึ้นใหม่เอง

## ขีดจำกัดอัตรา

โมเดลการบังคับใช้:

- คำขอแบบไม่ระบุตัวตน: บังคับใช้ต่อ IP
- คำขอที่ผ่านการยืนยันตัวตน (Bearer token ที่ถูกต้อง): บังคับใช้ต่อ bucket ของผู้ใช้
- หาก token หายไป/ไม่ถูกต้อง พฤติกรรมจะถอยกลับไปใช้การบังคับใช้ตาม IP
- endpoint เขียนที่ผ่านการยืนยันตัวตนไม่ควรส่งคืนเพียง `Unauthorized` เปล่า ๆ เมื่อ
  server รู้เหตุผล token ที่ขาดหายไป token ที่ไม่ถูกต้อง/ถูกเพิกถอน และ
  บัญชีที่ถูกลบ/แบน/ปิดใช้งาน ควรได้รับข้อความที่นำไปดำเนินการได้ เพื่อให้ client
  CLI บอกผู้ใช้ได้ว่าอะไรบล็อกพวกเขาอยู่

- อ่าน: 600/นาที ต่อ IP, 2400/นาที ต่อ key
- เขียน: 45/นาที ต่อ IP, 180/นาที ต่อ key
- ดาวน์โหลด: 30/นาที ต่อ IP, 180/นาที ต่อ key (`/api/v1/download`)

Header:

- ความเข้ากันได้แบบเดิม: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- แบบมาตรฐาน: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- เมื่อเป็น `429`: `Retry-After`

ความหมายของ header:

- `X-RateLimit-Reset`: วินาที Unix epoch แบบสัมบูรณ์
- `RateLimit-Reset`: จำนวนวินาทีจนกว่าจะรีเซ็ต (หน่วงเวลา)
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

คำแนะนำสำหรับ client:

- หากมี `Retry-After` ให้รอจำนวนวินาทีนั้นก่อนลองใหม่
- ใช้ backoff พร้อม jitter เพื่อหลีกเลี่ยงการลองใหม่พร้อมกัน
- หากไม่มี `Retry-After` ให้ fallback ไปใช้ `RateLimit-Reset` (หรือคำนวณจาก `X-RateLimit-Reset`)

แหล่งที่มาของ IP:

- ใช้ `cf-connecting-ip` (Cloudflare) เป็น IP ของ client โดยค่าเริ่มต้น
- ClawHub ใช้ header การส่งต่อที่เชื่อถือได้เพื่อระบุ IP ของ client ที่ edge
- หากไม่มี IP ของ client ที่เชื่อถือได้ คำขอดาวน์โหลดแบบไม่ระบุตัวตนจะใช้ bucket fallback ที่ผูกกับ endpoint แทน bucket `ip:unknown` ส่วนกลางเดียว คำขออ่าน/เขียนแบบไม่ระบุตัวตนยังคงใช้ bucket unknown ที่ใช้ร่วมกัน เพื่อให้ routing ที่ไม่มี IP ยังคงมองเห็นได้และระมัดระวัง

## Endpoint สาธารณะ (ไม่ต้องยืนยันตัวตน)

### `GET /api/v1/search`

พารามิเตอร์ query:

- `q` (จำเป็น): สตริง query
- `limit` (ไม่บังคับ): จำนวนเต็ม
- `highlightedOnly` (ไม่บังคับ): `true` เพื่อกรองให้เหลือเฉพาะ Skills ที่ถูกไฮไลต์
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

- ผลลัพธ์จะถูกส่งคืนตามลำดับความเกี่ยวข้อง (ความคล้ายของ embedding + การ boost token ของ slug/name ที่ตรงแบบ exact + prior ด้านความนิยมจาก downloads)
- ความเกี่ยวข้องมีน้ำหนักมากกว่าความนิยม การตรงกับ slug หรือ token ของ display-name อย่างแม่นยำสามารถจัดอันดับสูงกว่าการตรงแบบหลวมกว่าที่มี downloads มากกว่ามากได้
- ข้อความ ASCII จะถูก tokenize ตามขอบเขตของคำและเครื่องหมายวรรคตอน ตัวอย่างเช่น `personal-map` มี token `map` แบบ standalone ขณะที่ `amap-jsapi-skill` มี `amap`, `jsapi` และ `skill`; ดังนั้นการค้นหา `map` จะทำให้ `personal-map` มี lexical match ที่แข็งแรงกว่า `amap-jsapi-skill`
- Downloads ถูกใช้เป็น prior แบบ log-scale ขนาดเล็กและตัวตัดสินเมื่อคะแนนเสมอ ไม่ใช่สัญญาณจัดอันดับหลัก Skills ที่มี downloads สูงอาจจัดอันดับต่ำกว่าเมื่อข้อความ query ตรงอ่อนกว่า
- สถานะการดูแลที่น่าสงสัยหรือซ่อนอยู่สามารถลบ Skill ออกจากการค้นหาสาธารณะได้ ขึ้นอยู่กับตัวกรองของผู้เรียกและสถานะการดูแลปัจจุบัน

คำแนะนำด้านการค้นพบสำหรับ publisher:

- ใส่คำที่ผู้ใช้จะค้นหาจริงไว้ใน display name, summary และ tags ใช้ token slug แบบ standalone เฉพาะเมื่อมันเป็นตัวตนที่เสถียรซึ่งคุณต้องการเก็บไว้ด้วย
- อย่าเปลี่ยนชื่อ slug เพียงเพื่อไล่ตาม query หนึ่งรายการ เว้นแต่ slug ใหม่จะเป็นชื่อมาตรฐานระยะยาวที่ดีกว่า slug เก่าจะกลายเป็น redirect aliases แต่ URL มาตรฐาน slug ที่แสดง และ search digest ในอนาคตจะใช้ slug ใหม่
- rename aliases จะคงการ resolve สำหรับ URL เก่าและการติดตั้งที่ resolve ผ่าน registry แต่การจัดอันดับการค้นหาจะอิงจาก metadata ของ Skill มาตรฐานหลังจากการ rename ถูก index แล้ว สถิติเดิมจะยังอยู่กับ Skill
- หาก Skill มองไม่เห็นโดยไม่คาดคิด ให้ตรวจสอบสถานะการดูแลก่อนด้วย `clawhub inspect <slug>` ขณะเข้าสู่ระบบ ก่อนเปลี่ยน metadata ที่เกี่ยวข้องกับการจัดอันดับ

### `GET /api/v1/skills`

พารามิเตอร์ query:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–200)
- `cursor` (ไม่บังคับ): cursor สำหรับ pagination สำหรับ sort ใด ๆ ที่ไม่ใช่ `trending`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): alias เดิมของ `nonSuspiciousOnly`

หมายเหตุ:

- `trending` จัดอันดับตาม installs ในช่วง 7 วันที่ผ่านมา (อิง telemetry)
- `createdAt` มีความเสถียรสำหรับ crawl Skill ใหม่; `updated` จะเปลี่ยนเมื่อ Skills ที่มีอยู่ถูกเผยแพร่ใหม่
- เมื่อ `nonSuspiciousOnly=true` sort แบบใช้ cursor อาจส่งคืนรายการน้อยกว่า `limit` ในหนึ่งหน้า เพราะ Skills ที่น่าสงสัยถูกกรองหลังจากดึงหน้าแล้ว
- ใช้ `nextCursor` เพื่อทำ pagination ต่อเมื่อมีอยู่ หน้าที่สั้นไม่ได้หมายความว่าถึงจุดสิ้นสุดของผลลัพธ์เสมอไป

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

- slug เก่าที่สร้างจาก flow การ rename/merge ของ owner จะ resolve ไปยัง Skill มาตรฐาน
- `metadata.os`: ข้อจำกัด OS ที่ประกาศใน frontmatter ของ Skill (เช่น `["macos"]`, `["linux"]`) `null` หากไม่ได้ประกาศ
- `metadata.systems`: เป้าหมายระบบ Nix (เช่น `["aarch64-darwin", "x86_64-linux"]`) `null` หากไม่ได้ประกาศ
- `metadata` เป็น `null` หาก Skill ไม่มี metadata ของ platform
- `moderation` จะถูกรวมไว้เฉพาะเมื่อ Skill ถูก flag หรือ owner กำลังดูอยู่

### `GET /api/v1/skills/{slug}/moderation`

ส่งคืนสถานะการดูแลแบบมีโครงสร้าง

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

- Owner และ moderator สามารถเข้าถึงรายละเอียดการดูแลสำหรับ Skills ที่ซ่อนได้
- ผู้เรียกสาธารณะจะได้รับ `200` เฉพาะสำหรับ Skills ที่มองเห็นได้และถูก flag แล้ว
- หลักฐานจะถูก redacted สำหรับผู้เรียกสาธารณะ และรวม raw snippets เฉพาะสำหรับ owner/moderator เท่านั้น

### `POST /api/v1/skills/{slug}/report`

รายงาน Skill เพื่อให้ moderator ตรวจสอบ รายงานอยู่ในระดับ Skill อาจเชื่อมโยง
กับ version ได้ และป้อนเข้าสู่คิวรายงาน Skill

การยืนยันตัวตน:

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

พารามิเตอร์ query:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `confirmed`, `dismissed` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-200)
- `cursor` (ไม่บังคับ): cursor สำหรับ pagination

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

ต้องมี `note` สำหรับ `confirmed` และ `dismissed`; สามารถละเว้นได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "hide"` พร้อมรายงานที่ผ่านการ triage
เพื่อซ่อน Skill ใน workflow เดียวกันที่ตรวจสอบย้อนหลังได้

### `GET /api/v1/skills/{slug}/versions`

พารามิเตอร์ query:

- `limit` (ไม่บังคับ): จำนวนเต็ม
- `cursor` (ไม่บังคับ): cursor สำหรับ pagination

### `GET /api/v1/skills/{slug}/versions/{version}`

ส่งคืน metadata ของ version + รายการไฟล์

- `version.security` รวมสถานะการยืนยัน scan ที่ถูก normalize และรายละเอียด scanner
  (VirusTotal + LLM) เมื่อมี

### `GET /api/v1/skills/{slug}/scan`

ส่งคืนรายละเอียดการยืนยันการ scan ความปลอดภัยสำหรับ version ของ Skill

พารามิเตอร์ query:

- `version` (ไม่บังคับ): สตริง version เฉพาะ
- `tag` (ไม่บังคับ): resolve version ที่ติด tag (ตัวอย่างเช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` หรือ `tag` จะใช้ version ล่าสุด
- รวมสถานะการยืนยันที่ถูก normalize พร้อมรายละเอียดเฉพาะ scanner
- `security.capabilityTags` รวมป้ายกำกับ capability/risk แบบ deterministic เช่น
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` และ `posts-externally` เมื่อตรวจพบ
- `security.hasScanResult` เป็น `true` เฉพาะเมื่อ scanner สร้าง verdict ที่ชัดเจน (`clean`, `suspicious` หรือ `malicious`)
- `moderation` เป็น snapshot การดูแลระดับ Skill ปัจจุบันที่ได้มาจาก version ล่าสุด
- เมื่อ query version ในอดีต ให้ตรวจสอบ `moderation.matchesRequestedVersion` และ `moderation.sourceVersion` ก่อนถือว่า `moderation` และ `security` อยู่ในบริบท version เดียวกัน

### `GET /api/v1/skills/{slug}/file`

ส่งคืนเนื้อหาข้อความ raw

พารามิเตอร์ query:

- `path` (จำเป็น)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือ version ล่าสุด
- ขีดจำกัดขนาดไฟล์: 200KB

### `GET /api/v1/packages`

endpoint แค็ตตาล็อกแบบรวมสำหรับ:

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
- `target` / `hostTarget` (ไม่บังคับ): รูปย่อสำหรับ `host:<target>`
- `os`, `arch`, `libc` (ไม่บังคับ): รูปย่อสำหรับตัวกรองความสามารถของโฮสต์
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (ไม่บังคับ): รูปย่อ `true`/`1` สำหรับแท็กข้อกำหนดของสภาพแวดล้อม
- `externalService`, `binary`, `osPermission` (ไม่บังคับ): รูปย่อสำหรับแท็ก
  ข้อกำหนดของสภาพแวดล้อมที่ระบุชื่อ
- `artifactKind` (ไม่บังคับ): `legacy-zip` หรือ `npm-pack`
- `npmMirror` (ไม่บังคับ): `true`/`1` เพื่อแสดงเวอร์ชันแพ็กเกจที่รองรับโดย ClawPack
  ซึ่งพร้อมใช้งานผ่านมิเรอร์ npm

หมายเหตุ:

- `GET /api/v1/code-plugins` และ `GET /api/v1/bundle-plugins` ยังคงเป็น alias แบบ fixed-family
- รายการ Skill ยังคงรองรับโดยรีจิสทรีของ Skill และยังเผยแพร่ได้ผ่าน `POST /api/v1/skills` เท่านั้น
- `POST /api/v1/packages` ยังคงใช้สำหรับรุ่นเผยแพร่ของ code-plugin และ bundle-plugin เท่านั้น
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องแพ็กเกจสาธารณะเท่านั้น
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถเห็นแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดอยู่ในผลลัพธ์รายการ/การค้นหา
- `channel=private` จะคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ผ่านการยืนยันตัวตนมีสิทธิ์อ่านได้เท่านั้น

### `GET /api/v1/packages/search`

การค้นหาแคตตาล็อกแบบรวมสำหรับ skills + แพ็กเกจ Plugin

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
  `osPermission` รับเป็นรูปย่อสำหรับแท็กความสามารถทั่วไป
- `artifactKind` (ไม่บังคับ): `legacy-zip` หรือ `npm-pack`
- `npmMirror` (ไม่บังคับ): `true`/`1` เพื่อค้นหาเวอร์ชันแพ็กเกจที่รองรับโดย ClawPack
  ซึ่งพร้อมใช้งานผ่านมิเรอร์ npm

หมายเหตุ:

- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องแพ็กเกจสาธารณะเท่านั้น
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถค้นหาแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดอยู่ได้
- `channel=private` จะคืนเฉพาะแพ็กเกจที่ผู้เรียกที่ผ่านการยืนยันตัวตนมีสิทธิ์อ่านได้เท่านั้น
- ตัวกรองอาร์ติแฟกต์รองรับโดยแท็กความสามารถที่ทำดัชนีไว้:
  `artifact:legacy-zip`, `artifact:npm-pack` และ `npm-mirror:available`

### `GET /api/v1/packages/{name}`

คืนเมทาดาทารายละเอียดแพ็กเกจ

หมายเหตุ:

- Skills ยังสามารถ resolve ผ่านเส้นทางนี้ในแคตตาล็อกแบบรวมได้ด้วย
- แพ็กเกจส่วนตัวจะคืน `404` เว้นแต่ผู้เรียกจะมีสิทธิ์อ่านผู้เผยแพร่เจ้าของ

### `DELETE /api/v1/packages/{name}`

ลบแพ็กเกจและรุ่นเผยแพร่ทั้งหมดแบบ soft-delete

หมายเหตุ:

- ต้องใช้โทเค็น API สำหรับเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลผู้เผยแพร่ระดับองค์กร,
  ผู้ดูแลแพลตฟอร์ม หรือผู้ดูแลระบบแพลตฟอร์ม

### `GET /api/v1/packages/{name}/versions`

คืนประวัติเวอร์ชัน

พารามิเตอร์คิวรี:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

หมายเหตุ:

- แพ็กเกจส่วนตัวจะคืน `404` เว้นแต่ผู้เรียกจะมีสิทธิ์อ่านผู้เผยแพร่เจ้าของ

### `GET /api/v1/packages/{name}/versions/{version}`

คืนเวอร์ชันแพ็กเกจหนึ่งรายการ รวมถึงเมทาดาทาไฟล์ ความเข้ากันได้
ความสามารถ การตรวจสอบยืนยัน เมทาดาทาอาร์ติแฟกต์ และข้อมูลการสแกน

หมายเหตุ:

- `version.artifact.kind` คือ `legacy-zip` สำหรับไฟล์เก็บถาวรแพ็กเกจแบบเก่า หรือ
  `npm-pack` สำหรับรุ่นเผยแพร่ที่รองรับโดย ClawPack
- รุ่นเผยแพร่ ClawPack มีฟิลด์ `npmIntegrity`, `npmShasum` และ
  `npmTarballName` ที่เข้ากันได้กับ npm
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` และ `version.staticScan` จะรวมอยู่เมื่อมีข้อมูลการสแกน
- แพ็กเกจส่วนตัวจะคืน `404` เว้นแต่ผู้เรียกจะมีสิทธิ์อ่านผู้เผยแพร่เจ้าของ

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

คืนเมทาดาทา resolver ของอาร์ติแฟกต์ที่ชัดเจนสำหรับเวอร์ชันแพ็กเกจ

หมายเหตุ:

- เวอร์ชันแพ็กเกจแบบเดิมจะคืนอาร์ติแฟกต์ `legacy-zip` และ
  `downloadUrl` ของ ZIP แบบเดิม
- เวอร์ชัน ClawPack จะคืนอาร์ติแฟกต์ `npm-pack`, ฟิลด์ความถูกต้องของ npm,
  `tarballUrl` และ URL ความเข้ากันได้ของ ZIP แบบเดิม
- นี่คือพื้นผิว resolver ของ OpenClaw ซึ่งหลีกเลี่ยงการเดารูปแบบไฟล์เก็บถาวรจาก
  URL ที่ใช้ร่วมกัน

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ดาวน์โหลดอาร์ติแฟกต์เวอร์ชันผ่านเส้นทาง resolver ที่ชัดเจน

หมายเหตุ:

- เวอร์ชัน ClawPack สตรีมไบต์ `.tgz` ของ npm-pack ที่อัปโหลดจริง
- เวอร์ชัน ZIP แบบเดิมจะเปลี่ยนเส้นทางไปยัง `/api/v1/packages/{name}/download?version=`
- ใช้บักเก็ตอัตราการดาวน์โหลด

### `GET /api/v1/packages/{name}/readiness`

คืน readiness ที่คำนวณแล้วสำหรับการใช้งาน OpenClaw ในอนาคต

การตรวจสอบ readiness ครอบคลุม:

- สถานะช่องทาง official
- ความพร้อมใช้งานของเวอร์ชันล่าสุด
- ความพร้อมใช้งานของอาร์ติแฟกต์ ClawPack npm-pack
- digest ของอาร์ติแฟกต์
- ที่มาของ repo ต้นทางและ commit
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

ปลายทางสำหรับผู้ดูแลเพื่อแสดงรายการแถวการย้าย Plugin OpenClaw อย่างเป็นทางการ

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

ปลายทางสำหรับผู้ดูแลระบบเพื่อสร้างหรืออัปเดตแถวการย้าย Plugin อย่างเป็นทางการ

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

- `bundledPluginId` จะถูก normalize เป็นตัวพิมพ์เล็กและเป็นคีย์ upsert ที่เสถียร
- `packageName` จะถูก normalize เป็นชื่อ npm; แพ็กเกจอาจไม่มีอยู่สำหรับการย้ายที่วางแผนไว้
- สิ่งนี้ติดตามเฉพาะ readiness ของการย้ายเท่านั้น ไม่ได้แก้ไข OpenClaw หรือสร้าง
  ClawPacks

### `GET /api/v1/packages/moderation/queue`

ปลายทางสำหรับผู้ดูแล/ผู้ดูแลระบบสำหรับคิวตรวจสอบรุ่นเผยแพร่ของแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คิวรี:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `blocked`, `manual` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

ความหมายของสถานะ:

- `open`: รุ่นเผยแพร่ที่น่าสงสัย เป็นอันตราย รอดำเนินการ ถูกกักกัน ถูกเพิกถอน หรือถูกรายงาน
- `blocked`: รุ่นเผยแพร่ที่ถูกกักกัน ถูกเพิกถอน หรือเป็นอันตราย
- `manual`: รุ่นเผยแพร่ใดๆ ที่มีการ override การดูแลแบบ manual
- `all`: รุ่นเผยแพร่ใดๆ ที่มีการ override แบบ manual, สถานะการสแกนที่ไม่สะอาด หรือรายงานแพ็กเกจ

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

รายงานแพ็กเกจเพื่อให้ผู้ดูแลตรวจสอบ รายงานอยู่ในระดับแพ็กเกจ โดยอาจ
เชื่อมโยงกับเวอร์ชันได้ รายงานเหล่านี้ป้อนเข้าสู่คิวการดูแล แต่จะไม่ซ่อนหรือ
บล็อกการดาวน์โหลดโดยอัตโนมัติด้วยตัวเอง; ผู้ดูแลควรใช้การดูแลรุ่นเผยแพร่เพื่อ
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

ปลายทางสำหรับผู้ดูแล/ผู้ดูแลระบบสำหรับการรับรายงานแพ็กเกจ

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

ปลายทางสำหรับเจ้าของ/ผู้ดูแลสำหรับการมองเห็นการดูแลแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API สำหรับเจ้าของแพ็กเกจ สมาชิกผู้เผยแพร่ ผู้ดูแล หรือ
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

ปลายทางสำหรับผู้ดูแล/ผู้ดูแลระบบสำหรับแก้ไขหรือเปิดรายงานแพ็กเกจใหม่

คำขอ:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` จำเป็นสำหรับ `confirmed` และ `dismissed`; สามารถละไว้ได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "quarantine"` หรือ
`finalAction: "revoke"` พร้อมรายงานที่ยืนยันแล้ว เพื่อใช้การควบคุมรีลีสใน
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

ปลายทางสำหรับผู้ควบคุม/ผู้ดูแลระบบสำหรับการตรวจสอบรีลีสแพ็กเกจ

คำขอ:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

สถานะที่รองรับ:

- `approved`: ตรวจสอบด้วยตนเองแล้วและอนุญาต
- `quarantined`: ถูกบล็อกระหว่างรอการติดตามผล
- `revoked`: ถูกบล็อกหลังจากที่รีลีสเคยได้รับความเชื่อถือก่อนหน้านี้

รีลีสที่ถูกกักกันและถูกเพิกถอนจะส่งคืน `403` จากเส้นทางดาวน์โหลดอาร์ทิแฟกต์
ทุกการเปลี่ยนแปลงจะเขียนรายการบันทึกการตรวจสอบย้อนหลัง

### `POST /api/v1/packages/backfill/artifacts`

ปลายทางบำรุงรักษาสำหรับผู้ดูแลระบบเท่านั้น สำหรับติดป้ายรีลีสแพ็กเกจเก่าด้วย
เมตาดาต้าชนิดอาร์ทิแฟกต์อย่างชัดเจน

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

- ค่าเริ่มต้นเป็นการจำลองการทำงาน
- รีลีสที่ไม่มีพื้นที่จัดเก็บ ClawPack จะถูกติดป้าย `legacy-zip`
- แถวที่มี ClawPack เดิมแต่ขาด `artifactKind` จะถูกซ่อมเป็น
  `npm-pack`
- การดำเนินการนี้ไม่สร้าง ClawPack หรือแก้ไขไบต์ของอาร์ทิแฟกต์

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
- การสแกน VirusTotal ที่ยังรอดำเนินการไม่บล็อกการอ่าน; รีลีสที่เป็นอันตรายอาจยังถูกระงับไว้ที่อื่น
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะอ่านผู้เผยแพร่ที่เป็นเจ้าของได้

### `GET /api/v1/packages/{name}/download`

ดาวน์โหลดอาร์ไคฟ์ ZIP แบบกำหนดได้ซ้ำของระบบเดิมสำหรับรีลีสแพ็กเกจ

พารามิเตอร์คิวรี:

- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นเป็นรีลีสล่าสุด
- Skills เปลี่ยนเส้นทางไปยัง `GET /api/v1/download`
- อาร์ไคฟ์ Plugin/แพ็กเกจเป็นไฟล์ zip ที่มีราก `package/` เพื่อให้ไคลเอนต์ OpenClaw
  รุ่นเก่ายังคงทำงานได้
- เส้นทางนี้ยังคงเป็น ZIP เท่านั้น ไม่สตรีมไฟล์ ClawPack `.tgz`
- การตอบกลับมีส่วนหัว `ETag`, `Digest`, `X-ClawHub-Artifact-Type` และ
  `X-ClawHub-Artifact-Sha256` สำหรับการตรวจสอบความสมบูรณ์ของตัวแก้ไข
- เมตาดาต้าเฉพาะรีจิสทรีจะไม่ถูกฉีดเข้าไปในอาร์ไคฟ์ที่ดาวน์โหลด
- การสแกน VirusTotal ที่ยังรอดำเนินการไม่บล็อกการดาวน์โหลด; รีลีสที่เป็นอันตรายส่งคืน `403`
- แพ็กเกจส่วนตัวส่งคืน `404` เว้นแต่ผู้เรียกจะเป็นเจ้าของ

### `GET /api/npm/{package}`

ส่งคืน packument ที่เข้ากันได้กับ npm สำหรับเวอร์ชันแพ็กเกจที่มี ClawPack

หมายเหตุ:

- แสดงเฉพาะเวอร์ชันที่มีการอัปโหลดทาร์บอล ClawPack npm-pack
- เวอร์ชันเดิมที่มีเฉพาะ ZIP จะถูกละไว้อย่างตั้งใจ
- `dist.tarball`, `dist.integrity` และ `dist.shasum` ใช้ฟิลด์ที่เข้ากันได้กับ npm
  เพื่อให้ผู้ใช้ชี้ npm ไปยังมิเรอร์ได้หากต้องการ
- packument ของแพ็กเกจแบบมี scope รองรับทั้ง `/api/npm/@scope/name` และพาธคำขอ
  แบบเข้ารหัสของ npm `/api/npm/@scope%2Fname`

### `GET /api/npm/{package}/-/{tarball}.tgz`

สตรีมไบต์ทาร์บอล ClawPack ที่อัปโหลดมาแบบตรงตัวสำหรับไคลเอนต์มิเรอร์ npm

หมายเหตุ:

- ใช้บัคเก็ตอัตราการดาวน์โหลด
- ส่วนหัวการดาวน์โหลดมี SHA-256 ของ ClawHub รวมถึงเมตาดาต้า integrity/shasum ของ npm
- การควบคุมรีลีสและการตรวจสอบสิทธิ์เข้าถึงแพ็กเกจส่วนตัวยังคงมีผล

### `GET /api/v1/resolve`

CLI ใช้เพื่อแมปลายนิ้วมือในเครื่องกับเวอร์ชันที่รู้จัก

พารามิเตอร์คิวรี:

- `slug` (จำเป็น)
- `hash` (จำเป็น): sha256 แบบเลขฐานสิบหก 64 อักขระของลายนิ้วมือบันเดิล

การตอบกลับ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ดาวน์โหลด zip ของเวอร์ชัน Skill

พารามิเตอร์คิวรี:

- `slug` (จำเป็น)
- `version` (ไม่บังคับ): สตริง semver
- `tag` (ไม่บังคับ): ชื่อแท็ก (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` จะใช้เวอร์ชันล่าสุด
- เวอร์ชันที่ถูกลบแบบ soft-delete ส่งคืน `410`
- สถิติการดาวน์โหลดถูกนับเป็นตัวตนที่ไม่ซ้ำกันต่อชั่วโมง (`userId` เมื่อโทเค็น API ถูกต้อง มิฉะนั้นใช้ IP)

## ปลายทางการยืนยันตัวตน (Bearer token)

ทุกปลายทางต้องมี:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

ตรวจสอบโทเค็นและส่งคืน handle ของผู้ใช้

### `POST /api/v1/skills`

เผยแพร่เวอร์ชันใหม่

- แนะนำให้ใช้: `multipart/form-data` พร้อม JSON `payload` + บล็อบ `files[]`
- ยอมรับเนื้อหา JSON ที่มี `files` (อิง `storageId`) เช่นกัน
- ฟิลด์ payload ไม่บังคับ: `ownerHandle` เมื่อมีอยู่ API จะแก้ไขผู้เผยแพร่นั้น
  ฝั่งเซิร์ฟเวอร์และกำหนดให้ผู้ดำเนินการต้องมีสิทธิ์เข้าถึงผู้เผยแพร่
- ฟิลด์ payload ไม่บังคับ: `migrateOwner` เมื่อเป็น `true` พร้อม `ownerHandle`
  Skill ที่มีอยู่สามารถย้ายไปยังเจ้าของนั้นได้ หากผู้ดำเนินการเป็นผู้ดูแลระบบ/เจ้าของทั้งใน
  ผู้เผยแพร่ปัจจุบันและผู้เผยแพร่เป้าหมาย หากไม่มีการเลือกใช้นี้ การเปลี่ยนเจ้าของจะ
  ถูกปฏิเสธ

### `POST /api/v1/packages`

เผยแพร่รีลีส code-plugin หรือ bundle-plugin

- ต้องใช้การยืนยันตัวตนด้วย Bearer token
- แนะนำให้ใช้: `multipart/form-data` พร้อม JSON `payload` + บล็อบ `files[]`
- ยอมรับเนื้อหา JSON ที่มี `files` (อิง `storageId`) เช่นกัน
- ฟิลด์ payload ไม่บังคับ: `ownerHandle` เมื่อมีอยู่ เฉพาะผู้ดูแลระบบเท่านั้นที่เผยแพร่แทนเจ้าของนั้นได้

จุดสำคัญของการตรวจสอบความถูกต้อง:

- `family` ต้องเป็น `code-plugin` หรือ `bundle-plugin`
- แพ็กเกจ Plugin ต้องมี `openclaw.plugin.json` การอัปโหลด ClawPack `.tgz` ต้อง
  มีไฟล์นั้นที่ `package/openclaw.plugin.json`
- Code plugin ต้องมี `package.json`, เมตาดาต้า repo ต้นทาง, เมตาดาต้า commit ต้นทาง,
  เมตาดาต้า config schema, `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion`
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมตาดาต้าไม่บังคับ
- เฉพาะผู้เผยแพร่ที่เชื่อถือได้เท่านั้นที่เผยแพร่ไปยังช่อง `official` ได้
- การเผยแพร่แทนผู้อื่นยังคงตรวจสอบสิทธิ์สำหรับช่อง official กับบัญชีเจ้าของเป้าหมาย

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

ลบแบบ soft-delete / กู้คืน Skill (เจ้าของ ผู้ควบคุม หรือผู้ดูแลระบบ)

เนื้อหา JSON ไม่บังคับ:

```json
{ "reason": "Held for moderation pending legal review." }
```

เมื่อมีอยู่ `reason` จะถูกจัดเก็บเป็นหมายเหตุการควบคุมของ Skill และคัดลอกไปยังบันทึกการตรวจสอบย้อนหลัง
การลบแบบ soft-delete ที่เจ้าของเริ่มเองจะจอง slug ไว้ 30 วัน จากนั้น slug จะถูกอ้างสิทธิ์โดย
ผู้เผยแพร่รายอื่นได้ การตอบกลับการลบมี `slugReservedUntil` เมื่อวันหมดอายุนี้มีผล
การซ่อนโดยผู้ควบคุม/ผู้ดูแลระบบและการลบออกด้านความปลอดภัยจะไม่หมดอายุด้วยวิธีนี้

การตอบกลับการลบ:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

รหัสสถานะ:

- `200`: ตกลง
- `401`: ไม่ได้รับอนุญาต
- `403`: ถูกห้าม
- `404`: ไม่พบ Skill/ผู้ใช้
- `500`: ข้อผิดพลาดภายในเซิร์ฟเวอร์

### `POST /api/v1/users/publisher`

สำหรับผู้ดูแลระบบเท่านั้น ตรวจให้แน่ใจว่ามีผู้เผยแพร่แบบ org สำหรับ handle หาก handle ยังชี้ไปที่
ผู้เผยแพร่ผู้ใช้ร่วม/ส่วนบุคคลแบบเดิม ปลายทางจะย้ายเป็นผู้เผยแพร่แบบ org ก่อน

- เนื้อหา: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- การตอบกลับ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

สำหรับผู้ดูแลระบบเท่านั้น จอง root slug และชื่อแพ็กเกจให้เจ้าของที่ชอบธรรมโดยไม่เผยแพร่
รีลีส ชื่อแพ็กเกจจะกลายเป็นแพ็กเกจ placeholder ส่วนตัวที่ไม่มีแถวรีลีส เพื่อให้
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

- ทั้งสองปลายทางต้องใช้การยืนยันตัวตนด้วยโทเค็น API และทำงานได้เฉพาะสำหรับเจ้าของ Skill
- `rename` เก็บ slug ก่อนหน้าไว้เป็น alias เปลี่ยนเส้นทาง
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

แบนผู้ใช้และลบ Skill ที่เป็นเจ้าของอย่างถาวร (เฉพาะผู้ควบคุม/ผู้ดูแลระบบ)

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

ยกเลิกการแบนผู้ใช้และกู้คืน Skill ที่มีสิทธิ์ (เฉพาะผู้ดูแลระบบ)

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

เปลี่ยนบทบาทผู้ใช้ (เฉพาะผู้ดูแลระบบ)

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

แสดงรายการหรือค้นหาผู้ใช้ (เฉพาะผู้ดูแลระบบ)

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

เพิ่ม/ลบดาว (ไฮไลต์) ทั้งสองปลายทางเป็นแบบ idempotent

การตอบกลับ:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## ปลายทาง CLI รุ่นเดิม (เลิกใช้แล้ว)

ยังรองรับสำหรับเวอร์ชัน CLI รุ่นเก่า:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

ดูแผนการนำออกใน `DEPRECATIONS.md`

## การค้นพบรีจิสทรี (`/.well-known/clawhub.json`)

CLI สามารถค้นพบการตั้งค่ารีจิสทรี/การยืนยันตัวตนจากไซต์ได้:

- `/.well-known/clawhub.json` (JSON, แนะนำ)
- `/.well-known/clawdhub.json` (รุ่นเดิม)

สคีมา:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

หากคุณโฮสต์เอง ให้ให้บริการไฟล์นี้ (หรือตั้งค่า `CLAWHUB_REGISTRY` อย่างชัดเจน; `CLAWDHUB_REGISTRY` รุ่นเดิม)
