---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'การทำงานของ sandboxing ใน OpenClaw: โหมด ขอบเขต การเข้าถึง workspace และ images'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-25T13:49:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f22778690a4d41033c7abf9e97d54e53163418f8d45f1a816ce2be9d124fedf
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw สามารถรัน **tools ภายใน sandbox backends** เพื่อลดขอบเขตความเสียหายได้
สิ่งนี้เป็น **ตัวเลือกเพิ่มเติม** และควบคุมด้วยการกำหนดค่า (`agents.defaults.sandbox` หรือ
`agents.list[].sandbox`) หากปิด sandboxing ไว้ tools จะรันบนโฮสต์
Gateway ยังคงอยู่บนโฮสต์; เมื่อเปิดใช้งาน
การรันเครื่องมือจะทำงานใน sandbox ที่แยกออกมา

นี่ไม่ใช่ขอบเขตความปลอดภัยที่สมบูรณ์แบบ แต่ช่วยจำกัดการเข้าถึงระบบไฟล์
และโปรเซสได้อย่างมีนัยสำคัญเมื่อ model ทำสิ่งที่ไม่ควรทำ

## สิ่งที่ถูก sandbox

- การรันเครื่องมือ (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` ฯลฯ)
- browser แบบ sandbox ที่เป็นตัวเลือก (`agents.defaults.sandbox.browser`)
  - โดยค่าเริ่มต้น sandbox browser จะเริ่มอัตโนมัติ (เพื่อให้แน่ใจว่า CDP เข้าถึงได้) เมื่อ browser tool ต้องใช้งาน
    กำหนดค่าผ่าน `agents.defaults.sandbox.browser.autoStart` และ `agents.defaults.sandbox.browser.autoStartTimeoutMs`
  - โดยค่าเริ่มต้น container ของ sandbox browser จะใช้เครือข่าย Docker เฉพาะ (`openclaw-sandbox-browser`) แทนเครือข่าย `bridge` ระดับโกลบอล
    กำหนดค่าด้วย `agents.defaults.sandbox.browser.network`
  - `agents.defaults.sandbox.browser.cdpSourceRange` แบบไม่บังคับใช้จำกัด CDP ingress ที่ขอบ container ด้วย CIDR allowlist (เช่น `172.21.0.1/32`)
  - การเข้าถึงผู้สังเกตการณ์ noVNC ถูกป้องกันด้วยรหัสผ่านเป็นค่าเริ่มต้น; OpenClaw จะปล่อย URL โทเค็นอายุสั้นที่ให้บริการหน้า bootstrap ภายในเครื่องและเปิด noVNC พร้อมรหัสผ่านใน URL fragment (ไม่ใช่ใน query/header logs)
  - `agents.defaults.sandbox.browser.allowHostControl` อนุญาตให้เซสชันที่อยู่ใน sandbox กำหนดเป้าหมายไปยัง browser ของโฮสต์โดยตรง
  - allowlists แบบไม่บังคับใช้ควบคุม `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`

สิ่งที่ไม่ถูก sandbox:

- โปรเซส Gateway เอง
- เครื่องมือใด ๆ ที่ได้รับอนุญาตอย่างชัดเจนให้รันนอก sandbox (เช่น `tools.elevated`)
  - **elevated exec จะข้าม sandboxing และใช้ escape path ที่กำหนดไว้ (`gateway` เป็นค่าเริ่มต้น หรือ `node` เมื่อ exec target คือ `node`)**
  - หากปิด sandboxing อยู่ `tools.elevated` จะไม่เปลี่ยนพฤติกรรมการรัน (เพราะรันบนโฮสต์อยู่แล้ว) ดู [Elevated Mode](/th/tools/elevated)

## โหมด

`agents.defaults.sandbox.mode` ควบคุมว่า **จะใช้ sandboxing เมื่อใด**:

- `"off"`: ไม่ใช้ sandboxing
- `"non-main"`: sandbox เฉพาะเซสชันที่ **ไม่ใช่ main** (เป็นค่าเริ่มต้นถ้าคุณต้องการให้แชตปกติรันบนโฮสต์)
- `"all"`: ทุกเซสชันรันใน sandbox
  หมายเหตุ: `"non-main"` อิงจาก `session.mainKey` (ค่าเริ่มต้น `"main"`) ไม่ใช่ agent id
  เซสชันของกลุ่ม/ช่องทางจะใช้คีย์ของตัวเอง ดังนั้นจึงนับเป็น non-main และจะถูก sandbox

## ขอบเขต

`agents.defaults.sandbox.scope` ควบคุมว่า **จะสร้าง container กี่ตัว**:

- `"agent"` (ค่าเริ่มต้น): หนึ่ง container ต่อหนึ่งเอเจนต์
- `"session"`: หนึ่ง container ต่อหนึ่งเซสชัน
- `"shared"`: หนึ่ง container ใช้ร่วมกันโดยทุกเซสชันที่ถูก sandbox

## Backend

`agents.defaults.sandbox.backend` ควบคุมว่า **รันไทม์ใด** เป็นผู้ให้ sandbox:

- `"docker"` (ค่าเริ่มต้นเมื่อเปิด sandboxing): sandbox runtime แบบใช้ Docker ในเครื่อง
- `"ssh"`: sandbox runtime ระยะไกลทั่วไปแบบใช้ SSH
- `"openshell"`: sandbox runtime แบบใช้ OpenShell

config เฉพาะของ SSH อยู่ภายใต้ `agents.defaults.sandbox.ssh`
config เฉพาะของ OpenShell อยู่ภายใต้ `plugins.entries.openshell.config`

### การเลือก backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **รันที่ไหน**        | container ในเครื่อง               | โฮสต์ใดก็ได้ที่เข้าถึงผ่าน SSH | sandbox ที่ OpenShell จัดการ                        |
| **การตั้งค่า**       | `scripts/sandbox-setup.sh`       | SSH key + โฮสต์เป้าหมาย       | เปิดใช้ OpenShell Plugin                            |
| **โมเดล workspace** | bind-mount หรือ copy             | remote-canonical (seed ครั้งเดียว) | `mirror` หรือ `remote`                           |
| **การควบคุมเครือข่าย** | `docker.network` (ค่าเริ่มต้น: none) | ขึ้นอยู่กับโฮสต์ระยะไกล      | ขึ้นอยู่กับ OpenShell                               |
| **sandbox browser** | รองรับ                           | ไม่รองรับ                     | ยังไม่รองรับ                                        |
| **bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **เหมาะสำหรับ**      | การพัฒนาในเครื่อง, การแยกเต็มรูปแบบ | ถ่ายภาระไปยังเครื่องระยะไกล   | sandbox ระยะไกลที่มีการจัดการพร้อมการซิงก์สองทางแบบไม่บังคับ |

### Docker backend

sandboxing ปิดอยู่เป็นค่าเริ่มต้น หากคุณเปิด sandboxing และไม่ได้เลือก
backend, OpenClaw จะใช้ Docker backend มันรัน tools และ sandbox browsers
ในเครื่องผ่าน Docker daemon socket (`/var/run/docker.sock`) การแยกของ sandbox container
จะถูกกำหนดโดย namespaces ของ Docker

**ข้อจำกัด Docker-out-of-Docker (DooD)**:
หากคุณ deploy OpenClaw Gateway เองเป็น Docker container มันจะ orchestration sandbox containers แบบ sibling โดยใช้ Docker socket ของโฮสต์ (DooD) สิ่งนี้ทำให้เกิดข้อจำกัดเฉพาะด้านการแมป path:

- **Config ต้องใช้ Host Paths**: การกำหนดค่า `workspace` ใน `openclaw.json` ต้องมี **absolute path ของโฮสต์** (เช่น `/home/user/.openclaw/workspaces`) ไม่ใช่ path ภายใน Gateway container เมื่อ OpenClaw ขอให้ Docker daemon สร้าง sandbox daemon จะประเมิน paths เทียบกับ namespace ของระบบปฏิบัติการโฮสต์ ไม่ใช่ namespace ของ Gateway
- **FS Bridge Parity (แผนที่ volume เหมือนกันทุกประการ)**: โปรเซส OpenClaw Gateway แบบ native ยังเขียน heartbeat และไฟล์ bridge ไปยังไดเรกทอรี `workspace` ด้วย เนื่องจาก Gateway ประเมินสตริงเดียวกันทุกประการนั้น (host path) จากภายในสภาพแวดล้อมแบบ containerized ของตัวเอง การ deploy Gateway จึง **ต้อง** มี volume map ที่เหมือนกันทุกประการเพื่อเชื่อม namespace ของโฮสต์แบบ native (`-v /home/user/.openclaw:/home/user/.openclaw`)

หากคุณแมป paths ภายในโดยไม่มี absolute host parity OpenClaw จะโยนข้อผิดพลาดสิทธิ์ `EACCES` แบบ native เมื่อพยายามเขียน heartbeat ภายในสภาพแวดล้อมของ container เพราะสตริง path แบบ fully qualified นั้นไม่มีอยู่จริงแบบ native

### SSH backend

ใช้ `backend: "ssh"` เมื่อคุณต้องการให้ OpenClaw sandbox `exec`, file tools และ media reads บน
เครื่องใดก็ได้ที่เข้าถึงผ่าน SSH

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Or use SecretRefs / inline contents instead of local files:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

วิธีการทำงาน:

- OpenClaw สร้าง remote root ต่อขอบเขตภายใต้ `sandbox.ssh.workspaceRoot`
- ในการใช้งานครั้งแรกหลังจาก create หรือ recreate OpenClaw จะ seed remote workspace นั้นจาก local workspace หนึ่งครั้ง
- หลังจากนั้น `exec`, `read`, `write`, `edit`, `apply_patch`, prompt media reads และ inbound media staging จะทำงานกับ remote workspace โดยตรงผ่าน SSH
- OpenClaw จะไม่ซิงก์การเปลี่ยนแปลงจาก remote กลับไปยัง local workspace โดยอัตโนมัติ

ข้อมูลสำหรับการยืนยันตัวตน:

- `identityFile`, `certificateFile`, `knownHostsFile`: ใช้ไฟล์ในเครื่องที่มีอยู่ และส่งผ่าน OpenSSH config
- `identityData`, `certificateData`, `knownHostsData`: ใช้สตริงแบบ inline หรือ SecretRefs OpenClaw จะ resolve ผ่านสแนปชอต secrets runtime ตามปกติ เขียนลงไฟล์ชั่วคราวด้วย `0600` และลบออกเมื่อเซสชัน SSH จบลง
- หากตั้งค่าทั้ง `*File` และ `*Data` สำหรับรายการเดียวกัน `*Data` จะมีผลเหนือกว่าสำหรับเซสชัน SSH นั้น

นี่คือโมเดลแบบ **remote-canonical** หลังจาก seed ครั้งแรก remote SSH workspace จะกลายเป็นสถานะ sandbox ที่แท้จริง

ผลที่ตามมาสำคัญ:

- การแก้ไขบนโฮสต์ในเครื่องที่ทำภายนอก OpenClaw หลังขั้นตอน seed จะไม่มองเห็นจากฝั่ง remote จนกว่าคุณจะ recreate sandbox
- `openclaw sandbox recreate` จะลบ remote root ต่อขอบเขต และ seed ใหม่จาก local ในการใช้งานครั้งถัดไป
- ไม่รองรับ sandbox browser บน SSH backend
- การตั้งค่า `sandbox.docker.*` ไม่มีผลกับ SSH backend

### OpenShell backend

ใช้ `backend: "openshell"` เมื่อคุณต้องการให้ OpenClaw sandbox tools ใน
สภาพแวดล้อมระยะไกลที่ OpenShell จัดการ สำหรับคู่มือการตั้งค่าเต็มรูปแบบ เอกสารอ้างอิงการกำหนดค่า และการเปรียบเทียบโหมด workspace ดูได้ที่
[หน้า OpenShell](/th/gateway/openshell)

OpenShell ใช้แกนกลางเดียวกันของ SSH transport และ remote filesystem bridge ร่วมกับ
generic SSH backend และเพิ่มวงจรชีวิตเฉพาะของ OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) พร้อมโหมด workspace `mirror`
แบบไม่บังคับ

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
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

โหมดของ OpenShell:

- `mirror` (ค่าเริ่มต้น): local workspace ยังคงเป็น canonical OpenClaw จะซิงก์ไฟล์ในเครื่องเข้า OpenShell ก่อน exec และซิงก์ remote workspace กลับหลัง exec
- `remote`: OpenShell workspace จะเป็น canonical หลังจากสร้าง sandbox แล้ว OpenClaw จะ seed remote workspace จาก local workspace หนึ่งครั้ง จากนั้น file tools และ exec จะทำงานกับ remote sandbox โดยตรงโดยไม่ซิงก์การเปลี่ยนแปลงกลับ

รายละเอียดของ remote transport:

- OpenClaw ขอ SSH config เฉพาะของ sandbox จาก OpenShell ผ่าน `openshell sandbox ssh-config <name>`
- แกนกลางจะเขียน SSH config นั้นลงไฟล์ชั่วคราว เปิดเซสชัน SSH และใช้ remote filesystem bridge แบบเดียวกับ `backend: "ssh"` ซ้ำ
- ในโหมด `mirror` วงจรชีวิตต่างออกไปเฉพาะตรงนี้: ซิงก์ local ไป remote ก่อน exec แล้วจึงซิงก์กลับหลัง exec

ข้อจำกัดปัจจุบันของ OpenShell:

- ยังไม่รองรับ sandbox browser
- `sandbox.docker.binds` ไม่รองรับบน OpenShell backend
- runtime knobs เฉพาะของ Docker ภายใต้ `sandbox.docker.*` ยังคงใช้ได้เฉพาะ Docker backend

#### โหมด workspace

OpenShell มีโมเดล workspace สองแบบ ส่วนนี้คือสิ่งที่สำคัญที่สุดในการใช้งานจริง

##### `mirror`

ใช้ `plugins.entries.openshell.config.mode: "mirror"` เมื่อคุณต้องการให้ **local workspace ยังคงเป็น canonical**

พฤติกรรม:

- ก่อน `exec` OpenClaw จะซิงก์ local workspace เข้าไปใน OpenShell sandbox
- หลัง `exec` OpenClaw จะซิงก์ remote workspace กลับมายัง local workspace
- file tools ยังคงทำงานผ่าน sandbox bridge แต่ local workspace ยังคงเป็นแหล่งความจริงระหว่างแต่ละเทิร์น

ใช้ในกรณีที่:

- คุณแก้ไขไฟล์ในเครื่องภายนอก OpenClaw และต้องการให้การเปลี่ยนแปลงเหล่านั้นปรากฏใน sandbox โดยอัตโนมัติ
- คุณต้องการให้ OpenShell sandbox ทำงานใกล้เคียงกับ Docker backend มากที่สุด
- คุณต้องการให้ workspace บนโฮสต์สะท้อนการเขียนจาก sandbox หลังแต่ละเทิร์นของ exec

ข้อแลกเปลี่ยน:

- มีค่าใช้จ่ายจากการซิงก์เพิ่มก่อนและหลัง exec

##### `remote`

ใช้ `plugins.entries.openshell.config.mode: "remote"` เมื่อคุณต้องการให้ **OpenShell workspace กลายเป็น canonical**

พฤติกรรม:

- เมื่อ sandbox ถูกสร้างครั้งแรก OpenClaw จะ seed remote workspace จาก local workspace หนึ่งครั้ง
- หลังจากนั้น `exec`, `read`, `write`, `edit` และ `apply_patch` จะทำงานกับ remote OpenShell workspace โดยตรง
- OpenClaw จะ **ไม่** ซิงก์การเปลี่ยนแปลงจาก remote กลับเข้าสู่ local workspace หลัง exec
- prompt-time media reads ยังคงทำงานได้ เพราะ file tools และ media tools อ่านผ่าน sandbox bridge แทนที่จะสมมติว่าเป็น path บนโฮสต์ในเครื่อง
- transport ใช้ SSH เข้าไปยัง OpenShell sandbox ที่ส่งกลับมาจาก `openshell sandbox ssh-config`

ผลที่ตามมาสำคัญ:

- หากคุณแก้ไขไฟล์บนโฮสต์ภายนอก OpenClaw หลังขั้นตอน seed แล้ว remote sandbox จะ **ไม่** เห็นการเปลี่ยนแปลงเหล่านั้นโดยอัตโนมัติ
- หาก sandbox ถูกสร้างใหม่ remote workspace จะถูก seed จาก local workspace อีกครั้ง
- เมื่อใช้ `scope: "agent"` หรือ `scope: "shared"` remote workspace นั้นจะถูกแชร์ในขอบเขตเดียวกันนั้น

ใช้โหมดนี้เมื่อ:

- sandbox ควรอยู่ฝั่ง OpenShell ระยะไกลเป็นหลัก
- คุณต้องการลด overhead จากการซิงก์ในแต่ละเทิร์น
- คุณไม่ต้องการให้การแก้ไขบนโฮสต์ในเครื่องเขียนทับสถานะของ remote sandbox แบบเงียบ ๆ

เลือก `mirror` หากคุณมองว่า sandbox เป็นสภาพแวดล้อมชั่วคราวสำหรับการรัน
เลือก `remote` หากคุณมองว่า sandbox คือ workspace ที่แท้จริง

#### วงจรชีวิตของ OpenShell

sandbox ของ OpenShell ยังคงถูกจัดการผ่านวงจรชีวิต sandbox ปกติ:

- `openclaw sandbox list` จะแสดงทั้งรันไทม์ของ OpenShell และของ Docker
- `openclaw sandbox recreate` จะลบรันไทม์ปัจจุบันและปล่อยให้ OpenClaw สร้างใหม่ในการใช้งานครั้งถัดไป
- ตรรกะการ prune ก็รับรู้ backend ด้วยเช่นกัน

สำหรับโหมด `remote` การ recreate มีความสำคัญเป็นพิเศษ:

- การ recreate จะลบ remote workspace แบบ canonical สำหรับขอบเขตนั้น
- การใช้งานครั้งถัดไปจะ seed remote workspace ชุดใหม่จาก local workspace

สำหรับโหมด `mirror` การ recreate มีผลหลักในการรีเซ็ตสภาพแวดล้อมการรันระยะไกล
เพราะ local workspace ยังคงเป็น canonical อยู่แล้ว

## การเข้าถึง workspace

`agents.defaults.sandbox.workspaceAccess` ควบคุมว่า **sandbox มองเห็นอะไรได้บ้าง**:

- `"none"` (ค่าเริ่มต้น): tools จะเห็น sandbox workspace ภายใต้ `~/.openclaw/sandboxes`
- `"ro"`: mount agent workspace แบบอ่านอย่างเดียวที่ `/agent` (ปิด `write`/`edit`/`apply_patch`)
- `"rw"`: mount agent workspace แบบอ่าน/เขียนที่ `/workspace`

เมื่อใช้ OpenShell backend:

- โหมด `mirror` ยังคงใช้ local workspace เป็นแหล่ง canonical ระหว่างแต่ละเทิร์นของ exec
- โหมด `remote` ใช้ remote OpenShell workspace เป็นแหล่ง canonical หลังจาก seed ครั้งแรก
- `workspaceAccess: "ro"` และ `"none"` ยังคงจำกัดพฤติกรรมการเขียนแบบเดียวกัน

สื่อขาเข้าจะถูกคัดลอกเข้าไปใน sandbox workspace ที่กำลังใช้งาน (`media/inbound/*`)
หมายเหตุเกี่ยวกับ Skills: tool `read` ยึดรากอยู่ที่ sandbox เมื่อใช้ `workspaceAccess: "none"`
OpenClaw จะมิเรอร์ skills ที่เข้าเกณฑ์เข้าไปใน sandbox workspace (`.../skills`) เพื่อให้
สามารถอ่านได้ เมื่อใช้ `"rw"` skills ใน workspace จะอ่านได้จาก
`/workspace/skills`

## Custom bind mounts

`agents.defaults.sandbox.docker.binds` จะ mount ไดเรกทอรีโฮสต์เพิ่มเติมเข้าไปใน container
รูปแบบคือ `host:container:mode` (เช่น `"/home/user/source:/source:rw"`)

binds ระดับโกลบอลและรายเอเจนต์จะถูก **รวมกัน** (ไม่ใช่เขียนทับ) ภายใต้ `scope: "shared"` จะไม่ใช้ per-agent binds

`agents.defaults.sandbox.browser.binds` จะ mount ไดเรกทอรีโฮสต์เพิ่มเติมเข้าไปใน container ของ **sandbox browser** เท่านั้น

- เมื่อมีการตั้งค่า (รวมถึง `[]`) จะใช้แทน `agents.defaults.sandbox.docker.binds` สำหรับ browser container
- หากไม่ตั้งค่า browser container จะ fallback ไปใช้ `agents.defaults.sandbox.docker.binds` (เข้ากันได้กับของเดิม)

ตัวอย่าง (source แบบอ่านอย่างเดียว + data directory เพิ่มเติม):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

หมายเหตุด้านความปลอดภัย:

- Binds จะข้ามระบบไฟล์ของ sandbox: มันเปิดเผย paths บนโฮสต์ตามโหมดที่คุณตั้ง (`:ro` หรือ `:rw`)
- OpenClaw จะบล็อกแหล่ง bind ที่อันตราย (เช่น `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` และ parent mounts ที่จะทำให้มองเห็นสิ่งเหล่านั้น)
- OpenClaw ยังบล็อกรากข้อมูลรับรองทั่วไปใน home directory เช่น `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` และ `~/.ssh`
- การตรวจสอบ bind ไม่ใช่แค่การจับคู่สตริง OpenClaw จะ normalize source path จากนั้น resolve อีกครั้งผ่าน deepest existing ancestor ก่อนจะตรวจสอบ blocked paths และ allowed roots ซ้ำ
- นั่นหมายความว่าการหลบหนีผ่านพาเรนต์ที่เป็น symlink ยังคงถูกปิดกั้นแบบ fail-closed แม้ leaf สุดท้ายจะยังไม่มีอยู่จริง ตัวอย่าง: `/workspace/run-link/new-file` จะยัง resolve เป็น `/var/run/...` หาก `run-link` ชี้ไปที่นั่น
- allowed source roots ก็ถูก canonicalize แบบเดียวกัน ดังนั้น path ที่เพียงแค่ดูเหมือนอยู่ใน allowlist ก่อนการ resolve symlink ก็ยังจะถูกปฏิเสธว่า `outside allowed roots`
- mount ที่ละเอียดอ่อน (secrets, SSH keys, service credentials) ควรใช้ `:ro` เว้นแต่จำเป็นอย่างยิ่ง
- ใช้ร่วมกับ `workspaceAccess: "ro"` ได้หากคุณต้องการเพียงการอ่าน workspace; โหมด bind ยังคงเป็นอิสระจากกัน
- ดู [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) สำหรับวิธีที่ binds โต้ตอบกับ tool policy และ elevated exec

## Images + การตั้งค่า

Docker image ค่าเริ่มต้น: `openclaw-sandbox:bookworm-slim`

สร้างมันครั้งเดียว:

```bash
scripts/sandbox-setup.sh
```

หมายเหตุ: image ค่าเริ่มต้น **ไม่ได้** รวม Node มาให้ หาก skill ต้องใช้ Node (หรือ
รันไทม์อื่น ๆ) ให้สร้าง custom image หรือทำการติดตั้งผ่าน
`sandbox.docker.setupCommand` (ต้องมี network egress + writable root +
ผู้ใช้ root)

หากคุณต้องการ sandbox image ที่ใช้งานได้มากขึ้นพร้อมเครื่องมือทั่วไป (เช่น
`curl`, `jq`, `nodejs`, `python3`, `git`) ให้สร้าง:

```bash
scripts/sandbox-common-setup.sh
```

จากนั้นตั้งค่า `agents.defaults.sandbox.docker.image` เป็น
`openclaw-sandbox-common:bookworm-slim`

sandboxed browser image:

```bash
scripts/sandbox-browser-setup.sh
```

โดยค่าเริ่มต้น Docker sandbox containers จะรันแบบ **ไม่มีเครือข่าย**
แทนที่ได้ด้วย `agents.defaults.sandbox.docker.network`

bundled sandbox browser image ยังใช้ค่าเริ่มต้นการเริ่ม Chromium แบบอนุรักษ์นิยม
สำหรับงานแบบ containerized ด้วย ค่าเริ่มต้นปัจจุบันของ container ประกอบด้วย:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `--no-sandbox` เมื่อเปิดใช้ `noSandbox`
- แฟล็ก hardening ด้านกราฟิกทั้งสามตัว (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) เป็นตัวเลือก และมีประโยชน์
  เมื่อ containers ไม่มีการรองรับ GPU ตั้งค่า `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  หากงานของคุณต้องใช้ WebGL หรือฟีเจอร์ 3D/browser อื่น ๆ
- `--disable-extensions` เปิดอยู่เป็นค่าเริ่มต้น และปิดได้ด้วย
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` สำหรับโฟลว์ที่ต้องพึ่งพา extensions
- `--renderer-process-limit=2` ควบคุมด้วย
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` โดย `0` จะคงค่าเริ่มต้นของ Chromium

หากคุณต้องการ runtime profile แบบอื่น ให้ใช้ custom browser image และกำหนด
entrypoint ของคุณเอง สำหรับโปรไฟล์ Chromium ในเครื่อง (ที่ไม่ใช่ container) ให้ใช้
`browser.extraArgs` เพื่อเพิ่มแฟล็กเริ่มต้นเพิ่มเติม

ค่าเริ่มต้นด้านความปลอดภัย:

- `network: "host"` ถูกบล็อก
- `network: "container:<id>"` ถูกบล็อกเป็นค่าเริ่มต้น (มีความเสี่ยงจากการข้าม namespace join)
- ตัวเลือก break-glass override: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`

การติดตั้ง Docker และ gateway แบบ containerized อยู่ที่นี่:
[Docker](/th/install/docker)

สำหรับการ deploy Docker gateway, `scripts/docker/setup.sh` สามารถ bootstrap sandbox config ได้
ตั้งค่า `OPENCLAW_SANDBOX=1` (หรือ `true`/`yes`/`on`) เพื่อเปิดใช้เส้นทางนั้น คุณสามารถ
แทนที่ตำแหน่ง socket ได้ด้วย `OPENCLAW_DOCKER_SOCKET` เอกสารการตั้งค่าเต็มรูปแบบและ
ข้อมูลอ้างอิง env: [Docker](/th/install/docker#agent-sandbox)

## setupCommand (การตั้งค่า container แบบครั้งเดียว)

`setupCommand` จะรัน **หนึ่งครั้ง** หลังจากสร้าง sandbox container แล้ว (ไม่ใช่ทุกครั้งที่รัน)
มันทำงานภายใน container ผ่าน `sh -lc`

Paths:

- ระดับโกลบอล: `agents.defaults.sandbox.docker.setupCommand`
- รายเอเจนต์: `agents.list[].sandbox.docker.setupCommand`

ข้อผิดพลาดที่พบบ่อย:

- ค่าเริ่มต้น `docker.network` คือ `"none"` (ไม่มี egress) ดังนั้นการติดตั้งแพ็กเกจจะล้มเหลว
- `docker.network: "container:<id>"` ต้องใช้ `dangerouslyAllowContainerNamespaceJoin: true` และเป็นแบบ break-glass เท่านั้น
- `readOnlyRoot: true` ป้องกันการเขียน; ให้ตั้ง `readOnlyRoot: false` หรือสร้าง custom image
- `user` ต้องเป็น root สำหรับการติดตั้งแพ็กเกจ (ไม่ต้องระบุ `user` หรือกำหนด `user: "0:0"`)
- sandbox exec **ไม่** รับ `process.env` ของโฮสต์ ใช้
  `agents.defaults.sandbox.docker.env` (หรือ custom image) สำหรับ API keys ของ skill

## Tool policy + ช่องทางหลบออก

นโยบายอนุญาต/ปฏิเสธของ tool ยังคงมีผลก่อนกฎของ sandbox หาก tool ถูกปฏิเสธ
ในระดับโกลบอลหรือรายเอเจนต์ sandboxing จะไม่ทำให้มันกลับมาใช้งานได้

`tools.elevated` เป็นช่องทางหลบออกแบบชัดเจนที่รัน `exec` นอก sandbox (`gateway` เป็นค่าเริ่มต้น หรือ `node` เมื่อ exec target คือ `node`)
คำสั่ง `/exec` มีผลเฉพาะกับผู้ส่งที่ได้รับอนุญาตและจะคงอยู่ต่อเซสชัน; หากต้องการปิด
`exec` แบบถาวร ให้ใช้นโยบายปฏิเสธของ tool (ดู [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated))

การดีบัก:

- ใช้ `openclaw sandbox explain` เพื่อตรวจสอบโหมด sandbox ที่มีผลจริง, tool policy และคีย์ config สำหรับการแก้ไข
- ดู [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) สำหรับกรอบความคิดแบบ “ทำไมสิ่งนี้ถึงถูกบล็อก?”
  ควรล็อกให้แน่นไว้

## การแทนที่หลายเอเจนต์

แต่ละเอเจนต์สามารถแทนที่ sandbox + tools ได้:
`agents.list[].sandbox` และ `agents.list[].tools` (รวมถึง `agents.list[].tools.sandbox.tools` สำหรับนโยบาย tool ของ sandbox)
ดู [Multi-Agent Sandbox & Tools](/th/tools/multi-agent-sandbox-tools) สำหรับลำดับความสำคัญ

## ตัวอย่างการเปิดใช้งานขั้นต่ำ

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## เอกสารที่เกี่ยวข้อง

- [OpenShell](/th/gateway/openshell) -- การตั้งค่า managed sandbox backend, โหมด workspace และเอกสารอ้างอิง config
- [Sandbox Configuration](/th/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) -- การดีบัก “ทำไมสิ่งนี้ถึงถูกบล็อก?”
- [Multi-Agent Sandbox & Tools](/th/tools/multi-agent-sandbox-tools) -- การแทนที่รายเอเจนต์และลำดับความสำคัญ
- [Security](/th/gateway/security)
