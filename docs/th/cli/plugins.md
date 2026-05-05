---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือบันเดิลที่เข้ากันได้
    - คุณต้องการดีบักความล้มเหลวในการโหลด Plugin
sidebarTitle: Plugins
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-05T01:44:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24d274f33213231eaed48ac848a9266802a2179ba0311ab18462ad783219095a
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Plugin ของ Gateway, hook pack และ bundle ที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="ระบบ Plugin" href="/th/tools/plugin">
    คู่มือผู้ใช้ปลายทางสำหรับการติดตั้ง เปิดใช้งาน และแก้ปัญหา Plugin
  </Card>
  <Card title="จัดการ Plugin" href="/th/plugins/manage-plugins">
    ตัวอย่างแบบรวดเร็วสำหรับการติดตั้ง แสดงรายการ อัปเดต ถอนการติดตั้ง และเผยแพร่
  </Card>
  <Card title="bundle ของ Plugin" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของ bundle
  </Card>
  <Card title="manifest ของ Plugin" href="/th/plugins/manifest">
    ฟิลด์ของ manifest และ schema การกำหนดค่า
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
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

สำหรับการตรวจสอบการติดตั้ง ตรวจสอบ ถอนการติดตั้ง หรือรีเฟรช registry ที่ช้า ให้รันคำสั่งพร้อม `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` trace จะเขียนเวลาของแต่ละเฟสไปยัง stderr และคงเอาต์พุต JSON ให้ parse ได้ ดู [การดีบัก](/th/help/debugging#plugin-lifecycle-trace)

<Note>
Plugin ที่ bundle มาพร้อมกับ OpenClaw จะมาพร้อมกับ OpenClaw บางรายการเปิดใช้งานตามค่าเริ่มต้น (เช่น provider โมเดลที่ bundle มา, provider เสียงพูดที่ bundle มา และ browser Plugin ที่ bundle มา); รายการอื่นต้องใช้ `plugins enable`

Plugin แบบ native ของ OpenClaw ต้องมาพร้อม `openclaw.plugin.json` ที่มี JSON Schema แบบ inline (`configSchema` แม้จะว่างเปล่า) bundle ที่เข้ากันได้จะใช้ manifest ของ bundle ของตนเองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุต list/info แบบ verbose จะแสดง subtype ของ bundle ด้วย (`codex`, `claude` หรือ `cursor`) พร้อมความสามารถของ bundle ที่ตรวจพบ
</Note>

### ติดตั้ง

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
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
ชื่อ package เปล่าจะติดตั้งจาก npm ตามค่าเริ่มต้นในช่วงเปลี่ยนผ่านการเปิดตัว ใช้ `clawhub:<package>` สำหรับ ClawHub ให้ปฏิบัติต่อการติดตั้ง Plugin เหมือนการรันโค้ด แนะนำให้ใช้เวอร์ชันที่ pin ไว้
</Warning>

`plugins search` ค้นหา package ของ Plugin ที่ติดตั้งได้จาก ClawHub และพิมพ์ชื่อ package ที่พร้อมติดตั้ง โดยค้นหา package แบบ code-plugin และ bundle-plugin ไม่ใช่ Skills ใช้ `openclaw skills search` สำหรับ Skills บน ClawHub

<Note>
ClawHub เป็นพื้นผิวหลักสำหรับการกระจายและการค้นพบ Plugin ส่วนใหญ่ npm ยังคงเป็น fallback ที่รองรับและเป็นเส้นทางติดตั้งโดยตรง package Plugin ของ `@openclaw/*` ที่ OpenClaw เป็นเจ้าของถูกเผยแพร่บน npm อีกครั้ง ดูรายการปัจจุบันได้ที่ [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) หรือ [คลังรายการ Plugin](/th/plugins/plugin-inventory) การติดตั้งแบบ stable ใช้ `latest` การติดตั้งและอัปเดตบนช่อง beta จะเลือกใช้ npm dist-tag `beta` เมื่อ tag นั้นพร้อมใช้งาน แล้วจึง fallback ไปที่ `latest`
</Note>

<AccordionGroup>
  <Accordion title="config include และการซ่อมแซม config ที่ไม่ถูกต้อง">
    หากส่วน `plugins` ของคุณอิงกับ `$include` แบบไฟล์เดียว `plugins install/update/enable/disable/uninstall` จะเขียนทะลุไปยังไฟล์ที่ include นั้น และปล่อย `openclaw.json` ไว้โดยไม่แตะต้อง root include, include array และ include ที่มี sibling override จะ fail closed แทนการ flatten ดู [config include](/th/gateway/configuration) สำหรับรูปแบบที่รองรับ

    หาก config ไม่ถูกต้องระหว่างติดตั้ง โดยปกติ `plugins install` จะ fail closed และแจ้งให้คุณรัน `openclaw doctor --fix` ก่อน ระหว่างการเริ่มต้น Gateway และ hot reload, config ของ Plugin ที่ไม่ถูกต้องจะ fail closed เช่นเดียวกับ config ที่ไม่ถูกต้องอื่นๆ; `openclaw doctor --fix` สามารถกักกันรายการ Plugin ที่ไม่ถูกต้องได้ ข้อยกเว้นเดียวที่เอกสารระบุไว้ในเวลาติดตั้งคือเส้นทาง recovery แบบแคบสำหรับ bundled-plugin ที่ Plugin เลือกเข้าร่วม `openclaw.install.allowInvalidConfigRecovery` อย่างชัดเจน

  </Accordion>
  <Accordion title="--force และการติดตั้งซ้ำเทียบกับการอัปเดต">
    `--force` ใช้ target การติดตั้งเดิมซ้ำและเขียนทับ Plugin หรือ hook pack ที่ติดตั้งไว้แล้ว ณ ที่เดิม ใช้เมื่อคุณตั้งใจติดตั้ง id เดิมซ้ำจาก local path, archive, package ClawHub หรือ artifact npm ใหม่ สำหรับการอัปเกรดตามปกติของ npm Plugin ที่ติดตามอยู่แล้ว แนะนำให้ใช้ `openclaw plugins update <id-or-npm-spec>`

    หากคุณรัน `plugins install` สำหรับ id ของ Plugin ที่ติดตั้งอยู่แล้ว OpenClaw จะหยุดและชี้ให้คุณใช้ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดปกติ หรือใช้ `plugins install <package> --force` เมื่อคุณต้องการเขียนทับการติดตั้งปัจจุบันจากแหล่งอื่นจริงๆ

  </Accordion>
  <Accordion title="ขอบเขตของ --pin">
    `--pin` ใช้กับการติดตั้ง npm เท่านั้น ไม่รองรับกับการติดตั้ง `git:`; ใช้ git ref ที่ชัดเจน เช่น `git:github.com/acme/plugin@v1.2.3` เมื่อคุณต้องการแหล่งที่ pin ไว้ ไม่รองรับกับ `--marketplace` เพราะการติดตั้ง marketplace จะเก็บ metadata แหล่งที่มาของ marketplace แทน npm spec
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` เป็นตัวเลือกฉุกเฉินสำหรับ false positive ในตัวสแกน dangerous-code ที่มีมาให้ในตัว มันอนุญาตให้ติดตั้งต่อได้แม้ตัวสแกนในตัวรายงานผล `critical` แต่ **ไม่** ข้ามการบล็อกตามนโยบาย hook `before_install` ของ Plugin และ **ไม่** ข้ามความล้มเหลวของการสแกน

    flag ของ CLI นี้ใช้กับ flow ติดตั้ง/อัปเดต Plugin การติดตั้ง dependency ของ skill ที่หนุนด้วย Gateway ใช้ request override ที่ตรงกันคือ `dangerouslyForceUnsafeInstall` ขณะที่ `openclaw skills install` ยังคงเป็น flow ดาวน์โหลด/ติดตั้ง Skills ของ ClawHub ที่แยกต่างหาก

    หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกบล็อกโดยการสแกนของ registry ให้ใช้ขั้นตอนสำหรับ publisher ใน [ClawHub](/th/tools/clawhub)

  </Accordion>
  <Accordion title="hook pack และ npm spec">
    `plugins install` ยังเป็นพื้นผิวติดตั้งสำหรับ hook pack ที่เปิดเผย `openclaw.hooks` ใน `package.json` ด้วย ใช้ `openclaw hooks` สำหรับการมองเห็น hook แบบกรองแล้วและการเปิดใช้งานราย hook ไม่ใช่การติดตั้ง package

    npm spec เป็นแบบ **registry-only** (ชื่อ package + **exact version** หรือ **dist-tag** แบบไม่บังคับ) spec แบบ Git/URL/file และช่วง semver จะถูกปฏิเสธ การติดตั้ง dependency จะรันแบบ project-local พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้ shell ของคุณจะมีการตั้งค่า npm install แบบ global อยู่ก็ตาม

    ใช้ `npm:<package>` เมื่อคุณต้องการทำให้การ resolve ผ่าน npm ชัดเจน spec package เปล่าก็ติดตั้งโดยตรงจาก npm เช่นกันในช่วงเปลี่ยนผ่านการเปิดตัว

    spec เปล่าและ `@latest` จะอยู่บน stable track เวอร์ชันแก้ไขแบบประทับวันที่ของ OpenClaw เช่น `2026.5.3-1` ถือเป็น stable release สำหรับการตรวจสอบนี้ หาก npm resolve รายการใดรายการหนึ่งไปเป็น prerelease OpenClaw จะหยุดและขอให้คุณ opt in อย่างชัดเจนด้วย prerelease tag เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease แบบ exact เช่น `@1.2.3-beta.4`

    หาก spec ติดตั้งเปล่าตรงกับ id ของ Plugin อย่างเป็นทางการ (เช่น `diffs`) OpenClaw จะติดตั้งรายการ catalog โดยตรง หากต้องการติดตั้ง package npm ที่มีชื่อเดียวกัน ให้ใช้ spec แบบ scoped ที่ชัดเจน (เช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="repository Git">
    ใช้ `git:<repo>` เพื่อติดตั้งโดยตรงจาก repository Git รูปแบบที่รองรับรวมถึง `git:github.com/owner/repo`, `git:owner/repo`, URL clone แบบเต็ม `https://`, `ssh://`, `git://`, `file://` และ `git@host:owner/repo.git` เพิ่ม `@<ref>` หรือ `#<ref>` เพื่อ checkout branch, tag หรือ commit ก่อนติดตั้ง

    การติดตั้ง Git จะ clone ไปยัง directory ชั่วคราว checkout ref ที่ขอเมื่อมี แล้วใช้ตัวติดตั้ง directory Plugin ตามปกติ นั่นหมายความว่า validation ของ manifest, การสแกน dangerous-code, งานติดตั้งของ package-manager และ record การติดตั้งจะทำงานเหมือนการติดตั้ง npm record ของการติดตั้ง Git จะรวม URL/ref แหล่งที่มา พร้อม commit ที่ resolve แล้ว เพื่อให้ `openclaw plugins update` สามารถ re-resolve แหล่งนั้นได้ในภายหลัง

    หลังติดตั้งจาก Git ให้ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อตรวจสอบ runtime registration เช่น method ของ gateway และคำสั่ง CLI หาก Plugin ลงทะเบียน root ของ CLI ด้วย `api.registerCli` ให้เรียกใช้คำสั่งนั้นโดยตรงผ่าน root CLI ของ OpenClaw เช่น `openclaw demo-plugin ping`

  </Accordion>
  <Accordion title="archive">
    archive ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` archive ของ Plugin แบบ native ของ OpenClaw ต้องมี `openclaw.plugin.json` ที่ถูกต้องอยู่ที่ root ของ Plugin หลังแตกไฟล์; archive ที่มีเฉพาะ `package.json` จะถูกปฏิเสธก่อนที่ OpenClaw จะเขียน record การติดตั้ง

    รองรับการติดตั้ง marketplace ของ Claude ด้วย

  </Accordion>
</AccordionGroup>

การติดตั้ง ClawHub ใช้ locator `clawhub:<package>` ที่ชัดเจน:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

spec ของ Plugin ที่ปลอดภัยสำหรับ npm แบบเปล่าจะติดตั้งจาก npm ตามค่าเริ่มต้นในช่วงเปลี่ยนผ่านการเปิดตัว:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อทำให้การ resolve แบบ npm-only ชัดเจน:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw ตรวจสอบความเข้ากันได้ของ plugin API / gateway ขั้นต่ำที่ประกาศไว้ก่อนติดตั้ง เมื่อเวอร์ชัน ClawHub ที่เลือกเผยแพร่ artifact แบบ ClawPack, OpenClaw จะดาวน์โหลด npm-pack `.tgz` แบบระบุเวอร์ชัน ตรวจสอบ header digest ของ ClawHub และ digest ของ artifact แล้วติดตั้งผ่านเส้นทาง archive ปกติ เวอร์ชัน ClawHub ที่เก่ากว่าซึ่งไม่มี metadata ของ ClawPack ยังคงติดตั้งผ่านเส้นทางตรวจสอบ archive package แบบ legacy record การติดตั้งจะเก็บ metadata แหล่งที่มาของ ClawHub, ชนิด artifact, integrity ของ npm, shasum ของ npm, ชื่อ tarball และข้อเท็จจริงของ digest ClawPack สำหรับการอัปเดตภายหลัง
การติดตั้ง ClawHub แบบไม่ระบุเวอร์ชันจะเก็บ spec ที่บันทึกไว้แบบไม่ระบุเวอร์ชัน เพื่อให้ `openclaw plugins update` ติดตาม release ใหม่ของ ClawHub ได้; selector แบบระบุเวอร์ชันหรือ tag อย่าง `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` จะยังคง pin อยู่กับ selector นั้น

#### shorthand ของ marketplace

ใช้ shorthand `plugin@marketplace` เมื่อชื่อ marketplace มีอยู่ใน cache registry local ของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

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
    - ชื่อ Marketplace ที่ Claude รู้จักจาก `~/.claude/plugins/known_marketplaces.json`
    - รูท Marketplace ภายในเครื่อง หรือพาธ `marketplace.json`
    - ชวเลขรีโป GitHub เช่น `owner/repo`
    - URL รีโป GitHub เช่น `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="กฎของ Marketplace ระยะไกล">
    สำหรับ Marketplace ระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องอยู่ภายในรีโป Marketplace ที่โคลนมา OpenClaw ยอมรับแหล่งที่มาแบบพาธสัมพัทธ์จากรีโปนั้น และปฏิเสธแหล่งที่มา Plugin แบบ HTTP(S), พาธสัมบูรณ์, git, GitHub และแหล่งที่มา Plugin อื่นที่ไม่ใช่พาธจาก manifest ระยะไกล
  </Tab>
</Tabs>

สำหรับพาธและไฟล์เก็บถาวรภายในเครื่อง OpenClaw จะตรวจหาโดยอัตโนมัติ:

- Plugin แบบเนทีฟของ OpenClaw (`openclaw.plugin.json`)
- บันเดิลที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- บันเดิลที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือเลย์เอาต์คอมโพเนนต์ Claude เริ่มต้น)
- บันเดิลที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

<Note>
บันเดิลที่เข้ากันได้จะติดตั้งลงในรูท Plugin ปกติ และเข้าร่วมโฟลว์ list/info/enable/disable เดียวกัน ปัจจุบันรองรับ Skills ของบันเดิล, command-skills ของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` / `lspServers` ที่ประกาศใน manifest ของ Claude, command-skills ของ Cursor และไดเรกทอรี hook ของ Codex ที่เข้ากันได้ ส่วนความสามารถอื่นของบันเดิลที่ตรวจพบจะแสดงใน diagnostics/info แต่ยังไม่ได้เชื่อมเข้ากับการทำงาน runtime
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
  แสดงเฉพาะ Plugin ที่เปิดใช้งานแล้ว
</ParamField>
<ParamField path="--verbose" type="boolean">
  เปลี่ยนจากมุมมองตารางเป็นบรรทัดรายละเอียดราย Plugin พร้อมเมทาดาทา source/origin/version/activation
</ParamField>
<ParamField path="--json" type="boolean">
  inventory ที่อ่านได้ด้วยเครื่อง พร้อม registry diagnostics และสถานะการติดตั้ง dependency ของแพ็กเกจ
</ParamField>

<Note>
`plugins list` อ่าน registry Plugin ภายในเครื่องที่บันทึกไว้ก่อน โดยมี fallback ที่สร้างจาก manifest เท่านั้นเมื่อ registry หายไปหรือไม่ถูกต้อง คำสั่งนี้มีประโยชน์สำหรับตรวจว่า Plugin ติดตั้งแล้ว เปิดใช้งานแล้ว และมองเห็นได้สำหรับการวางแผน cold startup หรือไม่ แต่ไม่ใช่การตรวจ runtime สดของกระบวนการ Gateway ที่กำลังทำงานอยู่ หลังจากเปลี่ยนโค้ด Plugin, enablement, นโยบาย hook หรือ `plugins.load.paths` ให้รีสตาร์ท Gateway ที่ให้บริการ channel ก่อนคาดหวังให้โค้ดหรือ hook ใหม่ของ `register(api)` ทำงาน สำหรับการปรับใช้แบบระยะไกล/คอนเทนเนอร์ ให้ตรวจยืนยันว่าคุณกำลังรีสตาร์ท child `openclaw gateway run` ตัวจริง ไม่ใช่แค่กระบวนการ wrapper

`plugins list --json` รวม `dependencyStatus` ของแต่ละ Plugin จาก `package.json`
`dependencies` และ `optionalDependencies` OpenClaw ตรวจว่าชื่อแพ็กเกจเหล่านั้นมีอยู่ตามพาธ lookup `node_modules` ปกติของ Node สำหรับ Plugin นั้นหรือไม่ โดยจะไม่ import โค้ด runtime ของ Plugin, ไม่เรียกใช้ package manager และไม่ซ่อมแซม dependency ที่ขาดหาย
</Note>

`plugins search` เป็นการค้นหาแคตตาล็อก ClawHub ระยะไกล ไม่ตรวจสอบสถานะภายในเครื่อง
ไม่แก้ไข config, ไม่ติดตั้งแพ็กเกจ และไม่โหลดโค้ด runtime ของ Plugin ผลการค้นหา
ประกอบด้วยชื่อแพ็กเกจ ClawHub, family, channel, version, summary และ
คำแนะนำการติดตั้ง เช่น `openclaw plugins install clawhub:<package>`

สำหรับงาน Plugin ที่บันเดิลมาในอิมเมจ Docker แบบแพ็กเกจ ให้ bind-mount ไดเรกทอรี
ซอร์สของ Plugin ทับพาธซอร์สแบบแพ็กเกจที่ตรงกัน เช่น
`/app/extensions/synology-chat` OpenClaw จะค้นพบ overlay ซอร์สที่ mount ไว้นั้น
ก่อน `/app/dist/extensions/synology-chat`; ไดเรกทอรีซอร์สที่คัดลอกมาเฉย ๆ
จะไม่ทำงาน เพื่อให้การติดตั้งแบบแพ็กเกจปกติยังใช้ dist ที่คอมไพล์แล้ว

สำหรับการดีบัก hook runtime:

- `openclaw plugins inspect <id> --runtime --json` แสดง hook ที่ลงทะเบียนแล้วและ diagnostics จากรอบการตรวจสอบที่โหลดโมดูลแล้ว การตรวจสอบ runtime ไม่ติดตั้ง dependency; ใช้ `openclaw doctor --fix` เพื่อล้างสถานะ dependency แบบ legacy หรือกู้คืน Plugin ที่ดาวน์โหลดได้ซึ่งขาดหายและถูกอ้างอิงโดย config
- `openclaw gateway status --deep --require-rpc` ยืนยัน Gateway ที่เข้าถึงได้, service/process hints, พาธ config และสุขภาพ RPC
- hook การสนทนาที่ไม่ได้บันเดิล (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรีภายในเครื่อง (เพิ่มไปยัง `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
ไม่รองรับ `--force` ร่วมกับ `--link` เพราะการติดตั้งแบบ linked จะใช้พาธซอร์สซ้ำแทนการคัดลอกทับเป้าหมายการติดตั้งที่จัดการอยู่

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึก spec แบบ exact ที่ resolve ได้ (`name@version`) ในดัชนี Plugin ที่จัดการอยู่ โดยยังคงพฤติกรรมเริ่มต้นแบบไม่ pin ไว้
</Note>

### ดัชนี Plugin

เมทาดาทาการติดตั้ง Plugin เป็นสถานะที่เครื่องจัดการ ไม่ใช่ config ของผู้ใช้ การติดตั้งและอัปเดตจะเขียนไปที่ `plugins/installs.json` ใต้ไดเรกทอรีสถานะ OpenClaw ที่ใช้งานอยู่ แผนที่ `installRecords` ระดับบนสุดเป็นแหล่งข้อมูลถาวรของเมทาดาทาการติดตั้ง รวมถึงระเบียนสำหรับ manifest ของ Plugin ที่เสียหรือขาดหาย อาร์เรย์ `plugins` คือแคช cold registry ที่สร้างจาก manifest ไฟล์นี้มีคำเตือนห้ามแก้ไข และถูกใช้โดย `openclaw plugins update`, การถอนการติดตั้ง, diagnostics และ cold plugin registry

เมื่อ OpenClaw พบระเบียน `plugins.installs` แบบ legacy ที่จัดส่งมาใน config จะย้ายระเบียนเหล่านั้นเข้าสู่ดัชนี Plugin และลบคีย์ config ออก หากการเขียนอย่างใดอย่างหนึ่งล้มเหลว ระเบียน config จะถูกเก็บไว้เพื่อไม่ให้เมทาดาทาการติดตั้งสูญหาย

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` ลบระเบียน Plugin ออกจาก `plugins.entries`, ดัชนี Plugin ที่บันทึกไว้, รายการอนุญาต/ปฏิเสธ Plugin และรายการ linked `plugins.load.paths` เมื่อเกี่ยวข้อง เว้นแต่ตั้งค่า `--keep-files` การถอนการติดตั้งจะลบไดเรกทอรี managed install ที่ติดตามไว้ด้วยเมื่ออยู่ภายในรูทส่วนขยาย Plugin ของ OpenClaw สำหรับ Plugin หน่วยความจำที่ใช้งานอยู่ slot หน่วยความจำจะรีเซ็ตเป็น `memory-core`

<Note>
รองรับ `--keep-config` ในฐานะ alias ที่เลิกใช้แล้วของ `--keep-files`
</Note>

### อัปเดต

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

การอัปเดตใช้กับการติดตั้ง Plugin ที่ติดตามไว้ในดัชนี Plugin ที่จัดการอยู่ และการติดตั้ง hook-pack ที่ติดตามไว้ใน `hooks.internal.installs`

<AccordionGroup>
  <Accordion title="การ resolve id ของ Plugin เทียบกับ npm spec">
    เมื่อคุณส่ง id ของ Plugin OpenClaw จะใช้ install spec ที่บันทึกไว้สำหรับ Plugin นั้นซ้ำ นั่นหมายความว่า dist-tag ที่เคยจัดเก็บไว้ เช่น `@beta` และเวอร์ชันแบบ exact ที่ pin ไว้ จะยังถูกใช้ต่อไปในการรัน `update <id>` ครั้งถัดไป

    สำหรับการติดตั้ง npm คุณยังสามารถส่ง npm package spec แบบชัดเจนพร้อม dist-tag หรือเวอร์ชัน exact ได้ด้วย OpenClaw จะ resolve ชื่อแพ็กเกจนั้นกลับไปยังระเบียน Plugin ที่ติดตามไว้ อัปเดต Plugin ที่ติดตั้งนั้น และบันทึก npm spec ใหม่สำหรับการอัปเดตตาม id ในอนาคต

    การส่งชื่อแพ็กเกจ npm โดยไม่มีเวอร์ชันหรือแท็กก็จะ resolve กลับไปยังระเบียน Plugin ที่ติดตามไว้เช่นกัน ใช้วิธีนี้เมื่อ Plugin ถูก pin ไว้กับเวอร์ชัน exact และคุณต้องการย้ายกลับไปยังสาย release เริ่มต้นของ registry

  </Accordion>
  <Accordion title="การอัปเดตช่อง beta">
    `openclaw plugins update` ใช้ spec ของ Plugin ที่ติดตามไว้ซ้ำ เว้นแต่คุณจะส่ง spec ใหม่ `openclaw update` ยังรู้จักช่องอัปเดต OpenClaw ที่ใช้งานอยู่ด้วย: บนช่อง beta ระเบียน Plugin จาก npm และ ClawHub ในสายเริ่มต้นจะลอง `@beta` ก่อน แล้ว fallback ไปยัง spec default/latest ที่บันทึกไว้หากไม่มี release beta ของ Plugin เวอร์ชัน exact และแท็กที่ระบุชัดเจนจะยังคง pin อยู่กับ selector นั้น

  </Accordion>
  <Accordion title="การตรวจเวอร์ชันและความคลาดเคลื่อนของ integrity">
    ก่อนการอัปเดต npm แบบสด OpenClaw ตรวจเวอร์ชันแพ็กเกจที่ติดตั้งเทียบกับเมทาดาทา npm registry หากเวอร์ชันที่ติดตั้งและ identity ของ artifact ที่บันทึกไว้ตรงกับเป้าหมายที่ resolve แล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด ไม่ติดตั้งใหม่ และไม่เขียน `openclaw.json` ใหม่

    เมื่อมี hash integrity ที่จัดเก็บไว้และ hash ของ artifact ที่ดึงมาเปลี่ยนไป OpenClaw จะถือว่าเป็นความคลาดเคลื่อนของ npm artifact คำสั่ง `openclaw plugins update` แบบโต้ตอบจะแสดง hash ที่คาดหวังและ hash จริง แล้วขอการยืนยันก่อนดำเนินการต่อ ตัวช่วยอัปเดตแบบไม่โต้ตอบจะ fail closed เว้นแต่ caller จะระบุนโยบายการดำเนินการต่ออย่างชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install บน update">
    `--dangerously-force-unsafe-install` มีให้ใช้บน `plugins update` เช่นกันในฐานะ override ฉุกเฉินสำหรับ false positive จากการสแกน dangerous-code ที่มีในตัวระหว่างการอัปเดต Plugin แต่ยังไม่ข้ามการบล็อกตามนโยบาย `before_install` ของ Plugin หรือการบล็อกเมื่อการสแกนล้มเหลว และใช้ได้เฉพาะกับการอัปเดต Plugin ไม่ใช่การอัปเดต hook-pack
  </Accordion>
</AccordionGroup>

### ตรวจสอบ

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect แสดง identity, load status, source, ความสามารถใน manifest, policy flags, diagnostics, เมทาดาทาการติดตั้ง, ความสามารถของบันเดิล และการรองรับเซิร์ฟเวอร์ MCP หรือ LSP ที่ตรวจพบ โดยค่าเริ่มต้นจะไม่ import runtime ของ Plugin เพิ่ม `--runtime` เพื่อโหลดโมดูล Plugin และรวม hook, tool, command, service, gateway method และ HTTP route ที่ลงทะเบียนไว้ การตรวจสอบ runtime รายงาน dependency ของ Plugin ที่ขาดหายโดยตรง; การติดตั้งและการซ่อมแซมยังอยู่ใน `openclaw plugins install`, `openclaw plugins update` และ `openclaw doctor --fix`

คำสั่ง CLI ที่ Plugin เป็นเจ้าของจะถูกติดตั้งเป็นกลุ่มคำสั่ง `openclaw` ระดับรูท หลังจาก `inspect --runtime` แสดงคำสั่งภายใต้ `cliCommands` แล้ว ให้รันเป็น `openclaw <command> ...`; ตัวอย่างเช่น Plugin ที่ลงทะเบียน `demo-git` สามารถตรวจยืนยันได้ด้วย `openclaw demo-git ping`

แต่ละ Plugin ถูกจัดประเภทตามสิ่งที่ลงทะเบียนจริงใน runtime:

- **plain-capability** — ความสามารถหนึ่งประเภท (เช่น Plugin เฉพาะ provider)
- **hybrid-capability** — ความสามารถหลายประเภท (เช่น text + speech + images)
- **hook-only** — มีเฉพาะ hook ไม่มีความสามารถหรือ surface
- **non-capability** — tools/commands/services แต่ไม่มีความสามารถ

ดู [รูปแบบ Plugin](/th/plugins/architecture#plugin-shapes) สำหรับรายละเอียดเพิ่มเติมเกี่ยวกับโมเดลความสามารถ

<Note>
แฟล็ก `--json` ส่งออกรายงานที่อ่านได้ด้วยเครื่อง เหมาะสำหรับ scripting และ auditing `inspect --all` แสดงตารางทั้ง fleet พร้อม shape, ชนิดของความสามารถ, compatibility notices, ความสามารถของบันเดิล และคอลัมน์สรุป hook `info` เป็น alias ของ `inspect`
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` รายงานข้อผิดพลาดการโหลด Plugin, diagnostics ของ manifest/discovery และ compatibility notices เมื่อทุกอย่างสะอาด จะแสดง `No plugin issues detected.`

หาก Plugin ที่ตั้งค่าไว้มีอยู่บนดิสก์แต่ถูกบล็อกโดยการตรวจ path-safety ของ loader การตรวจสอบ config จะเก็บรายการ Plugin ไว้และรายงานว่า `present but blocked` ให้แก้ diagnostic ของ Plugin ที่ถูกบล็อกก่อนหน้า เช่น ownership ของพาธหรือสิทธิ์แบบ world-writable แทนการลบ config `plugins.entries.<id>` หรือ `plugins.allow`

สำหรับความล้มเหลวด้านรูปทรงโมดูล เช่น export `register`/`activate` ที่ขาดหาย ให้รันซ้ำพร้อม `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุป export-shape แบบกะทัดรัดในผลลัพธ์ diagnostic

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

registry Plugin ภายในเครื่องคือโมเดลการอ่านแบบ cold ที่บันทึกไว้ของ OpenClaw สำหรับ identity ของ Plugin ที่ติดตั้ง, enablement, เมทาดาทา source และ ownership ของ contribution การเริ่มต้นปกติ, การ lookup เจ้าของ provider, การจัดประเภท channel setup และ inventory ของ Plugin สามารถอ่านได้โดยไม่ต้อง import โมดูล runtime ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่ารีจิสทรีที่คงอยู่มีอยู่ เป็นปัจจุบัน หรือเก่าแล้ว ใช้ `--refresh` เพื่อสร้างใหม่จากดัชนี Plugin ที่คงอยู่ นโยบายการกำหนดค่า และเมตาดาตา manifest/package นี่เป็นเส้นทางการซ่อมแซม ไม่ใช่เส้นทางการเปิดใช้งานระหว่างรันไทม์

`openclaw doctor --fix` ยังซ่อมแซมความคลาดเคลื่อนของ managed npm ที่อยู่ใกล้กับรีจิสทรีด้วย: หากแพ็กเกจ `@openclaw/*` ที่ถูกทิ้งไว้หรือกู้คืนมาใต้ managed plugin npm root ไปบดบัง Plugin ที่ bundled ไว้ doctor จะลบแพ็กเกจเก่านั้นและสร้างรีจิสทรีใหม่ เพื่อให้การเริ่มต้นตรวจสอบกับ manifest ที่ bundled ไว้

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็นสวิตช์ความเข้ากันได้แบบ break-glass ที่เลิกใช้แล้วสำหรับกรณีอ่านรีจิสทรีล้มเหลว แนะนำให้ใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix`; env fallback มีไว้เฉพาะสำหรับการกู้คืนการเริ่มต้นฉุกเฉินระหว่างที่การย้ายระบบกำลังทยอยใช้งาน
</Warning>

### ตลาดกลาง

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

รายการตลาดกลางรับพาธตลาดกลางในเครื่อง, พาธ `marketplace.json`, ชวเลข GitHub เช่น `owner/repo`, URL รีโพ GitHub หรือ URL git ได้ `--json` จะพิมพ์ป้ายกำกับแหล่งที่มาที่ resolve แล้ว พร้อมกับ manifest ของตลาดกลางและรายการ Plugin ที่แยกวิเคราะห์แล้ว

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [เอกสารอ้างอิง CLI](/th/cli)
- [Plugin ชุมชน](/th/plugins/community)
