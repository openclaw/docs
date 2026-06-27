---
doc-schema-version: 1
read_when:
    - คุณต้องการทำความเข้าใจว่า OpenClaw มีเครื่องมืออะไรให้ใช้
    - คุณกำลังตัดสินใจระหว่างเครื่องมือในตัว Skills และ Plugin
    - คุณต้องใช้จุดเริ่มต้นเอกสารที่เหมาะสมสำหรับนโยบายเครื่องมือ ระบบอัตโนมัติ หรือการประสานงานของเอเจนต์
summary: 'ภาพรวมเครื่องมือ Skills และ Plugin ของ OpenClaw: สิ่งที่เอเจนต์เรียกใช้ได้และวิธีขยายความสามารถของสิ่งเหล่านี้'
title: ภาพรวม
x-i18n:
    generated_at: "2026-06-27T18:29:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f49afa2354ebb26eeb5f036cd1f2f7ceb228b01287adbc6c305addfb0af4502d
    source_path: tools/index.md
    workflow: 16
---

ใช้หน้านี้เพื่อเลือกพื้นผิว Capabilities ที่เหมาะสม **Tools** คือการกระทำที่เรียกใช้ได้
**Skills** สอนเอเจนต์ให้รู้วิธีทำงาน และ **Plugins** เพิ่มความสามารถของรันไทม์
เช่น เครื่องมือ ผู้ให้บริการ ช่องทาง hooks และ Skills ที่แพ็กมาให้

หน้านี้เป็นหน้าภาพรวมและการนำทาง สำหรับนโยบายเครื่องมือ ค่าเริ่มต้น
สมาชิกกลุ่ม ข้อจำกัดของผู้ให้บริการ และฟิลด์การกำหนดค่าแบบครบถ้วน ให้ใช้
[เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools)

## เริ่มที่นี่

สำหรับเอเจนต์ส่วนใหญ่ ให้เริ่มจากหมวดหมู่เครื่องมือในตัว แล้วจึงปรับนโยบาย
เฉพาะเมื่อเอเจนต์ควรเห็นเครื่องมือน้อยลง หรือต้องการสิทธิ์เข้าถึงโฮสต์อย่างชัดเจน

| หากคุณต้องการ...                           | ใช้สิ่งนี้ก่อน                                 | จากนั้นอ่าน                                                                                                       |
| ------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| ให้เอเจนต์ทำงานด้วยความสามารถที่มีอยู่ | [เครื่องมือในตัว](#built-in-tool-categories)    | [หมวดหมู่เครื่องมือ](#built-in-tool-categories)                                                                    |
| ควบคุมสิ่งที่เอเจนต์เรียกใช้ได้              | [นโยบายเครื่องมือ](#configure-access-and-approvals) | [เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools)                                                             |
| สอนเวิร์กโฟลว์ให้เอเจนต์                   | [Skills](#choose-tools-skills-or-plugins)      | [Skills](/th/tools/skills), [การสร้าง Skills](/th/tools/creating-skills), และ [เวิร์กช็อป Skills](/th/tools/skill-workshop) |
| เพิ่มการผสานรวมหรือพื้นผิวรันไทม์ใหม่    | [Plugins](#extend-capabilities)                | [Plugins](/th/tools/plugin) และ [สร้าง Plugins](/th/plugins/building-plugins)                                         |
| รันงานภายหลังหรือในพื้นหลัง         | [Automation](/th/automation)                      | [ภาพรวม Automation](/th/automation)                                                                              |
| ประสานงานเอเจนต์หรือ harness หลายตัว     | [เอเจนต์ย่อย](/th/tools/subagents)                 | [เอเจนต์ ACP](/th/tools/acp-agents) และ [การส่งของเอเจนต์](/th/tools/agent-send)                                             |
| ค้นหาแค็ตตาล็อกเครื่องมือ OpenClaw ขนาดใหญ่        | [Tool Search](/th/tools/tool-search)              | [Tool Search](/th/tools/tool-search)                                                                               |

## เลือกเครื่องมือ Skills หรือ Plugins

<Steps>
  <Step title="Use a tool when the agent needs to act">
    เครื่องมือคือฟังก์ชันที่มีชนิดซึ่งเอเจนต์เรียกใช้ได้ เช่น `exec`, `browser`,
    `web_search`, `message` หรือ `image_generate` ใช้เครื่องมือเมื่อเอเจนต์
    ต้องอ่านข้อมูล เปลี่ยนไฟล์ ส่งข้อความ เรียกผู้ให้บริการ หรือควบคุม
    ระบบอื่น เครื่องมือที่มองเห็นได้จะถูกส่งไปยังโมเดลเป็นนิยามฟังก์ชันแบบมีโครงสร้าง

    โมเดลจะเห็นเฉพาะเครื่องมือที่ผ่านโปรไฟล์ที่ใช้งานอยู่ นโยบาย allow/deny
    ข้อจำกัดของผู้ให้บริการ สถานะแซนด์บ็อกซ์ สิทธิ์ของช่องทาง และ
    ความพร้อมใช้งานของ Plugin

  </Step>

  <Step title="Use a skill when the agent needs instructions">
    Skill คือแพ็กคำสั่ง `SKILL.md` ที่โหลดเข้าไปในพรอมป์ของเอเจนต์ ใช้
    Skill เมื่อเอเจนต์มีเครื่องมือที่ต้องใช้แล้ว แต่ต้องการเวิร์กโฟลว์ที่ทำซ้ำได้
    เกณฑ์รีวิว ลำดับคำสั่ง หรือข้อจำกัดการปฏิบัติงาน

    Skills สามารถอยู่ในเวิร์กสเปซ ไดเรกทอรี Skills ที่ใช้ร่วมกัน ราก Skills ของ OpenClaw
    ที่จัดการไว้ หรือแพ็กเกจ Plugin

    [Skills](/th/tools/skills) | [เวิร์กช็อป Skills](/th/tools/skill-workshop) | [การสร้าง Skills](/th/tools/creating-skills) | [การกำหนดค่า Skills](/th/tools/skills-config)

  </Step>

  <Step title="Use a plugin when OpenClaw needs a new capability">
    Plugin สามารถเพิ่มเครื่องมือ Skills ช่องทาง ผู้ให้บริการโมเดล เสียงพูด เสียงแบบเรียลไทม์
    การสร้างสื่อ การค้นหาเว็บ การดึงเว็บ hooks และความสามารถรันไทม์อื่นๆ
    ใช้ Plugin เมื่อความสามารถนั้นมีโค้ด ข้อมูลรับรอง hooks วงจรชีวิต
    เมทาดาทา manifest หรือแพ็กเกจที่ติดตั้งได้ Plugins ที่มีอยู่สามารถติดตั้งได้จาก
    ClawHub, npm, git, ไดเรกทอรีภายในเครื่อง หรือไฟล์เก็บถาวร

    [ติดตั้งและกำหนดค่า Plugins](/th/tools/plugin) | [สร้าง Plugins](/th/plugins/building-plugins) | [Plugin SDK](/th/plugins/sdk-overview)

  </Step>
</Steps>

## หมวดหมู่เครื่องมือในตัว

ตารางนี้แสดงเครื่องมือตัวแทนเพื่อให้คุณจำแนกพื้นผิวได้ ไม่ใช่เอกสารอ้างอิงนโยบาย
ทั้งหมด สำหรับกลุ่มที่แน่นอน ค่าเริ่มต้น และความหมายของ allow/deny
ให้ใช้ [เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools)

| หมวดหมู่                | ใช้เมื่อเอเจนต์ต้องการ...                                                | เครื่องมือตัวแทน                                                 | อ่านต่อ                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| รันไทม์                 | รันคำสั่ง จัดการกระบวนการ หรือใช้การวิเคราะห์ Python ที่มีผู้ให้บริการรองรับ        | `exec`, `process`, `code_execution`                                  | [Exec](/th/tools/exec), [การประมวลผลโค้ด](/th/tools/code-execution)                                |
| ไฟล์                   | อ่านและเปลี่ยนไฟล์ในเวิร์กสเปซ                                               | `read`, `write`, `edit`, `apply_patch`                               | [Apply patch](/th/tools/apply-patch)                                                           |
| เว็บ                     | ค้นหาเว็บ ค้นหาโพสต์ X หรือดึงเนื้อหาหน้าเว็บที่อ่านได้                | `web_search`, `x_search`, `web_fetch`                                | [เครื่องมือเว็บ](/th/tools/web), [Web fetch](/th/tools/web-fetch)                                      |
| เบราว์เซอร์                 | ควบคุมเซสชันเบราว์เซอร์                                                     | `browser`                                                            | [เบราว์เซอร์](/th/tools/browser)                                                                   |
| การส่งข้อความและช่องทาง  | ส่งคำตอบหรือการกระทำของช่องทาง                                               | `message`                                                            | [การส่งของเอเจนต์](/th/tools/agent-send)                                                             |
| เซสชันและเอเจนต์     | ตรวจสอบเซสชัน มอบหมายงาน กำกับการรันอื่น หรือรายงานสถานะ          | `sessions_*`, `subagents`, `agents_list`, `session_status`, `goal`   | [Goal](/th/tools/goal), [เอเจนต์ย่อย](/th/tools/subagents), [เครื่องมือเซสชัน](/th/concepts/session-tool) |
| Automation              | กำหนดเวลางานหรือตอบสนองต่อเหตุการณ์พื้นหลัง                                 | `cron`, `heartbeat_respond`                                          | [Automation](/th/automation)                                                                   |
| Gateway และโหนด       | ตรวจสอบสถานะ Gateway หรืออุปกรณ์เป้าหมายที่จับคู่ไว้                                | `gateway`, `nodes`                                                   | [การกำหนดค่า Gateway](/th/gateway/configuration), [โหนด](/th/nodes)                            |
| สื่อ                   | วิเคราะห์ สร้าง หรือพูดสื่อ                                             | `image`, `image_generate`, `music_generate`, `video_generate`, `tts` | [ภาพรวมสื่อ](/th/tools/media-overview)                                                     |
| แค็ตตาล็อก OpenClaw ขนาดใหญ่ | ค้นหาและเรียกใช้เครื่องมือที่เข้าเกณฑ์จำนวนมากโดยไม่ส่งทุก schema ไปยังโมเดล | `tool_search_code`, `tool_search`, `tool_describe`                   | [Tool Search](/th/tools/tool-search)                                                           |

<Note>
Tool Search เป็นพื้นผิวเอเจนต์ OpenClaw แบบทดลอง การรัน Codex harness ใช้
โหมดโค้ดแบบเนทีฟของ Codex การค้นหาเครื่องมือแบบเนทีฟ เครื่องมือไดนามิกแบบเลื่อนเวลา
และการเรียกเครื่องมือซ้อนกันแทน `tools.toolSearch`
</Note>

## เครื่องมือที่ Plugin จัดหาให้

Plugins สามารถลงทะเบียนเครื่องมือเพิ่มเติมได้ ผู้เขียน Plugin เชื่อมเครื่องมือผ่าน
`api.registerTool(...)` และ `contracts.tools` ของ manifest; ใช้
[Plugin SDK](/th/plugins/sdk-overview) และ [Plugin manifest](/th/plugins/manifest)
สำหรับรายละเอียดสัญญา

เครื่องมือทั่วไปที่ Plugin จัดหาให้ประกอบด้วย:

- [Diffs](/th/tools/diffs) สำหรับเรนเดอร์ diff ของไฟล์และ markdown
- [LLM Task](/th/tools/llm-task) สำหรับขั้นตอนเวิร์กโฟลว์แบบ JSON เท่านั้น
- [Lobster](/th/tools/lobster) สำหรับเวิร์กโฟลว์แบบมีชนิดพร้อมการอนุมัติที่กลับมาทำต่อได้
- [Tokenjuice](/th/tools/tokenjuice) สำหรับบีบอัดเอาต์พุตของเครื่องมือ `exec` และ `bash`
  ที่มีสัญญาณรบกวน
- [Tool Search](/th/tools/tool-search) สำหรับค้นพบและเรียกใช้แค็ตตาล็อกเครื่องมือขนาดใหญ่
  โดยไม่ใส่ทุก schema ลงในพรอมป์
- [Canvas](/th/plugins/reference/canvas) สำหรับการควบคุม Canvas ของโหนดและการเรนเดอร์
  A2UI

## กำหนดค่าการเข้าถึงและการอนุมัติ

นโยบายเครื่องมือถูกบังคับใช้ก่อนการเรียกโมเดล หากนโยบายลบเครื่องมือออก
โมเดลจะไม่ได้รับ schema ของเครื่องมือนั้นสำหรับเทิร์นนั้น การรันอาจสูญเสียเครื่องมือ
เนื่องจากการกำหนดค่าส่วนกลาง การกำหนดค่ารายเอเจนต์ นโยบายช่องทาง
ข้อจำกัดของผู้ให้บริการ กฎแซนด์บ็อกซ์ นโยบายช่องทาง/รันไทม์ หรือความพร้อมใช้งานของ Plugin

- [เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools) บันทึกโปรไฟล์เครื่องมือ
  รายการ allow/deny ข้อจำกัดเฉพาะผู้ให้บริการ การตรวจจับลูป และ
  การตั้งค่าเครื่องมือที่มีผู้ให้บริการรองรับ
- [การอนุมัติ Exec](/th/tools/exec-approvals) บันทึกนโยบายการอนุมัติคำสั่งโฮสต์
- [Elevated exec](/th/tools/elevated) บันทึกการประมวลผลแบบควบคุมนอก
  แซนด์บ็อกซ์
- [แซนด์บ็อกซ์เทียบกับนโยบายเครื่องมือเทียบกับ elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) อธิบายว่าเลเยอร์ใดควบคุมการเข้าถึงไฟล์และกระบวนการ
- [แซนด์บ็อกซ์และข้อจำกัดเครื่องมือรายเอเจนต์](/th/tools/multi-agent-sandbox-tools)
  บันทึกข้อจำกัดเฉพาะเอเจนต์สำหรับการรันที่มอบหมาย

## ขยายความสามารถ

เลือกเส้นทางการขยายตามงานที่คุณต้องการให้ OpenClaw ทำ:

- ติดตั้งหรือจัดการ Plugin ที่มีอยู่ด้วย [Plugins](/th/tools/plugin)
- สร้างการผสานรวม ผู้ให้บริการ ช่องทาง เครื่องมือ หรือ hook ใหม่ด้วย
  [สร้าง Plugins](/th/plugins/building-plugins)
- เพิ่มหรือปรับคำสั่งเอเจนต์ที่ใช้ซ้ำได้ด้วย [Skills](/th/tools/skills) และ
  [การสร้าง Skills](/th/tools/creating-skills)
- ใช้ [Plugin SDK](/th/plugins/sdk-overview) และ [Plugin manifest](/th/plugins/manifest) เมื่อคุณต้องการสัญญาการใช้งาน

## แก้ปัญหาเครื่องมือที่หายไป

หากโมเดลมองไม่เห็นหรือเรียกใช้เครื่องมือไม่ได้ ให้เริ่มจากนโยบายที่มีผลสำหรับ
เทิร์นปัจจุบัน:

1. ตรวจสอบโปรไฟล์ที่ใช้งานอยู่ `tools.allow` และ `tools.deny` ใน
   [เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools)
2. ตรวจสอบข้อจำกัดเฉพาะผู้ให้บริการใน
   [เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools) และยืนยันว่า
   [ผู้ให้บริการโมเดล](/th/concepts/model-providers) ที่เลือกไว้รองรับรูปทรงของเครื่องมือ
3. ตรวจสอบสิทธิ์ของช่องทาง สถานะแซนด์บ็อกซ์ และสิทธิ์เข้าถึงแบบ elevated ด้วย
   [แซนด์บ็อกซ์เทียบกับนโยบายเครื่องมือเทียบกับ elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) และ [Elevated exec](/th/tools/elevated)
4. ตรวจสอบว่า Plugin เจ้าของถูกติดตั้งและเปิดใช้งานใน
   [Plugins](/th/tools/plugin)
5. สำหรับการรันที่มอบหมาย ให้ตรวจสอบข้อจำกัดรายเอเจนต์ใน
   [แซนด์บ็อกซ์และข้อจำกัดเครื่องมือรายเอเจนต์](/th/tools/multi-agent-sandbox-tools)
6. สำหรับแค็ตตาล็อก OpenClaw ขนาดใหญ่ ให้ยืนยันว่าการรันใช้การเปิดเผยเครื่องมือโดยตรงหรือ
   [Tool Search](/th/tools/tool-search)

## ที่เกี่ยวข้อง

- [Automation](/th/automation) สำหรับ cron, tasks, heartbeat, commitments, hooks, standing orders และ TaskFlow
- [Agents](/th/concepts/agent) สำหรับโมเดลเอเจนต์ เซสชัน หน่วยความจำ และการประสานงานหลายเอเจนต์
- [เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools) สำหรับเอกสารอ้างอิงนโยบายเครื่องมือฉบับหลัก
- [Plugins](/th/tools/plugin) สำหรับการติดตั้งและการจัดการ Plugin
- [Plugin SDK](/th/plugins/sdk-overview) สำหรับเอกสารอ้างอิงของผู้เขียน Plugin
- [Skills](/th/tools/skills) สำหรับลำดับการโหลด Skill, gating และ config
- [เวิร์กช็อป Skills](/th/tools/skill-workshop) สำหรับการสร้าง Skill ที่สร้างและตรวจทานแล้ว
- [Tool Search](/th/tools/tool-search) สำหรับการค้นพบแค็ตตาล็อกเครื่องมือ OpenClaw แบบกะทัดรัด
