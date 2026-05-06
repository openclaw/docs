---
read_when:
    - คุณกำลังดีบักการติดตั้งแพ็กเกจ Plugin
    - คุณกำลังเปลี่ยนพฤติกรรมการเริ่มต้น Plugin, doctor หรือการติดตั้งผ่านตัวจัดการแพ็กเกจ
    - คุณกำลังดูแลการติดตั้ง OpenClaw แบบแพ็กเกจหรือ manifest ของ Plugin ที่รวมมาด้วย
sidebarTitle: Dependencies
summary: วิธีที่ OpenClaw ติดตั้งแพ็กเกจ Plugin และจัดการการขึ้นต่อกันของ Plugin
title: การแก้ไขการขึ้นต่อกันของ Plugin
x-i18n:
    generated_at: "2026-05-06T17:59:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15cdc75d92a675fd5474c49572639ab7510618e393fb7cf9f8b94506c859bee8
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw เก็บงานการพึ่งพาของ Plugin ไว้ที่ช่วงติดตั้ง/อัปเดต การโหลดขณะรันไทม์
จะไม่เรียกตัวจัดการแพ็กเกจ ซ่อมแซมแผนผังการพึ่งพา หรือแก้ไขไดเรกทอรีแพ็กเกจของ OpenClaw

## การแบ่งความรับผิดชอบ

แพ็กเกจ Plugin เป็นเจ้าของกราฟการพึ่งพาของตนเอง:

- การพึ่งพาขณะรันไทม์อยู่ใน `dependencies` หรือ `optionalDependencies`
  ของแพ็กเกจ Plugin
- การ import SDK/core เป็น peer หรือ import ที่ OpenClaw จัดหาให้
- Plugin สำหรับการพัฒนาในเครื่องนำการพึ่งพาที่ติดตั้งไว้แล้วของตัวเองมาใช้
- Plugin จาก npm และ git จะถูกติดตั้งลงในรากแพ็กเกจที่ OpenClaw เป็นเจ้าของ

OpenClaw เป็นเจ้าของเฉพาะวงจรชีวิตของ Plugin:

- ค้นหาแหล่งที่มาของ Plugin
- ติดตั้งหรืออัปเดตแพ็กเกจเมื่อมีการร้องขออย่างชัดเจน
- บันทึกเมทาดาทาการติดตั้ง
- โหลด entrypoint ของ Plugin
- ล้มเหลวพร้อมข้อผิดพลาดที่นำไปแก้ไขได้เมื่อขาดการพึ่งพา

## รากการติดตั้ง

OpenClaw ใช้รากที่คงที่แยกตามแหล่งที่มา:

- แพ็กเกจ npm ติดตั้งใต้ `~/.openclaw/npm`
- แพ็กเกจ git โคลนใต้ `~/.openclaw/git`
- การติดตั้งจาก local/path/archive จะถูกคัดลอกหรืออ้างอิงโดยไม่ซ่อมแซมการพึ่งพา

การติดตั้ง npm ทำงานในราก npm ด้วย:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` ใช้ราก npm ที่จัดการเดียวกันนั้น
สำหรับ tarball npm-pack ในเครื่อง OpenClaw อ่านเมทาดาทา npm ของ tarball เพิ่มมัน
ลงในรากที่จัดการเป็นการพึ่งพา `file:` ที่คัดลอกไว้ เรียกการติดตั้ง npm ปกติ
แล้วตรวจสอบเมทาดาทา lockfile ที่ติดตั้งก่อนจะเชื่อถือ Plugin
สิ่งนี้มีไว้สำหรับการพิสูจน์ package-acceptance และ release-candidate ที่ artifact
แพ็กในเครื่องควรทำงานเหมือน artifact ใน registry ที่มันจำลอง

npm อาจ hoist การพึ่งพาแบบ transitive ไปที่ `~/.openclaw/npm/node_modules` ข้าง
แพ็กเกจ Plugin ได้ OpenClaw สแกนราก npm ที่จัดการก่อนจะเชื่อถือการติดตั้ง
และใช้ npm เพื่อลบแพ็กเกจที่ npm จัดการระหว่างถอนการติดตั้ง ดังนั้นการพึ่งพาขณะรันไทม์ที่ถูก hoist
จะยังอยู่ภายในขอบเขตการล้างข้อมูลที่จัดการ

Plugin ที่ import `openclaw/plugin-sdk/*` ประกาศ `openclaw` เป็น peer dependency
OpenClaw ไม่ปล่อยให้ npm ติดตั้งสำเนาแพ็กเกจโฮสต์แยกจาก registry ลงในรากที่จัดการ
เพราะแพ็กเกจโฮสต์ที่ล้าสมัยอาจกระทบการ resolve peer ของ npm ระหว่างการติดตั้ง Plugin ภายหลัง
แทนที่จะทำเช่นนั้น หลังจาก npm แก้ไขรากที่แชร์ระหว่างติดตั้ง อัปเดต หรือถอนการติดตั้งเสร็จ
OpenClaw จะยืนยันลิงก์ `node_modules/openclaw` เฉพาะ Plugin อีกครั้ง
สำหรับแพ็กเกจที่ติดตั้งซึ่งประกาศ host peer

การติดตั้ง git จะโคลนหรือรีเฟรช repository แล้วจึงเรียก:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

จากนั้น Plugin ที่ติดตั้งจะโหลดจากไดเรกทอรีแพ็กเกจนั้น ดังนั้นการ resolve
`node_modules` เฉพาะแพ็กเกจและของ parent จะทำงานแบบเดียวกับแพ็กเกจ Node ปกติ

## Plugin ในเครื่อง

Plugin ในเครื่องถือเป็นไดเรกทอรีที่นักพัฒนาควบคุม OpenClaw จะไม่เรียก
`npm install`, `pnpm install` หรือซ่อมแซมการพึ่งพาสำหรับสิ่งเหล่านี้ หาก Plugin
ในเครื่องมีการพึ่งพา ให้ติดตั้งการพึ่งพาเหล่านั้นใน Plugin นั้นก่อนโหลด

Plugin TypeScript ของบุคคลที่สามในเครื่องสามารถใช้เส้นทางฉุกเฉินของ Jiti ได้
Plugin JavaScript แบบแพ็กเกจและ Plugin ภายในที่ bundled จะโหลดผ่าน
import/require แบบ native แทน Jiti

## การเริ่มต้นและการโหลดซ้ำ

การเริ่มต้น Gateway และการโหลด config ซ้ำจะไม่ติดตั้งการพึ่งพาของ Plugin
มันจะอ่านระเบียนการติดตั้ง Plugin คำนวณ entrypoint และโหลดมัน

หากขาดการพึ่งพาขณะรันไทม์ Plugin จะโหลดไม่สำเร็จ และข้อผิดพลาดควรชี้ผู้ปฏิบัติงานไปยังการแก้ไขที่ชัดเจน:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` สามารถล้างสถานะการพึ่งพา legacy ที่ OpenClaw สร้างขึ้น และกู้คืน
Plugin ที่ดาวน์โหลดได้ซึ่งหายไปจากระเบียนการติดตั้งในเครื่องเมื่อ config
อ้างอิงถึงสิ่งเหล่านั้น Doctor ไม่ซ่อมแซมการพึ่งพาสำหรับ Plugin ในเครื่องที่ติดตั้งไว้แล้ว

## Plugin ที่ bundled

Plugin ที่ bundled ซึ่งมีน้ำหนักเบาและสำคัญต่อ core จะถูกจัดส่งเป็นส่วนหนึ่งของ OpenClaw
Plugin เหล่านี้ควรไม่มีแผนผังการพึ่งพาขณะรันไทม์ที่หนัก หรือควรถูกย้ายออกไปเป็น
แพ็กเกจที่ดาวน์โหลดได้บน ClawHub/npm

สำหรับรายการ Plugin ที่สร้างขึ้นปัจจุบันซึ่งจัดส่งในแพ็กเกจ core ติดตั้งจากภายนอก
หรือคงไว้เป็น source-only โปรดดู [คลังรายการ Plugin](/th/plugins/plugin-inventory)

manifest ของ Plugin ที่ bundled ต้องไม่ร้องขอการจัดเตรียมการพึ่งพา ฟังก์ชันการทำงานของ Plugin
ที่มีขนาดใหญ่หรือเป็น optional ควรถูกแพ็กเป็น Plugin ปกติและติดตั้งผ่านเส้นทาง
npm/git/ClawHub เดียวกับ Plugin ของบุคคลที่สาม

ใน source checkout, OpenClaw ถือว่า repository เป็น pnpm monorepo หลังจาก
`pnpm install` แล้ว Plugin ที่ bundled จะโหลดจาก `extensions/<id>` เพื่อให้
workspace dependencies เฉพาะแพ็กเกจพร้อมใช้งานและรับการแก้ไขโดยตรง การพัฒนา
source checkout รองรับเฉพาะ pnpm เท่านั้น; `npm install` แบบธรรมดาที่ราก repository
ไม่ใช่วิธีที่รองรับในการเตรียมการพึ่งพาของ Plugin ที่ bundled

| รูปแบบการติดตั้ง                    | ตำแหน่ง Plugin ที่ bundled               | เจ้าของการพึ่งพา                                                     |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | แผนผังรันไทม์ที่ build แล้วภายในแพ็กเกจ | แพ็กเกจ OpenClaw และ flow การติดตั้ง/อัปเดต/doctor Plugin อย่างชัดเจน     |
| Git checkout plus `pnpm install` | แพ็กเกจ workspace `extensions/<id>`  | pnpm workspace รวมถึงการพึ่งพาของแต่ละแพ็กเกจ Plugin เอง |
| `openclaw plugins install ...`   | ราก Plugin npm/git/ClawHub ที่จัดการ   | flow การติดตั้ง/อัปเดต Plugin                                       |

## การล้าง legacy

OpenClaw เวอร์ชันเก่าสร้างรากการพึ่งพาของ bundled-plugin ตอนเริ่มต้นหรือ
ระหว่างการซ่อมด้วย doctor การล้างข้อมูลของ doctor ปัจจุบันจะลบไดเรกทอรีและ
symlink ที่ล้าสมัยเหล่านั้นเมื่อใช้ `--fix` รวมถึงราก `plugin-runtime-deps` เก่า
symlink แพ็กเกจ Node-prefix แบบ global ที่ชี้ไปยังเป้าหมาย `plugin-runtime-deps` ที่ถูกตัดออก
manifest `.openclaw-runtime-deps*`, `node_modules` ของ Plugin ที่สร้างขึ้น,
ไดเรกทอรี install stage และ pnpm store เฉพาะแพ็กเกจ postinstall แบบแพ็กเกจยังลบ
symlink แบบ global เหล่านั้นก่อนตัดรากเป้าหมาย legacy เพื่อให้การอัปเกรด
ไม่ทิ้ง import แพ็กเกจ ESM ที่ชี้ค้างไว้

เส้นทางเหล่านี้เป็นเพียงเศษตกค้างจาก legacy เท่านั้น การติดตั้งใหม่ไม่ควรสร้างสิ่งเหล่านี้
