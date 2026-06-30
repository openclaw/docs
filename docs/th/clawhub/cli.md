---
read_when:
    - การใช้ ClawHub CLI
    - การดีบักการติดตั้ง การอัปเดต หรือการเผยแพร่
summary: 'ข้อมูลอ้างอิง CLI: คำสั่ง แฟล็ก การกำหนดค่า และพฤติกรรมของ lockfile'
x-i18n:
    generated_at: "2026-06-30T14:30:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63cdf64a1d5abe87ee475869fdb199053b7b4374962b03e91e822ddef3cad8e8
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

แพ็กเกจ CLI: `clawhub`, ไบนารี: `clawhub`

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

## แฟล็กส่วนกลาง

- `--workdir <dir>`: ไดเรกทอรีทำงาน (ค่าเริ่มต้น: cwd; ถอยกลับไปใช้พื้นที่ทำงานของ Clawdbot หากกำหนดค่าไว้)
- `--dir <dir>`: ไดเรกทอรีติดตั้งภายใต้ไดเรกทอรีทำงาน (ค่าเริ่มต้น: `skills`)
- `--site <url>`: URL ฐานสำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `https://clawhub.ai`)
- `--registry <url>`: URL ฐานของ API (ค่าเริ่มต้น: ค้นพบอัตโนมัติ มิฉะนั้นใช้ `https://clawhub.ai`)
- `--no-input`: ปิดใช้งานพรอมป์

ตัวแปรสภาพแวดล้อมที่เทียบเท่า:

- `CLAWHUB_SITE` (แบบเดิม `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (แบบเดิม `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (แบบเดิม `CLAWDHUB_WORKDIR`)

### พร็อกซี HTTP

CLI เคารพตัวแปรสภาพแวดล้อมพร็อกซี HTTP มาตรฐานสำหรับระบบที่อยู่หลัง
พร็อกซีองค์กรหรือเครือข่ายที่ถูกจำกัด:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

เมื่อตั้งค่าตัวแปรใดๆ เหล่านี้ CLI จะส่งคำขอขาออกผ่าน
พร็อกซีที่ระบุ `HTTPS_PROXY` ใช้สำหรับคำขอ HTTPS, `HTTP_PROXY`
ใช้สำหรับ HTTP ปกติ ระบบจะเคารพ `NO_PROXY` / `no_proxy` เพื่อข้ามพร็อกซีสำหรับ
โฮสต์หรือโดเมนที่ระบุ

สิ่งนี้จำเป็นบนระบบที่บล็อกการเชื่อมต่อขาออกโดยตรง
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

เก็บโทเค็น API ของคุณและ URL รีจิสทรีที่แคชไว้

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` หรือ `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- ทางเลือกถอยกลับแบบเดิม: หาก `clawhub/config.json` ยังไม่มีอยู่ แต่ `clawdhub/config.json` มีอยู่ CLI จะใช้พาธแบบเดิมซ้ำ
- แทนที่ค่า: `CLAWHUB_CONFIG_PATH` (แบบเดิม `CLAWDHUB_CONFIG_PATH`)

## คำสั่ง

### `login` / `auth login`

- ค่าเริ่มต้น: เปิดเบราว์เซอร์ไปที่ `<site>/cli/auth` และดำเนินการให้เสร็จผ่านคอลแบ็กแบบ loopback
- ไม่มีส่วนติดต่อกราฟิก: `clawhub login --token clh_...`
- โต้ตอบระยะไกล/ไม่มีส่วนติดต่อกราฟิก: `clawhub login --device` พิมพ์รหัสและรอระหว่างที่คุณอนุมัติที่ `<site>/cli/device`

### `whoami`

- ตรวจสอบโทเค็นที่จัดเก็บไว้ผ่าน `/api/v1/whoami`

### `token`

- พิมพ์โทเค็น API ที่จัดเก็บไว้ไปยังเอาต์พุตมาตรฐาน
- มีประโยชน์สำหรับส่งโทเค็นเข้าสู่ระบบในเครื่องไปยังคำสั่งตั้งค่าความลับของ CI ผ่านไพป์

### `star <skill>` / `unstar <skill>`

- เพิ่ม/ลบสกิลออกจากรายการเด่นของคุณ
- เรียก `POST /api/v1/stars/<slug>` และ `DELETE /api/v1/stars/<slug>`
- `--yes` ข้ามการยืนยัน

### `search <query...>`

- เรียก `/api/v1/search?q=...`
- เอาต์พุตประกอบด้วยชื่อย่อระบุของสกิล, ชื่อบัญชีเจ้าของ, ชื่อที่แสดง และคะแนนความเกี่ยวข้อง
- การค้นหาจะให้ความสำคัญกับการจับคู่โทเค็นชื่อย่อระบุ/ชื่อแบบตรงตัวก่อนความนิยมจากการดาวน์โหลด โทเค็นชื่อย่อระบุเดี่ยว เช่น `map` จะจับคู่กับ `personal-map` ได้แรงกว่าสตริงย่อยภายใน `amap`
- ความนิยมเป็นปัจจัยจัดอันดับล่วงหน้าขนาดเล็ก ไม่ใช่การรับประกันว่าจะอยู่ตำแหน่งบนสุด
- หากสกิลควรปรากฏแต่ไม่ปรากฏ ให้เรียก `clawhub inspect @owner/slug` ขณะเข้าสู่ระบบเพื่อตรวจสอบการวินิจฉัยการกลั่นกรองที่เจ้าของมองเห็นได้ก่อนเปลี่ยนชื่อเมตาดาต้า

### `explore`

- แสดงรายการสกิลใหม่ล่าสุดผ่าน `/api/v1/skills?limit=...&sort=createdAt` (เรียงตาม `createdAt` จากมากไปน้อย)
- แฟล็ก:
  - `--limit <n>` (1-200, ค่าเริ่มต้น: 25)
  - `--sort newest|updated|rating|downloads|trending` (ค่าเริ่มต้น: newest) ชื่อแทนการเรียงลำดับการติดตั้งแบบเดิมยังคงใช้งานได้เพื่อความเข้ากันได้
  - `--json` (เอาต์พุตที่เครื่องอ่านได้)
- เอาต์พุต: `<slug>  v<version>  <age>  <summary>` (สรุปถูกตัดให้เหลือ 50 อักขระ)

### `inspect @owner/slug`

- ดึงเมตาดาต้าของสกิลและไฟล์เวอร์ชันโดยไม่ติดตั้ง
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: ล่าสุด)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-200)
- `--files`: แสดงไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (ไฟล์ข้อความเท่านั้น; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `install @owner/slug`

- แก้หาเวอร์ชันล่าสุดสำหรับเจ้าของและสกิลที่ระบุ
- ดาวน์โหลดไฟล์ซิปผ่าน `/api/v1/download`
- แตกไฟล์ไปยัง `<workdir>/<dir>/<slug>`
- ปฏิเสธการเขียนทับสกิลที่ปักหมุดไว้; เรียก `clawhub unpin <skill>` ก่อน
- เขียน:
  - `<workdir>/.clawhub/lock.json` (แบบเดิม `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (แบบเดิม `.clawdhub`)

### `uninstall <skill>`

- ลบ `<workdir>/<dir>/<slug>` และลบรายการในไฟล์ล็อก
- ส่งเทเลเมทรีแบบพยายามให้ดีที่สุดขณะเข้าสู่ระบบ เพื่อให้สามารถ
  ปิดใช้งานจำนวนการติดตั้งปัจจุบันได้
- แบบโต้ตอบ: ขอการยืนยัน
- ไม่โต้ตอบ (`--no-input`): ต้องใช้ `--yes`

### `list`

- อ่าน `<workdir>/.clawhub/lock.json` (แบบเดิม `.clawdhub`)
- แสดง `pinned` ถัดจากสกิลที่ถูกตรึงด้วย `clawhub pin` รวมถึงเหตุผลเสริม

### `pin <skill>`

- ทำเครื่องหมายสกิลที่ติดตั้งแล้วว่าปักหมุดในไฟล์ล็อก
- `--reason <text>` บันทึกเหตุผลที่สกิลถูกตรึง
- สกิลที่ปักหมุดจะถูกข้ามโดย `update --all` และถูกปฏิเสธโดย `update <skill>` โดยตรง
- สกิลที่ปักหมุดยังปฏิเสธ `install --force` เพื่อไม่ให้ไบต์ในเครื่องถูกแทนที่โดยไม่ตั้งใจ

### `unpin <skill>`

- ลบการปักหมุดในไฟล์ล็อกออกจากสกิลที่ติดตั้งแล้ว เพื่อให้การอัปเดตในอนาคตแก้ไขได้

### `update [@owner/slug]` / `update --all`

- คำนวณลายนิ้วมือจากไฟล์ในเครื่อง
- หากลายนิ้วมือตรงกับเวอร์ชันที่รู้จัก: ไม่มีพรอมป์
- หากลายนิ้วมือไม่ตรงกัน:
  - ปฏิเสธโดยค่าเริ่มต้น
  - เขียนทับด้วย `--force` (หรือพรอมป์ หากเป็นแบบโต้ตอบ)
- สกิลที่ปักหมุดจะไม่ถูกอัปเดตโดย `--force` เด็ดขาด
- `update <skill>` ล้มเหลวทันทีสำหรับสกิลที่ปักหมุดและบอกให้คุณเรียก `clawhub unpin <skill>` ก่อน
- `update --all` ข้ามชื่อย่อระบุที่ปักหมุดไว้และพิมพ์สรุปว่าสิ่งใดยังคงถูกตรึงอยู่

### `skill publish <path>`

- เปรียบเทียบลายนิ้วมือของบันเดิลในเครื่องกับ ClawHub และออกสำเร็จเมื่อ
  เนื้อหาถูกเผยแพร่แล้ว
- สกิลใหม่มีค่าเริ่มต้นเป็น `1.0.0`; สกิลที่เปลี่ยนแปลงมีค่าเริ่มต้นเป็นเวอร์ชันแพตช์ถัดไป
- `--version <version>` เลือกเวอร์ชันอย่างชัดเจนและเผยแพร่แม้เมื่อ
  เนื้อหาตรงกับเวอร์ชันที่มีอยู่แล้ว
- `--dry-run` แก้การเผยแพร่โดยไม่อัปโหลด; `--json` พิมพ์ผลลัพธ์
  ที่เครื่องอ่านได้
- `--owner <handle>` เผยแพร่ภายใต้ชื่อบัญชีผู้เผยแพร่ขององค์กร/ผู้ใช้ เมื่อ
  ผู้ดำเนินการมีสิทธิ์เข้าถึงผู้เผยแพร่
- `--migrate-owner` ย้ายสกิลที่มีอยู่ไปยัง `--owner` พร้อมกับเผยแพร่
  เวอร์ชันใหม่ ต้องมีสิทธิ์ผู้ดูแลระบบ/เจ้าของกับผู้เผยแพร่ทั้งสองฝ่าย
- อธิบายพฤติกรรมเจ้าของและการตรวจทานไว้ใน `docs/publishing.md`
- การเผยแพร่สกิลหมายความว่าสกิลนั้นถูกเผยแพร่ภายใต้ `MIT-0` บน ClawHub
- สกิลที่เผยแพร่แล้วใช้งาน แก้ไข และแจกจ่ายซ้ำได้ฟรีโดยไม่ต้องระบุที่มา
- ClawHub ไม่รองรับสกิลแบบชำระเงินหรือการตั้งราคาต่อสกิล
- ชื่อแทนแบบเดิม: `publish <path>`

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

เวิร์กโฟลว์ที่ใช้ซ้ำได้ของ ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
เรียก `skill publish` สำหรับ `skill_path` หนึ่งรายการ หรือสำหรับแต่ละโฟลเดอร์สกิลโดยตรง
ภายใต้ `root` (ค่าเริ่มต้น: `skills`) เวิร์กโฟลว์จะข้ามสกิลที่ไม่เปลี่ยนแปลงและใช้
พฤติกรรมเพิ่มเวอร์ชันแพตช์อัตโนมัติแบบเดียวกัน

ตั้งค่า `dry_run: true` เพื่อดูตัวอย่างโดยไม่ต้องใช้โทเค็น การเผยแพร่จริงต้องใช้
ความลับ `clawhub_token`

### `sync`

- สแกนไดเรกทอรีทำงานปัจจุบัน, ไดเรกทอรีสกิลที่กำหนดค่าไว้ และโฟลเดอร์
  `--root <dir>` ใดๆ เพื่อหาโฟลเดอร์สกิลในเครื่องที่มี `SKILL.md` หรือ
  `skill.md`
- เปรียบเทียบลายนิ้วมือของแต่ละสกิลในเครื่องกับ ClawHub และเผยแพร่เฉพาะสกิลใหม่หรือ
  สกิลที่เปลี่ยนแปลง
- สกิลใหม่เผยแพร่เป็น `1.0.0`; สกิลที่เปลี่ยนแปลงจะเผยแพร่เวอร์ชันแพตช์ถัดไป
  โดยค่าเริ่มต้น ใช้ `--bump minor|major` สำหรับชุดอัปเดตที่ควรขยับด้วย
  ขั้น semver ที่ใหญ่กว่า
- `--dry-run` แสดงแผนการเผยแพร่โดยไม่อัปโหลด; `--json` พิมพ์แผน
  ที่เครื่องอ่านได้
- `--all` เผยแพร่ทุกสกิลใหม่หรือสกิลที่เปลี่ยนแปลงโดยไม่ต้องพรอมป์ หากไม่มี
  `--all` เทอร์มินัลแบบโต้ตอบจะให้คุณเลือกสกิลที่จะเผยแพร่
- `--owner <handle>` เผยแพร่ภายใต้ชื่อบัญชีผู้เผยแพร่ขององค์กร/ผู้ใช้ เมื่อ
  ผู้ดำเนินการมีสิทธิ์เข้าถึงผู้เผยแพร่
- `sync` เป็นการเผยแพร่ทางเดียวเท่านั้น ไม่ติดตั้ง อัปเดต ดาวน์โหลด หรือ
  รายงานเทเลเมทรีการติดตั้ง/ดาวน์โหลด

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- ต้องใช้ `clawhub login`
- เรียกใช้ ClawHub ClawScan ผ่าน `POST /api/v1/skills/-/scan` จากนั้นโพลจนกว่าการสแกนจะอยู่ในสถานะสิ้นสุด
- การสแกนเป็นแบบไม่พร้อมกันและอาจใช้เวลาจึงจะเสร็จ ระหว่างอยู่ในคิว ตัวหมุนในเทอร์มินัลจะแสดงตำแหน่งการสแกนที่จัดลำดับความสำคัญปัจจุบันและจำนวนการสแกนที่อยู่ข้างหน้า
- การสแกนที่เผยแพร่แล้วต้องมีสิทธิ์ความเป็นเจ้าของหรือสิทธิ์จัดการผู้เผยแพร่ ผู้ดูแลการกลั่นกรอง/ผู้ดูแลระบบสามารถใช้แบ็กเอนด์เดียวกันผ่าน `clawhub-admin`
- `--update` ใช้ได้เฉพาะกับ `--slug`; จะเขียนผลการสแกนที่เผยแพร่แล้วและสำเร็จกลับไปยังเวอร์ชันที่เลือก
- `--output <file.zip>` ดาวน์โหลดไฟล์เก็บรายงานฉบับเต็มพร้อม `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`
- `--json` พิมพ์การตอบกลับการโพลฉบับเต็มสำหรับระบบอัตโนมัติ
- ไม่รองรับการสแกนพาธในเครื่องอีกต่อไป ให้อัปโหลดเวอร์ชันใหม่ จากนั้นใช้ `scan download` เพื่อดึงผลการสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งนั้น

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- ต้องใช้ `clawhub login`
- ดาวน์โหลด ZIP รายงานการสแกนที่จัดเก็บไว้สำหรับเวอร์ชันสกิลหรือ Plugin ที่ส่ง รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อนโดยการตรวจสอบความปลอดภัยของ ClawHub
- การดาวน์โหลดสกิลใช้ชื่อย่อระบุของสกิลและมีค่าเริ่มต้นเป็น `--kind skill`
- การดาวน์โหลด Plugin ใช้ชื่อแพ็กเกจและต้องใช้ `--kind plugin`
- ต้องระบุ `--version` เพื่อให้ผู้เขียนตรวจสอบเวอร์ชันที่ส่งจริงซึ่ง ClawHub บล็อก
- `--output <file.zip>` เลือกพาธปลายทาง

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub จัดส่งเวิร์กโฟลว์ทางการที่ใช้ซ้ำได้ไว้ที่
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/919f047373fb1836301c5e42f20ad8c2c2201fc5/.github/workflows/skill-publish.yml)
สำหรับคลังสกิลและคลังแค็ตตาล็อก

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

- `root` มีค่าเริ่มต้นเป็น `skills` สำหรับคลังแค็ตตาล็อก
- ส่ง `skill_path: skills/review-helper` เพื่อประมวลผลโฟลเดอร์สกิลหนึ่งโฟลเดอร์
- `owner` แมปกับแฟล็ก CLI `--owner`; ละไว้เพื่อเผยแพร่ในฐานะผู้ใช้ที่ผ่านการยืนยันตัวตน
- การเผยแพร่สกิล V1 ใช้ `clawhub_token`; การเผยแพร่ที่เชื่อถือได้ด้วย GitHub OIDC สำหรับตอนนี้เป็นแบบแพ็กเกจเท่านั้น

### `delete <skill>`

- หากไม่มี `--version` ให้ลบสกิลแบบซ่อน (เจ้าของ ผู้ควบคุม หรือผู้ดูแลระบบ)
- เรียก `DELETE /api/v1/skills/{slug}`
- การลบแบบซ่อนที่เริ่มโดยเจ้าของจะกัน slug ไว้ 30 วัน; คำสั่งจะแสดงเวลาหมดอายุ
- `--version <version>` จะลบเวอร์ชันหนึ่งที่เป็นเจ้าของและไม่ใช่เวอร์ชันล่าสุดอย่างถาวรผ่านเส้นทางเฉพาะเวอร์ชัน
  ที่ล้มเหลวแบบปิดกั้น
  เวอร์ชันที่ถูกลบแล้วไม่สามารถกู้คืนหรือเผยแพร่ซ้ำได้ เผยแพร่ตัวแทนก่อนลบ
  เวอร์ชันล่าสุดปัจจุบัน เจ้าหน้าที่แพลตฟอร์มจะไม่ข้ามสิทธิ์ความเป็นเจ้าของสำหรับโฟลว์เฉพาะเวอร์ชันนี้
- `--reason <text>` บันทึกหมายเหตุการควบคุมบนการลบแบบซ่อนทั้งสกิลและบันทึกตรวจสอบ
- `--note <text>` เป็นนามแฝงของ `--reason`
- `--yes` ข้ามการยืนยัน

### `undelete <skill>`

- กู้คืนสกิลที่ถูกซ่อน (เจ้าของ ผู้ควบคุม หรือผู้ดูแลระบบ)
- ไม่มีการกู้คืนเวอร์ชัน; เวอร์ชันที่ถูกลบถาวรไม่สามารถกู้คืนได้
- เรียก `POST /api/v1/skills/{slug}/undelete`
- `--reason <text>` บันทึกหมายเหตุการควบคุมบนสกิลและบันทึกตรวจสอบ
- `--note <text>` เป็นนามแฝงของ `--reason`
- `--yes` ข้ามการยืนยัน

### `hide <skill>`

- ซ่อนสกิล (เจ้าของ ผู้ควบคุม หรือผู้ดูแลระบบ)
- นามแฝงของ `delete`

### `unhide <skill>`

- เลิกซ่อนสกิล (เจ้าของ ผู้ควบคุม หรือผู้ดูแลระบบ)
- นามแฝงของ `undelete`

### `skill rename <skill> <new-name>`

- เปลี่ยนชื่อสกิลที่เป็นเจ้าของและเก็บ slug เดิมไว้เป็นนามแฝงสำหรับเปลี่ยนเส้นทาง
- เรียก `POST /api/v1/skills/{slug}/rename`
- `--yes` ข้ามการยืนยัน

### `skill merge <source> <target>`

- รวมสกิลที่เป็นเจ้าของหนึ่งรายการเข้ากับสกิลที่เป็นเจ้าของอีกหนึ่งรายการ
- slug ต้นทางจะหยุดแสดงแบบสาธารณะและกลายเป็นนามแฝงสำหรับเปลี่ยนเส้นทางไปยังเป้าหมาย
- เรียก `POST /api/v1/skills/{sourceSlug}/merge`
- `--yes` ข้ามการยืนยัน

### `transfer`

- เวิร์กโฟลว์การโอนความเป็นเจ้าของ
- การโอนไปยังแฮนเดิลผู้ใช้จะสร้างคำขอที่รอดำเนินการให้ผู้รับยอมรับ
- การโอนไปยังแฮนเดิลองค์กร/ผู้เผยแพร่จะมีผลทันทีเฉพาะเมื่อผู้ดำเนินการมี
  สิทธิ์ผู้ดูแลระบบทั้งกับเจ้าของปัจจุบันและผู้เผยแพร่ปลายทาง
- คำสั่งย่อย:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- เอ็นด์พอยต์:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- เรียกดูหรือค้นหาแค็ตตาล็อกแพ็กเกจรวมผ่าน `GET /api/v1/packages` และ `GET /api/v1/packages/search`
- ใช้สิ่งนี้สำหรับ plugins และรายการตระกูลแพ็กเกจอื่นๆ; `search` ระดับบนยังคงเป็นพื้นผิวการค้นหาสกิล
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
- ใช้สิ่งนี้สำหรับข้อมูลเมตา Plugin, ความเข้ากันได้, การตรวจสอบยืนยัน, ซอร์ส และการตรวจสอบเวอร์ชัน/ไฟล์
- `--version <version>`: ตรวจสอบเวอร์ชันเฉพาะ (ค่าเริ่มต้น: ล่าสุด)
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
- ตรวจสอบ SHA-256 ของ ClawHub สำหรับอาร์ติแฟกต์ทั้งหมด
- สำหรับอาร์ติแฟกต์ ClawPack npm-pack จะตรวจสอบความถูกต้อง `sha512` ของ npm,
  shasum ของ npm และชื่อ/เวอร์ชัน `package.json` ของ tarball เพิ่มเติม
- เวอร์ชัน ZIP แบบเดิมจะดาวน์โหลดผ่านเส้นทาง ZIP แบบเดิม
- แฟล็ก:
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

- คำนวณ SHA-256 ของ ClawHub, ความถูกต้อง `sha512` ของ npm และ shasum ของ npm สำหรับอาร์ติแฟกต์
  ในเครื่อง
- เมื่อใช้ `--package` จะแก้ข้อมูลเมตาที่คาดหวังจาก ClawHub และเปรียบเทียบ
  ไฟล์ในเครื่องกับข้อมูลเมตาอาร์ติแฟกต์ที่เผยแพร่
- เมื่อใช้แฟล็ก digest โดยตรง จะตรวจสอบโดยไม่ค้นหาผ่านเครือข่าย
- แฟล็ก:
  - `--package <name>`: ชื่อแพ็กเกจสำหรับแก้ข้อมูลเมตาอาร์ติแฟกต์ที่คาดหวัง
  - `--version <version>` หรือ `--tag <tag>`: เวอร์ชันแพ็กเกจที่คาดหวัง
  - `--sha256 <hex>`: SHA-256 ของ ClawHub ที่คาดหวัง
  - `--npm-integrity <sri>`: ความถูกต้อง npm ที่คาดหวัง
  - `--npm-shasum <sha1>`: shasum ของ npm ที่คาดหวัง
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- รัน Plugin Inspector ที่มาพร้อมกับ ClawHub CLI กับโฟลเดอร์แพ็กเกจ Plugin
  ในเครื่อง
- ค่าเริ่มต้นคือการตรวจสอบแบบออฟไลน์/สถิต โดยไม่ค้นหาหรือนำเข้า checkout ของ
  OpenClaw ในเครื่อง
- ข้อผิดพลาดความเข้ากันได้ร้ายแรงจะออกด้วยรหัสไม่เป็นศูนย์ ผลการตรวจพบที่เป็นคำเตือนเท่านั้นจะถูกพิมพ์ออกมาแต่
  ออกด้วยรหัสศูนย์
- แฟล็ก:
  - `--out <dir>`: เขียนรายงาน Plugin Inspector ไปยังไดเรกทอรีนี้
  - `--openclaw <path>`: ตรวจสอบกับ checkout ของ OpenClaw ในเครื่องแบบระบุชัดเจน
  - `--runtime`: เปิดใช้การจับข้อมูล runtime; นำเข้าโค้ด Plugin
  - `--allow-execute`: อนุญาตการจับข้อมูล runtime ในเวิร์กสเปซที่แยกไว้
  - `--no-mock-sdk`: ปิดใช้ OpenClaw SDK จำลองระหว่างการจับข้อมูล runtime
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package validate ./example-plugin
```

หากการตรวจสอบรายงานผลการตรวจพบเกี่ยวกับแพ็กเกจ manifest การนำเข้า SDK หรืออาร์ติแฟกต์ โปรดดู
[การแก้ไขการตรวจสอบ Plugin](/clawhub/plugin-validation-fixes) แล้วรันคำสั่งอีกครั้ง

### `package delete <name>`

- หากไม่มี `--version` ให้ลบแพ็กเกจและทุก release แบบซ่อน
- `--version <version>` จะลบ release หนึ่งที่เป็นเจ้าของและไม่ใช่ล่าสุดอย่างถาวรผ่านเส้นทางเฉพาะเวอร์ชัน
  ที่ล้มเหลวแบบปิดกั้น
  เวอร์ชันที่ถูกลบแล้วไม่สามารถกู้คืนหรือเผยแพร่ซ้ำได้ เผยแพร่ตัวแทนก่อนลบ
  เวอร์ชันล่าสุดปัจจุบัน โฟลว์เฉพาะเวอร์ชันนี้ต้องใช้เจ้าของแพ็กเกจหรือผู้ดูแลระบบผู้เผยแพร่องค์กร;
  เจ้าหน้าที่แพลตฟอร์มจะไม่ข้ามสิทธิ์ความเป็นเจ้าของแพ็กเกจ
- การลบแบบซ่อนทั้งแพ็กเกจต้องใช้เจ้าของแพ็กเกจ เจ้าของ/ผู้ดูแลระบบผู้เผยแพร่องค์กร ผู้ควบคุม
  แพลตฟอร์ม หรือผู้ดูแลระบบแพลตฟอร์ม
- แฟล็ก:
  - `--version <version>`: ลบเวอร์ชันหนึ่งที่ไม่ใช่ล่าสุดอย่างถาวร
  - `--yes`: ข้ามการยืนยัน
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- กู้คืนแพ็กเกจและ release ที่ถูกลบแบบซ่อน
- ไม่มีการกู้คืนเวอร์ชัน; เวอร์ชันที่ถูกลบถาวรไม่สามารถกู้คืนได้
- ต้องใช้เจ้าของแพ็กเกจ เจ้าของ/ผู้ดูแลระบบผู้เผยแพร่องค์กร ผู้ควบคุมแพลตฟอร์ม
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
- ต้องมีสิทธิ์ผู้ดูแลระบบทั้งกับเจ้าของแพ็กเกจปัจจุบันและผู้เผยแพร่
  ปลายทาง เว้นแต่ดำเนินการโดยผู้ดูแลระบบแพลตฟอร์ม
- ชื่อแพ็กเกจแบบมี scope ต้องโอนไปยังเจ้าของ scope ที่ตรงกัน
- เรียก `POST /api/v1/packages/{name}/transfer`
- แฟล็ก:
  - `--to <owner>`: แฮนเดิลผู้เผยแพร่ปลายทาง
  - `--reason <text>`: เหตุผลการตรวจสอบเสริม
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- คำสั่งที่ต้องยืนยันตัวตนสำหรับรายงานแพ็กเกจต่อผู้ควบคุม
- เรียก `POST /api/v1/packages/{name}/report`
- รายงานอยู่ในระดับแพ็กเกจ อาจผูกกับเวอร์ชันได้ และจะมองเห็นได้
  สำหรับผู้ควบคุมเพื่อตรวจทาน
- รายงานจะไม่ซ่อนแพ็กเกจหรือบล็อกการดาวน์โหลดโดยอัตโนมัติด้วยตัวเอง
- แฟล็ก:
  - `--version <version>`: เวอร์ชันแพ็กเกจเสริมที่จะแนบกับรายงาน
  - `--reason <text>`: เหตุผลรายงานที่ต้องระบุ
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- คำสั่งเจ้าของสำหรับตรวจสอบการมองเห็นด้านการควบคุมของแพ็กเกจ
- เรียก `GET /api/v1/packages/{name}/moderation`
- แสดงสถานะการสแกนแพ็กเกจปัจจุบัน จำนวนรายงานที่เปิดอยู่ สถานะการควบคุมด้วยตนเองของ release
  ล่าสุด สถานะบล็อกการดาวน์โหลด และเหตุผลการควบคุม
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- ตรวจสอบว่าแพ็กเกจพร้อมสำหรับการใช้งานโดย OpenClaw ในอนาคตหรือไม่
- เรียก `GET /api/v1/packages/{name}/readiness`
- รายงานตัวบล็อกสำหรับสถานะ official, ความพร้อมใช้งานของ ClawPack, digest ของอาร์ติแฟกต์,
  แหล่งที่มาของซอร์ส, ความเข้ากันได้กับ OpenClaw, เป้าหมายโฮสต์, ข้อมูลเมตาสภาพแวดล้อม,
  และสถานะการสแกน
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- แสดงสถานะการย้ายที่มุ่งสำหรับผู้ปฏิบัติการสำหรับแพ็กเกจที่อาจแทนที่
  Plugin ของ OpenClaw ที่ bundled
- เรียกเอ็นด์พอยต์ readiness ที่คำนวณเหมือนกับ `package readiness` แต่พิมพ์
  สถานะที่เน้นการย้าย เวอร์ชันล่าสุด สถานะแพ็กเกจ official การตรวจสอบ และ
  ตัวบล็อก
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- สร้างผู้เผยแพร่องค์กรที่เป็นของผู้ใช้ที่ยืนยันตัวตนแล้ว
- handle จะถูกทำให้เป็นตัวพิมพ์เล็กและอาจส่งพร้อมหรือไม่พร้อม `@` ก็ได้
- ผู้เผยแพร่องค์กรที่สร้างใหม่จะไม่ถูกเชื่อถือ/เป็น official โดยค่าเริ่มต้น
- ล้มเหลวหาก handle ถูกใช้แล้วโดยผู้เผยแพร่ ผู้ใช้ หรือเส้นทางที่สงวนไว้ที่มีอยู่

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- เผยแพร่ Plugin แบบโค้ดหรือ Plugin แบบบันเดิลผ่าน `POST /api/v1/packages`.
- `<source>` รองรับ:
  - พาธโฟลเดอร์ในเครื่อง: `./my-plugin`
  - ไฟล์ tarball แบบ npm-pack ของ ClawPack ในเครื่อง: `./my-plugin-1.2.3.tgz`
  - GitHub repo: `owner/repo` หรือ `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- ระบบตรวจหา metadata อัตโนมัติจาก `package.json`, `openclaw.plugin.json` และ
  marker ของบันเดิล OpenClaw จริง เช่น `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` และ `.cursor-plugin/plugin.json`.
- แหล่งที่มาแบบ `.tgz` จะถูกจัดการเป็น ClawPack CLI จะอัปโหลดไบต์ npm-pack
  ตามจริง และใช้เนื้อหา `package/` ที่แตกออกมาเฉพาะสำหรับการตรวจสอบความถูกต้องและ
  การเติม metadata ล่วงหน้าเท่านั้น
- โฟลเดอร์ Plugin แบบโค้ดจะถูกแพ็กเป็น npm tarball ของ ClawPack ก่อนอัปโหลด เพื่อให้
  การติดตั้ง OpenClaw ตรวจสอบ artifact ที่ตรงกันได้ โฟลเดอร์ Plugin แบบบันเดิลยังคง
  ใช้เส้นทางเผยแพร่แบบไฟล์ที่แตกออกมา
- สำหรับแหล่งที่มาจาก GitHub ข้อมูลอ้างอิงแหล่งที่มาจะถูกเติมอัตโนมัติจาก repo, commit ที่ resolve แล้ว, ref และ subpath
- สำหรับโฟลเดอร์ในเครื่อง ข้อมูลอ้างอิงแหล่งที่มาจะถูกตรวจหาอัตโนมัติจาก git ในเครื่องเมื่อ origin remote ชี้ไปที่ GitHub
- Plugin แบบโค้ดภายนอกต้องประกาศ `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion` อย่างชัดเจน
  `package.json.version` ระดับบนสุดจะไม่ถูกใช้เป็น fallback สำหรับการตรวจสอบการเผยแพร่
- `--dry-run` แสดงตัวอย่าง payload การเผยแพร่ที่ resolve แล้วโดยไม่อัปโหลด
- `--json` ส่งออกเอาต์พุตที่เครื่องอ่านได้สำหรับ CI
- `--owner <handle>` เผยแพร่ภายใต้ handle ของผู้เผยแพร่ที่เป็นผู้ใช้หรือองค์กร เมื่อ actor มีสิทธิ์ผู้เผยแพร่
- ชื่อแพ็กเกจแบบ scoped ต้องตรงกับ owner ที่เลือก ดู `docs/publishing.md`
- flag ที่มีอยู่ (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ยังคงใช้เป็น override ได้
- repo GitHub ส่วนตัวต้องใช้ `GITHUB_TOKEN`

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### โฟลว์ในเครื่องที่แนะนำ

ใช้ `--dry-run` ก่อน เพื่อให้คุณยืนยัน metadata ของแพ็กเกจที่ resolve แล้วและ
ข้อมูลอ้างอิงแหล่งที่มาได้ก่อนสร้าง release จริง:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### โฟลว์โฟลเดอร์ในเครื่อง

สำหรับ Plugin แบบโค้ด การเผยแพร่จากโฟลเดอร์จะสร้างและอัปโหลด artifact ของ ClawPack จาก
โฟลเดอร์แพ็กเกจ:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` ขั้นต่ำสำหรับ `--family code-plugin`

Plugin แบบโค้ดภายนอกต้องมี metadata ของ OpenClaw จำนวนเล็กน้อยใน
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
  fallback สำหรับการตรวจสอบความเข้ากันได้/การ build ของ OpenClaw
- `openclaw.hostTargets` และ `openclaw.environment` เป็น metadata ทางเลือก
  ClawHub อาจแสดงข้อมูลเหล่านี้เมื่อมีอยู่ แต่ไม่จำเป็นสำหรับการเผยแพร่
- `openclaw.compat.minGatewayVersion` และ
  `openclaw.build.pluginSdkVersion` เป็นข้อมูลเพิ่มเติมทางเลือก หากคุณต้องการเผยแพร่
  metadata ความเข้ากันได้ที่ละเอียดขึ้น
- หากคุณใช้ release ของ CLI `clawhub` รุ่นเก่า ให้อัปเกรดก่อนเผยแพร่ เพื่อให้
  การตรวจสอบ preflight ในเครื่องทำงานก่อนอัปโหลด
- หากการตรวจสอบรายงาน remediation code ให้ดู
  [การแก้ไขการตรวจสอบความถูกต้องของ Plugin](/clawhub/plugin-validation-fixes)

#### GitHub Actions

ClawHub ยังมาพร้อม workflow ที่นำกลับมาใช้ใหม่อย่างเป็นทางการที่
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/919f047373fb1836301c5e42f20ad8c2c2201fc5/.github/workflows/package-publish.yml)
สำหรับ repo ของ Plugin

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

- workflow ที่นำกลับมาใช้ใหม่จะตั้งค่าเริ่มต้นของ `source` เป็น repo ของ caller
- สำหรับ monorepo ให้ส่ง `source_path` เพื่อให้ workflow เผยแพร่โฟลเดอร์แพ็กเกจ
  Plugin เช่น `source_path: extensions/codex`
- ตรึง workflow ที่นำกลับมาใช้ใหม่ไว้กับ tag ที่เสถียรหรือ SHA commit แบบเต็ม อย่ารันการเผยแพร่ release จาก `@main`
- `pull_request` ควรใช้ `dry_run: true` เพื่อให้ CI ไม่สร้างผลข้างเคียง
- การเผยแพร่จริงควรจำกัดไว้กับ event ที่เชื่อถือได้ เช่น `workflow_dispatch` หรือการ push tag
- การเผยแพร่แบบ trusted โดยไม่มี secret ใช้ได้เฉพาะบน `workflow_dispatch`; การ push tag ยังต้องใช้ `clawhub_token`
- เก็บ `clawhub_token` ให้พร้อมใช้สำหรับการเผยแพร่ครั้งแรก แพ็กเกจที่ไม่น่าเชื่อถือ หรือการเผยแพร่แบบ break-glass
- workflow จะอัปโหลดผลลัพธ์ JSON เป็น artifact และเปิดเผยเป็นเอาต์พุตของ workflow

### `package trusted-publisher get <name>`

- แสดง config trusted publisher ของ GitHub Actions สำหรับแพ็กเกจ
- ใช้หลังจากตั้งค่า config เพื่อยืนยัน repository, ชื่อไฟล์ workflow
  และ environment pin ทางเลือก
- flag:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- แนบหรือแทนที่ config trusted publisher ของ GitHub Actions สำหรับแพ็กเกจ
  ที่มีอยู่
- ต้องสร้างแพ็กเกจก่อนผ่าน `clawhub package publish` แบบปกติที่เป็น manual หรือ
  token-authenticated
- หลังจากตั้งค่า config แล้ว การเผยแพร่ผ่าน GitHub Actions ที่รองรับในอนาคตสามารถใช้
  OIDC/trusted publishing ได้โดยไม่ต้องใช้ token ของ ClawHub ที่มีอายุยาว
- `--repository <repo>` ต้องเป็น `owner/repo`
- `--workflow-filename <file>` ต้องตรงกับชื่อไฟล์ workflow ใน
  `.github/workflows/`
- `--environment <name>` เป็นทางเลือก เมื่อกำหนดค่าแล้ว environment ของ GitHub Actions
  ใน OIDC claim ต้องตรงกันทุกประการ
- ClawHub ตรวจสอบ repository GitHub ที่กำหนดค่าไว้เมื่อคำสั่งนี้ทำงาน
  repository สาธารณะสามารถตรวจสอบผ่าน metadata สาธารณะของ GitHub ได้ repository
  ส่วนตัวต้องให้ ClawHub มีสิทธิ์เข้าถึง GitHub สำหรับ repository นั้น เช่น
  ผ่านการติดตั้ง GitHub App ของ ClawHub ในอนาคต หรือ integration ของ GitHub อื่น
  ที่ได้รับอนุญาต
- flag:
  - `--repository <repo>`: repository GitHub เช่น `openclaw/example-plugin`
  - `--workflow-filename <file>`: ชื่อไฟล์ workflow เช่น `package-publish.yml`
  - `--environment <name>`: environment ของ GitHub Actions ที่ต้องตรงกันทุกประการแบบทางเลือก
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
- ใช้เป็น rollback หากต้องปิดใช้งานหรือสร้าง workflow, repository หรือ environment pin
  ใหม่
- การเผยแพร่จริงในอนาคตต้องใช้การเผยแพร่แบบ authenticated ปกติจนกว่าจะตั้งค่า config
  อีกครั้ง
- flag:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### telemetry การติดตั้ง

- ส่งหลังจาก `clawhub install <slug>` เมื่อเข้าสู่ระบบแล้ว เว้นแต่
  จะตั้งค่า `CLAWHUB_DISABLE_TELEMETRY=1`
- การรายงานเป็นแบบ best-effort คำสั่งติดตั้งจะไม่ล้มเหลวหาก telemetry
  ไม่พร้อมใช้งาน
- รายละเอียด: `docs/telemetry.md`
