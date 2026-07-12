---
read_when:
    - การใช้หรือกำหนดค่าคำสั่งแชต
    - การแก้ไขข้อบกพร่องในการกำหนดเส้นทางคำสั่งหรือสิทธิ์การใช้งาน
    - ทำความเข้าใจวิธีการลงทะเบียนคำสั่งของ Skills
sidebarTitle: Slash commands
summary: คำสั่งแบบสแลช ไดเรกทิฟ และทางลัดแบบอินไลน์ทั้งหมดที่พร้อมใช้งาน — การกำหนดค่า การกำหนดเส้นทาง และลักษณะการทำงานของแต่ละพื้นผิว
title: คำสั่งแบบสแลช
x-i18n:
    generated_at: "2026-07-12T16:48:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0017f229610ff5b1f4ff4a11a77814575835cfd07c7d4dbcce8b0d51ed4f4dd1
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway จัดการคำสั่งที่ส่งเป็นข้อความเดี่ยวซึ่งขึ้นต้นด้วย `/`
คำสั่ง bash ที่ใช้ได้เฉพาะบนโฮสต์ใช้ `! <cmd>` (โดยมี `/bash <cmd>` เป็นนามแฝง)

เมื่อการสนทนาผูกกับเซสชัน ACP ข้อความปกติจะถูกส่งไปยัง
ชุดควบคุม ACP ส่วนคำสั่งจัดการ Gateway ยังคงทำงานภายในเครื่อง: `/acp ...` จะส่งถึง
ตัวจัดการคำสั่งของ OpenClaw เสมอ และ `/status` รวมถึง `/unfocus` จะยังคงทำงานภายในเครื่อง
เมื่อเปิดใช้งานการจัดการคำสั่งสำหรับพื้นผิวนั้น

## คำสั่งสามประเภท

<CardGroup cols={3}>
  <Card title="คำสั่ง" icon="terminal">
    ข้อความ `/...` แบบเดี่ยวที่ Gateway จัดการ โดยต้องส่งเป็น
    เนื้อหาเพียงอย่างเดียวในข้อความ
  </Card>
  <Card title="คำสั่งกำกับ" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — จะถูกนำออกจากข้อความก่อนที่โมเดล
    จะเห็น เมื่อส่งเพียงอย่างเดียวจะบันทึกการตั้งค่าของเซสชันไว้ เมื่อส่งพร้อม
    ข้อความอื่นจะทำหน้าที่เป็นคำแนะนำแบบแทรกในข้อความ
  </Card>
  <Card title="ทางลัดแบบแทรกในข้อความ" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — ทำงานทันทีและจะถูก
    นำออกก่อนที่โมเดลจะเห็นข้อความส่วนที่เหลือ ใช้ได้เฉพาะผู้ส่งที่ได้รับอนุญาต
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="รายละเอียดพฤติกรรมของคำสั่งกำกับ">
    - คำสั่งกำกับจะถูกนำออกจากข้อความก่อนที่โมเดลจะเห็น
    - ในข้อความที่มี **เฉพาะคำสั่งกำกับ** (ข้อความประกอบด้วยคำสั่งกำกับเท่านั้น) คำสั่งเหล่านี้
      จะถูกบันทึกไว้ในเซสชันและตอบกลับด้วยข้อความยืนยัน
    - ในข้อความ **แชตปกติ** ที่มีข้อความอื่นร่วมด้วย คำสั่งเหล่านี้จะทำหน้าที่เป็นคำแนะนำแบบแทรกในข้อความและ
      **ไม่** บันทึกการตั้งค่าของเซสชัน
    - คำสั่งกำกับมีผลเฉพาะกับ **ผู้ส่งที่ได้รับอนุญาต** หากกำหนด `commands.allowFrom`
      ระบบจะใช้รายการอนุญาตนี้เพียงรายการเดียว มิฉะนั้น การอนุญาตจะมาจาก
      รายการอนุญาตของช่องทาง/การจับคู่ ร่วมกับ `commands.useAccessGroups` สำหรับผู้ส่งที่ไม่ได้รับอนุญาต
      ระบบจะถือว่าคำสั่งกำกับเป็นข้อความธรรมดา
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
  เปิดใช้การแยกวิเคราะห์ `/...` ในข้อความแชต สำหรับพื้นผิวที่ไม่มีคำสั่งแบบเนทีฟ
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) คำสั่งแบบข้อความ
  จะทำงานแม้ตั้งค่าเป็น `false`
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่งแบบเนทีฟ โหมดอัตโนมัติ: เปิดสำหรับ Discord/Telegram และปิดสำหรับ Slack
  โดยจะไม่สนใจค่านี้สำหรับผู้ให้บริการที่ไม่รองรับคำสั่งแบบเนทีฟ กำหนดทับแยกตามช่องทางได้ด้วย
  `channels.<provider>.commands.native` สำหรับ Discord ค่า `false` จะข้ามการลงทะเบียน
  คำสั่งแบบเครื่องหมายทับ ส่วนคำสั่งที่ลงทะเบียนไว้ก่อนหน้านี้อาจยังคงปรากฏจนกว่าจะถูกนำออก
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่ง Skills แบบเนทีฟเมื่อรองรับ โหมดอัตโนมัติ: เปิดสำหรับ
  Discord/Telegram และปิดสำหรับ Slack กำหนดทับได้ด้วย
  `channels.<provider>.commands.nativeSkills`
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  เปิดใช้ `! <cmd>` เพื่อเรียกใช้คำสั่งเชลล์ของโฮสต์ (นามแฝง `/bash <cmd>`) ต้องมี
  รายการอนุญาตของ `tools.elevated`
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  ระยะเวลาที่ bash รอก่อนเปลี่ยนไปทำงานในเบื้องหลัง (`0` จะเปลี่ยนเป็น
  เบื้องหลังทันที)
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`) ใช้ได้เฉพาะเจ้าของ
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  เปิดใช้ `/mcp` (อ่าน/เขียนการกำหนดค่า MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`) ใช้ได้เฉพาะเจ้าของ
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  เปิดใช้ `/plugins` (การค้นหา/สถานะ Plugin รวมถึงการติดตั้งและการเปิด/ปิดใช้งาน) การเขียนใช้ได้เฉพาะเจ้าของ
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  เปิดใช้ `/debug` (กำหนดทับการตั้งค่าเฉพาะขณะรัน) ใช้ได้เฉพาะเจ้าของ
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  เปิดใช้ `/restart` และการดำเนินการของเครื่องมือสำหรับเริ่ม Gateway ใหม่
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  รายการอนุญาตเจ้าของแบบระบุชัดเจนสำหรับพื้นผิวคำสั่งที่ใช้ได้เฉพาะเจ้าของ โดยแยกจาก
  `commands.allowFrom` และสิทธิ์เข้าถึงจากการจับคู่ข้อความส่วนตัว
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  กำหนดแยกตามช่องทาง: กำหนดให้คำสั่งเฉพาะเจ้าของต้องใช้ข้อมูลประจำตัวของเจ้าของ เมื่อเป็น `true`
  ผู้ส่งต้องตรงกับ `commands.ownerAllowFrom` หรือมีขอบเขต `operator.admin`
  ภายใน รายการ `allowFrom` ที่ใช้ไวลด์การ์ดเพียงอย่างเดียว **ไม่** เพียงพอ
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  ควบคุมวิธีแสดงรหัสเจ้าของในพรอมต์ระบบ
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  ข้อมูลลับ HMAC ที่ใช้เมื่อกำหนด `commands.ownerDisplay: "hash"`
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  รายการอนุญาตแยกตามผู้ให้บริการสำหรับการให้สิทธิ์คำสั่ง เมื่อกำหนดค่าแล้ว รายการนี้จะเป็น
  แหล่งที่มา **เพียงแหล่งเดียว** สำหรับการให้สิทธิ์คำสั่งและข้อกำหนด ใช้ `"*"` เป็น
  ค่าเริ่มต้นส่วนกลาง โดยคีย์เฉพาะผู้ให้บริการจะมีลำดับความสำคัญเหนือกว่า
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  บังคับใช้รายการอนุญาต/นโยบายสำหรับคำสั่งเมื่อไม่ได้ตั้งค่า `commands.allowFrom`
</ParamField>

## รายการคำสั่ง

คำสั่งมาจากสามแหล่ง:

- **คำสั่งในตัวของแกนหลัก:** `src/auto-reply/commands-registry.shared.ts`
- **คำสั่งด็อกที่สร้างขึ้น:** `src/auto-reply/commands-registry.data.ts`
- **คำสั่งของ Plugin:** การเรียก `registerCommand()` ของ Plugin

ความพร้อมใช้งานขึ้นอยู่กับแฟล็กการกำหนดค่า พื้นผิวของช่องทาง และ Plugin
ที่ติดตั้ง/เปิดใช้งาน

### คำสั่งแกนหลัก

  <AccordionGroup>
  <Accordion title="เซสชันและการเรียกใช้">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/new [model]` | เก็บเซสชันปัจจุบันไว้ในคลังและเริ่มเซสชันใหม่ |
    | `/reset [soft [message]]` | รีเซ็ตเซสชันปัจจุบันภายในเซสชันเดิม `soft` จะเก็บทรานสคริปต์ไว้ ลบรหัสเซสชันแบ็กเอนด์ CLI ที่นำกลับมาใช้ซ้ำ และเรียกใช้ขั้นตอนเริ่มต้นอีกครั้ง |
    | `/name <title>` | ตั้งชื่อหรือเปลี่ยนชื่อเซสชันปัจจุบัน ละเว้นชื่อเรื่องเพื่อดูชื่อปัจจุบันและชื่อที่แนะนำ |
    | `/compact [instructions]` | กระชับบริบทของเซสชัน ดู [Compaction](/th/concepts/compaction) |
    | `/stop` | ยกเลิกการเรียกใช้ปัจจุบัน |
    | `/session idle <duration\|off>` | จัดการการหมดอายุเมื่อไม่มีการใช้งานของการผูกเธรด |
    | `/session max-age <duration\|off>` | จัดการการหมดอายุตามอายุสูงสุดของการผูกเธรด |
    | `/export-session [path]` | ส่งออกเซสชันปัจจุบันเป็น HTML นามแฝง: `/export` |
    | `/export-trajectory [path]` | ส่งออกชุดข้อมูลเส้นทางการทำงานแบบ JSONL สำหรับเซสชันปัจจุบัน นามแฝง: `/trajectory` |

    <Note>
      Control UI จะดักจับ `/new` ที่พิมพ์เข้ามาเพื่อสร้างและสลับไปยัง
      เซสชันแดชบอร์ดใหม่ ยกเว้นเมื่อกำหนดค่า `session.dmScope: "main"`
      และเซสชันแม่ปัจจุบันเป็นเซสชันหลักของเอเจนต์ — ในกรณีนั้น `/new`
      จะรีเซ็ตเซสชันหลักภายในเซสชันเดิม ส่วน `/reset` ที่พิมพ์เข้ามายังคงเรียกใช้
      การรีเซ็ตภายในเซสชันเดิมของ Gateway ใช้ `/model default` เมื่อต้องการล้าง
      การเลือกโมเดลที่ปักหมุดไว้สำหรับเซสชัน
    </Note>

  </Accordion>

  <Accordion title="การควบคุมโมเดลและการเรียกใช้">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/think <level\|default>` | ตั้งค่าระดับการคิดหรือล้างค่าที่แทนที่สำหรับเซสชัน นามแฝง: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | เปิดหรือปิดเอาต์พุตแบบละเอียด นามแฝง: `/v` |
    | `/trace on\|off` | เปิดหรือปิดเอาต์พุตการติดตามของ Plugin สำหรับเซสชันปัจจุบัน |
    | `/fast [status\|auto\|on\|off\|default]` | แสดง ตั้งค่า หรือล้างโหมดเร็ว |
    | `/reasoning [on\|off\|stream]` | เปิดหรือปิดการแสดงเหตุผล นามแฝง: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | เปิดหรือปิดโหมดสิทธิ์ระดับสูง นามแฝง: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | แสดงหรือตั้งค่าเริ่มต้นของการดำเนินการ |
    | `/login [codex\|openai\|openai-codex]` | จับคู่การเข้าสู่ระบบ Codex/OpenAI จากแชตส่วนตัวหรือเซสชัน Web UI เฉพาะเจ้าของ/ผู้ดูแลระบบเท่านั้น |
    | `/model [name\|#\|status]` | แสดงหรือตั้งค่าโมเดล |
    | `/models [provider] [page] [limit=<n>\|all]` | แสดงรายการผู้ให้บริการหรือโมเดลที่กำหนดค่าไว้หรือพร้อมใช้งานผ่านการยืนยันตัวตน |
    | `/queue <mode>` | จัดการลักษณะการทำงานของคิวการเรียกใช้ที่กำลังทำงาน ดู [คิว](/th/concepts/queue) และ [การกำกับคิว](/th/concepts/queue-steering) |
    | `/steer <message>` | แทรกคำแนะนำลงในการเรียกใช้ที่กำลังทำงาน นามแฝง: `/tell` ดู [การกำกับ](/th/tools/steer) |

    <AccordionGroup>
      <Accordion title="ความปลอดภัยของ verbose / trace / fast / reasoning">
        - `/verbose` ใช้สำหรับการแก้ไขข้อบกพร่อง — ควรตั้งเป็น **off** ในการใช้งานปกติ
        - `/trace` แสดงเฉพาะบรรทัดการติดตาม/แก้ไขข้อบกพร่องที่ Plugin เป็นเจ้าของ ส่วนข้อความแบบละเอียดทั่วไปจะยังคงปิดอยู่
        - `/fast auto|on|off` จะเก็บค่าที่แทนที่ของเซสชันไว้ ใช้ตัวเลือก `inherit` ใน Sessions UI เพื่อล้างค่านี้
        - `/fast` มีลักษณะเฉพาะตามผู้ให้บริการ: OpenAI/Codex จะแมปเป็น `service_tier=priority` ส่วนคำขอโดยตรงไปยัง Anthropic จะแมปเป็น `service_tier=auto` หรือ `standard_only`
        - `/reasoning`, `/verbose` และ `/trace` มีความเสี่ยงเมื่อใช้ในการสนทนาแบบกลุ่ม — อาจเปิดเผยกระบวนการให้เหตุผลภายในหรือข้อมูลวินิจฉัยของ Plugin ควรปิดไว้ในการแชตกลุ่ม

      </Accordion>
      <Accordion title="รายละเอียดการสลับโมเดล">
        - `/model` บันทึกโมเดลใหม่ลงในเซสชันทันที
        - หากเอเจนต์ไม่ได้ทำงาน การเรียกใช้ครั้งถัดไปจะใช้โมเดลนั้นทันที
        - หากกำลังมีการเรียกใช้อยู่ การสลับจะถูกทำเครื่องหมายว่ารอดำเนินการ และนำไปใช้ ณ จุดลองใหม่ที่พร้อมสมบูรณ์ถัดไป

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="การค้นหาและสถานะ">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/help` | แสดงสรุปวิธีใช้แบบย่อ |
    | `/commands` | แสดงรายการคำสั่งที่สร้างขึ้น |
    | `/tools [compact\|verbose]` | แสดงสิ่งที่เอเจนต์ปัจจุบันสามารถใช้งานได้ในขณะนี้ |
    | `/status` | แสดงสถานะการดำเนินการ/รันไทม์ ระยะเวลาทำงานของ Gateway และระบบ สถานะการทำงานของ Plugin รวมถึงการใช้งาน/โควตาของผู้ให้บริการ |
    | `/status plugins` | แสดงรายละเอียดสถานะการทำงานของ Plugin ได้แก่ ข้อผิดพลาดในการโหลด การกักกัน ความล้มเหลวของ Plugin ช่องทาง ปัญหาการขึ้นต่อกัน และการแจ้งเตือนความเข้ากันได้ ต้องเปิดใช้ `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | จัดการ[เป้าหมาย](/th/tools/goal)แบบถาวรของเซสชันปัจจุบัน |
    | `/diagnostics [note]` | ขั้นตอนรายงานเพื่อขอรับการสนับสนุนสำหรับเจ้าของเท่านั้น โดยจะขออนุมัติการดำเนินการทุกครั้ง |
    | `/crestodian <request>` | เรียกใช้ตัวช่วยตั้งค่าและซ่อมแซม Crestodian จากข้อความส่วนตัวของเจ้าของ |
    | `/tasks` | แสดงรายการงานเบื้องหลังที่กำลังทำงาน/เพิ่งทำงานของเซสชันปัจจุบัน |
    | `/context [list\|detail\|map\|json]` | อธิบายวิธีประกอบบริบท |
    | `/whoami` | แสดงรหัสผู้ส่งของคุณ นามแฝง: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | ควบคุมส่วนท้ายแสดงการใช้งานต่อการตอบกลับ (`reset`/`inherit`/`clear`/`default` จะล้างค่าที่เขียนทับในเซสชัน เพื่อกลับไปรับช่วงค่าเริ่มต้นที่กำหนดไว้) หรือแสดงสรุปค่าใช้จ่ายภายในเครื่อง |
  </Accordion>

  <Accordion title="Skills, รายการที่อนุญาต และการอนุมัติ">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/skill <name> [input]` | เรียกใช้ Skills ตามชื่อ |
    | `/learn [request]` | ร่าง Skills หนึ่งรายการที่ตรวจทานได้จากบทสนทนาปัจจุบันหรือแหล่งข้อมูลที่ระบุ ผ่าน[เวิร์กช็อป Skills](/th/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | จัดการรายการในบัญชีที่อนุญาต รองรับเฉพาะข้อความ |
    | `/approve <id> <decision>` | ดำเนินการกับคำขออนุมัติการดำเนินการหรือ Plugin |
    | `/btw <question>` | ถามคำถามนอกประเด็นโดยไม่เปลี่ยนบริบทของเซสชัน นามแฝง: `/side` ดู [BTW](/th/tools/btw) |
  </Accordion>

  <Accordion title="เอเจนต์ย่อยและ ACP">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/subagents list\|log\|info` | ตรวจสอบการทำงานของเอเจนต์ย่อยสำหรับเซสชันปัจจุบัน |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | จัดการเซสชัน ACP และตัวเลือกรันไทม์ การควบคุมรันไทม์ต้องใช้ตัวตนของเจ้าของภายนอกหรือผู้ดูแล Gateway ภายใน |
    | `/focus <target>` | ผูกเธรด Discord หรือหัวข้อ Telegram ปัจจุบันกับเป้าหมายเซสชัน |
    | `/unfocus` | ยกเลิกการผูกเธรดปัจจุบัน |
    | `/agents` | แสดงรายการเอเจนต์ที่ผูกกับเธรดสำหรับเซสชันปัจจุบัน |
  </Accordion>

  <Accordion title="การเขียนที่จำกัดเฉพาะเจ้าของและการดูแลระบบ">
    | คำสั่ง | ข้อกำหนด | คำอธิบาย |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | อ่านหรือเขียน `openclaw.json` เฉพาะเจ้าของเท่านั้น |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | อ่านหรือเขียนการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการ เฉพาะเจ้าของเท่านั้น |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | ตรวจสอบหรือแก้ไขสถานะ Plugin การเขียนจำกัดเฉพาะเจ้าของเท่านั้น นามแฝง: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | การแทนที่การกำหนดค่าที่มีผลเฉพาะรันไทม์ เฉพาะเจ้าของเท่านั้น |
    | `/restart` | `commands.restart: true` (ค่าเริ่มต้น) | เริ่ม OpenClaw ใหม่ |
    | `/send on\|off\|inherit` | เจ้าของ | กำหนดนโยบายการส่ง |
  </Accordion>

  <Accordion title="เสียงพูด, TTS และการควบคุมช่องทาง">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | ควบคุม TTS ดู [TTS](/th/tools/tts) |
    | `/activation mention\|always` | กำหนดโหมดการเปิดใช้งานในกลุ่ม |
    | `/bash <command>` | เรียกใช้คำสั่งเชลล์บนโฮสต์ นามแฝง: `! <command>` ต้องใช้ `commands.bash: true` |
    | `!poll [sessionId]` | ตรวจสอบงาน bash เบื้องหลัง |
    | `!stop [sessionId]` | หยุดงาน bash เบื้องหลัง |
  </Accordion>
</AccordionGroup>

### คำสั่ง Dock

คำสั่ง Dock สลับเส้นทางการตอบกลับของเซสชันที่ใช้งานอยู่ไปยังช่องทางอื่นที่เชื่อมโยงไว้
ดูการตั้งค่าและการแก้ไขปัญหาที่ [การเชื่อมต่อช่องทาง](/th/concepts/channel-docking)

สร้างจาก Plugin ช่องทางที่รองรับคำสั่งแบบเนทีฟ:

- `/dock-discord` (นามแฝง: `/dock_discord`)
- `/dock-mattermost` (นามแฝง: `/dock_mattermost`)
- `/dock-slack` (นามแฝง: `/dock_slack`)
- `/dock-telegram` (นามแฝง: `/dock_telegram`)

คำสั่ง Dock ต้องใช้ `session.identityLinks` ผู้ส่งต้นทางและเพียร์เป้าหมาย
ต้องอยู่ในกลุ่มตัวตนเดียวกัน

### คำสั่ง Plugin ที่รวมมาให้

| คำสั่ง                                                  | คำอธิบาย                                                                                                                                                                                       |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | เปิดหรือปิด Dreaming ของหน่วยความจำ (เจ้าของหรือผู้ดูแล Gateway) ดู [Dreaming](/th/concepts/dreaming)                                                                                             |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | จัดการการจับคู่อุปกรณ์ ดู [การจับคู่](/th/channels/pairing)                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | เปิดใช้งานคำสั่ง Node ที่มีความเสี่ยงสูงชั่วคราว (กล้อง/หน้าจอ/คอมพิวเตอร์/การเขียนข้อมูล) ดู [การใช้คอมพิวเตอร์](/th/nodes/computer-use)                                                         |
| `/voice status\|list\|set <voiceId>`                    | จัดการการกำหนดค่าเสียง Talk ชื่อแบบเนทีฟใน Discord: `/talkvoice`                                                                                                                               |
| `/card ...`                                             | ส่งชุดบัตรแบบสมบูรณ์ของ LINE ดู [LINE](/th/channels/line)                                                                                                                                          |
| `/codex <action> ...`                                   | ผูก ควบคุมทิศทาง และตรวจสอบชุดทดสอบ app-server ของ Codex (สถานะ, เธรด, ดำเนินการต่อ, โมเดล, โหมดเร็ว, สิทธิ์, การย่อ, การตรวจทาน, MCP, Skills และอื่น ๆ) ดู [ชุดทดสอบ Codex](/th/plugins/codex-harness) |

เฉพาะ QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### คำสั่ง Skills

Skills ที่ผู้ใช้เรียกใช้ได้จะแสดงเป็นคำสั่งแบบทับ:

- `/skill <name> [input]` ใช้งานเป็นจุดเริ่มต้นทั่วไปได้เสมอ
- Skills อาจลงทะเบียนเป็นคำสั่งโดยตรง (เช่น `/prose` สำหรับ OpenProse)
- การลงทะเบียนคำสั่ง Skills แบบเนทีฟควบคุมด้วย `commands.nativeSkills` และ
  `channels.<provider>.commands.nativeSkills`
- ชื่อจะถูกปรับให้อยู่ในรูปแบบ `a-z0-9_` (สูงสุด 32 อักขระ) หากชื่อซ้ำกันจะเพิ่มส่วนต่อท้ายเป็นตัวเลข

<AccordionGroup>
  <Accordion title="การส่งต่อคำสั่ง Skills">
    โดยค่าเริ่มต้น คำสั่ง Skills จะถูกส่งไปยังโมเดลในรูปแบบคำขอปกติ

    Skills สามารถประกาศ `command-dispatch: tool` เพื่อส่งตรงไปยังเครื่องมือ
    (ผลลัพธ์แน่นอนและไม่มีโมเดลเข้ามาเกี่ยวข้อง) ตัวอย่าง: `/prose` (Plugin OpenProse)
    — ดู [OpenProse](/th/prose)

  </Accordion>
  <Accordion title="อาร์กิวเมนต์ของคำสั่งแบบเนทีฟ">
    Discord ใช้การเติมข้อความอัตโนมัติสำหรับตัวเลือกแบบไดนามิกและเมนูปุ่มเมื่อไม่มี
    อาร์กิวเมนต์ที่จำเป็น Telegram และ Slack แสดงเมนูปุ่มสำหรับคำสั่งที่มี
    ตัวเลือก ตัวเลือกแบบไดนามิกจะอ้างอิงตามโมเดลของเซสชันเป้าหมาย ดังนั้นตัวเลือก
    เฉพาะโมเดล เช่น ระดับของ `/think` จะเป็นไปตามการแทนที่ `/model` ของเซสชัน
  </Accordion>
</AccordionGroup>

## `/tools`: สิ่งที่เอเจนต์ใช้ได้ในขณะนี้

`/tools` ตอบคำถามเกี่ยวกับรันไทม์ว่า: **เอเจนต์นี้สามารถใช้อะไรได้บ้างในขณะนี้ภายใน
การสนทนานี้** — ไม่ใช่แค็ตตาล็อกการกำหนดค่าแบบคงที่

```text
/tools         # มุมมองแบบย่อ
/tools verbose # พร้อมคำอธิบายสั้น ๆ
```

ผลลัพธ์มีขอบเขตเฉพาะเซสชัน การเปลี่ยนเอเจนต์ ช่องทาง เธรด การอนุญาต
ของผู้ส่ง หรือโมเดลอาจทำให้ผลลัพธ์เปลี่ยนไป สำหรับการแก้ไขโปรไฟล์และการแทนที่
ให้ใช้แผงเครื่องมือของ Control UI หรือส่วนการกำหนดค่า

## `/model`: การเลือกโมเดล

```text
/model             # แสดงตัวเลือกโมเดล
/model list        # เหมือนกัน
/model 3           # เลือกตามหมายเลขจากตัวเลือก
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # ล้างการเลือกโมเดลของเซสชัน
/model status      # มุมมองโดยละเอียดพร้อมปลายทางและโหมด API
```

ใน Discord คำสั่ง `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบที่มีรายการแบบเลื่อนลง
สำหรับผู้ให้บริการและโมเดล ตัวเลือกนี้ปฏิบัติตาม `agents.defaults.models` รวมถึง
รายการ `provider/*`

## `/config`: การเขียนการกำหนดค่าลงดิสก์

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

การกำหนดค่าจะผ่านการตรวจสอบก่อนเขียน การเปลี่ยนแปลงที่ไม่ถูกต้องจะถูกปฏิเสธ การอัปเดตด้วย `/config`
จะยังคงอยู่หลังการเริ่มระบบใหม่

## `/mcp`: การกำหนดค่าเซิร์ฟเวอร์ MCP

<Note>
  เฉพาะเจ้าของเท่านั้น ปิดใช้งานโดยค่าเริ่มต้น — เปิดใช้งานด้วย `commands.mcp: true`
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` จัดเก็บการกำหนดค่าไว้ในการกำหนดค่าของ OpenClaw ไม่ใช่การตั้งค่าโครงการของเอเจนต์แบบฝัง
`/mcp show` จะปกปิดฟิลด์ที่มีข้อมูลประจำตัว ค่าของแฟล็กข้อมูลประจำตัวที่รู้จัก
และอาร์กิวเมนต์ที่มีรูปแบบคล้ายข้อมูลลับ เมื่อเรียกใช้จากกลุ่ม
การกำหนดค่าจะถูกส่งแบบส่วนตัวไปยังเจ้าของ หากไม่มีเส้นทางส่วนตัวไปยังเจ้าของ
คำสั่งจะปฏิเสธการทำงานเพื่อความปลอดภัยและขอให้เจ้าของลองใหม่จากแชตโดยตรง

## `/debug`: การแทนที่เฉพาะรันไทม์

<Note>
  เฉพาะเจ้าของเท่านั้น ปิดใช้งานโดยค่าเริ่มต้น — เปิดใช้งานด้วย `commands.debug: true`
  การแทนที่จะมีผลทันทีกับการอ่านการกำหนดค่าครั้งใหม่ แต่จะ **ไม่** เขียนลงดิสก์
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins`: การจัดการ Plugin

<Note>
  การเขียนจำกัดเฉพาะเจ้าของเท่านั้น ปิดใช้งานโดยค่าเริ่มต้น — เปิดใช้งานด้วย `commands.plugins: true`
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` อัปเดตการกำหนดค่า Plugin และโหลดรันไทม์ Plugin ของ Gateway
ใหม่แบบทันทีสำหรับรอบการทำงานใหม่ของเอเจนต์ `/plugins install` จะเริ่ม Gateway
ที่มีการจัดการใหม่โดยอัตโนมัติ เนื่องจากโมดูลซอร์สของ Plugin มีการเปลี่ยนแปลง

## `/trace`: ผลลัพธ์การติดตามของ Plugin

```text
/trace          # แสดงสถานะการติดตามปัจจุบัน
/trace on
/trace off
```

`/trace` แสดงบรรทัดการติดตาม/ดีบักของ Plugin ที่มีขอบเขตเฉพาะเซสชัน โดยไม่ต้องเปิดโหมด
รายละเอียดเต็มรูปแบบ คำสั่งนี้ไม่ใช้แทน `/debug` (การแทนที่รันไทม์) หรือ `/verbose` (ผลลัพธ์
ปกติของเครื่องมือ)

## `/btw`: คำถามแทรก

`/btw` ใช้ถามคำถามแทรกสั้น ๆ เกี่ยวกับบริบทของเซสชันปัจจุบัน นามแฝง: `/side`

```text
/btw ตอนนี้เรากำลังทำอะไรอยู่?
/side มีอะไรเปลี่ยนแปลงระหว่างที่การทำงานหลักดำเนินต่อไป?
```

แตกต่างจากข้อความปกติดังนี้:

- ใช้เซสชันปัจจุบันเป็นบริบทเบื้องหลัง
- ในเซสชันชุดทดสอบ Codex จะทำงานเป็นเธรดแทรกชั่วคราวของ Codex
- **ไม่** เปลี่ยนบริบทของเซสชันในอนาคต
- ไม่ถูกเขียนลงในประวัติทรานสคริปต์

ดูพฤติกรรมทั้งหมดที่ [คำถามแทรก BTW](/th/tools/btw)

## หมายเหตุเกี่ยวกับพื้นผิวการใช้งาน

<AccordionGroup>
  <Accordion title="ขอบเขตเซสชันตามพื้นผิวการใช้งาน">
    - **คำสั่งข้อความ:** ทำงานในเซสชันแชตปกติ (DM ใช้ `main` ร่วมกัน ส่วนกลุ่มมีเซสชันของตนเอง)
    - **คำสั่ง Discord แบบเนทีฟ:** `agent:<agentId>:discord:slash:<userId>`
    - **คำสั่ง Slack แบบเนทีฟ:** `agent:<agentId>:slack:slash:<userId>` (กำหนดค่าส่วนนำหน้าได้ผ่าน `channels.slack.slashCommand.sessionPrefix`)
    - **คำสั่ง Telegram แบบเนทีฟ:** `telegram:slash:<userId>` (กำหนดเป้าหมายเป็นเซสชันแชตผ่าน `CommandTargetSessionKey`)
    - **`/login codex`** ส่งรหัสจับคู่อุปกรณ์ผ่านแชตส่วนตัวหรือเส้นทางตอบกลับของ UI เว็บเท่านั้น การเรียกใช้จากกลุ่ม/หัวข้อ Telegram จะขอให้เจ้าของส่ง DM ไปยังบอตแทน
    - **`/stop`** กำหนดเป้าหมายเป็นเซสชันแชตที่ใช้งานอยู่เพื่อยกเลิกการทำงานปัจจุบัน

  </Accordion>
  <Accordion title="รายละเอียดเฉพาะของ Slack">
    `channels.slack.slashCommand` รองรับคำสั่งรูปแบบ `/openclaw` ได้หนึ่งคำสั่ง
    เมื่อใช้ `commands.native: true` ให้สร้างคำสั่งแบบทับของ Slack หนึ่งคำสั่งต่อคำสั่ง
    ในตัวแต่ละรายการ ลงทะเบียน `/agentstatus` (ไม่ใช่ `/status`) เนื่องจาก Slack สงวน
    `/status` ไว้ ส่วนข้อความ `/status` ยังคงใช้งานได้ในข้อความ Slack
  </Accordion>
  <Accordion title="เส้นทางด่วนและทางลัดในบรรทัด">
    - ข้อความที่มีเฉพาะคำสั่งจากผู้ส่งในรายการที่อนุญาตจะได้รับการจัดการทันที (ข้ามคิวและโมเดล)
    - ทางลัดในบรรทัด (`/help`, `/commands`, `/status`, `/whoami`) ยังสามารถฝังในข้อความปกติได้ และจะถูกนำออกก่อนที่โมเดลจะเห็นข้อความส่วนที่เหลือ
    - ข้อความที่มีเฉพาะคำสั่งจากผู้ส่งที่ไม่ได้รับอนุญาตจะถูกละเว้นโดยไม่มีการแจ้งเตือน ส่วนโทเค็น `/...` ในบรรทัดจะถือเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="หมายเหตุเกี่ยวกับอาร์กิวเมนต์">
    - คำสั่งรองรับ `:` แบบไม่บังคับระหว่างคำสั่งกับอาร์กิวเมนต์ (`/think: high`, `/send: on`)
    - `/new <model>` รองรับนามแฝงของโมเดล, `provider/model` หรือชื่อผู้ให้บริการ (จับคู่แบบคลุมเครือ) หากไม่พบรายการที่ตรงกัน ข้อความจะถูกใช้เป็นเนื้อหาข้อความ
    - `/allowlist add|remove` ต้องใช้ `commands.config: true` และปฏิบัติตาม `configWrites` ของช่องทาง

  </Accordion>
</AccordionGroup>

## การใช้งานและสถานะของผู้ให้บริการ

- **การใช้งาน/โควตาของผู้ให้บริการ** (เช่น "Claude เหลือ 80%") จะแสดงใน `/status` สำหรับผู้ให้บริการโมเดลปัจจุบันเมื่อเปิดใช้การติดตามการใช้งาน
- **บรรทัดโทเค็น/แคช** ใน `/status` สามารถใช้รายการการใช้งานล่าสุดจากบันทึกบทสนทนาเป็นข้อมูลสำรองได้ เมื่อสแนปช็อตเซสชันแบบสดมีข้อมูลไม่ครบถ้วน
- **การดำเนินการเทียบกับรันไทม์:** `/status` รายงาน `Execution` สำหรับพาธแซนด์บ็อกซ์ที่มีผล และ `Runtime` สำหรับผู้ที่กำลังเรียกใช้เซสชัน ได้แก่ `OpenClaw Default`, `OpenAI Codex`, แบ็กเอนด์ CLI หรือแบ็กเอนด์ ACP
- **โทเค็น/ค่าใช้จ่ายต่อการตอบกลับ:** ควบคุมด้วย `/usage off|tokens|full`
- `/model status` แสดงข้อมูลเกี่ยวกับโมเดล/การยืนยันตัวตน/เอนด์พอยต์ ไม่ใช่การใช้งาน

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Skills" href="/th/tools/skills" icon="puzzle-piece">
    วิธีลงทะเบียนและควบคุมสิทธิ์คำสั่งสแลชของ Skills
  </Card>
  <Card title="การสร้าง Skills" href="/th/tools/creating-skills" icon="hammer">
    สร้าง Skills ที่ลงทะเบียนคำสั่งสแลชของตนเอง
  </Card>
  <Card title="BTW" href="/th/tools/btw" icon="comments">
    ถามคำถามแทรกโดยไม่เปลี่ยนบริบทของเซสชัน
  </Card>
  <Card title="กำกับทิศทาง" href="/th/tools/steer" icon="compass">
    กำกับเอเจนต์ระหว่างการทำงานด้วย `/steer`
  </Card>
</CardGroup>
