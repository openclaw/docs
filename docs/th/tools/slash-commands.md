---
read_when:
    - การใช้หรือการตั้งค่าคำสั่งแชต
    - การดีบักการกำหนดเส้นทางคำสั่งหรือสิทธิ์ใช้งาน
summary: 'คำสั่ง Slash: แบบข้อความเทียบกับแบบ native, การตั้งค่า และคำสั่งที่รองรับ'
title: คำสั่ง Slash
x-i18n:
    generated_at: "2026-04-23T10:24:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f6b454afa77cf02b2c307efcc99ef35d002cb560c427affaf03ac12b2b666e8
    source_path: tools/slash-commands.md
    workflow: 15
---

# คำสั่ง Slash

คำสั่งจะถูกจัดการโดย Gateway คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความ **แบบเดี่ยว** ที่ขึ้นต้นด้วย `/`
คำสั่ง bash แบบเฉพาะโฮสต์ใช้ `! <cmd>` (โดยมี `/bash <cmd>` เป็น alias)

มีสองระบบที่เกี่ยวข้องกัน:

- **Commands**: ข้อความ `/...` แบบเดี่ยว
- **Directives**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`
  - Directives จะถูกตัดออกจากข้อความก่อนที่โมเดลจะเห็น
  - ในข้อความแชตปกติ (ไม่ใช่ข้อความที่มีแต่ directive) จะถือเป็น “inline hints” และจะ **ไม่** คงการตั้งค่าไว้ในเซสชัน
  - ในข้อความที่มีแต่ directive (ข้อความมีเพียง directives เท่านั้น) จะคงค่าไว้ในเซสชันและตอบกลับด้วยข้อความยืนยัน
  - Directives จะถูกนำไปใช้เฉพาะกับ **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น หากมีการตั้งค่า `commands.allowFrom` ระบบจะใช้ allowlist นี้เพียงอย่างเดียว มิฉะนั้นการอนุญาตจะมาจาก allowlist/การจับคู่ของช่องทางร่วมกับ `commands.useAccessGroups` ผู้ส่งที่ไม่ได้รับอนุญาตจะเห็น directives ถูกปฏิบัติเสมือนข้อความธรรมดา

ยังมี **inline shortcuts** บางรายการด้วย (เฉพาะผู้ส่งที่อยู่ใน allowlist/ได้รับอนุญาต): `/help`, `/commands`, `/status`, `/whoami` (`/id`)
คำสั่งเหล่านี้จะทำงานทันที ถูกตัดออกก่อนที่โมเดลจะเห็น และข้อความที่เหลือจะดำเนินต่อผ่าน flow ปกติ

## การตั้งค่า

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

- `commands.text` (ค่าเริ่มต้น `true`) เปิดใช้การพาร์ส `/...` ในข้อความแชต
  - บนพื้นผิวที่ไม่มีคำสั่ง native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) คำสั่งแบบข้อความจะยังคงทำงานแม้ว่าคุณจะตั้งค่านี้เป็น `false`
- `commands.native` (ค่าเริ่มต้น `"auto"`) ลงทะเบียนคำสั่ง native
  - Auto: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (จนกว่าคุณจะเพิ่ม slash command); ไม่สนใจสำหรับ provider ที่ไม่รองรับ native
  - ตั้งค่า `channels.discord.commands.native`, `channels.telegram.commands.native` หรือ `channels.slack.commands.native` เพื่อ override ราย provider (bool หรือ `"auto"`)
  - `false` จะล้างคำสั่งที่เคยลงทะเบียนไว้ก่อนหน้าออกจาก Discord/Telegram ระหว่างเริ่มต้นระบบ ส่วนคำสั่ง Slack จัดการในแอป Slack และจะไม่ถูกลบออกโดยอัตโนมัติ
- `commands.nativeSkills` (ค่าเริ่มต้น `"auto"`) ลงทะเบียนคำสั่ง **Skills** แบบ native เมื่อรองรับ
  - Auto: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (Slack ต้องสร้าง slash command แยกต่อ Skill)
  - ตั้งค่า `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` หรือ `channels.slack.commands.nativeSkills` เพื่อ override ราย provider (bool หรือ `"auto"`)
- `commands.bash` (ค่าเริ่มต้น `false`) เปิดใช้ `! <cmd>` เพื่อรันคำสั่ง shell ของโฮสต์ (`/bash <cmd>` เป็น alias; ต้องใช้ allowlist ของ `tools.elevated`)
- `commands.bashForegroundMs` (ค่าเริ่มต้น `2000`) ควบคุมระยะเวลาที่ bash จะรอก่อนสลับไปเป็นโหมดพื้นหลัง (`0` จะย้ายไปพื้นหลังทันที)
- `commands.config` (ค่าเริ่มต้น `false`) เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`)
- `commands.mcp` (ค่าเริ่มต้น `false`) เปิดใช้ `/mcp` (อ่าน/เขียนคอนฟิก MCP ที่ OpenClaw จัดการไว้ภายใต้ `mcp.servers`)
- `commands.plugins` (ค่าเริ่มต้น `false`) เปิดใช้ `/plugins` (การค้นหา/สถานะของ Plugin พร้อมตัวควบคุม install + enable/disable)
- `commands.debug` (ค่าเริ่มต้น `false`) เปิดใช้ `/debug` (override เฉพาะรันไทม์)
- `commands.restart` (ค่าเริ่มต้น `true`) เปิดใช้ `/restart` พร้อม tool action สำหรับรีสตาร์ต gateway
- `commands.ownerAllowFrom` (ไม่บังคับ) กำหนด owner allowlist แบบ explicit สำหรับพื้นผิวคำสั่ง/เครื่องมือที่จำกัดเฉพาะ owner ซึ่งแยกจาก `commands.allowFrom`
- `channels.<channel>.commands.enforceOwnerForCommands` รายช่องทาง (ไม่บังคับ, ค่าเริ่มต้น `false`) ทำให้คำสั่งที่จำกัดเฉพาะ owner ต้องใช้ **identity ของ owner** บนพื้นผิวนั้น เมื่อเป็น `true` ผู้ส่งต้องตรงกับ candidate ของ owner ที่ resolve ได้ (เช่น รายการใน `commands.ownerAllowFrom` หรือ metadata owner แบบ native ของ provider) หรือถือ scope ภายใน `operator.admin` บนช่องทางข้อความภายใน รายการ wildcard ใน `allowFrom` ของช่องทาง หรือรายการ owner-candidate ที่ว่าง/resolve ไม่ได้ **ไม่เพียงพอ** — คำสั่งที่จำกัดเฉพาะ owner จะล้มเหลวแบบ fail-closed บนช่องทางนั้น ปล่อยค่าเป็นปิดไว้หากคุณต้องการให้คำสั่งแบบ owner-only ถูกควบคุมเพียงโดย `ownerAllowFrom` และ allowlist คำสั่งมาตรฐาน
- `commands.ownerDisplay` ควบคุมว่า owner id จะแสดงใน system prompt อย่างไร: `raw` หรือ `hash`
- `commands.ownerDisplaySecret` ใช้ตั้งค่า HMAC secret แบบไม่บังคับเมื่อ `commands.ownerDisplay="hash"`
- `commands.allowFrom` (ไม่บังคับ) กำหนด allowlist ราย provider สำหรับการอนุญาตคำสั่ง เมื่อตั้งค่าแล้ว จะกลายเป็นแหล่งการอนุญาตเพียงแหล่งเดียวสำหรับ commands และ directives (allowlist/การจับคู่ของช่องทางและ `commands.useAccessGroups` จะถูกละเว้น) ใช้ `"*"` สำหรับค่าเริ่มต้นแบบ global; คีย์เฉพาะ provider จะ override ค่านั้น
- `commands.useAccessGroups` (ค่าเริ่มต้น `true`) บังคับใช้ allowlist/นโยบายสำหรับคำสั่งเมื่อไม่ได้ตั้งค่า `commands.allowFrom`

## รายการคำสั่ง

แหล่งข้อมูลจริงปัจจุบัน:

- core built-in มาจาก `src/auto-reply/commands-registry.shared.ts`
- คำสั่ง dock ที่สร้างขึ้นมาจาก `src/auto-reply/commands-registry.data.ts`
- คำสั่ง Plugin มาจากการเรียก `registerCommand()` ของ Plugin
- ความพร้อมใช้งานจริงบน gateway ของคุณยังขึ้นอยู่กับแฟล็กในคอนฟิก พื้นผิวของช่องทาง และ Plugin ที่ติดตั้ง/เปิดใช้งาน

### คำสั่ง built-in ของ core

คำสั่ง built-in ที่มีในปัจจุบัน:

- `/new [model]` เริ่มเซสชันใหม่; `/reset` เป็น alias สำหรับรีเซ็ต
- `/reset soft [message]` คง transcript ปัจจุบันไว้, ลบ backend session id ของ CLI ที่ถูกใช้ซ้ำ และรันการโหลด startup/system-prompt ใหม่ในที่เดิม
- `/compact [instructions]` ทำ Compaction กับบริบทของเซสชัน ดู [/concepts/compaction](/th/concepts/compaction)
- `/stop` ยกเลิกการรันปัจจุบัน
- `/session idle <duration|off>` และ `/session max-age <duration|off>` ใช้จัดการอายุหมดของ thread binding
- `/think <level>` ตั้งค่าระดับการคิด ตัวเลือกขึ้นอยู่กับโปรไฟล์ provider ของโมเดลที่ใช้งาน ระดับที่พบบ่อยคือ `off`, `minimal`, `low`, `medium` และ `high` พร้อมระดับแบบกำหนดเอง เช่น `xhigh`, `adaptive`, `max` หรือแบบไบนารี `on` เฉพาะในกรณีที่รองรับ Alias: `/thinking`, `/t`
- `/verbose on|off|full` สลับเอาต์พุตแบบละเอียด Alias: `/v`
- `/trace on|off` สลับเอาต์พุต trace ของ Plugin สำหรับเซสชันปัจจุบัน
- `/fast [status|on|off]` แสดงหรือตั้งค่าโหมดเร็ว
- `/reasoning [on|off|stream]` สลับการมองเห็น reasoning Alias: `/reason`
- `/elevated [on|off|ask|full]` สลับโหมด elevated Alias: `/elev`
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` แสดงหรือตั้งค่าเริ่มต้นของ exec
- `/model [name|#|status]` แสดงหรือตั้งค่าโมเดล
- `/models [provider] [page] [limit=<n>|size=<n>|all]` แสดงรายการ provider หรือโมเดลของ provider หนึ่ง
- `/queue <mode>` จัดการพฤติกรรมของคิว (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) พร้อมตัวเลือก เช่น `debounce:2s cap:25 drop:summarize`
- `/help` แสดงสรุปช่วยเหลือแบบย่อ
- `/commands` แสดงแค็ตตาล็อกคำสั่งที่สร้างขึ้น
- `/tools [compact|verbose]` แสดงว่าเอเจนต์ปัจจุบันใช้อะไรได้บ้างในตอนนี้
- `/status` แสดงสถานะรันไทม์ รวมถึงการใช้งาน/quota ของ provider เมื่อมี
- `/tasks` แสดงรายการงานเบื้องหลังที่กำลังทำงาน/ล่าสุดสำหรับเซสชันปัจจุบัน
- `/context [list|detail|json]` อธิบายว่าบริบทถูกประกอบขึ้นอย่างไร
- `/export-session [path]` ส่งออกเซสชันปัจจุบันเป็น HTML Alias: `/export`
- `/export-trajectory [path]` ส่งออก [trajectory bundle](/th/tools/trajectory) แบบ JSONL สำหรับเซสชันปัจจุบัน Alias: `/trajectory`
- `/whoami` แสดง sender id ของคุณ Alias: `/id`
- `/skill <name> [input]` รัน Skill ตามชื่อ
- `/allowlist [list|add|remove] ...` จัดการรายการ allowlist ใช้ได้เฉพาะแบบข้อความเท่านั้น
- `/approve <id> <decision>` จัดการพรอมป์อนุมัติ exec
- `/btw <question>` ถามคำถามข้างเคียงโดยไม่เปลี่ยนบริบทของเซสชันในอนาคต ดู [/tools/btw](/th/tools/btw)
- `/subagents list|kill|log|info|send|steer|spawn` จัดการการรัน sub-agent สำหรับเซสชันปัจจุบัน
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` จัดการเซสชัน ACP และตัวเลือกรันไทม์
- `/focus <target>` ผูก Discord thread หรือหัวข้อ/บทสนทนา Telegram ปัจจุบันเข้ากับเป้าหมายเซสชัน
- `/unfocus` ลบการผูกปัจจุบัน
- `/agents` แสดงรายการเอเจนต์ที่ผูกกับเธรดสำหรับเซสชันปัจจุบัน
- `/kill <id|#|all>` ยกเลิก sub-agent หนึ่งตัวหรือทั้งหมดที่กำลังทำงาน
- `/steer <id|#> <message>` ส่งคำสั่ง steer ไปยัง sub-agent ที่กำลังทำงาน Alias: `/tell`
- `/config show|get|set|unset` อ่านหรือเขียน `openclaw.json` จำกัดเฉพาะ owner ต้องใช้ `commands.config: true`
- `/mcp show|get|set|unset` อ่านหรือเขียนคอนฟิก MCP server ที่ OpenClaw จัดการไว้ภายใต้ `mcp.servers` จำกัดเฉพาะ owner ต้องใช้ `commands.mcp: true`
- `/plugins list|inspect|show|get|install|enable|disable` ตรวจสอบหรือเปลี่ยนสถานะ Plugin `/plugin` เป็น alias จำกัดเฉพาะ owner สำหรับการเขียน ต้องใช้ `commands.plugins: true`
- `/debug show|set|unset|reset` จัดการ override คอนฟิกเฉพาะรันไทม์ จำกัดเฉพาะ owner ต้องใช้ `commands.debug: true`
- `/usage off|tokens|full|cost` ควบคุม footer การใช้งานต่อคำตอบ หรือพิมพ์สรุปต้นทุนในเครื่อง
- `/tts on|off|status|provider|limit|summary|audio|help` ควบคุม TTS ดู [/tools/tts](/th/tools/tts)
- `/restart` รีสตาร์ต OpenClaw เมื่อเปิดใช้งาน ค่าเริ่มต้น: เปิด; ตั้ง `commands.restart: false` เพื่อปิด
- `/activation mention|always` ตั้งค่าโหมดการเปิดใช้งานในกลุ่ม
- `/send on|off|inherit` ตั้งค่านโยบายการส่ง จำกัดเฉพาะ owner
- `/bash <command>` รันคำสั่ง shell ของโฮสต์ ใช้ได้เฉพาะแบบข้อความ Alias: `! <command>` ต้องใช้ `commands.bash: true` พร้อม allowlist ของ `tools.elevated`
- `!poll [sessionId]` ตรวจสอบงาน bash พื้นหลัง
- `!stop [sessionId]` หยุดงาน bash พื้นหลัง

### คำสั่ง dock ที่สร้างขึ้น

คำสั่ง dock จะถูกสร้างจาก channel Plugin ที่รองรับ native-command ชุด bundled ปัจจุบันคือ:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### คำสั่งจาก Plugin แบบ bundled

Plugin แบบ bundled สามารถเพิ่ม slash command ได้เพิ่มเติม คำสั่ง bundled ปัจจุบันในรีโปนี้คือ:

- `/dreaming [on|off|status|help]` สลับ Dreaming ของ memory ดู [Dreaming](/th/concepts/dreaming)
- `/pair [qr|status|pending|approve|cleanup|notify]` จัดการ flow การจับคู่/การตั้งค่าอุปกรณ์ ดู [การจับคู่](/th/channels/pairing)
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` เปิดใช้งานชั่วคราวสำหรับคำสั่ง node ของโทรศัพท์ที่มีความเสี่ยงสูง
- `/voice status|list [limit]|set <voiceId|name>` จัดการคอนฟิกเสียงของ Talk บน Discord ชื่อคำสั่ง native คือ `/talkvoice`
- `/card ...` ส่ง preset rich card ของ LINE ดู [LINE](/th/channels/line)
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` ตรวจสอบและควบคุม Codex app-server harness แบบ bundled ดู [Codex Harness](/th/plugins/codex-harness)
- คำสั่งเฉพาะ QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### คำสั่ง Skills แบบ dynamic

Skills ที่ผู้ใช้เรียกใช้ได้จะถูกเปิดเผยเป็น slash command ด้วย:

- `/skill <name> [input]` ใช้งานได้เสมอในฐานะจุดเข้าแบบ generic
- Skills อาจปรากฏเป็นคำสั่งตรง เช่น `/prose` เมื่อ Skill/Plugin ลงทะเบียนไว้
- การลงทะเบียนคำสั่ง Skills แบบ native ถูกควบคุมโดย `commands.nativeSkills` และ `channels.<provider>.commands.nativeSkills`

หมายเหตุ:

- คำสั่งรองรับ `:` แบบไม่บังคับระหว่างคำสั่งกับอาร์กิวเมนต์ (เช่น `/think: high`, `/send: on`, `/help:`)
- `/new <model>` รองรับ alias ของโมเดล, `provider/model` หรือชื่อ provider (fuzzy match); หากไม่พบรายการที่ตรงกัน ข้อความนั้นจะถูกถือเป็นเนื้อหาข้อความ
- หากต้องการดูรายละเอียดการใช้งานแยกตาม provider แบบครบถ้วน ให้ใช้ `openclaw status --usage`
- `/allowlist add|remove` ต้องใช้ `commands.config=true` และจะเคารพ `configWrites` ของช่องทาง
- ในช่องทางหลายบัญชี `/allowlist --account <id>` ที่มุ่งเป้าไปยังคอนฟิก และ `/config set channels.<provider>.accounts.<id>...` จะเคารพ `configWrites` ของบัญชีเป้าหมายด้วย
- `/usage` ควบคุม footer การใช้งานต่อคำตอบ; `/usage cost` จะพิมพ์สรุปต้นทุนในเครื่องจาก log เซสชันของ OpenClaw
- `/restart` เปิดใช้งานโดยค่าเริ่มต้น; ตั้ง `commands.restart: false` เพื่อปิดใช้งาน
- `/plugins install <spec>` รองรับ plugin spec แบบเดียวกับ `openclaw plugins install`: local path/archive, npm package หรือ `clawhub:<pkg>`
- `/plugins enable|disable` จะอัปเดตคอนฟิก Plugin และอาจแจ้งให้รีสตาร์ต
- คำสั่ง native เฉพาะ Discord: `/vc join|leave|status` ใช้ควบคุม voice channel (ต้องใช้ `channels.discord.voice` และ native commands; ไม่มีในรูปแบบข้อความ)
- คำสั่ง Discord thread-binding (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) ต้องให้ effective thread binding เปิดใช้งานอยู่ (`session.threadBindings.enabled` และ/หรือ `channels.discord.threadBindings.enabled`)
- เอกสารอ้างอิงคำสั่ง ACP และพฤติกรรมรันไทม์: [ACP Agents](/th/tools/acp-agents)
- `/verbose` มีไว้สำหรับการดีบักและการมองเห็นเพิ่มเติม; ในการใช้งานปกติควรปล่อยให้ **ปิด**
- `/trace` แคบกว่า `/verbose`: มันเปิดเผยเฉพาะบรรทัด trace/debug ที่ Plugin เป็นเจ้าของ และยังคงปิดข้อความเครื่องมือแบบ verbose ปกติไว้
- `/fast on|off` จะบันทึก override ระดับเซสชัน ใช้ตัวเลือก `inherit` ใน Sessions UI เพื่อล้างค่าและ fallback กลับไปใช้ค่าเริ่มต้นจากคอนฟิก
- `/fast` มีพฤติกรรมเฉพาะ provider: OpenAI/OpenAI Codex จะแมปไปยัง `service_tier=priority` บนปลายทาง Responses แบบ native ขณะที่คำขอ Anthropic สาธารณะแบบตรง รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย OAuth ที่ส่งไปยัง `api.anthropic.com` จะแมปไปยัง `service_tier=auto` หรือ `standard_only` ดู [OpenAI](/th/providers/openai) และ [Anthropic](/th/providers/anthropic)
- สรุปความล้มเหลวของเครื่องมือจะแสดงอยู่เมื่อเกี่ยวข้อง แต่ข้อความความล้มเหลวแบบละเอียดจะรวมมาด้วยเฉพาะเมื่อ `/verbose` เป็น `on` หรือ `full`
- `/reasoning`, `/verbose` และ `/trace` มีความเสี่ยงในบริบทกลุ่ม: อาจเปิดเผย reasoning ภายใน เอาต์พุตของเครื่องมือ หรือข้อมูลวินิจฉัยของ Plugin ที่คุณไม่ได้ตั้งใจให้เปิดเผย ควรปล่อยให้ปิดไว้ โดยเฉพาะในแชตกลุ่ม
- `/model` จะบันทึกโมเดลเซสชันใหม่ทันที
- หากเอเจนต์ว่างอยู่ การรันครั้งถัดไปจะใช้โมเดลนั้นทันที
- หากมีการรันที่กำลังทำงานอยู่แล้ว OpenClaw จะทำเครื่องหมายว่ามี live switch ที่รอดำเนินการ และจะรีสตาร์ตไปยังโมเดลใหม่เฉพาะเมื่อถึงจุด retry ที่สะอาด
- หากกิจกรรมเครื่องมือหรือเอาต์พุตคำตอบเริ่มไปแล้ว การสลับที่รอดำเนินการอาจค้างอยู่จนกว่าจะมีโอกาส retry ในภายหลัง หรือจนถึงเทิร์นถัดไปของผู้ใช้
- **Fast path:** ข้อความที่มีแต่คำสั่งจากผู้ส่งที่อยู่ใน allowlist จะถูกจัดการทันที (ข้ามคิว + โมเดล)
- **การบังคับ mention ในกลุ่ม:** ข้อความที่มีแต่คำสั่งจากผู้ส่งที่อยู่ใน allowlist จะข้ามข้อกำหนดเรื่อง mention
- **Inline shortcuts (เฉพาะผู้ส่งที่อยู่ใน allowlist):** บางคำสั่งยังทำงานได้เมื่อฝังอยู่ในข้อความปกติ และจะถูกตัดออกก่อนที่โมเดลจะเห็นข้อความที่เหลือ
  - ตัวอย่าง: `hey /status` จะกระตุ้นการตอบกลับสถานะ และข้อความที่เหลือจะดำเนินต่อผ่าน flow ปกติ
- ปัจจุบัน: `/help`, `/commands`, `/status`, `/whoami` (`/id`)
- ข้อความที่มีแต่คำสั่งจากผู้ที่ไม่ได้รับอนุญาตจะถูกเพิกเฉยแบบเงียบ ๆ และโทเค็น `/...` แบบ inline จะถูกปฏิบัติเสมือนข้อความธรรมดา
- **คำสั่ง Skills:** Skills แบบ `user-invocable` จะถูกเปิดเผยเป็น slash command ชื่อจะถูก sanitize เป็น `a-z0-9_` (สูงสุด 32 ตัวอักษร); หากชนกันจะเติม suffix เป็นตัวเลข (เช่น `_2`)
  - `/skill <name> [input]` ใช้รัน Skill ตามชื่อ (มีประโยชน์เมื่อข้อจำกัดของคำสั่ง native ทำให้ไม่สามารถมีคำสั่งต่อ Skill ได้)
  - โดยค่าเริ่มต้น คำสั่ง Skill จะถูกส่งต่อไปยังโมเดลเป็นคำขอปกติ
  - Skill สามารถประกาศ `command-dispatch: tool` แบบไม่บังคับ เพื่อกำหนดเส้นทางคำสั่งตรงไปยังเครื่องมือได้ (กำหนดแน่นอน, ไม่ผ่านโมเดล)
  - ตัวอย่าง: `/prose` (Plugin OpenProse) — ดู [OpenProse](/th/prose)
- **อาร์กิวเมนต์ของคำสั่ง native:** Discord ใช้ autocomplete สำหรับตัวเลือกแบบ dynamic (และใช้เมนูปุ่มเมื่อคุณไม่ใส่อาร์กิวเมนต์ที่จำเป็น) Telegram และ Slack จะแสดงเมนูปุ่มเมื่อคำสั่งรองรับตัวเลือกและคุณละอาร์กิวเมนต์นั้นไว้

## `/tools`

`/tools` ตอบคำถามในระดับรันไทม์ ไม่ใช่คำถามระดับคอนฟิก: **เอเจนต์นี้ใช้อะไรได้บ้างในตอนนี้
ในบทสนทนานี้**

- ค่าเริ่มต้นของ `/tools` เป็นแบบย่อและเหมาะสำหรับการสแกนอย่างรวดเร็ว
- `/tools verbose` จะเพิ่มคำอธิบายสั้น ๆ
- พื้นผิวคำสั่ง native ที่รองรับอาร์กิวเมนต์จะเปิดเผยสวิตช์โหมดเดียวกันในรูปแบบ `compact|verbose`
- ผลลัพธ์มีขอบเขตระดับเซสชัน ดังนั้นการเปลี่ยนเอเจนต์ ช่องทาง เธรด การอนุญาตผู้ส่ง หรือโมเดล สามารถ
  เปลี่ยนเอาต์พุตได้
- `/tools` รวมเครื่องมือที่เข้าถึงได้จริงในรันไทม์ รวมถึงเครื่องมือ core เครื่องมือจาก Plugin ที่เชื่อมต่ออยู่ และเครื่องมือที่เป็นเจ้าของโดยช่องทาง

สำหรับการแก้ไขโปรไฟล์และ override ให้ใช้แผง Tools ใน Control UI หรือพื้นผิวคอนฟิก/แค็ตตาล็อก แทนที่จะ
มอง `/tools` เป็นแค็ตตาล็อกแบบคงที่

## พื้นผิวการใช้งาน (อะไรแสดงที่ไหน)

- **การใช้งาน/quota ของ provider** (ตัวอย่างเช่น “Claude เหลือ 80%”) จะแสดงใน `/status` สำหรับ provider ของโมเดลปัจจุบัน เมื่อเปิดใช้งานการติดตามการใช้งาน OpenClaw จะ normalize ช่วงเวลาของ provider ให้เป็น `% ที่เหลือ`; สำหรับ MiniMax ฟิลด์เปอร์เซ็นต์ที่รายงานเฉพาะส่วนที่เหลือจะถูกกลับค่าก่อนแสดงผล และการตอบกลับ `model_remains` จะเลือก entry ของ chat-model พร้อม label ของแผนที่มีแท็กโมเดลก่อน
- **บรรทัด token/cache** ใน `/status` สามารถ fallback ไปใช้ entry การใช้งานล่าสุดใน transcript ได้ หาก snapshot ของเซสชันแบบ live มีข้อมูลน้อย ค่า live ที่ไม่เป็นศูนย์ที่มีอยู่เดิมยังคงมีความสำคัญสูงกว่า และ transcript fallback ยังสามารถกู้คืน label ของโมเดลรันไทม์ที่กำลังใช้งานอยู่พร้อม total แบบเน้น prompt ที่มากกว่าได้ เมื่อ total ที่เก็บไว้ไม่มีหรือมีขนาดเล็กกว่า
- **token/ต้นทุนต่อคำตอบ** ถูกควบคุมโดย `/usage off|tokens|full` (จะถูกต่อท้ายคำตอบปกติ)
- `/model status` เกี่ยวกับ **models/auth/endpoints** ไม่ใช่การใช้งาน

## การเลือกโมเดล (`/model`)

`/model` ถูกใช้งานในฐานะ directive

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

- `/model` และ `/model list` จะแสดงตัวเลือกแบบกะทัดรัดที่มีหมายเลขกำกับ (ตระกูลโมเดล + provider ที่ใช้งานได้)
- บน Discord, `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบพร้อม dropdown ของ provider และโมเดล รวมถึงขั้นตอน Submit
- `/model <#>` จะเลือกจากตัวเลือกนั้น (และจะพยายามใช้ provider ปัจจุบันเมื่อทำได้)
- `/model status` จะแสดงมุมมองแบบละเอียด รวมถึงปลายทาง provider (`baseUrl`) และโหมด API (`api`) ที่ตั้งค่าไว้เมื่อมี

## Debug overrides

`/debug` ให้คุณตั้งค่า override คอนฟิก **เฉพาะรันไทม์** (อยู่ในหน่วยความจำ ไม่เขียนลงดิสก์) จำกัดเฉพาะ owner ปิดไว้โดยค่าเริ่มต้น; เปิดใช้งานด้วย `commands.debug: true`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

หมายเหตุ:

- override จะมีผลทันทีต่อการอ่านคอนฟิกครั้งใหม่ แต่จะ **ไม่** เขียนลง `openclaw.json`
- ใช้ `/debug reset` เพื่อล้าง override ทั้งหมดและกลับไปใช้คอนฟิกบนดิสก์

## เอาต์พุต trace ของ Plugin

`/trace` ให้คุณสลับ **บรรทัด trace/debug ของ Plugin ที่มีขอบเขตระดับเซสชัน** โดยไม่ต้องเปิด verbose mode เต็มรูปแบบ

ตัวอย่าง:

```text
/trace
/trace on
/trace off
```

หมายเหตุ:

- `/trace` โดยไม่มีอาร์กิวเมนต์จะแสดงสถานะ trace ปัจจุบันของเซสชัน
- `/trace on` จะเปิดใช้บรรทัด trace ของ Plugin สำหรับเซสชันปัจจุบัน
- `/trace off` จะปิดอีกครั้ง
- บรรทัด trace ของ Plugin อาจปรากฏใน `/status` และเป็นข้อความวินิจฉัยติดตามหลังคำตอบปกติของผู้ช่วย
- `/trace` ไม่ได้มาแทน `/debug`; `/debug` ยังคงใช้จัดการ override คอนฟิกเฉพาะรันไทม์
- `/trace` ไม่ได้มาแทน `/verbose`; เอาต์พุตเครื่องมือ/สถานะแบบ verbose ตามปกติยังคงเป็นหน้าที่ของ `/verbose`

## การอัปเดตคอนฟิก

`/config` จะเขียนลงคอนฟิกบนดิสก์ของคุณ (`openclaw.json`) จำกัดเฉพาะ owner ปิดไว้โดยค่าเริ่มต้น; เปิดใช้งานด้วย `commands.config: true`

ตัวอย่าง:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

หมายเหตุ:

- คอนฟิกจะถูกตรวจสอบความถูกต้องก่อนเขียน; การเปลี่ยนแปลงที่ไม่ถูกต้องจะถูกปฏิเสธ
- การอัปเดตผ่าน `/config` จะคงอยู่ข้ามการรีสตาร์ต

## การอัปเดต MCP

`/mcp` จะเขียนนิยาม MCP server ที่ OpenClaw จัดการไว้ภายใต้ `mcp.servers` จำกัดเฉพาะ owner ปิดไว้โดยค่าเริ่มต้น; เปิดใช้งานด้วย `commands.mcp: true`

ตัวอย่าง:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

หมายเหตุ:

- `/mcp` จะเก็บคอนฟิกไว้ในคอนฟิกของ OpenClaw ไม่ใช่การตั้งค่าโปรเจ็กต์ที่ Pi เป็นเจ้าของ
- adapter ของรันไทม์จะเป็นตัวตัดสินว่า transport ใดสามารถรันได้จริง

## การอัปเดต Plugin

`/plugins` ให้ผู้ปฏิบัติงานตรวจสอบ Plugin ที่ค้นพบและสลับสถานะการเปิดใช้งานในคอนฟิก flow แบบอ่านอย่างเดียวสามารถใช้ `/plugin` เป็น alias ได้ ปิดไว้โดยค่าเริ่มต้น; เปิดใช้งานด้วย `commands.plugins: true`

ตัวอย่าง:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

หมายเหตุ:

- `/plugins list` และ `/plugins show` ใช้การค้นหา Plugin จริงกับ workspace ปัจจุบันร่วมกับคอนฟิกบนดิสก์
- `/plugins enable|disable` จะอัปเดตเฉพาะคอนฟิก Plugin; ไม่ได้ติดตั้งหรือลบ Plugin
- หลังการเปลี่ยนแปลง enable/disable ให้รีสตาร์ต gateway เพื่อนำไปใช้

## หมายเหตุของพื้นผิว

- **คำสั่งแบบข้อความ** จะทำงานในเซสชันแชตปกติ (DM ใช้ `main` ร่วมกัน, กลุ่มมีเซสชันของตัวเอง)
- **คำสั่ง native** ใช้เซสชันแบบ isolated:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (คำนำหน้าปรับได้ผ่าน `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (มุ่งเป้าไปยังเซสชันแชตผ่าน `CommandTargetSessionKey`)
- **`/stop`** จะมุ่งเป้าไปยังเซสชันแชตที่กำลังทำงานอยู่ เพื่อยกเลิกการรันปัจจุบัน
- **Slack:** `channels.slack.slashCommand` ยังคงรองรับสำหรับคำสั่งเดี่ยวสไตล์ `/openclaw` หากคุณเปิด `commands.native` คุณต้องสร้าง Slack slash command แยกหนึ่งคำสั่งต่อหนึ่งคำสั่ง built-in (ใช้ชื่อเดียวกับ `/help`) เมนูอาร์กิวเมนต์ของคำสั่งสำหรับ Slack จะถูกส่งเป็นปุ่ม Block Kit แบบ ephemeral
  - ข้อยกเว้นของคำสั่ง native บน Slack: ให้ลงทะเบียน `/agentstatus` (ไม่ใช่ `/status`) เพราะ Slack สงวน `/status` ไว้ ข้อความ `/status` แบบข้อความยังคงทำงานในข้อความ Slack

## คำถามข้างเคียง BTW

`/btw` คือ **คำถามข้างเคียง** แบบรวดเร็วเกี่ยวกับเซสชันปัจจุบัน

ต่างจากแชตปกติ:

- มันใช้เซสชันปัจจุบันเป็นบริบทพื้นหลัง
- มันทำงานเป็นการเรียกแบบครั้งเดียว **ที่ไม่มีเครื่องมือ**
- มันไม่เปลี่ยนบริบทของเซสชันในอนาคต
- มันไม่ถูกเขียนลงประวัติ transcript
- มันถูกส่งมอบเป็นผลลัพธ์ข้างเคียงแบบ live แทนที่จะเป็นข้อความผู้ช่วยปกติ

สิ่งนี้ทำให้ `/btw` มีประโยชน์เมื่อคุณต้องการคำชี้แจงชั่วคราว ในขณะที่งานหลัก
ยังคงดำเนินต่อไป

ตัวอย่าง:

```text
/btw ตอนนี้เรากำลังทำอะไรอยู่?
```

ดู [คำถามข้างเคียง BTW](/th/tools/btw) สำหรับพฤติกรรมทั้งหมดและรายละเอียด
UX ของไคลเอนต์
