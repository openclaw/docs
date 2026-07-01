---
read_when:
    - การใช้หรือกำหนดค่าคำสั่งแชท
    - การดีบักการกำหนดเส้นทางคำสั่งหรือสิทธิ์
    - ทำความเข้าใจวิธีลงทะเบียนคำสั่ง Skills
sidebarTitle: Slash commands
summary: คำสั่งแบบสแลช คำสั่งกำกับ และทางลัดแบบอินไลน์ทั้งหมดที่มีให้ใช้งาน — การกำหนดค่า การกำหนดเส้นทาง และพฤติกรรมแยกตามพื้นผิว
title: คำสั่งสแลช
x-i18n:
    generated_at: "2026-07-01T20:41:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f9b74740baad038d667ccb8d80fc46af686111785b585ea1cb8cde13f41d98f
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway จัดการคำสั่งที่ส่งเป็นข้อความเดี่ยวซึ่งขึ้นต้นด้วย `/`
คำสั่ง bash เฉพาะโฮสต์ใช้ `! <cmd>` (โดยมี `/bash <cmd>` เป็นนามแฝง)

เมื่อการสนทนาถูกผูกกับเซสชัน ACP ข้อความปกติจะถูกส่งไปยัง harness ของ ACP
คำสั่งจัดการ Gateway ยังคงเป็นแบบโลคัล: `/acp ...` จะไปถึงตัวจัดการคำสั่งของ OpenClaw เสมอ และ `/status` กับ `/unfocus` จะยังคงเป็นโลคัลเมื่อเปิดใช้งานการจัดการคำสั่งสำหรับพื้นผิวนั้น

## คำสั่งสามประเภท

<CardGroup cols={3}>
  <Card title="คำสั่ง" icon="terminal">
    ข้อความเดี่ยว `/...` ที่ Gateway จัดการ ต้องส่งเป็นเนื้อหาเพียงอย่างเดียว
    ในข้อความ
  </Card>
  <Card title="คำสั่งกำกับ" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — ถูกตัดออกจากข้อความก่อนที่โมเดลจะเห็น
    บันทึกการตั้งค่าเซสชันเมื่อส่งเดี่ยว ๆ; ทำหน้าที่เป็นคำใบ้แบบอินไลน์
    เมื่อส่งพร้อมข้อความอื่น
  </Card>
  <Card title="ทางลัดอินไลน์" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — ทำงานทันทีและถูกตัดออก
    ก่อนที่โมเดลจะเห็นข้อความที่เหลือ เฉพาะผู้ส่งที่ได้รับอนุญาตเท่านั้น
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="รายละเอียดพฤติกรรมของคำสั่งกำกับ">
    - คำสั่งกำกับจะถูกตัดออกจากข้อความก่อนที่โมเดลจะเห็น
    - ในข้อความแบบ **มีเฉพาะคำสั่งกำกับ** (ข้อความมีเฉพาะคำสั่งกำกับ) คำสั่งเหล่านี้
      จะคงอยู่ในเซสชันและตอบกลับด้วยการยืนยัน
    - ในข้อความ **แชตปกติ** ที่มีข้อความอื่นร่วมด้วย คำสั่งเหล่านี้จะทำหน้าที่เป็นคำใบ้แบบอินไลน์และ
      จะ **ไม่** คงการตั้งค่าเซสชันไว้
    - คำสั่งกำกับมีผลเฉพาะกับ **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น หากตั้งค่า `commands.allowFrom`
      ไว้ ค่านี้จะเป็น allowlist เดียวที่ใช้; มิฉะนั้นการอนุญาตจะมาจาก
      allowlist/การจับคู่ของช่องทาง รวมถึง `commands.useAccessGroups` ผู้ส่งที่ไม่ได้รับอนุญาต
      จะเห็นคำสั่งกำกับถูกปฏิบัติเป็นข้อความธรรมดา
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
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) คำสั่งแบบข้อความ
  จะทำงานแม้ตั้งค่าเป็น `false`
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่งเนทีฟ Auto: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack;
  ถูกละเว้นสำหรับผู้ให้บริการที่ไม่รองรับเนทีฟ แทนที่เป็นรายช่องทางได้ด้วย
  `channels.<provider>.commands.native` บน Discord ค่า `false` จะข้ามการลงทะเบียนคำสั่งแบบ slash;
  คำสั่งที่ลงทะเบียนไว้ก่อนหน้าอาจยังมองเห็นได้จนกว่าจะถูกนำออก
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่ง Skills แบบเนทีฟเมื่อรองรับ Auto: เปิดสำหรับ
  Discord/Telegram; ปิดสำหรับ Slack แทนที่ได้ด้วย
  `channels.<provider>.commands.nativeSkills`
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  เปิดใช้ `! <cmd>` เพื่อรันคำสั่งเชลล์ของโฮสต์ (นามแฝง `/bash <cmd>`) ต้องมี
  allowlist ของ `tools.elevated`
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  ระยะเวลาที่ bash รอก่อนสลับเป็นโหมดเบื้องหลัง (`0` จะส่งไปเบื้องหลัง
  ทันที)
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`) เฉพาะเจ้าของเท่านั้น
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  เปิดใช้ `/mcp` (อ่าน/เขียนการกำหนดค่า MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`) เฉพาะเจ้าของเท่านั้น
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  เปิดใช้ `/plugins` (การค้นหา/สถานะ Plugin รวมถึงการติดตั้ง + เปิด/ปิดใช้งาน) การเขียนสำหรับเจ้าของเท่านั้น
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  เปิดใช้ `/debug` (การแทนที่การกำหนดค่าเฉพาะรันไทม์) เฉพาะเจ้าของเท่านั้น
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  เปิดใช้ `/restart` และการกระทำของเครื่องมือรีสตาร์ต Gateway
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  allowlist เจ้าของแบบชัดเจนสำหรับพื้นผิวคำสั่งเฉพาะเจ้าของ แยกจาก
  `commands.allowFrom` และการเข้าถึงแบบจับคู่ DM
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  รายช่องทาง: ต้องมีตัวตนเจ้าของสำหรับคำสั่งเฉพาะเจ้าของ เมื่อเป็น `true`
  ผู้ส่งต้องตรงกับ `commands.ownerAllowFrom` หรือถือ scope ภายใน `operator.admin`
  รายการ `allowFrom` แบบ wildcard **ไม่** เพียงพอ
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  ควบคุมวิธีที่ id ของเจ้าของปรากฏในพรอมป์ระบบ
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  secret ของ HMAC ที่ใช้เมื่อ `commands.ownerDisplay: "hash"`
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  allowlist รายผู้ให้บริการสำหรับการอนุญาตคำสั่ง เมื่อตั้งค่าไว้ ค่านี้จะเป็น
  แหล่งการอนุญาต **เพียงแหล่งเดียว** สำหรับคำสั่งและคำสั่งกำกับ ใช้ `"*"` สำหรับ
  ค่าเริ่มต้นแบบทั่วโลก; คีย์เฉพาะผู้ให้บริการจะแทนที่ค่านั้น
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  บังคับใช้ allowlist/นโยบายสำหรับคำสั่งเมื่อไม่ได้ตั้งค่า `commands.allowFrom`
</ParamField>

## รายการคำสั่ง

คำสั่งมาจากสามแหล่ง:

- **คำสั่งในตัวของแกนหลัก:** `src/auto-reply/commands-registry.shared.ts`
- **คำสั่ง dock ที่สร้างขึ้น:** `src/auto-reply/commands-registry.data.ts`
- **คำสั่ง Plugin:** การเรียก `registerCommand()` ของ plugin

ความพร้อมใช้งานขึ้นอยู่กับ flag การกำหนดค่า พื้นผิวช่องทาง และ
plugin ที่ติดตั้ง/เปิดใช้งาน

### คำสั่งแกนหลัก

<AccordionGroup>
  <Accordion title="เซสชันและการรัน">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/new [model]` | เก็บเซสชันปัจจุบันเข้าคลังและเริ่มเซสชันใหม่ |
    | `/reset [soft [message]]` | รีเซ็ตเซสชันปัจจุบันในที่เดิม `soft` จะเก็บ transcript ทิ้ง id เซสชัน backend ของ CLI ที่นำกลับมาใช้ซ้ำ และรันการเริ่มต้นใหม่ |
    | `/name <title>` | ตั้งชื่อหรือเปลี่ยนชื่อเซสชันปัจจุบัน ละชื่อเรื่องเพื่อดูชื่อปัจจุบันและข้อเสนอแนะ |
    | `/compact [instructions]` | ย่อบริบทเซสชัน ดู [Compaction](/th/concepts/compaction) |
    | `/stop` | ยกเลิกการรันปัจจุบัน |
    | `/session idle <duration\|off>` | จัดการการหมดอายุเมื่อไม่ได้ใช้งานของการผูกเธรด |
    | `/session max-age <duration\|off>` | จัดการอายุสูงสุดของการผูกเธรด |
    | `/export-session [path]` | ส่งออกเซสชันปัจจุบันเป็น HTML นามแฝง: `/export` |
    | `/export-trajectory [path]` | ส่งออกชุด trajectory แบบ JSONL สำหรับเซสชันปัจจุบัน นามแฝง: `/trajectory` |

    <Note>
      Control UI จะดักจับ `/new` ที่พิมพ์เพื่อสร้างและสลับไปยัง
      เซสชันแดชบอร์ดใหม่ ยกเว้นเมื่อกำหนดค่า `session.dmScope: "main"`
      และ parent ปัจจุบันเป็นเซสชันหลักของ agent — ในกรณีนั้น `/new`
      จะรีเซ็ตเซสชันหลักในที่เดิม `/reset` ที่พิมพ์ยังคงรันการรีเซ็ตในที่เดิมของ Gateway
      ใช้ `/model default` เมื่อคุณต้องการล้างการเลือกโมเดลของเซสชันที่ปักไว้
    </Note>

  </Accordion>

  <Accordion title="การควบคุมโมเดลและการรัน">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/think <level\|default>` | ตั้งระดับการคิดหรือล้างการแทนที่ของเซสชัน นามแฝง: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | เปิด/ปิดเอาต์พุตแบบละเอียด นามแฝง: `/v` |
    | `/trace on\|off` | เปิด/ปิดเอาต์พุต trace ของ plugin สำหรับเซสชันปัจจุบัน |
    | `/fast [status\|auto\|on\|off\|default]` | แสดง ตั้งค่า หรือล้างโหมดเร็ว |
    | `/reasoning [on\|off\|stream]` | เปิด/ปิดการมองเห็น reasoning นามแฝง: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | เปิด/ปิดโหมดยกระดับ นามแฝง: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | แสดงหรือตั้งค่าเริ่มต้นของ exec |
    | `/login [codex\|openai\|openai-codex]` | จับคู่การเข้าสู่ระบบ Codex/OpenAI จากแชตส่วนตัวหรือเซสชัน Web UI เฉพาะเจ้าของ/ผู้ดูแลเท่านั้น |
    | `/model [name\|#\|status]` | แสดงหรือตั้งค่าโมเดล |
    | `/models [provider] [page] [limit=<n>\|all]` | แสดงรายการผู้ให้บริการหรือโมเดลที่กำหนดค่าไว้/มีสิทธิ์ใช้งานผ่านการยืนยันตัวตน |
    | `/queue <mode>` | จัดการพฤติกรรมคิวของการรันที่ใช้งานอยู่ ดู [คิว](/th/concepts/queue) และ [การกำกับคิว](/th/concepts/queue-steering) |
    | `/steer <message>` | ฉีดคำแนะนำเข้าสู่การรันที่ใช้งานอยู่ นามแฝง: `/tell` ดู [กำกับ](/th/tools/steer) |

    <AccordionGroup>
      <Accordion title="ความปลอดภัยของ verbose / trace / fast / reasoning">
        - `/verbose` ใช้สำหรับการดีบัก — ให้ปิดไว้ (**off**) ในการใช้งานปกติ
        - `/trace` เปิดเผยเฉพาะบรรทัด trace/debug ที่ plugin เป็นเจ้าของ; ข้อความละเอียดทั่วไปยังคงปิดอยู่
        - `/fast auto|on|off` จะคงการแทนที่ของเซสชัน; ใช้ตัวเลือก `inherit` ใน Sessions UI เพื่อล้างค่า
        - `/fast` ขึ้นกับผู้ให้บริการ: OpenAI/Codex แมปเป็น `service_tier=priority`; คำขอ Anthropic โดยตรงแมปเป็น `service_tier=auto` หรือ `standard_only`
        - `/reasoning`, `/verbose` และ `/trace` มีความเสี่ยงในการตั้งค่ากลุ่ม — อาจเปิดเผย reasoning ภายในหรือการวินิจฉัยของ plugin ให้ปิดไว้ในแชตกลุ่ม

      </Accordion>
      <Accordion title="รายละเอียดการสลับโมเดล">
        - `/model` จะคงโมเดลใหม่ไว้ในเซสชันทันที
        - หาก agent ว่างอยู่ การรันถัดไปจะใช้โมเดลนั้นทันที
        - หากมีการรันที่ใช้งานอยู่ การสลับจะถูกทำเครื่องหมายว่ารอดำเนินการและนำไปใช้ที่จุด retry ที่สะอาดถัดไป

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="การค้นหาและสถานะ">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/help` | แสดงสรุปความช่วยเหลือแบบสั้น |
    | `/commands` | แสดงแคตตาล็อกคำสั่งที่สร้างขึ้น |
    | `/tools [compact\|verbose]` | แสดงสิ่งที่ agent ปัจจุบันสามารถใช้ได้ตอนนี้ |
    | `/status` | แสดงสถานะการดำเนินการ/รันไทม์ uptime ของ Gateway และระบบ สุขภาพของ plugin รวมถึงการใช้งาน/โควตาของผู้ให้บริการ |
    | `/status plugins` | แสดงสุขภาพของ plugin โดยละเอียด: ข้อผิดพลาดในการโหลด การกักกัน ความล้มเหลวของช่องทาง ปัญหาการพึ่งพา ประกาศความเข้ากันได้ |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | จัดการ [goal](/th/tools/goal) แบบคงทนของเซสชันปัจจุบัน |
    | `/diagnostics [note]` | โฟลว์รายงานสนับสนุนเฉพาะเจ้าของ ขออนุมัติ exec ทุกครั้ง |
    | `/crestodian <request>` | รันตัวช่วยตั้งค่าและซ่อมแซม Crestodian จาก DM ของเจ้าของ |
    | `/tasks` | แสดงรายการงานเบื้องหลังที่ใช้งานอยู่/ล่าสุดสำหรับเซสชันปัจจุบัน |
    | `/context [list\|detail\|map\|json]` | อธิบายวิธีประกอบบริบท |
    | `/whoami` | แสดง id ผู้ส่งของคุณ นามแฝง: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | ควบคุม footer การใช้งานต่อคำตอบ (`reset`/`inherit`/`clear`/`default` จะล้างการแทนที่ของเซสชันเพื่อกลับไปรับค่าเริ่มต้นที่กำหนดค่าไว้) หรือพิมพ์สรุปค่าใช้จ่ายแบบโลคัล |
  </Accordion>

  <Accordion title="Skills, allowlist, การอนุมัติ">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/skill <name> [input]` | รัน skill ตามชื่อ |
    | `/allowlist [list\|add\|remove] ...` | จัดการรายการ allowlist แบบข้อความเท่านั้น |
    | `/approve <id> <decision>` | จัดการ prompt การอนุมัติ exec หรือ plugin |
    | `/btw <question>` | ถามคำถามแทรกโดยไม่เปลี่ยนบริบทเซสชัน นามแฝง: `/side` ดู [BTW](/th/tools/btw) |
  </Accordion>

  <Accordion title="เอเจนต์ย่อยและ ACP">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/subagents list\|log\|info` | ตรวจสอบการรันของเอเจนต์ย่อยสำหรับเซสชันปัจจุบัน |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | จัดการเซสชัน ACP และตัวเลือกรันไทม์ การควบคุมรันไทม์ต้องใช้เจ้าของภายนอกหรือข้อมูลประจำตัวผู้ดูแลระบบ Gateway ภายใน |
    | `/focus <target>` | ผูกเธรด Discord หรือหัวข้อ Telegram ปัจจุบันเข้ากับเป้าหมายเซสชัน |
    | `/unfocus` | ลบการผูกเธรดปัจจุบัน |
    | `/agents` | แสดงรายการเอเจนต์ที่ผูกกับเธรดสำหรับเซสชันปัจจุบัน |
  </Accordion>

  <Accordion title="การเขียนสำหรับเจ้าของเท่านั้นและผู้ดูแลระบบ">
    | คำสั่ง | ต้องใช้ | คำอธิบาย |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | อ่านหรือเขียน `openclaw.json` เฉพาะเจ้าของเท่านั้น |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | อ่านหรือเขียนการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการ เฉพาะเจ้าของเท่านั้น |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | ตรวจสอบหรือเปลี่ยนสถานะ Plugin เฉพาะเจ้าของเท่านั้นสำหรับการเขียน นามแฝง: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | การแทนที่การกำหนดค่าสำหรับรันไทม์เท่านั้น เฉพาะเจ้าของเท่านั้น |
    | `/restart` | `commands.restart: true` (ค่าเริ่มต้น) | รีสตาร์ต OpenClaw |
    | `/send on\|off\|inherit` | เจ้าของ | ตั้งค่านโยบายการส่ง |
  </Accordion>

  <Accordion title="เสียงพูด, TTS, การควบคุมช่องทาง">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | ควบคุม TTS ดู [TTS](/th/tools/tts) |
    | `/activation mention\|always` | ตั้งค่าโหมดการเปิดใช้งานกลุ่ม |
    | `/bash <command>` | รันคำสั่งเชลล์ของโฮสต์ นามแฝง: `! <command>` ต้องใช้ `commands.bash: true` |
    | `!poll [sessionId]` | ตรวจสอบงาน bash เบื้องหลัง |
    | `!stop [sessionId]` | หยุดงาน bash เบื้องหลัง |
  </Accordion>
</AccordionGroup>

### คำสั่ง Dock

คำสั่ง Dock เปลี่ยนเส้นทางตอบกลับของเซสชันที่ใช้งานอยู่ไปยังช่องทางที่เชื่อมโยงอีกช่องทางหนึ่ง
ดู [การ Dock ช่องทาง](/th/concepts/channel-docking) สำหรับการตั้งค่าและการแก้ปัญหา

สร้างจาก Plugin ช่องทางที่รองรับคำสั่งเนทีฟ:

- `/dock-discord` (นามแฝง: `/dock_discord`)
- `/dock-mattermost` (นามแฝง: `/dock_mattermost`)
- `/dock-slack` (นามแฝง: `/dock_slack`)
- `/dock-telegram` (นามแฝง: `/dock_telegram`)

คำสั่ง Dock ต้องใช้ `session.identityLinks` ผู้ส่งต้นทางและเพียร์เป้าหมาย
ต้องอยู่ในกลุ่มข้อมูลประจำตัวเดียวกัน

### คำสั่ง Plugin ที่รวมมาให้

| คำสั่ง                                                                                      | คำอธิบาย                                                                         |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | เปิด/ปิด memory dreaming (เจ้าของหรือผู้ดูแลระบบ Gateway) ดู [Dreaming](/th/concepts/dreaming) |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | จัดการการจับคู่อุปกรณ์ ดู [การจับคู่](/th/channels/pairing)                             |
| `/phone status\|arm ...\|disarm`                                                             | เตรียมใช้งานคำสั่งโหนดโทรศัพท์ที่มีความเสี่ยงสูงชั่วคราว                                       |
| `/voice status\|list\|set <voiceId>`                                                         | จัดการการกำหนดค่าเสียง Talk ชื่อเนทีฟของ Discord: `/talkvoice`                         |
| `/card ...`                                                                                  | ส่งพรีเซ็ตการ์ด Rich ของ LINE ดู [LINE](/th/channels/line)                             |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | ควบคุมฮาร์เนสแอปเซิร์ฟเวอร์ Codex ดู [ฮาร์เนส Codex](/th/plugins/codex-harness)   |

เฉพาะ QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### คำสั่ง Skills

Skills ที่ผู้ใช้เรียกใช้ได้จะถูกเปิดเผยเป็นคำสั่งสแลช:

- `/skill <name> [input]` ใช้งานได้เสมอในฐานะจุดเข้าทั่วไป
- Skills อาจลงทะเบียนเป็นคำสั่งโดยตรง (เช่น `/prose` สำหรับ OpenProse)
- การลงทะเบียนคำสั่ง Skills แบบเนทีฟควบคุมโดย `commands.nativeSkills` และ
  `channels.<provider>.commands.nativeSkills`
- ชื่อจะถูกทำให้ปลอดภัยเป็น `a-z0-9_` (สูงสุด 32 อักขระ); ชื่อที่ชนกันจะได้รับส่วนต่อท้ายเป็นตัวเลข

<AccordionGroup>
  <Accordion title="การส่งต่อคำสั่ง Skills">
    โดยค่าเริ่มต้น คำสั่ง Skills จะถูกส่งไปยังโมเดลเหมือนคำขอปกติ

    Skills สามารถประกาศ `command-dispatch: tool` เพื่อส่งตรงไปยังเครื่องมือ
    (กำหนดผลได้แน่นอน ไม่มีโมเดลเกี่ยวข้อง) ตัวอย่าง: `/prose` (Plugin OpenProse)
    — ดู [OpenProse](/th/prose)

  </Accordion>
  <Accordion title="อาร์กิวเมนต์คำสั่งเนทีฟ">
    Discord ใช้การเติมข้อความอัตโนมัติสำหรับตัวเลือกไดนามิกและเมนูปุ่มเมื่อ
    ละอาร์กิวเมนต์ที่จำเป็น Telegram และ Slack แสดงเมนูปุ่มสำหรับคำสั่งที่มี
    ตัวเลือก ตัวเลือกไดนามิกจะ resolve กับโมเดลเซสชันเป้าหมาย ดังนั้นตัวเลือกเฉพาะ
    โมเดล เช่นระดับ `/think` จะตามการแทนที่ `/model` ของเซสชัน
  </Accordion>
</AccordionGroup>

## `/tools` — สิ่งที่เอเจนต์ใช้ได้ตอนนี้

`/tools` ตอบคำถามรันไทม์: **เอเจนต์นี้ใช้สิ่งใดได้ตอนนี้ใน
บทสนทนานี้** — ไม่ใช่แค็ตตาล็อกการกำหนดค่าแบบคงที่

```text
/tools         # compact view
/tools verbose # with short descriptions
```

ผลลัพธ์อยู่ในขอบเขตเซสชัน การเปลี่ยนเอเจนต์ ช่องทาง เธรด ผู้ส่ง
การอนุญาต หรือโมเดล อาจเปลี่ยนผลลัพธ์ได้ สำหรับการแก้ไขโปรไฟล์และการแทนที่
ให้ใช้แผง Tools ของ Control UI หรือพื้นผิวการกำหนดค่า

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

บน Discord, `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบพร้อมดรอปดาวน์ผู้ให้บริการและ
โมเดล ตัวเลือกจะเคารพ `agents.defaults.models` รวมถึง
รายการ `provider/*`

## `/config` — การเขียนการกำหนดค่าบนดิสก์

<Note>
  เฉพาะเจ้าของเท่านั้น ปิดใช้งานโดยค่าเริ่มต้น — เปิดใช้งานด้วย `commands.config: true`
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

การกำหนดค่าจะถูกตรวจสอบก่อนเขียน การเปลี่ยนแปลงที่ไม่ถูกต้องจะถูกปฏิเสธ การอัปเดต `/config`
จะคงอยู่ข้ามการรีสตาร์ต

## `/mcp` — การกำหนดค่าเซิร์ฟเวอร์ MCP

<Note>
  เฉพาะเจ้าของเท่านั้น ปิดใช้งานโดยค่าเริ่มต้น — เปิดใช้งานด้วย `commands.mcp: true`
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` เก็บการกำหนดค่าไว้ในการกำหนดค่า OpenClaw ไม่ใช่ในการตั้งค่าโปรเจกต์ของเอเจนต์แบบฝัง

## `/debug` — การแทนที่สำหรับรันไทม์เท่านั้น

<Note>
  เฉพาะเจ้าของเท่านั้น ปิดใช้งานโดยค่าเริ่มต้น — เปิดใช้งานด้วย `commands.debug: true`
  การแทนที่จะมีผลทันทีต่อการอ่านการกำหนดค่าใหม่ แต่จะ **ไม่** เขียนลงดิสก์
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
  เฉพาะเจ้าของเท่านั้นสำหรับการเขียน ปิดใช้งานโดยค่าเริ่มต้น — เปิดใช้งานด้วย `commands.plugins: true`
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
สำหรับเทิร์นเอเจนต์ใหม่ `/plugins install` รีสตาร์ต Gateway ที่จัดการโดยอัตโนมัติ
เพราะโมดูลซอร์สของ Plugin เปลี่ยนไป

## `/trace` — เอาต์พุต trace ของ Plugin

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` แสดงบรรทัด trace/debug ของ Plugin ที่อยู่ในขอบเขตเซสชันโดยไม่ต้องใช้โหมด verbose
เต็มรูปแบบ มันไม่แทนที่ `/debug` (การแทนที่รันไทม์) หรือ `/verbose` (เอาต์พุตเครื่องมือ
ปกติ)

## `/btw` — คำถามแทรก

`/btw` คือคำถามแทรกแบบรวดเร็วเกี่ยวกับบริบทเซสชันปัจจุบัน นามแฝง: `/side`

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

ต่างจากข้อความปกติ:

- ใช้เซสชันปัจจุบันเป็นบริบทพื้นหลัง
- ในเซสชันฮาร์เนส Codex จะรันเป็นเธรดแทรก Codex ชั่วคราว
- **ไม่** เปลี่ยนบริบทเซสชันในอนาคต
- ไม่ถูกเขียนลงประวัติทรานสคริปต์

ดู [คำถามแทรก BTW](/th/tools/btw) สำหรับพฤติกรรมทั้งหมด

## หมายเหตุพื้นผิว

<AccordionGroup>
  <Accordion title="ขอบเขตเซสชันต่อพื้นผิว">
    - **คำสั่งข้อความ:** รันในเซสชันแชตปกติ (DM ใช้ `main` ร่วมกัน กลุ่มมีเซสชันของตนเอง)
    - **คำสั่ง Discord เนทีฟ:** `agent:<agentId>:discord:slash:<userId>`
    - **คำสั่ง Slack เนทีฟ:** `agent:<agentId>:slack:slash:<userId>` (กำหนด prefix ได้ผ่าน `channels.slack.slashCommand.sessionPrefix`)
    - **คำสั่ง Telegram เนทีฟ:** `telegram:slash:<userId>` (กำหนดเป้าหมายไปยังเซสชันแชตผ่าน `CommandTargetSessionKey`)
    - **`/login codex`** ส่งรหัสจับคู่อุปกรณ์ผ่านแชตส่วนตัวหรือเส้นทางการตอบกลับ Web UI เท่านั้น การเรียกใช้ในกลุ่ม/หัวข้อ Telegram จะขอให้เจ้าของ DM ไปยังบอตแทน
    - **`/stop`** กำหนดเป้าหมายเซสชันแชตที่ใช้งานอยู่เพื่อยกเลิกการรันปัจจุบัน

  </Accordion>
  <Accordion title="รายละเอียดเฉพาะของ Slack">
    `channels.slack.slashCommand` รองรับคำสั่งแบบ `/openclaw` เพียงคำสั่งเดียว
    เมื่อใช้ `commands.native: true` ให้สร้างคำสั่งสแลช Slack หนึ่งคำสั่งต่อคำสั่ง
    ในตัวแต่ละคำสั่ง ลงทะเบียน `/agentstatus` (ไม่ใช่ `/status`) เพราะ Slack สงวน
    `/status` ไว้ ข้อความ `/status` ยังคงใช้งานได้ในข้อความ Slack
  </Accordion>
  <Accordion title="เส้นทางเร็วและชอร์ตคัตในบรรทัด">
    - ข้อความที่มีเฉพาะคำสั่งจากผู้ส่งที่อยู่ใน allowlist จะถูกจัดการทันที (ข้ามคิว + โมเดล)
    - ชอร์ตคัตในบรรทัด (`/help`, `/commands`, `/status`, `/whoami`) ยังทำงานเมื่อฝังอยู่ในข้อความปกติ และจะถูกตัดออกก่อนที่โมเดลจะเห็นข้อความที่เหลือ
    - ข้อความที่มีเฉพาะคำสั่งจากผู้ไม่ได้รับอนุญาตจะถูกเพิกเฉยแบบเงียบ ๆ; token `/...` ในบรรทัดจะถูกถือเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="หมายเหตุอาร์กิวเมนต์">
    - คำสั่งยอมรับ `:` ที่เป็นตัวเลือกระหว่างคำสั่งกับอาร์กิวเมนต์ (`/think: high`, `/send: on`)
    - `/new <model>` ยอมรับนามแฝงโมเดล, `provider/model`, หรือชื่อผู้ให้บริการ (จับคู่แบบ fuzzy); หากไม่พบรายการที่ตรงกัน ข้อความจะถูกถือเป็นเนื้อหาข้อความ
    - `/allowlist add|remove` ต้องใช้ `commands.config: true` และเคารพ `configWrites` ของช่องทาง

  </Accordion>
</AccordionGroup>

## การใช้งานและสถานะผู้ให้บริการ

- **การใช้งาน/โควตาผู้ให้บริการ** (เช่น "Claude เหลือ 80%") แสดงใน `/status` สำหรับผู้ให้บริการโมเดลปัจจุบันเมื่อเปิดใช้งานการติดตามการใช้งาน
- **บรรทัด token/cache** ใน `/status` สามารถ fallback ไปยังรายการการใช้งานทรานสคริปต์ล่าสุดเมื่อสแนปช็อตเซสชันสดมีข้อมูลน้อย
- **การดำเนินการเทียบกับรันไทม์:** `/status` รายงาน `Execution` สำหรับเส้นทาง sandbox ที่มีผล และ `Runtime` สำหรับผู้ที่กำลังรันเซสชัน: `OpenClaw Default`, `OpenAI Codex`, แบ็กเอนด์ CLI หรือแบ็กเอนด์ ACP
- **token/ค่าใช้จ่ายต่อการตอบกลับ:** ควบคุมโดย `/usage off|tokens|full`
- `/model status` เกี่ยวกับโมเดล/auth/endpoint ไม่ใช่การใช้งาน

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Skills" href="/th/tools/skills" icon="puzzle-piece">
    วิธีลงทะเบียนและ gate คำสั่งสแลชของ Skills
  </Card>
  <Card title="การสร้าง Skills" href="/th/tools/creating-skills" icon="hammer">
    สร้าง Skills ที่ลงทะเบียนคำสั่งสแลชของตนเอง
  </Card>
  <Card title="BTW" href="/th/tools/btw" icon="comments">
    คำถามแทรกโดยไม่เปลี่ยนบริบทเซสชัน
  </Card>
  <Card title="Steer" href="/th/tools/steer" icon="compass">
    ชี้นำเอเจนต์ระหว่างการรันด้วย `/steer`
  </Card>
</CardGroup>
