---
read_when:
    - การเพิ่ม/เปลี่ยนแปลงเอนด์พอยต์
    - การดีบักคำขอระหว่าง CLI ↔ รีจิสทรี
summary: เอกสารอ้างอิง HTTP API (ปลายทางสาธารณะ + ปลายทาง CLI + การยืนยันตัวตน)
x-i18n:
    generated_at: "2026-07-16T18:58:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

URL ฐาน: `https://clawhub.ai` (ค่าเริ่มต้น)

พาธ v1 ทั้งหมดอยู่ภายใต้ `/api/v1/...`
`/api/...` และ `/api/cli/...` แบบเดิมยังคงไว้เพื่อความเข้ากันได้ (ดู `DEPRECATIONS.md`)
OpenAPI: `/api/v1/openapi.json`

## การนำแค็ตตาล็อกสาธารณะมาใช้ซ้ำ

ไดเรกทอรีของบุคคลที่สามสามารถใช้เอนด์พอยต์อ่านสาธารณะเพื่อแสดงรายการหรือค้นหา Skills ของ ClawHub โปรดแคชผลลัพธ์ ปฏิบัติตาม `429`/`Retry-After` เชื่อมโยงผู้ใช้กลับไปยังรายการมาตรฐานของ ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) และหลีกเลี่ยงการทำให้เข้าใจว่า ClawHub รับรองเว็บไซต์ของบุคคลที่สาม อย่าพยายามทำสำเนาเนื้อหาที่ซ่อนอยู่ เป็นส่วนตัว หรือถูกบล็อกโดยการกลั่นกรองนอกพื้นผิว API สาธารณะ

ทางลัด slug บนเว็บสามารถแก้ไขข้ามตระกูลรีจิสทรีได้ แต่ไคลเอนต์ API ควรใช้
URL มาตรฐานที่เอนด์พอยต์อ่านส่งคืน แทนการสร้างลำดับความสำคัญของเส้นทาง
ขึ้นใหม่

## ขีดจำกัดอัตรา

รูปแบบการบังคับใช้:

- คำขอแบบไม่ระบุตัวตน: บังคับใช้ต่อ IP
- คำขอที่ยืนยันตัวตนแล้ว (Bearer token ที่ถูกต้อง): บังคับใช้ต่อบักเก็ตผู้ใช้
- หากไม่มีโทเค็นหรือโทเค็นไม่ถูกต้อง ลักษณะการทำงานจะย้อนกลับไปใช้การบังคับใช้ตาม IP
- เอนด์พอยต์เขียนที่ยืนยันตัวตนแล้วไม่ควรส่งคืนเพียง `Unauthorized` เมื่อ
  เซิร์ฟเวอร์ทราบสาเหตุ โทเค็นที่ขาดหาย โทเค็นที่ไม่ถูกต้อง/ถูกเพิกถอน และ
  บัญชีที่ถูกลบ/แบน/ปิดใช้งานควรได้รับข้อความที่นำไปดำเนินการได้แยกกัน เพื่อให้ไคลเอนต์ CLI
  สามารถแจ้งผู้ใช้ได้ว่าสิ่งใดขัดขวางการทำงาน

- อ่าน: 3000/นาทีต่อ IP, 12000/นาทีต่อคีย์
- เขียน: 300/นาทีต่อ IP, 3000/นาทีต่อคีย์
- ดาวน์โหลด: 1200/นาทีต่อ IP, 6000/นาทีต่อคีย์ (เอนด์พอยต์ดาวน์โหลด)

ส่วนหัว:

- ความเข้ากันได้แบบเดิม: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- แบบมาตรฐาน: `RateLimit-Limit`, `RateLimit-Reset`
- เมื่อเป็น `429`: `X-RateLimit-Remaining: 0` และ `RateLimit-Remaining: 0`
- เมื่อเป็น `429`: `Retry-After`

ความหมายของส่วนหัว:

- `X-RateLimit-Reset`: วินาที Unix epoch แบบสัมบูรณ์
- `RateLimit-Reset`: จำนวนวินาทีจนกว่าจะรีเซ็ต (ระยะหน่วง)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: งบประมาณที่เหลืออย่างแม่นยำเมื่อมีค่า
  คำขอแบบแบ่งชาร์ดที่สำเร็จจะละเว้นส่วนหัวนี้ แทนการส่งคืนค่ารวมโดยประมาณ
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

เกินขีดจำกัดอัตรา
```

คำแนะนำสำหรับไคลเอนต์:

- หากมี `Retry-After` ให้รอตามจำนวนวินาทีนั้นก่อนลองใหม่
- ใช้การถอยกลับแบบมี jitter เพื่อหลีกเลี่ยงการลองใหม่พร้อมกัน
- หากไม่มี `Retry-After` ให้ย้อนกลับไปใช้ `RateLimit-Reset` (หรือคำนวณจาก `X-RateLimit-Reset`)

แหล่งที่มาของ IP:

- ใช้ส่วนหัว IP ไคลเอนต์ที่เชื่อถือได้ รวมถึง `cf-connecting-ip` เฉพาะเมื่อ
  การปรับใช้เปิดใช้งานส่วนหัวที่ส่งต่อน่าเชื่อถือไว้อย่างชัดเจน
- ClawHub ใช้ส่วนหัวการส่งต่อที่เชื่อถือได้เพื่อระบุ IP ของไคลเอนต์ที่เอดจ์
- หากไม่มี IP ไคลเอนต์ที่เชื่อถือได้ คำขอแบบไม่ระบุตัวตนจะใช้บักเก็ตสำรอง
  ที่กำหนดขอบเขตตามชนิดขีดจำกัดอัตราเท่านั้น บักเก็ตสำรองเหล่านี้ไม่รวม
  พาธ, slug, ชื่อแพ็กเกจ, เวอร์ชัน, สตริงคำค้น หรือพารามิเตอร์อาร์ติแฟกต์อื่น
  ที่ผู้เรียกส่งมา

## การตอบกลับข้อผิดพลาด

การตอบกลับข้อผิดพลาด v1 สาธารณะเป็นข้อความธรรมดาที่มี `content-type: text/plain; charset=utf-8`
ซึ่งรวมถึงความล้มเหลวในการตรวจสอบความถูกต้อง (`400`) ทรัพยากรสาธารณะที่ไม่พบ (`404`) ความล้มเหลวด้านการยืนยันตัวตนและ
สิทธิ์ (`401`/`403`) ขีดจำกัดอัตรา (`429`) และการดาวน์โหลดที่ถูกบล็อก ไคลเอนต์
ควรอ่านเนื้อหาการตอบกลับเป็นสตริงที่มนุษย์อ่านได้ พารามิเตอร์คำค้นที่ไม่รู้จักจะถูก
ละเว้นเพื่อความเข้ากันได้ แต่พารามิเตอร์คำค้นที่ระบบรู้จักแต่มีค่าไม่ถูกต้องจะส่งคืน
`400`

## เอนด์พอยต์สาธารณะ (ไม่ต้องยืนยันตัวตน)

### `GET /api/v1/search`

พารามิเตอร์คำค้น:

- `q` (จำเป็น): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม
- `highlightedOnly` (ไม่บังคับ): `true` เพื่อกรองเฉพาะ Skills ที่ได้รับการเน้น
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): นามแฝงแบบเดิมสำหรับ `nonSuspiciousOnly`

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

- ผลลัพธ์จะส่งคืนตามลำดับความเกี่ยวข้อง (ความคล้ายคลึงของ embedding + การเพิ่มคะแนนเมื่อโทเค็น slug/ชื่อตรงกันทุกประการ + ค่าถ่วงน้ำหนักความนิยมเล็กน้อย)
- ความเกี่ยวข้องมีน้ำหนักมากกว่าความนิยม การตรงกันอย่างแม่นยำของโทเค็น slug หรือชื่อที่แสดงอาจอยู่เหนือการตรงกันแบบหลวมกว่าที่มีการมีส่วนร่วมสูงกว่ามาก
- ข้อความ ASCII จะถูกแบ่งเป็นโทเค็นตามขอบเขตคำและเครื่องหมายวรรคตอน ตัวอย่างเช่น `personal-map` มีโทเค็น `map` แยกต่างหาก ขณะที่ `amap-jsapi-skill` มี `amap`, `jsapi` และ `skill`; ดังนั้นการค้นหา `map` จึงทำให้ `personal-map` ตรงกันทางคำศัพท์มากกว่า `amap-jsapi-skill`
- ความนิยมใช้สเกลลอการิทึมและมีเพดาน Skills ที่มีการมีส่วนร่วมสูงอาจอยู่ในอันดับต่ำกว่าเมื่อข้อความคำค้นตรงกันน้อยกว่า
- สถานะการกลั่นกรองที่น่าสงสัยหรือซ่อนอยู่อาจนำ Skill ออกจากการค้นหาสาธารณะ โดยขึ้นอยู่กับตัวกรองของผู้เรียกและสถานะการกลั่นกรองปัจจุบัน

คำแนะนำด้านการค้นพบสำหรับผู้เผยแพร่:

- ใส่คำที่ผู้ใช้จะค้นหาจริงในชื่อที่แสดง ข้อมูลสรุป และแท็ก ใช้โทเค็น slug แบบแยกต่างหากเฉพาะเมื่อเป็นอัตลักษณ์ที่เสถียรซึ่งต้องการเก็บไว้ด้วย
- อย่าเปลี่ยนชื่อ slug เพียงเพื่อไล่ตามคำค้นหนึ่ง เว้นแต่ slug ใหม่จะเป็นชื่อมาตรฐานระยะยาวที่ดีกว่า slug เก่าจะกลายเป็นนามแฝงสำหรับเปลี่ยนเส้นทาง แต่ URL มาตรฐาน, slug ที่แสดง และข้อมูลสรุปการค้นหาในอนาคตจะใช้ slug ใหม่
- นามแฝงจากการเปลี่ยนชื่อจะคงการแก้ไขสำหรับ URL เก่าและการติดตั้งที่แก้ไขผ่านรีจิสทรี แต่การจัดอันดับการค้นหาจะอิงตามเมทาดาทา Skill มาตรฐานหลังการเปลี่ยนชื่อถูกจัดทำดัชนีแล้ว สถิติเดิมจะยังคงอยู่กับ Skill
- หาก Skill มองไม่เห็นโดยไม่คาดคิด ให้ตรวจสอบสถานะการกลั่นกรองก่อนด้วย `clawhub inspect @owner/slug` ขณะเข้าสู่ระบบ ก่อนเปลี่ยนเมทาดาทาที่เกี่ยวข้องกับการจัดอันดับ

### `GET /api/v1/skills`

พารามิเตอร์คำค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–200)
- `cursor` (ไม่บังคับ): เคอร์เซอร์แบ่งหน้าสำหรับการเรียงลำดับที่ไม่ใช่ `trending`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended` (นามแฝง: `default`), `createdAt` (นามแฝง: `newest`), `downloads`, `stars` (นามแฝง: `rating`), นามแฝงการติดตั้งแบบเดิม `installsCurrent`/`installs`/`installsAllTime` จะจับคู่กับ `downloads`, `trending`
- `nonSuspiciousOnly` (ไม่บังคับ): `true` เพื่อซ่อน Skills ที่น่าสงสัย (`flagged.suspicious`)
- `nonSuspicious` (ไม่บังคับ): นามแฝงแบบเดิมสำหรับ `nonSuspiciousOnly`

ค่า `sort` ที่ไม่ถูกต้องจะส่งคืน `400`

หมายเหตุ:

- `recommended` ใช้สัญญาณการมีส่วนร่วมและความใหม่
- `trending` จัดอันดับตามการติดตั้งในช่วง 7 วันที่ผ่านมา (อิงตามข้อมูลมาตรวัดระยะไกล)
- `createdAt` มีความเสถียรสำหรับการรวบรวมข้อมูล Skill ใหม่ ส่วน `updated` จะเปลี่ยนเมื่อเผยแพร่ Skills ที่มีอยู่อีกครั้ง
- เมื่อ `nonSuspiciousOnly=true` การเรียงลำดับแบบใช้เคอร์เซอร์อาจส่งคืนน้อยกว่า `limit` รายการในหนึ่งหน้า เนื่องจาก Skills ที่น่าสงสัยจะถูกกรองหลังจากดึงหน้าแล้ว
- ใช้ `nextCursor` เพื่อแบ่งหน้าต่อเมื่อมีค่า หน้าที่สั้นไม่ได้หมายความว่าถึงจุดสิ้นสุดของผลลัพธ์เสมอไป

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

- slug เก่าที่สร้างจากขั้นตอนการเปลี่ยนชื่อ/รวมโดยเจ้าของจะชี้ไปยัง Skill มาตรฐาน
- `metadata.os`: ข้อจำกัดระบบปฏิบัติการที่ประกาศใน frontmatter ของ Skill (เช่น `["macos"]`, `["linux"]`) เป็น `null` หากไม่ได้ประกาศ
- `metadata.systems`: เป้าหมายระบบ Nix (เช่น `["aarch64-darwin", "x86_64-linux"]`) เป็น `null` หากไม่ได้ประกาศ
- `metadata` เป็น `null` หาก Skill ไม่มีเมทาดาทาแพลตฟอร์ม
- `moderation` จะรวมไว้เฉพาะเมื่อ Skill ถูกทำเครื่องหมายหรือเจ้าของกำลังดูอยู่

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

- เจ้าของและผู้ดูแลการกลั่นกรองสามารถเข้าถึงรายละเอียดการกลั่นกรองของ Skills ที่ซ่อนอยู่ได้
- ผู้เรียกสาธารณะจะได้รับเฉพาะ `200` สำหรับ Skills ที่มองเห็นได้และถูกทำเครื่องหมายไว้แล้ว
- หลักฐานจะถูกปกปิดสำหรับผู้เรียกสาธารณะ และจะรวมส่วนย่อยดิบเฉพาะสำหรับเจ้าของ/ผู้ดูแลการกลั่นกรองเท่านั้น

### `POST /api/v1/skills/{slug}/report`

รายงาน Skill เพื่อให้ผู้ดูแลการกลั่นกรองตรวจสอบ รายงานอยู่ในระดับ Skill และสามารถเชื่อมโยง
กับเวอร์ชันได้โดยไม่บังคับ โดยจะส่งเข้าสู่คิวรายงาน Skill

การยืนยันตัวตน:

- ต้องใช้โทเค็น API

คำขอ:

```json
{ "reason": "ขั้นตอนการติดตั้งที่น่าสงสัย", "version": "1.2.3" }
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

เอนด์พอยต์สำหรับผู้ดูแลการกลั่นกรอง/ผู้ดูแลระบบเพื่อรับรายงาน Skill

พารามิเตอร์คำค้น:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `confirmed`, `dismissed` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-200)
- `cursor` (ไม่บังคับ): เคอร์เซอร์แบ่งหน้า

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
      "reason": "ขั้นตอนการติดตั้งน่าสงสัย",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "ผู้รายงาน"
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

ปลายทางสำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อดำเนินการหรือเปิดรายงาน Skills อีกครั้ง

คำขอ:

```json
{ "status": "confirmed", "note": "ตรวจสอบและซ่อนเวอร์ชันที่ได้รับผลกระทบแล้ว", "finalAction": "hide" }
```

ต้องระบุ `note` สำหรับ `confirmed` และ `dismissed`; สามารถละเว้นได้เมื่อตั้งค่า
`status` กลับเป็น `open` ส่ง `finalAction: "hide"` พร้อมกับรายงานที่ผ่านการคัดกรองแล้ว
เพื่อซ่อน Skills ในเวิร์กโฟลว์เดียวกันที่ตรวจสอบย้อนหลังได้

### `GET /api/v1/skills/{slug}/versions`

พารามิเตอร์การค้นหา:

- `limit` (ไม่บังคับ): จำนวนเต็ม
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

### `GET /api/v1/skills/{slug}/versions/{version}`

ส่งคืนข้อมูลเมตาของเวอร์ชัน + รายการไฟล์

- `version.security` มีสถานะการตรวจสอบการสแกนที่ปรับให้อยู่ในรูปแบบมาตรฐานและรายละเอียดของเครื่องสแกน
  (VirusTotal + LLM) เมื่อมีข้อมูล

### `GET /api/v1/skills/{slug}/scan`

ส่งคืนรายละเอียดการตรวจสอบยืนยันจากการสแกนความปลอดภัยสำหรับเวอร์ชันของ Skills

พารามิเตอร์การค้นหา:

- `version` (ไม่บังคับ): สตริงเวอร์ชันที่ระบุ
- `tag` (ไม่บังคับ): แปลงแท็กเป็นเวอร์ชัน (ตัวอย่างเช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` ระบบจะใช้เวอร์ชันล่าสุด
- มีสถานะการตรวจสอบยืนยันที่ปรับให้อยู่ในรูปแบบมาตรฐาน พร้อมรายละเอียดเฉพาะของเครื่องสแกน
- `security.hasScanResult` จะเป็น `true` เฉพาะเมื่อเครื่องสแกนให้ผลการตัดสินที่ชัดเจน (`clean`, `suspicious` หรือ `malicious`)
- `moderation` คือภาพรวมการดูแลจัดการปัจจุบันในระดับ Skills ซึ่งได้มาจากเวอร์ชันล่าสุด
- เมื่อค้นหาเวอร์ชันในอดีต ให้ตรวจสอบ `moderation.matchesRequestedVersion` และ `moderation.sourceVersion` ก่อนถือว่า `moderation` และ `security` อยู่ในบริบทเวอร์ชันเดียวกัน

### `POST /api/v1/skills/-/scan`

ปลายทางส่งงาน ClawScan ใหม่ที่ต้องผ่านการยืนยันตัวตน

ไม่รองรับการสแกนไฟล์ที่อัปโหลดจากเครื่องอีกต่อไป คำขอที่ใช้
`multipart/form-data` หรือ `{ "source": { "kind": "upload" } }` จะส่งคืน `410`

การสแกนรายการที่เผยแพร่ใช้ JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

หมายเหตุ:

- เพย์โหลดคำขอสแกนและรายงานที่ดาวน์โหลดได้จะหมดอายุและถูกลบจากที่เก็บคำขอสแกนหลังพ้นช่วงเวลาการเก็บรักษา
- การสแกนรายการที่เผยแพร่ต้องมีสิทธิ์จัดการของเจ้าของ/ผู้เผยแพร่ หรืออำนาจผู้ดูแล/ผู้ดูแลระบบของแพลตฟอร์ม
- การสแกนรายการที่เผยแพร่จะเขียนข้อมูลกลับเฉพาะเมื่อ `update: true` และการสแกนเสร็จสมบูรณ์โดยสำเร็จ
- การตอบกลับคือ `202` พร้อม `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`
- งานสแกนทำงานแบบอะซิงโครนัส คำขอสแกนด้วยตนเองจะได้รับลำดับความสำคัญก่อนงานเผยแพร่/เติมข้อมูลย้อนหลังตามปกติ แต่การดำเนินการให้เสร็จสิ้นยังคงขึ้นอยู่กับความพร้อมของเวิร์กเกอร์

### `GET /api/v1/skills/-/scan/{scanId}`

ปลายทางตรวจสอบสถานะการสแกนที่ส่งแล้ว ซึ่งต้องผ่านการยืนยันตัวตน

- ส่งคืนสถานะอยู่ในคิว/กำลังทำงาน/สำเร็จ/ล้มเหลว
- ส่งคืน `queue.queuedAhead` และ `queue.position` ขณะอยู่ในคิว เพื่อให้ไคลเอนต์แสดงจำนวนการสแกนด้วยตนเองที่มีลำดับความสำคัญและอยู่ก่อนหน้าคำขอนี้ คิวที่มีขนาดใหญ่มากจะถูกจำกัดและรายงานด้วย `queuedAheadIsEstimate: true`
- เมื่อมีข้อมูล `report` จะประกอบด้วยส่วน `clawscan`, `skillspector`, `staticAnalysis` และ `virustotal`
- งานสแกนที่ล้มเหลวจะส่งคืน `status: "failed"` พร้อม `lastError`

### `GET /api/v1/skills/-/scan/{scanId}/download`

ปลายทางคลังรายงานที่ต้องผ่านการยืนยันตัวตน

- ต้องเป็นการสแกนที่สำเร็จแล้ว การสแกนที่ยังไม่สิ้นสุดจะส่งคืน `409`
- ส่งคืน ZIP ที่มี `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

ปลายทางคลังรายงานที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งแล้ว ซึ่งต้องผ่านการยืนยันตัวตน

- ต้องมีสิทธิ์จัดการ Skills หรือ Plugin ในฐานะเจ้าของ/ผู้เผยแพร่ หรือมีอำนาจผู้ดูแล/ผู้ดูแลระบบของแพลตฟอร์ม
- ส่งคืนผลการสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งอย่างตรงกันทุกประการ รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อน
- `kind` มีค่าเริ่มต้นเป็น `skill`; ใช้ `kind=plugin` สำหรับการสแกน Plugin/แพ็กเกจ
- ส่งคืน ZIP ที่มีรูปแบบเดียวกับการดาวน์โหลดคำขอสแกน

### `POST /api/v1/skills/-/scan/batch`

เส้นทางมาตรฐานสำหรับสแกนซ้ำแบบกลุ่มที่ใช้ได้เฉพาะผู้ดูแลระบบ โดยรับเพย์โหลดรูปแบบเดียวกับ `POST /api/v1/skills/-/rescan-batch` แบบเดิม

### `POST /api/v1/skills/-/scan/batch/status`

เส้นทางมาตรฐานสำหรับสถานะแบบกลุ่มที่ใช้ได้เฉพาะผู้ดูแลระบบ โดยรับ `{ "jobIds": ["..."] }` และส่งคืนตัวนับรวมแบบเดียวกับ `POST /api/v1/skills/-/rescan-batch/status` แบบเดิม

### `GET /api/v1/skills/{slug}/verify`

ส่งคืนเอนเวโลปการตรวจสอบ Skill Card ที่ `clawhub skill verify` ใช้

พารามิเตอร์การค้นหา:

- `version` (ไม่บังคับ): สตริงเวอร์ชันที่ระบุ
- `tag` (ไม่บังคับ): แปลงแท็กเป็นเวอร์ชัน (ตัวอย่างเช่น `latest`)

หมายเหตุ:

- `ok` จะเป็น `true` เฉพาะเมื่อเวอร์ชันที่เลือกมี Skill Card ที่สร้างแล้ว ไม่ถูกการดูแลจัดการบล็อกเนื่องจากมัลแวร์ และผ่านการตรวจสอบ ClawScan ว่าปลอดภัย
- ข้อมูลระบุตัวตนของ Skills ข้อมูลระบุตัวตนของผู้เผยแพร่ และข้อมูลเมตาของเวอร์ชันที่เลือกเป็นฟิลด์ระดับบนสุดของเอนเวโลป (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) เพื่อให้ระบบอัตโนมัติของเชลล์อ่านข้อมูลได้โดยไม่ต้องแกะตัวห่อที่ซ้อนกัน
- `security` คือผลการตัดสิน ClawScan/ความปลอดภัยระดับบนสุด ระบบอัตโนมัติควรใช้ `ok`, `decision`, `reasons` และ `security.status` เป็นหลัก
- `security.signals` มีหลักฐานสนับสนุนจากเครื่องสแกน เช่น `staticScan`, `virusTotal` และ `skillSpector`
- ยังคงเก็บ `security.signals.dependencyRegistry` ไว้เพื่อความเข้ากันได้กับการตอบกลับ v1 แต่เครื่องสแกนตรวจสอบการมีอยู่ในรีจิสทรีของการขึ้นต่อกันถูกเลิกใช้งานแล้ว และคีย์นี้จะเป็น `null` เสมอ
- `provenance` จะเป็น `server-resolved-github-import` เฉพาะเมื่อ ClawHub แปลงและจัดเก็บรีโพ GitHub/รีเฟอเรนซ์/คอมมิต/พาธระหว่างการเผยแพร่หรือนำเข้า มิฉะนั้นจะเป็น `unavailable`

### `POST /api/v1/skills/-/security-verdicts`

ส่งคืนผลการตัดสินด้านความปลอดภัยแบบกะทัดรัดในปัจจุบันสำหรับเวอร์ชันของ Skills ที่ตรงกันทุกประการ ปลายทาง
คอลเลกชันนี้มีไว้สำหรับไคลเอนต์ที่ทราบอยู่แล้วว่าต้องแสดง
Skills จาก ClawHub เวอร์ชันใดที่ติดตั้งไว้ เช่น OpenClaw Control UI

คำขอ:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

หมายเหตุ:

- `items` ต้องมีคู่ `{ slug, version }` ที่ไม่ซ้ำกันจำนวน 1-100 คู่
- ผลลัพธ์แยกตามแต่ละรายการ การไม่พบ Skills หรือเวอร์ชันหนึ่งรายการจะไม่ทำให้การตอบกลับทั้งหมดล้มเหลว
- การตอบกลับมีเฉพาะข้อมูลความปลอดภัย โดยไม่มีข้อมูล Skill Card สถานะการสร้างการ์ด รายการไฟล์อาร์ติแฟกต์ หรือเพย์โหลดโดยละเอียดจากเครื่องสแกน
- `security.signals` มีเฉพาะหลักฐานสนับสนุนระดับสถานะเท่านั้น ใช้ `/scan` หรือหน้าการตรวจสอบความปลอดภัยของ ClawHub สำหรับรายละเอียดทั้งหมดจากเครื่องสแกน
- ยังคงเก็บ `security.signals.dependencyRegistry` ไว้เพื่อความเข้ากันได้กับการตอบกลับ v1 แต่เครื่องสแกนตรวจสอบการมีอยู่ในรีจิสทรีของการขึ้นต่อกันถูกเลิกใช้งานแล้ว และคีย์นี้จะเป็น `null` เสมอ
- การไม่มี Skill Card ไม่ส่งผลต่อ `ok`, `decision` หรือ `reasons` ของปลายทางนี้ ไคลเอนต์ควรอ่าน `skill-card.md` ที่ติดตั้งไว้ภายในเครื่องเมื่อต้องการเนื้อหาของการ์ด
- ใช้ `/verify` เมื่อต้องการเอนเวโลปการตรวจสอบ Skill Card สำหรับ Skills รายการเดียว ใช้ `/card` เมื่อต้องการ Markdown ของการ์ดที่สร้างแล้ว และใช้ `/scan` เมื่อต้องการข้อมูลโดยละเอียดจากเครื่องสแกน

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

พารามิเตอร์การค้นหา:

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
- Plugin แบบบันเดิล

พารามิเตอร์การค้นหา:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `updated` (ค่าเริ่มต้น), `recommended`, `trending`, `downloads`, นามแฝงแบบเดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอจำกัดขอบเขตไว้ที่แพ็กเกจ Plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` หรือปลายทางแพ็กเกจที่มี
  `family=code-plugin`/`family=bundle-plugin`) หมวดหมู่ที่ควบคุมและ
  นามแฝงตัวกรอง v1 แบบเดิมมีเอกสารอธิบายอยู่ภายใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` หรือ `sort` จะส่งคืน `400` ระบบจะละเว้นพารามิเตอร์การค้นหาที่ไม่รู้จัก
- `GET /api/v1/code-plugins` และ `GET /api/v1/bundle-plugins` ยังคงเป็นนามแฝงสำหรับตระกูลที่กำหนดไว้ตายตัว
- รายการ Skills ยังคงใช้รีจิสทรีของ Skills เป็นแหล่งข้อมูล และยังสามารถเผยแพร่ผ่าน `POST /api/v1/skills` เท่านั้น
- `POST /api/v1/packages` ยังคงใช้สำหรับรีลีส Plugin โค้ดและ Plugin แบบบันเดิลเท่านั้น
- ผู้เรียกที่ไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการยืนยันตัวตนสามารถเห็นแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนสังกัดอยู่ในผลลัพธ์รายการ/การค้นหา
- `channel=private` ส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกซึ่งผ่านการยืนยันตัวตนมีสิทธิ์อ่าน

### `GET /api/v1/packages/search`

การค้นหาแค็ตตาล็อกแบบรวมสำหรับ Skills + แพ็กเกจ Plugin

พารามิเตอร์การค้นหา:

- `q` (จำเป็น): สตริงคำค้น
- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `family` (ไม่บังคับ): `skill`, `code-plugin` หรือ `bundle-plugin`
- `channel` (ไม่บังคับ): `official`, `community` หรือ `private`
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin รองรับเฉพาะเมื่อ
  คำขอจำกัดขอบเขตไว้ที่แพ็กเกจ Plugin หมวดหมู่ที่ควบคุมและนามแฝงตัวกรอง
  v1 แบบเดิมมีการบันทึกไว้ภายใต้ `GET /api/v1/plugins`

หมายเหตุ:

- ค่าที่ไม่ถูกต้องสำหรับ `family`, `channel`, `isOfficial`, `featured` หรือ
  `highlightedOnly` จะส่งคืน `400` พารามิเตอร์คำค้นที่ไม่รู้จักจะถูกละเว้น
- ผู้เรียกแบบไม่ระบุตัวตนจะเห็นเฉพาะช่องทางแพ็กเกจสาธารณะ
- ผู้เรียกที่ผ่านการตรวจสอบสิทธิ์สามารถค้นหาแพ็กเกจส่วนตัวของผู้เผยแพร่ที่ตนเป็นสมาชิกอยู่
- `channel=private` จะส่งคืนเฉพาะแพ็กเกจที่ผู้เรียกซึ่งผ่านการตรวจสอบสิทธิ์สามารถอ่านได้

### `GET /api/v1/plugins`

เรียกดูแค็ตตาล็อกเฉพาะ Plugin ในแพ็กเกจ code-plugin และ bundle-plugin

พารามิเตอร์คำค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า
- `isOfficial` (ไม่บังคับ): `true` หรือ `false`
- `sort` (ไม่บังคับ): `recommended` (ค่าเริ่มต้น), `trending`, `downloads`, `updated`, นามแฝงเดิม `installs`
- `category` (ไม่บังคับ): ตัวกรองหมวดหมู่ Plugin ค่าปัจจุบัน:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`

ปลายทางการอ่านยังคงยอมรับนามแฝงตัวกรอง v1 แบบเดิม:

- `mcp-tooling`, `data` และ `automation` จะถูกแปลงเป็น `tools`
- `observability` และ `deployment` จะถูกแปลงเป็น `gateway`
- `dev-tools` จะถูกแปลงเป็น `runtime`

`trending` เป็นกระดานจัดอันดับการติดตั้ง/ดาวน์โหลดในช่วงเจ็ดวัน และไม่ใช้ยอดรวมตลอดเวลา
ในปลายทางแบบรวม `/api/v1/packages` รายการนี้ใช้ได้เฉพาะ Plugin โปรดใช้
`/api/v1/skills?sort=trending` สำหรับแค็ตตาล็อก Skill

ไม่ยอมรับนามแฝงเดิมเป็นค่าหมวดหมู่ที่จัดเก็บหรือประกาศโดยผู้เขียน

### `GET /api/v1/skills/export`

ส่งออก Skills สาธารณะล่าสุดจำนวนมากเพื่อการวิเคราะห์แบบออฟไลน์

การตรวจสอบสิทธิ์:

- จำเป็นต้องใช้โทเค็น API

พารามิเตอร์คำค้น:

- `startDate` (จำเป็น): ขอบเขตล่างในหน่วยมิลลิวินาที Unix สำหรับ `updatedAt` ของ Skill
- `endDate` (จำเป็น): ขอบเขตบนในหน่วยมิลลิวินาที Unix สำหรับ `updatedAt` ของ Skill
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าจากการตอบกลับก่อนหน้า

การตอบกลับ:

- เนื้อหา: ไฟล์เก็บถาวร ZIP
- Skill ที่ส่งออกแต่ละรายการมีรากอยู่ที่ `{publisher}/{slug}/`
- Skills ที่โฮสต์จะรวมไฟล์เวอร์ชันล่าสุดที่จัดเก็บไว้ และแสดงรายการใน
  `_manifest.json` พร้อม `sourceRef: "public-clawhub"`
- Skills ที่รองรับโดย GitHub ในปัจจุบันซึ่งมีการสแกน `clean` หรือ `suspicious` จะรวม
  `_source_handoff.json` พร้อม `sourceRef: "public-github"`, รีโพ, คอมมิต, พาธ,
  แฮชเนื้อหา และ URL ไฟล์เก็บถาวร โดยจะไม่รวมไฟล์ต้นฉบับที่โฮสต์บน ClawHub
- Skill แต่ละรายการจะรวม `_export_skill_meta.json`
- `_manifest.json` จะรวมอยู่ที่ราก ZIP เสมอ
- `_errors.json` จะรวมอยู่เมื่อไม่สามารถส่งออก Skills หรือไฟล์
  บางรายการได้

ส่วนหัว:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

ส่งออกรุ่นเผยแพร่ Plugin สาธารณะล่าสุดจำนวนมากเพื่อการวิเคราะห์แบบออฟไลน์

การตรวจสอบสิทธิ์:

- จำเป็นต้องใช้โทเค็น API

พารามิเตอร์คำค้น:

- `startDate` (จำเป็น): ขอบเขตล่างในหน่วยมิลลิวินาที Unix สำหรับ `updatedAt` ของ Plugin
- `endDate` (จำเป็น): ขอบเขตบนในหน่วยมิลลิวินาที Unix สำหรับ `updatedAt` ของ Plugin
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-250), ค่าเริ่มต้น `250`
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้าจากการตอบกลับก่อนหน้า
- `family` (ไม่บังคับ): `code-plugin` หรือ `bundle-plugin` หากไม่ระบุจะหมายถึง
  Plugin ทั้งสองตระกูล

การตอบกลับ:

- เนื้อหา: ไฟล์เก็บถาวร ZIP
- Plugin ที่ส่งออกแต่ละรายการมีรากอยู่ที่ `{family}/{packageName}/`
- Plugin ที่ส่งออกแต่ละรายการจะรวมไฟล์ที่จัดเก็บไว้ของรุ่นเผยแพร่ล่าสุด
- ข้อมูลเมตาการส่งออกของแต่ละ Plugin จะจัดเก็บไว้ที่
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`
- `_manifest.json` จะรวมอยู่ที่ราก ZIP เสมอ
- `_errors.json` จะรวมอยู่เมื่อไม่สามารถส่งออก Plugins หรือไฟล์
  บางรายการได้

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

- นามแฝงตัวกรอง v1 แบบเดิมที่บันทึกไว้ภายใต้ `GET /api/v1/plugins` จะได้รับ
  การยอมรับเช่นกัน
- การกรองหมวดหมู่เป็นตัวกรอง API จริงที่รองรับด้วยแถวไดเจสต์หมวดหมู่ Plugin
  ไม่ใช่การเขียนคำค้นหาใหม่
- ผลลัพธ์จะถูกส่งคืนตามลำดับความเกี่ยวข้อง และในขณะนี้ไม่มีการแบ่งหน้า
- ตัวควบคุมการจัดเรียงใน UI เบราว์เซอร์สำหรับการค้นหา Plugin จะจัดลำดับผลลัพธ์ตามความเกี่ยวข้องที่โหลดแล้วใหม่
  ให้สอดคล้องกับพฤติกรรมการเรียกดู `/skills` ในปัจจุบัน

### `GET /api/v1/packages/{name}`

ส่งคืนข้อมูลเมตารายละเอียดแพ็กเกจ

หมายเหตุ:

- Skills สามารถถูกแปลงผ่านเส้นทางนี้ในแค็ตตาล็อกแบบรวมได้เช่นกัน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกสามารถอ่านข้อมูลของผู้เผยแพร่เจ้าของแพ็กเกจได้

### `DELETE /api/v1/packages/{name}`

ลบแพ็กเกจและรุ่นเผยแพร่ทั้งหมดแบบซอฟต์

หมายเหตุ:

- จำเป็นต้องใช้โทเค็น API ของเจ้าของแพ็กเกจ เจ้าของ/ผู้ดูแลระบบขององค์กรผู้เผยแพร่
  ผู้ควบคุมแพลตฟอร์ม หรือผู้ดูแลระบบแพลตฟอร์ม

### `GET /api/v1/packages/{name}/versions`

ส่งคืนประวัติเวอร์ชัน

พารามิเตอร์คำค้น:

- `limit` (ไม่บังคับ): จำนวนเต็ม (1–100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

หมายเหตุ:

- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกสามารถอ่านข้อมูลของผู้เผยแพร่เจ้าของแพ็กเกจได้

### `GET /api/v1/packages/{name}/versions/{version}`

ส่งคืนแพ็กเกจหนึ่งเวอร์ชัน รวมถึงข้อมูลเมตาของไฟล์ ความเข้ากันได้
การตรวจสอบยืนยัน ข้อมูลเมตาของอาร์ติแฟกต์ และข้อมูลการสแกน

หมายเหตุ:

- `version.artifact.kind` คือ `legacy-zip` สำหรับไฟล์เก็บถาวรแพ็กเกจแบบเดิม หรือ
  `npm-pack` สำหรับรุ่นเผยแพร่ที่รองรับโดย ClawPack
- รุ่นเผยแพร่ ClawPack จะรวมฟิลด์ที่เข้ากันได้กับ npm ได้แก่ `npmIntegrity`, `npmShasum` และ
  `npmTarballName`
- `version.sha256hash` เป็นข้อมูลเมตาความเข้ากันได้ที่เลิกใช้แล้วสำหรับไคลเอนต์เก่า โดย
  จะแฮชไบต์ ZIP ที่ตรงกันทุกประการซึ่งส่งคืนโดย `/api/v1/packages/{name}/download`
  ไคลเอนต์สมัยใหม่ควรใช้ `version.artifact.sha256` ซึ่งระบุ
  อาร์ติแฟกต์รุ่นเผยแพร่มาตรฐาน
- `version.vtAnalysis`, `version.llmAnalysis` และ `version.staticScan` จะ
  รวมอยู่เมื่อมีข้อมูลการสแกน
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกสามารถอ่านข้อมูลของผู้เผยแพร่เจ้าของแพ็กเกจได้

### `GET /api/v1/packages/{name}/versions/{version}/security`

ส่งคืนข้อมูลสรุปด้านความปลอดภัยและความน่าเชื่อถือของอาร์ติแฟกต์ที่ตรงกับรุ่นแพ็กเกจทุกประการสำหรับไคลเอนต์
ติดตั้ง นี่คือพื้นผิวการใช้งาน OpenClaw แบบสาธารณะสำหรับตัดสินว่า
สามารถติดตั้งรุ่นเผยแพร่ที่แปลงแล้วได้หรือไม่

การตรวจสอบสิทธิ์:

- ปลายทางการอ่านสาธารณะ ไม่จำเป็นต้องใช้โทเค็นของเจ้าของ ผู้เผยแพร่ ผู้ควบคุม หรือผู้ดูแลระบบ

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
  แพ็กเกจรีจิสทรีที่แปลงแล้ว
- `release.releaseId`, `release.version` และ `release.createdAt` ระบุ
  รุ่นเผยแพร่ที่ได้รับการประเมินอย่างเจาะจง
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` และ `release.npmTarballName` จะปรากฏเมื่อทราบค่าสำหรับ
  อาร์ติแฟกต์รุ่นเผยแพร่
- `trust.scanStatus` คือสถานะความน่าเชื่อถือที่มีผล ซึ่งได้มาจากอินพุตของเครื่องสแกน
  และการควบคุมรุ่นเผยแพร่ด้วยตนเอง
- `trust.moderationState` เป็นค่าว่างได้ โดยจะเป็น `null` เมื่อไม่มีการควบคุมรุ่นเผยแพร่
  ด้วยตนเอง
- `trust.blockedFromDownload` คือสัญญาณบล็อกการติดตั้ง OpenClaw และไคลเอนต์
  ติดตั้งอื่นควรบล็อกการติดตั้งเมื่อค่านี้เป็น `true` แทนที่จะ
  คำนวณกฎการบล็อกใหม่จากฟิลด์เครื่องสแกนหรือการควบคุม
- `trust.reasons` คือรายการคำอธิบายสำหรับผู้ใช้และการตรวจสอบ รหัสเหตุผล
  เป็นสตริงที่เสถียรและกระชับ เช่น `manual:quarantined`, `scan:malicious`
  และ `package:malicious`
- `trust.pending` หมายความว่าอินพุตความน่าเชื่อถืออย่างน้อยหนึ่งรายการยังรอการดำเนินการให้เสร็จสิ้น
- `trust.stale` หมายความว่าข้อมูลสรุปความน่าเชื่อถือคำนวณจากอินพุตที่ล้าสมัย และ
  ควรถือว่าต้องรีเฟรชก่อนตัดสินใจอนุญาตด้วยความมั่นใจสูง

หมายเหตุ:

- ปลายทางนี้ตรงกับเวอร์ชันอย่างเจาะจง ไคลเอนต์ควรเรียกใช้หลังจากแปลง
  เวอร์ชันแพ็กเกจที่ต้องการติดตั้งแล้ว ไม่ใช่เพียงหลังจากอ่านข้อมูลเมตา
  แพ็กเกจล่าสุด
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกสามารถอ่านข้อมูลของผู้เผยแพร่เจ้าของแพ็กเกจได้
- ปลายทางนี้จงใจมีขอบเขตแคบกว่าปลายทางการควบคุมของเจ้าของ/ผู้ควบคุม
  โดยเปิดเผยการตัดสินใจติดตั้งและคำอธิบายสาธารณะ แต่ไม่เปิดเผย
  ตัวตนผู้รายงาน เนื้อหารายงาน หลักฐานส่วนตัว หรือไทม์ไลน์การตรวจสอบ
  ภายใน

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

ส่งคืนข้อมูลเมตาตัวแปลงอาร์ติแฟกต์ที่ระบุอย่างชัดเจนสำหรับเวอร์ชันแพ็กเกจ

หมายเหตุ:

- เวอร์ชันแพ็กเกจแบบเดิมจะส่งคืนอาร์ติแฟกต์ `legacy-zip` และ ZIP แบบเดิม
  `downloadUrl`
- เวอร์ชัน ClawPack จะส่งคืนอาร์ติแฟกต์ `npm-pack`, ฟิลด์ความสมบูรณ์ของ npm,
  `tarballUrl` และ URL ความเข้ากันได้กับ ZIP แบบเดิม
- นี่คือพื้นผิวตัวแปลงของ OpenClaw ซึ่งหลีกเลี่ยงการคาดเดารูปแบบไฟล์เก็บถาวรจาก
  URL ที่ใช้ร่วมกัน

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

ดาวน์โหลดอาร์ติแฟกต์เวอร์ชันผ่านพาธตัวแปลงที่ระบุอย่างชัดเจน

หมายเหตุ:

- เวอร์ชัน ClawPack สตรีมไบต์ `.tgz` ของ npm-pack ที่อัปโหลดไว้อย่างตรงกันทุกประการ
- เวอร์ชัน ZIP แบบเดิมเปลี่ยนเส้นทางไปยัง `/api/v1/packages/{name}/download?version=`
- ใช้บักเก็ตอัตราการดาวน์โหลด

### `GET /api/v1/packages/{name}/readiness`

ส่งคืนความพร้อมที่คำนวณแล้วสำหรับการใช้งานโดย OpenClaw ในอนาคต

การตรวจสอบความพร้อมครอบคลุมรายการต่อไปนี้:

- สถานะช่องทางอย่างเป็นทางการ
- ความพร้อมใช้งานของเวอร์ชันล่าสุด
- ความพร้อมใช้งานของอาร์ติแฟกต์ npm-pack ของ ClawPack
- ไดเจสต์ของอาร์ติแฟกต์
- ที่มาของรีโพซิทอรีต้นทางและคอมมิต
- เมทาดาทาความเข้ากันได้กับ OpenClaw
- เป้าหมายโฮสต์
- สถานะการสแกน

การตอบกลับ:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Plugin ตัวอย่าง",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "อาร์ติแฟกต์ ClawPack",
      "status": "fail",
      "message": "เวอร์ชันล่าสุดมีเฉพาะ ZIP แบบเดิม"
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

เอนด์พอยต์สำหรับผู้ดูแลเพื่อแสดงรายการแถวการย้าย Plugin อย่างเป็นทางการของ OpenClaw

การยืนยันตัวตน:

- ต้องใช้โทเค็น API ของผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

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
      "blockers": ["ไม่มี ClawPack"],
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

เอนด์พอยต์สำหรับผู้ดูแลระบบเพื่อสร้างหรืออัปเดตแถวการย้าย Plugin อย่างเป็นทางการ

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
  "blockers": ["ไม่มี ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "กำลังรอการอัปโหลดจากผู้เผยแพร่"
}
```

หมายเหตุ:

- `bundledPluginId` จะถูกปรับให้อยู่ในรูปตัวพิมพ์เล็กและเป็นคีย์ upsert ที่คงที่
- `packageName` จะถูกปรับชื่อให้เป็นมาตรฐานของ npm โดยแพ็กเกจอาจยังไม่มีอยู่สำหรับ
  การย้ายที่วางแผนไว้
- รายการนี้ติดตามเฉพาะความพร้อมในการย้าย โดยไม่แก้ไข OpenClaw หรือสร้าง
  ClawPack

### `GET /api/v1/packages/moderation/queue`

เอนด์พอยต์สำหรับผู้ดูแล/ผู้ดูแลระบบสำหรับคิวการตรวจสอบรีลีสแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API ของผู้ใช้ที่เป็นผู้ดูแลหรือผู้ดูแลระบบ

พารามิเตอร์คิวรี:

- `status` (ไม่บังคับ): `open` (ค่าเริ่มต้น), `blocked`, `manual` หรือ `all`
- `limit` (ไม่บังคับ): จำนวนเต็ม (1-100)
- `cursor` (ไม่บังคับ): เคอร์เซอร์การแบ่งหน้า

ความหมายของสถานะ:

- `open`: รีลีสที่น่าสงสัย เป็นอันตราย รอดำเนินการ ถูกกักกัน ถูกเพิกถอน หรือถูกรายงาน
- `blocked`: รีลีสที่ถูกกักกัน ถูกเพิกถอน หรือเป็นอันตราย
- `manual`: รีลีสใดๆ ที่มีการแทนที่การกลั่นกรองด้วยตนเอง
- `all`: รีลีสใดๆ ที่มีการแทนที่ด้วยตนเอง สถานะการสแกนที่ไม่สะอาด หรือรายงานแพ็กเกจ

การตอบกลับ:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Plugin ตัวอย่าง",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "การตรวจสอบด้วยตนเอง",
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

รายงานแพ็กเกจเพื่อให้ผู้ดูแลตรวจสอบ รายงานอยู่ในระดับแพ็กเกจและอาจ
เชื่อมโยงกับเวอร์ชันก็ได้ รายงานเหล่านี้จะเข้าสู่คิวการกลั่นกรอง แต่จะไม่ซ่อนหรือ
บล็อกการดาวน์โหลดโดยอัตโนมัติ ผู้ดูแลควรใช้การกลั่นกรองรีลีสเพื่อ
อนุมัติ กักกัน หรือเพิกถอนอาร์ติแฟกต์

การยืนยันตัวตน:

- ต้องใช้โทเค็น API

คำขอ:

```json
{ "reason": "ไบนารีเนทีฟที่น่าสงสัย", "version": "1.2.3" }
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
      "displayName": "Plugin ตัวอย่าง",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "ไบนารีเนทีฟที่น่าสงสัย",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "ผู้รายงาน"
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

เอนด์พอยต์สำหรับเจ้าของ/ผู้ดูแลเพื่อดูสถานะการกลั่นกรองแพ็กเกจ

การยืนยันตัวตน:

- ต้องใช้โทเค็น API ของเจ้าของแพ็กเกจ สมาชิกผู้เผยแพร่ ผู้ดูแล หรือ
  ผู้ดูแลระบบ

การตอบกลับ:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Plugin ตัวอย่าง",
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
    "moderationReason": "การตรวจสอบด้วยตนเอง",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

เอนด์พอยต์สำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อแก้ไขหรือเปิดรายงานแพ็กเกจอีกครั้ง

คำขอ:

```json
{
  "status": "confirmed",
  "note": "ตรวจสอบและกักกันรีลีสที่ได้รับผลกระทบแล้ว",
  "finalAction": "quarantine"
}
```

ต้องระบุ `note` สำหรับ `confirmed` และ `dismissed` โดยอาจละเว้นได้เมื่อ
ตั้งค่า `status` กลับเป็น `open` ส่ง `finalAction: "quarantine"` หรือ
`finalAction: "revoke"` พร้อมกับรายงานที่ยืนยันแล้ว เพื่อใช้การกลั่นกรองรีลีสใน
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

เอนด์พอยต์สำหรับผู้ดูแล/ผู้ดูแลระบบเพื่อตรวจสอบรีลีสแพ็กเกจ

คำขอ:

```json
{ "state": "quarantined", "reason": "เพย์โหลดเนทีฟที่น่าสงสัย" }
```

สถานะที่รองรับ:

- `approved`: ตรวจสอบด้วยตนเองและอนุญาตแล้ว
- `quarantined`: ถูกบล็อกระหว่างรอการติดตามผล
- `revoked`: ถูกบล็อกหลังจากรีลีสเคยได้รับความเชื่อถือมาก่อน

รีลีสที่ถูกกักกันและถูกเพิกถอนจะส่งคืน `403` จากเส้นทางดาวน์โหลดอาร์ติแฟกต์
ทุกการเปลี่ยนแปลงจะเขียนรายการลงในบันทึกการตรวจสอบ

### `GET /api/v1/packages/{name}/file`

ส่งคืนเนื้อหาข้อความดิบของไฟล์ในแพ็กเกจ

พารามิเตอร์คิวรี:

- `path` (จำเป็น)
- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ใช้รีลีสล่าสุดเป็นค่าเริ่มต้น
- ใช้บักเก็ตอัตราการอ่าน ไม่ใช่บักเก็ตการดาวน์โหลด
- ไฟล์ไบนารีจะส่งคืน `415`
- ขีดจำกัดขนาดไฟล์: 200KB
- การสแกน VirusTotal ที่รอดำเนินการจะไม่บล็อกการอ่าน แต่รีลีสที่เป็นอันตรายอาจยังถูกระงับไว้ในส่วนอื่น
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะมีสิทธิ์อ่านผู้เผยแพร่ที่เป็นเจ้าของ

### `GET /api/v1/packages/{name}/download`

ดาวน์โหลดไฟล์ ZIP แบบกำหนดผลลัพธ์แน่นอนรุ่นเดิมสำหรับรีลีสแพ็กเกจ

พารามิเตอร์คิวรี:

- `version` (ไม่บังคับ)
- `tag` (ไม่บังคับ)

หมายเหตุ:

- ใช้รีลีสล่าสุดเป็นค่าเริ่มต้น
- Skills เปลี่ยนเส้นทางไปยัง `GET /api/v1/download`
- ไฟล์เก็บถาวรของ Plugin/แพ็กเกจเป็นไฟล์ zip ที่มีรูท `package/` เพื่อให้ไคลเอนต์ OpenClaw
  รุ่นเก่ายังคงทำงานได้
- เส้นทางนี้รองรับเฉพาะ ZIP โดยไม่สตรีมไฟล์ ClawPack `.tgz`
- การตอบกลับมีส่วนหัว `ETag`, `Digest`, `X-ClawHub-Artifact-Type` และ
  `X-ClawHub-Artifact-Sha256` สำหรับการตรวจสอบความสมบูรณ์โดยรีโซลเวอร์
- เมทาดาทาที่มีเฉพาะในรีจิสทรีจะไม่ถูกแทรกลงในไฟล์เก็บถาวรที่ดาวน์โหลด
- การสแกน VirusTotal ที่รอดำเนินการจะไม่บล็อกการดาวน์โหลด แต่รีลีสที่เป็นอันตรายจะส่งคืน `403`
- แพ็กเกจส่วนตัวจะส่งคืน `404` เว้นแต่ผู้เรียกจะเป็นเจ้าของ

### `GET /api/npm/{package}`

ส่งคืน packument ที่เข้ากันได้กับ npm สำหรับเวอร์ชันแพ็กเกจที่ใช้ ClawPack

หมายเหตุ:

- แสดงรายการเฉพาะเวอร์ชันที่มีการอัปโหลด tarball npm-pack ของ ClawPack แล้ว
- จงใจละเว้นเวอร์ชันแบบเดิมที่มีเฉพาะ ZIP
- `dist.tarball`, `dist.integrity` และ `dist.shasum` ใช้ฟิลด์ที่เข้ากันได้กับ npm
  เพื่อให้ผู้ใช้ชี้ npm ไปยังมิเรอร์ได้หากต้องการ
- packument ของแพ็กเกจที่มีขอบเขตรองรับทั้ง `/api/npm/@scope/name` และเส้นทางคำขอแบบเข้ารหัส
  `/api/npm/@scope%2Fname` ของ npm

### `GET /api/npm/{package}/-/{tarball}.tgz`

สตรีมไบต์ tarball ของ ClawPack ที่อัปโหลดไว้อย่างตรงกันทุกประการสำหรับไคลเอนต์มิเรอร์ npm

หมายเหตุ:

- ใช้บักเก็ตอัตราการดาวน์โหลด
- ส่วนหัวการดาวน์โหลดมี SHA-256 ของ ClawHub พร้อมเมทาดาทา integrity/shasum ของ npm
- การตรวจสอบสิทธิ์เข้าถึงแพ็กเกจส่วนตัวและการกลั่นกรองยังคงมีผล

### `GET /api/v1/resolve`

CLI ใช้เพื่อจับคู่ลายนิ้วมือในเครื่องกับเวอร์ชันที่รู้จัก

พารามิเตอร์คิวรี:

- `slug` (จำเป็น)
- `hash` (จำเป็น): ค่า sha256 เลขฐานสิบหก 64 อักขระของลายนิ้วมือบันเดิล

การตอบกลับ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

ดาวน์โหลด ZIP ของเวอร์ชัน Skills ที่โฮสต์ไว้ หรือส่งคืนข้อมูลส่งต่อไปยังซอร์ส GitHub สำหรับ
Skills ปัจจุบันที่อ้างอิง GitHub ซึ่งมีการสแกน `clean` หรือ `suspicious` และไม่มีเวอร์ชัน
ที่โฮสต์ไว้

พารามิเตอร์คิวรี:

- `slug` (จำเป็น)
- `version` (ไม่บังคับ): สตริง semver
- `tag` (ไม่บังคับ): ชื่อแท็ก (เช่น `latest`)

หมายเหตุ:

- หากไม่ได้ระบุทั้ง `version` และ `tag` ระบบจะใช้เวอร์ชันล่าสุด
- เวอร์ชันที่ลบแบบชั่วคราวจะส่งคืน `410`
- การส่งต่อ Skills ที่มี GitHub เป็นแบ็กเอนด์จะไม่พร็อกซีหรือทำสำเนาไบต์ การตอบกลับ JSON
  ประกอบด้วย `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  และ `archiveUrl`; สถานะการสแกน/สถานะปัจจุบันเป็นเงื่อนไขควบคุม และไม่รวมอยู่ในข้อมูลเมตาของเพย์โหลด
  เมื่อดำเนินการสำเร็จ
- สถิติการดาวน์โหลดจะนับตามข้อมูลประจำตัวที่ไม่ซ้ำกันต่อวัน UTC (`userId` เมื่อโทเค็น API ถูกต้อง มิฉะนั้นจะใช้ IP)

## ปลายทางการตรวจสอบสิทธิ์ (โทเค็น Bearer)

ทุกปลายทางต้องใช้:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

ตรวจสอบความถูกต้องของโทเค็นและส่งคืนแฮนเดิลของผู้ใช้

### `POST /api/v1/skills`

เผยแพร่เวอร์ชันใหม่

- วิธีที่แนะนำ: `multipart/form-data` พร้อม JSON `payload` + บล็อบ `files[]`
- รองรับเนื้อหา JSON ที่มี `files` (อ้างอิงด้วย storageId) เช่นกัน
- ฟิลด์เพย์โหลดที่ไม่บังคับ: `ownerHandle` เมื่อระบุ API จะค้นหาผู้เผยแพร่ดังกล่าว
  ที่ฝั่งเซิร์ฟเวอร์ และกำหนดให้ผู้ดำเนินการมีสิทธิ์เข้าถึงผู้เผยแพร่
- ฟิลด์เพย์โหลดที่ไม่บังคับ: `migrateOwner` เมื่อ `true` ร่วมกับ `ownerHandle`
  Skills ที่มีอยู่สามารถย้ายไปยังเจ้าของรายนั้นได้ หากผู้ดำเนินการเป็นผู้ดูแลระบบ/เจ้าของของทั้ง
  ผู้เผยแพร่ปัจจุบันและผู้เผยแพร่เป้าหมาย หากไม่เลือกใช้ตัวเลือกนี้ ระบบจะ
  ปฏิเสธการเปลี่ยนเจ้าของ

### `POST /api/v1/packages`

เผยแพร่รีลีสของ Plugin ชนิดโค้ดหรือ Plugin ชนิดบันเดิล

- ต้องตรวจสอบสิทธิ์ด้วยโทเค็น Bearer
- ต้องมี `multipart/form-data`
- ฟิลด์ฟอร์มที่อนุญาต ได้แก่ `payload`, บล็อบ `files` ที่ระบุซ้ำ หรือการอ้างอิงทาร์บอล `clawpack`
  หนึ่งรายการ โดย `clawpack` อาจเป็นบล็อบ `.tgz` หรือรหัสพื้นที่จัดเก็บที่ส่งคืนจาก
  ขั้นตอน URL อัปโหลด การเผยแพร่ด้วยรหัสพื้นที่จัดเก็บที่เตรียมไว้ต้องระบุ
  `clawpackUploadTicket` ที่ส่งคืนมาพร้อม URL อัปโหลดนั้นด้วย
- ใช้ `files` หรือ `clawpack` อย่างใดอย่างหนึ่งเท่านั้น ห้ามใช้ทั้งสองอย่างในคำขอเดียวกัน
- ระบบจะปฏิเสธเนื้อหา JSON และข้อมูลเมตา `payload.files` / `payload.artifact`
  ที่ผู้เรียกเป็นผู้ระบุ
- คำขอเผยแพร่แบบ multipart โดยตรงจำกัดไว้ที่ 18MB ทาร์บอล ClawPack สามารถ
  ใช้ขั้นตอน URL อัปโหลดได้จนถึงขีดจำกัดทาร์บอล 120MB
- ฟิลด์เพย์โหลดที่ไม่บังคับ: `ownerHandle` เมื่อระบุ เฉพาะผู้ดูแลระบบเท่านั้นที่เผยแพร่ในนามของเจ้าของรายนั้นได้

ประเด็นสำคัญในการตรวจสอบความถูกต้อง:

- `family` ต้องเป็น `code-plugin` หรือ `bundle-plugin`
- แพ็กเกจ Plugin ต้องมี `openclaw.plugin.json` การอัปโหลด ClawPack `.tgz` ต้อง
  มีรายการนี้อยู่ที่ `package/openclaw.plugin.json`
- Plugin ชนิดโค้ดต้องมี `package.json`, ข้อมูลเมตาของที่เก็บซอร์ส, ข้อมูลเมตาของคอมมิตซอร์ส,
  ข้อมูลเมตาของสคีมาการกำหนดค่า, `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion`
- `openclaw.hostTargets` และ `openclaw.environment` เป็นข้อมูลเมตาที่ไม่บังคับ
- เฉพาะผู้เผยแพร่องค์กร `openclaw` และผู้เผยแพร่ส่วนตัวของสมาชิกองค์กร `openclaw`
  ในปัจจุบันเท่านั้นที่สามารถเผยแพร่ไปยังช่อง `official` ได้
- การเผยแพร่ในนามผู้อื่นยังคงตรวจสอบสิทธิ์การใช้งานช่องทางอย่างเป็นทางการกับบัญชีเจ้าของเป้าหมาย

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

ลบแบบชั่วคราว / กู้คืน Skills (เจ้าของ ผู้ควบคุม หรือผู้ดูแลระบบ)

เนื้อหา JSON ที่ไม่บังคับ:

```json
{ "reason": "ระงับไว้เพื่อการควบคุมระหว่างรอการตรวจสอบทางกฎหมาย" }
```

เมื่อระบุ `reason` ระบบจะจัดเก็บเป็นบันทึกการควบคุมของ Skills และคัดลอกไปยังบันทึกการตรวจสอบ
การลบแบบชั่วคราวที่เจ้าของเป็นผู้ดำเนินการจะสงวน slug ไว้ 30 วัน หลังจากนั้น
ผู้เผยแพร่รายอื่นสามารถอ้างสิทธิ์ slug ได้ การตอบกลับการลบจะมี `slugReservedUntil` เมื่อใช้ระยะหมดอายุนี้
การซ่อนโดยผู้ควบคุม/ผู้ดูแลระบบและการนำออกเพื่อความปลอดภัยจะไม่หมดอายุในลักษณะนี้

การตอบกลับการลบ:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

รหัสสถานะ:

- `200`: สำเร็จ
- `401`: ไม่ผ่านการตรวจสอบสิทธิ์
- `403`: ไม่มีสิทธิ์
- `404`: ไม่พบ Skills/ผู้ใช้
- `500`: ข้อผิดพลาดภายในเซิร์ฟเวอร์

### `POST /api/v1/users/publisher`

สำหรับผู้ดูแลระบบเท่านั้น ตรวจสอบให้แน่ใจว่ามีผู้เผยแพร่องค์กรสำหรับแฮนเดิล หากแฮนเดิลยังคงชี้ไปยัง
ผู้ใช้ที่ใช้ร่วมกัน/ผู้เผยแพร่ส่วนตัวแบบเดิม ปลายทางจะย้ายข้อมูลให้เป็นผู้เผยแพร่องค์กรก่อน
สำหรับองค์กรที่สร้างใหม่ ให้ระบุ `memberHandle`; ผู้ดูแลระบบที่ดำเนินการจะไม่ถูกเพิ่มเป็นสมาชิก
ค่าเริ่มต้นของ `memberRole` คือ `owner`

- เนื้อหา: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- การตอบกลับ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

การสร้างผู้เผยแพร่องค์กรด้วยตนเองสำหรับผู้ที่ผ่านการตรวจสอบสิทธิ์ สร้างผู้เผยแพร่องค์กรใหม่และเพิ่ม
ผู้เรียกเป็นเจ้าของ ปลายทางนี้จะไม่ย้ายแฮนเดิลผู้ใช้/ส่วนตัวที่มีอยู่ และจะ
ไม่กำหนดให้ผู้เผยแพร่เป็นที่เชื่อถือ/เป็นทางการ

- เนื้อหา: `{ "handle": "opik", "displayName": "Opik" }`
- การตอบกลับ: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- ส่งคืน `409` เมื่อแฮนเดิลถูกใช้โดยผู้เผยแพร่ ผู้ใช้ หรือผู้เผยแพร่ส่วนตัวอยู่แล้ว

### `POST /api/v1/users/reserve`

สำหรับผู้ดูแลระบบเท่านั้น สงวน slug ระดับรากและชื่อแพ็กเกจไว้ให้เจ้าของโดยชอบธรรมโดยไม่เผยแพร่
รีลีส ชื่อแพ็กเกจจะกลายเป็นแพ็กเกจตัวยึดตำแหน่งแบบส่วนตัวที่ไม่มีแถวรีลีส เพื่อให้เจ้าของรายเดิม
สามารถเผยแพร่รีลีสจริงของ Plugin ชนิดโค้ดหรือ Plugin ชนิดบันเดิลไปยังชื่อนั้นในภายหลังได้

- เนื้อหา: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- การตอบกลับ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

สำหรับผู้ดูแลระบบเท่านั้น กู้คืนผู้เผยแพร่ส่วนตัวให้กับตัวตนหลัก GitHub OAuth ทดแทนที่ผ่านการตรวจสอบ
โดยไม่แก้ไขแถวบัญชี Convex Auth คำขอต้องระบุทั้งรหัสบัญชีผู้ให้บริการ GitHub ที่เปลี่ยนแปลงไม่ได้
ทั้งสองรายการ ส่วนแฮนเดิลที่เปลี่ยนแปลงได้จะใช้เป็นเพียงเงื่อนไขป้องกันสำหรับผู้ปฏิบัติงาน

ปลายทางมีค่าเริ่มต้นเป็นการทดลองดำเนินการ การนำการกู้คืนไปใช้ต้องมี `dryRun: false` และ
`confirmIdentityVerified: true` หลังจากเจ้าหน้าที่ตรวจสอบความต่อเนื่องระหว่างตัวตนหลัก
GitHub ทั้งสองอย่างเป็นอิสระจากกัน การกู้คืนจะปฏิเสธโดยค่าเริ่มต้นเมื่อผู้เผยแพร่ส่วนตัวปัจจุบัน
ของผู้ใช้ปลายทางมี Skills แพ็กเกจ หรือซอร์ส Skills จาก GitHub
การกู้คืนยังย้ายฟิลด์ `ownerUserId` แบบเดิมสำหรับ Skills ของผู้เผยแพร่ที่กู้คืน
นามแฝง slug ของ Skills แพ็กเกจ คำเตือนของตัวตรวจสอบแพ็กเกจ และแถวไดเจสต์การค้นหาที่สร้างขึ้น เพื่อให้
เส้นทางเจ้าของโดยตรงสอดคล้องกับอำนาจของผู้เผยแพร่รายใหม่ การสงวนแฮนเดิลที่มีการป้องกันซึ่งยังทำงานอยู่
สำหรับแฮนเดิลที่กู้คืนจะถูกกำหนดใหม่ให้ผู้ใช้ทดแทนด้วย เพื่อไม่ให้การซิงโครไนซ์โปรไฟล์ในภายหลัง
สามารถกู้คืนอำนาจที่แข่งขันกันของผู้ใช้เดิมได้ ตารางหลักแต่ละตารางจำกัดไว้ที่
100 แถวต่อธุรกรรมการนำไปใช้ การกู้คืนที่มีขนาดใหญ่กว่านี้ต้องใช้การย้ายเจ้าของแบบดำเนินการต่อได้ก่อน
ซอร์ส Skills จาก GitHub มีขอบเขตตามผู้เผยแพร่ และจะถูกรายงานว่าตรวจสอบแล้วแทนที่จะเขียนใหม่

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

- ทั้งสองปลายทางต้องตรวจสอบสิทธิ์ด้วยโทเค็น API และใช้งานได้เฉพาะเจ้าของ Skills เท่านั้น
- `rename` เก็บ slug ก่อนหน้าไว้เป็นนามแฝงเปลี่ยนเส้นทาง
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

แบนผู้ใช้และลบ Skills ที่เป็นเจ้าของอย่างถาวร (เฉพาะผู้ควบคุม/ผู้ดูแลระบบ)

เนื้อหา:

```json
{ "handle": "user_handle", "reason": "เหตุผลในการแบนที่ไม่บังคับ" }
```

หรือ

```json
{ "userId": "users_...", "reason": "เหตุผลในการแบนที่ไม่บังคับ" }
```

การตอบกลับ:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

ยกเลิกการแบนผู้ใช้และกู้คืน Skills ที่มีสิทธิ์ (เฉพาะผู้ดูแลระบบ)

เนื้อหา:

```json
{ "handle": "user_handle", "reason": "เหตุผลในการยกเลิกการแบนที่ไม่บังคับ" }
```

หรือ

```json
{ "userId": "users_...", "reason": "เหตุผลในการยกเลิกการแบนที่ไม่บังคับ" }
```

การตอบกลับ:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

เปลี่ยนเหตุผลที่จัดเก็บไว้สำหรับการแบนที่มีอยู่ โดยไม่ยกเลิกการแบนหรือกู้คืน
เนื้อหา (เฉพาะผู้ดูแลระบบ) ค่าเริ่มต้นเป็นการทดลองดำเนินการ เว้นแต่ `dryRun` จะเป็น `false`

เนื้อหา:

```json
{ "handle": "user_handle", "reason": "สแปมการเผยแพร่จำนวนมาก", "dryRun": true }
```

หรือ

```json
{ "userId": "users_...", "reason": "สแปมการเผยแพร่จำนวนมาก", "dryRun": false }
```

การตอบกลับ:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "การแบนอัตโนมัติเนื่องจากมัลแวร์",
  "nextReason": "สแปมการเผยแพร่จำนวนมาก",
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

พารามิเตอร์การค้นหา:

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
      "displayName": "ผู้ใช้",
      "name": "ผู้ใช้",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

เพิ่ม/นำดาวออก (รายการเด่น) ทั้งสองปลายทางเป็นแบบ idempotent

การตอบกลับ:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## ปลายทาง CLI แบบเดิม (เลิกใช้งานแล้ว)

ยังคงรองรับ CLI เวอร์ชันเก่า:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

ดูแผนการนำออกที่ `DEPRECATIONS.md`

`POST /api/cli/upload-url` ส่งคืน `uploadUrl` และ `uploadTicket` การเผยแพร่
แพ็กเกจที่เตรียมทาร์บอล ClawPack ต้องส่งรหัสพื้นที่จัดเก็บที่ได้เป็น
`clawpack` และทิกเก็ตที่ส่งคืนเป็น `clawpackUploadTicket`

## การค้นหารีจิสทรี (`/.well-known/clawhub.json`)

CLI สามารถค้นหาการตั้งค่ารีจิสทรี/การตรวจสอบสิทธิ์จากเว็บไซต์:

- `/.well-known/clawhub.json` (JSON, แนะนำ)
- `/.well-known/clawdhub.json` (แบบเดิม)

สคีมา:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

หากโฮสต์ด้วยตนเอง ให้บริการไฟล์นี้ (หรือกำหนด `CLAWHUB_REGISTRY` อย่างชัดเจน; แบบเดิมคือ `CLAWDHUB_REGISTRY`)
