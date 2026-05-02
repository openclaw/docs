---
read_when:
    - การใช้หรือกำหนดค่าคำสั่งแชต
    - การแก้จุดบกพร่องของการกำหนดเส้นทางคำสั่งหรือสิทธิ์
sidebarTitle: Slash commands
summary: 'คำสั่งแบบสแลช: ข้อความเทียบกับแบบเนทีฟ การกำหนดค่า และคำสั่งที่รองรับ'
title: คำสั่งสแลช
x-i18n:
    generated_at: "2026-05-02T10:32:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: b469c4436dec92eb3712f71e5f54bf2c96b9b0b17d60a1533d8669c127caefee
    source_path: tools/slash-commands.md
    workflow: 16
---

คำสั่งจะถูกจัดการโดย Gateway คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความแบบ **เดี่ยว** ที่ขึ้นต้นด้วย `/` คำสั่งแชต bash เฉพาะโฮสต์ใช้ `! <cmd>` (โดยมี `/bash <cmd>` เป็นนามแฝง)

เมื่อการสนทนาหรือเธรดผูกกับเซสชัน ACP ข้อความติดตามผลปกติจะถูกส่งไปยังฮาร์เนส ACP นั้น คำสั่งจัดการ Gateway ยังคงอยู่ในเครื่อง: `/acp ...` จะไปถึงตัวจัดการคำสั่ง ACP ของ OpenClaw เสมอ และ `/status` รวมถึง `/unfocus` จะอยู่ในเครื่องเมื่อเปิดใช้การจัดการคำสั่งสำหรับพื้นผิวนั้น

มีระบบที่เกี่ยวข้องกันสองระบบ:

<AccordionGroup>
  <Accordion title="คำสั่ง">
    ข้อความ `/...` แบบเดี่ยว
  </Accordion>
  <Accordion title="ไดเรกทีฟ">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - ไดเรกทีฟจะถูกตัดออกจากข้อความก่อนที่โมเดลจะเห็น
    - ในข้อความแชตปกติ (ไม่ใช่ข้อความที่มีแต่ไดเรกทีฟ) ไดเรกทีฟจะถูกถือเป็น "คำใบ้แบบอินไลน์" และจะ **ไม่** คงค่าการตั้งค่าเซสชันไว้
    - ในข้อความที่มีแต่ไดเรกทีฟ (ข้อความมีเฉพาะไดเรกทีฟ) ไดเรกทีฟจะคงค่าไว้ในเซสชันและตอบกลับด้วยการยืนยัน
    - ไดเรกทีฟจะถูกใช้กับ **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น หากตั้งค่า `commands.allowFrom` ไว้ ค่านั้นจะเป็นรายการอนุญาตเดียวที่ใช้ มิฉะนั้นการอนุญาตจะมาจากรายการอนุญาต/การจับคู่ของช่องทางร่วมกับ `commands.useAccessGroups` ผู้ส่งที่ไม่ได้รับอนุญาตจะเห็นไดเรกทีฟถูกปฏิบัติเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="ทางลัดอินไลน์">
    เฉพาะผู้ส่งที่อยู่ในรายการอนุญาต/ได้รับอนุญาตเท่านั้น: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

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
  เปิดใช้การแยกวิเคราะห์ `/...` ในข้อความแชต บนพื้นผิวที่ไม่มีคำสั่งเนทีฟ (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) คำสั่งข้อความยังคงทำงานแม้ว่าคุณจะตั้งค่านี้เป็น `false`
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่งเนทีฟ อัตโนมัติ: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (จนกว่าคุณจะเพิ่มคำสั่ง slash); ถูกละเว้นสำหรับผู้ให้บริการที่ไม่รองรับเนทีฟ ตั้งค่า `channels.discord.commands.native`, `channels.telegram.commands.native` หรือ `channels.slack.commands.native` เพื่อเขียนทับต่อผู้ให้บริการ (บูลีนหรือ `"auto"`) `false` จะล้างคำสั่งที่ลงทะเบียนไว้ก่อนหน้านี้บน Discord/Telegram เมื่อเริ่มต้น คำสั่ง Slack จะถูกจัดการในแอป Slack และจะไม่ถูกลบโดยอัตโนมัติ
</ParamField>
บน Discord สเปกคำสั่งเนทีฟอาจมี `descriptionLocalizations` ซึ่ง OpenClaw จะเผยแพร่เป็น Discord `description_localizations` และรวมไว้ในการเปรียบเทียบการกระทบยอด
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่ง **skill** แบบเนทีฟเมื่อรองรับ อัตโนมัติ: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (Slack ต้องสร้างคำสั่ง slash ต่อแต่ละ skill) ตั้งค่า `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` หรือ `channels.slack.commands.nativeSkills` เพื่อเขียนทับต่อผู้ให้บริการ (บูลีนหรือ `"auto"`)
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  เปิดใช้ `! <cmd>` เพื่อรันคำสั่งเชลล์ของโฮสต์ (`/bash <cmd>` เป็นนามแฝง; ต้องใช้รายการอนุญาต `tools.elevated`)
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  ควบคุมระยะเวลาที่ bash รอก่อนสลับเป็นโหมดเบื้องหลัง (`0` จะส่งไปเบื้องหลังทันที)
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`)
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  เปิดใช้ `/mcp` (อ่าน/เขียนการกำหนดค่า MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`)
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  เปิดใช้ `/plugins` (การค้นพบ/สถานะ Plugin รวมถึงตัวควบคุมติดตั้ง + เปิดใช้/ปิดใช้)
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  เปิดใช้ `/debug` (การเขียนทับเฉพาะรันไทม์)
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  เปิดใช้ `/restart` รวมถึงการกระทำของเครื่องมือรีสตาร์ต Gateway
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  ตั้งค่ารายการอนุญาตเจ้าของแบบชัดเจนสำหรับพื้นผิวคำสั่ง/เครื่องมือเฉพาะเจ้าของ นี่คือบัญชีผู้ปฏิบัติงานมนุษย์ที่สามารถอนุมัติการกระทำอันตรายและรันคำสั่ง เช่น `/diagnostics`, `/export-trajectory` และ `/config` ได้ ค่านี้แยกจาก `commands.allowFrom` และจากสิทธิ์การเข้าถึงการจับคู่ DM
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  ต่อช่องทาง: ทำให้คำสั่งเฉพาะเจ้าของต้องใช้ **ตัวตนเจ้าของ** เพื่อรันบนพื้นผิวนั้น เมื่อเป็น `true` ผู้ส่งต้องตรงกับผู้สมัครเจ้าของที่ระบุได้ (เช่น รายการใน `commands.ownerAllowFrom` หรือเมทาดาทาเจ้าของเนทีฟของผู้ให้บริการ) หรือมีขอบเขต `operator.admin` ภายในบนช่องทางข้อความภายใน รายการไวลด์การ์ดใน `allowFrom` ของช่องทาง หรือรายการผู้สมัครเจ้าของที่ว่าง/ระบุไม่ได้ **ไม่** เพียงพอ คำสั่งเฉพาะเจ้าของจะปิดแบบปลอดภัยบนช่องทางนั้น ปล่อยค่านี้ไว้ปิดหากคุณต้องการให้คำสั่งเฉพาะเจ้าของถูกควบคุมเฉพาะโดย `ownerAllowFrom` และรายการอนุญาตคำสั่งมาตรฐาน
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  ควบคุมวิธีแสดงรหัสเจ้าของในพรอมป์ต์ระบบ
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  ตั้งค่าความลับ HMAC ที่ใช้เมื่อ `commands.ownerDisplay="hash"` ได้ตามต้องการ
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  รายการอนุญาตต่อผู้ให้บริการสำหรับการอนุญาตคำสั่ง เมื่อกำหนดค่าไว้ ค่านี้จะเป็นแหล่งการอนุญาตเดียวสำหรับคำสั่งและไดเรกทีฟ (รายการอนุญาต/การจับคู่ของช่องทางและ `commands.useAccessGroups` จะถูกละเว้น) ใช้ `"*"` เป็นค่าเริ่มต้นแบบทั่วโลก; คีย์เฉพาะผู้ให้บริการจะเขียนทับค่านั้น
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  บังคับใช้รายการอนุญาต/นโยบายสำหรับคำสั่งเมื่อไม่ได้ตั้งค่า `commands.allowFrom`
</ParamField>

## รายการคำสั่ง

แหล่งข้อมูลจริงปัจจุบัน:

- คำสั่งในตัวของคอร์มาจาก `src/auto-reply/commands-registry.shared.ts`
- คำสั่ง dock ที่สร้างขึ้นมาจาก `src/auto-reply/commands-registry.data.ts`
- คำสั่ง Plugin มาจากการเรียก `registerCommand()` ของ Plugin
- ความพร้อมใช้งานจริงบน Gateway ของคุณยังคงขึ้นอยู่กับแฟล็กการกำหนดค่า พื้นผิวช่องทาง และ Plugin ที่ติดตั้ง/เปิดใช้

### คำสั่งในตัวของคอร์

<AccordionGroup>
  <Accordion title="เซสชันและการรัน">
    - `/new [model]` เริ่มเซสชันใหม่; `/reset` เป็นนามแฝงการรีเซ็ต
    - Control UI จะดักจับ `/new` ที่พิมพ์เพื่อสร้างและสลับไปยังเซสชันแดชบอร์ดใหม่; `/reset` ที่พิมพ์ยังคงรันการรีเซ็ตแบบอยู่กับที่ของ Gateway
    - `/reset soft [message]` เก็บทรานสคริปต์ปัจจุบันไว้ ทิ้งรหัสเซสชันแบ็กเอนด์ CLI ที่ใช้ซ้ำ และรันการโหลดเริ่มต้น/พรอมป์ต์ระบบใหม่แบบอยู่กับที่
    - `/compact [instructions]` ทำ Compaction บริบทเซสชัน ดู [Compaction](/th/concepts/compaction)
    - `/stop` ยกเลิกการรันปัจจุบัน
    - `/session idle <duration|off>` และ `/session max-age <duration|off>` จัดการวันหมดอายุของการผูกเธรด
    - `/export-session [path]` ส่งออกเซสชันปัจจุบันเป็น HTML นามแฝง: `/export`
    - `/export-trajectory [path]` ขอการอนุมัติ exec แล้วส่งออก [trajectory bundle](/th/tools/trajectory) แบบ JSONL สำหรับเซสชันปัจจุบัน ใช้เมื่อคุณต้องการไทม์ไลน์ของพรอมป์ต์ เครื่องมือ และทรานสคริปต์สำหรับหนึ่งเซสชัน OpenClaw ในแชตกลุ่ม พรอมป์ต์การอนุมัติและผลการส่งออกจะถูกส่งไปยังเจ้าของแบบส่วนตัว นามแฝง: `/trajectory`

  </Accordion>
  <Accordion title="การควบคุมโมเดลและการรัน">
    - `/think <level>` ตั้งค่าระดับการคิด ตัวเลือกมาจากโปรไฟล์ผู้ให้บริการของโมเดลที่ใช้งานอยู่; ระดับทั่วไปคือ `off`, `minimal`, `low`, `medium` และ `high` พร้อมระดับกำหนดเอง เช่น `xhigh`, `adaptive`, `max` หรือไบนารี `on` เฉพาะที่รองรับเท่านั้น นามแฝง: `/thinking`, `/t`
    - `/verbose on|off|full` สลับเอาต์พุตแบบละเอียด นามแฝง: `/v`
    - `/trace on|off` สลับเอาต์พุต trace ของ Plugin สำหรับเซสชันปัจจุบัน
    - `/fast [status|on|off]` แสดงหรือตั้งค่าโหมดเร็ว
    - `/reasoning [on|off|stream]` สลับการมองเห็น reasoning นามแฝง: `/reason`
    - `/elevated [on|off|ask|full]` สลับโหมดยกระดับ นามแฝง: `/elev`
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` แสดงหรือตั้งค่าเริ่มต้น exec
    - `/model [name|#|status]` แสดงหรือตั้งค่าโมเดล
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` แสดงรายการผู้ให้บริการที่กำหนดค่า/มีการยืนยันตัวตนพร้อมใช้ หรือโมเดลสำหรับผู้ให้บริการ; เพิ่ม `all` เพื่อเรียกดูแคตตาล็อกทั้งหมดของผู้ให้บริการนั้น
    - `/queue <mode>` จัดการพฤติกรรมคิว (`steer`, `queue` เดิม, `followup`, `collect`, `steer-backlog`, `interrupt`) รวมถึงตัวเลือก เช่น `debounce:0.5s cap:25 drop:summarize`; `/queue default` หรือ `/queue reset` จะล้างการเขียนทับของเซสชัน ดู [คิวคำสั่ง](/th/concepts/queue) และ [คิวการนำทาง](/th/concepts/queue-steering)

  </Accordion>
  <Accordion title="การค้นพบและสถานะ">
    - `/help` แสดงสรุปความช่วยเหลือแบบสั้น
    - `/commands` แสดงแคตตาล็อกคำสั่งที่สร้างขึ้น
    - `/tools [compact|verbose]` แสดงสิ่งที่เอเจนต์ปัจจุบันใช้ได้ในตอนนี้
    - `/status` แสดงสถานะการทำงาน/รันไทม์ รวมถึงป้ายกำกับ `Execution`/`Runtime` และการใช้งาน/โควตาผู้ให้บริการเมื่อมี
    - `/diagnostics [note]` เป็นโฟลว์รายงานสนับสนุนเฉพาะเจ้าของสำหรับบั๊ก Gateway และการรันฮาร์เนส Codex โฟลว์นี้จะขอการอนุมัติ exec แบบชัดเจนทุกครั้งก่อนรัน `openclaw gateway diagnostics export --json`; อย่าอนุมัติ diagnostics ด้วยกฎอนุญาตทั้งหมด หลังอนุมัติ จะส่งรายงานที่วางต่อได้พร้อมพาธบันเดิลในเครื่อง สรุป manifest หมายเหตุความเป็นส่วนตัว และรหัสเซสชันที่เกี่ยวข้อง ในแชตกลุ่ม พรอมป์ต์การอนุมัติและรายงานจะถูกส่งไปยังเจ้าของแบบส่วนตัว เมื่อเซสชันที่ใช้งานอยู่ใช้ฮาร์เนส OpenAI Codex การอนุมัติเดียวกันจะส่งข้อเสนอแนะ Codex ที่เกี่ยวข้องไปยังเซิร์ฟเวอร์ OpenAI ด้วย และคำตอบที่เสร็จสมบูรณ์จะแสดงรหัสเซสชัน OpenClaw, รหัสเธรด Codex และคำสั่ง `codex resume <thread-id>` ดู [การส่งออก Diagnostics](/th/gateway/diagnostics)
    - `/crestodian <request>` รันตัวช่วยตั้งค่าและซ่อมแซม Crestodian จาก DM ของเจ้าของ
    - `/tasks` แสดงรายการงานเบื้องหลังที่ใช้งานอยู่/ล่าสุดสำหรับเซสชันปัจจุบัน
    - `/context [list|detail|json]` อธิบายวิธีประกอบบริบท
    - `/whoami` แสดงรหัสผู้ส่งของคุณ นามแฝง: `/id`
    - `/usage off|tokens|full|cost` ควบคุมส่วนท้ายการใช้งานต่อการตอบกลับ หรือพิมพ์สรุปต้นทุนในเครื่อง

  </Accordion>
  <Accordion title="Skills, รายการอนุญาต, การอนุมัติ">
    - `/skill <name> [input]` รัน skill ตามชื่อ
    - `/allowlist [list|add|remove] ...` จัดการรายการอนุญาต เฉพาะข้อความ
    - `/approve <id> <decision>` แก้ไขพรอมป์ต์การอนุมัติ exec
    - `/btw <question>` ถามคำถามข้างเคียงโดยไม่เปลี่ยนบริบทเซสชันในอนาคต ดู [BTW](/th/tools/btw)

  </Accordion>
  <Accordion title="เอเจนต์ย่อยและ ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` จัดการการรันเอเจนต์ย่อยสำหรับเซสชันปัจจุบัน
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` จัดการเซสชัน ACP และตัวเลือกรันไทม์
    - `/focus <target>` ผูกเธรด Discord หรือหัวข้อ/บทสนทนา Telegram ปัจจุบันกับเป้าหมายเซสชัน
    - `/unfocus` ลบการผูกปัจจุบัน
    - `/agents` แสดงรายการเอเจนต์ที่ผูกกับเธรดสำหรับเซสชันปัจจุบัน
    - `/kill <id|#|all>` ยกเลิกเอเจนต์ย่อยที่กำลังทำงานอยู่หนึ่งรายการหรือทั้งหมด
    - `/steer <id|#> <message>` ส่งการชี้นำไปยังเอเจนต์ย่อยที่กำลังทำงานอยู่ นามแฝง: `/tell`

  </Accordion>
  <Accordion title="การเขียนสำหรับเจ้าของเท่านั้นและผู้ดูแลระบบ">
    - `/config show|get|set|unset` อ่านหรือเขียน `openclaw.json` สำหรับเจ้าของเท่านั้น ต้องมี `commands.config: true`
    - `/mcp show|get|set|unset` อ่านหรือเขียนการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers` สำหรับเจ้าของเท่านั้น ต้องมี `commands.mcp: true`
    - `/plugins list|inspect|show|get|install|enable|disable` ตรวจสอบหรือเปลี่ยนสถานะ Plugin `/plugin` เป็นนามแฝง สำหรับการเขียนต้องเป็นเจ้าของเท่านั้น ต้องมี `commands.plugins: true`
    - `/debug show|set|unset|reset` จัดการการเขียนทับการกำหนดค่าสำหรับรันไทม์เท่านั้น สำหรับเจ้าของเท่านั้น ต้องมี `commands.debug: true`
    - `/restart` รีสตาร์ต OpenClaw เมื่อเปิดใช้งาน ค่าเริ่มต้น: เปิดใช้งาน; ตั้งค่า `commands.restart: false` เพื่อปิดใช้งาน
    - `/send on|off|inherit` ตั้งค่านโยบายการส่ง สำหรับเจ้าของเท่านั้น

  </Accordion>
  <Accordion title="เสียง, TTS, การควบคุมช่อง">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` ควบคุม TTS ดู [TTS](/th/tools/tts)
    - `/activation mention|always` ตั้งค่าโหมดการเปิดใช้งานกลุ่ม
    - `/bash <command>` รันคำสั่งเชลล์ของโฮสต์ แบบข้อความเท่านั้น นามแฝง: `! <command>` ต้องมี `commands.bash: true` รวมถึงรายการอนุญาต `tools.elevated`
    - `!poll [sessionId]` ตรวจสอบงาน bash เบื้องหลัง
    - `!stop [sessionId]` หยุดงาน bash เบื้องหลัง

  </Accordion>
</AccordionGroup>

### คำสั่ง dock ที่สร้างขึ้น

คำสั่ง dock จะสลับเส้นทางการตอบกลับของเซสชันปัจจุบันไปยังช่องที่เชื่อมโยงอีกช่องหนึ่ง ดู [การ dock ช่อง](/th/concepts/channel-docking) สำหรับการตั้งค่า ตัวอย่าง และการแก้ไขปัญหา

คำสั่ง dock สร้างจาก Plugin ช่องที่รองรับคำสั่งแบบเนทีฟ ชุดที่รวมมาในปัจจุบัน:

- `/dock-discord` (นามแฝง: `/dock_discord`)
- `/dock-mattermost` (นามแฝง: `/dock_mattermost`)
- `/dock-slack` (นามแฝง: `/dock_slack`)
- `/dock-telegram` (นามแฝง: `/dock_telegram`)

ใช้คำสั่ง dock จากแชตโดยตรงเพื่อสลับเส้นทางการตอบกลับของเซสชันปัจจุบันไปยังช่องที่เชื่อมโยงอีกช่องหนึ่ง เอเจนต์จะคงบริบทเซสชันเดิมไว้ แต่การตอบกลับในอนาคตสำหรับเซสชันนั้นจะถูกส่งไปยังเพียร์ของช่องที่เลือก

คำสั่ง dock ต้องมี `session.identityLinks` ผู้ส่งต้นทางและเพียร์เป้าหมายต้องอยู่ในกลุ่มตัวตนเดียวกัน เช่น `["telegram:123", "discord:456"]` หากผู้ใช้ Telegram ที่มี id `123` ส่ง `/dock_discord` OpenClaw จะจัดเก็บ `lastChannel: "discord"` และ `lastTo: "456"` บนเซสชันที่ใช้งานอยู่ หากผู้ส่งไม่ได้เชื่อมโยงกับเพียร์ Discord คำสั่งจะตอบกลับด้วยคำแนะนำการตั้งค่าแทนที่จะปล่อยผ่านไปยังแชตปกติ

การ dock เปลี่ยนเฉพาะเส้นทางเซสชันที่ใช้งานอยู่เท่านั้น ไม่ได้สร้างบัญชีช่อง ให้สิทธิ์เข้าถึง ข้ามรายการอนุญาตของช่อง หรือย้ายประวัติทรานสคริปต์ไปยังเซสชันอื่น ใช้ `/dock-telegram`, `/dock-slack`, `/dock-mattermost` หรือคำสั่ง dock ที่สร้างขึ้นอื่นเพื่อสลับเส้นทางอีกครั้ง

### คำสั่ง Plugin ที่รวมมา

Plugin ที่รวมมาสามารถเพิ่มคำสั่ง slash ได้อีก คำสั่งที่รวมมาใน repo นี้ในปัจจุบัน:

- `/dreaming [on|off|status|help]` เปิดหรือปิด Dreaming ของหน่วยความจำ ดู [Dreaming](/th/concepts/dreaming)
- `/pair [qr|status|pending|approve|cleanup|notify]` จัดการโฟลว์การจับคู่/ตั้งค่าอุปกรณ์ ดู [การจับคู่](/th/channels/pairing)
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` เปิดใช้งานคำสั่งโหนดโทรศัพท์ที่มีความเสี่ยงสูงชั่วคราว
- `/voice status|list [limit]|set <voiceId|name>` จัดการการกำหนดค่าเสียง Talk บน Discord ชื่อคำสั่งแบบเนทีฟคือ `/talkvoice`
- `/card ...` ส่งพรีเซ็ตการ์ด LINE แบบ rich card ดู [LINE](/th/channels/line)
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` ตรวจสอบและควบคุมฮาร์เนส app-server ของ Codex ที่รวมมา ดู [ฮาร์เนส Codex](/th/plugins/codex-harness)
- คำสั่งสำหรับ QQBot เท่านั้น:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### คำสั่ง Skills แบบไดนามิก

Skills ที่ผู้ใช้เรียกใช้ได้จะถูกเปิดเผยเป็นคำสั่ง slash ด้วย:

- `/skill <name> [input]` ใช้ได้เสมอในฐานะจุดเข้าใช้งานทั่วไป
- Skills อาจปรากฏเป็นคำสั่งโดยตรง เช่น `/prose` เมื่อ Skill/Plugin ลงทะเบียนไว้
- การลงทะเบียนคำสั่ง Skill แบบเนทีฟควบคุมโดย `commands.nativeSkills` และ `channels.<provider>.commands.nativeSkills`
- สเปกคำสั่งสามารถระบุ `descriptionLocalizations` สำหรับพื้นผิวแบบเนทีฟที่รองรับคำอธิบายแบบแปลภาษาได้ รวมถึง Discord

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับอาร์กิวเมนต์และตัวแยกวิเคราะห์">
    - คำสั่งยอมรับ `:` แบบไม่บังคับระหว่างคำสั่งกับอาร์กิวเมนต์ (เช่น `/think: high`, `/send: on`, `/help:`)
    - `/new <model>` ยอมรับนามแฝงโมเดล, `provider/model` หรือชื่อผู้ให้บริการ (จับคู่แบบ fuzzy); หากไม่พบการจับคู่ ข้อความจะถูกถือเป็นเนื้อหาข้อความ
    - สำหรับรายละเอียดการใช้งานผู้ให้บริการแบบครบถ้วน ให้ใช้ `openclaw status --usage`
    - `/allowlist add|remove` ต้องมี `commands.config=true` และเคารพ `configWrites` ของช่อง
    - ในช่องแบบหลายบัญชี `/allowlist --account <id>` ที่เจาะจงเป้าหมายการกำหนดค่าและ `/config set channels.<provider>.accounts.<id>...` จะเคารพ `configWrites` ของบัญชีเป้าหมายด้วย
    - `/usage` ควบคุมส่วนท้ายการใช้งานต่อการตอบกลับ; `/usage cost` พิมพ์สรุปค่าใช้จ่ายภายในเครื่องจากบันทึกเซสชัน OpenClaw
    - `/restart` เปิดใช้งานตามค่าเริ่มต้น; ตั้งค่า `commands.restart: false` เพื่อปิดใช้งาน
    - `/plugins install <spec>` ยอมรับสเปก Plugin เดียวกับ `openclaw plugins install`: พาธ/ไฟล์เก็บถาวรภายในเครื่อง, แพ็กเกจ npm, `git:<repo>` หรือ `clawhub:<pkg>`
    - `/plugins enable|disable` อัปเดตการกำหนดค่า Plugin และอาจแจ้งให้รีสตาร์ต

  </Accordion>
  <Accordion title="พฤติกรรมเฉพาะช่อง">
    - คำสั่งแบบเนทีฟเฉพาะ Discord: `/vc join|leave|status` ควบคุมช่องเสียง (ไม่พร้อมใช้งานเป็นข้อความ) `join` ต้องมี guild และช่องเสียง/stage ที่เลือก ต้องมี `channels.discord.voice` และคำสั่งแบบเนทีฟ
    - คำสั่งผูกเธรด Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) ต้องเปิดใช้งานการผูกเธรดที่มีผล (`session.threadBindings.enabled` และ/หรือ `channels.discord.threadBindings.enabled`)
    - เอกสารอ้างอิงคำสั่ง ACP และพฤติกรรมรันไทม์: [เอเจนต์ ACP](/th/tools/acp-agents)

  </Accordion>
  <Accordion title="Verbose / trace / fast / ความปลอดภัยของ reasoning">
    - `/verbose` มีไว้สำหรับการดีบักและการมองเห็นเพิ่มเติม; ให้ปิดไว้ในงานใช้งานปกติ
    - `/trace` แคบกว่า `/verbose`: จะแสดงเฉพาะบรรทัด trace/debug ที่ Plugin เป็นเจ้าของ และปิดเสียงรายละเอียดเครื่องมือแบบ verbose ปกติไว้
    - `/fast on|off` คงค่าการเขียนทับเซสชันไว้ ใช้ตัวเลือก `inherit` ใน UI Sessions เพื่อล้างค่าและย้อนกลับไปใช้ค่าเริ่มต้นจากการกำหนดค่า
    - `/fast` ขึ้นอยู่กับผู้ให้บริการ: OpenAI/OpenAI Codex แมปเป็น `service_tier=priority` บน endpoints Responses แบบเนทีฟ ส่วนคำขอ Anthropic สาธารณะโดยตรง รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย OAuth ซึ่งส่งไปยัง `api.anthropic.com` แมปเป็น `service_tier=auto` หรือ `standard_only` ดู [OpenAI](/th/providers/openai) และ [Anthropic](/th/providers/anthropic)
    - สรุปความล้มเหลวของเครื่องมือยังคงแสดงเมื่อเกี่ยวข้อง แต่ข้อความความล้มเหลวแบบละเอียดจะรวมไว้เฉพาะเมื่อ `/verbose` เป็น `on` หรือ `full`
    - `/reasoning`, `/verbose` และ `/trace` มีความเสี่ยงในการตั้งค่าแบบกลุ่ม: อาจเปิดเผย reasoning ภายใน เอาต์พุตเครื่องมือ หรือการวินิจฉัย Plugin ที่คุณไม่ได้ตั้งใจจะเปิดเผย ควรปิดไว้ โดยเฉพาะในแชตกลุ่ม

  </Accordion>
  <Accordion title="การสลับโมเดล">
    - `/model` คงค่าโมเดลเซสชันใหม่ทันที
    - หากเอเจนต์ว่าง การรันครั้งถัดไปจะใช้ทันที
    - หากมีการรันที่ใช้งานอยู่แล้ว OpenClaw จะทำเครื่องหมายการสลับสดเป็นรอดำเนินการ และจะรีสตาร์ตเข้าสู่โมเดลใหม่เฉพาะที่จุดลองใหม่ที่สะอาดเท่านั้น
    - หากกิจกรรมเครื่องมือหรือเอาต์พุตการตอบกลับเริ่มไปแล้ว การสลับที่รอดำเนินการอาจยังค้างคิวไว้จนกว่าจะมีโอกาสลองใหม่ภายหลังหรือจนถึงเทิร์นผู้ใช้ถัดไป
    - ใน TUI ภายในเครื่อง `/crestodian [request]` จะกลับจาก TUI เอเจนต์ปกติไปยัง Crestodian ซึ่งแยกจากโหมดกู้คืนผ่านช่องข้อความและไม่ได้ให้สิทธิ์กำหนดค่าระยะไกล

  </Accordion>
  <Accordion title="เส้นทางเร็วและทางลัดแบบ inline">
    - **เส้นทางเร็ว:** ข้อความที่มีเฉพาะคำสั่งจากผู้ส่งในรายการอนุญาตจะถูกจัดการทันที (ข้ามคิว + โมเดล)
    - **การกั้นด้วย mention ในกลุ่ม:** ข้อความที่มีเฉพาะคำสั่งจากผู้ส่งในรายการอนุญาตจะข้ามข้อกำหนด mention
    - **ทางลัดแบบ inline (เฉพาะผู้ส่งในรายการอนุญาต):** คำสั่งบางรายการยังทำงานได้เมื่อฝังอยู่ในข้อความปกติ และจะถูกตัดออกก่อนที่โมเดลจะเห็นข้อความที่เหลือ
      - ตัวอย่าง: `hey /status` ทริกเกอร์การตอบกลับสถานะ และข้อความที่เหลือจะดำเนินต่อผ่านโฟลว์ปกติ
    - ปัจจุบัน: `/help`, `/commands`, `/status`, `/whoami` (`/id`)
    - ข้อความที่มีเฉพาะคำสั่งจากผู้ที่ไม่ได้รับอนุญาตจะถูกเพิกเฉยโดยไม่แสดงข้อความ และโทเคน `/...` แบบ inline จะถูกถือเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="คำสั่ง Skill และอาร์กิวเมนต์แบบเนทีฟ">
    - **คำสั่ง Skill:** Skills แบบ `user-invocable` จะถูกเปิดเผยเป็นคำสั่ง slash ชื่อจะถูกปรับให้เป็น `a-z0-9_` (สูงสุด 32 อักขระ); กรณีชนกันจะได้คำต่อท้ายเป็นตัวเลข (เช่น `_2`)
      - `/skill <name> [input]` รัน Skill ตามชื่อ (มีประโยชน์เมื่อข้อจำกัดคำสั่งแบบเนทีฟทำให้สร้างคำสั่งต่อ Skill ไม่ได้)
      - ตามค่าเริ่มต้น คำสั่ง Skill จะถูกส่งต่อไปยังโมเดลเป็นคำขอปกติ
      - Skills อาจประกาศ `command-dispatch: tool` เพื่อกำหนดเส้นทางคำสั่งไปยังเครื่องมือโดยตรงได้ (กำหนดผลลัพธ์แน่นอน ไม่มีโมเดล)
      - ตัวอย่าง: `/prose` (OpenProse Plugin) — ดู [OpenProse](/th/prose)
    - **อาร์กิวเมนต์คำสั่งแบบเนทีฟ:** Discord ใช้ autocomplete สำหรับตัวเลือกไดนามิก (และเมนูปุ่มเมื่อคุณละอาร์กิวเมนต์ที่จำเป็น) Telegram และ Slack แสดงเมนูปุ่มเมื่อคำสั่งรองรับตัวเลือกและคุณละอาร์กิวเมนต์ ตัวเลือกไดนามิกจะถูกแก้ไขกับโมเดลของเซสชันเป้าหมาย ดังนั้นตัวเลือกเฉพาะโมเดล เช่น ระดับ `/think` จะตามการเขียนทับ `/model` ของเซสชันนั้น

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` ตอบคำถามเกี่ยวกับรันไทม์ ไม่ใช่คำถามเกี่ยวกับการกำหนดค่า: **เอเจนต์นี้ใช้อะไรได้ตอนนี้ในบทสนทนานี้**

- `/tools` ค่าเริ่มต้นมีขนาดกะทัดรัดและปรับให้เหมาะสำหรับการสแกนอย่างรวดเร็ว
- `/tools verbose` เพิ่มคำอธิบายสั้น ๆ
- พื้นผิวคำสั่งแบบเนทีฟที่รองรับอาร์กิวเมนต์จะเปิดเผยสวิตช์โหมดเดียวกันเป็น `compact|verbose`
- ผลลัพธ์มีขอบเขตตามเซสชัน ดังนั้นการเปลี่ยนเอเจนต์ ช่อง เธรด การอนุญาตผู้ส่ง หรือโมเดล อาจเปลี่ยนเอาต์พุตได้
- `/tools` รวมเครื่องมือที่เข้าถึงได้จริงขณะรันไทม์ รวมถึงเครื่องมือหลัก เครื่องมือ Plugin ที่เชื่อมต่ออยู่ และเครื่องมือที่ช่องเป็นเจ้าของ

สำหรับการแก้ไขโปรไฟล์และการเขียนทับ ให้ใช้แผง Control UI Tools หรือพื้นผิว config/catalog แทนการถือว่า `/tools` เป็นแค็ตตาล็อกแบบคงที่

## พื้นผิวการใช้งาน (สิ่งที่แสดงที่ใด)

- **การใช้งาน/โควตาของผู้ให้บริการ** (ตัวอย่าง: "Claude เหลือ 80%") จะแสดงใน `/status` สำหรับผู้ให้บริการโมเดลปัจจุบันเมื่อเปิดใช้การติดตามการใช้งาน OpenClaw ปรับหน้าต่างของผู้ให้บริการให้เป็น `% left`; สำหรับ MiniMax ฟิลด์เปอร์เซ็นต์แบบเหลืออยู่เท่านั้นจะถูกกลับค่าก่อนแสดงผล และการตอบกลับ `model_remains` จะให้ความสำคัญกับรายการโมเดลแชตพร้อมป้ายกำกับแผนที่ติดแท็กโมเดล
- **บรรทัดโทเค็น/แคช** ใน `/status` สามารถ fallback ไปยังรายการการใช้งาน transcript ล่าสุดเมื่อ snapshot เซสชันสดมีข้อมูลน้อย ค่าสดที่มีอยู่และไม่เป็นศูนย์ยังคงมีสิทธิ์เหนือกว่า และ transcript fallback ยังสามารถกู้คืนป้ายกำกับโมเดลรันไทม์ที่ใช้งานอยู่พร้อมผลรวมที่เน้นพรอมป์ซึ่งมากกว่า เมื่อผลรวมที่เก็บไว้หายไปหรือน้อยกว่า
- **การดำเนินการเทียบกับรันไทม์:** `/status` รายงาน `Execution` สำหรับพาธ sandbox ที่มีผลจริง และ `Runtime` สำหรับผู้ที่กำลังรันเซสชันจริง: `OpenClaw Pi Default`, `OpenAI Codex`, แบ็กเอนด์ CLI หรือแบ็กเอนด์ ACP
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

- `/model` และ `/model list` แสดงตัวเลือกแบบกะทัดรัดพร้อมหมายเลข (ตระกูลโมเดล + ผู้ให้บริการที่พร้อมใช้งาน)
- บน Discord, `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบที่มีดรอปดาวน์ผู้ให้บริการและโมเดล พร้อมขั้นตอน Submit
- `/model <#>` เลือกจากตัวเลือกนั้น (และเลือกผู้ให้บริการปัจจุบันก่อนเมื่อทำได้)
- `/model status` แสดงมุมมองรายละเอียด รวมถึง endpoint ของผู้ให้บริการที่กำหนดค่าไว้ (`baseUrl`) และโหมด API (`api`) เมื่อมี

## การ override สำหรับดีบัก

`/debug` ให้คุณตั้งค่า override ของ config แบบ **เฉพาะรันไทม์** (อยู่ในหน่วยความจำ ไม่ใช่บนดิสก์) เฉพาะเจ้าของเท่านั้น ปิดไว้ตามค่าเริ่มต้น; เปิดใช้ด้วย `commands.debug: true`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Override จะมีผลทันทีเมื่ออ่าน config ใหม่ แต่จะ **ไม่** เขียนลง `openclaw.json` ใช้ `/debug reset` เพื่อล้าง override ทั้งหมดและกลับไปใช้ config บนดิสก์
</Note>

## เอาต์พุต trace ของ Plugin

`/trace` ให้คุณสลับ **บรรทัด trace/debug ของ Plugin ที่จำกัดตามเซสชัน** โดยไม่ต้องเปิดโหมด verbose เต็มรูปแบบ

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
- บรรทัด trace ของ Plugin สามารถปรากฏใน `/status` และเป็นข้อความวินิจฉัยติดตามผลหลังการตอบกลับปกติของ assistant
- `/trace` ไม่ได้แทนที่ `/debug`; `/debug` ยังคงจัดการ override ของ config แบบเฉพาะรันไทม์
- `/trace` ไม่ได้แทนที่ `/verbose`; เอาต์พุตเครื่องมือ/สถานะแบบ verbose ปกติยังคงเป็นหน้าที่ของ `/verbose`

## การอัปเดต config

`/config` เขียนไปยัง config บนดิสก์ของคุณ (`openclaw.json`) เฉพาะเจ้าของเท่านั้น ปิดไว้ตามค่าเริ่มต้น; เปิดใช้ด้วย `commands.config: true`

ตัวอย่าง:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Config จะถูกตรวจสอบความถูกต้องก่อนเขียน; การเปลี่ยนแปลงที่ไม่ถูกต้องจะถูกปฏิเสธ การอัปเดต `/config` จะคงอยู่ข้ามการรีสตาร์ต
</Note>

## การอัปเดต MCP

`/mcp` เขียนคำนิยามเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers` เฉพาะเจ้าของเท่านั้น ปิดไว้ตามค่าเริ่มต้น; เปิดใช้ด้วย `commands.mcp: true`

ตัวอย่าง:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` เก็บ config ไว้ใน config ของ OpenClaw ไม่ใช่การตั้งค่าโปรเจกต์ที่ Pi เป็นเจ้าของ อะแดปเตอร์รันไทม์จะตัดสินว่าการขนส่งใดเรียกใช้งานได้จริง
</Note>

## การอัปเดต Plugin

`/plugins` ให้ผู้ปฏิบัติงานตรวจสอบ Plugin ที่ค้นพบและสลับการเปิดใช้ใน config โฟลว์แบบอ่านอย่างเดียวสามารถใช้ `/plugin` เป็น alias ได้ ปิดไว้ตามค่าเริ่มต้น; เปิดใช้ด้วย `commands.plugins: true`

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
- `/plugins enable|disable` อัปเดตเฉพาะ config ของ Plugin; ไม่ได้ติดตั้งหรือถอนการติดตั้ง Plugin
- หลังจากเปลี่ยนแปลงการเปิด/ปิดใช้งาน ให้รีสตาร์ต Gateway เพื่อให้มีผล

</Note>

## หมายเหตุเกี่ยวกับ surface

<AccordionGroup>
  <Accordion title="Sessions per surface">
    - **คำสั่งข้อความ** รันในเซสชันแชตปกติ (DM ใช้ `main` ร่วมกัน กลุ่มมีเซสชันของตนเอง)
    - **คำสั่ง native** ใช้เซสชันแยก:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (กำหนด prefix ได้ผ่าน `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (ชี้ไปยังเซสชันแชตผ่าน `CommandTargetSessionKey`)
    - **`/stop`** ชี้ไปยังเซสชันแชตที่ใช้งานอยู่ เพื่อให้สามารถยกเลิกการรันปัจจุบันได้

  </Accordion>
  <Accordion title="Slack specifics">
    `channels.slack.slashCommand` ยังรองรับคำสั่งสไตล์ `/openclaw` เดียวอยู่ หากคุณเปิดใช้ `commands.native` คุณต้องสร้างคำสั่ง slash ของ Slack หนึ่งคำสั่งต่อคำสั่งในตัวแต่ละรายการ (ชื่อเดียวกับ `/help`) เมนูอาร์กิวเมนต์คำสั่งสำหรับ Slack จะถูกส่งเป็นปุ่ม Block Kit แบบ ephemeral

    ข้อยกเว้น native ของ Slack: ลงทะเบียน `/agentstatus` (ไม่ใช่ `/status`) เพราะ Slack สงวน `/status` ไว้ ข้อความ `/status` ยังคงใช้งานได้ในข้อความ Slack

  </Accordion>
</AccordionGroup>

## คำถามข้างเคียง BTW

`/btw` คือ **คำถามข้างเคียง** อย่างรวดเร็วเกี่ยวกับเซสชันปัจจุบัน

ต่างจากแชตปกติ:

- ใช้เซสชันปัจจุบันเป็นบริบทเบื้องหลัง
- รันเป็นการเรียกแบบครั้งเดียวที่ **ไม่มีเครื่องมือ** แยกต่างหาก
- ไม่เปลี่ยนบริบทเซสชันในอนาคต
- ไม่ถูกเขียนลงประวัติ transcript
- ส่งเป็นผลลัพธ์ข้างเคียงแบบสดแทนข้อความ assistant ปกติ

สิ่งนี้ทำให้ `/btw` มีประโยชน์เมื่อคุณต้องการคำชี้แจงชั่วคราวในขณะที่งานหลักยังดำเนินต่อไป

ตัวอย่าง:

```text
/btw what are we doing right now?
```

ดู [คำถามข้างเคียง BTW](/th/tools/btw) สำหรับพฤติกรรมเต็มรูปแบบและรายละเอียด UX ของไคลเอนต์

## ที่เกี่ยวข้อง

- [การสร้าง Skills](/th/tools/creating-skills)
- [Skills](/th/tools/skills)
- [Config ของ Skills](/th/tools/skills-config)
