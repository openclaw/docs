---
read_when:
    - การใช้ ClawHub CLI
    - การดีบักการติดตั้ง การอัปเดต หรือการเผยแพร่
summary: 'ข้อมูลอ้างอิง CLI: คำสั่ง แฟล็ก การกำหนดค่า และลักษณะการทำงานของ lockfile'
x-i18n:
    generated_at: "2026-06-27T17:15:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9c6c152cbe121f55969aeda0b990b444325e49ce6613745ef094a78d2d2cfce4
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

แพ็กเกจ CLI: `clawhub`, bin: `clawhub`.

ติดตั้งแบบทั่วทั้งระบบด้วย npm หรือ pnpm:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

จากนั้นตรวจสอบ:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## แฟล็กระดับสากล

- `--workdir <dir>`: ไดเรกทอรีทำงาน (ค่าเริ่มต้น: cwd; ถ้ากำหนดไว้จะย้อนกลับไปใช้พื้นที่ทำงาน Clawdbot)
- `--dir <dir>`: ไดเรกทอรีติดตั้งใต้ workdir (ค่าเริ่มต้น: `skills`)
- `--site <url>`: URL ฐานสำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `https://clawhub.ai`)
- `--registry <url>`: URL ฐานของ API (ค่าเริ่มต้น: ค้นพบอัตโนมัติ มิฉะนั้นใช้ `https://clawhub.ai`)
- `--no-input`: ปิดใช้งานพรอมป์

ตัวแปรสภาพแวดล้อมที่เทียบเท่า:

- `CLAWHUB_SITE` (เดิม `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (เดิม `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (เดิม `CLAWDHUB_WORKDIR`)

### พร็อกซี HTTP

CLI รองรับตัวแปรสภาพแวดล้อมพร็อกซี HTTP มาตรฐานสำหรับระบบที่อยู่หลัง
พร็อกซีองค์กรหรือเครือข่ายที่ถูกจำกัด:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

เมื่อตั้งค่าตัวแปรใดตัวแปรหนึ่งเหล่านี้ CLI จะส่งคำขอขาออกผ่าน
พร็อกซีที่ระบุ `HTTPS_PROXY` ใช้สำหรับคำขอ HTTPS, `HTTP_PROXY`
ใช้สำหรับ HTTP แบบธรรมดา และรองรับ `NO_PROXY` / `no_proxy` เพื่อข้ามพร็อกซีสำหรับ
โฮสต์หรือโดเมนที่ระบุ

จำเป็นต้องใช้สิ่งนี้บนระบบที่บล็อกการเชื่อมต่อขาออกโดยตรง
(เช่น คอนเทนเนอร์ Docker, Hetzner VPS ที่ใช้อินเทอร์เน็ตผ่านพร็อกซีเท่านั้น,
ไฟร์วอลล์องค์กร)

ตัวอย่าง:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

เมื่อไม่ได้ตั้งค่าตัวแปรพร็อกซี พฤติกรรมจะไม่เปลี่ยนแปลง (เชื่อมต่อโดยตรง)

## ไฟล์กำหนดค่า

จัดเก็บโทเค็น API ของคุณและ URL รีจิสทรีที่แคชไว้

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` หรือ `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- เส้นทางสำรองเดิม: หาก `clawhub/config.json` ยังไม่มีอยู่ แต่มี `clawdhub/config.json` อยู่ CLI จะใช้เส้นทางเดิมซ้ำ
- การเขียนทับ: `CLAWHUB_CONFIG_PATH` (เดิม `CLAWDHUB_CONFIG_PATH`)

## คำสั่ง

### `login` / `auth login`

- ค่าเริ่มต้น: เปิดเบราว์เซอร์ไปที่ `<site>/cli/auth` และทำให้เสร็จผ่านคอลแบ็ก loopback
- แบบไม่มี UI: `clawhub login --token clh_...`
- แบบรีโมต/ไม่มี UI แบบโต้ตอบ: `clawhub login --device` พิมพ์รหัสและรอขณะที่คุณอนุญาตที่ `<site>/cli/device`

### `whoami`

- ตรวจสอบโทเค็นที่จัดเก็บไว้ผ่าน `/api/v1/whoami`

### `token`

- พิมพ์โทเค็น API ที่จัดเก็บไว้ไปยัง stdout
- มีประโยชน์สำหรับการส่งโทเค็นเข้าสู่ระบบภายในเครื่องผ่าน pipe ไปยังคำสั่งตั้งค่า secret ของ CI

### `star <skill>` / `unstar <skill>`

- เพิ่ม/ลบสกิลออกจากรายการไฮไลต์ของคุณ
- เรียก `POST /api/v1/stars/<slug>` และ `DELETE /api/v1/stars/<slug>`
- `--yes` ข้ามการยืนยัน

### `search <query...>`

- เรียก `/api/v1/search?q=...`
- เอาต์พุตประกอบด้วย slug ของสกิล, แฮนเดิลเจ้าของ, ชื่อที่แสดง และคะแนนความเกี่ยวข้อง
- การค้นหาให้ความสำคัญกับการจับคู่โทเค็น slug/ชื่อแบบตรงตัวก่อนความนิยมจากการดาวน์โหลด โทเค็น slug แบบเดี่ยว เช่น `map` จะจับคู่กับ `personal-map` ได้แรงกว่าสตริงย่อยภายใน `amap`
- ความนิยมเป็นเพียงน้ำหนักการจัดอันดับขนาดเล็ก ไม่ใช่การรับประกันว่าจะอยู่ตำแหน่งบนสุด
- หากสกิลควรปรากฏแต่ไม่ปรากฏ ให้รัน `clawhub inspect @owner/slug` ขณะเข้าสู่ระบบเพื่อตรวจสอบการวินิจฉัยการกลั่นกรองที่เจ้าของมองเห็นได้ ก่อนเปลี่ยนชื่อ metadata

### `explore`

- แสดงรายการสกิลใหม่ล่าสุดผ่าน `/api/v1/skills?limit=...&sort=createdAt` (เรียงตาม `createdAt` จากมากไปน้อย)
- แฟล็ก:
  - `--limit <n>` (1-200, ค่าเริ่มต้น: 25)
  - `--sort newest|updated|rating|downloads|trending` (ค่าเริ่มต้น: newest) alias การเรียงลำดับการติดตั้งแบบเดิมยังคงทำงานเพื่อความเข้ากันได้
  - `--json` (เอาต์พุตสำหรับเครื่องอ่าน)
- เอาต์พุต: `<slug>  v<version>  <age>  <summary>` (summary ถูกตัดให้เหลือ 50 อักขระ)

### `inspect @owner/slug`

- ดึง metadata ของสกิลและไฟล์เวอร์ชันโดยไม่ติดตั้ง
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: latest)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็กไว้ (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-200)
- `--files`: แสดงไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (เฉพาะไฟล์ข้อความ; จำกัด 200KB)
- `--json`: เอาต์พุตสำหรับเครื่องอ่าน

### `install @owner/slug`

- ระบุเวอร์ชันล่าสุดสำหรับเจ้าของและสกิลที่ตั้งชื่อไว้
- ดาวน์โหลด zip ผ่าน `/api/v1/download`
- แตกไฟล์ไปยัง `<workdir>/<dir>/<slug>`
- ปฏิเสธการเขียนทับสกิลที่ถูก pin; ให้รัน `clawhub unpin <skill>` ก่อน
- เขียน:
  - `<workdir>/.clawhub/lock.json` (เดิม `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (เดิม `.clawdhub`)

### `uninstall <skill>`

- ลบ `<workdir>/<dir>/<slug>` และลบรายการใน lockfile
- ส่ง telemetry แบบพยายามเต็มที่ขณะเข้าสู่ระบบ เพื่อให้จำนวนการติดตั้งปัจจุบันสามารถ
  ถูกปิดใช้งานได้
- แบบโต้ตอบ: ขอการยืนยัน
- แบบไม่โต้ตอบ (`--no-input`): ต้องใช้ `--yes`

### `list`

- อ่าน `<workdir>/.clawhub/lock.json` (เดิม `.clawdhub`)
- แสดง `pinned` ถัดจากสกิลที่ถูกตรึงด้วย `clawhub pin` รวมถึงเหตุผลเพิ่มเติมถ้ามี

### `pin <skill>`

- ทำเครื่องหมายสกิลที่ติดตั้งแล้วว่า pinned ใน lockfile
- `--reason <text>` บันทึกเหตุผลว่าทำไมสกิลจึงถูกตรึง
- สกิลที่ถูก pin จะถูกข้ามโดย `update --all` และถูกปฏิเสธโดย `update <skill>` โดยตรง
- สกิลที่ถูก pin ยังปฏิเสธ `install --force` เพื่อไม่ให้ไบต์ภายในเครื่องถูกแทนที่โดยไม่ตั้งใจ

### `unpin <skill>`

- ลบ pin ใน lockfile ออกจากสกิลที่ติดตั้งแล้ว เพื่อให้การอัปเดตในอนาคตแก้ไขได้

### `update [@owner/slug]` / `update --all`

- คำนวณ fingerprint จากไฟล์ภายในเครื่อง
- หาก fingerprint ตรงกับเวอร์ชันที่รู้จัก: ไม่มีพรอมป์
- หาก fingerprint ไม่ตรง:
  - ปฏิเสธโดยค่าเริ่มต้น
  - เขียนทับด้วย `--force` (หรือพรอมป์ หากเป็นแบบโต้ตอบ)
- สกิลที่ถูก pin จะไม่ถูกอัปเดตด้วย `--force`
- `update <skill>` ล้มเหลวทันทีสำหรับสกิลที่ถูก pin และแจ้งให้คุณรัน `clawhub unpin <skill>` ก่อน
- `update --all` ข้าม slug ที่ถูก pin และพิมพ์สรุปว่าสิ่งใดยังคงถูกตรึงไว้

### `skill publish <path>`

- เปรียบเทียบ fingerprint ของบันเดิลภายในเครื่องกับ ClawHub และออกด้วยสถานะสำเร็จเมื่อ
  เนื้อหาถูกเผยแพร่แล้ว
- สกิลใหม่ใช้ค่าเริ่มต้นเป็น `1.0.0`; สกิลที่เปลี่ยนแปลงใช้ค่าเริ่มต้นเป็นเวอร์ชัน patch
  ถัดไป
- `--version <version>` เลือกเวอร์ชันอย่างชัดเจนและเผยแพร่แม้เมื่อ
  เนื้อหาตรงกับเวอร์ชันที่มีอยู่
- `--dry-run` ประมวลผลการเผยแพร่โดยไม่อัปโหลด; `--json` พิมพ์ผลลัพธ์
  สำหรับเครื่องอ่าน
- `--owner <handle>` เผยแพร่ภายใต้แฮนเดิลผู้เผยแพร่องค์กร/ผู้ใช้เมื่อ
  ผู้ดำเนินการมีสิทธิ์เข้าถึงผู้เผยแพร่
- `--migrate-owner` ย้ายสกิลที่มีอยู่ไปยัง `--owner` ขณะเผยแพร่
  เวอร์ชันใหม่ ต้องมีสิทธิ์ admin/owner บนผู้เผยแพร่ทั้งสองฝั่ง
- อธิบายพฤติกรรมของเจ้าของและการตรวจทานไว้ใน `docs/publishing.md`
- การเผยแพร่สกิลหมายความว่าสกิลนั้นถูกเผยแพร่ภายใต้ `MIT-0` บน ClawHub
- สกิลที่เผยแพร่แล้วใช้งาน แก้ไข และแจกจ่ายต่อได้ฟรีโดยไม่ต้องระบุแหล่งที่มา
- ClawHub ไม่รองรับสกิลแบบชำระเงินหรือการกำหนดราคาต่อสกิล
- alias เดิม: `publish <path>`

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

workflow ที่นำกลับมาใช้ซ้ำได้ของ ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
เรียก `skill publish` สำหรับ `skill_path` หนึ่งรายการ หรือสำหรับโฟลเดอร์สกิลโดยตรงแต่ละโฟลเดอร์
ใต้ `root` (ค่าเริ่มต้น: `skills`) โดยจะข้ามสกิลที่ไม่เปลี่ยนแปลงและใช้
พฤติกรรมเวอร์ชัน patch อัตโนมัติเดียวกัน

ตั้งค่า `dry_run: true` เพื่อดูตัวอย่างโดยไม่มีโทเค็น การเผยแพร่จริงต้องใช้
secret `clawhub_token`

### `sync`

- สแกน workdir ปัจจุบัน ไดเรกทอรีสกิลที่กำหนดค่าไว้ และโฟลเดอร์
  `--root <dir>` ใดๆ เพื่อหาโฟลเดอร์สกิลภายในเครื่องที่มี `SKILL.md` หรือ
  `skill.md`
- เปรียบเทียบ fingerprint ของสกิลภายในเครื่องแต่ละรายการกับ ClawHub และเผยแพร่เฉพาะสกิลใหม่หรือ
  สกิลที่เปลี่ยนแปลง
- สกิลใหม่เผยแพร่เป็น `1.0.0`; สกิลที่เปลี่ยนแปลงเผยแพร่เป็นเวอร์ชัน patch ถัดไป
  โดยค่าเริ่มต้น ใช้ `--bump minor|major` สำหรับชุดอัปเดตที่ควรขยับด้วย
  ขั้น semver ที่ใหญ่กว่า
- `--dry-run` แสดงแผนการเผยแพร่โดยไม่อัปโหลด; `--json` พิมพ์แผน
  สำหรับเครื่องอ่าน
- `--all` เผยแพร่ทุกสกิลใหม่หรือที่เปลี่ยนแปลงโดยไม่ต้องพรอมป์ หากไม่มี
  `--all` เทอร์มินัลแบบโต้ตอบจะให้คุณเลือกสกิลที่จะเผยแพร่
- `--owner <handle>` เผยแพร่ภายใต้แฮนเดิลผู้เผยแพร่องค์กร/ผู้ใช้เมื่อ
  ผู้ดำเนินการมีสิทธิ์เข้าถึงผู้เผยแพร่
- `sync` เป็นการเผยแพร่ทางเดียวเท่านั้น ไม่ติดตั้ง อัปเดต ดาวน์โหลด หรือ
  รายงาน telemetry การติดตั้ง/ดาวน์โหลด

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- ต้องใช้ `clawhub login`
- รัน ClawHub ClawScan ผ่าน `POST /api/v1/skills/-/scan` จากนั้น poll จนกว่าการสแกนจะเข้าสู่สถานะปลายทาง
- การสแกนเป็นแบบอะซิงโครนัสและอาจใช้เวลา ระหว่างอยู่ในคิว spinner ของเทอร์มินัลจะแสดงตำแหน่งการสแกนตามลำดับความสำคัญปัจจุบันและจำนวนการสแกนที่อยู่ข้างหน้า
- การสแกนที่เผยแพร่แล้วต้องมีสิทธิ์เจ้าของหรือสิทธิ์จัดการผู้เผยแพร่ Moderator/admin สามารถใช้ backend เดียวกันผ่าน `clawhub-admin`
- `--update` ใช้ได้เฉพาะกับ `--slug`; จะเขียนผลการสแกนที่เผยแพร่แล้วสำเร็จกลับไปยังเวอร์ชันที่เลือก
- `--output <file.zip>` ดาวน์โหลดไฟล์เก็บถาวรรายงานฉบับเต็มพร้อม `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`
- `--json` พิมพ์คำตอบจากการ poll แบบเต็มสำหรับระบบอัตโนมัติ
- ไม่รองรับการสแกนเส้นทางภายในเครื่องอีกต่อไป ให้อัปโหลดเวอร์ชันใหม่ จากนั้นใช้ `scan download` เพื่อดึงผลการสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งนั้น

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- ต้องใช้ `clawhub login`
- ดาวน์โหลด ZIP รายงานการสแกนที่จัดเก็บไว้สำหรับเวอร์ชันของสกิลหรือ Plugin ที่ส่งมา รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อนโดยการตรวจสอบความปลอดภัยของ ClawHub
- การดาวน์โหลดสกิลใช้ slug ของสกิลและมีค่าเริ่มต้นเป็น `--kind skill`
- การดาวน์โหลด Plugin ใช้ชื่อแพ็กเกจและต้องใช้ `--kind plugin`
- ต้องใช้ `--version` เพื่อให้ผู้เขียนตรวจสอบเวอร์ชันที่ส่งอย่างแน่นอนซึ่ง ClawHub บล็อกไว้
- `--output <file.zip>` เลือกเส้นทางปลายทาง

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub จัดส่ง workflow อย่างเป็นทางการที่นำกลับมาใช้ซ้ำได้ที่
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/bdb23c3a9ffe77cb4184fdd13897ce535fb2d703/.github/workflows/skill-publish.yml)
สำหรับ repo สกิลและ repo แคตตาล็อก

การตั้งค่าแคตตาล็อกทั่วไป:

```yaml
name: Skill Publish

on:
  pull_request:
  workflow_dispatch:

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

หมายเหตุ:

- `root` มีค่าเริ่มต้นเป็น `skills` สำหรับ repo แคตตาล็อก
- ส่ง `skill_path: skills/review-helper` เพื่อประมวลผลโฟลเดอร์สกิลหนึ่งโฟลเดอร์
- `owner` แมปกับแฟล็ก CLI `--owner`; ละไว้เพื่อเผยแพร่ในฐานะผู้ใช้ที่ตรวจสอบสิทธิ์แล้ว
- การเผยแพร่สกิล V1 ใช้ `clawhub_token`; การเผยแพร่ที่เชื่อถือได้ด้วย GitHub OIDC เป็นเฉพาะแพ็กเกจในตอนนี้

### `delete <skill>`

- หากไม่มี `--version` ให้ลบ Skills แบบซ่อน (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- เรียก `DELETE /api/v1/skills/{slug}`
- การลบแบบซ่อนที่เจ้าของเริ่มเองจะสงวนสลักระบุไว้ 30 วัน คำสั่งจะพิมพ์เวลาหมดอายุ
- `--version <version>` จะลบเวอร์ชันที่เป็นของเจ้าของและไม่ใช่เวอร์ชันล่าสุดแบบถาวรผ่านเส้นทางที่ล้มเหลวแบบปิดกั้น
  และเจาะจงเวอร์ชัน
  เวอร์ชันที่ถูกลบจะกู้คืนหรือเผยแพร่ซ้ำไม่ได้ เผยแพร่เวอร์ชันทดแทนก่อนลบ
  เวอร์ชันล่าสุดปัจจุบัน เจ้าหน้าที่แพลตฟอร์มไม่ข้ามสิทธิ์ความเป็นเจ้าของสำหรับขั้นตอนเฉพาะเวอร์ชันนี้
- `--reason <text>` บันทึกหมายเหตุการกลั่นกรองในการลบ Skills ทั้งรายการแบบซ่อนและบันทึกการตรวจสอบ
- `--note <text>` เป็นนามแฝงของ `--reason`
- `--yes` ข้ามการยืนยัน

### `undelete <skill>`

- กู้คืน Skills ที่ถูกซ่อน (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- ไม่มีการกู้คืนเวอร์ชันที่ถูกลบ เวอร์ชันที่ถูกลบถาวรจะกู้คืนไม่ได้
- เรียก `POST /api/v1/skills/{slug}/undelete`
- `--reason <text>` บันทึกหมายเหตุการกลั่นกรองใน Skills และบันทึกการตรวจสอบ
- `--note <text>` เป็นนามแฝงของ `--reason`
- `--yes` ข้ามการยืนยัน

### `hide <skill>`

- ซ่อน Skills (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- นามแฝงของ `delete`

### `unhide <skill>`

- เลิกซ่อน Skills (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- นามแฝงของ `undelete`

### `skill rename <skill> <new-name>`

- เปลี่ยนชื่อ Skills ที่เป็นเจ้าของ และเก็บสลักระบุก่อนหน้าไว้เป็นนามแฝงสำหรับเปลี่ยนเส้นทาง
- เรียก `POST /api/v1/skills/{slug}/rename`
- `--yes` ข้ามการยืนยัน

### `skill merge <source> <target>`

- ผสาน Skills หนึ่งรายการที่เป็นเจ้าของเข้ากับ Skills อีกรายการที่เป็นเจ้าของ
- สลักระบุต้นทางจะไม่แสดงต่อสาธารณะอีกต่อไป และกลายเป็นนามแฝงสำหรับเปลี่ยนเส้นทางไปยังเป้าหมาย
- เรียก `POST /api/v1/skills/{sourceSlug}/merge`
- `--yes` ข้ามการยืนยัน

### `transfer`

- เวิร์กโฟลว์การโอนความเป็นเจ้าของ
- การโอนไปยังแฮนเดิลผู้ใช้จะสร้างคำขอที่รอดำเนินการเพื่อให้ผู้รับยอมรับ
- การโอนไปยังแฮนเดิลองค์กร/ผู้เผยแพร่จะมีผลทันทีเฉพาะเมื่อผู้ดำเนินการมี
  สิทธิ์ผู้ดูแลระบบทั้งต่อเจ้าของปัจจุบันและผู้เผยแพร่ปลายทาง
- คำสั่งย่อย:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- ปลายทาง:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- เรียกดูหรือค้นหาแค็ตตาล็อกแพ็กเกจรวมผ่าน `GET /api/v1/packages` และ `GET /api/v1/packages/search`
- ใช้คำสั่งนี้สำหรับ Plugin และรายการตระกูลแพ็กเกจอื่น ๆ ส่วน `search` ระดับบนสุดยังคงเป็นพื้นผิวการค้นหา Skills
- แฟล็ก:
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>` (1-100, ค่าเริ่มต้น: 25)
  - `--json`

ตัวอย่าง:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- ดึงข้อมูลเมตาแพ็กเกจโดยไม่ติดตั้ง
- ใช้คำสั่งนี้สำหรับข้อมูลเมตา Plugin, ความเข้ากันได้, การยืนยัน, แหล่งที่มา และการตรวจสอบเวอร์ชัน/ไฟล์
- `--version <version>`: ตรวจสอบเวอร์ชันที่เจาะจง (ค่าเริ่มต้น: ล่าสุด)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-100)
- `--files`: แสดงรายการไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (ไฟล์ข้อความเท่านั้น จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `package download <name>`

- แปลงเวอร์ชันแพ็กเกจผ่าน
  `GET /api/v1/packages/{name}/versions/{version}/artifact`
- ดาวน์โหลดอาร์ติแฟกต์จาก `downloadUrl` ของตัวแปลง
- ยืนยัน SHA-256 ของ ClawHub สำหรับอาร์ติแฟกต์ทั้งหมด
- สำหรับอาร์ติแฟกต์ ClawPack แบบ npm-pack จะยืนยันความถูกต้อง `sha512` ของ npm,
  shasum ของ npm และชื่อ/เวอร์ชัน `package.json` ของทาร์บอลด้วย
- เวอร์ชัน ZIP เดิมดาวน์โหลดผ่านเส้นทาง ZIP เดิม
- แฟล็ก:
  - `--version <version>`: ดาวน์โหลดเวอร์ชันที่เจาะจง
  - `--tag <tag>`: ดาวน์โหลดเวอร์ชันที่ติดแท็ก (ค่าเริ่มต้น: `latest`)
  - `-o, --output <path>`: ไฟล์หรือไดเรกทอรีเอาต์พุต
  - `--force`: เขียนทับไฟล์เอาต์พุตที่มีอยู่
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- คำนวณ SHA-256 ของ ClawHub, ความถูกต้อง `sha512` ของ npm และ shasum ของ npm สำหรับ
  อาร์ติแฟกต์ภายในเครื่อง
- เมื่อใช้ `--package` จะแปลงข้อมูลเมตาที่คาดหวังจาก ClawHub และเปรียบเทียบ
  ไฟล์ภายในเครื่องกับข้อมูลเมตาอาร์ติแฟกต์ที่เผยแพร่
- เมื่อใช้แฟล็กไดเจสต์โดยตรง จะยืนยันโดยไม่ค้นหาผ่านเครือข่าย
- แฟล็ก:
  - `--package <name>`: ชื่อแพ็กเกจสำหรับแปลงข้อมูลเมตาอาร์ติแฟกต์ที่คาดหวัง
  - `--version <version>` หรือ `--tag <tag>`: เวอร์ชันแพ็กเกจที่คาดหวัง
  - `--sha256 <hex>`: SHA-256 ของ ClawHub ที่คาดหวัง
  - `--npm-integrity <sri>`: ความถูกต้องของ npm ที่คาดหวัง
  - `--npm-shasum <sha1>`: shasum ของ npm ที่คาดหวัง
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- เรียกใช้ Plugin Inspector ที่มาพร้อม ClawHub CLI กับโฟลเดอร์แพ็กเกจ Plugin
  ภายในเครื่อง
- ค่าเริ่มต้นคือการตรวจสอบแบบออฟไลน์/สแตติก โดยไม่ค้นหาหรือนำเข้าเช็กเอาต์
  OpenClaw ภายในเครื่อง
- ข้อผิดพลาดความเข้ากันได้ที่ร้ายแรงจะออกด้วยรหัสไม่เป็นศูนย์ ผลการตรวจพบที่เป็นคำเตือนเท่านั้นจะถูกพิมพ์ออกมาแต่
  ออกด้วยรหัสศูนย์
- แฟล็ก:
  - `--out <dir>`: เขียนรายงาน Plugin Inspector ไปยังไดเรกทอรีนี้
  - `--openclaw <path>`: ตรวจสอบเทียบกับเช็กเอาต์ OpenClaw ภายในเครื่องที่ระบุชัดเจน
  - `--runtime`: เปิดใช้การจับข้อมูลรันไทม์ นำเข้าโค้ด Plugin
  - `--allow-execute`: อนุญาตการจับข้อมูลรันไทม์ในพื้นที่ทำงานที่แยกไว้
  - `--no-mock-sdk`: ปิดใช้ OpenClaw SDK จำลองระหว่างการจับข้อมูลรันไทม์
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package validate ./example-plugin
```

หากการตรวจสอบรายงานผลการตรวจพบเกี่ยวกับแพ็กเกจ, แมนิเฟสต์, การนำเข้า SDK หรืออาร์ติแฟกต์ โปรดดู
[การแก้ไขการตรวจสอบ Plugin](/th/clawhub/plugin-validation-fixes) แล้วเรียกใช้คำสั่งอีกครั้ง

### `package delete <name>`

- หากไม่มี `--version` จะลบแพ็กเกจและรีลีสทั้งหมดแบบซ่อน
- `--version <version>` จะลบรีลีสที่เป็นของเจ้าของและไม่ใช่รีลีสล่าสุดหนึ่งรายการแบบถาวรผ่านเส้นทางที่ล้มเหลวแบบปิดกั้น
  และเจาะจงเวอร์ชัน
  เวอร์ชันที่ถูกลบจะกู้คืนหรือเผยแพร่ซ้ำไม่ได้ เผยแพร่เวอร์ชันทดแทนก่อนลบ
  เวอร์ชันล่าสุดปัจจุบัน ขั้นตอนเฉพาะเวอร์ชันนี้ต้องเป็นเจ้าของแพ็กเกจหรือผู้ดูแลระบบผู้เผยแพร่องค์กร
  เจ้าหน้าที่แพลตฟอร์มไม่ข้ามสิทธิ์ความเป็นเจ้าของแพ็กเกจ
- การลบทั้งแพ็กเกจแบบซ่อนต้องเป็นเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลระบบผู้เผยแพร่องค์กร, ผู้ดูแลแพลตฟอร์ม
  หรือผู้ดูแลระบบแพลตฟอร์ม
- แฟล็ก:
  - `--version <version>`: ลบเวอร์ชันที่ไม่ใช่ล่าสุดหนึ่งรายการแบบถาวร
  - `--yes`: ข้ามการยืนยัน
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- กู้คืนแพ็กเกจและรีลีสที่ถูกลบแบบซ่อน
- ไม่มีการกู้คืนเวอร์ชันที่ถูกลบ เวอร์ชันที่ถูกลบถาวรจะกู้คืนไม่ได้
- ต้องเป็นเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลระบบผู้เผยแพร่องค์กร, ผู้ดูแลแพลตฟอร์ม
  หรือผู้ดูแลระบบแพลตฟอร์ม
- เรียก `POST /api/v1/packages/{name}/undelete`
- แฟล็ก:
  - `--yes`: ข้ามการยืนยัน
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- โอนแพ็กเกจไปยังผู้เผยแพร่อีกราย
- ต้องมีสิทธิ์ผู้ดูแลระบบทั้งต่อเจ้าของแพ็กเกจปัจจุบันและผู้เผยแพร่
  ปลายทาง เว้นแต่จะดำเนินการโดยผู้ดูแลระบบแพลตฟอร์ม
- ชื่อแพ็กเกจแบบมีขอบเขตต้องโอนไปยังเจ้าของขอบเขตที่ตรงกัน
- เรียก `POST /api/v1/packages/{name}/transfer`
- แฟล็ก:
  - `--to <owner>`: แฮนเดิลผู้เผยแพร่ปลายทาง
  - `--reason <text>`: เหตุผลการตรวจสอบเพิ่มเติม
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- คำสั่งที่ต้องยืนยันตัวตนสำหรับรายงานแพ็กเกจต่อผู้ดูแล
- เรียก `POST /api/v1/packages/{name}/report`
- รายงานอยู่ในระดับแพ็กเกจ อาจผูกกับเวอร์ชันก็ได้ และจะมองเห็นได้
  สำหรับผู้ดูแลเพื่อตรวจสอบ
- รายงานจะไม่ซ่อนแพ็กเกจหรือบล็อกการดาวน์โหลดโดยอัตโนมัติด้วยตัวเอง
- แฟล็ก:
  - `--version <version>`: เวอร์ชันแพ็กเกจเพิ่มเติมที่จะแนบกับรายงาน
  - `--reason <text>`: เหตุผลรายงานที่จำเป็น
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- คำสั่งสำหรับเจ้าของเพื่อตรวจสอบการมองเห็นด้านการกลั่นกรองของแพ็กเกจ
- เรียก `GET /api/v1/packages/{name}/moderation`
- แสดงสถานะการสแกนแพ็กเกจปัจจุบัน, จำนวนรายงานที่เปิดอยู่, สถานะการกลั่นกรองด้วยตนเองของรีลีสล่าสุด,
  สถานะการบล็อกดาวน์โหลด และเหตุผลการกลั่นกรอง
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- ตรวจสอบว่าแพ็กเกจพร้อมสำหรับการใช้งานใน OpenClaw ในอนาคตหรือไม่
- เรียก `GET /api/v1/packages/{name}/readiness`
- รายงานตัวบล็อกสำหรับสถานะทางการ, ความพร้อมใช้งานของ ClawPack, ไดเจสต์อาร์ติแฟกต์,
  ที่มาของแหล่งซอร์ส, ความเข้ากันได้กับ OpenClaw, เป้าหมายโฮสต์, ข้อมูลเมตาสภาพแวดล้อม
  และสถานะการสแกน
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- แสดงสถานะการย้ายข้อมูลเชิงผู้ปฏิบัติการสำหรับแพ็กเกจที่อาจแทนที่
  Plugin ของ OpenClaw ที่มาพร้อมระบบ
- เรียกปลายทางความพร้อมที่คำนวณแล้วเดียวกับ `package readiness` แต่พิมพ์
  สถานะที่เน้นการย้ายข้อมูล, เวอร์ชันล่าสุด, สถานะแพ็กเกจทางการ, การตรวจสอบ และ
  ตัวบล็อก
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- สร้างผู้เผยแพร่องค์กรที่เป็นของผู้ใช้ที่ยืนยันตัวตนแล้ว
- แฮนเดิลจะถูกปรับให้เป็นตัวพิมพ์เล็ก และอาจส่งพร้อมหรือไม่พร้อม `@` ก็ได้
- ผู้เผยแพร่องค์กรที่สร้างใหม่จะยังไม่น่าเชื่อถือ/เป็นทางการโดยค่าเริ่มต้น
- ล้มเหลวหากแฮนเดิลถูกใช้แล้วโดยผู้เผยแพร่ ผู้ใช้ หรือเส้นทางที่สงวนไว้ที่มีอยู่

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- เผยแพร่ Plugin แบบโค้ดหรือ Plugin แบบบันเดิลผ่าน `POST /api/v1/packages`
- `<source>` รับค่าได้ดังนี้:
  - พาธโฟลเดอร์ในเครื่อง: `./my-plugin`
  - tarball ของ ClawPack แบบ npm-pack ในเครื่อง: `./my-plugin-1.2.3.tgz`
  - รีโป GitHub: `owner/repo` หรือ `owner/repo@ref`
  - URL ของ GitHub: `https://github.com/owner/repo`
- ระบบตรวจจับเมทาดาทาอัตโนมัติจาก `package.json`, `openclaw.plugin.json` และ
  ตัวบ่งชี้บันเดิล OpenClaw จริง เช่น `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` และ `.cursor-plugin/plugin.json`
- แหล่งที่มาแบบ `.tgz` จะถูกถือเป็น ClawPack โดย CLI จะอัปโหลดไบต์ npm-pack
  ตรงตามจริง และใช้เนื้อหา `package/` ที่แตกออกมาเฉพาะสำหรับการตรวจสอบและ
  เติมเมทาดาทาล่วงหน้าเท่านั้น
- โฟลเดอร์ Plugin แบบโค้ดจะถูกแพ็กเป็น tarball npm ของ ClawPack ก่อนอัปโหลด
  เพื่อให้การติดตั้ง OpenClaw ตรวจสอบอาร์ทิแฟกต์ตรงตามจริงได้ ส่วนโฟลเดอร์
  Plugin แบบบันเดิลยังคงใช้เส้นทางเผยแพร่ไฟล์ที่แตกออกมา
- สำหรับแหล่งที่มาจาก GitHub การระบุที่มาของซอร์สจะถูกเติมอัตโนมัติจากรีโป, commit ที่ resolve แล้ว, ref และ subpath
- สำหรับโฟลเดอร์ในเครื่อง การระบุที่มาของซอร์สจะถูกตรวจจับอัตโนมัติจาก git ในเครื่องเมื่อ origin remote ชี้ไปที่ GitHub
- Plugin แบบโค้ดภายนอกต้องประกาศ `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion` อย่างชัดเจน
  `package.json.version` ระดับบนสุดจะไม่ถูกใช้เป็น fallback สำหรับการตรวจสอบการเผยแพร่
- `--dry-run` แสดงตัวอย่าง payload การเผยแพร่ที่ resolve แล้วโดยไม่อัปโหลด
- `--json` ส่งออกผลลัพธ์ที่เครื่องอ่านได้สำหรับ CI
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่ของผู้ใช้หรือองค์กรเมื่อ actor มีสิทธิ์เข้าถึงผู้เผยแพร่
- ชื่อแพ็กเกจแบบ scoped ต้องตรงกับ owner ที่เลือก ดู `docs/publishing.md`
- แฟล็กเดิม (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ยังใช้เป็น override ได้
- รีโป GitHub ส่วนตัวต้องใช้ `GITHUB_TOKEN`

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### ขั้นตอนในเครื่องที่แนะนำ

ใช้ `--dry-run` ก่อน เพื่อยืนยันเมทาดาทาแพ็กเกจที่ resolve แล้วและ
การระบุที่มาของซอร์สก่อนสร้างรีลีสจริง:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### ขั้นตอนสำหรับโฟลเดอร์ในเครื่อง

สำหรับ Plugin แบบโค้ด การเผยแพร่โฟลเดอร์จะสร้างและอัปโหลดอาร์ทิแฟกต์ ClawPack จาก
โฟลเดอร์แพ็กเกจ:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` ขั้นต่ำสำหรับ `--family code-plugin`

Plugin แบบโค้ดภายนอกต้องมีเมทาดาทา OpenClaw จำนวนเล็กน้อยใน
`package.json` manifest ขั้นต่ำนี้เพียงพอสำหรับการเผยแพร่ให้สำเร็จ:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2"
    }
  }
}
```

ฟิลด์ที่จำเป็น:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

หมายเหตุ:

- `package.json.version` คือเวอร์ชันรีลีสของแพ็กเกจคุณ แต่จะไม่ถูกใช้เป็น
  fallback สำหรับการตรวจสอบความเข้ากันได้/บิลด์ของ OpenClaw
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมทาดาทาเสริม
  ClawHub อาจแสดงค่าเหล่านี้เมื่อมีอยู่ แต่ไม่จำเป็นสำหรับการเผยแพร่
- `openclaw.compat.minGatewayVersion` และ
  `openclaw.build.pluginSdkVersion` เป็นข้อมูลเสริมเพิ่มเติมหากคุณต้องการเผยแพร่
  เมทาดาทาความเข้ากันได้ที่ละเอียดขึ้น
- หากคุณใช้ CLI `clawhub` รุ่นเก่า ให้อัปเกรดก่อนเผยแพร่เพื่อให้
  การตรวจสอบ preflight ในเครื่องทำงานก่อนอัปโหลด
- หากการตรวจสอบรายงานโค้ดการแก้ไข ให้ดู
  [การแก้ไขการตรวจสอบ Plugin](/th/clawhub/plugin-validation-fixes)

#### GitHub Actions

ClawHub ยังมาพร้อมกับ workflow ที่ใช้ซ้ำได้อย่างเป็นทางการที่
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/bdb23c3a9ffe77cb4184fdd13897ce535fb2d703/.github/workflows/package-publish.yml)
สำหรับรีโป Plugin

การตั้งค่าฝั่ง caller ทั่วไป:

```yaml
name: Package Publish

on:
  pull_request:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/')
    permissions:
      contents: read
      id-token: write
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

หมายเหตุ:

- workflow ที่ใช้ซ้ำได้ตั้งค่าเริ่มต้นของ `source` เป็นรีโป caller
- สำหรับ monorepo ให้ส่ง `source_path` เพื่อให้ workflow เผยแพร่โฟลเดอร์แพ็กเกจ
  Plugin เช่น `source_path: extensions/codex`
- pin workflow ที่ใช้ซ้ำได้กับ tag ที่เสถียรหรือ SHA ของ commit แบบเต็ม อย่ารันการเผยแพร่รีลีสจาก `@main`
- `pull_request` ควรใช้ `dry_run: true` เพื่อให้ CI ไม่สร้างผลกระทบค้างไว้
- การเผยแพร่จริงควรจำกัดไว้เฉพาะ event ที่เชื่อถือได้ เช่น `workflow_dispatch` หรือการ push tag
- การเผยแพร่ที่เชื่อถือได้โดยไม่มี secret ใช้ได้เฉพาะบน `workflow_dispatch`; การ push tag ยังต้องใช้ `clawhub_token`
- เก็บ `clawhub_token` ให้พร้อมใช้งานสำหรับการเผยแพร่ครั้งแรก, แพ็กเกจที่ไม่น่าเชื่อถือ หรือการเผยแพร่แบบ break-glass
- workflow จะอัปโหลดผลลัพธ์ JSON เป็นอาร์ทิแฟกต์และเปิดเผยเป็น output ของ workflow

### `package trusted-publisher get <name>`

- แสดง config ผู้เผยแพร่ที่เชื่อถือได้ของ GitHub Actions สำหรับแพ็กเกจ
- ใช้คำสั่งนี้หลังจากตั้งค่า config เพื่อยืนยัน repository, ชื่อไฟล์ workflow
  และ pin environment เสริม
- แฟล็ก:
  - `--json`: ผลลัพธ์ที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- แนบหรือแทนที่ config ผู้เผยแพร่ที่เชื่อถือได้ของ GitHub Actions สำหรับแพ็กเกจ
  ที่มีอยู่
- ต้องสร้างแพ็กเกจก่อนผ่าน `clawhub package publish` แบบ manual ปกติหรือแบบยืนยันตัวตนด้วย token
- หลังจากตั้งค่า config แล้ว การเผยแพร่ GitHub Actions ที่รองรับในอนาคตสามารถใช้
  OIDC/การเผยแพร่ที่เชื่อถือได้โดยไม่ต้องใช้ token ClawHub อายุยาว
- `--repository <repo>` ต้องเป็น `owner/repo`
- `--workflow-filename <file>` ต้องตรงกับชื่อไฟล์ workflow ใน
  `.github/workflows/`
- `--environment <name>` เป็นตัวเลือกเสริม เมื่อกำหนดค่าไว้ environment ของ GitHub Actions
  ใน claim ของ OIDC ต้องตรงกันทุกประการ
- ClawHub จะตรวจสอบ repository GitHub ที่กำหนดค่าไว้เมื่อคำสั่งนี้ทำงาน
  repository สาธารณะสามารถตรวจสอบได้ผ่านเมทาดาทา GitHub สาธารณะ ส่วน
  repository ส่วนตัวต้องให้ ClawHub มีสิทธิ์เข้าถึง GitHub สำหรับ repository นั้น
  เช่น ผ่านการติดตั้ง GitHub App ของ ClawHub ในอนาคต หรือ integration GitHub อื่นที่ได้รับอนุญาต
- แฟล็ก:
  - `--repository <repo>`: repository GitHub เช่น `openclaw/example-plugin`
  - `--workflow-filename <file>`: ชื่อไฟล์ workflow เช่น `package-publish.yml`
  - `--environment <name>`: environment ของ GitHub Actions ที่ต้องตรงกันทุกประการแบบเสริม
  - `--json`: ผลลัพธ์ที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- ลบ config ผู้เผยแพร่ที่เชื่อถือได้ออกจากแพ็กเกจ
- ใช้คำสั่งนี้เป็น rollback หาก workflow, repository หรือ pin environment จำเป็นต้อง
  ถูกปิดใช้งานหรือสร้างใหม่
- การเผยแพร่จริงในอนาคตต้องใช้การเผยแพร่แบบยืนยันตัวตนปกติจนกว่าจะ
  ตั้งค่า config อีกครั้ง
- แฟล็ก:
  - `--json`: ผลลัพธ์ที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### telemetry การติดตั้ง

- ส่งหลังจาก `clawhub install <slug>` เมื่อเข้าสู่ระบบอยู่ เว้นแต่จะตั้งค่า
  `CLAWHUB_DISABLE_TELEMETRY=1`
- การรายงานเป็นแบบ best-effort คำสั่งติดตั้งจะไม่ล้มเหลวหาก telemetry
  ไม่พร้อมใช้งาน
- รายละเอียด: `docs/telemetry.md`
