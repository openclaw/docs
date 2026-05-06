---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือบันเดิลที่เข้ากันได้
    - คุณต้องการดีบักความล้มเหลวในการโหลด Plugin
sidebarTitle: Plugins
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-06T10:30:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: c888d3fc8de0e25edc1c38f679d522a4e75cb09d986702451e29418d70a939f2
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Gateway plugins, hook packs และบันเดิลที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="ระบบ Plugin" href="/th/tools/plugin">
    คู่มือผู้ใช้ปลายทางสำหรับการติดตั้ง เปิดใช้งาน และแก้ปัญหา plugins
  </Card>
  <Card title="จัดการ plugins" href="/th/plugins/manage-plugins">
    ตัวอย่างอย่างรวดเร็วสำหรับการติดตั้ง แสดงรายการ อัปเดต ถอนการติดตั้ง และเผยแพร่
  </Card>
  <Card title="บันเดิล Plugin" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของบันเดิล
  </Card>
  <Card title="แมนิเฟสต์ Plugin" href="/th/plugins/manifest">
    ฟิลด์แมนิเฟสต์และสคีมาคอนฟิก
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

สำหรับการตรวจสอบการติดตั้ง การตรวจสอบรายละเอียด การถอนการติดตั้ง หรือการรีเฟรชรีจิสทรีที่ช้า ให้รัน
คำสั่งพร้อม `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` trace จะเขียนเวลาของแต่ละเฟส
ไปยัง stderr และยังคงทำให้เอาต์พุต JSON แยกวิเคราะห์ได้ ดู [การดีบัก](/th/help/debugging#plugin-lifecycle-trace)

<Note>
Plugins ที่บันเดิลมาจะจัดส่งพร้อม OpenClaw บางตัวเปิดใช้งานตามค่าเริ่มต้น (เช่น ผู้ให้บริการโมเดลที่บันเดิลมา ผู้ให้บริการเสียงพูดที่บันเดิลมา และ plugin เบราว์เซอร์ที่บันเดิลมา); ส่วนอื่นต้องใช้ `plugins enable`

Plugins แบบเนทีฟของ OpenClaw ต้องจัดส่ง `openclaw.plugin.json` พร้อม JSON Schema แบบอินไลน์ (`configSchema` แม้จะว่างเปล่าก็ตาม) บันเดิลที่เข้ากันได้จะใช้แมนิเฟสต์บันเดิลของตัวเองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุตรายการ/ข้อมูลแบบละเอียดจะแสดงชนิดย่อยของบันเดิล (`codex`, `claude` หรือ `cursor`) พร้อมความสามารถของบันเดิลที่ตรวจพบด้วย
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
ชื่อแพ็กเกจเปล่า ๆ จะติดตั้งจาก npm ตามค่าเริ่มต้นระหว่างช่วงเปลี่ยนผ่านการเปิดตัว ใช้ `clawhub:<package>` สำหรับ ClawHub ให้ปฏิบัติต่อการติดตั้ง plugin เหมือนการรันโค้ด ควรใช้เวอร์ชันที่ pin ไว้
</Warning>

`plugins search` คิวรี ClawHub เพื่อหาแพ็กเกจ plugin ที่ติดตั้งได้ และพิมพ์
ชื่อแพ็กเกจที่พร้อมติดตั้ง โดยค้นหาแพ็กเกจ code-plugin และ bundle-plugin
ไม่ใช่ skills ใช้ `openclaw skills search` สำหรับ ClawHub skills

<Note>
ClawHub เป็นพื้นผิวหลักสำหรับการเผยแพร่และค้นพบ plugins ส่วนใหญ่ Npm
ยังคงเป็น fallback และเส้นทางติดตั้งโดยตรงที่รองรับ แพ็กเกจ plugin
`@openclaw/*` ที่ OpenClaw เป็นเจ้าของได้รับการเผยแพร่บน npm อีกครั้งแล้ว; ดูรายการปัจจุบัน
ที่ [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) หรือ
[คลังรายการ plugin](/th/plugins/plugin-inventory) การติดตั้งแบบเสถียรใช้ `latest`
การติดตั้งและอัปเดตในช่องเบต้าจะเลือกใช้ dist-tag `beta` ของ npm เมื่อมี tag นั้น
แล้วจึง fallback เป็น `latest`
</Note>

<AccordionGroup>
  <Accordion title="คอนฟิก include และการซ่อมแซมคอนฟิกที่ไม่ถูกต้อง">
    หากส่วน `plugins` ของคุณอ้างอิงจาก `$include` แบบไฟล์เดียว `plugins install/update/enable/disable/uninstall` จะเขียนทะลุไปยังไฟล์ที่ include นั้นและปล่อย `openclaw.json` ไว้โดยไม่แตะต้อง Root includes, include arrays และ includes ที่มี sibling overrides จะล้มเหลวแบบปิดแทนการ flatten ดู [คอนฟิก include](/th/gateway/configuration) สำหรับรูปแบบที่รองรับ

    หากคอนฟิกไม่ถูกต้องระหว่างติดตั้ง โดยปกติ `plugins install` จะล้มเหลวแบบปิดและบอกให้คุณรัน `openclaw doctor --fix` ก่อน ระหว่างการเริ่มต้น Gateway และ hot reload คอนฟิก plugin ที่ไม่ถูกต้องจะล้มเหลวแบบปิดเหมือนคอนฟิกไม่ถูกต้องอื่น ๆ; `openclaw doctor --fix` สามารถกักรายการ plugin ที่ไม่ถูกต้องได้ ข้อยกเว้นเวลาติดตั้งที่มีเอกสารไว้เพียงอย่างเดียวคือเส้นทางกู้คืน plugin ที่บันเดิลมาแบบแคบสำหรับ plugins ที่ opt in อย่างชัดเจนกับ `openclaw.install.allowInvalidConfigRecovery`

  </Accordion>
  <Accordion title="--force และติดตั้งใหม่เทียบกับอัปเดต">
    `--force` ใช้เป้าหมายการติดตั้งเดิมซ้ำและเขียนทับ plugin หรือ hook pack ที่ติดตั้งไว้แล้วในที่เดิม ใช้เมื่อคุณตั้งใจติดตั้ง id เดิมใหม่จากพาธในเครื่อง อาร์ไคฟ์ แพ็กเกจ ClawHub หรืออาร์ติแฟกต์ npm ใหม่ สำหรับการอัปเกรด plugin npm ที่ติดตามอยู่แล้วตามปกติ ควรใช้ `openclaw plugins update <id-or-npm-spec>`

    หากคุณรัน `plugins install` สำหรับ id ของ plugin ที่ติดตั้งไว้แล้ว OpenClaw จะหยุดและชี้ให้คุณใช้ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดปกติ หรือใช้ `plugins install <package> --force` เมื่อคุณต้องการเขียนทับการติดตั้งปัจจุบันจากแหล่งอื่นจริง ๆ

  </Accordion>
  <Accordion title="ขอบเขตของ --pin">
    `--pin` ใช้กับการติดตั้ง npm เท่านั้น ไม่รองรับกับการติดตั้ง `git:`; ใช้ git ref แบบชัดเจน เช่น `git:github.com/acme/plugin@v1.2.3` เมื่อคุณต้องการแหล่งที่ pin ไว้ ไม่รองรับกับ `--marketplace` เพราะการติดตั้ง marketplace จะคง metadata แหล่งที่มาของ marketplace แทน npm spec
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` เป็นตัวเลือกฉุกเฉินสำหรับผลบวกเท็จในตัวสแกนโค้ดอันตรายในตัว มันอนุญาตให้การติดตั้งดำเนินต่อได้แม้ตัวสแกนในตัวจะรายงาน findings ระดับ `critical` แต่ **ไม่** ข้ามการบล็อกตามนโยบาย hook `before_install` ของ plugin และ **ไม่** ข้ามความล้มเหลวของการสแกน

    ธง CLI นี้ใช้กับ flow การติดตั้ง/อัปเดต plugin การติดตั้ง dependency ของ skill ที่อิง Gateway ใช้ request override ที่ตรงกันคือ `dangerouslyForceUnsafeInstall` ขณะที่ `openclaw skills install` ยังคงเป็น flow ดาวน์โหลด/ติดตั้ง skill ของ ClawHub แยกต่างหาก

    หาก plugin ที่คุณเผยแพร่บน ClawHub ถูกบล็อกโดยการสแกนรีจิสทรี ให้ใช้ขั้นตอนสำหรับผู้เผยแพร่ใน [ClawHub](/th/tools/clawhub)

  </Accordion>
  <Accordion title="Hook packs และ npm specs">
    `plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับ hook packs ที่เปิดเผย `openclaw.hooks` ใน `package.json` ด้วย ใช้ `openclaw hooks` สำหรับการมองเห็น hook แบบกรองและการเปิดใช้งานราย hook ไม่ใช่สำหรับการติดตั้งแพ็กเกจ

    Npm specs เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **เวอร์ชันที่แน่นอน** หรือ **dist-tag** ที่ไม่บังคับ) Git/URL/file specs และช่วง semver จะถูกปฏิเสธ การติดตั้ง dependency รันแบบ project-local พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้ shell ของคุณจะมีการตั้งค่า npm install แบบ global ก็ตาม ราก npm ของ plugin ที่จัดการจะสืบทอด `overrides` ของ npm ระดับแพ็กเกจของ OpenClaw ดังนั้น security pins ของโฮสต์จึงใช้กับ dependencies ของ plugin ที่ถูก hoist ด้วย

    ใช้ `npm:<package>` เมื่อคุณต้องการทำให้การ resolve ของ npm ชัดเจน Bare package specs จะติดตั้งโดยตรงจาก npm ระหว่างช่วงเปลี่ยนผ่านการเปิดตัวด้วย

    Bare specs และ `@latest` จะคงอยู่บนแทร็กเสถียร เวอร์ชันแก้ไขแบบประทับวันที่ของ OpenClaw เช่น `2026.5.3-1` เป็นรุ่นเสถียรสำหรับการตรวจนี้ หาก npm resolve รายการใดรายการหนึ่งเป็น prerelease OpenClaw จะหยุดและขอให้คุณ opt in อย่างชัดเจนด้วย tag prerelease เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease ที่แน่นอน เช่น `@1.2.3-beta.4`

    หาก install spec แบบเปล่าตรงกับ id ของ plugin ทางการ (เช่น `diffs`) OpenClaw จะติดตั้งรายการแค็ตตาล็อกโดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่มีชื่อเดียวกัน ให้ใช้ scoped spec แบบชัดเจน (เช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="รีโพสitories Git">
    ใช้ `git:<repo>` เพื่อติดตั้งโดยตรงจาก git repository รูปแบบที่รองรับรวมถึง `git:github.com/owner/repo`, `git:owner/repo`, clone URLs แบบเต็ม `https://`, `ssh://`, `git://`, `file://` และ `git@host:owner/repo.git` เพิ่ม `@<ref>` หรือ `#<ref>` เพื่อ checkout branch, tag หรือ commit ก่อนติดตั้ง

    การติดตั้ง Git จะ clone ไปยังไดเรกทอรีชั่วคราว checkout ref ที่ร้องขอเมื่อมี แล้วใช้ตัวติดตั้งไดเรกทอรี plugin ปกติ นั่นหมายความว่าการตรวจสอบแมนิเฟสต์ การสแกนโค้ดอันตราย งานติดตั้ง package-manager และระเบียนการติดตั้งจะทำงานเหมือนการติดตั้ง npm การติดตั้ง git ที่บันทึกไว้จะรวม URL/ref แหล่งที่มาและ commit ที่ resolve แล้ว เพื่อให้ `openclaw plugins update` สามารถ resolve แหล่งที่มาอีกครั้งภายหลัง

    หลังติดตั้งจาก git ให้ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อตรวจสอบการลงทะเบียน runtime เช่น gateway methods และคำสั่ง CLI หาก plugin ลงทะเบียน root ของ CLI ด้วย `api.registerCli` ให้เรียกคำสั่งนั้นโดยตรงผ่าน root CLI ของ OpenClaw เช่น `openclaw demo-plugin ping`

  </Accordion>
  <Accordion title="อาร์ไคฟ์">
    อาร์ไคฟ์ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` อาร์ไคฟ์ plugin แบบเนทีฟของ OpenClaw ต้องมี `openclaw.plugin.json` ที่ถูกต้องที่รากของ plugin หลังแตกไฟล์; อาร์ไคฟ์ที่มีเพียง `package.json` จะถูกปฏิเสธก่อนที่ OpenClaw จะเขียนระเบียนการติดตั้ง

    ใช้ `npm-pack:<path.tgz>` เมื่อไฟล์เป็น tarball ของ npm-pack และคุณต้องการ
    ทดสอบเส้นทางติดตั้งราก npm ที่จัดการแบบเดียวกับที่ใช้ในการติดตั้งจากรีจิสทรี
    รวมถึงการตรวจสอบ `package-lock.json` การสแกน dependency ที่ถูก hoist และ
    ระเบียน npm install พาธอาร์ไคฟ์ปกติยังคงติดตั้งเป็นอาร์ไคฟ์ในเครื่อง
    ภายใต้รากส่วนขยาย plugin

    รองรับการติดตั้ง marketplace ของ Claude ด้วย

  </Accordion>
</AccordionGroup>

การติดตั้ง ClawHub ใช้ locator `clawhub:<package>` แบบชัดเจน:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Plugin specs แบบ npm-safe ที่ไม่ระบุแหล่งจะติดตั้งจาก npm ตามค่าเริ่มต้นระหว่างช่วงเปลี่ยนผ่านการเปิดตัว:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อทำให้การ resolve แบบ npm-only ชัดเจน:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw ตรวจสอบความเข้ากันได้ของ API plugin / gateway ขั้นต่ำที่ประกาศไว้ก่อนติดตั้ง เมื่อเวอร์ชัน ClawHub ที่เลือกเผยแพร่อาร์ติแฟกต์ ClawPack OpenClaw จะดาวน์โหลด `.tgz` ของ npm-pack ตามเวอร์ชัน ตรวจสอบส่วนหัว digest ของ ClawHub และ digest ของอาร์ติแฟกต์ แล้วติดตั้งผ่านเส้นทางอาร์ไคฟ์ปกติ เวอร์ชัน ClawHub ที่เก่ากว่าซึ่งไม่มี metadata ของ ClawPack ยังคงติดตั้งผ่านเส้นทางตรวจสอบอาร์ไคฟ์แพ็กเกจแบบ legacy การติดตั้งที่บันทึกไว้จะเก็บ metadata แหล่งที่มาของ ClawHub ชนิดอาร์ติแฟกต์ npm integrity, npm shasum, ชื่อ tarball และข้อเท็จจริง digest ของ ClawPack ไว้สำหรับอัปเดตภายหลัง
การติดตั้ง ClawHub แบบไม่ระบุเวอร์ชันจะเก็บ spec ที่บันทึกไว้แบบไม่ระบุเวอร์ชัน เพื่อให้ `openclaw plugins update` สามารถตามรุ่นใหม่ของ ClawHub ได้; ตัวเลือกเวอร์ชันหรือ tag แบบชัดเจน เช่น `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` จะยังคง pin กับตัวเลือกนั้น

#### ชวเลข marketplace

ใช้ชวเลข `plugin@marketplace` เมื่อชื่อ marketplace มีอยู่ใน cache รีจิสทรีในเครื่องของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

ใช้ `--marketplace` เมื่อคุณต้องการส่งแหล่งที่มาของ Marketplace อย่างชัดเจน:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - ชื่อ Marketplace ที่ Claude รู้จักจาก `~/.claude/plugins/known_marketplaces.json`
    - รูท Marketplace ภายในเครื่องหรือพาธ `marketplace.json`
    - ชื่อย่อ repo ของ GitHub เช่น `owner/repo`
    - URL ของ repo บน GitHub เช่น `https://github.com/owner/repo`
    - URL ของ git

  </Tab>
  <Tab title="Remote marketplace rules">
    สำหรับ Marketplace ระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องอยู่ภายใน repo Marketplace ที่โคลนมา OpenClaw ยอมรับแหล่งที่มาแบบพาธสัมพัทธ์จาก repo นั้น และปฏิเสธแหล่งที่มา Plugin แบบ HTTP(S), พาธแบบสัมบูรณ์, git, GitHub และแหล่งที่มา Plugin อื่นที่ไม่ใช่พาธจาก manifest ระยะไกล
  </Tab>
</Tabs>

สำหรับพาธและไฟล์ archive ภายในเครื่อง OpenClaw จะตรวจหาโดยอัตโนมัติ:

- Plugin แบบ native ของ OpenClaw (`openclaw.plugin.json`)
- bundle ที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- bundle ที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือเลย์เอาต์คอมโพเนนต์เริ่มต้นของ Claude)
- bundle ที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

<Note>
bundle ที่เข้ากันได้จะติดตั้งลงในรูท Plugin ปกติ และเข้าร่วมในโฟลว์ list/info/enable/disable เดียวกัน ปัจจุบันรองรับ bundle skills, command-skills ของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` / `lspServers` ที่ประกาศใน manifest ของ Claude, command-skills ของ Cursor และไดเรกทอรี hook ของ Codex ที่เข้ากันได้; ความสามารถอื่นของ bundle ที่ตรวจพบจะแสดงใน diagnostics/info แต่ยังไม่ได้เชื่อมเข้ากับการทำงาน runtime
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
  เปลี่ยนจากมุมมองตารางเป็นบรรทัดรายละเอียดราย Plugin พร้อม metadata ของ source/origin/version/activation
</ParamField>
<ParamField path="--json" type="boolean">
  inventory ที่อ่านได้ด้วยเครื่อง พร้อม diagnostics ของ registry และสถานะการติดตั้ง dependency ของ package
</ParamField>

<Note>
`plugins list` อ่าน registry ของ Plugin ภายในเครื่องที่บันทึกไว้ก่อน โดยมี fallback ที่สร้างจาก manifest เท่านั้นเมื่อ registry หายไปหรือไม่ถูกต้อง คำสั่งนี้มีประโยชน์สำหรับตรวจว่า Plugin ติดตั้งแล้ว เปิดใช้งานแล้ว และมองเห็นได้ในการวางแผน cold startup หรือไม่ แต่ไม่ใช่การ probe runtime สดของโปรเซส Gateway ที่กำลังทำงานอยู่ หลังจากเปลี่ยนโค้ด Plugin, enablement, นโยบาย hook หรือ `plugins.load.paths` ให้รีสตาร์ท Gateway ที่ให้บริการ channel ก่อนคาดหวังให้โค้ด `register(api)` หรือ hook ใหม่ทำงาน สำหรับการ deploy ระยะไกล/คอนเทนเนอร์ ให้ตรวจสอบว่าคุณกำลังรีสตาร์ท child `openclaw gateway run` จริง ไม่ใช่แค่โปรเซส wrapper

`plugins list --json` รวม `dependencyStatus` ของแต่ละ Plugin จาก `package.json`
`dependencies` และ `optionalDependencies` OpenClaw ตรวจว่าชื่อ package เหล่านั้นมีอยู่ตามพาธ lookup `node_modules` ปกติของ Node สำหรับ Plugin หรือไม่; จะไม่นำเข้าโค้ด runtime ของ Plugin, รัน package manager หรือซ่อม dependency ที่หายไป
</Note>

`plugins search` คือการค้นหา catalog ระยะไกลของ ClawHub คำสั่งนี้ไม่ตรวจสอบสถานะภายในเครื่อง ไม่แก้ไข config ไม่ติดตั้ง package และไม่โหลดโค้ด runtime ของ Plugin ผลการค้นหารวมชื่อ package ของ ClawHub, family, channel, version, summary และคำแนะนำการติดตั้ง เช่น `openclaw plugins install clawhub:<package>`

สำหรับงาน Plugin ที่ bundle มาแล้วภายในอิมเมจ Docker แบบ packaged ให้ bind-mount ไดเรกทอรี source ของ Plugin ทับพาธ source แบบ packaged ที่ตรงกัน เช่น `/app/extensions/synology-chat` OpenClaw จะค้นพบ source overlay ที่ mount ไว้นั้นก่อน `/app/dist/extensions/synology-chat`; ไดเรกทอรี source ที่คัดลอกมาเฉย ๆ จะไม่ทำงาน เพื่อให้การติดตั้งแบบ packaged ปกติยังใช้ dist ที่ compile แล้ว

สำหรับการ debug runtime hook:

- `openclaw plugins inspect <id> --runtime --json` แสดง hook ที่ลงทะเบียนแล้วและ diagnostics จากรอบการตรวจสอบที่โหลด module แล้ว การตรวจสอบ runtime จะไม่ติดตั้ง dependency; ใช้ `openclaw doctor --fix` เพื่อล้างสถานะ dependency แบบ legacy หรือกู้คืน Plugin ที่ดาวน์โหลดได้ซึ่งหายไปและถูกอ้างอิงโดย config
- `openclaw gateway status --deep --require-rpc` ยืนยัน Gateway ที่เข้าถึงได้, service/process hints, พาธ config และสุขภาพ RPC
- hook การสนทนาที่ไม่ได้ bundle (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรีภายในเครื่อง (เพิ่มเข้า `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
ไม่รองรับ `--force` ร่วมกับ `--link` เพราะการติดตั้งแบบ linked จะใช้พาธ source ซ้ำแทนการคัดลอกทับเป้าหมายการติดตั้งที่จัดการอยู่

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึก spec แบบ exact ที่ resolve แล้ว (`name@version`) ในดัชนี Plugin ที่จัดการอยู่ ขณะที่พฤติกรรมเริ่มต้นยังคงไม่ pin
</Note>

### ดัชนี Plugin

metadata การติดตั้ง Plugin เป็นสถานะที่จัดการโดยเครื่อง ไม่ใช่ config ของผู้ใช้ การติดตั้งและการอัปเดตจะเขียนลงใน `plugins/installs.json` ใต้ไดเรกทอรีสถานะ OpenClaw ที่ใช้งานอยู่ map ระดับบนสุด `installRecords` คือแหล่งถาวรของ metadata การติดตั้ง รวมถึง record สำหรับ manifest ของ Plugin ที่เสียหรือหายไป array `plugins` คือ cache ของ cold registry ที่สร้างจาก manifest ไฟล์นี้มีคำเตือนห้ามแก้ไข และถูกใช้โดย `openclaw plugins update`, uninstall, diagnostics และ cold plugin registry

เมื่อ OpenClaw พบ record legacy `plugins.installs` ที่ส่งมากับ config ระบบจะย้าย record เหล่านั้นเข้าไปในดัชนี Plugin และลบคีย์ config; ถ้าการเขียนอย่างใดอย่างหนึ่งล้มเหลว record ใน config จะยังถูกเก็บไว้เพื่อไม่ให้ metadata การติดตั้งสูญหาย

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` ลบ record ของ Plugin ออกจาก `plugins.entries`, ดัชนี Plugin ที่บันทึกไว้, รายการ allow/deny ของ Plugin และรายการ linked `plugins.load.paths` เมื่อใช้ได้ เว้นแต่ตั้งค่า `--keep-files` การถอนการติดตั้งจะลบไดเรกทอรีติดตั้งแบบ managed ที่ติดตามอยู่ด้วยเมื่อไดเรกทอรีนั้นอยู่ภายในรูท extensions ของ Plugin ของ OpenClaw สำหรับ Plugin active memory ช่อง memory จะรีเซ็ตเป็น `memory-core`

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

การอัปเดตใช้กับการติดตั้ง Plugin ที่ติดตามอยู่ในดัชนี Plugin แบบ managed และการติดตั้ง hook-pack ที่ติดตามอยู่ใน `hooks.internal.installs`

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    เมื่อคุณส่ง id ของ Plugin OpenClaw จะใช้ spec การติดตั้งที่บันทึกไว้สำหรับ Plugin นั้นซ้ำ ซึ่งหมายความว่า dist-tags ที่เคยจัดเก็บไว้ เช่น `@beta` และเวอร์ชัน exact ที่ pin ไว้ จะยังถูกใช้ต่อในการรัน `update <id>` ครั้งถัดไป

    สำหรับการติดตั้ง npm คุณยังสามารถส่ง package spec ของ npm แบบชัดเจนพร้อม dist-tag หรือเวอร์ชัน exact ได้ OpenClaw จะ resolve ชื่อ package นั้นกลับไปยัง record ของ Plugin ที่ติดตามอยู่ อัปเดต Plugin ที่ติดตั้งนั้น และบันทึก spec ของ npm ใหม่สำหรับการอัปเดตแบบอิง id ในอนาคต

    การส่งชื่อ package ของ npm โดยไม่มีเวอร์ชันหรือ tag ก็จะ resolve กลับไปยัง record ของ Plugin ที่ติดตามอยู่เช่นกัน ใช้วิธีนี้เมื่อ Plugin ถูก pin ไว้กับเวอร์ชัน exact และคุณต้องการย้ายกลับไปยัง release line เริ่มต้นของ registry

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` ใช้ spec ของ Plugin ที่ติดตามอยู่ซ้ำ เว้นแต่คุณจะส่ง spec ใหม่ `openclaw update` ยังรู้จัก channel การอัปเดต OpenClaw ที่ใช้งานอยู่ด้วย: บน channel beta, record ของ Plugin แบบ default-line npm และ ClawHub จะลอง `@beta` ก่อน แล้วจึง fallback ไปยัง spec default/latest ที่บันทึกไว้หากไม่มี release beta ของ Plugin เวอร์ชัน exact และ tag ที่ระบุชัดเจนจะยัง pin อยู่กับ selector นั้น

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    ก่อนการอัปเดต npm แบบ live OpenClaw จะตรวจเวอร์ชัน package ที่ติดตั้งเทียบกับ metadata ใน registry ของ npm หากเวอร์ชันที่ติดตั้งและตัวตน artifact ที่บันทึกไว้ตรงกับเป้าหมายที่ resolve แล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด ไม่ติดตั้งใหม่ และไม่เขียน `openclaw.json` ใหม่

    เมื่อมี hash integrity ที่จัดเก็บไว้ และ hash ของ artifact ที่ fetch มาเปลี่ยนไป OpenClaw จะถือว่านั่นเป็น drift ของ artifact npm คำสั่ง interactive `openclaw plugins update` จะพิมพ์ hash ที่คาดหวังและ hash จริง แล้วถามยืนยันก่อนดำเนินการต่อ helper การอัปเดตแบบ non-interactive จะ fail closed เว้นแต่ caller จะส่งนโยบาย continuation อย่างชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` ยังใช้งานได้กับ `plugins update` เป็น override แบบ break-glass สำหรับผลบวกปลอมจาก built-in dangerous-code scan ระหว่างการอัปเดต Plugin คำสั่งนี้ยังคงไม่ข้าม policy block ของ `before_install` ของ Plugin หรือการ block จาก scan-failure และใช้ได้เฉพาะกับการอัปเดต Plugin ไม่ใช่การอัปเดต hook-pack
  </Accordion>
</AccordionGroup>

### ตรวจสอบ

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect แสดง identity, load status, source, manifest capabilities, policy flags, diagnostics, install metadata, bundle capabilities และการรองรับ server MCP หรือ LSP ที่ตรวจพบ โดยค่าเริ่มต้นจะไม่นำเข้า runtime ของ Plugin เพิ่ม `--runtime` เพื่อโหลด module ของ Plugin และรวม hook, tool, command, service, gateway method และ HTTP route ที่ลงทะเบียนแล้ว การตรวจสอบ runtime จะรายงาน dependency ของ Plugin ที่หายไปโดยตรง; การติดตั้งและการซ่อมแซมยังอยู่ใน `openclaw plugins install`, `openclaw plugins update` และ `openclaw doctor --fix`

คำสั่ง CLI ที่ Plugin เป็นเจ้าของจะติดตั้งเป็นกลุ่มคำสั่ง `openclaw` ระดับ root หลังจาก `inspect --runtime` แสดงคำสั่งใต้ `cliCommands` แล้ว ให้รันเป็น `openclaw <command> ...`; ตัวอย่างเช่น Plugin ที่ลงทะเบียน `demo-git` สามารถตรวจยืนยันด้วย `openclaw demo-git ping`

Plugin แต่ละตัวถูกจัดประเภทตามสิ่งที่ลงทะเบียนจริงที่ runtime:

- **plain-capability** — capability type เดียว (เช่น Plugin ที่เป็น provider เท่านั้น)
- **hybrid-capability** — capability type หลายแบบ (เช่น text + speech + images)
- **hook-only** — มีเฉพาะ hook ไม่มี capability หรือ surface
- **non-capability** — tools/commands/services แต่ไม่มี capability

ดู [รูปแบบ Plugin](/th/plugins/architecture#plugin-shapes) สำหรับรายละเอียดเพิ่มเติมเกี่ยวกับ capability model

<Note>
flag `--json` ส่งออกรายงานที่อ่านได้ด้วยเครื่อง เหมาะสำหรับ scripting และ auditing `inspect --all` แสดงตารางทั้ง fleet พร้อมคอลัมน์ shape, capability kinds, compatibility notices, bundle capabilities และสรุป hook `info` เป็น alias ของ `inspect`
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` รายงานข้อผิดพลาดการโหลด Plugin, diagnostics ของ manifest/discovery และ compatibility notices เมื่อทุกอย่างสะอาด ระบบจะพิมพ์ `No plugin issues detected.`

หาก Plugin ที่ตั้งค่าไว้มีอยู่บนดิสก์แต่ถูกบล็อกโดยการตรวจสอบ path-safety ของ loader การตรวจสอบ config จะเก็บ entry ของ Plugin ไว้และรายงานเป็น `present but blocked` ให้แก้ diagnostic ของ Plugin ที่ถูกบล็อกก่อนหน้า เช่น ownership ของพาธหรือสิทธิ์ world-writable แทนการลบ config `plugins.entries.<id>` หรือ `plugins.allow`

สำหรับ failure ด้าน module-shape เช่น export `register`/`activate` หายไป ให้รันซ้ำด้วย `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุป export-shape แบบกระชับใน output diagnostic

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

รีจิสทรี Plugin ในเครื่องคือโมเดลอ่านแบบเย็นที่คงอยู่ของ OpenClaw สำหรับข้อมูลระบุตัวตนของ Plugin ที่ติดตั้งแล้ว สถานะการเปิดใช้งาน เมตาดาต้าแหล่งที่มา และความเป็นเจ้าของการสนับสนุน การเริ่มทำงานปกติ การค้นหาเจ้าของผู้ให้บริการ การจัดประเภทการตั้งค่าช่องทาง และคลังรายการ Plugin สามารถอ่านข้อมูลนี้ได้โดยไม่ต้องนำเข้าโมดูลรันไทม์ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่ารีจิสทรีที่คงอยู่มีอยู่ เป็นปัจจุบัน หรือเก่าแล้ว ใช้ `--refresh` เพื่อสร้างใหม่จากดัชนี Plugin ที่คงอยู่ นโยบายการกำหนดค่า และเมตาดาต้า manifest/package นี่คือเส้นทางซ่อมแซม ไม่ใช่เส้นทางเปิดใช้งานรันไทม์

`openclaw doctor --fix` ยังซ่อมแซมความคลาดเคลื่อนของ npm ที่จัดการไว้และเกี่ยวข้องกับรีจิสทรีด้วย: หากแพ็กเกจ `@openclaw/*` ที่ไม่มีเจ้าของหรือถูกกู้คืนภายใต้ราก npm ของ Plugin ที่จัดการไว้บดบัง Plugin ที่มาพร้อมชุดติดตั้ง doctor จะลบแพ็กเกจเก่านั้นและสร้างรีจิสทรีใหม่ เพื่อให้การเริ่มทำงานตรวจสอบความถูกต้องกับ manifest ที่มาพร้อมชุดติดตั้ง

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็นสวิตช์ความเข้ากันได้แบบ break-glass ที่เลิกใช้แล้วสำหรับความล้มเหลวในการอ่านรีจิสทรี ควรใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix`; กลไกสำรองของตัวแปรสภาพแวดล้อมมีไว้เฉพาะสำหรับการกู้คืนการเริ่มทำงานในกรณีฉุกเฉินระหว่างการทยอยปล่อยการย้ายระบบเท่านั้น
</Warning>

### มาร์เก็ตเพลส

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

รายการมาร์เก็ตเพลสรับพาธมาร์เก็ตเพลสในเครื่อง, พาธ `marketplace.json`, ชวเลข GitHub เช่น `owner/repo`, URL รีโพ GitHub หรือ URL git ได้ `--json` จะแสดงป้ายกำกับแหล่งที่มาที่แก้ไขแล้ว รวมถึง manifest ของมาร์เก็ตเพลสและรายการ Plugin ที่แยกวิเคราะห์แล้ว

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [เอกสารอ้างอิง CLI](/th/cli)
- [Plugin จากชุมชน](/th/plugins/community)
