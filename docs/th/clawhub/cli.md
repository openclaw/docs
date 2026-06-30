---
read_when:
    - การใช้ ClawHub CLI
    - การดีบักการติดตั้ง การอัปเดต หรือการเผยแพร่
summary: 'ข้อมูลอ้างอิง CLI: คำสั่ง แฟล็ก การกำหนดค่า และพฤติกรรมของไฟล์ล็อก.'
x-i18n:
    generated_at: "2026-06-30T22:38:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119900fddb8c80213eb12060c07026527a1ff851546c632bf1f7a909659b1945
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

- `--workdir <dir>`: ไดเรกทอรีทำงาน (ค่าเริ่มต้น: cwd; ถ้ากำหนดไว้จะถอยกลับไปใช้พื้นที่ทำงานของ Clawdbot)
- `--dir <dir>`: ไดเรกทอรีติดตั้งภายใต้ workdir (ค่าเริ่มต้น: `skills`)
- `--site <url>`: URL ฐานสำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `https://clawhub.ai`)
- `--registry <url>`: URL ฐานของ API (ค่าเริ่มต้น: ค้นพบอัตโนมัติ มิฉะนั้นใช้ `https://clawhub.ai`)
- `--no-input`: ปิดพรอมป์

ตัวแปรสภาพแวดล้อมที่เทียบเท่า:

- `CLAWHUB_SITE` (เดิม `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (เดิม `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (เดิม `CLAWDHUB_WORKDIR`)

### พร็อกซี HTTP

CLI เคารพตัวแปรสภาพแวดล้อมพร็อกซี HTTP มาตรฐานสำหรับระบบที่อยู่หลัง
พร็อกซีขององค์กรหรือเครือข่ายที่ถูกจำกัด:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

เมื่อตั้งค่าตัวแปรเหล่านี้ตัวใดตัวหนึ่ง CLI จะส่งคำขอขาออกผ่าน
พร็อกซีที่ระบุ `HTTPS_PROXY` ใช้สำหรับคำขอ HTTPS, `HTTP_PROXY`
ใช้สำหรับ HTTP ปกติ ระบบจะเคารพ `NO_PROXY` / `no_proxy` เพื่อข้ามพร็อกซีสำหรับ
โฮสต์หรือโดเมนที่ระบุ

สิ่งนี้จำเป็นในระบบที่บล็อกการเชื่อมต่อขาออกโดยตรง
(เช่น คอนเทนเนอร์ Docker, Hetzner VPS ที่ใช้อินเทอร์เน็ตได้เฉพาะผ่านพร็อกซี, ไฟร์วอลล์
ขององค์กร)

ตัวอย่าง:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

เมื่อไม่ได้ตั้งค่าตัวแปรพร็อกซี พฤติกรรมจะไม่เปลี่ยนแปลง (เชื่อมต่อโดยตรง)

## ไฟล์คอนฟิก

จัดเก็บโทเค็น API ของคุณและ URL registry ที่แคชไว้

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` หรือ `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- เส้นทางสำรองเดิม: หากยังไม่มี `clawhub/config.json` แต่มี `clawdhub/config.json` อยู่ CLI จะใช้เส้นทางเดิมนั้นซ้ำ
- การแทนที่: `CLAWHUB_CONFIG_PATH` (เดิม `CLAWDHUB_CONFIG_PATH`)

## คำสั่ง

### `login` / `auth login`

- ค่าเริ่มต้น: เปิดเบราว์เซอร์ไปที่ `<site>/cli/auth` และทำให้เสร็จผ่าน callback แบบ loopback
- แบบไม่มีหน้าจอ: `clawhub login --token clh_...`
- แบบโต้ตอบระยะไกล/ไม่มีหน้าจอ: `clawhub login --device` พิมพ์โค้ดและรอขณะที่คุณอนุญาตที่ `<site>/cli/device`

### `whoami`

- ตรวจสอบโทเค็นที่จัดเก็บไว้ผ่าน `/api/v1/whoami`

### `token`

- พิมพ์โทเค็น API ที่จัดเก็บไว้ไปยัง stdout
- มีประโยชน์สำหรับส่งโทเค็นเข้าสู่ระบบในเครื่องผ่าน pipe ไปยังคำสั่งตั้งค่า secret ของ CI

### `star <skill>` / `unstar <skill>`

- เพิ่ม/ลบสกิลออกจากรายการเด่นของคุณ
- เรียก `POST /api/v1/stars/<slug>` และ `DELETE /api/v1/stars/<slug>`
- `--yes` ข้ามการยืนยัน

### `search <query...>`

- เรียก `/api/v1/search?q=...`
- เอาต์พุตมี slug ของสกิล, แฮนเดิลเจ้าของ, ชื่อที่แสดง และคะแนนความเกี่ยวข้อง
- การค้นหาจะให้ความสำคัญกับการตรงกันแบบ exact ของโทเค็น slug/ชื่อก่อนความนิยมในการดาวน์โหลด โทเค็น slug แบบเดี่ยว เช่น `map` จะตรงกับ `personal-map` ได้แรงกว่าสตริงย่อยภายใน `amap`
- ความนิยมเป็นเพียงตัวช่วยจัดอันดับขนาดเล็ก ไม่ใช่การรับประกันว่าจะอยู่ตำแหน่งบนสุด
- หากสกิลควรปรากฏแต่ไม่ปรากฏ ให้รัน `clawhub inspect @owner/slug` ขณะเข้าสู่ระบบเพื่อตรวจสอบการวินิจฉัยการกลั่นกรองที่เจ้าของมองเห็นได้ก่อนเปลี่ยนชื่อ metadata

### `explore`

- แสดงรายการสกิลใหม่ล่าสุดผ่าน `/api/v1/skills?limit=...&sort=createdAt` (เรียงตาม `createdAt` จากใหม่ไปเก่า)
- แฟล็ก:
  - `--limit <n>` (1-200, ค่าเริ่มต้น: 25)
  - `--sort newest|updated|rating|downloads|trending` (ค่าเริ่มต้น: newest) นามแฝงการเรียงลำดับการติดตั้งแบบเดิมยังทำงานเพื่อความเข้ากันได้
  - `--json` (เอาต์พุตที่เครื่องอ่านได้)
- เอาต์พุต: `<slug>  v<version>  <age>  <summary>` (summary ถูกตัดเหลือ 50 อักขระ)

### `inspect @owner/slug`

- ดึง metadata ของสกิลและไฟล์เวอร์ชันโดยไม่ติดตั้ง
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: latest)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-200)
- `--files`: แสดงรายการไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (เฉพาะไฟล์ข้อความ จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `install @owner/slug`

- resolve เวอร์ชันล่าสุดสำหรับเจ้าของและสกิลที่ระบุชื่อ
- ดาวน์โหลด zip ผ่าน `/api/v1/download`
- แตกไฟล์ไปยัง `<workdir>/<dir>/<slug>`
- ปฏิเสธการเขียนทับสกิลที่ถูก pin; ให้รัน `clawhub unpin <skill>` ก่อน
- เขียน:
  - `<workdir>/.clawhub/lock.json` (เดิม `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (เดิม `.clawdhub`)

### `uninstall <skill>`

- ลบ `<workdir>/<dir>/<slug>` และลบรายการใน lockfile
- ส่ง telemetry แบบดีที่สุดเท่าที่ทำได้ขณะเข้าสู่ระบบ เพื่อให้จำนวนการติดตั้งปัจจุบันสามารถ
  ถูกปิดใช้งานได้
- แบบโต้ตอบ: ถามเพื่อยืนยัน
- แบบไม่โต้ตอบ (`--no-input`): ต้องใช้ `--yes`

### `list`

- อ่าน `<workdir>/.clawhub/lock.json` (เดิม `.clawdhub`)
- แสดง `pinned` ถัดจากสกิลที่ถูกตรึงด้วย `clawhub pin` รวมถึงเหตุผลที่เป็นตัวเลือก

### `pin <skill>`

- ทำเครื่องหมายสกิลที่ติดตั้งแล้วว่า pinned ใน lockfile
- `--reason <text>` บันทึกเหตุผลที่สกิลถูกตรึง
- สกิลที่ pinned จะถูกข้ามโดย `update --all` และถูกปฏิเสธโดย `update <skill>` โดยตรง
- สกิลที่ pinned ยังปฏิเสธ `install --force` เพื่อไม่ให้ไบต์ในเครื่องถูกแทนที่โดยไม่ตั้งใจ

### `unpin <skill>`

- ลบ pin ของ lockfile จากสกิลที่ติดตั้งแล้ว เพื่อให้การอัปเดตในอนาคตแก้ไขได้

### `update [@owner/slug]` / `update --all`

- คำนวณ fingerprint จากไฟล์ในเครื่อง
- หาก fingerprint ตรงกับเวอร์ชันที่รู้จัก: ไม่มีพรอมป์
- หาก fingerprint ไม่ตรง:
  - ปฏิเสธตามค่าเริ่มต้น
  - เขียนทับด้วย `--force` (หรือพรอมป์ หากเป็นแบบโต้ตอบ)
- สกิลที่ pinned จะไม่ถูกอัปเดตโดย `--force`
- `update <skill>` ล้มเหลวทันทีสำหรับสกิลที่ pinned และบอกให้คุณรัน `clawhub unpin <skill>` ก่อน
- `update --all` ข้าม slug ที่ pinned และพิมพ์สรุปว่าสิ่งใดยังคงถูกตรึงไว้

### `skill publish <path>`

- เปรียบเทียบ fingerprint ของบันเดิลในเครื่องกับ ClawHub และออกสำเร็จเมื่อ
  เนื้อหาถูกเผยแพร่แล้ว
- สกิลใหม่มีค่าเริ่มต้นเป็น `1.0.0`; สกิลที่เปลี่ยนแปลงมีค่าเริ่มต้นเป็นเวอร์ชัน patch
  ถัดไป
- `--version <version>` เลือกเวอร์ชันอย่างชัดเจนและเผยแพร่แม้เมื่อ
  เนื้อหาตรงกับเวอร์ชันที่มีอยู่
- `--dry-run` resolve การเผยแพร่โดยไม่อัปโหลด; `--json` พิมพ์ผลลัพธ์
  ที่เครื่องอ่านได้
- `--owner <handle>` เผยแพร่ภายใต้แฮนเดิลผู้เผยแพร่ขององค์กร/ผู้ใช้เมื่อ
  actor มีสิทธิ์เข้าถึงผู้เผยแพร่
- `--migrate-owner` ย้ายสกิลที่มีอยู่ไปยัง `--owner` ขณะเผยแพร่เวอร์ชัน
  ใหม่ ต้องมีสิทธิ์ admin/owner บนผู้เผยแพร่ทั้งสอง
- พฤติกรรมเจ้าของและการรีวิวอธิบายไว้ใน `docs/publishing.md`
- การเผยแพร่สกิลหมายความว่าสกิลถูกเผยแพร่ภายใต้ `MIT-0` บน ClawHub
- สกิลที่เผยแพร่แล้วใช้งาน แก้ไข และแจกจ่ายซ้ำได้ฟรีโดยไม่ต้องระบุแหล่งที่มา
- ClawHub ไม่รองรับสกิลแบบชำระเงินหรือการตั้งราคาต่อสกิล
- นามแฝงเดิม: `publish <path>`

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

workflow ที่ใช้ซ้ำได้ของ ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
เรียก `skill publish` สำหรับ `skill_path` หนึ่งรายการ หรือสำหรับแต่ละโฟลเดอร์สกิลชั้นแรก
ภายใต้ `root` (ค่าเริ่มต้น: `skills`) โดยจะข้ามสกิลที่ไม่เปลี่ยนแปลงและใช้พฤติกรรม
เวอร์ชัน patch อัตโนมัติแบบเดียวกัน

ตั้งค่า `dry_run: true` เพื่อดูตัวอย่างโดยไม่มีโทเค็น การเผยแพร่จริงต้องใช้
secret `clawhub_token`

### `sync`

- สแกน workdir ปัจจุบัน, ไดเรกทอรี Skills ที่กำหนดค่าไว้ และโฟลเดอร์
  `--root <dir>` ใดๆ เพื่อหาโฟลเดอร์สกิลในเครื่องที่มี `SKILL.md` หรือ
  `skill.md`
- เปรียบเทียบ fingerprint ของสกิลในเครื่องแต่ละรายการกับ ClawHub และเผยแพร่เฉพาะสกิลใหม่หรือ
  สกิลที่เปลี่ยนแปลง
- สกิลใหม่เผยแพร่เป็น `1.0.0`; สกิลที่เปลี่ยนแปลงเผยแพร่เป็นเวอร์ชัน patch ถัดไป
  ตามค่าเริ่มต้น ใช้ `--bump minor|major` สำหรับชุดอัปเดตที่ควรขยับด้วย
  ขั้น semver ที่ใหญ่กว่า
- `--dry-run` แสดงแผนการเผยแพร่โดยไม่อัปโหลด; `--json` พิมพ์แผน
  ที่เครื่องอ่านได้
- `--all` เผยแพร่ทุกสกิลใหม่หรือสกิลที่เปลี่ยนแปลงโดยไม่พรอมป์ หากไม่มี
  `--all` เทอร์มินัลแบบโต้ตอบจะให้คุณเลือกสกิลที่จะเผยแพร่
- `--owner <handle>` เผยแพร่ภายใต้แฮนเดิลผู้เผยแพร่ขององค์กร/ผู้ใช้เมื่อ
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
- รัน ClawHub ClawScan ผ่าน `POST /api/v1/skills/-/scan` จากนั้น poll จนกว่าการสแกนจะเป็น terminal
- การสแกนเป็นแบบ asynchronous และอาจใช้เวลาจึงจะเสร็จ ขณะอยู่ในคิว spinner ในเทอร์มินัลจะแสดงตำแหน่งสแกนที่ถูกจัดลำดับความสำคัญปัจจุบันและจำนวนสแกนที่อยู่ข้างหน้า
- การสแกนที่เผยแพร่แล้วต้องมีสิทธิ์ความเป็นเจ้าของหรือสิทธิ์จัดการผู้เผยแพร่ ผู้กลั่นกรอง/admin สามารถใช้ backend เดียวกันผ่าน `clawhub-admin`
- `--update` ใช้ได้เฉพาะกับ `--slug`; จะเขียนผลลัพธ์การสแกนที่เผยแพร่สำเร็จกลับไปยังเวอร์ชันที่เลือก
- `--output <file.zip>` ดาวน์โหลด archive รายงานฉบับเต็มที่มี `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`
- `--json` พิมพ์คำตอบ poll ฉบับเต็มสำหรับ automation
- ไม่รองรับการสแกน path ในเครื่องอีกต่อไป ให้อัปโหลดเวอร์ชันใหม่ จากนั้นใช้ `scan download` เพื่อดึงผลลัพธ์การสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งนั้น

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- ต้องใช้ `clawhub login`
- ดาวน์โหลด ZIP รายงานการสแกนที่จัดเก็บไว้สำหรับเวอร์ชันสกิลหรือ Plugin ที่ส่งมา รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อนโดยการตรวจสอบความปลอดภัยของ ClawHub
- การดาวน์โหลดสกิลใช้ slug ของสกิลและมีค่าเริ่มต้นเป็น `--kind skill`
- การดาวน์โหลด Plugin ใช้ชื่อแพ็กเกจและต้องใช้ `--kind plugin`
- ต้องระบุ `--version` เพื่อให้ผู้เขียนตรวจสอบเวอร์ชันที่ส่งมาอย่าง exact ที่ ClawHub บล็อก
- `--output <file.zip>` เลือก path ปลายทาง

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub มาพร้อม workflow ทางการที่ใช้ซ้ำได้ที่
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/d8096dfc039e86ab942ddf9ef117d04849fd84c1/.github/workflows/skill-publish.yml)
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
- `owner` แมปกับแฟล็ก CLI `--owner`; ละไว้เพื่อเผยแพร่ในฐานะผู้ใช้ที่ยืนยันตัวตนแล้ว
- การเผยแพร่สกิล V1 ใช้ `clawhub_token`; การเผยแพร่ที่เชื่อถือได้ผ่าน GitHub OIDC ใช้ได้เฉพาะแพ็กเกจในตอนนี้

### `delete <skill>`

- หากไม่มี `--version` ให้ soft-delete Skills (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- เรียก `DELETE /api/v1/skills/{slug}`
- การ soft delete ที่เริ่มโดยเจ้าของจะสงวน slug ไว้ 30 วัน; คำสั่งจะแสดงเวลาหมดอายุ
- `--version <version>` ลบเวอร์ชันที่เป็นเจ้าของและไม่ใช่เวอร์ชันล่าสุดหนึ่งเวอร์ชันอย่างถาวรผ่านเส้นทางแบบ fail-closed
  ที่เจาะจงเวอร์ชัน
  เวอร์ชันที่ลบแล้วไม่สามารถกู้คืนหรือเผยแพร่ซ้ำได้ เผยแพร่เวอร์ชันทดแทนก่อนลบ
  เวอร์ชันล่าสุดปัจจุบัน เจ้าหน้าที่แพลตฟอร์มไม่ข้ามการตรวจสอบความเป็นเจ้าของสำหรับโฟลว์เฉพาะเวอร์ชันนี้
- `--reason <text>` บันทึกหมายเหตุการดูแลสำหรับการ soft-delete ทั้ง Skills และบันทึก audit log
- `--note <text>` เป็น alias ของ `--reason`
- `--yes` ข้ามการยืนยัน

### `undelete <skill>`

- กู้คืน Skills ที่ถูกซ่อน (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- ไม่มีการ undelete เวอร์ชัน; เวอร์ชันที่ลบถาวรไม่สามารถกู้คืนได้
- เรียก `POST /api/v1/skills/{slug}/undelete`
- `--reason <text>` บันทึกหมายเหตุการดูแลใน Skills และ audit log
- `--note <text>` เป็น alias ของ `--reason`
- `--yes` ข้ามการยืนยัน

### `hide <skill>`

- ซ่อน Skills (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- Alias สำหรับ `delete`

### `unhide <skill>`

- ยกเลิกการซ่อน Skills (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- Alias สำหรับ `undelete`

### `skill rename <skill> <new-name>`

- เปลี่ยนชื่อ Skills ที่เป็นเจ้าของและเก็บ slug เดิมไว้เป็น redirect alias
- เรียก `POST /api/v1/skills/{slug}/rename`
- `--yes` ข้ามการยืนยัน

### `skill merge <source> <target>`

- รวม Skills ที่เป็นเจ้าของหนึ่งรายการเข้าไปใน Skills ที่เป็นเจ้าของอีกรายการ
- slug ต้นทางจะหยุดแสดงแบบสาธารณะและกลายเป็น redirect alias ไปยังปลายทาง
- เรียก `POST /api/v1/skills/{sourceSlug}/merge`
- `--yes` ข้ามการยืนยัน

### `transfer`

- เวิร์กโฟลว์การโอนความเป็นเจ้าของ
- การโอนไปยัง handle ของผู้ใช้จะสร้างคำขอที่รอดำเนินการเพื่อให้ผู้รับยอมรับ
- การโอนไปยัง handle ของ org/publisher จะมีผลทันทีเฉพาะเมื่อผู้ดำเนินการมี
  สิทธิ์ admin ทั้งกับเจ้าของปัจจุบันและ publisher ปลายทาง
- คำสั่งย่อย:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- Endpoints:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- เรียกดูหรือค้นหาแค็ตตาล็อกแพ็กเกจแบบรวมผ่าน `GET /api/v1/packages` และ `GET /api/v1/packages/search`
- ใช้คำสั่งนี้สำหรับ plugins และรายการในตระกูลแพ็กเกจอื่นๆ; `search` ระดับบนสุดยังคงเป็นพื้นผิวการค้นหา Skills
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

- ดึงข้อมูลเมตาแพ็กเกจโดยไม่ติดตั้ง
- ใช้คำสั่งนี้สำหรับข้อมูลเมตา Plugin, ความเข้ากันได้, การตรวจสอบยืนยัน, แหล่งที่มา และการตรวจสอบเวอร์ชัน/ไฟล์
- `--version <version>`: ตรวจสอบเวอร์ชันเฉพาะ (ค่าเริ่มต้น: latest)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-100)
- `--files`: แสดงรายการไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (เฉพาะไฟล์ข้อความ; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `package download <name>`

- resolve เวอร์ชันแพ็กเกจผ่าน
  `GET /api/v1/packages/{name}/versions/{version}/artifact`
- ดาวน์โหลด artifact จาก `downloadUrl` ของ resolver
- ตรวจสอบ ClawHub SHA-256 สำหรับ artifacts ทั้งหมด
- สำหรับ ClawPack npm-pack artifacts จะตรวจสอบ npm `sha512` integrity,
  npm shasum และชื่อ/เวอร์ชันใน `package.json` ของ tarball ด้วย
- เวอร์ชัน ZIP แบบ legacy ดาวน์โหลดผ่านเส้นทาง ZIP แบบ legacy
- Flags:
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
- เมื่อใช้ `--package` จะ resolve ข้อมูลเมตาที่คาดหวังจาก ClawHub และเปรียบเทียบ
  ไฟล์ภายในเครื่องกับข้อมูลเมตา artifact ที่เผยแพร่
- เมื่อใช้ flags digest โดยตรง จะตรวจสอบยืนยันโดยไม่ค้นผ่านเครือข่าย
- Flags:
  - `--package <name>`: ชื่อแพ็กเกจเพื่อ resolve ข้อมูลเมตา artifact ที่คาดหวัง
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

- รัน Plugin Inspector ที่ bundle มากับ ClawHub CLI กับโฟลเดอร์แพ็กเกจ Plugin ภายในเครื่อง
- ค่าเริ่มต้นคือการตรวจสอบแบบ offline/static โดยไม่ค้นหาหรือ import checkout ของ
  OpenClaw ภายในเครื่อง
- ข้อผิดพลาดความเข้ากันได้ระดับร้ายแรงจะออกด้วยสถานะไม่เป็นศูนย์ ผลการตรวจที่เป็นคำเตือนเท่านั้นจะแสดงผลแต่
  ออกด้วยสถานะศูนย์
- Flags:
  - `--out <dir>`: เขียนรายงาน Plugin Inspector ไปยังไดเรกทอรีนี้
  - `--openclaw <path>`: ตรวจสอบเทียบกับ checkout ของ OpenClaw ภายในเครื่องที่ระบุชัดเจน
  - `--runtime`: เปิดใช้ runtime capture; import โค้ด Plugin
  - `--allow-execute`: อนุญาต runtime capture ใน workspace ที่แยกไว้
  - `--no-mock-sdk`: ปิดใช้ OpenClaw SDK แบบ mocked ระหว่าง runtime capture
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package validate ./example-plugin
```

หากการตรวจสอบรายงานผลการตรวจเกี่ยวกับแพ็กเกจ, manifest, SDK import หรือ artifact โปรดดู
[การแก้ไขการตรวจสอบ Plugin](/clawhub/plugin-validation-fixes) แล้วรันคำสั่งอีกครั้ง

### `package delete <name>`

- หากไม่มี `--version` ให้ soft-delete แพ็กเกจและ releases ทั้งหมด
- `--version <version>` ลบ release ที่เป็นเจ้าของและไม่ใช่ล่าสุดหนึ่งรายการอย่างถาวรผ่านเส้นทางแบบ fail-closed
  ที่เจาะจงเวอร์ชัน
  เวอร์ชันที่ลบแล้วไม่สามารถกู้คืนหรือเผยแพร่ซ้ำได้ เผยแพร่เวอร์ชันทดแทนก่อนลบ
  เวอร์ชันล่าสุดปัจจุบัน โฟลว์เฉพาะเวอร์ชันนี้ต้องใช้เจ้าของแพ็กเกจหรือ admin ของ org publisher; เจ้าหน้าที่แพลตฟอร์มไม่ข้ามการตรวจสอบความเป็นเจ้าของแพ็กเกจ
- การ soft-delete ทั้งแพ็กเกจต้องใช้เจ้าของแพ็กเกจ, owner/admin ของ org publisher, ผู้ดูแลแพลตฟอร์ม
  หรือผู้ดูแลระบบแพลตฟอร์ม
- Flags:
  - `--version <version>`: ลบเวอร์ชันที่ไม่ใช่ล่าสุดหนึ่งเวอร์ชันอย่างถาวร
  - `--yes`: ข้ามการยืนยัน
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- กู้คืนแพ็กเกจและ releases ที่ถูก soft-delete
- ไม่มีการ undelete เวอร์ชัน; เวอร์ชันที่ลบถาวรไม่สามารถกู้คืนได้
- ต้องใช้เจ้าของแพ็กเกจ, owner/admin ของ org publisher, ผู้ดูแลแพลตฟอร์ม
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
- ต้องใช้สิทธิ์ admin ทั้งกับเจ้าของแพ็กเกจปัจจุบันและ publisher
  ปลายทาง เว้นแต่ดำเนินการโดยผู้ดูแลระบบแพลตฟอร์ม
- ชื่อแพ็กเกจแบบ scoped ต้องโอนไปยังเจ้าของ scope ที่ตรงกัน
- เรียก `POST /api/v1/packages/{name}/transfer`
- Flags:
  - `--to <owner>`: handle ของ publisher ปลายทาง
  - `--reason <text>`: เหตุผล audit ที่ไม่บังคับ
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- คำสั่งที่ต้องผ่านการยืนยันตัวตนสำหรับรายงานแพ็กเกจต่อผู้ดูแล
- เรียก `POST /api/v1/packages/{name}/report`
- รายงานอยู่ในระดับแพ็กเกจ อาจผูกกับเวอร์ชันหรือไม่ก็ได้ และจะมองเห็นได้
  สำหรับผู้ดูแลเพื่อรีวิว
- รายงานจะไม่ซ่อนแพ็กเกจหรือบล็อกการดาวน์โหลดโดยอัตโนมัติด้วยตัวเอง
- Flags:
  - `--version <version>`: เวอร์ชันแพ็กเกจที่ไม่บังคับเพื่อแนบกับรายงาน
  - `--reason <text>`: เหตุผลรายงานที่จำเป็น
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- คำสั่งสำหรับเจ้าของเพื่อตรวจสอบสถานะการมองเห็นด้านการดูแลของแพ็กเกจ
- เรียก `GET /api/v1/packages/{name}/moderation`
- แสดงสถานะการสแกนแพ็กเกจปัจจุบัน, จำนวนรายงานที่เปิดอยู่, สถานะการดูแลด้วยตนเองของ release ล่าสุด,
  สถานะการบล็อกดาวน์โหลด และเหตุผลการดูแล
- Flags:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- ตรวจสอบว่าแพ็กเกจพร้อมสำหรับการใช้งานโดย OpenClaw ในอนาคตหรือไม่
- เรียก `GET /api/v1/packages/{name}/readiness`
- รายงานตัวบล็อกสำหรับสถานะ official, ความพร้อมใช้งานของ ClawPack, digest ของ artifact,
  ที่มาของแหล่งซอร์ส, ความเข้ากันได้กับ OpenClaw, host targets, ข้อมูลเมตาของ environment,
  และสถานะการสแกน
- Flags:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- แสดงสถานะการ migration ที่มุ่งเน้นผู้ปฏิบัติงานสำหรับแพ็กเกจที่อาจแทนที่
  Plugin ของ OpenClaw ที่ bundle มา
- เรียก endpoint readiness ที่คำนวณแบบเดียวกับ `package readiness` แต่แสดง
  สถานะที่เน้นการ migration, เวอร์ชันล่าสุด, สถานะแพ็กเกจ official, checks และ
  blockers
- Flags:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- สร้าง org publisher ที่ผู้ใช้ที่ยืนยันตัวตนเป็นเจ้าของ
- handle จะถูก normalize เป็นตัวพิมพ์เล็กและอาจส่งโดยมีหรือไม่มี `@` ก็ได้
- org publishers ที่สร้างใหม่จะไม่ trusted/official โดยค่าเริ่มต้น
- ล้มเหลวหาก handle ถูกใช้แล้วโดย publisher, ผู้ใช้ หรือ reserved route ที่มีอยู่

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- เผยแพร่ code Plugin หรือ bundle Plugin ผ่าน `POST /api/v1/packages`
- `<source>` ยอมรับ:
  - พาธโฟลเดอร์ในเครื่อง: `./my-plugin`
  - tarball แบบ npm-pack ของ ClawPack ในเครื่อง: `./my-plugin-1.2.3.tgz`
  - รีโป GitHub: `owner/repo` หรือ `owner/repo@ref`
  - URL ของ GitHub: `https://github.com/owner/repo`
- ตรวจพบเมตาดาตาอัตโนมัติจาก `package.json`, `openclaw.plugin.json` และ
  เครื่องหมาย bundle ของ OpenClaw จริง เช่น `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` และ `.cursor-plugin/plugin.json`
- แหล่งที่มา `.tgz` จะถูกมองเป็น ClawPack โดย CLI จะอัปโหลดไบต์ npm-pack
  ตรงตามจริง และใช้เนื้อหา `package/` ที่แตกออกมาเฉพาะสำหรับการตรวจสอบและ
  เติมเมตาดาตาล่วงหน้าเท่านั้น
- โฟลเดอร์ code-plugin จะถูกแพ็กเป็น tarball แบบ npm ของ ClawPack ก่อนอัปโหลด เพื่อให้
  การติดตั้ง OpenClaw ตรวจสอบอาร์ติแฟกต์ที่ตรงตามจริงได้ ส่วนโฟลเดอร์ bundle-plugin ยัง
  ใช้เส้นทางเผยแพร่แบบไฟล์ที่แตกออกมาแล้ว
- สำหรับแหล่งที่มาจาก GitHub การระบุที่มาแหล่งข้อมูลจะถูกเติมอัตโนมัติจากรีโป, commit ที่ resolve แล้ว, ref และ subpath
- สำหรับโฟลเดอร์ในเครื่อง การระบุที่มาแหล่งข้อมูลจะถูกตรวจพบอัตโนมัติจาก git ในเครื่องเมื่อ origin remote ชี้ไปที่ GitHub
- code Plugin ภายนอกต้องประกาศ `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion` อย่างชัดเจน
  `package.json.version` ระดับบนสุดจะไม่ถูกใช้เป็น fallback สำหรับการตรวจสอบการเผยแพร่
- `--dry-run` แสดงตัวอย่าง payload การเผยแพร่ที่ resolve แล้วโดยไม่อัปโหลด
- `--json` ปล่อยเอาต์พุตที่เครื่องอ่านได้สำหรับ CI
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่ของผู้ใช้หรือองค์กรเมื่อ actor มีสิทธิ์เข้าถึงผู้เผยแพร่
- ชื่อแพ็กเกจแบบ scoped ต้องตรงกับเจ้าของที่เลือก ดู `docs/publishing.md`
- flag ที่มีอยู่ (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ยังคงใช้เป็น override ได้
- รีโป GitHub แบบส่วนตัวต้องใช้ `GITHUB_TOKEN`

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### โฟลว์ในเครื่องที่แนะนำ

ใช้ `--dry-run` ก่อน เพื่อให้คุณยืนยันเมตาดาตาแพ็กเกจที่ resolve แล้วและ
การระบุที่มาแหล่งข้อมูลก่อนสร้าง release จริงได้:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### โฟลว์โฟลเดอร์ในเครื่อง

สำหรับ code Plugin การเผยแพร่โฟลเดอร์จะ build และอัปโหลดอาร์ติแฟกต์ ClawPack จาก
โฟลเดอร์แพ็กเกจ:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` ขั้นต่ำสำหรับ `--family code-plugin`

code Plugin ภายนอกต้องมีเมตาดาตา OpenClaw จำนวนเล็กน้อยใน
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
  fallback สำหรับการตรวจสอบความเข้ากันได้/build ของ OpenClaw
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมตาดาตาที่ไม่บังคับ
  ClawHub อาจแสดงค่าเหล่านี้เมื่อมีอยู่ แต่ไม่จำเป็นสำหรับการเผยแพร่
- `openclaw.compat.minGatewayVersion` และ
  `openclaw.build.pluginSdkVersion` เป็นส่วนเพิ่มเติมที่ไม่บังคับ หากคุณต้องการเผยแพร่
  เมตาดาตาความเข้ากันได้ที่ละเอียดขึ้น
- หากคุณใช้ CLI `clawhub` release ที่เก่ากว่า ให้อัปเกรดก่อนเผยแพร่ เพื่อให้
  การตรวจ preflight ในเครื่องทำงานก่อนอัปโหลด
- หากการตรวจสอบรายงานรหัสการแก้ไข ให้ดู
  [การแก้ไขการตรวจสอบ Plugin](/clawhub/plugin-validation-fixes)

#### GitHub Actions

ClawHub ยังมาพร้อม workflow ที่ใช้ซ้ำได้อย่างเป็นทางการที่
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/d8096dfc039e86ab942ddf9ef117d04849fd84c1/.github/workflows/package-publish.yml)
สำหรับรีโป Plugin

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

- workflow ที่ใช้ซ้ำได้จะตั้งค่าเริ่มต้นของ `source` เป็นรีโป caller
- สำหรับ monorepo ให้ส่ง `source_path` เพื่อให้ workflow เผยแพร่โฟลเดอร์แพ็กเกจ
  Plugin เช่น `source_path: extensions/codex`
- pin workflow ที่ใช้ซ้ำได้ไว้กับ tag ที่เสถียรหรือ SHA ของ commit แบบเต็ม อย่ารันการเผยแพร่ release จาก `@main`
- `pull_request` ควรใช้ `dry_run: true` เพื่อให้ CI ไม่สร้างผลกระทบต่อสภาพแวดล้อม
- การเผยแพร่จริงควรถูกจำกัดไว้เฉพาะเหตุการณ์ที่เชื่อถือได้ เช่น `workflow_dispatch` หรือการ push tag
- การเผยแพร่แบบ trusted โดยไม่มี secret ใช้ได้เฉพาะบน `workflow_dispatch`; การ push tag ยังต้องใช้ `clawhub_token`
- เก็บ `clawhub_token` ให้พร้อมใช้สำหรับการเผยแพร่ครั้งแรก, แพ็กเกจที่ไม่น่าเชื่อถือ หรือการเผยแพร่ฉุกเฉิน
- workflow อัปโหลดผลลัพธ์ JSON เป็นอาร์ติแฟกต์และเปิดเผยเป็นเอาต์พุตของ workflow

### `package trusted-publisher get <name>`

- แสดง config trusted publisher ของ GitHub Actions สำหรับแพ็กเกจ
- ใช้คำสั่งนี้หลังตั้งค่า config เพื่อยืนยัน repository, ชื่อไฟล์ workflow
  และ environment pin ที่ไม่บังคับ
- flag:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- แนบหรือแทนที่ config trusted publisher ของ GitHub Actions สำหรับแพ็กเกจ
  ที่มีอยู่แล้ว
- ต้องสร้างแพ็กเกจก่อนผ่าน `clawhub package publish` แบบปกติด้วยตนเองหรือแบบยืนยันตัวตนด้วย token
- หลังตั้งค่า config แล้ว การเผยแพร่จาก GitHub Actions ที่รองรับในอนาคตสามารถใช้
  OIDC/trusted publishing ได้โดยไม่ต้องใช้ token ClawHub ที่มีอายุยาว
- `--repository <repo>` ต้องเป็น `owner/repo`
- `--workflow-filename <file>` ต้องตรงกับชื่อไฟล์ workflow ใน
  `.github/workflows/`
- `--environment <name>` ไม่บังคับ เมื่อกำหนดค่าแล้ว environment ของ GitHub Actions
  ใน OIDC claim ต้องตรงกันทุกประการ
- ClawHub ตรวจสอบ repository GitHub ที่กำหนดค่าไว้เมื่อรันคำสั่งนี้
  repository สาธารณะสามารถตรวจสอบได้ผ่านเมตาดาตา GitHub สาธารณะ ส่วน
  repository ส่วนตัวต้องให้ ClawHub มีสิทธิ์เข้าถึง GitHub สำหรับ repository นั้น
  เช่น ผ่านการติดตั้ง GitHub App ของ ClawHub ในอนาคต หรือการผสานรวม GitHub ที่ได้รับอนุญาตอื่น
- flag:
  - `--repository <repo>`: repository GitHub เช่น `openclaw/example-plugin`
  - `--workflow-filename <file>`: ชื่อไฟล์ workflow เช่น `package-publish.yml`
  - `--environment <name>`: environment ของ GitHub Actions ที่ต้องตรงกันทุกประการแบบไม่บังคับ
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- ลบ config trusted publisher ออกจากแพ็กเกจ
- ใช้เป็น rollback หาก workflow, repository หรือ environment pin ต้องถูก
  ปิดใช้งานหรือสร้างใหม่
- การเผยแพร่จริงในอนาคตต้องใช้การเผยแพร่แบบยืนยันตัวตนตามปกติจนกว่าจะ
  ตั้งค่า config อีกครั้ง
- flag:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### telemetry การติดตั้ง

- ส่งหลังจาก `clawhub install <slug>` เมื่อล็อกอินอยู่ เว้นแต่
  จะตั้งค่า `CLAWHUB_DISABLE_TELEMETRY=1`
- การรายงานเป็นแบบ best-effort คำสั่งติดตั้งจะไม่ล้มเหลวหาก telemetry
  ใช้งานไม่ได้
- รายละเอียด: `docs/telemetry.md`
