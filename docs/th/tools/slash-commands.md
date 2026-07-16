---
read_when:
    - การใช้หรือกำหนดค่าคำสั่งแชต
    - การดีบักการกำหนดเส้นทางคำสั่งหรือสิทธิ์การเข้าถึง
    - ทำความเข้าใจวิธีลงทะเบียนคำสั่ง Skills
sidebarTitle: Slash commands
summary: คำสั่งแบบสแลช ไดเรกทีฟ และทางลัดแบบอินไลน์ทั้งหมดที่พร้อมใช้งาน — การกำหนดค่า การกำหนดเส้นทาง และลักษณะการทำงานเฉพาะแต่ละพื้นผิว
title: คำสั่งแบบสแลช
x-i18n:
    generated_at: "2026-07-16T19:51:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e3a50447f4776d606476f3e8511595fd27bcb889d1e9e2620b1f062ac63fb3a0
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway จัดการคำสั่งที่ส่งเป็นข้อความเดี่ยวซึ่งขึ้นต้นด้วย `/`
คำสั่ง bash เฉพาะโฮสต์ใช้ `! <cmd>` (โดยมี `/bash <cmd>` เป็นนามแฝง)

เมื่อการสนทนาผูกกับเซสชัน ACP ข้อความปกติจะถูกส่งไปยัง
ชุดควบคุม ACP ส่วนคำสั่งจัดการ Gateway ยังคงทำงานภายในระบบ: `/acp ...` จะส่งถึง
ตัวจัดการคำสั่งของ OpenClaw เสมอ และ `/status` รวมถึง `/unfocus` จะยังคงทำงานภายในระบบเมื่อใดก็ตามที่
เปิดใช้งานการจัดการคำสั่งสำหรับพื้นผิวนั้น

## คำสั่งสามประเภท

<CardGroup cols={3}>
  <Card title="คำสั่ง" icon="terminal">
    ข้อความ `/...` แบบเดี่ยวที่ Gateway จัดการ ต้องส่งเป็น
    เนื้อหาเพียงอย่างเดียวในข้อความ
  </Card>
  <Card title="คำสั่งกำกับ" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — จะถูกตัดออกจากข้อความก่อนที่โมเดล
    จะเห็น เมื่อส่งเพียงอย่างเดียวจะบันทึกการตั้งค่าเซสชันอย่างถาวร และเมื่อส่งพร้อม
    ข้อความอื่นจะทำหน้าที่เป็นคำแนะนำแบบแทรกในบรรทัด
  </Card>
  <Card title="ทางลัดแบบแทรกในบรรทัด" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — ทำงานทันทีและจะถูก
    ตัดออกก่อนที่โมเดลจะเห็นข้อความที่เหลือ ใช้ได้เฉพาะผู้ส่งที่ได้รับอนุญาต
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="รายละเอียดพฤติกรรมของคำสั่งกำกับ">
    - คำสั่งกำกับจะถูกตัดออกจากข้อความก่อนที่โมเดลจะเห็น
    - ในข้อความที่มี **เฉพาะคำสั่งกำกับ** (ข้อความมีเพียงคำสั่งกำกับ) คำสั่งเหล่านี้
      จะถูกบันทึกไว้ในเซสชันและตอบกลับด้วยการยืนยัน
    - ในข้อความ **แชตปกติ** ที่มีข้อความอื่น คำสั่งเหล่านี้จะทำหน้าที่เป็นคำแนะนำแบบแทรกในบรรทัดและ
      **ไม่** บันทึกการตั้งค่าเซสชัน
    - คำสั่งกำกับใช้ได้เฉพาะกับ **ผู้ส่งที่ได้รับอนุญาต** หากตั้งค่า `commands.allowFrom`
      ระบบจะใช้รายการอนุญาตนี้เพียงรายการเดียว มิฉะนั้น การอนุญาตจะมาจาก
      รายการอนุญาต/การจับคู่ของช่องทางร่วมกับ `commands.useAccessGroups` ผู้ส่งที่ไม่ได้รับอนุญาต
      จะเห็นคำสั่งกำกับถูกจัดการเป็นข้อความธรรมดา
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
  เปิดใช้งานการแยกวิเคราะห์ `/...` ในข้อความแชต บนพื้นผิวที่ไม่มีคำสั่งแบบเนทีฟ
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) คำสั่งแบบข้อความ
  จะทำงานแม้ตั้งค่าเป็น `false`
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่งแบบเนทีฟ โหมดอัตโนมัติ: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack;
  ไม่มีผลกับผู้ให้บริการที่ไม่รองรับแบบเนทีฟ กำหนดทับแยกตามช่องทางด้วย
  `channels.<provider>.commands.native` สำหรับ Discord นั้น `false` จะข้ามการลงทะเบียน
  คำสั่งแบบสแลช โดยคำสั่งที่ลงทะเบียนไว้ก่อนหน้านี้อาจยังคงปรากฏจนกว่าจะถูกนำออก
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  ลงทะเบียนคำสั่ง Skills แบบเนทีฟเมื่อรองรับ โหมดอัตโนมัติ: เปิดสำหรับ
  Discord/Telegram; ปิดสำหรับ Slack กำหนดทับด้วย
  `channels.<provider>.commands.nativeSkills`
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  เปิดใช้งาน `! <cmd>` เพื่อเรียกใช้คำสั่งเชลล์ของโฮสต์ (นามแฝง `/bash <cmd>`) ต้องมี
  รายการอนุญาต `tools.elevated`
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  ระยะเวลาที่ bash รอก่อนเปลี่ยนเป็นโหมดเบื้องหลัง (`0` จะเปลี่ยนเป็น
  เบื้องหลังทันที)
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  เปิดใช้งาน `/config` (อ่าน/เขียน `openclaw.json`) เฉพาะเจ้าของเท่านั้น
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  เปิดใช้งาน `/mcp` (อ่าน/เขียนการกำหนดค่า MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`) เฉพาะเจ้าของเท่านั้น
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  เปิดใช้งาน `/plugins` (การค้นหา/สถานะ Plugin รวมถึงการติดตั้งและเปิด/ปิดใช้งาน) การเขียนทำได้เฉพาะเจ้าของเท่านั้น
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  เปิดใช้งาน `/debug` (การกำหนดค่าทับเฉพาะขณะรันไทม์) เฉพาะเจ้าของเท่านั้น
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  เปิดใช้งานคำขอรีสตาร์ตจาก `/restart` และ `SIGUSR1` ภายนอก
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  รายการอนุญาตสำหรับเจ้าของที่ระบุไว้อย่างชัดเจนสำหรับพื้นผิวคำสั่งเฉพาะเจ้าของ แยกจาก
  `commands.allowFrom` และสิทธิ์เข้าถึงจากการจับคู่ DM
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  แยกตามช่องทาง: กำหนดให้ใช้ข้อมูลประจำตัวเจ้าของสำหรับคำสั่งเฉพาะเจ้าของ เมื่อ `true`
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

ความพร้อมใช้งานขึ้นอยู่กับแฟล็กการกำหนดค่า พื้นผิวช่องทาง และ Plugin
ที่ติดตั้ง/เปิดใช้งาน

### คำสั่งหลัก

<AccordionGroup>
  <Accordion title="เซสชันและการทำงาน">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/new [model]` | เก็บเซสชันปัจจุบันเข้าคลังและเริ่มเซสชันใหม่ |
    | `/reset [soft [message]]` | รีเซ็ตเซสชันปัจจุบันในตำแหน่งเดิม `soft` จะเก็บทรานสคริปต์ไว้ ลบรหัสเซสชันแบ็กเอนด์ CLI ที่นำกลับมาใช้ซ้ำ และเรียกใช้การเริ่มต้นใหม่ |
    | `/name <title>` | ตั้งชื่อหรือเปลี่ยนชื่อเซสชันปัจจุบัน หากไม่ระบุชื่อเรื่อง ระบบจะแสดงชื่อปัจจุบันและชื่อที่แนะนำ |
    | `/compact [instructions]` | กระชับบริบทของเซสชัน ดู [Compaction](/th/concepts/compaction) |
    | `/stop` | ยกเลิกการทำงานปัจจุบัน |
    | `/session idle <duration\|off>` | จัดการการหมดอายุเมื่อไม่มีการใช้งานของการผูกเธรด |
    | `/session max-age <duration\|off>` | จัดการการหมดอายุตามอายุสูงสุดของการผูกเธรด |
    | `/export-session [path]` | เฉพาะเจ้าของเท่านั้น ส่งออกเซสชันปัจจุบันเป็น HTML ภายในเวิร์กสเปซ นามแฝง: `/export` |
    | `/export-trajectory [path]` | ส่งออกบันเดิลเส้นทาง JSONL สำหรับเซสชันปัจจุบัน นามแฝง: `/trajectory` |

    พาธ `/export-session` ที่ระบุไว้อย่างชัดเจนจะแทนที่ไฟล์ที่มีอยู่ภายใน
    เวิร์กสเปซ หากไม่ระบุพาธ ระบบจะสร้างชื่อไฟล์ที่ป้องกันการชนกัน

    <Note>
      Control UI จะดักจับ `/new` ที่พิมพ์เพื่อสร้างและสลับไปยัง
      เซสชันแดชบอร์ดใหม่ ยกเว้นเมื่อกำหนดค่า `session.dmScope: "main"`
      และพาเรนต์ปัจจุบันเป็นเซสชันหลักของเอเจนต์ — ในกรณีนั้น `/new`
      จะรีเซ็ตเซสชันหลักในตำแหน่งเดิม ส่วน `/reset` ที่พิมพ์ยังคงเรียกใช้การรีเซ็ต
      ในตำแหน่งเดิมของ Gateway ใช้ `/model default` เมื่อต้องการล้าง
      การเลือกโมเดลที่ตรึงไว้กับเซสชัน
    </Note>

  </Accordion>

  <Accordion title="การควบคุมโมเดลและการทำงาน">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/think <level\|default>` | ตั้งค่าระดับการคิดหรือล้างค่าที่กำหนดทับสำหรับเซสชัน นามแฝง: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | สลับการแสดงผลแบบละเอียด นามแฝง: `/v` |
    | `/trace on\|off` | สลับการแสดงเอาต์พุตการติดตาม Plugin สำหรับเซสชันปัจจุบัน |
    | `/fast [status\|auto\|on\|off\|default]` | แสดง ตั้งค่า หรือล้างโหมดเร็ว |
    | `/reasoning [on\|off\|stream]` | สลับการมองเห็นการให้เหตุผล นามแฝง: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | สลับโหมดยกระดับสิทธิ์ นามแฝง: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | แสดงหรือตั้งค่าเริ่มต้นของการดำเนินการ |
    | `/login [codex\|openai\|openai-codex]` | จับคู่การเข้าสู่ระบบ Codex/OpenAI จากแชตส่วนตัวหรือเซสชัน Web UI เฉพาะเจ้าของ/ผู้ดูแลระบบ |
    | `/model [name\|#\|status]` | แสดงหรือตั้งค่าโมเดล |
    | `/models [provider] [page] [limit=<n>\|all]` | แสดงรายการผู้ให้บริการหรือโมเดลที่กำหนดค่าไว้/พร้อมใช้งานจากการตรวจสอบสิทธิ์ |
    | `/queue <mode>` | จัดการพฤติกรรมคิวของการทำงานที่กำลังดำเนินอยู่ ดู [คิว](/th/concepts/queue) และ [การควบคุมทิศทางคิว](/th/concepts/queue-steering) |
    | `/steer <message>` | แทรกคำแนะนำลงในการทำงานที่กำลังดำเนินอยู่ นามแฝง: `/tell` ดู [การควบคุมทิศทาง](/th/tools/steer) |

    <AccordionGroup>
      <Accordion title="ความปลอดภัยของโหมดละเอียด / การติดตาม / โหมดเร็ว / การให้เหตุผล">
        - `/verbose` ใช้สำหรับการดีบัก — ในการใช้งานปกติควร **ปิด** ไว้
        - `/trace` จะแสดงเฉพาะบรรทัดการติดตาม/ดีบักที่ Plugin เป็นเจ้าของ ส่วนข้อความแบบละเอียดทั่วไปจะยังคงปิดอยู่
        - `/fast auto|on|off` จะบันทึกค่าที่กำหนดทับสำหรับเซสชัน ใช้ตัวเลือก `inherit` ใน Sessions UI เพื่อล้างค่านี้
        - `/fast` ขึ้นอยู่กับผู้ให้บริการ: OpenAI/Codex จะแมปไปยัง `service_tier=priority`; คำขอ Anthropic โดยตรงจะแมปไปยัง `service_tier=auto` หรือ `standard_only`
        - `/reasoning`, `/verbose` และ `/trace` มีความเสี่ยงเมื่อใช้ในกลุ่ม — อาจเปิดเผยการให้เหตุผลภายในหรือการวินิจฉัย Plugin ควรปิดไว้ในแชตกลุ่ม

      </Accordion>
      <Accordion title="รายละเอียดการสลับโมเดล">
        - `/model` จะบันทึกโมเดลใหม่ลงในเซสชันทันที
        - หากเอเจนต์ไม่ได้ทำงาน การทำงานครั้งถัดไปจะใช้โมเดลนั้นทันที
        - หากมีการทำงานอยู่ การสลับจะถูกทำเครื่องหมายว่ารอดำเนินการและนำไปใช้ ณ จุดลองใหม่ที่สะอาดครั้งถัดไป

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="การค้นหาและสถานะ">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/help` | แสดงสรุปวิธีใช้แบบย่อ |
    | `/commands` | แสดงแค็ตตาล็อกคำสั่งที่สร้างขึ้น |
    | `/tools [compact\|verbose]` | แสดงสิ่งที่เอเจนต์ปัจจุบันใช้งานได้ในขณะนี้ |
    | `/status` | แสดงสถานะการดำเนินการ/รันไทม์ เวลาทำงานของ Gateway และระบบ สถานะความสมบูรณ์ของ Plugin รวมถึงการใช้งาน/โควตาของผู้ให้บริการ |
    | `/status plugins` | แสดงสถานะความสมบูรณ์ของ Plugin โดยละเอียด: ข้อผิดพลาดในการโหลด การกักกัน ความล้มเหลวของ Plugin ช่องทาง ปัญหาการขึ้นต่อกัน และประกาศด้านความเข้ากันได้ ต้องใช้ `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | จัดการ [เป้าหมาย](/th/tools/goal) แบบถาวรของเซสชันปัจจุบัน |
    | `/diagnostics [note]` | ขั้นตอนรายงานการสนับสนุนสำหรับเจ้าของเท่านั้น ขออนุมัติการดำเนินการทุกครั้ง |
    | `/openclaw <request>` | เรียกใช้ตัวช่วยตั้งค่าและซ่อมแซม OpenClaw จาก DM ของเจ้าของ |
    | `/tasks` | แสดงรายการงานเบื้องหลังที่กำลังทำงาน/เพิ่งทำเสร็จสำหรับเซสชันปัจจุบัน |
    | `/context [list\|detail\|map\|json]` | อธิบายวิธีประกอบบริบท |
    | `/whoami` | แสดงรหัสผู้ส่งของคุณ นามแฝง: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | ควบคุมส่วนท้ายการใช้งานต่อการตอบกลับ (`reset`/`inherit`/`clear`/`default` จะล้างค่าที่กำหนดทับสำหรับเซสชันเพื่อกลับไปรับค่าเริ่มต้นที่กำหนดค่าไว้อีกครั้ง) หรือแสดงสรุปค่าใช้จ่ายภายในเครื่อง |
  </Accordion>

  <Accordion title="Skills, รายการอนุญาต, การอนุมัติ">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/skill <name> [input]` | เรียกใช้ Skill ตามชื่อ |
    | `/learn [request]` | ร่าง Skill หนึ่งรายการที่พร้อมให้ตรวจสอบจากบทสนทนาปัจจุบันหรือแหล่งข้อมูลที่ระบุผ่าน [เวิร์กช็อป Skill](/th/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | จัดการรายการในรายการอนุญาต รองรับเฉพาะข้อความ |
    | `/approve <id> <decision>` | จัดการพรอมต์ขออนุมัติการดำเนินการหรือ Plugin |
    | `/btw <question>` | ถามคำถามแทรกโดยไม่เปลี่ยนบริบทของเซสชัน นามแฝง: `/side` ดู [BTW](/th/tools/btw) |
  </Accordion>

  <Accordion title="เอเจนต์ย่อยและ ACP">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/subagents list\|log\|info` | ตรวจสอบการทำงานของเอเจนต์ย่อยสำหรับเซสชันปัจจุบัน |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | จัดการเซสชัน ACP และตัวเลือกรันไทม์ การควบคุมรันไทม์ต้องใช้ตัวตนเจ้าของภายนอกหรือผู้ดูแล Gateway ภายใน |
    | `/focus <target>` | ผูกเธรด Discord หรือหัวข้อ Telegram ปัจจุบันเข้ากับเป้าหมายเซสชัน |
    | `/unfocus` | ยกเลิกการผูกเธรดปัจจุบัน |
    | `/agents` | แสดงรายการเอเจนต์ที่ผูกกับเธรดสำหรับเซสชันปัจจุบัน |
  </Accordion>

  <Accordion title="การเขียนและการดูแลระบบสำหรับเจ้าของเท่านั้น">
    | คำสั่ง | ต้องใช้ | คำอธิบาย |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | อ่านหรือเขียน `openclaw.json` สำหรับเจ้าของเท่านั้น |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | อ่านหรือเขียนการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการ สำหรับเจ้าของเท่านั้น |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | ตรวจสอบหรือเปลี่ยนแปลงสถานะ Plugin การเขียนจำกัดเฉพาะเจ้าของ นามแฝง: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | แทนที่การกำหนดค่าเฉพาะรันไทม์ สำหรับเจ้าของเท่านั้น |
    | `/restart` | `commands.restart: true` (ค่าเริ่มต้น) | เริ่ม OpenClaw ใหม่ |
    | `/send on\|off\|inherit` | เจ้าของ | กำหนดนโยบายการส่ง |
  </Accordion>

  <Accordion title="เสียง, TTS, การควบคุมช่องทาง">
    | คำสั่ง | คำอธิบาย |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | ควบคุม TTS ดู [TTS](/th/tools/tts) |
    | `/activation mention\|always` | กำหนดโหมดการเปิดใช้งานกลุ่ม |
    | `/bash <command>` | เรียกใช้คำสั่งเชลล์บนโฮสต์ นามแฝง: `! <command>` ต้องใช้ `commands.bash: true` |
    | `!poll [sessionId]` | ตรวจสอบงาน bash เบื้องหลัง |
    | `!stop [sessionId]` | หยุดงาน bash เบื้องหลัง |
  </Accordion>
</AccordionGroup>

### คำสั่ง Dock

คำสั่ง Dock จะสลับเส้นทางการตอบกลับของเซสชันที่ใช้งานอยู่ไปยังช่องทางอื่นที่เชื่อมโยงไว้
ดูการตั้งค่าและการแก้ไขปัญหาที่ [การเชื่อมต่อช่องทาง](/th/concepts/channel-docking)

สร้างขึ้นจาก Plugin ช่องทางที่รองรับคำสั่งแบบเนทีฟ:

- `/dock-discord` (นามแฝง: `/dock_discord`)
- `/dock-mattermost` (นามแฝง: `/dock_mattermost`)
- `/dock-slack` (นามแฝง: `/dock_slack`)
- `/dock-telegram` (นามแฝง: `/dock_telegram`)

คำสั่ง Dock ต้องใช้ `session.identityLinks` ผู้ส่งต้นทางและเพียร์เป้าหมาย
ต้องอยู่ในกลุ่มตัวตนเดียวกัน

### คำสั่ง Plugin ที่รวมมาให้

| คำสั่ง                                                 | คำอธิบาย                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | เปิดหรือปิด Dreaming ของหน่วยความจำ (เจ้าของหรือผู้ดูแล Gateway) ดู [Dreaming](/th/concepts/dreaming)                                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | จัดการการจับคู่อุปกรณ์ ดู [การจับคู่](/th/channels/pairing)                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | เปิดใช้งานคำสั่ง Node ที่มีความเสี่ยงสูงชั่วคราว (กล้อง/หน้าจอ/คอมพิวเตอร์/การเขียน) ดู [การใช้คอมพิวเตอร์](/th/nodes/computer-use)                                                                               |
| `/voice status\|list\|set <voiceId>`                    | จัดการการกำหนดค่าเสียงสนทนา ชื่อเนทีฟของ Discord: `/talkvoice`                                                                                                                                    |
| `/card ...`                                             | ส่งพรีเซ็ตการ์ดแบบสมบูรณ์ของ LINE ดู [LINE](/th/channels/line)                                                                                                                                        |
| `/codex <action> ...`                                   | ผูก ควบคุม และตรวจสอบชุดทดสอบ app-server ของ Codex (สถานะ เธรด ดำเนินการต่อ โมเดล ความเร็ว สิทธิ์ compact การตรวจสอบ mcp Skills และอื่นๆ) ดู [ชุดทดสอบ Codex](/th/plugins/codex-harness) |

เฉพาะ QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### คำสั่ง Skill

Skills ที่ผู้ใช้เรียกใช้ได้จะแสดงเป็นคำสั่งเครื่องหมายทับ:

- `/skill <name> [input]` ใช้เป็นจุดเริ่มต้นทั่วไปได้เสมอ
- Skills อาจลงทะเบียนเป็นคำสั่งโดยตรง (เช่น `/prose` สำหรับ OpenProse)
- การลงทะเบียนคำสั่ง Skill แบบเนทีฟควบคุมโดย `commands.nativeSkills` และ
  `channels.<provider>.commands.nativeSkills`
- ชื่อจะถูกปรับให้เป็น `a-z0-9_` (สูงสุด 32 อักขระ) หากชื่อซ้ำกันจะเพิ่มคำต่อท้ายเป็นตัวเลข

<AccordionGroup>
  <Accordion title="การส่งต่อคำสั่ง Skill">
    โดยค่าเริ่มต้น คำสั่ง Skill จะถูกส่งไปยังโมเดลเป็นคำขอปกติ

    Skills สามารถประกาศ `command-dispatch: tool` เพื่อส่งไปยังเครื่องมือโดยตรง
    (กำหนดผลลัพธ์ได้แน่นอน โดยโมเดลไม่มีส่วนเกี่ยวข้อง) ตัวอย่าง: `/prose` (Plugin OpenProse)
    — ดู [OpenProse](/th/prose)

  </Accordion>
  <Accordion title="อาร์กิวเมนต์คำสั่งแบบเนทีฟ">
    Discord ใช้การเติมข้อความอัตโนมัติสำหรับตัวเลือกแบบไดนามิกและเมนูปุ่มเมื่อไม่ได้ระบุ
    อาร์กิวเมนต์ที่จำเป็น Telegram และ Slack จะแสดงเมนูปุ่มสำหรับคำสั่งที่มี
    ตัวเลือก ตัวเลือกแบบไดนามิกจะได้รับการแก้ไขตามโมเดลของเซสชันเป้าหมาย ดังนั้นตัวเลือกเฉพาะ
    โมเดล เช่น ระดับ `/think` จะเป็นไปตามการแทนที่ `/model` ของเซสชัน
  </Accordion>
</AccordionGroup>

## `/tools`: สิ่งที่เอเจนต์ใช้ได้ในขณะนี้

`/tools` ตอบคำถามเกี่ยวกับรันไทม์ว่า: **เอเจนต์นี้ใช้สิ่งใดได้บ้างในขณะนี้ภายใน
บทสนทนานี้** — ไม่ใช่แค็ตตาล็อกการกำหนดค่าแบบคงที่

```text
/tools         # มุมมองแบบกระชับ
/tools verbose # พร้อมคำอธิบายสั้นๆ
```

ผลลัพธ์มีขอบเขตเฉพาะเซสชัน การเปลี่ยนเอเจนต์ ช่องทาง เธรด การอนุญาต
ผู้ส่ง หรือโมเดล อาจเปลี่ยนผลลัพธ์ได้ สำหรับการแก้ไขโปรไฟล์และการแทนที่
ให้ใช้แผง Tools ใน Control UI หรือพื้นผิวการกำหนดค่า

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

บน Discord คำสั่ง `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบที่มีรายการแบบเลื่อนลงสำหรับผู้ให้บริการและ
โมเดล ตัวเลือกนี้เป็นไปตาม `agents.defaults.models` รวมถึง
รายการ `provider/*`

## `/config`: การเขียนการกำหนดค่าลงดิสก์

<Note>
  สำหรับเจ้าของเท่านั้น ปิดใช้งานโดยค่าเริ่มต้น — เปิดใช้งานด้วย `commands.config: true`
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

การกำหนดค่าจะได้รับการตรวจสอบความถูกต้องก่อนเขียน การเปลี่ยนแปลงที่ไม่ถูกต้องจะถูกปฏิเสธ การอัปเดต `/config`
จะคงอยู่หลังการเริ่มระบบใหม่

## `/mcp`: การกำหนดค่าเซิร์ฟเวอร์ MCP

<Note>
  สำหรับเจ้าของเท่านั้น ปิดใช้งานโดยค่าเริ่มต้น — เปิดใช้งานด้วย `commands.mcp: true`
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` จัดเก็บการกำหนดค่าไว้ในการกำหนดค่าของ OpenClaw ไม่ใช่ในการตั้งค่าโปรเจกต์ของเอเจนต์ที่ฝังไว้
`/mcp show` ปกปิดฟิลด์ที่มีข้อมูลรับรอง ค่าของแฟล็กข้อมูลรับรองที่ระบบรู้จัก
และอาร์กิวเมนต์ที่ทราบว่ามีรูปแบบคล้ายข้อมูลลับ เมื่อเรียกใช้จากกลุ่ม
การกำหนดค่าจะถูกส่งให้เจ้าของแบบส่วนตัว หากไม่มีเส้นทางส่วนตัวไปยังเจ้าของ
คำสั่งจะปิดการทำงานอย่างปลอดภัยและขอให้เจ้าของลองอีกครั้งจากการแชต
โดยตรง

## `/debug`: การแทนที่เฉพาะรันไทม์

<Note>
  สำหรับเจ้าของเท่านั้น ปิดใช้งานโดยค่าเริ่มต้น — เปิดใช้งานด้วย `commands.debug: true`
  การแทนที่จะมีผลทันทีต่อการอ่านการกำหนดค่าครั้งใหม่ แต่จะ **ไม่** เขียนลงดิสก์
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
  การเขียนจำกัดเฉพาะเจ้าของ ปิดใช้งานโดยค่าเริ่มต้น — เปิดใช้งานด้วย `commands.plugins: true`
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

`/plugins enable|disable` อัปเดตการกำหนดค่า Plugin และโหลดรันไทม์ Plugin ของ Gateway
ใหม่แบบทันทีสำหรับรอบการทำงานใหม่ของเอเจนต์ `/plugins install` จะเริ่ม Gateway ที่ได้รับการจัดการ
ใหม่โดยอัตโนมัติ เนื่องจากโมดูลซอร์สของ Plugin เปลี่ยนแปลง การติดตั้งจาก ClawHub ที่เชื่อถือได้
และแค็ตตาล็อกอย่างเป็นทางการไม่ต้องมีการยืนยันเพิ่มเติม แหล่งที่มาแบบ npm ใดๆ
git, ไฟล์เก็บถาวร, `npm-pack:` และพาธในเครื่องจะแสดงคำเตือนแหล่งที่มาและ
ต้องมี `--force` ต่อท้ายหลังจากตรวจสอบซอร์สแล้ว แฟล็กนี้เป็นการยอมรับ
แหล่งที่มาและอนุญาตให้แทนที่การติดตั้งที่มีอยู่ แต่ไม่ได้ข้าม
`security.installPolicy` หรือการตรวจสอบความปลอดภัยของตัวติดตั้ง รุ่นเผยแพร่ของ ClawHub ที่มี
คำเตือนความเสี่ยงยังคงต้องใช้แฟล็ก `--acknowledge-clawhub-risk`
แยกต่างหาก ซึ่งใช้ได้เฉพาะในเชลล์ การติดตั้งจากมาร์เก็ตเพลส แบบเชื่อมโยง และแบบตรึง
ยังคงใช้ได้เฉพาะในเชลล์เช่นกัน

## `/trace`: เอาต์พุตการติดตาม Plugin

```text
/trace          # แสดงสถานะการติดตามปัจจุบัน
/trace on
/trace off
```

`/trace` แสดงบรรทัดการติดตาม/ดีบักของ Plugin ซึ่งมีขอบเขตเฉพาะเซสชันโดยไม่ต้องใช้โหมด
รายละเอียดเต็มรูปแบบ คำสั่งนี้ไม่ได้แทนที่ `/debug` (การแทนที่รันไทม์) หรือ `/verbose` (เอาต์พุต
เครื่องมือปกติ)

## `/btw`: คำถามแทรก

`/btw` เป็นคำถามแทรกแบบรวดเร็วเกี่ยวกับบริบทของเซสชันปัจจุบัน นามแฝง: `/side`

```text
/btw ตอนนี้เรากำลังทำอะไรอยู่?
/side มีอะไรเปลี่ยนแปลงไปบ้างระหว่างที่การทำงานหลักดำเนินต่อ?
```

ต่างจากข้อความปกติ:

- ใช้เซสชันปัจจุบันเป็นบริบทเบื้องหลัง
- ในเซสชันชุดทดสอบ Codex จะทำงานเป็นเธรดแทรก Codex ชั่วคราว
- **ไม่** เปลี่ยนบริบทของเซสชันในอนาคต
- ไม่ถูกเขียนลงในประวัติทรานสคริปต์

ดูพฤติกรรมทั้งหมดที่ [คำถามแทรก BTW](/th/tools/btw)

## หมายเหตุเกี่ยวกับพื้นผิว

<AccordionGroup>
  <Accordion title="ขอบเขตเซสชันในแต่ละพื้นผิว">
    - **คำสั่งข้อความ:** ทำงานในเซสชันแชตปกติ (ข้อความส่วนตัวใช้ `main` ร่วมกัน ส่วนกลุ่มมีเซสชันของตนเอง)
    - **คำสั่ง Discord แบบเนทีฟ:** `agent:<agentId>:discord:slash:<userId>`
    - **คำสั่ง Slack แบบเนทีฟ:** `agent:<agentId>:slack:slash:<userId>` (กำหนดคำนำหน้าได้ผ่าน `channels.slack.slashCommand.sessionPrefix`)
    - **คำสั่ง Telegram แบบเนทีฟ:** `telegram:slash:<userId>` (กำหนดเป้าหมายไปยังเซสชันแชตผ่าน `CommandTargetSessionKey`)
    - **`/login codex`** ส่งรหัสจับคู่อุปกรณ์ผ่านการแชตส่วนตัวหรือเส้นทางตอบกลับของ Web UI เท่านั้น การเรียกใช้ในกลุ่ม/หัวข้อ Telegram จะขอให้เจ้าของส่งข้อความส่วนตัวถึงบอตแทน
    - **`/stop`** กำหนดเป้าหมายไปยังเซสชันแชตที่ใช้งานอยู่เพื่อยกเลิกการทำงานปัจจุบัน

  </Accordion>
  <Accordion title="รายละเอียดเฉพาะของ Slack">
    `channels.slack.slashCommand` รองรับคำสั่งรูปแบบ `/openclaw` เพียงคำสั่งเดียว
    เมื่อใช้ `commands.native: true` ให้สร้างคำสั่งเครื่องหมายทับของ Slack หนึ่งคำสั่งต่อคำสั่ง
    ในตัวแต่ละรายการ ลงทะเบียน `/agentstatus` (ไม่ใช่ `/status`) เนื่องจาก Slack สงวน
    `/status` ไว้ ข้อความ `/status` ยังคงใช้ได้ในข้อความ Slack
  </Accordion>
  <Accordion title="เส้นทางด่วนและทางลัดแบบอินไลน์">
    - ข้อความที่มีเฉพาะคำสั่งจากผู้ส่งในรายการอนุญาตจะได้รับการจัดการทันที (ข้ามคิว + โมเดล)
    - ทางลัดแบบอินไลน์ (`/help`, `/commands`, `/status`, `/whoami`) สามารถฝังอยู่ในข้อความปกติได้เช่นกัน และจะถูกนำออกก่อนที่โมเดลจะเห็นข้อความส่วนที่เหลือ
    - ข้อความที่มีเฉพาะคำสั่งจากผู้ที่ไม่ได้รับอนุญาตจะถูกละเว้นโดยไม่มีการแจ้งเตือน ส่วนโทเค็น `/...` แบบอินไลน์จะถือเป็นข้อความธรรมดา

  </Accordion>
  <Accordion title="หมายเหตุเกี่ยวกับอาร์กิวเมนต์">
    - คำสั่งรองรับ `:` ซึ่งระบุหรือไม่ก็ได้ ระหว่างคำสั่งกับอาร์กิวเมนต์ (`/think: high`, `/send: on`)
    - `/new <model>` รองรับนามแฝงของโมเดล, `provider/model` หรือชื่อผู้ให้บริการ (การจับคู่แบบคลุมเครือ) หากไม่พบรายการที่ตรงกัน ข้อความนั้นจะถือเป็นเนื้อหาของข้อความ
    - `/allowlist add|remove` ต้องใช้ `commands.config: true` และเป็นไปตาม `configWrites` ของช่องทาง

  </Accordion>
</AccordionGroup>

## การใช้งานและสถานะของผู้ให้บริการ

- **การใช้งาน/โควตาของผู้ให้บริการ** (เช่น "Claude เหลือ 80%") จะแสดงใน `/status` สำหรับผู้ให้บริการของโมเดลปัจจุบันเมื่อเปิดใช้การติดตามการใช้งาน
- **บรรทัดโทเค็น/แคช** ใน `/status` สามารถใช้รายการการใช้งานล่าสุดจากทรานสคริปต์เป็นข้อมูลสำรองได้ เมื่อสแนปช็อตเซสชันปัจจุบันมีข้อมูลไม่เพียงพอ
- **การดำเนินการเทียบกับรันไทม์:** `/status` รายงาน `Execution` สำหรับพาธแซนด์บ็อกซ์ที่มีผลใช้งาน และ `Runtime` สำหรับผู้ที่กำลังเรียกใช้เซสชัน ได้แก่ `OpenClaw Default`, `OpenAI Codex`, แบ็กเอนด์ CLI หรือแบ็กเอนด์ ACP
- **โทเค็น/ค่าใช้จ่ายต่อการตอบกลับ:** ควบคุมโดย `/usage off|tokens|full`
- `/model status` เกี่ยวข้องกับโมเดล/การยืนยันตัวตน/ปลายทาง ไม่ใช่การใช้งาน

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Skills" href="/th/tools/skills" icon="puzzle-piece">
    วิธีลงทะเบียนและควบคุมสิทธิ์คำสั่งเครื่องหมายทับของ Skills
  </Card>
  <Card title="การสร้าง Skills" href="/th/tools/creating-skills" icon="hammer">
    สร้าง Skills ที่ลงทะเบียนคำสั่งเครื่องหมายทับของตนเอง
  </Card>
  <Card title="BTW" href="/th/tools/btw" icon="comments">
    ถามคำถามนอกประเด็นโดยไม่เปลี่ยนบริบทของเซสชัน
  </Card>
  <Card title="กำหนดทิศทาง" href="/th/tools/steer" icon="compass">
    ชี้นำเอเจนต์ระหว่างการทำงานด้วย `/steer`
  </Card>
</CardGroup>
