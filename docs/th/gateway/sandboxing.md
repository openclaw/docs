---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'การทำงานของแซนด์บ็อกซ์ OpenClaw: โหมด ขอบเขต การเข้าถึงเวิร์กสเปซ และอิมเมจ'
title: การแยกสภาพแวดล้อมแบบแซนด์บ็อกซ์
x-i18n:
    generated_at: "2026-07-19T07:18:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7e2cab130955ee38532838a97ad3c750921dad5e9fe6ed6c533837291e935cd5
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw สามารถเรียกใช้เครื่องมือภายในแบ็กเอนด์แซนด์บ็อกซ์เพื่อลดขอบเขตผลกระทบได้ การใช้แซนด์บ็อกซ์ปิดอยู่โดยค่าเริ่มต้นและควบคุมด้วย `agents.defaults.sandbox` (ส่วนกลาง) หรือ `agents.list[].sandbox` (ต่อเอเจนต์) กระบวนการ Gateway จะอยู่บนโฮสต์เสมอ เมื่อเปิดใช้ เฉพาะการเรียกใช้เครื่องมือเท่านั้นที่จะย้ายเข้าไปในแซนด์บ็อกซ์

<Note>
นี่ไม่ใช่ขอบเขตความปลอดภัยที่สมบูรณ์แบบ แต่ช่วยจำกัดการเข้าถึงระบบไฟล์และกระบวนการได้อย่างมีนัยสำคัญเมื่อโมเดลทำสิ่งที่ไม่เหมาะสม
</Note>

## สิ่งที่อยู่ในแซนด์บ็อกซ์

- การเรียกใช้เครื่องมือ: `exec`, `read`, `write`, `edit`, `apply_patch`, `process` เป็นต้น
- เบราว์เซอร์ในแซนด์บ็อกซ์ที่เป็นตัวเลือก (`agents.defaults.sandbox.browser`)

สิ่งที่ไม่อยู่ในแซนด์บ็อกซ์:

- กระบวนการ Gateway เอง
- เครื่องมือใดๆ ที่อนุญาตอย่างชัดเจนให้ทำงานนอกแซนด์บ็อกซ์ผ่าน `tools.elevated` การเรียกใช้แบบยกระดับจะข้ามการใช้แซนด์บ็อกซ์และทำงานบนเส้นทางหลบออกที่กำหนดค่าไว้ (ค่าเริ่มต้นคือ `gateway` หรือ `node` เมื่อเป้าหมายการเรียกใช้คือ `node`) หากปิดการใช้แซนด์บ็อกซ์อยู่ `tools.elevated` จะไม่เปลี่ยนแปลงสิ่งใด เนื่องจากการเรียกใช้ทำงานบนโฮสต์อยู่แล้ว ดู[โหมดยกระดับ](/th/tools/elevated)

## โหมด ขอบเขต และแบ็กเอนด์

การตั้งค่าอิสระสามรายการควบคุมลักษณะการทำงานของแซนด์บ็อกซ์:

| การตั้งค่า | คีย์                               | ค่า                       | ค่าเริ่มต้น  |
| ------- | --------------------------------- | ---------------------------- | -------- |
| โหมด    | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`    |
| ขอบเขต   | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`  |
| แบ็กเอนด์ | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker` |

**โหมด**ควบคุมว่าจะใช้แซนด์บ็อกซ์เมื่อใด:

- `off`: ไม่ใช้แซนด์บ็อกซ์
- `non-main`: ใช้แซนด์บ็อกซ์กับทุกเซสชันยกเว้นเซสชันหลักของเอเจนต์ คีย์เซสชันหลักคือ `agent:<agentId>:main` เสมอ (หรือ `global` เมื่อ `session.scope` เป็น `"global"`) และไม่สามารถกำหนดค่าได้ เซสชันกลุ่ม/ช่องทางใช้คีย์ของตนเอง จึงถือเป็นเซสชันที่ไม่ใช่เซสชันหลักเสมอและถูกใช้แซนด์บ็อกซ์
- `all`: ทุกเซสชันทำงานในแซนด์บ็อกซ์

**ขอบเขต**ควบคุมจำนวนคอนเทนเนอร์/สภาพแวดล้อมที่สร้างขึ้น:

- `agent`: หนึ่งคอนเทนเนอร์ต่อเอเจนต์
- `session`: หนึ่งคอนเทนเนอร์ต่อเซสชัน
- `shared`: หนึ่งคอนเทนเนอร์ที่ใช้ร่วมกันโดยทุกเซสชันในแซนด์บ็อกซ์ (การแทนที่ `docker`/`ssh`/`browser` ต่อเอเจนต์จะถูกละเว้นภายใต้ขอบเขตนี้)

**แบ็กเอนด์**ควบคุมว่ารันไทม์ใดเรียกใช้เครื่องมือในแซนด์บ็อกซ์ การกำหนดค่าเฉพาะ SSH อยู่ภายใต้ `agents.defaults.sandbox.ssh` ส่วนการกำหนดค่าเฉพาะ OpenShell อยู่ภายใต้ `plugins.entries.openshell.config`

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **ตำแหน่งที่ทำงาน**   | คอนเทนเนอร์ภายในเครื่อง                  | โฮสต์ใดๆ ที่เข้าถึงได้ผ่าน SSH        | แซนด์บ็อกซ์ที่จัดการโดย OpenShell                           |
| **การตั้งค่า**           | `scripts/sandbox-setup.sh`       | คีย์ SSH + โฮสต์เป้าหมาย          | เปิดใช้ Plugin OpenShell                            |
| **รูปแบบพื้นที่ทำงาน** | เมานต์แบบผูกหรือคัดลอก               | ใช้รีโมตเป็นข้อมูลหลัก (เตรียมข้อมูลครั้งเดียว)   | `mirror` หรือ `remote`                                |
| **การควบคุมเครือข่าย** | `docker.network` (ค่าเริ่มต้น: ไม่มี) | ขึ้นอยู่กับโฮสต์ระยะไกล         | ขึ้นอยู่กับ OpenShell                                |
| **แซนด์บ็อกซ์เบราว์เซอร์** | รองรับ                        | ไม่รองรับ                  | ยังไม่รองรับ                                   |
| **การเมานต์แบบผูก**     | `docker.binds`                   | ไม่มี                            | ไม่มี                                                 |
| **เหมาะที่สุดสำหรับ**        | การพัฒนาภายในเครื่อง การแยกอย่างสมบูรณ์        | การถ่ายโอนไปประมวลผลบนเครื่องระยะไกล | แซนด์บ็อกซ์ระยะไกลแบบมีการจัดการพร้อมการซิงค์สองทางที่เป็นตัวเลือก |

## แบ็กเอนด์ Docker

Docker เป็นแบ็กเอนด์เริ่มต้นเมื่อเปิดใช้แซนด์บ็อกซ์ โดยเรียกใช้เครื่องมือและเบราว์เซอร์ในแซนด์บ็อกซ์ภายในเครื่องผ่านซ็อกเก็ต Docker daemon (`/var/run/docker.sock`) และอาศัยเนมสเปซของ Docker ในการแยก

ค่าเริ่มต้น: `network: "none"` (ไม่มีการเชื่อมต่อขาออก), `readOnlyRoot: true`, `capDrop: ["ALL"]`, อิมเมจ `openclaw-sandbox:bookworm-slim`

หากต้องการเปิดให้ใช้ GPU ของโฮสต์ ให้ตั้งค่า `agents.defaults.sandbox.docker.gpus` (หรือการแทนที่ต่อเอเจนต์) เป็นค่าอย่าง `"all"` หรือ `"device=GPU-uuid"` ค่านี้จะถูกส่งไปยังแฟล็ก `--gpus` ของ Docker และต้องใช้รันไทม์ของโฮสต์ที่เข้ากันได้ เช่น NVIDIA Container Toolkit

<Warning>
**ข้อจำกัดของ Docker-out-of-Docker (DooD)**

หากคุณปรับใช้ OpenClaw Gateway เป็นคอนเทนเนอร์ Docker ตัว Gateway จะประสานงานคอนเทนเนอร์แซนด์บ็อกซ์ข้างเคียงโดยใช้ซ็อกเก็ต Docker ของโฮสต์ (DooD) ซึ่งทำให้เกิดข้อจำกัดด้านการแมปเส้นทาง:

- **การกำหนดค่าต้องใช้เส้นทางของโฮสต์**: `openclaw.json` `workspace` ต้องมี **เส้นทางสัมบูรณ์ของโฮสต์** (เช่น `/home/user/.openclaw/workspaces`) ไม่ใช่เส้นทางภายในคอนเทนเนอร์ Gateway เนื่องจาก Docker daemon ประเมินเส้นทางโดยอิงกับเนมสเปซของระบบปฏิบัติการโฮสต์ ไม่ใช่เนมสเปซของ Gateway เอง
- **ต้องมีการแมปวอลุ่มที่ตรงกัน**: กระบวนการ Gateway ยังเขียนไฟล์ Heartbeat และไฟล์บริดจ์ไปยังเส้นทาง `workspace` ดังกล่าวด้วย ให้คอนเทนเนอร์ Gateway ใช้การแมปวอลุ่มที่เหมือนกัน (`-v /home/user/.openclaw:/home/user/.openclaw`) เพื่อให้เส้นทางโฮสต์เดียวกันได้รับการแก้ไขอย่างถูกต้องจากภายในคอนเทนเนอร์ Gateway ด้วย การแมปที่ไม่ตรงกันจะแสดงเป็น `EACCES` เมื่อ Gateway พยายามเขียน Heartbeat
- **โหมดโค้ด Codex**: เมื่อแซนด์บ็อกซ์ OpenClaw ทำงานอยู่ OpenClaw จะปิดใช้ Code Mode แบบเนทีฟของ Codex app-server, เซิร์ฟเวอร์ MCP ของผู้ใช้ และการเรียกใช้ Plugin ที่มีแอปสนับสนุนสำหรับรอบนั้น (องค์ประกอบเหล่านี้ทำงานจากกระบวนการ app-server บนโฮสต์ของ Gateway ไม่ใช่จากแบ็กเอนด์แซนด์บ็อกซ์ OpenClaw) เว้นแต่นโยบายเครื่องมือของแซนด์บ็อกซ์จะเปิดเผยเครื่องมือที่จำเป็นและคุณเลือกใช้เส้นทางเซิร์ฟเวอร์เรียกใช้ในแซนด์บ็อกซ์แบบทดลอง จากนั้นการเข้าถึงเชลล์จะกำหนดเส้นทางผ่านเครื่องมือที่มีแบ็กเอนด์แซนด์บ็อกซ์ OpenClaw เช่น `sandbox_exec` และ `sandbox_process` อย่าเมานต์ซ็อกเก็ต Docker ของโฮสต์เข้าในคอนเทนเนอร์แซนด์บ็อกซ์ของเอเจนต์หรือแซนด์บ็อกซ์ Codex แบบกำหนดเอง ดูลักษณะการทำงานทั้งหมดได้ที่[ชุดควบคุม Codex](/th/plugins/codex-harness)

บนโฮสต์ Ubuntu/AppArmor ที่เปิดใช้โหมดแซนด์บ็อกซ์ Docker การเรียกใช้เชลล์ `workspace-write` ของ Codex app-server ต้องใช้เนมสเปซผู้ใช้แบบไม่รับสิทธิ์ภายในคอนเทนเนอร์แซนด์บ็อกซ์ และอาจล้มเหลวก่อนเริ่มเชลล์เมื่อผู้ใช้บริการไม่สามารถสร้างเนมสเปซดังกล่าวได้ นอกจากนี้ยังต้องใช้เนมสเปซเครือข่ายแบบไม่รับสิทธิ์เมื่อปิดการเชื่อมต่อขาออกของแซนด์บ็อกซ์ Docker (`network: "none"` ซึ่งเป็นค่าเริ่มต้น) อาการที่พบบ่อย: `bwrap: setting up uid map: Permission denied` และ `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` เรียกใช้ `openclaw doctor`; หากรายงานว่าการตรวจสอบเนมสเปซ Codex bwrap ล้มเหลว ให้ใช้โปรไฟล์ AppArmor ที่อนุญาตเนมสเปซที่จำเป็นแก่กระบวนการบริการ OpenClaw เป็นตัวเลือกแรก `kernel.apparmor_restrict_unprivileged_userns=0` เป็นทางเลือกสำรองระดับทั้งโฮสต์ที่มีข้อแลกเปลี่ยนด้านความปลอดภัย ให้ใช้เฉพาะเมื่อแนวทางความปลอดภัยของโฮสต์นั้นยอมรับได้
</Warning>

### เบราว์เซอร์ในแซนด์บ็อกซ์

- เบราว์เซอร์ในแซนด์บ็อกซ์จะเริ่มโดยอัตโนมัติ (ตรวจสอบให้แน่ใจว่าเข้าถึง CDP ได้) เมื่อเครื่องมือเบราว์เซอร์ต้องใช้งาน กำหนดค่าผ่าน `agents.defaults.sandbox.browser.autoStart` (ค่าเริ่มต้น `true`) และ `autoStartTimeoutMs` (ค่าเริ่มต้น 12s)
- คอนเทนเนอร์เบราว์เซอร์ในแซนด์บ็อกซ์ใช้เครือข่าย Docker เฉพาะ (`openclaw-sandbox-browser`) แทนเครือข่าย `bridge` ส่วนกลาง กำหนดค่าด้วย `agents.defaults.sandbox.browser.network`
- `agents.defaults.sandbox.browser.cdpSourceRange` จำกัดการรับส่งข้อมูล CDP ขาเข้าที่ขอบคอนเทนเนอร์ด้วยรายการ CIDR ที่อนุญาต (เช่น `172.21.0.1/32`)
- การเข้าถึงตัวสังเกตการณ์ noVNC ได้รับการป้องกันด้วยรหัสผ่านโดยค่าเริ่มต้น OpenClaw จะสร้าง URL โทเค็นอายุสั้นที่ให้บริการหน้าบูตสแตรปภายในเครื่องและเปิด noVNC โดยใส่รหัสผ่านไว้ในส่วน fragment ของ URL (ไม่ใช่สตริงคำค้นหรือบันทึกส่วนหัว)
- `agents.defaults.sandbox.browser.allowHostControl` (ค่าเริ่มต้น `false`) ช่วยให้เซสชันในแซนด์บ็อกซ์กำหนดเป้าหมายไปยังเบราว์เซอร์ของโฮสต์ได้อย่างชัดเจน
- รายการอนุญาตที่เป็นตัวเลือกควบคุม `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`

## แบ็กเอนด์ SSH

ใช้ `backend: "ssh"` เพื่อเรียกใช้ `exec`, เครื่องมือไฟล์ และการอ่านสื่อในแซนด์บ็อกซ์บนเครื่องใดๆ ที่เข้าถึงได้ผ่าน SSH

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
          // หรือใช้ SecretRefs / เนื้อหาแบบอินไลน์แทนไฟล์ภายในเครื่อง:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

ค่าเริ่มต้น: `command: "ssh"`, `workspaceRoot: "/tmp/openclaw-sandboxes"`, `strictHostKeyChecking: true`, `updateHostKeys: true`

- **วงจรชีวิต**: OpenClaw สร้างรูทระยะไกลต่อขอบเขตภายใต้ `sandbox.ssh.workspaceRoot` ในการใช้งานครั้งแรกหลังจากสร้างหรือสร้างใหม่ ระบบจะเตรียมพื้นที่ทำงานระยะไกลนั้นจากพื้นที่ทำงานภายในเครื่องหนึ่งครั้ง หลังจากนั้น `exec`, `read`, `write`, `edit`, `apply_patch`, การอ่านสื่อของพรอมต์ และการจัดเตรียมสื่อขาเข้า จะทำงานกับพื้นที่ทำงานระยะไกลโดยตรงผ่าน SSH OpenClaw จะไม่ซิงค์การเปลี่ยนแปลงระยะไกลกลับไปยังพื้นที่ทำงานภายในเครื่องโดยอัตโนมัติ
- **ข้อมูลสำหรับการยืนยันตัวตน**: `identityFile`/`certificateFile`/`knownHostsFile` อ้างอิงไฟล์ภายในเครื่องที่มีอยู่ `identityData`/`certificateData`/`knownHostsData` ยอมรับสตริงแบบอินไลน์หรือ SecretRefs ซึ่งแก้ไขผ่านสแนปช็อตรันไทม์ข้อมูลลับตามปกติ เขียนลงไฟล์ชั่วคราวด้วยโหมด `0600` และลบเมื่อเซสชัน SSH สิ้นสุด หากตั้งค่าทั้งตัวแปรแบบ `*File` และ `*Data` สำหรับรายการเดียวกัน `*Data` จะมีผลเหนือกว่าสำหรับเซสชันนั้น
- **ผลที่ตามมาจากการใช้รีโมตเป็นข้อมูลหลัก**: พื้นที่ทำงาน SSH ระยะไกลจะกลายเป็นสถานะแซนด์บ็อกซ์จริงหลังจากการเตรียมข้อมูลครั้งแรก การแก้ไขภายในโฮสต์ที่ทำนอก OpenClaw หลังขั้นตอนการเตรียมข้อมูลจะไม่ปรากฏบนรีโมตจนกว่าจะสร้างแซนด์บ็อกซ์ใหม่ `openclaw sandbox recreate` จะลบรูทระยะไกลต่อขอบเขตและเตรียมข้อมูลจากภายในเครื่องอีกครั้งในการใช้งานครั้งถัดไป แบ็กเอนด์นี้ไม่รองรับการใช้เบราว์เซอร์ในแซนด์บ็อกซ์ และการตั้งค่า `sandbox.docker.*` ไม่มีผลกับแบ็กเอนด์นี้

## แบ็กเอนด์ OpenShell

ใช้ `backend: "openshell"` เพื่อเรียกใช้เครื่องมือในแซนด์บ็อกซ์ภายในสภาพแวดล้อมระยะไกลที่จัดการโดย OpenShell โดย OpenShell ใช้การรับส่งข้อมูล SSH และบริดจ์ระบบไฟล์ระยะไกลแบบเดียวกับแบ็กเอนด์ SSH ทั่วไป และเพิ่มวงจรชีวิตของ OpenShell (`sandbox create/get/delete/ssh-config`) พร้อมโหมดซิงค์พื้นที่ทำงาน `mirror` ที่เป็นตัวเลือก

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
          mode: "remote", // มิเรอร์ | รีโมต
        },
      },
    },
  },
}
```

`mode: "mirror"` (ค่าเริ่มต้น) คงพื้นที่ทำงานภายในเครื่องไว้เป็นแหล่งข้อมูลหลัก: OpenClaw ซิงค์ข้อมูลภายในเครื่องเข้าแซนด์บ็อกซ์ก่อน `exec` และซิงค์กลับหลังจากนั้น `mode: "remote"` เตรียมพื้นที่ทำงานระยะไกลครั้งเดียวจากข้อมูลภายในเครื่อง จากนั้นเรียกใช้ `exec`/`read`/`write`/`edit`/`apply_patch` กับพื้นที่ทำงานระยะไกลโดยตรงโดยไม่ซิงค์กลับ การแก้ไขภายในเครื่องหลังการเตรียมครั้งแรกจะไม่ปรากฏจนกว่าจะ `openclaw sandbox recreate` ภายใต้ `scope: "agent"` หรือ `scope: "shared"` พื้นที่ทำงานระยะไกลนั้นจะใช้ร่วมกันในขอบเขตเดียวกัน ข้อจำกัดปัจจุบัน: ยังไม่รองรับเบราว์เซอร์แซนด์บ็อกซ์ และ `sandbox.docker.binds` ไม่มีผลกับแบ็กเอนด์นี้

`openclaw sandbox list`/`recreate`/prune จะจัดการรันไทม์ OpenShell เช่นเดียวกับรันไทม์ Docker ทั้งหมด ตรรกะการล้างข้อมูลจะรับรู้แบ็กเอนด์

ดูข้อกำหนดเบื้องต้นทั้งหมด เอกสารอ้างอิงการกำหนดค่า การเปรียบเทียบโหมดพื้นที่ทำงาน และรายละเอียดวงจรชีวิตได้ที่ [OpenShell](/th/gateway/openshell)

## การเข้าถึงพื้นที่ทำงาน

`agents.defaults.sandbox.workspaceAccess` ควบคุมสิ่งที่แซนด์บ็อกซ์มองเห็นได้:

| ค่า            | ลักษณะการทำงาน                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `none` (ค่าเริ่มต้น) | เครื่องมือจะเห็นพื้นที่ทำงานแซนด์บ็อกซ์แบบแยกภายใต้ `~/.openclaw/sandboxes`                    |
| `ro`             | เมานต์พื้นที่ทำงานของเอเจนต์แบบอ่านอย่างเดียวที่ `/agent` (ปิดใช้งาน `write`/`edit`/`apply_patch`) |
| `rw`             | เมานต์พื้นที่ทำงานของเอเจนต์แบบอ่าน/เขียนที่ `/workspace`                                    |

เมื่อใช้แบ็กเอนด์ OpenShell โหมด `mirror` ยังคงใช้พื้นที่ทำงานภายในเครื่องเป็นแหล่งข้อมูลหลักระหว่างรอบการเรียกใช้ exec ส่วนโหมด `remote` จะใช้พื้นที่ทำงาน OpenShell ระยะไกลเป็นแหล่งข้อมูลหลักหลังการเตรียมครั้งแรก และ `workspaceAccess: "ro"`/`"none"` ยังคงจำกัดพฤติกรรมการเขียนในลักษณะเดียวกัน

สื่อขาเข้าจะถูกคัดลอกไปยังพื้นที่ทำงานแซนด์บ็อกซ์ที่ใช้งานอยู่ (`media/inbound/*`)

<Note>
**Skills**: เครื่องมือ `read` จะอ้างอิงจากรากของแซนด์บ็อกซ์ เมื่อใช้ `workspaceAccess: "none"` OpenClaw จะทำสำเนา Skills ที่เข้าเกณฑ์ไปยังพื้นที่ทำงานแซนด์บ็อกซ์ (`.../skills`) เพื่อให้สามารถอ่านได้ เมื่อใช้ `"rw"` Skills ในพื้นที่ทำงานจะอ่านได้จาก `/workspace/skills` และ Skills ที่เข้าเกณฑ์ซึ่งเป็นแบบจัดการ แบบรวมมาให้ หรือจาก Plugin จะถูกสร้างไว้ในพาธแบบอ่านอย่างเดียวที่สร้างขึ้น `/workspace/.openclaw/sandbox-skills/skills`
</Note>

## หลายโฟลเดอร์สำหรับเอเจนต์หนึ่งตัว

ใช้การเมานต์แบบ bind ของ Docker เมื่อเอเจนต์ที่อยู่ในแซนด์บ็อกซ์ต้องใช้โฟลเดอร์เพิ่มเติมนอกเหนือจากพื้นที่ทำงานหลัก แต่ละรายการจะแมปโฟลเดอร์โฮสต์ไปยังพาธคอนเทนเนอร์พร้อมระบุโหมดการเข้าถึงอย่างชัดเจน:

```text
host-directory:container-directory:ro
host-directory:container-directory:rw
```

- `ro` ทำให้โฟลเดอร์ที่เมานต์เป็นแบบอ่านอย่างเดียวภายในแซนด์บ็อกซ์
- `rw` อนุญาตให้เครื่องมือและกระบวนการในแซนด์บ็อกซ์แก้ไขโฟลเดอร์โฮสต์ได้
- พาธคอนเทนเนอร์คือพาธที่เอเจนต์ใช้ พาธโฮสต์จะไม่ถูกเปิดเผยโดยอัตโนมัติ

ตัวอย่างนี้กำหนดให้เอเจนต์ `research` มีพื้นที่ทำงานหลักที่เขียนได้ มีเอกสารอ้างอิงแบบอ่านอย่างเดียวที่ `/reference` และมีโฟลเดอร์เอาต์พุตแยกที่เขียนได้ที่ `/drafts`:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        scope: "agent",
      },
    },
    list: [
      {
        id: "research",
        workspace: "/srv/openclaw/research-workspace",
        sandbox: {
          workspaceAccess: "rw",
          docker: {
            binds: ["/srv/shared/reference:/reference:ro", "/srv/shared/drafts:/drafts:rw"],
            // จำเป็นเนื่องจากแหล่งข้อมูลเหล่านี้อยู่นอกพื้นที่ทำงานของเอเจนต์
            dangerouslyAllowExternalBindSources: true,
          },
        },
      },
    ],
  },
}
```

`workspaceAccess` และโหมด bind เป็นอิสระจากกัน:

| การตั้งค่า                          | สิ่งที่ควบคุม                                                                    |
| -------------------------------- | --------------------------------------------------------------------------- |
| `workspaceAccess: "none"`        | ใช้พื้นที่ทำงานแซนด์บ็อกซ์แบบแยก โดยไม่เปิดเผยพื้นที่ทำงานของเอเจนต์    |
| `workspaceAccess: "ro"`          | เมานต์พื้นที่ทำงานของเอเจนต์แบบอ่านอย่างเดียวที่ `/agent`                           |
| `workspaceAccess: "rw"`          | เมานต์พื้นที่ทำงานของเอเจนต์แบบอ่าน/เขียนที่ `/workspace`                      |
| รายการ `docker.binds` `:ro`/`:rw` | ควบคุมเฉพาะโฟลเดอร์โฮสต์เพิ่มเติมนั้นที่พาธคอนเทนเนอร์ซึ่งกำหนดไว้ |

การเปลี่ยน `workspaceAccess` จะไม่เปลี่ยน bind เพิ่มเติมจาก `ro` เป็น `rw` หรือในทางกลับกัน `docker.binds` ระดับโกลบอลและระดับเอเจนต์จะถูกรวมกัน ให้คง `scope: "agent"` หรือ `"session"` ไว้สำหรับ bind ระดับเอเจนต์ ส่วน `scope: "shared"` จะละเว้นการเขียนทับ Docker ระดับเอเจนต์ทั้งหมดและใช้เฉพาะ bind ระดับโกลบอล

การเมานต์แบบ bind เป็นขอบเขตหลายโฟลเดอร์ที่รองรับ เนื่องจาก Docker สร้างมุมมองระบบไฟล์ของคอนเทนเนอร์ด้วยการแยกเมานต์ และโหมด `ro`/`rw` มีผลกับทุกกระบวนการในแซนด์บ็อกซ์ ขอบเขตนี้ครอบคลุม `exec` เครื่องมือระบบไฟล์ กระบวนการลูก และไลบรารี โดยไม่ต้องทำซ้ำการตรวจสอบสิทธิ์พาธในแต่ละเส้นทางโค้ดของ OpenClaw รายการอนุญาตพาธฝั่งโฮสต์ไม่สามารถให้ขอบเขตที่สมบูรณ์เท่ากันได้ เมื่อเชลล์หรือการขึ้นต่อกันที่ได้รับอนุญาตสามารถเข้าถึงไฟล์โดยตรง

`dangerouslyAllowExternalBindSources` ที่ต้องเลือกเปิดใช้จะอนุญาตเฉพาะแหล่งข้อมูลภายนอกรากพื้นที่ทำงานเท่านั้น โดยไม่ได้ปิดใช้การตรวจสอบพาธระบบ ข้อมูลรับรอง ซ็อกเก็ต Docker พาเรนต์ที่เป็น symlink หรือเป้าหมายที่สงวนไว้ซึ่ง OpenClaw บล็อก ให้เลือกโฟลเดอร์ที่เล็กที่สุด ใช้ `ro` เว้นแต่จำเป็นต้องเขียน และสร้างแซนด์บ็อกซ์ใหม่หลังเปลี่ยนการเมานต์:

```bash
openclaw sandbox recreate --agent research
```

### พฤติกรรม bind อื่นๆ

`agents.defaults.sandbox.docker.binds` กำหนดค่าการเมานต์ระดับโกลบอล รูปแบบเป็นแบบ `host:container:mode` เดียวกัน (ตัวอย่างเช่น `"/home/user/source:/source:rw"`)

`agents.defaults.sandbox.browser.binds` เมานต์ไดเรกทอรีโฮสต์เพิ่มเติมเข้าไปในคอนเทนเนอร์ **เบราว์เซอร์แซนด์บ็อกซ์** เท่านั้น เมื่อตั้งค่า (รวมถึง `[]`) ค่านี้จะแทนที่ `docker.binds` สำหรับคอนเทนเนอร์เบราว์เซอร์ หากละเว้น คอนเทนเนอร์เบราว์เซอร์จะย้อนกลับไปใช้ `docker.binds`

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

- Bind จะข้ามระบบไฟล์แซนด์บ็อกซ์ โดยเปิดเผยพาธโฮสต์ตามโหมดที่กำหนด (`:ro` หรือ `:rw`)
- OpenClaw บล็อกแหล่ง bind ที่เป็นอันตรายตามค่าเริ่มต้น ได้แก่ พาธระบบ (`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`) ไดเรกทอรีซ็อกเก็ต Docker (`/run`, `/var/run` และรูปแบบ `docker.sock` ของพาธเหล่านั้น) และรากข้อมูลรับรองที่พบบ่อยในโฮมไดเรกทอรี (`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`)
- การตรวจสอบจะปรับพาธต้นทางให้เป็นมาตรฐาน แล้วแก้พาธอีกครั้งผ่านบรรพบุรุษที่ลึกที่สุดซึ่งมีอยู่ ก่อนตรวจสอบพาธที่บล็อกและรากที่อนุญาตซ้ำ ดังนั้นการหลบหนีผ่านพาเรนต์ที่เป็น symlink จะถูกปฏิเสธอย่างปลอดภัย แม้ปลายทางสุดท้ายยังไม่มีอยู่ (เช่น `/workspace/run-link/new-file` ยังคงแก้พาธเป็น `/var/run/...` หาก `run-link` ชี้ไปที่นั่น)
- เป้าหมาย bind ที่บดบังจุดเมานต์คอนเทนเนอร์ที่สงวนไว้ (`/workspace`, `/agent`) จะถูกบล็อกตามค่าเริ่มต้นด้วยเช่นกัน เขียนทับได้ด้วย `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true`
- แหล่ง bind ที่อยู่นอกรากพื้นที่ทำงาน/พื้นที่ทำงานของเอเจนต์ในรายการอนุญาตจะถูกบล็อกตามค่าเริ่มต้น เขียนทับได้ด้วย `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true` รากที่อนุญาตจะถูกทำให้เป็นพาธมาตรฐานด้วยวิธีเดียวกัน ดังนั้นพาธที่ดูเหมือนอยู่ภายในรายการอนุญาตก่อนแก้ symlink แต่จริงๆ แล้วอยู่นอกรากที่อนุญาตจะยังคงถูกปฏิเสธ
- การเมานต์ข้อมูลที่ละเอียดอ่อน (ข้อมูลลับ คีย์ SSH ข้อมูลรับรองบริการ) ควรเป็น `:ro` เว้นแต่จำเป็นอย่างยิ่ง
- ใช้ร่วมกับ `workspaceAccess: "ro"` หากต้องการเพียงสิทธิ์อ่านพื้นที่ทำงาน โดยโหมด bind ยังคงเป็นอิสระจากกัน
- ดูวิธีที่ bind ทำงานร่วมกับนโยบายเครื่องมือและ exec แบบยกระดับสิทธิ์ได้ที่ [แซนด์บ็อกซ์เทียบกับนโยบายเครื่องมือเทียบกับการยกระดับสิทธิ์](/th/gateway/sandbox-vs-tool-policy-vs-elevated)

</Warning>

## อิมเมจและการตั้งค่า

อิมเมจ Docker เริ่มต้น: `openclaw-sandbox:bookworm-slim`

<Note>
**เช็กเอาต์ซอร์สเทียบกับการติดตั้งด้วย npm**

สคริปต์ตัวช่วย `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` และ `scripts/sandbox-browser-setup.sh` มีให้ใช้เฉพาะเมื่อเรียกใช้จาก [เช็กเอาต์ซอร์ส](https://github.com/openclaw/openclaw) เท่านั้น และไม่รวมอยู่ในแพ็กเกจ npm

หากติดตั้ง OpenClaw ผ่าน `npm install -g openclaw` ให้ใช้คำสั่ง `docker build` แบบอินไลน์ที่แสดงด้านล่างแทน
</Note>

<Steps>
  <Step title="สร้างอิมเมจเริ่มต้น">
    จากเช็กเอาต์ซอร์ส:

    ```bash
    scripts/sandbox-setup.sh
    ```

    จากการติดตั้งด้วย npm (ไม่จำเป็นต้องมีเช็กเอาต์ซอร์ส):

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

    อิมเมจเริ่มต้น **ไม่มี** Node หาก Skill ต้องใช้ Node (หรือรันไทม์อื่น) ให้สร้างอิมเมจแบบกำหนดเองที่รวมสิ่งเหล่านั้นไว้ หรือติดตั้งผ่าน `sandbox.docker.setupCommand` (ต้องมีการเชื่อมต่อเครือข่ายขาออก + รากที่เขียนได้ + ผู้ใช้ root)

    OpenClaw จะไม่แทนที่ด้วย `debian:bookworm-slim` แบบธรรมดาโดยไม่แจ้งเมื่อไม่มี `openclaw-sandbox:bookworm-slim` การเรียกใช้แซนด์บ็อกซ์ที่กำหนดเป้าหมายไปยังอิมเมจเริ่มต้นจะล้มเหลวทันทีพร้อมคำแนะนำการสร้างจนกว่าจะสร้างอิมเมจ เนื่องจากอิมเมจที่รวมมาให้มี `python3` สำหรับตัวช่วยเขียน/แก้ไขในแซนด์บ็อกซ์

  </Step>
  <Step title="ไม่บังคับ: สร้างอิมเมจทั่วไป">
    สำหรับอิมเมจแซนด์บ็อกซ์ที่มีความสามารถมากขึ้นพร้อมเครื่องมือที่ใช้ทั่วไป (ตัวอย่างเช่น `curl`, `jq`, Node 24, pnpm, `python3` และ `git`):

    จากเช็กเอาต์ซอร์ส:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    จากการติดตั้งด้วย npm ให้สร้างอิมเมจเริ่มต้นก่อน (ดูด้านบน) จากนั้นสร้างอิมเมจทั่วไปต่อยอดโดยใช้ [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) จากที่เก็บ

    จากนั้นตั้งค่า `agents.defaults.sandbox.docker.image` เป็น `openclaw-sandbox-common:bookworm-slim`

  </Step>
  <Step title="ไม่บังคับ: สร้างอิมเมจเบราว์เซอร์แซนด์บ็อกซ์">
    จากเช็กเอาต์ซอร์ส:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    จากการติดตั้งด้วย npm ให้สร้างโดยใช้ [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) จากที่เก็บ

  </Step>
</Steps>

ตามค่าเริ่มต้น คอนเทนเนอร์แซนด์บ็อกซ์ Docker จะทำงานโดย **ไม่มีเครือข่าย** เขียนทับได้ด้วย `agents.defaults.sandbox.docker.network`

<AccordionGroup>
  <Accordion title="ค่าเริ่มต้น Chromium ของเบราว์เซอร์แซนด์บ็อกซ์">
    อิมเมจเบราว์เซอร์แซนด์บ็อกซ์ที่รวมมาให้ใช้แฟล็กเริ่มต้น Chromium แบบระมัดระวังสำหรับเวิร์กโหลดในคอนเทนเนอร์:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--password-store=basic`
    - `--use-mock-keychain`
    - `--headless=new` เมื่อเปิดใช้งาน `browser.headless`
    - `--no-sandbox --disable-setuid-sandbox` เมื่อเปิดใช้งาน `browser.noSandbox`
    - `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer` เป็นค่าเริ่มต้น แฟล็กเสริมความปลอดภัยด้านกราฟิกเหล่านี้ช่วยให้คอนเทนเนอร์ที่ไม่รองรับ GPU ทำงานได้ ตั้งค่า `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากเวิร์กโหลดต้องใช้ WebGL หรือคุณสมบัติ 3D อื่นๆ
    - `--disable-extensions` เป็นค่าเริ่มต้น ตั้งค่า `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` สำหรับโฟลว์ที่ต้องพึ่งพาส่วนขยาย
    - `--renderer-process-limit=2` เป็นค่าเริ่มต้น โดยควบคุมด้วย `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ซึ่ง `0` จะคงค่าเริ่มต้นของ Chromium ไว้

    หากต้องการโปรไฟล์รันไทม์อื่น ให้ใช้อิมเมจเบราว์เซอร์แบบกำหนดเองและระบุ entrypoint ของคุณเอง สำหรับโปรไฟล์ Chromium ภายในเครื่อง (ที่ไม่ใช่คอนเทนเนอร์) ให้ใช้ `browser.extraArgs` เพื่อเพิ่มแฟล็กเริ่มต้นเพิ่มเติม

  </Accordion>
  <Accordion title="ค่าเริ่มต้นด้านความปลอดภัยเครือข่าย">
    - `network: "host"` ถูกบล็อก
    - `network: "container:<id>"` ถูกบล็อกโดยค่าเริ่มต้น (มีความเสี่ยงจากการข้ามข้อจำกัดด้วยการเข้าร่วม namespace)
    - การข้ามข้อจำกัดในกรณีฉุกเฉิน: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`

  </Accordion>
</AccordionGroup>

การติดตั้ง Docker และ Gateway แบบคอนเทนเนอร์อยู่ที่นี่: [Docker](/th/install/docker)

สำหรับการปรับใช้ Gateway ด้วย Docker นั้น `scripts/docker/setup.sh` สามารถตั้งค่าคอนฟิก sandbox เริ่มต้นได้ ตั้งค่า `OPENCLAW_SANDBOX=1` (หรือ `true`/`yes`/`on`) เพื่อเปิดใช้งานเส้นทางนี้ เปลี่ยนตำแหน่งซ็อกเก็ตได้ด้วย `OPENCLAW_DOCKER_SOCKET` ดูการตั้งค่าแบบเต็มและข้อมูลอ้างอิงตัวแปรสภาพแวดล้อมได้ที่: [Docker](/th/install/docker#agent-sandbox)

## setupCommand (การตั้งค่าคอนเทนเนอร์ครั้งเดียว)

`setupCommand` ทำงาน **หนึ่งครั้ง** หลังจากสร้างคอนเทนเนอร์ sandbox แล้ว (ไม่ใช่ทุกครั้งที่เรียกใช้) โดยดำเนินการภายในคอนเทนเนอร์ผ่าน `sh -lc`

พาธ:

- ส่วนกลาง: `agents.defaults.sandbox.docker.setupCommand`
- ต่อเอเจนต์: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="ข้อผิดพลาดที่พบบ่อย">
    - ค่าเริ่มต้นของ `docker.network` คือ `"none"` (ไม่มีการเชื่อมต่อขาออก) ดังนั้นการติดตั้งแพ็กเกจจะล้มเหลว
    - `docker.network: "container:<id>"` ต้องใช้ `dangerouslyAllowContainerNamespaceJoin: true` และมีไว้สำหรับข้ามข้อจำกัดในกรณีฉุกเฉินเท่านั้น
    - `readOnlyRoot: true` ป้องกันการเขียน ให้ตั้งค่า `readOnlyRoot: false` หรือสร้างอิมเมจแบบกำหนดเอง
    - `user` ต้องเป็น root สำหรับการติดตั้งแพ็กเกจ (ละเว้น `user` หรือตั้งค่า `user: "0:0"`)
    - การดำเนินการใน sandbox **ไม่** รับช่วงค่า `process.env` จากโฮสต์ ให้ใช้ `agents.defaults.sandbox.docker.env` (หรืออิมเมจแบบกำหนดเอง) สำหรับคีย์ API ของ Skills
    - ค่าใน `agents.defaults.sandbox.docker.env` จะถูกส่งเป็นตัวแปรสภาพแวดล้อมของคอนเทนเนอร์ Docker โดยตรง ผู้ที่เข้าถึง Docker daemon ได้สามารถตรวจสอบค่าเหล่านี้ด้วยคำสั่งเมตาดาต้าของ Docker เช่น `docker inspect` หากไม่สามารถยอมรับการเปิดเผยผ่านเมตาดาต้าดังกล่าวได้ ให้ใช้อิมเมจแบบกำหนดเอง ไฟล์ข้อมูลลับที่เมานต์ไว้ หรือช่องทางอื่นในการส่งข้อมูลลับ

  </Accordion>
</AccordionGroup>

## นโยบายเครื่องมือและช่องทางข้ามข้อจำกัด

นโยบายอนุญาต/ปฏิเสธเครื่องมือยังคงมีผลก่อนกฎ sandbox หากเครื่องมือถูกปฏิเสธในระดับส่วนกลางหรือต่อเอเจนต์ sandbox จะไม่ทำให้เครื่องมือนั้นกลับมาใช้งานได้

`tools.elevated` เป็นช่องทางข้ามข้อจำกัดโดยชัดแจ้ง ซึ่งเรียกใช้ `exec` นอก sandbox (ค่าเริ่มต้นคือ `gateway` หรือ `node` เมื่อเป้าหมายการดำเนินการคือ `node`) คำสั่งกำกับ `/exec` มีผลเฉพาะกับผู้ส่งที่ได้รับอนุญาตและคงอยู่ตลอดเซสชัน หากต้องการปิดใช้งาน `exec` อย่างเด็ดขาด ให้ใช้นโยบายเครื่องมือแบบปฏิเสธ (ดู [Sandbox เทียบกับนโยบายเครื่องมือเทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated))

การดีบัก:

- `openclaw sandbox list` แสดงคอนเทนเนอร์ sandbox สถานะ ความตรงกันของอิมเมจ อายุ เวลาที่ไม่มีการใช้งาน และเซสชัน/เอเจนต์ที่เกี่ยวข้อง
- `openclaw sandbox explain [--session <key>] [--agent <id>]` ตรวจสอบโหมด sandbox ที่มีผล เวิร์กสเปซของโฮสต์ ไดเรกทอรีทำงานของรันไทม์ การเมานต์ Docker นโยบายเครื่องมือ และคีย์คอนฟิกสำหรับแก้ไข ฟิลด์ `workspaceRoot` ยังคงเป็นราก sandbox ที่กำหนดค่าไว้ ส่วน `effectiveHostWorkspaceRoot` แสดงตำแหน่งจริงของเวิร์กสเปซที่ใช้งานอยู่
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` ลบคอนเทนเนอร์/สภาพแวดล้อม เพื่อให้สร้างใหม่ด้วยคอนฟิกปัจจุบันในการใช้งานครั้งถัดไป
- ดู [Sandbox เทียบกับนโยบายเครื่องมือเทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) สำหรับกรอบความคิดในการวิเคราะห์ว่า "เหตุใดสิ่งนี้จึงถูกบล็อก"

## การกำหนดค่าทับสำหรับหลายเอเจนต์

แต่ละเอเจนต์สามารถกำหนดค่า sandbox และเครื่องมือทับได้ด้วย: `agents.list[].sandbox` และ `agents.list[].tools` (รวมถึง `agents.list[].tools.sandbox.tools` สำหรับนโยบายเครื่องมือของ sandbox) ดูลำดับความสำคัญได้ที่ [Sandbox และเครื่องมือสำหรับหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)

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

- [Sandbox และเครื่องมือสำหรับหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) -- การกำหนดค่าทับต่อเอเจนต์และลำดับความสำคัญ
- [OpenShell](/th/gateway/openshell) -- การตั้งค่าแบ็กเอนด์ sandbox ที่มีการจัดการ โหมดเวิร์กสเปซ และข้อมูลอ้างอิงคอนฟิก
- [การกำหนดค่า sandbox](/th/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox เทียบกับนโยบายเครื่องมือเทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) -- การดีบักว่า "เหตุใดสิ่งนี้จึงถูกบล็อก"
- [ความปลอดภัย](/th/gateway/security)
