---
read_when:
    - การใช้หรือกำหนดค่าคำสั่งแชท
    - การดีบักการกำหนดเส้นทางคำสั่งหรือสิทธิ์
sidebarTitle: Slash commands
summary: 'คำสั่งแบบสแลช: ข้อความเทียบกับแบบเนทีฟ การกำหนดค่า และคำสั่งที่รองรับ'
title: คำสั่งแบบสแลช
x-i18n:
    generated_at: "2026-05-11T20:40:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a9030d88abd04c395369f8f6587632b53f3249ea95a26726fb1f165dae2d0f6
    source_path: tools/slash-commands.md
    workflow: 16
---

คำสั่งถูกจัดการโดย Gateway คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความแบบ **เดี่ยว** ที่ขึ้นต้นด้วย `/` คำสั่งแชต bash สำหรับโฮสต์เท่านั้นใช้ `! <cmd>` (โดยมี `/bash <cmd>` เป็นนามแฝง)

เมื่อการสนทนาหรือเธรดผูกกับเซสชัน ACP แล้ว ข้อความติดตามผลปกติจะถูกส่งไปยัง harness ของ ACP นั้น คำสั่งจัดการ Gateway ยังคงอยู่ภายในเครื่อง: `/acp ...` จะไปถึงตัวจัดการคำสั่ง ACP ของ OpenClaw เสมอ และ `/status` รวมถึง `/unfocus` จะยังอยู่ภายในเครื่องเมื่อใดก็ตามที่เปิดใช้งานการจัดการคำสั่งสำหรับพื้นผิวนั้น

มีระบบที่เกี่ยวข้องกันสองระบบ:

<AccordionGroup>
  <Accordion title="คำสั่ง">
    ข้อความ `/...` แบบเดี่ยว
  </Accordion>
  <Accordion title="ไดเรกทีฟ">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - ไดเรกทีฟจะถูกตัดออกจากข้อความก่อนที่โมเดลจะเห็น
    - ในข้อความแชตปกติ (ไม่ใช่ข้อความที่มีเฉพาะไดเรกทีฟ) ไดเรกทีฟจะถูกปฏิบัติเป็น "คำใบ้แบบอินไลน์" และจะ **ไม่** คงค่าการตั้งค่าเซสชันไว้
    - ในข้อความที่มีเฉพาะไดเรกทีฟ (ข้อความมีเฉพาะไดเรกทีฟเท่านั้น) ไดเรกทีฟจะคงอยู่ในเซสชันและตอบกลับด้วยการยืนยัน
    - ไดเรกทีฟจะถูกใช้กับ **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น หากตั้งค่า `commands.allowFrom` ไว้ ค่านี้จะเป็น allowlist เดียวที่ใช้ มิฉะนั้นการอนุญาตจะมาจาก allowlist/การจับคู่ของช่องทางรวมกับ `commands.useAccessGroups` ผู้ส่งที่ไม่ได้รับอนุญาตจะเห็นไดเรกทีฟถูกปฏิบัติเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="ทางลัดแบบอินไลน์">
    เฉพาะผู้ส่งที่อยู่ใน allowlist/ได้รับอนุญาตเท่านั้น: `/help`, `/commands`, `/status`, `/whoami` (`/id`)

    คำสั่งเหล่านี้จะทำงานทันที ถูกตัดออกก่อนที่โมเดลจะเห็นข้อความ และข้อความที่เหลือจะดำเนินต่อผ่าน flow ปกติ

  </Accordion>
</AccordionGroup>

## การกำหนดค่า

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<ParamField path="commands.text" type="boolean" default="true">
  เปิดใช้งานการแยกวิเคราะห์ `/...` ในข้อความแชต บนพื้นผิวที่ไม่มีคำสั่งแบบ native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) คำสั่งข้อความยังคงทำงานแม้ว่าคุณจะตั้งค่านี้เป็น `false`
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่งแบบ native อัตโนมัติ: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (จนกว่าคุณจะเพิ่ม slash commands); ถูกละเว้นสำหรับ provider ที่ไม่รองรับแบบ native ตั้งค่า `channels.discord.commands.native`, `channels.telegram.commands.native` หรือ `channels.slack.commands.native` เพื่อแทนที่เป็นราย provider (bool หรือ `"auto"`) บน Discord, `false` จะข้ามการลงทะเบียน slash-command และการล้างข้อมูลระหว่างเริ่มต้น คำสั่งที่เคยลงทะเบียนไว้อาจยังมองเห็นได้จนกว่าคุณจะลบออกจากแอป Discord คำสั่ง Slack จัดการในแอป Slack และจะไม่ถูกลบโดยอัตโนมัติ
</ParamField>
บน Discord ข้อกำหนดคำสั่งแบบ native อาจมี `descriptionLocalizations` ซึ่ง OpenClaw เผยแพร่เป็น `description_localizations` ของ Discord และรวมไว้ในการเปรียบเทียบการกระทบยอด
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่ง **skill** แบบ native เมื่อรองรับ อัตโนมัติ: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (Slack ต้องสร้าง slash command ต่อหนึ่ง skill) ตั้งค่า `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` หรือ `channels.slack.commands.nativeSkills` เพื่อแทนที่เป็นราย provider (bool หรือ `"auto"`)
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  เปิดใช้งาน `! <cmd>` เพื่อรันคำสั่ง shell ของโฮสต์ (`/bash <cmd>` เป็นนามแฝง; ต้องใช้ allowlist ของ `tools.elevated`)
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  ควบคุมระยะเวลาที่ bash รอก่อนสลับเป็นโหมดเบื้องหลัง (`0` จะย้ายไปเบื้องหลังทันที)
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  เปิดใช้งาน `/config` (อ่าน/เขียน `openclaw.json`)
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  เปิดใช้งาน `/mcp` (อ่าน/เขียนการกำหนดค่า MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`)
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  เปิดใช้งาน `/plugins` (การค้นหา/สถานะ Plugin รวมถึงการติดตั้งและการควบคุมเปิด/ปิดใช้งาน)
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  เปิดใช้งาน `/debug` (การแทนที่เฉพาะ runtime)
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  เปิดใช้งาน `/restart` รวมถึงการดำเนินการของเครื่องมือรีสตาร์ต gateway
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  ตั้งค่า allowlist เจ้าของแบบชัดเจนสำหรับพื้นผิวคำสั่ง/เครื่องมือที่ใช้ได้เฉพาะเจ้าของ นี่คือบัญชีผู้ปฏิบัติงานมนุษย์ที่สามารถอนุมัติการดำเนินการอันตรายและรันคำสั่ง เช่น `/diagnostics`, `/export-trajectory` และ `/config` โดยแยกจาก `commands.allowFrom` และการเข้าถึงการจับคู่ DM
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  รายช่องทาง: ทำให้คำสั่งที่ใช้ได้เฉพาะเจ้าของต้องใช้ **ตัวตนเจ้าของ** เพื่อรันบนพื้นผิวนั้น เมื่อเป็น `true` ผู้ส่งต้องตรงกับผู้สมัครเจ้าของที่ resolve แล้ว (ตัวอย่างเช่น รายการใน `commands.ownerAllowFrom` หรือ metadata เจ้าของแบบ native ของ provider) หรือมี scope ภายใน `operator.admin` บนช่องทางข้อความภายใน รายการ wildcard ใน `allowFrom` ของช่องทาง หรือรายการผู้สมัครเจ้าของที่ว่าง/resolve ไม่ได้ **ไม่** เพียงพอ คำสั่งที่ใช้ได้เฉพาะเจ้าของจะ fail closed บนช่องทางนั้น ปล่อยค่านี้ไว้ปิดหากคุณต้องการให้คำสั่งที่ใช้ได้เฉพาะเจ้าของถูกควบคุมด้วย `ownerAllowFrom` และ allowlist คำสั่งมาตรฐานเท่านั้น
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  ควบคุมว่า id เจ้าของปรากฏอย่างไรใน system prompt
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  ตั้งค่า HMAC secret ที่ใช้เมื่อ `commands.ownerDisplay="hash"` ได้ตามต้องการ
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  allowlist ราย provider สำหรับการอนุญาตคำสั่ง เมื่อตั้งค่าแล้ว ค่านี้จะเป็นแหล่งอนุญาตเดียวสำหรับคำสั่งและไดเรกทีฟ (allowlist/การจับคู่ของช่องทางและ `commands.useAccessGroups` จะถูกละเว้น) ใช้ `"*"` สำหรับค่าเริ่มต้นส่วนกลาง; คีย์เฉพาะ provider จะแทนที่ค่านั้น
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  บังคับใช้ allowlist/นโยบายสำหรับคำสั่งเมื่อไม่ได้ตั้งค่า `commands.allowFrom`
</ParamField>

## รายการคำสั่ง

แหล่งความจริงปัจจุบัน:

- built-in หลักมาจาก `src/auto-reply/commands-registry.shared.ts`
- คำสั่ง dock ที่สร้างขึ้นมาจาก `src/auto-reply/commands-registry.data.ts`
- คำสั่ง Plugin มาจากการเรียก `registerCommand()` ของ Plugin
- ความพร้อมใช้งานจริงบน gateway ของคุณยังขึ้นอยู่กับ flag การกำหนดค่า พื้นผิวช่องทาง และ Plugin ที่ติดตั้ง/เปิดใช้งาน

### คำสั่ง built-in หลัก

<AccordionGroup>
  <Accordion title="เซสชันและการรัน">
    - `/new [model]` เริ่มเซสชันใหม่; `/reset` เป็นนามแฝงสำหรับการรีเซ็ต
    - Control UI จะดักจับ `/new` ที่พิมพ์เพื่อสร้างและสลับไปยังเซสชันแดชบอร์ดใหม่ ยกเว้นเมื่อกำหนดค่า `session.dmScope: "main"` และ parent ปัจจุบันเป็นเซสชันหลักของ agent ในกรณีนั้น `/new` จะรีเซ็ตเซสชันหลักในตำแหน่งเดิม `/reset` ที่พิมพ์ยังคงรันการรีเซ็ตในตำแหน่งเดิมของ Gateway
    - `/reset soft [message]` เก็บ transcript ปัจจุบันไว้ ลบ id เซสชัน backend ของ CLI ที่นำกลับมาใช้ซ้ำ และรันการโหลด startup/system-prompt ใหม่ในตำแหน่งเดิม
    - `/compact [instructions]` ทำ Compaction ให้บริบทของเซสชัน ดู [Compaction](/th/concepts/compaction)
    - `/stop` ยกเลิกการรันปัจจุบัน
    - `/session idle <duration|off>` และ `/session max-age <duration|off>` จัดการการหมดอายุของการผูกเธรด
    - `/export-session [path]` ส่งออกเซสชันปัจจุบันเป็น HTML นามแฝง: `/export`
    - `/export-trajectory [path]` ขอการอนุมัติ exec จากนั้นส่งออก [trajectory bundle](/th/tools/trajectory) แบบ JSONL สำหรับเซสชันปัจจุบัน ใช้เมื่อคุณต้องการ timeline ของ prompt, tool และ transcript สำหรับเซสชัน OpenClaw หนึ่งเซสชัน ในแชตกลุ่ม prompt การอนุมัติและผลการส่งออกจะส่งถึงเจ้าของแบบส่วนตัว นามแฝง: `/trajectory`

  </Accordion>
  <Accordion title="การควบคุมโมเดลและการรัน">
    - `/think <level|default>` ตั้งค่าระดับการคิดหรือล้างการแทนที่ของเซสชัน ตัวเลือกมาจากโปรไฟล์ provider ของโมเดลที่ใช้งานอยู่; ระดับทั่วไปคือ `off`, `minimal`, `low`, `medium` และ `high` โดยมีระดับกำหนดเอง เช่น `xhigh`, `adaptive`, `max` หรือแบบไบนารี `on` เฉพาะที่รองรับเท่านั้น นามแฝง: `/thinking`, `/t`
    - `/verbose on|off|full` สลับเอาต์พุต verbose นามแฝง: `/v`
    - `/trace on|off` สลับเอาต์พุต trace ของ Plugin สำหรับเซสชันปัจจุบัน
    - `/fast [status|on|off|default]` แสดง ตั้งค่า หรือล้างโหมดเร็ว
    - `/reasoning [on|off|stream]` สลับการมองเห็น reasoning นามแฝง: `/reason`
    - `/elevated [on|off|ask|full]` สลับโหมด elevated นามแฝง: `/elev`
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` แสดงหรือตั้งค่า exec เริ่มต้น
    - `/model [name|#|status]` แสดงหรือตั้งค่าโมเดล
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` แสดง provider ที่กำหนดค่า/มี auth พร้อมใช้งาน หรือโมเดลสำหรับ provider; เพิ่ม `all` เพื่อเรียกดู catalog ทั้งหมดของ provider นั้น รายการ `provider/*` ใน `agents.defaults.models` ทำให้ `/model` และ `/models` แสดงเฉพาะโมเดลที่ค้นพบสำหรับ provider เหล่านั้น
    - `/queue <mode>` จัดการพฤติกรรมคิว (`steer`, `queue` แบบเดิม, `followup`, `collect`, `steer-backlog`, `interrupt`) รวมถึงตัวเลือกอย่าง `debounce:0.5s cap:25 drop:summarize`; `/queue default` หรือ `/queue reset` จะล้างการแทนที่ของเซสชัน ดู [คิวคำสั่ง](/th/concepts/queue) และ [คิว Steering](/th/concepts/queue-steering)
    - `/steer <message>` ฉีดคำแนะนำเข้าไปในการรันที่ใช้งานอยู่สำหรับเซสชันปัจจุบัน โดยไม่ขึ้นกับโหมด `/queue` จะไม่เริ่มการรันใหม่เมื่อเซสชันว่างอยู่ นามแฝง: `/tell` ดู [Steer](/th/tools/steer)

  </Accordion>
  <Accordion title="การค้นพบและสถานะ">
    - `/help` แสดงสรุปความช่วยเหลือแบบสั้น
    - `/commands` แสดง catalog คำสั่งที่สร้างขึ้น
    - `/tools [compact|verbose]` แสดงสิ่งที่ agent ปัจจุบันสามารถใช้ได้ในตอนนี้
    - `/status` แสดงสถานะการดำเนินการ/runtime, uptime ของ Gateway และระบบ รวมถึงการใช้งาน/quota ของ provider เมื่อพร้อมใช้งาน
    - `/diagnostics [note]` เป็น flow รายงานสนับสนุนที่ใช้ได้เฉพาะเจ้าของสำหรับบั๊ก Gateway และการรัน harness ของ Codex โดยจะขอการอนุมัติ exec อย่างชัดเจนทุกครั้งก่อนรัน `openclaw gateway diagnostics export --json`; อย่าอนุมัติ diagnostics ด้วยกฎ allow-all หลังอนุมัติแล้ว จะส่งรายงานที่วางต่อได้พร้อม path bundle ภายในเครื่อง สรุป manifest หมายเหตุความเป็นส่วนตัว และ id เซสชันที่เกี่ยวข้อง ในแชตกลุ่ม prompt การอนุมัติและรายงานจะส่งถึงเจ้าของแบบส่วนตัว เมื่อเซสชันที่ใช้งานอยู่ใช้ harness ของ OpenAI Codex การอนุมัติเดียวกันจะส่ง feedback ของ Codex ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย และคำตอบที่เสร็จสิ้นจะแสดงรายการ id เซสชัน OpenClaw, id เธรด Codex และคำสั่ง `codex resume <thread-id>` ดู [การส่งออก Diagnostics](/th/gateway/diagnostics)
    - `/crestodian <request>` รันตัวช่วยตั้งค่าและซ่อมแซม Crestodian จาก DM ของเจ้าของ
    - `/tasks` แสดงงานเบื้องหลังที่ใช้งานอยู่/ล่าสุดสำหรับเซสชันปัจจุบัน
    - `/context [list|detail|map|json]` อธิบายว่าบริบทถูกประกอบอย่างไร `map` จะส่งรูปภาพ treemap ของบริบทเซสชันปัจจุบัน
    - `/whoami` แสดง id ผู้ส่งของคุณ นามแฝง: `/id`
    - `/usage off|tokens|full|cost` ควบคุม footer การใช้งานรายคำตอบ หรือพิมพ์สรุปค่าใช้จ่ายภายในเครื่อง

  </Accordion>
  <Accordion title="Skills, รายการอนุญาต, การอนุมัติ">
    - `/skill <name> [input]` เรียกใช้ skill ตามชื่อ
    - `/allowlist [list|add|remove] ...` จัดการรายการอนุญาต แบบข้อความเท่านั้น
    - `/approve <id> <decision>` จัดการพรอมป์ขออนุมัติ exec
    - `/btw <question>` ถามคำถามแทรกโดยไม่เปลี่ยนบริบทเซสชันในอนาคต นามแฝง: `/side` ดู [BTW](/th/tools/btw)

  </Accordion>
  <Accordion title="sub-agent และ ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` จัดการการทำงานของ sub-agent สำหรับเซสชันปัจจุบัน
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` จัดการเซสชัน ACP และตัวเลือกรันไทม์
    - `/focus <target>` ผูกเธรด Discord หรือหัวข้อ/บทสนทนา Telegram ปัจจุบันกับเป้าหมายเซสชัน
    - `/unfocus` ลบการผูกปัจจุบัน
    - `/agents` แสดงรายการ agent ที่ผูกกับเธรดสำหรับเซสชันปัจจุบัน
    - `/kill <id|#|all>` ยกเลิก sub-agent ที่กำลังทำงานหนึ่งตัวหรือทั้งหมด
    - `/subagents steer <id|#> <message>` ส่งคำสั่งกำกับไปยัง sub-agent ที่กำลังทำงาน ดู [การกำกับ](/th/tools/steer)

  </Accordion>
  <Accordion title="การเขียนสำหรับเจ้าของเท่านั้นและผู้ดูแลระบบ">
    - `/config show|get|set|unset` อ่านหรือเขียน `openclaw.json` สำหรับเจ้าของเท่านั้น ต้องใช้ `commands.config: true`
    - `/mcp show|get|set|unset` อ่านหรือเขียนการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers` สำหรับเจ้าของเท่านั้น ต้องใช้ `commands.mcp: true`
    - `/plugins list|inspect|show|get|install|enable|disable` ตรวจสอบหรือเปลี่ยนสถานะ Plugin `/plugin` เป็นนามแฝง การเขียนสำหรับเจ้าของเท่านั้น ต้องใช้ `commands.plugins: true`
    - `/debug show|set|unset|reset` จัดการการแทนที่การกำหนดค่าเฉพาะรันไทม์ สำหรับเจ้าของเท่านั้น ต้องใช้ `commands.debug: true`
    - `/restart` รีสตาร์ต OpenClaw เมื่อเปิดใช้งาน ค่าเริ่มต้น: เปิดใช้งาน; ตั้ง `commands.restart: false` เพื่อปิดใช้งาน
    - `/send on|off|inherit` ตั้งค่านโยบายการส่ง สำหรับเจ้าของเท่านั้น

  </Accordion>
  <Accordion title="เสียง, TTS, การควบคุมช่องทาง">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` ควบคุม TTS ดู [TTS](/th/tools/tts)
    - `/activation mention|always` ตั้งค่าโหมดการเปิดใช้งานกลุ่ม
    - `/bash <command>` เรียกใช้คำสั่งเชลล์ของโฮสต์ แบบข้อความเท่านั้น นามแฝง: `! <command>` ต้องใช้ `commands.bash: true` และรายการอนุญาต `tools.elevated`
    - `!poll [sessionId]` ตรวจสอบงาน bash เบื้องหลัง
    - `!stop [sessionId]` หยุดงาน bash เบื้องหลัง

  </Accordion>
</AccordionGroup>

### คำสั่ง dock ที่สร้างขึ้น

คำสั่ง dock จะสลับเส้นทางการตอบกลับของเซสชันปัจจุบันไปยังช่องทางที่เชื่อมโยงอีกช่องทางหนึ่ง ดู [การ dock ช่องทาง](/th/concepts/channel-docking) สำหรับการตั้งค่า ตัวอย่าง และการแก้ไขปัญหา

คำสั่ง dock ถูกสร้างจาก Plugin ช่องทางที่รองรับคำสั่ง native ชุดที่รวมมาในปัจจุบัน:

- `/dock-discord` (นามแฝง: `/dock_discord`)
- `/dock-mattermost` (นามแฝง: `/dock_mattermost`)
- `/dock-slack` (นามแฝง: `/dock_slack`)
- `/dock-telegram` (นามแฝง: `/dock_telegram`)

ใช้คำสั่ง dock จากแชตโดยตรงเพื่อสลับเส้นทางการตอบกลับของเซสชันปัจจุบันไปยังช่องทางที่เชื่อมโยงอีกช่องทางหนึ่ง agent จะคงบริบทเซสชันเดิมไว้ แต่การตอบกลับในอนาคตสำหรับเซสชันนั้นจะถูกส่งไปยัง peer ของช่องทางที่เลือก

คำสั่ง dock ต้องใช้ `session.identityLinks` ผู้ส่งต้นทางและ peer เป้าหมายต้องอยู่ในกลุ่มตัวตนเดียวกัน เช่น `["telegram:123", "discord:456"]` หากผู้ใช้ Telegram ที่มี id `123` ส่ง `/dock_discord` OpenClaw จะจัดเก็บ `lastChannel: "discord"` และ `lastTo: "456"` ในเซสชันที่ใช้งานอยู่ หากผู้ส่งไม่ได้เชื่อมโยงกับ peer ของ Discord คำสั่งจะตอบกลับด้วยคำแนะนำการตั้งค่าแทนที่จะปล่อยผ่านไปยังแชตปกติ

การ dock จะเปลี่ยนเฉพาะเส้นทางเซสชันที่ใช้งานอยู่เท่านั้น ไม่ได้สร้างบัญชีช่องทาง ให้สิทธิ์การเข้าถึง ข้ามรายการอนุญาตของช่องทาง หรือย้ายประวัติ transcript ไปยังเซสชันอื่น ใช้ `/dock-telegram`, `/dock-slack`, `/dock-mattermost` หรือคำสั่ง dock ที่สร้างขึ้นคำสั่งอื่นเพื่อสลับเส้นทางอีกครั้ง

### คำสั่ง Plugin ที่รวมมา

Plugin ที่รวมมาสามารถเพิ่มคำสั่ง slash ได้อีก คำสั่งที่รวมมาในปัจจุบันใน repo นี้:

- `/dreaming [on|off|status|help]` สลับ memory dreaming ดู [Dreaming](/th/concepts/dreaming)
- `/pair [qr|status|pending|approve|cleanup|notify]` จัดการโฟลว์การจับคู่/ตั้งค่าอุปกรณ์ ดู [การจับคู่](/th/channels/pairing)
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` เปิดใช้งานคำสั่ง phone node ที่มีความเสี่ยงสูงชั่วคราว
- `/voice status|list [limit]|set <voiceId|name>` จัดการการกำหนดค่าเสียง Talk บน Discord ชื่อคำสั่ง native คือ `/talkvoice`
- `/card ...` ส่ง preset rich card ของ LINE ดู [LINE](/th/channels/line)
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` ตรวจสอบและควบคุม harness app-server Codex ที่รวมมา ดู [harness Codex](/th/plugins/codex-harness)
- คำสั่งเฉพาะ QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### คำสั่ง skill แบบไดนามิก

skill ที่ผู้ใช้เรียกใช้ได้จะแสดงเป็นคำสั่ง slash ด้วย:

- `/skill <name> [input]` ใช้งานได้เสมอในฐานะ entrypoint ทั่วไป
- skill อาจปรากฏเป็นคำสั่งโดยตรง เช่น `/prose` เมื่อ skill/Plugin ลงทะเบียนไว้
- การลงทะเบียนคำสั่ง skill แบบ native ถูกควบคุมโดย `commands.nativeSkills` และ `channels.<provider>.commands.nativeSkills`
- สเปกคำสั่งสามารถระบุ `descriptionLocalizations` สำหรับพื้นผิว native ที่รองรับคำอธิบายแบบแปลภาษา รวมถึง Discord

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับอาร์กิวเมนต์และ parser">
    - คำสั่งรองรับ `:` แบบไม่บังคับระหว่างคำสั่งกับ args (เช่น `/think: high`, `/send: on`, `/help:`)
    - `/new <model>` รับ alias ของโมเดล, `provider/model` หรือชื่อ provider (จับคู่แบบ fuzzy); หากไม่พบรายการที่ตรงกัน ข้อความจะถูกถือเป็นเนื้อหาข้อความ
    - สำหรับรายละเอียดการใช้งาน provider แบบเต็ม ให้ใช้ `openclaw status --usage`
    - `/allowlist add|remove` ต้องใช้ `commands.config=true` และเคารพ `configWrites` ของช่องทาง
    - ในช่องทางแบบหลายบัญชี `/allowlist --account <id>` ที่กำหนดเป้าหมายการกำหนดค่าและ `/config set channels.<provider>.accounts.<id>...` จะเคารพ `configWrites` ของบัญชีเป้าหมายด้วย
    - `/usage` ควบคุม footer การใช้งานต่อการตอบกลับ; `/usage cost` พิมพ์สรุปค่าใช้จ่ายแบบ local จากบันทึกเซสชัน OpenClaw
    - `/restart` เปิดใช้งานตามค่าเริ่มต้น; ตั้ง `commands.restart: false` เพื่อปิดใช้งาน
    - `/plugins install <spec>` รับสเปก Plugin เดียวกับ `openclaw plugins install`: path/archive แบบ local, แพ็กเกจ npm, `git:<repo>` หรือ `clawhub:<pkg>` แล้วขอให้รีสตาร์ต Gateway เพราะโมดูลซอร์สของ Plugin เปลี่ยนไป
    - `/plugins enable|disable` อัปเดตการกำหนดค่า Plugin และทริกเกอร์การโหลด Plugin ของ Gateway ใหม่สำหรับ agent turn ใหม่

  </Accordion>
  <Accordion title="พฤติกรรมเฉพาะช่องทาง">
    - คำสั่ง native เฉพาะ Discord: `/vc join|leave|status` ควบคุมช่องเสียง (ใช้เป็นข้อความไม่ได้) `join` ต้องมี guild และช่อง voice/stage ที่เลือก ต้องใช้ `channels.discord.voice` และคำสั่ง native
    - คำสั่งผูกเธรดของ Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) ต้องเปิดใช้งานการผูกเธรดที่มีผล (`session.threadBindings.enabled` และ/หรือ `channels.discord.threadBindings.enabled`)
    - อ้างอิงคำสั่ง ACP และพฤติกรรมรันไทม์: [agent ACP](/th/tools/acp-agents)

  </Accordion>
  <Accordion title="ความปลอดภัยของ verbose / trace / fast / reasoning">
    - `/verbose` มีไว้สำหรับการดีบักและการมองเห็นเพิ่มเติม; ให้ **ปิด** ไว้ในการใช้งานปกติ
    - `/trace` แคบกว่า `/verbose`: จะแสดงเฉพาะบรรทัด trace/debug ที่ Plugin เป็นเจ้าของ และปิดข้อความ tool verbose ปกติไว้
    - `/fast on|off` คงการแทนที่ของเซสชันไว้ ใช้ตัวเลือก `inherit` ใน UI เซสชันเพื่อล้างค่าและกลับไปใช้ค่าเริ่มต้นจากการกำหนดค่า
    - `/fast` ขึ้นกับ provider: OpenAI/OpenAI Codex จะแมปไปยัง `service_tier=priority` บน endpoint Responses แบบ native ขณะที่คำขอ Anthropic สาธารณะโดยตรง รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย OAuth ที่ส่งไปยัง `api.anthropic.com` จะแมปไปยัง `service_tier=auto` หรือ `standard_only` ดู [OpenAI](/th/providers/openai) และ [Anthropic](/th/providers/anthropic)
    - สรุปความล้มเหลวของ tool ยังคงแสดงเมื่อเกี่ยวข้อง แต่ข้อความความล้มเหลวโดยละเอียดจะถูกรวมไว้เฉพาะเมื่อ `/verbose` เป็น `on` หรือ `full`
    - `/reasoning`, `/verbose` และ `/trace` มีความเสี่ยงในการตั้งค่ากลุ่ม: อาจเปิดเผย reasoning ภายใน, เอาต์พุตของ tool หรือ diagnostics ของ Plugin ที่คุณไม่ได้ตั้งใจเปิดเผย แนะนำให้ปิดไว้ โดยเฉพาะในแชตกลุ่ม

  </Accordion>
  <Accordion title="การสลับโมเดล">
    - `/model` คงโมเดลเซสชันใหม่ไว้ทันที
    - หาก agent ว่าง การทำงานถัดไปจะใช้โมเดลนั้นทันที
    - หากมีการทำงานที่กำลังใช้งานอยู่ OpenClaw จะทำเครื่องหมายการสลับแบบ live เป็น pending และจะรีสตาร์ตเข้าสู่โมเดลใหม่เฉพาะที่จุด retry ที่สะอาด
    - หากกิจกรรม tool หรือเอาต์พุตการตอบกลับเริ่มไปแล้ว การสลับที่ pending อาจค้างอยู่ในคิวจนกว่าจะมีโอกาส retry ในภายหลังหรือ user turn ถัดไป
    - ใน TUI แบบ local, `/crestodian [request]` จะกลับจาก TUI ของ agent ปกติไปยัง Crestodian สิ่งนี้แยกจากโหมดช่วยเหลือของช่องทางข้อความ และไม่ได้ให้สิทธิ์การกำหนดค่าระยะไกล

  </Accordion>
  <Accordion title="fast path และ shortcut แบบ inline">
    - **fast path:** ข้อความที่มีเฉพาะคำสั่งจากผู้ส่งในรายการอนุญาตจะถูกจัดการทันที (ข้ามคิว + โมเดล)
    - **การ gating ด้วยการ mention ในกลุ่ม:** ข้อความที่มีเฉพาะคำสั่งจากผู้ส่งในรายการอนุญาตจะข้ามข้อกำหนดการ mention
    - **shortcut แบบ inline (เฉพาะผู้ส่งในรายการอนุญาต):** คำสั่งบางคำสั่งใช้งานได้เมื่อฝังอยู่ในข้อความปกติ และจะถูกตัดออกก่อนที่โมเดลจะเห็นข้อความที่เหลือ
      - ตัวอย่าง: `hey /status` ทริกเกอร์การตอบกลับสถานะ และข้อความที่เหลือจะดำเนินต่อผ่านโฟลว์ปกติ
    - ปัจจุบัน: `/help`, `/commands`, `/status`, `/whoami` (`/id`)
    - ข้อความที่มีเฉพาะคำสั่งจากผู้ที่ไม่ได้รับอนุญาตจะถูกละเว้นอย่างเงียบ ๆ และ token `/...` แบบ inline จะถูกถือเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="คำสั่ง skill และอาร์กิวเมนต์ native">
    - **คำสั่ง skill:** skill แบบ `user-invocable` จะแสดงเป็นคำสั่ง slash ชื่อจะถูก sanitize เป็น `a-z0-9_` (สูงสุด 32 อักขระ); หากชนกันจะได้ suffix เป็นตัวเลข (เช่น `_2`)
      - `/skill <name> [input]` เรียกใช้ skill ตามชื่อ (มีประโยชน์เมื่อข้อจำกัดคำสั่ง native ทำให้สร้างคำสั่งต่อ skill ไม่ได้)
      - โดยค่าเริ่มต้น คำสั่ง skill จะถูกส่งต่อไปยังโมเดลเป็นคำขอปกติ
      - Skills อาจประกาศ `command-dispatch: tool` เพื่อ route คำสั่งไปยัง tool โดยตรงได้ (กำหนดผลแน่นอน, ไม่มีโมเดล)
      - ตัวอย่าง: `/prose` (Plugin OpenProse) — ดู [OpenProse](/th/prose)
    - **อาร์กิวเมนต์คำสั่ง native:** Discord ใช้ autocomplete สำหรับตัวเลือกแบบไดนามิก (และเมนูปุ่มเมื่อคุณละเว้น args ที่จำเป็น) Telegram และ Slack แสดงเมนูปุ่มเมื่อคำสั่งรองรับตัวเลือกและคุณละเว้น arg ตัวเลือกแบบไดนามิกจะถูก resolve ตามโมเดลเซสชันเป้าหมาย ดังนั้นตัวเลือกเฉพาะโมเดล เช่น ระดับ `/think` จะตามการแทนที่ `/model` ของเซสชันนั้น

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` ตอบคำถามด้านรันไทม์ ไม่ใช่คำถามด้านการกำหนดค่า: **agent นี้ใช้อะไรได้ตอนนี้ในบทสนทนานี้**

- `/tools` ค่าเริ่มต้นจะกระชับและปรับให้เหมาะกับการสแกนอย่างรวดเร็ว
- `/tools verbose` เพิ่มคำอธิบายสั้น ๆ
- พื้นผิวคำสั่ง native ที่รองรับอาร์กิวเมนต์จะแสดงสวิตช์โหมดเดียวกันเป็น `compact|verbose`
- ผลลัพธ์ผูกกับเซสชัน ดังนั้นการเปลี่ยน agent, ช่องทาง, เธรด, การอนุญาตผู้ส่ง หรือโมเดล อาจเปลี่ยนเอาต์พุตได้
- `/tools` รวม tool ที่เข้าถึงได้จริงในรันไทม์ รวมถึง tool หลัก, tool จาก Plugin ที่เชื่อมต่อ และ tool ที่ช่องทางเป็นเจ้าของ

สำหรับการแก้ไขโปรไฟล์และการแทนที่ ให้ใช้แผง Tools ใน Control UI หรือพื้นผิว config/catalog แทนการถือว่า `/tools` เป็น catalog แบบคงที่

## พื้นผิวการใช้งาน (สิ่งที่แสดงที่ไหน)

- **การใช้งาน/โควตาของผู้ให้บริการ** (ตัวอย่าง: "Claude เหลือ 80%") จะแสดงใน `/status` สำหรับผู้ให้บริการโมเดลปัจจุบันเมื่อเปิดใช้การติดตามการใช้งาน OpenClaw ปรับหน้าต่างของผู้ให้บริการให้เป็น `% ที่เหลือ`; สำหรับ MiniMax ฟิลด์เปอร์เซ็นต์แบบเหลือเท่านั้นจะถูกกลับค่าก่อนแสดงผล และการตอบกลับ `model_remains` จะให้ความสำคัญกับรายการโมเดลแชตพร้อมป้ายกำกับแผนที่ติดแท็กโมเดล
- **บรรทัดโทเค็น/แคช** ใน `/status` สามารถ fallback ไปยังรายการการใช้งาน transcript ล่าสุดได้เมื่อสแนปช็อตเซสชันสดมีข้อมูลน้อย ค่าสดที่ไม่เป็นศูนย์ที่มีอยู่ยังคงมีสิทธิ์เหนือกว่า และ transcript fallback ยังสามารถกู้คืนป้ายกำกับโมเดล runtime ที่ใช้งานอยู่พร้อมยอดรวมที่เน้นพรอมป์ซึ่งใหญ่กว่าเมื่อยอดรวมที่จัดเก็บไว้หายไปหรือเล็กกว่า
- **การดำเนินการเทียบกับ runtime:** `/status` รายงาน `Execution` สำหรับเส้นทาง sandbox ที่มีผล และ `Runtime` สำหรับผู้ที่กำลังรันเซสชันจริง: `OpenClaw Pi Default`, `OpenAI Codex`, แบ็กเอนด์ CLI หรือแบ็กเอนด์ ACP
- **โทเค็น/ค่าใช้จ่ายต่อการตอบกลับ** ควบคุมด้วย `/usage off|tokens|full` (ต่อท้ายคำตอบปกติ)
- `/model status` เกี่ยวกับ **โมเดล/การยืนยันตัวตน/endpoint** ไม่ใช่การใช้งาน

## การเลือกโมเดล (`/model`)

`/model` ถูกนำไปใช้เป็น directive

ตัวอย่าง:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

หมายเหตุ:

- `/model` และ `/model list` แสดงตัวเลือกแบบย่อที่มีหมายเลข (ตระกูลโมเดล + ผู้ให้บริการที่ใช้ได้)
- บน Discord, `/model` และ `/models` เปิดตัวเลือกแบบโต้ตอบที่มีดรอปดาวน์ผู้ให้บริการและโมเดล พร้อมขั้นตอน Submit ตัวเลือกนี้เคารพ `agents.defaults.models` รวมถึงรายการ `provider/*` ดังนั้นการค้นหาแบบจำกัดขอบเขตตามผู้ให้บริการจึงช่วยให้ตัวเลือกอยู่ต่ำกว่าขีดจำกัดคอมโพเนนต์ 25 ตัวเลือกของ Discord ได้
- `/model <#>` เลือกจากตัวเลือกนั้น (และจะเลือกผู้ให้บริการปัจจุบันก่อนเมื่อเป็นไปได้)
- `/model status` แสดงมุมมองรายละเอียด รวมถึง endpoint ผู้ให้บริการที่กำหนดค่าไว้ (`baseUrl`) และโหมด API (`api`) เมื่อมี

## การ override สำหรับดีบัก

`/debug` ให้คุณตั้งค่า override คอนฟิกแบบ **เฉพาะ runtime** (ในหน่วยความจำ ไม่ใช่ดิสก์) เฉพาะเจ้าของเท่านั้น ปิดใช้งานโดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.debug: true`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Override จะมีผลทันทีกับการอ่านคอนฟิกใหม่ แต่จะ **ไม่** เขียนลง `openclaw.json` ใช้ `/debug reset` เพื่อล้าง override ทั้งหมดและกลับไปใช้คอนฟิกบนดิสก์
</Note>

## เอาต์พุตการติดตาม Plugin

`/trace` ให้คุณสลับ **บรรทัด trace/debug ของ Plugin ที่จำกัดขอบเขตตามเซสชัน** โดยไม่ต้องเปิดโหมด verbose เต็มรูปแบบ

ตัวอย่าง:

```text
/trace
/trace on
/trace off
```

หมายเหตุ:

- `/trace` ที่ไม่มีอาร์กิวเมนต์จะแสดงสถานะ trace ของเซสชันปัจจุบัน
- `/trace on` เปิดใช้บรรทัด trace ของ Plugin สำหรับเซสชันปัจจุบัน
- `/trace off` ปิดใช้งานอีกครั้ง
- บรรทัด trace ของ Plugin อาจปรากฏใน `/status` และเป็นข้อความวินิจฉัยติดตามผลหลังคำตอบผู้ช่วยปกติ
- `/trace` ไม่ได้แทนที่ `/debug`; `/debug` ยังคงจัดการ override คอนฟิกแบบเฉพาะ runtime
- `/trace` ไม่ได้แทนที่ `/verbose`; เอาต์พุตเครื่องมือ/สถานะ verbose ปกติยังคงเป็นของ `/verbose`

## การอัปเดตคอนฟิก

`/config` เขียนไปยังคอนฟิกบนดิสก์ของคุณ (`openclaw.json`) เฉพาะเจ้าของเท่านั้น ปิดใช้งานโดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.config: true`

ตัวอย่าง:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
คอนฟิกจะถูกตรวจสอบก่อนเขียน; การเปลี่ยนแปลงที่ไม่ถูกต้องจะถูกปฏิเสธ การอัปเดต `/config` จะคงอยู่ข้ามการรีสตาร์ท
</Note>

## การอัปเดต MCP

`/mcp` เขียนนิยามเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการไว้ใต้ `mcp.servers` เฉพาะเจ้าของเท่านั้น ปิดใช้งานโดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.mcp: true`

ตัวอย่าง:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` จัดเก็บคอนฟิกในคอนฟิก OpenClaw ไม่ใช่การตั้งค่าโปรเจกต์ที่ Pi เป็นเจ้าของ อะแดปเตอร์ runtime จะตัดสินใจว่า transport ใดรันได้จริง
</Note>

## การอัปเดต Plugin

`/plugins` ให้ผู้ปฏิบัติการตรวจสอบ Plugin ที่ค้นพบและสลับการเปิดใช้งานในคอนฟิก โฟลว์แบบอ่านอย่างเดียวสามารถใช้ `/plugin` เป็น alias ได้ ปิดใช้งานโดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.plugins: true`

ตัวอย่าง:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` และ `/plugins show` ใช้การค้นหา Plugin จริงกับ workspace ปัจจุบันพร้อมคอนฟิกบนดิสก์
- `/plugins install` ติดตั้งจาก ClawHub, npm, git, ไดเรกทอรีในเครื่อง และไฟล์ archive
- `/plugins enable|disable` อัปเดตเฉพาะคอนฟิก Plugin; ไม่ได้ติดตั้งหรือถอนการติดตั้ง Plugin
- การเปลี่ยนแปลงการเปิดใช้และปิดใช้จะ hot-reload พื้นผิว runtime ของ Plugin ของ Gateway สำหรับรอบใหม่ของ agent; การติดตั้งจะร้องขอการรีสตาร์ท Gateway เพราะโมดูลซอร์สของ Plugin เปลี่ยนไป

</Note>

## หมายเหตุเกี่ยวกับพื้นผิว

<AccordionGroup>
  <Accordion title="Sessions per surface">
    - **คำสั่งข้อความ** รันในเซสชันแชตปกติ (DM ใช้ `main` ร่วมกัน กลุ่มมีเซสชันของตนเอง)
    - **คำสั่งเนทีฟ** ใช้เซสชันแยก:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (คำนำหน้ากำหนดค่าได้ผ่าน `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (ชี้ไปยังเซสชันแชตผ่าน `CommandTargetSessionKey`)
    - **`/stop`** ชี้ไปยังเซสชันแชตที่ใช้งานอยู่เพื่อให้ยกเลิกการรันปัจจุบันได้

  </Accordion>
  <Accordion title="Slack specifics">
    `channels.slack.slashCommand` ยังคงรองรับสำหรับคำสั่งเดียวสไตล์ `/openclaw` หากคุณเปิดใช้ `commands.native` คุณต้องสร้างคำสั่ง slash ของ Slack หนึ่งรายการต่อคำสั่งในตัวแต่ละคำสั่ง (ชื่อเดียวกับ `/help`) เมนูอาร์กิวเมนต์คำสั่งสำหรับ Slack จะถูกส่งเป็นปุ่ม Block Kit แบบ ephemeral

    ข้อยกเว้นสำหรับ Slack native: ลงทะเบียน `/agentstatus` (ไม่ใช่ `/status`) เพราะ Slack สงวน `/status` ไว้ ข้อความ `/status` ยังคงทำงานในข้อความ Slack

  </Accordion>
</AccordionGroup>

## คำถามข้างเคียง BTW

`/btw` คือ **คำถามข้างเคียง** แบบรวดเร็วเกี่ยวกับเซสชันปัจจุบัน `/side` เป็น alias

ต่างจากแชตปกติ:

- ใช้เซสชันปัจจุบันเป็นบริบทเบื้องหลัง
- ในเซสชัน Codex harness จะรันเป็นเธรดข้างเคียง Codex แบบ ephemeral ด้วย
  สิทธิ์ Codex ปัจจุบันและพื้นผิวเครื่องมือเนทีฟ
- ในเซสชันที่ไม่ใช่ Codex จะคงพฤติกรรมการเรียกข้างเคียงแบบ one-shot โดยตรงแบบเดิม
- ไม่เปลี่ยนบริบทเซสชันในอนาคต
- ไม่ถูกเขียนลงประวัติ transcript
- ถูกส่งเป็นผลลัพธ์ข้างเคียงแบบสดแทนข้อความผู้ช่วยปกติ

สิ่งนี้ทำให้ `/btw` มีประโยชน์เมื่อคุณต้องการคำชี้แจงชั่วคราวในขณะที่งานหลักยังดำเนินต่อไป

ตัวอย่าง:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

ดู [คำถามข้างเคียง BTW](/th/tools/btw) สำหรับพฤติกรรมฉบับเต็มและรายละเอียด UX ของไคลเอนต์

## ที่เกี่ยวข้อง

- [การสร้าง Skills](/th/tools/creating-skills)
- [Skills](/th/tools/skills)
- [คอนฟิก Skills](/th/tools/skills-config)
