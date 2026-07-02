---
read_when:
    - การใช้ ClawHub CLI
    - การดีบักการติดตั้ง การอัปเดต หรือการเผยแพร่
summary: 'ข้อมูลอ้างอิง CLI: คำสั่ง แฟล็ก การกำหนดค่า และพฤติกรรมของไฟล์ล็อก'
x-i18n:
    generated_at: "2026-07-02T01:18:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8af3d4d7c689fd0dc774354f275dd75fa44ec723880e3895d980a755f81a7d
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

## แฟล็กส่วนกลาง

- `--workdir <dir>`: ไดเรกทอรีทำงาน (ค่าเริ่มต้น: cwd; ถ้ากำหนดไว้ จะถอยกลับไปใช้พื้นที่ทำงานของ Clawdbot)
- `--dir <dir>`: ไดเรกทอรีติดตั้งใต้ workdir (ค่าเริ่มต้น: `skills`)
- `--site <url>`: URL ฐานสำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `https://clawhub.ai`)
- `--registry <url>`: URL ฐานของ API (ค่าเริ่มต้น: ค้นพบอัตโนมัติ มิฉะนั้นใช้ `https://clawhub.ai`)
- `--no-input`: ปิดใช้พรอมป์

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

เมื่อตั้งค่าตัวแปรเหล่านี้ใด ๆ CLI จะส่งคำขอขาออกผ่าน
พร็อกซีที่ระบุ `HTTPS_PROXY` ใช้สำหรับคำขอ HTTPS, `HTTP_PROXY`
ใช้สำหรับ HTTP ธรรมดา และรองรับ `NO_PROXY` / `no_proxy` เพื่อข้ามพร็อกซีสำหรับ
โฮสต์หรือโดเมนเฉพาะ

สิ่งนี้จำเป็นบนระบบที่บล็อกการเชื่อมต่อขาออกโดยตรง
(เช่น คอนเทนเนอร์ Docker, Hetzner VPS ที่ใช้อินเทอร์เน็ตผ่านพร็อกซีเท่านั้น, ไฟร์วอลล์องค์กร)

ตัวอย่าง:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

เมื่อไม่ได้ตั้งค่าตัวแปรพร็อกซี ลักษณะการทำงานจะไม่เปลี่ยนแปลง (เชื่อมต่อโดยตรง)

## ไฟล์คอนฟิก

จัดเก็บโทเค็น API ของคุณ + URL registry ที่แคชไว้

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` หรือ `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- ทางถอยกลับเดิม: หาก `clawhub/config.json` ยังไม่มีอยู่ แต่มี `clawdhub/config.json` CLI จะนำพาธเดิมกลับมาใช้
- เขียนทับค่า: `CLAWHUB_CONFIG_PATH` (เดิม `CLAWDHUB_CONFIG_PATH`)

## คำสั่ง

### `login` / `auth login`

- ค่าเริ่มต้น: เปิดเบราว์เซอร์ไปที่ `<site>/cli/auth` และทำให้เสร็จผ่านคอลแบ็ก loopback
- Headless: `clawhub login --token clh_...`
- รีโมต/headless แบบโต้ตอบ: `clawhub login --device` พิมพ์รหัสและรอขณะที่คุณอนุญาตที่ `<site>/cli/device`

### `whoami`

- ตรวจสอบโทเค็นที่จัดเก็บผ่าน `/api/v1/whoami`

### `token`

- พิมพ์โทเค็น API ที่จัดเก็บไปยัง stdout
- มีประโยชน์สำหรับการ pipe โทเค็นเข้าสู่ระบบในเครื่องไปยังคำสั่งตั้งค่า secret ของ CI

### `star <skill>` / `unstar <skill>`

- เพิ่ม/ลบสกิลออกจากรายการเด่นของคุณ
- เรียก `POST /api/v1/stars/<slug>` และ `DELETE /api/v1/stars/<slug>`
- `--yes` ข้ามการยืนยัน

### `search <query...>`

- เรียก `/api/v1/search?q=...`
- เอาต์พุตมี slug ของสกิล, แฮนเดิลเจ้าของ, ชื่อที่แสดง และคะแนนความเกี่ยวข้อง
- การค้นหาให้ความสำคัญกับการตรงกันแบบเป๊ะของโทเค็น slug/ชื่อก่อนความนิยมในการดาวน์โหลด โทเค็น slug แบบเดี่ยว เช่น `map` จะตรงกับ `personal-map` แรงกว่าสตริงย่อยภายใน `amap`
- ความนิยมเป็นเพียงปัจจัยจัดอันดับล่วงหน้าขนาดเล็ก ไม่ใช่การรับประกันว่าจะอยู่ลำดับบนสุด
- หากสกิลควรปรากฏแต่ไม่ปรากฏ ให้เรียก `clawhub inspect @owner/slug` ขณะเข้าสู่ระบบอยู่ เพื่อตรวจสอบการวินิจฉัยการกลั่นกรองที่เจ้าของมองเห็นได้ก่อนเปลี่ยนชื่อเมตาดาต้า

### `explore`

- แสดงรายการสกิลล่าสุดผ่าน `/api/v1/skills?limit=...&sort=createdAt` (เรียงตาม `createdAt` จากมากไปน้อย)
- แฟล็ก:
  - `--limit <n>` (1-200, ค่าเริ่มต้น: 25)
  - `--sort newest|updated|rating|downloads|trending` (ค่าเริ่มต้น: newest) ชื่อแทนการเรียงลำดับการติดตั้งแบบเดิมยังคงใช้งานได้เพื่อความเข้ากันได้
  - `--json` (เอาต์พุตที่เครื่องอ่านได้)
- เอาต์พุต: `<slug>  v<version>  <age>  <summary>` (สรุปถูกตัดให้เหลือ 50 อักขระ)

### `inspect @owner/slug`

- ดึงเมตาดาต้าของสกิลและไฟล์เวอร์ชันโดยไม่ติดตั้ง
- `--version <version>`: ตรวจสอบเวอร์ชันเฉพาะ (ค่าเริ่มต้น: latest)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-200)
- `--files`: แสดงรายการไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (ไฟล์ข้อความเท่านั้น; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `install @owner/slug`

- แก้หาเวอร์ชันล่าสุดสำหรับเจ้าของและสกิลที่ระบุ
- ดาวน์โหลด zip ผ่าน `/api/v1/download`
- แตกไฟล์ไปยัง `<workdir>/<dir>/<slug>`
- ปฏิเสธการเขียนทับสกิลที่ถูก pin; เรียก `clawhub unpin <skill>` ก่อน
- เขียน:
  - `<workdir>/.clawhub/lock.json` (เดิม `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (เดิม `.clawdhub`)

### `uninstall <skill>`

- ลบ `<workdir>/<dir>/<slug>` และลบรายการใน lockfile
- ส่ง telemetry แบบพยายามให้ดีที่สุดขณะเข้าสู่ระบบอยู่ เพื่อให้จำนวนการติดตั้งปัจจุบัน
  ถูกปิดใช้งานได้
- แบบโต้ตอบ: ขอการยืนยัน
- ไม่โต้ตอบ (`--no-input`): ต้องใช้ `--yes`

### `list`

- อ่าน `<workdir>/.clawhub/lock.json` (เดิม `.clawdhub`)
- แสดง `pinned` ข้างสกิลที่ถูกตรึงด้วย `clawhub pin` รวมถึงเหตุผลที่ไม่บังคับ

### `pin <skill>`

- ทำเครื่องหมายสกิลที่ติดตั้งแล้วเป็น pinned ใน lockfile
- `--reason <text>` บันทึกเหตุผลที่สกิลถูกตรึง
- สกิลที่ถูก pin จะถูกข้ามโดย `update --all` และถูกปฏิเสธโดย `update <skill>` โดยตรง
- สกิลที่ถูก pin ยังปฏิเสธ `install --force` เพื่อไม่ให้ไบต์ในเครื่องถูกแทนที่โดยไม่ตั้งใจ

### `unpin <skill>`

- ลบ pin ของ lockfile ออกจากสกิลที่ติดตั้งแล้ว เพื่อให้การอัปเดตในอนาคตแก้ไขได้

### `update [@owner/slug]` / `update --all`

- คำนวณ fingerprint จากไฟล์ในเครื่อง
- หาก fingerprint ตรงกับเวอร์ชันที่รู้จัก: ไม่มีพรอมป์
- หาก fingerprint ไม่ตรงกัน:
  - ปฏิเสธตามค่าเริ่มต้น
  - เขียนทับด้วย `--force` (หรือพรอมป์ หากเป็นแบบโต้ตอบ)
- สกิลที่ถูก pin จะไม่ถูกอัปเดตโดย `--force`
- `update <skill>` ล้มเหลวทันทีสำหรับสกิลที่ถูก pin และบอกให้คุณเรียก `clawhub unpin <skill>` ก่อน
- `update --all` ข้าม slug ที่ถูก pin และพิมพ์สรุปว่าสิ่งใดยังคงถูกตรึงไว้

### `skill publish <path>`

- เปรียบเทียบ fingerprint ของบันเดิลในเครื่องกับ ClawHub และออกสำเร็จเมื่อ
  เนื้อหาเผยแพร่แล้ว
- สกิลใหม่ใช้ค่าเริ่มต้นเป็น `1.0.0`; สกิลที่เปลี่ยนแปลงใช้ค่าเริ่มต้นเป็นเวอร์ชัน patch ถัดไป
- `--version <version>` เลือกเวอร์ชันอย่างชัดเจนและเผยแพร่แม้เมื่อ
  เนื้อหาตรงกับเวอร์ชันที่มีอยู่
- `--dry-run` แก้การเผยแพร่โดยไม่อัปโหลด; `--json` พิมพ์ผลลัพธ์
  ที่เครื่องอ่านได้
- `--owner <handle>` เผยแพร่ภายใต้แฮนเดิลผู้เผยแพร่ของ org/user เมื่อ
  actor มีสิทธิ์เข้าถึงของผู้เผยแพร่
- `--migrate-owner` ย้ายสกิลที่มีอยู่ไปยัง `--owner` ขณะเผยแพร่
  เวอร์ชันใหม่ ต้องมีสิทธิ์ admin/owner บนผู้เผยแพร่ทั้งสอง
- อธิบายพฤติกรรมเจ้าของและการรีวิวไว้ใน `docs/publishing.md`
- การเผยแพร่สกิลหมายความว่าสกิลนั้นเผยแพร่ภายใต้ `MIT-0` บน ClawHub
- สกิลที่เผยแพร่แล้วใช้งาน แก้ไข และแจกจ่ายต่อได้ฟรีโดยไม่ต้องระบุที่มา
- ClawHub ไม่รองรับสกิลแบบชำระเงินหรือการตั้งราคาต่อสกิล
- ชื่อแทนเดิม: `publish <path>`

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

เวิร์กโฟลว์ที่ใช้ซ้ำได้ของ ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
เรียก `skill publish` สำหรับ `skill_path` หนึ่งรายการ หรือสำหรับโฟลเดอร์สกิลโดยตรงแต่ละโฟลเดอร์
ใต้ `root` (ค่าเริ่มต้น: `skills`) โดยจะข้ามสกิลที่ไม่เปลี่ยนแปลงและใช้
พฤติกรรมเวอร์ชัน patch อัตโนมัติแบบเดียวกัน

ตั้ง `dry_run: true` เพื่อแสดงตัวอย่างโดยไม่ใช้โทเค็น การเผยแพร่จริงต้องใช้
secret `clawhub_token`

### `sync`

- สแกน workdir ปัจจุบัน, ไดเรกทอรีสกิลที่กำหนดค่าไว้ และโฟลเดอร์
  `--root <dir>` ใด ๆ เพื่อหาโฟลเดอร์สกิลในเครื่องที่มี `SKILL.md` หรือ
  `skill.md`
- เปรียบเทียบ fingerprint ของสกิลในเครื่องแต่ละรายการกับ ClawHub และเผยแพร่เฉพาะสกิลใหม่หรือ
  สกิลที่เปลี่ยนแปลง
- สกิลใหม่เผยแพร่เป็น `1.0.0`; สกิลที่เปลี่ยนแปลงเผยแพร่เป็นเวอร์ชัน patch ถัดไป
  ตามค่าเริ่มต้น ใช้ `--bump minor|major` สำหรับชุดอัปเดตที่ควรขยับด้วยขั้น semver
  ที่ใหญ่กว่า
- `--dry-run` แสดงแผนการเผยแพร่โดยไม่อัปโหลด; `--json` พิมพ์แผน
  ที่เครื่องอ่านได้
- `--all` เผยแพร่สกิลใหม่หรือสกิลที่เปลี่ยนแปลงทั้งหมดโดยไม่พรอมป์ หากไม่มี
  `--all` เทอร์มินัลแบบโต้ตอบจะให้คุณเลือกสกิลที่จะเผยแพร่
- `--owner <handle>` เผยแพร่ภายใต้แฮนเดิลผู้เผยแพร่ของ org/user เมื่อ
  actor มีสิทธิ์เข้าถึงของผู้เผยแพร่
- `sync` เป็นการเผยแพร่ทางเดียวเท่านั้น ไม่ติดตั้ง อัปเดต ดาวน์โหลด หรือ
  รายงาน telemetry การติดตั้ง/ดาวน์โหลด

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- ต้องใช้ `clawhub login`
- เรียก ClawHub ClawScan ผ่าน `POST /api/v1/skills/-/scan` จากนั้น poll จนกว่าสแกนจะจบสถานะ
- การสแกนเป็นแบบอะซิงโครนัสและอาจใช้เวลาจนเสร็จ ขณะอยู่ในคิว spinner ในเทอร์มินัลจะแสดงตำแหน่งสแกนตามลำดับความสำคัญปัจจุบันและจำนวนสแกนที่อยู่ข้างหน้า
- การสแกนที่เผยแพร่แล้วต้องมีความเป็นเจ้าของหรือสิทธิ์จัดการผู้เผยแพร่ ผู้กลั่นกรอง/admin สามารถใช้ backend เดียวกันผ่าน `clawhub-admin`
- `--update` ใช้ได้เฉพาะกับ `--slug`; เขียนผลสแกนที่เผยแพร่สำเร็จกลับไปยังเวอร์ชันที่เลือก
- `--output <file.zip>` ดาวน์โหลดไฟล์เก็บรายงานเต็มพร้อม `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`
- `--json` พิมพ์การตอบกลับจาก poll ทั้งหมดสำหรับระบบอัตโนมัติ
- ไม่รองรับการสแกนพาธในเครื่องอีกต่อไป อัปโหลดเวอร์ชันใหม่ จากนั้นใช้ `scan download` เพื่อดึงผลสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งนั้น

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- ต้องใช้ `clawhub login`
- ดาวน์โหลด ZIP รายงานสแกนที่จัดเก็บไว้สำหรับเวอร์ชันสกิลหรือ plugin ที่ส่ง รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อนไว้โดยการตรวจสอบความปลอดภัยของ ClawHub
- การดาวน์โหลดสกิลใช้ slug ของสกิลและใช้ค่าเริ่มต้นเป็น `--kind skill`
- การดาวน์โหลด plugin ใช้ชื่อแพ็กเกจและต้องใช้ `--kind plugin`
- ต้องมี `--version` เพื่อให้ผู้เขียนตรวจสอบเวอร์ชันที่ส่งอย่างแม่นยำซึ่ง ClawHub บล็อกไว้
- `--output <file.zip>` เลือกพาธปลายทาง

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub มาพร้อมเวิร์กโฟลว์ที่ใช้ซ้ำได้อย่างเป็นทางการที่
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/2ef5aebc5d2f78630d6fc8fedb7d4e829cf83532/.github/workflows/skill-publish.yml)
สำหรับรีโปสกิลและรีโปแคตตาล็อก

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

- `root` ใช้ค่าเริ่มต้นเป็น `skills` สำหรับรีโปแคตตาล็อก
- ส่ง `skill_path: skills/review-helper` เพื่อประมวลผลโฟลเดอร์สกิลหนึ่งโฟลเดอร์
- `owner` แมปกับแฟล็ก CLI `--owner`; ละไว้เพื่อเผยแพร่ในฐานะผู้ใช้ที่ผ่านการยืนยันตัวตน
- การเผยแพร่สกิล V1 ใช้ `clawhub_token`; GitHub OIDC trusted publishing เป็นแบบเฉพาะแพ็กเกจในตอนนี้

### `delete <skill>`

- เมื่อไม่มี `--version` ให้ลบสกิลแบบซอฟต์ดีลีต (เจ้าของ ผู้ควบคุม หรือผู้ดูแลระบบ)
- เรียก `DELETE /api/v1/skills/{slug}`
- การซอฟต์ดีลีตที่เริ่มโดยเจ้าของจะสงวน slug ไว้ 30 วัน; คำสั่งจะแสดงเวลาหมดอายุ
- `--version <version>` จะลบเวอร์ชันที่เป็นเจ้าของและไม่ใช่เวอร์ชันล่าสุดหนึ่งรายการอย่างถาวรผ่านเส้นทางเฉพาะเวอร์ชัน
  ที่ปิดเมื่อไม่ผ่านเงื่อนไข
  เวอร์ชันที่ถูกลบจะกู้คืนหรือเผยแพร่ซ้ำไม่ได้ เผยแพร่รายการทดแทนก่อนลบเวอร์ชันล่าสุดปัจจุบัน
  เจ้าหน้าที่แพลตฟอร์มจะไม่ข้ามความเป็นเจ้าของสำหรับโฟลว์ที่ใช้กับเวอร์ชันเท่านั้นนี้
- `--reason <text>` บันทึกหมายเหตุการดูแลสำหรับการซอฟต์ดีลีตทั้งสกิลและบันทึกการตรวจสอบ
- `--note <text>` เป็นนามแฝงของ `--reason`
- `--yes` ข้ามการยืนยัน

### `undelete <skill>`

- กู้คืนสกิลที่ซ่อนไว้ (เจ้าของ ผู้ควบคุม หรือผู้ดูแลระบบ)
- ไม่มีการกู้คืนเวอร์ชัน; เวอร์ชันที่ถูกลบถาวรจะกู้คืนไม่ได้
- เรียก `POST /api/v1/skills/{slug}/undelete`
- `--reason <text>` บันทึกหมายเหตุการดูแลบนสกิลและบันทึกการตรวจสอบ
- `--note <text>` เป็นนามแฝงของ `--reason`
- `--yes` ข้ามการยืนยัน

### `hide <skill>`

- ซ่อนสกิล (เจ้าของ ผู้ควบคุม หรือผู้ดูแลระบบ)
- นามแฝงของ `delete`

### `unhide <skill>`

- ยกเลิกการซ่อนสกิล (เจ้าของ ผู้ควบคุม หรือผู้ดูแลระบบ)
- นามแฝงของ `undelete`

### `skill rename <skill> <new-name>`

- เปลี่ยนชื่อสกิลที่เป็นเจ้าของและเก็บ slug ก่อนหน้าไว้เป็นนามแฝงสำหรับเปลี่ยนเส้นทาง
- เรียก `POST /api/v1/skills/{slug}/rename`
- `--yes` ข้ามการยืนยัน

### `skill merge <source> <target>`

- รวมสกิลที่เป็นเจ้าของหนึ่งรายการเข้ากับสกิลที่เป็นเจ้าของอีกรายการ
- slug ต้นทางจะหยุดแสดงต่อสาธารณะและกลายเป็นนามแฝงสำหรับเปลี่ยนเส้นทางไปยังปลายทาง
- เรียก `POST /api/v1/skills/{sourceSlug}/merge`
- `--yes` ข้ามการยืนยัน

### `transfer`

- เวิร์กโฟลว์การโอนความเป็นเจ้าของ
- การโอนไปยัง handle ของผู้ใช้จะสร้างคำขอที่รอดำเนินการให้ผู้รับยอมรับ
- การโอนไปยัง handle ขององค์กร/ผู้เผยแพร่จะมีผลทันทีเฉพาะเมื่อผู้ดำเนินการมี
  สิทธิ์ผู้ดูแลระบบทั้งกับเจ้าของปัจจุบันและผู้เผยแพร่ปลายทาง
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
- ใช้สิ่งนี้สำหรับ plugins และรายการตระกูลแพ็กเกจอื่น ๆ; `search` ระดับบนสุดยังคงเป็นพื้นผิวค้นหาสกิล
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
- ใช้สิ่งนี้เพื่อตรวจสอบข้อมูลเมตาของ Plugin, ความเข้ากันได้, การยืนยัน, แหล่งที่มา และเวอร์ชัน/ไฟล์
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: ล่าสุด)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-100)
- `--files`: แสดงไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (ไฟล์ข้อความเท่านั้น; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `package download <name>`

- แก้เวอร์ชันแพ็กเกจผ่าน
  `GET /api/v1/packages/{name}/versions/{version}/artifact`
- ดาวน์โหลดอาร์ติแฟกต์จาก `downloadUrl` ของตัวแก้
- ยืนยัน ClawHub SHA-256 สำหรับอาร์ติแฟกต์ทั้งหมด
- สำหรับอาร์ติแฟกต์ ClawPack npm-pack ให้ยืนยันความถูกต้อง `sha512` ของ npm,
  npm shasum และชื่อ/เวอร์ชันใน `package.json` ของ tarball ด้วย
- เวอร์ชัน ZIP เดิมจะดาวน์โหลดผ่านเส้นทาง ZIP เดิม
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

- คำนวณ ClawHub SHA-256, ความถูกต้อง `sha512` ของ npm และ npm shasum สำหรับอาร์ติแฟกต์ในเครื่อง
- เมื่อใช้ `--package` จะแก้ข้อมูลเมตาที่คาดไว้จาก ClawHub และเปรียบเทียบ
  ไฟล์ในเครื่องกับข้อมูลเมตาอาร์ติแฟกต์ที่เผยแพร่แล้ว
- เมื่อใช้แฟล็ก digest โดยตรง จะยืนยันโดยไม่ค้นหาผ่านเครือข่าย
- แฟล็ก:
  - `--package <name>`: ชื่อแพ็กเกจที่จะแก้ข้อมูลเมตาอาร์ติแฟกต์ที่คาดไว้
  - `--version <version>` หรือ `--tag <tag>`: เวอร์ชันแพ็กเกจที่คาดไว้
  - `--sha256 <hex>`: ClawHub SHA-256 ที่คาดไว้
  - `--npm-integrity <sri>`: ความถูกต้องของ npm ที่คาดไว้
  - `--npm-shasum <sha1>`: npm shasum ที่คาดไว้
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- รัน Plugin Inspector ที่รวมมากับ ClawHub CLI กับโฟลเดอร์แพ็กเกจ Plugin ในเครื่อง
- ค่าเริ่มต้นคือการตรวจสอบแบบออฟไลน์/สแตติก โดยไม่ค้นหาหรือนำเข้า checkout ของ
  OpenClaw ในเครื่อง
- ข้อผิดพลาดความเข้ากันได้ระดับร้ายแรงจะออกด้วยค่าที่ไม่ใช่ศูนย์ ผลลัพธ์ที่เป็นคำเตือนเท่านั้นจะแสดงผลแต่
  ออกด้วยศูนย์
- แฟล็ก:
  - `--out <dir>`: เขียนรายงาน Plugin Inspector ไปยังไดเรกทอรีนี้
  - `--openclaw <path>`: ตรวจสอบกับ checkout ของ OpenClaw ในเครื่องที่ระบุชัดเจน
  - `--runtime`: เปิดใช้การจับข้อมูล runtime; นำเข้าโค้ด Plugin
  - `--allow-execute`: อนุญาตการจับข้อมูล runtime ในพื้นที่ทำงานที่แยกไว้
  - `--no-mock-sdk`: ปิดใช้ OpenClaw SDK จำลองระหว่างการจับข้อมูล runtime
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package validate ./example-plugin
```

หากการตรวจสอบรายงานข้อค้นพบเกี่ยวกับแพ็กเกจ, manifest, การนำเข้า SDK หรืออาร์ติแฟกต์ โปรดดู
[การแก้ไขการตรวจสอบ Plugin](/clawhub/plugin-validation-fixes) แล้วรันคำสั่งอีกครั้ง

### `package delete <name>`

- เมื่อไม่มี `--version` ให้ซอฟต์ดีลีตแพ็กเกจและรีลีสทั้งหมด
- `--version <version>` จะลบรีลีสที่เป็นเจ้าของและไม่ใช่รีลีสล่าสุดหนึ่งรายการอย่างถาวรผ่านเส้นทางเฉพาะเวอร์ชัน
  ที่ปิดเมื่อไม่ผ่านเงื่อนไข
  เวอร์ชันที่ถูกลบจะกู้คืนหรือเผยแพร่ซ้ำไม่ได้ เผยแพร่รายการทดแทนก่อนลบเวอร์ชันล่าสุดปัจจุบัน
  โฟลว์ที่ใช้กับเวอร์ชันเท่านั้นนี้ต้องเป็นเจ้าของแพ็กเกจหรือผู้ดูแลระบบผู้เผยแพร่องค์กร;
  เจ้าหน้าที่แพลตฟอร์มจะไม่ข้ามความเป็นเจ้าของแพ็กเกจ
- การซอฟต์ดีลีตทั้งแพ็กเกจต้องเป็นเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลระบบผู้เผยแพร่องค์กร, ผู้ควบคุมแพลตฟอร์ม หรือผู้ดูแลระบบแพลตฟอร์ม
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

- กู้คืนแพ็กเกจและรีลีสที่ถูกซอฟต์ดีลีต
- ไม่มีการกู้คืนเวอร์ชัน; เวอร์ชันที่ถูกลบถาวรจะกู้คืนไม่ได้
- ต้องเป็นเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลระบบผู้เผยแพร่องค์กร, ผู้ควบคุมแพลตฟอร์ม
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
- ต้องมีสิทธิ์ผู้ดูแลระบบทั้งกับเจ้าของแพ็กเกจปัจจุบันและผู้เผยแพร่ปลายทาง
  เว้นแต่ดำเนินการโดยผู้ดูแลระบบแพลตฟอร์ม
- ชื่อแพ็กเกจแบบ scoped ต้องโอนไปยังเจ้าของ scope ที่ตรงกัน
- เรียก `POST /api/v1/packages/{name}/transfer`
- แฟล็ก:
  - `--to <owner>`: handle ของผู้เผยแพร่ปลายทาง
  - `--reason <text>`: เหตุผลการตรวจสอบที่ไม่บังคับ
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- คำสั่งที่ต้องยืนยันตัวตนสำหรับรายงานแพ็กเกจต่อผู้ควบคุม
- เรียก `POST /api/v1/packages/{name}/report`
- รายงานอยู่ในระดับแพ็กเกจ อาจผูกกับเวอร์ชันได้ และจะมองเห็นได้
  สำหรับผู้ควบคุมเพื่อตรวจสอบ
- รายงานจะไม่ซ่อนแพ็กเกจหรือบล็อกการดาวน์โหลดโดยอัตโนมัติด้วยตัวเอง
- แฟล็ก:
  - `--version <version>`: เวอร์ชันแพ็กเกจที่ไม่บังคับเพื่อแนบกับรายงาน
  - `--reason <text>`: เหตุผลรายงานที่จำเป็น
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- คำสั่งของเจ้าของสำหรับตรวจสอบการมองเห็นด้านการดูแลของแพ็กเกจ
- เรียก `GET /api/v1/packages/{name}/moderation`
- แสดงสถานะการสแกนแพ็กเกจปัจจุบัน, จำนวนรายงานที่เปิดอยู่, สถานะการดูแลด้วยตนเองของรีลีสล่าสุด,
  สถานะการบล็อกการดาวน์โหลด และเหตุผลการดูแล
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- ตรวจสอบว่าแพ็กเกจพร้อมสำหรับการใช้งานโดย OpenClaw ในอนาคตหรือไม่
- เรียก `GET /api/v1/packages/{name}/readiness`
- รายงานตัวบล็อกสำหรับสถานะทางการ, ความพร้อมใช้งานของ ClawPack, digest ของอาร์ติแฟกต์,
  แหล่งที่มาของซอร์ส, ความเข้ากันได้กับ OpenClaw, เป้าหมายโฮสต์, ข้อมูลเมตาสภาพแวดล้อม
  และสถานะการสแกน
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- แสดงสถานะการย้ายข้อมูลที่เน้นผู้ปฏิบัติการสำหรับแพ็กเกจที่อาจแทนที่
  Plugin ของ OpenClaw ที่บันเดิลมา
- เรียกเอนด์พอยต์ความพร้อมที่คำนวณแล้วเดียวกับ `package readiness` แต่แสดง
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
- handle จะถูกปรับเป็นตัวพิมพ์เล็กและอาจส่งผ่านโดยมีหรือไม่มี `@` ก็ได้
- ผู้เผยแพร่องค์กรที่สร้างใหม่จะไม่ถูกเชื่อถือ/เป็นทางการโดยค่าเริ่มต้น
- ล้มเหลวหาก handle ถูกใช้แล้วโดยผู้เผยแพร่ ผู้ใช้ หรือเส้นทางที่สงวนไว้ที่มีอยู่

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- เผยแพร่ Plugin แบบโค้ดหรือ Plugin แบบบันเดิลผ่าน `POST /api/v1/packages`
- `<source>` รองรับ:
  - พาธโฟลเดอร์ในเครื่อง: `./my-plugin`
  - ไฟล์ tarball แบบ ClawPack npm-pack ในเครื่อง: `./my-plugin-1.2.3.tgz`
  - รีโป GitHub: `owner/repo` หรือ `owner/repo@ref`
  - URL ของ GitHub: `https://github.com/owner/repo`
- ระบบตรวจจับ metadata อัตโนมัติจาก `package.json`, `openclaw.plugin.json` และ
  marker ของบันเดิล OpenClaw จริง เช่น `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` และ `.cursor-plugin/plugin.json`
- source แบบ `.tgz` จะถูกถือว่าเป็น ClawPack โดย CLI จะอัปโหลดไบต์ npm-pack
  ตามจริง และใช้เนื้อหา `package/` ที่แตกออกมาเฉพาะสำหรับการตรวจสอบความถูกต้องและ
  การเติม metadata ล่วงหน้าเท่านั้น
- โฟลเดอร์ code-plugin จะถูกแพ็กเป็น tarball แบบ ClawPack npm ก่อนอัปโหลด เพื่อให้
  การติดตั้ง OpenClaw สามารถตรวจสอบ artifact ตามจริงได้ โฟลเดอร์ bundle-plugin ยังคง
  ใช้เส้นทางเผยแพร่แบบไฟล์ที่แตกออกมา
- สำหรับ source จาก GitHub การระบุแหล่งที่มาจะถูกเติมอัตโนมัติจากรีโป, commit ที่ resolve แล้ว, ref และ subpath
- สำหรับโฟลเดอร์ในเครื่อง การระบุแหล่งที่มาจะถูกตรวจจับอัตโนมัติจาก git ในเครื่องเมื่อ origin remote ชี้ไปที่ GitHub
- code Plugin ภายนอกต้องประกาศ `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion` อย่างชัดเจน
  `package.json.version` ระดับบนสุดจะไม่ถูกใช้เป็น fallback สำหรับการตรวจสอบความถูกต้องในการเผยแพร่
- `--dry-run` แสดงตัวอย่าง payload การเผยแพร่ที่ resolve แล้วโดยไม่อัปโหลด
- `--json` ส่งออกผลลัพธ์ที่เครื่องอ่านได้สำหรับ CI
- `--owner <handle>` เผยแพร่ภายใต้ handle ของผู้เผยแพร่ที่เป็นผู้ใช้หรือองค์กร เมื่อ actor มีสิทธิ์เข้าถึงการเผยแพร่
- ชื่อแพ็กเกจแบบ scoped ต้องตรงกับ owner ที่เลือก ดู `docs/publishing.md`
- flag เดิม (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ยังคงใช้เป็น override ได้
- รีโป GitHub ส่วนตัวต้องใช้ `GITHUB_TOKEN`

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### โฟลว์ในเครื่องที่แนะนำ

ใช้ `--dry-run` ก่อน เพื่อให้คุณยืนยัน metadata ของแพ็กเกจที่ resolve แล้วและ
การระบุแหล่งที่มาได้ก่อนสร้าง release จริง:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### โฟลว์โฟลเดอร์ในเครื่อง

สำหรับ code Plugin การเผยแพร่จากโฟลเดอร์จะ build และอัปโหลด artifact แบบ ClawPack จาก
โฟลเดอร์แพ็กเกจ:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` ขั้นต่ำสำหรับ `--family code-plugin`

code Plugin ภายนอกต้องมี metadata ของ OpenClaw จำนวนเล็กน้อยใน
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
- `openclaw.hostTargets` และ `openclaw.environment` เป็น metadata ที่ไม่บังคับ
  ClawHub อาจแสดงข้อมูลเหล่านี้เมื่อมีอยู่ แต่ไม่จำเป็นสำหรับการเผยแพร่
- `openclaw.compat.minGatewayVersion` และ
  `openclaw.build.pluginSdkVersion` เป็นข้อมูลเสริมที่ไม่บังคับ หากคุณต้องการเผยแพร่
  metadata ความเข้ากันได้ที่ละเอียดขึ้น
- หากคุณกำลังใช้ CLI `clawhub` release เก่า ให้อัปเกรดก่อนเผยแพร่ เพื่อให้
  การตรวจสอบ preflight ในเครื่องทำงานก่อนอัปโหลด
- หากการตรวจสอบความถูกต้องรายงาน remediation code ให้ดู
  [การแก้ไขการตรวจสอบความถูกต้องของ Plugin](/clawhub/plugin-validation-fixes)

#### GitHub Actions

ClawHub ยังมาพร้อม workflow แบบ reusable อย่างเป็นทางการที่
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/2ef5aebc5d2f78630d6fc8fedb7d4e829cf83532/.github/workflows/package-publish.yml)
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

- workflow แบบ reusable จะตั้งค่าเริ่มต้น `source` เป็นรีโป caller
- สำหรับ monorepo ให้ส่ง `source_path` เพื่อให้ workflow เผยแพร่โฟลเดอร์แพ็กเกจ
  Plugin เช่น `source_path: extensions/codex`
- pin workflow แบบ reusable กับ tag ที่เสถียรหรือ commit SHA แบบเต็ม อย่ารันการเผยแพร่ release จาก `@main`
- `pull_request` ควรใช้ `dry_run: true` เพื่อให้ CI ไม่สร้างผลกระทบต่อระบบจริง
- การเผยแพร่จริงควรจำกัดไว้กับ event ที่เชื่อถือได้ เช่น `workflow_dispatch` หรือการ push tag
- trusted publishing โดยไม่มี secret ใช้ได้เฉพาะบน `workflow_dispatch`; การ push tag ยังต้องใช้ `clawhub_token`
- เตรียม `clawhub_token` ให้พร้อมสำหรับการเผยแพร่ครั้งแรก, แพ็กเกจที่ไม่น่าเชื่อถือ หรือการเผยแพร่แบบ break-glass
- workflow อัปโหลดผลลัพธ์ JSON เป็น artifact และเปิดเผยเป็น output ของ workflow

### `package trusted-publisher get <name>`

- แสดง config trusted publisher ของ GitHub Actions สำหรับแพ็กเกจ
- ใช้คำสั่งนี้หลังตั้งค่า config เพื่อยืนยัน repository, ชื่อไฟล์ workflow
  และ environment pin ที่ไม่บังคับ
- flag:
  - `--json`: output ที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- แนบหรือแทนที่ config trusted publisher ของ GitHub Actions สำหรับแพ็กเกจที่มีอยู่
- ต้องสร้างแพ็กเกจก่อนผ่าน `clawhub package publish` แบบ manual ปกติหรือแบบยืนยันตัวตนด้วย token
- หลังตั้งค่า config แล้ว การเผยแพร่ผ่าน GitHub Actions ที่รองรับในอนาคตสามารถใช้
  OIDC/trusted publishing โดยไม่ต้องมี token ของ ClawHub แบบอายุยาว
- `--repository <repo>` ต้องเป็น `owner/repo`
- `--workflow-filename <file>` ต้องตรงกับชื่อไฟล์ workflow ใน
  `.github/workflows/`
- `--environment <name>` ไม่บังคับ เมื่อกำหนดค่าแล้ว environment ของ GitHub Actions
  ใน OIDC claim ต้องตรงกันทุกประการ
- ClawHub ตรวจสอบ repository GitHub ที่กำหนดค่าไว้เมื่อคำสั่งนี้ทำงาน
  repository สาธารณะสามารถตรวจสอบผ่าน metadata สาธารณะของ GitHub ได้ ส่วน
  repository ส่วนตัวต้องให้ ClawHub มีสิทธิ์เข้าถึง GitHub สำหรับ repository นั้น
  เช่น ผ่านการติดตั้ง GitHub App ของ ClawHub ในอนาคต หรือการผสานรวม GitHub
  อื่นที่ได้รับอนุญาต
- flag:
  - `--repository <repo>`: repository GitHub เช่น `openclaw/example-plugin`
  - `--workflow-filename <file>`: ชื่อไฟล์ workflow เช่น `package-publish.yml`
  - `--environment <name>`: environment ของ GitHub Actions ที่ต้องตรงกันทุกประการและไม่บังคับ
  - `--json`: output ที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- ลบ config trusted publisher ออกจากแพ็กเกจ
- ใช้เป็น rollback หากต้องปิดใช้งานหรือสร้าง workflow, repository หรือ environment pin ใหม่
- การเผยแพร่จริงในอนาคตต้องใช้การเผยแพร่แบบยืนยันตัวตนปกติจนกว่าจะตั้งค่า config อีกครั้ง
- flag:
  - `--json`: output ที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### telemetry การติดตั้ง

- ส่งหลังจาก `clawhub install <slug>` เมื่อเข้าสู่ระบบแล้ว เว้นแต่จะตั้งค่า
  `CLAWHUB_DISABLE_TELEMETRY=1`
- การรายงานเป็นแบบ best-effort คำสั่งติดตั้งจะไม่ล้มเหลวหาก telemetry
  ไม่พร้อมใช้งาน
- รายละเอียด: `docs/telemetry.md`
