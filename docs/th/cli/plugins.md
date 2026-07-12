---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือชุดรวมที่เข้ากันได้
    - คุณต้องการสร้างโครงเริ่มต้นหรือตรวจสอบความถูกต้องของ Plugin เครื่องมือแบบเรียบง่าย
    - คุณต้องการแก้ไขข้อบกพร่องของการโหลด Plugin ที่ล้มเหลว
sidebarTitle: Plugins
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw plugins` (เริ่มต้น, สร้าง, ตรวจสอบความถูกต้อง, แสดงรายการ, ติดตั้ง, มาร์เก็ตเพลส, ถอนการติดตั้ง, เปิดใช้งาน/ปิดใช้งาน, วินิจฉัย)
title: Plugin
x-i18n:
    generated_at: "2026-07-12T16:01:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 729e74103a302936dc45da3be31306803b16e9dae182e78b3742783b892a9027
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Plugin ของ Gateway, ชุดฮุก และบันเดิลที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="Plugin system" href="/th/tools/plugin">
    คู่มือสำหรับผู้ใช้ปลายทางเกี่ยวกับการติดตั้ง การเปิดใช้งาน และการแก้ไขปัญหา Plugin
  </Card>
  <Card title="Manage plugins" href="/th/plugins/manage-plugins">
    ตัวอย่างสั้น ๆ สำหรับการติดตั้ง แสดงรายการ อัปเดต ถอนการติดตั้ง และเผยแพร่
  </Card>
  <Card title="Plugin bundles" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของบันเดิล
  </Card>
  <Card title="Plugin manifest" href="/th/plugins/manifest">
    ฟิลด์ของไฟล์กำกับและสคีมาการกำหนดค่า
  </Card>
  <Card title="Security" href="/th/gateway/security">
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
openclaw plugins info <id>                    # alias for inspect
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

เมื่อตรวจสอบการติดตั้ง การตรวจรายละเอียด การถอนการติดตั้ง หรือการรีเฟรชรีจิสทรีที่ทำงานช้า ให้เรียกใช้คำสั่งโดยกำหนด `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` การติดตามจะเขียนระยะเวลาของแต่ละช่วงไปยัง stderr และยังคงทำให้เอาต์พุต JSON สามารถแยกวิเคราะห์ได้ ดู[การแก้ไขข้อบกพร่อง](/th/help/debugging#plugin-lifecycle-trace)

<Note>
ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) ไฟล์ `openclaw.json` จะเปลี่ยนแปลงไม่ได้ คำสั่ง `install`, `update`, `uninstall`, `enable` และ `disable` ทั้งหมดจะปฏิเสธการทำงาน ให้แก้ไขต้นทาง Nix สำหรับการติดตั้งนี้แทน (`programs.openclaw.config` หรือ `instances.<name>.config` สำหรับ nix-openclaw) แล้วสร้างใหม่ ดู[เริ่มต้นใช้งานฉบับเน้นเอเจนต์](https://github.com/openclaw/nix-openclaw#quick-start)
</Note>

<Note>
Plugin ที่รวมมาในชุดจะจัดส่งพร้อม OpenClaw บางรายการเปิดใช้งานโดยค่าเริ่มต้น (ตัวอย่างเช่น ผู้ให้บริการโมเดลที่รวมมาในชุด ผู้ให้บริการเสียงพูดที่รวมมาในชุด และ Plugin เบราว์เซอร์ที่รวมมาในชุด) ส่วนรายการอื่นต้องใช้ `plugins enable`

Plugin แบบเนทีฟของ OpenClaw จัดส่งไฟล์ `openclaw.plugin.json` พร้อมสคีมา JSON แบบอินไลน์ (`configSchema` แม้ว่าจะว่างก็ตาม) ส่วนบันเดิลที่เข้ากันได้จะใช้ไฟล์กำกับบันเดิลของตนเองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุตรายการแบบละเอียดและข้อมูลยังแสดงประเภทย่อยของบันเดิล (`codex`, `claude` หรือ `cursor`) พร้อมความสามารถของบันเดิลที่ตรวจพบ
</Note>

## การสร้าง

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

โดยค่าเริ่มต้น `plugins init` จะสร้าง Plugin เครื่องมือ TypeScript ขั้นต่ำ อาร์กิวเมนต์แรกคือรหัส Plugin ส่วน `--name` กำหนดชื่อที่ใช้แสดง OpenClaw ใช้รหัสนี้เป็นชื่อไดเรกทอรีเอาต์พุตเริ่มต้นและการตั้งชื่อแพ็กเกจ โครงเริ่มต้นของเครื่องมือใช้ `defineToolPlugin` และสร้างสคริปต์ `plugin:build` กับ `plugin:validate` ใน `package.json` ซึ่งจะสร้างแล้วเรียก `openclaw plugins build`/`validate`

`plugins build` จะนำเข้าจุดเริ่มต้นที่สร้างแล้ว อ่านข้อมูลเมตาของเครื่องมือแบบคงที่ เขียน `openclaw.plugin.json` และทำให้ `openclaw.extensions` ใน `package.json` สอดคล้องกันอยู่เสมอ `plugins validate` ตรวจสอบว่าไฟล์กำกับที่สร้างขึ้น ข้อมูลเมตาของแพ็กเกจ และการส่งออกจากจุดเริ่มต้นปัจจุบันยังคงตรงกัน ดูขั้นตอนการสร้างทั้งหมดได้ที่ [Plugin เครื่องมือ](/th/plugins/tool-plugins)

โครงเริ่มต้นจะเขียนซอร์ส TypeScript แต่สร้างข้อมูลเมตาจากจุดเริ่มต้น `./dist/index.js` ที่สร้างแล้ว ดังนั้นขั้นตอนนี้จึงทำงานร่วมกับ CLI ที่เผยแพร่แล้วได้ด้วย ใช้ `--entry <path>` เมื่อจุดเริ่มต้นไม่ใช่จุดเริ่มต้นเริ่มต้นของแพ็กเกจ ใช้ `plugins build --check` ใน CI เพื่อให้ล้มเหลวเมื่อข้อมูลเมตาที่สร้างไว้ล้าสมัย โดยไม่เขียนไฟล์ใหม่

### โครงเริ่มต้นของผู้ให้บริการ

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

โครงเริ่มต้นของผู้ให้บริการจะสร้าง Plugin ผู้ให้บริการโมเดลทั่วไปที่เข้ากันได้กับ OpenAI พร้อมระบบเชื่อมต่อการยืนยันตัวตนด้วยคีย์ API, สคริปต์ `npm run validate` ที่เรียกใช้ `clawhub package validate`, ข้อมูลเมตาแพ็กเกจ ClawHub และเวิร์กโฟลว์ GitHub Actions ที่เรียกใช้ด้วยตนเองสำหรับการเผยแพร่แบบเชื่อถือได้ผ่าน GitHub OIDC ในอนาคต โครงเริ่มต้นของผู้ให้บริการจะไม่สร้าง Skills และไม่ใช้ `openclaw plugins build`/`validate` คำสั่งเหล่านี้มีไว้สำหรับเส้นทางข้อมูลเมตาที่สร้างขึ้นของโครงเริ่มต้นเครื่องมือ

ก่อนเผยแพร่ ให้แทนที่ URL ฐานของ API แค็ตตาล็อกโมเดล เส้นทางเอกสาร ข้อความเกี่ยวกับข้อมูลรับรอง และเนื้อหา README ที่เป็นตัวแทนด้วยรายละเอียดจริงของผู้ให้บริการ ใช้ README ที่สร้างขึ้นสำหรับการเผยแพร่ไปยัง ClawHub ครั้งแรกและการตั้งค่าผู้เผยแพร่ที่เชื่อถือได้

## การติดตั้ง

```bash
openclaw plugins search "calendar"                      # search ClawHub plugins
openclaw plugins install <package>                       # source auto-detection
openclaw plugins install clawhub:<package>                # ClawHub only
openclaw plugins install npm:<package>                    # npm only
openclaw plugins install npm-pack:<path.tgz>               # local npm-pack tarball
openclaw plugins install git:github.com/<owner>/<repo>     # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # local path or archive
openclaw plugins install -l <path>                         # link instead of copy
openclaw plugins install <plugin>@<marketplace>             # marketplace shorthand
openclaw plugins install <plugin> --marketplace <name>      # marketplace (explicit)
openclaw plugins install <package> --force                  # overwrite existing install
openclaw plugins install <package> --pin                    # pin resolved npm version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

ผู้ดูแลที่ทดสอบการติดตั้งระหว่างการตั้งค่าสามารถแทนที่แหล่งติดตั้ง Plugin อัตโนมัติด้วยตัวแปรสภาพแวดล้อมที่มีการป้องกัน ดู[การแทนที่แหล่งติดตั้ง Plugin](/th/plugins/install-overrides)

<Warning>
ในช่วงเปลี่ยนผ่านการเปิดตัว ชื่อแพ็กเกจเปล่าจะติดตั้งจาก npm โดยค่าเริ่มต้น เว้นแต่จะตรงกับรหัสของ Plugin ที่รวมมาในชุดหรือ Plugin อย่างเป็นทางการ ซึ่งในกรณีนั้น OpenClaw จะใช้สำเนาภายในเครื่องหรือสำเนาอย่างเป็นทางการนั้นแทนการเข้าถึงรีจิสทรี npm ใช้ `npm:<package>` เมื่อต้องการแพ็กเกจ npm ภายนอกโดยเจตนา ใช้ `clawhub:<package>` สำหรับ ClawHub ให้ปฏิบัติต่อการติดตั้ง Plugin เสมือนการเรียกใช้โค้ด และควรใช้เวอร์ชันที่ตรึงไว้
</Warning>

`plugins search` สอบถาม ClawHub เพื่อค้นหาแพ็กเกจ `code-plugin` และ `bundle-plugin` ที่ติดตั้งได้ (ไม่ใช่ Skills สำหรับสิ่งเหล่านั้นให้ใช้ `openclaw skills search`) ค่าเริ่มต้นของ `--limit` คือ 20 และจำกัดสูงสุดที่ 100 คำสั่งนี้อ่านเฉพาะแค็ตตาล็อกระยะไกล โดยไม่มีการตรวจสอบสถานะภายในเครื่อง การเปลี่ยนแปลงการกำหนดค่า การติดตั้งแพ็กเกจ หรือการโหลดรันไทม์ของ Plugin ผลลัพธ์ประกอบด้วยชื่อแพ็กเกจ ClawHub ตระกูล ช่องทาง เวอร์ชัน สรุป และคำแนะนำการติดตั้ง เช่น `openclaw plugins install clawhub:<package>`

<Note>
ClawHub เป็นช่องทางหลักในการเผยแพร่และค้นพบ Plugin ส่วนใหญ่ npm ยังคงเป็นเส้นทางสำรองและเส้นทางการติดตั้งโดยตรงที่รองรับ แพ็กเกจ Plugin `@openclaw/*` ที่ OpenClaw เป็นเจ้าของได้รับการเผยแพร่บน npm อีกครั้ง ดูรายการปัจจุบันได้ที่ [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) หรือ[บัญชีรายการ Plugin](/th/plugins/plugin-inventory) การติดตั้งแบบเสถียรใช้ `latest` การติดตั้งและอัปเดตในช่องทางเบตาจะเลือกแท็กการเผยแพร่ `beta` ของ npm เมื่อมี และย้อนกลับไปใช้ `latest` หากไม่มี ในช่องทางเสถียรระยะยาว Plugin npm อย่างเป็นทางการที่ระบุแบบเปล่า/ค่าเริ่มต้นหรือมีเจตนาใช้ `latest` จะถูกแก้เป็นเวอร์ชันแกนหลักที่ติดตั้งอยู่แบบตรงกันทุกประการ การตรึงเวอร์ชันแบบตรงตัวและแท็กที่ระบุชัดเจนซึ่งไม่ใช่ `latest` แพ็กเกจของบุคคลที่สาม และแหล่งที่ไม่ใช่ npm จะไม่ถูกเขียนใหม่
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    หากส่วน `plugins` ของคุณอ้างอิง `$include` แบบไฟล์เดียว `plugins install/update/enable/disable/uninstall` จะเขียนผ่านไปยังไฟล์ที่รวมไว้นั้น และไม่แก้ไข `openclaw.json` การรวมที่ระดับราก อาร์เรย์การรวม และการรวมที่มีค่าทับซ้อนระดับเดียวกันจะปฏิเสธการทำงานแทนการทำให้แบนราบ ดูรูปแบบที่รองรับได้ที่ [การรวมการกำหนดค่า](/th/gateway/configuration)

    หากการกำหนดค่าไม่ถูกต้องระหว่างการติดตั้ง โดยปกติ `plugins install` จะปฏิเสธการทำงานและแจ้งให้คุณเรียก `openclaw doctor --fix` ก่อน ระหว่างการเริ่มต้น Gateway และการโหลดซ้ำแบบทันที การกำหนดค่า Plugin ที่ไม่ถูกต้องจะถูกปฏิเสธเช่นเดียวกับการกำหนดค่าอื่นที่ไม่ถูกต้อง โดย `openclaw doctor --fix` สามารถกักกันรายการ Plugin ที่ไม่ถูกต้องได้ ข้อยกเว้นระหว่างการติดตั้งที่มีการบันทึกไว้เพียงกรณีเดียวคือเส้นทางกู้คืนแบบจำกัดสำหรับ Plugin ที่รวมมาในชุดซึ่งเลือกใช้ `openclaw.install.allowInvalidConfigRecovery` อย่างชัดเจน

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` ใช้เป้าหมายการติดตั้งเดิมซ้ำ และเขียนทับ Plugin หรือชุดฮุกที่ติดตั้งอยู่แล้วในตำแหน่งเดิม ใช้เมื่อมีเจตนาติดตั้งรหัสเดิมซ้ำจากพาธภายในเครื่อง อาร์ไคฟ์ แพ็กเกจ ClawHub หรืออาร์ติแฟกต์ npm ใหม่ สำหรับการอัปเกรดตามปกติของ Plugin npm ที่ติดตามอยู่แล้ว ควรใช้ `openclaw plugins update <id-or-npm-spec>`

    หากคุณเรียก `plugins install` สำหรับรหัส Plugin ที่ติดตั้งอยู่แล้ว OpenClaw จะหยุดและแนะนำให้ใช้ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติ หรือใช้ `plugins install <package> --force` เมื่อต้องการเขียนทับการติดตั้งปัจจุบันจากแหล่งอื่นจริง ๆ ไม่รองรับการใช้ `--force` ร่วมกับ `--link`

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` ใช้ได้กับการติดตั้ง npm เท่านั้น และบันทึกค่า `<name>@<version>` ที่แก้ได้แบบตรงตัว ไม่รองรับการใช้ร่วมกับการติดตั้ง `git:` (ให้ตรึงค่าอ้างอิงในข้อกำหนดแทน เช่น `git:github.com/acme/plugin@v1.2.3`) หรือร่วมกับ `--marketplace` (การติดตั้งจากมาร์เก็ตเพลสจะเก็บข้อมูลเมตาแหล่งที่มาของมาร์เก็ตเพลสแทนข้อกำหนด npm)
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` เลิกใช้แล้วและขณะนี้ไม่มีผลใด ๆ OpenClaw ไม่เรียกใช้การบล็อกโค้ดอันตรายระหว่างการติดตั้งที่มีมาในตัวสำหรับการติดตั้ง Plugin อีกต่อไป

    ใช้พื้นผิว `security.installPolicy` ที่ผู้ดำเนินการเป็นเจ้าของเมื่อต้องใช้นโยบายการติดตั้งเฉพาะโฮสต์ ฮุก `before_install` ของ Plugin เป็นฮุกวงจรชีวิตรันไทม์ของ Plugin ไม่ใช่ขอบเขตนโยบายหลักสำหรับการติดตั้งผ่าน CLI

    หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกซ่อนหรือบล็อกโดยการสแกนรีจิสทรี ให้ทำตามขั้นตอนสำหรับผู้เผยแพร่ใน[การเผยแพร่บน ClawHub](/th/clawhub/publishing) `--dangerously-force-unsafe-install` จะไม่ขอให้ ClawHub สแกน Plugin ใหม่หรือทำให้รุ่นที่ถูกบล็อกเผยแพร่สู่สาธารณะ

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    การติดตั้งจากชุมชน ClawHub จะตรวจสอบบันทึกความน่าเชื่อถือของรุ่นที่เลือกก่อนดาวน์โหลด หาก ClawHub ปิดใช้งานการดาวน์โหลดของรุ่นนั้น รายงานผลการสแกนที่เป็นอันตราย หรือกำหนดให้รุ่นอยู่ในสถานะการกลั่นกรองที่บล็อกการใช้งาน (ถูกกักกันหรือเพิกถอน) OpenClaw จะปฏิเสธโดยเด็ดขาดไม่ว่าจะใช้แฟล็กนี้หรือไม่ สำหรับสถานะการสแกนที่มีความเสี่ยงหรือสถานะการกลั่นกรองที่ไม่บล็อก OpenClaw จะแสดงรายละเอียดความน่าเชื่อถือและขอการยืนยันก่อนดำเนินการต่อ

    ใช้ `--acknowledge-clawhub-risk` หลังจากตรวจสอบคำเตือนจาก ClawHub และตัดสินใจดำเนินการต่อโดยไม่ใช้พรอมต์แบบโต้ตอบเท่านั้น ผลการสแกนที่รอดำเนินการหรือล้าสมัย (ยังไม่ได้รับการยืนยันว่าปลอดภัย) จะแสดงคำเตือนแต่ไม่ต้องยอมรับความเสี่ยง แพ็กเกจ ClawHub อย่างเป็นทางการและแหล่ง Plugin ของ OpenClaw ที่รวมมาในชุดจะข้ามการตรวจสอบความน่าเชื่อถือของรุ่นนี้ทั้งหมด

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` ยังเป็นช่องทางติดตั้งสำหรับชุดฮุกที่เปิดเผย `openclaw.hooks` ใน `package.json` ใช้ `openclaw hooks` สำหรับการแสดงฮุกแบบกรองและการเปิดใช้งานฮุกแต่ละรายการ ไม่ใช่สำหรับการติดตั้งแพ็กเกจ

    ข้อกำหนด npm รองรับ **เฉพาะรีจิสทรี** (ชื่อแพ็กเกจพร้อม **เวอร์ชันที่ระบุแน่นอน** หรือ **dist-tag** ซึ่งเป็นตัวเลือก) ข้อกำหนดแบบ Git/URL/ไฟล์และช่วง semver จะถูกปฏิเสธ การติดตั้งการขึ้นต่อกันจะทำงานในโปรเจกต์ npm ที่มีการจัดการหนึ่งโปรเจกต์ต่อ Plugin พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้เชลล์ของคุณจะมีการตั้งค่าการติดตั้ง npm ส่วนกลางก็ตาม โปรเจกต์ npm ของ Plugin ที่มีการจัดการจะรับช่วง `overrides` ระดับแพ็กเกจของ OpenClaw ดังนั้นการตรึงเวอร์ชันเพื่อความปลอดภัยของโฮสต์จึงมีผลกับการขึ้นต่อกันของ Plugin ที่ถูกยกระดับขึ้นมาด้วย

    ใช้ `npm:<package>` เพื่อระบุการแก้ไขแพ็กเกจผ่าน npm อย่างชัดเจน ข้อกำหนดแพ็กเกจแบบไม่มีคำนำหน้าจะติดตั้งโดยตรงจาก npm ระหว่างช่วงเปลี่ยนผ่านการเปิดตัวเช่นกัน เว้นแต่จะตรงกับรหัส Plugin อย่างเป็นทางการ

    ข้อกำหนด `@openclaw/*` ดิบที่ตรงกับ Plugin แบบรวมจะถูกแก้ไขไปยังสำเนาแบบรวมที่อิมเมจเป็นเจ้าของก่อนย้อนกลับไปใช้ npm ตัวอย่างเช่น `openclaw plugins install @openclaw/discord@2026.5.20 --pin` จะใช้ Discord Plugin แบบรวมจากบิลด์ OpenClaw ปัจจุบันแทนการสร้างการแทนที่ npm ที่มีการจัดการ หากต้องการบังคับใช้แพ็กเกจ npm ภายนอก ให้ใช้ `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`

    ข้อกำหนดแบบไม่มีคำนำหน้าและ `@latest` จะคงอยู่ในสายเสถียร เวอร์ชันแก้ไขแบบประทับวันที่ของ OpenClaw เช่น `2026.5.3-1` จะถือว่าเป็นเวอร์ชันเสถียรสำหรับการตรวจสอบนี้ หาก npm แก้ไขรูปแบบใดรูปแบบหนึ่งไปเป็นเวอร์ชันก่อนเผยแพร่ OpenClaw จะหยุดและขอให้คุณเลือกเข้าร่วมอย่างชัดเจนด้วยแท็กก่อนเผยแพร่ (`@beta`/`@rc`) หรือเวอร์ชันก่อนเผยแพร่ที่ระบุแน่นอน (`@1.2.3-beta.4`)

    สำหรับการติดตั้ง npm ที่ไม่มีเวอร์ชันระบุแน่นอน (`npm:<package>` หรือ `npm:<package>@latest`) OpenClaw จะตรวจสอบข้อมูลเมตาของแพ็กเกจที่แก้ไขได้ก่อนติดตั้ง หากแพ็กเกจเสถียรล่าสุดต้องใช้ API ของ Plugin OpenClaw ที่ใหม่กว่า หรือเวอร์ชันโฮสต์ขั้นต่ำที่ใหม่กว่า OpenClaw จะตรวจสอบเวอร์ชันเสถียรที่เก่ากว่าและติดตั้งรุ่นล่าสุดที่เข้ากันได้แทน เวอร์ชันที่ระบุแน่นอนและ dist-tag ที่ระบุอย่างชัดเจนจะยังคงเข้มงวด: การเลือกที่เข้ากันไม่ได้จะล้มเหลวและขอให้คุณอัปเกรด OpenClaw หรือเลือกเวอร์ชันที่เข้ากันได้

    หากข้อกำหนดการติดตั้งแบบไม่มีคำนำหน้าตรงกับรหัส Plugin อย่างเป็นทางการ (เช่น `diffs`) OpenClaw จะติดตั้งรายการแค็ตตาล็อกโดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่มีชื่อเดียวกัน ให้ใช้ข้อกำหนดแบบมีสโคปอย่างชัดเจน (เช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="ที่เก็บ Git">
    ใช้ `git:<repo>` เพื่อติดตั้งโดยตรงจากที่เก็บ git รูปแบบที่รองรับ: `git:github.com/owner/repo`, `git:owner/repo`, URL แบบเต็มที่ขึ้นต้นด้วย `https://`, `ssh://`, `git://`, `file://` และ URL โคลนแบบ `git@host:owner/repo.git` เพิ่ม `@<ref>` หรือ `#<ref>` เพื่อเช็กเอาต์แบรนช์ แท็ก หรือคอมมิตก่อนติดตั้ง

    การติดตั้งจาก Git จะโคลนลงในไดเรกทอรีชั่วคราว เช็กเอาต์การอ้างอิงที่ร้องขอเมื่อมี จากนั้นใช้ตัวติดตั้งไดเรกทอรี Plugin ตามปกติ ดังนั้นการตรวจสอบความถูกต้องของไฟล์กำกับ นโยบายการติดตั้งของผู้ดำเนินการ งานติดตั้งของตัวจัดการแพ็กเกจ และระเบียนการติดตั้งจะทำงานเหมือนการติดตั้งจาก npm ระเบียนการติดตั้งจาก git จะรวม URL/การอ้างอิงต้นทางพร้อมคอมมิตที่แก้ไขได้ เพื่อให้ `openclaw plugins update` สามารถแก้ไขต้นทางใหม่ได้ในภายหลัง

    หลังจากติดตั้งจาก git ให้ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อตรวจสอบการลงทะเบียนขณะทำงาน เช่น เมธอดของ Gateway และคำสั่ง CLI หาก Plugin ลงทะเบียนราก CLI ด้วย `api.registerCli` ให้เรียกใช้คำสั่งนั้นโดยตรงผ่าน CLI รากของ OpenClaw เช่น `openclaw demo-plugin ping`

  </Accordion>
  <Accordion title="ไฟล์เก็บถาวร">
    ไฟล์เก็บถาวรที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` ไฟล์เก็บถาวร Plugin OpenClaw แบบเนทีฟต้องมี `openclaw.plugin.json` ที่ถูกต้อง ณ รากของ Plugin ที่แตกไฟล์แล้ว ไฟล์เก็บถาวรที่มีเพียง `package.json` จะถูกปฏิเสธก่อนที่ OpenClaw จะเขียนระเบียนการติดตั้ง

    ใช้ `npm-pack:<path.tgz>` เมื่อไฟล์เป็นทาร์บอล npm-pack และคุณต้องการ
    ใช้เส้นทางโปรเจกต์ npm ที่มีการจัดการแยกตาม Plugin เช่นเดียวกับการติดตั้งจากรีจิสทรี
    ซึ่งรวมถึงการตรวจสอบ `package-lock.json` การสแกนการขึ้นต่อกันที่ถูกยกระดับขึ้นมา
    และระเบียนการติดตั้ง npm เส้นทางไฟล์เก็บถาวรแบบธรรมดายังคงติดตั้งเป็นไฟล์เก็บถาวร
    ภายในเครื่องใต้รากส่วนขยายของ Plugin

    รองรับการติดตั้งจาก Marketplace ของ Claude ด้วย

  </Accordion>
</AccordionGroup>

การติดตั้งจาก ClawHub ใช้ตัวระบุตำแหน่ง `clawhub:<package>` อย่างชัดเจน:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

ข้อกำหนด Plugin แบบไม่มีคำนำหน้าที่ปลอดภัยสำหรับ npm จะติดตั้งจาก npm โดยค่าเริ่มต้นระหว่างช่วงเปลี่ยนผ่านการเปิดตัว เว้นแต่จะตรงกับรหัส Plugin อย่างเป็นทางการ:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อระบุการแก้ไขผ่าน npm เท่านั้นอย่างชัดเจน:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw จะตรวจสอบความเข้ากันได้ของ API Plugin / Gateway ขั้นต่ำที่ประกาศไว้ก่อนติดตั้ง เมื่อเวอร์ชัน ClawHub ที่เลือกเผยแพร่อาร์ติแฟกต์ ClawPack OpenClaw จะดาวน์โหลด npm-pack `.tgz` ที่มีเวอร์ชัน ตรวจสอบส่วนหัวไดเจสต์ของ ClawHub และไดเจสต์ของอาร์ติแฟกต์ แล้วติดตั้งผ่านเส้นทางไฟล์เก็บถาวรตามปกติ ClawHub เวอร์ชันเก่าที่ไม่มีข้อมูลเมตา ClawPack จะยังคงติดตั้งผ่านเส้นทางตรวจสอบไฟล์เก็บถาวรแพ็กเกจแบบเดิม ระเบียนการติดตั้งจะเก็บข้อมูลเมตาต้นทาง ClawHub ชนิดอาร์ติแฟกต์ ค่า integrity ของ npm ค่า shasum ของ npm ชื่อทาร์บอล และข้อเท็จจริงไดเจสต์ ClawPack ไว้สำหรับการอัปเดตภายหลัง
การติดตั้ง ClawHub ที่ไม่ระบุเวอร์ชันจะเก็บข้อกำหนดที่บันทึกไว้แบบไม่ระบุเวอร์ชัน เพื่อให้ `openclaw plugins update` ติดตามรุ่น ClawHub ที่ใหม่กว่าได้ ส่วนตัวเลือกเวอร์ชันหรือแท็กที่ระบุอย่างชัดเจน เช่น `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` จะยังคงตรึงอยู่กับตัวเลือกนั้น

### รูปแบบย่อของ Marketplace

ใช้รูปแบบย่อ `plugin@marketplace` เมื่อชื่อ Marketplace มีอยู่ในแคชรีจิสทรีภายในเครื่องของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

ใช้ `--marketplace` เพื่อส่งต้นทาง Marketplace อย่างชัดเจน:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="ต้นทาง Marketplace">
    - ชื่อ Marketplace ที่ Claude รู้จักจาก `~/.claude/plugins/known_marketplaces.json`
    - ราก Marketplace ภายในเครื่องหรือเส้นทาง `marketplace.json`
    - รูปแบบย่อของที่เก็บ GitHub เช่น `owner/repo`
    - URL ที่เก็บ GitHub เช่น `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="กฎของ Marketplace ระยะไกล">
    สำหรับ Marketplace ระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องอยู่ภายในที่เก็บ Marketplace ที่โคลนมา OpenClaw ยอมรับต้นทางแบบเส้นทางสัมพัทธ์จากที่เก็บนั้น และปฏิเสธต้นทาง Plugin แบบ HTTP(S), เส้นทางสัมบูรณ์, git, GitHub และต้นทางอื่นที่ไม่ใช่เส้นทางจากไฟล์กำกับระยะไกล
  </Tab>
</Tabs>

สำหรับเส้นทางภายในเครื่องและไฟล์เก็บถาวร OpenClaw จะตรวจหาโดยอัตโนมัติ:

- Plugin OpenClaw แบบเนทีฟ (`openclaw.plugin.json`)
- บันเดิลที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- บันเดิลที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือเค้าโครงคอมโพเนนต์เริ่มต้นของ Claude เมื่อไม่มีไฟล์กำกับดังกล่าว)
- บันเดิลที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

การติดตั้งภายในเครื่องที่มีการจัดการต้องเป็นไดเรกทอรี Plugin หรือไฟล์เก็บถาวร ไฟล์ Plugin แบบเดี่ยว `.js`,
`.mjs`, `.cjs` และ `.ts` จะไม่ถูกคัดลอกไปยังราก Plugin ที่มีการจัดการโดย `plugins install`
และจะไม่ถูกโหลดด้วยการวางโดยตรงใน
`~/.openclaw/extensions` หรือ `<workspace>/.openclaw/extensions`; รากที่ตรวจพบ
โดยอัตโนมัติเหล่านั้นจะโหลดแพ็กเกจ Plugin หรือไดเรกทอรีบันเดิล และข้าม
ไฟล์สคริปต์ระดับบนสุดในฐานะตัวช่วยภายในเครื่อง ให้ระบุไฟล์เดี่ยวอย่างชัดเจนใน
`plugins.load.paths` แทน

<Note>
บันเดิลที่เข้ากันได้จะติดตั้งลงในราก Plugin ตามปกติและเข้าร่วมขั้นตอนแสดงรายการ/ข้อมูล/เปิดใช้งาน/ปิดใช้งานเดียวกัน ปัจจุบันรองรับ Skills ของบันเดิล, Skills แบบคำสั่งของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` / `lspServers` ที่ประกาศในไฟล์กำกับของ Claude, Skills แบบคำสั่งของ Cursor และไดเรกทอรีฮุก Codex ที่เข้ากันได้ ส่วนความสามารถอื่นของบันเดิลที่ตรวจพบจะแสดงในข้อมูลวินิจฉัย/ข้อมูล แต่ยังไม่ได้เชื่อมเข้ากับการทำงานขณะรัน
</Note>

ใช้ `-l`/`--link` เพื่อชี้ไปยังไดเรกทอรี Plugin ภายในเครื่องโดยไม่คัดลอก (เพิ่ม
ลงใน `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

ไม่รองรับ `--link` ร่วมกับ `--force` (Plugin ที่เชื่อมโยงจะชี้ไปยังเส้นทางต้นทาง
โดยตรง จึงไม่มีสิ่งใดให้เขียนทับ ณ ตำแหน่งเดิม), `--marketplace` หรือ
การติดตั้งแบบ `git:` และต้องใช้เส้นทางภายในเครื่องที่มีอยู่แล้ว

<Note>
Plugin ที่มีต้นทางจากเวิร์กสเปซซึ่งตรวจพบจากรากส่วนขยายของเวิร์กสเปซจะไม่ถูก
นำเข้าหรือเรียกใช้จนกว่าจะเปิดใช้งานอย่างชัดเจน สำหรับการพัฒนาภายในเครื่อง
ให้เรียกใช้ `openclaw plugins enable <plugin-id>` หรือตั้งค่า
`plugins.entries.<plugin-id>.enabled: true`; หากการกำหนดค่าของคุณใช้
`plugins.allow` ให้รวมรหัส Plugin เดียวกันไว้ด้วย กฎปิดกั้นโดยค่าเริ่มต้นนี้
ยังมีผลเมื่อการตั้งค่าช่องทางกำหนดเป้าหมาย Plugin ที่มีต้นทางจากเวิร์กสเปซอย่างชัดเจน
สำหรับการโหลดเพื่อการตั้งค่าเท่านั้น ดังนั้นโค้ดการตั้งค่า Plugin ช่องทางภายในเครื่องจะไม่ทำงาน
ขณะที่ Plugin ของเวิร์กสเปซนั้นยังปิดใช้งานหรือถูกตัดออกจากรายการอนุญาต การติดตั้ง
แบบเชื่อมโยงและรายการ `plugins.load.paths` ที่ระบุอย่างชัดเจนจะปฏิบัติตามนโยบายปกติ
สำหรับต้นทาง Plugin ที่แก้ไขได้ ดู
[กำหนดค่านโยบาย Plugin](/th/tools/plugin#configure-plugin-policy)
และ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#plugins)

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึกข้อกำหนดที่ระบุแน่นอนซึ่งแก้ไขได้ (`name@version`) ในดัชนี Plugin ที่มีการจัดการ โดยยังคงพฤติกรรมเริ่มต้นแบบไม่ตรึงไว้
</Note>

## รายการ

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
  เปลี่ยนจากมุมมองตารางเป็นบรรทัดรายละเอียดต่อ Plugin พร้อมข้อมูลเมตารูปแบบ/ต้นทาง/แหล่งกำเนิด/เวอร์ชัน/การเปิดใช้งาน
</ParamField>
<ParamField path="--json" type="boolean">
  รายการสินค้าคงคลังที่เครื่องอ่านได้ พร้อมข้อมูลวินิจฉัยรีจิสทรีและสถานะการติดตั้งการขึ้นต่อกันของแพ็กเกจ
</ParamField>

<Note>
`plugins list` จะอ่านรีจิสทรี Plugin ภายในเครื่องที่จัดเก็บไว้ก่อน โดยมีทางเลือกสำรองที่อนุมานจากไฟล์กำกับเท่านั้นเมื่อรีจิสทรีสูญหายหรือไม่ถูกต้อง คำสั่งนี้มีประโยชน์สำหรับตรวจสอบว่า Plugin ได้รับการติดตั้ง เปิดใช้งาน และมองเห็นได้ในการวางแผนเริ่มต้นแบบเย็นหรือไม่ แต่ไม่ใช่การตรวจสอบรันไทม์แบบสดของกระบวนการ Gateway ที่กำลังทำงานอยู่ หลังจากเปลี่ยนโค้ด Plugin สถานะการเปิดใช้งาน นโยบายฮุก หรือ `plugins.load.paths` ให้เริ่ม Gateway ที่ให้บริการช่องทางนั้นใหม่ก่อนคาดหวังให้โค้ด `register(api)` หรือฮุกใหม่ทำงาน สำหรับการติดตั้งใช้งานระยะไกล/คอนเทนเนอร์ ให้ตรวจสอบว่าคุณกำลังเริ่มโปรเซสลูก `openclaw gateway run` จริงใหม่ ไม่ใช่เพียงโปรเซสตัวห่อ

`plugins list --json` จะรวม `dependencyStatus` ของแต่ละ Plugin จาก
`dependencies` และ `optionalDependencies` ใน `package.json` OpenClaw จะตรวจสอบว่าชื่อแพ็กเกจเหล่านั้น
มีอยู่ตามเส้นทางค้นหา `node_modules` ปกติของ Node สำหรับ Plugin หรือไม่ โดยจะ
ไม่นำเข้าโค้ดรันไทม์ของ Plugin ไม่เรียกใช้ตัวจัดการแพ็กเกจ และไม่ซ่อมแซม
การขึ้นต่อกันที่ขาดหายไป
</Note>

หากบันทึกการเริ่มต้นแสดง `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
ให้เรียกใช้ `openclaw plugins list --enabled --verbose` หรือ
`openclaw plugins inspect <id>` พร้อมรหัส Plugin ที่แสดงอยู่ เพื่อยืนยันรหัส Plugin
และคัดลอกรหัสที่เชื่อถือได้ไปยัง `plugins.allow` ใน `openclaw.json` เมื่อคำเตือน
สามารถแสดง Plugin ที่ตรวจพบทั้งหมดได้ ระบบจะพิมพ์ส่วนย่อย `plugins.allow`
ที่พร้อมวางและมีรหัสเหล่านั้นอยู่แล้ว หาก Plugin โหลดโดยไม่มีข้อมูลแหล่งที่มาจากการติดตั้ง/
เส้นทางโหลด ให้ตรวจสอบรหัส Plugin นั้น แล้วตรึงรหัสที่เชื่อถือได้ใน `plugins.allow`
หรือติดตั้ง Plugin ใหม่จากต้นทางที่เชื่อถือได้ เพื่อให้ OpenClaw บันทึกแหล่งที่มาของการติดตั้ง

สำหรับงาน Plugin แบบรวมภายในอิมเมจ Docker ที่จัดทำเป็นแพ็กเกจ ให้เมานต์แบบผูกไดเรกทอรี
ต้นทางของ Plugin ทับเส้นทางต้นทางที่จัดทำเป็นแพ็กเกจซึ่งตรงกัน เช่น
`/app/extensions/synology-chat` OpenClaw จะตรวจพบโอเวอร์เลย์ต้นทางที่เมานต์นั้น
ก่อน `/app/dist/extensions/synology-chat`; ไดเรกทอรีต้นทางที่คัดลอกแบบธรรมดา
จะยังไม่ทำงาน ดังนั้นการติดตั้งแบบจัดทำเป็นแพ็กเกจตามปกติจะยังคงใช้ dist ที่คอมไพล์แล้ว

สำหรับการดีบักฮุกขณะทำงาน:

- `openclaw plugins inspect <id> --runtime --json` แสดงฮุกที่ลงทะเบียนและข้อมูลวินิจฉัยจากรอบการตรวจสอบที่โหลดโมดูลแล้ว การตรวจสอบรันไทม์จะไม่ติดตั้งการขึ้นต่อกันโดยเด็ดขาด ให้ใช้ `openclaw doctor --fix` เพื่อล้างสถานะการขึ้นต่อกันแบบเดิม หรือกู้คืน Plugin ที่ดาวน์โหลดได้ซึ่งหายไปและถูกอ้างอิงโดยการกำหนดค่า
- `openclaw gateway status --deep --require-rpc` ยืนยัน URL/โปรไฟล์ของ Gateway ที่เข้าถึงได้ คำแนะนำเกี่ยวกับบริการ/กระบวนการ พาธการกำหนดค่า และสถานะของ RPC
- ฮุกการสนทนาที่ไม่ได้รวมมาในชุด (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) ต้องกำหนด `plugins.entries.<id>.hooks.allowConversationAccess=true`

### ดัชนี Plugin

ข้อมูลเมตาการติดตั้ง Plugin เป็นสถานะที่เครื่องจัดการ ไม่ใช่การกำหนดค่าของผู้ใช้ การติดตั้งและการอัปเดตจะเขียนข้อมูลนี้ลงในฐานข้อมูลสถานะ SQLite ที่ใช้ร่วมกัน ภายใต้ไดเรกทอรีสถานะ OpenClaw ที่ใช้งานอยู่ แถว `installed_plugin_index` จัดเก็บข้อมูลเมตา `installRecords` แบบถาวร รวมถึงระเบียนสำหรับไฟล์แมนิเฟสต์ของ Plugin ที่เสียหายหรือหายไป ตลอดจนแคชรีจิสทรีแบบเย็นที่สร้างจากแมนิเฟสต์ ซึ่งใช้โดย `openclaw plugins update` การถอนการติดตั้ง การวินิจฉัย และรีจิสทรี Plugin แบบเย็น

เมื่อ OpenClaw พบระเบียน `plugins.installs` แบบเดิมที่เคยจัดส่งในไฟล์การกำหนดค่า การอ่านขณะรันไทม์จะถือว่าระเบียนเหล่านี้เป็นอินพุตเพื่อความเข้ากันได้ โดยไม่เขียน `openclaw.json` ใหม่ การเขียนข้อมูล Plugin โดยชัดแจ้งและ `openclaw doctor --fix` จะย้ายระเบียนเหล่านั้นไปยังดัชนี Plugin และนำคีย์การกำหนดค่าออกเมื่ออนุญาตให้เขียนการกำหนดค่า หากการเขียนอย่างใดอย่างหนึ่งล้มเหลว ระบบจะเก็บระเบียนในการกำหนดค่าไว้เพื่อไม่ให้ข้อมูลเมตาการติดตั้งสูญหาย

## การถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` จะนำระเบียน Plugin ออกจาก `plugins.entries` ดัชนี Plugin ที่จัดเก็บถาวร รายการอนุญาต/ปฏิเสธ Plugin และรายการ `plugins.load.paths` ที่เชื่อมโยงอยู่เมื่อเกี่ยวข้อง หากไม่ได้ตั้งค่า `--keep-files` การถอนการติดตั้งจะนำไดเรกทอรีการติดตั้งที่มีการจัดการและติดตามไว้ออกด้วย แต่จะทำเช่นนั้นเฉพาะเมื่อพาธที่แก้ไขแล้วอยู่ภายในรากส่วนขยาย Plugin ของ OpenClaw เท่านั้น หากปัจจุบัน Plugin ครอบครองสล็อต `memory` หรือ `contextEngine` สล็อตนั้นจะรีเซ็ตเป็นค่าเริ่มต้น (`memory-core` สำหรับหน่วยความจำ และ `legacy` สำหรับกลไกบริบท)

`uninstall` จะแสดงตัวอย่างรายการที่จะถูกนำออก จากนั้นจะแจ้งถาม `Uninstall plugin "<id>"?` ก่อนทำการเปลี่ยนแปลง ส่ง `--force` เพื่อข้ามข้อความแจ้งยืนยัน (มีประโยชน์สำหรับสคริปต์และการทำงานแบบไม่โต้ตอบ) หากไม่มีแฟล็กนี้ การถอนการติดตั้งต้องใช้ TTY แบบโต้ตอบ `--dry-run` จะแสดงตัวอย่างเดียวกันและจบการทำงานโดยไม่แจ้งถามหรือเปลี่ยนแปลงสิ่งใด

<Note>
รองรับ `--keep-config` ในฐานะนามแฝงที่เลิกใช้แล้วของ `--keep-files`
</Note>

## การอัปเดต

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

การอัปเดตมีผลกับการติดตั้ง Plugin ที่ติดตามไว้ในดัชนี Plugin ที่มีการจัดการ และการติดตั้งชุดฮุกที่ติดตามไว้ใน `hooks.internal.installs`

<AccordionGroup>
  <Accordion title="การแยกแยะรหัส Plugin กับข้อกำหนด npm">
    เมื่อคุณส่งรหัส Plugin OpenClaw จะนำข้อกำหนดการติดตั้งที่บันทึกไว้สำหรับ Plugin นั้นกลับมาใช้ ซึ่งหมายความว่า dist-tag ที่เคยจัดเก็บไว้ เช่น `@beta` และเวอร์ชันที่ตรึงไว้อย่างชัดเจน จะยังคงถูกใช้ในการเรียกใช้ `update <id>` ครั้งต่อ ๆ ไป

    ระหว่าง `update <id> --dry-run` การติดตั้ง npm ที่ตรึงเวอร์ชันไว้อย่างชัดเจนจะยังคงตรึงอยู่ หาก OpenClaw สามารถตรวจหาสายรุ่นเริ่มต้นในรีจิสทรีของแพ็กเกจได้ด้วย และสายรุ่นเริ่มต้นนั้นใหม่กว่าเวอร์ชันที่ติดตั้งและตรึงไว้ การทดลองทำงานจะรายงานการตรึงและแสดงคำสั่งอัปเดตแพ็กเกจ `@latest` อย่างชัดเจน เพื่อเปลี่ยนไปติดตามสายรุ่นเริ่มต้นของรีจิสทรี

    กฎการอัปเดตแบบเจาะจงนี้แตกต่างจากพาธการบำรุงรักษาแบบกลุ่ม `openclaw plugins update --all` การอัปเดตแบบกลุ่มยังคงเคารพข้อกำหนดการติดตั้งทั่วไปที่ติดตามไว้ แต่ระเบียน Plugin ทางการของ OpenClaw ที่เชื่อถือได้สามารถซิงค์กับเป้าหมายแค็ตตาล็อกทางการปัจจุบัน แทนที่จะคงอยู่บนแพ็กเกจทางการแบบระบุเวอร์ชันชัดเจนที่ล้าสมัย ใช้ `update <id>` แบบเจาะจงเมื่อคุณตั้งใจให้ข้อกำหนดทางการแบบระบุเวอร์ชันชัดเจนหรือแบบมีแท็กคงเดิมโดยไม่ถูกแก้ไข

    สำหรับการติดตั้ง npm คุณยังสามารถส่งข้อกำหนดแพ็กเกจ npm แบบชัดเจนพร้อม dist-tag หรือเวอร์ชันที่ระบุแน่นอนได้ OpenClaw จะแก้ชื่อแพ็กเกจนั้นกลับไปยังระเบียน Plugin ที่ติดตามไว้ อัปเดต Plugin ที่ติดตั้งนั้น และบันทึกข้อกำหนด npm ใหม่สำหรับการอัปเดตตามรหัสในอนาคต

    การส่งชื่อแพ็กเกจ npm โดยไม่มีเวอร์ชันหรือแท็กจะถูกแก้กลับไปยังระเบียน Plugin ที่ติดตามไว้เช่นกัน ใช้วิธีนี้เมื่อ Plugin ถูกตรึงไว้กับเวอร์ชันที่ระบุแน่นอน และคุณต้องการย้ายกลับไปยังสายรุ่นเริ่มต้นของรีจิสทรี

  </Accordion>
  <Accordion title="การอัปเดตช่องเบตา">
    `openclaw plugins update <id-or-npm-spec>` แบบเจาะจงจะนำข้อกำหนด Plugin ที่ติดตามไว้กลับมาใช้ เว้นแต่คุณจะส่งข้อกำหนดใหม่ ส่วน `openclaw plugins update --all` แบบกลุ่มจะใช้ `update.channel` ที่กำหนดค่าไว้ เมื่อซิงค์ระเบียน Plugin ทางการที่เชื่อถือได้กับเป้าหมายแค็ตตาล็อกทางการ ดังนั้นการติดตั้งจากช่องเบตาจึงสามารถคงอยู่ในสายรุ่นเบตา แทนที่จะถูกปรับเป็น stable/latest โดยไม่แจ้งให้ทราบ

    `openclaw update` ยังรับรู้ช่องทางอัปเดต OpenClaw ที่ใช้งานอยู่ด้วย โดยในช่องเบตา ระเบียน Plugin แบบสายรุ่นเริ่มต้นของ npm และ ClawHub จะลองใช้ `@beta` ก่อน ระบบจะย้อนกลับไปใช้ข้อกำหนด default/latest ที่บันทึกไว้หากไม่มีรุ่นเบตาของ Plugin ส่วน Plugin จาก npm จะย้อนกลับด้วยเมื่อมีแพ็กเกจเบตาแต่ไม่ผ่านการตรวจสอบความถูกต้องของการติดตั้ง การย้อนกลับนี้จะถูกรายงานเป็นคำเตือนและไม่ทำให้การอัปเดตแกนหลักล้มเหลว เวอร์ชันที่ระบุแน่นอนและแท็กที่ระบุชัดเจนจะยังคงตรึงอยู่กับตัวเลือกนั้นสำหรับการอัปเดตแบบเจาะจง

  </Accordion>
  <Accordion title="การตรวจสอบเวอร์ชันและความคลาดเคลื่อนของความสมบูรณ์">
    ก่อนอัปเดต npm จริง OpenClaw จะตรวจสอบเวอร์ชันแพ็กเกจที่ติดตั้งเทียบกับข้อมูลเมตาของรีจิสทรี npm หากเวอร์ชันที่ติดตั้งและอัตลักษณ์อาร์ติแฟกต์ที่บันทึกไว้ตรงกับเป้าหมายที่แก้ไขได้อยู่แล้ว ระบบจะข้ามการอัปเดตโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน `openclaw.json` ใหม่

    เมื่อมีแฮชความสมบูรณ์ที่จัดเก็บไว้และแฮชของอาร์ติแฟกต์ที่ดึงมาเปลี่ยนแปลง OpenClaw จะถือว่าเป็นความคลาดเคลื่อนของอาร์ติแฟกต์ npm คำสั่ง `openclaw plugins update` แบบโต้ตอบจะแสดงแฮชที่คาดไว้และแฮชจริง แล้วขอการยืนยันก่อนดำเนินการต่อ ตัวช่วยอัปเดตแบบไม่โต้ตอบจะหยุดอย่างปลอดภัย เว้นแต่ผู้เรียกจะระบุนโยบายดำเนินการต่อไว้อย่างชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install ระหว่างการอัปเดต">
    `--dangerously-force-unsafe-install` ยังได้รับการยอมรับใน `plugins update` เพื่อความเข้ากันได้ แต่เลิกใช้แล้วและไม่เปลี่ยนพฤติกรรมการอัปเดต Plugin อีกต่อไป `security.installPolicy` ของผู้ดูแลระบบยังคงบล็อกการอัปเดตได้ ส่วนฮุก `before_install` ของ Plugin จะมีผลเฉพาะในกระบวนการที่โหลดฮุกของ Plugin แล้วเท่านั้น
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk ระหว่างการอัปเดต">
    การอัปเดต Plugin ชุมชนที่ใช้ ClawHub เป็นแหล่งจะดำเนินการตรวจสอบความน่าเชื่อถือของรุ่นที่ระบุแน่นอนแบบเดียวกับการติดตั้ง ก่อนดาวน์โหลดแพ็กเกจทดแทน ใช้ `--acknowledge-clawhub-risk` สำหรับระบบอัตโนมัติที่ผ่านการตรวจสอบแล้วและควรดำเนินการต่อเมื่อรุ่น ClawHub ที่เลือกมีคำเตือนความน่าเชื่อถือที่มีความเสี่ยง แพ็กเกจ ClawHub ทางการและแหล่ง Plugin ของ OpenClaw ที่รวมมาในชุดจะข้ามข้อความแจ้งความน่าเชื่อถือของรุ่นนี้
  </Accordion>
</AccordionGroup>

## การตรวจสอบ

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

การตรวจสอบจะแสดงอัตลักษณ์ สถานะการโหลด แหล่งที่มา ความสามารถจากแมนิเฟสต์ แฟล็กนโยบาย ข้อมูลวินิจฉัย ข้อมูลเมตาการติดตั้ง ความสามารถของชุดรวม และการรองรับเซิร์ฟเวอร์ MCP หรือ LSP ที่ตรวจพบ โดยค่าเริ่มต้นจะไม่อิมพอร์ตรันไทม์ของ Plugin เอาต์พุต JSON มีสัญญาในแมนิเฟสต์ของ Plugin เช่น `contracts.agentToolResultMiddleware` และ `contracts.trustedToolPolicies` เพื่อให้ผู้ดูแลระบบตรวจสอบการประกาศพื้นผิวที่เชื่อถือได้ก่อนเปิดใช้งานหรือรีสตาร์ต Plugin เพิ่ม `--runtime` เพื่อโหลดโมดูล Plugin และรวมฮุก เครื่องมือ คำสั่ง บริการ เมธอด Gateway และเส้นทาง HTTP ที่ลงทะเบียนไว้ การตรวจสอบรันไทม์จะรายงานการขึ้นต่อกันของ Plugin ที่หายไปโดยตรง ส่วนการติดตั้งและการซ่อมแซมยังคงอยู่ใน `openclaw plugins install`, `openclaw plugins update` และ `openclaw doctor --fix`

โดยทั่วไป คำสั่ง CLI ที่ Plugin เป็นเจ้าของจะถูกติดตั้งเป็นกลุ่มคำสั่งระดับรากของ `openclaw` แต่ Plugin อาจลงทะเบียนคำสั่งซ้อนภายใต้คำสั่งหลักของแกน เช่น `openclaw nodes` ได้เช่นกัน หลังจาก `inspect --runtime` แสดงคำสั่งภายใต้ `cliCommands` ให้เรียกใช้คำสั่งนั้นตามพาธที่ระบุ ตัวอย่างเช่น สามารถตรวจสอบ Plugin ที่ลงทะเบียน `demo-git` ได้ด้วย `openclaw demo-git ping`

Plugin แต่ละรายการจะถูกจัดประเภทตามสิ่งที่ลงทะเบียนจริงขณะรันไทม์:

| รูปแบบ              | ความหมาย                                                               |
| ------------------- | ---------------------------------------------------------------------- |
| `plain-capability`  | มีความสามารถเพียงหนึ่งประเภทเท่านั้น (เช่น Plugin ที่มีเฉพาะผู้ให้บริการ) |
| `hybrid-capability` | มีความสามารถมากกว่าหนึ่งประเภท (เช่น ข้อความ + เสียงพูด + รูปภาพ)       |
| `hook-only`         | มีเฉพาะฮุก ไม่มีความสามารถ เครื่องมือ คำสั่ง บริการ หรือเส้นทาง          |
| `non-capability`    | มีเครื่องมือ/คำสั่ง/บริการ แต่ไม่มีความสามารถ                           |

ดูข้อมูลเพิ่มเติมเกี่ยวกับโมเดลความสามารถได้ที่ [รูปแบบ Plugin](/th/plugins/architecture#plugin-shapes)

<Note>
แฟล็ก `--json` ส่งออกรายงานที่เครื่องอ่านได้ เหมาะสำหรับการเขียนสคริปต์และการตรวจสอบ `inspect --all` แสดงตารางครอบคลุมทั้งระบบ พร้อมคอลัมน์รูปแบบ ชนิดความสามารถ ประกาศความเข้ากันได้ ความสามารถของชุดรวม และสรุปฮุก `info` เป็นนามแฝงของ `inspect`
</Note>

## การวินิจฉัย

```bash
openclaw plugins doctor
```

`doctor` รายงานข้อผิดพลาดในการโหลด Plugin ข้อมูลวินิจฉัยแมนิเฟสต์/การค้นพบ ประกาศความเข้ากันได้ และการอ้างอิงการกำหนดค่า Plugin ที่ล้าสมัย เช่น สล็อต Plugin ที่หายไป เมื่อโครงสร้างการติดตั้งและการกำหนดค่า Plugin ไม่มีปัญหา ระบบจะแสดง `No plugin issues detected.` หากยังมีการกำหนดค่าที่ล้าสมัย แต่โครงสร้างการติดตั้งส่วนอื่นยังสมบูรณ์ สรุปจะระบุสถานการณ์ดังกล่าวแทนที่จะสื่อว่า Plugin ทั้งหมดสมบูรณ์ดี

หาก Plugin ที่กำหนดค่าไว้มีอยู่บนดิสก์แต่ถูกบล็อกโดยการตรวจสอบความปลอดภัยของพาธของตัวโหลด การตรวจสอบความถูกต้องของการกำหนดค่าจะเก็บรายการ Plugin ไว้และรายงานเป็น `present but blocked` ให้แก้ข้อมูลวินิจฉัย Plugin ที่ถูกบล็อกก่อนหน้า เช่น ความเป็นเจ้าของพาธหรือสิทธิ์ที่ทุกคนเขียนได้ แทนที่จะนำการกำหนดค่า `plugins.entries.<id>` หรือ `plugins.allow` ออก

สำหรับความล้มเหลวด้านรูปแบบโมดูล เช่น ไม่มีเอ็กซ์พอร์ต `register`/`activate` ให้เรียกใช้อีกครั้งโดยตั้งค่า `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุปรูปแบบเอ็กซ์พอร์ตแบบกระชับไว้ในเอาต์พุตการวินิจฉัย

## รีจิสทรี

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

รีจิสทรี Plugin ภายในเครื่องคือโมเดลการอ่านแบบเย็นที่ OpenClaw จัดเก็บถาวร สำหรับอัตลักษณ์ของ Plugin ที่ติดตั้ง การเปิดใช้งาน ข้อมูลเมตาแหล่งที่มา และความเป็นเจ้าของส่วนสนับสนุน การเริ่มทำงานตามปกติ การค้นหาเจ้าของผู้ให้บริการ การจัดประเภทการตั้งค่าช่องทาง และรายการคลัง Plugin สามารถอ่านข้อมูลนี้ได้โดยไม่ต้องอิมพอร์ตโมดูลรันไทม์ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่ารีจิสทรีที่จัดเก็บถาวรมีอยู่ เป็นปัจจุบัน หรือล้าสมัย ใช้ `--refresh` เพื่อสร้างใหม่จากดัชนี Plugin ที่จัดเก็บถาวร นโยบายการกำหนดค่า และข้อมูลเมตาของแมนิเฟสต์/แพ็กเกจ นี่คือพาธการซ่อมแซม ไม่ใช่พาธการเปิดใช้งานรันไทม์

`openclaw doctor --fix` ยังซ่อมแซมความคลาดเคลื่อนของ npm ที่มีการจัดการซึ่งเกี่ยวข้องกับรีจิสทรีด้วย หากแพ็กเกจ `@openclaw/*` ที่ไม่มีเจ้าของหรือกู้คืนมา ภายใต้โปรเจกต์ npm ของ Plugin ที่มีการจัดการหรือราก npm แบบแบนดั้งเดิมที่มีการจัดการ ไปบดบัง Plugin ที่รวมมาในชุด doctor จะนำแพ็กเกจที่ล้าสมัยนั้นออกและสร้างรีจิสทรีใหม่ เพื่อให้การเริ่มทำงานตรวจสอบกับแมนิเฟสต์ที่รวมมาในชุด นอกจากนี้ doctor ยังเชื่อมโยงแพ็กเกจ `openclaw` ของโฮสต์กลับเข้าไปใน Plugin npm ที่มีการจัดการซึ่งประกาศ `peerDependencies.openclaw` เพื่อให้อิมพอร์ตรันไทม์ภายในแพ็กเกจ เช่น `openclaw/plugin-sdk/*` แก้พาธได้หลังการอัปเดตหรือการซ่อมแซม npm

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็นสวิตช์ฉุกเฉินเพื่อความเข้ากันได้ที่เลิกใช้แล้ว สำหรับกรณีการอ่านรีจิสทรีล้มเหลว ควรใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix` แทน การย้อนกลับผ่านตัวแปรสภาพแวดล้อมมีไว้สำหรับกู้คืนการเริ่มทำงานในกรณีฉุกเฉินเท่านั้น ระหว่างที่กำลังทยอยใช้การย้ายข้อมูล
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

`plugins marketplace entries` แสดงรายการจากฟีดมาร์เก็ตเพลส OpenClaw ที่กำหนดค่าไว้ โดยค่าเริ่มต้น คำสั่งจะพยายามใช้ฟีดที่โฮสต์ไว้ และหากใช้ไม่ได้จะเปลี่ยนไปใช้สแนปช็อตล่าสุดที่ยอมรับหรือข้อมูลที่รวมมากับระบบ ใช้ `--feed-profile <name>` เพื่ออ่านโปรไฟล์ที่กำหนดค่าไว้โดยเฉพาะ ใช้ `--feed-url <url>` เพื่ออ่าน URL ของฟีดที่โฮสต์ไว้อย่างชัดเจน และใช้ `--offline` เพื่ออ่านสแนปช็อตล่าสุดที่ยอมรับโดยไม่ดึงข้อมูลฟีด

`plugins marketplace refresh` รีเฟรชสแนปช็อตของฟีดที่โฮสต์และกำหนดค่าไว้ พร้อมรายงานว่า OpenClaw ยอมรับข้อมูลที่โฮสต์ สแนปช็อตที่โฮสต์ หรือข้อมูลสำรองที่รวมมากับระบบ ใช้ `--expected-sha256` เมื่อผู้เรียกต้องการให้คำสั่งล้มเหลว เว้นแต่เพย์โหลดใหม่จากโฮสต์จะตรงกับผลรวมตรวจสอบที่ตรึงไว้

`list` ของมาร์เก็ตเพลสรองรับพาธมาร์เก็ตเพลสภายในเครื่อง พาธของ `marketplace.json` รูปแบบย่อของ GitHub เช่น `owner/repo` URL ของรีโพ GitHub หรือ URL ของ git ส่วน `--json` จะแสดงป้ายกำกับแหล่งที่มาที่ได้รับการแก้ไข พร้อมทั้งแมนิเฟสต์ของมาร์เก็ตเพลสและรายการ Plugin ที่แยกวิเคราะห์แล้ว

การรีเฟรชมาร์เก็ตเพลสจะโหลดฟีดมาร์เก็ตเพลส OpenClaw ที่โฮสต์ไว้ และจัดเก็บ
การตอบกลับที่ผ่านการตรวจสอบเป็นสแนปช็อตฟีดที่โฮสต์ไว้ภายในเครื่อง หากไม่ระบุตัวเลือก คำสั่งจะใช้
โปรไฟล์ฟีดเริ่มต้นที่กำหนดค่าไว้ ใช้ `--feed-profile <name>` เพื่อรีเฟรช
โปรไฟล์ที่กำหนดค่าไว้โดยเฉพาะ ใช้ `--feed-url <url>` เพื่อรีเฟรช URL
ของฟีดที่โฮสต์ไว้อย่างชัดเจน ใช้ `--expected-sha256 <sha256>` เพื่อกำหนดให้ผลรวมตรวจสอบของเพย์โหลดต้องตรงกัน
(`sha256:<hex>` หรือค่าไดเจสต์ฐานสิบหก 64 อักขระโดยไม่มีคำนำหน้า) และใช้ `--json` สำหรับ
เอาต์พุตที่เครื่องอ่านได้ URL ของฟีดที่โฮสต์ซึ่งระบุโดยตรงต้องไม่มี
ข้อมูลรับรอง สตริงคิวรี หรือส่วนย่อย การรีเฟรชที่ไม่ได้ตรึงค่าสามารถรายงานผลลัพธ์จาก
สแนปช็อตที่โฮสต์หรือข้อมูลสำรองที่รวมมากับระบบได้โดยไม่ทำให้คำสั่งล้มเหลว การรีเฟรชที่ตรึงค่าไว้
จะล้มเหลว เว้นแต่จะยอมรับเพย์โหลดใหม่จากโฮสต์ และการรีเฟรชจากโฮสต์ที่สำเร็จ
จะล้มเหลวหาก OpenClaw ไม่สามารถจัดเก็บสแนปช็อตที่ผ่านการตรวจสอบได้

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [เอกสารอ้างอิง CLI](/th/cli)
- [ClawHub](/clawhub)
