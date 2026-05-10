---
read_when:
    - คุณต้องการส่วนติดต่อผู้ใช้บนเทอร์มินัลสำหรับ Gateway (เหมาะกับการใช้งานระยะไกล)
    - คุณต้องการส่ง url/token/session จากสคริปต์
    - คุณต้องการเรียกใช้ TUI ในโหมดฝังตัวในเครื่องโดยไม่มี Gateway
    - คุณต้องการใช้ openclaw chat หรือ openclaw tui --local
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw tui` (ที่รองรับโดย Gateway หรือ UI เทอร์มินัลแบบฝังในเครื่อง)
title: TUI
x-i18n:
    generated_at: "2026-05-10T19:32:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e59f0f5360a456d19cfee38adc540b27665c55de68480616f269d1088f13677
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

เปิด UI เทอร์มินัลที่เชื่อมต่อกับ Gateway หรือเรียกใช้ในโหมดฝังตัวภายในเครื่อง

ที่เกี่ยวข้อง:

- คู่มือ TUI: [TUI](/th/web/tui)

## ตัวเลือก

| แฟล็ก                 | ค่าเริ่มต้น                                | คำอธิบาย                                                                 |
| --------------------- | ----------------------------------------- | ------------------------------------------------------------------------ |
| `--local`             | `false`                                   | เรียกใช้กับรันไทม์เอเจนต์แบบฝังตัวภายในเครื่องแทน Gateway              |
| `--url <url>`         | `gateway.remote.url` จากค่ากำหนด          | URL WebSocket ของ Gateway                                                |
| `--token <token>`     | (ไม่มี)                                   | โทเค็น Gateway หากจำเป็น                                                 |
| `--password <pass>`   | (ไม่มี)                                   | รหัสผ่าน Gateway หากจำเป็น                                               |
| `--session <key>`     | `main` (หรือ `global` เมื่อขอบเขตเป็น global) | คีย์เซสชัน ภายในพื้นที่ทำงานของเอเจนต์ ระบบจะเลือกเอเจนต์นั้นโดยอัตโนมัติ เว้นแต่จะมีคำนำหน้า |
| `--deliver`           | `false`                                   | ส่งคำตอบของผู้ช่วยผ่านช่องทางที่กำหนดค่าไว้                              |
| `--thinking <level>`  | (ค่าเริ่มต้นของโมเดล)                    | แทนที่ระดับการคิด                                                        |
| `--message <text>`    | (ไม่มี)                                   | ส่งข้อความเริ่มต้นหลังจากเชื่อมต่อ                                       |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | หมดเวลาของเอเจนต์ ค่าที่ไม่ถูกต้องจะบันทึกคำเตือนและถูกละเว้น           |
| `--history-limit <n>` | `200`                                     | รายการประวัติที่จะโหลดเมื่อแนบ                                           |

นามแฝง: `openclaw chat` และ `openclaw terminal` เรียกคำสั่งเดียวกันโดยถือว่ามี `--local`

หมายเหตุ:

- `chat` และ `terminal` เป็นนามแฝงของ `openclaw tui --local`
- `--local` ไม่สามารถใช้ร่วมกับ `--url`, `--token` หรือ `--password`
- `tui` จะแก้ไข SecretRefs สำหรับการยืนยันตัวตน Gateway ที่กำหนดค่าไว้สำหรับการยืนยันตัวตนด้วยโทเค็น/รหัสผ่านเมื่อทำได้ (ผู้ให้บริการ `env`/`file`/`exec`)
- เมื่อเปิดจากภายในไดเรกทอรีพื้นที่ทำงานของเอเจนต์ที่กำหนดค่าไว้ TUI จะเลือกเอเจนต์นั้นโดยอัตโนมัติเป็นค่าเริ่มต้นของคีย์เซสชัน (เว้นแต่ `--session` จะเป็น `agent:<id>:...` อย่างชัดเจน)
- โหมดภายในเครื่องใช้รันไทม์เอเจนต์แบบฝังตัวโดยตรง เครื่องมือภายในเครื่องส่วนใหญ่ทำงานได้ แต่ฟีเจอร์ที่มีเฉพาะ Gateway จะใช้งานไม่ได้
- โหมดภายในเครื่องเพิ่ม `/auth [provider]` ภายในพื้นผิวคำสั่งของ TUI
- เกตการอนุมัติของ Plugin ยังคงมีผลในโหมดภายในเครื่อง เครื่องมือที่ต้องมีการอนุมัติจะแจ้งให้ตัดสินใจในเทอร์มินัล ไม่มีสิ่งใดถูกอนุมัติโดยอัตโนมัติอย่างเงียบ ๆ เพียงเพราะไม่ได้เกี่ยวข้องกับ Gateway

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

## ลูปซ่อมแซมค่ากำหนด

ใช้โหมดภายในเครื่องเมื่อค่ากำหนดปัจจุบันตรวจสอบผ่านแล้ว และคุณต้องการให้เอเจนต์แบบฝังตัวตรวจสอบ เปรียบเทียบกับเอกสาร และช่วยซ่อมแซมจากเทอร์มินัลเดียวกัน:

หาก `openclaw config validate` ล้มเหลวอยู่แล้ว ให้ใช้ `openclaw configure` หรือ `openclaw doctor --fix` ก่อน `openclaw chat` ไม่ข้ามตัวป้องกันค่ากำหนดที่ไม่ถูกต้อง

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

ใช้การแก้ไขแบบเจาะจงด้วย `openclaw config set` หรือ `openclaw configure` จากนั้นเรียก `openclaw config validate` อีกครั้ง ดู [TUI](/th/web/tui) และ [ค่ากำหนด](/th/cli/config)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [TUI](/th/web/tui)
