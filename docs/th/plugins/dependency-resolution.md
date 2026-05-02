---
read_when:
    - คุณกำลังดีบักการติดตั้งแพ็กเกจ Plugin
    - คุณกำลังเปลี่ยนพฤติกรรมการเริ่มต้น Plugin, doctor หรือการติดตั้งของตัวจัดการแพ็กเกจ
    - คุณกำลังดูแลการติดตั้ง OpenClaw แบบแพ็กเกจหรือแมนิเฟสต์ของ Plugin ที่รวมมาด้วย
sidebarTitle: Dependencies
summary: วิธีที่ OpenClaw ติดตั้งแพ็กเกจ Plugin และแก้ไขการพึ่งพาของ Plugin
title: การแก้ไขการขึ้นต่อกันของ Plugin
x-i18n:
    generated_at: "2026-05-02T10:23:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9476529ad1d44ed1b17caca628c58acfbb1d8c73393f58fa7d3d76944a71aea
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# การแก้ไข dependency ของ Plugin

OpenClaw เก็บงาน dependency ของ Plugin ไว้ในช่วงติดตั้ง/อัปเดต การโหลด runtime
จะไม่เรียกใช้ package manager, ซ่อมแซม dependency tree หรือแก้ไขไดเรกทอรีแพ็กเกจของ OpenClaw

## การแบ่งความรับผิดชอบ

แพ็กเกจ Plugin เป็นเจ้าของ dependency graph ของตัวเอง:

- runtime dependencies อยู่ใน `dependencies` หรือ
  `optionalDependencies` ของแพ็กเกจ Plugin
- การ import SDK/core เป็น peer หรือ import ที่ OpenClaw จัดหาให้
- Plugin สำหรับการพัฒนา local นำ dependency ที่ติดตั้งไว้แล้วของตัวเองมาใช้
- Plugin จาก npm และ git จะถูกติดตั้งลงใน package root ที่ OpenClaw เป็นเจ้าของ

OpenClaw เป็นเจ้าของเฉพาะวงจรชีวิตของ Plugin:

- ค้นหาแหล่งที่มาของ Plugin
- ติดตั้งหรืออัปเดตแพ็กเกจเมื่อมีการร้องขออย่างชัดเจน
- บันทึก metadata การติดตั้ง
- โหลด entrypoint ของ Plugin
- ล้มเหลวพร้อมข้อผิดพลาดที่นำไปแก้ไขได้เมื่อ dependency ขาดหายไป

## รากการติดตั้ง

OpenClaw ใช้รากที่เสถียรตามแต่ละแหล่งที่มา:

- แพ็กเกจ npm ติดตั้งใต้ `~/.openclaw/npm`
- แพ็กเกจ git clone ใต้ `~/.openclaw/git`
- การติดตั้ง local/path/archive จะถูกคัดลอกหรืออ้างอิงโดยไม่มีการซ่อมแซม dependency

การติดตั้ง npm ทำงานในราก npm ด้วย:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm อาจ hoist dependency แบบ transitive ไปยัง `~/.openclaw/npm/node_modules` ข้าง
แพ็กเกจ Plugin OpenClaw จะสแกนราก npm ที่จัดการอยู่ก่อนเชื่อถือการติดตั้ง
และใช้ npm เพื่อลบแพ็กเกจที่ npm จัดการระหว่างถอนการติดตั้ง ดังนั้น runtime
dependencies ที่ถูก hoist จะยังอยู่ภายในขอบเขตการล้างข้อมูลที่จัดการไว้

การติดตั้ง git จะ clone หรือ refresh repository แล้วเรียกใช้:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

จากนั้น Plugin ที่ติดตั้งแล้วจะโหลดจากไดเรกทอรีแพ็กเกจนั้น ดังนั้นการ resolve
`node_modules` ทั้งแบบ package-local และ parent จึงทำงานเหมือนแพ็กเกจ Node ปกติ

## Plugin แบบ local

Plugin แบบ local ถือเป็นไดเรกทอรีที่นักพัฒนาควบคุมเอง OpenClaw จะไม่เรียกใช้
`npm install`, `pnpm install` หรือซ่อมแซม dependency ให้ หาก Plugin แบบ local
มี dependency ให้ติดตั้ง dependency เหล่านั้นใน Plugin นั้นก่อนโหลด

Plugin TypeScript แบบ local ของบุคคลที่สามสามารถใช้เส้นทาง Jiti ฉุกเฉินได้
Plugin JavaScript ที่จัดแพ็กเกจแล้วและ Plugin ภายในที่รวมมาด้วยจะโหลดผ่าน
native import/require แทน Jiti

## การเริ่มต้นและ reload

การเริ่มต้น Gateway และการ reload config จะไม่ติดตั้ง dependency ของ Plugin
โดยจะอ่านบันทึกการติดตั้ง Plugin, คำนวณ entrypoint แล้วโหลด Plugin

หาก dependency ขาดหายไประหว่าง runtime, Plugin จะโหลดไม่สำเร็จ และข้อผิดพลาด
ควรชี้ผู้ปฏิบัติการไปยังวิธีแก้ไขที่ชัดเจน:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` สามารถล้างสถานะ dependency เดิมที่ OpenClaw สร้างไว้ และติดตั้ง
Plugin ที่ดาวน์โหลดได้ซึ่งกำหนดค่าไว้แต่ขาดหายจากบันทึกการติดตั้ง local
คำสั่งนี้ไม่ซ่อมแซม dependency สำหรับ Plugin แบบ local ที่ติดตั้งไว้แล้ว

## Plugin ที่รวมมาด้วย

Plugin ที่รวมมาด้วยซึ่งมีน้ำหนักเบาและสำคัญต่อ core จะถูกจัดส่งเป็นส่วนหนึ่งของ OpenClaw
Plugin เหล่านี้ควรไม่มี runtime dependency tree ขนาดใหญ่ หรือควรถูกย้ายออกไปเป็น
แพ็กเกจที่ดาวน์โหลดได้บน ClawHub/npm

สำหรับรายการที่สร้างขึ้นล่าสุดของ Plugin ที่จัดส่งในแพ็กเกจ core, ติดตั้งภายนอก,
หรือยังคงเป็น source-only โปรดดู [รายการ Plugin](/th/plugins/plugin-inventory)

manifest ของ Plugin ที่รวมมาด้วยต้องไม่ร้องขอ dependency staging ฟังก์ชันของ Plugin
ที่มีขนาดใหญ่หรือเป็น optional ควรถูกจัดแพ็กเกจเป็น Plugin ปกติ และติดตั้งผ่านเส้นทาง
npm/git/ClawHub เดียวกับ Plugin ของบุคคลที่สาม

ใน source checkout, OpenClaw ถือว่า repository เป็น pnpm monorepo หลังจาก
`pnpm install`, Plugin ที่รวมมาด้วยจะโหลดจาก `extensions/<id>` เพื่อให้ dependency
ของ workspace แบบ package-local พร้อมใช้งาน และการแก้ไขถูกนำมาใช้โดยตรง
การพัฒนา source checkout รองรับเฉพาะ pnpm เท่านั้น; การใช้ `npm install` ธรรมดา
ที่ราก repository ไม่ใช่วิธีที่รองรับสำหรับเตรียม dependency ของ Plugin ที่รวมมาด้วย

| รูปแบบการติดตั้ง                    | ตำแหน่ง Plugin ที่รวมมาด้วย               | เจ้าของ dependency                                                     |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | runtime tree ที่ build แล้วภายในแพ็กเกจ | แพ็กเกจ OpenClaw และ flow ติดตั้ง/อัปเดต/doctor ของ Plugin ที่ชัดเจน     |
| Git checkout plus `pnpm install` | แพ็กเกจ workspace `extensions/<id>`  | pnpm workspace รวมถึง dependency ของแพ็กเกจ Plugin แต่ละตัว |
| `openclaw plugins install ...`   | ราก Plugin npm/git/ClawHub ที่จัดการอยู่   | flow ติดตั้ง/อัปเดต Plugin                                       |

## การล้างข้อมูล legacy

OpenClaw เวอร์ชันเก่าสร้างราก dependency ของ Plugin ที่รวมมาด้วยในช่วงเริ่มต้น
หรือระหว่างการซ่อมแซมโดย doctor การล้างข้อมูลของ doctor ปัจจุบันจะลบไดเรกทอรี
และ symlink ที่ค้างอยู่เหล่านั้นเมื่อใช้ `--fix` รวมถึงราก `plugin-runtime-deps`
เก่า, manifest `.openclaw-runtime-deps*`, `node_modules` ของ Plugin ที่สร้างขึ้น,
ไดเรกทอรี stage การติดตั้ง และ store pnpm แบบ package-local

เส้นทางเหล่านี้เป็นเพียงเศษตกค้างจาก legacy การติดตั้งใหม่ไม่ควรสร้างเส้นทางเหล่านี้
