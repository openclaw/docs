---
read_when:
    - การใช้ ClawHub CLI
    - การดีบักการติดตั้ง การอัปเดต การเผยแพร่ หรือการซิงค์
summary: 'เอกสารอ้างอิง CLI: คำสั่ง แฟล็ก การกำหนดค่า lockfile และพฤติกรรมการซิงค์'
x-i18n:
    generated_at: "2026-05-12T12:48:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 541fb8367e70fab6aaa9fd622a0c2753170d7cd2afa5e4e02681d606bb45ea8c
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

- `--workdir <dir>`: ไดเรกทอรีทำงาน (ค่าเริ่มต้น: cwd; ถอยกลับไปใช้พื้นที่ทำงาน Clawdbot หากกำหนดค่าไว้)
- `--dir <dir>`: ไดเรกทอรีติดตั้งภายใต้ workdir (ค่าเริ่มต้น: `skills`)
- `--site <url>`: URL ฐานสำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `https://clawhub.ai`)
- `--registry <url>`: URL ฐานของ API (ค่าเริ่มต้น: ค้นพบอัตโนมัติ มิฉะนั้นใช้ `https://clawhub.ai`)
- `--no-input`: ปิดใช้พรอมต์

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

เมื่อตั้งค่าตัวแปรใด ๆ เหล่านี้ CLI จะส่งคำขอขาออกผ่าน
พร็อกซีที่ระบุ `HTTPS_PROXY` ใช้สำหรับคำขอ HTTPS, `HTTP_PROXY`
ใช้สำหรับ HTTP ธรรมดา `NO_PROXY` / `no_proxy` จะถูกเคารพเพื่อข้ามพร็อกซีสำหรับ
โฮสต์หรือโดเมนที่ระบุ

สิ่งนี้จำเป็นบนระบบที่การเชื่อมต่อขาออกโดยตรงถูกบล็อก
(เช่น คอนเทนเนอร์ Docker, Hetzner VPS ที่ใช้อินเทอร์เน็ตผ่านพร็อกซีเท่านั้น, ไฟร์วอลล์องค์กร)

ตัวอย่าง:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

เมื่อไม่ได้ตั้งค่าตัวแปรพร็อกซีใด ๆ พฤติกรรมจะไม่เปลี่ยนแปลง (เชื่อมต่อโดยตรง)

## ไฟล์กำหนดค่า

จัดเก็บโทเค็น API ของคุณ + URL รีจิสทรีที่แคชไว้

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` หรือ `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- การถอยกลับแบบเดิม: หาก `clawhub/config.json` ยังไม่มีอยู่ แต่มี `clawdhub/config.json` อยู่ CLI จะใช้พาธเดิมซ้ำ
- เขียนทับ: `CLAWHUB_CONFIG_PATH` (เดิม `CLAWDHUB_CONFIG_PATH`)

## คำสั่ง

### `login` / `auth login`

- ค่าเริ่มต้น: เปิดเบราว์เซอร์ไปยัง `<site>/cli/auth` และดำเนินการให้เสร็จผ่านคอลแบ็ก loopback
- แบบ Headless: `clawhub login --token clh_...`
- แบบโต้ตอบระยะไกล/headless: `clawhub login --device` พิมพ์รหัสและรอขณะที่คุณอนุญาตที่ `<site>/cli/device`

### `whoami`

- ตรวจสอบโทเค็นที่จัดเก็บไว้ผ่าน `/api/v1/whoami`

### `star <slug>` / `unstar <slug>`

- เพิ่ม/ลบ Skill จากรายการไฮไลต์ของคุณ
- เรียก `POST /api/v1/stars/<slug>` และ `DELETE /api/v1/stars/<slug>`
- `--yes` ข้ามการยืนยัน

### `search <query...>`

- เรียก `/api/v1/search?q=...`
- การค้นหาจะให้ความสำคัญกับการจับคู่โทเค็น slug/ชื่อแบบตรงกันก่อนความนิยมจากการดาวน์โหลด โทเค็น slug แบบเดี่ยว เช่น `map` จะจับคู่กับ `personal-map` ได้แรงกว่าข้อความย่อยภายใน `amap`
- ยอดดาวน์โหลดเป็นเพียงปัจจัยความนิยมขนาดเล็ก ไม่ใช่การรับประกันว่าจะได้อันดับบนสุด
- หาก Skill ควรปรากฏแต่ไม่ปรากฏ ให้รัน `clawhub inspect <slug>` ขณะเข้าสู่ระบบเพื่อตรวจสอบข้อมูลวินิจฉัยการกลั่นกรองที่เจ้าของมองเห็นได้ ก่อนเปลี่ยนชื่อเมตาดาตา

### `explore`

- แสดงรายการ Skills ใหม่ล่าสุดผ่าน `/api/v1/skills?limit=...&sort=createdAt` (เรียงตาม `createdAt` จากใหม่ไปเก่า)
- แฟล็ก:
  - `--limit <n>` (1-200, ค่าเริ่มต้น: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (ค่าเริ่มต้น: newest)
  - `--json` (เอาต์พุตที่เครื่องอ่านได้)
- เอาต์พุต: `<slug>  v<version>  <age>  <summary>` (สรุปถูกตัดให้เหลือ 50 อักขระ)

### `inspect <slug>`

- ดึงเมตาดาตา Skill และไฟล์เวอร์ชันโดยไม่ติดตั้ง
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: latest)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-200)
- `--files`: แสดงรายการไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (เฉพาะไฟล์ข้อความ; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `install <slug>`

- แก้ค่าเวอร์ชันล่าสุดผ่าน `/api/v1/skills/<slug>`
- ดาวน์โหลด zip ผ่าน `/api/v1/download`
- แตกไฟล์ไปยัง `<workdir>/<dir>/<slug>`
- ปฏิเสธการเขียนทับ Skills ที่ปักหมุดไว้ ให้รัน `clawhub unpin <slug>` ก่อน
- เขียน:
  - `<workdir>/.clawhub/lock.json` (เดิม `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (เดิม `.clawdhub`)

### `uninstall <slug>`

- ลบ `<workdir>/<dir>/<slug>` และลบรายการใน lockfile
- แบบโต้ตอบ: ขอการยืนยัน
- แบบไม่โต้ตอบ (`--no-input`): ต้องใช้ `--yes`

### `list`

- อ่าน `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)
- แสดง `pinned` ถัดจากสกิลที่ถูกตรึงด้วย `clawhub pin` รวมถึงเหตุผลเสริม หากมี

### `pin <slug>`

- ทำเครื่องหมายสกิลที่ติดตั้งแล้วว่า pinned ใน lockfile
- `--reason <text>` บันทึกเหตุผลที่ตรึงสกิลไว้
- สกิลที่ pinned จะถูกข้ามโดย `update --all` และถูกปฏิเสธโดย `update <slug>` โดยตรง
- สกิลที่ pinned จะปฏิเสธ `install --force` ด้วย เพื่อไม่ให้ไบต์ในเครื่องถูกแทนที่โดยไม่ตั้งใจ

### `unpin <slug>`

- ลบ pin ใน lockfile ออกจากสกิลที่ติดตั้งแล้ว เพื่อให้การอัปเดตในอนาคตแก้ไขได้

### `update [slug]` / `update --all`

- คำนวณ fingerprint จากไฟล์ในเครื่อง
- หาก fingerprint ตรงกับเวอร์ชันที่รู้จัก: ไม่แสดงพรอมป์
- หาก fingerprint ไม่ตรงกัน:
  - ปฏิเสธตามค่าเริ่มต้น
  - เขียนทับด้วย `--force` (หรือพรอมป์ หากเป็นแบบโต้ตอบ)
- สกิลที่ pinned จะไม่ถูกอัปเดตโดย `--force`
- `update <slug>` ล้มเหลวทันทีสำหรับ slug ที่ pinned และบอกให้คุณรัน `clawhub unpin <slug>` ก่อน
- `update --all` ข้าม slug ที่ pinned และพิมพ์สรุปสิ่งที่ยังคงถูกตรึงไว้

### `skill publish <path>`

- เผยแพร่ผ่าน `POST /api/v1/skills` (multipart)
- ต้องใช้ semver: `--version 1.2.3`
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่ขององค์กร/ผู้ใช้เมื่อ
  actor มีสิทธิ์เข้าถึงผู้เผยแพร่
- `--migrate-owner` ย้ายสกิลที่มีอยู่ไปยัง `--owner` พร้อมกับเผยแพร่
  เวอร์ชันใหม่ ต้องมีสิทธิ์ admin/owner บนผู้เผยแพร่ทั้งสองราย
- อธิบายพฤติกรรมของเจ้าของและการรีวิวไว้ใน `docs/publishing.md`
- การเผยแพร่สกิลหมายความว่าสกิลนั้นถูกปล่อยภายใต้ `MIT-0` บน ClawHub
- สกิลที่เผยแพร่แล้วใช้งาน แก้ไข และแจกจ่ายต่อได้ฟรีโดยไม่ต้องให้เครดิต
- ClawHub ไม่รองรับสกิลแบบชำระเงินหรือการตั้งราคาต่อสกิล
- `--clawscan-note <text>` เพิ่มบันทึก ClawScan บันทึกนี้ให้บริบทแก่ ClawScan
  สำหรับพฤติกรรมที่อาจดูผิดปกติ เช่น การเข้าถึงเครือข่าย
  การเข้าถึง native host หรือข้อมูลรับรองเฉพาะผู้ให้บริการ บันทึกนี้จะถูกเก็บไว้บน
  เวอร์ชันที่เผยแพร่
- alias แบบ legacy: `publish <path>`

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- ลบสกิลแบบ soft-delete (เจ้าของ ผู้ดูแล หรือ admin)
- เรียก `DELETE /api/v1/skills/{slug}`
- การ soft delete ที่เริ่มโดยเจ้าของจะสงวน slug ไว้ 30 วัน; คำสั่งจะพิมพ์เวลาหมดอายุ
- `--reason <text>` บันทึกหมายเหตุการดูแลบนสกิลและ audit log
- `--note <text>` เป็น alias ของ `--reason`
- `--yes` ข้ามการยืนยัน

### `undelete <slug>`

- กู้คืนสกิลที่ถูกซ่อนไว้ (เจ้าของ ผู้ดูแล หรือ admin)
- เรียก `POST /api/v1/skills/{slug}/undelete`
- `--reason <text>` บันทึกหมายเหตุการดูแลบนสกิลและ audit log
- `--note <text>` เป็น alias ของ `--reason`
- `--yes` ข้ามการยืนยัน

### `hide <slug>`

- ซ่อนสกิล (เจ้าของ ผู้ดูแล หรือ admin)
- Alias ของ `delete`

### `unhide <slug>`

- เลิกซ่อนสกิล (เจ้าของ ผู้ดูแล หรือ admin)
- Alias ของ `undelete`

### `skill rename <slug> <new-slug>`

- เปลี่ยนชื่อสกิลที่เป็นเจ้าของและเก็บ slug เดิมไว้เป็น redirect alias
- เรียก `POST /api/v1/skills/{slug}/rename`
- `--yes` ข้ามการยืนยัน

### `skill merge <source-slug> <target-slug>`

- รวมสกิลที่เป็นเจ้าของหนึ่งรายการเข้ากับสกิลที่เป็นเจ้าของอีกรายการ
- source slug จะหยุดแสดงในรายการสาธารณะและกลายเป็น redirect alias ไปยังเป้าหมาย
- เรียก `POST /api/v1/skills/{sourceSlug}/merge`
- `--yes` ข้ามการยืนยัน

### `transfer`

- เวิร์กโฟลว์การโอนความเป็นเจ้าของ
- การโอนไปยัง handle ผู้ใช้จะสร้างคำขอที่รอดำเนินการให้ผู้รับยอมรับ
- การโอนไปยัง handle องค์กร/ผู้เผยแพร่จะมีผลทันทีเฉพาะเมื่อ actor มี
  สิทธิ์ admin ทั้งในเจ้าของปัจจุบันและผู้เผยแพร่ปลายทาง
- คำสั่งย่อย:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- Endpoint:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- เรียกดูหรือค้นหาแค็ตตาล็อกแพ็กเกจแบบรวมผ่าน `GET /api/v1/packages` และ `GET /api/v1/packages/search`
- ใช้คำสั่งนี้สำหรับ plugins และรายการตระกูลแพ็กเกจอื่น ๆ; `search` ระดับบนสุดยังคงเป็นพื้นผิวค้นหาสกิล
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

- ดึง metadata ของแพ็กเกจโดยไม่ติดตั้ง
- ใช้คำสั่งนี้สำหรับ metadata ของ plugin, ความเข้ากันได้, การยืนยัน, แหล่งที่มา และการตรวจสอบเวอร์ชัน/ไฟล์
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: latest)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติด tag (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-100)
- `--files`: แสดงไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (ไฟล์ข้อความเท่านั้น; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `package download <name>`

- resolve เวอร์ชันแพ็กเกจผ่าน
  `GET /api/v1/packages/{name}/versions/{version}/artifact`
- ดาวน์โหลด artifact จาก `downloadUrl` ของ resolver
- ตรวจสอบ SHA-256 ของ ClawHub สำหรับ artifact ทั้งหมด
- สำหรับ artifact ClawPack แบบ npm-pack จะตรวจสอบ npm `sha512` integrity,
  npm shasum และชื่อ/เวอร์ชันใน `package.json` ของ tarball ด้วย
- เวอร์ชัน ZIP แบบ legacy ดาวน์โหลดผ่านเส้นทาง ZIP แบบ legacy
- แฟล็ก:
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

- คำนวณ SHA-256 ของ ClawHub, npm `sha512` integrity และ npm shasum สำหรับ
  artifact ในเครื่อง
- เมื่อใช้ `--package` จะ resolve metadata ที่คาดหวังจาก ClawHub และเปรียบเทียบ
  ไฟล์ในเครื่องกับ metadata ของ artifact ที่เผยแพร่แล้ว
- เมื่อใช้แฟล็ก digest โดยตรง จะตรวจสอบโดยไม่ lookup เครือข่าย
- แฟล็ก:
  - `--package <name>`: ชื่อแพ็กเกจสำหรับ resolve metadata ของ artifact ที่คาดหวัง
  - `--version <version>` หรือ `--tag <tag>`: เวอร์ชันแพ็กเกจที่คาดหวัง
  - `--sha256 <hex>`: SHA-256 ของ ClawHub ที่คาดหวัง
  - `--npm-integrity <sri>`: npm integrity ที่คาดหวัง
  - `--npm-shasum <sha1>`: npm shasum ที่คาดหวัง
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- ลบแบบ soft-delete สำหรับแพ็กเกจและ release ทั้งหมด
- ต้องเป็นเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลผู้เผยแพร่ขององค์กร, ผู้ดูแลแพลตฟอร์ม,
  หรือผู้ดูแลระบบแพลตฟอร์ม
- แฟล็ก:
  - `--yes`: ข้ามการยืนยัน
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- กู้คืนแพ็กเกจและ release ที่ถูก soft-delete
- ต้องเป็นเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลผู้เผยแพร่ขององค์กร, ผู้ดูแลแพลตฟอร์ม,
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
  ยกเว้นดำเนินการโดยผู้ดูแลระบบแพลตฟอร์ม
- ชื่อแพ็กเกจแบบ scoped ต้องโอนไปยังเจ้าของ scope ที่ตรงกัน
- เรียก `POST /api/v1/packages/{name}/transfer`
- แฟล็ก:
  - `--to <owner>`: handle ของผู้เผยแพร่ปลายทาง
  - `--reason <text>`: เหตุผลการตรวจสอบย้อนหลังแบบไม่บังคับ
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- คำสั่งที่ต้องยืนยันตัวตนสำหรับรายงานแพ็กเกจต่อผู้ดูแล
- เรียก `POST /api/v1/packages/{name}/report`
- รายงานอยู่ในระดับแพ็กเกจ อาจผูกกับเวอร์ชันได้ และจะปรากฏ
  ให้ผู้ดูแลตรวจสอบ
- รายงานจะไม่ซ่อนแพ็กเกจอัตโนมัติหรือบล็อกการดาวน์โหลดด้วยตัวเอง
- แฟล็ก:
  - `--version <version>`: เวอร์ชันแพ็กเกจแบบไม่บังคับที่จะแนบกับรายงาน
  - `--reason <text>`: เหตุผลรายงานที่จำเป็นต้องระบุ
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- คำสั่งสำหรับเจ้าของเพื่อตรวจสอบการมองเห็นด้านการดูแลแพ็กเกจ
- เรียก `GET /api/v1/packages/{name}/moderation`
- แสดงสถานะการสแกนแพ็กเกจปัจจุบัน จำนวนรายงานที่เปิดอยู่ สถานะการดูแลแบบ manual
  ของ release ล่าสุด สถานะการบล็อกดาวน์โหลด และเหตุผลการดูแล
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- ตรวจสอบว่าแพ็กเกจพร้อมสำหรับการใช้งานโดย OpenClaw ในอนาคตหรือไม่
- เรียก `GET /api/v1/packages/{name}/readiness`
- รายงานตัวบล็อกสำหรับสถานะทางการ ความพร้อมใช้งานของ ClawPack digest ของอาร์ติแฟกต์
  แหล่งที่มาของซอร์ส ความเข้ากันได้กับ OpenClaw เป้าหมายโฮสต์ metadata ของสภาพแวดล้อม
  และสถานะการสแกน
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- แสดงสถานะการย้ายข้อมูลเชิงผู้ปฏิบัติการสำหรับแพ็กเกจที่อาจแทนที่
  Plugin ของ OpenClaw ที่ bundled มา
- เรียก endpoint readiness ที่คำนวณเดียวกับ `package readiness` แต่พิมพ์
  สถานะที่เน้นการย้ายข้อมูล เวอร์ชันล่าสุด สถานะแพ็กเกจทางการ การตรวจสอบ และ
  ตัวบล็อก
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- เผยแพร่ Plugin แบบโค้ดหรือ Plugin แบบบันเดิลผ่าน `POST /api/v1/packages`
- `<source>` รับค่า:
  - พาธโฟลเดอร์ในเครื่อง: `./my-plugin`
  - tarball ของ npm-pack แบบ ClawPack ในเครื่อง: `./my-plugin-1.2.3.tgz`
  - repo GitHub: `owner/repo` หรือ `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- ตรวจจับ metadata อัตโนมัติจาก `package.json`, `openclaw.plugin.json` และ
  marker ของบันเดิล OpenClaw จริง เช่น `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` และ `.cursor-plugin/plugin.json`
- แหล่งที่มา `.tgz` จะถือเป็น ClawPack โดย CLI จะอัปโหลด byte ของ npm-pack
  ตรงตามจริง และใช้เนื้อหา `package/` ที่แตกออกมาเฉพาะสำหรับการตรวจสอบและ
  เติม metadata ล่วงหน้าเท่านั้น
- โฟลเดอร์ของ Plugin แบบโค้ดจะถูกแพ็กเป็น tarball ของ npm แบบ ClawPack ก่อนอัปโหลด เพื่อให้
  การติดตั้ง OpenClaw ตรวจสอบอาร์ติแฟกต์ที่ตรงตามจริงได้ โฟลเดอร์ของ Plugin แบบบันเดิลยังคง
  ใช้พาธเผยแพร่แบบไฟล์ที่แตกออกมา
- สำหรับแหล่งที่มาจาก GitHub การระบุแหล่งที่มาจะถูกเติมอัตโนมัติจาก repo, commit ที่ resolve แล้ว, ref และ subpath
- สำหรับโฟลเดอร์ในเครื่อง การระบุแหล่งที่มาจะถูกตรวจจับอัตโนมัติจาก git ในเครื่องเมื่อ origin remote ชี้ไปที่ GitHub
- Plugin แบบโค้ดภายนอกต้องประกาศ `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion` อย่างชัดเจน
  `package.json.version` ระดับบนสุดจะไม่ถูกใช้เป็น fallback สำหรับการตรวจสอบการเผยแพร่
- `--dry-run` แสดงตัวอย่าง payload การเผยแพร่ที่ resolve แล้วโดยไม่อัปโหลด
- `--json` ส่งออกเอาต์พุตที่เครื่องอ่านได้สำหรับ CI
- `--owner <handle>` เผยแพร่ภายใต้ handle ของผู้เผยแพร่แบบผู้ใช้หรือองค์กรเมื่อ actor มีสิทธิ์เข้าถึงผู้เผยแพร่
- `--clawscan-note <text>` เพิ่มหมายเหตุ ClawScan หมายเหตุนี้ให้บริบทแก่ ClawScan
  สำหรับพฤติกรรมที่อาจดูผิดปกติ เช่น การเข้าถึงเครือข่าย
  การเข้าถึงโฮสต์ native หรือ credential เฉพาะ provider หมายเหตุจะถูกจัดเก็บไว้บน
  release ที่เผยแพร่
- ชื่อแพ็กเกจแบบ scoped ต้องตรงกับเจ้าของที่เลือก ดู `docs/publishing.md`
- แฟล็กที่มีอยู่ (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ยังคงใช้เป็น override ได้
- repo GitHub แบบ private ต้องใช้ `GITHUB_TOKEN`

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### ขั้นตอนในเครื่องที่แนะนำ

ใช้ `--dry-run` ก่อนเพื่อให้คุณยืนยัน metadata ของแพ็กเกจที่ resolve แล้วและ
การระบุแหล่งที่มาก่อนสร้าง release จริง:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### ขั้นตอนโฟลเดอร์ในเครื่อง

สำหรับ Plugin แบบโค้ด การเผยแพร่โฟลเดอร์จะสร้างและอัปโหลดอาร์ติแฟกต์ ClawPack จาก
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
- `openclaw.hostTargets` และ `openclaw.environment` เป็น metadata แบบไม่บังคับ
  ClawHub อาจแสดงค่าเหล่านี้เมื่อมีอยู่ แต่ไม่จำเป็นสำหรับการเผยแพร่
- `openclaw.compat.minGatewayVersion` และ
  `openclaw.build.pluginSdkVersion` เป็นส่วนเสริมแบบไม่บังคับหากคุณต้องการเผยแพร่
  metadata ความเข้ากันได้ที่ละเอียดขึ้น
- หากคุณใช้ CLI `clawhub` release เก่ากว่า ให้อัปเกรดก่อนเผยแพร่เพื่อให้
  การตรวจสอบ preflight ในเครื่องทำงานก่อนอัปโหลด

#### GitHub Actions

ClawHub ยังมาพร้อม workflow แบบ reusable ทางการที่
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/be77f0626d9e4b52c465670ba411882be1ac3a2d/.github/workflows/package-publish.yml)
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

- workflow แบบ reusable ตั้งค่าเริ่มต้นของ `source` เป็น repo ของ caller
- สำหรับ monorepo ให้ส่ง `source_path` เพื่อให้ workflow เผยแพร่โฟลเดอร์แพ็กเกจ
  Plugin เช่น `source_path: extensions/codex`
- pin workflow แบบ reusable กับแท็กเสถียรหรือ commit SHA แบบเต็ม อย่ารันการเผยแพร่ release จาก `@main`
- `pull_request` ควรใช้ `dry_run: true` เพื่อให้ CI ไม่สร้างผลข้างเคียง
- การเผยแพร่จริงควรถูกจำกัดไว้ที่ event ที่เชื่อถือได้ เช่น `workflow_dispatch` หรือการ push tag
- trusted publishing ที่ไม่มี secret ใช้ได้เฉพาะบน `workflow_dispatch`; การ push tag ยังคงต้องใช้ `clawhub_token`
- เก็บ `clawhub_token` ให้พร้อมสำหรับการเผยแพร่ครั้งแรก แพ็กเกจที่ไม่น่าเชื่อถือ หรือการเผยแพร่แบบ break-glass
- workflow อัปโหลดผลลัพธ์ JSON เป็นอาร์ติแฟกต์และเปิดเผยเป็นเอาต์พุตของ workflow

### `sync`

- สแกนหาโฟลเดอร์ Skills ในเครื่องและเผยแพร่รายการใหม่/ที่เปลี่ยนแปลง
- root เป็นโฟลเดอร์ใดก็ได้: ไดเรกทอรี skills หรือโฟลเดอร์ skill เดียวที่มี `SKILL.md`
- เพิ่ม root ของ skill Clawdbot อัตโนมัติเมื่อมี `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (agent หลัก)
  - `routing.agents.*.workspace/skills` (ต่อ agent)
  - `~/.clawdbot/skills` (ใช้ร่วมกัน)
  - `skills.load.extraDirs` (pack ที่ใช้ร่วมกัน)
- เคารพ `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` และ `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`
- แฟล็ก:
  - `--root <dir...>` root การสแกนเพิ่มเติม
  - `--all` อัปโหลดโดยไม่ถาม
  - `--dry-run` แสดงเฉพาะแผน
  - `--bump patch|minor|major` (ค่าเริ่มต้น: patch)
  - `--changelog <text>` (ไม่โต้ตอบ)
  - `--tags a,b,c` (ค่าเริ่มต้น: latest)
  - `--concurrency <n>` (ค่าเริ่มต้น: 4)

Telemetry:

- ส่งระหว่าง `sync` เมื่อเข้าสู่ระบบแล้ว เว้นแต่ `CLAWHUB_DISABLE_TELEMETRY=1` (เดิม `CLAWDHUB_DISABLE_TELEMETRY=1`)
- รายละเอียด: `docs/telemetry.md`
