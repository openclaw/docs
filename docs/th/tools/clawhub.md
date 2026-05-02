---
read_when:
    - การค้นหา ติดตั้ง หรืออัปเดต Skills หรือ Plugin
    - การเผยแพร่ Skills หรือ Plugin ไปยังรีจิสทรี
    - การกำหนดค่า clawhub CLI หรือค่าการแทนที่จากสภาพแวดล้อม
sidebarTitle: ClawHub
summary: 'ClawHub: รีจิสทรีสาธารณะสำหรับ Skills และ Plugin ของ OpenClaw, โฟลว์การติดตั้งแบบเนทีฟ และ clawhub CLI'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T21:00:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd422cb3e7e53fcc6d2b8a557ebc569debb0b470d5fcf141d90499c03fb4d7b3
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub เป็นรีจิสทรีสาธารณะสำหรับ **OpenClaw Skills และ Plugin**

- ใช้คำสั่ง `openclaw` แบบเนทีฟเพื่อค้นหา ติดตั้ง และอัปเดต Skills และเพื่อติดตั้ง Plugin จาก ClawHub
- ใช้ CLI `clawhub` แยกต่างหากสำหรับเวิร์กโฟลว์การยืนยันตัวตนกับรีจิสทรี การเผยแพร่ การลบ/ยกเลิกการลบ และการซิงค์

ไซต์: [clawhub.ai](https://clawhub.ai)

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ค้นหา">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="ติดตั้ง">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="ใช้งาน">
    เริ่มเซสชัน OpenClaw ใหม่ ซึ่งจะรับ Skill ใหม่เข้ามาใช้งาน
  </Step>
  <Step title="เผยแพร่ (ไม่บังคับ)">
    สำหรับเวิร์กโฟลว์ที่ยืนยันตัวตนกับรีจิสทรีแล้ว (เผยแพร่ ซิงค์ จัดการ) ให้ติดตั้ง
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
    เก็บเมทาดาทาของแหล่งที่มาไว้ เพื่อให้การเรียก `update` ภายหลังยังคงใช้ ClawHub ได้

  </Tab>
  <Tab title="Plugin">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` จะคิวรีแค็ตตาล็อก Plugin ของ ClawHub และพิมพ์
    ชื่อแพ็กเกจที่พร้อมติดตั้ง ใช้ `clawhub:<package>` เมื่อคุณต้องการการ resolve ผ่าน ClawHub
    สเปก Plugin แบบเปล่าที่ปลอดภัยสำหรับ npm จะติดตั้งจาก npm ระหว่างช่วงเปลี่ยนผ่านการเปิดตัว:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` ก็เป็นแบบ npm เท่านั้นเช่นกัน และมีประโยชน์เมื่อสเปกอาจ
    กำกวมได้:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    การติดตั้ง Plugin จะตรวจสอบความเข้ากันได้ของ `pluginApi` และ
    `minGatewayVersion` ที่ประกาศไว้ก่อนการติดตั้งอาร์ไคฟ์จะทำงาน ดังนั้น
    โฮสต์ที่ไม่เข้ากันจะปิดล้มเหลวตั้งแต่เนิ่น ๆ แทนที่จะติดตั้งแพ็กเกจ
    เพียงบางส่วน เมื่อเวอร์ชันแพ็กเกจเผยแพร่อาร์ติแฟกต์ ClawPack
    OpenClaw จะเลือก npm-pack `.tgz` ที่อัปโหลดไว้อย่างตรงกัน ตรวจสอบ
    เฮดเดอร์ไดเจสต์ ClawHub และไบต์ที่ดาวน์โหลด และบันทึกชนิดอาร์ติแฟกต์
    npm integrity, npm shasum, ชื่อ tarball และเมทาดาทาไดเจสต์ ClawPack สำหรับ
    การอัปเดตภายหลัง เวอร์ชันแพ็กเกจเก่าที่ไม่มีเมทาดาทา ClawPack ยังใช้
    เส้นทางการตรวจสอบอาร์ไคฟ์แพ็กเกจแบบเดิม

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` ยอมรับเฉพาะตระกูล Plugin
ที่ติดตั้งได้เท่านั้น หากแพ็กเกจ ClawHub เป็น Skill จริง ๆ OpenClaw จะหยุดและ
ชี้คุณไปที่ `openclaw skills install <slug>` แทน

การติดตั้ง Plugin จาก ClawHub แบบไม่ระบุตัวตนจะปิดล้มเหลวสำหรับแพ็กเกจส่วนตัวด้วย
ช่องทางชุมชนหรือช่องทางที่ไม่เป็นทางการอื่น ๆ ยังติดตั้งได้ แต่ OpenClaw
จะแจ้งเตือนเพื่อให้ผู้ปฏิบัติงานตรวจสอบแหล่งที่มาและการยืนยันก่อนเปิดใช้งาน
</Note>

## ClawHub คืออะไร

- รีจิสทรีสาธารณะสำหรับ OpenClaw Skills และ Plugin
- ที่เก็บบันเดิล Skill และเมทาดาทาแบบมีเวอร์ชัน
- พื้นผิวสำหรับการค้นพบผ่านการค้นหา แท็ก และสัญญาณการใช้งาน

Skill ทั่วไปคือบันเดิลไฟล์แบบมีเวอร์ชันที่ประกอบด้วย:

- ไฟล์ `SKILL.md` ที่มีคำอธิบายหลักและวิธีใช้งาน
- คอนฟิก สคริปต์ หรือไฟล์สนับสนุนเสริมที่ Skill ใช้
- เมทาดาทา เช่น แท็ก สรุป และข้อกำหนดการติดตั้ง

ClawHub ใช้เมทาดาทาเพื่อขับเคลื่อนการค้นพบและเปิดเผยความสามารถของ Skill
อย่างปลอดภัย รีจิสทรีติดตามสัญญาณการใช้งาน (ดาว ดาวน์โหลด) เพื่อ
ปรับปรุงการจัดอันดับและการมองเห็น การเผยแพร่แต่ละครั้งจะสร้างเวอร์ชัน
semver ใหม่ และรีจิสทรีจะเก็บประวัติเวอร์ชันเพื่อให้ผู้ใช้ตรวจสอบ
การเปลี่ยนแปลงได้

## เวิร์กสเปซและการโหลด Skill

CLI `clawhub` แยกต่างหากยังติดตั้ง Skills ลงใน `./skills` ภายใต้
ไดเรกทอรีทำงานปัจจุบันของคุณด้วย หากกำหนดค่าเวิร์กสเปซ OpenClaw ไว้
`clawhub` จะย้อนกลับไปใช้เวิร์กสเปซนั้น เว้นแต่คุณจะ override `--workdir`
(หรือ `CLAWHUB_WORKDIR`) OpenClaw โหลด Skills ของเวิร์กสเปซจาก
`<workspace>/skills` และรับเข้ามาใช้งานในเซสชัน **ถัดไป**

หากคุณใช้ `~/.openclaw/skills` หรือ Skills ที่บันเดิลไว้อยู่แล้ว
Skills ของเวิร์กสเปซจะมีลำดับความสำคัญสูงกว่า สำหรับรายละเอียดเพิ่มเติมเกี่ยวกับวิธีโหลด
แชร์ และ gate Skills โปรดดู [Skills](/th/tools/skills)

## คุณสมบัติของบริการ

| คุณสมบัติ                  | หมายเหตุ                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| การเรียกดูแบบสาธารณะ          | Skills และเนื้อหา `SKILL.md` ของ Skills เหล่านั้นดูได้แบบสาธารณะ          |
| การค้นหา                   | ขับเคลื่อนด้วย embedding (การค้นหาแบบเวกเตอร์) ไม่ใช่แค่คีย์เวิร์ด               |
| การจัดเวอร์ชัน               | Semver, changelog และแท็ก (รวมถึง `latest`)                  |
| ดาวน์โหลด                | Zip ต่อเวอร์ชัน                                                    |
| ดาวและความคิดเห็น       | ความคิดเห็นจากชุมชน                                                 |
| สรุปการสแกนความปลอดภัย  | หน้ารายละเอียดแสดงสถานะการสแกนล่าสุดก่อนติดตั้งหรือดาวน์โหลด |
| หน้ารายละเอียดของสแกนเนอร์     | ผลลัพธ์จาก VirusTotal, ClawScan และการวิเคราะห์แบบ static มีลิงก์เชิงลึก  |
| แดชบอร์ดกู้คืนของเจ้าของ | ผู้เผยแพร่สามารถดูเนื้อหาที่ตนเป็นเจ้าของซึ่งถูกพักจากการสแกนได้จาก `/dashboard`       |
| การสแกนซ้ำที่เจ้าของร้องขอ  | เจ้าของสามารถร้องขอการสแกนซ้ำแบบจำกัดเพื่อกู้คืนจากผลบวกเท็จ     |
| การกลั่นกรอง               | การอนุมัติและการตรวจสอบ                                               |
| API ที่เป็นมิตรกับ CLI         | เหมาะสำหรับ automation และ scripting                              |

## ความปลอดภัยและการกลั่นกรอง

ClawHub เปิดเป็นค่าเริ่มต้น ทุกคนสามารถอัปโหลด Skills ได้ แต่บัญชี GitHub
ต้องมีอายุ **อย่างน้อยหนึ่งสัปดาห์** จึงจะเผยแพร่ได้ วิธีนี้ช่วยชะลอ
การละเมิดโดยไม่ปิดกั้นผู้มีส่วนร่วมที่ถูกต้อง

<AccordionGroup>
  <Accordion title="การสแกนความปลอดภัย">
    ClawHub รันการตรวจสอบความปลอดภัยอัตโนมัติกับ Skills และ release ของ Plugin
    ที่เผยแพร่ หน้ารายละเอียดสาธารณะจะสรุปผลปัจจุบัน และแถวของสแกนเนอร์
    จะลิงก์ไปยังหน้ารายละเอียดเฉพาะสำหรับ VirusTotal, ClawScan และการวิเคราะห์แบบ static

    Release ที่ถูกพักจากการสแกนหรือถูกบล็อกอาจไม่พร้อมใช้งานบนแค็ตตาล็อกสาธารณะและ
    พื้นผิวการติดตั้ง แต่ยังคงมองเห็นได้สำหรับเจ้าของใน `/dashboard`

  </Accordion>
  <Accordion title="การรายงาน">
    - ผู้ใช้ที่ลงชื่อเข้าใช้แล้วทุกคนสามารถรายงาน Skill ได้
    - ต้องระบุเหตุผลการรายงานและเหตุผลนั้นจะถูกบันทึกไว้
    - ผู้ใช้แต่ละคนมีรายงานที่ยังใช้งานอยู่ได้สูงสุด 20 รายการในเวลาเดียวกัน
    - Skills ที่มีรายงานไม่ซ้ำกันมากกว่า 3 รายการจะถูกซ่อนอัตโนมัติตามค่าเริ่มต้น

  </Accordion>
  <Accordion title="การกลั่นกรอง">
    - ผู้ดูแลสามารถดู Skills ที่ซ่อนอยู่ ยกเลิกการซ่อน ลบ หรือแบนผู้ใช้ได้
    - การใช้ฟีเจอร์รายงานในทางที่ผิดอาจทำให้บัญชีถูกแบน
    - สนใจเป็นผู้ดูแลหรือไม่ ให้ถามใน OpenClaw Discord และติดต่อผู้ดูแลหรือ maintainer

  </Accordion>
</AccordionGroup>

## CLI ของ ClawHub

คุณจำเป็นต้องใช้สิ่งนี้เฉพาะกับเวิร์กโฟลว์ที่ยืนยันตัวตนกับรีจิสทรี เช่น
publish/sync

### ตัวเลือกส่วนกลาง

<ParamField path="--workdir <dir>" type="string">
  ไดเรกทอรีทำงาน ค่าเริ่มต้น: ไดเรกทอรีปัจจุบัน; ย้อนกลับไปใช้เวิร์กสเปซ OpenClaw
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  ไดเรกทอรี Skills แบบสัมพันธ์กับ workdir
</ParamField>
<ParamField path="--site <url>" type="string">
  URL ฐานของไซต์ (การเข้าสู่ระบบผ่านเบราว์เซอร์)
</ParamField>
<ParamField path="--registry <url>" type="string">
  URL ฐานของ Registry API
</ParamField>
<ParamField path="--no-input" type="boolean">
  ปิดใช้พรอมต์ (ไม่โต้ตอบ)
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  พิมพ์เวอร์ชัน CLI
</ParamField>

### คำสั่ง

<AccordionGroup>
  <Accordion title="การยืนยันตัวตน (เข้าสู่ระบบ / ออกจากระบบ / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    ตัวเลือกการเข้าสู่ระบบ:

    - `--token <token>` — วาง API token
    - `--label <label>` — ป้ายกำกับที่จัดเก็บสำหรับ token การเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `CLI token`)
    - `--no-browser` — ไม่เปิดเบราว์เซอร์ (ต้องใช้ `--token`)

  </Accordion>
  <Accordion title="ค้นหา">
    ```bash
    clawhub search "query"
    ```

    ค้นหา Skills สำหรับการค้นพบ Plugin/แพ็กเกจ ให้ใช้ `clawhub package explore`

    - `--limit <n>` — จำนวนผลลัพธ์สูงสุด

  </Accordion>
  <Accordion title="เรียกดู / ตรวจสอบ Plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` และ `package inspect` เป็นพื้นผิวของ ClawHub CLI สำหรับการค้นพบ Plugin/แพ็กเกจและการตรวจสอบเมทาดาทา การติดตั้ง OpenClaw แบบเนทีฟยังคงใช้ `openclaw plugins install clawhub:<package>`

    ตัวเลือก:

    - `--family skill|code-plugin|bundle-plugin` — กรองตระกูลแพ็กเกจ
    - `--official` — แสดงเฉพาะแพ็กเกจทางการ
    - `--executes-code` — แสดงเฉพาะแพ็กเกจที่รันโค้ด
    - `--version <version>` / `--tag <tag>` — ตรวจสอบเวอร์ชันแพ็กเกจที่ระบุ
    - `--versions`, `--files`, `--file <path>` — ตรวจสอบประวัติและไฟล์ของแพ็กเกจ
    - `--json` — เอาต์พุตที่เครื่องอ่านได้

  </Accordion>
  <Accordion title="ติดตั้ง / อัปเดต / แสดงรายการ">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    ตัวเลือก:

    - `--version <version>` — ติดตั้งหรืออัปเดตเป็นเวอร์ชันที่ระบุ (slug เดียวเท่านั้นบน `update`)
    - `--force` — เขียนทับหากโฟลเดอร์มีอยู่แล้ว หรือเมื่อไฟล์ในเครื่องไม่ตรงกับเวอร์ชันที่เผยแพร่ใด ๆ
    - `clawhub list` อ่าน `.clawhub/lock.json`

  </Accordion>
  <Accordion title="เผยแพร่ Skills">
    ```bash
    clawhub skill publish <path>
    ```

    ตัวเลือก:

    - `--slug <slug>` — slug ของ Skill
    - `--name <name>` — ชื่อที่แสดง
    - `--version <version>` — เวอร์ชัน semver
    - `--changelog <text>` — ข้อความ changelog (เว้นว่างได้)
    - `--tags <tags>` — แท็กที่คั่นด้วยเครื่องหมายจุลภาค (ค่าเริ่มต้น: `latest`)

  </Accordion>
  <Accordion title="เผยแพร่ Plugin">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` อาจเป็นโฟลเดอร์ในเครื่อง, `owner/repo`, `owner/repo@ref` หรือ
    URL GitHub

    ตัวเลือก:

    - `--dry-run` — สร้างแผนการเผยแพร่ที่ตรงกันโดยไม่อัปโหลดสิ่งใด
    - `--json` — ส่งออกเอาต์พุตที่เครื่องอ่านได้สำหรับ CI
    - `--source-repo`, `--source-commit`, `--source-ref` — override เพิ่มเติมเมื่อการตรวจจับอัตโนมัติยังไม่เพียงพอ

  </Accordion>
  <Accordion title="ร้องขอการสแกนซ้ำ">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    คำสั่งสแกนซ้ำต้องใช้ token ของเจ้าของที่เข้าสู่ระบบแล้ว และกำหนดเป้าหมายเป็น
    เวอร์ชัน Skill หรือ release ของ Plugin ที่เผยแพร่ล่าสุด ในการรันแบบไม่โต้ตอบ ให้ส่ง
    `--yes`

    การตอบกลับ JSON รวมถึงชนิดเป้าหมาย ชื่อ เวอร์ชัน สถานะการสแกนซ้ำ และ
    จำนวนคำขอที่เหลือ/สูงสุดสำหรับเวอร์ชันหรือ release นั้น

  </Accordion>
  <Accordion title="ลบ / ยกเลิกการลบ (เจ้าของหรือผู้ดูแลระบบ)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="ซิงค์ (สแกนในเครื่อง + เผยแพร่รายการใหม่หรือที่อัปเดต)">
    ```bash
    clawhub sync
    ```

    ตัวเลือก:

    - `--root <dir...>` — รากการสแกนเพิ่มเติม
    - `--all` — อัปโหลดทุกอย่างโดยไม่มีพรอมต์
    - `--dry-run` — แสดงสิ่งที่จะถูกอัปโหลด
    - `--bump <type>` — `patch|minor|major` สำหรับการอัปเดต (ค่าเริ่มต้น: `patch`)
    - `--changelog <text>` — changelog สำหรับการอัปเดตแบบไม่โต้ตอบ
    - `--tags <tags>` — แท็กที่คั่นด้วยเครื่องหมายจุลภาค (ค่าเริ่มต้น: `latest`)
    - `--concurrency <n>` — การตรวจสอบรีจิสทรี (ค่าเริ่มต้น: `4`)

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
  <Tab title="เผยแพร่ skill เดียว">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="ซิงค์ Skills จำนวนมาก">
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

### เมทาดาทาแพ็กเกจ Plugin

Plugin แบบโค้ดต้องมีเมทาดาทา OpenClaw ที่จำเป็นใน
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

แพ็กเกจที่เผยแพร่แล้วควรจัดส่ง **JavaScript ที่ build แล้ว** และชี้
`runtimeExtensions` ไปยังเอาต์พุตนั้น การติดตั้งจาก Git checkout ยังสามารถ fallback
กลับไปใช้ซอร์ส TypeScript ได้เมื่อไม่มีไฟล์ที่ build แล้ว แต่รายการ runtime
ที่ build แล้วจะหลีกเลี่ยงการคอมไพล์ TypeScript ระหว่าง runtime ในเส้นทาง startup, doctor และ
การโหลด Plugin

## การกำหนดเวอร์ชัน, lockfile และ telemetry

<AccordionGroup>
  <Accordion title="การกำหนดเวอร์ชันและแท็ก">
    - การเผยแพร่แต่ละครั้งจะสร้าง `SkillVersion` **semver** ใหม่
    - แท็ก (เช่น `latest`) ชี้ไปยังเวอร์ชันหนึ่ง การย้ายแท็กช่วยให้คุณย้อนกลับได้
    - Changelogs แนบตามแต่ละเวอร์ชัน และสามารถเว้นว่างได้เมื่อซิงค์หรือเผยแพร่อัปเดต

  </Accordion>
  <Accordion title="การเปลี่ยนแปลงในเครื่องเทียบกับเวอร์ชันใน registry">
    การอัปเดตจะเปรียบเทียบเนื้อหา skill ในเครื่องกับเวอร์ชันใน registry โดยใช้
    content hash หากไฟล์ในเครื่องไม่ตรงกับเวอร์ชันที่เผยแพร่ไว้ใด ๆ
    CLI จะถามก่อนเขียนทับ (หรือต้องใช้ `--force` ในการรันแบบ
    non-interactive)
  </Accordion>
  <Accordion title="การสแกน sync และราก fallback">
    `clawhub sync` จะสแกน workdir ปัจจุบันของคุณก่อน หากไม่พบ Skills
    ระบบจะ fallback ไปยังตำแหน่ง legacy ที่รู้จัก (เช่น
    `~/openclaw/skills` และ `~/.openclaw/skills`) ซึ่งออกแบบมาเพื่อ
    ค้นหาการติดตั้ง skill รุ่นเก่าโดยไม่ต้องใช้แฟล็กเพิ่มเติม
  </Accordion>
  <Accordion title="พื้นที่จัดเก็บและ lockfile">
    - Skills ที่ติดตั้งแล้วจะถูกบันทึกไว้ใน `.clawhub/lock.json` ภายใต้ workdir ของคุณ
    - โทเคน auth จะถูกเก็บในไฟล์ config ของ ClawHub CLI (แทนที่ได้ผ่าน `CLAWHUB_CONFIG_PATH`)

  </Accordion>
  <Accordion title="Telemetry (จำนวนการติดตั้ง)">
    เมื่อคุณรัน `clawhub sync` ขณะเข้าสู่ระบบ CLI จะส่ง snapshot ขั้นต่ำ
    เพื่อคำนวณจำนวนการติดตั้ง คุณสามารถปิดใช้งานสิ่งนี้ทั้งหมดได้:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## ตัวแปรสภาพแวดล้อม

| ตัวแปร                        | ผลลัพธ์                                         |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | แทนที่ URL ของไซต์                              |
| `CLAWHUB_REGISTRY`            | แทนที่ URL ของ registry API                     |
| `CLAWHUB_CONFIG_PATH`         | แทนที่ตำแหน่งที่ CLI เก็บโทเคน/config          |
| `CLAWHUB_WORKDIR`             | แทนที่ workdir เริ่มต้น                         |
| `CLAWHUB_DISABLE_TELEMETRY=1` | ปิดใช้งาน telemetry บน `sync`                   |

## ที่เกี่ยวข้อง

- [Plugin ชุมชน](/th/plugins/community)
- [Plugin](/th/tools/plugin)
- [Skills](/th/tools/skills)
