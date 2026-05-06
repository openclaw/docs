---
read_when:
    - การค้นหา ติดตั้ง หรืออัปเดต Skills หรือ Plugin
    - การเผยแพร่ Skills หรือ Plugin ไปยังรีจิสทรี
    - การกำหนดค่า clawhub CLI หรือค่าทับซ้อนจากสภาพแวดล้อม
sidebarTitle: ClawHub
summary: 'ClawHub: รีจิสทรีสาธารณะสำหรับ Skills และ Plugin ของ OpenClaw, โฟลว์การติดตั้งแบบเนทีฟ และ CLI ของ clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-06T09:32:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78ccf1911344d71b3b1c2c94691e15108305348e09db62aaaf1d03d852984acd
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub คือรีจิสทรีสาธารณะสำหรับ **OpenClaw Skills และ plugins**

- ใช้คำสั่ง `openclaw` แบบเนทีฟเพื่อค้นหา ติดตั้ง และอัปเดต Skills รวมถึงติดตั้ง plugins จาก ClawHub
- ใช้ CLI `clawhub` แยกต่างหากสำหรับเวิร์กโฟลว์การยืนยันตัวตนรีจิสทรี การเผยแพร่ การลบ/กู้คืน และการซิงก์

ไซต์: [clawhub.ai](https://clawhub.ai)

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="Search">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Install">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Use">
    เริ่มเซสชัน OpenClaw ใหม่ - ระบบจะรับ skill ใหม่มาใช้
  </Step>
  <Step title="Publish (optional)">
    สำหรับเวิร์กโฟลว์ที่ยืนยันตัวตนกับรีจิสทรีแล้ว (เผยแพร่ ซิงก์ จัดการ) ให้ติดตั้ง
    CLI `clawhub` แยกต่างหาก:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## โฟลว์ OpenClaw แบบเนทีฟ

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    คำสั่ง `openclaw` แบบเนทีฟจะติดตั้งลงในเวิร์กสเปซที่ใช้งานอยู่ของคุณและ
    เก็บเมทาดาทาแหล่งที่มาไว้ เพื่อให้การเรียก `update` ในภายหลังยังคงใช้ ClawHub ได้

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` จะค้นหาแคตตาล็อก plugin ของ ClawHub และพิมพ์ชื่อแพ็กเกจ
    ที่พร้อมติดตั้ง ใช้ `clawhub:<package>` เมื่อต้องการให้ ClawHub เป็นตัว resolve
    สเปก plugin ที่ปลอดภัยสำหรับ npm แบบไม่ใส่คำนำหน้าจะติดตั้งจาก npm ระหว่างช่วงเปลี่ยนผ่านการเปิดตัว:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` ก็เป็น npm-only เช่นกัน และมีประโยชน์เมื่อสเปกอาจกำกวมได้:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    การติดตั้ง Plugin จะตรวจสอบความเข้ากันได้ของ `pluginApi` และ
    `minGatewayVersion` ที่ประกาศไว้ก่อนที่การติดตั้ง archive จะทำงาน ดังนั้น
    โฮสต์ที่เข้ากันไม่ได้จะล้มเหลวแบบปิดตั้งแต่เนิ่นๆ แทนที่จะติดตั้ง
    แพ็กเกจเพียงบางส่วน เมื่อเวอร์ชันแพ็กเกจเผยแพร่ artifact ClawPack
    OpenClaw จะเลือก `.tgz` แบบ npm-pack ที่อัปโหลดมาตรงเวอร์ชัน ตรวจสอบ
    ส่วนหัว digest ของ ClawHub และไบต์ที่ดาวน์โหลด แล้วบันทึกชนิด artifact,
    npm integrity, npm shasum, ชื่อ tarball และเมทาดาทา digest ของ ClawPack สำหรับ
    การอัปเดตในภายหลัง เวอร์ชันแพ็กเกจเก่าที่ไม่มีเมทาดาทา ClawPack ยังคงใช้
    เส้นทางการตรวจสอบ archive แพ็กเกจแบบเดิม

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` รับเฉพาะตระกูล plugin
ที่ติดตั้งได้เท่านั้น หากแพ็กเกจ ClawHub เป็น skill จริงๆ OpenClaw จะหยุดและ
ชี้ให้คุณใช้ `openclaw skills install <slug>` แทน

การติดตั้ง plugin จาก ClawHub แบบไม่ระบุตัวตนจะล้มเหลวแบบปิดสำหรับแพ็กเกจส่วนตัวด้วย
ช่องทางชุมชนหรือช่องทางอื่นที่ไม่เป็นทางการยังคงติดตั้งได้ แต่ OpenClaw
จะแจ้งเตือนเพื่อให้ผู้ดูแลตรวจสอบแหล่งที่มาและการยืนยันก่อนเปิดใช้งาน
</Note>

## ClawHub คืออะไร

- รีจิสทรีสาธารณะสำหรับ OpenClaw Skills และ plugins
- ที่เก็บแบบมีเวอร์ชันสำหรับบันเดิล skill และเมทาดาทา
- พื้นที่ค้นพบสำหรับการค้นหา แท็ก และสัญญาณการใช้งาน

skill ทั่วไปคือบันเดิลไฟล์แบบมีเวอร์ชันซึ่งประกอบด้วย:

- ไฟล์ `SKILL.md` พร้อมคำอธิบายหลักและวิธีใช้งาน
- คอนฟิก สคริปต์ หรือไฟล์สนับสนุนเพิ่มเติมที่ skill ใช้
- เมทาดาทา เช่น แท็ก สรุป และข้อกำหนดในการติดตั้ง

ClawHub ใช้เมทาดาทาเพื่อขับเคลื่อนการค้นพบและเปิดเผยความสามารถของ skill
อย่างปลอดภัย รีจิสทรีติดตามสัญญาณการใช้งาน (ดาว การดาวน์โหลด) เพื่อ
ปรับปรุงการจัดอันดับและการมองเห็น การเผยแพร่แต่ละครั้งจะสร้างเวอร์ชัน semver
ใหม่ และรีจิสทรีจะเก็บประวัติเวอร์ชันไว้เพื่อให้ผู้ใช้ตรวจสอบ
การเปลี่ยนแปลงได้

## เวิร์กสเปซและการโหลด skill

CLI `clawhub` แยกต่างหากยังติดตั้ง Skills ลงใน `./skills` ภายใต้
ไดเรกทอรีทำงานปัจจุบันของคุณด้วย หากกำหนดค่าเวิร์กสเปซ OpenClaw ไว้
`clawhub` จะ fallback ไปยังเวิร์กสเปซนั้น เว้นแต่คุณจะ override `--workdir`
(หรือ `CLAWHUB_WORKDIR`) OpenClaw โหลด Skills ของเวิร์กสเปซจาก
`<workspace>/skills` และรับมาใช้ในเซสชัน **ถัดไป**

หากคุณใช้ `~/.openclaw/skills` หรือ Skills ที่มาพร้อมระบบอยู่แล้ว Skills
ของเวิร์กสเปซจะมีลำดับความสำคัญสูงกว่า สำหรับรายละเอียดเพิ่มเติมเกี่ยวกับวิธีโหลด
แชร์ และ gate Skills โปรดดู [Skills](/th/tools/skills)

## คุณสมบัติของบริการ

| คุณสมบัติ                  | หมายเหตุ                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| การเรียกดูสาธารณะ          | Skills และเนื้อหา `SKILL.md` ของ Skills เหล่านั้นดูได้แบบสาธารณะ          |
| การค้นหา                   | ขับเคลื่อนด้วย embedding (การค้นหาแบบเวกเตอร์) ไม่ใช่แค่คีย์เวิร์ด               |
| การกำหนดเวอร์ชัน               | Semver, changelog และแท็ก (รวมถึง `latest`)                  |
| การดาวน์โหลด                | Zip ต่อเวอร์ชัน                                                    |
| ดาวและความคิดเห็น       | ข้อเสนอแนะจากชุมชน                                                 |
| สรุปการสแกนความปลอดภัย  | หน้ารายละเอียดแสดงสถานะการสแกนล่าสุดก่อนติดตั้งหรือดาวน์โหลด |
| หน้ารายละเอียดสแกนเนอร์     | ผลลัพธ์ VirusTotal, ClawScan และการวิเคราะห์แบบสแตติกมีลิงก์เชิงลึก  |
| แดชบอร์ดการกู้คืนของเจ้าของ | ผู้เผยแพร่สามารถดูเนื้อหาที่ตนเป็นเจ้าของซึ่งถูกกักไว้จากการสแกนได้จาก `/dashboard`       |
| การสแกนซ้ำที่เจ้าของร้องขอ  | เจ้าของสามารถขอสแกนซ้ำแบบจำกัดเพื่อกู้คืนกรณี false positive ได้     |
| การกลั่นกรอง               | การอนุมัติและการตรวจสอบ                                               |
| API ที่เป็นมิตรกับ CLI         | เหมาะสำหรับอัตโนมัติและการเขียนสคริปต์                              |

## ความปลอดภัยและการกลั่นกรอง

ClawHub เปิดโดยปริยาย - ทุกคนสามารถอัปโหลด Skills ได้ แต่บัญชี GitHub
ต้องมีอายุ **อย่างน้อยหนึ่งสัปดาห์** จึงจะเผยแพร่ได้ วิธีนี้ช่วยชะลอ
การใช้งานในทางที่ผิดโดยไม่ปิดกั้นผู้ร่วมพัฒนาที่ถูกต้อง

<AccordionGroup>
  <Accordion title="Security scans">
    ClawHub ทำการตรวจสอบความปลอดภัยอัตโนมัติกับ Skills และ release ของ plugin
    ที่เผยแพร่ หน้ารายละเอียดสาธารณะจะสรุปผลปัจจุบัน และแถวสแกนเนอร์
    จะลิงก์ไปยังหน้ารายละเอียดเฉพาะสำหรับ VirusTotal, ClawScan และการวิเคราะห์แบบสแตติก

    release ที่ถูกกักไว้จากการสแกนหรือถูกบล็อกอาจไม่พร้อมใช้งานในแคตตาล็อกสาธารณะและ
    พื้นที่ติดตั้ง แต่ยังคงมองเห็นได้สำหรับเจ้าของใน `/dashboard`

  </Accordion>
  <Accordion title="Reporting">
    - ผู้ใช้ที่ลงชื่อเข้าใช้แล้วทุกคนสามารถรายงาน skill ได้
    - ต้องระบุเหตุผลการรายงาน และระบบจะบันทึกไว้
    - ผู้ใช้แต่ละคนมีรายงานที่ใช้งานอยู่ได้สูงสุด 20 รายการในเวลาเดียวกัน
    - Skills ที่มีรายงานไม่ซ้ำกันมากกว่า 3 รายการจะถูกซ่อนอัตโนมัติโดยค่าเริ่มต้น

  </Accordion>
  <Accordion title="Moderation">
    - ผู้ดูแลสามารถดู Skills ที่ซ่อนอยู่ เลิกซ่อน ลบ หรือแบนผู้ใช้ได้
    - การใช้ฟีเจอร์รายงานในทางที่ผิดอาจทำให้บัญชีถูกแบน
    - สนใจเป็นผู้ดูแลหรือไม่? สอบถามใน Discord ของ OpenClaw และติดต่อผู้ดูแลหรือ maintainer

  </Accordion>
</AccordionGroup>

## CLI ของ ClawHub

คุณต้องใช้สิ่งนี้เฉพาะสำหรับเวิร์กโฟลว์ที่ยืนยันตัวตนกับรีจิสทรีแล้ว เช่น
การเผยแพร่/ซิงก์

### ตัวเลือกระดับโกลบอล

<ParamField path="--workdir <dir>" type="string">
  ไดเรกทอรีทำงาน ค่าเริ่มต้น: ไดเรกทอรีปัจจุบัน; fallback ไปยังเวิร์กสเปซ OpenClaw
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  ไดเรกทอรี Skills สัมพันธ์กับ workdir
</ParamField>
<ParamField path="--site <url>" type="string">
  URL ฐานของไซต์ (การเข้าสู่ระบบผ่านเบราว์เซอร์)
</ParamField>
<ParamField path="--registry <url>" type="string">
  URL ฐานของ Registry API
</ParamField>
<ParamField path="--no-input" type="boolean">
  ปิดใช้งาน prompt (ไม่โต้ตอบ)
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  พิมพ์เวอร์ชัน CLI
</ParamField>

### คำสั่ง

<AccordionGroup>
  <Accordion title="Auth (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    ตัวเลือกการเข้าสู่ระบบ:

    - `--token <token>` - วาง API token
    - `--label <label>` - ป้ายกำกับที่เก็บไว้สำหรับ token การเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `CLI token`)
    - `--no-browser` - ไม่เปิดเบราว์เซอร์ (ต้องใช้ `--token`)

  </Accordion>
  <Accordion title="Search">
    ```bash
    clawhub search "query"
    ```

    ค้นหา Skills สำหรับการค้นพบ plugin/แพ็กเกจ ให้ใช้ `clawhub package explore`

    - `--limit <n>` - จำนวนผลลัพธ์สูงสุด

  </Accordion>
  <Accordion title="Browse / inspect plugins">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` และ `package inspect` คือพื้นผิว CLI ของ ClawHub สำหรับการค้นพบ plugin/แพ็กเกจและการตรวจสอบเมทาดาทา การติดตั้งแบบเนทีฟของ OpenClaw ยังคงใช้ `openclaw plugins install clawhub:<package>`

    ตัวเลือก:

    - `--family skill|code-plugin|bundle-plugin` - กรองตระกูลแพ็กเกจ
    - `--official` - แสดงเฉพาะแพ็กเกจทางการ
    - `--executes-code` - แสดงเฉพาะแพ็กเกจที่เรียกใช้โค้ด
    - `--version <version>` / `--tag <tag>` - ตรวจสอบเวอร์ชันแพ็กเกจเฉพาะ
    - `--versions`, `--files`, `--file <path>` - ตรวจสอบประวัติและไฟล์ของแพ็กเกจ
    - `--json` - เอาต์พุตที่เครื่องอ่านได้

  </Accordion>
  <Accordion title="Install / update / list">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    ตัวเลือก:

    - `--version <version>` - ติดตั้งหรืออัปเดตเป็นเวอร์ชันเฉพาะ (ใช้ slug เดียวเท่านั้นกับ `update`)
    - `--force` - เขียนทับหากโฟลเดอร์มีอยู่แล้ว หรือเมื่อไฟล์ในเครื่องไม่ตรงกับเวอร์ชันที่เผยแพร่ใดๆ
    - `clawhub list` อ่าน `.clawhub/lock.json`

  </Accordion>
  <Accordion title="Publish skills">
    ```bash
    clawhub skill publish <path>
    ```

    ตัวเลือก:

    - `--slug <slug>` - slug ของ skill
    - `--name <name>` - ชื่อที่แสดง
    - `--version <version>` - เวอร์ชัน semver
    - `--changelog <text>` - ข้อความ changelog (เว้นว่างได้)
    - `--tags <tags>` - แท็กคั่นด้วยคอมมา (ค่าเริ่มต้น: `latest`)

  </Accordion>
  <Accordion title="Publish plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` อาจเป็นโฟลเดอร์ในเครื่อง, `owner/repo`, `owner/repo@ref` หรือ
    URL ของ GitHub

    ตัวเลือก:

    - `--dry-run` - สร้างแผนเผยแพร่ที่ตรงจริงโดยไม่อัปโหลดอะไรเลย
    - `--json` - ส่งออกเอาต์พุตที่เครื่องอ่านได้สำหรับ CI
    - `--source-repo`, `--source-commit`, `--source-ref` - override เพิ่มเติมเมื่อการตรวจจับอัตโนมัติยังไม่เพียงพอ

  </Accordion>
  <Accordion title="Request rescans">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    คำสั่ง rescan ต้องใช้ owner token ที่เข้าสู่ระบบแล้ว และเล็งเป้าหมายไปที่
    เวอร์ชัน skill ที่เผยแพร่ล่าสุดหรือ release ของ plugin ในการรันแบบไม่โต้ตอบ ให้ส่ง
    `--yes`

    การตอบกลับ JSON มีชนิดเป้าหมาย ชื่อ เวอร์ชัน สถานะ rescan และ
    จำนวนคำขอที่เหลือ/สูงสุดสำหรับเวอร์ชันหรือ release นั้น

  </Accordion>
  <Accordion title="Delete / undelete (owner or admin)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Sync (scan local + publish new or updated)">
    ```bash
    clawhub sync
    ```

    ตัวเลือก:

    - `--root <dir...>` - รากการสแกนเพิ่มเติม
    - `--all` - อัปโหลดทุกอย่างโดยไม่ถาม
    - `--dry-run` - แสดงสิ่งที่จะถูกอัปโหลด
    - `--bump <type>` - `patch|minor|major` สำหรับการอัปเดต (ค่าเริ่มต้น: `patch`)
    - `--changelog <text>` - changelog สำหรับการอัปเดตแบบไม่โต้ตอบ
    - `--tags <tags>` - แท็กคั่นด้วยคอมมา (ค่าเริ่มต้น: `latest`)
    - `--concurrency <n>` - การตรวจสอบรีจิสทรี (ค่าเริ่มต้น: `4`)

  </Accordion>
</AccordionGroup>

## เวิร์กโฟลว์ทั่วไป

<Tabs>
  <Tab title="ค้นหา">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="ค้นหา Plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="ติดตั้ง">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="อัปเดตทั้งหมด">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="เผยแพร่ Skill เดียว">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="ซิงค์ Skills หลายรายการ">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="เผยแพร่ Plugin จาก GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### ข้อมูลเมทาดาทาของแพ็กเกจ Plugin

Plugin โค้ดต้องมีข้อมูลเมทาดาทา OpenClaw ที่จำเป็นใน
`package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

แพ็กเกจที่เผยแพร่ควรจัดส่ง **JavaScript ที่ build แล้ว** และชี้
`runtimeExtensions` ไปยังเอาต์พุตนั้น การติดตั้งจาก Git checkout ยังสามารถ
ถอยกลับไปใช้ซอร์ส TypeScript ได้เมื่อไม่มีไฟล์ที่ build แล้ว แต่รายการ runtime
ที่ build แล้วช่วยหลีกเลี่ยงการคอมไพล์ TypeScript ระหว่าง runtime ในเส้นทางเริ่มต้น, doctor และ
การโหลด Plugin

## การกำหนดเวอร์ชัน, lockfile และ telemetry

<AccordionGroup>
  <Accordion title="การกำหนดเวอร์ชันและแท็ก">
    - การเผยแพร่แต่ละครั้งจะสร้าง `SkillVersion` แบบ **semver** ใหม่
    - แท็ก (เช่น `latest`) ชี้ไปยังเวอร์ชันหนึ่ง การย้ายแท็กช่วยให้คุณย้อนกลับได้
    - changelog แนบกับแต่ละเวอร์ชัน และสามารถว่างได้เมื่อซิงค์หรือเผยแพร่อัปเดต

  </Accordion>
  <Accordion title="การเปลี่ยนแปลงในเครื่องเทียบกับเวอร์ชันใน registry">
    การอัปเดตจะเปรียบเทียบเนื้อหา Skill ในเครื่องกับเวอร์ชันใน registry โดยใช้
    content hash หากไฟล์ในเครื่องไม่ตรงกับเวอร์ชันที่เผยแพร่ใด ๆ
    CLI จะถามก่อนเขียนทับ (หรือต้องใช้ `--force` ใน
    การรันแบบไม่โต้ตอบ)
  </Accordion>
  <Accordion title="การสแกน sync และราก fallback">
    `clawhub sync` จะสแกน workdir ปัจจุบันของคุณก่อน หากไม่พบ Skills
    ระบบจะ fallback ไปยังตำแหน่ง legacy ที่รู้จัก (เช่น
    `~/openclaw/skills` และ `~/.openclaw/skills`) สิ่งนี้ออกแบบมาเพื่อ
    ค้นหาการติดตั้ง Skill รุ่นเก่าโดยไม่ต้องใช้แฟล็กเพิ่มเติม
  </Accordion>
  <Accordion title="พื้นที่จัดเก็บและ lockfile">
    - Skills ที่ติดตั้งจะถูกบันทึกใน `.clawhub/lock.json` ใต้ workdir ของคุณ
    - token การยืนยันตัวตนถูกจัดเก็บในไฟล์ config ของ ClawHub CLI (override ได้ผ่าน `CLAWHUB_CONFIG_PATH`)

  </Accordion>
  <Accordion title="Telemetry (จำนวนการติดตั้ง)">
    เมื่อคุณรัน `clawhub sync` ขณะเข้าสู่ระบบอยู่ CLI จะส่ง snapshot ขั้นต่ำ
    เพื่อคำนวณจำนวนการติดตั้ง คุณสามารถปิดใช้งานสิ่งนี้ทั้งหมดได้:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## ตัวแปรสภาพแวดล้อม

| ตัวแปร                        | ผลลัพธ์                                         |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Override URL ของไซต์                           |
| `CLAWHUB_REGISTRY`            | Override URL ของ API registry                  |
| `CLAWHUB_CONFIG_PATH`         | Override ตำแหน่งที่ CLI จัดเก็บ token/config |
| `CLAWHUB_WORKDIR`             | Override workdir เริ่มต้น                      |
| `CLAWHUB_DISABLE_TELEMETRY=1` | ปิดใช้งาน telemetry บน `sync`                  |

## ที่เกี่ยวข้อง

- [Plugin ชุมชน](/th/plugins/community)
- [Plugins](/th/tools/plugin)
- [Skills](/th/tools/skills)
