---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin สำหรับ Gateway หรือชุดรวมที่เข้ากันได้
    - คุณต้องการสร้างโครงเริ่มต้นหรือตรวจสอบ Plugin เครื่องมือแบบง่าย
    - คุณต้องการดีบักข้อผิดพลาดในการโหลด Plugin
sidebarTitle: Plugins
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw plugins` (เริ่มต้น, สร้าง, ตรวจสอบความถูกต้อง, แสดงรายการ, ติดตั้ง, มาร์เก็ตเพลส, ถอนการติดตั้ง, เปิด/ปิดใช้งาน, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-07-16T18:57:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dadc182cd931672d98c3d1c6ddc1f1defdf0384b25feff7bd4b5324a7fc2e26c
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Plugin ของ Gateway, ชุด Hook และบันเดิลที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="ระบบ Plugin" href="/th/tools/plugin">
    คู่มือผู้ใช้สำหรับการติดตั้ง การเปิดใช้งาน และการแก้ไขปัญหา Plugin
  </Card>
  <Card title="จัดการ Plugin" href="/th/plugins/manage-plugins">
    ตัวอย่างสั้นๆ สำหรับการติดตั้ง แสดงรายการ อัปเดต ถอนการติดตั้ง และเผยแพร่
  </Card>
  <Card title="บันเดิล Plugin" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของบันเดิล
  </Card>
  <Card title="ไฟล์ Manifest ของ Plugin" href="/th/plugins/manifest">
    ฟิลด์ของไฟล์ Manifest และสคีมาการกำหนดค่า
  </Card>
  <Card title="ความปลอดภัย" href="/th/gateway/security">
    การเสริมความปลอดภัยสำหรับการติดตั้ง Plugin
  </Card>
</CardGroup>

## คำสั่ง

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # นามแฝงของ inspect
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id> [--dry-run] [--keep-files] [--force]
openclaw plugins update <id-or-npm-spec> | --all [--dry-run]
openclaw plugins registry [--refresh] [--json]
openclaw plugins doctor
openclaw plugins init <id> [--name <name>] [--type tool|provider] [--directory <path>]
openclaw plugins build [--entry <path>] [--check]
openclaw plugins validate [--entry <path>]
openclaw plugins marketplace entries [--offline] [--feed-profile <name>] [--json]
openclaw plugins marketplace list <source> [--json]
openclaw plugins marketplace refresh [--feed-profile <name>] [--expected-sha256 <sha256>] [--json]
```

เมื่อตรวจสอบการติดตั้ง การตรวจสอบ การถอนการติดตั้ง หรือการรีเฟรชรีจิสทรีที่ทำงานช้า ให้เรียกใช้
คำสั่งพร้อม `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` การติดตามจะเขียนเวลาของแต่ละเฟส
ไปยัง stderr และยังคงให้เอาต์พุต JSON แยกวิเคราะห์ได้ ดู [การดีบัก](/th/help/debugging#plugin-lifecycle-trace)

<Note>
ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) นั้น `openclaw.json` เปลี่ยนแปลงไม่ได้ `install`, `update`, `uninstall`, `enable` และ `disable` จะปฏิเสธการทำงานทั้งหมด ให้แก้ไขซอร์ส Nix สำหรับการติดตั้งนี้แทน (`programs.openclaw.config` หรือ `instances.<name>.config` สำหรับ nix-openclaw) แล้วสร้างใหม่ ดู [เริ่มต้นอย่างรวดเร็ว](https://github.com/openclaw/nix-openclaw#quick-start) ที่เน้น Agent เป็นหลัก
</Note>

<Note>
Plugin ที่รวมมากับระบบจัดส่งพร้อม OpenClaw บางรายการเปิดใช้งานตามค่าเริ่มต้น (เช่น ผู้ให้บริการโมเดลที่รวมมากับระบบ ผู้ให้บริการเสียงพูดที่รวมมากับระบบ และ Plugin เบราว์เซอร์ที่รวมมากับระบบ) ส่วนรายการอื่นต้องใช้ `plugins enable`

Plugin ดั้งเดิมของ OpenClaw จัดส่ง `openclaw.plugin.json` พร้อม JSON Schema แบบอินไลน์ (`configSchema` แม้จะว่างเปล่า) ส่วนบันเดิลที่เข้ากันได้จะใช้ไฟล์ Manifest ของบันเดิลตนเองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุตรายการ/ข้อมูลแบบละเอียดจะแสดงประเภทย่อยของบันเดิลด้วย (`codex`, `claude` หรือ `cursor`) พร้อมความสามารถของบันเดิลที่ตรวจพบ
</Note>

## การสร้าง

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

ตามค่าเริ่มต้น `plugins init` จะสร้าง Plugin เครื่องมือ TypeScript ขั้นต่ำ อาร์กิวเมนต์แรก
คือรหัส Plugin ส่วน `--name` กำหนดชื่อที่ใช้แสดง OpenClaw ใช้
รหัสสำหรับไดเรกทอรีเอาต์พุตเริ่มต้นและการตั้งชื่อแพ็กเกจ โครงเริ่มต้นของเครื่องมือใช้
`defineToolPlugin` และสร้างสคริปต์ `package.json` ได้แก่ `plugin:build` และ
`plugin:validate` ซึ่งจะสร้างก่อน แล้วจึงเรียก `openclaw plugins build`/`validate`

`plugins build` นำเข้าจุดเริ่มต้นที่สร้างแล้ว อ่านเมทาดาทาแบบคงที่ของเครื่องมือ เขียน
`openclaw.plugin.json` และทำให้ `openclaw.extensions` ของ `package.json` สอดคล้องกัน
`plugins validate` ตรวจสอบว่าไฟล์ Manifest ที่สร้างขึ้น เมทาดาทาของแพ็กเกจ และ
การส่งออกของจุดเริ่มต้นปัจจุบันยังคงตรงกัน ดูขั้นตอนการสร้างฉบับเต็มที่ [Plugin เครื่องมือ](/th/plugins/tool-plugins)

โครงเริ่มต้นจะเขียนซอร์ส TypeScript แต่สร้างเมทาดาทาจากจุดเริ่มต้น
`./dist/index.js` ที่สร้างแล้ว ดังนั้นเวิร์กโฟลว์นี้จึงทำงานร่วมกับ CLI ที่เผยแพร่แล้วได้ด้วย ใช้
`--entry <path>` เมื่อจุดเริ่มต้นไม่ใช่จุดเริ่มต้นเริ่มต้นของแพ็กเกจ ใช้
`plugins build --check` ใน CI เพื่อให้ล้มเหลวเมื่อเมทาดาทาที่สร้างขึ้นล้าสมัยโดยไม่
เขียนไฟล์ใหม่

### โครงเริ่มต้นของผู้ให้บริการ

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

โครงเริ่มต้นของผู้ให้บริการจะสร้าง Plugin ผู้ให้บริการโมเดลทั่วไปที่เข้ากันได้กับ OpenAI
พร้อมระบบรับรองความถูกต้องด้วยคีย์ API, สคริปต์ `npm run validate` ที่เรียกใช้
`clawhub package validate`, เมทาดาทาแพ็กเกจ ClawHub และเวิร์กโฟลว์ GitHub Actions ที่
สั่งทำงานด้วยตนเองสำหรับการเผยแพร่ที่เชื่อถือได้ผ่าน GitHub
OIDC ในอนาคต โครงเริ่มต้นของผู้ให้บริการไม่สร้าง Skills และไม่ใช้
`openclaw plugins build`/`validate` คำสั่งเหล่านั้นมีไว้สำหรับเส้นทางเมทาดาทาที่สร้างขึ้น
ของโครงเริ่มต้นเครื่องมือ

ก่อนเผยแพร่ ให้แทนที่ URL ฐานของ API ชั่วคราว แค็ตตาล็อกโมเดล เส้นทางเอกสาร
ข้อความข้อมูลประจำตัว และเนื้อหา README ด้วยรายละเอียดจริงของผู้ให้บริการ ใช้
README ที่สร้างขึ้นสำหรับการเผยแพร่ ClawHub ครั้งแรกและการตั้งค่าผู้เผยแพร่ที่เชื่อถือได้

## การติดตั้ง

```bash
openclaw plugins search "calendar"                      # ค้นหา Plugin ใน ClawHub
openclaw plugins install @openclaw/<package>            # แค็ตตาล็อกทางการที่เชื่อถือได้
openclaw plugins install <package>                       # แพ็กเกจ npm ใดก็ได้
openclaw plugins install clawhub:<package>                # ClawHub เท่านั้น
openclaw plugins install npm:<package>                    # npm เท่านั้น
openclaw plugins install npm-pack:<path.tgz>               # ไฟล์ tarball ของ npm-pack ภายในเครื่อง
openclaw plugins install git:github.com/<owner>/<repo>     # ที่เก็บ git
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # พาธหรือไฟล์เก็บถาวรภายในเครื่อง
openclaw plugins install -l <path>                         # ลิงก์แทนการคัดลอก
openclaw plugins install <plugin>@<marketplace>             # รูปแบบย่อของ Marketplace
openclaw plugins install <plugin> --marketplace <name>      # Marketplace (ระบุชัดเจน)
openclaw plugins install <package> --force                  # ยืนยันแหล่งที่มา / เขียนทับรายการที่มีอยู่
openclaw plugins install <package> --pin                    # ตรึงเวอร์ชัน npm ที่แก้ไขค่าแล้ว
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

ผู้ดูแลที่ทดสอบการติดตั้งระหว่างการตั้งค่าสามารถแทนที่แหล่งติดตั้ง Plugin อัตโนมัติ
ด้วยตัวแปรสภาพแวดล้อมที่มีการป้องกัน ดู
[การแทนที่แหล่งติดตั้ง Plugin](/th/plugins/install-overrides)

<Warning>
ในช่วงเปลี่ยนผ่านการเปิดตัว ชื่อแพ็กเกจเปล่าจะติดตั้งจาก npm ตามค่าเริ่มต้น เว้นแต่จะตรงกับรหัส Plugin ที่รวมมากับระบบหรือรหัส Plugin ทางการ ซึ่งในกรณีนั้น OpenClaw จะใช้สำเนาภายในเครื่อง/ทางการแทนการเข้าถึงรีจิสทรี npm ใช้ `npm:<package>` เมื่อจงใจต้องการแพ็กเกจ npm ภายนอกแทน ใช้ `clawhub:<package>` สำหรับ ClawHub ให้ถือว่าการติดตั้ง Plugin เทียบเท่ากับการเรียกใช้โค้ด และควรเลือกใช้เวอร์ชันที่ตรึงไว้
</Warning>

<Warning>
แพ็กเกจ ClawHub และแค็ตตาล็อกที่รวมมากับระบบ/ทางการของ OpenClaw เป็นแหล่งติดตั้ง
ที่เชื่อถือได้ แหล่ง npm ใหม่ที่กำหนดเอง, `npm-pack:`, git, พาธ/ไฟล์เก็บถาวรภายในเครื่อง หรือ
Marketplace จะแสดงคำเตือนและขอการยืนยันก่อนดำเนินการต่อ การติดตั้งจากแหล่งที่กำหนดเองแบบ
ไม่โต้ตอบต้องส่ง `--force` หลังจากตรวจสอบและเชื่อถือแหล่งที่มาแล้ว แฟล็กเดียวกันนี้
จะเขียนทับเป้าหมายการติดตั้งที่มีอยู่เมื่อจำเป็น การอัปเดตปกติของการติดตั้งที่ติดตามอยู่แล้ว
ไม่จำเป็นต้องใช้แฟล็กนี้ การยืนยันนี้แยกจาก
`--acknowledge-clawhub-risk` ซึ่งใช้เฉพาะกับคำเตือนด้านความเชื่อถือของรุ่น ClawHub ที่มีความเสี่ยง
`--force` ไม่ข้าม `security.installPolicy` หรือการตรวจสอบความปลอดภัยในการติดตั้ง
ที่เหลือ
</Warning>

`plugins search` ค้นหาแพ็กเกจ `code-plugin` และ
`bundle-plugin` ที่ติดตั้งได้จาก ClawHub (ไม่ใช่ Skills ให้ใช้ `openclaw skills search` สำหรับรายการเหล่านั้น)
ค่าเริ่มต้นของ `--limit` คือ 20 โดยจำกัดสูงสุดที่ 100 คำสั่งนี้อ่านเฉพาะแค็ตตาล็อกจากระยะไกล โดยไม่มี
การตรวจสอบสถานะภายในเครื่อง การแก้ไขการกำหนดค่า การติดตั้งแพ็กเกจ หรือการโหลดรันไทม์
ของ Plugin ผลลัพธ์ประกอบด้วยชื่อแพ็กเกจ ClawHub ตระกูล ช่องทาง เวอร์ชัน
สรุป และคำแนะนำการติดตั้ง เช่น `openclaw plugins install clawhub:<package>`

<Note>
ClawHub เป็นช่องทางหลักในการเผยแพร่และค้นหา Plugin ส่วนใหญ่ Npm
ยังคงรองรับในฐานะทางเลือกสำรองและเส้นทางการติดตั้งโดยตรง แพ็กเกจ Plugin
`@openclaw/*` ที่ OpenClaw เป็นเจ้าของได้รับการเผยแพร่บน npm อีกครั้ง ดูรายการปัจจุบัน
ที่ [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) หรือ
[รายการ Plugin](/th/plugins/plugin-inventory) การติดตั้งแบบเสถียรใช้ `latest`
การติดตั้งและอัปเดตผ่านช่องทางเบต้าจะเลือก dist-tag `beta` ของ npm ก่อนเมื่อมี
และใช้ `latest` เป็นทางเลือกสำรอง ในช่องทางเสถียรแบบขยาย Plugin npm ทางการ
ที่มีเจตนาเป็นค่าเปล่า/ค่าเริ่มต้นหรือ `latest` จะถูกแก้ไขเป็นเวอร์ชัน Core ที่ติดตั้งอยู่
อย่างตรงกัน การตรึงเวอร์ชันแบบแน่นอนและแท็กที่ไม่ใช่ `latest` ซึ่งระบุอย่างชัดเจน แพ็กเกจของบุคคลที่สาม และ
แหล่งที่ไม่ใช่ npm จะไม่ถูกเขียนใหม่
</Note>

<AccordionGroup>
  <Accordion title="การรวมการกำหนดค่าและการซ่อมแซมการกำหนดค่าที่ไม่ถูกต้อง">
    หากส่วน `plugins` มี `$include` แบบไฟล์เดียวรองรับอยู่ `plugins install/update/enable/disable/uninstall` จะเขียนผ่านไปยังไฟล์ที่รวมไว้นั้น และปล่อย `openclaw.json` ไว้โดยไม่แก้ไข การรวมระดับราก อาร์เรย์การรวม และการรวมที่มีการแทนที่ระดับเดียวกันจะล้มเหลวแบบปิดแทนการทำให้แบนราบ ดูรูปแบบที่รองรับได้ที่ [การรวมการกำหนดค่า](/th/gateway/configuration)

    หากการกำหนดค่าไม่ถูกต้องระหว่างการติดตั้ง โดยปกติ `plugins install` จะล้มเหลวแบบปิดและแจ้งให้เรียกใช้ `openclaw doctor --fix` ก่อน ระหว่างการเริ่มทำงานและการโหลดซ้ำแบบทันทีของ Gateway การกำหนดค่า Plugin ที่ไม่ถูกต้องจะล้มเหลวแบบปิดเช่นเดียวกับการกำหนดค่าอื่นที่ไม่ถูกต้อง โดย `openclaw doctor --fix` สามารถกักรายการ Plugin ที่ไม่ถูกต้องได้ ข้อยกเว้นระหว่างการติดตั้งที่มีการบันทึกไว้เพียงกรณีเดียวคือเส้นทางการกู้คืนแบบจำกัดสำหรับ Plugin ที่รวมมากับระบบ ซึ่งเลือกใช้ `openclaw.install.allowInvalidConfigRecovery` อย่างชัดเจน

  </Accordion>
  <Accordion title="การยืนยันด้วย --force และการติดตั้งซ้ำเทียบกับการอัปเดต">
    `--force` ยืนยันแหล่งที่ไม่ใช่ ClawHub โดยไม่แสดงคำถาม ไม่ได้ข้าม `security.installPolicy` หรือการตรวจสอบความปลอดภัยในการติดตั้งที่เหลือ เมื่อ Plugin หรือชุด Hook ติดตั้งอยู่แล้ว คำสั่งนี้จะใช้เป้าหมายเดิมซ้ำและเขียนทับในตำแหน่งเดิมด้วย ใช้หลังจากตรวจสอบแหล่ง npm, ภายในเครื่อง, ไฟล์เก็บถาวร, git หรือ Marketplace ที่กำหนดเอง หรือเมื่อตั้งใจติดตั้งรหัสเดิมซ้ำ สำหรับการอัปเกรดตามปกติของ Plugin npm ที่ติดตามอยู่แล้ว ควรใช้ `openclaw plugins update <id-or-npm-spec>`

    หากเรียกใช้ `plugins install` สำหรับรหัส Plugin ที่ติดตั้งอยู่แล้ว OpenClaw จะหยุดและแนะนำให้ใช้ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดปกติ หรือใช้ `plugins install <package> --force` เมื่อต้องการเขียนทับการติดตั้งปัจจุบันจากแหล่งอื่นจริงๆ แหล่งที่กำหนดเองยังคงแสดงคำเตือนที่มาที่มาแบบโต้ตอบ ส่วนการติดตั้งแบบไม่โต้ตอบต้องส่ง `--force` หลังการตรวจสอบ แหล่ง ClawHub และแค็ตตาล็อก OpenClaw ที่เชื่อถือได้ไม่จำเป็นต้องใช้แฟล็กนี้ เมื่อใช้ `--link` นั้น `--force` จะยืนยันแหล่งที่มา แต่ไม่เปลี่ยนโหมดการติดตั้งแบบพาธที่ลิงก์ไว้

  </Accordion>
  <Accordion title="ขอบเขตของ --pin">
    `--pin` ใช้กับการติดตั้ง npm เท่านั้นและบันทึก `<name>@<version>` แบบแน่นอนที่แก้ไขค่าแล้ว ไม่รองรับการติดตั้งด้วย `git:` (ให้ตรึง ref ในข้อมูลจำเพาะแทน เช่น `git:github.com/acme/plugin@v1.2.3`) หรือด้วย `--marketplace` (การติดตั้งจาก Marketplace จะเก็บเมทาดาทาแหล่งที่มาของ Marketplace แทนข้อมูลจำเพาะ npm)
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` เลิกแนะนำให้ใช้แล้วและขณะนี้ไม่ดำเนินการใดๆ OpenClaw ไม่เรียกใช้การบล็อกโค้ดอันตรายขณะติดตั้งแบบในตัวสำหรับการติดตั้ง Plugin อีกต่อไป

    ใช้พื้นผิว `security.installPolicy` ที่ผู้ดำเนินการเป็นเจ้าของเมื่อต้องใช้นโยบายการติดตั้งเฉพาะโฮสต์ ฮุก `before_install` ของ Plugin เป็นฮุกวงจรชีวิตของรันไทม์ Plugin ไม่ใช่ขอบเขตนโยบายหลักสำหรับการติดตั้งผ่าน CLI

    หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกซ่อนหรือบล็อกโดยการสแกนรีจิสทรี ให้ทำตามขั้นตอนสำหรับผู้เผยแพร่ใน [การเผยแพร่บน ClawHub](/th/clawhub/publishing) `--dangerously-force-unsafe-install` จะไม่ขอให้ ClawHub สแกน Plugin อีกครั้งหรือทำให้รุ่นที่ถูกบล็อกเป็นสาธารณะ

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    การติดตั้งจาก ClawHub ชุมชนจะตรวจสอบระเบียนความน่าเชื่อถือของรุ่นที่เลือกก่อนดาวน์โหลด หาก ClawHub ปิดใช้งานการดาวน์โหลดสำหรับรุ่นนั้น รายงานผลการสแกนว่าพบอันตราย หรือกำหนดให้รุ่นอยู่ในสถานะการกลั่นกรองที่บล็อกการใช้งาน (ถูกกักกัน ถูกเพิกถอน) OpenClaw จะปฏิเสธโดยเด็ดขาดไม่ว่าจะใช้แฟล็กนี้หรือไม่ สำหรับสถานะการสแกนที่มีความเสี่ยงหรือสถานะการกลั่นกรองที่ไม่บล็อก OpenClaw จะแสดงรายละเอียดความน่าเชื่อถือและขอการยืนยันก่อนดำเนินการต่อ

    ใช้ `--acknowledge-clawhub-risk` เฉพาะหลังจากตรวจสอบคำเตือนจาก ClawHub และตัดสินใจดำเนินการต่อโดยไม่มีพรอมต์แบบโต้ตอบ ผลการสแกนที่รอดำเนินการหรือล้าสมัย (ยังไม่ผ่านการตรวจสอบว่าปลอดภัย) จะแสดงคำเตือนแต่ไม่ต้องการการยอมรับ แพ็กเกจ ClawHub อย่างเป็นทางการและแหล่งที่มาของ Plugin OpenClaw ที่รวมมาในชุดจะข้ามการตรวจสอบความน่าเชื่อถือของรุ่นนี้ทั้งหมด

  </Accordion>
  <Accordion title="แพ็กฮุกและข้อกำหนด npm">
    `plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับแพ็กฮุกที่เปิดเผย `openclaw.hooks` ใน `package.json` ใช้ `openclaw hooks` สำหรับการมองเห็นฮุกแบบกรองและการเปิดใช้งานรายฮุก ไม่ใช่สำหรับการติดตั้งแพ็กเกจ

    ข้อกำหนด npm รองรับ **เฉพาะรีจิสทรี** (ชื่อแพ็กเกจพร้อม **เวอร์ชันที่แน่นอน** หรือ **dist-tag** ซึ่งเป็นตัวเลือก) ข้อกำหนด Git/URL/ไฟล์และช่วง semver จะถูกปฏิเสธ การติดตั้งการขึ้นต่อกันจะทำงานในโปรเจกต์ npm ที่จัดการหนึ่งโปรเจกต์ต่อ Plugin พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้ว่าเชลล์ของคุณจะมีการตั้งค่าการติดตั้ง npm ส่วนกลางก็ตาม โปรเจกต์ npm ของ Plugin ที่จัดการจะสืบทอด `overrides` ระดับแพ็กเกจ npm ของ OpenClaw ดังนั้นการตรึงด้านความปลอดภัยของโฮสต์จึงมีผลกับการขึ้นต่อกันของ Plugin ที่ถูกยกระดับขึ้นมาด้วย

    ใช้ `npm:<package>` เพื่อระบุการแก้ไข npm อย่างชัดเจน ข้อกำหนดแพ็กเกจเปล่าจะติดตั้งโดยตรงจาก npm ระหว่างการเปลี่ยนผ่านช่วงเปิดตัวด้วย เว้นแต่จะตรงกับรหัส Plugin อย่างเป็นทางการ

    ข้อกำหนด `@openclaw/*` แบบดิบที่ตรงกับ Plugin ที่รวมมาในชุดจะถูกแก้ไขไปยังสำเนาที่รวมมาในชุดซึ่งอิมเมจเป็นเจ้าของก่อนใช้ทางเลือกสำรอง npm ตัวอย่างเช่น `openclaw plugins install @openclaw/discord@2026.5.20 --pin` จะใช้ Plugin Discord ที่รวมมาในชุดจากบิลด์ OpenClaw ปัจจุบันแทนการสร้างการแทนที่ npm ที่จัดการ หากต้องการบังคับใช้แพ็กเกจ npm ภายนอก ให้ใช้ `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`

    ข้อกำหนดเปล่าและ `@latest` จะคงอยู่ในแทร็กเสถียร เวอร์ชันแก้ไขของ OpenClaw ที่ประทับวันที่ เช่น `2026.5.3-1` จะถือว่าเสถียรสำหรับการตรวจสอบนี้ หาก npm แก้ไขรูปแบบใดรูปแบบหนึ่งไปเป็นรุ่นก่อนเผยแพร่ OpenClaw จะหยุดและขอให้คุณเลือกเข้าร่วมอย่างชัดเจนด้วยแท็กรุ่นก่อนเผยแพร่ (`@beta`/`@rc`) หรือเวอร์ชันก่อนเผยแพร่ที่แน่นอน (`@1.2.3-beta.4`)

    สำหรับการติดตั้ง npm ที่ไม่มีเวอร์ชันแน่นอน (`npm:<package>` หรือ `npm:<package>@latest`) OpenClaw จะตรวจสอบข้อมูลเมตาของแพ็กเกจที่แก้ไขได้ก่อนติดตั้ง หากแพ็กเกจเสถียรล่าสุดต้องใช้ API ของ Plugin OpenClaw ที่ใหม่กว่า หรือเวอร์ชันโฮสต์ขั้นต่ำที่ใหม่กว่า OpenClaw จะตรวจสอบเวอร์ชันเสถียรก่อนหน้าและติดตั้งรุ่นที่ใหม่ที่สุดซึ่งเข้ากันได้แทน เวอร์ชันที่แน่นอนและ dist-tag ที่ระบุชัดเจนยังคงเข้มงวด: การเลือกที่เข้ากันไม่ได้จะล้มเหลวและขอให้คุณอัปเกรด OpenClaw หรือเลือกเวอร์ชันที่เข้ากันได้

    หากข้อกำหนดการติดตั้งแบบเปล่าตรงกับรหัส Plugin อย่างเป็นทางการ (ตัวอย่างเช่น `diffs`) OpenClaw จะติดตั้งรายการในแค็ตตาล็อกโดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่มีชื่อเดียวกัน ให้ใช้ข้อกำหนดแบบมีสโคปที่ระบุชัดเจน (ตัวอย่างเช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="คลัง Git">
    ใช้ `git:<repo>` เพื่อติดตั้งโดยตรงจากคลัง git รูปแบบที่รองรับ: `git:github.com/owner/repo`, `git:owner/repo`, `https://` แบบเต็ม, `ssh://`, `git://`, `file://` และ URL โคลน `git@host:owner/repo.git` เพิ่ม `@<ref>` หรือ `#<ref>` เพื่อเช็กเอาต์แบรนช์ แท็ก หรือคอมมิตก่อนติดตั้ง

    การติดตั้งจาก Git จะโคลนลงในไดเรกทอรีชั่วคราว เช็กเอาต์ ref ที่ร้องขอหากมี แล้วใช้ตัวติดตั้งไดเรกทอรี Plugin ตามปกติ ดังนั้นการตรวจสอบความถูกต้องของแมนิเฟสต์ นโยบายการติดตั้งของผู้ดำเนินการ งานติดตั้งของตัวจัดการแพ็กเกจ และระเบียนการติดตั้งจะทำงานเหมือนการติดตั้งจาก npm การติดตั้งจาก git ที่บันทึกไว้จะรวม URL/ref ต้นทางและคอมมิตที่แก้ไขได้ เพื่อให้ `openclaw plugins update` สามารถแก้ไขต้นทางใหม่ได้ในภายหลัง

    หลังจากติดตั้งจาก git ให้ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อตรวจสอบการลงทะเบียนรันไทม์ เช่น เมธอดของ Gateway และคำสั่ง CLI หาก Plugin ลงทะเบียนรูท CLI ด้วย `api.registerCli` ให้เรียกใช้คำสั่งนั้นโดยตรงผ่าน CLI รูทของ OpenClaw ตัวอย่างเช่น `openclaw demo-plugin ping`

  </Accordion>
  <Accordion title="ไฟล์เก็บถาวร">
    ไฟล์เก็บถาวรที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` ไฟล์เก็บถาวร Plugin OpenClaw แบบเนทีฟต้องมี `openclaw.plugin.json` ที่ถูกต้อง ณ รูท Plugin ที่แตกไฟล์แล้ว ไฟล์เก็บถาวรที่มีเพียง `package.json` จะถูกปฏิเสธก่อนที่ OpenClaw จะเขียนระเบียนการติดตั้ง

    ใช้ `npm-pack:<path.tgz>` เมื่อไฟล์เป็น tarball จาก npm-pack และคุณต้องการ
    ใช้เส้นทางโปรเจกต์ npm ที่จัดการต่อ Plugin แบบเดียวกับที่การติดตั้งจากรีจิสทรีใช้
    รวมถึงการตรวจสอบ `package-lock.json` การสแกนการขึ้นต่อกันที่ถูกยกระดับขึ้นมา
    และระเบียนการติดตั้ง npm เส้นทางไฟล์เก็บถาวรทั่วไปจะยังคงติดตั้งเป็น
    ไฟล์เก็บถาวรภายในเครื่องภายใต้รูทส่วนขยาย Plugin

    รองรับการติดตั้งจากมาร์เก็ตเพลส Claude ด้วย

  </Accordion>
</AccordionGroup>

การติดตั้งจาก ClawHub ใช้ตัวระบุตำแหน่ง `clawhub:<package>` ที่ชัดเจน:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

ข้อกำหนด Plugin แบบเปล่าที่ปลอดภัยสำหรับ npm จะติดตั้งจาก npm ตามค่าเริ่มต้นระหว่างการเปลี่ยนผ่านช่วงเปิดตัว เว้นแต่จะตรงกับรหัส Plugin อย่างเป็นทางการ:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อระบุการแก้ไขเฉพาะ npm อย่างชัดเจน:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw จะตรวจสอบความเข้ากันได้ของ API Plugin / Gateway ขั้นต่ำที่ประกาศไว้ก่อนติดตั้ง เมื่อเวอร์ชัน ClawHub ที่เลือกเผยแพร่อาร์ติแฟกต์ ClawPack OpenClaw จะดาวน์โหลด npm-pack `.tgz` ที่มีเวอร์ชัน ตรวจสอบส่วนหัวไดเจสต์ของ ClawHub และไดเจสต์ของอาร์ติแฟกต์ จากนั้นติดตั้งผ่านเส้นทางไฟล์เก็บถาวรตามปกติ เวอร์ชัน ClawHub รุ่นเก่าที่ไม่มีข้อมูลเมตา ClawPack จะยังคงติดตั้งผ่านเส้นทางการตรวจสอบไฟล์เก็บถาวรแพ็กเกจแบบเดิม การติดตั้งที่บันทึกไว้จะเก็บข้อมูลเมตาต้นทาง ClawHub ชนิดอาร์ติแฟกต์ ความสมบูรณ์ของ npm npm shasum ชื่อ tarball และข้อเท็จจริงไดเจสต์ ClawPack ไว้สำหรับการอัปเดตภายหลัง
การติดตั้ง ClawHub ที่ไม่ระบุเวอร์ชันจะเก็บข้อกำหนดที่บันทึกไว้แบบไม่ระบุเวอร์ชัน เพื่อให้ `openclaw plugins update` ติดตามรุ่น ClawHub ที่ใหม่กว่าได้ ส่วนตัวเลือกเวอร์ชันหรือแท็กที่ระบุชัดเจน เช่น `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` จะยังคงตรึงไว้กับตัวเลือกนั้น

### รูปแบบย่อของมาร์เก็ตเพลส

ใช้รูปแบบย่อ `plugin@marketplace` เมื่อชื่อมาร์เก็ตเพลสมีอยู่ในแคชรีจิสทรีภายในเครื่องของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

ใช้ `--marketplace` เพื่อส่งต้นทางมาร์เก็ตเพลสอย่างชัดเจน:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="ต้นทางมาร์เก็ตเพลส">
    - ชื่อมาร์เก็ตเพลสที่ Claude รู้จักจาก `~/.claude/plugins/known_marketplaces.json`
    - รูทมาร์เก็ตเพลสภายในเครื่องหรือเส้นทาง `marketplace.json`
    - รูปแบบย่อของคลัง GitHub เช่น `owner/repo`
    - URL คลัง GitHub เช่น `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="กฎมาร์เก็ตเพลสระยะไกล">
    สำหรับมาร์เก็ตเพลสระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องอยู่ภายในคลังมาร์เก็ตเพลสที่โคลนมา OpenClaw ยอมรับต้นทางแบบเส้นทางสัมพัทธ์จากคลังนั้น และปฏิเสธ HTTP(S) เส้นทางสัมบูรณ์ git GitHub และต้นทาง Plugin อื่นที่ไม่ใช่เส้นทางจากแมนิเฟสต์ระยะไกล
  </Tab>
</Tabs>

สำหรับเส้นทางและไฟล์เก็บถาวรภายในเครื่อง OpenClaw จะตรวจหาโดยอัตโนมัติ:

- Plugin OpenClaw แบบเนทีฟ (`openclaw.plugin.json`)
- บันเดิลที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- บันเดิลที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือเลย์เอาต์คอมโพเนนต์ Claude เริ่มต้นเมื่อไม่มีไฟล์แมนิเฟสต์ดังกล่าว)
- บันเดิลที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

การติดตั้งภายในเครื่องที่จัดการต้องเป็นไดเรกทอรี Plugin หรือไฟล์เก็บถาวร ไฟล์ Plugin แบบสแตนด์อโลน `.js`,
`.mjs`, `.cjs` และ `.ts` จะไม่ถูกคัดลอกไปยังรูท Plugin ที่จัดการ
โดย `plugins install` และจะไม่ถูกโหลดด้วยการวางไฟล์โดยตรงใน
`~/.openclaw/extensions` หรือ `<workspace>/.openclaw/extensions`; รูทที่ค้นพบโดยอัตโนมัติเหล่านั้น
จะโหลดไดเรกทอรีแพ็กเกจหรือบันเดิล Plugin และข้ามไฟล์สคริปต์ระดับบนสุดในฐานะตัวช่วยภายในเครื่อง ให้ระบุไฟล์แบบสแตนด์อโลนอย่างชัดเจนใน
`plugins.load.paths` แทน

<Note>
บันเดิลที่เข้ากันได้จะติดตั้งลงในรูท Plugin ตามปกติ และเข้าร่วมโฟลว์แสดงรายการ/ข้อมูล/เปิดใช้งาน/ปิดใช้งานเดียวกัน ปัจจุบันรองรับ Skills ของบันเดิล, command-skills ของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` ของ Claude / `lspServers` ที่ประกาศในแมนิเฟสต์, command-skills ของ Cursor และไดเรกทอรีฮุก Codex ที่เข้ากันได้ ส่วนความสามารถอื่นของบันเดิลที่ตรวจพบจะแสดงในการวินิจฉัย/ข้อมูล แต่ยังไม่ได้เชื่อมต่อเข้ากับการดำเนินการของรันไทม์
</Note>

ใช้ `-l`/`--link` เพื่อชี้ไปยังไดเรกทอรี Plugin ภายในเครื่องโดยไม่คัดลอก (เพิ่ม
ลงใน `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

ไม่รองรับ `--link` กับการติดตั้ง `--marketplace` หรือ `git:` และ
ต้องใช้เส้นทางภายในเครื่องที่มีอยู่แล้ว สำหรับลิงก์ภายในเครื่องแบบไม่โต้ตอบ
ให้ส่ง `--force` หลังจากตรวจสอบต้นทางแล้ว โดยเป็นการยืนยันแหล่งที่มาแต่จะไม่
คัดลอกหรือเขียนทับไดเรกทอรีที่ลิงก์ไว้

<Note>
Plugin ที่มีต้นทางจากเวิร์กสเปซและค้นพบจากรูทส่วนขยายของเวิร์กสเปซจะไม่ถูก
นำเข้าหรือดำเนินการจนกว่าจะเปิดใช้งานอย่างชัดเจน สำหรับการพัฒนาภายในเครื่อง
ให้เรียกใช้ `openclaw plugins enable <plugin-id>` หรือตั้งค่า
`plugins.entries.<plugin-id>.enabled: true`; หากการกำหนดค่าของคุณใช้
`plugins.allow` ให้รวมรหัส Plugin เดียวกันไว้ที่นั่นด้วย กฎแบบปิดไว้ก่อนนี้
ยังมีผลเมื่อการตั้งค่าช่องทางระบุเป้าหมายเป็น Plugin ที่มีต้นทางจากเวิร์กสเปซอย่างชัดเจนสำหรับ
การโหลดเฉพาะขั้นตอนการตั้งค่า ดังนั้นโค้ดตั้งค่า Plugin ช่องทางภายในเครื่องจะไม่ทำงานขณะที่
Plugin ในเวิร์กสเปซนั้นยังคงถูกปิดใช้งานหรือถูกตัดออกจากรายการที่อนุญาต การติดตั้งแบบลิงก์
และรายการ `plugins.load.paths` ที่ระบุชัดเจนจะเป็นไปตามนโยบายปกติสำหรับ
ต้นทาง Plugin ที่แก้ไขได้ ดู
[กำหนดค่านโยบาย Plugin](/th/tools/plugin#configure-plugin-policy)
และ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#plugins)

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึกข้อกำหนดแน่นอนที่แก้ไขได้ (`name@version`) ในดัชนี Plugin ที่จัดการ โดยยังคงพฤติกรรมเริ่มต้นแบบไม่ตรึงไว้
</Note>

## แสดงรายการ

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  แสดงเฉพาะ Plugin ที่เปิดใช้งาน
</ParamField>
<ParamField path="--verbose" type="boolean">
  เปลี่ยนจากมุมมองตารางเป็นบรรทัดรายละเอียดราย Plugin พร้อมข้อมูลเมตารูปแบบ/ต้นทาง/แหล่งกำเนิด/เวอร์ชัน/การเปิดใช้งาน
</ParamField>
<ParamField path="--json" type="boolean">
  รายการสินค้าคงคลังที่เครื่องอ่านได้ พร้อมการวินิจฉัยรีจิสทรีและสถานะการติดตั้งการขึ้นต่อกันของแพ็กเกจ
</ParamField>

<Note>
`plugins list` จะอ่านรีจิสทรี Plugin ภายในเครื่องที่บันทึกไว้ก่อน โดยใช้ข้อมูลสำรองที่สร้างจาก manifest เท่านั้นเมื่อรีจิสทรีสูญหายหรือไม่ถูกต้อง คำสั่งนี้มีประโยชน์ในการตรวจสอบว่า Plugin ได้รับการติดตั้ง เปิดใช้งาน และมองเห็นได้สำหรับการวางแผนเริ่มต้นแบบ cold startup หรือไม่ แต่ไม่ใช่การตรวจสอบรันไทม์แบบสดของกระบวนการ Gateway ที่กำลังทำงานอยู่ หลังจากเปลี่ยนโค้ด Plugin สถานะการเปิดใช้งาน นโยบาย hook หรือ `plugins.load.paths` ให้รีสตาร์ต Gateway ที่ให้บริการช่องทางนั้นก่อน จึงจะคาดหวังให้โค้ดหรือ hook ใหม่ของ `register(api)` ทำงาน สำหรับการติดตั้งใช้งานระยะไกล/คอนเทนเนอร์ ให้ตรวจสอบว่ากำลังรีสตาร์ตกระบวนการลูก `openclaw gateway run` จริง ไม่ใช่เพียงกระบวนการ wrapper

`plugins list --json` รวม `dependencyStatus` ของแต่ละ Plugin จาก `package.json`
`dependencies` และ `optionalDependencies` OpenClaw จะตรวจสอบว่ามีชื่อแพ็กเกจเหล่านั้น
อยู่ตามพาธการค้นหา Node `node_modules` ปกติของ Plugin หรือไม่ โดยจะไม่
นำเข้าโค้ดรันไทม์ของ Plugin เรียกใช้ตัวจัดการแพ็กเกจ หรือซ่อมแซม
การขึ้นต่อกันที่ขาดหายไป
</Note>

หากบันทึกการเริ่มต้นแสดง `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
ให้เรียกใช้ `openclaw plugins list --enabled --verbose` หรือ
`openclaw plugins inspect <id>` พร้อมรหัส Plugin ที่แสดงในรายการ เพื่อยืนยันรหัส
Plugin และคัดลอกรหัสที่เชื่อถือได้ไปยัง `plugins.allow` ใน `openclaw.json` เมื่อ
คำเตือนสามารถแสดง Plugin ที่ค้นพบทั้งหมดได้ ระบบจะแสดงส่วนย่อย
`plugins.allow` ที่พร้อมวางและมีรหัสเหล่านั้นรวมอยู่แล้ว หาก Plugin โหลด
โดยไม่มีข้อมูลที่มาของการติดตั้ง/พาธการโหลด ให้ตรวจสอบรหัส Plugin นั้น จากนั้นปักหมุด
รหัสที่เชื่อถือได้ใน `plugins.allow` หรือติดตั้ง Plugin ใหม่จากแหล่งที่เชื่อถือได้
เพื่อให้ OpenClaw บันทึกที่มาของการติดตั้ง

สำหรับงาน Plugin แบบบันเดิลภายในอิมเมจ Docker ที่แพ็กเกจแล้ว ให้ bind-mount ไดเรกทอรี
ซอร์สของ Plugin ทับพาธซอร์สที่แพ็กเกจไว้ซึ่งตรงกัน เช่น
`/app/extensions/synology-chat` OpenClaw จะค้นพบโอเวอร์เลย์ซอร์สที่เมานต์นี้
ก่อน `/app/dist/extensions/synology-chat` ส่วนไดเรกทอรีซอร์สที่คัดลอกมาเฉย ๆ
จะไม่ทำงาน ดังนั้นการติดตั้งแบบแพ็กเกจตามปกติจึงยังคงใช้ dist ที่คอมไพล์แล้ว

สำหรับการดีบัก hook รันไทม์:

- `openclaw plugins inspect <id> --runtime --json` แสดง hook ที่ลงทะเบียนและข้อมูลวินิจฉัยจากรอบการตรวจสอบที่โหลดโมดูล การตรวจสอบรันไทม์จะไม่ติดตั้งการขึ้นต่อกัน ให้ใช้ `openclaw doctor --fix` เพื่อล้างสถานะการขึ้นต่อกันแบบเดิมหรือกู้คืน Plugin ที่ดาวน์โหลดได้แต่ขาดหายไปซึ่งถูกอ้างอิงโดยการกำหนดค่า
- `openclaw gateway status --deep --require-rpc` ยืนยัน URL/โปรไฟล์ Gateway ที่เข้าถึงได้ คำแนะนำเกี่ยวกับบริการ/กระบวนการ พาธการกำหนดค่า และสถานะการทำงานของ RPC
- hook การสนทนาแบบไม่บันเดิล (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`

### ดัชนี Plugin

เมทาดาทาการติดตั้ง Plugin เป็นสถานะที่เครื่องจัดการ ไม่ใช่การกำหนดค่าของผู้ใช้ การติดตั้งและการอัปเดตจะเขียนข้อมูลนี้ไปยังฐานข้อมูลสถานะ SQLite ที่ใช้ร่วมกันภายใต้ไดเรกทอรีสถานะ OpenClaw ที่ใช้งานอยู่ แถว `installed_plugin_index` จัดเก็บเมทาดาทา `installRecords` แบบคงทน รวมถึงระเบียนสำหรับ manifest ของ Plugin ที่เสียหายหรือขาดหายไป ตลอดจนแคชรีจิสทรีแบบ cold ที่สร้างจาก manifest ซึ่งใช้โดย `openclaw plugins update` การถอนการติดตั้ง การวินิจฉัย และรีจิสทรี Plugin แบบ cold

เมื่อ OpenClaw พบระเบียน `plugins.installs` แบบเดิมที่เผยแพร่แล้วในการกำหนดค่า การอ่านขณะรันไทม์จะถือว่าระเบียนเหล่านั้นเป็นข้อมูลความเข้ากันได้โดยไม่เขียน `openclaw.json` ใหม่ การเขียน Plugin โดยชัดแจ้งและ `openclaw doctor --fix` จะย้ายระเบียนเหล่านั้นไปยังดัชนี Plugin และลบคีย์การกำหนดค่าเมื่ออนุญาตให้เขียนการกำหนดค่า หากการเขียนรายการใดล้มเหลว ระบบจะเก็บระเบียนการกำหนดค่าไว้เพื่อไม่ให้เมทาดาทาการติดตั้งสูญหาย

## ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` จะลบระเบียน Plugin ออกจาก `plugins.entries` ดัชนี Plugin ที่บันทึกไว้ รายการอนุญาต/ปฏิเสธ Plugin และรายการ `plugins.load.paths` ที่เชื่อมโยงเมื่อเกี่ยวข้อง เว้นแต่จะตั้งค่า `--keep-files` การถอนการติดตั้งจะลบไดเรกทอรีการติดตั้งที่มีการจัดการและติดตามไว้ด้วย แต่เฉพาะเมื่อพาธที่แก้ไขแล้วอยู่ภายในรากส่วนขยาย Plugin ของ OpenClaw หากปัจจุบัน Plugin ครอบครองสล็อต `memory` หรือ `contextEngine` สล็อตนั้นจะรีเซ็ตเป็นค่าเริ่มต้น (`memory-core` สำหรับหน่วยความจำ และ `legacy` สำหรับกลไกบริบท)

`uninstall` จะแสดงตัวอย่างสิ่งที่จะถูกลบ จากนั้นถาม `Uninstall plugin "<id>"?` ก่อนทำการเปลี่ยนแปลง ส่ง `--force` เพื่อข้ามข้อความแจ้งยืนยัน (มีประโยชน์สำหรับสคริปต์และการทำงานแบบไม่โต้ตอบ) หากไม่มีตัวเลือกนี้ การถอนการติดตั้งต้องใช้ TTY แบบโต้ตอบ `--dry-run` จะแสดงตัวอย่างเดียวกันและออกโดยไม่ถามหรือเปลี่ยนแปลงสิ่งใด

<Note>
รองรับ `--keep-config` ในฐานะนามแฝงที่เลิกใช้แล้วของ `--keep-files`
</Note>

## อัปเดต

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update @acme/demo
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

การอัปเดตจะใช้กับการติดตั้ง Plugin ที่ติดตามในดัชนี Plugin ที่มีการจัดการ และการติดตั้งแพ็ก hook ที่ติดตามใน `hooks.internal.installs` โดยจะใช้แหล่งเดิมที่ผู้ใช้เลือกไว้แล้วเมื่อติดตั้ง Plugin ซ้ำ จึงไม่ต้องยืนยันแหล่งที่มาเป็นครั้งที่สอง

<AccordionGroup>
  <Accordion title="การแยกระหว่างรหัส Plugin กับข้อกำหนด npm">
    เมื่อส่งรหัส Plugin OpenClaw จะใช้ข้อกำหนดการติดตั้งที่บันทึกไว้สำหรับ Plugin นั้นซ้ำ ซึ่งหมายความว่า dist-tag ที่จัดเก็บไว้ก่อนหน้า เช่น `@beta` และเวอร์ชันที่ปักหมุดไว้อย่างแน่นอน จะยังคงถูกใช้ในการเรียกใช้ `update <id>` ครั้งต่อ ๆ ไป

    ระหว่าง `update <id> --dry-run` การติดตั้ง npm ที่ปักหมุดเป็นเวอร์ชันแน่นอนจะยังคงถูกปักหมุด หาก OpenClaw สามารถหารีลีสไลน์เริ่มต้นในรีจิสทรีของแพ็กเกจได้ด้วย และรีลีสไลน์เริ่มต้นนั้นใหม่กว่าเวอร์ชันที่ติดตั้งและปักหมุดไว้ การทดลองรันจะรายงานการปักหมุดและแสดงคำสั่งอัปเดตแพ็กเกจ `@latest` อย่างชัดเจน เพื่อเปลี่ยนไปใช้รีลีสไลน์เริ่มต้นของรีจิสทรี

    กฎการอัปเดตแบบเจาะจงนี้แตกต่างจากพาธการบำรุงรักษาแบบรวม `openclaw plugins update --all` การอัปเดตแบบรวมยังคงเคารพข้อกำหนดการติดตั้งที่ติดตามไว้ตามปกติ แต่ระเบียน Plugin ทางการที่เชื่อถือได้ของ OpenClaw สามารถซิงค์กับเป้าหมายแค็ตตาล็อกทางการปัจจุบันแทนการคงอยู่กับแพ็กเกจทางการเวอร์ชันแน่นอนที่ล้าสมัย ใช้ `update <id>` แบบเจาะจงเมื่อจงใจต้องการเก็บข้อกำหนดทางการแบบเวอร์ชันแน่นอนหรือแบบแท็กไว้โดยไม่เปลี่ยนแปลง

    สำหรับการติดตั้ง npm ยังสามารถส่งข้อกำหนดแพ็กเกจ npm อย่างชัดเจนพร้อม dist-tag หรือเวอร์ชันแน่นอนได้ OpenClaw จะจับคู่ชื่อแพ็กเกจนั้นกลับไปยังระเบียน Plugin ที่ติดตาม อัปเดต Plugin ที่ติดตั้งนั้น และบันทึกข้อกำหนด npm ใหม่สำหรับการอัปเดตตามรหัสในอนาคต

    การส่งชื่อแพ็กเกจ npm โดยไม่มีเวอร์ชันหรือแท็กจะจับคู่กลับไปยังระเบียน Plugin ที่ติดตามเช่นกัน ใช้วิธีนี้เมื่อ Plugin ถูกปักหมุดไว้ที่เวอร์ชันแน่นอนและต้องการย้ายกลับไปยังรีลีสไลน์เริ่มต้นของรีจิสทรี

  </Accordion>
  <Accordion title="การอัปเดตช่องเบตา">
    `openclaw plugins update <id-or-npm-spec>` แบบเจาะจงจะใช้ข้อกำหนด Plugin ที่ติดตามไว้ซ้ำ เว้นแต่จะส่งข้อกำหนดใหม่ `openclaw plugins update --all` แบบรวมจะใช้ `update.channel` ที่กำหนดค่าไว้ เมื่อซิงค์ระเบียน Plugin ทางการที่เชื่อถือได้กับเป้าหมายแค็ตตาล็อกทางการ เพื่อให้การติดตั้งผ่านช่องเบตายังคงอยู่ในรีลีสไลน์เบตาแทนที่จะถูกปรับเป็น stable/latest โดยไม่แจ้ง

    `openclaw update` ยังรับรู้ช่องอัปเดต OpenClaw ที่ใช้งานอยู่ด้วย: บนช่องเบตา ระเบียน Plugin แบบ npm และ ClawHub ที่ใช้รีลีสไลน์เริ่มต้นจะลอง `@beta` ก่อน หากไม่มีรีลีสเบตาของ Plugin ระบบจะย้อนกลับไปใช้ข้อกำหนด default/latest ที่บันทึกไว้ ส่วน Plugin npm จะย้อนกลับด้วยเมื่อมีแพ็กเกจเบตาแต่ไม่ผ่านการตรวจสอบความถูกต้องในการติดตั้ง การย้อนกลับดังกล่าวจะถูกรายงานเป็นคำเตือนและไม่ทำให้การอัปเดตแกนหลักล้มเหลว เวอร์ชันแน่นอนและแท็กที่ระบุชัดเจนจะยังคงปักหมุดกับตัวเลือกนั้นสำหรับการอัปเดตแบบเจาะจง

  </Accordion>
  <Accordion title="การตรวจสอบเวอร์ชันและความคลาดเคลื่อนของความสมบูรณ์">
    ก่อนอัปเดต npm แบบสด OpenClaw จะตรวจสอบเวอร์ชันแพ็กเกจที่ติดตั้งเทียบกับเมทาดาทาของรีจิสทรี npm หากเวอร์ชันที่ติดตั้งและอัตลักษณ์อาร์ติแฟกต์ที่บันทึกไว้ตรงกับเป้าหมายที่แก้ไขแล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน `openclaw.json` ใหม่

    เมื่อมีแฮชความสมบูรณ์ที่จัดเก็บไว้และแฮชของอาร์ติแฟกต์ที่ดึงมาเปลี่ยนแปลง OpenClaw จะถือว่าเป็นความคลาดเคลื่อนของอาร์ติแฟกต์ npm คำสั่ง `openclaw plugins update` แบบโต้ตอบจะแสดงแฮชที่คาดไว้และแฮชจริง แล้วขอการยืนยันก่อนดำเนินการต่อ ตัวช่วยอัปเดตแบบไม่โต้ตอบจะปฏิเสธโดยค่าเริ่มต้น เว้นแต่ผู้เรียกจะระบุนโยบายดำเนินการต่ออย่างชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install ในการอัปเดต">
    `--dangerously-force-unsafe-install` ยังได้รับการยอมรับใน `plugins update` เพื่อความเข้ากันได้ แต่เลิกใช้แล้วและจะไม่เปลี่ยนพฤติกรรมการอัปเดต Plugin อีกต่อไป `security.installPolicy` ของผู้ปฏิบัติงานยังสามารถบล็อกการอัปเดตได้ ส่วน hook `before_install` ของ Plugin จะมีผลเฉพาะในกระบวนการที่โหลด hook ของ Plugin เท่านั้น
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk ในการอัปเดต">
    การอัปเดต Plugin จาก ClawHub ของชุมชนจะเรียกใช้การตรวจสอบความเชื่อถือของรีลีสแบบตรงรุ่นเช่นเดียวกับการติดตั้ง ก่อนดาวน์โหลดแพ็กเกจทดแทน ใช้ `--acknowledge-clawhub-risk` สำหรับระบบอัตโนมัติที่ผ่านการตรวจสอบแล้วและควรดำเนินการต่อเมื่อรีลีส ClawHub ที่เลือกมีคำเตือนความเสี่ยงด้านความเชื่อถือ แพ็กเกจ ClawHub ทางการและแหล่ง Plugin แบบบันเดิลของ OpenClaw จะข้ามข้อความแจ้งความเชื่อถือของรีลีสนี้
  </Accordion>
</AccordionGroup>

## ตรวจสอบ

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

การตรวจสอบจะแสดงอัตลักษณ์ สถานะการโหลด แหล่งที่มา ความสามารถตาม manifest แฟล็กนโยบาย การวินิจฉัย เมทาดาทาการติดตั้ง ความสามารถของบันเดิล และการรองรับเซิร์ฟเวอร์ MCP หรือ LSP ที่ตรวจพบ โดยค่าเริ่มต้นจะไม่นำเข้ารันไทม์ของ Plugin เอาต์พุต JSON มีสัญญา manifest ของ Plugin เช่น `contracts.agentToolResultMiddleware` และ `contracts.trustedToolPolicies` เพื่อให้ผู้ปฏิบัติงานตรวจสอบคำประกาศพื้นผิวที่เชื่อถือได้ก่อนเปิดใช้งานหรือรีสตาร์ต Plugin เพิ่ม `--runtime` เพื่อโหลดโมดูล Plugin และรวม hook เครื่องมือ คำสั่ง บริการ เมธอด Gateway และเส้นทาง HTTP ที่ลงทะเบียนไว้ การตรวจสอบรันไทม์จะรายงานการขึ้นต่อกันของ Plugin ที่ขาดหายไปโดยตรง ส่วนการติดตั้งและการซ่อมแซมยังคงอยู่ใน `openclaw plugins install`, `openclaw plugins update` และ `openclaw doctor --fix`

โดยทั่วไปคำสั่ง CLI ที่ Plugin เป็นเจ้าของจะติดตั้งเป็นกลุ่มคำสั่งราก `openclaw` แต่ Plugin อาจลงทะเบียนคำสั่งซ้อนภายใต้คำสั่งหลักของแกนกลาง เช่น `openclaw nodes` ได้ด้วย หลังจาก `inspect --runtime` แสดงคำสั่งภายใต้ `cliCommands` ให้เรียกใช้คำสั่งนั้นตามพาธที่แสดง เช่น สามารถตรวจสอบ Plugin ที่ลงทะเบียน `demo-git` ได้ด้วย `openclaw demo-git ping`

Plugin แต่ละรายการจะถูกจัดประเภทตามสิ่งที่ลงทะเบียนจริงขณะรันไทม์:

| รูปแบบ               | ความหมาย                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | มีความสามารถเพียงประเภทเดียวเท่านั้น (เช่น Plugin ที่เป็นผู้ให้บริการอย่างเดียว)         |
| `hybrid-capability` | มีความสามารถมากกว่าหนึ่งประเภท (เช่น ข้อความ + เสียงพูด + รูปภาพ)       |
| `hook-only`         | มีเฉพาะ hook โดยไม่มีความสามารถ เครื่องมือ คำสั่ง บริการ หรือเส้นทาง |
| `non-capability`    | มีเครื่องมือ/คำสั่ง/บริการ แต่ไม่มีความสามารถ                       |

ดูข้อมูลเพิ่มเติมเกี่ยวกับโมเดลความสามารถได้ที่ [รูปแบบ Plugin](/th/plugins/architecture#plugin-shapes)

<Note>
แฟล็ก `--json` จะแสดงรายงานที่เครื่องอ่านได้ซึ่งเหมาะสำหรับการเขียนสคริปต์และการตรวจสอบ `inspect --all` จะแสดงตารางทั่วทั้งกลุ่มระบบ พร้อมคอลัมน์รูปแบบ ชนิดความสามารถ ประกาศความเข้ากันได้ ความสามารถของบันเดิล และสรุป hook `info` เป็นนามแฝงของ `inspect`
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` รายงานข้อผิดพลาดในการโหลด Plugin การวินิจฉัย manifest/การค้นหา การแจ้งเตือนความเข้ากันได้ และการอ้างอิงการกำหนดค่า Plugin ที่ล้าสมัย เช่น สล็อต Plugin ที่หายไป เมื่อลำดับชั้นการติดตั้งและการกำหนดค่า Plugin ไม่มีปัญหา ระบบจะแสดง `No plugin issues detected.` หากยังมีการกำหนดค่าที่ล้าสมัยอยู่ แต่ลำดับชั้นการติดตั้งส่วนอื่นทำงานปกติ ข้อมูลสรุปจะระบุสถานการณ์ดังกล่าวแทนการสื่อว่า Plugin ทั้งหมดทำงานสมบูรณ์

หาก Plugin ที่กำหนดค่าไว้มีอยู่บนดิสก์แต่ถูกตัวโหลดบล็อกด้วยการตรวจสอบความปลอดภัยของพาธ การตรวจสอบความถูกต้องของการกำหนดค่าจะเก็บรายการ Plugin ไว้และรายงานเป็น `present but blocked` ให้แก้ไขการวินิจฉัย Plugin ที่ถูกบล็อกก่อนหน้านี้ เช่น ความเป็นเจ้าของพาธหรือสิทธิ์ที่อนุญาตให้ทุกคนเขียนได้ แทนการนำการกำหนดค่า `plugins.entries.<id>` หรือ `plugins.allow` ออก

สำหรับความล้มเหลวด้านรูปแบบโมดูล เช่น ไม่มี export `register`/`activate` ให้เรียกใช้อีกครั้งด้วย `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมข้อมูลสรุปรูปแบบ export แบบกระชับไว้ในผลลัพธ์การวินิจฉัย

## รีจิสทรี

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

รีจิสทรี Plugin ภายในเครื่องคือโมเดลการอ่านแบบ cold read ที่ OpenClaw จัดเก็บถาวรสำหรับข้อมูลประจำตัวของ Plugin ที่ติดตั้ง สถานะการเปิดใช้งาน เมทาดาทาของแหล่งที่มา และความเป็นเจ้าของส่วนที่มีส่วนร่วม การเริ่มต้นตามปกติ การค้นหาเจ้าของผู้ให้บริการ การจำแนกการตั้งค่าช่องทาง และคลังรายการ Plugin สามารถอ่านข้อมูลนี้ได้โดยไม่ต้องนำเข้าโมดูลรันไทม์ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่ารีจิสทรีที่จัดเก็บถาวรมีอยู่ เป็นปัจจุบัน หรือล้าสมัย ใช้ `--refresh` เพื่อสร้างใหม่จากดัชนี Plugin ที่จัดเก็บถาวร นโยบายการกำหนดค่า และเมทาดาทาของ manifest/แพ็กเกจ นี่คือเส้นทางการซ่อมแซม ไม่ใช่เส้นทางการเปิดใช้งานรันไทม์

`openclaw doctor --fix` ยังซ่อมแซมความคลาดเคลื่อนของ npm ที่มีการจัดการซึ่งอยู่ใกล้เคียงกับรีจิสทรีด้วย หากแพ็กเกจ `@openclaw/*` ที่ไม่มีเจ้าของหรือกู้คืนแล้วภายใต้โปรเจกต์ npm ของ Plugin ที่มีการจัดการ หรือรูท npm แบบแบนที่มีการจัดการรุ่นเก่า บดบัง Plugin ที่รวมมาในชุด doctor จะลบแพ็กเกจล้าสมัยดังกล่าวและสร้างรีจิสทรีใหม่ เพื่อให้การเริ่มต้นตรวจสอบกับ manifest ที่รวมมาในชุด นอกจากนี้ doctor ยังเชื่อมโยงแพ็กเกจ `openclaw` ของโฮสต์กลับเข้ากับ Plugin npm ที่มีการจัดการซึ่งประกาศ `peerDependencies.openclaw` เพื่อให้อิมพอร์ตรันไทม์ภายในแพ็กเกจ เช่น `openclaw/plugin-sdk/*` สามารถ resolve ได้หลังการอัปเดตหรือซ่อมแซม npm

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็นสวิตช์ความเข้ากันได้สำหรับกรณีฉุกเฉินที่เลิกใช้แล้วสำหรับความล้มเหลวในการอ่านรีจิสทรี ควรใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix` โดย fallback ผ่านตัวแปรสภาพแวดล้อมมีไว้สำหรับการกู้คืนการเริ่มต้นระบบในกรณีฉุกเฉินระหว่างการทยอยใช้การย้ายข้อมูลเท่านั้น
</Warning>

## มาร์เก็ตเพลส

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace entries --feed-profile <name>
openclaw plugins marketplace entries --feed-url <url>
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

`plugins marketplace entries` แสดงรายการจากฟีดมาร์เก็ตเพลส OpenClaw ที่กำหนดค่าไว้ โดยค่าเริ่มต้นจะพยายามใช้ฟีดที่โฮสต์ไว้ และ fallback ไปยังสแนปช็อตล่าสุดที่ยอมรับหรือข้อมูลที่รวมมาในชุด ใช้ `--feed-profile <name>` เพื่ออ่านโปรไฟล์ที่กำหนดค่าไว้โดยเฉพาะ ใช้ `--feed-url <url>` เพื่ออ่าน URL ของฟีดที่โฮสต์ไว้อย่างชัดเจน และใช้ `--offline` เพื่ออ่านสแนปช็อตล่าสุดที่ยอมรับโดยไม่ดึงข้อมูลฟีด

`plugins marketplace refresh` รีเฟรชสแนปช็อตของฟีดที่โฮสต์ไว้ซึ่งกำหนดค่าแล้ว และรายงานว่า OpenClaw ยอมรับข้อมูลที่โฮสต์ไว้ สแนปช็อตที่โฮสต์ไว้ หรือข้อมูล fallback ที่รวมมาในชุด ใช้ `--expected-sha256` เมื่อผู้เรียกต้องการให้คำสั่งล้มเหลว เว้นแต่เพย์โหลดใหม่จากโฮสต์จะตรงกับ checksum ที่ตรึงไว้

`list` ของมาร์เก็ตเพลสยอมรับพาธมาร์เก็ตเพลสภายในเครื่อง พาธ `marketplace.json` รูปแบบย่อของ GitHub เช่น `owner/repo` URL ของรีโพ GitHub หรือ URL ของ git ส่วน `--json` จะแสดงป้ายกำกับแหล่งที่มาที่ resolve แล้ว พร้อม manifest ของมาร์เก็ตเพลสและรายการ Plugin ที่แยกวิเคราะห์แล้ว

การรีเฟรชมาร์เก็ตเพลสจะโหลดฟีดมาร์เก็ตเพลส OpenClaw ที่โฮสต์ไว้และจัดเก็บ
การตอบกลับที่ผ่านการตรวจสอบแล้วเป็นสแนปช็อตฟีดที่โฮสต์ไว้ภายในเครื่อง หากไม่มีตัวเลือก ระบบจะใช้
โปรไฟล์ฟีดเริ่มต้นที่กำหนดค่าไว้ ใช้ `--feed-profile <name>` เพื่อรีเฟรช
โปรไฟล์ที่กำหนดค่าไว้โดยเฉพาะ ใช้ `--feed-url <url>` เพื่อรีเฟรช URL
ของฟีดที่โฮสต์ไว้อย่างชัดเจน ใช้ `--expected-sha256 <sha256>` เพื่อกำหนดให้ checksum ของเพย์โหลดตรงกัน
(`sha256:<hex>` หรือไดเจสต์เลขฐานสิบหกเปล่า 64 อักขระ) และใช้ `--json` สำหรับ
ผลลัพธ์ที่เครื่องอ่านได้ URL ของฟีดที่โฮสต์ไว้ซึ่งระบุอย่างชัดเจนต้องไม่มี
ข้อมูลประจำตัว สตริงคิวรี หรือแฟรกเมนต์ การรีเฟรชที่ไม่ได้ตรึงสามารถรายงาน
ผลลัพธ์เป็นสแนปช็อตที่โฮสต์ไว้หรือ fallback ที่รวมมาในชุดได้โดยไม่ทำให้คำสั่งล้มเหลว การรีเฟรช
ที่ตรึงไว้จะล้มเหลว เว้นแต่จะยอมรับเพย์โหลดใหม่จากโฮสต์ และการรีเฟรชจากโฮสต์
ที่สำเร็จจะล้มเหลวหาก OpenClaw ไม่สามารถจัดเก็บสแนปช็อตที่ผ่านการตรวจสอบแล้วได้

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ข้อมูลอ้างอิง CLI](/th/cli)
- [ClawHub](/clawhub)
