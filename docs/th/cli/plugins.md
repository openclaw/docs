---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือบันเดิลที่เข้ากันได้
    - คุณต้องการดีบักความล้มเหลวในการโหลด Plugin
sidebarTitle: Plugins
summary: คู่มืออ้างอิง CLI สำหรับ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-04T07:03:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36ae7edb12986ead7e126f25e0761bf312b2644b35017181b674082105886776
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Gateway plugins, hook packs และ bundles ที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="ระบบ Plugin" href="/th/tools/plugin">
    คู่มือสำหรับผู้ใช้ปลายทางในการติดตั้ง เปิดใช้งาน และแก้ไขปัญหา plugins
  </Card>
  <Card title="จัดการ plugins" href="/th/plugins/manage-plugins">
    ตัวอย่างรวดเร็วสำหรับการติดตั้ง แสดงรายการ อัปเดต ถอนการติดตั้ง และเผยแพร่
  </Card>
  <Card title="Plugin bundles" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของ Bundle
  </Card>
  <Card title="Plugin manifest" href="/th/plugins/manifest">
    ฟิลด์ Manifest และสคีมา config
  </Card>
  <Card title="ความปลอดภัย" href="/th/gateway/security">
    การเพิ่มความแข็งแกร่งด้านความปลอดภัยสำหรับการติดตั้ง plugin
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

สำหรับการตรวจสอบการติดตั้ง การตรวจสอบ การถอนการติดตั้ง หรือการรีเฟรช registry ที่ช้า ให้รัน
คำสั่งพร้อม `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` trace จะเขียนเวลาของแต่ละเฟส
ไปยัง stderr และยังคงทำให้เอาต์พุต JSON แยกวิเคราะห์ได้ ดู [การดีบัก](/th/help/debugging#plugin-lifecycle-trace)

<Note>
plugins ที่รวมมาด้วยจะจัดส่งพร้อม OpenClaw บางตัวเปิดใช้งานตามค่าเริ่มต้น (เช่น provider โมเดลที่รวมมาด้วย, provider คำพูดที่รวมมาด้วย และ browser plugin ที่รวมมาด้วย); ตัวอื่นต้องใช้ `plugins enable`

plugins แบบเนทีฟของ OpenClaw ต้องจัดส่ง `openclaw.plugin.json` พร้อม JSON Schema แบบอินไลน์ (`configSchema` แม้จะว่างก็ตาม) bundles ที่เข้ากันได้ใช้ manifest ของ bundle ของตัวเองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุต list/info แบบละเอียดจะแสดง subtype ของ bundle ด้วย (`codex`, `claude` หรือ `cursor`) พร้อมความสามารถของ bundle ที่ตรวจพบ
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
ชื่อ package แบบเปล่าจะติดตั้งจาก npm ตามค่าเริ่มต้นระหว่างช่วงเปลี่ยนผ่านการเปิดตัว ใช้ `clawhub:<package>` สำหรับ ClawHub ให้ปฏิบัติกับการติดตั้ง plugin เหมือนการรันโค้ด ควรใช้เวอร์ชันที่ pin ไว้
</Warning>

`plugins search` ค้นหา ClawHub สำหรับ package plugin ที่ติดตั้งได้ และพิมพ์
ชื่อ package ที่พร้อมติดตั้ง โดยค้นหา package แบบ code-plugin และ bundle-plugin
ไม่ใช่ skills ใช้ `openclaw skills search` สำหรับ ClawHub skills

<Note>
ClawHub เป็นพื้นผิวหลักสำหรับการจัดจำหน่ายและการค้นพบของ plugins ส่วนใหญ่ Npm
ยังคงเป็น fallback ที่รองรับและเป็นเส้นทางการติดตั้งโดยตรง package plugin ที่ OpenClaw เป็นเจ้าของ
`@openclaw/*` ถูกเผยแพร่บน npm อีกครั้ง ดูรายการปัจจุบัน
ที่ [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) หรือ
[คลัง plugin](/th/plugins/plugin-inventory) การติดตั้งแบบเสถียรใช้ `latest`
การติดตั้งและอัปเดตในช่อง beta จะเลือกใช้ npm `beta` dist-tag เมื่อ tag นั้น
พร้อมใช้งาน แล้วจึง fallback ไปที่ `latest`
</Note>

<AccordionGroup>
  <Accordion title="Config includes และการซ่อมแซม config ที่ไม่ถูกต้อง">
    หากส่วน `plugins` ของคุณรองรับด้วย `$include` แบบไฟล์เดียว `plugins install/update/enable/disable/uninstall` จะเขียนผ่านไปยังไฟล์ที่ include นั้น และปล่อย `openclaw.json` ไว้ไม่เปลี่ยนแปลง Root includes, include arrays และ includes ที่มี sibling overrides จะ fail closed แทนการ flatten ดู [Config includes](/th/gateway/configuration) สำหรับรูปแบบที่รองรับ

    หาก config ไม่ถูกต้องระหว่างการติดตั้ง โดยปกติ `plugins install` จะ fail closed และบอกให้คุณรัน `openclaw doctor --fix` ก่อน ระหว่างการเริ่มต้น Gateway และ hot reload config plugin ที่ไม่ถูกต้องจะ fail closed เหมือน config ที่ไม่ถูกต้องอื่น ๆ; `openclaw doctor --fix` สามารถ quarantine รายการ plugin ที่ไม่ถูกต้องได้ ข้อยกเว้นที่มีเอกสารระบุไว้สำหรับ install-time มีเพียงเส้นทางกู้คืน bundled-plugin แบบแคบสำหรับ plugins ที่ opt in อย่างชัดเจนไปยัง `openclaw.install.allowInvalidConfigRecovery`

  </Accordion>
  <Accordion title="--force และการติดตั้งใหม่เทียบกับ update">
    `--force` ใช้เป้าหมายการติดตั้งเดิมซ้ำและเขียนทับ plugin หรือ hook pack ที่ติดตั้งแล้วในตำแหน่งเดิม ใช้เมื่อตั้งใจติดตั้ง id เดิมใหม่จาก path ในเครื่อง, archive, package ClawHub หรือ artifact npm ใหม่ สำหรับการอัปเกรดตามปกติของ npm plugin ที่ติดตามอยู่แล้ว ควรใช้ `openclaw plugins update <id-or-npm-spec>`

    หากคุณรัน `plugins install` สำหรับ id ของ plugin ที่ติดตั้งอยู่แล้ว OpenClaw จะหยุดและชี้ให้คุณใช้ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดปกติ หรือใช้ `plugins install <package> --force` เมื่อคุณต้องการเขียนทับการติดตั้งปัจจุบันจากแหล่งอื่นจริง ๆ

  </Accordion>
  <Accordion title="ขอบเขตของ --pin">
    `--pin` ใช้กับการติดตั้ง npm เท่านั้น ไม่รองรับกับการติดตั้ง `git:`; ใช้ git ref ที่ชัดเจน เช่น `git:github.com/acme/plugin@v1.2.3` เมื่อคุณต้องการแหล่งที่ pin ไว้ ไม่รองรับกับ `--marketplace` เพราะการติดตั้ง marketplace จะเก็บ metadata แหล่งที่มาของ marketplace แทน npm spec
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` เป็นตัวเลือก break-glass สำหรับ false positives ในตัวสแกนโค้ดอันตรายที่มีมาให้ ช่วยให้การติดตั้งดำเนินต่อได้แม้ตัวสแกนที่มีมาให้รายงาน findings ระดับ `critical` แต่จะ **ไม่** ข้าม policy blocks ของ hook `before_install` ของ plugin และ **ไม่** ข้าม scan failures

    flag CLI นี้ใช้กับ flow การติดตั้ง/อัปเดต plugin การติดตั้ง dependency ของ skill ที่รองรับโดย Gateway ใช้ request override ที่ตรงกันคือ `dangerouslyForceUnsafeInstall` ขณะที่ `openclaw skills install` ยังคงเป็น flow ดาวน์โหลด/ติดตั้ง ClawHub skill แยกต่างหาก

    หาก plugin ที่คุณเผยแพร่บน ClawHub ถูกบล็อกโดยการสแกน registry ให้ใช้ขั้นตอนของผู้เผยแพร่ใน [ClawHub](/th/tools/clawhub)

  </Accordion>
  <Accordion title="Hook packs และ npm specs">
    `plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับ hook packs ที่เปิดเผย `openclaw.hooks` ใน `package.json` ด้วย ใช้ `openclaw hooks` สำหรับการมองเห็น hook แบบกรองและการเปิดใช้งานราย hook ไม่ใช่การติดตั้ง package

    Npm specs เป็นแบบ **registry-only** (ชื่อ package + **เวอร์ชันแบบ exact** หรือ **dist-tag** ที่เป็นทางเลือก) Git/URL/file specs และช่วง semver จะถูกปฏิเสธ การติดตั้ง dependency รันแบบ project-local พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้ shell ของคุณจะมีการตั้งค่า global npm install ก็ตาม

    ใช้ `npm:<package>` เมื่อคุณต้องการทำให้การ resolve ของ npm ชัดเจน Bare package specs จะติดตั้งโดยตรงจาก npm เช่นกันระหว่างช่วงเปลี่ยนผ่านการเปิดตัว

    Bare specs และ `@latest` จะอยู่บน track เสถียร เวอร์ชัน correction แบบประทับวันที่ของ OpenClaw เช่น `2026.5.3-1` เป็น stable releases สำหรับการตรวจสอบนี้ หาก npm resolve สิ่งใดสิ่งหนึ่งไปเป็น prerelease OpenClaw จะหยุดและขอให้คุณ opt in อย่างชัดเจนด้วย tag prerelease เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease แบบ exact เช่น `@1.2.3-beta.4`

    หาก bare install spec ตรงกับ id ของ plugin อย่างเป็นทางการ (เช่น `diffs`) OpenClaw จะติดตั้งรายการ catalog โดยตรง หากต้องการติดตั้ง npm package ที่มีชื่อเดียวกัน ให้ใช้ scoped spec ที่ชัดเจน (เช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="Git repositories">
    ใช้ `git:<repo>` เพื่อติดตั้งโดยตรงจาก git repository รูปแบบที่รองรับได้แก่ `git:github.com/owner/repo`, `git:owner/repo`, clone URLs แบบเต็ม `https://`, `ssh://`, `git://`, `file://` และ `git@host:owner/repo.git` เพิ่ม `@<ref>` หรือ `#<ref>` เพื่อ checkout branch, tag หรือ commit ก่อนติดตั้ง

    การติดตั้ง Git จะ clone ไปยัง directory ชั่วคราว checkout ref ที่ร้องขอเมื่อมี จากนั้นใช้ตัวติดตั้ง directory plugin ปกติ ซึ่งหมายความว่า manifest validation, การสแกนโค้ดอันตราย, งานติดตั้ง package-manager และบันทึกการติดตั้งจะทำงานเหมือนการติดตั้ง npm การติดตั้ง git ที่บันทึกไว้จะรวม URL/ref แหล่งที่มาและ commit ที่ resolve แล้ว เพื่อให้ `openclaw plugins update` สามารถ re-resolve แหล่งที่มาในภายหลังได้

    หลังติดตั้งจาก git ให้ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อตรวจสอบ runtime registrations เช่น gateway methods และ CLI commands หาก plugin ลงทะเบียน CLI root ด้วย `api.registerCli` ให้ execute คำสั่งนั้นโดยตรงผ่าน root CLI ของ OpenClaw เช่น `openclaw demo-plugin ping`

  </Accordion>
  <Accordion title="Archives">
    archives ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` archives ของ OpenClaw plugin แบบเนทีฟต้องมี `openclaw.plugin.json` ที่ถูกต้องที่ root ของ plugin หลังแตกไฟล์; archives ที่มีเฉพาะ `package.json` จะถูกปฏิเสธก่อนที่ OpenClaw จะเขียนบันทึกการติดตั้ง

    รองรับการติดตั้ง Claude marketplace ด้วย

  </Accordion>
</AccordionGroup>

การติดตั้ง ClawHub ใช้ locator `clawhub:<package>` ที่ชัดเจน:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Bare npm-safe plugin specs จะติดตั้งจาก npm ตามค่าเริ่มต้นระหว่างช่วงเปลี่ยนผ่านการเปิดตัว:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อทำให้การ resolve แบบ npm-only ชัดเจน:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw ตรวจสอบ plugin API ที่ประกาศไว้ / ความเข้ากันได้ขั้นต่ำของ gateway ก่อนติดตั้ง เมื่อเวอร์ชัน ClawHub ที่เลือกเผยแพร่ ClawPack artifact OpenClaw จะดาวน์โหลด `.tgz` แบบ npm-pack ที่มีเวอร์ชัน ตรวจสอบ ClawHub digest header และ artifact digest จากนั้นติดตั้งผ่าน path archive ปกติ เวอร์ชัน ClawHub เก่าที่ไม่มี metadata ของ ClawPack ยังคงติดตั้งผ่าน path การตรวจสอบ package archive แบบ legacy การติดตั้งที่บันทึกไว้จะเก็บ metadata แหล่งที่มา ClawHub, ชนิด artifact, npm integrity, npm shasum, ชื่อ tarball และข้อเท็จจริง digest ของ ClawPack ไว้สำหรับการอัปเดตในภายหลัง
การติดตั้ง ClawHub แบบไม่มีเวอร์ชันจะเก็บ recorded spec แบบไม่มีเวอร์ชัน เพื่อให้ `openclaw plugins update` สามารถติดตาม releases ใหม่กว่าของ ClawHub ได้; selectors แบบระบุเวอร์ชันหรือ tag อย่างชัดเจน เช่น `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` จะยังคง pin อยู่กับ selector นั้น

#### รูปย่อของ Marketplace

ใช้รูปย่อ `plugin@marketplace` เมื่อชื่อ marketplace มีอยู่ใน local registry cache ของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

ใช้ `--marketplace` เมื่อคุณต้องการส่ง marketplace source อย่างชัดเจน:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="แหล่งที่มาของ Marketplace">
    - ชื่อ marketplace ที่ Claude รู้จักจาก `~/.claude/plugins/known_marketplaces.json`
    - ราก marketplace ในเครื่องหรือพาธ `marketplace.json`
    - ชวเลข repo ของ GitHub เช่น `owner/repo`
    - URL repo ของ GitHub เช่น `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="กฎของ marketplace ระยะไกล">
    สำหรับ marketplace ระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องอยู่ภายใน repo marketplace ที่โคลนมา OpenClaw ยอมรับแหล่งที่มาแบบพาธสัมพัทธ์จาก repo นั้น และปฏิเสธแหล่งที่มา Plugin แบบ HTTP(S), พาธสัมบูรณ์, git, GitHub และแหล่งที่มา Plugin อื่นที่ไม่ใช่พาธจาก manifest ระยะไกล
  </Tab>
</Tabs>

สำหรับพาธในเครื่องและไฟล์ archive OpenClaw ตรวจจับอัตโนมัติ:

- Plugin แบบเนทีฟของ OpenClaw (`openclaw.plugin.json`)
- บันเดิลที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- บันเดิลที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือเลย์เอาต์คอมโพเนนต์ Claude เริ่มต้น)
- บันเดิลที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

<Note>
บันเดิลที่เข้ากันได้จะติดตั้งลงในราก Plugin ปกติ และเข้าร่วมในโฟลว์ list/info/enable/disable เดียวกัน ปัจจุบันรองรับ Skills ของบันเดิล, command-skills ของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` ของ Claude / `lspServers` ที่ประกาศใน manifest, command-skills ของ Cursor และไดเรกทอรี hook ของ Codex ที่เข้ากันได้ ส่วนความสามารถอื่นของบันเดิลที่ตรวจพบจะแสดงใน diagnostics/info แต่ยังไม่ได้เชื่อมเข้ากับการทำงานขณะรันไทม์
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
  เปลี่ยนจากมุมมองตารางเป็นบรรทัดรายละเอียดต่อ Plugin พร้อม metadata ของ source/origin/version/activation
</ParamField>
<ParamField path="--json" type="boolean">
  inventory ที่เครื่องอ่านได้ พร้อม diagnostics ของ registry และสถานะการติดตั้ง dependency ของ package
</ParamField>

<Note>
`plugins list` อ่าน registry ของ Plugin ในเครื่องที่ persisted ไว้ก่อน โดยมี fallback ที่ derive จาก manifest เท่านั้นเมื่อ registry หายไปหรือไม่ถูกต้อง คำสั่งนี้มีประโยชน์สำหรับตรวจว่า Plugin ติดตั้งแล้ว เปิดใช้งานอยู่ และมองเห็นได้ในการวางแผน startup แบบ cold หรือไม่ แต่ไม่ใช่ probe รันไทม์สดของโปรเซส Gateway ที่กำลังรันอยู่ หลังเปลี่ยนโค้ด Plugin, enablement, นโยบาย hook หรือ `plugins.load.paths` ให้รีสตาร์ท Gateway ที่ให้บริการ channel ก่อนคาดหวังให้โค้ด `register(api)` หรือ hook ใหม่ทำงาน สำหรับ deployment ระยะไกล/คอนเทนเนอร์ ให้ตรวจสอบว่าคุณกำลังรีสตาร์ท child ของ `openclaw gateway run` ตัวจริง ไม่ใช่แค่โปรเซส wrapper

`plugins list --json` รวม `dependencyStatus` ของแต่ละ Plugin จาก `package.json`
`dependencies` และ `optionalDependencies` OpenClaw ตรวจสอบว่าชื่อ package เหล่านั้นอยู่ตามพาธค้นหา `node_modules` ปกติของ Node สำหรับ Plugin นั้นหรือไม่ โดยไม่ import โค้ดรันไทม์ของ Plugin, ไม่รัน package manager และไม่ซ่อม dependency ที่หายไป
</Note>

`plugins search` คือการค้นหาแค็ตตาล็อก ClawHub ระยะไกล คำสั่งนี้ไม่ตรวจสอบสถานะในเครื่อง ไม่แก้ config ไม่ติดตั้ง package และไม่โหลดโค้ดรันไทม์ของ Plugin ผลการค้นหารวมชื่อ package ของ ClawHub, family, channel, version, summary และคำใบ้การติดตั้ง เช่น `openclaw plugins install clawhub:<package>`

สำหรับงาน Plugin ที่บันเดิลอยู่ภายในอิมเมจ Docker แบบแพ็กเกจ ให้ bind-mount ไดเรกทอรีต้นทางของ Plugin ทับพาธต้นทางแบบแพ็กเกจที่ตรงกัน เช่น `/app/extensions/synology-chat` OpenClaw จะค้นพบ overlay ต้นทางที่ mount นั้นก่อน `/app/dist/extensions/synology-chat`; ไดเรกทอรีต้นทางที่คัดลอกธรรมดาจะไม่ทำงาน ดังนั้นการติดตั้งแบบแพ็กเกจปกติยังคงใช้ dist ที่คอมไพล์แล้ว

สำหรับการ debug hook ขณะรันไทม์:

- `openclaw plugins inspect <id> --runtime --json` แสดง hook ที่ลงทะเบียนแล้วและ diagnostics จากรอบ inspection ที่โหลด module แล้ว Runtime inspection ไม่เคยติดตั้ง dependency; ใช้ `openclaw doctor --fix` เพื่อล้างสถานะ dependency แบบ legacy หรือติดตั้ง Plugin ที่ดาวน์โหลดได้ซึ่งกำหนดค่าไว้แต่หายไป
- `openclaw gateway status --deep --require-rpc` ยืนยัน Gateway ที่เข้าถึงได้, คำใบ้ service/process, พาธ config และสุขภาพ RPC
- hook การสนทนาที่ไม่ใช่แบบบันเดิล (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรีในเครื่อง (เพิ่มเข้า `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
ไม่รองรับ `--force` ร่วมกับ `--link` เพราะการติดตั้งแบบ linked ใช้พาธต้นทางซ้ำแทนการคัดลอกทับเป้าหมายการติดตั้งที่จัดการโดยระบบ

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึก spec แบบ exact ที่ resolve แล้ว (`name@version`) ในดัชนี Plugin ที่จัดการโดยระบบ ขณะที่พฤติกรรมเริ่มต้นยังคงไม่ pin
</Note>

### ดัชนี Plugin

metadata การติดตั้ง Plugin เป็นสถานะที่เครื่องจัดการ ไม่ใช่ config ของผู้ใช้ การติดตั้งและอัปเดตจะเขียนไปยัง `plugins/installs.json` ภายใต้ไดเรกทอรีสถานะ OpenClaw ที่ใช้งานอยู่ map ระดับบนสุด `installRecords` คือแหล่งข้อมูลถาวรของ metadata การติดตั้ง รวมถึง record สำหรับ manifest ของ Plugin ที่เสียหรือหายไป array `plugins` คือแคช registry แบบ cold ที่ derive จาก manifest ไฟล์นี้มีคำเตือนห้ามแก้ไข และถูกใช้โดย `openclaw plugins update`, uninstall, diagnostics และ registry ของ Plugin แบบ cold

เมื่อ OpenClaw พบ record `plugins.installs` แบบ legacy ที่เคยจัดส่งใน config จะย้าย record เหล่านั้นเข้าไปในดัชนี Plugin และลบ config key ออก หากการเขียนครั้งใดครั้งหนึ่งล้มเหลว record ใน config จะถูกเก็บไว้เพื่อไม่ให้ metadata การติดตั้งสูญหาย

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` ลบ record ของ Plugin ออกจาก `plugins.entries`, ดัชนี Plugin ที่ persisted ไว้, รายการ allow/deny ของ Plugin และรายการ linked `plugins.load.paths` เมื่อเกี่ยวข้อง เว้นแต่ตั้งค่า `--keep-files` ไว้ uninstall ยังลบไดเรกทอรีการติดตั้งที่จัดการโดยระบบซึ่งติดตามไว้ เมื่อไดเรกทอรีนั้นอยู่ภายในราก extensions ของ Plugin ของ OpenClaw สำหรับ Plugin หน่วยความจำ active memory slot จะรีเซ็ตเป็น `memory-core`

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

การอัปเดตมีผลกับการติดตั้ง Plugin ที่ติดตามไว้ในดัชนี Plugin ที่จัดการโดยระบบ และการติดตั้ง hook-pack ที่ติดตามไว้ใน `hooks.internal.installs`

<AccordionGroup>
  <Accordion title="การ resolve id ของ Plugin เทียบกับ spec ของ npm">
    เมื่อคุณส่ง id ของ Plugin OpenClaw จะใช้ spec การติดตั้งที่บันทึกไว้สำหรับ Plugin นั้นซ้ำ นั่นหมายความว่า dist-tag ที่เคยจัดเก็บไว้ เช่น `@beta` และเวอร์ชัน exact ที่ pin ไว้จะยังคงถูกใช้ในการรัน `update <id>` ภายหลัง

    สำหรับการติดตั้ง npm คุณยังสามารถส่ง spec ของ package npm แบบ explicit พร้อม dist-tag หรือเวอร์ชัน exact ได้ OpenClaw จะ resolve ชื่อ package นั้นกลับไปยัง record ของ Plugin ที่ติดตามไว้ อัปเดต Plugin ที่ติดตั้งนั้น และบันทึก spec npm ใหม่สำหรับการอัปเดตตาม id ในอนาคต

    การส่งชื่อ package npm โดยไม่มีเวอร์ชันหรือ tag ก็ resolve กลับไปยัง record ของ Plugin ที่ติดตามไว้เช่นกัน ใช้วิธีนี้เมื่อ Plugin ถูก pin ไว้กับเวอร์ชัน exact และคุณต้องการย้ายกลับไปยัง release line เริ่มต้นของ registry

  </Accordion>
  <Accordion title="การอัปเดต channel beta">
    `openclaw plugins update` ใช้ spec ของ Plugin ที่ติดตามไว้ซ้ำ เว้นแต่คุณจะส่ง spec ใหม่ `openclaw update` ยังรู้จัก channel การอัปเดต OpenClaw ที่ใช้งานอยู่เพิ่มเติม: บน channel beta, record ของ Plugin จาก npm และ ClawHub ใน default-line จะลอง `@beta` ก่อน แล้ว fallback ไปยัง spec default/latest ที่บันทึกไว้หากไม่มี release beta ของ Plugin เวอร์ชัน exact และ tag explicit จะยังคง pin อยู่กับ selector นั้น

  </Accordion>
  <Accordion title="การตรวจสอบเวอร์ชันและ integrity drift">
    ก่อนการอัปเดต npm แบบสด OpenClaw ตรวจสอบเวอร์ชัน package ที่ติดตั้งกับ metadata ของ npm registry หากเวอร์ชันที่ติดตั้งและ identity ของ artifact ที่บันทึกไว้ตรงกับ target ที่ resolve แล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด ติดตั้งซ้ำ หรือเขียน `openclaw.json` ใหม่

    เมื่อมี integrity hash ที่จัดเก็บไว้และ hash ของ artifact ที่ fetch มาเปลี่ยนไป OpenClaw จะถือว่านั่นคือ npm artifact drift คำสั่ง interactive `openclaw plugins update` จะพิมพ์ hash ที่คาดหวังและ hash จริง แล้วขอการยืนยันก่อนดำเนินการต่อ helper อัปเดตแบบ non-interactive จะ fail closed เว้นแต่ caller จะระบุนโยบาย continuation แบบ explicit

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install บน update">
    `--dangerously-force-unsafe-install` ยังใช้ได้บน `plugins update` เป็น override แบบ break-glass สำหรับ false positive จากการสแกน dangerous-code ในตัวระหว่างอัปเดต Plugin แต่ยังไม่ข้ามการบล็อกตามนโยบาย `before_install` ของ Plugin หรือการบล็อกเมื่อสแกนล้มเหลว และมีผลกับการอัปเดต Plugin เท่านั้น ไม่ใช่การอัปเดต hook-pack
  </Accordion>
</AccordionGroup>

### ตรวจสอบรายละเอียด

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect แสดง identity, สถานะการโหลด, source, ความสามารถจาก manifest, policy flags, diagnostics, metadata การติดตั้ง, ความสามารถของบันเดิล และการรองรับ server MCP หรือ LSP ใด ๆ ที่ตรวจพบ โดยค่าเริ่มต้นจะไม่ import รันไทม์ของ Plugin เพิ่ม `--runtime` เพื่อโหลด module ของ Plugin และรวม hook, tools, commands, services, gateway methods และ HTTP routes ที่ลงทะเบียนไว้ Runtime inspection รายงาน dependency ของ Plugin ที่หายไปโดยตรง; การติดตั้งและการซ่อมยังคงอยู่ใน `openclaw plugins install`, `openclaw plugins update` และ `openclaw doctor --fix`

คำสั่ง CLI ที่ Plugin เป็นเจ้าของจะติดตั้งเป็นกลุ่มคำสั่ง root `openclaw` หลังจาก `inspect --runtime` แสดงคำสั่งใต้ `cliCommands` ให้รันเป็น `openclaw <command> ...`; ตัวอย่างเช่น Plugin ที่ลงทะเบียน `demo-git` สามารถตรวจสอบได้ด้วย `openclaw demo-git ping`

แต่ละ Plugin ถูกจัดประเภทตามสิ่งที่ลงทะเบียนจริงขณะรันไทม์:

- **plain-capability** — ความสามารถหนึ่งประเภท (เช่น Plugin เฉพาะ provider)
- **hybrid-capability** — ความสามารถหลายประเภท (เช่น text + speech + images)
- **hook-only** — เฉพาะ hook ไม่มีความสามารถหรือ surface
- **non-capability** — tools/commands/services แต่ไม่มีความสามารถ

ดู [รูปแบบ Plugin](/th/plugins/architecture#plugin-shapes) สำหรับข้อมูลเพิ่มเติมเกี่ยวกับโมเดลความสามารถ

<Note>
flag `--json` ส่งออกรายงานที่เครื่องอ่านได้ เหมาะสำหรับ scripting และ auditing `inspect --all` แสดงตารางครอบคลุมทั้ง fleet พร้อมคอลัมน์ shape, capability kinds, compatibility notices, bundle capabilities และ hook summary `info` เป็น alias ของ `inspect`
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` รายงานข้อผิดพลาดการโหลด Plugin, diagnostics ของ manifest/discovery และ compatibility notices เมื่อทุกอย่างสะอาดจะแสดง `No plugin issues detected.`

หาก Plugin ที่กำหนดค่าไว้มีอยู่บนดิสก์แต่ถูกบล็อกโดยการตรวจสอบ path-safety ของ loader การ validate config จะเก็บรายการ Plugin ไว้และรายงานเป็น `present but blocked` ให้แก้ diagnostic ของ Plugin ที่ถูกบล็อกก่อนหน้า เช่น ownership ของพาธหรือ permission แบบ world-writable แทนที่จะลบ config `plugins.entries.<id>` หรือ `plugins.allow`

สำหรับความล้มเหลวของ module-shape เช่น export `register`/`activate` หายไป ให้รันซ้ำด้วย `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุป export-shape แบบกระชับใน output diagnostics

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

registry ของ Plugin ในเครื่องคือโมเดลอ่านแบบ cold ที่ persisted ไว้ของ OpenClaw สำหรับ identity ของ Plugin ที่ติดตั้ง, enablement, metadata ของ source และ ownership ของ contribution การ startup ปกติ, การ lookup เจ้าของ provider, การจัดประเภท setup ของ channel และ inventory ของ Plugin สามารถอ่านได้โดยไม่ต้อง import module รันไทม์ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่า registry ที่บันทึกไว้มีอยู่ เป็นปัจจุบัน หรือล้าสมัย ใช้ `--refresh` เพื่อสร้างใหม่จากดัชนี Plugin ที่บันทึกไว้ นโยบาย config และเมทาดาทา manifest/package นี่เป็นเส้นทางสำหรับการซ่อมแซม ไม่ใช่เส้นทางสำหรับการเปิดใช้งานขณะรันไทม์

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็นสวิตช์ความเข้ากันได้แบบ break-glass ที่เลิกใช้แล้วสำหรับความล้มเหลวในการอ่าน registry ควรใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix`; fallback ผ่าน env มีไว้สำหรับการกู้คืนการเริ่มต้นในกรณีฉุกเฉินเท่านั้นระหว่างที่การย้ายระบบกำลังทยอยใช้งาน
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

รายการ Marketplace รองรับพาธ Marketplace ในเครื่อง, พาธ `marketplace.json`, รูปย่อ GitHub เช่น `owner/repo`, URL repo ของ GitHub หรือ URL git `--json` จะแสดงป้ายกำกับแหล่งที่มาที่ resolve แล้ว พร้อม manifest ของ Marketplace ที่แยกวิเคราะห์แล้วและรายการ Plugin

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Plugin จากชุมชน](/th/plugins/community)
