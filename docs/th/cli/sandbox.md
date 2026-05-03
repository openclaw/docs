---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: จัดการรันไทม์แซนด์บ็อกซ์และตรวจสอบนโยบายแซนด์บ็อกซ์ที่มีผลบังคับใช้
title: CLI แซนด์บ็อกซ์
x-i18n:
    generated_at: "2026-05-03T21:28:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: c50b97c35ba8cd79416de6a167a7cbc313d063b320db7deafd42f7a570e507ac
    source_path: cli/sandbox.md
    workflow: 16
---

จัดการรันไทม์แซนด์บ็อกซ์สำหรับการดำเนินการเอเจนต์แบบแยกส่วนอย่างโดดเดี่ยว

## ภาพรวม

OpenClaw สามารถเรียกใช้เอเจนต์ในรันไทม์แซนด์บ็อกซ์แบบแยกส่วนอย่างโดดเดี่ยวเพื่อความปลอดภัยได้ คำสั่ง `sandbox` ช่วยให้คุณตรวจสอบและสร้างรันไทม์เหล่านั้นใหม่หลังจากการอัปเดตหรือการเปลี่ยนแปลงการกำหนดค่า

ปัจจุบันโดยทั่วไปหมายถึง:

- คอนเทนเนอร์แซนด์บ็อกซ์ Docker
- รันไทม์แซนด์บ็อกซ์ SSH เมื่อ `agents.defaults.sandbox.backend = "ssh"`
- รันไทม์แซนด์บ็อกซ์ OpenShell เมื่อ `agents.defaults.sandbox.backend = "openshell"`

สำหรับ `ssh` และ OpenShell `remote` การสร้างใหม่สำคัญกว่ากรณี Docker:

- เวิร์กสเปซระยะไกลเป็นแหล่งอ้างอิงหลักหลังจากการเริ่มต้น seed ครั้งแรก
- `openclaw sandbox recreate` จะลบเวิร์กสเปซระยะไกลหลักนั้นสำหรับขอบเขตที่เลือก
- การใช้งานครั้งถัดไปจะ seed อีกครั้งจากเวิร์กสเปซภายในเครื่องปัจจุบัน

## คำสั่ง

### `openclaw sandbox explain`

ตรวจสอบโหมด/ขอบเขต/การเข้าถึงเวิร์กสเปซของแซนด์บ็อกซ์ที่มีผลจริง นโยบายเครื่องมือแซนด์บ็อกซ์ และเกตการยกระดับสิทธิ์ พร้อมเส้นทางคีย์การกำหนดค่าสำหรับแก้ไข

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

แสดงรันไทม์แซนด์บ็อกซ์ทั้งหมดพร้อมสถานะและการกำหนดค่า

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**ผลลัพธ์ประกอบด้วย:**

- ชื่อและสถานะของรันไทม์
- แบ็กเอนด์ (`docker`, `openshell` ฯลฯ)
- ป้ายกำกับการกำหนดค่าและระบุว่าตรงกับการกำหนดค่าปัจจุบันหรือไม่
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
- `--session <key>`: สร้างคอนเทนเนอร์สำหรับเซสชันที่ระบุใหม่
- `--agent <id>`: สร้างคอนเทนเนอร์สำหรับเอเจนต์ที่ระบุใหม่
- `--browser`: สร้างเฉพาะคอนเทนเนอร์เบราว์เซอร์ใหม่
- `--force`: ข้ามพรอมป์ยืนยัน

<Note>
รันไทม์จะถูกสร้างใหม่โดยอัตโนมัติเมื่อมีการใช้งานเอเจนต์ครั้งถัดไป
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

### หลังจากเปลี่ยนเป้าหมาย SSH หรือข้อมูลรับรอง SSH

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

สำหรับแบ็กเอนด์หลัก `ssh` การสร้างใหม่จะลบรากเวิร์กสเปซระยะไกลตามขอบเขตบนเป้าหมาย SSH การรันครั้งถัดไปจะ seed อีกครั้งจากเวิร์กสเปซภายในเครื่อง

### หลังจากเปลี่ยนแหล่งที่มา นโยบาย หรือโหมดของ OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

สำหรับโหมด OpenShell `remote` การสร้างใหม่จะลบเวิร์กสเปซระยะไกลหลักสำหรับขอบเขตนั้น การรันครั้งถัดไปจะ seed อีกครั้งจากเวิร์กสเปซภายในเครื่อง

### หลังจากเปลี่ยน setupCommand

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### สำหรับเอเจนต์ที่ระบุเท่านั้น

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## เหตุผลที่จำเป็น

เมื่อคุณอัปเดตการกำหนดค่าแซนด์บ็อกซ์:

- รันไทม์ที่มีอยู่จะยังคงทำงานด้วยการตั้งค่าเดิม
- รันไทม์จะถูก prune หลังจากไม่มีการใช้งาน 24 ชั่วโมงเท่านั้น
- เอเจนต์ที่ใช้งานเป็นประจำจะทำให้รันไทม์เดิมยังคงทำงานอยู่ไม่มีกำหนด

ใช้ `openclaw sandbox recreate` เพื่อบังคับลบรันไทม์เดิม รันไทม์เหล่านั้นจะถูกสร้างใหม่โดยอัตโนมัติด้วยการตั้งค่าปัจจุบันเมื่อจำเป็นต้องใช้งานครั้งถัดไป

<Tip>
ควรใช้ `openclaw sandbox recreate` แทนการล้างข้อมูลแบบเจาะจงแบ็กเอนด์ด้วยตนเอง คำสั่งนี้ใช้รีจิสทรีรันไทม์ของ Gateway และหลีกเลี่ยงความไม่ตรงกันเมื่อขอบเขตหรือคีย์เซสชันเปลี่ยน
</Tip>

## การย้ายรีจิสทรี

OpenClaw จัดเก็บเมตาดาต้ารันไทม์แซนด์บ็อกซ์เป็นชาร์ด JSON หนึ่งรายการต่อคอนเทนเนอร์/รายการเบราว์เซอร์ภายใต้ไดเรกทอรีสถานะแซนด์บ็อกซ์ การติดตั้งรุ่นเก่าอาจยังมีไฟล์เดิมแบบรวมศูนย์:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

การอ่านรันไทม์แซนด์บ็อกซ์ตามปกติจะไม่เขียนไฟล์เหล่านั้นใหม่ เรียกใช้ `openclaw doctor --fix` เพื่อย้ายรายการเดิมที่ถูกต้องเข้าสู่ไดเรกทอรีรีจิสทรีแบบชาร์ด ไฟล์เดิมที่ไม่ถูกต้องจะถูกกักกัน เพื่อไม่ให้รีจิสทรีเก่าที่เสียเพียงไฟล์เดียวซ่อนรายการรันไทม์ปัจจุบันได้

## การกำหนดค่า

การตั้งค่าแซนด์บ็อกซ์อยู่ใน `~/.openclaw/openclaw.json` ภายใต้ `agents.defaults.sandbox` (การกำหนดทับสำหรับแต่ละเอเจนต์อยู่ใน `agents.list[].sandbox`):

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
- [เวิร์กสเปซของเอเจนต์](/th/concepts/agent-workspace)
- [Doctor](/th/gateway/doctor): ตรวจสอบการตั้งค่าแซนด์บ็อกซ์
