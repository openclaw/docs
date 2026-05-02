---
read_when:
    - การค้นหา การติดตั้ง หรือการอัปเดต Skills หรือ Plugin
    - การเผยแพร่ Skills หรือ Plugin ไปยังรีจิสทรี
    - การกำหนดค่า clawhub CLI หรือค่าทับแทนจากสภาพแวดล้อม
sidebarTitle: ClawHub
summary: 'ClawHub: รีจิสทรีสาธารณะสำหรับ Skills และ Plugin ของ OpenClaw, โฟลว์การติดตั้งแบบเนทีฟ และ clawhub CLI'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T10:30:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 353b224ccfb8096c270b7896e640e9e419fcb50c265298102a5ce0173566933e
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub คือรีจิสทรีสาธารณะสำหรับ **OpenClaw Skills และ Plugin**

- ใช้คำสั่ง `openclaw` แบบเนทีฟเพื่อค้นหา ติดตั้ง และอัปเดต Skills และติดตั้ง Plugin จาก ClawHub
- ใช้ CLI `clawhub` แยกต่างหากสำหรับเวิร์กโฟลว์การยืนยันตัวตนกับรีจิสทรี การเผยแพร่ การลบ/กู้คืน และการซิงก์

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
    เริ่มเซสชัน OpenClaw ใหม่ — ระบบจะโหลด Skill ใหม่
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

    คำสั่ง `openclaw` แบบเนทีฟจะติดตั้งลงในเวิร์กสเปซที่ใช้งานอยู่ของคุณและ
    เก็บเมทาดาทาแหล่งที่มาไว้ เพื่อให้คำสั่ง `update` ภายหลังยังคงใช้ ClawHub ได้

  </Tab>
  <Tab title="Plugin">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` จะค้นหาแคตตาล็อก Plugin ของ ClawHub และพิมพ์ชื่อแพ็กเกจ
    ที่พร้อมติดตั้ง สเปก Plugin เปล่าที่ปลอดภัยสำหรับ npm จะถูกลองกับ ClawHub
    ก่อน npm ด้วย:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    ใช้ `npm:<package>` เมื่อคุณต้องการการแก้ไขแพ็กเกจผ่าน npm เท่านั้นโดยไม่
    ค้นหาใน ClawHub:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    การติดตั้ง Plugin จะตรวจสอบความเข้ากันได้ของ `pluginApi` และ
    `minGatewayVersion` ที่ประกาศไว้ก่อนเรียกการติดตั้งไฟล์เก็บถาวร ดังนั้น
    โฮสต์ที่ไม่เข้ากันจะล้มเหลวแบบปิดตั้งแต่เนิ่นๆ แทนที่จะติดตั้งแพ็กเกจ
    ไปบางส่วน เมื่อเวอร์ชันแพ็กเกจเผยแพร่อาร์ติแฟกต์ ClawPack
    OpenClaw จะเลือกใช้อาร์ติแฟกต์นั้น ตรวจสอบเฮดเดอร์ไดเจสต์ของ ClawHub และ
    ไบต์ที่ดาวน์โหลด แล้วบันทึกเมทาดาทาไดเจสต์ของ ClawPack สำหรับการอัปเดต
    ภายหลัง เวอร์ชันแพ็กเกจเก่าที่ไม่มีเมทาดาทา ClawPack ยังคงใช้เส้นทาง
    การตรวจสอบไฟล์เก็บถาวรแพ็กเกจแบบเดิม

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` ยอมรับเฉพาะตระกูล Plugin
ที่ติดตั้งได้เท่านั้น หากแพ็กเกจ ClawHub เป็น Skill จริงๆ OpenClaw จะหยุดและ
ชี้ให้คุณใช้ `openclaw skills install <slug>` แทน

การติดตั้ง Plugin ของ ClawHub แบบไม่ระบุตัวตนจะล้มเหลวแบบปิดสำหรับแพ็กเกจส่วนตัวด้วย
ช่องทางชุมชนหรือช่องทางที่ไม่เป็นทางการอื่นๆ ยังติดตั้งได้ แต่ OpenClaw
จะแจ้งเตือนเพื่อให้ผู้ดูแลระบบตรวจสอบแหล่งที่มาและการยืนยันก่อนเปิดใช้งาน
</Note>

## ClawHub คืออะไร

- รีจิสทรีสาธารณะสำหรับ OpenClaw Skills และ Plugin
- พื้นที่จัดเก็บบันเดิล Skill และเมทาดาทาแบบมีเวอร์ชัน
- พื้นที่ค้นพบสำหรับการค้นหา แท็ก และสัญญาณการใช้งาน

Skill ทั่วไปคือบันเดิลไฟล์แบบมีเวอร์ชันที่ประกอบด้วย:

- ไฟล์ `SKILL.md` ที่มีคำอธิบายหลักและวิธีใช้งาน
- คอนฟิก สคริปต์ หรือไฟล์สนับสนุนที่ Skill ใช้ ซึ่งมีหรือไม่มีก็ได้
- เมทาดาทา เช่น แท็ก สรุป และข้อกำหนดการติดตั้ง

ClawHub ใช้เมทาดาทาเพื่อขับเคลื่อนการค้นพบและเปิดเผยความสามารถของ Skill
อย่างปลอดภัย รีจิสทรีติดตามสัญญาณการใช้งาน (ดาว การดาวน์โหลด) เพื่อ
ปรับปรุงการจัดอันดับและการมองเห็น การเผยแพร่แต่ละครั้งจะสร้างเวอร์ชัน semver
ใหม่ และรีจิสทรีจะเก็บประวัติเวอร์ชันไว้เพื่อให้ผู้ใช้ตรวจสอบ
การเปลี่ยนแปลงได้

## เวิร์กสเปซและการโหลด Skill

CLI `clawhub` แยกต่างหากยังติดตั้ง Skills ลงใน `./skills` ภายใต้
ไดเรกทอรีทำงานปัจจุบันของคุณด้วย หากกำหนดค่าเวิร์กสเปซ OpenClaw ไว้
`clawhub` จะ fallback ไปยังเวิร์กสเปซนั้น เว้นแต่คุณจะ override `--workdir`
(หรือ `CLAWHUB_WORKDIR`) OpenClaw โหลด Skills ของเวิร์กสเปซจาก
`<workspace>/skills` และจะโหลดในเซสชัน **ถัดไป**

หากคุณใช้ `~/.openclaw/skills` หรือ Skills ที่มาพร้อมกันอยู่แล้ว
Skills ของเวิร์กสเปซจะมีลำดับความสำคัญสูงกว่า สำหรับรายละเอียดเพิ่มเติมเกี่ยวกับวิธีโหลด
แชร์ และ gate Skills โปรดดู [Skills](/th/tools/skills)

## ฟีเจอร์ของบริการ

| ฟีเจอร์                  | หมายเหตุ                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| การเรียกดูสาธารณะ          | Skills และเนื้อหา `SKILL.md` ของแต่ละรายการดูได้แบบสาธารณะ          |
| การค้นหา                   | ขับเคลื่อนด้วย embedding (การค้นหาแบบเวกเตอร์) ไม่ใช่แค่คีย์เวิร์ด               |
| การกำหนดเวอร์ชัน               | Semver, changelog และแท็ก (รวมถึง `latest`)                  |
| การดาวน์โหลด                | Zip ต่อเวอร์ชัน                                                    |
| ดาวและความคิดเห็น       | ข้อเสนอแนะจากชุมชน                                                 |
| สรุปการสแกนความปลอดภัย  | หน้ารายละเอียดแสดงสถานะการสแกนล่าสุดก่อนติดตั้งหรือดาวน์โหลด |
| หน้ารายละเอียดสแกนเนอร์     | ผลลัพธ์ VirusTotal, ClawScan และการวิเคราะห์แบบ static มี deep links  |
| แดชบอร์ดกู้คืนของเจ้าของ | ผู้เผยแพร่ดูเนื้อหาที่ตนเป็นเจ้าของซึ่งถูกระงับโดยการสแกนได้จาก `/dashboard`       |
| การสแกนซ้ำที่เจ้าของร้องขอ  | เจ้าของสามารถร้องขอการสแกนซ้ำแบบจำกัดเพื่อกู้คืนกรณี false-positive     |
| การกลั่นกรอง               | การอนุมัติและการตรวจสอบ                                               |
| API ที่เป็นมิตรกับ CLI         | เหมาะสำหรับระบบอัตโนมัติและการเขียนสคริปต์                              |

## ความปลอดภัยและการกลั่นกรอง

ClawHub เปิดเป็นค่าเริ่มต้น — ทุกคนสามารถอัปโหลด Skills ได้ แต่บัญชี GitHub
ต้องมีอายุ **อย่างน้อยหนึ่งสัปดาห์** จึงจะเผยแพร่ได้ วิธีนี้ช่วยชะลอ
การละเมิดโดยไม่ปิดกั้นผู้ร่วมสนับสนุนที่ถูกต้อง

<AccordionGroup>
  <Accordion title="การสแกนความปลอดภัย">
    ClawHub รันการตรวจสอบความปลอดภัยอัตโนมัติกับ Skills และรุ่น Plugin
    ที่เผยแพร่แล้ว หน้ารายละเอียดสาธารณะจะสรุปผลลัพธ์ปัจจุบัน และแถวของสแกนเนอร์
    จะลิงก์ไปยังหน้ารายละเอียดเฉพาะสำหรับ VirusTotal, ClawScan และการวิเคราะห์แบบ static

    รุ่นที่ถูกระงับโดยการสแกนหรือถูกบล็อกอาจไม่พร้อมใช้งานบนแคตตาล็อกสาธารณะและ
    พื้นที่ติดตั้ง แต่ยังคงมองเห็นได้สำหรับเจ้าของใน `/dashboard`

  </Accordion>
  <Accordion title="การรายงาน">
    - ผู้ใช้ที่ลงชื่อเข้าใช้ทุกคนสามารถรายงาน Skill ได้
    - ต้องระบุเหตุผลการรายงาน และระบบจะบันทึกไว้
    - ผู้ใช้แต่ละคนมีรายงานที่ใช้งานอยู่ได้สูงสุด 20 รายการในแต่ละครั้ง
    - Skills ที่มีรายงานจากผู้ใช้ไม่ซ้ำกันมากกว่า 3 รายจะถูกซ่อนอัตโนมัติตามค่าเริ่มต้น

  </Accordion>
  <Accordion title="การกลั่นกรอง">
    - ผู้ดูแลสามารถดู Skills ที่ซ่อนอยู่ ยกเลิกการซ่อน ลบ หรือแบนผู้ใช้ได้
    - การใช้ฟีเจอร์รายงานในทางที่ผิดอาจทำให้บัญชีถูกแบน
    - สนใจเป็นผู้ดูแลหรือไม่? ถามใน OpenClaw Discord และติดต่อผู้ดูแลหรือผู้ดูแลโครงการ

  </Accordion>
</AccordionGroup>

## ClawHub CLI

คุณต้องใช้สิ่งนี้เฉพาะสำหรับเวิร์กโฟลว์ที่ยืนยันตัวตนกับรีจิสทรี เช่น
publish/sync

### ตัวเลือกส่วนกลาง

<ParamField path="--workdir <dir>" type="string">
  ไดเรกทอรีทำงาน ค่าเริ่มต้น: ไดเรกทอรีปัจจุบัน; fallback ไปยังเวิร์กสเปซ OpenClaw
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  ไดเรกทอรี Skills โดยสัมพันธ์กับ workdir
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

    - `--token <token>` — วางโทเค็น API
    - `--label <label>` — ป้ายกำกับที่จัดเก็บไว้สำหรับโทเค็นการเข้าสู่ระบบผ่านเบราว์เซอร์ (ค่าเริ่มต้น: `CLI token`)
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

    `package explore` และ `package inspect` คือพื้นผิว CLI ของ ClawHub สำหรับการค้นพบ Plugin/แพ็กเกจและการตรวจสอบเมทาดาทา การติดตั้งแบบเนทีฟของ OpenClaw ยังคงใช้ `openclaw plugins install clawhub:<package>`

    ตัวเลือก:

    - `--family skill|code-plugin|bundle-plugin` — กรองตระกูลแพ็กเกจ
    - `--official` — แสดงเฉพาะแพ็กเกจทางการ
    - `--executes-code` — แสดงเฉพาะแพ็กเกจที่เรียกใช้โค้ด
    - `--version <version>` / `--tag <tag>` — ตรวจสอบเวอร์ชันแพ็กเกจเฉพาะ
    - `--versions`, `--files`, `--file <path>` — ตรวจสอบประวัติแพ็กเกจและไฟล์
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

    - `--version <version>` — ติดตั้งหรืออัปเดตเป็นเวอร์ชันเฉพาะ (ใช้กับ slug เดียวเท่านั้นบน `update`)
    - `--force` — เขียนทับหากโฟลเดอร์มีอยู่แล้ว หรือเมื่อไฟล์ในเครื่องไม่ตรงกับเวอร์ชันที่เผยแพร่ใดๆ
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
    - `--tags <tags>` — แท็กที่คั่นด้วยจุลภาค (ค่าเริ่มต้น: `latest`)

  </Accordion>
  <Accordion title="เผยแพร่ Plugin">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` อาจเป็นโฟลเดอร์ในเครื่อง, `owner/repo`, `owner/repo@ref` หรือ
    URL GitHub

    ตัวเลือก:

    - `--dry-run` — สร้างแผนการเผยแพร่ที่แน่นอนโดยไม่อัปโหลดสิ่งใด
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

    คำสั่ง rescan ต้องใช้โทเค็นเจ้าของที่เข้าสู่ระบบแล้ว และกำหนดเป้าหมายไปยังเวอร์ชัน Skill
    ที่เผยแพร่ล่าสุดหรือรุ่น Plugin ล่าสุด ในการรันแบบไม่โต้ตอบ ให้ส่ง
    `--yes`

    การตอบกลับ JSON มีชนิดเป้าหมาย ชื่อ เวอร์ชัน สถานะการสแกนซ้ำ และ
    จำนวนคำขอที่เหลือ/สูงสุดสำหรับเวอร์ชันหรือรุ่นนั้น

  </Accordion>
  <Accordion title="ลบ / กู้คืน (เจ้าของหรือผู้ดูแล)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="ซิงก์ (สแกนในเครื่อง + เผยแพร่รายการใหม่หรือรายการที่อัปเดต)">
    ```bash
    clawhub sync
    ```

    ตัวเลือก:

    - `--root <dir...>` — รากการสแกนเพิ่มเติม
    - `--all` — อัปโหลดทุกอย่างโดยไม่แสดง prompt
    - `--dry-run` — แสดงสิ่งที่จะถูกอัปโหลด
    - `--bump <type>` — `patch|minor|major` สำหรับการอัปเดต (ค่าเริ่มต้น: `patch`)
    - `--changelog <text>` — changelog สำหรับการอัปเดตแบบไม่โต้ตอบ
    - `--tags <tags>` — แท็กที่คั่นด้วยจุลภาค (ค่าเริ่มต้น: `latest`)
    - `--concurrency <n>` — การตรวจสอบรีจิสทรี (ค่าเริ่มต้น: `4`)

  </Accordion>
</AccordionGroup>

## เวิร์กโฟลว์ทั่วไป

<Tabs>
  <Tab title="Search">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Find a plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="Install">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Update all">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Publish a single skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Sync many skills">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Publish a plugin from GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### เมตาดาต้าแพ็กเกจ Plugin

Code plugins ต้องมีเมตาดาต้า OpenClaw ที่จำเป็นใน
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
fallback ไปยังซอร์ส TypeScript ได้เมื่อไม่มีไฟล์ที่ build แล้ว แต่รายการ runtime
ที่ build แล้วจะหลีกเลี่ยงการคอมไพล์ TypeScript ขณะ runtime ในเส้นทาง startup, doctor และ
การโหลด Plugin

## การกำหนดเวอร์ชัน lockfile และ telemetry

<AccordionGroup>
  <Accordion title="Versioning and tags">
    - การเผยแพร่แต่ละครั้งจะสร้าง `SkillVersion` แบบ **semver** ใหม่
    - แท็ก (เช่น `latest`) ชี้ไปยังเวอร์ชันหนึ่ง การย้ายแท็กช่วยให้คุณย้อนกลับได้
    - changelog จะแนบเป็นรายเวอร์ชันและสามารถว่างได้เมื่อ sync หรือเผยแพร่การอัปเดต

  </Accordion>
  <Accordion title="Local changes vs registry versions">
    การอัปเดตจะเปรียบเทียบเนื้อหา Skills ในเครื่องกับเวอร์ชันใน registry โดยใช้
    content hash หากไฟล์ในเครื่องไม่ตรงกับเวอร์ชันที่เผยแพร่ใด ๆ
    CLI จะถามก่อนเขียนทับ (หรือต้องใช้ `--force` ในการรันแบบ
    non-interactive)
  </Accordion>
  <Accordion title="Sync scanning and fallback roots">
    `clawhub sync` จะสแกน workdir ปัจจุบันของคุณก่อน หากไม่พบ Skills
    ระบบจะ fallback ไปยังตำแหน่ง legacy ที่รู้จัก (เช่น
    `~/openclaw/skills` และ `~/.openclaw/skills`) สิ่งนี้ออกแบบมาเพื่อ
    ค้นหาการติดตั้ง Skills รุ่นเก่าโดยไม่ต้องใช้แฟล็กเพิ่มเติม
  </Accordion>
  <Accordion title="Storage and lockfile">
    - Skills ที่ติดตั้งแล้วจะถูกบันทึกใน `.clawhub/lock.json` ใต้ workdir ของคุณ
    - โทเค็น auth จะถูกเก็บไว้ในไฟล์ config ของ ClawHub CLI (override ได้ผ่าน `CLAWHUB_CONFIG_PATH`)

  </Accordion>
  <Accordion title="Telemetry (install counts)">
    เมื่อคุณรัน `clawhub sync` ขณะเข้าสู่ระบบ CLI จะส่ง snapshot ขนาดเล็กที่สุด
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
| `CLAWHUB_REGISTRY`            | Override URL ของ registry API                  |
| `CLAWHUB_CONFIG_PATH`         | Override ตำแหน่งที่ CLI เก็บโทเค็น/config     |
| `CLAWHUB_WORKDIR`             | Override workdir เริ่มต้น                      |
| `CLAWHUB_DISABLE_TELEMETRY=1` | ปิดใช้งาน telemetry บน `sync`                  |

## ที่เกี่ยวข้อง

- [Plugins ชุมชน](/th/plugins/community)
- [Plugins](/th/tools/plugin)
- [Skills](/th/tools/skills)
