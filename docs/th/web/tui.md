---
read_when:
    - คุณต้องการคำแนะนำแบบเป็นมิตรกับผู้เริ่มต้นสำหรับ TUI
    - คุณต้องการรายการฟีเจอร์ คำสั่ง และคีย์ลัดของ TUI แบบครบถ้วน
summary: 'ส่วนติดต่อผู้ใช้แบบเทอร์มินัล (TUI): เชื่อมต่อกับ Gateway หรือรันในเครื่องแบบ embedded mode'
title: TUI
x-i18n:
    generated_at: "2026-04-25T14:02:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6eaa938fb3a50b7478341fe51cafb09e352f6d3cb402373222153ed93531a5f5
    source_path: web/tui.md
    workflow: 15
---

## เริ่มต้นอย่างรวดเร็ว

### โหมด Gateway

1. เริ่ม Gateway

```bash
openclaw gateway
```

2. เปิด TUI

```bash
openclaw tui
```

3. พิมพ์ข้อความแล้วกด Enter

Gateway ระยะไกล:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

ใช้ `--password` หาก Gateway ของคุณใช้การยืนยันตัวตนด้วยรหัสผ่าน

### โหมด Local

รัน TUI โดยไม่ใช้ Gateway:

```bash
openclaw chat
# หรือ
openclaw tui --local
```

หมายเหตุ:

- `openclaw chat` และ `openclaw terminal` เป็น aliases ของ `openclaw tui --local`
- `--local` ใช้ร่วมกับ `--url`, `--token` หรือ `--password` ไม่ได้
- โหมด local ใช้ embedded agent runtime โดยตรง เครื่องมือในเครื่องส่วนใหญ่ใช้งานได้ แต่ฟีเจอร์ที่มีเฉพาะ Gateway จะใช้ไม่ได้
- `openclaw` และ `openclaw crestodian` ก็ใช้เชลล์ TUI นี้เช่นกัน โดยใช้ Crestodian เป็น backend แชตสำหรับการตั้งค่าและการซ่อมแซมในเครื่อง

## สิ่งที่คุณจะเห็น

- Header: URL การเชื่อมต่อ agent ปัจจุบัน session ปัจจุบัน
- บันทึกแชต: ข้อความผู้ใช้ คำตอบของ assistant ประกาศของระบบ cards ของเครื่องมือ
- บรรทัดสถานะ: สถานะการเชื่อมต่อ/การรัน (connecting, running, streaming, idle, error)
- Footer: สถานะการเชื่อมต่อ + agent + session + model + think/fast/verbose/trace/reasoning + จำนวนโทเค็น + deliver
- อินพุต: ตัวแก้ไขข้อความพร้อม autocomplete

## โมเดลทางความคิด: agents + sessions

- Agents เป็น slug แบบไม่ซ้ำกัน (เช่น `main`, `research`) Gateway จะเปิดเผยรายการนี้
- Sessions เป็นของ agent ปัจจุบัน
- คีย์ session ถูกเก็บในรูปแบบ `agent:<agentId>:<sessionKey>`
  - หากคุณพิมพ์ `/session main` TUI จะขยายเป็น `agent:<currentAgent>:main`
  - หากคุณพิมพ์ `/session agent:other:main` คุณจะสลับไปยัง session ของ agent นั้นโดยตรง
- ขอบเขตของ session:
  - `per-sender` (ค่าเริ่มต้น): แต่ละ agent มีหลาย sessions
  - `global`: TUI จะใช้ session `global` เสมอ (ตัวเลือกอาจว่าง)
- agent + session ปัจจุบันจะแสดงใน footer เสมอ

## การส่ง + การส่งต่อ

- ข้อความจะถูกส่งไปยัง Gateway; การส่งต่อไปยัง providers จะปิดอยู่โดยค่าเริ่มต้น
- เปิดการส่งต่อ:
  - `/deliver on`
  - หรือในแผง Settings
  - หรือเริ่มด้วย `openclaw tui --deliver`

## Pickers + overlays

- Model picker: แสดงรายการโมเดลที่พร้อมใช้งานและตั้งค่า session override
- Agent picker: เลือก agent อื่น
- Session picker: แสดงเฉพาะ sessions ของ agent ปัจจุบัน
- Settings: สลับ deliver, การขยายเอาต์พุตของเครื่องมือ และการแสดง thinking

## คีย์ลัด

- Enter: ส่งข้อความ
- Esc: ยกเลิกการรันที่กำลังทำงาน
- Ctrl+C: ล้างอินพุต (กดสองครั้งเพื่อออก)
- Ctrl+D: ออก
- Ctrl+L: model picker
- Ctrl+G: agent picker
- Ctrl+P: session picker
- Ctrl+O: สลับการขยายเอาต์พุตของเครื่องมือ
- Ctrl+T: สลับการแสดง thinking (โหลดประวัติใหม่)

## Slash commands

หลัก:

- `/help`
- `/status`
- `/agent <id>` (หรือ `/agents`)
- `/session <key>` (หรือ `/sessions`)
- `/model <provider/model>` (หรือ `/models`)

การควบคุม session:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

วงจรชีวิต session:

- `/new` หรือ `/reset` (รีเซ็ต session)
- `/abort` (ยกเลิกการรันที่กำลังทำงาน)
- `/settings`
- `/exit`

เฉพาะโหมด local:

- `/auth [provider]` เปิด flow สำหรับ auth/login ของ provider ภายใน TUI

slash commands อื่นของ Gateway (เช่น `/context`) จะถูกส่งต่อไปยัง Gateway และแสดงเป็นเอาต์พุตของระบบ ดู [Slash commands](/th/tools/slash-commands)

## คำสั่งเชลล์ในเครื่อง

- ใส่ `!` นำหน้าบรรทัดเพื่อรันคำสั่งเชลล์ในเครื่องบนโฮสต์ของ TUI
- TUI จะถามหนึ่งครั้งต่อ session เพื่ออนุญาตการรันในเครื่อง; หากปฏิเสธ `!` จะยังคงถูกปิดสำหรับ session นั้น
- คำสั่งจะรันในเชลล์ใหม่แบบ non-interactive ในไดเรกทอรีทำงานของ TUI (ไม่มี `cd`/env แบบคงอยู่)
- คำสั่งเชลล์ในเครื่องจะได้รับ `OPENCLAW_SHELL=tui-local` ใน environment
- `!` เดี่ยว ๆ จะถูกส่งเป็นข้อความปกติ; ช่องว่างนำหน้าจะไม่ทริกเกอร์ local exec

## ซ่อมแซม config จาก TUI ในเครื่อง

ใช้โหมด local เมื่อ config ปัจจุบันผ่านการตรวจสอบอยู่แล้วและคุณต้องการให้
embedded agent ตรวจสอบบนเครื่องเดียวกัน เปรียบเทียบกับเอกสาร
และช่วยซ่อมแซมความคลาดเคลื่อนโดยไม่ต้องพึ่ง Gateway ที่กำลังรันอยู่

หาก `openclaw config validate` ล้มเหลวอยู่แล้ว ให้เริ่มด้วย `openclaw configure`
หรือ `openclaw doctor --fix` ก่อน `openclaw chat` ไม่ได้ข้ามตัวป้องกัน config ไม่ถูกต้อง

ลูปที่ใช้บ่อย:

1. เริ่มโหมด local:

```bash
openclaw chat
```

2. ถาม agent ว่าคุณต้องการให้ตรวจอะไร เช่น:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. ใช้คำสั่งเชลล์ในเครื่องเพื่อดูหลักฐานและตรวจสอบแบบตรงตัว:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. ปรับเปลี่ยนแบบเจาะจงด้วย `openclaw config set` หรือ `openclaw configure` แล้วรัน `!openclaw config validate` อีกครั้ง
5. หาก Doctor แนะนำ migration หรือการซ่อมแซมอัตโนมัติ ให้ตรวจสอบแล้วรัน `!openclaw doctor --fix`

เคล็ดลับ:

- ควรใช้ `openclaw config set` หรือ `openclaw configure` แทนการแก้ `openclaw.json` ด้วยมือ
- `openclaw docs "<query>"` จะค้นหาดัชนี docs สดจากเครื่องเดียวกัน
- `openclaw config validate --json` มีประโยชน์เมื่อคุณต้องการข้อผิดพลาด schema และ SecretRef/resolvability แบบมีโครงสร้าง

## เอาต์พุตของเครื่องมือ

- การเรียกเครื่องมือจะแสดงเป็น cards พร้อม args + results
- Ctrl+O ใช้สลับระหว่างมุมมองย่อ/ขยาย
- ระหว่างที่เครื่องมือทำงาน การอัปเดตบางส่วนจะสตรีมเข้าไปในการ์ดเดียวกัน

## สีของเทอร์มินัล

- TUI จะคงข้อความเนื้อหาของ assistant ไว้เป็นสี foreground เริ่มต้นของเทอร์มินัล เพื่อให้ทั้งเทอร์มินัลธีมมืดและธีมสว่างยังคงอ่านง่าย
- หากเทอร์มินัลของคุณใช้พื้นหลังสว่างและการตรวจจับอัตโนมัติผิด ให้ตั้งค่า `OPENCLAW_THEME=light` ก่อนเปิด `openclaw tui`
- หากต้องการบังคับใช้พาเลตต์มืดแบบเดิมแทน ให้ตั้งค่า `OPENCLAW_THEME=dark`

## ประวัติ + การสตรีม

- เมื่อเชื่อมต่อ TUI จะโหลดประวัติล่าสุด (ค่าเริ่มต้น 200 ข้อความ)
- การตอบกลับแบบสตรีมจะอัปเดตในที่เดิมจนกว่าจะเสร็จสมบูรณ์
- TUI ยังฟังเหตุการณ์เครื่องมือของ agent เพื่อแสดง cards ของเครื่องมือที่สมบูรณ์ยิ่งขึ้น

## รายละเอียดการเชื่อมต่อ

- TUI ลงทะเบียนกับ Gateway เป็น `mode: "tui"`
- การเชื่อมต่อใหม่จะแสดงเป็นข้อความระบบ; ช่องว่างของเหตุการณ์จะแสดงในบันทึก

## ตัวเลือก

- `--local`: รันกับ local embedded agent runtime
- `--url <url>`: URL WebSocket ของ Gateway (ค่าเริ่มต้นจาก config หรือ `ws://127.0.0.1:<port>`)
- `--token <token>`: token ของ Gateway (หากจำเป็น)
- `--password <password>`: รหัสผ่านของ Gateway (หากจำเป็น)
- `--session <key>`: คีย์ session (ค่าเริ่มต้น: `main` หรือ `global` เมื่อขอบเขตเป็น global)
- `--deliver`: ส่งต่อคำตอบของ assistant ไปยัง provider (ค่าเริ่มต้นปิด)
- `--thinking <level>`: override ระดับ thinking สำหรับการส่ง
- `--message <text>`: ส่งข้อความเริ่มต้นหลังจากเชื่อมต่อ
- `--timeout-ms <ms>`: timeout ของ agent เป็น ms (ค่าเริ่มต้นตาม `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: จำนวนรายการประวัติที่จะโหลด (ค่าเริ่มต้น `200`)

หมายเหตุ: เมื่อคุณตั้งค่า `--url` TUI จะไม่ fallback ไปใช้ข้อมูลรับรองจาก config หรือ environment
ให้ส่ง `--token` หรือ `--password` อย่างชัดเจน การขาดข้อมูลรับรองที่ระบุชัดถือเป็นข้อผิดพลาด
ในโหมด local อย่าส่ง `--url`, `--token` หรือ `--password`

## การแก้ไขปัญหา

ไม่มีเอาต์พุตหลังจากส่งข้อความ:

- รัน `/status` ใน TUI เพื่อยืนยันว่า Gateway เชื่อมต่ออยู่และอยู่ในสถานะ idle/busy
- ตรวจสอบ logs ของ Gateway: `openclaw logs --follow`
- ยืนยันว่า agent สามารถทำงานได้: `openclaw status` และ `openclaw models status`
- หากคุณคาดหวังข้อความในช่องทางแชต ให้เปิด delivery (`/deliver on` หรือ `--deliver`)

## การแก้ไขปัญหาการเชื่อมต่อ

- `disconnected`: ตรวจสอบให้แน่ใจว่า Gateway กำลังรันอยู่ และ `--url/--token/--password` ของคุณถูกต้อง
- ไม่มี agents ใน picker: ตรวจสอบ `openclaw agents list` และ config การกำหนดเส้นทางของคุณ
- session picker ว่าง: คุณอาจอยู่ในขอบเขต global หรือยังไม่มี sessions

## ที่เกี่ยวข้อง

- [Control UI](/th/web/control-ui) — อินเทอร์เฟซควบคุมแบบเว็บ
- [Config](/th/cli/config) — ตรวจสอบ validate และแก้ไข `openclaw.json`
- [Doctor](/th/cli/doctor) — การตรวจสอบการซ่อมแซมและ migration แบบมีคำแนะนำ
- [CLI Reference](/th/cli) — ข้อมูลอ้างอิงคำสั่ง CLI แบบเต็ม
