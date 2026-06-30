---
read_when:
    - การใช้หรือกำหนดค่าคำสั่งแชท
    - การดีบักการกำหนดเส้นทางคำสั่งหรือสิทธิ์
    - ทำความเข้าใจวิธีลงทะเบียนคำสั่ง Skills
sidebarTitle: Slash commands
summary: คำสั่ง slash, directive และทางลัดแบบ inline ทั้งหมดที่มีให้ใช้ — การกำหนดค่า การกำหนดเส้นทาง และพฤติกรรมแยกตามแต่ละพื้นผิว
title: คำสั่งสแลช
x-i18n:
    generated_at: "2026-06-30T14:32:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ada44bbb5623e53cc09d25f11655430fced4af2223051b88b60b2d92e6c707a3
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway จัดการคำสั่งที่ส่งเป็นข้อความเดี่ยวซึ่งขึ้นต้นด้วย `/`
คำสั่ง bash เฉพาะโฮสต์ใช้ `! <cmd>` (มี `/bash <cmd>` เป็นนามแฝง)

เมื่อการสนทนาถูกผูกกับเซสชัน ACP ข้อความปกติจะถูกส่งไปยัง harness ของ ACP คำสั่งจัดการ Gateway ยังคงอยู่ในเครื่อง: `/acp ...` จะเข้าถึงตัวจัดการคำสั่งของ OpenClaw เสมอ และ `/status` รวมถึง `/unfocus` จะยังอยู่ในเครื่องเมื่อเปิดใช้งานการจัดการคำสั่งสำหรับพื้นผิวนั้น

## คำสั่งสามประเภท

<CardGroup cols={3}>
  <Card title="คำสั่ง" icon="terminal">
    ข้อความ `/...` แบบเดี่ยวที่จัดการโดย Gateway ต้องส่งเป็นเนื้อหาเดียว
    ในข้อความ
  </Card>
  <Card title="ไดเรกทีฟ" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — ถูกตัดออกจากข้อความก่อนที่โมเดล
    จะเห็น คงการตั้งค่าเซสชันเมื่อส่งเดี่ยว ๆ; ทำหน้าที่เป็นคำใบ้แบบอินไลน์
    เมื่อส่งพร้อมข้อความอื่น
  </Card>
  <Card title="ทางลัดอินไลน์" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — ทำงานทันทีและ
    ถูกตัดออกก่อนที่โมเดลจะเห็นข้อความที่เหลือ เฉพาะผู้ส่งที่ได้รับอนุญาตเท่านั้น
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="รายละเอียดพฤติกรรมของไดเรกทีฟ">
    - ไดเรกทีฟจะถูกตัดออกจากข้อความก่อนที่โมเดลจะเห็น
    - ในข้อความ **ที่มีแต่ไดเรกทีฟ** (ข้อความมีเฉพาะไดเรกทีฟ) ไดเรกทีฟจะ
      คงอยู่ในเซสชันและตอบกลับด้วยการรับทราบ
    - ในข้อความ **แชตปกติ** ที่มีข้อความอื่นร่วมด้วย ไดเรกทีฟจะทำหน้าที่เป็นคำใบ้แบบอินไลน์และ
      จะ **ไม่** คงการตั้งค่าเซสชัน
    - ไดเรกทีฟมีผลเฉพาะกับ **ผู้ส่งที่ได้รับอนุญาต** หากตั้งค่า `commands.allowFrom`
      ไว้ จะใช้รายการอนุญาตนั้นเพียงรายการเดียว; ไม่เช่นนั้นการอนุญาตจะมาจาก
      รายการอนุญาต/การจับคู่ของช่องทางร่วมกับ `commands.useAccessGroups` ผู้ส่งที่ไม่ได้รับอนุญาต
      จะเห็นไดเรกทีฟถูกปฏิบัติเป็นข้อความธรรมดา
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
  เปิดใช้งานการแยกวิเคราะห์ `/...` ในข้อความแชต บนพื้นผิวที่ไม่มีคำสั่งเนทีฟ
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) คำสั่งข้อความ
  จะทำงานแม้ตั้งค่าเป็น `false`
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่งเนทีฟ Auto: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack;
  ถูกละเว้นสำหรับผู้ให้บริการที่ไม่รองรับแบบเนทีฟ เขียนทับแยกตามช่องทางได้ด้วย
  `channels.<provider>.commands.native` บน Discord ค่า `false` จะข้ามการลงทะเบียน
  slash-command; คำสั่งที่ลงทะเบียนไว้ก่อนหน้าอาจยังคงมองเห็นได้จนกว่าจะถูกลบ
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่ง Skills แบบเนทีฟเมื่อรองรับ Auto: เปิดสำหรับ
  Discord/Telegram; ปิดสำหรับ Slack เขียนทับด้วย
  `channels.<provider>.commands.nativeSkills`
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  เปิดใช้งาน `! <cmd>` เพื่อเรียกใช้คำสั่งเชลล์ของโฮสต์ (นามแฝง `/bash <cmd>`) ต้องใช้
  รายการอนุญาต `tools.elevated`
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  ระยะเวลาที่ bash รอก่อนสลับไปโหมดพื้นหลัง (`0` จะส่งไปพื้นหลัง
  ทันที)
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  เปิดใช้งาน `/config` (อ่าน/เขียน `openclaw.json`) เฉพาะเจ้าของเท่านั้น
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  เปิดใช้งาน `/mcp` (อ่าน/เขียนการกำหนดค่า MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`) เฉพาะเจ้าของเท่านั้น
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  เปิดใช้งาน `/plugins` (การค้นพบ/สถานะ Plugin รวมถึงติดตั้ง + เปิด/ปิดใช้งาน) การเขียนทำได้เฉพาะเจ้าของเท่านั้น
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  เปิดใช้งาน `/debug` (การเขียนทับการกำหนดค่าเฉพาะรันไทม์) เฉพาะเจ้าของเท่านั้น
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  เปิดใช้งาน `/restart` และการทำงานของเครื่องมือรีสตาร์ท gateway
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  รายการอนุญาตเจ้าของแบบชัดเจนสำหรับพื้นผิวคำสั่งเฉพาะเจ้าของ แยกจาก
  `commands.allowFrom` และการเข้าถึงการจับคู่ DM
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  แยกตามช่องทาง: ต้องใช้ตัวตนเจ้าของสำหรับคำสั่งเฉพาะเจ้าของ เมื่อเป็น `true`
  ผู้ส่งต้องตรงกับ `commands.ownerAllowFrom` หรือมีขอบเขตภายใน `operator.admin`
  รายการ `allowFrom` แบบไวลด์การ์ด **ไม่** เพียงพอ
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  ควบคุมวิธีแสดง id เจ้าของใน system prompt
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  ความลับ HMAC ที่ใช้เมื่อ `commands.ownerDisplay: "hash"`
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  รายการอนุญาตแยกตามผู้ให้บริการสำหรับการอนุญาตคำสั่ง เมื่อกำหนดค่าไว้ จะเป็น
  แหล่งอนุญาต **เดียวเท่านั้น** สำหรับคำสั่งและไดเรกทีฟ ใช้ `"*"` สำหรับค่าเริ่มต้น
  ทั่วโลก; คีย์เฉพาะผู้ให้บริการจะเขียนทับค่านี้
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  บังคับใช้รายการอนุญาต/นโยบายสำหรับคำสั่งเมื่อไม่ได้ตั้งค่า `commands.allowFrom`
</ParamField>

## รายการคำสั่ง

คำสั่งมาจากสามแหล่ง:

- **รายการในตัวของ Core:** `src/auto-reply/commands-registry.shared.ts`
- **คำสั่ง dock ที่สร้างขึ้น:** `src/auto-reply/commands-registry.data.ts`
- **คำสั่ง Plugin:** การเรียก `registerCommand()` ของ plugin

ความพร้อมใช้งานขึ้นอยู่กับแฟล็กการกำหนดค่า พื้นผิวช่องทาง และ Plugin
ที่ติดตั้ง/เปิดใช้งาน

### คำสั่ง Core

<AccordionGroup>
  <Accordion title="เซสชันและการรัน">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/new [model]` | เก็บถาวรเซสชันปัจจุบันและเริ่มเซสชันใหม่ |
    | `/reset [soft [message]]` | รีเซ็ตเซสชันปัจจุบันในที่เดิม `soft` จะเก็บ transcript ไว้ ทิ้ง id เซสชัน CLI backend ที่ใช้ซ้ำ และรัน startup ใหม่ |
    | `/name <title>` | ตั้งชื่อหรือเปลี่ยนชื่อเซสชันปัจจุบัน ละชื่อไว้เพื่อดูชื่อปัจจุบันและคำแนะนำ |
    | `/compact [instructions]` | ย่อบริบทเซสชัน ดู [Compaction](/th/concepts/compaction) |
    | `/stop` | ยกเลิกการรันปัจจุบัน |
    | `/session idle <duration\|off>` | จัดการการหมดอายุเมื่อไม่ได้ใช้งานของการผูกเธรด |
    | `/session max-age <duration\|off>` | จัดการการหมดอายุอายุสูงสุดของการผูกเธรด |
    | `/export-session [path]` | ส่งออกเซสชันปัจจุบันเป็น HTML นามแฝง: `/export` |
    | `/export-trajectory [path]` | ส่งออกบันเดิล trajectory แบบ JSONL สำหรับเซสชันปัจจุบัน นามแฝง: `/trajectory` |

    <Note>
      Control UI จะดักจับ `/new` ที่พิมพ์เพื่อสร้างและสลับไปยัง
      เซสชันแดชบอร์ดใหม่ ยกเว้นเมื่อกำหนดค่า `session.dmScope: "main"`
      และ parent ปัจจุบันเป็นเซสชันหลักของ agent — ในกรณีนั้น `/new`
      จะรีเซ็ตเซสชันหลักในที่เดิม `/reset` ที่พิมพ์ยังคงรันการรีเซ็ตในที่เดิมของ Gateway
      ใช้ `/model default` เมื่อต้องการล้างการเลือกโมเดลของเซสชันที่ปักไว้
    </Note>

  </Accordion>

  <Accordion title="โมเดลและตัวควบคุมการรัน">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/think <level\|default>` | ตั้งระดับการคิดหรือล้างการเขียนทับของเซสชัน นามแฝง: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | สลับเอาต์พุตแบบละเอียด นามแฝง: `/v` |
    | `/trace on\|off` | สลับเอาต์พุต trace ของ plugin สำหรับเซสชันปัจจุบัน |
    | `/fast [status\|auto\|on\|off\|default]` | แสดง ตั้งค่า หรือล้างโหมดเร็ว |
    | `/reasoning [on\|off\|stream]` | สลับการมองเห็น reasoning นามแฝง: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | สลับโหมด elevated นามแฝง: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | แสดงหรือตั้งค่าเริ่มต้นของ exec |
    | `/model [name\|#\|status]` | แสดงหรือตั้งค่าโมเดล |
    | `/models [provider] [page] [limit=<n>\|all]` | แสดงรายการผู้ให้บริการหรือโมเดลที่กำหนดค่า/มี auth พร้อมใช้งาน |
    | `/queue <mode>` | จัดการพฤติกรรมคิวของการรันที่ทำงานอยู่ ดู [คิว](/th/concepts/queue) และ [การบังคับทิศทางคิว](/th/concepts/queue-steering) |
    | `/steer <message>` | ฉีดคำแนะนำเข้าไปในการรันที่ทำงานอยู่ นามแฝง: `/tell` ดู [Steer](/th/tools/steer) |

    <AccordionGroup>
      <Accordion title="ความปลอดภัยของ verbose / trace / fast / reasoning">
        - `/verbose` ใช้สำหรับการดีบัก — ให้ **ปิด** ไว้ในการใช้งานปกติ
        - `/trace` เปิดเผยเฉพาะบรรทัด trace/debug ที่ plugin เป็นเจ้าของ; ข้อความ verbose ปกติยังคงปิดอยู่
        - `/fast auto|on|off` คงการเขียนทับของเซสชันไว้; ใช้ตัวเลือก `inherit` ใน Sessions UI เพื่อล้างค่า
        - `/fast` เฉพาะผู้ให้บริการ: OpenAI/Codex แมปเป็น `service_tier=priority`; คำขอ Anthropic โดยตรงแมปเป็น `service_tier=auto` หรือ `standard_only`
        - `/reasoning`, `/verbose`, และ `/trace` มีความเสี่ยงในสภาพแวดล้อมแบบกลุ่ม — อาจเปิดเผย reasoning ภายในหรือการวินิจฉัยของ plugin ให้ปิดไว้ในแชตกลุ่ม

      </Accordion>
      <Accordion title="รายละเอียดการสลับโมเดล">
        - `/model` คงโมเดลใหม่ลงในเซสชันทันที
        - หาก agent ไม่ได้ใช้งาน การรันถัดไปจะใช้ทันที
        - หากมีการรันทำงานอยู่ การสลับจะถูกทำเครื่องหมายว่ารอดำเนินการและนำไปใช้ที่จุดลองใหม่สะอาดถัดไป

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="การค้นพบและสถานะ">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/help` | แสดงสรุปความช่วยเหลือแบบสั้น |
    | `/commands` | แสดงแคตตาล็อกคำสั่งที่สร้างขึ้น |
    | `/tools [compact\|verbose]` | แสดงสิ่งที่ agent ปัจจุบันใช้ได้ในตอนนี้ |
    | `/status` | แสดงสถานะการดำเนินการ/รันไทม์, uptime ของ Gateway และระบบ, สุขภาพของ plugin รวมถึงการใช้งาน/โควตาของผู้ให้บริการ |
    | `/status plugins` | แสดงสุขภาพของ plugin โดยละเอียด: ข้อผิดพลาดในการโหลด, การกักกัน, ความล้มเหลวของช่องทาง, ปัญหาการพึ่งพา, ประกาศความเข้ากันได้ |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | จัดการ [เป้าหมาย](/th/tools/goal) ที่คงทนของเซสชันปัจจุบัน |
    | `/diagnostics [note]` | โฟลว์รายงานสนับสนุนเฉพาะเจ้าของ ขออนุมัติ exec ทุกครั้ง |
    | `/crestodian <request>` | รันตัวช่วยตั้งค่าและซ่อมแซม Crestodian จาก DM ของเจ้าของ |
    | `/tasks` | แสดงรายการงานพื้นหลังที่ทำงานอยู่/ล่าสุดสำหรับเซสชันปัจจุบัน |
    | `/context [list\|detail\|map\|json]` | อธิบายวิธีประกอบบริบท |
    | `/whoami` | แสดง id ผู้ส่งของคุณ นามแฝง: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | ควบคุมส่วนท้ายการใช้งานต่อการตอบกลับ (`reset`/`inherit`/`clear`/`default` จะล้างการเขียนทับของเซสชันเพื่อสืบทอดค่าเริ่มต้นที่กำหนดค่าไว้อีกครั้ง) หรือพิมพ์สรุปค่าใช้จ่ายในเครื่อง |
  </Accordion>

  <Accordion title="Skills, รายการอนุญาต, การอนุมัติ">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/skill <name> [input]` | รัน Skills ตามชื่อ |
    | `/allowlist [list\|add\|remove] ...` | จัดการรายการอนุญาต เฉพาะข้อความเท่านั้น |
    | `/approve <id> <decision>` | จัดการพรอมป์การอนุมัติ exec หรือ plugin |
    | `/btw <question>` | ถามคำถามข้างเคียงโดยไม่เปลี่ยนบริบทเซสชัน นามแฝง: `/side` ดู [BTW](/th/tools/btw) |
  </Accordion>

  <Accordion title="ตัวแทนย่อยและ ACP">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/subagents list\|log\|info` | ตรวจสอบการรันของตัวแทนย่อยสำหรับเซสชันปัจจุบัน |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | จัดการเซสชัน ACP และตัวเลือกรันไทม์ การควบคุมรันไทม์ต้องใช้ตัวตนเจ้าของภายนอกหรือผู้ดูแล Gateway ภายใน |
    | `/focus <target>` | ผูกเธรด Discord หรือหัวข้อ Telegram ปัจจุบันกับเป้าหมายเซสชัน |
    | `/unfocus` | ลบการผูกเธรดปัจจุบัน |
    | `/agents` | แสดงรายการตัวแทนที่ผูกกับเธรดสำหรับเซสชันปัจจุบัน |
  </Accordion>

  <Accordion title="การเขียนเฉพาะเจ้าของและผู้ดูแล">
    | คำสั่ง | ต้องใช้ | คำอธิบาย |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | อ่านหรือเขียน `openclaw.json` เฉพาะเจ้าของ |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | อ่านหรือเขียนการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการ เฉพาะเจ้าของ |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | ตรวจสอบหรือเปลี่ยนสถานะ Plugin เฉพาะเจ้าของสำหรับการเขียน นามแฝง: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | การแทนที่การกำหนดค่าเฉพาะรันไทม์ เฉพาะเจ้าของ |
    | `/restart` | `commands.restart: true` (ค่าเริ่มต้น) | รีสตาร์ท OpenClaw |
    | `/send on\|off\|inherit` | เจ้าของ | ตั้งค่านโยบายการส่ง |
  </Accordion>

  <Accordion title="เสียง, TTS, การควบคุมช่องทาง">
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

คำสั่ง Dock จะสลับเส้นทางตอบกลับของเซสชันที่ใช้งานอยู่ไปยังช่องทางที่เชื่อมโยงอีกช่องทางหนึ่ง
ดู [การ Dock ช่องทาง](/th/concepts/channel-docking) สำหรับการตั้งค่าและการแก้ปัญหา

สร้างจาก Plugin ช่องทางที่รองรับคำสั่งแบบเนทีฟ:

- `/dock-discord` (นามแฝง: `/dock_discord`)
- `/dock-mattermost` (นามแฝง: `/dock_mattermost`)
- `/dock-slack` (นามแฝง: `/dock_slack`)
- `/dock-telegram` (นามแฝง: `/dock_telegram`)

คำสั่ง Dock ต้องใช้ `session.identityLinks` ผู้ส่งต้นทางและเพียร์เป้าหมาย
ต้องอยู่ในกลุ่มตัวตนเดียวกัน

### คำสั่ง Plugin ที่รวมมาให้

| คำสั่ง                                                                                      | คำอธิบาย                                                                         |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | สลับการ Dreaming หน่วยความจำ (เจ้าของหรือผู้ดูแล Gateway) ดู [Dreaming](/th/concepts/dreaming) |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | จัดการการจับคู่อุปกรณ์ ดู [การจับคู่](/th/channels/pairing)                             |
| `/phone status\|arm ...\|disarm`                                                             | เตรียมพร้อมคำสั่งโหนดโทรศัพท์ความเสี่ยงสูงชั่วคราว                                       |
| `/voice status\|list\|set <voiceId>`                                                         | จัดการการกำหนดค่าเสียง Talk ชื่อเนทีฟของ Discord: `/talkvoice`                         |
| `/card ...`                                                                                  | ส่งพรีเซ็ตการ์ดแบบริชของ LINE ดู [LINE](/th/channels/line)                             |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | ควบคุมฮาร์เนสเซิร์ฟเวอร์แอป Codex ดู [ฮาร์เนส Codex](/th/plugins/codex-harness)   |

เฉพาะ QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### คำสั่ง Skills

Skills ที่ผู้ใช้เรียกใช้ได้จะแสดงเป็นคำสั่งสแลช:

- `/skill <name> [input]` ใช้งานได้เสมอในฐานะจุดเข้าใช้งานทั่วไป
- Skills อาจลงทะเบียนเป็นคำสั่งโดยตรง (เช่น `/prose` สำหรับ OpenProse)
- การลงทะเบียนคำสั่ง Skills แบบเนทีฟถูกควบคุมโดย `commands.nativeSkills` และ
  `channels.<provider>.commands.nativeSkills`
- ชื่อจะถูกทำให้ปลอดภัยเป็น `a-z0-9_` (สูงสุด 32 อักขระ); รายการที่ชนกันจะได้รับส่วนต่อท้ายเป็นตัวเลข

<AccordionGroup>
  <Accordion title="การส่งต่อคำสั่ง Skill">
    โดยค่าเริ่มต้น คำสั่ง Skills จะถูกส่งไปยังโมเดลเป็นคำขอปกติ

    Skills สามารถประกาศ `command-dispatch: tool` เพื่อส่งต่อไปยังเครื่องมือโดยตรง
    (กำหนดผลได้แน่นอน ไม่มีโมเดลเข้ามาเกี่ยวข้อง) ตัวอย่าง: `/prose` (Plugin OpenProse)
    — ดู [OpenProse](/th/prose)

  </Accordion>
  <Accordion title="อาร์กิวเมนต์คำสั่งแบบเนทีฟ">
    Discord ใช้การเติมข้อความอัตโนมัติสำหรับตัวเลือกแบบไดนามิกและเมนูปุ่มเมื่อมีการละเว้น
    อาร์กิวเมนต์ที่จำเป็น Telegram และ Slack แสดงเมนูปุ่มสำหรับคำสั่งที่มี
    ตัวเลือก ตัวเลือกแบบไดนามิกจะแก้ค่ากับโมเดลของเซสชันเป้าหมาย ดังนั้นตัวเลือกเฉพาะโมเดล
    เช่นระดับ `/think` จะตามการแทนที่ `/model` ของเซสชัน
  </Accordion>
</AccordionGroup>

## `/tools` — สิ่งที่ตัวแทนใช้ได้ตอนนี้

`/tools` ตอบคำถามรันไทม์: **ตัวแทนนี้ใช้สิ่งใดได้ตอนนี้ใน
บทสนทนานี้** — ไม่ใช่แค็ตตาล็อกการกำหนดค่าแบบคงที่

```text
/tools         # compact view
/tools verbose # with short descriptions
```

ผลลัพธ์มีขอบเขตตามเซสชัน การเปลี่ยนตัวแทน ช่องทาง เธรด ผู้ส่ง
การอนุญาต หรือโมเดลอาจเปลี่ยนผลลัพธ์ได้ สำหรับการแก้ไขโปรไฟล์และการแทนที่
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

บน Discord, `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบพร้อมดรอปดาวน์ผู้ให้บริการและ
โมเดล ตัวเลือกนี้เคารพ `agents.defaults.models` รวมถึง
รายการ `provider/*`

## `/config` — การเขียนการกำหนดค่าบนดิสก์

<Note>
  เฉพาะเจ้าของ ปิดใช้งานโดยค่าเริ่มต้น — เปิดใช้งานด้วย `commands.config: true`
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

การกำหนดค่าจะได้รับการตรวจสอบก่อนเขียน การเปลี่ยนแปลงที่ไม่ถูกต้องจะถูกปฏิเสธ `/config`
จะคงการอัปเดตไว้ข้ามการรีสตาร์ท

## `/mcp` — การกำหนดค่าเซิร์ฟเวอร์ MCP

<Note>
  เฉพาะเจ้าของ ปิดใช้งานโดยค่าเริ่มต้น — เปิดใช้งานด้วย `commands.mcp: true`
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` เก็บการกำหนดค่าไว้ในการกำหนดค่า OpenClaw ไม่ใช่การตั้งค่าโปรเจกต์ของตัวแทนที่ฝังอยู่

## `/debug` — การแทนที่เฉพาะรันไทม์

<Note>
  เฉพาะเจ้าของ ปิดใช้งานโดยค่าเริ่มต้น — เปิดใช้งานด้วย `commands.debug: true`
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
  เฉพาะเจ้าของสำหรับการเขียน ปิดใช้งานโดยค่าเริ่มต้น — เปิดใช้งานด้วย `commands.plugins: true`
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` อัปเดตการกำหนดค่า Plugin และรีโหลดรันไทม์
Plugin ของ Gateway แบบร้อนสำหรับรอบตัวแทนใหม่ `/plugins install` รีสตาร์ท Gateway
ที่จัดการโดยอัตโนมัติ เพราะโมดูลซอร์สของ Plugin เปลี่ยนไป

## `/trace` — เอาต์พุตการติดตาม Plugin

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` เปิดเผยบรรทัดการติดตาม/ดีบัก Plugin ที่มีขอบเขตตามเซสชันโดยไม่ต้องใช้โหมด
ละเอียดเต็มรูปแบบ มันไม่แทนที่ `/debug` (การแทนที่รันไทม์) หรือ `/verbose` (เอาต์พุต
เครื่องมือปกติ)

## `/btw` — คำถามแทรก

`/btw` คือคำถามแทรกอย่างรวดเร็วเกี่ยวกับบริบทเซสชันปัจจุบัน นามแฝง: `/side`

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

ต่างจากข้อความปกติ:

- ใช้เซสชันปัจจุบันเป็นบริบทเบื้องหลัง
- ในเซสชันฮาร์เนส Codex จะรันเป็นเธรดข้างของ Codex แบบชั่วคราว
- **ไม่** เปลี่ยนบริบทเซสชันในอนาคต
- ไม่ถูกเขียนลงในประวัติทรานสคริปต์

ดู [คำถามแทรก BTW](/th/tools/btw) สำหรับพฤติกรรมทั้งหมด

## หมายเหตุพื้นผิว

<AccordionGroup>
  <Accordion title="การกำหนดขอบเขตเซสชันต่อพื้นผิว">
    - **คำสั่งข้อความ:** รันในเซสชันแชตปกติ (DM ใช้ `main` ร่วมกัน กลุ่มมีเซสชันของตนเอง)
    - **คำสั่ง Discord แบบเนทีฟ:** `agent:<agentId>:discord:slash:<userId>`
    - **คำสั่ง Slack แบบเนทีฟ:** `agent:<agentId>:slack:slash:<userId>` (กำหนดคำนำหน้าได้ผ่าน `channels.slack.slashCommand.sessionPrefix`)
    - **คำสั่ง Telegram แบบเนทีฟ:** `telegram:slash:<userId>` (กำหนดเป้าหมายไปยังเซสชันแชตผ่าน `CommandTargetSessionKey`)
    - **`/stop`** กำหนดเป้าหมายไปยังเซสชันแชตที่ใช้งานอยู่เพื่อยกเลิกการรันปัจจุบัน

  </Accordion>
  <Accordion title="รายละเอียดเฉพาะของ Slack">
    `channels.slack.slashCommand` รองรับคำสั่งสไตล์ `/openclaw` เพียงคำสั่งเดียว
    เมื่อใช้ `commands.native: true` ให้สร้างคำสั่งสแลช Slack หนึ่งรายการต่อคำสั่ง
    ในตัวแต่ละคำสั่ง ลงทะเบียน `/agentstatus` (ไม่ใช่ `/status`) เพราะ Slack สงวน
    `/status` ไว้ ข้อความ `/status` ยังคงใช้ได้ในข้อความ Slack
  </Accordion>
  <Accordion title="เส้นทางเร็วและทางลัดแบบอินไลน์">
    - ข้อความที่มีแต่คำสั่งจากผู้ส่งใน allowlist จะถูกจัดการทันที (ข้ามคิว + โมเดล)
    - ทางลัดแบบอินไลน์ (`/help`, `/commands`, `/status`, `/whoami`) ใช้งานได้เมื่อฝังในข้อความปกติด้วย และจะถูกตัดออกก่อนที่โมเดลจะเห็นข้อความที่เหลือ
    - ข้อความที่มีแต่คำสั่งจากผู้ที่ไม่ได้รับอนุญาตจะถูกเพิกเฉยอย่างเงียบ ๆ; โทเค็น `/...` แบบอินไลน์จะถูกถือเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="หมายเหตุอาร์กิวเมนต์">
    - คำสั่งยอมรับ `:` ที่เป็นตัวเลือกได้ระหว่างคำสั่งและอาร์กิวเมนต์ (`/think: high`, `/send: on`)
    - `/new <model>` ยอมรับนามแฝงโมเดล, `provider/model`, หรือชื่อผู้ให้บริการ (จับคู่แบบไม่ชัดเจน); หากไม่พบรายการที่ตรงกัน ข้อความจะถูกถือเป็นเนื้อหาข้อความ
    - `/allowlist add|remove` ต้องใช้ `commands.config: true` และเคารพ `configWrites` ของช่องทาง

  </Accordion>
</AccordionGroup>

## การใช้งานและสถานะของผู้ให้บริการ

- **การใช้งาน/โควตาผู้ให้บริการ** (เช่น "Claude เหลือ 80%") แสดงใน `/status` สำหรับผู้ให้บริการโมเดลปัจจุบันเมื่อเปิดใช้การติดตามการใช้งาน
- **บรรทัดโทเค็น/แคช** ใน `/status` สามารถย้อนกลับไปใช้รายการการใช้งานทรานสคริปต์ล่าสุดได้เมื่อสแนปช็อตเซสชันสดมีข้อมูลเบาบาง
- **การดำเนินการเทียบกับรันไทม์:** `/status` รายงาน `Execution` สำหรับพาธแซนด์บ็อกซ์ที่มีผล และ `Runtime` สำหรับผู้ที่กำลังรันเซสชัน: `OpenClaw Default`, `OpenAI Codex`, แบ็กเอนด์ CLI หรือแบ็กเอนด์ ACP
- **โทเค็น/ค่าใช้จ่ายต่อคำตอบ:** ควบคุมโดย `/usage off|tokens|full`
- `/model status` เกี่ยวกับโมเดล/การยืนยันตัวตน/เอ็นด์พอยต์ ไม่ใช่การใช้งาน

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Skills" href="/th/tools/skills" icon="puzzle-piece">
    วิธีลงทะเบียนและควบคุมสิทธิ์คำสั่งสแลชของ Skills
  </Card>
  <Card title="การสร้าง Skills" href="/th/tools/creating-skills" icon="hammer">
    สร้าง Skill ที่ลงทะเบียนคำสั่งสแลชของตัวเอง
  </Card>
  <Card title="BTW" href="/th/tools/btw" icon="comments">
    คำถามแทรกโดยไม่เปลี่ยนบริบทเซสชัน
  </Card>
  <Card title="Steer" href="/th/tools/steer" icon="compass">
    นำทางตัวแทนระหว่างรันด้วย `/steer`
  </Card>
</CardGroup>
