---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือชุดรวมที่เข้ากันได้
    - คุณต้องการสร้างโครงเริ่มต้นหรือตรวจสอบความถูกต้องของ Plugin เครื่องมือแบบง่าย
    - คุณต้องการแก้ไขข้อบกพร่องของการโหลด Plugin ที่ล้มเหลว
sidebarTitle: Plugins
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw plugins` (เริ่มต้น, สร้าง, ตรวจสอบความถูกต้อง, แสดงรายการ, ติดตั้ง, มาร์เก็ตเพลส, ถอนการติดตั้ง, เปิด/ปิดใช้งาน, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-07-20T05:51:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8db98bf732151009ca09a38c0f56d6e9feb185812196fdfa946bc0949aa09d1f
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Plugin ของ Gateway, แพ็ก hook และบันเดิลที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="ระบบ Plugin" href="/th/tools/plugin">
    คู่มือผู้ใช้ปลายทางสำหรับการติดตั้ง เปิดใช้งาน และแก้ไขปัญหา Plugin
  </Card>
  <Card title="จัดการ Plugin" href="/th/plugins/manage-plugins">
    ตัวอย่างฉบับย่อสำหรับการติดตั้ง แสดงรายการ อัปเดต ถอนการติดตั้ง และเผยแพร่
  </Card>
  <Card title="บันเดิล Plugin" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของบันเดิล
  </Card>
  <Card title="ไฟล์ manifest ของ Plugin" href="/th/plugins/manifest">
    ฟิลด์ของ manifest และสคีมาการกำหนดค่า
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
openclaw plugins info <id>                    # ชื่อแทนของ inspect
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

เมื่อตรวจสอบปัญหาการติดตั้ง การตรวจสอบ การถอนการติดตั้ง หรือการรีเฟรชรีจิสทรีที่ทำงานช้า ให้เรียกใช้
คำสั่งพร้อม `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` การติดตามจะเขียนระยะเวลาของแต่ละเฟส
ไปยัง stderr และยังคงทำให้สามารถแยกวิเคราะห์เอาต์พุต JSON ได้ โปรดดู [การแก้ไขข้อบกพร่อง](/th/help/debugging#plugin-lifecycle-trace)

<Note>
ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) นั้น `openclaw.json` เปลี่ยนแปลงไม่ได้ โดย `install`, `update`, `uninstall`, `enable` และ `disable` จะปฏิเสธการทำงานทั้งหมด ให้แก้ไขซอร์ส Nix สำหรับการติดตั้งนี้แทน (`programs.openclaw.config` หรือ `instances.<name>.config` สำหรับ nix-openclaw) แล้วจึงสร้างใหม่ โปรดดู [เริ่มต้นใช้งานฉบับย่อ](https://github.com/openclaw/nix-openclaw#quick-start) ที่เน้นเอเจนต์เป็นหลัก
</Note>

<Note>
Plugin ที่รวมมาในชุดจะจัดส่งพร้อม OpenClaw บางรายการเปิดใช้งานเป็นค่าเริ่มต้น (เช่น ผู้ให้บริการโมเดล ผู้ให้บริการเสียงพูด และ Plugin เบราว์เซอร์ที่รวมมาในชุด) ส่วนรายการอื่นต้องใช้ `plugins enable`

Plugin ดั้งเดิมของ OpenClaw จัดส่ง `openclaw.plugin.json` พร้อม JSON Schema แบบอินไลน์ (`configSchema` แม้ว่าจะว่างเปล่า) ส่วนบันเดิลที่เข้ากันได้จะใช้ manifest ของบันเดิลตนเองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุตรายการ/ข้อมูลแบบละเอียดจะแสดงชนิดย่อยของบันเดิลด้วย (`codex`, `claude` หรือ `cursor`) พร้อมความสามารถของบันเดิลที่ตรวจพบ
</Note>

## การสร้าง

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

ตามค่าเริ่มต้น `plugins init` จะสร้าง Plugin เครื่องมือ TypeScript แบบขั้นต่ำ อาร์กิวเมนต์แรก
คือ id ของ Plugin ส่วน `--name` ใช้กำหนดชื่อที่แสดง OpenClaw ใช้
id เป็นไดเรกทอรีเอาต์พุตเริ่มต้นและสำหรับการตั้งชื่อแพ็กเกจ โครงเริ่มต้นของเครื่องมือใช้
`defineToolPlugin` และสร้างสคริปต์ `package.json` ได้แก่ `plugin:build` และ
`plugin:validate` ซึ่งจะสร้างก่อนแล้วจึงเรียก `openclaw plugins build`/`validate`

`plugins build` จะนำเข้า entry ที่สร้างแล้ว อ่านข้อมูลเมตาแบบคงที่ของเครื่องมือ เขียน
`openclaw.plugin.json` และทำให้ `openclaw.extensions` ของ `package.json` สอดคล้องกันเสมอ
`plugins validate` ตรวจสอบว่า manifest ที่สร้างขึ้น ข้อมูลเมตาของแพ็กเกจ และ
การส่งออกของ entry ปัจจุบันยังคงตรงกัน โปรดดู [Plugin เครื่องมือ](/th/plugins/tool-plugins) สำหรับ
ขั้นตอนการสร้างทั้งหมด

โครงเริ่มต้นจะเขียนซอร์ส TypeScript แต่สร้างข้อมูลเมตาจาก entry
`./dist/index.js` ที่สร้างแล้ว ดังนั้นขั้นตอนนี้จึงใช้ได้กับ CLI ที่เผยแพร่แล้วด้วย ใช้
`--entry <path>` เมื่อ entry ไม่ใช่ entry เริ่มต้นของแพ็กเกจ ใช้
`plugins build --check` ใน CI เพื่อให้ล้มเหลวเมื่อข้อมูลเมตาที่สร้างขึ้นล้าสมัย โดยไม่
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
พร้อมระบบการยืนยันตัวตนด้วยคีย์ API, สคริปต์ `npm run validate` ที่เรียกใช้
`clawhub package validate`, ข้อมูลเมตาแพ็กเกจ ClawHub และเวิร์กโฟลว์ GitHub Actions
ที่สั่งทำงานด้วยตนเองสำหรับการเผยแพร่ที่เชื่อถือได้ในอนาคตผ่าน GitHub
OIDC โครงเริ่มต้นของผู้ให้บริการจะไม่สร้าง Skills และไม่ใช้
`openclaw plugins build`/`validate` คำสั่งเหล่านั้นใช้สำหรับเส้นทางข้อมูลเมตาที่สร้างขึ้น
ของโครงเริ่มต้นเครื่องมือ

ก่อนเผยแพร่ ให้แทนที่ URL ฐานของ API, แค็ตตาล็อกโมเดล, เส้นทางเอกสาร,
ข้อความข้อมูลรับรอง และเนื้อหา README ที่เป็นตัวยึดด้วยรายละเอียดจริงของผู้ให้บริการ ใช้
README ที่สร้างขึ้นสำหรับการเผยแพร่บน ClawHub ครั้งแรกและการตั้งค่าผู้เผยแพร่ที่เชื่อถือได้

## การติดตั้ง

```bash
openclaw plugins search "calendar"                      # ค้นหา Plugin ใน ClawHub
openclaw plugins install @openclaw/<package>            # แค็ตตาล็อกอย่างเป็นทางการที่เชื่อถือได้
openclaw plugins install <package>                       # แพ็กเกจ npm ใดก็ได้
openclaw plugins install clawhub:<package>                # ClawHub เท่านั้น
openclaw plugins install npm:<package>                    # npm เท่านั้น
openclaw plugins install npm-pack:<path.tgz>               # tarball ของ npm-pack ภายในเครื่อง
openclaw plugins install git:github.com/<owner>/<repo>     # ที่เก็บ git
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # พาธหรือไฟล์บีบอัดภายในเครื่อง
openclaw plugins install -l <path>                         # ลิงก์แทนการคัดลอก
openclaw plugins install <plugin>@<marketplace>             # รูปแบบย่อของมาร์เก็ตเพลส
openclaw plugins install <plugin> --marketplace <name>      # มาร์เก็ตเพลส (ระบุชัดเจน)
openclaw plugins install <package> --force                  # ยืนยันแหล่งที่มา / เขียนทับรายการที่มีอยู่
openclaw plugins install <package> --pin                    # ตรึงเวอร์ชัน npm ที่แก้ไขแล้ว
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

ผู้ดูแลที่ทดสอบการติดตั้งระหว่างการตั้งค่าสามารถแทนที่แหล่งติดตั้ง Plugin อัตโนมัติ
ด้วยตัวแปรสภาพแวดล้อมที่มีการป้องกัน โปรดดู
[การแทนที่แหล่งติดตั้ง Plugin](/th/plugins/install-overrides)

<Warning>
ชื่อแพ็กเกจเปล่าจะติดตั้งจาก npm เป็นค่าเริ่มต้นระหว่างการเปลี่ยนผ่านช่วงเปิดตัว เว้นแต่ชื่อดังกล่าวจะตรงกับ id ของ Plugin ที่รวมมาในชุดหรือเป็นทางการ ซึ่งในกรณีนั้น OpenClaw จะใช้สำเนาภายในเครื่อง/อย่างเป็นทางการแทนการเข้าถึงรีจิสทรี npm ใช้ `npm:<package>` เมื่อตั้งใจต้องการแพ็กเกจ npm ภายนอกแทน ใช้ `clawhub:<package>` สำหรับ ClawHub ให้ถือว่าการติดตั้ง Plugin เหมือนกับการเรียกใช้โค้ด และควรเลือกใช้เวอร์ชันที่ตรึงไว้
</Warning>

<Warning>
แพ็กเกจ ClawHub และแค็ตตาล็อกที่รวมมาในชุด/อย่างเป็นทางการของ OpenClaw
เป็นแหล่งติดตั้งที่เชื่อถือได้ แหล่งใหม่จาก npm ใด ๆ, `npm-pack:`, git, พาธ/ไฟล์บีบอัดภายในเครื่อง หรือ
มาร์เก็ตเพลสจะแสดงคำเตือนและขอการยืนยันก่อนดำเนินการต่อ การติดตั้งจากแหล่งใด ๆ
แบบไม่โต้ตอบต้องส่ง `--force` หลังจากตรวจสอบและเชื่อถือแหล่งที่มาแล้ว แฟล็กเดียวกันนี้
จะเขียนทับเป้าหมายการติดตั้งเดิมเมื่อจำเป็น การอัปเดตตามปกติของการติดตั้ง
ที่ติดตามอยู่แล้วไม่จำเป็นต้องใช้แฟล็กนี้ การยืนยันนี้แยกจาก
`--acknowledge-clawhub-risk` ซึ่งใช้เฉพาะกับคำเตือนความน่าเชื่อถือของรุ่น ClawHub ที่มีความเสี่ยง
`--force` ไม่ข้าม `security.installPolicy` หรือการตรวจสอบความปลอดภัย
ในการติดตั้งที่เหลือ
</Warning>

`plugins search` สอบถาม ClawHub เพื่อหาแพ็กเกจ `code-plugin` และ
`bundle-plugin` ที่ติดตั้งได้ (ไม่ใช่ Skills สำหรับรายการเหล่านั้นให้ใช้ `openclaw skills search`)
ค่าเริ่มต้นของ `--limit` คือ 20 และจำกัดสูงสุดที่ 100 คำสั่งนี้อ่านเฉพาะแค็ตตาล็อกระยะไกลเท่านั้น โดยไม่มี
การตรวจสอบสถานะภายในเครื่อง การเปลี่ยนแปลงการกำหนดค่า การติดตั้งแพ็กเกจ หรือการโหลดรันไทม์
ของ Plugin ผลลัพธ์ประกอบด้วยชื่อแพ็กเกจ ClawHub, ตระกูล, ช่องทาง, เวอร์ชัน,
บทสรุป และคำแนะนำการติดตั้ง เช่น `openclaw plugins install clawhub:<package>`

<Note>
ClawHub เป็นช่องทางหลักสำหรับการเผยแพร่และค้นหา Plugin ส่วนใหญ่ Npm
ยังคงเป็นทางเลือกสำรองและเส้นทางการติดตั้งโดยตรงที่รองรับ แพ็กเกจ Plugin
`@openclaw/*` ที่ OpenClaw เป็นเจ้าของกลับมาเผยแพร่บน npm อีกครั้งแล้ว โปรดดูรายการปัจจุบัน
ที่ [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) หรือ
[รายการ Plugin](/th/plugins/plugin-inventory) การติดตั้งรุ่นเสถียรใช้ `latest`
การติดตั้งและอัปเดตในช่องทางเบต้าจะเลือกใช้ dist-tag `beta` ของ npm เมื่อมี
และใช้ `latest` เป็นทางเลือกสำรอง ในช่องทางเสถียรระยะยาว Plugin npm อย่างเป็นทางการ
ที่มีเจตนาแบบเปล่า/ค่าเริ่มต้นหรือ `latest` จะถูกแก้ไขเป็นเวอร์ชันแกนหลัก
ที่ติดตั้งไว้แบบตรงกันทุกประการ การตรึงแบบตรงตัวและแท็กที่ไม่ใช่ `latest` ซึ่งระบุไว้อย่างชัดเจน แพ็กเกจของบุคคลที่สาม และ
แหล่งที่ไม่ใช่ npm จะไม่ถูกเขียนใหม่
</Note>

<AccordionGroup>
  <Accordion title="การ include การกำหนดค่าและการซ่อมแซมการกำหนดค่าที่ไม่ถูกต้อง">
    หากส่วน `plugins` รองรับด้วย `$include` แบบไฟล์เดียว การดำเนินการ `plugins install/update/enable/disable/uninstall` จะเขียนผ่านไปยังไฟล์ที่ include นั้นและไม่แตะต้อง `openclaw.json` การ include ที่ระดับราก อาร์เรย์ของ include และ include ที่มีการแทนค่าระดับเดียวกันจะล้มเหลวแบบปิดแทนการทำให้แบนราบ โปรดดู [การ include การกำหนดค่า](/th/gateway/configuration) สำหรับรูปแบบที่รองรับ

    หากการกำหนดค่าไม่ถูกต้องระหว่างการติดตั้ง โดยปกติ `plugins install` จะล้มเหลวแบบปิดและแจ้งให้เรียกใช้ `openclaw doctor --fix` ก่อน ระหว่างการเริ่มต้น Gateway และการโหลดซ้ำแบบทันที การกำหนดค่า Plugin ที่ไม่ถูกต้องจะล้มเหลวแบบปิดเช่นเดียวกับการกำหนดค่าที่ไม่ถูกต้องอื่น ๆ โดย `openclaw doctor --fix` สามารถกักกันรายการ Plugin ที่ไม่ถูกต้องได้ ข้อยกเว้นระหว่างการติดตั้งที่มีการบันทึกไว้เพียงกรณีเดียวคือเส้นทางการกู้คืน Plugin ที่รวมมาในชุดแบบจำกัด สำหรับ Plugin ที่เลือกใช้ `openclaw.install.allowInvalidConfigRecovery` อย่างชัดเจน

  </Accordion>
  <Accordion title="การยืนยันด้วย --force และการติดตั้งซ้ำเทียบกับการอัปเดต">
    `--force` ยืนยันแหล่งที่ไม่ใช่ ClawHub โดยไม่ถาม ไม่ได้ข้าม `security.installPolicy` หรือการตรวจสอบความปลอดภัยในการติดตั้งที่เหลือ เมื่อ Plugin หรือแพ็ก hook ติดตั้งอยู่แล้ว คำสั่งนี้จะใช้เป้าหมายเดิมซ้ำและเขียนทับในตำแหน่งเดิมด้วย ใช้หลังจากตรวจสอบแหล่งจาก npm ใด ๆ, ภายในเครื่อง, ไฟล์บีบอัด, git หรือมาร์เก็ตเพลสแล้ว หรือเมื่อตั้งใจติดตั้ง id เดิมซ้ำ สำหรับการอัปเกรด Plugin npm ที่ติดตามอยู่แล้วตามปกติ ให้เลือกใช้ `openclaw plugins update <id-or-npm-spec>`

    หากเรียกใช้ `plugins install` กับ id ของ Plugin ที่ติดตั้งอยู่แล้ว OpenClaw จะหยุดและแนะนำให้ใช้ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติ หรือ `plugins install <package> --force` เมื่อต้องการเขียนทับการติดตั้งปัจจุบันจากแหล่งอื่นจริง ๆ แหล่งใด ๆ ยังคงแสดงคำเตือนที่มาของแหล่งแบบโต้ตอบ ส่วนการติดตั้งแบบไม่โต้ตอบต้องส่ง `--force` หลังการตรวจสอบ แหล่ง ClawHub และแค็ตตาล็อก OpenClaw ที่เชื่อถือได้ไม่จำเป็นต้องใช้แฟล็กนี้ เมื่อใช้ `--link` นั้น `--force` จะยืนยันแหล่งที่มาแต่ไม่เปลี่ยนโหมดการติดตั้งด้วยพาธที่ลิงก์ไว้

  </Accordion>
  <Accordion title="ขอบเขตของ --pin">
    `--pin` ใช้กับการติดตั้ง npm เท่านั้นและบันทึก `<name>@<version>` ที่แก้ไขเป็นค่าตรงตัว ไม่รองรับการติดตั้งด้วย `git:` (ให้ตรึง ref ในข้อกำหนดแทน เช่น `git:github.com/acme/plugin@v1.2.3`) หรือด้วย `--marketplace` (การติดตั้งจากมาร์เก็ตเพลสจะเก็บข้อมูลเมตาแหล่งที่มาของมาร์เก็ตเพลสแทนข้อกำหนด npm)
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` เลิกใช้งานแล้วและขณะนี้ไม่ดำเนินการใด ๆ OpenClaw จะไม่เรียกใช้การบล็อกโค้ดอันตรายระหว่างการติดตั้งแบบในตัวสำหรับการติดตั้ง Plugin อีกต่อไป

    ใช้พื้นผิว `security.installPolicy` ที่ผู้ดำเนินการเป็นเจ้าของเมื่อจำเป็นต้องใช้นโยบายการติดตั้งเฉพาะโฮสต์ ฮุก `before_install` ของ Plugin เป็นฮุกวงจรชีวิตของรันไทม์ Plugin ไม่ใช่ขอบเขตนโยบายหลักสำหรับการติดตั้งผ่าน CLI

    หาก Plugin ที่เผยแพร่บน ClawHub ถูกซ่อนหรือบล็อกโดยการสแกนรีจิสทรี ให้ทำตามขั้นตอนสำหรับผู้เผยแพร่ใน [การเผยแพร่บน ClawHub](/th/clawhub/publishing) `--dangerously-force-unsafe-install` จะไม่ขอให้ ClawHub สแกน Plugin อีกครั้งหรือทำให้รุ่นที่ถูกบล็อกเป็นสาธารณะ

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    การติดตั้งจาก ClawHub ชุมชนจะตรวจสอบบันทึกความน่าเชื่อถือของรุ่นที่เลือกก่อนดาวน์โหลด หาก ClawHub ปิดใช้การดาวน์โหลดสำหรับรุ่นนั้น รายงานผลการสแกนที่พบอันตราย หรือกำหนดให้รุ่นนั้นอยู่ในสถานะการกลั่นกรองที่บล็อก (ถูกกักกัน ถูกเพิกถอน) OpenClaw จะปฏิเสธโดยเด็ดขาดไม่ว่าจะใช้แฟล็กนี้หรือไม่ สำหรับสถานะการสแกนที่มีความเสี่ยงหรือสถานะการกลั่นกรองที่ไม่บล็อก OpenClaw จะแสดงรายละเอียดความน่าเชื่อถือและขอการยืนยันก่อนดำเนินการต่อ

    ใช้ `--acknowledge-clawhub-risk` หลังจากตรวจสอบคำเตือนจาก ClawHub และตัดสินใจดำเนินการต่อโดยไม่ใช้พรอมต์แบบโต้ตอบเท่านั้น ผลการสแกนที่รอดำเนินการหรือล้าสมัย (ยังไม่ยืนยันว่าปลอดภัย) จะแสดงคำเตือนแต่ไม่จำเป็นต้องรับทราบ แพ็กเกจ ClawHub อย่างเป็นทางการและแหล่งที่มาของ Plugin OpenClaw ที่รวมมาให้จะข้ามการตรวจสอบความน่าเชื่อถือของรุ่นนี้ทั้งหมด

  </Accordion>
  <Accordion title="แพ็กฮุกและข้อกำหนด npm">
    `plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับแพ็กฮุกที่เปิดเผย `openclaw.hooks` ใน `package.json` ใช้ `openclaw hooks` สำหรับการมองเห็นฮุกแบบกรองและการเปิดใช้รายฮุก ไม่ใช่สำหรับการติดตั้งแพ็กเกจ

    ข้อกำหนด Npm รองรับ **เฉพาะรีจิสทรี** (ชื่อแพ็กเกจพร้อม **เวอร์ชันที่แน่นอน** หรือ **dist-tag** ซึ่งเป็นทางเลือก) ระบบจะปฏิเสธข้อกำหนด Git/URL/ไฟล์และช่วง semver การติดตั้งการพึ่งพาจะทำงานในโปรเจกต์ npm ที่จัดการแยกต่อ Plugin หนึ่งรายการโดยใช้ `--ignore-scripts` เพื่อความปลอดภัย แม้ว่าเชลล์จะมีการตั้งค่าการติดตั้ง npm ส่วนกลางก็ตาม โปรเจกต์ npm ของ Plugin ที่จัดการจะสืบทอด `overrides` ระดับแพ็กเกจ npm ของ OpenClaw ดังนั้นการตรึงด้านความปลอดภัยของโฮสต์จึงมีผลกับการพึ่งพาของ Plugin ที่ถูกยกระดับขึ้นด้วย

    ใช้ `npm:<package>` เพื่อระบุการแก้ไข npm อย่างชัดเจน ข้อกำหนดแพ็กเกจเปล่าจะติดตั้งโดยตรงจาก npm ในช่วงเปลี่ยนผ่านการเปิดตัวด้วย เว้นแต่จะตรงกับรหัส Plugin อย่างเป็นทางการ

    ข้อกำหนด `@openclaw/*` แบบดิบที่ตรงกับ Plugin ที่รวมมาให้ จะถูกแก้ไขเป็นสำเนาที่รวมมากับอิมเมจก่อนใช้ npm เป็นทางเลือกสำรอง ตัวอย่างเช่น `openclaw plugins install @openclaw/discord@2026.5.20 --pin` จะใช้ Plugin Discord ที่รวมมากับบิลด์ OpenClaw ปัจจุบันแทนการสร้างการแทนที่ npm ที่จัดการ หากต้องการบังคับใช้แพ็กเกจ npm ภายนอก ให้ใช้ `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`

    ข้อกำหนดเปล่าและ `@latest` จะคงอยู่ในสายเสถียร เวอร์ชันแก้ไขของ OpenClaw ที่ประทับวันที่ เช่น `2026.5.3-1` จะนับเป็นเวอร์ชันเสถียรสำหรับการตรวจสอบนี้ หาก npm แก้ไขรูปแบบใดรูปแบบหนึ่งเป็นรุ่นก่อนเผยแพร่ OpenClaw จะหยุดและขอให้เลือกเข้าร่วมอย่างชัดเจนด้วยแท็กรุ่นก่อนเผยแพร่ (`@beta`/`@rc`) หรือเวอร์ชันก่อนเผยแพร่ที่แน่นอน (`@1.2.3-beta.4`)

    สำหรับการติดตั้ง npm ที่ไม่มีเวอร์ชันแน่นอน (`npm:<package>` หรือ `npm:<package>@latest`) OpenClaw จะตรวจสอบข้อมูลเมตาของแพ็กเกจที่แก้ไขได้ก่อนติดตั้ง หากแพ็กเกจเสถียรล่าสุดต้องใช้ API Plugin OpenClaw ที่ใหม่กว่าหรือเวอร์ชันโฮสต์ขั้นต่ำที่สูงกว่า OpenClaw จะตรวจสอบเวอร์ชันเสถียรที่เก่ากว่าและติดตั้งรุ่นที่เข้ากันได้ใหม่ที่สุดแทน เวอร์ชันที่แน่นอนและ dist-tag ที่ระบุชัดเจนยังคงเคร่งครัด: การเลือกที่เข้ากันไม่ได้จะล้มเหลวและขอให้อัปเกรด OpenClaw หรือเลือกเวอร์ชันที่เข้ากันได้

    หากข้อกำหนดการติดตั้งเปล่าตรงกับรหัส Plugin อย่างเป็นทางการ (เช่น `diffs`) OpenClaw จะติดตั้งรายการแค็ตตาล็อกโดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่มีชื่อเดียวกัน ให้ใช้ข้อกำหนดแบบมีสโคปอย่างชัดเจน (เช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="ที่เก็บ Git">
    ใช้ `git:<repo>` เพื่อติดตั้งโดยตรงจากที่เก็บ git รูปแบบที่รองรับ: `git:github.com/owner/repo`, `git:owner/repo`, `https://` แบบเต็ม, `ssh://`, `git://`, `file://` และ URL โคลน `git@host:owner/repo.git` เพิ่ม `@<ref>` หรือ `#<ref>` เพื่อเช็กเอาต์สาขา แท็ก หรือคอมมิตก่อนติดตั้ง

    การติดตั้งผ่าน Git จะโคลนลงในไดเรกทอรีชั่วคราว เช็กเอาต์ ref ที่ร้องขอหากมี จากนั้นใช้ตัวติดตั้งไดเรกทอรี Plugin ตามปกติ ดังนั้นการตรวจสอบแมนิเฟสต์ นโยบายการติดตั้งของผู้ดำเนินการ งานติดตั้งของตัวจัดการแพ็กเกจ และบันทึกการติดตั้งจะทำงานเหมือนการติดตั้งผ่าน npm การติดตั้ง git ที่บันทึกไว้จะรวม URL/ref ต้นทางและคอมมิตที่แก้ไขได้ เพื่อให้ `openclaw plugins update` สามารถแก้ไขต้นทางใหม่ได้ภายหลัง

    หลังจากติดตั้งจาก git ให้ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อตรวจสอบการลงทะเบียนรันไทม์ เช่น เมธอด Gateway และคำสั่ง CLI หาก Plugin ลงทะเบียนราก CLI ด้วย `api.registerCli` ให้เรียกใช้คำสั่งนั้นโดยตรงผ่าน CLI รากของ OpenClaw เช่น `openclaw demo-plugin ping`

  </Accordion>
  <Accordion title="ไฟล์เก็บถาวร">
    ไฟล์เก็บถาวรที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` ไฟล์เก็บถาวร Plugin OpenClaw แบบเนทีฟต้องมี `openclaw.plugin.json` ที่ถูกต้องที่ราก Plugin หลังแตกไฟล์ ระบบจะปฏิเสธไฟล์เก็บถาวรที่มีเพียง `package.json` ก่อนที่ OpenClaw จะเขียนบันทึกการติดตั้ง

    ใช้ `npm-pack:<path.tgz>` เมื่อไฟล์เป็น tarball แบบ npm-pack และต้องการ
    ใช้เส้นทางโปรเจกต์ npm ที่จัดการแยกต่อ Plugin แบบเดียวกับที่ใช้ในการติดตั้งจากรีจิสทรี
    ซึ่งรวมถึงการตรวจสอบ `package-lock.json` การสแกนการพึ่งพาที่ถูกยกระดับขึ้น
    และบันทึกการติดตั้ง npm เส้นทางไฟล์เก็บถาวรธรรมดาจะยังคงติดตั้งเป็น
    ไฟล์เก็บถาวรภายในเครื่องใต้รากส่วนขยาย Plugin

    รองรับการติดตั้งจากมาร์เก็ตเพลส Claude ด้วย

  </Accordion>
</AccordionGroup>

การติดตั้งจาก ClawHub ใช้ตัวระบุตำแหน่ง `clawhub:<package>` อย่างชัดเจน:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

ข้อกำหนด Plugin เปล่าที่ปลอดภัยสำหรับ npm จะติดตั้งจาก npm โดยค่าเริ่มต้นในช่วงเปลี่ยนผ่านการเปิดตัว เว้นแต่จะตรงกับรหัส Plugin อย่างเป็นทางการ:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อระบุการแก้ไขเฉพาะ npm อย่างชัดเจน:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw จะตรวจสอบความเข้ากันได้ของ API Plugin / Gateway ขั้นต่ำที่ประกาศไว้ก่อนติดตั้ง เมื่อเวอร์ชัน ClawHub ที่เลือกเผยแพร่อาร์ติแฟกต์ ClawPack OpenClaw จะดาวน์โหลด npm-pack `.tgz` ที่ระบุเวอร์ชัน ตรวจสอบส่วนหัวไดเจสต์ของ ClawHub และไดเจสต์ของอาร์ติแฟกต์ จากนั้นติดตั้งผ่านเส้นทางไฟล์เก็บถาวรตามปกติ เวอร์ชัน ClawHub รุ่นเก่าที่ไม่มีข้อมูลเมตา ClawPack จะยังคงติดตั้งผ่านเส้นทางตรวจสอบไฟล์เก็บถาวรแพ็กเกจแบบเดิม การติดตั้งที่บันทึกไว้จะเก็บข้อมูลเมตาต้นทาง ClawHub ชนิดอาร์ติแฟกต์ ค่า integrity ของ npm ค่า shasum ของ npm ชื่อ tarball และข้อมูลไดเจสต์ ClawPack สำหรับการอัปเดตภายหลัง
การติดตั้ง ClawHub ที่ไม่ระบุเวอร์ชันจะเก็บข้อกำหนดที่บันทึกไว้แบบไม่ระบุเวอร์ชัน เพื่อให้ `openclaw plugins update` ติดตามรุ่น ClawHub ที่ใหม่กว่าได้ ส่วนตัวเลือกเวอร์ชันหรือแท็กที่ระบุชัดเจน เช่น `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` จะยังคงตรึงอยู่กับตัวเลือกนั้น

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
    - รากมาร์เก็ตเพลสภายในเครื่องหรือเส้นทาง `marketplace.json`
    - รูปแบบย่อของที่เก็บ GitHub เช่น `owner/repo`
    - URL ที่เก็บ GitHub เช่น `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="กฎของมาร์เก็ตเพลสระยะไกล">
    สำหรับมาร์เก็ตเพลสระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องอยู่ภายในที่เก็บมาร์เก็ตเพลสที่โคลนมา OpenClaw ยอมรับต้นทางแบบเส้นทางสัมพัทธ์จากที่เก็บนั้น และปฏิเสธต้นทาง Plugin แบบ HTTP(S), เส้นทางสัมบูรณ์, git, GitHub และต้นทางอื่นที่ไม่ใช่เส้นทางจากแมนิเฟสต์ระยะไกล
  </Tab>
</Tabs>

สำหรับเส้นทางและไฟล์เก็บถาวรภายในเครื่อง OpenClaw จะตรวจหาโดยอัตโนมัติ:

- Plugin OpenClaw แบบเนทีฟ (`openclaw.plugin.json`)
- บันเดิลที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- บันเดิลที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือโครงร่างคอมโพเนนต์ Claude เริ่มต้นเมื่อไม่มีไฟล์แมนิเฟสต์นั้น)
- บันเดิลที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

การติดตั้งภายในเครื่องที่จัดการต้องเป็นไดเรกทอรีหรือไฟล์เก็บถาวรของ Plugin ไฟล์ Plugin `.js`,
`.mjs`, `.cjs` และ `.ts` แบบเดี่ยวจะไม่ถูกคัดลอกไปยังราก Plugin
ที่จัดการโดย `plugins install` และจะไม่ถูกโหลดจากการวางโดยตรงใน
`~/.openclaw/extensions` หรือ `<workspace>/.openclaw/extensions`; รากที่ตรวจพบโดยอัตโนมัติเหล่านั้น
จะโหลดไดเรกทอรีแพ็กเกจหรือบันเดิลของ Plugin และข้ามไฟล์สคริปต์ระดับบนสุดที่เป็นตัวช่วยภายในเครื่อง ระบุไฟล์เดี่ยว
อย่างชัดเจนใน `plugins.load.paths` แทน

<Note>
บันเดิลที่เข้ากันได้จะติดตั้งลงในราก Plugin ตามปกติและเข้าร่วมขั้นตอนแสดงรายการ/ข้อมูล/เปิดใช้/ปิดใช้แบบเดียวกัน ปัจจุบันรองรับ Skills ของบันเดิล, Skills แบบคำสั่งของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` ของ Claude / ค่าเริ่มต้น `lspServers` ที่ประกาศในแมนิเฟสต์, Skills แบบคำสั่งของ Cursor และไดเรกทอรีฮุก Codex ที่เข้ากันได้ ส่วนความสามารถอื่นของบันเดิลที่ตรวจพบจะแสดงในข้อมูลการวินิจฉัย/ข้อมูล แต่ยังไม่ได้เชื่อมต่อเข้ากับการทำงานของรันไทม์
</Note>

ใช้ `-l`/`--link` เพื่อชี้ไปยังไดเรกทอรี Plugin ภายในเครื่องโดยไม่คัดลอก (เพิ่ม
ไปยัง `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

ไม่รองรับ `--link` กับการติดตั้ง `--marketplace` หรือ `git:` และ
ต้องใช้เส้นทางภายในเครื่องที่มีอยู่แล้ว สำหรับลิงก์ภายในเครื่องแบบไม่โต้ตอบ
ให้ส่ง `--force` หลังจากตรวจสอบต้นทางแล้ว ซึ่งเป็นการยืนยันแหล่งที่มาแต่จะไม่
คัดลอกหรือเขียนทับไดเรกทอรีที่ลิงก์ไว้

<Note>
Plugin ที่มีต้นทางจากเวิร์กสเปซซึ่งตรวจพบจากรากส่วนขยายของเวิร์กสเปซจะไม่ถูก
นำเข้าหรือเรียกใช้จนกว่าจะเปิดใช้อย่างชัดเจน สำหรับการพัฒนาภายในเครื่อง
ให้เรียกใช้ `openclaw plugins enable <plugin-id>` หรือตั้งค่า
`plugins.entries.<plugin-id>.enabled: true`; หากการกำหนดค่าใช้
`plugins.allow` ให้รวมรหัส Plugin เดียวกันไว้ในนั้นด้วย กฎปฏิเสธโดยค่าเริ่มต้นนี้
ยังมีผลเมื่อการตั้งค่าช่องทางกำหนดเป้าหมาย Plugin ที่มีต้นทางจากเวิร์กสเปซอย่างชัดเจนเพื่อ
โหลดเฉพาะการตั้งค่า ดังนั้นโค้ดการตั้งค่า Plugin ช่องทางภายในเครื่องจะไม่ทำงานขณะที่
Plugin ในเวิร์กสเปซนั้นยังปิดใช้อยู่หรือถูกยกเว้นจากรายการที่อนุญาต การติดตั้งแบบลิงก์
และรายการ `plugins.load.paths` ที่ระบุชัดเจนจะใช้นโยบายปกติสำหรับ
ต้นทาง Plugin ที่แก้ไขได้ ดู
[กำหนดค่านโยบาย Plugin](/th/tools/plugin#configure-plugin-policy)
และ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#plugins)

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึกข้อกำหนดที่แน่นอนซึ่งแก้ไขได้ (`name@version`) ในดัชนี Plugin ที่จัดการ โดยยังคงพฤติกรรมเริ่มต้นแบบไม่ตรึงไว้
</Note>

## แสดงรายการ

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  แสดงเฉพาะ Plugin ที่เปิดใช้
</ParamField>
<ParamField path="--verbose" type="boolean">
  เปลี่ยนจากมุมมองตารางเป็นบรรทัดรายละเอียดราย Plugin พร้อมข้อมูลเมตารูปแบบ/ต้นทาง/แหล่งกำเนิด/เวอร์ชัน/การเปิดใช้งาน
</ParamField>
<ParamField path="--json" type="boolean">
  รายการสินค้าคงคลังที่เครื่องอ่านได้ พร้อมข้อมูลวินิจฉัยรีจิสทรีและสถานะการติดตั้งการพึ่งพาของแพ็กเกจ
</ParamField>

<Note>
`plugins list` จะอ่านรีจิสทรี Plugin ภายในเครื่องที่คงอยู่ก่อน โดยมีทางเลือกสำรองที่สร้างจากไฟล์ manifest เท่านั้นเมื่อรีจิสทรีสูญหายหรือไม่ถูกต้อง ซึ่งมีประโยชน์สำหรับตรวจสอบว่า Plugin ได้รับการติดตั้ง เปิดใช้งาน และมองเห็นได้ในการวางแผนเริ่มต้นแบบ cold startup หรือไม่ แต่ไม่ใช่การตรวจสอบรันไทม์แบบสดของกระบวนการ Gateway ที่กำลังทำงานอยู่ หลังจากเปลี่ยนโค้ด Plugin การเปิดใช้งาน นโยบาย hook หรือ `plugins.load.paths` ให้รีสตาร์ต Gateway ที่ให้บริการช่องทางนั้นก่อนคาดหวังให้โค้ดหรือ hook ใหม่ของ `register(api)` ทำงาน สำหรับการปรับใช้ระยะไกล/คอนเทนเนอร์ ให้ตรวจสอบว่ากำลังรีสตาร์ตโปรเซสลูก `openclaw gateway run` จริง ไม่ใช่เพียงโปรเซส wrapper

`plugins list --json` รวม `dependencyStatus` ของแต่ละ Plugin จาก `package.json`
`dependencies` และ `optionalDependencies` OpenClaw ตรวจสอบว่ามีชื่อแพ็กเกจเหล่านั้น
อยู่ตามพาธค้นหา Node `node_modules` ปกติของ Plugin หรือไม่ โดยจะไม่นำเข้า
โค้ดรันไทม์ของ Plugin เรียกใช้ตัวจัดการแพ็กเกจ หรือซ่อมแซม dependency
ที่ขาดหาย
</Note>

หากบันทึกการเริ่มต้นแสดง `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
ให้เรียกใช้ `openclaw plugins list --enabled --verbose` หรือ
`openclaw plugins inspect <id>` พร้อมรหัส Plugin ที่แสดงในรายการ เพื่อยืนยันรหัส
Plugin และคัดลอกรหัสที่เชื่อถือได้ไปยัง `plugins.allow` ใน `openclaw.json`
เมื่อคำเตือนสามารถแสดง Plugin ที่ค้นพบได้ทั้งหมด ระบบจะพิมพ์ส่วนย่อย
`plugins.allow` ที่พร้อมวางและมีรหัสเหล่านั้นรวมอยู่แล้ว หากโหลด Plugin
โดยไม่มีที่มาของการติดตั้ง/พาธโหลด ให้ตรวจสอบรหัส Plugin นั้น แล้วตรึง
รหัสที่เชื่อถือได้ใน `plugins.allow` หรือติดตั้ง Plugin ใหม่จากแหล่งที่เชื่อถือได้
เพื่อให้ OpenClaw บันทึกที่มาของการติดตั้ง

สำหรับการทำงานกับ Plugin ที่รวมมาให้ภายในอิมเมจ Docker แบบแพ็กเกจ ให้ bind mount
ไดเรกทอรีซอร์สของ Plugin ทับพาธซอร์สในแพ็กเกจที่ตรงกัน เช่น
`/app/extensions/synology-chat` OpenClaw จะค้นพบซอร์ส overlay ที่ mount ไว้นั้น
ก่อน `/app/dist/extensions/synology-chat` ส่วนไดเรกทอรีซอร์สที่คัดลอกไว้เฉย ๆ
จะไม่ทำงาน ดังนั้นการติดตั้งแบบแพ็กเกจตามปกติจะยังคงใช้ dist ที่คอมไพล์แล้ว

สำหรับการดีบัก hook ของรันไทม์:

- `openclaw plugins inspect <id> --runtime --json` แสดง hook ที่ลงทะเบียนและการวินิจฉัยจากรอบการตรวจสอบที่โหลดโมดูล การตรวจสอบรันไทม์จะไม่ติดตั้ง dependency ให้ใช้ `openclaw doctor --fix` เพื่อล้างสถานะ dependency แบบเก่า หรือกู้คืน Plugin ที่ดาวน์โหลดได้ซึ่งขาดหายและถูกอ้างอิงโดยการกำหนดค่า
- `openclaw gateway status --deep --require-rpc` ยืนยัน URL/โปรไฟล์ Gateway ที่เข้าถึงได้ คำแนะนำเกี่ยวกับบริการ/โปรเซส พาธการกำหนดค่า และสถานะ RPC
- hook การสนทนาที่ไม่ได้รวมมาให้ (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`

### ดัชนี Plugin

ข้อมูลเมตาการติดตั้ง Plugin เป็นสถานะที่เครื่องจัดการ ไม่ใช่การกำหนดค่าของผู้ใช้ การติดตั้งและการอัปเดตจะเขียนข้อมูลนี้ลงในฐานข้อมูลสถานะ SQLite ที่ใช้ร่วมกันภายใต้ไดเรกทอรีสถานะ OpenClaw ที่ใช้งานอยู่ แถว `installed_plugin_index` จัดเก็บข้อมูลเมตา `installRecords` แบบถาวร รวมถึงระเบียนของ manifest Plugin ที่เสียหายหรือสูญหาย ตลอดจนแคชรีจิสทรีแบบ cold ที่สร้างจาก manifest ซึ่งใช้โดย `openclaw plugins update` การถอนการติดตั้ง การวินิจฉัย และรีจิสทรี Plugin แบบ cold

`plugins.installs` เป็นพื้นผิวการกำหนดค่าที่เขียนขึ้นซึ่งเลิกใช้งานแล้ว คำสั่งรันไทม์และอัปเดตจะอ่านเฉพาะดัชนี Plugin ที่ติดตั้งใน SQLite เท่านั้น เรียกใช้ `openclaw doctor --fix` เพื่อนำเข้าระเบียนการกำหนดค่าแบบเก่าเข้าสู่ดัชนี และลบคีย์ที่เลิกใช้งานก่อนใช้งานรันไทม์ตามปกติ

## ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` จะลบระเบียน Plugin ออกจาก `plugins.entries` ดัชนี Plugin ที่คงอยู่ รายการอนุญาต/ปฏิเสธ Plugin และรายการ `plugins.load.paths` ที่เชื่อมโยงเมื่อเกี่ยวข้อง เว้นแต่ตั้งค่า `--keep-files` การถอนการติดตั้งจะลบไดเรกทอรีติดตั้งแบบจัดการที่ติดตามไว้ด้วย แต่เฉพาะเมื่อพาธที่ได้อยู่ภายในรูท extensions ของ Plugin ของ OpenClaw หาก Plugin เป็นเจ้าของสล็อต `memory` หรือ `contextEngine` อยู่ในขณะนั้น สล็อตดังกล่าวจะรีเซ็ตเป็นค่าเริ่มต้น (`memory-core` สำหรับหน่วยความจำ และ `legacy` สำหรับกลไกบริบท)

`uninstall` จะแสดงตัวอย่างสิ่งที่จะถูกลบ จากนั้นถาม `Uninstall plugin "<id>"?` ก่อนทำการเปลี่ยนแปลง ส่ง `--force` เพื่อข้ามข้อความยืนยัน (มีประโยชน์สำหรับสคริปต์และการเรียกใช้แบบไม่โต้ตอบ) หากไม่มีตัวเลือกนี้ การถอนการติดตั้งต้องใช้ TTY แบบโต้ตอบ `--dry-run` จะแสดงตัวอย่างเดียวกันและออกโดยไม่ถามหรือเปลี่ยนแปลงสิ่งใด

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

การอัปเดตใช้กับการติดตั้ง Plugin ที่ติดตามในดัชนี Plugin แบบจัดการ และการติดตั้งชุด hook ที่ติดตามใน `hooks.internal.installs` โดยจะใช้แหล่งที่ผู้ใช้เลือกไว้แล้วตอนติดตั้ง Plugin ซ้ำ จึงไม่ต้องยืนยันแหล่งอีกครั้ง

<AccordionGroup>
  <Accordion title="การแยกระหว่างรหัส Plugin กับข้อกำหนด npm">
    เมื่อส่งรหัส Plugin OpenClaw จะใช้ข้อกำหนดการติดตั้งที่บันทึกไว้ของ Plugin นั้นซ้ำ ซึ่งหมายความว่า dist-tag ที่จัดเก็บไว้ก่อนหน้า เช่น `@beta` และเวอร์ชันที่ตรึงแบบเจาะจง จะยังคงถูกใช้ในการเรียกใช้ `update <id>` ครั้งต่อ ๆ ไป

    ระหว่าง `update <id> --dry-run` การติดตั้ง npm ที่ตรึงเวอร์ชันแบบเจาะจงจะยังคงถูกตรึงไว้ หาก OpenClaw สามารถหา release line เริ่มต้นในรีจิสทรีของแพ็กเกจได้ด้วย และ release line เริ่มต้นนั้นใหม่กว่าเวอร์ชันที่ตรึงซึ่งติดตั้งอยู่ การทดลองแบบ dry run จะรายงานการตรึงและพิมพ์คำสั่งอัปเดตแพ็กเกจ `@latest` ที่ระบุชัดเจน เพื่อเปลี่ยนไปตาม release line เริ่มต้นของรีจิสทรี

    กฎการอัปเดตแบบเจาะจงนั้นแตกต่างจากพาธการบำรุงรักษาแบบกลุ่ม `openclaw plugins update --all` การอัปเดตแบบกลุ่มยังคงเคารพข้อกำหนดการติดตั้งที่ติดตามตามปกติ แต่ระเบียน Plugin ทางการของ OpenClaw ที่เชื่อถือได้สามารถซิงค์ไปยังเป้าหมายแค็ตตาล็อกทางการปัจจุบัน แทนที่จะคงอยู่ที่แพ็กเกจทางการแบบเจาะจงที่ล้าสมัย ใช้ `update <id>` แบบเจาะจงเมื่อจงใจต้องการคงข้อกำหนดทางการแบบเจาะจงหรือแบบมีแท็กไว้โดยไม่เปลี่ยนแปลง

    สำหรับการติดตั้ง npm ยังสามารถส่งข้อกำหนดแพ็กเกจ npm ที่ระบุ dist-tag หรือเวอร์ชันแบบเจาะจงได้ OpenClaw จะจับคู่ชื่อแพ็กเกจนั้นกลับไปยังระเบียน Plugin ที่ติดตาม อัปเดต Plugin ที่ติดตั้งนั้น และบันทึกข้อกำหนด npm ใหม่สำหรับการอัปเดตด้วยรหัสในอนาคต

    การส่งชื่อแพ็กเกจ npm โดยไม่มีเวอร์ชันหรือแท็ก จะจับคู่กลับไปยังระเบียน Plugin ที่ติดตามเช่นกัน ใช้วิธีนี้เมื่อ Plugin ถูกตรึงไว้ที่เวอร์ชันแบบเจาะจง และต้องการย้ายกลับไปยัง release line เริ่มต้นของรีจิสทรี

  </Accordion>
  <Accordion title="การอัปเดตช่องทางเบตา">
    `openclaw plugins update <id-or-npm-spec>` แบบเจาะจงจะใช้ข้อกำหนด Plugin ที่ติดตามซ้ำ เว้นแต่จะส่งข้อกำหนดใหม่ `openclaw plugins update --all` แบบกลุ่มจะใช้ `update.channel` ที่กำหนดค่าไว้ เมื่อซิงค์ระเบียน Plugin ทางการที่เชื่อถือได้กับเป้าหมายแค็ตตาล็อกทางการ เพื่อให้การติดตั้งจากช่องทางเบตาคงอยู่บน release line เบตาได้ แทนที่จะถูกปรับเป็น stable/latest โดยไม่แจ้ง

    `openclaw update` ยังรับรู้ช่องทางอัปเดต OpenClaw ที่ใช้งานอยู่ด้วย โดยในช่องทางเบตา ระเบียน Plugin npm และ ClawHub ที่ใช้ release line เริ่มต้นจะลอง `@beta` ก่อน หากไม่มีรุ่นเบตาของ Plugin ระบบจะกลับไปใช้ข้อกำหนด default/latest ที่บันทึกไว้ และ Plugin npm จะกลับไปใช้ข้อกำหนดดังกล่าวเช่นกันเมื่อมีแพ็กเกจเบตาแต่ไม่ผ่านการตรวจสอบการติดตั้ง ระบบจะรายงานการกลับไปใช้ตัวเลือกสำรองนี้เป็นคำเตือน และจะไม่ทำให้การอัปเดตแกนหลักล้มเหลว เวอร์ชันแบบเจาะจงและแท็กที่ระบุชัดเจนจะยังคงถูกตรึงกับตัวเลือกนั้นสำหรับการอัปเดตแบบเจาะจง

  </Accordion>
  <Accordion title="การตรวจสอบเวอร์ชันและความคลาดเคลื่อนของความสมบูรณ์">
    ก่อนการอัปเดต npm แบบสด OpenClaw จะตรวจสอบเวอร์ชันแพ็กเกจที่ติดตั้งเทียบกับข้อมูลเมตาของรีจิสทรี npm หากเวอร์ชันที่ติดตั้งและตัวระบุอาร์ติแฟกต์ที่บันทึกไว้ตรงกับเป้าหมายที่หาได้อยู่แล้ว ระบบจะข้ามการอัปเดตโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน `openclaw.json` ใหม่

    เมื่อมีแฮชความสมบูรณ์ที่จัดเก็บไว้และแฮชอาร์ติแฟกต์ที่ดึงมาเปลี่ยนแปลง OpenClaw จะถือว่าเป็นความคลาดเคลื่อนของอาร์ติแฟกต์ npm คำสั่ง `openclaw plugins update` แบบโต้ตอบจะแสดงแฮชที่คาดไว้และแฮชจริง และขอการยืนยันก่อนดำเนินการต่อ ตัวช่วยอัปเดตแบบไม่โต้ตอบจะปฏิเสธโดยค่าเริ่มต้น เว้นแต่ผู้เรียกจะระบุนโยบายดำเนินการต่ออย่างชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install ในการอัปเดต">
    `--dangerously-force-unsafe-install` ยังคงใช้ได้กับ `plugins update` เพื่อความเข้ากันได้ แต่เลิกใช้แล้วและไม่เปลี่ยนพฤติกรรมการอัปเดต Plugin อีกต่อไป `security.installPolicy` ของผู้ปฏิบัติการยังสามารถบล็อกการอัปเดตได้ ส่วน hook `before_install` ของ Plugin จะมีผลเฉพาะในโปรเซสที่โหลด hook ของ Plugin เท่านั้น
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk ในการอัปเดต">
    การอัปเดต Plugin ชุมชนที่อ้างอิง ClawHub จะเรียกใช้การตรวจสอบความน่าเชื่อถือของรุ่นแบบเจาะจงเช่นเดียวกับการติดตั้ง ก่อนดาวน์โหลดแพ็กเกจทดแทน ใช้ `--acknowledge-clawhub-risk` สำหรับระบบอัตโนมัติที่ผ่านการตรวจสอบแล้วและควรดำเนินการต่อเมื่อรุ่น ClawHub ที่เลือกมีคำเตือนความน่าเชื่อถือที่มีความเสี่ยง แพ็กเกจ ClawHub ทางการและแหล่ง Plugin ที่รวมมากับ OpenClaw จะข้ามข้อความแจ้งความน่าเชื่อถือของรุ่นนี้
  </Accordion>
</AccordionGroup>

## ตรวจสอบ

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

การตรวจสอบจะแสดงข้อมูลระบุตัวตน สถานะการโหลด แหล่งที่มา ความสามารถใน manifest แฟล็กนโยบาย การวินิจฉัย ข้อมูลเมตาการติดตั้ง ความสามารถของ bundle และการรองรับเซิร์ฟเวอร์ MCP หรือ LSP ที่ตรวจพบ โดยค่าเริ่มต้นจะไม่นำเข้ารันไทม์ของ Plugin เอาต์พุต JSON มีสัญญา manifest ของ Plugin เช่น `contracts.agentToolResultMiddleware` และ `contracts.trustedToolPolicies` เพื่อให้ผู้ปฏิบัติการตรวจสอบการประกาศพื้นผิวที่เชื่อถือได้ก่อนเปิดใช้งานหรือรีสตาร์ต Plugin เพิ่ม `--runtime` เพื่อโหลดโมดูล Plugin และรวม hook เครื่องมือ คำสั่ง บริการ เมธอด Gateway และเส้นทาง HTTP ที่ลงทะเบียนไว้ การตรวจสอบรันไทม์จะรายงาน dependency ของ Plugin ที่ขาดหายโดยตรง ส่วนการติดตั้งและการซ่อมแซมยังคงอยู่ใน `openclaw plugins install`, `openclaw plugins update` และ `openclaw doctor --fix`

โดยปกติคำสั่ง CLI ที่ Plugin เป็นเจ้าของจะติดตั้งเป็นกลุ่มคำสั่ง `openclaw` ระดับรูท แต่ Plugin อาจลงทะเบียนคำสั่งซ้อนภายใต้คำสั่งหลักของแกน เช่น `openclaw nodes` ได้เช่นกัน หลังจาก `inspect --runtime` แสดงคำสั่งภายใต้ `cliCommands` ให้เรียกใช้คำสั่งนั้นตามพาธที่แสดง ตัวอย่างเช่น Plugin ที่ลงทะเบียน `demo-git` สามารถตรวจสอบได้ด้วย `openclaw demo-git ping`

Plugin แต่ละตัวจะถูกจำแนกตามสิ่งที่ลงทะเบียนจริงขณะรันไทม์:

| รูปแบบ               | ความหมาย                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | มีความสามารถเพียงหนึ่งประเภทเท่านั้น (เช่น Plugin ที่เป็นผู้ให้บริการเท่านั้น)         |
| `hybrid-capability` | มีความสามารถมากกว่าหนึ่งประเภท (เช่น ข้อความ + เสียงพูด + รูปภาพ)       |
| `hook-only`         | มีเฉพาะ hook โดยไม่มีความสามารถ เครื่องมือ คำสั่ง บริการ หรือเส้นทาง |
| `non-capability`    | มีเครื่องมือ/คำสั่ง/บริการ แต่ไม่มีความสามารถ                       |

ดูรายละเอียดเพิ่มเติมเกี่ยวกับโมเดลความสามารถได้ที่ [รูปแบบ Plugin](/th/plugins/architecture#plugin-shapes)

<Note>
แฟล็ก `--json` จะแสดงรายงานที่เครื่องอ่านได้ ซึ่งเหมาะสำหรับการเขียนสคริปต์และการตรวจสอบ `inspect --all` จะแสดงตารางทั่วทั้งระบบที่มีคอลัมน์รูปแบบ ชนิดความสามารถ ประกาศความเข้ากันได้ ความสามารถของ bundle และสรุป hook `info` เป็นนามแฝงของ `inspect`
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` รายงานข้อผิดพลาดในการโหลด Plugin การวินิจฉัย manifest/การค้นพบ ประกาศความเข้ากันได้ และการอ้างอิงการกำหนดค่า Plugin ที่ล้าสมัย เช่น สล็อต Plugin ที่ขาดหาย เมื่อโครงสร้างการติดตั้งและการกำหนดค่า Plugin ไม่มีปัญหา ระบบจะแสดง `No plugin issues detected.` หากยังมีการกำหนดค่าที่ล้าสมัย แต่โครงสร้างการติดตั้งส่วนอื่นยังสมบูรณ์ ข้อมูลสรุปจะระบุเช่นนั้นแทนที่จะสื่อว่า Plugin สมบูรณ์ทั้งหมด

หากมี Plugin ที่กำหนดค่าไว้อยู่บนดิสก์แต่ถูกบล็อกโดยการตรวจสอบความปลอดภัยของพาธของตัวโหลด การตรวจสอบความถูกต้องของการกำหนดค่าจะเก็บรายการ Plugin ไว้และรายงานเป็น `present but blocked` ให้แก้ไขการวินิจฉัย Plugin ที่ถูกบล็อกก่อนหน้า เช่น ความเป็นเจ้าของพาธหรือสิทธิ์ที่อนุญาตให้ทุกคนเขียนได้ แทนการลบการกำหนดค่า `plugins.entries.<id>` หรือ `plugins.allow`

สำหรับความล้มเหลวด้านรูปแบบโมดูล เช่น ไม่มีการส่งออก `register`/`activate` ให้เรียกใช้อีกครั้งด้วย `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมข้อมูลสรุปรูปแบบการส่งออกแบบย่อไว้ในเอาต์พุตการวินิจฉัย

## รีจิสทรี

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

รีจิสทรี Plugin ภายในเครื่องคือโมเดลการอ่านแบบ cold read ที่ OpenClaw จัดเก็บไว้อย่างถาวรสำหรับข้อมูลประจำตัวของ Plugin ที่ติดตั้ง สถานะการเปิดใช้งาน เมทาดาทาแหล่งที่มา และความเป็นเจ้าของส่วนที่มีการสนับสนุน การเริ่มต้นตามปกติ การค้นหาเจ้าของผู้ให้บริการ การจำแนกการตั้งค่าช่องทาง และรายการคงคลัง Plugin สามารถอ่านข้อมูลนี้ได้โดยไม่ต้องนำเข้าโมดูลรันไทม์ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่ารีจิสทรีที่จัดเก็บไว้อย่างถาวรมีอยู่ เป็นปัจจุบัน หรือล้าสมัย ใช้ `--refresh` เพื่อสร้างใหม่จากดัชนี Plugin ที่จัดเก็บไว้อย่างถาวร นโยบายการกำหนดค่า และเมทาดาทาของไฟล์ manifest/แพ็กเกจ นี่เป็นเส้นทางการซ่อมแซม ไม่ใช่เส้นทางการเปิดใช้งานรันไทม์

`openclaw doctor --fix` ยังซ่อมแซมความคลาดเคลื่อนของ npm ที่มีการจัดการซึ่งอยู่ติดกับรีจิสทรีด้วย หากแพ็กเกจ `@openclaw/*` ที่กำพร้าหรือกู้คืนมาแล้วภายใต้โปรเจกต์ npm ของ Plugin ที่มีการจัดการหรือรูท npm แบบแบนดั้งเดิมที่มีการจัดการบดบัง Plugin ที่รวมมาให้ doctor จะลบแพ็กเกจเก่านั้นและสร้างรีจิสทรีใหม่ เพื่อให้การเริ่มต้นตรวจสอบกับ manifest ที่รวมมาให้ เมื่อระเบียนการติดตั้งที่มีอำนาจเลือกเจเนอเรชันที่มีการจัดการรายการหนึ่ง แต่ยังคงมีไดเรกทอรีแบบแบนหรือไดเรกทอรีเจเนอเรชันรุ่นเก่าอยู่ doctor จะปลดระวางโครงสร้างเก่าเหล่านั้นเพื่อให้ตัดทิ้งหลังจาก Gateway เริ่มทำงานใหม่ นอกจากนี้ doctor ยังเชื่อมโยงแพ็กเกจ `openclaw` ของโฮสต์ใหม่เข้ากับ Plugin npm ที่มีการจัดการซึ่งประกาศ `peerDependencies.openclaw` เพื่อให้การนำเข้ารันไทม์ภายในแพ็กเกจ เช่น `openclaw/plugin-sdk/*` สามารถแก้ไขได้หลังการอัปเดตหรือการซ่อมแซม npm

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

`plugins marketplace entries` แสดงรายการจากฟีดมาร์เก็ตเพลส OpenClaw ที่กำหนดค่าไว้ โดยค่าเริ่มต้นจะพยายามใช้ฟีดที่โฮสต์ไว้ และหากใช้ไม่ได้จะถอยกลับไปใช้สแนปช็อตล่าสุดที่ยอมรับแล้วหรือข้อมูลที่รวมมาให้ ใช้ `--feed-profile <name>` เพื่ออ่านโปรไฟล์ที่กำหนดค่าไว้รายการใดรายการหนึ่ง ใช้ `--feed-url <url>` เพื่ออ่าน URL ฟีดที่โฮสต์ไว้อย่างชัดเจน และใช้ `--offline` เพื่ออ่านสแนปช็อตล่าสุดที่ยอมรับแล้วโดยไม่ดึงข้อมูลฟีด

`plugins marketplace refresh` รีเฟรชสแนปช็อตของฟีดที่โฮสต์ไว้ซึ่งกำหนดค่าไว้ และรายงานว่า OpenClaw ยอมรับข้อมูลที่โฮสต์ไว้ สแนปช็อตที่โฮสต์ไว้ หรือข้อมูลสำรองที่รวมมาให้ ใช้ `--expected-sha256` เมื่อผู้เรียกต้องการให้คำสั่งล้มเหลว เว้นแต่เพย์โหลดใหม่จากโฮสต์จะตรงกับเช็กซัมที่ตรึงไว้

`list` ของมาร์เก็ตเพลสยอมรับพาธมาร์เก็ตเพลสภายในเครื่อง พาธ `marketplace.json` รูปแบบย่อของ GitHub เช่น `owner/repo` URL ของรีโพ GitHub หรือ URL ของ git ส่วน `--json` จะแสดงป้ายกำกับแหล่งที่มาที่แก้ไขแล้ว พร้อม manifest ของมาร์เก็ตเพลสที่แยกวิเคราะห์แล้วและรายการ Plugin

การรีเฟรชมาร์เก็ตเพลสจะโหลดฟีดมาร์เก็ตเพลส OpenClaw ที่โฮสต์ไว้และจัดเก็บ
การตอบกลับที่ผ่านการตรวจสอบแล้วเป็นสแนปช็อตฟีดที่โฮสต์ไว้ภายในเครื่อง หากไม่มีตัวเลือก ระบบจะใช้
โปรไฟล์ฟีดเริ่มต้นที่กำหนดค่าไว้ ใช้ `--feed-profile <name>` เพื่อรีเฟรช
โปรไฟล์ที่กำหนดค่าไว้รายการใดรายการหนึ่ง ใช้ `--feed-url <url>` เพื่อรีเฟรช URL
ฟีดที่โฮสต์ไว้อย่างชัดเจน ใช้ `--expected-sha256 <sha256>` เพื่อกำหนดให้เช็กซัมของเพย์โหลดตรงกัน
(`sha256:<hex>` หรือค่าแฮชฐานสิบหกความยาว 64 อักขระโดยไม่มีคำนำหน้า) และใช้ `--json` สำหรับ
เอาต์พุตที่เครื่องอ่านได้ URL ฟีดที่โฮสต์ไว้ซึ่งระบุอย่างชัดเจนต้องไม่มี
ข้อมูลรับรอง สตริงคำค้นหา หรือแฟรกเมนต์ การรีเฟรชที่ไม่ตรึงค่าสามารถรายงานผลลัพธ์เป็น
สแนปช็อตที่โฮสต์ไว้หรือข้อมูลสำรองที่รวมมาให้โดยไม่ทำให้คำสั่งล้มเหลว การรีเฟรชที่
ตรึงค่าจะล้มเหลว เว้นแต่จะยอมรับเพย์โหลดใหม่จากโฮสต์ และการรีเฟรชจากโฮสต์ที่
สำเร็จจะล้มเหลวหาก OpenClaw ไม่สามารถจัดเก็บสแนปช็อตที่ผ่านการตรวจสอบแล้วได้

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ข้อมูลอ้างอิง CLI](/th/cli)
- [ClawHub](/th/clawhub)
