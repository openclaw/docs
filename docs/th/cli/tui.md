---
read_when:
    - คุณต้องการ UI เทอร์มินัลสำหรับ Gateway (เหมาะกับการใช้งานระยะไกล)
    - คุณต้องการส่ง url/token/session จากสคริปต์
    - คุณต้องการเรียกใช้ TUI ในโหมดฝังในเครื่องโดยไม่ใช้ Gateway
    - คุณต้องการใช้ openclaw chat หรือ openclaw tui --local
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw tui` (UI เทอร์มินัลแบบฝังในเครื่องหรือที่รองรับด้วย Gateway)
title: TUI
x-i18n:
    generated_at: "2026-06-27T17:24:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 514bbbcd0b695e8d4ccc87d1e242d816e264ac1f8b137f2bd891803ef7f48d5a
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

เปิด UI เทอร์มินัลที่เชื่อมต่อกับ Gateway หรือเรียกใช้ในโหมดฝังตัวในเครื่อง

ที่เกี่ยวข้อง:

- คู่มือ TUI: [TUI](/th/web/tui)

## ตัวเลือก

| แฟล็ก                 | ค่าเริ่มต้น                              | คำอธิบาย                                                                 |
| --------------------- | ----------------------------------------- | ------------------------------------------------------------------------ |
| `--local`             | `false`                                   | เรียกใช้กับรันไทม์เอเจนต์แบบฝังตัวในเครื่องแทน Gateway                |
| `--url <url>`         | `gateway.remote.url` จาก config           | URL WebSocket ของ Gateway                                                |
| `--token <token>`     | (ไม่มี)                                  | โทเค็น Gateway หากจำเป็น                                                |
| `--password <pass>`   | (ไม่มี)                                  | รหัสผ่าน Gateway หากจำเป็น                                              |
| `--session <key>`     | `main` (หรือ `global` เมื่อขอบเขตเป็น global) | คีย์เซสชัน ภายในเวิร์กสเปซของเอเจนต์ ระบบจะเลือกเอเจนต์นั้นโดยอัตโนมัติ เว้นแต่จะมีคำนำหน้า |
| `--deliver`           | `false`                                   | ส่งคำตอบของผู้ช่วยผ่านช่องทางที่กำหนดค่าไว้                            |
| `--thinking <level>`  | (ค่าเริ่มต้นของโมเดล)                    | ค่าแทนที่ระดับการคิด                                                    |
| `--message <text>`    | (ไม่มี)                                  | ส่งข้อความเริ่มต้นหลังเชื่อมต่อ                                        |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | หมดเวลาของเอเจนต์ ค่าที่ไม่ถูกต้องจะบันทึกคำเตือนและถูกละเว้น          |
| `--history-limit <n>` | `200`                                     | รายการประวัติที่จะโหลดเมื่อแนบ                                          |

นามแฝง: `openclaw chat` และ `openclaw terminal` เรียกใช้คำสั่งเดียวกันโดยถือว่ามี `--local`

หมายเหตุ:

- `chat` และ `terminal` เป็นนามแฝงของ `openclaw tui --local`
- `--local` ใช้ร่วมกับ `--url`, `--token` หรือ `--password` ไม่ได้
- `tui` จะแก้ค่า SecretRefs สำหรับการยืนยันตัวตน Gateway ที่กำหนดค่าไว้สำหรับการยืนยันตัวตนด้วยโทเค็น/รหัสผ่านเมื่อเป็นไปได้ (ผู้ให้บริการ `env`/`file`/`exec`)
- เมื่อเริ่มจากภายในไดเรกทอรีเวิร์กสเปซของเอเจนต์ที่กำหนดค่าไว้ TUI จะเลือกเอเจนต์นั้นโดยอัตโนมัติเป็นค่าเริ่มต้นของคีย์เซสชัน (เว้นแต่ `--session` จะเป็น `agent:<id>:...` อย่างชัดเจน)
- หากต้องการแสดงชื่อโฮสต์ของ Gateway ในส่วนท้ายสำหรับการเชื่อมต่อที่อิง URL และไม่ใช่ในเครื่อง ให้เรียกใช้ `openclaw config set tui.footer.showRemoteHost true` ป้ายชื่อโฮสต์จะปิดเป็นค่าเริ่มต้นและจะไม่ปรากฏสำหรับการเชื่อมต่อแบบ loopback หรือการเชื่อมต่อในเครื่องแบบฝังตัว
- โหมดในเครื่องใช้รันไทม์เอเจนต์แบบฝังตัวโดยตรง เครื่องมือในเครื่องส่วนใหญ่ใช้งานได้ แต่ฟีเจอร์ที่มีเฉพาะ Gateway จะไม่พร้อมใช้งาน
- โหมดในเครื่องเพิ่ม `/auth [provider]` ภายในพื้นผิวคำสั่ง TUI
- เกตการอนุมัติ Plugin ยังคงมีผลในโหมดในเครื่อง เครื่องมือที่ต้องการการอนุมัติจะแจ้งให้ตัดสินใจในเทอร์มินัล ไม่มีสิ่งใดได้รับการอนุมัติโดยอัตโนมัติแบบเงียบ ๆ เพียงเพราะไม่ได้ใช้ Gateway
- [เป้าหมาย](/th/tools/goal) ของเซสชันจะปรากฏในส่วนท้ายและจัดการได้ด้วย `/goal`

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

## ลูปซ่อมแซม Config

ใช้โหมดในเครื่องเมื่อ config ปัจจุบันตรวจสอบผ่านแล้ว และคุณต้องการให้เอเจนต์แบบฝังตัวตรวจสอบ config เปรียบเทียบกับเอกสาร และช่วยซ่อมแซมจากเทอร์มินัลเดียวกัน:

หาก `openclaw config validate` ล้มเหลวอยู่แล้ว ให้ใช้ `openclaw configure` หรือ `openclaw doctor --fix` ก่อน `openclaw chat` ไม่ข้ามตัวป้องกัน config ที่ไม่ถูกต้อง

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

ใช้การแก้ไขแบบเจาะจงด้วย `openclaw config set` หรือ `openclaw configure` จากนั้นเรียก `openclaw config validate` อีกครั้ง ดู [TUI](/th/web/tui) และ [Config](/th/cli/config)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [TUI](/th/web/tui)
- [เป้าหมาย](/th/tools/goal)
