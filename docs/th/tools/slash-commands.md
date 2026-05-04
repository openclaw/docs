---
read_when:
    - การใช้หรือกำหนดค่าคำสั่งแชต
    - การดีบักการกำหนดเส้นทางคำสั่งหรือสิทธิ์
sidebarTitle: Slash commands
summary: 'คำสั่งสแลช: ข้อความเทียบกับแบบเนทีฟ, การกำหนดค่า และคำสั่งที่รองรับ'
title: คำสั่งแบบสแลช
x-i18n:
    generated_at: "2026-05-04T02:27:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49eb41674c8d0a01dbd28a2df783eb9aba3dde18d8425951a266cede825e9a84
    source_path: tools/slash-commands.md
    workflow: 16
---

คำสั่งจะถูกจัดการโดย Gateway คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความแบบ **เดี่ยว** ที่ขึ้นต้นด้วย `/` คำสั่งแชต bash เฉพาะโฮสต์ใช้ `! <cmd>` (โดยมี `/bash <cmd>` เป็นนามแฝง)

เมื่อบทสนทนาหรือเธรดถูกผูกกับเซสชัน ACP ข้อความติดตามผลตามปกติจะถูกส่งไปยัง ACP harness นั้น คำสั่งจัดการ Gateway ยังคงอยู่ภายในเครื่อง: `/acp ...` จะไปถึงตัวจัดการคำสั่ง ACP ของ OpenClaw เสมอ และ `/status` กับ `/unfocus` จะยังอยู่ภายในเครื่องเมื่อเปิดใช้การจัดการคำสั่งสำหรับพื้นผิวนั้น

มีระบบที่เกี่ยวข้องกันสองระบบ:

<AccordionGroup>
  <Accordion title="คำสั่ง">
    ข้อความ `/...` แบบเดี่ยว
  </Accordion>
  <Accordion title="คำสั่งกำกับ">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - คำสั่งกำกับจะถูกตัดออกจากข้อความก่อนที่โมเดลจะเห็น
    - ในข้อความแชตปกติ (ไม่ใช่ข้อความที่มีแต่คำสั่งกำกับ) คำสั่งเหล่านี้จะถือเป็น "คำแนะนำแบบอินไลน์" และจะ **ไม่** คงการตั้งค่าเซสชันไว้
    - ในข้อความที่มีแต่คำสั่งกำกับ (ข้อความมีเฉพาะคำสั่งกำกับ) คำสั่งเหล่านี้จะคงอยู่ในเซสชันและตอบกลับด้วยการยืนยัน
    - คำสั่งกำกับจะใช้กับ **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น ถ้าตั้งค่า `commands.allowFrom` ไว้ จะใช้รายการอนุญาตนี้เพียงรายการเดียว มิฉะนั้นการอนุญาตจะมาจากรายการอนุญาต/การจับคู่ของช่องทางร่วมกับ `commands.useAccessGroups` ผู้ส่งที่ไม่ได้รับอนุญาตจะเห็นคำสั่งกำกับถูกปฏิบัติเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="ทางลัดอินไลน์">
    เฉพาะผู้ส่งที่อยู่ในรายการอนุญาต/ได้รับอนุญาตเท่านั้น: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

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
  เปิดใช้การแยกวิเคราะห์ `/...` ในข้อความแชต บนพื้นผิวที่ไม่มีคำสั่งเนทีฟ (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) คำสั่งข้อความยังคงทำงานแม้คุณตั้งค่านี้เป็น `false`
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่งเนทีฟ อัตโนมัติ: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (จนกว่าคุณจะเพิ่มคำสั่ง slash); ถูกละเว้นสำหรับผู้ให้บริการที่ไม่รองรับเนทีฟ ตั้งค่า `channels.discord.commands.native`, `channels.telegram.commands.native` หรือ `channels.slack.commands.native` เพื่อแทนที่เป็นรายผู้ให้บริการ (bool หรือ `"auto"`) บน Discord ค่า `false` จะข้ามการลงทะเบียนและการล้างคำสั่ง slash ระหว่างเริ่มต้นระบบ คำสั่งที่เคยลงทะเบียนไว้อาจยังมองเห็นได้จนกว่าคุณจะลบออกจากแอป Discord คำสั่ง Slack จัดการในแอป Slack และจะไม่ถูกลบโดยอัตโนมัติ
</ParamField>
บน Discord ข้อกำหนดคำสั่งเนทีฟอาจมี `descriptionLocalizations` ซึ่ง OpenClaw เผยแพร่เป็น Discord `description_localizations` และรวมไว้ในการเปรียบเทียบการกระทบยอด
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่ง **skill** แบบเนทีฟเมื่อรองรับ อัตโนมัติ: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (Slack ต้องสร้างคำสั่ง slash ต่อหนึ่ง skill) ตั้งค่า `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` หรือ `channels.slack.commands.nativeSkills` เพื่อแทนที่เป็นรายผู้ให้บริการ (bool หรือ `"auto"`)
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  เปิดใช้ `! <cmd>` เพื่อเรียกใช้คำสั่งเชลล์ของโฮสต์ (`/bash <cmd>` เป็นนามแฝง; ต้องมีรายการอนุญาต `tools.elevated`)
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  ควบคุมระยะเวลาที่ bash รอก่อนสลับเป็นโหมดเบื้องหลัง (`0` ส่งไปเบื้องหลังทันที)
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
  เปิดใช้ `/restart` รวมถึงการกระทำของเครื่องมือสำหรับรีสตาร์ต Gateway
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  ตั้งค่ารายการอนุญาตเจ้าของอย่างชัดเจนสำหรับพื้นผิวคำสั่ง/เครื่องมือที่จำกัดเฉพาะเจ้าของ นี่คือบัญชีผู้ปฏิบัติงานที่เป็นมนุษย์ซึ่งสามารถอนุมัติการกระทำอันตรายและเรียกใช้คำสั่ง เช่น `/diagnostics`, `/export-trajectory` และ `/config` ได้ โดยแยกจาก `commands.allowFrom` และจากสิทธิ์เข้าถึงการจับคู่ DM
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  รายช่องทาง: ทำให้คำสั่งที่จำกัดเฉพาะเจ้าของต้องใช้ **ตัวตนเจ้าของ** เพื่อทำงานบนพื้นผิวนั้น เมื่อเป็น `true` ผู้ส่งต้องตรงกับผู้สมัครเจ้าของที่แปลงค่าแล้ว (เช่น รายการใน `commands.ownerAllowFrom` หรือเมทาดาทาเจ้าของเนทีฟของผู้ให้บริการ) หรือมีขอบเขต `operator.admin` ภายในบนช่องทางข้อความภายใน รายการไวลด์การ์ดในช่องทาง `allowFrom` หรือรายการผู้สมัครเจ้าของที่ว่างเปล่า/แปลงค่าไม่ได้ **ไม่** เพียงพอ คำสั่งที่จำกัดเฉพาะเจ้าของจะล้มเหลวแบบปิดบนช่องทางนั้น ปิดค่านี้ไว้ถ้าคุณต้องการให้คำสั่งที่จำกัดเฉพาะเจ้าของถูกควบคุมเฉพาะด้วย `ownerAllowFrom` และรายการอนุญาตคำสั่งมาตรฐาน
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  ควบคุมวิธีที่รหัสเจ้าของปรากฏในพรอมป์ระบบ
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  ตั้งค่าความลับ HMAC ที่ใช้เมื่อ `commands.ownerDisplay="hash"` ได้ตามต้องการ
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  รายการอนุญาตรายผู้ให้บริการสำหรับการอนุญาตคำสั่ง เมื่อตั้งค่าแล้ว จะเป็นแหล่งอนุญาตเดียวสำหรับคำสั่งและคำสั่งกำกับ (รายการอนุญาต/การจับคู่ของช่องทางและ `commands.useAccessGroups` จะถูกละเว้น) ใช้ `"*"` เป็นค่าเริ่มต้นทั่วโลก; คีย์เฉพาะผู้ให้บริการจะแทนที่ค่านั้น
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  บังคับใช้รายการอนุญาต/นโยบายสำหรับคำสั่งเมื่อไม่ได้ตั้งค่า `commands.allowFrom`
</ParamField>

## รายการคำสั่ง

แหล่งความจริงปัจจุบัน:

- คำสั่งในตัวของแกนหลักมาจาก `src/auto-reply/commands-registry.shared.ts`
- คำสั่ง dock ที่สร้างขึ้นมาจาก `src/auto-reply/commands-registry.data.ts`
- คำสั่ง Plugin มาจากการเรียก `registerCommand()` ของ Plugin
- ความพร้อมใช้งานจริงบน Gateway ของคุณยังขึ้นอยู่กับแฟล็กการกำหนดค่า พื้นผิวช่องทาง และ Plugin ที่ติดตั้ง/เปิดใช้

### คำสั่งในตัวของแกนหลัก

<AccordionGroup>
  <Accordion title="เซสชันและการเรียกใช้">
    - `/new [model]` เริ่มเซสชันใหม่; `/reset` เป็นนามแฝงสำหรับรีเซ็ต
    - Control UI จะดักจับ `/new` ที่พิมพ์เข้ามาเพื่อสร้างและสลับไปยังเซสชันแดชบอร์ดใหม่; `/reset` ที่พิมพ์เข้ามายังคงเรียกใช้การรีเซ็ตในที่เดิมของ Gateway
    - `/reset soft [message]` เก็บทรานสคริปต์ปัจจุบันไว้ ทิ้งรหัสเซสชันแบ็กเอนด์ CLI ที่ใช้ซ้ำ และเรียกโหลด startup/system-prompt ใหม่ในที่เดิม
    - `/compact [instructions]` ทำ Compaction บริบทเซสชัน ดู [Compaction](/th/concepts/compaction)
    - `/stop` ยกเลิกการเรียกใช้ปัจจุบัน
    - `/session idle <duration|off>` และ `/session max-age <duration|off>` จัดการการหมดอายุของการผูกเธรด
    - `/export-session [path]` ส่งออกเซสชันปัจจุบันเป็น HTML นามแฝง: `/export`
    - `/export-trajectory [path]` ขอการอนุมัติ exec แล้วส่งออก [ชุด trajectory](/th/tools/trajectory) แบบ JSONL สำหรับเซสชันปัจจุบัน ใช้เมื่อคุณต้องการลำดับเวลาของพรอมป์ เครื่องมือ และทรานสคริปต์สำหรับเซสชัน OpenClaw หนึ่งรายการ ในแชตกลุ่ม พรอมป์อนุมัติและผลการส่งออกจะส่งถึงเจ้าของเป็นการส่วนตัว นามแฝง: `/trajectory`

  </Accordion>
  <Accordion title="ตัวควบคุมโมเดลและการเรียกใช้">
    - `/think <level>` ตั้งค่าระดับการคิด ตัวเลือกมาจากโปรไฟล์ผู้ให้บริการของโมเดลที่ใช้งานอยู่; ระดับทั่วไปคือ `off`, `minimal`, `low`, `medium` และ `high` โดยมีระดับกำหนดเอง เช่น `xhigh`, `adaptive`, `max` หรือแบบไบนารี `on` เฉพาะที่รองรับเท่านั้น นามแฝง: `/thinking`, `/t`
    - `/verbose on|off|full` สลับเอาต์พุตแบบละเอียด นามแฝง: `/v`
    - `/trace on|off` สลับเอาต์พุตการติดตาม Plugin สำหรับเซสชันปัจจุบัน
    - `/fast [status|on|off]` แสดงหรือตั้งค่าโหมดเร็ว
    - `/reasoning [on|off|stream]` สลับการมองเห็นเหตุผล นามแฝง: `/reason`
    - `/elevated [on|off|ask|full]` สลับโหมดยกระดับ นามแฝง: `/elev`
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` แสดงหรือตั้งค่า exec เริ่มต้น
    - `/model [name|#|status]` แสดงหรือตั้งค่าโมเดล
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` แสดงรายการผู้ให้บริการที่กำหนดค่าไว้/มีการยืนยันตัวตนพร้อมใช้งาน หรือโมเดลสำหรับผู้ให้บริการหนึ่งราย; เพิ่ม `all` เพื่อเรียกดูแค็ตตาล็อกทั้งหมดของผู้ให้บริการนั้น
    - `/queue <mode>` จัดการพฤติกรรมคิว (`steer`, `queue` แบบเดิม, `followup`, `collect`, `steer-backlog`, `interrupt`) รวมถึงตัวเลือก เช่น `debounce:0.5s cap:25 drop:summarize`; `/queue default` หรือ `/queue reset` ล้างการแทนที่ของเซสชัน ดู [คิวคำสั่ง](/th/concepts/queue) และ [คิวการชี้นำ](/th/concepts/queue-steering)
    - `/steer <message>` แทรกคำแนะนำลงในการเรียกใช้ที่ใช้งานอยู่สำหรับเซสชันปัจจุบัน โดยไม่ขึ้นกับโหมด `/queue` คำสั่งนี้จะไม่เริ่มการเรียกใช้ใหม่เมื่อเซสชันว่างอยู่ นามแฝง: `/tell` ดู [ชี้นำ](/th/tools/steer)

  </Accordion>
  <Accordion title="การค้นพบและสถานะ">
    - `/help` แสดงสรุปความช่วยเหลือแบบสั้น
    - `/commands` แสดงแค็ตตาล็อกคำสั่งที่สร้างขึ้น
    - `/tools [compact|verbose]` แสดงสิ่งที่เอเจนต์ปัจจุบันใช้ได้ในตอนนี้
    - `/status` แสดงสถานะการประมวลผล/รันไทม์ รวมถึงป้ายกำกับ `Execution`/`Runtime` และการใช้งาน/โควตาของผู้ให้บริการเมื่อมีข้อมูล
    - `/diagnostics [note]` คือโฟลว์รายงานการสนับสนุนที่จำกัดเฉพาะเจ้าของสำหรับบั๊ก Gateway และการเรียกใช้ Codex harness โดยจะขอการอนุมัติ exec อย่างชัดเจนทุกครั้งก่อนเรียกใช้ `openclaw gateway diagnostics export --json`; อย่าอนุมัติการวินิจฉัยด้วยกฎ allow-all หลังอนุมัติแล้ว จะส่งรายงานที่วางต่อได้พร้อมพาธบันเดิลภายในเครื่อง สรุปแมนิเฟสต์ หมายเหตุความเป็นส่วนตัว และรหัสเซสชันที่เกี่ยวข้อง ในแชตกลุ่ม พรอมป์อนุมัติและรายงานจะส่งถึงเจ้าของเป็นการส่วนตัว เมื่อเซสชันที่ใช้งานอยู่ใช้ OpenAI Codex harness การอนุมัติเดียวกันนี้จะส่งข้อเสนอแนะ Codex ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย และคำตอบที่เสร็จสมบูรณ์จะแสดงรหัสเซสชัน OpenClaw รหัสเธรด Codex และคำสั่ง `codex resume <thread-id>` ดู [การส่งออกการวินิจฉัย](/th/gateway/diagnostics)
    - `/crestodian <request>` เรียกใช้ตัวช่วยตั้งค่าและซ่อมแซม Crestodian จาก DM ของเจ้าของ
    - `/tasks` แสดงรายการงานเบื้องหลังที่ใช้งานอยู่/ล่าสุดสำหรับเซสชันปัจจุบัน
    - `/context [list|detail|json]` อธิบายวิธีประกอบบริบท
    - `/whoami` แสดงรหัสผู้ส่งของคุณ นามแฝง: `/id`
    - `/usage off|tokens|full|cost` ควบคุมส่วนท้ายการใช้งานต่อคำตอบ หรือพิมพ์สรุปต้นทุนภายในเครื่อง

  </Accordion>
  <Accordion title="Skills, รายการอนุญาต, การอนุมัติ">
    - `/skill <name> [input]` เรียกใช้ skill ตามชื่อ
    - `/allowlist [list|add|remove] ...` จัดการรายการอนุญาต เฉพาะข้อความ
    - `/approve <id> <decision>` แก้ไขพรอมป์อนุมัติ exec
    - `/btw <question>` ถามคำถามข้างเคียงโดยไม่เปลี่ยนบริบทเซสชันในอนาคต นามแฝง: `/side` ดู [BTW](/th/tools/btw)

  </Accordion>
  <Accordion title="Subagents and ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` จัดการการรันตัวแทนย่อยสำหรับเซสชันปัจจุบัน
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` จัดการเซสชัน ACP และตัวเลือกรันไทม์
    - `/focus <target>` ผูกเธรด Discord หรือหัวข้อ/บทสนทนา Telegram ปัจจุบันเข้ากับเป้าหมายเซสชัน
    - `/unfocus` ลบการผูกปัจจุบัน
    - `/agents` แสดงรายการตัวแทนที่ผูกกับเธรดสำหรับเซสชันปัจจุบัน
    - `/kill <id|#|all>` ยกเลิกตัวแทนย่อยที่กำลังรันอยู่หนึ่งรายการหรือทั้งหมด
    - `/subagents steer <id|#> <message>` ส่งการกำกับไปยังตัวแทนย่อยที่กำลังรันอยู่ ดู [Steer](/th/tools/steer)

  </Accordion>
  <Accordion title="Owner-only writes and admin">
    - `/config show|get|set|unset` อ่านหรือเขียน `openclaw.json` เฉพาะเจ้าของเท่านั้น ต้องมี `commands.config: true`
    - `/mcp show|get|set|unset` อ่านหรือเขียนการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers` เฉพาะเจ้าของเท่านั้น ต้องมี `commands.mcp: true`
    - `/plugins list|inspect|show|get|install|enable|disable` ตรวจสอบหรือเปลี่ยนสถานะ Plugin `/plugin` เป็นนามแฝง การเขียนทำได้เฉพาะเจ้าของเท่านั้น ต้องมี `commands.plugins: true`
    - `/debug show|set|unset|reset` จัดการการเขียนทับการกำหนดค่าที่ใช้เฉพาะรันไทม์ เฉพาะเจ้าของเท่านั้น ต้องมี `commands.debug: true`
    - `/restart` รีสตาร์ต OpenClaw เมื่อเปิดใช้งาน ค่าเริ่มต้น: เปิดใช้งาน; ตั้ง `commands.restart: false` เพื่อปิดใช้งาน
    - `/send on|off|inherit` ตั้งค่านโยบายการส่ง เฉพาะเจ้าของเท่านั้น

  </Accordion>
  <Accordion title="Voice, TTS, channel control">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` ควบคุม TTS ดู [TTS](/th/tools/tts)
    - `/activation mention|always` ตั้งค่าโหมดการเปิดใช้งานกลุ่ม
    - `/bash <command>` รันคำสั่งเชลล์ของโฮสต์ แบบข้อความเท่านั้น นามแฝง: `! <command>` ต้องมี `commands.bash: true` พร้อม allowlists ของ `tools.elevated`
    - `!poll [sessionId]` ตรวจสอบงาน bash เบื้องหลัง
    - `!stop [sessionId]` หยุดงาน bash เบื้องหลัง

  </Accordion>
</AccordionGroup>

### คำสั่ง dock ที่สร้างขึ้น

คำสั่ง dock จะสลับเส้นทางการตอบกลับของเซสชันปัจจุบันไปยังช่องทางอื่นที่ลิงก์ไว้
ดู [Channel docking](/th/concepts/channel-docking) สำหรับการตั้งค่า
ตัวอย่าง และการแก้ไขปัญหา

คำสั่ง dock สร้างจาก Plugin ของช่องทางที่รองรับคำสั่งเนทีฟ ชุดที่บันเดิลอยู่ในปัจจุบัน:

- `/dock-discord` (นามแฝง: `/dock_discord`)
- `/dock-mattermost` (นามแฝง: `/dock_mattermost`)
- `/dock-slack` (นามแฝง: `/dock_slack`)
- `/dock-telegram` (นามแฝง: `/dock_telegram`)

ใช้คำสั่ง dock จากแชทโดยตรงเพื่อสลับเส้นทางการตอบกลับของเซสชันปัจจุบันไปยังช่องทางอื่นที่ลิงก์ไว้ ตัวแทนจะคงบริบทเซสชันเดิมไว้ แต่การตอบกลับในอนาคตสำหรับเซสชันนั้นจะถูกส่งไปยัง peer ของช่องทางที่เลือก

คำสั่ง dock ต้องใช้ `session.identityLinks` ผู้ส่งต้นทางและ peer เป้าหมายต้องอยู่ในกลุ่มข้อมูลประจำตัวเดียวกัน เช่น `["telegram:123", "discord:456"]` หากผู้ใช้ Telegram ที่มี id `123` ส่ง `/dock_discord` OpenClaw จะเก็บ `lastChannel: "discord"` และ `lastTo: "456"` ไว้ในเซสชันที่ใช้งานอยู่ หากผู้ส่งไม่ได้ลิงก์กับ peer ของ Discord คำสั่งจะตอบกลับด้วยคำแนะนำการตั้งค่าแทนที่จะส่งต่อไปยังแชทปกติ

การ dock เปลี่ยนเฉพาะเส้นทางเซสชันที่ใช้งานอยู่เท่านั้น ไม่สร้างบัญชีช่องทาง ไม่ให้สิทธิ์เข้าถึง ไม่ข้าม allowlists ของช่องทาง และไม่ย้ายประวัติ transcript ไปยังเซสชันอื่น ใช้ `/dock-telegram`, `/dock-slack`, `/dock-mattermost` หรือคำสั่ง dock ที่สร้างขึ้นอื่นเพื่อสลับเส้นทางอีกครั้ง

### คำสั่ง Plugin ที่บันเดิลมา

Plugin ที่บันเดิลมาสามารถเพิ่มคำสั่ง slash ได้อีก คำสั่งที่บันเดิลอยู่ใน repo นี้ในปัจจุบัน:

- `/dreaming [on|off|status|help]` เปิดหรือปิด memory dreaming ดู [Dreaming](/th/concepts/dreaming)
- `/pair [qr|status|pending|approve|cleanup|notify]` จัดการโฟลว์การจับคู่/ตั้งค่าอุปกรณ์ ดู [Pairing](/th/channels/pairing)
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` ติดอาวุธคำสั่ง node โทรศัพท์ที่มีความเสี่ยงสูงชั่วคราว
- `/voice status|list [limit]|set <voiceId|name>` จัดการการกำหนดค่าเสียง Talk บน Discord ชื่อคำสั่งเนทีฟคือ `/talkvoice`
- `/card ...` ส่งพรีเซ็ต LINE rich card ดู [LINE](/th/channels/line)
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` ตรวจสอบและควบคุม harness ของ app-server Codex ที่บันเดิลมา ดู [Codex harness](/th/plugins/codex-harness)
- คำสั่งเฉพาะ QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### คำสั่ง Skills แบบไดนามิก

Skills ที่ผู้ใช้เรียกใช้ได้ยังถูกเปิดเผยเป็นคำสั่ง slash ด้วย:

- `/skill <name> [input]` ใช้งานได้เสมอในฐานะจุดเข้าใช้งานทั่วไป
- Skills อาจปรากฏเป็นคำสั่งโดยตรง เช่น `/prose` เมื่อ skill/Plugin ลงทะเบียนไว้
- การลงทะเบียนคำสั่ง skill แบบเนทีฟควบคุมโดย `commands.nativeSkills` และ `channels.<provider>.commands.nativeSkills`
- สเปกคำสั่งสามารถระบุ `descriptionLocalizations` สำหรับพื้นผิวเนทีฟที่รองรับคำอธิบายที่แปลแล้ว รวมถึง Discord

<AccordionGroup>
  <Accordion title="Argument and parser notes">
    - คำสั่งยอมรับ `:` แบบไม่บังคับระหว่างคำสั่งและอาร์กิวเมนต์ (เช่น `/think: high`, `/send: on`, `/help:`)
    - `/new <model>` ยอมรับนามแฝงโมเดล, `provider/model` หรือชื่อผู้ให้บริการ (จับคู่แบบ fuzzy); หากไม่พบการจับคู่ ข้อความจะถูกถือเป็นเนื้อหาข้อความ
    - สำหรับรายละเอียดการใช้งานผู้ให้บริการแบบเต็ม ให้ใช้ `openclaw status --usage`
    - `/allowlist add|remove` ต้องมี `commands.config=true` และเคารพ `configWrites` ของช่องทาง
    - ในช่องทางหลายบัญชี `/allowlist --account <id>` ที่เจาะจงเป้าหมายการกำหนดค่า และ `/config set channels.<provider>.accounts.<id>...` จะเคารพ `configWrites` ของบัญชีเป้าหมายด้วย
    - `/usage` ควบคุม footer การใช้งานต่อการตอบกลับ; `/usage cost` พิมพ์สรุปค่าใช้จ่ายภายในเครื่องจากบันทึกเซสชัน OpenClaw
    - `/restart` เปิดใช้งานตามค่าเริ่มต้น; ตั้ง `commands.restart: false` เพื่อปิดใช้งาน
    - `/plugins install <spec>` ยอมรับสเปก Plugin เดียวกับ `openclaw plugins install`: พาธ/ไฟล์เก็บถาวรในเครื่อง, แพ็กเกจ npm, `git:<repo>` หรือ `clawhub:<pkg>` จากนั้นร้องขอให้รีสตาร์ต Gateway เพราะโมดูลซอร์สของ Plugin เปลี่ยนไป
    - `/plugins enable|disable` อัปเดตการกำหนดค่า Plugin และทริกเกอร์การโหลด Plugin ของ Gateway ใหม่สำหรับเทิร์นตัวแทนใหม่

  </Accordion>
  <Accordion title="Channel-specific behavior">
    - คำสั่งเนทีฟเฉพาะ Discord: `/vc join|leave|status` ควบคุมช่องเสียง (ใช้เป็นข้อความไม่ได้) `join` ต้องมี guild และช่อง voice/stage ที่เลือกไว้ ต้องมี `channels.discord.voice` และคำสั่งเนทีฟ
    - คำสั่งผูกเธรดของ Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) ต้องเปิดใช้การผูกเธรดที่มีผล (`session.threadBindings.enabled` และ/หรือ `channels.discord.threadBindings.enabled`)
    - อ้างอิงคำสั่ง ACP และพฤติกรรมรันไทม์: [ACP agents](/th/tools/acp-agents)

  </Accordion>
  <Accordion title="Verbose / trace / fast / reasoning safety">
    - `/verbose` มีไว้สำหรับการดีบักและการมองเห็นเพิ่มเติม; ให้ปิดไว้ (**off**) ในการใช้งานปกติ
    - `/trace` แคบกว่า `/verbose`: จะแสดงเฉพาะบรรทัด trace/debug ที่ Plugin เป็นเจ้าของ และปิดข้อความเครื่องมือ verbose ปกติไว้
    - `/fast on|off` คงการเขียนทับของเซสชันไว้ ใช้ตัวเลือก `inherit` ใน UI เซสชันเพื่อล้างและย้อนกลับไปใช้ค่าเริ่มต้นจากการกำหนดค่า
    - `/fast` ขึ้นกับผู้ให้บริการ: OpenAI/OpenAI Codex แมปไปยัง `service_tier=priority` บน endpoint Responses แบบเนทีฟ ขณะที่คำขอ Anthropic สาธารณะโดยตรง รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย OAuth และส่งไปยัง `api.anthropic.com` จะแมปไปยัง `service_tier=auto` หรือ `standard_only` ดู [OpenAI](/th/providers/openai) และ [Anthropic](/th/providers/anthropic)
    - สรุปความล้มเหลวของเครื่องมือยังคงแสดงเมื่อเกี่ยวข้อง แต่ข้อความความล้มเหลวแบบละเอียดจะถูกรวมไว้เฉพาะเมื่อ `/verbose` เป็น `on` หรือ `full`
    - `/reasoning`, `/verbose` และ `/trace` มีความเสี่ยงในการตั้งค่ากลุ่ม: อาจเปิดเผยการให้เหตุผลภายใน ผลลัพธ์เครื่องมือ หรือการวินิจฉัยของ Plugin ที่คุณไม่ได้ตั้งใจเปิดเผย ควรปิดไว้ โดยเฉพาะในแชทกลุ่ม

  </Accordion>
  <Accordion title="Model switching">
    - `/model` คงโมเดลเซสชันใหม่ไว้ทันที
    - หากตัวแทนว่าง การรันถัดไปจะใช้ทันที
    - หากมีการรันที่ใช้งานอยู่แล้ว OpenClaw จะทำเครื่องหมายการสลับแบบสดเป็นรายการรอดำเนินการ และจะรีสตาร์ตเข้าสู่โมเดลใหม่เฉพาะที่จุด retry ที่สะอาดเท่านั้น
    - หากกิจกรรมเครื่องมือหรือผลลัพธ์การตอบกลับเริ่มไปแล้ว การสลับที่รอดำเนินการอาจยังคงอยู่ในคิวจนกว่าจะมีโอกาส retry ภายหลังหรือเทิร์นผู้ใช้ถัดไป
    - ใน TUI ภายในเครื่อง `/crestodian [request]` จะกลับจาก TUI ตัวแทนปกติไปยัง Crestodian ส่วนนี้แยกจากโหมดกู้คืนของช่องทางข้อความ และไม่ได้ให้สิทธิ์การกำหนดค่าระยะไกล

  </Accordion>
  <Accordion title="Fast path and inline shortcuts">
    - **เส้นทางด่วน:** ข้อความที่มีเฉพาะคำสั่งจากผู้ส่งที่อยู่ใน allowlist จะถูกจัดการทันที (ข้ามคิว + โมเดล)
    - **การกั้นด้วยการกล่าวถึงในกลุ่ม:** ข้อความที่มีเฉพาะคำสั่งจากผู้ส่งที่อยู่ใน allowlist จะข้ามข้อกำหนดการกล่าวถึง
    - **ทางลัดแบบ inline (เฉพาะผู้ส่งที่อยู่ใน allowlist):** บางคำสั่งยังใช้งานได้เมื่อฝังอยู่ในข้อความปกติ และจะถูกตัดออกก่อนที่โมเดลจะเห็นข้อความที่เหลือ
      - ตัวอย่าง: `hey /status` ทริกเกอร์การตอบกลับสถานะ และข้อความที่เหลือจะดำเนินต่อผ่านโฟลว์ปกติ
    - ปัจจุบัน: `/help`, `/commands`, `/status`, `/whoami` (`/id`)
    - ข้อความที่มีเฉพาะคำสั่งแต่ไม่ได้รับอนุญาตจะถูกละเว้นอย่างเงียบ ๆ และโทเค็น `/...` แบบ inline จะถูกถือเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="Skill commands and native arguments">
    - **คำสั่ง Skills:** Skills แบบ `user-invocable` ถูกเปิดเผยเป็นคำสั่ง slash ชื่อจะถูกทำให้ปลอดภัยเป็น `a-z0-9_` (สูงสุด 32 อักขระ); หากชนกันจะได้รับ suffix ตัวเลข (เช่น `_2`)
      - `/skill <name> [input]` รัน skill ตามชื่อ (มีประโยชน์เมื่อข้อจำกัดของคำสั่งเนทีฟทำให้สร้างคำสั่งต่อ skill ไม่ได้)
      - โดยค่าเริ่มต้น คำสั่ง skill จะถูกส่งต่อไปยังโมเดลเป็นคำขอปกติ
      - Skills อาจประกาศ `command-dispatch: tool` เป็นตัวเลือกเพื่อกำหนดเส้นทางคำสั่งไปยังเครื่องมือโดยตรง (กำหนดผลลัพธ์ได้แน่นอน ไม่มีโมเดล)
      - ตัวอย่าง: `/prose` (Plugin OpenProse) — ดู [OpenProse](/th/prose)
    - **อาร์กิวเมนต์คำสั่งเนทีฟ:** Discord ใช้ autocomplete สำหรับตัวเลือกแบบไดนามิก (และเมนูปุ่มเมื่อคุณละเว้นอาร์กิวเมนต์ที่จำเป็น) Telegram และ Slack แสดงเมนูปุ่มเมื่อคำสั่งรองรับตัวเลือกและคุณละเว้นอาร์กิวเมนต์ ตัวเลือกแบบไดนามิกจะถูก resolve เทียบกับโมเดลของเซสชันเป้าหมาย ดังนั้นตัวเลือกเฉพาะโมเดล เช่น ระดับ `/think` จะตามการเขียนทับ `/model` ของเซสชันนั้น

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` ตอบคำถามรันไทม์ ไม่ใช่คำถามการกำหนดค่า: **ตัวแทนนี้ใช้อะไรได้ในตอนนี้ในการสนทนานี้**

- `/tools` ค่าเริ่มต้นมีขนาดกะทัดรัดและปรับให้เหมาะกับการสแกนอย่างรวดเร็ว
- `/tools verbose` เพิ่มคำอธิบายสั้น ๆ
- พื้นผิวคำสั่งเนทีฟที่รองรับอาร์กิวเมนต์จะเปิดเผยสวิตช์โหมดเดียวกันเป็น `compact|verbose`
- ผลลัพธ์มีขอบเขตตามเซสชัน ดังนั้นการเปลี่ยนตัวแทน ช่องทาง เธรด การอนุญาตผู้ส่ง หรือโมเดลอาจเปลี่ยนผลลัพธ์ได้
- `/tools` รวมเครื่องมือที่เข้าถึงได้จริงในรันไทม์ รวมถึงเครื่องมือ core, เครื่องมือ Plugin ที่เชื่อมต่ออยู่ และเครื่องมือที่ช่องทางเป็นเจ้าของ

สำหรับการแก้ไขโปรไฟล์และการเขียนทับ ให้ใช้แผง Control UI Tools หรือพื้นผิว config/catalog แทนการถือว่า `/tools` เป็นแค็ตตาล็อกแบบคงที่

## พื้นผิวการใช้งาน (สิ่งที่แสดงที่ใด)

- **การใช้งาน/โควตาของผู้ให้บริการ** (ตัวอย่าง: "Claude เหลือ 80%") จะแสดงใน `/status` สำหรับผู้ให้บริการโมเดลปัจจุบันเมื่อเปิดใช้การติดตามการใช้งาน OpenClaw ปรับหน้าต่างของผู้ให้บริการให้เป็น `% left`; สำหรับ MiniMax ฟิลด์เปอร์เซ็นต์ที่มีเฉพาะค่าคงเหลือจะถูกกลับค่าก่อนแสดงผล และการตอบกลับ `model_remains` จะเลือกใช้รายการโมเดลแชตพร้อมป้ายกำกับแผนที่ติดแท็กโมเดล
- **บรรทัดโทเค็น/แคช** ใน `/status` สามารถถอยกลับไปใช้รายการการใช้งานทรานสคริปต์ล่าสุดเมื่อสแนปช็อตเซสชันสดมีข้อมูลน้อย ค่าสดที่ไม่เป็นศูนย์ที่มีอยู่ยังคงมีลำดับความสำคัญ และการถอยกลับไปใช้ทรานสคริปต์ยังสามารถกู้คืนป้ายกำกับโมเดลรันไทม์ที่ใช้งานอยู่ พร้อมยอดรวมเชิงพรอมป์ที่ใหญ่กว่าเมื่อยอดรวมที่จัดเก็บไว้หายไปหรือเล็กกว่า
- **การดำเนินการเทียบกับรันไทม์:** `/status` รายงาน `Execution` สำหรับพาธแซนด์บ็อกซ์ที่มีผล และ `Runtime` สำหรับผู้ที่กำลังรันเซสชันจริง: `OpenClaw Pi Default`, `OpenAI Codex`, แบ็กเอนด์ CLI หรือแบ็กเอนด์ ACP
- **โทเค็น/ค่าใช้จ่ายต่อการตอบกลับ** ควบคุมด้วย `/usage off|tokens|full` (ต่อท้ายการตอบกลับปกติ)
- `/model status` เกี่ยวกับ **โมเดล/การยืนยันตัวตน/เอนด์พอยต์** ไม่ใช่การใช้งาน

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

- `/model` และ `/model list` แสดงตัวเลือกแบบกะทัดรัดที่มีหมายเลขกำกับ (ตระกูลโมเดล + ผู้ให้บริการที่พร้อมใช้งาน)
- บน Discord, `/model` และ `/models` เปิดตัวเลือกแบบโต้ตอบที่มีดรอปดาวน์ผู้ให้บริการและโมเดล พร้อมขั้นตอน Submit
- `/model <#>` เลือกจากตัวเลือกนั้น (และเลือกผู้ให้บริการปัจจุบันก่อนเมื่อเป็นไปได้)
- `/model status` แสดงมุมมองแบบละเอียด รวมถึงเอนด์พอยต์ผู้ให้บริการที่กำหนดค่าไว้ (`baseUrl`) และโหมด API (`api`) เมื่อมีให้ใช้งาน

## การแทนที่เพื่อดีบัก

`/debug` ให้คุณตั้งค่าการแทนที่ config แบบ **เฉพาะรันไทม์** (หน่วยความจำ ไม่ใช่ดิสก์) เฉพาะเจ้าของเท่านั้น ปิดใช้งานตามค่าเริ่มต้น; เปิดใช้ด้วย `commands.debug: true`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
การแทนที่มีผลทันทีกับการอ่าน config ใหม่ แต่จะ **ไม่** เขียนไปยัง `openclaw.json` ใช้ `/debug reset` เพื่อล้างการแทนที่ทั้งหมดและกลับไปใช้ config บนดิสก์
</Note>

## เอาต์พุต trace ของ Plugin

`/trace` ให้คุณสลับ **บรรทัด trace/debug ของ Plugin ที่อยู่ในขอบเขตเซสชัน** โดยไม่ต้องเปิดโหมด verbose เต็มรูปแบบ

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
- บรรทัด trace ของ Plugin สามารถปรากฏใน `/status` และเป็นข้อความวินิจฉัยติดตามผลหลังการตอบกลับปกติของผู้ช่วย
- `/trace` ไม่ได้แทนที่ `/debug`; `/debug` ยังคงจัดการการแทนที่ config แบบเฉพาะรันไทม์
- `/trace` ไม่ได้แทนที่ `/verbose`; เอาต์พุตเครื่องมือ/สถานะแบบ verbose ปกติยังคงเป็นหน้าที่ของ `/verbose`

## การอัปเดต config

`/config` เขียนไปยัง config บนดิสก์ของคุณ (`openclaw.json`) เฉพาะเจ้าของเท่านั้น ปิดใช้งานตามค่าเริ่มต้น; เปิดใช้ด้วย `commands.config: true`

ตัวอย่าง:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
config จะถูกตรวจสอบความถูกต้องก่อนเขียน; การเปลี่ยนแปลงที่ไม่ถูกต้องจะถูกปฏิเสธ การอัปเดต `/config` จะคงอยู่ข้ามการรีสตาร์ต
</Note>

## การอัปเดต MCP

`/mcp` เขียนนิยามเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการไว้ใต้ `mcp.servers` เฉพาะเจ้าของเท่านั้น ปิดใช้งานตามค่าเริ่มต้น; เปิดใช้ด้วย `commands.mcp: true`

ตัวอย่าง:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` เก็บ config ไว้ใน config ของ OpenClaw ไม่ใช่การตั้งค่าโปรเจกต์ที่ Pi เป็นเจ้าของ อะแดปเตอร์รันไทม์จะตัดสินใจว่า transport ใดที่เรียกใช้ได้จริง
</Note>

## การอัปเดต Plugin

`/plugins` ให้ผู้ปฏิบัติงานตรวจสอบ Plugin ที่ค้นพบและสลับการเปิดใช้ใน config โฟลว์แบบอ่านอย่างเดียวสามารถใช้ `/plugin` เป็น alias ได้ ปิดใช้งานตามค่าเริ่มต้น; เปิดใช้ด้วย `commands.plugins: true`

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
- `/plugins install` ติดตั้งจาก ClawHub, npm, git, ไดเรกทอรีภายในเครื่อง และไฟล์เก็บถาวร
- `/plugins enable|disable` อัปเดตเฉพาะ config ของ Plugin; ไม่ได้ติดตั้งหรือถอนการติดตั้ง Plugin
- การเปลี่ยนแปลงการเปิดใช้และปิดใช้จะโหลดพื้นผิวรันไทม์ Plugin ของ Gateway ใหม่แบบ hot-reload สำหรับรอบ agent ใหม่; การติดตั้งจะขอให้รีสตาร์ต Gateway เพราะโมดูลซอร์สของ Plugin เปลี่ยนแปลง

</Note>

## หมายเหตุพื้นผิว

<AccordionGroup>
  <Accordion title="เซสชันต่อพื้นผิว">
    - **คำสั่งข้อความ** รันในเซสชันแชตปกติ (DM ใช้ `main` ร่วมกัน กลุ่มมีเซสชันของตนเอง)
    - **คำสั่งเนทีฟ** ใช้เซสชันแบบแยก:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (กำหนด prefix ได้ผ่าน `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (กำหนดเป้าหมายไปยังเซสชันแชตผ่าน `CommandTargetSessionKey`)
    - **`/stop`** กำหนดเป้าหมายไปยังเซสชันแชตที่ใช้งานอยู่เพื่อให้สามารถยกเลิกการรันปัจจุบันได้

  </Accordion>
  <Accordion title="รายละเอียดเฉพาะของ Slack">
    `channels.slack.slashCommand` ยังคงรองรับสำหรับคำสั่งสไตล์ `/openclaw` เดียว หากคุณเปิดใช้ `commands.native` คุณต้องสร้างคำสั่ง slash ของ Slack หนึ่งคำสั่งต่อคำสั่งในตัวแต่ละรายการ (ชื่อเดียวกับ `/help`) เมนูอาร์กิวเมนต์ของคำสั่งสำหรับ Slack จะถูกส่งเป็นปุ่ม Block Kit แบบ ephemeral

    ข้อยกเว้นเนทีฟของ Slack: ลงทะเบียน `/agentstatus` (ไม่ใช่ `/status`) เพราะ Slack สงวน `/status` ไว้ ข้อความ `/status` ยังคงใช้งานได้ในข้อความ Slack

  </Accordion>
</AccordionGroup>

## คำถามแทรก BTW

`/btw` เป็น **คำถามแทรก** แบบเร็วเกี่ยวกับเซสชันปัจจุบัน `/side` เป็น alias

ต่างจากแชตปกติ:

- ใช้เซสชันปัจจุบันเป็นบริบทพื้นหลัง
- รันเป็นการเรียกแบบ one-shot **ไม่มีเครื่องมือ** แยกต่างหาก
- ไม่เปลี่ยนบริบทเซสชันในอนาคต
- ไม่ถูกเขียนลงประวัติทรานสคริปต์
- ส่งเป็นผลลัพธ์แทรกแบบสดแทนข้อความผู้ช่วยปกติ

สิ่งนี้ทำให้ `/btw` มีประโยชน์เมื่อคุณต้องการคำชี้แจงชั่วคราวขณะที่งานหลักยังดำเนินต่อไป

ตัวอย่าง:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

ดู [คำถามแทรก BTW](/th/tools/btw) สำหรับพฤติกรรมเต็มรูปแบบและรายละเอียด UX ของไคลเอนต์

## ที่เกี่ยวข้อง

- [การสร้าง Skills](/th/tools/creating-skills)
- [Skills](/th/tools/skills)
- [config ของ Skills](/th/tools/skills-config)
