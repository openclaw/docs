---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'เหตุผลที่เครื่องมือถูกบล็อก: รันไทม์ sandbox, นโยบายอนุญาต/ปฏิเสธเครื่องมือ และเกต exec แบบยกระดับ'
title: แซนด์บ็อกซ์เทียบกับนโยบายเครื่องมือเทียบกับสิทธิ์ยกระดับ
x-i18n:
    generated_at: "2026-06-27T17:37:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4156cc494a6aff4fb9c44cbca8fdfde10a3343dde624c485833dd7508e4c4d6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw มีตัวควบคุมที่เกี่ยวข้องกันสามอย่าง (แต่แตกต่างกัน):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) กำหนดว่า **เครื่องมือทำงานที่ไหน** (แบ็กเอนด์ sandbox เทียบกับโฮสต์)
2. **นโยบายเครื่องมือ** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) กำหนดว่า **เครื่องมือใดพร้อมใช้งาน/ได้รับอนุญาต**
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) เป็น **ทางออกเฉพาะ exec** เพื่อรันนอก sandbox เมื่อคุณอยู่ใน sandbox (`gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อกำหนดค่าเป้าหมาย exec เป็น `node`)

## ดีบักด่วน

ใช้ตัวตรวจสอบเพื่อดูว่า OpenClaw กำลังทำอะไร _จริง ๆ_:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

คำสั่งนี้จะแสดง:

- โหมด/ขอบเขต sandbox และการเข้าถึง workspace ที่มีผลจริง
- เซสชันขณะนี้อยู่ใน sandbox หรือไม่ (main เทียบกับ non-main)
- การอนุญาต/ปฏิเสธเครื่องมือ sandbox ที่มีผลจริง (และมาจาก agent/global/default หรือไม่)
- เกต elevated และเส้นทางคีย์สำหรับแก้ไข

## Sandbox: เครื่องมือรันที่ไหน

Sandboxing ถูกควบคุมโดย `agents.defaults.sandbox.mode`:

- `"off"`: ทุกอย่างรันบนโฮสต์
- `"non-main"`: เฉพาะเซสชัน non-main เท่านั้นที่อยู่ใน sandbox (มักเป็นเรื่อง "น่าประหลาดใจ" สำหรับกลุ่ม/ช่องทาง)
- `"all"`: ทุกอย่างอยู่ใน sandbox

ดู [Sandboxing](/th/gateway/sandboxing) สำหรับเมทริกซ์ฉบับเต็ม (ขอบเขต, การเมานต์ workspace, อิมเมจ)

### Bind mounts (การตรวจสอบความปลอดภัยอย่างเร็ว)

- `docker.binds` _เจาะผ่าน_ ระบบไฟล์ sandbox: สิ่งที่คุณเมานต์จะมองเห็นได้ภายในคอนเทนเนอร์ตามโหมดที่คุณตั้ง (`:ro` หรือ `:rw`)
- ค่าเริ่มต้นคืออ่าน-เขียนหากคุณละเว้นโหมด; ควรใช้ `:ro` สำหรับซอร์ส/ความลับ
- `scope: "shared"` จะไม่สนใจ bind ราย agent (ใช้เฉพาะ bind ระดับ global)
- OpenClaw ตรวจสอบแหล่งที่มาของ bind สองครั้ง: ครั้งแรกบนเส้นทางแหล่งที่มาที่ถูกปรับมาตรฐานแล้ว จากนั้นตรวจอีกครั้งหลัง resolve ผ่าน ancestor ที่มีอยู่ที่ลึกที่สุด การ escape ผ่าน symlink-parent จะไม่ข้ามการตรวจสอบ blocked-path หรือ allowed-root
- เส้นทาง leaf ที่ไม่มีอยู่ยังคงถูกตรวจสอบอย่างปลอดภัย หาก `/workspace/alias-out/new-file` resolve ผ่าน parent ที่เป็น symlink ไปยังเส้นทางที่ถูกบล็อกหรืออยู่นอกรากที่อนุญาตที่กำหนดค่าไว้ bind จะถูกปฏิเสธ
- การ bind `/var/run/docker.sock` เท่ากับมอบการควบคุมโฮสต์ให้ sandbox; ทำเช่นนี้เฉพาะเมื่อตั้งใจเท่านั้น
- การเข้าถึง workspace (`workspaceAccess: "ro"`/`"rw"`) เป็นอิสระจากโหมด bind

## นโยบายเครื่องมือ: มี/เรียกใช้เครื่องมือใดได้บ้าง

มีสองชั้นที่สำคัญ:

- **โปรไฟล์เครื่องมือ**: `tools.profile` และ `agents.list[].tools.profile` (allowlist พื้นฐาน)
- **โปรไฟล์เครื่องมือของผู้ให้บริการ**: `tools.byProvider[provider].profile` และ `agents.list[].tools.byProvider[provider].profile`
- **นโยบายเครื่องมือระดับ global/ราย agent**: `tools.allow`/`tools.deny` และ `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **นโยบายเครื่องมือของผู้ให้บริการ**: `tools.byProvider[provider].allow/deny` และ `agents.list[].tools.byProvider[provider].allow/deny`
- **นโยบายเครื่องมือ sandbox** (ใช้เฉพาะเมื่ออยู่ใน sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` และ `agents.list[].tools.sandbox.tools.*`

หลักทั่วไป:

- `deny` ชนะเสมอ
- หาก `allow` ไม่ว่างเปล่า อย่างอื่นทั้งหมดจะถูกถือว่าถูกบล็อก
- นโยบายเครื่องมือคือจุดหยุดเด็ดขาด: `/exec` ไม่สามารถ override เครื่องมือ `exec` ที่ถูกปฏิเสธได้
- นโยบายเครื่องมือกรองความพร้อมใช้งานของเครื่องมือตามชื่อ; ไม่ได้ตรวจสอบ side effect ภายใน `exec` หากอนุญาต `exec` แล้ว การปฏิเสธ `write`, `edit` หรือ `apply_patch` ไม่ได้ทำให้คำสั่ง shell เป็นแบบอ่านอย่างเดียว
- `/exec` เปลี่ยนเฉพาะค่าเริ่มต้นของเซสชันสำหรับผู้ส่งที่ได้รับอนุญาต; ไม่ได้ให้สิทธิ์เข้าถึงเครื่องมือ
  คีย์เครื่องมือของผู้ให้บริการยอมรับได้ทั้ง `provider` (เช่น `google-antigravity`) หรือ `provider/model` (เช่น `openai/gpt-5.4`)
- บันทึก Gateway มีรายการ audit `agents/tool-policy` เมื่อขั้นตอนนโยบายเครื่องมือลบเครื่องมือออก หรือเมื่อนโยบายเครื่องมือ sandbox บล็อกการเรียก ใช้ `openclaw logs` เพื่อดูป้ายกำกับ rule, คีย์ config และชื่อเครื่องมือที่ได้รับผลกระทบ

### กลุ่มเครื่องมือ (ชวเลข)

นโยบายเครื่องมือ (global, agent, sandbox) รองรับรายการ `group:*` ที่ขยายเป็นหลายเครื่องมือ:

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

กลุ่มที่มีให้ใช้:

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` ยอมรับเป็น
  alias สำหรับ `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
  สำหรับ agent แบบอ่านอย่างเดียว ให้ปฏิเสธ `group:runtime` รวมถึงเครื่องมือระบบไฟล์ที่เปลี่ยนแปลงข้อมูล เว้นแต่นโยบายระบบไฟล์ sandbox หรือขอบเขตโฮสต์แยกต่างหากจะบังคับข้อจำกัดอ่านอย่างเดียว
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: เครื่องมือในตัวทั้งหมดของ OpenClaw (ไม่รวม Plugin ของผู้ให้บริการ)
- `group:plugins`: เครื่องมือทั้งหมดที่ Plugin ที่โหลดเป็นเจ้าของ รวมถึงเซิร์ฟเวอร์ MCP ที่กำหนดค่าซึ่งเปิดเผยผ่าน `bundle-mcp`

สำหรับเซิร์ฟเวอร์ MCP ที่อยู่ใน sandbox นโยบายเครื่องมือ sandbox คือเกตอนุญาตชั้นที่สอง หากกำหนดค่า `mcp.servers` แล้วแต่ turn ที่อยู่ใน sandbox แสดงเฉพาะเครื่องมือในตัว ให้เพิ่ม `bundle-mcp`, `group:plugins` หรือชื่อ/ glob เครื่องมือ MCP ที่มีคำนำหน้าเซิร์ฟเวอร์ เช่น `outlook__send_mail` หรือ `outlook__*` ลงใน `tools.sandbox.tools.alsoAllow` จากนั้นรีสตาร์ต/โหลด gateway ใหม่และจับรายการเครื่องมืออีกครั้ง glob ของเซิร์ฟเวอร์ใช้คำนำหน้าเซิร์ฟเวอร์ MCP ที่ปลอดภัยสำหรับผู้ให้บริการ: อักขระที่ไม่ใช่ `[A-Za-z0-9_-]` จะกลายเป็น `-`, ชื่อที่ไม่ได้ขึ้นต้นด้วยตัวอักษรจะได้คำนำหน้า `mcp-` และคำนำหน้าที่ยาวหรือซ้ำอาจถูกตัดหรือเติม suffix

ขณะนี้ `openclaw doctor` ตรวจสอบรูปทรงนี้สำหรับเซิร์ฟเวอร์ที่ OpenClaw จัดการใน `mcp.servers` เซิร์ฟเวอร์ MCP ที่โหลดจาก manifest ของ Plugin ที่ bundled หรือ Claude `.mcp.json` ใช้เกต sandbox เดียวกัน แต่การวินิจฉัยนี้ยังไม่แจกแจงแหล่งเหล่านั้น; ใช้รายการ allowlist เดียวกันหากเครื่องมือของแหล่งเหล่านั้นหายไปใน turn ที่อยู่ใน sandbox

## Elevated: "รันบนโฮสต์" เฉพาะ exec

Elevated **ไม่ได้** ให้เครื่องมือเพิ่มเติม; มีผลเฉพาะกับ `exec` เท่านั้น

- หากคุณอยู่ใน sandbox, `/elevated on` (หรือ `exec` พร้อม `elevated: true`) จะรันนอก sandbox (approval อาจยังมีผล)
- ใช้ `/elevated full` เพื่อข้าม approval ของ exec สำหรับเซสชัน
- หากคุณรันแบบ direct อยู่แล้ว elevated โดยผลจริงจะเป็น no-op (ยังคงถูกควบคุมด้วยเกต)
- Elevated **ไม่ได้** ผูกกับ skill scope และ **ไม่ได้** override allow/deny ของเครื่องมือ
- Elevated ไม่ได้ให้ override ข้ามโฮสต์แบบกำหนดเองจาก `host=auto`; ทำตามกฎเป้าหมาย exec ปกติ และคง `node` ไว้เฉพาะเมื่อเป้าหมายที่กำหนดค่า/ของเซสชันเป็น `node` อยู่แล้ว
- `/exec` แยกจาก elevated ใช้ปรับเฉพาะค่าเริ่มต้น exec ต่อเซสชันสำหรับผู้ส่งที่ได้รับอนุญาต

เกต:

- การเปิดใช้: `tools.elevated.enabled` (และเลือกใช้ `agents.list[].tools.elevated.enabled` ได้)
- allowlist ของผู้ส่ง: `tools.elevated.allowFrom.<provider>` (และเลือกใช้ `agents.list[].tools.elevated.allowFrom.<provider>` ได้)

ดู [Elevated Mode](/th/tools/elevated)

## วิธีแก้ "sandbox jail" ที่พบบ่อย

### "เครื่องมือ X ถูกบล็อกโดยนโยบายเครื่องมือ sandbox"

คีย์สำหรับแก้ไข (เลือกหนึ่งอย่าง):

- ปิดใช้งาน sandbox: `agents.defaults.sandbox.mode=off` (หรือราย agent `agents.list[].sandbox.mode=off`)
- อนุญาตเครื่องมือภายใน sandbox:
  - ลบออกจาก `tools.sandbox.tools.deny` (หรือราย agent `agents.list[].tools.sandbox.tools.deny`)
  - หรือเพิ่มลงใน `tools.sandbox.tools.allow` (หรือ allow ราย agent)
- ตรวจสอบ `openclaw logs` สำหรับรายการ `agents/tool-policy` รายการนี้บันทึกโหมด sandbox และระบุว่า rule แบบ allow หรือ deny บล็อกเครื่องมือหรือไม่

### "ฉันคิดว่านี่คือ main ทำไมถึงอยู่ใน sandbox?"

ในโหมด `"non-main"` คีย์กลุ่ม/ช่องทาง _ไม่ใช่_ main ใช้คีย์เซสชัน main (แสดงโดย `sandbox explain`) หรือเปลี่ยนโหมดเป็น `"off"`

## ที่เกี่ยวข้อง

- [Sandboxing](/th/gateway/sandboxing) -- เอกสารอ้างอิง sandbox ฉบับเต็ม (โหมด, ขอบเขต, แบ็กเอนด์, อิมเมจ)
- [Multi-Agent Sandbox & Tools](/th/tools/multi-agent-sandbox-tools) -- การ override ราย agent และลำดับความสำคัญ
- [Elevated Mode](/th/tools/elevated)
