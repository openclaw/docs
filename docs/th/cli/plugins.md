---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือบันเดิลที่เข้ากันได้
    - คุณต้องการดีบักความล้มเหลวในการโหลด Plugin
sidebarTitle: Plugins
summary: คู่มืออ้างอิง CLI สำหรับ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-06T17:55:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 734366b6bbee5f036fdc2cfac5197ae86d2e8fbc7c977ccc4e22add2f4206951
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Plugin ของ Gateway, แพ็ก hook และบันเดิลที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="ระบบ Plugin" href="/th/tools/plugin">
    คู่มือสำหรับผู้ใช้ปลายทางในการติดตั้ง เปิดใช้งาน และแก้ปัญหา Plugin
  </Card>
  <Card title="จัดการ Plugin" href="/th/plugins/manage-plugins">
    ตัวอย่างสั้น ๆ สำหรับติดตั้ง แสดงรายการ อัปเดต ถอนการติดตั้ง และเผยแพร่
  </Card>
  <Card title="บันเดิล Plugin" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของบันเดิล
  </Card>
  <Card title="แมนิเฟสต์ Plugin" href="/th/plugins/manifest">
    ฟิลด์ของแมนิเฟสต์และสคีมาของการกำหนดค่า
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
ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) ตัวเปลี่ยนแปลงวงจรชีวิตของ Plugin จะถูกปิดใช้งาน ให้ใช้แหล่งที่มาของ Nix สำหรับการติดตั้งนี้แทน `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` หรือ `plugins disable`; สำหรับ nix-openclaw ให้ใช้ [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) แบบเน้น agent ก่อน
</Note>

<Note>
Plugin ที่มาพร้อมแพ็กเกจจะมาพร้อม OpenClaw บางรายการเปิดใช้งานตามค่าเริ่มต้น เช่น ผู้ให้บริการโมเดลที่มาพร้อมแพ็กเกจ ผู้ให้บริการเสียงพูดที่มาพร้อมแพ็กเกจ และ Plugin เบราว์เซอร์ที่มาพร้อมแพ็กเกจ ส่วนรายการอื่นต้องใช้ `plugins enable`

Plugin แบบเนทีฟของ OpenClaw ต้องจัดส่ง `openclaw.plugin.json` พร้อม JSON Schema แบบอินไลน์ (`configSchema` แม้ว่าจะว่างก็ตาม) บันเดิลที่เข้ากันได้จะใช้แมนิเฟสต์บันเดิลของตัวเองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุตรายการแบบละเอียด/info ยังแสดงชนิดย่อยของบันเดิล (`codex`, `claude` หรือ `cursor`) รวมถึงความสามารถของบันเดิลที่ตรวจพบ
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
ชื่อแพ็กเกจล้วนจะติดตั้งจาก npm ตามค่าเริ่มต้นในช่วงเปลี่ยนผ่านการเปิดตัว ใช้ `clawhub:<package>` สำหรับ ClawHub ให้ปฏิบัติต่อการติดตั้ง Plugin เหมือนการรันโค้ด ควรใช้เวอร์ชันที่ปักหมุดไว้
</Warning>

`plugins search` คิวรี ClawHub เพื่อหาแพ็กเกจ Plugin ที่ติดตั้งได้ และพิมพ์ชื่อแพ็กเกจที่พร้อมติดตั้ง โดยจะค้นหาแพ็กเกจ code-plugin และ bundle-plugin ไม่ใช่ Skills ใช้ `openclaw skills search` สำหรับ Skills ของ ClawHub

<Note>
ClawHub เป็นพื้นผิวหลักสำหรับการเผยแพร่และค้นพบ Plugin ส่วนใหญ่ Npm ยังคงเป็นทางสำรองและเส้นทางติดตั้งโดยตรงที่รองรับ แพ็กเกจ Plugin `@openclaw/*` ที่ OpenClaw เป็นเจ้าของถูกเผยแพร่บน npm อีกครั้งแล้ว ดูรายการปัจจุบันได้ที่ [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) หรือ [คลังรายการ Plugin](/th/plugins/plugin-inventory) การติดตั้งแบบเสถียรใช้ `latest` การติดตั้งและอัปเดตช่องทางเบต้าจะใช้ dist-tag `beta` ของ npm ก่อนเมื่อมีแท็กนั้น แล้วจึงถอยกลับไปใช้ `latest`
</Note>

<AccordionGroup>
  <Accordion title="การรวมไฟล์กำหนดค่าและการซ่อมแซมการกำหนดค่าที่ไม่ถูกต้อง">
    หากส่วน `plugins` ของคุณอิงกับ `$include` แบบไฟล์เดียว `plugins install/update/enable/disable/uninstall` จะเขียนผ่านไปยังไฟล์ที่รวมเข้ามานั้น และปล่อย `openclaw.json` ไว้เหมือนเดิม การ include ระดับราก, อาร์เรย์ include และ include ที่มีการแทนที่ข้างเคียงจะปิดแบบไม่ทำงานแทนการแบนเนื้อหา ดู [การรวมไฟล์กำหนดค่า](/th/gateway/configuration) สำหรับรูปแบบที่รองรับ

    หากการกำหนดค่าไม่ถูกต้องระหว่างการติดตั้ง โดยปกติ `plugins install` จะปิดแบบไม่ทำงานและแจ้งให้คุณรัน `openclaw doctor --fix` ก่อน ระหว่างการเริ่มต้น Gateway และการโหลดซ้ำแบบ hot reload การกำหนดค่า Plugin ที่ไม่ถูกต้องจะปิดแบบไม่ทำงานเหมือนการกำหนดค่าที่ไม่ถูกต้องอื่น ๆ; `openclaw doctor --fix` สามารถกักกันรายการ Plugin ที่ไม่ถูกต้องได้ ข้อยกเว้นขณะติดตั้งที่มีเอกสารระบุไว้เพียงอย่างเดียวคือเส้นทางกู้คืนแบบแคบสำหรับ Plugin ที่มาพร้อมแพ็กเกจ ซึ่งเลือกใช้ `openclaw.install.allowInvalidConfigRecovery` อย่างชัดเจน

  </Accordion>
  <Accordion title="--force และการติดตั้งซ้ำเทียบกับการอัปเดต">
    `--force` จะใช้เป้าหมายการติดตั้งเดิมซ้ำ และเขียนทับ Plugin หรือแพ็ก hook ที่ติดตั้งอยู่แล้วในตำแหน่งเดิม ใช้เมื่อคุณตั้งใจติดตั้ง id เดิมซ้ำจากพาธภายในเครื่อง อาร์ไคฟ์ แพ็กเกจ ClawHub หรืออาร์ติแฟกต์ npm ใหม่ สำหรับการอัปเกรดตามปกติของ Plugin npm ที่ติดตามอยู่แล้ว ควรใช้ `openclaw plugins update <id-or-npm-spec>`

    หากคุณรัน `plugins install` สำหรับ id ของ Plugin ที่ติดตั้งอยู่แล้ว OpenClaw จะหยุดและชี้ให้คุณใช้ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดปกติ หรือ `plugins install <package> --force` เมื่อคุณต้องการเขียนทับการติดตั้งปัจจุบันจากแหล่งอื่นจริง ๆ

  </Accordion>
  <Accordion title="ขอบเขตของ --pin">
    `--pin` ใช้กับการติดตั้ง npm เท่านั้น ไม่รองรับกับการติดตั้ง `git:`; ใช้ git ref ที่ชัดเจน เช่น `git:github.com/acme/plugin@v1.2.3` เมื่อคุณต้องการแหล่งที่มาที่ปักหมุดไว้ ไม่รองรับกับ `--marketplace` เพราะการติดตั้งจาก marketplace จะคงข้อมูลเมตาของแหล่งที่มา marketplace ไว้แทน npm spec
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` เป็นตัวเลือกฉุกเฉินสำหรับผลบวกเทียมในตัวสแกนโค้ดอันตรายในตัว มันอนุญาตให้การติดตั้งดำเนินต่อไปได้แม้ตัวสแกนในตัวรายงานผลการตรวจพบระดับ `critical` แต่จะ **ไม่** ข้ามการบล็อกนโยบาย hook `before_install` ของ Plugin และ **ไม่** ข้ามความล้มเหลวของการสแกน

    แฟล็ก CLI นี้ใช้กับโฟลว์การติดตั้ง/อัปเดต Plugin การติดตั้ง dependency ของ skill ที่หนุนด้วย Gateway ใช้การ override คำขอ `dangerouslyForceUnsafeInstall` ที่สอดคล้องกัน ส่วน `openclaw skills install` ยังคงเป็นโฟลว์ดาวน์โหลด/ติดตั้ง skill ของ ClawHub ที่แยกต่างหาก

    หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกบล็อกโดยการสแกนรีจิสทรี ให้ใช้ขั้นตอนสำหรับผู้เผยแพร่ใน [ClawHub](/th/tools/clawhub)

  </Accordion>
  <Accordion title="แพ็ก hook และ npm specs">
    `plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับแพ็ก hook ที่เปิดเผย `openclaw.hooks` ใน `package.json` ด้วย ใช้ `openclaw hooks` สำหรับการมองเห็น hook แบบกรองและการเปิดใช้งานราย hook ไม่ใช่การติดตั้งแพ็กเกจ

    Npm specs เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **เวอร์ชันแน่นอน** หรือ **dist-tag** ที่เป็นตัวเลือก) Git/URL/file specs และช่วง semver จะถูกปฏิเสธ การติดตั้ง dependency จะรันแบบภายในโปรเจกต์พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้ shell ของคุณจะมีการตั้งค่า npm install แบบโกลบอลก็ตาม ราก npm ของ Plugin ที่จัดการอยู่จะสืบทอด `overrides` ระดับแพ็กเกจของ OpenClaw ดังนั้น pin ความปลอดภัยของโฮสต์จึงใช้กับ dependency ของ Plugin ที่ถูก hoist ด้วย

    ใช้ `npm:<package>` เมื่อคุณต้องการระบุการ resolve ของ npm อย่างชัดเจน Bare package specs จะติดตั้งโดยตรงจาก npm เช่นกันในช่วงเปลี่ยนผ่านการเปิดตัว

    Bare specs และ `@latest` จะอยู่บนแทร็กเสถียร เวอร์ชันแก้ไขที่มีวันที่ของ OpenClaw เช่น `2026.5.3-1` เป็นรีลีสเสถียรสำหรับการตรวจนี้ หาก npm resolve รายการใดรายการหนึ่งเป็น prerelease OpenClaw จะหยุดและขอให้คุณเลือกใช้อย่างชัดเจนด้วยแท็ก prerelease เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease แบบแน่นอน เช่น `@1.2.3-beta.4`

    หาก install spec แบบ bare ตรงกับ id ของ Plugin ทางการ เช่น `diffs` OpenClaw จะติดตั้งรายการแคตตาล็อกโดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่มีชื่อเดียวกัน ให้ใช้ spec แบบ scoped ที่ชัดเจน เช่น `@scope/diffs`

  </Accordion>
  <Accordion title="รีโพซิทอรี Git">
    ใช้ `git:<repo>` เพื่อติดตั้งโดยตรงจากรีโพซิทอรี git รูปแบบที่รองรับรวมถึง `git:github.com/owner/repo`, `git:owner/repo`, clone URL แบบเต็ม `https://`, `ssh://`, `git://`, `file://` และ `git@host:owner/repo.git` เพิ่ม `@<ref>` หรือ `#<ref>` เพื่อ checkout branch, tag หรือ commit ก่อนติดตั้ง

    การติดตั้งจาก Git จะ clone ลงในไดเรกทอรีชั่วคราว checkout ref ที่ขอเมื่อมี แล้วใช้ตัวติดตั้งไดเรกทอรี Plugin ตามปกติ นั่นหมายความว่าการตรวจสอบแมนิเฟสต์ การสแกนโค้ดอันตราย งานติดตั้ง package-manager และบันทึกการติดตั้งจะทำงานเหมือนการติดตั้ง npm บันทึกการติดตั้งจาก git จะรวม URL/ref ของแหล่งที่มาและ commit ที่ resolve แล้ว เพื่อให้ `openclaw plugins update` สามารถ resolve แหล่งที่มาใหม่ภายหลังได้

    หลังติดตั้งจาก git ให้ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อตรวจสอบการลงทะเบียน runtime เช่นเมธอด Gateway และคำสั่ง CLI หาก Plugin ลงทะเบียน root ของ CLI ด้วย `api.registerCli` ให้เรียกใช้คำสั่งนั้นโดยตรงผ่าน root CLI ของ OpenClaw เช่น `openclaw demo-plugin ping`

  </Accordion>
  <Accordion title="อาร์ไคฟ์">
    อาร์ไคฟ์ที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` อาร์ไคฟ์ Plugin แบบเนทีฟของ OpenClaw ต้องมี `openclaw.plugin.json` ที่ถูกต้องที่ราก Plugin หลังแตกไฟล์ อาร์ไคฟ์ที่มีเพียง `package.json` จะถูกปฏิเสธก่อนที่ OpenClaw จะเขียนบันทึกการติดตั้ง

    ใช้ `npm-pack:<path.tgz>` เมื่อไฟล์เป็น tarball แบบ npm-pack และคุณต้องการทดสอบเส้นทางติดตั้ง npm-root ที่จัดการอยู่แบบเดียวกับที่การติดตั้งจาก registry ใช้ รวมถึงการตรวจสอบ `package-lock.json`, การสแกน dependency ที่ถูก hoist และบันทึกการติดตั้ง npm พาธอาร์ไคฟ์ธรรมดายังคงติดตั้งเป็นอาร์ไคฟ์ภายในเครื่องภายใต้รากส่วนขยาย Plugin

    รองรับการติดตั้งจาก marketplace ของ Claude ด้วย

  </Accordion>
</AccordionGroup>

การติดตั้งจาก ClawHub ใช้ตัวระบุตำแหน่ง `clawhub:<package>` ที่ชัดเจน:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Plugin specs แบบ bare ที่ปลอดภัยสำหรับ npm จะติดตั้งจาก npm ตามค่าเริ่มต้นในช่วงเปลี่ยนผ่านการเปิดตัว:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อระบุการ resolve แบบ npm-only อย่างชัดเจน:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw ตรวจสอบ API ของ Plugin ที่ประกาศไว้ / ความเข้ากันได้ขั้นต่ำของ Gateway ก่อนติดตั้ง เมื่อเวอร์ชัน ClawHub ที่เลือกเผยแพร่อาร์ติแฟกต์ ClawPack, OpenClaw จะดาวน์โหลด `.tgz` แบบ npm-pack ที่มีเวอร์ชัน, ตรวจสอบส่วนหัวไดเจสต์ของ ClawHub และไดเจสต์ของอาร์ติแฟกต์ จากนั้นติดตั้งผ่านเส้นทางอาร์ไคฟ์ปกติ เวอร์ชัน ClawHub รุ่นเก่าที่ไม่มีเมทาดาทา ClawPack ยังติดตั้งผ่านเส้นทางการตรวจสอบอาร์ไคฟ์แพ็กเกจแบบเดิม การติดตั้งที่บันทึกไว้จะเก็บเมทาดาทาแหล่งที่มา ClawHub, ชนิดอาร์ติแฟกต์, ค่า integrity ของ npm, ค่า shasum ของ npm, ชื่อทาร์บอล และข้อมูลไดเจสต์ของ ClawPack ไว้สำหรับการอัปเดตภายหลัง
การติดตั้ง ClawHub ที่ไม่ระบุเวอร์ชันจะเก็บสเปกที่บันทึกไว้แบบไม่ระบุเวอร์ชัน เพื่อให้ `openclaw plugins update` ติดตาม ClawHub รุ่นใหม่กว่าได้ ส่วนตัวเลือกเวอร์ชันหรือแท็กแบบชัดเจน เช่น `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` จะยังคงถูกตรึงไว้กับตัวเลือกนั้น

#### รูปแบบย่อของตลาดกลาง

ใช้รูปแบบย่อ `plugin@marketplace` เมื่อชื่อตลาดกลางมีอยู่ในแคชรีจิสทรีภายในเครื่องของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

ใช้ `--marketplace` เมื่อคุณต้องการส่งแหล่งที่มาของตลาดกลางอย่างชัดเจน:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="แหล่งที่มาของตลาดกลาง">
    - ชื่อตลาดกลางที่ Claude รู้จักจาก `~/.claude/plugins/known_marketplaces.json`
    - รูทตลาดกลางภายในเครื่องหรือเส้นทาง `marketplace.json`
    - รูปแบบย่อของ repo GitHub เช่น `owner/repo`
    - URL ของ repo GitHub เช่น `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="กฎของตลาดกลางระยะไกล">
    สำหรับตลาดกลางระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องอยู่ภายใน repo ตลาดกลางที่ clone มา OpenClaw ยอมรับแหล่งที่มาแบบเส้นทางสัมพัทธ์จาก repo นั้น และปฏิเสธแหล่งที่มา Plugin แบบ HTTP(S), เส้นทางสัมบูรณ์, git, GitHub และแหล่งที่มาอื่นที่ไม่ใช่เส้นทางจากแมนิเฟสต์ระยะไกล
  </Tab>
</Tabs>

สำหรับเส้นทางภายในเครื่องและอาร์ไคฟ์ OpenClaw จะตรวจพบโดยอัตโนมัติ:

- Plugin OpenClaw แบบเนทีฟ (`openclaw.plugin.json`)
- บันเดิลที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- บันเดิลที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือเลย์เอาต์คอมโพเนนต์เริ่มต้นของ Claude)
- บันเดิลที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

<Note>
บันเดิลที่เข้ากันได้จะติดตั้งลงในรูท Plugin ปกติ และเข้าร่วมในลำดับงาน list/info/enable/disable เดียวกัน ปัจจุบันรองรับ Skills ของบันเดิล, Skills แบบคำสั่งของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` / `lspServers` ที่ประกาศในแมนิเฟสต์ของ Claude, Skills แบบคำสั่งของ Cursor และไดเรกทอรีฮุกของ Codex ที่เข้ากันได้ ส่วนความสามารถอื่นของบันเดิลที่ตรวจพบจะแสดงในการวินิจฉัย/info แต่ยังไม่ได้เชื่อมเข้ากับการทำงานของรันไทม์
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
  สลับจากมุมมองตารางเป็นบรรทัดรายละเอียดต่อ Plugin พร้อมเมทาดาทาแหล่งที่มา/ต้นทาง/เวอร์ชัน/การเปิดใช้งาน
</ParamField>
<ParamField path="--json" type="boolean">
  รายการคงคลังที่เครื่องอ่านได้ พร้อมการวินิจฉัยรีจิสทรีและสถานะการติดตั้งแพ็กเกจที่พึ่งพา
</ParamField>

<Note>
`plugins list` อ่านรีจิสทรี Plugin ภายในเครื่องที่บันทึกถาวรไว้ก่อน โดยมีทางเลือกสำรองที่ได้จากแมนิเฟสต์เท่านั้นเมื่อรีจิสทรีหายไปหรือไม่ถูกต้อง คำสั่งนี้มีประโยชน์สำหรับตรวจสอบว่า Plugin ถูกติดตั้ง เปิดใช้งาน และมองเห็นต่อการวางแผนตอนเริ่มจากศูนย์หรือไม่ แต่ไม่ใช่การตรวจสอบรันไทม์สดของกระบวนการ Gateway ที่กำลังทำงานอยู่แล้ว หลังจากเปลี่ยนโค้ด Plugin, การเปิดใช้งาน, นโยบายฮุก หรือ `plugins.load.paths` ให้รีสตาร์ท Gateway ที่ให้บริการช่องทางนั้นก่อนคาดหวังให้โค้ด `register(api)` หรือฮุกใหม่ทำงาน สำหรับการปรับใช้ระยะไกล/คอนเทนเนอร์ ให้ตรวจสอบว่าคุณกำลังรีสตาร์ท child ของ `openclaw gateway run` จริง ไม่ใช่เพียงกระบวนการตัวห่อหุ้ม

`plugins list --json` รวม `dependencyStatus` ของ Plugin แต่ละตัวจาก `dependencies` และ `optionalDependencies` ของ `package.json` OpenClaw ตรวจสอบว่าชื่อแพ็กเกจเหล่านั้นมีอยู่ตามเส้นทางค้นหา `node_modules` ของ Node ตามปกติของ Plugin หรือไม่ โดยไม่นำเข้าโค้ดรันไทม์ของ Plugin, ไม่เรียกใช้ตัวจัดการแพ็กเกจ และไม่ซ่อมแซมการพึ่งพาที่ขาดหาย
</Note>

`plugins search` คือการค้นหาแค็ตตาล็อก ClawHub ระยะไกล คำสั่งนี้ไม่ตรวจสอบสถานะภายในเครื่อง, ไม่แก้ไขการกำหนดค่า, ไม่ติดตั้งแพ็กเกจ และไม่โหลดโค้ดรันไทม์ของ Plugin ผลการค้นหารวมชื่อแพ็กเกจ ClawHub, ตระกูล, ช่องทาง, เวอร์ชัน, สรุป และคำแนะนำการติดตั้ง เช่น `openclaw plugins install clawhub:<package>`

สำหรับงานกับ Plugin ที่บันเดิลอยู่ใน Docker image ที่แพ็กเกจแล้ว ให้เมาต์ผูกไดเรกทอรีซอร์สของ Plugin ทับเส้นทางซอร์สที่แพ็กเกจไว้ตรงกัน เช่น `/app/extensions/synology-chat` OpenClaw จะค้นพบโอเวอร์เลย์ซอร์สที่เมาต์ไว้นั้นก่อน `/app/dist/extensions/synology-chat`; ไดเรกทอรีซอร์สที่คัดลอกมาเฉย ๆ จะไม่ถูกใช้งาน เพื่อให้การติดตั้งแบบแพ็กเกจปกติยังคงใช้ dist ที่คอมไพล์แล้ว

สำหรับการดีบักฮุกรันไทม์:

- `openclaw plugins inspect <id> --runtime --json` แสดงฮุกที่ลงทะเบียนและการวินิจฉัยจากรอบการตรวจสอบที่โหลดโมดูล การตรวจสอบรันไทม์จะไม่ติดตั้งการพึ่งพา; ใช้ `openclaw doctor --fix` เพื่อล้างสถานะการพึ่งพาแบบเดิม หรือกู้คืน Plugin ที่ดาวน์โหลดได้ซึ่งขาดหายและถูกอ้างอิงโดยการกำหนดค่า
- `openclaw gateway status --deep --require-rpc` ยืนยัน Gateway ที่เข้าถึงได้, คำใบ้บริการ/กระบวนการ, เส้นทางการกำหนดค่า และสุขภาพ RPC
- ฮุกการสนทนาที่ไม่ได้บันเดิล (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรีภายในเครื่อง (เพิ่มเข้าไปใน `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
ไม่รองรับ `--force` ร่วมกับ `--link` เพราะการติดตั้งแบบลิงก์จะใช้เส้นทางซอร์สเดิมซ้ำ แทนการคัดลอกทับเป้าหมายการติดตั้งที่จัดการโดยระบบ

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึกสเปกเจาะจงที่แก้ค่าแล้ว (`name@version`) ในดัชนี Plugin ที่จัดการโดยระบบ ขณะที่พฤติกรรมเริ่มต้นยังไม่ถูกตรึง
</Note>

### ดัชนี Plugin

เมทาดาทาการติดตั้ง Plugin เป็นสถานะที่เครื่องจัดการ ไม่ใช่การกำหนดค่าของผู้ใช้ การติดตั้งและการอัปเดตจะเขียนข้อมูลนี้ไปยัง `plugins/installs.json` ใต้ไดเรกทอรีสถานะ OpenClaw ที่ใช้งานอยู่ แผนที่ `installRecords` ระดับบนสุดคือแหล่งข้อมูลถาวรของเมทาดาทาการติดตั้ง รวมถึงระเบียนสำหรับแมนิเฟสต์ Plugin ที่เสียหรือขาดหาย อาร์เรย์ `plugins` คือแคชรีจิสทรีตอนเริ่มจากศูนย์ที่ได้จากแมนิเฟสต์ ไฟล์นี้มีคำเตือนห้ามแก้ไข และถูกใช้โดย `openclaw plugins update`, การถอนการติดตั้ง, การวินิจฉัย และรีจิสทรี Plugin ตอนเริ่มจากศูนย์

เมื่อ OpenClaw พบระเบียน `plugins.installs` แบบเดิมที่ถูกจัดส่งมาในการกำหนดค่า การอ่านที่รันไทม์จะถือว่าระเบียนเหล่านั้นเป็นอินพุตเพื่อความเข้ากันได้ โดยไม่เขียน `openclaw.json` ใหม่ การเขียนข้อมูล Plugin แบบชัดเจนและ `openclaw doctor --fix` จะย้ายระเบียนเหล่านั้นไปยังดัชนี Plugin และลบคีย์การกำหนดค่าเมื่ออนุญาตให้เขียนการกำหนดค่าได้; หากการเขียนใดล้มเหลว ระเบียนในการกำหนดค่าจะถูกเก็บไว้เพื่อไม่ให้เมทาดาทาการติดตั้งสูญหาย

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` ลบระเบียน Plugin ออกจาก `plugins.entries`, ดัชนี Plugin ที่บันทึกถาวร, รายการในลิสต์อนุญาต/ปฏิเสธของ Plugin และรายการ `plugins.load.paths` ที่ลิงก์ไว้เมื่อเกี่ยวข้อง เว้นแต่จะตั้ง `--keep-files` การถอนการติดตั้งจะลบไดเรกทอรีการติดตั้งที่จัดการและติดตามไว้ด้วย เมื่อไดเรกทอรีนั้นอยู่ภายในรูทส่วนขยาย Plugin ของ OpenClaw สำหรับ Plugin Active Memory สล็อตหน่วยความจำจะรีเซ็ตเป็น `memory-core`

<Note>
รองรับ `--keep-config` เป็นชื่อแทนที่เลิกแนะนำแล้วของ `--keep-files`
</Note>

### อัปเดต

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

การอัปเดตมีผลกับการติดตั้ง Plugin ที่ติดตามไว้ในดัชนี Plugin ที่จัดการโดยระบบ และการติดตั้งแพ็กฮุกที่ติดตามไว้ใน `hooks.internal.installs`

<AccordionGroup>
  <Accordion title="การจับคู่รหัส Plugin กับสเปก npm">
    เมื่อคุณส่งรหัส Plugin, OpenClaw จะใช้สเปกการติดตั้งที่บันทึกไว้สำหรับ Plugin นั้นซ้ำ นั่นหมายความว่าแท็ก dist ที่เคยเก็บไว้ เช่น `@beta` และเวอร์ชันเจาะจงที่ตรึงไว้ จะยังคงถูกใช้ในการเรียก `update <id>` ภายหลัง

    สำหรับการติดตั้ง npm คุณยังสามารถส่งสเปกแพ็กเกจ npm แบบชัดเจนที่มีแท็ก dist หรือเวอร์ชันเจาะจงได้ OpenClaw จะจับคู่ชื่อแพ็กเกจนั้นกลับไปยังระเบียน Plugin ที่ติดตามไว้, อัปเดต Plugin ที่ติดตั้งนั้น และบันทึกสเปก npm ใหม่สำหรับการอัปเดตตามรหัสในอนาคต

    การส่งชื่อแพ็กเกจ npm โดยไม่มีเวอร์ชันหรือแท็กจะจับคู่กลับไปยังระเบียน Plugin ที่ติดตามไว้เช่นกัน ใช้วิธีนี้เมื่อ Plugin ถูกตรึงไว้กับเวอร์ชันเจาะจง และคุณต้องการย้ายกลับไปยังสายรุ่นเริ่มต้นของรีจิสทรี

  </Accordion>
  <Accordion title="การอัปเดตช่องทางเบต้า">
    `openclaw plugins update` ใช้สเปก Plugin ที่ติดตามไว้ซ้ำ เว้นแต่คุณจะส่งสเปกใหม่ นอกจากนี้ `openclaw update` ยังรู้ช่องทางอัปเดต OpenClaw ที่ใช้งานอยู่: บนช่องทางเบต้า ระเบียน Plugin npm และ ClawHub ในสายเริ่มต้นจะลอง `@beta` ก่อน จากนั้นถอยกลับไปยังสเปกเริ่มต้น/ล่าสุดที่บันทึกไว้หากไม่มีรุ่นเบต้าของ Plugin เวอร์ชันเจาะจงและแท็กแบบชัดเจนจะยังคงถูกตรึงไว้กับตัวเลือกนั้น

  </Accordion>
  <Accordion title="การตรวจสอบเวอร์ชันและการคลาดเคลื่อนของความสมบูรณ์">
    ก่อนการอัปเดต npm แบบสด OpenClaw จะตรวจสอบเวอร์ชันแพ็กเกจที่ติดตั้งเทียบกับเมทาดาทารีจิสทรี npm หากเวอร์ชันที่ติดตั้งและข้อมูลระบุอาร์ติแฟกต์ที่บันทึกไว้ตรงกับเป้าหมายที่แก้ค่าแล้วอยู่แล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด, ติดตั้งซ้ำ หรือเขียน `openclaw.json` ใหม่

    เมื่อมีแฮชความสมบูรณ์ที่เก็บไว้และแฮชอาร์ติแฟกต์ที่ดึงมาเปลี่ยนไป OpenClaw จะถือว่านั่นเป็นการคลาดเคลื่อนของอาร์ติแฟกต์ npm คำสั่ง `openclaw plugins update` แบบโต้ตอบจะพิมพ์แฮชที่คาดหวังและแฮชจริง แล้วขอการยืนยันก่อนดำเนินการต่อ ตัวช่วยอัปเดตแบบไม่โต้ตอบจะล้มเหลวแบบปิดกั้น เว้นแต่ผู้เรียกจะระบุนโยบายดำเนินการต่ออย่างชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install ในการอัปเดต">
    `--dangerously-force-unsafe-install` มีให้ใช้บน `plugins update` ด้วย โดยเป็นการแทนที่กรณีฉุกเฉินสำหรับผลบวกเทียมของการสแกนโค้ดอันตรายในตัวระหว่างการอัปเดต Plugin แต่ยังไม่ข้ามการบล็อกตามนโยบาย `before_install` ของ Plugin หรือการบล็อกเมื่อการสแกนล้มเหลว และใช้ได้เฉพาะกับการอัปเดต Plugin ไม่ใช่การอัปเดตแพ็กฮุก
  </Accordion>
</AccordionGroup>

### ตรวจสอบ

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

การตรวจสอบจะแสดงข้อมูลระบุตัวตน, สถานะการโหลด, แหล่งที่มา, ความสามารถในแมนิเฟสต์, แฟล็กนโยบาย, การวินิจฉัย, เมทาดาทาการติดตั้ง, ความสามารถของบันเดิล และการรองรับเซิร์ฟเวอร์ MCP หรือ LSP ที่ตรวจพบ โดยค่าเริ่มต้นจะไม่นำเข้ารันไทม์ของ Plugin เพิ่ม `--runtime` เพื่อโหลดโมดูล Plugin และรวมฮุก, เครื่องมือ, คำสั่ง, บริการ, เมธอด Gateway และ route HTTP ที่ลงทะเบียนไว้ การตรวจสอบรันไทม์รายงานการพึ่งพา Plugin ที่ขาดหายโดยตรง; การติดตั้งและการซ่อมแซมยังคงอยู่ใน `openclaw plugins install`, `openclaw plugins update` และ `openclaw doctor --fix`

คำสั่ง CLI ที่ Plugin เป็นเจ้าของจะถูกติดตั้งเป็นกลุ่มคำสั่ง `openclaw` ระดับรูท หลังจาก `inspect --runtime` แสดงคำสั่งภายใต้ `cliCommands` ให้เรียกใช้เป็น `openclaw <command> ...`; ตัวอย่างเช่น Plugin ที่ลงทะเบียน `demo-git` สามารถตรวจสอบได้ด้วย `openclaw demo-git ping`

Plugin แต่ละตัวจะถูกจัดประเภทตามสิ่งที่ลงทะเบียนจริงในรันไทม์:

- **plain-capability** — ความสามารถหนึ่งประเภท (เช่น Plugin สำหรับ provider เท่านั้น)
- **hybrid-capability** — ความสามารถหลายประเภท (เช่น ข้อความ + เสียงพูด + รูปภาพ)
- **hook-only** — มีเฉพาะ hook ไม่มีความสามารถหรือ surface
- **non-capability** — เครื่องมือ/คำสั่ง/บริการ แต่ไม่มีความสามารถ

ดู [รูปแบบ Plugin](/th/plugins/architecture#plugin-shapes) เพื่ออ่านเพิ่มเติมเกี่ยวกับโมเดลความสามารถ

<Note>
แฟล็ก `--json` จะแสดงรายงานที่เครื่องอ่านได้ ซึ่งเหมาะสำหรับการเขียนสคริปต์และการตรวจสอบ `inspect --all` จะแสดงผลตารางทั้งกลุ่มที่มีคอลัมน์รูปแบบ ชนิดความสามารถ ประกาศความเข้ากันได้ ความสามารถของบันเดิล และสรุป hook `info` เป็น alias ของ `inspect`
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` จะรายงานข้อผิดพลาดในการโหลด Plugin การวินิจฉัย manifest/discovery และประกาศความเข้ากันได้ เมื่อทุกอย่างเรียบร้อยจะแสดง `No plugin issues detected.`

หาก Plugin ที่กำหนดค่าไว้มีอยู่บนดิสก์แต่ถูกบล็อกโดยการตรวจสอบความปลอดภัยของพาธของ loader การตรวจสอบ config จะเก็บรายการ Plugin ไว้และรายงานเป็น `present but blocked` ให้แก้การวินิจฉัย Plugin ที่ถูกบล็อกก่อนหน้า เช่น ความเป็นเจ้าของพาธหรือสิทธิ์แบบ world-writable แทนการลบ config `plugins.entries.<id>` หรือ `plugins.allow`

สำหรับความล้มเหลวของรูปแบบโมดูล เช่น ไม่มี export `register`/`activate` ให้รันซ้ำด้วย `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุปรูปแบบ export แบบย่อในผลลัพธ์การวินิจฉัย

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

registry ของ Plugin ภายในเครื่องคือโมเดลการอ่านแบบ cold read ที่ OpenClaw เก็บถาวรสำหรับตัวตนของ Plugin ที่ติดตั้ง การเปิดใช้งาน เมตาดาต้าแหล่งที่มา และความเป็นเจ้าของ contribution การเริ่มต้นตามปกติ การค้นหาเจ้าของ provider การจัดประเภทการตั้งค่า channel และรายการ inventory ของ Plugin สามารถอ่านจากส่วนนี้ได้โดยไม่ต้อง import โมดูล runtime ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่า registry ที่เก็บถาวรมีอยู่ เป็นปัจจุบัน หรือเก่าแล้ว ใช้ `--refresh` เพื่อสร้างใหม่จากดัชนี Plugin ที่เก็บถาวร นโยบาย config และเมตาดาต้า manifest/package นี่เป็นเส้นทางการซ่อม ไม่ใช่เส้นทางการเปิดใช้งาน runtime

`openclaw doctor --fix` ยังซ่อม drift ของ managed npm ที่อยู่ใกล้กับ registry ด้วย: หากแพ็กเกจ `@openclaw/*` ที่กำพร้าหรือกู้คืนมาใต้ราก npm ของ Plugin ที่จัดการอยู่ไปบดบัง Plugin ที่บันเดิลมา doctor จะลบแพ็กเกจเก่านั้นและสร้าง registry ใหม่ เพื่อให้การเริ่มต้นตรวจสอบกับ manifest ที่บันเดิลมา

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็นสวิตช์ความเข้ากันได้แบบ break-glass ที่เลิกแนะนำแล้วสำหรับความล้มเหลวในการอ่าน registry ให้ใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix` แทน; fallback ผ่าน env มีไว้สำหรับการกู้คืนการเริ่มต้นในกรณีฉุกเฉินเท่านั้นระหว่างที่ migration กำลังทยอยใช้งาน
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

รายการ Marketplace รับพาธ marketplace ภายในเครื่อง พาธ `marketplace.json` ชวเลข GitHub เช่น `owner/repo` URL ของ repo บน GitHub หรือ URL ของ git `--json` จะแสดงป้ายกำกับแหล่งที่มาที่ resolve แล้ว รวมถึง manifest ของ marketplace และรายการ Plugin ที่ parse แล้ว

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [อ้างอิง CLI](/th/cli)
- [Plugin ชุมชน](/th/plugins/community)
