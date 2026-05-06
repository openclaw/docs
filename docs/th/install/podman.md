---
read_when:
    - คุณต้องการ Gateway แบบคอนเทนเนอร์ด้วย Podman แทน Docker
summary: เรียกใช้ OpenClaw ในคอนเทนเนอร์ Podman แบบไม่ใช้สิทธิ์รูท
title: Podman
x-i18n:
    generated_at: "2026-05-06T09:20:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44f89feede7fe10325810599dad457f8fcc3adbd9c139e26df67b9ad12019d56
    source_path: install/podman.md
    workflow: 16
---

เรียกใช้ OpenClaw Gateway ในคอนเทนเนอร์ Podman แบบ rootless ซึ่งจัดการโดยผู้ใช้ non-root ปัจจุบันของคุณ

โมเดลที่ตั้งใจไว้คือ:

- Podman เรียกใช้คอนเทนเนอร์ Gateway
- `openclaw` CLI บนโฮสต์ของคุณคือ control plane
- สถานะถาวรอยู่บนโฮสต์ภายใต้ `~/.openclaw` ตามค่าเริ่มต้น
- การจัดการประจำวันใช้ `openclaw --container <name> ...` แทน `sudo -u openclaw`, `podman exec` หรือผู้ใช้บริการแยกต่างหาก

## ข้อกำหนดเบื้องต้น

- **Podman** ในโหมด rootless
- ติดตั้ง **OpenClaw CLI** บนโฮสต์แล้ว
- **ไม่บังคับ:** `systemd --user` หากคุณต้องการ auto-start ที่จัดการโดย Quadlet
- **ไม่บังคับ:** `sudo` เฉพาะเมื่อคุณต้องการ `loginctl enable-linger "$(whoami)"` เพื่อให้คงอยู่ขณะบูตบนโฮสต์ headless

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ตั้งค่าครั้งเดียว">
    จากรูทของ repo ให้รัน `./scripts/podman/setup.sh`
  </Step>

  <Step title="เริ่มคอนเทนเนอร์ Gateway">
    เริ่มคอนเทนเนอร์ด้วย `./scripts/run-openclaw-podman.sh launch`
  </Step>

  <Step title="รันการเริ่มใช้งานภายในคอนเทนเนอร์">
    รัน `./scripts/run-openclaw-podman.sh launch setup` แล้วเปิด `http://127.0.0.1:18789/`
  </Step>

  <Step title="จัดการคอนเทนเนอร์ที่กำลังรันจาก CLI บนโฮสต์">
    ตั้งค่า `OPENCLAW_CONTAINER=openclaw` แล้วใช้คำสั่ง `openclaw` ปกติจากโฮสต์
  </Step>
</Steps>

รายละเอียดการตั้งค่า:

- `./scripts/podman/setup.sh` สร้าง `openclaw:local` ใน rootless Podman store ของคุณตามค่าเริ่มต้น หรือใช้ `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` หากคุณตั้งค่าไว้
- สร้าง `~/.openclaw/openclaw.json` พร้อม `gateway.mode: "local"` หากยังไม่มี
- สร้าง `~/.openclaw/.env` พร้อม `OPENCLAW_GATEWAY_TOKEN` หากยังไม่มี
- สำหรับการเปิดใช้งานแบบแมนนวล helper จะอ่านเฉพาะ allowlist ขนาดเล็กของคีย์ที่เกี่ยวข้องกับ Podman จาก `~/.openclaw/.env` และส่ง runtime env vars ที่ระบุชัดเจนไปยังคอนเทนเนอร์ โดยจะไม่ส่งไฟล์ env ทั้งหมดให้ Podman

การตั้งค่าที่จัดการโดย Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet เป็นตัวเลือกสำหรับ Linux เท่านั้น เพราะขึ้นกับ systemd user services

คุณยังสามารถตั้งค่า `OPENCLAW_PODMAN_QUADLET=1` ได้ด้วย

env vars สำหรับ build/setup ที่ไม่บังคับ:

- `OPENCLAW_IMAGE` หรือ `OPENCLAW_PODMAN_IMAGE` -- ใช้อิมเมจที่มีอยู่/ดึงมาแล้วแทนการสร้าง `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- ติดตั้งแพ็กเกจ apt เพิ่มเติมระหว่างการสร้างอิมเมจ
- `OPENCLAW_EXTENSIONS` -- ติดตั้ง dependencies ของ Plugin ล่วงหน้าระหว่าง build
- `OPENCLAW_INSTALL_BROWSER` -- ติดตั้ง Chromium และ Xvfb ล่วงหน้าสำหรับ browser automation (ตั้งเป็น `1` เพื่อเปิดใช้)

เริ่มคอนเทนเนอร์:

```bash
./scripts/run-openclaw-podman.sh launch
```

สคริปต์เริ่มคอนเทนเนอร์ด้วย uid/gid ปัจจุบันของคุณโดยใช้ `--userns=keep-id` และ bind-mount สถานะ OpenClaw ของคุณเข้าไปในคอนเทนเนอร์

การเริ่มใช้งาน:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

จากนั้นเปิด `http://127.0.0.1:18789/` และใช้ token จาก `~/.openclaw/.env`

ค่าเริ่มต้นของ CLI บนโฮสต์:

```bash
export OPENCLAW_CONTAINER=openclaw
```

จากนั้นคำสั่งอย่างเช่นต่อไปนี้จะรันภายในคอนเทนเนอร์นั้นโดยอัตโนมัติ:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

บน macOS, Podman machine อาจทำให้เบราว์เซอร์ดูเหมือนไม่ได้อยู่ในเครื่องสำหรับ Gateway
หาก Control UI รายงานข้อผิดพลาด device-auth หลังเปิดใช้งาน ให้ใช้คำแนะนำ Tailscale ใน
[Podman และ Tailscale](#podman--tailscale)

<a id="podman--tailscale"></a>

## Podman และ Tailscale

สำหรับ HTTPS หรือการเข้าถึงเบราว์เซอร์ระยะไกล ให้ทำตามเอกสาร Tailscale หลัก

หมายเหตุเฉพาะ Podman:

- คงค่า publish host ของ Podman ไว้ที่ `127.0.0.1`
- แนะนำให้ใช้ `tailscale serve` ที่จัดการโดยโฮสต์มากกว่า `openclaw gateway --tailscale serve`
- บน macOS หากบริบท device-auth ของเบราว์เซอร์ local ไม่น่าเชื่อถือ ให้ใช้การเข้าถึงผ่าน Tailscale แทนวิธีแก้ปัญหาด้วย local tunnel แบบเฉพาะหน้า

ดูเพิ่มเติม:

- [Tailscale](/th/gateway/tailscale)
- [Control UI](/th/web/control-ui)

## Systemd (Quadlet, ไม่บังคับ)

หากคุณรัน `./scripts/podman/setup.sh --quadlet` การตั้งค่าจะติดตั้งไฟล์ Quadlet ไว้ที่:

```bash
~/.config/containers/systemd/openclaw.container
```

คำสั่งที่มีประโยชน์:

- **เริ่ม:** `systemctl --user start openclaw.service`
- **หยุด:** `systemctl --user stop openclaw.service`
- **สถานะ:** `systemctl --user status openclaw.service`
- **บันทึก:** `journalctl --user -u openclaw.service -f`

หลังแก้ไขไฟล์ Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

เพื่อให้คงอยู่ขณะบูตบนโฮสต์ SSH/headless ให้เปิดใช้ lingering สำหรับผู้ใช้ปัจจุบันของคุณ:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## การกำหนดค่า, env และพื้นที่จัดเก็บ

- **ไดเรกทอรี config:** `~/.openclaw`
- **ไดเรกทอรี workspace:** `~/.openclaw/workspace`
- **ไฟล์ token:** `~/.openclaw/.env`
- **Launch helper:** `./scripts/run-openclaw-podman.sh`

สคริปต์ launch และ Quadlet bind-mount สถานะบนโฮสต์เข้าไปในคอนเทนเนอร์:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

ตามค่าเริ่มต้น สิ่งเหล่านี้เป็นไดเรกทอรีบนโฮสต์ ไม่ใช่สถานะคอนเทนเนอร์แบบ anonymous ดังนั้น
`openclaw.json`, `auth-profiles.json` ราย agent, สถานะ channel/provider,
เซสชัน และ workspace จะยังอยู่รอดหลังเปลี่ยนคอนเทนเนอร์
การตั้งค่า Podman ยัง seed `gateway.controlUi.allowedOrigins` สำหรับ `127.0.0.1` และ `localhost` บนพอร์ต Gateway ที่เผยแพร่ เพื่อให้ dashboard local ทำงานกับการ bind แบบ non-loopback ของคอนเทนเนอร์ได้

env vars ที่มีประโยชน์สำหรับ manual launcher:

- `OPENCLAW_PODMAN_CONTAINER` -- ชื่อคอนเทนเนอร์ (`openclaw` ตามค่าเริ่มต้น)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- อิมเมจที่จะรัน
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- พอร์ตโฮสต์ที่แมปไปยังคอนเทนเนอร์ `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- พอร์ตโฮสต์ที่แมปไปยังคอนเทนเนอร์ `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- อินเทอร์เฟซโฮสต์สำหรับพอร์ตที่เผยแพร่ ค่าเริ่มต้นคือ `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- โหมด bind ของ Gateway ภายในคอนเทนเนอร์ ค่าเริ่มต้นคือ `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (ค่าเริ่มต้น), `auto` หรือ `host`

manual launcher อ่าน `~/.openclaw/.env` ก่อนสรุปค่าเริ่มต้นของคอนเทนเนอร์/อิมเมจ ดังนั้นคุณจึงสามารถบันทึกค่าเหล่านี้ไว้ที่นั่นได้

หากคุณใช้ `OPENCLAW_CONFIG_DIR` หรือ `OPENCLAW_WORKSPACE_DIR` ที่ไม่ใช่ค่าเริ่มต้น ให้ตั้งค่าตัวแปรเดียวกันสำหรับทั้งคำสั่ง `./scripts/podman/setup.sh` และคำสั่ง `./scripts/run-openclaw-podman.sh launch` ภายหลัง launcher ภายใน repo จะไม่คงค่า override พาธแบบกำหนดเองข้าม shell

หมายเหตุ Quadlet:

- บริการ Quadlet ที่สร้างขึ้นตั้งใจคงรูปแบบค่าเริ่มต้นที่แน่นอนและ hardened ไว้: พอร์ตที่เผยแพร่บน `127.0.0.1`, `--bind lan` ภายในคอนเทนเนอร์ และ user namespace แบบ `keep-id`
- pin ค่า `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` และ `TimeoutStartSec=300`
- เผยแพร่ทั้ง `127.0.0.1:18789:18789` (Gateway) และ `127.0.0.1:18790:18790` (bridge)
- อ่าน `~/.openclaw/.env` เป็น runtime `EnvironmentFile` สำหรับค่าอย่างเช่น `OPENCLAW_GATEWAY_TOKEN` แต่ไม่ได้ใช้ allowlist override เฉพาะ Podman ของ manual launcher
- หากคุณต้องการพอร์ต publish แบบกำหนดเอง, publish host หรือ flags อื่นของ container-run ให้ใช้ manual launcher หรือแก้ไข `~/.config/containers/systemd/openclaw.container` โดยตรง จากนั้น reload และ restart บริการ

## คำสั่งที่มีประโยชน์

- **บันทึกคอนเทนเนอร์:** `podman logs -f openclaw`
- **หยุดคอนเทนเนอร์:** `podman stop openclaw`
- **ลบคอนเทนเนอร์:** `podman rm -f openclaw`
- **เปิด URL dashboard จาก CLI บนโฮสต์:** `openclaw dashboard --no-open`
- **Health/status ผ่าน CLI บนโฮสต์:** `openclaw gateway status --deep` (RPC probe + การสแกน
  service เพิ่มเติม)

## การแก้ไขปัญหา

- **Permission denied (EACCES) บน config หรือ workspace:** คอนเทนเนอร์รันด้วย `--userns=keep-id` และ `--user <your uid>:<your gid>` ตามค่าเริ่มต้น ตรวจสอบให้แน่ใจว่าพาธ config/workspace บนโฮสต์เป็นของผู้ใช้ปัจจุบันของคุณ
- **การเริ่ม Gateway ถูกบล็อก (ไม่มี `gateway.mode=local`):** ตรวจสอบให้แน่ใจว่า `~/.openclaw/openclaw.json` มีอยู่และตั้งค่า `gateway.mode="local"` แล้ว `scripts/podman/setup.sh` จะสร้างสิ่งนี้หากยังไม่มี
- **คำสั่ง CLI ของคอนเทนเนอร์ไปยังเป้าหมายผิด:** ใช้ `openclaw --container <name> ...` อย่างชัดเจน หรือ export `OPENCLAW_CONTAINER=<name>` ใน shell ของคุณ
- **`openclaw update` ล้มเหลวเมื่อใช้ `--container`:** เป็นพฤติกรรมที่คาดไว้ ให้สร้างใหม่/ดึงอิมเมจ แล้ว restart คอนเทนเนอร์หรือบริการ Quadlet
- **บริการ Quadlet ไม่เริ่ม:** รัน `systemctl --user daemon-reload` แล้วรัน `systemctl --user start openclaw.service` บนระบบ headless คุณอาจต้องใช้ `sudo loginctl enable-linger "$(whoami)"` ด้วย
- **SELinux บล็อก bind mounts:** ปล่อยพฤติกรรม mount ค่าเริ่มต้นไว้ตามเดิม launcher จะเพิ่ม `:Z` อัตโนมัติบน Linux เมื่อ SELinux อยู่ในโหมด enforcing หรือ permissive

## ที่เกี่ยวข้อง

- [Docker](/th/install/docker)
- [กระบวนการเบื้องหลังของ Gateway](/th/gateway/background-process)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
