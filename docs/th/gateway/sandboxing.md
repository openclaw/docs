---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'วิธีการทำงานของ sandboxing ใน OpenClaw: โหมด ขอบเขต การเข้าถึงพื้นที่ทำงาน และรูปภาพ'
title: การแซนด์บ็อกซ์
x-i18n:
    generated_at: "2026-05-02T10:17:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f313333ec676aaef636b42d4a6f28f35bf213d9e1c5292ffb4868f312cf0eda
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw สามารถรัน **เครื่องมือภายในแบ็กเอนด์แซนด์บ็อกซ์** เพื่อลดขอบเขตผลกระทบได้ สิ่งนี้เป็น **ทางเลือก** และควบคุมโดยการกำหนดค่า (`agents.defaults.sandbox` หรือ `agents.list[].sandbox`) หากปิดแซนด์บ็อกซ์ เครื่องมือจะรันบนโฮสต์ Gateway จะยังอยู่บนโฮสต์ ส่วนการดำเนินการของเครื่องมือจะรันในแซนด์บ็อกซ์ที่แยกออกมาเมื่อเปิดใช้งาน

<Note>
นี่ไม่ใช่ขอบเขตความปลอดภัยที่สมบูรณ์แบบ แต่ช่วยจำกัดการเข้าถึงระบบไฟล์และกระบวนการได้อย่างมีนัยสำคัญเมื่อโมเดลทำสิ่งที่ไม่เหมาะสม
</Note>

## สิ่งที่ถูกแซนด์บ็อกซ์

- การดำเนินการของเครื่องมือ (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` ฯลฯ)
- เบราว์เซอร์ที่ถูกแซนด์บ็อกซ์แบบทางเลือก (`agents.defaults.sandbox.browser`)

<AccordionGroup>
  <Accordion title="รายละเอียดเบราว์เซอร์ที่ถูกแซนด์บ็อกซ์">
    - โดยค่าเริ่มต้น เบราว์เซอร์แซนด์บ็อกซ์จะเริ่มทำงานอัตโนมัติ (ทำให้แน่ใจว่าเข้าถึง CDP ได้) เมื่อเครื่องมือเบราว์เซอร์ต้องใช้ กำหนดค่าผ่าน `agents.defaults.sandbox.browser.autoStart` และ `agents.defaults.sandbox.browser.autoStartTimeoutMs`
    - โดยค่าเริ่มต้น คอนเทนเนอร์เบราว์เซอร์แซนด์บ็อกซ์จะใช้เครือข่าย Docker เฉพาะ (`openclaw-sandbox-browser`) แทนเครือข่าย `bridge` ส่วนกลาง กำหนดค่าด้วย `agents.defaults.sandbox.browser.network`
    - `agents.defaults.sandbox.browser.cdpSourceRange` แบบทางเลือกจะจำกัดการรับ CDP ขาเข้าที่ขอบคอนเทนเนอร์ด้วยรายการ CIDR ที่อนุญาต (เช่น `172.21.0.1/32`)
    - การเข้าถึงผู้สังเกตการณ์ noVNC มีการป้องกันด้วยรหัสผ่านโดยค่าเริ่มต้น OpenClaw จะปล่อย URL โทเค็นอายุสั้นที่ให้บริการหน้าบูตสแตรปในเครื่อง และเปิด noVNC พร้อมรหัสผ่านใน URL fragment (ไม่ใช่ในบันทึก query/header)
    - `agents.defaults.sandbox.browser.allowHostControl` อนุญาตให้เซสชันที่ถูกแซนด์บ็อกซ์กำหนดเป้าหมายไปยังเบราว์เซอร์บนโฮสต์ได้อย่างชัดเจน
    - รายการที่อนุญาตแบบทางเลือกจะควบคุม `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`

  </Accordion>
</AccordionGroup>

ไม่ได้ถูกแซนด์บ็อกซ์:

- กระบวนการ Gateway เอง
- เครื่องมือใดก็ตามที่ได้รับอนุญาตอย่างชัดเจนให้รันนอกแซนด์บ็อกซ์ (เช่น `tools.elevated`)
  - **exec แบบยกระดับจะข้ามแซนด์บ็อกซ์และใช้เส้นทางหลบออกที่กำหนดค่าไว้ (`gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec คือ `node`)**
  - หากปิดแซนด์บ็อกซ์ `tools.elevated` จะไม่เปลี่ยนการดำเนินการ (อยู่บนโฮสต์อยู่แล้ว) ดู [โหมดยกระดับ](/th/tools/elevated)

## โหมด

`agents.defaults.sandbox.mode` ควบคุมว่าใช้แซนด์บ็อกซ์ **เมื่อใด**:

<Tabs>
  <Tab title="off">
    ไม่มีแซนด์บ็อกซ์
  </Tab>
  <Tab title="non-main">
    แซนด์บ็อกซ์เฉพาะเซสชัน **non-main** (ค่าเริ่มต้นหากคุณต้องการให้แชตปกติอยู่บนโฮสต์)

    `"non-main"` อิงตาม `session.mainKey` (ค่าเริ่มต้น `"main"`) ไม่ใช่รหัสเอเจนต์ เซสชันกลุ่ม/ช่องทางใช้คีย์ของตัวเอง ดังนั้นจึงนับเป็น non-main และจะถูกแซนด์บ็อกซ์

  </Tab>
  <Tab title="all">
    ทุกเซสชันรันในแซนด์บ็อกซ์
  </Tab>
</Tabs>

## ขอบเขต

`agents.defaults.sandbox.scope` ควบคุมว่า **สร้างคอนเทนเนอร์กี่ตัว**:

- `"agent"` (ค่าเริ่มต้น): หนึ่งคอนเทนเนอร์ต่อเอเจนต์
- `"session"`: หนึ่งคอนเทนเนอร์ต่อเซสชัน
- `"shared"`: หนึ่งคอนเทนเนอร์ที่ใช้ร่วมกันโดยเซสชันที่ถูกแซนด์บ็อกซ์ทั้งหมด

## แบ็กเอนด์

`agents.defaults.sandbox.backend` ควบคุมว่า **รันไทม์ใด** เป็นผู้ให้แซนด์บ็อกซ์:

- `"docker"` (ค่าเริ่มต้นเมื่อเปิดใช้งานแซนด์บ็อกซ์): รันไทม์แซนด์บ็อกซ์ในเครื่องที่รองรับโดย Docker
- `"ssh"`: รันไทม์แซนด์บ็อกซ์ระยะไกลทั่วไปที่รองรับโดย SSH
- `"openshell"`: รันไทม์แซนด์บ็อกซ์ที่รองรับโดย OpenShell

การกำหนดค่าเฉพาะ SSH อยู่ภายใต้ `agents.defaults.sandbox.ssh` การกำหนดค่าเฉพาะ OpenShell อยู่ภายใต้ `plugins.entries.openshell.config`

### การเลือกแบ็กเอนด์

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **รันที่ไหน**       | คอนเทนเนอร์ในเครื่อง            | โฮสต์ใดก็ได้ที่เข้าถึงได้ผ่าน SSH | แซนด์บ็อกซ์ที่จัดการโดย OpenShell                  |
| **การตั้งค่า**      | `scripts/sandbox-setup.sh`       | คีย์ SSH + โฮสต์เป้าหมาย       | เปิดใช้งาน OpenShell plugin                         |
| **โมเดลเวิร์กสเปซ** | Bind-mount หรือคัดลอก            | ระยะไกลเป็นหลัก (seed ครั้งเดียว) | `mirror` หรือ `remote`                              |
| **การควบคุมเครือข่าย** | `docker.network` (ค่าเริ่มต้น: none) | ขึ้นอยู่กับโฮสต์ระยะไกล        | ขึ้นอยู่กับ OpenShell                               |
| **เบราว์เซอร์แซนด์บ็อกซ์** | รองรับ                         | ไม่รองรับ                      | ยังไม่รองรับ                                        |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **เหมาะที่สุดสำหรับ** | การพัฒนาในเครื่อง, การแยกอย่างเต็มรูปแบบ | การถ่ายงานไปยังเครื่องระยะไกล | แซนด์บ็อกซ์ระยะไกลที่จัดการได้พร้อมการซิงก์สองทางแบบทางเลือก |

### แบ็กเอนด์ Docker

แซนด์บ็อกซ์จะปิดอยู่โดยค่าเริ่มต้น หากคุณเปิดใช้งานแซนด์บ็อกซ์และไม่ได้เลือกแบ็กเอนด์ OpenClaw จะใช้แบ็กเอนด์ Docker แบ็กเอนด์นี้ดำเนินการเครื่องมือและเบราว์เซอร์แซนด์บ็อกซ์ในเครื่องผ่านซ็อกเก็ต Docker daemon (`/var/run/docker.sock`) การแยกคอนเทนเนอร์แซนด์บ็อกซ์ถูกกำหนดโดย Docker namespaces

หากต้องการเปิดเผย GPU ของโฮสต์ให้กับแซนด์บ็อกซ์ Docker ให้ตั้งค่า `agents.defaults.sandbox.docker.gpus` หรือโอเวอร์ไรด์รายเอเจนต์ `agents.list[].sandbox.docker.gpus` ค่านี้จะถูกส่งไปยังแฟล็ก `--gpus` ของ Docker เป็นอาร์กิวเมนต์แยกต่างหาก เช่น `"all"` หรือ `"device=GPU-uuid"` และต้องใช้รันไทม์โฮสต์ที่เข้ากันได้ เช่น NVIDIA Container Toolkit

<Warning>
**ข้อจำกัด Docker-out-of-Docker (DooD)**

หากคุณปรับใช้ OpenClaw Gateway เองเป็นคอนเทนเนอร์ Docker มันจะจัดการคอนเทนเนอร์แซนด์บ็อกซ์ที่เป็น sibling โดยใช้ซ็อกเก็ต Docker ของโฮสต์ สิ่งนี้นำมาซึ่งข้อจำกัดเฉพาะด้านการแมปเส้นทาง:

- **การกำหนดค่าต้องใช้เส้นทางโฮสต์**: การกำหนดค่า `workspace` ใน `openclaw.json` ต้องมี **เส้นทางสัมบูรณ์ของโฮสต์** (เช่น `/home/user/.openclaw/workspaces`) ไม่ใช่เส้นทางภายในคอนเทนเนอร์ Gateway เมื่อ OpenClaw ขอให้ Docker daemon สร้างแซนด์บ็อกซ์ daemon จะประเมินเส้นทางโดยสัมพันธ์กับ namespace ของ Host OS ไม่ใช่ namespace ของ Gateway
- **ความเท่าเทียมของ FS bridge (แมปวอลุ่มเหมือนกัน)**: กระบวนการเนทีฟของ OpenClaw Gateway ยังเขียนไฟล์ heartbeat และ bridge ไปยังไดเรกทอรี `workspace` ด้วย เนื่องจาก Gateway ประเมินสตริงเดียวกันเป๊ะ (เส้นทางโฮสต์) จากภายในสภาพแวดล้อมที่เป็นคอนเทนเนอร์ของตัวเอง การปรับใช้ Gateway ต้องมีแมปวอลุ่มที่เหมือนกันซึ่งเชื่อม namespace ของโฮสต์แบบเนทีฟ (`-v /home/user/.openclaw:/home/user/.openclaw`)

หากคุณแมปเส้นทางภายในโดยไม่มีความเท่าเทียมกับเส้นทางสัมบูรณ์ของโฮสต์ OpenClaw จะโยนข้อผิดพลาดสิทธิ์ `EACCES` แบบเนทีฟเมื่อพยายามเขียน heartbeat ภายในสภาพแวดล้อมคอนเทนเนอร์ เพราะสตริงเส้นทางแบบ fully qualified ไม่มีอยู่แบบเนทีฟ
</Warning>

### แบ็กเอนด์ SSH

ใช้ `backend: "ssh"` เมื่อคุณต้องการให้ OpenClaw แซนด์บ็อกซ์ `exec`, เครื่องมือไฟล์ และการอ่านสื่อบนเครื่องใดก็ได้ที่เข้าถึงได้ผ่าน SSH

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
    - OpenClaw สร้างรูทระยะไกลต่อขอบเขตภายใต้ `sandbox.ssh.workspaceRoot`
    - เมื่อใช้งานครั้งแรกหลังจากสร้างหรือสร้างใหม่ OpenClaw จะ seed เวิร์กสเปซระยะไกลนั้นจากเวิร์กสเปซในเครื่องหนึ่งครั้ง
    - หลังจากนั้น `exec`, `read`, `write`, `edit`, `apply_patch`, การอ่านสื่อในพรอมป์ และการ staging สื่อขาเข้าจะรันกับเวิร์กสเปซระยะไกลโดยตรงผ่าน SSH
    - OpenClaw จะไม่ซิงก์การเปลี่ยนแปลงระยะไกลกลับไปยังเวิร์กสเปซในเครื่องโดยอัตโนมัติ

  </Accordion>
  <Accordion title="วัสดุสำหรับการยืนยันตัวตน">
    - `identityFile`, `certificateFile`, `knownHostsFile`: ใช้ไฟล์ในเครื่องที่มีอยู่และส่งผ่านการกำหนดค่า OpenSSH
    - `identityData`, `certificateData`, `knownHostsData`: ใช้สตริงแบบ inline หรือ SecretRefs OpenClaw จะแก้ค่าเหล่านี้ผ่านสแนปช็อตรันไทม์ secrets ปกติ เขียนลงไฟล์ชั่วคราวด้วย `0600` และลบเมื่อเซสชัน SSH สิ้นสุด
    - หากตั้งค่าทั้ง `*File` และ `*Data` สำหรับรายการเดียวกัน `*Data` จะชนะสำหรับเซสชัน SSH นั้น

  </Accordion>
  <Accordion title="ผลที่ตามมาของการใช้ระยะไกลเป็นหลัก">
    นี่คือโมเดลที่ **ระยะไกลเป็นหลัก** เวิร์กสเปซ SSH ระยะไกลจะกลายเป็นสถานะแซนด์บ็อกซ์จริงหลังจาก seed ครั้งแรก

    - การแก้ไขในเครื่องโฮสต์ที่ทำนอก OpenClaw หลังขั้นตอน seed จะไม่ปรากฏบนระยะไกลจนกว่าคุณจะสร้างแซนด์บ็อกซ์ใหม่
    - `openclaw sandbox recreate` ลบรูทระยะไกลต่อขอบเขตและ seed ใหม่จากในเครื่องเมื่อใช้ครั้งถัดไป
    - ไม่รองรับการแซนด์บ็อกซ์เบราว์เซอร์บนแบ็กเอนด์ SSH
    - การตั้งค่า `sandbox.docker.*` ไม่ใช้กับแบ็กเอนด์ SSH

  </Accordion>
</AccordionGroup>

### แบ็กเอนด์ OpenShell

ใช้ `backend: "openshell"` เมื่อคุณต้องการให้ OpenClaw แซนด์บ็อกซ์เครื่องมือในสภาพแวดล้อมระยะไกลที่จัดการโดย OpenShell สำหรับคู่มือการตั้งค่าฉบับเต็ม ข้อมูลอ้างอิงการกำหนดค่า และการเปรียบเทียบโหมดเวิร์กสเปซ ดู [หน้า OpenShell เฉพาะ](/th/gateway/openshell)

OpenShell ใช้ทรานสปอร์ต SSH หลักและ bridge ระบบไฟล์ระยะไกลเดียวกันกับแบ็กเอนด์ SSH ทั่วไป และเพิ่ม lifecycle เฉพาะ OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) พร้อมโหมดเวิร์กสเปซ `mirror` แบบทางเลือก

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

- `mirror` (ค่าเริ่มต้น): เวิร์กสเปซในเครื่องยังเป็นหลัก OpenClaw ซิงก์ไฟล์ในเครื่องเข้า OpenShell ก่อน exec และซิงก์เวิร์กสเปซระยะไกลกลับหลัง exec
- `remote`: เวิร์กสเปซ OpenShell เป็นหลักหลังจากสร้างแซนด์บ็อกซ์ OpenClaw seed เวิร์กสเปซระยะไกลหนึ่งครั้งจากเวิร์กสเปซในเครื่อง จากนั้นเครื่องมือไฟล์และ exec จะรันกับแซนด์บ็อกซ์ระยะไกลโดยตรงโดยไม่ซิงก์การเปลี่ยนแปลงกลับ

<AccordionGroup>
  <Accordion title="รายละเอียดทรานสปอร์ตระยะไกล">
    - OpenClaw ขอการกำหนดค่า SSH เฉพาะแซนด์บ็อกซ์จาก OpenShell ผ่าน `openshell sandbox ssh-config <name>`
    - Core เขียนการกำหนดค่า SSH นั้นลงไฟล์ชั่วคราว เปิดเซสชัน SSH และใช้ bridge ระบบไฟล์ระยะไกลเดียวกันกับที่ใช้โดย `backend: "ssh"`
    - ในโหมด `mirror` มีเพียง lifecycle ที่แตกต่าง: ซิงก์ในเครื่องไปยังระยะไกลก่อน exec แล้วซิงก์กลับหลัง exec

  </Accordion>
  <Accordion title="ข้อจำกัดปัจจุบันของ OpenShell">
    - ยังไม่รองรับเบราว์เซอร์แซนด์บ็อกซ์
    - ไม่รองรับ `sandbox.docker.binds` บนแบ็กเอนด์ OpenShell
    - ปุ่มปรับแต่งรันไทม์เฉพาะ Docker ภายใต้ `sandbox.docker.*` ยังคงใช้ได้เฉพาะกับแบ็กเอนด์ Docker เท่านั้น

  </Accordion>
</AccordionGroup>

#### โหมดเวิร์กสเปซ

OpenShell มีโมเดลเวิร์กสเปซสองแบบ ส่วนนี้คือส่วนที่สำคัญที่สุดในทางปฏิบัติ

<Tabs>
  <Tab title="mirror (local canonical)">
    ใช้ `plugins.entries.openshell.config.mode: "mirror"` เมื่อคุณต้องการให้ **เวิร์กสเปซในเครื่องยังเป็นหลัก**

    พฤติกรรม:

    - ก่อน `exec` OpenClaw ซิงก์เวิร์กสเปซในเครื่องเข้าแซนด์บ็อกซ์ OpenShell
    - หลัง `exec` OpenClaw ซิงก์เวิร์กสเปซระยะไกลกลับไปยังเวิร์กสเปซในเครื่อง
    - เครื่องมือไฟล์ยังคงทำงานผ่าน sandbox bridge แต่เวิร์กสเปซในเครื่องยังคงเป็นแหล่งข้อมูลจริงระหว่างรอบ

    ใช้สิ่งนี้เมื่อ:

    - คุณแก้ไขไฟล์ในเครื่องภายนอก OpenClaw และต้องการให้การเปลี่ยนแปลงเหล่านั้นปรากฏใน sandbox โดยอัตโนมัติ
    - คุณต้องการให้ OpenShell sandbox ทำงานใกล้เคียงกับแบ็กเอนด์ Docker มากที่สุด
    - คุณต้องการให้ host workspace สะท้อนการเขียนจาก sandbox หลังแต่ละรอบ exec

    ข้อแลกเปลี่ยน: มีต้นทุนการซิงก์เพิ่มเติมก่อนและหลัง exec

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    ใช้ `plugins.entries.openshell.config.mode: "remote"` เมื่อคุณต้องการให้ **OpenShell workspace กลายเป็นแหล่ง canonical**

    พฤติกรรม:

    - เมื่อสร้าง sandbox ครั้งแรก OpenClaw จะ seed remote workspace จาก local workspace หนึ่งครั้ง
    - หลังจากนั้น `exec`, `read`, `write`, `edit` และ `apply_patch` จะทำงานโดยตรงกับ remote OpenShell workspace
    - OpenClaw จะ **ไม่** ซิงก์การเปลี่ยนแปลงระยะไกลกลับเข้า local workspace หลัง exec
    - การอ่านสื่อในช่วง prompt ยังทำงานได้ เพราะเครื่องมือไฟล์และสื่ออ่านผ่าน sandbox bridge แทนที่จะสมมติว่าเป็นพาธ host ในเครื่อง
    - การขนส่งคือ SSH เข้าไปยัง OpenShell sandbox ที่ส่งกลับโดย `openshell sandbox ssh-config`

    ผลลัพธ์สำคัญ:

    - หากคุณแก้ไขไฟล์บน host ภายนอก OpenClaw หลังขั้นตอน seed, remote sandbox จะ **ไม่** เห็นการเปลี่ยนแปลงเหล่านั้นโดยอัตโนมัติ
    - หากสร้าง sandbox ใหม่ remote workspace จะถูก seed จาก local workspace อีกครั้ง
    - เมื่อใช้ `scope: "agent"` หรือ `scope: "shared"` remote workspace นั้นจะถูกแชร์ในขอบเขตเดียวกัน

    ใช้สิ่งนี้เมื่อ:

    - sandbox ควรอยู่บนฝั่ง OpenShell ระยะไกลเป็นหลัก
    - คุณต้องการลด overhead การซิงก์ต่อรอบ
    - คุณไม่ต้องการให้การแก้ไขในเครื่อง host เขียนทับสถานะ remote sandbox อย่างเงียบ ๆ

  </Tab>
</Tabs>

เลือก `mirror` หากคุณมองว่า sandbox เป็นสภาพแวดล้อมการดำเนินการชั่วคราว เลือก `remote` หากคุณมองว่า sandbox เป็น workspace จริง

#### วงจรชีวิตของ OpenShell

OpenShell sandboxes ยังคงถูกจัดการผ่านวงจรชีวิต sandbox ปกติ:

- `openclaw sandbox list` แสดง runtime ของ OpenShell รวมถึง runtime ของ Docker
- `openclaw sandbox recreate` ลบ runtime ปัจจุบันและให้ OpenClaw สร้างใหม่ในการใช้งานครั้งถัดไป
- ตรรกะ prune ก็รับรู้แบ็กเอนด์เช่นกัน

สำหรับโหมด `remote`, การสร้างใหม่สำคัญเป็นพิเศษ:

- recreate จะลบ remote workspace ที่เป็น canonical สำหรับขอบเขตนั้น
- การใช้งานครั้งถัดไปจะ seed remote workspace ใหม่จาก local workspace

สำหรับโหมด `mirror`, recreate ส่วนใหญ่จะรีเซ็ตสภาพแวดล้อมการดำเนินการระยะไกล เพราะ local workspace ยังคงเป็น canonical อยู่ดี

## การเข้าถึง Workspace

`agents.defaults.sandbox.workspaceAccess` ควบคุมว่า **sandbox มองเห็นอะไรได้บ้าง**:

<Tabs>
  <Tab title="none (default)">
    เครื่องมือจะเห็น sandbox workspace ภายใต้ `~/.openclaw/sandboxes`
  </Tab>
  <Tab title="ro">
    เมานต์ agent workspace แบบอ่านอย่างเดียวที่ `/agent` (ปิดใช้งาน `write`/`edit`/`apply_patch`)
  </Tab>
  <Tab title="rw">
    เมานต์ agent workspace แบบอ่าน/เขียนที่ `/workspace`
  </Tab>
</Tabs>

เมื่อใช้แบ็กเอนด์ OpenShell:

- โหมด `mirror` ยังคงใช้ local workspace เป็นแหล่ง canonical ระหว่างรอบ exec
- โหมด `remote` ใช้ remote OpenShell workspace เป็นแหล่ง canonical หลังการ seed เริ่มต้น
- `workspaceAccess: "ro"` และ `"none"` ยังคงจำกัดพฤติกรรมการเขียนในลักษณะเดียวกัน

สื่อขาเข้าจะถูกคัดลอกเข้าไปใน sandbox workspace ที่ใช้งานอยู่ (`media/inbound/*`)

<Note>
**หมายเหตุเกี่ยวกับ Skills:** เครื่องมือ `read` มีรากอยู่ที่ sandbox เมื่อใช้ `workspaceAccess: "none"`, OpenClaw จะ mirror skills ที่เข้าเกณฑ์เข้าไปใน sandbox workspace (`.../skills`) เพื่อให้อ่านได้ เมื่อใช้ `"rw"`, workspace skills จะอ่านได้จาก `/workspace/skills`
</Note>

## bind mounts แบบกำหนดเอง

`agents.defaults.sandbox.docker.binds` เมานต์ไดเรกทอรี host เพิ่มเติมเข้าไปในคอนเทนเนอร์ รูปแบบ: `host:container:mode` (เช่น `"/home/user/source:/source:rw"`)

binds ระดับ global และต่อ agent จะถูก **ผสาน** กัน (ไม่ใช่แทนที่กัน) ภายใต้ `scope: "shared"`, per-agent binds จะถูกละเว้น

`agents.defaults.sandbox.browser.binds` เมานต์ไดเรกทอรี host เพิ่มเติมเข้าไปในคอนเทนเนอร์ **sandbox browser** เท่านั้น

- เมื่อกำหนดค่าไว้ (รวมถึง `[]`) ค่านี้จะแทนที่ `agents.defaults.sandbox.docker.binds` สำหรับคอนเทนเนอร์ browser
- เมื่อละไว้ คอนเทนเนอร์ browser จะ fallback ไปที่ `agents.defaults.sandbox.docker.binds` (เข้ากันได้ย้อนหลัง)

ตัวอย่าง (แหล่งที่มาแบบอ่านอย่างเดียว + ไดเรกทอรีข้อมูลเพิ่มเติม):

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

- Binds ข้ามระบบไฟล์ของ sandbox: โดยเปิดเผยพาธ host ด้วยโหมดใดก็ตามที่คุณตั้งไว้ (`:ro` หรือ `:rw`)
- OpenClaw บล็อกแหล่ง bind ที่อันตราย (เช่น `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` และ parent mounts ที่จะเปิดเผยสิ่งเหล่านั้น)
- OpenClaw ยังบล็อกราก credential ทั่วไปใน home-directory เช่น `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` และ `~/.ssh`
- การตรวจสอบ bind ไม่ใช่แค่การจับคู่สตริง OpenClaw ทำให้พาธต้นทางเป็นรูปแบบปกติ จากนั้น resolve อีกครั้งผ่าน ancestor ที่ลึกที่สุดซึ่งมีอยู่ ก่อนตรวจซ้ำกับพาธที่ถูกบล็อกและรากที่อนุญาต
- นั่นหมายความว่า symlink-parent escapes จะยังคง fail closed แม้เมื่อ leaf สุดท้ายยังไม่มีอยู่ ตัวอย่าง: `/workspace/run-link/new-file` ยังคง resolve เป็น `/var/run/...` หาก `run-link` ชี้ไปที่นั่น
- รากต้นทางที่อนุญาตจะถูก canonicalize ด้วยวิธีเดียวกัน ดังนั้นพาธที่ดูเหมือนอยู่ภายใน allowlist ก่อนการ resolve symlink เท่านั้น จะยังคงถูกปฏิเสธเป็น `outside allowed roots`
- เมานต์ที่มีความอ่อนไหว (secrets, คีย์ SSH, service credentials) ควรเป็น `:ro` เว้นแต่จำเป็นจริง ๆ
- ใช้ร่วมกับ `workspaceAccess: "ro"` หากคุณต้องการเพียงสิทธิ์อ่าน workspace; โหมด bind ยังคงเป็นอิสระต่อกัน
- ดู [Sandbox เทียบกับนโยบายเครื่องมือเทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) เพื่อดูว่า binds โต้ตอบกับนโยบายเครื่องมือและ elevated exec อย่างไร

</Warning>

## อิมเมจและการตั้งค่า

อิมเมจ Docker เริ่มต้น: `openclaw-sandbox:bookworm-slim`

<Note>
**source checkout เทียบกับ npm install**

สคริปต์ช่วยเหลือ `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` และ `scripts/sandbox-browser-setup.sh` มีให้ใช้เฉพาะเมื่อรันจาก [source checkout](https://github.com/openclaw/openclaw) เท่านั้น สคริปต์เหล่านี้ไม่ได้รวมอยู่ในแพ็กเกจ npm

หากคุณติดตั้ง OpenClaw ผ่าน `npm install -g openclaw`, ให้ใช้คำสั่ง inline `docker build` ที่แสดงด้านล่างแทน
</Note>

<Steps>
  <Step title="Build the default image">
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

    อิมเมจเริ่มต้น **ไม่มี** Node หาก skill ต้องใช้ Node (หรือ runtime อื่น ๆ) ให้ bake อิมเมจแบบกำหนดเอง หรือติดตั้งผ่าน `sandbox.docker.setupCommand` (ต้องมี network egress + root ที่เขียนได้ + ผู้ใช้ root)

    OpenClaw จะไม่แทนที่ด้วย `debian:bookworm-slim` ธรรมดาอย่างเงียบ ๆ เมื่อ `openclaw-sandbox:bookworm-slim` หายไป การรัน sandbox ที่ target อิมเมจเริ่มต้นจะล้มเหลวอย่างรวดเร็วพร้อมคำแนะนำการ build จนกว่าคุณจะ build อิมเมจนั้น เพราะอิมเมจที่รวมมามี `python3` สำหรับตัวช่วย write/edit ของ sandbox

  </Step>
  <Step title="Optional: build the common image">
    สำหรับอิมเมจ sandbox ที่ใช้งานได้มากขึ้นพร้อมเครื่องมือทั่วไป (เช่น `curl`, `jq`, `nodejs`, `python3`, `git`):

    จาก source checkout:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    จากการติดตั้ง npm ให้ build อิมเมจเริ่มต้นก่อน (ดูด้านบน) จากนั้น build อิมเมจ common ทับด้านบนโดยใช้ [`Dockerfile.sandbox-common`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-common) จาก repository

    จากนั้นตั้งค่า `agents.defaults.sandbox.docker.image` เป็น `openclaw-sandbox-common:bookworm-slim`

  </Step>
  <Step title="Optional: build the sandbox browser image">
    จาก source checkout:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    จากการติดตั้ง npm ให้ build โดยใช้ [`Dockerfile.sandbox-browser`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-browser) จาก repository

  </Step>
</Steps>

โดยค่าเริ่มต้น คอนเทนเนอร์ Docker sandbox จะรันโดย **ไม่มีเครือข่าย** แทนที่ด้วย `agents.defaults.sandbox.docker.network`

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    อิมเมจ sandbox browser ที่รวมมายังใช้ค่าเริ่มต้นการเริ่มต้น Chromium แบบระมัดระวังสำหรับ workload แบบคอนเทนเนอร์ ค่าเริ่มต้นของคอนเทนเนอร์ปัจจุบันรวมถึง:

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
    - แฟล็ก hardening ด้านกราฟิกสามรายการ (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) เป็นตัวเลือก และมีประโยชน์เมื่อคอนเทนเนอร์ไม่มีการรองรับ GPU ตั้งค่า `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หาก workload ของคุณต้องใช้ WebGL หรือฟีเจอร์ 3D/browser อื่น ๆ
    - `--disable-extensions` เปิดใช้งานโดยค่าเริ่มต้น และสามารถปิดใช้งานได้ด้วย `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` สำหรับ flow ที่พึ่งพา extension
    - `--renderer-process-limit=2` ถูกควบคุมโดย `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` โดยที่ `0` คงค่าเริ่มต้นของ Chromium

    หากคุณต้องการ runtime profile ที่แตกต่าง ให้ใช้อิมเมจ browser แบบกำหนดเองและระบุ entrypoint ของคุณเอง สำหรับโปรไฟล์ Chromium ในเครื่อง (ไม่ใช่คอนเทนเนอร์) ให้ใช้ `browser.extraArgs` เพื่อเพิ่มแฟล็กเริ่มต้นเพิ่มเติม

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` ถูกบล็อก
    - `network: "container:<id>"` ถูกบล็อกโดยค่าเริ่มต้น (ความเสี่ยงจากการ bypass การ join namespace)
    - override แบบ break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`

  </Accordion>
</AccordionGroup>

การติดตั้ง Docker และ Gateway แบบคอนเทนเนอร์อยู่ที่นี่: [Docker](/th/install/docker)

สำหรับการ deploy Docker gateway, `scripts/docker/setup.sh` สามารถ bootstrap การกำหนดค่า sandbox ได้ ตั้งค่า `OPENCLAW_SANDBOX=1` (หรือ `true`/`yes`/`on`) เพื่อเปิดใช้งานพาธนั้น คุณสามารถแทนที่ตำแหน่ง socket ด้วย `OPENCLAW_DOCKER_SOCKET` เอกสารการตั้งค่าเต็มรูปแบบและอ้างอิง env: [Docker](/th/install/docker#agent-sandbox)

## setupCommand (การตั้งค่าคอนเทนเนอร์ครั้งเดียว)

`setupCommand` รัน **หนึ่งครั้ง** หลังจากสร้างคอนเทนเนอร์ sandbox แล้ว (ไม่ใช่ทุกครั้งที่รัน) โดยดำเนินการภายในคอนเทนเนอร์ผ่าน `sh -lc`

พาธ:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Per-agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Common pitfalls">
    - ค่าเริ่มต้นของ `docker.network` คือ `"none"` (ไม่มี egress) ดังนั้นการติดตั้งแพ็กเกจจะล้มเหลว
    - `docker.network: "container:<id>"` ต้องใช้ `dangerouslyAllowContainerNamespaceJoin: true` และเป็น break-glass เท่านั้น
    - `readOnlyRoot: true` ป้องกันการเขียน; ตั้งค่า `readOnlyRoot: false` หรือ bake อิมเมจแบบกำหนดเอง
    - `user` ต้องเป็น root สำหรับการติดตั้งแพ็กเกจ (ละ `user` ไว้ หรือตั้งค่า `user: "0:0"`)
    - Sandbox exec จะ **ไม่** สืบทอด `process.env` ของ host ใช้ `agents.defaults.sandbox.docker.env` (หรืออิมเมจแบบกำหนดเอง) สำหรับคีย์ API ของ skill

  </Accordion>
</AccordionGroup>

## นโยบายเครื่องมือและช่องทางเลี่ยงข้อจำกัด

นโยบายอนุญาต/ปฏิเสธเครื่องมือยังมีผลก่อนกฎ sandbox หากเครื่องมือถูกปฏิเสธในระดับสากลหรือต่อ agent, sandboxing จะไม่นำเครื่องมือนั้นกลับมา

`tools.elevated` เป็นช่องทางเลี่ยงข้อจำกัดอย่างชัดเจนที่เรียกใช้ `exec` นอก sandbox (`gateway` ตามค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec คือ `node`) คำสั่ง `/exec` มีผลเฉพาะกับผู้ส่งที่ได้รับอนุญาตและคงอยู่ต่อ session หากต้องการปิดใช้งาน `exec` อย่างเด็ดขาด ให้ใช้นโยบายเครื่องมือแบบปฏิเสธ (ดู [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated))

การดีบัก:

- ใช้ `openclaw sandbox explain` เพื่อตรวจสอบโหมด sandbox ที่มีผล นโยบายเครื่องมือ และคีย์การกำหนดค่าสำหรับการแก้ไข
- ดู [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) สำหรับโมเดลความคิดเรื่อง "ทำไมสิ่งนี้จึงถูกบล็อก?"

ล็อกให้แน่นหนาไว้

## การ override แบบหลาย agent

แต่ละ agent สามารถ override sandbox + เครื่องมือได้: `agents.list[].sandbox` และ `agents.list[].tools` (รวมถึง `agents.list[].tools.sandbox.tools` สำหรับนโยบายเครื่องมือของ sandbox) ดู [Multi-Agent Sandbox & Tools](/th/tools/multi-agent-sandbox-tools) สำหรับลำดับความสำคัญ

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

- [Multi-Agent Sandbox & Tools](/th/tools/multi-agent-sandbox-tools) — override ราย agent และลำดับความสำคัญ
- [OpenShell](/th/gateway/openshell) — การตั้งค่า backend sandbox ที่จัดการให้ โหมด workspace และข้อมูลอ้างอิงการกำหนดค่า
- [การกำหนดค่า sandbox](/th/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) — การดีบัก "ทำไมสิ่งนี้จึงถูกบล็อก?"
- [ความปลอดภัย](/th/gateway/security)
