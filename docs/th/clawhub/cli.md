---
read_when:
    - การใช้ CLI ของ ClawHub
    - การดีบักการติดตั้ง การอัปเดต หรือการเผยแพร่
summary: 'ข้อมูลอ้างอิง CLI: คำสั่ง, แฟล็ก, การกำหนดค่า, และพฤติกรรมของไฟล์ล็อก'
x-i18n:
    generated_at: "2026-06-28T20:40:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a20b288bab0e81c9ba63e054adc35b66c9013da1e0b310401b3f931c2d0b2a1
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

แพ็กเกจ CLI: `clawhub`, ไบนารี: `clawhub`

ติดตั้งแบบ global ด้วย npm หรือ pnpm:

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

## แฟล็กส่วนกลาง

- `--workdir <dir>`: ไดเรกทอรีทำงาน (ค่าเริ่มต้น: cwd; ถ้ากำหนดไว้จะถอยไปใช้พื้นที่ทำงานของ Clawdbot)
- `--dir <dir>`: ไดเรกทอรีติดตั้งใต้ workdir (ค่าเริ่มต้น: `skills`)
- `--site <url>`: URL ฐานสำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `https://clawhub.ai`)
- `--registry <url>`: URL ฐานของ API (ค่าเริ่มต้น: ค้นพบโดยอัตโนมัติ มิฉะนั้นใช้ `https://clawhub.ai`)
- `--no-input`: ปิดใช้งานพรอมต์

ตัวแปรสภาพแวดล้อมที่เทียบเท่า:

- `CLAWHUB_SITE` (เดิม `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (เดิม `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (เดิม `CLAWDHUB_WORKDIR`)

### HTTP proxy

CLI เคารพตัวแปรสภาพแวดล้อม HTTP proxy มาตรฐานสำหรับระบบที่อยู่หลัง
พร็อกซีองค์กรหรือเครือข่ายที่ถูกจำกัด:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

เมื่อมีการตั้งค่าตัวแปรใด ๆ เหล่านี้ CLI จะส่งคำขอขาออกผ่าน
พร็อกซีที่ระบุ `HTTPS_PROXY` ใช้สำหรับคำขอ HTTPS, `HTTP_PROXY`
ใช้สำหรับ HTTP ปกติ `NO_PROXY` / `no_proxy` จะถูกเคารพเพื่อข้ามพร็อกซีสำหรับ
โฮสต์หรือโดเมนเฉพาะ

สิ่งนี้จำเป็นบนระบบที่บล็อกการเชื่อมต่อขาออกโดยตรง
(เช่น คอนเทนเนอร์ Docker, Hetzner VPS ที่มีอินเทอร์เน็ตผ่านพร็อกซีเท่านั้น, ไฟร์วอลล์องค์กร)

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
- ทางเลือกเดิม: หาก `clawhub/config.json` ยังไม่มีอยู่ แต่มี `clawdhub/config.json` อยู่ CLI จะใช้พาธเดิมซ้ำ
- แทนที่ค่า: `CLAWHUB_CONFIG_PATH` (เดิม `CLAWDHUB_CONFIG_PATH`)

## คำสั่ง

### `login` / `auth login`

- ค่าเริ่มต้น: เปิดเบราว์เซอร์ไปที่ `<site>/cli/auth` และดำเนินการให้เสร็จผ่าน callback แบบ loopback
- แบบไม่มีหน้าจอ: `clawhub login --token clh_...`
- แบบโต้ตอบระยะไกล/ไม่มีหน้าจอ: `clawhub login --device` พิมพ์รหัสและรอขณะที่คุณอนุญาตที่ `<site>/cli/device`

### `whoami`

- ตรวจสอบโทเค็นที่จัดเก็บไว้ผ่าน `/api/v1/whoami`

### `token`

- พิมพ์โทเค็น API ที่จัดเก็บไว้ไปยัง stdout
- มีประโยชน์สำหรับการ pipe โทเค็นเข้าสู่ระบบในเครื่องไปยังคำสั่งตั้งค่า secret ของ CI

### `star <skill>` / `unstar <skill>`

- เพิ่ม/ลบสกิลออกจากรายการไฮไลต์ของคุณ
- เรียก `POST /api/v1/stars/<slug>` และ `DELETE /api/v1/stars/<slug>`
- `--yes` ข้ามการยืนยัน

### `search <query...>`

- เรียก `/api/v1/search?q=...`
- เอาต์พุตมี slug ของสกิล, handle ของเจ้าของ, ชื่อที่แสดง และคะแนนความเกี่ยวข้อง
- การค้นหาจะให้น้ำหนักกับการจับคู่ token ของ slug/ชื่อแบบตรงตัวก่อนความนิยมจากยอดดาวน์โหลด token ของ slug แบบเดี่ยว เช่น `map` จะจับคู่กับ `personal-map` ได้แรงกว่าสตริงย่อยภายใน `amap`
- ความนิยมเป็นเพียง prior ขนาดเล็กในการจัดอันดับ ไม่ใช่การรับประกันตำแหน่งบนสุด
- หากสกิลควรปรากฏแต่ไม่ปรากฏ ให้รัน `clawhub inspect @owner/slug` ขณะเข้าสู่ระบบเพื่อตรวจสอบ diagnostics การกลั่นกรองที่เจ้าของมองเห็นก่อนเปลี่ยนชื่อ metadata

### `explore`

- แสดงรายการสกิลล่าสุดผ่าน `/api/v1/skills?limit=...&sort=createdAt` (เรียงตาม `createdAt` จากมากไปน้อย)
- แฟล็ก:
  - `--limit <n>` (1-200, ค่าเริ่มต้น: 25)
  - `--sort newest|updated|rating|downloads|trending` (ค่าเริ่มต้น: newest) alias การเรียงลำดับการติดตั้งแบบเดิมยังใช้งานได้เพื่อความเข้ากันได้
  - `--json` (เอาต์พุตที่เครื่องอ่านได้)
- เอาต์พุต: `<slug>  v<version>  <age>  <summary>` (summary ถูกตัดให้เหลือ 50 อักขระ)

### `inspect @owner/slug`

- ดึง metadata ของสกิลและไฟล์เวอร์ชันโดยไม่ติดตั้ง
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: ล่าสุด)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-200)
- `--files`: แสดงรายการไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (เฉพาะไฟล์ข้อความ; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `install @owner/slug`

- resolve เวอร์ชันล่าสุดสำหรับเจ้าของและสกิลที่ระบุ
- ดาวน์โหลด zip ผ่าน `/api/v1/download`
- แตกไฟล์ไปยัง `<workdir>/<dir>/<slug>`
- ปฏิเสธการเขียนทับสกิลที่ pin ไว้; ให้รัน `clawhub unpin <skill>` ก่อน
- เขียน:
  - `<workdir>/.clawhub/lock.json` (เดิม `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (เดิม `.clawdhub`)

### `uninstall <skill>`

- ลบ `<workdir>/<dir>/<slug>` และลบ entry ใน lockfile
- ส่ง telemetry แบบ best-effort ขณะเข้าสู่ระบบ เพื่อให้จำนวนการติดตั้งปัจจุบันสามารถ
  ถูกปิดใช้งานได้
- แบบโต้ตอบ: ขอการยืนยัน
- ไม่โต้ตอบ (`--no-input`): ต้องใช้ `--yes`

### `list`

- อ่าน `<workdir>/.clawhub/lock.json` (เดิม `.clawdhub`)
- แสดง `pinned` ถัดจากสกิลที่ถูกตรึงด้วย `clawhub pin` รวมถึงเหตุผลเสริมถ้ามี

### `pin <skill>`

- ทำเครื่องหมายสกิลที่ติดตั้งแล้วว่า pinned ใน lockfile
- `--reason <text>` บันทึกเหตุผลที่สกิลถูกตรึง
- สกิลที่ pinned จะถูกข้ามโดย `update --all` และถูกปฏิเสธโดย `update <skill>` โดยตรง
- สกิลที่ pinned ยังปฏิเสธ `install --force` เพื่อไม่ให้ bytes ในเครื่องถูกแทนที่โดยไม่ตั้งใจ

### `unpin <skill>`

- ลบ pin ใน lockfile ออกจากสกิลที่ติดตั้งแล้ว เพื่อให้การอัปเดตในอนาคตสามารถแก้ไขได้

### `update [@owner/slug]` / `update --all`

- คำนวณ fingerprint จากไฟล์ในเครื่อง
- หาก fingerprint ตรงกับเวอร์ชันที่รู้จัก: ไม่แสดงพรอมต์
- หาก fingerprint ไม่ตรง:
  - ปฏิเสธตามค่าเริ่มต้น
  - เขียนทับด้วย `--force` (หรือพรอมต์ หากเป็นแบบโต้ตอบ)
- สกิลที่ pinned จะไม่ถูกอัปเดตโดย `--force`
- `update <skill>` ล้มเหลวทันทีสำหรับสกิลที่ pinned และบอกให้คุณรัน `clawhub unpin <skill>` ก่อน
- `update --all` ข้าม slug ที่ pinned และพิมพ์สรุปว่าสิ่งใดยังคงถูกตรึงไว้

### `skill publish <path>`

- เปรียบเทียบ fingerprint ของ bundle ในเครื่องกับ ClawHub และออกสำเร็จเมื่อ
  เนื้อหาถูกเผยแพร่แล้ว
- สกิลใหม่มีค่าเริ่มต้นเป็น `1.0.0`; สกิลที่เปลี่ยนแปลงมีค่าเริ่มต้นเป็นเวอร์ชัน patch
  ถัดไป
- `--version <version>` เลือกเวอร์ชันอย่างชัดเจนและเผยแพร่แม้ว่า
  เนื้อหาจะตรงกับเวอร์ชันที่มีอยู่
- `--dry-run` resolve การเผยแพร่โดยไม่อัปโหลด; `--json` พิมพ์ผลลัพธ์
  ที่เครื่องอ่านได้
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่แบบองค์กร/ผู้ใช้ เมื่อ
  actor มีสิทธิ์เข้าถึงผู้เผยแพร่
- `--migrate-owner` ย้ายสกิลที่มีอยู่ไปยัง `--owner` ขณะเผยแพร่เวอร์ชันใหม่
  ต้องมีสิทธิ์ admin/owner บนผู้เผยแพร่ทั้งสองราย
- อธิบายพฤติกรรมเจ้าของและการรีวิวไว้ใน `docs/publishing.md`
- การเผยแพร่สกิลหมายความว่าสกิลถูกเผยแพร่ภายใต้ `MIT-0` บน ClawHub
- สกิลที่เผยแพร่แล้วใช้งาน แก้ไข และแจกจ่ายต่อได้ฟรีโดยไม่ต้องระบุที่มา
- ClawHub ไม่รองรับสกิลแบบชำระเงินหรือการตั้งราคาต่อสกิล
- alias เดิม: `publish <path>`

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

workflow ที่ใช้ซ้ำได้ของ ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
เรียก `skill publish` สำหรับ `skill_path` หนึ่งรายการ หรือสำหรับโฟลเดอร์สกิลโดยตรงแต่ละโฟลเดอร์
ใต้ `root` (ค่าเริ่มต้น: `skills`) โดยจะข้ามสกิลที่ไม่เปลี่ยนแปลงและใช้
พฤติกรรมเวอร์ชัน patch อัตโนมัติแบบเดียวกัน

ตั้งค่า `dry_run: true` เพื่อดูตัวอย่างโดยไม่มีโทเค็น การเผยแพร่จริงต้องใช้
secret `clawhub_token`

### `sync`

- สแกน workdir ปัจจุบัน, ไดเรกทอรีสกิลที่กำหนดค่าไว้ และโฟลเดอร์
  `--root <dir>` ใด ๆ เพื่อหาโฟลเดอร์สกิลในเครื่องที่มี `SKILL.md` หรือ
  `skill.md`
- เปรียบเทียบ fingerprint ของสกิลในเครื่องแต่ละรายการกับ ClawHub และเผยแพร่เฉพาะสกิลใหม่หรือ
  สกิลที่เปลี่ยนแปลง
- สกิลใหม่เผยแพร่เป็น `1.0.0`; สกิลที่เปลี่ยนแปลงเผยแพร่เป็นเวอร์ชัน patch ถัดไป
  ตามค่าเริ่มต้น ใช้ `--bump minor|major` สำหรับชุดอัปเดตที่ควรขยับด้วย
  ขั้น semver ที่ใหญ่กว่า
- `--dry-run` แสดงแผนการเผยแพร่โดยไม่อัปโหลด; `--json` พิมพ์แผน
  ที่เครื่องอ่านได้
- `--all` เผยแพร่ทุกสกิลใหม่หรือสกิลที่เปลี่ยนแปลงโดยไม่แสดงพรอมต์ หากไม่มี
  `--all` terminal แบบโต้ตอบจะให้คุณเลือกสกิลที่จะเผยแพร่
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่แบบองค์กร/ผู้ใช้ เมื่อ
  actor มีสิทธิ์เข้าถึงผู้เผยแพร่
- `sync` เป็นการเผยแพร่ทางเดียวเท่านั้น ไม่ติดตั้ง อัปเดต ดาวน์โหลด หรือ
  รายงาน telemetry การติดตั้ง/ดาวน์โหลด

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- ต้องใช้ `clawhub login`
- รัน ClawHub ClawScan ผ่าน `POST /api/v1/skills/-/scan` จากนั้น poll จนกว่าการสแกนจะสิ้นสุด
- การสแกนเป็นแบบอะซิงโครนัสและอาจใช้เวลาจึงจะเสร็จ ขณะอยู่ในคิว spinner ใน terminal จะแสดงตำแหน่งการสแกนที่ถูกจัดลำดับความสำคัญปัจจุบันและจำนวนการสแกนที่อยู่ข้างหน้า
- การสแกนที่เผยแพร่แล้วต้องมีสิทธิ์ความเป็นเจ้าของหรือสิทธิ์จัดการผู้เผยแพร่ moderator/admin สามารถใช้ backend เดียวกันผ่าน `clawhub-admin`
- `--update` ใช้ได้เฉพาะกับ `--slug`; จะเขียนผลลัพธ์การสแกนที่เผยแพร่สำเร็จกลับไปยังเวอร์ชันที่เลือก
- `--output <file.zip>` ดาวน์โหลด archive รายงานฉบับเต็มพร้อม `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`
- `--json` พิมพ์ poll response ฉบับเต็มสำหรับระบบอัตโนมัติ
- ไม่รองรับการสแกนพาธในเครื่องอีกต่อไป อัปโหลดเวอร์ชันใหม่ จากนั้นใช้ `scan download` เพื่อดึงผลลัพธ์การสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งนั้น

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- ต้องใช้ `clawhub login`
- ดาวน์โหลด ZIP รายงานการสแกนที่จัดเก็บไว้สำหรับเวอร์ชันสกิลหรือ Plugin ที่ส่ง รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อนโดยการตรวจสอบความปลอดภัยของ ClawHub
- การดาวน์โหลดสกิลใช้ slug ของสกิลและมีค่าเริ่มต้นเป็น `--kind skill`
- การดาวน์โหลด Plugin ใช้ชื่อแพ็กเกจและต้องใช้ `--kind plugin`
- ต้องระบุ `--version` เพื่อให้ผู้เขียนตรวจสอบเวอร์ชันที่ส่งอย่างแน่นอนซึ่ง ClawHub บล็อกไว้
- `--output <file.zip>` เลือกพาธปลายทาง

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub มี workflow ทางการที่ใช้ซ้ำได้ที่
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/f96ae4a54ec9b72177220d4db601ebc0ddf5a1fd/.github/workflows/skill-publish.yml)
สำหรับ repo สกิลและ repo catalog

การตั้งค่า catalog ทั่วไป:

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

- `root` มีค่าเริ่มต้นเป็น `skills` สำหรับ repo catalog
- ส่ง `skill_path: skills/review-helper` เพื่อประมวลผลโฟลเดอร์สกิลหนึ่งโฟลเดอร์
- `owner` map ไปยังแฟล็ก CLI `--owner`; ละไว้เพื่อเผยแพร่ในฐานะผู้ใช้ที่ผ่านการยืนยันตัวตน
- การเผยแพร่สกิล V1 ใช้ `clawhub_token`; trusted publishing ของ GitHub OIDC เป็นแบบ package-only ในตอนนี้

### `delete <skill>`

- หากไม่มี `--version` ให้ลบ skill แบบ soft-delete (เจ้าของ, ผู้ดูแล, หรือผู้ดูแลระบบ)
- เรียก `DELETE /api/v1/skills/{slug}`
- การ soft delete ที่เริ่มโดยเจ้าของจะจอง slug ไว้ 30 วัน; คำสั่งจะแสดงเวลาหมดอายุ
- `--version <version>` จะลบเวอร์ชันที่เป็นเจ้าของและไม่ใช่เวอร์ชันล่าสุดหนึ่งรายการอย่างถาวรผ่านเส้นทางเฉพาะเวอร์ชันแบบ fail-closed
  เวอร์ชันที่ถูกลบแล้วไม่สามารถกู้คืนหรือเผยแพร่ซ้ำได้ เผยแพร่รายการทดแทนก่อนลบ
  เวอร์ชันล่าสุดปัจจุบัน เจ้าหน้าที่แพลตฟอร์มจะไม่ข้ามความเป็นเจ้าของสำหรับโฟลว์เฉพาะเวอร์ชันนี้
- `--reason <text>` บันทึกหมายเหตุการกลั่นกรองในการ soft-delete ทั้ง skill และบันทึกการตรวจสอบ
- `--note <text>` เป็น alias ของ `--reason`
- `--yes` ข้ามการยืนยัน

### `undelete <skill>`

- กู้คืน skill ที่ถูกซ่อน (เจ้าของ, ผู้ดูแล, หรือผู้ดูแลระบบ)
- ไม่มีการ undelete เวอร์ชัน; เวอร์ชันที่ถูกลบอย่างถาวรไม่สามารถกู้คืนได้
- เรียก `POST /api/v1/skills/{slug}/undelete`
- `--reason <text>` บันทึกหมายเหตุการกลั่นกรองใน skill และบันทึกการตรวจสอบ
- `--note <text>` เป็น alias ของ `--reason`
- `--yes` ข้ามการยืนยัน

### `hide <skill>`

- ซ่อน skill (เจ้าของ, ผู้ดูแล, หรือผู้ดูแลระบบ)
- Alias ของ `delete`

### `unhide <skill>`

- ยกเลิกการซ่อน skill (เจ้าของ, ผู้ดูแล, หรือผู้ดูแลระบบ)
- Alias ของ `undelete`

### `skill rename <skill> <new-name>`

- เปลี่ยนชื่อ skill ที่เป็นเจ้าของและเก็บ slug เดิมไว้เป็น alias สำหรับเปลี่ยนเส้นทาง
- เรียก `POST /api/v1/skills/{slug}/rename`
- `--yes` ข้ามการยืนยัน

### `skill merge <source> <target>`

- รวม skill ที่เป็นเจ้าของหนึ่งรายการเข้ากับ skill ที่เป็นเจ้าของอีกรายการ
- slug ต้นทางจะหยุดแสดงแบบสาธารณะและกลายเป็น alias สำหรับเปลี่ยนเส้นทางไปยังเป้าหมาย
- เรียก `POST /api/v1/skills/{sourceSlug}/merge`
- `--yes` ข้ามการยืนยัน

### `transfer`

- เวิร์กโฟลว์การโอนความเป็นเจ้าของ
- การโอนไปยัง handle ผู้ใช้จะสร้างคำขอที่รอดำเนินการให้ผู้รับยอมรับ
- การโอนไปยัง handle ของ org/publisher จะมีผลทันทีเฉพาะเมื่อผู้ดำเนินการมี
  สิทธิ์ admin ทั้งกับเจ้าของปัจจุบันและ publisher ปลายทาง
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

- เรียกดูหรือค้นหาแค็ตตาล็อกแพ็กเกจแบบรวมผ่าน `GET /api/v1/packages` และ `GET /api/v1/packages/search`
- ใช้สิ่งนี้สำหรับ plugins และรายการตระกูลแพ็กเกจอื่น ๆ; `search` ระดับบนสุดยังคงเป็นพื้นผิวค้นหา skill
- Flags:
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
- ใช้สิ่งนี้สำหรับข้อมูลเมตาของ plugin, ความเข้ากันได้, การตรวจสอบยืนยัน, แหล่งที่มา, และการตรวจสอบเวอร์ชัน/ไฟล์
- `--version <version>`: ตรวจสอบเวอร์ชันเฉพาะ (ค่าเริ่มต้น: latest)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติด tag (เช่น `latest`)
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
- สำหรับ artifact แบบ ClawPack npm-pack จะตรวจสอบ npm `sha512` integrity,
  npm shasum, และชื่อ/เวอร์ชันใน `package.json` ของ tarball ด้วย
- เวอร์ชัน ZIP แบบ legacy ดาวน์โหลดผ่านเส้นทาง ZIP แบบ legacy
- Flags:
  - `--version <version>`: ดาวน์โหลดเวอร์ชันเฉพาะ
  - `--tag <tag>`: ดาวน์โหลดเวอร์ชันที่ติด tag (ค่าเริ่มต้น: `latest`)
  - `-o, --output <path>`: ไฟล์หรือไดเรกทอรีเอาต์พุต
  - `--force`: เขียนทับไฟล์เอาต์พุตที่มีอยู่
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- คำนวณ ClawHub SHA-256, npm `sha512` integrity, และ npm shasum สำหรับ
  artifact ในเครื่อง
- เมื่อใช้ `--package` จะแปลงข้อมูลเมตาที่คาดไว้จาก ClawHub และเปรียบเทียบ
  ไฟล์ในเครื่องกับข้อมูลเมตาของ artifact ที่เผยแพร่
- เมื่อใช้ flag digest โดยตรง จะตรวจสอบยืนยันโดยไม่ค้นหาผ่านเครือข่าย
- Flags:
  - `--package <name>`: ชื่อแพ็กเกจเพื่อแปลงข้อมูลเมตาของ artifact ที่คาดไว้
  - `--version <version>` หรือ `--tag <tag>`: เวอร์ชันแพ็กเกจที่คาดไว้
  - `--sha256 <hex>`: ClawHub SHA-256 ที่คาดไว้
  - `--npm-integrity <sri>`: npm integrity ที่คาดไว้
  - `--npm-shasum <sha1>`: npm shasum ที่คาดไว้
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- รัน Plugin Inspector ที่ bundled มากับ ClawHub CLI กับโฟลเดอร์แพ็กเกจ plugin
  ในเครื่อง
- ค่าเริ่มต้นเป็นการตรวจสอบแบบออฟไลน์/สแตติก โดยไม่ค้นหาหรือนำเข้า checkout
  OpenClaw ในเครื่อง
- ข้อผิดพลาดความเข้ากันได้แบบ hard จะ exit ด้วยรหัสไม่เป็นศูนย์ ผลลัพธ์ที่เป็นคำเตือนเท่านั้นจะถูกพิมพ์แต่
  exit เป็นศูนย์
- Flags:
  - `--out <dir>`: เขียนรายงาน Plugin Inspector ไปยังไดเรกทอรีนี้
  - `--openclaw <path>`: ตรวจสอบเทียบกับ checkout OpenClaw ในเครื่องอย่างชัดเจน
  - `--runtime`: เปิดใช้การจับข้อมูล runtime; นำเข้าโค้ด plugin
  - `--allow-execute`: อนุญาตการจับข้อมูล runtime ใน workspace ที่แยกไว้
  - `--no-mock-sdk`: ปิดใช้ OpenClaw SDK แบบ mock ระหว่างการจับข้อมูล runtime
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package validate ./example-plugin
```

หากการตรวจสอบรายงานปัญหาเกี่ยวกับแพ็กเกจ, manifest, การนำเข้า SDK, หรือ artifact โปรดดู
[การแก้ไขการตรวจสอบ Plugin](/th/clawhub/plugin-validation-fixes) แล้วรันคำสั่งอีกครั้ง

### `package delete <name>`

- หากไม่มี `--version` จะ soft-delete แพ็กเกจและ release ทั้งหมด
- `--version <version>` จะลบ release ที่เป็นเจ้าของและไม่ใช่เวอร์ชันล่าสุดหนึ่งรายการอย่างถาวรผ่านเส้นทางเฉพาะเวอร์ชันแบบ fail-closed
  เวอร์ชันที่ถูกลบแล้วไม่สามารถกู้คืนหรือเผยแพร่ซ้ำได้ เผยแพร่รายการทดแทนก่อนลบ
  เวอร์ชันล่าสุดปัจจุบัน โฟลว์เฉพาะเวอร์ชันนี้ต้องใช้เจ้าของแพ็กเกจหรือ admin ของ org publisher; เจ้าหน้าที่แพลตฟอร์มจะไม่ข้ามความเป็นเจ้าของแพ็กเกจ
- การ soft-delete ทั้งแพ็กเกจต้องใช้เจ้าของแพ็กเกจ, owner/admin ของ org publisher, ผู้ดูแลแพลตฟอร์ม,
  หรือผู้ดูแลระบบแพลตฟอร์ม
- Flags:
  - `--version <version>`: ลบเวอร์ชันที่ไม่ใช่ล่าสุดหนึ่งรายการอย่างถาวร
  - `--yes`: ข้ามการยืนยัน
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- กู้คืนแพ็กเกจและ release ที่ถูก soft-delete
- ไม่มีการ undelete เวอร์ชัน; เวอร์ชันที่ถูกลบอย่างถาวรไม่สามารถกู้คืนได้
- ต้องใช้เจ้าของแพ็กเกจ, owner/admin ของ org publisher, ผู้ดูแลแพลตฟอร์ม,
  หรือผู้ดูแลระบบแพลตฟอร์ม
- เรียก `POST /api/v1/packages/{name}/undelete`
- Flags:
  - `--yes`: ข้ามการยืนยัน
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- โอนแพ็กเกจไปยัง publisher อื่น
- ต้องมีสิทธิ์ admin ทั้งกับเจ้าของแพ็กเกจปัจจุบันและ publisher ปลายทาง
  เว้นแต่ดำเนินการโดยผู้ดูแลระบบแพลตฟอร์ม
- ชื่อแพ็กเกจแบบ scoped ต้องโอนไปยังเจ้าของ scope ที่ตรงกัน
- เรียก `POST /api/v1/packages/{name}/transfer`
- Flags:
  - `--to <owner>`: handle ของ publisher ปลายทาง
  - `--reason <text>`: เหตุผลการตรวจสอบที่ไม่บังคับ
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- คำสั่งที่ผ่านการยืนยันตัวตนสำหรับรายงานแพ็กเกจต่อผู้ดูแล
- เรียก `POST /api/v1/packages/{name}/report`
- รายงานอยู่ในระดับแพ็กเกจ, อาจผูกกับเวอร์ชันก็ได้, และจะมองเห็นได้
  ต่อผู้ดูแลเพื่อรีวิว
- รายงานไม่ได้ซ่อนแพ็กเกจหรือบล็อกการดาวน์โหลดโดยอัตโนมัติด้วยตัวเอง
- Flags:
  - `--version <version>`: เวอร์ชันแพ็กเกจที่ไม่บังคับสำหรับแนบกับรายงาน
  - `--reason <text>`: เหตุผลของรายงานที่จำเป็น
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- คำสั่งของเจ้าของสำหรับตรวจสอบการมองเห็นด้านการกลั่นกรองของแพ็กเกจ
- เรียก `GET /api/v1/packages/{name}/moderation`
- แสดงสถานะการสแกนแพ็กเกจปัจจุบัน, จำนวนรายงานที่เปิดอยู่, สถานะการกลั่นกรองแบบ manual ของ release ล่าสุด,
  สถานะการบล็อกดาวน์โหลด, และเหตุผลการกลั่นกรอง
- Flags:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- ตรวจสอบว่าแพ็กเกจพร้อมสำหรับการใช้งานโดย OpenClaw ในอนาคตหรือไม่
- เรียก `GET /api/v1/packages/{name}/readiness`
- รายงานตัวบล็อกสำหรับสถานะ official, ความพร้อมใช้งาน ClawPack, digest ของ artifact,
  provenance ของแหล่งที่มา, ความเข้ากันได้กับ OpenClaw, target ของ host, ข้อมูลเมตาสภาพแวดล้อม,
  และสถานะการสแกน
- Flags:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- แสดงสถานะการย้ายข้อมูลแบบมุ่งเน้นผู้ปฏิบัติการสำหรับแพ็กเกจที่อาจแทนที่
  OpenClaw plugin ที่ bundled อยู่
- เรียก endpoint readiness ที่คำนวณแล้วเดียวกับ `package readiness` แต่พิมพ์
  สถานะที่มุ่งเน้นการย้ายข้อมูล, เวอร์ชันล่าสุด, สถานะแพ็กเกจ official, checks, และ
  blockers
- Flags:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- สร้าง org publisher ที่ผู้ใช้ที่ผ่านการยืนยันตัวตนเป็นเจ้าของ
- handle จะถูก normalize เป็นตัวพิมพ์เล็ก และอาจส่งโดยมีหรือไม่มี `@` ก็ได้
- org publisher ที่สร้างใหม่จะไม่ถูก trust/official โดยค่าเริ่มต้น
- ล้มเหลวหาก handle ถูกใช้แล้วโดย publisher, ผู้ใช้, หรือ reserved route ที่มีอยู่

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- เผยแพร่ Plugin แบบโค้ดหรือ Plugin แบบบันเดิลผ่าน `POST /api/v1/packages`.
- `<source>` รองรับ:
  - พาธโฟลเดอร์ในเครื่อง: `./my-plugin`
  - ทาร์บอล npm-pack ของ ClawPack ในเครื่อง: `./my-plugin-1.2.3.tgz`
  - รีโป GitHub: `owner/repo` หรือ `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- ระบบตรวจจับเมตาดาตาอัตโนมัติจาก `package.json`, `openclaw.plugin.json` และ
  มาร์กเกอร์บันเดิล OpenClaw จริง เช่น `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` และ `.cursor-plugin/plugin.json`.
- ซอร์ส `.tgz` จะถูกถือเป็น ClawPack โดย CLI จะอัปโหลดไบต์ npm-pack
  ตรงตามต้นฉบับ และใช้เนื้อหา `package/` ที่แตกออกมาเฉพาะสำหรับการตรวจสอบและ
  เติมเมตาดาตาล่วงหน้าเท่านั้น.
- โฟลเดอร์ Plugin แบบโค้ดจะถูกแพ็กเป็นทาร์บอล npm ของ ClawPack ก่อนอัปโหลด เพื่อให้
  การติดตั้ง OpenClaw ตรวจสอบอาร์ติแฟกต์ที่ตรงกันได้ ส่วนโฟลเดอร์ Plugin แบบบันเดิลยังคง
  ใช้เส้นทางเผยแพร่แบบไฟล์ที่แตกออกมา.
- สำหรับซอร์ส GitHub ระบบจะเติมการอ้างที่มาของซอร์สโดยอัตโนมัติจากรีโป, commit ที่ resolve แล้ว, ref และ subpath.
- สำหรับโฟลเดอร์ในเครื่อง ระบบจะตรวจจับการอ้างที่มาของซอร์สโดยอัตโนมัติจาก git ในเครื่อง เมื่อ origin remote ชี้ไปที่ GitHub.
- Plugin แบบโค้ดภายนอกต้องประกาศ `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion` อย่างชัดเจน.
  `package.json.version` ระดับบนสุดจะไม่ถูกใช้เป็น fallback สำหรับการตรวจสอบการเผยแพร่.
- `--dry-run` แสดงตัวอย่าง payload การเผยแพร่ที่ resolve แล้วโดยไม่อัปโหลด.
- `--json` ส่งออกผลลัพธ์ที่เครื่องอ่านได้สำหรับ CI.
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่ของผู้ใช้หรือองค์กร เมื่อ actor มีสิทธิ์เข้าถึงผู้เผยแพร่.
- ชื่อแพ็กเกจแบบ scoped ต้องตรงกับ owner ที่เลือก ดู `docs/publishing.md`.
- แฟล็กเดิม (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ยังใช้เป็น override ได้.
- รีโป GitHub ส่วนตัวต้องใช้ `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### โฟลว์ในเครื่องที่แนะนำ

ใช้ `--dry-run` ก่อน เพื่อให้คุณยืนยันเมตาดาตาแพ็กเกจที่ resolve แล้วและ
การอ้างที่มาของซอร์สก่อนสร้าง release จริง:

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

Plugin แบบโค้ดภายนอกต้องมีเมตาดาตา OpenClaw จำนวนเล็กน้อยใน
`package.json` manifest ขั้นต่ำนี้เพียงพอสำหรับการเผยแพร่สำเร็จ:

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
  fallback สำหรับการตรวจสอบความเข้ากันได้/บิลด์ของ OpenClaw.
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมตาดาตาไม่บังคับ.
  ClawHub อาจแสดงข้อมูลเหล่านี้เมื่อมีอยู่ แต่ไม่จำเป็นสำหรับการเผยแพร่.
- `openclaw.compat.minGatewayVersion` และ
  `openclaw.build.pluginSdkVersion` เป็นส่วนเสริมไม่บังคับ หากคุณต้องการเผยแพร่
  เมตาดาตาความเข้ากันได้ที่ละเอียดขึ้น.
- หากคุณใช้ CLI `clawhub` release เก่า ให้อัปเกรดก่อนเผยแพร่ เพื่อให้
  การตรวจสอบ preflight ในเครื่องทำงานก่อนอัปโหลด.
- หากการตรวจสอบรายงาน remediation code ให้ดู
  [การแก้ไขการตรวจสอบ Plugin](/th/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub ยังมาพร้อม workflow แบบใช้ซ้ำอย่างเป็นทางการที่
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/f96ae4a54ec9b72177220d4db601ebc0ddf5a1fd/.github/workflows/package-publish.yml)
สำหรับรีโป Plugin.

การตั้งค่า caller ทั่วไป:

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

- workflow แบบใช้ซ้ำตั้งค่าเริ่มต้นของ `source` เป็นรีโป caller.
- สำหรับ monorepo ให้ส่ง `source_path` เพื่อให้ workflow เผยแพร่โฟลเดอร์
  แพ็กเกจ Plugin เช่น `source_path: extensions/codex`.
- ปัก workflow แบบใช้ซ้ำไว้กับแท็กที่เสถียรหรือ SHA commit แบบเต็ม อย่ารันการเผยแพร่ release จาก `@main`.
- `pull_request` ควรใช้ `dry_run: true` เพื่อให้ CI ไม่สร้างผลข้างเคียง.
- การเผยแพร่จริงควรจำกัดไว้เฉพาะ event ที่เชื่อถือได้ เช่น `workflow_dispatch` หรือการ push tag.
- การเผยแพร่แบบ trusted โดยไม่มี secret ใช้ได้เฉพาะบน `workflow_dispatch`; การ push tag ยังต้องใช้ `clawhub_token`.
- เก็บ `clawhub_token` ให้พร้อมสำหรับการเผยแพร่ครั้งแรก, แพ็กเกจที่ไม่น่าเชื่อถือ หรือการเผยแพร่ฉุกเฉิน.
- workflow อัปโหลดผลลัพธ์ JSON เป็นอาร์ติแฟกต์และเปิดเผยเป็น workflow outputs.

### `package trusted-publisher get <name>`

- แสดงค่าคอนฟิก trusted publisher ของ GitHub Actions สำหรับแพ็กเกจ.
- ใช้คำสั่งนี้หลังตั้งค่าคอนฟิก เพื่อยืนยัน repository, ชื่อไฟล์ workflow
  และ environment pin ที่ไม่บังคับ.
- แฟล็ก:
  - `--json`: ผลลัพธ์ที่เครื่องอ่านได้.

ตัวอย่าง:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- ผูกหรือแทนที่ค่าคอนฟิก trusted publisher ของ GitHub Actions สำหรับแพ็กเกจ
  ที่มีอยู่.
- ต้องสร้างแพ็กเกจก่อนผ่าน `clawhub package publish` แบบแมนนวลปกติหรือแบบ
  token-authenticated.
- หลังตั้งค่าคอนฟิกแล้ว การเผยแพร่ GitHub Actions ที่รองรับในอนาคตสามารถใช้
  OIDC/trusted publishing ได้โดยไม่ต้องใช้ token ClawHub อายุยาว.
- `--repository <repo>` ต้องเป็น `owner/repo`.
- `--workflow-filename <file>` ต้องตรงกับชื่อไฟล์ workflow ใน
  `.github/workflows/`.
- `--environment <name>` เป็นค่าไม่บังคับ เมื่อกำหนดค่าแล้ว environment ของ GitHub Actions
  ใน OIDC claim ต้องตรงกันทุกตัวอักษร.
- ClawHub ตรวจสอบ repository GitHub ที่กำหนดค่าไว้เมื่อคำสั่งนี้ทำงาน.
  repository สาธารณะสามารถตรวจสอบผ่านเมตาดาตา GitHub สาธารณะได้ ส่วน
  repository ส่วนตัวต้องให้ ClawHub มีสิทธิ์เข้าถึง GitHub สำหรับ repository นั้น
  เช่น ผ่านการติดตั้ง ClawHub GitHub App ในอนาคต หรือ integration GitHub
  อื่นที่ได้รับอนุญาต.
- แฟล็ก:
  - `--repository <repo>`: repository GitHub เช่น `openclaw/example-plugin`.
  - `--workflow-filename <file>`: ชื่อไฟล์ workflow เช่น `package-publish.yml`.
  - `--environment <name>`: environment ของ GitHub Actions ที่ต้องตรงกันทุกตัวอักษรแบบไม่บังคับ.
  - `--json`: ผลลัพธ์ที่เครื่องอ่านได้.

ตัวอย่าง:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- ลบค่าคอนฟิก trusted publisher ออกจากแพ็กเกจ.
- ใช้เป็น rollback หากต้องปิดใช้งานหรือสร้าง workflow, repository หรือ environment pin ใหม่.
- การเผยแพร่จริงในอนาคตต้องใช้การเผยแพร่แบบ authenticated ปกติจนกว่าจะ
  ตั้งค่าคอนฟิกอีกครั้ง.
- แฟล็ก:
  - `--json`: ผลลัพธ์ที่เครื่องอ่านได้.

ตัวอย่าง:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### telemetry การติดตั้ง

- ส่งหลังจาก `clawhub install <slug>` เมื่อเข้าสู่ระบบแล้ว เว้นแต่
  ตั้งค่า `CLAWHUB_DISABLE_TELEMETRY=1`.
- การรายงานเป็นแบบ best-effort คำสั่งติดตั้งจะไม่ล้มเหลวหาก telemetry
  ไม่พร้อมใช้งาน.
- รายละเอียด: `docs/telemetry.md`.
