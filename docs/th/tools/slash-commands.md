---
read_when:
    - การใช้หรือกำหนดค่าคำสั่งแชต
    - การดีบักการกำหนดเส้นทางคำสั่งหรือสิทธิ์
sidebarTitle: Slash commands
summary: 'คำสั่งสแลช: ข้อความเทียบกับแบบเนทีฟ, การกำหนดค่า และคำสั่งที่รองรับ'
title: คำสั่งสแลช
x-i18n:
    generated_at: "2026-05-10T20:01:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: e97154facfa481b0c0d4b595f595d3698ee3e92c0a197794d12d75030a12ecb7
    source_path: tools/slash-commands.md
    workflow: 16
---

คำสั่งจัดการโดย Gateway คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความแบบ **แยกเดี่ยว** ที่ขึ้นต้นด้วย `/` คำสั่งแชต bash สำหรับโฮสต์เท่านั้นใช้ `! <cmd>` (โดยมี `/bash <cmd>` เป็นนามแฝง)

เมื่อการสนทนาหรือเธรดถูกผูกกับเซสชัน ACP ข้อความติดตามผลปกติจะถูกส่งต่อไปยัง ACP harness นั้น คำสั่งจัดการ Gateway ยังคงอยู่ในเครื่อง: `/acp ...` จะไปถึงตัวจัดการคำสั่ง ACP ของ OpenClaw เสมอ และ `/status` กับ `/unfocus` จะอยู่ในเครื่องเมื่อใดก็ตามที่เปิดใช้การจัดการคำสั่งสำหรับพื้นผิวนั้น

มีระบบที่เกี่ยวข้องกันสองระบบ:

<AccordionGroup>
  <Accordion title="Commands">
    ข้อความ `/...` แบบแยกเดี่ยว
  </Accordion>
  <Accordion title="Directives">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`

    - Directives จะถูกตัดออกจากข้อความก่อนที่โมเดลจะเห็น
    - ในข้อความแชตปกติ (ไม่ใช่เฉพาะ directive) จะถือว่าเป็น "คำใบ้แบบอินไลน์" และจะ **ไม่** คงการตั้งค่าเซสชันไว้
    - ในข้อความเฉพาะ directive (ข้อความมีเฉพาะ directives) จะคงค่าไว้ในเซสชันและตอบกลับด้วยการรับทราบ
    - Directives จะถูกใช้สำหรับ **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น หากตั้งค่า `commands.allowFrom` ไว้ ค่านี้จะเป็น allowlist เดียวที่ใช้ มิฉะนั้นการอนุญาตจะมาจาก allowlists/การจับคู่ของช่องทาง รวมถึง `commands.useAccessGroups` ผู้ส่งที่ไม่ได้รับอนุญาตจะเห็น directives ถูกปฏิบัติเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="Inline shortcuts">
    เฉพาะผู้ส่งที่อยู่ใน allowlist/ได้รับอนุญาตเท่านั้น: `/help`, `/commands`, `/status`, `/whoami` (`/id`)

    คำสั่งเหล่านี้จะทำงานทันที ถูกตัดออกก่อนที่โมเดลจะเห็นข้อความ และข้อความที่เหลือจะดำเนินต่อผ่านโฟลว์ปกติ

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
  เปิดใช้การแยกวิเคราะห์ `/...` ในข้อความแชต บนพื้นผิวที่ไม่มีคำสั่งแบบเนทีฟ (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) คำสั่งข้อความยังคงทำงานได้แม้ว่าคุณจะตั้งค่านี้เป็น `false`
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่งแบบเนทีฟ อัตโนมัติ: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (จนกว่าคุณจะเพิ่ม slash commands); ถูกละเว้นสำหรับผู้ให้บริการที่ไม่รองรับแบบเนทีฟ ตั้งค่า `channels.discord.commands.native`, `channels.telegram.commands.native` หรือ `channels.slack.commands.native` เพื่อเขียนทับรายผู้ให้บริการ (bool หรือ `"auto"`) บน Discord ค่า `false` จะข้ามการลงทะเบียนและการล้างข้อมูล slash-command ระหว่างเริ่มต้นระบบ คำสั่งที่เคยลงทะเบียนไว้ก่อนหน้านี้อาจยังมองเห็นได้จนกว่าคุณจะลบออกจากแอป Discord คำสั่ง Slack จะจัดการในแอป Slack และจะไม่ถูกลบโดยอัตโนมัติ
</ParamField>
บน Discord ข้อกำหนดคำสั่งแบบเนทีฟอาจมี `descriptionLocalizations` ซึ่ง OpenClaw จะเผยแพร่เป็น `description_localizations` ของ Discord และรวมไว้ในการเปรียบเทียบการปรับให้ตรงกัน
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่ง **skill** แบบเนทีฟเมื่อรองรับ อัตโนมัติ: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (Slack ต้องสร้าง slash command ต่อหนึ่ง skill) ตั้งค่า `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` หรือ `channels.slack.commands.nativeSkills` เพื่อเขียนทับรายผู้ให้บริการ (bool หรือ `"auto"`)
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  เปิดใช้ `! <cmd>` เพื่อเรียกใช้คำสั่ง shell ของโฮสต์ (`/bash <cmd>` เป็นนามแฝง; ต้องมี allowlists ของ `tools.elevated`)
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  ควบคุมระยะเวลาที่ bash รอก่อนสลับเป็นโหมดเบื้องหลัง (`0` จะเข้าสู่เบื้องหลังทันที)
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`)
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  เปิดใช้ `/mcp` (อ่าน/เขียนการกำหนดค่า MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`)
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  เปิดใช้ `/plugins` (การค้นพบ/สถานะ plugin รวมถึงการควบคุมติดตั้ง + เปิด/ปิดใช้งาน)
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  เปิดใช้ `/debug` (การเขียนทับเฉพาะ runtime)
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  เปิดใช้ `/restart` รวมถึง action ของเครื่องมือสำหรับรีสตาร์ท gateway
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  ตั้งค่า allowlist เจ้าของแบบชัดเจนสำหรับพื้นผิวคำสั่ง/เครื่องมือเฉพาะเจ้าของเท่านั้น นี่คือบัญชีผู้ปฏิบัติงานที่เป็นมนุษย์ซึ่งสามารถอนุมัติการกระทำที่อันตรายและเรียกใช้คำสั่งอย่างเช่น `/diagnostics`, `/export-trajectory` และ `/config` ได้ ค่านี้แยกจาก `commands.allowFrom` และจากการเข้าถึงด้วยการจับคู่ DM
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  รายช่องทาง: ทำให้คำสั่งเฉพาะเจ้าของต้องใช้ **ตัวตนเจ้าของ** เพื่อเรียกใช้บนพื้นผิวนั้น เมื่อเป็น `true` ผู้ส่งต้องตรงกับผู้สมัครเจ้าของที่ resolve แล้ว (เช่นรายการใน `commands.ownerAllowFrom` หรือเมตาดาต้าเจ้าของแบบเนทีฟของผู้ให้บริการ) หรือมี scope ภายใน `operator.admin` บนช่องทางข้อความภายใน รายการไวลด์การ์ดใน `allowFrom` ของช่องทาง หรือรายการผู้สมัครเจ้าของที่ว่างเปล่า/resolve ไม่ได้ **ไม่** เพียงพอ คำสั่งเฉพาะเจ้าของจะ fail closed บนช่องทางนั้น ปล่อยค่านี้ปิดไว้หากคุณต้องการให้คำสั่งเฉพาะเจ้าของถูกกั้นด้วย `ownerAllowFrom` และ allowlists คำสั่งมาตรฐานเท่านั้น
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  ควบคุมวิธีที่ id เจ้าของปรากฏใน system prompt
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  ตั้งค่า HMAC secret ที่ใช้เมื่อ `commands.ownerDisplay="hash"` ได้ตามต้องการ
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  allowlist รายผู้ให้บริการสำหรับการอนุญาตคำสั่ง เมื่อกำหนดค่าไว้ ค่านี้จะเป็นแหล่งอนุญาตเดียวสำหรับคำสั่งและ directives (allowlists/การจับคู่ของช่องทาง และ `commands.useAccessGroups` จะถูกละเว้น) ใช้ `"*"` สำหรับค่าเริ่มต้นแบบทั่วโลก; คีย์เฉพาะผู้ให้บริการจะเขียนทับค่านี้
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  บังคับใช้ allowlists/นโยบายสำหรับคำสั่งเมื่อไม่ได้ตั้งค่า `commands.allowFrom`
</ParamField>

## รายการคำสั่ง

แหล่งความจริงปัจจุบัน:

- built-ins หลักมาจาก `src/auto-reply/commands-registry.shared.ts`
- คำสั่ง dock ที่สร้างขึ้นมาจาก `src/auto-reply/commands-registry.data.ts`
- คำสั่ง plugin มาจากการเรียก `registerCommand()` ของ plugin
- ความพร้อมใช้งานจริงบน gateway ของคุณยังขึ้นอยู่กับแฟล็กการกำหนดค่า พื้นผิวช่องทาง และ plugins ที่ติดตั้ง/เปิดใช้งาน

### คำสั่ง built-in หลัก

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - `/new [model]` เริ่มเซสชันใหม่; `/reset` เป็นนามแฝงสำหรับรีเซ็ต
    - Control UI จะดักจับ `/new` ที่พิมพ์เพื่อสร้างและสลับไปยังเซสชันแดชบอร์ดใหม่ ยกเว้นเมื่อกำหนดค่า `session.dmScope: "main"` และ parent ปัจจุบันเป็นเซสชันหลักของเอเจนต์ ในกรณีนั้น `/new` จะรีเซ็ตเซสชันหลักในที่เดิม `/reset` ที่พิมพ์ยังคงเรียกใช้การรีเซ็ตในที่เดิมของ Gateway
    - `/reset soft [message]` เก็บ transcript ปัจจุบันไว้ ทิ้ง ids เซสชันแบ็กเอนด์ CLI ที่นำกลับมาใช้ซ้ำ และเรียกโหลด startup/system-prompt ใหม่ในที่เดิม
    - `/compact [instructions]` ทำ Compaction บริบทของเซสชัน ดู [Compaction](/th/concepts/compaction)
    - `/stop` ยกเลิก run ปัจจุบัน
    - `/session idle <duration|off>` และ `/session max-age <duration|off>` จัดการวันหมดอายุของการผูกเธรด
    - `/export-session [path]` ส่งออกเซสชันปัจจุบันเป็น HTML นามแฝง: `/export`
    - `/export-trajectory [path]` ขอการอนุมัติ exec แล้วส่งออก [ชุด trajectory](/th/tools/trajectory) แบบ JSONL สำหรับเซสชันปัจจุบัน ใช้เมื่อคุณต้องการไทม์ไลน์ของ prompt, tool และ transcript สำหรับเซสชัน OpenClaw หนึ่งเซสชัน ในแชตกลุ่ม prompt การอนุมัติและผลลัพธ์การส่งออกจะไปหาเจ้าของแบบส่วนตัว นามแฝง: `/trajectory`

  </Accordion>
  <Accordion title="Model and run controls">
    - `/think <level|default>` ตั้งค่าระดับการคิดหรือล้างการเขียนทับของเซสชัน ตัวเลือกมาจากโปรไฟล์ผู้ให้บริการของโมเดลที่ใช้งานอยู่ ระดับทั่วไปคือ `off`, `minimal`, `low`, `medium` และ `high` พร้อมระดับกำหนดเองอย่าง `xhigh`, `adaptive`, `max` หรือไบนารี `on` เฉพาะที่รองรับเท่านั้น นามแฝง: `/thinking`, `/t`
    - `/verbose on|off|full` สลับเอาต์พุตแบบละเอียด นามแฝง: `/v`
    - `/trace on|off` สลับเอาต์พุต trace ของ plugin สำหรับเซสชันปัจจุบัน
    - `/fast [status|on|off|default]` แสดง ตั้งค่า หรือล้างโหมดเร็ว
    - `/reasoning [on|off|stream]` สลับการมองเห็น reasoning นามแฝง: `/reason`
    - `/elevated [on|off|ask|full]` สลับโหมด elevated นามแฝง: `/elev`
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` แสดงหรือตั้งค่าเริ่มต้น exec
    - `/model [name|#|status]` แสดงหรือตั้งค่าโมเดล
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` แสดงรายการผู้ให้บริการที่กำหนดค่า/มี auth พร้อมใช้งาน หรือโมเดลสำหรับผู้ให้บริการ; เพิ่ม `all` เพื่อเรียกดูแค็ตตาล็อกเต็มของผู้ให้บริการนั้น รายการ `provider/*` ใน `agents.defaults.models` ทำให้ `/model` และ `/models` แสดงเฉพาะโมเดลที่ค้นพบสำหรับผู้ให้บริการเหล่านั้น
    - `/queue <mode>` จัดการพฤติกรรมคิว (`steer`, `queue` เดิม, `followup`, `collect`, `steer-backlog`, `interrupt`) รวมถึงตัวเลือกอย่าง `debounce:0.5s cap:25 drop:summarize`; `/queue default` หรือ `/queue reset` ล้างการเขียนทับของเซสชัน ดู [คิวคำสั่ง](/th/concepts/queue) และ [คิวการควบคุมทิศทาง](/th/concepts/queue-steering)
    - `/steer <message>` ฉีดคำแนะนำเข้าไปใน run ที่ใช้งานอยู่สำหรับเซสชันปัจจุบัน โดยไม่ขึ้นกับโหมด `/queue` จะไม่เริ่ม run ใหม่เมื่อเซสชันว่างอยู่ นามแฝง: `/tell` ดู [ควบคุมทิศทาง](/th/tools/steer)

  </Accordion>
  <Accordion title="Discovery and status">
    - `/help` แสดงสรุปความช่วยเหลือแบบสั้น
    - `/commands` แสดงแค็ตตาล็อกคำสั่งที่สร้างขึ้น
    - `/tools [compact|verbose]` แสดงสิ่งที่เอเจนต์ปัจจุบันสามารถใช้ได้ตอนนี้
    - `/status` แสดงสถานะการดำเนินการ/runtime, uptime ของ Gateway และระบบ รวมถึงการใช้งาน/โควตาผู้ให้บริการเมื่อมี
    - `/diagnostics [note]` เป็นโฟลว์รายงานสนับสนุนเฉพาะเจ้าของสำหรับบั๊กของ Gateway และการ run ของ Codex harness โดยจะขอการอนุมัติ exec อย่างชัดเจนทุกครั้งก่อนเรียกใช้ `openclaw gateway diagnostics export --json`; อย่าอนุมัติ diagnostics ด้วยกฎ allow-all หลังอนุมัติแล้ว จะส่งรายงานที่วางต่อได้พร้อม path ของบันเดิลในเครื่อง สรุป manifest หมายเหตุด้านความเป็นส่วนตัว และ ids เซสชันที่เกี่ยวข้อง ในแชตกลุ่ม prompt การอนุมัติและรายงานจะไปหาเจ้าของแบบส่วนตัว เมื่อเซสชันที่ใช้งานอยู่ใช้ OpenAI Codex harness การอนุมัติเดียวกันนี้จะส่ง feedback ของ Codex ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย และคำตอบที่เสร็จแล้วจะแสดง ids เซสชัน OpenClaw, ids เธรด Codex และคำสั่ง `codex resume <thread-id>` ดู [การส่งออก diagnostics](/th/gateway/diagnostics)
    - `/crestodian <request>` เรียกใช้ตัวช่วยตั้งค่าและซ่อมแซม Crestodian จาก DM ของเจ้าของ
    - `/tasks` แสดงรายการงานเบื้องหลังที่ใช้งานอยู่/ล่าสุดสำหรับเซสชันปัจจุบัน
    - `/context [list|detail|map|json]` อธิบายวิธีประกอบบริบท `map` จะส่งภาพ treemap ของบริบทเซสชันปัจจุบัน
    - `/whoami` แสดง id ผู้ส่งของคุณ นามแฝง: `/id`
    - `/usage off|tokens|full|cost` ควบคุม footer การใช้งานต่อคำตอบ หรือพิมพ์สรุปค่าใช้จ่ายในเครื่อง

  </Accordion>
  <Accordion title="Skills, รายการอนุญาต, การอนุมัติ">
    - `/skill <name> [input]` เรียกใช้ skill ตามชื่อ
    - `/allowlist [list|add|remove] ...` จัดการรายการใน allowlist แบบข้อความเท่านั้น
    - `/approve <id> <decision>` จัดการพรอมป์อนุมัติ exec
    - `/btw <question>` ถามคำถามข้างเคียงโดยไม่เปลี่ยนบริบทเซสชันในอนาคต ชื่อแฝง: `/side` ดู [BTW](/th/tools/btw)

  </Accordion>
  <Accordion title="Subagents และ ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` จัดการการรัน sub-agent สำหรับเซสชันปัจจุบัน
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` จัดการเซสชัน ACP และตัวเลือกรันไทม์
    - `/focus <target>` ผูกเธรด Discord ปัจจุบันหรือหัวข้อ/การสนทนา Telegram เข้ากับเป้าหมายเซสชัน
    - `/unfocus` ลบการผูกปัจจุบัน
    - `/agents` แสดงรายการเอเจนต์ที่ผูกกับเธรดสำหรับเซสชันปัจจุบัน
    - `/kill <id|#|all>` ยกเลิก sub-agent ที่กำลังทำงานหนึ่งตัวหรือทั้งหมด
    - `/subagents steer <id|#> <message>` ส่งคำสั่งชี้นำไปยัง sub-agent ที่กำลังทำงาน ดู [Steer](/th/tools/steer)

  </Accordion>
  <Accordion title="การเขียนเฉพาะเจ้าของและผู้ดูแลระบบ">
    - `/config show|get|set|unset` อ่านหรือเขียน `openclaw.json` เฉพาะเจ้าของ ต้องมี `commands.config: true`
    - `/mcp show|get|set|unset` อ่านหรือเขียนการตั้งค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการไว้ภายใต้ `mcp.servers` เฉพาะเจ้าของ ต้องมี `commands.mcp: true`
    - `/plugins list|inspect|show|get|install|enable|disable` ตรวจสอบหรือเปลี่ยนสถานะ Plugin `/plugin` เป็นชื่อแฝง การเขียนทำได้เฉพาะเจ้าของ ต้องมี `commands.plugins: true`
    - `/debug show|set|unset|reset` จัดการการแทนที่ค่าคอนฟิกรันไทม์เท่านั้น เฉพาะเจ้าของ ต้องมี `commands.debug: true`
    - `/restart` รีสตาร์ต OpenClaw เมื่อเปิดใช้ ค่าเริ่มต้น: เปิดใช้; ตั้ง `commands.restart: false` เพื่อปิด
    - `/send on|off|inherit` ตั้งค่านโยบายการส่ง เฉพาะเจ้าของ

  </Accordion>
  <Accordion title="เสียง, TTS, การควบคุมช่องทาง">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` ควบคุม TTS ดู [TTS](/th/tools/tts)
    - `/activation mention|always` ตั้งค่าโหมดการเรียกใช้งานในกลุ่ม
    - `/bash <command>` รันคำสั่งเชลล์บนโฮสต์ แบบข้อความเท่านั้น ชื่อแฝง: `! <command>` ต้องมี `commands.bash: true` พร้อม allowlist ของ `tools.elevated`
    - `!poll [sessionId]` ตรวจสอบงาน bash เบื้องหลัง
    - `!stop [sessionId]` หยุดงาน bash เบื้องหลัง

  </Accordion>
</AccordionGroup>

### คำสั่ง dock ที่สร้างขึ้น

คำสั่ง dock จะเปลี่ยนเส้นทางตอบกลับของเซสชันปัจจุบันไปยังช่องทางที่เชื่อมโยงอีกช่องทางหนึ่ง ดู [การ dock ช่องทาง](/th/concepts/channel-docking) สำหรับการตั้งค่า ตัวอย่าง และการแก้ไขปัญหา

คำสั่ง dock ถูกสร้างจาก Plugin ช่องทางที่รองรับคำสั่งเนทีฟ ชุดที่บันเดิลอยู่ในปัจจุบัน:

- `/dock-discord` (ชื่อแฝง: `/dock_discord`)
- `/dock-mattermost` (ชื่อแฝง: `/dock_mattermost`)
- `/dock-slack` (ชื่อแฝง: `/dock_slack`)
- `/dock-telegram` (ชื่อแฝง: `/dock_telegram`)

ใช้คำสั่ง dock จากแชทโดยตรงเพื่อเปลี่ยนเส้นทางตอบกลับของเซสชันปัจจุบันไปยังช่องทางที่เชื่อมโยงอีกช่องทางหนึ่ง เอเจนต์จะคงบริบทเซสชันเดิมไว้ แต่การตอบกลับในอนาคตของเซสชันนั้นจะถูกส่งไปยัง peer ของช่องทางที่เลือก

คำสั่ง dock ต้องมี `session.identityLinks` ผู้ส่งต้นทางและ peer ปลายทางต้องอยู่ในกลุ่มตัวตนเดียวกัน เช่น `["telegram:123", "discord:456"]` หากผู้ใช้ Telegram ที่มี id `123` ส่ง `/dock_discord` OpenClaw จะเก็บ `lastChannel: "discord"` และ `lastTo: "456"` ไว้บนเซสชันที่ใช้งานอยู่ หากผู้ส่งไม่ได้เชื่อมโยงกับ peer ของ Discord คำสั่งจะตอบกลับด้วยคำแนะนำการตั้งค่าแทนที่จะส่งต่อไปยังแชทปกติ

การ docking เปลี่ยนเฉพาะเส้นทางเซสชันที่ใช้งานอยู่เท่านั้น ไม่ได้สร้างบัญชีช่องทาง ให้สิทธิ์เข้าถึง ข้าม allowlist ของช่องทาง หรือย้ายประวัติ transcript ไปยังเซสชันอื่น ใช้ `/dock-telegram`, `/dock-slack`, `/dock-mattermost` หรือคำสั่ง dock ที่สร้างขึ้นอื่นเพื่อเปลี่ยนเส้นทางอีกครั้ง

### คำสั่ง Plugin ที่บันเดิลมา

Plugin ที่บันเดิลมาสามารถเพิ่มคำสั่ง slash เพิ่มเติมได้ คำสั่งที่บันเดิลอยู่ใน repo นี้ในปัจจุบัน:

- `/dreaming [on|off|status|help]` เปิด/ปิดการ dreaming ของหน่วยความจำ ดู [Dreaming](/th/concepts/dreaming)
- `/pair [qr|status|pending|approve|cleanup|notify]` จัดการโฟลว์การจับคู่/ตั้งค่าอุปกรณ์ ดู [การจับคู่](/th/channels/pairing)
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` เปิดใช้งานคำสั่ง phone node ที่มีความเสี่ยงสูงชั่วคราว
- `/voice status|list [limit]|set <voiceId|name>` จัดการการตั้งค่าเสียง Talk บน Discord ชื่อคำสั่งเนทีฟคือ `/talkvoice`
- `/card ...` ส่งพรีเซ็ต rich card ของ LINE ดู [LINE](/th/channels/line)
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` ตรวจสอบและควบคุม harness ของเซิร์ฟเวอร์แอป Codex ที่บันเดิลมา ดู [Codex harness](/th/plugins/codex-harness)
- คำสั่งเฉพาะ QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### คำสั่ง skill แบบไดนามิก

Skills ที่ผู้ใช้เรียกใช้ได้จะถูกเปิดเผยเป็นคำสั่ง slash ด้วย:

- `/skill <name> [input]` ใช้งานได้เสมอในฐานะ entrypoint ทั่วไป
- skills อาจปรากฏเป็นคำสั่งโดยตรง เช่น `/prose` เมื่อ skill/Plugin ลงทะเบียนไว้
- การลงทะเบียนคำสั่ง skill แบบเนทีฟถูกควบคุมโดย `commands.nativeSkills` และ `channels.<provider>.commands.nativeSkills`
- ข้อกำหนดคำสั่งสามารถระบุ `descriptionLocalizations` สำหรับพื้นผิวเนทีฟที่รองรับคำอธิบายแบบแปลภาษา รวมถึง Discord

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับอาร์กิวเมนต์และ parser">
    - คำสั่งรับ `:` ที่ไม่บังคับระหว่างคำสั่งกับ args ได้ (เช่น `/think: high`, `/send: on`, `/help:`)
    - `/new <model>` รับชื่อแฝงของโมเดล, `provider/model` หรือชื่อผู้ให้บริการ (จับคู่แบบคลุมเครือ); หากไม่มีการจับคู่ ข้อความจะถูกถือเป็นเนื้อหาข้อความ
    - สำหรับรายละเอียดการใช้งานผู้ให้บริการแบบเต็ม ให้ใช้ `openclaw status --usage`
    - `/allowlist add|remove` ต้องมี `commands.config=true` และเคารพ `configWrites` ของช่องทาง
    - ในช่องทางหลายบัญชี `/allowlist --account <id>` ที่กำหนดเป้าหมายคอนฟิก และ `/config set channels.<provider>.accounts.<id>...` จะเคารพ `configWrites` ของบัญชีเป้าหมายด้วย
    - `/usage` ควบคุม footer การใช้งานต่อการตอบกลับ; `/usage cost` พิมพ์สรุปค่าใช้จ่ายภายในเครื่องจากบันทึกเซสชัน OpenClaw
    - `/restart` เปิดใช้งานตามค่าเริ่มต้น; ตั้ง `commands.restart: false` เพื่อปิด
    - `/plugins install <spec>` รับ spec ของ Plugin แบบเดียวกับ `openclaw plugins install`: path/archive ภายในเครื่อง, แพ็กเกจ npm, `git:<repo>` หรือ `clawhub:<pkg>` จากนั้นร้องขอการรีสตาร์ต Gateway เพราะโมดูลซอร์สของ Plugin เปลี่ยนไป
    - `/plugins enable|disable` อัปเดตคอนฟิก Plugin และทริกเกอร์การโหลด Plugin ของ Gateway ใหม่สำหรับ turn ใหม่ของเอเจนต์

  </Accordion>
  <Accordion title="พฤติกรรมเฉพาะช่องทาง">
    - คำสั่งเนทีฟเฉพาะ Discord: `/vc join|leave|status` ควบคุมช่องเสียง (ไม่พร้อมใช้งานเป็นข้อความ) `join` ต้องมี guild และช่องเสียง/stage ที่เลือก ต้องมี `channels.discord.voice` และคำสั่งเนทีฟ
    - คำสั่งผูกเธรด Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) ต้องเปิดใช้การผูกเธรดที่มีผล (`session.threadBindings.enabled` และ/หรือ `channels.discord.threadBindings.enabled`)
    - อ้างอิงคำสั่ง ACP และพฤติกรรมรันไทม์: [เอเจนต์ ACP](/th/tools/acp-agents)

  </Accordion>
  <Accordion title="Verbose / trace / fast / ความปลอดภัยของ reasoning">
    - `/verbose` มีไว้สำหรับการดีบักและการมองเห็นเพิ่มเติม; ให้ปิด **off** ไว้ในการใช้งานปกติ
    - `/trace` แคบกว่า `/verbose`: แสดงเฉพาะบรรทัด trace/debug ที่ Plugin เป็นเจ้าของ และปิด chatter ของเครื่องมือ verbose ปกติไว้
    - `/fast on|off` คงค่าการแทนที่ของเซสชันไว้ ใช้ตัวเลือก `inherit` ใน Sessions UI เพื่อล้างค่าและกลับไปใช้ค่าเริ่มต้นจากคอนฟิก
    - `/fast` ขึ้นกับผู้ให้บริการ: OpenAI/OpenAI Codex จะแมปเป็น `service_tier=priority` บน Responses endpoints แบบเนทีฟ ขณะที่คำขอ Anthropic สาธารณะโดยตรง รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย OAuth ซึ่งส่งไปยัง `api.anthropic.com` จะแมปเป็น `service_tier=auto` หรือ `standard_only` ดู [OpenAI](/th/providers/openai) และ [Anthropic](/th/providers/anthropic)
    - สรุปความล้มเหลวของเครื่องมือยังคงแสดงเมื่อเกี่ยวข้อง แต่ข้อความความล้มเหลวโดยละเอียดจะรวมอยู่เฉพาะเมื่อ `/verbose` เป็น `on` หรือ `full`
    - `/reasoning`, `/verbose` และ `/trace` มีความเสี่ยงในบริบทกลุ่ม: อาจเปิดเผยการ reasoning ภายใน เอาต์พุตของเครื่องมือ หรือ diagnostics ของ Plugin ที่คุณไม่ได้ตั้งใจเปิดเผย ควรปิดไว้ โดยเฉพาะในแชทกลุ่ม

  </Accordion>
  <Accordion title="การสลับโมเดล">
    - `/model` คงค่าโมเดลเซสชันใหม่ทันที
    - หากเอเจนต์ว่าง การรันถัดไปจะใช้โมเดลนั้นทันที
    - หากมีการรันที่กำลังทำงานอยู่แล้ว OpenClaw จะทำเครื่องหมายการสลับสดเป็นรอดำเนินการ และจะรีสตาร์ตเข้าสู่โมเดลใหม่เฉพาะที่จุด retry ที่สะอาด
    - หากกิจกรรมเครื่องมือหรือเอาต์พุตตอบกลับเริ่มไปแล้ว การสลับที่รอดำเนินการอาจค้างอยู่ในคิวจนกว่าจะมีโอกาส retry ภายหลังหรือ turn ถัดไปของผู้ใช้
    - ใน TUI ภายในเครื่อง `/crestodian [request]` กลับจาก TUI ของเอเจนต์ปกติไปยัง Crestodian สิ่งนี้แยกจากโหมด rescue ของช่องทางข้อความ และไม่ได้ให้สิทธิ์คอนฟิกระยะไกล

  </Accordion>
  <Accordion title="Fast path และทางลัด inline">
    - **Fast path:** ข้อความที่มีเฉพาะคำสั่งจากผู้ส่งใน allowlist จะถูกจัดการทันที (ข้ามคิว + โมเดล)
    - **การกั้นด้วยการ mention ในกลุ่ม:** ข้อความที่มีเฉพาะคำสั่งจากผู้ส่งใน allowlist จะข้ามข้อกำหนดการ mention
    - **ทางลัด inline (เฉพาะผู้ส่งใน allowlist):** คำสั่งบางรายการยังใช้งานได้เมื่อฝังอยู่ในข้อความปกติ และจะถูกตัดออกก่อนที่โมเดลจะเห็นข้อความที่เหลือ
      - ตัวอย่าง: `hey /status` ทริกเกอร์การตอบกลับสถานะ และข้อความที่เหลือจะดำเนินต่อผ่านโฟลว์ปกติ
    - ปัจจุบัน: `/help`, `/commands`, `/status`, `/whoami` (`/id`)
    - ข้อความที่มีเฉพาะคำสั่งจากผู้ที่ไม่ได้รับอนุญาตจะถูกเพิกเฉยอย่างเงียบ ๆ และโทเค็น `/...` แบบ inline จะถูกถือเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="คำสั่ง Skill และอาร์กิวเมนต์เนทีฟ">
    - **คำสั่ง Skill:** Skills แบบ `user-invocable` จะถูกเปิดเผยเป็นคำสั่ง slash ชื่อจะถูก sanitize เป็น `a-z0-9_` (สูงสุด 32 อักขระ); ชื่อที่ชนกันจะได้ suffix เป็นตัวเลข (เช่น `_2`)
      - `/skill <name> [input]` เรียกใช้ skill ตามชื่อ (มีประโยชน์เมื่อข้อจำกัดของคำสั่งเนทีฟทำให้สร้างคำสั่งต่อ skill ไม่ได้)
      - โดยค่าเริ่มต้น คำสั่ง skill จะถูกส่งต่อไปยังโมเดลในฐานะคำขอปกติ
      - Skills อาจประกาศ `command-dispatch: tool` เพื่อส่งคำสั่งไปยังเครื่องมือโดยตรงได้ (กำหนดแน่นอน, ไม่มีโมเดล)
      - ตัวอย่าง: `/prose` (Plugin OpenProse) — ดู [OpenProse](/th/prose)
    - **อาร์กิวเมนต์คำสั่งเนทีฟ:** Discord ใช้ autocomplete สำหรับตัวเลือกไดนามิก (และเมนูปุ่มเมื่อคุณละเว้น args ที่จำเป็น) Telegram และ Slack จะแสดงเมนูปุ่มเมื่อคำสั่งรองรับตัวเลือกและคุณละเว้น arg ตัวเลือกไดนามิกจะถูก resolve เทียบกับโมเดลเซสชันเป้าหมาย ดังนั้นตัวเลือกเฉพาะโมเดล เช่น ระดับ `/think` จะตามค่าแทนที่ `/model` ของเซสชันนั้น

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` ตอบคำถามรันไทม์ ไม่ใช่คำถามคอนฟิก: **เอเจนต์นี้ใช้อะไรได้ตอนนี้ในบทสนทนานี้**

- `/tools` ค่าเริ่มต้นกระชับและปรับให้เหมาะกับการสแกนอย่างรวดเร็ว
- `/tools verbose` เพิ่มคำอธิบายสั้น ๆ
- พื้นผิวคำสั่งเนทีฟที่รองรับอาร์กิวเมนต์เปิดเผยตัวสลับโหมดเดียวกันเป็น `compact|verbose`
- ผลลัพธ์มีขอบเขตตามเซสชัน ดังนั้นการเปลี่ยนเอเจนต์ ช่องทาง เธรด การอนุญาตผู้ส่ง หรือโมเดลอาจเปลี่ยนเอาต์พุตได้
- `/tools` รวมเครื่องมือที่เข้าถึงได้จริงในรันไทม์ รวมถึงเครื่องมือ core, เครื่องมือ Plugin ที่เชื่อมต่อ และเครื่องมือที่ช่องทางเป็นเจ้าของ

สำหรับการแก้ไขโปรไฟล์และการแทนที่ ให้ใช้แผง Tools ใน Control UI หรือพื้นผิว config/catalog แทนการถือว่า `/tools` เป็นแคตตาล็อกแบบคงที่

## พื้นผิวการใช้งาน (อะไรแสดงที่ไหน)

- **การใช้งาน/โควตาของผู้ให้บริการ** (ตัวอย่าง: "Claude เหลือ 80%") จะแสดงใน `/status` สำหรับผู้ให้บริการโมเดลปัจจุบันเมื่อเปิดใช้การติดตามการใช้งาน OpenClaw ทำให้หน้าต่างเวลาของผู้ให้บริการอยู่ในรูปแบบ `% left`; สำหรับ MiniMax ฟิลด์เปอร์เซ็นต์ที่ระบุเฉพาะส่วนที่เหลือจะถูกกลับค่าก่อนแสดงผล และการตอบกลับ `model_remains` จะให้ความสำคัญกับรายการโมเดลแชตพร้อมป้ายกำกับแผนที่ติดแท็กโมเดล
- **บรรทัด token/cache** ใน `/status` สามารถย้อนกลับไปใช้รายการการใช้งานล่าสุดจาก transcript ได้เมื่อสแนปช็อตเซสชันสดมีข้อมูลน้อย ค่าสดที่ไม่เป็นศูนย์ที่มีอยู่ยังคงชนะ และการย้อนกลับไปใช้ transcript ยังสามารถกู้คืนป้ายกำกับโมเดลรันไทม์ที่ใช้งานอยู่ พร้อมยอดรวมที่เน้นพรอมป์และมีขนาดใหญ่กว่าเมื่อยอดรวมที่จัดเก็บหายไปหรือน้อยกว่า
- **การดำเนินการเทียบกับรันไทม์:** `/status` รายงาน `Execution` สำหรับพาธ sandbox ที่มีผล และ `Runtime` สำหรับผู้ที่กำลังรันเซสชันจริง: `OpenClaw Pi Default`, `OpenAI Codex`, แบ็กเอนด์ CLI หรือแบ็กเอนด์ ACP
- **token/ค่าใช้จ่ายต่อการตอบกลับ** ถูกควบคุมด้วย `/usage off|tokens|full` (แนบต่อท้ายการตอบกลับปกติ)
- `/model status` เกี่ยวกับ **โมเดล/การยืนยันตัวตน/endpoint** ไม่ใช่การใช้งาน

## การเลือกโมเดล (`/model`)

`/model` ถูกใช้งานเป็น directive

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

- `/model` และ `/model list` แสดงตัวเลือกแบบกะทัดรัดพร้อมหมายเลข (ตระกูลโมเดล + ผู้ให้บริการที่พร้อมใช้งาน)
- บน Discord, `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบที่มี dropdown ของผู้ให้บริการและโมเดล พร้อมขั้นตอน Submit ตัวเลือกนี้เคารพ `agents.defaults.models` รวมถึงรายการ `provider/*` เพื่อให้การค้นหาแบบจำกัดขอบเขตตามผู้ให้บริการสามารถทำให้ตัวเลือกอยู่ต่ำกว่าขีดจำกัด component 25 ตัวเลือกของ Discord
- `/model <#>` เลือกจากตัวเลือกนั้น (และให้ความสำคัญกับผู้ให้บริการปัจจุบันเมื่อเป็นไปได้)
- `/model status` แสดงมุมมองโดยละเอียด รวมถึง endpoint ของผู้ให้บริการที่กำหนดค่าไว้ (`baseUrl`) และโหมด API (`api`) เมื่อมี

## การ override สำหรับดีบัก

`/debug` ให้คุณตั้งค่า override ของ config แบบ **เฉพาะรันไทม์** (หน่วยความจำ ไม่ใช่ดิสก์) ได้ เฉพาะ owner เท่านั้น ปิดใช้โดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.debug: true`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
override มีผลทันทีต่อการอ่าน config ใหม่ แต่จะ **ไม่** เขียนลง `openclaw.json` ใช้ `/debug reset` เพื่อล้าง override ทั้งหมดและกลับไปใช้ config บนดิสก์
</Note>

## เอาต์พุต trace ของ Plugin

`/trace` ให้คุณสลับเปิดปิด **บรรทัด trace/debug ของ Plugin ในขอบเขตเซสชัน** โดยไม่ต้องเปิดโหมด verbose เต็มรูปแบบ

ตัวอย่าง:

```text
/trace
/trace on
/trace off
```

หมายเหตุ:

- `/trace` ที่ไม่มีอาร์กิวเมนต์จะแสดงสถานะ trace ของเซสชันปัจจุบัน
- `/trace on` เปิดใช้บรรทัด trace ของ Plugin สำหรับเซสชันปัจจุบัน
- `/trace off` ปิดใช้อีกครั้ง
- บรรทัด trace ของ Plugin อาจปรากฏใน `/status` และเป็นข้อความวินิจฉัยติดตามผลหลังการตอบกลับปกติของผู้ช่วย
- `/trace` ไม่ได้แทนที่ `/debug`; `/debug` ยังคงจัดการ override ของ config แบบเฉพาะรันไทม์
- `/trace` ไม่ได้แทนที่ `/verbose`; เอาต์พุตเครื่องมือ/สถานะ verbose ปกติยังเป็นของ `/verbose`

## การอัปเดต config

`/config` เขียนลง config บนดิสก์ของคุณ (`openclaw.json`) เฉพาะ owner เท่านั้น ปิดใช้โดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.config: true`

ตัวอย่าง:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
config จะถูกตรวจสอบความถูกต้องก่อนเขียน; การเปลี่ยนแปลงที่ไม่ถูกต้องจะถูกปฏิเสธ การอัปเดต `/config` จะคงอยู่ข้ามการรีสตาร์ท
</Note>

## การอัปเดต MCP

`/mcp` เขียนนิยามเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการไว้ภายใต้ `mcp.servers` เฉพาะ owner เท่านั้น ปิดใช้โดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.mcp: true`

ตัวอย่าง:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` จัดเก็บ config ใน config ของ OpenClaw ไม่ใช่การตั้งค่าโปรเจกต์ที่ Pi เป็นเจ้าของ adapter รันไทม์จะตัดสินใจว่า transport ใดสามารถเรียกใช้งานได้จริง
</Note>

## การอัปเดต Plugin

`/plugins` ให้ operator ตรวจสอบ Plugin ที่ค้นพบและสลับการเปิดใช้ใน config โฟลว์แบบอ่านอย่างเดียวสามารถใช้ `/plugin` เป็น alias ได้ ปิดใช้โดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.plugins: true`

ตัวอย่าง:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` และ `/plugins show` ใช้การค้นพบ Plugin จริงกับ workspace ปัจจุบันพร้อม config บนดิสก์
- `/plugins install` ติดตั้งจาก ClawHub, npm, git, ไดเรกทอรี local และ archive
- `/plugins enable|disable` อัปเดตเฉพาะ config ของ Plugin; ไม่ได้ติดตั้งหรือถอนการติดตั้ง Plugin
- การเปลี่ยนแปลงการเปิดใช้และปิดใช้จะ hot-reload พื้นผิวรันไทม์ Plugin ของ Gateway สำหรับ agent turn ใหม่; การติดตั้งจะขอให้รีสตาร์ท Gateway เพราะโมดูลซอร์สของ Plugin เปลี่ยนไป

</Note>

## หมายเหตุเกี่ยวกับพื้นผิว

<AccordionGroup>
  <Accordion title="เซสชันต่อพื้นผิว">
    - **คำสั่งข้อความ** รันในเซสชันแชตปกติ (DM ใช้ `main` ร่วมกัน กลุ่มมีเซสชันของตัวเอง)
    - **คำสั่ง native** ใช้เซสชันที่แยกออกมา:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (กำหนดค่า prefix ได้ผ่าน `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (กำหนดเป้าหมายไปยังเซสชันแชตผ่าน `CommandTargetSessionKey`)
    - **`/stop`** กำหนดเป้าหมายไปยังเซสชันแชตที่ใช้งานอยู่ เพื่อให้สามารถยกเลิกการรันปัจจุบันได้

  </Accordion>
  <Accordion title="รายละเอียดเฉพาะของ Slack">
    `channels.slack.slashCommand` ยังคงรองรับคำสั่งเดียวในสไตล์ `/openclaw` หากคุณเปิดใช้ `commands.native` คุณต้องสร้างคำสั่ง slash ของ Slack หนึ่งคำสั่งต่อคำสั่งในตัวแต่ละคำสั่ง (ใช้ชื่อเดียวกับ `/help`) เมนูอาร์กิวเมนต์ของคำสั่งสำหรับ Slack จะถูกส่งเป็นปุ่ม Block Kit แบบ ephemeral

    ข้อยกเว้น native ของ Slack: ลงทะเบียน `/agentstatus` (ไม่ใช่ `/status`) เพราะ Slack สงวน `/status` ไว้ ข้อความ `/status` ยังคงใช้งานได้ในข้อความ Slack

  </Accordion>
</AccordionGroup>

## คำถามแทรก BTW

`/btw` เป็น **คำถามแทรก** แบบรวดเร็วเกี่ยวกับเซสชันปัจจุบัน `/side` เป็น alias

ต่างจากแชตปกติ:

- ใช้เซสชันปัจจุบันเป็นบริบทพื้นหลัง
- รันเป็นการเรียกแบบครั้งเดียวที่ **ไม่มีเครื่องมือ** และแยกต่างหาก
- ไม่เปลี่ยนบริบทเซสชันในอนาคต
- ไม่ถูกเขียนลงประวัติ transcript
- ถูกส่งเป็นผลลัพธ์แทรกแบบสดแทนข้อความผู้ช่วยปกติ

สิ่งนี้ทำให้ `/btw` มีประโยชน์เมื่อคุณต้องการคำชี้แจงชั่วคราวระหว่างที่งานหลักยังดำเนินต่อไป

ตัวอย่าง:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

ดู [คำถามแทรก BTW](/th/tools/btw) สำหรับพฤติกรรมเต็มรูปแบบและรายละเอียด UX ของ client

## ที่เกี่ยวข้อง

- [การสร้าง skills](/th/tools/creating-skills)
- [Skills](/th/tools/skills)
- [config ของ Skills](/th/tools/skills-config)
