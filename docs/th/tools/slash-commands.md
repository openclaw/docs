---
read_when:
    - การใช้หรือกำหนดค่าคำสั่งแชต
    - การดีบักการกำหนดเส้นทางคำสั่งหรือสิทธิ์
sidebarTitle: Slash commands
summary: 'คำสั่ง Slash: ข้อความเทียบกับเนทีฟ การกำหนดค่า และคำสั่งที่รองรับ'
title: คำสั่งสแลช
x-i18n:
    generated_at: "2026-05-03T21:39:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fbdd76ccd43159cabfbc3f15f7bddd2a7ada07fcd6eea2e169d2d88df18f28c
    source_path: tools/slash-commands.md
    workflow: 16
---

คำสั่งจะถูกจัดการโดย Gateway คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความแบบ **เดี่ยว** ที่ขึ้นต้นด้วย `/` คำสั่งแชต bash เฉพาะโฮสต์ใช้ `! <cmd>` (โดยมี `/bash <cmd>` เป็น alias)

เมื่อการสนทนาหรือเธรดถูกผูกกับเซสชัน ACP ข้อความติดตามผลปกติจะถูกส่งต่อไปยัง ACP harness นั้น คำสั่งจัดการ Gateway ยังคงอยู่ในเครื่อง: `/acp ...` จะไปถึงตัวจัดการคำสั่ง OpenClaw ACP เสมอ และ `/status` รวมถึง `/unfocus` จะยังคงอยู่ในเครื่องเมื่อมีการเปิดใช้งานการจัดการคำสั่งสำหรับพื้นผิวนั้น

มีระบบที่เกี่ยวข้องกันสองระบบ:

<AccordionGroup>
  <Accordion title="คำสั่ง">
    ข้อความ `/...` แบบเดี่ยว
  </Accordion>
  <Accordion title="Directive">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Directive จะถูกตัดออกจากข้อความก่อนที่โมเดลจะเห็น
    - ในข้อความแชตปกติ (ไม่ใช่ข้อความที่มีแต่ directive) ระบบจะถือว่าเป็น “คำใบ้แบบ inline” และจะ **ไม่** คงค่าการตั้งค่าเซสชันไว้
    - ในข้อความที่มีแต่ directive (ข้อความมีเฉพาะ directive) ระบบจะคงค่าไว้กับเซสชันและตอบกลับด้วยการยืนยัน
    - Directive จะถูกใช้กับ **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น หากตั้งค่า `commands.allowFrom` ไว้ ค่านี้จะเป็น allowlist เดียวที่ใช้ มิฉะนั้นการอนุญาตจะมาจาก allowlist/การจับคู่ของช่องทางร่วมกับ `commands.useAccessGroups` ผู้ส่งที่ไม่ได้รับอนุญาตจะเห็น directive ถูกปฏิบัติเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="ทางลัดแบบ Inline">
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
  เปิดใช้การแยกวิเคราะห์ `/...` ในข้อความแชต บนพื้นผิวที่ไม่มีคำสั่ง native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) คำสั่งข้อความยังทำงานได้แม้คุณตั้งค่านี้เป็น `false`
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่ง native อัตโนมัติ: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (จนกว่าคุณจะเพิ่มคำสั่ง slash); ถูกละเว้นสำหรับผู้ให้บริการที่ไม่รองรับ native ตั้งค่า `channels.discord.commands.native`, `channels.telegram.commands.native` หรือ `channels.slack.commands.native` เพื่อ override รายผู้ให้บริการ (bool หรือ `"auto"`) บน Discord ค่า `false` จะข้ามการลงทะเบียนและการล้างคำสั่ง slash ระหว่างเริ่มต้นระบบ คำสั่งที่เคยลงทะเบียนไว้อาจยังแสดงอยู่จนกว่าคุณจะลบออกจากแอป Discord คำสั่ง Slack ถูกจัดการในแอป Slack และจะไม่ถูกลบโดยอัตโนมัติ
</ParamField>
บน Discord สเปกคำสั่ง native อาจรวม `descriptionLocalizations` ซึ่ง OpenClaw จะเผยแพร่เป็น Discord `description_localizations` และรวมไว้ในการเปรียบเทียบ reconcile
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่ง **skill** แบบ native เมื่อรองรับ อัตโนมัติ: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (Slack ต้องสร้างคำสั่ง slash แยกสำหรับแต่ละ skill) ตั้งค่า `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` หรือ `channels.slack.commands.nativeSkills` เพื่อ override รายผู้ให้บริการ (bool หรือ `"auto"`)
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  เปิดใช้ `! <cmd>` เพื่อรันคำสั่งเชลล์ของโฮสต์ (`/bash <cmd>` เป็น alias; ต้องใช้ allowlist ของ `tools.elevated`)
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  ควบคุมระยะเวลาที่ bash รอก่อนสลับไปโหมดเบื้องหลัง (`0` จะส่งไปเบื้องหลังทันที)
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`)
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  เปิดใช้ `/mcp` (อ่าน/เขียนการกำหนดค่า MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`)
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  เปิดใช้ `/plugins` (การค้นพบ/สถานะของ plugin รวมถึงการติดตั้ง + ควบคุมเปิด/ปิดใช้งาน)
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  เปิดใช้ `/debug` (override เฉพาะ runtime)
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  เปิดใช้ `/restart` รวมถึงการดำเนินการเครื่องมือเพื่อรีสตาร์ต gateway
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  ตั้งค่า allowlist เจ้าของแบบชัดเจนสำหรับพื้นผิวคำสั่ง/เครื่องมือที่ใช้ได้เฉพาะเจ้าของ นี่คือบัญชีผู้ปฏิบัติงานมนุษย์ที่สามารถอนุมัติการดำเนินการอันตรายและรันคำสั่ง เช่น `/diagnostics`, `/export-trajectory` และ `/config` ค่านี้แยกจาก `commands.allowFrom` และจากการเข้าถึงด้วยการจับคู่ DM
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  รายช่องทาง: ทำให้คำสั่งเฉพาะเจ้าของต้องใช้ **ตัวตนเจ้าของ** เพื่อรันบนพื้นผิวนั้น เมื่อเป็น `true` ผู้ส่งต้องตรงกับผู้สมัครเจ้าของที่ resolve แล้ว (เช่นรายการใน `commands.ownerAllowFrom` หรือ metadata เจ้าของแบบ native ของผู้ให้บริการ) หรือมี scope `operator.admin` ภายในบนช่องทางข้อความภายใน รายการ wildcard ใน `allowFrom` ของช่องทาง หรือรายการผู้สมัครเจ้าของที่ว่าง/resolve ไม่ได้ **ไม่** เพียงพอ คำสั่งเฉพาะเจ้าของจะล้มเหลวแบบปิดบนช่องทางนั้น ปล่อยค่านี้ปิดไว้หากคุณต้องการให้คำสั่งเฉพาะเจ้าของถูกควบคุมเฉพาะโดย `ownerAllowFrom` และ allowlist คำสั่งมาตรฐาน
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  ควบคุมวิธีที่ owner id ปรากฏใน system prompt
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  ตั้งค่า secret ของ HMAC ที่ใช้เมื่อ `commands.ownerDisplay="hash"` แบบไม่บังคับ
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  allowlist รายผู้ให้บริการสำหรับการอนุญาตคำสั่ง เมื่อกำหนดค่าไว้ ค่านี้จะเป็นแหล่งการอนุญาตเดียวสำหรับคำสั่งและ directive (allowlist/การจับคู่ของช่องทางและ `commands.useAccessGroups` จะถูกละเว้น) ใช้ `"*"` สำหรับค่าเริ่มต้นทั่วโลก; คีย์เฉพาะผู้ให้บริการจะ override ค่านี้
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  บังคับใช้ allowlist/นโยบายสำหรับคำสั่งเมื่อไม่ได้ตั้งค่า `commands.allowFrom`
</ParamField>

## รายการคำสั่ง

แหล่งข้อมูลจริงปัจจุบัน:

- built-in หลักมาจาก `src/auto-reply/commands-registry.shared.ts`
- คำสั่ง dock ที่สร้างขึ้นมาจาก `src/auto-reply/commands-registry.data.ts`
- คำสั่ง plugin มาจากการเรียก `registerCommand()` ของ plugin
- ความพร้อมใช้งานจริงบน gateway ของคุณยังขึ้นอยู่กับ flag การกำหนดค่า พื้นผิวช่องทาง และ plugin ที่ติดตั้ง/เปิดใช้งาน

### คำสั่ง built-in หลัก

<AccordionGroup>
  <Accordion title="เซสชันและการรัน">
    - `/new [model]` เริ่มเซสชันใหม่; `/reset` คือ alias สำหรับรีเซ็ต
    - Control UI จะดักจับ `/new` ที่พิมพ์เพื่อสร้างและสลับไปยังเซสชันแดชบอร์ดใหม่; `/reset` ที่พิมพ์ยังคงรันการรีเซ็ตแบบอยู่ที่เดิมของ Gateway
    - `/reset soft [message]` เก็บ transcript ปัจจุบันไว้ ทิ้ง id เซสชัน CLI backend ที่นำกลับมาใช้ซ้ำ และรันการโหลด startup/system-prompt ใหม่ในที่เดิม
    - `/compact [instructions]` ทำ compact บริบทของเซสชัน ดู [Compaction](/th/concepts/compaction)
    - `/stop` ยกเลิกการรันปัจจุบัน
    - `/session idle <duration|off>` และ `/session max-age <duration|off>` จัดการการหมดอายุของการผูกเธรด
    - `/export-session [path]` ส่งออกเซสชันปัจจุบันเป็น HTML Alias: `/export`
    - `/export-trajectory [path]` ขออนุมัติ exec แล้วส่งออก [trajectory bundle](/th/tools/trajectory) แบบ JSONL สำหรับเซสชันปัจจุบัน ใช้เมื่อคุณต้องการไทม์ไลน์ของ prompt, tool และ transcript สำหรับเซสชัน OpenClaw หนึ่งเซสชัน ในแชตกลุ่ม prompt ขออนุมัติและผลลัพธ์การส่งออกจะถูกส่งไปยังเจ้าของแบบส่วนตัว Alias: `/trajectory`

  </Accordion>
  <Accordion title="โมเดลและการควบคุมการรัน">
    - `/think <level>` ตั้งค่าระดับการคิด ตัวเลือกมาจากโปรไฟล์ผู้ให้บริการของโมเดลที่ใช้งานอยู่; ระดับทั่วไปคือ `off`, `minimal`, `low`, `medium` และ `high` โดยมีระดับกำหนดเอง เช่น `xhigh`, `adaptive`, `max` หรือแบบไบนารี `on` เฉพาะเมื่อรองรับ Alias: `/thinking`, `/t`
    - `/verbose on|off|full` สลับเอาต์พุตแบบละเอียด Alias: `/v`
    - `/trace on|off` สลับเอาต์พุต trace ของ plugin สำหรับเซสชันปัจจุบัน
    - `/fast [status|on|off]` แสดงหรือตั้งค่า fast mode
    - `/reasoning [on|off|stream]` สลับการมองเห็น reasoning Alias: `/reason`
    - `/elevated [on|off|ask|full]` สลับ elevated mode Alias: `/elev`
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` แสดงหรือตั้งค่า default ของ exec
    - `/model [name|#|status]` แสดงหรือตั้งค่าโมเดล
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` แสดงรายการผู้ให้บริการที่กำหนดค่าไว้/พร้อมใช้งานด้วย auth หรือโมเดลของผู้ให้บริการ; เพิ่ม `all` เพื่อเรียกดู catalog แบบเต็มของผู้ให้บริการนั้น
    - `/queue <mode>` จัดการพฤติกรรมคิว (`steer`, `queue` เดิม, `followup`, `collect`, `steer-backlog`, `interrupt`) พร้อมตัวเลือก เช่น `debounce:0.5s cap:25 drop:summarize`; `/queue default` หรือ `/queue reset` จะล้าง override ของเซสชัน ดู [Command queue](/th/concepts/queue) และ [Steering queue](/th/concepts/queue-steering)

  </Accordion>
  <Accordion title="การค้นพบและสถานะ">
    - `/help` แสดงสรุปความช่วยเหลือแบบสั้น
    - `/commands` แสดง catalog คำสั่งที่สร้างขึ้น
    - `/tools [compact|verbose]` แสดงสิ่งที่ agent ปัจจุบันสามารถใช้ได้ตอนนี้
    - `/status` แสดงสถานะการดำเนินการ/runtime รวมถึงป้าย `Execution`/`Runtime` และการใช้งาน/โควตาของผู้ให้บริการเมื่อมี
    - `/diagnostics [note]` คือโฟลว์รายงานสนับสนุนเฉพาะเจ้าของสำหรับบั๊กของ Gateway และการรัน Codex harness โดยจะขออนุมัติ exec อย่างชัดเจนทุกครั้งก่อนรัน `openclaw gateway diagnostics export --json`; อย่าอนุมัติ diagnostics ด้วยกฎ allow-all หลังอนุมัติแล้ว จะส่งรายงานที่วางต่อได้พร้อม path ของ bundle ในเครื่อง สรุป manifest หมายเหตุความเป็นส่วนตัว และ id เซสชันที่เกี่ยวข้อง ในแชตกลุ่ม prompt ขออนุมัติและรายงานจะถูกส่งไปยังเจ้าของแบบส่วนตัว เมื่อเซสชันที่ใช้งานอยู่ใช้ OpenAI Codex harness การอนุมัติเดียวกันจะส่ง feedback ของ Codex ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย และคำตอบที่เสร็จแล้วจะแสดง id เซสชัน OpenClaw, id เธรด Codex และคำสั่ง `codex resume <thread-id>` ดู [Diagnostics Export](/th/gateway/diagnostics)
    - `/crestodian <request>` รันตัวช่วยตั้งค่าและซ่อมแซม Crestodian จาก DM ของเจ้าของ
    - `/tasks` แสดงรายการงานเบื้องหลังที่ใช้งานอยู่/ล่าสุดสำหรับเซสชันปัจจุบัน
    - `/context [list|detail|json]` อธิบายวิธีประกอบบริบท
    - `/whoami` แสดง sender id ของคุณ Alias: `/id`
    - `/usage off|tokens|full|cost` ควบคุม footer การใช้งานรายคำตอบ หรือพิมพ์สรุปค่าใช้จ่ายในเครื่อง

  </Accordion>
  <Accordion title="Skills, allowlists, approvals">
    - `/skill <name> [input]` รัน skill ตามชื่อ
    - `/allowlist [list|add|remove] ...` จัดการรายการ allowlist เฉพาะข้อความ
    - `/approve <id> <decision>` จัดการ prompt ขออนุมัติ exec ให้เสร็จสิ้น
    - `/btw <question>` ถามคำถามเสริมโดยไม่เปลี่ยนบริบทเซสชันในอนาคต Alias: `/side` ดู [BTW](/th/tools/btw)

  </Accordion>
  <Accordion title="ตัวแทนย่อยและ ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` จัดการการรันตัวแทนย่อยสำหรับเซสชันปัจจุบัน
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` จัดการเซสชัน ACP และตัวเลือก runtime
    - `/focus <target>` ผูกเธรด Discord หรือหัวข้อ/การสนทนา Telegram ปัจจุบันกับเป้าหมายเซสชัน
    - `/unfocus` นำการผูกปัจจุบันออก
    - `/agents` แสดงรายการตัวแทนที่ผูกกับเธรดสำหรับเซสชันปัจจุบัน
    - `/kill <id|#|all>` ยกเลิกตัวแทนย่อยที่กำลังรันอยู่หนึ่งตัวหรือทั้งหมด
    - `/steer <id|#> <message>` ส่งคำชี้นำไปยังตัวแทนย่อยที่กำลังรันอยู่ ชื่อแฝง: `/tell`

  </Accordion>
  <Accordion title="การเขียนเฉพาะเจ้าของและผู้ดูแลระบบ">
    - `/config show|get|set|unset` อ่านหรือเขียน `openclaw.json` เฉพาะเจ้าของ ต้องใช้ `commands.config: true`
    - `/mcp show|get|set|unset` อ่านหรือเขียนการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers` เฉพาะเจ้าของ ต้องใช้ `commands.mcp: true`
    - `/plugins list|inspect|show|get|install|enable|disable` ตรวจสอบหรือเปลี่ยนสถานะ plugin `/plugin` เป็นชื่อแฝง การเขียนทำได้เฉพาะเจ้าของ ต้องใช้ `commands.plugins: true`
    - `/debug show|set|unset|reset` จัดการการ override การกำหนดค่าเฉพาะ runtime เฉพาะเจ้าของ ต้องใช้ `commands.debug: true`
    - `/restart` รีสตาร์ท OpenClaw เมื่อเปิดใช้ ค่าเริ่มต้น: เปิดใช้; ตั้งค่า `commands.restart: false` เพื่อปิดใช้
    - `/send on|off|inherit` ตั้งค่านโยบายการส่ง เฉพาะเจ้าของ

  </Accordion>
  <Accordion title="เสียง, TTS, การควบคุมช่องทาง">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` ควบคุม TTS ดู [TTS](/th/tools/tts)
    - `/activation mention|always` ตั้งค่าโหมดการเปิดใช้งานแบบกลุ่ม
    - `/bash <command>` รันคำสั่งเชลล์ของโฮสต์ เฉพาะข้อความ ชื่อแฝง: `! <command>` ต้องใช้ `commands.bash: true` พร้อม allowlist ของ `tools.elevated`
    - `!poll [sessionId]` ตรวจสอบงาน bash เบื้องหลัง
    - `!stop [sessionId]` หยุดงาน bash เบื้องหลัง

  </Accordion>
</AccordionGroup>

### คำสั่ง dock ที่สร้างขึ้น

คำสั่ง dock จะสลับเส้นทางตอบกลับของเซสชันปัจจุบันไปยังช่องทางที่เชื่อมโยงไว้อีกช่องทางหนึ่ง ดู [การ dock ช่องทาง](/th/concepts/channel-docking) สำหรับการตั้งค่า ตัวอย่าง และการแก้ไขปัญหา

คำสั่ง dock สร้างจาก plugin ช่องทางที่รองรับ native-command ชุดที่ bundled อยู่ในปัจจุบัน:

- `/dock-discord` (ชื่อแฝง: `/dock_discord`)
- `/dock-mattermost` (ชื่อแฝง: `/dock_mattermost`)
- `/dock-slack` (ชื่อแฝง: `/dock_slack`)
- `/dock-telegram` (ชื่อแฝง: `/dock_telegram`)

ใช้คำสั่ง dock จากแชตส่วนตัวเพื่อสลับเส้นทางตอบกลับของเซสชันปัจจุบันไปยังช่องทางที่เชื่อมโยงไว้อีกช่องทางหนึ่ง ตัวแทนจะคงบริบทเซสชันเดิมไว้ แต่การตอบกลับในอนาคตของเซสชันนั้นจะถูกส่งไปยัง peer ของช่องทางที่เลือก

คำสั่ง dock ต้องใช้ `session.identityLinks` ผู้ส่งต้นทางและ peer เป้าหมายต้องอยู่ในกลุ่มตัวตนเดียวกัน เช่น `["telegram:123", "discord:456"]` หากผู้ใช้ Telegram ที่มี id `123` ส่ง `/dock_discord` OpenClaw จะเก็บ `lastChannel: "discord"` และ `lastTo: "456"` ไว้บนเซสชันที่ใช้งานอยู่ หากผู้ส่งไม่ได้เชื่อมโยงกับ peer ของ Discord คำสั่งจะตอบกลับด้วยคำแนะนำการตั้งค่าแทนที่จะปล่อยให้ผ่านไปยังแชตปกติ

การ dock เปลี่ยนเฉพาะเส้นทางเซสชันที่ใช้งานอยู่เท่านั้น ไม่ได้สร้างบัญชีช่องทาง ไม่ได้ให้สิทธิ์เข้าถึง ไม่ได้ข้าม allowlist ของช่องทาง และไม่ได้ย้ายประวัติ transcript ไปยังเซสชันอื่น ใช้ `/dock-telegram`, `/dock-slack`, `/dock-mattermost` หรือคำสั่ง dock ที่สร้างขึ้นคำสั่งอื่นเพื่อสลับเส้นทางอีกครั้ง

### คำสั่ง bundled plugin

Bundled plugins สามารถเพิ่มคำสั่ง slash ได้อีก คำสั่ง bundled ปัจจุบันใน repo นี้:

- `/dreaming [on|off|status|help]` เปิด/ปิด memory dreaming ดู [Dreaming](/th/concepts/dreaming)
- `/pair [qr|status|pending|approve|cleanup|notify]` จัดการ flow การจับคู่/ตั้งค่าอุปกรณ์ ดู [การจับคู่](/th/channels/pairing)
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arm คำสั่ง phone node ที่มีความเสี่ยงสูงชั่วคราว
- `/voice status|list [limit]|set <voiceId|name>` จัดการการกำหนดค่าเสียง Talk บน Discord ชื่อ native command คือ `/talkvoice`
- `/card ...` ส่งพรีเซ็ต rich card ของ LINE ดู [LINE](/th/channels/line)
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` ตรวจสอบและควบคุม app-server harness ของ Codex ที่ bundled อยู่ ดู [Codex harness](/th/plugins/codex-harness)
- คำสั่งเฉพาะ QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### คำสั่ง skill แบบไดนามิก

Skill ที่ผู้ใช้เรียกได้จะแสดงเป็นคำสั่ง slash ด้วย:

- `/skill <name> [input]` ใช้งานได้เสมอในฐานะ entrypoint ทั่วไป
- skills อาจปรากฏเป็นคำสั่งโดยตรงอย่าง `/prose` เมื่อ skill/plugin ลงทะเบียนไว้
- การลงทะเบียน native skill-command ควบคุมโดย `commands.nativeSkills` และ `channels.<provider>.commands.nativeSkills`
- สเปกคำสั่งสามารถระบุ `descriptionLocalizations` สำหรับ native surfaces ที่รองรับคำอธิบายแบบ localized รวมถึง Discord

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับอาร์กิวเมนต์และ parser">
    - คำสั่งยอมรับ `:` แบบไม่บังคับระหว่างคำสั่งและ args (เช่น `/think: high`, `/send: on`, `/help:`)
    - `/new <model>` ยอมรับ alias ของ model, `provider/model` หรือชื่อ provider (fuzzy match); หากไม่พบรายการที่ตรงกัน ข้อความจะถูกถือเป็นเนื้อหาข้อความ
    - สำหรับรายละเอียดการใช้งาน provider แบบครบถ้วน ใช้ `openclaw status --usage`
    - `/allowlist add|remove` ต้องใช้ `commands.config=true` และเคารพ `configWrites` ของช่องทาง
    - ในช่องทางแบบหลายบัญชี `/allowlist --account <id>` ที่กำหนดเป้าหมาย config และ `/config set channels.<provider>.accounts.<id>...` จะเคารพ `configWrites` ของบัญชีเป้าหมายด้วย
    - `/usage` ควบคุม footer การใช้งานต่อการตอบกลับ; `/usage cost` พิมพ์สรุปค่าใช้จ่ายภายในเครื่องจาก log เซสชันของ OpenClaw
    - `/restart` เปิดใช้ตามค่าเริ่มต้น; ตั้งค่า `commands.restart: false` เพื่อปิดใช้
    - `/plugins install <spec>` ยอมรับสเปก plugin เดียวกับ `openclaw plugins install`: path/archive ภายในเครื่อง, package npm, `git:<repo>` หรือ `clawhub:<pkg>` จากนั้นร้องขอการรีสตาร์ท Gateway เพราะโมดูลซอร์สของ plugin เปลี่ยนไป
    - `/plugins enable|disable` อัปเดตการกำหนดค่า plugin และเรียกการโหลด plugin ของ Gateway ใหม่สำหรับ agent turn ใหม่

  </Accordion>
  <Accordion title="พฤติกรรมเฉพาะช่องทาง">
    - native command เฉพาะ Discord: `/vc join|leave|status` ควบคุมช่องเสียง (ใช้เป็นข้อความไม่ได้) `join` ต้องมี guild และช่องเสียง/stage ที่เลือก ต้องใช้ `channels.discord.voice` และ native commands
    - คำสั่งผูกเธรดของ Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) ต้องเปิดใช้การผูกเธรดที่มีผล (`session.threadBindings.enabled` และ/หรือ `channels.discord.threadBindings.enabled`)
    - เอกสารอ้างอิงคำสั่ง ACP และพฤติกรรม runtime: [ตัวแทน ACP](/th/tools/acp-agents)

  </Accordion>
  <Accordion title="ความปลอดภัยของ verbose / trace / fast / reasoning">
    - `/verbose` มีไว้สำหรับการดีบักและการมองเห็นเพิ่มเติม; ให้ **ปิด** ไว้ในการใช้งานปกติ
    - `/trace` แคบกว่า `/verbose`: จะแสดงเฉพาะบรรทัด trace/debug ที่ plugin เป็นเจ้าของ และปิดข้อความเครื่องมือ verbose ปกติไว้
    - `/fast on|off` คงค่า override ของเซสชันไว้ ใช้ตัวเลือก `inherit` ใน UI Sessions เพื่อล้างค่าและกลับไปใช้ค่าเริ่มต้นจาก config
    - `/fast` ขึ้นกับ provider: OpenAI/OpenAI Codex map ไปเป็น `service_tier=priority` บน native Responses endpoints ขณะที่คำขอ Anthropic สาธารณะโดยตรง รวมถึง traffic ที่ตรวจสอบสิทธิ์ด้วย OAuth ที่ส่งไปยัง `api.anthropic.com` map ไปเป็น `service_tier=auto` หรือ `standard_only` ดู [OpenAI](/th/providers/openai) และ [Anthropic](/th/providers/anthropic)
    - สรุปความล้มเหลวของเครื่องมือยังแสดงเมื่อเกี่ยวข้อง แต่ข้อความความล้มเหลวแบบละเอียดจะรวมไว้เฉพาะเมื่อ `/verbose` เป็น `on` หรือ `full`
    - `/reasoning`, `/verbose` และ `/trace` มีความเสี่ยงในสภาพแวดล้อมกลุ่ม: อาจเปิดเผย reasoning ภายใน output ของเครื่องมือ หรือ diagnostics ของ plugin ที่คุณไม่ได้ตั้งใจเปิดเผย ควรปล่อยให้ปิดไว้ โดยเฉพาะในแชตกลุ่ม

  </Accordion>
  <Accordion title="การสลับ model">
    - `/model` คงค่า model ใหม่ของเซสชันทันที
    - หาก agent ว่าง การรันครั้งถัดไปจะใช้ทันที
    - หากมีการรันที่ใช้งานอยู่แล้ว OpenClaw จะทำเครื่องหมาย live switch เป็น pending และจะรีสตาร์ทเข้าสู่ model ใหม่เฉพาะที่จุด retry ที่สะอาด
    - หากกิจกรรมเครื่องมือหรือ output การตอบกลับเริ่มไปแล้ว การสลับที่ pending อาจค้างอยู่ในคิวจนกว่าจะมีโอกาส retry ภายหลังหรือ user turn ถัดไป
    - ใน TUI ภายในเครื่อง `/crestodian [request]` จะกลับจาก TUI ของ agent ปกติไปยัง Crestodian สิ่งนี้แยกจากโหมด rescue ของช่องทางข้อความ และไม่ได้ให้สิทธิ์ config ระยะไกล

  </Accordion>
  <Accordion title="Fast path และ shortcut แบบ inline">
    - **Fast path:** ข้อความที่เป็นคำสั่งอย่างเดียวจากผู้ส่งใน allowlist จะถูกจัดการทันที (ข้ามคิว + model)
    - **การกั้นด้วย mention ในกลุ่ม:** ข้อความที่เป็นคำสั่งอย่างเดียวจากผู้ส่งใน allowlist จะข้ามข้อกำหนด mention
    - **Shortcut แบบ inline (เฉพาะผู้ส่งใน allowlist):** คำสั่งบางคำสั่งยังทำงานได้เมื่อฝังอยู่ในข้อความปกติ และจะถูกตัดออกก่อนที่ model จะเห็นข้อความที่เหลือ
      - ตัวอย่าง: `hey /status` เรียกการตอบกลับสถานะ และข้อความที่เหลือจะดำเนินต่อผ่าน flow ปกติ
    - ปัจจุบัน: `/help`, `/commands`, `/status`, `/whoami` (`/id`)
    - ข้อความที่เป็นคำสั่งอย่างเดียวจากผู้ที่ไม่ได้รับอนุญาตจะถูกละเว้นอย่างเงียบ ๆ และ token `/...` แบบ inline จะถูกถือเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="คำสั่ง Skill และ native arguments">
    - **คำสั่ง Skill:** skills แบบ `user-invocable` จะแสดงเป็นคำสั่ง slash ชื่อจะถูก sanitize เป็น `a-z0-9_` (สูงสุด 32 chars); ชื่อที่ชนกันจะได้ suffix เป็นตัวเลข (เช่น `_2`)
      - `/skill <name> [input]` รัน skill ตามชื่อ (มีประโยชน์เมื่อข้อจำกัด native command ทำให้มีคำสั่งต่อ skill ไม่ได้)
      - ตามค่าเริ่มต้น คำสั่ง skill จะถูกส่งต่อไปยัง model เป็นคำขอปกติ
      - Skills อาจประกาศ `command-dispatch: tool` เป็นทางเลือก เพื่อ route คำสั่งไปยังเครื่องมือโดยตรง (กำหนดผลแน่นอน, ไม่ใช้ model)
      - ตัวอย่าง: `/prose` (OpenProse plugin) — ดู [OpenProse](/th/prose)
    - **อาร์กิวเมนต์ native command:** Discord ใช้ autocomplete สำหรับตัวเลือกแบบไดนามิก (และเมนูปุ่มเมื่อคุณละเว้น args ที่จำเป็น) Telegram และ Slack แสดงเมนูปุ่มเมื่อคำสั่งรองรับตัวเลือกและคุณละเว้น arg ตัวเลือกแบบไดนามิกจะถูก resolve เทียบกับ model ของเซสชันเป้าหมาย ดังนั้นตัวเลือกเฉพาะ model เช่นระดับ `/think` จะตาม override `/model` ของเซสชันนั้น

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` ตอบคำถาม runtime ไม่ใช่คำถาม config: **agent นี้ใช้อะไรได้ในตอนนี้ในบทสนทนานี้**

- `/tools` ค่าเริ่มต้นกระชับและปรับให้เหมาะกับการสแกนอย่างรวดเร็ว
- `/tools verbose` เพิ่มคำอธิบายสั้น ๆ
- native-command surfaces ที่รองรับอาร์กิวเมนต์จะแสดง mode switch เดียวกันเป็น `compact|verbose`
- ผลลัพธ์เป็นแบบ scoped ตามเซสชัน ดังนั้นการเปลี่ยน agent, ช่องทาง, เธรด, การอนุญาตผู้ส่ง หรือ model อาจเปลี่ยน output ได้
- `/tools` รวมเครื่องมือที่เข้าถึงได้จริงใน runtime รวมถึง core tools, เครื่องมือ plugin ที่เชื่อมต่อ และเครื่องมือที่ช่องทางเป็นเจ้าของ

สำหรับการแก้ไข profile และ override ให้ใช้แผง Control UI Tools หรือพื้นผิว config/catalog แทนการถือว่า `/tools` เป็น catalog แบบคงที่

## พื้นผิวการใช้งาน (สิ่งที่แสดงที่ไหน)

- **การใช้งาน/โควตาของ provider** (ตัวอย่าง: "Claude 80% left") แสดงใน `/status` สำหรับ model provider ปัจจุบันเมื่อเปิดใช้การติดตามการใช้งาน OpenClaw ปรับหน้าต่างเวลาของ provider ให้เป็น `% left`; สำหรับ MiniMax ฟิลด์เปอร์เซ็นต์ที่มีเฉพาะค่าคงเหลือจะถูกกลับค่าก่อนแสดงผล และการตอบกลับ `model_remains` จะให้ความสำคัญกับรายการ chat-model พร้อมป้ายกำกับแผนที่ติดแท็ก model
- **บรรทัด token/cache** ใน `/status` สามารถ fallback ไปยังรายการการใช้งาน transcript ล่าสุดเมื่อ snapshot ของเซสชันสดมีข้อมูลไม่ครบถ้วน ค่าสดที่ไม่เป็นศูนย์ซึ่งมีอยู่ยังคงมีสิทธิ์เหนือกว่า และ transcript fallback ยังสามารถกู้คืนป้ายกำกับ runtime model ที่ใช้งานอยู่พร้อมยอดรวมแบบเน้น prompt ที่ใหญ่กว่าเมื่อยอดรวมที่เก็บไว้หายไปหรือเล็กกว่า
- **Execution เทียบกับ runtime:** `/status` รายงาน `Execution` สำหรับเส้นทาง sandbox ที่มีผล และ `Runtime` สำหรับผู้ที่กำลังรันเซสชันจริง: `OpenClaw Pi Default`, `OpenAI Codex`, backend ของ CLI หรือ backend ของ ACP
- **Token/ค่าใช้จ่ายต่อการตอบกลับ** ควบคุมด้วย `/usage off|tokens|full` (ต่อท้ายการตอบกลับปกติ)
- `/model status` เกี่ยวกับ **models/auth/endpoints** ไม่ใช่การใช้งาน

## การเลือก model (`/model`)

`/model` ถูก implement เป็น directive

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

- `/model` และ `/model list` แสดงตัวเลือกแบบย่อที่มีหมายเลข (ตระกูล model + provider ที่พร้อมใช้งาน)
- บน Discord, `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบพร้อม dropdown ของ provider และ model รวมถึงขั้นตอน Submit
- `/model <#>` เลือกจากตัวเลือกนั้น (และให้ความสำคัญกับ provider ปัจจุบันเมื่อเป็นไปได้)
- `/model status` แสดงมุมมองแบบละเอียด รวมถึง endpoint ของ provider ที่กำหนดค่าไว้ (`baseUrl`) และโหมด API (`api`) เมื่อมี

## การ override เพื่อ debug

`/debug` ให้คุณตั้งค่า override config แบบ **runtime-only** (ในหน่วยความจำ ไม่ใช่บนดิสก์) เฉพาะ owner เท่านั้น ปิดไว้โดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.debug: true`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Override จะมีผลทันทีกับการอ่าน config ใหม่ แต่จะ **ไม่** เขียนลง `openclaw.json` ใช้ `/debug reset` เพื่อล้าง override ทั้งหมดและกลับไปใช้ config บนดิสก์
</Note>

## เอาต์พุต trace ของ Plugin

`/trace` ให้คุณสลับ **บรรทัด trace/debug ของ Plugin ตามขอบเขตเซสชัน** โดยไม่ต้องเปิดโหมด verbose เต็มรูปแบบ

ตัวอย่าง:

```text
/trace
/trace on
/trace off
```

หมายเหตุ:

- `/trace` ที่ไม่มี argument จะแสดงสถานะ trace ของเซสชันปัจจุบัน
- `/trace on` เปิดใช้บรรทัด trace ของ Plugin สำหรับเซสชันปัจจุบัน
- `/trace off` ปิดใช้อีกครั้ง
- บรรทัด trace ของ Plugin สามารถปรากฏใน `/status` และเป็นข้อความวินิจฉัยติดตามผลหลังการตอบกลับปกติของผู้ช่วย
- `/trace` ไม่ได้แทนที่ `/debug`; `/debug` ยังคงจัดการ override config แบบ runtime-only
- `/trace` ไม่ได้แทนที่ `/verbose`; เอาต์พุต verbose ปกติของ tool/status ยังคงเป็นของ `/verbose`

## การอัปเดต config

`/config` เขียนไปยัง config บนดิสก์ของคุณ (`openclaw.json`) เฉพาะ owner เท่านั้น ปิดไว้โดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.config: true`

ตัวอย่าง:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Config จะถูกตรวจสอบความถูกต้องก่อนเขียน; การเปลี่ยนแปลงที่ไม่ถูกต้องจะถูกปฏิเสธ การอัปเดต `/config` จะคงอยู่ข้ามการรีสตาร์ท
</Note>

## การอัปเดต MCP

`/mcp` เขียนคำจำกัดความของ MCP server ที่ OpenClaw จัดการภายใต้ `mcp.servers` เฉพาะ owner เท่านั้น ปิดไว้โดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.mcp: true`

ตัวอย่าง:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` เก็บ config ใน OpenClaw config ไม่ใช่การตั้งค่าโปรเจกต์ที่ Pi เป็นเจ้าของ Runtime adapters จะตัดสินใจว่า transport ใดสามารถ execute ได้จริง
</Note>

## การอัปเดต Plugin

`/plugins` ให้ operator ตรวจสอบ plugin ที่ค้นพบและสลับการเปิดใช้ใน config ได้ flow แบบอ่านอย่างเดียวสามารถใช้ `/plugin` เป็น alias ได้ ปิดไว้โดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.plugins: true`

ตัวอย่าง:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` และ `/plugins show` ใช้การค้นพบ plugin จริงกับ workspace ปัจจุบันพร้อม config บนดิสก์
- `/plugins install` ติดตั้งจาก ClawHub, npm, git, ไดเรกทอรี local และ archive
- `/plugins enable|disable` อัปเดตเฉพาะ config ของ plugin; ไม่ได้ติดตั้งหรือถอนการติดตั้ง plugin
- การเปลี่ยนแปลง enable และ disable จะ hot-reload พื้นผิว runtime ของ Gateway plugin สำหรับ agent turn ใหม่; install จะขอให้รีสตาร์ท Gateway เพราะโมดูลซอร์สของ plugin เปลี่ยนไป

</Note>

## หมายเหตุเกี่ยวกับพื้นผิว

<AccordionGroup>
  <Accordion title="เซสชันต่อพื้นผิว">
    - **คำสั่งข้อความ** รันในเซสชันแชตปกติ (DM แชร์ `main`, กลุ่มมีเซสชันของตนเอง)
    - **คำสั่ง native** ใช้เซสชันที่แยกออกมา:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (กำหนด prefix ได้ผ่าน `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (กำหนดเป้าหมายไปยังเซสชันแชตผ่าน `CommandTargetSessionKey`)
    - **`/stop`** กำหนดเป้าหมายไปยังเซสชันแชตที่ใช้งานอยู่เพื่อให้สามารถยกเลิกการรันปัจจุบันได้

  </Accordion>
  <Accordion title="รายละเอียดเฉพาะของ Slack">
    `channels.slack.slashCommand` ยังคงรองรับสำหรับคำสั่งสไตล์ `/openclaw` เดี่ยว หากคุณเปิดใช้ `commands.native` คุณต้องสร้าง Slack slash command หนึ่งรายการต่อคำสั่งในตัวแต่ละคำสั่ง (ชื่อเดียวกับ `/help`) เมนู argument ของคำสั่งสำหรับ Slack จะถูกส่งเป็นปุ่ม Block Kit แบบ ephemeral

    ข้อยกเว้น native ของ Slack: ลงทะเบียน `/agentstatus` (ไม่ใช่ `/status`) เพราะ Slack สงวน `/status` ไว้ ข้อความ `/status` ยังคงใช้งานได้ในข้อความ Slack

  </Accordion>
</AccordionGroup>

## คำถามเสริม BTW

`/btw` เป็น **คำถามเสริม** แบบรวดเร็วเกี่ยวกับเซสชันปัจจุบัน `/side` เป็น alias

ต่างจากแชตปกติ:

- ใช้เซสชันปัจจุบันเป็นบริบทพื้นหลัง
- รันเป็นการเรียกแบบครั้งเดียวที่ **ไม่มี tool** แยกต่างหาก
- ไม่เปลี่ยนบริบทของเซสชันในอนาคต
- ไม่ถูกเขียนลงประวัติ transcript
- ถูกส่งเป็นผลลัพธ์เสริมแบบสดแทนข้อความผู้ช่วยปกติ

สิ่งนี้ทำให้ `/btw` มีประโยชน์เมื่อคุณต้องการคำชี้แจงชั่วคราวในขณะที่งานหลักยังดำเนินต่อไป

ตัวอย่าง:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

ดู [คำถามเสริม BTW](/th/tools/btw) สำหรับรายละเอียดพฤติกรรมและ UX ของ client ฉบับเต็ม

## ที่เกี่ยวข้อง

- [การสร้าง Skills](/th/tools/creating-skills)
- [Skills](/th/tools/skills)
- [config ของ Skills](/th/tools/skills-config)
