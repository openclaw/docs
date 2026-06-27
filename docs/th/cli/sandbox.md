---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: จัดการรันไทม์แซนด์บ็อกซ์และตรวจสอบนโยบายแซนด์บ็อกซ์ที่มีผลบังคับใช้
title: CLI แซนด์บ็อกซ์
x-i18n:
    generated_at: "2026-06-27T17:23:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeba1a5530bb946b334cfe399b7a0c862694ae47c55b2341d7146333e112602a
    source_path: cli/sandbox.md
    workflow: 16
---

จัดการรันไทม์แซนด์บ็อกซ์สำหรับการเรียกใช้เอเจนต์แบบแยกโดดเดี่ยว

## ภาพรวม

OpenClaw สามารถเรียกใช้เอเจนต์ในรันไทม์แซนด์บ็อกซ์แบบแยกโดดเดี่ยวเพื่อความปลอดภัยได้ คำสั่ง `sandbox` ช่วยให้คุณตรวจสอบและสร้างรันไทม์เหล่านั้นใหม่หลังจากอัปเดตหรือเปลี่ยนแปลงการกำหนดค่า

ปัจจุบันโดยทั่วไปหมายถึง:

- คอนเทนเนอร์แซนด์บ็อกซ์ของ Docker
- รันไทม์แซนด์บ็อกซ์ SSH เมื่อ `agents.defaults.sandbox.backend = "ssh"`
- รันไทม์แซนด์บ็อกซ์ OpenShell เมื่อ `agents.defaults.sandbox.backend = "openshell"`

สำหรับ `ssh` และ OpenShell `remote` การสร้างใหม่สำคัญกว่าเมื่อเทียบกับ Docker:

- พื้นที่ทำงานระยะไกลเป็นแหล่งอ้างอิงหลักหลังจาก seed ครั้งแรก
- `openclaw sandbox recreate` จะลบพื้นที่ทำงานระยะไกลที่เป็นแหล่งอ้างอิงหลักนั้นสำหรับขอบเขตที่เลือก
- การใช้งานครั้งถัดไปจะ seed ใหม่อีกครั้งจากพื้นที่ทำงานภายในเครื่องปัจจุบัน

## คำสั่ง

### `openclaw sandbox explain`

ตรวจสอบโหมด/ขอบเขต/การเข้าถึงพื้นที่ทำงานของแซนด์บ็อกซ์ที่ **มีผลจริง** นโยบายเครื่องมือแซนด์บ็อกซ์ และด่านยกระดับสิทธิ์ (พร้อมพาธคีย์การกำหนดค่าสำหรับแก้ไข)

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

แสดงรายการรันไทม์แซนด์บ็อกซ์ทั้งหมดพร้อมสถานะและการกำหนดค่า

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**ผลลัพธ์ประกอบด้วย:**

- ชื่อและสถานะของรันไทม์
- แบ็กเอนด์ (`docker`, `openshell` และอื่น ๆ)
- ป้ายกำกับการกำหนดค่าและว่าตรงกับการกำหนดค่าปัจจุบันหรือไม่
- อายุ (เวลาตั้งแต่สร้าง)
- เวลาว่าง (เวลาตั้งแต่ใช้งานครั้งล่าสุด)
- เซสชัน/เอเจนต์ที่เกี่ยวข้อง

### `openclaw sandbox recreate`

ลบรันไทม์แซนด์บ็อกซ์เพื่อบังคับให้สร้างใหม่ด้วยการกำหนดค่าที่อัปเดตแล้ว

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**ตัวเลือก:**

- `--all`: สร้างคอนเทนเนอร์แซนด์บ็อกซ์ทั้งหมดใหม่
- `--session <key>`: สร้างคอนเทนเนอร์สำหรับเซสชันเฉพาะใหม่
- `--agent <id>`: สร้างคอนเทนเนอร์สำหรับเอเจนต์เฉพาะใหม่
- `--browser`: สร้างเฉพาะคอนเทนเนอร์เบราว์เซอร์ใหม่
- `--force`: ข้ามพรอมป์ยืนยัน

<Note>
รันไทม์จะถูกสร้างใหม่โดยอัตโนมัติเมื่อใช้งานเอเจนต์ครั้งถัดไป
</Note>

## กรณีการใช้งาน

### หลังจากอัปเดตอิมเมจ Docker

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### หลังจากเปลี่ยนการกำหนดค่าแซนด์บ็อกซ์

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### หลังจากเปลี่ยนเป้าหมาย SSH หรือข้อมูลยืนยันตัวตน SSH

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

สำหรับแบ็กเอนด์หลัก `ssh` การสร้างใหม่จะลบรากพื้นที่ทำงานระยะไกลรายขอบเขต
บนเป้าหมาย SSH การรันครั้งถัดไปจะ seed ใหม่อีกครั้งจากพื้นที่ทำงานภายในเครื่อง

### หลังจากเปลี่ยนแหล่งที่มา นโยบาย หรือโหมดของ OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

สำหรับโหมด OpenShell `remote` การสร้างใหม่จะลบพื้นที่ทำงานระยะไกลที่เป็นแหล่งอ้างอิงหลัก
สำหรับขอบเขตนั้น การรันครั้งถัดไปจะ seed ใหม่อีกครั้งจากพื้นที่ทำงานภายในเครื่อง

### หลังจากเปลี่ยน setupCommand

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### สำหรับเอเจนต์เฉพาะเท่านั้น

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## เหตุผลที่ต้องใช้สิ่งนี้

เมื่อคุณอัปเดตการกำหนดค่าแซนด์บ็อกซ์:

- รันไทม์ที่มีอยู่จะยังคงทำงานด้วยการตั้งค่าเดิม
- รันไทม์จะถูก prune หลังจากไม่มีการใช้งาน 24 ชั่วโมงเท่านั้น
- เอเจนต์ที่ใช้งานเป็นประจำจะทำให้รันไทม์เดิมคงอยู่ต่อไปอย่างไม่มีกำหนด

ใช้ `openclaw sandbox recreate` เพื่อบังคับลบรันไทม์เดิม รันไทม์เหล่านั้นจะถูกสร้างใหม่โดยอัตโนมัติด้วยการตั้งค่าปัจจุบันเมื่อจำเป็นต้องใช้งานครั้งถัดไป

<Tip>
ควรใช้ `openclaw sandbox recreate` แทนการล้างข้อมูลแบบเจาะจงแบ็กเอนด์ด้วยตนเอง คำสั่งนี้ใช้รีจิสทรีรันไทม์ของ Gateway และหลีกเลี่ยงความไม่ตรงกันเมื่อขอบเขตหรือคีย์เซสชันเปลี่ยน
</Tip>

## การย้ายรีจิสทรี

OpenClaw จัดเก็บเมตาดาต้ารันไทม์แซนด์บ็อกซ์ในฐานข้อมูลสถานะ SQLite แบบใช้ร่วมกัน การติดตั้งเก่าอาจยังมีไฟล์รีจิสทรีแซนด์บ็อกซ์แบบเดิม:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

การอัปเกรดบางรายการอาจมีชาร์ด JSON หนึ่งไฟล์ต่อคอนเทนเนอร์/เบราว์เซอร์ภายใต้ `~/.openclaw/sandbox/containers/` หรือ `~/.openclaw/sandbox/browsers/` ด้วย การอ่านรันไทม์แซนด์บ็อกซ์ตามปกติจะไม่เขียนแหล่งข้อมูลเดิมเหล่านั้นใหม่ ให้รัน `openclaw doctor --fix` เพื่อย้ายรายการเดิมที่ถูกต้องเข้า SQLite ไฟล์เดิมที่ไม่ถูกต้องจะถูกกักกัน เพื่อไม่ให้รีจิสทรีเก่าที่เสียเพียงรายการเดียวซ่อนรายการรันไทม์ปัจจุบันได้

## การกำหนดค่า

การตั้งค่าแซนด์บ็อกซ์อยู่ใน `~/.openclaw/openclaw.json` ภายใต้ `agents.defaults.sandbox` (การ override รายเอเจนต์อยู่ใน `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การทำแซนด์บ็อกซ์](/th/gateway/sandboxing)
- [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace)
- [Doctor](/th/gateway/doctor): ตรวจสอบการตั้งค่าแซนด์บ็อกซ์
