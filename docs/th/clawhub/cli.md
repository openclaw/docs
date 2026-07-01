---
read_when:
    - การใช้ ClawHub CLI
    - การดีบักการติดตั้ง การอัปเดต หรือการเผยแพร่
summary: 'เอกสารอ้างอิง CLI: คำสั่ง แฟล็ก การกำหนดค่า และพฤติกรรมของ lockfile'
x-i18n:
    generated_at: "2026-07-01T08:42:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4467e589a4892d513e4ca715b73a81147abb59cb7706b0068a11af6c95ea08f9
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

แพ็กเกจ CLI: `clawhub`, ไบนารี: `clawhub`

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

- `--workdir <dir>`: ไดเรกทอรีทำงาน (ค่าเริ่มต้น: cwd; จะย้อนกลับไปใช้เวิร์กสเปซ Clawdbot หากกำหนดค่าไว้)
- `--dir <dir>`: ไดเรกทอรีติดตั้งภายใต้ workdir (ค่าเริ่มต้น: `skills`)
- `--site <url>`: URL ฐานสำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `https://clawhub.ai`)
- `--registry <url>`: URL ฐานของ API (ค่าเริ่มต้น: ค้นพบโดยอัตโนมัติ มิฉะนั้นใช้ `https://clawhub.ai`)
- `--no-input`: ปิดใช้พรอมป์

ค่าที่เทียบเท่าใน env:

- `CLAWHUB_SITE` (แบบเดิม `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (แบบเดิม `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (แบบเดิม `CLAWDHUB_WORKDIR`)

### พร็อกซี HTTP

CLI เคารพตัวแปรสภาพแวดล้อมพร็อกซี HTTP มาตรฐานสำหรับระบบที่อยู่หลัง
พร็อกซีองค์กรหรือเครือข่ายที่ถูกจำกัด:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

เมื่อมีการตั้งค่าตัวแปรใด ๆ เหล่านี้ CLI จะส่งคำขอขาออกผ่าน
พร็อกซีที่ระบุ `HTTPS_PROXY` ใช้สำหรับคำขอ HTTPS, `HTTP_PROXY`
สำหรับ HTTP ธรรมดา `NO_PROXY` / `no_proxy` จะถูกเคารพเพื่อข้ามพร็อกซีสำหรับ
โฮสต์หรือโดเมนที่ระบุ

สิ่งนี้จำเป็นบนระบบที่บล็อกการเชื่อมต่อขาออกโดยตรง
(เช่น คอนเทนเนอร์ Docker, Hetzner VPS ที่ใช้อินเทอร์เน็ตผ่านพร็อกซีเท่านั้น, ไฟร์วอลล์
องค์กร)

ตัวอย่าง:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

เมื่อไม่ได้ตั้งค่าตัวแปรพร็อกซี พฤติกรรมจะไม่เปลี่ยนแปลง (เชื่อมต่อโดยตรง)

## ไฟล์การกำหนดค่า

จัดเก็บโทเค็น API ของคุณ + URL รีจิสทรีที่แคชไว้

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` หรือ `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- เส้นทางสำรองแบบเดิม: หาก `clawhub/config.json` ยังไม่มีอยู่ แต่ `clawdhub/config.json` มีอยู่ CLI จะใช้เส้นทางเดิมซ้ำ
- เขียนทับ: `CLAWHUB_CONFIG_PATH` (แบบเดิม `CLAWDHUB_CONFIG_PATH`)

## คำสั่ง

### `login` / `auth login`

- ค่าเริ่มต้น: เปิดเบราว์เซอร์ไปที่ `<site>/cli/auth` และทำให้เสร็จผ่านคอลแบ็ก loopback
- แบบไม่มีหน้าจอ: `clawhub login --token clh_...`
- แบบโต้ตอบระยะไกล/ไม่มีหน้าจอ: `clawhub login --device` พิมพ์รหัสและรอขณะที่คุณอนุญาตที่ `<site>/cli/device`

### `whoami`

- ตรวจสอบโทเค็นที่จัดเก็บไว้ผ่าน `/api/v1/whoami`

### `token`

- พิมพ์โทเค็น API ที่จัดเก็บไว้ไปยัง stdout
- มีประโยชน์สำหรับการ pipe โทเค็นเข้าสู่ระบบในเครื่องไปยังคำสั่งตั้งค่า secret ของ CI

### `star <skill>` / `unstar <skill>`

- เพิ่ม/ลบ Skills จากรายการไฮไลต์ของคุณ
- เรียก `POST /api/v1/stars/<slug>` และ `DELETE /api/v1/stars/<slug>`
- `--yes` ข้ามการยืนยัน

### `search <query...>`

- เรียก `/api/v1/search?q=...`
- เอาต์พุตประกอบด้วย slug ของ Skills, handle ของเจ้าของ, ชื่อที่แสดง และคะแนนความเกี่ยวข้อง
- การค้นหาจะให้ความสำคัญกับการจับคู่โทเค็น slug/ชื่อแบบตรงก่อนความนิยมจากการดาวน์โหลด โทเค็น slug แบบเดี่ยว เช่น `map` จะจับคู่กับ `personal-map` ได้แรงกว่าสตริงย่อยภายใน `amap`
- ความนิยมเป็นเพียงค่านำทางการจัดอันดับขนาดเล็ก ไม่ใช่การรับประกันว่าจะอยู่ลำดับบนสุด
- หาก Skills ควรปรากฏแต่ไม่ปรากฏ ให้รัน `clawhub inspect @owner/slug` ขณะเข้าสู่ระบบเพื่อตรวจสอบ diagnostics การกลั่นกรองที่เจ้าของมองเห็นได้ก่อนเปลี่ยนชื่อ metadata

### `explore`

- แสดงรายการ Skills ใหม่ล่าสุดผ่าน `/api/v1/skills?limit=...&sort=createdAt` (เรียงตาม `createdAt` จากมากไปน้อย)
- แฟล็ก:
  - `--limit <n>` (1-200, ค่าเริ่มต้น: 25)
  - `--sort newest|updated|rating|downloads|trending` (ค่าเริ่มต้น: newest) อะเลียสการเรียงลำดับติดตั้งแบบเดิมยังใช้งานได้เพื่อความเข้ากันได้
  - `--json` (เอาต์พุตที่เครื่องอ่านได้)
- เอาต์พุต: `<slug>  v<version>  <age>  <summary>` (summary ถูกตัดให้เหลือ 50 อักขระ)

### `inspect @owner/slug`

- ดึง metadata และไฟล์เวอร์ชันของ Skills โดยไม่ติดตั้ง
- `--version <version>`: ตรวจสอบเวอร์ชันเฉพาะ (ค่าเริ่มต้น: latest)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-200)
- `--files`: แสดงรายการไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (เฉพาะไฟล์ข้อความ; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `install @owner/slug`

- แก้หาเวอร์ชันล่าสุดสำหรับเจ้าของและ Skills ที่ตั้งชื่อไว้
- ดาวน์โหลด zip ผ่าน `/api/v1/download`
- แตกไฟล์ไปยัง `<workdir>/<dir>/<slug>`
- ปฏิเสธการเขียนทับ Skills ที่ปักหมุดไว้ ให้รัน `clawhub unpin <skill>` ก่อน
- เขียน:
  - `<workdir>/.clawhub/lock.json` (แบบเดิม `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (แบบเดิม `.clawdhub`)

### `uninstall <skill>`

- ลบ `<workdir>/<dir>/<slug>` และลบรายการใน lockfile
- ส่ง telemetry แบบ best-effort ขณะเข้าสู่ระบบ เพื่อให้จำนวนการติดตั้งปัจจุบันถูก
  ปิดใช้งานได้
- แบบโต้ตอบ: ขอการยืนยัน
- แบบไม่โต้ตอบ (`--no-input`): ต้องใช้ `--yes`

### `list`

- อ่าน `<workdir>/.clawhub/lock.json` (แบบเดิม `.clawdhub`)
- แสดง `pinned` ถัดจาก Skills ที่ถูกตรึงด้วย `clawhub pin` รวมถึงเหตุผลแบบเลือกได้

### `pin <skill>`

- ทำเครื่องหมาย Skills ที่ติดตั้งแล้วว่าเป็น pinned ใน lockfile
- `--reason <text>` บันทึกเหตุผลที่ Skills ถูกตรึง
- Skills ที่ปักหมุดไว้จะถูกข้ามโดย `update --all` และถูกปฏิเสธโดย `update <skill>` โดยตรง
- Skills ที่ปักหมุดไว้ยังปฏิเสธ `install --force` เพื่อไม่ให้ไบต์ในเครื่องถูกแทนที่โดยไม่ตั้งใจ

### `unpin <skill>`

- ลบ pin ใน lockfile ออกจาก Skills ที่ติดตั้งแล้ว เพื่อให้การอัปเดตในอนาคตแก้ไขได้

### `update [@owner/slug]` / `update --all`

- คำนวณ fingerprint จากไฟล์ในเครื่อง
- หาก fingerprint ตรงกับเวอร์ชันที่รู้จัก: ไม่มีพรอมป์
- หาก fingerprint ไม่ตรง:
  - ปฏิเสธตามค่าเริ่มต้น
  - เขียนทับด้วย `--force` (หรือพรอมป์ หากเป็นแบบโต้ตอบ)
- Skills ที่ปักหมุดไว้จะไม่ถูกอัปเดตโดย `--force`
- `update <skill>` ล้มเหลวทันทีสำหรับ Skills ที่ปักหมุดไว้ และบอกให้คุณรัน `clawhub unpin <skill>` ก่อน
- `update --all` ข้าม slug ที่ปักหมุดไว้และพิมพ์สรุปว่าสิ่งใดยังคงถูกตรึงอยู่

### `skill publish <path>`

- เปรียบเทียบ fingerprint ของบันเดิลในเครื่องกับ ClawHub และออกสำเร็จเมื่อ
  เนื้อหาถูกเผยแพร่แล้ว
- Skills ใหม่มีค่าเริ่มต้นเป็น `1.0.0`; Skills ที่เปลี่ยนแปลงมีค่าเริ่มต้นเป็น patch
  version ถัดไป
- `--version <version>` เลือกเวอร์ชันอย่างชัดเจนและเผยแพร่แม้ว่า
  เนื้อหาจะตรงกับเวอร์ชันที่มีอยู่
- `--dry-run` แก้การเผยแพร่โดยไม่อัปโหลด; `--json` พิมพ์ผลลัพธ์ที่
  เครื่องอ่านได้
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่ของ org/user เมื่อ
  actor มีสิทธิ์ผู้เผยแพร่
- `--migrate-owner` ย้าย Skills ที่มีอยู่ไปยัง `--owner` ขณะเผยแพร่เวอร์ชัน
  ใหม่ ต้องมีสิทธิ์ admin/owner บนผู้เผยแพร่ทั้งสองราย
- พฤติกรรมของเจ้าของและการตรวจสอบอธิบายไว้ใน `docs/publishing.md`
- การเผยแพร่ Skills หมายความว่า Skills นั้นถูกปล่อยภายใต้ `MIT-0` บน ClawHub
- Skills ที่เผยแพร่แล้วใช้งาน แก้ไข และแจกจ่ายซ้ำได้ฟรีโดยไม่ต้องระบุแหล่งที่มา
- ClawHub ไม่รองรับ Skills แบบชำระเงินหรือการตั้งราคาต่อ Skills
- อะเลียสแบบเดิม: `publish <path>`

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

เวิร์กโฟลว์ที่ใช้ซ้ำได้ของ ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
เรียก `skill publish` สำหรับ `skill_path` หนึ่งรายการ หรือสำหรับโฟลเดอร์ Skills ที่อยู่ชั้นถัดไปแต่ละ
โฟลเดอร์ภายใต้ `root` (ค่าเริ่มต้น: `skills`) โดยจะข้าม Skills ที่ไม่เปลี่ยนแปลงและใช้
พฤติกรรม patch-version อัตโนมัติเดียวกัน

ตั้งค่า `dry_run: true` เพื่อดูตัวอย่างโดยไม่มีโทเค็น การเผยแพร่จริงต้องใช้
secret `clawhub_token`

### `sync`

- สแกน workdir ปัจจุบัน ไดเรกทอรี Skills ที่กำหนดค่าไว้ และโฟลเดอร์
  `--root <dir>` ใด ๆ เพื่อหาโฟลเดอร์ Skills ในเครื่องที่มี `SKILL.md` หรือ
  `skill.md`
- เปรียบเทียบ fingerprint ของ Skills ในเครื่องแต่ละรายการกับ ClawHub และเผยแพร่เฉพาะ Skills ใหม่หรือ
  ที่เปลี่ยนแปลง
- Skills ใหม่เผยแพร่เป็น `1.0.0`; Skills ที่เปลี่ยนแปลงเผยแพร่เป็น patch version ถัดไป
  ตามค่าเริ่มต้น ใช้ `--bump minor|major` สำหรับชุดอัปเดตที่ควรขยับด้วย
  ขั้น semver ที่ใหญ่กว่า
- `--dry-run` แสดงแผนการเผยแพร่โดยไม่อัปโหลด; `--json` พิมพ์แผนที่
  เครื่องอ่านได้
- `--all` เผยแพร่ Skills ใหม่หรือที่เปลี่ยนแปลงทั้งหมดโดยไม่ต้องพรอมป์ หากไม่มี
  `--all` เทอร์มินัลแบบโต้ตอบให้คุณเลือก Skills ที่จะเผยแพร่
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่ของ org/user เมื่อ
  actor มีสิทธิ์ผู้เผยแพร่
- `sync` เป็นการเผยแพร่ทางเดียวเท่านั้น ไม่ติดตั้ง อัปเดต ดาวน์โหลด หรือ
  รายงาน telemetry การติดตั้ง/ดาวน์โหลด

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- ต้องใช้ `clawhub login`
- รัน ClawHub ClawScan ผ่าน `POST /api/v1/skills/-/scan` จากนั้น poll จนกว่าสแกนจะถึงสถานะ terminal
- การสแกนเป็นแบบอะซิงโครนัสและอาจใช้เวลาจึงจะเสร็จ ขณะอยู่ในคิว spinner ของเทอร์มินัลจะแสดงตำแหน่งสแกนที่จัดลำดับความสำคัญปัจจุบันและจำนวนสแกนที่อยู่ข้างหน้า
- การสแกนที่เผยแพร่แล้วต้องมีสิทธิ์ความเป็นเจ้าของหรือสิทธิ์จัดการผู้เผยแพร่ ผู้กลั่นกรอง/admins สามารถใช้ backend เดียวกันผ่าน `clawhub-admin`
- `--update` ใช้ได้เฉพาะกับ `--slug`; จะเขียนผลการสแกนที่เผยแพร่แล้วและสำเร็จกลับไปยังเวอร์ชันที่เลือก
- `--output <file.zip>` ดาวน์โหลดคลังรายงานฉบับเต็มพร้อม `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`
- `--json` พิมพ์คำตอบ poll ฉบับเต็มสำหรับระบบอัตโนมัติ
- ไม่รองรับการสแกน path ในเครื่องอีกต่อไป อัปโหลดเวอร์ชันใหม่ จากนั้นใช้ `scan download` เพื่อดึงผลการสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งนั้น

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- ต้องใช้ `clawhub login`
- ดาวน์โหลด ZIP รายงานการสแกนที่จัดเก็บไว้สำหรับเวอร์ชัน Skills หรือ Plugin ที่ส่ง รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อนโดยการตรวจสอบความปลอดภัยของ ClawHub
- การดาวน์โหลด Skills ใช้ slug ของ Skills และมีค่าเริ่มต้นเป็น `--kind skill`
- การดาวน์โหลด Plugin ใช้ชื่อแพ็กเกจและต้องใช้ `--kind plugin`
- ต้องระบุ `--version` เพื่อให้ผู้เขียนตรวจสอบเวอร์ชันที่ส่งอย่างแน่ชัดซึ่ง ClawHub บล็อกไว้
- `--output <file.zip>` เลือก path ปลายทาง

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub จัดส่งเวิร์กโฟลว์ทางการที่ใช้ซ้ำได้ที่
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/80b06a911afb312a43d3f39ba62d92eb35d772a9/.github/workflows/skill-publish.yml)
สำหรับ repo ของ Skills และ repo แคตตาล็อก

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
- ส่ง `skill_path: skills/review-helper` เพื่อประมวลผลโฟลเดอร์ Skills หนึ่งรายการ
- `owner` แมปกับแฟล็ก CLI `--owner`; ละไว้เพื่อเผยแพร่เป็นผู้ใช้ที่ผ่านการยืนยันตัวตน
- การเผยแพร่ Skills V1 ใช้ `clawhub_token`; GitHub OIDC trusted publishing เป็นแบบ package-only ในตอนนี้

### `delete <skill>`

- หากไม่มี `--version` ให้ลบสกิลแบบ soft-delete (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- เรียก `DELETE /api/v1/skills/{slug}`
- การ soft delete ที่เริ่มโดยเจ้าของจะสงวน slug ไว้ 30 วัน; คำสั่งจะแสดงเวลาหมดอายุ
- `--version <version>` จะลบเวอร์ชันหนึ่งที่เป็นของเจ้าของและไม่ใช่เวอร์ชันล่าสุดอย่างถาวรผ่านเส้นทางเฉพาะเวอร์ชันแบบ fail-closed
  เวอร์ชันที่ถูกลบแล้วไม่สามารถกู้คืนหรือเผยแพร่ซ้ำได้ ให้เผยแพร่ตัวแทนก่อนลบเวอร์ชันล่าสุดปัจจุบัน เจ้าหน้าที่แพลตฟอร์มจะไม่ข้ามสิทธิ์ความเป็นเจ้าของสำหรับโฟลว์เฉพาะเวอร์ชันนี้
- `--reason <text>` บันทึกหมายเหตุการดูแลใน soft-delete ทั้งสกิลและ audit log
- `--note <text>` เป็น alias ของ `--reason`
- `--yes` ข้ามการยืนยัน

### `undelete <skill>`

- กู้คืนสกิลที่ถูกซ่อน (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- ไม่มีการ undelete เวอร์ชัน; เวอร์ชันที่ถูกลบอย่างถาวรไม่สามารถกู้คืนได้
- เรียก `POST /api/v1/skills/{slug}/undelete`
- `--reason <text>` บันทึกหมายเหตุการดูแลในสกิลและ audit log
- `--note <text>` เป็น alias ของ `--reason`
- `--yes` ข้ามการยืนยัน

### `hide <skill>`

- ซ่อนสกิล (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- Alias ของ `delete`

### `unhide <skill>`

- เลิกซ่อนสกิล (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- Alias ของ `undelete`

### `skill rename <skill> <new-name>`

- เปลี่ยนชื่อสกิลที่เป็นเจ้าของและเก็บ slug เดิมไว้เป็น alias สำหรับ redirect
- เรียก `POST /api/v1/skills/{slug}/rename`
- `--yes` ข้ามการยืนยัน

### `skill merge <source> <target>`

- รวมสกิลหนึ่งที่เป็นเจ้าของเข้าไปในอีกสกิลหนึ่งที่เป็นเจ้าของ
- slug ต้นทางจะหยุดแสดงแบบสาธารณะและกลายเป็น alias สำหรับ redirect ไปยังเป้าหมาย
- เรียก `POST /api/v1/skills/{sourceSlug}/merge`
- `--yes` ข้ามการยืนยัน

### `transfer`

- เวิร์กโฟลว์การโอนความเป็นเจ้าของ
- การโอนไปยัง handle ของผู้ใช้จะสร้างคำขอที่รอดำเนินการให้ผู้รับยอมรับ
- การโอนไปยัง handle ขององค์กร/publisher จะมีผลทันทีเฉพาะเมื่อผู้ดำเนินการมีสิทธิ์ admin ทั้งกับเจ้าของปัจจุบันและ publisher ปลายทาง
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

- เรียกดูหรือค้นหาแคตตาล็อกแพ็กเกจแบบรวมผ่าน `GET /api/v1/packages` และ `GET /api/v1/packages/search`
- ใช้คำสั่งนี้สำหรับ plugins และรายการตระกูลแพ็กเกจอื่นๆ; `search` ระดับบนสุดยังคงเป็นพื้นผิวการค้นหาสกิล
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
- ใช้คำสั่งนี้สำหรับ metadata ของ plugin, ความเข้ากันได้, การตรวจสอบ, ซอร์ส และการตรวจสอบเวอร์ชัน/ไฟล์
- `--version <version>`: ตรวจสอบเวอร์ชันเฉพาะ (ค่าเริ่มต้น: latest)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติด tag (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-100)
- `--files`: แสดงไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (เฉพาะไฟล์ข้อความ; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `package download <name>`

- resolve เวอร์ชันแพ็กเกจผ่าน
  `GET /api/v1/packages/{name}/versions/{version}/artifact`
- ดาวน์โหลด artifact จาก `downloadUrl` ของ resolver
- ตรวจสอบ ClawHub SHA-256 สำหรับ artifact ทั้งหมด
- สำหรับ artifact ClawPack npm-pack จะตรวจสอบ npm `sha512` integrity,
  npm shasum และชื่อ/เวอร์ชันใน `package.json` ของ tarball ด้วย
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

- คำนวณ ClawHub SHA-256, npm `sha512` integrity และ npm shasum สำหรับ artifact ภายในเครื่อง
- เมื่อใช้ `--package` จะ resolve metadata ที่คาดหวังจาก ClawHub และเปรียบเทียบไฟล์ภายในเครื่องกับ metadata ของ artifact ที่เผยแพร่แล้ว
- เมื่อใช้ flag digest โดยตรง จะตรวจสอบโดยไม่ต้อง lookup ผ่านเครือข่าย
- Flags:
  - `--package <name>`: ชื่อแพ็กเกจเพื่อ resolve metadata ของ artifact ที่คาดหวัง
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

- เรียกใช้ Plugin Inspector ที่รวมมากับ ClawHub CLI กับโฟลเดอร์แพ็กเกจ plugin ภายในเครื่อง
- ค่าเริ่มต้นเป็นการตรวจสอบแบบออฟไลน์/สแตติก โดยไม่ค้นหาหรือนำเข้า checkout ของ OpenClaw ภายในเครื่อง
- ข้อผิดพลาดด้านความเข้ากันได้แบบรุนแรงจะออกด้วยสถานะ non-zero ส่วนข้อค้นพบที่เป็นคำเตือนเท่านั้นจะแสดงผลแต่จบด้วยสถานะ zero
- Flags:
  - `--out <dir>`: เขียนรายงาน Plugin Inspector ไปยังไดเรกทอรีนี้
  - `--openclaw <path>`: ตรวจสอบกับ checkout ของ OpenClaw ภายในเครื่องที่ระบุอย่างชัดเจน
  - `--runtime`: เปิดใช้การจับข้อมูล runtime; นำเข้าโค้ด plugin
  - `--allow-execute`: อนุญาตการจับข้อมูล runtime ใน workspace ที่แยกออกมา
  - `--no-mock-sdk`: ปิดใช้ OpenClaw SDK แบบ mock ระหว่างการจับข้อมูล runtime
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package validate ./example-plugin
```

หากการตรวจสอบรายงานข้อค้นพบเกี่ยวกับแพ็กเกจ, manifest, การนำเข้า SDK หรือ artifact โปรดดู
[การแก้ไขการตรวจสอบ Plugin](/clawhub/plugin-validation-fixes) แล้วเรียกใช้คำสั่งอีกครั้ง

### `package delete <name>`

- หากไม่มี `--version` จะ soft-delete แพ็กเกจและ release ทั้งหมด
- `--version <version>` จะลบ release หนึ่งที่เป็นของเจ้าของและไม่ใช่ release ล่าสุดอย่างถาวรผ่านเส้นทางเฉพาะเวอร์ชันแบบ fail-closed
  เวอร์ชันที่ถูกลบแล้วไม่สามารถกู้คืนหรือเผยแพร่ซ้ำได้ ให้เผยแพร่ตัวแทนก่อนลบเวอร์ชันล่าสุดปัจจุบัน โฟลว์เฉพาะเวอร์ชันนี้ต้องเป็นเจ้าของแพ็กเกจหรือ admin ของ org publisher; เจ้าหน้าที่แพลตฟอร์มจะไม่ข้ามสิทธิ์ความเป็นเจ้าของแพ็กเกจ
- การ soft-delete ทั้งแพ็กเกจต้องเป็นเจ้าของแพ็กเกจ, owner/admin ของ org publisher, ผู้ดูแลแพลตฟอร์ม หรือ admin แพลตฟอร์ม
- Flags:
  - `--version <version>`: ลบเวอร์ชันหนึ่งที่ไม่ใช่ล่าสุดอย่างถาวร
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
- ต้องเป็นเจ้าของแพ็กเกจ, owner/admin ของ org publisher, ผู้ดูแลแพลตฟอร์ม หรือ admin แพลตฟอร์ม
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
- ต้องมีสิทธิ์ admin ทั้งกับเจ้าของแพ็กเกจปัจจุบันและ publisher ปลายทาง เว้นแต่ดำเนินการโดย admin แพลตฟอร์ม
- ชื่อแพ็กเกจแบบ scoped ต้องโอนไปยังเจ้าของ scope ที่ตรงกัน
- เรียก `POST /api/v1/packages/{name}/transfer`
- Flags:
  - `--to <owner>`: handle ของ publisher ปลายทาง
  - `--reason <text>`: เหตุผล audit แบบไม่บังคับ
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- คำสั่งที่ต้องยืนยันตัวตนสำหรับรายงานแพ็กเกจต่อผู้ดูแล
- เรียก `POST /api/v1/packages/{name}/report`
- รายงานอยู่ระดับแพ็กเกจ สามารถผูกกับเวอร์ชันได้ และจะแสดงให้ผู้ดูแลเห็นเพื่อรีวิว
- รายงานจะไม่ซ่อนแพ็กเกจหรือบล็อกการดาวน์โหลดโดยอัตโนมัติด้วยตัวเอง
- Flags:
  - `--version <version>`: เวอร์ชันแพ็กเกจแบบไม่บังคับเพื่อแนบกับรายงาน
  - `--reason <text>`: เหตุผลรายงานที่บังคับ
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- คำสั่งสำหรับเจ้าของเพื่อตรวจสอบการมองเห็นด้านการดูแลของแพ็กเกจ
- เรียก `GET /api/v1/packages/{name}/moderation`
- แสดงสถานะการสแกนแพ็กเกจปัจจุบัน, จำนวนรายงานที่เปิดอยู่, สถานะการดูแลด้วยตนเองของ release ล่าสุด, สถานะการบล็อกดาวน์โหลด และเหตุผลการดูแล
- Flags:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- ตรวจสอบว่าแพ็กเกจพร้อมสำหรับการใช้งานโดย OpenClaw ในอนาคตหรือไม่
- เรียก `GET /api/v1/packages/{name}/readiness`
- รายงาน blocker สำหรับสถานะ official, ความพร้อมใช้งานของ ClawPack, digest ของ artifact,
  provenance ของซอร์ส, ความเข้ากันได้กับ OpenClaw, เป้าหมาย host, metadata ของสภาพแวดล้อม และสถานะการสแกน
- Flags:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- แสดงสถานะการย้ายข้อมูลสำหรับผู้ปฏิบัติงานของแพ็กเกจที่อาจแทนที่
  OpenClaw plugin ที่ bundled มา
- เรียก endpoint readiness ที่คำนวณเดียวกับ `package readiness` แต่แสดงสถานะที่เน้นการย้ายข้อมูล, เวอร์ชันล่าสุด, สถานะแพ็กเกจ official, checks และ blockers
- Flags:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- สร้าง org publisher ที่เป็นของผู้ใช้ที่ยืนยันตัวตนแล้ว
- handle จะถูกปรับให้เป็นตัวพิมพ์เล็กและอาจส่งพร้อมหรือไม่มี `@` ก็ได้
- org publisher ที่สร้างใหม่จะไม่ trusted/official โดยค่าเริ่มต้น
- ล้มเหลวหาก handle ถูกใช้แล้วโดย publisher, ผู้ใช้ หรือ route ที่สงวนไว้ที่มีอยู่

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- เผยแพร่ Plugin โค้ดหรือ Plugin แบบบันเดิลผ่าน `POST /api/v1/packages`
- `<source>` รองรับ:
  - พาธโฟลเดอร์ในเครื่อง: `./my-plugin`
  - ไฟล์ tarball แบบ npm-pack ของ ClawPack ในเครื่อง: `./my-plugin-1.2.3.tgz`
  - รีโป GitHub: `owner/repo` หรือ `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- ตรวจหาเมทาดาทาอัตโนมัติจาก `package.json`, `openclaw.plugin.json` และ
  มาร์กเกอร์บันเดิล OpenClaw จริง เช่น `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` และ `.cursor-plugin/plugin.json`
- แหล่งที่มาแบบ `.tgz` จะถูกจัดการเป็น ClawPack โดย CLI จะอัปโหลดไบต์ npm-pack
  ตามจริง และใช้เนื้อหา `package/` ที่แตกออกมาเฉพาะสำหรับการตรวจสอบและ
  เติมเมทาดาทาล่วงหน้า
- โฟลเดอร์ Plugin โค้ดจะถูกแพ็กเป็นไฟล์ tarball npm ของ ClawPack ก่อนอัปโหลด เพื่อให้
  การติดตั้ง OpenClaw ตรวจสอบอาร์ติแฟกต์ที่แน่นอนได้ ส่วนโฟลเดอร์ Plugin แบบบันเดิลยังคง
  ใช้เส้นทางเผยแพร่แบบไฟล์ที่แตกออกมา
- สำหรับแหล่งที่มาจาก GitHub ระบบจะเติมการระบุแหล่งที่มาอัตโนมัติจากรีโป คอมมิตที่ resolve แล้ว ref และพาธย่อย
- สำหรับโฟลเดอร์ในเครื่อง ระบบจะตรวจหาการระบุแหล่งที่มาอัตโนมัติจาก git ในเครื่องเมื่อ origin remote ชี้ไปที่ GitHub
- Plugin โค้ดภายนอกต้องประกาศ `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion` อย่างชัดเจน
  `package.json.version` ระดับบนสุดจะไม่ถูกใช้เป็น fallback สำหรับการตรวจสอบการเผยแพร่
- `--dry-run` แสดงตัวอย่าง payload การเผยแพร่ที่ resolve แล้วโดยไม่อัปโหลด
- `--json` ส่งออกผลลัพธ์ที่เครื่องอ่านได้สำหรับ CI
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่ของผู้ใช้หรือองค์กรเมื่อผู้ดำเนินการมีสิทธิ์เข้าถึงผู้เผยแพร่
- ชื่อแพ็กเกจแบบ scoped ต้องตรงกับเจ้าของที่เลือก ดู `docs/publishing.md`
- แฟล็กที่มีอยู่ (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ยังคงใช้เป็นค่าทับได้
- รีโป GitHub ส่วนตัวต้องใช้ `GITHUB_TOKEN`

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### โฟลว์ในเครื่องที่แนะนำ

ใช้ `--dry-run` ก่อน เพื่อให้คุณยืนยันเมทาดาทาแพ็กเกจที่ resolve แล้วและ
การระบุแหล่งที่มาก่อนสร้างรีลีสจริงได้:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### โฟลว์โฟลเดอร์ในเครื่อง

สำหรับ Plugin โค้ด การเผยแพร่จากโฟลเดอร์จะสร้างและอัปโหลดอาร์ติแฟกต์ ClawPack จาก
โฟลเดอร์แพ็กเกจ:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` ขั้นต่ำสำหรับ `--family code-plugin`

Plugin โค้ดภายนอกต้องมีเมทาดาทา OpenClaw จำนวนเล็กน้อยใน
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

- `package.json.version` คือเวอร์ชันรีลีสแพ็กเกจของคุณ แต่จะไม่ถูกใช้เป็น
  fallback สำหรับการตรวจสอบความเข้ากันได้/บิลด์ของ OpenClaw
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมทาดาทาที่ไม่บังคับ
  ClawHub อาจแสดงข้อมูลเหล่านี้เมื่อมีอยู่ แต่ไม่จำเป็นสำหรับการเผยแพร่
- `openclaw.compat.minGatewayVersion` และ
  `openclaw.build.pluginSdkVersion` เป็นส่วนเสริมที่ไม่บังคับ หากคุณต้องการเผยแพร่
  เมทาดาทาความเข้ากันได้ที่ละเอียดขึ้น
- หากคุณใช้ `clawhub` CLI รีลีสเก่า ให้อัปเกรดก่อนเผยแพร่ เพื่อให้
  การตรวจสอบล่วงหน้าในเครื่องทำงานก่อนอัปโหลด
- หากการตรวจสอบรายงานโค้ดการแก้ไข โปรดดู
  [การแก้ไขการตรวจสอบ Plugin](/clawhub/plugin-validation-fixes)

#### GitHub Actions

ClawHub ยังจัดส่งเวิร์กโฟลว์ reusable อย่างเป็นทางการที่
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/80b06a911afb312a43d3f39ba62d92eb35d772a9/.github/workflows/package-publish.yml)
สำหรับรีโป Plugin ด้วย

การตั้งค่าผู้เรียกใช้งานทั่วไป:

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

- เวิร์กโฟลว์ reusable ตั้งค่าเริ่มต้นของ `source` เป็นรีโปผู้เรียกใช้งาน
- สำหรับ monorepo ให้ส่ง `source_path` เพื่อให้เวิร์กโฟลว์เผยแพร่โฟลเดอร์
  แพ็กเกจ Plugin เช่น `source_path: extensions/codex`
- ปักเวิร์กโฟลว์ reusable ไว้กับแท็กเสถียรหรือ SHA คอมมิตเต็ม อย่าเผยแพร่รีลีสจาก `@main`
- `pull_request` ควรใช้ `dry_run: true` เพื่อให้ CI ไม่สร้างผลข้างเคียง
- การเผยแพร่จริงควรจำกัดไว้เฉพาะเหตุการณ์ที่เชื่อถือได้ เช่น `workflow_dispatch` หรือการ push แท็ก
- การเผยแพร่ที่เชื่อถือได้โดยไม่มี secret ใช้ได้เฉพาะกับ `workflow_dispatch`; การ push แท็กยังต้องใช้ `clawhub_token`
- เก็บ `clawhub_token` ให้พร้อมใช้งานสำหรับการเผยแพร่ครั้งแรก แพ็กเกจที่ไม่น่าเชื่อถือ หรือการเผยแพร่ฉุกเฉิน
- เวิร์กโฟลว์จะอัปโหลดผลลัพธ์ JSON เป็นอาร์ติแฟกต์และเปิดเผยเป็นเอาต์พุตของเวิร์กโฟลว์

### `package trusted-publisher get <name>`

- แสดงคอนฟิกผู้เผยแพร่ที่เชื่อถือได้ของ GitHub Actions สำหรับแพ็กเกจ
- ใช้คำสั่งนี้หลังตั้งค่าคอนฟิก เพื่อยืนยัน repository, ชื่อไฟล์เวิร์กโฟลว์
  และการปัก environment ที่ไม่บังคับ
- แฟล็ก:
  - `--json`: ผลลัพธ์ที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- แนบหรือแทนที่คอนฟิกผู้เผยแพร่ที่เชื่อถือได้ของ GitHub Actions สำหรับ
  แพ็กเกจที่มีอยู่
- ต้องสร้างแพ็กเกจก่อนผ่านการเผยแพร่ `clawhub package publish`
  แบบปกติด้วยตนเองหรือแบบยืนยันตัวตนด้วย token
- หลังตั้งค่าคอนฟิกแล้ว การเผยแพร่ผ่าน GitHub Actions ที่รองรับในอนาคตสามารถใช้
  OIDC/การเผยแพร่ที่เชื่อถือได้โดยไม่ต้องใช้ token ClawHub อายุยาว
- `--repository <repo>` ต้องเป็น `owner/repo`
- `--workflow-filename <file>` ต้องตรงกับชื่อไฟล์เวิร์กโฟลว์ใน
  `.github/workflows/`
- `--environment <name>` เป็นตัวเลือก เมื่อกำหนดค่าแล้ว environment ของ GitHub Actions
  ใน claim ของ OIDC ต้องตรงกันทุกประการ
- ClawHub ตรวจสอบ repository GitHub ที่กำหนดค่าไว้เมื่อคำสั่งนี้ทำงาน
  repository สาธารณะสามารถตรวจสอบได้ผ่านเมทาดาทา GitHub สาธารณะ ส่วน repository
  ส่วนตัวต้องให้ ClawHub มีสิทธิ์เข้าถึง GitHub สำหรับ repository นั้น
  เช่น ผ่านการติดตั้ง GitHub App ของ ClawHub ในอนาคต หรือการผสานรวม GitHub
  ที่ได้รับอนุญาตอื่น
- แฟล็ก:
  - `--repository <repo>`: repository GitHub เช่น `openclaw/example-plugin`
  - `--workflow-filename <file>`: ชื่อไฟล์เวิร์กโฟลว์ เช่น `package-publish.yml`
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

- ลบคอนฟิกผู้เผยแพร่ที่เชื่อถือได้ออกจากแพ็กเกจ
- ใช้เป็น rollback หากต้องปิดใช้งานหรือสร้างการปักเวิร์กโฟลว์, repository หรือ environment ใหม่
- การเผยแพร่จริงในอนาคตต้องใช้การเผยแพร่แบบยืนยันตัวตนปกติจนกว่าจะตั้งค่า
  คอนฟิกอีกครั้ง
- แฟล็ก:
  - `--json`: ผลลัพธ์ที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### เทเลเมทรีการติดตั้ง

- ส่งหลังจาก `clawhub install <slug>` เมื่อเข้าสู่ระบบแล้ว ยกเว้นเมื่อตั้งค่า
  `CLAWHUB_DISABLE_TELEMETRY=1`
- การรายงานทำแบบ best-effort คำสั่งติดตั้งจะไม่ล้มเหลวหากเทเลเมทรี
  ใช้งานไม่ได้
- รายละเอียด: `docs/telemetry.md`
