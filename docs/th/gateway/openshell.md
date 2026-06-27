---
read_when:
    - คุณต้องการแซนด์บ็อกซ์ที่จัดการบนคลาวด์แทน Docker ในเครื่อง
    - คุณกำลังตั้งค่า Plugin OpenShell
    - คุณต้องเลือกระหว่างโหมดพื้นที่ทำงานแบบมิเรอร์และแบบระยะไกล
summary: ใช้ OpenShell เป็นแบ็กเอนด์ sandbox ที่มีการจัดการสำหรับเอเจนต์ OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-06-27T17:36:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278f7550a3178c30a1b42f80495c55bb9827f7785ce9c4d1ee4a57adb3a5e4b
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell คือแบ็กเอนด์แซนด์บ็อกซ์แบบมีการจัดการสำหรับ OpenClaw แทนที่จะรัน Docker
คอนเทนเนอร์ในเครื่อง OpenClaw จะมอบหมายวงจรชีวิตของแซนด์บ็อกซ์ให้กับ CLI `openshell`
ซึ่งจัดเตรียมสภาพแวดล้อมระยะไกลพร้อมการรันคำสั่งผ่าน SSH

Plugin OpenShell ใช้ทรานสปอร์ต SSH หลักและบริดจ์ระบบไฟล์ระยะไกลเดียวกันกับ
[แบ็กเอนด์ SSH ทั่วไป](/th/gateway/sandboxing#ssh-backend) โดยเพิ่มวงจรชีวิตเฉพาะของ
OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) และโหมดพื้นที่ทำงาน
`mirror` ที่เลือกใช้ได้

## ข้อกำหนดเบื้องต้น

- ติดตั้ง Plugin OpenShell แล้ว (`openclaw plugins install @openclaw/openshell-sandbox`)
- ติดตั้ง CLI `openshell` และอยู่ใน `PATH` (หรือตั้งค่าพาธแบบกำหนดเองผ่าน
  `plugins.entries.openshell.config.command`)
- บัญชี OpenShell ที่มีสิทธิ์เข้าถึงแซนด์บ็อกซ์
- OpenClaw Gateway กำลังรันบนโฮสต์

## เริ่มต้นอย่างรวดเร็ว

1. ติดตั้งและเปิดใช้งาน Plugin จากนั้นตั้งค่าแบ็กเอนด์แซนด์บ็อกซ์:

```bash
openclaw plugins install @openclaw/openshell-sandbox
```

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

2. รีสตาร์ท Gateway ในเทิร์นถัดไปของเอเจนต์ OpenClaw จะสร้างแซนด์บ็อกซ์ OpenShell
   และกำหนดเส้นทางการรันเครื่องมือผ่านแซนด์บ็อกซ์นั้น

3. ตรวจสอบ:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## โหมดพื้นที่ทำงาน

นี่คือการตัดสินใจที่สำคัญที่สุดเมื่อใช้ OpenShell

### `mirror`

ใช้ `plugins.entries.openshell.config.mode: "mirror"` เมื่อคุณต้องการให้
**พื้นที่ทำงานในเครื่องยังคงเป็นแหล่งข้อมูลหลัก**

ลักษณะการทำงาน:

- ก่อน `exec` OpenClaw จะซิงค์พื้นที่ทำงานในเครื่องเข้าไปยังแซนด์บ็อกซ์ OpenShell
- หลัง `exec` OpenClaw จะซิงค์พื้นที่ทำงานระยะไกลกลับมายังพื้นที่ทำงานในเครื่อง
- เครื่องมือไฟล์ยังคงทำงานผ่านบริดจ์แซนด์บ็อกซ์ แต่พื้นที่ทำงานในเครื่อง
  ยังคงเป็นแหล่งข้อมูลที่เชื่อถือได้ระหว่างเทิร์น

เหมาะที่สุดสำหรับ:

- คุณแก้ไขไฟล์ในเครื่องนอก OpenClaw และต้องการให้การเปลี่ยนแปลงเหล่านั้นมองเห็นใน
  แซนด์บ็อกซ์โดยอัตโนมัติ
- คุณต้องการให้แซนด์บ็อกซ์ OpenShell ทำงานคล้ายกับแบ็กเอนด์ Docker ให้มากที่สุด
- คุณต้องการให้พื้นที่ทำงานของโฮสต์สะท้อนการเขียนจากแซนด์บ็อกซ์หลังแต่ละเทิร์น exec

ข้อแลกเปลี่ยน: มีต้นทุนการซิงค์เพิ่มเติมก่อนและหลังแต่ละ exec

### `remote`

ใช้ `plugins.entries.openshell.config.mode: "remote"` เมื่อคุณต้องการให้
**พื้นที่ทำงาน OpenShell กลายเป็นแหล่งข้อมูลหลัก**

ลักษณะการทำงาน:

- เมื่อสร้างแซนด์บ็อกซ์ครั้งแรก OpenClaw จะตั้งต้นพื้นที่ทำงานระยะไกลจาก
  พื้นที่ทำงานในเครื่องหนึ่งครั้ง
- หลังจากนั้น `exec`, `read`, `write`, `edit` และ `apply_patch` จะทำงาน
  โดยตรงกับพื้นที่ทำงาน OpenShell ระยะไกล
- OpenClaw **จะไม่** ซิงค์การเปลี่ยนแปลงระยะไกลกลับมายังพื้นที่ทำงานในเครื่อง
- การอ่านสื่อในช่วงสร้างพรอมป์ยังคงทำงานได้ เพราะเครื่องมือไฟล์และสื่ออ่านผ่าน
  บริดจ์แซนด์บ็อกซ์

เหมาะที่สุดสำหรับ:

- แซนด์บ็อกซ์ควรอยู่ฝั่งระยะไกลเป็นหลัก
- คุณต้องการลดค่าใช้จ่ายการซิงค์ต่อเทิร์น
- คุณไม่ต้องการให้การแก้ไขในเครื่องของโฮสต์เขียนทับสถานะแซนด์บ็อกซ์ระยะไกลโดยเงียบๆ

<Warning>
หากคุณแก้ไขไฟล์บนโฮสต์นอก OpenClaw หลังจากตั้งต้นครั้งแรก แซนด์บ็อกซ์ระยะไกลจะ **ไม่** เห็นการเปลี่ยนแปลงเหล่านั้น ใช้ `openclaw sandbox recreate` เพื่อตั้งต้นใหม่
</Warning>

### การเลือกโหมด

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **พื้นที่ทำงานหลัก**    | โฮสต์ในเครื่อง             | OpenShell ระยะไกล         |
| **ทิศทางการซิงค์**      | สองทิศทาง (แต่ละ exec)    | ตั้งต้นครั้งเดียว         |
| **ค่าใช้จ่ายต่อเทิร์น** | สูงกว่า (อัปโหลด + ดาวน์โหลด) | ต่ำกว่า (ดำเนินการระยะไกลโดยตรง) |
| **เห็นการแก้ไขในเครื่องหรือไม่** | ใช่ ใน exec ถัดไป          | ไม่ จนกว่าจะ recreate     |
| **เหมาะที่สุดสำหรับ**   | เวิร์กโฟลว์การพัฒนา        | เอเจนต์ที่รันระยะยาว, CI  |

## อ้างอิงการกำหนดค่า

การกำหนดค่า OpenShell ทั้งหมดอยู่ภายใต้ `plugins.entries.openshell.config`:

| คีย์                       | ชนิด                    | ค่าเริ่มต้น    | คำอธิบาย                                           |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` or `"remote"` | `"mirror"`    | โหมดการซิงค์พื้นที่ทำงาน                            |
| `command`                 | `string`                 | `"openshell"` | พาธหรือชื่อของ CLI `openshell`                       |
| `from`                    | `string`                 | `"openclaw"`  | แหล่งที่มาของแซนด์บ็อกซ์สำหรับการสร้างครั้งแรก       |
| `gateway`                 | `string`                 | —             | ชื่อ Gateway ของ OpenShell (`--gateway`)             |
| `gatewayEndpoint`         | `string`                 | —             | URL ปลายทาง Gateway ของ OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | ID นโยบาย OpenShell สำหรับการสร้างแซนด์บ็อกซ์        |
| `providers`               | `string[]`               | `[]`          | ชื่อผู้ให้บริการที่จะผูกเมื่อสร้างแซนด์บ็อกซ์        |
| `gpu`                     | `boolean`                | `false`       | ขอทรัพยากร GPU                                      |
| `autoProviders`           | `boolean`                | `true`        | ส่ง `--auto-providers` ระหว่างการสร้างแซนด์บ็อกซ์    |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | พื้นที่ทำงานหลักที่เขียนได้ภายในแซนด์บ็อกซ์          |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | พาธเมานต์พื้นที่ทำงานของเอเจนต์ (สำหรับการเข้าถึงแบบอ่านอย่างเดียว) |
| `timeoutSeconds`          | `number`                 | `120`         | เวลาหมดอายุสำหรับการดำเนินการ CLI `openshell`        |

การตั้งค่าระดับแซนด์บ็อกซ์ (`mode`, `scope`, `workspaceAccess`) กำหนดค่าไว้ภายใต้
`agents.defaults.sandbox` เช่นเดียวกับแบ็กเอนด์อื่นๆ ดู
[การใช้แซนด์บ็อกซ์](/th/gateway/sandboxing) สำหรับเมทริกซ์ฉบับเต็ม

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

แซนด์บ็อกซ์ OpenShell จัดการผ่าน CLI แซนด์บ็อกซ์ปกติ:

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

สำหรับโหมด `remote` **recreate สำคัญเป็นพิเศษ**: มันจะลบพื้นที่ทำงานระยะไกลหลัก
สำหรับสโคปนั้น การใช้งานครั้งถัดไปจะตั้งต้นพื้นที่ทำงานระยะไกลใหม่จาก
พื้นที่ทำงานในเครื่อง

สำหรับโหมด `mirror` การ recreate หลักๆ คือการรีเซ็ตสภาพแวดล้อมการรันระยะไกล เพราะ
พื้นที่ทำงานในเครื่องยังคงเป็นแหล่งข้อมูลหลัก

### ควร recreate เมื่อใด

recreate หลังเปลี่ยนรายการใดรายการหนึ่งต่อไปนี้:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## การเสริมความปลอดภัย

OpenShell จะตรึง fd รากของพื้นที่ทำงานและตรวจสอบอัตลักษณ์แซนด์บ็อกซ์ซ้ำก่อนการอ่านแต่ละครั้ง
ดังนั้นการสลับ symlink หรือพื้นที่ทำงานที่ถูกเมานต์ใหม่จะไม่สามารถเปลี่ยนเส้นทางการอ่านออกจาก
พื้นที่ทำงานระยะไกลที่ตั้งใจไว้ได้

## ข้อจำกัดปัจจุบัน

- ไม่รองรับเบราว์เซอร์แซนด์บ็อกซ์บนแบ็กเอนด์ OpenShell
- `sandbox.docker.binds` ไม่มีผลกับ OpenShell
- ตัวปรับแต่งรันไทม์เฉพาะ Docker ภายใต้ `sandbox.docker.*` ใช้ได้เฉพาะกับแบ็กเอนด์ Docker
  เท่านั้น

## วิธีการทำงาน

1. OpenClaw เรียก `openshell sandbox create` (พร้อมแฟล็ก `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` ตามที่กำหนดค่าไว้)
2. OpenClaw เรียก `openshell sandbox ssh-config <name>` เพื่อรับรายละเอียดการเชื่อมต่อ SSH
   สำหรับแซนด์บ็อกซ์
3. คอร์เขียนการกำหนดค่า SSH ไปยังไฟล์ชั่วคราวและเปิดเซสชัน SSH โดยใช้
   บริดจ์ระบบไฟล์ระยะไกลเดียวกันกับแบ็กเอนด์ SSH ทั่วไป
4. ในโหมด `mirror`: ซิงค์จากในเครื่องไประยะไกลก่อน exec, รัน, แล้วซิงค์กลับหลัง exec
5. ในโหมด `remote`: ตั้งต้นหนึ่งครั้งเมื่อสร้าง จากนั้นทำงานโดยตรงบนพื้นที่ทำงาน
   ระยะไกล

## ที่เกี่ยวข้อง

- [การใช้แซนด์บ็อกซ์](/th/gateway/sandboxing) -- โหมด สโคป และการเปรียบเทียบแบ็กเอนด์
- [แซนด์บ็อกซ์ เทียบกับนโยบายเครื่องมือ เทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) -- การดีบักเครื่องมือที่ถูกบล็อก
- [แซนด์บ็อกซ์และเครื่องมือแบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) -- การแทนที่ค่ารายเอเจนต์
- [CLI แซนด์บ็อกซ์](/th/cli/sandbox) -- คำสั่ง `openclaw sandbox`
