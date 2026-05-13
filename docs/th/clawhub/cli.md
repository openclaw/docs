---
read_when:
    - การใช้ ClawHub CLI
    - การดีบักการติดตั้ง การอัปเดต การเผยแพร่ หรือการซิงค์
summary: 'เอกสารอ้างอิง CLI: คำสั่ง, แฟล็ก, การกำหนดค่า, ไฟล์ล็อก, ลักษณะการทำงานของการซิงค์'
x-i18n:
    generated_at: "2026-05-13T04:17:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98c1886f2df29dd9489d18d4813f0f7df6c365b47888035fe12d2b05871cdf17
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

- `--workdir <dir>`: ไดเรกทอรีทำงาน (ค่าเริ่มต้น: cwd; ถ้ากำหนดไว้ จะถอยกลับไปใช้เวิร์กสเปซ Clawdbot)
- `--dir <dir>`: ไดเรกทอรีติดตั้งใต้ workdir (ค่าเริ่มต้น: `skills`)
- `--site <url>`: URL ฐานสำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `https://clawhub.ai`)
- `--registry <url>`: URL ฐานของ API (ค่าเริ่มต้น: ค้นพบอัตโนมัติ มิฉะนั้นใช้ `https://clawhub.ai`)
- `--no-input`: ปิดใช้งานพรอมป์

ตัวแปรสภาพแวดล้อมที่เทียบเท่า:

- `CLAWHUB_SITE` (เดิม `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (เดิม `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (เดิม `CLAWDHUB_WORKDIR`)

### พร็อกซี HTTP

CLI รองรับตัวแปรสภาพแวดล้อมพร็อกซี HTTP มาตรฐานสำหรับระบบที่อยู่หลัง
พร็อกซีองค์กรหรือเครือข่ายที่จำกัด:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

เมื่อตั้งค่าตัวแปรใดตัวแปรหนึ่งเหล่านี้ CLI จะกำหนดเส้นทางคำขอขาออกผ่าน
พร็อกซีที่ระบุ `HTTPS_PROXY` ใช้สำหรับคำขอ HTTPS, `HTTP_PROXY`
ใช้สำหรับ HTTP แบบปกติ และรองรับ `NO_PROXY` / `no_proxy` เพื่อข้ามพร็อกซีสำหรับ
โฮสต์หรือโดเมนที่ระบุ

สิ่งนี้จำเป็นในระบบที่การเชื่อมต่อขาออกโดยตรงถูกบล็อก
(เช่น คอนเทนเนอร์ Docker, Hetzner VPS ที่ใช้อินเทอร์เน็ตผ่านพร็อกซีเท่านั้น, ไฟร์วอลล์องค์กร)

ตัวอย่าง:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

เมื่อไม่ได้ตั้งค่าตัวแปรพร็อกซี พฤติกรรมจะไม่เปลี่ยนแปลง (เชื่อมต่อโดยตรง)

## ไฟล์กำหนดค่า

จัดเก็บโทเค็น API ของคุณ + URL รีจิสทรีที่แคชไว้

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` หรือ `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- ทางเลือกเดิม: หาก `clawhub/config.json` ยังไม่มีอยู่ แต่มี `clawdhub/config.json` อยู่ CLI จะนำพาธเดิมมาใช้ซ้ำ
- แทนที่ค่า: `CLAWHUB_CONFIG_PATH` (เดิม `CLAWDHUB_CONFIG_PATH`)

## คำสั่ง

### `login` / `auth login`

- ค่าเริ่มต้น: เปิดเบราว์เซอร์ไปที่ `<site>/cli/auth` และดำเนินการให้เสร็จผ่านคอลแบ็ก local loopback
- แบบไม่มีหน้าจอ: `clawhub login --token clh_...`
- แบบโต้ตอบระยะไกล/ไม่มีหน้าจอ: `clawhub login --device` พิมพ์รหัสและรอระหว่างที่คุณอนุญาตที่ `<site>/cli/device`

### `whoami`

- ตรวจสอบโทเค็นที่จัดเก็บไว้ผ่าน `/api/v1/whoami`

### `star <slug>` / `unstar <slug>`

- เพิ่ม/ลบ skill ออกจากรายการไฮไลต์ของคุณ
- เรียก `POST /api/v1/stars/<slug>` และ `DELETE /api/v1/stars/<slug>`
- `--yes` ข้ามการยืนยัน

### `search <query...>`

- เรียก `/api/v1/search?q=...`
- การค้นหาให้ความสำคัญกับการตรงกันของโทเค็น slug/ชื่อแบบตรงตัวก่อนความนิยมจากการดาวน์โหลด โทเค็น slug แบบเดี่ยว เช่น `map` จะตรงกับ `personal-map` ได้แรงกว่าข้อความย่อยภายใน `amap`
- จำนวนดาวน์โหลดเป็นเพียงค่าตั้งต้นด้านความนิยมเล็กน้อย ไม่ใช่การรับประกันว่าจะได้อันดับบนสุด
- หาก skill ควรปรากฏแต่ไม่ปรากฏ ให้รัน `clawhub inspect <slug>` ขณะเข้าสู่ระบบเพื่อตรวจสอบการวินิจฉัยการกลั่นกรองที่เจ้าของมองเห็นได้ ก่อนเปลี่ยนชื่อข้อมูลเมตา

### `explore`

- แสดงรายการ skills ใหม่ล่าสุดผ่าน `/api/v1/skills?limit=...&sort=createdAt` (เรียงตาม `createdAt` จากมากไปน้อย)
- แฟล็ก:
  - `--limit <n>` (1-200, ค่าเริ่มต้น: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (ค่าเริ่มต้น: newest)
  - `--json` (เอาต์พุตที่เครื่องอ่านได้)
- เอาต์พุต: `<slug>  v<version>  <age>  <summary>` (สรุปถูกตัดเหลือ 50 อักขระ)

### `inspect <slug>`

- ดึงข้อมูลเมตาและไฟล์เวอร์ชันของ skill โดยไม่ติดตั้ง
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
- ปฏิเสธการเขียนทับ skills ที่ปักหมุดไว้ ให้รัน `clawhub unpin <slug>` ก่อน
- เขียน:
  - `<workdir>/.clawhub/lock.json` (เดิม `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (เดิม `.clawdhub`)

### `uninstall <slug>`

- ลบ `<workdir>/<dir>/<slug>` และลบรายการใน lockfile
- แบบโต้ตอบ: ขอการยืนยัน
- แบบไม่โต้ตอบ (`--no-input`): ต้องใช้ `--yes`

### `list`

- อ่าน `<workdir>/.clawhub/lock.json` (เดิมคือ `.clawdhub`)
- แสดง `pinned` ถัดจาก Skills ที่ถูกตรึงด้วย `clawhub pin` รวมถึงเหตุผลเสริม

### `pin <slug>`

- ทำเครื่องหมาย Skills ที่ติดตั้งแล้วว่าเป็นรายการที่ตรึงไว้ใน lockfile
- `--reason <text>` บันทึกเหตุผลว่าทำไม Skills นี้จึงถูกตรึง
- Skills ที่ตรึงไว้จะถูกข้ามโดย `update --all` และถูกปฏิเสธโดย `update <slug>` โดยตรง
- Skills ที่ตรึงไว้ยังปฏิเสธ `install --force` ด้วย เพื่อไม่ให้ไบต์ในเครื่องถูกแทนที่โดยไม่ตั้งใจ

### `unpin <slug>`

- ลบการตรึงใน lockfile ออกจาก Skills ที่ติดตั้งแล้ว เพื่อให้การอัปเดตในอนาคตแก้ไขได้

### `update [slug]` / `update --all`

- คำนวณลายนิ้วมือจากไฟล์ในเครื่อง
- หากลายนิ้วมือตรงกับเวอร์ชันที่รู้จัก: ไม่มีพรอมป์
- หากลายนิ้วมือไม่ตรง:
  - ปฏิเสธตามค่าเริ่มต้น
  - เขียนทับด้วย `--force` (หรือพรอมป์ หากเป็นโหมดโต้ตอบ)
- Skills ที่ตรึงไว้จะไม่ถูกอัปเดตโดย `--force`
- `update <slug>` ล้มเหลวทันทีสำหรับ slug ที่ตรึงไว้ และบอกให้คุณเรียกใช้ `clawhub unpin <slug>` ก่อน
- `update --all` ข้าม slug ที่ตรึงไว้และพิมพ์สรุปว่าสิ่งใดยังคงถูกตรึงอยู่

### `skill publish <path>`

- เผยแพร่ผ่าน `POST /api/v1/skills` (multipart)
- ต้องใช้ semver: `--version 1.2.3`
- `--owner <handle>` เผยแพร่ภายใต้ handle ผู้เผยแพร่ขององค์กร/ผู้ใช้เมื่อ
  ผู้ดำเนินการมีสิทธิ์เข้าถึงผู้เผยแพร่
- `--migrate-owner` ย้าย Skills ที่มีอยู่ไปยัง `--owner` ระหว่างเผยแพร่
  เวอร์ชันใหม่ ต้องมีสิทธิ์ admin/owner ในผู้เผยแพร่ทั้งสองฝั่ง
- พฤติกรรมของเจ้าของและการรีวิวอธิบายไว้ใน `docs/publishing.md`
- การเผยแพร่ Skills หมายความว่า Skills นั้นถูกเผยแพร่ภายใต้ `MIT-0` บน ClawHub
- Skills ที่เผยแพร่แล้วสามารถใช้งาน แก้ไข และแจกจ่ายต่อได้ฟรีโดยไม่ต้องระบุแหล่งที่มา
- ClawHub ไม่รองรับ Skills แบบชำระเงินหรือการตั้งราคาราย Skills
- `--clawscan-note <text>` เพิ่มบันทึก ClawScan บันทึกนี้ให้บริบทแก่ ClawScan
  สำหรับพฤติกรรมที่อาจดูผิดปกติ มิฉะนั้น เช่น การเข้าถึงเครือข่าย
  การเข้าถึงโฮสต์แบบเนทีฟ หรือข้อมูลรับรองเฉพาะผู้ให้บริการ บันทึกนี้ถูกเก็บไว้ใน
  เวอร์ชันที่เผยแพร่
- alias เดิม: `publish <path>`

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- ลบ Skills แบบซอฟต์ดีลีต (owner, moderator หรือ admin)
- เรียก `DELETE /api/v1/skills/{slug}`
- การซอฟต์ดีลีตที่เริ่มโดยเจ้าของจะจอง slug ไว้ 30 วัน คำสั่งจะพิมพ์เวลาหมดอายุ
- `--reason <text>` บันทึกหมายเหตุการกลั่นกรองใน Skills และ audit log
- `--note <text>` เป็น alias ของ `--reason`
- `--yes` ข้ามการยืนยัน

### `undelete <slug>`

- กู้คืน Skills ที่ซ่อนไว้ (owner, moderator หรือ admin)
- เรียก `POST /api/v1/skills/{slug}/undelete`
- `--reason <text>` บันทึกหมายเหตุการกลั่นกรองใน Skills และ audit log
- `--note <text>` เป็น alias ของ `--reason`
- `--yes` ข้ามการยืนยัน

### `hide <slug>`

- ซ่อน Skills (owner, moderator หรือ admin)
- alias ของ `delete`

### `unhide <slug>`

- เลิกซ่อน Skills (owner, moderator หรือ admin)
- alias ของ `undelete`

### `skill rename <slug> <new-slug>`

- เปลี่ยนชื่อ Skills ที่เป็นเจ้าของและเก็บ slug เดิมไว้เป็น alias สำหรับเปลี่ยนเส้นทาง
- เรียก `POST /api/v1/skills/{slug}/rename`
- `--yes` ข้ามการยืนยัน

### `skill merge <source-slug> <target-slug>`

- รวม Skills ที่เป็นเจ้าของหนึ่งรายการเข้ากับ Skills ที่เป็นเจ้าของอีกรายการ
- slug ต้นทางหยุดแสดงรายการต่อสาธารณะและกลายเป็น alias สำหรับเปลี่ยนเส้นทางไปยังเป้าหมาย
- เรียก `POST /api/v1/skills/{sourceSlug}/merge`
- `--yes` ข้ามการยืนยัน

### `transfer`

- เวิร์กโฟลว์การโอนความเป็นเจ้าของ
- การโอนไปยัง handle ผู้ใช้จะสร้างคำขอที่รอดำเนินการเพื่อให้ผู้รับยอมรับ
- การโอนไปยัง handle ขององค์กร/ผู้เผยแพร่จะมีผลทันทีเฉพาะเมื่อผู้ดำเนินการมี
  สิทธิ์ admin ทั้งต่อเจ้าของปัจจุบันและผู้เผยแพร่ปลายทาง
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

- เรียกดูหรือค้นหาแค็ตตาล็อกแพ็กเกจรวมผ่าน `GET /api/v1/packages` และ `GET /api/v1/packages/search`
- ใช้สิ่งนี้สำหรับ Plugin และรายการตระกูลแพ็กเกจอื่น ๆ; `search` ระดับบนสุดยังคงเป็นพื้นผิวการค้นหา Skills
- flag:
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
- ใช้สิ่งนี้สำหรับเมทาดาทา Plugin, ความเข้ากันได้, การยืนยัน, ซอร์ส และการตรวจสอบเวอร์ชัน/ไฟล์
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: ล่าสุด)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-100)
- `--files`: แสดงรายการไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (เฉพาะไฟล์ข้อความ; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `package download <name>`

- แก้เวอร์ชันแพ็กเกจผ่าน
  `GET /api/v1/packages/{name}/versions/{version}/artifact`
- ดาวน์โหลด artifact จาก `downloadUrl` ของ resolver
- ยืนยัน ClawHub SHA-256 สำหรับ artifact ทั้งหมด
- สำหรับ artifact แบบ ClawPack npm-pack จะยืนยันความถูกต้องของ npm `sha512`,
  npm shasum และชื่อ/เวอร์ชันใน `package.json` ของ tarball เพิ่มเติม
- เวอร์ชัน ZIP เดิมดาวน์โหลดผ่านเส้นทาง ZIP เดิม
- flag:
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

- คำนวณ ClawHub SHA-256, ความถูกต้องของ npm `sha512` และ npm shasum สำหรับ
  artifact ในเครื่อง
- เมื่อใช้ `--package` จะแก้เมทาดาทาที่คาดไว้จาก ClawHub และเปรียบเทียบ
  ไฟล์ในเครื่องกับเมทาดาทา artifact ที่เผยแพร่
- เมื่อใช้ flag digest โดยตรง จะยืนยันโดยไม่ต้องค้นหาผ่านเครือข่าย
- flag:
  - `--package <name>`: ชื่อแพ็กเกจสำหรับแก้เมทาดาทา artifact ที่คาดไว้
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

- ลบแพ็กเกจและรีลีสทั้งหมดแบบกู้คืนได้
- ต้องเป็นเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลผู้เผยแพร่องค์กร, ผู้ควบคุมแพลตฟอร์ม,
  หรือผู้ดูแลแพลตฟอร์ม
- แฟล็ก:
  - `--yes`: ข้ามการยืนยัน
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- กู้คืนแพ็กเกจและรีลีสที่ถูกลบแบบกู้คืนได้
- ต้องเป็นเจ้าของแพ็กเกจ, เจ้าของ/ผู้ดูแลผู้เผยแพร่องค์กร, ผู้ควบคุมแพลตฟอร์ม,
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
- ต้องมีสิทธิ์ผู้ดูแลต่อทั้งเจ้าของแพ็กเกจปัจจุบันและผู้เผยแพร่ปลายทาง
  เว้นแต่จะดำเนินการโดยผู้ดูแลแพลตฟอร์ม
- ชื่อแพ็กเกจแบบมี scope ต้องโอนไปยังเจ้าของ scope ที่ตรงกัน
- เรียก `POST /api/v1/packages/{name}/transfer`
- แฟล็ก:
  - `--to <owner>`: แฮนเดิลผู้เผยแพร่ปลายทาง
  - `--reason <text>`: เหตุผลการตรวจสอบย้อนหลังแบบไม่บังคับ
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- คำสั่งที่ต้องยืนยันตัวตนสำหรับรายงานแพ็กเกจให้ผู้ควบคุม
- เรียก `POST /api/v1/packages/{name}/report`
- รายงานอยู่ในระดับแพ็กเกจ อาจผูกกับเวอร์ชันได้ และจะมองเห็นได้
  สำหรับผู้ควบคุมเพื่อตรวจสอบ
- รายงานจะไม่ซ่อนแพ็กเกจหรือบล็อกการดาวน์โหลดโดยอัตโนมัติด้วยตัวเอง
- แฟล็ก:
  - `--version <version>`: เวอร์ชันแพ็กเกจแบบไม่บังคับที่จะแนบกับรายงาน
  - `--reason <text>`: เหตุผลรายงานที่ต้องระบุ
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- คำสั่งสำหรับเจ้าของเพื่อตรวจสอบการมองเห็นด้านการควบคุมแพ็กเกจ
- เรียก `GET /api/v1/packages/{name}/moderation`
- แสดงสถานะการสแกนแพ็กเกจปัจจุบัน, จำนวนรายงานที่เปิดอยู่, สถานะการควบคุมด้วยตนเองของรีลีสล่าสุด,
  สถานะการบล็อกการดาวน์โหลด และเหตุผลการควบคุม
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- ตรวจสอบว่าแพ็กเกจพร้อมสำหรับการใช้งานโดย OpenClaw ในอนาคตหรือไม่
- เรียก `GET /api/v1/packages/{name}/readiness`
- รายงานตัวขัดขวางสำหรับสถานะทางการ, ความพร้อมใช้งานของ ClawPack, digest ของ artifact,
  ที่มาของซอร์ส, ความเข้ากันได้กับ OpenClaw, เป้าหมายโฮสต์, metadata สภาพแวดล้อม,
  และสถานะการสแกน
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- แสดงสถานะการย้ายที่เน้นผู้ปฏิบัติงานสำหรับแพ็กเกจที่อาจแทนที่
  Plugin ที่รวมมากับ OpenClaw
- เรียก endpoint ความพร้อมที่คำนวณเดียวกับ `package readiness` แต่พิมพ์
  สถานะที่เน้นการย้าย, เวอร์ชันล่าสุด, สถานะแพ็กเกจทางการ, การตรวจสอบ และ
  ตัวขัดขวาง
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
  - tarball ของ ClawPack แบบ npm-pack ในเครื่อง: `./my-plugin-1.2.3.tgz`
  - repo GitHub: `owner/repo` หรือ `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Metadata จะถูกตรวจจับอัตโนมัติจาก `package.json`, `openclaw.plugin.json` และ
  marker ของบันเดิล OpenClaw จริง เช่น `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` และ `.cursor-plugin/plugin.json`
- ซอร์ส `.tgz` จะถูกปฏิบัติเป็น ClawPack CLI จะอัปโหลดไบต์ npm-pack
  ที่ตรงกันทุกประการ และใช้เนื้อหา `package/` ที่แตกออกมาเพื่อการตรวจสอบและ
  เติม metadata ล่วงหน้าเท่านั้น
- โฟลเดอร์ Plugin แบบโค้ดจะถูกแพ็กเป็น tarball npm ของ ClawPack ก่อนอัปโหลด เพื่อให้
  การติดตั้ง OpenClaw ตรวจสอบ artifact ที่ตรงกันทุกประการได้ โฟลเดอร์ Plugin แบบบันเดิลยังคง
  ใช้เส้นทางเผยแพร่แบบไฟล์ที่แตกออกมา
- สำหรับซอร์ส GitHub การระบุที่มาของซอร์สจะถูกเติมอัตโนมัติจาก repo, commit ที่ resolve แล้ว, ref และ subpath
- สำหรับโฟลเดอร์ในเครื่อง การระบุที่มาของซอร์สจะถูกตรวจจับอัตโนมัติจาก git ในเครื่องเมื่อรีโมต origin ชี้ไปที่ GitHub
- Plugin แบบโค้ดภายนอกต้องประกาศ `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion` อย่างชัดเจน
  `package.json.version` ระดับบนสุดจะไม่ถูกใช้เป็น fallback สำหรับการตรวจสอบการเผยแพร่
- `--dry-run` แสดงตัวอย่าง payload การเผยแพร่ที่ resolve แล้วโดยไม่อัปโหลด
- `--json` ส่งเอาต์พุตที่เครื่องอ่านได้สำหรับ CI
- `--owner <handle>` เผยแพร่ภายใต้แฮนเดิลผู้เผยแพร่แบบผู้ใช้หรือองค์กรเมื่อผู้กระทำมีสิทธิ์เข้าถึงผู้เผยแพร่
- `--clawscan-note <text>` เพิ่มโน้ต ClawScan โน้ตนี้ให้บริบทแก่ ClawScan
  สำหรับพฤติกรรมที่อาจดูผิดปกติ เช่น การเข้าถึงเครือข่าย,
  การเข้าถึงโฮสต์ native หรือข้อมูลประจำตัวเฉพาะผู้ให้บริการ โน้ตจะถูกเก็บไว้ใน
  รีลีสที่เผยแพร่
- ชื่อแพ็กเกจแบบมี scope ต้องตรงกับเจ้าของที่เลือก ดู `docs/publishing.md`
- แฟล็กที่มีอยู่ (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ยังทำงานเป็น overrides ได้
- repo GitHub ส่วนตัวต้องใช้ `GITHUB_TOKEN`

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### ขั้นตอนในเครื่องที่แนะนำ

ใช้ `--dry-run` ก่อน เพื่อให้คุณยืนยัน metadata แพ็กเกจที่ resolve แล้วและ
การระบุที่มาของซอร์สก่อนสร้างรีลีสจริงได้:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### ขั้นตอนโฟลเดอร์ในเครื่อง

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

ฟิลด์ที่ต้องมี:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

หมายเหตุ:

- `package.json.version` คือเวอร์ชันรีลีสของแพ็กเกจคุณ แต่จะไม่ถูกใช้เป็น
  fallback สำหรับการตรวจสอบความเข้ากันได้/บิลด์ของ OpenClaw
- `openclaw.hostTargets` และ `openclaw.environment` เป็น metadata แบบไม่บังคับ
  ClawHub อาจแสดงข้อมูลเหล่านี้เมื่อมีอยู่ แต่ไม่จำเป็นสำหรับการเผยแพร่
- `openclaw.compat.minGatewayVersion` และ
  `openclaw.build.pluginSdkVersion` เป็นข้อมูลเพิ่มเติมแบบไม่บังคับ หากคุณต้องการเผยแพร่
  metadata ความเข้ากันได้ที่ละเอียดขึ้น
- หากคุณกำลังใช้ CLI `clawhub` รีลีสเก่า ให้อัปเกรดก่อนเผยแพร่ เพื่อให้
  การตรวจสอบ preflight ในเครื่องทำงานก่อนอัปโหลด

#### GitHub Actions

ClawHub ยังมาพร้อม workflow ที่นำกลับมาใช้ซ้ำได้อย่างเป็นทางการที่
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/f0a6789c31d5a1666d25173927356dd5be7738bc/.github/workflows/package-publish.yml)
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

- workflow ที่นำกลับมาใช้ซ้ำได้ตั้งค่า `source` เป็น repo ของ caller โดยค่าเริ่มต้น
- สำหรับ monorepo ให้ส่ง `source_path` เพื่อให้ workflow เผยแพร่โฟลเดอร์แพ็กเกจ
  Plugin เช่น `source_path: extensions/codex`
- pin workflow ที่นำกลับมาใช้ซ้ำได้กับ tag ที่เสถียรหรือ SHA commit แบบเต็ม อย่ารันการเผยแพร่รีลีสจาก `@main`
- `pull_request` ควรใช้ `dry_run: true` เพื่อให้ CI ไม่สร้างผลกระทบ
- การเผยแพร่จริงควรจำกัดไว้ที่เหตุการณ์ที่เชื่อถือได้ เช่น `workflow_dispatch` หรือการ push tag
- การเผยแพร่แบบเชื่อถือได้โดยไม่มี secret ทำงานได้เฉพาะบน `workflow_dispatch`; การ push tag ยังต้องใช้ `clawhub_token`
- เก็บ `clawhub_token` ให้พร้อมสำหรับการเผยแพร่ครั้งแรก, แพ็กเกจที่ไม่น่าเชื่อถือ หรือการเผยแพร่ฉุกเฉิน
- workflow อัปโหลดผลลัพธ์ JSON เป็น artifact และเปิดเผยเป็นเอาต์พุตของ workflow

### `sync`

- สแกนหาโฟลเดอร์ skill ในเครื่อง และเผยแพร่รายการใหม่/ที่เปลี่ยนแปลง
- root สามารถเป็นโฟลเดอร์ใดก็ได้: ไดเรกทอรี skills หรือโฟลเดอร์ skill เดียวที่มี `SKILL.md`
- เพิ่ม root ของ skill Clawdbot อัตโนมัติเมื่อมี `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (agent หลัก)
  - `routing.agents.*.workspace/skills` (ต่อ agent)
  - `~/.clawdbot/skills` (ใช้ร่วมกัน)
  - `skills.load.extraDirs` (แพ็กที่ใช้ร่วมกัน)
- เคารพ `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` และ `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`
- แฟล็ก:
  - `--root <dir...>` root สแกนเพิ่มเติม
  - `--all` อัปโหลดโดยไม่ถาม
  - `--dry-run` แสดงเฉพาะแผน
  - `--bump patch|minor|major` (ค่าเริ่มต้น: patch)
  - `--changelog <text>` (ไม่โต้ตอบ)
  - `--tags a,b,c` (ค่าเริ่มต้น: latest)
  - `--concurrency <n>` (ค่าเริ่มต้น: 4)

Telemetry:

- ส่งระหว่าง `sync` เมื่อเข้าสู่ระบบแล้ว เว้นแต่ตั้งค่า `CLAWHUB_DISABLE_TELEMETRY=1` (legacy `CLAWDHUB_DISABLE_TELEMETRY=1`)
- รายละเอียด: `docs/telemetry.md`
