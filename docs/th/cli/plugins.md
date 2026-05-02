---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือบันเดิลที่เข้ากันได้
    - คุณต้องการดีบักปัญหาการโหลด Plugin ล้มเหลว
sidebarTitle: Plugins
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-02T22:17:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b077ab0739e2453ccba434aa3b02b1d441bab792b7b131216221a8048d551cd
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Plugin ของ Gateway, แพ็ก hook และบันเดิลที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="ระบบ Plugin" href="/th/tools/plugin">
    คู่มือผู้ใช้ปลายทางสำหรับติดตั้ง เปิดใช้งาน และแก้ไขปัญหา Plugin
  </Card>
  <Card title="จัดการ Plugin" href="/th/plugins/manage-plugins">
    ตัวอย่างแบบรวดเร็วสำหรับการติดตั้ง แสดงรายการ อัปเดต ถอนการติดตั้ง และเผยแพร่
  </Card>
  <Card title="บันเดิล Plugin" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของบันเดิล
  </Card>
  <Card title="แมนิเฟสต์ Plugin" href="/th/plugins/manifest">
    ฟิลด์แมนิเฟสต์และสคีมาการกำหนดค่า
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

สำหรับการตรวจสอบการติดตั้ง การตรวจดู การถอนการติดตั้ง หรือการรีเฟรชรีจิสทรีที่ช้า ให้รัน
คำสั่งพร้อม `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` trace จะเขียนเวลาในแต่ละเฟส
ไปยัง stderr และยังคงทำให้เอาต์พุต JSON parse ได้ ดู [การดีบัก](/th/help/debugging#plugin-lifecycle-trace)

<Note>
Plugin ที่บันเดิลมาพร้อมกับ OpenClaw จะจัดส่งมากับ OpenClaw บางรายการเปิดใช้งานตามค่าเริ่มต้น (เช่น provider โมเดลที่บันเดิลมา, provider เสียงพูดที่บันเดิลมา และ Plugin เบราว์เซอร์ที่บันเดิลมา); รายการอื่นต้องใช้ `plugins enable`

Plugin แบบ native ของ OpenClaw ต้องจัดส่ง `openclaw.plugin.json` พร้อม JSON Schema แบบ inline (`configSchema` แม้จะว่างก็ตาม) บันเดิลที่เข้ากันได้จะใช้แมนิเฟสต์บันเดิลของตัวเองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุตรายการ/info แบบ verbose จะแสดงชนิดย่อยของบันเดิลด้วย (`codex`, `claude` หรือ `cursor`) พร้อมความสามารถของบันเดิลที่ตรวจพบ
</Note>

### ติดตั้ง

```bash
openclaw plugins search "calendar"                   # ค้นหา Plugin ใน ClawHub
openclaw plugins install <package>                      # ใช้ npm ตามค่าเริ่มต้น
openclaw plugins install clawhub:<package>              # ClawHub เท่านั้น
openclaw plugins install npm:<package>                  # npm เท่านั้น
openclaw plugins install git:github.com/<owner>/<repo>  # รีโป git
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # เขียนทับการติดตั้งที่มีอยู่
openclaw plugins install <package> --pin                # ปักหมุดเวอร์ชัน
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # พาธ local
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (ระบุชัดเจน)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
ชื่อแพ็กเกจแบบเปล่าจะติดตั้งจาก npm ตามค่าเริ่มต้นในช่วงเปลี่ยนผ่านการเปิดตัว ใช้ `clawhub:<package>` สำหรับ ClawHub มองการติดตั้ง Plugin เหมือนการรันโค้ด ควรใช้เวอร์ชันที่ปักหมุดไว้
</Warning>

`plugins search` คิวรี ClawHub เพื่อหาแพ็กเกจ Plugin ที่ติดตั้งได้ และพิมพ์
ชื่อแพ็กเกจที่พร้อมติดตั้ง ค้นหาแพ็กเกจ code-plugin และ bundle-plugin
ไม่ใช่ skills ใช้ `openclaw skills search` สำหรับ Skills ของ ClawHub

<Note>
ClawHub เป็นพื้นผิวหลักสำหรับการแจกจ่ายและการค้นพบ Plugin ส่วนใหญ่ npm
ยังคงเป็นทางเลือกสำรองและพาธติดตั้งโดยตรงที่รองรับ แพ็กเกจ Plugin
`@openclaw/*` ที่ OpenClaw เป็นเจ้าของถูกเผยแพร่บน npm อีกครั้ง ดูรายการปัจจุบัน
ที่ [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) หรือ
[คลังรายการ Plugin](/th/plugins/plugin-inventory) การติดตั้งแบบเสถียรใช้ `latest`
การติดตั้งและอัปเดตในช่อง beta จะใช้ dist-tag `beta` ของ npm เป็นหลักเมื่อมีแท็กนั้น
จากนั้นจึง fallback ไปที่ `latest`
</Note>

<AccordionGroup>
  <Accordion title="Config includes และการกู้คืน invalid-config">
    หากส่วน `plugins` ของคุณอิงกับ `$include` แบบไฟล์เดียว `plugins install/update/enable/disable/uninstall` จะเขียนผ่านไปยังไฟล์ที่ include นั้นและปล่อย `openclaw.json` ไว้โดยไม่แตะต้อง Root includes, include arrays และ includes ที่มี sibling overrides จะ fail closed แทนการ flatten ดู [Config includes](/th/gateway/configuration) สำหรับรูปแบบที่รองรับ

    หาก config ไม่ถูกต้องระหว่างการติดตั้ง โดยปกติ `plugins install` จะ fail closed และแจ้งให้คุณรัน `openclaw doctor --fix` ก่อน ระหว่างการเริ่มต้น Gateway, config ที่ไม่ถูกต้องของ Plugin หนึ่งจะถูกแยกไว้เฉพาะ Plugin นั้น เพื่อให้ช่องทางและ Plugin อื่นยังทำงานต่อได้; `openclaw doctor --fix` สามารถกักกันรายการ Plugin ที่ไม่ถูกต้องได้ ข้อยกเว้นเวลา install ที่บันทึกไว้มีเพียงพาธกู้คืนแบบแคบสำหรับ bundled-plugin ที่ Plugin ต้อง opt in ชัดเจนด้วย `openclaw.install.allowInvalidConfigRecovery`

  </Accordion>
  <Accordion title="--force และการติดตั้งใหม่เทียบกับการอัปเดต">
    `--force` ใช้เป้าหมายการติดตั้งเดิมซ้ำและเขียนทับ Plugin หรือ hook pack ที่ติดตั้งไว้แล้วในตำแหน่งเดิม ใช้เมื่อตั้งใจติดตั้ง id เดิมซ้ำจากพาธ local ใหม่, archive, แพ็กเกจ ClawHub หรือ artifact ของ npm สำหรับการอัปเกรดตามปกติของ Plugin npm ที่ติดตามอยู่แล้ว ควรใช้ `openclaw plugins update <id-or-npm-spec>`

    หากคุณรัน `plugins install` สำหรับ id ของ Plugin ที่ติดตั้งอยู่แล้ว OpenClaw จะหยุดและชี้ให้คุณใช้ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดปกติ หรือใช้ `plugins install <package> --force` เมื่อคุณต้องการเขียนทับการติดตั้งปัจจุบันจากแหล่งอื่นจริง ๆ

  </Accordion>
  <Accordion title="ขอบเขตของ --pin">
    `--pin` ใช้กับการติดตั้ง npm เท่านั้น ไม่รองรับกับการติดตั้ง `git:`; ใช้ git ref ที่ระบุชัดเจน เช่น `git:github.com/acme/plugin@v1.2.3` เมื่อต้องการ source ที่ปักหมุดไว้ ไม่รองรับกับ `--marketplace` เพราะการติดตั้งผ่าน marketplace จะเก็บ metadata แหล่งที่มาของ marketplace แทน npm spec
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` เป็นตัวเลือกฉุกเฉินสำหรับผลบวกเท็จในตัวสแกน dangerous-code ในตัว ช่วยให้การติดตั้งดำเนินต่อได้แม้ตัวสแกนในตัวจะรายงาน findings ระดับ `critical` แต่จะ **ไม่** ข้ามบล็อกนโยบาย hook `before_install` ของ Plugin และ **ไม่** ข้ามความล้มเหลวของการสแกน

    แฟล็ก CLI นี้ใช้กับ flow การติดตั้ง/อัปเดต Plugin การติดตั้ง dependency ของ Skill ที่รองรับโดย Gateway ใช้ request override ที่ตรงกันคือ `dangerouslyForceUnsafeInstall` ขณะที่ `openclaw skills install` ยังคงเป็น flow ดาวน์โหลด/ติดตั้ง Skill ของ ClawHub แยกต่างหาก

    หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกบล็อกโดยการสแกนของรีจิสทรี ให้ใช้ขั้นตอนสำหรับผู้เผยแพร่ใน [ClawHub](/th/tools/clawhub)

  </Accordion>
  <Accordion title="Hook packs และ npm specs">
    `plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับ hook packs ที่เปิดเผย `openclaw.hooks` ใน `package.json` ด้วย ใช้ `openclaw hooks` สำหรับการมองเห็น hook แบบกรองและการเปิดใช้งานราย hook ไม่ใช่การติดตั้งแพ็กเกจ

    npm specs เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **exact version** หรือ **dist-tag** ที่เป็นทางเลือก) Git/URL/file specs และช่วง semver จะถูกปฏิเสธ การติดตั้ง dependency รันแบบ project-local พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้ว่า shell ของคุณจะมีการตั้งค่าการติดตั้ง npm แบบ global ก็ตาม

    ใช้ `npm:<package>` เมื่อต้องการทำให้การ resolve ผ่าน npm ชัดเจน Bare package specs จะติดตั้งโดยตรงจาก npm เช่นกันในช่วงเปลี่ยนผ่านการเปิดตัว

    Bare specs และ `@latest` จะอยู่บนแทร็ก stable หาก npm resolve รายการใดรายการหนึ่งไปเป็น prerelease OpenClaw จะหยุดและขอให้คุณ opt in อย่างชัดเจนด้วยแท็ก prerelease เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease แบบ exact เช่น `@1.2.3-beta.4`

    หาก bare install spec ตรงกับ id ของ Plugin ทางการ (เช่น `diffs`) OpenClaw จะติดตั้งรายการ catalog โดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่มีชื่อเดียวกัน ให้ใช้ scoped spec ที่ระบุชัดเจน (เช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="รีโพซิทอรี Git">
    ใช้ `git:<repo>` เพื่อติดตั้งโดยตรงจากรีโพซิทอรี git รูปแบบที่รองรับรวมถึง `git:github.com/owner/repo`, `git:owner/repo`, URL clone แบบเต็ม `https://`, `ssh://`, `git://`, `file://` และ `git@host:owner/repo.git` เพิ่ม `@<ref>` หรือ `#<ref>` เพื่อ check out branch, tag หรือ commit ก่อนติดตั้ง

    การติดตั้ง Git จะ clone ไปยังไดเรกทอรีชั่วคราว, check out ref ที่ร้องขอเมื่อมีอยู่ แล้วใช้ตัวติดตั้งไดเรกทอรี Plugin ตามปกติ ซึ่งหมายความว่า manifest validation, dangerous-code scanning, งานติดตั้งของ package-manager และ install records จะทำงานเหมือนการติดตั้ง npm การติดตั้ง git ที่บันทึกไว้รวม URL/ref ของ source พร้อม commit ที่ resolve แล้ว เพื่อให้ `openclaw plugins update` สามารถ re-resolve source นั้นได้ในภายหลัง

    หลังติดตั้งจาก git ให้ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อตรวจสอบ runtime registrations เช่น gateway methods และ CLI commands หาก Plugin ลงทะเบียน CLI root ด้วย `api.registerCli` ให้ execute คำสั่งนั้นโดยตรงผ่าน OpenClaw root CLI เช่น `openclaw demo-plugin ping`

  </Accordion>
  <Accordion title="Archives">
    Archives ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` archive ของ Plugin แบบ native ของ OpenClaw ต้องมี `openclaw.plugin.json` ที่ถูกต้องที่ root ของ Plugin หลังแตกไฟล์; archive ที่มีเพียง `package.json` จะถูกปฏิเสธก่อนที่ OpenClaw จะเขียน install records

    รองรับการติดตั้ง Claude marketplace ด้วย

  </Accordion>
</AccordionGroup>

การติดตั้ง ClawHub ใช้ locator `clawhub:<package>` ที่ระบุชัดเจน:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Bare npm-safe plugin specs จะติดตั้งจาก npm ตามค่าเริ่มต้นในช่วงเปลี่ยนผ่านการเปิดตัว:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อทำให้การ resolve แบบ npm-only ชัดเจน:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw ตรวจสอบ plugin API ที่ประกาศไว้ / ความเข้ากันได้ขั้นต่ำของ gateway ก่อนติดตั้ง เมื่อเวอร์ชัน ClawHub ที่เลือกเผยแพร่ artifact ClawPack OpenClaw จะดาวน์โหลด npm-pack `.tgz` ที่มีเวอร์ชัน ตรวจสอบ ClawHub digest header และ artifact digest แล้วติดตั้งผ่านพาธ archive ตามปกติ ClawHub เวอร์ชันเก่าที่ไม่มี metadata ของ ClawPack ยังคงติดตั้งผ่านพาธตรวจสอบ package archive แบบ legacy install records ที่บันทึกไว้จะเก็บ metadata แหล่งที่มาของ ClawHub, ชนิด artifact, npm integrity, npm shasum, ชื่อ tarball และข้อเท็จจริงของ ClawPack digest สำหรับการอัปเดตภายหลัง
การติดตั้ง ClawHub แบบไม่ระบุเวอร์ชันจะเก็บ recorded spec แบบไม่ระบุเวอร์ชัน เพื่อให้ `openclaw plugins update` สามารถตาม release ใหม่ของ ClawHub ได้; ตัวเลือกเวอร์ชันหรือแท็กที่ระบุชัดเจน เช่น `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` จะยังคงปักหมุดกับตัวเลือกนั้น

#### ชวเลข Marketplace

ใช้ชวเลข `plugin@marketplace` เมื่อชื่อ marketplace มีอยู่ใน cache รีจิสทรี local ของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

ใช้ `--marketplace` เมื่อต้องการส่งแหล่ง marketplace อย่างชัดเจน:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="แหล่งที่มาของ Marketplace">
    - ชื่อ known-marketplace ของ Claude จาก `~/.claude/plugins/known_marketplaces.json`
    - รูท marketplace ในเครื่องหรือพาธ `marketplace.json`
    - ชื่อย่อ repo ของ GitHub เช่น `owner/repo`
    - URL ของ repo GitHub เช่น `https://github.com/owner/repo`
    - URL ของ git

  </Tab>
  <Tab title="กฎของ marketplace ระยะไกล">
    สำหรับ marketplace ระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องอยู่ภายใน repo marketplace ที่โคลนมา OpenClaw ยอมรับแหล่งที่มาแบบพาธสัมพัทธ์จาก repo นั้น และปฏิเสธแหล่งที่มาของ Plugin จาก manifest ระยะไกลที่เป็น HTTP(S), พาธสัมบูรณ์, git, GitHub และแหล่งที่มาอื่นที่ไม่ใช่พาธ
  </Tab>
</Tabs>

สำหรับพาธในเครื่องและไฟล์เก็บถาวร OpenClaw ตรวจจับอัตโนมัติ:

- Plugin ของ OpenClaw แบบ native (`openclaw.plugin.json`)
- บันเดิลที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- บันเดิลที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือเลย์เอาต์คอมโพเนนต์ Claude เริ่มต้น)
- บันเดิลที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

<Note>
บันเดิลที่เข้ากันได้จะติดตั้งลงในรูท Plugin ปกติ และเข้าร่วมในโฟลว์ list/info/enable/disable เดียวกัน ปัจจุบันรองรับ Skills ของบันเดิล, command-skills ของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` / `lspServers` ที่ประกาศใน manifest ของ Claude, command-skills ของ Cursor และไดเรกทอรี hook ของ Codex ที่เข้ากันได้ ส่วนความสามารถอื่นของบันเดิลที่ตรวจพบจะแสดงใน diagnostics/info แต่ยังไม่ได้เชื่อมเข้ากับการทำงาน runtime
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
  แสดงเฉพาะ Plugin ที่เปิดใช้งานอยู่
</ParamField>
<ParamField path="--verbose" type="boolean">
  เปลี่ยนจากมุมมองตารางเป็นบรรทัดรายละเอียดต่อ Plugin พร้อม metadata ของ source/origin/version/activation
</ParamField>
<ParamField path="--json" type="boolean">
  inventory ที่อ่านด้วยเครื่องได้ พร้อม registry diagnostics และสถานะการติดตั้ง dependency ของแพ็กเกจ
</ParamField>

<Note>
`plugins list` อ่าน registry ของ Plugin ในเครื่องที่ persist ไว้ก่อน โดยมี fallback ที่ derive จาก manifest เท่านั้นเมื่อ registry หายไปหรือไม่ถูกต้อง คำสั่งนี้มีประโยชน์สำหรับตรวจสอบว่า Plugin ติดตั้งแล้ว เปิดใช้งานแล้ว และมองเห็นได้ในการวางแผน cold startup หรือไม่ แต่ไม่ใช่การ probe runtime สดของโปรเซส Gateway ที่กำลังทำงานอยู่ หลังจากเปลี่ยนโค้ด Plugin, enablement, hook policy หรือ `plugins.load.paths` ให้รีสตาร์ต Gateway ที่ให้บริการ channel ก่อนคาดหวังให้โค้ด `register(api)` หรือ hooks ใหม่ทำงาน สำหรับการ deploy แบบระยะไกล/คอนเทนเนอร์ ให้ตรวจสอบว่าคุณกำลังรีสตาร์ต child `openclaw gateway run` จริง ไม่ใช่แค่โปรเซส wrapper

`plugins list --json` รวม `dependencyStatus` ของแต่ละ Plugin จาก `package.json`
`dependencies` และ `optionalDependencies` OpenClaw ตรวจสอบว่าชื่อแพ็กเกจเหล่านั้นมีอยู่ตามพาธ lookup `node_modules` ปกติของ Plugin ใน Node หรือไม่ โดยจะไม่นำเข้าโค้ด runtime ของ Plugin, ไม่รัน package manager และไม่ซ่อม dependency ที่หายไป
</Note>

`plugins search` คือการค้นหาแค็ตตาล็อก ClawHub ระยะไกล คำสั่งนี้ไม่ตรวจสอบสถานะในเครื่อง, ไม่เปลี่ยน config, ไม่ติดตั้งแพ็กเกจ และไม่โหลดโค้ด runtime ของ Plugin ผลการค้นหารวมชื่อแพ็กเกจ ClawHub, family, channel, version, summary และคำแนะนำการติดตั้ง เช่น `openclaw plugins install clawhub:<package>`

สำหรับงาน Plugin ที่บันเดิลอยู่ภายในอิมเมจ Docker แบบแพ็กเกจ ให้ bind-mount ไดเรกทอรีซอร์สของ Plugin ทับพาธซอร์สแบบแพ็กเกจที่ตรงกัน เช่น `/app/extensions/synology-chat` OpenClaw จะค้นพบ overlay ซอร์สที่ mount นั้นก่อน `/app/dist/extensions/synology-chat`; ไดเรกทอรีซอร์สที่คัดลอกธรรมดาจะยังไม่ทำงาน เพื่อให้การติดตั้งแบบแพ็กเกจปกติยังคงใช้ dist ที่คอมไพล์แล้ว

สำหรับการดีบัก runtime hook:

- `openclaw plugins inspect <id> --runtime --json` แสดง hooks ที่ลงทะเบียนและ diagnostics จากรอบการตรวจสอบที่โหลดโมดูลแล้ว การตรวจสอบ runtime จะไม่ติดตั้ง dependencies; ใช้ `openclaw doctor --fix` เพื่อล้างสถานะ dependency เดิมหรือเพื่อติดตั้ง Plugin ที่ดาวน์โหลดได้ที่ config ไว้แต่หายไป
- `openclaw gateway status --deep --require-rpc` ยืนยัน Gateway ที่เข้าถึงได้, คำใบ้ service/process, พาธ config และสุขภาพ RPC
- conversation hooks ที่ไม่ใช่แบบบันเดิล (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรีในเครื่อง (เพิ่มเข้า `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
ไม่รองรับ `--force` ร่วมกับ `--link` เพราะการติดตั้งแบบ linked ใช้พาธซอร์สซ้ำแทนการคัดลอกทับเป้าหมายการติดตั้งที่จัดการโดยระบบ

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึก spec แบบ exact ที่ resolve แล้ว (`name@version`) ใน index ของ Plugin ที่จัดการโดยระบบ ขณะที่ยังคงพฤติกรรมเริ่มต้นแบบไม่ pin ไว้
</Note>

### Index ของ Plugin

metadata การติดตั้ง Plugin เป็นสถานะที่เครื่องจัดการ ไม่ใช่ config ของผู้ใช้ การติดตั้งและการอัปเดตเขียนข้อมูลนี้ไปที่ `plugins/installs.json` ภายใต้ไดเรกทอรีสถานะ OpenClaw ที่ใช้งานอยู่ map ระดับบนสุด `installRecords` คือแหล่งข้อมูลถาวรของ metadata การติดตั้ง รวมถึง record สำหรับ manifest ของ Plugin ที่เสียหรือหายไป array `plugins` คือแคช cold registry ที่ derive จาก manifest ไฟล์นี้มีคำเตือนห้ามแก้ไขและถูกใช้โดย `openclaw plugins update`, uninstall, diagnostics และ cold plugin registry

เมื่อ OpenClaw พบ record `plugins.installs` แบบ legacy ที่ส่งมาพร้อม config จะย้าย record เหล่านั้นเข้า index ของ Plugin และลบคีย์ config; หากการเขียนใดล้มเหลว record ใน config จะถูกเก็บไว้เพื่อไม่ให้ metadata การติดตั้งสูญหาย

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` ลบ record ของ Plugin ออกจาก `plugins.entries`, index ของ Plugin ที่ persist ไว้, รายการ allow/deny ของ Plugin และรายการ `plugins.load.paths` แบบ linked เมื่อเกี่ยวข้อง เว้นแต่ตั้งค่า `--keep-files` การถอนการติดตั้งจะลบไดเรกทอรีการติดตั้งที่จัดการโดยระบบซึ่งติดตามไว้ด้วย เมื่อไดเรกทอรีนั้นอยู่ภายในรูทส่วนขยาย Plugin ของ OpenClaw สำหรับ Plugin หน่วยความจำ active slot หน่วยความจำจะรีเซ็ตเป็น `memory-core`

<Note>
รองรับ `--keep-config` ในฐานะ alias ที่ deprecated สำหรับ `--keep-files`
</Note>

### อัปเดต

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

การอัปเดตใช้กับการติดตั้ง Plugin ที่ติดตามไว้ใน index ของ Plugin ที่จัดการโดยระบบ และการติดตั้ง hook-pack ที่ติดตามไว้ใน `hooks.internal.installs`

<AccordionGroup>
  <Accordion title="การ resolve plugin id เทียบกับ npm spec">
    เมื่อคุณส่ง plugin id OpenClaw จะใช้ install spec ที่บันทึกไว้สำหรับ Plugin นั้นซ้ำ ซึ่งหมายความว่า dist-tags ที่เคยเก็บไว้ เช่น `@beta` และเวอร์ชัน exact ที่ pin ไว้ จะยังคงถูกใช้ในการรัน `update <id>` ครั้งถัดไป

    สำหรับการติดตั้ง npm คุณยังสามารถส่ง npm package spec แบบชัดเจนพร้อม dist-tag หรือเวอร์ชัน exact ได้ OpenClaw จะ resolve ชื่อแพ็กเกจนั้นกลับไปยัง record ของ Plugin ที่ติดตามไว้ อัปเดต Plugin ที่ติดตั้งนั้น และบันทึก npm spec ใหม่สำหรับการอัปเดตตาม id ในอนาคต

    การส่งชื่อแพ็กเกจ npm โดยไม่มีเวอร์ชันหรือ tag จะ resolve กลับไปยัง record ของ Plugin ที่ติดตามไว้เช่นกัน ใช้สิ่งนี้เมื่อ Plugin ถูก pin ไปยังเวอร์ชัน exact และคุณต้องการย้ายกลับไปยัง release line เริ่มต้นของ registry

  </Accordion>
  <Accordion title="การอัปเดตช่อง beta">
    `openclaw plugins update` ใช้ spec ของ Plugin ที่ติดตามไว้ซ้ำ เว้นแต่คุณจะส่ง spec ใหม่ `openclaw update` ยังรู้จัก channel อัปเดตของ OpenClaw ที่ใช้งานอยู่ด้วย: บน channel beta, record ของ Plugin npm และ ClawHub ใน default-line จะลอง `@beta` ก่อน จากนั้น fallback ไปยัง spec default/latest ที่บันทึกไว้ หากไม่มี release beta ของ Plugin อยู่ เวอร์ชัน exact และ tag ที่ระบุชัดเจนจะยังคง pin กับ selector นั้น

  </Accordion>
  <Accordion title="การตรวจสอบเวอร์ชันและ integrity drift">
    ก่อนการอัปเดต npm แบบสด OpenClaw ตรวจสอบเวอร์ชันแพ็กเกจที่ติดตั้งกับ metadata ของ npm registry หากเวอร์ชันที่ติดตั้งและ identity ของ artifact ที่บันทึกไว้ตรงกับเป้าหมายที่ resolve แล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน `openclaw.json` ใหม่

    เมื่อมี hash integrity ที่เก็บไว้และ hash artifact ที่ fetch มาเปลี่ยนแปลง OpenClaw จะถือว่านั่นเป็น npm artifact drift คำสั่ง `openclaw plugins update` แบบ interactive จะพิมพ์ hash ที่คาดไว้และ hash จริง แล้วขอการยืนยันก่อนดำเนินการต่อ helper อัปเดตแบบ non-interactive จะ fail closed เว้นแต่ caller จะระบุ continuation policy อย่างชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install บน update">
    `--dangerously-force-unsafe-install` มีให้ใช้บน `plugins update` เช่นกัน ในฐานะ override แบบ break-glass สำหรับ false positive จากการสแกน dangerous-code ในตัวระหว่างการอัปเดต Plugin แต่ยังคงไม่ bypass การบล็อกตาม policy `before_install` ของ Plugin หรือการบล็อกเมื่อการสแกนล้มเหลว และใช้ได้เฉพาะกับการอัปเดต Plugin ไม่ใช่การอัปเดต hook-pack
  </Accordion>
</AccordionGroup>

### ตรวจสอบ

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect แสดง identity, สถานะการโหลด, source, ความสามารถของ manifest, flag ของ policy, diagnostics, metadata การติดตั้ง, ความสามารถของบันเดิล และการรองรับ MCP หรือ LSP server ใด ๆ ที่ตรวจพบ โดยค่าเริ่มต้นจะไม่นำเข้า runtime ของ Plugin เพิ่ม `--runtime` เพื่อโหลดโมดูล Plugin และรวม hooks, tools, commands, services, gateway methods และ HTTP routes ที่ลงทะเบียนแล้ว การตรวจสอบ runtime รายงาน dependency ของ Plugin ที่หายไปโดยตรง; การติดตั้งและซ่อมแซมยังคงอยู่ใน `openclaw plugins install`, `openclaw plugins update` และ `openclaw doctor --fix`

คำสั่ง CLI ที่ Plugin เป็นเจ้าของจะถูกติดตั้งเป็นกลุ่มคำสั่งรูท `openclaw` หลังจาก `inspect --runtime` แสดงคำสั่งภายใต้ `cliCommands` แล้ว ให้รันเป็น `openclaw <command> ...`; ตัวอย่างเช่น Plugin ที่ลงทะเบียน `demo-git` สามารถตรวจสอบได้ด้วย `openclaw demo-git ping`

Plugin แต่ละตัวถูกจัดประเภทตามสิ่งที่มันลงทะเบียนจริงใน runtime:

- **plain-capability** — ความสามารถหนึ่งประเภท (เช่น Plugin สำหรับ provider เท่านั้น)
- **hybrid-capability** — ความสามารถหลายประเภท (เช่น ข้อความ + เสียงพูด + รูปภาพ)
- **hook-only** — เฉพาะ hooks ไม่มีความสามารถหรือพื้นผิว
- **non-capability** — tools/commands/services แต่ไม่มีความสามารถ

ดู [รูปแบบ Plugin](/th/plugins/architecture#plugin-shapes) สำหรับข้อมูลเพิ่มเติมเกี่ยวกับโมเดลความสามารถ

<Note>
flag `--json` ส่งออกรายงานที่อ่านด้วยเครื่องได้ เหมาะสำหรับ scripting และ auditing `inspect --all` แสดงตารางทั้ง fleet พร้อมคอลัมน์ shape, capability kinds, compatibility notices, bundle capabilities และ hook summary `info` เป็น alias สำหรับ `inspect`
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` รายงานข้อผิดพลาดการโหลด Plugin, diagnostics ของ manifest/discovery และ compatibility notices เมื่อทุกอย่างเรียบร้อย จะพิมพ์ `No plugin issues detected.`

สำหรับความล้มเหลวด้าน module-shape เช่น export `register`/`activate` ที่หายไป ให้รันซ้ำพร้อม `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุปรูปแบบ export แบบย่อในผลลัพธ์ diagnostic

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

registry ของ Plugin ในเครื่องคือโมเดลอ่านแบบ cold ที่ persist ไว้ของ OpenClaw สำหรับ identity ของ Plugin ที่ติดตั้ง, enablement, source metadata และความเป็นเจ้าของ contribution การ startup ปกติ, การ lookup เจ้าของ provider, การจัดประเภท channel setup และ inventory ของ Plugin สามารถอ่านสิ่งนี้ได้โดยไม่ต้องนำเข้าโมดูล runtime ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่า registry ที่ persist ไว้มีอยู่ เป็นปัจจุบัน หรือล้าสมัย ใช้ `--refresh` เพื่อสร้างใหม่จาก index ของ Plugin ที่ persist ไว้, config policy และ metadata ของ manifest/package นี่คือพาธการซ่อมแซม ไม่ใช่พาธการเปิดใช้งาน runtime

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็นสวิตช์ความเข้ากันได้แบบฉุกเฉินที่เลิกใช้แล้วสำหรับความล้มเหลวในการอ่านรีจิสทรี ควรใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix`; กลไกสำรองผ่าน env มีไว้สำหรับการกู้คืนการเริ่มต้นระบบในกรณีฉุกเฉินเท่านั้นระหว่างที่การย้ายระบบกำลังทยอยใช้งาน
</Warning>

### มาร์เก็ตเพลส

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

รายการมาร์เก็ตเพลสรองรับพาธมาร์เก็ตเพลสในเครื่อง, พาธ `marketplace.json`, รูปแบบย่อของ GitHub เช่น `owner/repo`, URL ของ GitHub repo หรือ URL ของ git ส่วน `--json` จะแสดงป้ายกำกับแหล่งที่มาที่ resolve แล้วพร้อมกับ marketplace manifest และรายการ Plugin ที่ parse แล้ว

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Plugin จากชุมชน](/th/plugins/community)
