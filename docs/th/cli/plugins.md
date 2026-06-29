---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือชุดรวมที่เข้ากันได้
    - คุณต้องการสร้างโครงร่างหรือตรวจสอบความถูกต้องของ Plugin เครื่องมืออย่างง่าย
    - คุณต้องการดีบักความล้มเหลวในการโหลด Plugin
sidebarTitle: Plugins
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-06-28T22:34:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 528a7ead224eab330bc0a83314d205a68c7f814ad336441aee7b19170c105e43
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Plugin ของ Gateway, ชุด hook, และ bundle ที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="ระบบ Plugin" href="/th/tools/plugin">
    คู่มือผู้ใช้สำหรับติดตั้ง เปิดใช้งาน และแก้ปัญหา Plugin
  </Card>
  <Card title="จัดการ Plugin" href="/th/plugins/manage-plugins">
    ตัวอย่างสั้น ๆ สำหรับ install, list, update, uninstall และ publishing
  </Card>
  <Card title="Bundle ของ Plugin" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของ bundle
  </Card>
  <Card title="Manifest ของ Plugin" href="/th/plugins/manifest">
    ฟิลด์ manifest และ schema ของ config
  </Card>
  <Card title="ความปลอดภัย" href="/th/gateway/security">
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
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
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

สำหรับการตรวจสอบการ install, inspect, uninstall หรือ registry-refresh ที่ช้า ให้รันคำสั่งพร้อม `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` trace จะเขียนเวลาของแต่ละ phase ไปยัง stderr และยังคงทำให้เอาต์พุต JSON parse ได้ ดู [การดีบัก](/th/help/debugging#plugin-lifecycle-trace)

<Note>
ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) ตัวเปลี่ยนแปลงวงจรชีวิตของ Plugin จะถูกปิดใช้งาน ใช้แหล่งที่มาของ Nix สำหรับการติดตั้งนี้แทน `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` หรือ `plugins disable`; สำหรับ nix-openclaw ให้ใช้ [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) แบบ agent-first
</Note>

<Note>
Plugin ที่ bundled มาพร้อมกับ OpenClaw บางตัวเปิดใช้งานตามค่าเริ่มต้น (เช่น bundled model providers, bundled speech providers และ bundled browser plugin); ส่วนอื่นต้องใช้ `plugins enable`

Plugin แบบ native ของ OpenClaw ต้องจัดส่ง `openclaw.plugin.json` พร้อม JSON Schema แบบ inline (`configSchema` แม้ว่าจะว่างก็ตาม) ส่วน bundle ที่เข้ากันได้จะใช้ bundle manifest ของตัวเองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุต list/info แบบ verbose ยังแสดง subtype ของ bundle (`codex`, `claude` หรือ `cursor`) พร้อมความสามารถของ bundle ที่ตรวจพบด้วย
</Note>

### ผู้เขียน

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` สร้าง tool plugin แบบ TypeScript ขั้นต่ำโดยค่าเริ่มต้น อาร์กิวเมนต์แรกคือ id ของ Plugin; ส่ง `--name` สำหรับชื่อที่ใช้แสดง OpenClaw ใช้ id สำหรับไดเรกทอรีเอาต์พุตเริ่มต้นและการตั้งชื่อ package scaffold ของ tool ใช้ `defineToolPlugin`
`plugins build` import entry ที่ build แล้ว อ่าน metadata ของ tool แบบ static เขียน `openclaw.plugin.json` และทำให้ `package.json` `openclaw.extensions` สอดคล้องกัน
`plugins validate` ตรวจสอบว่า manifest ที่สร้างขึ้น metadata ของ package และ export ของ entry ปัจจุบันยังตรงกัน ดู [Tool Plugins](/th/plugins/tool-plugins) สำหรับ workflow การเขียน tool ฉบับเต็ม

scaffold เขียนซอร์ส TypeScript แต่สร้าง metadata จาก entry `./dist/index.js` ที่ build แล้ว ดังนั้น workflow นี้จึงใช้ได้กับ CLI ที่เผยแพร่แล้วด้วย ใช้ `--entry <path>` เมื่อ entry ไม่ใช่ package entry เริ่มต้น ใช้ `plugins build --check` ใน CI เพื่อให้ล้มเหลวเมื่อ metadata ที่สร้างขึ้นล้าสมัยโดยไม่เขียนไฟล์ใหม่

### Scaffold ของ Provider

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

scaffold ของ provider สร้าง Plugin ของ provider แบบ text/model ทั่วไป พร้อมระบบ API key ที่เข้ากันได้กับ OpenAI, สคริปต์ `npm run validate` ในตัวสำหรับ `clawhub package validate`, metadata ของ package สำหรับ ClawHub และ GitHub workflow ที่ dispatch ด้วยตนเองสำหรับการเผยแพร่แบบ trusted ในอนาคตผ่าน GitHub Actions OIDC scaffold ของ provider ไม่สร้าง skills และไม่ใช้ `openclaw plugins build` หรือ `openclaw plugins validate`; คำสั่งเหล่านั้นใช้สำหรับเส้นทาง metadata ที่สร้างขึ้นของ scaffold ของ tool

ก่อนเผยแพร่ ให้แทนที่ API base URL, model catalog, route ของเอกสาร, ข้อความ credential และสำเนา README ที่เป็น placeholder ด้วยรายละเอียด provider จริง ใช้ README ที่สร้างขึ้นสำหรับการเผยแพร่ ClawHub ครั้งแรกและการตั้งค่า trusted publisher

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

maintainer ที่ทดสอบการติดตั้งระหว่าง setup สามารถ override แหล่งที่มาติดตั้ง Plugin อัตโนมัติด้วย environment variable ที่มี guard ดู [Plugin install overrides](/th/plugins/install-overrides)

<Warning>
ชื่อ package แบบ bare จะติดตั้งจาก npm ตามค่าเริ่มต้นระหว่างช่วง launch cutover เว้นแต่จะตรงกับ id ของ Plugin อย่างเป็นทางการ spec ของ package `@openclaw/*` แบบ raw ที่ตรงกับ Plugin ที่ bundled จะใช้สำเนา bundled ที่จัดส่งมากับ build ของ OpenClaw ปัจจุบัน ใช้ `npm:<package>` เมื่อคุณตั้งใจต้องการ package npm ภายนอกแทน ใช้ `clawhub:<package>` สำหรับ ClawHub ปฏิบัติต่อการติดตั้ง Plugin เหมือนกับการรันโค้ด ควรใช้เวอร์ชันที่ pin ไว้
</Warning>

`plugins search` query ClawHub เพื่อหา package ของ Plugin ที่ติดตั้งได้ และพิมพ์ชื่อ package ที่พร้อมติดตั้ง โดยค้นหา package แบบ code-plugin และ bundle-plugin ไม่ใช่ Skills ใช้ `openclaw skills search` สำหรับ Skills ของ ClawHub

<Note>
ClawHub เป็นพื้นผิวหลักสำหรับการแจกจ่ายและค้นพบ Plugin ส่วนใหญ่ Npm ยังคงเป็น fallback และเส้นทาง direct-install ที่รองรับ package Plugin `@openclaw/*` ที่ OpenClaw เป็นเจ้าของถูกเผยแพร่บน npm อีกครั้งแล้ว; ดูรายการปัจจุบันได้ที่ [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) หรือ [plugin inventory](/th/plugins/plugin-inventory) การติดตั้ง stable ใช้ `latest` การติดตั้งและอัปเดตใน beta-channel จะเลือก npm dist-tag `beta` เมื่อมี tag นั้น แล้ว fallback ไปที่ `latest`
</Note>

<AccordionGroup>
  <Accordion title="Config includes และการซ่อมแซม invalid-config">
    หากส่วน `plugins` ของคุณอิงกับ `$include` แบบไฟล์เดียว `plugins install/update/enable/disable/uninstall` จะเขียนทะลุไปยังไฟล์ที่ include นั้น และปล่อย `openclaw.json` ไว้ไม่แตะต้อง Root includes, include arrays และ includes ที่มี sibling overrides จะ fail closed แทนการ flatten ดูรูปแบบที่รองรับใน [Config includes](/th/gateway/configuration)

    หาก config ไม่ถูกต้องระหว่าง install โดยปกติ `plugins install` จะ fail closed และบอกให้คุณรัน `openclaw doctor --fix` ก่อน ระหว่าง Gateway startup และ hot reload config ของ Plugin ที่ไม่ถูกต้องจะ fail closed เช่นเดียวกับ config ที่ไม่ถูกต้องอื่น ๆ; `openclaw doctor --fix` สามารถ quarantine entry ของ Plugin ที่ไม่ถูกต้องได้ ข้อยกเว้นระหว่าง install ที่มีเอกสารระบุไว้มีเพียงเส้นทาง recovery แบบแคบสำหรับ bundled-plugin ที่ opt in อย่างชัดเจนใน `openclaw.install.allowInvalidConfigRecovery`

  </Accordion>
  <Accordion title="--force และ reinstall เทียบกับ update">
    `--force` ใช้ install target เดิมซ้ำ และเขียนทับ Plugin หรือ hook pack ที่ติดตั้งอยู่แล้วในตำแหน่งเดิม ใช้เมื่อคุณตั้งใจ reinstall id เดิมจาก local path, archive, package ClawHub หรือ artifact npm ใหม่ สำหรับการอัปเกรดตามปกติของ Plugin npm ที่ติดตามอยู่แล้ว ควรใช้ `openclaw plugins update <id-or-npm-spec>`

    หากคุณรัน `plugins install` สำหรับ id ของ Plugin ที่ติดตั้งอยู่แล้ว OpenClaw จะหยุดและชี้ให้คุณใช้ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดปกติ หรือ `plugins install <package> --force` เมื่อคุณต้องการเขียนทับการติดตั้งปัจจุบันจากแหล่งอื่นจริง ๆ

  </Accordion>
  <Accordion title="ขอบเขตของ --pin">
    `--pin` ใช้กับการติดตั้ง npm เท่านั้น ไม่รองรับกับการติดตั้ง `git:`; ใช้ git ref แบบชัดเจน เช่น `git:github.com/acme/plugin@v1.2.3` เมื่อคุณต้องการแหล่งที่มาที่ pin ไว้ ไม่รองรับกับ `--marketplace` เพราะการติดตั้ง marketplace จะ persist metadata แหล่งที่มาของ marketplace แทน npm spec
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` เลิกใช้แล้วและตอนนี้เป็น no-op OpenClaw ไม่รันการบล็อก dangerous-code ระหว่าง install แบบ built-in สำหรับการติดตั้ง Plugin อีกต่อไป

    ใช้พื้นผิว `security.installPolicy` ที่ operator เป็นเจ้าของร่วมกันเมื่อจำเป็นต้องมีนโยบาย install เฉพาะ host hook `before_install` ของ Plugin เป็น lifecycle hook ของ plugin-runtime และไม่ใช่ขอบเขตนโยบายหลักสำหรับการติดตั้งผ่าน CLI

    หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกซ่อนหรือบล็อกโดย registry scan ให้ใช้ขั้นตอนสำหรับ publisher ใน [การเผยแพร่ ClawHub](/th/clawhub/publishing) `--dangerously-force-unsafe-install` จะไม่ขอให้ ClawHub scan Plugin ใหม่หรือทำให้ release ที่ถูกบล็อกเป็น public

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    การติดตั้ง ClawHub community จะตรวจสอบ trust record ของ release ที่เลือกก่อนดาวน์โหลด package หาก ClawHub ปิดการดาวน์โหลดสำหรับ release นั้น รายงานผล scan ว่าเป็นอันตราย หรือวาง release ไว้ในสถานะ moderation ที่บล็อก เช่น quarantine OpenClaw จะปฏิเสธ release นั้น สำหรับสถานะ scan ที่มีความเสี่ยงแต่ไม่บล็อก สถานะ moderation ที่มีความเสี่ยง หรือเหตุผลจาก registry OpenClaw จะแสดงรายละเอียด trust และขอการยืนยันก่อนดำเนินการต่อ

    ใช้ `--acknowledge-clawhub-risk` เฉพาะหลังจากตรวจสอบคำเตือนของ ClawHub แล้วและตัดสินใจดำเนินการต่อโดยไม่มี prompt แบบ interactive trust record ที่ pending หรือ clean แต่ stale จะเตือนแต่ไม่ต้อง acknowledgement package ClawHub อย่างเป็นทางการและแหล่ง Plugin ของ OpenClaw ที่ bundled จะ bypass prompt release-trust นี้

  </Accordion>
  <Accordion title="Hook pack และ npm spec">
    `plugins install` ยังเป็นพื้นผิว install สำหรับ hook pack ที่ expose `openclaw.hooks` ใน `package.json` ด้วย ใช้ `openclaw hooks` สำหรับการมองเห็น hook แบบ filtered และการเปิดใช้งานราย hook ไม่ใช่การติดตั้ง package

    ข้อกำหนด Npm เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **เวอร์ชันที่แน่นอน** หรือ **dist-tag** ที่ไม่บังคับ) ข้อกำหนดแบบ Git/URL/file และช่วง semver จะถูกปฏิเสธ การติดตั้ง dependency จะรันในโปรเจกต์ npm ที่จัดการหนึ่งโปรเจกต์ต่อ Plugin พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้เชลล์ของคุณจะมีการตั้งค่าการติดตั้ง npm ส่วนกลางก็ตาม โปรเจกต์ npm ของ Plugin ที่จัดการจะสืบทอด `overrides` ของ npm ระดับแพ็กเกจของ OpenClaw ดังนั้นการตรึงด้านความปลอดภัยของโฮสต์จึงมีผลกับ dependency ของ Plugin ที่ถูก hoist ด้วย

    ใช้ `npm:<package>` เมื่อคุณต้องการทำให้การ resolve ของ npm ชัดเจน ข้อกำหนดแพ็กเกจแบบเปล่าจะติดตั้งจาก npm โดยตรงในช่วงเปลี่ยนผ่านการเปิดตัวเช่นกัน เว้นแต่ว่าจะตรงกับรหัส Plugin อย่างเป็นทางการ

    ข้อกำหนดแพ็กเกจ `@openclaw/*` แบบดิบที่ตรงกับ Plugin ที่รวมมาในตัวจะ resolve ไปยังสำเนาที่รวมมาในอิมเมจก่อน fallback ไปยัง npm ตัวอย่างเช่น `openclaw plugins install @openclaw/discord@2026.5.20 --pin` ใช้ Plugin Discord ที่รวมมากับบิลด์ OpenClaw ปัจจุบัน แทนที่จะสร้าง override npm ที่จัดการ หากต้องการบังคับใช้แพ็กเกจ npm ภายนอก ให้ใช้ `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`

    ข้อกำหนดแบบเปล่าและ `@latest` จะอยู่บนแทร็กเสถียร เวอร์ชันแก้ไขของ OpenClaw ที่ประทับวันที่ เช่น `2026.5.3-1` ถือเป็นรีลีสเสถียรสำหรับการตรวจสอบนี้ หาก npm resolve อย่างใดอย่างหนึ่งเป็น prerelease OpenClaw จะหยุดและขอให้คุณ opt in อย่างชัดเจนด้วยแท็ก prerelease เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease ที่แน่นอน เช่น `@1.2.3-beta.4`

    สำหรับการติดตั้ง npm ที่ไม่มีเวอร์ชันที่แน่นอน (`npm:<package>` หรือ `npm:<package>@latest`) OpenClaw จะตรวจสอบ metadata ของแพ็กเกจที่ resolve ได้ก่อนติดตั้ง หากแพ็กเกจเสถียรล่าสุดต้องใช้ API ของ Plugin OpenClaw ที่ใหม่กว่า หรือเวอร์ชันโฮสต์ขั้นต่ำที่ใหม่กว่า OpenClaw จะตรวจสอบเวอร์ชันเสถียรที่เก่ากว่าและติดตั้งรีลีสที่เข้ากันได้ใหม่ที่สุดแทน เวอร์ชันที่แน่นอนและ dist-tag ที่ระบุชัดเจน เช่น `@beta` ยังคงเข้มงวด: หากแพ็กเกจที่เลือกเข้ากันไม่ได้ คำสั่งจะล้มเหลวและขอให้คุณอัปเกรด OpenClaw หรือเลือกเวอร์ชันที่เข้ากันได้

    หากข้อกำหนดการติดตั้งแบบเปล่าตรงกับรหัส Plugin อย่างเป็นทางการ (เช่น `diffs`) OpenClaw จะติดตั้งรายการแค็ตตาล็อกโดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่มีชื่อเดียวกัน ให้ใช้ข้อกำหนดแบบ scoped ที่ชัดเจน (เช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="Git repositories">
    ใช้ `git:<repo>` เพื่อติดตั้งโดยตรงจากที่เก็บ git รูปแบบที่รองรับรวมถึง `git:github.com/owner/repo`, `git:owner/repo`, URL clone แบบเต็ม `https://`, `ssh://`, `git://`, `file://` และ `git@host:owner/repo.git` เพิ่ม `@<ref>` หรือ `#<ref>` เพื่อ checkout branch, tag หรือ commit ก่อนติดตั้ง

    การติดตั้งจาก Git จะ clone ไปยังไดเรกทอรีชั่วคราว checkout ref ที่ขอเมื่อมีอยู่ จากนั้นใช้ตัวติดตั้งไดเรกทอรี Plugin ปกติ ซึ่งหมายความว่า manifest validation, operator install policy, งานติดตั้งของ package-manager และ install records จะทำงานเหมือนการติดตั้ง npm การติดตั้งจาก git ที่บันทึกไว้จะรวม URL/ref ต้นทางพร้อม commit ที่ resolve แล้ว เพื่อให้ `openclaw plugins update` สามารถ re-resolve ต้นทางภายหลังได้

    หลังจากติดตั้งจาก git แล้ว ให้ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อตรวจสอบ runtime registrations เช่น gateway methods และคำสั่ง CLI หาก Plugin ลงทะเบียน CLI root ด้วย `api.registerCli` ให้เรียกใช้คำสั่งนั้นโดยตรงผ่าน OpenClaw root CLI เช่น `openclaw demo-plugin ping`

  </Accordion>
  <Accordion title="Archives">
    archive ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` archive ของ Plugin OpenClaw แบบเนทีฟต้องมี `openclaw.plugin.json` ที่ถูกต้องที่ root ของ Plugin ที่แตกไฟล์แล้ว archive ที่มีเพียง `package.json` จะถูกปฏิเสธก่อนที่ OpenClaw จะเขียน install records

    ใช้ `npm-pack:<path.tgz>` เมื่อไฟล์เป็น tarball ของ npm-pack และคุณต้องการ
    ทดสอบเส้นทางโปรเจกต์ npm ที่จัดการต่อ Plugin แบบเดียวกับที่ใช้โดยการติดตั้งจาก registry
    รวมถึงการตรวจสอบ `package-lock.json`, การสแกน dependency ที่ถูก hoist
    และ install records ของ npm เส้นทาง archive ปกติยังคงติดตั้งเป็น archive ภายในเครื่อง
    ภายใต้ root ของส่วนขยาย Plugin

    รองรับการติดตั้ง Claude marketplace ด้วยเช่นกัน

  </Accordion>
</AccordionGroup>

การติดตั้ง ClawHub ใช้ locator `clawhub:<package>` ที่ชัดเจน:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

ข้อกำหนด Plugin แบบเปล่าที่ปลอดภัยสำหรับ npm จะติดตั้งจาก npm โดยค่าเริ่มต้นในช่วงเปลี่ยนผ่านการเปิดตัว เว้นแต่ว่าจะตรงกับรหัส Plugin อย่างเป็นทางการ:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อทำให้การ resolve แบบ npm-only ชัดเจน:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw จะตรวจสอบความเข้ากันได้ของ API ของ Plugin / Gateway ขั้นต่ำที่ประกาศไว้ก่อนติดตั้ง เมื่อเวอร์ชัน ClawHub ที่เลือกเผยแพร่ artifact แบบ ClawPack OpenClaw จะดาวน์โหลด npm-pack `.tgz` ที่มีเวอร์ชัน ตรวจสอบส่วนหัว digest ของ ClawHub และ digest ของ artifact จากนั้นติดตั้งผ่านเส้นทาง archive ปกติ เวอร์ชัน ClawHub ที่เก่ากว่าซึ่งไม่มี metadata ของ ClawPack ยังคงติดตั้งผ่านเส้นทางการตรวจสอบ package archive แบบเดิม การติดตั้งที่บันทึกไว้จะเก็บ metadata ต้นทางของ ClawHub, ชนิด artifact, npm integrity, npm shasum, ชื่อ tarball และข้อเท็จจริง digest ของ ClawPack สำหรับการอัปเดตภายหลัง
การติดตั้ง ClawHub แบบไม่ระบุเวอร์ชันจะเก็บข้อกำหนดที่บันทึกแบบไม่ระบุเวอร์ชัน เพื่อให้ `openclaw plugins update` สามารถติดตามรีลีส ClawHub ที่ใหม่กว่าได้ ตัวเลือกเวอร์ชันหรือแท็กที่ระบุชัดเจน เช่น `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` ยังคงถูกตรึงกับตัวเลือกนั้น

#### ชวเลข Marketplace

ใช้ชวเลข `plugin@marketplace` เมื่อชื่อ marketplace มีอยู่ในแคช registry ภายในเครื่องของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

ใช้ `--marketplace` เมื่อคุณต้องการส่งแหล่ง Marketplace อย่างชัดเจน:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - ชื่อ known-marketplace ของ Claude จาก `~/.claude/plugins/known_marketplaces.json`
    - ราก Marketplace ภายในเครื่องหรือพาธ `marketplace.json`
    - รูปย่อ repo ของ GitHub เช่น `owner/repo`
    - URL ของ repo GitHub เช่น `https://github.com/owner/repo`
    - URL ของ git

  </Tab>
  <Tab title="Remote marketplace rules">
    สำหรับ Marketplace ระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องอยู่ภายใน repo Marketplace ที่โคลนมา OpenClaw ยอมรับแหล่งแบบพาธสัมพัทธ์จาก repo นั้น และปฏิเสธแหล่ง Plugin แบบ HTTP(S), พาธสัมบูรณ์, git, GitHub และแหล่ง Plugin อื่นที่ไม่ใช่พาธจาก manifest ระยะไกล
  </Tab>
</Tabs>

สำหรับพาธภายในเครื่องและ archive, OpenClaw จะตรวจจับอัตโนมัติ:

- Plugin แบบเนทีฟของ OpenClaw (`openclaw.plugin.json`)
- บันเดิลที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- บันเดิลที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือเลย์เอาต์คอมโพเนนต์เริ่มต้นของ Claude)
- บันเดิลที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

การติดตั้งภายในเครื่องที่จัดการโดยระบบต้องเป็นไดเรกทอรีหรือ archive ของ Plugin ไฟล์ Plugin เดี่ยวแบบ `.js`,
`.mjs`, `.cjs` และ `.ts` จะไม่ถูกคัดลอกไปยังราก Plugin ที่จัดการโดย `plugins install`; ให้ระบุไฟล์เหล่านั้นอย่างชัดเจนใน `plugins.load.paths` แทน

<Note>
บันเดิลที่เข้ากันได้จะติดตั้งลงในราก Plugin ปกติและเข้าร่วมในโฟลว์ list/info/enable/disable เดียวกัน ปัจจุบันรองรับ Skills ของบันเดิล, command-skills ของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` ของ Claude / `lspServers` ที่ประกาศใน manifest, command-skills ของ Cursor และไดเรกทอรี hook ของ Codex ที่เข้ากันได้; ความสามารถอื่นของบันเดิลที่ตรวจพบจะแสดงใน diagnostics/info แต่ยังไม่ได้เชื่อมเข้ากับการทำงานของรันไทม์
</Note>

### แสดงรายการ

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
  แสดงเฉพาะ Plugin ที่เปิดใช้งานอยู่
</ParamField>
<ParamField path="--verbose" type="boolean">
  เปลี่ยนจากมุมมองตารางเป็นบรรทัดรายละเอียดต่อ Plugin พร้อมเมตาดาต้า source/origin/version/activation
</ParamField>
<ParamField path="--json" type="boolean">
  inventory ที่เครื่องอ่านได้ พร้อม diagnostics ของ registry และสถานะการติดตั้ง dependency ของ package
</ParamField>

<Note>
`plugins list` อ่าน registry ของ Plugin ภายในเครื่องที่บันทึกไว้ก่อน โดยมี fallback ที่สร้างจาก manifest เท่านั้นเมื่อ registry หายไปหรือไม่ถูกต้อง คำสั่งนี้มีประโยชน์สำหรับตรวจสอบว่า Plugin ถูกติดตั้ง เปิดใช้งาน และมองเห็นได้ในการวางแผนเริ่มต้นแบบ cold startup หรือไม่ แต่ไม่ใช่ probe รันไทม์แบบสดของกระบวนการ Gateway ที่กำลังทำงานอยู่ หลังจากเปลี่ยนโค้ด Plugin, การเปิดใช้งาน, นโยบาย hook หรือ `plugins.load.paths` ให้รีสตาร์ท Gateway ที่ให้บริการ channel ก่อนคาดหวังให้โค้ด `register(api)` หรือ hook ใหม่ทำงาน สำหรับการปรับใช้แบบระยะไกล/คอนเทนเนอร์ ให้ยืนยันว่าคุณกำลังรีสตาร์ท child ของ `openclaw gateway run` จริง ไม่ใช่เพียงกระบวนการ wrapper

`plugins list --json` รวม `dependencyStatus` ของแต่ละ Plugin จาก `dependencies` และ `optionalDependencies` ใน `package.json` OpenClaw ตรวจสอบว่าชื่อ package เหล่านั้นมีอยู่ตามพาธค้นหา `node_modules` ปกติของ Node สำหรับ Plugin หรือไม่; ระบบจะไม่นำเข้าโค้ดรันไทม์ของ Plugin, ไม่รัน package manager และไม่ซ่อมแซม dependency ที่ขาดหาย
</Note>

หาก log ตอนเริ่มต้นแสดง `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
ให้รัน `openclaw plugins list --enabled --verbose` หรือ
`openclaw plugins inspect <id>` พร้อม id ของ Plugin ที่ระบุไว้เพื่อยืนยัน id ของ Plugin
และคัดลอก id ที่เชื่อถือได้ไปยัง `plugins.allow` ใน `openclaw.json` เมื่อคำเตือนสามารถระบุ Plugin ที่ค้นพบได้ครบทุกตัว คำเตือนจะพิมพ์ snippet `plugins.allow` ที่พร้อมวางและมี id เหล่านั้นอยู่แล้ว หาก Plugin โหลดโดยไม่มี provenance จากการติดตั้ง/พาธโหลด ให้ตรวจสอบ id ของ Plugin นั้น จากนั้นให้ pin id ที่เชื่อถือได้ใน `plugins.allow` หรือติดตั้ง Plugin ใหม่จากแหล่งที่เชื่อถือได้เพื่อให้ OpenClaw บันทึก provenance การติดตั้ง

`plugins search` เป็นการค้นหา catalog ระยะไกลของ ClawHub คำสั่งนี้จะไม่ตรวจสอบ state ภายในเครื่อง, ไม่แก้ไข config, ไม่ติดตั้ง package และไม่โหลดโค้ดรันไทม์ของ Plugin ผลการค้นหาจะรวมชื่อ package ของ ClawHub, family, channel, version, summary และคำแนะนำการติดตั้ง เช่น `openclaw plugins install clawhub:<package>`

สำหรับงาน Plugin ที่บันเดิลไว้ภายในอิมเมจ Docker ที่แพ็กเกจแล้ว ให้ bind-mount ไดเรกทอรีซอร์สของ Plugin ทับพาธซอร์สที่แพ็กเกจตรงกัน เช่น
`/app/extensions/synology-chat` OpenClaw จะค้นพบ source overlay ที่ mount นั้นก่อน `/app/dist/extensions/synology-chat`; ไดเรกทอรีซอร์สที่คัดลอกธรรมดาจะยังไม่ทำงาน เพื่อให้การติดตั้งแบบแพ็กเกจปกติยังใช้ dist ที่คอมไพล์แล้ว

สำหรับการดีบัก hook ของรันไทม์:

- `openclaw plugins inspect <id> --runtime --json` แสดง hook ที่ลงทะเบียนและ diagnostics จากรอบการตรวจสอบที่โหลดโมดูล การตรวจสอบรันไทม์จะไม่ติดตั้ง dependency; ใช้ `openclaw doctor --fix` เพื่อล้าง state ของ dependency เก่า หรือกู้คืน Plugin ที่ดาวน์โหลดได้ซึ่งหายไปและถูกอ้างอิงโดย config
- `openclaw gateway status --deep --require-rpc` ยืนยัน URL/profile ของ Gateway ที่เข้าถึงได้, คำใบ้ service/process, พาธ config และสุขภาพ RPC
- hook การสนทนาที่ไม่ใช่บันเดิล (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรี Plugin ภายในเครื่อง (เพิ่มเข้า `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

ไฟล์ Plugin เดี่ยวต้องระบุใน `plugins.load.paths` แทนที่จะติดตั้งด้วย `plugins install` หรือวางโดยตรงใน `~/.openclaw/extensions`
หรือ `<workspace>/.openclaw/extensions` รากที่ค้นพบอัตโนมัติเหล่านั้นจะโหลด package หรือไดเรกทอรีบันเดิลของ Plugin ส่วนไฟล์สคริปต์ระดับบนสุดจะถูกมองเป็น helper ภายในเครื่องและข้ามไป

<Note>
Plugin ที่มีต้นทางจากเวิร์กสเปซซึ่งค้นพบจากราก extensions ของเวิร์กสเปซจะไม่ถูก
import หรือเรียกใช้จนกว่าจะถูกเปิดใช้อย่างชัดเจน สำหรับการพัฒนาในเครื่อง
ให้รัน `openclaw plugins enable <plugin-id>` หรือตั้งค่า
`plugins.entries.<plugin-id>.enabled: true`; หาก config ของคุณใช้
`plugins.allow` ให้ใส่ plugin id เดียวกันไว้ที่นั่นด้วย กฎ fail-closed นี้
ยังใช้เมื่อการตั้งค่าช่องทางระบุเป้าหมายเป็น Plugin ที่มีต้นทางจากเวิร์กสเปซอย่างชัดเจนสำหรับ
การโหลดเพื่อ setup เท่านั้น ดังนั้นโค้ด setup ของ Plugin ช่องทางในเครื่องจะไม่ทำงานขณะที่
Plugin เวิร์กสเปซนั้นยังคงถูกปิดใช้งานหรือถูกตัดออกจาก allowlist การติดตั้งแบบ linked
และรายการ `plugins.load.paths` ที่ระบุชัดเจนจะปฏิบัติตามนโยบายปกติสำหรับ
ต้นทาง Plugin ที่ resolve ได้ ดู
[กำหนดค่านโยบาย Plugin](/th/tools/plugin#configure-plugin-policy)
และ [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#plugins)

ไม่รองรับ `--force` ร่วมกับ `--link` เพราะการติดตั้งแบบ linked จะใช้ path ต้นทางซ้ำแทนการคัดลอกทับเป้าหมายการติดตั้งที่มีการจัดการ

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึก spec แบบ exact ที่ resolve แล้ว (`name@version`) ในดัชนี Plugin ที่มีการจัดการ โดยยังคงพฤติกรรมเริ่มต้นแบบไม่ pin ไว้
</Note>

### ดัชนี Plugin

เมตาดาต้าการติดตั้ง Plugin เป็นสถานะที่เครื่องจัดการ ไม่ใช่ config ของผู้ใช้ การติดตั้งและการอัปเดตจะเขียนข้อมูลนี้ลงในฐานข้อมูลสถานะ SQLite ที่ใช้ร่วมกันภายใต้ไดเรกทอรีสถานะ OpenClaw ที่ใช้งานอยู่ แถว `installed_plugin_index` เก็บเมตาดาต้า `installRecords` แบบคงทน รวมถึง record สำหรับ manifest ของ Plugin ที่เสียหรือหายไป พร้อมแคช cold registry ที่ derived จาก manifest ซึ่งใช้โดย `openclaw plugins update`, uninstall, diagnostics และ cold plugin registry

เมื่อ OpenClaw พบ record `plugins.installs` แบบ legacy ที่เคย shipped ใน config การอ่านของ runtime จะถือว่าเป็น input เพื่อความเข้ากันได้โดยไม่เขียน `openclaw.json` ใหม่ การเขียน Plugin อย่างชัดเจนและ `openclaw doctor --fix` จะย้าย record เหล่านั้นเข้าไปในดัชนี Plugin และลบคีย์ config เมื่ออนุญาตให้เขียน config ได้; หากการเขียนรายการใดรายการหนึ่งล้มเหลว record ใน config จะถูกเก็บไว้เพื่อไม่ให้เมตาดาต้าการติดตั้งสูญหาย

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` จะลบ record ของ Plugin ออกจาก `plugins.entries`, ดัชนี Plugin ที่ persist ไว้, รายการ allow/deny list ของ Plugin และรายการ linked `plugins.load.paths` เมื่อเกี่ยวข้อง เว้นแต่ตั้งค่า `--keep-files` การถอนการติดตั้งยังจะลบไดเรกทอรีการติดตั้งแบบ managed ที่ติดตามไว้เมื่อไดเรกทอรีนั้นอยู่ภายในราก extensions ของ Plugin ของ OpenClaw สำหรับ Plugin active memory ช่อง memory จะรีเซ็ตเป็น `memory-core`

<Note>
`--keep-config` รองรับในฐานะ alias ที่เลิกแนะนำแล้วของ `--keep-files`
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

การอัปเดตใช้กับการติดตั้ง Plugin ที่ติดตามไว้ในดัชนี Plugin ที่มีการจัดการ และการติดตั้ง hook-pack ที่ติดตามไว้ใน `hooks.internal.installs`

<AccordionGroup>
  <Accordion title="การ resolve plugin id เทียบกับ npm spec">
    เมื่อคุณส่ง plugin id เข้าไป OpenClaw จะใช้ install spec ที่บันทึกไว้สำหรับ Plugin นั้นซ้ำ นั่นหมายความว่า dist-tags ที่เคยจัดเก็บไว้ เช่น `@beta` และเวอร์ชัน exact ที่ pin ไว้จะยังคงถูกใช้ในการรัน `update <id>` ครั้งต่อไป

    ระหว่าง `update <id> --dry-run` การติดตั้ง npm แบบ exact pinned จะยังคงถูก pin ไว้ หาก OpenClaw สามารถ resolve release line เริ่มต้นของ registry ของแพ็กเกจได้ด้วย และ release line เริ่มต้นนั้นใหม่กว่าเวอร์ชัน pinned ที่ติดตั้งอยู่ dry run จะรายงาน pin และพิมพ์คำสั่งอัปเดตแพ็กเกจ `@latest` ที่ชัดเจนเพื่อไปตาม release line เริ่มต้นของ registry

    กฎ targeted-update นั้นต่างจากเส้นทางบำรุงรักษาแบบ bulk `openclaw plugins update --all` การอัปเดตแบบ bulk ยังคงเคารพ install spec ที่ติดตามไว้ตามปกติ แต่ record ของ Plugin OpenClaw อย่างเป็นทางการที่เชื่อถือได้สามารถ sync ไปยังเป้าหมาย catalog อย่างเป็นทางการปัจจุบันแทนการค้างอยู่บนแพ็กเกจอย่างเป็นทางการ exact ที่ล้าสมัย ใช้ `update <id>` แบบ targeted เมื่อคุณตั้งใจต้องการคง spec อย่างเป็นทางการแบบ exact หรือ tagged ไว้โดยไม่แตะต้อง

    สำหรับการติดตั้ง npm คุณยังสามารถส่ง npm package spec แบบชัดเจนพร้อม dist-tag หรือเวอร์ชัน exact ได้ OpenClaw จะ resolve ชื่อแพ็กเกจนั้นกลับไปยัง record ของ Plugin ที่ติดตามไว้ อัปเดต Plugin ที่ติดตั้งนั้น และบันทึก npm spec ใหม่สำหรับการอัปเดตแบบอิง id ในอนาคต

    การส่งชื่อแพ็กเกจ npm โดยไม่มีเวอร์ชันหรือ tag จะ resolve กลับไปยัง record ของ Plugin ที่ติดตามไว้เช่นกัน ใช้สิ่งนี้เมื่อ Plugin ถูก pin ไว้กับเวอร์ชัน exact และคุณต้องการย้ายกลับไปยัง release line เริ่มต้นของ registry

  </Accordion>
  <Accordion title="การอัปเดตช่องทาง Beta">
    `openclaw plugins update <id-or-npm-spec>` แบบ targeted จะใช้ spec ของ Plugin ที่ติดตามไว้ซ้ำ เว้นแต่คุณจะส่ง spec ใหม่ `openclaw plugins update --all` แบบ bulk จะใช้ `update.channel` ที่กำหนดค่าไว้เมื่อ sync record ของ Plugin อย่างเป็นทางการที่เชื่อถือได้ไปยังเป้าหมาย catalog อย่างเป็นทางการ ดังนั้นการติดตั้ง beta-channel จึงสามารถอยู่บน beta release line ต่อไปแทนที่จะถูก normalize เป็น stable/latest อย่างเงียบ ๆ

    `openclaw update` ยังรู้จักช่องทางอัปเดต OpenClaw ที่ใช้งานอยู่ด้วย: บนช่องทาง beta record ของ Plugin จาก npm default-line และ ClawHub จะลอง `@beta` ก่อน แล้ว fallback กลับไปยัง spec default/latest ที่บันทึกไว้หากไม่มี release beta ของ Plugin อยู่; Plugin npm ยัง fallback ด้วยเมื่อมีแพ็กเกจ beta อยู่แต่ไม่ผ่านการตรวจสอบการติดตั้ง fallback นั้นจะถูกรายงานเป็นคำเตือนและไม่ทำให้การอัปเดต core ล้มเหลว เวอร์ชัน exact และ tag ที่ระบุชัดเจนจะยังคงถูก pin ไว้กับ selector นั้นสำหรับการอัปเดตแบบ targeted

  </Accordion>
  <Accordion title="การตรวจสอบเวอร์ชันและ integrity drift">
    ก่อนการอัปเดต npm แบบ live OpenClaw จะตรวจสอบเวอร์ชันแพ็กเกจที่ติดตั้งเทียบกับเมตาดาต้า npm registry หากเวอร์ชันที่ติดตั้งและตัวตนอาร์ติแฟกต์ที่บันทึกไว้ตรงกับเป้าหมายที่ resolve แล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน `openclaw.json` ใหม่

    เมื่อมี hash integrity ที่จัดเก็บไว้และ hash ของอาร์ติแฟกต์ที่ fetch มาเปลี่ยน OpenClaw จะถือว่านั่นเป็น npm artifact drift คำสั่งแบบโต้ตอบ `openclaw plugins update` จะพิมพ์ hash ที่คาดไว้และ hash จริง แล้วขอการยืนยันก่อนดำเนินการต่อ ตัวช่วยอัปเดตแบบ non-interactive จะ fail closed เว้นแต่ผู้เรียกจะให้นโยบายการดำเนินการต่ออย่างชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install ในการอัปเดต">
    `--dangerously-force-unsafe-install` ยังรับได้ใน `plugins update` เพื่อความเข้ากันได้ แต่เลิกแนะนำแล้วและไม่เปลี่ยนพฤติกรรมการอัปเดต Plugin อีกต่อไป `security.installPolicy` ของ operator ยังสามารถบล็อกการอัปเดตได้; hook `before_install` ของ Plugin จะมีผลเฉพาะใน process ที่โหลด hook ของ Plugin ไว้เท่านั้น
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk ในการอัปเดต">
    การอัปเดต Plugin ที่ backed โดย ClawHub ชุมชนจะรันการตรวจสอบความเชื่อถือแบบ exact-release เดียวกับการติดตั้งก่อนดาวน์โหลดแพ็กเกจทดแทน ใช้ `--acknowledge-clawhub-risk` สำหรับ automation ที่ผ่านการ review แล้วซึ่งควรดำเนินต่อเมื่อ release ของ ClawHub ที่เลือกมีคำเตือนความเชื่อถือที่มีความเสี่ยง แพ็กเกจ ClawHub อย่างเป็นทางการและแหล่ง Plugin OpenClaw ที่ bundled จะข้าม prompt ความเชื่อถือของ release นี้
  </Accordion>
</AccordionGroup>

### ตรวจสอบ

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect แสดง identity, สถานะการโหลด, source, ความสามารถจาก manifest, policy flags, diagnostics, เมตาดาต้าการติดตั้ง, ความสามารถของ bundle และการรองรับเซิร์ฟเวอร์ MCP หรือ LSP ที่ตรวจพบ โดยค่าเริ่มต้นจะไม่ import runtime ของ Plugin เอาต์พุต JSON รวม contract ของ manifest Plugin เช่น `contracts.agentToolResultMiddleware` และ `contracts.trustedToolPolicies` เพื่อให้ operator สามารถ audit การประกาศ trusted-surface ก่อนเปิดใช้งานหรือ restart Plugin เพิ่ม `--runtime` เพื่อโหลดโมดูล Plugin และรวม hook, tool, command, service, gateway method และ HTTP route ที่ register ไว้ การตรวจสอบ runtime จะรายงาน dependency ของ Plugin ที่หายไปโดยตรง; การติดตั้งและการซ่อมแซมยังอยู่ใน `openclaw plugins install`, `openclaw plugins update` และ `openclaw doctor --fix`

คำสั่ง CLI ที่ Plugin เป็นเจ้าของมักติดตั้งเป็นกลุ่มคำสั่ง root `openclaw` แต่ Plugin อาจ register คำสั่ง nested ภายใต้ parent ของ core เช่น `openclaw nodes` ได้เช่นกัน หลังจาก `inspect --runtime` แสดงคำสั่งภายใต้ `cliCommands` ให้รันคำสั่งนั้นที่ path ที่ระบุไว้; ตัวอย่างเช่น Plugin ที่ register `demo-git` สามารถตรวจสอบได้ด้วย `openclaw demo-git ping`

Plugin แต่ละตัวถูกจัดประเภทตามสิ่งที่มัน register จริงใน runtime:

- **plain-capability** — capability type เดียว (เช่น Plugin ที่เป็น provider เท่านั้น)
- **hybrid-capability** — capability type หลายแบบ (เช่น ข้อความ + คำพูด + รูปภาพ)
- **hook-only** — มีเฉพาะ hook ไม่มี capabilities หรือ surfaces
- **non-capability** — tools/commands/services แต่ไม่มี capabilities

ดู [รูปแบบ Plugin](/th/plugins/architecture#plugin-shapes) สำหรับข้อมูลเพิ่มเติมเกี่ยวกับโมเดล capability

<Note>
แฟล็ก `--json` ส่งออกรายงานที่เครื่องอ่านได้ เหมาะสำหรับ scripting และ auditing `inspect --all` แสดงตารางครอบคลุมทั้ง fleet พร้อมคอลัมน์ shape, capability kinds, compatibility notices, bundle capabilities และ hook summary `info` เป็น alias ของ `inspect`
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` รายงานข้อผิดพลาดการโหลด Plugin, diagnostics ของ manifest/discovery, compatibility notices และการอ้างอิง config ของ Plugin ที่ล้าสมัย เช่น slot ของ Plugin ที่หายไป เมื่อ install tree และ config ของ Plugin สะอาด ระบบจะพิมพ์ `No plugin issues detected.` หากยังมี config ที่ล้าสมัยค้างอยู่ แต่ install tree มีสุขภาพดีในส่วนอื่น สรุปจะบอกเช่นนั้นแทนการสื่อว่าความสมบูรณ์ของ Plugin ทั้งหมดดีครบถ้วน

หาก Plugin ที่กำหนดค่าไว้มีอยู่บนดิสก์แต่ถูกบล็อกโดยการตรวจสอบ path-safety ของ loader การตรวจสอบ config จะเก็บ entry ของ Plugin ไว้และรายงานเป็น `present but blocked` แก้ diagnostic blocked-plugin ก่อนหน้า เช่น ownership ของ path หรือ permissions แบบ world-writable แทนการลบ config `plugins.entries.<id>` หรือ `plugins.allow`

สำหรับความล้มเหลวด้าน module-shape เช่น export `register`/`activate` ที่หายไป ให้รันใหม่ด้วย `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุป export-shape แบบกระชับในเอาต์พุต diagnostic

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

local plugin registry คือโมเดลอ่านแบบ cold ที่ persist ไว้ของ OpenClaw สำหรับ identity, enablement, source metadata และ contribution ownership ของ Plugin ที่ติดตั้ง การ startup ปกติ, การ lookup เจ้าของ provider, การจัดประเภทการตั้งค่าช่องทาง และ inventory ของ Plugin สามารถอ่านได้โดยไม่ต้อง import โมดูล runtime ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่า registry ที่ persist ไว้มีอยู่ เป็นปัจจุบัน หรือล้าสมัย ใช้ `--refresh` เพื่อสร้างใหม่จากดัชนี Plugin ที่ persist ไว้, นโยบาย config และเมตาดาต้า manifest/package นี่เป็นเส้นทางซ่อมแซม ไม่ใช่เส้นทาง activation ของ runtime

`openclaw doctor --fix` ยังซ่อมแซม npm drift แบบ managed ที่อยู่ใกล้กับ registry ด้วย: หากแพ็กเกจ `@openclaw/*` ที่ orphaned หรือ recovered ภายใต้โปรเจกต์ npm ของ Plugin แบบ managed หรือราก npm managed แบบ flat legacy ไป shadow Plugin ที่ bundled doctor จะลบแพ็กเกจล้าสมัยนั้นและสร้าง registry ใหม่เพื่อให้ startup ตรวจสอบกับ manifest ที่ bundled Doctor ยัง relink แพ็กเกจ host `openclaw` เข้าไปใน Plugin npm แบบ managed ที่ประกาศ `peerDependencies.openclaw` เพื่อให้ runtime import ภายในแพ็กเกจ เช่น `openclaw/plugin-sdk/*` resolve ได้หลังการอัปเดตหรือการซ่อม npm

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็นสวิตช์ความเข้ากันได้แบบ break-glass ที่เลิกแนะนำแล้วสำหรับความล้มเหลวในการอ่าน registry ควรใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix`; env fallback มีไว้เฉพาะการกู้คืน startup ฉุกเฉินระหว่างที่ migration กำลัง rollout
</Warning>

### Marketplace

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

`plugins marketplace entries` แสดงรายการจากฟีดมาร์เก็ตเพลส OpenClaw ที่กำหนดค่าไว้ โดยค่าเริ่มต้นจะพยายามใช้ฟีดที่โฮสต์ไว้และถอยกลับไปใช้สแนปช็อตที่ยอมรับล่าสุดหรือข้อมูลที่บันเดิลมา ใช้ `--feed-profile <name>` เพื่ออ่านโปรไฟล์ที่กำหนดค่าไว้เฉพาะรายการ, `--feed-url <url>` เพื่ออ่าน URL ฟีดที่โฮสต์ไว้อย่างชัดเจน และ `--offline` เพื่ออ่านสแนปช็อตที่ยอมรับล่าสุดโดยไม่ดึงฟีด

`plugins marketplace refresh` รีเฟรชสแนปช็อตฟีดที่โฮสต์ไว้ซึ่งกำหนดค่าไว้ และรายงานว่า OpenClaw ยอมรับข้อมูลที่โฮสต์ไว้ สแนปช็อตที่โฮสต์ไว้ หรือข้อมูลสำรองที่บันเดิลมา ใช้ `--expected-sha256` เมื่อผู้เรียกต้องการให้คำสั่งล้มเหลว เว้นแต่ว่าเพย์โหลดใหม่ที่โฮสต์ไว้จะตรงกับเช็กซัมที่ปักหมุดไว้

มาร์เก็ตเพลส `list` รับพาธมาร์เก็ตเพลสในเครื่อง, พาธ `marketplace.json`, ชวเลข GitHub เช่น `owner/repo`, URL repo ของ GitHub หรือ URL git `--json` จะแสดงป้ายกำกับแหล่งที่มาที่แก้ไขแล้วพร้อมกับ manifest มาร์เก็ตเพลสและรายการ Plugin ที่แยกวิเคราะห์แล้ว

การรีเฟรชมาร์เก็ตเพลสจะโหลดฟีดมาร์เก็ตเพลส OpenClaw ที่โฮสต์ไว้และคง
การตอบกลับที่ตรวจสอบความถูกต้องแล้วไว้เป็นสแนปช็อตฟีดที่โฮสต์ไว้ในเครื่อง หากไม่มีตัวเลือก จะใช้
โปรไฟล์ฟีดเริ่มต้นที่กำหนดค่าไว้ ใช้ `--feed-profile <name>` เพื่อรีเฟรช
โปรไฟล์ที่กำหนดค่าไว้เฉพาะรายการ, `--feed-url <url>` เพื่อรีเฟรช URL ฟีด
ที่โฮสต์ไว้อย่างชัดเจน, `--expected-sha256 <sha256>` เพื่อบังคับให้เช็กซัมเพย์โหลดตรงกัน
(`sha256:<hex>` หรือไดเจสต์เลขฐานสิบหก 64 อักขระแบบเปล่า) และ `--json` สำหรับ
เอาต์พุตที่เครื่องอ่านได้ URL ฟีดที่โฮสต์ไว้อย่างชัดเจนต้องไม่มี
ข้อมูลรับรองความลับ สตริงคำค้นหา หรือแฟรกเมนต์ การรีเฟรชที่ไม่ได้ปักหมุดสามารถรายงานผลลัพธ์เป็น
สแนปช็อตที่โฮสต์ไว้หรือข้อมูลสำรองที่บันเดิลมาโดยไม่ทำให้คำสั่งล้มเหลว การรีเฟรช
ที่ปักหมุดไว้จะล้มเหลว เว้นแต่ว่าจะยอมรับเพย์โหลดใหม่ที่โฮสต์ไว้ และการรีเฟรชที่โฮสต์ไว้
ซึ่งสำเร็จจะล้มเหลวหาก OpenClaw ไม่สามารถคงสแนปช็อตที่ตรวจสอบความถูกต้องแล้วไว้ได้

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [เอกสารอ้างอิง CLI](/th/cli)
- [ClawHub](/th/clawhub)
