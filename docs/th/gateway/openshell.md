---
read_when:
    - คุณต้องการแซนด์บ็อกซ์ที่จัดการบนคลาวด์แทน Docker ภายในเครื่อง
    - คุณกำลังตั้งค่า Plugin OpenShell
    - คุณต้องเลือกระหว่างโหมดพื้นที่ทำงานแบบมิเรอร์และแบบระยะไกล
summary: ใช้ OpenShell เป็นแบ็กเอนด์แซนด์บ็อกซ์ที่มีการจัดการสำหรับเอเจนต์ OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-07-12T16:12:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell เป็นแบ็กเอนด์แซนด์บ็อกซ์ที่มีการจัดการ: แทนที่จะเรียกใช้คอนเทนเนอร์ Docker
ภายในเครื่อง OpenClaw จะมอบหมายวงจรชีวิตของแซนด์บ็อกซ์ให้แก่ CLI `openshell` ซึ่ง
จัดเตรียมสภาพแวดล้อมระยะไกลและเรียกใช้คำสั่งผ่าน SSH

Plugin นี้ใช้การรับส่งข้อมูลผ่าน SSH และบริดจ์ระบบไฟล์ระยะไกลเดียวกับ
[แบ็กเอนด์ SSH](/th/gateway/sandboxing#ssh-backend) ทั่วไป และเพิ่มการจัดการวงจรชีวิตของ OpenShell
(`sandbox create/get/delete/ssh-config`) รวมถึงโหมดซิงค์พื้นที่ทำงาน `mirror`
ที่เลือกใช้ได้

## ข้อกำหนดเบื้องต้น

- ติดตั้ง Plugin OpenShell แล้ว (`openclaw plugins install @openclaw/openshell-sandbox`)
- CLI `openshell` อยู่ใน `PATH` (หรือระบุพาธเองผ่าน
  `plugins.entries.openshell.config.command`)
- บัญชี OpenShell ที่มีสิทธิ์เข้าถึงแซนด์บ็อกซ์
- OpenClaw Gateway กำลังทำงานอยู่บนโฮสต์

## เริ่มต้นอย่างรวดเร็ว

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

รีสตาร์ต Gateway ในรอบถัดไปของเอเจนต์ OpenClaw จะสร้างแซนด์บ็อกซ์ OpenShell
และกำหนดเส้นทางการเรียกใช้เครื่องมือผ่านแซนด์บ็อกซ์ดังกล่าว ตรวจสอบด้วย:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## โหมดพื้นที่ทำงาน

นี่คือการตัดสินใจที่สำคัญที่สุดสำหรับ OpenShell

### mirror (ค่าเริ่มต้น)

`plugins.entries.openshell.config.mode: "mirror"` กำหนดให้ **พื้นที่ทำงานภายในเครื่อง
เป็นพื้นที่ทำงานหลัก**:

- ก่อน `exec` OpenClaw จะซิงค์พื้นที่ทำงานภายในเครื่องไปยังแซนด์บ็อกซ์
- หลัง `exec` OpenClaw จะซิงค์พื้นที่ทำงานระยะไกลกลับมายังเครื่องภายใน
- เครื่องมือไฟล์ทำงานผ่านบริดจ์แซนด์บ็อกซ์ แต่ข้อมูลภายในเครื่องยังคงเป็นแหล่งข้อมูลจริง
  ระหว่างรอบ

เหมาะที่สุดสำหรับเวิร์กโฟลว์การพัฒนา: การแก้ไขภายในเครื่องจากภายนอก OpenClaw จะปรากฏ
ในการเรียกใช้ครั้งถัดไป และแซนด์บ็อกซ์จะมีพฤติกรรมใกล้เคียงกับแบ็กเอนด์ Docker

ข้อแลกเปลี่ยน: มีค่าใช้จ่ายในการอัปโหลดและดาวน์โหลดทุกครั้งที่เรียกใช้

### remote

`mode: "remote"` กำหนดให้ **พื้นที่ทำงาน OpenShell เป็นพื้นที่ทำงานหลัก**:

- เมื่อสร้างแซนด์บ็อกซ์ครั้งแรก OpenClaw จะเติมข้อมูลพื้นที่ทำงานระยะไกลจากพื้นที่ทำงานภายในเครื่อง
  เพียงครั้งเดียว
- หลังจากนั้น `exec`, `read`, `write`, `edit` และ `apply_patch` จะทำงาน
  โดยตรงกับพื้นที่ทำงานระยะไกล OpenClaw จะ **ไม่** ซิงค์การเปลี่ยนแปลงจากระยะไกล
  กลับมายังเครื่องภายใน
- การอ่านสื่อขณะสร้างพรอมต์ยังคงใช้งานได้ (เครื่องมือไฟล์/สื่ออ่านผ่าน
  บริดจ์แซนด์บ็อกซ์)

เหมาะที่สุดสำหรับเอเจนต์ที่ทำงานเป็นเวลานานและ CI: มีค่าใช้จ่ายต่อรอบต่ำกว่า และการแก้ไข
ภายในเครื่องโฮสต์จะไม่เขียนทับสถานะระยะไกลโดยไม่แจ้งเตือน

<Warning>
การแก้ไขไฟล์บนโฮสต์จากภายนอก OpenClaw หลังการเติมข้อมูลครั้งแรกจะไม่ปรากฏแก่แซนด์บ็อกซ์ระยะไกล เรียกใช้ `openclaw sandbox recreate` เพื่อเติมข้อมูลใหม่
</Warning>

### การเลือกโหมด

|                          | `mirror`                         | `remote`                         |
| ------------------------ | -------------------------------- | -------------------------------- |
| **พื้นที่ทำงานหลัก**      | โฮสต์ภายในเครื่อง                | OpenShell ระยะไกล                |
| **ทิศทางการซิงค์**        | สองทิศทาง (ทุกครั้งที่เรียกใช้)  | เติมข้อมูลครั้งเดียว             |
| **ค่าใช้จ่ายต่อรอบ**      | สูงกว่า (อัปโหลด + ดาวน์โหลด)     | ต่ำกว่า (ดำเนินการระยะไกลโดยตรง) |
| **เห็นการแก้ไขภายในเครื่องหรือไม่?** | เห็นในการเรียกใช้ครั้งถัดไป | ไม่เห็นจนกว่าจะสร้างใหม่         |
| **เหมาะที่สุดสำหรับ**     | เวิร์กโฟลว์การพัฒนา              | เอเจนต์ที่ทำงานเป็นเวลานาน, CI   |

## เอกสารอ้างอิงการกำหนดค่า

การกำหนดค่า OpenShell ทั้งหมดอยู่ภายใต้ `plugins.entries.openshell.config`:

| คีย์                      | ชนิด                     | ค่าเริ่มต้น    | คำอธิบาย                                                                                       |
| ------------------------- | ------------------------ | -------------- | ---------------------------------------------------------------------------------------------- |
| `mode`                    | `"mirror"` หรือ `"remote"` | `"mirror"`   | โหมดการซิงค์พื้นที่ทำงาน                                                                       |
| `command`                 | `string`                 | `"openshell"`  | พาธหรือชื่อของ CLI `openshell`                                                                 |
| `from`                    | `string`                 | `"openclaw"`   | แหล่งที่มาของแซนด์บ็อกซ์สำหรับการสร้างครั้งแรก                                                |
| `gateway`                 | `string`                 | ไม่ได้ตั้งค่า  | ชื่อ Gateway ของ OpenShell (`--gateway` ระดับบนสุด)                                            |
| `gatewayEndpoint`         | `string`                 | ไม่ได้ตั้งค่า  | เอนด์พอยต์ Gateway ของ OpenShell (`--gateway-endpoint` ระดับบนสุด)                             |
| `policy`                  | `string`                 | ไม่ได้ตั้งค่า  | รหัสนโยบาย OpenShell สำหรับการสร้างแซนด์บ็อกซ์                                                |
| `providers`               | `string[]`               | `[]`           | ชื่อผู้ให้บริการที่แนบขณะสร้างแซนด์บ็อกซ์ (ตัดค่าซ้ำ และใช้แฟล็ก `--provider` หนึ่งรายการต่อหนึ่งค่า) |
| `gpu`                     | `boolean`                | `false`        | ขอทรัพยากร GPU (`--gpu`)                                                                       |
| `autoProviders`           | `boolean`                | `true`         | ส่ง `--auto-providers` (หรือ `--no-auto-providers` เมื่อเป็น false) ระหว่างการสร้าง             |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`   | พื้นที่ทำงานหลักที่เขียนได้ภายในแซนด์บ็อกซ์                                                   |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`     | พาธเมานต์พื้นที่ทำงานของเอเจนต์ (อ่านอย่างเดียวเมื่อการเข้าถึงพื้นที่ทำงานไม่ใช่ `rw`)          |
| `timeoutSeconds`          | `number`                 | `120`          | ระยะหมดเวลาสำหรับการดำเนินการของ CLI `openshell`                                               |

`remoteWorkspaceDir` และ `remoteAgentWorkspaceDir` ต้องเป็นพาธสัมบูรณ์และ
อยู่ภายใต้รากที่มีการจัดการ `/sandbox` หรือ `/agent` เท่านั้น ระบบจะปฏิเสธ
พาธสัมบูรณ์อื่น

การตั้งค่าระดับแซนด์บ็อกซ์ (`mode`, `scope`, `workspaceAccess`) อยู่ภายใต้
`agents.defaults.sandbox` เช่นเดียวกับแบ็กเอนด์อื่น ดูตารางทั้งหมดได้ที่
[การทำแซนด์บ็อกซ์](/th/gateway/sandboxing)

## ตัวอย่าง

### การตั้งค่าระยะไกลขั้นต่ำ

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

### OpenShell แยกตามเอเจนต์พร้อม Gateway ที่กำหนดเอง

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

```bash
# แสดงรันไทม์แซนด์บ็อกซ์ทั้งหมด (Docker + OpenShell)
openclaw sandbox list

# ตรวจสอบนโยบายที่มีผล
openclaw sandbox explain

# สร้างใหม่ (ลบพื้นที่ทำงานระยะไกล และเติมข้อมูลใหม่ในการใช้งานครั้งถัดไป)
openclaw sandbox recreate --all
```

สำหรับโหมด `remote` การสร้างใหม่มีความสำคัญเป็นพิเศษ: การดำเนินการนี้จะลบพื้นที่ทำงาน
ระยะไกลหลักของขอบเขตนั้น และในการใช้งานครั้งถัดไป ระบบจะเติมข้อมูลใหม่จาก
เครื่องภายใน สำหรับโหมด `mirror` การสร้างใหม่มีจุดประสงค์หลักเพื่อรีเซ็ตสภาพแวดล้อม
การเรียกใช้ระยะไกล เนื่องจากพื้นที่ทำงานภายในเครื่องยังคงเป็นพื้นที่ทำงานหลัก

สร้างใหม่หลังจากเปลี่ยนแปลงรายการใดรายการหนึ่งต่อไปนี้:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## การเสริมความปลอดภัย

บริดจ์ระบบไฟล์ในโหมด Mirror จะตรึงรากพื้นที่ทำงานภายในเครื่องและตรวจสอบ
พาธตามรูปแบบมาตรฐานอีกครั้ง (ผ่าน realpath) ก่อนการอ่าน เขียน สร้างไดเรกทอรี ลบ และ
เปลี่ยนชื่อทุกครั้ง พร้อมปฏิเสธลิงก์สัญลักษณ์ที่อยู่กลางพาธ การสลับลิงก์สัญลักษณ์หรือการเมานต์
พื้นที่ทำงานใหม่จะไม่สามารถเปลี่ยนเส้นทางการเข้าถึงไฟล์ให้ออกนอกโครงสร้างที่ทำมิเรอร์ไว้ได้

## ข้อจำกัดปัจจุบัน

- แบ็กเอนด์ OpenShell ไม่รองรับเบราว์เซอร์แซนด์บ็อกซ์
- `sandbox.docker.binds` ไม่มีผลกับ OpenShell การสร้างแซนด์บ็อกซ์จะล้มเหลว
  หากมีการกำหนด binds
- ตัวเลือกการปรับแต่งรันไทม์เฉพาะ Docker ภายใต้ `sandbox.docker.*` (ยกเว้น `env`)
  ใช้ได้กับแบ็กเอนด์ Docker เท่านั้น

## วิธีการทำงาน

1. OpenClaw เรียกใช้ `sandbox get` สำหรับชื่อแซนด์บ็อกซ์ (พร้อม
   `--gateway`/`--gateway-endpoint` ที่กำหนดค่าไว้ หากมี) หากดำเนินการไม่สำเร็จ ระบบจะสร้างด้วย
   `sandbox create` โดยส่ง `--name`, `--from`, `--policy` เมื่อมีการตั้งค่า, `--gpu`
   เมื่อเปิดใช้, `--auto-providers`/`--no-auto-providers` และแฟล็ก
   `--provider` หนึ่งรายการต่อผู้ให้บริการที่กำหนดค่าไว้แต่ละราย
2. OpenClaw เรียกใช้ `sandbox ssh-config` สำหรับชื่อแซนด์บ็อกซ์เพื่อดึง
   รายละเอียดการเชื่อมต่อ SSH
3. Core เขียนการกำหนดค่า SSH ลงในไฟล์ชั่วคราวและเปิดเซสชัน SSH ผ่าน
   บริดจ์ระบบไฟล์ระยะไกลเดียวกับแบ็กเอนด์ SSH ทั่วไป
4. ในโหมด `mirror`: ซิงค์จากภายในเครื่องไปยังระยะไกลก่อนเรียกใช้ ดำเนินการ แล้วซิงค์กลับหลังเสร็จสิ้น
5. ในโหมด `remote`: เติมข้อมูลหนึ่งครั้งเมื่อสร้าง จากนั้นดำเนินการโดยตรงกับพื้นที่ทำงาน
   ระยะไกล

## ที่เกี่ยวข้อง

- [การทำแซนด์บ็อกซ์](/th/gateway/sandboxing) - โหมด ขอบเขต และการเปรียบเทียบแบ็กเอนด์
- [แซนด์บ็อกซ์เทียบกับนโยบายเครื่องมือเทียบกับสิทธิ์ระดับสูง](/th/gateway/sandbox-vs-tool-policy-vs-elevated) - การแก้ไขปัญหาเครื่องมือที่ถูกบล็อก
- [แซนด์บ็อกซ์และเครื่องมือแบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) - การเขียนทับค่าระดับเอเจนต์
- [CLI แซนด์บ็อกซ์](/th/cli/sandbox) - คำสั่ง `openclaw sandbox`
