---
read_when:
    - การใช้ ClawHub CLI
    - การดีบักการติดตั้ง การอัปเดต การเผยแพร่ หรือการซิงค์
summary: 'ข้อมูลอ้างอิง CLI: คำสั่ง แฟล็ก การกำหนดค่า ไฟล์ล็อก และพฤติกรรมการซิงค์.'
x-i18n:
    generated_at: "2026-05-11T22:19:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: abbe12a07f8947f8c65ba6eaae6fa6ff7fb8bfb12fbcb339abccd12225a2e791
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

## แฟล็ก global

- `--workdir <dir>`: ไดเรกทอรีทำงาน (ค่าเริ่มต้น: cwd; ถ้ากำหนดไว้ จะ fallback ไปยัง workspace ของ Clawdbot)
- `--dir <dir>`: ไดเรกทอรีติดตั้งใต้ workdir (ค่าเริ่มต้น: `skills`)
- `--site <url>`: URL ฐานสำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `https://clawhub.ai`)
- `--registry <url>`: URL ฐานของ API (ค่าเริ่มต้น: ค้นพบอัตโนมัติ มิฉะนั้นใช้ `https://clawhub.ai`)
- `--no-input`: ปิดใช้งานพรอมป์

ค่าที่เทียบเท่าใน env:

- `CLAWHUB_SITE` (legacy `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (legacy `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (legacy `CLAWDHUB_WORKDIR`)

### พร็อกซี HTTP

CLI เคารพตัวแปรสภาพแวดล้อมพร็อกซี HTTP มาตรฐานสำหรับระบบที่อยู่หลัง
พร็อกซีขององค์กรหรือเครือข่ายที่ถูกจำกัด:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

เมื่อตั้งค่าตัวแปรใดๆ เหล่านี้ CLI จะส่งคำขอขาออกผ่าน
พร็อกซีที่ระบุ `HTTPS_PROXY` ใช้สำหรับคำขอ HTTPS, `HTTP_PROXY`
ใช้สำหรับ HTTP แบบปกติ `NO_PROXY` / `no_proxy` จะได้รับการเคารพเพื่อข้ามพร็อกซีสำหรับ
โฮสต์หรือโดเมนที่ระบุ

สิ่งนี้จำเป็นบนระบบที่การเชื่อมต่อขาออกโดยตรงถูกบล็อก
(เช่น คอนเทนเนอร์ Docker, Hetzner VPS ที่ใช้อินเทอร์เน็ตผ่านพร็อกซีเท่านั้น, ไฟร์วอลล์
ขององค์กร)

ตัวอย่าง:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

เมื่อไม่ได้ตั้งค่าตัวแปรพร็อกซีใดๆ พฤติกรรมจะไม่เปลี่ยนแปลง (การเชื่อมต่อโดยตรง)

## ไฟล์ config

เก็บโทเค็น API ของคุณ + URL registry ที่แคชไว้

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` หรือ `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Legacy fallback: หาก `clawhub/config.json` ยังไม่มีอยู่ แต่มี `clawdhub/config.json` อยู่ CLI จะนำ path legacy มาใช้ซ้ำ
- override: `CLAWHUB_CONFIG_PATH` (legacy `CLAWDHUB_CONFIG_PATH`)

## คำสั่ง

### `login` / `auth login`

- ค่าเริ่มต้น: เปิดเบราว์เซอร์ไปที่ `<site>/cli/auth` และดำเนินการให้เสร็จผ่าน callback แบบ loopback
- Headless: `clawhub login --token clh_...`
- Remote/headless interactive: `clawhub login --device` จะแสดงโค้ดและรอขณะที่คุณอนุญาตที่ `<site>/cli/device`

### `whoami`

- ตรวจสอบโทเค็นที่เก็บไว้ผ่าน `/api/v1/whoami`

### `star <slug>` / `unstar <slug>`

- เพิ่ม/ลบ skill จากรายการไฮไลต์ของคุณ
- เรียก `POST /api/v1/stars/<slug>` และ `DELETE /api/v1/stars/<slug>`
- `--yes` ข้ามการยืนยัน

### `search <query...>`

- เรียก `/api/v1/search?q=...`
- การค้นหาให้ความสำคัญกับ slug/name token ที่ตรงกันแบบ exact ก่อนความนิยมจากการดาวน์โหลด token slug แบบ standalone เช่น `map` จะตรงกับ `personal-map` ได้แรงกว่าสตริงย่อยภายใน `amap`
- จำนวนดาวน์โหลดเป็นเพียง prior ด้านความนิยมขนาดเล็ก ไม่ใช่การรับประกันว่าจะอยู่ลำดับบนสุด
- หาก skill ควรปรากฏแต่ไม่ปรากฏ ให้รัน `clawhub inspect <slug>` ขณะเข้าสู่ระบบเพื่อตรวจสอบ diagnostics ด้าน moderation ที่เจ้าของมองเห็นได้ ก่อนเปลี่ยนชื่อ metadata

### `explore`

- แสดงรายการ skills ใหม่ล่าสุดผ่าน `/api/v1/skills?limit=...&sort=createdAt` (เรียงตาม `createdAt` จากมากไปน้อย)
- แฟล็ก:
  - `--limit <n>` (1-200, ค่าเริ่มต้น: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (ค่าเริ่มต้น: newest)
  - `--json` (เอาต์พุตที่เครื่องอ่านได้)
- เอาต์พุต: `<slug>  v<version>  <age>  <summary>` (summary ถูกตัดให้เหลือ 50 อักขระ)

### `inspect <slug>`

- ดึง metadata ของ skill และไฟล์เวอร์ชันโดยไม่ติดตั้ง
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: latest)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-200)
- `--files`: แสดงรายการไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ raw (เฉพาะไฟล์ข้อความ; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `install <slug>`

- resolve เวอร์ชันล่าสุดผ่าน `/api/v1/skills/<slug>`
- ดาวน์โหลด zip ผ่าน `/api/v1/download`
- แตกไฟล์ไปยัง `<workdir>/<dir>/<slug>`
- ปฏิเสธการเขียนทับ skills ที่ถูก pin; ให้รัน `clawhub unpin <slug>` ก่อน
- เขียน:
  - `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

### `uninstall <slug>`

- ลบ `<workdir>/<dir>/<slug>` และลบรายการใน lockfile
- Interactive: ถามเพื่อยืนยัน
- Non-interactive (`--no-input`): ต้องใช้ `--yes`

### `list`

- อ่าน `<workdir>/.clawhub/lock.json` (ดั้งเดิม `.clawdhub`)
- แสดง `pinned` ถัดจาก skills ที่ถูกตรึงด้วย `clawhub pin` รวมถึงเหตุผลที่ระบุได้

### `pin <slug>`

- ทำเครื่องหมาย skill ที่ติดตั้งแล้วว่าเป็น pinned ใน lockfile
- `--reason <text>` บันทึกเหตุผลที่ skill ถูกตรึง
- Skills ที่ถูก pinned จะถูกข้ามโดย `update --all` และถูกปฏิเสธโดย `update <slug>` โดยตรง
- Skills ที่ถูก pinned ยังปฏิเสธ `install --force` ด้วย เพื่อไม่ให้ไบต์ในเครื่องถูกแทนที่โดยไม่ตั้งใจ

### `unpin <slug>`

- ลบ lockfile pin ออกจาก skill ที่ติดตั้งแล้ว เพื่อให้การอัปเดตในอนาคตแก้ไขได้

### `update [slug]` / `update --all`

- คำนวณ fingerprint จากไฟล์ในเครื่อง
- หาก fingerprint ตรงกับเวอร์ชันที่รู้จัก: ไม่มี prompt
- หาก fingerprint ไม่ตรง:
  - ปฏิเสธโดยค่าเริ่มต้น
  - เขียนทับด้วย `--force` (หรือ prompt หากเป็นแบบโต้ตอบ)
- Skills ที่ถูก pinned จะไม่ถูกอัปเดตด้วย `--force`
- `update <slug>` ล้มเหลวทันทีสำหรับ slugs ที่ถูก pinned และแจ้งให้คุณรัน `clawhub unpin <slug>` ก่อน
- `update --all` ข้าม slugs ที่ถูก pinned และพิมพ์สรุปว่าสิ่งใดยังคงถูกตรึงไว้

### `skill publish <path>`

- เผยแพร่ผ่าน `POST /api/v1/skills` (multipart)
- ต้องใช้ semver: `--version 1.2.3`
- `--owner <handle>` เผยแพร่ภายใต้ publisher handle ของ org/user เมื่อ
  actor มีสิทธิ์เข้าถึง publisher
- `--migrate-owner` ย้าย skill ที่มีอยู่ไปยัง `--owner` ขณะเผยแพร่
  เวอร์ชันใหม่ ต้องมีสิทธิ์ admin/owner บน publisher ทั้งสอง
- อธิบายพฤติกรรม owner และ review ไว้ใน `docs/publishing.md`
- การเผยแพร่ skill หมายความว่า skill นั้นถูกปล่อยภายใต้ `MIT-0` บน ClawHub
- Skills ที่เผยแพร่แล้วใช้งาน แก้ไข และแจกจ่ายต่อได้ฟรีโดยไม่ต้องระบุที่มา
- ClawHub ไม่รองรับ skills แบบเสียเงินหรือการตั้งราคาต่อ skill
- `--clawscan-note <text>` เพิ่มหมายเหตุ ClawScan หมายเหตุนี้ให้บริบทแก่ ClawScan
  สำหรับพฤติกรรมที่อาจดูผิดปกติ เช่น การเข้าถึงเครือข่าย
  การเข้าถึง native host หรือ credentials เฉพาะ provider หมายเหตุจะถูกจัดเก็บบน
  เวอร์ชันที่เผยแพร่แล้ว
- นามแฝงดั้งเดิม: `publish <path>`

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- soft-delete skill (owner, moderator หรือ admin)
- เรียก `DELETE /api/v1/skills/{slug}`
- soft deletes ที่ owner เริ่มต้นจะจอง slug ไว้ 30 วัน คำสั่งจะพิมพ์เวลาหมดอายุ
- `--reason <text>` บันทึกหมายเหตุ moderation บน skill และ audit log
- `--note <text>` เป็นนามแฝงของ `--reason`
- `--yes` ข้ามการยืนยัน

### `undelete <slug>`

- กู้คืน skill ที่ซ่อนอยู่ (owner, moderator หรือ admin)
- เรียก `POST /api/v1/skills/{slug}/undelete`
- `--reason <text>` บันทึกหมายเหตุ moderation บน skill และ audit log
- `--note <text>` เป็นนามแฝงของ `--reason`
- `--yes` ข้ามการยืนยัน

### `hide <slug>`

- ซ่อน skill (owner, moderator หรือ admin)
- นามแฝงของ `delete`

### `unhide <slug>`

- เลิกซ่อน skill (owner, moderator หรือ admin)
- นามแฝงของ `undelete`

### `skill rename <slug> <new-slug>`

- เปลี่ยนชื่อ skill ที่เป็นเจ้าของ และเก็บ slug เดิมไว้เป็น redirect alias
- เรียก `POST /api/v1/skills/{slug}/rename`
- `--yes` ข้ามการยืนยัน

### `skill merge <source-slug> <target-slug>`

- รวม skill ที่เป็นเจ้าของหนึ่งรายการเข้ากับ skill ที่เป็นเจ้าของอีกรายการหนึ่ง
- source slug จะหยุดแสดงแบบสาธารณะและกลายเป็น redirect alias ไปยัง target
- เรียก `POST /api/v1/skills/{sourceSlug}/merge`
- `--yes` ข้ามการยืนยัน

### `transfer`

- เวิร์กโฟลว์การโอน ownership
- การโอนไปยัง user handles จะสร้างคำขอ pending ที่ผู้รับต้องยอมรับ
- การโอนไปยัง org/publisher handles จะมีผลทันทีเฉพาะเมื่อ actor มี
  สิทธิ์ admin ทั้งกับ owner ปัจจุบันและ publisher ปลายทาง
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

- เรียกดูหรือค้นหา unified package catalog ผ่าน `GET /api/v1/packages` และ `GET /api/v1/packages/search`
- ใช้สิ่งนี้สำหรับ plugins และรายการ package-family อื่นๆ ส่วน `search` ระดับบนสุดยังคงเป็นพื้นผิวค้นหา skill
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

- ดึง metadata ของ package โดยไม่ติดตั้ง
- ใช้สิ่งนี้สำหรับ metadata, compatibility, verification, source และการตรวจสอบ version/file ของ Plugin
- `--version <version>`: ตรวจสอบเวอร์ชันเฉพาะ (ค่าเริ่มต้น: latest)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติด tag (เช่น `latest`)
- `--versions`: แสดงรายการประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-100)
- `--files`: แสดงรายการไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (ไฟล์ข้อความเท่านั้น; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `package download <name>`

- resolve เวอร์ชัน package ผ่าน
  `GET /api/v1/packages/{name}/versions/{version}/artifact`
- ดาวน์โหลด artifact จาก `downloadUrl` ของ resolver
- ตรวจสอบ ClawHub SHA-256 สำหรับ artifacts ทั้งหมด
- สำหรับ artifacts แบบ ClawPack npm-pack ยังตรวจสอบ npm `sha512` integrity,
  npm shasum และชื่อ/เวอร์ชัน `package.json` ของ tarball ด้วย
- เวอร์ชัน Legacy ZIP ดาวน์โหลดผ่าน route ของ legacy ZIP
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
- เมื่อใช้ `--package` จะ resolve metadata ที่คาดไว้จาก ClawHub และเปรียบเทียบ
  ไฟล์ในเครื่องกับ metadata ของ artifact ที่เผยแพร่แล้ว
- เมื่อใช้ flags digest โดยตรง จะตรวจสอบโดยไม่ lookup เครือข่าย
- Flags:
  - `--package <name>`: ชื่อ package เพื่อ resolve metadata ของ artifact ที่คาดไว้
  - `--version <version>` หรือ `--tag <tag>`: เวอร์ชัน package ที่คาดไว้
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
  หรือผู้ดูแลระบบแพลตฟอร์ม
- Flags:
  - `--yes`: ข้ามการยืนยัน
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- กู้คืนแพ็กเกจและรีลีสที่ถูก soft-delete
- ต้องเป็นเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลผู้เผยแพร่ขององค์กร, ผู้ดูแลการกลั่นกรองของแพลตฟอร์ม,
  หรือผู้ดูแลระบบแพลตฟอร์ม
- เรียก `POST /api/v1/packages/{name}/undelete`
- Flags:
  - `--yes`: ข้ามการยืนยัน
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- โอนแพ็กเกจไปยังผู้เผยแพร่อื่น
- ต้องมีสิทธิ์ผู้ดูแลทั้งเจ้าของแพ็กเกจปัจจุบันและผู้เผยแพร่ปลายทาง
  เว้นแต่ดำเนินการโดยผู้ดูแลระบบแพลตฟอร์ม
- ชื่อแพ็กเกจแบบมี scope ต้องโอนไปยังเจ้าของ scope ที่ตรงกัน
- เรียก `POST /api/v1/packages/{name}/transfer`
- Flags:
  - `--to <owner>`: handle ของผู้เผยแพร่ปลายทาง
  - `--reason <text>`: เหตุผลสำหรับการตรวจสอบที่ระบุหรือไม่ก็ได้
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- คำสั่งที่ต้องยืนยันตัวตนสำหรับรายงานแพ็กเกจไปยังผู้ดูแลการกลั่นกรอง
- เรียก `POST /api/v1/packages/{name}/report`
- รายงานอยู่ในระดับแพ็กเกจ ผูกกับเวอร์ชันได้หรือไม่ก็ได้ และจะมองเห็นได้
  สำหรับผู้ดูแลการกลั่นกรองเพื่อตรวจสอบ
- รายงานจะไม่ซ่อนแพ็กเกจหรือบล็อกการดาวน์โหลดโดยอัตโนมัติด้วยตัวเอง
- Flags:
  - `--version <version>`: เวอร์ชันแพ็กเกจที่จะแนบกับรายงาน ระบุหรือไม่ก็ได้
  - `--reason <text>`: เหตุผลรายงานที่จำเป็น
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- คำสั่งสำหรับเจ้าของเพื่อตรวจสอบการมองเห็นด้านการกลั่นกรองของแพ็กเกจ
- เรียก `GET /api/v1/packages/{name}/moderation`
- แสดงสถานะการสแกนแพ็กเกจปัจจุบัน จำนวนรายงานที่เปิดอยู่ สถานะการกลั่นกรองด้วยตนเองของรีลีสล่าสุด
  สถานะการบล็อกการดาวน์โหลด และเหตุผลการกลั่นกรอง
- Flags:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- ตรวจสอบว่าแพ็กเกจพร้อมสำหรับการใช้งานในอนาคตของ OpenClaw หรือไม่
- เรียก `GET /api/v1/packages/{name}/readiness`
- รายงานตัวบล็อกสำหรับสถานะทางการ, ความพร้อมใช้งานของ ClawPack, digest ของ artifact,
  provenance ของซอร์ส, ความเข้ากันได้กับ OpenClaw, เป้าหมายโฮสต์, metadata ของสภาพแวดล้อม,
  และสถานะการสแกน
- Flags:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- แสดงสถานะการย้ายที่เน้นผู้ปฏิบัติการสำหรับแพ็กเกจที่อาจแทนที่
  Plugin ของ OpenClaw ที่บันเดิลมา
- เรียก endpoint readiness ที่คำนวณแบบเดียวกับ `package readiness` แต่พิมพ์
  สถานะที่เน้นการย้าย เวอร์ชันล่าสุด สถานะแพ็กเกจทางการ การตรวจสอบ และ
  ตัวบล็อก
- Flags:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- เผยแพร่ Plugin แบบโค้ดหรือ Plugin แบบบันเดิลผ่าน `POST /api/v1/packages`
- `<source>` รองรับ:
  - เส้นทางโฟลเดอร์ในเครื่อง: `./my-plugin`
  - tarball npm-pack ของ ClawPack ในเครื่อง: `./my-plugin-1.2.3.tgz`
  - repo GitHub: `owner/repo` หรือ `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- ตรวจหา metadata โดยอัตโนมัติจาก `package.json`, `openclaw.plugin.json` และ
  marker บันเดิล OpenClaw จริง เช่น `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` และ `.cursor-plugin/plugin.json`
- ซอร์ส `.tgz` จะถูกถือเป็น ClawPack CLI อัปโหลดไบต์ npm-pack
  ที่ตรงทั้งหมด และใช้เนื้อหา `package/` ที่แตกออกมาเฉพาะสำหรับการตรวจสอบและ
  เติม metadata ล่วงหน้า
- โฟลเดอร์ Plugin แบบโค้ดจะถูกแพ็กเป็น tarball npm ของ ClawPack ก่อนอัปโหลด เพื่อให้
  การติดตั้ง OpenClaw ตรวจสอบ artifact ที่ตรงได้ โฟลเดอร์ Plugin แบบบันเดิลยังคง
  ใช้เส้นทางเผยแพร่แบบไฟล์ที่แตกออกมา
- สำหรับซอร์ส GitHub การระบุแหล่งที่มาของซอร์สจะถูกเติมอัตโนมัติจาก repo, commit ที่ resolve แล้ว, ref และ subpath
- สำหรับโฟลเดอร์ในเครื่อง การระบุแหล่งที่มาของซอร์สจะถูกตรวจหาอัตโนมัติจาก git ในเครื่องเมื่อ remote origin ชี้ไปที่ GitHub
- Plugin แบบโค้ดภายนอกต้องประกาศ `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion` อย่างชัดเจน
  `package.json.version` ระดับบนสุดจะไม่ถูกใช้เป็น fallback สำหรับการตรวจสอบการเผยแพร่
- `--dry-run` แสดงตัวอย่าง payload การเผยแพร่ที่ resolve แล้วโดยไม่อัปโหลด
- `--json` ส่งเอาต์พุตที่เครื่องอ่านได้สำหรับ CI
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่ของผู้ใช้หรือองค์กรเมื่อ actor มีสิทธิ์เข้าถึงผู้เผยแพร่
- `--clawscan-note <text>` เพิ่มหมายเหตุ ClawScan หมายเหตุนี้ให้บริบทแก่ ClawScan
  สำหรับพฤติกรรมที่อาจดูผิดปกติ เช่น การเข้าถึงเครือข่าย,
  การเข้าถึงโฮสต์แบบ native หรือ credentials เฉพาะ provider หมายเหตุจะถูกเก็บไว้บน
  รีลีสที่เผยแพร่
- ชื่อแพ็กเกจแบบมี scope ต้องตรงกับเจ้าของที่เลือก ดู `docs/publishing.md`
- flags ที่มีอยู่ (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ยังทำงานเป็น overrides
- repo GitHub แบบส่วนตัวต้องใช้ `GITHUB_TOKEN`

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### โฟลว์ในเครื่องที่แนะนำ

ใช้ `--dry-run` ก่อน เพื่อให้คุณยืนยัน metadata แพ็กเกจที่ resolve แล้วและ
การระบุแหล่งที่มาของซอร์สก่อนสร้างรีลีสจริงได้:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### โฟลว์โฟลเดอร์ในเครื่อง

สำหรับ Plugin แบบโค้ด การเผยแพร่โฟลเดอร์จะสร้างและอัปโหลด artifact ClawPack จาก
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

- `package.json.version` คือเวอร์ชันรีลีสแพ็กเกจของคุณ แต่จะไม่ถูกใช้เป็น
  fallback สำหรับการตรวจสอบความเข้ากันได้/บิลด์ของ OpenClaw
- `openclaw.hostTargets` และ `openclaw.environment` เป็น metadata ที่ระบุหรือไม่ก็ได้
  ClawHub อาจแสดงข้อมูลเหล่านี้เมื่อมีอยู่ แต่ไม่จำเป็นสำหรับการเผยแพร่
- `openclaw.compat.minGatewayVersion` และ
  `openclaw.build.pluginSdkVersion` เป็นส่วนเพิ่มเติมที่ระบุหรือไม่ก็ได้ หากคุณต้องการเผยแพร่
  metadata ความเข้ากันได้ที่ละเอียดขึ้น
- หากคุณกำลังใช้ `clawhub` CLI รุ่นเก่า ให้อัปเกรดก่อนเผยแพร่ เพื่อให้
  การตรวจสอบ preflight ในเครื่องทำงานก่อนอัปโหลด

#### GitHub Actions

ClawHub ยังมาพร้อม workflow แบบใช้ซ้ำอย่างเป็นทางการที่
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/c51cfe2459f3482c315a7c8c71b2efd2637bb0e8/.github/workflows/package-publish.yml)
สำหรับ repo Plugin

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

- workflow แบบใช้ซ้ำตั้งค่า `source` เป็น repo ของ caller โดยค่าเริ่มต้น
- สำหรับ monorepo ให้ส่ง `source_path` เพื่อให้ workflow เผยแพร่โฟลเดอร์แพ็กเกจ
  Plugin เช่น `source_path: extensions/codex`
- pin workflow แบบใช้ซ้ำกับ tag ที่เสถียรหรือ SHA commit แบบเต็ม อย่าเรียกใช้การเผยแพร่รีลีสจาก `@main`
- `pull_request` ควรใช้ `dry_run: true` เพื่อให้ CI ไม่สร้างผลข้างเคียง
- การเผยแพร่จริงควรจำกัดไว้เฉพาะ event ที่เชื่อถือได้ เช่น `workflow_dispatch` หรือ push tag
- trusted publishing โดยไม่มี secret ทำงานเฉพาะบน `workflow_dispatch` เท่านั้น; push tag ยังต้องใช้ `clawhub_token`
- เก็บ `clawhub_token` ให้พร้อมสำหรับการเผยแพร่ครั้งแรก, แพ็กเกจที่ไม่น่าเชื่อถือ หรือการเผยแพร่แบบ break-glass
- workflow อัปโหลดผลลัพธ์ JSON เป็น artifact และเปิดเผยเป็น workflow outputs

### `sync`

- สแกนหาโฟลเดอร์ Skills ในเครื่องและเผยแพร่รายการใหม่/ที่เปลี่ยนแปลง
- รูทเป็นโฟลเดอร์ใดก็ได้: ไดเรกทอรี Skills หรือโฟลเดอร์ Skills เดี่ยวที่มี `SKILL.md`
- เพิ่มรูท Skills ของ Clawdbot โดยอัตโนมัติเมื่อมี `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (agent หลัก)
  - `routing.agents.*.workspace/skills` (ต่อ agent)
  - `~/.clawdbot/skills` (แชร์)
  - `skills.load.extraDirs` (แพ็กที่แชร์)
- เคารพ `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` และ `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`
- Flags:
  - `--root <dir...>` รูทสแกนเพิ่มเติม
  - `--all` อัปโหลดโดยไม่ถาม
  - `--dry-run` แสดงเฉพาะแผน
  - `--bump patch|minor|major` (ค่าเริ่มต้น: patch)
  - `--changelog <text>` (ไม่โต้ตอบ)
  - `--tags a,b,c` (ค่าเริ่มต้น: latest)
  - `--concurrency <n>` (ค่าเริ่มต้น: 4)

Telemetry:

- ส่งระหว่าง `sync` เมื่อเข้าสู่ระบบอยู่ เว้นแต่ `CLAWHUB_DISABLE_TELEMETRY=1` (legacy `CLAWDHUB_DISABLE_TELEMETRY=1`)
- รายละเอียด: `docs/telemetry.md`
