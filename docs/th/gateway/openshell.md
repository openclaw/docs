---
read_when:
    - คุณต้องการแซนด์บ็อกซ์ที่จัดการบนคลาวด์แทน Docker ในเครื่อง
    - คุณกำลังตั้งค่า Plugin OpenShell
    - คุณต้องเลือกระหว่างโหมดมิเรอร์และโหมดพื้นที่ทำงานระยะไกล
summary: ใช้ OpenShell เป็นแบ็กเอนด์แซนด์บ็อกซ์แบบจัดการสำหรับเอเจนต์ OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-30T09:54:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 694a0a145802f4b624af01b58cbb5886bab7426fb9a90f216480141082089144
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell เป็นแบ็กเอนด์ sandbox แบบมีการจัดการสำหรับ OpenClaw แทนที่จะรันคอนเทนเนอร์ Docker ในเครื่อง OpenClaw จะมอบหมายวงจรชีวิตของ sandbox ให้กับ CLI `openshell` ซึ่งจัดเตรียมสภาพแวดล้อมระยะไกลพร้อมการเรียกใช้คำสั่งผ่าน SSH

Plugin OpenShell ใช้ทรานสปอร์ต SSH หลักและบริดจ์ระบบไฟล์ระยะไกลเดียวกันกับ [แบ็กเอนด์ SSH](/th/gateway/sandboxing#ssh-backend) ทั่วไป โดยเพิ่มวงจรชีวิตเฉพาะของ OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) และโหมด workspace แบบ `mirror` ที่เป็นทางเลือก

## ข้อกำหนดเบื้องต้น

- ติดตั้ง CLI `openshell` และอยู่บน `PATH` (หรือตั้งค่าพาธแบบกำหนดเองผ่าน
  `plugins.entries.openshell.config.command`)
- บัญชี OpenShell ที่มีสิทธิ์เข้าถึง sandbox
- OpenClaw Gateway กำลังรันบนโฮสต์

## เริ่มต้นอย่างรวดเร็ว

1. เปิดใช้ Plugin และตั้งค่าแบ็กเอนด์ sandbox:

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

2. รีสตาร์ท Gateway ในรอบถัดไปของ agent OpenClaw จะสร้าง sandbox OpenShell
   และส่งการเรียกใช้เครื่องมือผ่าน sandbox นั้น

3. ตรวจสอบ:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## โหมด workspace

นี่คือการตัดสินใจที่สำคัญที่สุดเมื่อใช้ OpenShell

### `mirror`

ใช้ `plugins.entries.openshell.config.mode: "mirror"` เมื่อคุณต้องการให้ **workspace ในเครื่องยังเป็นแหล่งอ้างอิงหลัก**

พฤติกรรม:

- ก่อน `exec` OpenClaw จะซิงก์ workspace ในเครื่องเข้าไปยัง sandbox OpenShell
- หลัง `exec` OpenClaw จะซิงก์ workspace ระยะไกลกลับมายัง workspace ในเครื่อง
- เครื่องมือไฟล์ยังคงทำงานผ่านบริดจ์ sandbox แต่ workspace ในเครื่อง
  ยังคงเป็นแหล่งข้อมูลจริงระหว่างรอบ

เหมาะที่สุดสำหรับ:

- คุณแก้ไขไฟล์ในเครื่องนอก OpenClaw และต้องการให้การเปลี่ยนแปลงเหล่านั้นปรากฏใน
  sandbox โดยอัตโนมัติ
- คุณต้องการให้ sandbox OpenShell ทำงานใกล้เคียงกับแบ็กเอนด์ Docker มากที่สุด
- คุณต้องการให้ workspace ของโฮสต์สะท้อนการเขียนใน sandbox หลังแต่ละรอบ exec

ข้อแลกเปลี่ยน: มีต้นทุนการซิงก์เพิ่มเติมก่อนและหลังแต่ละ exec

### `remote`

ใช้ `plugins.entries.openshell.config.mode: "remote"` เมื่อคุณต้องการให้
**workspace ของ OpenShell กลายเป็นแหล่งอ้างอิงหลัก**

พฤติกรรม:

- เมื่อ sandbox ถูกสร้างครั้งแรก OpenClaw จะ seed workspace ระยะไกลจาก
  workspace ในเครื่องหนึ่งครั้ง
- หลังจากนั้น `exec`, `read`, `write`, `edit` และ `apply_patch` จะทำงาน
  กับ workspace OpenShell ระยะไกลโดยตรง
- OpenClaw **จะไม่** ซิงก์การเปลี่ยนแปลงระยะไกลกลับมายัง workspace ในเครื่อง
- การอ่านสื่อในช่วง prompt ยังคงทำงานได้ เพราะเครื่องมือไฟล์และสื่ออ่านผ่าน
  บริดจ์ sandbox

เหมาะที่สุดสำหรับ:

- sandbox ควรอยู่ฝั่งระยะไกลเป็นหลัก
- คุณต้องการลดภาระการซิงก์ต่อรอบ
- คุณไม่ต้องการให้การแก้ไขในเครื่องของโฮสต์เขียนทับสถานะ sandbox ระยะไกลโดยไม่รู้ตัว

<Warning>
หากคุณแก้ไขไฟล์บนโฮสต์นอก OpenClaw หลังจาก seed ครั้งแรก sandbox ระยะไกลจะ **ไม่** เห็นการเปลี่ยนแปลงเหล่านั้น ใช้ `openclaw sandbox recreate` เพื่อ seed ใหม่
</Warning>

### การเลือกโหมด

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **workspace หลัก**       | โฮสต์ในเครื่อง            | OpenShell ระยะไกล        |
| **ทิศทางการซิงก์**       | สองทาง (ทุก exec)         | seed ครั้งเดียว          |
| **ภาระต่อรอบ**           | สูงกว่า (อัปโหลด + ดาวน์โหลด) | ต่ำกว่า (ดำเนินการระยะไกลโดยตรง) |
| **เห็นการแก้ไขในเครื่องไหม?** | ใช่ ใน exec ถัดไป          | ไม่ จนกว่าจะ recreate     |
| **เหมาะที่สุดสำหรับ**    | เวิร์กโฟลว์การพัฒนา       | agent ที่รันระยะยาว, CI  |

## อ้างอิงการตั้งค่า

การตั้งค่า OpenShell ทั้งหมดอยู่ใต้ `plugins.entries.openshell.config`:

| คีย์                      | ชนิด                    | ค่าเริ่มต้น    | คำอธิบาย                                             |
| ------------------------- | ----------------------- | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` หรือ `"remote"` | `"mirror"`    | โหมดการซิงก์ workspace                              |
| `command`                 | `string`                | `"openshell"` | พาธหรือชื่อของ CLI `openshell`                      |
| `from`                    | `string`                | `"openclaw"`  | แหล่งที่มาของ sandbox สำหรับการสร้างครั้งแรก        |
| `gateway`                 | `string`                | —             | ชื่อ Gateway ของ OpenShell (`--gateway`)             |
| `gatewayEndpoint`         | `string`                | —             | URL endpoint ของ Gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                | —             | ID policy ของ OpenShell สำหรับการสร้าง sandbox       |
| `providers`               | `string[]`              | `[]`          | ชื่อ provider ที่จะแนบเมื่อ sandbox ถูกสร้าง         |
| `gpu`                     | `boolean`               | `false`       | ขอทรัพยากร GPU                                      |
| `autoProviders`           | `boolean`               | `true`        | ส่ง `--auto-providers` ระหว่างการสร้าง sandbox       |
| `remoteWorkspaceDir`      | `string`                | `"/sandbox"`  | workspace หลักที่เขียนได้ภายใน sandbox              |
| `remoteAgentWorkspaceDir` | `string`                | `"/agent"`    | พาธเมานต์ workspace ของ agent (สำหรับการเข้าถึงแบบอ่านอย่างเดียว) |
| `timeoutSeconds`          | `number`                | `120`         | timeout สำหรับการดำเนินการ CLI `openshell`           |

การตั้งค่าระดับ sandbox (`mode`, `scope`, `workspaceAccess`) กำหนดค่าใต้
`agents.defaults.sandbox` เช่นเดียวกับแบ็กเอนด์อื่น ดู
[Sandboxing](/th/gateway/sandboxing) สำหรับเมทริกซ์ทั้งหมด

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

### โหมด Mirror พร้อม GPU

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

### OpenShell ต่อ agent พร้อม Gateway แบบกำหนดเอง

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

sandbox OpenShell จัดการผ่าน CLI sandbox ปกติ:

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

สำหรับโหมด `remote` **recreate สำคัญเป็นพิเศษ**: มันจะลบ
workspace ระยะไกลหลักสำหรับ scope นั้น การใช้งานครั้งถัดไปจะ seed
workspace ระยะไกลใหม่จาก workspace ในเครื่อง

สำหรับโหมด `mirror` การ recreate ส่วนใหญ่จะรีเซ็ตสภาพแวดล้อมการเรียกใช้ระยะไกล เพราะ
workspace ในเครื่องยังคงเป็นแหล่งอ้างอิงหลัก

### เมื่อใดควร recreate

recreate หลังจากเปลี่ยนค่าเหล่านี้:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## การเพิ่มความแข็งแกร่งด้านความปลอดภัย

OpenShell pin fd ของ root workspace และตรวจสอบตัวตนของ sandbox ซ้ำก่อนการอ่านแต่ละครั้ง
ดังนั้นการสลับ symlink หรือ workspace ที่ถูกเมานต์ใหม่จะไม่สามารถเปลี่ยนทิศทางการอ่านออกจาก
workspace ระยะไกลที่ตั้งใจไว้ได้

## ข้อจำกัดปัจจุบัน

- ไม่รองรับเบราว์เซอร์ sandbox บนแบ็กเอนด์ OpenShell
- `sandbox.docker.binds` ไม่มีผลกับ OpenShell
- ปุ่มปรับแต่ง runtime เฉพาะ Docker ใต้ `sandbox.docker.*` มีผลเฉพาะกับแบ็กเอนด์ Docker
  เท่านั้น

## วิธีทำงาน

1. OpenClaw เรียก `openshell sandbox create` (พร้อมแฟล็ก `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` ตามที่กำหนดค่า)
2. OpenClaw เรียก `openshell sandbox ssh-config <name>` เพื่อรับรายละเอียดการเชื่อมต่อ SSH
   สำหรับ sandbox
3. core เขียนการตั้งค่า SSH ไปยังไฟล์ชั่วคราวและเปิดเซสชัน SSH โดยใช้
   บริดจ์ระบบไฟล์ระยะไกลเดียวกันกับแบ็กเอนด์ SSH ทั่วไป
4. ในโหมด `mirror`: ซิงก์จากในเครื่องไปยังระยะไกลก่อน exec, รัน, ซิงก์กลับหลัง exec
5. ในโหมด `remote`: seed หนึ่งครั้งตอนสร้าง จากนั้นทำงานโดยตรงบน
   workspace ระยะไกล

## ที่เกี่ยวข้อง

- [Sandboxing](/th/gateway/sandboxing) -- โหมด, scope และการเปรียบเทียบแบ็กเอนด์
- [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) -- การดีบักเครื่องมือที่ถูกบล็อก
- [Multi-Agent Sandbox and Tools](/th/tools/multi-agent-sandbox-tools) -- การ override ต่อ agent
- [Sandbox CLI](/th/cli/sandbox) -- คำสั่ง `openclaw sandbox`
