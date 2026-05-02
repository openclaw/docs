---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือบันเดิลที่เข้ากันได้
    - คุณต้องการดีบักความล้มเหลวในการโหลด Plugin
sidebarTitle: Plugins
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-02T10:11:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 963a4292f86d651a23f06ee83fd82d7ad80cb99ff3397a665940d8247225252c
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Plugin ของ Gateway, ชุด hook และบันเดิลที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="ระบบ Plugin" href="/th/tools/plugin">
    คู่มือผู้ใช้ปลายทางสำหรับติดตั้ง เปิดใช้งาน และแก้ปัญหา Plugin
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

สำหรับการตรวจสอบปัญหาการติดตั้ง การตรวจสอบ การถอนการติดตั้ง หรือการรีเฟรชรีจิสทรีที่ช้า ให้รันคำสั่งพร้อม `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` trace จะเขียนเวลาในแต่ละเฟสไปยัง stderr และยังทำให้เอาต์พุต JSON แยกวิเคราะห์ได้ ดู [การดีบัก](/th/help/debugging#plugin-lifecycle-trace)

<Note>
Plugin ที่มาพร้อมแพ็กเกจจะจัดส่งมากับ OpenClaw บางตัวเปิดใช้งานตามค่าเริ่มต้น (เช่น ผู้ให้บริการโมเดลที่มาพร้อมแพ็กเกจ ผู้ให้บริการเสียงพูดที่มาพร้อมแพ็กเกจ และ Plugin เบราว์เซอร์ที่มาพร้อมแพ็กเกจ); ตัวอื่นต้องใช้ `plugins enable`

Plugin แบบเนทีฟของ OpenClaw ต้องจัดส่ง `openclaw.plugin.json` พร้อม JSON Schema แบบอินไลน์ (`configSchema` แม้จะว่างก็ตาม) ส่วนบันเดิลที่เข้ากันได้จะใช้แมนิเฟสต์บันเดิลของตัวเองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุตรายการ/ข้อมูลแบบละเอียดจะแสดงชนิดย่อยของบันเดิลด้วย (`codex`, `claude` หรือ `cursor`) รวมถึงความสามารถของบันเดิลที่ตรวจพบ
</Note>

### ติดตั้ง

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # ClawHub first, then npm
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
ชื่อแพ็กเกจเปล่าจะถูกตรวจสอบกับ ClawHub ก่อน แล้วจึง npm ปฏิบัติต่อการติดตั้ง Plugin เหมือนการรันโค้ด ควรใช้เวอร์ชันที่ปักหมุดไว้
</Warning>

`plugins search` จะค้นหา ClawHub เพื่อหาแพ็กเกจ Plugin ที่ติดตั้งได้ และพิมพ์ชื่อแพ็กเกจที่พร้อมติดตั้ง โดยค้นหาแพ็กเกจ code-plugin และ bundle-plugin ไม่ใช่ Skills ใช้ `openclaw skills search` สำหรับ Skills ของ ClawHub

<Note>
ClawHub เป็นพื้นผิวหลักสำหรับการเผยแพร่และการค้นพบของ Plugin ส่วนใหญ่ Npm ยังคงเป็นทางเลือกสำรองและเส้นทางติดตั้งโดยตรงที่รองรับอยู่ ระหว่างการย้ายไปยัง ClawHub, OpenClaw ยังคงจัดส่งแพ็กเกจ Plugin `@openclaw/*` บางรายการที่ OpenClaw เป็นเจ้าของบน npm; เวอร์ชันแพ็กเกจเหล่านั้นอาจล้าหลังซอร์สที่มาพร้อมแพ็กเกจระหว่างรอบการเผยแพร่ Plugin หาก npm รายงานว่าแพ็กเกจ Plugin ที่ OpenClaw เป็นเจ้าของถูกเลิกใช้ เวอร์ชันที่เผยแพร่นั้นเป็นอาร์ติแฟกต์ภายนอกเก่า; ให้ใช้ Plugin ที่มาพร้อมกับ OpenClaw ปัจจุบันหรือ checkout ในเครื่องจนกว่าจะมีการเผยแพร่แพ็กเกจ npm ที่ใหม่กว่า
</Note>

<AccordionGroup>
  <Accordion title="การ include คอนฟิกและการกู้คืนคอนฟิกที่ไม่ถูกต้อง">
    หากส่วน `plugins` ของคุณมี `$include` แบบไฟล์เดียวรองรับอยู่ `plugins install/update/enable/disable/uninstall` จะเขียนผ่านไปยังไฟล์ที่ include นั้นและปล่อย `openclaw.json` ไว้ไม่แตะต้อง Root includes, include arrays และ includes ที่มี sibling overrides จะ fail closed แทนการ flatten ดู [การ include คอนฟิก](/th/gateway/configuration) สำหรับรูปทรงที่รองรับ

    หากคอนฟิกไม่ถูกต้องระหว่างการติดตั้ง โดยปกติ `plugins install` จะ fail closed และบอกให้คุณรัน `openclaw doctor --fix` ก่อน ระหว่างการเริ่มต้น Gateway คอนฟิกที่ไม่ถูกต้องของ Plugin หนึ่งตัวจะถูกแยกไว้กับ Plugin นั้น เพื่อให้ช่องทางและ Plugin อื่นยังทำงานต่อได้; `openclaw doctor --fix` สามารถกักรายการ Plugin ที่ไม่ถูกต้องได้ ข้อยกเว้นเวลา install ที่บันทึกไว้เพียงอย่างเดียวคือเส้นทางกู้คืนแบบแคบสำหรับ Plugin ที่มาพร้อมแพ็กเกจซึ่งเลือกใช้ `openclaw.install.allowInvalidConfigRecovery` อย่างชัดเจน

  </Accordion>
  <Accordion title="--force และการติดตั้งซ้ำเทียบกับการอัปเดต">
    `--force` จะใช้เป้าหมายการติดตั้งเดิมซ้ำ และเขียนทับ Plugin หรือชุด hook ที่ติดตั้งไว้แล้วในตำแหน่งเดิม ใช้เมื่อคุณตั้งใจติดตั้ง id เดิมซ้ำจาก path ในเครื่อง archive แพ็กเกจ ClawHub หรืออาร์ติแฟกต์ npm ใหม่ สำหรับการอัปเกรดตามปกติของ Plugin npm ที่ติดตามไว้แล้ว ควรใช้ `openclaw plugins update <id-or-npm-spec>`

    หากคุณรัน `plugins install` สำหรับ id ของ Plugin ที่ติดตั้งอยู่แล้ว OpenClaw จะหยุดและชี้คุณไปที่ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดปกติ หรือไปที่ `plugins install <package> --force` เมื่อคุณต้องการเขียนทับการติดตั้งปัจจุบันจากแหล่งอื่นจริงๆ

  </Accordion>
  <Accordion title="ขอบเขตของ --pin">
    `--pin` ใช้กับการติดตั้ง npm เท่านั้น ไม่รองรับกับการติดตั้ง `git:`; ใช้ git ref แบบชัดเจน เช่น `git:github.com/acme/plugin@v1.2.3` เมื่อคุณต้องการซอร์สที่ปักหมุดไว้ ไม่รองรับกับ `--marketplace` เพราะการติดตั้งจาก marketplace จะคง metadata แหล่งที่มาของ marketplace ไว้แทน npm spec
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` เป็นตัวเลือก break-glass สำหรับ false positives ในตัวสแกนโค้ดอันตรายที่มีมาให้ในตัว มันอนุญาตให้ติดตั้งต่อได้แม้ตัวสแกนในตัวจะรายงาน findings ระดับ `critical` แต่จะ **ไม่** ข้ามบล็อกนโยบาย hook `before_install` ของ Plugin และ **ไม่** ข้ามความล้มเหลวของการสแกน

    แฟล็ก CLI นี้ใช้กับโฟลว์ติดตั้ง/อัปเดต Plugin การติดตั้ง dependency ของ skill ที่รองรับโดย Gateway ใช้ request override ที่สอดคล้องกันคือ `dangerouslyForceUnsafeInstall` ขณะที่ `openclaw skills install` ยังคงเป็นโฟลว์ดาวน์โหลด/ติดตั้ง skill ของ ClawHub แยกต่างหาก

    หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกบล็อกโดยการสแกนรีจิสทรี ให้ใช้ขั้นตอนสำหรับผู้เผยแพร่ใน [ClawHub](/th/tools/clawhub)

  </Accordion>
  <Accordion title="ชุด hook และ npm specs">
    `plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับชุด hook ที่ expose `openclaw.hooks` ใน `package.json` ใช้ `openclaw hooks` สำหรับการมองเห็น hook แบบกรองและการเปิดใช้งานราย hook ไม่ใช่สำหรับการติดตั้งแพ็กเกจ

    Npm specs เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **เวอร์ชันที่แน่นอน** หรือ **dist-tag** แบบไม่บังคับ) Git/URL/file specs และช่วง semver จะถูกปฏิเสธ การติดตั้ง dependency จะรันแบบ project-local พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้ shell ของคุณจะมีการตั้งค่าติดตั้ง npm แบบ global ก็ตาม

    ใช้ `npm:<package>` เมื่อคุณต้องการข้ามการ lookup ของ ClawHub และติดตั้งโดยตรงจาก npm Bare package specs ยังคงให้ความสำคัญกับ ClawHub และจะ fallback ไป npm เฉพาะเมื่อ ClawHub ไม่มีแพ็กเกจหรือเวอร์ชันนั้น

    Bare specs และ `@latest` จะอยู่บนแทร็ก stable หาก npm resolve อย่างใดอย่างหนึ่งไปยัง prerelease, OpenClaw จะหยุดและขอให้คุณ opt in อย่างชัดเจนด้วย prerelease tag เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease ที่แน่นอน เช่น `@1.2.3-beta.4`

    หาก bare install spec ตรงกับ id ของ Plugin ทางการ (เช่น `diffs`) OpenClaw จะติดตั้งรายการ catalog โดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่มีชื่อเดียวกัน ให้ใช้ scoped spec แบบชัดเจน (เช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="ที่เก็บ Git">
    ใช้ `git:<repo>` เพื่อติดตั้งโดยตรงจากที่เก็บ git รูปแบบที่รองรับรวมถึง URL clone แบบ `git:github.com/owner/repo`, `git:owner/repo`, `https://` แบบเต็ม, `ssh://`, `git://`, `file://` และ `git@host:owner/repo.git` เพิ่ม `@<ref>` หรือ `#<ref>` เพื่อ checkout branch, tag หรือ commit ก่อนติดตั้ง

    การติดตั้ง Git จะ clone ลงในไดเรกทอรีชั่วคราว, checkout ref ที่ร้องขอเมื่อมีอยู่ แล้วใช้ตัวติดตั้งไดเรกทอรี Plugin ตามปกติ ซึ่งหมายความว่าการตรวจสอบความถูกต้องของแมนิเฟสต์, การสแกนโค้ดอันตราย, งานติดตั้งของ package-manager และบันทึกการติดตั้งจะทำงานเหมือนการติดตั้ง npm การติดตั้ง git ที่บันทึกไว้จะรวม source URL/ref และ commit ที่ resolve แล้ว เพื่อให้ `openclaw plugins update` สามารถ resolve แหล่งที่มาใหม่ภายหลังได้

    หลังจากติดตั้งจาก git ให้ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อตรวจสอบการลงทะเบียน runtime เช่นเมธอดของ Gateway และคำสั่ง CLI หาก Plugin ลงทะเบียน root CLI ด้วย `api.registerCli` ให้เรียกใช้คำสั่งนั้นโดยตรงผ่าน root CLI ของ OpenClaw เช่น `openclaw demo-plugin ping`

  </Accordion>
  <Accordion title="Archives">
    Archives ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` archives ของ Plugin แบบเนทีฟของ OpenClaw ต้องมี `openclaw.plugin.json` ที่ถูกต้องที่ root ของ Plugin หลังแตกไฟล์; archives ที่มีเฉพาะ `package.json` จะถูกปฏิเสธก่อนที่ OpenClaw จะเขียนบันทึกการติดตั้ง

    การติดตั้งจาก marketplace ของ Claude ก็รองรับด้วย

  </Accordion>
</AccordionGroup>

การติดตั้ง ClawHub ใช้ locator `clawhub:<package>` แบบชัดเจน:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

ตอนนี้ OpenClaw ยังให้ความสำคัญกับ ClawHub สำหรับ Plugin specs แบบ bare ที่ปลอดภัยกับ npm ด้วย โดยจะ fallback ไป npm เฉพาะเมื่อ ClawHub ไม่มีแพ็กเกจหรือเวอร์ชันนั้น:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อบังคับการ resolve แบบ npm-only เช่น เมื่อ ClawHub เข้าถึงไม่ได้ หรือคุณรู้ว่าแพ็กเกจมีอยู่บน npm เท่านั้น:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw ตรวจสอบ API ของ Plugin ที่ประกาศไว้ / ความเข้ากันได้ขั้นต่ำของ Gateway ก่อนติดตั้ง เมื่อเวอร์ชัน ClawHub ที่เลือกเผยแพร่อาร์ติแฟกต์ ClawPack, OpenClaw จะดาวน์โหลด ClawPack ตามเวอร์ชัน ตรวจสอบ header digest ของ ClawHub และ digest ของอาร์ติแฟกต์ แล้วติดตั้งผ่านเส้นทาง archive ตามปกติ เวอร์ชัน ClawHub เก่าที่ไม่มี metadata ของ ClawPack จะยังติดตั้งผ่านเส้นทางตรวจสอบ archive ของแพ็กเกจแบบ legacy การติดตั้งที่บันทึกไว้จะเก็บ metadata แหล่งที่มาของ ClawHub และข้อเท็จจริง digest ของ ClawPack ไว้สำหรับการอัปเดตภายหลัง
การติดตั้ง ClawHub แบบไม่ระบุเวอร์ชันจะเก็บ spec ที่บันทึกไว้แบบไม่ระบุเวอร์ชัน เพื่อให้ `openclaw plugins update` ติดตาม release ใหม่ของ ClawHub ได้; ตัวเลือกเวอร์ชันหรือ tag แบบชัดเจน เช่น `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` จะยังคงปักหมุดไว้กับตัวเลือกนั้น

#### คำย่อ Marketplace

ใช้คำย่อ `plugin@marketplace` เมื่อชื่อ marketplace มีอยู่ในแคชรีจิสทรีในเครื่องของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="Marketplace sources">
    - ชื่อตลาด Claude ที่รู้จักจาก `~/.claude/plugins/known_marketplaces.json`
    - รากตลาดภายในเครื่องหรือพาธ `marketplace.json`
    - ชวเลข repo GitHub เช่น `owner/repo`
    - URL repo GitHub เช่น `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    สำหรับตลาดระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องอยู่ภายใน repo ตลาดที่โคลนมา OpenClaw ยอมรับแหล่งที่มาแบบพาธสัมพัทธ์จาก repo นั้น และปฏิเสธแหล่งที่มา Plugin แบบ HTTP(S), พาธสัมบูรณ์, git, GitHub และแหล่งที่มา Plugin อื่นที่ไม่ใช่พาธจาก manifest ระยะไกล
  </Tab>
</Tabs>

สำหรับพาธและ archive ภายในเครื่อง OpenClaw จะตรวจจับอัตโนมัติ:

- Plugin OpenClaw แบบเนทีฟ (`openclaw.plugin.json`)
- บันเดิลที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- บันเดิลที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือเลย์เอาต์คอมโพเนนต์ Claude เริ่มต้น)
- บันเดิลที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

<Note>
บันเดิลที่เข้ากันได้จะติดตั้งลงในราก Plugin ปกติ และเข้าร่วมในโฟลว์ list/info/enable/disable เดียวกัน ปัจจุบันรองรับ Skills ของบันเดิล, command-skills ของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` / `lspServers` ที่ประกาศใน manifest ของ Claude, command-skills ของ Cursor และไดเรกทอรี hook ของ Codex ที่เข้ากันได้ ส่วนความสามารถอื่นของบันเดิลที่ตรวจพบจะแสดงใน diagnostics/info แต่ยังไม่ได้เชื่อมเข้ากับการทำงาน runtime
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
  เปลี่ยนจากมุมมองตารางเป็นบรรทัดรายละเอียดราย Plugin พร้อม metadata ของแหล่งที่มา/ต้นทาง/เวอร์ชัน/การเปิดใช้งาน
</ParamField>
<ParamField path="--json" type="boolean">
  inventory ที่เครื่องอ่านได้ พร้อม diagnostics ของ registry
</ParamField>

<Note>
`plugins list` อ่าน registry Plugin ภายในเครื่องที่บันทึกถาวรก่อน โดยมี fallback ที่สร้างจาก manifest เท่านั้นเมื่อ registry หายไปหรือไม่ถูกต้อง คำสั่งนี้มีประโยชน์สำหรับตรวจสอบว่า Plugin ติดตั้งแล้ว เปิดใช้งานแล้ว และมองเห็นได้ต่อการวางแผนเริ่มต้นแบบ cold startup หรือไม่ แต่ไม่ใช่การ probe runtime แบบสดของกระบวนการ Gateway ที่กำลังทำงานอยู่ หลังเปลี่ยนโค้ด Plugin, สถานะเปิดใช้งาน, นโยบาย hook หรือ `plugins.load.paths` ให้รีสตาร์ท Gateway ที่ให้บริการช่องทางนั้นก่อนคาดหวังให้โค้ด `register(api)` หรือ hook ใหม่ทำงาน สำหรับการปรับใช้แบบระยะไกล/container ให้ตรวจสอบว่าคุณกำลังรีสตาร์ท child `openclaw gateway run` จริง ไม่ใช่แค่กระบวนการ wrapper
</Note>

`plugins search` คือการค้นหาแค็ตตาล็อก ClawHub ระยะไกล คำสั่งนี้ไม่ตรวจสอบสถานะภายในเครื่อง ไม่แก้ไข config ไม่ติดตั้งแพ็กเกจ และไม่โหลดโค้ด runtime ของ Plugin ผลการค้นหามีชื่อแพ็กเกจ ClawHub, family, channel, เวอร์ชัน, สรุป และคำแนะนำการติดตั้ง เช่น `openclaw plugins install clawhub:<package>`

สำหรับงาน Plugin ที่บันเดิลอยู่ภายใน Docker image ที่แพ็กเกจแล้ว ให้ bind-mount ไดเรกทอรีซอร์สของ Plugin ทับพาธซอร์สที่แพ็กเกจไว้ซึ่งตรงกัน เช่น `/app/extensions/synology-chat` OpenClaw จะค้นพบ overlay ซอร์สที่ mount ไว้นั้นก่อน `/app/dist/extensions/synology-chat`; ไดเรกทอรีซอร์สที่คัดลอกมาแบบธรรมดาจะยังไม่ทำงาน เพื่อให้การติดตั้งแบบแพ็กเกจปกติยังใช้ dist ที่คอมไพล์แล้ว

สำหรับการดีบัก hook runtime:

- `openclaw plugins inspect <id> --runtime --json` แสดง hook ที่ลงทะเบียนและ diagnostics จากรอบการตรวจสอบที่โหลดโมดูลแล้ว การตรวจสอบ runtime จะไม่ติดตั้ง dependency ใด ๆ; ใช้ `openclaw doctor --fix` เพื่อล้างสถานะ dependency เก่า หรือติดตั้ง Plugin ที่ดาวน์โหลดได้ซึ่งกำหนดค่าไว้แต่ยังขาดอยู่
- `openclaw gateway status --deep --require-rpc` ยืนยัน Gateway ที่เข้าถึงได้, คำใบ้ service/process, พาธ config และสุขภาพ RPC
- hook การสนทนาที่ไม่บันเดิล (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรีภายในเครื่อง (เพิ่มเข้า `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
ไม่รองรับ `--force` ร่วมกับ `--link` เพราะการติดตั้งแบบ linked จะใช้พาธซอร์สซ้ำแทนการคัดลอกทับเป้าหมายการติดตั้งที่จัดการอยู่

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึก spec ตรงที่ resolve แล้ว (`name@version`) ในดัชนี Plugin ที่จัดการอยู่ โดยยังคงพฤติกรรมเริ่มต้นแบบไม่ pin ไว้
</Note>

### ดัชนี Plugin

metadata การติดตั้ง Plugin เป็นสถานะที่เครื่องจัดการ ไม่ใช่ config ของผู้ใช้ การติดตั้งและการอัปเดตจะเขียนข้อมูลนี้ไปยัง `plugins/installs.json` ใต้ไดเรกทอรีสถานะ OpenClaw ที่ใช้งานอยู่ map ระดับบนสุด `installRecords` เป็นแหล่งข้อมูลถาวรของ metadata การติดตั้ง รวมถึง record สำหรับ manifest ของ Plugin ที่เสียหรือหายไป อาร์เรย์ `plugins` คือ cache registry แบบ cold ที่สร้างจาก manifest ไฟล์นี้มีคำเตือนห้ามแก้ไข และถูกใช้โดย `openclaw plugins update`, การถอนการติดตั้ง, diagnostics และ registry Plugin แบบ cold

เมื่อ OpenClaw พบ record `plugins.installs` เก่าที่จัดส่งมาใน config จะย้าย record เหล่านั้นไปยังดัชนี Plugin และลบคีย์ config ออก; หากการเขียนอย่างใดอย่างหนึ่งล้มเหลว record ใน config จะถูกเก็บไว้เพื่อไม่ให้ metadata การติดตั้งสูญหาย

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` ลบ record ของ Plugin ออกจาก `plugins.entries`, ดัชนี Plugin ที่บันทึกถาวร, รายการอนุญาต/ปฏิเสธของ Plugin และรายการ `plugins.load.paths` แบบ linked เมื่อเกี่ยวข้อง หากไม่ได้ตั้ง `--keep-files` การถอนการติดตั้งจะลบไดเรกทอรีการติดตั้งที่จัดการและติดตามไว้ด้วย เมื่อไดเรกทอรีนั้นอยู่ภายในราก extensions ของ Plugin ของ OpenClaw สำหรับ Plugin active memory ช่อง memory จะรีเซ็ตเป็น `memory-core`

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

การอัปเดตมีผลกับการติดตั้ง Plugin ที่ติดตามไว้ในดัชนี Plugin ที่จัดการอยู่ และการติดตั้ง hook-pack ที่ติดตามไว้ใน `hooks.internal.installs`

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    เมื่อคุณส่ง id ของ Plugin OpenClaw จะใช้ spec การติดตั้งที่บันทึกไว้สำหรับ Plugin นั้นซ้ำ ซึ่งหมายความว่า dist-tag ที่เคยเก็บไว้ เช่น `@beta` และเวอร์ชันที่ pin แบบตรง จะยังคงถูกใช้ในการรัน `update <id>` ภายหลัง

    สำหรับการติดตั้ง npm คุณยังสามารถส่ง spec แพ็กเกจ npm แบบชัดเจนพร้อม dist-tag หรือเวอร์ชันตรงได้ด้วย OpenClaw จะ resolve ชื่อแพ็กเกจนั้นกลับไปยัง record ของ Plugin ที่ติดตามไว้ อัปเดต Plugin ที่ติดตั้งนั้น และบันทึก spec npm ใหม่สำหรับการอัปเดตตาม id ในอนาคต

    การส่งชื่อแพ็กเกจ npm โดยไม่มีเวอร์ชันหรือ tag จะ resolve กลับไปยัง record ของ Plugin ที่ติดตามไว้เช่นกัน ใช้ตัวเลือกนี้เมื่อ Plugin ถูก pin ไว้กับเวอร์ชันตรง และคุณต้องการย้ายกลับไปยังสาย release เริ่มต้นของ registry

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    ก่อนอัปเดต npm แบบสด OpenClaw จะตรวจสอบเวอร์ชันแพ็กเกจที่ติดตั้งกับ metadata ของ npm registry หากเวอร์ชันที่ติดตั้งและตัวตน artifact ที่บันทึกไว้ตรงกับเป้าหมายที่ resolve แล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน `openclaw.json` ใหม่

    เมื่อมี hash integrity ที่เก็บไว้และ hash ของ artifact ที่ fetch มาเปลี่ยนไป OpenClaw จะถือว่านั่นเป็น artifact drift ของ npm คำสั่งแบบ interactive `openclaw plugins update` จะพิมพ์ hash ที่คาดหวังและ hash จริง แล้วถามเพื่อยืนยันก่อนดำเนินการต่อ helper อัปเดตแบบ non-interactive จะปิดล้มเหลว เว้นแต่ caller จะระบุนโยบายดำเนินการต่ออย่างชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` ยังใช้งานได้กับ `plugins update` ในฐานะ override แบบ break-glass สำหรับ false positive จากการสแกน dangerous-code ในตัวระหว่างอัปเดต Plugin แต่ยังไม่ bypass บล็อกนโยบาย `before_install` ของ Plugin หรือการบล็อกจาก scan-failure และมีผลเฉพาะกับการอัปเดต Plugin ไม่ใช่การอัปเดต hook-pack
  </Accordion>
</AccordionGroup>

### ตรวจสอบ

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect แสดงตัวตน สถานะการโหลด แหล่งที่มา ความสามารถใน manifest, flag นโยบาย, diagnostics, metadata การติดตั้ง, ความสามารถของบันเดิล และการรองรับเซิร์ฟเวอร์ MCP หรือ LSP ที่ตรวจพบ โดยค่าเริ่มต้นจะไม่ import runtime ของ Plugin เพิ่ม `--runtime` เพื่อโหลดโมดูล Plugin และรวม hook, tool, command, service, gateway method และ HTTP route ที่ลงทะเบียนไว้ การตรวจสอบ runtime รายงาน dependency ของ Plugin ที่หายไปโดยตรง; การติดตั้งและการซ่อมแซมยังอยู่ใน `openclaw plugins install`, `openclaw plugins update` และ `openclaw doctor --fix`

คำสั่ง CLI ที่ Plugin เป็นเจ้าของจะติดตั้งเป็นกลุ่มคำสั่ง `openclaw` ระดับราก หลังจาก `inspect --runtime` แสดงคำสั่งใต้ `cliCommands` ให้รันเป็น `openclaw <command> ...`; ตัวอย่างเช่น Plugin ที่ลงทะเบียน `demo-git` สามารถตรวจสอบได้ด้วย `openclaw demo-git ping`

Plugin แต่ละตัวถูกจัดประเภทตามสิ่งที่ลงทะเบียนจริงใน runtime:

- **plain-capability** — ความสามารถหนึ่งประเภท (เช่น Plugin ที่เป็น provider เท่านั้น)
- **hybrid-capability** — ความสามารถหลายประเภท (เช่น ข้อความ + เสียงพูด + รูปภาพ)
- **hook-only** — มีเฉพาะ hook ไม่มีความสามารถหรือ surface
- **non-capability** — มี tool/command/service แต่ไม่มีความสามารถ

ดู [รูปแบบ Plugin](/th/plugins/architecture#plugin-shapes) สำหรับรายละเอียดเพิ่มเติมเกี่ยวกับโมเดลความสามารถ

<Note>
flag `--json` ส่งออกรายงานที่เครื่องอ่านได้ เหมาะสำหรับ scripting และ audit `inspect --all` แสดงตารางทั้ง fleet พร้อมคอลัมน์ shape, ชนิดความสามารถ, ประกาศความเข้ากันได้, ความสามารถของบันเดิล และสรุป hook `info` เป็น alias ของ `inspect`
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` รายงานข้อผิดพลาดการโหลด Plugin, diagnostics ของ manifest/discovery และประกาศความเข้ากันได้ เมื่อทุกอย่างเรียบร้อยจะแสดง `No plugin issues detected.`

สำหรับความล้มเหลวของ module-shape เช่น export `register`/`activate` ที่หายไป ให้รันซ้ำด้วย `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุป export-shape แบบกะทัดรัดในเอาต์พุต diagnostics

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

registry Plugin ภายในเครื่องคือโมเดลอ่านแบบ cold ที่ OpenClaw บันทึกถาวรสำหรับตัวตน Plugin, สถานะเปิดใช้งาน, metadata แหล่งที่มา และ ownership ของ contribution การเริ่มต้นปกติ การค้นหาเจ้าของ provider การจัดประเภทการตั้งค่า channel และ inventory ของ Plugin สามารถอ่านได้โดยไม่ต้อง import โมดูล runtime ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่า registry ที่บันทึกถาวรมีอยู่ เป็นปัจจุบัน หรือล้าสมัย ใช้ `--refresh` เพื่อ rebuild จากดัชนี Plugin ที่บันทึกถาวร, นโยบาย config และ metadata manifest/package นี่เป็นพาธซ่อมแซม ไม่ใช่พาธเปิดใช้งาน runtime

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็นสวิตช์ความเข้ากันได้แบบ break-glass ที่เลิกใช้แล้วสำหรับความล้มเหลวในการอ่าน registry ควรใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix`; fallback ผ่าน env มีไว้สำหรับการกู้คืนการเริ่มต้นฉุกเฉินเท่านั้นระหว่างที่ migration กำลัง rollout
</Warning>

### ตลาด

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

รายการตลาดยอมรับพาธตลาดภายในเครื่อง, พาธ `marketplace.json`, ชวเลข GitHub เช่น `owner/repo`, URL repo GitHub หรือ URL git `--json` พิมพ์ label แหล่งที่มาที่ resolve แล้ว พร้อม manifest ตลาดที่ parse แล้วและรายการ Plugin

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Plugin ชุมชน](/th/plugins/community)
