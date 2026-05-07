---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือบันเดิลที่เข้ากันได้
    - คุณต้องการดีบักความล้มเหลวในการโหลด Plugin
sidebarTitle: Plugins
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-07T13:14:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73023d11309c5dc4fe9fab9cffc0f7d96de1e1c22ce1ec4d2cd22d2aa4808f1a
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Plugin ของ Gateway, ชุด hook, และ bundle ที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="Plugin system" href="/th/tools/plugin">
    คู่มือสำหรับผู้ใช้ปลายทางในการติดตั้ง เปิดใช้งาน และแก้ปัญหา Plugin
  </Card>
  <Card title="Manage plugins" href="/th/plugins/manage-plugins">
    ตัวอย่างแบบรวดเร็วสำหรับการติดตั้ง แสดงรายการ อัปเดต ถอนการติดตั้ง และเผยแพร่
  </Card>
  <Card title="Plugin bundles" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของ bundle
  </Card>
  <Card title="Plugin manifest" href="/th/plugins/manifest">
    ฟิลด์ manifest และสกีมา config
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
```

สำหรับการตรวจสอบกรณีติดตั้ง ตรวจสอบ ถอนการติดตั้ง หรือ refresh registry ที่ช้า ให้รัน
คำสั่งพร้อม `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` trace จะเขียนเวลาแต่ละ phase
ไปยัง stderr และทำให้เอาต์พุต JSON ยังคง parse ได้ ดู [การดีบัก](/th/help/debugging#plugin-lifecycle-trace)

<Note>
ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) mutator ของ lifecycle Plugin จะถูกปิดใช้งาน ให้ใช้ซอร์ส Nix สำหรับการติดตั้งนี้แทน `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable`, หรือ `plugins disable`; สำหรับ nix-openclaw ให้ใช้ [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) แบบ agent-first
</Note>

<Note>
Plugin ที่ bundled มาพร้อมกับ OpenClaw บางรายการเปิดใช้งานตามค่าเริ่มต้น (เช่น provider โมเดลที่ bundled, provider เสียงพูดที่ bundled, และ Plugin เบราว์เซอร์ที่ bundled); รายการอื่นต้องใช้ `plugins enable`

Plugin ของ OpenClaw แบบ native ต้องมาพร้อม `openclaw.plugin.json` ที่มี JSON Schema แบบ inline (`configSchema` แม้จะว่างก็ตาม) bundle ที่เข้ากันได้จะใช้ manifest ของ bundle เองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุตแบบ verbose ของ list/info ยังแสดง subtype ของ bundle (`codex`, `claude`, หรือ `cursor`) พร้อม capability ของ bundle ที่ตรวจพบด้วย
</Note>

### ติดตั้ง

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
ชื่อแพ็กเกจแบบ bare จะติดตั้งจาก npm ตามค่าเริ่มต้นระหว่างช่วงเปลี่ยนผ่านการเปิดตัว ใช้ `clawhub:<package>` สำหรับ ClawHub ปฏิบัติกับการติดตั้ง Plugin เหมือนการรันโค้ด ควรใช้เวอร์ชันที่ pin ไว้
</Warning>

`plugins search` query ClawHub เพื่อหาแพ็กเกจ Plugin ที่ติดตั้งได้ และพิมพ์
ชื่อแพ็กเกจที่พร้อมติดตั้ง ระบบจะค้นหาแพ็กเกจ code-plugin และ bundle-plugin
ไม่ใช่ Skills ใช้ `openclaw skills search` สำหรับ Skills บน ClawHub

<Note>
ClawHub เป็นพื้นผิวหลักสำหรับการเผยแพร่และค้นพบ Plugin ส่วนใหญ่ Npm
ยังคงเป็น fallback ที่รองรับและเป็นเส้นทาง direct-install แพ็กเกจ Plugin
`@openclaw/*` ที่ OpenClaw เป็นเจ้าของถูกเผยแพร่บน npm อีกครั้งแล้ว; ดูรายการปัจจุบัน
ได้ที่ [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) หรือ
[คลังรายการ Plugin](/th/plugins/plugin-inventory) การติดตั้ง stable ใช้ `latest`
การติดตั้งและอัปเดตจากช่อง beta จะเลือกใช้ dist-tag `beta` ของ npm เมื่อ tag นั้น
พร้อมใช้งาน แล้วจึง fallback ไปที่ `latest`
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    หากส่วน `plugins` ของคุณรองรับด้วย `$include` แบบไฟล์เดียว `plugins install/update/enable/disable/uninstall` จะเขียนทะลุไปยังไฟล์ที่ include นั้นและปล่อย `openclaw.json` ไว้ไม่เปลี่ยนแปลง root include, include array, และ include ที่มี sibling override จะ fail closed แทนการ flatten ดู [Config includes](/th/gateway/configuration) สำหรับรูปแบบที่รองรับ

    หาก config ไม่ถูกต้องระหว่างการติดตั้ง โดยปกติ `plugins install` จะ fail closed และแจ้งให้คุณรัน `openclaw doctor --fix` ก่อน ระหว่างการเริ่มต้น Gateway และ hot reload config ของ Plugin ที่ไม่ถูกต้องจะ fail closed เหมือน config ที่ไม่ถูกต้องอื่น ๆ; `openclaw doctor --fix` สามารถ quarantine รายการ Plugin ที่ไม่ถูกต้องได้ ข้อยกเว้นตอนติดตั้งที่มีเอกสารระบุไว้เพียงอย่างเดียวคือเส้นทางกู้คืน Plugin ที่ bundled แบบแคบสำหรับ Plugin ที่ opt in เข้า `openclaw.install.allowInvalidConfigRecovery` อย่างชัดเจน

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` ใช้เป้าหมายการติดตั้งเดิมซ้ำและเขียนทับ Plugin หรือชุด hook ที่ติดตั้งอยู่แล้วในตำแหน่งเดิม ใช้เมื่อคุณตั้งใจติดตั้ง id เดิมซ้ำจาก path ภายในเครื่อง archive แพ็กเกจ ClawHub หรือ artifact ของ npm ใหม่ สำหรับการอัปเกรดปกติของ Plugin npm ที่ติดตามอยู่แล้ว ควรใช้ `openclaw plugins update <id-or-npm-spec>`

    หากคุณรัน `plugins install` สำหรับ id ของ Plugin ที่ติดตั้งอยู่แล้ว OpenClaw จะหยุดและชี้ให้คุณใช้ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดปกติ หรือใช้ `plugins install <package> --force` เมื่อคุณต้องการเขียนทับการติดตั้งปัจจุบันจากซอร์สอื่นจริง ๆ

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` ใช้ได้กับการติดตั้ง npm เท่านั้น ไม่รองรับกับการติดตั้ง `git:`; ใช้ git ref แบบชัดเจน เช่น `git:github.com/acme/plugin@v1.2.3` เมื่อคุณต้องการซอร์สที่ pin ไว้ ไม่รองรับกับ `--marketplace` เพราะการติดตั้งผ่าน marketplace จะเก็บ metadata ซอร์สของ marketplace แทน npm spec
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` เป็นตัวเลือก break-glass สำหรับ false positive ในตัวสแกนโค้ดอันตรายแบบ built-in โดยอนุญาตให้การติดตั้งดำเนินต่อได้แม้ตัวสแกน built-in รายงาน finding ระดับ `critical` แต่จะ **ไม่** ข้าม policy block ของ hook `before_install` ของ Plugin และ **ไม่** ข้ามความล้มเหลวของการสแกน

    แฟล็ก CLI นี้ใช้กับ flow การติดตั้ง/อัปเดต Plugin การติดตั้ง dependency ของ skill ที่หนุนด้วย Gateway ใช้ request override `dangerouslyForceUnsafeInstall` ที่สอดคล้องกัน ส่วน `openclaw skills install` ยังคงเป็น flow ดาวน์โหลด/ติดตั้ง skill จาก ClawHub แยกต่างหาก

    หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกบล็อกโดย registry scan ให้ใช้ขั้นตอนสำหรับผู้เผยแพร่ใน [ClawHub](/th/tools/clawhub)

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับชุด hook ที่ expose `openclaw.hooks` ใน `package.json` ด้วย ใช้ `openclaw hooks` สำหรับการมองเห็น hook แบบกรองและการเปิดใช้งานราย hook ไม่ใช่สำหรับติดตั้งแพ็กเกจ

    spec ของ Npm เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **เวอร์ชันแบบ exact** หรือ **dist-tag** ที่ไม่บังคับ) spec แบบ Git/URL/file และช่วง semver จะถูกปฏิเสธ การติดตั้ง dependency จะรันแบบ project-local พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้ shell ของคุณจะมีการตั้งค่า npm install แบบ global ก็ตาม root ของ npm สำหรับ Plugin ที่จัดการโดยระบบจะสืบทอด `overrides` ของ npm ระดับแพ็กเกจของ OpenClaw ดังนั้น pin ด้านความปลอดภัยของ host จึงมีผลกับ dependency ของ Plugin ที่ hoist ด้วย

    ใช้ `npm:<package>` เมื่อคุณต้องการระบุการ resolve ของ npm ให้ชัดเจน spec แพ็กเกจแบบ bare จะติดตั้งจาก npm โดยตรงระหว่างช่วงเปลี่ยนผ่านการเปิดตัวด้วย

    spec แบบ bare และ `@latest` จะอยู่บน track stable เวอร์ชัน correction แบบ date-stamped ของ OpenClaw เช่น `2026.5.3-1` เป็น stable release สำหรับการตรวจนี้ หาก npm resolve สิ่งใดสิ่งหนึ่งเหล่านั้นเป็น prerelease OpenClaw จะหยุดและขอให้คุณ opt in อย่างชัดเจนด้วย tag prerelease เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease แบบ exact เช่น `@1.2.3-beta.4`

    หาก spec ติดตั้งแบบ bare ตรงกับ id ของ Plugin อย่างเป็นทางการ (เช่น `diffs`) OpenClaw จะติดตั้งรายการใน catalog โดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่มีชื่อเดียวกัน ให้ใช้ spec แบบ scoped ที่ชัดเจน (เช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="Git repositories">
    ใช้ `git:<repo>` เพื่อติดตั้งโดยตรงจาก git repository รูปแบบที่รองรับรวมถึง `git:github.com/owner/repo`, `git:owner/repo`, clone URL แบบเต็ม `https://`, `ssh://`, `git://`, `file://`, และ `git@host:owner/repo.git` เพิ่ม `@<ref>` หรือ `#<ref>` เพื่อ checkout branch, tag หรือ commit ก่อนติดตั้ง

    การติดตั้งจาก Git จะ clone ไปยัง directory ชั่วคราว checkout ref ที่ขอเมื่อมี แล้วใช้ตัวติดตั้ง directory ของ Plugin ตามปกติ ซึ่งหมายความว่า manifest validation, dangerous-code scanning, งานติดตั้งของ package-manager และ install record จะทำงานเหมือนการติดตั้ง npm การติดตั้ง git ที่บันทึกไว้จะรวม source URL/ref พร้อม commit ที่ resolve แล้ว เพื่อให้ `openclaw plugins update` สามารถ re-resolve ซอร์สภายหลังได้

    หลังติดตั้งจาก git ให้ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อตรวจสอบ registration ตอน runtime เช่น method ของ gateway และคำสั่ง CLI หาก Plugin ลงทะเบียน root ของ CLI ด้วย `api.registerCli` ให้ execute คำสั่งนั้นโดยตรงผ่าน root CLI ของ OpenClaw เช่น `openclaw demo-plugin ping`

  </Accordion>
  <Accordion title="Archives">
    archive ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` archive ของ Plugin OpenClaw แบบ native ต้องมี `openclaw.plugin.json` ที่ถูกต้องที่ root ของ Plugin หลังแตกไฟล์; archive ที่มีเพียง `package.json` จะถูกปฏิเสธก่อนที่ OpenClaw จะเขียน install record

    ใช้ `npm-pack:<path.tgz>` เมื่อไฟล์เป็น tarball ของ npm-pack และคุณต้องการ
    ทดสอบเส้นทางการติดตั้ง npm-root ที่จัดการโดยระบบแบบเดียวกับที่ใช้ในการติดตั้งจาก registry
    รวมถึงการตรวจสอบ `package-lock.json`, การสแกน dependency ที่ hoist และ
    install record ของ npm path ของ archive แบบ plain จะยังติดตั้งเป็น local archive
    ใต้ root ของ extensions ของ Plugin

    รองรับการติดตั้งจาก marketplace ของ Claude ด้วย

  </Accordion>
</AccordionGroup>

การติดตั้งจาก ClawHub ใช้ locator `clawhub:<package>` แบบชัดเจน:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

spec ของ Plugin ที่ปลอดภัยสำหรับ npm แบบ bare จะติดตั้งจาก npm ตามค่าเริ่มต้นระหว่างช่วงเปลี่ยนผ่านการเปิดตัว:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อระบุการ resolve แบบ npm-only ให้ชัดเจน:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw จะตรวจสอบ API ของ Plugin ที่ประกาศไว้ / ความเข้ากันได้ขั้นต่ำของ Gateway ก่อนติดตั้ง เมื่อเวอร์ชัน ClawHub ที่เลือกเผยแพร่อาร์ติแฟกต์ ClawPack OpenClaw จะดาวน์โหลด npm-pack `.tgz` แบบมีเวอร์ชัน ตรวจสอบส่วนหัว digest ของ ClawHub และ digest ของอาร์ติแฟกต์ จากนั้นติดตั้งผ่านเส้นทางอาร์ไคฟ์ปกติ เวอร์ชัน ClawHub ที่เก่ากว่าซึ่งไม่มีเมตาดาต้า ClawPack จะยังติดตั้งผ่านเส้นทางตรวจสอบอาร์ไคฟ์แพ็กเกจแบบเดิม การติดตั้งที่บันทึกไว้จะเก็บเมตาดาต้าแหล่งที่มาของ ClawHub, ชนิดอาร์ติแฟกต์, npm integrity, npm shasum, ชื่อ tarball และข้อเท็จจริง digest ของ ClawPack ไว้สำหรับการอัปเดตในภายหลัง
การติดตั้ง ClawHub แบบไม่มีเวอร์ชันจะเก็บสเปกที่บันทึกไว้แบบไม่มีเวอร์ชัน เพื่อให้ `openclaw plugins update` สามารถตามรุ่น ClawHub ที่ใหม่กว่าได้ ส่วนตัวเลือกเวอร์ชันหรือแท็กที่ระบุชัดเจน เช่น `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` จะยังคงถูกตรึงไว้กับตัวเลือกนั้น

#### ชวเลข Marketplace

ใช้ชวเลข `plugin@marketplace` เมื่อชื่อ marketplace มีอยู่ในแคชรีจิสทรีภายในเครื่องของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="แหล่งที่มาของ Marketplace">
    - ชื่อ marketplace ที่ Claude รู้จักจาก `~/.claude/plugins/known_marketplaces.json`
    - รูท marketplace ภายในเครื่องหรือพาธ `marketplace.json`
    - ชวเลข repo ของ GitHub เช่น `owner/repo`
    - URL repo ของ GitHub เช่น `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="กฎของ marketplace ระยะไกล">
    สำหรับ marketplace ระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องอยู่ภายใน repo marketplace ที่โคลนมา OpenClaw ยอมรับแหล่งที่มาแบบพาธสัมพัทธ์จาก repo นั้น และปฏิเสธแหล่งที่มาของ Plugin แบบ HTTP(S), พาธสัมบูรณ์, git, GitHub และแหล่งอื่นที่ไม่ใช่พาธจาก manifest ระยะไกล
  </Tab>
</Tabs>

สำหรับพาธและอาร์ไคฟ์ภายในเครื่อง OpenClaw จะตรวจหาโดยอัตโนมัติ:

- Plugin ดั้งเดิมของ OpenClaw (`openclaw.plugin.json`)
- บันเดิลที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- บันเดิลที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือเลย์เอาต์คอมโพเนนต์เริ่มต้นของ Claude)
- บันเดิลที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

<Note>
บันเดิลที่เข้ากันได้จะติดตั้งลงในรูท Plugin ปกติและเข้าร่วมในโฟลว์ list/info/enable/disable เดียวกัน ปัจจุบันรองรับ Skills ของบันเดิล, command-skills ของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` / `lspServers` ที่ประกาศใน manifest ของ Claude, command-skills ของ Cursor และไดเรกทอรี hook ของ Codex ที่เข้ากันได้ ส่วนความสามารถอื่นของบันเดิลที่ตรวจพบจะแสดงใน diagnostics/info แต่ยังไม่ได้เชื่อมเข้ากับการทำงานของ runtime
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
  เปลี่ยนจากมุมมองตารางเป็นบรรทัดรายละเอียดราย Plugin พร้อมเมตาดาต้าแหล่งที่มา/ต้นทาง/เวอร์ชัน/การเปิดใช้งาน
</ParamField>
<ParamField path="--json" type="boolean">
  อินเวนทอรีที่เครื่องอ่านได้ พร้อม diagnostics ของรีจิสทรีและสถานะการติดตั้ง dependency ของแพ็กเกจ
</ParamField>

<Note>
`plugins list` จะอ่านรีจิสทรี Plugin ภายในเครื่องที่คงอยู่ก่อน โดยมี fallback ที่สร้างจาก manifest เท่านั้นเมื่อรีจิสทรีหายไปหรือไม่ถูกต้อง คำสั่งนี้มีประโยชน์สำหรับตรวจสอบว่า Plugin ถูกติดตั้ง เปิดใช้งาน และมองเห็นในการวางแผนเริ่มต้นแบบเย็นหรือไม่ แต่ไม่ใช่การตรวจ probe runtime สดของกระบวนการ Gateway ที่กำลังทำงานอยู่ หลังจากเปลี่ยนโค้ด Plugin, การเปิดใช้งาน, นโยบาย hook หรือ `plugins.load.paths` ให้รีสตาร์ท Gateway ที่ให้บริการช่องทางก่อนคาดหวังให้โค้ด `register(api)` หรือ hook ใหม่ทำงาน สำหรับการปรับใช้ระยะไกล/คอนเทนเนอร์ ให้ตรวจสอบว่าคุณกำลังรีสตาร์ท child ของ `openclaw gateway run` จริง ไม่ใช่แค่กระบวนการ wrapper

`plugins list --json` รวม `dependencyStatus` ของแต่ละ Plugin จาก `package.json`
`dependencies` และ `optionalDependencies` OpenClaw ตรวจสอบว่าชื่อแพ็กเกจเหล่านั้นมีอยู่ตามพาธ lookup `node_modules` ปกติของ Node สำหรับ Plugin หรือไม่ โดยจะไม่นำเข้าโค้ด runtime ของ Plugin ไม่รันตัวจัดการแพ็กเกจ และไม่ซ่อม dependency ที่ขาดหาย
</Note>

`plugins search` คือการค้นหาแคตตาล็อก ClawHub ระยะไกล ไม่ตรวจสอบสถานะภายในเครื่อง
ไม่แก้ไข config ไม่ติดตั้งแพ็กเกจ และไม่โหลดโค้ด runtime ของ Plugin ผลการค้นหาจะรวมชื่อแพ็กเกจ ClawHub, family, channel, เวอร์ชัน, สรุป และ
คำแนะนำการติดตั้ง เช่น `openclaw plugins install clawhub:<package>`

สำหรับงาน Plugin ที่บันเดิลอยู่ภายในอิมเมจ Docker แบบแพ็กเกจ ให้ bind-mount ไดเรกทอรีแหล่งที่มาของ Plugin
ทับพาธแหล่งที่มาแบบแพ็กเกจที่ตรงกัน เช่น
`/app/extensions/synology-chat` OpenClaw จะค้นพบ overlay แหล่งที่มาที่ mount นั้น
ก่อน `/app/dist/extensions/synology-chat`; ไดเรกทอรีแหล่งที่มาที่คัดลอกแบบธรรมดาจะยังไม่ทำงาน ดังนั้นการติดตั้งแบบแพ็กเกจปกติจะยังใช้ dist ที่คอมไพล์แล้ว

สำหรับการดีบัก hook ของ runtime:

- `openclaw plugins inspect <id> --runtime --json` แสดง hook ที่ลงทะเบียนไว้และ diagnostics จากรอบการตรวจสอบที่โหลดโมดูล การตรวจสอบ runtime จะไม่ติดตั้ง dependency; ใช้ `openclaw doctor --fix` เพื่อล้างสถานะ dependency เดิมหรือกู้คืน Plugin ที่ดาวน์โหลดได้ซึ่งถูกอ้างอิงโดย config แต่หายไป
- `openclaw gateway status --deep --require-rpc` ยืนยัน Gateway ที่เข้าถึงได้, คำใบ้บริการ/กระบวนการ, พาธ config และสุขภาพ RPC
- hook การสนทนาที่ไม่ได้บันเดิล (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรีภายในเครื่อง (เพิ่มไปยัง `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
ไม่รองรับ `--force` ร่วมกับ `--link` เพราะการติดตั้งแบบลิงก์จะใช้พาธแหล่งที่มาซ้ำ แทนที่จะคัดลอกทับเป้าหมายการติดตั้งที่จัดการอยู่

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึกสเปกที่ resolve แล้วแบบแน่นอน (`name@version`) ในดัชนี Plugin ที่จัดการอยู่ โดยยังคงพฤติกรรมเริ่มต้นแบบไม่ตรึงไว้
</Note>

### ดัชนี Plugin

เมตาดาต้าการติดตั้ง Plugin คือสถานะที่เครื่องจัดการ ไม่ใช่ config ของผู้ใช้ การติดตั้งและการอัปเดตจะเขียนข้อมูลนี้ไปยัง `plugins/installs.json` ภายใต้ไดเรกทอรีสถานะ OpenClaw ที่ใช้งานอยู่ แผนที่ `installRecords` ระดับบนสุดคือแหล่งที่มาคงทนของเมตาดาต้าการติดตั้ง รวมถึงระเบียนสำหรับ manifest ของ Plugin ที่เสียหรือหายไป อาร์เรย์ `plugins` คือแคชรีจิสทรีแบบเย็นที่สร้างจาก manifest ไฟล์นี้มีคำเตือนห้ามแก้ไข และถูกใช้โดย `openclaw plugins update`, uninstall, diagnostics และรีจิสทรี Plugin แบบเย็น

เมื่อ OpenClaw พบระเบียน `plugins.installs` เดิมที่ถูกส่งมากับ config การอ่าน runtime จะถือว่าข้อมูลเหล่านั้นเป็นอินพุตความเข้ากันได้โดยไม่เขียน `openclaw.json` ใหม่ การเขียน Plugin อย่างชัดเจนและ `openclaw doctor --fix` จะย้ายระเบียนเหล่านั้นไปยังดัชนี Plugin และลบคีย์ config เมื่ออนุญาตให้เขียน config ได้; หากการเขียนใดล้มเหลว ระเบียนใน config จะถูกเก็บไว้เพื่อไม่ให้เมตาดาต้าการติดตั้งสูญหาย

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` จะลบระเบียน Plugin ออกจาก `plugins.entries`, ดัชนี Plugin ที่คงอยู่, รายการ allow/deny ของ Plugin และรายการ `plugins.load.paths` ที่ลิงก์ไว้เมื่อเกี่ยวข้อง เว้นแต่ตั้งค่า `--keep-files` การถอนการติดตั้งจะลบไดเรกทอรีการติดตั้งที่จัดการและติดตามไว้ด้วยเมื่ออยู่ภายในรูทส่วนขยาย Plugin ของ OpenClaw สำหรับ Plugin หน่วยความจำที่ใช้งานอยู่ สล็อตหน่วยความจำจะรีเซ็ตเป็น `memory-core`

<Note>
รองรับ `--keep-config` เป็น alias ที่เลิกใช้แล้วของ `--keep-files`
</Note>

### อัปเดต

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

การอัปเดตจะใช้กับการติดตั้ง Plugin ที่ติดตามไว้ในดัชนี Plugin ที่จัดการอยู่ และการติดตั้ง hook-pack ที่ติดตามไว้ใน `hooks.internal.installs`

<AccordionGroup>
  <Accordion title="การ resolve id ของ Plugin เทียบกับสเปก npm">
    เมื่อคุณส่ง id ของ Plugin OpenClaw จะใช้สเปกการติดตั้งที่บันทึกไว้สำหรับ Plugin นั้นซ้ำ ซึ่งหมายความว่า dist-tag ที่เก็บไว้ก่อนหน้า เช่น `@beta` และเวอร์ชันที่ตรึงไว้แบบแน่นอนจะยังคงถูกใช้ในการรัน `update <id>` ครั้งต่อไป

    สำหรับการติดตั้ง npm คุณยังสามารถส่งสเปกแพ็กเกจ npm อย่างชัดเจนพร้อม dist-tag หรือเวอร์ชันแน่นอนได้ OpenClaw จะ resolve ชื่อแพ็กเกจนั้นกลับไปยังระเบียน Plugin ที่ติดตามไว้ อัปเดต Plugin ที่ติดตั้งนั้น และบันทึกสเปก npm ใหม่สำหรับการอัปเดตตาม id ในอนาคต

    การส่งชื่อแพ็กเกจ npm โดยไม่มีเวอร์ชันหรือแท็กจะ resolve กลับไปยังระเบียน Plugin ที่ติดตามไว้เช่นกัน ใช้กรณีนี้เมื่อ Plugin ถูกตรึงไว้กับเวอร์ชันแน่นอนและคุณต้องการย้ายกลับไปยังสาย release เริ่มต้นของรีจิสทรี

  </Accordion>
  <Accordion title="การอัปเดตช่องทาง Beta">
    `openclaw plugins update` ใช้สเปก Plugin ที่ติดตามไว้ซ้ำ เว้นแต่คุณจะส่งสเปกใหม่ `openclaw update` ยังรู้จักช่องทางอัปเดต OpenClaw ที่ใช้งานอยู่ด้วย: บนช่องทาง beta ระเบียน Plugin แบบ npm และ ClawHub ในสายเริ่มต้นจะลอง `@beta` ก่อน จากนั้น fallback ไปยังสเปก default/latest ที่บันทึกไว้หากไม่มี beta release ของ Plugin เวอร์ชันแน่นอนและแท็กที่ระบุชัดเจนจะยังคงถูกตรึงไว้กับตัวเลือกนั้น

  </Accordion>
  <Accordion title="การตรวจสอบเวอร์ชันและ integrity drift">
    ก่อนอัปเดต npm แบบสด OpenClaw จะตรวจสอบเวอร์ชันแพ็กเกจที่ติดตั้งกับเมตาดาต้ารีจิสทรี npm หากเวอร์ชันที่ติดตั้งและตัวตนอาร์ติแฟกต์ที่บันทึกไว้ตรงกับเป้าหมายที่ resolve แล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน `openclaw.json` ใหม่

    เมื่อมีแฮช integrity ที่เก็บไว้และแฮชอาร์ติแฟกต์ที่ดึงมาเปลี่ยนไป OpenClaw จะถือว่านั่นเป็น npm artifact drift คำสั่ง `openclaw plugins update` แบบโต้ตอบจะแสดงแฮชที่คาดหวังและแฮชจริง และขอการยืนยันก่อนดำเนินการต่อ ตัวช่วยอัปเดตแบบไม่โต้ตอบจะล้มเหลวแบบปิด เว้นแต่ผู้เรียกจะระบุนโยบายการดำเนินการต่ออย่างชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install บน update">
    `--dangerously-force-unsafe-install` ยังใช้ได้บน `plugins update` เป็น override ฉุกเฉินสำหรับ false positive ของการสแกนโค้ดอันตรายในตัวระหว่างการอัปเดต Plugin แต่ยังไม่ข้ามการบล็อกตามนโยบาย `before_install` ของ Plugin หรือการบล็อกเมื่อสแกนล้มเหลว และใช้ได้เฉพาะกับการอัปเดต Plugin ไม่ใช่การอัปเดต hook-pack
  </Accordion>
</AccordionGroup>

### ตรวจสอบ

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect แสดง identity, สถานะการโหลด, แหล่งที่มา, ความสามารถของ manifest, แฟล็กนโยบาย, diagnostics, เมตาดาต้าการติดตั้ง, ความสามารถของบันเดิล และการรองรับเซิร์ฟเวอร์ MCP หรือ LSP ที่ตรวจพบ โดยค่าเริ่มต้นจะไม่นำเข้า runtime ของ Plugin เพิ่ม `--runtime` เพื่อโหลดโมดูล Plugin และรวม hook, tool, command, service, เมธอด gateway และ route HTTP ที่ลงทะเบียนไว้ การตรวจสอบ runtime รายงาน dependency ของ Plugin ที่ขาดหายโดยตรง; การติดตั้งและการซ่อมยังอยู่ใน `openclaw plugins install`, `openclaw plugins update` และ `openclaw doctor --fix`

คำสั่ง CLI ที่ Plugin เป็นเจ้าของมักติดตั้งเป็นกลุ่มคำสั่ง `openclaw` ระดับรูท แต่ Plugin อาจลงทะเบียนคำสั่งซ้อนใต้ parent หลัก เช่น `openclaw nodes` ได้เช่นกัน หลังจาก `inspect --runtime` แสดงคำสั่งใต้ `cliCommands` ให้รันที่พาธที่ระบุไว้; ตัวอย่างเช่น Plugin ที่ลงทะเบียน `demo-git` สามารถตรวจสอบได้ด้วย `openclaw demo-git ping`

Plugin แต่ละตัวถูกจัดประเภทตามสิ่งที่มันลงทะเบียนจริงใน runtime:

- **plain-capability** — ประเภท capability หนึ่งประเภท (เช่น Plugin ที่เป็น provider-only)
- **hybrid-capability** — ประเภท capability หลายประเภท (เช่น ข้อความ + เสียงพูด + รูปภาพ)
- **hook-only** — เฉพาะ hooks เท่านั้น ไม่มี capabilities หรือ surfaces
- **non-capability** — เครื่องมือ/คำสั่ง/บริการ แต่ไม่มี capabilities

ดู [รูปแบบของ Plugin](/th/plugins/architecture#plugin-shapes) สำหรับรายละเอียดเพิ่มเติมเกี่ยวกับโมเดล capability

<Note>
แฟล็ก `--json` จะแสดงรายงานที่เครื่องอ่านได้ เหมาะสำหรับการเขียนสคริปต์และการตรวจสอบ `inspect --all` จะแสดงตารางทั้ง fleet พร้อมคอลัมน์ shape, capability kinds, compatibility notices, bundle capabilities และสรุป hook `info` เป็น alias ของ `inspect`
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` รายงานข้อผิดพลาดในการโหลด Plugin, การวินิจฉัย manifest/discovery และ compatibility notices เมื่อทุกอย่างเรียบร้อย จะพิมพ์ `No plugin issues detected.`

หาก Plugin ที่กำหนดค่าไว้มีอยู่บนดิสก์แต่ถูกบล็อกโดยการตรวจสอบ path-safety ของ loader การตรวจสอบ config จะคงรายการ Plugin ไว้และรายงานเป็น `present but blocked` ให้แก้การวินิจฉัย blocked-plugin ก่อนหน้า เช่น ความเป็นเจ้าของ path หรือสิทธิ์แบบ world-writable แทนการลบ config `plugins.entries.<id>` หรือ `plugins.allow`

สำหรับความล้มเหลวด้านรูปแบบโมดูล เช่น export `register`/`activate` หายไป ให้รันซ้ำพร้อม `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุป export-shape แบบย่อในผลลัพธ์การวินิจฉัย

### รีจิสทรี

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

รีจิสทรี Plugin ภายในเครื่องคือ cold read model ที่ OpenClaw เก็บถาวรสำหรับตัวตนของ Plugin ที่ติดตั้ง การเปิดใช้งาน เมตาดาต้าแหล่งที่มา และความเป็นเจ้าของ contribution การเริ่มต้นตามปกติ การค้นหาเจ้าของ provider การจัดประเภทการตั้งค่า channel และ inventory ของ Plugin สามารถอ่านได้โดยไม่ต้องนำเข้าโมดูล runtime ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่ารีจิสทรีที่เก็บถาวรมีอยู่ เป็นปัจจุบัน หรือ stale ใช้ `--refresh` เพื่อสร้างใหม่จากดัชนี Plugin ที่เก็บถาวร นโยบาย config และเมตาดาต้า manifest/package นี่คือเส้นทางซ่อมแซม ไม่ใช่เส้นทางเปิดใช้งาน runtime

`openclaw doctor --fix` ยังซ่อมแซม drift ของ managed npm ที่อยู่ใกล้รีจิสทรีด้วย: หากแพ็กเกจ `@openclaw/*` ที่ orphaned หรือ recovered ภายใต้ราก npm ของ managed Plugin ไป shadow Plugin ที่ bundled อยู่ doctor จะลบแพ็กเกจ stale นั้นและสร้างรีจิสทรีใหม่ เพื่อให้การเริ่มต้นตรวจสอบกับ bundled manifest

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็นสวิตช์ความเข้ากันได้แบบ break-glass ที่เลิกใช้แล้วสำหรับความล้มเหลวในการอ่านรีจิสทรี ควรใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix`; env fallback มีไว้สำหรับการกู้คืนการเริ่มต้นฉุกเฉินเท่านั้นระหว่างที่ migration กำลังทยอยใช้งาน
</Warning>

### มาร์เก็ตเพลซ

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

รายการมาร์เก็ตเพลซยอมรับ path มาร์เก็ตเพลซภายในเครื่อง, path ของ `marketplace.json`, shorthand ของ GitHub เช่น `owner/repo`, URL repo ของ GitHub หรือ URL git `--json` จะพิมพ์ป้ายกำกับแหล่งที่มาที่ resolve แล้ว พร้อม manifest มาร์เก็ตเพลซและรายการ Plugin ที่ parse แล้ว

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Plugin จากชุมชน](/th/plugins/community)
