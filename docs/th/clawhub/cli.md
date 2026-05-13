---
read_when:
    - การใช้ ClawHub CLI
    - การดีบักการติดตั้ง การอัปเดต การเผยแพร่ หรือการซิงค์
summary: 'ข้อมูลอ้างอิง CLI: คำสั่ง, แฟล็ก, การกำหนดค่า, ไฟล์ล็อก, ลักษณะการทำงานของการซิงค์'
x-i18n:
    generated_at: "2026-05-13T05:32:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 33d1874fbb65602a7a3b19838a45b4715fa1edd4edc8873a3e4b53bd122e6774
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

แพ็กเกจ CLI: `clawhub`, ไบนารี: `clawhub`.

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

- `--workdir <dir>`: ไดเรกทอรีทำงาน (ค่าเริ่มต้น: cwd; หากตั้งค่าไว้ จะ fallback ไปยัง workspace ของ Clawdbot)
- `--dir <dir>`: ไดเรกทอรีติดตั้งภายใต้ workdir (ค่าเริ่มต้น: `skills`)
- `--site <url>`: URL ฐานสำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `https://clawhub.ai`)
- `--registry <url>`: URL ฐานของ API (ค่าเริ่มต้น: ค้นพบโดยอัตโนมัติ มิฉะนั้นใช้ `https://clawhub.ai`)
- `--no-input`: ปิดใช้ prompt

ค่า env ที่เทียบเท่า:

- `CLAWHUB_SITE` (legacy `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (legacy `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (legacy `CLAWDHUB_WORKDIR`)

### HTTP proxy

CLI รองรับตัวแปรสภาพแวดล้อม HTTP proxy มาตรฐานสำหรับระบบที่อยู่หลัง
พร็อกซีองค์กรหรือเครือข่ายที่ถูกจำกัด:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

เมื่อตั้งค่าตัวแปรใดตัวแปรหนึ่งเหล่านี้ CLI จะกำหนดเส้นทางคำขอขาออกผ่าน
พร็อกซีที่ระบุ `HTTPS_PROXY` ใช้สำหรับคำขอ HTTPS ส่วน `HTTP_PROXY`
ใช้สำหรับ HTTP ปกติ `NO_PROXY` / `no_proxy` จะถูกใช้เพื่อข้ามพร็อกซีสำหรับ
โฮสต์หรือโดเมนที่ระบุ

สิ่งนี้จำเป็นในระบบที่การเชื่อมต่อขาออกโดยตรงถูกบล็อก
(เช่น คอนเทนเนอร์ Docker, Hetzner VPS ที่ใช้อินเทอร์เน็ตผ่านพร็อกซีเท่านั้น,
ไฟร์วอลล์องค์กร)

ตัวอย่าง:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

เมื่อไม่ได้ตั้งค่าตัวแปรพร็อกซี พฤติกรรมจะไม่เปลี่ยนแปลง (เชื่อมต่อโดยตรง)

## ไฟล์ config

จัดเก็บ API token ของคุณ + URL registry ที่แคชไว้

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` หรือ `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- legacy fallback: หาก `clawhub/config.json` ยังไม่มีอยู่ แต่ `clawdhub/config.json` มีอยู่ CLI จะใช้ path legacy ซ้ำ
- override: `CLAWHUB_CONFIG_PATH` (legacy `CLAWDHUB_CONFIG_PATH`)

## คำสั่ง

### `login` / `auth login`

- ค่าเริ่มต้น: เปิดเบราว์เซอร์ไปที่ `<site>/cli/auth` และดำเนินการให้เสร็จผ่าน callback แบบ loopback
- Headless: `clawhub login --token clh_...`
- Remote/headless interactive: `clawhub login --device` พิมพ์โค้ดและรอขณะที่คุณอนุญาตที่ `<site>/cli/device`

### `whoami`

- ตรวจสอบ token ที่จัดเก็บไว้ผ่าน `/api/v1/whoami`

### `star <slug>` / `unstar <slug>`

- เพิ่ม/ลบ skill จากรายการเด่นของคุณ
- เรียก `POST /api/v1/stars/<slug>` และ `DELETE /api/v1/stars/<slug>`
- `--yes` ข้ามการยืนยัน

### `search <query...>`

- เรียก `/api/v1/search?q=...`
- การค้นหาให้ความสำคัญกับการตรงกันของ token slug/name แบบตรงตัวก่อนความนิยมจากการดาวน์โหลด token slug เดี่ยว เช่น `map` จะตรงกับ `personal-map` ได้แรงกว่าสตริงย่อยภายใน `amap`
- ยอดดาวน์โหลดเป็นสัญญาณความนิยมขนาดเล็กเท่านั้น ไม่ใช่การรับประกันว่าจะอยู่ในอันดับบนสุด
- หาก skill ควรปรากฏแต่ไม่ปรากฏ ให้รัน `clawhub inspect <slug>` ขณะเข้าสู่ระบบเพื่อตรวจสอบ diagnostics การ moderation ที่เจ้าของมองเห็นได้ก่อนเปลี่ยนชื่อ metadata

### `explore`

- แสดงรายการ skill ใหม่ล่าสุดผ่าน `/api/v1/skills?limit=...&sort=createdAt` (เรียงตาม `createdAt` จากมากไปน้อย)
- แฟล็ก:
  - `--limit <n>` (1-200, ค่าเริ่มต้น: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (ค่าเริ่มต้น: newest)
  - `--json` (เอาต์พุตที่เครื่องอ่านได้)
- เอาต์พุต: `<slug>  v<version>  <age>  <summary>` (summary ถูกตัดให้เหลือ 50 อักขระ)

### `inspect <slug>`

- ดึง metadata ของ skill และไฟล์เวอร์ชันโดยไม่ติดตั้ง
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: latest)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติด tag (เช่น `latest`)
- `--versions`: แสดงรายการประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-200)
- `--files`: แสดงรายการไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ raw (เฉพาะไฟล์ข้อความ; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `install <slug>`

- resolve เวอร์ชัน latest ผ่าน `/api/v1/skills/<slug>`
- ดาวน์โหลด zip ผ่าน `/api/v1/download`
- แตกไฟล์ไปยัง `<workdir>/<dir>/<slug>`
- ปฏิเสธการเขียนทับ skills ที่ pin ไว้; รัน `clawhub unpin <slug>` ก่อน
- เขียน:
  - `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

### `uninstall <slug>`

- ลบ `<workdir>/<dir>/<slug>` และลบรายการ lockfile
- Interactive: ขอการยืนยัน
- Non-interactive (`--no-input`): ต้องใช้ `--yes`

### `list`

- อ่าน `<workdir>/.clawhub/lock.json` (`.clawdhub` แบบเดิม)
- แสดง `pinned` ถัดจาก Skills ที่ถูกตรึงด้วย `clawhub pin` รวมถึงเหตุผลเพิ่มเติมถ้ามี

### `pin <slug>`

- ทำเครื่องหมาย Skill ที่ติดตั้งแล้วว่า pinned ใน lockfile
- `--reason <text>` บันทึกเหตุผลว่าทำไม Skill จึงถูกตรึงไว้
- Skills ที่ถูกตรึงจะถูกข้ามโดย `update --all` และถูกปฏิเสธโดย `update <slug>` โดยตรง
- Skills ที่ถูกตรึงยังปฏิเสธ `install --force` ด้วย เพื่อไม่ให้ไบต์ในเครื่องถูกแทนที่โดยไม่ตั้งใจ

### `unpin <slug>`

- ลบ pin ใน lockfile ออกจาก Skill ที่ติดตั้งแล้ว เพื่อให้การอัปเดตในอนาคตสามารถแก้ไขได้

### `update [slug]` / `update --all`

- คำนวณ fingerprint จากไฟล์ในเครื่อง
- ถ้า fingerprint ตรงกับเวอร์ชันที่รู้จัก: ไม่มีพรอมต์
- ถ้า fingerprint ไม่ตรง:
  - ปฏิเสธโดยค่าเริ่มต้น
  - เขียนทับด้วย `--force` (หรือพรอมต์ ถ้าเป็นโหมดโต้ตอบ)
- Skills ที่ถูกตรึงจะไม่ถูกอัปเดตโดย `--force` เลย
- `update <slug>` ล้มเหลวทันทีสำหรับ slugs ที่ถูกตรึง และบอกให้คุณรัน `clawhub unpin <slug>` ก่อน
- `update --all` ข้าม slugs ที่ถูกตรึง และพิมพ์สรุปรายการที่ยังคงถูกตรึงไว้

### `skill publish <path>`

- เผยแพร่ผ่าน `POST /api/v1/skills` (multipart)
- ต้องใช้ semver: `--version 1.2.3`
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่ขององค์กร/ผู้ใช้เมื่อ
  actor มีสิทธิ์เข้าถึงในฐานะผู้เผยแพร่
- `--migrate-owner` ย้าย Skill ที่มีอยู่ไปยัง `--owner` พร้อมกับเผยแพร่
  เวอร์ชันใหม่ ต้องมีสิทธิ์ admin/owner บนผู้เผยแพร่ทั้งสองฝ่าย
- พฤติกรรมเกี่ยวกับเจ้าของและการรีวิวอธิบายไว้ใน `docs/publishing.md`
- การเผยแพร่ Skill หมายความว่า Skill นั้นถูกปล่อยภายใต้ `MIT-0` บน ClawHub
- Skills ที่เผยแพร่แล้วใช้งาน แก้ไข และแจกจ่ายซ้ำได้ฟรีโดยไม่ต้องระบุที่มา
- ClawHub ไม่รองรับ Skills แบบชำระเงินหรือการตั้งราคาต่อ Skill
- `--clawscan-note <text>` เพิ่มหมายเหตุ ClawScan หมายเหตุนี้ให้บริบทแก่ ClawScan
  สำหรับพฤติกรรมที่อาจดูผิดปกติ เช่น การเข้าถึงเครือข่าย
  การเข้าถึง native host หรือข้อมูลประจำตัวเฉพาะผู้ให้บริการ หมายเหตุถูกจัดเก็บไว้ใน
  เวอร์ชันที่เผยแพร่
- alias แบบเดิม: `publish <path>`

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- ลบ Skill แบบ soft-delete (เจ้าของ ผู้ดูแล หรือ admin)
- เรียก `DELETE /api/v1/skills/{slug}`
- การ soft delete ที่เริ่มโดยเจ้าของจะกัน slug ไว้ 30 วัน; คำสั่งจะพิมพ์เวลาหมดอายุ
- `--reason <text>` บันทึกหมายเหตุการดูแลบน Skill และ audit log
- `--note <text>` เป็น alias ของ `--reason`
- `--yes` ข้ามการยืนยัน

### `undelete <slug>`

- กู้คืน Skill ที่ถูกซ่อนไว้ (เจ้าของ ผู้ดูแล หรือ admin)
- เรียก `POST /api/v1/skills/{slug}/undelete`
- `--reason <text>` บันทึกหมายเหตุการดูแลบน Skill และ audit log
- `--note <text>` เป็น alias ของ `--reason`
- `--yes` ข้ามการยืนยัน

### `hide <slug>`

- ซ่อน Skill (เจ้าของ ผู้ดูแล หรือ admin)
- alias ของ `delete`

### `unhide <slug>`

- ยกเลิกการซ่อน Skill (เจ้าของ ผู้ดูแล หรือ admin)
- alias ของ `undelete`

### `skill rename <slug> <new-slug>`

- เปลี่ยนชื่อ Skill ที่เป็นเจ้าของ และเก็บ slug เดิมไว้เป็น redirect alias
- เรียก `POST /api/v1/skills/{slug}/rename`
- `--yes` ข้ามการยืนยัน

### `skill merge <source-slug> <target-slug>`

- รวม Skill ที่เป็นเจ้าของหนึ่งรายการเข้ากับ Skill ที่เป็นเจ้าของอีกรายการ
- source slug หยุดแสดงต่อสาธารณะและกลายเป็น redirect alias ไปยังเป้าหมาย
- เรียก `POST /api/v1/skills/{sourceSlug}/merge`
- `--yes` ข้ามการยืนยัน

### `transfer`

- เวิร์กโฟลว์การโอนความเป็นเจ้าของ
- การโอนไปยัง user handles จะสร้างคำขอที่รอให้ผู้รับยอมรับ
- การโอนไปยัง org/publisher handles จะมีผลทันทีเฉพาะเมื่อ actor มี
  สิทธิ์ admin ทั้งกับเจ้าของปัจจุบันและผู้เผยแพร่ปลายทาง
- คำสั่งย่อย:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- Endpoints:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- เรียกดูหรือค้นหาแค็ตตาล็อกแพ็กเกจรวมผ่าน `GET /api/v1/packages` และ `GET /api/v1/packages/search`
- ใช้สำหรับ plugins และรายการตระกูลแพ็กเกจอื่นๆ; `search` ระดับบนสุดยังคงเป็นพื้นผิวค้นหา Skill
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

- ดึงข้อมูลเมทาดาทาของแพ็กเกจโดยไม่ติดตั้ง
- ใช้สำหรับเมทาดาทาของ Plugin, ความเข้ากันได้, การตรวจสอบยืนยัน, ซอร์ส และการตรวจสอบเวอร์ชัน/ไฟล์
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: ล่าสุด)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-100)
- `--files`: แสดงไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (เฉพาะไฟล์ข้อความ; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `package download <name>`

- resolve เวอร์ชันแพ็กเกจผ่าน
  `GET /api/v1/packages/{name}/versions/{version}/artifact`
- ดาวน์โหลด artifact จาก `downloadUrl` ของ resolver
- ตรวจสอบ ClawHub SHA-256 สำหรับ artifacts ทั้งหมด
- สำหรับ artifacts แบบ ClawPack npm-pack ยังตรวจสอบ npm `sha512` integrity,
  npm shasum และชื่อ/เวอร์ชันใน `package.json` ของ tarball ด้วย
- เวอร์ชัน ZIP แบบเดิมดาวน์โหลดผ่าน route ZIP แบบเดิม
- Flags:
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

- คำนวณ ClawHub SHA-256, npm `sha512` integrity และ npm shasum สำหรับ
  artifact ในเครื่อง
- เมื่อใช้ `--package` จะ resolve เมทาดาทาที่คาดไว้จาก ClawHub และเปรียบเทียบ
  ไฟล์ในเครื่องกับเมทาดาทา artifact ที่เผยแพร่แล้ว
- เมื่อใช้ flags digest โดยตรง จะตรวจสอบยืนยันโดยไม่ต้องค้นหาผ่านเครือข่าย
- Flags:
  - `--package <name>`: ชื่อแพ็กเกจสำหรับ resolve เมทาดาทา artifact ที่คาดไว้
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

### `package delete <name>`

- ลบแพ็กเกจและรีลีสทั้งหมดแบบ soft-delete.
- ต้องเป็นเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลระบบของผู้เผยแพร่องค์กร, ผู้ดูแลการกลั่นกรองแพลตฟอร์ม,
  หรือผู้ดูแลระบบแพลตฟอร์ม.
- แฟล็ก:
  - `--yes`: ข้ามการยืนยัน.
  - `--json`: เอาต์พุตที่เครื่องอ่านได้.

ตัวอย่าง:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- กู้คืนแพ็กเกจและรีลีสที่ถูกลบแบบ soft-delete.
- ต้องเป็นเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลระบบของผู้เผยแพร่องค์กร, ผู้ดูแลการกลั่นกรองแพลตฟอร์ม,
  หรือผู้ดูแลระบบแพลตฟอร์ม.
- เรียก `POST /api/v1/packages/{name}/undelete`.
- แฟล็ก:
  - `--yes`: ข้ามการยืนยัน.
  - `--json`: เอาต์พุตที่เครื่องอ่านได้.

ตัวอย่าง:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- โอนแพ็กเกจไปยังผู้เผยแพร่รายอื่น.
- ต้องมีสิทธิ์ผู้ดูแลระบบทั้งกับเจ้าของแพ็กเกจปัจจุบันและผู้เผยแพร่ปลายทาง
  เว้นแต่ว่าจะดำเนินการโดยผู้ดูแลระบบแพลตฟอร์ม.
- ชื่อแพ็กเกจแบบมี scope ต้องโอนไปยังเจ้าของ scope ที่ตรงกัน.
- เรียก `POST /api/v1/packages/{name}/transfer`.
- แฟล็ก:
  - `--to <owner>`: handle ของผู้เผยแพร่ปลายทาง.
  - `--reason <text>`: เหตุผลการตรวจสอบเพิ่มเติม.
  - `--json`: เอาต์พุตที่เครื่องอ่านได้.

ตัวอย่าง:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- คำสั่งที่ต้องยืนยันตัวตนสำหรับรายงานแพ็กเกจให้ผู้ดูแลการกลั่นกรอง.
- เรียก `POST /api/v1/packages/{name}/report`.
- รายงานอยู่ในระดับแพ็กเกจ, อาจผูกกับเวอร์ชันได้, และจะปรากฏ
  ให้ผู้ดูแลการกลั่นกรองตรวจสอบ.
- รายงานจะไม่ซ่อนแพ็กเกจหรือบล็อกการดาวน์โหลดโดยอัตโนมัติด้วยตัวเอง.
- แฟล็ก:
  - `--version <version>`: เวอร์ชันแพ็กเกจเพิ่มเติมที่จะผูกกับรายงาน.
  - `--reason <text>`: เหตุผลรายงานที่จำเป็น.
  - `--json`: เอาต์พุตที่เครื่องอ่านได้.

ตัวอย่าง:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- คำสั่งสำหรับเจ้าของเพื่อตรวจสอบการมองเห็นด้านการกลั่นกรองของแพ็กเกจ.
- เรียก `GET /api/v1/packages/{name}/moderation`.
- แสดงสถานะการสแกนแพ็กเกจปัจจุบัน, จำนวนรายงานที่เปิดอยู่, สถานะการกลั่นกรองด้วยตนเองของรีลีสล่าสุด,
  สถานะการบล็อกดาวน์โหลด, และเหตุผลการกลั่นกรอง.
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้.

ตัวอย่าง:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- ตรวจสอบว่าแพ็กเกจพร้อมสำหรับการใช้งานโดย OpenClaw ในอนาคตหรือไม่.
- เรียก `GET /api/v1/packages/{name}/readiness`.
- รายงานตัวบล็อกสำหรับสถานะทางการ, ความพร้อมใช้งานของ ClawPack, digest ของ artifact,
  ที่มาของซอร์ส, ความเข้ากันได้กับ OpenClaw, เป้าหมายโฮสต์, metadata ของสภาพแวดล้อม,
  และสถานะการสแกน.
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้.

ตัวอย่าง:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- แสดงสถานะการย้ายสำหรับผู้ปฏิบัติการของแพ็กเกจที่อาจแทนที่
  Plugin ของ OpenClaw ที่ bundled มา.
- เรียก endpoint readiness ที่คำนวณเหมือนกับ `package readiness`, แต่พิมพ์
  สถานะที่มุ่งเน้นการย้าย, เวอร์ชันล่าสุด, สถานะแพ็กเกจทางการ, การตรวจสอบ, และ
  ตัวบล็อก.
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้.

ตัวอย่าง:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- เผยแพร่ code plugin หรือ bundle plugin ผ่าน `POST /api/v1/packages`.
- `<source>` รับค่า:
  - พาธโฟลเดอร์ในเครื่อง: `./my-plugin`
  - tarball npm-pack ของ ClawPack ในเครื่อง: `./my-plugin-1.2.3.tgz`
  - repo GitHub: `owner/repo` หรือ `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- metadata ถูกตรวจพบอัตโนมัติจาก `package.json`, `openclaw.plugin.json`, และ
  marker ของ bundle OpenClaw จริง เช่น `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json`, และ `.cursor-plugin/plugin.json`.
- ซอร์ส `.tgz` จะถือเป็น ClawPack. CLI อัปโหลดไบต์ npm-pack ที่ตรงเป๊ะ
  และใช้เนื้อหา `package/` ที่แตกออกมาเฉพาะสำหรับการตรวจสอบและ
  การเติม metadata ล่วงหน้า.
- โฟลเดอร์ code-plugin จะถูกแพ็กเป็น tarball npm ของ ClawPack ก่อนอัปโหลด เพื่อให้
  การติดตั้ง OpenClaw ตรวจสอบ artifact ที่ตรงเป๊ะได้. โฟลเดอร์ bundle-plugin ยังคง
  ใช้เส้นทางเผยแพร่แบบไฟล์ที่แตกออกมา.
- สำหรับซอร์ส GitHub, การระบุแหล่งที่มาของซอร์สจะถูกเติมอัตโนมัติจาก repo, commit ที่ resolve แล้ว, ref, และ subpath.
- สำหรับโฟลเดอร์ในเครื่อง, การระบุแหล่งที่มาของซอร์สจะถูกตรวจพบอัตโนมัติจาก git ในเครื่องเมื่อ origin remote ชี้ไปที่ GitHub.
- code plugins ภายนอกต้องประกาศ `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion` อย่างชัดเจน.
  `package.json.version` ระดับบนสุดจะไม่ถูกใช้เป็น fallback สำหรับการตรวจสอบการเผยแพร่.
- `--dry-run` แสดงตัวอย่าง payload การเผยแพร่ที่ resolve แล้วโดยไม่อัปโหลด.
- `--json` ส่งออกเอาต์พุตที่เครื่องอ่านได้สำหรับ CI.
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่ของผู้ใช้หรือองค์กรเมื่อ actor มีสิทธิ์เข้าถึงผู้เผยแพร่.
- `--clawscan-note <text>` เพิ่มบันทึก ClawScan. บันทึกนี้ให้บริบทแก่ ClawScan
  สำหรับพฤติกรรมที่อาจดูผิดปกติ เช่น การเข้าถึงเครือข่าย,
  การเข้าถึง native host, หรือข้อมูลประจำตัวเฉพาะ provider. บันทึกนี้ถูกจัดเก็บใน
  รีลีสที่เผยแพร่แล้ว.
- ชื่อแพ็กเกจแบบมี scope ต้องตรงกับเจ้าของที่เลือก. ดู `docs/publishing.md`.
- แฟล็กเดิม (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ยังคงทำงานเป็น override.
- repo GitHub แบบ private ต้องใช้ `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### โฟลว์ในเครื่องที่แนะนำ

ใช้ `--dry-run` ก่อน เพื่อให้คุณยืนยัน metadata ของแพ็กเกจที่ resolve แล้วและ
การระบุแหล่งที่มาของซอร์สก่อนสร้างรีลีสจริง:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### โฟลว์โฟลเดอร์ในเครื่อง

สำหรับ code plugins, การเผยแพร่จากโฟลเดอร์จะ build และอัปโหลด artifact ของ ClawPack จาก
โฟลเดอร์แพ็กเกจ:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` ขั้นต่ำสำหรับ `--family code-plugin`

code plugins ภายนอกต้องมี metadata ของ OpenClaw จำนวนเล็กน้อยใน
`package.json`. manifest ขั้นต่ำนี้เพียงพอสำหรับการเผยแพร่สำเร็จ:

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

- `package.json.version` คือเวอร์ชันรีลีสของแพ็กเกจคุณ, แต่จะไม่ถูกใช้เป็น
  fallback สำหรับการตรวจสอบความเข้ากันได้/build ของ OpenClaw.
- `openclaw.hostTargets` และ `openclaw.environment` เป็น metadata เพิ่มเติม.
  ClawHub อาจแสดงข้อมูลเหล่านี้เมื่อมีอยู่, แต่ไม่จำเป็นสำหรับการเผยแพร่.
- `openclaw.compat.minGatewayVersion` และ
  `openclaw.build.pluginSdkVersion` เป็นส่วนเพิ่มเติมที่เลือกได้ หากคุณต้องการเผยแพร่
  metadata ความเข้ากันได้ที่ละเอียดขึ้น.
- หากคุณใช้รีลีส CLI `clawhub` ที่เก่ากว่า, ให้อัปเกรดก่อนเผยแพร่ เพื่อให้
  การตรวจสอบ preflight ในเครื่องทำงานก่อนอัปโหลด.

#### GitHub Actions

ClawHub ยังจัดส่ง workflow reusable อย่างเป็นทางการที่
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/2ddaad62cc7852eb8274022ae8a6d7527d169ae8/.github/workflows/package-publish.yml)
สำหรับ repo Plugin.

การตั้งค่า caller โดยทั่วไป:

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

- workflow reusable ตั้งค่า `source` เป็น repo caller โดยค่าเริ่มต้น.
- สำหรับ monorepo, ส่ง `source_path` เพื่อให้ workflow เผยแพร่โฟลเดอร์แพ็กเกจ
  Plugin, ตัวอย่างเช่น `source_path: extensions/codex`.
- pin workflow reusable ไว้กับ tag ที่เสถียรหรือ SHA commit แบบเต็ม. อย่าเผยแพร่รีลีสจาก `@main`.
- `pull_request` ควรใช้ `dry_run: true` เพื่อให้ CI ไม่สร้างผลข้างเคียง.
- การเผยแพร่จริงควรจำกัดไว้กับเหตุการณ์ที่เชื่อถือได้ เช่น `workflow_dispatch` หรือการ push tag.
- การเผยแพร่ที่เชื่อถือได้โดยไม่มี secret ใช้ได้เฉพาะบน `workflow_dispatch`; การ push tag ยังคงต้องใช้ `clawhub_token`.
- ให้ `clawhub_token` พร้อมใช้งานสำหรับการเผยแพร่ครั้งแรก, แพ็กเกจที่ไม่น่าเชื่อถือ, หรือการเผยแพร่ฉุกเฉิน.
- workflow อัปโหลดผลลัพธ์ JSON เป็น artifact และเปิดเผยเป็นเอาต์พุตของ workflow.

### `sync`

- สแกนหาโฟลเดอร์ skill ในเครื่อง และเผยแพร่รายการใหม่/ที่เปลี่ยนแปลง.
- root อาจเป็นโฟลเดอร์ใดก็ได้: ไดเรกทอรี skills หรือโฟลเดอร์ skill เดี่ยวที่มี `SKILL.md`.
- เพิ่ม root ของ skill Clawdbot อัตโนมัติเมื่อมี `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (agent หลัก)
  - `routing.agents.*.workspace/skills` (ต่อ agent)
  - `~/.clawdbot/skills` (ใช้ร่วมกัน)
  - `skills.load.extraDirs` (แพ็กที่ใช้ร่วมกัน)
- เคารพ `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` และ `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- แฟล็ก:
  - `--root <dir...>` root สแกนเพิ่มเติม
  - `--all` อัปโหลดโดยไม่ถาม
  - `--dry-run` แสดงเฉพาะแผน
  - `--bump patch|minor|major` (ค่าเริ่มต้น: patch)
  - `--changelog <text>` (ไม่โต้ตอบ)
  - `--tags a,b,c` (ค่าเริ่มต้น: latest)
  - `--concurrency <n>` (ค่าเริ่มต้น: 4)

Telemetry:

- ส่งระหว่าง `sync` เมื่อเข้าสู่ระบบอยู่, เว้นแต่ `CLAWHUB_DISABLE_TELEMETRY=1` (เดิม `CLAWDHUB_DISABLE_TELEMETRY=1`).
- รายละเอียด: `docs/telemetry.md`.
