---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือบันเดิลที่เข้ากันได้
    - คุณต้องการสร้างโครงร่างหรือตรวจสอบความถูกต้องของ Plugin เครื่องมือแบบง่าย
    - คุณต้องการดีบักความล้มเหลวในการโหลด Plugin
sidebarTitle: Plugins
summary: คู่มืออ้างอิง CLI สำหรับ `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-06-28T20:43:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a703adb93af2490282f73b25cbbd95c7bc1d54c9c9c656fdb9b75465683f4ec8
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Plugin ของ Gateway, แพ็ก hook และบันเดิลที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="Plugin system" href="/th/tools/plugin">
    คู่มือผู้ใช้ปลายทางสำหรับติดตั้ง เปิดใช้งาน และแก้ปัญหา Plugin
  </Card>
  <Card title="Manage plugins" href="/th/plugins/manage-plugins">
    ตัวอย่างสั้น ๆ สำหรับการติดตั้ง แสดงรายการ อัปเดต ถอนการติดตั้ง และเผยแพร่
  </Card>
  <Card title="Plugin bundles" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของบันเดิล
  </Card>
  <Card title="Plugin manifest" href="/th/plugins/manifest">
    ฟิลด์ manifest และสคีมาการกำหนดค่า
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
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile clawhub-public --json
openclaw plugins marketplace refresh --feed-url https://clawhub.ai/v1/feeds/plugins --expected-sha256 <sha256>
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

สำหรับการตรวจสอบการติดตั้ง การ inspect การถอนการติดตั้ง หรือการ refresh registry ที่ช้า ให้เรียกใช้
คำสั่งพร้อม `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` trace จะเขียน timing ของแต่ละ phase
ไปยัง stderr และยังทำให้เอาต์พุต JSON parse ได้ ดู [การดีบัก](/th/help/debugging#plugin-lifecycle-trace)

<Note>
ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) ตัวเปลี่ยนแปลง lifecycle ของ Plugin จะถูกปิดใช้งาน ใช้แหล่งที่มาของ Nix สำหรับการติดตั้งนี้แทน `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` หรือ `plugins disable`; สำหรับ nix-openclaw ให้ใช้ [เริ่มต้นอย่างรวดเร็ว](https://github.com/openclaw/nix-openclaw#quick-start) แบบ agent-first
</Note>

<Note>
Plugin ที่บันเดิลมาด้วยจัดส่งพร้อม OpenClaw บางตัวเปิดใช้งานเป็นค่าเริ่มต้น (เช่น provider โมเดลที่บันเดิลมา, provider เสียงพูดที่บันเดิลมา และ Plugin เบราว์เซอร์ที่บันเดิลมา); ตัวอื่นต้องใช้ `plugins enable`

Plugin ของ OpenClaw แบบ native ต้องจัดส่ง `openclaw.plugin.json` พร้อม JSON Schema แบบ inline (`configSchema` แม้จะว่างก็ตาม) บันเดิลที่เข้ากันได้จะใช้ manifest ของบันเดิลของตนเองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุตรายการ/info แบบ verbose ยังแสดง subtype ของบันเดิล (`codex`, `claude` หรือ `cursor`) พร้อม capability ของบันเดิลที่ตรวจพบด้วย
</Note>

### ผู้เขียน

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` จะสร้าง Plugin เครื่องมือ TypeScript ขั้นต่ำเป็นค่าเริ่มต้น อาร์กิวเมนต์แรก
คือ id ของ Plugin; ส่ง `--name` สำหรับชื่อที่แสดง OpenClaw ใช้
id สำหรับไดเรกทอรีเอาต์พุตเริ่มต้นและการตั้งชื่อ package สแคฟโฟลด์เครื่องมือใช้
`defineToolPlugin`
`plugins build` import entry ที่ build แล้ว อ่าน metadata แบบ static ของเครื่องมือ เขียน
`openclaw.plugin.json` และทำให้ `openclaw.extensions` ใน `package.json` สอดคล้องกัน
`plugins validate` ตรวจสอบว่า manifest ที่สร้างขึ้น metadata ของ package และ
entry export ปัจจุบันยังตรงกัน ดู [Plugin เครื่องมือ](/th/plugins/tool-plugins) สำหรับ
workflow การเขียนเครื่องมือแบบเต็ม

สแคฟโฟลด์เขียนซอร์ส TypeScript แต่สร้าง metadata จาก entry
`./dist/index.js` ที่ build แล้ว ดังนั้น workflow จึงใช้ได้กับ CLI ที่เผยแพร่แล้วด้วย ใช้
`--entry <path>` เมื่อ entry ไม่ใช่ package entry เริ่มต้น ใช้
`plugins build --check` ใน CI เพื่อให้ล้มเหลวเมื่อ metadata ที่สร้างไว้ล้าสมัยโดยไม่
เขียนไฟล์ใหม่

### สแคฟโฟลด์ Provider

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

สแคฟโฟลด์ Provider จะสร้าง Plugin provider ข้อความ/โมเดลทั่วไปที่มีระบบ API key
แบบเข้ากันได้กับ OpenAI, สคริปต์ `npm run validate` ในตัวสำหรับ `clawhub package
validate`, metadata ของ package สำหรับ ClawHub และ GitHub workflow ที่สั่งทำงานด้วยตนเอง
สำหรับการเผยแพร่ที่เชื่อถือได้ในอนาคตผ่าน GitHub Actions OIDC สแคฟโฟลด์ Provider
ไม่สร้าง Skills และไม่ใช้ `openclaw plugins build` หรือ
`openclaw plugins validate`; คำสั่งเหล่านั้นมีไว้สำหรับเส้นทาง metadata ที่สร้างโดย
สแคฟโฟลด์เครื่องมือ

ก่อนเผยแพร่ ให้แทนที่ URL ฐาน API ชั่วคราว แค็ตตาล็อกโมเดล เส้นทางเอกสาร
ข้อความ credential และเนื้อหา README ด้วยรายละเอียด provider จริง ใช้
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

ผู้ดูแลที่ทดสอบการติดตั้งในช่วง setup สามารถ override แหล่งติดตั้ง Plugin อัตโนมัติ
ด้วย environment variables ที่มี guard ดู
[override การติดตั้ง Plugin](/th/plugins/install-overrides)

<Warning>
ชื่อ package แบบเปล่าจะติดตั้งจาก npm เป็นค่าเริ่มต้นในช่วงเปลี่ยนผ่านการเปิดตัว เว้นแต่ว่าจะตรงกับ id ของ Plugin ทางการ spec package `@openclaw/*` แบบ raw ที่ตรงกับ Plugin ที่บันเดิลมาจะใช้สำเนาที่บันเดิลมาพร้อม build ปัจจุบันของ OpenClaw ใช้ `npm:<package>` เมื่อคุณตั้งใจต้องการ package npm ภายนอกแทน ใช้ `clawhub:<package>` สำหรับ ClawHub ปฏิบัติกับการติดตั้ง Plugin เหมือนกับการรันโค้ด ควรใช้เวอร์ชันที่ pin ไว้
</Warning>

`plugins search` query ClawHub เพื่อหา package ของ Plugin ที่ติดตั้งได้และพิมพ์
ชื่อ package ที่พร้อมติดตั้ง โดยค้นหา package แบบ code-plugin และ bundle-plugin
ไม่ใช่ skills ใช้ `openclaw skills search` สำหรับ Skills ของ ClawHub

<Note>
ClawHub เป็นพื้นผิวหลักสำหรับการแจกจ่ายและค้นพบ Plugin ส่วนใหญ่ Npm
ยังคงเป็น fallback ที่รองรับและเส้นทาง direct-install package Plugin
`@openclaw/*` ที่ OpenClaw เป็นเจ้าของเผยแพร่บน npm อีกครั้งแล้ว; ดูรายการปัจจุบัน
ที่ [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) หรือ
[รายการ inventory ของ Plugin](/th/plugins/plugin-inventory) การติดตั้ง stable ใช้ `latest`
การติดตั้งและอัปเดตในช่อง beta จะเลือกใช้ dist-tag `beta` ของ npm เมื่อ tag นั้น
พร้อมใช้งาน จากนั้นจึง fallback ไปที่ `latest`
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    หากส่วน `plugins` ของคุณมี single-file `$include` เป็น backing, `plugins install/update/enable/disable/uninstall` จะเขียนผ่านไปยังไฟล์ที่ include นั้นและปล่อย `openclaw.json` ไว้ไม่เปลี่ยนแปลง Root includes, include arrays และ includes ที่มี sibling overrides จะ fail closed แทนการ flatten ดู [Config includes](/th/gateway/configuration) สำหรับรูปแบบที่รองรับ

    หาก config ไม่ถูกต้องระหว่างติดตั้ง ปกติ `plugins install` จะ fail closed และบอกให้คุณรัน `openclaw doctor --fix` ก่อน ระหว่างการเริ่มต้น Gateway และ hot reload, config ของ Plugin ที่ไม่ถูกต้องจะ fail closed เหมือน config อื่นที่ไม่ถูกต้อง; `openclaw doctor --fix` สามารถ quarantine entry ของ Plugin ที่ไม่ถูกต้องได้ ข้อยกเว้นระหว่างติดตั้งที่บันทึกไว้เพียงอย่างเดียวคือเส้นทางกู้คืน Plugin ที่บันเดิลมาแบบแคบสำหรับ Plugin ที่ opt in อย่างชัดเจนผ่าน `openclaw.install.allowInvalidConfigRecovery`

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` ใช้ target การติดตั้งเดิมซ้ำและ overwrite Plugin หรือแพ็ก hook ที่ติดตั้งอยู่แล้วในที่เดิม ใช้เมื่อคุณตั้งใจ reinstall id เดิมจาก local path, archive, package ClawHub หรือ artifact npm ใหม่ สำหรับการ upgrade ตามปกติของ Plugin npm ที่ tracked อยู่แล้ว ควรใช้ `openclaw plugins update <id-or-npm-spec>`

    หากคุณรัน `plugins install` สำหรับ id ของ Plugin ที่ติดตั้งอยู่แล้ว OpenClaw จะหยุดและชี้คุณไปที่ `plugins update <id-or-npm-spec>` สำหรับ upgrade ปกติ หรือไปที่ `plugins install <package> --force` เมื่อคุณต้องการ overwrite การติดตั้งปัจจุบันจากแหล่งอื่นจริง ๆ

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` ใช้กับการติดตั้ง npm เท่านั้น ไม่รองรับกับการติดตั้ง `git:`; ใช้ git ref ที่ชัดเจน เช่น `git:github.com/acme/plugin@v1.2.3` เมื่อคุณต้องการแหล่งที่มาแบบ pin ไว้ ไม่รองรับกับ `--marketplace` เพราะการติดตั้ง marketplace จะ persist metadata แหล่งที่มาของ marketplace แทน npm spec
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` ถูก deprecate แล้วและตอนนี้เป็น no-op OpenClaw ไม่รันการบล็อก dangerous-code ระหว่างติดตั้งแบบ built-in สำหรับการติดตั้ง Plugin อีกต่อไป

    ใช้พื้นผิว `security.installPolicy` ที่ operator เป็นเจ้าของร่วมกันเมื่อจำเป็นต้องมีนโยบายการติดตั้งเฉพาะ host hook `before_install` ของ Plugin เป็น hook lifecycle ของ plugin-runtime และไม่ใช่ขอบเขตนโยบายหลักสำหรับการติดตั้งผ่าน CLI

    หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกซ่อนหรือถูกบล็อกโดยการ scan ของ registry ให้ใช้ขั้นตอนของ publisher ใน [การเผยแพร่ ClawHub](/th/clawhub/publishing) `--dangerously-force-unsafe-install` จะไม่ขอให้ ClawHub scan Plugin ใหม่หรือทำให้ release ที่ถูกบล็อกเป็นสาธารณะ

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    การติดตั้ง ClawHub community จะตรวจสอบ trust record ของ release ที่เลือกก่อนดาวน์โหลด package หาก ClawHub ปิดการดาวน์โหลดสำหรับ release, รายงานผล scan ที่เป็น malicious หรือวาง release ไว้ในสถานะ moderation แบบบล็อก เช่น quarantine, OpenClaw จะปฏิเสธ release นั้น สำหรับสถานะ scan ที่เสี่ยงแต่ไม่บล็อก, สถานะ moderation ที่เสี่ยง หรือเหตุผลจาก registry, OpenClaw จะแสดงรายละเอียด trust และขอการยืนยันก่อนดำเนินการต่อ

    ใช้ `--acknowledge-clawhub-risk` เฉพาะหลังจากตรวจทานคำเตือนของ ClawHub และตัดสินใจดำเนินการต่อโดยไม่มี interactive prompt trust record ที่ pending หรือ clean แต่ stale จะเตือนแต่ไม่ต้อง acknowledgement package ทางการของ ClawHub และแหล่ง Plugin ของ OpenClaw ที่บันเดิลมาจะ bypass prompt release-trust นี้

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับแพ็ก hook ที่ expose `openclaw.hooks` ใน `package.json` ใช้ `openclaw hooks` สำหรับการมองเห็น hook แบบ filtered และการเปิดใช้งานราย hook ไม่ใช่การติดตั้ง package

    ข้อกำหนด npm เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **เวอร์ชันแบบตรงตัว** หรือ **dist-tag** ที่เป็นทางเลือก) ข้อกำหนด Git/URL/file และช่วง semver จะถูกปฏิเสธ การติดตั้ง dependency จะรันในโปรเจกต์ npm ที่จัดการหนึ่งโปรเจกต์ต่อ Plugin พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้ว่า shell ของคุณจะมีการตั้งค่าการติดตั้ง npm แบบ global ก็ตาม โปรเจกต์ npm ของ Plugin ที่จัดการจะสืบทอด `overrides` ระดับแพ็กเกจ npm ของ OpenClaw ดังนั้น security pin ของ host จึงมีผลกับ dependency ของ Plugin ที่ถูก hoist ด้วย

    ใช้ `npm:<package>` เมื่อคุณต้องการทำให้การ resolve ของ npm ชัดเจน ข้อกำหนดแพ็กเกจแบบเปล่าจะติดตั้งโดยตรงจาก npm ระหว่างช่วงเปลี่ยนผ่านการเปิดตัวด้วย เว้นแต่ว่าจะตรงกับ id ของ Plugin อย่างเป็นทางการ

    ข้อกำหนดแพ็กเกจ `@openclaw/*` แบบดิบที่ตรงกับ Plugin ที่ bundled จะ resolve ไปยังสำเนา bundled ที่ image เป็นเจ้าของก่อน fallback ไปยัง npm ตัวอย่างเช่น `openclaw plugins install @openclaw/discord@2026.5.20 --pin` ใช้ Plugin Discord แบบ bundled จาก build ปัจจุบันของ OpenClaw แทนการสร้าง managed npm override หากต้องการบังคับใช้แพ็กเกจ npm ภายนอก ให้ใช้ `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`

    ข้อกำหนดแบบเปล่าและ `@latest` จะคงอยู่ใน stable track เวอร์ชันแก้ไขที่ประทับวันที่ของ OpenClaw เช่น `2026.5.3-1` ถือเป็น stable release สำหรับการตรวจสอบนี้ หาก npm resolve รายการใดรายการหนึ่งเป็น prerelease, OpenClaw จะหยุดและขอให้คุณเลือกเข้าร่วมอย่างชัดเจนด้วย prerelease tag เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease แบบตรงตัว เช่น `@1.2.3-beta.4`

    สำหรับการติดตั้ง npm โดยไม่มีเวอร์ชันแบบตรงตัว (`npm:<package>` หรือ `npm:<package>@latest`), OpenClaw จะตรวจสอบ metadata ของแพ็กเกจที่ resolve แล้วก่อนติดตั้ง หากแพ็กเกจ stable ล่าสุดต้องใช้ OpenClaw Plugin API ที่ใหม่กว่า หรือเวอร์ชัน host ขั้นต่ำที่ใหม่กว่า OpenClaw จะตรวจสอบเวอร์ชัน stable ที่เก่ากว่าและติดตั้ง release ล่าสุดที่เข้ากันได้แทน เวอร์ชันแบบตรงตัวและ dist-tag ที่ระบุชัดเจน เช่น `@beta` ยังคงเข้มงวด: หากแพ็กเกจที่เลือกไม่เข้ากัน คำสั่งจะล้มเหลวและขอให้คุณอัปเกรด OpenClaw หรือเลือกเวอร์ชันที่เข้ากันได้

    หากข้อกำหนดการติดตั้งแบบเปล่าตรงกับ id ของ Plugin อย่างเป็นทางการ (เช่น `diffs`), OpenClaw จะติดตั้งรายการ catalog โดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่มีชื่อเดียวกัน ให้ใช้ข้อกำหนด scoped ที่ชัดเจน (เช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="Git repositories">
    ใช้ `git:<repo>` เพื่อติดตั้งโดยตรงจาก git repository รูปแบบที่รองรับรวมถึง URL clone แบบ `git:github.com/owner/repo`, `git:owner/repo`, `https://` แบบเต็ม, `ssh://`, `git://`, `file://`, และ `git@host:owner/repo.git` เพิ่ม `@<ref>` หรือ `#<ref>` เพื่อ checkout branch, tag หรือ commit ก่อนติดตั้ง

    การติดตั้ง Git จะ clone ไปยังไดเรกทอรีชั่วคราว, checkout ref ที่ร้องขอเมื่อมีอยู่, จากนั้นใช้ตัวติดตั้งไดเรกทอรี Plugin ตามปกติ ซึ่งหมายความว่าการตรวจสอบ manifest, นโยบายการติดตั้งของ operator, งานติดตั้งของ package-manager และบันทึกการติดตั้งจะทำงานเหมือนการติดตั้ง npm การติดตั้ง git ที่บันทึกไว้จะรวม URL/ref ต้นทางและ commit ที่ resolve แล้ว เพื่อให้ `openclaw plugins update` สามารถ resolve ต้นทางใหม่ภายหลังได้

    หลังจากติดตั้งจาก git ให้ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อตรวจสอบการลงทะเบียน runtime เช่น gateway methods และคำสั่ง CLI หาก Plugin ลงทะเบียน root ของ CLI ด้วย `api.registerCli` ให้เรียกใช้คำสั่งนั้นโดยตรงผ่าน root CLI ของ OpenClaw เช่น `openclaw demo-plugin ping`

  </Accordion>
  <Accordion title="Archives">
    archive ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` archive ของ OpenClaw Plugin แบบ native ต้องมี `openclaw.plugin.json` ที่ถูกต้องอยู่ที่ root ของ Plugin หลังแตกไฟล์แล้ว; archive ที่มีเพียง `package.json` จะถูกปฏิเสธก่อนที่ OpenClaw จะเขียนบันทึกการติดตั้ง

    ใช้ `npm-pack:<path.tgz>` เมื่อไฟล์เป็น tarball แบบ npm-pack และคุณต้องการ
    ทดสอบ path โปรเจกต์ npm ที่จัดการต่อ Plugin แบบเดียวกับที่การติดตั้งจาก registry ใช้
    รวมถึงการตรวจสอบ `package-lock.json`, การสแกน dependency ที่ถูก hoist
    และบันทึกการติดตั้ง npm path archive ปกติยังคงติดตั้งเป็น archive แบบ local
    ภายใต้ root ของส่วนขยาย Plugin

    การติดตั้ง Claude marketplace ก็รองรับเช่นกัน

  </Accordion>
</AccordionGroup>

การติดตั้ง ClawHub ใช้ locator แบบชัดเจน `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

ข้อกำหนด Plugin แบบเปล่าที่ปลอดภัยสำหรับ npm จะติดตั้งจาก npm โดยค่าเริ่มต้นระหว่างช่วงเปลี่ยนผ่านการเปิดตัว เว้นแต่ว่าจะตรงกับ id ของ Plugin อย่างเป็นทางการ:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อทำให้การ resolve แบบ npm-only ชัดเจน:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw ตรวจสอบ Plugin API / ความเข้ากันได้ขั้นต่ำของ gateway ที่ประกาศไว้ก่อนติดตั้ง เมื่อเวอร์ชัน ClawHub ที่เลือกเผยแพร่ artifact แบบ ClawPack, OpenClaw จะดาวน์โหลด npm-pack `.tgz` ที่มีเวอร์ชัน, ตรวจสอบ digest header ของ ClawHub และ digest ของ artifact, จากนั้นติดตั้งผ่าน path archive ปกติ เวอร์ชัน ClawHub ที่เก่ากว่าและไม่มี metadata ของ ClawPack จะยังคงติดตั้งผ่าน path การตรวจสอบ package archive แบบ legacy การติดตั้งที่บันทึกไว้จะเก็บ metadata ต้นทางของ ClawHub, ชนิด artifact, npm integrity, npm shasum, ชื่อ tarball และข้อมูล digest ของ ClawPack ไว้สำหรับการอัปเดตภายหลัง
การติดตั้ง ClawHub ที่ไม่ระบุเวอร์ชันจะเก็บข้อกำหนดที่บันทึกไว้แบบไม่ระบุเวอร์ชัน เพื่อให้ `openclaw plugins update` สามารถติดตาม release ใหม่ของ ClawHub ได้; ตัวเลือกเวอร์ชันหรือ tag ที่ระบุชัดเจน เช่น `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` จะยังคงถูก pin ไว้กับตัวเลือกนั้น

#### ชวเลข Marketplace

ใช้ชวเลข `plugin@marketplace` เมื่อชื่อ marketplace มีอยู่ใน cache registry แบบ local ของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

ใช้ `--marketplace` เมื่อคุณต้องการส่งต้นทางของ marketplace อย่างชัดเจน:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - ชื่อ Claude known-marketplace จาก `~/.claude/plugins/known_marketplaces.json`
    - root ของ marketplace แบบ local หรือ path `marketplace.json`
    - ชวเลข GitHub repo เช่น `owner/repo`
    - URL ของ GitHub repo เช่น `https://github.com/owner/repo`
    - URL ของ git

  </Tab>
  <Tab title="Remote marketplace rules">
    สำหรับ marketplace ระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องอยู่ภายใน repo ของ marketplace ที่ clone มา OpenClaw ยอมรับต้นทางแบบ relative path จาก repo นั้น และปฏิเสธต้นทาง Plugin แบบ HTTP(S), absolute-path, git, GitHub และแบบอื่นที่ไม่ใช่ path จาก manifest ระยะไกล
  </Tab>
</Tabs>

สำหรับ path และ archive แบบ local, OpenClaw จะตรวจจับอัตโนมัติ:

- OpenClaw Plugin แบบ native (`openclaw.plugin.json`)
- bundle ที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- bundle ที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือ layout component เริ่มต้นของ Claude)
- bundle ที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

การติดตั้งแบบ local ที่จัดการต้องเป็นไดเรกทอรีหรือ archive ของ Plugin ไฟล์ Plugin แบบ standalone `.js`,
`.mjs`, `.cjs` และ `.ts` จะไม่ถูกคัดลอกเข้าไปใน root ของ Plugin ที่จัดการ
โดย `plugins install`; ให้ระบุไฟล์เหล่านั้นอย่างชัดเจนใน `plugins.load.paths` แทน

<Note>
bundle ที่เข้ากันได้จะติดตั้งลงใน root ของ Plugin ปกติ และเข้าร่วม flow list/info/enable/disable เดียวกัน ปัจจุบันรองรับ Skills ของ bundle, Claude command-skills, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `lspServers` ที่ประกาศใน `.lsp.json` / manifest ของ Claude, Cursor command-skills และไดเรกทอรี hook ของ Codex ที่เข้ากันได้; capability ของ bundle อื่นที่ตรวจพบจะแสดงใน diagnostics/info แต่ยังไม่ได้เชื่อมต่อกับการรัน runtime
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
  แสดงเฉพาะ Plugin ที่เปิดใช้งาน
</ParamField>
<ParamField path="--verbose" type="boolean">
  เปลี่ยนจากมุมมองตารางเป็นบรรทัดรายละเอียดราย Plugin พร้อม metadata ของ source/origin/version/activation
</ParamField>
<ParamField path="--json" type="boolean">
  inventory ที่เครื่องอ่านได้ พร้อม diagnostics ของ registry และสถานะการติดตั้ง dependency ของแพ็กเกจ
</ParamField>

<Note>
`plugins list` อ่าน registry ของ Plugin แบบ local ที่ persist ไว้ก่อน พร้อม fallback ที่ derive จาก manifest เท่านั้นเมื่อ registry ขาดหายหรือไม่ถูกต้อง สิ่งนี้มีประโยชน์สำหรับตรวจสอบว่า Plugin ถูกติดตั้ง, เปิดใช้งาน และมองเห็นได้ต่อการวางแผน cold startup หรือไม่ แต่ไม่ใช่ probe runtime สดของ process Gateway ที่กำลังทำงานอยู่ หลังจากเปลี่ยน code ของ Plugin, enablement, hook policy หรือ `plugins.load.paths` ให้ restart Gateway ที่ให้บริการ channel ก่อนคาดหวังให้ code หรือ hook ใหม่ของ `register(api)` ทำงาน สำหรับ deployment ระยะไกล/container ให้ตรวจสอบว่าคุณกำลัง restart child `openclaw gateway run` ตัวจริง ไม่ใช่เพียง process wrapper

`plugins list --json` รวม `dependencyStatus` ของแต่ละ Plugin จาก `dependencies` และ `optionalDependencies` ใน `package.json` OpenClaw ตรวจสอบว่าชื่อแพ็กเกจเหล่านั้นมีอยู่ตาม path lookup `node_modules` ปกติของ Plugin หรือไม่; OpenClaw
จะไม่ import code runtime ของ Plugin, ไม่รัน package manager และไม่ซ่อมแซม
dependency ที่ขาดหาย
</Note>

หาก startup log ระบุว่า `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
ให้รัน `openclaw plugins list --enabled --verbose` หรือ
`openclaw plugins inspect <id>` พร้อม id ของ Plugin ที่อยู่ในรายการ เพื่อยืนยัน id ของ Plugin
และคัดลอก id ที่เชื่อถือได้ไปยัง `plugins.allow` ใน `openclaw.json` เมื่อ
warning สามารถแสดง Plugin ทุกตัวที่พบได้ จะพิมพ์ snippet
`plugins.allow` ที่พร้อมวางและมี id เหล่านั้นอยู่แล้ว หาก Plugin โหลด
โดยไม่มี provenance ของการติดตั้ง/load-path ให้ inspect id ของ Plugin นั้น จากนั้น pin
id ที่เชื่อถือได้ใน `plugins.allow` หรือติดตั้ง Plugin ใหม่จากต้นทางที่เชื่อถือได้
เพื่อให้ OpenClaw บันทึก provenance ของการติดตั้ง

`plugins search` คือการค้นหา catalog ระยะไกลของ ClawHub โดยจะไม่ตรวจสอบ state แบบ local,
ไม่แก้ไข config, ไม่ติดตั้งแพ็กเกจ และไม่โหลด code runtime ของ Plugin ผลการค้นหา
รวมชื่อแพ็กเกจ ClawHub, family, channel, version, summary และ
คำแนะนำการติดตั้ง เช่น `openclaw plugins install clawhub:<package>`

สำหรับงาน Plugin แบบ bundled ภายใน Docker image ที่แพ็กเกจแล้ว ให้ bind-mount ไดเรกทอรี
source ของ Plugin ทับ path source ที่แพ็กเกจไว้ตรงกัน เช่น
`/app/extensions/synology-chat` OpenClaw จะค้นพบ source
overlay ที่ mount ไว้นั้นก่อน `/app/dist/extensions/synology-chat`; ไดเรกทอรี source
ที่คัดลอกแบบธรรมดาจะยังคงไม่ทำงาน เพื่อให้การติดตั้งแบบแพ็กเกจปกติยังใช้ dist ที่ compile แล้ว

สำหรับการ debug hook runtime:

- `openclaw plugins inspect <id> --runtime --json` แสดง hook ที่ลงทะเบียนและ diagnostics จาก pass การตรวจสอบที่โหลด module การตรวจสอบ runtime จะไม่ติดตั้ง dependency; ใช้ `openclaw doctor --fix` เพื่อล้าง state ของ dependency แบบ legacy หรือกู้คืน Plugin ที่ดาวน์โหลดได้ซึ่งถูกอ้างอิงโดย config
- `openclaw gateway status --deep --require-rpc` ยืนยัน URL/profile ของ Gateway ที่เข้าถึงได้, hint ของ service/process, path config และสุขภาพของ RPC
- hook การสนทนาแบบ non-bundled (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรี Plugin แบบ local (เพิ่มลงใน `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

ไฟล์ Plugin แบบ standalone ต้องถูกระบุไว้ใน `plugins.load.paths` แทนการ
ติดตั้งด้วย `plugins install` หรือวางโดยตรงใน `~/.openclaw/extensions`
หรือ `<workspace>/.openclaw/extensions` root ที่ค้นพบอัตโนมัติเหล่านั้นจะโหลด
แพ็กเกจหรือไดเรกทอรี bundle ของ Plugin ส่วนไฟล์ script ระดับบนสุดจะถูกถือว่าเป็น
helper แบบ local และถูกข้าม

<Note>
Plugin ที่มีต้นทางจาก workspace ซึ่งค้นพบจากราก extensions ของ workspace จะไม่ถูก
นำเข้าหรือเรียกใช้งานจนกว่าจะถูกเปิดใช้งานอย่างชัดเจน สำหรับการพัฒนาในเครื่อง
ให้รัน `openclaw plugins enable <plugin-id>` หรือตั้งค่า
`plugins.entries.<plugin-id>.enabled: true`; หาก config ของคุณใช้
`plugins.allow` ให้ใส่ id ของ Plugin เดียวกันไว้ที่นั่นด้วย กฎ fail-closed นี้
ยังมีผลเมื่อการตั้งค่า channel ระบุเป้าหมายเป็น Plugin ที่มีต้นทางจาก workspace อย่างชัดเจนสำหรับ
การโหลดเพื่อการตั้งค่าเท่านั้น ดังนั้นโค้ดตั้งค่า channel plugin ในเครื่องจะไม่ทำงานขณะที่
Plugin ของ workspace นั้นยังถูกปิดใช้งานหรือถูกตัดออกจาก allowlist การติดตั้งแบบลิงก์
และรายการ `plugins.load.paths` ที่ระบุอย่างชัดเจนจะใช้นโยบายปกติสำหรับ
ต้นทาง Plugin ที่ resolve ได้ ดู
[กำหนดค่านโยบาย Plugin](/th/tools/plugin#configure-plugin-policy)
และ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#plugins)

ไม่รองรับ `--force` กับ `--link` เพราะการติดตั้งแบบลิงก์ใช้ path ต้นทางซ้ำแทนการคัดลอกทับเป้าหมายการติดตั้งที่มีการจัดการ

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึก spec ที่ resolve ได้แบบเจาะจง (`name@version`) ในดัชนี Plugin ที่มีการจัดการ โดยยังคงพฤติกรรมเริ่มต้นแบบไม่ pin ไว้
</Note>

### ดัชนี Plugin

เมทาดาทาการติดตั้ง Plugin เป็นสถานะที่เครื่องจัดการ ไม่ใช่ config ของผู้ใช้ การติดตั้งและการอัปเดตจะเขียนข้อมูลนี้ลงฐานข้อมูลสถานะ SQLite ที่ใช้ร่วมกันภายใต้ไดเรกทอรีสถานะ OpenClaw ที่ใช้งานอยู่ แถว `installed_plugin_index` เก็บเมทาดาทา `installRecords` แบบคงทน รวมถึงเรกคอร์ดสำหรับ manifest ของ Plugin ที่เสียหรือขาดหาย พร้อมแคช cold registry ที่ได้จาก manifest ซึ่งใช้โดย `openclaw plugins update`, การถอนการติดตั้ง, การวินิจฉัย และ cold plugin registry

เมื่อ OpenClaw พบเรกคอร์ด `plugins.installs` legacy ที่เคยจัดส่งแล้วใน config การอ่านของ runtime จะถือว่าเป็นอินพุตเพื่อความเข้ากันได้โดยไม่เขียน `openclaw.json` ใหม่ การเขียน Plugin อย่างชัดเจนและ `openclaw doctor --fix` จะย้ายเรกคอร์ดเหล่านั้นเข้าสู่ดัชนี Plugin และลบคีย์ config เมื่ออนุญาตให้เขียน config ได้; หากการเขียนรายการใดล้มเหลว เรกคอร์ด config จะถูกเก็บไว้เพื่อไม่ให้เมทาดาทาการติดตั้งสูญหาย

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` จะลบเรกคอร์ด Plugin ออกจาก `plugins.entries`, ดัชนี Plugin ที่ persist ไว้, รายการ allow/deny list ของ Plugin และรายการ `plugins.load.paths` แบบลิงก์เมื่อเกี่ยวข้อง เว้นแต่จะตั้งค่า `--keep-files` การถอนการติดตั้งยังลบไดเรกทอรีติดตั้งที่มีการจัดการและถูกติดตาม เมื่อไดเรกทอรีนั้นอยู่ภายในราก extensions ของ Plugin ของ OpenClaw สำหรับ Plugin active memory ช่อง memory จะรีเซ็ตเป็น `memory-core`

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
    เมื่อคุณส่ง id ของ Plugin OpenClaw จะใช้ spec การติดตั้งที่บันทึกไว้สำหรับ Plugin นั้นซ้ำ ซึ่งหมายความว่า dist-tags ที่เคยจัดเก็บไว้ก่อนหน้า เช่น `@beta` และเวอร์ชันที่ pin แบบเจาะจงจะยังคงถูกใช้ในการรัน `update <id>` ครั้งต่อๆ ไป

    ระหว่าง `update <id> --dry-run` การติดตั้ง npm ที่ pin แบบเจาะจงจะยังคงถูก pin ไว้ หาก OpenClaw ยังสามารถ resolve สาย registry default ของแพ็กเกจได้ และสาย default นั้นใหม่กว่าเวอร์ชันที่ pin และติดตั้งอยู่ dry run จะรายงาน pin และพิมพ์คำสั่งอัปเดตแพ็กเกจ `@latest` แบบชัดเจนเพื่อให้ตามสาย registry default

    กฎการอัปเดตแบบเจาะจงนั้นต่างจากเส้นทางบำรุงรักษาแบบรวม `openclaw plugins update --all` การอัปเดตแบบรวมยังเคารพ spec การติดตั้งที่ถูกติดตามตามปกติ แต่เรกคอร์ด Plugin ทางการที่เชื่อถือได้ของ OpenClaw สามารถ sync ไปยังเป้าหมาย catalog ทางการปัจจุบันแทนการค้างอยู่บนแพ็กเกจทางการแบบเจาะจงที่ล้าสมัย ใช้ `update <id>` แบบเจาะจงเมื่อคุณตั้งใจให้ spec ทางการแบบเจาะจงหรือแบบ tag คงเดิมไม่ถูกแตะต้อง

    สำหรับการติดตั้ง npm คุณยังสามารถส่ง npm package spec ที่ระบุ dist-tag หรือเวอร์ชันเจาะจงได้ OpenClaw จะ resolve ชื่อแพ็กเกจนั้นกลับไปยังเรกคอร์ด Plugin ที่ถูกติดตาม อัปเดต Plugin ที่ติดตั้งนั้น และบันทึก npm spec ใหม่สำหรับการอัปเดตตาม id ในอนาคต

    การส่งชื่อแพ็กเกจ npm โดยไม่มีเวอร์ชันหรือ tag จะ resolve กลับไปยังเรกคอร์ด Plugin ที่ถูกติดตามเช่นกัน ใช้สิ่งนี้เมื่อ Plugin ถูก pin ไว้ที่เวอร์ชันเจาะจง และคุณต้องการย้ายกลับไปยังสาย release เริ่มต้นของ registry

  </Accordion>
  <Accordion title="การอัปเดตช่อง beta">
    `openclaw plugins update <id-or-npm-spec>` แบบเจาะจงจะใช้ spec ของ Plugin ที่ถูกติดตามซ้ำ เว้นแต่คุณจะส่ง spec ใหม่ `openclaw plugins update --all` แบบรวมจะใช้ `update.channel` ที่กำหนดไว้เมื่อ sync เรกคอร์ด Plugin ทางการที่เชื่อถือได้ไปยังเป้าหมาย catalog ทางการ ดังนั้นการติดตั้งช่อง beta จึงสามารถอยู่บนสาย beta release แทนการถูก normalize เป็น stable/latest อย่างเงียบๆ

    `openclaw update` ยังรู้จักช่องอัปเดต OpenClaw ที่ใช้งานอยู่: บนช่อง beta เรกคอร์ด Plugin แบบ npm สาย default และ ClawHub จะลอง `@beta` ก่อน รายการเหล่านี้จะ fallback กลับไปยัง spec default/latest ที่บันทึกไว้หากไม่มี beta release ของ Plugin; Plugin แบบ npm ยัง fallback เมื่อแพ็กเกจ beta มีอยู่แต่ไม่ผ่านการตรวจสอบการติดตั้ง fallback นั้นจะถูกรายงานเป็นคำเตือนและไม่ทำให้การอัปเดต core ล้มเหลว เวอร์ชันเจาะจงและ tag ที่ระบุชัดเจนจะยังคงถูก pin กับ selector นั้นสำหรับการอัปเดตแบบเจาะจง

  </Accordion>
  <Accordion title="การตรวจสอบเวอร์ชันและ integrity drift">
    ก่อนการอัปเดต npm แบบสด OpenClaw จะตรวจสอบเวอร์ชันแพ็กเกจที่ติดตั้งเทียบกับเมทาดาทา npm registry หากเวอร์ชันที่ติดตั้งและตัวตนของ artifact ที่บันทึกไว้ตรงกับเป้าหมายที่ resolve ได้อยู่แล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน `openclaw.json` ใหม่

    เมื่อมี integrity hash ที่จัดเก็บไว้และ hash ของ artifact ที่ fetch มาเปลี่ยนไป OpenClaw จะถือว่านั่นเป็น npm artifact drift คำสั่ง `openclaw plugins update` แบบโต้ตอบจะพิมพ์ hash ที่คาดหวังและ hash จริง แล้วขอการยืนยันก่อนดำเนินการต่อ ตัวช่วยอัปเดตแบบไม่โต้ตอบจะ fail closed เว้นแต่ caller จะให้นโยบายดำเนินการต่ออย่างชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install ในการอัปเดต">
    `--dangerously-force-unsafe-install` ยังถูกรับใน `plugins update` เพื่อความเข้ากันได้ แต่เลิกใช้แล้วและไม่เปลี่ยนพฤติกรรมการอัปเดต Plugin อีกต่อไป `security.installPolicy` ของผู้ปฏิบัติงานยังสามารถบล็อกการอัปเดตได้; hook `before_install` ของ Plugin จะมีผลเฉพาะใน process ที่โหลด hook ของ Plugin
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk ในการอัปเดต">
    การอัปเดต Plugin ที่รองรับโดย ClawHub แบบชุมชนจะรันการตรวจสอบความเชื่อถือของ exact-release แบบเดียวกับการติดตั้งก่อนดาวน์โหลดแพ็กเกจทดแทน ใช้ `--acknowledge-clawhub-risk` สำหรับระบบอัตโนมัติที่ผ่านการตรวจทานแล้วซึ่งควรดำเนินการต่อเมื่อ ClawHub release ที่เลือกมีคำเตือนความเชื่อถือที่เสี่ยง แพ็กเกจ ClawHub ทางการและแหล่ง Plugin OpenClaw ที่รวมมากับระบบจะข้าม prompt ความเชื่อถือของ release นี้
  </Accordion>
</AccordionGroup>

### ตรวจสอบ

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect แสดงตัวตน สถานะการโหลด แหล่งที่มา ความสามารถของ manifest, policy flags, diagnostics, เมทาดาทาการติดตั้ง, ความสามารถของ bundle และการรองรับ MCP หรือ LSP server ที่ตรวจพบ โดยค่าเริ่มต้นจะไม่นำเข้า runtime ของ Plugin เอาต์พุต JSON รวมสัญญา manifest ของ Plugin เช่น `contracts.agentToolResultMiddleware` และ `contracts.trustedToolPolicies` เพื่อให้ผู้ปฏิบัติงานตรวจสอบประกาศ trusted-surface ก่อนเปิดใช้งานหรือรีสตาร์ต Plugin ได้ เพิ่ม `--runtime` เพื่อโหลดโมดูล Plugin และรวม hooks, tools, commands, services, gateway methods และ HTTP routes ที่ลงทะเบียนไว้ การตรวจสอบ runtime จะรายงาน dependency ของ Plugin ที่ขาดหายโดยตรง; การติดตั้งและการซ่อมแซมยังอยู่ใน `openclaw plugins install`, `openclaw plugins update` และ `openclaw doctor --fix`

คำสั่ง CLI ที่ Plugin เป็นเจ้าของมักติดตั้งเป็นกลุ่มคำสั่ง `openclaw` ระดับ root แต่ Plugin อาจลงทะเบียนคำสั่งซ้อนภายใต้ parent ของ core เช่น `openclaw nodes` ได้เช่นกัน หลังจาก `inspect --runtime` แสดงคำสั่งภายใต้ `cliCommands` ให้รันคำสั่งที่ path ที่ระบุไว้; ตัวอย่างเช่น Plugin ที่ลงทะเบียน `demo-git` สามารถตรวจสอบได้ด้วย `openclaw demo-git ping`

Plugin แต่ละตัวถูกจัดประเภทตามสิ่งที่มันลงทะเบียนจริงใน runtime:

- **plain-capability** — capability หนึ่งประเภท (เช่น Plugin ที่เป็น provider เท่านั้น)
- **hybrid-capability** — capability หลายประเภท (เช่น ข้อความ + เสียงพูด + รูปภาพ)
- **hook-only** — มีเฉพาะ hooks ไม่มี capabilities หรือ surfaces
- **non-capability** — tools/commands/services แต่ไม่มี capabilities

ดู [รูปแบบ Plugin](/th/plugins/architecture#plugin-shapes) สำหรับรายละเอียดเพิ่มเติมเกี่ยวกับโมเดล capability

<Note>
flag `--json` ส่งออกรายงานที่เครื่องอ่านได้ซึ่งเหมาะกับการเขียนสคริปต์และการ audit `inspect --all` แสดงตารางทั้ง fleet พร้อมคอลัมน์ shape, capability kinds, compatibility notices, bundle capabilities และ hook summary `info` เป็น alias ของ `inspect`
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` รายงานข้อผิดพลาดการโหลด Plugin, diagnostics ของ manifest/discovery, compatibility notices และการอ้างอิง config ของ Plugin ที่ล้าสมัย เช่น slot ของ Plugin ที่ขาดหาย เมื่อ install tree และ config ของ Plugin สะอาด จะพิมพ์ `No plugin issues detected.` หากยังมี config ที่ล้าสมัยค้างอยู่แต่ install tree ยังแข็งแรง สรุปจะระบุเช่นนั้นแทนการสื่อว่าสุขภาพของ Plugin สมบูรณ์ทั้งหมด

หาก Plugin ที่กำหนดค่าไว้มีอยู่บนดิสก์แต่ถูกบล็อกโดยการตรวจ path-safety ของ loader การตรวจสอบ config จะเก็บรายการ Plugin ไว้และรายงานเป็น `present but blocked` ให้แก้ diagnostic ของ Plugin ที่ถูกบล็อกก่อนหน้า เช่น ownership ของ path หรือสิทธิ์ world-writable แทนการลบ config `plugins.entries.<id>` หรือ `plugins.allow`

สำหรับความล้มเหลวด้าน module-shape เช่น export `register`/`activate` ที่ขาดหาย ให้รันซ้ำด้วย `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุป export-shape แบบกระชับในเอาต์พุต diagnostic

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

local plugin registry คือ read model แบบ cold ที่ OpenClaw persist ไว้สำหรับตัวตนของ Plugin, การเปิดใช้งาน, เมทาดาทาแหล่งที่มา และ ownership ของ contribution การเริ่มทำงานปกติ การค้นหา owner ของ provider การจำแนกการตั้งค่า channel และ inventory ของ Plugin สามารถอ่านได้โดยไม่ต้องนำเข้าโมดูล runtime ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่า registry ที่ persist ไว้มีอยู่ เป็นปัจจุบัน หรือล้าสมัย ใช้ `--refresh` เพื่อสร้างใหม่จากดัชนี Plugin ที่ persist ไว้, นโยบาย config และเมทาดาทา manifest/package นี่เป็นเส้นทางซ่อมแซม ไม่ใช่เส้นทางเปิดใช้งาน runtime

`openclaw doctor --fix` ยังซ่อมแซม npm drift ที่มีการจัดการซึ่งอยู่ใกล้กับ registry: หากแพ็กเกจ `@openclaw/*` ที่ orphaned หรือกู้คืนมาอยู่ภายใต้โปรเจกต์ npm ของ Plugin ที่มีการจัดการ หรือราก npm แบบ flat ที่มีการจัดการแบบ legacy บัง Plugin ที่ bundled ไว้ doctor จะลบแพ็กเกจล้าสมัยนั้นและสร้าง registry ใหม่เพื่อให้ startup ตรวจสอบกับ manifest ที่ bundled ไว้ Doctor ยัง relink แพ็กเกจ host `openclaw` เข้ากับ Plugin npm ที่มีการจัดการซึ่งประกาศ `peerDependencies.openclaw` เพื่อให้ runtime imports ภายในแพ็กเกจ เช่น `openclaw/plugin-sdk/*` resolve ได้หลังการอัปเดตหรือการซ่อมแซม npm

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็นสวิตช์ความเข้ากันได้แบบ break-glass ที่เลิกใช้แล้วสำหรับความล้มเหลวในการอ่าน registry ควรใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix`; env fallback มีไว้เฉพาะการกู้คืน startup ฉุกเฉินระหว่างที่ migration กำลัง rollout
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

รายการ Marketplace รองรับพาธ Marketplace ภายในเครื่อง, พาธ `marketplace.json`, ชื่อย่อ GitHub เช่น `owner/repo`, URL ของรีโป GitHub หรือ URL ของ git `--json` จะแสดงป้ายกำกับแหล่งที่มาที่ resolve แล้ว พร้อม manifest ของ Marketplace ที่ parse แล้วและรายการ Plugin

การรีเฟรช Marketplace จะโหลดฟีด Marketplace ของ OpenClaw ที่โฮสต์ไว้และบันทึก
การตอบกลับที่ผ่านการตรวจสอบแล้วเป็นสแนปช็อตฟีดที่โฮสต์ไว้ภายในเครื่อง หากไม่มีตัวเลือก จะใช้
โปรไฟล์ฟีดเริ่มต้นที่กำหนดค่าไว้ ใช้ `--feed-profile <name>` เพื่อรีเฟรช
โปรไฟล์ที่กำหนดค่าไว้แบบเฉพาะเจาะจง, `--feed-url <url>` เพื่อรีเฟรช URL ฟีดที่โฮสต์ไว้
อย่างชัดเจน, `--expected-sha256 <sha256>` เพื่อกำหนดให้เช็กซัมของเพย์โหลด
ต้องตรงกัน (`sha256:<hex>` หรือไดเจสต์ hex 64 อักขระแบบเปล่า) และ `--json` สำหรับ
เอาต์พุตที่เครื่องอ่านได้ URL ฟีดที่โฮสต์ไว้อย่างชัดเจนต้องไม่มี
ข้อมูลรับรอง, query string หรือ fragment การรีเฟรชที่ไม่ได้ pin สามารถรายงานผลลัพธ์เป็น
สแนปช็อตที่โฮสต์ไว้หรือผลลัพธ์ fallback ที่ bundled มาโดยไม่ทำให้คำสั่งล้มเหลว การรีเฟรชที่
pin ไว้จะล้มเหลวเว้นแต่จะยอมรับเพย์โหลดที่โฮสต์ไว้ซึ่งเป็นข้อมูลใหม่ และการรีเฟรชที่โฮสต์ไว้
ซึ่งสำเร็จจะล้มเหลวหาก OpenClaw ไม่สามารถบันทึกสแนปช็อตที่ผ่านการตรวจสอบแล้วได้

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [อ้างอิง CLI](/th/cli)
- [ClawHub](/th/clawhub)
