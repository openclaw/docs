---
read_when:
    - การใช้ ClawHub CLI
    - การดีบักการติดตั้ง การอัปเดต การเผยแพร่ หรือการซิงค์
summary: 'ข้อมูลอ้างอิง CLI: คำสั่ง, แฟล็ก, การกำหนดค่า, lockfile, ลักษณะการซิงค์.'
x-i18n:
    generated_at: "2026-05-12T00:56:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 852c15f48e414364303f77873b0c531d2b80478a99cb816719c00972c4ae2203
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

- `--workdir <dir>`: ไดเรกทอรีทำงาน (ค่าเริ่มต้น: cwd; ถ้ากำหนดค่าไว้ จะย้อนกลับไปใช้เวิร์กสเปซของ Clawdbot)
- `--dir <dir>`: ไดเรกทอรีติดตั้งภายใต้ workdir (ค่าเริ่มต้น: `skills`)
- `--site <url>`: URL ฐานสำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `https://clawhub.ai`)
- `--registry <url>`: URL ฐานของ API (ค่าเริ่มต้น: ค้นพบอัตโนมัติ มิฉะนั้นใช้ `https://clawhub.ai`)
- `--no-input`: ปิดใช้งานพรอมต์

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
ใช้สำหรับ HTTP ธรรมดา `NO_PROXY` / `no_proxy` จะถูกใช้เพื่อข้ามพร็อกซีสำหรับ
โฮสต์หรือโดเมนที่ระบุ

สิ่งนี้จำเป็นในระบบที่บล็อกการเชื่อมต่อขาออกโดยตรง
(เช่น คอนเทนเนอร์ Docker, Hetzner VPS ที่มีอินเทอร์เน็ตผ่านพร็อกซีเท่านั้น, ไฟร์วอลล์
องค์กร)

ตัวอย่าง:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

เมื่อไม่ได้ตั้งค่าตัวแปรพร็อกซี พฤติกรรมจะไม่เปลี่ยนแปลง (เชื่อมต่อโดยตรง)

## ไฟล์กำหนดค่า

เก็บโทเค็น API ของคุณ + URL รีจิสทรีที่แคชไว้

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` หรือ `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- ทางเลือกสำรองเดิม: หากยังไม่มี `clawhub/config.json` แต่มี `clawdhub/config.json` อยู่ CLI จะใช้เส้นทางเดิมซ้ำ
- override: `CLAWHUB_CONFIG_PATH` (เดิม `CLAWDHUB_CONFIG_PATH`)

## คำสั่ง

### `login` / `auth login`

- ค่าเริ่มต้น: เปิดเบราว์เซอร์ไปที่ `<site>/cli/auth` และดำเนินการให้เสร็จผ่านคอลแบ็ก loopback
- แบบ headless: `clawhub login --token clh_...`
- แบบรีโมต/headless เชิงโต้ตอบ: `clawhub login --device` พิมพ์โค้ดและรอขณะที่คุณอนุญาตที่ `<site>/cli/device`

### `whoami`

- ตรวจสอบโทเค็นที่จัดเก็บไว้ผ่าน `/api/v1/whoami`

### `star <slug>` / `unstar <slug>`

- เพิ่ม/ลบ Skills จากรายการเด่นของคุณ
- เรียก `POST /api/v1/stars/<slug>` และ `DELETE /api/v1/stars/<slug>`
- `--yes` ข้ามการยืนยัน

### `search <query...>`

- เรียก `/api/v1/search?q=...`
- การค้นหาให้ความสำคัญกับการจับคู่โทเค็น slug/name แบบตรงตัวก่อนความนิยมจากการดาวน์โหลด โทเค็น slug แบบเดี่ยว เช่น `map` จะจับคู่กับ `personal-map` ได้แรงกว่าสตริงย่อยภายใน `amap`
- จำนวนดาวน์โหลดเป็นเพียงปัจจัยความนิยมล่วงหน้าขนาดเล็ก ไม่ใช่การรับประกันว่าจะได้ตำแหน่งบนสุด
- หาก Skills ควรปรากฏแต่ไม่ปรากฏ ให้รัน `clawhub inspect <slug>` ขณะเข้าสู่ระบบเพื่อตรวจสอบข้อมูลวินิจฉัยการกลั่นกรองที่เจ้าของมองเห็นได้ ก่อนเปลี่ยนชื่อเมตาดาต้า

### `explore`

- แสดงรายการ Skills ใหม่ล่าสุดผ่าน `/api/v1/skills?limit=...&sort=createdAt` (เรียงตาม `createdAt` จากมากไปน้อย)
- แฟล็ก:
  - `--limit <n>` (1-200, ค่าเริ่มต้น: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (ค่าเริ่มต้น: newest)
  - `--json` (เอาต์พุตที่เครื่องอ่านได้)
- เอาต์พุต: `<slug>  v<version>  <age>  <summary>` (summary ถูกตัดให้เหลือ 50 อักขระ)

### `inspect <slug>`

- ดึงเมตาดาต้าและไฟล์เวอร์ชันของ Skills โดยไม่ติดตั้ง
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: ล่าสุด)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-200)
- `--files`: แสดงรายการไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (เฉพาะไฟล์ข้อความ; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `install <slug>`

- ระบุเวอร์ชันล่าสุดผ่าน `/api/v1/skills/<slug>`
- ดาวน์โหลด zip ผ่าน `/api/v1/download`
- แตกไฟล์ไปยัง `<workdir>/<dir>/<slug>`
- ปฏิเสธการเขียนทับ Skills ที่ปักหมุดไว้ ให้รัน `clawhub unpin <slug>` ก่อน
- เขียน:
  - `<workdir>/.clawhub/lock.json` (เดิม `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (เดิม `.clawdhub`)

### `uninstall <slug>`

- ลบ `<workdir>/<dir>/<slug>` และลบรายการใน lockfile
- เชิงโต้ตอบ: ขอการยืนยัน
- ไม่โต้ตอบ (`--no-input`): ต้องใช้ `--yes`

### `list`

- อ่าน `<workdir>/.clawhub/lock.json` (`.clawdhub` แบบเดิม)
- แสดง `pinned` ถัดจาก Skills ที่ถูกตรึงด้วย `clawhub pin` รวมถึงเหตุผลเพิ่มเติมถ้ามี

### `pin <slug>`

- ทำเครื่องหมาย Skill ที่ติดตั้งแล้วว่าเป็น pinned ใน lockfile
- `--reason <text>` บันทึกเหตุผลที่ Skill ถูกตรึง
- Skills ที่ pinned จะถูกข้ามโดย `update --all` และถูกปฏิเสธโดย `update <slug>` โดยตรง
- Skills ที่ pinned ยังปฏิเสธ `install --force` เพื่อไม่ให้ไบต์ในเครื่องถูกแทนที่โดยไม่ตั้งใจ

### `unpin <slug>`

- นำ pin ใน lockfile ออกจาก Skill ที่ติดตั้งแล้ว เพื่อให้การอัปเดตในอนาคตสามารถแก้ไขได้

### `update [slug]` / `update --all`

- คำนวณ fingerprint จากไฟล์ในเครื่อง
- หาก fingerprint ตรงกับเวอร์ชันที่รู้จัก: ไม่มี prompt
- หาก fingerprint ไม่ตรง:
  - ปฏิเสธโดยค่าเริ่มต้น
  - เขียนทับด้วย `--force` (หรือ prompt หากเป็นแบบโต้ตอบ)
- Skills ที่ pinned จะไม่ถูกอัปเดตโดย `--force`
- `update <slug>` ล้มเหลวทันทีสำหรับ slugs ที่ pinned และแจ้งให้คุณรัน `clawhub unpin <slug>` ก่อน
- `update --all` ข้าม slugs ที่ pinned และพิมพ์สรุปว่าสิ่งใดยังคงถูกตรึงไว้

### `skill publish <path>`

- เผยแพร่ผ่าน `POST /api/v1/skills` (multipart)
- ต้องใช้ semver: `--version 1.2.3`
- `--owner <handle>` เผยแพร่ภายใต้ publisher handle ของ org/user เมื่อ
  actor มีสิทธิ์เข้าถึง publisher
- `--migrate-owner` ย้าย Skill ที่มีอยู่ไปยัง `--owner` ขณะเผยแพร่
  เวอร์ชันใหม่ ต้องมีสิทธิ์ admin/owner ใน publishers ทั้งสองฝั่ง
- อธิบายพฤติกรรม owner และ review ไว้ใน `docs/publishing.md`
- การเผยแพร่ Skill หมายถึงการปล่อยภายใต้ `MIT-0` บน ClawHub
- Skills ที่เผยแพร่แล้วใช้งาน แก้ไข และแจกจ่ายต่อได้ฟรีโดยไม่ต้องระบุที่มา
- ClawHub ไม่รองรับ Skills แบบชำระเงินหรือการตั้งราคาต่อ Skill
- `--clawscan-note <text>` เพิ่มหมายเหตุ ClawScan หมายเหตุนี้ให้บริบทแก่ ClawScan
  สำหรับพฤติกรรมที่อาจดูผิดปกติ เช่น การเข้าถึงเครือข่าย
  การเข้าถึง native host หรือ credentials เฉพาะ provider หมายเหตุจะถูกเก็บไว้ใน
  เวอร์ชันที่เผยแพร่
- alias เดิม: `publish <path>`

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- soft-delete Skill (owner, moderator หรือ admin)
- เรียก `DELETE /api/v1/skills/{slug}`
- การ soft delete ที่เริ่มโดย owner จะสงวน slug ไว้ 30 วัน; คำสั่งจะพิมพ์เวลาหมดอายุ
- `--reason <text>` บันทึกหมายเหตุ moderation บน Skill และ audit log
- `--note <text>` เป็น alias สำหรับ `--reason`
- `--yes` ข้ามการยืนยัน

### `undelete <slug>`

- กู้คืน Skill ที่ถูกซ่อน (owner, moderator หรือ admin)
- เรียก `POST /api/v1/skills/{slug}/undelete`
- `--reason <text>` บันทึกหมายเหตุ moderation บน Skill และ audit log
- `--note <text>` เป็น alias สำหรับ `--reason`
- `--yes` ข้ามการยืนยัน

### `hide <slug>`

- ซ่อน Skill (owner, moderator หรือ admin)
- alias สำหรับ `delete`

### `unhide <slug>`

- ยกเลิกการซ่อน Skill (owner, moderator หรือ admin)
- alias สำหรับ `undelete`

### `skill rename <slug> <new-slug>`

- เปลี่ยนชื่อ Skill ที่เป็นเจ้าของและเก็บ slug ก่อนหน้าไว้เป็น redirect alias
- เรียก `POST /api/v1/skills/{slug}/rename`
- `--yes` ข้ามการยืนยัน

### `skill merge <source-slug> <target-slug>`

- รวม Skill ที่เป็นเจ้าของหนึ่งรายการเข้าไปใน Skill ที่เป็นเจ้าของอีกรายการ
- source slug จะหยุดแสดงแบบสาธารณะและกลายเป็น redirect alias ไปยัง target
- เรียก `POST /api/v1/skills/{sourceSlug}/merge`
- `--yes` ข้ามการยืนยัน

### `transfer`

- workflow การโอน ownership
- การโอนไปยัง user handles จะสร้างคำขอที่รอให้ผู้รับยอมรับ
- การโอนไปยัง org/publisher handles จะมีผลทันทีเฉพาะเมื่อ actor มี
  สิทธิ์ admin ต่อทั้ง owner ปัจจุบันและ destination publisher
- คำสั่งย่อย:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- endpoints:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- เรียกดูหรือค้นหา catalog แพ็กเกจแบบรวมผ่าน `GET /api/v1/packages` และ `GET /api/v1/packages/search`
- ใช้สิ่งนี้สำหรับ plugins และรายการตระกูลแพ็กเกจอื่น ๆ; `search` ระดับบนสุดยังคงเป็นพื้นผิวค้นหา Skill
- flags:
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
- ใช้สิ่งนี้สำหรับ metadata ของ plugin, compatibility, verification, source และการตรวจสอบ version/file
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: latest)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติด tag (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-100)
- `--files`: แสดงไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (เฉพาะไฟล์ข้อความ; จำกัด 200KB)
- `--json`: output ที่เครื่องอ่านได้

### `package download <name>`

- resolve เวอร์ชันแพ็กเกจผ่าน
  `GET /api/v1/packages/{name}/versions/{version}/artifact`
- ดาวน์โหลด artifact จาก `downloadUrl` ของ resolver
- ตรวจสอบ ClawHub SHA-256 สำหรับ artifacts ทั้งหมด
- สำหรับ artifacts แบบ ClawPack npm-pack จะตรวจสอบ npm `sha512` integrity,
  npm shasum และ name/version ใน `package.json` ของ tarball ด้วย
- เวอร์ชัน ZIP เดิมดาวน์โหลดผ่าน route ZIP เดิม
- flags:
  - `--version <version>`: ดาวน์โหลดเวอร์ชันที่ระบุ
  - `--tag <tag>`: ดาวน์โหลดเวอร์ชันที่ติด tag (ค่าเริ่มต้น: `latest`)
  - `-o, --output <path>`: ไฟล์หรือไดเรกทอรี output
  - `--force`: เขียนทับไฟล์ output ที่มีอยู่
  - `--json`: output ที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- คำนวณ ClawHub SHA-256, npm `sha512` integrity และ npm shasum สำหรับ
  artifact ในเครื่อง
- เมื่อใช้ `--package` จะ resolve metadata ที่คาดหวังจาก ClawHub และเปรียบเทียบ
  ไฟล์ในเครื่องกับ metadata ของ artifact ที่เผยแพร่
- เมื่อใช้ flags digest โดยตรง จะตรวจสอบโดยไม่ lookup ผ่านเครือข่าย
- flags:
  - `--package <name>`: ชื่อแพ็กเกจที่จะ resolve metadata ของ artifact ที่คาดหวัง
  - `--version <version>` หรือ `--tag <tag>`: เวอร์ชันแพ็กเกจที่คาดหวัง
  - `--sha256 <hex>`: ClawHub SHA-256 ที่คาดหวัง
  - `--npm-integrity <sri>`: npm integrity ที่คาดหวัง
  - `--npm-shasum <sha1>`: npm shasum ที่คาดหวัง
  - `--json`: output ที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- ลบแพ็กเกจและรีลีสทั้งหมดแบบ soft-delete
- ต้องเป็นเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลระบบของผู้เผยแพร่องค์กร, ผู้ดูแลแพลตฟอร์ม,
  หรือผู้ดูแลระบบแพลตฟอร์ม
- แฟล็ก:
  - `--yes`: ข้ามการยืนยัน
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- กู้คืนแพ็กเกจและรีลีสที่ถูก soft-delete
- ต้องเป็นเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลระบบของผู้เผยแพร่องค์กร, ผู้ดูแลแพลตฟอร์ม,
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
- ต้องมีสิทธิ์ผู้ดูแลระบบทั้งเจ้าของแพ็กเกจปัจจุบันและผู้เผยแพร่ปลายทาง
  เว้นแต่จะดำเนินการโดยผู้ดูแลระบบแพลตฟอร์ม
- ชื่อแพ็กเกจแบบมี scope ต้องโอนไปยังเจ้าของ scope ที่ตรงกัน
- เรียก `POST /api/v1/packages/{name}/transfer`
- แฟล็ก:
  - `--to <owner>`: handle ของผู้เผยแพร่ปลายทาง
  - `--reason <text>`: เหตุผลสำหรับการตรวจสอบย้อนหลังแบบไม่บังคับ
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- คำสั่งที่ต้องยืนยันตัวตนสำหรับรายงานแพ็กเกจต่อผู้ดูแล
- เรียก `POST /api/v1/packages/{name}/report`
- รายงานอยู่ในระดับแพ็กเกจ โดยอาจผูกกับเวอร์ชันได้ และจะปรากฏให้ผู้ดูแล
  ตรวจสอบ
- รายงานจะไม่ซ่อนแพ็กเกจหรือบล็อกการดาวน์โหลดโดยอัตโนมัติด้วยตัวเอง
- แฟล็ก:
  - `--version <version>`: เวอร์ชันแพ็กเกจแบบไม่บังคับที่จะแนบกับรายงาน
  - `--reason <text>`: เหตุผลของรายงานที่จำเป็น
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- คำสั่งสำหรับเจ้าของเพื่อตรวจสอบการมองเห็นด้านการดูแลแพ็กเกจ
- เรียก `GET /api/v1/packages/{name}/moderation`
- แสดงสถานะการสแกนแพ็กเกจปัจจุบัน, จำนวนรายงานที่เปิดอยู่, สถานะการดูแลด้วยตนเอง
  ของรีลีสล่าสุด, สถานะการบล็อกดาวน์โหลด และเหตุผลด้านการดูแล
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- ตรวจสอบว่าแพ็กเกจพร้อมสำหรับการใช้งานโดย OpenClaw ในอนาคตหรือไม่
- เรียก `GET /api/v1/packages/{name}/readiness`
- รายงานตัวบล็อกสำหรับสถานะอย่างเป็นทางการ, ความพร้อมใช้งานของ ClawPack, digest ของอาร์ทิแฟกต์,
  แหล่งที่มาของซอร์ส, ความเข้ากันได้กับ OpenClaw, เป้าหมายโฮสต์, เมทาดาทาของสภาพแวดล้อม,
  และสถานะการสแกน
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- แสดงสถานะการย้ายข้อมูลที่เน้นผู้ปฏิบัติการสำหรับแพ็กเกจที่อาจแทนที่
  OpenClaw Plugin ที่บันเดิลมา
- เรียก endpoint ความพร้อมที่คำนวณแล้วตัวเดียวกับ `package readiness` แต่พิมพ์
  สถานะที่เน้นการย้ายข้อมูล, เวอร์ชันล่าสุด, สถานะแพ็กเกจอย่างเป็นทางการ, การตรวจสอบ และ
  ตัวบล็อก
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- เผยแพร่ code Plugin หรือ bundle Plugin ผ่าน `POST /api/v1/packages`
- `<source>` รับ:
  - พาธโฟลเดอร์ในเครื่อง: `./my-plugin`
  - tarball ของ ClawPack npm-pack ในเครื่อง: `./my-plugin-1.2.3.tgz`
  - รีโป GitHub: `owner/repo` หรือ `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- ตรวจหาเมทาดาทาอัตโนมัติจาก `package.json`, `openclaw.plugin.json` และ
  marker ของบันเดิล OpenClaw จริง เช่น `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` และ `.cursor-plugin/plugin.json`
- แหล่งที่มา `.tgz` จะถือเป็น ClawPack CLI อัปโหลดไบต์ npm-pack
  ตามจริง และใช้เนื้อหา `package/` ที่แตกออกมาเพื่อการตรวจสอบและ
  เติมเมทาดาทาล่วงหน้าเท่านั้น
- โฟลเดอร์ code Plugin จะถูกแพ็กเป็น tarball npm ของ ClawPack ก่อนอัปโหลด เพื่อให้
  การติดตั้ง OpenClaw ตรวจสอบอาร์ทิแฟกต์ที่แน่นอนได้ โฟลเดอร์ bundle Plugin ยังคง
  ใช้เส้นทางเผยแพร่แบบไฟล์ที่แตกออกมา
- สำหรับแหล่งที่มา GitHub การระบุแหล่งที่มาจะถูกเติมอัตโนมัติจากรีโป, commit ที่ resolve แล้ว, ref และ subpath
- สำหรับโฟลเดอร์ในเครื่อง การระบุแหล่งที่มาจะถูกตรวจหาอัตโนมัติจาก git ในเครื่องเมื่อ remote origin ชี้ไปที่ GitHub
- code Plugin ภายนอกต้องประกาศ `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion` อย่างชัดเจน
  `package.json.version` ระดับบนสุดไม่ถูกใช้เป็น fallback สำหรับการตรวจสอบการเผยแพร่
- `--dry-run` แสดงตัวอย่าง payload การเผยแพร่ที่ resolve แล้วโดยไม่อัปโหลด
- `--json` ปล่อยเอาต์พุตที่เครื่องอ่านได้สำหรับ CI
- `--owner <handle>` เผยแพร่ภายใต้ handle ของผู้เผยแพร่แบบผู้ใช้หรือองค์กรเมื่อ actor มีสิทธิ์เข้าถึงผู้เผยแพร่
- `--clawscan-note <text>` เพิ่มหมายเหตุ ClawScan หมายเหตุนี้ให้บริบทแก่ ClawScan
  สำหรับพฤติกรรมที่อาจดูผิดปกติ เช่น การเข้าถึงเครือข่าย,
  การเข้าถึง native host หรือข้อมูลรับรองเฉพาะผู้ให้บริการ หมายเหตุจะถูกเก็บไว้บน
  รีลีสที่เผยแพร่
- ชื่อแพ็กเกจแบบมี scope ต้องตรงกับเจ้าของที่เลือก ดู `docs/publishing.md`
- แฟล็กที่มีอยู่ (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ยังใช้งานเป็น override ได้
- รีโป GitHub ส่วนตัวต้องใช้ `GITHUB_TOKEN`

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### โฟลว์ในเครื่องที่แนะนำ

ใช้ `--dry-run` ก่อนเพื่อให้คุณยืนยันเมทาดาทาแพ็กเกจที่ resolve แล้วและ
การระบุแหล่งที่มาก่อนสร้างรีลีสจริง:

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
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมทาดาทาแบบไม่บังคับ
  ClawHub อาจแสดงเมื่อมีอยู่ แต่ไม่จำเป็นสำหรับการเผยแพร่
- `openclaw.compat.minGatewayVersion` และ
  `openclaw.build.pluginSdkVersion` เป็นส่วนเสริมแบบไม่บังคับหากคุณต้องการเผยแพร่
  เมทาดาทาความเข้ากันได้ที่ละเอียดขึ้น
- หากคุณใช้รีลีส CLI `clawhub` รุ่นเก่า ให้อัปเกรดก่อนเผยแพร่เพื่อให้
  การตรวจสอบ preflight ในเครื่องทำงานก่อนอัปโหลด

#### GitHub Actions

ClawHub ยังมาพร้อม workflow ที่ใช้ซ้ำได้อย่างเป็นทางการที่
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/426a2a78792b7ebcf5aa2a08c595cc618a197c66/.github/workflows/package-publish.yml)
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

- workflow ที่ใช้ซ้ำได้ตั้งค่าเริ่มต้น `source` เป็นรีโปของ caller
- สำหรับ monorepo ให้ส่ง `source_path` เพื่อให้ workflow เผยแพร่โฟลเดอร์แพ็กเกจ
  Plugin เช่น `source_path: extensions/codex`
- pin workflow ที่ใช้ซ้ำได้กับแท็กเสถียรหรือ SHA commit แบบเต็ม อย่าเผยแพร่รีลีสจาก `@main`
- `pull_request` ควรใช้ `dry_run: true` เพื่อให้ CI ไม่สร้างผลข้างเคียง
- การเผยแพร่จริงควรจำกัดไว้ที่เหตุการณ์ที่เชื่อถือได้ เช่น `workflow_dispatch` หรือ tag push
- trusted publishing โดยไม่มี secret ใช้ได้เฉพาะบน `workflow_dispatch`; tag push ยังต้องใช้ `clawhub_token`
- เก็บ `clawhub_token` ให้พร้อมสำหรับการเผยแพร่ครั้งแรก, แพ็กเกจที่ไม่น่าเชื่อถือ หรือการเผยแพร่ฉุกเฉิน
- workflow อัปโหลดผลลัพธ์ JSON เป็นอาร์ทิแฟกต์และเปิดเผยเป็นเอาต์พุตของ workflow

### `sync`

- สแกนหาโฟลเดอร์ Skills ในเครื่องและเผยแพร่รายการใหม่/ที่เปลี่ยนแปลง
- root เป็นโฟลเดอร์ใดก็ได้: ไดเรกทอรี Skills หรือโฟลเดอร์ Skills เดี่ยวที่มี `SKILL.md`
- เพิ่ม root ของ Skills ของ Clawdbot อัตโนมัติเมื่อมี `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (agent หลัก)
  - `routing.agents.*.workspace/skills` (ต่อ agent)
  - `~/.clawdbot/skills` (แชร์)
  - `skills.load.extraDirs` (แพ็กที่แชร์)
- เคารพ `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` และ `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`
- แฟล็ก:
  - `--root <dir...>` root สแกนเพิ่มเติม
  - `--all` อัปโหลดโดยไม่ถาม
  - `--dry-run` แสดงเฉพาะแผน
  - `--bump patch|minor|major` (ค่าเริ่มต้น: patch)
  - `--changelog <text>` (ไม่โต้ตอบ)
  - `--tags a,b,c` (ค่าเริ่มต้น: latest)
  - `--concurrency <n>` (ค่าเริ่มต้น: 4)

โทรมาตร:

- ส่งระหว่าง `sync` เมื่อเข้าสู่ระบบ เว้นแต่ `CLAWHUB_DISABLE_TELEMETRY=1` (แบบเดิม `CLAWDHUB_DISABLE_TELEMETRY=1`)
- รายละเอียด: `docs/telemetry.md`
