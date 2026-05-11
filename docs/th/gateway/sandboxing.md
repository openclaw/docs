---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'แซนด์บ็อกซ์ของ OpenClaw ทำงานอย่างไร: โหมด ขอบเขต การเข้าถึงเวิร์กสเปซ และรูปภาพ'
title: การทำงานในแซนด์บ็อกซ์
x-i18n:
    generated_at: "2026-05-11T20:30:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a90a68fdab1fdaef462bc6be589cb510d89c01138a0d43927e29d55bbb6e3ea
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw สามารถเรียกใช้ **เครื่องมือภายในแบ็กเอนด์ sandbox** เพื่อลดขอบเขตผลกระทบได้ สิ่งนี้เป็น **ตัวเลือก** และควบคุมด้วยการกำหนดค่า (`agents.defaults.sandbox` หรือ `agents.list[].sandbox`) หากปิด sandboxing เครื่องมือจะทำงานบนโฮสต์ Gateway จะยังอยู่บนโฮสต์ ส่วนการเรียกใช้เครื่องมือจะทำงานใน sandbox ที่แยกออกมาเมื่อเปิดใช้งาน

<Note>
นี่ไม่ใช่ขอบเขตความปลอดภัยที่สมบูรณ์แบบ แต่ช่วยจำกัดการเข้าถึงระบบไฟล์และโพรเซสได้อย่างมีนัยสำคัญเมื่อโมเดลทำสิ่งที่ไม่สมเหตุสมผล
</Note>

## สิ่งที่จะถูก sandbox

- การเรียกใช้เครื่องมือ (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` ฯลฯ)
- เบราว์เซอร์ใน sandbox ที่เป็นตัวเลือก (`agents.defaults.sandbox.browser`)

<AccordionGroup>
  <Accordion title="รายละเอียดเบราว์เซอร์ใน sandbox">
    - โดยค่าเริ่มต้น เบราว์เซอร์ใน sandbox จะเริ่มทำงานอัตโนมัติ (ทำให้แน่ใจว่า CDP เข้าถึงได้) เมื่อเครื่องมือเบราว์เซอร์ต้องใช้ กำหนดค่าได้ผ่าน `agents.defaults.sandbox.browser.autoStart` และ `agents.defaults.sandbox.browser.autoStartTimeoutMs`
    - โดยค่าเริ่มต้น คอนเทนเนอร์เบราว์เซอร์ใน sandbox จะใช้เครือข่าย Docker เฉพาะ (`openclaw-sandbox-browser`) แทนเครือข่าย `bridge` ส่วนกลาง กำหนดค่าได้ด้วย `agents.defaults.sandbox.browser.network`
    - `agents.defaults.sandbox.browser.cdpSourceRange` ที่เป็นตัวเลือกจำกัดการรับทราฟฟิก CDP ที่ขอบคอนเทนเนอร์ด้วยรายการอนุญาต CIDR (ตัวอย่างเช่น `172.21.0.1/32`)
    - การเข้าถึง noVNC สำหรับผู้สังเกตการณ์มีการป้องกันด้วยรหัสผ่านโดยค่าเริ่มต้น OpenClaw จะส่ง URL โทเคนอายุสั้นที่ให้บริการหน้าบูตสแตรปภายในเครื่อง และเปิด noVNC พร้อมรหัสผ่านใน URL fragment (ไม่ใช่ใน query/header logs)
    - `agents.defaults.sandbox.browser.allowHostControl` อนุญาตให้เซสชันใน sandbox กำหนดเป้าหมายไปยังเบราว์เซอร์ของโฮสต์อย่างชัดเจน
    - รายการอนุญาตที่เป็นตัวเลือกจะควบคุม `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`

  </Accordion>
</AccordionGroup>

ไม่ได้ถูก sandbox:

- โพรเซส Gateway เอง
- เครื่องมือใดก็ตามที่อนุญาตอย่างชัดเจนให้ทำงานนอก sandbox (เช่น `tools.elevated`)
  - **Elevated exec จะข้าม sandboxing และใช้เส้นทาง escape ที่กำหนดค่าไว้ (`gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec คือ `node`)**
  - หากปิด sandboxing อยู่ `tools.elevated` จะไม่เปลี่ยนแปลงการเรียกใช้ (อยู่บนโฮสต์อยู่แล้ว) ดู [โหมด Elevated](/th/tools/elevated)

## โหมด

`agents.defaults.sandbox.mode` ควบคุมว่าจะใช้ sandboxing **เมื่อใด**:

<Tabs>
  <Tab title="off">
    ไม่มี sandboxing
  </Tab>
  <Tab title="non-main">
    sandbox เฉพาะเซสชัน **non-main** (ค่าเริ่มต้นหากคุณต้องการให้แชตปกติอยู่บนโฮสต์)

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
- `"shared"`: หนึ่งคอนเทนเนอร์ที่แชร์โดยทุกเซสชันที่ถูก sandbox

## แบ็กเอนด์

`agents.defaults.sandbox.backend` ควบคุมว่า **runtime ใด** ให้บริการ sandbox:

- `"docker"` (ค่าเริ่มต้นเมื่อเปิดใช้งาน sandboxing): runtime sandbox ที่รองรับด้วย Docker ภายในเครื่อง
- `"ssh"`: runtime sandbox ระยะไกลทั่วไปที่รองรับด้วย SSH
- `"openshell"`: runtime sandbox ที่รองรับด้วย OpenShell

การกำหนดค่าเฉพาะ SSH อยู่ใต้ `agents.defaults.sandbox.ssh` การกำหนดค่าเฉพาะ OpenShell อยู่ใต้ `plugins.entries.openshell.config`

### การเลือกแบ็กเอนด์

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **ตำแหน่งที่ทำงาน** | คอนเทนเนอร์ภายในเครื่อง        | โฮสต์ใดก็ได้ที่เข้าถึงได้ผ่าน SSH | sandbox ที่จัดการโดย OpenShell                      |
| **การตั้งค่า**      | `scripts/sandbox-setup.sh`       | คีย์ SSH + โฮสต์เป้าหมาย       | เปิดใช้งาน Plugin OpenShell                         |
| **โมเดล workspace** | Bind-mount หรือ copy             | Remote-canonical (seed ครั้งเดียว) | `mirror` หรือ `remote`                              |
| **การควบคุมเครือข่าย** | `docker.network` (ค่าเริ่มต้น: none) | ขึ้นอยู่กับโฮสต์ระยะไกล        | ขึ้นอยู่กับ OpenShell                               |
| **เบราว์เซอร์ sandbox** | รองรับ                         | ไม่รองรับ                      | ยังไม่รองรับ                                        |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **เหมาะที่สุดสำหรับ** | การพัฒนาภายในเครื่อง, การแยกแบบเต็ม | การถ่ายงานไปยังเครื่องระยะไกล | sandbox ระยะไกลที่มีการจัดการพร้อมการซิงก์สองทางที่เป็นตัวเลือก |

### แบ็กเอนด์ Docker

sandboxing ปิดอยู่โดยค่าเริ่มต้น หากคุณเปิดใช้งาน sandboxing และไม่ได้เลือกแบ็กเอนด์ OpenClaw จะใช้แบ็กเอนด์ Docker ซึ่งเรียกใช้เครื่องมือและเบราว์เซอร์ sandbox ภายในเครื่องผ่านซ็อกเก็ต Docker daemon (`/var/run/docker.sock`) การแยกคอนเทนเนอร์ sandbox ถูกกำหนดโดย Docker namespaces

หากต้องการเปิดเผย GPU ของโฮสต์ให้ sandbox ของ Docker ตั้งค่า `agents.defaults.sandbox.docker.gpus` หรือ override ราย agent `agents.list[].sandbox.docker.gpus` ค่านี้จะถูกส่งให้แฟล็ก `--gpus` ของ Docker เป็นอาร์กิวเมนต์แยกต่างหาก ตัวอย่างเช่น `"all"` หรือ `"device=GPU-uuid"` และต้องใช้ runtime ของโฮสต์ที่เข้ากันได้ เช่น NVIDIA Container Toolkit

<Warning>
**ข้อจำกัด Docker-out-of-Docker (DooD)**

หากคุณปรับใช้ OpenClaw Gateway เองเป็นคอนเทนเนอร์ Docker มันจะจัดการคอนเทนเนอร์ sandbox แบบ sibling โดยใช้ซ็อกเก็ต Docker ของโฮสต์ ซึ่งทำให้เกิดข้อจำกัดด้านการแมปพาธเฉพาะดังนี้:

- **การกำหนดค่าต้องใช้พาธของโฮสต์**: การกำหนดค่า `workspace` ใน `openclaw.json` ต้องมี **พาธสัมบูรณ์ของโฮสต์** (เช่น `/home/user/.openclaw/workspaces`) ไม่ใช่พาธภายในคอนเทนเนอร์ Gateway เมื่อ OpenClaw ขอให้ Docker daemon สร้าง sandbox daemon จะประเมินพาธโดยอิง namespace ของ Host OS ไม่ใช่ namespace ของ Gateway
- **ความเท่าเทียมของ FS bridge (volume map ที่เหมือนกัน)**: โพรเซส native ของ OpenClaw Gateway ยังเขียนไฟล์ Heartbeat และ bridge ไปยังไดเรกทอรี `workspace` ด้วย เนื่องจาก Gateway ประเมินสตริงเดียวกันทุกประการ (พาธของโฮสต์) จากภายในสภาพแวดล้อมคอนเทนเนอร์ของตัวเอง การปรับใช้ Gateway ต้องมี volume map ที่เหมือนกันซึ่งเชื่อม namespace ของโฮสต์แบบ native (`-v /home/user/.openclaw:/home/user/.openclaw`)
- **โหมดโค้ด Codex**: เมื่อ sandbox ของ OpenClaw เปิดใช้งานอยู่ OpenClaw จะจำกัดเทิร์น app-server ของ Codex ให้ใช้ sandboxing `workspace-write` ของ Codex แม้ว่าค่าเริ่มต้นของ Plugin Codex จะเป็น `danger-full-access` ก็ตาม อย่า mount ซ็อกเก็ต Docker ของโฮสต์เข้าไปในคอนเทนเนอร์ sandbox ของ agent หรือ sandbox Codex แบบกำหนดเอง

หากคุณแมปพาธภายในโดยไม่มีความเท่าเทียมกับโฮสต์แบบสัมบูรณ์ OpenClaw จะโยนข้อผิดพลาดสิทธิ์ `EACCES` แบบ native เมื่อพยายามเขียน Heartbeat ภายในสภาพแวดล้อมคอนเทนเนอร์ เพราะสตริงพาธแบบเต็มไม่มีอยู่แบบ native
</Warning>

### แบ็กเอนด์ SSH

ใช้ `backend: "ssh"` เมื่อคุณต้องการให้ OpenClaw sandbox `exec`, เครื่องมือไฟล์ และการอ่านสื่อบนเครื่องใดก็ได้ที่เข้าถึงได้ผ่าน SSH

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
    - OpenClaw สร้าง root ระยะไกลต่อขอบเขตภายใต้ `sandbox.ssh.workspaceRoot`
    - เมื่อใช้ครั้งแรกหลังจากสร้างหรือสร้างใหม่ OpenClaw จะ seed workspace ระยะไกลนั้นจาก workspace ภายในเครื่องหนึ่งครั้ง
    - หลังจากนั้น `exec`, `read`, `write`, `edit`, `apply_patch`, การอ่านสื่อของ prompt และการ staging สื่อขาเข้า จะทำงานกับ workspace ระยะไกลโดยตรงผ่าน SSH
    - OpenClaw ไม่ซิงก์การเปลี่ยนแปลงระยะไกลกลับไปยัง workspace ภายในเครื่องโดยอัตโนมัติ

  </Accordion>
  <Accordion title="วัสดุสำหรับการยืนยันตัวตน">
    - `identityFile`, `certificateFile`, `knownHostsFile`: ใช้ไฟล์ภายในเครื่องที่มีอยู่และส่งผ่านการกำหนดค่า OpenSSH
    - `identityData`, `certificateData`, `knownHostsData`: ใช้สตริงแบบ inline หรือ SecretRefs OpenClaw จะแก้ค่าเหล่านี้ผ่าน snapshot runtime ของ secrets ตามปกติ เขียนลงไฟล์ temp ด้วย `0600` และลบเมื่อเซสชัน SSH จบลง
    - หากตั้งค่าทั้ง `*File` และ `*Data` สำหรับรายการเดียวกัน `*Data` จะชนะสำหรับเซสชัน SSH นั้น

  </Accordion>
  <Accordion title="ผลลัพธ์ของ remote-canonical">
    นี่คือโมเดล **remote-canonical** workspace SSH ระยะไกลจะกลายเป็นสถานะ sandbox จริงหลังจาก seed เริ่มต้น

    - การแก้ไขภายในเครื่องของโฮสต์ที่ทำภายนอก OpenClaw หลังขั้นตอน seed จะมองไม่เห็นจากระยะไกลจนกว่าคุณจะสร้าง sandbox ใหม่
    - `openclaw sandbox recreate` จะลบ root ระยะไกลต่อขอบเขตและ seed อีกครั้งจากภายในเครื่องเมื่อใช้ครั้งถัดไป
    - เบราว์เซอร์ sandboxing ไม่รองรับบนแบ็กเอนด์ SSH
    - การตั้งค่า `sandbox.docker.*` ไม่มีผลกับแบ็กเอนด์ SSH

  </Accordion>
</AccordionGroup>

### แบ็กเอนด์ OpenShell

ใช้ `backend: "openshell"` เมื่อคุณต้องการให้ OpenClaw sandbox เครื่องมือในสภาพแวดล้อมระยะไกลที่จัดการโดย OpenShell สำหรับคู่มือการตั้งค่าฉบับเต็ม ข้อมูลอ้างอิงการกำหนดค่า และการเปรียบเทียบโหมด workspace โปรดดู [หน้า OpenShell](/th/gateway/openshell) เฉพาะ

OpenShell ใช้ transport SSH หลักและ bridge ระบบไฟล์ระยะไกลเดียวกันกับแบ็กเอนด์ SSH ทั่วไป และเพิ่ม lifecycle เฉพาะ OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) พร้อมโหมด workspace `mirror` ที่เป็นตัวเลือก

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

- `mirror` (ค่าเริ่มต้น): workspace ภายในเครื่องยังคงเป็น canonical OpenClaw จะซิงก์ไฟล์ภายในเครื่องเข้า OpenShell ก่อน exec และซิงก์ workspace ระยะไกลกลับหลัง exec
- `remote`: workspace ของ OpenShell เป็น canonical หลังจากสร้าง sandbox แล้ว OpenClaw จะ seed workspace ระยะไกลหนึ่งครั้งจาก workspace ภายในเครื่อง จากนั้นเครื่องมือไฟล์และ exec จะทำงานกับ sandbox ระยะไกลโดยตรงโดยไม่ซิงก์การเปลี่ยนแปลงกลับ

<AccordionGroup>
  <Accordion title="รายละเอียด transport ระยะไกล">
    - OpenClaw ขอการกำหนดค่า SSH เฉพาะ sandbox จาก OpenShell ผ่าน `openshell sandbox ssh-config <name>`
    - Core เขียนการกำหนดค่า SSH นั้นลงไฟล์ temp เปิดเซสชัน SSH และใช้ bridge ระบบไฟล์ระยะไกลเดียวกันกับที่ใช้โดย `backend: "ssh"`
    - ในโหมด `mirror` มีเพียง lifecycle เท่านั้นที่ต่างออกไป: ซิงก์จากภายในเครื่องไปยังระยะไกลก่อน exec แล้วซิงก์กลับหลัง exec

  </Accordion>
  <Accordion title="ข้อจำกัดปัจจุบันของ OpenShell">
    - ยังไม่รองรับเบราว์เซอร์ sandbox
    - `sandbox.docker.binds` ไม่รองรับบนแบ็กเอนด์ OpenShell
    - knob runtime เฉพาะ Docker ภายใต้ `sandbox.docker.*` ยังคงมีผลเฉพาะกับแบ็กเอนด์ Docker เท่านั้น

  </Accordion>
</AccordionGroup>

#### โหมด workspace

OpenShell มีโมเดล workspace สองแบบ นี่คือส่วนที่สำคัญที่สุดในทางปฏิบัติ

<Tabs>
  <Tab title="mirror (local canonical)">
    ใช้ `plugins.entries.openshell.config.mode: "mirror"` เมื่อคุณต้องการให้ **workspace ภายในเครื่องยังคงเป็น canonical**

    พฤติกรรม:

    - ก่อน `exec` OpenClaw จะซิงก์พื้นที่ทำงานภายในเครื่องเข้าไปใน OpenShell sandbox
    - หลัง `exec` OpenClaw จะซิงก์พื้นที่ทำงานระยะไกลกลับมายังพื้นที่ทำงานภายในเครื่อง
    - เครื่องมือไฟล์ยังคงทำงานผ่าน sandbox bridge แต่พื้นที่ทำงานภายในเครื่องยังเป็นแหล่งข้อมูลหลักระหว่างเทิร์น

    ใช้สิ่งนี้เมื่อ:

    - คุณแก้ไขไฟล์ภายในเครื่องนอก OpenClaw และต้องการให้การเปลี่ยนแปลงเหล่านั้นปรากฏใน sandbox โดยอัตโนมัติ
    - คุณต้องการให้ OpenShell sandbox ทำงานคล้ายกับ Docker backend มากที่สุดเท่าที่เป็นไปได้
    - คุณต้องการให้พื้นที่ทำงานของโฮสต์สะท้อนการเขียนใน sandbox หลังแต่ละเทิร์น exec

    ข้อแลกเปลี่ยน: มีต้นทุนการซิงก์เพิ่มเติมก่อนและหลัง exec

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    ใช้ `plugins.entries.openshell.config.mode: "remote"` เมื่อคุณต้องการให้ **พื้นที่ทำงาน OpenShell กลายเป็นแหล่งข้อมูลหลัก**

    พฤติกรรม:

    - เมื่อสร้าง sandbox ครั้งแรก OpenClaw จะเติมข้อมูลพื้นที่ทำงานระยะไกลจากพื้นที่ทำงานภายในเครื่องหนึ่งครั้ง
    - หลังจากนั้น `exec`, `read`, `write`, `edit` และ `apply_patch` จะทำงานโดยตรงกับพื้นที่ทำงาน OpenShell ระยะไกล
    - OpenClaw จะ **ไม่** ซิงก์การเปลี่ยนแปลงระยะไกลกลับมายังพื้นที่ทำงานภายในเครื่องหลัง exec
    - การอ่านสื่อในช่วง prompt ยังทำงานได้ เพราะเครื่องมือไฟล์และสื่ออ่านผ่าน sandbox bridge แทนที่จะสมมติ path โฮสต์ภายในเครื่อง
    - การรับส่งข้อมูลคือ SSH เข้าไปยัง OpenShell sandbox ที่ได้จาก `openshell sandbox ssh-config`

    ผลที่ตามมาที่สำคัญ:

    - หากคุณแก้ไขไฟล์บนโฮสต์นอก OpenClaw หลังขั้นตอนเติมข้อมูล sandbox ระยะไกลจะ **ไม่** เห็นการเปลี่ยนแปลงเหล่านั้นโดยอัตโนมัติ
    - หากสร้าง sandbox ใหม่ พื้นที่ทำงานระยะไกลจะถูกเติมข้อมูลจากพื้นที่ทำงานภายในเครื่องอีกครั้ง
    - เมื่อใช้ `scope: "agent"` หรือ `scope: "shared"` พื้นที่ทำงานระยะไกลนั้นจะถูกแชร์ใน scope เดียวกัน

    ใช้สิ่งนี้เมื่อ:

    - sandbox ควรอยู่ฝั่ง OpenShell ระยะไกลเป็นหลัก
    - คุณต้องการลดภาระการซิงก์ต่อเทิร์น
    - คุณไม่ต้องการให้การแก้ไขภายในเครื่องของโฮสต์เขียนทับสถานะ sandbox ระยะไกลอย่างเงียบๆ

  </Tab>
</Tabs>

เลือก `mirror` หากคุณมอง sandbox เป็นสภาพแวดล้อมสำหรับการรันงานชั่วคราว เลือก `remote` หากคุณมอง sandbox เป็นพื้นที่ทำงานจริง

#### วงจรชีวิต OpenShell

OpenShell sandbox ยังคงถูกจัดการผ่านวงจรชีวิต sandbox ตามปกติ:

- `openclaw sandbox list` แสดง OpenShell runtime รวมถึง Docker runtime
- `openclaw sandbox recreate` ลบ runtime ปัจจุบันและให้ OpenClaw สร้างใหม่เมื่อใช้งานครั้งถัดไป
- ตรรกะ prune ก็รับรู้ backend เช่นกัน

สำหรับโหมด `remote` การสร้างใหม่มีความสำคัญเป็นพิเศษ:

- การสร้างใหม่จะลบพื้นที่ทำงานระยะไกลที่เป็นแหล่งข้อมูลหลักสำหรับ scope นั้น
- การใช้งานครั้งถัดไปจะเติมข้อมูลพื้นที่ทำงานระยะไกลใหม่จากพื้นที่ทำงานภายในเครื่อง

สำหรับโหมด `mirror` การสร้างใหม่ส่วนใหญ่จะรีเซ็ตสภาพแวดล้อมการรันงานระยะไกล เพราะพื้นที่ทำงานภายในเครื่องยังคงเป็นแหล่งข้อมูลหลักอยู่แล้ว

## การเข้าถึงพื้นที่ทำงาน

`agents.defaults.sandbox.workspaceAccess` ควบคุมว่า **sandbox มองเห็นอะไรได้บ้าง**:

<Tabs>
  <Tab title="none (default)">
    เครื่องมือเห็นพื้นที่ทำงาน sandbox ภายใต้ `~/.openclaw/sandboxes`
  </Tab>
  <Tab title="ro">
    เมานต์พื้นที่ทำงานของ agent แบบอ่านอย่างเดียวที่ `/agent` (ปิดใช้งาน `write`/`edit`/`apply_patch`)
  </Tab>
  <Tab title="rw">
    เมานต์พื้นที่ทำงานของ agent แบบอ่าน/เขียนที่ `/workspace`
  </Tab>
</Tabs>

เมื่อใช้ OpenShell backend:

- โหมด `mirror` ยังคงใช้พื้นที่ทำงานภายในเครื่องเป็นแหล่งข้อมูลหลักระหว่างเทิร์น exec
- โหมด `remote` ใช้พื้นที่ทำงาน OpenShell ระยะไกลเป็นแหล่งข้อมูลหลักหลังการเติมข้อมูลเริ่มต้น
- `workspaceAccess: "ro"` และ `"none"` ยังคงจำกัดพฤติกรรมการเขียนในแบบเดียวกัน

สื่อขาเข้าจะถูกคัดลอกเข้าไปในพื้นที่ทำงาน sandbox ที่ใช้งานอยู่ (`media/inbound/*`)

<Note>
**หมายเหตุเกี่ยวกับ Skills:** เครื่องมือ `read` อิงรากของ sandbox เมื่อใช้ `workspaceAccess: "none"` OpenClaw จะ mirror skills ที่เข้าเงื่อนไขเข้าไปในพื้นที่ทำงาน sandbox (`.../skills`) เพื่อให้อ่านได้ เมื่อใช้ `"rw"` skills ในพื้นที่ทำงานจะอ่านได้จาก `/workspace/skills`
</Note>

## bind mount แบบกำหนดเอง

`agents.defaults.sandbox.docker.binds` เมานต์ไดเรกทอรีโฮสต์เพิ่มเติมเข้าไปใน container รูปแบบ: `host:container:mode` (เช่น `"/home/user/source:/source:rw"`)

bind ระดับ global และต่อ agent จะถูก **ผสาน** กัน (ไม่ใช่แทนที่กัน) ภายใต้ `scope: "shared"` bind ต่อ agent จะถูกละเว้น

`agents.defaults.sandbox.browser.binds` เมานต์ไดเรกทอรีโฮสต์เพิ่มเติมเข้าไปใน container **sandbox browser** เท่านั้น

- เมื่อตั้งค่าไว้ (รวมถึง `[]`) ค่านี้จะแทนที่ `agents.defaults.sandbox.docker.binds` สำหรับ browser container
- เมื่อละไว้ browser container จะ fallback ไปใช้ `agents.defaults.sandbox.docker.binds` (เข้ากันได้ย้อนหลัง)

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

- bind ข้ามระบบไฟล์ของ sandbox: ทำให้ path ของโฮสต์ถูกเปิดเผยด้วยโหมดที่คุณตั้งไว้ (`:ro` หรือ `:rw`)
- OpenClaw บล็อกแหล่ง bind ที่อันตราย (ตัวอย่างเช่น `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` และ parent mount ที่จะเปิดเผยสิ่งเหล่านี้)
- OpenClaw ยังบล็อกรากของข้อมูลประจำตัวใน home directory ที่พบบ่อย เช่น `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` และ `~/.ssh`
- การตรวจสอบ bind ไม่ใช่แค่การจับคู่สตริง OpenClaw จะ normalize path ต้นทาง แล้ว resolve อีกครั้งผ่าน ancestor ที่มีอยู่ลึกที่สุด ก่อนตรวจสอบ path ที่ถูกบล็อกและรากที่อนุญาตซ้ำ
- นั่นหมายความว่าการหลบหนีผ่าน parent ที่เป็น symlink ยังคงถูกปิดกั้น แม้ leaf สุดท้ายจะยังไม่มีอยู่ก็ตาม ตัวอย่าง: `/workspace/run-link/new-file` ยังคง resolve เป็น `/var/run/...` หาก `run-link` ชี้ไปที่นั่น
- รากต้นทางที่อนุญาตจะถูก canonicalize ด้วยวิธีเดียวกัน ดังนั้น path ที่ดูเหมือนอยู่ใน allowlist ก่อนการ resolve symlink ก็ยังถูกปฏิเสธเป็น `outside allowed roots`
- mount ที่ละเอียดอ่อน (secrets, SSH keys, service credentials) ควรเป็น `:ro` เว้นแต่จำเป็นจริงๆ
- ใช้ร่วมกับ `workspaceAccess: "ro"` หากคุณต้องการเพียงสิทธิ์อ่านพื้นที่ทำงาน; โหมด bind ยังคงเป็นอิสระต่อกัน
- ดู [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) สำหรับวิธีที่ bind โต้ตอบกับ tool policy และ elevated exec

</Warning>

## Images และการตั้งค่า

Docker image เริ่มต้น: `openclaw-sandbox:bookworm-slim`

<Note>
**Source checkout เทียบกับ npm install**

สคริปต์ตัวช่วย `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` และ `scripts/sandbox-browser-setup.sh` มีให้ใช้เฉพาะเมื่อรันจาก [source checkout](https://github.com/openclaw/openclaw) เท่านั้น สคริปต์เหล่านี้ไม่ได้รวมอยู่ใน npm package

หากคุณติดตั้ง OpenClaw ผ่าน `npm install -g openclaw` ให้ใช้คำสั่ง `docker build` แบบ inline ที่แสดงด้านล่างแทน
</Note>

<Steps>
  <Step title="Build the default image">
    จาก source checkout:

    ```bash
    scripts/sandbox-setup.sh
    ```

    จากการติดตั้งผ่าน npm (ไม่ต้องมี source checkout):

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

    image เริ่มต้น **ไม่มี** Node หาก skill ต้องใช้ Node (หรือ runtime อื่น) ให้ bake image แบบกำหนดเองหรือติดตั้งผ่าน `sandbox.docker.setupCommand` (ต้องมี network egress + root ที่เขียนได้ + ผู้ใช้ root)

    OpenClaw จะไม่แทนที่ด้วย `debian:bookworm-slim` ธรรมดาอย่างเงียบๆ เมื่อไม่มี `openclaw-sandbox:bookworm-slim` การรัน sandbox ที่เล็งไปยัง image เริ่มต้นจะล้มเหลวทันทีพร้อมคำแนะนำการ build จนกว่าคุณจะ build image นั้น เพราะ image ที่บันเดิลมาพก `python3` สำหรับตัวช่วยเขียน/แก้ไขใน sandbox

  </Step>
  <Step title="Optional: build the common image">
    สำหรับ sandbox image ที่ใช้งานได้ครบขึ้นพร้อมเครื่องมือทั่วไป (ตัวอย่างเช่น `curl`, `jq`, `nodejs`, `python3`, `git`):

    จาก source checkout:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    จากการติดตั้งผ่าน npm ให้ build image เริ่มต้นก่อน (ดูด้านบน) จากนั้น build common image ต่อบน image นั้นโดยใช้ [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) จาก repository

    จากนั้นตั้งค่า `agents.defaults.sandbox.docker.image` เป็น `openclaw-sandbox-common:bookworm-slim`

  </Step>
  <Step title="Optional: build the sandbox browser image">
    จาก source checkout:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    จากการติดตั้งผ่าน npm ให้ build โดยใช้ [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) จาก repository

  </Step>
</Steps>

โดยค่าเริ่มต้น Docker sandbox container จะรันโดย **ไม่มี network** แทนที่ได้ด้วย `agents.defaults.sandbox.docker.network`

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    bundled sandbox browser image ยังใช้ค่าเริ่มต้นการเริ่มทำงานของ Chromium แบบระมัดระวังสำหรับ workload ใน container ด้วย ค่าเริ่มต้นของ container ปัจจุบันประกอบด้วย:

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
    - flag เสริมความปลอดภัยกราฟิกสามรายการ (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) เป็นแบบเลือกใช้ได้ และมีประโยชน์เมื่อ container ไม่มีการรองรับ GPU ตั้งค่า `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หาก workload ของคุณต้องใช้ WebGL หรือฟีเจอร์ 3D/browser อื่น
    - `--disable-extensions` เปิดใช้งานโดยค่าเริ่มต้น และปิดใช้งานได้ด้วย `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` สำหรับ flow ที่พึ่งพา extension
    - `--renderer-process-limit=2` ถูกควบคุมโดย `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` โดย `0` จะคงค่าเริ่มต้นของ Chromium

    หากคุณต้องการ runtime profile ที่ต่างออกไป ให้ใช้ browser image แบบกำหนดเองและระบุ entrypoint ของคุณเอง สำหรับ Chromium profile แบบ local (ไม่ใช่ container) ให้ใช้ `browser.extraArgs` เพื่อเพิ่ม startup flag เพิ่มเติม

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` ถูกบล็อก
    - `network: "container:<id>"` ถูกบล็อกโดยค่าเริ่มต้น (ความเสี่ยงจากการข้ามผ่านด้วย namespace join)
    - override สำหรับกรณีฉุกเฉิน: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`

  </Accordion>
</AccordionGroup>

การติดตั้ง Docker และ Gateway แบบ container อยู่ที่นี่: [Docker](/th/install/docker)

สำหรับการ deploy Docker gateway, `scripts/docker/setup.sh` สามารถ bootstrap config ของ sandbox ได้ ตั้งค่า `OPENCLAW_SANDBOX=1` (หรือ `true`/`yes`/`on`) เพื่อเปิดใช้งาน path นั้น คุณสามารถแทนที่ตำแหน่ง socket ได้ด้วย `OPENCLAW_DOCKER_SOCKET` การตั้งค่าเต็มรูปแบบและเอกสารอ้างอิง env: [Docker](/th/install/docker#agent-sandbox)

## setupCommand (การตั้งค่า container แบบครั้งเดียว)

`setupCommand` รัน **ครั้งเดียว** หลังจากสร้าง sandbox container แล้ว (ไม่ใช่ทุกครั้งที่รัน) โดยจะ execute ภายใน container ผ่าน `sh -lc`

Path:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- ต่อ agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="ข้อควรระวังทั่วไป">
    - ค่าเริ่มต้นของ `docker.network` คือ `"none"` (ไม่มี egress) ดังนั้นการติดตั้งแพ็กเกจจะล้มเหลว
    - `docker.network: "container:<id>"` ต้องใช้ `dangerouslyAllowContainerNamespaceJoin: true` และใช้เฉพาะกรณีฉุกเฉินเท่านั้น
    - `readOnlyRoot: true` ป้องกันการเขียน ให้ตั้งค่า `readOnlyRoot: false` หรือสร้างอิมเมจแบบกำหนดเองไว้ล่วงหน้า
    - `user` ต้องเป็น root สำหรับการติดตั้งแพ็กเกจ (ละ `user` ไว้ หรือตั้งค่า `user: "0:0"`)
    - การ exec ใน sandbox **ไม่** สืบทอด `process.env` ของโฮสต์ ใช้ `agents.defaults.sandbox.docker.env` (หรืออิมเมจแบบกำหนดเอง) สำหรับคีย์ API ของ Skills

  </Accordion>
</AccordionGroup>

## นโยบายเครื่องมือและทางออกฉุกเฉิน

นโยบายอนุญาต/ปฏิเสธเครื่องมือยังคงมีผลก่อนกฎ sandbox หากเครื่องมือถูกปฏิเสธแบบทั่วระบบหรือต่อ agent การ sandbox จะไม่นำเครื่องมือนั้นกลับมา

`tools.elevated` เป็นทางออกฉุกเฉินแบบชัดเจนที่รัน `exec` นอก sandbox (`gateway` เป็นค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec คือ `node`) คำสั่ง `/exec` มีผลเฉพาะกับผู้ส่งที่ได้รับอนุญาตและคงอยู่ต่อเซสชัน หากต้องการปิดใช้งาน `exec` อย่างเด็ดขาด ให้ใช้นโยบายเครื่องมือแบบ deny (ดู [Sandbox เทียบกับนโยบายเครื่องมือเทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated))

การดีบัก:

- ใช้ `openclaw sandbox explain` เพื่อตรวจสอบโหมด sandbox ที่มีผลจริง นโยบายเครื่องมือ และคีย์ config สำหรับแก้ไข
- ดู [Sandbox เทียบกับนโยบายเครื่องมือเทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) สำหรับกรอบคิด "ทำไมสิ่งนี้จึงถูกบล็อก?"

ล็อกให้แน่นหนาไว้

## การ override สำหรับหลาย agent

แต่ละ agent สามารถ override sandbox + tools ได้: `agents.list[].sandbox` และ `agents.list[].tools` (รวมถึง `agents.list[].tools.sandbox.tools` สำหรับนโยบายเครื่องมือของ sandbox) ดู [Sandbox และเครื่องมือสำหรับหลาย Agent](/th/tools/multi-agent-sandbox-tools) สำหรับลำดับความสำคัญ

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

- [Sandbox และเครื่องมือสำหรับหลาย Agent](/th/tools/multi-agent-sandbox-tools) — การ override ราย agent และลำดับความสำคัญ
- [OpenShell](/th/gateway/openshell) — การตั้งค่า backend sandbox ที่มีการจัดการ โหมด workspace และเอกสารอ้างอิง config
- [การกำหนดค่า Sandbox](/th/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox เทียบกับนโยบายเครื่องมือเทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) — การดีบัก "ทำไมสิ่งนี้จึงถูกบล็อก?"
- [ความปลอดภัย](/th/gateway/security)
