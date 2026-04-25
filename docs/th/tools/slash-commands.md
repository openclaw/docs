---
read_when:
    - การใช้หรือกำหนดค่าคำสั่งแชต
    - การแก้ไขข้อบกพร่องของการกำหนดเส้นทางคำสั่งหรือสิทธิ์
summary: 'คำสั่งสแลช: แบบข้อความเทียบกับแบบ native, การกำหนดค่า และคำสั่งที่รองรับ'
title: คำสั่งสแลช
x-i18n:
    generated_at: "2026-04-25T14:01:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: b95f33df9a05bd74855695c29b5c449af7a73714596932be5ce923a1ddab8ee7
    source_path: tools/slash-commands.md
    workflow: 15
---

คำสั่งต่าง ๆ ถูกจัดการโดย Gateway คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความ **เดี่ยว**
ที่ขึ้นต้นด้วย `/`
คำสั่งแชต bash แบบโฮสต์เท่านั้นใช้ `! <cmd>` (โดยมี `/bash <cmd>` เป็น alias)

มีสองระบบที่เกี่ยวข้องกัน:

- **Commands**: ข้อความ `/...` แบบเดี่ยว
- **Directives**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`
  - Directives จะถูกตัดออกจากข้อความก่อนที่โมเดลจะเห็น
  - ในข้อความแชตปกติ (ไม่ใช่ข้อความที่มีแต่ directive) จะถูกปฏิบัติเป็น “inline hints” และ **จะไม่** บันทึกการตั้งค่าระดับ session
  - ในข้อความที่มีแต่ directive (ข้อความมีเฉพาะ directives) จะบันทึกลงใน session และตอบกลับด้วยข้อความยืนยัน
  - Directives จะถูกนำไปใช้เฉพาะกับ **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น หากตั้งค่า `commands.allowFrom` ไว้ ค่านั้นจะเป็น
    allowlist เดียวที่ใช้; มิฉะนั้นการให้สิทธิ์จะมาจาก channel allowlists/pairing ร่วมกับ `commands.useAccessGroups`
    ผู้ส่งที่ไม่ได้รับอนุญาตจะเห็น directives ถูกปฏิบัติเป็นข้อความธรรมดา

ยังมี **inline shortcuts** บางรายการด้วย (เฉพาะผู้ส่งที่อยู่ใน allowlist/ได้รับอนุญาต): `/help`, `/commands`, `/status`, `/whoami` (`/id`)
คำสั่งเหล่านี้จะรันทันที ถูกตัดออกก่อนที่โมเดลจะเห็นข้อความ และข้อความที่เหลือจะดำเนินต่อผ่านโฟลว์ปกติ

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

- `commands.text` (ค่าเริ่มต้น `true`) เปิดใช้การแยกวิเคราะห์ `/...` ในข้อความแชต
  - บนพื้นผิวที่ไม่มีคำสั่ง native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) คำสั่งแบบข้อความจะยังใช้งานได้แม้คุณจะตั้งค่านี้เป็น `false`
- `commands.native` (ค่าเริ่มต้น `"auto"`) ลงทะเบียนคำสั่ง native
  - Auto: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (จนกว่าคุณจะเพิ่ม slash commands); ถูกเพิกเฉยสำหรับ provider ที่ไม่รองรับ native
  - ตั้งค่า `channels.discord.commands.native`, `channels.telegram.commands.native` หรือ `channels.slack.commands.native` เพื่อ override เป็นราย provider (bool หรือ `"auto"`)
  - `false` จะล้างคำสั่งที่เคยลงทะเบียนไว้ก่อนหน้านี้บน Discord/Telegram ตอนเริ่มต้น คำสั่งของ Slack ถูกจัดการในแอป Slack และจะไม่ถูกลบโดยอัตโนมัติ
- `commands.nativeSkills` (ค่าเริ่มต้น `"auto"`) ลงทะเบียนคำสั่ง **skill** แบบ native เมื่อรองรับ
  - Auto: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (Slack ต้องสร้าง slash command แยกต่อ skill)
  - ตั้งค่า `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` หรือ `channels.slack.commands.nativeSkills` เพื่อ override เป็นราย provider (bool หรือ `"auto"`)
- `commands.bash` (ค่าเริ่มต้น `false`) เปิดใช้ `! <cmd>` เพื่อรันคำสั่ง shell บนโฮสต์ (`/bash <cmd>` เป็น alias; ต้องใช้ allowlists ของ `tools.elevated`)
- `commands.bashForegroundMs` (ค่าเริ่มต้น `2000`) ควบคุมระยะเวลาที่ bash จะรอก่อนสลับเป็นโหมดเบื้องหลัง (`0` คือไปเบื้องหลังทันที)
- `commands.config` (ค่าเริ่มต้น `false`) เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`)
- `commands.mcp` (ค่าเริ่มต้น `false`) เปิดใช้ `/mcp` (อ่าน/เขียน config MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`)
- `commands.plugins` (ค่าเริ่มต้น `false`) เปิดใช้ `/plugins` (การค้นหา/สถานะ Plugin รวมถึงการติดตั้ง + การเปิด/ปิดใช้งาน)
- `commands.debug` (ค่าเริ่มต้น `false`) เปิดใช้ `/debug` (overrides ที่มีผลเฉพาะรันไทม์)
- `commands.restart` (ค่าเริ่มต้น `true`) เปิดใช้ `/restart` รวมถึง tool actions สำหรับรีสตาร์ต gateway
- `commands.ownerAllowFrom` (ไม่บังคับ) กำหนด owner allowlist แบบ explicit สำหรับพื้นผิวคำสั่ง/เครื่องมือที่ใช้ได้เฉพาะ owner ซึ่งแยกจาก `commands.allowFrom`
- ค่า per-channel `channels.<channel>.commands.enforceOwnerForCommands` (ไม่บังคับ, ค่าเริ่มต้น `false`) ทำให้คำสั่งที่ใช้ได้เฉพาะ owner ต้องใช้ **ตัวตน owner** จึงจะรันบนพื้นผิวนั้นได้ เมื่อเป็น `true` ผู้ส่งต้องตรงกับ owner candidate ที่ resolve แล้ว (เช่น รายการใน `commands.ownerAllowFrom` หรือเมทาดาทา owner แบบ native ของ provider) หรือถือ scope ภายใน `operator.admin` บน internal message channel รายการ wildcard ใน `allowFrom` ของ channel หรือรายการ owner-candidate ที่ว่าง/resolve ไม่ได้ **ไม่** เพียงพอ — คำสั่งที่ใช้ได้เฉพาะ owner จะ fail closed บน channel นั้น ปล่อยค่านี้เป็นปิดไว้หากคุณต้องการให้คำสั่ง owner-only ถูกควบคุมเพียงด้วย `ownerAllowFrom` และ command allowlists มาตรฐาน
- `commands.ownerDisplay` ควบคุมวิธีแสดง owner ids ใน system prompt: `raw` หรือ `hash`
- `commands.ownerDisplaySecret` กำหนด HMAC secret ที่ใช้เมื่อ `commands.ownerDisplay="hash"` ได้แบบไม่บังคับ
- `commands.allowFrom` (ไม่บังคับ) กำหนด allowlist แบบ per-provider สำหรับการอนุญาตคำสั่ง เมื่อกำหนดไว้แล้ว ค่านี้จะเป็น
  แหล่งการอนุญาตเพียงแหล่งเดียวสำหรับ commands และ directives (`commands.useAccessGroups` และ channel allowlists/pairing
  จะถูกเพิกเฉย) ใช้ `"*"` สำหรับค่าเริ่มต้นแบบ global; คีย์เฉพาะ provider จะ override ค่านี้
- `commands.useAccessGroups` (ค่าเริ่มต้น `true`) บังคับใช้ allowlists/policies สำหรับคำสั่งเมื่อไม่ได้ตั้ง `commands.allowFrom`

## รายการคำสั่ง

แหล่งข้อมูลจริงปัจจุบัน:

- core built-ins มาจาก `src/auto-reply/commands-registry.shared.ts`
- dock commands ที่สร้างขึ้นมาจาก `src/auto-reply/commands-registry.data.ts`
- คำสั่ง Plugin มาจากการเรียก `registerCommand()` ของ Plugin
- ความพร้อมใช้งานจริงบน gateway ของคุณยังขึ้นอยู่กับแฟล็ก config, พื้นผิว channel และ Plugin ที่ติดตั้ง/เปิดใช้งาน

### คำสั่ง built-in ของ core

คำสั่ง built-in ที่พร้อมใช้งานในปัจจุบัน:

- `/new [model]` เริ่ม session ใหม่; `/reset` เป็น alias สำหรับ reset
- `/reset soft [message]` คง transcript ปัจจุบันไว้ ลบ session id ของ CLI backend ที่นำกลับมาใช้ซ้ำ และรันการโหลด startup/system prompt ใหม่ในที่เดิม
- `/compact [instructions]` ทำ Compaction ให้ context ของ session ดู [/concepts/compaction](/th/concepts/compaction)
- `/stop` ยกเลิกการรันปัจจุบัน
- `/session idle <duration|off>` และ `/session max-age <duration|off>` จัดการอายุหมดของการผูกกับ thread
- `/think <level>` ตั้งค่าระดับการคิด ตัวเลือกมาจากโปรไฟล์ provider ของโมเดลที่ใช้งานอยู่; ระดับที่พบบ่อยคือ `off`, `minimal`, `low`, `medium` และ `high` พร้อมระดับแบบกำหนดเอง เช่น `xhigh`, `adaptive`, `max` หรือแบบไบนารี `on` เฉพาะในกรณีที่รองรับ Alias: `/thinking`, `/t`
- `/verbose on|off|full` สลับเอาต์พุตแบบละเอียด Alias: `/v`
- `/trace on|off` สลับเอาต์พุต trace ของ Plugin สำหรับ session ปัจจุบัน
- `/fast [status|on|off]` แสดงหรือตั้งค่าโหมดเร็ว
- `/reasoning [on|off|stream]` สลับการมองเห็น reasoning Alias: `/reason`
- `/elevated [on|off|ask|full]` สลับโหมด elevated Alias: `/elev`
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` แสดงหรือตั้งค่า exec defaults
- `/model [name|#|status]` แสดงหรือตั้งค่าโมเดล
- `/models [provider] [page] [limit=<n>|size=<n>|all]` แสดงรายการ providers หรือโมเดลของ provider
- `/queue <mode>` จัดการพฤติกรรมคิว (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) พร้อมตัวเลือกอย่าง `debounce:2s cap:25 drop:summarize`
- `/help` แสดงสรุปความช่วยเหลือแบบสั้น
- `/commands` แสดงแค็ตตาล็อกคำสั่งที่สร้างขึ้น
- `/tools [compact|verbose]` แสดงสิ่งที่ agent ปัจจุบันสามารถใช้ได้ในตอนนี้
- `/status` แสดงสถานะการทำงาน/รันไทม์ รวมถึงป้าย `Execution`/`Runtime` และการใช้งาน/โควต้าของ provider เมื่อมี
- `/crestodian <request>` รันตัวช่วยตั้งค่าและซ่อมแซม Crestodian จาก owner DM
- `/tasks` แสดงรายการงานเบื้องหลังที่กำลังทำงาน/ล่าสุดสำหรับ session ปัจจุบัน
- `/context [list|detail|json]` อธิบายวิธีประกอบ context
- `/export-session [path]` ส่งออก session ปัจจุบันเป็น HTML Alias: `/export`
- `/export-trajectory [path]` ส่งออก [trajectory bundle](/th/tools/trajectory) แบบ JSONL สำหรับ session ปัจจุบัน Alias: `/trajectory`
- `/whoami` แสดง sender id ของคุณ Alias: `/id`
- `/skill <name> [input]` รัน skill ตามชื่อ
- `/allowlist [list|add|remove] ...` จัดการรายการ allowlist ใช้ได้เฉพาะแบบข้อความ
- `/approve <id> <decision>` จัดการพรอมป์ต์การอนุมัติ exec
- `/btw <question>` ถามคำถามข้างเคียงโดยไม่เปลี่ยน context ของ session ในอนาคต ดู [/tools/btw](/th/tools/btw)
- `/subagents list|kill|log|info|send|steer|spawn` จัดการการรัน sub-agent สำหรับ session ปัจจุบัน
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` จัดการ session และตัวเลือกรันไทม์ของ ACP
- `/focus <target>` ผูก Discord thread หรือ Telegram topic/conversation ปัจจุบันกับเป้าหมาย session
- `/unfocus` เอาการผูกปัจจุบันออก
- `/agents` แสดงรายการ agent ที่ผูกกับ thread สำหรับ session ปัจจุบัน
- `/kill <id|#|all>` ยกเลิก sub-agent ที่กำลังรันอยู่หนึ่งตัวหรือทั้งหมด
- `/steer <id|#> <message>` ส่งคำสั่งกำกับไปยัง sub-agent ที่กำลังรัน Alias: `/tell`
- `/config show|get|set|unset` อ่านหรือเขียน `openclaw.json` ใช้ได้เฉพาะ owner ต้องเปิด `commands.config: true`
- `/mcp show|get|set|unset` อ่านหรือเขียน config ของ MCP server ที่ OpenClaw จัดการภายใต้ `mcp.servers` ใช้ได้เฉพาะ owner ต้องเปิด `commands.mcp: true`
- `/plugins list|inspect|show|get|install|enable|disable` ตรวจสอบหรือเปลี่ยนสถานะ Plugin `/plugin` เป็น alias ใช้ได้เฉพาะ owner สำหรับการเขียน ต้องเปิด `commands.plugins: true`
- `/debug show|set|unset|reset` จัดการ config overrides ที่มีผลเฉพาะรันไทม์ ใช้ได้เฉพาะ owner ต้องเปิด `commands.debug: true`
- `/usage off|tokens|full|cost` ควบคุม footer การใช้งานต่อการตอบกลับ หรือพิมพ์สรุปต้นทุนในเครื่อง
- `/tts on|off|status|provider|limit|summary|audio|help` ควบคุม TTS ดู [/tools/tts](/th/tools/tts)
- `/restart` รีสตาร์ต OpenClaw เมื่อเปิดใช้งาน ค่าเริ่มต้น: เปิด; ตั้ง `commands.restart: false` เพื่อปิด
- `/activation mention|always` ตั้งค่าโหมดการเปิดใช้งานในกลุ่ม
- `/send on|off|inherit` ตั้งค่านโยบายการส่ง ใช้ได้เฉพาะ owner
- `/bash <command>` รันคำสั่ง shell บนโฮสต์ ใช้ได้เฉพาะแบบข้อความ Alias: `! <command>` ต้องเปิด `commands.bash: true` และมี allowlists ของ `tools.elevated`
- `!poll [sessionId]` ตรวจสอบงาน bash เบื้องหลัง
- `!stop [sessionId]` หยุดงาน bash เบื้องหลัง

### dock commands ที่สร้างขึ้น

Dock commands ถูกสร้างจาก channel plugins ที่รองรับ native-command ชุด bundled ปัจจุบันคือ:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### คำสั่งของ bundled plugin

bundled plugins สามารถเพิ่ม slash commands ได้อีก คำสั่งแบบ bundled ปัจจุบันใน repo นี้คือ:

- `/dreaming [on|off|status|help]` สลับ Dreaming ของ memory ดู [Dreaming](/th/concepts/dreaming)
- `/pair [qr|status|pending|approve|cleanup|notify]` จัดการโฟลว์การจับคู่/การตั้งค่าอุปกรณ์ ดู [Pairing](/th/channels/pairing)
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` เปิดใช้งานคำสั่ง node ของโทรศัพท์ที่มีความเสี่ยงสูงชั่วคราว
- `/voice status|list [limit]|set <voiceId|name>` จัดการ config เสียงของ Talk บน Discord ชื่อคำสั่ง native คือ `/talkvoice`
- `/card ...` ส่ง preset ของ LINE rich card ดู [LINE](/th/channels/line)
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` ตรวจสอบและควบคุม app-server harness แบบ bundled ของ Codex ดู [Codex Harness](/th/plugins/codex-harness)
- คำสั่งเฉพาะ QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### คำสั่ง Skill แบบไดนามิก

Skills ที่ผู้ใช้เรียกใช้ได้จะถูกเปิดเผยเป็น slash commands ด้วย:

- `/skill <name> [input]` ใช้งานได้เสมอในฐานะจุดเข้าใช้งานทั่วไป
- skills อาจปรากฏเป็นคำสั่งโดยตรง เช่น `/prose` เมื่อ skill/plugin ลงทะเบียนไว้
- การลงทะเบียนคำสั่ง skill แบบ native ถูกควบคุมด้วย `commands.nativeSkills` และ `channels.<provider>.commands.nativeSkills`

หมายเหตุ:

- คำสั่งรองรับ `:` แบบไม่บังคับระหว่างคำสั่งกับอาร์กิวเมนต์ (เช่น `/think: high`, `/send: on`, `/help:`)
- `/new <model>` รองรับ alias ของโมเดล, `provider/model` หรือชื่อ provider (จับคู่แบบ fuzzy); หากไม่พบที่ตรงกัน ข้อความนั้นจะถูกถือเป็นเนื้อหาข้อความ
- หากต้องการดูรายละเอียดการใช้งานของ provider แบบเต็ม ให้ใช้ `openclaw status --usage`
- `/allowlist add|remove` ต้องใช้ `commands.config=true` และเป็นไปตาม `configWrites` ของ channel
- ใน channel แบบหลายบัญชี `/allowlist --account <id>` ที่มุ่งเป้าไปยัง config และ `/config set channels.<provider>.accounts.<id>...` จะเป็นไปตาม `configWrites` ของบัญชีเป้าหมายด้วย
- `/usage` ควบคุม footer การใช้งานต่อการตอบกลับ; `/usage cost` จะพิมพ์สรุปต้นทุนในเครื่องจาก session logs ของ OpenClaw
- `/restart` เปิดใช้งานโดยค่าเริ่มต้น; ตั้ง `commands.restart: false` เพื่อปิด
- `/plugins install <spec>` รับ plugin spec แบบเดียวกับ `openclaw plugins install`: พาธ/ไฟล์เก็บถาวรในเครื่อง, แพ็กเกจ npm หรือ `clawhub:<pkg>`
- `/plugins enable|disable` จะอัปเดต config ของ Plugin และอาจขอให้รีสตาร์ต
- คำสั่ง native เฉพาะ Discord: `/vc join|leave|status` ใช้ควบคุม voice channels (ไม่มีในแบบข้อความ) `join` ต้องใช้ภายใน guild และมีการเลือก voice/stage channel แล้ว ต้องเปิด `channels.discord.voice` และคำสั่ง native
- คำสั่งผูก thread ของ Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) ต้องเปิดการผูก thread ที่มีผลจริง (`session.threadBindings.enabled` และ/หรือ `channels.discord.threadBindings.enabled`)
- ข้อมูลอ้างอิงคำสั่ง ACP และพฤติกรรมรันไทม์: [ACP Agents](/th/tools/acp-agents)
- `/verbose` มีไว้สำหรับการดีบักและการมองเห็นเพิ่มเติม; ควรปิดไว้ (**off**) ในการใช้งานปกติ
- `/trace` แคบกว่า `/verbose`: มันเปิดเผยเฉพาะบรรทัด trace/debug ที่เป็นของ Plugin และยังคงปิดข้อความ verbose ของเครื่องมือตามปกติ
- `/fast on|off` จะบันทึก override ระดับ session ใช้ตัวเลือก `inherit` ใน Sessions UI เพื่อล้างค่าและกลับไปใช้ค่าเริ่มต้นจาก config
- `/fast` ขึ้นอยู่กับ provider: OpenAI/OpenAI Codex จะจับคู่เป็น `service_tier=priority` บน native Responses endpoints ขณะที่คำขอ Anthropic สาธารณะโดยตรง รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย OAuth และส่งไปยัง `api.anthropic.com` จะจับคู่เป็น `service_tier=auto` หรือ `standard_only` ดู [OpenAI](/th/providers/openai) และ [Anthropic](/th/providers/anthropic)
- สรุปความล้มเหลวของเครื่องมือจะยังแสดงเมื่อเกี่ยวข้อง แต่ข้อความความล้มเหลวแบบละเอียดจะรวมมาด้วยก็ต่อเมื่อ `/verbose` เป็น `on` หรือ `full`
- `/reasoning`, `/verbose` และ `/trace` มีความเสี่ยงในบริบทกลุ่ม: อาจเปิดเผย reasoning ภายใน, เอาต์พุตของเครื่องมือ หรือข้อมูลวินิจฉัยของ Plugin ที่คุณไม่ได้ตั้งใจให้แสดง ควรปล่อยให้ปิดไว้ โดยเฉพาะในแชตกลุ่ม
- `/model` จะบันทึกโมเดลใหม่ของ session ทันที
- หาก agent ว่างอยู่ การรันครั้งถัดไปจะใช้โมเดลนั้นทันที
- หากมีการรันทำงานอยู่แล้ว OpenClaw จะทำเครื่องหมายการสลับแบบ live ว่ากำลังรอดำเนินการ และจะรีสตาร์ตไปยังโมเดลใหม่เฉพาะที่จุด retry ที่สะอาด
- หากกิจกรรมของเครื่องมือหรือเอาต์พุตตอบกลับเริ่มขึ้นแล้ว การสลับที่รอดำเนินการอาจค้างอยู่จนกว่าจะมีโอกาส retry ครั้งถัดไป หรือจนกว่าจะถึงตาผู้ใช้ถัดไป
- ใน TUI ภายในเครื่อง `/crestodian [request]` จะกลับจาก TUI ของ agent ปกติไปยัง
  Crestodian ซึ่งแยกจากโหมด rescue ของ message-channel และไม่ได้
  มอบสิทธิ์ config จากระยะไกล
- **เส้นทางเร็ว:** ข้อความที่มีแต่คำสั่งจากผู้ส่งที่อยู่ใน allowlist จะถูกจัดการทันที (ข้ามคิว + โมเดล)
- **การควบคุมด้วยการ mention ในกลุ่ม:** ข้อความที่มีแต่คำสั่งจากผู้ส่งที่อยู่ใน allowlist จะข้ามข้อกำหนดเรื่อง mention
- **inline shortcuts (เฉพาะผู้ส่งที่อยู่ใน allowlist):** คำสั่งบางรายการยังใช้งานได้เมื่อฝังอยู่ในข้อความปกติ และจะถูกตัดออกก่อนที่โมเดลจะเห็นข้อความส่วนที่เหลือ
  - ตัวอย่าง: `hey /status` จะเรียกการตอบกลับสถานะ และข้อความที่เหลือจะดำเนินต่อผ่านโฟลว์ปกติ
- ปัจจุบัน: `/help`, `/commands`, `/status`, `/whoami` (`/id`)
- ข้อความที่มีแต่คำสั่งจากผู้ส่งที่ไม่ได้รับอนุญาตจะถูกเพิกเฉยอย่างเงียบ ๆ และโทเค็น `/...` แบบ inline จะถูกปฏิบัติเป็นข้อความธรรมดา
- **คำสั่ง Skill:** Skills ที่ `user-invocable` จะถูกเปิดเผยเป็น slash commands ชื่อจะถูกทำให้สะอาดเป็น `a-z0-9_` (สูงสุด 32 ตัวอักษร); หากชนกันจะเติม suffix เป็นตัวเลข (เช่น `_2`)
  - `/skill <name> [input]` รัน skill ตามชื่อ (มีประโยชน์เมื่อข้อจำกัดของคำสั่ง native ทำให้ไม่สามารถมีคำสั่งแยกต่อ skill ได้)
  - โดยค่าเริ่มต้น คำสั่ง skill จะถูกส่งต่อไปยังโมเดลในรูปแบบคำขอปกติ
  - Skills สามารถประกาศ `command-dispatch: tool` แบบไม่บังคับ เพื่อกำหนดเส้นทางคำสั่งไปยังเครื่องมือโดยตรงได้ (กำหนดผลแน่นอน ไม่ผ่านโมเดล)
  - ตัวอย่าง: `/prose` (Plugin OpenProse) — ดู [OpenProse](/th/prose)
- **อาร์กิวเมนต์ของคำสั่ง native:** Discord ใช้ autocomplete สำหรับตัวเลือกแบบไดนามิก (และใช้เมนูปุ่มเมื่อคุณละอาร์กิวเมนต์ที่จำเป็น) Telegram และ Slack จะแสดงเมนูปุ่มเมื่อคำสั่งรองรับตัวเลือกและคุณละอาร์กิวเมนต์นั้น ตัวเลือกแบบไดนามิกจะ resolve เทียบกับโมเดลของ session เป้าหมาย ดังนั้นตัวเลือกเฉพาะโมเดล เช่น ระดับ `/think` จะเป็นไปตาม override ของ `/model` ของ session นั้น

## `/tools`

`/tools` ตอบคำถามด้านรันไทม์ ไม่ใช่คำถามด้าน config: **สิ่งที่ agent นี้ใช้ได้ในตอนนี้
ในการสนทนานี้**

- ค่าเริ่มต้นของ `/tools` เป็นแบบ compact และปรับให้เหมาะกับการสแกนอย่างรวดเร็ว
- `/tools verbose` เพิ่มคำอธิบายสั้น ๆ
- พื้นผิวคำสั่ง native ที่รองรับอาร์กิวเมนต์จะเปิดเผยการสลับโหมดแบบเดียวกันในรูป `compact|verbose`
- ผลลัพธ์เป็นแบบมีขอบเขตตาม session ดังนั้นการเปลี่ยน agent, channel, thread, การอนุญาตของผู้ส่ง หรือโมเดล สามารถ
  เปลี่ยนเอาต์พุตได้
- `/tools` รวมเครื่องมือที่เข้าถึงได้จริงในรันไทม์ รวมถึงเครื่องมือ core, เครื่องมือ Plugin ที่เชื่อมต่ออยู่ และเครื่องมือที่เป็นของ channel

สำหรับการแก้ไขโปรไฟล์และ override ให้ใช้แผง Tools ใน Control UI หรือพื้นผิว config/catalog แทน
แทนที่จะมอง `/tools` เป็นแค็ตตาล็อกแบบคงที่

## พื้นผิวการใช้งาน (สิ่งที่แสดงที่ไหน)

- **การใช้งาน/โควต้าของ provider** (ตัวอย่าง: “Claude เหลือ 80%”) จะแสดงใน `/status` สำหรับ provider ของโมเดลปัจจุบันเมื่อเปิดการติดตามการใช้งาน OpenClaw จะปรับหน้าต่างของ provider ให้เป็นการแสดงผล `% left`; สำหรับ MiniMax ฟิลด์เปอร์เซ็นต์ที่มีเฉพาะยอดคงเหลือจะถูกกลับค่าก่อนแสดงผล และการตอบกลับ `model_remains` จะเลือกใช้รายการ chat-model พร้อมป้ายแผนที่ติดแท็กโมเดลก่อน
- **บรรทัด token/cache** ใน `/status` สามารถ fallback ไปยังรายการการใช้งานล่าสุดใน transcript ได้เมื่อ snapshot ของ live session มีข้อมูลน้อย ค่า live ที่ไม่เป็นศูนย์ที่มีอยู่แล้วจะยังคงมีสิทธิ์ก่อน และ transcript fallback ยังสามารถกู้คืนป้ายโมเดลรันไทม์ที่ใช้งานอยู่ พร้อมยอดรวมแบบเน้น prompt ที่ใหญ่กว่าได้เมื่อยอดรวมที่จัดเก็บไว้หายไปหรือมีค่าน้อยกว่า
- **Execution เทียบกับ runtime:** `/status` รายงาน `Execution` สำหรับเส้นทาง sandbox ที่มีผลจริง และ `Runtime` สำหรับผู้ที่กำลังรัน session จริง ๆ: `OpenClaw Pi Default`, `OpenAI Codex`, CLI backend หรือ ACP backend
- **tokens/cost ต่อการตอบกลับ** ถูกควบคุมด้วย `/usage off|tokens|full` (ต่อท้ายในการตอบกลับปกติ)
- `/model status` เกี่ยวกับ **โมเดล/auth/endpoints** ไม่ใช่การใช้งาน

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

- `/model` และ `/model list` แสดงตัวเลือกแบบย่อที่มีหมายเลข (ตระกูลโมเดล + providers ที่ใช้ได้)
- บน Discord, `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบที่มี dropdown ของ provider และโมเดล พร้อมขั้นตอน Submit
- `/model <#>` เลือกจากตัวเลือกนั้น (และจะเลือก provider ปัจจุบันก่อนเมื่อเป็นไปได้)
- `/model status` แสดงมุมมองแบบละเอียด รวมถึง endpoint (`baseUrl`) และโหมด API (`api`) ของ provider ที่กำหนดค่าไว้เมื่อมี

## overrides สำหรับการดีบัก

`/debug` ให้คุณตั้งค่า config override **ที่มีผลเฉพาะรันไทม์** (ในหน่วยความจำ ไม่ใช่บนดิสก์) ใช้ได้เฉพาะ owner ปิดไว้โดยค่าเริ่มต้น; เปิดด้วย `commands.debug: true`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

หมายเหตุ:

- overrides จะมีผลทันทีต่อการอ่าน config ใหม่ แต่ **จะไม่** เขียนลงใน `openclaw.json`
- ใช้ `/debug reset` เพื่อล้าง overrides ทั้งหมดและกลับไปใช้ config บนดิสก์

## เอาต์พุต trace ของ Plugin

`/trace` ให้คุณสลับ **บรรทัด trace/debug ของ Plugin ที่มีขอบเขตตาม session** โดยไม่ต้องเปิดโหมด verbose เต็มรูปแบบ

ตัวอย่าง:

```text
/trace
/trace on
/trace off
```

หมายเหตุ:

- `/trace` โดยไม่มีอาร์กิวเมนต์จะแสดงสถานะ trace ปัจจุบันของ session
- `/trace on` เปิดใช้บรรทัด trace ของ Plugin สำหรับ session ปัจจุบัน
- `/trace off` ปิดอีกครั้ง
- บรรทัด trace ของ Plugin อาจปรากฏใน `/status` และเป็นข้อความวินิจฉัยติดตามหลังการตอบกลับปกติของ assistant
- `/trace` ไม่ได้แทนที่ `/debug`; `/debug` ยังคงใช้จัดการ config overrides ที่มีผลเฉพาะรันไทม์
- `/trace` ไม่ได้แทนที่ `/verbose`; เอาต์พุต verbose ของเครื่องมือ/สถานะตามปกติยังคงเป็นหน้าที่ของ `/verbose`

## การอัปเดต config

`/config` เขียนลงใน config บนดิสก์ของคุณ (`openclaw.json`) ใช้ได้เฉพาะ owner ปิดไว้โดยค่าเริ่มต้น; เปิดด้วย `commands.config: true`

ตัวอย่าง:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

หมายเหตุ:

- Config จะถูกตรวจสอบความถูกต้องก่อนเขียน; การเปลี่ยนแปลงที่ไม่ถูกต้องจะถูกปฏิเสธ
- การอัปเดตผ่าน `/config` จะคงอยู่หลังการรีสตาร์ต

## การอัปเดต MCP

`/mcp` เขียนคำจำกัดความ MCP server ที่ OpenClaw จัดการไว้ภายใต้ `mcp.servers` ใช้ได้เฉพาะ owner ปิดไว้โดยค่าเริ่มต้น; เปิดด้วย `commands.mcp: true`

ตัวอย่าง:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

หมายเหตุ:

- `/mcp` จัดเก็บ config ไว้ใน config ของ OpenClaw ไม่ใช่การตั้งค่าโปรเจกต์ที่ Pi เป็นเจ้าของ
- runtime adapters เป็นผู้ตัดสินว่า transport ใดบ้างที่สามารถรันได้จริง

## การอัปเดต Plugin

`/plugins` ช่วยให้ operator ตรวจสอบ Plugin ที่ค้นพบและสลับการเปิดใช้งานใน config ได้ โฟลว์แบบอ่านอย่างเดียวสามารถใช้ `/plugin` เป็น alias ได้ ปิดไว้โดยค่าเริ่มต้น; เปิดด้วย `commands.plugins: true`

ตัวอย่าง:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

หมายเหตุ:

- `/plugins list` และ `/plugins show` ใช้การค้นหา Plugin จริงกับ workspace ปัจจุบันและ config บนดิสก์
- `/plugins enable|disable` จะอัปเดตเฉพาะ config ของ Plugin; ไม่ได้ติดตั้งหรือถอนการติดตั้ง Plugin
- หลังเปลี่ยนการเปิด/ปิดใช้งาน ให้รีสตาร์ต gateway เพื่อให้มีผล

## หมายเหตุเฉพาะพื้นผิว

- **คำสั่งแบบข้อความ** ทำงานใน session แชตปกติ (DM ใช้ `main` ร่วมกัน ส่วนกลุ่มมี session ของตัวเอง)
- **คำสั่ง native** ใช้ session แบบแยก:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefix ปรับได้ผ่าน `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (มุ่งไปยัง chat session ผ่าน `CommandTargetSessionKey`)
- **`/stop`** มุ่งไปยัง chat session ที่กำลังทำงานอยู่เพื่อให้ยกเลิกการรันปัจจุบันได้
- **Slack:** `channels.slack.slashCommand` ยังคงรองรับสำหรับคำสั่งเดี่ยวแบบ `/openclaw` หากคุณเปิด `commands.native` คุณต้องสร้าง Slack slash command หนึ่งรายการต่อคำสั่ง built-in (ใช้ชื่อเดียวกับ `/help`) เมนูอาร์กิวเมนต์ของคำสั่งสำหรับ Slack จะถูกส่งเป็นปุ่ม Block Kit แบบ ephemeral
  - ข้อยกเว้นของคำสั่ง native บน Slack: ให้ลงทะเบียน `/agentstatus` (ไม่ใช่ `/status`) เพราะ Slack จอง `/status` ไว้ ข้อความ `/status` ยังใช้งานได้ในข้อความ Slack

## คำถามข้างเคียง BTW

`/btw` คือ **คำถามข้างเคียง** แบบรวดเร็วเกี่ยวกับ session ปัจจุบัน

ต่างจากแชตปกติ:

- มันใช้ session ปัจจุบันเป็นบริบทพื้นหลัง
- มันรันเป็นการเรียกแบบ one-shot **ที่ไม่มีเครื่องมือ**
- มันไม่เปลี่ยน context ของ session ในอนาคต
- มันไม่ถูกเขียนลงในประวัติ transcript
- มันถูกส่งเป็นผลลัพธ์ข้างเคียงแบบ live แทนที่จะเป็นข้อความ assistant ปกติ

สิ่งนี้ทำให้ `/btw` มีประโยชน์เมื่อคุณต้องการคำชี้แจงชั่วคราวในขณะที่งานหลัก
ยังดำเนินต่อไป

ตัวอย่าง:

```text
/btw what are we doing right now?
```

ดู [BTW Side Questions](/th/tools/btw) สำหรับพฤติกรรมเต็มรูปแบบและรายละเอียด UX
ของไคลเอนต์

## ที่เกี่ยวข้อง

- [Skills](/th/tools/skills)
- [การกำหนดค่า Skills](/th/tools/skills-config)
- [การสร้าง Skills](/th/tools/creating-skills)
