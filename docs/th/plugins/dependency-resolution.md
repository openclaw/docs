---
read_when:
    - คุณกำลังดีบักการติดตั้งแพ็กเกจ Plugin
    - คุณกำลังเปลี่ยนลักษณะการทำงานของการเริ่มต้น Plugin, doctor หรือการติดตั้งผ่านตัวจัดการแพ็กเกจ
    - คุณกำลังดูแลการติดตั้ง OpenClaw แบบแพ็กเกจหรือไฟล์ manifest ของ Plugin ที่รวมมาในแพ็กเกจ
sidebarTitle: Dependencies
summary: วิธีที่ OpenClaw ติดตั้งแพ็กเกจ Plugin และแก้ไขการพึ่งพาของ Plugin
title: การแก้ไขการขึ้นต่อกันของ Plugin
x-i18n:
    generated_at: "2026-06-27T17:55:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5d2f3efe40c50433bd44961f6f5b8d03f3c69d3f5112163613b8efbd0f17c65
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw เก็บงานด้านการพึ่งพาของ Plugin ไว้ในช่วงติดตั้ง/อัปเดต การโหลดขณะรันไทม์
จะไม่เรียกตัวจัดการแพ็กเกจ ซ่อมแซมแผนผังการพึ่งพา หรือแก้ไขไดเรกทอรีแพ็กเกจของ OpenClaw

## การแบ่งความรับผิดชอบ

แพ็กเกจ Plugin เป็นเจ้าของกราฟการพึ่งพาของตัวเอง:

- การพึ่งพาขณะรันไทม์อยู่ใน `dependencies` หรือ `optionalDependencies` ของแพ็กเกจ Plugin
- การนำเข้า SDK/core เป็น peer หรือเป็นการนำเข้าที่ OpenClaw จัดให้
- Plugin สำหรับพัฒนาในเครื่องนำการพึ่งพาที่ติดตั้งไว้แล้วของตัวเองมาด้วย
- Plugin จาก npm และ git จะถูกติดตั้งลงในรากแพ็กเกจที่ OpenClaw เป็นเจ้าของ

OpenClaw เป็นเจ้าของเฉพาะวงจรชีวิตของ Plugin:

- ค้นหาแหล่งที่มาของ Plugin
- ติดตั้งหรืออัปเดตแพ็กเกจเมื่อมีการร้องขออย่างชัดเจน
- บันทึกข้อมูลเมตาการติดตั้ง
- โหลด entrypoint ของ Plugin
- ล้มเหลวพร้อมข้อผิดพลาดที่นำไปแก้ไขได้เมื่อการพึ่งพาขาดหาย

## รากการติดตั้ง

OpenClaw ใช้รากที่เสถียรแยกตามแหล่งที่มา:

- แพ็กเกจ npm ติดตั้งลงในโปรเจกต์แยกต่อ Plugin ภายใต้
  `~/.openclaw/npm/projects/<encoded-package>`
- แพ็กเกจ git clone ไว้ภายใต้ `~/.openclaw/git`
- การติดตั้ง local/path/archive จะถูกคัดลอกหรืออ้างอิงโดยไม่ซ่อมแซมการพึ่งพา

การติดตั้ง npm รันในรากโปรเจกต์แยกต่อ Plugin นั้นด้วย:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` ใช้รากโปรเจกต์ npm แยกต่อ Plugin เดียวกันนั้น
สำหรับ tarball แบบ npm-pack ในเครื่อง OpenClaw อ่านข้อมูลเมตา npm ของ tarball
เพิ่มเข้าไปในโปรเจกต์ที่จัดการเป็นการพึ่งพา `file:` ที่คัดลอกไว้ รันการติดตั้ง npm ตามปกติ
จากนั้นตรวจสอบข้อมูลเมตา lockfile ที่ติดตั้งก่อนเชื่อถือ Plugin
สิ่งนี้มีไว้สำหรับหลักฐาน package-acceptance และ release-candidate โดยที่ artifact pack
ในเครื่องควรทำงานเหมือน artifact จาก registry ที่มันจำลอง

npm อาจ hoist การพึ่งพาทรานซิทีฟไปยัง `node_modules` ของโปรเจกต์แยกต่อ Plugin
ข้างแพ็กเกจ Plugin ได้ OpenClaw สแกนรากโปรเจกต์ที่จัดการก่อนเชื่อถือการติดตั้ง
และลบโปรเจกต์นั้นระหว่างถอนการติดตั้ง ดังนั้นการพึ่งพาขณะรันไทม์ที่ถูก hoist
จะยังอยู่ภายในขอบเขตการล้างข้อมูลของ Plugin นั้น

แพ็กเกจ Plugin npm ที่เผยแพร่แล้วสามารถจัดส่ง `npm-shrinkwrap.json` ได้ npm ใช้
lockfile ที่เผยแพร่ได้นั้นระหว่างติดตั้ง และรากโปรเจกต์ npm ที่ OpenClaw จัดการ
รองรับสิ่งนี้ผ่านเส้นทางการติดตั้ง npm ปกติ แพ็กเกจ Plugin ที่เผยแพร่ได้และ
OpenClaw เป็นเจ้าของต้องมี shrinkwrap เฉพาะแพ็กเกจที่สร้างจากกราฟการพึ่งพาที่เผยแพร่
ของแพ็กเกจ Plugin นั้น:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

ตัวสร้างจะตัด `devDependencies` ของ Plugin ออก ใช้นโยบาย override ของ workspace
และเขียน `extensions/<id>/npm-shrinkwrap.json` สำหรับ Plugin แต่ละตัวที่มี
`publishToNpm` แพ็กเกจ Plugin บุคคลที่สามอาจจัดส่ง shrinkwrap ได้เช่นกัน
OpenClaw ไม่บังคับใช้กับแพ็กเกจชุมชน แต่ npm จะเคารพเมื่อมีอยู่

แพ็กเกจ Plugin npm ที่ OpenClaw เป็นเจ้าของยังสามารถเผยแพร่พร้อม
`bundledDependencies` ที่ระบุชัดเจนได้ เส้นทางการเผยแพร่ npm จะ overlay รายชื่อ
การพึ่งพาขณะรันไทม์ ลบข้อมูลเมตา workspace เฉพาะ dev ออกจาก manifest ของแพ็กเกจที่เผยแพร่
รันการติดตั้ง npm แบบไม่ใช้สคริปต์สำหรับการพึ่งพาขณะรันไทม์เฉพาะแพ็กเกจ
จากนั้น pack หรือเผยแพร่ tarball ของ Plugin พร้อมรวมไฟล์การพึ่งพาเหล่านั้นไว้ด้วย
แพ็กเกจที่ใช้ native หนัก รวมถึงรันไทม์ Codex และ ACP เลือกไม่ใช้ด้วย
`openclaw.release.bundleRuntimeDependencies: false`; แพ็กเกจเหล่านั้นยังคงจัดส่ง
shrinkwrap ของตัวเอง แต่ npm จะแก้ไขการพึ่งพาขณะรันไทม์ระหว่างติดตั้ง
แทนที่จะฝังไบนารีทุกแพลตฟอร์มไว้ใน tarball ของ Plugin แพ็กเกจราก `openclaw`
จะไม่ bundle แผนผังการพึ่งพาทั้งหมดของตัวเอง

Plugin ที่นำเข้า `openclaw/plugin-sdk/*` ประกาศ `openclaw` เป็น peer dependency
OpenClaw ไม่อนุญาตให้ npm ติดตั้งสำเนา registry แยกต่างหากของแพ็กเกจ host
ลงในโปรเจกต์ที่จัดการ เพราะแพ็กเกจ host ที่ล้าสมัยอาจส่งผลต่อการแก้ไข peer ของ npm
ภายใน Plugin นั้น การติดตั้ง npm ที่จัดการจะข้ามการแก้ไข/การ materialize peer ของ npm
และ OpenClaw จะยืนยันลิงก์ `node_modules/openclaw` เฉพาะ Plugin อีกครั้งสำหรับแพ็กเกจที่ติดตั้ง
ซึ่งประกาศ host peer หลังการติดตั้งหรืออัปเดต

การติดตั้ง git จะ clone หรือ refresh repository แล้วรัน:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

จากนั้น Plugin ที่ติดตั้งจะโหลดจากไดเรกทอรีแพ็กเกจนั้น ดังนั้นการแก้ไข
`node_modules` เฉพาะแพ็กเกจและของ parent จึงทำงานเหมือนกับแพ็กเกจ Node ปกติ

## Plugin ในเครื่อง

Plugin ในเครื่องถือเป็นไดเรกทอรีที่นักพัฒนาควบคุม OpenClaw จะไม่รัน
`npm install`, `pnpm install` หรือซ่อมแซมการพึ่งพาให้ ถ้า Plugin ในเครื่อง
มีการพึ่งพา ให้ติดตั้งไว้ใน Plugin นั้นก่อนโหลด

Plugin ในเครื่องแบบ TypeScript ของบุคคลที่สามสามารถใช้เส้นทางฉุกเฉิน Jiti ได้
Plugin JavaScript ที่แพ็กเกจแล้วและ Plugin ภายในที่ bundle ไว้โหลดผ่าน
import/require แบบ native แทน Jiti

## การเริ่มต้นและการโหลดซ้ำ

การเริ่มต้น Gateway และการโหลด config ซ้ำจะไม่ติดตั้งการพึ่งพาของ Plugin
แต่จะอ่านระเบียนการติดตั้ง Plugin คำนวณ entrypoint และโหลดมัน

ถ้าการพึ่งพาขาดหายขณะรันไทม์ Plugin จะโหลดไม่สำเร็จ และข้อผิดพลาด
ควรชี้ผู้ปฏิบัติงานไปยังการแก้ไขที่ชัดเจน:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` สามารถล้างสถานะการพึ่งพาแบบเก่าที่ OpenClaw สร้างขึ้น
และกู้คืน Plugin ที่ดาวน์โหลดได้ซึ่งขาดหายจากระเบียนการติดตั้งในเครื่องเมื่อ config
อ้างอิงถึงมัน Doctor จะไม่ซ่อมแซมการพึ่งพาสำหรับ Plugin ในเครื่องที่ติดตั้งไว้แล้ว

## Plugin ที่ bundle ไว้

Plugin ที่เบาและสำคัญต่อ core จะถูกจัดส่งเป็นส่วนหนึ่งของ OpenClaw
Plugin เหล่านี้ควรไม่มีแผนผังการพึ่งพาขณะรันไทม์ที่หนัก หรือควรถูกย้ายออกไปเป็น
แพ็กเกจที่ดาวน์โหลดได้บน ClawHub/npm

สำหรับรายการที่สร้างล่าสุดของ Plugin ที่จัดส่งในแพ็กเกจ core ติดตั้งจากภายนอก
หรือคงไว้เฉพาะซอร์ส โปรดดู [คลังรายการ Plugin](/th/plugins/plugin-inventory)

manifest ของ Plugin ที่ bundle ไว้ต้องไม่ร้องขอ dependency staging ฟังก์ชันของ Plugin
ที่มีขนาดใหญ่หรือเป็นตัวเลือกควรถูกแพ็กเกจเป็น Plugin ปกติและติดตั้งผ่านเส้นทาง
npm/git/ClawHub เดียวกับ Plugin บุคคลที่สาม

ใน source checkout OpenClaw ถือว่า repository เป็น pnpm monorepo หลังจาก
`pnpm install` แล้ว Plugin ที่ bundle ไว้จะโหลดจาก `extensions/<id>` เพื่อให้
การพึ่งพา workspace เฉพาะแพ็กเกจพร้อมใช้งาน และการแก้ไขจะถูกนำไปใช้โดยตรง
การพัฒนาใน source checkout รองรับเฉพาะ pnpm; การใช้ `npm install` ธรรมดาที่ราก
repository ไม่ใช่วิธีที่รองรับในการเตรียมการพึ่งพาของ Plugin ที่ bundle ไว้

| รูปแบบการติดตั้ง                    | ตำแหน่ง Plugin ที่ bundle ไว้               | เจ้าของการพึ่งพา                                                     |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | แผนผังรันไทม์ที่ build ไว้ภายในแพ็กเกจ | แพ็กเกจ OpenClaw และ flow ติดตั้ง/อัปเดต/doctor ของ Plugin ที่ระบุชัดเจน     |
| Git checkout พร้อม `pnpm install` | แพ็กเกจ workspace `extensions/<id>`  | pnpm workspace รวมถึงการพึ่งพาของแต่ละแพ็กเกจ Plugin เอง |
| `openclaw plugins install ...`   | รากโปรเจกต์ npm/git/ClawHub ที่จัดการ  | flow ติดตั้ง/อัปเดตของ Plugin                                       |

## การล้างข้อมูลเดิม

OpenClaw เวอร์ชันเก่ากว่าสร้างรากการพึ่งพาของ Plugin ที่ bundle ไว้ตอนเริ่มต้น
หรือระหว่างการซ่อมแซมด้วย doctor การล้างข้อมูล doctor ปัจจุบันจะลบไดเรกทอรีและ
symlink ที่ล้าสมัยเหล่านั้นเมื่อใช้ `--fix` รวมถึงราก `plugin-runtime-deps` เก่า,
symlink แพ็กเกจ Node-prefix แบบ global ที่ชี้ไปยังเป้าหมาย `plugin-runtime-deps` ที่ถูก prune,
manifest `.openclaw-runtime-deps*`, `node_modules` ของ Plugin ที่สร้างขึ้น,
ไดเรกทอรี stage การติดตั้ง และ store pnpm เฉพาะแพ็กเกจ postinstall ของแพ็กเกจ
ยังลบ symlink global เหล่านั้นก่อน prune รากเป้าหมาย legacy เพื่อให้การอัปเกรด
ไม่ทิ้งการนำเข้าแพ็กเกจ ESM ที่ dangling ไว้

การติดตั้ง npm รุ่นเก่ายังเคยใช้ราก `~/.openclaw/npm/node_modules` ร่วมกัน
flow ติดตั้ง อัปเดต ถอนการติดตั้ง และ doctor ปัจจุบันยังรู้จักราก flat แบบ legacy นั้น
เฉพาะเพื่อการกู้คืนและล้างข้อมูลเท่านั้น การติดตั้ง npm ใหม่ควรสร้างรากโปรเจกต์
แยกต่อ Plugin แทน
