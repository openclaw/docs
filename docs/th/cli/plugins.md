---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือบันเดิลที่เข้ากันได้
    - คุณต้องการสร้างโครงร่างหรือตรวจสอบความถูกต้องของ Plugin เครื่องมือแบบง่าย
    - คุณต้องการดีบักความล้มเหลวในการโหลด Plugin
sidebarTitle: Plugins
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-06-27T17:22:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4366a862f6a8996b38b624760eef407969f35a7451e3b2a1d5e82746d73b678
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Gateway Plugin, แพ็ก hook และบันเดิลที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="Plugin system" href="/th/tools/plugin">
    คู่มือผู้ใช้ปลายทางสำหรับติดตั้ง เปิดใช้งาน และแก้ปัญหา Plugin
  </Card>
  <Card title="Manage plugins" href="/th/plugins/manage-plugins">
    ตัวอย่างแบบรวดเร็วสำหรับการติดตั้ง แสดงรายการ อัปเดต ถอนการติดตั้ง และเผยแพร่
  </Card>
  <Card title="Plugin bundles" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของบันเดิล
  </Card>
  <Card title="Plugin manifest" href="/th/plugins/manifest">
    ฟิลด์ของ manifest และสคีมา config
  </Card>
  <Card title="Security" href="/th/gateway/security">
    การเสริมความปลอดภัยสำหรับการติดตั้ง Plugin
  </Card>
</CardGroup>

## คำสั่ง

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

สำหรับการตรวจสอบการติดตั้ง การ inspect การถอนการติดตั้ง หรือการรีเฟรช registry ที่ช้า ให้เรียกใช้
คำสั่งพร้อม `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` trace จะเขียนเวลาของแต่ละเฟส
ไปยัง stderr และยังทำให้เอาต์พุต JSON parse ได้ ดู [การดีบัก](/th/help/debugging#plugin-lifecycle-trace)

<Note>
ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) ตัวเปลี่ยนแปลงวงจรชีวิต Plugin จะถูกปิดใช้งาน ใช้ซอร์ส Nix สำหรับการติดตั้งนี้แทน `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` หรือ `plugins disable`; สำหรับ nix-openclaw ให้ใช้ [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) แบบ agent-first
</Note>

<Note>
Plugin ที่บันเดิลมาพร้อมกับ OpenClaw จะถูกส่งมาพร้อม OpenClaw บางรายการเปิดใช้งานเป็นค่าเริ่มต้น (เช่น provider โมเดลที่บันเดิลมา, provider เสียงพูดที่บันเดิลมา และ Plugin เบราว์เซอร์ที่บันเดิลมา); รายการอื่นต้องใช้ `plugins enable`

OpenClaw Plugin แบบ native ต้องส่ง `openclaw.plugin.json` พร้อม JSON Schema แบบ inline (`configSchema` แม้จะว่างก็ตาม) บันเดิลที่เข้ากันได้จะใช้ manifest ของบันเดิลของตนเองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุต list/info แบบ verbose ยังแสดง subtype ของบันเดิล (`codex`, `claude` หรือ `cursor`) พร้อมความสามารถของบันเดิลที่ตรวจพบ
</Note>

### ผู้เขียน

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` สร้าง TypeScript tool Plugin ขั้นต่ำเป็นค่าเริ่มต้น อาร์กิวเมนต์แรก
คือ id ของ Plugin; ส่ง `--name` สำหรับชื่อที่แสดง OpenClaw ใช้
id สำหรับไดเรกทอรีเอาต์พุตเริ่มต้นและการตั้งชื่อ package scaffold ของ tool ใช้
`defineToolPlugin`
`plugins build` import entry ที่ build แล้ว อ่าน metadata ของ tool แบบ static เขียน
`openclaw.plugin.json` และทำให้ `package.json` `openclaw.extensions` ตรงกันอยู่เสมอ
`plugins validate` ตรวจสอบว่า manifest ที่สร้างขึ้น, metadata ของ package และ
entry export ปัจจุบันยังตรงกัน ดู [Tool Plugins](/th/plugins/tool-plugins) สำหรับ
เวิร์กโฟลว์การเขียน tool ฉบับเต็ม

scaffold จะเขียนซอร์ส TypeScript แต่สร้าง metadata จาก entry
`./dist/index.js` ที่ build แล้ว ดังนั้นเวิร์กโฟลว์จึงใช้ได้กับ CLI ที่เผยแพร่ด้วย ใช้
`--entry <path>` เมื่อ entry ไม่ใช่ package entry เริ่มต้น ใช้
`plugins build --check` ใน CI เพื่อให้ล้มเหลวเมื่อ metadata ที่สร้างไว้ล้าสมัยโดยไม่
เขียนไฟล์ใหม่

### Scaffold ของ Provider

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

scaffold ของ provider สร้าง text/model provider Plugin ทั่วไปที่มี
ระบบ API key ที่เข้ากันได้กับ OpenAI, สคริปต์ `npm run validate` ในตัวสำหรับ `clawhub package
validate`, metadata ของ package สำหรับ ClawHub และ GitHub workflow ที่สั่งรันด้วยตนเอง
สำหรับการเผยแพร่แบบ trusted ในอนาคตผ่าน GitHub Actions OIDC scaffold ของ provider
ไม่สร้าง Skills และไม่ใช้ `openclaw plugins build` หรือ
`openclaw plugins validate`; คำสั่งเหล่านั้นมีไว้สำหรับเส้นทาง metadata ที่สร้างโดย
scaffold ของ tool

ก่อนเผยแพร่ ให้แทนที่ URL ฐาน API ตัวอย่าง, catalog โมเดล, route เอกสาร,
ข้อความ credential และสำเนา README ด้วยรายละเอียด provider จริง ใช้
README ที่สร้างขึ้นสำหรับการเผยแพร่ ClawHub ครั้งแรกและการตั้งค่า trusted publisher

### ติดตั้ง

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # source auto-detection
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

maintainer ที่ทดสอบการติดตั้งในช่วง setup สามารถ override แหล่งติดตั้ง Plugin อัตโนมัติ
ด้วยตัวแปรสภาพแวดล้อมที่มี guard ดู
[การ override การติดตั้ง Plugin](/th/plugins/install-overrides)

<Warning>
ชื่อ package แบบ bare จะติดตั้งจาก npm เป็นค่าเริ่มต้นในช่วง launch cutover เว้นแต่ว่าจะตรงกับ id ของ Plugin ทางการ spec package ดิบ `@openclaw/*` ที่ตรงกับ Plugin ที่บันเดิลมาจะใช้สำเนาที่บันเดิลมากับ build ปัจจุบันของ OpenClaw ใช้ `npm:<package>` เมื่อคุณตั้งใจต้องการ package npm ภายนอกแทน ใช้ `clawhub:<package>` สำหรับ ClawHub ถือว่าการติดตั้ง Plugin เหมือนการรันโค้ด ควรใช้เวอร์ชันที่ pin ไว้
</Warning>

`plugins search` query ClawHub เพื่อหา package Plugin ที่ติดตั้งได้และพิมพ์
ชื่อ package ที่พร้อมติดตั้ง ค้นหา package ประเภท code-plugin และ bundle-plugin
ไม่ใช่ skills ใช้ `openclaw skills search` สำหรับ ClawHub skills

<Note>
ClawHub เป็นพื้นผิวหลักสำหรับการกระจายและการค้นพบ Plugin ส่วนใหญ่ Npm
ยังคงเป็น fallback ที่รองรับและเป็นเส้นทางติดตั้งโดยตรง package Plugin
`@openclaw/*` ที่ OpenClaw เป็นเจ้าของเผยแพร่บน npm อีกครั้งแล้ว; ดูรายการปัจจุบัน
บน [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) หรือ
[คลังรายการ Plugin](/th/plugins/plugin-inventory) การติดตั้ง stable ใช้ `latest`
การติดตั้งและอัปเดตในช่อง beta จะเลือก npm dist-tag `beta` ก่อนเมื่อ tag นั้น
พร้อมใช้งาน แล้วจึง fallback ไปที่ `latest`
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    หากส่วน `plugins` ของคุณอิงกับ `$include` แบบไฟล์เดียว `plugins install/update/enable/disable/uninstall` จะเขียนผ่านไปยังไฟล์ที่ include นั้นและปล่อย `openclaw.json` ไว้ไม่เปลี่ยนแปลง root include, include array และ include ที่มี sibling override จะ fail closed แทนการ flatten ดู [Config includes](/th/gateway/configuration) สำหรับรูปทรงที่รองรับ

    หาก config ไม่ถูกต้องระหว่างการติดตั้ง โดยปกติ `plugins install` จะ fail closed และบอกให้คุณรัน `openclaw doctor --fix` ก่อน ระหว่างการเริ่มต้น Gateway และ hot reload config ของ Plugin ที่ไม่ถูกต้องจะ fail closed เหมือน config อื่นที่ไม่ถูกต้อง; `openclaw doctor --fix` สามารถ quarantine รายการ Plugin ที่ไม่ถูกต้องได้ ข้อยกเว้นในช่วงติดตั้งที่บันทึกไว้เพียงอย่างเดียวคือเส้นทางกู้คืน Plugin ที่บันเดิลมาแบบแคบสำหรับ Plugin ที่ opt in อย่างชัดเจนกับ `openclaw.install.allowInvalidConfigRecovery`

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` ใช้เป้าหมายการติดตั้งเดิมซ้ำและเขียนทับ Plugin หรือแพ็ก hook ที่ติดตั้งไว้แล้วในที่เดิม ใช้เมื่อคุณตั้งใจติดตั้ง id เดิมซ้ำจาก path ภายในเครื่อง, archive, package ClawHub หรือ artifact npm ใหม่ สำหรับการอัปเกรดตามปกติของ Plugin npm ที่ติดตามอยู่แล้ว ให้ใช้ `openclaw plugins update <id-or-npm-spec>`

    หากคุณรัน `plugins install` สำหรับ id ของ Plugin ที่ติดตั้งแล้ว OpenClaw จะหยุดและชี้คุณไปที่ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดปกติ หรือไปที่ `plugins install <package> --force` เมื่อคุณต้องการเขียนทับการติดตั้งปัจจุบันจากแหล่งอื่นจริง ๆ

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` ใช้กับการติดตั้ง npm เท่านั้น ไม่รองรับกับการติดตั้ง `git:`; ใช้ git ref ที่ชัดเจน เช่น `git:github.com/acme/plugin@v1.2.3` เมื่อคุณต้องการซอร์สที่ pin ไว้ ไม่รองรับกับ `--marketplace` เพราะการติดตั้งจาก marketplace จะคง metadata แหล่งที่มาของ marketplace แทน npm spec
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` ถูกเลิกใช้แล้วและตอนนี้เป็น no-op OpenClaw ไม่รันการบล็อกโค้ดอันตรายในช่วงติดตั้งแบบ built-in สำหรับการติดตั้ง Plugin อีกต่อไป

    ใช้พื้นผิว `security.installPolicy` ที่ operator เป็นเจ้าของร่วมกันเมื่อจำเป็นต้องมีนโยบายการติดตั้งเฉพาะ host hook `before_install` ของ Plugin เป็น hook วงจรชีวิตของ plugin-runtime และไม่ใช่ขอบเขตนโยบายหลักสำหรับการติดตั้งผ่าน CLI

    หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกซ่อนหรือถูกบล็อกโดยการสแกน registry ให้ใช้ขั้นตอนของ publisher ใน [การเผยแพร่ ClawHub](/th/clawhub/publishing) `--dangerously-force-unsafe-install` ไม่ได้ขอให้ ClawHub สแกน Plugin ใหม่หรือทำให้ release ที่ถูกบล็อกเป็นสาธารณะ

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    การติดตั้งจาก ClawHub ชุมชนจะตรวจสอบ trust record ของ release ที่เลือกก่อนดาวน์โหลด package หาก ClawHub ปิดการดาวน์โหลดสำหรับ release, รายงานผลการสแกนที่เป็นอันตราย หรือวาง release ไว้ในสถานะ moderation ที่บล็อก เช่น quarantine OpenClaw จะปฏิเสธ release นั้น สำหรับสถานะสแกนที่มีความเสี่ยงแต่ไม่บล็อก, สถานะ moderation ที่มีความเสี่ยง หรือเหตุผลของ registry OpenClaw จะแสดงรายละเอียด trust และขอการยืนยันก่อนดำเนินการต่อ

    ใช้ `--acknowledge-clawhub-risk` เฉพาะหลังจากตรวจสอบคำเตือนของ ClawHub และตัดสินใจดำเนินการต่อโดยไม่มี prompt แบบโต้ตอบ trust record ที่ pending หรือ stale clean จะเตือนแต่ไม่ต้องการ acknowledgement package ClawHub ทางการและซอร์ส OpenClaw Plugin ที่บันเดิลมาจะข้าม prompt release-trust นี้

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับแพ็ก hook ที่เปิดเผย `openclaw.hooks` ใน `package.json` ใช้ `openclaw hooks` สำหรับการมองเห็น hook แบบกรองและการเปิดใช้งานราย hook ไม่ใช่การติดตั้ง package

    spec ของ Npm เป็น **registry-only** (ชื่อ package + **เวอร์ชันตรงตัว** หรือ **dist-tag** แบบ optional) spec แบบ Git/URL/file และช่วง semver จะถูกปฏิเสธ การติดตั้ง dependency จะรันในโครงการ npm ที่จัดการหนึ่งรายการต่อ Plugin พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้ shell ของคุณจะมีการตั้งค่าการติดตั้ง npm แบบ global ก็ตาม โครงการ npm ของ Plugin ที่จัดการจะสืบทอด npm `overrides` ระดับ package ของ OpenClaw ดังนั้น pin ด้านความปลอดภัยของ host จึงใช้กับ dependency ของ Plugin ที่ hoist ด้วย

    ใช้ `npm:<package>` เมื่อคุณต้องการทำให้การ resolve ของ npm ชัดเจน spec package แบบ bare จะติดตั้งโดยตรงจาก npm ในช่วง launch cutover เช่นกัน เว้นแต่ว่าจะตรงกับ id ของ Plugin ทางการ

    สเปกแพ็กเกจ `@openclaw/*` แบบดิบที่ตรงกับ Plugin ที่บันเดิลมา จะ resolve ไปยังสำเนาที่บันเดิลมากับอิมเมจก่อน fallback ไป npm ตัวอย่างเช่น `openclaw plugins install @openclaw/discord@2026.5.20 --pin` จะใช้ Discord Plugin ที่บันเดิลมากับบิลด์ OpenClaw ปัจจุบัน แทนการสร้าง override แบบ npm ที่จัดการโดยระบบ หากต้องการบังคับใช้แพ็กเกจ npm ภายนอก ให้ใช้ `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`

    สเปกแบบ bare และ `@latest` จะอยู่บนแทร็กเสถียร เวอร์ชันแก้ไขแบบประทับวันที่ของ OpenClaw เช่น `2026.5.3-1` ถือเป็นรุ่นเสถียรสำหรับการตรวจสอบนี้ หาก npm resolve รายการใดรายการหนึ่งไปเป็น prerelease, OpenClaw จะหยุดและขอให้คุณเลือกใช้โดยชัดเจนด้วยแท็ก prerelease เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease แบบเจาะจง เช่น `@1.2.3-beta.4`

    สำหรับการติดตั้ง npm ที่ไม่มีเวอร์ชันแน่นอน (`npm:<package>` หรือ `npm:<package>@latest`), OpenClaw จะตรวจสอบเมทาดาทาแพ็กเกจที่ resolve ได้ก่อนติดตั้ง หากแพ็กเกจเสถียรล่าสุดต้องใช้ OpenClaw Plugin API หรือเวอร์ชันโฮสต์ขั้นต่ำที่ใหม่กว่า OpenClaw จะตรวจสอบเวอร์ชันเสถียรที่เก่ากว่าและติดตั้งรุ่นล่าสุดที่เข้ากันได้แทน เวอร์ชันแบบเจาะจงและ dist-tag ที่ระบุชัด เช่น `@beta` ยังคงเข้มงวด: หากแพ็กเกจที่เลือกไม่เข้ากัน คำสั่งจะล้มเหลวและขอให้คุณอัปเกรด OpenClaw หรือเลือกเวอร์ชันที่เข้ากันได้

    หากสเปกติดตั้งแบบ bare ตรงกับ id ของ Plugin ทางการ (เช่น `diffs`), OpenClaw จะติดตั้งรายการแค็ตตาล็อกโดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่มีชื่อเดียวกัน ให้ใช้สเปกแบบมี scope ที่ชัดเจน (เช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="Git repositories">
    ใช้ `git:<repo>` เพื่อติดตั้งโดยตรงจาก git repository รูปแบบที่รองรับรวมถึง `git:github.com/owner/repo`, `git:owner/repo`, URL clone แบบเต็ม `https://`, `ssh://`, `git://`, `file://`, และ `git@host:owner/repo.git` เพิ่ม `@<ref>` หรือ `#<ref>` เพื่อ checkout branch, tag หรือ commit ก่อนติดตั้ง

    การติดตั้งจาก Git จะ clone ไปยังไดเรกทอรีชั่วคราว, checkout ref ที่ร้องขอเมื่อมีให้ แล้วใช้ตัวติดตั้งไดเรกทอรี Plugin ตามปกติ ซึ่งหมายความว่าการตรวจสอบ manifest, นโยบายติดตั้งของ operator, งานติดตั้งด้วย package-manager และบันทึกการติดตั้งจะทำงานเหมือนการติดตั้ง npm การติดตั้งจาก git ที่บันทึกไว้จะรวม URL/ref ต้นทางพร้อม commit ที่ resolve แล้ว เพื่อให้ `openclaw plugins update` สามารถ resolve แหล่งที่มาใหม่ภายหลังได้

    หลังติดตั้งจาก git ให้ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อตรวจสอบ runtime registrations เช่น gateway methods และ CLI commands หาก Plugin ลงทะเบียน CLI root ด้วย `api.registerCli` ให้เรียกใช้คำสั่งนั้นโดยตรงผ่าน OpenClaw root CLI เช่น `openclaw demo-plugin ping`

  </Accordion>
  <Accordion title="Archives">
    archive ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` archive ของ OpenClaw Plugin แบบ native ต้องมี `openclaw.plugin.json` ที่ถูกต้องอยู่ที่ root ของ Plugin หลังแตกไฟล์; archive ที่มีเพียง `package.json` จะถูกปฏิเสธก่อนที่ OpenClaw จะเขียนบันทึกการติดตั้ง

    ใช้ `npm-pack:<path.tgz>` เมื่อไฟล์เป็น tarball แบบ npm-pack และคุณต้องการ
    ทดสอบ path โปรเจกต์ npm ที่จัดการต่อ Plugin แบบเดียวกับที่ใช้ในการติดตั้ง
    จาก registry รวมถึงการตรวจสอบ `package-lock.json`, การสแกน dependency
    ที่ hoist แล้ว และบันทึกการติดตั้ง npm path ของ archive ปกติยังคงติดตั้งเป็น
    archive ภายในเครื่องใต้ root ของ plugin extensions

    รองรับการติดตั้งจาก Claude marketplace ด้วย

  </Accordion>
</AccordionGroup>

การติดตั้ง ClawHub ใช้ locator แบบชัดเจน `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

สเปก Plugin แบบ bare ที่ปลอดภัยสำหรับ npm จะติดตั้งจาก npm ตามค่าเริ่มต้นในช่วง launch cutover เว้นแต่จะตรงกับ id ของ Plugin ทางการ:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อระบุให้ชัดว่าต้อง resolve เฉพาะ npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw ตรวจสอบ plugin API / ความเข้ากันได้ขั้นต่ำกับ gateway ที่ประกาศไว้ก่อนติดตั้ง เมื่อเวอร์ชัน ClawHub ที่เลือกเผยแพร่ artifact แบบ ClawPack, OpenClaw จะดาวน์โหลด npm-pack `.tgz` ที่มีเวอร์ชัน, ตรวจสอบ ClawHub digest header และ artifact digest แล้วติดตั้งผ่าน path archive ตามปกติ เวอร์ชัน ClawHub ที่เก่ากว่าซึ่งไม่มีเมทาดาทา ClawPack ยังคงติดตั้งผ่าน path ตรวจสอบ package archive แบบ legacy การติดตั้งที่บันทึกไว้จะเก็บเมทาดาทาแหล่งที่มาของ ClawHub, ชนิด artifact, npm integrity, npm shasum, ชื่อ tarball และข้อมูล digest ของ ClawPack สำหรับการอัปเดตภายหลัง
การติดตั้ง ClawHub แบบไม่ระบุเวอร์ชันจะเก็บสเปกที่บันทึกไว้แบบไม่ระบุเวอร์ชัน เพื่อให้ `openclaw plugins update` สามารถตามรุ่น ClawHub ที่ใหม่กว่าได้; selector แบบระบุเวอร์ชันหรือแท็กชัดเจน เช่น `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` จะยังคง pin ไว้กับ selector นั้น

#### ชวเลข Marketplace

ใช้ชวเลข `plugin@marketplace` เมื่อชื่อ marketplace มีอยู่ใน cache registry ภายในเครื่องของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

ใช้ `--marketplace` เมื่อคุณต้องการส่งแหล่งที่มาของ marketplace อย่างชัดเจน:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - ชื่อ known-marketplace ของ Claude จาก `~/.claude/plugins/known_marketplaces.json`
    - root ของ marketplace ภายในเครื่อง หรือ path `marketplace.json`
    - ชวเลข GitHub repo เช่น `owner/repo`
    - URL ของ GitHub repo เช่น `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Remote marketplace rules">
    สำหรับ marketplace ระยะไกลที่โหลดจาก GitHub หรือ git, รายการ Plugin ต้องอยู่ภายใน marketplace repo ที่ clone มา OpenClaw ยอมรับแหล่งที่มาแบบ relative path จาก repo นั้น และปฏิเสธแหล่งที่มาของ Plugin แบบ HTTP(S), absolute-path, git, GitHub และแหล่งที่มาอื่นที่ไม่ใช่ path จาก remote manifests
  </Tab>
</Tabs>

สำหรับ path และ archive ภายในเครื่อง OpenClaw จะตรวจจับอัตโนมัติ:

- OpenClaw Plugin แบบ native (`openclaw.plugin.json`)
- bundle ที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- bundle ที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือเลย์เอาต์ component เริ่มต้นของ Claude)
- bundle ที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

การติดตั้งภายในเครื่องแบบ managed ต้องเป็นไดเรกทอรีหรือ archive ของ Plugin ไฟล์ Plugin แบบเดี่ยว `.js`,
`.mjs`, `.cjs` และ `.ts` จะไม่ถูกคัดลอกเข้าไปใน root ของ Plugin แบบ managed
โดย `plugins install`; ให้ระบุไฟล์เหล่านั้นอย่างชัดเจนใน `plugins.load.paths` แทน

<Note>
bundle ที่เข้ากันได้จะติดตั้งลงใน root ของ Plugin ตามปกติ และเข้าร่วม flow list/info/enable/disable เดียวกัน ปัจจุบันรองรับ bundle skills, command-skills ของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` / `lspServers` ที่ประกาศใน manifest ของ Claude, command-skills ของ Cursor และไดเรกทอรี hook ของ Codex ที่เข้ากันได้; ความสามารถอื่นของ bundle ที่ตรวจพบจะแสดงใน diagnostics/info แต่ยังไม่ได้เชื่อมเข้ากับการทำงาน runtime
</Note>

### รายการ

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  แสดงเฉพาะ Plugin ที่เปิดใช้งานแล้ว
</ParamField>
<ParamField path="--verbose" type="boolean">
  เปลี่ยนจากมุมมองตารางไปเป็นบรรทัดรายละเอียดต่อ Plugin พร้อมเมทาดาทา source/origin/version/activation
</ParamField>
<ParamField path="--json" type="boolean">
  inventory ที่อ่านโดยเครื่องได้ พร้อม registry diagnostics และสถานะการติดตั้ง package dependency
</ParamField>

<Note>
`plugins list` อ่าน registry ของ Plugin ภายในเครื่องที่ persist ไว้ก่อน โดยมี fallback ที่ derived จาก manifest เท่านั้นเมื่อ registry หายไปหรือไม่ถูกต้อง คำสั่งนี้มีประโยชน์ในการตรวจสอบว่า Plugin ติดตั้งแล้ว, เปิดใช้งานแล้ว และมองเห็นได้ต่อการวางแผน cold startup หรือไม่ แต่ไม่ใช่ live runtime probe ของ Gateway process ที่กำลังทำงานอยู่ หลังเปลี่ยนโค้ด Plugin, enablement, hook policy หรือ `plugins.load.paths` ให้ restart Gateway ที่ให้บริการ channel ก่อนคาดหวังให้โค้ด `register(api)` หรือ hooks ใหม่ทำงาน สำหรับการ deploy แบบ remote/container ให้ตรวจสอบว่าคุณกำลัง restart child `openclaw gateway run` ตัวจริง ไม่ใช่เพียง wrapper process

`plugins list --json` รวม `dependencyStatus` ของแต่ละ Plugin จาก `package.json`
`dependencies` และ `optionalDependencies` OpenClaw ตรวจสอบว่าชื่อ package เหล่านั้น
มีอยู่ตาม path lookup `node_modules` ปกติของ Node สำหรับ Plugin นั้นหรือไม่;
คำสั่งนี้ไม่ import โค้ด runtime ของ Plugin, ไม่เรียก package manager และไม่ซ่อมแซม
dependency ที่หายไป
</Note>

หาก startup log แสดง `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
ให้รัน `openclaw plugins list --enabled --verbose` หรือ
`openclaw plugins inspect <id>` พร้อม id ของ Plugin ที่แสดงไว้ เพื่อยืนยัน id ของ Plugin
และคัดลอก id ที่เชื่อถือได้ลงใน `plugins.allow` ใน `openclaw.json` เมื่อ
คำเตือนสามารถแสดงทุก Plugin ที่ค้นพบได้ มันจะพิมพ์ snippet
`plugins.allow` ที่พร้อมวางและรวม id เหล่านั้นไว้แล้ว หาก Plugin โหลด
โดยไม่มี provenance ของการติดตั้ง/load-path ให้ inspect id ของ Plugin นั้น แล้ว pin
id ที่เชื่อถือได้ใน `plugins.allow` หรือติดตั้ง Plugin ใหม่จากแหล่งที่เชื่อถือได้
เพื่อให้ OpenClaw บันทึก provenance ของการติดตั้ง

`plugins search` คือการค้นหา catalog ClawHub ระยะไกล คำสั่งนี้ไม่ตรวจสอบ state ภายในเครื่อง,
ไม่แก้ config, ไม่ติดตั้ง package และไม่โหลดโค้ด runtime ของ Plugin ผลการค้นหา
รวมชื่อ package ของ ClawHub, family, channel, version, summary และ
คำแนะนำการติดตั้ง เช่น `openclaw plugins install clawhub:<package>`

สำหรับงาน Plugin ที่บันเดิลมาภายใน packaged Docker image ให้ bind-mount ไดเรกทอรี
source ของ Plugin ทับ path source ที่แพ็กเกจไว้ที่ตรงกัน เช่น
`/app/extensions/synology-chat` OpenClaw จะค้นพบ overlay source
ที่ mount นั้นก่อน `/app/dist/extensions/synology-chat`; ไดเรกทอรี source
ที่คัดลอกมาแบบปกติจะยังไม่ทำงาน เพื่อให้การติดตั้งแบบ packaged ตามปกติยังใช้ compiled dist

สำหรับการ debug runtime hook:

- `openclaw plugins inspect <id> --runtime --json` แสดง hooks ที่ลงทะเบียนและ diagnostics จาก inspection pass ที่โหลด module แล้ว การ inspect runtime จะไม่ติดตั้ง dependencies; ใช้ `openclaw doctor --fix` เพื่อล้าง state dependency แบบ legacy หรือกู้คืน Plugin ที่ดาวน์โหลดได้ซึ่งถูกอ้างอิงโดย config แต่หายไป
- `openclaw gateway status --deep --require-rpc` ยืนยัน Gateway URL/profile ที่เข้าถึงได้, คำใบ้ service/process, path config และสุขภาพ RPC
- conversation hooks ที่ไม่ได้บันเดิลมา (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรี Plugin ภายในเครื่อง (เพิ่มเข้า `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

ไฟล์ Plugin แบบเดี่ยวต้องระบุไว้ใน `plugins.load.paths` แทนการ
ติดตั้งด้วย `plugins install` หรือวางโดยตรงใน `~/.openclaw/extensions`
หรือ `<workspace>/.openclaw/extensions` root ที่ค้นพบอัตโนมัติเหล่านั้นจะโหลด
package หรือไดเรกทอรี bundle ของ Plugin ขณะที่ไฟล์ script ระดับบนสุดจะถือเป็น
helper ภายในเครื่องและถูกข้าม

<Note>
Plugin ที่มีต้นทางจาก workspace ซึ่งค้นพบจากราก extensions ของ workspace จะไม่ถูก
นำเข้าหรือเรียกใช้งานจนกว่าจะถูกเปิดใช้งานอย่างชัดเจน สำหรับการพัฒนาในเครื่อง
ให้รัน `openclaw plugins enable <plugin-id>` หรือตั้งค่า
`plugins.entries.<plugin-id>.enabled: true`; หาก config ของคุณใช้
`plugins.allow` ให้ใส่ id ของ Plugin เดียวกันไว้ที่นั่นด้วย กฎ fail-closed นี้
ยังมีผลเมื่อการตั้งค่า channel ระบุเป้าหมายเป็น Plugin ที่มีต้นทางจาก workspace อย่างชัดเจนสำหรับ
การโหลดเพื่อการตั้งค่าเท่านั้น ดังนั้นโค้ดตั้งค่า channel Plugin ในเครื่องจะไม่ทำงานในขณะที่
workspace Plugin นั้นยังคงถูกปิดใช้งานหรือถูกแยกออกจาก allowlist การติดตั้งแบบลิงก์
และรายการ `plugins.load.paths` ที่ระบุอย่างชัดเจนจะทำตามนโยบายปกติสำหรับ
ต้นทาง Plugin ที่ resolve ได้ ดู
[กำหนดค่านโยบาย Plugin](/th/tools/plugin#configure-plugin-policy)
และ [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#plugins)

ไม่รองรับ `--force` กับ `--link` เพราะการติดตั้งแบบลิงก์ใช้ path ต้นทางซ้ำแทนการคัดลอกทับเป้าหมายการติดตั้งที่มีการจัดการ

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึก spec แบบ exact ที่ resolve แล้ว (`name@version`) ไว้ในดัชนี Plugin ที่มีการจัดการ ขณะที่ยังคงพฤติกรรมเริ่มต้นแบบไม่ pin
</Note>

### ดัชนี Plugin

เมทาดาทาการติดตั้ง Plugin เป็นสถานะที่ระบบจัดการ ไม่ใช่ config ของผู้ใช้ การติดตั้งและการอัปเดตจะเขียนข้อมูลนี้ลงในฐานข้อมูลสถานะ SQLite ที่ใช้ร่วมกันภายใต้ไดเรกทอรีสถานะ OpenClaw ที่ใช้งานอยู่ แถว `installed_plugin_index` จัดเก็บเมทาดาทา `installRecords` แบบถาวร รวมถึงระเบียนสำหรับ manifest ของ Plugin ที่เสียหรือหายไป พร้อมแคช registry แบบ cold ที่ได้จาก manifest ซึ่งใช้โดย `openclaw plugins update`, การถอนการติดตั้ง, diagnostics และ cold plugin registry

เมื่อ OpenClaw พบระเบียน `plugins.installs` แบบ legacy ที่เคยจัดส่งอยู่ใน config การอ่านใน runtime จะถือว่าเป็นอินพุตเพื่อความเข้ากันได้โดยไม่เขียน `openclaw.json` ใหม่ การเขียน Plugin อย่างชัดเจนและ `openclaw doctor --fix` จะย้ายระเบียนเหล่านั้นไปยังดัชนี Plugin และลบคีย์ config เมื่ออนุญาตให้เขียน config ได้; หากการเขียนอย่างใดอย่างหนึ่งล้มเหลว ระเบียนใน config จะถูกเก็บไว้เพื่อไม่ให้เมทาดาทาการติดตั้งสูญหาย

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` ลบระเบียน Plugin ออกจาก `plugins.entries`, ดัชนี Plugin ที่ persist ไว้, รายการ allow/deny ของ Plugin และรายการ `plugins.load.paths` แบบลิงก์เมื่อเกี่ยวข้อง หากไม่ได้ตั้งค่า `--keep-files` การถอนการติดตั้งจะลบไดเรกทอรีการติดตั้งที่มีการจัดการและถูกติดตามด้วย เมื่อไดเรกทอรีนั้นอยู่ภายในราก extensions ของ Plugin ของ OpenClaw สำหรับ Plugin หน่วยความจำที่ใช้งานอยู่ ช่องหน่วยความจำจะรีเซ็ตเป็น `memory-core`

<Note>
รองรับ `--keep-config` ในฐานะ alias ที่เลิกใช้แล้วของ `--keep-files`
</Note>

### อัปเดต

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

การอัปเดตมีผลกับการติดตั้ง Plugin ที่ถูกติดตามในดัชนี Plugin ที่มีการจัดการ และการติดตั้ง hook-pack ที่ถูกติดตามใน `hooks.internal.installs`

<AccordionGroup>
  <Accordion title="การ resolve id ของ Plugin เทียบกับ npm spec">
    เมื่อคุณส่ง id ของ Plugin OpenClaw จะใช้ install spec ที่บันทึกไว้สำหรับ Plugin นั้นซ้ำ ซึ่งหมายความว่า dist-tag ที่เคยจัดเก็บไว้ก่อนหน้า เช่น `@beta` และเวอร์ชัน exact ที่ pin ไว้ จะยังถูกใช้ต่อในการรัน `update <id>` ครั้งถัดไป

    กฎการอัปเดตแบบระบุเป้าหมายนั้นแตกต่างจาก path บำรุงรักษาแบบรวม `openclaw plugins update --all` การอัปเดตแบบรวมยังคงเคารพ install spec ที่ถูกติดตามตามปกติ แต่ระเบียน Plugin ทางการของ OpenClaw ที่เชื่อถือได้สามารถซิงก์ไปยังเป้าหมาย catalog ทางการปัจจุบัน แทนที่จะคงอยู่บนแพ็กเกจทางการแบบ exact ที่ล้าสมัย ใช้ `update <id>` แบบระบุเป้าหมายเมื่อคุณตั้งใจต้องการเก็บ spec ทางการแบบ exact หรือแบบมี tag ไว้โดยไม่แตะต้อง

    สำหรับการติดตั้ง npm คุณยังสามารถส่ง npm package spec อย่างชัดเจนพร้อม dist-tag หรือเวอร์ชัน exact ได้ OpenClaw จะ resolve ชื่อแพ็กเกจนั้นกลับไปยังระเบียน Plugin ที่ถูกติดตาม อัปเดต Plugin ที่ติดตั้งนั้น และบันทึก npm spec ใหม่สำหรับการอัปเดตตาม id ในอนาคต

    การส่งชื่อแพ็กเกจ npm โดยไม่มีเวอร์ชันหรือ tag จะ resolve กลับไปยังระเบียน Plugin ที่ถูกติดตามด้วย ใช้กรณีนี้เมื่อ Plugin ถูก pin ไว้กับเวอร์ชัน exact และคุณต้องการย้ายกลับไปยังสาย release เริ่มต้นของ registry

  </Accordion>
  <Accordion title="การอัปเดตช่อง beta">
    `openclaw plugins update <id-or-npm-spec>` แบบระบุเป้าหมายจะใช้ spec ของ Plugin ที่ถูกติดตามซ้ำ เว้นแต่คุณจะส่ง spec ใหม่ `openclaw plugins update --all` แบบรวมจะใช้ `update.channel` ที่กำหนดค่าไว้เมื่อซิงก์ระเบียน Plugin ทางการที่เชื่อถือได้ไปยังเป้าหมาย catalog ทางการ ดังนั้นการติดตั้งผ่านช่อง beta จึงสามารถคงอยู่บนสาย beta release แทนที่จะถูกปรับเป็น stable/latest แบบเงียบๆ

    `openclaw update` ยังรู้จักช่องอัปเดต OpenClaw ที่ใช้งานอยู่ด้วย: บนช่อง beta ระเบียน Plugin แบบ default-line ของ npm และ ClawHub จะลอง `@beta` ก่อน ระเบียนเหล่านี้จะ fallback ไปยัง spec default/latest ที่บันทึกไว้หากไม่มี beta release ของ Plugin; Plugin npm ยัง fallback ด้วยเมื่อมีแพ็กเกจ beta อยู่แต่การตรวจสอบความถูกต้องของการติดตั้งล้มเหลว fallback นั้นจะถูกรายงานเป็นคำเตือนและไม่ทำให้การอัปเดต core ล้มเหลว เวอร์ชัน exact และ tag ที่ระบุอย่างชัดเจนจะยังคง pin อยู่กับ selector นั้นสำหรับการอัปเดตแบบระบุเป้าหมาย

  </Accordion>
  <Accordion title="การตรวจสอบเวอร์ชันและ integrity drift">
    ก่อนการอัปเดต npm แบบสด OpenClaw จะตรวจสอบเวอร์ชันแพ็กเกจที่ติดตั้งกับเมทาดาทา registry ของ npm หากเวอร์ชันที่ติดตั้งและตัวตน artifact ที่บันทึกไว้ตรงกับเป้าหมายที่ resolve แล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน `openclaw.json` ใหม่

    เมื่อมีแฮช integrity ที่จัดเก็บไว้และแฮช artifact ที่ fetch มาเปลี่ยนแปลง OpenClaw จะถือว่านั่นเป็น npm artifact drift คำสั่ง `openclaw plugins update` แบบโต้ตอบจะพิมพ์แฮชที่คาดไว้และแฮชจริง แล้วขอการยืนยันก่อนดำเนินการต่อ ตัวช่วยอัปเดตแบบไม่โต้ตอบจะ fail closed เว้นแต่ caller จะระบุนโยบายดำเนินการต่ออย่างชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install ในการอัปเดต">
    `--dangerously-force-unsafe-install` ยังถูกรับใน `plugins update` เพื่อความเข้ากันได้ แต่เลิกใช้แล้วและจะไม่เปลี่ยนพฤติกรรมการอัปเดต Plugin อีกต่อไป `security.installPolicy` ของ operator ยังสามารถบล็อกการอัปเดตได้; hook `before_install` ของ Plugin จะมีผลเฉพาะใน process ที่มีการโหลด hook ของ Plugin
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk ในการอัปเดต">
    การอัปเดต Plugin ที่มี backend เป็น ClawHub จากชุมชนจะรันการตรวจสอบความเชื่อถือของ exact-release แบบเดียวกับการติดตั้งก่อนดาวน์โหลดแพ็กเกจทดแทน ใช้ `--acknowledge-clawhub-risk` สำหรับ automation ที่ผ่านการรีวิวแล้วซึ่งควรดำเนินการต่อเมื่อ release ของ ClawHub ที่เลือกมีคำเตือนความเชื่อถือที่มีความเสี่ยง แพ็กเกจ ClawHub ทางการและซอร์ส Plugin ของ OpenClaw ที่ bundled จะข้าม prompt ความเชื่อถือของ release นี้
  </Accordion>
</AccordionGroup>

### ตรวจสอบ

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect แสดง identity, สถานะการโหลด, source, ความสามารถของ manifest, policy flag, diagnostics, เมทาดาทาการติดตั้ง, ความสามารถของ bundle และการรองรับเซิร์ฟเวอร์ MCP หรือ LSP ที่ตรวจพบ โดยค่าเริ่มต้นจะไม่นำเข้า runtime ของ Plugin เอาต์พุต JSON รวม contract ของ manifest Plugin เช่น `contracts.agentToolResultMiddleware` และ `contracts.trustedToolPolicies` เพื่อให้ operator สามารถ audit การประกาศ trusted-surface ก่อนเปิดใช้งานหรือรีสตาร์ต Plugin เพิ่ม `--runtime` เพื่อโหลดโมดูล Plugin และรวม hook, tool, command, service, gateway method และ route HTTP ที่ลงทะเบียนไว้ การ inspect runtime จะรายงาน dependency ของ Plugin ที่ขาดหายโดยตรง; การติดตั้งและการซ่อมแซมยังอยู่ใน `openclaw plugins install`, `openclaw plugins update` และ `openclaw doctor --fix`

คำสั่ง CLI ที่ Plugin เป็นเจ้าของมักถูกติดตั้งเป็นกลุ่มคำสั่ง `openclaw` ระดับราก แต่ Plugin อาจลงทะเบียนคำสั่งซ้อนภายใต้ parent ของ core เช่น `openclaw nodes` ได้ด้วย หลังจาก `inspect --runtime` แสดงคำสั่งภายใต้ `cliCommands` ให้รันคำสั่งนั้นที่ path ที่ระบุไว้; ตัวอย่างเช่น Plugin ที่ลงทะเบียน `demo-git` สามารถตรวจสอบได้ด้วย `openclaw demo-git ping`

แต่ละ Plugin ถูกจัดประเภทตามสิ่งที่ลงทะเบียนจริงใน runtime:

- **plain-capability** — capability type หนึ่งประเภท (เช่น Plugin ที่เป็น provider อย่างเดียว)
- **hybrid-capability** — capability type หลายประเภท (เช่น ข้อความ + เสียงพูด + รูปภาพ)
- **hook-only** — มีเฉพาะ hook ไม่มี capability หรือ surface
- **non-capability** — tool/command/service แต่ไม่มี capability

ดู [รูปแบบ Plugin](/th/plugins/architecture#plugin-shapes) สำหรับรายละเอียดเพิ่มเติมเกี่ยวกับโมเดล capability

<Note>
flag `--json` ส่งออกรายงานที่เครื่องอ่านได้ เหมาะสำหรับ scripting และ auditing `inspect --all` แสดงตารางครอบคลุมทั้ง fleet พร้อมคอลัมน์ shape, ชนิด capability, compatibility notice, ความสามารถของ bundle และสรุป hook `info` เป็น alias ของ `inspect`
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` รายงานข้อผิดพลาดในการโหลด Plugin, diagnostics ของ manifest/discovery, compatibility notice และการอ้างอิง config ของ Plugin ที่ล้าสมัย เช่น slot ของ Plugin ที่หายไป เมื่อ install tree และ config ของ Plugin สะอาด จะพิมพ์ `No plugin issues detected.` หากยังมี config ล้าสมัยเหลืออยู่แต่ install tree ยังสมบูรณ์ดี สรุปจะบอกเช่นนั้นแทนการสื่อว่า Plugin ทั้งหมดสมบูรณ์เต็มที่

หาก Plugin ที่กำหนดค่าไว้มีอยู่บนดิสก์แต่ถูกบล็อกโดยการตรวจสอบ path-safety ของ loader การตรวจสอบ config จะคงรายการ Plugin ไว้และรายงานเป็น `present but blocked` ให้แก้ diagnostic ของ Plugin ที่ถูกบล็อกก่อนหน้านั้น เช่น ownership ของ path หรือ permission แบบ world-writable แทนการลบ config `plugins.entries.<id>` หรือ `plugins.allow`

สำหรับความล้มเหลวด้าน module-shape เช่น export `register`/`activate` ที่หายไป ให้รันซ้ำด้วย `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุป export-shape แบบกระชับในเอาต์พุต diagnostic

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

local plugin registry คือโมเดลอ่านแบบ cold ที่ persist ไว้ของ OpenClaw สำหรับ identity ของ Plugin ที่ติดตั้ง, การเปิดใช้งาน, เมทาดาทา source และ ownership ของ contribution การเริ่มทำงานปกติ, การค้นหา owner ของ provider, การจัดประเภทการตั้งค่า channel และ inventory ของ Plugin สามารถอ่านข้อมูลนี้ได้โดยไม่ต้องนำเข้าโมดูล runtime ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่า registry ที่ persist ไว้มีอยู่ เป็นปัจจุบัน หรือล้าสมัย ใช้ `--refresh` เพื่อสร้างใหม่จากดัชนี Plugin ที่ persist ไว้, นโยบาย config และเมทาดาทา manifest/package นี่เป็น path การซ่อมแซม ไม่ใช่ path การเปิดใช้งาน runtime

`openclaw doctor --fix` ยังซ่อมแซม npm drift ที่มีการจัดการและอยู่ใกล้ registry ด้วย: หากแพ็กเกจ `@openclaw/*` ที่กำพร้าหรือกู้คืนมาอยู่ภายใต้โปรเจกต์ npm ของ Plugin ที่มีการจัดการ หรือราก npm แบบ flat ที่มีการจัดการแบบ legacy ไป shadow Plugin ที่ bundled อยู่ doctor จะลบแพ็กเกจล้าสมัยนั้นและสร้าง registry ใหม่ เพื่อให้ startup ตรวจสอบกับ manifest ที่ bundled doctor ยัง relink แพ็กเกจ host `openclaw` เข้าไปใน Plugin npm ที่มีการจัดการซึ่งประกาศ `peerDependencies.openclaw` เพื่อให้ import runtime ภายในแพ็กเกจ เช่น `openclaw/plugin-sdk/*` resolve ได้หลังการอัปเดตหรือการซ่อม npm

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็นสวิตช์ความเข้ากันได้แบบ break-glass ที่เลิกใช้แล้วสำหรับความล้มเหลวในการอ่าน registry ให้ใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix` แทน; env fallback มีไว้สำหรับการกู้คืน startup ฉุกเฉินระหว่างที่ migration กำลัง rollout เท่านั้น
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

รายการ Marketplace รับ path marketplace ในเครื่อง, path `marketplace.json`, ชวเลข GitHub เช่น `owner/repo`, URL repo ของ GitHub หรือ URL git `--json` จะพิมพ์ label ของ source ที่ resolve แล้ว พร้อม manifest marketplace ที่ parse แล้วและรายการ Plugin

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [เอกสารอ้างอิง CLI](/th/cli)
- [ClawHub](/th/clawhub)
