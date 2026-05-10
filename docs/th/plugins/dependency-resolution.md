---
read_when:
    - คุณกำลังดีบักการติดตั้งแพ็กเกจ Plugin
    - คุณกำลังเปลี่ยนพฤติกรรมการเริ่มต้น Plugin, doctor หรือการติดตั้งผ่านตัวจัดการแพ็กเกจ
    - คุณกำลังดูแลการติดตั้ง OpenClaw แบบแพ็กเกจหรือ manifest ของ Plugin ที่รวมมาด้วย
sidebarTitle: Dependencies
summary: วิธีที่ OpenClaw ติดตั้งแพ็กเกจ Plugin และจัดการการพึ่งพาของ Plugin
title: การแก้ไขการขึ้นต่อกันของ Plugin
x-i18n:
    generated_at: "2026-05-10T19:47:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb9637f46f273de976ff9203d23558d8bb51922b347871bc71917ef61d3c04a3
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw เก็บงาน dependency ของ Plugin ไว้ในช่วง install/update การโหลดตอน runtime
จะไม่เรียกใช้ package manager, ซ่อมแซม dependency tree, หรือแก้ไขไดเรกทอรี
package ของ OpenClaw

## การแบ่งความรับผิดชอบ

package ของ Plugin เป็นเจ้าของ dependency graph ของตนเอง:

- runtime dependencies อยู่ใน `dependencies` หรือ
  `optionalDependencies` ของ package Plugin
- การ import SDK/core เป็น peer หรือเป็น import ที่ OpenClaw จัดหาให้
- Plugin สำหรับการพัฒนาในเครื่องนำ dependency ที่ติดตั้งไว้แล้วของตนเองมาด้วย
- Plugin จาก npm และ git ถูกติดตั้งลงใน package root ที่ OpenClaw เป็นเจ้าของ

OpenClaw เป็นเจ้าของเฉพาะ lifecycle ของ Plugin:

- ค้นหาแหล่งที่มาของ Plugin
- ติดตั้งหรืออัปเดต package เมื่อมีการร้องขออย่างชัดเจน
- บันทึก metadata การติดตั้ง
- โหลด entrypoint ของ Plugin
- ล้มเหลวพร้อมข้อผิดพลาดที่ดำเนินการต่อได้เมื่อ dependency ขาดหาย

## install root

OpenClaw ใช้ root ที่เสถียรแยกตามแหล่งที่มา:

- package npm ติดตั้งภายใต้ `~/.openclaw/npm`
- package git clone ภายใต้ `~/.openclaw/git`
- การติดตั้ง local/path/archive จะถูกคัดลอกหรืออ้างอิงโดยไม่มีการซ่อมแซม dependency

การติดตั้ง npm ทำงานใน npm root ด้วย:

```bash
cd ~/.openclaw/npm
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` ใช้ managed npm root เดียวกันนั้น
สำหรับ tarball npm-pack ในเครื่อง OpenClaw อ่าน metadata npm ของ tarball เพิ่มเข้าไป
ใน managed root เป็น dependency แบบ `file:` ที่คัดลอกมา เรียกใช้ npm install ตามปกติ
แล้วตรวจสอบ metadata ของ lockfile ที่ติดตั้งก่อนเชื่อถือ Plugin
สิ่งนี้มีไว้สำหรับ package-acceptance และหลักฐาน release-candidate ซึ่ง artifact
pack ในเครื่องควรทำงานเหมือน artifact ใน registry ที่จำลองอยู่

npm อาจ hoist transitive dependencies ไปยัง `~/.openclaw/npm/node_modules` ข้าง
package ของ Plugin ได้ OpenClaw สแกน managed npm root ก่อนเชื่อถือการติดตั้ง
และใช้ npm เพื่อลบ package ที่ npm จัดการระหว่างถอนการติดตั้ง ดังนั้น runtime
dependencies ที่ถูก hoist จะยังอยู่ภายในขอบเขต cleanup ที่จัดการไว้

Plugin ที่ import `openclaw/plugin-sdk/*` ประกาศ `openclaw` เป็น peer
dependency OpenClaw ไม่ยอมให้ npm ติดตั้งสำเนา registry แยกต่างหากของ host package
ลงใน managed root เพราะ host package ที่เก่าอาจกระทบการแก้ peer ของ npm ระหว่าง
การติดตั้ง Plugin ในภายหลัง การติดตั้ง npm ที่จัดการไว้จะข้ามการ resolve/materialize
peer ของ npm สำหรับ root ที่ใช้ร่วมกัน และ OpenClaw จะยืนยันลิงก์
`node_modules/openclaw` ภายใน Plugin อีกครั้งสำหรับ package ที่ติดตั้งซึ่งประกาศ
host peer หลัง install, update, หรือ uninstall

การติดตั้ง git จะ clone หรือ refresh repository แล้วเรียกใช้:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

จากนั้น Plugin ที่ติดตั้งจะโหลดจากไดเรกทอรี package นั้น ดังนั้นการ resolve
`node_modules` ทั้งใน package-local และ parent จะทำงานแบบเดียวกับ package Node
ปกติ

## Plugin ในเครื่อง

Plugin ในเครื่องถูกมองเป็นไดเรกทอรีที่นักพัฒนาควบคุม OpenClaw จะไม่เรียกใช้
`npm install`, `pnpm install`, หรือซ่อมแซม dependency ให้ หาก Plugin ในเครื่อง
มี dependency ให้ติดตั้งใน Plugin นั้นก่อนโหลด

Plugin TypeScript ของบุคคลที่สามในเครื่องสามารถใช้เส้นทาง Jiti ฉุกเฉินได้
Plugin JavaScript แบบ packaged และ Plugin ภายในที่ bundled จะโหลดผ่าน native
import/require แทน Jiti

## Startup และ reload

การเริ่มต้น Gateway และการ reload config จะไม่ติดตั้ง dependency ของ Plugin
โดยจะอ่าน record การติดตั้ง Plugin คำนวณ entrypoint แล้วโหลด

หาก dependency ขาดหายตอน runtime Plugin จะโหลดไม่สำเร็จและข้อผิดพลาดควรชี้ให้
operator ไปยังวิธีแก้ที่ชัดเจน:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` สามารถล้างสถานะ dependency แบบ legacy ที่ OpenClaw สร้างขึ้นและกู้คืน
Plugin ที่ดาวน์โหลดได้ซึ่งขาดจาก record การติดตั้งในเครื่องเมื่อ config อ้างถึงได้
Doctor จะไม่ซ่อม dependency ให้ Plugin ในเครื่องที่ติดตั้งอยู่แล้ว

## Plugin ที่ bundled

Plugin ที่ bundled แบบเบาและสำคัญต่อ core จะถูกจัดส่งเป็นส่วนหนึ่งของ OpenClaw
ควรไม่มี runtime dependency tree ขนาดใหญ่ หรือควรถูกย้ายออกไปเป็น package ที่ดาวน์โหลดได้
บน ClawHub/npm

สำหรับรายการ Plugin ที่สร้างขึ้นปัจจุบันซึ่งจัดส่งใน core package, ติดตั้งจากภายนอก,
หรือยังเป็น source-only โปรดดู [Plugin inventory](/th/plugins/plugin-inventory)

manifest ของ Plugin ที่ bundled ต้องไม่ขอ dependency staging ฟังก์ชัน Plugin
ขนาดใหญ่หรือเป็น optional ควรถูก package เป็น Plugin ปกติและติดตั้งผ่านเส้นทาง
npm/git/ClawHub เดียวกับ Plugin ของบุคคลที่สาม

ใน source checkout OpenClaw มอง repository เป็น pnpm monorepo หลังจาก
`pnpm install` Plugin ที่ bundled จะโหลดจาก `extensions/<id>` เพื่อให้ dependency
workspace แบบ package-local พร้อมใช้งานและการแก้ไขถูกนำไปใช้โดยตรง การพัฒนา
source checkout รองรับเฉพาะ pnpm เท่านั้น; การใช้ `npm install` ธรรมดาที่ root
ของ repository ไม่ใช่วิธีที่รองรับในการเตรียม dependency ของ Plugin ที่ bundled

| รูปแบบการติดตั้ง | ตำแหน่ง Plugin ที่ bundled | เจ้าของ dependency |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | runtime tree ที่ build แล้วภายใน package | package OpenClaw และ flow install/update/doctor ของ Plugin ที่ชัดเจน |
| Git checkout plus `pnpm install` | package workspace `extensions/<id>` | pnpm workspace รวมถึง dependency ของแต่ละ package Plugin เอง |
| `openclaw plugins install ...`   | managed npm/git/ClawHub plugin root | flow install/update ของ Plugin |

## การล้าง legacy

OpenClaw เวอร์ชันเก่าสร้าง root dependency ของ Plugin ที่ bundled ตอน startup
หรือระหว่างการซ่อมด้วย doctor การ cleanup ของ doctor ปัจจุบันจะลบไดเรกทอรีและ
symlink เก่าเหล่านั้นเมื่อใช้ `--fix` รวมถึง root `plugin-runtime-deps` เก่า,
symlink package ของ Node-prefix แบบ global ที่ชี้ไปยังเป้าหมาย `plugin-runtime-deps`
ที่ถูก prune แล้ว, manifest `.openclaw-runtime-deps*`, `node_modules` ของ Plugin
ที่สร้างขึ้น, ไดเรกทอรี install stage, และ store pnpm แบบ package-local
postinstall แบบ packaged ยังลบ symlink global เหล่านั้นก่อน prune root เป้าหมาย
legacy เพื่อให้การอัปเกรดไม่ทิ้ง import package ESM ที่ dangling ไว้

เส้นทางเหล่านี้เป็นเพียงเศษตกค้าง legacy เท่านั้น การติดตั้งใหม่ไม่ควรสร้างเส้นทางเหล่านี้.
