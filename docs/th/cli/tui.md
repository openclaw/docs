---
read_when:
    - คุณต้องการ UI แบบเทอร์มินัลสำหรับ Gateway (เหมาะกับการใช้งานระยะไกล)
    - คุณต้องการส่ง url/token/session จากสคริปต์
    - คุณต้องการรัน TUI ในโหมดฝังในเครื่องโดยไม่ใช้ Gateway
    - คุณต้องการใช้ openclaw chat หรือ openclaw tui --local
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw tui` (TUI ที่ทำงานผ่าน Gateway หรือแบบฝังในเครื่อง)
title: TUI
x-i18n:
    generated_at: "2026-04-23T10:17:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4fca025a15f5e985ca6f2eaf39fcbe784bd716f24841f43450b71936db26d141
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

เปิด UI แบบเทอร์มินัลที่เชื่อมต่อกับ Gateway หรือรันใน
โหมดฝังในเครื่อง

ที่เกี่ยวข้อง:

- คู่มือ TUI: [TUI](/th/web/tui)

หมายเหตุ:

- `chat` และ `terminal` เป็นชื่ออื่นของ `openclaw tui --local`
- `--local` ไม่สามารถใช้ร่วมกับ `--url`, `--token` หรือ `--password`
- `tui` จะ resolve auth SecretRefs ของ Gateway ที่ตั้งค่าไว้สำหรับ token/password auth เมื่อทำได้ (`env`/`file`/`exec` providers)
- เมื่อเปิดจากภายในไดเรกทอรี workspace ของ agent ที่ตั้งค่าไว้ TUI จะเลือก agent นั้นโดยอัตโนมัติเป็นค่าเริ่มต้นของ session key (เว้นแต่ `--session` จะเป็น `agent:<id>:...` อย่างชัดเจน)
- โหมด local ใช้ embedded agent runtime โดยตรง เครื่องมือในโหมด local ส่วนใหญ่ใช้งานได้ แต่ฟีเจอร์ที่มีเฉพาะ Gateway จะไม่พร้อมใช้งาน
- โหมด local จะเพิ่ม `/auth [provider]` ภายในพื้นผิวคำสั่งของ TUI
- เกตการอนุมัติ Plugin ยังคงมีผลในโหมด local เครื่องมือที่ต้องได้รับการอนุมัติจะถามเพื่อขอการตัดสินใจในเทอร์มินัล; จะไม่มีสิ่งใดได้รับการอนุมัติโดยอัตโนมัติแบบเงียบ ๆ เพียงเพราะไม่ได้ใช้ Gateway

## ตัวอย่าง

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## วงจรการซ่อมแซม config

ใช้โหมด local เมื่อ config ปัจจุบันผ่านการตรวจสอบอยู่แล้ว และคุณต้องการให้
embedded agent ตรวจสอบ เปรียบเทียบกับเอกสาร และช่วยซ่อมแซม
จากเทอร์มินัลเดียวกัน

หาก `openclaw config validate` ล้มเหลวอยู่แล้ว ให้ใช้ `openclaw configure` หรือ
`openclaw doctor --fix` ก่อน `openclaw chat` จะไม่ข้ามเกต
config ไม่ถูกต้อง

```bash
openclaw chat
```

จากนั้นภายใน TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

ใช้การแก้ไขเฉพาะจุดด้วย `openclaw config set` หรือ `openclaw configure` แล้ว
รัน `openclaw config validate` อีกครั้ง ดู [TUI](/th/web/tui) และ [Config](/th/cli/config)
