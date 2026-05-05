---
read_when:
    - คุณกำลังดีบักการติดตั้งแพ็กเกจ Plugin
    - คุณกำลังเปลี่ยนพฤติกรรมการเริ่มต้น Plugin, doctor หรือการติดตั้งผ่านตัวจัดการแพ็กเกจ
    - คุณกำลังดูแลการติดตั้ง OpenClaw แบบแพ็กเกจหรือไฟล์ manifest ของ Plugin ที่รวมมาด้วย
sidebarTitle: Dependencies
summary: วิธีที่ OpenClaw ติดตั้งแพ็กเกจ Plugin และแก้ไขการพึ่งพาของ Plugin
title: การแก้ไขการพึ่งพาของ Plugin
x-i18n:
    generated_at: "2026-05-05T01:49:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a832f705e51bba8ac77e2a8715a7213fd2caf10bfa42059d53db4a6d5ad8c20
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# การแก้ dependency ของ Plugin

OpenClaw จัดการ dependency ของ Plugin ในช่วงติดตั้ง/อัปเดต การโหลดตอนรันไทม์
จะไม่เรียกใช้ package manager, ซ่อมแซม dependency tree, หรือแก้ไขไดเรกทอรีแพ็กเกจของ OpenClaw

## การแบ่งความรับผิดชอบ

แพ็กเกจ Plugin เป็นเจ้าของ dependency graph ของตัวเอง:

- runtime dependencies อยู่ใน `dependencies` หรือ `optionalDependencies`
  ของแพ็กเกจ Plugin
- การ import SDK/core เป็น peer หรือเป็น import ที่ OpenClaw จัดหาให้
- Plugin สำหรับการพัฒนาในเครื่องนำ dependency ที่ติดตั้งไว้แล้วของตัวเองมาใช้
- Plugin จาก npm และ git จะถูกติดตั้งลงใน package root ที่ OpenClaw เป็นเจ้าของ

OpenClaw เป็นเจ้าของเฉพาะ lifecycle ของ Plugin:

- ค้นหาแหล่งที่มาของ Plugin
- ติดตั้งหรืออัปเดตแพ็กเกจเมื่อมีการร้องขออย่างชัดเจน
- บันทึก metadata การติดตั้ง
- โหลด entrypoint ของ Plugin
- ล้มเหลวพร้อมข้อผิดพลาดที่นำไปแก้ไขได้เมื่อ dependency ขาดหาย

## Install roots

OpenClaw ใช้ root ที่เสถียรแยกตามแหล่งที่มา:

- แพ็กเกจ npm ติดตั้งใต้ `~/.openclaw/npm`
- แพ็กเกจ git clone ใต้ `~/.openclaw/git`
- การติดตั้งแบบ local/path/archive จะถูกคัดลอกหรืออ้างอิงโดยไม่มีการซ่อมแซม dependency

การติดตั้ง npm ทำงานใน npm root ด้วย:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm อาจ hoist transitive dependencies ไปที่ `~/.openclaw/npm/node_modules` ข้าง
แพ็กเกจ Plugin ได้ OpenClaw จะสแกน managed npm root ก่อนเชื่อถือการติดตั้ง
และใช้ npm เพื่อลบแพ็กเกจที่ npm จัดการระหว่างถอนการติดตั้ง ดังนั้น hoisted
runtime dependencies จะยังอยู่ภายในขอบเขต cleanup ที่จัดการไว้

การติดตั้ง git จะ clone หรือ refresh repository แล้วจึงรัน:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

จากนั้น Plugin ที่ติดตั้งแล้วจะโหลดจากไดเรกทอรีแพ็กเกจนั้น ดังนั้นการ resolve
`node_modules` ทั้งใน package-local และ parent จะทำงานเหมือนกับแพ็กเกจ Node ปกติ

## Plugin ในเครื่อง

Plugin ในเครื่องถือเป็นไดเรกทอรีที่นักพัฒนาควบคุม OpenClaw จะไม่รัน
`npm install`, `pnpm install`, หรือการซ่อมแซม dependency ให้ หาก Plugin ในเครื่อง
มี dependency ให้ติดตั้ง dependency เหล่านั้นใน Plugin นั้นก่อนโหลด

Plugin TypeScript ในเครื่องจากบุคคลที่สามสามารถใช้เส้นทาง Jiti ฉุกเฉินได้
Plugin JavaScript แบบแพ็กเกจและ Plugin ภายในที่ bundled จะโหลดผ่าน
import/require แบบ native แทน Jiti

## การเริ่มต้นและการโหลดใหม่

การเริ่มต้น Gateway และการ reload config จะไม่ติดตั้ง dependency ของ Plugin
ระบบจะอ่านบันทึกการติดตั้ง Plugin, คำนวณ entrypoint, แล้วโหลด

หาก dependency ขาดหายตอนรันไทม์ Plugin จะโหลดไม่สำเร็จ และข้อผิดพลาดควรชี้ให้
operator ไปยังวิธีแก้ไขที่ชัดเจน:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` สามารถล้างสถานะ dependency เดิมที่ OpenClaw สร้างไว้ และกู้คืน
Plugin ที่ดาวน์โหลดได้ซึ่งหายไปจากบันทึกการติดตั้งในเครื่องเมื่อ config อ้างอิงถึง
Doctor จะไม่ซ่อมแซม dependency สำหรับ Plugin ในเครื่องที่ติดตั้งอยู่แล้ว

## Plugin ที่ bundled

Plugin ที่ bundled ซึ่งมีน้ำหนักเบาและสำคัญต่อ core จะถูกจัดส่งเป็นส่วนหนึ่งของ OpenClaw
Plugin เหล่านี้ควรไม่มี runtime dependency tree หนัก หรือควรถูกย้ายออกไปเป็น
แพ็กเกจที่ดาวน์โหลดได้บน ClawHub/npm

สำหรับรายการ Plugin ที่สร้างล่าสุดซึ่งจัดส่งในแพ็กเกจ core, ติดตั้งจากภายนอก,
หรือคงไว้เฉพาะซอร์ส โปรดดู [Plugin inventory](/th/plugins/plugin-inventory)

manifest ของ Plugin ที่ bundled ต้องไม่ขอ dependency staging ฟังก์ชันของ Plugin
ที่มีขนาดใหญ่หรือเป็นตัวเลือกควรถูกแพ็กเป็น Plugin ปกติและติดตั้งผ่านเส้นทาง
npm/git/ClawHub เดียวกับ Plugin จากบุคคลที่สาม

ใน source checkout OpenClaw ถือว่า repository เป็น pnpm monorepo หลังจาก
`pnpm install` แล้ว Plugin ที่ bundled จะโหลดจาก `extensions/<id>` เพื่อให้
dependency ใน workspace แบบ package-local พร้อมใช้งานและการแก้ไขถูกนำไปใช้โดยตรง
การพัฒนาจาก source checkout รองรับเฉพาะ pnpm เท่านั้น; การรัน `npm install`
แบบธรรมดาที่ root ของ repository ไม่ใช่วิธีที่รองรับสำหรับเตรียม dependency
ของ Plugin ที่ bundled

| รูปแบบการติดตั้ง                    | ตำแหน่ง Plugin ที่ bundled               | เจ้าของ dependency                                                     |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | runtime tree ที่ build แล้วภายในแพ็กเกจ | แพ็กเกจ OpenClaw และ flow install/update/doctor ของ Plugin ที่ชัดเจน     |
| Git checkout พร้อม `pnpm install` | แพ็กเกจ workspace `extensions/<id>`  | pnpm workspace รวมถึง dependency ของแพ็กเกจ Plugin แต่ละตัว |
| `openclaw plugins install ...`   | managed npm/git/ClawHub plugin root   | flow install/update ของ Plugin                                       |

## การล้างของเก่า

OpenClaw เวอร์ชันเก่าสร้าง bundled-plugin dependency roots ตอนเริ่มต้นหรือ
ระหว่างการซ่อมแซมด้วย doctor การ cleanup ของ doctor ปัจจุบันจะลบไดเรกทอรีและ
symlink เก่าเหล่านั้นเมื่อใช้ `--fix` รวมถึง root `plugin-runtime-deps` เก่า,
symlink ของแพ็กเกจ Node-prefix แบบ global ที่ชี้ไปยัง target `plugin-runtime-deps`
ที่ถูก prune แล้ว, manifest `.openclaw-runtime-deps*`, `node_modules` ของ Plugin
ที่สร้างขึ้น, ไดเรกทอรี install stage, และ package-local pnpm stores postinstall
ของแพ็กเกจยังลบ symlink แบบ global เหล่านั้นก่อน prune target root แบบ legacy
เพื่อให้การอัปเกรดไม่ทิ้ง ESM package imports ที่ dangling ไว้

path เหล่านี้เป็นเพียงเศษตกค้างจาก legacy เท่านั้น การติดตั้งใหม่ไม่ควรสร้างสิ่งเหล่านี้
