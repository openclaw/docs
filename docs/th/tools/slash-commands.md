---
read_when:
    - การใช้หรือกำหนดค่าคำสั่งแชต
    - การดีบักการกำหนดเส้นทางคำสั่งหรือสิทธิ์
sidebarTitle: Slash commands
summary: 'คำสั่งสแลช: แบบข้อความเทียบกับแบบเนทีฟ การกำหนดค่า และคำสั่งที่รองรับ'
title: คำสั่งสแลช
x-i18n:
    generated_at: "2026-04-26T11:44:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75bf58d02738e30bfdc00ad1c264b2f066eebd2819f4ea0209f504f279755993
    source_path: tools/slash-commands.md
    workflow: 15
---

คำสั่งจะถูกจัดการโดย Gateway คำสั่งส่วนใหญ่ต้องถูกส่งเป็นข้อความ **เดี่ยว** ที่ขึ้นต้นด้วย `/` คำสั่งแชต bash ที่ใช้ได้เฉพาะบน host ใช้ `! <cmd>` (โดยมี `/bash <cmd>` เป็นชื่อแทน)

เมื่อการสนทนาหรือเธรดถูกผูกกับเซสชัน ACP ข้อความติดตามผลปกติจะถูกส่งต่อไปยัง ACP harness นั้น อย่างไรก็ตาม คำสั่งจัดการ Gateway จะยังคงอยู่ในเครื่อง: `/acp ...` จะไปถึงตัวจัดการคำสั่ง ACP ของ OpenClaw เสมอ และ `/status` กับ `/unfocus` จะยังคงอยู่ในเครื่องทุกครั้งที่พื้นผิวนั้นเปิดใช้งานการจัดการคำสั่ง

มีสองระบบที่เกี่ยวข้องกัน:

<AccordionGroup>
  <Accordion title="คำสั่ง">
    ข้อความ `/...` แบบเดี่ยว
  </Accordion>
  <Accordion title="Directive">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`

    - Directive จะถูกตัดออกจากข้อความก่อนที่โมเดลจะเห็น
    - ในข้อความแชตปกติ (ไม่ใช่ข้อความที่มีแต่ directive) สิ่งเหล่านี้จะถูกถือเป็น "คำใบ้ในบรรทัด" และ **จะไม่** คงการตั้งค่าของเซสชันไว้
    - ในข้อความที่มีแต่ directive เท่านั้น (ข้อความมีแต่ directive) สิ่งเหล่านี้จะถูกคงไว้ในเซสชันและตอบกลับด้วยการยืนยัน
    - Directive จะถูกใช้เฉพาะกับ **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น หากตั้ง `commands.allowFrom` ไว้ จะใช้สิ่งนั้นเป็น allowlist เดียว มิฉะนั้นการอนุญาตจะมาจาก allowlist/การจับคู่ของแชนเนลร่วมกับ `commands.useAccessGroups` ผู้ส่งที่ไม่ได้รับอนุญาตจะเห็น directive ถูกปฏิบัติเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="ทางลัดในบรรทัด">
    เฉพาะผู้ส่งที่อยู่ใน allowlist/ได้รับอนุญาต: `/help`, `/commands`, `/status`, `/whoami` (`/id`)

    คำสั่งเหล่านี้จะทำงานทันที ถูกตัดออกก่อนที่โมเดลจะเห็นข้อความ และข้อความที่เหลือจะดำเนินต่อผ่านโฟลว์ปกติ

  </Accordion>
</AccordionGroup>

## Config

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
  เปิดใช้การแยกวิเคราะห์ `/...` ในข้อความแชต บนพื้นผิวที่ไม่มีคำสั่งแบบเนทีฟ (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) คำสั่งแบบข้อความจะยังคงทำงานแม้ว่าคุณจะตั้งค่านี้เป็น `false`
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่งแบบเนทีฟ Auto: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (จนกว่าคุณจะเพิ่ม slash commands); ไม่สนใจสำหรับผู้ให้บริการที่ไม่รองรับแบบเนทีฟ ตั้งค่า `channels.discord.commands.native`, `channels.telegram.commands.native` หรือ `channels.slack.commands.native` เพื่อ override เป็นรายผู้ให้บริการ (bool หรือ `"auto"`) ค่า `false` จะล้างคำสั่งที่เคยลงทะเบียนไว้ก่อนหน้านี้บน Discord/Telegram ตอนเริ่มต้น ระบบจะไม่ลบคำสั่งของ Slack โดยอัตโนมัติ เพราะจัดการในแอป Slack
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่ง **Skill** แบบเนทีฟเมื่อรองรับ Auto: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (Slack ต้องสร้าง slash command แยกต่อ Skill) ตั้งค่า `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` หรือ `channels.slack.commands.nativeSkills` เพื่อ override เป็นรายผู้ให้บริการ (bool หรือ `"auto"`)
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  เปิดใช้ `! <cmd>` เพื่อรันคำสั่งเชลล์บน host (`/bash <cmd>` เป็นชื่อแทน; ต้องใช้ allowlist ของ `tools.elevated`)
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  ควบคุมระยะเวลาที่ bash จะรอก่อนสลับไปเป็นโหมดเบื้องหลัง (`0` จะย้ายไปเบื้องหลังทันที)
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`)
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  เปิดใช้ `/mcp` (อ่าน/เขียน config MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`)
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  เปิดใช้ `/plugins` (การค้นหา/สถานะของ Plugin รวมถึงตัวควบคุมการติดตั้ง + เปิด/ปิดใช้งาน)
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  เปิดใช้ `/debug` (override ที่ใช้เฉพาะตอนรันไทม์)
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  เปิดใช้ `/restart` รวมถึง action ของ tool สำหรับรีสตาร์ต gateway
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  ตั้งค่า allowlist ของเจ้าของแบบชัดเจนสำหรับพื้นผิวคำสั่ง/tool ที่ใช้ได้เฉพาะเจ้าของ แยกจาก `commands.allowFrom`
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  ระดับต่อแชนเนล: ทำให้คำสั่งที่ใช้ได้เฉพาะเจ้าของต้องใช้ **อัตลักษณ์เจ้าของ** เพื่อรันบนพื้นผิวนั้น เมื่อเป็น `true` ผู้ส่งต้องตรงกับผู้สมัครเจ้าของที่ resolve ได้ (ตัวอย่างเช่น รายการใน `commands.ownerAllowFrom` หรือข้อมูลเมตาเจ้าของแบบเนทีฟของผู้ให้บริการ) หรือมี scope ภายใน `operator.admin` บนแชนเนลข้อความภายใน รายการ wildcard ใน `allowFrom` ของแชนเนล หรือรายการผู้สมัครเจ้าของที่ว่าง/resolve ไม่ได้ **ไม่** เพียงพอ — คำสั่งสำหรับเจ้าของเท่านั้นจะล้มเหลวแบบ fail closed บนแชนเนลนั้น ปล่อยค่านี้เป็นปิดไว้ หากคุณต้องการให้คำสั่งสำหรับเจ้าของเท่านั้นถูกควบคุมแค่ด้วย `ownerAllowFrom` และ allowlist คำสั่งมาตรฐาน
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  ควบคุมวิธีแสดง id ของเจ้าของใน system prompt
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  ตั้งค่า HMAC secret ที่ใช้เมื่อ `commands.ownerDisplay="hash"` ได้ (เป็นตัวเลือก)
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  allowlist ต่อผู้ให้บริการสำหรับการอนุญาตคำสั่ง เมื่อกำหนดค่าไว้แล้ว สิ่งนี้จะเป็นแหล่งการอนุญาตเพียงแหล่งเดียวสำหรับคำสั่งและ directive (allowlist/การจับคู่ของแชนเนล และ `commands.useAccessGroups` จะถูกละเลย) ใช้ `"*"` สำหรับค่าเริ่มต้นทั่วระบบ; คีย์เฉพาะผู้ให้บริการจะ override มัน
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  บังคับใช้ allowlist/นโยบายสำหรับคำสั่งเมื่อไม่ได้ตั้ง `commands.allowFrom`
</ParamField>

## รายการคำสั่ง

แหล่งข้อมูลจริงปัจจุบัน:

- คำสั่ง built-in ของแกนหลักมาจาก `src/auto-reply/commands-registry.shared.ts`
- คำสั่ง dock ที่สร้างขึ้นมาจาก `src/auto-reply/commands-registry.data.ts`
- คำสั่งของ Plugin มาจากการเรียก `registerCommand()` ของ Plugin
- การพร้อมใช้งานจริงบน gateway ของคุณยังขึ้นอยู่กับแฟล็กใน config, พื้นผิวของแชนเนล และ Plugin ที่ติดตั้ง/เปิดใช้งาน

### คำสั่ง built-in ของแกนหลัก

<AccordionGroup>
  <Accordion title="เซสชันและการรัน">
    - `/new [model]` เริ่มเซสชันใหม่; `/reset` เป็นชื่อแทนสำหรับรีเซ็ต
    - `/reset soft [message]` คง transcript ปัจจุบันไว้ ทิ้ง session id ของ CLI backend ที่นำกลับมาใช้ใหม่ และรันการโหลด startup/system-prompt ใหม่ในที่เดิม
    - `/compact [instructions]` ทำ Compaction บริบทของเซสชัน ดู [Compaction](/th/concepts/compaction)
    - `/stop` ยกเลิกการรันปัจจุบัน
    - `/session idle <duration|off>` และ `/session max-age <duration|off>` ใช้จัดการวันหมดอายุของการผูกเธรด
    - `/export-session [path]` ส่งออกเซสชันปัจจุบันเป็น HTML ชื่อแทน: `/export`
    - `/export-trajectory [path]` ส่งออก [trajectory bundle](/th/tools/trajectory) แบบ JSONL สำหรับเซสชันปัจจุบัน ชื่อแทน: `/trajectory`

  </Accordion>
  <Accordion title="ตัวควบคุมโมเดลและการรัน">
    - `/think <level>` ตั้งระดับ thinking ตัวเลือกมาจากโปรไฟล์ผู้ให้บริการของโมเดลที่ใช้งานอยู่ ระดับที่พบบ่อยคือ `off`, `minimal`, `low`, `medium` และ `high` พร้อมระดับกำหนดเองอย่าง `xhigh`, `adaptive`, `max` หรือแบบไบนารี `on` เฉพาะที่รองรับ ชื่อแทน: `/thinking`, `/t`
    - `/verbose on|off|full` สลับเอาต์พุตแบบ verbose ชื่อแทน: `/v`
    - `/trace on|off` สลับเอาต์พุต trace ของ Plugin สำหรับเซสชันปัจจุบัน
    - `/fast [status|on|off]` แสดงหรือตั้งค่าโหมดเร็ว
    - `/reasoning [on|off|stream]` สลับการมองเห็น reasoning ชื่อแทน: `/reason`
    - `/elevated [on|off|ask|full]` สลับโหมด elevated ชื่อแทน: `/elev`
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` แสดงหรือตั้งค่าเริ่มต้นของ exec
    - `/model [name|#|status]` แสดงหรือตั้งค่าโมเดล
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` แสดงรายการผู้ให้บริการหรือโมเดลของผู้ให้บริการ
    - `/queue <mode>` จัดการพฤติกรรมของคิว (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) พร้อมตัวเลือกอย่าง `debounce:2s cap:25 drop:summarize`

  </Accordion>
  <Accordion title="การค้นหาและสถานะ">
    - `/help` แสดงสรุปความช่วยเหลือแบบสั้น
    - `/commands` แสดงแค็ตตาล็อกคำสั่งที่สร้างขึ้น
    - `/tools [compact|verbose]` แสดงสิ่งที่ agent ปัจจุบันใช้ได้ในตอนนี้
    - `/status` แสดงสถานะการทำงาน/รันไทม์ รวมถึงป้าย `Execution`/`Runtime` และการใช้งาน/โควตาของผู้ให้บริการเมื่อมี
    - `/crestodian <request>` รันตัวช่วยตั้งค่าและซ่อมแซม Crestodian จาก DM ของเจ้าของ
    - `/tasks` แสดงรายการงานเบื้องหลังที่กำลังทำงาน/ล่าสุดสำหรับเซสชันปัจจุบัน
    - `/context [list|detail|json]` อธิบายว่าบริบทถูกประกอบอย่างไร
    - `/whoami` แสดง sender id ของคุณ ชื่อแทน: `/id`
    - `/usage off|tokens|full|cost` ควบคุมส่วนท้ายการใช้งานต่อการตอบกลับ หรือพิมพ์สรุปต้นทุนในเครื่อง

  </Accordion>
  <Accordion title="Skills, allowlist, approvals">
    - `/skill <name> [input]` รัน Skill ตามชื่อ
    - `/allowlist [list|add|remove] ...` จัดการรายการ allowlist ใช้ได้เฉพาะแบบข้อความ
    - `/approve <id> <decision>` ตัดสินพรอมป์ต์อนุมัติ exec
    - `/btw <question>` ถามคำถามแทรกโดยไม่เปลี่ยนบริบทของเซสชันในอนาคต ดู [BTW](/th/tools/btw)

  </Accordion>
  <Accordion title="Subagent และ ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` จัดการการรัน sub-agent สำหรับเซสชันปัจจุบัน
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` จัดการเซสชัน ACP และตัวเลือกรันไทม์
    - `/focus <target>` ผูกเธรด Discord หรือ topic/conversation ของ Telegram ปัจจุบันเข้ากับเป้าหมายของเซสชัน
    - `/unfocus` เอาการผูกปัจจุบันออก
    - `/agents` แสดงรายการ agent ที่ผูกกับเธรดสำหรับเซสชันปัจจุบัน
    - `/kill <id|#|all>` ยกเลิก sub-agent ที่กำลังทำงานอยู่หนึ่งตัวหรือทั้งหมด
    - `/steer <id|#> <message>` ส่งคำสั่ง steer ไปยัง sub-agent ที่กำลังทำงาน ชื่อแทน: `/tell`

  </Accordion>
  <Accordion title="การเขียนและงานดูแลระบบที่ใช้ได้เฉพาะเจ้าของ">
    - `/config show|get|set|unset` อ่านหรือเขียน `openclaw.json` ใช้ได้เฉพาะเจ้าของ ต้องใช้ `commands.config: true`
    - `/mcp show|get|set|unset` อ่านหรือเขียน config เซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers` ใช้ได้เฉพาะเจ้าของ ต้องใช้ `commands.mcp: true`
    - `/plugins list|inspect|show|get|install|enable|disable` ตรวจสอบหรือเปลี่ยนสถานะของ Plugin `/plugin` เป็นชื่อแทน การเขียนใช้ได้เฉพาะเจ้าของ ต้องใช้ `commands.plugins: true`
    - `/debug show|set|unset|reset` จัดการ override ของ config ที่ใช้เฉพาะตอนรันไทม์ ใช้ได้เฉพาะเจ้าของ ต้องใช้ `commands.debug: true`
    - `/restart` รีสตาร์ต OpenClaw เมื่อเปิดใช้งาน ค่าปริยาย: เปิด; ตั้ง `commands.restart: false` เพื่อปิด
    - `/send on|off|inherit` ตั้งค่านโยบายการส่ง ใช้ได้เฉพาะเจ้าของ

  </Accordion>
  <Accordion title="เสียง, TTS, การควบคุมแชนเนล">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` ควบคุม TTS ดู [TTS](/th/tools/tts)
    - `/activation mention|always` ตั้งค่าโหมดการเปิดใช้งานของกลุ่ม
    - `/bash <command>` รันคำสั่งเชลล์บน host ใช้ได้เฉพาะแบบข้อความ ชื่อแทน: `! <command>` ต้องใช้ `commands.bash: true` ร่วมกับ allowlist ของ `tools.elevated`
    - `!poll [sessionId]` ตรวจสอบงาน bash เบื้องหลัง
    - `!stop [sessionId]` หยุดงาน bash เบื้องหลัง

  </Accordion>
</AccordionGroup>

### คำสั่ง dock ที่สร้างขึ้น

คำสั่ง dock ถูกสร้างจาก Plugin ของแชนเนลที่รองรับคำสั่งแบบเนทีฟ ชุด bundled ปัจจุบัน:

- `/dock-discord` (ชื่อแทน: `/dock_discord`)
- `/dock-mattermost` (ชื่อแทน: `/dock_mattermost`)
- `/dock-slack` (ชื่อแทน: `/dock_slack`)
- `/dock-telegram` (ชื่อแทน: `/dock_telegram`)

### คำสั่งของ Plugin แบบ bundled

Plugin แบบ bundled สามารถเพิ่ม slash commands เพิ่มเติมได้ คำสั่งแบบ bundled ปัจจุบันในรีโปนี้:

- `/dreaming [on|off|status|help]` สลับการ Dreaming ของ memory ดู [Dreaming](/th/concepts/dreaming)
- `/pair [qr|status|pending|approve|cleanup|notify]` จัดการโฟลว์การจับคู่อุปกรณ์/การตั้งค่า ดู [การจับคู่](/th/channels/pairing)
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` เปิดใช้งานคำสั่ง Node โทรศัพท์ที่มีความเสี่ยงสูงชั่วคราว
- `/voice status|list [limit]|set <voiceId|name>` จัดการ config เสียงของ Talk บน Discord ชื่อคำสั่งแบบเนทีฟคือ `/talkvoice`
- `/card ...` ส่ง preset ของ LINE rich card ดู [LINE](/th/channels/line)
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` ตรวจสอบและควบคุมแอปเซิร์ฟเวอร์ harness ของ Codex แบบ bundled ดู [Codex harness](/th/plugins/codex-harness)
- คำสั่งเฉพาะ QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### คำสั่ง Skill แบบไดนามิก

Skills ที่ผู้ใช้เรียกใช้ได้จะถูกเปิดเผยเป็น slash commands ด้วย:

- `/skill <name> [input]` ใช้งานได้เสมอในฐานะ entrypoint แบบทั่วไป
- skill อาจปรากฏเป็นคำสั่งโดยตรง เช่น `/prose` เมื่อ skill/Plugin ลงทะเบียนไว้
- การลงทะเบียนคำสั่ง Skill แบบเนทีฟถูกควบคุมโดย `commands.nativeSkills` และ `channels.<provider>.commands.nativeSkills`

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับอาร์กิวเมนต์และ parser">
    - คำสั่งรองรับ `:` ที่เป็นตัวเลือก ระหว่างคำสั่งกับอาร์กิวเมนต์ (เช่น `/think: high`, `/send: on`, `/help:`)
    - `/new <model>` รับชื่อแทนของโมเดล, `provider/model` หรือชื่อผู้ให้บริการ (fuzzy match); หากไม่พบที่ตรงกัน ข้อความนั้นจะถูกถือเป็นเนื้อหาข้อความ
    - หากต้องการดูรายละเอียดการใช้งานของผู้ให้บริการแบบเต็ม ให้ใช้ `openclaw status --usage`
    - `/allowlist add|remove` ต้องใช้ `commands.config=true` และเป็นไปตาม `configWrites` ของแชนเนล
    - ในแชนเนลแบบหลายบัญชี คำสั่ง `/allowlist --account <id>` และ `/config set channels.<provider>.accounts.<id>...` ที่มุ่งไปยัง config จะยังเป็นไปตาม `configWrites` ของบัญชีเป้าหมายนั้นด้วย
    - `/usage` ควบคุมส่วนท้ายการใช้งานต่อการตอบกลับ; `/usage cost` จะพิมพ์สรุปต้นทุนในเครื่องจากบันทึกเซสชันของ OpenClaw
    - `/restart` เปิดใช้งานโดยปริยาย; ตั้ง `commands.restart: false` เพื่อปิด
    - `/plugins install <spec>` รับ plugin spec แบบเดียวกับ `openclaw plugins install`: path/archive ภายในเครื่อง, แพ็กเกจ npm หรือ `clawhub:<pkg>`
    - `/plugins enable|disable` จะอัปเดต config ของ Plugin และอาจถามให้รีสตาร์ต

  </Accordion>
  <Accordion title="พฤติกรรมเฉพาะแชนเนล">
    - คำสั่งแบบเนทีฟเฉพาะ Discord: `/vc join|leave|status` ใช้ควบคุม voice channels (ไม่มีในแบบข้อความ) `join` ต้องใช้ guild และ voice/stage channel ที่เลือกไว้ ต้องเปิด `channels.discord.voice` และคำสั่งแบบเนทีฟ
    - คำสั่งผูกเธรดของ Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) ต้องเปิด effective thread bindings (`session.threadBindings.enabled` และ/หรือ `channels.discord.threadBindings.enabled`)
    - เอกสารอ้างอิงคำสั่ง ACP และพฤติกรรมรันไทม์: [ACP agents](/th/tools/acp-agents)

  </Accordion>
  <Accordion title="ความปลอดภัยของ verbose / trace / fast / reasoning">
    - `/verbose` มีไว้สำหรับการดีบักและการมองเห็นเพิ่มเติม; ควรปิดไว้ (**off**) ในการใช้งานปกติ
    - `/trace` มีขอบเขตแคบกว่า `/verbose`: จะแสดงเฉพาะบรรทัด trace/debug ที่เป็นของ Plugin และยังคงปิดเสียงรบกวนของ tool แบบ verbose ปกติไว้
    - `/fast on|off` จะคงค่า override ของเซสชันไว้ ใช้ตัวเลือก `inherit` ใน Sessions UI เพื่อล้างค่าและ fallback กลับไปใช้ค่าเริ่มต้นจาก config
    - `/fast` ขึ้นกับผู้ให้บริการ: OpenAI/OpenAI Codex จะแมปเป็น `service_tier=priority` บน endpoint Responses แบบเนทีฟ ขณะที่คำขอ Anthropic สาธารณะโดยตรง รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย OAuth ซึ่งส่งไปยัง `api.anthropic.com` จะแมปเป็น `service_tier=auto` หรือ `standard_only` ดู [OpenAI](/th/providers/openai) และ [Anthropic](/th/providers/anthropic)
    - สรุปความล้มเหลวของ tool จะยังคงแสดงเมื่อเกี่ยวข้อง แต่ข้อความความล้มเหลวแบบละเอียดจะรวมมาด้วยเฉพาะเมื่อ `/verbose` เป็น `on` หรือ `full`
    - `/reasoning`, `/verbose` และ `/trace` มีความเสี่ยงในบริบทกลุ่ม: อาจเปิดเผย reasoning ภายใน เอาต์พุตของ tool หรือข้อมูลวินิจฉัยของ Plugin ที่คุณไม่ได้ตั้งใจเปิดเผย ควรปล่อยให้ปิดไว้ โดยเฉพาะในแชตกลุ่ม

  </Accordion>
  <Accordion title="การสลับโมเดล">
    - `/model` จะคงโมเดลใหม่ของเซสชันทันที
    - หาก agent ว่างอยู่ การรันถัดไปจะใช้ทันที
    - หากมีการรันกำลังทำงานอยู่ OpenClaw จะทำเครื่องหมายว่าการสลับสดกำลังรออยู่ และจะรีสตาร์ตเป็นโมเดลใหม่เมื่อถึงจุด retry ที่สะอาดเท่านั้น
    - หากกิจกรรมของ tool หรือเอาต์พุตการตอบกลับเริ่มต้นไปแล้ว การสลับที่รออยู่อาจค้างไว้จนกว่าจะมีโอกาส retry ภายหลังหรือถึง turn ผู้ใช้ถัดไป
    - ใน TUI ภายในเครื่อง `/crestodian [request]` จะกลับจาก TUI ของ agent ปกติไปยัง Crestodian สิ่งนี้แยกจากโหมดกู้คืนของแชนเนลข้อความ และไม่ได้มอบสิทธิ์ config ระยะไกล

  </Accordion>
  <Accordion title="เส้นทางเร็วและทางลัดในบรรทัด">
    - **เส้นทางเร็ว:** ข้อความที่มีแต่คำสั่งจากผู้ส่งที่อยู่ใน allowlist จะถูกจัดการทันที (ข้ามคิว + โมเดล)
    - **การบังคับ mention ในกลุ่ม:** ข้อความที่มีแต่คำสั่งจากผู้ส่งที่อยู่ใน allowlist จะข้ามข้อกำหนดเรื่อง mention
    - **ทางลัดในบรรทัด (เฉพาะผู้ส่งที่อยู่ใน allowlist):** คำสั่งบางอย่างยังทำงานได้เมื่อฝังอยู่ในข้อความปกติ และจะถูกตัดออกก่อนที่โมเดลจะเห็นข้อความที่เหลือ
      - ตัวอย่าง: `hey /status` จะกระตุ้นการตอบกลับสถานะ และข้อความที่เหลือจะดำเนินต่อไปตามโฟลว์ปกติ
    - ปัจจุบัน: `/help`, `/commands`, `/status`, `/whoami` (`/id`)
    - ข้อความที่มีแต่คำสั่งจากผู้ส่งที่ไม่ได้รับอนุญาตจะถูกเพิกเฉยแบบเงียบ ๆ และ token `/...` ในบรรทัดจะถูกปฏิบัติเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="คำสั่ง Skill และอาร์กิวเมนต์แบบเนทีฟ">
    - **คำสั่ง Skill:** Skills แบบ `user-invocable` จะถูกเปิดเผยเป็น slash commands ชื่อจะถูกทำความสะอาดให้เป็น `a-z0-9_` (สูงสุด 32 ตัวอักษร); หากชนกันจะเติม suffix เป็นตัวเลข (เช่น `_2`)
      - `/skill <name> [input]` รัน Skill ตามชื่อ (มีประโยชน์เมื่อข้อจำกัดของคำสั่งแบบเนทีฟทำให้ไม่สามารถมีคำสั่งแยกต่อ Skill ได้)
      - โดยปริยาย คำสั่ง Skill จะถูกส่งต่อไปยังโมเดลในฐานะคำขอปกติ
      - Skills สามารถประกาศ `command-dispatch: tool` แบบตัวเลือกได้ เพื่อส่งเส้นทางคำสั่งไปยัง tool โดยตรง (กำหนดผลได้แน่นอน ไม่ผ่านโมเดล)
      - ตัวอย่าง: `/prose` (Plugin OpenProse) — ดู [OpenProse](/th/prose)
    - **อาร์กิวเมนต์คำสั่งแบบเนทีฟ:** Discord ใช้ autocomplete สำหรับตัวเลือกแบบไดนามิก (และเมนูปุ่มเมื่อคุณละอาร์กิวเมนต์ที่จำเป็น) Telegram และ Slack จะแสดงเมนูปุ่มเมื่อคำสั่งรองรับตัวเลือกและคุณละอาร์กิวเมนต์นั้น ตัวเลือกแบบไดนามิกจะถูก resolve เทียบกับโมเดลของเซสชันเป้าหมาย ดังนั้นตัวเลือกเฉพาะโมเดล เช่น ระดับของ `/think` จะเป็นไปตาม override `/model` ของเซสชันนั้น

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` ตอบคำถามของรันไทม์ ไม่ใช่คำถามของ config: **สิ่งที่ agent นี้ใช้ได้ในตอนนี้ในการสนทนานี้**

- `/tools` แบบปริยายเป็นโหมด compact และปรับให้เหมาะกับการไล่อ่านอย่างรวดเร็ว
- `/tools verbose` เพิ่มคำอธิบายสั้น ๆ
- พื้นผิวคำสั่งแบบเนทีฟที่รองรับอาร์กิวเมนต์จะเปิดเผยการสลับโหมดเดียวกันในรูป `compact|verbose`
- ผลลัพธ์มีขอบเขตตามเซสชัน ดังนั้นการเปลี่ยน agent, แชนเนล, เธรด, การอนุญาตของผู้ส่ง หรือโมเดล สามารถเปลี่ยนเอาต์พุตได้
- `/tools` รวมถึง tool ที่เข้าถึงได้จริงในรันไทม์ รวมถึง tool ของแกนหลัก, tool ของ Plugin ที่เชื่อมต่ออยู่ และ tool ที่แชนเนลเป็นเจ้าของ

สำหรับการแก้ไขโปรไฟล์และ override ให้ใช้แผง Tools ใน Control UI หรือพื้นผิว config/catalog แทนการมอง `/tools` เป็นแค็ตตาล็อกแบบคงที่

## พื้นผิวการใช้งาน (อะไรแสดงที่ไหน)

- **การใช้งาน/โควตาของผู้ให้บริการ** (ตัวอย่าง: "Claude เหลือ 80%") จะแสดงใน `/status` สำหรับผู้ให้บริการโมเดลปัจจุบัน เมื่อเปิดใช้การติดตามการใช้งาน OpenClaw จะทำให้หน้าต่างของผู้ให้บริการเป็นมาตรฐานในรูป `% left`; สำหรับ MiniMax ฟิลด์เปอร์เซ็นต์แบบเหลืออย่างเดียวจะถูกกลับค่าก่อนแสดง และคำตอบ `model_remains` จะให้ความสำคัญกับรายการ chat-model พร้อมป้ายแผนที่มีแท็กโมเดล
- **บรรทัด token/cache** ใน `/status` สามารถ fallback ไปใช้รายการการใช้งาน transcript ล่าสุดได้ เมื่อ snapshot สดของเซสชันมีข้อมูลน้อย ค่าจริงแบบสดที่ไม่เป็นศูนย์จะยังคงมีลำดับความสำคัญ และ transcript fallback ยังสามารถกู้ป้ายโมเดลรันไทม์ที่ใช้งานอยู่และผลรวมที่ใหญ่กว่าซึ่งเน้น prompt ได้ เมื่อผลรวมที่จัดเก็บไว้หายไปหรือเล็กกว่า
- **Execution เทียบกับ runtime:** `/status` รายงาน `Execution` สำหรับเส้นทาง sandbox ที่มีผลจริง และ `Runtime` สำหรับผู้ที่กำลังรันเซสชันจริง: `OpenClaw Pi Default`, `OpenAI Codex`, CLI backend หรือ ACP backend
- **token/cost ต่อการตอบกลับ** ถูกควบคุมโดย `/usage off|tokens|full` (ต่อท้ายในคำตอบปกติ)
- `/model status` เกี่ยวกับ **โมเดล/การยืนยันตัวตน/endpoint** ไม่ใช่การใช้งาน

## การเลือกโมเดล (`/model`)

`/model` ถูกทำเป็น directive

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

- `/model` และ `/model list` จะแสดงตัวเลือกแบบกะทัดรัดที่มีหมายเลข (ตระกูลโมเดล + ผู้ให้บริการที่ใช้ได้)
- บน Discord `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบที่มี dropdown สำหรับผู้ให้บริการและโมเดล พร้อมขั้นตอน Submit
- `/model <#>` จะเลือกจากตัวเลือกนั้น (และจะเลือกผู้ให้บริการปัจจุบันก่อนเมื่อเป็นไปได้)
- `/model status` จะแสดงมุมมองแบบละเอียด รวมถึง endpoint ของผู้ให้บริการที่กำหนดค่าไว้ (`baseUrl`) และโหมด API (`api`) เมื่อมี

## Debug overrides

`/debug` ช่วยให้คุณตั้งค่า override ของ config แบบ **runtime-only** (อยู่ในหน่วยความจำ ไม่เขียนดิสก์) ใช้ได้เฉพาะเจ้าของ ปิดไว้โดยปริยาย; เปิดด้วย `commands.debug: true`

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

`/trace` ช่วยให้คุณสลับ **บรรทัด trace/debug ของ Plugin ที่มีขอบเขตตามเซสชัน** โดยไม่ต้องเปิดโหมด verbose เต็มรูปแบบ

ตัวอย่าง:

```text
/trace
/trace on
/trace off
```

หมายเหตุ:

- `/trace` ที่ไม่มีอาร์กิวเมนต์ จะแสดงสถานะ trace ปัจจุบันของเซสชัน
- `/trace on` เปิดใช้บรรทัด trace ของ Plugin สำหรับเซสชันปัจจุบัน
- `/trace off` ปิดอีกครั้ง
- บรรทัด trace ของ Plugin อาจปรากฏใน `/status` และเป็นข้อความวินิจฉัยติดตามผลหลังคำตอบปกติของ assistant
- `/trace` ไม่ได้มาแทน `/debug`; `/debug` ยังคงใช้จัดการ override ของ config ที่ใช้เฉพาะตอนรันไทม์
- `/trace` ไม่ได้มาแทน `/verbose`; เอาต์พุต tool/status แบบ verbose ปกติยังคงเป็นหน้าที่ของ `/verbose`

## การอัปเดต config

`/config` จะเขียนไปยัง config บนดิสก์ของคุณ (`openclaw.json`) ใช้ได้เฉพาะเจ้าของ ปิดไว้โดยปริยาย; เปิดด้วย `commands.config: true`

ตัวอย่าง:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Config จะถูกตรวจสอบความถูกต้องก่อนเขียน; การเปลี่ยนแปลงที่ไม่ถูกต้องจะถูกปฏิเสธ การอัปเดตผ่าน `/config` จะคงอยู่หลังการรีสตาร์ต
</Note>

## การอัปเดต MCP

`/mcp` จะเขียนนิยามของเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการไว้ภายใต้ `mcp.servers` ใช้ได้เฉพาะเจ้าของ ปิดไว้โดยปริยาย; เปิดด้วย `commands.mcp: true`

ตัวอย่าง:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` จะเก็บ config ไว้ใน config ของ OpenClaw ไม่ใช่ในการตั้งค่าโปรเจกต์ที่ Pi เป็นเจ้าของ Runtime adapter จะเป็นผู้ตัดสินว่า transport ใดสามารถรันได้จริง
</Note>

## การอัปเดต Plugin

`/plugins` ช่วยให้ผู้ปฏิบัติงานตรวจสอบ Plugin ที่ค้นพบและสลับการเปิดใช้งานใน config ได้ โฟลว์แบบอ่านอย่างเดียวสามารถใช้ `/plugin` เป็นชื่อแทน ปิดไว้โดยปริยาย; เปิดด้วย `commands.plugins: true`

ตัวอย่าง:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` และ `/plugins show` ใช้การค้นหา Plugin จริงกับ workspace ปัจจุบันร่วมกับ config บนดิสก์
- `/plugins enable|disable` จะอัปเดตเฉพาะ config ของ Plugin; ไม่ได้ติดตั้งหรือลบการติดตั้ง Plugin
- หลังเปลี่ยนการเปิด/ปิดใช้งาน ให้รีสตาร์ต gateway เพื่อให้การเปลี่ยนแปลงมีผล

</Note>

## หมายเหตุเกี่ยวกับพื้นผิว

<AccordionGroup>
  <Accordion title="เซสชันตามพื้นผิว">
    - **คำสั่งแบบข้อความ** ทำงานในเซสชันแชตปกติ (DM ใช้ `main` ร่วมกัน ส่วนกลุ่มมีเซสชันของตนเอง)
    - **คำสั่งแบบเนทีฟ** ใช้เซสชันที่แยกออกจากกัน:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefix ปรับได้ผ่าน `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (กำหนดเป้าหมายไปยังเซสชันแชตผ่าน `CommandTargetSessionKey`)
    - **`/stop`** จะกำหนดเป้าหมายไปยังเซสชันแชตที่กำลังใช้งานอยู่ เพื่อให้สามารถยกเลิกการรันปัจจุบันได้

  </Accordion>
  <Accordion title="รายละเอียดเฉพาะของ Slack">
    `channels.slack.slashCommand` ยังคงรองรับสำหรับคำสั่งเดี่ยวแบบ `/openclaw` หากคุณเปิด `commands.native` คุณต้องสร้าง Slack slash command แยกหนึ่งคำสั่งต่อคำสั่ง built-in หนึ่งคำสั่ง (ใช้ชื่อเดียวกับ `/help`) เมนูอาร์กิวเมนต์ของคำสั่งสำหรับ Slack จะถูกส่งเป็นปุ่ม Block Kit แบบ ephemeral

    ข้อยกเว้นแบบเนทีฟของ Slack: ให้ลงทะเบียน `/agentstatus` (ไม่ใช่ `/status`) เพราะ Slack สงวน `/status` ไว้ ส่วน `/status` แบบข้อความยังคงใช้ได้ในข้อความ Slack

  </Accordion>
</AccordionGroup>

## คำถามแทรก BTW

`/btw` คือ **คำถามแทรก** แบบรวดเร็วเกี่ยวกับเซสชันปัจจุบัน

ต่างจากแชตปกติ:

- มันใช้เซสชันปัจจุบันเป็นบริบทพื้นหลัง
- มันทำงานเป็นการเรียกครั้งเดียวแบบแยกออกมาและ **ไม่มี tool**
- มันไม่เปลี่ยนบริบทของเซสชันในอนาคต
- มันไม่ถูกเขียนลงในประวัติ transcript
- มันถูกส่งมอบเป็นผลลัพธ์ด้านข้างแบบสด แทนที่จะเป็นข้อความ assistant ปกติ

สิ่งนี้ทำให้ `/btw` มีประโยชน์เมื่อคุณต้องการคำชี้แจงชั่วคราว ขณะที่งานหลักยังดำเนินต่อไป

ตัวอย่าง:

```text
/btw what are we doing right now?
```

ดู [คำถามแทรก BTW](/th/tools/btw) สำหรับพฤติกรรมแบบเต็มและรายละเอียด UX ของไคลเอนต์

## ที่เกี่ยวข้อง

- [การสร้าง Skills](/th/tools/creating-skills)
- [Skills](/th/tools/skills)
- [Config ของ Skills](/th/tools/skills-config)
