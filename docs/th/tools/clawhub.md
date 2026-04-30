---
read_when:
    - การค้นหา การติดตั้ง หรือการอัปเดต Skills หรือ Plugin
    - การเผยแพร่ Skills หรือ Plugin ไปยังรีจิสทรี
    - การกำหนดค่า clawhub CLI หรือค่าการแทนที่จากสภาพแวดล้อมของมัน
sidebarTitle: ClawHub
summary: 'ClawHub: รีจิสทรีสาธารณะสำหรับ Skills และ Plugin ของ OpenClaw, ขั้นตอนการติดตั้งแบบเนทีฟ และ CLI ของ clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-30T10:18:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ec09a3c76820137eb1f7ca829a184fc1ed6392d3b32a327ecbda4d2cad7a78d
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub คือรีจิสทรีสาธารณะสำหรับ **OpenClaw Skills และ Plugin**

- ใช้คำสั่ง `openclaw` แบบเนทีฟเพื่อค้นหา ติดตั้ง และอัปเดต Skills และเพื่อติดตั้ง Plugin จาก ClawHub
- ใช้ CLI `clawhub` แยกต่างหากสำหรับเวิร์กโฟลว์การยืนยันตัวตนกับรีจิสทรี การเผยแพร่ การลบ/กู้คืนการลบ และการซิงก์

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
    เริ่มเซสชัน OpenClaw ใหม่ — เซสชันจะรับ skill ใหม่เข้ามา
  </Step>
  <Step title="เผยแพร่ (ไม่บังคับ)">
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

    คำสั่ง `openclaw` แบบเนทีฟจะติดตั้งลงในเวิร์กสเปซที่ใช้งานอยู่ของคุณ และ
    เก็บเมตาดาต้าแหล่งที่มาไว้ เพื่อให้การเรียก `update` ภายหลังยังคงอยู่บน ClawHub ได้

  </Tab>
  <Tab title="Plugin">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    สเปก Plugin แบบ bare ที่ปลอดภัยสำหรับ npm จะถูกลองกับ ClawHub ก่อน npm เช่นกัน:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    ใช้ `npm:<package>` เมื่อคุณต้องการการแก้ไขจาก npm เท่านั้นโดยไม่มีการค้นหา
    ClawHub:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    การติดตั้ง Plugin จะตรวจสอบความเข้ากันได้ของ `pluginApi` และ
    `minGatewayVersion` ที่ประกาศไว้ก่อนการติดตั้งไฟล์เก็บถาวรจะเริ่มทำงาน ดังนั้น
    โฮสต์ที่เข้ากันไม่ได้จะล้มเหลวแบบปิดตั้งแต่เนิ่น ๆ แทนที่จะติดตั้งแพ็กเกจเพียงบางส่วน

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` ยอมรับเฉพาะตระกูล Plugin
ที่ติดตั้งได้เท่านั้น หากแพ็กเกจ ClawHub เป็น skill จริง ๆ OpenClaw จะหยุดและ
ชี้คุณไปที่ `openclaw skills install <slug>` แทน

การติดตั้ง Plugin ของ ClawHub แบบไม่ระบุตัวตนจะล้มเหลวแบบปิดสำหรับแพ็กเกจส่วนตัวด้วย
ช่องทางชุมชนหรือช่องทางอื่นที่ไม่เป็นทางการยังคงติดตั้งได้ แต่ OpenClaw
จะแจ้งเตือนเพื่อให้ผู้ปฏิบัติงานตรวจสอบแหล่งที่มาและการยืนยันก่อนเปิดใช้งาน
</Note>

## ClawHub คืออะไร

- รีจิสทรีสาธารณะสำหรับ OpenClaw Skills และ Plugin
- พื้นที่จัดเก็บแบบมีเวอร์ชันสำหรับบันเดิล skill และเมตาดาต้า
- พื้นที่ค้นพบสำหรับการค้นหา แท็ก และสัญญาณการใช้งาน

skill ทั่วไปคือบันเดิลไฟล์แบบมีเวอร์ชันที่ประกอบด้วย:

- ไฟล์ `SKILL.md` ที่มีคำอธิบายหลักและวิธีใช้งาน
- คอนฟิก สคริปต์ หรือไฟล์สนับสนุนที่ skill ใช้ ซึ่งมีหรือไม่มีก็ได้
- เมตาดาต้า เช่น แท็ก สรุป และข้อกำหนดการติดตั้ง

ClawHub ใช้เมตาดาต้าเพื่อขับเคลื่อนการค้นพบและเปิดเผยความสามารถของ skill
อย่างปลอดภัย รีจิสทรีติดตามสัญญาณการใช้งาน (ดาวน์โหลด ดาว) เพื่อ
ปรับปรุงการจัดอันดับและการมองเห็น การเผยแพร่แต่ละครั้งจะสร้างเวอร์ชัน semver
ใหม่ และรีจิสทรีจะเก็บประวัติเวอร์ชันเพื่อให้ผู้ใช้ตรวจสอบ
การเปลี่ยนแปลงได้

## เวิร์กสเปซและการโหลด skill

CLI `clawhub` แยกต่างหากยังติดตั้ง Skills ลงใน `./skills` ภายใต้
ไดเรกทอรีทำงานปัจจุบันของคุณด้วย หากมีการกำหนดค่าเวิร์กสเปซ OpenClaw ไว้
`clawhub` จะย้อนกลับไปใช้เวิร์กสเปซนั้น เว้นแต่คุณจะเขียนทับด้วย `--workdir`
(หรือ `CLAWHUB_WORKDIR`) OpenClaw โหลด Skills ของเวิร์กสเปซจาก
`<workspace>/skills` และรับเข้ามาในเซสชัน **ถัดไป**

หากคุณใช้ `~/.openclaw/skills` หรือ Skills ที่บันเดิลมาอยู่แล้ว Skills
ของเวิร์กสเปซจะมีลำดับความสำคัญสูงกว่า สำหรับรายละเอียดเพิ่มเติมเกี่ยวกับวิธีโหลด
แชร์ และควบคุม Skills โปรดดู [Skills](/th/tools/skills)

## คุณสมบัติของบริการ

| คุณสมบัติ                  | หมายเหตุ                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| การเรียกดูสาธารณะ          | Skills และเนื้อหา `SKILL.md` ของ Skills เหล่านั้นดูได้แบบสาธารณะ          |
| การค้นหา                   | ขับเคลื่อนด้วย embedding (การค้นหาแบบเวกเตอร์) ไม่ใช่แค่คีย์เวิร์ด               |
| การจัดการเวอร์ชัน               | Semver, บันทึกการเปลี่ยนแปลง และแท็ก (รวมถึง `latest`)                  |
| ดาวน์โหลด                | Zip ต่อเวอร์ชัน                                                    |
| ดาวและความคิดเห็น       | ความคิดเห็นจากชุมชน                                                 |
| สรุปการสแกนความปลอดภัย  | หน้ารายละเอียดแสดงสถานะการสแกนล่าสุดก่อนติดตั้งหรือดาวน์โหลด |
| หน้ารายละเอียดของสแกนเนอร์     | ผลลัพธ์ VirusTotal, ClawScan และการวิเคราะห์แบบสแตติกมีลิงก์เชิงลึก  |
| แดชบอร์ดกู้คืนของเจ้าของ | ผู้เผยแพร่สามารถดูเนื้อหาของตนที่ถูกระงับจากการสแกนได้จาก `/dashboard`       |
| การสแกนซ้ำที่เจ้าของร้องขอ  | เจ้าของสามารถขอการสแกนซ้ำแบบจำกัดเพื่อกู้คืนจากผลบวกลวงได้     |
| การดูแล               | การอนุมัติและการตรวจสอบ                                               |
| API ที่เป็นมิตรกับ CLI         | เหมาะสำหรับระบบอัตโนมัติและสคริปต์                              |

## ความปลอดภัยและการดูแล

ClawHub เปิดเป็นค่าเริ่มต้น — ทุกคนสามารถอัปโหลด Skills ได้ แต่บัญชี GitHub
ต้องมีอายุ **อย่างน้อยหนึ่งสัปดาห์** จึงจะเผยแพร่ได้ วิธีนี้ช่วยชะลอ
การใช้งานในทางที่ผิดโดยไม่ปิดกั้นผู้มีส่วนร่วมที่ถูกต้อง

<AccordionGroup>
  <Accordion title="การสแกนความปลอดภัย">
    ClawHub เรียกใช้การตรวจสอบความปลอดภัยอัตโนมัติกับ Skills และรีลีส Plugin
    ที่เผยแพร่ หน้ารายละเอียดสาธารณะจะสรุปผลลัพธ์ปัจจุบัน และแถวสแกนเนอร์
    จะลิงก์ไปยังหน้ารายละเอียดเฉพาะสำหรับ VirusTotal, ClawScan และการวิเคราะห์แบบสแตติก

    รีลีสที่ถูกระงับจากการสแกนหรือถูกบล็อกอาจไม่พร้อมใช้งานบนแค็ตตาล็อกสาธารณะและ
    พื้นที่ติดตั้ง แต่ยังคงมองเห็นได้สำหรับเจ้าของใน `/dashboard`

  </Accordion>
  <Accordion title="การรายงาน">
    - ผู้ใช้ที่ลงชื่อเข้าใช้ทุกคนสามารถรายงาน skill ได้
    - จำเป็นต้องระบุเหตุผลการรายงานและจะถูกบันทึกไว้
    - ผู้ใช้แต่ละคนมีรายงานที่ใช้งานอยู่ได้สูงสุด 20 รายการในเวลาเดียวกัน
    - Skills ที่มีรายงานไม่ซ้ำกันมากกว่า 3 รายการจะถูกซ่อนอัตโนมัติตามค่าเริ่มต้น

  </Accordion>
  <Accordion title="การดูแล">
    - ผู้ดูแลสามารถดู Skills ที่ซ่อนอยู่ ยกเลิกการซ่อน ลบ หรือแบนผู้ใช้ได้
    - การใช้คุณสมบัติรายงานในทางที่ผิดอาจทำให้บัญชีถูกแบน
    - สนใจเป็นผู้ดูแลหรือไม่? ถามใน OpenClaw Discord และติดต่อผู้ดูแลหรือผู้ดูแลรักษา

  </Accordion>
</AccordionGroup>

## CLI ของ ClawHub

คุณต้องใช้สิ่งนี้เฉพาะสำหรับเวิร์กโฟลว์ที่ยืนยันตัวตนกับรีจิสทรี เช่น
เผยแพร่/ซิงก์

### ตัวเลือกส่วนกลาง

<ParamField path="--workdir <dir>" type="string">
  ไดเรกทอรีทำงาน ค่าเริ่มต้น: ไดเรกทอรีปัจจุบัน; ย้อนกลับไปใช้เวิร์กสเปซ OpenClaw
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  ไดเรกทอรี Skills สัมพัทธ์กับ workdir
</ParamField>
<ParamField path="--site <url>" type="string">
  URL ฐานของไซต์ (เข้าสู่ระบบผ่านเบราว์เซอร์)
</ParamField>
<ParamField path="--registry <url>" type="string">
  URL ฐานของ Registry API
</ParamField>
<ParamField path="--no-input" type="boolean">
  ปิดใช้งานพรอมป์ (ไม่โต้ตอบ)
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  พิมพ์เวอร์ชัน CLI
</ParamField>

### คำสั่ง

<AccordionGroup>
  <Accordion title="การยืนยันตัวตน (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    ตัวเลือกการเข้าสู่ระบบ:

    - `--token <token>` — วางโทเค็น API
    - `--label <label>` — ป้ายกำกับที่จัดเก็บไว้สำหรับโทเค็นการเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `CLI token`)
    - `--no-browser` — อย่าเปิดเบราว์เซอร์ (ต้องใช้ `--token`)

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

    `package explore` และ `package inspect` คือพื้นผิวของ ClawHub CLI สำหรับการค้นพบ Plugin/แพ็กเกจและการตรวจสอบเมตาดาต้า การติดตั้ง OpenClaw แบบเนทีฟยังคงใช้ `openclaw plugins install clawhub:<package>`

    ตัวเลือก:

    - `--family skill|code-plugin|bundle-plugin` — กรองตระกูลแพ็กเกจ
    - `--official` — แสดงเฉพาะแพ็กเกจทางการ
    - `--executes-code` — แสดงเฉพาะแพ็กเกจที่เรียกใช้โค้ด
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

    - `--version <version>` — ติดตั้งหรืออัปเดตเป็นเวอร์ชันที่ระบุ (ใช้ slug เดียวเท่านั้นบน `update`)
    - `--force` — เขียนทับหากโฟลเดอร์มีอยู่แล้ว หรือเมื่อไฟล์ในเครื่องไม่ตรงกับเวอร์ชันที่เผยแพร่ใด ๆ
    - `clawhub list` อ่าน `.clawhub/lock.json`

  </Accordion>
  <Accordion title="เผยแพร่ Skills">
    ```bash
    clawhub skill publish <path>
    ```

    ตัวเลือก:

    - `--slug <slug>` — slug ของ skill
    - `--name <name>` — ชื่อที่แสดง
    - `--version <version>` — เวอร์ชัน semver
    - `--changelog <text>` — ข้อความบันทึกการเปลี่ยนแปลง (เว้นว่างได้)
    - `--tags <tags>` — แท็กคั่นด้วยจุลภาค (ค่าเริ่มต้น: `latest`)

  </Accordion>
  <Accordion title="เผยแพร่ Plugin">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` อาจเป็นโฟลเดอร์ในเครื่อง, `owner/repo`, `owner/repo@ref` หรือ
    URL GitHub

    ตัวเลือก:

    - `--dry-run` — สร้างแผนการเผยแพร่ที่แน่นอนโดยไม่อัปโหลดอะไรเลย
    - `--json` — ส่งออกเอาต์พุตที่เครื่องอ่านได้สำหรับ CI
    - `--source-repo`, `--source-commit`, `--source-ref` — การเขียนทับเพิ่มเติมเมื่อการตรวจจับอัตโนมัติยังไม่เพียงพอ

  </Accordion>
  <Accordion title="ขอสแกนซ้ำ">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    คำสั่งสแกนซ้ำต้องใช้โทเค็นเจ้าของที่เข้าสู่ระบบแล้ว และกำหนดเป้าหมายไปยังเวอร์ชัน
    skill หรือรีลีส Plugin ที่เผยแพร่ล่าสุด ในการรันแบบไม่โต้ตอบ ให้ส่ง
    `--yes`

    การตอบกลับ JSON มีชนิดเป้าหมาย ชื่อ เวอร์ชัน สถานะการสแกนซ้ำ และ
    จำนวนคำขอคงเหลือ/สูงสุดสำหรับเวอร์ชันหรือรีลีสนั้น

  </Accordion>
  <Accordion title="ลบ / กู้คืนการลบ (เจ้าของหรือผู้ดูแลระบบ)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="ซิงก์ (สแกนในเครื่อง + เผยแพร่รายการใหม่หรือที่อัปเดต)">
    ```bash
    clawhub sync
    ```

    ตัวเลือก:

    - `--root <dir...>` — รากสำหรับสแกนเพิ่มเติม
    - `--all` — อัปโหลดทุกอย่างโดยไม่มีพรอมป์
    - `--dry-run` — แสดงสิ่งที่จะถูกอัปโหลด
    - `--bump <type>` — `patch|minor|major` สำหรับการอัปเดต (ค่าเริ่มต้น: `patch`)
    - `--changelog <text>` — บันทึกการเปลี่ยนแปลงสำหรับการอัปเดตแบบไม่โต้ตอบ
    - `--tags <tags>` — แท็กคั่นด้วยจุลภาค (ค่าเริ่มต้น: `latest`)
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
  <Tab title="เผยแพร่ Skills รายการเดียว">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="ซิงก์ Skills หลายรายการ">
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

### เมทาดาทาของแพ็กเกจ Plugin

Code Plugin ต้องมีเมทาดาทา OpenClaw ที่จำเป็นใน
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
`runtimeExtensions` ไปยังเอาต์พุตนั้น การติดตั้งจาก Git checkout ยังสามารถ fallback
ไปยังซอร์ส TypeScript ได้เมื่อไม่มีไฟล์ที่ build แล้ว แต่รายการ runtime
ที่ build แล้วจะหลีกเลี่ยงการคอมไพล์ TypeScript ขณะ runtime ในเส้นทาง startup, doctor และ
การโหลด Plugin

## การกำหนดเวอร์ชัน, lockfile และ telemetry

<AccordionGroup>
  <Accordion title="การกำหนดเวอร์ชันและแท็ก">
    - การเผยแพร่แต่ละครั้งจะสร้าง `SkillVersion` แบบ **semver** ใหม่
    - แท็ก (เช่น `latest`) ชี้ไปยังเวอร์ชันหนึ่ง การย้ายแท็กช่วยให้คุณย้อนกลับได้
    - Changelog จะแนบต่อเวอร์ชัน และสามารถเว้นว่างได้เมื่อซิงก์หรือเผยแพร่การอัปเดต

  </Accordion>
  <Accordion title="การเปลี่ยนแปลงในเครื่องเทียบกับเวอร์ชันใน registry">
    การอัปเดตจะเปรียบเทียบเนื้อหา Skills ในเครื่องกับเวอร์ชันใน registry โดยใช้
    content hash หากไฟล์ในเครื่องไม่ตรงกับเวอร์ชันที่เผยแพร่ใด ๆ
    CLI จะถามก่อนเขียนทับ (หรือต้องใช้ `--force` ในการรันแบบ
    non-interactive)
  </Accordion>
  <Accordion title="การสแกน sync และราก fallback">
    `clawhub sync` จะสแกน workdir ปัจจุบันของคุณก่อน หากไม่พบ Skills
    ระบบจะ fallback ไปยังตำแหน่ง legacy ที่รู้จัก (เช่น
    `~/openclaw/skills` และ `~/.openclaw/skills`) สิ่งนี้ออกแบบมาเพื่อ
    ค้นหาการติดตั้ง Skills รุ่นเก่าโดยไม่ต้องใช้แฟล็กเพิ่มเติม
  </Accordion>
  <Accordion title="พื้นที่จัดเก็บและ lockfile">
    - Skills ที่ติดตั้งแล้วจะถูกบันทึกใน `.clawhub/lock.json` ใต้ workdir ของคุณ
    - Auth token จะถูกจัดเก็บในไฟล์ config ของ ClawHub CLI (override ผ่าน `CLAWHUB_CONFIG_PATH`)

  </Accordion>
  <Accordion title="Telemetry (จำนวนการติดตั้ง)">
    เมื่อคุณรัน `clawhub sync` ขณะล็อกอินอยู่ CLI จะส่ง snapshot แบบย่อ
    เพื่อคำนวณจำนวนการติดตั้ง คุณสามารถปิดใช้งานสิ่งนี้ทั้งหมดได้:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## ตัวแปรสภาพแวดล้อม

| ตัวแปร                       | ผลลัพธ์                                         |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Override URL ของไซต์                            |
| `CLAWHUB_REGISTRY`            | Override URL ของ registry API                   |
| `CLAWHUB_CONFIG_PATH`         | Override ตำแหน่งที่ CLI จัดเก็บ token/config   |
| `CLAWHUB_WORKDIR`             | Override workdir เริ่มต้น                       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | ปิดใช้งาน telemetry บน `sync`                   |

## ที่เกี่ยวข้อง

- [Plugin ชุมชน](/th/plugins/community)
- [Plugins](/th/tools/plugin)
- [Skills](/th/tools/skills)
