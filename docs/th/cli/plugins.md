---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือบันเดิลที่เข้ากันได้
    - คุณต้องการดีบักความล้มเหลวในการโหลด Plugin
sidebarTitle: Plugins
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-01T10:15:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a7aebe4ee647d7821b881cdb9d5af01d70508c38b36462ff7b57fb44769dc2f
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Plugin ของ Gateway, แพ็ก hook และ bundle ที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="ระบบ Plugin" href="/th/tools/plugin">
    คู่มือสำหรับผู้ใช้ปลายทางในการติดตั้ง เปิดใช้งาน และแก้ไขปัญหา Plugin
  </Card>
  <Card title="Bundle ของ Plugin" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของ bundle
  </Card>
  <Card title="Manifest ของ Plugin" href="/th/plugins/manifest">
    ฟิลด์ manifest และสคีมา config
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

สำหรับการตรวจสอบกรณีติดตั้ง ตรวจสอบ ถอนการติดตั้ง หรือรีเฟรช registry ช้า ให้รันคำสั่งด้วย `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` trace จะเขียนเวลาของแต่ละ phase ไปยัง stderr และยังทำให้เอาต์พุต JSON parse ได้ ดู [การดีบัก](/th/help/debugging#plugin-lifecycle-trace)

<Note>
Plugin ที่ bundle มาพร้อมกับ OpenClaw จะจัดส่งมากับ OpenClaw บางรายการถูกเปิดใช้งานตามค่าเริ่มต้น (เช่น provider โมเดลที่ bundle มา, provider เสียงพูดที่ bundle มา และ Plugin เบราว์เซอร์ที่ bundle มา); รายการอื่นต้องใช้ `plugins enable`

Plugin แบบ native ของ OpenClaw ต้องจัดส่ง `openclaw.plugin.json` พร้อม JSON Schema แบบ inline (`configSchema` แม้จะว่างก็ตาม) ส่วน bundle ที่เข้ากันได้จะใช้ manifest ของ bundle เองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุตแบบ verbose ของ list/info ยังแสดง subtype ของ bundle (`codex`, `claude` หรือ `cursor`) พร้อมความสามารถของ bundle ที่ตรวจพบ
</Note>

### ติดตั้ง

```bash
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
ชื่อ package แบบเปล่าจะถูกตรวจสอบกับ ClawHub ก่อน แล้วจึงตรวจสอบกับ npm ให้ปฏิบัติต่อการติดตั้ง Plugin เหมือนการรันโค้ด ควรใช้เวอร์ชันที่ pin ไว้
</Warning>

<Note>
ClawHub เป็นพื้นที่หลักสำหรับการเผยแพร่และค้นพบ Plugin ส่วนใหญ่ Npm ยังคงเป็น fallback และเส้นทางติดตั้งโดยตรงที่รองรับ ระหว่างการย้ายไปยัง ClawHub, OpenClaw ยังคงจัดส่ง package Plugin `@openclaw/*` บางรายการที่ OpenClaw เป็นเจ้าของบน npm; เวอร์ชัน package เหล่านั้นอาจตามหลังซอร์สที่ bundle มาในแต่ละรอบ release ของ Plugin หาก npm รายงานว่า package Plugin ที่ OpenClaw เป็นเจ้าของถูก deprecated เวอร์ชันที่เผยแพร่นั้นคือ artifact ภายนอกเก่า; ให้ใช้ Plugin ที่ bundle มากับ OpenClaw ปัจจุบันหรือ checkout ภายในเครื่องจนกว่าจะเผยแพร่ package npm ที่ใหม่กว่า
</Note>

<AccordionGroup>
  <Accordion title="Config includes และการกู้คืน config ที่ไม่ถูกต้อง">
    หากส่วน `plugins` ของคุณรองรับด้วย `$include` แบบไฟล์เดียว `plugins install/update/enable/disable/uninstall` จะเขียนผ่านไปยังไฟล์ที่ include นั้นและปล่อย `openclaw.json` ไว้ไม่เปลี่ยนแปลง Root includes, include arrays และ includes ที่มี sibling overrides จะ fail closed แทนการ flatten ดูรูปแบบที่รองรับได้ที่ [Config includes](/th/gateway/configuration)

    หาก config ไม่ถูกต้องระหว่างติดตั้ง โดยปกติ `plugins install` จะ fail closed และบอกให้คุณรัน `openclaw doctor --fix` ก่อน ระหว่างการเริ่มต้น Gateway, config ที่ไม่ถูกต้องของ Plugin หนึ่งรายการจะถูกแยกไว้เฉพาะ Plugin นั้น เพื่อให้ช่องทางและ Plugin อื่นยังทำงานต่อได้; `openclaw doctor --fix` สามารถกักกันรายการ Plugin ที่ไม่ถูกต้องได้ ข้อยกเว้นช่วงติดตั้งที่มีเอกสารระบุไว้เพียงอย่างเดียวคือเส้นทางกู้คืนแบบจำกัดสำหรับ Plugin ที่ bundle มาและ opt in อย่างชัดเจนใน `openclaw.install.allowInvalidConfigRecovery`

  </Accordion>
  <Accordion title="--force และการติดตั้งซ้ำเทียบกับการอัปเดต">
    `--force` ใช้เป้าหมายการติดตั้งเดิมซ้ำและเขียนทับ Plugin หรือแพ็ก hook ที่ติดตั้งไว้แล้วในตำแหน่งเดิม ใช้เมื่อคุณตั้งใจติดตั้ง id เดิมซ้ำจาก local path, archive, package ClawHub หรือ artifact npm ใหม่ สำหรับการอัปเกรดตามปกติของ Plugin npm ที่ติดตามอยู่แล้ว ควรใช้ `openclaw plugins update <id-or-npm-spec>`

    หากคุณรัน `plugins install` สำหรับ id ของ Plugin ที่ติดตั้งอยู่แล้ว OpenClaw จะหยุดและชี้ให้คุณใช้ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติ หรือใช้ `plugins install <package> --force` เมื่อคุณต้องการเขียนทับการติดตั้งปัจจุบันจากแหล่งอื่นจริง ๆ

  </Accordion>
  <Accordion title="ขอบเขตของ --pin">
    `--pin` ใช้ได้กับการติดตั้ง npm เท่านั้น ไม่รองรับกับการติดตั้ง `git:`; ใช้ git ref ที่ชัดเจน เช่น `git:github.com/acme/plugin@v1.2.3` เมื่อคุณต้องการซอร์สที่ pin ไว้ ไม่รองรับกับ `--marketplace` เพราะการติดตั้ง marketplace จะบันทึก metadata แหล่งที่มาของ marketplace แทน npm spec
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` เป็นตัวเลือก break-glass สำหรับ false positive ในตัวสแกนโค้ดอันตรายในตัว มันอนุญาตให้การติดตั้งดำเนินต่อได้แม้ตัวสแกนในตัวรายงานผล `critical` แต่จะ **ไม่** ข้ามบล็อกนโยบาย hook `before_install` ของ Plugin และ **ไม่** ข้ามความล้มเหลวของการสแกน

    flag ของ CLI นี้ใช้กับ flow การติดตั้ง/อัปเดต Plugin การติดตั้ง dependency ของ skill ที่รองรับโดย Gateway ใช้ request override ที่ตรงกันคือ `dangerouslyForceUnsafeInstall` ขณะที่ `openclaw skills install` ยังคงเป็น flow ดาวน์โหลด/ติดตั้ง skill ของ ClawHub แยกต่างหาก

    หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกบล็อกโดยการสแกน registry ให้ใช้ขั้นตอนสำหรับ publisher ใน [ClawHub](/th/tools/clawhub)

  </Accordion>
  <Accordion title="แพ็ก hook และ spec ของ npm">
    `plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับแพ็ก hook ที่ expose `openclaw.hooks` ใน `package.json` ด้วย ใช้ `openclaw hooks` สำหรับการมองเห็น hook แบบกรองและการเปิดใช้งานราย hook ไม่ใช่สำหรับการติดตั้ง package

    spec ของ npm เป็นแบบ **registry-only** (ชื่อ package + **เวอร์ชันที่แน่นอน** หรือ **dist-tag** ที่เป็นตัวเลือก) Git/URL/file specs และช่วง semver จะถูกปฏิเสธ การติดตั้ง dependency จะรันแบบ project-local พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้ shell ของคุณจะมีการตั้งค่าติดตั้ง npm แบบ global อยู่ก็ตาม

    ใช้ `npm:<package>` เมื่อคุณต้องการข้ามการค้นหา ClawHub และติดตั้งโดยตรงจาก npm spec ของ package แบบเปล่ายังคงให้ความสำคัญกับ ClawHub และจะ fallback ไป npm เฉพาะเมื่อ ClawHub ไม่มี package หรือเวอร์ชันนั้น

    spec แบบเปล่าและ `@latest` จะอยู่บน stable track หาก npm resolve รายการใดรายการหนึ่งไปเป็น prerelease, OpenClaw จะหยุดและขอให้คุณ opt in อย่างชัดเจนด้วย tag prerelease เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease ที่แน่นอน เช่น `@1.2.3-beta.4`

    หาก spec การติดตั้งแบบเปล่าตรงกับ id ของ Plugin ที่ bundle มา (เช่น `diffs`), OpenClaw จะติดตั้ง Plugin ที่ bundle มาโดยตรง หากต้องการติดตั้ง package npm ที่มีชื่อเดียวกัน ให้ใช้ spec ที่มี scope ชัดเจน (เช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="Repository ของ Git">
    ใช้ `git:<repo>` เพื่อติดตั้งโดยตรงจาก repository ของ git รูปแบบที่รองรับรวมถึง `git:github.com/owner/repo`, `git:owner/repo`, URL clone แบบเต็ม `https://`, `ssh://`, `git://`, `file://` และ `git@host:owner/repo.git` เพิ่ม `@<ref>` หรือ `#<ref>` เพื่อ checkout branch, tag หรือ commit ก่อนติดตั้ง

    การติดตั้ง Git จะ clone ไปยังไดเรกทอรีชั่วคราว checkout ref ที่ร้องขอเมื่อมีอยู่ แล้วใช้ตัวติดตั้งไดเรกทอรี Plugin ปกติ นั่นหมายความว่าการตรวจสอบ manifest, การสแกนโค้ดอันตราย, การ staging runtime dependency และบันทึกการติดตั้งจะทำงานเหมือนการติดตั้งจาก local path การติดตั้ง git ที่บันทึกไว้จะรวม URL/ref ของซอร์สพร้อม commit ที่ resolve แล้ว เพื่อให้ `openclaw plugins update` สามารถ re-resolve ซอร์สได้ภายหลัง

    หลังติดตั้งจาก git ให้ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อตรวจสอบการลงทะเบียน runtime เช่น method ของ gateway และคำสั่ง CLI หาก Plugin ลงทะเบียน root ของ CLI ด้วย `api.registerCli` ให้ execute คำสั่งนั้นโดยตรงผ่าน root CLI ของ OpenClaw เช่น `openclaw demo-plugin ping`

  </Accordion>
  <Accordion title="Archive">
    archive ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` archive ของ Plugin แบบ native ของ OpenClaw ต้องมี `openclaw.plugin.json` ที่ถูกต้องอยู่ที่ root ของ Plugin หลังแตกไฟล์; archive ที่มีเพียง `package.json` จะถูกปฏิเสธก่อนที่ OpenClaw จะเขียนบันทึกการติดตั้ง

    รองรับการติดตั้ง marketplace ของ Claude ด้วย

  </Accordion>
</AccordionGroup>

การติดตั้ง ClawHub ใช้ locator `clawhub:<package>` ที่ชัดเจน:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

ตอนนี้ OpenClaw ยังให้ความสำคัญกับ ClawHub สำหรับ spec ของ Plugin ที่ปลอดภัยสำหรับ npm แบบเปล่าด้วย โดยจะ fallback ไป npm เฉพาะเมื่อ ClawHub ไม่มี package หรือเวอร์ชันนั้น:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อบังคับการ resolve แบบ npm-only เช่น เมื่อ ClawHub เข้าถึงไม่ได้ หรือคุณรู้ว่า package มีอยู่เฉพาะบน npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw ดาวน์โหลด archive ของ package จาก ClawHub ตรวจสอบ API ของ Plugin ที่ประกาศไว้ / ความเข้ากันได้ขั้นต่ำของ gateway แล้วติดตั้งผ่านเส้นทาง archive ปกติ การติดตั้งที่บันทึกไว้จะเก็บ metadata แหล่งที่มา ClawHub ไว้สำหรับการอัปเดตภายหลัง
การติดตั้ง ClawHub แบบไม่มีเวอร์ชันจะเก็บ spec ที่บันทึกไว้แบบไม่มีเวอร์ชัน เพื่อให้ `openclaw plugins update` สามารถตาม release ใหม่ของ ClawHub ได้; selector แบบเวอร์ชันหรือ tag ที่ชัดเจน เช่น `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` จะยังคง pin อยู่กับ selector นั้น

#### รูปย่อของ marketplace

ใช้รูปย่อ `plugin@marketplace` เมื่อชื่อ marketplace มีอยู่ในแคช registry ภายในเครื่องของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="แหล่งที่มาของ marketplace">
    - ชื่อ known-marketplace ของ Claude จาก `~/.claude/plugins/known_marketplaces.json`
    - root ของ marketplace ภายในเครื่องหรือ path ของ `marketplace.json`
    - รูปย่อของ repo GitHub เช่น `owner/repo`
    - URL ของ repo GitHub เช่น `https://github.com/owner/repo`
    - URL ของ git

  </Tab>
  <Tab title="กฎของ marketplace ระยะไกล">
    สำหรับ marketplace ระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องอยู่ภายใน repo marketplace ที่ clone มา OpenClaw ยอมรับแหล่งที่มาแบบ relative path จาก repo นั้น และปฏิเสธ HTTP(S), absolute-path, git, GitHub และแหล่งที่มา Plugin อื่นที่ไม่ใช่ path จาก manifest ระยะไกล
  </Tab>
</Tabs>

สำหรับ local path และ archive, OpenClaw ตรวจจับอัตโนมัติ:

- Plugin OpenClaw แบบเนทีฟ (`openclaw.plugin.json`)
- บันเดิลที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- บันเดิลที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือเลย์เอาต์คอมโพเนนต์เริ่มต้นของ Claude)
- บันเดิลที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

<Note>
บันเดิลที่เข้ากันได้จะติดตั้งลงในรูท Plugin ปกติ และเข้าร่วมโฟลว์ list/info/enable/disable เดียวกัน ปัจจุบันรองรับ Skills ของบันเดิล, command-skills ของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` / `lspServers` ที่ประกาศในแมนิเฟสต์ของ Claude, command-skills ของ Cursor และไดเรกทอรี hook ของ Codex ที่เข้ากันได้ ส่วนความสามารถอื่นของบันเดิลที่ตรวจพบจะแสดงใน diagnostics/info แต่ยังไม่ได้เชื่อมต่อเข้ากับการทำงาน runtime
</Note>

### รายการ

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  แสดงเฉพาะ Plugin ที่เปิดใช้งานอยู่
</ParamField>
<ParamField path="--verbose" type="boolean">
  เปลี่ยนจากมุมมองตารางเป็นบรรทัดรายละเอียดราย Plugin พร้อมเมทาดาทา source/origin/version/activation
</ParamField>
<ParamField path="--json" type="boolean">
  อินเวนทอรีที่เครื่องอ่านได้พร้อม diagnostics ของ registry
</ParamField>

<Note>
`plugins list` อ่าน registry ของ Plugin ภายในเครื่องที่บันทึกไว้ก่อน โดยมี fallback ที่สร้างจากแมนิเฟสต์เท่านั้นเมื่อ registry หายไปหรือไม่ถูกต้อง คำสั่งนี้มีประโยชน์สำหรับตรวจสอบว่า Plugin ติดตั้งแล้ว เปิดใช้งานแล้ว และมองเห็นได้สำหรับการวางแผน cold startup หรือไม่ แต่ไม่ใช่การ probe runtime แบบ live ของกระบวนการ Gateway ที่กำลังทำงานอยู่ หลังจากเปลี่ยนโค้ด Plugin, การเปิดใช้งาน, นโยบาย hook หรือ `plugins.load.paths` ให้รีสตาร์ท Gateway ที่ให้บริการช่องทางนั้นก่อนคาดหวังให้โค้ด `register(api)` หรือ hook ใหม่ทำงาน สำหรับการติดตั้งใช้งานแบบ remote/container ให้ตรวจสอบว่าคุณกำลังรีสตาร์ท child `openclaw gateway run` จริง ไม่ใช่แค่กระบวนการ wrapper
</Note>

สำหรับงาน Plugin ที่บันเดิลอยู่ภายในอิมเมจ Docker แบบแพ็กเกจ ให้ bind-mount ไดเรกทอรีซอร์สของ Plugin
ทับพาธซอร์สแบบแพ็กเกจที่ตรงกัน เช่น
`/app/extensions/synology-chat` OpenClaw จะค้นพบโอเวอร์เลย์ซอร์สที่ mount ไว้นั้น
ก่อน `/app/dist/extensions/synology-chat`; ไดเรกทอรีซอร์สที่คัดลอกแบบธรรมดาจะยังไม่ทำงาน เพื่อให้การติดตั้งแบบแพ็กเกจปกติยังคงใช้ dist ที่คอมไพล์แล้ว

สำหรับการดีบัก runtime hook:

- `openclaw plugins inspect <id> --runtime --json` แสดง hook ที่ลงทะเบียนไว้และ diagnostics จากรอบการตรวจสอบที่โหลดโมดูล การตรวจสอบ runtime จะไม่ดาวน์โหลด dependency runtime แบบบันเดิลที่ขาดอยู่ ใช้ `openclaw plugins deps --repair` เมื่อจำเป็นต้องซ่อมแซม
- `openclaw gateway status --deep --require-rpc` ยืนยัน Gateway ที่เข้าถึงได้, hint ของ service/process, พาธ config และสุขภาพ RPC
- hook การสนทนาแบบไม่บันเดิล (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรีภายในเครื่อง (เพิ่มลงใน `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
ไม่รองรับ `--force` ร่วมกับ `--link` เพราะการติดตั้งแบบ linked จะใช้พาธซอร์สซ้ำแทนการคัดลอกทับเป้าหมายติดตั้งที่จัดการโดยระบบ

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึก spec แบบ exact ที่ resolve แล้ว (`name@version`) ในดัชนี Plugin ที่จัดการโดยระบบ พร้อมคงพฤติกรรมเริ่มต้นไว้แบบไม่ pin
</Note>

### ดัชนี Plugin

เมทาดาทาการติดตั้ง Plugin เป็นสถานะที่เครื่องจัดการ ไม่ใช่ config ของผู้ใช้ การติดตั้งและอัปเดตจะเขียนไปที่ `plugins/installs.json` ใต้ไดเรกทอรีสถานะ OpenClaw ที่ใช้งานอยู่ แผนที่ `installRecords` ระดับบนสุดเป็นแหล่งข้อมูลที่คงทนของเมทาดาทาการติดตั้ง รวมถึง record สำหรับแมนิเฟสต์ Plugin ที่เสียหรือหายไป อาร์เรย์ `plugins` คือแคช cold registry ที่สร้างจากแมนิเฟสต์ ไฟล์นี้มีคำเตือนว่าอย่าแก้ไข และถูกใช้โดย `openclaw plugins update`, การถอนการติดตั้ง, diagnostics และ cold plugin registry

เมื่อ OpenClaw พบ record `plugins.installs` แบบ legacy ที่ส่งมากับ config จะย้าย record เหล่านั้นเข้าไปในดัชนี Plugin และลบคีย์ config ออก หากการเขียนอย่างใดอย่างหนึ่งล้มเหลว record ใน config จะถูกเก็บไว้เพื่อไม่ให้เมทาดาทาการติดตั้งสูญหาย

### Runtime deps

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` ตรวจสอบสเตจ dependency runtime แบบแพ็กเกจสำหรับ Plugin แบบบันเดิลที่ OpenClaw เป็นเจ้าของ ซึ่งถูกเลือกโดย config ของ Plugin, ช่องทางที่เปิดใช้งาน/กำหนดค่าไว้, model provider ที่กำหนดค่าไว้ หรือค่าเริ่มต้นจากแมนิเฟสต์แบบบันเดิล คำสั่งนี้ไม่ใช่พาธ install/update สำหรับ Plugin npm ของบุคคลที่สามหรือ Plugin จาก ClawHub

ใช้ `--repair` เมื่อการติดตั้งแบบแพ็กเกจรายงานว่า dependency runtime แบบบันเดิลหายไประหว่างการเริ่มต้น Gateway หรือ `plugins doctor` การซ่อมแซมจะติดตั้งเฉพาะ dependency ของ Plugin แบบบันเดิลที่เปิดใช้งานและขาดอยู่ โดยปิด lifecycle script ใช้ `--prune` เพื่อลบรูท dependency runtime ภายนอกที่ไม่รู้จักและค้างอยู่จากเลย์เอาต์แพ็กเกจรุ่นเก่า

ดูแผนเต็ม การ staging และ lifecycle การซ่อมแซมได้ที่ [การ resolve dependency ของ Plugin](/th/plugins/dependency-resolution)

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` ลบ record ของ Plugin ออกจาก `plugins.entries`, ดัชนี Plugin ที่บันทึกไว้, รายการ allow/deny ของ Plugin และรายการ `plugins.load.paths` แบบ linked เมื่อเกี่ยวข้อง เว้นแต่ตั้งค่า `--keep-files` การถอนการติดตั้งจะลบไดเรกทอรีติดตั้งที่จัดการโดยระบบและติดตามอยู่ด้วย เมื่อไดเรกทอรีนั้นอยู่ภายในรูท extensions ของ Plugin ของ OpenClaw สำหรับ Plugin active memory ช่อง memory จะรีเซ็ตเป็น `memory-core`

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

การอัปเดตใช้กับการติดตั้ง Plugin ที่ติดตามไว้ในดัชนี Plugin ที่จัดการโดยระบบ และการติดตั้ง hook-pack ที่ติดตามไว้ใน `hooks.internal.installs`

<AccordionGroup>
  <Accordion title="การ resolve plugin id กับ npm spec">
    เมื่อคุณส่ง plugin id เข้ามา OpenClaw จะนำ spec การติดตั้งที่บันทึกไว้สำหรับ Plugin นั้นมาใช้ซ้ำ ซึ่งหมายความว่า dist-tag ที่เคยจัดเก็บไว้ เช่น `@beta` และเวอร์ชัน exact ที่ pin ไว้ จะยังคงถูกใช้ในการรัน `update <id>` ครั้งถัดไป

    สำหรับการติดตั้ง npm คุณยังสามารถส่ง npm package spec แบบชัดเจนพร้อม dist-tag หรือเวอร์ชัน exact ได้ด้วย OpenClaw จะ resolve ชื่อแพ็กเกจนั้นกลับไปยัง record ของ Plugin ที่ติดตามไว้ อัปเดต Plugin ที่ติดตั้งนั้น และบันทึก npm spec ใหม่สำหรับการอัปเดตตาม id ในอนาคต

    การส่งชื่อแพ็กเกจ npm โดยไม่มีเวอร์ชันหรือ tag จะ resolve กลับไปยัง record ของ Plugin ที่ติดตามไว้เช่นกัน ใช้วิธีนี้เมื่อ Plugin ถูก pin ไว้กับเวอร์ชัน exact และคุณต้องการย้ายกลับไปยังสาย release เริ่มต้นของ registry

  </Accordion>
  <Accordion title="การตรวจสอบเวอร์ชันและ integrity drift">
    ก่อนการอัปเดต npm แบบ live OpenClaw จะตรวจสอบเวอร์ชันแพ็กเกจที่ติดตั้งเทียบกับเมทาดาทา npm registry หากเวอร์ชันที่ติดตั้งและอัตลักษณ์ artifact ที่บันทึกไว้ตรงกับเป้าหมายที่ resolve แล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน `openclaw.json` ใหม่

    เมื่อมีการเก็บ hash integrity ไว้และ hash ของ artifact ที่ fetch มาเปลี่ยนไป OpenClaw จะถือว่าเป็น npm artifact drift คำสั่ง interactive `openclaw plugins update` จะพิมพ์ hash ที่คาดหวังและ hash จริง แล้วขอการยืนยันก่อนดำเนินการต่อ helper การอัปเดตแบบ non-interactive จะ fail closed เว้นแต่ caller จะระบุนโยบายการดำเนินการต่ออย่างชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install บน update">
    `--dangerously-force-unsafe-install` พร้อมใช้งานบน `plugins update` เช่นกัน ในฐานะ override ยามจำเป็นสำหรับ false positive จากการสแกน dangerous-code ในตัวระหว่างการอัปเดต Plugin แต่ยังคงไม่ข้าม policy block ของ `before_install` ของ Plugin หรือการบล็อกจาก scan-failure และใช้ได้เฉพาะกับการอัปเดต Plugin เท่านั้น ไม่ใช่การอัปเดต hook-pack
  </Accordion>
</AccordionGroup>

### ตรวจสอบ

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect แสดง identity, สถานะการโหลด, source, ความสามารถจากแมนิเฟสต์, policy flag, diagnostics, เมทาดาทาการติดตั้ง, ความสามารถของบันเดิล และการรองรับเซิร์ฟเวอร์ MCP หรือ LSP ที่ตรวจพบ โดยค่าเริ่มต้นไม่ import runtime ของ Plugin เพิ่ม `--runtime` เพื่อโหลดโมดูล Plugin และรวม hook, tool, command, service, gateway method และ HTTP route ที่ลงทะเบียนไว้ การตรวจสอบ runtime จะล้มเหลวพร้อม hint การซ่อมแซมเมื่อ dependency runtime แบบบันเดิลขาดอยู่ ใช้ `openclaw plugins deps --repair` เพื่อซ่อมแซมอย่างชัดเจน

คำสั่ง CLI ที่ Plugin เป็นเจ้าของจะถูกติดตั้งเป็นกลุ่มคำสั่ง `openclaw` ระดับรูท หลังจาก `inspect --runtime` แสดงคำสั่งใต้ `cliCommands` ให้รันเป็น `openclaw <command> ...`; ตัวอย่างเช่น Plugin ที่ลงทะเบียน `demo-git` สามารถตรวจสอบได้ด้วย `openclaw demo-git ping`

Plugin แต่ละตัวถูกจัดประเภทตามสิ่งที่ลงทะเบียนจริงใน runtime:

- **plain-capability** — ความสามารถหนึ่งประเภท (เช่น Plugin ที่เป็น provider เท่านั้น)
- **hybrid-capability** — ความสามารถหลายประเภท (เช่น ข้อความ + เสียงพูด + รูปภาพ)
- **hook-only** — มีเฉพาะ hook ไม่มีความสามารถหรือ surface
- **non-capability** — มี tool/command/service แต่ไม่มีความสามารถ

ดูเพิ่มเติมเกี่ยวกับโมเดลความสามารถได้ที่ [รูปแบบของ Plugin](/th/plugins/architecture#plugin-shapes)

<Note>
flag `--json` ส่งออกรายงานที่เครื่องอ่านได้ เหมาะสำหรับ scripting และ auditing `inspect --all` แสดงตารางทั้ง fleet พร้อมคอลัมน์ shape, capability kinds, compatibility notices, bundle capabilities และ hook summary `info` เป็น alias ของ `inspect`
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` รายงานข้อผิดพลาดการโหลด Plugin, diagnostics ของ manifest/discovery และ compatibility notices เมื่อทุกอย่างเรียบร้อยจะแสดง `No plugin issues detected.`

สำหรับความล้มเหลวของ module-shape เช่น export `register`/`activate` ที่หายไป ให้รันซ้ำพร้อม `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุป export-shape แบบกะทัดรัดในเอาต์พุต diagnostic

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

local plugin registry คือ persisted cold read model ของ OpenClaw สำหรับอัตลักษณ์ Plugin ที่ติดตั้ง, การเปิดใช้งาน, เมทาดาทา source และความเป็นเจ้าของ contribution การเริ่มต้นปกติ, การค้นหาเจ้าของ provider, การจำแนก channel setup และอินเวนทอรี Plugin สามารถอ่านจากส่วนนี้ได้โดยไม่ต้อง import โมดูล runtime ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่า persisted registry มีอยู่ เป็นปัจจุบัน หรือ stale ใช้ `--refresh` เพื่อสร้างใหม่จากดัชนี Plugin ที่บันทึกไว้, นโยบาย config และเมทาดาทา manifest/package นี่คือพาธการซ่อมแซม ไม่ใช่พาธการเปิดใช้งาน runtime

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็นสวิตช์ความเข้ากันได้ยามจำเป็นที่เลิกใช้แล้วสำหรับความล้มเหลวในการอ่าน registry ควรใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix`; fallback ผ่าน env มีไว้สำหรับการกู้คืน startup ฉุกเฉินระหว่างที่ migration ทยอยเปิดใช้งานเท่านั้น
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list รับพาธ marketplace ภายในเครื่อง, พาธ `marketplace.json`, ชวเลข GitHub เช่น `owner/repo`, URL ของ repo GitHub หรือ URL git `--json` พิมพ์ป้ายกำกับ source ที่ resolve แล้ว พร้อมแมนิเฟสต์ marketplace ที่ parse แล้วและรายการ Plugin

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [เอกสารอ้างอิง CLI](/th/cli)
- [Plugin ชุมชน](/th/plugins/community)
