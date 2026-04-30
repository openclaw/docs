---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือบันเดิลที่เข้ากันได้
    - คุณต้องการดีบักความล้มเหลวในการโหลด Plugin
sidebarTitle: Plugins
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-04-30T09:45:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 381e3243eaefb5b5e31db8fd2ba459773649a6ef427080a12018ea92b25f707c
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Gateway plugins, แพ็ก hook และ bundle ที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="ระบบ Plugin" href="/th/tools/plugin">
    คู่มือผู้ใช้สำหรับติดตั้ง เปิดใช้งาน และแก้ปัญหา plugins
  </Card>
  <Card title="Plugin bundles" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของ bundle
  </Card>
  <Card title="Manifest ของ Plugin" href="/th/plugins/manifest">
    ฟิลด์ manifest และ schema ของการกำหนดค่า
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
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

สำหรับการตรวจสอบการติดตั้ง การตรวจสอบ การถอนการติดตั้ง หรือการรีเฟรชรีจิสทรีที่ช้า ให้รัน
คำสั่งพร้อม `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` trace จะเขียนเวลาของแต่ละเฟส
ไปยัง stderr และยังคงทำให้เอาต์พุต JSON parse ได้ ดู [การดีบัก](/th/help/debugging#plugin-lifecycle-trace)

<Note>
Plugins ที่ bundled มาพร้อมกับ OpenClaw บางตัวเปิดใช้งานตามค่าเริ่มต้น (เช่น ผู้ให้บริการโมเดลที่ bundled, ผู้ให้บริการเสียงพูดที่ bundled และ plugin เบราว์เซอร์ที่ bundled); ตัวอื่นต้องใช้ `plugins enable`

Plugins OpenClaw แบบ native ต้องมาพร้อม `openclaw.plugin.json` พร้อม JSON Schema แบบ inline (`configSchema` แม้ว่าจะว่างเปล่า) ส่วน bundle ที่เข้ากันได้ใช้ manifest ของ bundle ของตนเองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุตรายการ/info แบบ verbose จะแสดง subtype ของ bundle ด้วย (`codex`, `claude` หรือ `cursor`) รวมถึงความสามารถของ bundle ที่ตรวจพบ
</Note>

### ติดตั้ง

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
ชื่อแพ็กเกจแบบ bare จะถูกตรวจสอบกับ ClawHub ก่อน แล้วจึงเป็น npm ให้ปฏิบัติต่อการติดตั้ง plugin เหมือนการรันโค้ด ควรใช้เวอร์ชันที่ pin ไว้
</Warning>

<Note>
ClawHub เป็นพื้นผิวหลักสำหรับการจัดจำหน่ายและการค้นพบสำหรับ plugins ส่วนใหญ่ Npm
ยังคงเป็น fallback และเส้นทางติดตั้งโดยตรงที่รองรับ ระหว่างการย้ายไปยัง
ClawHub, OpenClaw ยังคงจัดส่งแพ็กเกจ plugin `@openclaw/*` บางตัวที่ OpenClaw เป็นเจ้าของ
บน npm; เวอร์ชันแพ็กเกจเหล่านั้นอาจล้าหลังกว่าซอร์สที่ bundled ระหว่างรอบการปล่อย plugin
หาก npm รายงานว่าแพ็กเกจ plugin ที่ OpenClaw เป็นเจ้าของถูก deprecated แสดงว่า
เวอร์ชันที่เผยแพร่นั้นเป็น artifact ภายนอกเก่า ให้ใช้ plugin ที่ bundled กับ
OpenClaw ปัจจุบันหรือ checkout ในเครื่องจนกว่าจะมีการเผยแพร่แพ็กเกจ npm ที่ใหม่กว่า
</Note>

<AccordionGroup>
  <Accordion title="Config includes และการกู้คืน invalid-config">
    หากส่วน `plugins` ของคุณอิงกับ `$include` ไฟล์เดียว `plugins install/update/enable/disable/uninstall` จะเขียนทะลุไปยังไฟล์ที่ include นั้นและปล่อย `openclaw.json` ไว้โดยไม่แตะต้อง Root includes, include arrays และ includes ที่มี sibling overrides จะ fail closed แทนการ flatten ดู [Config includes](/th/gateway/configuration) สำหรับรูปแบบที่รองรับ

    หาก config ไม่ถูกต้องระหว่างการติดตั้ง โดยปกติ `plugins install` จะ fail closed และแจ้งให้คุณรัน `openclaw doctor --fix` ก่อน ระหว่างการเริ่มต้น Gateway, config ที่ไม่ถูกต้องของ plugin หนึ่งตัวจะถูกแยกไว้เฉพาะ plugin นั้น เพื่อให้ช่องทางและ plugins อื่นยังทำงานต่อได้; `openclaw doctor --fix` สามารถ quarantine รายการ plugin ที่ไม่ถูกต้องได้ ข้อยกเว้นเวลาติดตั้งที่มีเอกสารระบุไว้เพียงอย่างเดียวคือเส้นทางกู้คืนแบบแคบสำหรับ plugin ที่ bundled ซึ่ง opt in ไปยัง `openclaw.install.allowInvalidConfigRecovery` อย่างชัดเจน

  </Accordion>
  <Accordion title="--force และการติดตั้งใหม่เทียบกับการอัปเดต">
    `--force` ใช้เป้าหมายการติดตั้งเดิมซ้ำและเขียนทับ plugin หรือแพ็ก hook ที่ติดตั้งอยู่แล้วในตำแหน่งเดิม ใช้เมื่อคุณตั้งใจติดตั้ง id เดิมใหม่จาก path ในเครื่อง archive แพ็กเกจ ClawHub หรือ artifact npm ใหม่ สำหรับการอัปเกรด plugin npm ที่ติดตามอยู่แล้วตามปกติ ให้ใช้ `openclaw plugins update <id-or-npm-spec>`

    หากคุณรัน `plugins install` สำหรับ id ของ plugin ที่ติดตั้งอยู่แล้ว OpenClaw จะหยุดและชี้ให้คุณใช้ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดปกติ หรือ `plugins install <package> --force` เมื่อคุณต้องการเขียนทับการติดตั้งปัจจุบันจากแหล่งอื่นจริง ๆ

  </Accordion>
  <Accordion title="ขอบเขตของ --pin">
    `--pin` ใช้กับการติดตั้ง npm เท่านั้น ไม่รองรับเมื่อใช้กับ `--marketplace` เพราะการติดตั้งจาก marketplace จะบันทึก metadata แหล่งที่มาของ marketplace แทน spec ของ npm
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` เป็นตัวเลือก break-glass สำหรับ false positive ในตัวสแกนโค้ดอันตรายที่มีมาให้ในตัว มันอนุญาตให้การติดตั้งดำเนินต่อได้แม้เมื่อตัวสแกนในตัวรายงานผลการค้นพบระดับ `critical` แต่ **ไม่** ข้ามบล็อกนโยบาย hook `before_install` ของ plugin และ **ไม่** ข้ามความล้มเหลวของการสแกน

    แฟล็ก CLI นี้ใช้กับ flow การติดตั้ง/อัปเดต plugin การติดตั้ง dependency ของ skill ที่รองรับโดย Gateway ใช้ request override ที่ตรงกันคือ `dangerouslyForceUnsafeInstall` ส่วน `openclaw skills install` ยังคงเป็น flow ดาวน์โหลด/ติดตั้ง skill ของ ClawHub แยกต่างหาก

    หาก plugin ที่คุณเผยแพร่บน ClawHub ถูกบล็อกโดยการสแกนของรีจิสทรี ให้ใช้ขั้นตอนสำหรับผู้เผยแพร่ใน [ClawHub](/th/tools/clawhub)

  </Accordion>
  <Accordion title="แพ็ก hook และ spec ของ npm">
    `plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับแพ็ก hook ที่เปิดเผย `openclaw.hooks` ใน `package.json` ด้วย ใช้ `openclaw hooks` สำหรับการมองเห็น hook แบบกรองและการเปิดใช้งานเป็นราย hook ไม่ใช่สำหรับการติดตั้งแพ็กเกจ

    Spec ของ npm เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **เวอร์ชันแน่นอน** หรือ **dist-tag** ที่เป็นตัวเลือก) Spec แบบ Git/URL/file และช่วง semver จะถูกปฏิเสธ การติดตั้ง dependency จะรันแบบ project-local พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้เมื่อ shell ของคุณมีการตั้งค่าการติดตั้ง npm แบบ global

    ใช้ `npm:<package>` เมื่อคุณต้องการข้ามการค้นหา ClawHub และติดตั้งโดยตรงจาก npm Spec แพ็กเกจแบบ bare ยังคงเลือก ClawHub ก่อนและ fallback ไปยัง npm เฉพาะเมื่อ ClawHub ไม่มีแพ็กเกจหรือเวอร์ชันนั้น

    Spec แบบ bare และ `@latest` จะอยู่บนแทร็ก stable หาก npm resolve อย่างใดอย่างหนึ่งเป็น prerelease, OpenClaw จะหยุดและขอให้คุณ opt in อย่างชัดเจนด้วยแท็ก prerelease เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease แบบแน่นอน เช่น `@1.2.3-beta.4`

    หาก spec ติดตั้งแบบ bare ตรงกับ id ของ plugin ที่ bundled (เช่น `diffs`) OpenClaw จะติดตั้ง plugin ที่ bundled โดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่มีชื่อเดียวกัน ให้ใช้ spec แบบ scoped ที่ชัดเจน (เช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="Archives">
    Archives ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` Archives ของ plugin OpenClaw แบบ native ต้องมี `openclaw.plugin.json` ที่ถูกต้องอยู่ที่ root ของ plugin ที่แตกไฟล์แล้ว; archives ที่มีเพียง `package.json` จะถูกปฏิเสธก่อนที่ OpenClaw จะเขียน records การติดตั้ง

    การติดตั้งจาก marketplace ของ Claude ก็รองรับเช่นกัน

  </Accordion>
</AccordionGroup>

การติดตั้ง ClawHub ใช้ locator `clawhub:<package>` ที่ชัดเจน:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

ตอนนี้ OpenClaw ยังเลือก ClawHub ก่อนสำหรับ spec ของ plugin แบบ bare ที่ปลอดภัยกับ npm ด้วย และจะ fallback ไปยัง npm เฉพาะเมื่อ ClawHub ไม่มีแพ็กเกจหรือเวอร์ชันนั้น:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อบังคับการ resolve แบบ npm-only เช่น เมื่อ ClawHub เข้าถึงไม่ได้หรือคุณรู้ว่าแพ็กเกจมีอยู่เฉพาะบน npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw ดาวน์โหลด archive ของแพ็กเกจจาก ClawHub ตรวจสอบ plugin API / ความเข้ากันได้ขั้นต่ำของ gateway ที่ประกาศไว้ จากนั้นติดตั้งผ่านเส้นทาง archive ปกติ การติดตั้งที่บันทึกไว้จะเก็บ metadata แหล่งที่มา ClawHub ไว้สำหรับการอัปเดตภายหลัง
การติดตั้ง ClawHub แบบไม่ระบุเวอร์ชันจะเก็บ spec ที่บันทึกไว้แบบไม่ระบุเวอร์ชัน เพื่อให้ `openclaw plugins update` ติดตาม release ใหม่กว่าของ ClawHub ได้; selector แบบระบุเวอร์ชันหรือแท็กอย่างชัดเจน เช่น `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` จะยังคง pin อยู่กับ selector นั้น

#### ชวเลข Marketplace

ใช้ชวเลข `plugin@marketplace` เมื่อชื่อ marketplace มีอยู่ในแคชรีจิสทรีในเครื่องของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

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
    - ชวเลข repo GitHub เช่น `owner/repo`
    - URL repo GitHub เช่น `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="กฎของ marketplace ระยะไกล">
    สำหรับ marketplaces ระยะไกลที่โหลดจาก GitHub หรือ git รายการ plugin ต้องอยู่ภายใน repo marketplace ที่ clone มา OpenClaw ยอมรับแหล่งที่มาแบบ relative path จาก repo นั้น และปฏิเสธแหล่งที่มา plugin แบบ HTTP(S), absolute-path, git, GitHub และแบบ non-path อื่นจาก manifests ระยะไกล
  </Tab>
</Tabs>

สำหรับ path ในเครื่องและ archives, OpenClaw ตรวจจับอัตโนมัติ:

- plugins OpenClaw แบบ native (`openclaw.plugin.json`)
- bundles ที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- bundles ที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือ layout คอมโพเนนต์ Claude เริ่มต้น)
- bundles ที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

<Note>
Bundles ที่เข้ากันได้จะติดตั้งลงใน root plugin ปกติและเข้าร่วม flow list/info/enable/disable เดียวกัน ปัจจุบันรองรับ bundle skills, command-skills ของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` / `lspServers` ที่ประกาศใน manifest, command-skills ของ Cursor และไดเรกทอรี hook ของ Codex ที่เข้ากันได้; ความสามารถของ bundle อื่นที่ตรวจพบจะแสดงใน diagnostics/info แต่ยังไม่ได้เชื่อมเข้ากับการทำงาน runtime
</Note>

### รายการ

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  แสดงเฉพาะ plugins ที่เปิดใช้งานแล้ว
</ParamField>
<ParamField path="--verbose" type="boolean">
  เปลี่ยนจากมุมมองตารางเป็นบรรทัดรายละเอียดต่อ plugin พร้อม metadata แหล่งที่มา/origin/เวอร์ชัน/การเปิดใช้งาน
</ParamField>
<ParamField path="--json" type="boolean">
  inventory ที่อ่านได้โดยเครื่องพร้อม diagnostics ของรีจิสทรี
</ParamField>

<Note>
`plugins list` จะอ่านรีจิสทรี Plugin ภายในเครื่องที่บันทึกไว้ก่อน โดยมีทางเลือกสำรองที่สร้างจาก manifest เท่านั้นเมื่อรีจิสทรีหายไปหรือไม่ถูกต้อง ซึ่งมีประโยชน์สำหรับตรวจสอบว่า Plugin ถูกติดตั้ง เปิดใช้งาน และมองเห็นได้ในการวางแผนการเริ่มต้นแบบ cold startup หรือไม่ แต่ไม่ใช่การตรวจสอบ runtime แบบสดของกระบวนการ Gateway ที่กำลังทำงานอยู่ หลังจากเปลี่ยนโค้ด Plugin, การเปิดใช้งาน, นโยบาย hook หรือ `plugins.load.paths` ให้รีสตาร์ท Gateway ที่ให้บริการ channel ก่อนคาดหวังให้โค้ด `register(api)` ใหม่หรือ hooks ทำงาน สำหรับการปรับใช้แบบรีโมต/คอนเทนเนอร์ ให้ตรวจสอบว่าคุณกำลังรีสตาร์ท child ของ `openclaw gateway run` จริง ไม่ใช่เพียงกระบวนการ wrapper
</Note>

สำหรับงาน Plugin ที่มาพร้อมระบบภายใน Docker image ที่แพ็กเกจแล้ว ให้ bind-mount ไดเรกทอรีซอร์สของ Plugin
ทับ path ซอร์สที่แพ็กเกจไว้ซึ่งตรงกัน เช่น
`/app/extensions/synology-chat` OpenClaw จะค้นพบ source overlay ที่ mount ไว้นั้น
ก่อน `/app/dist/extensions/synology-chat`; ไดเรกทอรีซอร์สที่คัดลอกมาแบบธรรมดาจะยังไม่ทำงาน เพื่อให้การติดตั้งแบบแพ็กเกจตามปกติยังคงใช้ dist ที่คอมไพล์แล้ว

สำหรับการดีบัก runtime hook:

- `openclaw plugins inspect <id> --json` แสดง hooks ที่ลงทะเบียนไว้และ diagnostics จากรอบการตรวจสอบที่โหลดโมดูลแล้ว
- `openclaw gateway status --deep --require-rpc` ยืนยัน Gateway ที่เข้าถึงได้, คำใบ้ service/process, path ของ config และสถานะ RPC
- conversation hooks ที่ไม่ได้มาพร้อมระบบ (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) ต้องมี `plugins.entries.<id>.hooks.allowConversationAccess=true`

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรีภายในเครื่อง (เพิ่มลงใน `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
ไม่รองรับ `--force` ร่วมกับ `--link` เพราะการติดตั้งแบบ linked จะนำ path ซอร์สกลับมาใช้แทนการคัดลอกทับเป้าหมายการติดตั้งที่จัดการอยู่

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึก spec แบบตรงตัวที่ resolve แล้ว (`name@version`) ใน managed plugin index โดยยังคงพฤติกรรมเริ่มต้นเป็นแบบไม่ pin
</Note>

### ดัชนี Plugin

เมตาดาต้าการติดตั้ง Plugin เป็นสถานะที่เครื่องจัดการ ไม่ใช่ config ของผู้ใช้ การติดตั้งและอัปเดตจะเขียนข้อมูลนี้ไปที่ `plugins/installs.json` ใต้ไดเรกทอรีสถานะ OpenClaw ที่ใช้งานอยู่ map ระดับบนสุด `installRecords` คือแหล่งข้อมูลถาวรของเมตาดาต้าการติดตั้ง รวมถึง records สำหรับ manifest ของ Plugin ที่เสียหรือหายไป array `plugins` คือ cache รีจิสทรีแบบ cold ที่สร้างจาก manifest ไฟล์นี้มีคำเตือนห้ามแก้ไขและถูกใช้โดย `openclaw plugins update`, uninstall, diagnostics และรีจิสทรี Plugin แบบ cold

เมื่อ OpenClaw พบ records `plugins.installs` แบบ legacy ที่ shipped อยู่ใน config จะย้าย records เหล่านั้นไปยังดัชนี Plugin และลบคีย์ config ออก หากการเขียนอย่างใดอย่างหนึ่งล้มเหลว records ใน config จะยังคงอยู่เพื่อไม่ให้เมตาดาต้าการติดตั้งสูญหาย

### Runtime deps

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` ตรวจสอบ stage ของ dependency runtime ที่แพ็กเกจไว้สำหรับ Plugin ที่มาพร้อมระบบซึ่ง OpenClaw เป็นเจ้าของ โดยเลือกจาก config ของ Plugin, channels ที่เปิดใช้งาน/ตั้งค่าไว้, model providers ที่ตั้งค่าไว้ หรือค่าเริ่มต้นจาก manifest ที่มาพร้อมระบบ คำสั่งนี้ไม่ใช่ path สำหรับติดตั้ง/อัปเดต Plugin จาก npm ภายนอกหรือ ClawHub

ใช้ `--repair` เมื่อการติดตั้งแบบแพ็กเกจรายงานว่า dependency runtime ที่มาพร้อมระบบหายไประหว่างเริ่มต้น Gateway หรือ `plugins doctor` การ repair จะติดตั้งเฉพาะ deps ของ Plugin ที่มาพร้อมระบบซึ่งเปิดใช้งานอยู่และหายไป โดยปิด lifecycle scripts ใช้ `--prune` เพื่อลบ root ของ runtime-dependency ภายนอกที่ไม่รู้จักและค้างอยู่จาก layout แบบแพ็กเกจรุ่นเก่า

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` ลบ records ของ Plugin ออกจาก `plugins.entries`, ดัชนี Plugin ที่บันทึกไว้, รายการอนุญาต/ปฏิเสธของ Plugin และรายการ `plugins.load.paths` แบบ linked เมื่อเกี่ยวข้อง เว้นแต่ตั้งค่า `--keep-files` ไว้ uninstall จะลบไดเรกทอรี managed install ที่ติดตามไว้ด้วยเมื่อไดเรกทอรีนั้นอยู่ภายใน root ส่วนขยาย Plugin ของ OpenClaw สำหรับ Plugin หน่วยความจำที่ใช้งานอยู่ ช่องหน่วยความจำจะรีเซ็ตเป็น `memory-core`

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

การอัปเดตใช้กับการติดตั้ง Plugin ที่ติดตามไว้ใน managed plugin index และการติดตั้ง hook-pack ที่ติดตามไว้ใน `hooks.internal.installs`

<AccordionGroup>
  <Accordion title="การ resolve id ของ Plugin เทียบกับ npm spec">
    เมื่อคุณส่ง id ของ Plugin OpenClaw จะนำ install spec ที่บันทึกไว้สำหรับ Plugin นั้นกลับมาใช้ ซึ่งหมายความว่า dist-tags ที่เคยเก็บไว้ เช่น `@beta` และเวอร์ชันที่ pin แบบตรงตัวจะยังคงถูกใช้ในการรัน `update <id>` ครั้งต่อไป

    สำหรับการติดตั้ง npm คุณยังสามารถส่ง npm package spec แบบชัดเจนพร้อม dist-tag หรือเวอร์ชันตรงตัวได้ OpenClaw จะ resolve ชื่อ package นั้นกลับไปยัง record ของ Plugin ที่ติดตามไว้ อัปเดต Plugin ที่ติดตั้งนั้น และบันทึก npm spec ใหม่สำหรับการอัปเดตตาม id ในอนาคต

    การส่งชื่อ npm package โดยไม่มีเวอร์ชันหรือ tag ก็จะ resolve กลับไปยัง record ของ Plugin ที่ติดตามไว้เช่นกัน ใช้กรณีนี้เมื่อ Plugin ถูก pin ไว้กับเวอร์ชันตรงตัวและคุณต้องการย้ายกลับไปยัง release line เริ่มต้นของรีจิสทรี

  </Accordion>
  <Accordion title="การตรวจสอบเวอร์ชันและ integrity drift">
    ก่อนอัปเดต npm แบบสด OpenClaw จะตรวจสอบเวอร์ชัน package ที่ติดตั้งกับเมตาดาต้าของ npm registry หากเวอร์ชันที่ติดตั้งและ identity ของ artifact ที่บันทึกไว้ตรงกับเป้าหมายที่ resolve แล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน `openclaw.json` ใหม่

    เมื่อมี integrity hash ที่เก็บไว้และ hash ของ artifact ที่ fetch มาเปลี่ยนไป OpenClaw จะถือว่านั่นเป็น npm artifact drift คำสั่ง `openclaw plugins update` แบบโต้ตอบจะแสดง hash ที่คาดหวังและ hash จริง แล้วถามเพื่อยืนยันก่อนดำเนินการต่อ ตัวช่วยอัปเดตแบบ non-interactive จะ fail closed เว้นแต่ caller จะระบุนโยบายการดำเนินการต่ออย่างชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install บนการอัปเดต">
    `--dangerously-force-unsafe-install` ยังใช้ได้กับ `plugins update` ในฐานะ override ฉุกเฉินสำหรับผลบวกปลอมของการสแกนโค้ดอันตรายที่มีในตัวระหว่างการอัปเดต Plugin แต่ยังคงไม่ข้ามบล็อกจากนโยบาย `before_install` ของ Plugin หรือการบล็อกเมื่อการสแกนล้มเหลว และใช้ได้เฉพาะกับการอัปเดต Plugin ไม่ใช่การอัปเดต hook-pack
  </Accordion>
</AccordionGroup>

### ตรวจสอบ

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

การตรวจสอบเชิงลึกสำหรับ Plugin เดี่ยว แสดง identity, สถานะการโหลด, แหล่งที่มา, capabilities ที่ลงทะเบียนไว้, hooks, tools, commands, services, gateway methods, HTTP routes, policy flags, diagnostics, เมตาดาต้าการติดตั้ง, bundle capabilities และการรองรับ MCP หรือ LSP server ใด ๆ ที่ตรวจพบ

Plugin แต่ละตัวถูกจำแนกตามสิ่งที่ลงทะเบียนจริงใน runtime:

- **plain-capability** — capability type เดียว (เช่น Plugin ที่เป็น provider เท่านั้น)
- **hybrid-capability** — capability types หลายแบบ (เช่น text + speech + images)
- **hook-only** — มีเฉพาะ hooks ไม่มี capabilities หรือ surfaces
- **non-capability** — tools/commands/services แต่ไม่มี capabilities

ดู [รูปร่างของ Plugin](/th/plugins/architecture#plugin-shapes) สำหรับข้อมูลเพิ่มเติมเกี่ยวกับโมเดล capability

<Note>
flag `--json` ส่งออกรายงานแบบ machine-readable ที่เหมาะสำหรับ scripting และ auditing `inspect --all` แสดงผลตารางทั้ง fleet พร้อมคอลัมน์ shape, capability kinds, compatibility notices, bundle capabilities และสรุป hook `info` เป็น alias ของ `inspect`
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` รายงานข้อผิดพลาดการโหลด Plugin, diagnostics ของ manifest/discovery และ compatibility notices เมื่อทุกอย่างสะอาด จะพิมพ์ `No plugin issues detected.`

สำหรับความล้มเหลวของ module-shape เช่น export `register`/`activate` หายไป ให้รันซ้ำพร้อม `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุป export-shape แบบกระชับไว้ใน diagnostic output

### รีจิสทรี

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

รีจิสทรี Plugin ภายในเครื่องคือ persisted cold read model ของ OpenClaw สำหรับ identity ของ Plugin, การเปิดใช้งาน, เมตาดาต้าแหล่งที่มา และความเป็นเจ้าของ contribution การเริ่มต้นตามปกติ, การค้นหาเจ้าของ provider, การจำแนกการตั้งค่า channel และ inventory ของ Plugin สามารถอ่านได้โดยไม่ต้อง import โมดูล runtime ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่ารีจิสทรีที่บันทึกไว้นั้นมีอยู่ เป็นปัจจุบัน หรือ stale ใช้ `--refresh` เพื่อสร้างใหม่จากดัชนี Plugin ที่บันทึกไว้, นโยบาย config และเมตาดาต้า manifest/package นี่คือ path สำหรับ repair ไม่ใช่ path สำหรับ runtime activation

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็นสวิตช์ความเข้ากันได้ฉุกเฉินที่เลิกใช้แล้วสำหรับความล้มเหลวในการอ่านรีจิสทรี ควรใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix`; env fallback มีไว้เฉพาะสำหรับการกู้คืนการเริ่มต้นในกรณีฉุกเฉินระหว่าง rollout การ migration
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

รายการ Marketplace รับ path ของ marketplace ภายในเครื่อง, path ของ `marketplace.json`, GitHub shorthand เช่น `owner/repo`, URL ของ GitHub repo หรือ git URL `--json` พิมพ์ label ของแหล่งที่ resolve แล้ว พร้อม manifest ของ marketplace ที่ parse แล้วและรายการ Plugin

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Plugin ชุมชน](/th/plugins/community)
