---
read_when:
    - การใช้ ClawHub CLI
    - การแก้ไขปัญหาการติดตั้ง การอัปเดต การเผยแพร่ หรือการซิงค์
summary: 'ข้อมูลอ้างอิง CLI: คำสั่ง แฟล็ก การกำหนดค่า ไฟล์ล็อก พฤติกรรมการซิงค์'
x-i18n:
    generated_at: "2026-05-11T20:23:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b07c0a4cf2896ac8ffbaf9d65b913523a565a7030c9c255c0d27e0af7ad28b4
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

แพ็กเกจ CLI: `clawhub`, bin: `clawhub`.

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

- `--workdir <dir>`: ไดเรกทอรีทำงาน (ค่าเริ่มต้น: cwd; ย้อนกลับไปใช้เวิร์กสเปซ Clawdbot หากกำหนดค่าไว้)
- `--dir <dir>`: ไดเรกทอรีติดตั้งภายใต้ workdir (ค่าเริ่มต้น: `skills`)
- `--site <url>`: URL ฐานสำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `https://clawhub.ai`)
- `--registry <url>`: URL ฐานของ API (ค่าเริ่มต้น: ค้นพบอัตโนมัติ มิฉะนั้นใช้ `https://clawhub.ai`)
- `--no-input`: ปิดใช้พรอมป์

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

เมื่อมีการตั้งค่าตัวแปรใด ๆ เหล่านี้ CLI จะส่งคำขอขาออกผ่าน
พร็อกซีที่ระบุ ใช้ `HTTPS_PROXY` สำหรับคำขอ HTTPS และใช้ `HTTP_PROXY`
สำหรับ HTTP แบบธรรมดา เคารพ `NO_PROXY` / `no_proxy` เพื่อข้ามพร็อกซีสำหรับ
โฮสต์หรือโดเมนเฉพาะ

สิ่งนี้จำเป็นบนระบบที่การเชื่อมต่อขาออกโดยตรงถูกบล็อก
(เช่น คอนเทนเนอร์ Docker, Hetzner VPS ที่ใช้อินเทอร์เน็ตผ่านพร็อกซีเท่านั้น, ไฟร์วอลล์องค์กร)

ตัวอย่าง:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

เมื่อไม่ได้ตั้งค่าตัวแปรพร็อกซี ลักษณะการทำงานจะไม่เปลี่ยนแปลง (เชื่อมต่อโดยตรง)

## ไฟล์การกำหนดค่า

จัดเก็บโทเค็น API ของคุณ + URL รีจิสทรีที่แคชไว้

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` หรือ `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- ทางเลือกสำรองเดิม: หาก `clawhub/config.json` ยังไม่มีอยู่ แต่ `clawdhub/config.json` มีอยู่ CLI จะใช้พาธเดิมซ้ำ
- override: `CLAWHUB_CONFIG_PATH` (เดิม `CLAWDHUB_CONFIG_PATH`)

## คำสั่ง

### `login` / `auth login`

- ค่าเริ่มต้น: เปิดเบราว์เซอร์ไปที่ `<site>/cli/auth` และดำเนินการให้เสร็จผ่าน callback แบบ loopback
- Headless: `clawhub login --token clh_...`
- รีโมต/headless แบบโต้ตอบ: `clawhub login --device` พิมพ์รหัสและรอขณะที่คุณอนุญาตที่ `<site>/cli/device`

### `whoami`

- ตรวจสอบโทเค็นที่จัดเก็บไว้ผ่าน `/api/v1/whoami`

### `star <slug>` / `unstar <slug>`

- เพิ่ม/ลบ skill จากไฮไลต์ของคุณ
- เรียก `POST /api/v1/stars/<slug>` และ `DELETE /api/v1/stars/<slug>`
- `--yes` ข้ามการยืนยัน

### `search <query...>`

- เรียก `/api/v1/search?q=...`
- การค้นหาให้ความสำคัญกับการจับคู่โทเค็น slug/ชื่อแบบตรงตัวก่อนความนิยมจากการดาวน์โหลด โทเค็น slug แบบเดี่ยว เช่น `map` จะจับคู่กับ `personal-map` ได้แรงกว่าสตริงย่อยภายใน `amap`
- จำนวนดาวน์โหลดเป็นเพียงตัวตั้งต้นด้านความนิยมเล็กน้อย ไม่ใช่การรับประกันว่าจะอยู่ในอันดับสูงสุด
- หาก skill ควรปรากฏแต่ไม่ปรากฏ ให้เรียก `clawhub inspect <slug>` ขณะเข้าสู่ระบบเพื่อตรวจสอบการวินิจฉัยการกลั่นกรองที่เจ้าของมองเห็นได้ ก่อนเปลี่ยนชื่อ metadata

### `explore`

- แสดง Skills ใหม่ล่าสุดผ่าน `/api/v1/skills?limit=...&sort=createdAt` (เรียงตาม `createdAt` จากมากไปน้อย)
- แฟล็ก:
  - `--limit <n>` (1-200, ค่าเริ่มต้น: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (ค่าเริ่มต้น: newest)
  - `--json` (เอาต์พุตที่เครื่องอ่านได้)
- เอาต์พุต: `<slug>  v<version>  <age>  <summary>` (summary ถูกตัดให้เหลือ 50 อักขระ)

### `inspect <slug>`

- ดึง metadata ของ skill และไฟล์เวอร์ชันโดยไม่ติดตั้ง
- `--version <version>`: ตรวจสอบเวอร์ชันเฉพาะ (ค่าเริ่มต้น: latest)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-200)
- `--files`: แสดงไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (เฉพาะไฟล์ข้อความ; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `install <slug>`

- แก้หาเวอร์ชัน latest ผ่าน `/api/v1/skills/<slug>`
- ดาวน์โหลด zip ผ่าน `/api/v1/download`
- แตกไฟล์ลงใน `<workdir>/<dir>/<slug>`
- ปฏิเสธการเขียนทับ Skills ที่ปักหมุดไว้; เรียก `clawhub unpin <slug>` ก่อน
- เขียน:
  - `<workdir>/.clawhub/lock.json` (เดิม `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (เดิม `.clawdhub`)

### `uninstall <slug>`

- ลบ `<workdir>/<dir>/<slug>` และลบรายการใน lockfile
- แบบโต้ตอบ: ขอการยืนยัน
- ไม่โต้ตอบ (`--no-input`): ต้องใช้ `--yes`

### `list`

- อ่าน `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)
- แสดง `pinned` ถัดจากสกิลที่ถูกตรึงด้วย `clawhub pin` รวมถึงเหตุผลที่ระบุได้ถ้ามี

### `pin <slug>`

- ทำเครื่องหมายสกิลที่ติดตั้งแล้วว่า pinned ใน lockfile
- `--reason <text>` บันทึกเหตุผลที่สกิลถูกตรึงไว้
- สกิลที่ pinned จะถูกข้ามโดย `update --all` และถูกปฏิเสธโดย `update <slug>` โดยตรง
- สกิลที่ pinned ยังปฏิเสธ `install --force` ด้วย เพื่อไม่ให้ไบต์ในเครื่องถูกแทนที่โดยไม่ตั้งใจ

### `unpin <slug>`

- ลบ lockfile pin ออกจากสกิลที่ติดตั้งแล้ว เพื่อให้การอัปเดตในอนาคตแก้ไขได้

### `update [slug]` / `update --all`

- คำนวณ fingerprint จากไฟล์ในเครื่อง
- หาก fingerprint ตรงกับเวอร์ชันที่รู้จัก: ไม่ถามยืนยัน
- หาก fingerprint ไม่ตรง:
  - ปฏิเสธตามค่าเริ่มต้น
  - เขียนทับด้วย `--force` (หรือถามยืนยัน หากเป็นโหมด interactive)
- สกิลที่ pinned จะไม่ถูกอัปเดตด้วย `--force`
- `update <slug>` ล้มเหลวอย่างรวดเร็วสำหรับ slug ที่ pinned และบอกให้คุณเรียกใช้ `clawhub unpin <slug>` ก่อน
- `update --all` ข้าม slug ที่ pinned และพิมพ์สรุปว่ารายการใดยังคงถูกตรึงไว้

### `skill publish <path>`

- เผยแพร่ผ่าน `POST /api/v1/skills` (multipart)
- ต้องใช้ semver: `--version 1.2.3`
- `--owner <handle>` เผยแพร่ภายใต้ handle ของผู้เผยแพร่แบบ org/user เมื่อผู้ดำเนินการมีสิทธิ์เข้าถึงผู้เผยแพร่
- `--migrate-owner` ย้ายสกิลที่มีอยู่ไปยัง `--owner` ขณะเผยแพร่เวอร์ชันใหม่ ต้องมีสิทธิ์ admin/owner บนผู้เผยแพร่ทั้งสองฝั่ง
- อธิบายพฤติกรรมของเจ้าของและการรีวิวไว้ใน `docs/publishing.md`
- การเผยแพร่สกิลหมายความว่าสกิลนั้นถูกปล่อยภายใต้ `MIT-0` บน ClawHub
- สกิลที่เผยแพร่แล้วใช้งาน แก้ไข และแจกจ่ายซ้ำได้ฟรีโดยไม่ต้องระบุแหล่งที่มา
- ClawHub ไม่รองรับสกิลแบบชำระเงินหรือการตั้งราคารายสกิล
- alias แบบ legacy: `publish <path>`

### `delete <slug>`

- soft-delete สกิล (เจ้าของ ผู้ดูแล หรือ admin)
- เรียก `DELETE /api/v1/skills/{slug}`
- การ soft delete ที่เริ่มโดยเจ้าของจะสงวน slug ไว้ 30 วัน คำสั่งจะพิมพ์เวลาหมดอายุ
- `--reason <text>` บันทึกหมายเหตุการดูแลบนสกิลและ audit log
- `--note <text>` เป็น alias สำหรับ `--reason`
- `--yes` ข้ามการยืนยัน

### `undelete <slug>`

- กู้คืนสกิลที่ซ่อนไว้ (เจ้าของ ผู้ดูแล หรือ admin)
- เรียก `POST /api/v1/skills/{slug}/undelete`
- `--reason <text>` บันทึกหมายเหตุการดูแลบนสกิลและ audit log
- `--note <text>` เป็น alias สำหรับ `--reason`
- `--yes` ข้ามการยืนยัน

### `hide <slug>`

- ซ่อนสกิล (เจ้าของ ผู้ดูแล หรือ admin)
- alias สำหรับ `delete`

### `unhide <slug>`

- ยกเลิกการซ่อนสกิล (เจ้าของ ผู้ดูแล หรือ admin)
- alias สำหรับ `undelete`

### `skill rename <slug> <new-slug>`

- เปลี่ยนชื่อสกิลที่เป็นเจ้าของและเก็บ slug เดิมไว้เป็น redirect alias
- เรียก `POST /api/v1/skills/{slug}/rename`
- `--yes` ข้ามการยืนยัน

### `skill merge <source-slug> <target-slug>`

- รวมสกิลที่เป็นเจ้าของหนึ่งรายการเข้ากับสกิลที่เป็นเจ้าของอีกรายการ
- slug ต้นทางหยุดแสดงต่อสาธารณะและกลายเป็น redirect alias ไปยังเป้าหมาย
- เรียก `POST /api/v1/skills/{sourceSlug}/merge`
- `--yes` ข้ามการยืนยัน

### `skill rescan <slug>`

- ขอให้สแกนความปลอดภัยซ้ำสำหรับเวอร์ชันสกิลล่าสุดที่เผยแพร่แล้ว
- เจ้าของและ admin ของผู้เผยแพร่สามารถสแกนสกิลของตนเองซ้ำได้จนถึงขีดจำกัดการกู้คืนต่อเวอร์ชัน
- ผู้ดูแลแพลตฟอร์มและ admin สามารถสแกนสกิลใดก็ได้ซ้ำ และไม่ถูกบล็อกโดยขีดจำกัดการกู้คืนของเจ้าของ แม้ว่าจะเรียกใช้การสแกนซ้ำได้ครั้งละหนึ่งรายการต่อเวอร์ชันเท่านั้น
- เรียก `POST /api/v1/skills/{slug}/rescan`
- แฟล็ก:
  - `--yes`: ข้ามการยืนยัน
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub skill rescan suspicious-skill --yes
```

### `transfer`

- เวิร์กโฟลว์การโอนความเป็นเจ้าของ
- การโอนไปยัง handle ของผู้ใช้จะสร้างคำขอที่รอดำเนินการเพื่อให้ผู้รับยอมรับ
- การโอนไปยัง handle ของ org/ผู้เผยแพร่จะมีผลทันทีเฉพาะเมื่อผู้ดำเนินการมีสิทธิ์ admin ทั้งในเจ้าของปัจจุบันและผู้เผยแพร่ปลายทาง
- คำสั่งย่อย:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- endpoint:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- เรียกดูหรือค้นหาแค็ตตาล็อกแพ็กเกจรวมผ่าน `GET /api/v1/packages` และ `GET /api/v1/packages/search`
- ใช้คำสั่งนี้สำหรับ Plugin และรายการตระกูลแพ็กเกจอื่นๆ; `search` ระดับบนสุดยังคงเป็นพื้นที่ค้นหาสกิล
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
- ใช้คำสั่งนี้สำหรับ metadata ของ Plugin, compatibility, verification, source และการตรวจสอบเวอร์ชัน/ไฟล์
- `--version <version>`: ตรวจสอบเวอร์ชันเฉพาะ (ค่าเริ่มต้น: latest)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็กไว้ (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-100)
- `--files`: แสดงรายการไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (ไฟล์ข้อความเท่านั้น; ขีดจำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `package download <name>`

- resolve เวอร์ชันแพ็กเกจผ่าน
  `GET /api/v1/packages/{name}/versions/{version}/artifact`
- ดาวน์โหลด artifact จาก `downloadUrl` ของ resolver
- ตรวจสอบ ClawHub SHA-256 สำหรับ artifact ทั้งหมด
- สำหรับ artifact แบบ ClawPack npm-pack ยังตรวจสอบ npm `sha512` integrity, npm shasum และชื่อ/เวอร์ชันใน `package.json` ของ tarball ด้วย
- เวอร์ชัน ZIP แบบ legacy ดาวน์โหลดผ่านเส้นทาง ZIP แบบ legacy
- แฟล็ก:
  - `--version <version>`: ดาวน์โหลดเวอร์ชันเฉพาะ
  - `--tag <tag>`: ดาวน์โหลดเวอร์ชันที่ติดแท็กไว้ (ค่าเริ่มต้น: `latest`)
  - `-o, --output <path>`: ไฟล์หรือไดเรกทอรีเอาต์พุต
  - `--force`: เขียนทับไฟล์เอาต์พุตที่มีอยู่
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- คำนวณ ClawHub SHA-256, npm `sha512` integrity และ npm shasum สำหรับ artifact ในเครื่อง
- เมื่อใช้ `--package` จะ resolve metadata ที่คาดไว้จาก ClawHub และเปรียบเทียบไฟล์ในเครื่องกับ metadata ของ artifact ที่เผยแพร่แล้ว
- เมื่อใช้แฟล็ก digest โดยตรง จะตรวจสอบโดยไม่ต้องค้นหาผ่านเครือข่าย
- แฟล็ก:
  - `--package <name>`: ชื่อแพ็กเกจเพื่อ resolve metadata ของ artifact ที่คาดไว้
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

- ลบแพ็กเกจและรีลีสทั้งหมดแบบ soft-delete
- ต้องเป็นเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลผู้เผยแพร่ขององค์กร, ผู้ดูแลการกลั่นกรองของแพลตฟอร์ม,
  หรือผู้ดูแลแพลตฟอร์ม
- แฟล็ก:
  - `--yes`: ข้ามการยืนยัน
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- กู้คืนแพ็กเกจและรีลีสที่ถูก soft-delete
- ต้องเป็นเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลผู้เผยแพร่ขององค์กร, ผู้ดูแลการกลั่นกรองของแพลตฟอร์ม,
  หรือผู้ดูแลแพลตฟอร์ม
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
- ต้องมีสิทธิ์ผู้ดูแลทั้งในเจ้าของแพ็กเกจปัจจุบันและผู้เผยแพร่ปลายทาง
  เว้นแต่จะดำเนินการโดยผู้ดูแลแพลตฟอร์ม
- ชื่อแพ็กเกจแบบมีขอบเขตต้องโอนไปยังเจ้าของขอบเขตที่ตรงกัน
- เรียก `POST /api/v1/packages/{name}/transfer`
- แฟล็ก:
  - `--to <owner>`: แฮนเดิลผู้เผยแพร่ปลายทาง
  - `--reason <text>`: เหตุผลการตรวจสอบย้อนหลังแบบไม่บังคับ
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package rescan <name>`

- ขอให้สแกนความปลอดภัยซ้ำสำหรับรีลีสแพ็กเกจล่าสุดที่เผยแพร่แล้ว
- เจ้าของและผู้ดูแลผู้เผยแพร่สามารถสแกนแพ็กเกจของตนเองซ้ำได้จนถึงขีดจำกัดการกู้คืน
  ต่อรีลีส
- ผู้ดูแลการกลั่นกรองและผู้ดูแลแพลตฟอร์มสามารถสแกนแพ็กเกจใดก็ได้ซ้ำ และจะไม่ถูกจำกัดโดย
  ขีดจำกัดการกู้คืนของเจ้าของ แม้ว่าจะมีการสแกนซ้ำได้ครั้งละหนึ่งงานต่อรีลีสเท่านั้น
- เรียก `POST /api/v1/packages/{name}/rescan`
- แฟล็ก:
  - `--yes`: ข้ามการยืนยัน
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package rescan @openclaw/example-plugin --yes
```

### `package report`

- คำสั่งที่ต้องยืนยันตัวตนสำหรับรายงานแพ็กเกจต่อผู้ดูแลการกลั่นกรอง
- เรียก `POST /api/v1/packages/{name}/report`
- รายงานอยู่ในระดับแพ็กเกจ อาจผูกกับเวอร์ชันได้ และจะปรากฏ
  ให้ผู้ดูแลการกลั่นกรองตรวจสอบ
- รายงานไม่ได้ซ่อนแพ็กเกจหรือบล็อกการดาวน์โหลดโดยอัตโนมัติด้วยตัวเอง
- แฟล็ก:
  - `--version <version>`: เวอร์ชันแพ็กเกจแบบไม่บังคับที่จะแนบกับรายงาน
  - `--reason <text>`: เหตุผลรายงานที่จำเป็นต้องระบุ
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package appeal`

- คำสั่งสำหรับเจ้าของ/ผู้เผยแพร่เพื่ออุทธรณ์การกลั่นกรองรีลีส
- เรียก `POST /api/v1/packages/{name}/appeal`
- ระบบรับคำอุทธรณ์สำหรับรีลีสที่ถูกกักกัน, ถูกเพิกถอน, น่าสงสัย หรือเป็นอันตราย
- แฟล็ก:
  - `--version <version>`: เวอร์ชันแพ็กเกจที่จำเป็นต้องระบุ
  - `--message <text>`: ข้อความอุทธรณ์ที่จำเป็นต้องระบุ
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package appeal @openclaw/example-plugin --version 1.2.3 --message "linked source release explains the native binary"
```

### `package moderation-status`

- คำสั่งสำหรับเจ้าของเพื่อตรวจสอบการมองเห็นด้านการกลั่นกรองของแพ็กเกจ
- เรียก `GET /api/v1/packages/{name}/moderation`
- แสดงสถานะการสแกนแพ็กเกจปัจจุบัน, จำนวนรายงานที่เปิดอยู่, สถานะการกลั่นกรองด้วยตนเอง
  ของรีลีสล่าสุด, สถานะบล็อกการดาวน์โหลด และเหตุผลการกลั่นกรอง
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- ตรวจสอบว่าแพ็กเกจพร้อมสำหรับการใช้งานโดย OpenClaw ในอนาคตหรือไม่
- เรียก `GET /api/v1/packages/{name}/readiness`
- รายงานตัวบล็อกสำหรับสถานะทางการ, ความพร้อมใช้งานของ ClawPack, ไดเจสต์ของอาร์ติแฟกต์,
  แหล่งที่มาของซอร์ส, ความเข้ากันได้กับ OpenClaw, เป้าหมายโฮสต์, เมตาดาต้าสภาพแวดล้อม,
  และสถานะการสแกน
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- แสดงสถานะการย้ายข้อมูลสำหรับผู้ปฏิบัติงานของแพ็กเกจที่อาจแทนที่
  plugin ของ OpenClaw ที่รวมมาให้
- เรียกเอนด์พอยต์ความพร้อมที่คำนวณแล้วเดียวกับ `package readiness` แต่พิมพ์
  สถานะที่เน้นการย้ายข้อมูล, เวอร์ชันล่าสุด, สถานะแพ็กเกจทางการ, การตรวจสอบ และ
  ตัวบล็อก
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- เผยแพร่ code plugin หรือ bundle plugin ผ่าน `POST /api/v1/packages`
- `<source>` รับค่า:
  - พาธโฟลเดอร์ในเครื่อง: `./my-plugin`
  - ทาร์บอล ClawPack npm-pack ในเครื่อง: `./my-plugin-1.2.3.tgz`
  - รีโป GitHub: `owner/repo` หรือ `owner/repo@ref`
  - URL ของ GitHub: `https://github.com/owner/repo`
- ตรวจจับเมตาดาต้าโดยอัตโนมัติจาก `package.json`, `openclaw.plugin.json` และ
  มาร์กเกอร์บันเดิลจริงของ OpenClaw เช่น `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` และ `.cursor-plugin/plugin.json`
- ซอร์ส `.tgz` จะถูกถือเป็น ClawPack โดย CLI จะอัปโหลดไบต์ npm-pack
  ที่ตรงกันทั้งหมด และใช้เนื้อหา `package/` ที่แตกออกมาเฉพาะสำหรับการตรวจสอบความถูกต้องและ
  การเติมเมตาดาต้าล่วงหน้า
- โฟลเดอร์ code-plugin จะถูกแพ็กเป็นทาร์บอล ClawPack npm ก่อนอัปโหลด เพื่อให้
  การติดตั้ง OpenClaw ตรวจสอบอาร์ติแฟกต์ที่ตรงกันได้ ส่วนโฟลเดอร์ bundle-plugin ยังคง
  ใช้พาธเผยแพร่แบบไฟล์ที่แตกออกมา
- สำหรับซอร์ส GitHub ระบบจะเติมการระบุแหล่งที่มาของซอร์สโดยอัตโนมัติจากรีโป, คอมมิตที่ resolve แล้ว, ref และพาธย่อย
- สำหรับโฟลเดอร์ในเครื่อง ระบบจะตรวจจับการระบุแหล่งที่มาของซอร์สโดยอัตโนมัติจาก git ในเครื่องเมื่อ origin remote ชี้ไปที่ GitHub
- code plugin ภายนอกต้องประกาศ `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion` อย่างชัดเจน
  `package.json.version` ระดับบนสุดจะไม่ถูกใช้เป็น fallback สำหรับการตรวจสอบความถูกต้องตอนเผยแพร่
- `--dry-run` แสดงตัวอย่างเพย์โหลดเผยแพร่ที่ resolve แล้วโดยไม่อัปโหลด
- `--json` ส่งเอาต์พุตที่เครื่องอ่านได้สำหรับ CI
- `--owner <handle>` เผยแพร่ภายใต้แฮนเดิลผู้เผยแพร่ของผู้ใช้หรือองค์กรเมื่อผู้ดำเนินการมีสิทธิ์เข้าถึงผู้เผยแพร่
- ชื่อแพ็กเกจแบบมีขอบเขตต้องตรงกับเจ้าของที่เลือก ดู `docs/publishing.md`
- แฟล็กเดิม (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ยังคงใช้เป็นค่าทับได้
- รีโป GitHub ส่วนตัวต้องใช้ `GITHUB_TOKEN`

#### โฟลว์ในเครื่องที่แนะนำ

ใช้ `--dry-run` ก่อนเพื่อให้คุณยืนยันเมตาดาต้าแพ็กเกจที่ resolve แล้วและ
การระบุแหล่งที่มาของซอร์สได้ก่อนสร้างรีลีสจริง:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### โฟลว์โฟลเดอร์ในเครื่อง

สำหรับ code plugin การเผยแพร่จากโฟลเดอร์จะสร้างและอัปโหลดอาร์ติแฟกต์ ClawPack จาก
โฟลเดอร์แพ็กเกจ:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` ขั้นต่ำสำหรับ `--family code-plugin`

code plugin ภายนอกต้องมีเมตาดาต้า OpenClaw จำนวนเล็กน้อยใน
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

- `package.json.version` คือเวอร์ชันรีลีสแพ็กเกจของคุณ แต่จะไม่ถูกใช้เป็น
  fallback สำหรับการตรวจสอบความเข้ากันได้/บิลด์ของ OpenClaw
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมตาดาต้าแบบไม่บังคับ
  ClawHub อาจแสดงข้อมูลเหล่านี้เมื่อมีอยู่ แต่ไม่จำเป็นสำหรับการเผยแพร่
- `openclaw.compat.minGatewayVersion` และ
  `openclaw.build.pluginSdkVersion` เป็นข้อมูลเสริมแบบไม่บังคับหากคุณต้องการเผยแพร่
  เมตาดาต้าความเข้ากันได้ที่ละเอียดขึ้น
- หากคุณใช้ CLI `clawhub` รีลีสเก่า ให้อัปเกรดก่อนเผยแพร่เพื่อให้
  การตรวจสอบ preflight ในเครื่องทำงานก่อนอัปโหลด

#### GitHub Actions

ClawHub ยังมาพร้อมเวิร์กโฟลว์ที่ใช้ซ้ำได้อย่างเป็นทางการที่
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/8ed84813808a116d30aebe4357bb367b0786bb9c/.github/workflows/package-publish.yml)
สำหรับรีโป plugin

การตั้งค่าฝั่งผู้เรียกโดยทั่วไป:

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

- เวิร์กโฟลว์ที่ใช้ซ้ำได้จะตั้งค่าเริ่มต้นของ `source` เป็นรีโปของผู้เรียก
- สำหรับ monorepo ให้ส่ง `source_path` เพื่อให้เวิร์กโฟลว์เผยแพร่โฟลเดอร์แพ็กเกจ
  plugin เช่น `source_path: extensions/codex`
- ปักหมุดเวิร์กโฟลว์ที่ใช้ซ้ำได้กับแท็กเสถียรหรือ SHA คอมมิตเต็ม อย่าเรียกใช้การเผยแพร่รีลีสจาก `@main`
- `pull_request` ควรใช้ `dry_run: true` เพื่อให้ CI ไม่สร้างผลข้างเคียง
- การเผยแพร่จริงควรจำกัดไว้กับอีเวนต์ที่เชื่อถือได้ เช่น `workflow_dispatch` หรือการ push แท็ก
- การเผยแพร่ที่เชื่อถือได้โดยไม่มี secret ใช้ได้เฉพาะบน `workflow_dispatch`; การ push แท็กยังคงต้องใช้ `clawhub_token`
- เก็บ `clawhub_token` ให้พร้อมใช้งานสำหรับการเผยแพร่ครั้งแรก, แพ็กเกจที่ไม่น่าเชื่อถือ หรือการเผยแพร่แบบ break-glass
- เวิร์กโฟลว์จะอัปโหลดผลลัพธ์ JSON เป็นอาร์ติแฟกต์และเปิดเผยเป็นเอาต์พุตของเวิร์กโฟลว์

### `sync`

- สแกนหาโฟลเดอร์ skill ในเครื่องและเผยแพร่รายการใหม่/ที่เปลี่ยนแปลง
- root อาจเป็นโฟลเดอร์ใดก็ได้: ไดเรกทอรี skills หรือโฟลเดอร์ skill เดี่ยวที่มี `SKILL.md`
- เพิ่ม root ของ skill ของ Clawdbot โดยอัตโนมัติเมื่อมี `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (เอเจนต์หลัก)
  - `routing.agents.*.workspace/skills` (รายเอเจนต์)
  - `~/.clawdbot/skills` (ใช้ร่วมกัน)
  - `skills.load.extraDirs` (แพ็กที่ใช้ร่วมกัน)
- เคารพ `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` และ `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`
- แฟล็ก:
  - `--root <dir...>` root เพิ่มเติมสำหรับสแกน
  - `--all` อัปโหลดโดยไม่ถาม
  - `--dry-run` แสดงเฉพาะแผน
  - `--bump patch|minor|major` (ค่าเริ่มต้น: patch)
  - `--changelog <text>` (ไม่โต้ตอบ)
  - `--tags a,b,c` (ค่าเริ่มต้น: latest)
  - `--concurrency <n>` (ค่าเริ่มต้น: 4)

Telemetry:

- ส่งระหว่าง `sync` เมื่อเข้าสู่ระบบแล้ว เว้นแต่ `CLAWHUB_DISABLE_TELEMETRY=1` (เดิม `CLAWDHUB_DISABLE_TELEMETRY=1`)
- รายละเอียด: `docs/telemetry.md`
