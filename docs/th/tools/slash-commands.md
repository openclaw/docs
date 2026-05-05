---
read_when:
    - การใช้หรือกำหนดค่าคำสั่งแชท
    - การดีบักการกำหนดเส้นทางคำสั่งหรือสิทธิ์
sidebarTitle: Slash commands
summary: 'คำสั่งแบบสแลช: แบบข้อความเทียบกับแบบเนทีฟ การกำหนดค่า และคำสั่งที่รองรับ'
title: คำสั่งแบบสแลช
x-i18n:
    generated_at: "2026-05-05T06:19:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a0234bd94cafe242fc692a5b9d457047e483e2a434cc92ab26046e6ddec55ce
    source_path: tools/slash-commands.md
    workflow: 16
---

คำสั่งได้รับการจัดการโดย Gateway คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความแบบ **standalone** ที่ขึ้นต้นด้วย `/` คำสั่งแชต bash สำหรับโฮสต์เท่านั้นใช้ `! <cmd>` (โดยมี `/bash <cmd>` เป็น alias)

เมื่อการสนทนาหรือเธรดถูกผูกกับเซสชัน ACP ข้อความติดตามผลตามปกติจะถูกส่งไปยัง ACP harness นั้น คำสั่งจัดการ Gateway ยังคงอยู่ในเครื่อง: `/acp ...` จะไปถึงตัวจัดการคำสั่ง OpenClaw ACP เสมอ และ `/status` พร้อมกับ `/unfocus` จะอยู่ในเครื่องเสมอเมื่อเปิดใช้งานการจัดการคำสั่งสำหรับพื้นผิวนั้น

มีระบบที่เกี่ยวข้องกันสองระบบ:

<AccordionGroup>
  <Accordion title="คำสั่ง">
    ข้อความ standalone `/...`
  </Accordion>
  <Accordion title="Directive">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Directive จะถูกตัดออกจากข้อความก่อนที่โมเดลจะเห็น
    - ในข้อความแชตปกติ (ไม่ใช่ directive-only) ระบบจะถือว่าเป็น "คำใบ้แบบอินไลน์" และจะ **ไม่** คงการตั้งค่าเซสชันไว้
    - ในข้อความ directive-only (ข้อความมีเฉพาะ directive) ระบบจะคงค่าไว้กับเซสชันและตอบกลับด้วยการยืนยัน
    - Directive จะถูกนำไปใช้เฉพาะกับ **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น หากตั้งค่า `commands.allowFrom` ไว้ ค่านี้จะเป็น allowlist เดียวที่ใช้ มิฉะนั้นการอนุญาตจะมาจาก allowlist/การจับคู่ของช่องทางรวมกับ `commands.useAccessGroups` ผู้ส่งที่ไม่ได้รับอนุญาตจะเห็น directive ถูกปฏิบัติเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="ทางลัดอินไลน์">
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
  เปิดใช้งานการแยกวิเคราะห์ `/...` ในข้อความแชต บนพื้นผิวที่ไม่มีคำสั่งแบบ native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) คำสั่งข้อความยังคงทำงานแม้คุณตั้งค่านี้เป็น `false`
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่งแบบ native Auto: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (จนกว่าคุณจะเพิ่ม slash commands); ถูกละเว้นสำหรับ provider ที่ไม่มีการรองรับ native ตั้งค่า `channels.discord.commands.native`, `channels.telegram.commands.native` หรือ `channels.slack.commands.native` เพื่อ override ต่อ provider (bool หรือ `"auto"`) บน Discord ค่า `false` จะข้ามการลงทะเบียน slash-command และการล้างข้อมูลระหว่างเริ่มต้นระบบ คำสั่งที่เคยลงทะเบียนไว้อาจยังมองเห็นได้จนกว่าคุณจะลบออกจากแอป Discord คำสั่ง Slack จัดการในแอป Slack และจะไม่ถูกลบโดยอัตโนมัติ
</ParamField>
บน Discord ข้อกำหนดคำสั่งแบบ native อาจรวม `descriptionLocalizations` ซึ่ง OpenClaw เผยแพร่เป็น Discord `description_localizations` และรวมไว้ในการเปรียบเทียบ reconcile
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่ง **skill** แบบ native เมื่อรองรับ Auto: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (Slack ต้องสร้าง slash command แยกต่อ skill) ตั้งค่า `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` หรือ `channels.slack.commands.nativeSkills` เพื่อ override ต่อ provider (bool หรือ `"auto"`)
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  เปิดใช้งาน `! <cmd>` เพื่อรันคำสั่ง shell ของโฮสต์ (`/bash <cmd>` เป็น alias; ต้องใช้ allowlist ของ `tools.elevated`)
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  ควบคุมระยะเวลาที่ bash รอก่อนสลับไปโหมดเบื้องหลัง (`0` จะส่งไปเบื้องหลังทันที)
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  เปิดใช้งาน `/config` (อ่าน/เขียน `openclaw.json`)
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  เปิดใช้งาน `/mcp` (อ่าน/เขียนการกำหนดค่า MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`)
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  เปิดใช้งาน `/plugins` (การค้นหา/สถานะ Plugin พร้อมการติดตั้งและตัวควบคุมเปิด/ปิด)
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  เปิดใช้งาน `/debug` (override เฉพาะ runtime)
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  เปิดใช้งาน `/restart` พร้อมการกระทำของเครื่องมือเพื่อ restart gateway
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  ตั้งค่า allowlist เจ้าของอย่างชัดเจนสำหรับพื้นผิวคำสั่ง/เครื่องมือที่จำกัดเฉพาะเจ้าของ นี่คือบัญชีผู้ปฏิบัติงานมนุษย์ที่สามารถอนุมัติการกระทำอันตรายและรันคำสั่ง เช่น `/diagnostics`, `/export-trajectory` และ `/config` ค่านี้แยกจาก `commands.allowFrom` และจากการเข้าถึงด้วยการจับคู่ DM
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  ต่อช่องทาง: ทำให้คำสั่งที่จำกัดเฉพาะเจ้าของต้องใช้ **ตัวตนเจ้าของ** เพื่อรันบนพื้นผิวนั้น เมื่อเป็น `true` ผู้ส่งต้องตรงกับ candidate เจ้าของที่ resolve แล้ว (เช่น รายการใน `commands.ownerAllowFrom` หรือ metadata เจ้าของแบบ provider-native) หรือมี scope ภายใน `operator.admin` บนช่องทางข้อความภายใน รายการ wildcard ใน `allowFrom` ของช่องทาง หรือรายการ owner-candidate ที่ว่าง/resolve ไม่ได้ **ไม่** เพียงพอ — คำสั่งที่จำกัดเฉพาะเจ้าของจะ fail closed บนช่องทางนั้น ปิดค่านี้ไว้หากคุณต้องการให้คำสั่งที่จำกัดเฉพาะเจ้าของถูก gate เฉพาะด้วย `ownerAllowFrom` และ allowlist คำสั่งมาตรฐาน
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  ควบคุมวิธีที่ id เจ้าของปรากฏใน system prompt
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  ตั้งค่า HMAC secret ที่ใช้เมื่อ `commands.ownerDisplay="hash"` ได้ตามต้องการ
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Allowlist ต่อ provider สำหรับการอนุญาตคำสั่ง เมื่อกำหนดค่าไว้ ค่านี้จะเป็นแหล่งการอนุญาตเดียวสำหรับคำสั่งและ directive (allowlist/การจับคู่ของช่องทางและ `commands.useAccessGroups` จะถูกละเว้น) ใช้ `"*"` สำหรับค่าเริ่มต้นส่วนกลาง คีย์เฉพาะ provider จะ override ค่านั้น
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  บังคับใช้ allowlist/นโยบายสำหรับคำสั่งเมื่อไม่ได้ตั้งค่า `commands.allowFrom`
</ParamField>

## รายการคำสั่ง

แหล่งข้อมูลจริงปัจจุบัน:

- built-ins หลักมาจาก `src/auto-reply/commands-registry.shared.ts`
- คำสั่ง dock ที่สร้างขึ้นมาจาก `src/auto-reply/commands-registry.data.ts`
- คำสั่ง Plugin มาจากการเรียก `registerCommand()` ของ Plugin
- ความพร้อมใช้งานจริงบน gateway ของคุณยังขึ้นอยู่กับ flag การกำหนดค่า พื้นผิวช่องทาง และ Plugin ที่ติดตั้ง/เปิดใช้งาน

### คำสั่ง built-in หลัก

<AccordionGroup>
  <Accordion title="เซสชันและการรัน">
    - `/new [model]` เริ่มเซสชันใหม่; `/reset` คือ alias สำหรับ reset
    - Control UI ดักจับ `/new` ที่พิมพ์เพื่อสร้างและสลับไปยังเซสชันแดชบอร์ดใหม่; `/reset` ที่พิมพ์ยังคงรันการ reset แบบ in-place ของ Gateway
    - `/reset soft [message]` เก็บ transcript ปัจจุบันไว้ ลบ CLI backend session ids ที่นำมาใช้ซ้ำ และรันการโหลด startup/system-prompt ใหม่แบบ in-place
    - `/compact [instructions]` compact บริบทเซสชัน ดู [Compaction](/th/concepts/compaction)
    - `/stop` ยกเลิกการรันปัจจุบัน
    - `/session idle <duration|off>` และ `/session max-age <duration|off>` จัดการการหมดอายุของการผูกเธรด
    - `/export-session [path]` ส่งออกเซสชันปัจจุบันเป็น HTML Alias: `/export`
    - `/export-trajectory [path]` ขอการอนุมัติ exec จากนั้นส่งออก [trajectory bundle](/th/tools/trajectory) แบบ JSONL สำหรับเซสชันปัจจุบัน ใช้เมื่อคุณต้องการ timeline ของ prompt, tool และ transcript สำหรับเซสชัน OpenClaw หนึ่งเซสชัน ในแชตกลุ่ม prompt การอนุมัติและผลการส่งออกจะถูกส่งไปหาเจ้าของแบบส่วนตัว Alias: `/trajectory`

  </Accordion>
  <Accordion title="โมเดลและตัวควบคุมการรัน">
    - `/think <level>` ตั้งค่าระดับการคิด ตัวเลือกมาจาก profile provider ของโมเดลที่ใช้งานอยู่ ระดับทั่วไปคือ `off`, `minimal`, `low`, `medium` และ `high` พร้อมระดับกำหนดเอง เช่น `xhigh`, `adaptive`, `max` หรือ binary `on` เฉพาะที่รองรับเท่านั้น Aliases: `/thinking`, `/t`
    - `/verbose on|off|full` สลับ verbose output Alias: `/v`
    - `/trace on|off` สลับ plugin trace output สำหรับเซสชันปัจจุบัน
    - `/fast [status|on|off]` แสดงหรือตั้งค่า fast mode
    - `/reasoning [on|off|stream]` สลับการมองเห็น reasoning Alias: `/reason`
    - `/elevated [on|off|ask|full]` สลับ elevated mode Alias: `/elev`
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` แสดงหรือตั้งค่า exec defaults
    - `/model [name|#|status]` แสดงหรือตั้งค่าโมเดล
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` แสดงรายการ provider ที่กำหนดค่าไว้/มี auth พร้อมใช้งาน หรือโมเดลสำหรับ provider; เพิ่ม `all` เพื่อเรียกดู catalog ทั้งหมดของ provider นั้น
    - `/queue <mode>` จัดการพฤติกรรม queue (`steer`, legacy `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) พร้อมตัวเลือก เช่น `debounce:0.5s cap:25 drop:summarize`; `/queue default` หรือ `/queue reset` ล้าง session override ดู [Command queue](/th/concepts/queue) และ [Steering queue](/th/concepts/queue-steering)
    - `/steer <message>` แทรกคำแนะนำในการรันที่ใช้งานอยู่สำหรับเซสชันปัจจุบัน โดยไม่ขึ้นกับโหมด `/queue` คำสั่งนี้จะไม่เริ่มการรันใหม่เมื่อเซสชันว่างอยู่ Alias: `/tell` ดู [Steer](/th/tools/steer)

  </Accordion>
  <Accordion title="การค้นพบและสถานะ">
    - `/help` แสดงสรุปความช่วยเหลือแบบสั้น
    - `/commands` แสดง catalog คำสั่งที่สร้างขึ้น
    - `/tools [compact|verbose]` แสดงสิ่งที่ agent ปัจจุบันสามารถใช้ได้ในตอนนี้
    - `/status` แสดงสถานะ execution/runtime, uptime ของ Gateway และระบบ พร้อม usage/quota ของ provider เมื่อมี
    - `/diagnostics [note]` คือ flow รายงานสนับสนุนที่จำกัดเฉพาะเจ้าของสำหรับบั๊ก Gateway และการรัน Codex harness คำสั่งนี้จะขอการอนุมัติ exec อย่างชัดเจนทุกครั้งก่อนรัน `openclaw gateway diagnostics export --json`; อย่าอนุมัติ diagnostics ด้วยกฎ allow-all หลังอนุมัติแล้ว ระบบจะส่งรายงานที่วางต่อได้ ซึ่งมี path bundle ในเครื่อง สรุป manifest หมายเหตุความเป็นส่วนตัว และ session ids ที่เกี่ยวข้อง ในแชตกลุ่ม prompt การอนุมัติและรายงานจะถูกส่งไปหาเจ้าของแบบส่วนตัว เมื่อเซสชันที่ใช้งานอยู่ใช้ OpenAI Codex harness การอนุมัติเดียวกันจะส่ง feedback ของ Codex ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย และคำตอบที่เสร็จสิ้นจะแสดง OpenClaw session ids, Codex thread ids และคำสั่ง `codex resume <thread-id>` ดู [Diagnostics Export](/th/gateway/diagnostics)
    - `/crestodian <request>` รันตัวช่วยตั้งค่าและซ่อมแซม Crestodian จาก DM ของเจ้าของ
    - `/tasks` แสดงรายการงานเบื้องหลังที่ใช้งานอยู่/ล่าสุดสำหรับเซสชันปัจจุบัน
    - `/context [list|detail|json]` อธิบายวิธีประกอบ context
    - `/whoami` แสดง sender id ของคุณ Alias: `/id`
    - `/usage off|tokens|full|cost` ควบคุม footer usage ต่อคำตอบ หรือพิมพ์สรุปค่าใช้จ่ายในเครื่อง

  </Accordion>
  <Accordion title="Skills, allowlist, การอนุมัติ">
    - `/skill <name> [input]` รัน skill ตามชื่อ
    - `/allowlist [list|add|remove] ...` จัดการรายการ allowlist เฉพาะข้อความ
    - `/approve <id> <decision>` resolve prompt การอนุมัติ exec
    - `/btw <question>` ถามคำถามข้างเคียงโดยไม่เปลี่ยนบริบทเซสชันในอนาคต Alias: `/side` ดู [BTW](/th/tools/btw)

  </Accordion>
  <Accordion title="ซับเอเจนต์และ ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` จัดการการรันซับเอเจนต์สำหรับเซสชันปัจจุบัน
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` จัดการเซสชัน ACP และตัวเลือกรันไทม์
    - `/focus <target>` ผูกเธรด Discord หรือหัวข้อ/การสนทนา Telegram ปัจจุบันกับเป้าหมายเซสชัน
    - `/unfocus` ลบการผูกปัจจุบัน
    - `/agents` แสดงรายการเอเจนต์ที่ผูกกับเธรดสำหรับเซสชันปัจจุบัน
    - `/kill <id|#|all>` ยกเลิกซับเอเจนต์ที่กำลังรันอยู่หนึ่งรายการหรือทั้งหมด
    - `/subagents steer <id|#> <message>` ส่งการกำกับทิศทางไปยังซับเอเจนต์ที่กำลังรันอยู่ ดู [กำกับทิศทาง](/th/tools/steer)

  </Accordion>
  <Accordion title="การเขียนสำหรับเจ้าของเท่านั้นและผู้ดูแลระบบ">
    - `/config show|get|set|unset` อ่านหรือเขียน `openclaw.json` สำหรับเจ้าของเท่านั้น ต้องมี `commands.config: true`
    - `/mcp show|get|set|unset` อ่านหรือเขียนการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers` สำหรับเจ้าของเท่านั้น ต้องมี `commands.mcp: true`
    - `/plugins list|inspect|show|get|install|enable|disable` ตรวจสอบหรือเปลี่ยนสถานะ Plugin `/plugin` เป็น alias การเขียนสำหรับเจ้าของเท่านั้น ต้องมี `commands.plugins: true`
    - `/debug show|set|unset|reset` จัดการการแทนที่การกำหนดค่าสำหรับรันไทม์เท่านั้น สำหรับเจ้าของเท่านั้น ต้องมี `commands.debug: true`
    - `/restart` รีสตาร์ต OpenClaw เมื่อเปิดใช้ ค่าเริ่มต้น: เปิดใช้ ตั้งค่า `commands.restart: false` เพื่อปิดใช้
    - `/send on|off|inherit` ตั้งค่านโยบายการส่ง สำหรับเจ้าของเท่านั้น

  </Accordion>
  <Accordion title="เสียง, TTS, การควบคุมแชนเนล">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` ควบคุม TTS ดู [TTS](/th/tools/tts)
    - `/activation mention|always` ตั้งค่าโหมดการเปิดใช้งานกลุ่ม
    - `/bash <command>` รันคำสั่งเชลล์บนโฮสต์ แบบข้อความเท่านั้น Alias: `! <command>` ต้องมี `commands.bash: true` พร้อม allowlist ของ `tools.elevated`
    - `!poll [sessionId]` ตรวจสอบงาน bash เบื้องหลัง
    - `!stop [sessionId]` หยุดงาน bash เบื้องหลัง

  </Accordion>
</AccordionGroup>

### คำสั่ง dock ที่สร้างขึ้น

คำสั่ง dock เปลี่ยนเส้นทางการตอบกลับของเซสชันปัจจุบันไปยังแชนเนลที่เชื่อมโยงอื่น ดู [การ dock แชนเนล](/th/concepts/channel-docking) สำหรับการตั้งค่า ตัวอย่าง และการแก้ไขปัญหา

คำสั่ง dock สร้างจาก Plugin แชนเนลที่รองรับคำสั่ง native ชุดที่บันเดิลปัจจุบัน:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

ใช้คำสั่ง dock จากแชตโดยตรงเพื่อเปลี่ยนเส้นทางการตอบกลับของเซสชันปัจจุบันไปยังแชนเนลที่เชื่อมโยงอื่น เอเจนต์จะคงบริบทเซสชันเดิมไว้ แต่คำตอบในอนาคตสำหรับเซสชันนั้นจะถูกส่งไปยัง peer ของแชนเนลที่เลือก

คำสั่ง dock ต้องมี `session.identityLinks` ผู้ส่งต้นทางและ peer เป้าหมายต้องอยู่ในกลุ่มตัวตนเดียวกัน เช่น `["telegram:123", "discord:456"]` หากผู้ใช้ Telegram ที่มี id `123` ส่ง `/dock_discord` OpenClaw จะเก็บ `lastChannel: "discord"` และ `lastTo: "456"` ในเซสชันที่ใช้งานอยู่ หากผู้ส่งไม่ได้เชื่อมโยงกับ peer ของ Discord คำสั่งจะตอบกลับด้วยคำแนะนำการตั้งค่าแทนที่จะปล่อยต่อไปยังแชตปกติ

การ docking เปลี่ยนเฉพาะเส้นทางของเซสชันที่ใช้งานอยู่เท่านั้น ไม่ได้สร้างบัญชีแชนเนล ให้สิทธิ์เข้าถึง ข้าม allowlist ของแชนเนล หรือย้ายประวัติ transcript ไปยังเซสชันอื่น ใช้ `/dock-telegram`, `/dock-slack`, `/dock-mattermost` หรือคำสั่ง dock ที่สร้างขึ้นอื่นเพื่อเปลี่ยนเส้นทางอีกครั้ง

### คำสั่ง Plugin ที่บันเดิลมา

Plugin ที่บันเดิลมาสามารถเพิ่มคำสั่ง slash เพิ่มเติมได้ คำสั่งที่บันเดิลปัจจุบันใน repo นี้:

- `/dreaming [on|off|status|help]` สลับ memory dreaming ดู [Dreaming](/th/concepts/dreaming)
- `/pair [qr|status|pending|approve|cleanup|notify]` จัดการโฟลว์การจับคู่/ตั้งค่าอุปกรณ์ ดู [การจับคู่](/th/channels/pairing)
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` เปิดใช้อาวุธชั่วคราวสำหรับคำสั่ง phone node ที่มีความเสี่ยงสูง
- `/voice status|list [limit]|set <voiceId|name>` จัดการการกำหนดค่าเสียง Talk บน Discord ชื่อคำสั่ง native คือ `/talkvoice`
- `/card ...` ส่ง preset การ์ดแบบ rich ของ LINE ดู [LINE](/th/channels/line)
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` ตรวจสอบและควบคุม harness แอปเซิร์ฟเวอร์ Codex ที่บันเดิลมา ดู [Codex harness](/th/plugins/codex-harness)
- คำสั่งเฉพาะ QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### คำสั่ง Skills แบบไดนามิก

Skills ที่ผู้ใช้เรียกใช้ได้จะแสดงเป็นคำสั่ง slash ด้วย:

- `/skill <name> [input]` ใช้งานได้เสมอในฐานะ entrypoint ทั่วไป
- skills อาจปรากฏเป็นคำสั่งโดยตรงอย่าง `/prose` ได้ด้วย เมื่อ skill/Plugin ลงทะเบียนคำสั่งเหล่านั้น
- การลงทะเบียนคำสั่ง skill แบบ native ควบคุมโดย `commands.nativeSkills` และ `channels.<provider>.commands.nativeSkills`
- ข้อกำหนดคำสั่งสามารถให้ `descriptionLocalizations` สำหรับพื้นผิว native ที่รองรับคำอธิบายที่แปลเป็นภาษาท้องถิ่น รวมถึง Discord

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับอาร์กิวเมนต์และ parser">
    - คำสั่งยอมรับ `:` ที่ไม่บังคับระหว่างคำสั่งและ args ได้ (เช่น `/think: high`, `/send: on`, `/help:`)
    - `/new <model>` รับ alias ของโมเดล, `provider/model` หรือชื่อ provider (จับคู่แบบ fuzzy); หากไม่พบรายการที่ตรงกัน ข้อความจะถูกใช้เป็นเนื้อหาข้อความ
    - สำหรับรายละเอียดการใช้งาน provider แบบเต็ม ใช้ `openclaw status --usage`
    - `/allowlist add|remove` ต้องมี `commands.config=true` และเคารพ `configWrites` ของแชนเนล
    - ในแชนเนลหลายบัญชี `/allowlist --account <id>` ที่กำหนดเป้าหมายการกำหนดค่าและ `/config set channels.<provider>.accounts.<id>...` จะเคารพ `configWrites` ของบัญชีเป้าหมายด้วย
    - `/usage` ควบคุม footer การใช้งานต่อคำตอบ; `/usage cost` พิมพ์สรุปต้นทุนภายในเครื่องจากบันทึกเซสชัน OpenClaw
    - `/restart` เปิดใช้ตามค่าเริ่มต้น ตั้งค่า `commands.restart: false` เพื่อปิดใช้
    - `/plugins install <spec>` รับข้อกำหนด Plugin แบบเดียวกับ `openclaw plugins install`: path/archive ภายในเครื่อง, แพ็กเกจ npm, `git:<repo>` หรือ `clawhub:<pkg>` จากนั้นร้องขอให้รีสตาร์ต Gateway เพราะโมดูลซอร์สของ Plugin เปลี่ยนไป
    - `/plugins enable|disable` อัปเดตการกำหนดค่า Plugin และทริกเกอร์การโหลด Plugin ของ Gateway ใหม่สำหรับรอบเอเจนต์ใหม่

  </Accordion>
  <Accordion title="พฤติกรรมเฉพาะแชนเนล">
    - คำสั่ง native เฉพาะ Discord: `/vc join|leave|status` ควบคุมแชนเนลเสียง (ใช้เป็นข้อความไม่ได้) `join` ต้องมี guild และแชนเนล voice/stage ที่เลือก ต้องมี `channels.discord.voice` และคำสั่ง native
    - คำสั่งผูกเธรดของ Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) ต้องเปิดใช้การผูกเธรดที่มีผล (`session.threadBindings.enabled` และ/หรือ `channels.discord.threadBindings.enabled`)
    - เอกสารอ้างอิงคำสั่ง ACP และพฤติกรรมรันไทม์: [เอเจนต์ ACP](/th/tools/acp-agents)

  </Accordion>
  <Accordion title="Verbose / trace / fast / ความปลอดภัยของ reasoning">
    - `/verbose` มีไว้สำหรับการดีบักและการมองเห็นเพิ่มเติม ให้ปิดไว้ในกรณีใช้งานปกติ
    - `/trace` แคบกว่า `/verbose`: จะแสดงเฉพาะบรรทัด trace/debug ที่ Plugin เป็นเจ้าของ และยังปิดข้อความจิปาถะของเครื่องมือแบบ verbose ตามปกติ
    - `/fast on|off` บันทึกการแทนที่เซสชันแบบถาวร ใช้ตัวเลือก `inherit` ใน UI เซสชันเพื่อล้างค่าและย้อนกลับไปใช้ค่าเริ่มต้นจากการกำหนดค่า
    - `/fast` เฉพาะ provider: OpenAI/OpenAI Codex แมปไปยัง `service_tier=priority` บน endpoints Responses แบบ native ส่วนคำขอ Anthropic สาธารณะโดยตรง รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย OAuth ซึ่งส่งไปยัง `api.anthropic.com` จะแมปไปยัง `service_tier=auto` หรือ `standard_only` ดู [OpenAI](/th/providers/openai) และ [Anthropic](/th/providers/anthropic)
    - สรุปความล้มเหลวของเครื่องมือยังคงแสดงเมื่อเกี่ยวข้อง แต่ข้อความความล้มเหลวแบบละเอียดจะรวมเฉพาะเมื่อ `/verbose` เป็น `on` หรือ `full`
    - `/reasoning`, `/verbose` และ `/trace` มีความเสี่ยงในสภาพแวดล้อมกลุ่ม: อาจเปิดเผย reasoning ภายใน เอาต์พุตเครื่องมือ หรือ diagnostics ของ Plugin ที่คุณไม่ได้ตั้งใจจะเปิดเผย ควรปล่อยให้ปิดไว้ โดยเฉพาะในแชตกลุ่ม

  </Accordion>
  <Accordion title="การสลับโมเดล">
    - `/model` บันทึกโมเดลเซสชันใหม่ทันที
    - หากเอเจนต์ idle การรันถัดไปจะใช้โมเดลนั้นทันที
    - หากมีการรันที่ active อยู่แล้ว OpenClaw จะทำเครื่องหมายการสลับสดเป็น pending และจะรีสตาร์ตเข้าสู่โมเดลใหม่เฉพาะที่จุด retry ที่สะอาดเท่านั้น
    - หากกิจกรรมเครื่องมือหรือเอาต์พุตคำตอบเริ่มแล้ว การสลับที่ pending อาจยังคิวอยู่จนกว่าจะมีโอกาส retry ภายหลังหรือรอบผู้ใช้ถัดไป
    - ใน TUI ภายในเครื่อง `/crestodian [request]` จะกลับจาก TUI เอเจนต์ปกติไปยัง Crestodian ซึ่งแยกจากโหมด rescue ของแชนเนลข้อความและไม่ได้ให้สิทธิ์การกำหนดค่าระยะไกล

  </Accordion>
  <Accordion title="เส้นทางด่วนและ shortcut แบบ inline">
    - **เส้นทางด่วน:** ข้อความที่มีแต่คำสั่งจากผู้ส่งที่อยู่ใน allowlist จะถูกจัดการทันที (ข้ามคิว + โมเดล)
    - **การกั้นด้วยการ mention ในกลุ่ม:** ข้อความที่มีแต่คำสั่งจากผู้ส่งที่อยู่ใน allowlist จะข้ามข้อกำหนดการ mention
    - **shortcut แบบ inline (เฉพาะผู้ส่งที่อยู่ใน allowlist):** คำสั่งบางคำสั่งยังใช้งานได้เมื่อฝังอยู่ในข้อความปกติ และจะถูกตัดออกก่อนที่โมเดลจะเห็นข้อความที่เหลือ
      - ตัวอย่าง: `hey /status` ทริกเกอร์คำตอบสถานะ และข้อความที่เหลือจะดำเนินต่อผ่านโฟลว์ปกติ
    - ปัจจุบัน: `/help`, `/commands`, `/status`, `/whoami` (`/id`)
    - ข้อความที่มีแต่คำสั่งจากผู้ที่ไม่ได้รับอนุญาตจะถูกละเว้นอย่างเงียบ ๆ และ token `/...` แบบ inline จะถูกปฏิบัติเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="คำสั่ง Skill และอาร์กิวเมนต์ native">
    - **คำสั่ง Skill:** Skills แบบ `user-invocable` จะแสดงเป็นคำสั่ง slash ชื่อจะถูก sanitize เป็น `a-z0-9_` (สูงสุด 32 อักขระ); รายการที่ชนกันจะได้ suffix ตัวเลข (เช่น `_2`)
      - `/skill <name> [input]` รัน skill ตามชื่อ (มีประโยชน์เมื่อข้อจำกัดของคำสั่ง native ทำให้สร้างคำสั่งแยกต่อ skill ไม่ได้)
      - ตามค่าเริ่มต้น คำสั่ง skill จะถูกส่งต่อไปยังโมเดลเป็นคำขอปกติ
      - Skills อาจประกาศ `command-dispatch: tool` ได้ตามต้องการเพื่อ route คำสั่งไปยังเครื่องมือโดยตรง (กำหนดผลได้แน่นอน, ไม่มีโมเดล)
      - ตัวอย่าง: `/prose` (Plugin OpenProse) — ดู [OpenProse](/th/prose)
    - **อาร์กิวเมนต์คำสั่ง native:** Discord ใช้ autocomplete สำหรับตัวเลือกแบบไดนามิก (และเมนูปุ่มเมื่อคุณละ args ที่จำเป็น) Telegram และ Slack จะแสดงเมนูปุ่มเมื่อคำสั่งรองรับตัวเลือกและคุณละ arg ตัวเลือกแบบไดนามิกจะถูก resolve กับโมเดลของเซสชันเป้าหมาย ดังนั้นตัวเลือกเฉพาะโมเดล เช่น ระดับ `/think` จะตามการแทนที่ `/model` ของเซสชันนั้น

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` ตอบคำถามเกี่ยวกับรันไทม์ ไม่ใช่คำถามเกี่ยวกับการกำหนดค่า: **เอเจนต์นี้ใช้อะไรได้บ้างตอนนี้ในการสนทนานี้**

- `/tools` ค่าเริ่มต้นมีขนาดกะทัดรัดและปรับให้สแกนได้เร็ว
- `/tools verbose` เพิ่มคำอธิบายสั้น ๆ
- พื้นผิวคำสั่ง native ที่รองรับอาร์กิวเมนต์จะแสดงสวิตช์โหมดเดียวกันเป็น `compact|verbose`
- ผลลัพธ์มีขอบเขตตามเซสชัน ดังนั้นการเปลี่ยนเอเจนต์ แชนเนล เธรด การอนุญาตผู้ส่ง หรือโมเดลอาจเปลี่ยนเอาต์พุตได้
- `/tools` รวมเครื่องมือที่เข้าถึงได้จริงในรันไทม์ รวมถึงเครื่องมือ core, เครื่องมือ Plugin ที่เชื่อมต่อ และเครื่องมือที่แชนเนลเป็นเจ้าของ

สำหรับการแก้ไขโปรไฟล์และการแทนที่ ใช้แผง Tools ของ Control UI หรือพื้นผิว config/catalog แทนการมองว่า `/tools` เป็น catalog แบบคงที่

## พื้นผิวการใช้งาน (สิ่งที่แสดงที่ใด)

- **การใช้งาน/โควตาของผู้ให้บริการ** (ตัวอย่าง: "Claude เหลือ 80%") จะแสดงใน `/status` สำหรับผู้ให้บริการโมเดลปัจจุบันเมื่อเปิดใช้การติดตามการใช้งาน OpenClaw จะทำให้หน้าต่างของผู้ให้บริการอยู่ในรูปแบบ `% left`; สำหรับ MiniMax ฟิลด์เปอร์เซ็นต์แบบเหลืออยู่เท่านั้นจะถูกกลับค่าก่อนแสดงผล และการตอบกลับ `model_remains` จะเลือกใช้รายการ chat-model พร้อมป้ายกำกับแผนที่ติดแท็กโมเดลเป็นลำดับแรก
- **บรรทัดโทเค็น/แคช** ใน `/status` สามารถย้อนกลับไปใช้รายการการใช้งานล่าสุดจากทรานสคริปต์ได้เมื่อ snapshot ของเซสชันสดมีข้อมูลน้อย ค่า live ที่ไม่เป็นศูนย์ซึ่งมีอยู่แล้วจะยังมีสิทธิ์เหนือกว่า และการย้อนกลับไปใช้ทรานสคริปต์ยังสามารถกู้คืนป้ายกำกับโมเดลรันไทม์ที่ใช้งานอยู่พร้อมผลรวมที่เน้นพรอมป์ซึ่งใหญ่กว่าได้เมื่อผลรวมที่จัดเก็บไว้หายไปหรือมีค่าน้อยกว่า
- **การดำเนินการเทียบกับรันไทม์:** `/status` รายงาน `Execution` สำหรับพาธ sandbox ที่มีผล และ `Runtime` สำหรับสิ่งที่กำลังรันเซสชันจริง: `OpenClaw Pi Default`, `OpenAI Codex`, แบ็กเอนด์ CLI หรือแบ็กเอนด์ ACP
- **โทเค็น/ค่าใช้จ่ายต่อการตอบกลับ** ควบคุมโดย `/usage off|tokens|full` (ต่อท้ายการตอบกลับปกติ)
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

- `/model` และ `/model list` แสดงตัวเลือกแบบกระชับพร้อมหมายเลข (ตระกูลโมเดล + ผู้ให้บริการที่มี)
- บน Discord, `/model` และ `/models` เปิดตัวเลือกแบบโต้ตอบที่มี dropdown สำหรับผู้ให้บริการและโมเดล รวมถึงขั้นตอน Submit
- `/model <#>` เลือกจากตัวเลือกนั้น (และเลือกผู้ให้บริการปัจจุบันก่อนเมื่อเป็นไปได้)
- `/model status` แสดงมุมมองแบบละเอียด รวมถึง endpoint ของผู้ให้บริการที่ตั้งค่าไว้ (`baseUrl`) และโหมด API (`api`) เมื่อมี

## การ override สำหรับดีบัก

`/debug` ให้คุณตั้งค่า override คอนฟิกรันไทม์เท่านั้น (ในหน่วยความจำ ไม่ใช่บนดิสก์) เฉพาะ owner ปิดใช้โดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.debug: true`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
override จะมีผลทันทีต่อการอ่านคอนฟิกใหม่ แต่จะ **ไม่** เขียนลง `openclaw.json` ใช้ `/debug reset` เพื่อล้าง override ทั้งหมดและกลับไปใช้คอนฟิกบนดิสก์
</Note>

## เอาต์พุต trace ของ Plugin

`/trace` ให้คุณสลับเปิดปิด **บรรทัด trace/debug ของ Plugin ที่มีขอบเขตเฉพาะเซสชัน** โดยไม่ต้องเปิดโหมด verbose เต็มรูปแบบ

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
- บรรทัด trace ของ Plugin สามารถปรากฏใน `/status` และเป็นข้อความวินิจฉัยติดตามผลหลังการตอบกลับปกติของผู้ช่วย
- `/trace` ไม่ได้แทนที่ `/debug`; `/debug` ยังคงจัดการ override คอนฟิกรันไทม์เท่านั้น
- `/trace` ไม่ได้แทนที่ `/verbose`; เอาต์พุต tool/status แบบ verbose ปกติยังเป็นหน้าที่ของ `/verbose`

## การอัปเดตคอนฟิก

`/config` เขียนไปยังคอนฟิกบนดิสก์ของคุณ (`openclaw.json`) เฉพาะ owner ปิดใช้โดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.config: true`

ตัวอย่าง:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
คอนฟิกจะถูกตรวจสอบความถูกต้องก่อนเขียน; การเปลี่ยนแปลงที่ไม่ถูกต้องจะถูกปฏิเสธ การอัปเดตด้วย `/config` จะคงอยู่หลังการรีสตาร์ต
</Note>

## การอัปเดต MCP

`/mcp` เขียนคำจำกัดความของเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการไว้ใต้ `mcp.servers` เฉพาะ owner ปิดใช้โดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.mcp: true`

ตัวอย่าง:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` จัดเก็บคอนฟิกในคอนฟิก OpenClaw ไม่ใช่การตั้งค่าโปรเจกต์ที่ Pi เป็นเจ้าของ adapter รันไทม์จะตัดสินใจว่า transport ใดรันได้จริง
</Note>

## การอัปเดต Plugin

`/plugins` ให้ผู้ปฏิบัติการตรวจสอบ Plugin ที่ค้นพบและสลับการเปิดใช้ในคอนฟิก โฟลว์แบบอ่านอย่างเดียวสามารถใช้ `/plugin` เป็น alias ได้ ปิดใช้โดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.plugins: true`

ตัวอย่าง:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` และ `/plugins show` ใช้การค้นพบ Plugin จริงกับ workspace ปัจจุบันพร้อมคอนฟิกบนดิสก์
- `/plugins install` ติดตั้งจาก ClawHub, npm, git, ไดเรกทอรีในเครื่อง และ archive
- `/plugins enable|disable` อัปเดตเฉพาะคอนฟิก Plugin เท่านั้น; ไม่ได้ติดตั้งหรือถอนการติดตั้ง Plugin
- การเปลี่ยนแปลง enable และ disable จะ hot-reload พื้นผิวรันไทม์ Plugin ของ Gateway สำหรับรอบ agent ใหม่; การติดตั้งจะร้องขอให้รีสตาร์ต Gateway เพราะโมดูลซอร์สของ Plugin เปลี่ยนไป

</Note>

## หมายเหตุเกี่ยวกับพื้นผิว

<AccordionGroup>
  <Accordion title="Sessions per surface">
    - **คำสั่งข้อความ** รันในเซสชันแชตปกติ (DM ใช้ `main` ร่วมกัน กลุ่มมีเซสชันของตัวเอง)
    - **คำสั่ง native** ใช้เซสชันแยก:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (ตั้งค่า prefix ได้ผ่าน `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (กำหนดเป้าหมายไปยังเซสชันแชตผ่าน `CommandTargetSessionKey`)
    - **`/stop`** กำหนดเป้าหมายไปยังเซสชันแชตที่ใช้งานอยู่เพื่อให้สามารถยกเลิกการรันปัจจุบันได้

  </Accordion>
  <Accordion title="Slack specifics">
    `channels.slack.slashCommand` ยังรองรับสำหรับคำสั่งสไตล์ `/openclaw` เดียว หากคุณเปิดใช้ `commands.native` คุณต้องสร้างคำสั่ง slash ของ Slack หนึ่งคำสั่งต่อคำสั่งในตัวแต่ละคำสั่ง (ชื่อเดียวกับ `/help`) เมนูอาร์กิวเมนต์ของคำสั่งสำหรับ Slack จะถูกส่งเป็นปุ่ม Block Kit แบบ ephemeral

    ข้อยกเว้น native ของ Slack: ลงทะเบียน `/agentstatus` (ไม่ใช่ `/status`) เพราะ Slack สงวน `/status` ไว้ ข้อความ `/status` ยังใช้ได้ในข้อความ Slack

  </Accordion>
</AccordionGroup>

## คำถามข้างเคียง BTW

`/btw` คือ **คำถามข้างเคียง** แบบเร็วเกี่ยวกับเซสชันปัจจุบัน `/side` เป็น alias

ต่างจากแชตปกติ:

- ใช้เซสชันปัจจุบันเป็นบริบทเบื้องหลัง
- รันเป็นการเรียกแบบ one-shot แยกต่างหากที่ **ไม่มี tool**
- ไม่เปลี่ยนบริบทเซสชันในอนาคต
- ไม่ถูกเขียนลงประวัติทรานสคริปต์
- ถูกส่งเป็นผลลัพธ์ข้างเคียงแบบสดแทนข้อความผู้ช่วยปกติ

ทำให้ `/btw` มีประโยชน์เมื่อคุณต้องการคำชี้แจงชั่วคราวขณะที่งานหลักยังดำเนินต่อไป

ตัวอย่าง:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

ดู [คำถามข้างเคียง BTW](/th/tools/btw) สำหรับพฤติกรรมทั้งหมดและรายละเอียด UX ของไคลเอนต์

## ที่เกี่ยวข้อง

- [การสร้าง skills](/th/tools/creating-skills)
- [Skills](/th/tools/skills)
- [คอนฟิก Skills](/th/tools/skills-config)
