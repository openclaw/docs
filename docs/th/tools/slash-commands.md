---
read_when:
    - การใช้หรือการกำหนดค่าคำสั่งแชท
    - การดีบักการกำหนดเส้นทางคำสั่งหรือสิทธิ์
sidebarTitle: Slash commands
summary: 'คำสั่ง Slash: แบบข้อความเทียบกับแบบเนทีฟ การกำหนดค่า และคำสั่งที่รองรับ'
title: คำสั่งสแลช
x-i18n:
    generated_at: "2026-05-02T21:01:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2829a33601eb53a63b914ad1a6c3bf51be4298fe3bd34faf6475f60a2d491d2
    source_path: tools/slash-commands.md
    workflow: 16
---

คำสั่งได้รับการจัดการโดย Gateway คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความแบบ **แยกเดี่ยว** ที่ขึ้นต้นด้วย `/` คำสั่งแชต bash เฉพาะโฮสต์ใช้ `! <cmd>` (โดยมี `/bash <cmd>` เป็นนามแฝง)

เมื่อการสนทนาหรือเธรดผูกกับเซสชัน ACP ข้อความติดตามผลตามปกติจะถูกส่งไปยัง ACP harness นั้น คำสั่งจัดการ Gateway ยังคงอยู่ในเครื่อง: `/acp ...` จะถึงตัวจัดการคำสั่ง ACP ของ OpenClaw เสมอ และ `/status` กับ `/unfocus` จะอยู่ในเครื่องเมื่อใดก็ตามที่เปิดใช้การจัดการคำสั่งสำหรับพื้นผิวนั้น

มีระบบที่เกี่ยวข้องกันสองระบบ:

<AccordionGroup>
  <Accordion title="Commands">
    ข้อความ `/...` แบบแยกเดี่ยว
  </Accordion>
  <Accordion title="Directives">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Directives จะถูกลบออกจากข้อความก่อนที่โมเดลจะเห็น
    - ในข้อความแชตปกติ (ไม่ใช่ข้อความที่มีเฉพาะ directive) สิ่งเหล่านี้จะถือเป็น "คำใบ้แบบอินไลน์" และจะ **ไม่** คงค่าการตั้งค่าเซสชันไว้
    - ในข้อความที่มีเฉพาะ directive (ข้อความมีเฉพาะ directives) สิ่งเหล่านี้จะคงค่าไว้กับเซสชันและตอบกลับด้วยการยืนยัน
    - Directives จะถูกใช้เฉพาะกับ **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น หากตั้งค่า `commands.allowFrom` ไว้ จะใช้ allowlist นี้เพียงอย่างเดียว มิฉะนั้นการอนุญาตจะมาจาก allowlists/การจับคู่ของช่องทาง รวมกับ `commands.useAccessGroups` ผู้ส่งที่ไม่ได้รับอนุญาตจะเห็น directives ถูกปฏิบัติเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="Inline shortcuts">
    เฉพาะผู้ส่งที่อยู่ใน allowlist/ได้รับอนุญาตเท่านั้น: `/help`, `/commands`, `/status`, `/whoami` (`/id`)

    สิ่งเหล่านี้จะทำงานทันที ถูกลบออกก่อนที่โมเดลจะเห็นข้อความ และข้อความที่เหลือจะดำเนินต่อผ่านโฟลว์ปกติ

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
  เปิดใช้การแยกวิเคราะห์ `/...` ในข้อความแชต บนพื้นผิวที่ไม่มีคำสั่งแบบ native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) คำสั่งข้อความยังคงทำงานได้แม้ว่าคุณจะตั้งค่านี้เป็น `false`
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่งแบบ native อัตโนมัติ: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (จนกว่าคุณจะเพิ่ม slash commands); ถูกละเว้นสำหรับผู้ให้บริการที่ไม่รองรับ native ตั้งค่า `channels.discord.commands.native`, `channels.telegram.commands.native` หรือ `channels.slack.commands.native` เพื่อแทนที่ตามผู้ให้บริการ (bool หรือ `"auto"`) `false` จะล้างคำสั่งที่ลงทะเบียนไว้ก่อนหน้าบน Discord/Telegram ตอนเริ่มต้น คำสั่ง Slack จัดการในแอป Slack และจะไม่ถูกลบโดยอัตโนมัติ
</ParamField>
บน Discord สเปกคำสั่งแบบ native อาจรวม `descriptionLocalizations` ซึ่ง OpenClaw เผยแพร่เป็น Discord `description_localizations` และรวมไว้ในการเปรียบเทียบ reconcile
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่ง **skill** แบบ native เมื่อรองรับ อัตโนมัติ: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (Slack ต้องสร้าง slash command ต่อหนึ่ง skill) ตั้งค่า `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` หรือ `channels.slack.commands.nativeSkills` เพื่อแทนที่ตามผู้ให้บริการ (bool หรือ `"auto"`)
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  เปิดใช้ `! <cmd>` เพื่อเรียกใช้คำสั่ง shell ของโฮสต์ (`/bash <cmd>` เป็นนามแฝง; ต้องมี allowlists ของ `tools.elevated`)
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  ควบคุมระยะเวลาที่ bash รอก่อนสลับเป็นโหมดพื้นหลัง (`0` เข้าพื้นหลังทันที)
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`)
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  เปิดใช้ `/mcp` (อ่าน/เขียนการกำหนดค่า MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`)
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  เปิดใช้ `/plugins` (การค้นหา/สถานะ Plugin รวมถึงการติดตั้ง + ตัวควบคุมเปิดใช้/ปิดใช้)
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  เปิดใช้ `/debug` (การแทนที่เฉพาะ runtime)
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  เปิดใช้ `/restart` รวมถึงการกระทำของเครื่องมือสำหรับรีสตาร์ต gateway
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  ตั้งค่า allowlist เจ้าของแบบชัดเจนสำหรับพื้นผิวคำสั่ง/เครื่องมือที่ใช้ได้เฉพาะเจ้าของ นี่คือบัญชีผู้ปฏิบัติงานที่เป็นมนุษย์ซึ่งสามารถอนุมัติการกระทำที่อันตรายและเรียกใช้คำสั่ง เช่น `/diagnostics`, `/export-trajectory` และ `/config` ได้ แยกจาก `commands.allowFrom` และแยกจากการเข้าถึงการจับคู่ DM
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  ต่อช่องทาง: ทำให้คำสั่งเฉพาะเจ้าของต้องใช้ **ตัวตนเจ้าของ** เพื่อเรียกใช้บนพื้นผิวนั้น เมื่อเป็น `true` ผู้ส่งต้องตรงกับผู้สมัครเจ้าของที่ resolve แล้ว (ตัวอย่างเช่นรายการใน `commands.ownerAllowFrom` หรือ metadata เจ้าของแบบ native ของผู้ให้บริการ) หรือมี scope `operator.admin` ภายในบนช่องทางข้อความภายใน รายการ wildcard ใน `allowFrom` ของช่องทาง หรือรายการผู้สมัครเจ้าของที่ว่างเปล่า/resolve ไม่ได้ **ไม่** เพียงพอ — คำสั่งเฉพาะเจ้าของจะล้มเหลวแบบปิดบนช่องทางนั้น ปล่อยค่านี้ไว้ปิดหากคุณต้องการให้คำสั่งเฉพาะเจ้าของถูกควบคุมเฉพาะโดย `ownerAllowFrom` และ allowlists คำสั่งมาตรฐาน
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  ควบคุมวิธีที่ owner ids ปรากฏใน system prompt
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  ตั้งค่า HMAC secret ที่ใช้เมื่อ `commands.ownerDisplay="hash"` ได้ตามต้องการ
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  allowlist ต่อผู้ให้บริการสำหรับการอนุญาตคำสั่ง เมื่อกำหนดค่าแล้ว จะเป็นแหล่งการอนุญาตเพียงแหล่งเดียวสำหรับคำสั่งและ directives (allowlists/การจับคู่ของช่องทาง และ `commands.useAccessGroups` จะถูกละเว้น) ใช้ `"*"` เป็นค่าเริ่มต้นทั่วโลก; คีย์เฉพาะผู้ให้บริการจะแทนที่ค่านั้น
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  บังคับใช้ allowlists/นโยบายสำหรับคำสั่งเมื่อไม่ได้ตั้งค่า `commands.allowFrom`
</ParamField>

## รายการคำสั่ง

แหล่งความจริงปัจจุบัน:

- built-ins หลักมาจาก `src/auto-reply/commands-registry.shared.ts`
- คำสั่ง dock ที่สร้างขึ้นมาจาก `src/auto-reply/commands-registry.data.ts`
- คำสั่ง Plugin มาจากการเรียก `registerCommand()` ของ Plugin
- ความพร้อมใช้งานจริงบน gateway ของคุณยังขึ้นอยู่กับ flags การกำหนดค่า พื้นผิวช่องทาง และ Plugin ที่ติดตั้ง/เปิดใช้

### คำสั่ง built-in หลัก

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - `/new [model]` เริ่มเซสชันใหม่; `/reset` เป็นนามแฝงสำหรับ reset
    - Control UI ดักจับ `/new` ที่พิมพ์เพื่อสร้างและสลับไปยังเซสชันแดชบอร์ดใหม่; `/reset` ที่พิมพ์ยังคงเรียกใช้การ reset แบบแทนที่ใน Gateway
    - `/reset soft [message]` เก็บ transcript ปัจจุบันไว้ ลบ CLI backend session ids ที่นำกลับมาใช้ซ้ำ และเรียกการโหลด startup/system-prompt ใหม่แบบแทนที่
    - `/compact [instructions]` compact บริบทเซสชัน ดู [Compaction](/th/concepts/compaction)
    - `/stop` ยกเลิกการรันปัจจุบัน
    - `/session idle <duration|off>` และ `/session max-age <duration|off>` จัดการการหมดอายุของการผูกเธรด
    - `/export-session [path]` ส่งออกเซสชันปัจจุบันเป็น HTML นามแฝง: `/export`
    - `/export-trajectory [path]` ขอการอนุมัติ exec จากนั้นส่งออก [trajectory bundle](/th/tools/trajectory) แบบ JSONL สำหรับเซสชันปัจจุบัน ใช้เมื่อต้องการไทม์ไลน์ prompt, tool และ transcript สำหรับเซสชัน OpenClaw หนึ่งเซสชัน ในแชตกลุ่ม prompt การอนุมัติและผลลัพธ์การส่งออกจะถูกส่งถึงเจ้าของแบบส่วนตัว นามแฝง: `/trajectory`

  </Accordion>
  <Accordion title="Model and run controls">
    - `/think <level>` ตั้งค่าระดับการคิด ตัวเลือกมาจากโปรไฟล์ผู้ให้บริการของโมเดลที่ใช้งานอยู่; ระดับทั่วไปคือ `off`, `minimal`, `low`, `medium` และ `high` โดยมีระดับกำหนดเอง เช่น `xhigh`, `adaptive`, `max` หรือแบบไบนารี `on` เฉพาะที่รองรับเท่านั้น นามแฝง: `/thinking`, `/t`
    - `/verbose on|off|full` สลับเอาต์พุตแบบละเอียด นามแฝง: `/v`
    - `/trace on|off` สลับเอาต์พุต trace ของ Plugin สำหรับเซสชันปัจจุบัน
    - `/fast [status|on|off]` แสดงหรือตั้งค่าโหมดเร็ว
    - `/reasoning [on|off|stream]` สลับการมองเห็น reasoning นามแฝง: `/reason`
    - `/elevated [on|off|ask|full]` สลับโหมด elevated นามแฝง: `/elev`
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` แสดงหรือตั้งค่า exec defaults
    - `/model [name|#|status]` แสดงหรือตั้งค่าโมเดล
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` แสดงรายการผู้ให้บริการที่กำหนดค่าไว้/มี auth พร้อมใช้งาน หรือโมเดลสำหรับผู้ให้บริการหนึ่งราย; เพิ่ม `all` เพื่อเรียกดูแค็ตตาล็อกเต็มของผู้ให้บริการนั้น
    - `/queue <mode>` จัดการพฤติกรรมคิว (`steer`, legacy `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) รวมถึงตัวเลือก เช่น `debounce:0.5s cap:25 drop:summarize`; `/queue default` หรือ `/queue reset` ล้างการแทนที่ของเซสชัน ดู [คิวคำสั่ง](/th/concepts/queue) และ [คิวการนำทาง](/th/concepts/queue-steering)

  </Accordion>
  <Accordion title="Discovery and status">
    - `/help` แสดงสรุปความช่วยเหลือแบบสั้น
    - `/commands` แสดงแค็ตตาล็อกคำสั่งที่สร้างขึ้น
    - `/tools [compact|verbose]` แสดงสิ่งที่ agent ปัจจุบันสามารถใช้ได้ในตอนนี้
    - `/status` แสดงสถานะ execution/runtime รวมถึงป้ายกำกับ `Execution`/`Runtime` และการใช้งาน/โควตาของผู้ให้บริการเมื่อมีให้ใช้งาน
    - `/diagnostics [note]` เป็นโฟลว์รายงานสนับสนุนเฉพาะเจ้าของสำหรับบั๊กของ Gateway และการรัน Codex harness โดยจะขอการอนุมัติ exec อย่างชัดเจนทุกครั้งก่อนเรียกใช้ `openclaw gateway diagnostics export --json`; อย่าอนุมัติ diagnostics ด้วยกฎ allow-all หลังจากอนุมัติแล้ว ระบบจะส่งรายงานที่วางได้พร้อมเส้นทาง bundle ในเครื่อง สรุป manifest หมายเหตุความเป็นส่วนตัว และ session ids ที่เกี่ยวข้อง ในแชตกลุ่ม prompt การอนุมัติและรายงานจะถูกส่งถึงเจ้าของแบบส่วนตัว เมื่อเซสชันที่ใช้งานอยู่ใช้ OpenAI Codex harness การอนุมัติเดียวกันนี้ยังส่ง feedback ของ Codex ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI และคำตอบที่เสร็จสมบูรณ์จะแสดงรายการ OpenClaw session ids, Codex thread ids และคำสั่ง `codex resume <thread-id>` ดู [การส่งออก Diagnostics](/th/gateway/diagnostics)
    - `/crestodian <request>` เรียกใช้ตัวช่วยตั้งค่าและซ่อมแซม Crestodian จาก owner DM
    - `/tasks` แสดงรายการงานพื้นหลังที่กำลังทำงาน/ล่าสุดสำหรับเซสชันปัจจุบัน
    - `/context [list|detail|json]` อธิบายวิธีประกอบบริบท
    - `/whoami` แสดง sender id ของคุณ นามแฝง: `/id`
    - `/usage off|tokens|full|cost` ควบคุม footer การใช้งานต่อคำตอบ หรือพิมพ์สรุปค่าใช้จ่ายในเครื่อง

  </Accordion>
  <Accordion title="Skills, allowlists, approvals">
    - `/skill <name> [input]` เรียกใช้ skill ตามชื่อ
    - `/allowlist [list|add|remove] ...` จัดการรายการ allowlist เฉพาะข้อความ
    - `/approve <id> <decision>` resolve prompt การอนุมัติ exec
    - `/btw <question>` ถามคำถามแทรกโดยไม่เปลี่ยนบริบทเซสชันในอนาคต ดู [BTW](/th/tools/btw)

  </Accordion>
  <Accordion title="Subagents และ ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` จัดการการรัน sub-agent สำหรับเซสชันปัจจุบัน
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` จัดการเซสชัน ACP และตัวเลือก runtime
    - `/focus <target>` ผูก thread ของ Discord หรือหัวข้อ/การสนทนา Telegram ปัจจุบันเข้ากับเป้าหมายเซสชัน
    - `/unfocus` ลบการผูกปัจจุบัน
    - `/agents` แสดงรายการ agent ที่ผูกกับ thread สำหรับเซสชันปัจจุบัน
    - `/kill <id|#|all>` ยกเลิก sub-agent ที่กำลังทำงานอยู่หนึ่งตัวหรือทั้งหมด
    - `/steer <id|#> <message>` ส่งคำสั่งนำทางไปยัง sub-agent ที่กำลังทำงานอยู่ นามแฝง: `/tell`

  </Accordion>
  <Accordion title="การเขียนสำหรับเจ้าของเท่านั้นและผู้ดูแลระบบ">
    - `/config show|get|set|unset` อ่านหรือเขียน `openclaw.json` สำหรับเจ้าของเท่านั้น ต้องใช้ `commands.config: true`
    - `/mcp show|get|set|unset` อ่านหรือเขียนการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers` สำหรับเจ้าของเท่านั้น ต้องใช้ `commands.mcp: true`
    - `/plugins list|inspect|show|get|install|enable|disable` ตรวจสอบหรือเปลี่ยนสถานะ Plugin `/plugin` เป็นนามแฝง สำหรับการเขียนเป็นของเจ้าของเท่านั้น ต้องใช้ `commands.plugins: true`
    - `/debug show|set|unset|reset` จัดการการ override การกำหนดค่าเฉพาะ runtime สำหรับเจ้าของเท่านั้น ต้องใช้ `commands.debug: true`
    - `/restart` รีสตาร์ต OpenClaw เมื่อเปิดใช้งาน ค่าเริ่มต้น: เปิดใช้งาน; ตั้ง `commands.restart: false` เพื่อปิดใช้งาน
    - `/send on|off|inherit` ตั้งค่านโยบายการส่ง สำหรับเจ้าของเท่านั้น

  </Accordion>
  <Accordion title="เสียง, TTS, การควบคุมช่องทาง">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` ควบคุม TTS ดู [TTS](/th/tools/tts)
    - `/activation mention|always` ตั้งค่าโหมดการเปิดใช้งานกลุ่ม
    - `/bash <command>` รันคำสั่ง shell ของ host แบบข้อความเท่านั้น นามแฝง: `! <command>` ต้องใช้ `commands.bash: true` พร้อม allowlist ของ `tools.elevated`
    - `!poll [sessionId]` ตรวจสอบงาน bash เบื้องหลัง
    - `!stop [sessionId]` หยุดงาน bash เบื้องหลัง

  </Accordion>
</AccordionGroup>

### คำสั่ง dock ที่สร้างขึ้น

คำสั่ง dock จะสลับเส้นทางการตอบกลับของเซสชันปัจจุบันไปยังช่องทางที่ลิงก์ไว้อีกช่องทางหนึ่ง ดู [การ dock ช่องทาง](/th/concepts/channel-docking) สำหรับการตั้งค่า ตัวอย่าง และการแก้ไขปัญหา

คำสั่ง dock สร้างจาก Plugin ช่องทางที่รองรับ native-command ชุดที่ bundled ปัจจุบัน:

- `/dock-discord` (นามแฝง: `/dock_discord`)
- `/dock-mattermost` (นามแฝง: `/dock_mattermost`)
- `/dock-slack` (นามแฝง: `/dock_slack`)
- `/dock-telegram` (นามแฝง: `/dock_telegram`)

ใช้คำสั่ง dock จากแชตโดยตรงเพื่อสลับเส้นทางการตอบกลับของเซสชันปัจจุบันไปยังช่องทางที่ลิงก์ไว้อีกช่องทางหนึ่ง agent จะคงบริบทเซสชันเดิมไว้ แต่การตอบกลับในอนาคตของเซสชันนั้นจะถูกส่งไปยัง peer ของช่องทางที่เลือก

คำสั่ง dock ต้องใช้ `session.identityLinks` ผู้ส่งต้นทางและ peer เป้าหมายต้องอยู่ในกลุ่ม identity เดียวกัน เช่น `["telegram:123", "discord:456"]` หากผู้ใช้ Telegram ที่มี id `123` ส่ง `/dock_discord` OpenClaw จะเก็บ `lastChannel: "discord"` และ `lastTo: "456"` ไว้ในเซสชันที่ใช้งานอยู่ หากผู้ส่งไม่ได้ลิงก์กับ peer ของ Discord คำสั่งจะตอบกลับด้วยคำแนะนำการตั้งค่าแทนที่จะปล่อยให้เข้าสู่แชตปกติ

การ docking จะเปลี่ยนเฉพาะเส้นทางเซสชันที่ใช้งานอยู่เท่านั้น ไม่ได้สร้างบัญชีช่องทาง ให้สิทธิ์เข้าถึง ข้าม allowlist ของช่องทาง หรือย้ายประวัติ transcript ไปยังเซสชันอื่น ใช้ `/dock-telegram`, `/dock-slack`, `/dock-mattermost` หรือคำสั่ง dock ที่สร้างขึ้นอื่นเพื่อสลับเส้นทางอีกครั้ง

### คำสั่ง Plugin ที่ bundled

Plugin ที่ bundled สามารถเพิ่มคำสั่ง slash เพิ่มเติมได้ คำสั่ง bundled ปัจจุบันใน repo นี้:

- `/dreaming [on|off|status|help]` เปิดหรือปิด memory dreaming ดู [Dreaming](/th/concepts/dreaming)
- `/pair [qr|status|pending|approve|cleanup|notify]` จัดการ flow การจับคู่/ตั้งค่าอุปกรณ์ ดู [การจับคู่](/th/channels/pairing)
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` เปิดใช้งานคำสั่ง phone node ที่มีความเสี่ยงสูงชั่วคราว
- `/voice status|list [limit]|set <voiceId|name>` จัดการการกำหนดค่าเสียง Talk บน Discord ชื่อคำสั่ง native คือ `/talkvoice`
- `/card ...` ส่ง preset ของ rich card สำหรับ LINE ดู [LINE](/th/channels/line)
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` ตรวจสอบและควบคุม harness ของ bundled Codex app-server ดู [Codex harness](/th/plugins/codex-harness)
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
- การลงทะเบียนคำสั่ง skill แบบ native ควบคุมโดย `commands.nativeSkills` และ `channels.<provider>.commands.nativeSkills`
- spec ของคำสั่งสามารถให้ `descriptionLocalizations` สำหรับพื้นผิว native ที่รองรับคำอธิบายแบบ localized รวมถึง Discord

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับ argument และ parser">
    - คำสั่งยอมรับ `:` ที่เป็นทางเลือกระหว่างคำสั่งและ args ได้ (เช่น `/think: high`, `/send: on`, `/help:`)
    - `/new <model>` ยอมรับ model alias, `provider/model` หรือชื่อ provider (จับคู่แบบ fuzzy); หากไม่พบรายการที่ตรงกัน ข้อความจะถูกถือเป็นเนื้อหาข้อความ
    - สำหรับรายละเอียดการใช้งาน provider แบบเต็ม ให้ใช้ `openclaw status --usage`
    - `/allowlist add|remove` ต้องใช้ `commands.config=true` และเคารพ `configWrites` ของช่องทาง
    - ในช่องทางหลายบัญชี `/allowlist --account <id>` ที่กำหนดเป้าหมายการกำหนดค่าและ `/config set channels.<provider>.accounts.<id>...` จะเคารพ `configWrites` ของบัญชีเป้าหมายด้วย
    - `/usage` ควบคุม footer การใช้งานต่อการตอบกลับ; `/usage cost` พิมพ์สรุปค่าใช้จ่ายในเครื่องจาก log เซสชัน OpenClaw
    - `/restart` เปิดใช้งานเป็นค่าเริ่มต้น; ตั้ง `commands.restart: false` เพื่อปิดใช้งาน
    - `/plugins install <spec>` ยอมรับ spec ของ Plugin แบบเดียวกับ `openclaw plugins install`: path/archive ในเครื่อง, npm package, `git:<repo>` หรือ `clawhub:<pkg>` จากนั้นขอให้รีสตาร์ต Gateway เพราะโมดูล source ของ Plugin เปลี่ยนไป
    - `/plugins enable|disable` อัปเดตการกำหนดค่า Plugin และทริกเกอร์การโหลด Plugin ของ Gateway ใหม่สำหรับ turn ใหม่ของ agent

  </Accordion>
  <Accordion title="พฤติกรรมเฉพาะช่องทาง">
    - คำสั่ง native เฉพาะ Discord: `/vc join|leave|status` ควบคุมช่องเสียง (ใช้เป็นข้อความไม่ได้) `join` ต้องมี guild และช่อง voice/stage ที่เลือก ต้องใช้ `channels.discord.voice` และคำสั่ง native
    - คำสั่งผูก thread ของ Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) ต้องเปิดใช้งาน effective thread bindings (`session.threadBindings.enabled` และ/หรือ `channels.discord.threadBindings.enabled`)
    - อ้างอิงคำสั่ง ACP และพฤติกรรม runtime: [ACP agents](/th/tools/acp-agents)

  </Accordion>
  <Accordion title="ความปลอดภัยของ verbose / trace / fast / reasoning">
    - `/verbose` มีไว้สำหรับการดีบักและการมองเห็นเพิ่มเติม; ให้คงไว้เป็น **off** ในการใช้งานปกติ
    - `/trace` แคบกว่า `/verbose`: จะแสดงเฉพาะบรรทัด trace/debug ที่ Plugin เป็นเจ้าของ และปิดข้อความเครื่องมือ verbose ปกติไว้
    - `/fast on|off` คงค่า override ของเซสชัน ใช้ตัวเลือก `inherit` ใน Sessions UI เพื่อล้างค่าและกลับไปใช้ค่าเริ่มต้นของการกำหนดค่า
    - `/fast` ขึ้นอยู่กับ provider: OpenAI/OpenAI Codex จะแมปไปที่ `service_tier=priority` บน endpoint Responses แบบ native ขณะที่คำขอ Anthropic สาธารณะโดยตรง รวมถึง traffic ที่ยืนยันตัวตนด้วย OAuth ซึ่งส่งไปยัง `api.anthropic.com` จะแมปไปที่ `service_tier=auto` หรือ `standard_only` ดู [OpenAI](/th/providers/openai) และ [Anthropic](/th/providers/anthropic)
    - สรุปความล้มเหลวของเครื่องมือยังคงแสดงเมื่อเกี่ยวข้อง แต่ข้อความความล้มเหลวแบบละเอียดจะรวมไว้เฉพาะเมื่อ `/verbose` เป็น `on` หรือ `full`
    - `/reasoning`, `/verbose` และ `/trace` มีความเสี่ยงในการตั้งค่ากลุ่ม: อาจเปิดเผย reasoning ภายใน ผลลัพธ์ของเครื่องมือ หรือ diagnostics ของ Plugin ที่คุณไม่ได้ตั้งใจให้เปิดเผย แนะนำให้ปิดไว้ โดยเฉพาะในแชตกลุ่ม

  </Accordion>
  <Accordion title="การสลับโมเดล">
    - `/model` คงค่าโมเดลเซสชันใหม่ทันที
    - หาก agent ว่าง การรันถัดไปจะใช้ทันที
    - หากมีการรันที่ใช้งานอยู่แล้ว OpenClaw จะทำเครื่องหมาย live switch เป็น pending และจะรีสตาร์ตเข้าสู่โมเดลใหม่เฉพาะที่จุด retry ที่สะอาด
    - หากกิจกรรมเครื่องมือหรือผลลัพธ์การตอบกลับเริ่มไปแล้ว การสลับที่ pending อาจยังอยู่ในคิวจนกว่าจะมีโอกาส retry ภายหลังหรือ turn ถัดไปของผู้ใช้
    - ใน TUI ในเครื่อง `/crestodian [request]` กลับจาก TUI ของ agent ปกติไปยัง Crestodian สิ่งนี้แยกจากโหมด rescue ของ message-channel และไม่ได้ให้สิทธิ์ config ระยะไกล

  </Accordion>
  <Accordion title="Fast path และ shortcut แบบ inline">
    - **Fast path:** ข้อความที่มีเฉพาะคำสั่งจากผู้ส่งใน allowlist จะถูกจัดการทันที (ข้ามคิว + โมเดล)
    - **Group mention gating:** ข้อความที่มีเฉพาะคำสั่งจากผู้ส่งใน allowlist จะข้ามข้อกำหนดการ mention
    - **Shortcut แบบ inline (เฉพาะผู้ส่งใน allowlist):** คำสั่งบางรายการยังทำงานได้เมื่อฝังอยู่ในข้อความปกติ และจะถูกตัดออกก่อนที่โมเดลจะเห็นข้อความที่เหลือ
      - ตัวอย่าง: `hey /status` ทริกเกอร์การตอบกลับสถานะ และข้อความที่เหลือจะดำเนินต่อผ่าน flow ปกติ
    - ปัจจุบัน: `/help`, `/commands`, `/status`, `/whoami` (`/id`)
    - ข้อความที่มีเฉพาะคำสั่งจากผู้ที่ไม่ได้รับอนุญาตจะถูกเพิกเฉยอย่างเงียบ ๆ และ token `/...` แบบ inline จะถูกถือเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="คำสั่ง Skill และ argument แบบ native">
    - **คำสั่ง Skill:** Skills แบบ `user-invocable` จะถูกเปิดเผยเป็นคำสั่ง slash ชื่อจะถูก sanitize เป็น `a-z0-9_` (สูงสุด 32 ตัวอักษร); การชนกันจะได้ suffix ตัวเลข (เช่น `_2`)
      - `/skill <name> [input]` รัน skill ตามชื่อ (มีประโยชน์เมื่อข้อจำกัดของคำสั่ง native ป้องกันไม่ให้มีคำสั่งต่อ skill)
      - โดยค่าเริ่มต้น คำสั่ง skill จะถูกส่งต่อไปยังโมเดลเป็นคำขอปกติ
      - Skills อาจประกาศ `command-dispatch: tool` เป็นทางเลือก เพื่อ route คำสั่งไปยังเครื่องมือโดยตรง (กำหนดได้แน่นอน, ไม่ใช้โมเดล)
      - ตัวอย่าง: `/prose` (OpenProse Plugin) — ดู [OpenProse](/th/prose)
    - **argument ของคำสั่ง native:** Discord ใช้ autocomplete สำหรับตัวเลือกแบบไดนามิก (และเมนูปุ่มเมื่อคุณละ args ที่จำเป็น) Telegram และ Slack จะแสดงเมนูปุ่มเมื่อคำสั่งรองรับตัวเลือกและคุณละ arg ตัวเลือกแบบไดนามิกจะถูก resolve เทียบกับโมเดลเซสชันเป้าหมาย ดังนั้นตัวเลือกเฉพาะโมเดล เช่น ระดับ `/think` จะตาม override `/model` ของเซสชันนั้น

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` ตอบคำถาม runtime ไม่ใช่คำถามการกำหนดค่า: **agent นี้ใช้สิ่งใดได้บ้างตอนนี้ในการสนทนานี้**

- `/tools` ค่าเริ่มต้นมีขนาดกะทัดรัดและปรับให้เหมาะกับการสแกนอย่างรวดเร็ว
- `/tools verbose` เพิ่มคำอธิบายสั้น ๆ
- พื้นผิว native-command ที่รองรับ argument จะเปิดเผยสวิตช์โหมดเดียวกันเป็น `compact|verbose`
- ผลลัพธ์มีขอบเขตตามเซสชัน ดังนั้นการเปลี่ยน agent, ช่องทาง, thread, การอนุญาตผู้ส่ง หรือโมเดลอาจเปลี่ยนผลลัพธ์ได้
- `/tools` รวมเครื่องมือที่เข้าถึงได้จริงใน runtime รวมถึงเครื่องมือ core, เครื่องมือ Plugin ที่เชื่อมต่อ และเครื่องมือที่ช่องทางเป็นเจ้าของ

สำหรับการแก้ไข profile และ override ให้ใช้แผง Tools ของ Control UI หรือพื้นผิว config/catalog แทนการถือว่า `/tools` เป็น catalog แบบคงที่

## พื้นผิวการใช้งาน (สิ่งที่แสดงในแต่ละที่)

- **การใช้งาน/โควตาของผู้ให้บริการ** (ตัวอย่าง: "Claude เหลือ 80%") จะแสดงใน `/status` สำหรับผู้ให้บริการโมเดลปัจจุบันเมื่อเปิดใช้การติดตามการใช้งาน OpenClaw ทำให้หน้าต่างเวลาของผู้ให้บริการเป็นรูปแบบ `% left` เดียวกัน สำหรับ MiniMax ฟิลด์เปอร์เซ็นต์ที่มีเฉพาะค่าคงเหลือจะถูกกลับค่าก่อนแสดงผล และการตอบกลับ `model_remains` จะเลือกใช้รายการโมเดลแชตพร้อมป้ายกำกับแผนที่มีแท็กโมเดลเป็นหลัก
- **บรรทัดโทเค็น/แคช** ใน `/status` สามารถ fallback ไปยังรายการการใช้งาน transcript ล่าสุดได้เมื่อ snapshot ของเซสชันสดมีข้อมูลน้อย ค่าสดเดิมที่ไม่ใช่ศูนย์ยังคงมีลำดับความสำคัญสูงกว่า และการ fallback จาก transcript ยังสามารถกู้คืนป้ายกำกับโมเดล runtime ที่ใช้งานอยู่พร้อมยอดรวมที่เน้น prompt และมีค่ามากกว่าได้เมื่อยอดรวมที่จัดเก็บหายไปหรือน้อยกว่า
- **Execution เทียบกับ runtime:** `/status` รายงาน `Execution` สำหรับเส้นทาง sandbox ที่มีผล และ `Runtime` สำหรับผู้ที่กำลังรันเซสชันจริง: `OpenClaw Pi Default`, `OpenAI Codex`, backend ของ CLI หรือ backend ของ ACP
- **โทเค็น/ค่าใช้จ่ายต่อการตอบกลับ** ควบคุมด้วย `/usage off|tokens|full` (ต่อท้ายการตอบกลับปกติ)
- `/model status` เกี่ยวกับ **โมเดล/auth/endpoint** ไม่ใช่การใช้งาน

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
- บน Discord, `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบที่มี dropdown ของผู้ให้บริการและโมเดล พร้อมขั้นตอน Submit
- `/model <#>` เลือกจากตัวเลือกนั้น (และเลือกผู้ให้บริการปัจจุบันเป็นหลักเมื่อทำได้)
- `/model status` แสดงมุมมองแบบละเอียด รวมถึง endpoint ของผู้ให้บริการที่กำหนดค่าไว้ (`baseUrl`) และโหมด API (`api`) เมื่อมี

## การ override สำหรับ debug

`/debug` ช่วยให้คุณตั้งค่า override ของ config แบบ **เฉพาะ runtime** ได้ (อยู่ในหน่วยความจำ ไม่ใช่ดิสก์) เฉพาะเจ้าของเท่านั้น ปิดใช้งานโดยค่าเริ่มต้น เปิดใช้ด้วย `commands.debug: true`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Override จะมีผลทันทีต่อการอ่าน config ใหม่ แต่จะ **ไม่** เขียนลง `openclaw.json` ใช้ `/debug reset` เพื่อล้าง override ทั้งหมดและกลับไปใช้ config บนดิสก์
</Note>

## เอาต์พุต trace ของ Plugin

`/trace` ช่วยให้คุณสลับเปิดปิด **บรรทัด trace/debug ของ Plugin ที่ผูกกับเซสชัน** ได้โดยไม่ต้องเปิดโหมด verbose เต็มรูปแบบ

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
- บรรทัด trace ของ Plugin อาจปรากฏใน `/status` และเป็นข้อความวินิจฉัยตามหลังหลังจากการตอบกลับปกติของ assistant
- `/trace` ไม่ได้แทนที่ `/debug`; `/debug` ยังคงจัดการ override ของ config แบบเฉพาะ runtime
- `/trace` ไม่ได้แทนที่ `/verbose`; เอาต์พุตเครื่องมือ/สถานะ verbose ปกติยังเป็นหน้าที่ของ `/verbose`

## การอัปเดต config

`/config` เขียนไปยัง config บนดิสก์ของคุณ (`openclaw.json`) เฉพาะเจ้าของเท่านั้น ปิดใช้งานโดยค่าเริ่มต้น เปิดใช้ด้วย `commands.config: true`

ตัวอย่าง:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Config จะถูกตรวจสอบความถูกต้องก่อนเขียน การเปลี่ยนแปลงที่ไม่ถูกต้องจะถูกปฏิเสธ การอัปเดตด้วย `/config` จะคงอยู่หลังการรีสตาร์ต
</Note>

## การอัปเดต MCP

`/mcp` เขียนคำจำกัดความเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการไว้ใต้ `mcp.servers` เฉพาะเจ้าของเท่านั้น ปิดใช้งานโดยค่าเริ่มต้น เปิดใช้ด้วย `commands.mcp: true`

ตัวอย่าง:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` จัดเก็บ config ใน config ของ OpenClaw ไม่ใช่การตั้งค่าโปรเจกต์ที่ Pi เป็นเจ้าของ adapter ของ runtime จะตัดสินว่า transport ใดรันได้จริง
</Note>

## การอัปเดต Plugin

`/plugins` ช่วยให้ operator ตรวจสอบ Plugin ที่ค้นพบและสลับการเปิดใช้ใน config ได้ flow แบบอ่านอย่างเดียวสามารถใช้ `/plugin` เป็น alias ได้ ปิดใช้งานโดยค่าเริ่มต้น เปิดใช้ด้วย `commands.plugins: true`

ตัวอย่าง:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` และ `/plugins show` ใช้การค้นพบ Plugin จริงเทียบกับ workspace ปัจจุบันพร้อม config บนดิสก์
- `/plugins install` ติดตั้งจาก ClawHub, npm, git, ไดเรกทอรี local และ archive
- `/plugins enable|disable` อัปเดตเฉพาะ config ของ Plugin เท่านั้น ไม่ได้ติดตั้งหรือถอนการติดตั้ง Plugin
- การเปลี่ยนแปลงการเปิดใช้และปิดใช้จะ hot-reload พื้นผิว runtime ของ Gateway Plugin สำหรับ turn ใหม่ของ agent ส่วนการติดตั้งจะร้องขอให้รีสตาร์ต Gateway เพราะโมดูล source ของ Plugin เปลี่ยนไป

</Note>

## หมายเหตุเกี่ยวกับพื้นผิว

<AccordionGroup>
  <Accordion title="เซสชันต่อพื้นผิว">
    - **คำสั่งข้อความ** รันในเซสชันแชตปกติ (DM ใช้ `main` ร่วมกัน กลุ่มมีเซสชันของตัวเอง)
    - **คำสั่ง native** ใช้เซสชันแยก:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (กำหนดค่า prefix ได้ผ่าน `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (กำหนดเป้าหมายไปที่เซสชันแชตผ่าน `CommandTargetSessionKey`)
    - **`/stop`** กำหนดเป้าหมายไปที่เซสชันแชตที่ใช้งานอยู่ เพื่อให้ยกเลิก run ปัจจุบันได้

  </Accordion>
  <Accordion title="รายละเอียดเฉพาะของ Slack">
    `channels.slack.slashCommand` ยังคงรองรับสำหรับคำสั่งเดียวในรูปแบบ `/openclaw` หากคุณเปิดใช้ `commands.native` คุณต้องสร้าง slash command ของ Slack หนึ่งรายการต่อคำสั่ง built-in แต่ละคำสั่ง (ชื่อเดียวกับ `/help`) เมนูอาร์กิวเมนต์คำสั่งสำหรับ Slack จะถูกส่งเป็นปุ่ม Block Kit แบบ ephemeral

    ข้อยกเว้น native ของ Slack: ลงทะเบียน `/agentstatus` (ไม่ใช่ `/status`) เพราะ Slack สงวน `/status` ไว้ ข้อความ `/status` ยังคงใช้ได้ในข้อความ Slack

  </Accordion>
</AccordionGroup>

## คำถามแทรก BTW

`/btw` คือ **คำถามแทรก** แบบรวดเร็วเกี่ยวกับเซสชันปัจจุบัน

ต่างจากแชตปกติ:

- ใช้เซสชันปัจจุบันเป็น context พื้นหลัง
- รันเป็นการเรียกแบบครั้งเดียว **ไม่มีเครื่องมือ** แยกต่างหาก
- ไม่เปลี่ยน context ของเซสชันในอนาคต
- ไม่ถูกเขียนลงประวัติ transcript
- ถูกส่งเป็นผลลัพธ์แทรกแบบสดแทนข้อความ assistant ปกติ

สิ่งนี้ทำให้ `/btw` มีประโยชน์เมื่อคุณต้องการคำชี้แจงชั่วคราวขณะที่งานหลักยังดำเนินต่อไป

ตัวอย่าง:

```text
/btw what are we doing right now?
```

ดู [คำถามแทรก BTW](/th/tools/btw) สำหรับพฤติกรรมทั้งหมดและรายละเอียด UX ของ client

## ที่เกี่ยวข้อง

- [การสร้าง Skills](/th/tools/creating-skills)
- [Skills](/th/tools/skills)
- [config ของ Skills](/th/tools/skills-config)
