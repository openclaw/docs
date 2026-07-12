---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: จัดการรันไทม์ของแซนด์บ็อกซ์และตรวจสอบนโยบายแซนด์บ็อกซ์ที่มีผลบังคับใช้
title: CLI แซนด์บ็อกซ์
x-i18n:
    generated_at: "2026-07-12T16:02:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

จัดการรันไทม์แซนด์บ็อกซ์สำหรับการเรียกใช้เอเจนต์แบบแยกสภาพแวดล้อม: คอนเทนเนอร์ Docker, เป้าหมาย SSH หรือแบ็กเอนด์ OpenShell

## คำสั่ง

### `openclaw sandbox list`

แสดงรายการรันไทม์แซนด์บ็อกซ์ พร้อมสถานะ แบ็กเอนด์ การตรงกันของการกำหนดค่า อายุ เวลาที่ไม่ได้ใช้งาน และเซสชัน/เอเจนต์ที่เกี่ยวข้อง

```bash
openclaw sandbox list
openclaw sandbox list --browser  # เฉพาะคอนเทนเนอร์เบราว์เซอร์
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

ลบรันไทม์แซนด์บ็อกซ์เพื่อบังคับให้สร้างใหม่ด้วยการกำหนดค่าปัจจุบัน รันไทม์จะถูกสร้างใหม่โดยอัตโนมัติในครั้งถัดไปที่ใช้งานเอเจนต์

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # รวมเซสชันย่อย agent:mybot:*
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # เฉพาะคอนเทนเนอร์เบราว์เซอร์
openclaw sandbox recreate --all --force        # ข้ามการยืนยัน
```

ตัวเลือก:

- `--all`: สร้างคอนเทนเนอร์แซนด์บ็อกซ์ทั้งหมดใหม่
- `--session <key>`: สร้างรันไทม์ที่มีคีย์ขอบเขตตรงกันทุกประการนี้ใหม่ (ตามที่แสดงโดย `sandbox list`); ไม่มีการขยายชื่อแบบสั้น
- `--agent <id>`: สร้างรันไทม์สำหรับเอเจนต์หนึ่งตัวใหม่ (ตรงกับ `agent:<id>` และ `agent:<id>:*`)
- `--browser`: มีผลเฉพาะกับคอนเทนเนอร์เบราว์เซอร์
- `--force`: ข้ามข้อความแจ้งให้ยืนยัน

ระบุเพียงหนึ่งตัวเลือกจาก `--all`, `--session` หรือ `--agent`

สำหรับ `ssh` และ OpenShell `remote` การสร้างใหม่มีความสำคัญมากกว่า Docker: พื้นที่ทำงานระยะไกลจะเป็นแหล่งข้อมูลหลักหลังจากการเตรียมข้อมูลเริ่มต้น `recreate` จะลบพื้นที่ทำงานระยะไกลหลักนั้นสำหรับขอบเขตที่เลือก และการเรียกใช้ครั้งถัดไปจะเตรียมข้อมูลใหม่จากพื้นที่ทำงานภายในเครื่องปัจจุบัน

### `openclaw sandbox explain`

ตรวจสอบโหมด/ขอบเขตแซนด์บ็อกซ์ที่มีผล การเข้าถึงพื้นที่ทำงาน นโยบายเครื่องมือของแซนด์บ็อกซ์ และเงื่อนไขควบคุมเครื่องมือที่มีสิทธิ์ระดับสูง (พร้อมพาธคีย์การกำหนดค่าสำหรับแก้ไข)

รายงานจะคง `workspaceRoot` ไว้เป็นรากแซนด์บ็อกซ์ที่กำหนดค่า และแสดงพื้นที่ทำงานของโฮสต์ที่มีผล ไดเรกทอรีทำงานของรันไทม์แบ็กเอนด์ และตารางเมานต์ของ Docker แยกกัน สำหรับ `workspaceAccess: "rw"` พื้นที่ทำงานของโฮสต์ที่มีผลคือพื้นที่ทำงานของเอเจนต์ ไม่ใช่ไดเรกทอรีภายใต้ `workspaceRoot`

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

ต่างจาก `recreate --session` คำสั่งนี้ยอมรับชื่อเซสชันแบบสั้น (ตัวอย่างเช่น `main`) และขยายชื่อโดยอ้างอิงเอเจนต์ที่ได้รับการแก้ไขแล้ว

## เหตุผลที่ต้องสร้างใหม่

การอัปเดตการกำหนดค่าแซนด์บ็อกซ์ไม่มีผลต่อคอนเทนเนอร์ที่กำลังทำงาน: รันไทม์ที่มีอยู่จะยังคงใช้การตั้งค่าเดิม และรันไทม์ที่ไม่ได้ใช้งานจะถูกล้างหลังจาก `prune.idleHours` เท่านั้น (ค่าเริ่มต้น 24 ชั่วโมง) เอเจนต์ที่ใช้งานเป็นประจำอาจทำให้รันไทม์ที่ใช้การตั้งค่าเก่าคงอยู่ได้โดยไม่มีกำหนด `openclaw sandbox recreate` จะลบรันไทม์เก่า เพื่อให้การใช้งานครั้งถัดไปสร้างรันไทม์ใหม่จากการกำหนดค่าปัจจุบัน

<Tip>
ควรใช้ `openclaw sandbox recreate` แทนการล้างข้อมูลเฉพาะแบ็กเอนด์ด้วยตนเอง คำสั่งนี้ใช้รีจิสทรีรันไทม์ของ Gateway และหลีกเลี่ยงความไม่ตรงกันเมื่อขอบเขตหรือคีย์เซสชันเปลี่ยนแปลง
</Tip>

## สาเหตุทั่วไปที่ต้องดำเนินการ

| การเปลี่ยนแปลง                                                                                                                                                 | คำสั่ง                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| อัปเดตอิมเมจ Docker (`agents.defaults.sandbox.docker.image`)                                                                                                   | `openclaw sandbox recreate --all`                                   |
| การกำหนดค่าแซนด์บ็อกซ์ (`agents.defaults.sandbox.*`)                                                                                                           | `openclaw sandbox recreate --all`                                   |
| เป้าหมาย/การยืนยันตัวตน SSH (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`) | `openclaw sandbox recreate --all`                                   |
| แหล่งที่มา/นโยบาย/โหมดของ OpenShell (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                    | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all` (หรือ `--agent <id>` สำหรับเอเจนต์หนึ่งตัว) |

<Note>
รันไทม์จะถูกสร้างใหม่โดยอัตโนมัติเมื่อมีการใช้งานเอเจนต์ครั้งถัดไป
</Note>

## การย้ายรีจิสทรี

ข้อมูลเมตาของรันไทม์แซนด์บ็อกซ์อยู่ในฐานข้อมูลสถานะ SQLite ที่ใช้ร่วมกัน การติดตั้งรุ่นเก่าอาจมีไฟล์รีจิสทรีแบบเดิมที่การอ่านตามปกติจะไม่เขียนทับอีกต่อไป:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- ชาร์ด JSON หนึ่งไฟล์ต่อคอนเทนเนอร์/เบราว์เซอร์ภายใต้ `~/.openclaw/sandbox/containers/` หรือ `~/.openclaw/sandbox/browsers/`

เรียกใช้ `openclaw doctor --fix` เพื่อย้ายรายการแบบเดิมที่ถูกต้องไปยัง SQLite ไฟล์แบบเดิมที่ไม่ถูกต้องจะถูกแยกกัก เพื่อไม่ให้รีจิสทรีเก่าที่เสียหายบดบังรายการรันไทม์ปัจจุบัน

## การกำหนดค่า

การตั้งค่าแซนด์บ็อกซ์อยู่ใน `~/.openclaw/openclaw.json` ภายใต้ `agents.defaults.sandbox` (ค่าที่กำหนดทับสำหรับแต่ละเอเจนต์อยู่ใน `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // ปิด, ไม่ใช่เซสชันหลัก, ทั้งหมด
        "backend": "docker", // docker, ssh, openshell (Plugin เป็นผู้จัดหา)
        "scope": "agent", // เซสชัน, เอเจนต์, ใช้ร่วมกัน
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... ตัวเลือก Docker เพิ่มเติม
        },
        "prune": {
          "idleHours": 24, // ล้างโดยอัตโนมัติหลังจากไม่ได้ใช้งาน 24 ชั่วโมง
          "maxAgeDays": 7, // ล้างโดยอัตโนมัติหลังจาก 7 วัน
        },
      },
    },
  },
}
```

## เนื้อหาที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การใช้แซนด์บ็อกซ์](/th/gateway/sandboxing)
- [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace)
- [Doctor](/th/gateway/doctor): ตรวจสอบการตั้งค่าแซนด์บ็อกซ์
