---
read_when:
    - คุณกำลังดีบักการติดตั้งแพ็กเกจ Plugin
    - คุณกำลังเปลี่ยนลักษณะการทำงานของการเริ่มต้น Plugin, doctor หรือการติดตั้งผ่านตัวจัดการแพ็กเกจ
    - คุณกำลังดูแลการติดตั้ง OpenClaw แบบแพ็กเกจหรือรายการกำกับ Plugin ที่บันเดิลมา
sidebarTitle: Dependencies
summary: OpenClaw ติดตั้งแพ็กเกจ Plugin และแก้ไขการพึ่งพาของ Plugin อย่างไร
title: การแก้ไขการขึ้นต่อกันของ Plugin
x-i18n:
    generated_at: "2026-07-04T15:40:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc6cc80bfe4e4c06ca0e99877c0d4148861ff88366ae233c254aac56c7cdf6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw คงงานด้านการพึ่งพาของ Plugin ไว้ในช่วงติดตั้ง/อัปเดต การโหลดขณะรันไทม์
จะไม่เรียกใช้ตัวจัดการแพ็กเกจ ซ่อมแซมแผนผังการพึ่งพา หรือแก้ไขไดเรกทอรี
แพ็กเกจของ OpenClaw

## การแบ่งความรับผิดชอบ

แพ็กเกจ Plugin เป็นเจ้าของกราฟการพึ่งพาของตนเอง:

- การพึ่งพาขณะรันไทม์อยู่ใน `dependencies` หรือ
  `optionalDependencies` ของแพ็กเกจ Plugin
- การนำเข้า SDK/core เป็น peer หรือการนำเข้าที่ OpenClaw จัดให้
- Plugin สำหรับการพัฒนาในเครื่องนำการพึ่งพาที่ติดตั้งไว้แล้วของตนเองมาใช้
- Plugin จาก npm และ git จะถูกติดตั้งลงในรากแพ็กเกจที่ OpenClaw เป็นเจ้าของ

OpenClaw เป็นเจ้าของเฉพาะวงจรชีวิตของ Plugin:

- ค้นพบแหล่งที่มาของ Plugin
- ติดตั้งหรืออัปเดตแพ็กเกจเมื่อมีการร้องขออย่างชัดเจน
- บันทึกเมตาดาต้าการติดตั้ง
- โหลดจุดเข้าใช้งานของ Plugin
- ล้มเหลวพร้อมข้อผิดพลาดที่ลงมือแก้ไขได้เมื่อการพึ่งพาขาดหาย

## รากการติดตั้ง

OpenClaw ใช้รากแบบคงที่ต่อแหล่งที่มา:

- แพ็กเกจ npm ติดตั้งลงในโปรเจกต์แยกต่อ Plugin ภายใต้
  `~/.openclaw/npm/projects/<encoded-package>`
- แพ็กเกจ git โคลนไว้ภายใต้ `~/.openclaw/git`
- การติดตั้งแบบ local/path/archive จะถูกคัดลอกหรืออ้างอิงโดยไม่ซ่อมแซมการพึ่งพา

การติดตั้ง npm รันในรากโปรเจกต์ต่อ Plugin นั้นด้วย:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` ใช้รากโปรเจกต์ npm ต่อ Plugin
เดียวกันนั้นสำหรับ tarball `npm-pack` ในเครื่อง OpenClaw อ่านเมตาดาต้า npm
ของ tarball เพิ่มมันเข้าไปในโปรเจกต์ที่จัดการอยู่ในฐานะการพึ่งพา `file:` ที่คัดลอกไว้ รัน
การติดตั้ง npm ปกติ แล้วจึงตรวจสอบเมตาดาต้า lockfile ที่ติดตั้งก่อน
เชื่อถือ Plugin
สิ่งนี้มีไว้สำหรับหลักฐาน package-acceptance และ release-candidate ที่
อาร์ติแฟกต์ pack ในเครื่องควรทำงานเหมือนอาร์ติแฟกต์ registry ที่มันจำลอง

ใช้ `npm-pack:` เมื่อทดสอบแพ็กเกจ Plugin ทางการหรือภายนอกก่อน
เผยแพร่ การติดตั้งแบบ archive หรือ path ดิบมีประโยชน์สำหรับการดีบักในเครื่อง แต่
ไม่ได้พิสูจน์เส้นทางการพึ่งพาเดียวกับแพ็กเกจ npm หรือ ClawHub ที่ติดตั้งแล้ว
`npm-pack:` พิสูจน์รูปแบบการติดตั้งแพ็กเกจที่จัดการอยู่; โดยตัวมันเอง
ไม่ได้เป็นหลักฐานว่า Plugin เป็นเนื้อหาทางการที่เชื่อมกับแค็ตตาล็อก

เมื่อพฤติกรรมขึ้นอยู่กับสถานะ Plugin ที่ bundled หรือ Plugin ทางการที่เชื่อถือได้ ให้จับคู่
หลักฐานแพ็กเกจในเครื่องกับการติดตั้งทางการที่อิงแค็ตตาล็อก หรือเส้นทางแพ็กเกจ
ที่เผยแพร่แล้วซึ่งบันทึกความเชื่อถือแบบทางการ การเข้าถึง helper ที่มีสิทธิ์พิเศษและ
การจัดการขอบเขต trusted-official ควรถูกตรวจสอบบนเส้นทางการติดตั้งที่เชื่อถือได้นั้น
ไม่ใช่อนุมานจากการติดตั้ง tarball ในเครื่อง

หาก Plugin ล้มเหลวขณะรันไทม์ด้วยการนำเข้าที่ขาดหาย ให้แก้ manifest ของแพ็กเกจ
แทนการซ่อมแซมโปรเจกต์ที่จัดการอยู่ด้วยมือ การนำเข้าขณะรันไทม์อยู่ใน
`dependencies` หรือ `optionalDependencies` ของแพ็กเกจ Plugin; `devDependencies` จะ
ไม่ถูกติดตั้งสำหรับโปรเจกต์รันไทม์ที่จัดการอยู่ การรัน `npm install` ในเครื่องภายใน
`~/.openclaw/npm/projects/<encoded-package>` อาจปลดบล็อกการวินิจฉัยชั่วคราวได้
แต่ไม่ใช่หลักฐาน package-acceptance เพราะการติดตั้งหรืออัปเดตครั้งถัดไปจะ
สร้างโปรเจกต์ใหม่จากเมตาดาต้าแพ็กเกจ

npm อาจ hoist การพึ่งพาทางอ้อมไปยัง `node_modules` ของโปรเจกต์ต่อ Plugin
ที่อยู่ข้างแพ็กเกจ Plugin OpenClaw สแกนรากโปรเจกต์ที่จัดการอยู่
ก่อนเชื่อถือการติดตั้ง และลบโปรเจกต์นั้นระหว่างการถอนการติดตั้ง ดังนั้น
การพึ่งพาขณะรันไทม์ที่ถูก hoist จะอยู่ภายในขอบเขตการล้างข้อมูลของ Plugin นั้น

แพ็กเกจ Plugin npm ที่เผยแพร่แล้วสามารถจัดส่ง `npm-shrinkwrap.json` ได้ npm ใช้
lockfile ที่เผยแพร่ได้นั้นระหว่างการติดตั้ง และรากโปรเจกต์ npm ที่ OpenClaw จัดการ
รองรับสิ่งนี้ผ่านเส้นทางการติดตั้ง npm ปกติ แพ็กเกจ Plugin ที่เผยแพร่ได้ซึ่ง
OpenClaw เป็นเจ้าของต้องมี shrinkwrap เฉพาะแพ็กเกจที่สร้างจากกราฟการพึ่งพา
ที่เผยแพร่แล้วของแพ็กเกจ Plugin นั้น:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

ตัวสร้างจะตัด `devDependencies` ของ Plugin ออก ใช้นโยบาย override ของ workspace
และเขียน `extensions/<id>/npm-shrinkwrap.json` สำหรับ Plugin แต่ละตัวที่
`publishToNpm` แพ็กเกจ Plugin บุคคลที่สามอาจจัดส่ง shrinkwrap ด้วยเช่นกัน;
OpenClaw ไม่บังคับใช้กับแพ็กเกจชุมชน แต่ npm จะเคารพมัน
เมื่อมีอยู่

ก่อนถือว่าแพ็กเกจในเครื่องเป็นหลักฐาน release-candidate ให้ตรวจสอบ tarball
ที่จะถูกติดตั้ง:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

สำหรับการเปลี่ยนแปลงการพึ่งพา ให้ตรวจสอบด้วยว่าการติดตั้ง production สามารถ resolve
แพ็กเกจรันไทม์ได้โดยไม่มีการพึ่งพาสำหรับพัฒนา:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

แพ็กเกจ Plugin npm ที่ OpenClaw เป็นเจ้าของยังสามารถเผยแพร่พร้อม
`bundledDependencies` ที่ชัดเจนได้ เส้นทางการเผยแพร่ npm จะ overlay รายชื่อ
การพึ่งพาขณะรันไทม์ ลบเมตาดาต้า workspace ที่ใช้เฉพาะการพัฒนาออกจาก manifest
ของแพ็กเกจที่เผยแพร่ รันการติดตั้ง npm แบบไม่มีสคริปต์สำหรับการพึ่งพาขณะรันไทม์
เฉพาะแพ็กเกจ แล้วจึง pack หรือเผยแพร่ tarball ของ Plugin พร้อมไฟล์การพึ่งพาเหล่านั้น
รวมอยู่ด้วย แพ็กเกจที่ใช้ native หนัก รวมถึงรันไทม์ Codex และ ACP เลือกไม่ใช้
ด้วย `openclaw.release.bundleRuntimeDependencies: false`; แพ็กเกจเหล่านั้นยังคง
จัดส่ง shrinkwrap ของตน แต่ npm จะ resolve การพึ่งพาขณะรันไทม์ระหว่างการติดตั้ง
แทนการฝัง binary ของทุกแพลตฟอร์มไว้ใน tarball ของ Plugin แพ็กเกจราก
`openclaw` ไม่ bundle แผนผังการพึ่งพาทั้งหมดของตน

Plugin ที่นำเข้า `openclaw/plugin-sdk/*` ประกาศ `openclaw` เป็น peer
dependency OpenClaw ไม่อนุญาตให้ npm ติดตั้งสำเนาแพ็กเกจ host แยกจาก registry
เข้าไปในโปรเจกต์ที่จัดการอยู่ เพราะแพ็กเกจ host ที่ล้าสมัยอาจมีผลต่อการ resolve peer ของ npm
ภายใน Plugin นั้น การติดตั้ง npm ที่จัดการอยู่จะข้ามการ resolve/materialization peer ของ npm
และ OpenClaw จะยืนยันลิงก์ `node_modules/openclaw` เฉพาะ Plugin อีกครั้ง
สำหรับแพ็กเกจที่ติดตั้งแล้วซึ่งประกาศ host peer หลังติดตั้งหรืออัปเดต

การติดตั้ง git จะโคลนหรือรีเฟรช repository แล้วรัน:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

จากนั้น Plugin ที่ติดตั้งแล้วจะโหลดจากไดเรกทอรีแพ็กเกจนั้น ดังนั้นการ resolve
`node_modules` เฉพาะแพ็กเกจและ parent จะทำงานแบบเดียวกับแพ็กเกจ
Node ปกติ

## Plugin ในเครื่อง

Plugin ในเครื่องถูกถือว่าเป็นไดเรกทอรีที่นักพัฒนาควบคุม OpenClaw จะไม่
รัน `npm install`, `pnpm install` หรือซ่อมแซมการพึ่งพาให้ หาก Plugin ในเครื่อง
มีการพึ่งพา ให้ติดตั้งใน Plugin นั้นก่อนโหลด

Plugin TypeScript บุคคลที่สามในเครื่องสามารถใช้เส้นทาง Jiti ฉุกเฉินได้ Plugin
JavaScript แบบแพ็กเกจและ Plugin ภายในที่ bundled จะโหลดผ่าน
import/require แบบ native แทน Jiti

## การเริ่มต้นและการโหลดซ้ำ

การเริ่มต้น Gateway และการโหลด config ซ้ำจะไม่ติดตั้งการพึ่งพาของ Plugin พวกมันอ่าน
ระเบียนการติดตั้ง Plugin คำนวณจุดเข้าใช้งาน และโหลดมัน

หากการพึ่งพาขาดหายขณะรันไทม์ Plugin จะโหลดไม่สำเร็จ และข้อผิดพลาด
ควรชี้ผู้ปฏิบัติงานไปยังวิธีแก้ไขที่ชัดเจน:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` สามารถล้างสถานะการพึ่งพา legacy ที่ OpenClaw สร้างขึ้น และกู้คืน
Plugin ที่ดาวน์โหลดได้ซึ่งขาดหายจากระเบียนการติดตั้งในเครื่องเมื่อ config
อ้างอิงถึงพวกมัน Doctor จะไม่ซ่อมแซมการพึ่งพาสำหรับ Plugin ในเครื่องที่ติดตั้งแล้ว

## Plugin ที่ bundled

Plugin ที่เบาและสำคัญต่อ core จะถูกจัดส่งเป็นส่วนหนึ่งของ OpenClaw
พวกมันควรไม่มีแผนผังการพึ่งพาขณะรันไทม์ที่หนัก หรือถูกย้ายออกไปเป็น
แพ็กเกจที่ดาวน์โหลดได้บน ClawHub/npm

สำหรับรายชื่อ Plugin ที่สร้างล่าสุดซึ่งจัดส่งในแพ็กเกจ core, ติดตั้ง
ภายนอก, หรือคงเป็น source-only โปรดดู [บัญชีรายการ Plugin](/th/plugins/plugin-inventory)

manifest ของ Plugin ที่ bundled ต้องไม่ร้องขอ dependency staging ฟังก์ชันของ
Plugin ที่ใหญ่หรือเป็นทางเลือกควรถูกแพ็กเป็น Plugin ปกติและติดตั้งผ่าน
เส้นทาง npm/git/ClawHub เดียวกับ Plugin บุคคลที่สาม

ใน source checkout, OpenClaw ถือว่า repository เป็น pnpm monorepo หลังจาก
`pnpm install`, Plugin ที่ bundled จะโหลดจาก `extensions/<id>` เพื่อให้การพึ่งพา
workspace เฉพาะแพ็กเกจพร้อมใช้งานและการแก้ไขถูกนำมาใช้โดยตรง การพัฒนาใน
source checkout เป็น pnpm-only; การรัน `npm install` ธรรมดาที่ราก repository
ไม่ใช่วิธีที่รองรับสำหรับเตรียมการพึ่งพาของ Plugin ที่ bundled

| รูปแบบการติดตั้ง                    | ตำแหน่ง Plugin ที่ bundled               | เจ้าของการพึ่งพา                                                     |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | แผนผังรันไทม์ที่ build แล้วภายในแพ็กเกจ | แพ็กเกจ OpenClaw และ flow ติดตั้ง/อัปเดต/doctor Plugin ที่ชัดเจน     |
| Git checkout plus `pnpm install` | แพ็กเกจ workspace `extensions/<id>`  | pnpm workspace รวมถึงการพึ่งพาของแพ็กเกจ Plugin แต่ละตัว |
| `openclaw plugins install ...`   | ราก npm project/git/ClawHub ที่จัดการอยู่  | flow ติดตั้ง/อัปเดต Plugin                                       |

## การล้าง legacy

OpenClaw เวอร์ชันเก่าสร้างรากการพึ่งพาของ Plugin ที่ bundled ตอนเริ่มต้นหรือ
ระหว่างการซ่อมด้วย doctor การล้างของ doctor ปัจจุบันจะลบไดเรกทอรีและ
symlink ที่ล้าสมัยเหล่านั้นเมื่อใช้ `--fix` รวมถึงราก `plugin-runtime-deps` เก่า,
symlink แพ็กเกจ Node-prefix ส่วนกลางที่ชี้ไปยังเป้าหมาย `plugin-runtime-deps` ที่ถูกตัดออก,
manifest `.openclaw-runtime-deps*`, `node_modules` ของ Plugin ที่สร้างขึ้น,
ไดเรกทอรีขั้นตอนการติดตั้ง และ store pnpm เฉพาะแพ็กเกจ postinstall ของแพ็กเกจยัง
ลบ symlink ส่วนกลางเหล่านั้นก่อนตัดรากเป้าหมาย legacy เพื่อให้การอัปเกรด
ไม่ทิ้งการนำเข้าแพ็กเกจ ESM ที่ห้อยอยู่

การติดตั้ง npm รุ่นเก่ายังใช้ราก `~/.openclaw/npm/node_modules` แบบใช้ร่วมกันด้วย
flow ติดตั้ง, อัปเดต, ถอนการติดตั้ง และ doctor ปัจจุบันยังคงรู้จักราก flat legacy นั้น
เฉพาะสำหรับการกู้คืนและการล้างเท่านั้น การติดตั้ง npm ใหม่ควรสร้าง
รากโปรเจกต์ต่อ Plugin แทน
