---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือบันเดิลที่เข้ากันได้
    - คุณต้องการดีบักความล้มเหลวในการโหลด Plugin
sidebarTitle: Plugins
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-03T21:28:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: d854d052b0a012a86f9c775775676a9a8fe8ae86b2c38a18118f1abf0732174c
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Gateway plugins, hook packs และ bundles ที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="ระบบ Plugin" href="/th/tools/plugin">
    คู่มือสำหรับผู้ใช้ปลายทางในการติดตั้ง เปิดใช้งาน และแก้ปัญหา plugins
  </Card>
  <Card title="จัดการ plugins" href="/th/plugins/manage-plugins">
    ตัวอย่างสั้น ๆ สำหรับติดตั้ง แสดงรายการ อัปเดต ถอนการติดตั้ง และเผยแพร่
  </Card>
  <Card title="Plugin bundles" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของ bundle
  </Card>
  <Card title="Plugin manifest" href="/th/plugins/manifest">
    ฟิลด์ manifest และสคีมา config
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

สำหรับการตรวจสอบการติดตั้ง การ inspect การถอนการติดตั้ง หรือการ refresh registry ที่ช้า ให้รันคำสั่งพร้อม `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` trace จะเขียนเวลาของแต่ละเฟสไปยัง stderr และยังทำให้เอาต์พุต JSON parse ได้ ดู [การดีบัก](/th/help/debugging#plugin-lifecycle-trace)

<Note>
plugins ที่ bundled มาพร้อมกับ OpenClaw บางรายการเปิดใช้งานตามค่าเริ่มต้น (เช่น bundled model providers, bundled speech providers และ bundled browser plugin); รายการอื่นต้องใช้ `plugins enable`

plugins แบบเนทีฟของ OpenClaw ต้องมาพร้อม `openclaw.plugin.json` ที่มี JSON Schema แบบ inline (`configSchema` แม้จะว่างก็ตาม) bundles ที่เข้ากันได้จะใช้ bundle manifests ของตนเองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุต list/info แบบ verbose ยังแสดง subtype ของ bundle (`codex`, `claude` หรือ `cursor`) พร้อม capabilities ของ bundle ที่ตรวจพบ
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
ชื่อแพ็กเกจแบบ bare จะติดตั้งจาก npm ตามค่าเริ่มต้นระหว่างช่วง launch cutover ใช้ `clawhub:<package>` สำหรับ ClawHub ปฏิบัติกับการติดตั้ง plugin เหมือนการรันโค้ด ควรใช้เวอร์ชันที่ pin ไว้
</Warning>

`plugins search` query ClawHub เพื่อค้นหาแพ็กเกจ plugin ที่ติดตั้งได้ และพิมพ์ชื่อแพ็กเกจที่พร้อมติดตั้ง โดยค้นหาแพ็กเกจ code-plugin และ bundle-plugin ไม่ใช่ skills ใช้ `openclaw skills search` สำหรับ ClawHub skills

<Note>
ClawHub เป็นช่องทางหลักสำหรับการแจกจ่ายและค้นพบ plugins ส่วนใหญ่ Npm ยังคงเป็น fallback ที่รองรับและเป็นเส้นทาง direct-install แพ็กเกจ plugin `@openclaw/*` ที่ OpenClaw เป็นเจ้าของกลับมาเผยแพร่บน npm อีกครั้งแล้ว ดูรายการปัจจุบันได้ที่ [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) หรือ [plugin inventory](/th/plugins/plugin-inventory) การติดตั้ง stable ใช้ `latest` การติดตั้งและอัปเดตใน beta-channel จะใช้ npm `beta` dist-tag ก่อนเมื่อ tag นั้นมีอยู่ จากนั้นจึง fallback เป็น `latest`
</Note>

<AccordionGroup>
  <Accordion title="Config includes และการซ่อมแซม invalid-config">
    หากส่วน `plugins` ของคุณอิงกับ `$include` แบบไฟล์เดียว `plugins install/update/enable/disable/uninstall` จะเขียนผ่านไปยังไฟล์ included นั้นและปล่อย `openclaw.json` ไว้ไม่แตะต้อง Root includes, include arrays และ includes ที่มี sibling overrides จะ fail closed แทนที่จะ flatten ดู [Config includes](/th/gateway/configuration) สำหรับรูปแบบที่รองรับ

    หาก config ไม่ถูกต้องระหว่างติดตั้ง โดยปกติ `plugins install` จะ fail closed และบอกให้คุณรัน `openclaw doctor --fix` ก่อน ระหว่าง Gateway startup และ hot reload config ของ plugin ที่ไม่ถูกต้องจะ fail closed เหมือน config ที่ไม่ถูกต้องอื่น ๆ; `openclaw doctor --fix` สามารถ quarantine entry ของ plugin ที่ไม่ถูกต้องได้ ข้อยกเว้น install-time ที่มีเอกสารกำกับไว้เพียงอย่างเดียวคือเส้นทาง recovery แบบแคบสำหรับ bundled-plugin สำหรับ plugins ที่ opt in เข้า `openclaw.install.allowInvalidConfigRecovery` อย่างชัดเจน

  </Accordion>
  <Accordion title="--force และ reinstall เทียบกับ update">
    `--force` ใช้ target การติดตั้งเดิมซ้ำและเขียนทับ plugin หรือ hook pack ที่ติดตั้งไว้แล้วในที่เดิม ใช้เมื่อตั้งใจ reinstall id เดิมจาก local path, archive, แพ็กเกจ ClawHub หรือ artifact ของ npm ใหม่ สำหรับการอัปเกรด plugin npm ที่ติดตามอยู่แล้วตามปกติ ควรใช้ `openclaw plugins update <id-or-npm-spec>`

    หากคุณรัน `plugins install` สำหรับ plugin id ที่ติดตั้งไว้แล้ว OpenClaw จะหยุดและชี้คุณไปที่ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติ หรือไปที่ `plugins install <package> --force` เมื่อคุณต้องการเขียนทับการติดตั้งปัจจุบันจากแหล่งอื่นจริง ๆ

  </Accordion>
  <Accordion title="ขอบเขตของ --pin">
    `--pin` ใช้ได้กับการติดตั้ง npm เท่านั้น ไม่รองรับกับการติดตั้ง `git:`; ใช้ git ref แบบชัดเจน เช่น `git:github.com/acme/plugin@v1.2.3` เมื่อคุณต้องการแหล่งที่ pin ไว้ ไม่รองรับกับ `--marketplace` เพราะการติดตั้งจาก marketplace จะ persist metadata แหล่งที่มาของ marketplace แทน npm spec
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` เป็นตัวเลือก break-glass สำหรับ false positives ใน dangerous-code scanner ในตัว อนุญาตให้การติดตั้งดำเนินต่อได้แม้ scanner ในตัวจะรายงาน findings ระดับ `critical` แต่จะ **ไม่** bypass บล็อกจาก policy ของ hook `before_install` ของ plugin และจะ **ไม่** bypass scan failures

    CLI flag นี้ใช้กับ flow การ install/update plugin การติดตั้ง skill dependencies ที่ Gateway รองรับใช้ request override ที่ตรงกันคือ `dangerouslyForceUnsafeInstall` ส่วน `openclaw skills install` ยังคงเป็น flow download/install skill ของ ClawHub ที่แยกต่างหาก

    หาก plugin ที่คุณเผยแพร่บน ClawHub ถูกบล็อกโดย registry scan ให้ใช้ขั้นตอนสำหรับผู้เผยแพร่ใน [ClawHub](/th/tools/clawhub)

  </Accordion>
  <Accordion title="Hook packs และ npm specs">
    `plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับ hook packs ที่ expose `openclaw.hooks` ใน `package.json` ใช้ `openclaw hooks` สำหรับการมองเห็น hook แบบ filtered และการเปิดใช้งานราย hook ไม่ใช่การติดตั้งแพ็กเกจ

    Npm specs เป็น **registry-only** (ชื่อแพ็กเกจ + **exact version** หรือ **dist-tag** ที่เป็นตัวเลือก) Git/URL/file specs และ semver ranges จะถูกปฏิเสธ การติดตั้ง dependencies จะรันแบบ project-local พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้ shell ของคุณจะมี global npm install settings ก็ตาม

    ใช้ `npm:<package>` เมื่อคุณต้องการระบุ npm resolution ให้ชัดเจน Bare package specs จะติดตั้งโดยตรงจาก npm ระหว่าง launch cutover เช่นกัน

    Bare specs และ `@latest` จะอยู่บน stable track หาก npm resolve สิ่งใดสิ่งหนึ่งเป็น prerelease OpenClaw จะหยุดและขอให้คุณ opt in อย่างชัดเจนด้วย prerelease tag เช่น `@beta`/`@rc` หรือ exact prerelease version เช่น `@1.2.3-beta.4`

    หาก bare install spec ตรงกับ official plugin id (เช่น `diffs`) OpenClaw จะติดตั้ง catalog entry โดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่มีชื่อเดียวกัน ให้ใช้ explicit scoped spec (เช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="Git repositories">
    ใช้ `git:<repo>` เพื่อติดตั้งโดยตรงจาก git repository รูปแบบที่รองรับได้แก่ `git:github.com/owner/repo`, `git:owner/repo`, clone URLs แบบ full `https://`, `ssh://`, `git://`, `file://` และ `git@host:owner/repo.git` เพิ่ม `@<ref>` หรือ `#<ref>` เพื่อ check out branch, tag หรือ commit ก่อนติดตั้ง

    การติดตั้งผ่าน Git จะ clone ไปยังไดเรกทอรีชั่วคราว check out ref ที่ร้องขอเมื่อมีอยู่ จากนั้นใช้ตัวติดตั้งไดเรกทอรี plugin ตามปกติ นั่นหมายความว่า manifest validation, dangerous-code scanning, งานติดตั้งของ package-manager และ install records จะทำงานเหมือนการติดตั้ง npm การติดตั้ง git ที่บันทึกไว้จะรวม source URL/ref พร้อม resolved commit เพื่อให้ `openclaw plugins update` สามารถ re-resolve แหล่งที่มาภายหลังได้

    หลังจากติดตั้งจาก git ให้ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อตรวจสอบ runtime registrations เช่น gateway methods และ CLI commands หาก plugin ลงทะเบียน CLI root ด้วย `api.registerCli` ให้รันคำสั่งนั้นโดยตรงผ่าน root CLI ของ OpenClaw เช่น `openclaw demo-plugin ping`

  </Accordion>
  <Accordion title="Archives">
    Archives ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` Archives ของ plugin แบบเนทีฟของ OpenClaw ต้องมี `openclaw.plugin.json` ที่ถูกต้องที่ root ของ plugin ที่ extract แล้ว; archives ที่มีเพียง `package.json` จะถูกปฏิเสธก่อน OpenClaw เขียน install records

    รองรับการติดตั้งจาก Claude marketplace ด้วย

  </Accordion>
</AccordionGroup>

การติดตั้ง ClawHub ใช้ locator แบบชัดเจน `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Bare npm-safe plugin specs จะติดตั้งจาก npm ตามค่าเริ่มต้นระหว่าง launch cutover:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อระบุ npm-only resolution ให้ชัดเจน:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw ตรวจสอบ plugin API ที่ประกาศไว้ / ความเข้ากันได้ขั้นต่ำของ gateway ก่อนติดตั้ง เมื่อเวอร์ชัน ClawHub ที่เลือกเผยแพร่ ClawPack artifact, OpenClaw จะดาวน์โหลด `.tgz` แบบ npm-pack ที่มีเวอร์ชัน ตรวจสอบ ClawHub digest header และ artifact digest จากนั้นติดตั้งผ่านเส้นทาง archive ปกติ เวอร์ชัน ClawHub ที่เก่ากว่าและไม่มี ClawPack metadata ยังคงติดตั้งผ่านเส้นทาง legacy package archive verification การติดตั้งที่บันทึกไว้จะเก็บ ClawHub source metadata, artifact kind, npm integrity, npm shasum, tarball name และข้อเท็จจริง ClawPack digest สำหรับการอัปเดตภายหลัง
การติดตั้ง ClawHub แบบไม่ระบุเวอร์ชันจะเก็บ recorded spec แบบไม่ระบุเวอร์ชันไว้ เพื่อให้ `openclaw plugins update` สามารถตามรุ่นใหม่ของ ClawHub ได้; selectors แบบระบุเวอร์ชันหรือ tag ชัดเจน เช่น `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` จะยังคง pin ไว้กับ selector นั้น

#### ชวเลข Marketplace

ใช้ชวเลข `plugin@marketplace` เมื่อชื่อ marketplace มีอยู่ใน local registry cache ของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

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
    - รูท Marketplace ในเครื่องหรือพาธ `marketplace.json`
    - ชื่อย่อ repo GitHub เช่น `owner/repo`
    - URL repo GitHub เช่น `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="กฎของ Marketplace ระยะไกล">
    สำหรับ Marketplace ระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องอยู่ภายใน repo Marketplace ที่โคลนมา OpenClaw ยอมรับแหล่งที่มาแบบพาธสัมพัทธ์จาก repo นั้น และปฏิเสธแหล่งที่มา Plugin แบบ HTTP(S), พาธสัมบูรณ์, git, GitHub และแหล่งที่มาอื่นที่ไม่ใช่พาธจาก manifest ระยะไกล
  </Tab>
</Tabs>

สำหรับพาธและไฟล์เก็บถาวรในเครื่อง OpenClaw จะตรวจจับโดยอัตโนมัติ:

- Plugin ดั้งเดิมของ OpenClaw (`openclaw.plugin.json`)
- บันเดิลที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- บันเดิลที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือเลย์เอาต์คอมโพเนนต์ Claude เริ่มต้น)
- บันเดิลที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

<Note>
บันเดิลที่เข้ากันได้จะติดตั้งลงในรูท Plugin ปกติ และเข้าร่วมในโฟลว์ list/info/enable/disable เดียวกัน ปัจจุบันรองรับ Skills ของบันเดิล, command-skills ของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` / `lspServers` ที่ประกาศใน manifest ของ Claude, command-skills ของ Cursor และไดเรกทอรี hook ของ Codex ที่เข้ากันได้ ส่วนความสามารถอื่นของบันเดิลที่ตรวจพบจะแสดงใน diagnostics/info แต่ยังไม่ได้เชื่อมต่อเข้ากับการทำงานของ runtime
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
  เปลี่ยนจากมุมมองตารางเป็นบรรทัดรายละเอียดต่อ Plugin พร้อมเมทาดาทา source/origin/version/activation
</ParamField>
<ParamField path="--json" type="boolean">
  รายการ inventory ที่เครื่องอ่านได้ พร้อม diagnostics ของ registry และสถานะการติดตั้ง dependency ของแพ็กเกจ
</ParamField>

<Note>
`plugins list` อ่าน registry Plugin ในเครื่องที่คงอยู่ไว้ก่อน โดยมี fallback ที่สร้างจาก manifest เท่านั้นเมื่อ registry ขาดหายหรือไม่ถูกต้อง คำสั่งนี้มีประโยชน์สำหรับตรวจสอบว่า Plugin ติดตั้งแล้ว เปิดใช้งานแล้ว และมองเห็นได้ในการวางแผนเริ่มต้นแบบเย็นหรือไม่ แต่ไม่ใช่การ probe runtime แบบสดของกระบวนการ Gateway ที่กำลังทำงานอยู่ หลังจากเปลี่ยนโค้ด Plugin, enablement, hook policy หรือ `plugins.load.paths` ให้รีสตาร์ท Gateway ที่ให้บริการ channel ก่อนคาดหวังให้โค้ด `register(api)` หรือ hook ใหม่ทำงาน สำหรับการปรับใช้แบบระยะไกล/คอนเทนเนอร์ ให้ตรวจสอบว่าคุณกำลังรีสตาร์ท child `openclaw gateway run` ตัวจริง ไม่ใช่แค่กระบวนการ wrapper

`plugins list --json` รวม `dependencyStatus` ของแต่ละ Plugin จาก `package.json`
`dependencies` และ `optionalDependencies` OpenClaw ตรวจสอบว่าชื่อแพ็กเกจเหล่านั้นมีอยู่ตามพาธ lookup `node_modules` ปกติของ Node สำหรับ Plugin หรือไม่ โดยจะไม่นำเข้าโค้ด runtime ของ Plugin, ไม่เรียกตัวจัดการแพ็กเกจ และไม่ซ่อม dependency ที่ขาดหาย
</Note>

`plugins search` เป็นการค้นหาแค็ตตาล็อก ClawHub ระยะไกล คำสั่งนี้ไม่ตรวจสอบสถานะในเครื่อง, ไม่แก้ config, ไม่ติดตั้งแพ็กเกจ และไม่โหลดโค้ด runtime ของ Plugin ผลลัพธ์การค้นหาประกอบด้วยชื่อแพ็กเกจ ClawHub, family, channel, version, summary และคำแนะนำการติดตั้ง เช่น `openclaw plugins install clawhub:<package>`

สำหรับงาน Plugin ที่บันเดิลไว้ภายในอิมเมจ Docker ที่แพ็กเกจแล้ว ให้ bind-mount ไดเรกทอรีซอร์สของ Plugin ทับพาธซอร์สที่แพ็กเกจไว้ให้ตรงกัน เช่น `/app/extensions/synology-chat` OpenClaw จะค้นพบ source overlay ที่ mount นั้นก่อน `/app/dist/extensions/synology-chat`; ไดเรกทอรีซอร์สที่คัดลอกธรรมดาจะยังไม่ทำงาน เพื่อให้การติดตั้งแบบแพ็กเกจปกติยังใช้ dist ที่คอมไพล์แล้ว

สำหรับการดีบัก runtime hook:

- `openclaw plugins inspect <id> --runtime --json` แสดง hook ที่ลงทะเบียนและ diagnostics จากรอบการตรวจสอบที่โหลดโมดูล การตรวจสอบ runtime จะไม่ติดตั้ง dependency; ใช้ `openclaw doctor --fix` เพื่อล้างสถานะ dependency เก่าหรือติดตั้ง Plugin ที่ดาวน์โหลดได้ซึ่งกำหนดค่าไว้แต่ขาดหาย
- `openclaw gateway status --deep --require-rpc` ยืนยัน Gateway ที่เข้าถึงได้, คำใบ้ service/process, พาธ config และสุขภาพ RPC
- hook การสนทนาที่ไม่ได้บันเดิล (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรีในเครื่อง (เพิ่มเข้า `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` ไม่รองรับร่วมกับ `--link` เพราะการติดตั้งแบบลิงก์จะใช้พาธซอร์สซ้ำแทนการคัดลอกทับเป้าหมายการติดตั้งที่จัดการอยู่

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึก spec ที่ resolve แล้วแบบแน่นอน (`name@version`) ในดัชนี Plugin ที่จัดการอยู่ ขณะที่ยังคงพฤติกรรมเริ่มต้นแบบไม่ pin
</Note>

### ดัชนี Plugin

เมทาดาทาการติดตั้ง Plugin เป็นสถานะที่เครื่องจัดการ ไม่ใช่ config ของผู้ใช้ การติดตั้งและอัปเดตจะเขียนข้อมูลนี้ไปยัง `plugins/installs.json` ใต้ไดเรกทอรีสถานะ OpenClaw ที่ใช้งานอยู่ map ระดับบนสุด `installRecords` เป็นแหล่งข้อมูลถาวรของเมทาดาทาการติดตั้ง รวมถึงระเบียนสำหรับ manifest ของ Plugin ที่เสียหรือขาดหาย อาร์เรย์ `plugins` เป็นแคช cold registry ที่สร้างจาก manifest ไฟล์นี้มีคำเตือนห้ามแก้ไข และถูกใช้โดย `openclaw plugins update`, uninstall, diagnostics และ cold plugin registry

เมื่อ OpenClaw พบระเบียน `plugins.installs` แบบ legacy ที่มากับระบบใน config จะย้ายระเบียนเหล่านั้นไปยังดัชนี Plugin และลบคีย์ config ออก หากการเขียนอย่างใดอย่างหนึ่งล้มเหลว ระเบียน config จะถูกเก็บไว้เพื่อไม่ให้เมทาดาทาการติดตั้งสูญหาย

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` ลบระเบียน Plugin ออกจาก `plugins.entries`, ดัชนี Plugin ที่คงอยู่, รายการ allow/deny ของ Plugin และรายการ `plugins.load.paths` ที่ลิงก์ไว้เมื่อเกี่ยวข้อง เว้นแต่ตั้งค่า `--keep-files` การถอนการติดตั้งจะลบไดเรกทอรีการติดตั้งที่จัดการและติดตามไว้ด้วยเมื่อไดเรกทอรีนั้นอยู่ภายในรูท extensions ของ Plugin ของ OpenClaw สำหรับ Plugin หน่วยความจำที่ใช้งานอยู่ slot หน่วยความจำจะรีเซ็ตเป็น `memory-core`

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

การอัปเดตใช้กับการติดตั้ง Plugin ที่ติดตามไว้ในดัชนี Plugin ที่จัดการอยู่ และการติดตั้ง hook-pack ที่ติดตามไว้ใน `hooks.internal.installs`

<AccordionGroup>
  <Accordion title="การ resolve id ของ Plugin เทียบกับ npm spec">
    เมื่อคุณส่ง id ของ Plugin OpenClaw จะใช้ spec การติดตั้งที่บันทึกไว้สำหรับ Plugin นั้นซ้ำ ซึ่งหมายความว่า dist-tag ที่เคยจัดเก็บไว้ เช่น `@beta` และเวอร์ชันที่ pin แบบแน่นอน จะยังถูกใช้ต่อในการรัน `update <id>` ภายหลัง

    สำหรับการติดตั้ง npm คุณยังสามารถส่ง npm package spec แบบชัดเจนพร้อม dist-tag หรือเวอร์ชันแน่นอนได้ด้วย OpenClaw จะ resolve ชื่อแพ็กเกจนั้นกลับไปยังระเบียน Plugin ที่ติดตามไว้ อัปเดต Plugin ที่ติดตั้งนั้น และบันทึก npm spec ใหม่สำหรับการอัปเดตตาม id ในอนาคต

    การส่งชื่อแพ็กเกจ npm โดยไม่มีเวอร์ชันหรือแท็กก็จะ resolve กลับไปยังระเบียน Plugin ที่ติดตามไว้เช่นกัน ใช้วิธีนี้เมื่อ Plugin ถูก pin ไว้ที่เวอร์ชันแน่นอน และคุณต้องการย้ายกลับไปยังสาย release เริ่มต้นของ registry

  </Accordion>
  <Accordion title="การอัปเดต channel beta">
    `openclaw plugins update` ใช้ spec ของ Plugin ที่ติดตามไว้ซ้ำ เว้นแต่คุณจะส่ง spec ใหม่ `openclaw update` ยังรู้จัก channel อัปเดต OpenClaw ที่ใช้งานอยู่เพิ่มเติม: บน channel beta ระเบียน Plugin จาก npm และ ClawHub ในสายเริ่มต้นจะลอง `@beta` ก่อน แล้วจึง fallback ไปยัง spec default/latest ที่บันทึกไว้หากไม่มี release beta ของ Plugin เวอร์ชันแน่นอนและแท็กที่ระบุชัดเจนจะยังคง pin กับตัวเลือกนั้น

  </Accordion>
  <Accordion title="การตรวจสอบเวอร์ชันและ integrity drift">
    ก่อนการอัปเดต npm แบบสด OpenClaw จะตรวจสอบเวอร์ชันแพ็กเกจที่ติดตั้งเทียบกับเมทาดาทา registry ของ npm หากเวอร์ชันที่ติดตั้งและอัตลักษณ์ artifact ที่บันทึกไว้ตรงกับเป้าหมายที่ resolve แล้วอยู่แล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด, ติดตั้งใหม่ หรือเขียน `openclaw.json` ใหม่

    เมื่อมี hash integrity ที่จัดเก็บไว้และ hash ของ artifact ที่ดึงมาเปลี่ยนแปลง OpenClaw จะถือว่านั่นเป็น npm artifact drift คำสั่ง `openclaw plugins update` แบบโต้ตอบจะพิมพ์ hash ที่คาดหวังและ hash จริง แล้วขอการยืนยันก่อนดำเนินการต่อ ตัวช่วยอัปเดตแบบไม่โต้ตอบจะปิดแบบล้มเหลว เว้นแต่ caller จะระบุ policy การดำเนินการต่ออย่างชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install เมื่ออัปเดต">
    `--dangerously-force-unsafe-install` ยังใช้ได้กับ `plugins update` ในฐานะ override ฉุกเฉินสำหรับ false positive ของการสแกน dangerous-code ในตัวระหว่างการอัปเดต Plugin แต่ยังไม่ข้าม policy block `before_install` ของ Plugin หรือการบล็อกเมื่อการสแกนล้มเหลว และใช้กับการอัปเดต Plugin เท่านั้น ไม่ใช่การอัปเดต hook-pack
  </Accordion>
</AccordionGroup>

### ตรวจสอบ

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect แสดง identity, สถานะการโหลด, source, ความสามารถของ manifest, policy flags, diagnostics, เมทาดาทาการติดตั้ง, ความสามารถของบันเดิล และการรองรับ MCP หรือ LSP server ที่ตรวจพบ โดยค่าเริ่มต้นจะไม่นำเข้า runtime ของ Plugin เพิ่ม `--runtime` เพื่อโหลดโมดูล Plugin และรวม hook, tools, commands, services, gateway methods และ HTTP routes ที่ลงทะเบียนไว้ การตรวจสอบ runtime จะรายงาน dependency ของ Plugin ที่ขาดหายโดยตรง; การติดตั้งและซ่อมแซมยังอยู่ใน `openclaw plugins install`, `openclaw plugins update` และ `openclaw doctor --fix`

คำสั่ง CLI ที่ Plugin เป็นเจ้าของจะติดตั้งเป็นกลุ่มคำสั่งราก `openclaw` หลังจาก `inspect --runtime` แสดงคำสั่งใต้ `cliCommands` แล้ว ให้รันเป็น `openclaw <command> ...`; เช่น Plugin ที่ลงทะเบียน `demo-git` สามารถตรวจสอบได้ด้วย `openclaw demo-git ping`

Plugin แต่ละตัวจะถูกจัดประเภทตามสิ่งที่ลงทะเบียนจริงใน runtime:

- **plain-capability** — ความสามารถหนึ่งประเภท (เช่น Plugin ที่เป็น provider อย่างเดียว)
- **hybrid-capability** — ความสามารถหลายประเภท (เช่น ข้อความ + เสียงพูด + รูปภาพ)
- **hook-only** — เฉพาะ hook ไม่มีความสามารถหรือ surface
- **non-capability** — tools/commands/services แต่ไม่มีความสามารถ

ดู [รูปทรง Plugin](/th/plugins/architecture#plugin-shapes) สำหรับข้อมูลเพิ่มเติมเกี่ยวกับโมเดลความสามารถ

<Note>
แฟล็ก `--json` ส่งออกรายงานที่เครื่องอ่านได้ เหมาะสำหรับสคริปต์และการ audit `inspect --all` จะแสดงตารางทั้ง fleet พร้อมคอลัมน์ shape, capability kinds, compatibility notices, bundle capabilities และ hook summary `info` เป็น alias ของ `inspect`
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` รายงานข้อผิดพลาดในการโหลด Plugin, diagnostics ของ manifest/discovery และ compatibility notices เมื่อทุกอย่างสะอาด จะพิมพ์ `No plugin issues detected.`

หาก Plugin ที่กำหนดค่าไว้มีอยู่บนดิสก์แต่ถูกบล็อกโดยการตรวจ path-safety ของ loader การตรวจสอบ config จะเก็บรายการ Plugin ไว้และรายงานเป็น `present but blocked` ให้แก้ diagnostic ของ Plugin ที่ถูกบล็อกก่อนหน้า เช่น ownership ของพาธหรือ permission แบบ world-writable แทนการลบ config `plugins.entries.<id>` หรือ `plugins.allow`

สำหรับความล้มเหลวของรูปทรงโมดูล เช่น export `register`/`activate` ที่ขาดหาย ให้รันซ้ำด้วย `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุปรูปทรง export แบบกระชับไว้ในเอาต์พุต diagnostic

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

registry Plugin ในเครื่องคือโมเดลอ่านแบบเย็นที่คงอยู่ของ OpenClaw สำหรับ identity ของ Plugin ที่ติดตั้ง, enablement, เมทาดาทา source และ ownership ของ contribution การเริ่มต้นปกติ, การค้นหาเจ้าของ provider, การจำแนก channel setup และ inventory ของ Plugin สามารถอ่านข้อมูลนี้ได้โดยไม่ต้องนำเข้าโมดูล runtime ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่ารีจิสทรีที่จัดเก็บไว้มีอยู่ เป็นปัจจุบัน หรือล้าสมัย ใช้ `--refresh` เพื่อสร้างใหม่จากดัชนี Plugin ที่จัดเก็บไว้ นโยบายการกำหนดค่า และเมทาดาทา manifest/package นี่คือเส้นทางการซ่อมแซม ไม่ใช่เส้นทางการเปิดใช้งานขณะรันไทม์

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็นสวิตช์ความเข้ากันได้แบบฉุกเฉินที่เลิกใช้แล้วสำหรับความล้มเหลวในการอ่านรีจิสทรี ควรใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix`; กลไกสำรองผ่าน env มีไว้สำหรับการกู้คืนการเริ่มต้นระบบฉุกเฉินเท่านั้นระหว่างที่การย้ายระบบกำลังทยอยใช้งาน
</Warning>

### มาร์เก็ตเพลส

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

รายการมาร์เก็ตเพลสรับพาธมาร์เก็ตเพลสภายในเครื่อง, พาธ `marketplace.json`, รูปย่อ GitHub เช่น `owner/repo`, URL ของ repo GitHub หรือ URL git `--json` จะพิมพ์ป้ายกำกับแหล่งที่มาที่แก้ไขแล้ว พร้อมกับ manifest ของมาร์เก็ตเพลสที่แยกวิเคราะห์แล้วและรายการ Plugin

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Plugin ชุมชน](/th/plugins/community)
