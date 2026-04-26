---
read_when:
    - การค้นหา ติดตั้ง หรืออัปเดต Skills หรือ Plugin
    - การเผยแพร่ Skills หรือ Plugin ไปยังรีจิสทรี
    - การกำหนดค่า CLI ของ clawhub หรือการ override สภาพแวดล้อมของมัน
sidebarTitle: ClawHub
summary: 'ClawHub: รีจิสทรีสาธารณะสำหรับ Skills และ Plugin ของ OpenClaw, โฟลว์การติดตั้งแบบเนทีฟ และ CLI ของ clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-26T11:42:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e002bb56b643bfdfb5715ac3632d854df182475be632ebe36c46d04008cf6e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub คือรีจิสทรีสาธารณะสำหรับ **Skills และ Plugin ของ OpenClaw**

- ใช้คำสั่ง `openclaw` แบบเนทีฟเพื่อค้นหา ติดตั้ง และอัปเดต Skills รวมถึงติดตั้ง Plugin จาก ClawHub
- ใช้ CLI `clawhub` แยกต่างหากสำหรับการยืนยันตัวตนกับรีจิสทรี การเผยแพร่ การลบ/ยกเลิกการลบ และเวิร์กโฟลว์การซิงก์

เว็บไซต์: [clawhub.ai](https://clawhub.ai)

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
    เริ่มเซสชัน OpenClaw ใหม่ — ระบบจะตรวจพบ Skill ใหม่โดยอัตโนมัติ
  </Step>
  <Step title="เผยแพร่ (ไม่บังคับ)">
    สำหรับเวิร์กโฟลว์ที่ต้องยืนยันตัวตนกับรีจิสทรี (เผยแพร่ ซิงก์ จัดการ) ให้ติดตั้ง
    CLI `clawhub` แยกต่างหาก:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## โฟลว์แบบเนทีฟของ OpenClaw

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    คำสั่ง `openclaw` แบบเนทีฟจะติดตั้งลงใน workspace ที่ใช้งานอยู่ และ
    บันทึกเมทาดาทาของแหล่งที่มาไว้ เพื่อให้การเรียก `update` ในภายหลังยังคงอ้างอิง ClawHub ได้

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    สเปก Plugin แบบ bare npm-safe จะถูกลองค้นหาใน ClawHub ก่อน npm ด้วย:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    การติดตั้ง Plugin จะตรวจสอบความเข้ากันได้ของ `pluginApi` และ
    `minGatewayVersion` ที่ประกาศไว้ก่อนเริ่มการติดตั้ง archive ดังนั้น
    โฮสต์ที่ไม่เข้ากันจะล้มเหลวแบบ fail closed ตั้งแต่เนิ่น ๆ แทนที่จะติดตั้ง
    แพ็กเกจแบบไม่สมบูรณ์

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` ยอมรับเฉพาะตระกูล Plugin
ที่สามารถติดตั้งได้เท่านั้น หากแพ็กเกจ ClawHub เป็น Skill จริง ๆ OpenClaw จะหยุดและ
แนะนำให้คุณใช้ `openclaw skills install <slug>` แทน

การติดตั้ง Plugin จาก ClawHub แบบไม่ระบุตัวตนจะ fail closed เช่นกันสำหรับแพ็กเกจส่วนตัว
ช่องทาง community หรือช่องทางที่ไม่เป็นทางการอื่นยังคงติดตั้งได้ แต่ OpenClaw
จะแสดงคำเตือนเพื่อให้ผู้ดูแลระบบตรวจสอบแหล่งที่มาและการยืนยันก่อนเปิดใช้งาน
</Note>

## ClawHub คืออะไร

- รีจิสทรีสาธารณะสำหรับ Skills และ Plugin ของ OpenClaw
- ที่เก็บแบบมีเวอร์ชันสำหรับ skill bundle และเมทาดาทา
- พื้นผิวสำหรับการค้นพบผ่านการค้นหา แท็ก และสัญญาณการใช้งาน

Skill ทั่วไปมักเป็น bundle แบบมีเวอร์ชันของไฟล์ ซึ่งประกอบด้วย:

- ไฟล์ `SKILL.md` ที่มีคำอธิบายหลักและวิธีการใช้งาน
- config, script หรือไฟล์สนับสนุนเพิ่มเติมที่ Skill ใช้งาน
- เมทาดาทา เช่น แท็ก สรุป และข้อกำหนดการติดตั้ง

ClawHub ใช้เมทาดาทาเพื่อขับเคลื่อนการค้นพบและเปิดเผยความสามารถของ Skill
อย่างปลอดภัย รีจิสทรีจะติดตามสัญญาณการใช้งาน (ดาว ยอดดาวน์โหลด) เพื่อ
ปรับปรุงอันดับและการมองเห็น การเผยแพร่แต่ละครั้งจะสร้างเวอร์ชัน semver ใหม่
และรีจิสทรีจะเก็บประวัติเวอร์ชันไว้เพื่อให้ผู้ใช้ตรวจสอบการเปลี่ยนแปลงได้

## Workspace และการโหลด Skill

CLI `clawhub` แยกต่างหากยังติดตั้ง Skills ลงใน `./skills` ภายใต้
ไดเรกทอรีทำงานปัจจุบันของคุณด้วย หากมีการกำหนดค่า workspace ของ OpenClaw
ไว้ `clawhub` จะ fallback ไปใช้ workspace นั้น เว้นแต่คุณจะ override ด้วย `--workdir`
(หรือ `CLAWHUB_WORKDIR`) OpenClaw จะโหลด workspace Skills จาก
`<workspace>/skills` และจะตรวจพบในเซสชัน **ถัดไป**

หากคุณใช้ `~/.openclaw/skills` หรือ Skills ที่รวมมาให้อยู่แล้ว
workspace Skills จะมีลำดับความสำคัญสูงกว่า หากต้องการรายละเอียดเพิ่มเติมเกี่ยวกับวิธีโหลด แบ่งปัน และกำกับ
Skills โปรดดู [Skills](/th/tools/skills)

## ความสามารถของบริการ

| ความสามารถ         | หมายเหตุ                                                   |
| ------------------ | ---------------------------------------------------------- |
| การเรียกดูแบบสาธารณะ | สามารถดู Skills และเนื้อหา `SKILL.md` ของ Skills ได้แบบสาธารณะ |
| การค้นหา            | ขับเคลื่อนด้วย embedding (vector search) ไม่ใช่แค่คีย์เวิร์ด |
| การจัดการเวอร์ชัน   | Semver, changelog และแท็ก (รวมถึง `latest`)              |
| การดาวน์โหลด        | Zip แยกตามเวอร์ชัน                                         |
| ดาวและความคิดเห็น   | ฟีดแบ็กจากชุมชน                                            |
| การกลั่นกรอง        | การอนุมัติและการตรวจสอบ                                    |
| API ที่เป็นมิตรกับ CLI | เหมาะสำหรับระบบอัตโนมัติและการเขียนสคริปต์                |

## ความปลอดภัยและการกลั่นกรอง

ClawHub เปิดกว้างเป็นค่าเริ่มต้น — ทุกคนสามารถอัปโหลด Skills ได้ แต่บัญชี GitHub
ต้องมีอายุ **อย่างน้อยหนึ่งสัปดาห์** จึงจะเผยแพร่ได้ วิธีนี้ช่วยชะลอการใช้งานในทางที่ผิด
โดยไม่ขัดขวางผู้ร่วมพัฒนาที่แท้จริง

<AccordionGroup>
  <Accordion title="การรายงาน">
    - ผู้ใช้ที่ลงชื่อเข้าใช้แล้วทุกคนสามารถรายงาน Skill ได้
    - ต้องระบุเหตุผลในการรายงานและมีการบันทึกไว้
    - ผู้ใช้แต่ละคนสามารถมีรายงานที่ยังใช้งานอยู่ได้สูงสุด 20 รายการในเวลาเดียวกัน
    - Skills ที่มีรายงานไม่ซ้ำกันมากกว่า 3 รายการจะถูกซ่อนโดยอัตโนมัติตามค่าเริ่มต้น
  </Accordion>
  <Accordion title="การกลั่นกรอง">
    - ผู้กลั่นกรองสามารถดู Skills ที่ถูกซ่อน ยกเลิกการซ่อน ลบ หรือแบนผู้ใช้ได้
    - การใช้ฟีเจอร์รายงานในทางที่ผิดอาจนำไปสู่การแบนบัญชี
    - สนใจเป็นผู้กลั่นกรองหรือไม่? ถามใน Discord ของ OpenClaw และติดต่อผู้กลั่นกรองหรือผู้ดูแล
  </Accordion>
</AccordionGroup>

## CLI ของ ClawHub

คุณต้องใช้สิ่งนี้เฉพาะสำหรับเวิร์กโฟลว์ที่ต้องยืนยันตัวตนกับรีจิสทรี เช่น
การเผยแพร่/ซิงก์

### ตัวเลือกแบบ global

<ParamField path="--workdir <dir>" type="string">
  ไดเรกทอรีทำงาน ค่าเริ่มต้น: dir ปัจจุบัน; fallback ไปยัง workspace ของ OpenClaw
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  ไดเรกทอรี Skills โดยอ้างอิงกับ workdir
</ParamField>
<ParamField path="--site <url>" type="string">
  URL ฐานของเว็บไซต์ (สำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์)
</ParamField>
<ParamField path="--registry <url>" type="string">
  URL ฐานของ API รีจิสทรี
</ParamField>
<ParamField path="--no-input" type="boolean">
  ปิดการแสดงพรอมป์ต์ (ไม่โต้ตอบ)
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
    - `--no-browser` — ไม่เปิดเบราว์เซอร์ (ต้องใช้ร่วมกับ `--token`)

  </Accordion>
  <Accordion title="ค้นหา">
    ```bash
    clawhub search "query"
    ```

    - `--limit <n>` — จำนวนผลลัพธ์สูงสุด

  </Accordion>
  <Accordion title="ติดตั้ง / อัปเดต / แสดงรายการ">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    ตัวเลือก:

    - `--version <version>` — ติดตั้งหรืออัปเดตเป็นเวอร์ชันที่ระบุ (ใช้กับ slug เดียวเท่านั้นบน `update`)
    - `--force` — เขียนทับหากมีโฟลเดอร์อยู่แล้ว หรือเมื่อไฟล์ในเครื่องไม่ตรงกับเวอร์ชันที่เผยแพร่ใด ๆ
    - `clawhub list` อ่านจาก `.clawhub/lock.json`

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
    - `--tags <tags>` — แท็กคั่นด้วยจุลภาค (ค่าเริ่มต้น: `latest`)

  </Accordion>
  <Accordion title="เผยแพร่ Plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` อาจเป็นโฟลเดอร์ในเครื่อง, `owner/repo`, `owner/repo@ref` หรือ
    GitHub URL

    ตัวเลือก:

    - `--dry-run` — สร้างแผนการเผยแพร่แบบตรงตามจริงโดยไม่อัปโหลดอะไรเลย
    - `--json` — ส่งผลลัพธ์แบบ machine-readable สำหรับ CI
    - `--source-repo`, `--source-commit`, `--source-ref` — ตัวเลือก override เมื่อการตรวจจับอัตโนมัติยังไม่เพียงพอ

  </Accordion>
  <Accordion title="ลบ / ยกเลิกการลบ (เจ้าของหรือแอดมิน)">
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

    - `--root <dir...>` — root เพิ่มเติมสำหรับการสแกน
    - `--all` — อัปโหลดทุกอย่างโดยไม่ต้องมีพรอมป์ต์
    - `--dry-run` — แสดงสิ่งที่จะถูกอัปโหลด
    - `--bump <type>` — `patch|minor|major` สำหรับการอัปเดต (ค่าเริ่มต้น: `patch`)
    - `--changelog <text>` — changelog สำหรับการอัปเดตแบบไม่โต้ตอบ
    - `--tags <tags>` — แท็กคั่นด้วยจุลภาค (ค่าเริ่มต้น: `latest`)
    - `--concurrency <n>` — การตรวจสอบรีจิสทรี (ค่าเริ่มต้น: `4`)

  </Accordion>
</AccordionGroup>

## เวิร์กโฟลว์ที่พบบ่อย

<Tabs>
  <Tab title="ค้นหา">
    ```bash
    clawhub search "postgres backups"
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
  <Tab title="ซิงก์หลาย Skills">
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
`runtimeExtensions` ไปยังเอาต์พุตนั้น การติดตั้งจาก Git checkout ยังสามารถ
fallback ไปใช้ซอร์ส TypeScript ได้เมื่อไม่มีไฟล์ที่ build แล้ว แต่การมี runtime
entries ที่ build แล้วจะช่วยหลีกเลี่ยงการคอมไพล์ TypeScript ตอนรันไทม์ในขั้นตอนเริ่มต้น, doctor และ
เส้นทางการโหลด Plugin

## การกำหนดเวอร์ชัน lockfile และ telemetry

<AccordionGroup>
  <Accordion title="การกำหนดเวอร์ชันและแท็ก">
    - การเผยแพร่แต่ละครั้งจะสร้าง `SkillVersion` แบบ **semver** ใหม่
    - แท็ก (เช่น `latest`) จะชี้ไปยังเวอร์ชันหนึ่ง; การย้ายแท็กช่วยให้คุณย้อนกลับได้
    - Changelog แนบมากับแต่ละเวอร์ชัน และสามารถเว้นว่างได้เมื่อซิงก์หรือเผยแพร่การอัปเดต
  </Accordion>
  <Accordion title="การเปลี่ยนแปลงในเครื่องเทียบกับเวอร์ชันในรีจิสทรี">
    การอัปเดตจะเปรียบเทียบเนื้อหา Skill ในเครื่องกับเวอร์ชันในรีจิสทรีโดยใช้
    content hash หากไฟล์ในเครื่องไม่ตรงกับเวอร์ชันที่เผยแพร่ใด ๆ
    CLI จะถามก่อนเขียนทับ (หรือกำหนดให้ใช้ `--force` ใน
    การรันแบบไม่โต้ตอบ)
  </Accordion>
  <Accordion title="การสแกนซิงก์และ fallback root">
    `clawhub sync` จะสแกน workdir ปัจจุบันของคุณก่อน หากไม่พบ Skills
    ระบบจะ fallback ไปยังตำแหน่งแบบ legacy ที่รู้จัก (ตัวอย่างเช่น
    `~/openclaw/skills` และ `~/.openclaw/skills`) ซึ่งออกแบบมาเพื่อ
    ค้นหาการติดตั้ง Skill แบบเก่าโดยไม่ต้องใส่แฟล็กเพิ่มเติม
  </Accordion>
  <Accordion title="พื้นที่จัดเก็บและ lockfile">
    - Skills ที่ติดตั้งแล้วจะถูกบันทึกไว้ใน `.clawhub/lock.json` ภายใต้ workdir ของคุณ
    - โทเค็น auth จะถูกเก็บไว้ในไฟล์ config ของ ClawHub CLI (override ได้ผ่าน `CLAWHUB_CONFIG_PATH`)
  </Accordion>
  <Accordion title="Telemetry (จำนวนการติดตั้ง)">
    เมื่อคุณรัน `clawhub sync` ขณะล็อกอินอยู่ CLI จะส่ง snapshot ขั้นต่ำ
    เพื่อคำนวณจำนวนการติดตั้ง คุณสามารถปิดสิ่งนี้ทั้งหมดได้:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## ตัวแปรสภาพแวดล้อม

| ตัวแปร                      | ผลกระทบ                                      |
| -------------------------- | -------------------------------------------- |
| `CLAWHUB_SITE`             | override URL ของเว็บไซต์                      |
| `CLAWHUB_REGISTRY`         | override URL ของ API รีจิสทรี                 |
| `CLAWHUB_CONFIG_PATH`      | override ตำแหน่งที่ CLI จัดเก็บโทเค็น/config |
| `CLAWHUB_WORKDIR`          | override workdir เริ่มต้น                     |
| `CLAWHUB_DISABLE_TELEMETRY=1` | ปิด telemetry บน `sync`                    |

## ที่เกี่ยวข้อง

- [Plugin ชุมชน](/th/plugins/community)
- [Plugins](/th/tools/plugin)
- [Skills](/th/tools/skills)
