---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือชุดบันเดิลที่เข้ากันได้
    - คุณต้องการดีบักกรณีที่โหลด Plugin ไม่สำเร็จ
sidebarTitle: Plugins
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-04T09:37:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: f561ce098181b07f25db3520b1726162863469ac05fb4a3e786915257d97c9a4
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Gateway Plugin, ชุด hook และบันเดิลที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="ระบบ Plugin" href="/th/tools/plugin">
    คู่มือผู้ใช้ปลายทางสำหรับการติดตั้ง เปิดใช้งาน และแก้ปัญหา Plugin
  </Card>
  <Card title="จัดการ Plugin" href="/th/plugins/manage-plugins">
    ตัวอย่างสั้น ๆ สำหรับการติดตั้ง แสดงรายการ อัปเดต ถอนการติดตั้ง และเผยแพร่
  </Card>
  <Card title="บันเดิล Plugin" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของบันเดิล
  </Card>
  <Card title="แมนนิเฟสต์ Plugin" href="/th/plugins/manifest">
    ฟิลด์แมนนิเฟสต์และสคีมาการกำหนดค่า
  </Card>
  <Card title="ความปลอดภัย" href="/th/gateway/security">
    การเพิ่มความแข็งแกร่งด้านความปลอดภัยสำหรับการติดตั้ง Plugin
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

สำหรับการตรวจสอบการติดตั้ง การตรวจสอบ การถอนการติดตั้ง หรือการรีเฟรชรีจิสทรีที่ช้า ให้รันคำสั่งพร้อม `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` trace จะเขียนเวลาของแต่ละเฟสไปยัง stderr และยังคงทำให้เอาต์พุต JSON แยกวิเคราะห์ได้ ดู [การดีบัก](/th/help/debugging#plugin-lifecycle-trace)

<Note>
Plugin ที่มาพร้อมกันจะจัดส่งพร้อม OpenClaw บางรายการเปิดใช้งานตามค่าเริ่มต้น (เช่น ผู้ให้บริการโมเดลที่มาพร้อมกัน ผู้ให้บริการคำพูดที่มาพร้อมกัน และ Plugin เบราว์เซอร์ที่มาพร้อมกัน) รายการอื่นต้องใช้ `plugins enable`

Plugin OpenClaw แบบเนทีฟต้องจัดส่ง `openclaw.plugin.json` พร้อม JSON Schema แบบอินไลน์ (`configSchema` แม้จะว่างเปล่าก็ตาม) บันเดิลที่เข้ากันได้จะใช้แมนนิเฟสต์บันเดิลของตัวเองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุตรายการ/ข้อมูลแบบ verbose ยังแสดงชนิดย่อยของบันเดิล (`codex`, `claude` หรือ `cursor`) รวมถึงความสามารถของบันเดิลที่ตรวจพบ
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
ชื่อแพ็กเกจเปล่า ๆ จะติดตั้งจาก npm ตามค่าเริ่มต้นระหว่างช่วงเปลี่ยนผ่านการเปิดตัว ใช้ `clawhub:<package>` สำหรับ ClawHub ปฏิบัติต่อการติดตั้ง Plugin เหมือนการรันโค้ด ควรใช้เวอร์ชันที่ปักหมุดไว้
</Warning>

`plugins search` ค้นหา ClawHub สำหรับแพ็กเกจ Plugin ที่ติดตั้งได้ และพิมพ์ชื่อแพ็กเกจที่พร้อมติดตั้ง โดยค้นหาแพ็กเกจ code-plugin และ bundle-plugin ไม่ใช่ Skills ใช้ `openclaw skills search` สำหรับ ClawHub Skills

<Note>
ClawHub เป็นพื้นผิวหลักสำหรับการเผยแพร่และค้นพบ Plugin ส่วนใหญ่ Npm ยังคงเป็น fallback ที่รองรับและเส้นทางติดตั้งโดยตรง แพ็กเกจ Plugin `@openclaw/*` ที่ OpenClaw เป็นเจ้าของกลับมาเผยแพร่บน npm อีกครั้งแล้ว ดูรายการปัจจุบันได้ที่ [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) หรือ [คลังรายการ Plugin](/th/plugins/plugin-inventory) การติดตั้งแบบเสถียรใช้ `latest` การติดตั้งและอัปเดตช่องเบต้าจะเลือกใช้ dist-tag `beta` ของ npm เมื่อมีแท็กนั้น แล้วจึง fallback ไปที่ `latest`
</Note>

<AccordionGroup>
  <Accordion title="Config include และการซ่อมแซม config ที่ไม่ถูกต้อง">
    หากส่วน `plugins` ของคุณมี `$include` แบบไฟล์เดียวรองรับอยู่ `plugins install/update/enable/disable/uninstall` จะเขียนผ่านไปยังไฟล์ที่ include นั้นและปล่อย `openclaw.json` ไว้ไม่แตะต้อง root include, อาร์เรย์ include และ include ที่มี override ระดับ sibling จะล้มเหลวแบบปิดแทนการทำให้แบนราบ ดู [Config include](/th/gateway/configuration) สำหรับรูปแบบที่รองรับ

    หาก config ไม่ถูกต้องระหว่างการติดตั้ง โดยปกติ `plugins install` จะล้มเหลวแบบปิดและบอกให้คุณรัน `openclaw doctor --fix` ก่อน ระหว่างการเริ่มต้น Gateway และ hot reload, config Plugin ที่ไม่ถูกต้องจะล้มเหลวแบบปิดเหมือน config ที่ไม่ถูกต้องอื่น ๆ `openclaw doctor --fix` สามารถกักรายการ Plugin ที่ไม่ถูกต้องได้ ข้อยกเว้นระหว่างการติดตั้งที่มีเอกสารกำกับไว้เพียงอย่างเดียวคือเส้นทางกู้คืน Plugin ที่มาพร้อมกันแบบแคบสำหรับ Plugin ที่เลือกใช้ `openclaw.install.allowInvalidConfigRecovery` อย่างชัดเจน

  </Accordion>
  <Accordion title="--force และติดตั้งใหม่เทียบกับอัปเดต">
    `--force` ใช้เป้าหมายการติดตั้งเดิมซ้ำ และเขียนทับ Plugin หรือชุด hook ที่ติดตั้งแล้วในตำแหน่งเดิม ใช้เมื่อคุณตั้งใจติดตั้ง id เดิมซ้ำจากพาธภายในเครื่องใหม่ อาร์ไคฟ์ แพ็กเกจ ClawHub หรือ artifact ของ npm สำหรับการอัปเกรดตามปกติของ npm Plugin ที่ติดตามอยู่แล้ว ควรใช้ `openclaw plugins update <id-or-npm-spec>`

    หากคุณรัน `plugins install` สำหรับ id ของ Plugin ที่ติดตั้งอยู่แล้ว OpenClaw จะหยุดและชี้ไปที่ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดปกติ หรือที่ `plugins install <package> --force` เมื่อคุณต้องการเขียนทับการติดตั้งปัจจุบันจากแหล่งอื่นจริง ๆ

  </Accordion>
  <Accordion title="ขอบเขตของ --pin">
    `--pin` ใช้กับการติดตั้ง npm เท่านั้น ไม่รองรับกับการติดตั้ง `git:` ให้ใช้ git ref ที่ระบุชัด เช่น `git:github.com/acme/plugin@v1.2.3` เมื่อคุณต้องการแหล่งที่ปักหมุดไว้ ไม่รองรับกับ `--marketplace` เพราะการติดตั้งจาก marketplace จะเก็บ metadata แหล่งที่มาของ marketplace แทน npm spec
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` เป็นตัวเลือกฉุกเฉินสำหรับ false positive ในตัวสแกนโค้ดอันตรายในตัว มันอนุญาตให้การติดตั้งดำเนินต่อไปได้แม้เมื่อตัวสแกนในตัวรายงานข้อค้นพบระดับ `critical` แต่ **ไม่** ข้ามการบล็อกตามนโยบาย hook `before_install` ของ Plugin และ **ไม่** ข้ามความล้มเหลวของการสแกน

    flag ของ CLI นี้ใช้กับโฟลว์ติดตั้ง/อัปเดต Plugin การติดตั้ง dependency ของ Skills ที่รองรับโดย Gateway ใช้ request override ที่ตรงกันคือ `dangerouslyForceUnsafeInstall` ขณะที่ `openclaw skills install` ยังคงเป็นโฟลว์ดาวน์โหลด/ติดตั้ง ClawHub skill แยกต่างหาก

    หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกบล็อกโดยการสแกนรีจิสทรี ให้ใช้ขั้นตอนสำหรับผู้เผยแพร่ใน [ClawHub](/th/tools/clawhub)

  </Accordion>
  <Accordion title="ชุด hook และ npm spec">
    `plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับชุด hook ที่เปิดเผย `openclaw.hooks` ใน `package.json` ด้วย ใช้ `openclaw hooks` สำหรับการมองเห็น hook แบบกรองและการเปิดใช้งานราย hook ไม่ใช่การติดตั้งแพ็กเกจ

    npm spec เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **เวอร์ชันแบบ exact** หรือ **dist-tag** ที่เป็นทางเลือก) Git/URL/file spec และช่วง semver จะถูกปฏิเสธ การติดตั้ง dependency จะรันแบบ project-local พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้ว่า shell ของคุณจะมีการตั้งค่าติดตั้ง npm แบบ global ก็ตาม

    ใช้ `npm:<package>` เมื่อคุณต้องการระบุการ resolve ของ npm อย่างชัดเจน spec แพ็กเกจเปล่า ๆ ยังติดตั้งโดยตรงจาก npm ระหว่างช่วงเปลี่ยนผ่านการเปิดตัวด้วย

    spec เปล่า ๆ และ `@latest` จะอยู่บนแทร็กเสถียร เวอร์ชันแก้ไขแบบประทับวันที่ของ OpenClaw เช่น `2026.5.3-1` เป็นรุ่นเสถียรสำหรับการตรวจนี้ หาก npm resolve อย่างใดอย่างหนึ่งเป็น prerelease, OpenClaw จะหยุดและขอให้คุณเลือกใช้โดยชัดเจนด้วยแท็ก prerelease เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease แบบ exact เช่น `@1.2.3-beta.4`

    หาก spec การติดตั้งแบบเปล่าตรงกับ id ของ Plugin ทางการ (เช่น `diffs`) OpenClaw จะติดตั้งรายการแคตตาล็อกโดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่มีชื่อเดียวกัน ให้ใช้ scoped spec ที่ชัดเจน (เช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="รีโพสิทอรี Git">
    ใช้ `git:<repo>` เพื่อติดตั้งโดยตรงจากรีโพสิทอรี git รูปแบบที่รองรับได้แก่ `git:github.com/owner/repo`, `git:owner/repo`, URL clone แบบเต็ม `https://`, `ssh://`, `git://`, `file://` และ `git@host:owner/repo.git` เพิ่ม `@<ref>` หรือ `#<ref>` เพื่อ checkout branch, tag หรือ commit ก่อนติดตั้ง

    การติดตั้ง Git จะ clone ลงในไดเรกทอรีชั่วคราว checkout ref ที่ร้องขอเมื่อมี จากนั้นใช้ตัวติดตั้งไดเรกทอรี Plugin ตามปกติ นั่นหมายความว่า การตรวจสอบแมนนิเฟสต์ การสแกนโค้ดอันตราย งานติดตั้งของ package-manager และบันทึกการติดตั้งจะทำงานเหมือนการติดตั้ง npm การติดตั้ง git ที่บันทึกไว้จะรวม URL/ref แหล่งที่มาพร้อม commit ที่ resolve แล้ว เพื่อให้ `openclaw plugins update` สามารถ resolve แหล่งที่มาอีกครั้งในภายหลัง

    หลังติดตั้งจาก git ให้ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อตรวจสอบการลงทะเบียน runtime เช่น gateway method และคำสั่ง CLI หาก Plugin ลงทะเบียน root ของ CLI ด้วย `api.registerCli` ให้รันคำสั่งนั้นโดยตรงผ่าน root CLI ของ OpenClaw เช่น `openclaw demo-plugin ping`

  </Accordion>
  <Accordion title="อาร์ไคฟ์">
    อาร์ไคฟ์ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` อาร์ไคฟ์ Plugin OpenClaw แบบเนทีฟต้องมี `openclaw.plugin.json` ที่ถูกต้องที่ root ของ Plugin หลังแตกไฟล์ อาร์ไคฟ์ที่มีเพียง `package.json` จะถูกปฏิเสธก่อนที่ OpenClaw จะเขียนบันทึกการติดตั้ง

    รองรับการติดตั้งจาก Claude marketplace ด้วย

  </Accordion>
</AccordionGroup>

การติดตั้ง ClawHub ใช้ locator `clawhub:<package>` ที่ชัดเจน:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

npm-safe Plugin spec แบบเปล่าจะติดตั้งจาก npm ตามค่าเริ่มต้นระหว่างช่วงเปลี่ยนผ่านการเปิดตัว:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อทำให้การ resolve แบบ npm-only ชัดเจน:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw ตรวจสอบ plugin API / ความเข้ากันได้ขั้นต่ำของ gateway ที่ประกาศไว้ก่อนติดตั้ง เมื่อเวอร์ชัน ClawHub ที่เลือกเผยแพร่ ClawPack artifact, OpenClaw จะดาวน์โหลด `.tgz` แบบ npm-pack ที่มีเวอร์ชัน ตรวจสอบ header digest ของ ClawHub และ digest ของ artifact แล้วติดตั้งผ่านเส้นทางอาร์ไคฟ์ตามปกติ เวอร์ชัน ClawHub เก่าที่ไม่มี ClawPack metadata ยังคงติดตั้งผ่านเส้นทางการตรวจสอบอาร์ไคฟ์แพ็กเกจแบบเดิม การติดตั้งที่บันทึกไว้จะเก็บ metadata แหล่งที่มาของ ClawHub, ชนิด artifact, npm integrity, npm shasum, ชื่อ tarball และข้อเท็จจริง digest ของ ClawPack ไว้สำหรับการอัปเดตภายหลัง
การติดตั้ง ClawHub แบบไม่ระบุเวอร์ชันจะเก็บ spec ที่บันทึกไว้แบบไม่ระบุเวอร์ชัน เพื่อให้ `openclaw plugins update` สามารถตามรุ่น ClawHub ใหม่กว่าได้ ตัวเลือกเวอร์ชันหรือแท็กที่ระบุชัด เช่น `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` จะยังคงปักหมุดกับตัวเลือกนั้น

#### ชวเลข marketplace

ใช้ชวเลข `plugin@marketplace` เมื่อชื่อ marketplace มีอยู่ในแคชรีจิสทรีภายในเครื่องของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="แหล่งที่มาของมาร์เก็ตเพลซ">
    - ชื่อมาร์เก็ตเพลซที่ Claude รู้จักจาก `~/.claude/plugins/known_marketplaces.json`
    - รากมาร์เก็ตเพลซในเครื่องหรือพาธ `marketplace.json`
    - ชวเลขรีโป GitHub เช่น `owner/repo`
    - URL รีโป GitHub เช่น `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="กฎมาร์เก็ตเพลซระยะไกล">
    สำหรับมาร์เก็ตเพลซระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องอยู่ภายในรีโปมาร์เก็ตเพลซที่โคลนมา OpenClaw ยอมรับแหล่งที่มาแบบพาธสัมพัทธ์จากรีโปนั้น และปฏิเสธ HTTP(S), พาธสัมบูรณ์, git, GitHub และแหล่งที่มา Plugin อื่นที่ไม่ใช่พาธจากแมนิเฟสต์ระยะไกล
  </Tab>
</Tabs>

สำหรับพาธในเครื่องและไฟล์เก็บถาวร OpenClaw จะตรวจจับอัตโนมัติ:

- Plugin ดั้งเดิมของ OpenClaw (`openclaw.plugin.json`)
- บันเดิลที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- บันเดิลที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือเลย์เอาต์คอมโพเนนต์ Claude เริ่มต้น)
- บันเดิลที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

<Note>
บันเดิลที่เข้ากันได้จะติดตั้งลงในราก Plugin ปกติ และเข้าร่วมในโฟลว์รายการ/ข้อมูล/เปิดใช้/ปิดใช้เดียวกัน ปัจจุบันรองรับ Skills ของบันเดิล, Skills คำสั่งของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` / `lspServers` ที่ประกาศในแมนิเฟสต์ของ Claude, Skills คำสั่งของ Cursor และไดเรกทอรี hook ของ Codex ที่เข้ากันได้ ส่วนความสามารถอื่นของบันเดิลที่ตรวจพบจะแสดงใน diagnostics/info แต่ยังไม่ได้เชื่อมเข้ากับการดำเนินการรันไทม์
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
  เปลี่ยนจากมุมมองตารางเป็นบรรทัดรายละเอียดราย Plugin พร้อมเมทาดาทาแหล่งที่มา/ต้นทาง/เวอร์ชัน/การเปิดใช้งาน
</ParamField>
<ParamField path="--json" type="boolean">
  อินเวนทอรีที่เครื่องอ่านได้ พร้อม diagnostics ของรีจิสทรีและสถานะการติดตั้ง dependency ของแพ็กเกจ
</ParamField>

<Note>
`plugins list` อ่านรีจิสทรี Plugin ในเครื่องที่คงอยู่ก่อน โดยมี fallback ที่ได้จากแมนิเฟสต์เท่านั้นเมื่อรีจิสทรีขาดหายหรือไม่ถูกต้อง คำสั่งนี้มีประโยชน์สำหรับตรวจสอบว่า Plugin ติดตั้งแล้ว เปิดใช้งานแล้ว และมองเห็นได้ต่อการวางแผนเริ่มต้นแบบเย็นหรือไม่ แต่ไม่ใช่การตรวจสอบรันไทม์สดของกระบวนการ Gateway ที่กำลังทำงานอยู่ หลังจากเปลี่ยนโค้ด Plugin, การเปิดใช้งาน, นโยบาย hook หรือ `plugins.load.paths` ให้รีสตาร์ต Gateway ที่ให้บริการช่องทางนั้นก่อนคาดหวังให้โค้ด `register(api)` หรือ hook ใหม่ทำงาน สำหรับการปรับใช้ระยะไกล/คอนเทนเนอร์ ให้ยืนยันว่าคุณกำลังรีสตาร์ต child ของ `openclaw gateway run` ตัวจริง ไม่ใช่แค่กระบวนการ wrapper

`plugins list --json` รวม `dependencyStatus` ของแต่ละ Plugin จาก `package.json`
`dependencies` และ `optionalDependencies` OpenClaw ตรวจสอบว่าชื่อแพ็กเกจเหล่านั้นมีอยู่ตามพาธค้นหา `node_modules` ปกติของ Node สำหรับ Plugin หรือไม่ โดยจะไม่อิมพอร์ตโค้ดรันไทม์ของ Plugin, ไม่รันตัวจัดการแพ็กเกจ และไม่ซ่อม dependency ที่ขาดหาย
</Note>

`plugins search` เป็นการค้นหาแค็ตตาล็อก ClawHub ระยะไกล คำสั่งนี้ไม่ตรวจสอบสถานะในเครื่อง ไม่เปลี่ยน config ไม่ติดตั้งแพ็กเกจ และไม่โหลดโค้ดรันไทม์ของ Plugin ผลการค้นหาจะรวมชื่อแพ็กเกจ ClawHub, ตระกูล, ช่องทาง, เวอร์ชัน, สรุป และคำแนะนำการติดตั้ง เช่น `openclaw plugins install clawhub:<package>`

สำหรับงาน Plugin ที่บันเดิลไว้ภายในอิมเมจ Docker ที่แพ็กเกจแล้ว ให้ bind-mount ไดเรกทอรีซอร์สของ Plugin ทับพาธซอร์สที่แพ็กเกจไว้ให้ตรงกัน เช่น `/app/extensions/synology-chat` OpenClaw จะค้นพบ overlay ซอร์สที่เมาต์ไว้นั้นก่อน `/app/dist/extensions/synology-chat`; ไดเรกทอรีซอร์สที่คัดลอกธรรมดาจะไม่ทำงาน ดังนั้นการติดตั้งแบบแพ็กเกจปกติยังคงใช้ dist ที่คอมไพล์แล้ว

สำหรับการดีบัก hook รันไทม์:

- `openclaw plugins inspect <id> --runtime --json` แสดง hook ที่ลงทะเบียนแล้วและ diagnostics จากรอบการตรวจสอบที่โหลดโมดูล การตรวจสอบรันไทม์จะไม่ติดตั้ง dependency; ใช้ `openclaw doctor --fix` เพื่อล้างสถานะ dependency รุ่นเก่าหรือติดตั้ง Plugin แบบดาวน์โหลดที่กำหนดค่าไว้แต่ขาดหาย
- `openclaw gateway status --deep --require-rpc` ยืนยัน Gateway ที่เข้าถึงได้, คำใบ้บริการ/กระบวนการ, พาธ config และสุขภาพ RPC
- hook การสนทนาที่ไม่ใช่แบบบันเดิล (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรีในเครื่อง (เพิ่มลงใน `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
ไม่รองรับ `--force` ร่วมกับ `--link` เพราะการติดตั้งแบบลิงก์ใช้พาธซอร์สซ้ำแทนการคัดลอกทับเป้าหมายติดตั้งที่มีการจัดการ

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึก spec ตรงตัวที่ resolve แล้ว (`name@version`) ในดัชนี Plugin ที่มีการจัดการ ขณะที่ยังคงพฤติกรรมเริ่มต้นแบบไม่ pin
</Note>

### ดัชนี Plugin

เมทาดาทาการติดตั้ง Plugin เป็นสถานะที่เครื่องจัดการ ไม่ใช่ config ของผู้ใช้ การติดตั้งและอัปเดตจะเขียนข้อมูลนี้ไปที่ `plugins/installs.json` ใต้ไดเรกทอรีสถานะ OpenClaw ที่ใช้งานอยู่ แมป `installRecords` ระดับบนสุดคือแหล่งถาวรของเมทาดาทาการติดตั้ง รวมถึงเรคคอร์ดสำหรับแมนิเฟสต์ Plugin ที่เสียหรือขาดหาย อาร์เรย์ `plugins` คือแคชรีจิสทรีเย็นที่ได้จากแมนิเฟสต์ ไฟล์นี้มีคำเตือนห้ามแก้ไข และถูกใช้โดย `openclaw plugins update`, การถอนการติดตั้ง, diagnostics และรีจิสทรี Plugin แบบเย็น

เมื่อ OpenClaw พบเรคคอร์ด `plugins.installs` รุ่นเก่าที่จัดส่งมาใน config จะย้ายเรคคอร์ดเหล่านั้นเข้าไปในดัชนี Plugin และลบคีย์ config ออก หากการเขียนอย่างใดอย่างหนึ่งล้มเหลว เรคคอร์ดใน config จะถูกเก็บไว้เพื่อไม่ให้เมทาดาทาการติดตั้งสูญหาย

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` ลบเรคคอร์ด Plugin ออกจาก `plugins.entries`, ดัชนี Plugin ที่คงอยู่, รายการอนุญาต/ปฏิเสธของ Plugin และรายการ `plugins.load.paths` ที่ลิงก์ไว้เมื่อใช้ได้ เว้นแต่ตั้งค่า `--keep-files` การถอนการติดตั้งยังลบไดเรกทอรีติดตั้งที่มีการจัดการและถูกติดตามเมื่ออยู่ภายในราก extensions ของ Plugin ของ OpenClaw ด้วย สำหรับ Plugin ของ active memory สล็อตหน่วยความจำจะรีเซ็ตเป็น `memory-core`

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

การอัปเดตใช้กับการติดตั้ง Plugin ที่ถูกติดตามในดัชนี Plugin ที่มีการจัดการ และการติดตั้ง hook-pack ที่ถูกติดตามใน `hooks.internal.installs`

<AccordionGroup>
  <Accordion title="การ resolve id ของ Plugin เทียบกับ npm spec">
    เมื่อคุณส่ง id ของ Plugin OpenClaw จะใช้ spec การติดตั้งที่บันทึกไว้สำหรับ Plugin นั้นซ้ำ ซึ่งหมายความว่า dist-tag ที่เก็บไว้ก่อนหน้า เช่น `@beta` และเวอร์ชันที่ pin แบบตรงตัวยังคงถูกใช้ในการรัน `update <id>` ภายหลัง

    สำหรับการติดตั้ง npm คุณยังสามารถส่ง spec แพ็กเกจ npm แบบชัดเจนพร้อม dist-tag หรือเวอร์ชันตรงตัวได้ OpenClaw จะ resolve ชื่อแพ็กเกจนั้นกลับไปยังเรคคอร์ด Plugin ที่ถูกติดตาม อัปเดต Plugin ที่ติดตั้งนั้น และบันทึก spec npm ใหม่สำหรับการอัปเดตตาม id ในอนาคต

    การส่งชื่อแพ็กเกจ npm โดยไม่มีเวอร์ชันหรือแท็กก็จะ resolve กลับไปยังเรคคอร์ด Plugin ที่ถูกติดตามเช่นกัน ใช้วิธีนี้เมื่อ Plugin ถูก pin ไว้ที่เวอร์ชันตรงตัว และคุณต้องการย้ายกลับไปยังสายรีลีสเริ่มต้นของรีจิสทรี

  </Accordion>
  <Accordion title="การอัปเดตช่องทาง beta">
    `openclaw plugins update` ใช้ spec Plugin ที่ถูกติดตามซ้ำ เว้นแต่คุณส่ง spec ใหม่ `openclaw update` ยังรู้จักช่องทางอัปเดต OpenClaw ที่ใช้งานอยู่เพิ่มเติม: บนช่องทาง beta เรคคอร์ด Plugin npm และ ClawHub ในสายเริ่มต้นจะลอง `@beta` ก่อน จากนั้น fallback ไปยัง spec default/latest ที่บันทึกไว้ หากไม่มีรีลีส beta ของ Plugin เวอร์ชันตรงตัวและแท็กที่ระบุชัดเจนจะยังคง pin กับ selector นั้น

  </Accordion>
  <Accordion title="การตรวจสอบเวอร์ชันและ drift ของความสมบูรณ์">
    ก่อนการอัปเดต npm แบบสด OpenClaw จะตรวจสอบเวอร์ชันแพ็กเกจที่ติดตั้งกับเมทาดาทาของรีจิสทรี npm หากเวอร์ชันที่ติดตั้งและตัวตนอาร์ติแฟกต์ที่บันทึกไว้ตรงกับเป้าหมายที่ resolve แล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน `openclaw.json` ใหม่

    เมื่อมีแฮชความสมบูรณ์ที่เก็บไว้และแฮชอาร์ติแฟกต์ที่ดึงมาเปลี่ยนไป OpenClaw จะถือว่านั่นเป็น drift ของอาร์ติแฟกต์ npm คำสั่ง `openclaw plugins update` แบบโต้ตอบจะพิมพ์แฮชที่คาดไว้และแฮชจริง และขอการยืนยันก่อนดำเนินการต่อ ตัวช่วยอัปเดตแบบไม่โต้ตอบจะล้มเหลวแบบปิด เว้นแต่ผู้เรียกส่งนโยบายการดำเนินการต่อแบบชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install เมื่ออัปเดต">
    `--dangerously-force-unsafe-install` ยังมีให้ใช้กับ `plugins update` ในฐานะ override ฉุกเฉินสำหรับผลบวกลวงจากการสแกน dangerous-code ในตัวระหว่างการอัปเดต Plugin อย่างไรก็ตามจะยังไม่ข้ามบล็อกนโยบาย `before_install` ของ Plugin หรือการบล็อกจากความล้มเหลวของการสแกน และใช้ได้เฉพาะกับการอัปเดต Plugin ไม่ใช่การอัปเดต hook-pack
  </Accordion>
</AccordionGroup>

### ตรวจสอบ

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect แสดงตัวตน, สถานะการโหลด, แหล่งที่มา, ความสามารถของแมนิเฟสต์, ธงนโยบาย, diagnostics, เมทาดาทาการติดตั้ง, ความสามารถของบันเดิล และการรองรับเซิร์ฟเวอร์ MCP หรือ LSP ที่ตรวจพบ โดยค่าเริ่มต้นจะไม่อิมพอร์ต runtime ของ Plugin เพิ่ม `--runtime` เพื่อโหลดโมดูล Plugin และรวม hook, tools, commands, services, เมธอด Gateway และเส้นทาง HTTP ที่ลงทะเบียนไว้ การตรวจสอบรันไทม์รายงาน dependency ของ Plugin ที่ขาดหายโดยตรง ส่วนการติดตั้งและซ่อมแซมยังอยู่ใน `openclaw plugins install`, `openclaw plugins update` และ `openclaw doctor --fix`

คำสั่ง CLI ที่ Plugin เป็นเจ้าของจะติดตั้งเป็นกลุ่มคำสั่งราก `openclaw` หลังจาก `inspect --runtime` แสดงคำสั่งใต้ `cliCommands` ให้รันเป็น `openclaw <command> ...`; เช่น Plugin ที่ลงทะเบียน `demo-git` สามารถยืนยันได้ด้วย `openclaw demo-git ping`

Plugin แต่ละตัวถูกจัดประเภทตามสิ่งที่ลงทะเบียนจริงในรันไทม์:

- **plain-capability** — ประเภทความสามารถเดียว (เช่น Plugin ที่เป็น provider เท่านั้น)
- **hybrid-capability** — หลายประเภทความสามารถ (เช่น ข้อความ + เสียงพูด + รูปภาพ)
- **hook-only** — มีเฉพาะ hook ไม่มีความสามารถหรือ surface
- **non-capability** — tools/commands/services แต่ไม่มีความสามารถ

ดู [รูปร่าง Plugin](/th/plugins/architecture#plugin-shapes) สำหรับรายละเอียดเพิ่มเติมเกี่ยวกับโมเดลความสามารถ

<Note>
ธง `--json` ส่งออกรายงานที่เครื่องอ่านได้ เหมาะสำหรับสคริปต์และการตรวจสอบ `inspect --all` แสดงตารางทั้ง fleet พร้อมคอลัมน์รูปร่าง, ชนิดความสามารถ, ประกาศความเข้ากันได้, ความสามารถของบันเดิล และสรุป hook `info` เป็น alias ของ `inspect`
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` รายงานข้อผิดพลาดการโหลด Plugin, diagnostics ของแมนิเฟสต์/การค้นพบ และประกาศความเข้ากันได้ เมื่อทุกอย่างสะอาด จะพิมพ์ `No plugin issues detected.`

หาก Plugin ที่กำหนดค่าไว้มีอยู่บนดิสก์แต่ถูกบล็อกโดยการตรวจ path-safety ของ loader การตรวจสอบ config จะเก็บรายการ Plugin ไว้และรายงานว่า `present but blocked` แก้ diagnostic ของ Plugin ที่ถูกบล็อกก่อนหน้า เช่น ownership ของพาธหรือ permission แบบ world-writable แทนการลบ config `plugins.entries.<id>` หรือ `plugins.allow`

สำหรับความล้มเหลวด้านรูปร่างโมดูล เช่น export `register`/`activate` ขาดหาย ให้รันซ้ำด้วย `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุปรูปร่าง export แบบกะทัดรัดในเอาต์พุต diagnostic

### รีจิสทรี

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

รีจิสทรี Plugin ในเครื่องคือโมเดลอ่านแบบเย็นที่คงอยู่ของ OpenClaw สำหรับตัวตน Plugin, การเปิดใช้งาน, เมทาดาทาแหล่งที่มา และ ownership ของ contribution การเริ่มต้นปกติ, การค้นหาเจ้าของ provider, การจัดประเภทการตั้งค่าช่องทาง และอินเวนทอรี Plugin สามารถอ่านได้โดยไม่ต้องอิมพอร์ตโมดูลรันไทม์ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่ารีจิสทรีที่บันทึกถาวรมีอยู่ เป็นปัจจุบัน หรือล้าสมัย ใช้ `--refresh` เพื่อสร้างใหม่จากดัชนี Plugin ที่บันทึกถาวร นโยบายการกำหนดค่า และเมตาดาต้า manifest/package นี่คือเส้นทางซ่อมแซม ไม่ใช่เส้นทางเปิดใช้งานขณะรันไทม์

`openclaw doctor --fix` ยังซ่อมแซมความคลาดเคลื่อนของ npm ที่มีการจัดการซึ่งอยู่ใกล้กับรีจิสทรีด้วย: หากแพ็กเกจ `@openclaw/*` ที่กำพร้าหรือกู้คืนมาใต้ราก npm ของ Plugin ที่มีการจัดการบดบัง Plugin ที่รวมมา doctor จะลบแพ็กเกจล้าสมัยนั้นและสร้างรีจิสทรีใหม่ เพื่อให้การเริ่มต้นตรวจสอบกับ manifest ที่รวมมา

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็นสวิตช์ความเข้ากันได้แบบใช้ยามฉุกเฉินที่เลิกใช้แล้วสำหรับความล้มเหลวในการอ่านรีจิสทรี ควรใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix`; env fallback มีไว้สำหรับการกู้คืนการเริ่มต้นในกรณีฉุกเฉินเท่านั้นระหว่างที่การย้ายระบบกำลังทยอยใช้งาน
</Warning>

### มาร์เก็ตเพลส

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

รายการมาร์เก็ตเพลสรองรับพาธมาร์เก็ตเพลสภายในเครื่อง, พาธ `marketplace.json`, รูปแบบย่อของ GitHub เช่น `owner/repo`, URL ของ repo GitHub หรือ URL git `--json` จะแสดงป้ายกำกับแหล่งที่มาที่ resolve แล้ว พร้อม manifest ของมาร์เก็ตเพลสที่ parse แล้วและรายการ Plugin

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [อ้างอิง CLI](/th/cli)
- [Plugin ชุมชน](/th/plugins/community)
