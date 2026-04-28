---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Sandboxing ของ OpenClaw ทำงานอย่างไร: โหมด ขอบเขต การเข้าถึง workspace และอิมเมจ'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-26T11:31:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83930d5533832f2ece5fd069c15670f8a73c5801c829ca85c249a4582d36ff29
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw สามารถรัน **tools ภายใน sandbox backend** เพื่อลด blast radius ได้ ฟีเจอร์นี้เป็น **ตัวเลือกเสริม** และควบคุมผ่าน config (`agents.defaults.sandbox` หรือ `agents.list[].sandbox`) หากปิด sandboxing ไว้ tools จะรันบนโฮสต์ Gateway จะยังคงรันบนโฮสต์; ส่วนการรันเครื่องมือจะเกิดขึ้นภายใน sandbox ที่แยกออกมาเมื่อเปิดใช้งาน

<Note>
นี่ไม่ใช่ขอบเขตความปลอดภัยที่สมบูรณ์แบบ แต่ช่วยจำกัดการเข้าถึงไฟล์ระบบและโปรเซสได้อย่างมีนัยสำคัญเมื่อโมเดลทำสิ่งที่ไม่ควรทำ
</Note>

## สิ่งที่ถูกทำ sandbox

- การรันเครื่องมือ (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` เป็นต้น)
- เบราว์เซอร์แบบ sandbox ที่เป็นตัวเลือก (`agents.defaults.sandbox.browser`)

<AccordionGroup>
  <Accordion title="รายละเอียดของเบราว์เซอร์แบบ sandbox">
    - โดยค่าเริ่มต้น เบราว์เซอร์ใน sandbox จะเริ่มทำงานอัตโนมัติ (เพื่อให้แน่ใจว่าเข้าถึง CDP ได้) เมื่อ browser tool ต้องใช้งาน กำหนดค่าได้ผ่าน `agents.defaults.sandbox.browser.autoStart` และ `agents.defaults.sandbox.browser.autoStartTimeoutMs`
    - โดยค่าเริ่มต้น คอนเทนเนอร์เบราว์เซอร์แบบ sandbox จะใช้เครือข่าย Docker เฉพาะ (`openclaw-sandbox-browser`) แทนเครือข่าย `bridge` แบบส่วนกลาง กำหนดค่าได้ด้วย `agents.defaults.sandbox.browser.network`
    - `agents.defaults.sandbox.browser.cdpSourceRange` แบบไม่บังคับใช้จำกัด CDP ingress ที่ขอบคอนเทนเนอร์ด้วย CIDR allowlist (เช่น `172.21.0.1/32`)
    - การเข้าถึง noVNC สำหรับผู้สังเกตการณ์ถูกป้องกันด้วยรหัสผ่านตามค่าเริ่มต้น OpenClaw จะปล่อย URL โทเค็นอายุสั้นที่ให้บริการหน้า bootstrap ในเครื่องและเปิด noVNC พร้อมรหัสผ่านใน URL fragment (ไม่ใช่ query/header logs)
    - `agents.defaults.sandbox.browser.allowHostControl` อนุญาตให้เซสชันใน sandbox กำหนดเป้าหมายไปยังเบราว์เซอร์ของโฮสต์โดยตรงได้
    - allowlist แบบไม่บังคับใช้ควบคุม `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`
  </Accordion>
</AccordionGroup>

สิ่งที่ไม่ถูกทำ sandbox:

- โปรเซส Gateway เอง
- เครื่องมือใด ๆ ที่ได้รับอนุญาตอย่างชัดเจนให้รันนอก sandbox (เช่น `tools.elevated`)
  - **Elevated exec จะข้าม sandboxing และใช้ escape path ที่กำหนดไว้ (`gateway` ตามค่าเริ่มต้น หรือ `node` เมื่อ exec target คือ `node`)**
  - หากปิด sandboxing ไว้ `tools.elevated` จะไม่เปลี่ยนพฤติกรรมการรัน (เพราะรันบนโฮสต์อยู่แล้ว) ดู [Elevated Mode](/th/tools/elevated)

## โหมด

`agents.defaults.sandbox.mode` ควบคุมว่า **จะใช้ sandboxing เมื่อใด**:

<Tabs>
  <Tab title="off">
    ไม่ใช้ sandboxing
  </Tab>
  <Tab title="non-main">
    ทำ sandbox เฉพาะเซสชันที่ **ไม่ใช่ main** (เป็นค่าเริ่มต้นหากคุณต้องการให้แชตปกติรันบนโฮสต์)

    `"non-main"` อิงจาก `session.mainKey` (ค่าเริ่มต้น `"main"`) ไม่ใช่ agent id เซสชันของกลุ่ม/ช่องทางจะใช้คีย์ของตัวเอง ดังนั้นจึงนับเป็น non-main และจะถูกทำ sandbox

  </Tab>
  <Tab title="all">
    ทุกเซสชันรันใน sandbox
  </Tab>
</Tabs>

## ขอบเขต

`agents.defaults.sandbox.scope` ควบคุมว่า **จะสร้างคอนเทนเนอร์กี่ตัว**:

- `"agent"` (ค่าเริ่มต้น): หนึ่งคอนเทนเนอร์ต่อหนึ่งเอเจนต์
- `"session"`: หนึ่งคอนเทนเนอร์ต่อหนึ่งเซสชัน
- `"shared"`: หนึ่งคอนเทนเนอร์ที่ใช้ร่วมกันโดยทุกเซสชันที่ถูกทำ sandbox

## แบ็กเอนด์

`agents.defaults.sandbox.backend` ควบคุมว่า **รันไทม์ใดจะให้บริการ sandbox**:

- `"docker"` (ค่าเริ่มต้นเมื่อเปิดใช้ sandboxing): รันไทม์ sandbox แบบ local ที่ใช้ Docker
- `"ssh"`: รันไทม์ sandbox ระยะไกลทั่วไปที่ใช้ SSH
- `"openshell"`: รันไทม์ sandbox ที่ใช้ OpenShell

config เฉพาะของ SSH อยู่ภายใต้ `agents.defaults.sandbox.ssh` ส่วน config เฉพาะของ OpenShell อยู่ภายใต้ `plugins.entries.openshell.config`

### การเลือกแบ็กเอนด์

|                     | Docker                           | SSH                           | OpenShell                                       |
| ------------------- | -------------------------------- | ----------------------------- | ----------------------------------------------- |
| **รันที่ไหน**      | คอนเทนเนอร์ในเครื่อง             | โฮสต์ใดก็ได้ที่เข้าถึงผ่าน SSH | sandbox ที่จัดการโดย OpenShell                  |
| **การตั้งค่า**     | `scripts/sandbox-setup.sh`       | SSH key + โฮสต์เป้าหมาย      | เปิดใช้ Plugin OpenShell                        |
| **โมเดล workspace** | bind-mount หรือคัดลอก            | remote-canonical (seed ครั้งเดียว) | `mirror` หรือ `remote`                          |
| **การควบคุมเครือข่าย** | `docker.network` (ค่าเริ่มต้น: none) | ขึ้นอยู่กับโฮสต์ระยะไกล       | ขึ้นอยู่กับ OpenShell                           |
| **เบราว์เซอร์ใน sandbox** | รองรับ                         | ไม่รองรับ                     | ยังไม่รองรับ                                     |
| **Bind mounts**     | `docker.binds`                   | N/A                           | N/A                                             |
| **เหมาะที่สุดสำหรับ** | การพัฒนาในเครื่อง, การแยกขาดเต็มรูปแบบ | ย้ายภาระไปเครื่องระยะไกล      | sandbox ระยะไกลที่จัดการได้พร้อมการซิงก์สองทางแบบไม่บังคับ |

### แบ็กเอนด์ Docker

Sandboxing ปิดไว้ตามค่าเริ่มต้น หากคุณเปิดใช้ sandboxing และไม่ได้เลือกแบ็กเอนด์ OpenClaw จะใช้แบ็กเอนด์ Docker โดยจะรัน tools และเบราว์เซอร์ใน sandbox ภายในเครื่องผ่าน Docker daemon socket (`/var/run/docker.sock`) การแยกขาดของคอนเทนเนอร์ sandbox จะถูกกำหนดโดย Docker namespaces

<Warning>
**ข้อจำกัดของ Docker-out-of-Docker (DooD)**

หากคุณ deploy OpenClaw Gateway เองเป็นคอนเทนเนอร์ Docker มันจะควบคุมคอนเทนเนอร์ sandbox ข้างเคียงโดยใช้ Docker socket ของโฮสต์ (DooD) สิ่งนี้ทำให้เกิดข้อจำกัดเรื่องการแมปพาธโดยเฉพาะ:

- **Config ต้องใช้พาธของโฮสต์**: ค่า `workspace` ใน `openclaw.json` ต้องเป็น **absolute path ของโฮสต์** (เช่น `/home/user/.openclaw/workspaces`) ไม่ใช่พาธภายในคอนเทนเนอร์ Gateway เมื่อ OpenClaw ขอให้ Docker daemon สร้าง sandbox daemon จะประเมินพาธโดยอิงจาก namespace ของ Host OS ไม่ใช่ namespace ของ Gateway
- **FS bridge parity (แมป volume เหมือนกันทุกประการ)**: โปรเซส OpenClaw Gateway แบบเนทีฟจะเขียนไฟล์ heartbeat และ bridge ลงในไดเรกทอรี `workspace` เช่นกัน เนื่องจาก Gateway ประเมินสตริงเดียวกันทุกประการ (พาธของโฮสต์) จากภายในสภาพแวดล้อมคอนเทนเนอร์ของมันเอง การ deploy ของ Gateway จึงต้องมี volume map ที่เหมือนกันทุกประการซึ่งลิงก์ namespace ของโฮสต์แบบเนทีฟ (`-v /home/user/.openclaw:/home/user/.openclaw`)

หากคุณแมปพาธไว้ภายในโดยไม่มี parity ของ absolute host อย่างครบถ้วน OpenClaw จะโยนข้อผิดพลาดสิทธิ์ `EACCES` แบบเนทีฟเมื่อพยายามเขียน heartbeat ภายในสภาพแวดล้อมคอนเทนเนอร์ เพราะสตริงพาธแบบ fully qualified นั้นไม่มีอยู่จริงในระดับเนทีฟ
</Warning>

### แบ็กเอนด์ SSH

ใช้ `backend: "ssh"` เมื่อคุณต้องการให้ OpenClaw ทำ sandbox `exec`, file tools และการอ่านสื่อบนเครื่องใดก็ได้ที่เข้าถึงผ่าน SSH ได้

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
          // หรือใช้ SecretRefs / เนื้อหาแบบ inline แทนไฟล์ในเครื่อง:
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
    - OpenClaw จะสร้าง remote root ตามขอบเขตภายใต้ `sandbox.ssh.workspaceRoot`
    - ในการใช้งานครั้งแรกหลังจากสร้างหรือสร้างใหม่ OpenClaw จะ seed workspace ระยะไกลจาก workspace ในเครื่องหนึ่งครั้ง
    - หลังจากนั้น `exec`, `read`, `write`, `edit`, `apply_patch`, การอ่านสื่อของ prompt และการ staging สื่อขาเข้า จะทำงานโดยตรงกับ workspace ระยะไกลผ่าน SSH
    - OpenClaw จะไม่ซิงก์การเปลี่ยนแปลงจากระยะไกลกลับมายัง workspace ในเครื่องโดยอัตโนมัติ
  </Accordion>
  <Accordion title="ข้อมูลยืนยันตัวตน">
    - `identityFile`, `certificateFile`, `knownHostsFile`: ใช้ไฟล์ในเครื่องที่มีอยู่และส่งผ่านเข้าไปในการกำหนดค่า OpenSSH
    - `identityData`, `certificateData`, `knownHostsData`: ใช้สตริงแบบ inline หรือ SecretRefs OpenClaw จะ resolve ผ่าน snapshot ของ secrets runtime ตามปกติ เขียนลงไฟล์ชั่วคราวด้วยสิทธิ์ `0600` และลบออกเมื่อเซสชัน SSH สิ้นสุด
    - หากมีการตั้งทั้ง `*File` และ `*Data` สำหรับรายการเดียวกัน `*Data` จะมีสิทธิ์เหนือกว่าสำหรับเซสชัน SSH นั้น
  </Accordion>
  <Accordion title="ผลตามมาของโมเดล remote-canonical">
    นี่คือโมเดลแบบ **remote-canonical** workspace ระยะไกลผ่าน SSH จะกลายเป็นสถานะ sandbox จริงหลังจากขั้นตอน seed ครั้งแรก

    - การแก้ไขบนโฮสต์ในเครื่องที่ทำภายนอก OpenClaw หลังขั้นตอน seed จะไม่ปรากฏบนปลายทางระยะไกลจนกว่าคุณจะสร้าง sandbox ใหม่
    - `openclaw sandbox recreate` จะลบ remote root ตามขอบเขตและ seed ใหม่จากในเครื่องในการใช้งานครั้งถัดไป
    - ยังไม่รองรับ browser sandboxing บนแบ็กเอนด์ SSH
    - การตั้งค่า `sandbox.docker.*` ไม่มีผลกับแบ็กเอนด์ SSH

  </Accordion>
</AccordionGroup>

### แบ็กเอนด์ OpenShell

ใช้ `backend: "openshell"` เมื่อคุณต้องการให้ OpenClaw ทำ sandbox เครื่องมือในสภาพแวดล้อมระยะไกลที่จัดการโดย OpenShell สำหรับคู่มือการตั้งค่าแบบเต็ม เอกสารอ้างอิงการกำหนดค่า และการเปรียบเทียบโหมด workspace ดูได้ที่ [หน้า OpenShell](/th/gateway/openshell)

OpenShell ใช้ SSH transport หลักและ remote filesystem bridge แบบเดียวกับแบ็กเอนด์ SSH ทั่วไป และเพิ่มวงจรชีวิตเฉพาะของ OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) พร้อมโหมด workspace `mirror` แบบไม่บังคับ

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

- `mirror` (ค่าเริ่มต้น): workspace ในเครื่องยังคงเป็น canonical OpenClaw จะซิงก์ไฟล์ในเครื่องเข้า OpenShell ก่อน exec และซิงก์ workspace ระยะไกลกลับมาหลัง exec
- `remote`: workspace ของ OpenShell เป็น canonical หลังจากสร้าง sandbox แล้ว OpenClaw จะ seed workspace ระยะไกลจาก workspace ในเครื่องหนึ่งครั้ง จากนั้น file tools และ exec จะทำงานโดยตรงกับ sandbox ระยะไกลโดยไม่ซิงก์การเปลี่ยนแปลงกลับ

<AccordionGroup>
  <Accordion title="รายละเอียดของ transport ระยะไกล">
    - OpenClaw ขอ SSH config เฉพาะ sandbox จาก OpenShell ผ่าน `openshell sandbox ssh-config <name>`
    - คอร์จะเขียน SSH config นั้นลงไฟล์ชั่วคราว เปิดเซสชัน SSH และใช้ remote filesystem bridge เดียวกับ `backend: "ssh"`
    - ในโหมด `mirror` เท่านั้นที่วงจรชีวิตต่างออกไป: ซิงก์จากในเครื่องไปยังระยะไกลก่อน exec แล้วซิงก์กลับหลัง exec
  </Accordion>
  <Accordion title="ข้อจำกัดปัจจุบันของ OpenShell">
    - ยังไม่รองรับ sandbox browser
    - ยังไม่รองรับ `sandbox.docker.binds` บนแบ็กเอนด์ OpenShell
    - ตัวเลือก runtime เฉพาะ Docker ภายใต้ `sandbox.docker.*` ยังคงใช้ได้เฉพาะกับแบ็กเอนด์ Docker
  </Accordion>
</AccordionGroup>

#### โหมด workspace

OpenShell มีโมเดล workspace อยู่สองแบบ นี่คือส่วนที่สำคัญที่สุดในทางปฏิบัติ

<Tabs>
  <Tab title="mirror (local canonical)">
    ใช้ `plugins.entries.openshell.config.mode: "mirror"` เมื่อคุณต้องการให้ **workspace ในเครื่องยังคงเป็น canonical**

    พฤติกรรม:

    - ก่อน `exec`, OpenClaw จะซิงก์ workspace ในเครื่องเข้าไปยัง sandbox ของ OpenShell
    - หลัง `exec`, OpenClaw จะซิงก์ workspace ระยะไกลกลับมายัง workspace ในเครื่อง
    - File tools ยังคงทำงานผ่าน sandbox bridge แต่ workspace ในเครื่องยังคงเป็นแหล่งข้อมูลจริงระหว่างแต่ละเทิร์น

    ใช้สิ่งนี้เมื่อ:

    - คุณแก้ไขไฟล์ในเครื่องนอก OpenClaw และต้องการให้การเปลี่ยนแปลงเหล่านั้นปรากฏใน sandbox โดยอัตโนมัติ
    - คุณต้องการให้ sandbox ของ OpenShell มีพฤติกรรมใกล้เคียงกับแบ็กเอนด์ Docker มากที่สุด
    - คุณต้องการให้ workspace บนโฮสต์สะท้อนการเขียนของ sandbox หลังจบแต่ละ exec turn

    ข้อแลกเปลี่ยน: มีต้นทุนการซิงก์เพิ่มก่อนและหลัง exec

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    ใช้ `plugins.entries.openshell.config.mode: "remote"` เมื่อคุณต้องการให้ **workspace ของ OpenShell กลายเป็น canonical**

    พฤติกรรม:

    - เมื่อ sandbox ถูกสร้างครั้งแรก OpenClaw จะ seed workspace ระยะไกลจาก workspace ในเครื่องหนึ่งครั้ง
    - หลังจากนั้น `exec`, `read`, `write`, `edit` และ `apply_patch` จะทำงานโดยตรงกับ workspace ระยะไกลของ OpenShell
    - OpenClaw จะ **ไม่** ซิงก์การเปลี่ยนแปลงจากระยะไกลกลับมายัง workspace ในเครื่องหลัง exec
    - การอ่านสื่อในช่วงเวลาของ prompt ยังคงทำงานได้ เพราะ file tools และ media tools อ่านผ่าน sandbox bridge แทนการสมมติว่ามีพาธโฮสต์ในเครื่อง
    - Transport คือ SSH เข้าไปยัง sandbox ของ OpenShell ที่คืนมาจาก `openshell sandbox ssh-config`

    ผลตามมาที่สำคัญ:

    - หากคุณแก้ไขไฟล์บนโฮสต์นอก OpenClaw หลังขั้นตอน seed, sandbox ระยะไกลจะ **ไม่** เห็นการเปลี่ยนแปลงเหล่านั้นโดยอัตโนมัติ
    - หาก sandbox ถูกสร้างใหม่ workspace ระยะไกลจะถูก seed ใหม่จาก workspace ในเครื่องอีกครั้ง
    - เมื่อใช้ `scope: "agent"` หรือ `scope: "shared"` workspace ระยะไกลนั้นจะถูกแชร์ในขอบเขตเดียวกันนั้น

    ใช้สิ่งนี้เมื่อ:

    - sandbox ควรอยู่ฝั่ง OpenShell ระยะไกลเป็นหลัก
    - คุณต้องการ overhead จากการซิงก์ต่อเทิร์นที่ต่ำกว่า
    - คุณไม่ต้องการให้การแก้ไขบนโฮสต์ในเครื่องเขียนทับสถานะของ sandbox ระยะไกลแบบเงียบ ๆ

  </Tab>
</Tabs>

เลือก `mirror` หากคุณมองว่า sandbox เป็นสภาพแวดล้อมสำหรับการรันชั่วคราว เลือก `remote` หากคุณมองว่า sandbox คือ workspace จริง

#### วงจรชีวิตของ OpenShell

sandbox ของ OpenShell ยังคงถูกจัดการผ่านวงจรชีวิตของ sandbox ตามปกติ:

- `openclaw sandbox list` จะแสดงทั้ง runtime ของ OpenShell และ Docker
- `openclaw sandbox recreate` จะลบ runtime ปัจจุบันและปล่อยให้ OpenClaw สร้างใหม่ในการใช้งานครั้งถัดไป
- logic การ prune ก็รับรู้แบ็กเอนด์เช่นกัน

สำหรับโหมด `remote`, การ recreate สำคัญเป็นพิเศษ:

- การ recreate จะลบ workspace ระยะไกลที่เป็น canonical สำหรับขอบเขตนั้น
- การใช้งานครั้งถัดไปจะ seed workspace ระยะไกลใหม่จาก workspace ในเครื่อง

สำหรับโหมด `mirror`, การ recreate มีผลหลักคือรีเซ็ตสภาพแวดล้อมการรันระยะไกล เพราะ workspace ในเครื่องยังคงเป็น canonical อยู่แล้ว

## การเข้าถึง workspace

`agents.defaults.sandbox.workspaceAccess` ควบคุมว่า **sandbox มองเห็นอะไรได้บ้าง**:

<Tabs>
  <Tab title="none (default)">
    Tools จะเห็น workspace ของ sandbox ภายใต้ `~/.openclaw/sandboxes`
  </Tab>
  <Tab title="ro">
    เมานต์ workspace ของเอเจนต์แบบอ่านอย่างเดียวที่ `/agent` (ปิดการใช้งาน `write`/`edit`/`apply_patch`)
  </Tab>
  <Tab title="rw">
    เมานต์ workspace ของเอเจนต์แบบอ่าน/เขียนที่ `/workspace`
  </Tab>
</Tabs>

เมื่อใช้แบ็กเอนด์ OpenShell:

- โหมด `mirror` ยังคงใช้ workspace ในเครื่องเป็นแหล่ง canonical ระหว่าง exec turns
- โหมด `remote` ใช้ workspace ระยะไกลของ OpenShell เป็นแหล่ง canonical หลังจาก seed ครั้งแรก
- `workspaceAccess: "ro"` และ `"none"` ยังคงจำกัดพฤติกรรมการเขียนในลักษณะเดียวกัน

สื่อขาเข้าจะถูกคัดลอกเข้าไปยัง workspace ของ sandbox ที่กำลังใช้งานอยู่ (`media/inbound/*`)

<Note>
**หมายเหตุเกี่ยวกับ Skills:** เครื่องมือ `read` จะยึดกับรากของ sandbox เมื่อใช้ `workspaceAccess: "none"` OpenClaw จะ mirror Skills ที่เข้าเกณฑ์เข้าไปใน workspace ของ sandbox (`.../skills`) เพื่อให้อ่านได้ เมื่อใช้ `"rw"` Skills ของ workspace จะอ่านได้จาก `/workspace/skills`
</Note>

## Custom bind mounts

`agents.defaults.sandbox.docker.binds` จะเมานต์ไดเรกทอรีโฮสต์เพิ่มเติมเข้าไปในคอนเทนเนอร์ รูปแบบคือ `host:container:mode` (เช่น `"/home/user/source:/source:rw"`)

binds แบบส่วนกลางและรายเอเจนต์จะถูก **รวมกัน** (ไม่ใช่แทนที่กัน) ภายใต้ `scope: "shared"` binds รายเอเจนต์จะถูกละเลย

`agents.defaults.sandbox.browser.binds` จะเมานต์ไดเรกทอรีโฮสต์เพิ่มเติมเข้าไปในคอนเทนเนอร์ **sandbox browser** เท่านั้น

- เมื่อมีการตั้งค่าไว้ (รวมถึง `[]`) มันจะใช้แทน `agents.defaults.sandbox.docker.binds` สำหรับคอนเทนเนอร์เบราว์เซอร์
- เมื่อไม่ได้ตั้งค่า คอนเทนเนอร์เบราว์เซอร์จะ fallback ไปใช้ `agents.defaults.sandbox.docker.binds` (เข้ากันได้กับเวอร์ชันก่อนหน้า)

ตัวอย่าง (source แบบอ่านอย่างเดียว + ไดเรกทอรีข้อมูลเพิ่มอีกหนึ่งรายการ):

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

- binds จะข้าม filesystem ของ sandbox: มันเปิดเผยพาธของโฮสต์ด้วยโหมดที่คุณตั้งไว้ (`:ro` หรือ `:rw`)
- OpenClaw จะบล็อกแหล่ง bind ที่อันตราย (เช่น `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` และ parent mount ที่จะเปิดเผยสิ่งเหล่านี้)
- OpenClaw ยังบล็อกรากข้อมูลรับรองทั่วไปใน home directory เช่น `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` และ `~/.ssh`
- การตรวจสอบ bind ไม่ได้อาศัยแค่การจับคู่สตริง OpenClaw จะ normalize พาธต้นทาง จากนั้น resolve อีกครั้งผ่าน ancestor ที่ลึกที่สุดซึ่งมีอยู่จริง ก่อนตรวจสอบซ้ำกับพาธที่ถูกบล็อกและรากที่อนุญาต
- นั่นหมายความว่าการ escape ผ่าน symlink-parent ก็ยัง fail closed แม้ leaf สุดท้ายจะยังไม่มีอยู่จริง ตัวอย่าง: `/workspace/run-link/new-file` จะยัง resolve เป็น `/var/run/...` หาก `run-link` ชี้ไปที่นั่น
- รากต้นทางที่อนุญาตก็ถูก canonicalize ด้วยวิธีเดียวกัน ดังนั้นพาธที่ดูเหมือนอยู่ใน allowlist ก่อน resolve symlink ก็ยังจะถูกปฏิเสธเป็น `outside allowed roots`
- mount ที่อ่อนไหว (secrets, SSH keys, service credentials) ควรใช้ `:ro` เว้นแต่จำเป็นจริง ๆ
- ใช้ร่วมกับ `workspaceAccess: "ro"` หากคุณต้องการเพียงการอ่าน workspace; โหมด bind ยังคงแยกเป็นอิสระ
- ดู [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) เพื่อเข้าใจว่า binds ทำงานร่วมกับ tool policy และ elevated exec อย่างไร
</Warning>

## อิมเมจและการตั้งค่า

อิมเมจ Docker ค่าเริ่มต้น: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="สร้างอิมเมจค่าเริ่มต้น">
    ```bash
    scripts/sandbox-setup.sh
    ```

    อิมเมจค่าเริ่มต้น **ไม่ได้** มาพร้อม Node หาก Skill ต้องใช้ Node (หรือ runtime อื่น ๆ) ให้สร้างอิมเมจแบบกำหนดเองหรือทำการติดตั้งผ่าน `sandbox.docker.setupCommand` (ต้องมี network egress + root ที่เขียนได้ + ผู้ใช้ root)

  </Step>
  <Step title="ไม่บังคับ: สร้างอิมเมจ common">
    สำหรับอิมเมจ sandbox ที่ใช้งานได้ครบมากขึ้นพร้อมเครื่องมือทั่วไป (เช่น `curl`, `jq`, `nodejs`, `python3`, `git`):

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    จากนั้นตั้ง `agents.defaults.sandbox.docker.image` เป็น `openclaw-sandbox-common:bookworm-slim`

  </Step>
  <Step title="ไม่บังคับ: สร้างอิมเมจ sandbox browser">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

ตามค่าเริ่มต้น คอนเทนเนอร์ Docker sandbox จะรันแบบ **ไม่มีเครือข่าย** ใช้ `agents.defaults.sandbox.docker.network` เพื่อแทนที่

<AccordionGroup>
  <Accordion title="ค่าเริ่มต้นของ Chromium สำหรับ sandbox browser">
    อิมเมจ sandbox browser ที่รวมมาให้ยังใช้ค่าเริ่มต้นการเริ่มต้น Chromium แบบอนุรักษ์นิยมสำหรับงานแบบคอนเทนเนอร์ ปัจจุบันค่าเริ่มต้นของคอนเทนเนอร์ประกอบด้วย:

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
    - แฟล็ก hardening ด้านกราฟิกทั้งสาม (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) เป็นตัวเลือกเสริมและมีประโยชน์เมื่อคอนเทนเนอร์ไม่มีการรองรับ GPU ตั้งค่า `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากงานของคุณต้องใช้ WebGL หรือฟีเจอร์ 3D/เบราว์เซอร์อื่น ๆ
    - `--disable-extensions` เปิดใช้ตามค่าเริ่มต้น และสามารถปิดได้ด้วย `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` สำหรับ flow ที่พึ่งพา extension
    - `--renderer-process-limit=2` ควบคุมโดย `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` โดย `0` จะคงค่าเริ่มต้นของ Chromium ไว้

    หากคุณต้องการโปรไฟล์รันไทม์ที่ต่างออกไป ให้ใช้อิมเมจเบราว์เซอร์แบบกำหนดเองและกำหนด entrypoint ของคุณเอง สำหรับโปรไฟล์ Chromium ในเครื่อง (ไม่ใช่คอนเทนเนอร์) ให้ใช้ `browser.extraArgs` เพื่อเพิ่มแฟล็กเริ่มต้นเพิ่มเติม

  </Accordion>
  <Accordion title="ค่าเริ่มต้นด้านความปลอดภัยของเครือข่าย">
    - `network: "host"` ถูกบล็อก
    - `network: "container:<id>"` ถูกบล็อกตามค่าเริ่มต้น (มีความเสี่ยงจากการ bypass ผ่าน namespace join)
    - การแทนที่แบบ break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`
  </Accordion>
</AccordionGroup>

การติดตั้ง Docker และ gateway แบบคอนเทนเนอร์อยู่ที่นี่: [Docker](/th/install/docker)

สำหรับการ deploy gateway แบบ Docker, `scripts/docker/setup.sh` สามารถ bootstrap config ของ sandbox ได้ ตั้งค่า `OPENCLAW_SANDBOX=1` (หรือ `true`/`yes`/`on`) เพื่อเปิดเส้นทางนี้ คุณสามารถแทนที่ตำแหน่ง socket ได้ด้วย `OPENCLAW_DOCKER_SOCKET` ดูการตั้งค่าแบบเต็มและเอกสารอ้างอิง env ได้ที่: [Docker](/th/install/docker#agent-sandbox)

## setupCommand (การตั้งค่าคอนเทนเนอร์แบบครั้งเดียว)

`setupCommand` จะรัน **หนึ่งครั้ง** หลังจากสร้างคอนเทนเนอร์ sandbox แล้ว (ไม่ใช่ทุกครั้งที่รัน) โดยจะทำงานภายในคอนเทนเนอร์ผ่าน `sh -lc`

พาธ:

- แบบส่วนกลาง: `agents.defaults.sandbox.docker.setupCommand`
- รายเอเจนต์: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="ข้อผิดพลาดที่พบบ่อย">
    - ค่าเริ่มต้นของ `docker.network` คือ `"none"` (ไม่มี egress) ดังนั้นการติดตั้งแพ็กเกจจะล้มเหลว
    - `docker.network: "container:<id>"` ต้องใช้ `dangerouslyAllowContainerNamespaceJoin: true` และเป็นแบบ break-glass เท่านั้น
    - `readOnlyRoot: true` ป้องกันการเขียน; ให้ตั้ง `readOnlyRoot: false` หรือสร้างอิมเมจแบบกำหนดเอง
    - `user` ต้องเป็น root สำหรับการติดตั้งแพ็กเกจ (ละ `user` หรือกำหนด `user: "0:0"`)
    - sandbox exec จะ **ไม่** สืบทอด `process.env` ของโฮสต์ ใช้ `agents.defaults.sandbox.docker.env` (หรืออิมเมจแบบกำหนดเอง) สำหรับ API key ของ Skill
  </Accordion>
</AccordionGroup>

## Tool policy และช่องทางหลบออก

นโยบาย allow/deny ของ tool ยังคงถูกใช้ก่อนกฎของ sandbox หาก tool ถูกปฏิเสธในระดับส่วนกลางหรือรายเอเจนต์ sandboxing จะไม่ทำให้มันกลับมาใช้ได้

`tools.elevated` คือช่องทางหลบออกแบบ explicit ที่รัน `exec` นอก sandbox (`gateway` ตามค่าเริ่มต้น หรือ `node` เมื่อ exec target คือ `node`) คำสั่ง `/exec` ใช้ได้เฉพาะกับผู้ส่งที่ได้รับอนุญาตและจะคงอยู่ต่อเซสชัน; หากต้องการปิด `exec` แบบเด็ดขาด ให้ใช้ tool policy deny (ดู [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated))

การดีบัก:

- ใช้ `openclaw sandbox explain` เพื่อตรวจสอบ sandbox mode ที่มีผลจริง, tool policy และคีย์ config สำหรับการแก้ไข
- ดู [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) สำหรับกรอบความคิดแบบ "ทำไมสิ่งนี้จึงถูกบล็อก?"

ล็อกมันไว้ให้แน่นหนา

## การแทนที่สำหรับหลายเอเจนต์

แต่ละเอเจนต์สามารถแทนที่ sandbox + tools ได้: `agents.list[].sandbox` และ `agents.list[].tools` (รวมถึง `agents.list[].tools.sandbox.tools` สำหรับนโยบายเครื่องมือของ sandbox) ดู [Multi-Agent Sandbox & Tools](/th/tools/multi-agent-sandbox-tools) สำหรับลำดับความสำคัญ

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

- [Multi-Agent Sandbox & Tools](/th/tools/multi-agent-sandbox-tools) — การแทนที่รายเอเจนต์และลำดับความสำคัญ
- [OpenShell](/th/gateway/openshell) — การตั้งค่าแบ็กเอนด์ sandbox แบบจัดการได้ โหมด workspace และเอกสารอ้างอิงการกำหนดค่า
- [การกำหนดค่า Sandbox](/th/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) — การดีบัก "ทำไมสิ่งนี้จึงถูกบล็อก?"
- [ความปลอดภัย](/th/gateway/security)
