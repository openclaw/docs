---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'เหตุผลที่เครื่องมือถูกบล็อก: รันไทม์แซนด์บ็อกซ์, นโยบายอนุญาต/ปฏิเสธเครื่องมือ และเกตการเรียกใช้แบบยกระดับ'
title: แซนด์บ็อกซ์ เทียบกับนโยบายเครื่องมือ เทียบกับการยกระดับสิทธิ์
x-i18n:
    generated_at: "2026-05-06T09:15:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd303355774e3d73161b5704ba664d7418160e9b6792a904c7d5092e0351b320
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw มีการควบคุมที่เกี่ยวข้องกันสามส่วน (แต่แตกต่างกัน):

1. **แซนด์บ็อกซ์** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) กำหนดว่า **เครื่องมือจะทำงานที่ไหน** (แบ็กเอนด์แซนด์บ็อกซ์หรือโฮสต์)
2. **นโยบายเครื่องมือ** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) กำหนดว่า **เครื่องมือใดพร้อมใช้งาน/ได้รับอนุญาต**
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) เป็น **ทางออกฉุกเฉินสำหรับ exec เท่านั้น** เพื่อรันนอกแซนด์บ็อกซ์เมื่อคุณอยู่ในแซนด์บ็อกซ์ (`gateway` เป็นค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec ถูกกำหนดค่าเป็น `node`)

## ดีบักแบบรวดเร็ว

ใช้ตัวตรวจสอบเพื่อดูว่า OpenClaw กำลังทำอะไร _จริงๆ_:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

ระบบจะแสดง:

- โหมด/ขอบเขต/การเข้าถึงเวิร์กสเปซของแซนด์บ็อกซ์ที่มีผล
- เซสชันปัจจุบันอยู่ในแซนด์บ็อกซ์หรือไม่ (main เทียบกับ non-main)
- การอนุญาต/ปฏิเสธเครื่องมือในแซนด์บ็อกซ์ที่มีผล (และมาจาก agent/global/default หรือไม่)
- เกต Elevated และพาธคีย์สำหรับการแก้ไข

## แซนด์บ็อกซ์: เครื่องมือทำงานที่ไหน

การใช้แซนด์บ็อกซ์ควบคุมด้วย `agents.defaults.sandbox.mode`:

- `"off"`: ทุกอย่างรันบนโฮสต์
- `"non-main"`: เฉพาะเซสชัน non-main เท่านั้นที่อยู่ในแซนด์บ็อกซ์ (จุดที่มัก "ไม่คาดคิด" สำหรับกลุ่ม/ช่อง)
- `"all"`: ทุกอย่างอยู่ในแซนด์บ็อกซ์

ดู [การใช้แซนด์บ็อกซ์](/th/gateway/sandboxing) สำหรับเมทริกซ์แบบเต็ม (ขอบเขต, การเมานต์เวิร์กสเปซ, อิมเมจ)

### Bind mounts (ตรวจสอบความปลอดภัยแบบรวดเร็ว)

- `docker.binds` _เจาะผ่าน_ ระบบไฟล์ของแซนด์บ็อกซ์: สิ่งใดก็ตามที่คุณเมานต์จะมองเห็นได้ภายในคอนเทนเนอร์ตามโหมดที่คุณตั้งไว้ (`:ro` หรือ `:rw`)
- ค่าเริ่มต้นคืออ่าน-เขียนหากคุณละโหมดไว้; แนะนำให้ใช้ `:ro` สำหรับซอร์ส/ความลับ
- `scope: "shared"` จะละเว้น binds ราย agent (ใช้เฉพาะ binds ส่วนกลาง)
- OpenClaw ตรวจสอบ bind sources สองครั้ง: ครั้งแรกบน source path ที่ normalize แล้ว จากนั้นตรวจสอบอีกครั้งหลังจาก resolve ผ่าน ancestor ที่มีอยู่ลึกที่สุด การหลุดออกผ่าน symlink-parent จะไม่ข้ามการตรวจสอบ blocked-path หรือ allowed-root
- พาธปลายทางที่ยังไม่มีอยู่จะยังถูกตรวจสอบอย่างปลอดภัย หาก `/workspace/alias-out/new-file` resolve ผ่าน parent ที่เป็น symlink ไปยังพาธที่ถูกบล็อกหรืออยู่นอก allowed roots ที่กำหนดไว้ bind จะถูกปฏิเสธ
- การ bind `/var/run/docker.sock` เท่ากับมอบการควบคุมโฮสต์ให้แซนด์บ็อกซ์; ทำเฉพาะเมื่อจงใจเท่านั้น
- การเข้าถึงเวิร์กสเปซ (`workspaceAccess: "ro"`/`"rw"`) แยกจากโหมด bind

## นโยบายเครื่องมือ: เครื่องมือใดมีอยู่/เรียกใช้ได้

มีสองชั้นที่สำคัญ:

- **โปรไฟล์เครื่องมือ**: `tools.profile` และ `agents.list[].tools.profile` (allowlist พื้นฐาน)
- **โปรไฟล์เครื่องมือของผู้ให้บริการ**: `tools.byProvider[provider].profile` และ `agents.list[].tools.byProvider[provider].profile`
- **นโยบายเครื่องมือส่วนกลาง/ราย agent**: `tools.allow`/`tools.deny` และ `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **นโยบายเครื่องมือของผู้ให้บริการ**: `tools.byProvider[provider].allow/deny` และ `agents.list[].tools.byProvider[provider].allow/deny`
- **นโยบายเครื่องมือในแซนด์บ็อกซ์** (ใช้เฉพาะเมื่ออยู่ในแซนด์บ็อกซ์): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` และ `agents.list[].tools.sandbox.tools.*`

กฎทั่วไป:

- `deny` ชนะเสมอ
- หาก `allow` ไม่ว่างเปล่า อย่างอื่นทั้งหมดจะถือว่าถูกบล็อก
- นโยบายเครื่องมือคือจุดหยุดเด็ดขาด: `/exec` ไม่สามารถ override เครื่องมือ `exec` ที่ถูกปฏิเสธได้
- `/exec` เปลี่ยนเฉพาะค่าเริ่มต้นของเซสชันสำหรับผู้ส่งที่ได้รับอนุญาตเท่านั้น; ไม่ได้ให้สิทธิ์เข้าถึงเครื่องมือ
  คีย์เครื่องมือของผู้ให้บริการรับได้ทั้ง `provider` (เช่น `google-antigravity`) หรือ `provider/model` (เช่น `openai/gpt-5.4`)

### กลุ่มเครื่องมือ (คำย่อ)

นโยบายเครื่องมือ (ส่วนกลาง, agent, แซนด์บ็อกซ์) รองรับรายการ `group:*` ที่ขยายเป็นเครื่องมือหลายรายการ:

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

กลุ่มที่มี:

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` ยอมรับเป็น
  alias ของ `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
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

## Elevated: “รันบนโฮสต์” สำหรับ exec เท่านั้น

Elevated **ไม่ได้** ให้เครื่องมือเพิ่มเติม; มีผลกับ `exec` เท่านั้น

- หากคุณอยู่ในแซนด์บ็อกซ์ `/elevated on` (หรือ `exec` พร้อม `elevated: true`) จะรันนอกแซนด์บ็อกซ์ (อาจยังต้องมีการอนุมัติ)
- ใช้ `/elevated full` เพื่อข้ามการอนุมัติ exec สำหรับเซสชัน
- หากคุณรันแบบ direct อยู่แล้ว Elevated จะไม่มีผลจริง (แต่ยังถูกควบคุมด้วยเกต)
- Elevated **ไม่ได้** จำกัดตาม skill และ **ไม่ได้** override allow/deny ของเครื่องมือ
- Elevated ไม่ได้ให้ override ข้ามโฮสต์แบบกำหนดเองจาก `host=auto`; มันทำตามกฎเป้าหมาย exec ปกติ และคง `node` ไว้เฉพาะเมื่อเป้าหมายที่กำหนดค่าไว้/ของเซสชันเป็น `node` อยู่แล้ว
- `/exec` แยกจาก Elevated โดยจะปรับเฉพาะค่าเริ่มต้น exec ต่อเซสชันสำหรับผู้ส่งที่ได้รับอนุญาต

เกต:

- การเปิดใช้งาน: `tools.elevated.enabled` (และเลือกใช้ `agents.list[].tools.elevated.enabled`)
- allowlists ของผู้ส่ง: `tools.elevated.allowFrom.<provider>` (และเลือกใช้ `agents.list[].tools.elevated.allowFrom.<provider>`)

ดู [โหมด Elevated](/th/tools/elevated)

## การแก้ไข “คุกแซนด์บ็อกซ์” ที่พบบ่อย

### “Tool X ถูกบล็อกโดยนโยบายเครื่องมือของแซนด์บ็อกซ์”

คีย์สำหรับแก้ไข (เลือกหนึ่งรายการ):

- ปิดใช้แซนด์บ็อกซ์: `agents.defaults.sandbox.mode=off` (หรือราย agent `agents.list[].sandbox.mode=off`)
- อนุญาตเครื่องมือภายในแซนด์บ็อกซ์:
  - นำออกจาก `tools.sandbox.tools.deny` (หรือราย agent `agents.list[].tools.sandbox.tools.deny`)
  - หรือเพิ่มเข้าใน `tools.sandbox.tools.allow` (หรือ allow ราย agent)

### “ฉันนึกว่านี่คือ main ทำไมถึงอยู่ในแซนด์บ็อกซ์?”

ในโหมด `"non-main"` คีย์ของกลุ่ม/ช่อง _ไม่ใช่_ main ให้ใช้คีย์เซสชัน main (แสดงโดย `sandbox explain`) หรือเปลี่ยนโหมดเป็น `"off"`

## ที่เกี่ยวข้อง

- [การใช้แซนด์บ็อกซ์](/th/gateway/sandboxing) -- เอกสารอ้างอิงแซนด์บ็อกซ์แบบเต็ม (โหมด, ขอบเขต, แบ็กเอนด์, อิมเมจ)
- [แซนด์บ็อกซ์และเครื่องมือแบบ Multi-Agent](/th/tools/multi-agent-sandbox-tools) -- การ override ราย agent และลำดับความสำคัญ
- [โหมด Elevated](/th/tools/elevated)
