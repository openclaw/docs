---
read_when:
    - การเพิ่ม/เปลี่ยนแปลงปลายทาง API
    - การดีบักคำขอระหว่าง CLI ↔ รีจิสทรี
summary: เอกสารอ้างอิง HTTP API (ปลายทางสาธารณะ + ปลายทาง CLI + การยืนยันตัวตน)
x-i18n:
    generated_at: "2026-07-12T15:50:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

URL ฐาน: `https://clawhub.ai` (ค่าเริ่มต้น)

พาธ v1 ทั้งหมดอยู่ภายใต้ `/api/v1/...`
พาธเดิม `/api/...` และ `/api/cli/...` ยังคงไว้เพื่อความเข้ากันได้ (ดู `DEPRECATIONS.md`)
OpenAPI: `/api/v1/openapi.json`

## การนำแค็ตตาล็อกสาธารณะไปใช้ซ้ำ

ไดเรกทอรีของบุคคลที่สามอาจใช้เอนด์พอยต์อ่านแบบสาธารณะเพื่อแสดงรายการหรือค้นหา skills ของ ClawHub โปรดแคชผลลัพธ์ ปฏิบัติตาม `429`/`Retry-After` ลิงก์ผู้ใช้กลับไปยังรายการมาตรฐานของ ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) และหลีกเลี่ยงการสื่อว่า ClawHub รับรองเว็บไซต์ของบุคคลที่สาม อย่าพยายามทำสำเนาเนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกโดยการกลั่นกรองนอกพื้นผิว API สาธารณะ

ทางลัด slug บนเว็บสามารถแก้ไขข้ามตระกูลรีจิสทรีได้ แต่ไคลเอนต์ API ควรใช้
URL มาตรฐานที่เอนด์พอยต์อ่านส่งคืน แทนการสร้างลำดับความสำคัญของเส้นทางขึ้นใหม่

## ขีดจำกัดอัตรา

รูปแบบการบังคับใช้:

- คำขอแบบไม่ระบุตัวตน: บังคับใช้ต่อ IP
- คำขอที่ยืนยันตัวตนแล้ว (Bearer token ที่ถูกต้อง): บังคับใช้ตามบักเก็ตของผู้ใช้
- หาก token หายไป/ไม่ถูกต้อง ลักษณะการทำงานจะย้อนกลับไปใช้การบังคับใช้ตาม IP
- เอนด์พอยต์เขียนที่ยืนยันตัวตนแล้วไม่ควรส่งคืนเพียง `Unauthorized` เมื่อ
  เซิร์ฟเวอร์ทราบสาเหตุ token ที่หายไป token ที่ไม่ถูกต้อง/ถูกเพิกถอน และ
  บัญชีที่ถูกลบ/แบน/ปิดใช้งาน ควรได้รับข้อความที่นำไปดำเนินการได้แยกกัน เพื่อให้ไคลเอนต์ CLI
  สามารถบอกผู้ใช้ได้ว่าอะไรเป็นสิ่งที่ขัดขวางการใช้งาน

- อ่าน: 3000/นาทีต่อ IP, 12000/นาทีต่อคีย์
- เขียน: 300/นาทีต่อ IP, 3000/นาทีต่อคีย์
- ดาวน์โหลด: 1200/นาทีต่อ IP, 6000/นาทีต่อคีย์ (เอนด์พอยต์ดาวน์โหลด)

ส่วนหัว:

- ความเข้ากันได้กับระบบเดิม: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- แบบมาตรฐาน: `RateLimit-Limit`, `RateLimit-Reset`
- เมื่อเป็น `429`: `X-RateLimit-Remaining: 0` และ `RateLimit-Remaining: 0`
- เมื่อเป็น `429`: `Retry-After`

ความหมายของส่วนหัว:

- `X-RateLimit-Reset`: วินาที Unix epoch แบบสัมบูรณ์
- `RateLimit-Reset`: จำนวนวินาทีจนกว่าจะรีเซ็ต (ระยะหน่วง)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: โควตาที่เหลืออย่างแม่นยำเมื่อมีค่า
  คำขอที่สำเร็จแบบแบ่งชาร์ดจะละส่วนหัวนี้ แทนการส่งคืนค่าโดยรวมโดยประมาณ
- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่ (ระยะหน่วง) เมื่อเป็น `429`

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
- ใช้การถอยกลับแบบมีค่าความคลาดเคลื่อนสุ่มเพื่อหลีกเลี่ยงการลองใหม่พร้อมกัน
- หากไม่มี `Retry-After` ให้ย้อนกลับไปใช้ `RateLimit-Reset` (หรือคำนวณจาก `X-RateLimit-Reset`)

แหล่งที่มาของ IP:

- ใช้ส่วนหัว IP ของไคลเอนต์ที่เชื่อถือได้ รวมถึง `cf-connecting-ip` เฉพาะเมื่อ
  การปรับใช้เปิดใช้งานส่วนหัวที่ส่งต่อที่เชื่อถือได้อย่างชัดเจน
- ClawHub ใช้ส่วนหัวการส่งต่อที่เชื่อถือได้เพื่อระบุ IP ของไคลเอนต์ที่ขอบเครือข่าย
- หากไม่มี IP ของไคลเอนต์ที่เชื่อถือได้ คำขอแบบไม่ระบุตัวตนจะใช้บักเก็ตสำรอง
  ซึ่งกำหนดขอบเขตตามชนิดของขีดจำกัดอัตราเท่านั้น บักเก็ตสำรองเหล่านี้ไม่รวม
  พาธ slug ชื่อแพ็กเกจ เวอร์ชัน สตริงคำค้น หรือพารามิเตอร์อาร์ติแฟกต์อื่น ๆ
  ที่ผู้เรียกส่งมา

## การตอบกลับข้อผิดพลาด

การตอบกลับข้อผิดพลาด v1 แบบสาธารณะเป็นข้อความธรรมดาที่มี `content-type: text/plain; charset=utf-8`
ซึ่งรวมถึงความล้มเหลวในการตรวจสอบความถูกต้อง (`400`), ทรัพยากรสาธารณะที่ไม่พบ (`404`), ความล้มเหลวด้าน
การยืนยันตัวตนและสิทธิ์ (`401`/`403`), ขีดจำกัดอัตรา (`429`) และการดาวน์โหลดที่ถูกบล็อก ไคลเอนต์
ควรอ่านเนื้อหาการตอบกลับเป็นสตริงที่มนุษย์อ่านได้ พารามิเตอร์คำค้นที่ไม่รู้จักจะถูก
ละเว้นเพื่อความเข้ากันได้ แต่พารามิเตอร์คำค้นที่ระบบรู้จักและมีค่าไม่ถูกต้องจะส่งคืน
`400`

## เอนด์พอยต์สาธารณะ (ไม่ต้องยืนยันตัวตน)

### `GET /api/v1/search`

พารามิเตอร์คำค้น:

- `q` (จำเป็น): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม
- `highlightedOnly` (ไม่บังคับ): `true` เพื่อกรองให้เหลือเฉพาะ skills ที่ถูกเน้น
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): นามแฝงเดิมของ `nonSuspiciousOnly`

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

- ผลลัพธ์จะส่งคืนตามลำดับความเกี่ยวข้อง (ความคล้ายคลึงของ embedding + การเพิ่มคะแนนจาก token ของ slug/ชื่อที่ตรงกันทุกประการ + ค่าน้ำหนักความนิยมเล็กน้อย)
- ความเกี่ยวข้องมีน้ำหนักมากกว่าความนิยม การตรงกันอย่างแม่นยำของ token ใน slug หรือชื่อที่แสดงอาจมีอันดับเหนือกว่าการตรงกันแบบหลวมที่มีการมีส่วนร่วมสูงกว่ามาก
- ข้อความ ASCII จะถูกแบ่งเป็น token ตามขอบเขตของคำและเครื่องหมายวรรคตอน ตัวอย่างเช่น `personal-map` มี token `map` แยกเดี่ยว ขณะที่ `amap-jsapi-skill` มี `amap`, `jsapi` และ `skill` ดังนั้นการค้นหา `map` จึงทำให้ `personal-map` ตรงกันทางคำศัพท์มากกว่า `amap-jsapi-skill`
- ความนิยมใช้มาตราส่วนลอการิทึมและมีเพดาน skills ที่มีการมีส่วนร่วมสูงอาจมีอันดับต่ำลงเมื่อข้อความคำค้นตรงกันน้อยกว่า
- สถานะการกลั่นกรองว่าน่าสงสัยหรือถูกซ่อนอาจนำ skill ออกจากการค้นหาสาธารณะ โดยขึ้นอยู่กับตัวกรองของผู้เรียกและสถานะการกลั่นกรองปัจจุบัน

คำแนะนำด้านการค้นพบสำหรับผู้เผยแพร่:

- ใส่คำที่ผู้ใช้จะค้นหาจริง ๆ ไว้ในชื่อที่แสดง บทสรุป และแท็ก ใช้ token slug แบบแยกเดี่ยวเฉพาะเมื่อเป็นอัตลักษณ์ที่คงที่ซึ่งคุณต้องการเก็บไว้ด้วย
- อย่าเปลี่ยนชื่อ slug เพียงเพื่อไล่ตามคำค้นเดียว เว้นแต่ slug ใหม่จะเป็นชื่อมาตรฐานระยะยาวที่ดีกว่า slug เก่าจะกลายเป็นนามแฝงสำหรับการเปลี่ยนเส้นทาง แต่ URL มาตรฐาน slug ที่แสดง และข้อมูลสรุปการค้นหาในอนาคตจะใช้ slug ใหม่
- นามแฝงจากการเปลี่ยนชื่อจะรักษาการแก้ไขเส้นทางสำหรับ URL เก่าและการติดตั้งที่แก้ไขผ่านรีจิสทรี แต่การจัดอันดับการค้นหาจะอิงตามข้อมูลเมตาของ skill มาตรฐานหลังจากจัดทำดัชนีการเปลี่ยนชื่อแล้ว สถิติเดิมจะยังคงอยู่กับ skill
- หากไม่พบ skill อย่างไม่คาดคิด ให้ตรวจสอบสถานะการกลั่นกรองก่อนด้วย `clawhub inspect @owner/slug` ขณะที่เข้าสู่ระบบอยู่ ก่อนเปลี่ยนข้อมูลเมตาที่เกี่ยวข้องกับการจัดอันดับ

### `GET /api/v1/skills`

พารามิเตอร์คำค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–200)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าสำหรับการเรียงลำดับใด ๆ ที่ไม่ใช่ `trending`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended` (นามแฝง: `default`), `createdAt` (นามแฝง: `newest`), `downloads`, `stars` (นามแฝง: `rating`), นามแฝงการติดตั้งเดิม `installsCurrent`/`installs`/`installsAllTime` จะแมปไปยัง `downloads`, `trending`
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): นามแฝงเดิมของ `nonSuspiciousOnly`

ค่า `sort` ที่ไม่ถูกต้องจะส่งคืน `400`

หมายเหตุ:

- `recommended` ใช้สัญญาณการมีส่วนร่วมและความใหม่
- `trending` จัดอันดับตามการติดตั้งในช่วง 7 วันที่ผ่านมา (อิงข้อมูลเทเลเมทรี)
- `createdAt` มีความคงที่สำหรับการรวบรวมข้อมูล skill ใหม่ ส่วน `updated` จะเปลี่ยนเมื่อมีการเผยแพร่ skills ที่มีอยู่ใหม่
- เมื่อ `nonSuspiciousOnly=true` การเรียงลำดับแบบใช้เคอร์เซอร์อาจส่งคืนรายการในหนึ่งหน้าน้อยกว่า `limit` เนื่องจาก skills ที่น่าสงสัยจะถูกกรองหลังดึงข้อมูลหน้าแล้ว
- ใช้ `nextCursor` เพื่อแบ่งหน้าต่อเมื่อมีค่า การที่หน้ามีรายการน้อยไม่ได้หมายความว่าผลลัพธ์สิ้นสุดแล้วเสมอไป

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

- slug เก่าที่สร้างจากขั้นตอนการเปลี่ยนชื่อ/รวมโดยเจ้าของจะชี้ไปยัง skill มาตรฐาน
- `metadata.os`: ข้อจำกัด OS ที่ประกาศใน frontmatter ของ skill (เช่น `["macos"]`, `["linux"]`) เป็น `null` หากไม่ได้ประกาศ
- `metadata.systems`: เป้าหมายระบบ Nix (เช่น `["aarch64-darwin", "x86_64-linux"]`) เป็น `null` หากไม่ได้ประกาศ
- `metadata` เป็น `null` หาก skill ไม่มีข้อมูลเมตาของแพลตฟอร์ม
- `moderation` จะรวมอยู่เฉพาะเมื่อ skill ถูกทำเครื่องหมายหรือเจ้าของกำลังดู skill นั้น

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

- เจ้าของและผู้ดูแลการกลั่นกรองสามารถเข้าถึงรายละเอียดการกลั่นกรองสำหรับ skills ที่ซ่อนอยู่
- ผู้เรียกแบบสาธารณะจะได้รับ `200` เฉพาะสำหรับ skills ที่มองเห็นได้และถูกทำเครื่องหมายไว้แล้ว
- หลักฐานจะถูกปกปิดสำหรับผู้เรียกแบบสาธารณะ และจะรวมข้อความดิบเฉพาะสำหรับเจ้าของ/ผู้ดูแลการกลั่นกรองเท่านั้น

### `POST /api/v1/skills/{slug}/report`

รายงาน skill เพื่อให้ผู้ดูแลการกลั่นกรองตรวจสอบ รายงานอยู่ในระดับ skill สามารถเชื่อมโยง
กับเวอร์ชันได้โดยไม่บังคับ และจะถูกส่งเข้าสู่คิวรายงาน skill

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

### `GET /api/v1/skills/-/reports`

เอนด์พอยต์สำหรับผู้ดูแลการกลั่นกรอง/ผู้ดูแลระบบเพื่อรับรายงาน skill

พารามิเตอร์คำค้น:

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

เอนด์พอยต์สำหรับผู้ดูแลการกลั่นกรอง/ผู้ดูแลระบบเพื่อแก้ไขหรือเปิดรายงาน skill อีกครั้ง

คำขอ:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

ต้องระบุ `note` สำหรับ `confirmed` และ `dismissed`; สามารถละได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "hide"` พร้อมรายงานที่ผ่านการคัดแยก
เพื่อซ่อน skill ภายในเวิร์กโฟลว์เดียวกันที่ตรวจสอบย้อนหลังได้

### `GET /api/v1/skills/{slug}/versions`

พารามิเตอร์คำค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

### `GET /api/v1/skills/{slug}/versions/{version}`

ส่งคืนข้อมูลเมตาของเวอร์ชัน + รายการไฟล์

- `version.security` รวมสถานะการตรวจสอบการสแกนที่ปรับให้อยู่ในรูปแบบมาตรฐานและรายละเอียดเครื่องสแกน
  (VirusTotal + LLM) เมื่อมีข้อมูล

### `GET /api/v1/skills/{slug}/scan`

ส่งคืนรายละเอียดการตรวจสอบการสแกนความปลอดภัยสำหรับเวอร์ชันของ skill

พารามิเตอร์คำค้น:

- `version` (ไม่บังคับ): สตริงเวอร์ชันที่ระบุ
- `tag` (ไม่บังคับ): แก้ไขเป็นเวอร์ชันที่ติดแท็ก (ตัวอย่างเช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` ระบบจะใช้เวอร์ชันล่าสุด
- รวมสถานะการตรวจสอบที่ปรับให้อยู่ในรูปแบบมาตรฐาน พร้อมรายละเอียดเฉพาะของแต่ละเครื่องมือสแกน
- `security.hasScanResult` จะเป็น `true` เฉพาะเมื่อเครื่องมือสแกนให้ผลตัดสินที่แน่ชัด (`clean`, `suspicious` หรือ `malicious`)
- `moderation` คือภาพรวมสถานะการกลั่นกรองระดับ Skills ปัจจุบัน ซึ่งได้มาจากเวอร์ชันล่าสุด
- เมื่อสอบถามเวอร์ชันย้อนหลัง ให้ตรวจสอบ `moderation.matchesRequestedVersion` และ `moderation.sourceVersion` ก่อนถือว่า `moderation` และ `security` อยู่ในบริบทเวอร์ชันเดียวกัน

### `POST /api/v1/skills/-/scan`

ปลายทางส่งคำขอที่ต้องยืนยันตัวตนสำหรับงาน ClawScan ใหม่

ไม่รองรับการสแกนไฟล์ที่อัปโหลดในเครื่องอีกต่อไป คำขอที่ใช้
`multipart/form-data` หรือ `{ "source": { "kind": "upload" } }` จะส่งคืน `410`

การสแกนรายการที่เผยแพร่ใช้ JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

หมายเหตุ:

- เพย์โหลดคำขอสแกนและรายงานที่ดาวน์โหลดได้จะหมดอายุและถูกนำออกจากที่เก็บคำขอสแกนเมื่อพ้นระยะเวลาเก็บรักษา
- การสแกนรายการที่เผยแพร่ต้องมีสิทธิ์จัดการในฐานะเจ้าของ/ผู้เผยแพร่ หรือมีอำนาจผู้กลั่นกรอง/ผู้ดูแลระบบของแพลตฟอร์ม
- การสแกนรายการที่เผยแพร่จะเขียนผลกลับเฉพาะเมื่อ `update: true` และการสแกนเสร็จสมบูรณ์โดยสำเร็จ
- การตอบกลับเป็น `202` พร้อม `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "การสแกนทำงานแบบอะซิงโครนัสและอาจใช้เวลาสักระยะจึงจะเสร็จสมบูรณ์" } }`
- งานสแกนทำงานแบบอะซิงโครนัส คำขอสแกนด้วยตนเองจะได้รับลำดับความสำคัญเหนือกว่างานเผยแพร่/เติมข้อมูลย้อนหลังตามปกติ แต่การเสร็จสมบูรณ์ยังขึ้นอยู่กับความพร้อมของตัวประมวลผลงาน

### `GET /api/v1/skills/-/scan/{scanId}`

ปลายทางตรวจสอบสถานะแบบวนถามที่ต้องยืนยันตัวตนสำหรับการสแกนที่ส่งแล้ว

- ส่งคืนสถานะอยู่ในคิว/กำลังทำงาน/สำเร็จ/ล้มเหลว
- ส่งคืน `queue.queuedAhead` และ `queue.position` ขณะอยู่ในคิว เพื่อให้ไคลเอนต์แสดงจำนวนการสแกนด้วยตนเองที่ได้รับลำดับความสำคัญและอยู่ก่อนหน้าคำขอนี้ได้ คิวที่มีขนาดใหญ่มากจะถูกจำกัดค่าและรายงานด้วย `queuedAheadIsEstimate: true`
- เมื่อพร้อมใช้งาน `report` จะมีส่วน `clawscan`, `skillspector`, `staticAnalysis` และ `virustotal`
- งานสแกนที่ล้มเหลวจะส่งคืน `status: "failed"` พร้อม `lastError`

### `GET /api/v1/skills/-/scan/{scanId}/download`

ปลายทางคลังรายงานที่ต้องยืนยันตัวตน

- ต้องเป็นการสแกนที่สำเร็จแล้ว การสแกนที่ยังไม่อยู่ในสถานะสิ้นสุดจะส่งคืน `409`
- ส่งคืนไฟล์ ZIP ที่มี `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

ปลายทางคลังรายงานที่จัดเก็บไว้และต้องยืนยันตัวตนสำหรับเวอร์ชันที่ส่งแล้ว

- ต้องมีสิทธิ์จัดการ Skills หรือ Plugin ในฐานะเจ้าของ/ผู้เผยแพร่ หรือมีอำนาจผู้กลั่นกรอง/ผู้ดูแลระบบของแพลตฟอร์ม
- ส่งคืนผลการสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งมาโดยตรง รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อน
- ค่าเริ่มต้นของ `kind` คือ `skill` ให้ใช้ `kind=plugin` สำหรับการสแกน Plugin/แพ็กเกจ
- ส่งคืน ZIP ที่มีโครงสร้างเดียวกับการดาวน์โหลดจากคำขอสแกน

### `POST /api/v1/skills/-/scan/batch`

เส้นทางมาตรฐานสำหรับสแกนซ้ำแบบกลุ่ม เฉพาะผู้ดูแลระบบ โดยรับเพย์โหลดรูปแบบเดียวกับ `POST /api/v1/skills/-/rescan-batch` แบบเดิม

### `POST /api/v1/skills/-/scan/batch/status`

เส้นทางมาตรฐานสำหรับสถานะแบบกลุ่ม เฉพาะผู้ดูแลระบบ โดยรับ `{ "jobIds": ["..."] }` และส่งคืนตัวนับรวมแบบเดียวกับ `POST /api/v1/skills/-/rescan-batch/status` แบบเดิม

### `GET /api/v1/skills/{slug}/verify`

ส่งคืนซองข้อมูลการตรวจสอบ Skill Card ที่ `clawhub skill verify` ใช้

พารามิเตอร์คำค้น:

- `version` (ไม่บังคับ): สตริงเวอร์ชันที่ระบุ
- `tag` (ไม่บังคับ): แปลงแท็กเป็นเวอร์ชันที่กำหนด (เช่น `latest`)

หมายเหตุ:

- `ok` จะเป็น `true` เฉพาะเมื่อเวอร์ชันที่เลือกมี Skill Card ที่สร้างแล้ว ไม่ถูกการกลั่นกรองบล็อกเนื่องจากเป็นมัลแวร์ และผลการตรวจสอบ ClawScan เป็น `clean`
- ข้อมูลระบุตัวตนของ Skills ข้อมูลระบุตัวตนของผู้เผยแพร่ และข้อมูลเมตาของเวอร์ชันที่เลือกเป็นฟิลด์ระดับบนสุดของซองข้อมูล (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) เพื่อให้ระบบอัตโนมัติของเชลล์อ่านได้โดยไม่ต้องแกะโครงสร้างซ้อน
- `security` คือผลตัดสิน ClawScan/ความปลอดภัยระดับบนสุด ระบบอัตโนมัติควรตัดสินจาก `ok`, `decision`, `reasons` และ `security.status`
- `security.signals` มีหลักฐานสนับสนุนจากเครื่องมือสแกน เช่น `staticScan`, `virusTotal` และ `skillSpector`
- `security.signals.dependencyRegistry` ยังคงไว้เพื่อให้การตอบกลับ v1 เข้ากันได้ แต่เครื่องมือสแกนตรวจสอบการมีอยู่ของรีจิสทรีการพึ่งพาถูกยกเลิกแล้ว และคีย์นี้จะเป็น `null` เสมอ
- `provenance` จะเป็น `server-resolved-github-import` เฉพาะเมื่อ ClawHub แปลงและจัดเก็บที่เก็บ/การอ้างอิง/คอมมิต/พาธของ GitHub ระหว่างการเผยแพร่หรือนำเข้า มิฉะนั้นจะเป็น `unavailable`

### `POST /api/v1/skills/-/security-verdicts`

ส่งคืนผลตัดสินด้านความปลอดภัยแบบย่อปัจจุบันสำหรับเวอร์ชัน Skills ที่ตรงกันทุกประการ ปลายทาง
คอลเลกชันนี้มีไว้สำหรับไคลเอนต์ที่ทราบอยู่แล้วว่าต้องแสดงเวอร์ชัน
Skills ของ ClawHub ใดที่ติดตั้งไว้ เช่น OpenClaw Control UI

คำขอ:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

หมายเหตุ:

- `items` ต้องมีคู่ `{ slug, version }` ที่ไม่ซ้ำกันจำนวน 1-100 คู่
- ผลลัพธ์แยกตามแต่ละรายการ การไม่พบ Skills หรือเวอร์ชันหนึ่งรายการจะไม่ทำให้การตอบกลับทั้งหมดล้มเหลว
- การตอบกลับมีเฉพาะข้อมูลความปลอดภัย โดยไม่รวมข้อมูล Skill Card สถานะการสร้างการ์ด รายการไฟล์อาร์ติแฟกต์ หรือเพย์โหลดโดยละเอียดจากเครื่องมือสแกน
- `security.signals` มีเฉพาะหลักฐานสนับสนุนระดับสถานะ ให้ใช้ `/scan` หรือหน้าการตรวจสอบความปลอดภัยของ ClawHub เพื่อดูรายละเอียดทั้งหมดจากเครื่องมือสแกน
- `security.signals.dependencyRegistry` ยังคงไว้เพื่อให้การตอบกลับ v1 เข้ากันได้ แต่เครื่องมือสแกนตรวจสอบการมีอยู่ของรีจิสทรีการพึ่งพาถูกยกเลิกแล้ว และคีย์นี้จะเป็น `null` เสมอ
- การไม่มี Skill Card ไม่มีผลต่อ `ok`, `decision` หรือ `reasons` ของปลายทางนี้ ไคลเอนต์ควรอ่าน `skill-card.md` ที่ติดตั้งไว้ภายในเครื่องเมื่อต้องการเนื้อหาการ์ด
- ใช้ `/verify` เมื่อต้องการซองข้อมูลการตรวจสอบ Skill Card สำหรับ Skills รายการเดียว ใช้ `/card` เมื่อต้องการ Markdown ของการ์ดที่สร้างแล้ว และใช้ `/scan` เมื่อต้องการข้อมูลโดยละเอียดจากเครื่องมือสแกน

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
      "error": { "code": "version_not_found", "message": "ไม่พบเวอร์ชัน" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

ส่งคืนเนื้อหาข้อความดิบ

พารามิเตอร์การสืบค้น:

- `path` (จำเป็น)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ค่าเริ่มต้นคือเวอร์ชันล่าสุด
- ขีดจำกัดขนาดไฟล์: 200KB

### `GET /api/v1/packages`

ปลายทางแค็ตตาล็อกแบบรวมสำหรับ:

- Skills
- Plugin โค้ด
- Plugin แบบชุดรวม

พารามิเตอร์การสืบค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์สำหรับการแบ่งหน้า
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended`, `trending`, `downloads` หรือชื่อแทนเดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอจำกัดขอบเขตไว้ที่แพ็กเกจ Plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` หรือปลายทางแพ็กเกจที่มี
  `family=code-plugin`/`family=bundle-plugin`) หมวดหมู่ที่ควบคุมและ
  ชื่อแทนตัวกรอง v1 เดิมมีคำอธิบายอยู่ภายใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` หรือ `sort` จะส่งคืน `400` ระบบจะละเว้นพารามิเตอร์การสืบค้นที่ไม่รู้จัก
- `GET /api/v1/code-plugins` และ `GET /api/v1/bundle-plugins` ยังคงเป็นชื่อแทนที่กำหนดตระกูลตายตัว
- รายการ Skills ยังคงอ้างอิงรีจิสทรี Skills และยังคงเผยแพร่ได้ผ่าน `POST /api/v1/skills` เท่านั้น
- `POST /api/v1/packages` ยังคงใช้สำหรับรุ่นเผยแพร่ของ Plugin โค้ดและ Plugin แบบชุดรวมเท่านั้น
- ผู้เรียกที่ไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถเห็นแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดอยู่ในผลลัพธ์รายการและการค้นหา
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกซึ่งผ่านการยืนยันตัวตนมีสิทธิ์อ่าน

### `GET /api/v1/packages/search`

ค้นหาแค็ตตาล็อกแบบรวมครอบคลุม Skills และแพ็กเกจ Plugin

พารามิเตอร์การสืบค้น:

- `q` (จำเป็น): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอจำกัดขอบเขตไว้ที่แพ็กเกจ Plugin หมวดหมู่ที่ควบคุมและชื่อแทนตัวกรอง
  v1 เดิมมีคำอธิบายอยู่ภายใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured` หรือ
  `highlightedOnly` จะส่งคืน `400` ระบบจะละเว้นพารามิเตอร์การสืบค้นที่ไม่รู้จัก
- ผู้เรียกที่ไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถค้นหาแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดอยู่
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกซึ่งผ่านการยืนยันตัวตนมีสิทธิ์อ่าน

### `GET /api/v1/plugins`

เรียกดูแค็ตตาล็อกเฉพาะ Plugin ซึ่งครอบคลุมแพ็กเกจ Plugin โค้ดและ Plugin แบบชุดรวม

พารามิเตอร์การสืบค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์สำหรับการแบ่งหน้า
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `recommended` (ค่าเริ่มต้น), `trending`, `downloads`, `updated` หรือชื่อแทนเดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบันได้แก่:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

ชื่อแทนตัวกรอง v1 เดิมยังคงใช้ได้กับปลายทางการอ่าน:

- `mcp-tooling`, `data` และ `automation` จะถูกแปลงเป็น `tools`
- `observability` และ `deployment` จะถูกแปลงเป็น `gateway`
- `dev-tools` จะถูกแปลงเป็น `runtime`

`trending` เป็นตารางอันดับการติดตั้ง/ดาวน์โหลดในช่วงเจ็ดวันและไม่ใช้ยอดรวมตลอดเวลา
ในปลายทางแบบรวม `/api/v1/packages` ค่านี้ใช้ได้เฉพาะกับ Plugin สำหรับแค็ตตาล็อก Skills ให้ใช้
`/api/v1/skills?sort=trending`

ระบบไม่ยอมรับชื่อแทนเดิมเป็นค่าหมวดหมู่ที่จัดเก็บหรือที่ผู้เขียนประกาศ

### `GET /api/v1/skills/export`

ส่งออก Skills สาธารณะเวอร์ชันล่าสุดจำนวนมากสำหรับการวิเคราะห์แบบออฟไลน์

การยืนยันตัวตน:

- จำเป็นต้องใช้โทเค็น API

พารามิเตอร์การสืบค้น:

- `startDate` (จำเป็น): ขอบเขตล่างในหน่วยมิลลิวินาที Unix สำหรับ `updatedAt` ของ Skill
- `endDate` (จำเป็น): ขอบเขตบนในหน่วยมิลลิวินาที Unix สำหรับ `updatedAt` ของ Skill
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250) ค่าเริ่มต้นคือ `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์สำหรับการแบ่งหน้าจากการตอบกลับก่อนหน้า

การตอบกลับ:

- เนื้อหา: ไฟล์เก็บถาวร ZIP
- Skill ที่ส่งออกแต่ละรายการมีไดเรกทอรีรากที่ `{publisher}/{slug}/`
- Skills ที่โฮสต์ไว้จะมีไฟล์เวอร์ชันล่าสุดที่จัดเก็บไว้ และแสดงรายการใน
  `_manifest.json` พร้อม `sourceRef: "public-clawhub"`
- Skills ปัจจุบันที่อ้างอิง GitHub และมีผลการสแกนเป็น `clean` หรือ `suspicious` จะมี
  `_source_handoff.json` พร้อม `sourceRef: "public-github"`, รีโพซิทอรี, คอมมิต, พาธ,
  แฮชเนื้อหา และ URL ของไฟล์เก็บถาวร โดยจะไม่มีไฟล์ต้นฉบับที่โฮสต์บน ClawHub
- Skill แต่ละรายการมี `_export_skill_meta.json`
- มี `_manifest.json` ที่รากของ ZIP เสมอ
- มี `_errors.json` เมื่อไม่สามารถส่งออก Skills หรือไฟล์บางรายการได้

ส่วนหัว:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

ส่งออกรีลีสสาธารณะล่าสุดของ Plugin จำนวนมากสำหรับการวิเคราะห์แบบออฟไลน์

การยืนยันตัวตน:

- ต้องใช้โทเค็น API

พารามิเตอร์คำค้น:

- `startDate` (จำเป็น): ขอบเขตล่างในหน่วยมิลลิวินาทีแบบ Unix สำหรับ `updatedAt` ของ Plugin
- `endDate` (จำเป็น): ขอบเขตบนในหน่วยมิลลิวินาทีแบบ Unix สำหรับ `updatedAt` ของ Plugin
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250) ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าจากการตอบกลับก่อนหน้า
- `family` (ไม่บังคับ): `code-plugin` หรือ `bundle-plugin` หากละเว้น จะหมายถึง
  Plugin ทั้งสองตระกูล

การตอบกลับ:

- เนื้อหา: ไฟล์เก็บถาวร ZIP
- Plugin ที่ส่งออกแต่ละรายการมีไดเรกทอรีรากเป็น `{family}/{packageName}/`
- Plugin ที่ส่งออกแต่ละรายการประกอบด้วยไฟล์ที่จัดเก็บไว้ของรีลีสล่าสุด
- ข้อมูลเมตาการส่งออกของแต่ละ Plugin จัดเก็บไว้ที่
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`
- `_manifest.json` จะรวมอยู่ที่รากของ ZIP เสมอ
- `_errors.json` จะรวมอยู่เมื่อไม่สามารถส่งออก Plugin หรือไฟล์บางรายการได้

ส่วนหัว:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

ค้นหาเฉพาะ Plugin ในแพ็กเกจ `code-plugin` และ `bundle-plugin`

พารามิเตอร์คำค้น:

- `q` (จำเป็น): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

หมายเหตุ:

- นามแฝงตัวกรอง v1 แบบเดิมที่บันทึกไว้ภายใต้ `GET /api/v1/plugins`
  สามารถใช้ได้เช่นกัน
- การกรองหมวดหมู่เป็นตัวกรอง API จริงที่อ้างอิงแถวไดเจสต์หมวดหมู่ของ Plugin
  ไม่ใช่การเขียนคำค้นใหม่
- ผลลัพธ์จะส่งกลับตามลำดับความเกี่ยวข้อง และปัจจุบันยังไม่มีการแบ่งหน้า
- ตัวควบคุมการเรียงลำดับใน UI ของเบราว์เซอร์สำหรับการค้นหา Plugin จะจัดลำดับผลลัพธ์ตามความเกี่ยวข้องที่โหลดแล้วใหม่
  ให้สอดคล้องกับพฤติกรรมการเรียกดู `/skills` ปัจจุบัน

### `GET /api/v1/packages/{name}`

ส่งคืนข้อมูลเมตารายละเอียดของแพ็กเกจ

หมายเหตุ:

- Skills สามารถถูกแก้ไขผ่านเส้นทางนี้ในแค็ตตาล็อกแบบรวมได้เช่นกัน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกมีสิทธิ์อ่านผู้เผยแพร่ที่เป็นเจ้าของ

### `DELETE /api/v1/packages/{name}`

ลบแพ็กเกจและรีลีสทั้งหมดแบบซอฟต์

หมายเหตุ:

- ต้องใช้โทเค็น API ของเจ้าของแพ็กเกจ เจ้าของ/ผู้ดูแลระบบขององค์กรผู้เผยแพร่ ผู้ควบคุมแพลตฟอร์ม หรือผู้ดูแลระบบแพลตฟอร์ม

### `GET /api/v1/packages/{name}/versions`

ส่งคืนประวัติเวอร์ชัน

พารามิเตอร์คำค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

หมายเหตุ:

- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกมีสิทธิ์อ่านผู้เผยแพร่ที่เป็นเจ้าของ

### `GET /api/v1/packages/{name}/versions/{version}`

ส่งคืนแพ็กเกจหนึ่งเวอร์ชัน รวมถึงข้อมูลเมตาของไฟล์ ความเข้ากันได้
การตรวจสอบยืนยัน ข้อมูลเมตาของอาร์ติแฟกต์ และข้อมูลการสแกน

หมายเหตุ:

- `version.artifact.kind` เป็น `legacy-zip` สำหรับไฟล์เก็บถาวรแพ็กเกจแบบเก่า หรือ
  `npm-pack` สำหรับรีลีสที่ใช้ ClawPack
- รีลีส ClawPack ประกอบด้วยฟิลด์ `npmIntegrity`, `npmShasum` และ
  `npmTarballName` ที่เข้ากันได้กับ npm
- `version.sha256hash` เป็นข้อมูลเมตาความเข้ากันได้ที่เลิกใช้แล้วสำหรับไคลเอนต์เก่า โดย
  แฮชไบต์ ZIP ที่ตรงกันทุกประการซึ่งส่งคืนจาก `/api/v1/packages/{name}/download`
  ไคลเอนต์สมัยใหม่ควรใช้ `version.artifact.sha256` ซึ่งระบุ
  อาร์ติแฟกต์รีลีสหลัก
- `version.vtAnalysis`, `version.llmAnalysis` และ `version.staticScan`
  จะรวมอยู่เมื่อมีข้อมูลการสแกน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกมีสิทธิ์อ่านผู้เผยแพร่ที่เป็นเจ้าของ

### `GET /api/v1/packages/{name}/versions/{version}/security`

ส่งคืนข้อมูลสรุปด้านความปลอดภัยและความน่าเชื่อถือของรีลีสแพ็กเกจที่ระบุอย่างแม่นยำสำหรับไคลเอนต์
ติดตั้ง นี่คือพื้นผิวสาธารณะที่ OpenClaw ใช้เพื่อตัดสินว่า
รีลีสที่แก้ไขแล้วสามารถติดตั้งได้หรือไม่

การยืนยันตัวตน:

- ปลายทางอ่านแบบสาธารณะ ไม่จำเป็นต้องใช้โทเค็นของเจ้าของ ผู้เผยแพร่ ผู้ควบคุม หรือผู้ดูแลระบบ

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
  แพ็กเกจรีจิสทรีที่แก้ไขแล้ว
- `release.releaseId`, `release.version` และ `release.createdAt` ระบุ
  รีลีสที่ได้รับการประเมินอย่างแม่นยำ
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` และ `release.npmTarballName` จะมีเมื่อทราบค่า
  สำหรับอาร์ติแฟกต์รีลีส
- `trust.scanStatus` คือสถานะความน่าเชื่อถือที่มีผล ซึ่งได้มาจากข้อมูลขาเข้าของเครื่องสแกน
  และการควบคุมรีลีสด้วยตนเอง
- `trust.moderationState` สามารถเป็นค่าว่างได้ โดยจะเป็น `null` เมื่อไม่มี
  การควบคุมรีลีสด้วยตนเอง
- `trust.blockedFromDownload` คือสัญญาณบล็อกการติดตั้ง OpenClaw และไคลเอนต์
  ติดตั้งอื่นควรบล็อกการติดตั้งเมื่อค่านี้เป็น `true` แทนการ
  คำนวณกฎการบล็อกใหม่จากฟิลด์เครื่องสแกนหรือการควบคุม
- `trust.reasons` คือรายการคำอธิบายสำหรับผู้ใช้และการตรวจสอบย้อนหลัง รหัสเหตุผล
  เป็นสตริงสั้นกะทัดรัดและคงที่ เช่น `manual:quarantined`, `scan:malicious`
  และ `package:malicious`
- `trust.pending` หมายความว่าข้อมูลขาเข้าด้านความน่าเชื่อถืออย่างน้อยหนึ่งรายการยังรอการดำเนินการให้เสร็จสิ้น
- `trust.stale` หมายความว่าข้อมูลสรุปความน่าเชื่อถือถูกคำนวณจากข้อมูลขาเข้าที่ล้าสมัย และ
  ควรถือว่าต้องรีเฟรชก่อนตัดสินใจอนุญาตด้วยความเชื่อมั่นสูง

หมายเหตุ:

- ปลายทางนี้เจาะจงตามเวอร์ชัน ไคลเอนต์ควรเรียกใช้หลังจากแก้ไข
  เวอร์ชันแพ็กเกจที่ตั้งใจจะติดตั้ง ไม่ใช่เพียงหลังจากอ่านข้อมูลเมตา
  แพ็กเกจล่าสุด
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกมีสิทธิ์อ่านผู้เผยแพร่ที่เป็นเจ้าของ
- ปลายทางนี้จงใจมีขอบเขตแคบกว่าปลายทางการควบคุมของ
  เจ้าของ/ผู้ควบคุม โดยเปิดเผยการตัดสินใจติดตั้งและคำอธิบายสาธารณะ แต่ไม่เปิดเผย
  ตัวตนผู้รายงาน เนื้อหารายงาน หลักฐานส่วนตัว หรือไทม์ไลน์การตรวจสอบ
  ภายใน

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

ส่งคืนข้อมูลเมตาตัวแก้ไขอาร์ติแฟกต์อย่างชัดเจนสำหรับเวอร์ชันแพ็กเกจ

หมายเหตุ:

- แพ็กเกจเวอร์ชันเดิมส่งคืนอาร์ติแฟกต์ `legacy-zip` และ
  `downloadUrl` ของ ZIP แบบเดิม
- เวอร์ชัน ClawPack ส่งคืนอาร์ติแฟกต์ `npm-pack` ฟิลด์ความสมบูรณ์ของ npm
  `tarballUrl` และ URL ความเข้ากันได้ของ ZIP แบบเดิม
- นี่คือพื้นผิวตัวแก้ไขของ OpenClaw ซึ่งช่วยหลีกเลี่ยงการคาดเดารูปแบบไฟล์เก็บถาวรจาก
  URL ที่ใช้ร่วมกัน

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ดาวน์โหลดอาร์ติแฟกต์ของเวอร์ชันผ่านเส้นทางตัวแก้ไขที่ชัดเจน

หมายเหตุ:

- เวอร์ชัน ClawPack สตรีมไบต์ `.tgz` ของ npm-pack ที่อัปโหลดไว้อย่างตรงกันทุกประการ
- เวอร์ชัน ZIP แบบเดิมเปลี่ยนเส้นทางไปยัง `/api/v1/packages/{name}/download?version=`
- ใช้บักเก็ตอัตราการดาวน์โหลด

### `GET /api/v1/packages/{name}/readiness`

ส่งคืนความพร้อมที่คำนวณแล้วสำหรับการใช้งานโดย OpenClaw ในอนาคต

การตรวจสอบความพร้อมครอบคลุม:

- สถานะช่องทางอย่างเป็นทางการ
- ความพร้อมใช้งานของเวอร์ชันล่าสุด
- ความพร้อมใช้งานของอาร์ติแฟกต์ npm-pack ของ ClawPack
- ไดเจสต์อาร์ติแฟกต์
- ที่เก็บซอร์สและที่มาของคอมมิต
- ข้อมูลเมตาความเข้ากันได้ของ OpenClaw
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

ปลายทางสำหรับผู้ควบคุมเพื่อแสดงรายการแถวการย้าย Plugin อย่างเป็นทางการของ OpenClaw

การยืนยันตัวตน:

- ต้องใช้โทเค็น API ของผู้ใช้ที่เป็นผู้ควบคุมหรือผู้ดูแลระบบ

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

ปลายทางสำหรับผู้ดูแลระบบเพื่อสร้างหรืออัปเดตแถวการย้าย Plugin อย่างเป็นทางการ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API ของผู้ใช้ที่เป็นผู้ดูแลระบบ

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

- `bundledPluginId` จะถูกปรับให้เป็นตัวพิมพ์เล็กและเป็นคีย์ upsert ที่คงที่
- `packageName` จะถูกปรับให้เป็นชื่อ npm มาตรฐาน โดยแพ็กเกจอาจไม่มีอยู่สำหรับการย้าย
  ที่วางแผนไว้
- ส่วนนี้ติดตามเฉพาะความพร้อมในการย้ายเท่านั้น โดยจะไม่แก้ไข OpenClaw หรือสร้าง
  ClawPack

### `GET /api/v1/packages/moderation/queue`

ปลายทางสำหรับผู้ควบคุม/ผู้ดูแลระบบสำหรับคิวตรวจสอบรีลีสแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API ของผู้ใช้ที่เป็นผู้ควบคุมหรือผู้ดูแลระบบ

พารามิเตอร์คำค้น:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `blocked`, `manual` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

ความหมายของสถานะ:

- `open`: รีลีสที่น่าสงสัย เป็นอันตราย รอดำเนินการ ถูกกักกัน ถูกเพิกถอน หรือถูกรายงาน
- `blocked`: รีลีสที่ถูกกักกัน ถูกเพิกถอน หรือเป็นอันตราย
- `manual`: รีลีสใด ๆ ที่มีการแทนที่การควบคุมด้วยตนเอง
- `all`: รีลีสใด ๆ ที่มีการแทนที่ด้วยตนเอง สถานะการสแกนที่ไม่สะอาด หรือรายงานแพ็กเกจ

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

รายงานแพ็กเกจเพื่อให้ผู้ควบคุมตรวจสอบ รายงานอยู่ในระดับแพ็กเกจ และอาจ
เชื่อมโยงกับเวอร์ชันได้ รายงานจะถูกส่งเข้าสู่คิวการควบคุม แต่จะไม่ซ่อนหรือ
บล็อกการดาวน์โหลดโดยอัตโนมัติด้วยตัวเอง ผู้ควบคุมควรใช้การควบคุมรีลีสเพื่อ
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

เอนด์พอยต์สำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อรับรายงานแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API ของผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คำค้น:

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

เอนด์พอยต์สำหรับเจ้าของ/ผู้ดูแลเพื่อดูข้อมูลการกลั่นกรองแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API ของเจ้าของแพ็กเกจ สมาชิกผู้เผยแพร่ ผู้ดูแล หรือ
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

เอนด์พอยต์สำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อปิดหรือเปิดรายงานแพ็กเกจอีกครั้ง

คำขอ:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

ต้องระบุ `note` สำหรับ `confirmed` และ `dismissed` แต่สามารถละเว้นได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "quarantine"` หรือ
`finalAction: "revoke"` พร้อมรายงานที่ยืนยันแล้ว เพื่อใช้การกลั่นกรองรุ่นเผยแพร่ใน
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

เอนด์พอยต์สำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อตรวจสอบรุ่นเผยแพร่ของแพ็กเกจ

คำขอ:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

สถานะที่รองรับ:

- `approved`: ผ่านการตรวจสอบด้วยตนเองและได้รับอนุญาต
- `quarantined`: ถูกบล็อกระหว่างรอการดำเนินการติดตาม
- `revoked`: ถูกบล็อกหลังจากรุ่นเผยแพร่เคยได้รับความเชื่อถือ

รุ่นเผยแพร่ที่ถูกกักกันและเพิกถอนจะส่งคืน `403` จากเส้นทางดาวน์โหลดอาร์ติแฟกต์
ทุกการเปลี่ยนแปลงจะเขียนรายการลงในบันทึกการตรวจสอบ

### `GET /api/v1/packages/{name}/file`

ส่งคืนเนื้อหาข้อความดิบของไฟล์ในแพ็กเกจ

พารามิเตอร์คำค้น:

- `path` (จำเป็น)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ใช้รุ่นเผยแพร่ล่าสุดเป็นค่าเริ่มต้น
- ใช้บัคเก็ตจำกัดอัตราการอ่าน ไม่ใช่บัคเก็ตดาวน์โหลด
- ไฟล์ไบนารีจะส่งคืน `415`
- ขีดจำกัดขนาดไฟล์: 200KB
- การสแกน VirusTotal ที่รอดำเนินการจะไม่บล็อกการอ่าน แต่รุ่นเผยแพร่ที่เป็นอันตรายอาจยังถูกระงับไว้ในส่วนอื่น
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะมีสิทธิ์อ่านผู้เผยแพร่ที่เป็นเจ้าของ

### `GET /api/v1/packages/{name}/download`

ดาวน์โหลดไฟล์เก็บถาวร ZIP แบบกำหนดผลลัพธ์แน่นอนรุ่นเดิมสำหรับรุ่นเผยแพร่ของแพ็กเกจ

พารามิเตอร์คำค้น:

- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ใช้รุ่นเผยแพร่ล่าสุดเป็นค่าเริ่มต้น
- Skills จะเปลี่ยนเส้นทางไปยัง `GET /api/v1/download`
- ไฟล์เก็บถาวรของ Plugin/แพ็กเกจเป็นไฟล์ zip ที่มีรากเป็น `package/` เพื่อให้ไคลเอนต์ OpenClaw
  รุ่นเก่ายังคงทำงานได้
- เส้นทางนี้รองรับเฉพาะ ZIP โดยจะไม่สตรีมไฟล์ ClawPack `.tgz`
- การตอบกลับมีส่วนหัว `ETag`, `Digest`, `X-ClawHub-Artifact-Type` และ
  `X-ClawHub-Artifact-Sha256` สำหรับการตรวจสอบความสมบูรณ์โดยตัวแก้ไขแหล่งที่มา
- จะไม่มีการแทรกเมทาดาทาเฉพาะรีจิสทรีลงในไฟล์เก็บถาวรที่ดาวน์โหลด
- การสแกน VirusTotal ที่รอดำเนินการจะไม่บล็อกการดาวน์โหลด แต่รุ่นเผยแพร่ที่เป็นอันตรายจะส่งคืน `403`
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะเป็นเจ้าของ

### `GET /api/npm/{package}`

ส่งคืนแพ็กคิวเมนต์ที่เข้ากันได้กับ npm สำหรับรุ่นแพ็กเกจที่ใช้ ClawPack

หมายเหตุ:

- แสดงเฉพาะรุ่นที่มีทาร์บอล npm-pack ของ ClawPack อัปโหลดอยู่
- รุ่นเดิมที่มีเฉพาะ ZIP จะถูกละเว้นโดยตั้งใจ
- `dist.tarball`, `dist.integrity` และ `dist.shasum` ใช้ฟิลด์ที่เข้ากันได้กับ npm
  เพื่อให้ผู้ใช้ชี้ npm ไปยังมิเรอร์ได้หากต้องการ
- แพ็กคิวเมนต์ของแพ็กเกจแบบมีสโคปรองรับทั้ง `/api/npm/@scope/name` และเส้นทางคำขอ
  `/api/npm/@scope%2Fname` ที่เข้ารหัสโดย npm

### `GET /api/npm/{package}/-/{tarball}.tgz`

สตรีมไบต์ของทาร์บอล ClawPack ที่อัปโหลดไว้โดยตรงสำหรับไคลเอนต์มิเรอร์ npm

หมายเหตุ:

- ใช้บัคเก็ตจำกัดอัตราการดาวน์โหลด
- ส่วนหัวการดาวน์โหลดมี SHA-256 ของ ClawHub รวมถึงเมทาดาทาความสมบูรณ์/ค่า shasum ของ npm
- การตรวจสอบการกลั่นกรองและสิทธิ์เข้าถึงแพ็กเกจส่วนตัวยังคงมีผล

### `GET /api/v1/resolve`

CLI ใช้เพื่อจับคู่ลายนิ้วมือภายในเครื่องกับรุ่นที่รู้จัก

พารามิเตอร์คำค้น:

- `slug` (จำเป็น)
- `hash` (จำเป็น): ค่า sha256 ฐานสิบหก 64 อักขระของลายนิ้วมือบันเดิล

การตอบกลับ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ดาวน์โหลด ZIP ของรุ่น Skills ที่โฮสต์ไว้ หรือส่งคืนข้อมูลส่งต่อไปยังซอร์ส GitHub สำหรับ
Skills ปัจจุบันที่ใช้ GitHub ซึ่งมีผลสแกนเป็น `clean` หรือ `suspicious` และไม่มี
รุ่นที่โฮสต์ไว้

พารามิเตอร์คำค้น:

- `slug` (จำเป็น)
- `version` (ไม่บังคับ): สตริง semver
- `tag` (ไม่บังคับ): ชื่อแท็ก (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` ระบบจะใช้รุ่นล่าสุด
- รุ่นที่ถูกลบแบบกู้คืนได้จะส่งคืน `410`
- การส่งต่อ Skills ที่ใช้ GitHub จะไม่ทำหน้าที่เป็นพร็อกซีหรือมิเรอร์ไบต์ การตอบกลับ JSON
  มี `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  และ `archiveUrl`; สถานะการสแกน/สถานะปัจจุบันเป็นเงื่อนไขควบคุมและจะไม่รวมอยู่ในเมทาดาทา
  เพย์โหลดเมื่อสำเร็จ
- สถิติการดาวน์โหลดจะนับตามอัตลักษณ์ที่ไม่ซ้ำกันต่อวัน UTC (`userId` เมื่อโทเค็น API ใช้ได้ มิฉะนั้นใช้ IP)

## เอนด์พอยต์การยืนยันตัวตน (โทเค็น Bearer)

เอนด์พอยต์ทั้งหมดต้องมี:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

ตรวจสอบความถูกต้องของโทเค็นและส่งคืนแฮนเดิลผู้ใช้

### `POST /api/v1/skills`

เผยแพร่รุ่นใหม่

- แนะนำ: `multipart/form-data` พร้อม JSON ใน `payload` + บล็อบ `files[]`
- รองรับเนื้อหา JSON ที่มี `files` (อ้างอิงด้วย storageId) เช่นกัน
- ฟิลด์เพย์โหลดที่ไม่บังคับ: `ownerHandle` เมื่อระบุ API จะแก้ไขผู้เผยแพร่รายนั้น
  ฝั่งเซิร์ฟเวอร์และกำหนดให้ผู้ดำเนินการมีสิทธิ์เข้าถึงผู้เผยแพร่
- ฟิลด์เพย์โหลดที่ไม่บังคับ: `migrateOwner` เมื่อเป็น `true` พร้อม `ownerHandle`
  Skills ที่มีอยู่อาจย้ายไปยังเจ้าของรายนั้นได้ หากผู้ดำเนินการเป็นผู้ดูแลระบบ/เจ้าของของทั้ง
  ผู้เผยแพร่ปัจจุบันและเป้าหมาย หากไม่เลือกใช้ตัวเลือกนี้ การเปลี่ยนเจ้าของจะ
  ถูกปฏิเสธ

### `POST /api/v1/packages`

เผยแพร่รุ่นของ code-plugin หรือ bundle-plugin

- ต้องยืนยันตัวตนด้วยโทเค็น Bearer
- ต้องใช้ `multipart/form-data`
- ฟิลด์ฟอร์มที่อนุญาตคือ `payload`, บล็อบ `files` ที่ระบุซ้ำ หรือการอ้างอิงทาร์บอล `clawpack`
  หนึ่งรายการ `clawpack` อาจเป็นบล็อบ `.tgz` หรือรหัสพื้นที่จัดเก็บที่ส่งคืนจาก
  ขั้นตอน upload-url การเผยแพร่ด้วยรหัสพื้นที่จัดเก็บที่จัดเตรียมไว้ต้องมี
  `clawpackUploadTicket` ที่ส่งคืนพร้อม URL อัปโหลดนั้นด้วย
- ใช้ `files` หรือ `clawpack` อย่างใดอย่างหนึ่ง ห้ามใช้ทั้งสองอย่างในคำขอเดียวกัน
- เนื้อหา JSON และเมทาดาทา `payload.files` / `payload.artifact`
  ที่ผู้เรียกระบุจะถูกปฏิเสธ
- คำขอเผยแพร่แบบ multipart โดยตรงจำกัดไว้ที่ 18MB ทาร์บอล ClawPack อาจ
  ใช้ขั้นตอน upload-url ได้จนถึงขีดจำกัดทาร์บอล 120MB
- ฟิลด์เพย์โหลดที่ไม่บังคับ: `ownerHandle` เมื่อระบุ เฉพาะผู้ดูแลระบบเท่านั้นที่เผยแพร่ในนามของเจ้าของรายนั้นได้

ประเด็นสำคัญในการตรวจสอบความถูกต้อง:

- `family` ต้องเป็น `code-plugin` หรือ `bundle-plugin`
- แพ็กเกจ Plugin ต้องมี `openclaw.plugin.json` การอัปโหลด ClawPack `.tgz` ต้อง
  มีไฟล์นี้ที่ `package/openclaw.plugin.json`
- Plugin แบบโค้ดต้องมี `package.json`, เมทาดาทารีโพซิทอรีซอร์ส, เมทาดาทาคอมมิตซอร์ส,
  เมทาดาทาสคีมาการกำหนดค่า, `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion`
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมทาดาทาที่ไม่บังคับ
- เฉพาะผู้เผยแพร่ขององค์กร `openclaw` และผู้เผยแพร่ส่วนบุคคลของสมาชิกปัจจุบันในองค์กร `openclaw`
  เท่านั้นที่เผยแพร่ไปยังช่อง `official` ได้
- การเผยแพร่ในนามของผู้อื่นยังคงตรวจสอบสิทธิ์ใช้ช่อง official กับบัญชีเจ้าของเป้าหมาย

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

ลบแบบกู้คืนได้ / กู้คืน Skills (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)

เนื้อหา JSON ที่ไม่บังคับ:

```json
{ "reason": "Held for moderation pending legal review." }
```

เมื่อระบุ `reason` ระบบจะจัดเก็บเป็นบันทึกการกลั่นกรอง Skills และคัดลอกไปยังบันทึกการตรวจสอบ
การลบแบบกู้คืนได้ที่เจ้าของเป็นผู้ดำเนินการจะสงวน slug ไว้ 30 วัน จากนั้นผู้เผยแพร่รายอื่น
สามารถขอใช้ slug ดังกล่าวได้ การตอบกลับการลบจะมี `slugReservedUntil` เมื่อมีการหมดอายุนี้
การซ่อนโดยผู้ดูแล/ผู้ดูแลระบบและการนำออกด้วยเหตุผลด้านความปลอดภัยจะไม่หมดอายุด้วยวิธีนี้

การตอบกลับการลบ:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

รหัสสถานะ:

- `200`: สำเร็จ
- `401`: ไม่ได้รับการยืนยันตัวตน
- `403`: ไม่ได้รับอนุญาต
- `404`: ไม่พบ Skills/ผู้ใช้
- `500`: ข้อผิดพลาดภายในเซิร์ฟเวอร์

### `POST /api/v1/users/publisher`

สำหรับผู้ดูแลระบบเท่านั้น รับรองว่ามีผู้เผยแพร่แบบองค์กรสำหรับแฮนเดิล หากแฮนเดิลยังชี้ไปยัง
ผู้เผยแพร่แบบผู้ใช้ร่วม/ส่วนบุคคลรุ่นเดิม เอนด์พอยต์จะย้ายไปเป็นผู้เผยแพร่แบบองค์กรก่อน
สำหรับองค์กรที่สร้างใหม่ ให้ระบุ `memberHandle`; ผู้ดูแลระบบที่ดำเนินการจะไม่ถูกเพิ่มเป็นสมาชิก
`memberRole` มีค่าเริ่มต้นเป็น `owner`

- เนื้อหา: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- การตอบกลับ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

การสร้างผู้เผยแพร่แบบองค์กรด้วยตนเองโดยผ่านการยืนยันตัวตน สร้างผู้เผยแพร่แบบองค์กรใหม่และเพิ่ม
ผู้เรียกเป็นเจ้าของ เอนด์พอยต์นี้จะไม่ย้ายแฮนเดิลผู้ใช้/ส่วนบุคคลที่มีอยู่ และจะไม่
ทำเครื่องหมายผู้เผยแพร่ว่าเชื่อถือได้/เป็นทางการ

- เนื้อหา: `{ "handle": "opik", "displayName": "Opik" }`
- การตอบกลับ: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- ส่งคืน `409` เมื่อแฮนเดิลถูกใช้โดยผู้เผยแพร่ ผู้ใช้ หรือผู้เผยแพร่ส่วนบุคคลอยู่แล้ว

### `POST /api/v1/users/reserve`

สำหรับผู้ดูแลระบบเท่านั้น สงวน slug ระดับรากและชื่อแพ็กเกจให้เจ้าของที่ชอบธรรมโดยไม่เผยแพร่
รุ่น แพ็กเกจที่มีชื่อดังกล่าวจะกลายเป็นแพ็กเกจตัวแทนแบบส่วนตัวที่ไม่มีแถวรุ่นเผยแพร่ เพื่อให้เจ้าของ
รายเดิมสามารถเผยแพร่รุ่น code-plugin หรือ bundle-plugin จริงในชื่อนั้นได้ภายหลัง

- เนื้อหา: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- การตอบกลับ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

สำหรับผู้ดูแลระบบเท่านั้น กู้คืนผู้เผยแพร่ส่วนบุคคลให้ข้อมูลประจำตัวหลัก GitHub OAuth ทดแทนที่ผ่านการตรวจสอบ
โดยไม่แก้ไขแถวบัญชี Convex Auth คำขอต้องระบุรหัสบัญชีผู้ให้บริการ GitHub แบบเปลี่ยนแปลงไม่ได้
ทั้งสองรายการ ส่วนแฮนเดิลที่เปลี่ยนแปลงได้ใช้เป็นเพียงเงื่อนไขป้องกันสำหรับผู้ปฏิบัติงานเท่านั้น

ปลายทางนี้มีค่าเริ่มต้นเป็นการทดลองรัน การนำการกู้คืนไปใช้ต้องกำหนด `dryRun: false` และ
`confirmIdentityVerified: true` หลังจากเจ้าหน้าที่ตรวจสอบความต่อเนื่องระหว่างตัวตนหลักทั้งสองบน
GitHub อย่างเป็นอิสระ การกู้คืนจะล้มเหลวแบบปิดกั้นเมื่อผู้เผยแพร่ส่วนบุคคลปัจจุบันของผู้ใช้ปลายทาง
มี Skills, แพ็กเกจ หรือแหล่ง Skills จาก GitHub
การกู้คืนยังย้ายฟิลด์ `ownerUserId` แบบเดิมสำหรับ Skills ของผู้เผยแพร่ที่กู้คืน
นามแฝงสลักของ Skill, แพ็กเกจ, คำเตือนจากตัวตรวจสอบแพ็กเกจ และแถวไดเจสต์การค้นหาที่สร้างขึ้น เพื่อให้
เส้นทางเจ้าของโดยตรงสอดคล้องกับสิทธิ์ของผู้เผยแพร่รายใหม่ นอกจากนี้ การจองแฮนเดิลที่มีการป้องกันและยังใช้งานอยู่
สำหรับแฮนเดิลที่กู้คืนจะถูกกำหนดใหม่ให้ผู้ใช้ทดแทน เพื่อไม่ให้การซิงโครไนซ์โปรไฟล์ในภายหลัง
กู้คืนสิทธิ์ที่ขัดแย้งกันของผู้ใช้เดิม แต่ละตารางหลักจำกัดไว้ที่
100 แถวต่อธุรกรรมที่นำไปใช้ การกู้คืนที่มีขนาดใหญ่กว่านี้ต้องใช้การย้ายเจ้าของแบบดำเนินการต่อได้ก่อน
แหล่ง Skills จาก GitHub มีขอบเขตตามผู้เผยแพร่ และจะถูกรายงานว่าตรวจสอบแล้วแทนที่จะเขียนใหม่

- เนื้อหา: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- การตอบกลับ: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### ปลายทางสำหรับจัดการสลักของเจ้าของ

- `POST /api/v1/skills/{slug}/rename`
  - เนื้อหา: `{ "newSlug": "new-canonical-slug" }`
  - การตอบกลับ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - เนื้อหา: `{ "targetSlug": "canonical-target-slug" }`
  - การตอบกลับ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

หมายเหตุ:

- ปลายทางทั้งสองต้องมีการยืนยันตัวตนด้วยโทเค็น API และใช้ได้เฉพาะเจ้าของ Skill เท่านั้น
- `rename` เก็บสลักเดิมไว้เป็นนามแฝงสำหรับเปลี่ยนเส้นทาง
- `merge` ซ่อนรายการต้นทางและเปลี่ยนเส้นทางจากสลักต้นทางไปยังรายการเป้าหมาย

### ปลายทางสำหรับโอนความเป็นเจ้าของ

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

ระงับผู้ใช้และลบ Skills ที่เป็นเจ้าของอย่างถาวร (เฉพาะผู้ดูแลเนื้อหา/ผู้ดูแลระบบ)

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

ยกเลิกการระงับผู้ใช้และกู้คืน Skills ที่มีสิทธิ์กู้คืน (เฉพาะผู้ดูแลระบบ)

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

เปลี่ยนเหตุผลที่จัดเก็บไว้สำหรับการระงับที่มีอยู่ โดยไม่ยกเลิกการระงับหรือกู้คืน
เนื้อหา (เฉพาะผู้ดูแลระบบ) ค่าเริ่มต้นเป็นการทดลองรัน เว้นแต่ `dryRun` จะเป็น `false`

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

เปลี่ยนบทบาทของผู้ใช้ (เฉพาะผู้ดูแลระบบ)

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

เพิ่ม/ลบดาว (ไฮไลต์) ปลายทางทั้งสองเป็นแบบทำซ้ำได้โดยให้ผลลัพธ์เดิม

การตอบกลับ:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## ปลายทาง CLI แบบเดิม (เลิกใช้แล้ว)

ยังคงรองรับ CLI เวอร์ชันเก่า:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

ดูแผนการนำออกใน `DEPRECATIONS.md`

`POST /api/cli/upload-url` ส่งคืน `uploadUrl` และ `uploadTicket` การเผยแพร่
แพ็กเกจที่จัดเตรียมทาร์บอล ClawPack ต้องส่งรหัสพื้นที่จัดเก็บที่ได้เป็น
`clawpack` และส่งตั๋วที่ได้รับคืนเป็น `clawpackUploadTicket`

## การค้นหารีจิสทรี (`/.well-known/clawhub.json`)

CLI สามารถค้นหาการตั้งค่ารีจิสทรี/การยืนยันตัวตนจากเว็บไซต์ได้:

- `/.well-known/clawhub.json` (JSON, แนะนำ)
- `/.well-known/clawdhub.json` (แบบเดิม)

สคีมา:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

หากคุณโฮสต์ด้วยตนเอง ให้ให้บริการไฟล์นี้ (หรือกำหนด `CLAWHUB_REGISTRY` อย่างชัดเจน; แบบเดิมคือ `CLAWDHUB_REGISTRY`)
