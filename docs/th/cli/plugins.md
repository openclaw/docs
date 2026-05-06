---
read_when:
    - คุณต้องการติดตั้งหรือจัดการ Plugin ของ Gateway หรือบันเดิลที่เข้ากันได้
    - คุณต้องการดีบักความล้มเหลวในการโหลด Plugin
sidebarTitle: Plugins
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-06T09:06:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: e584092c6cdaf87681aef2ed106c299e3bab0552305b669c66b05deb61bf25ce
    source_path: cli/plugins.md
    workflow: 16
---

จัดการ Gateway Plugin, hook pack และบันเดิลที่เข้ากันได้

<CardGroup cols={2}>
  <Card title="ระบบ Plugin" href="/th/tools/plugin">
    คู่มือผู้ใช้ปลายทางสำหรับการติดตั้ง เปิดใช้งาน และแก้ไขปัญหา Plugin
  </Card>
  <Card title="จัดการ Plugin" href="/th/plugins/manage-plugins">
    ตัวอย่างรวดเร็วสำหรับการติดตั้ง แสดงรายการ อัปเดต ถอนการติดตั้ง และเผยแพร่
  </Card>
  <Card title="บันเดิล Plugin" href="/th/plugins/bundles">
    โมเดลความเข้ากันได้ของบันเดิล
  </Card>
  <Card title="แมนิเฟสต์ Plugin" href="/th/plugins/manifest">
    ฟิลด์แมนิเฟสต์และสคีมาการกำหนดค่า
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

สำหรับการตรวจสอบการติดตั้ง การตรวจสอบ การถอนการติดตั้ง หรือการรีเฟรชรีจิสทรีที่ช้า ให้รันคำสั่งด้วย `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` เทรซจะเขียนเวลาในแต่ละเฟสไปยัง stderr และยังคงทำให้เอาต์พุต JSON แยกวิเคราะห์ได้ ดู [การดีบัก](/th/help/debugging#plugin-lifecycle-trace)

<Note>
Plugin ที่มาพร้อมชุดติดตั้งจะจัดส่งพร้อม OpenClaw บางรายการเปิดใช้งานตามค่าเริ่มต้น (เช่น ผู้ให้บริการโมเดลที่มาพร้อมชุดติดตั้ง ผู้ให้บริการเสียงพูดที่มาพร้อมชุดติดตั้ง และ Plugin เบราว์เซอร์ที่มาพร้อมชุดติดตั้ง) ส่วนรายการอื่นต้องใช้ `plugins enable`

Plugin แบบเนทีฟของ OpenClaw ต้องจัดส่ง `openclaw.plugin.json` พร้อม JSON Schema แบบอินไลน์ (`configSchema` แม้ว่าจะว่างก็ตาม) บันเดิลที่เข้ากันได้ใช้แมนิเฟสต์บันเดิลของตัวเองแทน

`plugins list` แสดง `Format: openclaw` หรือ `Format: bundle` เอาต์พุตรายการแบบละเอียด/ข้อมูลจะแสดงชนิดย่อยของบันเดิลด้วย (`codex`, `claude` หรือ `cursor`) พร้อมความสามารถของบันเดิลที่ตรวจพบ
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
ชื่อแพ็กเกจแบบเปล่าจะติดตั้งจาก npm ตามค่าเริ่มต้นระหว่างช่วงเปลี่ยนผ่านการเปิดตัว ใช้ `clawhub:<package>` สำหรับ ClawHub ปฏิบัติต่อการติดตั้ง Plugin เหมือนกับการรันโค้ด ควรใช้เวอร์ชันที่ปักหมุดไว้
</Warning>

`plugins search` ค้นหาแพ็กเกจ Plugin ที่ติดตั้งได้ใน ClawHub และพิมพ์ชื่อแพ็กเกจที่พร้อมติดตั้ง โดยจะค้นหาแพ็กเกจ code-plugin และ bundle-plugin ไม่ใช่ Skills ใช้ `openclaw skills search` สำหรับ Skills ของ ClawHub

<Note>
ClawHub เป็นพื้นผิวหลักสำหรับการเผยแพร่และค้นพบ Plugin ส่วนใหญ่ Npm ยังคงเป็นทางเลือกสำรองที่รองรับและเป็นเส้นทางติดตั้งโดยตรง แพ็กเกจ Plugin `@openclaw/*` ที่ OpenClaw เป็นเจ้าของเผยแพร่บน npm อีกครั้ง ดูรายการปัจจุบันได้ที่ [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) หรือ [คลังรายการ Plugin](/th/plugins/plugin-inventory) การติดตั้งเวอร์ชันเสถียรใช้ `latest` การติดตั้งและอัปเดตในช่องเบตาจะเลือกใช้ dist-tag `beta` ของ npm เมื่อแท็กนั้นมีอยู่ จากนั้นจึงถอยกลับไปใช้ `latest`
</Note>

<AccordionGroup>
  <Accordion title="การ include การกำหนดค่าและการซ่อมแซมการกำหนดค่าที่ไม่ถูกต้อง">
    หากส่วน `plugins` ของคุณอ้างอิงด้วย `$include` แบบไฟล์เดียว `plugins install/update/enable/disable/uninstall` จะเขียนทะลุไปยังไฟล์ที่ include นั้นและปล่อย `openclaw.json` ไว้ไม่แตะต้อง การ include ระดับราก อาร์เรย์ include และ include ที่มีการเขียนทับข้างเคียงจะล้มเหลวแบบปิดแทนที่จะถูกแผ่ให้แบน ดู [การ include การกำหนดค่า](/th/gateway/configuration) สำหรับรูปแบบที่รองรับ

    หากการกำหนดค่าไม่ถูกต้องระหว่างการติดตั้ง โดยปกติ `plugins install` จะล้มเหลวแบบปิดและบอกให้คุณรัน `openclaw doctor --fix` ก่อน ระหว่างการเริ่มต้น Gateway และการโหลดซ้ำแบบร้อน การกำหนดค่า Plugin ที่ไม่ถูกต้องจะล้มเหลวแบบปิดเหมือนการกำหนดค่าที่ไม่ถูกต้องอื่นๆ `openclaw doctor --fix` สามารถกักกันรายการ Plugin ที่ไม่ถูกต้องได้ ข้อยกเว้นเวลา install ที่มีเอกสารกำกับไว้มีเพียงเส้นทางการกู้คืน Plugin ที่มาพร้อมชุดติดตั้งแบบแคบ สำหรับ Plugin ที่เลือกใช้ `openclaw.install.allowInvalidConfigRecovery` อย่างชัดเจน

  </Accordion>
  <Accordion title="--force และการติดตั้งซ้ำเทียบกับการอัปเดต">
    `--force` ใช้เป้าหมายการติดตั้งเดิมซ้ำและเขียนทับ Plugin หรือ hook pack ที่ติดตั้งแล้วในตำแหน่งเดิม ใช้ตัวเลือกนี้เมื่อคุณตั้งใจติดตั้ง id เดิมซ้ำจากพาธโลคัลใหม่ ไฟล์เก็บถาวร แพ็กเกจ ClawHub หรือ artifact ของ npm สำหรับการอัปเกรดตามปกติของ Plugin npm ที่ติดตามอยู่แล้ว ควรใช้ `openclaw plugins update <id-or-npm-spec>`

    หากคุณรัน `plugins install` สำหรับ id ของ Plugin ที่ติดตั้งอยู่แล้ว OpenClaw จะหยุดและชี้คุณไปที่ `plugins update <id-or-npm-spec>` สำหรับการอัปเกรดปกติ หรือไปที่ `plugins install <package> --force` เมื่อคุณต้องการเขียนทับการติดตั้งปัจจุบันจากแหล่งอื่นจริงๆ

  </Accordion>
  <Accordion title="ขอบเขตของ --pin">
    `--pin` ใช้กับการติดตั้ง npm เท่านั้น ไม่รองรับกับการติดตั้ง `git:` ใช้ git ref แบบชัดเจน เช่น `git:github.com/acme/plugin@v1.2.3` เมื่อคุณต้องการแหล่งที่ปักหมุดไว้ ไม่รองรับกับ `--marketplace` เพราะการติดตั้ง marketplace จะเก็บเมทาดาทาแหล่ง marketplace แทน npm spec
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` เป็นตัวเลือกฉุกเฉินสำหรับผลบวกเทียมในตัวสแกนโค้ดอันตรายในตัว มันอนุญาตให้การติดตั้งดำเนินต่อแม้เมื่อตัวสแกนในตัวรายงานการพบระดับ `critical` แต่จะ **ไม่** ข้ามการบล็อกตามนโยบาย hook `before_install` ของ Plugin และ **ไม่** ข้ามความล้มเหลวของการสแกน

    แฟล็ก CLI นี้ใช้กับโฟลว์การติดตั้ง/อัปเดต Plugin การติดตั้ง dependency ของ skill ที่รองรับโดย Gateway ใช้การ override คำขอ `dangerouslyForceUnsafeInstall` ที่ตรงกัน ขณะที่ `openclaw skills install` ยังคงเป็นโฟลว์ดาวน์โหลด/ติดตั้ง skill ของ ClawHub แยกต่างหาก

    หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกบล็อกโดยการสแกนรีจิสทรี ให้ใช้ขั้นตอนสำหรับผู้เผยแพร่ใน [ClawHub](/th/tools/clawhub)

  </Accordion>
  <Accordion title="Hook pack และ npm specs">
    `plugins install` ยังเป็นพื้นผิวการติดตั้งสำหรับ hook pack ที่เปิดเผย `openclaw.hooks` ใน `package.json` ด้วย ใช้ `openclaw hooks` สำหรับการมองเห็น hook แบบกรองแล้วและการเปิดใช้งานราย hook ไม่ใช่สำหรับการติดตั้งแพ็กเกจ

    Npm specs เป็นแบบ **รีจิสทรีเท่านั้น** (ชื่อแพ็กเกจ + **เวอร์ชันที่แน่นอน** หรือ **dist-tag** แบบไม่บังคับ) Git/URL/file specs และช่วง semver จะถูกปฏิเสธ การติดตั้ง dependency จะรันแบบ project-local ด้วย `--ignore-scripts` เพื่อความปลอดภัย แม้ว่า shell ของคุณจะมีการตั้งค่าการติดตั้ง npm ส่วนกลางก็ตาม

    ใช้ `npm:<package>` เมื่อคุณต้องการระบุการ resolve ผ่าน npm อย่างชัดเจน Bare package specs จะติดตั้งโดยตรงจาก npm ระหว่างช่วงเปลี่ยนผ่านการเปิดตัวเช่นกัน

    Bare specs และ `@latest` จะอยู่บนแทร็กเสถียร เวอร์ชันแก้ไขแบบประทับวันที่ของ OpenClaw เช่น `2026.5.3-1` ถือเป็นรุ่นเสถียรสำหรับการตรวจสอบนี้ หาก npm resolve รายการใดรายการหนึ่งให้เป็น prerelease OpenClaw จะหยุดและขอให้คุณเลือกใช้อย่างชัดเจนด้วยแท็ก prerelease เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease ที่แน่นอน เช่น `@1.2.3-beta.4`

    หาก bare install spec ตรงกับ id ของ Plugin ทางการ (เช่น `diffs`) OpenClaw จะติดตั้งรายการแค็ตตาล็อกโดยตรง หากต้องการติดตั้งแพ็กเกจ npm ที่มีชื่อเดียวกัน ให้ใช้ scoped spec แบบชัดเจน (เช่น `@scope/diffs`)

  </Accordion>
  <Accordion title="รีโพซิทอรี Git">
    ใช้ `git:<repo>` เพื่อติดตั้งโดยตรงจากรีโพซิทอรี git รูปแบบที่รองรับได้แก่ `git:github.com/owner/repo`, `git:owner/repo`, clone URL แบบเต็ม `https://`, `ssh://`, `git://`, `file://` และ `git@host:owner/repo.git` เพิ่ม `@<ref>` หรือ `#<ref>` เพื่อ check out branch, tag หรือ commit ก่อนติดตั้ง

    การติดตั้ง Git จะ clone ไปยังไดเรกทอรีชั่วคราว check out ref ที่ร้องขอเมื่อมี จากนั้นใช้ตัวติดตั้งไดเรกทอรี Plugin ตามปกติ ซึ่งหมายความว่าการตรวจสอบแมนิเฟสต์ การสแกนโค้ดอันตราย งานติดตั้ง package-manager และบันทึกการติดตั้งจะทำงานเหมือนการติดตั้ง npm การติดตั้ง git ที่บันทึกไว้จะรวม URL/ref ต้นทางพร้อม commit ที่ resolve ได้ เพื่อให้ `openclaw plugins update` สามารถ resolve แหล่งที่มาใหม่ภายหลังได้

    หลังติดตั้งจาก git ให้ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อตรวจสอบการลงทะเบียน runtime เช่น เมธอด Gateway และคำสั่ง CLI หาก Plugin ลงทะเบียน CLI root ด้วย `api.registerCli` ให้เรียกใช้คำสั่งนั้นโดยตรงผ่าน root CLI ของ OpenClaw เช่น `openclaw demo-plugin ping`

  </Accordion>
  <Accordion title="ไฟล์เก็บถาวร">
    ไฟล์เก็บถาวรที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar` ไฟล์เก็บถาวรของ Plugin แบบเนทีฟของ OpenClaw ต้องมี `openclaw.plugin.json` ที่ถูกต้องอยู่ที่ root ของ Plugin หลังแตกไฟล์ ไฟล์เก็บถาวรที่มีเพียง `package.json` จะถูกปฏิเสธก่อนที่ OpenClaw จะเขียนบันทึกการติดตั้ง

    ใช้ `npm-pack:<path.tgz>` เมื่อไฟล์เป็น tarball ของ npm-pack และคุณต้องการทดสอบเส้นทางติดตั้ง npm-root ที่มีการจัดการแบบเดียวกับที่ใช้ในการติดตั้งจากรีจิสทรี รวมถึงการตรวจสอบ `package-lock.json` การสแกน dependency ที่ hoist แล้ว และบันทึกการติดตั้ง npm พาธไฟล์เก็บถาวรแบบธรรมดายังคงติดตั้งเป็นไฟล์เก็บถาวรโลคัลใต้ root ของส่วนขยาย Plugin

    รองรับการติดตั้งจาก Claude marketplace ด้วยเช่นกัน

  </Accordion>
</AccordionGroup>

การติดตั้ง ClawHub ใช้ตัวระบุตำแหน่ง `clawhub:<package>` แบบชัดเจน:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

npm-safe plugin specs แบบเปล่าจะติดตั้งจาก npm ตามค่าเริ่มต้นระหว่างช่วงเปลี่ยนผ่านการเปิดตัว:

```bash
openclaw plugins install openclaw-codex-app-server
```

ใช้ `npm:` เพื่อระบุการ resolve แบบ npm-only อย่างชัดเจน:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw ตรวจสอบ Plugin API ที่ประกาศไว้ / ความเข้ากันได้ขั้นต่ำของ Gateway ก่อนติดตั้ง เมื่อเวอร์ชัน ClawHub ที่เลือกเผยแพร่ artifact แบบ ClawPack แล้ว OpenClaw จะดาวน์โหลด npm-pack `.tgz` ตามเวอร์ชัน ตรวจสอบ header digest ของ ClawHub และ digest ของ artifact จากนั้นติดตั้งผ่านเส้นทางไฟล์เก็บถาวรตามปกติ เวอร์ชัน ClawHub ที่เก่ากว่าซึ่งไม่มีเมทาดาทา ClawPack จะยังติดตั้งผ่านเส้นทางตรวจสอบไฟล์เก็บถาวรแพ็กเกจแบบดั้งเดิม การติดตั้งที่บันทึกไว้จะเก็บเมทาดาทาแหล่ง ClawHub, ชนิด artifact, npm integrity, npm shasum, ชื่อ tarball และข้อเท็จจริง digest ของ ClawPack ไว้สำหรับการอัปเดตภายหลัง
การติดตั้ง ClawHub แบบไม่มีเวอร์ชันจะเก็บ spec ที่บันทึกแบบไม่มีเวอร์ชันไว้ เพื่อให้ `openclaw plugins update` สามารถติดตามรุ่นใหม่ของ ClawHub ได้ ตัวเลือกเวอร์ชันหรือแท็กแบบชัดเจน เช่น `clawhub:pkg@1.2.3` และ `clawhub:pkg@beta` จะยังคงปักหมุดกับตัวเลือกนั้น

#### ชวเลข Marketplace

ใช้ชวเลข `plugin@marketplace` เมื่อชื่อ marketplace มีอยู่ในแคชรีจิสทรีโลคัลของ Claude ที่ `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

ใช้ `--marketplace` เมื่อคุณต้องการส่งแหล่ง marketplace อย่างชัดเจน:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - ชื่อ marketplace ที่ Claude รู้จักจาก `~/.claude/plugins/known_marketplaces.json`
    - รูท marketplace ภายในเครื่องหรือพาธ `marketplace.json`
    - ชื่อย่อ GitHub repo เช่น `owner/repo`
    - URL ของ GitHub repo เช่น `https://github.com/owner/repo`
    - URL ของ git

  </Tab>
  <Tab title="Remote marketplace rules">
    สำหรับ marketplace ระยะไกลที่โหลดจาก GitHub หรือ git รายการ Plugin ต้องอยู่ภายใน repo marketplace ที่ถูก clone ไว้ OpenClaw ยอมรับแหล่งที่มาแบบพาธสัมพัทธ์จาก repo นั้น และปฏิเสธแหล่งที่มาของ Plugin แบบ HTTP(S), absolute-path, git, GitHub และแหล่งที่มาอื่นที่ไม่ใช่พาธจาก manifest ระยะไกล
  </Tab>
</Tabs>

สำหรับพาธและไฟล์ archive ภายในเครื่อง OpenClaw จะตรวจหาโดยอัตโนมัติ:

- Plugin แบบ native ของ OpenClaw (`openclaw.plugin.json`)
- bundle ที่เข้ากันได้กับ Codex (`.codex-plugin/plugin.json`)
- bundle ที่เข้ากันได้กับ Claude (`.claude-plugin/plugin.json` หรือโครงร่างคอมโพเนนต์เริ่มต้นของ Claude)
- bundle ที่เข้ากันได้กับ Cursor (`.cursor-plugin/plugin.json`)

<Note>
bundle ที่เข้ากันได้จะติดตั้งลงในรูท Plugin ปกติ และเข้าร่วมใน flow รายการ/info/enable/disable เดียวกัน ปัจจุบันรองรับ bundle skills, command-skills ของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` / `lspServers` ที่ประกาศใน manifest ของ Claude, command-skills ของ Cursor และไดเรกทอรี hook ของ Codex ที่เข้ากันได้; ความสามารถอื่นของ bundle ที่ตรวจพบจะแสดงใน diagnostics/info แต่ยังไม่ได้เชื่อมเข้ากับการทำงาน runtime
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
  เปลี่ยนจากมุมมองตารางเป็นบรรทัดรายละเอียดต่อ Plugin พร้อม metadata ของ source/origin/version/activation
</ParamField>
<ParamField path="--json" type="boolean">
  inventory ที่อ่านได้โดยเครื่อง พร้อม diagnostics ของ registry และสถานะการติดตั้ง package dependency
</ParamField>

<Note>
`plugins list` อ่าน registry Plugin ภายในเครื่องที่บันทึกไว้ก่อน โดยมี fallback ที่ derive จาก manifest เท่านั้นเมื่อ registry หายไปหรือไม่ถูกต้อง คำสั่งนี้มีประโยชน์สำหรับตรวจสอบว่า Plugin ติดตั้งแล้ว เปิดใช้งานแล้ว และมองเห็นได้ในการวางแผน cold startup หรือไม่ แต่ไม่ใช่ live runtime probe ของกระบวนการ Gateway ที่กำลังทำงานอยู่ หลังจากเปลี่ยนโค้ด Plugin, enablement, hook policy หรือ `plugins.load.paths` ให้ restart Gateway ที่ให้บริการ channel ก่อนคาดหวังให้โค้ด `register(api)` หรือ hook ใหม่ทำงาน สำหรับ deployment ระยะไกล/container ให้ตรวจสอบว่าคุณกำลัง restart child `openclaw gateway run` จริง ไม่ใช่แค่กระบวนการ wrapper

`plugins list --json` รวม `dependencyStatus` ของแต่ละ Plugin จาก `package.json`
`dependencies` และ `optionalDependencies` OpenClaw ตรวจสอบว่าชื่อ package เหล่านั้นมีอยู่ตามพาธ lookup `node_modules` ปกติของ Node สำหรับ Plugin หรือไม่; จะไม่ import โค้ด runtime ของ Plugin, รัน package manager หรือซ่อม dependency ที่หายไป
</Note>

`plugins search` เป็นการค้นหา catalog ClawHub ระยะไกล คำสั่งนี้ไม่ตรวจสอบสถานะภายในเครื่อง ไม่แก้ไข config ไม่ติดตั้ง package และไม่โหลดโค้ด runtime ของ Plugin ผลการค้นหารวมชื่อ package ของ ClawHub, family, channel, version, summary และ hint การติดตั้ง เช่น `openclaw plugins install clawhub:<package>`

สำหรับงาน Plugin ที่ bundle มาแล้วภายใน Docker image แบบ packaged ให้ bind-mount ไดเรกทอรี source ของ Plugin ทับพาธ source แบบ packaged ที่ตรงกัน เช่น `/app/extensions/synology-chat` OpenClaw จะค้นพบ overlay source ที่ mount นั้นก่อน `/app/dist/extensions/synology-chat`; ไดเรกทอรี source ที่คัดลอกมาอย่างเดียวจะไม่ทำงาน เพื่อให้การติดตั้งแบบ packaged ปกติยังใช้ dist ที่ compile แล้ว

สำหรับการ debug runtime hook:

- `openclaw plugins inspect <id> --runtime --json` แสดง hook ที่ลงทะเบียนไว้และ diagnostics จากรอบการตรวจสอบที่โหลด module แล้ว Runtime inspection ไม่ติดตั้ง dependency ใด ๆ; ใช้ `openclaw doctor --fix` เพื่อล้างสถานะ dependency แบบ legacy หรือกู้คืน Plugin ที่ดาวน์โหลดได้ซึ่งหายไปและถูกอ้างอิงโดย config
- `openclaw gateway status --deep --require-rpc` ยืนยัน Gateway ที่เข้าถึงได้, hint ของ service/process, พาธ config และสุขภาพ RPC
- hook การสนทนาที่ไม่ได้ bundle มา (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) ต้องใช้ `plugins.entries.<id>.hooks.allowConversationAccess=true`

ใช้ `--link` เพื่อหลีกเลี่ยงการคัดลอกไดเรกทอรีภายในเครื่อง (เพิ่มเข้า `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` ไม่รองรับร่วมกับ `--link` เพราะการติดตั้งแบบ linked จะใช้พาธ source ซ้ำ แทนการคัดลอกทับ target การติดตั้งที่จัดการโดยระบบ

ใช้ `--pin` กับการติดตั้ง npm เพื่อบันทึก spec แบบ exact ที่ resolve แล้ว (`name@version`) ในดัชนี Plugin ที่จัดการโดยระบบ โดยยังคงพฤติกรรมเริ่มต้นแบบไม่ pin ไว้
</Note>

### ดัชนี Plugin

metadata การติดตั้ง Plugin เป็นสถานะที่เครื่องจัดการ ไม่ใช่ config ของผู้ใช้ การติดตั้งและการอัปเดตจะเขียนข้อมูลนี้ไปที่ `plugins/installs.json` ใต้ไดเรกทอรีสถานะ OpenClaw ที่ใช้งานอยู่ map ระดับบนสุด `installRecords` เป็นแหล่งข้อมูลถาวรของ metadata การติดตั้ง รวมถึง record สำหรับ manifest ของ Plugin ที่เสียหรือหายไป array `plugins` คือ cache ของ cold registry ที่ derive จาก manifest ไฟล์นี้มีคำเตือนห้ามแก้ไข และถูกใช้โดย `openclaw plugins update`, uninstall, diagnostics และ cold plugin registry

เมื่อ OpenClaw พบ record `plugins.installs` แบบ legacy ที่มาพร้อมระบบใน config จะย้าย record เหล่านั้นเข้าสู่ดัชนี Plugin และลบ key config นั้นออก; หากการเขียนอย่างใดอย่างหนึ่งล้มเหลว record ใน config จะถูกเก็บไว้เพื่อไม่ให้ metadata การติดตั้งสูญหาย

### ถอนการติดตั้ง

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` ลบ record ของ Plugin ออกจาก `plugins.entries`, ดัชนี Plugin ที่บันทึกไว้, รายการ allow/deny ของ Plugin และรายการ `plugins.load.paths` แบบ linked เมื่อเกี่ยวข้อง หากไม่ได้ตั้งค่า `--keep-files` การถอนการติดตั้งจะลบไดเรกทอรีติดตั้งแบบ managed ที่ติดตามไว้ด้วยเมื่ออยู่ภายในรูท extensions ของ Plugin ของ OpenClaw สำหรับ Plugin active memory slot หน่วยความจำจะ reset เป็น `memory-core`

<Note>
`--keep-config` รองรับเป็น alias ที่เลิกใช้แล้วของ `--keep-files`
</Note>

### อัปเดต

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

การอัปเดตใช้กับการติดตั้ง Plugin ที่ติดตามไว้ในดัชนี Plugin ที่จัดการโดยระบบ และการติดตั้ง hook-pack ที่ติดตามไว้ใน `hooks.internal.installs`

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    เมื่อคุณส่ง id ของ Plugin ให้ OpenClaw จะใช้ spec การติดตั้งที่บันทึกไว้สำหรับ Plugin นั้นซ้ำ ซึ่งหมายความว่า dist-tag ที่เก็บไว้ก่อนหน้า เช่น `@beta` และเวอร์ชัน exact ที่ pin ไว้ จะยังถูกใช้ต่อในการรัน `update <id>` ครั้งหลัง

    สำหรับการติดตั้ง npm คุณยังสามารถส่ง npm package spec แบบชัดเจนพร้อม dist-tag หรือเวอร์ชัน exact ได้ OpenClaw จะ resolve ชื่อ package นั้นกลับไปยัง record ของ Plugin ที่ติดตามไว้ อัปเดต Plugin ที่ติดตั้งนั้น และบันทึก npm spec ใหม่สำหรับการอัปเดตตาม id ในอนาคต

    การส่งชื่อ npm package โดยไม่มีเวอร์ชันหรือ tag จะ resolve กลับไปยัง record ของ Plugin ที่ติดตามไว้เช่นกัน ใช้วิธีนี้เมื่อ Plugin ถูก pin ไว้กับเวอร์ชัน exact และคุณต้องการย้ายกลับไปยัง release line เริ่มต้นของ registry

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` ใช้ spec ของ Plugin ที่ติดตามไว้ซ้ำ เว้นแต่คุณจะส่ง spec ใหม่ `openclaw update` ยังรู้จัก channel การอัปเดต OpenClaw ที่ใช้งานอยู่ด้วย: บน beta channel record ของ Plugin แบบ default-line npm และ ClawHub จะลอง `@beta` ก่อน จากนั้น fallback ไปยัง spec default/latest ที่บันทึกไว้หากไม่มี beta release ของ Plugin เวอร์ชัน exact และ tag ที่ระบุชัดเจนจะยัง pin อยู่กับ selector นั้น

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    ก่อนการอัปเดต npm แบบ live OpenClaw ตรวจสอบเวอร์ชัน package ที่ติดตั้งกับ metadata ของ npm registry หากเวอร์ชันที่ติดตั้งและ identity ของ artifact ที่บันทึกไว้ตรงกับ target ที่ resolve แล้ว การอัปเดตจะถูกข้ามโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน `openclaw.json` ใหม่

    เมื่อมี integrity hash ที่เก็บไว้และ hash ของ artifact ที่ fetch มาเปลี่ยน OpenClaw จะถือว่านั่นเป็น npm artifact drift คำสั่ง interactive `openclaw plugins update` จะพิมพ์ hash ที่คาดหวังและ hash จริง และขอการยืนยันก่อนดำเนินการต่อ helper การอัปเดตแบบ non-interactive จะ fail closed เว้นแต่ caller จะระบุ continuation policy อย่างชัดเจน

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` มีให้ใช้บน `plugins update` ด้วย เป็น override แบบ break-glass สำหรับ false positive ของการสแกน dangerous-code ในตัวระหว่างการอัปเดต Plugin แต่ยังไม่ bypass policy block ของ `before_install` ของ Plugin หรือการ block จาก scan-failure และใช้ได้เฉพาะกับการอัปเดต Plugin เท่านั้น ไม่ใช่การอัปเดต hook-pack
  </Accordion>
</AccordionGroup>

### ตรวจสอบ

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect แสดง identity, สถานะ load, source, ความสามารถของ manifest, flag ของ policy, diagnostics, metadata การติดตั้ง, ความสามารถของ bundle และการรองรับ MCP หรือ LSP server ที่ตรวจพบ โดยค่าเริ่มต้นจะไม่ import runtime ของ Plugin เพิ่ม `--runtime` เพื่อโหลด module ของ Plugin และรวม hook, tool, command, service, gateway method และ HTTP route ที่ลงทะเบียนไว้ Runtime inspection รายงาน dependency ของ Plugin ที่หายไปโดยตรง; การติดตั้งและการซ่อมแซมยังอยู่ใน `openclaw plugins install`, `openclaw plugins update` และ `openclaw doctor --fix`

คำสั่ง CLI ที่ Plugin เป็นเจ้าของจะถูกติดตั้งเป็นกลุ่มคำสั่ง root `openclaw` หลังจาก `inspect --runtime` แสดง command ใต้ `cliCommands` ให้รันเป็น `openclaw <command> ...`; ตัวอย่างเช่น Plugin ที่ลงทะเบียน `demo-git` สามารถตรวจสอบได้ด้วย `openclaw demo-git ping`

แต่ละ Plugin ถูกจัดประเภทตามสิ่งที่ลงทะเบียนจริงใน runtime:

- **plain-capability** — ความสามารถหนึ่งประเภท (เช่น Plugin ที่เป็น provider เท่านั้น)
- **hybrid-capability** — ความสามารถหลายประเภท (เช่น ข้อความ + คำพูด + รูปภาพ)
- **hook-only** — เฉพาะ hook ไม่มีความสามารถหรือ surface
- **non-capability** — tool/command/service แต่ไม่มีความสามารถ

ดู [รูปแบบของ Plugin](/th/plugins/architecture#plugin-shapes) สำหรับข้อมูลเพิ่มเติมเกี่ยวกับโมเดลความสามารถ

<Note>
flag `--json` แสดงรายงานที่อ่านได้โดยเครื่อง เหมาะสำหรับ scripting และ auditing `inspect --all` render ตารางทั้ง fleet พร้อมคอลัมน์ shape, ชนิดความสามารถ, compatibility notice, ความสามารถของ bundle และสรุป hook `info` เป็น alias ของ `inspect`
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` รายงาน error การ load Plugin, diagnostics ของ manifest/discovery และ compatibility notice เมื่อทุกอย่างสะอาด จะพิมพ์ `No plugin issues detected.`

หาก Plugin ที่กำหนดค่าไว้มีอยู่บนดิสก์แต่ถูก block โดยการตรวจ path-safety ของ loader การตรวจ config จะเก็บรายการ Plugin ไว้และรายงานเป็น `present but blocked` ให้แก้ diagnostics ของ Plugin ที่ถูก block ก่อนหน้า เช่น ownership ของพาธหรือ permission แบบ world-writable แทนการลบ config `plugins.entries.<id>` หรือ `plugins.allow`

สำหรับความล้มเหลวของ module-shape เช่น export `register`/`activate` ที่หายไป ให้รันซ้ำด้วย `OPENCLAW_PLUGIN_LOAD_DEBUG=1` เพื่อรวมสรุป export-shape แบบกระชับใน output diagnostics

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

รีจิสทรี Plugin ภายในเครื่องคือโมเดลอ่านแบบเย็นที่ OpenClaw บันทึกไว้ถาวรสำหรับข้อมูลระบุตัวตนของ Plugin ที่ติดตั้ง การเปิดใช้งาน เมทาดาทาแหล่งที่มา และความเป็นเจ้าของของส่วนสนับสนุน การเริ่มต้นปกติ การค้นหาเจ้าของผู้ให้บริการ การจัดประเภทการตั้งค่าช่องทาง และคลังรายการ Plugin สามารถอ่านข้อมูลนี้ได้โดยไม่ต้องนำเข้าโมดูลรันไทม์ของ Plugin

ใช้ `plugins registry` เพื่อตรวจสอบว่ารีจิสทรีที่บันทึกไว้ถาวรมีอยู่ เป็นปัจจุบัน หรือล้าสมัย ใช้ `--refresh` เพื่อสร้างใหม่จากดัชนี Plugin ที่บันทึกไว้ถาวร นโยบายการกำหนดค่า และเมทาดาทา manifest/package นี่คือเส้นทางการซ่อมแซม ไม่ใช่เส้นทางการเปิดใช้งานรันไทม์

`openclaw doctor --fix` ยังซ่อมแซมความคลาดเคลื่อนของ npm ที่จัดการไว้ซึ่งอยู่ใกล้กับรีจิสทรีด้วย: หากแพ็กเกจ `@openclaw/*` ที่กำพร้าหรือกู้คืนมาใต้ราก npm ของ Plugin ที่จัดการไว้บดบัง Plugin ที่มาพร้อมระบบ doctor จะลบแพ็กเกจเก่านั้นและสร้างรีจิสทรีใหม่ เพื่อให้การเริ่มต้นตรวจสอบกับ manifest ที่มาพร้อมระบบ

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` เป็นสวิตช์ความเข้ากันได้แบบใช้ยามฉุกเฉินที่เลิกใช้แล้วสำหรับความล้มเหลวในการอ่านรีจิสทรี ให้ใช้ `plugins registry --refresh` หรือ `openclaw doctor --fix` แทน; ทางเลือกสำรองผ่าน env มีไว้สำหรับการกู้คืนการเริ่มต้นในกรณีฉุกเฉินเท่านั้น ระหว่างที่การย้ายระบบกำลังทยอยเปิดใช้
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

รายการ Marketplace รับพาธ Marketplace ภายในเครื่อง, พาธ `marketplace.json`, ชวเลข GitHub เช่น `owner/repo`, URL รีโป GitHub หรือ URL git ได้ `--json` จะพิมพ์ป้ายกำกับแหล่งที่มาที่แก้ไขแล้ว พร้อม manifest ของ Marketplace ที่แยกวิเคราะห์แล้วและรายการ Plugin

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Plugin ชุมชน](/th/plugins/community)
