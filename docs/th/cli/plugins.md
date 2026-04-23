---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Gateway plugins หรือ bundle ที่เข้ากันได้
    - คุณต้องการดีบักความล้มเหลวในการโหลด Plugin
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw plugins` (`list`, `install`, `marketplace`, `uninstall`, `enable`/`disable`, `doctor`)
title: Plugins
x-i18n:
    generated_at: "2026-04-23T10:16:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 469364823c0766f6534c5d7eee963877f98fe23ecfa45251696a34ef65d57599
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

จัดการ Gateway plugins, hook packs และ bundle ที่เข้ากันได้

ที่เกี่ยวข้อง:

- ระบบ Plugin: [Plugins](/th/tools/plugin)
- ความเข้ากันได้ของ bundle: [Plugin bundles](/th/plugins/bundles)
- manifest + schema ของ Plugin: [Plugin manifest](/th/plugins/manifest)
- การเสริมความมั่นคงปลอดภัย: [Security](/th/gateway/security)

## คำสั่ง

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Plugin ที่มากับระบบจะมาพร้อมกับ OpenClaw โดยบางตัวจะถูกเปิดใช้โดยค่าเริ่มต้น (เช่น ผู้ให้บริการโมเดลที่มากับระบบ ผู้ให้บริการเสียงพูดที่มากับระบบ และ browser plugin ที่มากับระบบ) ส่วนบางตัวต้องใช้ `plugins enable`

OpenClaw plugins แบบเนทีฟต้องมาพร้อม `openclaw.plugin.json` ที่มี JSON Schema แบบอินไลน์ (`configSchema` แม้จะว่างก็ตาม) ส่วน bundle ที่เข้ากันได้จะใช้ bundle manifest ของตนเองแทน

`plugins list` จะแสดง `Format: openclaw` หรือ `Format: bundle` ส่วนผลลัพธ์ของ list/info แบบ verbose จะแสดง subtype ของ bundle (`codex`, `claude` หรือ `cursor`) พร้อมความสามารถของ bundle ที่ตรวจพบ

### Install

```bash
openclaw plugins install <package>                      # ClawHub ก่อน แล้วจึง npm
openclaw plugins install clawhub:<package>              # ClawHub เท่านั้น
openclaw plugins install <package> --force              # เขียนทับการติดตั้งที่มีอยู่
openclaw plugins install <package> --pin                # ปักหมุดเวอร์ชัน
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # พาธในเครื่อง
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (ระบุชัดเจน)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

ชื่อ package แบบเปล่าจะถูกตรวจสอบกับ ClawHub ก่อน แล้วจึง npm หมายเหตุด้านความปลอดภัย: ให้ถือว่าการติดตั้ง Plugin เทียบเท่ากับการรันโค้ด ควรใช้เวอร์ชันที่ปักหมุดไว้

หากส่วน `plugins` ของคุณอิงกับ `$include` แบบไฟล์เดียว `plugins install/update/enable/disable/uninstall` จะเขียนผ่านไปยังไฟล์ที่ include นั้น และจะไม่แตะต้อง `openclaw.json` โดยตรง ส่วน root includes, include arrays และ includes ที่มี sibling overrides จะ fail closed แทนที่จะ flatten ดูรูปร่างที่รองรับได้ที่ [Config includes](/th/gateway/configuration)

หาก config ไม่ถูกต้อง ปกติ `plugins install` จะ fail closed และบอกให้คุณรัน `openclaw doctor --fix` ก่อน ข้อยกเว้นเดียวที่มีเอกสารระบุคือเส้นทางกู้คืน Plugin ที่มากับระบบแบบแคบสำหรับ plugins ที่ประกาศรองรับ `openclaw.install.allowInvalidConfigRecovery` อย่างชัดเจน

`--force` จะใช้ target การติดตั้งเดิมซ้ำและเขียนทับ Plugin หรือ hook pack ที่ติดตั้งอยู่แล้วในตำแหน่งเดิม ใช้เมื่อคุณตั้งใจจะติดตั้งทับ id เดิมจาก local path, archive, package บน ClawHub หรือ npm artifact ใหม่ สำหรับการอัปเกรด npm plugin ที่มีการติดตามอยู่แล้วตามปกติ ให้ใช้ `openclaw plugins update <id-or-npm-spec>`

หากคุณรัน `plugins install` สำหรับ plugin id ที่ติดตั้งอยู่แล้ว OpenClaw จะหยุดและแนะนำให้ใช้ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติ หรือ `plugins install <package> --force` หากคุณต้องการเขียนทับการติดตั้งปัจจุบันจากแหล่งอื่นจริงๆ

`--pin` ใช้ได้กับการติดตั้งจาก npm เท่านั้น ไม่รองรับร่วมกับ `--marketplace` เพราะการติดตั้งจาก marketplace จะบันทึกเมทาดาทาแหล่งที่มาของ marketplace แทน npm spec

`--dangerously-force-unsafe-install` เป็นตัวเลือกฉุกเฉินสำหรับกรณี false positive จากตัวสแกนโค้ดอันตรายในตัว มันอนุญาตให้การติดตั้งดำเนินต่อไปได้แม้ตัวสแกนในตัวจะรายงานผลระดับ `critical` แต่จะ **ไม่** ข้ามบล็อกจากนโยบาย hook `before_install` ของ Plugin และจะ **ไม่** ข้ามความล้มเหลวของการสแกน

แฟล็ก CLI นี้ใช้กับ flow การติดตั้ง/อัปเดต Plugin ส่วนการติดตั้ง dependency ของ Skills ที่ทำผ่าน Gateway จะใช้ request override ชื่อ `dangerouslyForceUnsafeInstall` ที่สอดคล้องกัน ขณะที่ `openclaw skills install` ยังคงเป็น flow ดาวน์โหลด/ติดตั้ง Skills จาก ClawHub แยกต่างหาก

`plugins install` ยังเป็นพื้นผิวสำหรับติดตั้ง hook packs ที่ประกาศ `openclaw.hooks` ใน `package.json` ด้วย ให้ใช้ `openclaw hooks` สำหรับการดู hook แบบกรองและการเปิดใช้งานราย hook ไม่ใช่สำหรับติดตั้ง package

npm specs เป็นแบบ **registry-only** (ชื่อ package พร้อม **เวอร์ชันแบบ exact** หรือ **dist-tag** แบบไม่บังคับ) โดยจะปฏิเสธ specs แบบ Git/URL/file และ semver ranges การติดตั้ง dependency จะรันด้วย `--ignore-scripts` เพื่อความปลอดภัย

specs แบบเปล่าและ `@latest` จะอยู่บนสาย stable หาก npm resolve อย่างใดอย่างหนึ่งไปเป็น prerelease OpenClaw จะหยุดและขอให้คุณเลือกใช้ prerelease อย่างชัดเจนด้วยแท็ก prerelease เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease แบบ exact เช่น `@1.2.3-beta.4`

หาก install spec แบบเปล่าตรงกับ bundled plugin id (เช่น `diffs`) OpenClaw จะติดตั้ง bundled plugin นั้นโดยตรง หากต้องการติดตั้ง npm package ที่มีชื่อเดียวกัน ให้ใช้ scoped spec แบบชัดเจน (เช่น `@scope/diffs`)

archive ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar`

รองรับการติดตั้งจาก Claude marketplace เช่นกัน

การติดตั้งจาก ClawHub ใช้ locator แบบชัดเจน `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

ขณะนี้ OpenClaw ยังให้ความสำคัญกับ ClawHub ก่อนสำหรับ plugin specs แบบเปล่าที่ปลอดภัยกับ npm ด้วย โดยจะ fallback ไป npm เฉพาะเมื่อ ClawHub ไม่มี package หรือเวอร์ชันนั้น:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw จะดาวน์โหลด package archive จาก ClawHub ตรวจสอบความเข้ากันได้ของ plugin API / minimum gateway ตามที่ประกาศ แล้วติดตั้งผ่านเส้นทาง archive ปกติ การติดตั้งที่ถูกบันทึกไว้จะเก็บเมทาดาทาแหล่งที่มาจาก ClawHub ไว้สำหรับการอัปเดตภายหลัง

ใช้ shorthand แบบ `plugin@marketplace` เมื่อมีชื่อ marketplace อยู่ใน local registry cache ของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

ใช้ `--marketplace` เมื่อต้องการระบุแหล่ง marketplace อย่างชัดเจน:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

แหล่ง marketplace สามารถเป็น:

- ชื่อ known-marketplace ของ Claude จาก `~/.claude/plugins/known_marketplaces.json`
- local marketplace root หรือพาธ `marketplace.json`
- shorthand ของ GitHub repo เช่น `owner/repo`
- URL ของ GitHub repo เช่น `https://github.com/owner/repo`
- git URL

สำหรับ remote marketplaces ที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องคงอยู่ภายใน marketplace repo ที่ถูก clone มา OpenClaw ยอมรับแหล่ง Plugin แบบ relative path จาก repo นั้น และจะปฏิเสธแหล่ง Plugin แบบ HTTP(S), absolute-path, git, GitHub และแหล่งที่ไม่ใช่ path อื่นๆ จาก remote manifests

สำหรับ local paths และ archives OpenClaw จะตรวจจับอัตโนมัติ:

- OpenClaw plugins แบบเนทีฟ (`openclaw.plugin.json`)
- bundle ที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- bundle ที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือโครงร่าง component เริ่มต้นของ Claude)
- bundle ที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

bundle ที่เข้ากันได้จะติดตั้งเข้า plugin root ปกติ และเข้าร่วม flow เดียวกันของ list/info/enable/disable ปัจจุบันรองรับ bundle skills, Claude command-skills, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` / `lspServers` ที่ประกาศใน manifest, Cursor command-skills และไดเรกทอรี hooks ของ Codex ที่เข้ากันได้ ส่วนความสามารถของ bundle อื่นๆ ที่ตรวจพบจะแสดงใน diagnostics/info แต่ยังไม่ได้เชื่อมต่อเข้ากับการทำงานรันไทม์

### List

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

ใช้ `--enabled` เพื่อแสดงเฉพาะ plugins ที่ถูกโหลด ใช้ `--verbose` เพื่อเปลี่ยนจากมุมมองแบบตารางไปเป็นบรรทัดรายละเอียดต่อ Plugin พร้อมเมทาดาทา source/origin/version/activation ใช้ `--json` สำหรับ inventory ที่เครื่องอ่านได้พร้อม diagnostics ของ registry

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรีในเครื่อง (จะเพิ่มเข้า `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

ไม่รองรับ `--force` ร่วมกับ `--link` เพราะการติดตั้งแบบลิงก์จะใช้ source path เดิมซ้ำแทนการคัดลอกทับ target การติดตั้งที่ระบบจัดการ

ใช้ `--pin` กับการติดตั้งจาก npm เพื่อบันทึก exact spec ที่ resolve แล้ว (`name@version`) ลงใน `plugins.installs` โดยยังคงพฤติกรรมค่าเริ่มต้นแบบไม่ปักหมุดไว้

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` จะลบบันทึก Plugin ออกจาก `plugins.entries`, `plugins.installs`, allowlist ของ Plugin และรายการ `plugins.load.paths` แบบลิงก์เมื่อเกี่ยวข้อง สำหรับ Active Memory plugins สล็อตหน่วยความจำจะรีเซ็ตกลับเป็น `memory-core`

โดยค่าเริ่มต้น การถอนการติดตั้งจะลบไดเรกทอรีการติดตั้ง Plugin ภายใต้ plugin root ของ state-dir ที่ใช้งานอยู่ด้วย ใช้ `--keep-files` หากต้องการเก็บไฟล์ไว้บนดิสก์

รองรับ `--keep-config` ในฐานะ alias ที่เลิกใช้แล้วของ `--keep-files`

### Update

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

การอัปเดตจะใช้กับการติดตั้งที่มีการติดตามใน `plugins.installs` และการติดตั้ง hook-pack ที่มีการติดตามใน `hooks.internal.installs`

เมื่อคุณส่ง plugin id OpenClaw จะใช้ install spec ที่บันทึกไว้สำหรับ Plugin นั้นซ้ำ หมายความว่า dist-tags ที่เก็บไว้ก่อนหน้า เช่น `@beta` และเวอร์ชันแบบ pinned exact จะยังถูกใช้ต่อไปในการรัน `update <id>` ครั้งถัดไป

สำหรับการติดตั้งจาก npm คุณยังสามารถส่ง npm package spec แบบชัดเจนพร้อม dist-tag หรือเวอร์ชัน exact ได้ OpenClaw จะ resolve ชื่อ package นั้นกลับไปยังบันทึก Plugin ที่มีการติดตาม อัปเดต Plugin ที่ติดตั้งนั้น และบันทึก npm spec ใหม่ไว้สำหรับการอัปเดตแบบใช้ id ในอนาคต

การส่งชื่อ npm package โดยไม่มีเวอร์ชันหรือแท็กก็จะ resolve กลับไปยังบันทึก Plugin ที่มีการติดตามเช่นกัน ใช้สิ่งนี้เมื่อ Plugin ถูกปักหมุดไว้ที่เวอร์ชัน exact และคุณต้องการย้ายกลับไปยังสาย release เริ่มต้นของ registry

ก่อนการอัปเดต npm แบบจริง OpenClaw จะตรวจสอบเวอร์ชัน package ที่ติดตั้งกับเมทาดาทา registry ของ npm หากเวอร์ชันที่ติดตั้งและ identity ของ artifact ที่บันทึกไว้ตรงกับ target ที่ resolve แล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน `openclaw.json` ใหม่

เมื่อมีการเก็บ integrity hash ไว้และ hash ของ artifact ที่ดึงมาเปลี่ยนไป OpenClaw จะถือว่านั่นคือ npm artifact drift คำสั่ง `openclaw plugins update` แบบ interactive จะแสดง expected hash และ actual hash แล้วขอการยืนยันก่อนดำเนินการต่อ ส่วนตัวช่วยอัปเดตแบบ non-interactive จะ fail closed เว้นแต่ผู้เรียกจะระบุนโยบายการดำเนินการต่ออย่างชัดเจน

`--dangerously-force-unsafe-install` ใช้กับ `plugins update` ได้เช่นกันในฐานะการ override แบบฉุกเฉินสำหรับ false positive ของการสแกนโค้ดอันตรายในตัวระหว่างการอัปเดต Plugin โดยยังคงไม่ข้ามการบล็อกจากนโยบาย `before_install` ของ Plugin หรือการบล็อกจากความล้มเหลวของการสแกน และใช้ได้เฉพาะกับการอัปเดต Plugin ไม่ใช่การอัปเดต hook-pack

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

การตรวจสอบเชิงลึกสำหรับ Plugin เดียว จะแสดง identity, สถานะการโหลด, source, ความสามารถที่ลงทะเบียนไว้, hooks, tools, commands, services, methods ของ Gateway, HTTP routes, แฟล็กนโยบาย, diagnostics, เมทาดาทาการติดตั้ง, ความสามารถของ bundle และการรองรับ MCP หรือ LSP server ที่ตรวจพบ

แต่ละ Plugin จะถูกจัดประเภทตามสิ่งที่มันลงทะเบียนจริงในรันไทม์:

- **plain-capability** — ความสามารถหนึ่งประเภท (เช่น provider-only plugin)
- **hybrid-capability** — ความสามารถหลายประเภท (เช่น ข้อความ + เสียงพูด + รูปภาพ)
- **hook-only** — มีเฉพาะ hooks ไม่มีความสามารถหรือพื้นผิวอื่น
- **non-capability** — มี tools/commands/services แต่ไม่มีความสามารถ

ดู [รูปร่างของ Plugin](/th/plugins/architecture#plugin-shapes) สำหรับข้อมูลเพิ่มเติมเกี่ยวกับโมเดลความสามารถ

แฟล็ก `--json` จะส่งออกรายงานแบบเครื่องอ่านได้ เหมาะสำหรับการเขียนสคริปต์และการตรวจสอบ

`inspect --all` จะแสดงตารางทั้งชุดระบบพร้อมคอลัมน์ shape, ประเภทความสามารถ, ข้อสังเกตด้านความเข้ากันได้, ความสามารถของ bundle และสรุป hook

`info` เป็น alias ของ `inspect`

### Doctor

```bash
openclaw plugins doctor
```

`doctor` จะรายงานข้อผิดพลาดในการโหลด Plugin, diagnostics ของ manifest/discovery และข้อสังเกตด้านความเข้ากันได้ เมื่อทุกอย่างเรียบร้อย จะพิมพ์ `No plugin issues
detected.`

สำหรับความล้มเหลวด้าน module-shape เช่นไม่มี export `register`/`activate` ให้รันอีกครั้งพร้อม `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุปรูปร่าง export แบบย่อไว้ในผลลัพธ์การวินิจฉัย

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

คำสั่งแสดงรายการ marketplace รองรับ local marketplace path, พาธ `marketplace.json`, shorthand ของ GitHub เช่น `owner/repo`, URL ของ GitHub repo หรือ git URL ส่วน `--json` จะพิมพ์ source label ที่ resolve แล้ว พร้อม marketplace manifest และรายการ Plugin ที่ parse ได้
