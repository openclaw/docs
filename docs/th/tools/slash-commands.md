---
read_when:
    - การใช้หรือกำหนดค่าคำสั่งแชท
    - การดีบักการกำหนดเส้นทางคำสั่งหรือสิทธิ์
sidebarTitle: Slash commands
summary: 'คำสั่งสแลช: แบบข้อความเทียบกับแบบเนทีฟ การกำหนดค่า และคำสั่งที่รองรับ'
title: คำสั่งสแลช
x-i18n:
    generated_at: "2026-04-30T10:22:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87471982fd03fb35bcb44ae62c9f9e40ec38ad17059c88a1e990194a296fbbd
    source_path: tools/slash-commands.md
    workflow: 16
---

คำสั่งได้รับการจัดการโดย Gateway คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความแบบ **แยกเดี่ยว** ที่ขึ้นต้นด้วย `/` คำสั่งแชต bash เฉพาะโฮสต์ใช้ `! <cmd>` (โดยมี `/bash <cmd>` เป็นชื่อแทน)

เมื่อการสนทนาหรือเธรดถูกผูกกับเซสชัน ACP ข้อความติดตามผลปกติจะถูกส่งต่อไปยังฮาร์เนส ACP นั้น คำสั่งจัดการ Gateway ยังอยู่ในเครื่อง: `/acp ...` จะไปถึงตัวจัดการคำสั่ง ACP ของ OpenClaw เสมอ และ `/status` รวมถึง `/unfocus` จะยังอยู่ในเครื่องเมื่อเปิดใช้การจัดการคำสั่งสำหรับพื้นผิวนั้น

มีระบบที่เกี่ยวข้องกันสองระบบ:

<AccordionGroup>
  <Accordion title="คำสั่ง">
    ข้อความ `/...` แบบแยกเดี่ยว
  </Accordion>
  <Accordion title="คำกำกับ">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - คำกำกับจะถูกตัดออกจากข้อความก่อนที่โมเดลจะเห็น
    - ในข้อความแชตปกติ (ไม่ใช่ข้อความที่มีแต่คำกำกับ) คำกำกับจะถูกถือเป็น "คำใบ้แบบอินไลน์" และจะ **ไม่** คงการตั้งค่าเซสชันไว้
    - ในข้อความที่มีแต่คำกำกับ (ข้อความมีเฉพาะคำกำกับ) คำกำกับจะคงอยู่กับเซสชันและตอบกลับด้วยการรับทราบ
    - คำกำกับจะถูกใช้เฉพาะกับ **ผู้ส่งที่ได้รับอนุญาต** หากตั้งค่า `commands.allowFrom` ไว้ ค่านี้จะเป็นรายการอนุญาตเดียวที่ใช้ มิฉะนั้นการอนุญาตจะมาจากรายการอนุญาต/การจับคู่ของช่องทางร่วมกับ `commands.useAccessGroups` ผู้ส่งที่ไม่ได้รับอนุญาตจะเห็นคำกำกับถูกปฏิบัติเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="ทางลัดแบบอินไลน์">
    เฉพาะผู้ส่งที่อยู่ในรายการอนุญาต/ได้รับอนุญาต: `/help`, `/commands`, `/status`, `/whoami` (`/id`)

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
  เปิดใช้การแยกวิเคราะห์ `/...` ในข้อความแชต บนพื้นผิวที่ไม่มีคำสั่งแบบเนทีฟ (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) คำสั่งข้อความยังทำงานได้แม้คุณตั้งค่านี้เป็น `false`
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่งแบบเนทีฟ อัตโนมัติ: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (จนกว่าคุณจะเพิ่มคำสั่งสแลช); ไม่ใช้กับผู้ให้บริการที่ไม่มีการรองรับแบบเนทีฟ ตั้งค่า `channels.discord.commands.native`, `channels.telegram.commands.native` หรือ `channels.slack.commands.native` เพื่อแทนค่าต่อผู้ให้บริการ (บูลีนหรือ `"auto"`) `false` จะล้างคำสั่งที่เคยลงทะเบียนไว้บน Discord/Telegram เมื่อเริ่มต้น Slack commands ถูกจัดการในแอป Slack และจะไม่ถูกลบโดยอัตโนมัติ
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่ง **Skills** แบบเนทีฟเมื่อรองรับ อัตโนมัติ: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (Slack ต้องสร้างคำสั่งสแลชต่อ Skills แต่ละรายการ) ตั้งค่า `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` หรือ `channels.slack.commands.nativeSkills` เพื่อแทนค่าต่อผู้ให้บริการ (บูลีนหรือ `"auto"`)
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  เปิดใช้ `! <cmd>` เพื่อรันคำสั่งเชลล์ของโฮสต์ (`/bash <cmd>` เป็นชื่อแทน; ต้องใช้รายการอนุญาต `tools.elevated`)
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  ควบคุมระยะเวลาที่ bash รอก่อนสลับเป็นโหมดเบื้องหลัง (`0` ส่งไปทำงานเบื้องหลังทันที)
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`)
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  เปิดใช้ `/mcp` (อ่าน/เขียนการกำหนดค่า MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`)
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  เปิดใช้ `/plugins` (การค้นพบ/สถานะ Plugin รวมถึงตัวควบคุมติดตั้ง + เปิด/ปิดใช้งาน)
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  เปิดใช้ `/debug` (การแทนที่เฉพาะรันไทม์)
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  เปิดใช้ `/restart` รวมถึงแอ็กชันเครื่องมือรีสตาร์ต Gateway
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  ตั้งค่ารายการอนุญาตเจ้าของแบบชัดเจนสำหรับพื้นผิวคำสั่ง/เครื่องมือที่ใช้ได้เฉพาะเจ้าของ นี่คือบัญชีผู้ปฏิบัติงานมนุษย์ที่สามารถอนุมัติการทำงานที่เสี่ยงและรันคำสั่ง เช่น `/diagnostics`, `/export-trajectory` และ `/config` ค่านี้แยกจาก `commands.allowFrom` และจากสิทธิ์เข้าถึงจากการจับคู่ DM
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  ต่อช่องทาง: ทำให้คำสั่งเฉพาะเจ้าของต้องใช้ **ตัวตนเจ้าของ** เพื่อรันบนพื้นผิวนั้น เมื่อเป็น `true` ผู้ส่งต้องตรงกับผู้สมัครเจ้าของที่ระบุได้แล้ว (เช่น รายการใน `commands.ownerAllowFrom` หรือเมตาดาต้าเจ้าของแบบเนทีฟของผู้ให้บริการ) หรือมี scope ภายใน `operator.admin` บนช่องทางข้อความภายใน รายการไวลด์การ์ดใน `allowFrom` ของช่องทาง หรือรายการผู้สมัครเจ้าของที่ว่าง/ยังระบุไม่ได้ **ไม่** เพียงพอ คำสั่งเฉพาะเจ้าของจะปฏิเสธตามหลักปิดไว้ก่อนบนช่องทางนั้น ปิดค่านี้ไว้หากคุณต้องการให้คำสั่งเฉพาะเจ้าของถูกควบคุมด้วย `ownerAllowFrom` และรายการอนุญาตคำสั่งมาตรฐานเท่านั้น
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  ควบคุมวิธีแสดงรหัสเจ้าของในพรอมป์ระบบ
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  ตั้งค่า secret ของ HMAC ที่ใช้เมื่อ `commands.ownerDisplay="hash"` ได้ตามต้องการ
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  รายการอนุญาตต่อผู้ให้บริการสำหรับการอนุญาตคำสั่ง เมื่อตั้งค่าแล้ว ค่านี้จะเป็นแหล่งการอนุญาตเดียวสำหรับคำสั่งและคำกำกับ (รายการอนุญาต/การจับคู่ของช่องทางและ `commands.useAccessGroups` จะถูกละเว้น) ใช้ `"*"` สำหรับค่าเริ่มต้นแบบ global; คีย์เฉพาะผู้ให้บริการจะแทนที่ค่านี้
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  บังคับใช้รายการอนุญาต/นโยบายสำหรับคำสั่งเมื่อไม่ได้ตั้งค่า `commands.allowFrom`
</ParamField>

## รายการคำสั่ง

แหล่งข้อมูลหลักที่ถือเป็นจริงในปัจจุบัน:

- คำสั่งในตัวของแกนหลักมาจาก `src/auto-reply/commands-registry.shared.ts`
- คำสั่งด็อกที่สร้างขึ้นมาจาก `src/auto-reply/commands-registry.data.ts`
- คำสั่ง Plugin มาจากการเรียก `registerCommand()` ของ Plugin
- ความพร้อมใช้งานจริงบน Gateway ของคุณยังขึ้นอยู่กับแฟล็กการกำหนดค่า พื้นผิวของช่องทาง และ Plugin ที่ติดตั้ง/เปิดใช้งาน

### คำสั่งในตัวของแกนหลัก

<AccordionGroup>
  <Accordion title="เซสชันและการรัน">
    - `/new [model]` เริ่มเซสชันใหม่; `/reset` เป็นชื่อแทนสำหรับการรีเซ็ต
    - `/reset soft [message]` คงทรานสคริปต์ปัจจุบันไว้ ตัดรหัสเซสชันของแบ็กเอนด์ CLI ที่นำกลับมาใช้ซ้ำออก และรันการโหลดตอนเริ่มต้น/พรอมป์ระบบซ้ำในที่เดิม
    - `/compact [instructions]` ทำ Compaction บริบทเซสชัน ดู [Compaction](/th/concepts/compaction)
    - `/stop` ยกเลิกการรันปัจจุบัน
    - `/session idle <duration|off>` และ `/session max-age <duration|off>` จัดการเวลาหมดอายุของการผูกเธรด
    - `/export-session [path]` ส่งออกเซสชันปัจจุบันเป็น HTML ชื่อแทน: `/export`
    - `/export-trajectory [path]` ขอการอนุมัติ exec แล้วส่งออก [บันเดิลลำดับเหตุการณ์](/th/tools/trajectory) แบบ JSONL สำหรับเซสชัน OpenClaw ปัจจุบัน ใช้เมื่อต้องการไทม์ไลน์ของพรอมป์ เครื่องมือ และทรานสคริปต์สำหรับเซสชัน OpenClaw หนึ่งเซสชัน ในแชตกลุ่ม พรอมป์การอนุมัติและผลการส่งออกจะถูกส่งไปหาเจ้าของเป็นการส่วนตัว ชื่อแทน: `/trajectory`

  </Accordion>
  <Accordion title="การควบคุมโมเดลและการรัน">
    - `/think <level>` ตั้งค่าระดับการคิด ตัวเลือกมาจากโปรไฟล์ผู้ให้บริการของโมเดลที่ใช้งานอยู่; ระดับที่พบบ่อยคือ `off`, `minimal`, `low`, `medium` และ `high` พร้อมระดับกำหนดเอง เช่น `xhigh`, `adaptive`, `max` หรือค่าไบนารี `on` เฉพาะที่รองรับเท่านั้น ชื่อแทน: `/thinking`, `/t`
    - `/verbose on|off|full` เปิด/ปิดเอาต์พุตแบบละเอียด ชื่อแทน: `/v`
    - `/trace on|off` เปิด/ปิดเอาต์พุตการติดตามของ Plugin สำหรับเซสชันปัจจุบัน
    - `/fast [status|on|off]` แสดงหรือตั้งค่าโหมดเร็ว
    - `/reasoning [on|off|stream]` เปิด/ปิดการแสดงเหตุผล ชื่อแทน: `/reason`
    - `/elevated [on|off|ask|full]` เปิด/ปิดโหมดยกระดับ ชื่อแทน: `/elev`
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` แสดงหรือตั้งค่าเริ่มต้น exec
    - `/model [name|#|status]` แสดงหรือตั้งค่าโมเดล
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` แสดงรายการผู้ให้บริการหรือโมเดลของผู้ให้บริการที่กำหนดค่า/มีการยืนยันตัวตนพร้อมใช้งาน; เพิ่ม `all` เพื่อเรียกดูแค็ตตาล็อกเต็มของผู้ให้บริการนั้น
    - `/queue <mode>` จัดการพฤติกรรมคิว (`steer`, `queue` แบบเดิม, `followup`, `collect`, `steer-backlog`, `interrupt`) รวมถึงตัวเลือกอย่าง `debounce:0.5s cap:25 drop:summarize`; `/queue default` หรือ `/queue reset` จะล้างการแทนค่าของเซสชัน ดู [คิวคำสั่ง](/th/concepts/queue) และ [คิวการชี้นำ](/th/concepts/queue-steering)

  </Accordion>
  <Accordion title="การค้นพบและสถานะ">
    - `/help` แสดงสรุปวิธีใช้แบบสั้น
    - `/commands` แสดงแค็ตตาล็อกคำสั่งที่สร้างขึ้น
    - `/tools [compact|verbose]` แสดงสิ่งที่เอเจนต์ปัจจุบันใช้งานได้ในตอนนี้
    - `/status` แสดงสถานะการดำเนินการ/รันไทม์ รวมถึงป้ายกำกับ `Execution`/`Runtime` และการใช้งาน/โควตาของผู้ให้บริการเมื่อมี
    - `/diagnostics [note]` เป็นโฟลว์รายงานสนับสนุนเฉพาะเจ้าของสำหรับบั๊กของ Gateway และการรันฮาร์เนส Codex คำสั่งนี้จะขอการอนุมัติ exec อย่างชัดเจนทุกครั้งก่อนรัน `openclaw gateway diagnostics export --json`; อย่าอนุมัติการวินิจฉัยด้วยกฎอนุญาตทั้งหมด หลังอนุมัติแล้ว ระบบจะส่งรายงานที่นำไปวางได้พร้อมเส้นทางบันเดิลในเครื่อง สรุปแมนิเฟสต์ หมายเหตุด้านความเป็นส่วนตัว และรหัสเซสชันที่เกี่ยวข้อง ในแชตกลุ่ม พรอมป์การอนุมัติและรายงานจะถูกส่งไปหาเจ้าของเป็นการส่วนตัว เมื่อเซสชันที่ใช้งานอยู่ใช้ฮาร์เนส OpenAI Codex การอนุมัติเดียวกันจะส่งข้อเสนอแนะ Codex ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย และการตอบกลับเมื่อเสร็จสิ้นจะแสดงรายการรหัสเซสชัน OpenClaw รหัสเธรด Codex และคำสั่ง `codex resume <thread-id>` ดู [การส่งออกการวินิจฉัย](/th/gateway/diagnostics)
    - `/crestodian <request>` รันตัวช่วยตั้งค่าและซ่อมแซม Crestodian จาก DM ของเจ้าของ
    - `/tasks` แสดงรายการงานเบื้องหลังที่ใช้งานอยู่/ล่าสุดสำหรับเซสชันปัจจุบัน
    - `/context [list|detail|json]` อธิบายวิธีประกอบบริบท
    - `/whoami` แสดงรหัสผู้ส่งของคุณ ชื่อแทน: `/id`
    - `/usage off|tokens|full|cost` ควบคุมส่วนท้ายการใช้งานต่อการตอบกลับ หรือพิมพ์สรุปค่าใช้จ่ายในเครื่อง

  </Accordion>
  <Accordion title="Skills, รายการอนุญาต, การอนุมัติ">
    - `/skill <name> [input]` เรียกใช้ Skills ตามชื่อ
    - `/allowlist [list|add|remove] ...` จัดการรายการในรายการอนุญาต เฉพาะข้อความ
    - `/approve <id> <decision>` แก้ไขพรอมป์การอนุมัติ exec
    - `/btw <question>` ถามคำถามข้างเคียงโดยไม่เปลี่ยนบริบทเซสชันในอนาคต ดู [BTW](/th/tools/btw)

  </Accordion>
  <Accordion title="เอเจนต์ย่อยและ ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` จัดการการรันของเอเจนต์ย่อยสำหรับเซสชันปัจจุบัน
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` จัดการเซสชัน ACP และตัวเลือกรันไทม์
    - `/focus <target>` ผูกเธรด Discord ปัจจุบันหรือหัวข้อ/การสนทนา Telegram เข้ากับเป้าหมายเซสชัน
    - `/unfocus` ลบการผูกปัจจุบัน
    - `/agents` แสดงรายการเอเจนต์ที่ผูกกับเธรดสำหรับเซสชันปัจจุบัน
    - `/kill <id|#|all>` ยกเลิกเอเจนต์ย่อยที่กำลังรันหนึ่งรายการหรือทั้งหมด
    - `/steer <id|#> <message>` ส่งการชี้นำไปยังเอเจนต์ย่อยที่กำลังรัน ชื่อแทน: `/tell`

  </Accordion>
  <Accordion title="การเขียนสำหรับเจ้าของเท่านั้นและผู้ดูแลระบบ">
    - `/config show|get|set|unset` อ่านหรือเขียน `openclaw.json` สำหรับเจ้าของเท่านั้น ต้องมี `commands.config: true`
    - `/mcp show|get|set|unset` อ่านหรือเขียนการตั้งค่า MCP server ที่ OpenClaw จัดการไว้ใต้ `mcp.servers` สำหรับเจ้าของเท่านั้น ต้องมี `commands.mcp: true`
    - `/plugins list|inspect|show|get|install|enable|disable` ตรวจสอบหรือเปลี่ยนแปลงสถานะ Plugin `/plugin` เป็น alias การเขียนสำหรับเจ้าของเท่านั้น ต้องมี `commands.plugins: true`
    - `/debug show|set|unset|reset` จัดการการ override การตั้งค่าเฉพาะ runtime สำหรับเจ้าของเท่านั้น ต้องมี `commands.debug: true`
    - `/restart` รีสตาร์ต OpenClaw เมื่อเปิดใช้งาน ค่าเริ่มต้น: เปิดใช้งาน; ตั้ง `commands.restart: false` เพื่อปิดใช้งาน
    - `/send on|off|inherit` ตั้งค่านโยบายการส่ง สำหรับเจ้าของเท่านั้น

  </Accordion>
  <Accordion title="เสียง, TTS, การควบคุมช่องทาง">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` ควบคุม TTS ดู [TTS](/th/tools/tts)
    - `/activation mention|always` ตั้งค่าโหมดการเปิดใช้งานในกลุ่ม
    - `/bash <command>` รันคำสั่ง shell ของโฮสต์ แบบข้อความเท่านั้น Alias: `! <command>` ต้องมี `commands.bash: true` พร้อม allowlists ของ `tools.elevated`
    - `!poll [sessionId]` ตรวจสอบงาน bash เบื้องหลัง
    - `!stop [sessionId]` หยุดงาน bash เบื้องหลัง

  </Accordion>
</AccordionGroup>

### คำสั่ง dock ที่สร้างขึ้น

คำสั่ง dock เปลี่ยนเส้นทางตอบกลับของ session ปัจจุบันไปยังช่องทางที่ลิงก์ไว้อีกช่องทาง
ดูการตั้งค่า ตัวอย่าง และการแก้ไขปัญหาได้ที่ [การ dock ช่องทาง](/th/concepts/channel-docking)

คำสั่ง dock สร้างจาก Plugin ช่องทางที่รองรับ native-command ชุดที่ bundle อยู่ในปัจจุบัน:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

ใช้คำสั่ง dock จากแชทตรงเพื่อเปลี่ยนเส้นทางตอบกลับของ session ปัจจุบันไปยังช่องทางที่ลิงก์ไว้อีกช่องทาง agent จะคงบริบท session เดิมไว้ แต่คำตอบในอนาคตของ session นั้นจะถูกส่งไปยัง peer ของช่องทางที่เลือก

คำสั่ง dock ต้องใช้ `session.identityLinks` ผู้ส่งต้นทางและ peer ปลายทางต้องอยู่ในกลุ่มตัวตนเดียวกัน เช่น `["telegram:123", "discord:456"]` ถ้าผู้ใช้ Telegram ที่มี id `123` ส่ง `/dock_discord` OpenClaw จะเก็บ `lastChannel: "discord"` และ `lastTo: "456"` ไว้ใน session ที่ใช้งานอยู่ ถ้าผู้ส่งไม่ได้ลิงก์กับ peer ของ Discord คำสั่งจะตอบกลับด้วยคำแนะนำการตั้งค่าแทนที่จะไหลต่อไปยังแชทปกติ

การ docking เปลี่ยนเฉพาะเส้นทางของ session ที่ใช้งานอยู่เท่านั้น ไม่ได้สร้างบัญชีช่องทาง ให้สิทธิ์เข้าถึง ข้าม allowlists ของช่องทาง หรือย้ายประวัติ transcript ไปยัง session อื่น ใช้ `/dock-telegram`, `/dock-slack`, `/dock-mattermost` หรือคำสั่ง dock ที่สร้างขึ้นอื่นเพื่อเปลี่ยนเส้นทางอีกครั้ง

### คำสั่ง Plugin ที่ bundle มา

Plugin ที่ bundle มาสามารถเพิ่ม slash commands ได้อีก คำสั่งที่ bundle อยู่ใน repo นี้ในปัจจุบัน:

- `/dreaming [on|off|status|help]` เปิดหรือปิด memory dreaming ดู [Dreaming](/th/concepts/dreaming)
- `/pair [qr|status|pending|approve|cleanup|notify]` จัดการโฟลว์การจับคู่/ตั้งค่าอุปกรณ์ ดู [การจับคู่](/th/channels/pairing)
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` เปิดอาวุธคำสั่ง node ของโทรศัพท์ที่มีความเสี่ยงสูงชั่วคราว
- `/voice status|list [limit]|set <voiceId|name>` จัดการการตั้งค่าเสียง Talk บน Discord ชื่อ native command คือ `/talkvoice`
- `/card ...` ส่ง preset การ์ด rich ของ LINE ดู [LINE](/th/channels/line)
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` ตรวจสอบและควบคุม harness app-server ของ Codex ที่ bundle มา ดู [Codex harness](/th/plugins/codex-harness)
- คำสั่งเฉพาะ QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### คำสั่ง skill แบบไดนามิก

Skills ที่ผู้ใช้เรียกได้ถูกเปิดเผยเป็น slash commands ด้วย:

- `/skill <name> [input]` ใช้งานได้เสมอในฐานะ entrypoint ทั่วไป
- skills อาจปรากฏเป็นคำสั่งตรง เช่น `/prose` เมื่อ skill/Plugin ลงทะเบียนไว้
- การลงทะเบียน native skill-command ถูกควบคุมโดย `commands.nativeSkills` และ `channels.<provider>.commands.nativeSkills`

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับอาร์กิวเมนต์และ parser">
    - คำสั่งรับ `:` ระหว่างคำสั่งและ args ได้เป็นตัวเลือก (เช่น `/think: high`, `/send: on`, `/help:`)
    - `/new <model>` รับ model alias, `provider/model` หรือชื่อ provider (จับคู่แบบ fuzzy); ถ้าไม่พบการจับคู่ ข้อความจะถูกถือเป็นเนื้อหาของข้อความ
    - สำหรับรายละเอียดการใช้งาน provider แบบเต็ม ใช้ `openclaw status --usage`
    - `/allowlist add|remove` ต้องใช้ `commands.config=true` และเคารพ `configWrites` ของช่องทาง
    - ในช่องทางหลายบัญชี `/allowlist --account <id>` ที่เจาะจงเป้าหมายการตั้งค่า และ `/config set channels.<provider>.accounts.<id>...` จะเคารพ `configWrites` ของบัญชีเป้าหมายด้วย
    - `/usage` ควบคุม footer การใช้งานต่อการตอบกลับ; `/usage cost` พิมพ์สรุปค่าใช้จ่ายในเครื่องจาก log session ของ OpenClaw
    - `/restart` เปิดใช้งานตามค่าเริ่มต้น; ตั้ง `commands.restart: false` เพื่อปิดใช้งาน
    - `/plugins install <spec>` รับ spec ของ Plugin แบบเดียวกับ `openclaw plugins install`: พาธ/archive ในเครื่อง, npm package หรือ `clawhub:<pkg>`
    - `/plugins enable|disable` อัปเดตการตั้งค่า Plugin และอาจแจ้งให้รีสตาร์ต

  </Accordion>
  <Accordion title="พฤติกรรมเฉพาะช่องทาง">
    - native command เฉพาะ Discord: `/vc join|leave|status` ควบคุมช่องเสียง (ไม่พร้อมใช้งานเป็นข้อความ) `join` ต้องมี guild และช่อง voice/stage ที่เลือกไว้ ต้องใช้ `channels.discord.voice` และ native commands
    - คำสั่งผูก thread ของ Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) ต้องเปิดใช้งาน effective thread bindings (`session.threadBindings.enabled` และ/หรือ `channels.discord.threadBindings.enabled`)
    - เอกสารอ้างอิงคำสั่ง ACP และพฤติกรรม runtime: [agent ACP](/th/tools/acp-agents)

  </Accordion>
  <Accordion title="ความละเอียด / trace / fast / ความปลอดภัยของ reasoning">
    - `/verbose` มีไว้สำหรับการดีบักและการมองเห็นเพิ่มเติม; ให้ปิด **off** ไว้ในการใช้งานปกติ
    - `/trace` แคบกว่า `/verbose`: จะแสดงเฉพาะบรรทัด trace/debug ที่ Plugin เป็นเจ้าของ และปิดข้อความเครื่องมือ verbose ปกติไว้
    - `/fast on|off` คงค่า override ของ session ใช้ตัวเลือก `inherit` ใน Sessions UI เพื่อล้างค่าและกลับไปใช้ค่าเริ่มต้นของ config
    - `/fast` ขึ้นกับ provider: OpenAI/OpenAI Codex map ไปที่ `service_tier=priority` บน native Responses endpoints ส่วนคำขอ Anthropic สาธารณะโดยตรง รวมถึง traffic ที่รับรองด้วย OAuth ซึ่งส่งไปยัง `api.anthropic.com` จะ map ไปที่ `service_tier=auto` หรือ `standard_only` ดู [OpenAI](/th/providers/openai) และ [Anthropic](/th/providers/anthropic)
    - สรุปความล้มเหลวของเครื่องมือยังคงแสดงเมื่อเกี่ยวข้อง แต่ข้อความความล้มเหลวแบบละเอียดจะรวมไว้เฉพาะเมื่อ `/verbose` เป็น `on` หรือ `full`
    - `/reasoning`, `/verbose` และ `/trace` มีความเสี่ยงในการตั้งค่ากลุ่ม: อาจเปิดเผย reasoning ภายใน output ของเครื่องมือ หรือ diagnostics ของ Plugin ที่คุณไม่ได้ตั้งใจเปิดเผย ควรปล่อยให้ปิดไว้ โดยเฉพาะในแชทกลุ่ม

  </Accordion>
  <Accordion title="การสลับโมเดล">
    - `/model` คงค่าโมเดล session ใหม่ทันที
    - ถ้า agent ว่างอยู่ การรันถัดไปจะใช้ทันที
    - ถ้ามีการรันใช้งานอยู่แล้ว OpenClaw จะทำเครื่องหมายการสลับสดเป็น pending และจะรีสตาร์ตเข้าสู่โมเดลใหม่เฉพาะที่จุด retry ที่สะอาด
    - ถ้ากิจกรรมเครื่องมือหรือ output การตอบกลับเริ่มแล้ว การสลับที่ pending อาจค้างอยู่ในคิวจนกว่าจะมีโอกาส retry ภายหลังหรือรอบผู้ใช้ถัดไป
    - ใน TUI ในเครื่อง `/crestodian [request]` จะกลับจาก TUI agent ปกติไปยัง Crestodian สิ่งนี้แยกจากโหมดกู้คืนช่องทางข้อความและไม่ได้ให้สิทธิ์ config ระยะไกล

  </Accordion>
  <Accordion title="Fast path และ shortcut แบบ inline">
    - **Fast path:** ข้อความที่เป็นคำสั่งเท่านั้นจากผู้ส่งใน allowlist จะถูกจัดการทันที (ข้ามคิว + โมเดล)
    - **การกั้นด้วยการ mention ในกลุ่ม:** ข้อความที่เป็นคำสั่งเท่านั้นจากผู้ส่งใน allowlist จะข้ามข้อกำหนดการ mention
    - **shortcut แบบ inline (เฉพาะผู้ส่งใน allowlist):** คำสั่งบางคำสั่งยังใช้งานได้เมื่อฝังอยู่ในข้อความปกติ และจะถูกตัดออกก่อนที่โมเดลจะเห็นข้อความที่เหลือ
      - ตัวอย่าง: `hey /status` เรียกการตอบกลับสถานะ และข้อความที่เหลือจะดำเนินต่อผ่านโฟลว์ปกติ
    - ปัจจุบัน: `/help`, `/commands`, `/status`, `/whoami` (`/id`)
    - ข้อความที่เป็นคำสั่งเท่านั้นโดยไม่ได้รับอนุญาตจะถูกละเว้นแบบเงียบ ๆ และ token `/...` แบบ inline จะถูกถือเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="คำสั่ง Skill และอาร์กิวเมนต์ native">
    - **คำสั่ง Skill:** Skills แบบ `user-invocable` ถูกเปิดเผยเป็น slash commands ชื่อจะถูก sanitize เป็น `a-z0-9_` (สูงสุด 32 อักขระ); การชนกันจะได้ suffix ตัวเลข (เช่น `_2`)
      - `/skill <name> [input]` รัน skill ตามชื่อ (มีประโยชน์เมื่อข้อจำกัด native command ทำให้สร้างคำสั่งต่อ skill ไม่ได้)
      - โดยค่าเริ่มต้น คำสั่ง skill จะถูกส่งต่อไปยังโมเดลเป็นคำขอปกติ
      - Skills อาจประกาศ `command-dispatch: tool` เป็นตัวเลือกเพื่อ route คำสั่งตรงไปยังเครื่องมือ (กำหนดแน่นอน, ไม่มีโมเดล)
      - ตัวอย่าง: `/prose` (OpenProse Plugin) — ดู [OpenProse](/th/prose)
    - **อาร์กิวเมนต์ native command:** Discord ใช้ autocomplete สำหรับตัวเลือกแบบไดนามิก (และเมนูปุ่มเมื่อคุณละ args ที่จำเป็น) Telegram และ Slack แสดงเมนูปุ่มเมื่อคำสั่งรองรับตัวเลือกและคุณละ arg ตัวเลือกแบบไดนามิกจะถูก resolve เทียบกับโมเดล session เป้าหมาย ดังนั้นตัวเลือกเฉพาะโมเดล เช่นระดับ `/think` จะตาม override `/model` ของ session นั้น

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` ตอบคำถาม runtime ไม่ใช่คำถาม config: **agent นี้ใช้อะไรได้ตอนนี้ในการสนทนานี้**

- `/tools` ค่าเริ่มต้นกระชับและปรับให้เหมาะกับการสแกนอย่างรวดเร็ว
- `/tools verbose` เพิ่มคำอธิบายสั้น ๆ
- พื้นผิว native-command ที่รองรับอาร์กิวเมนต์เปิดเผยสวิตช์โหมดเดียวกันคือ `compact|verbose`
- ผลลัพธ์มีขอบเขตตาม session ดังนั้นการเปลี่ยน agent, ช่องทาง, thread, การอนุญาตผู้ส่ง หรือโมเดลอาจเปลี่ยน output ได้
- `/tools` รวมเครื่องมือที่เข้าถึงได้จริงใน runtime รวมถึงเครื่องมือ core, เครื่องมือ Plugin ที่เชื่อมต่อ และเครื่องมือที่ช่องทางเป็นเจ้าของ

สำหรับการแก้ไข profile และ override ให้ใช้แผง Control UI Tools หรือพื้นผิว config/catalog แทนการถือว่า `/tools` เป็น catalog แบบคงที่

## พื้นผิวการใช้งาน (อะไรแสดงที่ไหน)

- **การใช้งาน/quota ของ provider** (ตัวอย่าง: "Claude เหลือ 80%") แสดงใน `/status` สำหรับ provider ของโมเดลปัจจุบันเมื่อเปิดใช้งานการติดตาม usage OpenClaw normalize หน้าต่าง provider เป็น `% left`; สำหรับ MiniMax ฟิลด์เปอร์เซ็นต์แบบ remaining-only จะถูกกลับค่าก่อนแสดง และการตอบกลับ `model_remains` จะใช้รายการ chat-model พร้อมป้าย plan ที่ติด tag โมเดลเป็นหลัก
- **บรรทัด token/cache** ใน `/status` สามารถ fallback ไปยังรายการ usage ของ transcript ล่าสุดได้เมื่อ snapshot session สดมีข้อมูลน้อย ค่า live ที่ไม่เป็นศูนย์ที่มีอยู่ยังชนะ และ transcript fallback ยังสามารถกู้คืนป้ายโมเดล runtime ที่ใช้งานอยู่พร้อมผลรวมที่เน้น prompt ขนาดใหญ่กว่าเมื่อผลรวมที่เก็บไว้ขาดหายหรือเล็กกว่า
- **Execution เทียบกับ runtime:** `/status` รายงาน `Execution` สำหรับพาธ sandbox ที่มีผล และ `Runtime` สำหรับผู้ที่รัน session จริง: `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI หรือ backend ACP
- **token/ค่าใช้จ่ายต่อการตอบกลับ** ถูกควบคุมโดย `/usage off|tokens|full` (แนบท้ายคำตอบปกติ)
- `/model status` เกี่ยวกับ **โมเดล/auth/endpoints** ไม่ใช่ usage

## การเลือกโมเดล (`/model`)

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

- `/model` และ `/model list` แสดง picker แบบกระชับที่มีหมายเลข (ตระกูลโมเดล + provider ที่พร้อมใช้)
- บน Discord, `/model` และ `/models` เปิด picker แบบโต้ตอบพร้อม dropdown provider และโมเดล รวมถึงขั้นตอน Submit
- `/model <#>` เลือกจาก picker นั้น (และเลือก provider ปัจจุบันก่อนเมื่อเป็นไปได้)
- `/model status` แสดงมุมมองแบบละเอียด รวมถึง endpoint ของ provider ที่ตั้งค่าไว้ (`baseUrl`) และโหมด API (`api`) เมื่อมี

## Debug overrides

`/debug` ให้คุณตั้งค่าการแทนที่การกำหนดค่าแบบ **เฉพาะรันไทม์** (ในหน่วยความจำ ไม่ใช่ดิสก์) เฉพาะเจ้าของเท่านั้น ปิดใช้งานโดยค่าเริ่มต้น เปิดใช้ด้วย `commands.debug: true`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
การแทนที่จะมีผลทันทีกับการอ่านการกำหนดค่าใหม่ แต่จะ **ไม่** เขียนลง `openclaw.json` ใช้ `/debug reset` เพื่อล้างการแทนที่ทั้งหมดและกลับไปใช้การกำหนดค่าบนดิสก์
</Note>

## เอาต์พุตการติดตาม Plugin

`/trace` ให้คุณสลับ **บรรทัดการติดตาม/ดีบักของ Plugin ที่จำกัดเฉพาะเซสชัน** โดยไม่ต้องเปิดโหมด verbose แบบเต็ม

ตัวอย่าง:

```text
/trace
/trace on
/trace off
```

หมายเหตุ:

- `/trace` ที่ไม่มีอาร์กิวเมนต์จะแสดงสถานะการติดตามของเซสชันปัจจุบัน
- `/trace on` เปิดใช้บรรทัดการติดตาม Plugin สำหรับเซสชันปัจจุบัน
- `/trace off` ปิดใช้งานอีกครั้ง
- บรรทัดการติดตาม Plugin อาจปรากฏใน `/status` และเป็นข้อความวินิจฉัยเพิ่มเติมหลังการตอบกลับปกติของผู้ช่วย
- `/trace` ไม่ได้แทนที่ `/debug`; `/debug` ยังคงจัดการการแทนที่การกำหนดค่าแบบเฉพาะรันไทม์
- `/trace` ไม่ได้แทนที่ `/verbose`; เอาต์พุตเครื่องมือ/สถานะ verbose ปกติยังคงเป็นหน้าที่ของ `/verbose`

## การอัปเดตการกำหนดค่า

`/config` เขียนไปยังการกำหนดค่าบนดิสก์ของคุณ (`openclaw.json`) เฉพาะเจ้าของเท่านั้น ปิดใช้งานโดยค่าเริ่มต้น เปิดใช้ด้วย `commands.config: true`

ตัวอย่าง:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
การกำหนดค่าจะถูกตรวจสอบความถูกต้องก่อนเขียน การเปลี่ยนแปลงที่ไม่ถูกต้องจะถูกปฏิเสธ การอัปเดต `/config` จะคงอยู่ข้ามการรีสตาร์ต
</Note>

## การอัปเดต MCP

`/mcp` เขียนคำจำกัดความเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการไว้ภายใต้ `mcp.servers` เฉพาะเจ้าของเท่านั้น ปิดใช้งานโดยค่าเริ่มต้น เปิดใช้ด้วย `commands.mcp: true`

ตัวอย่าง:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` เก็บการกำหนดค่าไว้ในการกำหนดค่าของ OpenClaw ไม่ใช่การตั้งค่าโปรเจ็กต์ที่ Pi เป็นเจ้าของ อะแดปเตอร์รันไทม์จะตัดสินว่าทรานสปอร์ตใดเรียกใช้งานได้จริง
</Note>

## การอัปเดต Plugin

`/plugins` ให้ผู้ปฏิบัติงานตรวจสอบ Plugin ที่ค้นพบและสลับการเปิดใช้งานในการกำหนดค่า โฟลว์แบบอ่านอย่างเดียวสามารถใช้ `/plugin` เป็นนามแฝงได้ ปิดใช้งานโดยค่าเริ่มต้น เปิดใช้ด้วย `commands.plugins: true`

ตัวอย่าง:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` และ `/plugins show` ใช้การค้นพบ Plugin จริงกับเวิร์กสเปซปัจจุบันรวมถึงการกำหนดค่าบนดิสก์
- `/plugins enable|disable` อัปเดตเฉพาะการกำหนดค่า Plugin เท่านั้น ไม่ได้ติดตั้งหรือถอนการติดตั้ง Plugin
- หลังเปลี่ยนแปลงการเปิด/ปิดใช้งาน ให้รีสตาร์ต Gateway เพื่อให้มีผล

</Note>

## หมายเหตุเกี่ยวกับพื้นผิว

<AccordionGroup>
  <Accordion title="เซสชันต่อพื้นผิว">
    - **คำสั่งข้อความ** ทำงานในเซสชันแชตปกติ (DM ใช้ `main` ร่วมกัน กลุ่มมีเซสชันของตัวเอง)
    - **คำสั่งเนทีฟ** ใช้เซสชันที่แยกต่างหาก:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (กำหนด prefix ได้ผ่าน `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (กำหนดเป้าหมายไปยังเซสชันแชตผ่าน `CommandTargetSessionKey`)
    - **`/stop`** กำหนดเป้าหมายไปยังเซสชันแชตที่ใช้งานอยู่ เพื่อให้สามารถยกเลิกการรันปัจจุบันได้

  </Accordion>
  <Accordion title="รายละเอียดเฉพาะของ Slack">
    `channels.slack.slashCommand` ยังคงรองรับคำสั่งสไตล์ `/openclaw` คำสั่งเดียว หากคุณเปิดใช้ `commands.native` คุณต้องสร้างคำสั่ง slash ของ Slack หนึ่งคำสั่งต่อคำสั่งในตัวแต่ละรายการ (ชื่อเดียวกับ `/help`) เมนูอาร์กิวเมนต์คำสั่งสำหรับ Slack จะถูกส่งเป็นปุ่ม Block Kit แบบ ephemeral

    ข้อยกเว้นของ Slack native: ลงทะเบียน `/agentstatus` (ไม่ใช่ `/status`) เพราะ Slack สงวน `/status` ไว้ ข้อความ `/status` ยังคงใช้งานได้ในข้อความ Slack

  </Accordion>
</AccordionGroup>

## คำถามข้างเคียง BTW

`/btw` คือ **คำถามข้างเคียง** แบบรวดเร็วเกี่ยวกับเซสชันปัจจุบัน

ต่างจากแชตปกติ:

- ใช้เซสชันปัจจุบันเป็นบริบทพื้นหลัง
- ทำงานเป็นการเรียกแบบครั้งเดียวที่ **ไม่มีเครื่องมือ** แยกต่างหาก
- ไม่เปลี่ยนบริบทเซสชันในอนาคต
- ไม่ถูกเขียนลงประวัติทรานสคริปต์
- ถูกส่งเป็นผลลัพธ์ข้างเคียงแบบสดแทนข้อความผู้ช่วยปกติ

สิ่งนี้ทำให้ `/btw` มีประโยชน์เมื่อคุณต้องการคำชี้แจงชั่วคราวระหว่างที่งานหลักยังดำเนินต่อไป

ตัวอย่าง:

```text
/btw what are we doing right now?
```

ดู [คำถามข้างเคียง BTW](/th/tools/btw) สำหรับรายละเอียดพฤติกรรมทั้งหมดและ UX ของไคลเอนต์

## ที่เกี่ยวข้อง

- [การสร้าง Skills](/th/tools/creating-skills)
- [Skills](/th/tools/skills)
- [การกำหนดค่า Skills](/th/tools/skills-config)
