---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือบันเดิลที่เข้ากันได้
    - คุณต้องการดีบักความล้มเหลวในการโหลด Plugin
sidebarTitle: Plugins
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw plugins` (แสดงรายการ, ติดตั้ง, marketplace, ถอนการติดตั้ง, เปิดใช้งาน/ปิดใช้งาน, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-10T19:30:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6afa3ff12b3672d321d16c831672340ccde70b153671f2c328f578b5c66348b
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Plugin ของ Gateway, ชุด hook และ bundle ที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="ระบบ Plugin" href="/th/tools/plugin">
    คู่มือสำหรับผู้ใช้ปลายทางในการติดตั้ง เปิดใช้งาน และแก้ไขปัญหา Plugin
  </Card>
  <Card title="จัดการ Plugin" href="/th/plugins/manage-plugins">
    ตัวอย่างแบบรวดเร็วสำหรับติดตั้ง แสดงรายการ อัปเดต ถอนการติดตั้ง และเผยแพร่
  </Card>
  <Card title="Bundle ของ Plugin" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของ bundle
  </Card>
  <Card title="Manifest ของ Plugin" href="/th/plugins/manifest">
    ฟิลด์ของ manifest และสคีมาคอนฟิก
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

สำหรับการตรวจสอบการติดตั้ง การตรวจสอบ การถอนการติดตั้ง หรือการรีเฟรช registry ที่ช้า ให้รันคำสั่งพร้อม `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` trace จะเขียนเวลาของแต่ละช่วงไปยัง stderr และยังคงให้เอาต์พุต JSON แยกวิเคราะห์ได้ ดู [การดีบัก](/th/help/debugging#plugin-lifecycle-trace)

<Note>
ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) ตัวแก้ไขวงจรชีวิตของ Plugin จะถูกปิดใช้งาน ใช้ซอร์ส Nix สำหรับการติดตั้งนี้แทน `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` หรือ `plugins disable`; สำหรับ nix-openclaw ให้ใช้ [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) แบบ agent-first
</Note>

<Note>
Plugin ที่ bundle มาพร้อมกับ OpenClaw บางรายการเปิดใช้งานตามค่าเริ่มต้น (เช่น ผู้ให้บริการโมเดลที่ bundle มา, ผู้ให้บริการเสียงพูดที่ bundle มา และ Plugin เบราว์เซอร์ที่ bundle มา); รายการอื่นต้องใช้ `plugins enable`

Plugin ของ OpenClaw แบบ native ต้องจัดส่ง `openclaw.plugin.json` พร้อม JSON Schema แบบ inline (`configSchema` แม้จะว่างก็ตาม) bundle ที่เข้ากันได้จะใช้ manifest ของ bundle ของตัวเองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุตแบบ verbose ของ list/info จะแสดง subtype ของ bundle (`codex`, `claude` หรือ `cursor`) รวมถึงความสามารถของ bundle ที่ตรวจพบด้วย
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

ผู้ดูแลที่ทดสอบการติดตั้งในช่วง setup สามารถ override ซอร์สติดตั้ง Plugin อัตโนมัติด้วยตัวแปรสภาพแวดล้อมที่มีการป้องกัน ดู [การ override การติดตั้ง Plugin](/th/plugins/install-overrides)

<Warning>
ชื่อ package แบบ bare จะติดตั้งจาก npm ตามค่าเริ่มต้นในช่วงเปลี่ยนผ่านการเปิดตัว ใช้ `clawhub:<package>` สำหรับ ClawHub ให้ปฏิบัติกับการติดตั้ง Plugin เหมือนการรันโค้ด ควรใช้เวอร์ชันที่ pin ไว้
</Warning>

`plugins search` จะ query ClawHub เพื่อหา package ของ Plugin ที่ติดตั้งได้ และพิมพ์ชื่อ package ที่พร้อมติดตั้ง ระบบค้นหา package แบบ code-plugin และ bundle-plugin ไม่ใช่ Skills ใช้ `openclaw skills search` สำหรับ Skills บน ClawHub

<Note>
ClawHub เป็นพื้นที่หลักสำหรับการแจกจ่ายและการค้นพบ Plugin ส่วนใหญ่ Npm ยังคงเป็น fallback ที่รองรับและเป็นเส้นทางติดตั้งโดยตรง package ของ Plugin `@openclaw/*` ที่ OpenClaw เป็นเจ้าของถูกเผยแพร่บน npm อีกครั้งแล้ว; ดูรายการปัจจุบันได้ที่ [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) หรือ [คลังรายการ Plugin](/th/plugins/plugin-inventory) การติดตั้งแบบเสถียรใช้ `latest` การติดตั้งและอัปเดตในช่อง beta จะเลือกใช้ dist-tag `beta` ของ npm เมื่อมี tag นั้น จากนั้นจึง fallback ไปที่ `latest`
</Note>

<AccordionGroup>
  <Accordion title="Config includes และการซ่อมแซม config ที่ไม่ถูกต้อง">
    หากส่วน `plugins` ของคุณอิงกับ `$include` แบบไฟล์เดียว `plugins install/update/enable/disable/uninstall` จะเขียนทะลุไปยังไฟล์ที่ include นั้น และปล่อย `openclaw.json` ไว้ไม่แตะต้อง root includes, include arrays และ includes ที่มี sibling overrides จะ fail closed แทนการ flatten ดู [Config includes](/th/gateway/configuration) สำหรับรูปแบบที่รองรับ

    หาก config ไม่ถูกต้องระหว่างการติดตั้ง โดยปกติ `plugins install` จะ fail closed และบอกให้คุณรัน `openclaw doctor --fix` ก่อน ระหว่างการเริ่มต้น Gateway และ hot reload config ของ Plugin ที่ไม่ถูกต้องจะ fail closed เหมือน config ที่ไม่ถูกต้องอื่น ๆ; `openclaw doctor --fix` สามารถกักกันรายการ Plugin ที่ไม่ถูกต้องได้ ข้อยกเว้นในช่วงติดตั้งที่มีเอกสารระบุไว้เพียงอย่างเดียวคือเส้นทางกู้คืนแบบแคบสำหรับ Plugin ที่ bundle มา ซึ่งเลือกใช้ `openclaw.install.allowInvalidConfigRecovery` อย่างชัดเจน

  </Accordion>
  <Accordion title="--force และการติดตั้งซ้ำเทียบกับการอัปเดต">
    `--force` ใช้เป้าหมายการติดตั้งเดิมซ้ำ และเขียนทับ Plugin หรือชุด hook ที่ติดตั้งแล้วในที่เดิม ใช้เมื่อคุณตั้งใจติดตั้ง id เดิมซ้ำจาก local path, archive, package ของ ClawHub หรือ artifact ของ npm ใหม่ สำหรับการอัปเกรดตามปกติของ Plugin npm ที่ติดตามอยู่แล้ว ควรใช้ `openclaw plugins update <id-or-npm-spec>`

    หากคุณรัน `plugins install` สำหรับ id ของ Plugin ที่ติดตั้งแล้ว OpenClaw จะหยุดและชี้ให้คุณใช้ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติ หรือใช้ `plugins install <package> --force` เมื่อคุณต้องการเขียนทับการติดตั้งปัจจุบันจากซอร์สอื่นจริง ๆ

  </Accordion>
  <Accordion title="ขอบเขตของ --pin">
    `--pin` ใช้กับการติดตั้ง npm เท่านั้น ไม่รองรับกับการติดตั้ง `git:`; ใช้ git ref ที่ระบุชัดเจน เช่น `git:github.com/acme/plugin@v1.2.3` เมื่อคุณต้องการซอร์สที่ pin ไว้ ไม่รองรับกับ `--marketplace` เพราะการติดตั้งจาก marketplace จะเก็บ metadata ของซอร์ส marketplace แทน spec ของ npm
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` เป็นตัวเลือก break-glass สำหรับ false positive ในตัวสแกนโค้ดอันตรายที่มีมาในตัว มันอนุญาตให้การติดตั้งดำเนินต่อได้แม้ตัวสแกนที่มีมาในตัวจะรายงานผลระดับ `critical` แต่จะ **ไม่** ข้ามบล็อกตามนโยบาย hook `before_install` ของ Plugin และ **ไม่** ข้ามความล้มเหลวของการสแกน

    flag ของ CLI นี้ใช้กับ flow การติดตั้ง/อัปเดต Plugin การติดตั้ง dependency ของ Skills ที่มี Gateway รองรับใช้ request override `dangerouslyForceUnsafeInstall` ที่ตรงกัน ขณะที่ `openclaw skills install` ยังคงเป็น flow ดาวน์โหลด/ติดตั้ง Skills ของ ClawHub แยกต่างหาก

    หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกบล็อกโดยการสแกนของ registry ให้ใช้ขั้นตอนสำหรับผู้เผยแพร่ใน [ClawHub](/th/clawhub/security)

  </Accordion>
  <Accordion title="ชุด hook และ spec ของ npm">
    `plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับชุด hook ที่เปิดเผย `openclaw.hooks` ใน `package.json` ด้วย ใช้ `openclaw hooks` สำหรับการมองเห็น hook แบบกรองและการเปิดใช้งานราย hook ไม่ใช่สำหรับติดตั้ง package

    spec ของ npm เป็น **registry-only** (ชื่อ package + **เวอร์ชัน exact** หรือ **dist-tag** ที่ไม่บังคับ) spec แบบ Git/URL/file และช่วง semver จะถูกปฏิเสธ การติดตั้ง dependency จะรันแบบ project-local พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้ shell ของคุณจะมีการตั้งค่าติดตั้ง npm แบบ global ก็ตาม ราก npm ของ Plugin ที่จัดการโดยระบบจะสืบทอด `overrides` ระดับ package ของ OpenClaw ดังนั้น pin ด้านความปลอดภัยของ host จึงมีผลกับ dependency ของ Plugin ที่ hoist ด้วย

    ใช้ `npm:<package>` เมื่อคุณต้องการระบุการ resolve ของ npm ให้ชัดเจน spec ของ package แบบ bare จะติดตั้งโดยตรงจาก npm ในช่วงเปลี่ยนผ่านการเปิดตัวเช่นกัน

    spec แบบ bare และ `@latest` จะอยู่บนแทร็กเสถียร เวอร์ชันแก้ไขของ OpenClaw ที่ประทับวันที่ เช่น `2026.5.3-1` ถือเป็น release เสถียรสำหรับการตรวจสอบนี้ หาก npm resolve ค่าใดค่าหนึ่งไปเป็น prerelease OpenClaw จะหยุดและขอให้คุณ opt in อย่างชัดเจนด้วย tag prerelease เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease แบบ exact เช่น `@1.2.3-beta.4`

    หาก spec การติดตั้งแบบ bare ตรงกับ id ของ Plugin ทางการ (เช่น `diffs`) OpenClaw จะติดตั้งรายการ catalog โดยตรง หากต้องการติดตั้ง package npm ที่มีชื่อเดียวกัน ให้ใช้ spec แบบ scoped ที่ระบุชัดเจน (เช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="Repository Git">
    ใช้ `git:<repo>` เพื่อติดตั้งโดยตรงจาก repository git รูปแบบที่รองรับรวมถึง `git:github.com/owner/repo`, `git:owner/repo`, URL clone แบบเต็ม `https://`, `ssh://`, `git://`, `file://` และ `git@host:owner/repo.git` เพิ่ม `@<ref>` หรือ `#<ref>` เพื่อ checkout branch, tag หรือ commit ก่อนติดตั้ง

    การติดตั้งจาก Git จะ clone ไปยังไดเรกทอรีชั่วคราว checkout ref ที่ขอเมื่อมี แล้วใช้ตัวติดตั้งไดเรกทอรี Plugin ตามปกติ ซึ่งหมายความว่าการตรวจสอบ manifest, การสแกนโค้ดอันตราย, งานติดตั้งด้วย package-manager และระเบียนการติดตั้งจะทำงานเหมือนการติดตั้งจาก npm ระเบียนการติดตั้งจาก git จะรวม URL/ref ของซอร์ส พร้อม commit ที่ resolve ได้ เพื่อให้ `openclaw plugins update` สามารถ resolve ซอร์สใหม่ภายหลังได้

    หลังติดตั้งจาก git ให้ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อตรวจสอบการลงทะเบียน runtime เช่น method ของ Gateway และคำสั่ง CLI หาก Plugin ลงทะเบียน root ของ CLI ด้วย `api.registerCli` ให้ execute คำสั่งนั้นโดยตรงผ่าน CLI root ของ OpenClaw เช่น `openclaw demo-plugin ping`

  </Accordion>
  <Accordion title="Archive">
    archive ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` archive ของ Plugin OpenClaw แบบ native ต้องมี `openclaw.plugin.json` ที่ถูกต้องอยู่ที่ root ของ Plugin หลัง extract; archive ที่มีเพียง `package.json` จะถูกปฏิเสธก่อน OpenClaw จะเขียนระเบียนการติดตั้ง

    ใช้ `npm-pack:<path.tgz>` เมื่อไฟล์เป็น tarball ของ npm-pack และคุณต้องการทดสอบเส้นทางติดตั้ง npm-root ที่จัดการโดยระบบแบบเดียวกับที่ใช้ในการติดตั้งจาก registry รวมถึงการตรวจสอบ `package-lock.json`, การสแกน dependency ที่ hoist และระเบียนการติดตั้ง npm เส้นทาง archive แบบธรรมดายังคงติดตั้งเป็น archive ภายในเครื่องภายใต้ root ของส่วนขยาย Plugin

    รองรับการติดตั้งจาก marketplace ของ Claude ด้วย

  </Accordion>
</AccordionGroup>

การติดตั้ง ClawHub ใช้ locator `clawhub:<package>` ที่ระบุชัดเจน:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

spec ของ Plugin ที่ปลอดภัยสำหรับ npm แบบ bare จะติดตั้งจาก npm ตามค่าเริ่มต้นในช่วงเปลี่ยนผ่านการเปิดตัว:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อระบุ resolution แบบ npm-only ให้ชัดเจน:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw ตรวจสอบ API ของ Plugin ที่ประกาศไว้ / ความเข้ากันได้ขั้นต่ำของ Gateway ก่อนติดตั้ง เมื่อเวอร์ชัน ClawHub ที่เลือกเผยแพร่อาร์ติแฟกต์ ClawPack, OpenClaw จะดาวน์โหลด npm-pack `.tgz` แบบระบุเวอร์ชัน ตรวจสอบส่วนหัว digest ของ ClawHub และ digest ของอาร์ติแฟกต์ จากนั้นติดตั้งผ่านเส้นทางอาร์ไคฟ์ปกติ เวอร์ชัน ClawHub เก่าที่ไม่มีเมทาดาทา ClawPack ยังคงติดตั้งผ่านเส้นทางการตรวจสอบอาร์ไคฟ์แพ็กเกจแบบเดิม การติดตั้งที่บันทึกไว้จะเก็บเมทาดาทาแหล่งที่มา ClawHub, ชนิดอาร์ติแฟกต์, npm integrity, npm shasum, ชื่อ tarball และข้อเท็จจริง digest ของ ClawPack ไว้สำหรับการอัปเดตภายหลัง
การติดตั้ง ClawHub แบบไม่ระบุเวอร์ชันจะเก็บสเปกที่บันทึกไว้แบบไม่ระบุเวอร์ชัน เพื่อให้ `openclaw plugins update` สามารถติดตามรีลีส ClawHub ที่ใหม่กว่าได้; ตัวเลือกเวอร์ชันหรือแท็กที่ระบุชัดเจน เช่น `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` จะยังคงถูกตรึงไว้กับตัวเลือกนั้น

#### ชอร์ตแฮนด์ Marketplace

ใช้ชอร์ตแฮนด์ `plugin@marketplace` เมื่อชื่อ Marketplace มีอยู่ในแคชรีจิสทรีภายในของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="แหล่งที่มาของ Marketplace">
    - ชื่อ known-marketplace ของ Claude จาก `~/.claude/plugins/known_marketplaces.json`
    - รูท Marketplace ภายในหรือพาธ `marketplace.json`
    - ชอร์ตแฮนด์ repo ของ GitHub เช่น `owner/repo`
    - URL ของ repo GitHub เช่น `https://github.com/owner/repo`
    - URL ของ git

  </Tab>
  <Tab title="กฎของ Marketplace ระยะไกล">
    สำหรับ Marketplace ระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องอยู่ภายใน repo Marketplace ที่โคลนมา OpenClaw ยอมรับแหล่งที่มาแบบพาธสัมพัทธ์จาก repo นั้น และปฏิเสธ HTTP(S), พาธแบบสัมบูรณ์, git, GitHub และแหล่งที่มา Plugin อื่นที่ไม่ใช่พาธจาก manifest ระยะไกล
  </Tab>
</Tabs>

สำหรับพาธและอาร์ไคฟ์ภายในเครื่อง OpenClaw จะตรวจจับอัตโนมัติ:

- Plugin OpenClaw แบบเนทีฟ (`openclaw.plugin.json`)
- บันเดิลที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- บันเดิลที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือเลย์เอาต์คอมโพเนนต์เริ่มต้นของ Claude)
- บันเดิลที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

<Note>
บันเดิลที่เข้ากันได้จะติดตั้งลงในรูท Plugin ปกติ และเข้าร่วมโฟลว์ list/info/enable/disable เดียวกัน ปัจจุบันรองรับ Skills ของบันเดิล, command-skills ของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` / `lspServers` ที่ประกาศใน manifest ของ Claude, command-skills ของ Cursor และไดเรกทอรี hook ของ Codex ที่เข้ากันได้; ความสามารถอื่นของบันเดิลที่ตรวจพบจะแสดงใน diagnostics/info แต่ยังไม่ได้เชื่อมเข้ากับการทำงานใน runtime
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
  เปลี่ยนจากมุมมองตารางเป็นบรรทัดรายละเอียดต่อ Plugin พร้อมเมทาดาทา source/origin/version/activation
</ParamField>
<ParamField path="--json" type="boolean">
  อินเวนทอรีที่อ่านได้โดยเครื่อง พร้อม diagnostics ของรีจิสทรีและสถานะการติดตั้ง dependency ของแพ็กเกจ
</ParamField>

<Note>
`plugins list` อ่านรีจิสทรี Plugin ภายในที่ persist ไว้ก่อน โดยมี fallback ที่ derive จาก manifest เท่านั้นเมื่อรีจิสทรีหายไปหรือไม่ถูกต้อง สิ่งนี้มีประโยชน์สำหรับตรวจสอบว่า Plugin ถูกติดตั้ง เปิดใช้งาน และมองเห็นได้ในการวางแผน cold startup หรือไม่ แต่ไม่ใช่การ probe runtime สดของโปรเซส Gateway ที่กำลังทำงานอยู่ หลังจากเปลี่ยนโค้ด Plugin, การเปิดใช้งาน, นโยบาย hook หรือ `plugins.load.paths` ให้รีสตาร์ท Gateway ที่ให้บริการ channel ก่อนคาดหวังให้โค้ด `register(api)` หรือ hook ใหม่ทำงาน สำหรับการปรับใช้แบบระยะไกล/คอนเทนเนอร์ ให้ตรวจสอบว่าคุณกำลังรีสตาร์ท child `openclaw gateway run` ตัวจริง ไม่ใช่เพียงโปรเซส wrapper

`plugins list --json` รวม `dependencyStatus` ของแต่ละ Plugin จาก `package.json`
`dependencies` และ `optionalDependencies` OpenClaw ตรวจสอบว่าชื่อแพ็กเกจเหล่านั้น
ปรากฏอยู่ตามพาธ lookup `node_modules` ปกติของ Node สำหรับ Plugin หรือไม่; มัน
ไม่ import โค้ด runtime ของ Plugin, ไม่รัน package manager และไม่ซ่อมแซม
dependencies ที่ขาดหาย
</Note>

`plugins search` คือการ lookup แค็ตตาล็อก ClawHub ระยะไกล มันไม่ตรวจสอบสถานะภายในเครื่อง
ไม่เปลี่ยน config, ไม่ติดตั้งแพ็กเกจ และไม่โหลดโค้ด runtime ของ Plugin ผลลัพธ์การค้นหา
รวมชื่อแพ็กเกจ ClawHub, family, channel, version, summary และ
คำแนะนำการติดตั้ง เช่น `openclaw plugins install clawhub:<package>`

สำหรับงาน Plugin ที่บันเดิลอยู่ภายในอิมเมจ Docker แบบแพ็กเกจ ให้ bind-mount ไดเรกทอรี
ซอร์ส Plugin ทับพาธซอร์สที่แพ็กเกจไว้ซึ่งตรงกัน เช่น
`/app/extensions/synology-chat` OpenClaw จะค้นพบ overlay ของซอร์สที่ mount นั้น
ก่อน `/app/dist/extensions/synology-chat`; ไดเรกทอรีซอร์สที่คัดลอกแบบธรรมดา
จะไม่ทำงาน ดังนั้นการติดตั้งแบบแพ็กเกจปกติจะยังใช้ dist ที่คอมไพล์แล้ว

สำหรับการดีบัก hook runtime:

- `openclaw plugins inspect <id> --runtime --json` แสดง hook ที่ลงทะเบียนและ diagnostics จาก pass การตรวจสอบแบบโหลดโมดูล การตรวจสอบ runtime จะไม่ติดตั้ง dependencies; ใช้ `openclaw doctor --fix` เพื่อล้างสถานะ dependency เดิมหรือกู้คืน Plugin ที่ดาวน์โหลดได้ซึ่งขาดหายและถูกอ้างอิงโดย config
- `openclaw gateway status --deep --require-rpc` ยืนยัน Gateway ที่เข้าถึงได้, คำใบ้ service/process, พาธ config และสุขภาพ RPC
- hook การสนทนาที่ไม่ได้บันเดิล (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรีภายในเครื่อง (เพิ่มลงใน `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
ไม่รองรับ `--force` ร่วมกับ `--link` เพราะการติดตั้งแบบ linked จะใช้พาธซอร์สซ้ำแทนการคัดลอกทับเป้าหมายการติดตั้งที่จัดการไว้

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึกสเปกที่ resolve ได้แบบแน่นอน (`name@version`) ในดัชนี Plugin ที่จัดการไว้ ขณะที่ยังคงพฤติกรรมเริ่มต้นแบบไม่ตรึงไว้
</Note>

### ดัชนี Plugin

เมทาดาทาการติดตั้ง Plugin เป็นสถานะที่เครื่องจัดการ ไม่ใช่ config ของผู้ใช้ การติดตั้งและการอัปเดตจะเขียนไปยัง `plugins/installs.json` ใต้ไดเรกทอรีสถานะ OpenClaw ที่ใช้งานอยู่ แผนที่ `installRecords` ระดับบนสุดเป็นแหล่งข้อมูลถาวรของเมทาดาทาการติดตั้ง รวมถึงเรคคอร์ดสำหรับ manifest ของ Plugin ที่เสียหรือขาดหาย อาร์เรย์ `plugins` คือแคชรีจิสทรี cold ที่ derive จาก manifest ไฟล์มีคำเตือนห้ามแก้ไข และถูกใช้โดย `openclaw plugins update`, uninstall, diagnostics และรีจิสทรี Plugin แบบ cold

เมื่อ OpenClaw พบเรคคอร์ด `plugins.installs` แบบ legacy ที่ shipped ใน config การอ่าน runtime จะถือว่าเป็น input เพื่อความเข้ากันได้โดยไม่เขียน `openclaw.json` ใหม่ การเขียน Plugin อย่างชัดเจนและ `openclaw doctor --fix` จะย้ายเรคคอร์ดเหล่านั้นไปยังดัชนี Plugin และลบคีย์ config เมื่ออนุญาตให้เขียน config ได้; หากการเขียนใดล้มเหลว เรคคอร์ด config จะถูกเก็บไว้เพื่อไม่ให้เมทาดาทาการติดตั้งสูญหาย

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` ลบเรคคอร์ด Plugin ออกจาก `plugins.entries`, ดัชนี Plugin ที่ persist ไว้, รายการ allow/deny ของ Plugin และรายการ `plugins.load.paths` แบบ linked เมื่อเกี่ยวข้อง เว้นแต่ตั้งค่า `--keep-files` การถอนการติดตั้งจะลบไดเรกทอรีการติดตั้งที่จัดการและติดตามไว้ด้วย เมื่ออยู่ภายในรูทส่วนขยาย Plugin ของ OpenClaw สำหรับ Plugin active memory สล็อต memory จะรีเซ็ตเป็น `memory-core`

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

การอัปเดตใช้กับการติดตั้ง Plugin ที่ติดตามไว้ในดัชนี Plugin ที่จัดการ และการติดตั้ง hook-pack ที่ติดตามไว้ใน `hooks.internal.installs`

<AccordionGroup>
  <Accordion title="การ resolve id ของ Plugin เทียบกับสเปก npm">
    เมื่อคุณส่ง id ของ Plugin, OpenClaw จะใช้สเปกการติดตั้งที่บันทึกไว้สำหรับ Plugin นั้นซ้ำ หมายความว่า dist-tags ที่จัดเก็บไว้ก่อนหน้า เช่น `@beta` และเวอร์ชันที่ตรึงไว้แบบแน่นอน จะยังคงถูกใช้ในการรัน `update <id>` ครั้งถัดไป

    สำหรับการติดตั้ง npm คุณยังสามารถส่งสเปกแพ็กเกจ npm อย่างชัดเจนพร้อม dist-tag หรือเวอร์ชันที่แน่นอนได้ OpenClaw จะ resolve ชื่อแพ็กเกจนั้นกลับไปยังเรคคอร์ด Plugin ที่ติดตามไว้ อัปเดต Plugin ที่ติดตั้งนั้น และบันทึกสเปก npm ใหม่สำหรับการอัปเดตโดยใช้ id ในอนาคต

    การส่งชื่อแพ็กเกจ npm โดยไม่มีเวอร์ชันหรือแท็กจะ resolve กลับไปยังเรคคอร์ด Plugin ที่ติดตามไว้เช่นกัน ใช้สิ่งนี้เมื่อ Plugin ถูกตรึงไว้กับเวอร์ชันที่แน่นอน และคุณต้องการย้ายกลับไปยัง release line เริ่มต้นของรีจิสทรี

  </Accordion>
  <Accordion title="การอัปเดต channel beta">
    `openclaw plugins update` ใช้สเปก Plugin ที่ติดตามไว้ซ้ำ เว้นแต่คุณส่งสเปกใหม่ `openclaw update` ยังรู้จัก channel อัปเดต OpenClaw ที่ใช้งานอยู่ด้วย: บน channel beta เรคคอร์ด Plugin npm และ ClawHub บนเส้นค่าเริ่มต้นจะลอง `@beta` ก่อน จากนั้น fallback ไปยังสเปก default/latest ที่บันทึกไว้หากไม่มีรีลีส beta ของ Plugin เวอร์ชันที่แน่นอนและแท็กที่ระบุชัดเจนจะยังคงตรึงไว้กับตัวเลือกนั้น

  </Accordion>
  <Accordion title="การตรวจสอบเวอร์ชันและ integrity drift">
    ก่อนการอัปเดต npm แบบสด OpenClaw ตรวจสอบเวอร์ชันแพ็กเกจที่ติดตั้งเทียบกับเมทาดาทารีจิสทรี npm หากเวอร์ชันที่ติดตั้งและ identity ของอาร์ติแฟกต์ที่บันทึกไว้ตรงกับเป้าหมายที่ resolve ได้อยู่แล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน `openclaw.json` ใหม่

    เมื่อมี hash integrity ที่จัดเก็บไว้และ hash อาร์ติแฟกต์ที่ดึงมาเปลี่ยนแปลง OpenClaw จะถือว่านั่นเป็น npm artifact drift คำสั่ง `openclaw plugins update` แบบโต้ตอบจะพิมพ์ hash ที่คาดหวังและ hash จริง แล้วถามยืนยันก่อนดำเนินการต่อ helper อัปเดตแบบไม่โต้ตอบจะ fail closed เว้นแต่ caller จะส่งนโยบายการดำเนินการต่ออย่างชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install ในการอัปเดต">
    `--dangerously-force-unsafe-install` ยังพร้อมใช้งานบน `plugins update` ในฐานะ override แบบ break-glass สำหรับ false positive ของการสแกน dangerous-code ในตัวระหว่างการอัปเดต Plugin มันยังคงไม่ข้ามบล็อกนโยบาย `before_install` ของ Plugin หรือการบล็อกเมื่อสแกนล้มเหลว และใช้ได้เฉพาะกับการอัปเดต Plugin เท่านั้น ไม่ใช่การอัปเดต hook-pack
  </Accordion>
</AccordionGroup>

### ตรวจสอบ

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect แสดง identity, สถานะการโหลด, แหล่งที่มา, ความสามารถของ manifest, policy flags, diagnostics, เมทาดาทาการติดตั้ง, ความสามารถของบันเดิล และการรองรับเซิร์ฟเวอร์ MCP หรือ LSP ใดๆ ที่ตรวจพบ โดยค่าเริ่มต้นจะไม่ import runtime ของ Plugin เพิ่ม `--runtime` เพื่อโหลดโมดูล Plugin และรวม hook, tools, commands, services, gateway methods และ HTTP routes ที่ลงทะเบียนไว้ การตรวจสอบ runtime จะรายงาน dependencies ของ Plugin ที่ขาดหายโดยตรง; การติดตั้งและการซ่อมแซมยังคงอยู่ใน `openclaw plugins install`, `openclaw plugins update` และ `openclaw doctor --fix`

คำสั่ง CLI ที่ Plugin เป็นเจ้าของมักติดตั้งเป็นกลุ่มคำสั่ง `openclaw` ระดับรูท แต่ Plugin อาจลงทะเบียนคำสั่งซ้อนใต้ parent หลัก เช่น `openclaw nodes` ได้เช่นกัน หลังจาก `inspect --runtime` แสดงคำสั่งใต้ `cliCommands` ให้รันคำสั่งที่พาธที่แสดงไว้; ตัวอย่างเช่น Plugin ที่ลงทะเบียน `demo-git` สามารถตรวจสอบได้ด้วย `openclaw demo-git ping`

Plugin แต่ละตัวถูกจัดประเภทตามสิ่งที่มันลงทะเบียนจริงที่ runtime:

- **plain-capability** — ประเภทความสามารถเดียว (เช่น Plugin สำหรับ provider เท่านั้น)
- **hybrid-capability** — หลายประเภทความสามารถ (เช่น ข้อความ + เสียงพูด + รูปภาพ)
- **hook-only** — มีเฉพาะ hooks ไม่มีความสามารถหรือพื้นผิว
- **non-capability** — เครื่องมือ/คำสั่ง/บริการ แต่ไม่มีความสามารถ

ดู [รูปแบบของ Plugin](/th/plugins/architecture#plugin-shapes) สำหรับข้อมูลเพิ่มเติมเกี่ยวกับโมเดลความสามารถ

<Note>
แฟล็ก `--json` จะแสดงรายงานที่เครื่องอ่านได้ เหมาะสำหรับการเขียนสคริปต์และการตรวจสอบ `inspect --all` จะแสดงตารางทั้ง fleet พร้อมคอลัมน์รูปแบบ ชนิดความสามารถ ประกาศความเข้ากันได้ ความสามารถของบันเดิล และสรุป hooks `info` เป็นนามแฝงของ `inspect`
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` รายงานข้อผิดพลาดในการโหลด Plugin การวินิจฉัย manifest/discovery และประกาศความเข้ากันได้ เมื่อทุกอย่างเรียบร้อยจะแสดง `No plugin issues detected.`

หาก Plugin ที่กำหนดค่าไว้มีอยู่บนดิสก์แต่ถูกบล็อกโดยการตรวจสอบความปลอดภัยของพาธของ loader การตรวจสอบ config จะคงรายการ Plugin ไว้และรายงานว่า `present but blocked` ให้แก้การวินิจฉัย Plugin ที่ถูกบล็อกก่อนหน้า เช่น ความเป็นเจ้าของพาธหรือสิทธิ์แบบ world-writable แทนการลบ config `plugins.entries.<id>` หรือ `plugins.allow`

สำหรับความล้มเหลวด้านรูปแบบโมดูล เช่น ไม่มี export ของ `register`/`activate` ให้รันซ้ำพร้อม `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุปรูปแบบ export แบบย่อในผลลัพธ์การวินิจฉัย

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Plugin registry ภายในเครื่องคือโมเดลการอ่านแบบเย็นที่ OpenClaw เก็บถาวรไว้สำหรับตัวตนของ Plugin ที่ติดตั้ง การเปิดใช้งาน เมทาดาทาของแหล่งที่มา และความเป็นเจ้าของ contribution การเริ่มต้นตามปกติ การค้นหาเจ้าของ provider การจัดประเภทการตั้งค่า channel และคลัง Plugin สามารถอ่านได้โดยไม่ต้อง import โมดูล runtime ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่า registry ที่เก็บถาวรมีอยู่ เป็นปัจจุบัน หรือเก่าแล้ว ใช้ `--refresh` เพื่อสร้างใหม่จากดัชนี Plugin ที่เก็บถาวร นโยบาย config และเมทาดาทา manifest/package นี่คือพาธสำหรับซ่อมแซม ไม่ใช่พาธสำหรับเปิดใช้งาน runtime

`openclaw doctor --fix` ยังซ่อมแซม managed npm drift ที่อยู่ใกล้กับ registry ด้วย: หาก package `@openclaw/*` ที่ orphaned หรือกู้คืนมาใต้ root ของ managed plugin npm ไปบดบัง Plugin ที่บันเดิลไว้ doctor จะลบ package เก่านั้นและสร้าง registry ใหม่เพื่อให้การเริ่มต้นตรวจสอบกับ manifest ที่บันเดิลไว้

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็นสวิตช์ความเข้ากันได้แบบ break-glass ที่เลิกใช้แล้วสำหรับความล้มเหลวในการอ่าน registry ควรใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix`; env fallback มีไว้สำหรับการกู้คืนการเริ่มต้นในกรณีฉุกเฉินเท่านั้น ระหว่างที่ migration กำลัง rollout
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

รายการ Marketplace รับพาธ marketplace ภายในเครื่อง พาธ `marketplace.json` shorthand ของ GitHub เช่น `owner/repo` URL ของ repo GitHub หรือ URL ของ git `--json` จะแสดงป้ายกำกับแหล่งที่มาที่ resolve แล้ว พร้อม marketplace manifest และรายการ Plugin ที่ parse แล้ว

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [อ้างอิง CLI](/th/cli)
- [ClawHub](/th/clawhub)
