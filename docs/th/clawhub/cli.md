---
read_when:
    - การใช้ ClawHub CLI
    - การดีบักการติดตั้ง การอัปเดต หรือการเผยแพร่
summary: 'ข้อมูลอ้างอิง CLI: คำสั่ง แฟล็ก การกำหนดค่า และพฤติกรรมของไฟล์ล็อก'
x-i18n:
    generated_at: "2026-07-02T17:48:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 57fee67174cf491721e8479a48a11b66e23260ce4899d2ee5437add05880748e
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

แพ็กเกจ CLI: `clawhub`, ไบนารี: `clawhub`.

ติดตั้งแบบส่วนกลางด้วย npm หรือ pnpm:

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
- `--dir <dir>`: ไดเรกทอรีติดตั้งภายใต้ไดเรกทอรีทำงาน (ค่าเริ่มต้น: `skills`)
- `--site <url>`: URL ฐานสำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `https://clawhub.ai`)
- `--registry <url>`: URL ฐานของ API (ค่าเริ่มต้น: ค้นพบอัตโนมัติ มิฉะนั้นใช้ `https://clawhub.ai`)
- `--no-input`: ปิดใช้งานพรอมป์

ค่าที่เทียบเท่าผ่านสภาพแวดล้อม:

- `CLAWHUB_SITE` (เดิม `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (เดิม `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (เดิม `CLAWDHUB_WORKDIR`)

### พร็อกซี HTTP

CLI เคารพตัวแปรสภาพแวดล้อมพร็อกซี HTTP มาตรฐานสำหรับระบบที่อยู่หลัง
พร็อกซีองค์กรหรือเครือข่ายที่ถูกจำกัด:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

เมื่อตั้งค่าตัวแปรใดตัวแปรหนึ่งเหล่านี้ CLI จะกำหนดเส้นทางคำขอขาออกผ่าน
พร็อกซีที่ระบุ `HTTPS_PROXY` ใช้สำหรับคำขอ HTTPS, `HTTP_PROXY`
สำหรับ HTTP แบบปกติ `NO_PROXY` / `no_proxy` จะถูกเคารพเพื่อข้ามพร็อกซีสำหรับ
โฮสต์หรือโดเมนเฉพาะ

สิ่งนี้จำเป็นบนระบบที่การเชื่อมต่อขาออกโดยตรงถูกบล็อก
(เช่น คอนเทนเนอร์ Docker, Hetzner VPS ที่ใช้อินเทอร์เน็ตผ่านพร็อกซีเท่านั้น,
ไฟร์วอลล์องค์กร)

ตัวอย่าง:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

เมื่อไม่ได้ตั้งค่าตัวแปรพร็อกซีใด ๆ พฤติกรรมจะไม่เปลี่ยนแปลง (เชื่อมต่อโดยตรง)

## ไฟล์การกำหนดค่า

จัดเก็บโทเค็น API ของคุณ + URL รีจิสทรีที่แคชไว้

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` หรือ `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- ทางเลือกสำรองเดิม: หาก `clawhub/config.json` ยังไม่มีอยู่ แต่ `clawdhub/config.json` มีอยู่ CLI จะนำพาธเดิมมาใช้ซ้ำ
- เขียนทับ: `CLAWHUB_CONFIG_PATH` (เดิม `CLAWDHUB_CONFIG_PATH`)

## คำสั่ง

### `login` / `auth login`

- ค่าเริ่มต้น: เปิดเบราว์เซอร์ไปที่ `<site>/cli/auth` และเสร็จสมบูรณ์ผ่านการเรียกกลับแบบ loopback
- แบบไม่มีหน้าจอ: `clawhub login --token clh_...`
- แบบระยะไกล/ไม่มีหน้าจอเชิงโต้ตอบ: `clawhub login --device` พิมพ์รหัสและรอขณะที่คุณอนุญาตที่ `<site>/cli/device`

### `whoami`

- ตรวจสอบโทเค็นที่จัดเก็บไว้ผ่าน `/api/v1/whoami`

### `token`

- พิมพ์โทเค็น API ที่จัดเก็บไว้ไปยัง stdout
- มีประโยชน์สำหรับการส่งโทเค็นเข้าสู่ระบบในเครื่องผ่านไปป์ไปยังคำสั่งตั้งค่าความลับของ CI

### `star <skill>` / `unstar <skill>`

- เพิ่ม/ลบสกิลจากรายการไฮไลต์ของคุณ
- เรียก `POST /api/v1/stars/<slug>` และ `DELETE /api/v1/stars/<slug>`
- `--yes` ข้ามการยืนยัน

### `search <query...>`

- เรียก `/api/v1/search?q=...`
- เอาต์พุตมีสลักของสกิล แฮนเดิลเจ้าของ ชื่อที่แสดง และคะแนนความเกี่ยวข้อง
- การค้นหาจะให้ความสำคัญกับการตรงกันของโทเค็นสลัก/ชื่อแบบตรงตัวก่อนความนิยมจากการดาวน์โหลด โทเค็นสลักแบบเดี่ยว เช่น `map` จะตรงกับ `personal-map` ได้แรงกว่าข้อความย่อยภายใน `amap`
- ความนิยมเป็นค่านำอันดับขนาดเล็ก ไม่ใช่การรับประกันว่าจะได้ตำแหน่งสูงสุด
- หากสกิลควรปรากฏแต่ไม่ปรากฏ ให้รัน `clawhub inspect @owner/slug` ขณะเข้าสู่ระบบเพื่อตรวจสอบการวินิจฉัยการกลั่นกรองที่เจ้าของมองเห็นได้ก่อนเปลี่ยนชื่อข้อมูลเมตา

### `explore`

- แสดงรายการสกิลใหม่ล่าสุดผ่าน `/api/v1/skills?limit=...&sort=createdAt` (เรียงตาม `createdAt` จากมากไปน้อย)
- แฟล็ก:
  - `--limit <n>` (1-200, ค่าเริ่มต้น: 25)
  - `--sort newest|updated|rating|downloads|trending` (ค่าเริ่มต้น: newest) ชื่อแทนการเรียงลำดับสำหรับการติดตั้งแบบเดิมยังใช้งานได้เพื่อความเข้ากันได้
  - `--json` (เอาต์พุตที่เครื่องอ่านได้)
- เอาต์พุต: `<slug>  v<version>  <age>  <summary>` (สรุปถูกตัดเหลือ 50 อักขระ)

### `inspect @owner/slug`

- ดึงข้อมูลเมตาของสกิลและไฟล์เวอร์ชันโดยไม่ติดตั้ง
- `--version <version>`: ตรวจสอบเวอร์ชันเฉพาะ (ค่าเริ่มต้น: ล่าสุด)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-200)
- `--files`: แสดงรายการไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (เฉพาะไฟล์ข้อความ; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `install @owner/slug`

- แก้หาเวอร์ชันล่าสุดสำหรับเจ้าของและสกิลที่ระบุ
- ดาวน์โหลด zip ผ่าน `/api/v1/download`
- แตกไฟล์ไปยัง `<workdir>/<dir>/<slug>`
- ปฏิเสธการเขียนทับสกิลที่ปักหมุดไว้; ให้รัน `clawhub unpin <skill>` ก่อน
- เขียน:
  - `<workdir>/.clawhub/lock.json` (เดิม `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (เดิม `.clawdhub`)

### `uninstall <skill>`

- ลบ `<workdir>/<dir>/<slug>` และลบรายการในไฟล์ล็อก
- ส่งโทรมาตรแบบพยายามให้ดีที่สุดขณะเข้าสู่ระบบ เพื่อให้จำนวนการติดตั้งปัจจุบันสามารถ
  ถูกปิดใช้งานได้
- เชิงโต้ตอบ: ถามเพื่อยืนยัน
- ไม่เชิงโต้ตอบ (`--no-input`): ต้องใช้ `--yes`

### `list`

- อ่าน `<workdir>/.clawhub/lock.json` (เดิม `.clawdhub`)
- แสดง `pinned` ถัดจากสกิลที่ถูกตรึงด้วย `clawhub pin` รวมถึงเหตุผลแบบไม่บังคับ

### `pin <skill>`

- ทำเครื่องหมายสกิลที่ติดตั้งแล้วว่าถูกปักหมุดในไฟล์ล็อก
- `--reason <text>` บันทึกเหตุผลที่สกิลถูกตรึง
- สกิลที่ปักหมุดจะถูกข้ามโดย `update --all` และถูกปฏิเสธโดย `update <skill>` โดยตรง
- สกิลที่ปักหมุดยังปฏิเสธ `install --force` เพื่อไม่ให้ไบต์ในเครื่องถูกแทนที่โดยไม่ตั้งใจ

### `unpin <skill>`

- ลบการปักหมุดในไฟล์ล็อกจากสกิลที่ติดตั้งแล้ว เพื่อให้การอัปเดตในอนาคตแก้ไขได้

### `update [@owner/slug]` / `update --all`

- คำนวณลายนิ้วมือจากไฟล์ในเครื่อง
- หากลายนิ้วมือตรงกับเวอร์ชันที่รู้จัก: ไม่มีพรอมป์
- หากลายนิ้วมือไม่ตรง:
  - ปฏิเสธตามค่าเริ่มต้น
  - เขียนทับด้วย `--force` (หรือพรอมป์ หากเป็นเชิงโต้ตอบ)
- สกิลที่ปักหมุดจะไม่ถูกอัปเดตโดย `--force`
- `update <skill>` ล้มเหลวอย่างรวดเร็วสำหรับสกิลที่ปักหมุดและบอกให้คุณรัน `clawhub unpin <skill>` ก่อน
- `update --all` ข้ามสลักที่ปักหมุดและพิมพ์สรุปว่าสิ่งใดยังคงถูกตรึงไว้

### `skill publish <path>`

- เปรียบเทียบลายนิ้วมือของบันเดิลในเครื่องกับ ClawHub และออกสำเร็จเมื่อ
  เนื้อหาถูกเผยแพร่แล้ว
- สกิลใหม่มีค่าเริ่มต้นเป็น `1.0.0`; สกิลที่เปลี่ยนแปลงมีค่าเริ่มต้นเป็นเวอร์ชันแพตช์ถัดไป
- `--version <version>` เลือกเวอร์ชันอย่างชัดเจนและเผยแพร่แม้เมื่อ
  เนื้อหาตรงกับเวอร์ชันที่มีอยู่
- `--dry-run` แก้การเผยแพร่โดยไม่อัปโหลด; `--json` พิมพ์ผลลัพธ์
  ที่เครื่องอ่านได้
- `--owner <handle>` เผยแพร่ภายใต้แฮนเดิลผู้เผยแพร่ขององค์กร/ผู้ใช้เมื่อ
  ผู้ดำเนินการมีสิทธิ์เข้าถึงผู้เผยแพร่
- `--migrate-owner` ย้ายสกิลที่มีอยู่ไปยัง `--owner` ขณะเผยแพร่
  เวอร์ชันใหม่ ต้องมีสิทธิ์ผู้ดูแลระบบ/เจ้าของบนผู้เผยแพร่ทั้งสอง
- อธิบายพฤติกรรมของเจ้าของและการตรวจทานไว้ใน `docs/publishing.md`
- การเผยแพร่สกิลหมายความว่าสกิลนั้นถูกเผยแพร่ภายใต้ `MIT-0` บน ClawHub
- สกิลที่เผยแพร่แล้วสามารถใช้ แก้ไข และแจกจ่ายซ้ำได้ฟรีโดยไม่ต้องระบุที่มา
- ClawHub ไม่รองรับสกิลแบบชำระเงินหรือการกำหนดราคาต่อสกิล
- ชื่อแทนเดิม: `publish <path>`

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
พฤติกรรมเวอร์ชันแพตช์อัตโนมัติแบบเดียวกัน

ตั้งค่า `dry_run: true` เพื่อดูตัวอย่างโดยไม่มีโทเค็น การเผยแพร่จริงต้องใช้
ความลับ `clawhub_token`

### `sync`

- สแกนไดเรกทอรีทำงานปัจจุบัน ไดเรกทอรีสกิลที่กำหนดค่าไว้ และโฟลเดอร์
  `--root <dir>` ใด ๆ เพื่อหาโฟลเดอร์สกิลในเครื่องที่มี `SKILL.md` หรือ
  `skill.md`
- เปรียบเทียบลายนิ้วมือของแต่ละสกิลในเครื่องกับ ClawHub และเผยแพร่เฉพาะสกิลใหม่หรือ
  สกิลที่เปลี่ยนแปลง
- สกิลใหม่เผยแพร่เป็น `1.0.0`; สกิลที่เปลี่ยนแปลงจะเผยแพร่เป็นเวอร์ชันแพตช์ถัดไป
  ตามค่าเริ่มต้น ใช้ `--bump minor|major` สำหรับชุดการอัปเดตที่ควรขยับขึ้นตามขั้น
  semver ที่ใหญ่กว่า
- `--dry-run` แสดงแผนการเผยแพร่โดยไม่อัปโหลด; `--json` พิมพ์แผน
  ที่เครื่องอ่านได้
- `--all` เผยแพร่สกิลใหม่หรือสกิลที่เปลี่ยนแปลงทั้งหมดโดยไม่ต้องถาม หากไม่มี
  `--all` เทอร์มินัลเชิงโต้ตอบจะให้คุณเลือกสกิลที่จะเผยแพร่
- `--owner <handle>` เผยแพร่ภายใต้แฮนเดิลผู้เผยแพร่ขององค์กร/ผู้ใช้เมื่อ
  ผู้ดำเนินการมีสิทธิ์เข้าถึงผู้เผยแพร่
- `sync` เป็นการเผยแพร่ทางเดียวเท่านั้น ไม่ติดตั้ง อัปเดต ดาวน์โหลด หรือ
  รายงานโทรมาตรการติดตั้ง/ดาวน์โหลด

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- ต้องใช้ `clawhub login`
- รัน ClawHub ClawScan ผ่าน `POST /api/v1/skills/-/scan` จากนั้นโพลจนกว่าสแกนจะถึงสถานะปลายทาง
- การสแกนเป็นแบบอะซิงโครนัสและอาจใช้เวลาจนเสร็จ ขณะอยู่ในคิว ตัวหมุนในเทอร์มินัลจะแสดงตำแหน่งสแกนที่ถูกจัดลำดับความสำคัญปัจจุบันและจำนวนสแกนที่อยู่ข้างหน้า
- การสแกนที่เผยแพร่แล้วต้องมีความเป็นเจ้าของหรือสิทธิ์เข้าถึงการจัดการผู้เผยแพร่ ผู้กลั่นกรอง/ผู้ดูแลระบบสามารถใช้แบ็กเอนด์เดียวกันผ่าน `clawhub-admin`
- `--update` ใช้ได้เฉพาะกับ `--slug`; จะเขียนผลการสแกนที่เผยแพร่สำเร็จกลับไปยังเวอร์ชันที่เลือก
- `--output <file.zip>` ดาวน์โหลดไฟล์เก็บถาวรรายงานฉบับเต็มพร้อม `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`
- `--json` พิมพ์การตอบกลับการโพลฉบับเต็มสำหรับระบบอัตโนมัติ
- ไม่รองรับการสแกนพาธในเครื่องอีกต่อไป อัปโหลดเวอร์ชันใหม่ แล้วใช้ `scan download` เพื่อดึงผลการสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งนั้น

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- ต้องใช้ `clawhub login`
- ดาวน์โหลด ZIP รายงานสแกนที่จัดเก็บไว้สำหรับเวอร์ชันสกิลหรือ Plugin ที่ส่ง รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อนไว้โดยการตรวจสอบความปลอดภัยของ ClawHub
- การดาวน์โหลดสกิลใช้สลักของสกิลและมีค่าเริ่มต้นเป็น `--kind skill`
- การดาวน์โหลด Plugin ใช้ชื่อแพ็กเกจและต้องใช้ `--kind plugin`
- ต้องใช้ `--version` เพื่อให้ผู้เขียนตรวจสอบเวอร์ชันที่ส่งซึ่ง ClawHub บล็อกไว้อย่างแน่นอน
- `--output <file.zip>` เลือกพาธปลายทาง

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub จัดส่งเวิร์กโฟลว์ที่ใช้ซ้ำได้อย่างเป็นทางการที่
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/a89bfaf61d1bb5e0bfa7a92cf35b76c7e404e1ca/.github/workflows/skill-publish.yml)
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

- `root` มีค่าเริ่มต้นเป็น `skills` สำหรับรีโปแคตตาล็อก
- ส่ง `skill_path: skills/review-helper` เพื่อประมวลผลโฟลเดอร์สกิลหนึ่งโฟลเดอร์
- `owner` แมปกับแฟล็ก CLI `--owner`; ละไว้เพื่อเผยแพร่ในฐานะผู้ใช้ที่ผ่านการยืนยันตัวตน
- การเผยแพร่สกิล V1 ใช้ `clawhub_token`; การเผยแพร่ที่เชื่อถือได้ผ่าน GitHub OIDC ยังรองรับเฉพาะแพ็กเกจในตอนนี้

### `delete <skill>`

- หากไม่มี `--version` ให้ลบ Skills แบบซอฟต์ดีลีต (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- เรียก `DELETE /api/v1/skills/{slug}`
- การลบแบบซอฟต์ดีลีตที่เริ่มโดยเจ้าของจะสงวนสลักไว้ 30 วัน; คำสั่งจะแสดงเวลาหมดอายุ
- `--version <version>` จะลบเวอร์ชันที่ไม่ใช่เวอร์ชันล่าสุดซึ่งเป็นของตนเองอย่างถาวร ผ่านเส้นทางเฉพาะเวอร์ชัน
  ที่ปิดเมื่อเกิดข้อผิดพลาด
  เวอร์ชันที่ถูกลบจะกู้คืนหรือเผยแพร่ซ้ำไม่ได้ เผยแพร่เวอร์ชันทดแทนก่อนลบ
  เวอร์ชันล่าสุดปัจจุบัน เจ้าหน้าที่แพลตฟอร์มไม่ข้ามข้อกำหนดความเป็นเจ้าของสำหรับโฟลว์เฉพาะเวอร์ชันนี้
- `--reason <text>` บันทึกหมายเหตุการดูแลในการลบ Skills ทั้งรายการแบบซอฟต์ดีลีตและบันทึกการตรวจสอบ
- `--note <text>` เป็นนามแฝงของ `--reason`
- `--yes` ข้ามการยืนยัน

### `undelete <skill>`

- กู้คืน Skills ที่ถูกซ่อน (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- ไม่มีการกู้คืนเวอร์ชันที่ถูกลบ; เวอร์ชันที่ถูกลบถาวรจะกู้คืนไม่ได้
- เรียก `POST /api/v1/skills/{slug}/undelete`
- `--reason <text>` บันทึกหมายเหตุการดูแลไว้ใน Skills และบันทึกการตรวจสอบ
- `--note <text>` เป็นนามแฝงของ `--reason`
- `--yes` ข้ามการยืนยัน

### `hide <skill>`

- ซ่อน Skills (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- นามแฝงของ `delete`

### `unhide <skill>`

- เลิกซ่อน Skills (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- นามแฝงของ `undelete`

### `skill rename <skill> <new-name>`

- เปลี่ยนชื่อ Skills ที่เป็นเจ้าของ และเก็บสลักเดิมไว้เป็นนามแฝงสำหรับเปลี่ยนเส้นทาง
- เรียก `POST /api/v1/skills/{slug}/rename`
- `--yes` ข้ามการยืนยัน

### `skill merge <source> <target>`

- รวม Skills ที่เป็นเจ้าของหนึ่งรายการเข้ากับ Skills ที่เป็นเจ้าของอีกรายการ
- สลักต้นทางจะหยุดแสดงต่อสาธารณะและกลายเป็นนามแฝงสำหรับเปลี่ยนเส้นทางไปยังปลายทาง
- เรียก `POST /api/v1/skills/{sourceSlug}/merge`
- `--yes` ข้ามการยืนยัน

### `transfer`

- เวิร์กโฟลว์การโอนความเป็นเจ้าของ
- การโอนไปยังแฮนเดิลผู้ใช้จะสร้างคำขอที่รอดำเนินการเพื่อให้ผู้รับยอมรับ
- การโอนไปยังแฮนเดิลขององค์กร/ผู้เผยแพร่จะมีผลทันทีเฉพาะเมื่อผู้ดำเนินการมี
  สิทธิ์ผู้ดูแลระบบทั้งเจ้าของปัจจุบันและผู้เผยแพร่ปลายทาง
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
- ใช้คำสั่งนี้สำหรับ Plugin และรายการตระกูลแพ็กเกจอื่น ๆ; `search` ระดับบนสุดยังคงเป็นพื้นผิวค้นหา Skills
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
- ใช้คำสั่งนี้เพื่อตรวจสอบข้อมูลเมตาของ Plugin ความเข้ากันได้ การยืนยัน แหล่งที่มา และเวอร์ชัน/ไฟล์
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: ล่าสุด)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-100)
- `--files`: แสดงไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (เฉพาะไฟล์ข้อความ; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `package download <name>`

- แก้ไขเวอร์ชันแพ็กเกจผ่าน
  `GET /api/v1/packages/{name}/versions/{version}/artifact`
- ดาวน์โหลดอาร์ติแฟกต์จาก `downloadUrl` ของตัวแก้ไข
- ตรวจสอบ SHA-256 ของ ClawHub สำหรับอาร์ติแฟกต์ทั้งหมด
- สำหรับอาร์ติแฟกต์ ClawPack npm-pack จะตรวจสอบความสมบูรณ์ `sha512` ของ npm,
  shasum ของ npm และชื่อ/เวอร์ชันใน `package.json` ของ tarball ด้วย
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

- คำนวณ SHA-256 ของ ClawHub, ความสมบูรณ์ `sha512` ของ npm และ shasum ของ npm สำหรับ
  อาร์ติแฟกต์ภายในเครื่อง
- เมื่อใช้ `--package` จะแก้ไขข้อมูลเมตาที่คาดไว้จาก ClawHub และเปรียบเทียบ
  ไฟล์ภายในเครื่องกับข้อมูลเมตาอาร์ติแฟกต์ที่เผยแพร่แล้ว
- เมื่อใช้แฟล็กไดเจสต์โดยตรง จะตรวจสอบโดยไม่ต้องค้นหาผ่านเครือข่าย
- แฟล็ก:
  - `--package <name>`: ชื่อแพ็กเกจสำหรับแก้ไขข้อมูลเมตาอาร์ติแฟกต์ที่คาดไว้
  - `--version <version>` หรือ `--tag <tag>`: เวอร์ชันแพ็กเกจที่คาดไว้
  - `--sha256 <hex>`: SHA-256 ของ ClawHub ที่คาดไว้
  - `--npm-integrity <sri>`: ความสมบูรณ์ของ npm ที่คาดไว้
  - `--npm-shasum <sha1>`: shasum ของ npm ที่คาดไว้
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- เรียกใช้ Plugin Inspector ที่รวมมากับ ClawHub CLI กับโฟลเดอร์แพ็กเกจ Plugin
  ภายในเครื่อง
- ค่าเริ่มต้นคือการตรวจสอบแบบออฟไลน์/สแตติก โดยไม่ระบุตำแหน่งหรือนำเข้าเช็กเอาต์
  OpenClaw ภายในเครื่อง
- ข้อผิดพลาดความเข้ากันได้ระดับร้ายแรงจะออกด้วยรหัสที่ไม่ใช่ศูนย์ ผลการตรวจพบที่เป็นเพียงคำเตือนจะถูกพิมพ์ออกมาแต่
  ออกด้วยรหัสศูนย์
- แฟล็ก:
  - `--out <dir>`: เขียนรายงาน Plugin Inspector ไปยังไดเรกทอรีนี้
  - `--openclaw <path>`: ตรวจสอบเทียบกับเช็กเอาต์ OpenClaw ภายในเครื่องที่ระบุชัดเจน
  - `--runtime`: เปิดใช้การจับข้อมูลรันไทม์; นำเข้าโค้ด Plugin
  - `--allow-execute`: อนุญาตการจับข้อมูลรันไทม์ในเวิร์กสเปซที่แยกไว้
  - `--no-mock-sdk`: ปิดใช้ OpenClaw SDK จำลองระหว่างการจับข้อมูลรันไทม์
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package validate ./example-plugin
```

หากการตรวจสอบรายงานผลการตรวจพบเกี่ยวกับแพ็กเกจ แมนิเฟสต์ การนำเข้า SDK หรืออาร์ติแฟกต์ โปรดดู
[การแก้ไขการตรวจสอบ Plugin](/clawhub/plugin-validation-fixes) แล้วเรียกคำสั่งอีกครั้ง

### `package delete <name>`

- หากไม่มี `--version` ให้ลบแพ็กเกจและรีลีสทั้งหมดแบบซอฟต์ดีลีต
- `--version <version>` จะลบรีลีสที่ไม่ใช่รีลีสล่าสุดซึ่งเป็นของตนเองหนึ่งรายการอย่างถาวร ผ่านเส้นทางเฉพาะเวอร์ชัน
  ที่ปิดเมื่อเกิดข้อผิดพลาด
  เวอร์ชันที่ถูกลบจะกู้คืนหรือเผยแพร่ซ้ำไม่ได้ เผยแพร่เวอร์ชันทดแทนก่อนลบ
  เวอร์ชันล่าสุดปัจจุบัน โฟลว์เฉพาะเวอร์ชันนี้ต้องใช้เจ้าของแพ็กเกจหรือผู้ดูแลระบบผู้เผยแพร่องค์กร;
  เจ้าหน้าที่แพลตฟอร์มไม่ข้ามความเป็นเจ้าของแพ็กเกจ
- การลบทั้งแพ็กเกจแบบซอฟต์ดีลีตต้องใช้เจ้าของแพ็กเกจ เจ้าของ/ผู้ดูแลระบบผู้เผยแพร่องค์กร ผู้ดูแลแพลตฟอร์ม
  หรือผู้ดูแลระบบแพลตฟอร์ม
- แฟล็ก:
  - `--version <version>`: ลบเวอร์ชันที่ไม่ใช่เวอร์ชันล่าสุดหนึ่งรายการอย่างถาวร
  - `--yes`: ข้ามการยืนยัน
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- กู้คืนแพ็กเกจและรีลีสที่ถูกลบแบบซอฟต์ดีลีต
- ไม่มีการกู้คืนเวอร์ชันที่ถูกลบ; เวอร์ชันที่ถูกลบถาวรจะกู้คืนไม่ได้
- ต้องใช้เจ้าของแพ็กเกจ เจ้าของ/ผู้ดูแลระบบผู้เผยแพร่องค์กร ผู้ดูแลแพลตฟอร์ม
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

- โอนแพ็กเกจไปยังผู้เผยแพร่รายอื่น
- ต้องมีสิทธิ์ผู้ดูแลระบบทั้งเจ้าของแพ็กเกจปัจจุบันและผู้เผยแพร่
  ปลายทาง เว้นแต่จะดำเนินการโดยผู้ดูแลระบบแพลตฟอร์ม
- ชื่อแพ็กเกจที่มีขอบเขตต้องโอนไปยังเจ้าของขอบเขตที่ตรงกัน
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
- รายงานอยู่ในระดับแพ็กเกจ อาจผูกกับเวอร์ชันได้ และจะมองเห็นได้
  สำหรับผู้ดูแลเพื่อตรวจทาน
- รายงานจะไม่ซ่อนแพ็กเกจอัตโนมัติหรือบล็อกการดาวน์โหลดด้วยตัวเอง
- แฟล็ก:
  - `--version <version>`: เวอร์ชันแพ็กเกจเพิ่มเติมที่จะแนบกับรายงาน
  - `--reason <text>`: เหตุผลรายงานที่จำเป็น
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- คำสั่งของเจ้าของสำหรับตรวจสอบการมองเห็นด้านการดูแลของแพ็กเกจ
- เรียก `GET /api/v1/packages/{name}/moderation`
- แสดงสถานะการสแกนแพ็กเกจปัจจุบัน จำนวนรายงานที่เปิดอยู่ สถานะการดูแลแบบแมนนวลของรีลีสล่าสุด
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
- รายงานตัวบล็อกสำหรับสถานะทางการ ความพร้อมใช้งานของ ClawPack ไดเจสต์อาร์ติแฟกต์
  แหล่งที่มาของซอร์ส ความเข้ากันได้กับ OpenClaw เป้าหมายโฮสต์ ข้อมูลเมตาสภาพแวดล้อม
  และสถานะการสแกน
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- แสดงสถานะการย้ายข้อมูลเชิงผู้ปฏิบัติงานสำหรับแพ็กเกจที่อาจแทนที่
  Plugin ของ OpenClaw ที่รวมมาด้วย
- เรียกปลายทางความพร้อมที่คำนวณเดียวกันกับ `package readiness` แต่พิมพ์
  สถานะที่เน้นการย้ายข้อมูล เวอร์ชันล่าสุด สถานะแพ็กเกจทางการ การตรวจสอบ และ
  ตัวบล็อก
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- สร้างผู้เผยแพร่องค์กรที่เป็นของผู้ใช้ที่ยืนยันตัวตนแล้ว
- แฮนเดิลจะถูกปรับให้เป็นตัวพิมพ์เล็ก และอาจส่งเข้ามาพร้อมหรือไม่มี `@` ก็ได้
- ผู้เผยแพร่องค์กรที่สร้างใหม่จะไม่ถูกเชื่อถือ/เป็นทางการโดยค่าเริ่มต้น
- ล้มเหลวหากแฮนเดิลถูกใช้แล้วโดยผู้เผยแพร่ ผู้ใช้ หรือเส้นทางที่สงวนไว้ที่มีอยู่

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- เผยแพร่ code Plugin หรือ bundle Plugin ผ่าน `POST /api/v1/packages`
- `<source>` รับค่าได้ดังนี้:
  - พาธโฟลเดอร์ในเครื่อง: `./my-plugin`
  - ClawPack npm-pack tarball ในเครื่อง: `./my-plugin-1.2.3.tgz`
  - GitHub repo: `owner/repo` หรือ `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- ระบบตรวจหาเมทาดาทาอัตโนมัติจาก `package.json`, `openclaw.plugin.json` และ
  marker ของ OpenClaw bundle จริง เช่น `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` และ `.cursor-plugin/plugin.json`
- แหล่งที่มาแบบ `.tgz` จะถูกถือว่าเป็น ClawPack โดย CLI จะอัปโหลดไบต์ npm-pack
  ตามจริง และใช้เนื้อหา `package/` ที่แตกออกมาเฉพาะสำหรับการตรวจสอบความถูกต้องและ
  การเติมเมทาดาทาล่วงหน้า
- โฟลเดอร์ code Plugin จะถูกแพ็กเป็น ClawPack npm tarball ก่อนอัปโหลด เพื่อให้
  การติดตั้ง OpenClaw ตรวจสอบอาร์ทิแฟกต์ที่ตรงกันได้ ส่วนโฟลเดอร์ bundle Plugin ยังคง
  ใช้เส้นทางเผยแพร่แบบไฟล์ที่แตกออกมา
- สำหรับแหล่งที่มาจาก GitHub ระบบจะเติมการระบุแหล่งที่มาอัตโนมัติจาก repo, commit ที่ resolve แล้ว, ref และ subpath
- สำหรับโฟลเดอร์ในเครื่อง ระบบจะตรวจหาการระบุแหล่งที่มาอัตโนมัติจาก git ในเครื่อง เมื่อ origin remote ชี้ไปที่ GitHub
- code Plugin ภายนอกต้องประกาศ `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion` อย่างชัดเจน
  `package.json.version` ระดับบนสุดจะไม่ถูกใช้เป็น fallback สำหรับการตรวจสอบความถูกต้องในการเผยแพร่
- `--dry-run` แสดงตัวอย่าง publish payload ที่ resolve แล้วโดยไม่อัปโหลด
- `--json` ส่งออกผลลัพธ์ที่เครื่องอ่านได้สำหรับ CI
- `--owner <handle>` เผยแพร่ภายใต้ publisher handle ของผู้ใช้หรือองค์กร เมื่อ actor มีสิทธิ์เข้าถึง publisher
- ชื่อ scoped package ต้องตรงกับ owner ที่เลือก ดู `docs/publishing.md`
- แฟล็กเดิม (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ยังคงใช้เป็นค่าทับได้
- GitHub repo ส่วนตัวต้องใช้ `GITHUB_TOKEN`

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### โฟลว์ในเครื่องที่แนะนำ

ใช้ `--dry-run` ก่อน เพื่อให้คุณยืนยันเมทาดาทาแพ็กเกจที่ resolve แล้วและ
การระบุแหล่งที่มาก่อนสร้าง release จริงได้:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### โฟลว์โฟลเดอร์ในเครื่อง

สำหรับ code Plugin การเผยแพร่จากโฟลเดอร์จะสร้างและอัปโหลดอาร์ทิแฟกต์ ClawPack จาก
โฟลเดอร์แพ็กเกจ:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` ขั้นต่ำสำหรับ `--family code-plugin`

code Plugin ภายนอกต้องมีเมทาดาทา OpenClaw จำนวนเล็กน้อยใน
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

- `package.json.version` คือเวอร์ชัน release ของแพ็กเกจของคุณ แต่จะไม่ถูกใช้เป็น
  fallback สำหรับการตรวจสอบความเข้ากันได้/การ build ของ OpenClaw
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมทาดาทาเสริม
  ClawHub อาจแสดงข้อมูลเหล่านี้เมื่อมีอยู่ แต่ไม่จำเป็นสำหรับการเผยแพร่
- `openclaw.compat.minGatewayVersion` และ
  `openclaw.build.pluginSdkVersion` เป็นส่วนเสริม หากคุณต้องการเผยแพร่
  เมทาดาทาความเข้ากันได้ที่ละเอียดขึ้น
- หากคุณใช้ `clawhub` CLI release รุ่นเก่า ให้อัปเกรดก่อนเผยแพร่เพื่อให้
  การตรวจ preflight ในเครื่องทำงานก่อนอัปโหลด
- หากการตรวจสอบความถูกต้องรายงาน remediation code ให้ดู
  [การแก้ไขการตรวจสอบ Plugin](/clawhub/plugin-validation-fixes)

#### GitHub Actions

ClawHub ยังจัดส่ง reusable workflow อย่างเป็นทางการที่
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/a89bfaf61d1bb5e0bfa7a92cf35b76c7e404e1ca/.github/workflows/package-publish.yml)
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

- reusable workflow ตั้งค่าเริ่มต้นของ `source` เป็น repo ของ caller
- สำหรับ monorepo ให้ส่ง `source_path` เพื่อให้ workflow เผยแพร่โฟลเดอร์
  แพ็กเกจ Plugin เช่น `source_path: extensions/codex`
- ปักหมุด reusable workflow ไว้กับ tag ที่เสถียรหรือ commit SHA แบบเต็ม อย่าเรียกใช้การเผยแพร่ release จาก `@main`
- `pull_request` ควรใช้ `dry_run: true` เพื่อให้ CI ไม่สร้างผลกระทบจริง
- การเผยแพร่จริงควรจำกัดไว้กับ event ที่เชื่อถือได้ เช่น `workflow_dispatch` หรือการ push tag
- การเผยแพร่แบบ trusted โดยไม่มี secret ใช้ได้เฉพาะบน `workflow_dispatch`; การ push tag ยังต้องใช้ `clawhub_token`
- เก็บ `clawhub_token` ให้พร้อมสำหรับการเผยแพร่ครั้งแรก แพ็กเกจที่ไม่น่าเชื่อถือ หรือการเผยแพร่แบบ break-glass
- workflow อัปโหลดผลลัพธ์ JSON เป็นอาร์ทิแฟกต์และแสดงเป็น workflow outputs

### `package trusted-publisher get <name>`

- แสดงการตั้งค่า trusted publisher ของ GitHub Actions สำหรับแพ็กเกจ
- ใช้คำสั่งนี้หลังตั้งค่า config เพื่อยืนยัน repository, ชื่อไฟล์ workflow
  และ environment pin ที่ไม่บังคับ
- แฟล็ก:
  - `--json`: ผลลัพธ์ที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- แนบหรือแทนที่การตั้งค่า trusted publisher ของ GitHub Actions สำหรับ
  แพ็กเกจที่มีอยู่
- ต้องสร้างแพ็กเกจก่อนผ่าน `clawhub package publish` แบบ manual ปกติหรือแบบ
  token-authenticated
- หลังตั้งค่า config แล้ว การเผยแพร่ผ่าน GitHub Actions ที่รองรับในอนาคตสามารถใช้
  OIDC/trusted publishing ได้โดยไม่ต้องใช้ ClawHub token แบบอายุยาว
- `--repository <repo>` ต้องเป็น `owner/repo`
- `--workflow-filename <file>` ต้องตรงกับชื่อไฟล์ workflow ใน
  `.github/workflows/`
- `--environment <name>` เป็นค่าทางเลือก เมื่อกำหนดค่าแล้ว environment ของ GitHub Actions
  ใน OIDC claim ต้องตรงกันทุกตัวอักษร
- ClawHub ตรวจสอบ repository ของ GitHub ที่กำหนดค่าไว้เมื่อคำสั่งนี้ทำงาน
  repository สาธารณะสามารถตรวจสอบผ่านเมทาดาทา GitHub สาธารณะได้ ส่วน
  repository ส่วนตัวต้องให้ ClawHub มีสิทธิ์เข้าถึง GitHub repository นั้น เช่น
  ผ่านการติดตั้ง ClawHub GitHub App ในอนาคต หรือ integration ของ GitHub อื่นที่ได้รับอนุญาต
- แฟล็ก:
  - `--repository <repo>`: GitHub repository เช่น `openclaw/example-plugin`
  - `--workflow-filename <file>`: ชื่อไฟล์ workflow เช่น `package-publish.yml`
  - `--environment <name>`: environment ของ GitHub Actions ที่ต้องตรงกันทุกตัวอักษรแบบไม่บังคับ
  - `--json`: ผลลัพธ์ที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- ลบการตั้งค่า trusted publisher ออกจากแพ็กเกจ
- ใช้เป็น rollback หากต้องปิดใช้งานหรือสร้าง workflow, repository หรือ environment pin ใหม่
- การเผยแพร่จริงในอนาคตต้องใช้การเผยแพร่แบบ authenticated ปกติจนกว่าจะ
  ตั้งค่า config อีกครั้ง
- แฟล็ก:
  - `--json`: ผลลัพธ์ที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### การวัดและรายงานการติดตั้ง

- ส่งหลัง `clawhub install <slug>` เมื่อเข้าสู่ระบบแล้ว เว้นแต่จะตั้งค่า
  `CLAWHUB_DISABLE_TELEMETRY=1`
- การรายงานเป็นแบบ best-effort คำสั่งติดตั้งจะไม่ล้มเหลวหาก
  telemetry ไม่พร้อมใช้งาน
- รายละเอียด: `docs/telemetry.md`
