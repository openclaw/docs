---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือบันเดิลที่เข้ากันได้
    - คุณต้องการดีบักความล้มเหลวในการโหลด Plugin
sidebarTitle: Plugins
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-02T20:42:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc046a04175c1b22f787920bf5ec28c24d0bb7d62eda4d9517da8f5dbac4c50
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Gateway plugins, hook packs และ bundles ที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="ระบบ Plugin" href="/th/tools/plugin">
    คู่มือสำหรับผู้ใช้ปลายทางในการติดตั้ง เปิดใช้งาน และแก้ไขปัญหา plugins
  </Card>
  <Card title="จัดการ plugins" href="/th/plugins/manage-plugins">
    ตัวอย่างแบบรวดเร็วสำหรับติดตั้ง แสดงรายการ อัปเดต ถอนการติดตั้ง และเผยแพร่
  </Card>
  <Card title="Plugin bundles" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของ Bundle
  </Card>
  <Card title="Plugin manifest" href="/th/plugins/manifest">
    ฟิลด์ Manifest และสคีมา config
  </Card>
  <Card title="ความปลอดภัย" href="/th/gateway/security">
    การเสริมความปลอดภัยสำหรับการติดตั้ง plugin
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

สำหรับการตรวจสอบการติดตั้ง การ inspect การถอนการติดตั้ง หรือการ refresh registry ที่ช้า ให้รันคำสั่งพร้อม `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` trace จะเขียนเวลาของแต่ละเฟสไปยัง stderr และยังคงทำให้เอาต์พุต JSON parse ได้ ดู [การดีบัก](/th/help/debugging#plugin-lifecycle-trace)

<Note>
plugins ที่ bundled มาพร้อมกับ OpenClaw บางรายการเปิดใช้งานโดยค่าเริ่มต้น (เช่น bundled model providers, bundled speech providers และ bundled browser plugin) ส่วนรายการอื่นต้องใช้ `plugins enable`

plugins แบบ native ของ OpenClaw ต้องจัดส่ง `openclaw.plugin.json` พร้อม JSON Schema แบบ inline (`configSchema` แม้จะว่างก็ตาม) ส่วน bundles ที่เข้ากันได้จะใช้ bundle manifests ของตนเองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุต verbose list/info ยังแสดง subtype ของ bundle (`codex`, `claude` หรือ `cursor`) พร้อมความสามารถของ bundle ที่ตรวจพบด้วย
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
ชื่อแพ็กเกจเปล่า ๆ จะติดตั้งจาก npm โดยค่าเริ่มต้นในช่วง launch cutover ใช้ `clawhub:<package>` สำหรับ ClawHub ให้ปฏิบัติต่อการติดตั้ง plugin เหมือนการรันโค้ด ควรใช้เวอร์ชันที่ pin ไว้
</Warning>

`plugins search` query ClawHub เพื่อหาแพ็กเกจ plugin ที่ติดตั้งได้ และพิมพ์ชื่อแพ็กเกจที่พร้อมติดตั้ง คำสั่งนี้ค้นหาแพ็กเกจ code-plugin และ bundle-plugin ไม่ใช่ skills ใช้ `openclaw skills search` สำหรับ ClawHub skills

<Note>
ClawHub เป็นพื้นผิวหลักสำหรับการเผยแพร่และค้นพบ plugins ส่วนใหญ่ Npm ยังคงเป็น fallback และเส้นทาง direct-install ที่รองรับ ระหว่างการย้ายไปยัง ClawHub, OpenClaw ยังจัดส่งแพ็กเกจ plugin `@openclaw/*` บางรายการที่ OpenClaw เป็นเจ้าของบน npm เวอร์ชันแพ็กเกจเหล่านั้นอาจตามหลังซอร์สที่ bundled ระหว่างรอบการปล่อย plugin หาก npm รายงานว่าแพ็กเกจ plugin ที่ OpenClaw เป็นเจ้าของถูก deprecated แสดงว่าเวอร์ชันที่เผยแพร่นั้นเป็น artifact ภายนอกเก่า ให้ใช้ plugin ที่ bundled มากับ OpenClaw ปัจจุบันหรือ checkout ในเครื่องจนกว่าแพ็กเกจ npm ใหม่กว่าจะถูกเผยแพร่
</Note>

<AccordionGroup>
  <Accordion title="Config includes และการกู้คืน invalid-config">
    หากส่วน `plugins` ของคุณอิงกับ `$include` แบบไฟล์เดียว `plugins install/update/enable/disable/uninstall` จะเขียนทะลุไปยังไฟล์ที่ include นั้น และปล่อย `openclaw.json` ไว้ตามเดิม Root includes, include arrays และ includes ที่มี sibling overrides จะ fail closed แทนการ flatten ดู [Config includes](/th/gateway/configuration) สำหรับรูปแบบที่รองรับ

    หาก config ไม่ถูกต้องระหว่างการติดตั้ง โดยปกติ `plugins install` จะ fail closed และบอกให้คุณรัน `openclaw doctor --fix` ก่อน ระหว่างการเริ่มต้น Gateway, config ที่ไม่ถูกต้องของ plugin หนึ่งรายการจะถูกแยกให้อยู่กับ plugin นั้น เพื่อให้ channels และ plugins อื่นทำงานต่อได้; `openclaw doctor --fix` สามารถ quarantine รายการ plugin ที่ไม่ถูกต้องได้ ข้อยกเว้นที่มีเอกสารระบุไว้เพียงอย่างเดียวในช่วง install-time คือเส้นทางการกู้คืนแบบแคบสำหรับ bundled-plugin สำหรับ plugins ที่ opt in เข้ากับ `openclaw.install.allowInvalidConfigRecovery` อย่างชัดเจน

  </Accordion>
  <Accordion title="--force และการ reinstall เทียบกับ update">
    `--force` ใช้เป้าหมายการติดตั้งเดิมซ้ำ และเขียนทับ plugin หรือ hook pack ที่ติดตั้งอยู่แล้ว ณ ตำแหน่งเดิม ใช้เมื่อคุณตั้งใจ reinstall id เดิมจาก local path, archive, แพ็กเกจ ClawHub หรือ artifact npm ใหม่ สำหรับการอัปเกรดตามปกติของ npm plugin ที่ติดตามอยู่แล้ว ควรใช้ `openclaw plugins update <id-or-npm-spec>`

    หากคุณรัน `plugins install` สำหรับ plugin id ที่ติดตั้งแล้ว OpenClaw จะหยุดและชี้ให้คุณใช้ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดปกติ หรือใช้ `plugins install <package> --force` เมื่อคุณต้องการเขียนทับการติดตั้งปัจจุบันจากแหล่งอื่นจริง ๆ

  </Accordion>
  <Accordion title="ขอบเขตของ --pin">
    `--pin` ใช้กับการติดตั้ง npm เท่านั้น ไม่รองรับกับการติดตั้ง `git:`; ใช้ git ref ที่ชัดเจน เช่น `git:github.com/acme/plugin@v1.2.3` เมื่อคุณต้องการซอร์สที่ pin ไว้ ไม่รองรับกับ `--marketplace` เพราะ marketplace installs จะเก็บ metadata ของแหล่ง marketplace แทน npm spec
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` เป็นตัวเลือก break-glass สำหรับ false positives ใน dangerous-code scanner ที่มีในตัว ตัวเลือกนี้อนุญาตให้การติดตั้งดำเนินต่อได้แม้ scanner ในตัวจะรายงานผล `critical` แต่จะ **ไม่** ข้ามบล็อกนโยบาย hook `before_install` ของ plugin และจะ **ไม่** ข้ามความล้มเหลวของการสแกน

    CLI flag นี้ใช้กับ flows การติดตั้ง/อัปเดต plugin การติดตั้ง skill dependency ที่อิงกับ Gateway ใช้ request override ที่ตรงกันคือ `dangerouslyForceUnsafeInstall` ขณะที่ `openclaw skills install` ยังคงเป็น flow ดาวน์โหลด/ติดตั้ง skill ของ ClawHub แยกต่างหาก

    หาก plugin ที่คุณเผยแพร่บน ClawHub ถูกบล็อกโดยการสแกน registry ให้ใช้ขั้นตอนสำหรับผู้เผยแพร่ใน [ClawHub](/th/tools/clawhub)

  </Accordion>
  <Accordion title="Hook packs และ npm specs">
    `plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับ hook packs ที่เปิดเผย `openclaw.hooks` ใน `package.json` ด้วย ใช้ `openclaw hooks` สำหรับการมองเห็น hook แบบ filtered และการเปิดใช้งานต่อ hook ไม่ใช่สำหรับการติดตั้งแพ็กเกจ

    Npm specs เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **เวอร์ชัน exact** หรือ **dist-tag** ที่เป็นทางเลือก) Git/URL/file specs และ semver ranges จะถูกปฏิเสธ การติดตั้ง dependency จะรันแบบ project-local พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้ shell ของคุณจะมีการตั้งค่า npm install แบบ global

    ใช้ `npm:<package>` เมื่อคุณต้องการทำให้การ resolve ผ่าน npm ชัดเจน Bare package specs จะติดตั้งจาก npm โดยตรงเช่นกันในช่วง launch cutover

    Bare specs และ `@latest` จะอยู่บน stable track หาก npm resolve รายการใดรายการหนึ่งเหล่านั้นไปยัง prerelease, OpenClaw จะหยุดและขอให้คุณ opt in อย่างชัดเจนด้วย prerelease tag เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease exact เช่น `@1.2.3-beta.4`

    หาก bare install spec ตรงกับ official plugin id (เช่น `diffs`) OpenClaw จะติดตั้งรายการ catalog โดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่มีชื่อเดียวกัน ให้ใช้ scoped spec ที่ชัดเจน (เช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="Git repositories">
    ใช้ `git:<repo>` เพื่อติดตั้งโดยตรงจาก git repository รูปแบบที่รองรับรวมถึง `git:github.com/owner/repo`, `git:owner/repo`, clone URLs แบบเต็ม `https://`, `ssh://`, `git://`, `file://` และ `git@host:owner/repo.git` เพิ่ม `@<ref>` หรือ `#<ref>` เพื่อ checkout branch, tag หรือ commit ก่อนติดตั้ง

    การติดตั้ง Git จะ clone ไปยังไดเรกทอรีชั่วคราว, checkout ref ที่ร้องขอเมื่อมี แล้วใช้ตัวติดตั้งไดเรกทอรี plugin ตามปกติ ซึ่งหมายความว่า manifest validation, dangerous-code scanning, งานติดตั้ง package-manager และ install records จะทำงานเหมือนการติดตั้ง npm การติดตั้ง git ที่บันทึกไว้จะรวม source URL/ref พร้อม commit ที่ resolve แล้ว เพื่อให้ `openclaw plugins update` สามารถ re-resolve แหล่งนั้นได้ภายหลัง

    หลังติดตั้งจาก git ให้ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อตรวจสอบ runtime registrations เช่น gateway methods และ CLI commands หาก plugin ลงทะเบียน CLI root ด้วย `api.registerCli` ให้ execute คำสั่งนั้นโดยตรงผ่าน OpenClaw root CLI เช่น `openclaw demo-plugin ping`

  </Accordion>
  <Accordion title="Archives">
    Archives ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` archives ของ native OpenClaw plugin ต้องมี `openclaw.plugin.json` ที่ถูกต้องใน root ของ plugin หลัง extract; archives ที่มีแค่ `package.json` จะถูกปฏิเสธก่อนที่ OpenClaw จะเขียน install records

    รองรับการติดตั้ง Claude marketplace ด้วย

  </Accordion>
</AccordionGroup>

การติดตั้ง ClawHub ใช้ locator แบบชัดเจน `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Bare npm-safe plugin specs จะติดตั้งจาก npm โดยค่าเริ่มต้นในช่วง launch cutover:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อทำให้การ resolve แบบ npm-only ชัดเจน:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw ตรวจสอบ plugin API / minimum gateway compatibility ที่ประกาศไว้ก่อนติดตั้ง เมื่อเวอร์ชัน ClawHub ที่เลือกเผยแพร่ artifact แบบ ClawPack, OpenClaw จะดาวน์โหลด npm-pack `.tgz` ที่มีเวอร์ชัน, ตรวจสอบ ClawHub digest header และ artifact digest แล้วติดตั้งผ่านเส้นทาง archive ปกติ เวอร์ชัน ClawHub ที่เก่ากว่าและไม่มี ClawPack metadata ยังคงติดตั้งผ่านเส้นทางการตรวจสอบ package archive แบบ legacy install records ที่บันทึกไว้จะเก็บ source metadata ของ ClawHub, artifact kind, npm integrity, npm shasum, tarball name และข้อเท็จจริง ClawPack digest สำหรับการอัปเดตภายหลัง
การติดตั้ง ClawHub แบบไม่ระบุเวอร์ชันจะเก็บ recorded spec แบบไม่ระบุเวอร์ชัน เพื่อให้ `openclaw plugins update` สามารถติดตาม release ใหม่กว่าของ ClawHub ได้; selectors แบบระบุเวอร์ชันหรือ tag อย่างชัดเจน เช่น `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` จะยังคง pin อยู่กับ selector นั้น

#### Marketplace shorthand

ใช้ shorthand `plugin@marketplace` เมื่อชื่อ marketplace มีอยู่ใน local registry cache ของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

ใช้ `--marketplace` เมื่อคุณต้องการส่ง marketplace source อย่างชัดเจน:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="แหล่งที่มาของ Marketplace">
    - ชื่อ Marketplace ที่ Claude รู้จักจาก `~/.claude/plugins/known_marketplaces.json`
    - รูทรายการ Marketplace แบบภายในเครื่องหรือพาธ `marketplace.json`
    - ชื่อย่อ repo ของ GitHub เช่น `owner/repo`
    - URL ของ repo GitHub เช่น `https://github.com/owner/repo`
    - URL ของ git

  </Tab>
  <Tab title="กฎสำหรับ Marketplace ระยะไกล">
    สำหรับ Marketplace ระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องอยู่ภายใน repo Marketplace ที่โคลนมาเท่านั้น OpenClaw ยอมรับแหล่งที่มาแบบพาธสัมพัทธ์จาก repo นั้น และปฏิเสธแหล่งที่มา Plugin แบบ HTTP(S), พาธสัมบูรณ์, git, GitHub และแหล่งที่มาอื่นที่ไม่ใช่พาธจาก manifest ระยะไกล
  </Tab>
</Tabs>

สำหรับพาธภายในเครื่องและไฟล์เก็บถาวร OpenClaw จะตรวจหาโดยอัตโนมัติ:

- Plugin ของ OpenClaw แบบเนทีฟ (`openclaw.plugin.json`)
- บันเดิลที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- บันเดิลที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือเลย์เอาต์คอมโพเนนต์เริ่มต้นของ Claude)
- บันเดิลที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

<Note>
บันเดิลที่เข้ากันได้จะติดตั้งลงในรูท Plugin ปกติ และเข้าร่วมในโฟลว์ list/info/enable/disable เดียวกัน ปัจจุบันรองรับ Skills ของบันเดิล, command-skills ของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` / `lspServers` ที่ประกาศใน manifest ของ Claude, command-skills ของ Cursor และไดเรกทอรี hook ของ Codex ที่เข้ากันได้ ส่วนความสามารถอื่นของบันเดิลที่ตรวจพบจะแสดงใน diagnostics/info แต่ยังไม่ได้เชื่อมเข้ากับการทำงานของ runtime
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
  แสดงเฉพาะ Plugin ที่เปิดใช้งานอยู่
</ParamField>
<ParamField path="--verbose" type="boolean">
  เปลี่ยนจากมุมมองตารางเป็นบรรทัดรายละเอียดต่อ Plugin พร้อม metadata ของ source/origin/version/activation
</ParamField>
<ParamField path="--json" type="boolean">
  inventory ที่อ่านได้โดยเครื่อง พร้อม diagnostics ของ registry และสถานะการติดตั้ง dependency ของแพ็กเกจ
</ParamField>

<Note>
`plugins list` จะอ่าน registry Plugin ภายในเครื่องที่บันทึกไว้ก่อน โดยมี fallback ที่สร้างจาก manifest เท่านั้นเมื่อ registry หายไปหรือไม่ถูกต้อง คำสั่งนี้มีประโยชน์สำหรับตรวจสอบว่า Plugin ติดตั้งแล้ว เปิดใช้งานแล้ว และมองเห็นได้สำหรับการวางแผนเริ่มต้นแบบเย็นหรือไม่ แต่ไม่ใช่การ probe runtime สดของกระบวนการ Gateway ที่กำลังทำงานอยู่ หลังจากเปลี่ยนโค้ด Plugin, การเปิดใช้งาน, นโยบาย hook หรือ `plugins.load.paths` ให้รีสตาร์ท Gateway ที่ให้บริการช่องทางก่อนคาดหวังให้โค้ด `register(api)` หรือ hook ใหม่ทำงาน สำหรับการปรับใช้แบบระยะไกล/คอนเทนเนอร์ ให้ตรวจสอบว่าคุณกำลังรีสตาร์ท child ของ `openclaw gateway run` ตัวจริง ไม่ใช่เพียงกระบวนการ wrapper

`plugins list --json` รวม `dependencyStatus` ของแต่ละ Plugin จาก `package.json`
`dependencies` และ `optionalDependencies` OpenClaw ตรวจสอบว่าชื่อแพ็กเกจเหล่านั้นมีอยู่ตามพาธ lookup `node_modules` ของ Node ปกติของ Plugin หรือไม่ โดยจะไม่ import โค้ด runtime ของ Plugin, ไม่เรียกใช้ package manager และไม่ซ่อม dependency ที่ขาดหาย
</Note>

`plugins search` คือการค้นหาแค็ตตาล็อก ClawHub ระยะไกล คำสั่งนี้ไม่ตรวจสอบสถานะภายในเครื่อง ไม่แก้ไข config ไม่ติดตั้งแพ็กเกจ และไม่โหลดโค้ด runtime ของ Plugin ผลการค้นหารวมชื่อแพ็กเกจ ClawHub, family, channel, version, summary และคำแนะนำการติดตั้ง เช่น `openclaw plugins install clawhub:<package>`

สำหรับงาน Plugin ที่บันเดิลอยู่ภายในอิมเมจ Docker ที่แพ็กเกจแล้ว ให้ bind-mount ไดเรกทอรีซอร์สของ Plugin ทับพาธซอร์สที่แพ็กเกจไว้ให้ตรงกัน เช่น `/app/extensions/synology-chat` OpenClaw จะค้นพบ overlay ซอร์สที่ mount ไว้นั้นก่อน `/app/dist/extensions/synology-chat`; ไดเรกทอรีซอร์สที่คัดลอกแบบธรรมดาจะยังไม่ทำงาน เพื่อให้การติดตั้งแบบแพ็กเกจปกติยังใช้ dist ที่คอมไพล์แล้ว

สำหรับการ debug hook ของ runtime:

- `openclaw plugins inspect <id> --runtime --json` แสดง hook ที่ลงทะเบียนไว้และ diagnostics จากรอบการตรวจสอบที่โหลดโมดูลแล้ว การตรวจสอบ runtime จะไม่ติดตั้ง dependency; ใช้ `openclaw doctor --fix` เพื่อล้างสถานะ dependency แบบ legacy หรือติดตั้ง Plugin ที่ดาวน์โหลดได้ซึ่งกำหนดค่าไว้แต่ขาดหาย
- `openclaw gateway status --deep --require-rpc` ยืนยัน Gateway ที่เข้าถึงได้, คำใบ้ service/process, พาธ config และสุขภาพ RPC
- hook การสนทนาที่ไม่ได้บันเดิล (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรีภายในเครื่อง (เพิ่มเข้าใน `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
ไม่รองรับ `--force` ร่วมกับ `--link` เพราะการติดตั้งแบบ linked ใช้พาธซอร์สซ้ำแทนการคัดลอกทับเป้าหมายการติดตั้งที่จัดการไว้

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึก spec แบบ exact ที่ resolve แล้ว (`name@version`) ในดัชนี Plugin ที่จัดการไว้ โดยยังคงพฤติกรรมเริ่มต้นแบบไม่ pin ไว้
</Note>

### ดัชนี Plugin

metadata การติดตั้ง Plugin คือสถานะที่เครื่องจัดการ ไม่ใช่ config ของผู้ใช้ การติดตั้งและการอัปเดตจะเขียนข้อมูลนี้ไปที่ `plugins/installs.json` ใต้ไดเรกทอรีสถานะ OpenClaw ที่ใช้งานอยู่ map ระดับบนสุด `installRecords` คือแหล่งข้อมูลถาวรของ metadata การติดตั้ง รวมถึง record สำหรับ manifest ของ Plugin ที่เสียหรือหายไป อาร์เรย์ `plugins` คือแคช registry แบบเย็นที่สร้างจาก manifest ไฟล์นี้มีคำเตือนห้ามแก้ไข และถูกใช้โดย `openclaw plugins update`, uninstall, diagnostics และ registry Plugin แบบเย็น

เมื่อ OpenClaw พบ record `plugins.installs` แบบ legacy ที่จัดส่งมากับ config ระบบจะย้าย record เหล่านั้นเข้าไปในดัชนี Plugin และลบคีย์ config ออก หากการเขียนอย่างใดอย่างหนึ่งล้มเหลว record ใน config จะถูกเก็บไว้เพื่อไม่ให้ metadata การติดตั้งสูญหาย

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` ลบ record ของ Plugin ออกจาก `plugins.entries`, ดัชนี Plugin ที่บันทึกไว้, รายการ allow/deny ของ Plugin และรายการ `plugins.load.paths` แบบ linked เมื่อเกี่ยวข้อง หากไม่ได้ตั้งค่า `--keep-files` การถอนการติดตั้งจะลบไดเรกทอรีการติดตั้งที่จัดการและติดตามไว้ด้วยเมื่อไดเรกทอรีนั้นอยู่ภายในรูท extensions ของ Plugin ของ OpenClaw สำหรับ Plugin active memory ช่อง memory จะรีเซ็ตเป็น `memory-core`

<Note>
รองรับ `--keep-config` ในฐานะ alias ที่เลิกใช้แล้วของ `--keep-files`
</Note>

### อัปเดต

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

การอัปเดตใช้กับการติดตั้ง Plugin ที่ติดตามไว้ในดัชนี Plugin ที่จัดการ และการติดตั้ง hook-pack ที่ติดตามไว้ใน `hooks.internal.installs`

<AccordionGroup>
  <Accordion title="การ resolve id ของ Plugin เทียบกับ spec ของ npm">
    เมื่อคุณส่ง id ของ Plugin OpenClaw จะใช้ spec การติดตั้งที่บันทึกไว้สำหรับ Plugin นั้นซ้ำ ซึ่งหมายความว่า dist-tags ที่เคยจัดเก็บไว้ เช่น `@beta` และเวอร์ชัน exact ที่ pin ไว้ จะยังถูกใช้ต่อไปในการรัน `update <id>` ภายหลัง

    สำหรับการติดตั้ง npm คุณยังสามารถส่ง spec ของแพ็กเกจ npm แบบชัดเจนพร้อม dist-tag หรือเวอร์ชัน exact ได้ OpenClaw จะ resolve ชื่อแพ็กเกจนั้นกลับไปยัง record ของ Plugin ที่ติดตามไว้ อัปเดต Plugin ที่ติดตั้งนั้น และบันทึก spec npm ใหม่สำหรับการอัปเดตตาม id ในอนาคต

    การส่งชื่อแพ็กเกจ npm โดยไม่มีเวอร์ชันหรือ tag ก็จะ resolve กลับไปยัง record ของ Plugin ที่ติดตามไว้เช่นกัน ใช้วิธีนี้เมื่อ Plugin ถูก pin ไว้กับเวอร์ชัน exact และคุณต้องการย้ายกลับไปยังสาย release เริ่มต้นของ registry

  </Accordion>
  <Accordion title="การอัปเดตช่อง beta">
    `openclaw plugins update` ใช้ spec ของ Plugin ที่ติดตามไว้ซ้ำ เว้นแต่คุณจะส่ง spec ใหม่ `openclaw update` ยังรู้ช่องอัปเดต OpenClaw ที่ใช้งานอยู่ด้วย: ในช่อง beta record ของ Plugin จาก npm และ ClawHub ที่อยู่ในสายเริ่มต้นจะลอง `@beta` ก่อน จากนั้น fallback ไปยัง spec default/latest ที่บันทึกไว้หากไม่มี release beta ของ Plugin เวอร์ชัน exact และ tag ที่ระบุชัดเจนจะยังคง pin กับตัวเลือกนั้น

  </Accordion>
  <Accordion title="การตรวจสอบเวอร์ชันและ integrity drift">
    ก่อนการอัปเดต npm แบบสด OpenClaw จะตรวจสอบเวอร์ชันแพ็กเกจที่ติดตั้งกับ metadata ของ registry npm หากเวอร์ชันที่ติดตั้งและ identity ของ artifact ที่บันทึกไว้ตรงกับเป้าหมายที่ resolve แล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน `openclaw.json` ใหม่

    เมื่อมี hash integrity ที่จัดเก็บไว้และ hash ของ artifact ที่ fetch มาเปลี่ยน OpenClaw จะถือว่านั่นเป็น npm artifact drift คำสั่งแบบโต้ตอบ `openclaw plugins update` จะพิมพ์ hash ที่คาดไว้และ hash จริง แล้วขอการยืนยันก่อนดำเนินการต่อ helper สำหรับอัปเดตแบบไม่โต้ตอบจะ fail closed เว้นแต่ caller จะระบุนโยบายการดำเนินการต่ออย่างชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install ในการอัปเดต">
    `--dangerously-force-unsafe-install` มีให้ใช้บน `plugins update` ด้วยในฐานะ override ฉุกเฉินสำหรับ false positive ของการสแกนโค้ดอันตรายในตัวระหว่างการอัปเดต Plugin แต่ยังคงไม่ bypass การบล็อกนโยบาย `before_install` ของ Plugin หรือการบล็อกจาก scan-failure และใช้ได้เฉพาะกับการอัปเดต Plugin ไม่ใช่การอัปเดต hook-pack
  </Accordion>
</AccordionGroup>

### ตรวจสอบ

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect แสดง identity, สถานะการโหลด, source, ความสามารถของ manifest, flag นโยบาย, diagnostics, metadata การติดตั้ง, ความสามารถของบันเดิล และการรองรับเซิร์ฟเวอร์ MCP หรือ LSP ที่ตรวจพบ โดยค่าเริ่มต้นจะไม่ import runtime ของ Plugin เพิ่ม `--runtime` เพื่อโหลดโมดูล Plugin และรวม hook, tool, command, service, gateway method และ route HTTP ที่ลงทะเบียนไว้ การตรวจสอบ runtime รายงาน dependency ของ Plugin ที่ขาดหายโดยตรง ส่วนการติดตั้งและการซ่อมยังอยู่ใน `openclaw plugins install`, `openclaw plugins update` และ `openclaw doctor --fix`

คำสั่ง CLI ที่ Plugin เป็นเจ้าของถูกติดตั้งเป็นกลุ่มคำสั่ง root `openclaw` หลังจาก `inspect --runtime` แสดง command ภายใต้ `cliCommands` ให้รันเป็น `openclaw <command> ...`; ตัวอย่างเช่น Plugin ที่ลงทะเบียน `demo-git` สามารถตรวจสอบได้ด้วย `openclaw demo-git ping`

Plugin แต่ละตัวถูกจัดประเภทตามสิ่งที่ลงทะเบียนจริงใน runtime:

- **plain-capability** — capability หนึ่งชนิด (เช่น Plugin เฉพาะ provider)
- **hybrid-capability** — capability หลายชนิด (เช่น text + speech + images)
- **hook-only** — มีเฉพาะ hook ไม่มี capability หรือ surface
- **non-capability** — tools/commands/services แต่ไม่มี capability

ดู [รูปทรงของ Plugin](/th/plugins/architecture#plugin-shapes) สำหรับข้อมูลเพิ่มเติมเกี่ยวกับโมเดล capability

<Note>
flag `--json` ส่งออกรายงานที่อ่านได้โดยเครื่อง เหมาะสำหรับการทำสคริปต์และการ audit `inspect --all` แสดงตารางทั้ง fleet พร้อมคอลัมน์ shape, ชนิด capability, compatibility notices, ความสามารถของบันเดิล และสรุป hook `info` เป็น alias ของ `inspect`
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` รายงานข้อผิดพลาดการโหลด Plugin, diagnostics ของ manifest/discovery และ compatibility notices เมื่อทุกอย่างเรียบร้อย จะพิมพ์ `No plugin issues detected.`

สำหรับความล้มเหลวด้านรูปทรงโมดูล เช่น export `register`/`activate` ที่ขาดหาย ให้รันซ้ำด้วย `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุป export-shape แบบกะทัดรัดในผลลัพธ์ diagnostics

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

registry Plugin ภายในเครื่องคือ read model แบบเย็นที่ OpenClaw บันทึกไว้สำหรับ identity, การเปิดใช้งาน, metadata ของ source และความเป็นเจ้าของ contribution ของ Plugin ที่ติดตั้งแล้ว การเริ่มต้นปกติ, การ lookup เจ้าของ provider, การจัดประเภท channel setup และ inventory ของ Plugin สามารถอ่านข้อมูลนี้ได้โดยไม่ต้อง import โมดูล runtime ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่า registry ที่บันทึกไว้มีอยู่ เป็นปัจจุบัน หรือ stale ใช้ `--refresh` เพื่อสร้างใหม่จากดัชนี Plugin ที่บันทึกไว้, นโยบาย config และ metadata ของ manifest/package นี่คือพาธการซ่อม ไม่ใช่พาธการ activation ของ runtime

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็นสวิตช์ความเข้ากันได้แบบฉุกเฉินที่เลิกใช้แล้วสำหรับความล้มเหลวในการอ่านรีจิสทรี ควรใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix`; ทางเลือกสำรองผ่าน env มีไว้สำหรับการกู้คืนการเริ่มต้นระบบในกรณีฉุกเฉินเท่านั้นระหว่างที่การย้ายระบบกำลังทยอยเปิดใช้
</Warning>

### ตลาดกลาง

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

รายการตลาดกลางยอมรับพาธตลาดกลางในเครื่อง, พาธ `marketplace.json`, รูปย่อ GitHub เช่น `owner/repo`, URL รีโป GitHub หรือ URL git `--json` จะแสดงป้ายกำกับแหล่งที่มาที่ resolve แล้ว พร้อมกับมานิเฟสต์ตลาดกลางและรายการ Plugin ที่แยกวิเคราะห์แล้ว

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [อ้างอิง CLI](/th/cli)
- [Plugin จากชุมชน](/th/plugins/community)
