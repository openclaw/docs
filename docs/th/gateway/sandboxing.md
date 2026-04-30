---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'การทำงานของการแซนด์บ็อกซ์ใน OpenClaw: โหมด ขอบเขต การเข้าถึงเวิร์กสเปซ และรูปภาพ'
title: การแยกสภาพแวดล้อมแบบแซนด์บ็อกซ์
x-i18n:
    generated_at: "2026-04-30T09:55:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96861f3f70bf26b5ed20a063c047064f98a0dc74d36e8f4ccada1f3bb455118d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw สามารถเรียกใช้ **เครื่องมือภายในแบ็กเอนด์ sandbox** เพื่อลดขอบเขตผลกระทบได้ สิ่งนี้เป็น **ตัวเลือก** และควบคุมด้วยการกำหนดค่า (`agents.defaults.sandbox` หรือ `agents.list[].sandbox`) หากปิด sandboxing เครื่องมือจะทำงานบนโฮสต์ Gateway จะยังอยู่บนโฮสต์ ส่วนการดำเนินการเครื่องมือจะทำงานใน sandbox ที่แยกออกมาเมื่อเปิดใช้งาน

<Note>
สิ่งนี้ไม่ใช่ขอบเขตความปลอดภัยที่สมบูรณ์แบบ แต่ช่วยจำกัดการเข้าถึงระบบไฟล์และกระบวนการได้อย่างมีนัยสำคัญเมื่อโมเดลดำเนินการผิดพลาด
</Note>

## สิ่งที่ถูก sandbox

- การดำเนินการเครื่องมือ (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` ฯลฯ)
- เบราว์เซอร์แบบ sandbox ที่เป็นตัวเลือก (`agents.defaults.sandbox.browser`)

<AccordionGroup>
  <Accordion title="รายละเอียดเบราว์เซอร์แบบ sandbox">
    - โดยค่าเริ่มต้น เบราว์เซอร์ sandbox จะเริ่มโดยอัตโนมัติ (ตรวจให้แน่ใจว่าเข้าถึง CDP ได้) เมื่อเครื่องมือเบราว์เซอร์ต้องใช้ กำหนดค่าได้ผ่าน `agents.defaults.sandbox.browser.autoStart` และ `agents.defaults.sandbox.browser.autoStartTimeoutMs`
    - โดยค่าเริ่มต้น คอนเทนเนอร์เบราว์เซอร์ sandbox จะใช้เครือข่าย Docker เฉพาะ (`openclaw-sandbox-browser`) แทนเครือข่าย `bridge` ส่วนกลาง กำหนดค่าได้ด้วย `agents.defaults.sandbox.browser.network`
    - `agents.defaults.sandbox.browser.cdpSourceRange` ที่เป็นตัวเลือกจะจำกัด CDP ingress ที่ขอบคอนเทนเนอร์ด้วยรายการอนุญาต CIDR (เช่น `172.21.0.1/32`)
    - การเข้าถึงตัวสังเกตการณ์ noVNC มีการป้องกันด้วยรหัสผ่านโดยค่าเริ่มต้น OpenClaw จะส่ง URL โทเค็นอายุสั้นที่ให้บริการหน้า bootstrap ภายในเครื่อง และเปิด noVNC พร้อมรหัสผ่านใน URL fragment (ไม่ใช่ query/บันทึก header)
    - `agents.defaults.sandbox.browser.allowHostControl` ทำให้เซสชันแบบ sandbox สามารถกำหนดเป้าหมายไปยังเบราว์เซอร์ของโฮสต์ได้อย่างชัดเจน
    - รายการอนุญาตที่เป็นตัวเลือกจะควบคุม `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`

  </Accordion>
</AccordionGroup>

ไม่ถูก sandbox:

- กระบวนการ Gateway เอง
- เครื่องมือใดก็ตามที่ได้รับอนุญาตอย่างชัดเจนให้ทำงานนอก sandbox (เช่น `tools.elevated`)
  - **Elevated exec จะข้าม sandboxing และใช้เส้นทาง escape ที่กำหนดค่าไว้ (`gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec คือ `node`)**
  - หากปิด sandboxing อยู่ `tools.elevated` จะไม่เปลี่ยนการดำเนินการ (ทำงานบนโฮสต์อยู่แล้ว) ดู [โหมด Elevated](/th/tools/elevated)

## โหมด

`agents.defaults.sandbox.mode` ควบคุมว่า sandboxing จะถูกใช้ **เมื่อใด**:

<Tabs>
  <Tab title="off">
    ไม่มี sandboxing
  </Tab>
  <Tab title="non-main">
    sandbox เฉพาะเซสชัน **non-main** (ค่าเริ่มต้นหากคุณต้องการให้แชตปกติอยู่บนโฮสต์)

    `"non-main"` อิงตาม `session.mainKey` (ค่าเริ่มต้น `"main"`) ไม่ใช่ agent id เซสชันกลุ่ม/ช่องทางจะใช้คีย์ของตัวเอง ดังนั้นจึงนับเป็น non-main และจะถูก sandbox

  </Tab>
  <Tab title="all">
    ทุกเซสชันทำงานใน sandbox
  </Tab>
</Tabs>

## ขอบเขต

`agents.defaults.sandbox.scope` ควบคุมว่า **จะสร้างคอนเทนเนอร์กี่ตัว**:

- `"agent"` (ค่าเริ่มต้น): หนึ่งคอนเทนเนอร์ต่อ agent
- `"session"`: หนึ่งคอนเทนเนอร์ต่อเซสชัน
- `"shared"`: หนึ่งคอนเทนเนอร์ที่ใช้ร่วมกันโดยทุกเซสชันที่ถูก sandbox

## แบ็กเอนด์

`agents.defaults.sandbox.backend` ควบคุมว่า **runtime ใด** ที่ให้ sandbox:

- `"docker"` (ค่าเริ่มต้นเมื่อเปิดใช้งาน sandboxing): runtime sandbox ภายในเครื่องที่รองรับด้วย Docker
- `"ssh"`: runtime sandbox ระยะไกลทั่วไปที่รองรับด้วย SSH
- `"openshell"`: runtime sandbox ที่รองรับด้วย OpenShell

การกำหนดค่าเฉพาะ SSH อยู่ภายใต้ `agents.defaults.sandbox.ssh` การกำหนดค่าเฉพาะ OpenShell อยู่ภายใต้ `plugins.entries.openshell.config`

### การเลือกแบ็กเอนด์

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **ตำแหน่งที่ทำงาน** | คอนเทนเนอร์ภายในเครื่อง | โฮสต์ใดก็ได้ที่เข้าถึงผ่าน SSH ได้ | sandbox ที่จัดการโดย OpenShell |
| **การตั้งค่า** | `scripts/sandbox-setup.sh` | คีย์ SSH + โฮสต์เป้าหมาย | เปิดใช้งาน Plugin OpenShell |
| **โมเดล workspace** | Bind-mount หรือคัดลอก | remote-canonical (seed หนึ่งครั้ง) | `mirror` หรือ `remote` |
| **การควบคุมเครือข่าย** | `docker.network` (ค่าเริ่มต้น: ไม่มี) | ขึ้นอยู่กับโฮสต์ระยะไกล | ขึ้นอยู่กับ OpenShell |
| **เบราว์เซอร์ sandbox** | รองรับ | ไม่รองรับ | ยังไม่รองรับ |
| **Bind mounts** | `docker.binds` | ไม่เกี่ยวข้อง | ไม่เกี่ยวข้อง |
| **เหมาะที่สุดสำหรับ** | การพัฒนาภายในเครื่อง, การแยกอย่างเต็มรูปแบบ | โยนงานไปยังเครื่องระยะไกล | sandbox ระยะไกลที่จัดการให้พร้อมการซิงก์สองทางแบบเป็นตัวเลือก |

### แบ็กเอนด์ Docker

sandboxing ปิดอยู่โดยค่าเริ่มต้น หากคุณเปิดใช้งาน sandboxing และไม่ได้เลือกแบ็กเอนด์ OpenClaw จะใช้แบ็กเอนด์ Docker โดยจะดำเนินการเครื่องมือและเบราว์เซอร์ sandbox ภายในเครื่องผ่าน socket ของ Docker daemon (`/var/run/docker.sock`) การแยกคอนเทนเนอร์ sandbox ถูกกำหนดโดย namespace ของ Docker

หากต้องการเปิดเผย GPU ของโฮสต์ให้ sandbox ของ Docker ให้ตั้งค่า `agents.defaults.sandbox.docker.gpus` หรือ override ราย agent ที่ `agents.list[].sandbox.docker.gpus` ค่านี้จะถูกส่งไปยังแฟล็ก `--gpus` ของ Docker เป็นอาร์กิวเมนต์แยกต่างหาก เช่น `"all"` หรือ `"device=GPU-uuid"` และต้องใช้ runtime โฮสต์ที่เข้ากันได้ เช่น NVIDIA Container Toolkit

<Warning>
**ข้อจำกัด Docker-out-of-Docker (DooD)**

หากคุณปรับใช้ OpenClaw Gateway เองเป็นคอนเทนเนอร์ Docker มันจะจัดการคอนเทนเนอร์ sandbox แบบ sibling โดยใช้ Docker socket ของโฮสต์ สิ่งนี้นำมาซึ่งข้อจำกัดการแมปพาธเฉพาะ:

- **การกำหนดค่าต้องใช้พาธของโฮสต์**: การกำหนดค่า `workspace` ใน `openclaw.json` ต้องมี **พาธแบบ absolute ของโฮสต์** (เช่น `/home/user/.openclaw/workspaces`) ไม่ใช่พาธภายในคอนเทนเนอร์ Gateway เมื่อ OpenClaw ขอให้ Docker daemon สร้าง sandbox daemon จะประเมินพาธตาม namespace ของ Host OS ไม่ใช่ namespace ของ Gateway
- **ความเท่าเทียมของ FS bridge (แผนที่ volume เหมือนกัน)**: กระบวนการ native ของ OpenClaw Gateway ยังเขียนไฟล์ Heartbeat และ bridge ไปยังไดเรกทอรี `workspace` ด้วย เนื่องจาก Gateway ประเมินสตริงเดียวกันทุกประการ (พาธของโฮสต์) จากภายในสภาพแวดล้อมคอนเทนเนอร์ของตัวเอง การปรับใช้ Gateway ต้องรวมแผนที่ volume ที่เหมือนกันซึ่งเชื่อม namespace ของโฮสต์แบบ native (`-v /home/user/.openclaw:/home/user/.openclaw`)

หากคุณแมปพาธภายในโดยไม่มีความเท่าเทียมกับโฮสต์แบบ absolute OpenClaw จะโยนข้อผิดพลาดสิทธิ์ `EACCES` แบบ native เมื่อพยายามเขียน Heartbeat ภายในสภาพแวดล้อมคอนเทนเนอร์ เพราะสตริงพาธแบบเต็มไม่มีอยู่แบบ native
</Warning>

### แบ็กเอนด์ SSH

ใช้ `backend: "ssh"` เมื่อคุณต้องการให้ OpenClaw sandbox `exec`, เครื่องมือไฟล์ และการอ่านสื่อบนเครื่องใดก็ได้ที่เข้าถึงผ่าน SSH ได้

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
  <Accordion title="วิธีทำงาน">
    - OpenClaw สร้าง root ระยะไกลต่อขอบเขตภายใต้ `sandbox.ssh.workspaceRoot`
    - เมื่อใช้ครั้งแรกหลังจากสร้างหรือสร้างใหม่ OpenClaw จะ seed workspace ระยะไกลนั้นจาก workspace ภายในเครื่องหนึ่งครั้ง
    - หลังจากนั้น `exec`, `read`, `write`, `edit`, `apply_patch`, การอ่านสื่อ prompt และการ staging สื่อขาเข้าจะทำงานโดยตรงกับ workspace ระยะไกลผ่าน SSH
    - OpenClaw ไม่ซิงก์การเปลี่ยนแปลงระยะไกลกลับมายัง workspace ภายในเครื่องโดยอัตโนมัติ

  </Accordion>
  <Accordion title="วัสดุสำหรับการยืนยันตัวตน">
    - `identityFile`, `certificateFile`, `knownHostsFile`: ใช้ไฟล์ภายในเครื่องที่มีอยู่และส่งผ่านการกำหนดค่า OpenSSH
    - `identityData`, `certificateData`, `knownHostsData`: ใช้สตริง inline หรือ SecretRefs OpenClaw จะแก้ค่าเหล่านี้ผ่าน snapshot ของ runtime ความลับปกติ เขียนลงไฟล์ชั่วคราวด้วย `0600` และลบเมื่อเซสชัน SSH สิ้นสุด
    - หากตั้งค่าทั้ง `*File` และ `*Data` สำหรับรายการเดียวกัน `*Data` จะชนะสำหรับเซสชัน SSH นั้น

  </Accordion>
  <Accordion title="ผลลัพธ์ของ remote-canonical">
    นี่คือโมเดล **remote-canonical** workspace SSH ระยะไกลจะกลายเป็นสถานะ sandbox จริงหลังจาก seed เริ่มต้น

    - การแก้ไข host-local ที่ทำนอก OpenClaw หลังขั้นตอน seed จะมองไม่เห็นจากระยะไกลจนกว่าคุณจะสร้าง sandbox ใหม่
    - `openclaw sandbox recreate` ลบ root ระยะไกลต่อขอบเขต และ seed ใหม่จากภายในเครื่องเมื่อใช้งานครั้งถัดไป
    - ไม่รองรับเบราว์เซอร์ sandboxing บนแบ็กเอนด์ SSH
    - การตั้งค่า `sandbox.docker.*` ไม่มีผลกับแบ็กเอนด์ SSH

  </Accordion>
</AccordionGroup>

### แบ็กเอนด์ OpenShell

ใช้ `backend: "openshell"` เมื่อคุณต้องการให้ OpenClaw sandbox เครื่องมือในสภาพแวดล้อมระยะไกลที่จัดการโดย OpenShell สำหรับคู่มือการตั้งค่าฉบับเต็ม อ้างอิงการกำหนดค่า และการเปรียบเทียบโหมด workspace ดู[หน้า OpenShell](/th/gateway/openshell)เฉพาะ

OpenShell ใช้ core SSH transport และ remote filesystem bridge เดียวกันกับแบ็กเอนด์ SSH ทั่วไปซ้ำ และเพิ่ม lifecycle เฉพาะ OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) รวมถึงโหมด workspace `mirror` ที่เป็นตัวเลือก

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

- `mirror` (ค่าเริ่มต้น): workspace ภายในเครื่องยังคงเป็น canonical OpenClaw ซิงก์ไฟล์ภายในเครื่องเข้า OpenShell ก่อน exec และซิงก์ workspace ระยะไกลกลับหลัง exec
- `remote`: workspace ของ OpenShell เป็น canonical หลังจากสร้าง sandbox แล้ว OpenClaw seed workspace ระยะไกลหนึ่งครั้งจาก workspace ภายในเครื่อง จากนั้นเครื่องมือไฟล์และ exec จะทำงานโดยตรงกับ sandbox ระยะไกลโดยไม่ซิงก์การเปลี่ยนแปลงกลับ

<AccordionGroup>
  <Accordion title="รายละเอียด transport ระยะไกล">
    - OpenClaw ขอการกำหนดค่า SSH เฉพาะ sandbox จาก OpenShell ผ่าน `openshell sandbox ssh-config <name>`
    - Core เขียนการกำหนดค่า SSH นั้นลงไฟล์ชั่วคราว เปิดเซสชัน SSH และใช้ remote filesystem bridge เดียวกันกับที่ใช้โดย `backend: "ssh"` ซ้ำ
    - ในโหมด `mirror` มีเพียง lifecycle ที่ต่างออกไป: ซิงก์ภายในเครื่องไปยังระยะไกลก่อน exec แล้วซิงก์กลับหลัง exec

  </Accordion>
  <Accordion title="ข้อจำกัดปัจจุบันของ OpenShell">
    - ยังไม่รองรับเบราว์เซอร์ sandbox
    - ไม่รองรับ `sandbox.docker.binds` บนแบ็กเอนด์ OpenShell
    - ปุ่มปรับ runtime เฉพาะ Docker ภายใต้ `sandbox.docker.*` ยังมีผลเฉพาะกับแบ็กเอนด์ Docker เท่านั้น

  </Accordion>
</AccordionGroup>

#### โหมด workspace

OpenShell มีโมเดล workspace สองแบบ ส่วนนี้คือส่วนที่สำคัญที่สุดในทางปฏิบัติ

<Tabs>
  <Tab title="mirror (local canonical)">
    ใช้ `plugins.entries.openshell.config.mode: "mirror"` เมื่อคุณต้องการให้ **workspace ภายในเครื่องยังคงเป็น canonical**

    พฤติกรรม:

    - ก่อน `exec` OpenClaw จะซิงก์ workspace ภายในเครื่องเข้า sandbox ของ OpenShell
    - หลัง `exec` OpenClaw จะซิงก์ workspace ระยะไกลกลับมายัง workspace ภายในเครื่อง
    - เครื่องมือไฟล์ยังคงทำงานผ่าน sandbox bridge แต่ workspace ภายในเครื่องยังคงเป็นแหล่งข้อมูลจริงระหว่าง turn

    ใช้สิ่งนี้เมื่อ:

    - คุณแก้ไขไฟล์ภายในเครื่องนอก OpenClaw และต้องการให้การเปลี่ยนแปลงเหล่านั้นปรากฏใน sandbox โดยอัตโนมัติ
    - คุณต้องการให้ OpenShell sandbox ทำงานใกล้เคียงกับ Docker backend มากที่สุด
    - คุณต้องการให้ workspace ของโฮสต์สะท้อนการเขียนของ sandbox หลังแต่ละรอบ exec

    ข้อแลกเปลี่ยน: มีต้นทุน sync เพิ่มก่อนและหลัง exec

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    ใช้ `plugins.entries.openshell.config.mode: "remote"` เมื่อคุณต้องการให้ **OpenShell workspace กลายเป็นแหล่งอ้างอิงหลัก**

    พฤติกรรม:

    - เมื่อ sandbox ถูกสร้างครั้งแรก OpenClaw จะ seed remote workspace จาก local workspace หนึ่งครั้ง
    - หลังจากนั้น `exec`, `read`, `write`, `edit` และ `apply_patch` จะทำงานกับ remote OpenShell workspace โดยตรง
    - OpenClaw จะ **ไม่** sync การเปลี่ยนแปลงจาก remote กลับมายัง local workspace หลัง exec
    - การอ่านสื่อในช่วง prompt ยังทำงานได้ เพราะเครื่องมือไฟล์และสื่ออ่านผ่าน sandbox bridge แทนการถือว่ามี path ของโฮสต์ภายในเครื่อง
    - Transport คือ SSH เข้าสู่ OpenShell sandbox ที่ส่งกลับโดย `openshell sandbox ssh-config`

    ผลที่สำคัญ:

    - หากคุณแก้ไขไฟล์บนโฮสต์นอก OpenClaw หลังขั้นตอน seed remote sandbox จะ **ไม่** เห็นการเปลี่ยนแปลงเหล่านั้นโดยอัตโนมัติ
    - หาก sandbox ถูกสร้างใหม่ remote workspace จะถูก seed จาก local workspace อีกครั้ง
    - เมื่อใช้ `scope: "agent"` หรือ `scope: "shared"` remote workspace นั้นจะถูกแชร์ใน scope เดียวกัน

    ใช้ตัวเลือกนี้เมื่อ:

    - sandbox ควรอยู่ฝั่ง remote OpenShell เป็นหลัก
    - คุณต้องการลด overhead ของ sync ต่อรอบ
    - คุณไม่ต้องการให้การแก้ไขภายในเครื่องของโฮสต์เขียนทับสถานะ remote sandbox โดยไม่ชัดเจน

  </Tab>
</Tabs>

เลือก `mirror` หากคุณมอง sandbox เป็นสภาพแวดล้อมการรันชั่วคราว เลือก `remote` หากคุณมอง sandbox เป็น workspace จริง

#### วงจรชีวิตของ OpenShell

OpenShell sandbox ยังคงถูกจัดการผ่านวงจรชีวิต sandbox ปกติ:

- `openclaw sandbox list` แสดง runtime ของ OpenShell รวมถึง runtime ของ Docker
- `openclaw sandbox recreate` ลบ runtime ปัจจุบันและให้ OpenClaw สร้างใหม่ในการใช้งานครั้งถัดไป
- ตรรกะ prune ก็รับรู้ backend เช่นกัน

สำหรับโหมด `remote` การสร้างใหม่สำคัญเป็นพิเศษ:

- recreate จะลบ canonical remote workspace สำหรับ scope นั้น
- การใช้งานครั้งถัดไปจะ seed remote workspace ใหม่จาก local workspace

สำหรับโหมด `mirror` การสร้างใหม่ส่วนใหญ่เป็นการรีเซ็ตสภาพแวดล้อมการรันฝั่ง remote เพราะ local workspace ยังคงเป็นแหล่งอ้างอิงหลักอยู่ดี

## การเข้าถึง Workspace

`agents.defaults.sandbox.workspaceAccess` ควบคุมว่า **sandbox มองเห็นอะไรได้บ้าง**:

<Tabs>
  <Tab title="none (default)">
    เครื่องมือเห็น sandbox workspace ภายใต้ `~/.openclaw/sandboxes`
  </Tab>
  <Tab title="ro">
    เมานต์ agent workspace แบบอ่านอย่างเดียวที่ `/agent` (ปิดใช้งาน `write`/`edit`/`apply_patch`)
  </Tab>
  <Tab title="rw">
    เมานต์ agent workspace แบบอ่าน/เขียนที่ `/workspace`
  </Tab>
</Tabs>

เมื่อใช้ OpenShell backend:

- โหมด `mirror` ยังคงใช้ local workspace เป็นแหล่งอ้างอิงหลักระหว่างรอบ exec
- โหมด `remote` ใช้ remote OpenShell workspace เป็นแหล่งอ้างอิงหลักหลัง seed เริ่มต้น
- `workspaceAccess: "ro"` และ `"none"` ยังคงจำกัดพฤติกรรมการเขียนในแบบเดียวกัน

สื่อขาเข้าจะถูกคัดลอกไปยัง sandbox workspace ที่ใช้งานอยู่ (`media/inbound/*`)

<Note>
**หมายเหตุเกี่ยวกับ Skills:** เครื่องมือ `read` มีรากอยู่ที่ sandbox เมื่อใช้ `workspaceAccess: "none"` OpenClaw จะ mirror skills ที่เข้าเกณฑ์เข้าไปใน sandbox workspace (`.../skills`) เพื่อให้อ่านได้ เมื่อใช้ `"rw"` skills ของ workspace จะอ่านได้จาก `/workspace/skills`
</Note>

## Custom bind mounts

`agents.defaults.sandbox.docker.binds` เมานต์ไดเรกทอรีเพิ่มเติมของโฮสต์เข้าไปในคอนเทนเนอร์ รูปแบบ: `host:container:mode` (เช่น `"/home/user/source:/source:rw"`)

bind ระดับ global และต่อ agent จะถูก **รวมกัน** (ไม่ใช่แทนที่กัน) ภายใต้ `scope: "shared"` bind ต่อ agent จะถูกละเว้น

`agents.defaults.sandbox.browser.binds` เมานต์ไดเรกทอรีเพิ่มเติมของโฮสต์เข้าไปในคอนเทนเนอร์ **sandbox browser** เท่านั้น

- เมื่อตั้งค่าไว้ (รวมถึง `[]`) ค่านี้จะแทนที่ `agents.defaults.sandbox.docker.binds` สำหรับคอนเทนเนอร์ browser
- เมื่อละไว้ คอนเทนเนอร์ browser จะ fallback ไปใช้ `agents.defaults.sandbox.docker.binds` (รองรับย้อนหลัง)

ตัวอย่าง (source แบบอ่านอย่างเดียว + ไดเรกทอรีข้อมูลเพิ่มเติม):

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

- Bind ข้ามระบบไฟล์ของ sandbox: bind เปิดเผย path ของโฮสต์ด้วย mode ใดก็ตามที่คุณตั้ง (`:ro` หรือ `:rw`)
- OpenClaw บล็อกแหล่ง bind ที่อันตราย (เช่น `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` และ parent mount ที่จะเปิดเผยสิ่งเหล่านั้น)
- OpenClaw ยังบล็อกรากของข้อมูลรับรองทั่วไปใน home directory เช่น `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` และ `~/.ssh`
- การตรวจสอบ bind ไม่ใช่แค่การเทียบ string OpenClaw จะ normalize source path แล้ว resolve อีกครั้งผ่าน ancestor ที่ลึกที่สุดซึ่งมีอยู่ ก่อนตรวจซ้ำกับ path ที่ถูกบล็อกและ root ที่อนุญาต
- นั่นหมายความว่าการหลุดผ่าน symlink-parent ยังคง fail closed แม้ leaf สุดท้ายจะยังไม่มีอยู่ก็ตาม ตัวอย่าง: `/workspace/run-link/new-file` ยังคง resolve เป็น `/var/run/...` หาก `run-link` ชี้ไปที่นั่น
- Source root ที่อนุญาตจะถูก canonicalize ด้วยวิธีเดียวกัน ดังนั้น path ที่เพียงดูเหมือนอยู่ใน allowlist ก่อน resolve symlink จะยังถูกปฏิเสธเป็น `outside allowed roots`
- mount ที่ละเอียดอ่อน (secrets, SSH keys, service credentials) ควรเป็น `:ro` เว้นแต่จำเป็นอย่างยิ่ง
- ใช้ร่วมกับ `workspaceAccess: "ro"` หากคุณต้องการเพียงสิทธิ์อ่าน workspace; mode ของ bind ยังคงเป็นอิสระต่อกัน
- ดู [Sandbox กับ Tool Policy กับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) เพื่อดูว่า bind ทำงานร่วมกับ tool policy และ elevated exec อย่างไร

</Warning>

## Images และ setup

Docker image เริ่มต้น: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Build the default image">
    ```bash
    scripts/sandbox-setup.sh
    ```

    image เริ่มต้น **ไม่มี** Node หาก skill ต้องใช้ Node (หรือ runtime อื่น) ให้ bake custom image หรือ install ผ่าน `sandbox.docker.setupCommand` (ต้องมี network egress + root ที่เขียนได้ + ผู้ใช้ root)

    OpenClaw จะไม่แทนที่ด้วย `debian:bookworm-slim` ธรรมดาแบบเงียบ ๆ เมื่อไม่มี `openclaw-sandbox:bookworm-slim` การรัน sandbox ที่กำหนดเป้าหมายไปยัง image เริ่มต้นจะ fail fast พร้อมคำแนะนำการ build จนกว่าคุณจะรัน `scripts/sandbox-setup.sh` เพราะ image ที่มาพร้อมกันมี `python3` สำหรับ helper การเขียน/แก้ไขของ sandbox

  </Step>
  <Step title="Optional: build the common image">
    สำหรับ sandbox image ที่มีความสามารถมากขึ้นพร้อมเครื่องมือทั่วไป (เช่น `curl`, `jq`, `nodejs`, `python3`, `git`):

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    จากนั้นตั้งค่า `agents.defaults.sandbox.docker.image` เป็น `openclaw-sandbox-common:bookworm-slim`

  </Step>
  <Step title="Optional: build the sandbox browser image">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

ตามค่าเริ่มต้น คอนเทนเนอร์ Docker sandbox จะรันโดย **ไม่มีเครือข่าย** เปลี่ยนได้ด้วย `agents.defaults.sandbox.docker.network`

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    sandbox browser image ที่มาพร้อมกันยังใช้ค่าเริ่มต้นการเริ่มต้น Chromium แบบอนุรักษ์นิยมสำหรับ workload ในคอนเทนเนอร์ด้วย ค่าเริ่มต้นของคอนเทนเนอร์ปัจจุบันรวมถึง:

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
    - flag เสริมความปลอดภัยด้านกราฟิกสามรายการ (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) เป็นตัวเลือก และมีประโยชน์เมื่อคอนเทนเนอร์ไม่มีการรองรับ GPU ตั้งค่า `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หาก workload ของคุณต้องใช้ WebGL หรือฟีเจอร์ 3D/browser อื่น
    - `--disable-extensions` เปิดใช้ตามค่าเริ่มต้น และปิดได้ด้วย `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` สำหรับ flow ที่พึ่งพา extension
    - `--renderer-process-limit=2` ควบคุมโดย `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` โดยที่ `0` จะคงค่าเริ่มต้นของ Chromium

    หากคุณต้องการ profile runtime ที่ต่างออกไป ให้ใช้ custom browser image และระบุ entrypoint ของคุณเอง สำหรับ profile Chromium ภายในเครื่อง (ไม่ใช่คอนเทนเนอร์) ให้ใช้ `browser.extraArgs` เพื่อ append startup flags เพิ่มเติม

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` ถูกบล็อก
    - `network: "container:<id>"` ถูกบล็อกตามค่าเริ่มต้น (ความเสี่ยงการข้ามผ่านด้วย namespace join)
    - override แบบ break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`

  </Accordion>
</AccordionGroup>

การติดตั้ง Docker และ Gateway แบบคอนเทนเนอร์อยู่ที่นี่: [Docker](/th/install/docker)

สำหรับการ deploy Docker gateway, `scripts/docker/setup.sh` สามารถ bootstrap config ของ sandbox ได้ ตั้งค่า `OPENCLAW_SANDBOX=1` (หรือ `true`/`yes`/`on`) เพื่อเปิดใช้ path นั้น คุณสามารถ override ตำแหน่ง socket ด้วย `OPENCLAW_DOCKER_SOCKET` การ setup และข้อมูลอ้างอิง env แบบเต็ม: [Docker](/th/install/docker#agent-sandbox)

## setupCommand (การ setup คอนเทนเนอร์ครั้งเดียว)

`setupCommand` รัน **ครั้งเดียว** หลังจาก sandbox container ถูกสร้าง (ไม่ใช่ทุกครั้งที่รัน) โดย execute ภายในคอนเทนเนอร์ผ่าน `sh -lc`

Paths:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Per-agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Common pitfalls">
    - ค่าเริ่มต้นของ `docker.network` คือ `"none"` (ไม่มี egress) ดังนั้นการ install package จะล้มเหลว
    - `docker.network: "container:<id>"` ต้องใช้ `dangerouslyAllowContainerNamespaceJoin: true` และมีไว้สำหรับ break-glass เท่านั้น
    - `readOnlyRoot: true` ป้องกันการเขียน; ตั้งค่า `readOnlyRoot: false` หรือ bake custom image
    - `user` ต้องเป็น root สำหรับการ install package (ละ `user` ไว้หรือตั้งค่า `user: "0:0"`)
    - Sandbox exec จะ **ไม่** inherit `process.env` ของโฮสต์ ใช้ `agents.defaults.sandbox.docker.env` (หรือ custom image) สำหรับ API key ของ skill

  </Accordion>
</AccordionGroup>

## Tool policy และ escape hatches

นโยบาย allow/deny ของเครื่องมือยังคงมีผลก่อนกฎของ sandbox หากเครื่องมือถูก deny แบบ global หรือต่อ agent การใช้ sandbox จะไม่นำเครื่องมือนั้นกลับมา

`tools.elevated` เป็น escape hatch แบบชัดเจนที่รัน `exec` นอก sandbox (`gateway` ตามค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec คือ `node`) directive `/exec` มีผลเฉพาะกับผู้ส่งที่ได้รับอนุญาตและคงอยู่ต่อ session; หากต้องการปิด `exec` อย่างเด็ดขาด ให้ใช้ tool policy deny (ดู [Sandbox กับ Tool Policy กับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated))

การดีบัก:

- ใช้ `openclaw sandbox explain` เพื่อตรวจสอบ sandbox mode ที่มีผล, tool policy และ config keys สำหรับแก้ไข
- ดู [Sandbox กับ Tool Policy กับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) สำหรับ mental model ของ “ทำไมสิ่งนี้จึงถูกบล็อก?”

ล็อกไว้ให้แน่นหนา

## Multi-agent overrides

agent แต่ละตัวสามารถ override sandbox + tools ได้: `agents.list[].sandbox` และ `agents.list[].tools` (รวมถึง `agents.list[].tools.sandbox.tools` สำหรับ sandbox tool policy) ดู [Multi-Agent Sandbox & Tools](/th/tools/multi-agent-sandbox-tools) สำหรับลำดับความสำคัญ

## ตัวอย่างการเปิดใช้แบบขั้นต่ำ

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

- [แซนด์บ็อกซ์และเครื่องมือแบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) — การแทนที่ค่าและลำดับความสำคัญต่อเอเจนต์
- [OpenShell](/th/gateway/openshell) — การตั้งค่าแบ็กเอนด์แซนด์บ็อกซ์ที่มีการจัดการ โหมดพื้นที่ทำงาน และข้อมูลอ้างอิงการกำหนดค่า
- [การกำหนดค่าแซนด์บ็อกซ์](/th/gateway/config-agents#agentsdefaultssandbox)
- [แซนด์บ็อกซ์เทียบกับนโยบายเครื่องมือเทียบกับสิทธิ์ยกระดับ](/th/gateway/sandbox-vs-tool-policy-vs-elevated) — การดีบัก "ทำไมสิ่งนี้จึงถูกบล็อก?"
- [ความปลอดภัย](/th/gateway/security)
