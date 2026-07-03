---
read_when:
    - การใช้ ClawHub CLI
    - การดีบักการติดตั้ง การอัปเดต หรือการเผยแพร่
summary: 'ข้อมูลอ้างอิง CLI: คำสั่ง แฟล็ก การกำหนดค่า และพฤติกรรมของไฟล์ล็อก'
x-i18n:
    generated_at: "2026-07-03T17:46:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23065775d74e7b52ed250051b8724b780c28dfdfc0adf9b8f115f7133fbdd77b
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

แพ็กเกจ CLI: `clawhub`, bin: `clawhub`.

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

## แฟล็ก global

- `--workdir <dir>`: ไดเรกทอรีทำงาน (ค่าเริ่มต้น: cwd; ย้อนกลับไปใช้ workspace ของ Clawdbot หากกำหนดค่าไว้)
- `--dir <dir>`: ไดเรกทอรีติดตั้งภายใต้ workdir (ค่าเริ่มต้น: `skills`)
- `--site <url>`: URL หลักสำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `https://clawhub.ai`)
- `--registry <url>`: URL หลักของ API (ค่าเริ่มต้น: ค้นพบอัตโนมัติ มิฉะนั้นใช้ `https://clawhub.ai`)
- `--no-input`: ปิดใช้งานพรอมป์

ตัวแปรสภาพแวดล้อมที่เทียบเท่า:

- `CLAWHUB_SITE` (เดิม `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (เดิม `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (เดิม `CLAWDHUB_WORKDIR`)

### พร็อกซี HTTP

CLI เคารพตัวแปรสภาพแวดล้อมพร็อกซี HTTP มาตรฐานสำหรับระบบที่อยู่หลัง
พร็อกซีองค์กรหรือเครือข่ายที่ถูกจำกัด:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

เมื่อตั้งค่าตัวแปรใดๆ เหล่านี้ CLI จะส่งคำขอขาออกผ่าน
พร็อกซีที่ระบุ `HTTPS_PROXY` ใช้สำหรับคำขอ HTTPS, `HTTP_PROXY`
ใช้สำหรับ HTTP ปกติ และเคารพ `NO_PROXY` / `no_proxy` เพื่อข้ามพร็อกซีสำหรับ
โฮสต์หรือโดเมนที่ระบุ

สิ่งนี้จำเป็นบนระบบที่บล็อกการเชื่อมต่อขาออกโดยตรง
(เช่น คอนเทนเนอร์ Docker, Hetzner VPS ที่ใช้อินเทอร์เน็ตผ่านพร็อกซีเท่านั้น, ไฟร์วอลล์องค์กร)

ตัวอย่าง:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

เมื่อไม่ได้ตั้งค่าตัวแปรพร็อกซี พฤติกรรมจะไม่เปลี่ยนแปลง (เชื่อมต่อโดยตรง)

## ไฟล์กำหนดค่า

จัดเก็บโทเค็น API ของคุณ + URL registry ที่แคชไว้

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` หรือ `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- ทางเลือกย้อนหลังแบบเดิม: หาก `clawhub/config.json` ยังไม่มีอยู่ แต่ `clawdhub/config.json` มีอยู่ CLI จะนำพาธเดิมกลับมาใช้
- แทนที่ค่า: `CLAWHUB_CONFIG_PATH` (เดิม `CLAWDHUB_CONFIG_PATH`)

## คำสั่ง

### `login` / `auth login`

- ค่าเริ่มต้น: เปิดเบราว์เซอร์ไปที่ `<site>/cli/auth` และทำให้เสร็จผ่าน callback ของ local loopback
- แบบ headless: `clawhub login --token clh_...`
- แบบ remote/headless interactive: `clawhub login --device` พิมพ์โค้ดและรอขณะที่คุณอนุญาตที่ `<site>/cli/device`

### `whoami`

- ตรวจสอบโทเค็นที่จัดเก็บไว้ผ่าน `/api/v1/whoami`

### `token`

- พิมพ์โทเค็น API ที่จัดเก็บไว้ไปยัง stdout
- มีประโยชน์สำหรับส่งโทเค็นเข้าสู่ระบบในเครื่องเข้าไปยังคำสั่งตั้งค่า secret ของ CI ผ่าน pipe

### `star <skill>` / `unstar <skill>`

- เพิ่ม/ลบสกิลจากรายการที่คุณไฮไลต์ไว้
- เรียก `POST /api/v1/stars/<slug>` และ `DELETE /api/v1/stars/<slug>`
- `--yes` ข้ามการยืนยัน

### `search <query...>`

- เรียก `/api/v1/search?q=...`
- เอาต์พุตประกอบด้วย slug ของสกิล, handle เจ้าของ, ชื่อที่แสดง และคะแนนความเกี่ยวข้อง
- การค้นหาให้ความสำคัญกับการตรงกันของโทเค็น slug/name แบบตรงตัวก่อนความนิยมจากการดาวน์โหลด โทเค็น slug เดี่ยว เช่น `map` จะตรงกับ `personal-map` ได้แรงกว่าข้อความย่อยภายใน `amap`
- ความนิยมเป็นเพียงตัวตั้งต้นเล็กน้อยในการจัดอันดับ ไม่ใช่การรับประกันว่าจะได้ตำแหน่งบนสุด
- หากสกิลควรปรากฏแต่ไม่ปรากฏ ให้เรียก `clawhub inspect @owner/slug` ขณะเข้าสู่ระบบ เพื่อตรวจดู diagnostics การกลั่นกรองที่เจ้าของมองเห็น ก่อนเปลี่ยนชื่อ metadata

### `explore`

- แสดงรายการสกิลใหม่ล่าสุดผ่าน `/api/v1/skills?limit=...&sort=createdAt` (เรียงตาม `createdAt` จากมากไปน้อย)
- แฟล็ก:
  - `--limit <n>` (1-200, ค่าเริ่มต้น: 25)
  - `--sort newest|updated|rating|downloads|trending` (ค่าเริ่มต้น: newest) alias การเรียงลำดับ install แบบเดิมยังใช้งานได้เพื่อความเข้ากันได้
  - `--json` (เอาต์พุตที่เครื่องอ่านได้)
- เอาต์พุต: `<slug>  v<version>  <age>  <summary>` (summary ถูกตัดเหลือ 50 อักขระ)

### `inspect @owner/slug`

- ดึง metadata ของสกิลและไฟล์เวอร์ชันโดยไม่ติดตั้ง
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: latest)
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
- ปฏิเสธการเขียนทับสกิลที่ pin ไว้; เรียก `clawhub unpin <skill>` ก่อน
- เขียน:
  - `<workdir>/.clawhub/lock.json` (เดิม `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (เดิม `.clawdhub`)

### `uninstall <skill>`

- ลบ `<workdir>/<dir>/<slug>` และลบรายการใน lockfile
- ส่ง telemetry แบบ best-effort ขณะเข้าสู่ระบบ เพื่อให้จำนวน install ปัจจุบันสามารถ
  ถูกปิดใช้งานได้
- แบบ interactive: ถามเพื่อยืนยัน
- แบบ non-interactive (`--no-input`): ต้องใช้ `--yes`

### `list`

- อ่าน `<workdir>/.clawhub/lock.json` (เดิม `.clawdhub`)
- แสดง `pinned` ถัดจากสกิลที่ถูกตรึงด้วย `clawhub pin` รวมถึงเหตุผลที่เลือกได้

### `pin <skill>`

- ทำเครื่องหมายสกิลที่ติดตั้งแล้วว่า pinned ใน lockfile
- `--reason <text>` บันทึกเหตุผลที่สกิลถูกแช่ไว้
- สกิลที่ pinned จะถูกข้ามโดย `update --all` และถูกปฏิเสธโดย `update <skill>` โดยตรง
- สกิลที่ pinned ยังปฏิเสธ `install --force` ด้วย เพื่อไม่ให้ bytes ในเครื่องถูกแทนที่โดยไม่ตั้งใจ

### `unpin <skill>`

- ลบ pin ใน lockfile ออกจากสกิลที่ติดตั้งแล้ว เพื่อให้การอัปเดตในอนาคตแก้ไขได้

### `update [@owner/slug]` / `update --all`

- คำนวณ fingerprint จากไฟล์ในเครื่อง
- หาก fingerprint ตรงกับเวอร์ชันที่รู้จัก: ไม่มีพรอมป์
- หาก fingerprint ไม่ตรง:
  - ปฏิเสธโดยค่าเริ่มต้น
  - เขียนทับด้วย `--force` (หรือพรอมป์ หากเป็น interactive)
- สกิลที่ pinned จะไม่ถูกอัปเดตด้วย `--force` เด็ดขาด
- `update <skill>` ล้มเหลวทันทีสำหรับสกิลที่ pinned และบอกให้คุณเรียก `clawhub unpin <skill>` ก่อน
- `update --all` ข้าม slug ที่ pinned และพิมพ์สรุปว่าสิ่งใดยังคงถูกแช่ไว้

### `skill publish <path>`

- เปรียบเทียบ fingerprint ของ bundle ในเครื่องกับ ClawHub และออกสำเร็จเมื่อ
  เนื้อหาถูกเผยแพร่แล้ว
- สกิลใหม่มีค่าเริ่มต้นเป็น `1.0.0`; สกิลที่เปลี่ยนแปลงมีค่าเริ่มต้นเป็นเวอร์ชัน patch ถัดไป
- `--version <version>` เลือกเวอร์ชันอย่างชัดเจน และเผยแพร่แม้เมื่อ
  เนื้อหาตรงกับเวอร์ชันที่มีอยู่แล้ว
- `--dry-run` resolve การเผยแพร่โดยไม่อัปโหลด; `--json` พิมพ์ผลลัพธ์
  ที่เครื่องอ่านได้
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่แบบ org/user เมื่อ
  actor มีสิทธิ์เข้าถึง publisher
- `--migrate-owner` ย้ายสกิลที่มีอยู่ไปยัง `--owner` ขณะเผยแพร่
  เวอร์ชันใหม่ ต้องมีสิทธิ์ admin/owner บน publisher ทั้งสองฝั่ง
- พฤติกรรมของเจ้าของและการตรวจทานอธิบายไว้ใน `docs/publishing.md`
- การเผยแพร่สกิลหมายความว่าสกิลถูกปล่อยภายใต้ `MIT-0` บน ClawHub
- สกิลที่เผยแพร่แล้วใช้ฟรี แก้ไข และแจกจ่ายต่อได้โดยไม่ต้องแสดงที่มา
- ClawHub ไม่รองรับสกิลแบบชำระเงินหรือการตั้งราคารายสกิล
- alias เดิม: `publish <path>`

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

workflow ที่ใช้ซ้ำได้ของ ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
เรียก `skill publish` สำหรับ `skill_path` หนึ่งรายการ หรือสำหรับแต่ละโฟลเดอร์สกิลโดยตรง
ภายใต้ `root` (ค่าเริ่มต้น: `skills`) โดยจะข้ามสกิลที่ไม่เปลี่ยนแปลงและใช้
พฤติกรรมเวอร์ชัน patch อัตโนมัติแบบเดียวกัน

ตั้งค่า `dry_run: true` เพื่อดูตัวอย่างโดยไม่มีโทเค็น การเผยแพร่จริงต้องใช้
secret `clawhub_token`

### `sync`

- สแกน workdir ปัจจุบัน, ไดเรกทอรี skills ที่กำหนดค่าไว้ และโฟลเดอร์
  `--root <dir>` ใดๆ เพื่อหาโฟลเดอร์สกิลในเครื่องที่มี `SKILL.md` หรือ
  `skill.md`
- เปรียบเทียบ fingerprint ของสกิลในเครื่องแต่ละรายการกับ ClawHub และเผยแพร่เฉพาะสกิลใหม่หรือ
  สกิลที่เปลี่ยนแปลง
- สกิลใหม่เผยแพร่เป็น `1.0.0`; สกิลที่เปลี่ยนแปลงเผยแพร่เป็นเวอร์ชัน patch ถัดไป
  โดยค่าเริ่มต้น ใช้ `--bump minor|major` สำหรับชุดอัปเดตที่ควรขยับด้วย
  ขั้น semver ที่ใหญ่กว่า
- `--dry-run` แสดงแผนการเผยแพร่โดยไม่อัปโหลด; `--json` พิมพ์แผน
  ที่เครื่องอ่านได้
- `--all` เผยแพร่สกิลใหม่หรือสกิลที่เปลี่ยนแปลงทั้งหมดโดยไม่ถาม หากไม่มี
  `--all` เทอร์มินัลแบบ interactive จะให้คุณเลือกสกิลที่จะเผยแพร่
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่แบบ org/user เมื่อ
  actor มีสิทธิ์เข้าถึง publisher
- `sync` เป็นการเผยแพร่ทางเดียวเท่านั้น ไม่ติดตั้ง อัปเดต ดาวน์โหลด หรือ
  รายงาน telemetry การ install/download

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- ต้องใช้ `clawhub login`
- เรียกใช้ ClawHub ClawScan ผ่าน `POST /api/v1/skills/-/scan` จากนั้น poll จนกว่าการสแกนจะเป็น terminal
- การสแกนเป็นแบบ asynchronous และอาจใช้เวลาให้เสร็จ ขณะอยู่ในคิว spinner ของเทอร์มินัลจะแสดงตำแหน่งการสแกนตามลำดับความสำคัญปัจจุบัน และจำนวนการสแกนที่อยู่ข้างหน้า
- การสแกนที่เผยแพร่แล้วต้องมี ownership หรือสิทธิ์จัดการ publisher Moderator/admin สามารถใช้ backend เดียวกันผ่าน `clawhub-admin`
- `--update` ใช้ได้เฉพาะกับ `--slug`; โดยจะเขียนผลการสแกนที่เผยแพร่แล้วซึ่งสำเร็จกลับไปยังเวอร์ชันที่เลือก
- `--output <file.zip>` ดาวน์โหลด archive รายงานฉบับเต็มพร้อม `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`
- `--json` พิมพ์ poll response ฉบับเต็มสำหรับ automation
- ไม่รองรับการสแกนพาธในเครื่องอีกต่อไป อัปโหลดเวอร์ชันใหม่ จากนั้นใช้ `scan download` เพื่อดึงผลการสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งนั้น

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
- ต้องระบุ `--version` เพื่อให้ผู้เขียนตรวจสอบเวอร์ชันที่ส่งจริงซึ่ง ClawHub บล็อกไว้
- `--output <file.zip>` เลือกพาธปลายทาง

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub มี workflow ที่ใช้ซ้ำได้อย่างเป็นทางการที่
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/76b4f36bb0f7409ed7cb9c6fd6f1ccf81396ee88/.github/workflows/skill-publish.yml)
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
- ส่ง `skill_path: skills/review-helper` เพื่อประมวลผลโฟลเดอร์สกิลหนึ่งรายการ
- `owner` แมปกับแฟล็ก CLI `--owner`; ละไว้เพื่อเผยแพร่ในฐานะผู้ใช้ที่ผ่านการยืนยันตัวตน
- การเผยแพร่สกิล V1 ใช้ `clawhub_token`; การเผยแพร่ที่เชื่อถือได้ด้วย GitHub OIDC ยังใช้ได้เฉพาะกับแพ็กเกจในตอนนี้

### `delete <skill>`

- หากไม่มี `--version` ให้ลบ Skills แบบซ่อนชั่วคราว (เจ้าของ ผู้ดูแลเนื้อหา หรือผู้ดูแลระบบ)
- เรียก `DELETE /api/v1/skills/{slug}`
- การลบแบบซ่อนชั่วคราวที่เริ่มโดยเจ้าของจะจอง slug ไว้ 30 วัน; คำสั่งจะแสดงเวลาหมดอายุ
- `--version <version>` จะลบเวอร์ชันที่เป็นเจ้าของและไม่ใช่เวอร์ชันล่าสุดอย่างถาวรผ่านเส้นทางเฉพาะเวอร์ชัน
  ที่ปิดเมื่อเกิดข้อผิดพลาด
  เวอร์ชันที่ถูกลบจะกู้คืนหรือนำกลับมาเผยแพร่ไม่ได้ เผยแพร่เวอร์ชันทดแทนก่อนลบ
  เวอร์ชันล่าสุดปัจจุบัน เจ้าหน้าที่แพลตฟอร์มไม่ข้ามสิทธิ์ความเป็นเจ้าของสำหรับโฟลว์ที่ใช้กับเวอร์ชันเท่านั้นนี้
- `--reason <text>` บันทึกหมายเหตุการดูแลเนื้อหาในการลบ Skills ทั้งรายการแบบซ่อนชั่วคราวและบันทึกการตรวจสอบ
- `--note <text>` เป็นนามแฝงของ `--reason`
- `--yes` ข้ามการยืนยัน

### `undelete <skill>`

- กู้คืน Skills ที่ถูกซ่อน (เจ้าของ ผู้ดูแลเนื้อหา หรือผู้ดูแลระบบ)
- ไม่มีการกู้คืนเวอร์ชัน; เวอร์ชันที่ถูกลบถาวรจะกู้คืนไม่ได้
- เรียก `POST /api/v1/skills/{slug}/undelete`
- `--reason <text>` บันทึกหมายเหตุการดูแลเนื้อหาใน Skills และบันทึกการตรวจสอบ
- `--note <text>` เป็นนามแฝงของ `--reason`
- `--yes` ข้ามการยืนยัน

### `hide <skill>`

- ซ่อน Skills (เจ้าของ ผู้ดูแลเนื้อหา หรือผู้ดูแลระบบ)
- นามแฝงของ `delete`

### `unhide <skill>`

- ยกเลิกการซ่อน Skills (เจ้าของ ผู้ดูแลเนื้อหา หรือผู้ดูแลระบบ)
- นามแฝงของ `undelete`

### `skill rename <skill> <new-name>`

- เปลี่ยนชื่อ Skills ที่เป็นเจ้าของและเก็บ slug เดิมไว้เป็นนามแฝงสำหรับเปลี่ยนเส้นทาง
- เรียก `POST /api/v1/skills/{slug}/rename`
- `--yes` ข้ามการยืนยัน

### `skill merge <source> <target>`

- รวม Skills ที่เป็นเจ้าของรายการหนึ่งเข้ากับ Skills ที่เป็นเจ้าของอีกรายการหนึ่ง
- slug ต้นทางจะหยุดแสดงแบบสาธารณะและกลายเป็นนามแฝงสำหรับเปลี่ยนเส้นทางไปยังเป้าหมาย
- เรียก `POST /api/v1/skills/{sourceSlug}/merge`
- `--yes` ข้ามการยืนยัน

### `transfer`

- เวิร์กโฟลว์การโอนความเป็นเจ้าของ
- การโอนไปยังแฮนเดิลผู้ใช้จะสร้างคำขอที่รอดำเนินการให้ผู้รับยอมรับ
- การโอนไปยังแฮนเดิลองค์กร/ผู้เผยแพร่จะมีผลทันทีเฉพาะเมื่อผู้ดำเนินการมี
  สิทธิ์ผู้ดูแลระบบต่อทั้งเจ้าของปัจจุบันและผู้เผยแพร่ปลายทาง
- คำสั่งย่อย:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- เอนด์พอยต์:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- เรียกดูหรือค้นหาแค็ตตาล็อกแพ็กเกจแบบรวมผ่าน `GET /api/v1/packages` และ `GET /api/v1/packages/search`
- ใช้คำสั่งนี้สำหรับ plugins และรายการตระกูลแพ็กเกจอื่น ๆ; `search` ระดับบนยังคงเป็นพื้นผิวค้นหา Skills
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

- ดึงข้อมูลเมตาของแพ็กเกจโดยไม่ติดตั้ง
- ใช้คำสั่งนี้สำหรับข้อมูลเมตา Plugin, ความเข้ากันได้, การตรวจยืนยัน, แหล่งที่มา และการตรวจสอบเวอร์ชัน/ไฟล์
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: ล่าสุด)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-100)
- `--files`: แสดงไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (เฉพาะไฟล์ข้อความ; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `package download <name>`

- แก้เวอร์ชันแพ็กเกจผ่าน
  `GET /api/v1/packages/{name}/versions/{version}/artifact`
- ดาวน์โหลดอาร์ติแฟกต์จาก `downloadUrl` ของตัวแก้
- ตรวจยืนยัน ClawHub SHA-256 สำหรับอาร์ติแฟกต์ทั้งหมด
- สำหรับอาร์ติแฟกต์ ClawPack npm-pack จะตรวจยืนยันความถูกต้อง npm `sha512`,
  npm shasum และชื่อ/เวอร์ชันใน `package.json` ของ tarball ด้วย
- เวอร์ชัน ZIP แบบเดิมดาวน์โหลดผ่านเส้นทาง ZIP แบบเดิม
- แฟล็ก:
  - `--version <version>`: ดาวน์โหลดเวอร์ชันที่ระบุ
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

- คำนวณ ClawHub SHA-256, ความถูกต้อง npm `sha512` และ npm shasum สำหรับ
  อาร์ติแฟกต์ในเครื่อง
- เมื่อใช้ `--package` จะแก้ข้อมูลเมตาที่คาดไว้จาก ClawHub และเปรียบเทียบ
  ไฟล์ในเครื่องกับข้อมูลเมตาอาร์ติแฟกต์ที่เผยแพร่
- เมื่อใช้แฟล็ก digest โดยตรง จะตรวจยืนยันโดยไม่ค้นหาผ่านเครือข่าย
- แฟล็ก:
  - `--package <name>`: ชื่อแพ็กเกจเพื่อแก้ข้อมูลเมตาอาร์ติแฟกต์ที่คาดไว้
  - `--version <version>` หรือ `--tag <tag>`: เวอร์ชันแพ็กเกจที่คาดไว้
  - `--sha256 <hex>`: ClawHub SHA-256 ที่คาดไว้
  - `--npm-integrity <sri>`: ความถูกต้อง npm ที่คาดไว้
  - `--npm-shasum <sha1>`: npm shasum ที่คาดไว้
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- เรียกใช้ Plugin Inspector ที่รวมมากับ ClawHub CLI กับโฟลเดอร์แพ็กเกจ Plugin
  ในเครื่อง
- ค่าเริ่มต้นคือการตรวจสอบแบบออฟไลน์/สแตติก โดยไม่ระบุตำแหน่งหรือนำเข้า checkout
  OpenClaw ในเครื่อง
- ข้อผิดพลาดความเข้ากันได้ที่ร้ายแรงจะออกด้วยค่าที่ไม่ใช่ศูนย์ ผลการตรวจพบที่เป็นเฉพาะคำเตือนจะถูกพิมพ์แต่
  ออกด้วยค่าศูนย์
- แฟล็ก:
  - `--out <dir>`: เขียนรายงาน Plugin Inspector ไปยังไดเรกทอรีนี้
  - `--openclaw <path>`: ตรวจสอบเทียบกับ checkout OpenClaw ในเครื่องที่ระบุชัดเจน
  - `--runtime`: เปิดใช้การจับข้อมูล runtime; นำเข้าโค้ด Plugin
  - `--allow-execute`: อนุญาตการจับข้อมูล runtime ในพื้นที่ทำงานที่แยกไว้
  - `--no-mock-sdk`: ปิดใช้งาน OpenClaw SDK จำลองระหว่างการจับข้อมูล runtime
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package validate ./example-plugin
```

หากการตรวจสอบรายงานข้อพบเกี่ยวกับแพ็กเกจ, manifest, การนำเข้า SDK หรืออาร์ติแฟกต์ โปรดดู
[การแก้ไขการตรวจสอบ Plugin](/clawhub/plugin-validation-fixes) แล้วเรียกใช้คำสั่งอีกครั้ง

### `package delete <name>`

- หากไม่มี `--version` ให้ลบแพ็กเกจและรีลีสทั้งหมดแบบซ่อนชั่วคราว
- `--version <version>` จะลบรีลีสที่เป็นเจ้าของและไม่ใช่เวอร์ชันล่าสุดหนึ่งรายการอย่างถาวรผ่านเส้นทางเฉพาะเวอร์ชัน
  ที่ปิดเมื่อเกิดข้อผิดพลาด
  เวอร์ชันที่ถูกลบจะกู้คืนหรือนำกลับมาเผยแพร่ไม่ได้ เผยแพร่เวอร์ชันทดแทนก่อนลบ
  เวอร์ชันล่าสุดปัจจุบัน โฟลว์ที่ใช้กับเวอร์ชันเท่านั้นนี้ต้องเป็นเจ้าของแพ็กเกจหรือผู้ดูแลระบบผู้เผยแพร่ขององค์กร;
  เจ้าหน้าที่แพลตฟอร์มไม่ข้ามสิทธิ์ความเป็นเจ้าของแพ็กเกจ
- การลบแพ็กเกจทั้งรายการแบบซ่อนชั่วคราวต้องเป็นเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลระบบผู้เผยแพร่ขององค์กร, ผู้ดูแลเนื้อหาแพลตฟอร์ม
  หรือผู้ดูแลระบบแพลตฟอร์ม
- แฟล็ก:
  - `--version <version>`: ลบเวอร์ชันที่ไม่ใช่ล่าสุดหนึ่งรายการอย่างถาวร
  - `--yes`: ข้ามการยืนยัน
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- กู้คืนแพ็กเกจและรีลีสที่ถูกลบแบบซ่อนชั่วคราว
- ไม่มีการกู้คืนเวอร์ชัน; เวอร์ชันที่ถูกลบถาวรจะกู้คืนไม่ได้
- ต้องเป็นเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลระบบผู้เผยแพร่ขององค์กร, ผู้ดูแลเนื้อหาแพลตฟอร์ม
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

- โอนแพ็กเกจไปยังผู้เผยแพร่อื่น
- ต้องมีสิทธิ์ผู้ดูแลระบบต่อทั้งเจ้าของแพ็กเกจปัจจุบันและผู้เผยแพร่
  ปลายทาง เว้นแต่ดำเนินการโดยผู้ดูแลระบบแพลตฟอร์ม
- ชื่อแพ็กเกจแบบมี scope ต้องโอนไปยังเจ้าของ scope ที่ตรงกัน
- เรียก `POST /api/v1/packages/{name}/transfer`
- แฟล็ก:
  - `--to <owner>`: แฮนเดิลผู้เผยแพร่ปลายทาง
  - `--reason <text>`: เหตุผลการตรวจสอบที่ไม่บังคับ
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- คำสั่งที่ต้องยืนยันตัวตนสำหรับรายงานแพ็กเกจต่อผู้ดูแลเนื้อหา
- เรียก `POST /api/v1/packages/{name}/report`
- รายงานอยู่ในระดับแพ็กเกจ อาจผูกกับเวอร์ชันได้ และจะปรากฏให้
  ผู้ดูแลเนื้อหาตรวจสอบ
- รายงานจะไม่ซ่อนแพ็กเกจโดยอัตโนมัติหรือบล็อกการดาวน์โหลดด้วยตัวเอง
- แฟล็ก:
  - `--version <version>`: เวอร์ชันแพ็กเกจที่ไม่บังคับเพื่อแนบกับรายงาน
  - `--reason <text>`: เหตุผลของรายงานที่จำเป็น
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- คำสั่งของเจ้าของสำหรับตรวจสอบการมองเห็นด้านการดูแลเนื้อหาของแพ็กเกจ
- เรียก `GET /api/v1/packages/{name}/moderation`
- แสดงสถานะการสแกนแพ็กเกจปัจจุบัน, จำนวนรายงานที่เปิดอยู่, สถานะการดูแลเนื้อหาด้วยตนเองของรีลีสล่าสุด,
  สถานะการบล็อกการดาวน์โหลด และเหตุผลการดูแลเนื้อหา
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- ตรวจสอบว่าแพ็กเกจพร้อมสำหรับการใช้งานโดย OpenClaw ในอนาคตหรือไม่
- เรียก `GET /api/v1/packages/{name}/readiness`
- รายงานตัวบล็อกสำหรับสถานะทางการ, ความพร้อมใช้งาน ClawPack, digest ของอาร์ติแฟกต์,
  ที่มาของแหล่งข้อมูล, ความเข้ากันได้กับ OpenClaw, เป้าหมายโฮสต์, ข้อมูลเมตาสภาพแวดล้อม,
  และสถานะการสแกน
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- แสดงสถานะการย้ายข้อมูลที่มุ่งเน้นผู้ปฏิบัติการสำหรับแพ็กเกจที่อาจแทนที่
  Plugin OpenClaw ที่รวมมา
- เรียกเอนด์พอยต์ readiness ที่คำนวณเหมือนกับ `package readiness` แต่พิมพ์
  สถานะที่เน้นการย้ายข้อมูล, เวอร์ชันล่าสุด, สถานะแพ็กเกจทางการ, การตรวจสอบ และ
  ตัวบล็อก
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- สร้างผู้เผยแพร่องค์กรที่ผู้ใช้ที่ยืนยันตัวตนเป็นเจ้าของ
- แฮนเดิลจะถูกปรับให้เป็นตัวพิมพ์เล็กและอาจส่งมาพร้อมหรือไม่มี `@` ก็ได้
- ผู้เผยแพร่องค์กรที่เพิ่งสร้างใหม่จะไม่ถูกเชื่อถือ/ไม่เป็นทางการโดยค่าเริ่มต้น
- ล้มเหลวหากแฮนเดิลถูกใช้แล้วโดยผู้เผยแพร่ ผู้ใช้ หรือเส้นทางที่สงวนไว้ที่มีอยู่

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- เผยแพร่ code Plugin หรือ bundle Plugin ผ่าน `POST /api/v1/packages`
- `<source>` รองรับ:
  - พาธโฟลเดอร์ในเครื่อง: `./my-plugin`
  - ไฟล์ tarball แบบ npm-pack ของ ClawPack ในเครื่อง: `./my-plugin-1.2.3.tgz`
  - รีโพ GitHub: `owner/repo` หรือ `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- ระบบตรวจหาเมตาดาต้าโดยอัตโนมัติจาก `package.json`, `openclaw.plugin.json` และ
  marker ของ bundle OpenClaw จริง เช่น `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` และ `.cursor-plugin/plugin.json`
- แหล่งที่มาแบบ `.tgz` จะถูกถือว่าเป็น ClawPack โดย CLI จะอัปโหลดไบต์ npm-pack
  เดิมทุกประการ และใช้เนื้อหา `package/` ที่แตกออกมาเฉพาะสำหรับการตรวจสอบความถูกต้องและ
  การเติมเมตาดาต้าล่วงหน้า
- โฟลเดอร์ code Plugin จะถูกแพ็กเป็น npm tarball ของ ClawPack ก่อนอัปโหลด เพื่อให้
  การติดตั้ง OpenClaw สามารถตรวจสอบ artifact ที่ตรงกันทุกประการได้ ส่วนโฟลเดอร์ bundle Plugin ยังคง
  ใช้เส้นทางการเผยแพร่แบบไฟล์ที่แตกออกมา
- สำหรับแหล่งที่มาจาก GitHub ระบบจะเติมที่มาของซอร์สโดยอัตโนมัติจากรีโพ, commit ที่ resolve แล้ว, ref และ subpath
- สำหรับโฟลเดอร์ในเครื่อง ระบบจะตรวจหาที่มาของซอร์สโดยอัตโนมัติจาก git ในเครื่องเมื่อ origin remote ชี้ไปที่ GitHub
- code Plugin ภายนอกต้องประกาศ `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion` อย่างชัดเจน
  `package.json.version` ระดับบนสุดจะไม่ถูกใช้เป็น fallback สำหรับการตรวจสอบการเผยแพร่
- `--dry-run` แสดงตัวอย่าง publish payload ที่ resolve แล้วโดยไม่อัปโหลด
- `--json` ส่งออกผลลัพธ์ที่เครื่องอ่านได้สำหรับ CI
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่ของผู้ใช้หรือองค์กรเมื่อ actor มีสิทธิ์เผยแพร่
- ชื่อแพ็กเกจแบบ scoped ต้องตรงกับ owner ที่เลือก ดู `docs/publishing.md`
- flag เดิม (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ยังคงใช้เป็น override ได้
- รีโพ GitHub ส่วนตัวต้องใช้ `GITHUB_TOKEN`

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### ขั้นตอนในเครื่องที่แนะนำ

ใช้ `--dry-run` ก่อน เพื่อยืนยันเมตาดาต้าแพ็กเกจที่ resolve แล้วและ
ที่มาของซอร์สก่อนสร้าง release จริง:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### ขั้นตอนโฟลเดอร์ในเครื่อง

สำหรับ code Plugin การเผยแพร่จากโฟลเดอร์จะสร้างและอัปโหลด artifact ของ ClawPack จาก
โฟลเดอร์แพ็กเกจ:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` ขั้นต่ำสำหรับ `--family code-plugin`

code Plugin ภายนอกต้องมีเมตาดาต้า OpenClaw จำนวนเล็กน้อยใน
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

- `package.json.version` คือเวอร์ชัน release ของแพ็กเกจคุณ แต่จะไม่ถูกใช้เป็น
  fallback สำหรับการตรวจสอบ compatibility/build ของ OpenClaw
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมตาดาต้าแบบไม่บังคับ
  ClawHub อาจแสดงข้อมูลเหล่านี้เมื่อมีอยู่ แต่ไม่จำเป็นสำหรับการเผยแพร่
- `openclaw.compat.minGatewayVersion` และ
  `openclaw.build.pluginSdkVersion` เป็นข้อมูลเสริมแบบไม่บังคับหากคุณต้องการเผยแพร่
  เมตาดาต้า compatibility ที่ละเอียดขึ้น
- หากคุณใช้ CLI `clawhub` release เก่า ให้อัปเกรดก่อนเผยแพร่ เพื่อให้
  การตรวจสอบ preflight ในเครื่องทำงานก่อนอัปโหลด
- หากการตรวจสอบรายงาน remediation code ให้ดู
  [การแก้ไขการตรวจสอบ Plugin](/clawhub/plugin-validation-fixes)

#### GitHub Actions

ClawHub ยังมาพร้อม workflow ที่ใช้ซ้ำได้อย่างเป็นทางการที่
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/76b4f36bb0f7409ed7cb9c6fd6f1ccf81396ee88/.github/workflows/package-publish.yml)
สำหรับรีโพ Plugin

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

- workflow ที่ใช้ซ้ำได้จะตั้งค่าเริ่มต้น `source` เป็นรีโพของ caller
- สำหรับ monorepo ให้ส่ง `source_path` เพื่อให้ workflow เผยแพร่โฟลเดอร์แพ็กเกจ
  Plugin เช่น `source_path: extensions/codex`
- pin workflow ที่ใช้ซ้ำได้กับ tag ที่เสถียรหรือ commit SHA แบบเต็ม อย่ารันการเผยแพร่ release จาก `@main`
- `pull_request` ควรใช้ `dry_run: true` เพื่อให้ CI ไม่สร้างผลข้างเคียง
- การเผยแพร่จริงควรถูกจำกัดไว้กับเหตุการณ์ที่เชื่อถือได้ เช่น `workflow_dispatch` หรือการ push tag
- trusted publishing โดยไม่มี secret ใช้ได้เฉพาะบน `workflow_dispatch`; การ push tag ยังคงต้องใช้ `clawhub_token`
- เก็บ `clawhub_token` ให้พร้อมใช้งานสำหรับการเผยแพร่ครั้งแรก แพ็กเกจที่ไม่น่าเชื่อถือ หรือการเผยแพร่ฉุกเฉิน
- workflow จะอัปโหลดผลลัพธ์ JSON เป็น artifact และเปิดเผยเป็น output ของ workflow

### `package trusted-publisher get <name>`

- แสดง config trusted publisher ของ GitHub Actions สำหรับแพ็กเกจ
- ใช้คำสั่งนี้หลังตั้งค่า config เพื่อยืนยัน repository, ชื่อไฟล์ workflow
  และ environment pin แบบไม่บังคับ
- flag:
  - `--json`: ผลลัพธ์ที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- แนบหรือแทนที่ config trusted publisher ของ GitHub Actions สำหรับแพ็กเกจ
  ที่มีอยู่แล้ว
- ต้องสร้างแพ็กเกจก่อนผ่าน `clawhub package publish` แบบปกติที่ใช้การยืนยันตัวตน
  ด้วยตนเองหรือ token
- หลังตั้งค่า config แล้ว การเผยแพร่ผ่าน GitHub Actions ที่รองรับในอนาคตสามารถใช้
  OIDC/trusted publishing โดยไม่ต้องใช้ token ClawHub ที่มีอายุยาว
- `--repository <repo>` ต้องเป็น `owner/repo`
- `--workflow-filename <file>` ต้องตรงกับชื่อไฟล์ workflow ใน
  `.github/workflows/`
- `--environment <name>` เป็นตัวเลือกเสริม เมื่อกำหนดค่าแล้ว environment ของ GitHub Actions
  ใน claim ของ OIDC ต้องตรงกันทุกประการ
- ClawHub จะตรวจสอบ repository GitHub ที่กำหนดค่าไว้เมื่อรันคำสั่งนี้
  repository สาธารณะสามารถตรวจสอบผ่านเมตาดาต้า GitHub สาธารณะได้ ส่วน
  repository ส่วนตัวต้องให้ ClawHub มีสิทธิ์เข้าถึง GitHub repository นั้น
  เช่น ผ่านการติดตั้ง GitHub App ของ ClawHub ในอนาคต หรือ integration GitHub
  อื่นที่ได้รับอนุญาต
- flag:
  - `--repository <repo>`: repository GitHub เช่น `openclaw/example-plugin`
  - `--workflow-filename <file>`: ชื่อไฟล์ workflow เช่น `package-publish.yml`
  - `--environment <name>`: environment ของ GitHub Actions ที่ต้องตรงกันทุกประการแบบไม่บังคับ
  - `--json`: ผลลัพธ์ที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- ลบ config trusted publisher ออกจากแพ็กเกจ
- ใช้เป็น rollback หากต้องปิดใช้งานหรือสร้าง workflow, repository หรือ environment pin
  ใหม่
- การเผยแพร่จริงในอนาคตต้องใช้การเผยแพร่แบบยืนยันตัวตนตามปกติจนกว่าจะตั้งค่า config
  อีกครั้ง
- flag:
  - `--json`: ผลลัพธ์ที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### telemetry การติดตั้ง

- ส่งหลังจาก `clawhub install <slug>` เมื่อเข้าสู่ระบบแล้ว เว้นแต่
  ตั้งค่า `CLAWHUB_DISABLE_TELEMETRY=1`
- การรายงานเป็นแบบ best-effort คำสั่งติดตั้งจะไม่ล้มเหลวหาก telemetry
  ไม่พร้อมใช้งาน
- รายละเอียด: `docs/telemetry.md`
