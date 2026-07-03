---
read_when:
    - การใช้ ClawHub CLI
    - การดีบักการติดตั้ง การอัปเดต หรือการเผยแพร่
summary: 'ข้อมูลอ้างอิง CLI: คำสั่ง, แฟล็ก, การกำหนดค่า, และพฤติกรรมของ lockfile'
x-i18n:
    generated_at: "2026-07-03T10:03:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5bc3d499e78ba3c9861c2faf6a01cf8afd92d6b35c42658c5b702692b5c8746
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

แพ็กเกจ CLI: `clawhub`, ไบนารี: `clawhub`.

ติดตั้งแบบโกลบอลด้วย npm หรือ pnpm:

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

## แฟล็กโกลบอล

- `--workdir <dir>`: ไดเรกทอรีทำงาน (ค่าเริ่มต้น: cwd; ถอยกลับไปใช้พื้นที่ทำงาน Clawdbot หากกำหนดค่าไว้)
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
พร็อกซีองค์กรหรือเครือข่ายที่จำกัด:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

เมื่อตั้งค่าตัวแปรเหล่านี้ไว้ CLI จะกำหนดเส้นทางคำขอขาออกผ่าน
พร็อกซีที่ระบุ `HTTPS_PROXY` ใช้สำหรับคำขอ HTTPS, `HTTP_PROXY`
ใช้สำหรับ HTTP ธรรมดา และ `NO_PROXY` / `no_proxy` จะถูกนำมาใช้เพื่อข้ามพร็อกซีสำหรับ
โฮสต์หรือโดเมนที่ระบุ

สิ่งนี้จำเป็นในระบบที่บล็อกการเชื่อมต่อขาออกโดยตรง
(เช่น คอนเทนเนอร์ Docker, Hetzner VPS ที่ใช้อินเทอร์เน็ตผ่านพร็อกซีเท่านั้น, ไฟร์วอลล์
องค์กร)

ตัวอย่าง:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

เมื่อไม่ได้ตั้งค่าตัวแปรพร็อกซี ลักษณะการทำงานจะไม่เปลี่ยนแปลง (เชื่อมต่อโดยตรง)

## ไฟล์กำหนดค่า

จัดเก็บโทเค็น API ของคุณ + URL registry ที่แคชไว้

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` หรือ `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- ทางเลือกสำรองเดิม: หาก `clawhub/config.json` ยังไม่มีอยู่ แต่ `clawdhub/config.json` มีอยู่ CLI จะใช้พาธเดิมซ้ำ
- เขียนทับ: `CLAWHUB_CONFIG_PATH` (เดิม `CLAWDHUB_CONFIG_PATH`)

## คำสั่ง

### `login` / `auth login`

- ค่าเริ่มต้น: เปิดเบราว์เซอร์ไปที่ `<site>/cli/auth` และทำให้เสร็จผ่านคอลแบ็ก loopback
- Headless: `clawhub login --token clh_...`
- โหมดโต้ตอบระยะไกล/headless: `clawhub login --device` พิมพ์โค้ดและรอขณะที่คุณอนุญาตที่ `<site>/cli/device`

### `whoami`

- ตรวจสอบโทเค็นที่จัดเก็บไว้ผ่าน `/api/v1/whoami`

### `token`

- พิมพ์โทเค็น API ที่จัดเก็บไว้ไปยัง stdout
- มีประโยชน์สำหรับการไพป์โทเค็นเข้าสู่ระบบแบบโลคัลเข้าไปยังคำสั่งตั้งค่า secret ของ CI

### `star <skill>` / `unstar <skill>`

- เพิ่ม/ลบ skill จากไฮไลต์ของคุณ
- เรียก `POST /api/v1/stars/<slug>` และ `DELETE /api/v1/stars/<slug>`
- `--yes` ข้ามการยืนยัน

### `search <query...>`

- เรียก `/api/v1/search?q=...`
- เอาต์พุตมี slug ของ skill, handle ของ owner, ชื่อที่แสดง และคะแนนความเกี่ยวข้อง
- การค้นหาจะให้น้ำหนักกับการจับคู่ token ของ slug/name แบบตรงตัวก่อนความนิยมจากการดาวน์โหลด token slug แบบเดี่ยว เช่น `map` จะจับคู่กับ `personal-map` ได้แรงกว่าสตริงย่อยภายใน `amap`
- ความนิยมเป็นเพียง prior ขนาดเล็กในการจัดอันดับ ไม่ใช่การรับประกันว่าจะอยู่ตำแหน่งบนสุด
- หาก skill ควรปรากฏแต่ไม่ปรากฏ ให้รัน `clawhub inspect @owner/slug` ขณะเข้าสู่ระบบเพื่อตรวจสอบ diagnostics การกลั่นกรองที่ owner มองเห็นได้ก่อนเปลี่ยนชื่อ metadata

### `explore`

- แสดงรายการ skills ล่าสุดผ่าน `/api/v1/skills?limit=...&sort=createdAt` (เรียงตาม `createdAt` จากมากไปน้อย)
- แฟล็ก:
  - `--limit <n>` (1-200, ค่าเริ่มต้น: 25)
  - `--sort newest|updated|rating|downloads|trending` (ค่าเริ่มต้น: newest) alias การเรียงลำดับติดตั้งแบบเดิมยังใช้งานได้เพื่อความเข้ากันได้
  - `--json` (เอาต์พุตที่เครื่องอ่านได้)
- เอาต์พุต: `<slug>  v<version>  <age>  <summary>` (summary ถูกตัดเหลือ 50 อักขระ)

### `inspect @owner/slug`

- ดึง metadata ของ skill และไฟล์เวอร์ชันโดยไม่ติดตั้ง
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: ล่าสุด)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-200)
- `--files`: แสดงรายการไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (ไฟล์ข้อความเท่านั้น; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `install @owner/slug`

- resolve เวอร์ชันล่าสุดสำหรับ owner และ skill ที่ระบุชื่อ
- ดาวน์โหลด zip ผ่าน `/api/v1/download`
- แตกไฟล์ไปที่ `<workdir>/<dir>/<slug>`
- ปฏิเสธการเขียนทับ skills ที่ปักหมุดไว้; ให้รัน `clawhub unpin <skill>` ก่อน
- เขียน:
  - `<workdir>/.clawhub/lock.json` (เดิม `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (เดิม `.clawdhub`)

### `uninstall <skill>`

- ลบ `<workdir>/<dir>/<slug>` และลบรายการใน lockfile
- ส่ง telemetry แบบ best-effort ขณะเข้าสู่ระบบ เพื่อให้จำนวนการติดตั้งปัจจุบันสามารถ
  ถูกปิดใช้งานได้
- โหมดโต้ตอบ: ขอการยืนยัน
- ไม่โต้ตอบ (`--no-input`): ต้องใช้ `--yes`

### `list`

- อ่าน `<workdir>/.clawhub/lock.json` (เดิม `.clawdhub`)
- แสดง `pinned` ถัดจาก skills ที่ถูกตรึงด้วย `clawhub pin` รวมถึงเหตุผลที่ไม่บังคับ

### `pin <skill>`

- ทำเครื่องหมาย skill ที่ติดตั้งแล้วว่าถูกปักหมุดใน lockfile
- `--reason <text>` บันทึกเหตุผลที่ skill ถูกตรึง
- skills ที่ปักหมุดไว้จะถูกข้ามโดย `update --all` และถูกปฏิเสธโดย `update <skill>` โดยตรง
- skills ที่ปักหมุดไว้ยังปฏิเสธ `install --force` เพื่อไม่ให้ bytes ในเครื่องถูกแทนที่โดยไม่ตั้งใจ

### `unpin <skill>`

- ลบ pin ของ lockfile ออกจาก skill ที่ติดตั้งแล้ว เพื่อให้การอัปเดตในอนาคตแก้ไขได้

### `update [@owner/slug]` / `update --all`

- คำนวณ fingerprint จากไฟล์ในเครื่อง
- หาก fingerprint ตรงกับเวอร์ชันที่รู้จัก: ไม่มีพรอมป์
- หาก fingerprint ไม่ตรง:
  - ปฏิเสธตามค่าเริ่มต้น
  - เขียนทับด้วย `--force` (หรือพรอมป์ หากเป็นโหมดโต้ตอบ)
- skills ที่ปักหมุดไว้จะไม่ถูกอัปเดตด้วย `--force`
- `update <skill>` ล้มเหลวทันทีสำหรับ skills ที่ปักหมุดไว้ และแจ้งให้คุณรัน `clawhub unpin <skill>` ก่อน
- `update --all` ข้าม slugs ที่ปักหมุดไว้และพิมพ์สรุปสิ่งที่ยังถูกตรึงไว้

### `skill publish <path>`

- เปรียบเทียบ fingerprint ของบันเดิลในเครื่องกับ ClawHub และออกสำเร็จเมื่อ
  เนื้อหาถูกเผยแพร่แล้ว
- skills ใหม่ใช้ค่าเริ่มต้นเป็น `1.0.0`; skills ที่เปลี่ยนแปลงใช้ค่าเริ่มต้นเป็น patch
  version ถัดไป
- `--version <version>` เลือกเวอร์ชันอย่างชัดเจนและเผยแพร่แม้ว่า
  เนื้อหาจะตรงกับเวอร์ชันที่มีอยู่
- `--dry-run` resolve การเผยแพร่โดยไม่อัปโหลด; `--json` พิมพ์ผลลัพธ์ที่
  เครื่องอ่านได้
- `--owner <handle>` เผยแพร่ภายใต้ handle ของ org/user publisher เมื่อ
  actor มีสิทธิ์ publisher
- `--migrate-owner` ย้าย skill ที่มีอยู่ไปยัง `--owner` ขณะเผยแพร่
  เวอร์ชันใหม่ ต้องมีสิทธิ์ admin/owner บน publisher ทั้งสองฝั่ง
- พฤติกรรม owner และ review อธิบายไว้ใน `docs/publishing.md`
- การเผยแพร่ skill หมายความว่า skill นั้นถูกเผยแพร่ภายใต้ `MIT-0` บน ClawHub
- skills ที่เผยแพร่แล้วใช้งาน แก้ไข และแจกจ่ายต่อได้ฟรีโดยไม่ต้องให้ attribution
- ClawHub ไม่รองรับ skills แบบชำระเงินหรือการตั้งราคาต่อ skill
- alias เดิม: `publish <path>`

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

workflow ที่ใช้ซ้ำได้ของ ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
เรียก `skill publish` สำหรับ `skill_path` หนึ่งรายการ หรือสำหรับโฟลเดอร์ skill โดยตรงแต่ละโฟลเดอร์
ภายใต้ `root` (ค่าเริ่มต้น: `skills`) โดยข้าม skills ที่ไม่เปลี่ยนแปลงและใช้
พฤติกรรม patch-version อัตโนมัติแบบเดียวกัน

ตั้งค่า `dry_run: true` เพื่อดูตัวอย่างโดยไม่ต้องใช้โทเค็น การเผยแพร่จริงต้องใช้
secret `clawhub_token`

### `sync`

- สแกน workdir ปัจจุบัน ไดเรกทอรี skills ที่กำหนดค่าไว้ และโฟลเดอร์
  `--root <dir>` ใดๆ เพื่อหาโฟลเดอร์ skill ในเครื่องที่มี `SKILL.md` หรือ
  `skill.md`
- เปรียบเทียบ fingerprint ของ skill ในเครื่องแต่ละรายการกับ ClawHub และเผยแพร่เฉพาะ skills ใหม่หรือ
  ที่เปลี่ยนแปลง
- skills ใหม่เผยแพร่เป็น `1.0.0`; skills ที่เปลี่ยนแปลงเผยแพร่เป็น patch version ถัดไป
  ตามค่าเริ่มต้น ใช้ `--bump minor|major` สำหรับชุดอัปเดตที่ควรขยับด้วย
  semver step ที่ใหญ่กว่า
- `--dry-run` แสดงแผนการเผยแพร่โดยไม่อัปโหลด; `--json` พิมพ์แผนที่
  เครื่องอ่านได้
- `--all` เผยแพร่ทุก skill ใหม่หรือที่เปลี่ยนแปลงโดยไม่ถาม หากไม่มี
  `--all` เทอร์มินัลแบบโต้ตอบจะให้คุณเลือก skills ที่จะเผยแพร่
- `--owner <handle>` เผยแพร่ภายใต้ handle ของ org/user publisher เมื่อ
  actor มีสิทธิ์ publisher
- `sync` เป็นการเผยแพร่ทางเดียวเท่านั้น ไม่ติดตั้ง อัปเดต ดาวน์โหลด หรือ
  รายงาน telemetry การติดตั้ง/ดาวน์โหลด

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- ต้องใช้ `clawhub login`
- รัน ClawHub ClawScan ผ่าน `POST /api/v1/skills/-/scan` จากนั้น poll จนกว่าการสแกนจะอยู่ในสถานะสิ้นสุด
- การสแกนเป็นแบบ asynchronous และอาจใช้เวลาให้เสร็จสมบูรณ์ ระหว่างอยู่ในคิว spinner ของเทอร์มินัลจะแสดงตำแหน่งสแกนที่จัดลำดับความสำคัญปัจจุบันและจำนวนสแกนที่อยู่ข้างหน้า
- การสแกนที่เผยแพร่แล้วต้องมี ownership หรือสิทธิ์จัดการ publisher moderators/admins สามารถใช้ backend เดียวกันผ่าน `clawhub-admin`
- `--update` ใช้ได้เฉพาะกับ `--slug`; จะเขียนผลการสแกนที่เผยแพร่สำเร็จกลับไปยังเวอร์ชันที่เลือก
- `--output <file.zip>` ดาวน์โหลด archive รายงานฉบับเต็มที่มี `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`
- `--json` พิมพ์ poll response แบบเต็มสำหรับ automation
- ไม่รองรับการสแกนพาธในเครื่องอีกต่อไป อัปโหลดเวอร์ชันใหม่ จากนั้นใช้ `scan download` เพื่อดึงผลการสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งนั้น

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- ต้องใช้ `clawhub login`
- ดาวน์โหลด ZIP รายงานการสแกนที่จัดเก็บไว้สำหรับเวอร์ชัน skill หรือ Plugin ที่ส่ง รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อนโดยการตรวจสอบความปลอดภัยของ ClawHub
- การดาวน์โหลด skill ใช้ slug ของ skill และค่าเริ่มต้นเป็น `--kind skill`
- การดาวน์โหลด Plugin ใช้ชื่อแพ็กเกจและต้องใช้ `--kind plugin`
- ต้องระบุ `--version` เพื่อให้ผู้เขียนตรวจสอบเวอร์ชันที่ส่งจริงซึ่ง ClawHub บล็อก
- `--output <file.zip>` เลือกพาธปลายทาง

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub จัดส่ง workflow ที่ใช้ซ้ำได้อย่างเป็นทางการที่
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/a95f470a588ea9fe4c4b4c258c8c4ca5f02c2836/.github/workflows/skill-publish.yml)
สำหรับ repo ของ skill และ repo แค็ตตาล็อก

การตั้งค่าแค็ตตาล็อกทั่วไป:

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

- `root` มีค่าเริ่มต้นเป็น `skills` สำหรับ repo แค็ตตาล็อก
- ส่ง `skill_path: skills/review-helper` เพื่อประมวลผลโฟลเดอร์ skill หนึ่งโฟลเดอร์
- `owner` แมปกับแฟล็ก CLI `--owner`; ละไว้เพื่อเผยแพร่ในฐานะผู้ใช้ที่ผ่านการยืนยันตัวตน
- การเผยแพร่ skill V1 ใช้ `clawhub_token`; GitHub OIDC trusted publishing เป็นเฉพาะแพ็กเกจในตอนนี้

### `delete <skill>`

- หากไม่มี `--version` ให้ลบสกิลแบบกู้คืนได้ (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- เรียก `DELETE /api/v1/skills/{slug}`
- การลบแบบกู้คืนได้ที่เริ่มโดยเจ้าของจะสงวน slug ไว้ 30 วัน; คำสั่งจะแสดงเวลาหมดอายุ
- `--version <version>` จะลบเวอร์ชันที่เป็นเจ้าของซึ่งไม่ใช่เวอร์ชันล่าสุดอย่างถาวรผ่านเส้นทางเฉพาะเวอร์ชันแบบ fail-closed
  เวอร์ชันที่ถูกลบแล้วไม่สามารถกู้คืนหรือเผยแพร่ซ้ำได้ ให้เผยแพร่เวอร์ชันทดแทนก่อนลบ
  เวอร์ชันล่าสุดปัจจุบัน เจ้าหน้าที่แพลตฟอร์มไม่ข้ามข้อกำหนดความเป็นเจ้าของสำหรับโฟลว์เฉพาะเวอร์ชันนี้
- `--reason <text>` บันทึกหมายเหตุการดูแลในการลบสกิลทั้งรายการแบบกู้คืนได้และบันทึกการตรวจสอบ
- `--note <text>` เป็น alias ของ `--reason`
- `--yes` ข้ามการยืนยัน

### `undelete <skill>`

- กู้คืนสกิลที่ซ่อนอยู่ (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- ไม่มีการกู้คืนเวอร์ชัน; เวอร์ชันที่ถูกลบถาวรไม่สามารถกู้คืนได้
- เรียก `POST /api/v1/skills/{slug}/undelete`
- `--reason <text>` บันทึกหมายเหตุการดูแลในสกิลและบันทึกการตรวจสอบ
- `--note <text>` เป็น alias ของ `--reason`
- `--yes` ข้ามการยืนยัน

### `hide <skill>`

- ซ่อนสกิล (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- Alias ของ `delete`

### `unhide <skill>`

- ยกเลิกการซ่อนสกิล (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- Alias ของ `undelete`

### `skill rename <skill> <new-name>`

- เปลี่ยนชื่อสกิลที่เป็นเจ้าของและเก็บ slug เดิมไว้เป็น alias เปลี่ยนเส้นทาง
- เรียก `POST /api/v1/skills/{slug}/rename`
- `--yes` ข้ามการยืนยัน

### `skill merge <source> <target>`

- ผสานสกิลที่เป็นเจ้าของรายการหนึ่งเข้ากับสกิลที่เป็นเจ้าของอีกรายการหนึ่ง
- slug ต้นทางจะหยุดแสดงแบบสาธารณะและกลายเป็น alias เปลี่ยนเส้นทางไปยังเป้าหมาย
- เรียก `POST /api/v1/skills/{sourceSlug}/merge`
- `--yes` ข้ามการยืนยัน

### `transfer`

- เวิร์กโฟลว์การโอนความเป็นเจ้าของ
- การโอนไปยัง handle ผู้ใช้จะสร้างคำขอที่รอดำเนินการเพื่อให้ผู้รับยอมรับ
- การโอนไปยัง handle องค์กร/ผู้เผยแพร่จะมีผลทันทีเฉพาะเมื่อผู้ดำเนินการมี
  สิทธิ์เข้าถึงระดับผู้ดูแลระบบทั้งเจ้าของปัจจุบันและผู้เผยแพร่ปลายทาง
- คำสั่งย่อย:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- Endpoint:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- เรียกดูหรือค้นหาแค็ตตาล็อกแพ็กเกจรวมผ่าน `GET /api/v1/packages` และ `GET /api/v1/packages/search`
- ใช้รายการนี้สำหรับ Plugin และรายการตระกูลแพ็กเกจอื่นๆ; `search` ระดับบนสุดยังคงเป็นพื้นผิวค้นหาสกิล
- Flag:
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

- ดึงข้อมูลเมตาของแพ็กเกจโดยไม่ติดตั้ง
- ใช้รายการนี้สำหรับข้อมูลเมตา Plugin, ความเข้ากันได้, การตรวจสอบยืนยัน, แหล่งที่มา และการตรวจสอบเวอร์ชัน/ไฟล์
- `--version <version>`: ตรวจสอบเวอร์ชันเฉพาะ (ค่าเริ่มต้น: latest)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-100)
- `--files`: แสดงไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (เฉพาะไฟล์ข้อความ; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `package download <name>`

- แปลงเวอร์ชันแพ็กเกจผ่าน
  `GET /api/v1/packages/{name}/versions/{version}/artifact`
- ดาวน์โหลด artifact จาก `downloadUrl` ของ resolver
- ตรวจสอบ ClawHub SHA-256 สำหรับ artifact ทั้งหมด
- สำหรับ artifact ClawPack npm-pack จะตรวจสอบ npm `sha512` integrity,
  npm shasum และชื่อ/เวอร์ชัน `package.json` ของ tarball ด้วย
- เวอร์ชัน ZIP legacy ดาวน์โหลดผ่านเส้นทาง ZIP legacy
- Flag:
  - `--version <version>`: ดาวน์โหลดเวอร์ชันเฉพาะ
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

- คำนวณ ClawHub SHA-256, npm `sha512` integrity และ npm shasum สำหรับ
  artifact ภายในเครื่อง
- เมื่อใช้ `--package` จะแปลงข้อมูลเมตาที่คาดหวังจาก ClawHub และเปรียบเทียบ
  ไฟล์ภายในเครื่องกับข้อมูลเมตา artifact ที่เผยแพร่
- เมื่อใช้ flag digest โดยตรง จะตรวจสอบโดยไม่ค้นหาผ่านเครือข่าย
- Flag:
  - `--package <name>`: ชื่อแพ็กเกจเพื่อแปลงข้อมูลเมตา artifact ที่คาดหวัง
  - `--version <version>` หรือ `--tag <tag>`: เวอร์ชันแพ็กเกจที่คาดหวัง
  - `--sha256 <hex>`: ClawHub SHA-256 ที่คาดหวัง
  - `--npm-integrity <sri>`: npm integrity ที่คาดหวัง
  - `--npm-shasum <sha1>`: npm shasum ที่คาดหวัง
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- เรียกใช้ Plugin Inspector ที่มากับ ClawHub CLI กับโฟลเดอร์แพ็กเกจ Plugin
  ภายในเครื่อง
- ค่าเริ่มต้นคือการตรวจสอบแบบออฟไลน์/สแตติก โดยไม่ค้นหาหรือนำเข้า checkout
  OpenClaw ภายในเครื่อง
- ข้อผิดพลาดความเข้ากันได้ที่ร้ายแรงจะออกด้วยสถานะไม่เป็นศูนย์ ข้อค้นพบที่เป็นเพียงคำเตือนจะแสดงผลแต่
  ออกด้วยสถานะศูนย์
- Flag:
  - `--out <dir>`: เขียนรายงาน Plugin Inspector ไปยังไดเรกทอรีนี้
  - `--openclaw <path>`: ตรวจสอบเทียบกับ checkout OpenClaw ภายในเครื่องที่ระบุชัดเจน
  - `--runtime`: เปิดใช้การจับภาพ runtime; นำเข้าโค้ด Plugin
  - `--allow-execute`: อนุญาตการจับภาพ runtime ใน workspace ที่แยกไว้
  - `--no-mock-sdk`: ปิดใช้ OpenClaw SDK จำลองระหว่างการจับภาพ runtime
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package validate ./example-plugin
```

หากการตรวจสอบรายงานข้อค้นพบเกี่ยวกับแพ็กเกจ, manifest, การนำเข้า SDK หรือ artifact โปรดดู
[การแก้ไขการตรวจสอบ Plugin](/clawhub/plugin-validation-fixes) แล้วเรียกใช้คำสั่งอีกครั้ง

### `package delete <name>`

- หากไม่มี `--version` จะลบแพ็กเกจและ release ทั้งหมดแบบกู้คืนได้
- `--version <version>` จะลบ release ที่เป็นเจ้าของซึ่งไม่ใช่เวอร์ชันล่าสุดอย่างถาวรผ่านเส้นทางเฉพาะเวอร์ชันแบบ fail-closed
  เวอร์ชันที่ถูกลบแล้วไม่สามารถกู้คืนหรือเผยแพร่ซ้ำได้ ให้เผยแพร่เวอร์ชันทดแทนก่อนลบ
  เวอร์ชันล่าสุดปัจจุบัน โฟลว์เฉพาะเวอร์ชันนี้ต้องเป็นเจ้าของแพ็กเกจหรือผู้ดูแลระบบผู้เผยแพร่ขององค์กร; เจ้าหน้าที่แพลตฟอร์มไม่ข้ามข้อกำหนดความเป็นเจ้าของแพ็กเกจ
- การลบแพ็กเกจทั้งรายการแบบกู้คืนได้ต้องเป็นเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลระบบผู้เผยแพร่ขององค์กร, ผู้ดูแลแพลตฟอร์ม
  หรือผู้ดูแลระบบแพลตฟอร์ม
- Flag:
  - `--version <version>`: ลบเวอร์ชันที่ไม่ใช่ล่าสุดหนึ่งเวอร์ชันอย่างถาวร
  - `--yes`: ข้ามการยืนยัน
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- กู้คืนแพ็กเกจและ release ที่ถูกลบแบบกู้คืนได้
- ไม่มีการกู้คืนเวอร์ชัน; เวอร์ชันที่ถูกลบถาวรไม่สามารถกู้คืนได้
- ต้องเป็นเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลระบบผู้เผยแพร่ขององค์กร, ผู้ดูแลแพลตฟอร์ม
  หรือผู้ดูแลระบบแพลตฟอร์ม
- เรียก `POST /api/v1/packages/{name}/undelete`
- Flag:
  - `--yes`: ข้ามการยืนยัน
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- โอนแพ็กเกจไปยังผู้เผยแพร่อื่น
- ต้องมีสิทธิ์เข้าถึงระดับผู้ดูแลระบบทั้งเจ้าของแพ็กเกจปัจจุบันและผู้เผยแพร่
  ปลายทาง เว้นแต่จะดำเนินการโดยผู้ดูแลระบบแพลตฟอร์ม
- ชื่อแพ็กเกจแบบ scoped ต้องโอนไปยังเจ้าของ scope ที่ตรงกัน
- เรียก `POST /api/v1/packages/{name}/transfer`
- Flag:
  - `--to <owner>`: handle ผู้เผยแพร่ปลายทาง
  - `--reason <text>`: เหตุผลการตรวจสอบที่ระบุหรือไม่ก็ได้
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- คำสั่งที่ต้องยืนยันตัวตนสำหรับรายงานแพ็กเกจต่อผู้ดูแล
- เรียก `POST /api/v1/packages/{name}/report`
- รายงานอยู่ระดับแพ็กเกจ อาจผูกกับเวอร์ชันก็ได้ และจะมองเห็นได้
  สำหรับผู้ดูแลเพื่อตรวจสอบ
- รายงานจะไม่ซ่อนแพ็กเกจหรือบล็อกการดาวน์โหลดโดยอัตโนมัติด้วยตัวเอง
- Flag:
  - `--version <version>`: เวอร์ชันแพ็กเกจที่จะแนบกับรายงาน ระบุหรือไม่ก็ได้
  - `--reason <text>`: เหตุผลรายงานที่จำเป็น
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- คำสั่งสำหรับเจ้าของเพื่อตรวจสอบการมองเห็นด้านการดูแลของแพ็กเกจ
- เรียก `GET /api/v1/packages/{name}/moderation`
- แสดงสถานะการสแกนแพ็กเกจปัจจุบัน, จำนวนรายงานที่เปิดอยู่, สถานะการดูแลด้วยตนเองของ release ล่าสุด,
  สถานะการบล็อกการดาวน์โหลด และเหตุผลการดูแล
- Flag:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- ตรวจสอบว่าแพ็กเกจพร้อมสำหรับการใช้งาน OpenClaw ในอนาคตหรือไม่
- เรียก `GET /api/v1/packages/{name}/readiness`
- รายงานตัวบล็อกสำหรับสถานะทางการ, ความพร้อมใช้งาน ClawPack, digest ของ artifact,
  แหล่งที่มาของซอร์ส, ความเข้ากันได้กับ OpenClaw, เป้าหมายโฮสต์, ข้อมูลเมตาสภาพแวดล้อม
  และสถานะการสแกน
- Flag:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- แสดงสถานะการย้ายที่เน้นผู้ปฏิบัติงานสำหรับแพ็กเกจที่อาจแทนที่
  Plugin OpenClaw ที่ bundled มา
- เรียก endpoint ความพร้อมที่คำนวณเดียวกับ `package readiness` แต่แสดง
  สถานะที่เน้นการย้าย, เวอร์ชันล่าสุด, สถานะแพ็กเกจทางการ, การตรวจสอบ และ
  ตัวบล็อก
- Flag:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- สร้างผู้เผยแพร่องค์กรที่เป็นของผู้ใช้ที่ยืนยันตัวตน
- handle จะถูกทำให้เป็นตัวพิมพ์เล็กและอาจส่งผ่านโดยมีหรือไม่มี `@` ก็ได้
- ผู้เผยแพร่องค์กรที่สร้างใหม่จะไม่ถูกเชื่อถือ/เป็นทางการโดยค่าเริ่มต้น
- ล้มเหลวหาก handle ถูกใช้แล้วโดยผู้เผยแพร่ ผู้ใช้ หรือเส้นทางที่สงวนไว้ซึ่งมีอยู่

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- เผยแพร่ Plugin แบบโค้ดหรือ Plugin แบบบันเดิลผ่าน `POST /api/v1/packages`
- `<source>` ยอมรับ:
  - เส้นทางโฟลเดอร์ในเครื่อง: `./my-plugin`
  - ทาร์บอล ClawPack แบบ npm-pack ในเครื่อง: `./my-plugin-1.2.3.tgz`
  - รีโพ GitHub: `owner/repo` หรือ `owner/repo@ref`
  - URL ของ GitHub: `https://github.com/owner/repo`
- ระบบตรวจจับเมตาดาต้าอัตโนมัติจาก `package.json`, `openclaw.plugin.json` และ
  เครื่องหมายบันเดิล OpenClaw จริง เช่น `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` และ `.cursor-plugin/plugin.json`
- แหล่งที่มา `.tgz` จะถูกถือว่าเป็น ClawPack โดย CLI จะอัปโหลดไบต์ npm-pack
  ตามจริง และใช้เนื้อหา `package/` ที่แตกออกมาเฉพาะสำหรับการตรวจสอบและ
  เติมเมตาดาต้าล่วงหน้า
- โฟลเดอร์ Plugin แบบโค้ดจะถูกแพ็กเป็นทาร์บอล ClawPack npm ก่อนอัปโหลด เพื่อให้
  การติดตั้ง OpenClaw ตรวจสอบอาร์ติแฟกต์ที่แน่นอนได้ ส่วนโฟลเดอร์ Plugin แบบบันเดิลยังคง
  ใช้เส้นทางเผยแพร่แบบไฟล์ที่แตกออกมา
- สำหรับแหล่งที่มาจาก GitHub การระบุแหล่งที่มาจะถูกเติมอัตโนมัติจากรีโพ คอมมิตที่ resolve แล้ว ref และ subpath
- สำหรับโฟลเดอร์ในเครื่อง การระบุแหล่งที่มาจะถูกตรวจจับอัตโนมัติจาก git ในเครื่องเมื่อรีโมต origin ชี้ไปที่ GitHub
- Plugin แบบโค้ดภายนอกต้องประกาศ `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion` อย่างชัดเจน
  `package.json.version` ระดับบนสุดจะไม่ถูกใช้เป็น fallback สำหรับการตรวจสอบการเผยแพร่
- `--dry-run` แสดงตัวอย่าง payload การเผยแพร่ที่ resolve แล้วโดยไม่อัปโหลด
- `--json` ส่งออกผลลัพธ์ที่เครื่องอ่านได้สำหรับ CI
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่ของผู้ใช้หรือองค์กร เมื่อ actor มีสิทธิ์เข้าถึงผู้เผยแพร่
- ชื่อแพ็กเกจแบบ scoped ต้องตรงกับเจ้าของที่เลือก ดู `docs/publishing.md`
- แฟล็กที่มีอยู่ (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ยังคงใช้เป็น override ได้
- รีโพ GitHub ส่วนตัวต้องใช้ `GITHUB_TOKEN`

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### โฟลว์ในเครื่องที่แนะนำ

ใช้ `--dry-run` ก่อน เพื่อให้คุณยืนยันเมตาดาต้าแพ็กเกจที่ resolve แล้วและ
การระบุแหล่งที่มาก่อนสร้าง release จริงได้:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### โฟลว์โฟลเดอร์ในเครื่อง

สำหรับ Plugin แบบโค้ด การเผยแพร่จากโฟลเดอร์จะสร้างและอัปโหลดอาร์ติแฟกต์ ClawPack จาก
โฟลเดอร์แพ็กเกจ:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` ขั้นต่ำสำหรับ `--family code-plugin`

Plugin แบบโค้ดภายนอกต้องมีเมตาดาต้า OpenClaw จำนวนเล็กน้อยใน
`package.json` manifest ขั้นต่ำนี้เพียงพอสำหรับการเผยแพร่ที่สำเร็จ:

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

- `package.json.version` คือเวอร์ชัน release ของแพ็กเกจคุณ แต่จะไม่ถูกใช้เป็น
  fallback สำหรับการตรวจสอบความเข้ากันได้/บิลด์ของ OpenClaw
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมตาดาต้าเสริม
  ClawHub อาจแสดงข้อมูลเหล่านี้เมื่อมีอยู่ แต่ไม่จำเป็นสำหรับการเผยแพร่
- `openclaw.compat.minGatewayVersion` และ
  `openclaw.build.pluginSdkVersion` เป็นส่วนเสริมที่เลือกใช้ได้ หากคุณต้องการเผยแพร่
  เมตาดาต้าความเข้ากันได้ที่ละเอียดขึ้น
- หากคุณใช้ CLI `clawhub` release ที่เก่ากว่า ให้อัปเกรดก่อนเผยแพร่ เพื่อให้
  การตรวจสอบ preflight ในเครื่องทำงานก่อนอัปโหลด
- หากการตรวจสอบรายงานรหัสการแก้ไขปัญหา ดู
  [การแก้ไขการตรวจสอบ Plugin](/clawhub/plugin-validation-fixes)

#### GitHub Actions

ClawHub ยังจัดส่งเวิร์กโฟลว์ reusable อย่างเป็นทางการที่
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/a95f470a588ea9fe4c4b4c258c8c4ca5f02c2836/.github/workflows/package-publish.yml)
สำหรับรีโพ Plugin

การตั้งค่าผู้เรียกทั่วไป:

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

- เวิร์กโฟลว์ reusable ตั้งค่าเริ่มต้นของ `source` เป็นรีโพของผู้เรียก
- สำหรับ monorepo ให้ส่ง `source_path` เพื่อให้เวิร์กโฟลว์เผยแพร่โฟลเดอร์แพ็กเกจ
  Plugin เช่น `source_path: extensions/codex`
- ปักหมุดเวิร์กโฟลว์ reusable ไปยังแท็กเสถียรหรือ SHA คอมมิตเต็ม อย่ารันการเผยแพร่ release จาก `@main`
- `pull_request` ควรใช้ `dry_run: true` เพื่อให้ CI ไม่สร้างผลกระทบจริง
- การเผยแพร่จริงควรจำกัดไว้เฉพาะ event ที่เชื่อถือได้ เช่น `workflow_dispatch` หรือการ push แท็ก
- การเผยแพร่ที่เชื่อถือได้โดยไม่มี secret ใช้ได้เฉพาะบน `workflow_dispatch`; การ push แท็กยังต้องใช้ `clawhub_token`
- เก็บ `clawhub_token` ให้พร้อมใช้สำหรับการเผยแพร่ครั้งแรก แพ็กเกจที่ไม่น่าเชื่อถือ หรือการเผยแพร่แบบ break-glass
- เวิร์กโฟลว์อัปโหลดผลลัพธ์ JSON เป็นอาร์ติแฟกต์และเปิดเผยเป็น output ของเวิร์กโฟลว์

### `package trusted-publisher get <name>`

- แสดง config ผู้เผยแพร่ที่เชื่อถือได้ของ GitHub Actions สำหรับแพ็กเกจ
- ใช้คำสั่งนี้หลังตั้งค่า config เพื่อยืนยันรีโพ ชื่อไฟล์เวิร์กโฟลว์
  และ pin environment ที่เลือกใช้ได้
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
- หลังตั้งค่า config แล้ว การเผยแพร่จาก GitHub Actions ที่รองรับในอนาคตสามารถใช้
  OIDC/การเผยแพร่ที่เชื่อถือได้โดยไม่ต้องใช้ token ClawHub อายุยาว
- `--repository <repo>` ต้องเป็น `owner/repo`
- `--workflow-filename <file>` ต้องตรงกับชื่อไฟล์เวิร์กโฟลว์ใน
  `.github/workflows/`
- `--environment <name>` เป็นตัวเลือกเสริม เมื่อกำหนดค่าแล้ว environment ของ GitHub Actions
  ใน claim ของ OIDC ต้องตรงกันทุกตัวอักษร
- ClawHub ตรวจสอบรีโพ GitHub ที่กำหนดค่าเมื่อคำสั่งนี้ทำงาน
  รีโพสาธารณะสามารถตรวจสอบผ่านเมตาดาต้า GitHub สาธารณะได้ รีโพส่วนตัว
  ต้องให้ ClawHub มีสิทธิ์เข้าถึง GitHub สำหรับรีโพนั้น เช่น
  ผ่านการติดตั้ง GitHub App ของ ClawHub ในอนาคต หรือการผสานรวม GitHub
  อื่นที่ได้รับอนุญาต
- แฟล็ก:
  - `--repository <repo>`: รีโพ GitHub เช่น `openclaw/example-plugin`
  - `--workflow-filename <file>`: ชื่อไฟล์เวิร์กโฟลว์ เช่น `package-publish.yml`
  - `--environment <name>`: environment ของ GitHub Actions ที่ต้องตรงกันทุกตัวอักษรแบบเลือกใช้ได้
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
- ใช้คำสั่งนี้เป็น rollback หากต้องปิดใช้งานหรือสร้างใหม่สำหรับ pin ของเวิร์กโฟลว์ รีโพ หรือ environment
- การเผยแพร่จริงในอนาคตต้องใช้การเผยแพร่แบบยืนยันตัวตนปกติจนกว่าจะตั้งค่า config อีกครั้ง
- แฟล็ก:
  - `--json`: ผลลัพธ์ที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### เทเลเมทรีการติดตั้ง

- ส่งหลังจาก `clawhub install <slug>` เมื่อเข้าสู่ระบบแล้ว เว้นแต่
  จะตั้งค่า `CLAWHUB_DISABLE_TELEMETRY=1`
- การรายงานเป็นแบบพยายามให้ดีที่สุด คำสั่งติดตั้งจะไม่ล้มเหลวหาก
  เทเลเมทรีใช้งานไม่ได้
- รายละเอียด: `docs/telemetry.md`
