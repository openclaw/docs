---
read_when:
    - คุณต้องการ sandbox แบบจัดการบนคลาวด์แทน Docker ภายในเครื่อง
    - คุณกำลังตั้งค่า plugin OpenShell
    - คุณต้องเลือกระหว่างโหมด mirror และ remote workspace
summary: ใช้ OpenShell เป็นแบ็กเอนด์ sandbox แบบมีการจัดการสำหรับเอเจนต์ OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-23T10:18:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534127b293364659a14df3e36583a9b7120f5d55cdbd8b4b611efe44adc7ff8
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell เป็นแบ็กเอนด์ sandbox แบบมีการจัดการสำหรับ OpenClaw แทนที่จะรัน Docker
container ภายในเครื่อง OpenClaw จะมอบหมายวงจรชีวิตของ sandbox ให้กับ CLI `openshell`
ซึ่งทำการจัดเตรียมสภาพแวดล้อมระยะไกลพร้อมการรันคำสั่งผ่าน SSH

plugin OpenShell ใช้ SSH transport แกนกลางและ filesystem bridge ระยะไกลเดียวกัน
กับ [แบ็กเอนด์ SSH](/th/gateway/sandboxing#ssh-backend) ทั่วไป โดยเพิ่มวงจรชีวิตเฉพาะของ OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) และโหมด workspace แบบ `mirror`
ที่เป็นตัวเลือก

## ข้อกำหนดเบื้องต้น

- ติดตั้ง CLI `openshell` และอยู่ใน `PATH` แล้ว (หรือตั้ง path เองผ่าน
  `plugins.entries.openshell.config.command`)
- มีบัญชี OpenShell ที่เข้าถึง sandbox ได้
- OpenClaw Gateway กำลังทำงานอยู่บนโฮสต์

## เริ่มต้นอย่างรวดเร็ว

1. เปิดใช้งาน plugin และตั้งค่าแบ็กเอนด์ sandbox:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

2. รีสตาร์ต Gateway ในเทิร์นถัดไปของเอเจนต์ OpenClaw จะสร้าง OpenShell
   sandbox และกำหนดเส้นทางการทำงานของ tool ผ่านมัน

3. ตรวจสอบ:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## โหมด workspace

นี่คือการตัดสินใจที่สำคัญที่สุดเมื่อใช้ OpenShell

### `mirror`

ใช้ `plugins.entries.openshell.config.mode: "mirror"` เมื่อคุณต้องการให้ **local
workspace ยังคงเป็นต้นฉบับหลัก**

พฤติกรรม:

- ก่อน `exec` OpenClaw จะซิงก์ local workspace เข้าไปใน OpenShell sandbox
- หลัง `exec` OpenClaw จะซิงก์ remote workspace กลับมายัง local workspace
- file tool จะยังทำงานผ่าน sandbox bridge แต่ local workspace
  ยังคงเป็นแหล่งข้อมูลหลักระหว่างแต่ละเทิร์น

เหมาะที่สุดสำหรับ:

- คุณแก้ไขไฟล์ภายในเครื่องนอก OpenClaw และต้องการให้การเปลี่ยนแปลงเหล่านั้นมองเห็นได้ใน
  sandbox โดยอัตโนมัติ
- คุณต้องการให้ OpenShell sandbox ทำงานใกล้เคียงกับแบ็กเอนด์ Docker มากที่สุด
- คุณต้องการให้ workspace ของโฮสต์สะท้อนการเขียนของ sandbox หลังแต่ละเทิร์น `exec`

ข้อแลกเปลี่ยน: มีต้นทุนการซิงก์เพิ่มเติมก่อนและหลัง `exec` แต่ละครั้ง

### `remote`

ใช้ `plugins.entries.openshell.config.mode: "remote"` เมื่อคุณต้องการให้
**workspace ของ OpenShell กลายเป็นต้นฉบับหลัก**

พฤติกรรม:

- เมื่อ sandbox ถูกสร้างครั้งแรก OpenClaw จะ seed remote workspace จาก
  local workspace เพียงครั้งเดียว
- หลังจากนั้น `exec`, `read`, `write`, `edit` และ `apply_patch` จะทำงาน
  โดยตรงกับ remote workspace ของ OpenShell
- OpenClaw จะ **ไม่** ซิงก์การเปลี่ยนแปลงจากฝั่ง remote กลับมายัง local workspace
- การอ่านสื่อในช่วง prompt ยังคงทำงานได้ เพราะ file tool และ media tool อ่านผ่าน sandbox bridge

เหมาะที่สุดสำหรับ:

- sandbox ควรอยู่ฝั่ง remote เป็นหลัก
- คุณต้องการลด overhead การซิงก์ต่อเทิร์น
- คุณไม่ต้องการให้การแก้ไขในโฮสต์ภายในเครื่องเขียนทับสถานะของ remote sandbox โดยไม่ตั้งใจ

สำคัญ: หากคุณแก้ไขไฟล์บนโฮสต์นอก OpenClaw หลังการ seed ครั้งแรก
remote sandbox จะ **ไม่** เห็นการเปลี่ยนแปลงเหล่านั้น ให้ใช้
`openclaw sandbox recreate` เพื่อ seed ใหม่

### การเลือกโหมด

|                          | `mirror`                   | `remote`                     |
| ------------------------ | -------------------------- | ---------------------------- |
| **workspace ต้นฉบับหลัก** | โฮสต์ภายในเครื่อง          | OpenShell ระยะไกล            |
| **ทิศทางการซิงก์**       | สองทิศทาง (ทุก `exec`)     | seed ครั้งเดียว              |
| **overhead ต่อเทิร์น**    | สูงกว่า (อัปโหลด + ดาวน์โหลด) | ต่ำกว่า (ทำงานระยะไกลโดยตรง) |
| **เห็นการแก้ไขในเครื่อง?** | เห็น ใน `exec` ถัดไป        | ไม่เห็น จนกว่าจะ recreate    |
| **เหมาะที่สุดสำหรับ**     | เวิร์กโฟลว์การพัฒนา         | เอเจนต์ระยะยาว, CI           |

## ข้อมูลอ้างอิงการกำหนดค่า

คอนฟิก OpenShell ทั้งหมดอยู่ใต้ `plugins.entries.openshell.config`:

| Key                       | Type                     | Default       | คำอธิบาย                                            |
| ------------------------- | ------------------------ | ------------- | ---------------------------------------------------- |
| `mode`                    | `"mirror"` or `"remote"` | `"mirror"`    | โหมดการซิงก์ workspace                               |
| `command`                 | `string`                 | `"openshell"` | path หรือชื่อของ CLI `openshell`                    |
| `from`                    | `string`                 | `"openclaw"`  | แหล่งที่มาของ sandbox สำหรับการ create ครั้งแรก      |
| `gateway`                 | `string`                 | —             | ชื่อ Gateway ของ OpenShell (`--gateway`)             |
| `gatewayEndpoint`         | `string`                 | —             | URL endpoint ของ Gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | ID ของ policy OpenShell สำหรับการสร้าง sandbox       |
| `providers`               | `string[]`               | `[]`          | ชื่อ provider ที่จะแนบเมื่อสร้าง sandbox            |
| `gpu`                     | `boolean`                | `false`       | ขอใช้ทรัพยากร GPU                                    |
| `autoProviders`           | `boolean`                | `true`        | ส่ง `--auto-providers` ระหว่าง sandbox create        |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | workspace ที่เขียนได้หลักภายใน sandbox              |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | path mount ของ workspace สำหรับเอเจนต์ (สำหรับการเข้าถึงแบบอ่านอย่างเดียว) |
| `timeoutSeconds`          | `number`                 | `120`         | timeout สำหรับการทำงานของ CLI `openshell`            |

การตั้งค่าระดับ sandbox (`mode`, `scope`, `workspaceAccess`) ถูกกำหนดภายใต้
`agents.defaults.sandbox` เช่นเดียวกับแบ็กเอนด์อื่น ดู
[Sandboxing](/th/gateway/sandboxing) สำหรับเมทริกซ์แบบเต็ม

## ตัวอย่าง

### การตั้งค่า remote ขั้นต่ำ

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### โหมด mirror พร้อม GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell รายเอเจนต์พร้อม Gateway แบบกำหนดเอง

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## การจัดการวงจรชีวิต

OpenShell sandbox ถูกจัดการผ่าน Sandbox CLI ปกติ:

```bash
# แสดงรายการ runtime ของ sandbox ทั้งหมด (Docker + OpenShell)
openclaw sandbox list

# ตรวจสอบ policy ที่มีผลจริง
openclaw sandbox explain

# สร้างใหม่ (ลบ remote workspace แล้ว seed ใหม่ในการใช้งานครั้งถัดไป)
openclaw sandbox recreate --all
```

สำหรับโหมด `remote` **การ recreate มีความสำคัญเป็นพิเศษ**: มันจะลบ
remote workspace ต้นฉบับหลักสำหรับขอบเขตนั้น การใช้งานครั้งถัดไปจะ seed
remote workspace ใหม่จาก local workspace

สำหรับโหมด `mirror` การ recreate มีหน้าที่หลักในการรีเซ็ตสภาพแวดล้อมการรันระยะไกล เพราะ
local workspace ยังคงเป็นต้นฉบับหลัก

### ควร recreate เมื่อใด

ให้ recreate หลังจากเปลี่ยนค่าใดค่าหนึ่งต่อไปนี้:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## การเสริมความแข็งแกร่งด้านความปลอดภัย

OpenShell จะ pin root fd ของ workspace และตรวจสอบตัวตนของ sandbox ซ้ำก่อนการอ่านแต่ละครั้ง
ดังนั้นการสลับ symlink หรือ workspace ที่ถูก remount จึงไม่สามารถเปลี่ยนเส้นทางการอ่านออกนอก
remote workspace ที่ตั้งใจไว้ได้

## ข้อจำกัดปัจจุบัน

- ไม่รองรับ sandbox browser บนแบ็กเอนด์ OpenShell
- `sandbox.docker.binds` ใช้กับ OpenShell ไม่ได้
- ตัวปรับรันไทม์เฉพาะ Docker ภายใต้ `sandbox.docker.*` ใช้ได้เฉพาะกับแบ็กเอนด์ Docker
  เท่านั้น

## วิธีการทำงาน

1. OpenClaw เรียก `openshell sandbox create` (พร้อมแฟล็ก `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` ตามที่กำหนดไว้)
2. OpenClaw เรียก `openshell sandbox ssh-config <name>` เพื่อรับรายละเอียด
   การเชื่อมต่อ SSH สำหรับ sandbox
3. แกนกลางจะเขียนคอนฟิก SSH ลงไฟล์ชั่วคราวและเปิดเซสชัน SSH โดยใช้
   remote filesystem bridge เดียวกับแบ็กเอนด์ SSH ทั่วไป
4. ในโหมด `mirror`: ซิงก์จาก local ไป remote ก่อน exec, รันงาน, แล้วซิงก์กลับหลัง exec
5. ในโหมด `remote`: seed ครั้งเดียวตอน create จากนั้นทำงานโดยตรงบน remote
   workspace

## ดูเพิ่มเติม

- [Sandboxing](/th/gateway/sandboxing) -- โหมด ขอบเขต และการเปรียบเทียบแบ็กเอนด์
- [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) -- การดีบัก tool ที่ถูกบล็อก
- [Multi-Agent Sandbox and Tools](/th/tools/multi-agent-sandbox-tools) -- การแทนที่รายเอเจนต์
- [Sandbox CLI](/th/cli/sandbox) -- คำสั่ง `openclaw sandbox`
