---
read_when:
    - การใช้ ClawHub CLI
    - การดีบักการติดตั้ง การอัปเดต หรือการเผยแพร่
summary: 'การอ้างอิง CLI: คำสั่ง แฟล็ก การกำหนดค่า และลักษณะการทำงานของ lockfile.'
x-i18n:
    generated_at: "2026-06-28T00:10:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70aabaeae7b205e0ef30de010624e18c471baf214ff5e07ac1db8139fccb1c27
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

## แฟล็กส่วนกลาง

- `--workdir <dir>`: ไดเรกทอรีทำงาน (ค่าเริ่มต้น: cwd; ถ้ากำหนดไว้จะ fallback ไปยังเวิร์กสเปซ Clawdbot)
- `--dir <dir>`: ไดเรกทอรีติดตั้งภายใต้ workdir (ค่าเริ่มต้น: `skills`)
- `--site <url>`: URL ฐานสำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `https://clawhub.ai`)
- `--registry <url>`: URL ฐานของ API (ค่าเริ่มต้น: ค้นพบอัตโนมัติ ไม่เช่นนั้นใช้ `https://clawhub.ai`)
- `--no-input`: ปิดใช้งานพรอมป์

ตัวแปรแวดล้อมที่เทียบเท่า:

- `CLAWHUB_SITE` (legacy `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (legacy `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (legacy `CLAWDHUB_WORKDIR`)

### พร็อกซี HTTP

CLI รองรับตัวแปรแวดล้อมพร็อกซี HTTP มาตรฐานสำหรับระบบที่อยู่หลัง
พร็อกซีองค์กรหรือเครือข่ายที่ถูกจำกัด:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

เมื่อมีการตั้งค่าตัวแปรเหล่านี้ตัวใดตัวหนึ่ง CLI จะส่งคำขอขาออกผ่าน
พร็อกซีที่ระบุ `HTTPS_PROXY` ใช้สำหรับคำขอ HTTPS, `HTTP_PROXY`
สำหรับ HTTP ปกติ และ `NO_PROXY` / `no_proxy` จะถูกใช้เพื่อข้ามพร็อกซีสำหรับ
โฮสต์หรือโดเมนเฉพาะ

สิ่งนี้จำเป็นบนระบบที่การเชื่อมต่อขาออกโดยตรงถูกบล็อก
(เช่น คอนเทนเนอร์ Docker, Hetzner VPS ที่ใช้อินเทอร์เน็ตผ่านพร็อกซีเท่านั้น, ไฟร์วอลล์องค์กร)

ตัวอย่าง:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

เมื่อไม่ได้ตั้งค่าตัวแปรพร็อกซี พฤติกรรมจะไม่เปลี่ยนแปลง (เชื่อมต่อโดยตรง)

## ไฟล์กำหนดค่า

จัดเก็บโทเค็น API ของคุณ + URL รีจิสทรีที่แคชไว้

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` หรือ `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Legacy fallback: หาก `clawhub/config.json` ยังไม่มีอยู่ แต่มี `clawdhub/config.json` อยู่ CLI จะใช้พาธ legacy นั้นซ้ำ
- override: `CLAWHUB_CONFIG_PATH` (legacy `CLAWDHUB_CONFIG_PATH`)

## คำสั่ง

### `login` / `auth login`

- ค่าเริ่มต้น: เปิดเบราว์เซอร์ไปที่ `<site>/cli/auth` และดำเนินการให้เสร็จผ่าน callback แบบ loopback
- Headless: `clawhub login --token clh_...`
- Remote/headless interactive: `clawhub login --device` พิมพ์รหัสและรอขณะที่คุณอนุญาตที่ `<site>/cli/device`

### `whoami`

- ตรวจสอบโทเค็นที่จัดเก็บไว้ผ่าน `/api/v1/whoami`

### `token`

- พิมพ์โทเค็น API ที่จัดเก็บไว้ไปยัง stdout
- มีประโยชน์สำหรับการ pipe โทเค็นเข้าสู่ระบบในเครื่องไปยังคำสั่งตั้งค่า secret ของ CI

### `star <skill>` / `unstar <skill>`

- เพิ่ม/ลบ skill ออกจากรายการไฮไลต์ของคุณ
- เรียก `POST /api/v1/stars/<slug>` และ `DELETE /api/v1/stars/<slug>`
- `--yes` ข้ามการยืนยัน

### `search <query...>`

- เรียก `/api/v1/search?q=...`
- เอาต์พุตประกอบด้วย slug ของ skill, handle ของเจ้าของ, ชื่อที่แสดง และคะแนนความเกี่ยวข้อง
- การค้นหาจะให้ความสำคัญกับการตรงกันแบบ exact ของโทเค็น slug/ชื่อก่อนความนิยมจากการดาวน์โหลด โทเค็น slug แบบเดี่ยว เช่น `map` จะตรงกับ `personal-map` ได้แรงกว่าสตริงย่อยภายใน `amap`
- ความนิยมเป็นเพียง prior ขนาดเล็กในการจัดอันดับ ไม่ใช่การรับประกันว่าจะอยู่ในตำแหน่งบนสุด
- หาก skill ควรปรากฏแต่ไม่ปรากฏ ให้เรียก `clawhub inspect @owner/slug` ขณะเข้าสู่ระบบเพื่อตรวจสอบการวินิจฉัยการกำกับดูแลที่เจ้าของมองเห็นได้ก่อนเปลี่ยนชื่อเมทาดาทา

### `explore`

- แสดง Skills ใหม่ล่าสุดผ่าน `/api/v1/skills?limit=...&sort=createdAt` (เรียงตาม `createdAt` จากใหม่ไปเก่า)
- แฟล็ก:
  - `--limit <n>` (1-200, ค่าเริ่มต้น: 25)
  - `--sort newest|updated|rating|downloads|trending` (ค่าเริ่มต้น: newest) นามแฝงการเรียงลำดับการติดตั้งแบบ legacy ยังใช้ได้เพื่อความเข้ากันได้
  - `--json` (เอาต์พุตที่เครื่องอ่านได้)
- เอาต์พุต: `<slug>  v<version>  <age>  <summary>` (summary ถูกตัดเหลือ 50 อักขระ)

### `inspect @owner/slug`

- ดึงเมทาดาทาและไฟล์เวอร์ชันของ skill โดยไม่ติดตั้ง
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: latest)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-200)
- `--files`: แสดงไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (เฉพาะไฟล์ข้อความ; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `install @owner/slug`

- resolve เวอร์ชันล่าสุดสำหรับเจ้าของและ skill ที่ระบุชื่อ
- ดาวน์โหลด zip ผ่าน `/api/v1/download`
- แตกไฟล์ลงใน `<workdir>/<dir>/<slug>`
- ปฏิเสธการเขียนทับ Skills ที่ pinned; ให้เรียก `clawhub unpin <skill>` ก่อน
- เขียน:
  - `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

### `uninstall <skill>`

- ลบ `<workdir>/<dir>/<slug>` และลบรายการใน lockfile
- ส่ง telemetry แบบ best-effort ขณะเข้าสู่ระบบ เพื่อให้จำนวนการติดตั้งปัจจุบัน
  ถูกปิดใช้งานได้
- Interactive: ขอการยืนยัน
- Non-interactive (`--no-input`): ต้องใช้ `--yes`

### `list`

- อ่าน `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)
- แสดง `pinned` ถัดจาก Skills ที่ถูก freeze ด้วย `clawhub pin` รวมถึงเหตุผลที่เป็นทางเลือก

### `pin <skill>`

- ทำเครื่องหมาย skill ที่ติดตั้งแล้วเป็น pinned ใน lockfile
- `--reason <text>` บันทึกเหตุผลที่ skill ถูก freeze
- Skills ที่ pinned จะถูกข้ามโดย `update --all` และถูกปฏิเสธโดย `update <skill>` โดยตรง
- Skills ที่ pinned จะปฏิเสธ `install --force` ด้วย เพื่อไม่ให้ไบต์ในเครื่องถูกแทนที่โดยไม่ตั้งใจ

### `unpin <skill>`

- ลบ pin ใน lockfile ออกจาก skill ที่ติดตั้งแล้ว เพื่อให้การอัปเดตในอนาคตสามารถแก้ไขได้

### `update [@owner/slug]` / `update --all`

- คำนวณ fingerprint จากไฟล์ในเครื่อง
- หาก fingerprint ตรงกับเวอร์ชันที่รู้จัก: ไม่มีพรอมป์
- หาก fingerprint ไม่ตรง:
  - ปฏิเสธตามค่าเริ่มต้น
  - เขียนทับด้วย `--force` (หรือพรอมป์ หากเป็น interactive)
- Skills ที่ pinned จะไม่ถูกอัปเดตโดย `--force`
- `update <skill>` จะล้มเหลวทันทีสำหรับ Skills ที่ pinned และบอกให้คุณเรียก `clawhub unpin <skill>` ก่อน
- `update --all` ข้าม slug ที่ pinned และพิมพ์สรุปว่าสิ่งใดยังคงถูก freeze ไว้

### `skill publish <path>`

- เปรียบเทียบ fingerprint ของบันเดิลในเครื่องกับ ClawHub และออกสำเร็จเมื่อ
  เนื้อหาถูกเผยแพร่อยู่แล้ว
- Skills ใหม่มีค่าเริ่มต้นเป็น `1.0.0`; Skills ที่เปลี่ยนแปลงมีค่าเริ่มต้นเป็นเวอร์ชัน patch
  ถัดไป
- `--version <version>` เลือกเวอร์ชันอย่างชัดเจนและเผยแพร่แม้เมื่อ
  เนื้อหาตรงกับเวอร์ชันที่มีอยู่
- `--dry-run` resolve การเผยแพร่โดยไม่อัปโหลด; `--json` พิมพ์ผลลัพธ์
  ที่เครื่องอ่านได้
- `--owner <handle>` เผยแพร่ภายใต้ handle ของผู้เผยแพร่แบบ org/user เมื่อ
  actor มีสิทธิ์เข้าถึงของผู้เผยแพร่
- `--migrate-owner` ย้าย skill ที่มีอยู่ไปยัง `--owner` ขณะเผยแพร่เวอร์ชัน
  ใหม่ ต้องมีสิทธิ์ admin/owner บนผู้เผยแพร่ทั้งสองราย
- พฤติกรรมของเจ้าของและการรีวิวอธิบายไว้ใน `docs/publishing.md`
- การเผยแพร่ skill หมายความว่า skill นั้นถูกปล่อยภายใต้ `MIT-0` บน ClawHub
- Skills ที่เผยแพร่แล้วใช้งาน แก้ไข และแจกจ่ายซ้ำได้ฟรีโดยไม่ต้องให้เครดิต
- ClawHub ไม่รองรับ Skills แบบชำระเงินหรือการตั้งราคาต่อ skill
- นามแฝง legacy: `publish <path>`

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

workflow ที่ใช้ซ้ำได้ของ ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
เรียก `skill publish` สำหรับ `skill_path` หนึ่งรายการ หรือสำหรับโฟลเดอร์ skill ทันทีแต่ละโฟลเดอร์
ภายใต้ `root` (ค่าเริ่มต้น: `skills`) โดยจะข้าม Skills ที่ไม่เปลี่ยนแปลงและใช้
พฤติกรรมเวอร์ชัน patch อัตโนมัติแบบเดียวกัน

ตั้งค่า `dry_run: true` เพื่อดูตัวอย่างโดยไม่มีโทเค็น การเผยแพร่จริงต้องใช้
secret `clawhub_token`

### `sync`

- สแกน workdir ปัจจุบัน ไดเรกทอรี Skills ที่กำหนดค่าไว้ และโฟลเดอร์
  `--root <dir>` ใด ๆ เพื่อหาโฟลเดอร์ skill ในเครื่องที่มี `SKILL.md` หรือ
  `skill.md`
- เปรียบเทียบ fingerprint ของ skill ในเครื่องแต่ละรายการกับ ClawHub และเผยแพร่เฉพาะ Skills ใหม่หรือ
  ที่เปลี่ยนแปลง
- Skills ใหม่เผยแพร่เป็น `1.0.0`; Skills ที่เปลี่ยนแปลงเผยแพร่เป็นเวอร์ชัน patch ถัดไป
  ตามค่าเริ่มต้น ใช้ `--bump minor|major` สำหรับชุดอัปเดตที่ควรขยับด้วย
  semver step ที่ใหญ่ขึ้น
- `--dry-run` แสดงแผนการเผยแพร่โดยไม่อัปโหลด; `--json` พิมพ์แผน
  ที่เครื่องอ่านได้
- `--all` เผยแพร่ทุก skill ใหม่หรือที่เปลี่ยนแปลงโดยไม่พรอมป์ หากไม่มี
  `--all` เทอร์มินัลแบบ interactive จะให้คุณเลือก Skills ที่จะเผยแพร่
- `--owner <handle>` เผยแพร่ภายใต้ handle ของผู้เผยแพร่แบบ org/user เมื่อ
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
- เรียกใช้ ClawHub ClawScan ผ่าน `POST /api/v1/skills/-/scan` จากนั้น poll จนกว่าสแกนจะเป็น terminal
- การสแกนเป็น asynchronous และอาจใช้เวลาจึงจะเสร็จ ระหว่างอยู่ในคิว spinner ของเทอร์มินัลจะแสดงตำแหน่งสแกนตามลำดับความสำคัญปัจจุบันและจำนวนสแกนที่อยู่ข้างหน้า
- การสแกนที่เผยแพร่แล้วต้องมี ownership หรือสิทธิ์เข้าถึงการจัดการของผู้เผยแพร่ ผู้ดูแล/admin สามารถใช้ backend เดียวกันผ่าน `clawhub-admin`
- `--update` ใช้ได้เฉพาะกับ `--slug`; จะเขียนผลการสแกนที่เผยแพร่แล้วซึ่งสำเร็จกลับไปยังเวอร์ชันที่เลือก
- `--output <file.zip>` ดาวน์โหลด archive รายงานเต็มพร้อม `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`
- `--json` พิมพ์การตอบกลับ poll แบบเต็มสำหรับ automation
- ไม่รองรับการสแกนพาธในเครื่องอีกต่อไป ให้อัปโหลดเวอร์ชันใหม่ จากนั้นใช้ `scan download` เพื่อดึงผลการสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งนั้น

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- ต้องใช้ `clawhub login`
- ดาวน์โหลด ZIP รายงานการสแกนที่จัดเก็บไว้สำหรับเวอร์ชัน skill หรือ Plugin ที่ส่ง รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อนโดยการตรวจสอบความปลอดภัยของ ClawHub
- การดาวน์โหลด skill ใช้ slug ของ skill และมีค่าเริ่มต้นเป็น `--kind skill`
- การดาวน์โหลด Plugin ใช้ชื่อแพ็กเกจและต้องใช้ `--kind plugin`
- ต้องระบุ `--version` เพื่อให้ผู้เขียนตรวจสอบเวอร์ชันที่ส่งอย่างแน่นอนซึ่ง ClawHub บล็อกไว้
- `--output <file.zip>` เลือกพาธปลายทาง

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub มาพร้อม workflow ทางการที่ใช้ซ้ำได้ที่
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/8f98128aab28627477a3858081a13b76cba6f5d6/.github/workflows/skill-publish.yml)
สำหรับ repo ของ skill และ repo ของ catalog

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

- `root` มีค่าเริ่มต้นเป็น `skills` สำหรับ repo ของ catalog
- ส่ง `skill_path: skills/review-helper` เพื่อประมวลผลโฟลเดอร์ skill หนึ่งรายการ
- `owner` map ไปยังแฟล็ก CLI `--owner`; ละไว้เพื่อเผยแพร่ในฐานะผู้ใช้ที่ผ่านการยืนยันตัวตน
- การเผยแพร่ skill V1 ใช้ `clawhub_token`; GitHub OIDC trusted publishing ตอนนี้ใช้ได้เฉพาะแพ็กเกจเท่านั้น

### `delete <skill>`

- หากไม่มี `--version` ให้ลบ skill แบบ soft-delete (เจ้าของ, moderator หรือ admin)
- เรียก `DELETE /api/v1/skills/{slug}`
- การ soft-delete ที่เริ่มโดยเจ้าของจะสงวน slug ไว้ 30 วัน; คำสั่งจะแสดงเวลาหมดอายุ
- `--version <version>` ลบเวอร์ชันที่เป็นของตนเองและไม่ใช่เวอร์ชันล่าสุดหนึ่งรายการอย่างถาวรผ่านเส้นทางเฉพาะเวอร์ชันแบบ fail-closed
  เวอร์ชันที่ถูกลบแล้วไม่สามารถกู้คืนหรือเผยแพร่ซ้ำได้ เผยแพร่รายการทดแทนก่อนลบ
  เวอร์ชันล่าสุดปัจจุบัน เจ้าหน้าที่แพลตฟอร์มไม่สามารถข้ามความเป็นเจ้าของสำหรับโฟลว์เฉพาะเวอร์ชันนี้ได้
- `--reason <text>` บันทึกหมายเหตุการ moderation บนการ soft-delete ทั้ง skill และ audit log
- `--note <text>` เป็น alias ของ `--reason`
- `--yes` ข้ามการยืนยัน

### `undelete <skill>`

- กู้คืน skill ที่ถูกซ่อนไว้ (เจ้าของ, moderator หรือ admin)
- ไม่มีการ undelete เวอร์ชัน; เวอร์ชันที่ถูกลบถาวรไม่สามารถกู้คืนได้
- เรียก `POST /api/v1/skills/{slug}/undelete`
- `--reason <text>` บันทึกหมายเหตุการ moderation บน skill และ audit log
- `--note <text>` เป็น alias ของ `--reason`
- `--yes` ข้ามการยืนยัน

### `hide <skill>`

- ซ่อน skill (เจ้าของ, moderator หรือ admin)
- Alias ของ `delete`

### `unhide <skill>`

- ยกเลิกการซ่อน skill (เจ้าของ, moderator หรือ admin)
- Alias ของ `undelete`

### `skill rename <skill> <new-name>`

- เปลี่ยนชื่อ skill ที่เป็นของตนเองและเก็บ slug ก่อนหน้าไว้เป็น alias สำหรับ redirect
- เรียก `POST /api/v1/skills/{slug}/rename`
- `--yes` ข้ามการยืนยัน

### `skill merge <source> <target>`

- ผสาน skill ที่เป็นของตนเองหนึ่งรายการเข้ากับ skill ที่เป็นของตนเองอีกรายการ
- slug ต้นทางจะหยุดแสดงแบบสาธารณะและกลายเป็น alias สำหรับ redirect ไปยังเป้าหมาย
- เรียก `POST /api/v1/skills/{sourceSlug}/merge`
- `--yes` ข้ามการยืนยัน

### `transfer`

- เวิร์กโฟลว์การโอนความเป็นเจ้าของ
- การโอนไปยัง handle ของผู้ใช้จะสร้างคำขอที่รอดำเนินการซึ่งผู้รับต้องยอมรับ
- การโอนไปยัง handle ของ org/publisher จะมีผลทันทีเฉพาะเมื่อผู้ดำเนินการมี
  สิทธิ์ admin ทั้งต่อเจ้าของปัจจุบันและ publisher ปลายทาง
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
- ใช้คำสั่งนี้สำหรับ plugins และรายการตระกูลแพ็กเกจอื่นๆ; `search` ระดับบนสุดยังคงเป็นพื้นผิวการค้นหา skill
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

- ดึง metadata ของแพ็กเกจโดยไม่ติดตั้ง
- ใช้คำสั่งนี้สำหรับ metadata ของ plugin, ความเข้ากันได้, การตรวจสอบยืนยัน, แหล่งที่มา และการตรวจสอบเวอร์ชัน/ไฟล์
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: ล่าสุด)
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
  npm shasum และชื่อ/เวอร์ชันใน `package.json` ของ tarball เพิ่มเติม
- เวอร์ชัน ZIP legacy จะดาวน์โหลดผ่านเส้นทาง ZIP legacy
- Flags:
  - `--version <version>`: ดาวน์โหลดเวอร์ชันที่ระบุ
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

- คำนวณ ClawHub SHA-256, npm `sha512` integrity และ npm shasum สำหรับ
  artifact ในเครื่อง
- เมื่อใช้กับ `--package` จะแปลง metadata ที่คาดหวังจาก ClawHub และเปรียบเทียบ
  ไฟล์ในเครื่องกับ metadata ของ artifact ที่เผยแพร่แล้ว
- เมื่อใช้ flag digest โดยตรง จะตรวจสอบโดยไม่ต้องค้นหาผ่านเครือข่าย
- Flags:
  - `--package <name>`: ชื่อแพ็กเกจสำหรับแปลง metadata ของ artifact ที่คาดหวัง
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

- เรียกใช้ Plugin Inspector ที่มาพร้อมกับ ClawHub CLI กับโฟลเดอร์แพ็กเกจ plugin
  ในเครื่อง
- ค่าเริ่มต้นคือการตรวจสอบแบบ offline/static โดยไม่ค้นหาหรือนำเข้า checkout
  OpenClaw ในเครื่อง
- ข้อผิดพลาดความเข้ากันได้แบบร้ายแรงจะออกด้วยรหัสที่ไม่ใช่ศูนย์ ผลลัพธ์ที่เป็นเฉพาะคำเตือนจะถูกพิมพ์ออกมาแต่
  ออกด้วยรหัสศูนย์
- Flags:
  - `--out <dir>`: เขียนรายงาน Plugin Inspector ไปยังไดเรกทอรีนี้
  - `--openclaw <path>`: ตรวจสอบกับ checkout OpenClaw ในเครื่องที่ระบุชัดเจน
  - `--runtime`: เปิดใช้การจับ runtime; นำเข้าโค้ด plugin
  - `--allow-execute`: อนุญาตการจับ runtime ในพื้นที่ทำงานที่แยกไว้
  - `--no-mock-sdk`: ปิดใช้ OpenClaw SDK จำลองระหว่างการจับ runtime
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package validate ./example-plugin
```

หากการตรวจสอบรายงานผลลัพธ์เกี่ยวกับแพ็กเกจ, manifest, การ import SDK หรือ artifact โปรดดู
[การแก้ไขการตรวจสอบ Plugin](/th/clawhub/plugin-validation-fixes) แล้วเรียกใช้คำสั่งอีกครั้ง

### `package delete <name>`

- หากไม่มี `--version` ให้ soft-delete แพ็กเกจและ release ทั้งหมด
- `--version <version>` ลบ release ที่เป็นของตนเองและไม่ใช่ล่าสุดหนึ่งรายการอย่างถาวรผ่านเส้นทางเฉพาะเวอร์ชันแบบ fail-closed
  เวอร์ชันที่ถูกลบแล้วไม่สามารถกู้คืนหรือเผยแพร่ซ้ำได้ เผยแพร่รายการทดแทนก่อนลบ
  เวอร์ชันล่าสุดปัจจุบัน โฟลว์เฉพาะเวอร์ชันนี้ต้องใช้เจ้าของแพ็กเกจหรือ admin ของ org publisher;
  เจ้าหน้าที่แพลตฟอร์มไม่สามารถข้ามความเป็นเจ้าของแพ็กเกจได้
- การ soft-delete ทั้งแพ็กเกจต้องใช้เจ้าของแพ็กเกจ, owner/admin ของ org publisher, platform
  moderator หรือ platform admin
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
- ไม่มีการ undelete เวอร์ชัน; เวอร์ชันที่ถูกลบถาวรไม่สามารถกู้คืนได้
- ต้องใช้เจ้าของแพ็กเกจ, owner/admin ของ org publisher, platform moderator
  หรือ platform admin
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
- ต้องมีสิทธิ์ admin ทั้งต่อเจ้าของแพ็กเกจปัจจุบันและ publisher
  ปลายทาง เว้นแต่ดำเนินการโดย platform admin
- ชื่อแพ็กเกจแบบ scoped ต้องโอนไปยังเจ้าของ scope ที่ตรงกัน
- เรียก `POST /api/v1/packages/{name}/transfer`
- Flags:
  - `--to <owner>`: handle ของ publisher ปลายทาง
  - `--reason <text>`: เหตุผล audit ที่ระบุหรือไม่ก็ได้
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- คำสั่งที่ต้องยืนยันตัวตนสำหรับรายงานแพ็กเกจต่อ moderator
- เรียก `POST /api/v1/packages/{name}/report`
- รายงานอยู่ในระดับแพ็กเกจ ผูกกับเวอร์ชันได้ตามต้องการ และจะมองเห็นได้
  สำหรับ moderator เพื่อตรวจทาน
- รายงานจะไม่ซ่อนแพ็กเกจอัตโนมัติหรือบล็อกการดาวน์โหลดด้วยตัวเอง
- Flags:
  - `--version <version>`: เวอร์ชันแพ็กเกจที่ระบุหรือไม่ก็ได้เพื่อแนบกับรายงาน
  - `--reason <text>`: เหตุผลรายงานที่จำเป็น
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- คำสั่งสำหรับเจ้าของเพื่อตรวจสอบการมองเห็นด้าน moderation ของแพ็กเกจ
- เรียก `GET /api/v1/packages/{name}/moderation`
- แสดงสถานะการสแกนแพ็กเกจปัจจุบัน, จำนวนรายงานที่เปิดอยู่, สถานะ manual
  moderation ของ release ล่าสุด, สถานะการบล็อกดาวน์โหลด และเหตุผล moderation
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
  provenance ของแหล่งที่มา, ความเข้ากันได้กับ OpenClaw, host targets, metadata สภาพแวดล้อม
  และสถานะการสแกน
- Flags:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- แสดงสถานะการ migration ที่มุ่งเน้นผู้ปฏิบัติการสำหรับแพ็กเกจที่อาจแทนที่
  bundled OpenClaw plugin
- เรียก endpoint readiness ที่คำนวณเดียวกันกับ `package readiness` แต่พิมพ์
  สถานะที่มุ่งเน้นการ migration, เวอร์ชันล่าสุด, สถานะแพ็กเกจ official, checks และ
  blockers
- Flags:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- สร้าง org publisher ที่เป็นของผู้ใช้ที่ยืนยันตัวตนแล้ว
- handle จะถูกทำให้เป็นตัวพิมพ์เล็กและส่งมาโดยมีหรือไม่มี `@` ก็ได้
- org publishers ที่สร้างใหม่จะไม่ trusted/official โดยค่าเริ่มต้น
- ล้มเหลวหาก handle ถูกใช้แล้วโดย publisher, ผู้ใช้ หรือ route ที่สงวนไว้ที่มีอยู่

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- เผยแพร่ Plugin แบบโค้ดหรือ Plugin แบบบันเดิลผ่าน `POST /api/v1/packages`
- `<source>` รับค่า:
  - พาธโฟลเดอร์ภายในเครื่อง: `./my-plugin`
  - ไฟล์ tarball แบบ npm-pack ของ ClawPack ภายในเครื่อง: `./my-plugin-1.2.3.tgz`
  - รีโป GitHub: `owner/repo` หรือ `owner/repo@ref`
  - URL ของ GitHub: `https://github.com/owner/repo`
- ระบบจะตรวจหาเมทาดาต้าโดยอัตโนมัติจาก `package.json`, `openclaw.plugin.json` และ
  มาร์กเกอร์บันเดิล OpenClaw จริง เช่น `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` และ `.cursor-plugin/plugin.json`
- ซอร์ส `.tgz` จะถูกถือว่าเป็น ClawPack CLI จะอัปโหลดไบต์ npm-pack
  ตามจริง และใช้เนื้อหา `package/` ที่แตกออกมาเฉพาะสำหรับการตรวจสอบความถูกต้องและ
  เติมเมทาดาต้าล่วงหน้าเท่านั้น
- โฟลเดอร์ Plugin แบบโค้ดจะถูกแพ็กเป็น npm tarball ของ ClawPack ก่อนอัปโหลด เพื่อให้
  การติดตั้ง OpenClaw ตรวจสอบอาร์ติแฟกต์ที่แน่นอนได้ โฟลเดอร์ Plugin แบบบันเดิลยังคง
  ใช้เส้นทางเผยแพร่แบบไฟล์ที่แตกออกมา
- สำหรับซอร์ส GitHub การระบุแหล่งที่มาจะถูกเติมโดยอัตโนมัติจากรีโป, commit ที่ resolve แล้ว, ref และ subpath
- สำหรับโฟลเดอร์ภายในเครื่อง การระบุแหล่งที่มาจะถูกตรวจหาโดยอัตโนมัติจาก git ภายในเครื่องเมื่อ origin remote ชี้ไปที่ GitHub
- Plugin แบบโค้ดภายนอกต้องประกาศ `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion` อย่างชัดเจน
  `package.json.version` ระดับบนสุดจะไม่ถูกใช้เป็น fallback สำหรับการตรวจสอบการเผยแพร่
- `--dry-run` แสดงตัวอย่าง payload การเผยแพร่ที่ resolve แล้วโดยไม่อัปโหลด
- `--json` ส่งออกผลลัพธ์ที่เครื่องอ่านได้สำหรับ CI
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่ของผู้ใช้หรือองค์กรเมื่อ actor มีสิทธิ์เข้าถึงผู้เผยแพร่
- ชื่อแพ็กเกจแบบ scoped ต้องตรงกับเจ้าของที่เลือก ดู `docs/publishing.md`
- flag ที่มีอยู่ (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ยังคงใช้เป็น override ได้
- รีโป GitHub ส่วนตัวต้องใช้ `GITHUB_TOKEN`

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### โฟลว์ภายในเครื่องที่แนะนำ

ใช้ `--dry-run` ก่อน เพื่อให้คุณยืนยันเมทาดาต้าแพ็กเกจและ
การระบุแหล่งที่มาที่ resolve แล้วก่อนสร้างรุ่นเผยแพร่จริง:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### โฟลว์โฟลเดอร์ภายในเครื่อง

สำหรับ Plugin แบบโค้ด การเผยแพร่จากโฟลเดอร์จะสร้างและอัปโหลดอาร์ติแฟกต์ ClawPack จาก
โฟลเดอร์แพ็กเกจ:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` ขั้นต่ำสำหรับ `--family code-plugin`

Plugin แบบโค้ดภายนอกต้องมีเมทาดาต้า OpenClaw จำนวนเล็กน้อยใน
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

- `package.json.version` คือเวอร์ชันรุ่นเผยแพร่ของแพ็กเกจคุณ แต่จะไม่ถูกใช้เป็น
  fallback สำหรับการตรวจสอบความเข้ากันได้/บิลด์ของ OpenClaw
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมทาดาต้าเสริม
  ClawHub อาจแสดงข้อมูลเหล่านี้เมื่อมีอยู่ แต่ไม่จำเป็นสำหรับการเผยแพร่
- `openclaw.compat.minGatewayVersion` และ
  `openclaw.build.pluginSdkVersion` เป็นรายการเสริมถ้าคุณต้องการเผยแพร่
  เมทาดาต้าความเข้ากันได้ที่ละเอียดขึ้น
- หากคุณใช้ CLI `clawhub` รุ่นเก่า ให้อัปเกรดก่อนเผยแพร่ เพื่อให้
  การตรวจสอบ preflight ภายในเครื่องทำงานก่อนอัปโหลด
- หากการตรวจสอบรายงานรหัสการแก้ไข ดู
  [การแก้ไขการตรวจสอบ Plugin](/th/clawhub/plugin-validation-fixes)

#### GitHub Actions

ClawHub ยังมี reusable workflow อย่างเป็นทางการที่
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/8f98128aab28627477a3858081a13b76cba6f5d6/.github/workflows/package-publish.yml)
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

- reusable workflow ตั้งค่าเริ่มต้นของ `source` เป็นรีโป caller
- สำหรับ monorepo ให้ส่ง `source_path` เพื่อให้ workflow เผยแพร่
  โฟลเดอร์แพ็กเกจ Plugin เช่น `source_path: extensions/codex`
- ปัก reusable workflow ไว้กับ tag ที่เสถียรหรือ commit SHA แบบเต็ม อย่ารันการเผยแพร่ release จาก `@main`
- `pull_request` ควรใช้ `dry_run: true` เพื่อให้ CI ไม่สร้างผลข้างเคียง
- การเผยแพร่จริงควรจำกัดไว้ที่เหตุการณ์ที่เชื่อถือได้ เช่น `workflow_dispatch` หรือการ push tag
- การเผยแพร่ที่เชื่อถือได้โดยไม่มี secret ใช้ได้เฉพาะบน `workflow_dispatch`; การ push tag ยังต้องใช้ `clawhub_token`
- เก็บ `clawhub_token` ให้พร้อมใช้งานสำหรับการเผยแพร่ครั้งแรก, แพ็กเกจที่ไม่น่าเชื่อถือ หรือการเผยแพร่แบบ break-glass
- workflow อัปโหลดผลลัพธ์ JSON เป็นอาร์ติแฟกต์และเปิดเผยเป็น output ของ workflow

### `package trusted-publisher get <name>`

- แสดงการกำหนดค่า trusted publisher ของ GitHub Actions สำหรับแพ็กเกจ
- ใช้คำสั่งนี้หลังตั้งค่าการกำหนดค่า เพื่อยืนยัน repository, ชื่อไฟล์ workflow,
  และ environment pin ที่เป็นตัวเลือก
- flag:
  - `--json`: ผลลัพธ์ที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- แนบหรือแทนที่การกำหนดค่า trusted publisher ของ GitHub Actions สำหรับ
  แพ็กเกจที่มีอยู่
- ต้องสร้างแพ็กเกจก่อนผ่านการ
  `clawhub package publish` แบบ manual ปกติหรือแบบยืนยันตัวตนด้วย token
- หลังตั้งค่าการกำหนดค่าแล้ว การเผยแพร่ผ่าน GitHub Actions ที่รองรับในอนาคตสามารถใช้
  OIDC/trusted publishing ได้โดยไม่ต้องใช้ token ของ ClawHub ที่มีอายุยาว
- `--repository <repo>` ต้องเป็น `owner/repo`
- `--workflow-filename <file>` ต้องตรงกับชื่อไฟล์ workflow ใน
  `.github/workflows/`
- `--environment <name>` เป็นตัวเลือก เมื่อกำหนดค่าแล้ว environment ของ GitHub Actions
  ใน OIDC claim ต้องตรงกันทุกตัวอักษร
- ClawHub ตรวจสอบ repository GitHub ที่กำหนดค่าไว้เมื่อคำสั่งนี้ทำงาน
  repository สาธารณะสามารถตรวจสอบผ่านเมทาดาต้าสาธารณะของ GitHub ได้ repository
  ส่วนตัวต้องให้ ClawHub มีสิทธิ์เข้าถึง GitHub สำหรับ repository นั้น เช่น
  ผ่านการติดตั้ง GitHub App ของ ClawHub ในอนาคต หรือ integration ของ GitHub
  อื่นที่ได้รับอนุญาต
- flag:
  - `--repository <repo>`: repository GitHub เช่น `openclaw/example-plugin`
  - `--workflow-filename <file>`: ชื่อไฟล์ workflow เช่น `package-publish.yml`
  - `--environment <name>`: environment ของ GitHub Actions ที่ต้องตรงกันทุกตัวอักษรแบบตัวเลือก
  - `--json`: ผลลัพธ์ที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- ลบการกำหนดค่า trusted publisher ออกจากแพ็กเกจ
- ใช้เป็น rollback หาก workflow, repository หรือ environment pin จำเป็นต้อง
  ปิดใช้งานหรือสร้างใหม่
- การเผยแพร่จริงในอนาคตต้องใช้การเผยแพร่แบบยืนยันตัวตนตามปกติจนกว่าจะ
  ตั้งค่าการกำหนดค่าอีกครั้ง
- flag:
  - `--json`: ผลลัพธ์ที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### เทเลเมทรีการติดตั้ง

- ส่งหลังจาก `clawhub install <slug>` เมื่อเข้าสู่ระบบแล้ว เว้นแต่
  ตั้งค่า `CLAWHUB_DISABLE_TELEMETRY=1`
- การรายงานเป็นแบบพยายามอย่างดีที่สุด คำสั่งติดตั้งจะไม่ล้มเหลวหากเทเลเมทรี
  ไม่พร้อมใช้งาน
- รายละเอียด: `docs/telemetry.md`
