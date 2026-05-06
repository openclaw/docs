---
read_when:
    - คุณกำลังดีบักการติดตั้งแพ็กเกจ Plugin
    - คุณกำลังเปลี่ยนพฤติกรรมการเริ่มต้น Plugin, การตรวจวินิจฉัย หรือการติดตั้งของตัวจัดการแพ็กเกจ
    - คุณกำลังดูแลการติดตั้ง OpenClaw แบบแพ็กเกจหรือ manifest ของ Plugin ที่รวมมาด้วย
sidebarTitle: Dependencies
summary: วิธีที่ OpenClaw ติดตั้งแพ็กเกจ Plugin และแก้ไขการพึ่งพาของ Plugin
title: การแก้ไขการขึ้นต่อกันของ Plugin
x-i18n:
    generated_at: "2026-05-06T09:24:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: e06f1fdc34c8392cbf0e399484fd59af11b9b7d73c5c7e68b3617a7cfd433a36
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# การแก้ไขการพึ่งพาของ Plugin

OpenClaw เก็บงานด้านการพึ่งพาของ Plugin ไว้ในช่วงติดตั้ง/อัปเดต การโหลดในรันไทม์
จะไม่เรียกใช้ตัวจัดการแพ็กเกจ ซ่อมแซมโครงสร้างการพึ่งพา หรือแก้ไขไดเรกทอรีแพ็กเกจของ OpenClaw

## การแบ่งความรับผิดชอบ

แพ็กเกจ Plugin เป็นเจ้าของกราฟการพึ่งพาของตนเอง:

- การพึ่งพาในรันไทม์อยู่ใน `dependencies` หรือ `optionalDependencies` ของแพ็กเกจ Plugin
- การนำเข้า SDK/core เป็น peer หรือการนำเข้าที่ OpenClaw จัดเตรียมให้
- Plugin สำหรับการพัฒนาในเครื่องนำการพึ่งพาที่ติดตั้งไว้แล้วของตนเองมาด้วย
- Plugin จาก npm และ git จะถูกติดตั้งลงในรากแพ็กเกจที่ OpenClaw เป็นเจ้าของ

OpenClaw เป็นเจ้าของเฉพาะวงจรชีวิตของ Plugin:

- ค้นพบแหล่งที่มาของ Plugin
- ติดตั้งหรืออัปเดตแพ็กเกจเมื่อมีการร้องขออย่างชัดเจน
- บันทึกเมตาดาต้าการติดตั้ง
- โหลด entrypoint ของ Plugin
- ล้มเหลวพร้อมข้อผิดพลาดที่ดำเนินการต่อได้เมื่อขาดการพึ่งพา

## รากการติดตั้ง

OpenClaw ใช้รากที่คงที่ต่อแหล่งที่มา:

- แพ็กเกจ npm ติดตั้งภายใต้ `~/.openclaw/npm`
- แพ็กเกจ git clone ภายใต้ `~/.openclaw/git`
- การติดตั้งแบบ local/path/archive จะถูกคัดลอกหรืออ้างอิงโดยไม่มีการซ่อมแซมการพึ่งพา

การติดตั้ง npm ทำงานในราก npm ด้วย:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` ใช้ราก npm ที่มีการจัดการเดียวกัน
สำหรับ tarball npm-pack ในเครื่อง OpenClaw อ่านเมตาดาต้า npm ของ tarball เพิ่มเข้าไป
ในรากที่มีการจัดการเป็นการพึ่งพา `file:` ที่คัดลอกไว้ เรียกใช้การติดตั้ง npm ตามปกติ
แล้วจึงตรวจสอบเมตาดาต้า lockfile ที่ติดตั้งก่อนเชื่อถือ Plugin
สิ่งนี้มีไว้สำหรับการพิสูจน์แบบ package-acceptance และ release-candidate ที่ artifact จากการ pack
ในเครื่องควรทำงานเหมือน artifact จาก registry ที่มันจำลอง

npm อาจ hoist การพึ่งพาทางอ้อมไปยัง `~/.openclaw/npm/node_modules` ข้างๆ
แพ็กเกจ Plugin OpenClaw จะสแกนราก npm ที่มีการจัดการก่อนเชื่อถือ
การติดตั้ง และใช้ npm เพื่อลบแพ็กเกจที่ npm จัดการระหว่าง uninstall ดังนั้น
การพึ่งพาในรันไทม์ที่ถูก hoist จะยังอยู่ภายในขอบเขตการล้างข้อมูลที่มีการจัดการ

Plugin ที่นำเข้า `openclaw/plugin-sdk/*` จะประกาศ `openclaw` เป็น peer
dependency OpenClaw ไม่ยอมให้ npm ติดตั้งสำเนาแยกของแพ็กเกจโฮสต์จาก registry
ลงในรากที่มีการจัดการ เพราะแพ็กเกจโฮสต์ที่ล้าสมัยอาจส่งผลต่อการแก้ไข peer ของ npm
ระหว่างการติดตั้ง Plugin ในภายหลัง แทนที่จะเป็นเช่นนั้น หลังจาก npm แก้ไขรากที่ใช้ร่วมกันเสร็จ
ระหว่าง install, update หรือ uninstall แล้ว OpenClaw จะยืนยันลิงก์ `node_modules/openclaw`
ภายใน Plugin อีกครั้งสำหรับแพ็กเกจที่ติดตั้งซึ่งประกาศ host peer

การติดตั้ง git จะ clone หรือรีเฟรช repository แล้วเรียกใช้:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

จากนั้น Plugin ที่ติดตั้งจะโหลดจากไดเรกทอรีแพ็กเกจนั้น ดังนั้นการแก้ไข package-local
และ parent `node_modules` จึงทำงานแบบเดียวกับแพ็กเกจ Node ปกติ

## Plugin ในเครื่อง

Plugin ในเครื่องถือเป็นไดเรกทอรีที่นักพัฒนาควบคุม OpenClaw จะไม่
เรียกใช้ `npm install`, `pnpm install` หรือซ่อมแซมการพึ่งพาให้ หาก Plugin
ในเครื่องมีการพึ่งพา ให้ติดตั้งใน Plugin นั้นก่อนโหลด

Plugin TypeScript ของบุคคลที่สามในเครื่องสามารถใช้เส้นทาง Jiti ฉุกเฉินได้ Plugin
JavaScript แบบแพ็กเกจและ Plugin ภายในที่มาพร้อมชุดติดตั้งจะโหลดผ่าน
import/require ดั้งเดิมแทน Jiti

## การเริ่มต้นและการโหลดซ้ำ

การเริ่มต้น Gateway และการโหลด config ซ้ำจะไม่ติดตั้งการพึ่งพาของ Plugin โดยจะอ่าน
บันทึกการติดตั้ง Plugin คำนวณ entrypoint แล้วโหลด

หากขาดการพึ่งพาในรันไทม์ Plugin จะโหลดไม่สำเร็จและข้อผิดพลาด
ควรชี้ผู้ปฏิบัติการไปยังวิธีแก้ไขที่ชัดเจน:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` สามารถล้างสถานะการพึ่งพาเดิมที่ OpenClaw สร้างขึ้น และกู้คืน
Plugin ที่ดาวน์โหลดได้ซึ่งหายไปจากบันทึกการติดตั้งในเครื่องเมื่อ config
อ้างอิงถึงมัน Doctor จะไม่ซ่อมแซมการพึ่งพาสำหรับ Plugin ในเครื่องที่ติดตั้งแล้ว

## Plugin ที่มาพร้อมชุดติดตั้ง

Plugin ขนาดเบาและสำคัญต่อ core จะถูกจัดส่งเป็นส่วนหนึ่งของ OpenClaw
Plugin เหล่านี้ควรไม่มีโครงสร้างการพึ่งพาในรันไทม์ที่หนัก หรือถูกย้ายออกไปเป็น
แพ็กเกจที่ดาวน์โหลดได้บน ClawHub/npm

สำหรับรายการที่สร้างขึ้นล่าสุดของ Plugin ที่จัดส่งในแพ็กเกจ core ติดตั้งจากภายนอก
หรือคงไว้เป็นซอร์สเท่านั้น โปรดดู [รายการสินค้าคงคลังของ Plugin](/th/plugins/plugin-inventory)

manifest ของ Plugin ที่มาพร้อมชุดติดตั้งต้องไม่ร้องขอการ staging การพึ่งพา ฟังก์ชันการทำงานของ
Plugin ที่มีขนาดใหญ่หรือเป็นทางเลือกควรถูกแพ็กเป็น Plugin ปกติและติดตั้งผ่าน
เส้นทาง npm/git/ClawHub เดียวกับ Plugin ของบุคคลที่สาม

ใน source checkout OpenClaw ถือว่า repository เป็น pnpm monorepo หลังจาก
`pnpm install` แล้ว Plugin ที่มาพร้อมชุดติดตั้งจะโหลดจาก `extensions/<id>` ดังนั้น
การพึ่งพาใน workspace ระดับ package-local จะพร้อมใช้งานและการแก้ไขจะถูกนำไปใช้โดยตรง
การพัฒนา source checkout รองรับเฉพาะ pnpm เท่านั้น; การใช้ `npm install` ธรรมดาที่ราก repository
ไม่ใช่วิธีที่รองรับสำหรับเตรียมการพึ่งพาของ Plugin ที่มาพร้อมชุดติดตั้ง

| รูปแบบการติดตั้ง                    | ตำแหน่ง Plugin ที่มาพร้อมชุดติดตั้ง               | เจ้าของการพึ่งพา                                                     |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | โครงสร้างรันไทม์ที่ build แล้วภายในแพ็กเกจ | แพ็กเกจ OpenClaw และโฟลว์ install/update/doctor ของ Plugin ที่ชัดเจน     |
| Git checkout บวก `pnpm install` | แพ็กเกจ workspace `extensions/<id>`  | pnpm workspace รวมถึงการพึ่งพาของแต่ละแพ็กเกจ Plugin เอง |
| `openclaw plugins install ...`   | ราก Plugin npm/git/ClawHub ที่มีการจัดการ   | โฟลว์ install/update ของ Plugin                                       |

## การล้างข้อมูลเดิม

OpenClaw รุ่นเก่าสร้างรากการพึ่งพาของ Plugin ที่มาพร้อมชุดติดตั้งตอนเริ่มต้นหรือ
ระหว่างการซ่อมแซมด้วย doctor การล้างข้อมูลของ doctor ปัจจุบันจะลบไดเรกทอรีและ
symlink ที่ค้างอยู่เหล่านั้นเมื่อใช้ `--fix` รวมถึงราก `plugin-runtime-deps` เก่า,
symlink แพ็กเกจ Node-prefix แบบ global ที่ชี้ไปยังเป้าหมาย `plugin-runtime-deps` ที่ถูก prune แล้ว,
manifest `.openclaw-runtime-deps*`, `node_modules` ของ Plugin ที่สร้างขึ้น,
ไดเรกทอรี stage การติดตั้ง และ store ของ pnpm ระดับ package-local postinstall ของแพ็กเกจยัง
ลบ symlink แบบ global เหล่านั้นก่อน prune รากเป้าหมายเดิม เพื่อให้การอัปเกรด
ไม่ทิ้งการนำเข้าแพ็กเกจ ESM ที่ค้างอยู่

เส้นทางเหล่านี้เป็นเพียงเศษตกค้างจากระบบเดิม การติดตั้งใหม่ไม่ควรสร้างเส้นทางเหล่านี้
