---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'การทำงานของแซนด์บ็อกซ์ใน OpenClaw: โหมด ขอบเขต การเข้าถึงพื้นที่ทำงาน และอิมเมจ'
title: แซนด์บ็อกซ์
x-i18n:
    generated_at: "2026-07-12T16:12:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60d6695c5d8f4e8d3bfb80dd387a50c104dc4e140d5974a66d5a2176594782a4
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw สามารถเรียกใช้เครื่องมือภายในแบ็กเอนด์แซนด์บ็อกซ์เพื่อลดขอบเขตความเสียหายได้ การแซนด์บ็อกซ์จะปิดอยู่โดยค่าเริ่มต้นและควบคุมด้วย `agents.defaults.sandbox` (ส่วนกลาง) หรือ `agents.list[].sandbox` (ต่อเอเจนต์) กระบวนการ Gateway จะทำงานอยู่บนโฮสต์เสมอ เมื่อเปิดใช้งาน เฉพาะการเรียกใช้เครื่องมือเท่านั้นที่ย้ายเข้าไปในแซนด์บ็อกซ์

<Note>
นี่ไม่ใช่ขอบเขตความปลอดภัยที่สมบูรณ์แบบ แต่ช่วยจำกัดการเข้าถึงระบบไฟล์และกระบวนการได้อย่างมีนัยสำคัญเมื่อโมเดลทำสิ่งที่ไม่เหมาะสม
</Note>

## สิ่งที่ทำงานในแซนด์บ็อกซ์

- การเรียกใช้เครื่องมือ: `exec`, `read`, `write`, `edit`, `apply_patch`, `process` เป็นต้น
- เบราว์เซอร์ในแซนด์บ็อกซ์ซึ่งเป็นตัวเลือกเสริม (`agents.defaults.sandbox.browser`)

สิ่งที่ไม่ทำงานในแซนด์บ็อกซ์:

- ตัวกระบวนการ Gateway เอง
- เครื่องมือใดก็ตามที่ได้รับอนุญาตอย่างชัดเจนให้ทำงานนอกแซนด์บ็อกซ์ผ่าน `tools.elevated` การเรียกใช้แบบยกระดับจะข้ามการแซนด์บ็อกซ์และทำงานบนเส้นทางออกที่กำหนดค่าไว้ (`gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อเป้าหมายการเรียกใช้คือ `node`) หากปิดการแซนด์บ็อกซ์ `tools.elevated` จะไม่เปลี่ยนแปลงสิ่งใด เนื่องจากการเรียกใช้ทำงานบนโฮสต์อยู่แล้ว โปรดดู [โหมดยกระดับ](/th/tools/elevated)

## โหมด ขอบเขต และแบ็กเอนด์

การตั้งค่าอิสระสามรายการควบคุมลักษณะการทำงานของแซนด์บ็อกซ์:

| การตั้งค่า | คีย์                               | ค่า                           | ค่าเริ่มต้น |
| ------- | --------------------------------- | ---------------------------- | -------- |
| โหมด    | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`    |
| ขอบเขต   | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`  |
| แบ็กเอนด์ | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker` |

**โหมด** ควบคุมว่าจะใช้การแซนด์บ็อกซ์เมื่อใด:

- `off`: ไม่มีการแซนด์บ็อกซ์
- `non-main`: แซนด์บ็อกซ์ทุกเซสชันยกเว้นเซสชันหลักของเอเจนต์ คีย์เซสชันหลักคือ `agent:<agentId>:main` เสมอ (หรือ `global` เมื่อ `session.scope` เป็น `"global"`) และไม่สามารถกำหนดค่าได้ เซสชันกลุ่ม/ช่องทางใช้คีย์ของตนเอง จึงถือว่าไม่ใช่เซสชันหลักเสมอและจะทำงานในแซนด์บ็อกซ์
- `all`: ทุกเซสชันทำงานในแซนด์บ็อกซ์

**ขอบเขต** ควบคุมจำนวนคอนเทนเนอร์/สภาพแวดล้อมที่สร้างขึ้น:

- `agent`: หนึ่งคอนเทนเนอร์ต่อเอเจนต์
- `session`: หนึ่งคอนเทนเนอร์ต่อเซสชัน
- `shared`: หนึ่งคอนเทนเนอร์ที่ใช้ร่วมกันโดยทุกเซสชันที่อยู่ในแซนด์บ็อกซ์ (การแทนที่ `docker`/`ssh`/`browser` ต่อเอเจนต์จะถูกละเว้นภายใต้ขอบเขตนี้)

**แบ็กเอนด์** ควบคุมว่ารันไทม์ใดเรียกใช้เครื่องมือในแซนด์บ็อกซ์ การกำหนดค่าเฉพาะ SSH อยู่ภายใต้ `agents.defaults.sandbox.ssh` ส่วนการกำหนดค่าเฉพาะ OpenShell อยู่ภายใต้ `plugins.entries.openshell.config`

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **ตำแหน่งที่ทำงาน**   | คอนเทนเนอร์ในเครื่อง                  | โฮสต์ใดก็ได้ที่เข้าถึงผ่าน SSH        | แซนด์บ็อกซ์ที่จัดการโดย OpenShell                        |
| **การตั้งค่า**           | `scripts/sandbox-setup.sh`       | คีย์ SSH + โฮสต์เป้าหมาย          | เปิดใช้งาน Plugin OpenShell                            |
| **รูปแบบพื้นที่ทำงาน** | เมานต์แบบผูกหรือคัดลอก               | ใช้ฝั่งระยะไกลเป็นหลัก (ป้อนข้อมูลครั้งเดียว) | `mirror` หรือ `remote`                                |
| **การควบคุมเครือข่าย** | `docker.network` (ค่าเริ่มต้น: ไม่มี) | ขึ้นอยู่กับโฮสต์ระยะไกล              | ขึ้นอยู่กับ OpenShell                                  |
| **เบราว์เซอร์แซนด์บ็อกซ์** | รองรับ                         | ไม่รองรับ                        | ยังไม่รองรับ                                           |
| **การเมานต์แบบผูก**     | `docker.binds`                   | ไม่มี                            | ไม่มี                                                 |
| **เหมาะที่สุดสำหรับ**    | การพัฒนาในเครื่อง, การแยกอย่างสมบูรณ์ | การถ่ายโอนไปทำงานบนเครื่องระยะไกล | แซนด์บ็อกซ์ระยะไกลที่มีการจัดการพร้อมการซิงค์สองทางซึ่งเลือกใช้ได้ |

## แบ็กเอนด์ Docker

Docker เป็นแบ็กเอนด์เริ่มต้นเมื่อเปิดใช้งานการแซนด์บ็อกซ์ โดยจะเรียกใช้เครื่องมือและเบราว์เซอร์แซนด์บ็อกซ์ในเครื่องผ่านซ็อกเก็ตดีมอน Docker (`/var/run/docker.sock`) และใช้เนมสเปซของ Docker เพื่อแยกสภาพแวดล้อม

ค่าเริ่มต้น: `network: "none"` (ไม่มีการเชื่อมต่อขาออก), `readOnlyRoot: true`, `capDrop: ["ALL"]`, อิมเมจ `openclaw-sandbox:bookworm-slim`

หากต้องการเปิดให้ใช้ GPU ของโฮสต์ ให้ตั้งค่า `agents.defaults.sandbox.docker.gpus` (หรือค่าที่แทนที่ต่อเอเจนต์) เป็นค่าอย่าง `"all"` หรือ `"device=GPU-uuid"` ค่านี้จะถูกส่งไปยังแฟล็ก `--gpus` ของ Docker และต้องใช้รันไทม์โฮสต์ที่เข้ากันได้ เช่น NVIDIA Container Toolkit

<Warning>
**ข้อจำกัดของ Docker-out-of-Docker (DooD)**

หากคุณปรับใช้ตัว OpenClaw Gateway เองเป็นคอนเทนเนอร์ Docker ตัว Gateway จะจัดการคอนเทนเนอร์แซนด์บ็อกซ์ข้างเคียงโดยใช้ซ็อกเก็ต Docker ของโฮสต์ (DooD) ซึ่งทำให้เกิดข้อจำกัดในการแมปเส้นทางดังนี้:

- **การกำหนดค่าต้องใช้เส้นทางของโฮสต์**: `workspace` ใน `openclaw.json` ต้องระบุ **เส้นทางสัมบูรณ์ของโฮสต์** (เช่น `/home/user/.openclaw/workspaces`) ไม่ใช่เส้นทางภายในคอนเทนเนอร์ Gateway ดีมอน Docker ประเมินเส้นทางโดยอิงเนมสเปซของระบบปฏิบัติการโฮสต์ ไม่ใช่เนมสเปซของ Gateway เอง
- **ต้องมีการแมปโวลุ่มที่ตรงกัน**: กระบวนการ Gateway ยังเขียนไฟล์ Heartbeat และไฟล์บริดจ์ไปยังเส้นทาง `workspace` นั้นด้วย ให้คอนเทนเนอร์ Gateway ใช้การแมปโวลุ่มที่เหมือนกัน (`-v /home/user/.openclaw:/home/user/.openclaw`) เพื่อให้เส้นทางเดียวกันบนโฮสต์แปลผลได้ถูกต้องจากภายในคอนเทนเนอร์ Gateway เช่นกัน การแมปที่ไม่ตรงกันจะแสดงข้อผิดพลาด `EACCES` เมื่อ Gateway พยายามเขียน Heartbeat
- **โหมดโค้ดของ Codex**: เมื่อแซนด์บ็อกซ์ OpenClaw ทำงานอยู่ OpenClaw จะปิดใช้งาน Code Mode แบบเนทีฟของเซิร์ฟเวอร์แอป Codex, เซิร์ฟเวอร์ MCP ของผู้ใช้ และการเรียกใช้ Plugin ที่มีแอปรองรับสำหรับรอบนั้น (สิ่งเหล่านี้ทำงานจากกระบวนการเซิร์ฟเวอร์แอปบนโฮสต์ Gateway ไม่ใช่จากแบ็กเอนด์แซนด์บ็อกซ์ OpenClaw) เว้นแต่นโยบายเครื่องมือของแซนด์บ็อกซ์จะเปิดเผยเครื่องมือที่จำเป็น และคุณเลือกใช้เส้นทางเซิร์ฟเวอร์เรียกใช้ในแซนด์บ็อกซ์ที่อยู่ในขั้นทดลอง จากนั้นการเข้าถึงเชลล์จะส่งผ่านเครื่องมือที่มีแบ็กเอนด์เป็นแซนด์บ็อกซ์ OpenClaw เช่น `sandbox_exec` และ `sandbox_process` อย่าเมานต์ซ็อกเก็ต Docker ของโฮสต์เข้าไปในคอนเทนเนอร์แซนด์บ็อกซ์ของเอเจนต์หรือแซนด์บ็อกซ์ Codex แบบกำหนดเอง โปรดดู [ชุดควบคุม Codex](/th/plugins/codex-harness) สำหรับรายละเอียดลักษณะการทำงานทั้งหมด

บนโฮสต์ Ubuntu/AppArmor ที่เปิดใช้โหมดแซนด์บ็อกซ์ Docker การเรียกใช้เชลล์ `workspace-write` ของเซิร์ฟเวอร์แอป Codex ต้องใช้เนมสเปซผู้ใช้แบบไม่ใช้สิทธิ์ภายในคอนเทนเนอร์แซนด์บ็อกซ์ และอาจล้มเหลวก่อนเชลล์เริ่มทำงานเมื่อผู้ใช้บริการไม่สามารถสร้างเนมสเปซดังกล่าวได้ นอกจากนี้ยังต้องใช้เนมสเปซเครือข่ายแบบไม่ใช้สิทธิ์เมื่อปิดการเชื่อมต่อขาออกของแซนด์บ็อกซ์ Docker (`network: "none"` ซึ่งเป็นค่าเริ่มต้น) อาการที่พบบ่อย ได้แก่ `bwrap: setting up uid map: Permission denied` และ `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` ให้เรียกใช้ `openclaw doctor` หากรายงานว่าการตรวจสอบเนมสเปซ bwrap ของ Codex ล้มเหลว ควรใช้โปรไฟล์ AppArmor ที่อนุญาตเนมสเปซที่จำเป็นให้แก่กระบวนการบริการ OpenClaw `kernel.apparmor_restrict_unprivileged_userns=0` เป็นทางเลือกสำรองที่มีผลทั่วทั้งโฮสต์และมีข้อแลกเปลี่ยนด้านความปลอดภัย โปรดใช้เฉพาะเมื่อท่าทีด้านความปลอดภัยของโฮสต์นั้นยอมรับได้
</Warning>

### เบราว์เซอร์ในแซนด์บ็อกซ์

- เบราว์เซอร์แซนด์บ็อกซ์จะเริ่มโดยอัตโนมัติ (เพื่อให้แน่ใจว่าสามารถเข้าถึง CDP ได้) เมื่อเครื่องมือเบราว์เซอร์ต้องใช้งาน กำหนดค่าผ่าน `agents.defaults.sandbox.browser.autoStart` (ค่าเริ่มต้น `true`) และ `autoStartTimeoutMs` (ค่าเริ่มต้น 12 วินาที)
- คอนเทนเนอร์เบราว์เซอร์แซนด์บ็อกซ์ใช้เครือข่าย Docker เฉพาะ (`openclaw-sandbox-browser`) แทนเครือข่ายส่วนกลาง `bridge` กำหนดค่าด้วย `agents.defaults.sandbox.browser.network`
- `agents.defaults.sandbox.browser.cdpSourceRange` จำกัดการรับส่ง CDP ขาเข้าที่ขอบคอนเทนเนอร์ด้วยรายการ CIDR ที่อนุญาต (ตัวอย่างเช่น `172.21.0.1/32`)
- การเข้าถึงตัวสังเกตการณ์ noVNC ได้รับการป้องกันด้วยรหัสผ่านโดยค่าเริ่มต้น OpenClaw จะสร้าง URL โทเค็นอายุสั้นซึ่งให้บริการหน้าบูตสแตรปในเครื่องและเปิด noVNC โดยใส่รหัสผ่านไว้ในส่วนแฟรกเมนต์ของ URL (ไม่ใช่สตริงคำขอหรือบันทึกส่วนหัว)
- `agents.defaults.sandbox.browser.allowHostControl` (ค่าเริ่มต้น `false`) อนุญาตให้เซสชันที่อยู่ในแซนด์บ็อกซ์กำหนดเป้าหมายเบราว์เซอร์ของโฮสต์ได้อย่างชัดเจน
- รายการอนุญาตเสริมใช้ควบคุม `target: "custom"` ได้แก่ `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`

## แบ็กเอนด์ SSH

ใช้ `backend: "ssh"` เพื่อแซนด์บ็อกซ์ `exec`, เครื่องมือไฟล์ และการอ่านสื่อบนเครื่องใดก็ได้ที่เข้าถึงผ่าน SSH

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

ค่าเริ่มต้น: `command: "ssh"`, `workspaceRoot: "/tmp/openclaw-sandboxes"`, `strictHostKeyChecking: true`, `updateHostKeys: true`

- **วงจรชีวิต**: OpenClaw สร้างรากระยะไกลต่อขอบเขตภายใต้ `sandbox.ssh.workspaceRoot` เมื่อใช้งานครั้งแรกหลังจากสร้างหรือสร้างใหม่ ระบบจะป้อนข้อมูลพื้นที่ทำงานระยะไกลนั้นจากพื้นที่ทำงานภายในเครื่องหนึ่งครั้ง หลังจากนั้น `exec`, `read`, `write`, `edit`, `apply_patch`, การอ่านสื่อจากพรอมต์ และการจัดเตรียมสื่อขาเข้าจะทำงานโดยตรงกับพื้นที่ทำงานระยะไกลผ่าน SSH OpenClaw จะไม่ซิงค์การเปลี่ยนแปลงระยะไกลกลับไปยังพื้นที่ทำงานภายในเครื่องโดยอัตโนมัติ
- **ข้อมูลสำหรับการยืนยันตัวตน**: `identityFile`/`certificateFile`/`knownHostsFile` อ้างอิงไฟล์ภายในเครื่องที่มีอยู่ `identityData`/`certificateData`/`knownHostsData` รองรับสตริงแบบอินไลน์หรือ SecretRefs ซึ่งจะแก้ไขผ่านสแนปช็อตรันไทม์ข้อมูลลับตามปกติ เขียนลงไฟล์ชั่วคราวด้วยโหมด `0600` และลบเมื่อเซสชัน SSH สิ้นสุด หากตั้งค่าทั้งรูปแบบ `*File` และ `*Data` สำหรับรายการเดียวกัน `*Data` จะมีผลเหนือกว่าสำหรับเซสชันนั้น
- **ผลที่ตามมาจากการใช้ฝั่งระยะไกลเป็นหลัก**: พื้นที่ทำงาน SSH ระยะไกลจะกลายเป็นสถานะจริงของแซนด์บ็อกซ์หลังจากการป้อนข้อมูลครั้งแรก การแก้ไขภายในโฮสต์ที่ทำนอก OpenClaw หลังขั้นตอนการป้อนข้อมูลจะไม่ปรากฏในฝั่งระยะไกลจนกว่าคุณจะสร้างแซนด์บ็อกซ์ใหม่ `openclaw sandbox recreate` จะลบรากระยะไกลต่อขอบเขตและป้อนข้อมูลจากภายในเครื่องอีกครั้งในการใช้งานครั้งถัดไป แบ็กเอนด์นี้ไม่รองรับการแซนด์บ็อกซ์เบราว์เซอร์ และการตั้งค่า `sandbox.docker.*` ไม่มีผลกับแบ็กเอนด์นี้

## แบ็กเอนด์ OpenShell

ใช้ `backend: "openshell"` เพื่อแซนด์บ็อกซ์เครื่องมือในสภาพแวดล้อมระยะไกลที่จัดการโดย OpenShell โดย OpenShell ใช้การขนส่ง SSH และบริดจ์ระบบไฟล์ระยะไกลเดียวกับแบ็กเอนด์ SSH ทั่วไป และเพิ่มวงจรชีวิตของ OpenShell (`sandbox create/get/delete/ssh-config`) รวมถึงโหมดซิงค์พื้นที่ทำงาน `mirror` ที่เลือกใช้ได้

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
        },
      },
    },
  },
}
```

`mode: "mirror"` (ค่าเริ่มต้น) กำหนดให้พื้นที่ทำงานภายในเครื่องเป็นแหล่งข้อมูลหลัก โดย OpenClaw จะซิงค์ข้อมูลจากภายในเครื่องเข้าไปในแซนด์บ็อกซ์ก่อน `exec` และซิงค์กลับหลังจากนั้น `mode: "remote"` จะป้อนข้อมูลพื้นที่ทำงานระยะไกลจากภายในเครื่องหนึ่งครั้ง จากนั้นเรียกใช้ `exec`/`read`/`write`/`edit`/`apply_patch` โดยตรงกับพื้นที่ทำงานระยะไกลโดยไม่ซิงค์กลับ การแก้ไขภายในเครื่องหลังจากการป้อนข้อมูลจะมองไม่เห็นจนกว่าคุณจะเรียกใช้ `openclaw sandbox recreate` ภายใต้ `scope: "agent"` หรือ `scope: "shared"` พื้นที่ทำงานระยะไกลนั้นจะใช้ร่วมกันในขอบเขตเดียวกัน ข้อจำกัดในปัจจุบัน: ยังไม่รองรับเบราว์เซอร์แซนด์บ็อกซ์ และ `sandbox.docker.binds` ไม่มีผลกับแบ็กเอนด์นี้

`openclaw sandbox list`/`recreate`/prune จะปฏิบัติต่อรันไทม์ OpenShell เช่นเดียวกับรันไทม์ Docker โดยตรรกะการตัดทิ้งจะรับรู้แบ็กเอนด์

สำหรับข้อกำหนดเบื้องต้นทั้งหมด เอกสารอ้างอิงการกำหนดค่า การเปรียบเทียบโหมดพื้นที่ทำงาน และรายละเอียดวงจรชีวิต โปรดดู [OpenShell](/th/gateway/openshell)

## การเข้าถึงพื้นที่ทำงาน

`agents.defaults.sandbox.workspaceAccess` ควบคุมสิ่งที่แซนด์บ็อกซ์สามารถมองเห็นได้:

| ค่า              | ลักษณะการทำงาน                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `none` (ค่าเริ่มต้น) | เครื่องมือจะเห็นพื้นที่ทำงาน sandbox ที่แยกออกมาต่างหากภายใต้ `~/.openclaw/sandboxes`                    |
| `ro`             | เมานต์พื้นที่ทำงานของเอเจนต์แบบอ่านอย่างเดียวที่ `/agent` (ปิดใช้งาน `write`/`edit`/`apply_patch`) |
| `rw`             | เมานต์พื้นที่ทำงานของเอเจนต์แบบอ่าน/เขียนที่ `/workspace`                                    |

เมื่อใช้แบ็กเอนด์ OpenShell โหมด `mirror` จะยังคงใช้พื้นที่ทำงานภายในเครื่องเป็นแหล่งข้อมูลหลักระหว่างรอบการเรียกใช้ exec ส่วนโหมด `remote` จะใช้พื้นที่ทำงาน OpenShell ระยะไกลเป็นแหล่งข้อมูลหลักหลังจากการป้อนข้อมูลเริ่มต้น และ `workspaceAccess: "ro"`/`"none"` จะยังคงจำกัดการเขียนในลักษณะเดียวกัน

สื่อขาเข้าจะถูกคัดลอกไปยังพื้นที่ทำงาน sandbox ที่ใช้งานอยู่ (`media/inbound/*`)

<Note>
**Skills**: เครื่องมือ `read` มีรากอยู่ที่ sandbox เมื่อใช้ `workspaceAccess: "none"` OpenClaw จะทำมิเรอร์ Skills ที่เข้าเกณฑ์ไปยังพื้นที่ทำงาน sandbox (`.../skills`) เพื่อให้อ่านได้ เมื่อใช้ `"rw"` จะอ่าน Skills ในพื้นที่ทำงานได้จาก `/workspace/skills` และ Skills ที่เข้าเกณฑ์ซึ่งมีการจัดการ รวมมาให้ หรือมาจาก Plugin จะถูกจัดเตรียมไว้ในพาธแบบอ่านอย่างเดียวที่สร้างขึ้น `/workspace/.openclaw/sandbox-skills/skills`
</Note>

## การเมานต์แบบ bind ที่กำหนดเอง

`agents.defaults.sandbox.docker.binds` เมานต์ไดเรกทอรีเพิ่มเติมจากโฮสต์เข้าไปในคอนเทนเนอร์ รูปแบบ: `host:container:mode` (เช่น `"/home/user/source:/source:rw"`)

การตั้งค่า bind ระดับส่วนกลางและระดับเอเจนต์จะถูกรวมกัน (ไม่ใช่แทนที่กัน) ภายใต้ `scope: "shared"` การตั้งค่า bind ระดับเอเจนต์จะถูกละเว้น

`agents.defaults.sandbox.browser.binds` เมานต์ไดเรกทอรีเพิ่มเติมจากโฮสต์เข้าไปในคอนเทนเนอร์ **เบราว์เซอร์ sandbox** เท่านั้น เมื่อตั้งค่า (รวมถึง `[]`) ค่านี้จะแทนที่ `docker.binds` สำหรับคอนเทนเนอร์เบราว์เซอร์ หากละไว้ คอนเทนเนอร์เบราว์เซอร์จะย้อนกลับไปใช้ `docker.binds`

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

- bind จะข้ามระบบไฟล์ของ sandbox โดยเปิดเผยพาธบนโฮสต์ตามโหมดที่คุณกำหนด (`:ro` หรือ `:rw`)
- ตามค่าเริ่มต้น OpenClaw จะบล็อกแหล่ง bind ที่เป็นอันตราย ได้แก่ พาธระบบ (`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`), ไดเรกทอรีซ็อกเก็ต Docker (`/run`, `/var/run` และรูปแบบย่อยที่มี `docker.sock`) รวมถึงรากไดเรกทอรีข้อมูลรับรองทั่วไปในโฮมไดเรกทอรี (`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`)
- การตรวจสอบจะปรับพาธต้นทางให้เป็นรูปแบบมาตรฐาน แล้วแก้พาธอีกครั้งผ่านบรรพบุรุษที่อยู่ลึกที่สุดซึ่งมีอยู่จริง ก่อนตรวจสอบพาธที่ถูกบล็อกและรากที่อนุญาตซ้ำ ดังนั้นการหลบออกผ่านพาเรนต์ที่เป็น symlink จะถูกปฏิเสธอย่างปลอดภัย แม้โหนดปลายทางสุดท้ายยังไม่มีอยู่ (เช่น `/workspace/run-link/new-file` จะยังถูกแก้เป็น `/var/run/...` หาก `run-link` ชี้ไปที่นั่น)
- เป้าหมาย bind ที่บดบังจุดเมานต์สงวนของคอนเทนเนอร์ (`/workspace`, `/agent`) จะถูกบล็อกตามค่าเริ่มต้นเช่นกัน หากต้องการลบล้าง ให้ใช้ `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true`
- แหล่ง bind ที่อยู่นอกรากพื้นที่ทำงาน/พื้นที่ทำงานของเอเจนต์ในรายการอนุญาตจะถูกบล็อกตามค่าเริ่มต้น หากต้องการลบล้าง ให้ใช้ `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true` รากที่อนุญาตจะถูกปรับเป็นพาธมาตรฐานด้วยวิธีเดียวกัน ดังนั้นพาธที่ดูเหมือนอยู่ภายในรายการอนุญาตเฉพาะก่อนแก้ symlink จะยังถูกปฏิเสธว่าอยู่นอกรากที่อนุญาต
- การเมานต์ข้อมูลละเอียดอ่อน (ข้อมูลลับ คีย์ SSH ข้อมูลรับรองบริการ) ควรใช้ `:ro` เว้นแต่จำเป็นอย่างยิ่ง
- ใช้ร่วมกับ `workspaceAccess: "ro"` หากคุณต้องการเพียงสิทธิ์อ่านพื้นที่ทำงาน โดยโหมดของ bind ยังคงเป็นอิสระต่อกัน
- ดู [Sandbox เทียบกับนโยบายเครื่องมือเทียบกับสิทธิ์ยกระดับ](/th/gateway/sandbox-vs-tool-policy-vs-elevated) เพื่อดูว่า bind ทำงานร่วมกับนโยบายเครื่องมือและการเรียกใช้ exec แบบยกระดับอย่างไร

</Warning>

## อิมเมจและการตั้งค่า

อิมเมจ Docker เริ่มต้น: `openclaw-sandbox:bookworm-slim`

<Note>
**การเช็กเอาต์ซอร์สเทียบกับการติดตั้งผ่าน npm**

สคริปต์ตัวช่วย `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` และ `scripts/sandbox-browser-setup.sh` มีให้ใช้เฉพาะเมื่อเรียกใช้จาก [การเช็กเอาต์ซอร์ส](https://github.com/openclaw/openclaw) เท่านั้น โดยไม่ได้รวมอยู่ในแพ็กเกจ npm

หากคุณติดตั้ง OpenClaw ผ่าน `npm install -g openclaw` ให้ใช้คำสั่ง `docker build` แบบอินไลน์ที่แสดงด้านล่างแทน
</Note>

<Steps>
  <Step title="สร้างอิมเมจเริ่มต้น">
    จากการเช็กเอาต์ซอร์ส:

    ```bash
    scripts/sandbox-setup.sh
    ```

    จากการติดตั้งผ่าน npm (ไม่จำเป็นต้องมีการเช็กเอาต์ซอร์ส):

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

    อิมเมจเริ่มต้น **ไม่มี** Node หาก Skill ต้องใช้ Node (หรือรันไทม์อื่น) ให้สร้างอิมเมจแบบกำหนดเองที่รวมสิ่งเหล่านั้นไว้ หรือติดตั้งผ่าน `sandbox.docker.setupCommand` (ต้องมีการเชื่อมต่อเครือข่ายขาออก + รากระบบไฟล์ที่เขียนได้ + ผู้ใช้ root)

    OpenClaw จะไม่ใช้ `debian:bookworm-slim` ธรรมดาแทนโดยไม่แจ้ง เมื่อไม่พบ `openclaw-sandbox:bookworm-slim` การเรียกใช้ sandbox ที่กำหนดเป้าหมายเป็นอิมเมจเริ่มต้นจะล้มเหลวทันทีพร้อมคำแนะนำในการสร้าง จนกว่าคุณจะสร้างอิมเมจดังกล่าว เนื่องจากอิมเมจที่รวมมาให้มี `python3` สำหรับตัวช่วยเขียน/แก้ไขของ sandbox

  </Step>
  <Step title="ไม่บังคับ: สร้างอิมเมจทั่วไป">
    สำหรับอิมเมจ sandbox ที่ใช้งานได้หลากหลายขึ้นพร้อมเครื่องมือทั่วไป (เช่น `curl`, `jq`, Node 24, pnpm, `python3` และ `git`):

    จากการเช็กเอาต์ซอร์ส:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    จากการติดตั้งผ่าน npm ให้สร้างอิมเมจเริ่มต้นก่อน (ดูด้านบน) จากนั้นสร้างอิมเมจทั่วไปต่อยอดจากอิมเมจดังกล่าวโดยใช้ [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) จากที่เก็บ

    จากนั้นตั้งค่า `agents.defaults.sandbox.docker.image` เป็น `openclaw-sandbox-common:bookworm-slim`

  </Step>
  <Step title="ไม่บังคับ: สร้างอิมเมจเบราว์เซอร์ sandbox">
    จากการเช็กเอาต์ซอร์ส:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    จากการติดตั้งผ่าน npm ให้สร้างโดยใช้ [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) จากที่เก็บ

  </Step>
</Steps>

ตามค่าเริ่มต้น คอนเทนเนอร์ Docker sandbox จะทำงานโดย **ไม่มีเครือข่าย** ลบล้างได้ด้วย `agents.defaults.sandbox.docker.network`

<AccordionGroup>
  <Accordion title="ค่าเริ่มต้น Chromium ของเบราว์เซอร์ sandbox">
    อิมเมจเบราว์เซอร์ sandbox ที่รวมมาให้ใช้แฟล็กเริ่มต้น Chromium แบบระมัดระวังสำหรับเวิร์กโหลดในคอนเทนเนอร์:

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
    - `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer` ตามค่าเริ่มต้น แฟล็กเพิ่มความแข็งแกร่งด้านกราฟิกเหล่านี้ช่วยคอนเทนเนอร์ที่ไม่รองรับ GPU ตั้งค่า `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากเวิร์กโหลดของคุณต้องใช้ WebGL หรือคุณสมบัติ 3D อื่น
    - `--disable-extensions` ตามค่าเริ่มต้น ตั้งค่า `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` สำหรับโฟลว์ที่ต้องพึ่งพาส่วนขยาย
    - `--renderer-process-limit=2` ตามค่าเริ่มต้น ควบคุมด้วย `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` โดย `0` จะคงค่าเริ่มต้นของ Chromium

    หากคุณต้องการโปรไฟล์รันไทม์ที่แตกต่าง ให้ใช้อิมเมจเบราว์เซอร์แบบกำหนดเองและกำหนด entrypoint ของคุณเอง สำหรับโปรไฟล์ Chromium ภายในเครื่อง (ที่ไม่ได้อยู่ในคอนเทนเนอร์) ให้ใช้ `browser.extraArgs` เพื่อเพิ่มแฟล็กเริ่มต้น

  </Accordion>
  <Accordion title="ค่าเริ่มต้นด้านความปลอดภัยเครือข่าย">
    - `network: "host"` ถูกบล็อก
    - `network: "container:<id>"` ถูกบล็อกตามค่าเริ่มต้น (มีความเสี่ยงจากการข้ามการควบคุมด้วยการเข้าร่วม namespace)
    - การลบล้างกรณีฉุกเฉิน: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`

  </Accordion>
</AccordionGroup>

การติดตั้ง Docker และ Gateway ที่ทำงานในคอนเทนเนอร์อยู่ที่นี่: [Docker](/th/install/docker)

สำหรับการติดตั้งใช้งาน Gateway ผ่าน Docker `scripts/docker/setup.sh` สามารถตั้งค่าคอนฟิก sandbox เริ่มต้นได้ ตั้งค่า `OPENCLAW_SANDBOX=1` (หรือ `true`/`yes`/`on`) เพื่อเปิดใช้งานเส้นทางนี้ ลบล้างตำแหน่งซ็อกเก็ตด้วย `OPENCLAW_DOCKER_SOCKET` การตั้งค่าฉบับเต็มและข้อมูลอ้างอิงตัวแปรสภาพแวดล้อม: [Docker](/th/install/docker#agent-sandbox)

## setupCommand (การตั้งค่าคอนเทนเนอร์ครั้งเดียว)

`setupCommand` ทำงาน **หนึ่งครั้ง** หลังจากสร้างคอนเทนเนอร์ sandbox (ไม่ใช่ทุกครั้งที่เรียกใช้) โดยทำงานภายในคอนเทนเนอร์ผ่าน `sh -lc`

พาธ:

- ส่วนกลาง: `agents.defaults.sandbox.docker.setupCommand`
- รายเอเจนต์: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="ข้อผิดพลาดที่พบบ่อย">
    - ค่าเริ่มต้นของ `docker.network` คือ `"none"` (ไม่มีการเชื่อมต่อขาออก) ดังนั้นการติดตั้งแพ็กเกจจะล้มเหลว
    - `docker.network: "container:<id>"` ต้องใช้ `dangerouslyAllowContainerNamespaceJoin: true` และมีไว้สำหรับกรณีฉุกเฉินเท่านั้น
    - `readOnlyRoot: true` ป้องกันการเขียน ให้ตั้งค่า `readOnlyRoot: false` หรือสร้างอิมเมจแบบกำหนดเองที่รวมสิ่งที่ต้องการไว้
    - `user` ต้องเป็น root สำหรับการติดตั้งแพ็กเกจ (ละ `user` ไว้ หรือตั้งค่า `user: "0:0"`)
    - การเรียกใช้ exec ใน sandbox **ไม่** สืบทอด `process.env` ของโฮสต์ ใช้ `agents.defaults.sandbox.docker.env` (หรืออิมเมจแบบกำหนดเอง) สำหรับคีย์ API ของ Skill
    - ค่าใน `agents.defaults.sandbox.docker.env` จะถูกส่งเป็นตัวแปรสภาพแวดล้อมของคอนเทนเนอร์ Docker โดยชัดแจ้ง ผู้ที่มีสิทธิ์เข้าถึงดีมอน Docker สามารถตรวจสอบค่าเหล่านี้ด้วยคำสั่งเมทาดาทาของ Docker เช่น `docker inspect` หากไม่สามารถยอมรับการเปิดเผยผ่านเมทาดาทานี้ได้ ให้ใช้อิมเมจแบบกำหนดเอง ไฟล์ข้อมูลลับที่เมานต์ หรือช่องทางส่งข้อมูลลับแบบอื่น

  </Accordion>
</AccordionGroup>

## นโยบายเครื่องมือและช่องทางหลบออก

นโยบายอนุญาต/ปฏิเสธเครื่องมือยังคงมีผลก่อนกฎ sandbox หากเครื่องมือถูกปฏิเสธในระดับส่วนกลางหรือระดับเอเจนต์ การใช้ sandbox จะไม่ทำให้เครื่องมือนั้นกลับมาใช้งานได้

`tools.elevated` เป็นช่องทางหลบออกที่ระบุอย่างชัดเจน ซึ่งเรียกใช้ `exec` นอก sandbox (`gateway` ตามค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec คือ `node`) คำสั่งกำกับ `/exec` มีผลเฉพาะกับผู้ส่งที่ได้รับอนุญาตและคงอยู่ตลอดเซสชัน หากต้องการปิดใช้งาน `exec` อย่างเด็ดขาด ให้ใช้นโยบายเครื่องมือแบบปฏิเสธ (ดู [Sandbox เทียบกับนโยบายเครื่องมือเทียบกับสิทธิ์ยกระดับ](/th/gateway/sandbox-vs-tool-policy-vs-elevated))

การแก้ไขข้อบกพร่อง:

- `openclaw sandbox list` แสดงคอนเทนเนอร์ sandbox, สถานะ, ความตรงกันของอิมเมจ, อายุ, เวลาที่ไม่ได้ใช้งาน และเซสชัน/เอเจนต์ที่เชื่อมโยง
- `openclaw sandbox explain [--session <key>] [--agent <id>]` ตรวจสอบโหมด sandbox ที่มีผล พื้นที่ทำงานบนโฮสต์ ไดเรกทอรีทำงานของรันไทม์ การเมานต์ Docker นโยบายเครื่องมือ และคีย์คอนฟิกสำหรับแก้ไข ฟิลด์ `workspaceRoot` จะยังคงเป็นราก sandbox ที่กำหนดค่าไว้ ส่วน `effectiveHostWorkspaceRoot` จะแสดงตำแหน่งจริงของพื้นที่ทำงานที่ใช้งานอยู่
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` ลบคอนเทนเนอร์/สภาพแวดล้อม เพื่อให้สร้างขึ้นใหม่ด้วยคอนฟิกปัจจุบันในการใช้งานครั้งถัดไป
- ดู [Sandbox เทียบกับนโยบายเครื่องมือเทียบกับสิทธิ์ยกระดับ](/th/gateway/sandbox-vs-tool-policy-vs-elevated) สำหรับกรอบความคิดในการวิเคราะห์ว่า "เหตุใดสิ่งนี้จึงถูกบล็อก"

## การลบล้างสำหรับหลายเอเจนต์

เอเจนต์แต่ละตัวสามารถลบล้าง sandbox + เครื่องมือได้ผ่าน `agents.list[].sandbox` และ `agents.list[].tools` (รวมถึง `agents.list[].tools.sandbox.tools` สำหรับนโยบายเครื่องมือ sandbox) ดูลำดับความสำคัญได้ที่ [Sandbox และเครื่องมือสำหรับหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)

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

- [แซนด์บ็อกซ์และเครื่องมือสำหรับหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) -- การกำหนดค่าทับเฉพาะเอเจนต์และลำดับความสำคัญ
- [OpenShell](/th/gateway/openshell) -- การตั้งค่าแบ็กเอนด์แซนด์บ็อกซ์ที่มีการจัดการ โหมดพื้นที่ทำงาน และข้อมูลอ้างอิงการกำหนดค่า
- [การกำหนดค่าแซนด์บ็อกซ์](/th/gateway/config-agents#agentsdefaultssandbox)
- [แซนด์บ็อกซ์เทียบกับนโยบายเครื่องมือเทียบกับสิทธิ์ระดับสูง](/th/gateway/sandbox-vs-tool-policy-vs-elevated) -- การแก้ไขข้อบกพร่อง "เหตุใดสิ่งนี้จึงถูกบล็อก"
- [ความปลอดภัย](/th/gateway/security)
