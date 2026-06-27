---
read_when:
    - การเลือก auto, ask, allowlist, full หรือ deny สำหรับสิทธิ์ของคำสั่ง
    - การกำหนดค่าการอนุมัติที่ได้รับการตรวจสอบโดย Codex Guardian ผ่าน tools.exec.mode
    - การเปรียบเทียบการอนุมัติ exec ของ OpenClaw กับสิทธิ์ของฮาร์เนส ACPX
summary: โหมดสิทธิ์สำหรับ host exec, การอนุมัติของ Codex Guardian และเซสชัน harness ของ ACPX
title: โหมดสิทธิ์
x-i18n:
    generated_at: "2026-06-27T18:30:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ce89cadb45b3b96ce9ab62b35c06610d02f0ff02f15ef7d2128c59fbebb325a
    source_path: tools/permission-modes.md
    workflow: 16
---

โหมดสิทธิ์กำหนดว่า agent มีอำนาจมากแค่ไหนก่อนที่จะรันคำสั่งบนโฮสต์ เขียนไฟล์ หรือขอสิทธิ์เข้าถึงเพิ่มเติมจากฮาร์เนสแบ็กเอนด์ได้ เริ่มด้วย `tools.exec.mode: "auto"` เมื่อคุณต้องการให้ OpenClaw ใช้ allowlist ก่อน แล้วจึงใช้การตรวจทานอัตโนมัติแบบเนทีฟของ Codex หรือเส้นทางอนุมัติโดยมนุษย์สำหรับรายการที่ไม่ตรงเงื่อนไข

<Note>
  โหมดสิทธิ์แยกจาก `tools.exec.host=auto` `tools.exec.host`
  เลือกว่าคำสั่งจะรันที่ใด `tools.exec.mode` เลือกวิธีอนุมัติ
  host exec
</Note>

## ค่าเริ่มต้นที่แนะนำ

ใช้ `auto` สำหรับ agent เขียนโค้ดที่ต้องการสิทธิ์เข้าถึงโฮสต์ที่ใช้งานได้จริง โดยไม่ทำให้ทุกรายการที่ไม่ตรงเงื่อนไขกลายเป็นพรอมป์ให้มนุษย์ตอบ:

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

จากนั้นตรวจสอบนโยบายที่มีผลจริง:

```bash
openclaw exec-policy show
```

ในโหมด `auto` OpenClaw จะรันรายการที่ตรงกับ allowlist แบบกำหนดแน่นอนโดยตรง รายการอนุมัติที่ไม่ตรงเงื่อนไขจะผ่านตัวตรวจทานอัตโนมัติแบบเนทีฟของ OpenClaw ก่อน แล้วจึงถอยกลับไปใช้เส้นทางอนุมัติโดยมนุษย์ที่กำหนดค่าไว้เมื่อจำเป็น

## โหมด host exec ของ OpenClaw

`tools.exec.mode` คือพื้นผิวนโยบายที่ทำให้เป็นมาตรฐานสำหรับ `exec` บนโฮสต์

| โหมด        | พฤติกรรม                                     | ใช้เมื่อ                                              |
| ----------- | -------------------------------------------- | ----------------------------------------------------- |
| `deny`      | บล็อก host exec                              | ไม่อนุญาตให้ใช้คำสั่งบนโฮสต์                         |
| `allowlist` | รันเฉพาะคำสั่งที่อยู่ใน allowlist            | คุณมีชุดคำสั่งที่ทราบว่าปลอดภัย                      |
| `ask`       | รันรายการที่ตรงกับ allowlist และถามเมื่อไม่ตรงเงื่อนไข | มนุษย์ควรตรวจทานคำสั่งใหม่                           |
| `auto`      | รันรายการที่ตรงกับ allowlist แล้วใช้การตรวจทานอัตโนมัติ | เซสชันเขียนโค้ดต้องการสิทธิ์เข้าถึงที่มีการคุ้มกันและใช้งานได้จริง |
| `full`      | รัน host exec โดยไม่มีพรอมป์                 | โฮสต์/เซสชันที่เชื่อถือได้นี้ควรข้ามด่านอนุมัติ     |

สำหรับนโยบาย host exec ฉบับเต็ม ไฟล์อนุมัติในเครื่อง สคีมา allowlist ไบนารีที่ปลอดภัย และพฤติกรรมการส่งต่อ โปรดดู [การอนุมัติ Exec](/th/tools/exec-approvals)

## การแมป Codex Guardian

สำหรับเซสชันแอปเซิร์ฟเวอร์ Codex แบบเนทีฟ `tools.exec.mode: "auto"` จะแมปไปยังการอนุมัติที่ตรวจทานโดย Codex Guardian เมื่อข้อกำหนดของ Codex ในเครื่องอนุญาต โดยทั่วไป OpenClaw จะส่ง:

| ฟิลด์ Codex         | ค่าทั่วไป     |
| ------------------- | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

ในโหมด `auto` OpenClaw จะไม่คง override ของ Codex แบบเก่าที่ไม่ปลอดภัย เช่น `approvalPolicy: "never"` หรือ `sandbox: "danger-full-access"` ใช้ `tools.exec.mode: "full"` เฉพาะเมื่อคุณตั้งใจต้องการท่าทีแบบไม่ต้องอนุมัติ

สำหรับการตั้งค่าแอปเซิร์ฟเวอร์ ลำดับการ auth และรายละเอียดรันไทม์ Codex แบบเนทีฟ โปรดดู [ฮาร์เนส Codex](/th/plugins/codex-harness)

## สิทธิ์ของฮาร์เนส ACPX

เซสชัน ACPX เป็นแบบไม่โต้ตอบ จึงไม่สามารถคลิกพรอมป์สิทธิ์ใน TTY ได้ ACPX ใช้การตั้งค่าระดับฮาร์เนสแยกต่างหากภายใต้ `plugins.entries.acpx.config`:

| การตั้งค่า                     | ค่าที่ใช้ทั่วไป    | ความหมาย                                     |
| --------------------------- | --------------- | ------------------------------------------- |
| `permissionMode`            | `approve-reads` | อนุมัติการอ่านโดยอัตโนมัติเท่านั้น          |
| `permissionMode`            | `approve-all`   | อนุมัติการเขียนและคำสั่งเชลล์โดยอัตโนมัติ   |
| `permissionMode`            | `deny-all`      | ปฏิเสธพรอมป์สิทธิ์ทั้งหมด                   |
| `nonInteractivePermissions` | `fail`          | ยกเลิกเมื่อจำเป็นต้องมีพรอมป์               |
| `nonInteractivePermissions` | `deny`          | ปฏิเสธพรอมป์และดำเนินการต่อเมื่อทำได้       |

ตั้งค่าสิทธิ์ ACPX แยกจากการอนุมัติ exec ของ OpenClaw:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

ใช้ `approve-all` เป็นค่าเทียบเท่ากรณีฉุกเฉินของ ACPX สำหรับเซสชันฮาร์เนสแบบไม่มีพรอมป์ สำหรับรายละเอียดการตั้งค่าและโหมดความล้มเหลว โปรดดู [การตั้งค่า agent ACP](/th/tools/acp-agents-setup#permission-configuration)

## การเลือกโหมด

| เป้าหมาย                                          | การกำหนดค่า                                                   |
| --------------------------------------------- | ----------------------------------------------------------- |
| บล็อกคำสั่งบนโฮสต์ทั้งหมด                     | `tools.exec.mode: "deny"`                                   |
| ให้รันเฉพาะคำสั่งที่ทราบว่าปลอดภัย            | `tools.exec.mode: "allowlist"`                              |
| ถามมนุษย์สำหรับคำสั่งรูปแบบใหม่ทุกครั้ง       | `tools.exec.mode: "ask"`                                    |
| ใช้การตรวจทานอัตโนมัติของ Codex/OpenClaw ก่อนมนุษย์ | `tools.exec.mode: "auto"`                                   |
| ข้ามการอนุมัติ host exec ทั้งหมด              | `tools.exec.mode: "full"` พร้อมไฟล์อนุมัติบนโฮสต์ที่สอดคล้องกัน |
| ทำให้เซสชัน ACPX แบบไม่โต้ตอบเขียน/exec ได้  | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

หากคำสั่งยังคงแสดงพรอมป์หรือล้มเหลวหลังจากเปลี่ยนโหมด ให้ตรวจสอบทั้งสองชั้น:

```bash
openclaw approvals get
openclaw exec-policy show
```

Host exec ใช้ผลลัพธ์ที่เข้มงวดกว่าระหว่างการกำหนดค่า OpenClaw และไฟล์อนุมัติในเครื่องของโฮสต์ สิทธิ์ฮาร์เนส ACPX ไม่ได้ผ่อนปรนการอนุมัติ host exec และการอนุมัติ host exec ก็ไม่ได้ผ่อนปรนพรอมป์ของฮาร์เนส ACPX

## ที่เกี่ยวข้อง

- [การอนุมัติ Exec](/th/tools/exec-approvals)
- [การอนุมัติ Exec - ขั้นสูง](/th/tools/exec-approvals-advanced)
- [ฮาร์เนส Codex](/th/plugins/codex-harness)
- [การตั้งค่า agent ACP](/th/tools/acp-agents-setup#permission-configuration)
