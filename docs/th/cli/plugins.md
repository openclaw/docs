---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือบันเดิลที่เข้ากันได้
    - คุณต้องการดีบักความล้มเหลวในการโหลด Plugin
sidebarTitle: Plugins
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-12T08:45:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b51646a103e9e020f6e53cd08aa25e7291fb629741fd41bdab520d80b7416ff
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Plugin ของ Gateway, ชุด hook และบันเดิลที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="ระบบ Plugin" href="/th/tools/plugin">
    คู่มือสำหรับผู้ใช้ปลายทางสำหรับการติดตั้ง เปิดใช้งาน และแก้ไขปัญหา Plugin
  </Card>
  <Card title="จัดการ Plugin" href="/th/plugins/manage-plugins">
    ตัวอย่างแบบรวดเร็วสำหรับการติดตั้ง แสดงรายการ อัปเดต ถอนการติดตั้ง และเผยแพร่
  </Card>
  <Card title="บันเดิล Plugin" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของบันเดิล
  </Card>
  <Card title="แมนิเฟสต์ Plugin" href="/th/plugins/manifest">
    ฟิลด์ของแมนิเฟสต์และสคีมา config
  </Card>
  <Card title="ความปลอดภัย" href="/th/gateway/security">
    การเสริมความแข็งแกร่งด้านความปลอดภัยสำหรับการติดตั้ง Plugin
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

สำหรับการตรวจสอบการติดตั้ง การตรวจดู การถอนการติดตั้ง หรือการรีเฟรช registry ที่ช้า ให้เรียกใช้
คำสั่งพร้อม `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` trace จะเขียนเวลาของแต่ละเฟส
ไปยัง stderr และทำให้เอาต์พุต JSON ยัง parse ได้ ดู [การดีบัก](/th/help/debugging#plugin-lifecycle-trace)

<Note>
ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) ตัวปรับเปลี่ยน lifecycle ของ Plugin จะถูกปิดใช้งาน ใช้แหล่งที่มาของ Nix สำหรับการติดตั้งนี้แทน `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` หรือ `plugins disable`; สำหรับ nix-openclaw ให้ใช้ [เริ่มต้นใช้งานด่วน](https://github.com/openclaw/nix-openclaw#quick-start) ที่เริ่มจาก agent ก่อน
</Note>

<Note>
Plugin ที่บันเดิลมาพร้อมกับ OpenClaw จะจัดส่งพร้อม OpenClaw บางรายการเปิดใช้งานตามค่าเริ่มต้น (เช่น provider โมเดลที่บันเดิลมา, provider เสียงพูดที่บันเดิลมา และ Plugin เบราว์เซอร์ที่บันเดิลมา); รายการอื่นต้องใช้ `plugins enable`

Plugin แบบเนทีฟของ OpenClaw ต้องจัดส่ง `openclaw.plugin.json` พร้อม JSON Schema แบบ inline (`configSchema` แม้ว่าจะว่างก็ตาม) บันเดิลที่เข้ากันได้จะใช้แมนิเฟสต์บันเดิลของตนเองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุต list/info แบบ verbose ยังแสดง subtype ของบันเดิล (`codex`, `claude` หรือ `cursor`) พร้อม capability ของบันเดิลที่ตรวจพบด้วย
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

ผู้ดูแลที่ทดสอบการติดตั้งในช่วง setup สามารถแทนที่แหล่งติดตั้ง Plugin อัตโนมัติ
ด้วยตัวแปรสภาพแวดล้อมที่มีการป้องกัน ดู
[การแทนที่การติดตั้ง Plugin](/th/plugins/install-overrides)

<Warning>
ชื่อแพ็กเกจเปล่า ๆ จะติดตั้งจาก npm ตามค่าเริ่มต้นระหว่างช่วงเปลี่ยนผ่านการเปิดตัว ใช้ `clawhub:<package>` สำหรับ ClawHub ให้ปฏิบัติต่อการติดตั้ง Plugin เหมือนการเรียกใช้โค้ด ควรใช้เวอร์ชันที่ pin ไว้
</Warning>

`plugins search` ค้นหา ClawHub สำหรับแพ็กเกจ Plugin ที่ติดตั้งได้ และพิมพ์
ชื่อแพ็กเกจที่พร้อมติดตั้ง คำสั่งนี้ค้นหาแพ็กเกจ code-plugin และ bundle-plugin
ไม่ใช่ Skills ใช้ `openclaw skills search` สำหรับ Skills ของ ClawHub

<Note>
ClawHub เป็นพื้นผิวหลักสำหรับการแจกจ่ายและค้นพบ Plugin ส่วนใหญ่ Npm
ยังคงเป็น fallback และเส้นทางติดตั้งโดยตรงที่รองรับ แพ็กเกจ Plugin
`@openclaw/*` ที่ OpenClaw เป็นเจ้าของถูกเผยแพร่บน npm อีกครั้งแล้ว; ดูรายการปัจจุบัน
ได้ที่ [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) หรือ
[รายการคลัง Plugin](/th/plugins/plugin-inventory) การติดตั้ง stable ใช้ `latest`
การติดตั้งและอัปเดตจากช่อง beta จะเลือกใช้ dist-tag `beta` ของ npm เมื่อ tag นั้น
พร้อมใช้งาน จากนั้นจึง fallback ไปที่ `latest`
</Note>

<AccordionGroup>
  <Accordion title="การรวม config และการซ่อมแซม config ที่ไม่ถูกต้อง">
    หากส่วน `plugins` ของคุณอ้างอิงจาก `$include` แบบไฟล์เดียว `plugins install/update/enable/disable/uninstall` จะเขียนทะลุไปยังไฟล์ที่ include นั้น และปล่อย `openclaw.json` ไว้ไม่เปลี่ยนแปลง root includes, include arrays และ includes ที่มี sibling overrides จะ fail closed แทนการ flatten ดู [การรวม config](/th/gateway/configuration) สำหรับรูปแบบที่รองรับ

    หาก config ไม่ถูกต้องระหว่างการติดตั้ง โดยปกติ `plugins install` จะ fail closed และแจ้งให้คุณเรียกใช้ `openclaw doctor --fix` ก่อน ระหว่างการเริ่มต้น Gateway และ hot reload, config ของ Plugin ที่ไม่ถูกต้องจะ fail closed เหมือน config ที่ไม่ถูกต้องอื่น ๆ; `openclaw doctor --fix` สามารถ quarantine รายการ Plugin ที่ไม่ถูกต้องได้ ข้อยกเว้นเดียวในช่วงติดตั้งที่มีเอกสารระบุไว้คือเส้นทางกู้คืนแบบแคบสำหรับ bundled-plugin ที่เลือกใช้ `openclaw.install.allowInvalidConfigRecovery` อย่างชัดเจน

  </Accordion>
  <Accordion title="--force และการติดตั้งซ้ำเทียบกับการอัปเดต">
    `--force` ใช้ target การติดตั้งเดิมซ้ำ และเขียนทับ Plugin หรือชุด hook ที่ติดตั้งไว้แล้วในตำแหน่งเดิม ใช้เมื่อตั้งใจติดตั้ง id เดิมซ้ำจาก path ในเครื่อง, archive, แพ็กเกจ ClawHub หรือ artifact ของ npm ใหม่ สำหรับการอัปเกรดตามปกติของ Plugin npm ที่ติดตามอยู่แล้ว ควรใช้ `openclaw plugins update <id-or-npm-spec>`

    หากคุณเรียกใช้ `plugins install` สำหรับ id ของ Plugin ที่ติดตั้งอยู่แล้ว OpenClaw จะหยุดและชี้คุณไปที่ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดปกติ หรือไปที่ `plugins install <package> --force` เมื่อคุณต้องการเขียนทับการติดตั้งปัจจุบันจากแหล่งอื่นจริง ๆ

  </Accordion>
  <Accordion title="ขอบเขตของ --pin">
    `--pin` ใช้กับการติดตั้ง npm เท่านั้น ไม่รองรับกับการติดตั้ง `git:`; ใช้ git ref ที่ชัดเจน เช่น `git:github.com/acme/plugin@v1.2.3` เมื่อคุณต้องการแหล่งที่มาที่ pin ไว้ ไม่รองรับกับ `--marketplace` เพราะการติดตั้ง marketplace จะเก็บ metadata ของแหล่งที่มา marketplace แทน npm spec
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` เป็นตัวเลือก break-glass สำหรับ false positive ในตัวสแกนโค้ดอันตรายในตัว มันอนุญาตให้การติดตั้งดำเนินต่อได้แม้ตัวสแกนในตัวรายงานผล `critical` แต่จะ **ไม่** ข้าม policy block ของ hook `before_install` ของ Plugin และ **ไม่** ข้ามความล้มเหลวของการสแกน

    flag ของ CLI นี้ใช้กับ flow การติดตั้ง/อัปเดต Plugin การติดตั้ง dependency ของ skill ที่รองรับโดย Gateway ใช้ request override ที่ตรงกันคือ `dangerouslyForceUnsafeInstall` ขณะที่ `openclaw skills install` ยังคงเป็น flow ดาวน์โหลด/ติดตั้ง skill ของ ClawHub แยกต่างหาก

    หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกบล็อกโดยการสแกน registry ให้ใช้ขั้นตอนสำหรับ publisher ใน [ClawHub](/th/clawhub/security)

  </Accordion>
  <Accordion title="ชุด hook และ npm specs">
    `plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับชุด hook ที่เปิดเผย `openclaw.hooks` ใน `package.json` ด้วย ใช้ `openclaw hooks` สำหรับการมองเห็น hook แบบกรองและการเปิดใช้งานราย hook ไม่ใช่สำหรับการติดตั้งแพ็กเกจ

    Npm specs เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **เวอร์ชันที่แน่นอน** หรือ **dist-tag** ที่เป็น optional) Git/URL/file specs และช่วง semver จะถูกปฏิเสธ การติดตั้ง dependency จะทำงานแบบ project-local พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้ shell ของคุณจะมีการตั้งค่า npm install แบบ global ก็ตาม root npm ของ Plugin ที่จัดการอยู่จะสืบทอด `overrides` ระดับแพ็กเกจของ OpenClaw ดังนั้น security pin ของ host จึงใช้กับ dependency ของ Plugin ที่ถูก hoist ด้วย

    ใช้ `npm:<package>` เมื่อคุณต้องการระบุการ resolve ของ npm อย่างชัดเจน Bare package specs จะติดตั้งโดยตรงจาก npm ระหว่างช่วงเปลี่ยนผ่านการเปิดตัวด้วย

    Bare specs และ `@latest` จะอยู่บน track stable เวอร์ชันแก้ไขของ OpenClaw ที่ประทับวันที่ เช่น `2026.5.3-1` เป็น stable releases สำหรับการตรวจสอบนี้ หาก npm resolve รายการใดรายการหนึ่งไปเป็น prerelease, OpenClaw จะหยุดและขอให้คุณ opt in อย่างชัดเจนด้วย prerelease tag เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease ที่แน่นอน เช่น `@1.2.3-beta.4`

    หาก bare install spec ตรงกับ id ของ Plugin ทางการ (เช่น `diffs`) OpenClaw จะติดตั้งรายการ catalog โดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่มีชื่อเดียวกัน ให้ใช้ scoped spec ที่ชัดเจน (เช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="Git repositories">
    ใช้ `git:<repo>` เพื่อติดตั้งโดยตรงจาก git repository รูปแบบที่รองรับรวมถึง `git:github.com/owner/repo`, `git:owner/repo`, clone URLs แบบเต็ม `https://`, `ssh://`, `git://`, `file://` และ `git@host:owner/repo.git` เพิ่ม `@<ref>` หรือ `#<ref>` เพื่อ checkout branch, tag หรือ commit ก่อนติดตั้ง

    การติดตั้ง Git จะ clone ไปยังไดเรกทอรีชั่วคราว checkout ref ที่ร้องขอเมื่อมี จากนั้นใช้ตัวติดตั้งไดเรกทอรี Plugin ตามปกติ นั่นหมายความว่าการตรวจสอบแมนิเฟสต์ การสแกนโค้ดอันตราย งานติดตั้งด้วย package-manager และบันทึกการติดตั้งจะทำงานเหมือนการติดตั้ง npm การติดตั้ง git ที่บันทึกไว้จะมี URL/ref ของแหล่งที่มา พร้อม commit ที่ resolve แล้ว เพื่อให้ `openclaw plugins update` สามารถ re-resolve แหล่งที่มาได้ภายหลัง

    หลังติดตั้งจาก git ให้ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อตรวจสอบ runtime registrations เช่น gateway methods และคำสั่ง CLI หาก Plugin ลงทะเบียน root ของ CLI ด้วย `api.registerCli` ให้ execute คำสั่งนั้นโดยตรงผ่าน root CLI ของ OpenClaw เช่น `openclaw demo-plugin ping`

  </Accordion>
  <Accordion title="Archives">
    archives ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` archive ของ Plugin แบบเนทีฟของ OpenClaw ต้องมี `openclaw.plugin.json` ที่ถูกต้องอยู่ที่ root ของ Plugin ที่แตกไฟล์แล้ว; archive ที่มีเพียง `package.json` จะถูกปฏิเสธก่อนที่ OpenClaw จะเขียนบันทึกการติดตั้ง

    ใช้ `npm-pack:<path.tgz>` เมื่อไฟล์เป็น tarball ของ npm-pack และคุณต้องการ
    ทดสอบเส้นทางการติดตั้ง npm-root ที่จัดการอยู่แบบเดียวกับที่การติดตั้งจาก registry ใช้
    รวมถึงการตรวจสอบ `package-lock.json`, การสแกน dependency ที่ถูก hoist และ
    บันทึก npm install path ของ archive แบบปกติยังคงติดตั้งเป็น local archives
    ภายใต้ root ของ plugin extensions

    รองรับการติดตั้งจาก Claude marketplace ด้วย

  </Accordion>
</AccordionGroup>

การติดตั้งจาก ClawHub ใช้ locator `clawhub:<package>` ที่ชัดเจน:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

plugin specs ที่ปลอดภัยสำหรับ npm แบบ bare จะติดตั้งจาก npm ตามค่าเริ่มต้นระหว่างช่วงเปลี่ยนผ่านการเปิดตัว:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อระบุการ resolve แบบ npm-only อย่างชัดเจน:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw ตรวจสอบ API ของ Plugin ที่ประกาศไว้ / ความเข้ากันได้ขั้นต่ำของ Gateway ก่อนติดตั้ง เมื่อเวอร์ชัน ClawHub ที่เลือกเผยแพร่สิ่งประดิษฐ์ ClawPack แล้ว OpenClaw จะดาวน์โหลด `.tgz` แบบ npm-pack ที่มีเวอร์ชัน ตรวจสอบส่วนหัว digest ของ ClawHub และ digest ของสิ่งประดิษฐ์ จากนั้นติดตั้งผ่านเส้นทางไฟล์เก็บถาวรปกติ เวอร์ชัน ClawHub รุ่นเก่าที่ไม่มีเมทาดาทา ClawPack จะยังติดตั้งผ่านเส้นทางการตรวจสอบไฟล์เก็บถาวรของแพ็กเกจแบบเดิม รายการติดตั้งที่บันทึกไว้จะเก็บเมทาดาทาแหล่งที่มาจาก ClawHub, ชนิดสิ่งประดิษฐ์, npm integrity, npm shasum, ชื่อ tarball และข้อเท็จจริง digest ของ ClawPack ไว้สำหรับการอัปเดตภายหลัง
การติดตั้ง ClawHub แบบไม่ระบุเวอร์ชันจะเก็บสเปกที่บันทึกไว้แบบไม่ระบุเวอร์ชัน เพื่อให้ `openclaw plugins update` ติดตามรุ่น ClawHub ที่ใหม่กว่าได้ ส่วนตัวเลือกเวอร์ชันหรือแท็กแบบชัดเจน เช่น `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` จะยังคงถูกปักไว้กับตัวเลือกนั้น

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
    - ชื่อ known-marketplace ของ Claude จาก `~/.claude/plugins/known_marketplaces.json`
    - ราก marketplace ภายในเครื่องหรือพาธ `marketplace.json`
    - ชวเลขรีโป GitHub เช่น `owner/repo`
    - URL รีโป GitHub เช่น `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="กฎของ marketplace ระยะไกล">
    สำหรับ marketplace ระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องอยู่ภายในรีโป marketplace ที่ถูกโคลนไว้ OpenClaw ยอมรับแหล่งที่มาแบบพาธสัมพัทธ์จากรีโปนั้น และปฏิเสธแหล่งที่มา Plugin แบบ HTTP(S), พาธสัมบูรณ์, git, GitHub และแหล่งที่มาอื่นที่ไม่ใช่พาธจาก manifest ระยะไกล
  </Tab>
</Tabs>

สำหรับพาธและไฟล์เก็บถาวรภายในเครื่อง OpenClaw จะตรวจจับอัตโนมัติ:

- Plugin ของ OpenClaw แบบเนทีฟ (`openclaw.plugin.json`)
- บันเดิลที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- บันเดิลที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือเค้าโครงคอมโพเนนต์เริ่มต้นของ Claude)
- บันเดิลที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

<Note>
บันเดิลที่เข้ากันได้จะติดตั้งลงในราก Plugin ปกติ และเข้าร่วมลำดับการทำงาน list/info/enable/disable เดียวกัน ปัจจุบันรองรับ Skills ของบันเดิล, command-skills ของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` / `lspServers` ที่ประกาศใน manifest ของ Claude, command-skills ของ Cursor และไดเรกทอรี hook ของ Codex ที่เข้ากันได้ ส่วนความสามารถอื่นของบันเดิลที่ตรวจพบจะแสดงใน diagnostics/info แต่ยังไม่ได้เชื่อมต่อเข้ากับการดำเนินการ runtime
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
  เปลี่ยนจากมุมมองตารางเป็นบรรทัดรายละเอียดราย Plugin พร้อมเมทาดาทาแหล่งที่มา/ต้นทาง/เวอร์ชัน/การเปิดใช้งาน
</ParamField>
<ParamField path="--json" type="boolean">
  คลังรายการที่เครื่องอ่านได้ พร้อม diagnostics ของรีจิสทรีและสถานะการติดตั้ง dependency ของแพ็กเกจ
</ParamField>

<Note>
`plugins list` อ่านรีจิสทรี Plugin ภายในเครื่องที่คงอยู่ก่อน โดยมี fallback ที่อนุมานจาก manifest อย่างเดียวเมื่อรีจิสทรีหายไปหรือไม่ถูกต้อง คำสั่งนี้มีประโยชน์ในการตรวจสอบว่า Plugin ติดตั้งแล้ว เปิดใช้งานแล้ว และมองเห็นได้ต่อการวางแผนเริ่มต้นแบบ cold startup หรือไม่ แต่ไม่ใช่การ probe runtime สดของกระบวนการ Gateway ที่กำลังทำงานอยู่ หลังจากเปลี่ยนโค้ด Plugin, การเปิดใช้งาน, นโยบาย hook หรือ `plugins.load.paths` ให้รีสตาร์ท Gateway ที่ให้บริการ channel ก่อนคาดหวังให้โค้ด `register(api)` หรือ hook ใหม่ทำงาน สำหรับการปรับใช้ระยะไกล/คอนเทนเนอร์ ให้ตรวจสอบว่าคุณกำลังรีสตาร์ทลูกกระบวนการ `openclaw gateway run` จริง ไม่ใช่แค่กระบวนการ wrapper

`plugins list --json` รวม `dependencyStatus` ของแต่ละ Plugin จาก `package.json`
`dependencies` และ `optionalDependencies` OpenClaw ตรวจสอบว่าชื่อแพ็กเกจเหล่านั้นมีอยู่ตามพาธ lookup `node_modules` ปกติของ Node สำหรับ Plugin หรือไม่ โดยจะไม่ import โค้ด runtime ของ Plugin, ไม่เรียกใช้ตัวจัดการแพ็กเกจ และไม่ซ่อมแซม dependency ที่หายไป
</Note>

`plugins search` คือการค้นหาแคตตาล็อก ClawHub ระยะไกล ไม่ตรวจสอบสถานะภายในเครื่อง ไม่แก้ไข config ไม่ติดตั้งแพ็กเกจ และไม่โหลดโค้ด runtime ของ Plugin ผลการค้นหารวมชื่อแพ็กเกจ ClawHub, family, channel, เวอร์ชัน, สรุป และคำแนะนำการติดตั้ง เช่น `openclaw plugins install clawhub:<package>`

สำหรับงาน Plugin ที่มาพร้อมระบบภายในอิมเมจ Docker ที่แพ็กเกจแล้ว ให้ bind-mount ไดเรกทอรีซอร์สของ Plugin ทับพาธซอร์สที่แพ็กเกจไว้ตรงกัน เช่น `/app/extensions/synology-chat` OpenClaw จะค้นพบ overlay ซอร์สที่เมานต์ไว้นั้นก่อน `/app/dist/extensions/synology-chat`; ไดเรกทอรีซอร์สที่คัดลอกมาแบบธรรมดาจะยังไม่ทำงาน เพื่อให้การติดตั้งแบบแพ็กเกจปกติยังใช้ dist ที่คอมไพล์แล้ว

สำหรับการดีบัก runtime hook:

- `openclaw plugins inspect <id> --runtime --json` แสดง hook ที่ลงทะเบียนไว้และ diagnostics จากรอบการตรวจสอบที่โหลด module แล้ว การตรวจสอบ runtime จะไม่ติดตั้ง dependency; ใช้ `openclaw doctor --fix` เพื่อล้างสถานะ dependency เดิมหรือกู้คืน Plugin ที่ดาวน์โหลดได้ซึ่งถูกอ้างอิงโดย config
- `openclaw gateway status --deep --require-rpc` ยืนยัน Gateway ที่เข้าถึงได้, คำใบ้ service/process, พาธ config และสุขภาพ RPC
- hook การสนทนาที่ไม่ได้มาพร้อมระบบ (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรีภายในเครื่อง (เพิ่มเข้าไปที่ `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
ไม่รองรับ `--force` ร่วมกับ `--link` เพราะการติดตั้งแบบลิงก์จะใช้พาธซอร์สซ้ำแทนการคัดลอกทับเป้าหมายการติดตั้งที่จัดการอยู่

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึกสเปกตรงแบบละเอียดที่ resolve แล้ว (`name@version`) ในดัชนี Plugin ที่จัดการอยู่ โดยยังคงพฤติกรรมเริ่มต้นแบบไม่ปักไว้
</Note>

### ดัชนี Plugin

เมทาดาทาการติดตั้ง Plugin เป็นสถานะที่เครื่องจัดการ ไม่ใช่ config ของผู้ใช้ การติดตั้งและการอัปเดตจะเขียนลงใน `plugins/installs.json` ใต้ไดเรกทอรีสถานะ OpenClaw ที่ใช้งานอยู่ map `installRecords` ระดับบนสุดคือแหล่งข้อมูลถาวรของเมทาดาทาการติดตั้ง รวมถึงระเบียนสำหรับ manifest ของ Plugin ที่เสียหรือหายไป array `plugins` คือแคชรีจิสทรีแบบ cold ที่อนุมานจาก manifest ไฟล์นี้มีคำเตือนห้ามแก้ไข และถูกใช้โดย `openclaw plugins update`, uninstall, diagnostics และรีจิสทรี Plugin แบบ cold

เมื่อ OpenClaw เห็นระเบียน `plugins.installs` แบบ legacy ที่จัดส่งมาใน config การอ่าน runtime จะถือว่าเป็นข้อมูล compatibility โดยไม่เขียน `openclaw.json` ใหม่ การเขียน Plugin แบบชัดเจนและ `openclaw doctor --fix` จะย้ายระเบียนเหล่านั้นเข้าไปในดัชนี Plugin และนำคีย์ config ออกเมื่ออนุญาตให้เขียน config ได้ หากการเขียนอย่างใดอย่างหนึ่งล้มเหลว ระเบียน config จะถูกเก็บไว้เพื่อไม่ให้เมทาดาทาการติดตั้งสูญหาย

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` ลบระเบียน Plugin ออกจาก `plugins.entries`, ดัชนี Plugin ที่คงอยู่, รายการอนุญาต/ปฏิเสธของ Plugin และรายการ `plugins.load.paths` ที่ลิงก์ไว้เมื่อเกี่ยวข้อง หากไม่ได้ตั้งค่า `--keep-files` การถอนการติดตั้งจะลบไดเรกทอรีการติดตั้งที่จัดการและติดตามอยู่เมื่อไดเรกทอรีนั้นอยู่ภายในราก extensions ของ Plugin ของ OpenClaw ด้วย สำหรับ Plugin ของ Active Memory ช่องหน่วยความจำจะรีเซ็ตเป็น `memory-core`

<Note>
รองรับ `--keep-config` เป็น alias ที่เลิกแนะนำแล้วของ `--keep-files`
</Note>

### อัปเดต

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

การอัปเดตจะมีผลกับการติดตั้ง Plugin ที่ติดตามไว้ในดัชนี Plugin ที่จัดการอยู่ และการติดตั้ง hook-pack ที่ติดตามไว้ใน `hooks.internal.installs`

<AccordionGroup>
  <Accordion title="การ resolve id ของ Plugin เทียบกับสเปก npm">
    เมื่อคุณส่ง id ของ Plugin OpenClaw จะใช้สเปกการติดตั้งที่บันทึกไว้สำหรับ Plugin นั้นซ้ำ ซึ่งหมายความว่า dist-tag ที่เก็บไว้ก่อนหน้า เช่น `@beta` และเวอร์ชันที่ปักไว้อย่างละเอียดจะยังถูกใช้ต่อไปในการรัน `update <id>` ภายหลัง

    สำหรับการติดตั้ง npm คุณยังสามารถส่งสเปกแพ็กเกจ npm แบบชัดเจนพร้อม dist-tag หรือเวอร์ชันที่ละเอียดได้ OpenClaw จะ resolve ชื่อแพ็กเกจนั้นกลับไปยังระเบียน Plugin ที่ติดตามไว้ อัปเดต Plugin ที่ติดตั้งนั้น และบันทึกสเปก npm ใหม่สำหรับการอัปเดตตาม id ในอนาคต

    การส่งชื่อแพ็กเกจ npm โดยไม่มีเวอร์ชันหรือแท็กจะ resolve กลับไปยังระเบียน Plugin ที่ติดตามไว้เช่นกัน ใช้วิธีนี้เมื่อ Plugin ถูกปักไว้กับเวอร์ชันที่ละเอียด และคุณต้องการย้ายกลับไปยังสายรุ่นเริ่มต้นของรีจิสทรี

  </Accordion>
  <Accordion title="การอัปเดต channel beta">
    `openclaw plugins update` ใช้สเปก Plugin ที่ติดตามไว้ซ้ำ เว้นแต่คุณจะส่งสเปกใหม่ `openclaw update` ยังรู้ channel การอัปเดต OpenClaw ที่ใช้งานอยู่เพิ่มเติม: บน channel beta ระเบียน Plugin ของ npm และ ClawHub ที่เป็นสายเริ่มต้นจะลอง `@beta` ก่อน แล้ว fallback กลับไปยังสเปก default/latest ที่บันทึกไว้หากไม่มีรุ่น beta ของ Plugin นั้น fallback ดังกล่าวจะถูกรายงานเป็นคำเตือนและไม่ทำให้การอัปเดต core ล้มเหลว เวอร์ชันที่ละเอียดและแท็กที่ระบุชัดเจนจะยังคงถูกปักไว้กับตัวเลือกนั้น

  </Accordion>
  <Accordion title="การตรวจสอบเวอร์ชันและการเบี่ยงเบนของ integrity">
    ก่อนการอัปเดต npm แบบสด OpenClaw ตรวจสอบเวอร์ชันแพ็กเกจที่ติดตั้งเทียบกับเมทาดาทารีจิสทรี npm หากเวอร์ชันที่ติดตั้งและตัวตนของสิ่งประดิษฐ์ที่บันทึกไว้ตรงกับเป้าหมายที่ resolve แล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน `openclaw.json` ใหม่

    เมื่อมีแฮช integrity ที่เก็บไว้และแฮชของสิ่งประดิษฐ์ที่ดึงมาเปลี่ยนไป OpenClaw จะถือว่านั่นเป็นการเบี่ยงเบนของสิ่งประดิษฐ์ npm คำสั่ง `openclaw plugins update` แบบโต้ตอบจะแสดงแฮชที่คาดไว้และแฮชจริง แล้วขอการยืนยันก่อนดำเนินการต่อ ตัวช่วยอัปเดตแบบไม่โต้ตอบจะ fail closed เว้นแต่ผู้เรียกจะส่งนโยบายการดำเนินการต่ออย่างชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install ในการอัปเดต">
    `--dangerously-force-unsafe-install` ยังใช้ได้กับ `plugins update` เป็น override แบบ break-glass สำหรับ false positive ของการสแกน dangerous-code ในตัวระหว่างการอัปเดต Plugin แต่ยังไม่ข้ามบล็อกนโยบาย `before_install` ของ Plugin หรือการบล็อกจากความล้มเหลวของการสแกน และใช้ได้เฉพาะกับการอัปเดต Plugin ไม่ใช่การอัปเดต hook-pack
  </Accordion>
</AccordionGroup>

### ตรวจสอบ

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect แสดงตัวตน, สถานะการโหลด, แหล่งที่มา, ความสามารถของ manifest, ธงนโยบาย, diagnostics, เมทาดาทาการติดตั้ง, ความสามารถของบันเดิล และการรองรับเซิร์ฟเวอร์ MCP หรือ LSP ที่ตรวจพบ โดยปกติจะไม่ import runtime ของ Plugin เพิ่ม `--runtime` เพื่อโหลด module ของ Plugin และรวม hook, tools, commands, services, gateway methods และเส้นทาง HTTP ที่ลงทะเบียนไว้ การตรวจสอบ runtime จะรายงาน dependency ของ Plugin ที่หายไปโดยตรง; การติดตั้งและการซ่อมแซมยังอยู่ใน `openclaw plugins install`, `openclaw plugins update` และ `openclaw doctor --fix`

คำสั่ง CLI ที่ Plugin เป็นเจ้าของมักติดตั้งเป็นกลุ่มคำสั่ง `openclaw` ระดับราก แต่ Plugin อาจลงทะเบียนคำสั่งซ้อนภายใต้ parent ของ core เช่น `openclaw nodes` ได้เช่นกัน หลังจาก `inspect --runtime` แสดงคำสั่งภายใต้ `cliCommands` แล้ว ให้รันที่พาธที่ระบุไว้ ตัวอย่างเช่น Plugin ที่ลงทะเบียน `demo-git` สามารถตรวจสอบได้ด้วย `openclaw demo-git ping`

Plugin แต่ละตัวถูกจัดประเภทตามสิ่งที่มันลงทะเบียนจริงที่ runtime:

- **plain-capability** — ประเภทความสามารถเดียว (เช่น Plugin สำหรับผู้ให้บริการเท่านั้น)
- **hybrid-capability** — ความสามารถหลายประเภท (เช่น ข้อความ + เสียงพูด + รูปภาพ)
- **hook-only** — มีเฉพาะฮุก ไม่มีความสามารถหรือ surface
- **non-capability** — เครื่องมือ/คำสั่ง/บริการ แต่ไม่มีความสามารถ

ดู [รูปร่างของ Plugin](/th/plugins/architecture#plugin-shapes) สำหรับข้อมูลเพิ่มเติมเกี่ยวกับโมเดลความสามารถ

<Note>
แฟล็ก `--json` จะแสดงรายงานที่เครื่องอ่านได้ ซึ่งเหมาะสำหรับการทำสคริปต์และการตรวจสอบ `inspect --all` จะแสดงตารางระดับทั้งฟลีตที่มีคอลัมน์รูปร่าง ชนิดความสามารถ ประกาศความเข้ากันได้ ความสามารถของบันเดิล และสรุปฮุก `info` เป็นนามแฝงของ `inspect`
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` รายงานข้อผิดพลาดการโหลด Plugin, การวินิจฉัย manifest/discovery และประกาศความเข้ากันได้ เมื่อทุกอย่างเรียบร้อย จะพิมพ์ `No plugin issues detected.`

หาก Plugin ที่กำหนดค่าไว้มีอยู่บนดิสก์แต่ถูกบล็อกโดยการตรวจสอบความปลอดภัยของพาธของตัวโหลด การตรวจสอบความถูกต้องของคอนฟิกจะเก็บรายการ Plugin ไว้และรายงานเป็น `present but blocked` ให้แก้การวินิจฉัย Plugin ที่ถูกบล็อกก่อนหน้า เช่น ความเป็นเจ้าของพาธหรือสิทธิ์แบบ world-writable แทนที่จะลบคอนฟิก `plugins.entries.<id>` หรือ `plugins.allow`

สำหรับความล้มเหลวด้านรูปร่างของโมดูล เช่น ไม่มี export ของ `register`/`activate` ให้รันซ้ำด้วย `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุปรูปร่าง export แบบกระชับในผลลัพธ์การวินิจฉัย

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

รีจิสทรี Plugin ในเครื่องคือโมเดลอ่านแบบ cold ที่ OpenClaw บันทึกถาวรไว้สำหรับตัวตนของ Plugin ที่ติดตั้ง การเปิดใช้งาน เมทาดาทาแหล่งที่มา และความเป็นเจ้าของ contribution การเริ่มทำงานปกติ การค้นหาเจ้าของผู้ให้บริการ การจัดประเภทการตั้งค่าช่องทาง และ inventory ของ Plugin สามารถอ่านได้โดยไม่ต้อง import โมดูล runtime ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่ารีจิสทรีที่บันทึกถาวรมีอยู่ เป็นปัจจุบัน หรือล้าสมัย ใช้ `--refresh` เพื่อสร้างใหม่จากดัชนี Plugin ที่บันทึกถาวร นโยบายคอนฟิก และเมทาดาทา manifest/package นี่เป็นเส้นทางซ่อมแซม ไม่ใช่เส้นทางเปิดใช้งาน runtime

`openclaw doctor --fix` ยังซ่อมแซม managed npm drift ที่อยู่ใกล้รีจิสทรีด้วย: หากแพ็กเกจ `@openclaw/*` ที่หลงเหลือหรือกู้คืนมาใต้ราก npm ของ managed Plugin ไปบดบัง Plugin ที่บันเดิลมา doctor จะลบแพ็กเกจล้าสมัยนั้นและสร้างรีจิสทรีใหม่ เพื่อให้การเริ่มทำงานตรวจสอบกับ manifest ที่บันเดิลมา Doctor ยังลิงก์แพ็กเกจโฮสต์ `openclaw` เข้าไปใน managed npm plugins ที่ประกาศ `peerDependencies.openclaw` อีกครั้ง เพื่อให้การ import runtime ภายในแพ็กเกจ เช่น `openclaw/plugin-sdk/*` resolve ได้หลังการอัปเดตหรือการซ่อมแซม npm

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็นสวิตช์ความเข้ากันได้แบบ break-glass ที่เลิกแนะนำแล้วสำหรับความล้มเหลวในการอ่านรีจิสทรี ควรใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix`; fallback ผ่าน env มีไว้สำหรับการกู้คืนการเริ่มทำงานฉุกเฉินระหว่างที่การย้ายระบบกำลังทยอยใช้งานเท่านั้น
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

รายการ Marketplace รับพาธ marketplace ในเครื่อง, พาธ `marketplace.json`, ชวเลข GitHub เช่น `owner/repo`, URL รีโป GitHub หรือ URL git `--json` จะพิมพ์ป้ายกำกับแหล่งที่มาที่ resolve แล้ว พร้อม manifest ของ marketplace ที่ parse แล้วและรายการ Plugin

## ที่เกี่ยวข้อง

- [การสร้าง plugins](/th/plugins/building-plugins)
- [ข้อมูลอ้างอิง CLI](/th/cli)
- [ClawHub](/th/clawhub)
