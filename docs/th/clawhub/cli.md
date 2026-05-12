---
read_when:
    - การใช้ ClawHub CLI
    - การดีบักการติดตั้ง การอัปเดต การเผยแพร่ หรือการซิงค์
summary: 'ข้อมูลอ้างอิง CLI: คำสั่ง แฟล็ก การกำหนดค่า ไฟล์ล็อก และลักษณะการทำงานของการซิงค์.'
x-i18n:
    generated_at: "2026-05-12T04:09:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: b42231f76dee1ffc66585e72ce3d370658a362225ad858e7c72726f991287aa2
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

แพ็กเกจ CLI: `clawhub`, ไบนารี: `clawhub`.

ติดตั้งแบบทั่วทั้งระบบด้วย npm หรือ pnpm:

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

## แฟล็กส่วนกลาง

- `--workdir <dir>`: ไดเรกทอรีทำงาน (ค่าเริ่มต้น: cwd; ถ้ากำหนดไว้ จะถอยกลับไปใช้พื้นที่ทำงานของ Clawdbot)
- `--dir <dir>`: ไดเรกทอรีติดตั้งภายใต้ workdir (ค่าเริ่มต้น: `skills`)
- `--site <url>`: URL ฐานสำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `https://clawhub.ai`)
- `--registry <url>`: URL ฐานของ API (ค่าเริ่มต้น: ค้นหาอัตโนมัติ มิฉะนั้นใช้ `https://clawhub.ai`)
- `--no-input`: ปิดใช้งานพรอมป์

ตัวแปรสภาพแวดล้อมที่เทียบเท่า:

- `CLAWHUB_SITE` (เดิม `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (เดิม `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (เดิม `CLAWDHUB_WORKDIR`)

### HTTP proxy

CLI รองรับตัวแปรสภาพแวดล้อม HTTP proxy มาตรฐานสำหรับระบบที่อยู่หลัง
proxy องค์กรหรือเครือข่ายที่ถูกจำกัด:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

เมื่อตั้งค่าตัวแปรเหล่านี้ตัวใดตัวหนึ่ง CLI จะกำหนดเส้นทางคำขอขาออกผ่าน
proxy ที่ระบุ `HTTPS_PROXY` ใช้สำหรับคำขอ HTTPS, `HTTP_PROXY`
ใช้สำหรับ HTTP แบบปกติ และรองรับ `NO_PROXY` / `no_proxy` เพื่อข้าม proxy สำหรับ
โฮสต์หรือโดเมนที่ระบุ

สิ่งนี้จำเป็นในระบบที่การเชื่อมต่อขาออกโดยตรงถูกบล็อก
(เช่น คอนเทนเนอร์ Docker, Hetzner VPS ที่ใช้อินเทอร์เน็ตได้เฉพาะผ่าน proxy, ไฟร์วอลล์องค์กร)

ตัวอย่าง:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

เมื่อไม่ได้ตั้งค่าตัวแปร proxy พฤติกรรมจะไม่เปลี่ยนแปลง (เชื่อมต่อโดยตรง)

## ไฟล์กำหนดค่า

จัดเก็บโทเค็น API ของคุณ + URL รีจิสทรีที่แคชไว้

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` หรือ `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- การถอยกลับแบบเดิม: หากยังไม่มี `clawhub/config.json` แต่มี `clawdhub/config.json` อยู่ CLI จะใช้พาธเดิมซ้ำ
- เขียนทับ: `CLAWHUB_CONFIG_PATH` (เดิม `CLAWDHUB_CONFIG_PATH`)

## คำสั่ง

### `login` / `auth login`

- ค่าเริ่มต้น: เปิดเบราว์เซอร์ไปยัง `<site>/cli/auth` และทำให้เสร็จผ่านคอลแบ็ก loopback
- แบบไม่มีหน้าจอ: `clawhub login --token clh_...`
- แบบโต้ตอบระยะไกล/ไม่มีหน้าจอ: `clawhub login --device` พิมพ์รหัสและรอในขณะที่คุณอนุญาตที่ `<site>/cli/device`

### `whoami`

- ตรวจสอบโทเค็นที่จัดเก็บไว้ผ่าน `/api/v1/whoami`

### `star <slug>` / `unstar <slug>`

- เพิ่ม/ลบทักษะออกจากรายการไฮไลต์ของคุณ
- เรียก `POST /api/v1/stars/<slug>` และ `DELETE /api/v1/stars/<slug>`
- `--yes` ข้ามการยืนยัน

### `search <query...>`

- เรียก `/api/v1/search?q=...`
- การค้นหาจะให้น้ำหนักกับการจับคู่โทเค็น slug/name แบบตรงตัวก่อนความนิยมจากการดาวน์โหลด โทเค็น slug แบบเดี่ยว เช่น `map` จะจับคู่กับ `personal-map` ได้แรงกว่าข้อความย่อยภายใน `amap`
- ยอดดาวน์โหลดเป็นเพียงปัจจัยความนิยมขนาดเล็ก ไม่ใช่การรับประกันว่าจะได้ตำแหน่งบนสุด
- หากทักษะควรปรากฏแต่ไม่ปรากฏ ให้รัน `clawhub inspect <slug>` ขณะเข้าสู่ระบบ เพื่อตรวจสอบการวินิจฉัยการดูแลที่เจ้าของเห็นได้ก่อนเปลี่ยนชื่อ metadata

### `explore`

- แสดงรายการทักษะใหม่ล่าสุดผ่าน `/api/v1/skills?limit=...&sort=createdAt` (เรียงตาม `createdAt` จากมากไปน้อย)
- แฟล็ก:
  - `--limit <n>` (1-200, ค่าเริ่มต้น: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (ค่าเริ่มต้น: newest)
  - `--json` (เอาต์พุตที่เครื่องอ่านได้)
- เอาต์พุต: `<slug>  v<version>  <age>  <summary>` (summary ถูกตัดให้เหลือ 50 อักขระ)

### `inspect <slug>`

- ดึง metadata ของทักษะและไฟล์เวอร์ชันโดยไม่ติดตั้ง
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: ล่าสุด)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-200)
- `--files`: แสดงรายการไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (เฉพาะไฟล์ข้อความ; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `install <slug>`

- แก้หาเวอร์ชันล่าสุดผ่าน `/api/v1/skills/<slug>`
- ดาวน์โหลด zip ผ่าน `/api/v1/download`
- แตกไฟล์ลงใน `<workdir>/<dir>/<slug>`
- ปฏิเสธการเขียนทับทักษะที่ปักหมุดไว้; ให้รัน `clawhub unpin <slug>` ก่อน
- เขียน:
  - `<workdir>/.clawhub/lock.json` (เดิม `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (เดิม `.clawdhub`)

### `uninstall <slug>`

- ลบ `<workdir>/<dir>/<slug>` และลบรายการใน lockfile
- แบบโต้ตอบ: ขอการยืนยัน
- แบบไม่โต้ตอบ (`--no-input`): ต้องใช้ `--yes`

### `list`

- อ่าน `<workdir>/.clawhub/lock.json` (`.clawdhub` แบบเดิม)
- แสดง `pinned` ถัดจาก Skills ที่ถูกตรึงด้วย `clawhub pin` รวมถึงเหตุผลที่ไม่บังคับระบุ

### `pin <slug>`

- ทำเครื่องหมาย Skill ที่ติดตั้งแล้วว่าถูกตรึงใน lockfile
- `--reason <text>` บันทึกว่าเหตุใด Skill จึงถูกตรึง
- Skills ที่ถูกตรึงจะถูกข้ามโดย `update --all` และถูกปฏิเสธโดย `update <slug>` โดยตรง
- Skills ที่ถูกตรึงยังปฏิเสธ `install --force` ด้วย เพื่อไม่ให้ไบต์ในเครื่องถูกแทนที่โดยไม่ตั้งใจ

### `unpin <slug>`

- นำการตรึงใน lockfile ออกจาก Skill ที่ติดตั้งแล้ว เพื่อให้การอัปเดตในอนาคตแก้ไขได้

### `update [slug]` / `update --all`

- คำนวณลายนิ้วมือจากไฟล์ในเครื่อง
- หากลายนิ้วมือตรงกับเวอร์ชันที่รู้จัก: ไม่แสดงพรอมป์
- หากลายนิ้วมือไม่ตรง:
  - ปฏิเสธตามค่าเริ่มต้น
  - เขียนทับด้วย `--force` (หรือพรอมป์ หากเป็นโหมดโต้ตอบ)
- Skills ที่ถูกตรึงจะไม่ถูกอัปเดตด้วย `--force`
- `update <slug>` ล้มเหลวอย่างรวดเร็วสำหรับ slugs ที่ถูกตรึง และแจ้งให้คุณรัน `clawhub unpin <slug>` ก่อน
- `update --all` ข้าม slugs ที่ถูกตรึง และพิมพ์สรุปสิ่งที่ยังคงถูกตรึงไว้

### `skill publish <path>`

- เผยแพร่ผ่าน `POST /api/v1/skills` (multipart)
- ต้องใช้ semver: `--version 1.2.3`
- `--owner <handle>` เผยแพร่ภายใต้แฮนเดิลผู้เผยแพร่ขององค์กร/ผู้ใช้ เมื่อผู้ดำเนินการมีสิทธิ์เข้าถึงผู้เผยแพร่
- `--migrate-owner` ย้าย Skill ที่มีอยู่ไปยัง `--owner` ขณะเผยแพร่เวอร์ชันใหม่ ต้องมีสิทธิ์ admin/owner บนผู้เผยแพร่ทั้งสองฝั่ง
- พฤติกรรมเกี่ยวกับเจ้าของและการรีวิวอธิบายไว้ใน `docs/publishing.md`
- การเผยแพร่ Skill หมายความว่า Skill นั้นถูกปล่อยภายใต้ `MIT-0` บน ClawHub
- Skills ที่เผยแพร่แล้วใช้งาน แก้ไข และแจกจ่ายต่อได้ฟรีโดยไม่ต้องระบุแหล่งที่มา
- ClawHub ไม่รองรับ Skills แบบชำระเงินหรือการตั้งราคาต่อ Skill
- `--clawscan-note <text>` เพิ่มบันทึก ClawScan บันทึกนี้ให้บริบทแก่ ClawScan สำหรับพฤติกรรมที่อาจดูผิดปกติ เช่น การเข้าถึงเครือข่าย การเข้าถึงโฮสต์แบบ native หรือข้อมูลรับรองเฉพาะผู้ให้บริการ บันทึกนี้ถูกจัดเก็บไว้บนเวอร์ชันที่เผยแพร่
- นามแฝงแบบเดิม: `publish <path>`

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- ลบ Skill แบบซ่อน (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- เรียก `DELETE /api/v1/skills/{slug}`
- การลบแบบซ่อนที่เริ่มโดยเจ้าของจะสงวน slug ไว้ 30 วัน คำสั่งจะพิมพ์เวลาหมดอายุ
- `--reason <text>` บันทึกหมายเหตุการดูแลบน Skill และบันทึก audit
- `--note <text>` เป็นนามแฝงของ `--reason`
- `--yes` ข้ามการยืนยัน

### `undelete <slug>`

- กู้คืน Skill ที่ถูกซ่อน (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- เรียก `POST /api/v1/skills/{slug}/undelete`
- `--reason <text>` บันทึกหมายเหตุการดูแลบน Skill และบันทึก audit
- `--note <text>` เป็นนามแฝงของ `--reason`
- `--yes` ข้ามการยืนยัน

### `hide <slug>`

- ซ่อน Skill (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- นามแฝงของ `delete`

### `unhide <slug>`

- เลิกซ่อน Skill (เจ้าของ ผู้ดูแล หรือผู้ดูแลระบบ)
- นามแฝงของ `undelete`

### `skill rename <slug> <new-slug>`

- เปลี่ยนชื่อ Skill ที่เป็นเจ้าของ และเก็บ slug ก่อนหน้าไว้เป็นนามแฝงสำหรับเปลี่ยนเส้นทาง
- เรียก `POST /api/v1/skills/{slug}/rename`
- `--yes` ข้ามการยืนยัน

### `skill merge <source-slug> <target-slug>`

- รวม Skill ที่เป็นเจ้าของหนึ่งรายการเข้ากับ Skill ที่เป็นเจ้าของอีกรายการ
- slug ต้นทางหยุดแสดงต่อสาธารณะ และกลายเป็นนามแฝงสำหรับเปลี่ยนเส้นทางไปยังเป้าหมาย
- เรียก `POST /api/v1/skills/{sourceSlug}/merge`
- `--yes` ข้ามการยืนยัน

### `transfer`

- เวิร์กโฟลว์การโอนความเป็นเจ้าของ
- การโอนไปยังแฮนเดิลผู้ใช้จะสร้างคำขอที่รอดำเนินการให้ผู้รับยอมรับ
- การโอนไปยังแฮนเดิลองค์กร/ผู้เผยแพร่จะมีผลทันทีเฉพาะเมื่อผู้ดำเนินการมีสิทธิ์ admin ต่อทั้งเจ้าของปัจจุบันและผู้เผยแพร่ปลายทาง
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

- เรียกดูหรือค้นหาแคตตาล็อกแพ็กเกจแบบรวมผ่าน `GET /api/v1/packages` และ `GET /api/v1/packages/search`
- ใช้สิ่งนี้สำหรับ Plugins และรายการตระกูลแพ็กเกจอื่น ๆ; `search` ระดับบนยังคงเป็นพื้นผิวการค้นหา Skill
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

- ดึงข้อมูลเมตาแพ็กเกจโดยไม่ติดตั้ง
- ใช้สิ่งนี้สำหรับข้อมูลเมตา Plugin, ความเข้ากันได้, การตรวจสอบยืนยัน, แหล่งที่มา และการตรวจสอบเวอร์ชัน/ไฟล์
- `--version <version>`: ตรวจสอบเวอร์ชันที่ระบุ (ค่าเริ่มต้น: ล่าสุด)
- `--tag <tag>`: ตรวจสอบเวอร์ชันที่ติดแท็ก (เช่น `latest`)
- `--versions`: แสดงประวัติเวอร์ชัน (หน้าแรก)
- `--limit <n>`: จำนวนเวอร์ชันสูงสุดที่จะแสดง (1-100)
- `--files`: แสดงไฟล์สำหรับเวอร์ชันที่เลือก
- `--file <path>`: ดึงเนื้อหาไฟล์ดิบ (เฉพาะไฟล์ข้อความ; จำกัด 200KB)
- `--json`: เอาต์พุตที่เครื่องอ่านได้

### `package download <name>`

- แก้หาเวอร์ชันแพ็กเกจผ่าน
  `GET /api/v1/packages/{name}/versions/{version}/artifact`
- ดาวน์โหลด artifact จาก `downloadUrl` ของ resolver
- ตรวจสอบ ClawHub SHA-256 สำหรับ artifacts ทั้งหมด
- สำหรับ artifacts ClawPack npm-pack จะตรวจสอบ npm `sha512` integrity, npm shasum และชื่อ/เวอร์ชัน `package.json` ของ tarball ด้วย
- เวอร์ชัน ZIP แบบเดิมดาวน์โหลดผ่านเส้นทาง ZIP แบบเดิม
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

- คำนวณ ClawHub SHA-256, npm `sha512` integrity และ npm shasum สำหรับ artifact ในเครื่อง
- เมื่อใช้ `--package` จะแก้หาข้อมูลเมตาที่คาดหวังจาก ClawHub และเปรียบเทียบไฟล์ในเครื่องกับข้อมูลเมตา artifact ที่เผยแพร่
- เมื่อใช้ flags digest โดยตรง จะตรวจสอบยืนยันโดยไม่ต้องค้นหาผ่านเครือข่าย
- Flags:
  - `--package <name>`: ชื่อแพ็กเกจที่ใช้แก้หาข้อมูลเมตา artifact ที่คาดหวัง
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
- ต้องมีสิทธิ์ผู้ดูแลทั้งเจ้าของแพ็กเกจปัจจุบันและผู้เผยแพร่ปลายทาง
  เว้นแต่ดำเนินการโดยผู้ดูแลระบบแพลตฟอร์ม
- ชื่อแพ็กเกจแบบมีขอบเขตต้องโอนไปยังเจ้าของขอบเขตที่ตรงกัน
- เรียก `POST /api/v1/packages/{name}/transfer`
- แฟล็ก:
  - `--to <owner>`: แฮนเดิลผู้เผยแพร่ปลายทาง
  - `--reason <text>`: เหตุผลสำหรับการตรวจสอบย้อนหลังแบบไม่บังคับ
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
- รายงานจะไม่ซ่อนแพ็กเกจโดยอัตโนมัติหรือบล็อกการดาวน์โหลดด้วยตัวเอง
- แฟล็ก:
  - `--version <version>`: เวอร์ชันแพ็กเกจแบบไม่บังคับเพื่อแนบกับรายงาน
  - `--reason <text>`: เหตุผลรายงานที่จำเป็น
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- คำสั่งสำหรับเจ้าของเพื่อตรวจสอบการมองเห็นด้านการดูแลแพ็กเกจ
- เรียก `GET /api/v1/packages/{name}/moderation`
- แสดงสถานะการสแกนแพ็กเกจปัจจุบัน, จำนวนรายงานที่เปิดอยู่, สถานะการดูแลด้วยตนเองของรีลีสล่าสุด,
  สถานะการบล็อกการดาวน์โหลด และเหตุผลด้านการดูแล
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- ตรวจสอบว่าแพ็กเกจพร้อมสำหรับการใช้งานในอนาคตโดย OpenClaw หรือไม่
- เรียก `GET /api/v1/packages/{name}/readiness`
- รายงานตัวขัดขวางสำหรับสถานะทางการ, ความพร้อมใช้งานของ ClawPack, ไดเจสต์อาร์ติแฟกต์,
  ที่มาของซอร์ส, ความเข้ากันได้กับ OpenClaw, เป้าหมายโฮสต์, เมตาดาต้าสภาพแวดล้อม,
  และสถานะการสแกน
- แฟล็ก:
  - `--json`: เอาต์พุตที่เครื่องอ่านได้

ตัวอย่าง:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- แสดงสถานะการย้ายที่มุ่งเน้นผู้ปฏิบัติงานสำหรับแพ็กเกจที่อาจแทนที่
  Plugin ที่มาพร้อม OpenClaw
- เรียกเอนด์พอยต์ความพร้อมที่คำนวณเดียวกับ `package readiness` แต่พิมพ์
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
  - ไฟล์ tarball npm-pack ของ ClawPack ในเครื่อง: `./my-plugin-1.2.3.tgz`
  - รีโป GitHub: `owner/repo` หรือ `owner/repo@ref`
  - URL ของ GitHub: `https://github.com/owner/repo`
- ตรวจจับเมตาดาต้าโดยอัตโนมัติจาก `package.json`, `openclaw.plugin.json` และ
  ตัวบ่งชี้บันเดิล OpenClaw จริง เช่น `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` และ `.cursor-plugin/plugin.json`
- ซอร์ส `.tgz` จะถือเป็น ClawPack โดย CLI จะอัปโหลดไบต์ npm-pack
  ที่ตรงกันทุกประการ และใช้เนื้อหา `package/` ที่แตกออกมาเฉพาะสำหรับการตรวจสอบความถูกต้องและ
  การเติมเมตาดาต้าล่วงหน้า
- โฟลเดอร์ Plugin แบบโค้ดจะถูกแพ็กเป็น tarball npm ของ ClawPack ก่อนอัปโหลดเพื่อให้
  การติดตั้ง OpenClaw ตรวจสอบอาร์ติแฟกต์ที่ตรงกันทุกประการได้ ส่วนโฟลเดอร์ Plugin แบบบันเดิลยังคง
  ใช้เส้นทางเผยแพร่แบบไฟล์ที่แตกออกมา
- สำหรับซอร์ส GitHub ระบบจะเติมการระบุแหล่งที่มาของซอร์สโดยอัตโนมัติจากรีโป, คอมมิตที่ resolve แล้ว, ref และ subpath
- สำหรับโฟลเดอร์ในเครื่อง ระบบจะตรวจจับการระบุแหล่งที่มาของซอร์สโดยอัตโนมัติจาก git ในเครื่องเมื่อ origin remote ชี้ไปที่ GitHub
- Plugin แบบโค้ดภายนอกต้องประกาศ `openclaw.compat.pluginApi` และ
  `openclaw.build.openclawVersion` อย่างชัดเจน
  `package.json.version` ระดับบนสุดจะไม่ถูกใช้เป็น fallback สำหรับการตรวจสอบการเผยแพร่
- `--dry-run` แสดงตัวอย่าง payload การเผยแพร่ที่ resolve แล้วโดยไม่อัปโหลด
- `--json` ส่งออกเอาต์พุตที่เครื่องอ่านได้สำหรับ CI
- `--owner <handle>` เผยแพร่ภายใต้แฮนเดิลผู้เผยแพร่ของผู้ใช้หรือองค์กรเมื่อผู้ดำเนินการมีสิทธิ์เข้าถึงผู้เผยแพร่
- `--clawscan-note <text>` เพิ่มหมายเหตุ ClawScan หมายเหตุนี้ให้บริบทแก่ ClawScan
  สำหรับพฤติกรรมที่อาจดูผิดปกติ เช่น การเข้าถึงเครือข่าย,
  การเข้าถึงโฮสต์เนทีฟ หรือข้อมูลประจำตัวเฉพาะผู้ให้บริการ หมายเหตุจะถูกเก็บไว้ใน
  รีลีสที่เผยแพร่แล้ว
- ชื่อแพ็กเกจแบบมีขอบเขตต้องตรงกับเจ้าของที่เลือก ดู `docs/publishing.md`
- แฟล็กที่มีอยู่ (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ยังใช้งานเป็น overrides ได้
- รีโป GitHub ส่วนตัวต้องใช้ `GITHUB_TOKEN`

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### โฟลว์ในเครื่องที่แนะนำ

ใช้ `--dry-run` ก่อนเพื่อให้คุณยืนยันเมตาดาต้าแพ็กเกจที่ resolve แล้วและ
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

- `package.json.version` คือเวอร์ชันรีลีสของแพ็กเกจคุณ แต่จะไม่ถูกใช้เป็น
  fallback สำหรับการตรวจสอบความเข้ากันได้/การสร้างของ OpenClaw
- `openclaw.hostTargets` และ `openclaw.environment` เป็นเมตาดาต้าแบบไม่บังคับ
  ClawHub อาจแสดงเมื่อมีอยู่ แต่ไม่จำเป็นสำหรับการเผยแพร่
- `openclaw.compat.minGatewayVersion` และ
  `openclaw.build.pluginSdkVersion` เป็นข้อมูลเสริมแบบไม่บังคับหากคุณต้องการเผยแพร่
  เมตาดาต้าความเข้ากันได้ที่ละเอียดขึ้น
- หากคุณใช้รีลีส CLI `clawhub` ที่เก่ากว่า ให้อัปเกรดก่อนเผยแพร่เพื่อให้
  การตรวจสอบก่อนบินในเครื่องทำงานก่อนอัปโหลด

#### GitHub Actions

ClawHub ยังจัดส่งเวิร์กโฟลว์ reusable อย่างเป็นทางการที่
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/53b64d1d911106dab570eb6260e6ee977e9eefcd/.github/workflows/package-publish.yml)
สำหรับรีโป Plugin

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

- เวิร์กโฟลว์ reusable ตั้งค่าเริ่มต้น `source` เป็นรีโปของผู้เรียก
- สำหรับ monorepo ให้ส่ง `source_path` เพื่อให้เวิร์กโฟลว์เผยแพร่โฟลเดอร์แพ็กเกจ
  Plugin ตัวอย่างเช่น `source_path: extensions/codex`
- ปักหมุดเวิร์กโฟลว์ reusable กับแท็กที่เสถียรหรือ SHA คอมมิตแบบเต็ม อย่าเผยแพร่รีลีสจาก `@main`
- `pull_request` ควรใช้ `dry_run: true` เพื่อให้ CI ไม่สร้างผลกระทบ
- การเผยแพร่จริงควรถูกจำกัดไว้ที่เหตุการณ์ที่เชื่อถือได้ เช่น `workflow_dispatch` หรือการ push แท็ก
- การเผยแพร่แบบ trusted โดยไม่มี secret ใช้ได้เฉพาะบน `workflow_dispatch`; การ push แท็กยังต้องใช้ `clawhub_token`
- เก็บ `clawhub_token` ให้พร้อมสำหรับการเผยแพร่ครั้งแรก, แพ็กเกจที่ไม่น่าเชื่อถือ หรือการเผยแพร่ฉุกเฉิน
- เวิร์กโฟลว์อัปโหลดผลลัพธ์ JSON เป็นอาร์ติแฟกต์และเปิดเผยเป็นเอาต์พุตของเวิร์กโฟลว์

### `sync`

- สแกนหาโฟลเดอร์ Skills ในเครื่องและเผยแพร่รายการใหม่/ที่เปลี่ยนแปลง
- รากสามารถเป็นโฟลเดอร์ใดก็ได้: ไดเรกทอรี skills หรือโฟลเดอร์ skill เดี่ยวที่มี `SKILL.md`
- เพิ่มราก skill ของ Clawdbot โดยอัตโนมัติเมื่อมี `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (เอเจนต์หลัก)
  - `routing.agents.*.workspace/skills` (ต่อเอเจนต์)
  - `~/.clawdbot/skills` (ใช้ร่วมกัน)
  - `skills.load.extraDirs` (แพ็กที่ใช้ร่วมกัน)
- เคารพ `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` และ `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`
- แฟล็ก:
  - `--root <dir...>` รากสแกนเพิ่มเติม
  - `--all` อัปโหลดโดยไม่ถาม
  - `--dry-run` แสดงเฉพาะแผน
  - `--bump patch|minor|major` (ค่าเริ่มต้น: patch)
  - `--changelog <text>` (ไม่โต้ตอบ)
  - `--tags a,b,c` (ค่าเริ่มต้น: latest)
  - `--concurrency <n>` (ค่าเริ่มต้น: 4)

Telemetry:

- ส่งระหว่าง `sync` เมื่อล็อกอินอยู่ เว้นแต่ `CLAWHUB_DISABLE_TELEMETRY=1` (เดิม `CLAWDHUB_DISABLE_TELEMETRY=1`)
- รายละเอียด: `docs/telemetry.md`
