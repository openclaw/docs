---
read_when:
    - คุณต้องการ Gateway แบบคอนเทนเนอร์ด้วย Podman แทน Docker
summary: รัน OpenClaw ใน container Podman แบบ rootless
title: Podman
x-i18n:
    generated_at: "2026-04-23T10:19:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: df478ad4ac63b363c86a53bc943494b32602abfaad8576c5e899e77f7699a533
    source_path: install/podman.md
    workflow: 15
---

# Podman

รัน OpenClaw Gateway ใน container Podman แบบ rootless โดยให้ผู้ใช้ปัจจุบันที่ไม่ใช่ root เป็นผู้จัดการ

โมเดลที่ตั้งใจไว้คือ:

- Podman รัน container ของ gateway
- `openclaw` CLI บนโฮสต์ของคุณคือ control plane
- สถานะถาวรอยู่บนโฮสต์ภายใต้ `~/.openclaw` โดยค่าเริ่มต้น
- การจัดการประจำวันใช้ `openclaw --container <name> ...` แทน `sudo -u openclaw`, `podman exec` หรือ service user แยกต่างหาก

## ข้อกำหนดเบื้องต้น

- **Podman** ในโหมด rootless
- ติดตั้ง **OpenClaw CLI** บนโฮสต์แล้ว
- **ไม่บังคับ:** `systemd --user` หากคุณต้องการการเริ่มอัตโนมัติที่จัดการด้วย Quadlet
- **ไม่บังคับ:** `sudo` เฉพาะเมื่อคุณต้องการ `loginctl enable-linger "$(whoami)"` เพื่อให้คงอยู่หลังบูตบนโฮสต์แบบ headless

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ตั้งค่าครั้งเดียว">
    จากรากของ repo ให้รัน `./scripts/podman/setup.sh`
  </Step>

  <Step title="เริ่ม container ของ Gateway">
    เริ่ม container ด้วย `./scripts/run-openclaw-podman.sh launch`
  </Step>

  <Step title="รัน onboarding ภายใน container">
    รัน `./scripts/run-openclaw-podman.sh launch setup` จากนั้นเปิด `http://127.0.0.1:18789/`
  </Step>

  <Step title="จัดการ container ที่กำลังรันจาก CLI บนโฮสต์">
    ตั้งค่า `OPENCLAW_CONTAINER=openclaw` แล้วใช้คำสั่ง `openclaw` ตามปกติจากโฮสต์
  </Step>
</Steps>

รายละเอียดการตั้งค่า:

- `./scripts/podman/setup.sh` จะ build `openclaw:local` ใน rootless Podman store ของคุณโดยค่าเริ่มต้น หรือใช้ `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` หากคุณตั้งค่าไว้
- จะสร้าง `~/.openclaw/openclaw.json` พร้อม `gateway.mode: "local"` หากยังไม่มี
- จะสร้าง `~/.openclaw/.env` พร้อม `OPENCLAW_GATEWAY_TOKEN` หากยังไม่มี
- สำหรับการเปิดใช้งานแบบแมนนวล ตัวช่วยจะอ่านเฉพาะ allowlist ขนาดเล็กของคีย์ที่เกี่ยวข้องกับ Podman จาก `~/.openclaw/.env` และส่งตัวแปรสภาพแวดล้อมรันไทม์แบบ explicit เข้าไปใน container; จะไม่ส่งไฟล์ env ทั้งไฟล์ให้ Podman

การตั้งค่าที่จัดการด้วย Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet เป็นตัวเลือกเฉพาะบน Linux เพราะขึ้นอยู่กับ systemd user services

คุณยังสามารถตั้งค่า `OPENCLAW_PODMAN_QUADLET=1` ได้

ตัวแปรสภาพแวดล้อมสำหรับ build/setup แบบไม่บังคับ:

- `OPENCLAW_IMAGE` หรือ `OPENCLAW_PODMAN_IMAGE` -- ใช้อิมเมจที่มีอยู่/ดึงมาแล้วแทนการ build `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- ติดตั้งแพ็กเกจ apt เพิ่มเติมระหว่าง build image
- `OPENCLAW_EXTENSIONS` -- ติดตั้ง dependencies ของ plugin ล่วงหน้าในเวลาสร้างอิมเมจ

การเริ่ม container:

```bash
./scripts/run-openclaw-podman.sh launch
```

สคริปต์จะเริ่ม container โดยใช้ uid/gid ปัจจุบันของคุณร่วมกับ `--userns=keep-id` และ bind-mount สถานะ OpenClaw ของคุณเข้าไปใน container

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

จากนั้นเปิด `http://127.0.0.1:18789/` และใช้ token จาก `~/.openclaw/.env`

ค่าเริ่มต้นของ CLI บนโฮสต์:

```bash
export OPENCLAW_CONTAINER=openclaw
```

จากนั้นคำสั่งเช่นต่อไปนี้จะไปรันภายใน container นั้นโดยอัตโนมัติ:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

บน macOS, Podman machine อาจทำให้เบราว์เซอร์ดูเหมือนไม่ได้เป็น local สำหรับ gateway
หาก Control UI รายงานข้อผิดพลาด device-auth หลังการเปิดใช้งาน ให้ใช้คำแนะนำ Tailscale ใน
[Podman + Tailscale](#podman--tailscale)

<a id="podman--tailscale"></a>

## Podman + Tailscale

สำหรับการเข้าถึงแบบ HTTPS หรือผ่านเบราว์เซอร์ระยะไกล ให้ทำตามเอกสารหลักของ Tailscale

หมายเหตุเฉพาะของ Podman:

- คง publish host ของ Podman ไว้ที่ `127.0.0.1`
- แนะนำให้ใช้ `tailscale serve` ที่โฮสต์จัดการ แทน `openclaw gateway --tailscale serve`
- บน macOS หากบริบท device-auth ของเบราว์เซอร์ภายในเครื่องเชื่อถือไม่ได้ ให้ใช้การเข้าถึงผ่าน Tailscale แทนวิธีแก้ปัญหาเฉพาะหน้าด้วย local tunnel

ดู:

- [Tailscale](/th/gateway/tailscale)
- [Control UI](/th/web/control-ui)

## Systemd (Quadlet, ไม่บังคับ)

หากคุณรัน `./scripts/podman/setup.sh --quadlet` ขั้นตอนตั้งค่าจะติดตั้งไฟล์ Quadlet ที่:

```bash
~/.config/containers/systemd/openclaw.container
```

คำสั่งที่มีประโยชน์:

- **เริ่ม:** `systemctl --user start openclaw.service`
- **หยุด:** `systemctl --user stop openclaw.service`
- **สถานะ:** `systemctl --user status openclaw.service`
- **บันทึก:** `journalctl --user -u openclaw.service -f`

หลังจากแก้ไขไฟล์ Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

สำหรับการคงอยู่หลังบูตบนโฮสต์แบบ SSH/headless ให้เปิด lingering สำหรับผู้ใช้ปัจจุบันของคุณ:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Config, env และ storage

- **ไดเรกทอรี config:** `~/.openclaw`
- **ไดเรกทอรี workspace:** `~/.openclaw/workspace`
- **ไฟล์ token:** `~/.openclaw/.env`
- **ตัวช่วยเปิดใช้งาน:** `./scripts/run-openclaw-podman.sh`

สคริปต์เปิดใช้งานและ Quadlet จะ bind-mount สถานะจากโฮสต์เข้าไปใน container:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

โดยค่าเริ่มต้น สิ่งเหล่านี้เป็นไดเรกทอรีบนโฮสต์ ไม่ใช่สถานะ container แบบ anonymous ดังนั้น
`openclaw.json`, `auth-profiles.json` รายเอเจนต์ สถานะ channel/provider
เซสชัน และ workspace จะยังคงอยู่แม้มีการเปลี่ยน container
การตั้งค่า Podman ยังใส่ค่า `gateway.controlUi.allowedOrigins` สำหรับ `127.0.0.1` และ `localhost` บนพอร์ต gateway ที่ publish ไว้ด้วย เพื่อให้แดชบอร์ดภายในเครื่องทำงานร่วมกับการ bind แบบ non-loopback ของ container

ตัวแปรสภาพแวดล้อมที่มีประโยชน์สำหรับตัวเปิดใช้งานแบบแมนนวล:

- `OPENCLAW_PODMAN_CONTAINER` -- ชื่อ container (ค่าเริ่มต้นคือ `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- image ที่จะรัน
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- พอร์ตโฮสต์ที่แมปไปยัง `18789` ใน container
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- พอร์ตโฮสต์ที่แมปไปยัง `18790` ใน container
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- อินเทอร์เฟซโฮสต์สำหรับพอร์ตที่ publish; ค่าเริ่มต้นคือ `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- โหมด bind ของ gateway ภายใน container; ค่าเริ่มต้นคือ `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (ค่าเริ่มต้น), `auto` หรือ `host`

ตัวเปิดใช้งานแบบแมนนวลจะอ่าน `~/.openclaw/.env` ก่อนสรุปค่าเริ่มต้นของ container/image ดังนั้นคุณจึงเก็บค่าเหล่านี้ไว้ที่นั่นได้

หากคุณใช้ `OPENCLAW_CONFIG_DIR` หรือ `OPENCLAW_WORKSPACE_DIR` ที่ไม่ใช่ค่าเริ่มต้น ให้ตั้งค่าตัวแปรเดียวกันทั้งสำหรับ `./scripts/podman/setup.sh` และคำสั่ง `./scripts/run-openclaw-podman.sh launch` ในภายหลัง ตัวเปิดใช้งานใน repo จะไม่เก็บการ override พาธแบบกำหนดเองข้ามเชลล์

หมายเหตุเกี่ยวกับ Quadlet:

- service Quadlet ที่ถูกสร้างขึ้นจะคงรูปแบบค่าเริ่มต้นที่ตายตัวและแข็งแรงขึ้นโดยเจตนา: พอร์ตที่ publish ที่ `127.0.0.1`, `--bind lan` ภายใน container และ user namespace แบบ `keep-id`
- จะ pin ค่า `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` และ `TimeoutStartSec=300`
- จะ publish ทั้ง `127.0.0.1:18789:18789` (gateway) และ `127.0.0.1:18790:18790` (bridge)
- จะอ่าน `~/.openclaw/.env` เป็น `EnvironmentFile` ของรันไทม์สำหรับค่าอย่าง `OPENCLAW_GATEWAY_TOKEN` แต่จะไม่ใช้ allowlist override เฉพาะ Podman ของตัวเปิดใช้งานแบบแมนนวล
- หากคุณต้องการพอร์ต publish แบบกำหนดเอง publish host หรือแฟล็กการรัน container อื่น ๆ ให้ใช้ตัวเปิดใช้งานแบบแมนนวล หรือแก้ไข `~/.config/containers/systemd/openclaw.container` โดยตรง จากนั้น reload และ restart service

## คำสั่งที่มีประโยชน์

- **บันทึกของ container:** `podman logs -f openclaw`
- **หยุด container:** `podman stop openclaw`
- **ลบ container:** `podman rm -f openclaw`
- **เปิด URL แดชบอร์ดจาก CLI บนโฮสต์:** `openclaw dashboard --no-open`
- **สุขภาพ/สถานะผ่าน CLI บนโฮสต์:** `openclaw gateway status --deep` (RPC probe + extra
  service scan)

## การแก้ไขปัญหา

- **Permission denied (EACCES) บน config หรือ workspace:** container รันด้วย `--userns=keep-id` และ `--user <your uid>:<your gid>` โดยค่าเริ่มต้น ตรวจสอบให้แน่ใจว่าพาธ config/workspace บนโฮสต์เป็นของผู้ใช้ปัจจุบันของคุณ
- **การเริ่ม Gateway ถูกบล็อก (ขาด `gateway.mode=local`):** ตรวจสอบให้แน่ใจว่า `~/.openclaw/openclaw.json` มีอยู่และตั้งค่า `gateway.mode="local"` `scripts/podman/setup.sh` จะสร้างให้หากไม่มี
- **คำสั่ง CLI ของ container ไปยังเป้าหมายผิด:** ใช้ `openclaw --container <name> ...` แบบ explicit หรือ export `OPENCLAW_CONTAINER=<name>` ในเชลล์ของคุณ
- **`openclaw update` ล้มเหลวเมื่อใช้ `--container`:** เป็นพฤติกรรมที่คาดไว้ ให้ build/pull image ใหม่ แล้ว restart container หรือ Quadlet service
- **Quadlet service ไม่เริ่มทำงาน:** รัน `systemctl --user daemon-reload` จากนั้น `systemctl --user start openclaw.service` บนระบบ headless คุณอาจต้องใช้ `sudo loginctl enable-linger "$(whoami)"` ด้วย
- **SELinux บล็อก bind mounts:** ให้คงพฤติกรรม mount ค่าเริ่มต้นไว้ ตัวเปิดใช้งานจะเพิ่ม `:Z` ให้อัตโนมัติบน Linux เมื่อ SELinux อยู่ในโหมด enforcing หรือ permissive

## ที่เกี่ยวข้อง

- [Docker](/th/install/docker)
- [กระบวนการเบื้องหลังของ Gateway](/th/gateway/background-process)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
