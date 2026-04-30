---
read_when:
    - คุณต้องการ Gateway แบบคอนเทนเนอร์ด้วย Podman แทน Docker
summary: เรียกใช้ OpenClaw ในคอนเทนเนอร์ Podman แบบไม่ใช้สิทธิ์ root
title: Podman
x-i18n:
    generated_at: "2026-04-30T10:01:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfdcbbdb62c2f8ca2d6d370b742003e6f92f6921a38c00ba19e810d83e350647
    source_path: install/podman.md
    workflow: 16
---

เรียกใช้ OpenClaw Gateway ในคอนเทนเนอร์ Podman แบบ rootless ที่จัดการโดยผู้ใช้ non-root ปัจจุบันของคุณ

โมเดลที่ตั้งใจไว้คือ:

- Podman เรียกใช้คอนเทนเนอร์ Gateway
- CLI `openclaw` บนโฮสต์ของคุณคือระนาบควบคุม
- สถานะถาวรอยู่บนโฮสต์ภายใต้ `~/.openclaw` ตามค่าเริ่มต้น
- การจัดการประจำวันใช้ `openclaw --container <name> ...` แทน `sudo -u openclaw`, `podman exec` หรือผู้ใช้บริการแยกต่างหาก

## ข้อกำหนดเบื้องต้น

- **Podman** ในโหมด rootless
- ติดตั้ง **OpenClaw CLI** บนโฮสต์แล้ว
- **ไม่บังคับ:** `systemd --user` หากคุณต้องการการเริ่มอัตโนมัติที่จัดการโดย Quadlet
- **ไม่บังคับ:** `sudo` เฉพาะเมื่อคุณต้องการ `loginctl enable-linger "$(whoami)"` เพื่อให้คงอยู่หลังบูตบนโฮสต์แบบ headless

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ตั้งค่าครั้งเดียว">
    จากรูทของ repo ให้เรียกใช้ `./scripts/podman/setup.sh`
  </Step>

  <Step title="เริ่มคอนเทนเนอร์ Gateway">
    เริ่มคอนเทนเนอร์ด้วย `./scripts/run-openclaw-podman.sh launch`
  </Step>

  <Step title="เรียกใช้ onboarding ภายในคอนเทนเนอร์">
    เรียกใช้ `./scripts/run-openclaw-podman.sh launch setup` จากนั้นเปิด `http://127.0.0.1:18789/`
  </Step>

  <Step title="จัดการคอนเทนเนอร์ที่กำลังทำงานจาก CLI บนโฮสต์">
    ตั้งค่า `OPENCLAW_CONTAINER=openclaw` จากนั้นใช้คำสั่ง `openclaw` ปกติจากโฮสต์
  </Step>
</Steps>

รายละเอียดการตั้งค่า:

- `./scripts/podman/setup.sh` สร้าง `openclaw:local` ในสโตร์ Podman แบบ rootless ของคุณตามค่าเริ่มต้น หรือใช้ `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` หากคุณตั้งค่าไว้
- จะสร้าง `~/.openclaw/openclaw.json` พร้อม `gateway.mode: "local"` หากยังไม่มี
- จะสร้าง `~/.openclaw/.env` พร้อม `OPENCLAW_GATEWAY_TOKEN` หากยังไม่มี
- สำหรับการเปิดแบบแมนนวล ตัวช่วยจะอ่านเฉพาะ allowlist ขนาดเล็กของคีย์ที่เกี่ยวข้องกับ Podman จาก `~/.openclaw/.env` และส่งตัวแปรสภาพแวดล้อมรันไทม์แบบระบุชัดเจนไปยังคอนเทนเนอร์ โดยจะไม่ส่งไฟล์ env ทั้งหมดให้ Podman

การตั้งค่าที่จัดการโดย Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet เป็นตัวเลือกสำหรับ Linux เท่านั้น เพราะขึ้นอยู่กับบริการผู้ใช้ของ systemd

คุณยังสามารถตั้งค่า `OPENCLAW_PODMAN_QUADLET=1` ได้ด้วย

ตัวแปรสภาพแวดล้อมสำหรับ build/setup ที่ไม่บังคับ:

- `OPENCLAW_IMAGE` หรือ `OPENCLAW_PODMAN_IMAGE` -- ใช้อิมเมจที่มีอยู่/ดึงมาแล้วแทนการสร้าง `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- ติดตั้งแพ็กเกจ apt เพิ่มเติมระหว่างการสร้างอิมเมจ
- `OPENCLAW_EXTENSIONS` -- ติดตั้ง dependency ของ plugin ล่วงหน้าตอน build
- `OPENCLAW_INSTALL_BROWSER` -- ติดตั้ง Chromium และ Xvfb ล่วงหน้าสำหรับระบบอัตโนมัติของเบราว์เซอร์ (ตั้งเป็น `1` เพื่อเปิดใช้)

การเริ่มคอนเทนเนอร์:

```bash
./scripts/run-openclaw-podman.sh launch
```

สคริปต์จะเริ่มคอนเทนเนอร์ด้วย uid/gid ปัจจุบันของคุณ พร้อม `--userns=keep-id` และ bind-mount สถานะ OpenClaw ของคุณเข้าไปในคอนเทนเนอร์

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

จากนั้นเปิด `http://127.0.0.1:18789/` และใช้โทเค็นจาก `~/.openclaw/.env`

ค่าเริ่มต้นของ CLI บนโฮสต์:

```bash
export OPENCLAW_CONTAINER=openclaw
```

จากนั้นคำสั่งเช่นต่อไปนี้จะทำงานภายในคอนเทนเนอร์นั้นโดยอัตโนมัติ:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

บน macOS, Podman machine อาจทำให้เบราว์เซอร์ดูเหมือนไม่ได้เป็น local ต่อ Gateway
หาก Control UI รายงานข้อผิดพลาด device-auth หลังเปิดใช้งาน ให้ใช้คำแนะนำ Tailscale ใน
[Podman + Tailscale](#podman--tailscale)

<a id="podman--tailscale"></a>

## Podman + Tailscale

สำหรับ HTTPS หรือการเข้าถึงจากเบราว์เซอร์ระยะไกล ให้ทำตามเอกสาร Tailscale หลัก

หมายเหตุเฉพาะของ Podman:

- คงค่าโฮสต์สำหรับ publish ของ Podman ไว้ที่ `127.0.0.1`
- แนะนำให้ใช้ `tailscale serve` ที่จัดการโดยโฮสต์ แทน `openclaw gateway --tailscale serve`
- บน macOS หากบริบท device-auth ของเบราว์เซอร์ local ไม่น่าเชื่อถือ ให้ใช้การเข้าถึงผ่าน Tailscale แทนวิธีแก้ชั่วคราวด้วยอุโมงค์ local แบบเฉพาะกิจ

ดูเพิ่มเติม:

- [Tailscale](/th/gateway/tailscale)
- [Control UI](/th/web/control-ui)

## Systemd (Quadlet, ไม่บังคับ)

หากคุณเรียกใช้ `./scripts/podman/setup.sh --quadlet` การตั้งค่าจะติดตั้งไฟล์ Quadlet ไว้ที่:

```bash
~/.config/containers/systemd/openclaw.container
```

คำสั่งที่มีประโยชน์:

- **เริ่ม:** `systemctl --user start openclaw.service`
- **หยุด:** `systemctl --user stop openclaw.service`
- **สถานะ:** `systemctl --user status openclaw.service`
- **ล็อก:** `journalctl --user -u openclaw.service -f`

หลังแก้ไขไฟล์ Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

เพื่อให้คงอยู่หลังบูตบนโฮสต์ SSH/headless ให้เปิดใช้ lingering สำหรับผู้ใช้ปัจจุบันของคุณ:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Config, env และพื้นที่จัดเก็บ

- **ไดเรกทอรี config:** `~/.openclaw`
- **ไดเรกทอรี workspace:** `~/.openclaw/workspace`
- **ไฟล์โทเค็น:** `~/.openclaw/.env`
- **ตัวช่วยเปิดใช้งาน:** `./scripts/run-openclaw-podman.sh`

สคริปต์เปิดใช้งานและ Quadlet จะ bind-mount สถานะบนโฮสต์เข้าไปในคอนเทนเนอร์:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

ตามค่าเริ่มต้น สิ่งเหล่านี้คือไดเรกทอรีบนโฮสต์ ไม่ใช่สถานะคอนเทนเนอร์แบบ anonymous ดังนั้น
`openclaw.json`, `auth-profiles.json` ราย agent, สถานะ channel/provider,
เซสชัน และ workspace จะยังอยู่รอดหลังเปลี่ยนคอนเทนเนอร์
การตั้งค่า Podman ยัง seed `gateway.controlUi.allowedOrigins` สำหรับ `127.0.0.1` และ `localhost` บนพอร์ต Gateway ที่ publish แล้ว เพื่อให้แดชบอร์ด local ทำงานกับการ bind แบบ non-loopback ของคอนเทนเนอร์

ตัวแปรสภาพแวดล้อมที่มีประโยชน์สำหรับตัวเปิดแบบแมนนวล:

- `OPENCLAW_PODMAN_CONTAINER` -- ชื่อคอนเทนเนอร์ (`openclaw` ตามค่าเริ่มต้น)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- อิมเมจที่จะเรียกใช้
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- พอร์ตโฮสต์ที่แมปไปยังคอนเทนเนอร์ `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- พอร์ตโฮสต์ที่แมปไปยังคอนเทนเนอร์ `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- อินเทอร์เฟซโฮสต์สำหรับพอร์ตที่ publish; ค่าเริ่มต้นคือ `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- โหมด bind ของ Gateway ภายในคอนเทนเนอร์; ค่าเริ่มต้นคือ `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (ค่าเริ่มต้น), `auto` หรือ `host`

ตัวเปิดแบบแมนนวลจะอ่าน `~/.openclaw/.env` ก่อนสรุปค่าเริ่มต้นของคอนเทนเนอร์/อิมเมจ ดังนั้นคุณสามารถเก็บค่าเหล่านี้ไว้ที่นั่นได้

หากคุณใช้ `OPENCLAW_CONFIG_DIR` หรือ `OPENCLAW_WORKSPACE_DIR` ที่ไม่ใช่ค่าเริ่มต้น ให้ตั้งค่าตัวแปรเดียวกันสำหรับทั้งคำสั่ง `./scripts/podman/setup.sh` และคำสั่ง `./scripts/run-openclaw-podman.sh launch` ในภายหลัง ตัวเปิดแบบ repo-local จะไม่เก็บ path override แบบกำหนดเองข้าม shell

หมายเหตุ Quadlet:

- บริการ Quadlet ที่สร้างขึ้นตั้งใจคงรูปแบบค่าเริ่มต้นที่ตายตัวและแข็งแรงไว้: พอร์ตที่ publish บน `127.0.0.1`, `--bind lan` ภายในคอนเทนเนอร์ และ namespace ผู้ใช้ `keep-id`
- จะ pin `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` และ `TimeoutStartSec=300`
- จะ publish ทั้ง `127.0.0.1:18789:18789` (Gateway) และ `127.0.0.1:18790:18790` (bridge)
- จะอ่าน `~/.openclaw/.env` เป็น `EnvironmentFile` ขณะรันไทม์สำหรับค่าต่าง ๆ เช่น `OPENCLAW_GATEWAY_TOKEN` แต่จะไม่ใช้ allowlist override เฉพาะ Podman ของตัวเปิดแบบแมนนวล
- หากคุณต้องการพอร์ต publish, โฮสต์ publish หรือแฟล็ก container-run อื่น ๆ แบบกำหนดเอง ให้ใช้ตัวเปิดแบบแมนนวล หรือแก้ไข `~/.config/containers/systemd/openclaw.container` โดยตรง จากนั้น reload และ restart บริการ

## คำสั่งที่มีประโยชน์

- **ล็อกคอนเทนเนอร์:** `podman logs -f openclaw`
- **หยุดคอนเทนเนอร์:** `podman stop openclaw`
- **ลบคอนเทนเนอร์:** `podman rm -f openclaw`
- **เปิด URL แดชบอร์ดจาก CLI บนโฮสต์:** `openclaw dashboard --no-open`
- **Health/status ผ่าน CLI บนโฮสต์:** `openclaw gateway status --deep` (RPC probe + การสแกนบริการเพิ่มเติม)

## การแก้ไขปัญหา

- **Permission denied (EACCES) บน config หรือ workspace:** คอนเทนเนอร์ทำงานด้วย `--userns=keep-id` และ `--user <your uid>:<your gid>` ตามค่าเริ่มต้น ตรวจสอบให้แน่ใจว่า path config/workspace บนโฮสต์มีผู้ใช้ปัจจุบันของคุณเป็นเจ้าของ
- **การเริ่ม Gateway ถูกบล็อก (ไม่มี `gateway.mode=local`):** ตรวจสอบให้แน่ใจว่า `~/.openclaw/openclaw.json` มีอยู่และตั้งค่า `gateway.mode="local"` แล้ว `scripts/podman/setup.sh` จะสร้างสิ่งนี้หากยังไม่มี
- **คำสั่ง CLI ของคอนเทนเนอร์ไปยังเป้าหมายผิด:** ใช้ `openclaw --container <name> ...` อย่างชัดเจน หรือ export `OPENCLAW_CONTAINER=<name>` ใน shell ของคุณ
- **`openclaw update` ล้มเหลวเมื่อใช้ `--container`:** เป็นพฤติกรรมที่คาดไว้ ให้สร้าง/ดึงอิมเมจใหม่ จากนั้น restart คอนเทนเนอร์หรือบริการ Quadlet
- **บริการ Quadlet ไม่เริ่ม:** เรียกใช้ `systemctl --user daemon-reload` จากนั้น `systemctl --user start openclaw.service` บนระบบ headless คุณอาจต้องใช้ `sudo loginctl enable-linger "$(whoami)"` ด้วย
- **SELinux บล็อก bind mounts:** ปล่อยพฤติกรรม mount ค่าเริ่มต้นไว้ตามเดิม ตัวเปิดจะเพิ่ม `:Z` โดยอัตโนมัติบน Linux เมื่อ SELinux อยู่ในโหมด enforcing หรือ permissive

## ที่เกี่ยวข้อง

- [Docker](/th/install/docker)
- [กระบวนการเบื้องหลังของ Gateway](/th/gateway/background-process)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
