---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือบันเดิลที่เข้ากันได้
    - คุณต้องการดีบักความล้มเหลวในการโหลด Plugin
sidebarTitle: Plugins
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-07T01:51:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43d51a8ecc2d420991e7beb585cbf3046d44cd6dca755377f4c050c7a155064
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Gateway plugins, ชุด hook และบันเดิลที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="ระบบ Plugin" href="/th/tools/plugin">
    คู่มือสำหรับผู้ใช้ปลายทางในการติดตั้ง เปิดใช้งาน และแก้ไขปัญหา plugins
  </Card>
  <Card title="จัดการ plugins" href="/th/plugins/manage-plugins">
    ตัวอย่างสั้น ๆ สำหรับการติดตั้ง แสดงรายการ อัปเดต ถอนการติดตั้ง และเผยแพร่
  </Card>
  <Card title="บันเดิล Plugin" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของบันเดิล
  </Card>
  <Card title="แมนิเฟสต์ Plugin" href="/th/plugins/manifest">
    ฟิลด์ของแมนิเฟสต์และสคีมาการกำหนดค่า
  </Card>
  <Card title="ความปลอดภัย" href="/th/gateway/security">
    การเสริมความแข็งแกร่งด้านความปลอดภัยสำหรับการติดตั้ง plugin
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

สำหรับการตรวจสอบการติดตั้ง การตรวจสอบ การถอนการติดตั้ง หรือการรีเฟรชรีจิสทรีที่ช้า ให้รัน
คำสั่งพร้อม `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` trace จะเขียนเวลาของแต่ละเฟส
ไปยัง stderr และยังคงทำให้เอาต์พุต JSON แยกวิเคราะห์ได้ ดู [การดีบัก](/th/help/debugging#plugin-lifecycle-trace)

<Note>
ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) ตัวเปลี่ยนแปลงวงจรชีวิตของ plugin จะถูกปิดใช้งาน ใช้แหล่งที่มาของ Nix สำหรับการติดตั้งนี้แทน `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` หรือ `plugins disable`; สำหรับ nix-openclaw ให้ใช้ [เริ่มต้นอย่างรวดเร็ว](https://github.com/openclaw/nix-openclaw#quick-start) แบบยึด agent เป็นหลัก
</Note>

<Note>
plugins ที่บันเดิลมาพร้อมกับ OpenClaw บางรายการถูกเปิดใช้งานโดยค่าเริ่มต้น (เช่น ผู้ให้บริการโมเดลที่บันเดิลมา ผู้ให้บริการเสียงพูดที่บันเดิลมา และ plugin เบราว์เซอร์ที่บันเดิลมา); รายการอื่นต้องใช้ `plugins enable`

plugins ของ OpenClaw แบบเนทีฟต้องมาพร้อม `openclaw.plugin.json` ที่มี JSON Schema แบบอินไลน์ (`configSchema` แม้ว่าจะว่างเปล่าก็ตาม) บันเดิลที่เข้ากันได้จะใช้แมนิเฟสต์บันเดิลของตนเองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุตรายการ/ข้อมูลแบบละเอียดจะแสดงชนิดย่อยของบันเดิลด้วย (`codex`, `claude` หรือ `cursor`) พร้อมความสามารถของบันเดิลที่ตรวจพบ
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
ชื่อแพ็กเกจแบบเปล่าจะติดตั้งจาก npm โดยค่าเริ่มต้นระหว่างช่วงเปลี่ยนผ่านการเปิดตัว ใช้ `clawhub:<package>` สำหรับ ClawHub ปฏิบัติต่อการติดตั้ง plugin เหมือนการรันโค้ด ควรใช้เวอร์ชันที่ปักหมุดไว้
</Warning>

`plugins search` คิวรี ClawHub เพื่อค้นหาแพ็กเกจ plugin ที่ติดตั้งได้ และพิมพ์
ชื่อแพ็กเกจที่พร้อมติดตั้ง โดยค้นหาแพ็กเกจ code-plugin และ bundle-plugin
ไม่ใช่ skills ใช้ `openclaw skills search` สำหรับ ClawHub skills

<Note>
ClawHub เป็นพื้นผิวหลักสำหรับการเผยแพร่และการค้นพบ plugins ส่วนใหญ่ Npm
ยังคงเป็นทางเลือกสำรองที่รองรับและเป็นเส้นทางติดตั้งโดยตรง แพ็กเกจ plugin
`@openclaw/*` ที่ OpenClaw เป็นเจ้าของถูกเผยแพร่บน npm อีกครั้งแล้ว; ดูรายการปัจจุบัน
ที่ [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) หรือ
[คลังรายการ plugin](/th/plugins/plugin-inventory) การติดตั้งเสถียรใช้ `latest`
การติดตั้งและอัปเดตช่องเบต้าจะเลือกใช้ dist-tag `beta` ของ npm เมื่อมีแท็กนั้น
จากนั้นจึง fallback ไปที่ `latest`
</Note>

<AccordionGroup>
  <Accordion title="Config includes และการซ่อมแซม config ที่ไม่ถูกต้อง">
    หากส่วน `plugins` ของคุณอ้างอิงด้วย `$include` แบบไฟล์เดียว `plugins install/update/enable/disable/uninstall` จะเขียนผ่านไปยังไฟล์ที่ include นั้น และปล่อย `openclaw.json` ไว้โดยไม่แตะต้อง Root includes, include arrays และ includes ที่มี sibling overrides จะล้มเหลวแบบปิดแทนการ flatten ดู [Config includes](/th/gateway/configuration) สำหรับรูปแบบที่รองรับ

    หาก config ไม่ถูกต้องระหว่างการติดตั้ง โดยปกติ `plugins install` จะล้มเหลวแบบปิดและบอกให้คุณรัน `openclaw doctor --fix` ก่อน ระหว่างการเริ่มต้น Gateway และ hot reload config ของ plugin ที่ไม่ถูกต้องจะล้มเหลวแบบปิดเหมือน config ที่ไม่ถูกต้องอื่น ๆ; `openclaw doctor --fix` สามารถกักกันรายการ plugin ที่ไม่ถูกต้องได้ ข้อยกเว้นระหว่างการติดตั้งเพียงรายการเดียวที่มีเอกสารกำกับคือเส้นทางกู้คืน plugin ที่บันเดิลมาแบบแคบ สำหรับ plugins ที่เลือกใช้ `openclaw.install.allowInvalidConfigRecovery` อย่างชัดเจน

  </Accordion>
  <Accordion title="--force และการติดตั้งซ้ำเทียบกับการอัปเดต">
    `--force` ใช้เป้าหมายการติดตั้งเดิมซ้ำและเขียนทับ plugin หรือชุด hook ที่ติดตั้งอยู่แล้วในที่เดิม ใช้เมื่อคุณตั้งใจติดตั้ง id เดิมซ้ำจาก local path, archive, แพ็กเกจ ClawHub หรือ artifact npm ใหม่ สำหรับการอัปเกรดตามปกติของ plugin npm ที่ติดตามอยู่แล้ว ควรใช้ `openclaw plugins update <id-or-npm-spec>`

    หากคุณรัน `plugins install` สำหรับ id ของ plugin ที่ติดตั้งแล้ว OpenClaw จะหยุดและชี้ให้คุณใช้ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดปกติ หรือ `plugins install <package> --force` เมื่อคุณต้องการเขียนทับการติดตั้งปัจจุบันจากแหล่งอื่นจริง ๆ

  </Accordion>
  <Accordion title="ขอบเขต --pin">
    `--pin` ใช้กับการติดตั้ง npm เท่านั้น ไม่รองรับกับการติดตั้ง `git:`; ใช้ git ref ที่ระบุชัดเจน เช่น `git:github.com/acme/plugin@v1.2.3` เมื่อคุณต้องการแหล่งที่มาที่ปักหมุดไว้ ไม่รองรับกับ `--marketplace` เพราะการติดตั้ง marketplace จะคง metadata แหล่งที่มาของ marketplace แทน spec ของ npm
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` เป็นตัวเลือก break-glass สำหรับ false positives ในตัวสแกนโค้ดอันตรายในตัว มันอนุญาตให้การติดตั้งดำเนินต่อไปได้แม้ตัวสแกนในตัวรายงานผลการค้นพบระดับ `critical` แต่จะ **ไม่** ข้ามบล็อกนโยบาย hook `before_install` ของ plugin และ **ไม่** ข้ามความล้มเหลวของการสแกน

    flag ของ CLI นี้ใช้กับ flow การติดตั้ง/อัปเดต plugin การติดตั้ง dependency ของ skill ที่รองรับโดย Gateway ใช้ request override `dangerouslyForceUnsafeInstall` ที่ตรงกัน ขณะที่ `openclaw skills install` ยังคงเป็น flow ดาวน์โหลด/ติดตั้ง skill ของ ClawHub แยกต่างหาก

    หาก plugin ที่คุณเผยแพร่บน ClawHub ถูกบล็อกโดยการสแกนรีจิสทรี ให้ใช้ขั้นตอนสำหรับผู้เผยแพร่ใน [ClawHub](/th/tools/clawhub)

  </Accordion>
  <Accordion title="ชุด hook และ npm specs">
    `plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับชุด hook ที่เปิดเผย `openclaw.hooks` ใน `package.json` ด้วย ใช้ `openclaw hooks` สำหรับการมองเห็น hook แบบกรองและการเปิดใช้งานราย hook ไม่ใช่การติดตั้งแพ็กเกจ

    Npm specs เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **เวอร์ชันที่แน่นอน** หรือ **dist-tag** ที่เลือกได้) Git/URL/file specs และช่วง semver จะถูกปฏิเสธ การติดตั้ง dependency จะรันแบบ project-local พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้ shell ของคุณจะมีการตั้งค่าติดตั้ง npm ระดับ global ก็ตาม ราก npm ของ plugin ที่จัดการอยู่จะสืบทอด `overrides` ของ npm ระดับแพ็กเกจของ OpenClaw ดังนั้น pin ความปลอดภัยของ host จึงใช้กับ dependency ของ plugin ที่ถูก hoist ด้วย

    ใช้ `npm:<package>` เมื่อคุณต้องการระบุการ resolve ของ npm ให้ชัดเจน Bare package specs จะติดตั้งโดยตรงจาก npm เช่นกันในช่วงเปลี่ยนผ่านการเปิดตัว

    Bare specs และ `@latest` จะอยู่บน track เสถียร เวอร์ชันแก้ไขเดิมของ OpenClaw เช่น `2026.5.3-1` ยังคงถูกถือเป็นรุ่นเสถียรสำหรับการตรวจนี้ เพื่อให้แพ็กเกจเก่ายังคงอัปเดตได้อย่างปลอดภัย งานสายซัพพอร์ตใหม่รายเดือนมีแผนใช้หมายเลข patch ของ SemVer ปกติแทน suffix การแก้ไขแบบ hyphen หาก npm resolve default-line spec เป็น prerelease OpenClaw จะหยุดและขอให้คุณเลือกใช้อย่างชัดเจนด้วยแท็ก prerelease เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease ที่แน่นอน เช่น `@1.2.3-beta.4`

    หาก bare install spec ตรงกับ id ของ plugin ทางการ (เช่น `diffs`) OpenClaw จะติดตั้งรายการ catalog โดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่มีชื่อเดียวกัน ให้ใช้ scoped spec ที่ชัดเจน (เช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="ที่เก็บ Git">
    ใช้ `git:<repo>` เพื่อติดตั้งโดยตรงจากที่เก็บ git รูปแบบที่รองรับรวมถึง URL โคลน `git:github.com/owner/repo`, `git:owner/repo`, `https://` แบบเต็ม, `ssh://`, `git://`, `file://` และ `git@host:owner/repo.git` เพิ่ม `@<ref>` หรือ `#<ref>` เพื่อ checkout branch, tag หรือ commit ก่อนติดตั้ง

    การติดตั้ง Git จะ clone ไปยังไดเรกทอรีชั่วคราว checkout ref ที่ร้องขอเมื่อมี จากนั้นใช้ตัวติดตั้งไดเรกทอรี plugin ตามปกติ นั่นหมายความว่า การตรวจสอบแมนิเฟสต์ การสแกนโค้ดอันตราย งานติดตั้งของ package-manager และบันทึกการติดตั้งจะทำงานเหมือนการติดตั้ง npm การติดตั้ง git ที่บันทึกไว้จะรวม URL/ref แหล่งที่มาและ commit ที่ resolve แล้ว เพื่อให้ `openclaw plugins update` สามารถ resolve แหล่งที่มาอีกครั้งได้ภายหลัง

    หลังติดตั้งจาก git ให้ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อตรวจสอบการลงทะเบียน runtime เช่นเมธอด gateway และคำสั่ง CLI หาก plugin ลงทะเบียนราก CLI ด้วย `api.registerCli` ให้เรียกใช้คำสั่งนั้นโดยตรงผ่าน root CLI ของ OpenClaw เช่น `openclaw demo-plugin ping`

  </Accordion>
  <Accordion title="Archives">
    Archives ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` Archives ของ plugin OpenClaw แบบเนทีฟต้องมี `openclaw.plugin.json` ที่ถูกต้องที่ราก plugin หลังแตกไฟล์; archives ที่มีเพียง `package.json` จะถูกปฏิเสธก่อนที่ OpenClaw จะเขียนบันทึกการติดตั้ง

    ใช้ `npm-pack:<path.tgz>` เมื่อไฟล์เป็น tarball ของ npm-pack และคุณต้องการ
    ทดสอบเส้นทางติดตั้ง npm-root ที่จัดการอยู่แบบเดียวกับที่การติดตั้งจากรีจิสทรีใช้
    รวมถึงการตรวจสอบ `package-lock.json`, การสแกน dependency ที่ถูก hoist และ
    บันทึกการติดตั้ง npm เส้นทาง archive แบบธรรมดายังคงติดตั้งเป็น local archives
    ใต้ราก extensions ของ plugin

    การติดตั้ง Claude marketplace ก็รองรับเช่นกัน

  </Accordion>
</AccordionGroup>

การติดตั้ง ClawHub ใช้ locator `clawhub:<package>` ที่ชัดเจน:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Bare plugin specs ที่ปลอดภัยสำหรับ npm จะติดตั้งจาก npm โดยค่าเริ่มต้นในช่วงเปลี่ยนผ่านการเปิดตัว:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อระบุการ resolve แบบ npm-only ให้ชัดเจน:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw ตรวจสอบ API ของ Plugin ที่ประกาศไว้ / ความเข้ากันได้ขั้นต่ำของ Gateway ก่อนติดตั้ง เมื่อเวอร์ชัน ClawHub ที่เลือกเผยแพร่ artifact ของ ClawPack แล้ว OpenClaw จะดาวน์โหลด npm-pack `.tgz` ที่มีเวอร์ชัน ตรวจสอบส่วนหัว digest ของ ClawHub และ digest ของ artifact จากนั้นติดตั้งผ่านเส้นทาง archive ปกติ เวอร์ชัน ClawHub ที่เก่ากว่าซึ่งไม่มี metadata ของ ClawPack จะยังติดตั้งผ่านเส้นทางตรวจสอบ package archive แบบเดิม การติดตั้งที่บันทึกไว้จะเก็บ metadata แหล่งที่มาจาก ClawHub, ชนิด artifact, npm integrity, npm shasum, ชื่อ tarball และข้อมูล digest ของ ClawPack ไว้สำหรับการอัปเดตภายหลัง
การติดตั้ง ClawHub แบบไม่ระบุเวอร์ชันจะเก็บ spec ที่บันทึกไว้แบบไม่ระบุเวอร์ชัน เพื่อให้ `openclaw plugins update` สามารถติดตามรุ่นใหม่กว่าของ ClawHub ได้ ส่วนตัวเลือกเวอร์ชันหรือแท็กแบบชัดเจน เช่น `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` จะยังถูกตรึงไว้กับตัวเลือกนั้น

#### ชวเลข Marketplace

ใช้ชวเลข `plugin@marketplace` เมื่อชื่อ marketplace มีอยู่ใน cache รีจิสทรีท้องถิ่นของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

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
    - root ของ marketplace ในเครื่องหรือ path ของ `marketplace.json`
    - ชวเลข repo ของ GitHub เช่น `owner/repo`
    - URL repo ของ GitHub เช่น `https://github.com/owner/repo`
    - URL ของ git

  </Tab>
  <Tab title="กฎของ Marketplace ระยะไกล">
    สำหรับ marketplace ระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องอยู่ภายใน repo marketplace ที่ clone มา OpenClaw ยอมรับแหล่งที่มาแบบ relative path จาก repo นั้น และปฏิเสธแหล่งที่มาของ Plugin แบบ HTTP(S), absolute-path, git, GitHub และแบบอื่นที่ไม่ใช่ path จาก manifest ระยะไกล
  </Tab>
</Tabs>

สำหรับ path ในเครื่องและ archive นั้น OpenClaw ตรวจจับโดยอัตโนมัติ:

- Plugin แบบเนทีฟของ OpenClaw (`openclaw.plugin.json`)
- bundle ที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- bundle ที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือ layout องค์ประกอบเริ่มต้นของ Claude)
- bundle ที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

<Note>
bundle ที่เข้ากันได้จะติดตั้งลงใน root ของ Plugin ปกติ และเข้าร่วม flow list/info/enable/disable เดียวกัน ปัจจุบันรองรับ Skills ของ bundle, command-skills ของ Claude, ค่าเริ่มต้นของ Claude `settings.json`, ค่าเริ่มต้นของ Claude `.lsp.json` / `lspServers` ที่ประกาศใน manifest, command-skills ของ Cursor และไดเรกทอรี hook ของ Codex ที่เข้ากันได้ ส่วนความสามารถอื่นของ bundle ที่ตรวจพบจะแสดงใน diagnostics/info แต่ยังไม่ได้เชื่อมเข้ากับการทำงาน runtime
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
  เปลี่ยนจากมุมมองตารางเป็นบรรทัดรายละเอียดราย Plugin พร้อม metadata แหล่งที่มา/ต้นทาง/เวอร์ชัน/การเปิดใช้งาน
</ParamField>
<ParamField path="--json" type="boolean">
  inventory แบบอ่านได้โดยเครื่อง พร้อม diagnostics ของรีจิสทรีและสถานะการติดตั้ง dependency ของ package
</ParamField>

<Note>
`plugins list` อ่านรีจิสทรี Plugin ในเครื่องที่ persisted ไว้ก่อน โดยมี fallback ที่ derive จาก manifest เท่านั้นเมื่อรีจิสทรีหายไปหรือไม่ถูกต้อง คำสั่งนี้มีประโยชน์สำหรับตรวจสอบว่า Plugin ถูกติดตั้ง เปิดใช้งาน และมองเห็นได้ต่อการวางแผน cold startup หรือไม่ แต่ไม่ใช่ probe runtime แบบสดของ process Gateway ที่กำลังทำงานอยู่ หลังจากเปลี่ยนโค้ด Plugin, การเปิดใช้งาน, นโยบาย hook หรือ `plugins.load.paths` ให้ restart Gateway ที่ให้บริการ channel ก่อนคาดหวังให้โค้ด `register(api)` หรือ hook ใหม่ทำงาน สำหรับ deployment ระยะไกล/container ให้ตรวจสอบว่าคุณกำลัง restart child ของ `openclaw gateway run` ตัวจริง ไม่ใช่เพียง process wrapper

`plugins list --json` รวม `dependencyStatus` ของแต่ละ Plugin จาก `package.json`
`dependencies` และ `optionalDependencies` OpenClaw ตรวจสอบว่าชื่อ package เหล่านั้นมีอยู่ตาม path lookup `node_modules` ปกติของ Node สำหรับ Plugin หรือไม่ โดยจะไม่ import โค้ด runtime ของ Plugin, ไม่รัน package manager และไม่ซ่อมแซม dependency ที่ขาดหาย
</Note>

`plugins search` เป็นการค้นหา catalog ClawHub ระยะไกล คำสั่งนี้ไม่ตรวจสอบสถานะในเครื่อง ไม่แก้ไข config ไม่ติดตั้ง package และไม่โหลดโค้ด runtime ของ Plugin ผลการค้นหารวมชื่อ package ของ ClawHub, family, channel, version, summary และคำแนะนำการติดตั้ง เช่น `openclaw plugins install clawhub:<package>`

สำหรับงาน Plugin ที่ bundle มาแล้วภายใน Docker image ที่ package แล้ว ให้ bind-mount ไดเรกทอรี source ของ Plugin ทับ path source ที่ package ตรงกัน เช่น `/app/extensions/synology-chat` OpenClaw จะค้นพบ overlay source ที่ mount ไว้นั้นก่อน `/app/dist/extensions/synology-chat`; ไดเรกทอรี source ที่คัดลอกมาเฉย ๆ จะยังไม่ทำงาน เพื่อให้การติดตั้งแบบ packaged ปกติยังใช้ dist ที่ compile แล้ว

สำหรับการ debug hook runtime:

- `openclaw plugins inspect <id> --runtime --json` แสดง hook ที่ register แล้วและ diagnostics จากรอบตรวจสอบที่โหลด module การตรวจสอบ runtime จะไม่ติดตั้ง dependency; ใช้ `openclaw doctor --fix` เพื่อล้างสถานะ dependency เก่า หรือกู้ Plugin ที่ดาวน์โหลดได้ซึ่งขาดหายและถูกอ้างถึงโดย config
- `openclaw gateway status --deep --require-rpc` ยืนยัน Gateway ที่เข้าถึงได้, คำใบ้ service/process, path config และสุขภาพ RPC
- hook การสนทนาที่ไม่ได้ bundle มา (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรีในเครื่อง (เพิ่มไปยัง `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
ไม่รองรับ `--force` ร่วมกับ `--link` เพราะการติดตั้งแบบ linked จะใช้ path source ซ้ำแทนการคัดลอกทับ target การติดตั้งแบบ managed

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึก spec ที่ resolve แล้วแบบตรงตัว (`name@version`) ในดัชนี Plugin แบบ managed โดยยังคงพฤติกรรมเริ่มต้นไว้เป็นแบบไม่ตรึง
</Note>

### ดัชนี Plugin

metadata การติดตั้ง Plugin เป็นสถานะที่จัดการโดยเครื่อง ไม่ใช่ config ของผู้ใช้ การติดตั้งและการอัปเดตจะเขียนข้อมูลนี้ไปยัง `plugins/installs.json` ภายใต้ไดเรกทอรีสถานะ OpenClaw ที่ active อยู่ map ระดับบนสุด `installRecords` เป็นแหล่งข้อมูลถาวรของ metadata การติดตั้ง รวมถึง record สำหรับ manifest ของ Plugin ที่เสียหรือหายไป array `plugins` คือ cache รีจิสทรี cold ที่ derive จาก manifest ไฟล์นี้มีคำเตือนห้ามแก้ไขและถูกใช้โดย `openclaw plugins update`, uninstall, diagnostics และรีจิสทรี Plugin แบบ cold

เมื่อ OpenClaw เห็น record `plugins.installs` แบบ legacy ที่ shipped มาใน config การอ่าน runtime จะปฏิบัติกับ record เหล่านั้นเป็น input สำหรับความเข้ากันได้โดยไม่เขียน `openclaw.json` ใหม่ การเขียน Plugin แบบชัดเจนและ `openclaw doctor --fix` จะย้าย record เหล่านั้นเข้าไปในดัชนี Plugin และลบ key config เมื่ออนุญาตให้เขียน config ได้ หากการเขียนใดล้มเหลว record ใน config จะถูกเก็บไว้เพื่อไม่ให้ metadata การติดตั้งสูญหาย

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` ลบ record ของ Plugin ออกจาก `plugins.entries`, ดัชนี Plugin ที่ persisted ไว้, รายการ allow/deny ของ Plugin และรายการ `plugins.load.paths` ที่ linked เมื่อเกี่ยวข้อง เว้นแต่ตั้งค่า `--keep-files` ไว้ uninstall จะลบไดเรกทอรีการติดตั้งแบบ managed ที่ติดตามอยู่ด้วย เมื่อไดเรกทอรีนั้นอยู่ภายใน root extensions ของ Plugin ของ OpenClaw สำหรับ Plugin หน่วยความจำ active ช่องหน่วยความจำจะ reset เป็น `memory-core`

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

การอัปเดตใช้กับการติดตั้ง Plugin ที่ติดตามอยู่ในดัชนี Plugin แบบ managed และการติดตั้ง hook-pack ที่ติดตามอยู่ใน `hooks.internal.installs`

<AccordionGroup>
  <Accordion title="การ resolve id ของ Plugin เทียบกับ spec ของ npm">
    เมื่อคุณส่ง id ของ Plugin OpenClaw จะนำ spec การติดตั้งที่บันทึกไว้ของ Plugin นั้นกลับมาใช้ ซึ่งหมายความว่า dist-tags ที่เก็บไว้ก่อนหน้า เช่น `@beta` และเวอร์ชันที่ตรึงแบบตรงตัว จะยังถูกใช้ต่อไปในการรัน `update <id>` ภายหลัง

    สำหรับการติดตั้ง npm คุณยังสามารถส่ง spec package npm แบบชัดเจนพร้อม dist-tag หรือเวอร์ชันตรงตัวได้ OpenClaw จะ resolve ชื่อ package นั้นกลับไปยัง record ของ Plugin ที่ติดตามอยู่ อัปเดต Plugin ที่ติดตั้งนั้น และบันทึก spec npm ใหม่สำหรับการอัปเดตตาม id ในอนาคต

    การส่งชื่อ package npm โดยไม่มีเวอร์ชันหรือแท็กก็จะ resolve กลับไปยัง record ของ Plugin ที่ติดตามอยู่เช่นกัน ใช้วิธีนี้เมื่อ Plugin ถูกตรึงไว้กับเวอร์ชันตรงตัว และคุณต้องการย้ายกลับไปยังสาย release เริ่มต้นของรีจิสทรี

  </Accordion>
  <Accordion title="การอัปเดต channel beta">
    `openclaw plugins update` นำ spec ของ Plugin ที่ติดตามอยู่กลับมาใช้ เว้นแต่คุณจะส่ง spec ใหม่ `openclaw update` ยังรู้จัก channel อัปเดต OpenClaw ที่ active อยู่ด้วย: บน channel beta, record Plugin ของ npm และ ClawHub ในสายเริ่มต้นจะลอง `@beta` ก่อน แล้ว fallback ไปยัง spec default/latest ที่บันทึกไว้ หากไม่มี release beta ของ Plugin เวอร์ชันตรงตัวและแท็กชัดเจนจะยังถูกตรึงไว้กับตัวเลือกนั้น

    OpenClaw ยังไม่เปิดเผย channel Plugin สำหรับการสนับสนุน LTS หรือรายเดือน งาน support-line ที่วางแผนไว้จะต้องให้ tag ของ package Plugin และ ClawHub ติดตาม support line เดียวกับ package core

  </Accordion>
  <Accordion title="การตรวจสอบเวอร์ชันและ integrity drift">
    ก่อนการอัปเดต npm แบบสด OpenClaw จะตรวจสอบเวอร์ชัน package ที่ติดตั้งเทียบกับ metadata รีจิสทรี npm หากเวอร์ชันที่ติดตั้งและตัวตน artifact ที่บันทึกไว้ตรงกับ target ที่ resolve แล้วอยู่แล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด ไม่ติดตั้งใหม่ และไม่เขียน `openclaw.json` ใหม่

    เมื่อมี integrity hash ที่เก็บไว้และ hash artifact ที่ fetch มาเปลี่ยนไป OpenClaw จะถือว่านั่นเป็น npm artifact drift คำสั่ง interactive `openclaw plugins update` จะพิมพ์ hash ที่คาดหวังและ hash จริง แล้วขอการยืนยันก่อนดำเนินการต่อ helper การอัปเดตแบบ non-interactive จะ fail closed เว้นแต่ caller จะระบุนโยบายการดำเนินการต่ออย่างชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install ในการอัปเดต">
    `--dangerously-force-unsafe-install` ยังมีให้ใช้กับ `plugins update` ในฐานะ override แบบ break-glass สำหรับ false positive ของการสแกน dangerous-code ในตัวระหว่างการอัปเดต Plugin โดยยังคงไม่ข้าม block จากนโยบาย `before_install` ของ Plugin หรือการ block จากความล้มเหลวของการสแกน และใช้ได้เฉพาะกับการอัปเดต Plugin ไม่ใช่การอัปเดต hook-pack
  </Accordion>
</AccordionGroup>

### ตรวจสอบ

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect แสดง identity, สถานะการโหลด, แหล่งที่มา, ความสามารถของ manifest, flag นโยบาย, diagnostics, metadata การติดตั้ง, ความสามารถของ bundle และการรองรับ server MCP หรือ LSP ที่ตรวจพบ โดยค่าเริ่มต้นจะไม่ import runtime ของ Plugin เพิ่ม `--runtime` เพื่อโหลด module ของ Plugin และรวม hook, tool, command, service, method ของ gateway และ HTTP route ที่ register แล้ว การตรวจสอบ runtime จะรายงาน dependency ของ Plugin ที่ขาดหายโดยตรง ส่วนการติดตั้งและซ่อมแซมยังอยู่ใน `openclaw plugins install`, `openclaw plugins update` และ `openclaw doctor --fix`

command CLI ที่ Plugin เป็นเจ้าของจะถูกติดตั้งเป็นกลุ่มคำสั่ง root `openclaw` หลังจาก `inspect --runtime` แสดง command ใต้ `cliCommands` แล้ว ให้รันเป็น `openclaw <command> ...`; ตัวอย่างเช่น Plugin ที่ register `demo-git` สามารถตรวจสอบได้ด้วย `openclaw demo-git ping`

แต่ละ Plugin ถูกจัดประเภทตามสิ่งที่ register จริงใน runtime:

- **plain-capability** — ประเภทความสามารถเดียว (เช่น Plugin ที่เป็นเฉพาะ provider)
- **hybrid-capability** — ความสามารถหลายประเภท (เช่น ข้อความ + เสียงพูด + รูปภาพ)
- **hook-only** — มีเฉพาะ hook ไม่มีความสามารถหรือพื้นผิว
- **non-capability** — เครื่องมือ/คำสั่ง/บริการ แต่ไม่มีความสามารถ

ดู [รูปแบบ Plugin](/th/plugins/architecture#plugin-shapes) สำหรับข้อมูลเพิ่มเติมเกี่ยวกับโมเดลความสามารถ

<Note>
แฟล็ก `--json` จะแสดงรายงานที่เครื่องอ่านได้ซึ่งเหมาะสำหรับการเขียนสคริปต์และการตรวจสอบ `inspect --all` จะแสดงตารางทั้ง fleet ที่มีคอลัมน์รูปแบบ ชนิดความสามารถ ประกาศความเข้ากันได้ ความสามารถของ bundle และสรุป hook `info` เป็น alias ของ `inspect`
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` รายงานข้อผิดพลาดในการโหลด Plugin การวินิจฉัย manifest/discovery และประกาศความเข้ากันได้ เมื่อทุกอย่างเรียบร้อย จะแสดง `No plugin issues detected.`

หาก Plugin ที่กำหนดค่าไว้มีอยู่บนดิสก์แต่ถูกบล็อกโดยการตรวจสอบความปลอดภัยของ path ของ loader การตรวจสอบ config จะเก็บรายการ Plugin ไว้และรายงานเป็น `present but blocked` ให้แก้การวินิจฉัย Plugin ที่ถูกบล็อกก่อนหน้านั้น เช่น ความเป็นเจ้าของ path หรือสิทธิ์แบบ world-writable แทนการลบ config `plugins.entries.<id>` หรือ `plugins.allow`

สำหรับความล้มเหลวของรูปแบบ module เช่น ไม่มี export `register`/`activate` ให้รันซ้ำพร้อม `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุปรูปแบบ export แบบย่อไว้ในผลลัพธ์การวินิจฉัย

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

registry Plugin ในเครื่องคือโมเดลอ่านแบบ cold ที่ OpenClaw เก็บถาวรไว้สำหรับตัวตนของ Plugin ที่ติดตั้ง การเปิดใช้งาน เมทาดาทาแหล่งที่มา และความเป็นเจ้าของ contribution การเริ่มต้นปกติ การค้นหาเจ้าของ provider การจัดประเภทการตั้งค่า channel และ inventory ของ Plugin สามารถอ่านได้โดยไม่ต้อง import module runtime ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่า registry ที่เก็บถาวรมีอยู่ เป็นปัจจุบัน หรือล้าสมัย ใช้ `--refresh` เพื่อสร้างใหม่จากดัชนี Plugin ที่เก็บถาวร นโยบาย config และเมทาดาทา manifest/package นี่เป็นเส้นทางซ่อมแซม ไม่ใช่เส้นทางเปิดใช้งาน runtime

`openclaw doctor --fix` ยังซ่อมแซมความคลาดเคลื่อนของ npm ที่จัดการอยู่ซึ่งอยู่ใกล้กับ registry ด้วย: หาก package `@openclaw/*` ที่กำพร้าหรือกู้คืนมาใต้ราก npm ของ Plugin ที่จัดการอยู่ไปบดบัง Plugin ที่ bundle มา doctor จะลบ package เก่านั้นและสร้าง registry ใหม่เพื่อให้การเริ่มต้นตรวจสอบกับ manifest ที่ bundle มา

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็นสวิตช์ความเข้ากันได้แบบ break-glass ที่เลิกใช้แล้วสำหรับความล้มเหลวในการอ่าน registry ควรใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix`; fallback ผ่าน env มีไว้เฉพาะสำหรับการกู้คืนการเริ่มต้นฉุกเฉินระหว่างที่ migration กำลัง rollout เท่านั้น
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

รายการ Marketplace รับ path ของ marketplace ในเครื่อง, path ของ `marketplace.json`, shorthand ของ GitHub เช่น `owner/repo`, URL repo ของ GitHub หรือ URL git `--json` จะแสดงป้ายกำกับแหล่งที่มาที่ resolve แล้ว พร้อม manifest ของ marketplace และรายการ Plugin ที่ parse แล้ว

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [อ้างอิง CLI](/th/cli)
- [Plugin จากชุมชน](/th/plugins/community)
