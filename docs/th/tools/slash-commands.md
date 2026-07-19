---
read_when:
    - การใช้หรือกำหนดค่าคำสั่งแชต
    - การดีบักการกำหนดเส้นทางคำสั่งหรือสิทธิ์อนุญาต
    - ทำความเข้าใจวิธีการลงทะเบียนคำสั่งของ Skills
sidebarTitle: Slash commands
summary: คำสั่งแบบสแลช ไดเรกทีฟ และทางลัดแบบอินไลน์ทั้งหมดที่พร้อมใช้งาน — การกำหนดค่า การกำหนดเส้นทาง และลักษณะการทำงานในแต่ละพื้นผิว
title: คำสั่งแบบสแลช
x-i18n:
    generated_at: "2026-07-19T07:37:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7b30bc91f438175018be882f5eb93780f99a3f99335a7200092049bfd68e2ff8
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway จัดการคำสั่งที่ส่งเป็นข้อความเดี่ยวซึ่งขึ้นต้นด้วย `/`
คำสั่ง bash ที่ใช้ได้เฉพาะบนโฮสต์ใช้ `! <cmd>` (โดยมี `/bash <cmd>` เป็นนามแฝง)

เมื่อการสนทนาผูกกับเซสชัน ACP ข้อความปกติจะถูกส่งไปยัง
ชุดควบคุม ACP คำสั่งจัดการ Gateway ยังคงทำงานภายในเครื่อง: `/acp ...` จะส่งถึง
ตัวจัดการคำสั่งของ OpenClaw เสมอ และ `/status` กับ `/unfocus` จะยังคงทำงานภายในเครื่องเมื่อใดก็ตามที่
เปิดใช้งานการจัดการคำสั่งสำหรับพื้นผิวนั้น

## คำสั่งสามประเภท

<CardGroup cols={3}>
  <Card title="คำสั่ง" icon="terminal">
    ข้อความ `/...` แบบเดี่ยวที่ Gateway จัดการ ต้องส่งเป็น
    เนื้อหาเพียงอย่างเดียวในข้อความ
  </Card>
  <Card title="คำสั่งกำกับ" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — ถูกตัดออกจากข้อความก่อนที่โมเดล
    จะเห็น เมื่อส่งเพียงอย่างเดียวจะบันทึกการตั้งค่าเซสชันไว้ถาวร และเมื่อส่งพร้อม
    ข้อความอื่นจะทำหน้าที่เป็นคำแนะนำแบบแทรกในข้อความ
  </Card>
  <Card title="ทางลัดแบบแทรกในข้อความ" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — ทำงานทันทีและ
    ถูกตัดออกก่อนที่โมเดลจะเห็นข้อความส่วนที่เหลือ ใช้ได้เฉพาะผู้ส่งที่ได้รับอนุญาต
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="รายละเอียดลักษณะการทำงานของคำสั่งกำกับ">
    - คำสั่งกำกับจะถูกตัดออกจากข้อความก่อนที่โมเดลจะเห็น
    - ในข้อความที่มี **เฉพาะคำสั่งกำกับ** (ข้อความมีเพียงคำสั่งกำกับ) คำสั่งเหล่านั้น
      จะถูกบันทึกไว้ในเซสชันและตอบกลับด้วยการยืนยัน
    - ในข้อความ **แชตปกติ** ที่มีข้อความอื่นร่วมด้วย คำสั่งเหล่านั้นจะทำหน้าที่เป็นคำแนะนำแบบแทรกในข้อความและ
      จะ **ไม่** บันทึกการตั้งค่าเซสชัน
    - คำสั่งกำกับมีผลเฉพาะกับ **ผู้ส่งที่ได้รับอนุญาต** หากตั้งค่า `commands.allowFrom`
      ระบบจะใช้รายการอนุญาตนี้เพียงรายการเดียว มิฉะนั้น การอนุญาตจะมาจาก
      รายการอนุญาต/การจับคู่ของช่องทางร่วมกับ `commands.useAccessGroups` ผู้ส่งที่ไม่ได้รับอนุญาต
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
  เปิดใช้การแยกวิเคราะห์ `/...` ในข้อความแชต บนพื้นผิวที่ไม่มีคำสั่งแบบเนทีฟ
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) คำสั่งแบบข้อความ
  จะทำงานแม้ตั้งค่าเป็น `false`
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่งแบบเนทีฟ อัตโนมัติ: เปิดสำหรับ Discord/Telegram และปิดสำหรับ Slack
  โดยจะไม่สนใจค่านี้สำหรับผู้ให้บริการที่ไม่รองรับแบบเนทีฟ กำหนดทับแยกตามช่องทางได้ด้วย
  `channels.<provider>.commands.native` บน Discord ค่า `false` จะข้ามการลงทะเบียน
  คำสั่งแบบสแลช ส่วนคำสั่งที่ลงทะเบียนไว้ก่อนหน้านี้อาจยังปรากฏอยู่จนกว่าจะถูกลบ
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่ง Skills แบบเนทีฟเมื่อรองรับ อัตโนมัติ: เปิดสำหรับ
  Discord/Telegram และปิดสำหรับ Slack กำหนดทับได้ด้วย
  `channels.<provider>.commands.nativeSkills`
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  เปิดใช้ `! <cmd>` เพื่อเรียกใช้คำสั่งเชลล์ของโฮสต์ (นามแฝง `/bash <cmd>`) ต้องมี
  รายการอนุญาต `tools.elevated`
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  ระยะเวลาที่ bash รอก่อนเปลี่ยนไปเป็นโหมดเบื้องหลัง (`0` จะทำงาน
  ในเบื้องหลังทันที)
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`) เฉพาะเจ้าของ
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  เปิดใช้ `/mcp` (อ่าน/เขียนการกำหนดค่า MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`) เฉพาะเจ้าของ
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  เปิดใช้ `/plugins` (การค้นหา/สถานะ Plugin รวมถึงติดตั้ง + เปิด/ปิดใช้งาน) การเขียนทำได้เฉพาะเจ้าของ
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  เปิดใช้ `/debug` (การกำหนดค่าทับที่มีผลเฉพาะขณะรัน) เฉพาะเจ้าของ
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  เปิดใช้ `/restart` และคำขอรีสตาร์ต `SIGUSR1` จากภายนอก
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  รายการอนุญาตของเจ้าของแบบระบุชัดเจนสำหรับพื้นผิวคำสั่งที่ใช้ได้เฉพาะเจ้าของ แยกจาก
  `commands.allowFrom` และสิทธิ์เข้าถึงจากการจับคู่ DM
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  แยกตามช่องทาง: กำหนดให้ใช้ข้อมูลประจำตัวเจ้าของสำหรับคำสั่งที่ใช้ได้เฉพาะเจ้าของ เมื่อ `true`
  ผู้ส่งต้องตรงกับ `commands.ownerAllowFrom` หรือมีขอบเขตภายใน `operator.admin`
  รายการไวลด์การ์ด `allowFrom` **ไม่** เพียงพอ
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  ควบคุมวิธีแสดงรหัสเจ้าของในพรอมต์ระบบ
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  ข้อมูลลับ HMAC ที่ใช้เมื่อ `commands.ownerDisplay: "hash"`
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  รายการอนุญาตแยกตามผู้ให้บริการสำหรับการอนุญาตคำสั่ง เมื่อกำหนดค่าแล้ว รายการนี้จะเป็น
  แหล่งการอนุญาต **เพียงแหล่งเดียว** สำหรับคำสั่งและคำสั่งกำกับ ใช้ `"*"` เป็น
  ค่าเริ่มต้นส่วนกลาง โดยคีย์เฉพาะผู้ให้บริการจะกำหนดทับค่านี้
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  บังคับใช้รายการอนุญาต/นโยบายสำหรับคำสั่งเมื่อไม่ได้ตั้งค่า `commands.allowFrom`
</ParamField>

## รายการคำสั่ง

คำสั่งมาจากสามแหล่ง:

- **คำสั่งหลักในตัว:** `src/auto-reply/commands-registry.shared.ts`
- **คำสั่ง dock ที่สร้างขึ้น:** `src/auto-reply/commands-registry.data.ts`
- **คำสั่ง Plugin:** การเรียก `registerCommand()` ของ Plugin

ความพร้อมใช้งานขึ้นอยู่กับแฟล็กการกำหนดค่า พื้นผิวของช่องทาง และ Plugin
ที่ติดตั้ง/เปิดใช้งาน

### คำสั่งหลัก

<AccordionGroup>
  <Accordion title="เซสชันและการรัน">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/new [model]` | เก็บเซสชันปัจจุบันเข้าคลังและเริ่มเซสชันใหม่ |
    | `/reset [soft [message]]` | รีเซ็ตเซสชันปัจจุบันในตำแหน่งเดิม `soft` จะเก็บทรานสคริปต์ ลบรหัสเซสชันแบ็กเอนด์ CLI ที่นำกลับมาใช้ และเรียกใช้ขั้นตอนเริ่มต้นอีกครั้ง |
    | `/name <title>` | ตั้งชื่อหรือเปลี่ยนชื่อเซสชันปัจจุบัน เว้นชื่อไว้เพื่อดูชื่อปัจจุบันและคำแนะนำ |
    | `/compact [instructions]` | กระชับบริบทของเซสชัน ดู [Compaction](/th/concepts/compaction) |
    | `/stop` | ยกเลิกการรันปัจจุบัน |
    | `/session idle <duration\|off>` | จัดการการหมดอายุเมื่อไม่มีการใช้งานของการผูกเธรด |
    | `/session max-age <duration\|off>` | จัดการการหมดอายุตามอายุสูงสุดของการผูกเธรด |
    | `/export-session [path]` | เฉพาะเจ้าของ ส่งออกเซสชันปัจจุบันเป็น HTML ภายในเวิร์กสเปซ นามแฝง: `/export` |
    | `/export-trajectory [path]` | ส่งออกชุดข้อมูลวิถีการทำงาน JSONL สำหรับเซสชันปัจจุบัน นามแฝง: `/trajectory` |

    พาธ `/export-session` ที่ระบุอย่างชัดเจนจะแทนที่ไฟล์ที่มีอยู่ภายใน
    เวิร์กสเปซ เว้นพาธไว้เพื่อสร้างชื่อไฟล์ที่ป้องกันการชนกัน

    <Note>
      Control UI จะดัก `/new` ที่พิมพ์เพื่อสร้างและสลับไปยัง
      เซสชันแดชบอร์ดใหม่ ยกเว้นเมื่อกำหนดค่า `session.dmScope: "main"`
      และพาเรนต์ปัจจุบันเป็นเซสชันหลักของเอเจนต์ — ในกรณีนั้น `/new`
      จะรีเซ็ตเซสชันหลักในตำแหน่งเดิม ส่วน `/reset` ที่พิมพ์ยังคงเรียกใช้การรีเซ็ต
      ในตำแหน่งเดิมของ Gateway ใช้ `/model default` เมื่อต้องการล้าง
      การเลือกโมเดลที่ตรึงไว้ของเซสชัน
    </Note>

  </Accordion>

  <Accordion title="การควบคุมโมเดลและการรัน">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/think <level\|default>` | ตั้งค่าระดับการคิดหรือล้างค่าที่กำหนดทับสำหรับเซสชัน นามแฝง: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | สลับเอาต์พุตแบบละเอียด นามแฝง: `/v` |
    | `/trace on\|off` | สลับเอาต์พุตการติดตาม Plugin สำหรับเซสชันปัจจุบัน |
    | `/fast [status\|auto\|on\|off\|default]` | แสดง ตั้งค่า หรือล้างโหมดเร็ว |
    | `/reasoning [on\|off\|stream]` | สลับการมองเห็นกระบวนการให้เหตุผล นามแฝง: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | สลับโหมดยกระดับสิทธิ์ นามแฝง: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | แสดงหรือตั้งค่าเริ่มต้นของ exec |
    | `/login [codex\|openai\|openai-codex]` | จับคู่การเข้าสู่ระบบ Codex/OpenAI จากแชตส่วนตัวหรือเซสชัน Web UI เฉพาะเจ้าของ/ผู้ดูแลระบบ |
    | `/model [name\|#\|status]` | แสดงหรือตั้งค่าโมเดล |
    | `/models [provider] [page] [limit=<n>\|all]` | แสดงรายการผู้ให้บริการหรือโมเดลที่กำหนดค่าไว้/พร้อมใช้งานด้วยการยืนยันตัวตน |
    | `/queue <mode>` | จัดการลักษณะการทำงานของคิวการรันที่ใช้งานอยู่ ดู [คิว](/th/concepts/queue) และ [การควบคุมทิศทางคิว](/th/concepts/queue-steering) |
    | `/steer <message>` | แทรกคำแนะนำในการรันที่ใช้งานอยู่ นามแฝง: `/tell` ดู [การควบคุมทิศทาง](/th/tools/steer) |

    <AccordionGroup>
      <Accordion title="ความปลอดภัยของโหมดละเอียด / การติดตาม / โหมดเร็ว / การให้เหตุผล">
        - `/verbose` ใช้สำหรับการดีบัก — ให้ **ปิด** ไว้ในการใช้งานปกติ
        - `/trace` แสดงเฉพาะบรรทัดการติดตาม/ดีบักที่ Plugin เป็นเจ้าของ ส่วนข้อความแบบละเอียดทั่วไปยังคงปิดอยู่
        - `/fast auto|on|off` จะบันทึกค่าที่กำหนดทับสำหรับเซสชันไว้ถาวร ใช้ตัวเลือก `inherit` ใน UI เซสชันเพื่อล้างค่า
        - `/fast` ขึ้นอยู่กับผู้ให้บริการ: OpenAI/Codex จะแมปเป็น `service_tier=priority` ส่วนคำขอ Anthropic โดยตรงจะแมปเป็น `service_tier=auto` หรือ `standard_only`
        - `/reasoning`, `/verbose` และ `/trace` มีความเสี่ยงเมื่อใช้ในกลุ่ม — อาจเปิดเผยกระบวนการให้เหตุผลภายในหรือข้อมูลวินิจฉัย Plugin ให้ปิดไว้ในแชตกลุ่ม

      </Accordion>
      <Accordion title="รายละเอียดการสลับโมเดล">
        - `/model` จะบันทึกโมเดลใหม่ลงในเซสชันทันที
        - หากเอเจนต์ไม่ได้ทำงาน การรันครั้งถัดไปจะใช้โมเดลนั้นทันที
        - หากมีการรันที่ใช้งานอยู่ การสลับจะถูกทำเครื่องหมายว่ารอดำเนินการและนำไปใช้เมื่อถึงจุดลองใหม่ที่ปลอดภัยถัดไป

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="การค้นหาและสถานะ">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/help` | แสดงสรุปความช่วยเหลือแบบสั้น |
    | `/commands` | แสดงแค็ตตาล็อกคำสั่งที่สร้างขึ้น |
    | `/tools [compact\|verbose]` | แสดงสิ่งที่เอเจนต์ปัจจุบันสามารถใช้ได้ในขณะนี้ |
    | `/status` | แสดงสถานะการดำเนินการ/รันไทม์ ระยะเวลาทำงานของ Gateway และระบบ สถานภาพของ Plugin รวมถึงการใช้งาน/โควตาของผู้ให้บริการ |
    | `/status plugins` | แสดงสถานภาพโดยละเอียดของ Plugin: ข้อผิดพลาดในการโหลด การกักกัน ความล้มเหลวของ Plugin ช่องทาง ปัญหาการขึ้นต่อกัน และประกาศความเข้ากันได้ ต้องใช้ `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | จัดการ[เป้าหมาย](/th/tools/goal)แบบถาวรของเซสชันปัจจุบัน |
    | `/diagnostics [note]` | ขั้นตอนรายงานสำหรับการสนับสนุนที่ใช้ได้เฉพาะเจ้าของ โดยจะขออนุมัติ exec ทุกครั้ง |
    | `/openclaw <request>` | เรียกใช้ตัวช่วยตั้งค่าและซ่อมแซม OpenClaw จาก DM ของเจ้าของ |
    | `/tasks` | แสดงรายการงานเบื้องหลังที่กำลังทำงาน/เพิ่งทำงานสำหรับเซสชันปัจจุบัน |
    | `/context [list\|detail\|map\|json]` | อธิบายวิธีประกอบบริบท |
    | `/whoami` | แสดงรหัสผู้ส่งของคุณ นามแฝง: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | ควบคุมส่วนท้ายการใช้งานต่อการตอบกลับ (`reset`/`inherit`/`clear`/`default` จะล้างค่าที่กำหนดทับสำหรับเซสชันเพื่อกลับไปสืบทอดค่าเริ่มต้นที่กำหนดไว้) หรือพิมพ์สรุปค่าใช้จ่ายภายในเครื่อง |
  </Accordion>

  <Accordion title="Skills, รายการอนุญาต, การอนุมัติ">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/skill <name> [input]` | เรียกใช้ Skills ตามชื่อ |
    | `/learn [request]` | ร่าง Skills หนึ่งรายการที่พร้อมให้รีวิวจากบทสนทนาปัจจุบันหรือแหล่งข้อมูลที่ระบุผ่าน [เวิร์กช็อป Skills](/th/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | จัดการรายการในรายการอนุญาต ใช้ข้อความเท่านั้น |
    | `/approve <id> <decision>` | ดำเนินการกับพรอมต์ขออนุมัติการเรียกใช้คำสั่งหรือ Plugin |
    | `/btw <question>` | ถามคำถามแทรกโดยไม่เปลี่ยนบริบทของเซสชัน นามแฝง: `/side` ดู [BTW](/th/tools/btw) |
  </Accordion>

  <Accordion title="เอเจนต์ย่อยและ ACP">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/subagents list\|log\|info` | ตรวจสอบการทำงานของเอเจนต์ย่อยสำหรับเซสชันปัจจุบัน |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | จัดการเซสชัน ACP และตัวเลือกรันไทม์ การควบคุมรันไทม์ต้องใช้ข้อมูลประจำตัวของเจ้าของภายนอกหรือผู้ดูแล Gateway ภายใน |
    | `/focus <target>` | ผูกเธรด Discord หรือหัวข้อ Telegram ปัจจุบันกับเป้าหมายเซสชัน |
    | `/unfocus` | ยกเลิกการผูกเธรดปัจจุบัน |
    | `/agents` | แสดงรายการเอเจนต์ที่ผูกกับเธรดสำหรับเซสชันปัจจุบัน |
  </Accordion>

  <Accordion title="การเขียนและการดูแลระบบสำหรับเจ้าของเท่านั้น">
    | คำสั่ง | ต้องใช้ | คำอธิบาย |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | อ่านหรือเขียน `openclaw.json` สำหรับเจ้าของเท่านั้น |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | อ่านหรือเขียนการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการ สำหรับเจ้าของเท่านั้น |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | ตรวจสอบหรือเปลี่ยนแปลงสถานะ Plugin การเขียนใช้ได้เฉพาะเจ้าของ นามแฝง: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | ค่าแทนที่การกำหนดค่าสำหรับรันไทม์เท่านั้น สำหรับเจ้าของเท่านั้น |
    | `/restart` | `commands.restart: true` (ค่าเริ่มต้น) | เริ่ม OpenClaw ใหม่ |
    | `/send on\|off\|inherit` | เจ้าของ | ตั้งค่านโยบายการส่ง |
  </Accordion>

  <Accordion title="เสียง, TTS, การควบคุมช่องทาง">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | ควบคุม TTS ดู [TTS](/th/tools/tts) |
    | `/activation mention\|always` | ตั้งค่าโหมดการเปิดใช้งานกลุ่ม |
    | `/bash <command>` | เรียกใช้คำสั่งเชลล์ของโฮสต์ นามแฝง: `! <command>` ต้องใช้ `commands.bash: true` |
    | `!poll [sessionId]` | ตรวจสอบงาน bash ที่ทำงานเบื้องหลัง |
    | `!stop [sessionId]` | หยุดงาน bash ที่ทำงานเบื้องหลัง |
  </Accordion>
</AccordionGroup>

### คำสั่ง Dock

คำสั่ง Dock จะเปลี่ยนเส้นทางการตอบกลับของเซสชันที่ใช้งานอยู่ไปยังช่องทางอื่นที่เชื่อมโยงไว้
ดูการตั้งค่าและการแก้ปัญหาที่ [การ Dock ช่องทาง](/th/concepts/channel-docking)

สร้างจาก Plugin ช่องทางที่รองรับคำสั่งแบบเนทีฟ:

- `/dock-discord` (นามแฝง: `/dock_discord`)
- `/dock-mattermost` (นามแฝง: `/dock_mattermost`)
- `/dock-slack` (นามแฝง: `/dock_slack`)
- `/dock-telegram` (นามแฝง: `/dock_telegram`)

คำสั่ง Dock ต้องใช้ `session.identityLinks` ผู้ส่งต้นทางและเพียร์เป้าหมาย
ต้องอยู่ในกลุ่มข้อมูลประจำตัวเดียวกัน

### คำสั่ง Plugin ที่รวมมาให้

| คำสั่ง                                                 | คำอธิบาย                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | เปิดหรือปิด Dreaming ของหน่วยความจำ (เจ้าของหรือผู้ดูแล Gateway) ดู [Dreaming](/th/concepts/dreaming)                                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | จัดการการจับคู่อุปกรณ์ ดู [การจับคู่](/th/channels/pairing)                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | เตรียมเปิดใช้คำสั่ง Node ที่มีความเสี่ยงสูงชั่วคราว (กล้อง/หน้าจอ/คอมพิวเตอร์/การเขียน) ดู [การใช้คอมพิวเตอร์](/th/nodes/computer-use)                                                                               |
| `/voice status\|list\|set <voiceId>`                    | จัดการการกำหนดค่าเสียง Talk ชื่อแบบเนทีฟใน Discord: `/talkvoice`                                                                                                                                    |
| `/card ...`                                             | ส่งค่าที่ตั้งไว้ล่วงหน้าสำหรับการ์ดแบบ Rich ของ LINE ดู [LINE](/th/channels/line)                                                                                                                                        |
| `/codex <action> ...`                                   | ผูก ควบคุมทิศทาง และตรวจสอบชุดควบคุม app-server ของ Codex (สถานะ เธรด ดำเนินการต่อ โมเดล โหมดเร็ว สิทธิ์ compact รีวิว mcp Skills และอื่นๆ) ดู [ชุดควบคุม Codex](/th/plugins/codex-harness) |

เฉพาะ QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### คำสั่ง Skills

Skills ที่ผู้ใช้เรียกใช้ได้จะแสดงเป็นคำสั่งแบบเครื่องหมายทับ:

- `/skill <name> [input]` ใช้เป็นจุดเข้าใช้งานทั่วไปได้เสมอ
- Skills อาจลงทะเบียนเป็นคำสั่งโดยตรง (เช่น `/prose` สำหรับ OpenProse)
- การลงทะเบียนคำสั่ง Skills แบบเนทีฟควบคุมโดย `commands.nativeSkills` และ
  `channels.<provider>.commands.nativeSkills`
- ชื่อจะถูกปรับให้เป็น `a-z0-9_` (สูงสุด 32 อักขระ) หากชื่อซ้ำจะเพิ่มส่วนต่อท้ายเป็นตัวเลข

<AccordionGroup>
  <Accordion title="การส่งต่อคำสั่ง Skills">
    โดยค่าเริ่มต้น คำสั่ง Skills จะส่งไปยังโมเดลในรูปแบบคำขอปกติ

    Skills สามารถประกาศ `command-dispatch: tool` เพื่อส่งตรงไปยังเครื่องมือ
    (ผลลัพธ์แน่นอน โดยไม่มีโมเดลเข้ามาเกี่ยวข้อง) ตัวอย่าง: `/prose` (Plugin OpenProse)
    — ดู [OpenProse](/th/prose)

  </Accordion>
  <Accordion title="อาร์กิวเมนต์คำสั่งแบบเนทีฟ">
    Discord ใช้การเติมข้อความอัตโนมัติสำหรับตัวเลือกแบบไดนามิก และใช้เมนูปุ่มเมื่อไม่มีการระบุ
    อาร์กิวเมนต์ที่จำเป็น Telegram และ Slack แสดงเมนูปุ่มสำหรับคำสั่งที่มี
    ตัวเลือก ตัวเลือกแบบไดนามิกจะอ้างอิงจากโมเดลของเซสชันเป้าหมาย ดังนั้นตัวเลือกเฉพาะ
    โมเดล เช่น ระดับ `/think` จะใช้ตามค่าแทนที่ `/model` ของเซสชัน
  </Accordion>
</AccordionGroup>

## `/tools`: สิ่งที่เอเจนต์ใช้ได้ในขณะนี้

`/tools` ตอบคำถามเกี่ยวกับรันไทม์ว่า: **เอเจนต์นี้ใช้สิ่งใดได้บ้างในขณะนี้ภายใน
บทสนทนานี้** — ไม่ใช่แค็ตตาล็อกการกำหนดค่าแบบคงที่

```text
/tools         # มุมมองแบบย่อ
/tools verbose # พร้อมคำอธิบายสั้นๆ
```

ผลลัพธ์มีขอบเขตเฉพาะเซสชัน การเปลี่ยนเอเจนต์ ช่องทาง เธรด การให้สิทธิ์
ผู้ส่ง หรือโมเดลอาจเปลี่ยนผลลัพธ์ได้ หากต้องการแก้ไขโปรไฟล์และค่าแทนที่
ให้ใช้แผง Tools ใน Control UI หรือส่วนการกำหนดค่า

## `/model`: การเลือกโมเดล

```text
/model             # แสดงตัวเลือกโมเดล
/model list        # เหมือนกัน
/model 3           # เลือกตามหมายเลขจากตัวเลือก
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # ล้างการเลือกโมเดลของเซสชัน
/model status      # มุมมองโดยละเอียดพร้อมเอนด์พอยต์และโหมด API
```

ใน Discord คำสั่ง `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบพร้อมรายการดรอปดาวน์ผู้ให้บริการและ
โมเดล ตัวเลือกนี้จะปฏิบัติตาม `agents.defaults.modelPolicy.allow`
รวมถึงรายการ `provider/*` หากไม่มีรายการอนุญาตที่ระบุไว้อย่างชัดเจน รายการโมเดลและ
นามแฝงจะไม่จำกัดการเลือก

## `/config`: การเขียนการกำหนดค่าลงดิสก์

<Note>
  สำหรับเจ้าของเท่านั้น ปิดใช้งานเป็นค่าเริ่มต้น — เปิดใช้ด้วย `commands.config: true`
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

การกำหนดค่าจะได้รับการตรวจสอบก่อนเขียน การเปลี่ยนแปลงที่ไม่ถูกต้องจะถูกปฏิเสธ การอัปเดตด้วย `/config`
จะคงอยู่หลังการเริ่มระบบใหม่

## `/mcp`: การกำหนดค่าเซิร์ฟเวอร์ MCP

<Note>
  สำหรับเจ้าของเท่านั้น ปิดใช้งานเป็นค่าเริ่มต้น — เปิดใช้ด้วย `commands.mcp: true`
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` จัดเก็บการกำหนดค่าไว้ในการกำหนดค่าของ OpenClaw ไม่ใช่การตั้งค่าโปรเจกต์ของเอเจนต์แบบฝังตัว
`/mcp show` ปกปิดฟิลด์ที่มีข้อมูลประจำตัว ค่าของแฟล็กข้อมูลประจำตัวที่ระบบรู้จัก
และอาร์กิวเมนต์ที่มีรูปแบบเหมือนข้อมูลลับ เมื่อเรียกใช้จากกลุ่ม
การกำหนดค่าจะถูกส่งให้เจ้าของเป็นการส่วนตัว หากไม่มีเส้นทางส่วนตัวไปยังเจ้าของ
คำสั่งจะหยุดทำงานอย่างปลอดภัยและขอให้เจ้าของลองใหม่จาก
แชตส่วนตัว

## `/debug`: ค่าแทนที่สำหรับรันไทม์เท่านั้น

<Note>
  สำหรับเจ้าของเท่านั้น ปิดใช้งานเป็นค่าเริ่มต้น — เปิดใช้ด้วย `commands.debug: true`
  ค่าแทนที่จะมีผลทันทีต่อการอ่านการกำหนดค่าใหม่ แต่จะ**ไม่**เขียนลงดิสก์
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
  การเขียนใช้ได้เฉพาะเจ้าของ ปิดใช้งานเป็นค่าเริ่มต้น — เปิดใช้ด้วย `commands.plugins: true`
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install clawhub:<package>
/plugins install npm:@openclaw/<official-package>
/plugins install npm:<package> --force
/plugins install git:<repository>@<ref> --force
```

`/plugins enable|disable` อัปเดตการกำหนดค่า Plugin และโหลดรันไทม์ Plugin ของ Gateway ใหม่แบบทันที
สำหรับรอบการทำงานใหม่ของเอเจนต์ `/plugins install` จะเริ่ม Gateway ที่จัดการอยู่
ใหม่โดยอัตโนมัติ เนื่องจากโมดูลซอร์สของ Plugin มีการเปลี่ยนแปลง การติดตั้งจาก ClawHub ที่เชื่อถือได้
และแค็ตตาล็อกอย่างเป็นทางการไม่ต้องมีการยืนยันเพิ่มเติม แหล่งที่มาจาก npm แบบกำหนดเอง
git ไฟล์เก็บถาวร `npm-pack:` และพาธภายในจะแสดงคำเตือนที่มา และ
ต้องมี `--force` ต่อท้ายหลังจากตรวจสอบซอร์สแล้ว แฟล็กนี้เป็นการยอมรับ
แหล่งที่มาและอนุญาตให้แทนที่การติดตั้งที่มีอยู่ แต่ไม่ข้าม
`security.installPolicy` หรือการตรวจสอบความปลอดภัยของตัวติดตั้ง รีลีสของ ClawHub ที่มี
คำเตือนความเสี่ยงยังคงต้องใช้แฟล็ก `--acknowledge-clawhub-risk`
ซึ่งใช้ได้ผ่านเชลล์เท่านั้นแยกต่างหาก การติดตั้งจาก Marketplace แบบลิงก์ และแบบปักหมุด
ยังคงใช้ได้ผ่านเชลล์เท่านั้นเช่นกัน

## `/trace`: เอาต์พุตการติดตาม Plugin

```text
/trace          # แสดงสถานะการติดตามปัจจุบัน
/trace on
/trace off
```

`/trace` แสดงบรรทัดการติดตาม/ดีบัก Plugin ที่มีขอบเขตเฉพาะเซสชันโดยไม่ต้องเปิดโหมด
แบบละเอียดทั้งหมด แต่ไม่ใช้แทน `/debug` (ค่าแทนที่รันไทม์) หรือ `/verbose` (เอาต์พุต
เครื่องมือปกติ)

## `/btw`: คำถามแทรก

`/btw` คือคำถามแทรกแบบรวดเร็วเกี่ยวกับบริบทของเซสชันปัจจุบัน นามแฝง: `/side`

```text
/btw ตอนนี้เรากำลังทำอะไรอยู่?
/side มีอะไรเปลี่ยนแปลงบ้างขณะที่การทำงานหลักยังดำเนินต่อไป?
```

ต่างจากข้อความปกติ:

- ใช้เซสชันปัจจุบันเป็นบริบทเบื้องหลัง
- ในเซสชันชุดควบคุม Codex จะทำงานเป็นเธรดแทรก Codex แบบชั่วคราว
- จะ**ไม่**เปลี่ยนบริบทของเซสชันในอนาคต
- จะไม่ถูกเขียนลงในประวัติทรานสคริปต์

ดูพฤติกรรมทั้งหมดที่ [คำถามแทรก BTW](/th/tools/btw)

## หมายเหตุเกี่ยวกับส่วนติดต่อ

<AccordionGroup>
  <Accordion title="ขอบเขตเซสชันของแต่ละส่วนติดต่อ">
    - **คำสั่งข้อความ:** ทำงานในเซสชันแชตปกติ (DM ใช้ `main` ร่วมกัน ส่วนกลุ่มมีเซสชันของตนเอง)
    - **คำสั่ง Discord แบบเนทีฟ:** `agent:<agentId>:discord:slash:<userId>`
    - **คำสั่ง Slack แบบเนทีฟ:** `agent:<agentId>:slack:slash:<userId>` (กำหนดคำนำหน้าได้ผ่าน `channels.slack.slashCommand.sessionPrefix`)
    - **คำสั่ง Telegram แบบเนทีฟ:** `telegram:slash:<userId>` (กำหนดเป้าหมายเป็นเซสชันแชตผ่าน `CommandTargetSessionKey`)
    - **`/login codex`** ส่งรหัสจับคู่อุปกรณ์ผ่านแชตส่วนตัวหรือเส้นทางตอบกลับของ Web UI เท่านั้น การเรียกใช้จากกลุ่ม/หัวข้อ Telegram จะขอให้เจ้าของส่ง DM ถึงบอตแทน
    - **`/stop`** กำหนดเป้าหมายเป็นเซสชันแชตที่ใช้งานอยู่เพื่อยกเลิกการทำงานปัจจุบัน

  </Accordion>
  <Accordion title="รายละเอียดเฉพาะของ Slack">
    `channels.slack.slashCommand` รองรับคำสั่งรูปแบบ `/openclaw` เพียงคำสั่งเดียว
    เมื่อใช้ `commands.native: true` ให้สร้างคำสั่ง slash ของ Slack หนึ่งคำสั่งต่อคำสั่ง
    ในตัวแต่ละรายการ ลงทะเบียน `/agentstatus` (ไม่ใช่ `/status`) เนื่องจาก Slack สงวน
    `/status` ไว้ การพิมพ์ `/status` ในข้อความ Slack ยังคงใช้งานได้
  </Accordion>
  <Accordion title="เส้นทางด่วนและทางลัดแบบอินไลน์">
    - ข้อความที่มีเฉพาะคำสั่งจากผู้ส่งในรายการที่อนุญาตจะได้รับการจัดการทันที (ข้ามคิว + โมเดล)
    - ทางลัดแบบอินไลน์ (`/help`, `/commands`, `/status`, `/whoami`) สามารถฝังในข้อความปกติได้เช่นกัน และจะถูกนำออกก่อนที่โมเดลจะเห็นข้อความส่วนที่เหลือ
    - ข้อความที่มีเฉพาะคำสั่งซึ่งไม่ได้รับอนุญาตจะถูกละเว้นโดยไม่มีการแจ้งเตือน ส่วนโทเค็น `/...` แบบอินไลน์จะถือเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="หมายเหตุเกี่ยวกับอาร์กิวเมนต์">
    - คำสั่งรองรับ `:` ที่ระบุหรือไม่ก็ได้ระหว่างคำสั่งกับอาร์กิวเมนต์ (`/think: high`, `/send: on`)
    - `/new <model>` รองรับชื่อแทนของโมเดล, `provider/model` หรือชื่อผู้ให้บริการ (จับคู่แบบใกล้เคียง) หากไม่พบรายการที่ตรงกัน ข้อความดังกล่าวจะถือเป็นเนื้อหาของข้อความ
    - `/allowlist add|remove` ต้องใช้ `commands.config: true` และปฏิบัติตาม `configWrites` ของช่อง

  </Accordion>
</AccordionGroup>

## การใช้งานและสถานะของผู้ให้บริการ

- **การใช้งาน/โควตาของผู้ให้บริการ** (เช่น "Claude เหลือ 80%") จะแสดงใน `/status` สำหรับผู้ให้บริการของโมเดลปัจจุบันเมื่อเปิดใช้งานการติดตามการใช้งาน
- **บรรทัดโทเค็น/แคช** ใน `/status` สามารถใช้รายการการใช้งานล่าสุดจากบทถอดความแทนได้เมื่อสแนปช็อตเซสชันแบบเรียลไทม์มีข้อมูลไม่ครบถ้วน
- **การดำเนินการเทียบกับรันไทม์:** `/status` รายงาน `Execution` สำหรับพาธแซนด์บ็อกซ์ที่มีผล และ `Runtime` สำหรับผู้ที่กำลังเรียกใช้เซสชัน ได้แก่ `OpenClaw Default`, `OpenAI Codex`, แบ็กเอนด์ CLI หรือแบ็กเอนด์ ACP
- **โทเค็น/ค่าใช้จ่ายต่อการตอบกลับ:** ควบคุมโดย `/usage off|tokens|full`
- `/model status` เกี่ยวข้องกับโมเดล/การยืนยันตัวตน/เอนด์พอยต์ ไม่ใช่การใช้งาน

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Skills" href="/th/tools/skills" icon="puzzle-piece">
    วิธีลงทะเบียนและควบคุมสิทธิ์คำสั่ง slash ของ Skills
  </Card>
  <Card title="การสร้าง Skills" href="/th/tools/creating-skills" icon="hammer">
    สร้าง Skill ที่ลงทะเบียนคำสั่ง slash ของตนเอง
  </Card>
  <Card title="BTW" href="/th/tools/btw" icon="comments">
    ถามคำถามเสริมโดยไม่เปลี่ยนบริบทของเซสชัน
  </Card>
  <Card title="การชี้นำ" href="/th/tools/steer" icon="compass">
    ชี้นำเอเจนต์ระหว่างการทำงานด้วย `/steer`
  </Card>
</CardGroup>
