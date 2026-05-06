---
read_when:
    - คุณกำลังดีบักการติดตั้งแพ็กเกจ Plugin
    - คุณกำลังเปลี่ยนพฤติกรรมการเริ่มต้น Plugin, doctor หรือการติดตั้งผ่านตัวจัดการแพ็กเกจ
    - คุณกำลังดูแลการติดตั้ง OpenClaw แบบแพ็กเกจหรือไฟล์กำกับ Plugin ที่รวมมาในชุด
sidebarTitle: Dependencies
summary: วิธีที่ OpenClaw ติดตั้งแพ็กเกจ Plugin และแก้ไขการพึ่งพาของ Plugin
title: การแก้ไขการขึ้นต่อกันของ Plugin
x-i18n:
    generated_at: "2026-05-06T19:35:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: d51785b67d491d09e3a7a3ffcd6c991f7415c46b207596151dbc29b0c43e9341
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw เก็บงาน dependency ของ Plugin ไว้ในช่วงติดตั้ง/อัปเดต การโหลดขณะรันไทม์
จะไม่เรียกใช้ package manager, ซ่อมแซม dependency tree, หรือแก้ไขไดเรกทอรี
แพ็กเกจของ OpenClaw

## การแบ่งความรับผิดชอบ

แพ็กเกจ Plugin เป็นเจ้าของกราฟ dependency ของตัวเอง:

- runtime dependencies อยู่ใน `dependencies` หรือ
  `optionalDependencies` ของแพ็กเกจ Plugin
- การ import SDK/core เป็น peer หรือ import ที่ OpenClaw จัดหาให้
- Plugin สำหรับการพัฒนาในเครื่องนำ dependency ที่ติดตั้งไว้แล้วของตัวเองมาใช้
- Plugin จาก npm และ git ถูกติดตั้งลงใน package roots ที่ OpenClaw เป็นเจ้าของ

OpenClaw เป็นเจ้าของเฉพาะวงจรชีวิตของ Plugin:

- ค้นหาแหล่งที่มาของ Plugin
- ติดตั้งหรืออัปเดตแพ็กเกจเมื่อมีการร้องขออย่างชัดเจน
- บันทึก metadata การติดตั้ง
- โหลด entrypoint ของ Plugin
- ล้มเหลวพร้อมข้อผิดพลาดที่นำไปแก้ไขได้เมื่อ dependency หายไป

## รากการติดตั้ง

OpenClaw ใช้รากต่อแหล่งที่มาที่คงที่:

- แพ็กเกจ npm ติดตั้งใต้ `~/.openclaw/npm`
- แพ็กเกจ git clone ใต้ `~/.openclaw/git`
- การติดตั้งแบบ local/path/archive จะถูกคัดลอกหรืออ้างอิงโดยไม่มีการซ่อมแซม dependency

การติดตั้ง npm รันในราก npm ด้วย:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` ใช้ราก npm ที่จัดการเดียวกันนั้น
สำหรับ tarball npm-pack ในเครื่อง OpenClaw อ่าน metadata npm ของ tarball, เพิ่มมัน
เข้าไปในรากที่จัดการในฐานะ dependency แบบ `file:` ที่คัดลอกไว้, รันการติดตั้ง npm ปกติ,
จากนั้นตรวจสอบ metadata ของ lockfile ที่ติดตั้งก่อนเชื่อถือ Plugin
สิ่งนี้มีไว้สำหรับ package-acceptance และหลักฐาน release-candidate ซึ่ง artifact
จากแพ็กในเครื่องควรทำงานเหมือน artifact จาก registry ที่มันจำลอง

npm อาจ hoist dependency แบบ transitive ไปที่ `~/.openclaw/npm/node_modules` ข้าง
แพ็กเกจ Plugin ได้ OpenClaw สแกนราก npm ที่จัดการก่อนเชื่อถือการติดตั้ง
และใช้ npm เพื่อลบแพ็กเกจที่ npm จัดการระหว่าง uninstall ดังนั้น runtime dependencies
ที่ถูก hoist จะยังอยู่ภายในขอบเขตการล้างข้อมูลที่จัดการอยู่

Plugin ที่ import `openclaw/plugin-sdk/*` ประกาศ `openclaw` เป็น peer
dependency OpenClaw ไม่อนุญาตให้ npm ติดตั้งสำเนา registry แยกต่างหากของแพ็กเกจ host
เข้าไปในรากที่จัดการ เพราะแพ็กเกจ host ที่เก่าอาจส่งผลต่อการ resolve peer ของ npm
ระหว่างการติดตั้ง Plugin ในภายหลัง การติดตั้ง npm ที่จัดการจะข้ามการ resolve/materialization
ของ npm peer สำหรับรากที่แชร์ และ OpenClaw จะยืนยันลิงก์
`node_modules/openclaw` เฉพาะ Plugin อีกครั้งสำหรับแพ็กเกจที่ติดตั้งซึ่งประกาศ host peer
หลังจาก install, update, หรือ uninstall

การติดตั้ง git จะ clone หรือ refresh repository แล้วรัน:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

จากนั้น Plugin ที่ติดตั้งจะโหลดจากไดเรกทอรีแพ็กเกจนั้น ดังนั้นการ resolve
`node_modules` ระดับแพ็กเกจและ parent จะทำงานเหมือนกับแพ็กเกจ Node ปกติ

## Plugin ในเครื่อง

Plugin ในเครื่องถือเป็นไดเรกทอรีที่นักพัฒนาควบคุม OpenClaw จะไม่รัน
`npm install`, `pnpm install`, หรือซ่อมแซม dependency ให้ หาก Plugin ในเครื่อง
มี dependency ให้ติดตั้ง dependency เหล่านั้นใน Plugin นั้นก่อนโหลด

Plugin TypeScript บุคคลที่สามในเครื่องสามารถใช้เส้นทาง Jiti ฉุกเฉินได้ Plugin
JavaScript แบบแพ็กเกจและ Plugin ภายในที่บันเดิลมาจะโหลดผ่าน
import/require แบบเนทีฟแทน Jiti

## การเริ่มต้นและการโหลดซ้ำ

การเริ่มต้น Gateway และการ reload config จะไม่ติดตั้ง dependency ของ Plugin
ทั้งสองจะอ่านบันทึกการติดตั้ง Plugin, คำนวณ entrypoint, และโหลดมัน

หาก dependency หายไประหว่างรันไทม์ Plugin จะโหลดไม่สำเร็จ และข้อผิดพลาด
ควรชี้ operator ไปยังการแก้ไขที่ชัดเจน:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` สามารถล้างสถานะ dependency แบบ legacy ที่ OpenClaw สร้างไว้
และกู้คืน Plugin ที่ดาวน์โหลดได้ซึ่งหายไปจากบันทึกการติดตั้งในเครื่องเมื่อ config
อ้างอิงถึงมัน Doctor จะไม่ซ่อมแซม dependency สำหรับ Plugin ในเครื่องที่ติดตั้งไว้แล้ว

## Plugin ที่บันเดิลมา

Plugin ที่บันเดิลมาซึ่งมีขนาดเบาและสำคัญต่อ core จะถูกจัดส่งเป็นส่วนหนึ่งของ OpenClaw
Plugin เหล่านี้ควรไม่มี runtime dependency tree ขนาดใหญ่ หรือควรถูกย้ายออกไปเป็น
แพ็กเกจที่ดาวน์โหลดได้บน ClawHub/npm

สำหรับรายการ Plugin ปัจจุบันที่สร้างขึ้นซึ่งจัดส่งในแพ็กเกจ core, ติดตั้งจากภายนอก,
หรือคงไว้เป็น source-only โปรดดู [รายการ Plugin](/th/plugins/plugin-inventory)

manifest ของ Plugin ที่บันเดิลมาต้องไม่ร้องขอ dependency staging ฟังก์ชันการทำงาน
ของ Plugin ที่มีขนาดใหญ่หรือเป็น optional ควรถูกแพ็กเกจเป็น Plugin ปกติ
และติดตั้งผ่านเส้นทาง npm/git/ClawHub เดียวกับ Plugin บุคคลที่สาม

ใน source checkout OpenClaw ถือว่า repository เป็น pnpm monorepo หลังจาก
`pnpm install` Plugin ที่บันเดิลมาจะโหลดจาก `extensions/<id>` เพื่อให้ dependency
ของ workspace เฉพาะแพ็กเกจพร้อมใช้งาน และการแก้ไขถูกนำไปใช้โดยตรง การพัฒนา
source checkout รองรับเฉพาะ pnpm เท่านั้น; การรัน `npm install` ธรรมดาที่ราก
repository ไม่ใช่วิธีที่รองรับสำหรับเตรียม dependency ของ Plugin ที่บันเดิลมา

| รูปแบบการติดตั้ง                    | ตำแหน่ง Plugin ที่บันเดิลมา               | เจ้าของ dependency                                                     |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | runtime tree ที่ build แล้วภายในแพ็กเกจ | แพ็กเกจ OpenClaw และ flow install/update/doctor ของ Plugin ที่ชัดเจน     |
| Git checkout plus `pnpm install` | แพ็กเกจ workspace `extensions/<id>`  | pnpm workspace รวมถึง dependency ของแพ็กเกจ Plugin แต่ละตัว |
| `openclaw plugins install ...`   | ราก Plugin npm/git/ClawHub ที่จัดการ   | flow install/update ของ Plugin                                       |

## การล้างข้อมูล legacy

OpenClaw เวอร์ชันเก่าสร้างราก dependency ของ Plugin ที่บันเดิลมาเมื่อเริ่มต้นหรือ
ระหว่างการซ่อมแซมของ doctor การล้างข้อมูลของ doctor ปัจจุบันจะลบไดเรกทอรี
และ symlink ที่ค้างเหล่านั้นเมื่อใช้ `--fix` รวมถึงราก `plugin-runtime-deps` เก่า,
symlink ของแพ็กเกจ Node-prefix ระดับ global ที่ชี้ไปยัง target `plugin-runtime-deps`
ที่ถูก prune, manifest `.openclaw-runtime-deps*`, `node_modules` ของ Plugin
ที่สร้างขึ้น, ไดเรกทอรี install stage, และ store pnpm เฉพาะแพ็กเกจ postinstall
แบบแพ็กเกจยังลบ symlink ระดับ global เหล่านั้นก่อน prune ราก target legacy
เพื่อให้การอัปเกรดไม่ทิ้ง import แพ็กเกจ ESM ที่ขาดปลายทางไว้

เส้นทางเหล่านี้เป็นเพียงเศษตกค้างแบบ legacy เท่านั้น การติดตั้งใหม่ไม่ควรสร้างมันขึ้นมา
