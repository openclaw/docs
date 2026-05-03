---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'การทำงานของระบบแซนด์บ็อกซ์ของ OpenClaw: โหมด ขอบเขต การเข้าถึงเวิร์กสเปซ และรูปภาพ'
title: การแซนด์บ็อกซ์
x-i18n:
    generated_at: "2026-05-03T21:33:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: e887d07ed84d582bb605c75f841499b6bed42cfc94d60690aba33c2f351b272b
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw สามารถเรียกใช้ **tools ภายใน sandbox backends** เพื่อลดขอบเขตผลกระทบได้ การทำเช่นนี้เป็น **ตัวเลือก** และควบคุมด้วยการกำหนดค่า (`agents.defaults.sandbox` หรือ `agents.list[].sandbox`) หากปิด sandboxing ไว้ tools จะทำงานบน host ส่วน Gateway ยังคงอยู่บน host; การเรียกใช้ tool จะทำงานใน sandbox ที่แยกออกมาเมื่อเปิดใช้งาน

<Note>
นี่ไม่ใช่ขอบเขตความปลอดภัยที่สมบูรณ์แบบ แต่ช่วยจำกัดการเข้าถึงระบบไฟล์และ process ได้อย่างมีนัยสำคัญเมื่อโมเดลทำสิ่งที่ไม่เหมาะสม
</Note>

## สิ่งที่จะถูก sandbox

- การเรียกใช้ tool (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` ฯลฯ)
- เบราว์เซอร์แบบ sandbox ที่เป็นตัวเลือก (`agents.defaults.sandbox.browser`)

<AccordionGroup>
  <Accordion title="รายละเอียดเบราว์เซอร์แบบ sandbox">
    - โดยค่าเริ่มต้น เบราว์เซอร์แบบ sandbox จะเริ่มทำงานอัตโนมัติ (เพื่อให้แน่ใจว่า CDP เข้าถึงได้) เมื่อ browser tool ต้องใช้ กำหนดค่าผ่าน `agents.defaults.sandbox.browser.autoStart` และ `agents.defaults.sandbox.browser.autoStartTimeoutMs`
    - โดยค่าเริ่มต้น container ของเบราว์เซอร์แบบ sandbox ใช้ Docker network เฉพาะ (`openclaw-sandbox-browser`) แทน network `bridge` แบบ global กำหนดค่าด้วย `agents.defaults.sandbox.browser.network`
    - `agents.defaults.sandbox.browser.cdpSourceRange` ที่เป็นตัวเลือกจะจำกัด CDP ingress ที่ขอบ container ด้วย CIDR allowlist (เช่น `172.21.0.1/32`)
    - การเข้าถึงตัวสังเกตการณ์ noVNC มีการป้องกันด้วยรหัสผ่านโดยค่าเริ่มต้น; OpenClaw จะออก token URL อายุสั้นที่ให้บริการหน้า bootstrap แบบ local และเปิด noVNC พร้อมรหัสผ่านใน URL fragment (ไม่ใช่ใน query/header logs)
    - `agents.defaults.sandbox.browser.allowHostControl` อนุญาตให้ session แบบ sandbox กำหนดเป้าหมายไปยังเบราว์เซอร์ของ host ได้อย่างชัดเจน
    - allowlist ที่เป็นตัวเลือกควบคุม `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`

  </Accordion>
</AccordionGroup>

ไม่ถูก sandbox:

- process ของ Gateway เอง
- tool ใด ๆ ที่อนุญาตอย่างชัดเจนให้ทำงานนอก sandbox (เช่น `tools.elevated`)
  - **Elevated exec จะข้าม sandboxing และใช้ escape path ที่กำหนดค่าไว้ (`gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อ exec target คือ `node`)**
  - หากปิด sandboxing ไว้ `tools.elevated` จะไม่เปลี่ยนการเรียกใช้ (ทำงานบน host อยู่แล้ว) ดู [Elevated Mode](/th/tools/elevated)

## โหมด

`agents.defaults.sandbox.mode` ควบคุมว่า sandboxing จะถูกใช้ **เมื่อใด**:

<Tabs>
  <Tab title="off">
    ไม่มี sandboxing
  </Tab>
  <Tab title="non-main">
    sandbox เฉพาะ session ที่ **ไม่ใช่ main** (ค่าเริ่มต้นหากคุณต้องการให้แชทปกติอยู่บน host)

    `"non-main"` อิงตาม `session.mainKey` (ค่าเริ่มต้น `"main"`) ไม่ใช่ agent id session แบบกลุ่ม/channel ใช้ key ของตัวเอง จึงนับเป็น non-main และจะถูก sandbox

  </Tab>
  <Tab title="all">
    ทุก session ทำงานใน sandbox
  </Tab>
</Tabs>

## ขอบเขต

`agents.defaults.sandbox.scope` ควบคุมว่า **จะสร้าง container กี่ตัว**:

- `"agent"` (ค่าเริ่มต้น): หนึ่ง container ต่อ agent
- `"session"`: หนึ่ง container ต่อ session
- `"shared"`: หนึ่ง container ที่ใช้ร่วมกันโดย session แบบ sandbox ทั้งหมด

## Backend

`agents.defaults.sandbox.backend` ควบคุมว่า **runtime ใด** จะให้ sandbox:

- `"docker"` (ค่าเริ่มต้นเมื่อเปิดใช้งาน sandboxing): sandbox runtime แบบ local ที่รองรับด้วย Docker
- `"ssh"`: sandbox runtime ระยะไกลทั่วไปที่รองรับด้วย SSH
- `"openshell"`: sandbox runtime ที่รองรับด้วย OpenShell

การกำหนดค่าเฉพาะ SSH อยู่ภายใต้ `agents.defaults.sandbox.ssh` การกำหนดค่าเฉพาะ OpenShell อยู่ภายใต้ `plugins.entries.openshell.config`

### การเลือก backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **ตำแหน่งที่ทำงาน** | Local container                  | host ใด ๆ ที่เข้าถึงผ่าน SSH ได้ | sandbox ที่จัดการโดย OpenShell                     |
| **การตั้งค่า**      | `scripts/sandbox-setup.sh`       | SSH key + target host          | เปิดใช้งาน OpenShell plugin                         |
| **โมเดล workspace** | Bind-mount หรือ copy             | Remote-canonical (seed ครั้งเดียว) | `mirror` หรือ `remote`                             |
| **การควบคุม network** | `docker.network` (ค่าเริ่มต้น: none) | ขึ้นอยู่กับ remote host         | ขึ้นอยู่กับ OpenShell                               |
| **Browser sandbox** | รองรับ                           | ไม่รองรับ                      | ยังไม่รองรับ                                        |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **เหมาะที่สุดสำหรับ** | การพัฒนาแบบ local, การแยกเต็มรูปแบบ | การ offload ไปยังเครื่องระยะไกล | sandbox ระยะไกลที่จัดการให้พร้อมการ sync สองทางแบบเลือกได้ |

### Docker backend

sandboxing ปิดอยู่โดยค่าเริ่มต้น หากคุณเปิดใช้งาน sandboxing และไม่ได้เลือก backend OpenClaw จะใช้ Docker backend โดยจะเรียกใช้ tools และเบราว์เซอร์แบบ sandbox ในเครื่องผ่าน Docker daemon socket (`/var/run/docker.sock`) การแยก sandbox container ถูกกำหนดโดย Docker namespaces

หากต้องการเปิดเผย host GPUs ให้ Docker sandboxes ให้ตั้งค่า `agents.defaults.sandbox.docker.gpus` หรือ override ราย agent `agents.list[].sandbox.docker.gpus` ค่านี้จะถูกส่งไปยัง flag `--gpus` ของ Docker เป็น argument แยกต่างหาก เช่น `"all"` หรือ `"device=GPU-uuid"` และต้องมี host runtime ที่เข้ากันได้ เช่น NVIDIA Container Toolkit

<Warning>
**ข้อจำกัด Docker-out-of-Docker (DooD)**

หากคุณ deploy OpenClaw Gateway เองเป็น Docker container ระบบจะ orchestrate sibling sandbox containers โดยใช้ Docker socket ของ host (DooD) ซึ่งทำให้เกิดข้อจำกัดด้าน path mapping เฉพาะ:

- **Config ต้องใช้ host paths**: การกำหนดค่า `workspace` ใน `openclaw.json` ต้องมี **absolute path ของ Host** (เช่น `/home/user/.openclaw/workspaces`) ไม่ใช่ path ภายใน Gateway container เมื่อ OpenClaw ขอให้ Docker daemon spawn sandbox ตัว daemon จะประเมิน path โดยอิงกับ namespace ของ Host OS ไม่ใช่ namespace ของ Gateway
- **FS bridge parity (volume map เหมือนกัน)**: process แบบ native ของ OpenClaw Gateway ยังเขียนไฟล์ heartbeat และ bridge ไปยัง directory `workspace` ด้วย เนื่องจาก Gateway ประเมินสตริงเดียวกันทุกประการ (host path) จากภายในสภาพแวดล้อม containerized ของตัวเอง deployment ของ Gateway จึงต้องมี volume map ที่เหมือนกันซึ่งเชื่อม namespace ของ host แบบ native (`-v /home/user/.openclaw:/home/user/.openclaw`)

หากคุณ map path ภายในโดยไม่มี absolute host parity OpenClaw จะ throw ข้อผิดพลาด permission `EACCES` แบบ native เมื่อพยายามเขียน heartbeat ภายในสภาพแวดล้อม container เพราะสตริง path แบบ fully qualified ไม่มีอยู่แบบ native
</Warning>

### SSH backend

ใช้ `backend: "ssh"` เมื่อคุณต้องการให้ OpenClaw sandbox `exec`, file tools และการอ่านสื่อบนเครื่องใด ๆ ที่เข้าถึงผ่าน SSH ได้

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

<AccordionGroup>
  <Accordion title="วิธีการทำงาน">
    - OpenClaw สร้าง remote root ต่อ scope ภายใต้ `sandbox.ssh.workspaceRoot`
    - เมื่อใช้งานครั้งแรกหลังจากสร้างหรือสร้างใหม่ OpenClaw จะ seed remote workspace นั้นจาก local workspace หนึ่งครั้ง
    - หลังจากนั้น `exec`, `read`, `write`, `edit`, `apply_patch`, การอ่าน prompt media และ inbound media staging จะทำงานกับ remote workspace โดยตรงผ่าน SSH
    - OpenClaw จะไม่ sync การเปลี่ยนแปลงระยะไกลกลับมายัง local workspace โดยอัตโนมัติ

  </Accordion>
  <Accordion title="ข้อมูล authentication">
    - `identityFile`, `certificateFile`, `knownHostsFile`: ใช้ไฟล์ local ที่มีอยู่และส่งผ่าน config ของ OpenSSH
    - `identityData`, `certificateData`, `knownHostsData`: ใช้ inline strings หรือ SecretRefs OpenClaw จะแปลงค่าผ่าน snapshot ของ secrets runtime ปกติ เขียนลง temp files ด้วย `0600` และลบทิ้งเมื่อ session SSH สิ้นสุด
    - หากตั้งค่าทั้ง `*File` และ `*Data` สำหรับรายการเดียวกัน `*Data` จะมีผลสำหรับ session SSH นั้น

  </Accordion>
  <Accordion title="ผลของ remote-canonical">
    นี่คือโมเดล **remote-canonical** remote SSH workspace จะกลายเป็นสถานะ sandbox จริงหลังจาก seed เริ่มต้น

    - การแก้ไขแบบ host-local ที่ทำนอก OpenClaw หลังขั้นตอน seed จะมองไม่เห็นจากระยะไกลจนกว่าคุณจะสร้าง sandbox ใหม่
    - `openclaw sandbox recreate` จะลบ remote root ต่อ scope และ seed ใหม่จาก local ในการใช้งานครั้งถัดไป
    - ไม่รองรับ browser sandboxing บน SSH backend
    - การตั้งค่า `sandbox.docker.*` ไม่มีผลกับ SSH backend

  </Accordion>
</AccordionGroup>

### OpenShell backend

ใช้ `backend: "openshell"` เมื่อคุณต้องการให้ OpenClaw sandbox tools ในสภาพแวดล้อมระยะไกลที่จัดการโดย OpenShell สำหรับคู่มือการตั้งค่าแบบเต็ม ข้อมูลอ้างอิงการกำหนดค่า และการเปรียบเทียบโหมด workspace โปรดดู [หน้า OpenShell เฉพาะ](/th/gateway/openshell)

OpenShell ใช้ core SSH transport และ remote filesystem bridge เดียวกับ SSH backend ทั่วไปซ้ำ และเพิ่ม lifecycle เฉพาะ OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) พร้อมโหมด workspace `mirror` ที่เป็นตัวเลือก

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

โหมด OpenShell:

- `mirror` (ค่าเริ่มต้น): local workspace ยังคงเป็น canonical OpenClaw sync ไฟล์ local เข้า OpenShell ก่อน exec และ sync remote workspace กลับหลัง exec
- `remote`: OpenShell workspace เป็น canonical หลังจากสร้าง sandbox แล้ว OpenClaw seed remote workspace หนึ่งครั้งจาก local workspace จากนั้น file tools และ exec จะทำงานกับ remote sandbox โดยตรงโดยไม่ sync การเปลี่ยนแปลงกลับ

<AccordionGroup>
  <Accordion title="รายละเอียด remote transport">
    - OpenClaw ขอ config SSH เฉพาะ sandbox จาก OpenShell ผ่าน `openshell sandbox ssh-config <name>`
    - Core เขียน config SSH นั้นลง temp file, เปิด session SSH และใช้ remote filesystem bridge เดียวกับที่ใช้โดย `backend: "ssh"` ซ้ำ
    - ในโหมด `mirror` มีเพียง lifecycle เท่านั้นที่ต่างกัน: sync local ไป remote ก่อน exec แล้ว sync กลับหลัง exec

  </Accordion>
  <Accordion title="ข้อจำกัดปัจจุบันของ OpenShell">
    - ยังไม่รองรับ sandbox browser
    - ไม่รองรับ `sandbox.docker.binds` บน OpenShell backend
    - runtime knobs เฉพาะ Docker ภายใต้ `sandbox.docker.*` ยังคงมีผลเฉพาะกับ Docker backend เท่านั้น

  </Accordion>
</AccordionGroup>

#### โหมด workspace

OpenShell มีโมเดล workspace สองแบบ ส่วนนี้คือส่วนที่สำคัญที่สุดในการใช้งานจริง

<Tabs>
  <Tab title="mirror (local canonical)">
    ใช้ `plugins.entries.openshell.config.mode: "mirror"` เมื่อคุณต้องการให้ **local workspace ยังคงเป็น canonical**

    พฤติกรรม:

    - ก่อน `exec` OpenClaw sync local workspace เข้าไปยัง OpenShell sandbox
    - หลัง `exec` OpenClaw sync remote workspace กลับมายัง local workspace
    - File tools ยังคงทำงานผ่าน sandbox bridge แต่ local workspace ยังคงเป็น source of truth ระหว่างรอบ

    ใช้สิ่งนี้เมื่อ:

    - คุณแก้ไขไฟล์ภายในเครื่องนอก OpenClaw และต้องการให้การเปลี่ยนแปลงเหล่านั้นปรากฏใน sandbox โดยอัตโนมัติ
    - คุณต้องการให้ OpenShell sandbox ทำงานใกล้เคียงกับแบ็กเอนด์ Docker มากที่สุด
    - คุณต้องการให้ workspace ของโฮสต์สะท้อนการเขียนจาก sandbox หลังแต่ละรอบ exec

    ข้อแลกเปลี่ยน: มีต้นทุนการซิงก์เพิ่มเติมก่อนและหลัง exec

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    ใช้ `plugins.entries.openshell.config.mode: "remote"` เมื่อคุณต้องการให้ **OpenShell workspace กลายเป็นแหล่งอ้างอิงหลัก**

    พฤติกรรม:

    - เมื่อสร้าง sandbox ครั้งแรก OpenClaw จะตั้งต้น remote workspace จาก local workspace หนึ่งครั้ง
    - หลังจากนั้น `exec`, `read`, `write`, `edit` และ `apply_patch` จะทำงานกับ remote OpenShell workspace โดยตรง
    - OpenClaw จะ **ไม่** ซิงก์การเปลี่ยนแปลงระยะไกลกลับเข้า local workspace หลัง exec
    - การอ่านสื่อในช่วง prompt ยังทำงานได้ เพราะเครื่องมือไฟล์และสื่ออ่านผ่าน sandbox bridge แทนที่จะสมมติว่าเป็นพาธโฮสต์ภายในเครื่อง
    - การส่งข้อมูลใช้ SSH เข้าไปยัง OpenShell sandbox ที่ได้จาก `openshell sandbox ssh-config`

    ผลลัพธ์สำคัญ:

    - หากคุณแก้ไขไฟล์บนโฮสต์นอก OpenClaw หลังขั้นตอนตั้งต้น remote sandbox จะ **ไม่** เห็นการเปลี่ยนแปลงเหล่านั้นโดยอัตโนมัติ
    - หากสร้าง sandbox ใหม่ remote workspace จะถูกตั้งต้นจาก local workspace อีกครั้ง
    - เมื่อใช้ `scope: "agent"` หรือ `scope: "shared"` remote workspace นั้นจะถูกแชร์ในขอบเขตเดียวกัน

    ใช้สิ่งนี้เมื่อ:

    - sandbox ควรอยู่ฝั่ง OpenShell ระยะไกลเป็นหลัก
    - คุณต้องการลดค่าใช้จ่ายในการซิงก์ต่อรอบ
    - คุณไม่ต้องการให้การแก้ไขภายในเครื่องของโฮสต์เขียนทับสถานะ remote sandbox อย่างเงียบ ๆ

  </Tab>
</Tabs>

เลือก `mirror` หากคุณมอง sandbox เป็นสภาพแวดล้อมชั่วคราวสำหรับการดำเนินการ เลือก `remote` หากคุณมอง sandbox เป็น workspace จริง

#### วงจรชีวิตของ OpenShell

OpenShell sandboxes ยังคงถูกจัดการผ่านวงจรชีวิต sandbox ปกติ:

- `openclaw sandbox list` แสดง runtime ของ OpenShell รวมถึง runtime ของ Docker
- `openclaw sandbox recreate` ลบ runtime ปัจจุบันและให้ OpenClaw สร้างใหม่เมื่อใช้งานครั้งถัดไป
- ตรรกะการ prune ก็รับรู้แบ็กเอนด์เช่นกัน

สำหรับโหมด `remote` การสร้างใหม่มีความสำคัญเป็นพิเศษ:

- การสร้างใหม่จะลบ canonical remote workspace สำหรับ scope นั้น
- การใช้งานครั้งถัดไปจะตั้งต้น remote workspace ใหม่จาก local workspace

สำหรับโหมด `mirror` การสร้างใหม่ส่วนใหญ่จะรีเซ็ตสภาพแวดล้อมดำเนินการระยะไกล เพราะ local workspace ยังคงเป็นแหล่งอ้างอิงหลักอยู่แล้ว

## การเข้าถึง workspace

`agents.defaults.sandbox.workspaceAccess` ควบคุมว่า **sandbox มองเห็นอะไรได้บ้าง**:

<Tabs>
  <Tab title="none (default)">
    เครื่องมือจะเห็น sandbox workspace ใต้ `~/.openclaw/sandboxes`
  </Tab>
  <Tab title="ro">
    เมานต์ agent workspace แบบอ่านอย่างเดียวที่ `/agent` (ปิดใช้งาน `write`/`edit`/`apply_patch`)
  </Tab>
  <Tab title="rw">
    เมานต์ agent workspace แบบอ่าน/เขียนที่ `/workspace`
  </Tab>
</Tabs>

เมื่อใช้แบ็กเอนด์ OpenShell:

- โหมด `mirror` ยังคงใช้ local workspace เป็นแหล่งอ้างอิงหลักระหว่างรอบ exec
- โหมด `remote` ใช้ remote OpenShell workspace เป็นแหล่งอ้างอิงหลักหลังการตั้งต้นครั้งแรก
- `workspaceAccess: "ro"` และ `"none"` ยังคงจำกัดพฤติกรรมการเขียนในแบบเดียวกัน

สื่อขาเข้าจะถูกคัดลอกเข้า active sandbox workspace (`media/inbound/*`)

<Note>
**หมายเหตุ Skills:** เครื่องมือ `read` มีรากอยู่ที่ sandbox เมื่อใช้ `workspaceAccess: "none"` OpenClaw จะ mirror skills ที่เข้าเกณฑ์เข้าไปใน sandbox workspace (`.../skills`) เพื่อให้อ่านได้ เมื่อใช้ `"rw"` จะอ่าน workspace skills ได้จาก `/workspace/skills`
</Note>

## bind mounts แบบกำหนดเอง

`agents.defaults.sandbox.docker.binds` เมานต์ไดเรกทอรีโฮสต์เพิ่มเติมเข้าไปในคอนเทนเนอร์ รูปแบบ: `host:container:mode` (เช่น `"/home/user/source:/source:rw"`)

binds แบบส่วนกลางและต่อ agent จะถูก **ผสาน** กัน (ไม่ใช่แทนที่กัน) ภายใต้ `scope: "shared"` binds ต่อ agent จะถูกละเว้น

`agents.defaults.sandbox.browser.binds` เมานต์ไดเรกทอรีโฮสต์เพิ่มเติมเข้าไปในคอนเทนเนอร์ **sandbox browser** เท่านั้น

- เมื่อตั้งค่าไว้ (รวมถึง `[]`) ค่านี้จะแทนที่ `agents.defaults.sandbox.docker.binds` สำหรับคอนเทนเนอร์ browser
- เมื่อไม่ระบุ คอนเทนเนอร์ browser จะ fallback ไปใช้ `agents.defaults.sandbox.docker.binds` (เข้ากันได้ย้อนหลัง)

ตัวอย่าง (ซอร์สแบบอ่านอย่างเดียว + ไดเรกทอรีข้อมูลเพิ่มเติม):

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

<Warning>
**ความปลอดภัยของ bind**

- Binds ข้ามระบบไฟล์ของ sandbox: มันเปิดเผยพาธโฮสต์ด้วยโหมดที่คุณตั้งไว้ (`:ro` หรือ `:rw`)
- OpenClaw บล็อกแหล่ง bind ที่อันตราย (ตัวอย่างเช่น `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` และ parent mounts ที่จะเปิดเผยสิ่งเหล่านั้น)
- OpenClaw ยังบล็อกรากข้อมูลรับรองทั่วไปในไดเรกทอรีบ้าน เช่น `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` และ `~/.ssh`
- การตรวจสอบ bind ไม่ใช่แค่การจับคู่สตริง OpenClaw จะ normalize พาธต้นทาง แล้ว resolve อีกครั้งผ่านบรรพบุรุษที่มีอยู่ลึกที่สุดก่อนตรวจสอบพาธที่ถูกบล็อกและรากที่อนุญาตซ้ำ
- นั่นหมายความว่า symlink-parent escapes ยังคง fail closed แม้ leaf สุดท้ายจะยังไม่มีอยู่ ตัวอย่าง: `/workspace/run-link/new-file` ยังคง resolve เป็น `/var/run/...` หาก `run-link` ชี้ไปที่นั่น
- รากต้นทางที่อนุญาตจะถูก canonicalize ด้วยวิธีเดียวกัน ดังนั้นพาธที่ดูเหมือนอยู่ภายใน allowlist ก่อนการ resolve symlink ก็ยังถูกปฏิเสธเป็น `outside allowed roots`
- mounts ที่ละเอียดอ่อน (secrets, SSH keys, service credentials) ควรเป็น `:ro` เว้นแต่จำเป็นจริง ๆ
- ใช้ร่วมกับ `workspaceAccess: "ro"` หากคุณต้องการเข้าถึง workspace แบบอ่านอย่างเดียวเท่านั้น โหมด bind ยังคงเป็นอิสระต่อกัน
- ดู [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) สำหรับวิธีที่ binds ทำงานร่วมกับนโยบายเครื่องมือและ elevated exec

</Warning>

## อิมเมจและการตั้งค่า

อิมเมจ Docker เริ่มต้น: `openclaw-sandbox:bookworm-slim`

<Note>
**ซอร์ส checkout เทียบกับการติดตั้ง npm**

สคริปต์ช่วยเหลือ `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` และ `scripts/sandbox-browser-setup.sh` มีให้ใช้เฉพาะเมื่อรันจาก [source checkout](https://github.com/openclaw/openclaw) เท่านั้น สคริปต์เหล่านี้ไม่รวมอยู่ในแพ็กเกจ npm

หากคุณติดตั้ง OpenClaw ผ่าน `npm install -g openclaw` ให้ใช้คำสั่ง `docker build` แบบ inline ที่แสดงด้านล่างแทน
</Note>

<Steps>
  <Step title="Build the default image">
    จาก source checkout:

    ```bash
    scripts/sandbox-setup.sh
    ```

    จากการติดตั้ง npm (ไม่จำเป็นต้องมี source checkout):

    ```bash
    docker build -t openclaw-sandbox:bookworm-slim - <<'DOCKERFILE'
    FROM debian:bookworm-slim
    ENV DEBIAN_FRONTEND=noninteractive
    RUN apt-get update && apt-get install -y --no-install-recommends \
      bash ca-certificates curl git jq python3 ripgrep \
      && rm -rf /var/lib/apt/lists/*
    RUN useradd --create-home --shell /bin/bash sandbox
    USER sandbox
    WORKDIR /home/sandbox
    CMD ["sleep", "infinity"]
    DOCKERFILE
    ```

    อิมเมจเริ่มต้น **ไม่มี** Node หาก skill ต้องใช้ Node (หรือ runtime อื่น) ให้ bake อิมเมจแบบกำหนดเอง หรือ install ผ่าน `sandbox.docker.setupCommand` (ต้องมี network egress + root ที่เขียนได้ + root user)

    OpenClaw จะไม่แทนที่ด้วย `debian:bookworm-slim` ธรรมดาแบบเงียบ ๆ เมื่อไม่มี `openclaw-sandbox:bookworm-slim` การรัน sandbox ที่ target อิมเมจเริ่มต้นจะ fail fast พร้อมคำแนะนำการ build จนกว่าคุณจะ build เพราะอิมเมจที่มาพร้อมระบบมี `python3` สำหรับตัวช่วยเขียน/แก้ไขของ sandbox

  </Step>
  <Step title="Optional: build the common image">
    สำหรับอิมเมจ sandbox ที่ใช้งานได้มากขึ้นพร้อมเครื่องมือทั่วไป (ตัวอย่างเช่น `curl`, `jq`, `nodejs`, `python3`, `git`):

    จาก source checkout:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    จากการติดตั้ง npm ให้ build อิมเมจเริ่มต้นก่อน (ดูด้านบน) จากนั้น build อิมเมจ common ต่อบนอิมเมจนั้นโดยใช้ [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) จาก repository

    จากนั้นตั้งค่า `agents.defaults.sandbox.docker.image` เป็น `openclaw-sandbox-common:bookworm-slim`

  </Step>
  <Step title="Optional: build the sandbox browser image">
    จาก source checkout:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    จากการติดตั้ง npm ให้ build โดยใช้ [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) จาก repository

  </Step>
</Steps>

โดยค่าเริ่มต้น คอนเทนเนอร์ Docker sandbox จะรันแบบ **ไม่มีเครือข่าย** Override ด้วย `agents.defaults.sandbox.docker.network`

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    อิมเมจ sandbox browser ที่มาพร้อมระบบยังใช้ค่าเริ่มต้นการเริ่มต้น Chromium แบบระมัดระวังสำหรับงานที่รันในคอนเทนเนอร์ ค่าเริ่มต้นของคอนเทนเนอร์ปัจจุบันรวมถึง:

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
    - แฟล็ก hardening ด้านกราฟิกสามรายการ (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) เป็นตัวเลือกและมีประโยชน์เมื่อคอนเทนเนอร์ไม่มีการรองรับ GPU ตั้งค่า `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หาก workload ของคุณต้องใช้ WebGL หรือฟีเจอร์ 3D/browser อื่น
    - `--disable-extensions` เปิดใช้เป็นค่าเริ่มต้น และสามารถปิดได้ด้วย `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` สำหรับ flow ที่พึ่งพา extension
    - `--renderer-process-limit=2` ถูกควบคุมโดย `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` โดย `0` จะคงค่าเริ่มต้นของ Chromium

    หากคุณต้องการโปรไฟล์ runtime ที่ต่างออกไป ให้ใช้อิมเมจ browser แบบกำหนดเองและระบุ entrypoint ของคุณเอง สำหรับโปรไฟล์ Chromium ภายในเครื่อง (ไม่ใช่คอนเทนเนอร์) ให้ใช้ `browser.extraArgs` เพื่อเพิ่มแฟล็กเริ่มต้นเพิ่มเติม

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` ถูกบล็อก
    - `network: "container:<id>"` ถูกบล็อกโดยค่าเริ่มต้น (ความเสี่ยงจากการ bypass namespace join)
    - การ override แบบ break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`

  </Accordion>
</AccordionGroup>

การติดตั้ง Docker และ containerized Gateway อยู่ที่นี่: [Docker](/th/install/docker)

สำหรับการปรับใช้ Docker Gateway, `scripts/docker/setup.sh` สามารถ bootstrap การกำหนดค่า sandbox ได้ ตั้งค่า `OPENCLAW_SANDBOX=1` (หรือ `true`/`yes`/`on`) เพื่อเปิดใช้เส้นทางนั้น คุณสามารถ override ตำแหน่ง socket ด้วย `OPENCLAW_DOCKER_SOCKET` ข้อมูลอ้างอิงการตั้งค่าและ env แบบเต็ม: [Docker](/th/install/docker#agent-sandbox)

## setupCommand (การตั้งค่าคอนเทนเนอร์ครั้งเดียว)

`setupCommand` รัน **ครั้งเดียว** หลังจากสร้างคอนเทนเนอร์ sandbox แล้ว (ไม่ใช่ทุกรัน) มันทำงานภายในคอนเทนเนอร์ผ่าน `sh -lc`

พาธ:

- ส่วนกลาง: `agents.defaults.sandbox.docker.setupCommand`
- ต่อ agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="ข้อผิดพลาดที่พบบ่อย">
    - ค่าเริ่มต้นของ `docker.network` คือ `"none"` (ไม่มี egress) ดังนั้นการติดตั้งแพ็กเกจจะล้มเหลว
    - `docker.network: "container:<id>"` ต้องใช้ `dangerouslyAllowContainerNamespaceJoin: true` และใช้เฉพาะกรณีฉุกเฉินเท่านั้น
    - `readOnlyRoot: true` จะป้องกันการเขียน; ตั้งค่า `readOnlyRoot: false` หรือสร้างอิมเมจแบบกำหนดเองไว้ล่วงหน้า
    - `user` ต้องเป็น root สำหรับการติดตั้งแพ็กเกจ (ละเว้น `user` หรือตั้งค่า `user: "0:0"`)
    - Sandbox exec **ไม่** สืบทอด `process.env` จากโฮสต์ ใช้ `agents.defaults.sandbox.docker.env` (หรืออิมเมจแบบกำหนดเอง) สำหรับคีย์ API ของ skill

  </Accordion>
</AccordionGroup>

## นโยบายเครื่องมือและทางออกฉุกเฉิน

นโยบายอนุญาต/ปฏิเสธเครื่องมือยังคงมีผลก่อนกฎ sandbox หากเครื่องมือถูกปฏิเสธในระดับทั่วโลกหรือต่อ agent การใช้ sandbox จะไม่นำเครื่องมือนั้นกลับมา

`tools.elevated` คือทางออกฉุกเฉินแบบชัดเจนที่รัน `exec` นอก sandbox (`gateway` ตามค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec คือ `node`) directive `/exec` มีผลเฉพาะกับผู้ส่งที่ได้รับอนุญาตและคงอยู่ต่อ session; หากต้องการปิดใช้งาน `exec` แบบเด็ดขาด ให้ใช้นโยบายเครื่องมือแบบปฏิเสธ (ดู [Sandbox เทียบกับนโยบายเครื่องมือเทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated))

การดีบัก:

- ใช้ `openclaw sandbox explain` เพื่อตรวจสอบโหมด sandbox ที่มีผลจริง นโยบายเครื่องมือ และคีย์ config สำหรับการแก้ไข
- ดู [Sandbox เทียบกับนโยบายเครื่องมือเทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) สำหรับกรอบคิดเรื่อง "ทำไมสิ่งนี้ถึงถูกบล็อก?"

ล็อกให้แน่นหนาไว้

## การ override แบบหลาย agent

แต่ละ agent สามารถ override sandbox + เครื่องมือได้: `agents.list[].sandbox` และ `agents.list[].tools` (รวมถึง `agents.list[].tools.sandbox.tools` สำหรับนโยบายเครื่องมือของ sandbox) ดู [Sandbox และเครื่องมือแบบหลาย Agent](/th/tools/multi-agent-sandbox-tools) สำหรับลำดับความสำคัญ

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

## ที่เกี่ยวข้อง

- [Sandbox และเครื่องมือแบบหลาย Agent](/th/tools/multi-agent-sandbox-tools) — การ override ต่อ agent และลำดับความสำคัญ
- [OpenShell](/th/gateway/openshell) — การตั้งค่า backend sandbox ที่จัดการให้ โหมด workspace และข้อมูลอ้างอิง config
- [การกำหนดค่า Sandbox](/th/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox เทียบกับนโยบายเครื่องมือเทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) — การดีบัก "ทำไมสิ่งนี้ถึงถูกบล็อก?"
- [ความปลอดภัย](/th/gateway/security)
