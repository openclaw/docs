---
read_when:
    - การใช้ ClawHub CLI
    - การดีบักการติดตั้ง การอัปเดต การเผยแพร่ หรือการซิงค์
summary: 'ข้อมูลอ้างอิง CLI: คำสั่ง, แฟล็ก, การกำหนดค่า, ไฟล์ล็อก, ลักษณะการทำงานของการซิงค์.'
x-i18n:
    generated_at: "2026-05-12T23:28:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3600e5539372490924ee884c03d2417b80d25aab519d8260897b2268c2f7b46
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

- `--workdir <dir>`: ไดเรกทอรีทำงาน (ค่าเริ่มต้น: cwd; ย้อนกลับไปใช้เวิร์กสเปซ Clawdbot หากมีการกำหนดค่าไว้)
- `--dir <dir>`: ไดเรกทอรีติดตั้งภายใต้ workdir (ค่าเริ่มต้น: `skills`)
- `--site <url>`: URL ฐานสำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `https://clawhub.ai`)
- `--registry <url>`: URL ฐานของ API (ค่าเริ่มต้น: ค้นพบอัตโนมัติ มิฉะนั้นใช้ `https://clawhub.ai`)
- `--no-input`: ปิดใช้พรอมป์

ค่า env ที่เทียบเท่า:

- `CLAWHUB_SITE` (เดิม `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (เดิม `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (เดิม `CLAWDHUB_WORKDIR`)

### HTTP proxy

CLI รองรับตัวแปรสภาพแวดล้อม HTTP proxy มาตรฐานสำหรับระบบที่อยู่หลัง
พร็อกซีขององค์กรหรือเครือข่ายที่ถูกจำกัด:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

เมื่อตั้งค่าตัวแปรเหล่านี้ตัวใดก็ตาม CLI จะส่งคำขอขาออกผ่าน
พร็อกซีที่ระบุ `HTTPS_PROXY` ใช้สำหรับคำขอ HTTPS ส่วน `HTTP_PROXY`
ใช้สำหรับ HTTP ปกติ และรองรับ `NO_PROXY` / `no_proxy` เพื่อข้ามพร็อกซีสำหรับ
โฮสต์หรือโดเมนที่ระบุ

สิ่งนี้จำเป็นในระบบที่บล็อกการเชื่อมต่อขาออกโดยตรง
(เช่น คอนเทนเนอร์ Docker, Hetzner VPS ที่ใช้อินเทอร์เน็ตผ่านพร็อกซีเท่านั้น, ไฟร์วอลล์ขององค์กร)

ตัวอย่าง:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

เมื่อไม่ได้ตั้งค่าตัวแปรพร็อกซีใด ๆ พฤติกรรมจะไม่เปลี่ยนแปลง (เชื่อมต่อโดยตรง)

## ไฟล์การกำหนดค่า

จัดเก็บโทเค็น API ของคุณ + URL registry ที่แคชไว้

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` หรือ `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- การย้อนกลับแบบเดิม: หากยังไม่มี `clawhub/config.json` แต่มี `clawdhub/config.json` อยู่ CLI จะใช้พาธเดิมซ้ำ
- การแทนที่: `CLAWHUB_CONFIG_PATH` (เดิม `CLAWDHUB_CONFIG_PATH`)

## คำสั่ง

### `login` / `auth login`

- ค่าเริ่มต้น: เปิดเบราว์เซอร์ไปที่ `<site>/cli/auth` และดำเนินการให้เสร็จผ่านคอลแบ็ก local loopback
- แบบ headless: `clawhub login --token clh_...`
- แบบรีโมต/headless เชิงโต้ตอบ: `clawhub login --device` พิมพ์รหัสและรอระหว่างที่คุณอนุญาตที่ `<site>/cli/device`

### `whoami`

- ตรวจสอบโทเค็นที่จัดเก็บไว้ผ่าน `/api/v1/whoami`

### `star <slug>` / `unstar <slug>`

- เพิ่ม/ลบ Skills ออกจากรายการไฮไลต์ของคุณ
- เรียก `POST /api/v1/stars/<slug>` และ `DELETE /api/v1/stars/<slug>`
- `--yes` ข้ามการยืนยัน

### `search <query...>`

- เรียก `/api/v1/search?q=...`
- การค้นหาจะให้ความสำคัญกับการจับคู่โทเค็น slug/name แบบตรงตัวก่อนความนิยมในการดาวน์โหลด โทเค็น slug แบบเดี่ยว เช่น `map` จะจับคู่กับ `personal-map` ได้แรงกว่าสตริงย่อยภายใน `amap`
- จำนวนดาวน์โหลดเป็นเพียงค่า prior ด้านความนิยมขนาดเล็ก ไม่ใช่การรับประกันตำแหน่งสูงสุด
- หาก Skills ควรปรากฏแต่ไม่ปรากฏ ให้รัน `clawhub inspect <slug>` ขณะเข้าสู่ระบบเพื่อตรวจสอบการวินิจฉัยการดูแลที่เจ้าของมองเห็นได้ ก่อนเปลี่ยนชื่อ metadata

### `explore`

- แสดงรายการ Skills ใหม่ล่าสุดผ่าน `/api/v1/skills?limit=...&sort=createdAt` (เรียงตาม `createdAt` จากใหม่ไปเก่า)
- แฟล็ก:
  - `--limit <n>` (1-200, ค่าเริ่มต้น: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (ค่าเริ่มต้น: newest)
  - `--json` (เอาต์พุตที่เครื่องอ่านได้)
- เอาต์พุต: `<slug>  v<version>  <age>  <summary>` (ตัด summary ให้เหลือ 50 อักขระ)

### `inspect <slug>`

- ดึงข้อมูล metadata และไฟล์เวอร์ชันของ Skills โดยไม่ติดตั้ง
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: latest)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงรายการประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-200)
- `--files`: แสดงรายการไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (ไฟล์ข้อความเท่านั้น; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `install <slug>`

- หาเวอร์ชันล่าสุดผ่าน `/api/v1/skills/<slug>`
- ดาวน์โหลด zip ผ่าน `/api/v1/download`
- แตกไฟล์ไปยัง `<workdir>/<dir>/<slug>`
- ปฏิเสธการเขียนทับ Skills ที่ปักหมุดไว้; ให้รัน `clawhub unpin <slug>` ก่อน
- เขียน:
  - `<workdir>/.clawhub/lock.json` (เดิม `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (เดิม `.clawdhub`)

### `uninstall <slug>`

- ลบ `<workdir>/<dir>/<slug>` และลบรายการใน lockfile
- แบบโต้ตอบ: ขอการยืนยัน
- แบบไม่โต้ตอบ (`--no-input`): ต้องใช้ `--yes`

### `list`

- อ่าน `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)
- แสดง `pinned` ถัดจาก Skills ที่ถูกตรึงด้วย `clawhub pin` รวมถึงเหตุผลที่ระบุได้หากมี

### `pin <slug>`

- ทำเครื่องหมาย Skill ที่ติดตั้งแล้วว่า pinned ใน lockfile
- `--reason <text>` บันทึกเหตุผลที่ Skill ถูกตรึงไว้
- Skills ที่ pinned จะถูกข้ามโดย `update --all` และถูกปฏิเสธโดย `update <slug>` โดยตรง
- Skills ที่ pinned ยังปฏิเสธ `install --force` ด้วย เพื่อไม่ให้ไบต์ในเครื่องถูกแทนที่โดยไม่ตั้งใจ

### `unpin <slug>`

- นำ pin ใน lockfile ออกจาก Skill ที่ติดตั้งแล้ว เพื่อให้การอัปเดตในอนาคตแก้ไขได้

### `update [slug]` / `update --all`

- คำนวณ fingerprint จากไฟล์ในเครื่อง
- หาก fingerprint ตรงกับเวอร์ชันที่รู้จัก: ไม่มี prompt
- หาก fingerprint ไม่ตรง:
  - ปฏิเสธตามค่าเริ่มต้น
  - เขียนทับด้วย `--force` (หรือ prompt หากเป็นแบบ interactive)
- Skills ที่ pinned จะไม่ถูกอัปเดตโดย `--force`
- `update <slug>` ล้มเหลวทันทีสำหรับ slugs ที่ pinned และแจ้งให้คุณเรียกใช้ `clawhub unpin <slug>` ก่อน
- `update --all` ข้าม slugs ที่ pinned และพิมพ์สรุปว่าสิ่งใดยังคงถูกตรึงไว้

### `skill publish <path>`

- เผยแพร่ผ่าน `POST /api/v1/skills` (multipart)
- ต้องใช้ semver: `--version 1.2.3`
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่ของ org/user เมื่อ
  actor มีสิทธิ์เข้าถึงผู้เผยแพร่
- `--migrate-owner` ย้าย Skill ที่มีอยู่ไปยัง `--owner` พร้อมเผยแพร่
  เวอร์ชันใหม่ ต้องมีสิทธิ์ admin/owner บนผู้เผยแพร่ทั้งสองฝ่าย
- อธิบายพฤติกรรมของเจ้าของและการรีวิวไว้ใน `docs/publishing.md`
- การเผยแพร่ Skill หมายความว่า Skill นั้นถูกเผยแพร่ภายใต้ `MIT-0` บน ClawHub
- Skills ที่เผยแพร่แล้วสามารถใช้ แก้ไข และเผยแพร่ต่อได้ฟรีโดยไม่ต้องระบุแหล่งที่มา
- ClawHub ไม่รองรับ Skills แบบชำระเงินหรือการตั้งราคาต่อ Skill
- `--clawscan-note <text>` เพิ่มหมายเหตุ ClawScan หมายเหตุนี้ให้บริบทแก่ ClawScan
  สำหรับพฤติกรรมที่อาจดูผิดปกติ เช่น การเข้าถึงเครือข่าย
  การเข้าถึง native host หรือข้อมูลประจำตัวเฉพาะ provider หมายเหตุจะถูกเก็บไว้ใน
  เวอร์ชันที่เผยแพร่
- alias แบบเดิม: `publish <path>`

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- ลบ Skill แบบ soft-delete (เจ้าของ, moderator หรือ admin)
- เรียก `DELETE /api/v1/skills/{slug}`
- การ soft delete ที่เริ่มโดยเจ้าของจะสงวน slug ไว้ 30 วัน; คำสั่งจะพิมพ์เวลาหมดอายุ
- `--reason <text>` บันทึกหมายเหตุการ moderation บน Skill และ audit log
- `--note <text>` เป็น alias ของ `--reason`
- `--yes` ข้ามการยืนยัน

### `undelete <slug>`

- กู้คืน Skill ที่ซ่อนไว้ (เจ้าของ, moderator หรือ admin)
- เรียก `POST /api/v1/skills/{slug}/undelete`
- `--reason <text>` บันทึกหมายเหตุการ moderation บน Skill และ audit log
- `--note <text>` เป็น alias ของ `--reason`
- `--yes` ข้ามการยืนยัน

### `hide <slug>`

- ซ่อน Skill (เจ้าของ, moderator หรือ admin)
- alias ของ `delete`

### `unhide <slug>`

- เลิกซ่อน Skill (เจ้าของ, moderator หรือ admin)
- alias ของ `undelete`

### `skill rename <slug> <new-slug>`

- เปลี่ยนชื่อ Skill ที่เป็นเจ้าของและเก็บ slug เดิมไว้เป็น redirect alias
- เรียก `POST /api/v1/skills/{slug}/rename`
- `--yes` ข้ามการยืนยัน

### `skill merge <source-slug> <target-slug>`

- รวม Skill ที่เป็นเจ้าของหนึ่งรายการเข้าไปยัง Skill ที่เป็นเจ้าของอีกรายการ
- slug ต้นทางจะหยุดแสดงต่อสาธารณะและกลายเป็น redirect alias ไปยังเป้าหมาย
- เรียก `POST /api/v1/skills/{sourceSlug}/merge`
- `--yes` ข้ามการยืนยัน

### `transfer`

- เวิร์กโฟลว์การโอนความเป็นเจ้าของ
- การโอนไปยัง user handles จะสร้างคำขอที่รอดำเนินการให้ผู้รับยอมรับ
- การโอนไปยัง org/publisher handles จะมีผลทันทีเฉพาะเมื่อ actor มีสิทธิ์
  admin ทั้งกับเจ้าของปัจจุบันและผู้เผยแพร่ปลายทาง
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

- เรียกดูหรือค้นหาแค็ตตาล็อกแพ็กเกจแบบรวมผ่าน `GET /api/v1/packages` และ `GET /api/v1/packages/search`
- ใช้คำสั่งนี้สำหรับ plugins และรายการอื่นในตระกูลแพ็กเกจ; `search` ระดับบนสุดยังคงเป็นพื้นผิวการค้นหา Skill
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

- ดึงข้อมูล metadata ของแพ็กเกจโดยไม่ติดตั้ง
- ใช้คำสั่งนี้สำหรับ metadata, ความเข้ากันได้, การตรวจสอบยืนยัน, แหล่งที่มา และการตรวจสอบเวอร์ชัน/ไฟล์ของ Plugin
- `--version <version>`: ตรวจสอบเวอร์ชันเฉพาะ (ค่าเริ่มต้น: latest)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติด tag (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-100)
- `--files`: แสดงรายการไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (ไฟล์ข้อความเท่านั้น; จำกัด 200KB)
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

- คำนวณ ClawHub SHA-256, npm `sha512` integrity และ npm shasum สำหรับ
  artifact ในเครื่อง
- เมื่อใช้ `--package` จะ resolve metadata ที่คาดหวังจาก ClawHub และเปรียบเทียบ
  ไฟล์ในเครื่องกับ metadata artifact ที่เผยแพร่
- เมื่อใช้ flags digest โดยตรง จะตรวจสอบโดยไม่ต้อง lookup ผ่านเครือข่าย
- Flags:
  - `--package <name>`: ชื่อแพ็กเกจสำหรับ resolve metadata artifact ที่คาดหวัง
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

### `package delete <name>`

- ลบแพ็กเกจและรีลีสทั้งหมดแบบกู้คืนได้
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

- กู้คืนแพ็กเกจและรีลีสที่ถูกลบแบบกู้คืนได้
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

- โอนแพ็กเกจไปยังผู้เผยแพร่รายอื่น
- ต้องมีสิทธิ์ผู้ดูแลในทั้งเจ้าของแพ็กเกจปัจจุบันและผู้เผยแพร่ปลายทาง
  เว้นแต่ดำเนินการโดยผู้ดูแลระบบแพลตฟอร์ม
- ชื่อแพ็กเกจแบบมีขอบเขตต้องโอนไปยังเจ้าของขอบเขตที่ตรงกัน
- เรียก `POST /api/v1/packages/{name}/transfer`
- แฟล็ก:
  - `--to <owner>`: handle ของผู้เผยแพร่ปลายทาง
  - `--reason <text>`: เหตุผลการตรวจสอบเพิ่มเติม
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
  - `--version <version>`: เวอร์ชันแพ็กเกจเพิ่มเติมที่จะผูกกับรายงาน
  - `--reason <text>`: เหตุผลรายงานที่จำเป็น
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- คำสั่งสำหรับเจ้าของเพื่อตรวจสอบการมองเห็นด้านการดูแลแพ็กเกจ
- เรียก `GET /api/v1/packages/{name}/moderation`
- แสดงสถานะการสแกนแพ็กเกจปัจจุบัน จำนวนรายงานที่เปิดอยู่ สถานะการดูแลแบบ manual
  ของรีลีสล่าสุด สถานะการบล็อกดาวน์โหลด และเหตุผลการดูแล
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- ตรวจสอบว่าแพ็กเกจพร้อมสำหรับการใช้งาน OpenClaw ในอนาคตหรือไม่
- เรียก `GET /api/v1/packages/{name}/readiness`
- รายงานตัวบล็อกสำหรับสถานะทางการ ความพร้อมใช้งานของ ClawPack ไดเจสต์อาร์ติแฟกต์
  แหล่งที่มาของซอร์ส ความเข้ากันได้กับ OpenClaw เป้าหมายโฮสต์ เมตาดาต้าสภาพแวดล้อม
  และสถานะการสแกน
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- แสดงสถานะการย้ายที่มุ่งเน้นผู้ปฏิบัติงานสำหรับแพ็กเกจที่อาจแทนที่
  Plugin ของ OpenClaw ที่รวมมาให้
- เรียก endpoint ความพร้อมที่คำนวณแบบเดียวกับ `package readiness` แต่พิมพ์
  สถานะที่เน้นการย้าย เวอร์ชันล่าสุด สถานะแพ็กเกจทางการ การตรวจสอบ และ
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
  - เส้นทางโฟลเดอร์ในเครื่อง: `./my-plugin`
  - ไฟล์ tarball ของ ClawPack npm-pack ในเครื่อง: `./my-plugin-1.2.3.tgz`
  - repo GitHub: `owner/repo` หรือ `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- เมตาดาต้าจะถูกตรวจจับอัตโนมัติจาก `package.json`, `openclaw.plugin.json`, และ
  เครื่องหมายบันเดิล OpenClaw จริง เช่น `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json`, และ `.cursor-plugin/plugin.json`
- แหล่ง `.tgz` จะถูกถือเป็น ClawPack โดย CLI จะอัปโหลดไบต์ npm-pack
  ตามจริง และใช้เนื้อหา `package/` ที่แตกออกมาเฉพาะสำหรับการตรวจสอบและ
  เติมเมตาดาต้าล่วงหน้า
- โฟลเดอร์ Plugin แบบโค้ดจะถูกแพ็กเป็น tarball ของ ClawPack npm ก่อนอัปโหลด เพื่อให้
  การติดตั้ง OpenClaw ตรวจสอบอาร์ติแฟกต์ที่แน่นอนได้ โฟลเดอร์ Plugin แบบบันเดิลยังคง
  ใช้เส้นทางเผยแพร่แบบไฟล์ที่แตกออกมา
- สำหรับแหล่ง GitHub การระบุแหล่งที่มาของซอร์สจะถูกเติมอัตโนมัติจาก repo, commit ที่ resolve แล้ว, ref และ subpath
- สำหรับโฟลเดอร์ในเครื่อง การระบุแหล่งที่มาของซอร์สจะถูกตรวจจับอัตโนมัติจาก git ในเครื่องเมื่อ origin remote ชี้ไปที่ GitHub
- Plugin แบบโค้ดภายนอกต้องประกาศ `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion` อย่างชัดเจน
  `package.json.version` ระดับบนสุดจะไม่ถูกใช้เป็น fallback สำหรับการตรวจสอบการเผยแพร่
- `--dry-run` แสดงตัวอย่าง payload การเผยแพร่ที่ resolve แล้วโดยไม่อัปโหลด
- `--json` ปล่อยเอาต์พุตที่เครื่องอ่านได้สำหรับ CI
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่ของผู้ใช้หรือองค์กรเมื่อ actor มีสิทธิ์เข้าถึงผู้เผยแพร่
- `--clawscan-note <text>` เพิ่มหมายเหตุ ClawScan หมายเหตุนี้ให้บริบทแก่ ClawScan
  สำหรับพฤติกรรมที่อาจดูผิดปกติ เช่น การเข้าถึงเครือข่าย
  การเข้าถึงโฮสต์ native หรือข้อมูลรับรองเฉพาะผู้ให้บริการ หมายเหตุจะถูกเก็บไว้บน
  รีลีสที่เผยแพร่
- ชื่อแพ็กเกจแบบมีขอบเขตต้องตรงกับเจ้าของที่เลือก ดู `docs/publishing.md`
- แฟล็กเดิม (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ยังใช้งานเป็นการ override ได้
- repo GitHub แบบส่วนตัวต้องใช้ `GITHUB_TOKEN`

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### โฟลว์ในเครื่องที่แนะนำ

ใช้ `--dry-run` ก่อน เพื่อให้คุณยืนยันเมตาดาต้าแพ็กเกจที่ resolve แล้วและ
การระบุแหล่งที่มาของซอร์สก่อนสร้างรีลีสจริง:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### โฟลว์โฟลเดอร์ในเครื่อง

สำหรับ Plugin แบบโค้ด การเผยแพร่โฟลเดอร์จะสร้างและอัปโหลดอาร์ติแฟกต์ ClawPack จาก
โฟลเดอร์แพ็กเกจ:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` ขั้นต่ำสำหรับ `--family code-plugin`

Plugin แบบโค้ดภายนอกต้องมีเมตาดาต้า OpenClaw จำนวนเล็กน้อยใน
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

- `package.json.version` คือเวอร์ชันรีลีสของแพ็กเกจคุณ แต่จะไม่ถูกใช้เป็น
  fallback สำหรับการตรวจสอบความเข้ากันได้/บิลด์ของ OpenClaw
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมตาดาต้าเพิ่มเติม
  ClawHub อาจแสดงเมื่อมีอยู่ แต่ไม่จำเป็นสำหรับการเผยแพร่
- `openclaw.compat.minGatewayVersion` และ
  `openclaw.build.pluginSdkVersion` เป็นส่วนเพิ่มเติมที่ไม่บังคับหากคุณต้องการเผยแพร่
  เมตาดาต้าความเข้ากันได้ที่ละเอียดขึ้น
- หากคุณใช้รีลีส CLI `clawhub` ที่เก่ากว่า ให้อัปเกรดก่อนเผยแพร่เพื่อให้
  การตรวจสอบ preflight ในเครื่องทำงานก่อนอัปโหลด

#### GitHub Actions

ClawHub ยังจัดส่ง workflow แบบ reusable ทางการที่
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/af96221ebb197e2af09f44870046ced4ded4aea0/.github/workflows/package-publish.yml)
สำหรับ repo Plugin

การตั้งค่าผู้เรียกทั่วไป:

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

- workflow แบบ reusable ตั้งค่า `source` เริ่มต้นเป็น repo ของผู้เรียก
- สำหรับ monorepo ให้ส่ง `source_path` เพื่อให้ workflow เผยแพร่โฟลเดอร์แพ็กเกจ
  Plugin เช่น `source_path: extensions/codex`
- pin workflow แบบ reusable ไปยัง tag ที่เสถียรหรือ commit SHA แบบเต็ม อย่ารันการเผยแพร่รีลีสจาก `@main`
- `pull_request` ควรใช้ `dry_run: true` เพื่อให้ CI ไม่สร้างผลกระทบ
- การเผยแพร่จริงควรถูกจำกัดไว้ที่ event ที่เชื่อถือได้ เช่น `workflow_dispatch` หรือการ push tag
- การเผยแพร่ที่เชื่อถือได้โดยไม่มี secret ใช้ได้เฉพาะบน `workflow_dispatch`; การ push tag ยังต้องใช้ `clawhub_token`
- เก็บ `clawhub_token` ให้พร้อมสำหรับการเผยแพร่ครั้งแรก แพ็กเกจที่ไม่น่าเชื่อถือ หรือการเผยแพร่กรณีฉุกเฉิน
- workflow อัปโหลดผลลัพธ์ JSON เป็นอาร์ติแฟกต์และเปิดเผยเป็นเอาต์พุตของ workflow

### `sync`

- สแกนหาโฟลเดอร์ Skills ในเครื่องและเผยแพร่รายการใหม่/ที่เปลี่ยนแปลง
- root สามารถเป็นโฟลเดอร์ใดก็ได้: ไดเรกทอรี skills หรือโฟลเดอร์ skill เดี่ยวที่มี `SKILL.md`
- เพิ่ม root ของ skill Clawdbot อัตโนมัติเมื่อมี `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (agent หลัก)
  - `routing.agents.*.workspace/skills` (ต่อ agent)
  - `~/.clawdbot/skills` (ใช้ร่วมกัน)
  - `skills.load.extraDirs` (แพ็กที่ใช้ร่วมกัน)
- เคารพ `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` และ `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`
- แฟล็ก:
  - `--root <dir...>` root การสแกนเพิ่มเติม
  - `--all` อัปโหลดโดยไม่ถาม
  - `--dry-run` แสดงเฉพาะแผน
  - `--bump patch|minor|major` (ค่าเริ่มต้น: patch)
  - `--changelog <text>` (ไม่โต้ตอบ)
  - `--tags a,b,c` (ค่าเริ่มต้น: latest)
  - `--concurrency <n>` (ค่าเริ่มต้น: 4)

โทรมาตร:

- ส่งระหว่าง `sync` เมื่อเข้าสู่ระบบแล้ว เว้นแต่ `CLAWHUB_DISABLE_TELEMETRY=1` (แบบเดิม `CLAWDHUB_DISABLE_TELEMETRY=1`)
- รายละเอียด: `docs/telemetry.md`
