---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Gateway Plugins หรือ bundles ที่เข้ากันได้
    - คุณต้องการแก้ไขข้อบกพร่องของความล้มเหลวในการโหลด Plugin
sidebarTitle: Plugins
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-26T11:26:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52b02c96859e1da1d7028bce375045ef9472d1f2e01086f1318e4f38e8d5bb7d
    source_path: cli/plugins.md
    workflow: 15
---

จัดการ Gateway Plugins, hook packs และ bundles ที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="ระบบ Plugin" href="/th/tools/plugin">
    คู่มือสำหรับผู้ใช้ปลายทางในการติดตั้ง เปิดใช้งาน และแก้ไขปัญหา Plugins
  </Card>
  <Card title="Plugin bundles" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของ bundle
  </Card>
  <Card title="Plugin manifest" href="/th/plugins/manifest">
    ฟิลด์ของ manifest และ config schema
  </Card>
  <Card title="ความปลอดภัย" href="/th/gateway/security">
    การเสริมความมั่นคงปลอดภัยสำหรับการติดตั้ง Plugin
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
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

<Note>
Bundled plugins มาพร้อมกับ OpenClaw โดยบางตัวจะเปิดใช้งานเป็นค่าเริ่มต้น (เช่น bundled model providers, bundled speech providers และ bundled browser plugin) ส่วนตัวอื่นต้องใช้ `plugins enable`

OpenClaw plugins แบบเนทีฟต้องมาพร้อม `openclaw.plugin.json` ที่มี JSON Schema แบบ inline (`configSchema` แม้จะว่างก็ตาม) ส่วน bundles ที่เข้ากันได้จะใช้ bundle manifests ของตัวเองแทน

`plugins list` จะแสดง `Format: openclaw` หรือ `Format: bundle` และเอาต์พุตแบบ verbose ของ list/info จะแสดง subtype ของ bundle (`codex`, `claude` หรือ `cursor`) พร้อมความสามารถของ bundle ที่ตรวจพบด้วย
</Note>

### ติดตั้ง

```bash
openclaw plugins install <package>                      # ClawHub ก่อน แล้วจึง npm
openclaw plugins install clawhub:<package>              # ClawHub เท่านั้น
openclaw plugins install <package> --force              # เขียนทับการติดตั้งที่มีอยู่
openclaw plugins install <package> --pin                # ปักหมุดเวอร์ชัน
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # พาธในเครื่อง
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (ระบุชัดเจน)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
ชื่อแพ็กเกจแบบเปล่า ๆ จะถูกตรวจสอบกับ ClawHub ก่อน แล้วจึง npm ให้ถือว่าการติดตั้ง Plugin เทียบเท่ากับการรันโค้ด ควรใช้เวอร์ชันที่ปักหมุดไว้
</Warning>

<AccordionGroup>
  <Accordion title="Config includes และการกู้คืนจาก config ที่ไม่ถูกต้อง">
    หากส่วน `plugins` ของคุณอ้างอิงด้วย `$include` แบบไฟล์เดียว `plugins install/update/enable/disable/uninstall` จะเขียนผ่านไปยังไฟล์ที่ include นั้น และปล่อย `openclaw.json` ไว้ตามเดิม root includes, include arrays และ includes ที่มี sibling overrides จะ fail closed แทนที่จะ flatten ดู [Config includes](/th/gateway/configuration) สำหรับรูปแบบที่รองรับ

    หาก config ไม่ถูกต้อง โดยปกติ `plugins install` จะ fail closed และแจ้งให้คุณรัน `openclaw doctor --fix` ก่อน ข้อยกเว้นเดียวที่มีการระบุไว้คือเส้นทางกู้คืนแบบแคบสำหรับ bundled-plugin ซึ่งใช้ได้กับ Plugins ที่เลือกเปิด `openclaw.install.allowInvalidConfigRecovery` อย่างชัดเจนเท่านั้น

  </Accordion>
  <Accordion title="--force และ reinstall เทียบกับ update">
    `--force` จะใช้ target การติดตั้งเดิมซ้ำและเขียนทับ Plugin หรือ hook pack ที่ติดตั้งไว้แล้วในตำแหน่งเดิม ใช้เมื่อตั้งใจติดตั้ง id เดิมซ้ำจาก local path, archive, แพ็กเกจ ClawHub หรือ npm artifact ใหม่ สำหรับการอัปเกรดตามปกติของ npm Plugin ที่ถูกติดตามอยู่แล้ว ให้ใช้ `openclaw plugins update <id-or-npm-spec>`

    หากคุณรัน `plugins install` สำหรับ plugin id ที่ติดตั้งไว้แล้ว OpenClaw จะหยุดและชี้ให้คุณไปใช้ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดปกติ หรือ `plugins install <package> --force` เมื่อคุณต้องการเขียนทับการติดตั้งปัจจุบันจากแหล่งอื่นจริง ๆ

  </Accordion>
  <Accordion title="ขอบเขตของ --pin">
    `--pin` ใช้ได้เฉพาะกับการติดตั้งจาก npm เท่านั้น และไม่รองรับร่วมกับ `--marketplace` เพราะการติดตั้งจาก marketplace จะบันทึก metadata ของแหล่งที่มา marketplace แทน npm spec
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` เป็นตัวเลือก break-glass สำหรับกรณี false positive จาก dangerous-code scanner ที่มีมาในตัว มันอนุญาตให้การติดตั้งดำเนินต่อได้แม้ scanner ในตัวจะรายงานผล `critical` แต่ **ไม่** ข้ามการบล็อกตามนโยบายของ hook `before_install` ของ Plugin และ **ไม่** ข้ามความล้มเหลวของการสแกน

    แฟล็ก CLI นี้ใช้กับขั้นตอน install/update ของ Plugin ส่วนการติดตั้ง dependency ของ Skills ที่ทำผ่าน Gateway จะใช้ request override ชื่อ `dangerouslyForceUnsafeInstall` ที่ตรงกัน ขณะที่ `openclaw skills install` ยังคงเป็นขั้นตอนดาวน์โหลด/ติดตั้ง Skills จาก ClawHub ที่แยกต่างหาก

  </Accordion>
  <Accordion title="Hook packs และ npm specs">
    `plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับ hook packs ที่เปิดเผย `openclaw.hooks` ใน `package.json` ด้วย ให้ใช้ `openclaw hooks` สำหรับการดู hooks แบบกรองและการเปิดใช้งานราย hook ไม่ใช่สำหรับการติดตั้งแพ็กเกจ

    Npm specs เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **เวอร์ชันที่ตรงเป๊ะ** หรือ **dist-tag** แบบเลือกได้) โดยระบบจะปฏิเสธ git/URL/file specs และ semver ranges การติดตั้ง dependencies จะทำในโปรเจ็กต์แบบ local พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้ shell ของคุณจะมีการตั้งค่า npm install แบบ global อยู่ก็ตาม

    Bare specs และ `@latest` จะคงอยู่บน stable track หาก npm resolve อย่างใดอย่างหนึ่งเหล่านี้ไปเป็น prerelease OpenClaw จะหยุดและขอให้คุณเลือกใช้อย่างชัดเจนด้วย prerelease tag เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease แบบตรงเป๊ะ เช่น `@1.2.3-beta.4`

    หาก bare install spec ตรงกับ bundled plugin id (เช่น `diffs`) OpenClaw จะติดตั้ง bundled plugin นั้นโดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่มีชื่อเดียวกัน ให้ใช้ scoped spec แบบชัดเจน (เช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="Archives">
    archives ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` โดย archive ของ OpenClaw plugin แบบเนทีฟต้องมี `openclaw.plugin.json` ที่ถูกต้องที่ราก Plugin หลังแตกไฟล์แล้ว; archives ที่มีเพียง `package.json` จะถูกปฏิเสธก่อนที่ OpenClaw จะบันทึกรายการการติดตั้ง

    รองรับการติดตั้ง Claude marketplace ด้วยเช่นกัน

  </Accordion>
</AccordionGroup>

การติดตั้งจาก ClawHub ใช้ locator แบบชัดเจน `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

ขณะนี้ OpenClaw ยังให้ความสำคัญกับ ClawHub ก่อนสำหรับ bare npm-safe plugin specs ด้วย โดยจะ fallback ไป npm ก็ต่อเมื่อ ClawHub ไม่มีแพ็กเกจหรือเวอร์ชันนั้น:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw จะดาวน์โหลด package archive จาก ClawHub ตรวจสอบความเข้ากันได้ของ plugin API / minimum gateway ที่ประกาศไว้ แล้วติดตั้งผ่านเส้นทาง archive ปกติ รายการติดตั้งที่บันทึกไว้จะคง metadata ของแหล่งที่มา ClawHub ไว้สำหรับการอัปเดตในภายหลัง

#### Marketplace shorthand

ใช้ shorthand แบบ `plugin@marketplace` เมื่อชื่อ marketplace มีอยู่ใน local registry cache ของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

ใช้ `--marketplace` เมื่อคุณต้องการระบุแหล่ง marketplace อย่างชัดเจน:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="แหล่งที่มาของ marketplace">
    - ชื่อ known-marketplace ของ Claude จาก `~/.claude/plugins/known_marketplaces.json`
    - รากของ marketplace ในเครื่องหรือพาธ `marketplace.json`
    - shorthand ของ GitHub repo เช่น `owner/repo`
    - URL ของ GitHub repo เช่น `https://github.com/owner/repo`
    - git URL
  </Tab>
  <Tab title="กฎของ remote marketplace">
    สำหรับ remote marketplaces ที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องอยู่ภายใน repo ของ marketplace ที่ clone มา OpenClaw ยอมรับ source แบบ relative path จาก repo นั้น และจะปฏิเสธแหล่ง Plugin จาก manifest ระยะไกลที่เป็น HTTP(S), absolute-path, git, GitHub และแหล่งอื่นที่ไม่ใช่ path
  </Tab>
</Tabs>

สำหรับ local paths และ archives, OpenClaw จะตรวจจับอัตโนมัติ:

- OpenClaw plugins แบบเนทีฟ (`openclaw.plugin.json`)
- bundles ที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- bundles ที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือเลย์เอาต์ component เริ่มต้นของ Claude)
- bundles ที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

<Note>
bundles ที่เข้ากันได้จะถูกติดตั้งลงในราก Plugin ปกติ และเข้าร่วมในขั้นตอน list/info/enable/disable เดียวกัน ปัจจุบันรองรับ bundle skills, Claude command-skills, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น Claude `.lsp.json` / `lspServers` ที่ประกาศใน manifest, Cursor command-skills และ compatible Codex hook directories ส่วนความสามารถของ bundle อื่น ๆ ที่ตรวจพบจะแสดงใน diagnostics/info แต่ยังไม่ได้เชื่อมเข้ากับการทำงานของรันไทม์
</Note>

### รายการ

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  แสดงเฉพาะ Plugins ที่เปิดใช้งาน
</ParamField>
<ParamField path="--verbose" type="boolean">
  สลับจากมุมมองแบบตารางเป็นบรรทัดรายละเอียดราย Plugin พร้อม source/origin/version/activation metadata
</ParamField>
<ParamField path="--json" type="boolean">
  รายการคลังแบบ machine-readable พร้อม registry diagnostics
</ParamField>

<Note>
`plugins list` จะอ่าน local plugin registry ที่บันทึกไว้ก่อน โดยมี fallback แบบ derived จาก manifest อย่างเดียวเมื่อ registry หายไปหรือไม่ถูกต้อง มันมีประโยชน์สำหรับตรวจสอบว่า Plugin ถูกติดตั้ง เปิดใช้งาน และมองเห็นได้สำหรับการวางแผน cold startup หรือไม่ แต่ไม่ใช่การตรวจสอบรันไทม์จริงของโปรเซส Gateway ที่กำลังทำงานอยู่ หลังจากเปลี่ยนโค้ด Plugin, การเปิดใช้งาน, นโยบาย hook หรือ `plugins.load.paths` ให้รีสตาร์ต Gateway ที่ให้บริการช่องทางนั้นก่อนจึงจะคาดหวังให้โค้ดหรือ hooks ใหม่ใน `register(api)` ทำงานได้ สำหรับการปรับใช้แบบ remote/container ให้ตรวจสอบว่าคุณรีสตาร์ต child ของ `openclaw gateway run` ที่ใช้งานจริง ไม่ใช่เพียง wrapper process
</Note>

สำหรับงาน bundled plugin ภายใน packaged Docker image ให้ bind-mount ไดเรกทอรีซอร์สของ Plugin ทับบนพาธซอร์สของแพ็กเกจที่ตรงกัน เช่น
`/app/extensions/synology-chat` OpenClaw จะค้นพบ source overlay ที่ถูก mount นั้นก่อน `/app/dist/extensions/synology-chat`; ไดเรกทอรีซอร์สที่ถูกคัดลอกธรรมดาจะยังไม่ทำงาน ดังนั้นการติดตั้งแบบแพ็กเกจปกติจะยังใช้ dist ที่คอมไพล์แล้ว

สำหรับการดีบัก runtime hook:

- `openclaw plugins inspect <id> --json` จะแสดง hooks ที่ลงทะเบียนไว้และ diagnostics จากการตรวจสอบแบบโหลดโมดูลแล้ว
- `openclaw gateway status --deep --require-rpc` จะยืนยัน Gateway ที่เข้าถึงได้ พร้อม hints ของ service/process, config path และสถานะ RPC
- hooks การสนทนาที่ไม่ใช่ bundled (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรีในเครื่อง (จะเพิ่มลงใน `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
ไม่รองรับ `--force` ร่วมกับ `--link` เพราะการติดตั้งแบบลิงก์จะใช้พาธซอร์สซ้ำแทนการคัดลอกทับ target การติดตั้งที่ถูกจัดการไว้

ใช้ `--pin` กับการติดตั้งจาก npm เพื่อบันทึก exact spec ที่ resolve แล้ว (`name@version`) ลงในดัชนี Plugin ที่ถูกจัดการ โดยยังคงพฤติกรรมเริ่มต้นแบบไม่ปักหมุดไว้
</Note>

### ดัชนี Plugin

metadata การติดตั้ง Plugin เป็น state ที่ระบบจัดการเอง ไม่ใช่ config ของผู้ใช้ การติดตั้งและการอัปเดตจะเขียนข้อมูลนี้ลงใน `plugins/installs.json` ภายใต้ OpenClaw state directory ที่กำลังใช้งานอยู่ โดย `installRecords` map ระดับบนสุดคือแหล่งข้อมูลถาวรของ metadata การติดตั้ง รวมถึง records สำหรับ Plugin manifests ที่เสียหรือหายไป ส่วนอาร์เรย์ `plugins` คือ cold registry cache ที่ได้มาจาก manifest ไฟล์นี้มีคำเตือนห้ามแก้ไขเอง และถูกใช้โดย `openclaw plugins update`, uninstall, diagnostics และ cold plugin registry

เมื่อ OpenClaw พบ records รุ่นเก่า `plugins.installs` ที่มาพร้อมระบบใน config มันจะย้าย records เหล่านั้นไปยังดัชนี Plugin และลบคีย์ config ออก; หากการเขียนอย่างใดอย่างหนึ่งล้มเหลว records ใน config จะยังคงอยู่เพื่อไม่ให้ metadata การติดตั้งสูญหาย

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` จะลบ records ของ Plugin ออกจาก `plugins.entries`, ดัชนี Plugin ที่บันทึกไว้, รายการใน allow/deny list ของ Plugin และรายการ `plugins.load.paths` ที่ลิงก์อยู่เมื่อเกี่ยวข้อง เว้นแต่จะตั้ง `--keep-files` การถอนการติดตั้งจะลบ managed install directory ที่ถูกติดตามไว้ด้วย เมื่อไดเรกทอรีนั้นอยู่ภายในราก plugin extensions ของ OpenClaw สำหรับ active memory plugins ช่องหน่วยความจำจะถูกรีเซ็ตเป็น `memory-core`

<Note>
รองรับ `--keep-config` ในฐานะชื่ออื่นแบบเลิกใช้แล้วของ `--keep-files`
</Note>

### อัปเดต

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

การอัปเดตจะใช้กับการติดตั้ง Plugin ที่ถูกติดตามในดัชนี Plugin ที่ระบบจัดการ และการติดตั้ง hook-pack ที่ถูกติดตามใน `hooks.internal.installs`

<AccordionGroup>
  <Accordion title="การ resolve plugin id เทียบกับ npm spec">
    เมื่อคุณส่ง plugin id เข้าไป OpenClaw จะนำ install spec ที่บันทึกไว้สำหรับ Plugin นั้นกลับมาใช้ใหม่ ซึ่งหมายความว่า dist-tags ที่บันทึกไว้ก่อนหน้า เช่น `@beta` และเวอร์ชันที่ปักหมุดแบบตรงเป๊ะ จะยังถูกใช้ต่อไปในการรัน `update <id>` ครั้งถัดไป

    สำหรับการติดตั้งจาก npm คุณยังสามารถส่ง npm package spec แบบชัดเจนพร้อม dist-tag หรือเวอร์ชันที่ตรงเป๊ะได้ OpenClaw จะ resolve ชื่อแพ็กเกจนั้นกลับไปยัง record ของ Plugin ที่ติดตามอยู่ อัปเดต Plugin ที่ติดตั้งนั้น และบันทึก npm spec ใหม่ไว้สำหรับการอัปเดตตาม id ในอนาคต

    การส่งชื่อแพ็กเกจ npm โดยไม่มีเวอร์ชันหรือ tag ก็จะ resolve กลับไปยัง record ของ Plugin ที่ติดตามอยู่เช่นกัน ใช้วิธีนี้เมื่อ Plugin ถูกปักหมุดไว้ที่เวอร์ชันแบบตรงเป๊ะ และคุณต้องการย้ายกลับไปใช้สายรีลีสเริ่มต้นของ registry

  </Accordion>
  <Accordion title="การตรวจสอบเวอร์ชันและ integrity drift">
    ก่อนการอัปเดต npm แบบจริง OpenClaw จะตรวจสอบเวอร์ชันแพ็กเกจที่ติดตั้งเทียบกับ metadata ใน npm registry หากเวอร์ชันที่ติดตั้งและตัวตนของ artifact ที่บันทึกไว้ตรงกับเป้าหมายที่ resolve ได้อยู่แล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน `openclaw.json` ใหม่

    เมื่อมีการเก็บ integrity hash ไว้และ hash ของ artifact ที่ดึงมาเปลี่ยนไป OpenClaw จะถือว่านี่เป็น npm artifact drift คำสั่ง `openclaw plugins update` แบบโต้ตอบจะแสดง hash ที่คาดไว้และที่พบจริง แล้วขอการยืนยันก่อนดำเนินการต่อ ส่วนตัวช่วยอัปเดตแบบ non-interactive จะ fail closed เว้นแต่ผู้เรียกจะส่งนโยบายการดำเนินการต่ออย่างชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install บนการอัปเดต">
    `--dangerously-force-unsafe-install` ใช้ได้กับ `plugins update` เช่นกัน ในฐานะตัวเลือก break-glass สำหรับ false positives ของการสแกน dangerous-code ในตัวระหว่างการอัปเดต Plugin แต่ก็ยังไม่ข้ามการบล็อกตามนโยบาย `before_install` ของ Plugin หรือการบล็อกจากความล้มเหลวของการสแกน และใช้ได้เฉพาะกับการอัปเดต Plugin ไม่ใช่การอัปเดต hook-pack
  </Accordion>
</AccordionGroup>

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

การตรวจสอบเชิงลึกสำหรับ Plugin เดียว โดยจะแสดงตัวตน สถานะการโหลด แหล่งที่มา ความสามารถที่ลงทะเบียนไว้ hooks, tools, commands, services, Gateway methods, HTTP routes, policy flags, diagnostics, metadata การติดตั้ง, ความสามารถของ bundle และการรองรับ MCP หรือ LSP server ที่ตรวจพบ

แต่ละ Plugin จะถูกจัดประเภทตามสิ่งที่มันลงทะเบียนจริงในรันไทม์:

- **plain-capability** — มี capability type เดียว (เช่น Plugin ที่เป็น provider อย่างเดียว)
- **hybrid-capability** — มีหลาย capability types (เช่น text + speech + images)
- **hook-only** — มีเฉพาะ hooks ไม่มี capabilities หรือ surfaces
- **non-capability** — มี tools/commands/services แต่ไม่มี capabilities

ดู [Plugin shapes](/th/plugins/architecture#plugin-shapes) สำหรับรายละเอียดเพิ่มเติมเกี่ยวกับโมเดล capability

<Note>
แฟล็ก `--json` จะส่งออกรายงานแบบ machine-readable ที่เหมาะสำหรับสคริปต์และการตรวจสอบ `inspect --all` จะแสดงตารางทั้งชุด พร้อมคอลัมน์ shape, capability kinds, compatibility notices, bundle capabilities และ hook summary ส่วน `info` เป็นชื่ออื่นของ `inspect`
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` จะรายงานข้อผิดพลาดในการโหลด Plugin, diagnostics ของ manifest/discovery และ compatibility notices เมื่อทุกอย่างเรียบร้อย ระบบจะแสดง `No plugin issues detected.`

สำหรับความล้มเหลวเกี่ยวกับรูปร่างของโมดูล เช่น ไม่มี exports `register`/`activate` ให้รันใหม่ด้วย `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อใส่สรุปรูปร่าง export แบบกระชับลงในเอาต์พุต diagnostics

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

local plugin registry คือ persisted cold read model ของ OpenClaw สำหรับตัวตนของ Plugin ที่ติดตั้ง การเปิดใช้งาน metadata ของแหล่งที่มา และความเป็นเจ้าของ contribution การเริ่มต้นตามปกติ การค้นหา provider owner การจัดประเภทการตั้งค่า channel และคลัง Plugin สามารถอ่านจากสิ่งนี้ได้โดยไม่ต้อง import โมดูลรันไทม์ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่า persisted registry มีอยู่ เป็นปัจจุบัน หรือเก่าแล้วหรือไม่ ใช้ `--refresh` เพื่อสร้างใหม่จากดัชนี Plugin ที่บันทึกไว้ นโยบาย config และ metadata ของ manifest/package นี่คือเส้นทางการซ่อมแซม ไม่ใช่เส้นทางเปิดใช้งานรันไทม์

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็น compatibility switch แบบ break-glass ที่เลิกใช้แล้วสำหรับความล้มเหลวในการอ่าน registry ให้เลือกใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix`; fallback ผ่าน env มีไว้สำหรับการกู้คืนการเริ่มต้นระบบแบบฉุกเฉินเท่านั้นในระหว่างที่การย้ายระบบกำลังทยอยใช้งาน
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list รับได้ทั้ง local marketplace path, พาธ `marketplace.json`, shorthand ของ GitHub เช่น `owner/repo`, URL ของ GitHub repo หรือ git URL โดย `--json` จะแสดง source label ที่ resolve แล้ว พร้อม marketplace manifest และรายการ Plugin ที่ parse แล้ว

## ที่เกี่ยวข้อง

- [การสร้าง Plugins](/th/plugins/building-plugins)
- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Community plugins](/th/plugins/community)
