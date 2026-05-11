---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือบันเดิลที่เข้ากันได้
    - คุณต้องการดีบักปัญหาการโหลด Plugin ล้มเหลว
sidebarTitle: Plugins
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-11T20:27:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ad7d6341d6c2325bfef966b00ca1956f8b337fd0ffe40dba3384ed7eefd1285
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Plugin ของ Gateway, ชุด hook และบันเดิลที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="ระบบ Plugin" href="/th/tools/plugin">
    คู่มือผู้ใช้ปลายทางสำหรับการติดตั้ง เปิดใช้งาน และแก้ไขปัญหา Plugin
  </Card>
  <Card title="จัดการ Plugin" href="/th/plugins/manage-plugins">
    ตัวอย่างสั้นๆ สำหรับการติดตั้ง แสดงรายการ อัปเดต ถอนการติดตั้ง และเผยแพร่
  </Card>
  <Card title="บันเดิล Plugin" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของบันเดิล
  </Card>
  <Card title="แมนิเฟสต์ Plugin" href="/th/plugins/manifest">
    ฟิลด์ของแมนิเฟสต์และสคีมาคอนฟิก
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

สำหรับการตรวจสอบการติดตั้ง การ inspect การถอนการติดตั้ง หรือการ refresh registry ที่ช้า ให้รัน
คำสั่งพร้อม `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` trace จะเขียนเวลาแต่ละเฟส
ไปยัง stderr และยังคงทำให้เอาต์พุต JSON แยกวิเคราะห์ได้ ดู [การดีบัก](/th/help/debugging#plugin-lifecycle-trace)

<Note>
ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) ตัวเปลี่ยนแปลงวงจรชีวิต Plugin จะถูกปิดใช้งาน ใช้ซอร์ส Nix สำหรับการติดตั้งนี้แทน `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` หรือ `plugins disable`; สำหรับ nix-openclaw ให้ใช้ [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) แบบ agent-first
</Note>

<Note>
Plugin ที่บันเดิลมาพร้อมกับ OpenClaw จะถูกจัดส่งมากับ OpenClaw บางรายการเปิดใช้งานตามค่าเริ่มต้น (เช่น ผู้ให้บริการโมเดลที่บันเดิลมา ผู้ให้บริการเสียงพูดที่บันเดิลมา และ Plugin เบราว์เซอร์ที่บันเดิลมา); รายการอื่นต้องใช้ `plugins enable`

Plugin แบบ native ของ OpenClaw ต้องจัดส่ง `openclaw.plugin.json` พร้อม JSON Schema แบบ inline (`configSchema` แม้จะว่างก็ตาม) บันเดิลที่เข้ากันได้จะใช้แมนิเฟสต์บันเดิลของตนเองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุต verbose list/info ยังแสดงชนิดย่อยของบันเดิล (`codex`, `claude` หรือ `cursor`) พร้อมความสามารถของบันเดิลที่ตรวจพบด้วย
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

ผู้ดูแลที่ทดสอบการติดตั้งช่วงตั้งค่าสามารถ override ซอร์สติดตั้ง Plugin อัตโนมัติ
ด้วยตัวแปรสภาพแวดล้อมที่มี guard ได้ ดู
[การ override การติดตั้ง Plugin](/th/plugins/install-overrides)

<Warning>
ชื่อแพ็กเกจเปล่าๆ จะติดตั้งจาก npm ตามค่าเริ่มต้นระหว่างช่วงเปลี่ยนผ่านการเปิดตัว ใช้ `clawhub:<package>` สำหรับ ClawHub ปฏิบัติกับการติดตั้ง Plugin เหมือนการรันโค้ด ควรใช้เวอร์ชันที่ pin ไว้
</Warning>

`plugins search` query ClawHub เพื่อหาแพ็กเกจ Plugin ที่ติดตั้งได้ และพิมพ์
ชื่อแพ็กเกจที่พร้อมติดตั้ง โดยค้นหาแพ็กเกจ code-plugin และ bundle-plugin
ไม่ใช่ Skills ใช้ `openclaw skills search` สำหรับ Skills ของ ClawHub

<Note>
ClawHub เป็นพื้นผิวหลักสำหรับการกระจายและค้นพบ Plugin ส่วนใหญ่ Npm
ยังคงเป็น fallback ที่รองรับและเป็นเส้นทางติดตั้งโดยตรง แพ็กเกจ Plugin
`@openclaw/*` ที่ OpenClaw เป็นเจ้าของถูกเผยแพร่บน npm อีกครั้ง; ดูรายการปัจจุบัน
ที่ [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) หรือ
[คลังรายการ Plugin](/th/plugins/plugin-inventory) การติดตั้ง stable ใช้ `latest`
การติดตั้งและอัปเดตช่อง beta จะเลือกใช้ npm dist-tag `beta` เมื่อมี tag นั้น
จากนั้นจึง fallback ไปที่ `latest`
</Note>

<AccordionGroup>
  <Accordion title="Config includes และการซ่อมแซมคอนฟิกที่ไม่ถูกต้อง">
    หากส่วน `plugins` ของคุณมี `$include` แบบไฟล์เดียวหนุนอยู่ `plugins install/update/enable/disable/uninstall` จะเขียนทะลุไปยังไฟล์ที่ include นั้นและปล่อย `openclaw.json` ไว้โดยไม่แตะต้อง Root includes, include arrays และ includes ที่มี sibling overrides จะ fail closed แทนการ flatten ดู [Config includes](/th/gateway/configuration) สำหรับรูปแบบที่รองรับ

    หากคอนฟิกไม่ถูกต้องระหว่างติดตั้ง โดยปกติ `plugins install` จะ fail closed และบอกให้คุณรัน `openclaw doctor --fix` ก่อน ระหว่างการเริ่มต้น Gateway และ hot reload คอนฟิก Plugin ที่ไม่ถูกต้องจะ fail closed เหมือนคอนฟิกที่ไม่ถูกต้องอื่นๆ; `openclaw doctor --fix` สามารถ quarantine รายการ Plugin ที่ไม่ถูกต้องได้ ข้อยกเว้นช่วงติดตั้งเพียงรายการเดียวที่มีเอกสารคือเส้นทางกู้คืน Plugin ที่บันเดิลมาแบบแคบสำหรับ Plugin ที่ opt in อย่างชัดเจนใน `openclaw.install.allowInvalidConfigRecovery`

  </Accordion>
  <Accordion title="--force และการติดตั้งซ้ำเทียบกับการอัปเดต">
    `--force` ใช้เป้าหมายการติดตั้งเดิมซ้ำ และเขียนทับ Plugin หรือชุด hook ที่ติดตั้งแล้วในที่เดิม ใช้เมื่อคุณตั้งใจติดตั้ง id เดิมซ้ำจาก local path, archive, แพ็กเกจ ClawHub หรืออาร์ทิแฟกต์ npm ใหม่ สำหรับการอัปเกรดตามปกติของ Plugin npm ที่ติดตามอยู่แล้ว ควรใช้ `openclaw plugins update <id-or-npm-spec>`

    หากคุณรัน `plugins install` สำหรับ id ของ Plugin ที่ติดตั้งอยู่แล้ว OpenClaw จะหยุดและชี้คุณไปที่ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดปกติ หรือไปที่ `plugins install <package> --force` เมื่อคุณต้องการเขียนทับการติดตั้งปัจจุบันจากซอร์สอื่นจริงๆ

  </Accordion>
  <Accordion title="ขอบเขตของ --pin">
    `--pin` ใช้กับการติดตั้ง npm เท่านั้น ไม่รองรับกับการติดตั้ง `git:`; ใช้ git ref แบบชัดเจน เช่น `git:github.com/acme/plugin@v1.2.3` เมื่อคุณต้องการซอร์สที่ pin ไว้ ไม่รองรับกับ `--marketplace` เพราะการติดตั้ง marketplace จะคง metadata ของซอร์ส marketplace ไว้แทน npm spec
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` เป็นตัวเลือก break-glass สำหรับผลบวกลวงในตัวสแกนโค้ดอันตรายที่มีในตัว มันอนุญาตให้การติดตั้งดำเนินต่อได้แม้ตัวสแกนในตัวรายงาน finding ระดับ `critical` แต่จะ **ไม่** ข้ามการบล็อกนโยบาย hook `before_install` ของ Plugin และ **ไม่** ข้ามความล้มเหลวของการสแกน

    แฟล็ก CLI นี้ใช้กับ flow การติดตั้ง/อัปเดต Plugin การติดตั้ง dependency ของ skill ที่หนุนด้วย Gateway ใช้ request override ที่ตรงกันคือ `dangerouslyForceUnsafeInstall` ขณะที่ `openclaw skills install` ยังคงเป็น flow ดาวน์โหลด/ติดตั้ง skill ของ ClawHub แยกต่างหาก

    หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกบล็อกโดยการสแกน registry ให้ใช้ขั้นตอนสำหรับผู้เผยแพร่ใน [ClawHub](/th/clawhub/security)

  </Accordion>
  <Accordion title="ชุด hook และ npm specs">
    `plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับชุด hook ที่เปิดเผย `openclaw.hooks` ใน `package.json` ด้วย ใช้ `openclaw hooks` สำหรับการมองเห็น hook แบบกรองและการเปิดใช้งานราย hook ไม่ใช่การติดตั้งแพ็กเกจ

    Npm specs เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **เวอร์ชันที่แน่นอน** หรือ **dist-tag** แบบไม่บังคับ) Git/URL/file specs และ semver ranges จะถูกปฏิเสธ การติดตั้ง dependency รันแบบ project-local พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้ shell ของคุณจะมีการตั้งค่าติดตั้ง npm แบบ global ก็ตาม npm roots ของ Plugin ที่จัดการอยู่จะสืบทอด `overrides` ของ npm ระดับแพ็กเกจจาก OpenClaw ดังนั้น security pins ของ host จึงใช้กับ dependency ของ Plugin ที่ hoist แล้วด้วย

    ใช้ `npm:<package>` เมื่อคุณต้องการทำให้การ resolve ของ npm ชัดเจน Bare package specs จะติดตั้งโดยตรงจาก npm ระหว่างช่วงเปลี่ยนผ่านการเปิดตัวด้วย

    Bare specs และ `@latest` จะอยู่บน track stable เวอร์ชันแก้ไขแบบประทับวันที่ของ OpenClaw เช่น `2026.5.3-1` เป็น stable releases สำหรับการตรวจนี้ หาก npm resolve อย่างใดอย่างหนึ่งไปเป็น prerelease OpenClaw จะหยุดและขอให้คุณ opt in อย่างชัดเจนด้วย prerelease tag เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease ที่แน่นอน เช่น `@1.2.3-beta.4`

    หาก bare install spec ตรงกับ id ของ Plugin ทางการ (เช่น `diffs`) OpenClaw จะติดตั้งรายการในแคตตาล็อกโดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่มีชื่อเดียวกัน ให้ใช้ scoped spec ที่ชัดเจน (เช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="Git repositories">
    ใช้ `git:<repo>` เพื่อติดตั้งโดยตรงจาก git repository รูปแบบที่รองรับรวมถึง `git:github.com/owner/repo`, `git:owner/repo`, clone URL แบบเต็ม `https://`, `ssh://`, `git://`, `file://` และ `git@host:owner/repo.git` เพิ่ม `@<ref>` หรือ `#<ref>` เพื่อ check out branch, tag หรือ commit ก่อนติดตั้ง

    การติดตั้ง Git จะ clone ไปยังไดเรกทอรีชั่วคราว check out ref ที่ขอเมื่อมี จากนั้นใช้ตัวติดตั้งไดเรกทอรี Plugin ตามปกติ นั่นหมายความว่า การตรวจสอบแมนิเฟสต์ การสแกนโค้ดอันตราย งานติดตั้ง package-manager และ install records จะทำงานเหมือนการติดตั้ง npm การติดตั้ง git ที่บันทึกไว้จะรวม URL/ref ของซอร์สพร้อม commit ที่ resolve แล้ว เพื่อให้ `openclaw plugins update` สามารถ re-resolve ซอร์สได้ในภายหลัง

    หลังจากติดตั้งจาก git ให้ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อตรวจสอบ runtime registrations เช่น gateway methods และ CLI commands หาก Plugin ลงทะเบียน CLI root ด้วย `api.registerCli` ให้ execute คำสั่งนั้นโดยตรงผ่าน root CLI ของ OpenClaw เช่น `openclaw demo-plugin ping`

  </Accordion>
  <Accordion title="Archives">
    Archives ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` Archive ของ Plugin แบบ native ของ OpenClaw ต้องมี `openclaw.plugin.json` ที่ถูกต้องที่ root ของ Plugin หลังแตกไฟล์; archive ที่มีเพียง `package.json` จะถูกปฏิเสธก่อน OpenClaw เขียน install records

    ใช้ `npm-pack:<path.tgz>` เมื่อไฟล์เป็น tarball จาก npm-pack และคุณต้องการ
    ทดสอบเส้นทางติดตั้ง npm-root ที่จัดการอยู่แบบเดียวกับที่การติดตั้งจาก registry ใช้
    รวมถึงการตรวจสอบ `package-lock.json`, การสแกน dependency ที่ hoist แล้ว และ
    npm install records เส้นทาง archive ธรรมดายังคงติดตั้งเป็น local archives
    ใต้ root ของ extensions ของ Plugin

    รองรับการติดตั้ง Claude marketplace ด้วย

  </Accordion>
</AccordionGroup>

การติดตั้ง ClawHub ใช้ locator `clawhub:<package>` แบบชัดเจน:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Bare npm-safe plugin specs ติดตั้งจาก npm ตามค่าเริ่มต้นระหว่างช่วงเปลี่ยนผ่านการเปิดตัว:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อทำให้การ resolve แบบ npm-only ชัดเจน:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw ตรวจสอบ plugin API ที่ประกาศไว้ / ความเข้ากันได้ขั้นต่ำของ Gateway ก่อนติดตั้ง เมื่อเวอร์ชัน ClawHub ที่เลือกเผยแพร่ artifact แบบ ClawPack แล้ว OpenClaw จะดาวน์โหลด npm-pack `.tgz` แบบระบุเวอร์ชัน ตรวจสอบ header digest ของ ClawHub และ digest ของ artifact จากนั้นติดตั้งผ่านเส้นทาง archive ปกติ เวอร์ชัน ClawHub เก่าที่ไม่มี metadata ของ ClawPack จะยังติดตั้งผ่านเส้นทางการตรวจสอบ package archive แบบเดิม การติดตั้งที่บันทึกไว้จะเก็บ metadata แหล่งที่มาจาก ClawHub, ชนิด artifact, npm integrity, npm shasum, ชื่อ tarball และข้อเท็จจริง digest ของ ClawPack ไว้สำหรับการอัปเดตภายหลัง
การติดตั้ง ClawHub แบบไม่ระบุเวอร์ชันจะเก็บ spec ที่บันทึกไว้แบบไม่ระบุเวอร์ชัน เพื่อให้ `openclaw plugins update` สามารถตามรุ่น ClawHub ที่ใหม่กว่าได้ ตัวเลือกเวอร์ชันหรือแท็กแบบชัดเจน เช่น `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` จะยังคงถูกตรึงไว้กับตัวเลือกนั้น

#### ชวเลข Marketplace

ใช้ชวเลข `plugin@marketplace` เมื่อชื่อ marketplace มีอยู่ใน cache registry ภายในเครื่องของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

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
    - root ของ marketplace ภายในเครื่องหรือ path ของ `marketplace.json`
    - ชวเลข repo GitHub เช่น `owner/repo`
    - URL repo GitHub เช่น `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="กฎของ marketplace ระยะไกล">
    สำหรับ marketplace ระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องอยู่ภายใน repo marketplace ที่ clone มาเท่านั้น OpenClaw ยอมรับแหล่งที่มาแบบ relative path จาก repo นั้น และปฏิเสธแหล่งที่มา Plugin แบบ HTTP(S), absolute-path, git, GitHub และแหล่งที่มาอื่นที่ไม่ใช่ path จาก manifest ระยะไกล
  </Tab>
</Tabs>

สำหรับ path และ archive ภายในเครื่อง OpenClaw จะตรวจจับอัตโนมัติ:

- Plugin ของ OpenClaw แบบ native (`openclaw.plugin.json`)
- bundle ที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- bundle ที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือ layout component เริ่มต้นของ Claude)
- bundle ที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

<Note>
bundle ที่เข้ากันได้จะติดตั้งลงใน root ของ Plugin ปกติ และเข้าร่วมใน flow list/info/enable/disable เดียวกัน ปัจจุบันรองรับ bundle skills, command-skills ของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` / `lspServers` ที่ประกาศใน manifest ของ Claude, command-skills ของ Cursor และ directory hook ของ Codex ที่เข้ากันได้ ส่วนความสามารถ bundle อื่นที่ตรวจพบจะแสดงใน diagnostics/info แต่ยังไม่ได้เชื่อมเข้ากับการทำงาน runtime
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
  เปลี่ยนจากมุมมองตารางเป็นบรรทัดรายละเอียดราย Plugin พร้อม metadata ของ source/origin/version/activation
</ParamField>
<ParamField path="--json" type="boolean">
  inventory ที่เครื่องอ่านได้ พร้อม diagnostics ของ registry และสถานะการติดตั้ง dependency ของ package
</ParamField>

<Note>
`plugins list` อ่าน registry Plugin ภายในเครื่องที่ persist ไว้ก่อน โดยมี fallback ที่ derive จาก manifest เท่านั้นเมื่อ registry หายไปหรือไม่ถูกต้อง คำสั่งนี้มีประโยชน์สำหรับตรวจสอบว่า Plugin ติดตั้งแล้ว เปิดใช้งานแล้ว และมองเห็นได้ในการวางแผน cold startup หรือไม่ แต่ไม่ใช่ probe runtime สดของกระบวนการ Gateway ที่กำลังทำงานอยู่ หลังจากเปลี่ยน code ของ Plugin, enablement, policy ของ hook หรือ `plugins.load.paths` ให้ restart Gateway ที่ให้บริการ channel ก่อนคาดหวังให้ code `register(api)` หรือ hook ใหม่ทำงาน สำหรับ deployment ระยะไกล/container ให้ตรวจสอบว่าคุณกำลัง restart child ของ `openclaw gateway run` ตัวจริง ไม่ใช่แค่กระบวนการ wrapper

`plugins list --json` รวม `dependencyStatus` ของแต่ละ Plugin จาก `dependencies` และ `optionalDependencies` ใน `package.json` OpenClaw ตรวจสอบว่าชื่อ package เหล่านั้นมีอยู่ตาม path lookup `node_modules` ปกติของ Node สำหรับ Plugin หรือไม่ โดยไม่ import code runtime ของ Plugin, ไม่เรียก package manager และไม่ซ่อม dependency ที่ขาดหาย
</Note>

`plugins search` คือการ lookup catalog ของ ClawHub ระยะไกล คำสั่งนี้ไม่ตรวจสอบสถานะภายในเครื่อง ไม่แก้ config ไม่ติดตั้ง package และไม่โหลด code runtime ของ Plugin ผลลัพธ์การค้นหารวมชื่อ package ของ ClawHub, family, channel, version, summary และคำแนะนำการติดตั้ง เช่น `openclaw plugins install clawhub:<package>`

สำหรับงาน Plugin ที่ bundle มาใน packaged Docker image ให้ bind-mount directory แหล่งที่มาของ Plugin ทับ path แหล่งที่มาที่ package ไว้ซึ่งตรงกัน เช่น `/app/extensions/synology-chat` OpenClaw จะค้นพบ source overlay ที่ mount นั้นก่อน `/app/dist/extensions/synology-chat`; directory source ที่คัดลอกมาเฉยๆ จะยังไม่ทำงาน เพื่อให้การติดตั้งแบบ packaged ปกติยังใช้ dist ที่ compile แล้ว

สำหรับการ debug hook runtime:

- `openclaw plugins inspect <id> --runtime --json` แสดง hook ที่ register แล้วและ diagnostics จาก inspection pass ที่โหลด module แล้ว Runtime inspection จะไม่ติดตั้ง dependency ใช้ `openclaw doctor --fix` เพื่อล้างสถานะ dependency legacy หรือกู้คืน Plugin ที่ดาวน์โหลดได้ซึ่งขาดหายและถูกอ้างอิงโดย config
- `openclaw gateway status --deep --require-rpc` ยืนยัน Gateway ที่เข้าถึงได้, hint ของ service/process, path ของ config และสุขภาพ RPC
- hook การสนทนาที่ไม่ใช่ bundle (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอก directory ภายในเครื่อง (เพิ่มเข้า `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
ไม่รองรับ `--force` ร่วมกับ `--link` เพราะการติดตั้งแบบ linked จะนำ path แหล่งที่มากลับมาใช้แทนการคัดลอกทับ target การติดตั้งที่จัดการอยู่

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึก spec แบบ exact ที่ resolve แล้ว (`name@version`) ใน managed plugin index โดยยังคงพฤติกรรมเริ่มต้นแบบไม่ตรึงไว้
</Note>

### ดัชนี Plugin

metadata การติดตั้ง Plugin เป็นสถานะที่เครื่องจัดการ ไม่ใช่ config ของผู้ใช้ การติดตั้งและการอัปเดตจะเขียนไปยัง `plugins/installs.json` ภายใต้ directory สถานะ OpenClaw ที่ active อยู่ map `installRecords` ระดับบนสุดคือแหล่งข้อมูลถาวรของ metadata การติดตั้ง รวมถึง record สำหรับ manifest ของ Plugin ที่เสียหรือหายไป array `plugins` คือ cache registry แบบ cold ที่ derive จาก manifest ไฟล์นี้มีคำเตือนว่าอย่าแก้ไข และถูกใช้โดย `openclaw plugins update`, uninstall, diagnostics และ registry Plugin แบบ cold

เมื่อ OpenClaw พบ record `plugins.installs` legacy ที่ส่งมาพร้อม config การอ่าน runtime จะถือว่าเป็น input เพื่อความเข้ากันได้โดยไม่เขียน `openclaw.json` ใหม่ การเขียน Plugin แบบชัดเจนและ `openclaw doctor --fix` จะย้าย record เหล่านั้นเข้า plugin index และลบ key config เมื่ออนุญาตให้เขียน config ได้ หากการเขียนส่วนใดส่วนหนึ่งล้มเหลว record ใน config จะถูกเก็บไว้เพื่อไม่ให้ metadata การติดตั้งสูญหาย

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` ลบ record ของ Plugin ออกจาก `plugins.entries`, plugin index ที่ persist ไว้, รายการ allow/deny ของ Plugin และรายการ `plugins.load.paths` ที่ linked ไว้เมื่อเกี่ยวข้อง เว้นแต่ตั้งค่า `--keep-files` การถอนการติดตั้งจะลบ directory การติดตั้ง managed ที่ติดตามอยู่ด้วย เมื่ออยู่ภายใน root ของส่วนขยาย Plugin ของ OpenClaw สำหรับ active memory plugins slot หน่วยความจำจะรีเซ็ตเป็น `memory-core`

<Note>
รองรับ `--keep-config` ในฐานะ alias ที่ deprecated แล้วของ `--keep-files`
</Note>

### อัปเดต

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

การอัปเดตมีผลกับการติดตั้ง Plugin ที่ติดตามอยู่ใน managed plugin index และการติดตั้ง hook-pack ที่ติดตามอยู่ใน `hooks.internal.installs`

<AccordionGroup>
  <Accordion title="การ resolve plugin id เทียบกับ npm spec">
    เมื่อคุณส่ง plugin id OpenClaw จะใช้ install spec ที่บันทึกไว้สำหรับ Plugin นั้นซ้ำ นั่นหมายความว่า dist-tag ที่เคยเก็บไว้ เช่น `@beta` และเวอร์ชัน exact ที่ตรึงไว้ จะยังถูกใช้ต่อในการรัน `update <id>` ภายหลัง

    สำหรับการติดตั้ง npm คุณยังสามารถส่ง npm package spec แบบชัดเจนพร้อม dist-tag หรือเวอร์ชัน exact ได้ด้วย OpenClaw จะ resolve ชื่อ package นั้นกลับไปยัง record ของ Plugin ที่ติดตามอยู่ อัปเดต Plugin ที่ติดตั้งนั้น และบันทึก npm spec ใหม่สำหรับการอัปเดตตาม id ในอนาคต

    การส่งชื่อ npm package โดยไม่มีเวอร์ชันหรือแท็กจะ resolve กลับไปยัง record ของ Plugin ที่ติดตามอยู่เช่นกัน ใช้วิธีนี้เมื่อ Plugin ถูกตรึงไว้กับเวอร์ชัน exact และคุณต้องการย้ายกลับไปยัง release line เริ่มต้นของ registry

  </Accordion>
  <Accordion title="การอัปเดตช่อง beta">
    `openclaw plugins update` ใช้ spec ของ Plugin ที่ติดตามอยู่ซ้ำ เว้นแต่คุณส่ง spec ใหม่ `openclaw update` ยังรู้จัก update channel ของ OpenClaw ที่ active อยู่ด้วย: บนช่อง beta record ของ npm และ Plugin ClawHub ใน default-line จะลอง `@beta` ก่อน จากนั้น fallback ไปยัง spec default/latest ที่บันทึกไว้หากไม่มี release beta ของ Plugin อยู่ fallback นั้นจะถูกรายงานเป็นคำเตือนและไม่ทำให้การอัปเดต core ล้มเหลว เวอร์ชัน exact และแท็กที่ระบุชัดเจนจะยังคงถูกตรึงไว้กับตัวเลือกนั้น

  </Accordion>
  <Accordion title="การตรวจสอบเวอร์ชันและ integrity drift">
    ก่อนการอัปเดต npm แบบสด OpenClaw ตรวจสอบเวอร์ชัน package ที่ติดตั้งกับ metadata ของ npm registry หากเวอร์ชันที่ติดตั้งและ identity ของ artifact ที่บันทึกไว้ตรงกับ target ที่ resolve แล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน `openclaw.json` ใหม่

    เมื่อมี hash integrity ที่เก็บไว้และ hash ของ artifact ที่ fetch มาเปลี่ยน OpenClaw จะถือว่าเป็น npm artifact drift คำสั่ง interactive `openclaw plugins update` จะพิมพ์ hash ที่คาดไว้และ hash จริง แล้วขอการยืนยันก่อนดำเนินการต่อ helper การอัปเดตแบบ non-interactive จะ fail closed เว้นแต่ caller ส่ง policy การดำเนินการต่ออย่างชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install ในการอัปเดต">
    `--dangerously-force-unsafe-install` ยังใช้ได้กับ `plugins update` ในฐานะ override แบบ break-glass สำหรับ false positive ของการสแกน dangerous-code ในตัวระหว่างการอัปเดต Plugin อย่างไรก็ตามยังไม่ bypass block จาก policy `before_install` ของ Plugin หรือการ block เมื่อสแกนล้มเหลว และมีผลเฉพาะกับการอัปเดต Plugin ไม่ใช่การอัปเดต hook-pack
  </Accordion>
</AccordionGroup>

### ตรวจสอบ

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect แสดง identity, load status, source, ความสามารถของ manifest, policy flags, diagnostics, metadata การติดตั้ง, ความสามารถของ bundle และการรองรับ server MCP หรือ LSP ที่ตรวจพบ โดยค่าเริ่มต้นจะไม่ import runtime ของ Plugin เพิ่ม `--runtime` เพื่อโหลด module ของ Plugin และรวม hook, tool, command, service, gateway method และ HTTP route ที่ register แล้ว Runtime inspection รายงาน dependency ของ Plugin ที่ขาดหายโดยตรง ส่วนการติดตั้งและการซ่อมแซมยังอยู่ใน `openclaw plugins install`, `openclaw plugins update` และ `openclaw doctor --fix`

คำสั่ง CLI ที่ Plugin เป็นเจ้าของมักติดตั้งเป็น command group ใต้ root `openclaw` แต่ Plugin อาจ register command ซ้อนใต้ parent หลัก เช่น `openclaw nodes` ได้ด้วย หลังจาก `inspect --runtime` แสดง command ใต้ `cliCommands` แล้ว ให้รันที่ path ที่แสดงไว้ ตัวอย่างเช่น Plugin ที่ register `demo-git` สามารถตรวจสอบได้ด้วย `openclaw demo-git ping`

แต่ละ Plugin จะถูกจัดประเภทตามสิ่งที่ register จริงตอน runtime:

- **plain-capability** — ประเภทความสามารถเดียว (เช่น Plugin ที่มีเฉพาะ provider)
- **hybrid-capability** — หลายประเภทความสามารถ (เช่น ข้อความ + เสียงพูด + รูปภาพ)
- **hook-only** — มีเฉพาะ hooks ไม่มีความสามารถหรือ surfaces
- **non-capability** — เครื่องมือ/คำสั่ง/บริการ แต่ไม่มีความสามารถ

ดู [รูปแบบ Plugin](/th/plugins/architecture#plugin-shapes) สำหรับรายละเอียดเพิ่มเติมเกี่ยวกับโมเดลความสามารถ

<Note>
แฟล็ก `--json` ส่งออกรายงานที่เครื่องอ่านได้ เหมาะสำหรับการเขียนสคริปต์และการตรวจสอบ `inspect --all` แสดงตารางทั้ง fleet พร้อมคอลัมน์รูปแบบ ชนิดความสามารถ ประกาศความเข้ากันได้ ความสามารถของบันเดิล และสรุป hooks `info` เป็น alias ของ `inspect`
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` รายงานข้อผิดพลาดในการโหลด Plugin การวินิจฉัย manifest/discovery และประกาศความเข้ากันได้ เมื่อทุกอย่างเรียบร้อย ระบบจะพิมพ์ `No plugin issues detected.`

หาก Plugin ที่กำหนดค่าไว้มีอยู่บนดิสก์แต่ถูกบล็อกโดยการตรวจสอบความปลอดภัยของเส้นทางของ loader การตรวจสอบความถูกต้องของ config จะคงรายการ Plugin ไว้และรายงานว่า `present but blocked` ให้แก้การวินิจฉัย Plugin ที่ถูกบล็อกก่อนหน้า เช่น ความเป็นเจ้าของเส้นทางหรือสิทธิ์แบบ world-writable แทนการลบ config `plugins.entries.<id>` หรือ `plugins.allow`

สำหรับความล้มเหลวของรูปแบบโมดูล เช่น ไม่มี export `register`/`activate` ให้รันอีกครั้งด้วย `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุปรูปแบบ export แบบกระชับในผลลัพธ์การวินิจฉัย

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

registry ของ Plugin ในเครื่องคือโมเดล cold read ที่ OpenClaw บันทึกไว้สำหรับข้อมูลตัวตนของ Plugin ที่ติดตั้ง สถานะการเปิดใช้งาน เมตาดาต้าแหล่งที่มา และความเป็นเจ้าของ contribution การเริ่มทำงานตามปกติ การค้นหาเจ้าของ provider การจัดประเภทการตั้งค่า channel และ inventory ของ Plugin สามารถอ่านจาก registry ได้โดยไม่ต้องนำเข้าโมดูล runtime ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่า registry ที่บันทึกไว้มีอยู่ เป็นปัจจุบัน หรือเก่าแล้ว ใช้ `--refresh` เพื่อสร้างใหม่จากดัชนี Plugin ที่บันทึกไว้ นโยบาย config และเมตาดาต้า manifest/package นี่เป็นเส้นทางซ่อมแซม ไม่ใช่เส้นทางเปิดใช้งาน runtime

`openclaw doctor --fix` ยังซ่อมแซม drift ของ npm ที่จัดการแล้วซึ่งอยู่ใกล้กับ registry ด้วย: หากแพ็กเกจ `@openclaw/*` ที่กำพร้าหรือกู้คืนมาใต้ root ของ npm สำหรับ Plugin ที่จัดการแล้วไป shadow Plugin ที่ bundled อยู่ doctor จะลบแพ็กเกจเก่านั้นและสร้าง registry ใหม่ เพื่อให้การเริ่มทำงานตรวจสอบกับ manifest ที่ bundled อยู่

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็นสวิตช์ความเข้ากันได้แบบ break-glass ที่เลิกใช้แล้วสำหรับความล้มเหลวในการอ่าน registry ให้ใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix` แทน; fallback ผ่าน env มีไว้สำหรับการกู้คืนการเริ่มทำงานฉุกเฉินระหว่างที่ migration กำลัง rollout เท่านั้น
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

รายการ Marketplace รับเส้นทาง marketplace ในเครื่อง เส้นทาง `marketplace.json` ชวเลข GitHub เช่น `owner/repo` URL ของ repo บน GitHub หรือ URL ของ git `--json` พิมพ์ป้ายกำกับแหล่งที่มาที่ resolve แล้ว พร้อม manifest ของ marketplace และรายการ Plugin ที่ parse แล้ว

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ข้อมูลอ้างอิง CLI](/th/cli)
- [ClawHub](/th/clawhub)
