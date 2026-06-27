---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'การทำงานของ sandboxing ใน OpenClaw: โหมด ขอบเขต การเข้าถึง workspace และรูปภาพ'
title: การแซนด์บ็อกซ์
x-i18n:
    generated_at: "2026-06-27T17:37:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c9754fbfc71ee5fb48df72eece8ba3b155ce5e0d9c55aae75ce21801dceb07d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw สามารถเรียกใช้ **เครื่องมือภายในแบ็กเอนด์ sandbox** เพื่อลดขอบเขตผลกระทบได้ สิ่งนี้เป็น **ทางเลือก** และควบคุมด้วยการกำหนดค่า (`agents.defaults.sandbox` หรือ `agents.list[].sandbox`) หากปิด sandboxing เครื่องมือจะทำงานบนโฮสต์ Gateway ยังคงอยู่บนโฮสต์ ส่วนการเรียกใช้เครื่องมือจะทำงานใน sandbox ที่แยกออกมาเมื่อเปิดใช้งาน

<Note>
นี่ไม่ใช่ขอบเขตความปลอดภัยที่สมบูรณ์แบบ แต่ช่วยจำกัดการเข้าถึงระบบไฟล์และโปรเซสได้อย่างมีนัยสำคัญเมื่อโมเดลทำสิ่งที่ไม่เหมาะสม
</Note>

## สิ่งที่ถูก sandbox

- การเรียกใช้เครื่องมือ (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` ฯลฯ)
- เบราว์เซอร์แบบ sandbox ที่เป็นทางเลือก (`agents.defaults.sandbox.browser`)

<AccordionGroup>
  <Accordion title="รายละเอียดเบราว์เซอร์แบบ sandbox">
    - โดยค่าเริ่มต้น เบราว์เซอร์ sandbox จะเริ่มอัตโนมัติ (ทำให้แน่ใจว่า CDP เข้าถึงได้) เมื่อเครื่องมือเบราว์เซอร์ต้องใช้ กำหนดค่าผ่าน `agents.defaults.sandbox.browser.autoStart` และ `agents.defaults.sandbox.browser.autoStartTimeoutMs`
    - โดยค่าเริ่มต้น คอนเทนเนอร์เบราว์เซอร์ sandbox ใช้เครือข่าย Docker เฉพาะ (`openclaw-sandbox-browser`) แทนเครือข่าย `bridge` ส่วนกลาง กำหนดค่าด้วย `agents.defaults.sandbox.browser.network`
    - `agents.defaults.sandbox.browser.cdpSourceRange` ที่เป็นทางเลือกจะจำกัด CDP ingress ที่ขอบคอนเทนเนอร์ด้วยรายการอนุญาต CIDR (เช่น `172.21.0.1/32`)
    - การเข้าถึงผู้สังเกตการณ์ noVNC มีการป้องกันด้วยรหัสผ่านโดยค่าเริ่มต้น OpenClaw จะส่ง URL โทเค็นอายุสั้นที่ให้บริการหน้า bootstrap แบบ local และเปิด noVNC พร้อมรหัสผ่านใน URL fragment (ไม่ใช่ใน query/header logs)
    - `agents.defaults.sandbox.browser.allowHostControl` ทำให้เซสชันที่ถูก sandbox สามารถกำหนดเป้าหมายเบราว์เซอร์ของโฮสต์ได้อย่างชัดเจน
    - รายการอนุญาตที่เป็นทางเลือกจะกั้น `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`

  </Accordion>
</AccordionGroup>

ไม่ถูก sandbox:

- โปรเซส Gateway เอง
- เครื่องมือใดๆ ที่อนุญาตอย่างชัดเจนให้ทำงานนอก sandbox (เช่น `tools.elevated`)
  - **Elevated exec ข้าม sandboxing และใช้เส้นทาง escape ที่กำหนดค่าไว้ (`gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec คือ `node`)**
  - หากปิด sandboxing อยู่ `tools.elevated` จะไม่เปลี่ยนการทำงาน (อยู่บนโฮสต์อยู่แล้ว) ดู [โหมด Elevated](/th/tools/elevated)

## โหมด

`agents.defaults.sandbox.mode` ควบคุมว่าจะใช้ sandboxing **เมื่อใด**:

<Tabs>
  <Tab title="off">
    ไม่มี sandboxing
  </Tab>
  <Tab title="non-main">
    sandbox เฉพาะเซสชันที่ **ไม่ใช่ main** (ค่าเริ่มต้นหากคุณต้องการให้แชตปกติอยู่บนโฮสต์)

    `"non-main"` อิงตาม `session.mainKey` (ค่าเริ่มต้น `"main"`) ไม่ใช่ agent id เซสชันกลุ่ม/ช่องทางใช้คีย์ของตัวเอง ดังนั้นจึงนับเป็น non-main และจะถูก sandbox

  </Tab>
  <Tab title="all">
    ทุกเซสชันทำงานใน sandbox
  </Tab>
</Tabs>

## ขอบเขต

`agents.defaults.sandbox.scope` ควบคุมว่าจะสร้าง **คอนเทนเนอร์กี่ตัว**:

- `"agent"` (ค่าเริ่มต้น): หนึ่งคอนเทนเนอร์ต่อ agent
- `"session"`: หนึ่งคอนเทนเนอร์ต่อเซสชัน
- `"shared"`: หนึ่งคอนเทนเนอร์ที่ใช้ร่วมกันโดยทุกเซสชันที่ถูก sandbox

## แบ็กเอนด์

`agents.defaults.sandbox.backend` ควบคุมว่า **runtime ใด** ให้บริการ sandbox:

- `"docker"` (ค่าเริ่มต้นเมื่อเปิดใช้ sandboxing): runtime sandbox ภายในเครื่องที่ใช้ Docker
- `"ssh"`: runtime sandbox ระยะไกลทั่วไปที่ใช้ SSH
- `"openshell"`: runtime sandbox ที่ใช้ OpenShell

การกำหนดค่าเฉพาะ SSH อยู่ภายใต้ `agents.defaults.sandbox.ssh` การกำหนดค่าเฉพาะ OpenShell อยู่ภายใต้ `plugins.entries.openshell.config`

### การเลือกแบ็กเอนด์

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **ตำแหน่งที่ทำงาน** | คอนเทนเนอร์ภายในเครื่อง          | โฮสต์ใดก็ได้ที่เข้าถึงได้ด้วย SSH | sandbox ที่จัดการโดย OpenShell                      |
| **การตั้งค่า**      | `scripts/sandbox-setup.sh`       | คีย์ SSH + โฮสต์เป้าหมาย       | เปิดใช้งาน Plugin OpenShell                         |
| **โมเดล workspace** | Bind-mount หรือคัดลอก            | remote-canonical (seed หนึ่งครั้ง) | `mirror` หรือ `remote`                              |
| **การควบคุมเครือข่าย** | `docker.network` (ค่าเริ่มต้น: none) | ขึ้นอยู่กับโฮสต์ระยะไกล        | ขึ้นอยู่กับ OpenShell                               |
| **เบราว์เซอร์ sandbox** | รองรับ                         | ไม่รองรับ                      | ยังไม่รองรับ                                        |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **เหมาะที่สุดสำหรับ** | การพัฒนา local, การแยกเต็มรูปแบบ | ถ่ายโอนไปยังเครื่องระยะไกล     | sandbox ระยะไกลที่มีการจัดการพร้อมการซิงก์สองทางแบบเลือกได้ |

### แบ็กเอนด์ Docker

sandboxing ปิดอยู่โดยค่าเริ่มต้น หากคุณเปิดใช้งาน sandboxing และไม่ได้เลือกแบ็กเอนด์ OpenClaw จะใช้แบ็กเอนด์ Docker ซึ่งเรียกใช้เครื่องมือและเบราว์เซอร์ sandbox ภายในเครื่องผ่าน Docker daemon socket (`/var/run/docker.sock`) การแยกคอนเทนเนอร์ sandbox กำหนดโดย Docker namespaces

หากต้องการเปิดเผย GPU ของโฮสต์ให้ sandbox Docker ให้ตั้งค่า `agents.defaults.sandbox.docker.gpus` หรือ override ราย agent ที่ `agents.list[].sandbox.docker.gpus` ค่าจะถูกส่งให้แฟล็ก `--gpus` ของ Docker เป็นอาร์กิวเมนต์แยก เช่น `"all"` หรือ `"device=GPU-uuid"` และต้องใช้ runtime ของโฮสต์ที่เข้ากันได้ เช่น NVIDIA Container Toolkit

<Warning>
**ข้อจำกัด Docker-out-of-Docker (DooD)**

หากคุณ deploy OpenClaw Gateway เองเป็นคอนเทนเนอร์ Docker มันจะจัดการคอนเทนเนอร์ sandbox พี่น้องโดยใช้ Docker socket ของโฮสต์ สิ่งนี้ทำให้เกิดข้อจำกัดการแมปเส้นทางเฉพาะ:

- **การกำหนดค่าต้องใช้เส้นทางของโฮสต์**: การกำหนดค่า `workspace` ใน `openclaw.json` ต้องมี **เส้นทางสัมบูรณ์ของโฮสต์** (เช่น `/home/user/.openclaw/workspaces`) ไม่ใช่เส้นทางภายในคอนเทนเนอร์ Gateway เมื่อ OpenClaw ขอให้ Docker daemon สร้าง sandbox daemon จะประเมินเส้นทางโดยอิงกับ namespace ของ Host OS ไม่ใช่ namespace ของ Gateway
- **ความเท่าเทียมของ FS bridge (แมป volume เหมือนกัน)**: โปรเซส native ของ OpenClaw Gateway ยังเขียนไฟล์ heartbeat และ bridge ไปยังไดเรกทอรี `workspace` ด้วย เนื่องจาก Gateway ประเมินสตริงเดียวกันทุกประการ (เส้นทางของโฮสต์) จากภายในสภาพแวดล้อมคอนเทนเนอร์ของตนเอง การ deploy Gateway ต้องมีแมป volume ที่เหมือนกันซึ่งเชื่อม namespace ของโฮสต์แบบ native (`-v /home/user/.openclaw:/home/user/.openclaw`)
- **โหมดโค้ด Codex**: เมื่อ OpenClaw sandbox ทำงานอยู่ OpenClaw จะปิดใช้งาน Code Mode แบบ native ของ Codex app-server, เซิร์ฟเวอร์ MCP ของผู้ใช้ และการเรียกใช้ Plugin ที่ app รองรับสำหรับ turn นั้น เพราะพื้นผิว native เหล่านั้นทำงานจากโปรเซส Gateway-host app-server แทนแบ็กเอนด์ OpenClaw sandbox การเข้าถึง shell ถูกเปิดเผยผ่านเครื่องมือที่รองรับ OpenClaw sandbox เช่น `sandbox_exec` และ `sandbox_process` เมื่อมีเครื่องมือ exec/process ปกติ อย่า mount Docker socket ของโฮสต์เข้าไปในคอนเทนเนอร์ sandbox ของ agent หรือ sandbox Codex แบบกำหนดเอง

บนโฮสต์ Ubuntu/AppArmor Codex `workspace-write` อาจล้มเหลวก่อน shell startup
เมื่อคุณตั้งใจเรียกใช้ Codex `workspace-write` แบบ native โดยไม่มี
OpenClaw sandboxing ที่ทำงานอยู่ และ service user ไม่ได้รับอนุญาตให้สร้าง
user namespaces แบบ unprivileged เมื่อปิดใช้งาน egress ของ Docker sandbox (`network: "none"` ซึ่งเป็น
ค่าเริ่มต้น) Codex ยังต้องใช้ network namespace แบบ unprivileged ด้วย อาการที่พบบ่อยคือ
`bwrap: setting up uid map: Permission denied` และ
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` เรียกใช้
`openclaw doctor`; หากรายงานความล้มเหลวของ Codex bwrap namespace probe ให้เลือกใช้
โปรไฟล์ AppArmor ที่ให้ namespace ที่จำเป็นแก่โปรเซสบริการ OpenClaw
`kernel.apparmor_restrict_unprivileged_userns=0` เป็น fallback ระดับทั้งโฮสต์
พร้อมข้อแลกเปลี่ยนด้านความปลอดภัย ใช้เฉพาะเมื่อท่าทีด้านความปลอดภัยของโฮสต์นั้น
ยอมรับได้

หากคุณแมปเส้นทางภายในโดยไม่มีความเท่าเทียมกับเส้นทางสัมบูรณ์ของโฮสต์ OpenClaw จะโยนข้อผิดพลาดสิทธิ์ `EACCES` แบบ native ขณะพยายามเขียน heartbeat ภายในสภาพแวดล้อมคอนเทนเนอร์ เพราะสตริงเส้นทางแบบเต็มไม่มีอยู่แบบ native
</Warning>

### แบ็กเอนด์ SSH

ใช้ `backend: "ssh"` เมื่อคุณต้องการให้ OpenClaw sandbox `exec`, เครื่องมือไฟล์ และการอ่านสื่อบนเครื่องใดก็ได้ที่เข้าถึงได้ด้วย SSH

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
    - เมื่อใช้ครั้งแรกหลังจากสร้างหรือสร้างใหม่ OpenClaw จะ seed workspace ระยะไกลนั้นจาก workspace local หนึ่งครั้ง
    - หลังจากนั้น `exec`, `read`, `write`, `edit`, `apply_patch`, การอ่านสื่อ prompt และการ staging สื่อขาเข้า จะทำงานกับ workspace ระยะไกลโดยตรงผ่าน SSH
    - OpenClaw ไม่ซิงก์การเปลี่ยนแปลงระยะไกลกลับมายัง workspace local โดยอัตโนมัติ

  </Accordion>
  <Accordion title="ข้อมูลรับรองการยืนยันตัวตน">
    - `identityFile`, `certificateFile`, `knownHostsFile`: ใช้ไฟล์ local ที่มีอยู่และส่งผ่านการกำหนดค่า OpenSSH
    - `identityData`, `certificateData`, `knownHostsData`: ใช้สตริงแบบ inline หรือ SecretRefs OpenClaw จะแปลงค่าเหล่านี้ผ่าน secrets runtime snapshot ปกติ เขียนลงไฟล์ชั่วคราวด้วย `0600` และลบออกเมื่อเซสชัน SSH สิ้นสุด
    - หากตั้งค่าทั้ง `*File` และ `*Data` สำหรับรายการเดียวกัน `*Data` จะชนะสำหรับเซสชัน SSH นั้น

  </Accordion>
  <Accordion title="ผลลัพธ์ของ remote-canonical">
    นี่คือโมเดล **remote-canonical** workspace SSH ระยะไกลจะกลายเป็นสถานะ sandbox จริงหลังจากการ seed ครั้งแรก

    - การแก้ไข host-local ที่ทำนอก OpenClaw หลังขั้นตอน seed จะไม่ปรากฏบนระยะไกลจนกว่าคุณจะสร้าง sandbox ใหม่
    - `openclaw sandbox recreate` ลบ root ระยะไกลต่อขอบเขตและ seed ใหม่จาก local ในการใช้งานครั้งถัดไป
    - ไม่รองรับ browser sandboxing บนแบ็กเอนด์ SSH
    - การตั้งค่า `sandbox.docker.*` ไม่มีผลกับแบ็กเอนด์ SSH

  </Accordion>
</AccordionGroup>

### แบ็กเอนด์ OpenShell

ใช้ `backend: "openshell"` เมื่อคุณต้องการให้ OpenClaw sandbox เครื่องมือในสภาพแวดล้อมระยะไกลที่จัดการโดย OpenShell สำหรับคู่มือการตั้งค่าฉบับเต็ม เอกสารอ้างอิงการกำหนดค่า และการเปรียบเทียบโหมด workspace โปรดดู [หน้า OpenShell](/th/gateway/openshell) โดยเฉพาะ

OpenShell ใช้ SSH transport แกนกลางและ bridge ระบบไฟล์ระยะไกลเดียวกันกับแบ็กเอนด์ SSH ทั่วไป และเพิ่ม lifecycle เฉพาะ OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) พร้อมโหมด workspace `mirror` ที่เป็นทางเลือก

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

- `mirror` (ค่าเริ่มต้น): workspace local ยังคงเป็น canonical OpenClaw ซิงก์ไฟล์ local เข้า OpenShell ก่อน exec และซิงก์ workspace ระยะไกลกลับหลัง exec
- `remote`: workspace OpenShell เป็น canonical หลังจากสร้าง sandbox แล้ว OpenClaw seed workspace ระยะไกลหนึ่งครั้งจาก workspace local จากนั้นเครื่องมือไฟล์และ exec จะทำงานกับ sandbox ระยะไกลโดยตรงโดยไม่ซิงก์การเปลี่ยนแปลงกลับ

<AccordionGroup>
  <Accordion title="รายละเอียดการขนส่งระยะไกล">
    - OpenClaw ขอการกำหนดค่า SSH เฉพาะ sandbox จาก OpenShell ผ่าน `openshell sandbox ssh-config <name>`
    - Core เขียนการกำหนดค่า SSH นั้นไปยังไฟล์ชั่วคราว เปิดเซสชัน SSH และนำสะพานระบบไฟล์ระยะไกลตัวเดิมที่ใช้โดย `backend: "ssh"` กลับมาใช้ซ้ำ
    - ในโหมด `mirror` เฉพาะวงจรชีวิตเท่านั้นที่ต่างออกไป: ซิงก์ภายในเครื่องไปยังระยะไกลก่อน exec แล้วซิงก์กลับหลัง exec

  </Accordion>
  <Accordion title="ข้อจำกัดปัจจุบันของ OpenShell">
    - ยังไม่รองรับเบราว์เซอร์ sandbox
    - ไม่รองรับ `sandbox.docker.binds` บนแบ็กเอนด์ OpenShell
    - ปุ่มปรับแต่งรันไทม์เฉพาะ Docker ภายใต้ `sandbox.docker.*` ยังใช้ได้เฉพาะกับแบ็กเอนด์ Docker เท่านั้น

  </Accordion>
</AccordionGroup>

#### โหมดเวิร์กสเปซ

OpenShell มีโมเดลเวิร์กสเปซสองแบบ นี่คือส่วนที่สำคัญที่สุดในการใช้งานจริง

<Tabs>
  <Tab title="mirror (ภายในเครื่องเป็น canonical)">
    ใช้ `plugins.entries.openshell.config.mode: "mirror"` เมื่อคุณต้องการให้ **เวิร์กสเปซภายในเครื่องยังเป็น canonical**

    พฤติกรรม:

    - ก่อน `exec` OpenClaw จะซิงก์เวิร์กสเปซภายในเครื่องเข้าไปใน sandbox ของ OpenShell
    - หลัง `exec` OpenClaw จะซิงก์เวิร์กสเปซระยะไกลกลับมายังเวิร์กสเปซภายในเครื่อง
    - เครื่องมือไฟล์ยังคงทำงานผ่านสะพาน sandbox แต่เวิร์กสเปซภายในเครื่องยังเป็นแหล่งข้อมูลจริงระหว่างเทิร์น

    ใช้โหมดนี้เมื่อ:

    - คุณแก้ไขไฟล์ภายในเครื่องนอก OpenClaw และต้องการให้การเปลี่ยนแปลงเหล่านั้นปรากฏใน sandbox โดยอัตโนมัติ
    - คุณต้องการให้ sandbox ของ OpenShell ทำงานใกล้เคียงกับแบ็กเอนด์ Docker มากที่สุด
    - คุณต้องการให้เวิร์กสเปซบนโฮสต์สะท้อนการเขียนใน sandbox หลังแต่ละเทิร์น exec

    ข้อแลกเปลี่ยน: มีต้นทุนการซิงก์เพิ่มก่อนและหลัง exec

  </Tab>
  <Tab title="remote (OpenShell เป็น canonical)">
    ใช้ `plugins.entries.openshell.config.mode: "remote"` เมื่อคุณต้องการให้ **เวิร์กสเปซ OpenShell กลายเป็น canonical**

    พฤติกรรม:

    - เมื่อสร้าง sandbox ครั้งแรก OpenClaw จะ seed เวิร์กสเปซระยะไกลจากเวิร์กสเปซภายในเครื่องหนึ่งครั้ง
    - หลังจากนั้น `exec`, `read`, `write`, `edit` และ `apply_patch` จะทำงานกับเวิร์กสเปซ OpenShell ระยะไกลโดยตรง
    - OpenClaw **จะไม่** ซิงก์การเปลี่ยนแปลงระยะไกลกลับมายังเวิร์กสเปซภายในเครื่องหลัง exec
    - การอ่านสื่อระหว่างสร้างพรอมป์ยังทำงานได้ เพราะเครื่องมือไฟล์และสื่ออ่านผ่านสะพาน sandbox แทนที่จะสมมติพาธโฮสต์ภายในเครื่อง
    - การขนส่งคือ SSH เข้าไปใน sandbox ของ OpenShell ที่ `openshell sandbox ssh-config` ส่งกลับมา

    ผลที่ตามมาสำคัญ:

    - หากคุณแก้ไขไฟล์บนโฮสต์นอก OpenClaw หลังขั้นตอน seed sandbox ระยะไกลจะ **ไม่** เห็นการเปลี่ยนแปลงเหล่านั้นโดยอัตโนมัติ
    - หากสร้าง sandbox ใหม่ เวิร์กสเปซระยะไกลจะถูก seed จากเวิร์กสเปซภายในเครื่องอีกครั้ง
    - เมื่อใช้ `scope: "agent"` หรือ `scope: "shared"` เวิร์กสเปซระยะไกลนั้นจะถูกแชร์ในขอบเขตเดียวกันนั้น

    ใช้โหมดนี้เมื่อ:

    - sandbox ควรอยู่ฝั่ง OpenShell ระยะไกลเป็นหลัก
    - คุณต้องการลดโอเวอร์เฮดการซิงก์ต่อเทิร์น
    - คุณไม่ต้องการให้การแก้ไขภายในเครื่องของโฮสต์เขียนทับสถานะ sandbox ระยะไกลโดยไม่ชัดเจน

  </Tab>
</Tabs>

เลือก `mirror` หากคุณมองว่า sandbox เป็นสภาพแวดล้อมการประมวลผลชั่วคราว เลือก `remote` หากคุณมองว่า sandbox เป็นเวิร์กสเปซจริง

#### วงจรชีวิตของ OpenShell

sandbox ของ OpenShell ยังคงถูกจัดการผ่านวงจรชีวิต sandbox ปกติ:

- `openclaw sandbox list` แสดงทั้งรันไทม์ OpenShell และรันไทม์ Docker
- `openclaw sandbox recreate` ลบรันไทม์ปัจจุบันและให้ OpenClaw สร้างใหม่เมื่อใช้งานครั้งถัดไป
- ตรรกะ prune ก็รู้จักแบ็กเอนด์เช่นกัน

สำหรับโหมด `remote` การสร้างใหม่สำคัญเป็นพิเศษ:

- recreate จะลบเวิร์กสเปซระยะไกล canonical สำหรับขอบเขตนั้น
- การใช้งานครั้งถัดไปจะ seed เวิร์กสเปซระยะไกลใหม่จากเวิร์กสเปซภายในเครื่อง

สำหรับโหมด `mirror` การสร้างใหม่หลัก ๆ คือรีเซ็ตสภาพแวดล้อมการประมวลผลระยะไกล เพราะเวิร์กสเปซภายในเครื่องยังเป็น canonical อยู่ดี

## การเข้าถึงเวิร์กสเปซ

`agents.defaults.sandbox.workspaceAccess` ควบคุมว่า **sandbox เห็นอะไรได้บ้าง**:

<Tabs>
  <Tab title="none (ค่าเริ่มต้น)">
    เครื่องมือเห็นเวิร์กสเปซ sandbox ภายใต้ `~/.openclaw/sandboxes`
  </Tab>
  <Tab title="ro">
    เมานต์เวิร์กสเปซของเอเจนต์แบบอ่านอย่างเดียวที่ `/agent` (ปิดใช้งาน `write`/`edit`/`apply_patch`)
  </Tab>
  <Tab title="rw">
    เมานต์เวิร์กสเปซของเอเจนต์แบบอ่าน/เขียนที่ `/workspace`
  </Tab>
</Tabs>

เมื่อใช้แบ็กเอนด์ OpenShell:

- โหมด `mirror` ยังคงใช้เวิร์กสเปซภายในเครื่องเป็นแหล่ง canonical ระหว่างเทิร์น exec
- โหมด `remote` ใช้เวิร์กสเปซ OpenShell ระยะไกลเป็นแหล่ง canonical หลังการ seed ครั้งแรก
- `workspaceAccess: "ro"` และ `"none"` ยังคงจำกัดพฤติกรรมการเขียนในแบบเดียวกัน

สื่อขาเข้าจะถูกคัดลอกเข้าไปในเวิร์กสเปซ sandbox ที่ใช้งานอยู่ (`media/inbound/*`)

<Note>
**หมายเหตุเกี่ยวกับ Skills:** เครื่องมือ `read` มีรากอยู่ที่ sandbox เมื่อใช้ `workspaceAccess: "none"` OpenClaw จะ mirror Skills ที่เข้าเกณฑ์เข้าไปในเวิร์กสเปซ sandbox (`.../skills`) เพื่อให้สามารถอ่านได้ เมื่อใช้ `"rw"` Skills ในเวิร์กสเปซจะอ่านได้จาก `/workspace/skills` และ Skills ที่จัดการโดยระบบ ที่บันเดิลมา หรือจาก Plugin ที่เข้าเกณฑ์จะถูกสร้างเป็นวัตถุในพาธอ่านอย่างเดียวที่สร้างขึ้น `/workspace/.openclaw/sandbox-skills/skills`
</Note>

## การเมานต์ bind แบบกำหนดเอง

`agents.defaults.sandbox.docker.binds` เมานต์ไดเรกทอรีโฮสต์เพิ่มเติมเข้าไปในคอนเทนเนอร์ รูปแบบ: `host:container:mode` (เช่น `"/home/user/source:/source:rw"`)

bind ระดับ global และต่อเอเจนต์จะถูก **ผสาน** กัน (ไม่ใช่แทนที่กัน) ภายใต้ `scope: "shared"` bind ต่อเอเจนต์จะถูกละเว้น

`agents.defaults.sandbox.browser.binds` เมานต์ไดเรกทอรีโฮสต์เพิ่มเติมเข้าไปในคอนเทนเนอร์ **เบราว์เซอร์ sandbox** เท่านั้น

- เมื่อตั้งค่าไว้ (รวมถึง `[]`) ค่านี้จะแทนที่ `agents.defaults.sandbox.docker.binds` สำหรับคอนเทนเนอร์เบราว์เซอร์
- เมื่อไม่ระบุ คอนเทนเนอร์เบราว์เซอร์จะ fallback ไปใช้ `agents.defaults.sandbox.docker.binds` (เข้ากันได้ย้อนหลัง)

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

- bind ข้ามระบบไฟล์ของ sandbox: มันเปิดเผยพาธโฮสต์ด้วยโหมดใดก็ตามที่คุณตั้ง (`:ro` หรือ `:rw`)
- OpenClaw บล็อกแหล่ง bind ที่อันตราย (ตัวอย่างเช่น: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` และเมานต์พาเรนต์ที่จะเปิดเผยมัน)
- OpenClaw ยังบล็อกรากข้อมูลรับรองทั่วไปในโฮมไดเรกทอรี เช่น `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` และ `~/.ssh`
- การตรวจสอบ bind ไม่ใช่แค่การจับคู่สตริง OpenClaw ทำให้พาธต้นทางเป็นรูปแบบปกติ จากนั้น resolve อีกครั้งผ่านบรรพบุรุษที่มีอยู่ลึกที่สุดก่อนตรวจสอบพาธที่ถูกบล็อกและรากที่อนุญาตอีกครั้ง
- นั่นหมายความว่าการหลุดออกผ่าน symlink-parent จะยัง fail closed แม้ leaf สุดท้ายจะยังไม่มีอยู่ก็ตาม ตัวอย่าง: `/workspace/run-link/new-file` ยังคง resolve เป็น `/var/run/...` หาก `run-link` ชี้ไปที่นั่น
- รากต้นทางที่อนุญาตจะถูก canonicalize แบบเดียวกัน ดังนั้นพาธที่ดูเหมือนอยู่ใน allowlist เฉพาะก่อนการ resolve symlink จะยังถูกปฏิเสธเป็น `outside allowed roots`
- เมานต์ที่ละเอียดอ่อน (secrets, คีย์ SSH, ข้อมูลรับรองบริการ) ควรเป็น `:ro` เว้นแต่จำเป็นจริง ๆ
- ใช้ร่วมกับ `workspaceAccess: "ro"` หากคุณต้องการเพียงการเข้าถึงเวิร์กสเปซแบบอ่านอย่างเดียว โหมด bind ยังคงเป็นอิสระจากกัน
- ดู [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) สำหรับวิธีที่ bind โต้ตอบกับนโยบายเครื่องมือและ elevated exec

</Warning>

## อิมเมจและการตั้งค่า

อิมเมจ Docker ค่าเริ่มต้น: `openclaw-sandbox:bookworm-slim`

<Note>
**Source checkout เทียบกับ npm install**

สคริปต์ช่วยเหลือ `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` และ `scripts/sandbox-browser-setup.sh` มีให้ใช้เฉพาะเมื่อรันจาก [source checkout](https://github.com/openclaw/openclaw) เท่านั้น สคริปต์เหล่านี้ไม่ได้รวมอยู่ในแพ็กเกจ npm

หากคุณติดตั้ง OpenClaw ผ่าน `npm install -g openclaw` ให้ใช้คำสั่ง `docker build` แบบ inline ที่แสดงด้านล่างแทน
</Note>

<Steps>
  <Step title="สร้างอิมเมจค่าเริ่มต้น">
    จาก source checkout:

    ```bash
    scripts/sandbox-setup.sh
    ```

    จากการติดตั้ง npm (ไม่ต้องมี source checkout):

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

    อิมเมจค่าเริ่มต้น **ไม่มี** Node หาก Skill ต้องใช้ Node (หรือรันไทม์อื่น) ให้ bake อิมเมจแบบกำหนดเอง หรือติดตั้งผ่าน `sandbox.docker.setupCommand` (ต้องมี network egress + รากที่เขียนได้ + ผู้ใช้ root)

    OpenClaw จะไม่แทนที่ด้วย `debian:bookworm-slim` แบบเงียบ ๆ เมื่อไม่มี `openclaw-sandbox:bookworm-slim` การรัน sandbox ที่ระบุอิมเมจค่าเริ่มต้นจะล้มเหลวทันทีพร้อมคำสั่ง build จนกว่าคุณจะ build มัน เพราะอิมเมจที่บันเดิลมามี `python3` สำหรับตัวช่วยเขียน/แก้ไขของ sandbox

  </Step>
  <Step title="ไม่บังคับ: สร้างอิมเมจ common">
    สำหรับอิมเมจ sandbox ที่มีฟังก์ชันครบขึ้นพร้อมเครื่องมือทั่วไป (ตัวอย่างเช่น `curl`, `jq`, Node 24, pnpm, `python3` และ `git`):

    จาก source checkout:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    จากการติดตั้ง npm ให้ build อิมเมจค่าเริ่มต้นก่อน (ดูด้านบน) จากนั้น build อิมเมจ common ต่อบนอิมเมจนั้นโดยใช้ [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) จาก repository

    จากนั้นตั้ง `agents.defaults.sandbox.docker.image` เป็น `openclaw-sandbox-common:bookworm-slim`

  </Step>
  <Step title="ไม่บังคับ: สร้างอิมเมจเบราว์เซอร์ sandbox">
    จาก source checkout:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    จากการติดตั้ง npm ให้ build โดยใช้ [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) จาก repository

  </Step>
</Steps>

โดยค่าเริ่มต้น คอนเทนเนอร์ sandbox ของ Docker จะรันโดย **ไม่มีเครือข่าย** แทนที่ด้วย `agents.defaults.sandbox.docker.network`

<AccordionGroup>
  <Accordion title="ค่าเริ่มต้น Chromium ของเบราว์เซอร์ sandbox">
    อิมเมจเบราว์เซอร์ sandbox ที่บันเดิลมายังใช้ค่าเริ่มต้นการเริ่มต้น Chromium แบบอนุรักษ์นิยมสำหรับเวิร์กโหลดในคอนเทนเนอร์ ค่าเริ่มต้นของคอนเทนเนอร์ปัจจุบันประกอบด้วย:

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
    - `--no-sandbox` เมื่อเปิดใช้งาน `noSandbox`
    - แฟล็ก hardening ด้านกราฟิกสามรายการ (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) เป็นตัวเลือก และมีประโยชน์เมื่อคอนเทนเนอร์ไม่มีการรองรับ GPU ตั้งค่า `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากเวิร์กโหลดของคุณต้องใช้ WebGL หรือฟีเจอร์ 3D/เบราว์เซอร์อื่น
    - `--disable-extensions` เปิดใช้งานตามค่าเริ่มต้น และสามารถปิดได้ด้วย `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` สำหรับโฟลว์ที่พึ่งพาส่วนขยาย
    - `--renderer-process-limit=2` ควบคุมโดย `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` โดยที่ `0` จะคงค่าเริ่มต้นของ Chromium ไว้

    หากคุณต้องการโปรไฟล์รันไทม์อื่น ให้ใช้อิมเมจเบราว์เซอร์แบบกำหนดเองและระบุ entrypoint ของคุณเอง สำหรับโปรไฟล์ Chromium ภายในเครื่อง (ไม่ใช่คอนเทนเนอร์) ให้ใช้ `browser.extraArgs` เพื่อผนวกแฟล็กเริ่มต้นเพิ่มเติม

  </Accordion>
  <Accordion title="ค่าเริ่มต้นด้านความปลอดภัยของเครือข่าย">
    - `network: "host"` ถูกบล็อก
    - `network: "container:<id>"` ถูกบล็อกตามค่าเริ่มต้น (ความเสี่ยงจากการข้ามข้อจำกัดด้วยการเข้าร่วม namespace)
    - การยกเว้นฉุกเฉิน: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`

  </Accordion>
</AccordionGroup>

การติดตั้ง Docker และ Gateway แบบคอนเทนเนอร์อยู่ที่นี่: [Docker](/th/install/docker)

สำหรับการปรับใช้ Docker Gateway, `scripts/docker/setup.sh` สามารถเริ่มต้น config ของแซนด์บ็อกซ์ได้ ตั้งค่า `OPENCLAW_SANDBOX=1` (หรือ `true`/`yes`/`on`) เพื่อเปิดใช้เส้นทางนี้ คุณสามารถแทนที่ตำแหน่ง socket ด้วย `OPENCLAW_DOCKER_SOCKET` ดูการตั้งค่าทั้งหมดและข้อมูลอ้างอิง env ได้ที่: [Docker](/th/install/docker#agent-sandbox).

## setupCommand (การตั้งค่าคอนเทนเนอร์ครั้งเดียว)

`setupCommand` ทำงาน **ครั้งเดียว** หลังจากสร้างคอนเทนเนอร์แซนด์บ็อกซ์แล้ว (ไม่ใช่ทุกครั้งที่รัน) โดยจะทำงานภายในคอนเทนเนอร์ผ่าน `sh -lc`

พาธ:

- ส่วนกลาง: `agents.defaults.sandbox.docker.setupCommand`
- รายเอเจนต์: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="ข้อผิดพลาดที่พบบ่อย">
    - ค่าเริ่มต้นของ `docker.network` คือ `"none"` (ไม่มี egress) ดังนั้นการติดตั้งแพ็กเกจจะล้มเหลว
    - `docker.network: "container:<id>"` ต้องใช้ `dangerouslyAllowContainerNamespaceJoin: true` และเป็นการยกเว้นฉุกเฉินเท่านั้น
    - `readOnlyRoot: true` ป้องกันการเขียน; ตั้งค่า `readOnlyRoot: false` หรือสร้าง custom image ไว้ล่วงหน้า
    - `user` ต้องเป็น root สำหรับการติดตั้งแพ็กเกจ (ละ `user` ไว้ หรือตั้งค่า `user: "0:0"`)
    - การ exec ในแซนด์บ็อกซ์ **ไม่** สืบทอด `process.env` ของโฮสต์ ใช้ `agents.defaults.sandbox.docker.env` (หรือ custom image) สำหรับคีย์ API ของ Skills
    - ค่าใน `agents.defaults.sandbox.docker.env` จะถูกส่งเป็นตัวแปรสภาพแวดล้อมของคอนเทนเนอร์ Docker แบบชัดเจน ทุกคนที่มีสิทธิ์เข้าถึง Docker daemon สามารถตรวจสอบค่าเหล่านี้ได้ด้วยคำสั่ง metadata ของ Docker เช่น `docker inspect` ใช้ custom image, ไฟล์ secret ที่ mount ไว้ หรือเส้นทางส่ง secret อื่น หากไม่ยอมรับการเปิดเผยผ่าน metadata แบบนี้

  </Accordion>
</AccordionGroup>

## นโยบายเครื่องมือและทางออกฉุกเฉิน

นโยบายอนุญาต/ปฏิเสธเครื่องมือยังคงมีผลก่อนกฎแซนด์บ็อกซ์ หากเครื่องมือถูกปฏิเสธแบบส่วนกลางหรือรายเอเจนต์ การใช้แซนด์บ็อกซ์จะไม่ทำให้เครื่องมือนั้นกลับมาใช้งานได้

`tools.elevated` เป็นทางออกฉุกเฉินแบบชัดเจนที่รัน `exec` นอกแซนด์บ็อกซ์ (`gateway` ตามค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec คือ `node`) directives `/exec` ใช้ได้เฉพาะกับผู้ส่งที่ได้รับอนุญาตและคงอยู่ต่อเซสชัน หากต้องการปิดใช้ `exec` แบบเด็ดขาด ให้ใช้นโยบายเครื่องมือแบบปฏิเสธ (ดู [แซนด์บ็อกซ์ เทียบกับนโยบายเครื่องมือ เทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated))

การดีบัก:

- ใช้ `openclaw sandbox explain` เพื่อตรวจสอบโหมดแซนด์บ็อกซ์ที่มีผลจริง นโยบายเครื่องมือ และคีย์ config สำหรับแก้ไข
- ดู [แซนด์บ็อกซ์ เทียบกับนโยบายเครื่องมือ เทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) สำหรับโมเดลความคิดเรื่อง "ทำไมสิ่งนี้ถึงถูกบล็อก?"

ล็อกให้แน่นหนาไว้

## การแทนที่สำหรับหลายเอเจนต์

แต่ละเอเจนต์สามารถแทนที่แซนด์บ็อกซ์ + เครื่องมือได้: `agents.list[].sandbox` และ `agents.list[].tools` (รวมถึง `agents.list[].tools.sandbox.tools` สำหรับนโยบายเครื่องมือของแซนด์บ็อกซ์) ดู [แซนด์บ็อกซ์และเครื่องมือสำหรับหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) สำหรับลำดับความสำคัญ

## ตัวอย่างเปิดใช้งานขั้นต่ำ

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

- [แซนด์บ็อกซ์และเครื่องมือสำหรับหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) — การแทนที่รายเอเจนต์และลำดับความสำคัญ
- [OpenShell](/th/gateway/openshell) — การตั้งค่า backend แซนด์บ็อกซ์ที่จัดการให้ โหมด workspace และข้อมูลอ้างอิง config
- [การกำหนดค่าแซนด์บ็อกซ์](/th/gateway/config-agents#agentsdefaultssandbox)
- [แซนด์บ็อกซ์ เทียบกับนโยบายเครื่องมือ เทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) — การดีบัก "ทำไมสิ่งนี้ถึงถูกบล็อก?"
- [ความปลอดภัย](/th/gateway/security)
