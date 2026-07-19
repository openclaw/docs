---
read_when:
    - การใช้ ClawHub CLI
    - การดีบักการติดตั้ง การอัปเดต หรือการเผยแพร่
summary: 'ข้อมูลอ้างอิง CLI: คำสั่ง แฟล็ก การกำหนดค่า และลักษณะการทำงานของไฟล์ล็อก'
x-i18n:
    generated_at: "2026-07-19T07:00:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aa830e77a2fe0639b113b5f3171da138189c3bdf0271f7b729ad0a84404bce72
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

แพ็กเกจ CLI: `clawhub`, ไบนารี: `clawhub`

ติดตั้งแบบส่วนกลางด้วย npm หรือ pnpm:

```bash
npm i -g clawhub
# หรือ
pnpm add -g clawhub
```

จากนั้นตรวจสอบ:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## แฟล็กส่วนกลาง

- `--workdir <dir>`: ไดเรกทอรีทำงาน (ค่าเริ่มต้น: cwd; หากกำหนดค่าไว้ จะใช้พื้นที่ทำงาน Clawdbot เป็นทางเลือกสำรอง)
- `--dir <dir>`: ไดเรกทอรีติดตั้งภายใต้ workdir (ค่าเริ่มต้น: `skills`)
- `--site <url>`: URL ฐานสำหรับเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `https://clawhub.ai`)
- `--registry <url>`: URL ฐานของ API (ค่าเริ่มต้น: ค้นหาโดยอัตโนมัติ หากไม่พบใช้ `https://clawhub.ai`)
- `--no-input`: ปิดพรอมต์

ตัวแปรสภาพแวดล้อมที่เทียบเท่า:

- `CLAWHUB_SITE` (แบบเดิม `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (แบบเดิม `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (แบบเดิม `CLAWDHUB_WORKDIR`)

### พร็อกซี HTTP

CLI รองรับตัวแปรสภาพแวดล้อมพร็อกซี HTTP มาตรฐานสำหรับระบบที่อยู่หลัง
พร็อกซีขององค์กรหรือเครือข่ายที่จำกัด:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

เมื่อตั้งค่าตัวแปรเหล่านี้ตัวใดตัวหนึ่ง CLI จะกำหนดเส้นทางคำขอขาออกผ่าน
พร็อกซีที่ระบุ โดยใช้ `HTTPS_PROXY` สำหรับคำขอ HTTPS และ `HTTP_PROXY`
สำหรับ HTTP แบบไม่เข้ารหัส ทั้งยังรองรับ `NO_PROXY` / `no_proxy` เพื่อข้ามพร็อกซีสำหรับ
โฮสต์หรือโดเมนที่ระบุ

จำเป็นต้องใช้การตั้งค่านี้ในระบบที่บล็อกการเชื่อมต่อขาออกโดยตรง
(เช่น คอนเทนเนอร์ Docker, Hetzner VPS ที่เชื่อมต่ออินเทอร์เน็ตได้ผ่านพร็อกซีเท่านั้น หรือ
ไฟร์วอลล์ขององค์กร)

ตัวอย่าง:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "คำค้นหาของฉัน"
```

เมื่อไม่ได้ตั้งค่าตัวแปรพร็อกซี ลักษณะการทำงานจะไม่เปลี่ยนแปลง (เชื่อมต่อโดยตรง)

## ไฟล์การกำหนดค่า

จัดเก็บโทเค็น API และ URL รีจิสทรีที่แคชไว้

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` หรือ `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- ทางเลือกสำรองแบบเดิม: หากยังไม่มี `clawhub/config.json` แต่มี `clawdhub/config.json` CLI จะใช้พาธแบบเดิมต่อ
- เขียนทับค่า: `CLAWHUB_CONFIG_PATH` (แบบเดิม `CLAWDHUB_CONFIG_PATH`)

## คำสั่ง

### `login` / `auth login`

- ค่าเริ่มต้น: เปิดเบราว์เซอร์ไปยัง `<site>/cli/auth` และดำเนินการให้เสร็จผ่านคอลแบ็กแบบลูปแบ็ก
- แบบไม่มีส่วนติดต่อผู้ใช้: `clawhub login --token clh_...`
- แบบโต้ตอบระยะไกล/ไม่มีส่วนติดต่อผู้ใช้: `clawhub login --device` จะแสดงรหัสและรอระหว่างที่คุณอนุญาตสิทธิ์ที่ `<site>/cli/device`

### `whoami`

- ตรวจสอบโทเค็นที่จัดเก็บไว้ผ่าน `/api/v1/whoami`

### `token`

- พิมพ์โทเค็น API ที่จัดเก็บไว้ไปยัง stdout
- มีประโยชน์สำหรับการไพป์โทเค็นเข้าสู่ระบบภายในเครื่องไปยังคำสั่งตั้งค่าข้อมูลลับของ CI

### `star <skill>` / `unstar <skill>`

- เพิ่ม/ลบสกิลออกจากรายการเด่นของคุณ
- เรียก `POST /api/v1/stars/<slug>` และ `DELETE /api/v1/stars/<slug>`
- `--yes` ข้ามการยืนยัน

### `search <query...>`

- เรียก `/api/v1/search?q=...`
- ผลลัพธ์ประกอบด้วย slug ของสกิล, handle ของเจ้าของ, ชื่อที่แสดง และคะแนนความเกี่ยวข้อง
- การค้นหาจะให้น้ำหนักกับโทเค็นที่ตรงกับ slug/ชื่อแบบพอดีก่อนความนิยมในการดาวน์โหลด โทเค็น slug เดี่ยว เช่น `map` จะตรงกับ `personal-map` มากกว่าสตริงย่อยภายใน `amap`
- ความนิยมเป็นเพียงปัจจัยเริ่มต้นเล็กน้อยในการจัดอันดับ ไม่ได้รับประกันว่าจะอยู่ในอันดับสูงสุด
- หากสกิลควรปรากฏแต่ไม่ปรากฏ ให้เรียกใช้ `clawhub inspect @owner/slug` ขณะเข้าสู่ระบบเพื่อตรวจสอบการวินิจฉัยการกลั่นกรองที่เจ้าของมองเห็นได้ ก่อนเปลี่ยนชื่อข้อมูลเมตา

### `explore`

- แสดงรายการสกิลใหม่ล่าสุดผ่าน `/api/v1/skills?limit=...&sort=createdAt` (เรียงตาม `createdAt` จากมากไปน้อย)
- แฟล็ก:
  - `--limit <n>` (1-200, ค่าเริ่มต้น: 25)
  - `--sort newest|updated|rating|downloads|trending` (ค่าเริ่มต้น: ใหม่ล่าสุด) นามแฝงการเรียงลำดับการติดตั้งแบบเดิมยังคงใช้งานได้เพื่อความเข้ากันได้
  - `--json` (ผลลัพธ์ที่เครื่องอ่านได้)
- ผลลัพธ์: `<slug>  v<version>  <age>  <summary>` (ตัดบทสรุปให้เหลือ 50 อักขระ)

### `inspect @owner/slug`

- ดึงข้อมูลเมตาของสกิลและไฟล์เวอร์ชันโดยไม่ติดตั้ง
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: ล่าสุด)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-200)
- `--files`: แสดงรายการไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (เฉพาะไฟล์ข้อความ; จำกัด 200KB)
- `--json`: ผลลัพธ์ที่เครื่องอ่านได้

### `install @owner/slug`

- ระบุเวอร์ชันล่าสุดสำหรับเจ้าของและสกิลที่กำหนด
- ดาวน์โหลดไฟล์ zip ผ่าน `/api/v1/download`
- แตกไฟล์ลงใน `<workdir>/<dir>/<slug>`
- ปฏิเสธการเขียนทับสกิลที่ปักหมุดไว้ ให้เรียกใช้ `clawhub unpin <skill>` ก่อน
- เขียน:
  - `<workdir>/.clawhub/lock.json` (แบบเดิม `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (แบบเดิม `.clawdhub`)

### `uninstall <skill>`

- ลบ `<workdir>/<dir>/<slug>` และลบรายการออกจาก lockfile
- ส่งข้อมูลการวัดและส่งข้อมูลทางไกลแบบพยายามให้ดีที่สุดขณะเข้าสู่ระบบ เพื่อให้สามารถ
  ปิดใช้งานจำนวนการติดตั้งปัจจุบันได้
- แบบโต้ตอบ: ขอการยืนยัน
- แบบไม่โต้ตอบ (`--no-input`): ต้องใช้ `--yes`

### `list`

- อ่าน `<workdir>/.clawhub/lock.json` (แบบเดิม `.clawdhub`)
- แสดง `pinned` ถัดจากสกิลที่ตรึงไว้ด้วย `clawhub pin` รวมถึงเหตุผลเพิ่มเติมหากมี

### `pin <skill>`

- ทำเครื่องหมายสกิลที่ติดตั้งแล้วว่าปักหมุดใน lockfile
- `--reason <text>` บันทึกสาเหตุที่ตรึงสกิลไว้
- สกิลที่ปักหมุดจะถูกข้ามโดย `update --all` และถูกปฏิเสธโดย `update <skill>` โดยตรง
- สกิลที่ปักหมุดจะปฏิเสธ `install --force` ด้วย เพื่อป้องกันไม่ให้แทนที่ไบต์ภายในเครื่องโดยไม่ตั้งใจ

### `unpin <skill>`

- นำหมุดใน lockfile ออกจากสกิลที่ติดตั้ง เพื่อให้การอัปเดตในอนาคตแก้ไขสกิลได้

### `update [@owner/slug]` / `update --all`

- คำนวณลายนิ้วมือจากไฟล์ภายในเครื่อง
- หากลายนิ้วมือตรงกับเวอร์ชันที่รู้จัก: ไม่แสดงพรอมต์
- หากลายนิ้วมือไม่ตรง:
  - ปฏิเสธตามค่าเริ่มต้น
  - เขียนทับด้วย `--force` (หรือแสดงพรอมต์ หากเป็นแบบโต้ตอบ)
- สกิลที่ปักหมุดจะไม่ถูกอัปเดตโดย `--force`
- `update <skill>` ล้มเหลวทันทีสำหรับสกิลที่ปักหมุด และแจ้งให้เรียกใช้ `clawhub unpin <skill>` ก่อน
- `update --all` ข้าม slug ที่ปักหมุดและพิมพ์บทสรุปว่าสิ่งใดยังคงถูกตรึงไว้

### `skill publish <path>`

- เปรียบเทียบลายนิ้วมือของบันเดิลภายในเครื่องกับ ClawHub และออกจากโปรแกรมสำเร็จเมื่อ
  เนื้อหาได้รับการเผยแพร่แล้ว
- สกิลใหม่ใช้ `1.0.0` เป็นค่าเริ่มต้น ส่วนสกิลที่เปลี่ยนแปลงจะใช้เวอร์ชันแพตช์
  ถัดไปเป็นค่าเริ่มต้น
- `--version <version>` เลือกเวอร์ชันอย่างชัดเจนและเผยแพร่แม้เมื่อ
  เนื้อหาตรงกับเวอร์ชันที่มีอยู่
- `--dry-run` ดำเนินการเผยแพร่โดยไม่อัปโหลด ส่วน `--json` พิมพ์ผลลัพธ์
  ที่เครื่องอ่านได้
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่ขององค์กร/ผู้ใช้ เมื่อ
  ผู้ดำเนินการมีสิทธิ์เข้าถึงในฐานะผู้เผยแพร่
- `--migrate-owner` ย้ายสกิลที่มีอยู่ไปยัง `--owner` พร้อมกับเผยแพร่
  เวอร์ชันใหม่ ต้องมีสิทธิ์ผู้ดูแลระบบ/เจ้าของในผู้เผยแพร่ทั้งสองฝ่าย
- อธิบายลักษณะการทำงานของเจ้าของและการรีวิวไว้ใน `docs/publishing.md`
- การเผยแพร่สกิลหมายถึงการเผยแพร่ภายใต้ `MIT-0` บน ClawHub
- สกิลที่เผยแพร่แล้วสามารถใช้ แก้ไข และแจกจ่ายต่อได้ฟรีโดยไม่ต้องระบุแหล่งที่มา
- ClawHub ไม่รองรับสกิลแบบชำระเงินหรือการกำหนดราคาต่อสกิล
- นามแฝงแบบเดิม: `publish <path>`

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

เวิร์กโฟลว์ที่นำกลับมาใช้ใหม่ได้ของ ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
จะเรียก `skill publish` สำหรับ `skill_path` หนึ่งรายการ หรือสำหรับแต่ละโฟลเดอร์สกิลโดยตรง
ภายใต้ `root` (ค่าเริ่มต้น: `skills`) โดยจะข้ามสกิลที่ไม่มีการเปลี่ยนแปลงและใช้
ลักษณะการทำงานแบบเพิ่มเวอร์ชันแพตช์อัตโนมัติเช่นเดียวกัน

ตั้งค่า `dry_run: true` เพื่อดูตัวอย่างโดยไม่ใช้โทเค็น การเผยแพร่จริงต้องใช้
ข้อมูลลับ `clawhub_token`

### `sync`

- สแกน workdir ปัจจุบัน ไดเรกทอรีสกิลที่กำหนดค่าไว้ และโฟลเดอร์
  `--root <dir>` ใดๆ เพื่อค้นหาโฟลเดอร์สกิลภายในเครื่องที่มี `SKILL.md` หรือ
  `skill.md`
- เปรียบเทียบลายนิ้วมือของสกิลภายในเครื่องแต่ละรายการกับ ClawHub และเผยแพร่เฉพาะสกิลใหม่หรือ
  สกิลที่เปลี่ยนแปลง
- สกิลใหม่เผยแพร่เป็น `1.0.0` ส่วนสกิลที่เปลี่ยนแปลงจะเผยแพร่เป็นเวอร์ชันแพตช์ถัดไป
  ตามค่าเริ่มต้น ใช้ `--bump minor|major` สำหรับชุดการอัปเดตที่ควรเลื่อนด้วย
  ขั้น semver ที่ใหญ่กว่า
- `--dry-run` แสดงแผนการเผยแพร่โดยไม่อัปโหลด ส่วน `--json` พิมพ์แผน
  ที่เครื่องอ่านได้
- `--all` เผยแพร่ทุกสกิลใหม่หรือสกิลที่เปลี่ยนแปลงโดยไม่แสดงพรอมต์ หากไม่มี
  `--all` เทอร์มินัลแบบโต้ตอบจะให้คุณเลือกสกิลที่จะเผยแพร่
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่ขององค์กร/ผู้ใช้ เมื่อ
  ผู้ดำเนินการมีสิทธิ์เข้าถึงในฐานะผู้เผยแพร่
- `sync` เป็นการเผยแพร่ทางเดียวเท่านั้น โดยจะไม่ติดตั้ง อัปเดต ดาวน์โหลด หรือ
  รายงานข้อมูลการวัดและส่งข้อมูลทางไกลเกี่ยวกับการติดตั้ง/ดาวน์โหลด

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- ต้องใช้ `clawhub login`
- เรียกใช้ ClawScan ของ ClawHub ผ่าน `POST /api/v1/skills/-/scan` แล้วสำรวจสถานะจนกว่าการสแกนจะสิ้นสุด
- การสแกนเป็นแบบอะซิงโครนัสและอาจใช้เวลาจึงจะเสร็จสมบูรณ์ ระหว่างอยู่ในคิว ตัวหมุนในเทอร์มินัลจะแสดงตำแหน่งการสแกนที่ได้รับการจัดลำดับความสำคัญในปัจจุบันและจำนวนการสแกนที่อยู่ข้างหน้า
- การสแกนที่เผยแพร่ต้องมีสิทธิ์เจ้าของหรือสิทธิ์จัดการผู้เผยแพร่ ผู้กลั่นกรอง/ผู้ดูแลระบบสามารถใช้แบ็กเอนด์เดียวกันผ่าน `clawhub-admin`
- `--update` ใช้ได้เฉพาะกับ `--slug` โดยจะเขียนผลการสแกนที่เผยแพร่และสำเร็จกลับไปยังเวอร์ชันที่เลือก
- `--output <file.zip>` ดาวน์โหลดไฟล์เก็บถาวรรายงานฉบับเต็มที่มี `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` และ `README.md`
- `--json` พิมพ์การตอบกลับการสำรวจสถานะทั้งหมดสำหรับระบบอัตโนมัติ
- ไม่รองรับการสแกนพาธภายในเครื่องอีกต่อไป ให้อัปโหลดเวอร์ชันใหม่ แล้วใช้ `scan download` เพื่อเรียกดูผลการสแกนที่จัดเก็บไว้สำหรับเวอร์ชันที่ส่งนั้น

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- ต้องใช้ `clawhub login`
- ดาวน์โหลดไฟล์ ZIP ของรายงานการสแกนที่จัดเก็บไว้สำหรับเวอร์ชัน Skills หรือ Plugin ที่ส่งเข้ามา รวมถึงเวอร์ชันที่ถูกบล็อกหรือซ่อนโดยการตรวจสอบความปลอดภัยของ ClawHub
- การดาวน์โหลด Skills ใช้ slug ของ Skills และมีค่าเริ่มต้นเป็น `--kind skill`
- การดาวน์โหลด Plugin ใช้ชื่อแพ็กเกจและต้องระบุ `--kind plugin`
- ต้องระบุ `--version` เพื่อให้ผู้เขียนตรวจสอบเวอร์ชันที่ส่งเข้ามาซึ่งถูก ClawHub บล็อกได้อย่างถูกต้อง
- `--output <file.zip>` ใช้เลือกพาธปลายทาง

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub มีเวิร์กโฟลว์อย่างเป็นทางการที่ใช้ซ้ำได้อยู่ที่
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/aaa73625ed4100b1006653f49089f2a2d969a427/.github/workflows/skill-publish.yml)
สำหรับรีโพซิทอรี Skills และรีโพซิทอรีแค็ตตาล็อก

การตั้งค่าแค็ตตาล็อกโดยทั่วไป:

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

- `root` มีค่าเริ่มต้นเป็น `skills` สำหรับรีโพซิทอรีแค็ตตาล็อก
- ส่ง `skill_path: skills/review-helper` เพื่อประมวลผลโฟลเดอร์ Skills หนึ่งโฟลเดอร์
- `owner` จับคู่กับแฟล็ก CLI `--owner`; ไม่ต้องระบุเพื่อเผยแพร่ในฐานะผู้ใช้ที่ผ่านการยืนยันตัวตน
- การเผยแพร่ Skills V1 ใช้ `clawhub_token`; ขณะนี้การเผยแพร่ที่เชื่อถือได้ด้วย GitHub OIDC รองรับเฉพาะแพ็กเกจ

### `delete <skill>`

- เมื่อไม่มี `--version` ให้ลบ Skills แบบกู้คืนได้ (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- เรียก `DELETE /api/v1/skills/{slug}`
- การลบแบบกู้คืนได้ที่เจ้าของเป็นผู้ดำเนินการจะสงวน slug ไว้ 30 วัน โดยคำสั่งจะแสดงเวลาหมดอายุ
- `--version <version>` ลบเวอร์ชันที่เป็นของตนเองและไม่ใช่เวอร์ชันล่าสุดอย่างถาวรผ่านเส้นทางเฉพาะเวอร์ชัน
  ที่ปฏิเสธการทำงานเมื่อไม่สามารถยืนยันเงื่อนไขได้
  เวอร์ชันที่ถูกลบไม่สามารถกู้คืนหรือเผยแพร่ซ้ำได้ ให้เผยแพร่เวอร์ชันทดแทนก่อนลบ
  เวอร์ชันล่าสุดในปัจจุบัน เจ้าหน้าที่แพลตฟอร์มไม่สามารถข้ามข้อกำหนดด้านความเป็นเจ้าของสำหรับขั้นตอนเฉพาะเวอร์ชันนี้
- `--reason <text>` บันทึกหมายเหตุการดูแลในการลบ Skills ทั้งรายการแบบกู้คืนได้และบันทึกการตรวจสอบ
- `--note <text>` เป็นนามแฝงของ `--reason`
- `--yes` ข้ามการยืนยัน

### `undelete <skill>`

- กู้คืน Skills ที่ซ่อนอยู่ (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- ไม่มีการยกเลิกการลบเวอร์ชัน เวอร์ชันที่ถูกลบอย่างถาวรไม่สามารถกู้คืนได้
- เรียก `POST /api/v1/skills/{slug}/undelete`
- `--reason <text>` บันทึกหมายเหตุการดูแลใน Skills และบันทึกการตรวจสอบ
- `--note <text>` เป็นนามแฝงของ `--reason`
- `--yes` ข้ามการยืนยัน

### `hide <skill>`

- ซ่อน Skills (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- นามแฝงของ `delete`

### `unhide <skill>`

- ยกเลิกการซ่อน Skills (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- นามแฝงของ `undelete`

### `skill rename <skill> <new-name>`

- เปลี่ยนชื่อ Skills ที่เป็นของตนเองและเก็บ slug เดิมไว้เป็นนามแฝงสำหรับเปลี่ยนเส้นทาง
- เรียก `POST /api/v1/skills/{slug}/rename`
- `--yes` ข้ามการยืนยัน

### `skill merge <source> <target>`

- รวม Skills ที่เป็นของตนเองรายการหนึ่งเข้ากับ Skills ที่เป็นของตนเองอีกรายการ
- slug ต้นทางจะไม่แสดงต่อสาธารณะอีกต่อไปและเปลี่ยนเป็นนามแฝงที่เปลี่ยนเส้นทางไปยังเป้าหมาย
- เรียก `POST /api/v1/skills/{sourceSlug}/merge`
- `--yes` ข้ามการยืนยัน

### `transfer`

- เวิร์กโฟลว์การโอนความเป็นเจ้าของ
- การโอนไปยังแฮนเดิลผู้ใช้จะสร้างคำขอที่รอดำเนินการให้ผู้รับยอมรับ
- การโอนไปยังแฮนเดิลขององค์กร/ผู้เผยแพร่จะมีผลทันทีเฉพาะเมื่อผู้ดำเนินการมี
  สิทธิ์ผู้ดูแลระบบทั้งในเจ้าของปัจจุบันและผู้เผยแพร่ปลายทาง
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
- ใช้คำสั่งนี้สำหรับ Plugin และรายการในตระกูลแพ็กเกจอื่น ส่วน `search` ระดับบนสุดยังคงเป็นส่วนค้นหา Skills
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
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (เฉพาะไฟล์ข้อความ จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `package download <name>`

- แก้ไขเวอร์ชันแพ็กเกจผ่าน
  `GET /api/v1/packages/{name}/versions/{version}/artifact`
- ดาวน์โหลดอาร์ติแฟกต์จาก `downloadUrl` ของตัวแก้ไข
- ตรวจสอบ ClawHub SHA-256 สำหรับอาร์ติแฟกต์ทั้งหมด
- สำหรับอาร์ติแฟกต์ npm-pack ของ ClawPack จะตรวจสอบความสมบูรณ์ของ npm `sha512`,
  npm shasum และชื่อ/เวอร์ชัน `package.json` ของ tarball เพิ่มเติมด้วย
- เวอร์ชัน ZIP แบบเดิมจะดาวน์โหลดผ่านเส้นทาง ZIP แบบเดิม
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

- คำนวณ ClawHub SHA-256, ความสมบูรณ์ของ npm `sha512` และ npm shasum สำหรับ
  อาร์ติแฟกต์ภายในเครื่อง
- เมื่อใช้ `--package` จะแก้ไขข้อมูลเมตาที่คาดไว้จาก ClawHub และเปรียบเทียบ
  ไฟล์ภายในเครื่องกับข้อมูลเมตาของอาร์ติแฟกต์ที่เผยแพร่
- เมื่อใช้แฟล็กไดเจสต์โดยตรง จะตรวจสอบโดยไม่ค้นหาผ่านเครือข่าย
- แฟล็ก:
  - `--package <name>`: ชื่อแพ็กเกจสำหรับแก้ไขข้อมูลเมตาของอาร์ติแฟกต์ที่คาดไว้
  - `--version <version>` หรือ `--tag <tag>`: เวอร์ชันแพ็กเกจที่คาดไว้
  - `--sha256 <hex>`: ClawHub SHA-256 ที่คาดไว้
  - `--npm-integrity <sri>`: ค่าความสมบูรณ์ของ npm ที่คาดไว้
  - `--npm-shasum <sha1>`: npm shasum ที่คาดไว้
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- เรียกใช้ Plugin Inspector ที่รวมมากับ CLI ของ ClawHub กับโฟลเดอร์แพ็กเกจ Plugin
  ภายในเครื่อง
- ค่าเริ่มต้นเป็นการตรวจสอบแบบออฟไลน์/สแตติก โดยไม่ค้นหาหรือนำเข้า checkout ของ
  OpenClaw ภายในเครื่อง
- ข้อผิดพลาดด้านความเข้ากันได้ที่ร้ายแรงจะจบการทำงานด้วยค่าที่ไม่ใช่ศูนย์ ผลการตรวจพบที่เป็นเพียงคำเตือนจะแสดงออกมาแต่
  จบการทำงานด้วยค่าศูนย์
- แฟล็ก:
  - `--out <dir>`: เขียนรายงาน Plugin Inspector ไปยังไดเรกทอรีนี้
  - `--openclaw <path>`: ตรวจสอบกับ checkout ของ OpenClaw ภายในเครื่องที่ระบุอย่างชัดเจน
  - `--runtime`: เปิดใช้งานการเก็บข้อมูลรันไทม์ ซึ่งจะนำเข้าโค้ด Plugin
  - `--allow-execute`: อนุญาตให้เก็บข้อมูลรันไทม์ในพื้นที่ทำงานที่แยกออกมา
  - `--no-mock-sdk`: ปิดใช้ OpenClaw SDK จำลองระหว่างการเก็บข้อมูลรันไทม์
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package validate ./example-plugin
```

หากการตรวจสอบรายงานผลการตรวจพบเกี่ยวกับแพ็กเกจ manifest การนำเข้า SDK หรืออาร์ติแฟกต์ โปรดดู
[วิธีแก้ไขการตรวจสอบ Plugin](/clawhub/plugin-validation-fixes) แล้วเรียกใช้คำสั่งอีกครั้ง

### `package delete <name>`

- เมื่อไม่มี `--version` จะลบแพ็กเกจและรีลีสทั้งหมดแบบกู้คืนได้
- `--version <version>` ลบรีลีสที่เป็นของตนเองและไม่ใช่เวอร์ชันล่าสุดอย่างถาวรผ่านเส้นทางเฉพาะเวอร์ชัน
  ที่ปฏิเสธการทำงานเมื่อไม่สามารถยืนยันเงื่อนไขได้
  เวอร์ชันที่ถูกลบไม่สามารถกู้คืนหรือเผยแพร่ซ้ำได้ ให้เผยแพร่เวอร์ชันทดแทนก่อนลบ
  เวอร์ชันล่าสุดในปัจจุบัน ขั้นตอนเฉพาะเวอร์ชันนี้กำหนดให้เป็นเจ้าของแพ็กเกจหรือผู้ดูแลระบบของผู้เผยแพร่ในองค์กร
  โดยเจ้าหน้าที่แพลตฟอร์มไม่สามารถข้ามข้อกำหนดความเป็นเจ้าของแพ็กเกจ
- การลบแพ็กเกจทั้งรายการแบบกู้คืนได้กำหนดให้เป็นเจ้าของแพ็กเกจ เจ้าของ/ผู้ดูแลระบบของผู้เผยแพร่ในองค์กร ผู้ดูแล
  แพลตฟอร์ม หรือผู้ดูแลระบบแพลตฟอร์ม
- แฟล็ก:
  - `--version <version>`: ลบเวอร์ชันที่ไม่ใช่เวอร์ชันล่าสุดหนึ่งเวอร์ชันอย่างถาวร
  - `--yes`: ข้ามการยืนยัน
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- กู้คืนแพ็กเกจและรีลีสที่ถูกลบแบบกู้คืนได้
- ไม่มีการยกเลิกการลบเวอร์ชัน เวอร์ชันที่ถูกลบอย่างถาวรไม่สามารถกู้คืนได้
- กำหนดให้เป็นเจ้าของแพ็กเกจ เจ้าของ/ผู้ดูแลระบบของผู้เผยแพร่ในองค์กร ผู้ดูแลแพลตฟอร์ม
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
- ต้องมีสิทธิ์ผู้ดูแลระบบทั้งสำหรับเจ้าของแพ็กเกจปัจจุบันและผู้เผยแพร่
  ปลายทาง เว้นแต่ดำเนินการโดยผู้ดูแลระบบแพลตฟอร์ม
- ชื่อแพ็กเกจที่มีขอบเขตต้องโอนไปยังเจ้าของขอบเขตที่ตรงกัน
- เรียกใช้ `POST /api/v1/packages/{name}/transfer`
- แฟล็ก:
  - `--to <owner>`: แฮนเดิลของผู้เผยแพร่ปลายทาง
  - `--reason <text>`: เหตุผลสำหรับการตรวจสอบที่ระบุหรือไม่ก็ได้
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- คำสั่งที่ต้องผ่านการยืนยันตัวตนสำหรับรายงานแพ็กเกจต่อผู้ดูแล
- เรียกใช้ `POST /api/v1/packages/{name}/report`
- รายงานอยู่ในระดับแพ็กเกจ สามารถผูกกับเวอร์ชันได้ตามต้องการ และผู้ดูแลจะมองเห็น
  เพื่อตรวจสอบ
- รายงานจะไม่ซ่อนแพ็กเกจหรือบล็อกการดาวน์โหลดโดยอัตโนมัติด้วยตัวเอง
- แฟล็ก:
  - `--version <version>`: เวอร์ชันแพ็กเกจที่ระบุหรือไม่ก็ได้เพื่อแนบกับรายงาน
  - `--reason <text>`: เหตุผลของรายงานที่จำเป็นต้องระบุ
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "เพย์โหลดเนทีฟที่น่าสงสัย"
```

### `package moderation-status`

- คำสั่งสำหรับเจ้าของเพื่อตรวจสอบการมองเห็นสถานะการกลั่นกรองของแพ็กเกจ
- เรียกใช้ `GET /api/v1/packages/{name}/moderation`
- แสดงสถานะการสแกนแพ็กเกจปัจจุบัน จำนวนรายงานที่ยังเปิดอยู่ สถานะการกลั่นกรอง
  ด้วยตนเองของรุ่นล่าสุด สถานะการบล็อกการดาวน์โหลด และเหตุผลในการกลั่นกรอง
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- ตรวจสอบว่าแพ็กเกจพร้อมสำหรับการใช้งานโดย OpenClaw ในอนาคตหรือไม่
- เรียกใช้ `GET /api/v1/packages/{name}/readiness`
- รายงานสิ่งกีดขวางสำหรับสถานะทางการ ความพร้อมใช้งานของ ClawPack ไดเจสต์ของอาร์ติแฟกต์
  ที่มาของซอร์ส ความเข้ากันได้กับ OpenClaw เป้าหมายโฮสต์ เมทาดาทาสภาพแวดล้อม
  และสถานะการสแกน
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- แสดงสถานะการย้ายข้อมูลที่มุ่งเน้นผู้ปฏิบัติงานสำหรับแพ็กเกจที่อาจมาแทนที่
  Plugin ที่รวมมากับ OpenClaw
- เรียกใช้เอนด์พอยต์ความพร้อมที่คำนวณแล้วเดียวกันกับ `package readiness` แต่แสดง
  สถานะที่มุ่งเน้นการย้ายข้อมูล เวอร์ชันล่าสุด สถานะแพ็กเกจทางการ การตรวจสอบ และ
  สิ่งกีดขวาง
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- สร้างผู้เผยแพร่ขององค์กรที่มีผู้ใช้ซึ่งผ่านการยืนยันตัวตนเป็นเจ้าของ
- แฮนเดิลจะถูกปรับให้เป็นตัวพิมพ์เล็ก และส่งโดยมีหรือไม่มี `@` ก็ได้
- ผู้เผยแพร่ขององค์กรที่สร้างใหม่จะไม่ได้รับความไว้วางใจหรือสถานะทางการโดยค่าเริ่มต้น
- ล้มเหลวหากแฮนเดิลถูกใช้แล้วโดยผู้เผยแพร่ ผู้ใช้ หรือเส้นทางที่สงวนไว้

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- เผยแพร่ Plugin แบบโค้ดหรือ Plugin แบบบันเดิลผ่าน `POST /api/v1/packages`
- `<source>` รองรับ:
  - พาธโฟลเดอร์ภายในเครื่อง: `./my-plugin`
  - ทาร์บอล npm-pack ของ ClawPack ภายในเครื่อง: `./my-plugin-1.2.3.tgz`
  - รีโพ GitHub: `owner/repo` หรือ `owner/repo@ref`
  - URL ของ GitHub: `https://github.com/owner/repo`
- ระบบตรวจหาเมทาดาทาโดยอัตโนมัติจาก `package.json`, `openclaw.plugin.json` และ
  เครื่องหมายบันเดิล OpenClaw จริง เช่น `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` และ `.cursor-plugin/plugin.json`
- ซอร์ส `.tgz` จะถือเป็น ClawPack โดย CLI จะอัปโหลดไบต์ npm-pack
  ที่ตรงกันทุกประการ และใช้เนื้อหา `package/` ที่แตกไฟล์แล้วเฉพาะสำหรับการตรวจสอบและ
  การกรอกเมทาดาทาล่วงหน้า
- โฟลเดอร์ Plugin แบบโค้ดจะถูกแพ็กเป็นทาร์บอล npm ของ ClawPack ก่อนอัปโหลด เพื่อให้
  การติดตั้ง OpenClaw สามารถตรวจสอบอาร์ติแฟกต์ที่ตรงกันทุกประการได้ ส่วนโฟลเดอร์ Plugin แบบบันเดิลยังคง
  ใช้เส้นทางการเผยแพร่ไฟล์ที่แตกแล้ว
- สำหรับซอร์ส GitHub ระบบจะกรอกข้อมูลที่มาของซอร์สโดยอัตโนมัติจากรีโพ คอมมิตที่แก้ไขแล้ว ref และพาธย่อย
- สำหรับโฟลเดอร์ภายในเครื่อง ระบบจะตรวจหาข้อมูลที่มาของซอร์สจาก git ภายในเครื่องโดยอัตโนมัติเมื่อรีโมต origin ชี้ไปยัง GitHub
- Plugin แบบโค้ดภายนอกต้องประกาศ `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion` อย่างชัดเจน
  จะไม่ใช้ `package.json.version` ระดับบนสุดเป็นค่าทดแทนสำหรับการตรวจสอบความถูกต้องก่อนเผยแพร่
- `--dry-run` แสดงตัวอย่างเพย์โหลดการเผยแพร่ที่แก้ไขแล้วโดยไม่อัปโหลด
- `--json` ส่งเอาต์พุตที่เครื่องอ่านได้สำหรับ CI
- `--owner <handle>` เผยแพร่ภายใต้แฮนเดิลผู้เผยแพร่ของผู้ใช้หรือองค์กร เมื่อผู้ดำเนินการมีสิทธิ์เข้าถึงผู้เผยแพร่
- ชื่อแพ็กเกจที่มีขอบเขตต้องตรงกับเจ้าของที่เลือก ดู `docs/publishing.md`
- แฟล็กที่มีอยู่แล้ว (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ยังคงใช้เป็นค่าลบล้างได้
- รีโพ GitHub แบบส่วนตัวต้องใช้ `GITHUB_TOKEN`

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### ขั้นตอนภายในเครื่องที่แนะนำ

ใช้ `--dry-run` ก่อน เพื่อยืนยันเมทาดาทาแพ็กเกจที่แก้ไขแล้วและ
ข้อมูลที่มาของซอร์สก่อนสร้างรุ่นเผยแพร่จริง:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### ขั้นตอนสำหรับโฟลเดอร์ภายในเครื่อง

สำหรับ Plugin แบบโค้ด การเผยแพร่โฟลเดอร์จะสร้างและอัปโหลดอาร์ติแฟกต์ ClawPack จาก
โฟลเดอร์แพ็กเกจ:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` ขั้นต่ำสำหรับ `--family code-plugin`

Plugin แบบโค้ดภายนอกต้องมีเมทาดาทา OpenClaw จำนวนเล็กน้อยใน
`package.json` โดยแมนิเฟสต์ขั้นต่ำนี้เพียงพอสำหรับการเผยแพร่ให้สำเร็จ:

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

- `package.json.version` คือเวอร์ชันรุ่นเผยแพร่ของแพ็กเกจ แต่จะไม่ถูกใช้เป็น
ค่าทดแทนสำหรับการตรวจสอบความเข้ากันได้กับ OpenClaw หรือการตรวจสอบบิลด์
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมทาดาทาที่ระบุหรือไม่ก็ได้
  ClawHub อาจแสดงข้อมูลเหล่านี้เมื่อมีอยู่ แต่ไม่จำเป็นสำหรับการเผยแพร่
- `openclaw.compat.minGatewayVersion` และ
  `openclaw.build.pluginSdkVersion` เป็นข้อมูลเสริมที่ระบุหรือไม่ก็ได้ หากต้องการเผยแพร่
  เมทาดาทาความเข้ากันได้ที่ละเอียดขึ้น
- หากใช้ CLI `clawhub` รุ่นเก่า ให้อัปเกรดก่อนเผยแพร่ เพื่อให้
  การตรวจสอบล่วงหน้าภายในเครื่องทำงานก่อนอัปโหลด
- หากการตรวจสอบรายงานรหัสการแก้ไข โปรดดู
  [วิธีแก้ไขการตรวจสอบความถูกต้องของ Plugin](/clawhub/plugin-validation-fixes)

#### GitHub Actions

ClawHub ยังมีเวิร์กโฟลว์ที่นำกลับมาใช้ซ้ำได้อย่างเป็นทางการที่
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/aaa73625ed4100b1006653f49089f2a2d969a427/.github/workflows/package-publish.yml)
สำหรับรีโพ Plugin

การตั้งค่าผู้เรียกใช้ทั่วไป:

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

- เวิร์กโฟลว์ที่นำกลับมาใช้ซ้ำได้ตั้งค่าเริ่มต้น `source` เป็นรีโพของผู้เรียกใช้
- สำหรับ monorepo ให้ส่ง `source_path` เพื่อให้เวิร์กโฟลว์เผยแพร่โฟลเดอร์
  แพ็กเกจ Plugin เช่น `source_path: extensions/codex`
- ตรึงเวิร์กโฟลว์ที่นำกลับมาใช้ซ้ำได้ไว้กับแท็กเสถียรหรือ SHA ของคอมมิตแบบเต็ม ห้ามเรียกใช้การเผยแพร่รุ่นจาก `@main`
- `pull_request` ควรใช้ `dry_run: true` เพื่อให้ CI ไม่สร้างผลกระทบถาวร
- ควรจำกัดการเผยแพร่จริงไว้เฉพาะเหตุการณ์ที่เชื่อถือได้ เช่น `workflow_dispatch` หรือการพุชแท็ก
- การเผยแพร่ที่เชื่อถือได้โดยไม่มีข้อมูลลับใช้ได้เฉพาะบน `workflow_dispatch`; การพุชแท็กยังคงต้องใช้ `clawhub_token`
- เตรียม `clawhub_token` ให้พร้อมใช้สำหรับการเผยแพร่ครั้งแรก แพ็กเกจที่ไม่น่าเชื่อถือ หรือการเผยแพร่ฉุกเฉิน
- เวิร์กโฟลว์จะอัปโหลดผลลัพธ์ JSON เป็นอาร์ติแฟกต์และเปิดเผยเป็นเอาต์พุตของเวิร์กโฟลว์

### `package trusted-publisher get <name>`

- แสดงการกำหนดค่าผู้เผยแพร่ที่เชื่อถือได้ของ GitHub Actions สำหรับแพ็กเกจ
- ใช้คำสั่งนี้หลังตั้งค่าการกำหนดค่า เพื่อยืนยันรีโพ ชื่อไฟล์เวิร์กโฟลว์
  และการตรึงสภาพแวดล้อมที่ระบุหรือไม่ก็ได้
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- แนบหรือแทนที่การกำหนดค่าผู้เผยแพร่ที่เชื่อถือได้ของ GitHub Actions สำหรับ
  แพ็กเกจที่มีอยู่
- ต้องสร้างแพ็กเกจก่อนผ่าน `clawhub package publish`
  แบบปกติที่ยืนยันตัวตนด้วยตนเองหรือด้วยโทเค็น
- หลังตั้งค่าการกำหนดค่าแล้ว การเผยแพร่ผ่าน GitHub Actions ที่รองรับในอนาคตสามารถใช้
  OIDC/การเผยแพร่ที่เชื่อถือได้โดยไม่ต้องใช้โทเค็น ClawHub ที่มีอายุยาว
- `--repository <repo>` ต้องเป็น `owner/repo`
- `--workflow-filename <file>` ต้องตรงกับชื่อไฟล์เวิร์กโฟลว์ใน
  `.github/workflows/`
- `--environment <name>` ระบุหรือไม่ก็ได้ เมื่อกำหนดค่าแล้ว สภาพแวดล้อม GitHub Actions
  ในการอ้างสิทธิ์ OIDC ต้องตรงกันทุกประการ
- ClawHub ตรวจสอบรีโพ GitHub ที่กำหนดค่าไว้เมื่อเรียกใช้คำสั่งนี้
  รีโพสาธารณะสามารถตรวจสอบผ่านเมทาดาทา GitHub สาธารณะได้ ส่วนรีโพ
  ส่วนตัวต้องให้ ClawHub มีสิทธิ์เข้าถึงรีโพนั้นบน GitHub เช่น
  ผ่านการติดตั้ง GitHub App ของ ClawHub ในอนาคต หรือการผสานการทำงานกับ
  GitHub อื่นที่ได้รับอนุญาต
- แฟล็ก:
  - `--repository <repo>`: รีโพ GitHub เช่น `openclaw/example-plugin`
  - `--workflow-filename <file>`: ชื่อไฟล์เวิร์กโฟลว์ เช่น `package-publish.yml`
  - `--environment <name>`: สภาพแวดล้อม GitHub Actions แบบต้องตรงกันทุกประการที่ระบุหรือไม่ก็ได้
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- นำการกำหนดค่าผู้เผยแพร่ที่เชื่อถือได้ออกจากแพ็กเกจ
- ใช้คำสั่งนี้เพื่อย้อนกลับ หากต้องปิดใช้งานหรือสร้างการตรึงเวิร์กโฟลว์ รีโพ หรือสภาพแวดล้อม
  ใหม่
- การเผยแพร่จริงในอนาคตต้องใช้การเผยแพร่แบบปกติที่ผ่านการยืนยันตัวตน จนกว่าจะ
  ตั้งค่าการกำหนดค่าอีกครั้ง
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### เทเลเมทรีการติดตั้ง

- ส่งหลังจาก `clawhub install <slug>` เมื่อลงชื่อเข้าใช้ เว้นแต่
  ตั้งค่า `CLAWHUB_DISABLE_TELEMETRY=1` ไว้
- การรายงานเป็นแบบพยายามให้ดีที่สุด คำสั่งติดตั้งจะไม่ล้มเหลวหาก
  เทเลเมทรีไม่พร้อมใช้งาน
- รายละเอียด: `docs/telemetry.md`
