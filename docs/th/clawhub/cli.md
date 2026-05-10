---
read_when:
    - การใช้ ClawHub CLI
    - การแก้ไขปัญหาการติดตั้ง การอัปเดต การเผยแพร่ หรือการซิงค์
summary: 'เอกสารอ้างอิง CLI: คำสั่ง, แฟล็ก, การกำหนดค่า, ไฟล์ล็อก, พฤติกรรมการซิงค์.'
x-i18n:
    generated_at: "2026-05-10T19:26:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8e43780c82c9d540bf99e677788df8913532adb3d237d20d96f575f621eae3
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

- `--workdir <dir>`: ไดเรกทอรีทำงาน (ค่าเริ่มต้น: cwd; ถ้ากำหนดไว้ จะถอยกลับไปใช้พื้นที่ทำงานของ Clawdbot)
- `--dir <dir>`: ไดเรกทอรีติดตั้งใต้ไดเรกทอรีทำงาน (ค่าเริ่มต้น: `skills`)
- `--site <url>`: URL ฐานสำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `https://clawhub.ai`)
- `--registry <url>`: URL ฐานของ API (ค่าเริ่มต้น: ค้นพบอัตโนมัติ มิฉะนั้นใช้ `https://clawhub.ai`)
- `--no-input`: ปิดใช้พรอมป์

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

สิ่งนี้จำเป็นบนระบบที่บล็อกการเชื่อมต่อขาออกโดยตรง
(เช่น คอนเทนเนอร์ Docker, Hetzner VPS ที่ใช้อินเทอร์เน็ตได้ผ่านพร็อกซีเท่านั้น, ไฟร์วอลล์องค์กร)

ตัวอย่าง:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

เมื่อไม่ได้ตั้งค่าตัวแปรพร็อกซี ลักษณะการทำงานจะไม่เปลี่ยนแปลง (เชื่อมต่อโดยตรง)

## ไฟล์กำหนดค่า

เก็บโทเค็น API ของคุณและ URL รีจิสทรีที่แคชไว้

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` หรือ `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- ทางเลือกสำรองแบบเดิม: หาก `clawhub/config.json` ยังไม่มีอยู่ แต่มี `clawdhub/config.json` แล้ว CLI จะใช้พาธเดิมซ้ำ
- เขียนทับ: `CLAWHUB_CONFIG_PATH` (เดิม `CLAWDHUB_CONFIG_PATH`)

## คำสั่ง

### `login` / `auth login`

- ค่าเริ่มต้น: เปิดเบราว์เซอร์ไปที่ `<site>/cli/auth` และทำให้เสร็จผ่านคอลแบ็กแบบวนกลับภายในเครื่อง
- แบบไม่มีหน้าจอ: `clawhub login --token clh_...`
- แบบโต้ตอบจากระยะไกล/ไม่มีหน้าจอ: `clawhub login --device` จะแสดงรหัสและรอขณะที่คุณอนุญาตที่ `<site>/cli/device`

### `whoami`

- ตรวจสอบโทเค็นที่เก็บไว้ผ่าน `/api/v1/whoami`

### `star <slug>` / `unstar <slug>`

- เพิ่ม/ลบ Skills จากไฮไลต์ของคุณ
- เรียก `POST /api/v1/stars/<slug>` และ `DELETE /api/v1/stars/<slug>`
- `--yes` ข้ามการยืนยัน

### `search <query...>`

- เรียก `/api/v1/search?q=...`
- การค้นหาจะให้ความสำคัญกับการจับคู่โทเค็น slug/ชื่อที่ตรงกันพอดีก่อนความนิยมจากยอดดาวน์โหลด โทเค็น slug แบบเดี่ยว เช่น `map` จะจับคู่กับ `personal-map` ได้แรงกว่าสตริงย่อยภายใน `amap`
- ยอดดาวน์โหลดเป็นเพียงตัวชี้นำความนิยมขนาดเล็ก ไม่ใช่การรับประกันว่าจะได้ตำแหน่งบนสุด
- หาก Skills ควรปรากฏแต่ไม่ปรากฏ ให้รัน `clawhub inspect <slug>` ขณะเข้าสู่ระบบเพื่อตรวจสอบการวินิจฉัยการกลั่นกรองที่เจ้าของมองเห็นได้ก่อนเปลี่ยนชื่อเมตาดาต้า

### `explore`

- แสดงรายการ Skills ใหม่ล่าสุดผ่าน `/api/v1/skills?limit=...&sort=createdAt` (เรียงตาม `createdAt` จากมากไปน้อย)
- แฟล็ก:
  - `--limit <n>` (1-200, ค่าเริ่มต้น: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (ค่าเริ่มต้น: newest)
  - `--json` (เอาต์พุตที่เครื่องอ่านได้)
- เอาต์พุต: `<slug>  v<version>  <age>  <summary>` (สรุปถูกตัดให้เหลือ 50 อักขระ)

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

- หาเวอร์ชันล่าสุดผ่าน `/api/v1/skills/<slug>`
- ดาวน์โหลด zip ผ่าน `/api/v1/download`
- แตกไฟล์ไปที่ `<workdir>/<dir>/<slug>`
- ปฏิเสธการเขียนทับ Skills ที่ปักหมุดไว้; ให้รัน `clawhub unpin <slug>` ก่อน
- เขียน:
  - `<workdir>/.clawhub/lock.json` (เดิม `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (เดิม `.clawdhub`)

### `uninstall <slug>`

- ลบ `<workdir>/<dir>/<slug>` และลบรายการใน lockfile
- แบบโต้ตอบ: ขอการยืนยัน
- ไม่โต้ตอบ (`--no-input`): ต้องมี `--yes`

### `list`

- อ่าน `<workdir>/.clawhub/lock.json` (เดิม `.clawdhub`)
- แสดง `pinned` ถัดจาก Skills ที่ถูกตรึงด้วย `clawhub pin` รวมถึงเหตุผลเพิ่มเติม ถ้ามี

### `pin <slug>`

- ทำเครื่องหมาย Skills ที่ติดตั้งแล้วว่าถูกปักหมุดไว้ในไฟล์ล็อก
- `--reason <text>` บันทึกเหตุผลว่าทำไม Skills จึงถูกตรึงไว้
- Skills ที่ถูกปักหมุดจะถูกข้ามโดย `update --all` และถูกปฏิเสธโดย `update <slug>` โดยตรง
- Skills ที่ถูกปักหมุดยังปฏิเสธ `install --force` ด้วย เพื่อไม่ให้ไบต์ในเครื่องถูกแทนที่โดยไม่ตั้งใจ

### `unpin <slug>`

- ลบการปักหมุดในไฟล์ล็อกจาก Skills ที่ติดตั้งแล้ว เพื่อให้การอัปเดตในอนาคตแก้ไขได้

### `update [slug]` / `update --all`

- คำนวณลายนิ้วมือจากไฟล์ในเครื่อง
- ถ้าลายนิ้วมือตรงกับเวอร์ชันที่รู้จัก: ไม่มีพรอมป์
- ถ้าลายนิ้วมือไม่ตรง:
  - ปฏิเสธตามค่าเริ่มต้น
  - เขียนทับด้วย `--force` (หรือพรอมป์ ถ้าเป็นแบบโต้ตอบ)
- Skills ที่ถูกปักหมุดจะไม่ถูกอัปเดตโดย `--force`
- `update <slug>` ล้มเหลวทันทีสำหรับสลักที่ถูกปักหมุด และบอกให้คุณรัน `clawhub unpin <slug>` ก่อน
- `update --all` ข้ามสลักที่ถูกปักหมุดและพิมพ์สรุปว่าสิ่งใดยังคงถูกตรึงไว้

### `skill publish <path>`

- เผยแพร่ผ่าน `POST /api/v1/skills` (หลายส่วน)
- ต้องใช้เวอร์ชันเชิงความหมาย: `--version 1.2.3`
- `--owner <handle>` เผยแพร่ภายใต้แฮนเดิลผู้เผยแพร่ขององค์กร/ผู้ใช้ เมื่อผู้ดำเนินการมีสิทธิ์เข้าถึงผู้เผยแพร่
- `--migrate-owner` ย้าย Skills ที่มีอยู่ไปยัง `--owner` ขณะเผยแพร่เวอร์ชันใหม่ ต้องมีสิทธิ์ผู้ดูแลระบบ/เจ้าของบนผู้เผยแพร่ทั้งสองฝ่าย
- พฤติกรรมของเจ้าของและการตรวจทานอธิบายไว้ใน `docs/publishing.md`
- การเผยแพร่ Skills หมายความว่าเผยแพร่ภายใต้ `MIT-0` บน ClawHub
- Skills ที่เผยแพร่แล้วสามารถใช้งาน แก้ไข และแจกจ่ายต่อได้ฟรีโดยไม่ต้องระบุแหล่งที่มา
- ClawHub ไม่รองรับ Skills แบบชำระเงินหรือการตั้งราคาต่อ Skills
- นามแฝงเดิม: `publish <path>`

### `delete <slug>`

- ลบ Skills แบบซ่อนชั่วคราว (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- เรียก `DELETE /api/v1/skills/{slug}`
- การลบแบบซ่อนชั่วคราวที่เริ่มโดยเจ้าของจะสงวนสลักไว้ 30 วัน; คำสั่งจะพิมพ์เวลาหมดอายุ
- `--reason <text>` บันทึกหมายเหตุการกลั่นกรองบน Skills และบันทึกการตรวจสอบ
- `--note <text>` เป็นนามแฝงของ `--reason`
- `--yes` ข้ามการยืนยัน

### `undelete <slug>`

- กู้คืน Skills ที่ซ่อนอยู่ (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- เรียก `POST /api/v1/skills/{slug}/undelete`
- `--reason <text>` บันทึกหมายเหตุการกลั่นกรองบน Skills และบันทึกการตรวจสอบ
- `--note <text>` เป็นนามแฝงของ `--reason`
- `--yes` ข้ามการยืนยัน

### `hide <slug>`

- ซ่อน Skills (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- นามแฝงของ `delete`

### `unhide <slug>`

- เลิกซ่อน Skills (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- นามแฝงของ `undelete`

### `skill rename <slug> <new-slug>`

- เปลี่ยนชื่อ Skills ที่เป็นเจ้าของและเก็บสลักก่อนหน้าไว้เป็นนามแฝงสำหรับเปลี่ยนเส้นทาง
- เรียก `POST /api/v1/skills/{slug}/rename`
- `--yes` ข้ามการยืนยัน

### `skill merge <source-slug> <target-slug>`

- ผสาน Skills ที่เป็นเจ้าของหนึ่งรายการเข้ากับ Skills ที่เป็นเจ้าของอีกรายการ
- สลักต้นทางหยุดแสดงรายการต่อสาธารณะและกลายเป็นนามแฝงสำหรับเปลี่ยนเส้นทางไปยังเป้าหมาย
- เรียก `POST /api/v1/skills/{sourceSlug}/merge`
- `--yes` ข้ามการยืนยัน

### `skill rescan <slug>`

- ขอให้สแกนความปลอดภัยอีกครั้งสำหรับเวอร์ชัน Skills ที่เผยแพร่ล่าสุด
- เจ้าของและผู้ดูแลผู้เผยแพร่สามารถสแกน Skills ของตนเองซ้ำได้จนถึงขีดจำกัดการกู้คืนต่อเวอร์ชัน
- ผู้ดูแลและผู้ดูแลระบบของแพลตฟอร์มสามารถสแกน Skills ใดก็ได้ซ้ำและไม่ถูกบล็อกโดยขีดจำกัดการกู้คืนของเจ้าของ แม้ว่าจะมีการสแกนซ้ำได้เพียงหนึ่งรายการต่อครั้งต่อเวอร์ชัน
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
- คำสั่งย่อย:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- ปลายทาง:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- เรียกดูหรือค้นหาแค็ตตาล็อกแพ็กเกจแบบรวมผ่าน `GET /api/v1/packages` และ `GET /api/v1/packages/search`
- ใช้สิ่งนี้สำหรับ Plugin และรายการตระกูลแพ็กเกจอื่น ๆ; `search` ระดับบนสุดยังคงเป็นพื้นผิวการค้นหา Skills
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

- ดึงเมทาดาทาแพ็กเกจโดยไม่ติดตั้ง
- ใช้สิ่งนี้สำหรับเมทาดาทา ความเข้ากันได้ การตรวจสอบยืนยัน แหล่งที่มา และการตรวจสอบเวอร์ชัน/ไฟล์ของ Plugin
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
- ตรวจสอบยืนยัน ClawHub SHA-256 สำหรับอาร์ติแฟกต์ทั้งหมด
- สำหรับอาร์ติแฟกต์ ClawPack npm-pack ยังตรวจสอบยืนยันความถูกต้องของ npm `sha512`, shasum ของ npm และชื่อ/เวอร์ชันใน `package.json` ของทาร์บอลด้วย
- เวอร์ชัน ZIP เดิมดาวน์โหลดผ่านเส้นทาง ZIP เดิม
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

- คำนวณ ClawHub SHA-256, ความถูกต้องของ npm `sha512` และ shasum ของ npm สำหรับอาร์ติแฟกต์ในเครื่อง
- เมื่อใช้ `--package` จะแก้ไขเมทาดาทาที่คาดหวังจาก ClawHub และเปรียบเทียบไฟล์ในเครื่องกับเมทาดาทาอาร์ติแฟกต์ที่เผยแพร่แล้ว
- เมื่อใช้แฟล็กไดเจสต์โดยตรง จะตรวจสอบยืนยันโดยไม่ต้องค้นหาผ่านเครือข่าย
- แฟล็ก:
  - `--package <name>`: ชื่อแพ็กเกจสำหรับแก้ไขเมทาดาทาอาร์ติแฟกต์ที่คาดหวัง
  - `--version <version>` หรือ `--tag <tag>`: เวอร์ชันแพ็กเกจที่คาดหวัง
  - `--sha256 <hex>`: ClawHub SHA-256 ที่คาดหวัง
  - `--npm-integrity <sri>`: ความถูกต้องของ npm ที่คาดหวัง
  - `--npm-shasum <sha1>`: shasum ของ npm ที่คาดหวัง
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- ลบแบบ soft-delete แพ็กเกจและรีลีสทั้งหมด
- ต้องเป็นเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลระบบของผู้เผยแพร่องค์กร, ผู้ควบคุมแพลตฟอร์ม,
  หรือผู้ดูแลระบบแพลตฟอร์ม
- Flags:
  - `--yes`: ข้ามการยืนยัน
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package rescan <name>`

- ขอให้สแกนความปลอดภัยซ้ำสำหรับรีลีสแพ็กเกจที่เผยแพร่ล่าสุด
- เจ้าของและผู้ดูแลระบบผู้เผยแพร่สามารถสแกนแพ็กเกจของตนเองซ้ำได้จนถึงขีดจำกัด
  การกู้คืนต่อรีลีส
- ผู้ควบคุมและผู้ดูแลระบบแพลตฟอร์มสามารถสแกนแพ็กเกจใดก็ได้ซ้ำ และจะไม่ถูกบล็อกโดย
  ขีดจำกัดการกู้คืนของเจ้าของ แม้ว่าจะมีการสแกนซ้ำได้ครั้งละหนึ่งรายการต่อรีลีสเท่านั้น
- เรียก `POST /api/v1/packages/{name}/rescan`
- Flags:
  - `--yes`: ข้ามการยืนยัน
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package rescan @openclaw/example-plugin --yes
```

### `package report`

- คำสั่งที่ต้องยืนยันตัวตนสำหรับรายงานแพ็กเกจต่อผู้ควบคุม
- เรียก `POST /api/v1/packages/{name}/report`
- รายงานอยู่ในระดับแพ็กเกจ สามารถผูกกับเวอร์ชันได้ตามต้องการ และจะปรากฏ
  ให้ผู้ควบคุมตรวจสอบ
- รายงานจะไม่ซ่อนแพ็กเกจโดยอัตโนมัติหรือบล็อกการดาวน์โหลดด้วยตัวเอง
- Flags:
  - `--version <version>`: เวอร์ชันแพ็กเกจที่ต้องการแนบกับรายงาน ไม่บังคับ
  - `--reason <text>`: เหตุผลของรายงาน จำเป็นต้องระบุ
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package appeal`

- คำสั่งของเจ้าของ/ผู้เผยแพร่สำหรับอุทธรณ์การควบคุมรีลีส
- เรียก `POST /api/v1/packages/{name}/appeal`
- รับคำอุทธรณ์สำหรับรีลีสที่ถูกกักกัน เพิกถอน น่าสงสัย หรือเป็นอันตราย
- Flags:
  - `--version <version>`: เวอร์ชันแพ็กเกจ จำเป็นต้องระบุ
  - `--message <text>`: ข้อความอุทธรณ์ จำเป็นต้องระบุ
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package appeal @openclaw/example-plugin --version 1.2.3 --message "linked source release explains the native binary"
```

### `package moderation-status`

- คำสั่งของเจ้าของสำหรับตรวจสอบการมองเห็นด้านการควบคุมของแพ็กเกจ
- เรียก `GET /api/v1/packages/{name}/moderation`
- แสดงสถานะการสแกนแพ็กเกจปัจจุบัน จำนวนรายงานที่เปิดอยู่ สถานะการควบคุมด้วยตนเอง
  ของรีลีสล่าสุด สถานะการบล็อกการดาวน์โหลด และเหตุผลการควบคุม
- Flags:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- ตรวจสอบว่าแพ็กเกจพร้อมสำหรับการใช้งานโดย OpenClaw ในอนาคตหรือไม่
- เรียก `GET /api/v1/packages/{name}/readiness`
- รายงานตัวบล็อกสำหรับสถานะทางการ ความพร้อมใช้งานของ ClawPack ไดเจสต์ของอาร์ติแฟกต์
  แหล่งที่มาของซอร์ส ความเข้ากันได้กับ OpenClaw เป้าหมายโฮสต์ เมตาดาต้าสภาพแวดล้อม
  และสถานะการสแกน
- Flags:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- แสดงสถานะการย้ายข้อมูลที่มุ่งเน้นผู้ปฏิบัติการสำหรับแพ็กเกจที่อาจแทนที่
  Plugin OpenClaw ที่รวมมา
- เรียก endpoint ความพร้อมที่คำนวณเดียวกับ `package readiness` แต่พิมพ์
  สถานะที่เน้นการย้ายข้อมูล เวอร์ชันล่าสุด สถานะแพ็กเกจทางการ การตรวจสอบ และ
  ตัวบล็อก
- Flags:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- เผยแพร่ code Plugin หรือ bundle Plugin ผ่าน `POST /api/v1/packages`
- `<source>` รับค่า:
  - พาธโฟลเดอร์ในเครื่อง: `./my-plugin`
  - tarball ของ ClawPack npm-pack ในเครื่อง: `./my-plugin-1.2.3.tgz`
  - repo GitHub: `owner/repo` หรือ `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- ตรวจจับเมตาดาต้าโดยอัตโนมัติจาก `package.json`, `openclaw.plugin.json` และ
  marker ของ bundle OpenClaw จริง เช่น `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` และ `.cursor-plugin/plugin.json`
- แหล่งที่มา `.tgz` จะถูกถือเป็น ClawPack CLI จะอัปโหลดไบต์ npm-pack
  ตามจริง และใช้เนื้อหา `package/` ที่แตกออกมาเพื่อการตรวจสอบและ
  เติมเมตาดาต้าล่วงหน้าเท่านั้น
- โฟลเดอร์ code-plugin จะถูกแพ็กเป็น tarball ของ ClawPack npm ก่อนอัปโหลด เพื่อให้
  การติดตั้ง OpenClaw ตรวจสอบอาร์ติแฟกต์ตามจริงได้ โฟลเดอร์ bundle-plugin ยังคง
  ใช้เส้นทางเผยแพร่แบบไฟล์ที่แตกออกมา
- สำหรับแหล่งที่มา GitHub การระบุแหล่งที่มาของซอร์สจะเติมอัตโนมัติจาก repo, commit ที่ resolve แล้ว, ref และ subpath
- สำหรับโฟลเดอร์ในเครื่อง การระบุแหล่งที่มาของซอร์สจะตรวจจับอัตโนมัติจาก git ในเครื่องเมื่อ remote origin ชี้ไปที่ GitHub
- code Plugin ภายนอกต้องประกาศ `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion` อย่างชัดเจน
  `package.json.version` ระดับบนสุดจะไม่ถูกใช้เป็น fallback สำหรับการตรวจสอบการเผยแพร่
- `--dry-run` แสดงตัวอย่าง payload การเผยแพร่ที่ resolve แล้วโดยไม่อัปโหลด
- `--json` ส่งเอาต์พุตที่เครื่องอ่านได้สำหรับ CI
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่ของผู้ใช้หรือองค์กรเมื่อ actor มีสิทธิ์เข้าถึงผู้เผยแพร่
- ชื่อแพ็กเกจแบบ scoped ต้องตรงกับเจ้าของที่เลือก ดู `docs/publishing.md`
- Flags เดิม (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ยังคงใช้เป็น overrides ได้
- repo GitHub แบบส่วนตัวต้องใช้ `GITHUB_TOKEN`

#### โฟลว์ในเครื่องที่แนะนำ

ใช้ `--dry-run` ก่อน เพื่อให้คุณยืนยันเมตาดาต้าแพ็กเกจและ
การระบุแหล่งที่มาของซอร์สที่ resolve แล้วก่อนสร้างรีลีสจริง:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### โฟลว์โฟลเดอร์ในเครื่อง

สำหรับ code Plugin การเผยแพร่จากโฟลเดอร์จะสร้างและอัปโหลดอาร์ติแฟกต์ ClawPack จาก
โฟลเดอร์แพ็กเกจ:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` ขั้นต่ำสำหรับ `--family code-plugin`

code Plugin ภายนอกต้องมีเมตาดาต้า OpenClaw จำนวนเล็กน้อยใน
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
  fallback สำหรับการตรวจสอบความเข้ากันได้/การ build ของ OpenClaw
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมตาดาต้าที่ไม่บังคับ
  ClawHub อาจแสดงเมื่อมีอยู่ แต่ไม่จำเป็นสำหรับการเผยแพร่
- `openclaw.compat.minGatewayVersion` และ
  `openclaw.build.pluginSdkVersion` เป็นรายการเสริมที่ไม่บังคับ หากคุณต้องการเผยแพร่
  เมตาดาต้าความเข้ากันได้ที่ละเอียดขึ้น
- หากคุณใช้ CLI `clawhub` รีลีสเก่า ให้อัปเกรดก่อนเผยแพร่เพื่อให้
  การตรวจสอบ preflight ในเครื่องทำงานก่อนอัปโหลด

#### GitHub Actions

ClawHub ยังมาพร้อม workflow ที่นำกลับมาใช้ซ้ำอย่างเป็นทางการที่
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/2dcaf25d23c4e19b9c14f705c2ce1fd1dc2949c1/.github/workflows/package-publish.yml)
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

- workflow ที่นำกลับมาใช้ซ้ำจะตั้งค่าเริ่มต้นของ `source` เป็น repo ของ caller
- สำหรับ monorepo ให้ส่ง `source_path` เพื่อให้ workflow เผยแพร่โฟลเดอร์แพ็กเกจ
  Plugin เช่น `source_path: extensions/codex`
- Pin workflow ที่นำกลับมาใช้ซ้ำกับ tag ที่เสถียรหรือ commit SHA แบบเต็ม อย่าเรียกใช้การเผยแพร่รีลีสจาก `@main`
- `pull_request` ควรใช้ `dry_run: true` เพื่อให้ CI ไม่สร้างมลพิษ
- การเผยแพร่จริงควรจำกัดไว้ที่เหตุการณ์ที่เชื่อถือได้ เช่น `workflow_dispatch` หรือการ push tag
- การเผยแพร่ที่เชื่อถือได้โดยไม่มี secret ใช้ได้เฉพาะบน `workflow_dispatch`; การ push tag ยังต้องใช้ `clawhub_token`
- ให้ `clawhub_token` พร้อมใช้งานสำหรับการเผยแพร่ครั้งแรก แพ็กเกจที่ไม่น่าเชื่อถือ หรือการเผยแพร่แบบ break-glass
- workflow อัปโหลดผลลัพธ์ JSON เป็นอาร์ติแฟกต์และเปิดเผยเป็นเอาต์พุตของ workflow

### `sync`

- สแกนหาโฟลเดอร์ Skills ในเครื่องและเผยแพร่รายการใหม่/ที่เปลี่ยนแปลง
- Roots สามารถเป็นโฟลเดอร์ใดก็ได้: ไดเรกทอรี skills หรือโฟลเดอร์ skill เดี่ยวที่มี `SKILL.md`
- เพิ่ม root ของ skill Clawdbot โดยอัตโนมัติเมื่อมี `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (agent หลัก)
  - `routing.agents.*.workspace/skills` (ต่อ agent)
  - `~/.clawdbot/skills` (ใช้ร่วมกัน)
  - `skills.load.extraDirs` (แพ็กที่ใช้ร่วมกัน)
- เคารพ `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` และ `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`
- Flags:
  - `--root <dir...>` root การสแกนเพิ่มเติม
  - `--all` อัปโหลดโดยไม่ถาม
  - `--dry-run` แสดงเฉพาะแผน
  - `--bump patch|minor|major` (ค่าเริ่มต้น: patch)
  - `--changelog <text>` (ไม่โต้ตอบ)
  - `--tags a,b,c` (ค่าเริ่มต้น: latest)
  - `--concurrency <n>` (ค่าเริ่มต้น: 4)

Telemetry:

- ส่งระหว่าง `sync` เมื่อเข้าสู่ระบบแล้ว เว้นแต่ `CLAWHUB_DISABLE_TELEMETRY=1` (แบบเดิม `CLAWDHUB_DISABLE_TELEMETRY=1`)
- รายละเอียด: `docs/telemetry.md`
