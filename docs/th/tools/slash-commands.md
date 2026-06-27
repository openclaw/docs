---
read_when:
    - การใช้หรือกำหนดค่าคำสั่งแชท
    - การดีบักการกำหนดเส้นทางคำสั่งหรือสิทธิ์
    - ทำความเข้าใจวิธีลงทะเบียนคำสั่ง Skills
sidebarTitle: Slash commands
summary: คำสั่ง slash, directive และทางลัดแบบ inline ทั้งหมดที่มีให้ใช้ — การกำหนดค่า การกำหนดเส้นทาง และพฤติกรรมแยกตามพื้นผิวแต่ละส่วน
title: คำสั่งแบบสแลช
x-i18n:
    generated_at: "2026-06-27T18:31:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5f53a5209d1c99c593d646b4ecc12e7074f72766cf3d1278c4d13511369d29bc
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway จัดการคำสั่งที่ส่งเป็นข้อความเดี่ยวซึ่งขึ้นต้นด้วย `/`
คำสั่ง bash เฉพาะโฮสต์ใช้ `! <cmd>` (โดยมี `/bash <cmd>` เป็นนามแฝง)

เมื่อการสนทนาผูกกับเซสชัน ACP ข้อความปกติจะถูกส่งไปยังฮาร์เนส ACP
คำสั่งจัดการ Gateway ยังคงเป็นแบบโลคัล: `/acp ...` จะไปถึงตัวจัดการคำสั่งของ OpenClaw เสมอ และ `/status` รวมถึง `/unfocus` จะยังเป็นโลคัลเมื่อเปิดใช้งานการจัดการคำสั่งสำหรับพื้นผิวนั้น

## คำสั่งสามประเภท

<CardGroup cols={3}>
  <Card title="คำสั่ง" icon="terminal">
    ข้อความ `/...` แบบเดี่ยวที่ Gateway จัดการ ต้องส่งเป็นเนื้อหาเพียงอย่างเดียวในข้อความ
  </Card>
  <Card title="Directive" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — ถูกตัดออกจากข้อความก่อนที่โมเดลจะเห็น คงค่าการตั้งค่าเซสชันเมื่อส่งแบบเดี่ยว ทำหน้าที่เป็นคำใบ้แบบอินไลน์เมื่อส่งพร้อมข้อความอื่น
  </Card>
  <Card title="ทางลัดอินไลน์" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — ทำงานทันทีและถูกตัดออกก่อนที่โมเดลจะเห็นข้อความที่เหลือ เฉพาะผู้ส่งที่ได้รับอนุญาตเท่านั้น
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="รายละเอียดพฤติกรรมของ Directive">
    - Directive จะถูกตัดออกจากข้อความก่อนที่โมเดลจะเห็น
    - ในข้อความแบบ **มีเฉพาะ directive** (ข้อความมีแต่ directive เท่านั้น) ค่าเหล่านี้จะคงอยู่กับเซสชันและตอบกลับด้วยการยืนยัน
    - ในข้อความ **แชตปกติ** ที่มีข้อความอื่นร่วมด้วย ค่าเหล่านี้จะทำหน้าที่เป็นคำใบ้แบบอินไลน์และจะ **ไม่** คงค่าการตั้งค่าเซสชัน
    - Directive ใช้ได้เฉพาะกับ **ผู้ส่งที่ได้รับอนุญาต** หากตั้งค่า `commands.allowFrom` ไว้ ค่านี้จะเป็น allowlist เดียวที่ใช้ มิฉะนั้นการอนุญาตจะมาจาก allowlist/การจับคู่ของช่องทางร่วมกับ `commands.useAccessGroups` ผู้ส่งที่ไม่ได้รับอนุญาตจะเห็นว่า directive ถูกปฏิบัติเป็นข้อความธรรมดา

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
  เปิดใช้การแยกวิเคราะห์ `/...` ในข้อความแชต บนพื้นผิวที่ไม่มีคำสั่งเนทีฟ
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) คำสั่งแบบข้อความจะทำงานแม้ตั้งค่าเป็น `false`
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่งเนทีฟ Auto: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack;
  ถูกละเว้นสำหรับผู้ให้บริการที่ไม่รองรับแบบเนทีฟ เขียนทับเป็นรายช่องทางได้ด้วย
  `channels.<provider>.commands.native` บน Discord ค่า `false` จะข้ามการลงทะเบียนคำสั่งแบบสแลช คำสั่งที่ลงทะเบียนไว้ก่อนหน้าอาจยังมองเห็นได้จนกว่าจะถูกลบ
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่ง Skills แบบเนทีฟเมื่อรองรับ Auto: เปิดสำหรับ
  Discord/Telegram; ปิดสำหรับ Slack เขียนทับได้ด้วย
  `channels.<provider>.commands.nativeSkills`
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  เปิดใช้ `! <cmd>` เพื่อรันคำสั่งเชลล์บนโฮสต์ (นามแฝง `/bash <cmd>`) ต้องมี
  allowlist ของ `tools.elevated`
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  ระยะเวลาที่ bash รอก่อนสลับเป็นโหมดพื้นหลัง (`0` จะส่งไปพื้นหลังทันที)
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`) เฉพาะเจ้าของเท่านั้น
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  เปิดใช้ `/mcp` (อ่าน/เขียนการกำหนดค่า MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`) เฉพาะเจ้าของเท่านั้น
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  เปิดใช้ `/plugins` (การค้นพบ/สถานะ Plugin รวมถึงติดตั้ง + เปิดใช้/ปิดใช้) เฉพาะเจ้าของสำหรับการเขียน
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  เปิดใช้ `/debug` (การเขียนทับการกำหนดค่าเฉพาะรันไทม์) เฉพาะเจ้าของเท่านั้น
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  เปิดใช้ `/restart` และการกระทำของเครื่องมือเพื่อรีสตาร์ต Gateway
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  allowlist เจ้าของแบบชัดเจนสำหรับพื้นผิวคำสั่งเฉพาะเจ้าของ แยกจาก
  `commands.allowFrom` และการเข้าถึงผ่านการจับคู่ DM
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  ต่อช่องทาง: ต้องใช้ตัวตนเจ้าของสำหรับคำสั่งเฉพาะเจ้าของ เมื่อเป็น `true`
  ผู้ส่งต้องตรงกับ `commands.ownerAllowFrom` หรือมีขอบเขตภายใน `operator.admin`
  รายการ wildcard ใน `allowFrom` **ไม่** เพียงพอ
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  ควบคุมว่า id ของเจ้าของจะปรากฏในพรอมป์ระบบอย่างไร
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  ความลับ HMAC ที่ใช้เมื่อ `commands.ownerDisplay: "hash"`
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  allowlist ต่อผู้ให้บริการสำหรับการอนุญาตคำสั่ง เมื่อตั้งค่าไว้ ค่านี้จะเป็น
  แหล่งการอนุญาต **เพียงแหล่งเดียว** สำหรับคำสั่งและ directive ใช้ `"*"` สำหรับค่าเริ่มต้นส่วนกลาง คีย์เฉพาะผู้ให้บริการจะเขียนทับค่านั้น
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  บังคับใช้ allowlist/นโยบายสำหรับคำสั่งเมื่อไม่ได้ตั้งค่า `commands.allowFrom`
</ParamField>

## รายการคำสั่ง

คำสั่งมาจากสามแหล่ง:

- **คำสั่งในตัวของ Core:** `src/auto-reply/commands-registry.shared.ts`
- **คำสั่ง dock ที่สร้างขึ้น:** `src/auto-reply/commands-registry.data.ts`
- **คำสั่ง Plugin:** การเรียก `registerCommand()` ของ Plugin

ความพร้อมใช้งานขึ้นอยู่กับแฟล็กการกำหนดค่า พื้นผิวช่องทาง และ Plugin ที่ติดตั้ง/เปิดใช้งาน

### คำสั่ง Core

<AccordionGroup>
  <Accordion title="เซสชันและการรัน">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/new [model]` | เก็บถาวรเซสชันปัจจุบันและเริ่มเซสชันใหม่ |
    | `/reset [soft [message]]` | รีเซ็ตเซสชันปัจจุบันที่เดิม `soft` จะเก็บทรานสคริปต์ไว้ ทิ้ง id เซสชันแบ็กเอนด์ CLI ที่ใช้ซ้ำ และรันการเริ่มต้นอีกครั้ง |
    | `/name <title>` | ตั้งชื่อหรือเปลี่ยนชื่อเซสชันปัจจุบัน ละเว้นชื่อเพื่อดูชื่อปัจจุบันและคำแนะนำ |
    | `/compact [instructions]` | Compact บริบทของเซสชัน ดู [Compaction](/th/concepts/compaction) |
    | `/stop` | ยกเลิกการรันปัจจุบัน |
    | `/session idle <duration\|off>` | จัดการการหมดอายุเมื่อว่างของการผูกเธรด |
    | `/session max-age <duration\|off>` | จัดการการหมดอายุสูงสุดของการผูกเธรด |
    | `/export-session [path]` | ส่งออกเซสชันปัจจุบันเป็น HTML นามแฝง: `/export` |
    | `/export-trajectory [path]` | ส่งออกบันเดิล trajectory แบบ JSONL สำหรับเซสชันปัจจุบัน นามแฝง: `/trajectory` |

    <Note>
      Control UI จะดักจับ `/new` ที่พิมพ์เข้ามาเพื่อสร้างและสลับไปยังเซสชันแดชบอร์ดใหม่ ยกเว้นเมื่อกำหนดค่า `session.dmScope: "main"` และพาเรนต์ปัจจุบันคือเซสชันหลักของเอเจนต์ — ในกรณีนั้น `/new` จะรีเซ็ตเซสชันหลักที่เดิม ส่วน `/reset` ที่พิมพ์เข้ามายังคงรันการรีเซ็ตที่เดิมของ Gateway ใช้ `/model default` เมื่อต้องการล้างการเลือกโมเดลเซสชันที่ปักไว้
    </Note>

  </Accordion>

  <Accordion title="ตัวควบคุมโมเดลและการรัน">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/think <level\|default>` | ตั้งระดับการคิดหรือล้างการเขียนทับของเซสชัน นามแฝง: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | สลับเอาต์พุตแบบละเอียด นามแฝง: `/v` |
    | `/trace on\|off` | สลับเอาต์พุต trace ของ Plugin สำหรับเซสชันปัจจุบัน |
    | `/fast [status\|auto\|on\|off\|default]` | แสดง ตั้งค่า หรือล้างโหมดเร็ว |
    | `/reasoning [on\|off\|stream]` | สลับการมองเห็น reasoning นามแฝง: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | สลับโหมด elevated นามแฝง: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | แสดงหรือตั้งค่าเริ่มต้น exec |
    | `/model [name\|#\|status]` | แสดงหรือตั้งค่าโมเดล |
    | `/models [provider] [page] [limit=<n>\|all]` | แสดงรายการผู้ให้บริการหรือโมเดลที่กำหนดค่า/มีการยืนยันตัวตนพร้อมใช้งาน |
    | `/queue <mode>` | จัดการพฤติกรรมคิวของการรันที่ใช้งานอยู่ ดู [Queue](/th/concepts/queue) และ [Queue steering](/th/concepts/queue-steering) |
    | `/steer <message>` | ใส่คำแนะนำเข้าไปในการรันที่ใช้งานอยู่ นามแฝง: `/tell` ดู [Steer](/th/tools/steer) |

    <AccordionGroup>
      <Accordion title="ความปลอดภัยของ verbose / trace / fast / reasoning">
        - `/verbose` ใช้สำหรับการดีบัก — ให้ **ปิด** ไว้ในการใช้งานปกติ
        - `/trace` เปิดเผยเฉพาะบรรทัด trace/debug ที่ Plugin เป็นเจ้าของ ข้อความ verbose ปกติยังคงปิดอยู่
        - `/fast auto|on|off` คงค่าการเขียนทับของเซสชันไว้ ใช้ตัวเลือก `inherit` ใน UI เซสชันเพื่อล้างค่านี้
        - `/fast` เฉพาะเจาะจงตามผู้ให้บริการ: OpenAI/Codex แมปเป็น `service_tier=priority`; คำขอ Anthropic โดยตรงแมปเป็น `service_tier=auto` หรือ `standard_only`
        - `/reasoning`, `/verbose` และ `/trace` มีความเสี่ยงในการตั้งค่ากลุ่ม — อาจเปิดเผย reasoning ภายในหรือข้อมูลวินิจฉัยของ Plugin ให้ปิดไว้ในแชตกลุ่ม

      </Accordion>
      <Accordion title="รายละเอียดการสลับโมเดล">
        - `/model` คงค่าโมเดลใหม่ไว้กับเซสชันทันที
        - หากเอเจนต์ว่างอยู่ การรันถัดไปจะใช้โมเดลนั้นทันที
        - หากมีการรันที่ใช้งานอยู่ การสลับจะถูกทำเครื่องหมายว่ารอดำเนินการและนำไปใช้ที่จุด retry ที่สะอาดถัดไป

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="การค้นพบและสถานะ">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/help` | แสดงสรุปความช่วยเหลือแบบสั้น |
    | `/commands` | แสดงแค็ตตาล็อกคำสั่งที่สร้างขึ้น |
    | `/tools [compact\|verbose]` | แสดงสิ่งที่เอเจนต์ปัจจุบันใช้ได้ในตอนนี้ |
    | `/status` | แสดงสถานะการดำเนินการ/รันไทม์ เวลาใช้งานของ Gateway และระบบ สุขภาพของ Plugin รวมถึงการใช้งาน/โควตาของผู้ให้บริการ |
    | `/status plugins` | แสดงสุขภาพของ Plugin อย่างละเอียด: ข้อผิดพลาดการโหลด การกักกัน ความล้มเหลวของช่องทาง ปัญหาการพึ่งพา ประกาศความเข้ากันได้ |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | จัดการ [goal](/th/tools/goal) ที่คงทนของเซสชันปัจจุบัน |
    | `/diagnostics [note]` | โฟลว์รายงานสนับสนุนเฉพาะเจ้าของ ขออนุมัติ exec ทุกครั้ง |
    | `/crestodian <request>` | รันตัวช่วยตั้งค่าและซ่อมแซม Crestodian จาก DM ของเจ้าของ |
    | `/tasks` | แสดงรายการงานพื้นหลังที่ใช้งานอยู่/ล่าสุดสำหรับเซสชันปัจจุบัน |
    | `/context [list\|detail\|map\|json]` | อธิบายว่าบริบทประกอบขึ้นอย่างไร |
    | `/whoami` | แสดง id ผู้ส่งของคุณ นามแฝง: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | ควบคุมส่วนท้ายการใช้งานต่อการตอบกลับ (`reset`/`inherit`/`clear`/`default` จะล้างการเขียนทับของเซสชันเพื่อกลับไปสืบทอดค่าเริ่มต้นที่กำหนดค่าไว้) หรือพิมพ์สรุปค่าใช้จ่ายแบบโลคัล |
  </Accordion>

  <Accordion title="Skills, allowlist, การอนุมัติ">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/skill <name> [input]` | รัน Skill ตามชื่อ |
    | `/allowlist [list\|add\|remove] ...` | จัดการรายการ allowlist แบบข้อความเท่านั้น |
    | `/approve <id> <decision>` | แก้พรอมป์อนุมัติ exec หรือ Plugin |
    | `/btw <question>` | ถามคำถามเสริมโดยไม่เปลี่ยนบริบทเซสชัน นามแฝง: `/side` ดู [BTW](/th/tools/btw) |
  </Accordion>

  <Accordion title="Subagents and ACP">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/subagents list\|log\|info` | ตรวจสอบการรัน sub-agent สำหรับเซสชันปัจจุบัน |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | จัดการเซสชัน ACP และตัวเลือกรันไทม์ |
    | `/focus <target>` | ผูกเธรด Discord หรือหัวข้อ Telegram ปัจจุบันกับเป้าหมายเซสชัน |
    | `/unfocus` | ลบการผูกเธรดปัจจุบัน |
    | `/agents` | แสดงรายการเอเจนต์ที่ผูกกับเธรดสำหรับเซสชันปัจจุบัน |
  </Accordion>

  <Accordion title="Owner-only writes and admin">
    | คำสั่ง | ต้องมี | คำอธิบาย |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | อ่านหรือเขียน `openclaw.json` เฉพาะเจ้าของ |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | อ่านหรือเขียนการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการ เฉพาะเจ้าของ |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | ตรวจสอบหรือเปลี่ยนสถานะ Plugin เฉพาะการเขียนสำหรับเจ้าของ นามแฝง: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | การแทนที่การกำหนดค่าเฉพาะรันไทม์ เฉพาะเจ้าของ |
    | `/restart` | `commands.restart: true` (ค่าเริ่มต้น) | รีสตาร์ต OpenClaw |
    | `/send on\|off\|inherit` | เจ้าของ | ตั้งค่านโยบายการส่ง |
  </Accordion>

  <Accordion title="Voice, TTS, channel control">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | ควบคุม TTS ดู [TTS](/th/tools/tts) |
    | `/activation mention\|always` | ตั้งค่าโหมดการเปิดใช้งานกลุ่ม |
    | `/bash <command>` | รันคำสั่งเชลล์บนโฮสต์ นามแฝง: `! <command>` ต้องมี `commands.bash: true` |
    | `!poll [sessionId]` | ตรวจสอบงาน bash เบื้องหลัง |
    | `!stop [sessionId]` | หยุดงาน bash เบื้องหลัง |
  </Accordion>
</AccordionGroup>

### คำสั่ง Dock

คำสั่ง Dock เปลี่ยนเส้นทางการตอบกลับของเซสชันที่ใช้งานอยู่ไปยังช่องทางอื่นที่ลิงก์ไว้
ดู [การ Dock ช่องทาง](/th/concepts/channel-docking) สำหรับการตั้งค่าและการแก้ปัญหา

สร้างจาก Plugin ช่องทางที่รองรับ native-command:

- `/dock-discord` (นามแฝง: `/dock_discord`)
- `/dock-mattermost` (นามแฝง: `/dock_mattermost`)
- `/dock-slack` (นามแฝง: `/dock_slack`)
- `/dock-telegram` (นามแฝง: `/dock_telegram`)

คำสั่ง Dock ต้องมี `session.identityLinks` ผู้ส่งต้นทางและ peer เป้าหมาย
ต้องอยู่ในกลุ่มข้อมูลประจำตัวเดียวกัน

### คำสั่ง Plugin ที่มาพร้อมระบบ

| คำสั่ง                                                                                      | คำอธิบาย                                                                       |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | เปิดหรือปิด memory dreaming ดู [Dreaming](/th/concepts/dreaming)                        |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | จัดการการจับคู่อุปกรณ์ ดู [การจับคู่](/th/channels/pairing)                           |
| `/phone status\|arm ...\|disarm`                                                             | เตรียมใช้งานคำสั่ง phone node ที่มีความเสี่ยงสูงชั่วคราว                                     |
| `/voice status\|list\|set <voiceId>`                                                         | จัดการการกำหนดค่าเสียง Talk ชื่อเนทีฟของ Discord: `/talkvoice`                       |
| `/card ...`                                                                                  | ส่งพรีเซ็ต rich card ของ LINE ดู [LINE](/th/channels/line)                           |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | ควบคุมฮาร์เนส app-server ของ Codex ดู [ฮาร์เนส Codex](/th/plugins/codex-harness) |

เฉพาะ QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### คำสั่ง Skills

Skills ที่ผู้ใช้เรียกใช้ได้จะแสดงเป็นคำสั่ง slash:

- `/skill <name> [input]` ใช้งานได้เสมอในฐานะ entrypoint ทั่วไป
- Skills อาจลงทะเบียนเป็นคำสั่งโดยตรง (เช่น `/prose` สำหรับ OpenProse)
- การลงทะเบียน native skill-command ถูกควบคุมโดย `commands.nativeSkills` และ
  `channels.<provider>.commands.nativeSkills`
- ชื่อจะถูก sanitize เป็น `a-z0-9_` (สูงสุด 32 อักขระ); รายการที่ชนกันจะได้ suffix เป็นตัวเลข

<AccordionGroup>
  <Accordion title="Skill command dispatch">
    ตามค่าเริ่มต้น คำสั่ง skill จะถูกส่งไปยังโมเดลในฐานะคำขอปกติ

    Skills สามารถประกาศ `command-dispatch: tool` เพื่อส่งตรงไปยังเครื่องมือ
    (กำหนดแน่นอน ไม่มีโมเดลเกี่ยวข้อง) ตัวอย่าง: `/prose` (Plugin OpenProse)
    — ดู [OpenProse](/th/prose)

  </Accordion>
  <Accordion title="Native command arguments">
    Discord ใช้ autocomplete สำหรับตัวเลือกแบบไดนามิกและเมนูปุ่มเมื่อไม่ได้ระบุ
    อาร์กิวเมนต์ที่จำเป็น Telegram และ Slack แสดงเมนูปุ่มสำหรับคำสั่งที่มี
    ตัวเลือก ตัวเลือกแบบไดนามิกจะ resolve กับโมเดลของเซสชันเป้าหมาย ดังนั้นตัวเลือก
    เฉพาะโมเดลอย่างระดับของ `/think` จะตามการแทนที่ `/model` ของเซสชัน
  </Accordion>
</AccordionGroup>

## `/tools` — สิ่งที่เอเจนต์ใช้ได้ตอนนี้

`/tools` ตอบคำถามรันไทม์: **เอเจนต์นี้ใช้อะไรได้ในตอนนี้ใน
การสนทนานี้** — ไม่ใช่แค็ตตาล็อกการกำหนดค่าแบบคงที่

```text
/tools         # compact view
/tools verbose # with short descriptions
```

ผลลัพธ์มีขอบเขตตามเซสชัน การเปลี่ยนเอเจนต์ ช่องทาง เธรด การอนุญาตของผู้ส่ง
หรือโมเดลสามารถเปลี่ยนผลลัพธ์ได้ สำหรับการแก้ไขโปรไฟล์และการแทนที่
ให้ใช้แผง Tools ใน Control UI หรือพื้นผิวการกำหนดค่า

## `/model` — การเลือกโมเดล

```text
/model             # show model picker
/model list        # same
/model 3           # select by number from picker
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # clear the session model selection
/model status      # detailed view with endpoint and API mode
```

บน Discord, `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบพร้อม dropdown ของ provider และ
โมเดล ตัวเลือกนี้เคารพ `agents.defaults.models` รวมถึงรายการ
`provider/*`

## `/config` — การเขียนการกำหนดค่าบนดิสก์

<Note>
  เฉพาะเจ้าของ ปิดใช้งานตามค่าเริ่มต้น — เปิดใช้ด้วย `commands.config: true`
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

การกำหนดค่าจะถูกตรวจสอบความถูกต้องก่อนเขียน การเปลี่ยนแปลงที่ไม่ถูกต้องจะถูกปฏิเสธ `/config`
อัปเดตจะคงอยู่หลังรีสตาร์ต

## `/mcp` — การกำหนดค่าเซิร์ฟเวอร์ MCP

<Note>
  เฉพาะเจ้าของ ปิดใช้งานตามค่าเริ่มต้น — เปิดใช้ด้วย `commands.mcp: true`
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` เก็บการกำหนดค่าไว้ในการกำหนดค่า OpenClaw ไม่ใช่ในการตั้งค่าโปรเจ็กต์ embedded-agent

## `/debug` — การแทนที่เฉพาะรันไทม์

<Note>
  เฉพาะเจ้าของ ปิดใช้งานตามค่าเริ่มต้น — เปิดใช้ด้วย `commands.debug: true`
  การแทนที่จะมีผลทันทีกับการอ่านการกำหนดค่าใหม่ แต่จะ **ไม่** เขียนลงดิสก์
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — การจัดการ Plugin

<Note>
  เฉพาะเจ้าของสำหรับการเขียน ปิดใช้งานตามค่าเริ่มต้น — เปิดใช้ด้วย `commands.plugins: true`
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` อัปเดตการกำหนดค่า Plugin และ hot-reload รันไทม์ Plugin ของ Gateway
สำหรับ agent turns ใหม่ `/plugins install` รีสตาร์ต Gateway ที่จัดการโดยอัตโนมัติ
เพราะโมดูลซอร์สของ Plugin เปลี่ยนไป

## `/trace` — เอาต์พุต trace ของ Plugin

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` แสดงบรรทัด trace/debug ของ Plugin ที่มีขอบเขตตามเซสชันโดยไม่ต้องเปิดโหมด
verbose เต็มรูปแบบ คำสั่งนี้ไม่ได้แทนที่ `/debug` (การแทนที่รันไทม์) หรือ `/verbose` (เอาต์พุต
เครื่องมือปกติ)

## `/btw` — คำถามแทรก

`/btw` คือคำถามแทรกแบบรวดเร็วเกี่ยวกับบริบทเซสชันปัจจุบัน นามแฝง: `/side`

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

ต่างจากข้อความปกติ:

- ใช้เซสชันปัจจุบันเป็นบริบทพื้นหลัง
- ในเซสชันฮาร์เนส Codex จะรันเป็นเธรดข้างเคียง Codex แบบ ephemeral
- **ไม่** เปลี่ยนบริบทเซสชันในอนาคต
- ไม่ถูกเขียนลงประวัติ transcript

ดู [คำถามแทรก BTW](/th/tools/btw) สำหรับพฤติกรรมทั้งหมด

## หมายเหตุพื้นผิว

<AccordionGroup>
  <Accordion title="Session scoping per surface">
    - **คำสั่งข้อความ:** รันในเซสชันแชตปกติ (DM ใช้ `main` ร่วมกัน กลุ่มมีเซสชันของตนเอง)
    - **คำสั่ง Discord แบบเนทีฟ:** `agent:<agentId>:discord:slash:<userId>`
    - **คำสั่ง Slack แบบเนทีฟ:** `agent:<agentId>:slack:slash:<userId>` (prefix กำหนดค่าได้ผ่าน `channels.slack.slashCommand.sessionPrefix`)
    - **คำสั่ง Telegram แบบเนทีฟ:** `telegram:slash:<userId>` (กำหนดเป้าหมายเซสชันแชตผ่าน `CommandTargetSessionKey`)
    - **`/stop`** กำหนดเป้าหมายเซสชันแชตที่ใช้งานอยู่เพื่อยกเลิกการรันปัจจุบัน

  </Accordion>
  <Accordion title="Slack specifics">
    `channels.slack.slashCommand` รองรับคำสั่งเดียวแบบ `/openclaw`
    เมื่อใช้ `commands.native: true` ให้สร้างคำสั่ง slash ของ Slack หนึ่งรายการต่อคำสั่ง built-in
    ลงทะเบียน `/agentstatus` (ไม่ใช่ `/status`) เพราะ Slack สงวน
    `/status` ไว้ ข้อความ `/status` ยังใช้งานได้ในข้อความ Slack
  </Accordion>
  <Accordion title="Fast path and inline shortcuts">
    - ข้อความที่เป็นคำสั่งอย่างเดียวจากผู้ส่งใน allowlist จะถูกจัดการทันที (ข้ามคิว + โมเดล)
    - ทางลัด inline (`/help`, `/commands`, `/status`, `/whoami`) ยังใช้งานได้เมื่อฝังในข้อความปกติ และจะถูกตัดออกก่อนโมเดลเห็นข้อความที่เหลือ
    - ข้อความที่เป็นคำสั่งอย่างเดียวจากผู้ที่ไม่ได้รับอนุญาตจะถูกละเว้นแบบเงียบ ๆ; token inline `/...` จะถูกถือเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="Argument notes">
    - คำสั่งรับ `:` แบบไม่บังคับระหว่างคำสั่งกับอาร์กิวเมนต์ (`/think: high`, `/send: on`)
    - `/new <model>` รับนามแฝงโมเดล, `provider/model`, หรือชื่อ provider (จับคู่แบบ fuzzy); หากไม่พบรายการที่ตรงกัน ข้อความจะถูกถือเป็นเนื้อหาข้อความ
    - `/allowlist add|remove` ต้องมี `commands.config: true` และเคารพ `configWrites` ของช่องทาง

  </Accordion>
</AccordionGroup>

## การใช้งานและสถานะของ Provider

- **การใช้งาน/โควตา Provider** (เช่น "Claude 80% left") แสดงใน `/status` สำหรับ provider ของโมเดลปัจจุบันเมื่อเปิดใช้การติดตามการใช้งาน
- **บรรทัด token/cache** ใน `/status` สามารถ fallback ไปยังรายการการใช้งาน transcript ล่าสุดเมื่อ snapshot เซสชันสดมีข้อมูลน้อย
- **Execution เทียบกับ runtime:** `/status` รายงาน `Execution` สำหรับเส้นทาง sandbox ที่มีผล และ `Runtime` สำหรับผู้ที่กำลังรันเซสชัน: `OpenClaw Default`, `OpenAI Codex`, แบ็กเอนด์ CLI หรือแบ็กเอนด์ ACP
- **Token/ค่าใช้จ่ายต่อการตอบกลับ:** ควบคุมโดย `/usage off|tokens|full`
- `/model status` เกี่ยวกับโมเดล/auth/endpoint ไม่ใช่การใช้งาน

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Skills" href="/th/tools/skills" icon="puzzle-piece">
    วิธีลงทะเบียนและ gate คำสั่ง slash ของ skill
  </Card>
  <Card title="Creating skills" href="/th/tools/creating-skills" icon="hammer">
    สร้าง skill ที่ลงทะเบียนคำสั่ง slash ของตนเอง
  </Card>
  <Card title="BTW" href="/th/tools/btw" icon="comments">
    คำถามแทรกโดยไม่เปลี่ยนบริบทเซสชัน
  </Card>
  <Card title="Steer" href="/th/tools/steer" icon="compass">
    นำทางเอเจนต์ระหว่างรันด้วย `/steer`
  </Card>
</CardGroup>
