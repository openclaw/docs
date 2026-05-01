---
read_when:
    - การใช้หรือกำหนดค่าคำสั่งแชท
    - การดีบักการกำหนดเส้นทางคำสั่งหรือสิทธิ์
sidebarTitle: Slash commands
summary: 'คำสั่งสแลช: แบบข้อความเทียบกับแบบเนทีฟ การกำหนดค่า และคำสั่งที่รองรับ'
title: คำสั่งแบบสแลช
x-i18n:
    generated_at: "2026-05-01T10:22:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfa4c8e294080e824b15f0b54842718f7913cf6d42b7edd4ca9695c3d4113924
    source_path: tools/slash-commands.md
    workflow: 16
---

คำสั่งจะถูกจัดการโดย Gateway คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความแบบ **เดี่ยว** ที่ขึ้นต้นด้วย `/` คำสั่งแชต bash เฉพาะโฮสต์ใช้ `! <cmd>` (โดยมี `/bash <cmd>` เป็นนามแฝง)

เมื่อการสนทนาหรือเธรดถูกผูกกับเซสชัน ACP ข้อความติดตามปกติจะถูกส่งต่อไปยัง ACP harness นั้น คำสั่งจัดการ Gateway ยังคงอยู่ในเครื่อง: `/acp ...` จะไปถึงตัวจัดการคำสั่ง ACP ของ OpenClaw เสมอ และ `/status` รวมถึง `/unfocus` จะอยู่ในเครื่องเมื่อใดก็ตามที่เปิดใช้การจัดการคำสั่งสำหรับพื้นผิวนั้น

มีระบบที่เกี่ยวข้องกันสองระบบ:

<AccordionGroup>
  <Accordion title="คำสั่ง">
    ข้อความ `/...` แบบเดี่ยว
  </Accordion>
  <Accordion title="คำสั่งกำกับ">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - คำสั่งกำกับจะถูกตัดออกจากข้อความก่อนที่โมเดลจะเห็น
    - ในข้อความแชตปกติ (ไม่ใช่ข้อความที่มีแต่คำสั่งกำกับ) คำสั่งเหล่านี้จะถือเป็น "คำใบ้แบบอินไลน์" และจะ **ไม่** คงค่าการตั้งค่าเซสชันไว้
    - ในข้อความที่มีแต่คำสั่งกำกับ (ข้อความมีเฉพาะคำสั่งกำกับ) คำสั่งเหล่านี้จะคงค่าไว้กับเซสชันและตอบกลับด้วยการรับทราบ
    - คำสั่งกำกับจะถูกนำไปใช้กับ **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น หากตั้งค่า `commands.allowFrom` ไว้ รายการนี้จะเป็น allowlist เดียวที่ใช้ มิฉะนั้น การอนุญาตจะมาจาก allowlist/การจับคู่ของช่องทาง รวมถึง `commands.useAccessGroups` ผู้ส่งที่ไม่ได้รับอนุญาตจะเห็นคำสั่งกำกับถูกปฏิบัติเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="ทางลัดแบบอินไลน์">
    เฉพาะผู้ส่งที่อยู่ใน allowlist/ได้รับอนุญาตเท่านั้น: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    คำสั่งเหล่านี้จะทำงานทันที ถูกตัดออกก่อนที่โมเดลจะเห็นข้อความ และข้อความที่เหลือจะดำเนินต่อไปตามโฟลว์ปกติ

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
  เปิดใช้การแยกวิเคราะห์ `/...` ในข้อความแชต บนพื้นผิวที่ไม่มีคำสั่งเนทีฟ (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) คำสั่งข้อความยังคงทำงานได้ แม้ว่าคุณจะตั้งค่านี้เป็น `false`
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่งเนทีฟ Auto: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (จนกว่าคุณจะเพิ่มคำสั่งสแลช); ถูกละเว้นสำหรับผู้ให้บริการที่ไม่รองรับเนทีฟ ตั้งค่า `channels.discord.commands.native`, `channels.telegram.commands.native` หรือ `channels.slack.commands.native` เพื่อแทนที่เป็นรายผู้ให้บริการ (bool หรือ `"auto"`) `false` จะล้างคำสั่งที่เคยลงทะเบียนไว้บน Discord/Telegram ตอนเริ่มต้น คำสั่ง Slack จัดการในแอป Slack และจะไม่ถูกลบโดยอัตโนมัติ
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่ง **skill** แบบเนทีฟเมื่อรองรับ Auto: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (Slack ต้องสร้างคำสั่งสแลชต่อหนึ่ง skill) ตั้งค่า `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` หรือ `channels.slack.commands.nativeSkills` เพื่อแทนที่เป็นรายผู้ให้บริการ (bool หรือ `"auto"`)
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  เปิดใช้ `! <cmd>` เพื่อเรียกใช้คำสั่งเชลล์ของโฮสต์ (`/bash <cmd>` เป็นนามแฝง; ต้องใช้ allowlist ของ `tools.elevated`)
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  ควบคุมระยะเวลาที่ bash รอก่อนสลับเป็นโหมดพื้นหลัง (`0` ส่งไปพื้นหลังทันที)
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`)
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  เปิดใช้ `/mcp` (อ่าน/เขียนการกำหนดค่า MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`)
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  เปิดใช้ `/plugins` (การค้นพบ/สถานะ Plugin รวมถึงการติดตั้งและตัวควบคุมเปิดใช้/ปิดใช้)
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  เปิดใช้ `/debug` (การแทนที่เฉพาะรันไทม์)
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  เปิดใช้ `/restart` รวมถึงการดำเนินการเครื่องมือรีสตาร์ท Gateway
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  ตั้งค่า allowlist เจ้าของแบบระบุชัดสำหรับพื้นผิวคำสั่ง/เครื่องมือที่ใช้ได้เฉพาะเจ้าของ นี่คือบัญชีผู้ปฏิบัติงานมนุษย์ที่สามารถอนุมัติการดำเนินการอันตรายและเรียกใช้คำสั่ง เช่น `/diagnostics`, `/export-trajectory` และ `/config` ซึ่งแยกจาก `commands.allowFrom` และจากการเข้าถึงผ่านการจับคู่ DM
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  รายช่องทาง: ทำให้คำสั่งเฉพาะเจ้าของต้องใช้ **ตัวตนเจ้าของ** จึงจะทำงานบนพื้นผิวนั้นได้ เมื่อเป็น `true` ผู้ส่งต้องตรงกับผู้สมัครเป็นเจ้าของที่แก้ไขแล้ว (เช่น รายการใน `commands.ownerAllowFrom` หรือเมตาดาต้าเจ้าของเนทีฟของผู้ให้บริการ) หรือมีสโคปภายใน `operator.admin` บนช่องทางข้อความภายใน รายการไวลด์การ์ดใน `allowFrom` ของช่องทาง หรือรายการผู้สมัครเป็นเจ้าของที่ว่าง/แก้ไขไม่ได้ **ไม่** เพียงพอ คำสั่งเฉพาะเจ้าของจะปิดแบบปลอดภัยบนช่องทางนั้น ปล่อยค่านี้ปิดไว้หากคุณต้องการให้คำสั่งเฉพาะเจ้าของถูกควบคุมเพียงด้วย `ownerAllowFrom` และ allowlist คำสั่งมาตรฐาน
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  ควบคุมวิธีแสดง id เจ้าของในพรอมป์ต์ระบบ
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  ตั้งค่าความลับ HMAC ที่ใช้เมื่อ `commands.ownerDisplay="hash"` ได้ตามต้องการ
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  allowlist รายผู้ให้บริการสำหรับการอนุญาตคำสั่ง เมื่อกำหนดค่าแล้ว จะเป็นแหล่งอนุญาตเดียวสำหรับคำสั่งและคำสั่งกำกับ (allowlist/การจับคู่ของช่องทาง และ `commands.useAccessGroups` จะถูกละเว้น) ใช้ `"*"` สำหรับค่าเริ่มต้นทั่วโลก; คีย์เฉพาะผู้ให้บริการจะแทนที่ค่านี้
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  บังคับใช้ allowlist/นโยบายสำหรับคำสั่งเมื่อไม่ได้ตั้งค่า `commands.allowFrom`
</ParamField>

## รายการคำสั่ง

แหล่งข้อมูลจริงปัจจุบัน:

- built-in หลักมาจาก `src/auto-reply/commands-registry.shared.ts`
- คำสั่ง dock ที่สร้างขึ้นมาจาก `src/auto-reply/commands-registry.data.ts`
- คำสั่ง Plugin มาจากการเรียก `registerCommand()` ของ Plugin
- ความพร้อมใช้งานจริงบน gateway ของคุณยังขึ้นอยู่กับแฟล็กการกำหนดค่า พื้นผิวช่องทาง และ Plugin ที่ติดตั้ง/เปิดใช้งาน

### คำสั่ง built-in หลัก

<AccordionGroup>
  <Accordion title="เซสชันและการรัน">
    - `/new [model]` เริ่มเซสชันใหม่; `/reset` เป็นนามแฝงสำหรับการรีเซ็ต
    - `/reset soft [message]` เก็บทรานสคริปต์ปัจจุบันไว้ ทิ้ง id เซสชันแบ็กเอนด์ CLI ที่ใช้ซ้ำ และรันการโหลด startup/system-prompt ใหม่ในตำแหน่งเดิม
    - `/compact [instructions]` ทำ Compaction บริบทเซสชัน ดู [Compaction](/th/concepts/compaction)
    - `/stop` ยกเลิกการรันปัจจุบัน
    - `/session idle <duration|off>` และ `/session max-age <duration|off>` จัดการการหมดอายุของการผูกเธรด
    - `/export-session [path]` ส่งออกเซสชันปัจจุบันเป็น HTML นามแฝง: `/export`
    - `/export-trajectory [path]` ขอการอนุมัติ exec แล้วส่งออก [trajectory bundle](/th/tools/trajectory) แบบ JSONL สำหรับเซสชันปัจจุบัน ใช้เมื่อคุณต้องการไทม์ไลน์พรอมป์ต์ เครื่องมือ และทรานสคริปต์สำหรับเซสชัน OpenClaw หนึ่งเซสชัน ในแชตกลุ่ม พรอมป์ต์อนุมัติและผลการส่งออกจะส่งถึงเจ้าของแบบส่วนตัว นามแฝง: `/trajectory`

  </Accordion>
  <Accordion title="ตัวควบคุมโมเดลและการรัน">
    - `/think <level>` ตั้งค่าระดับการคิด ตัวเลือกมาจากโปรไฟล์ผู้ให้บริการของโมเดลที่ใช้งานอยู่; ระดับทั่วไปคือ `off`, `minimal`, `low`, `medium` และ `high` โดยมีระดับแบบกำหนดเอง เช่น `xhigh`, `adaptive`, `max` หรือแบบไบนารี `on` เฉพาะเมื่อรองรับเท่านั้น นามแฝง: `/thinking`, `/t`
    - `/verbose on|off|full` สลับเอาต์พุตแบบละเอียด นามแฝง: `/v`
    - `/trace on|off` สลับเอาต์พุต trace ของ Plugin สำหรับเซสชันปัจจุบัน
    - `/fast [status|on|off]` แสดงหรือตั้งค่าโหมดเร็ว
    - `/reasoning [on|off|stream]` สลับการมองเห็น reasoning นามแฝง: `/reason`
    - `/elevated [on|off|ask|full]` สลับโหมดยกระดับ นามแฝง: `/elev`
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` แสดงหรือตั้งค่าเริ่มต้น exec
    - `/model [name|#|status]` แสดงหรือตั้งค่าโมเดล
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` แสดงรายการผู้ให้บริการที่กำหนดค่า/มี auth พร้อมใช้งาน หรือโมเดลของผู้ให้บริการ; เพิ่ม `all` เพื่อเรียกดูแค็ตตาล็อกทั้งหมดของผู้ให้บริการนั้น
    - `/queue <mode>` จัดการพฤติกรรมคิว (`steer`, แบบเดิม `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) รวมถึงตัวเลือก เช่น `debounce:0.5s cap:25 drop:summarize`; `/queue default` หรือ `/queue reset` ล้างการแทนที่ของเซสชัน ดู [คิวคำสั่ง](/th/concepts/queue) และ [คิวการชี้นำ](/th/concepts/queue-steering)

  </Accordion>
  <Accordion title="การค้นพบและสถานะ">
    - `/help` แสดงสรุปความช่วยเหลือแบบสั้น
    - `/commands` แสดงแค็ตตาล็อกคำสั่งที่สร้างขึ้น
    - `/tools [compact|verbose]` แสดงสิ่งที่ agent ปัจจุบันใช้งานได้ในตอนนี้
    - `/status` แสดงสถานะการดำเนินการ/รันไทม์ รวมถึงป้ายกำกับ `Execution`/`Runtime` และการใช้งาน/โควตาของผู้ให้บริการเมื่อมี
    - `/diagnostics [note]` เป็นโฟลว์รายงานสนับสนุนเฉพาะเจ้าของสำหรับบั๊ก Gateway และการรัน Codex harness โดยจะขอการอนุมัติ exec อย่างชัดเจนทุกครั้งก่อนเรียกใช้ `openclaw gateway diagnostics export --json`; อย่าอนุมัติ diagnostics ด้วยกฎอนุญาตทั้งหมด หลังอนุมัติแล้ว จะส่งรายงานที่นำไปวางได้ พร้อมพาธบันเดิลในเครื่อง สรุป manifest หมายเหตุความเป็นส่วนตัว และ id เซสชันที่เกี่ยวข้อง ในแชตกลุ่ม พรอมป์ต์อนุมัติและรายงานจะส่งถึงเจ้าของแบบส่วนตัว เมื่อเซสชันที่ใช้งานอยู่ใช้ OpenAI Codex harness การอนุมัติเดียวกันจะส่งข้อเสนอแนะ Codex ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย และคำตอบที่เสร็จแล้วจะแสดง id เซสชัน OpenClaw, id เธรด Codex และคำสั่ง `codex resume <thread-id>` ดู [การส่งออก Diagnostics](/th/gateway/diagnostics)
    - `/crestodian <request>` เรียกใช้ตัวช่วยตั้งค่าและซ่อมแซม Crestodian จาก DM ของเจ้าของ
    - `/tasks` แสดงรายการงานพื้นหลังที่ใช้งานอยู่/ล่าสุดสำหรับเซสชันปัจจุบัน
    - `/context [list|detail|json]` อธิบายวิธีประกอบบริบท
    - `/whoami` แสดง id ผู้ส่งของคุณ นามแฝง: `/id`
    - `/usage off|tokens|full|cost` ควบคุม footer การใช้งานต่อคำตอบ หรือพิมพ์สรุปต้นทุนในเครื่อง

  </Accordion>
  <Accordion title="Skills, allowlists, approvals">
    - `/skill <name> [input]` เรียกใช้ skill ตามชื่อ
    - `/allowlist [list|add|remove] ...` จัดการรายการ allowlist เฉพาะข้อความเท่านั้น
    - `/approve <id> <decision>` แก้ไขพรอมป์ต์การอนุมัติ exec
    - `/btw <question>` ถามคำถามแทรกโดยไม่เปลี่ยนบริบทเซสชันในอนาคต ดู [BTW](/th/tools/btw)

  </Accordion>
  <Accordion title="Subagents และ ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` จัดการการรัน sub-agent สำหรับเซสชันปัจจุบัน
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` จัดการเซสชัน ACP และตัวเลือกรันไทม์
    - `/focus <target>` ผูกเธรด Discord หรือหัวข้อ/การสนทนา Telegram ปัจจุบันเข้ากับเป้าหมายเซสชัน
    - `/unfocus` ลบการผูกปัจจุบัน
    - `/agents` แสดงรายการ agent ที่ผูกกับเธรดสำหรับเซสชันปัจจุบัน
    - `/kill <id|#|all>` ยกเลิก sub-agent ที่กำลังรันหนึ่งรายการหรือทั้งหมด
    - `/steer <id|#> <message>` ส่งการชี้นำไปยัง sub-agent ที่กำลังรัน นามแฝง: `/tell`

  </Accordion>
  <Accordion title="การเขียนสำหรับเจ้าของเท่านั้นและผู้ดูแลระบบ">
    - `/config show|get|set|unset` อ่านหรือเขียน `openclaw.json` สำหรับเจ้าของเท่านั้น ต้องใช้ `commands.config: true`
    - `/mcp show|get|set|unset` อ่านหรือเขียนการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers` สำหรับเจ้าของเท่านั้น ต้องใช้ `commands.mcp: true`
    - `/plugins list|inspect|show|get|install|enable|disable` ตรวจสอบหรือเปลี่ยนสถานะ Plugin `/plugin` เป็นนามแฝง สำหรับการเขียน เจ้าของเท่านั้น ต้องใช้ `commands.plugins: true`
    - `/debug show|set|unset|reset` จัดการการแทนที่การกำหนดค่าที่มีผลเฉพาะขณะรันไทม์ สำหรับเจ้าของเท่านั้น ต้องใช้ `commands.debug: true`
    - `/restart` รีสตาร์ต OpenClaw เมื่อเปิดใช้ ค่าเริ่มต้น: เปิดใช้; ตั้ง `commands.restart: false` เพื่อปิดใช้
    - `/send on|off|inherit` ตั้งค่านโยบายการส่ง สำหรับเจ้าของเท่านั้น

  </Accordion>
  <Accordion title="เสียง, TTS, การควบคุมช่องทาง">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` ควบคุม TTS ดู [TTS](/th/tools/tts)
    - `/activation mention|always` ตั้งค่าโหมดการเปิดใช้งานกลุ่ม
    - `/bash <command>` รันคำสั่งเชลล์ของโฮสต์ เฉพาะข้อความ นามแฝง: `! <command>` ต้องใช้ `commands.bash: true` ร่วมกับรายการอนุญาต `tools.elevated`
    - `!poll [sessionId]` ตรวจสอบงาน bash เบื้องหลัง
    - `!stop [sessionId]` หยุดงาน bash เบื้องหลัง

  </Accordion>
</AccordionGroup>

### คำสั่ง Dock ที่สร้างขึ้น

คำสั่ง Dock จะเปลี่ยนเส้นทางการตอบกลับของเซสชันปัจจุบันไปยังช่องทางที่ลิงก์ไว้อีกช่องทางหนึ่ง ดู [การ Dock ช่องทาง](/th/concepts/channel-docking) สำหรับการตั้งค่า ตัวอย่าง และการแก้ปัญหา

คำสั่ง Dock สร้างจาก Plugin ช่องทางที่รองรับคำสั่งแบบเนทีฟ ชุดที่มาพร้อมปัจจุบัน:

- `/dock-discord` (นามแฝง: `/dock_discord`)
- `/dock-mattermost` (นามแฝง: `/dock_mattermost`)
- `/dock-slack` (นามแฝง: `/dock_slack`)
- `/dock-telegram` (นามแฝง: `/dock_telegram`)

ใช้คำสั่ง Dock จากแชทโดยตรงเพื่อเปลี่ยนเส้นทางการตอบกลับของเซสชันปัจจุบันไปยังช่องทางที่ลิงก์ไว้อีกช่องทางหนึ่ง เอเจนต์ยังคงใช้บริบทเซสชันเดิม แต่คำตอบในอนาคตสำหรับเซสชันนั้นจะถูกส่งไปยังคู่สนทนาในช่องทางที่เลือก

คำสั่ง Dock ต้องใช้ `session.identityLinks` ผู้ส่งต้นทางและเป้าหมายต้องอยู่ในกลุ่มตัวตนเดียวกัน เช่น `["telegram:123", "discord:456"]` หากผู้ใช้ Telegram ที่มี id `123` ส่ง `/dock_discord` OpenClaw จะเก็บ `lastChannel: "discord"` และ `lastTo: "456"` ไว้ในเซสชันที่ใช้งานอยู่ หากผู้ส่งไม่ได้ลิงก์กับคู่สนทนา Discord คำสั่งจะตอบกลับด้วยคำแนะนำการตั้งค่าแทนที่จะปล่อยผ่านไปยังแชทปกติ

การ Dock เปลี่ยนเฉพาะเส้นทางของเซสชันที่ใช้งานอยู่เท่านั้น ไม่ได้สร้างบัญชีช่องทาง ให้สิทธิ์การเข้าถึง ข้ามรายการอนุญาตของช่องทาง หรือย้ายประวัติทรานสคริปต์ไปยังเซสชันอื่น ใช้ `/dock-telegram`, `/dock-slack`, `/dock-mattermost` หรือคำสั่ง Dock ที่สร้างขึ้นอื่นเพื่อเปลี่ยนเส้นทางอีกครั้ง

### คำสั่ง Plugin ที่มาพร้อม

Plugin ที่มาพร้อมสามารถเพิ่มคำสั่งสแลชเพิ่มเติมได้ คำสั่งที่มาพร้อมปัจจุบันใน repo นี้:

- `/dreaming [on|off|status|help]` เปิดหรือปิด Dreaming ของหน่วยความจำ ดู [Dreaming](/th/concepts/dreaming)
- `/pair [qr|status|pending|approve|cleanup|notify]` จัดการโฟลว์การจับคู่/ตั้งค่าอุปกรณ์ ดู [การจับคู่](/th/channels/pairing)
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` เปิดใช้อาวุธคำสั่งโหนดโทรศัพท์ที่มีความเสี่ยงสูงชั่วคราว
- `/voice status|list [limit]|set <voiceId|name>` จัดการการกำหนดค่าเสียงพูด บน Discord ชื่อคำสั่งแบบเนทีฟคือ `/talkvoice`
- `/card ...` ส่งพรีเซ็ตริชการ์ดของ LINE ดู [LINE](/th/channels/line)
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` ตรวจสอบและควบคุมฮาร์เนส app-server ของ Codex ที่มาพร้อม ดู [ฮาร์เนส Codex](/th/plugins/codex-harness)
- คำสั่งเฉพาะ QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### คำสั่ง Skills แบบไดนามิก

Skills ที่ผู้ใช้เรียกใช้ได้จะแสดงเป็นคำสั่งสแลชด้วย:

- `/skill <name> [input]` ใช้งานได้เสมอในฐานะจุดเข้าใช้งานทั่วไป
- Skills อาจปรากฏเป็นคำสั่งโดยตรง เช่น `/prose` เมื่อ Skills/Plugin ลงทะเบียนไว้
- การลงทะเบียนคำสั่ง Skills แบบเนทีฟควบคุมโดย `commands.nativeSkills` และ `channels.<provider>.commands.nativeSkills`

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับอาร์กิวเมนต์และพาร์เซอร์">
    - คำสั่งยอมรับ `:` ที่ใส่หรือไม่ใส่ก็ได้ระหว่างคำสั่งกับอาร์กิวเมนต์ (เช่น `/think: high`, `/send: on`, `/help:`)
    - `/new <model>` ยอมรับนามแฝงโมเดล, `provider/model` หรือชื่อผู้ให้บริการ (จับคู่แบบคลุมเครือ); หากไม่พบรายการที่ตรงกัน ข้อความจะถูกถือเป็นเนื้อหาข้อความ
    - สำหรับรายละเอียดการใช้งานผู้ให้บริการแบบเต็ม ให้ใช้ `openclaw status --usage`
    - `/allowlist add|remove` ต้องใช้ `commands.config=true` และเคารพ `configWrites` ของช่องทาง
    - ในช่องทางหลายบัญชี `/allowlist --account <id>` ที่กำหนดเป้าหมายการกำหนดค่า และ `/config set channels.<provider>.accounts.<id>...` จะเคารพ `configWrites` ของบัญชีเป้าหมายด้วย
    - `/usage` ควบคุมส่วนท้ายการใช้งานต่อการตอบกลับ; `/usage cost` พิมพ์สรุปต้นทุนภายในเครื่องจากบันทึกเซสชัน OpenClaw
    - `/restart` เปิดใช้งานตามค่าเริ่มต้น; ตั้ง `commands.restart: false` เพื่อปิดใช้
    - `/plugins install <spec>` ยอมรับสเปก Plugin เดียวกับ `openclaw plugins install`: พาธ/อาร์ไคฟ์ภายในเครื่อง, แพ็กเกจ npm, `git:<repo>` หรือ `clawhub:<pkg>`
    - `/plugins enable|disable` อัปเดตการกำหนดค่า Plugin และอาจแจ้งให้รีสตาร์ต

  </Accordion>
  <Accordion title="พฤติกรรมเฉพาะช่องทาง">
    - คำสั่งเนทีฟเฉพาะ Discord: `/vc join|leave|status` ควบคุมช่องเสียง (ไม่พร้อมใช้งานเป็นข้อความ) `join` ต้องมีกิลด์และช่องเสียง/เวทีที่เลือก ต้องใช้ `channels.discord.voice` และคำสั่งแบบเนทีฟ
    - คำสั่งผูกกับเธรดของ Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) ต้องเปิดใช้การผูกเธรดที่มีผล (`session.threadBindings.enabled` และ/หรือ `channels.discord.threadBindings.enabled`)
    - เอกสารอ้างอิงคำสั่ง ACP และพฤติกรรมขณะรันไทม์: [เอเจนต์ ACP](/th/tools/acp-agents)

  </Accordion>
  <Accordion title="ความปลอดภัยของ verbose / trace / fast / reasoning">
    - `/verbose` มีไว้สำหรับการดีบักและเพิ่มการมองเห็น; ให้ปิดไว้ในระหว่างการใช้งานปกติ
    - `/trace` แคบกว่า `/verbose`: จะแสดงเฉพาะบรรทัด trace/debug ที่ Plugin เป็นเจ้าของ และยังคงปิดข้อความเครื่องมือแบบ verbose ปกติไว้
    - `/fast on|off` บันทึกการแทนที่เซสชันไว้ถาวร ใช้ตัวเลือก `inherit` ใน UI เซสชันเพื่อล้างค่าและกลับไปใช้ค่าเริ่มต้นจากการกำหนดค่า
    - `/fast` เฉพาะเจาะจงตามผู้ให้บริการ: OpenAI/OpenAI Codex แมปไปที่ `service_tier=priority` บนเอนด์พอยต์ Responses แบบเนทีฟ ขณะที่คำขอ Anthropic สาธารณะโดยตรง รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย OAuth ที่ส่งไปยัง `api.anthropic.com` แมปไปที่ `service_tier=auto` หรือ `standard_only` ดู [OpenAI](/th/providers/openai) และ [Anthropic](/th/providers/anthropic)
    - สรุปความล้มเหลวของเครื่องมือยังคงแสดงเมื่อเกี่ยวข้อง แต่ข้อความความล้มเหลวแบบละเอียดจะรวมไว้เฉพาะเมื่อ `/verbose` เป็น `on` หรือ `full`
    - `/reasoning`, `/verbose` และ `/trace` มีความเสี่ยงในการตั้งค่าแบบกลุ่ม: อาจเปิดเผยการให้เหตุผลภายใน ผลลัพธ์ของเครื่องมือ หรือการวินิจฉัย Plugin ที่คุณไม่ได้ตั้งใจเปิดเผย แนะนำให้ปิดไว้ โดยเฉพาะในแชทกลุ่ม

  </Accordion>
  <Accordion title="การสลับโมเดล">
    - `/model` บันทึกโมเดลเซสชันใหม่ทันที
    - หากเอเจนต์ว่าง การรันครั้งถัดไปจะใช้ทันที
    - หากมีการรันที่ใช้งานอยู่แล้ว OpenClaw จะทำเครื่องหมายการสลับสดว่าอยู่ระหว่างรอ และจะรีสตาร์ตเข้าสู่โมเดลใหม่เฉพาะเมื่อถึงจุดลองใหม่ที่สะอาด
    - หากกิจกรรมเครื่องมือหรือเอาต์พุตการตอบกลับเริ่มไปแล้ว การสลับที่รออยู่สามารถค้างอยู่ในคิวจนกว่าจะมีโอกาสลองใหม่ในภายหลังหรือถึงรอบผู้ใช้ถัดไป
    - ใน TUI ภายในเครื่อง `/crestodian [request]` กลับจาก TUI เอเจนต์ปกติไปยัง Crestodian สิ่งนี้แยกจากโหมดกู้คืนของช่องทางข้อความและไม่ได้ให้สิทธิ์การกำหนดค่าระยะไกล

  </Accordion>
  <Accordion title="เส้นทางเร็วและทางลัดแบบอินไลน์">
    - **เส้นทางเร็ว:** ข้อความที่มีเฉพาะคำสั่งจากผู้ส่งในรายการอนุญาตจะถูกจัดการทันที (ข้ามคิว + โมเดล)
    - **การกั้นด้วยการกล่าวถึงในกลุ่ม:** ข้อความที่มีเฉพาะคำสั่งจากผู้ส่งในรายการอนุญาตจะข้ามข้อกำหนดการกล่าวถึง
    - **ทางลัดแบบอินไลน์ (เฉพาะผู้ส่งในรายการอนุญาต):** คำสั่งบางรายการยังทำงานได้เมื่อฝังอยู่ในข้อความปกติ และจะถูกตัดออกก่อนที่โมเดลจะเห็นข้อความที่เหลือ
      - ตัวอย่าง: `hey /status` ทริกเกอร์การตอบกลับสถานะ และข้อความที่เหลือจะดำเนินต่อผ่านโฟลว์ปกติ
    - ปัจจุบัน: `/help`, `/commands`, `/status`, `/whoami` (`/id`)
    - ข้อความที่มีเฉพาะคำสั่งจากผู้ที่ไม่ได้รับอนุญาตจะถูกเพิกเฉยแบบเงียบ ๆ และโทเค็น `/...` แบบอินไลน์จะถูกถือเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="คำสั่ง Skills และอาร์กิวเมนต์เนทีฟ">
    - **คำสั่ง Skills:** Skills แบบ `user-invocable` จะแสดงเป็นคำสั่งสแลช ชื่อจะถูกทำให้สะอาดเป็น `a-z0-9_` (สูงสุด 32 ตัวอักษร); ชื่อที่ชนกันจะได้รับส่วนต่อท้ายตัวเลข (เช่น `_2`)
      - `/skill <name> [input]` รัน Skills ตามชื่อ (มีประโยชน์เมื่อข้อจำกัดของคำสั่งเนทีฟทำให้ไม่สามารถมีคำสั่งต่อ Skills ได้)
      - โดยค่าเริ่มต้น คำสั่ง Skills จะถูกส่งต่อไปยังโมเดลเป็นคำขอปกติ
      - Skills อาจประกาศ `command-dispatch: tool` เพื่อกำหนดเส้นทางคำสั่งไปยังเครื่องมือโดยตรงได้ (กำหนดผลได้แน่นอน ไม่ใช้โมเดล)
      - ตัวอย่าง: `/prose` (Plugin OpenProse) — ดู [OpenProse](/th/prose)
    - **อาร์กิวเมนต์คำสั่งเนทีฟ:** Discord ใช้การเติมอัตโนมัติสำหรับตัวเลือกแบบไดนามิก (และเมนูปุ่มเมื่อคุณละเว้นอาร์กิวเมนต์ที่จำเป็น) Telegram และ Slack แสดงเมนูปุ่มเมื่อคำสั่งรองรับตัวเลือกและคุณละเว้นอาร์กิวเมนต์ ตัวเลือกแบบไดนามิกจะถูกแก้ไขตามโมเดลเซสชันเป้าหมาย ดังนั้นตัวเลือกเฉพาะโมเดล เช่น ระดับ `/think` จะตามการแทนที่ `/model` ของเซสชันนั้น

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` ตอบคำถามขณะรันไทม์ ไม่ใช่คำถามการกำหนดค่า: **เอเจนต์นี้ใช้อะไรได้ในตอนนี้ในการสนทนานี้**

- ค่าเริ่มต้นของ `/tools` กระชับและปรับให้เหมาะกับการสแกนอย่างรวดเร็ว
- `/tools verbose` เพิ่มคำอธิบายสั้น ๆ
- พื้นผิวคำสั่งเนทีฟที่รองรับอาร์กิวเมนต์แสดงสวิตช์โหมดเดียวกันเป็น `compact|verbose`
- ผลลัพธ์มีขอบเขตตามเซสชัน ดังนั้นการเปลี่ยนเอเจนต์ ช่องทาง เธรด การอนุญาตผู้ส่ง หรือโมเดล อาจเปลี่ยนเอาต์พุตได้
- `/tools` รวมเครื่องมือที่เข้าถึงได้จริงขณะรันไทม์ รวมถึงเครื่องมือหลัก เครื่องมือจาก Plugin ที่เชื่อมต่อ และเครื่องมือที่ช่องทางเป็นเจ้าของ

สำหรับการแก้ไขโปรไฟล์และการแทนที่ ให้ใช้แผง Tools ใน Control UI หรือพื้นผิวการกำหนดค่า/แค็ตตาล็อก แทนการถือว่า `/tools` เป็นแค็ตตาล็อกแบบคงที่

## พื้นผิวการใช้งาน (สิ่งที่แสดงที่ไหน)

- **การใช้งาน/โควตาของผู้ให้บริการ** (ตัวอย่าง: "Claude เหลือ 80%") แสดงใน `/status` สำหรับผู้ให้บริการโมเดลปัจจุบันเมื่อเปิดใช้การติดตามการใช้งาน OpenClaw ทำให้หน้าต่างของผู้ให้บริการเป็นมาตรฐานเป็น `% left`; สำหรับ MiniMax ฟิลด์เปอร์เซ็นต์แบบเหลือเท่านั้นจะถูกกลับค่าก่อนแสดงผล และคำตอบ `model_remains` จะให้ความสำคัญกับรายการโมเดลแชทพร้อมป้ายแผนที่ติดแท็กโมเดล
- **บรรทัดโทเค็น/แคช** ใน `/status` สามารถถอยกลับไปใช้รายการการใช้งานทรานสคริปต์ล่าสุดเมื่อสแนปช็อตเซสชันสดมีข้อมูลน้อย ค่าสดเดิมที่ไม่เป็นศูนย์ยังคงชนะ และการถอยกลับทรานสคริปต์ยังสามารถกู้คืนป้ายโมเดลรันไทม์ที่ใช้งานอยู่พร้อมยอดรวมที่เน้นพรอมป์ที่ใหญ่ขึ้นเมื่อยอดรวมที่เก็บไว้หายไปหรือน้อยกว่า
- **การดำเนินการเทียบกับรันไทม์:** `/status` รายงาน `Execution` สำหรับพาธแซนด์บ็อกซ์ที่มีผล และ `Runtime` สำหรับผู้ที่กำลังรันเซสชันจริง: `OpenClaw Pi Default`, `OpenAI Codex`, แบ็กเอนด์ CLI หรือแบ็กเอนด์ ACP
- **โทเค็น/ต้นทุนต่อการตอบกลับ** ควบคุมโดย `/usage off|tokens|full` (ต่อท้ายคำตอบปกติ)
- `/model status` เกี่ยวกับ **โมเดล/การยืนยันตัวตน/เอนด์พอยต์** ไม่ใช่การใช้งาน

## การเลือกโมเดล (`/model`)

`/model` ถูกนำไปใช้เป็นไดเรกทีฟ

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

- `/model` และ `/model list` แสดงตัวเลือกแบบกระชับพร้อมหมายเลข (ตระกูลโมเดล + ผู้ให้บริการที่พร้อมใช้งาน)
- บน Discord, `/model` และ `/models` เปิดตัวเลือกแบบโต้ตอบพร้อมเมนูดรอปดาวน์ผู้ให้บริการและโมเดล รวมถึงขั้นตอน Submit
- `/model <#>` เลือกจากตัวเลือกนั้น (และให้ความสำคัญกับผู้ให้บริการปัจจุบันเมื่อเป็นไปได้)
- `/model status` แสดงมุมมองแบบละเอียด รวมถึงเอนด์พอยต์ผู้ให้บริการที่กำหนดค่า (`baseUrl`) และโหมด API (`api`) เมื่อพร้อมใช้งาน

## การแทนที่สำหรับดีบัก

`/debug` ให้คุณตั้งค่าการแทนที่คอนฟิกแบบ **runtime-only** (หน่วยความจำ ไม่ใช่ดิสก์) เจ้าของเท่านั้น ปิดใช้งานตามค่าเริ่มต้น; เปิดใช้งานด้วย `commands.debug: true`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
การแทนที่จะมีผลทันทีต่อการอ่านคอนฟิกใหม่ แต่จะ **ไม่** เขียนลงใน `openclaw.json` ใช้ `/debug reset` เพื่อล้างการแทนที่ทั้งหมดและกลับไปใช้คอนฟิกบนดิสก์
</Note>

## เอาต์พุต trace ของ Plugin

`/trace` ให้คุณเปิดหรือปิด **บรรทัด trace/debug ของ Plugin ที่มีขอบเขตเฉพาะเซสชัน** โดยไม่ต้องเปิดโหมด verbose เต็มรูปแบบ

ตัวอย่าง:

```text
/trace
/trace on
/trace off
```

หมายเหตุ:

- `/trace` ที่ไม่มีอาร์กิวเมนต์จะแสดงสถานะ trace ของเซสชันปัจจุบัน
- `/trace on` เปิดใช้งานบรรทัด trace ของ Plugin สำหรับเซสชันปัจจุบัน
- `/trace off` ปิดใช้งานอีกครั้ง
- บรรทัด trace ของ Plugin อาจปรากฏใน `/status` และเป็นข้อความวินิจฉัยติดตามผลหลังการตอบกลับปกติของผู้ช่วย
- `/trace` ไม่ได้แทนที่ `/debug`; `/debug` ยังคงจัดการการแทนที่คอนฟิกแบบ runtime-only
- `/trace` ไม่ได้แทนที่ `/verbose`; เอาต์พุต tool/status แบบ verbose ปกติยังคงเป็นของ `/verbose`

## การอัปเดตคอนฟิก

`/config` เขียนไปยังคอนฟิกบนดิสก์ของคุณ (`openclaw.json`) เจ้าของเท่านั้น ปิดใช้งานตามค่าเริ่มต้น; เปิดใช้งานด้วย `commands.config: true`

ตัวอย่าง:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
คอนฟิกจะถูกตรวจสอบความถูกต้องก่อนเขียน; การเปลี่ยนแปลงที่ไม่ถูกต้องจะถูกปฏิเสธ การอัปเดตจาก `/config` จะคงอยู่หลังรีสตาร์ต
</Note>

## การอัปเดต MCP

`/mcp` เขียนคำนิยามเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการไว้ใต้ `mcp.servers` เจ้าของเท่านั้น ปิดใช้งานตามค่าเริ่มต้น; เปิดใช้งานด้วย `commands.mcp: true`

ตัวอย่าง:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` จัดเก็บคอนฟิกในคอนฟิก OpenClaw ไม่ใช่การตั้งค่าโปรเจกต์ที่ Pi เป็นเจ้าของ อะแดปเตอร์ runtime จะตัดสินใจว่า transport ใดสามารถเรียกใช้งานได้จริง
</Note>

## การอัปเดต Plugin

`/plugins` ให้ผู้ปฏิบัติงานตรวจสอบ Plugin ที่ค้นพบและสลับการเปิดใช้งานในคอนฟิก โฟลว์แบบอ่านอย่างเดียวสามารถใช้ `/plugin` เป็นนามแฝงได้ ปิดใช้งานตามค่าเริ่มต้น; เปิดใช้งานด้วย `commands.plugins: true`

ตัวอย่าง:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` และ `/plugins show` ใช้การค้นพบ Plugin จริงกับ workspace ปัจจุบันรวมถึงคอนฟิกบนดิสก์
- `/plugins enable|disable` อัปเดตเฉพาะคอนฟิก Plugin; ไม่ได้ติดตั้งหรือถอนการติดตั้ง Plugin
- หลังจากเปลี่ยนแปลงการเปิด/ปิดใช้งาน ให้รีสตาร์ต Gateway เพื่อให้มีผล

</Note>

## หมายเหตุเกี่ยวกับพื้นผิว

<AccordionGroup>
  <Accordion title="เซสชันต่อพื้นผิว">
    - **คำสั่งข้อความ** ทำงานในเซสชันแชตปกติ (DM ใช้ `main` ร่วมกัน กลุ่มมีเซสชันของตัวเอง)
    - **คำสั่ง native** ใช้เซสชันแยก:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (กำหนด prefix ได้ผ่าน `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (กำหนดเป้าหมายไปยังเซสชันแชตผ่าน `CommandTargetSessionKey`)
    - **`/stop`** กำหนดเป้าหมายไปยังเซสชันแชตที่ใช้งานอยู่ เพื่อให้ยกเลิกการรันปัจจุบันได้

  </Accordion>
  <Accordion title="รายละเอียดเฉพาะของ Slack">
    `channels.slack.slashCommand` ยังคงรองรับคำสั่งเดี่ยวแบบ `/openclaw` หากคุณเปิดใช้งาน `commands.native` คุณต้องสร้างคำสั่ง slash ของ Slack หนึ่งคำสั่งต่อคำสั่งในตัวแต่ละรายการ (ชื่อเดียวกับ `/help`) เมนูอาร์กิวเมนต์คำสั่งสำหรับ Slack จะถูกส่งเป็นปุ่ม Block Kit แบบ ephemeral

    ข้อยกเว้น native ของ Slack: ลงทะเบียน `/agentstatus` (ไม่ใช่ `/status`) เพราะ Slack สงวน `/status` ไว้ ข้อความ `/status` ยังคงใช้งานได้ในข้อความ Slack

  </Accordion>
</AccordionGroup>

## คำถามแทรก BTW

`/btw` คือ **คำถามแทรก** แบบรวดเร็วเกี่ยวกับเซสชันปัจจุบัน

ต่างจากแชตปกติ:

- ใช้เซสชันปัจจุบันเป็นบริบทพื้นหลัง
- รันเป็นการเรียกแบบครั้งเดียวแยกต่างหากที่ **ไม่มีเครื่องมือ**
- ไม่เปลี่ยนบริบทเซสชันในอนาคต
- ไม่ถูกเขียนลงในประวัติ transcript
- ส่งเป็นผลลัพธ์แทรกแบบ live แทนข้อความผู้ช่วยปกติ

สิ่งนี้ทำให้ `/btw` มีประโยชน์เมื่อคุณต้องการคำชี้แจงชั่วคราวขณะที่งานหลักยังดำเนินต่อไป

ตัวอย่าง:

```text
/btw what are we doing right now?
```

ดู [คำถามแทรก BTW](/th/tools/btw) สำหรับพฤติกรรมทั้งหมดและรายละเอียด UX ของไคลเอนต์

## ที่เกี่ยวข้อง

- [การสร้าง Skills](/th/tools/creating-skills)
- [Skills](/th/tools/skills)
- [คอนฟิก Skills](/th/tools/skills-config)
