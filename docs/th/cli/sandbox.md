---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: จัดการรันไทม์แซนด์บ็อกซ์และตรวจสอบนโยบายแซนด์บ็อกซ์ที่มีผลบังคับใช้
title: CLI แซนด์บ็อกซ์
x-i18n:
    generated_at: "2026-04-30T09:44:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65520040611ccf0cfc28b28f0caf2ed1c7d3b32de06eec7884131042bba4a01e
    source_path: cli/sandbox.md
    workflow: 16
---

จัดการรันไทม์แซนด์บ็อกซ์สำหรับการทำงานของเอเจนต์แบบแยกโดดเดี่ยว

## ภาพรวม

OpenClaw สามารถเรียกใช้เอเจนต์ในรันไทม์แซนด์บ็อกซ์แบบแยกโดดเดี่ยวเพื่อความปลอดภัยได้ คำสั่ง `sandbox` ช่วยให้คุณตรวจสอบและสร้างรันไทม์เหล่านั้นใหม่หลังการอัปเดตหรือการเปลี่ยนแปลงการกำหนดค่า

โดยทั่วไปในปัจจุบัน หมายถึง:

- คอนเทนเนอร์แซนด์บ็อกซ์ของ Docker
- รันไทม์แซนด์บ็อกซ์ของ SSH เมื่อ `agents.defaults.sandbox.backend = "ssh"`
- รันไทม์แซนด์บ็อกซ์ของ OpenShell เมื่อ `agents.defaults.sandbox.backend = "openshell"`

สำหรับ `ssh` และ OpenShell `remote` การสร้างใหม่มีความสำคัญมากกว่าการใช้ Docker:

- พื้นที่ทำงานระยะไกลเป็นแหล่งข้อมูลหลักหลังจาก seed ครั้งแรก
- `openclaw sandbox recreate` จะลบพื้นที่ทำงานระยะไกลหลักนั้นสำหรับขอบเขตที่เลือก
- การใช้งานครั้งถัดไปจะ seed อีกครั้งจากพื้นที่ทำงานภายในเครื่องปัจจุบัน

## คำสั่ง

### `openclaw sandbox explain`

ตรวจสอบโหมด/ขอบเขต/การเข้าถึงพื้นที่ทำงานของแซนด์บ็อกซ์ที่มีผลใช้งานจริง นโยบายเครื่องมือแซนด์บ็อกซ์ และเกตแบบยกระดับสิทธิ์ พร้อมเส้นทางคีย์การกำหนดค่าสำหรับแก้ไข

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

**เอาต์พุตประกอบด้วย:**

- ชื่อรันไทม์และสถานะ
- แบ็กเอนด์ (`docker`, `openshell` ฯลฯ)
- ป้ายกำกับการกำหนดค่า และตรงกับการกำหนดค่าปัจจุบันหรือไม่
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
- `--session <key>`: สร้างคอนเทนเนอร์ใหม่สำหรับเซสชันเฉพาะ
- `--agent <id>`: สร้างคอนเทนเนอร์ใหม่สำหรับเอเจนต์เฉพาะ
- `--browser`: สร้างใหม่เฉพาะคอนเทนเนอร์เบราว์เซอร์
- `--force`: ข้ามพรอมต์ยืนยัน

<Note>
รันไทม์จะถูกสร้างใหม่โดยอัตโนมัติเมื่อใช้งานเอเจนต์ในครั้งถัดไป
</Note>

## กรณีการใช้งาน

### หลังอัปเดตอิมเมจ Docker

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### หลังเปลี่ยนการกำหนดค่าแซนด์บ็อกซ์

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### หลังเปลี่ยนเป้าหมาย SSH หรือข้อมูลรับรอง SSH

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
บนเป้าหมาย SSH การรันครั้งถัดไปจะ seed อีกครั้งจากพื้นที่ทำงานภายในเครื่อง

### หลังเปลี่ยนแหล่งที่มา นโยบาย หรือโหมดของ OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

สำหรับโหมด OpenShell `remote` การสร้างใหม่จะลบพื้นที่ทำงานระยะไกลหลัก
สำหรับขอบเขตนั้น การรันครั้งถัดไปจะ seed อีกครั้งจากพื้นที่ทำงานภายในเครื่อง

### หลังเปลี่ยน setupCommand

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

## เหตุผลที่จำเป็นต้องใช้

เมื่อคุณอัปเดตการกำหนดค่าแซนด์บ็อกซ์:

- รันไทม์ที่มีอยู่จะยังคงทำงานด้วยการตั้งค่าเดิม
- รันไทม์จะถูกล้างเฉพาะหลังไม่มีการใช้งาน 24 ชั่วโมง
- เอเจนต์ที่ใช้งานเป็นประจำจะคงรันไทม์เดิมไว้ได้ไม่มีกำหนด

ใช้ `openclaw sandbox recreate` เพื่อบังคับลบรันไทม์เดิม รันไทม์เหล่านั้นจะถูกสร้างใหม่โดยอัตโนมัติด้วยการตั้งค่าปัจจุบันเมื่อจำเป็นต้องใช้ครั้งถัดไป

<Tip>
ควรใช้ `openclaw sandbox recreate` แทนการล้างข้อมูลเฉพาะแบ็กเอนด์ด้วยตนเอง คำสั่งนี้ใช้รีจิสทรีรันไทม์ของ Gateway และหลีกเลี่ยงความไม่ตรงกันเมื่อขอบเขตหรือคีย์เซสชันเปลี่ยนไป
</Tip>

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
- [การใช้แซนด์บ็อกซ์](/th/gateway/sandboxing)
- [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace)
- [Doctor](/th/gateway/doctor): ตรวจสอบการตั้งค่าแซนด์บ็อกซ์
