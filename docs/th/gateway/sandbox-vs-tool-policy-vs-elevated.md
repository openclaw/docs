---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'เหตุใดเครื่องมือจึงถูกบล็อก: รันไทม์แซนด์บ็อกซ์, นโยบายอนุญาต/ปฏิเสธเครื่องมือ และด่านการดำเนินการแบบยกระดับสิทธิ์'
title: แซนด์บ็อกซ์เทียบกับนโยบายเครื่องมือเทียบกับการยกระดับสิทธิ์
x-i18n:
    generated_at: "2026-05-10T19:39:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d670aa4f2e0f2265590e0de6198de841e744d210bbc54d291cb448d368e63b6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw มีการควบคุมที่เกี่ยวข้องกันสามอย่าง (แต่แตกต่างกัน):

1. **แซนด์บ็อกซ์** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) กำหนดว่า **เครื่องมือทำงานที่ใด** (แบ็กเอนด์แซนด์บ็อกซ์หรือโฮสต์)
2. **นโยบายเครื่องมือ** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) กำหนดว่า **เครื่องมือใดพร้อมใช้งาน/ได้รับอนุญาต**
3. **ยกระดับสิทธิ์** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) เป็น **ช่องทางออกเฉพาะ `exec`** เพื่อรันนอกแซนด์บ็อกซ์เมื่อคุณอยู่ในแซนด์บ็อกซ์ (`gateway` ตามค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย `exec` ถูกกำหนดค่าเป็น `node`)

## ดีบักอย่างรวดเร็ว

ใช้ตัวตรวจสอบเพื่อดูว่า OpenClaw กำลังทำอะไร _จริงๆ_:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

จะแสดง:

- โหมด/ขอบเขต/การเข้าถึงพื้นที่ทำงานของแซนด์บ็อกซ์ที่มีผล
- เซสชันปัจจุบันอยู่ในแซนด์บ็อกซ์หรือไม่ (หลักเทียบกับไม่ใช่หลัก)
- การอนุญาต/ปฏิเสธเครื่องมือแซนด์บ็อกซ์ที่มีผล (และมาจาก agent/global/default หรือไม่)
- เกตการยกระดับสิทธิ์และพาธคีย์สำหรับแก้ไข

## แซนด์บ็อกซ์: เครื่องมือรันที่ใด

การใช้แซนด์บ็อกซ์ถูกควบคุมโดย `agents.defaults.sandbox.mode`:

- `"off"`: ทุกอย่างรันบนโฮสต์
- `"non-main"`: เฉพาะเซสชันที่ไม่ใช่หลักเท่านั้นที่อยู่ในแซนด์บ็อกซ์ (กรณี “น่าประหลาดใจ” ที่พบบ่อยสำหรับกลุ่ม/ช่องทาง)
- `"all"`: ทุกอย่างอยู่ในแซนด์บ็อกซ์

ดู [การใช้แซนด์บ็อกซ์](/th/gateway/sandboxing) สำหรับเมทริกซ์แบบเต็ม (ขอบเขต, เมานต์พื้นที่ทำงาน, อิมเมจ)

### Bind mounts (การตรวจสอบความปลอดภัยแบบรวดเร็ว)

- `docker.binds` _เจาะผ่าน_ ระบบไฟล์ของแซนด์บ็อกซ์: สิ่งใดก็ตามที่คุณเมานต์จะมองเห็นได้ภายในคอนเทนเนอร์ด้วยโหมดที่คุณตั้ง (`:ro` หรือ `:rw`)
- ค่าเริ่มต้นคืออ่าน-เขียนหากคุณละโหมดไว้ ควรใช้ `:ro` สำหรับซอร์ส/ความลับ
- `scope: "shared"` จะไม่ใช้ bind ราย agent (ใช้เฉพาะ bind ระดับโกลบอล)
- OpenClaw ตรวจสอบแหล่งที่มาของ bind สองครั้ง: ครั้งแรกบนพาธต้นทางที่ทำให้เป็นมาตรฐานแล้ว จากนั้นตรวจอีกครั้งหลังจาก resolve ผ่าน ancestor ที่มีอยู่ลึกที่สุด การหนีผ่านพาเรนต์ที่เป็น symlink จะไม่ข้ามการตรวจสอบพาธที่ถูกบล็อกหรือรากที่ได้รับอนุญาต
- พาธปลายทาง leaf ที่ยังไม่มีอยู่ยังคงถูกตรวจสอบอย่างปลอดภัย หาก `/workspace/alias-out/new-file` resolve ผ่านพาเรนต์ที่เป็น symlink ไปยังพาธที่ถูกบล็อกหรืออยู่นอกรากที่ได้รับอนุญาตที่กำหนดค่าไว้ bind จะถูกปฏิเสธ
- การ bind `/var/run/docker.sock` เท่ากับมอบการควบคุมโฮสต์ให้แซนด์บ็อกซ์โดยมีผลจริง ทำเฉพาะเมื่อเจตนาเท่านั้น
- การเข้าถึงพื้นที่ทำงาน (`workspaceAccess: "ro"`/`"rw"`) เป็นอิสระจากโหมด bind

## นโยบายเครื่องมือ: เครื่องมือใดมีอยู่/เรียกใช้ได้

มีสองเลเยอร์ที่สำคัญ:

- **โปรไฟล์เครื่องมือ**: `tools.profile` และ `agents.list[].tools.profile` (allowlist พื้นฐาน)
- **โปรไฟล์เครื่องมือของผู้ให้บริการ**: `tools.byProvider[provider].profile` และ `agents.list[].tools.byProvider[provider].profile`
- **นโยบายเครื่องมือระดับโกลบอล/ราย agent**: `tools.allow`/`tools.deny` และ `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **นโยบายเครื่องมือของผู้ให้บริการ**: `tools.byProvider[provider].allow/deny` และ `agents.list[].tools.byProvider[provider].allow/deny`
- **นโยบายเครื่องมือของแซนด์บ็อกซ์** (ใช้เฉพาะเมื่ออยู่ในแซนด์บ็อกซ์): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` และ `agents.list[].tools.sandbox.tools.*`

หลักปฏิบัติทั่วไป:

- `deny` ชนะเสมอ
- หาก `allow` ไม่ว่าง ทุกอย่างที่เหลือจะถือว่าถูกบล็อก
- นโยบายเครื่องมือคือจุดหยุดเด็ดขาด: `/exec` ไม่สามารถข้าม `exec` tool ที่ถูกปฏิเสธได้
- นโยบายเครื่องมือกรองความพร้อมใช้งานของเครื่องมือตามชื่อ ไม่ได้ตรวจสอบผลข้างเคียงภายใน `exec` หากอนุญาต `exec` แล้ว การปฏิเสธ `write`, `edit` หรือ `apply_patch` ไม่ได้ทำให้คำสั่ง shell เป็นแบบอ่านอย่างเดียว
- `/exec` เปลี่ยนเฉพาะค่าเริ่มต้นของเซสชันสำหรับผู้ส่งที่ได้รับอนุญาต ไม่ได้ให้สิทธิ์เข้าถึงเครื่องมือ
  คีย์เครื่องมือของผู้ให้บริการรับได้ทั้ง `provider` (เช่น `google-antigravity`) หรือ `provider/model` (เช่น `openai/gpt-5.4`)

### กลุ่มเครื่องมือ (ชวเลข)

นโยบายเครื่องมือ (โกลบอล, agent, แซนด์บ็อกซ์) รองรับรายการ `group:*` ที่ขยายเป็นหลายเครื่องมือ:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

กลุ่มที่พร้อมใช้งาน:

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` ยอมรับเป็น
  alias สำหรับ `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
  สำหรับ agent แบบอ่านอย่างเดียว ให้ปฏิเสธ `group:runtime` รวมถึงเครื่องมือระบบไฟล์ที่แก้ไขได้ เว้นแต่นโยบายระบบไฟล์ของแซนด์บ็อกซ์หรือขอบเขตโฮสต์แยกต่างหากจะบังคับข้อจำกัดอ่านอย่างเดียว
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: เครื่องมือ OpenClaw ในตัวทั้งหมด (ไม่รวม Plugin ของผู้ให้บริการ)

## ยกระดับสิทธิ์: “รันบนโฮสต์” เฉพาะ exec

การยกระดับสิทธิ์ **ไม่ได้** ให้เครื่องมือเพิ่ม เพียงมีผลกับ `exec` เท่านั้น

- หากคุณอยู่ในแซนด์บ็อกซ์ `/elevated on` (หรือ `exec` พร้อม `elevated: true`) จะรันนอกแซนด์บ็อกซ์ (การอนุมัติอาจยังคงมีผล)
- ใช้ `/elevated full` เพื่อข้ามการอนุมัติ exec สำหรับเซสชัน
- หากคุณรันแบบตรงอยู่แล้ว การยกระดับสิทธิ์แทบไม่มีผล (แต่ยังถูก gate)
- การยกระดับสิทธิ์ **ไม่ได้** ผูกกับ Skills และ **ไม่ได้** ข้าม allow/deny ของเครื่องมือ
- การยกระดับสิทธิ์ไม่ได้ให้ override ข้ามโฮสต์แบบอิสระจาก `host=auto`; จะทำตามกฎเป้าหมาย exec ตามปกติ และคง `node` ไว้เฉพาะเมื่อเป้าหมายที่กำหนดค่า/เป้าหมายของเซสชันเป็น `node` อยู่แล้ว
- `/exec` แยกจากการยกระดับสิทธิ์ ใช้ปรับเฉพาะค่าเริ่มต้นของ exec ต่อเซสชันสำหรับผู้ส่งที่ได้รับอนุญาต

เกต:

- การเปิดใช้: `tools.elevated.enabled` (และอาจรวมถึง `agents.list[].tools.elevated.enabled`)
- allowlist ของผู้ส่ง: `tools.elevated.allowFrom.<provider>` (และอาจรวมถึง `agents.list[].tools.elevated.allowFrom.<provider>`)

ดู [โหมดการยกระดับสิทธิ์](/th/tools/elevated)

## วิธีแก้ “คุกแซนด์บ็อกซ์” ที่พบบ่อย

### “Tool X ถูกบล็อกโดยนโยบายเครื่องมือของแซนด์บ็อกซ์”

คีย์แก้ไข (เลือกหนึ่งรายการ):

- ปิดแซนด์บ็อกซ์: `agents.defaults.sandbox.mode=off` (หรือราย agent `agents.list[].sandbox.mode=off`)
- อนุญาตเครื่องมือภายในแซนด์บ็อกซ์:
  - ลบออกจาก `tools.sandbox.tools.deny` (หรือราย agent `agents.list[].tools.sandbox.tools.deny`)
  - หรือเพิ่มลงใน `tools.sandbox.tools.allow` (หรือ allow ราย agent)

### “ฉันคิดว่านี่เป็น main ทำไมจึงอยู่ในแซนด์บ็อกซ์?”

ในโหมด `"non-main"` คีย์กลุ่ม/ช่องทาง _ไม่ใช่_ main ใช้คีย์เซสชันหลัก (แสดงโดย `sandbox explain`) หรือเปลี่ยนโหมดเป็น `"off"`

## ที่เกี่ยวข้อง

- [การใช้แซนด์บ็อกซ์](/th/gateway/sandboxing) -- เอกสารอ้างอิงแซนด์บ็อกซ์ฉบับเต็ม (โหมด, ขอบเขต, แบ็กเอนด์, อิมเมจ)
- [แซนด์บ็อกซ์และเครื่องมือแบบหลาย Agent](/th/tools/multi-agent-sandbox-tools) -- override ราย agent และลำดับความสำคัญ
- [โหมดการยกระดับสิทธิ์](/th/tools/elevated)
