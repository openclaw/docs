---
read_when:
    - คุณต้องการ Gateway แบบคอนเทนเนอร์ด้วย Podman แทน Docker
summary: เรียกใช้ OpenClaw ในคอนเทนเนอร์ Podman แบบ rootless
title: Podman
x-i18n:
    generated_at: "2026-06-27T17:44:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f6950956551dc3c274db33712cf66632fb5facbca4954bf67c30a8bff740c2f
    source_path: install/podman.md
    workflow: 16
---

เรียกใช้ OpenClaw Gateway ในคอนเทนเนอร์ Podman แบบ rootless ซึ่งจัดการโดยผู้ใช้ปัจจุบันที่ไม่ใช่ root ของคุณ

โมเดลที่ตั้งใจไว้คือ:

- Podman เรียกใช้คอนเทนเนอร์ Gateway
- CLI `openclaw` บนโฮสต์ของคุณเป็นชั้นควบคุม
- สถานะถาวรอยู่บนโฮสต์ภายใต้ `~/.openclaw` ตามค่าเริ่มต้น
- การจัดการประจำวันใช้ `openclaw --container <name> ...` แทน `sudo -u openclaw`, `podman exec` หรือผู้ใช้บริการแยกต่างหาก

## ข้อกำหนดเบื้องต้น

- **Podman** ในโหมด rootless
- ติดตั้ง **OpenClaw CLI** บนโฮสต์
- **ไม่บังคับ:** `systemd --user` หากคุณต้องการให้ Quadlet จัดการการเริ่มอัตโนมัติ
- **ไม่บังคับ:** `sudo` เฉพาะเมื่อคุณต้องการ `loginctl enable-linger "$(whoami)"` เพื่อให้คงอยู่หลังบูตบนโฮสต์แบบไม่มีหน้าจอ

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ตั้งค่าครั้งเดียว">
    จากราก repo ให้เรียกใช้ `./scripts/podman/setup.sh`
  </Step>

  <Step title="เริ่มคอนเทนเนอร์ Gateway">
    เริ่มคอนเทนเนอร์ด้วย `./scripts/run-openclaw-podman.sh launch`
  </Step>

  <Step title="เรียกใช้ออนบอร์ดดิ้งภายในคอนเทนเนอร์">
    เรียกใช้ `./scripts/run-openclaw-podman.sh launch setup` จากนั้นเปิด `http://127.0.0.1:18789/`
  </Step>

  <Step title="จัดการคอนเทนเนอร์ที่กำลังทำงานจาก CLI บนโฮสต์">
    ตั้งค่า `OPENCLAW_CONTAINER=openclaw` จากนั้นใช้คำสั่ง `openclaw` ปกติจากโฮสต์
  </Step>
</Steps>

รายละเอียดการตั้งค่า:

- `./scripts/podman/setup.sh` สร้าง `openclaw:local` ใน rootless Podman store ของคุณตามค่าเริ่มต้น หรือใช้ `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` หากคุณตั้งค่าไว้
- สร้าง `~/.openclaw/openclaw.json` พร้อม `gateway.mode: "local"` หากยังไม่มี
- สร้าง `~/.openclaw/.env` พร้อม `OPENCLAW_GATEWAY_TOKEN` หากยังไม่มี
- สำหรับการเรียกใช้ด้วยตนเอง ตัวช่วยจะอ่านเฉพาะรายการอนุญาตขนาดเล็กของคีย์ที่เกี่ยวข้องกับ Podman จาก `~/.openclaw/.env` และส่งตัวแปร env ของ runtime แบบระบุชัดเจนไปยังคอนเทนเนอร์ โดยไม่ส่งไฟล์ env ทั้งหมดให้ Podman

การตั้งค่าที่จัดการโดย Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet เป็นตัวเลือกเฉพาะ Linux เพราะขึ้นกับบริการผู้ใช้ systemd

คุณยังสามารถตั้งค่า `OPENCLAW_PODMAN_QUADLET=1` ได้ด้วย

ตัวแปร env สำหรับการ build/ตั้งค่าเพิ่มเติม:

- `OPENCLAW_IMAGE` หรือ `OPENCLAW_PODMAN_IMAGE` -- ใช้ image ที่มีอยู่/ดึงมาแล้วแทนการ build `openclaw:local`
- `OPENCLAW_IMAGE_APT_PACKAGES` -- ติดตั้งแพ็กเกจ apt เพิ่มเติมระหว่างการ build image (ยังรองรับ `OPENCLAW_DOCKER_APT_PACKAGES` แบบเดิมด้วย)
- `OPENCLAW_IMAGE_PIP_PACKAGES` -- ติดตั้งแพ็กเกจ Python เพิ่มเติมระหว่างการ build image; ตรึงเวอร์ชันและใช้เฉพาะ package index ที่คุณเชื่อถือ
- `OPENCLAW_EXTENSIONS` -- ติดตั้ง dependency ของ Plugin ล่วงหน้าในเวลาที่ build
- `OPENCLAW_INSTALL_BROWSER` -- ติดตั้ง Chromium และ Xvfb ล่วงหน้าสำหรับ browser automation (ตั้งเป็น `1` เพื่อเปิดใช้)

การเริ่มคอนเทนเนอร์:

```bash
./scripts/run-openclaw-podman.sh launch
```

สคริปต์จะเริ่มคอนเทนเนอร์ด้วย uid/gid ปัจจุบันของคุณโดยใช้ `--userns=keep-id` และ bind-mount สถานะ OpenClaw ของคุณเข้าไปในคอนเทนเนอร์

ออนบอร์ดดิ้ง:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

จากนั้นเปิด `http://127.0.0.1:18789/` และใช้โทเค็นจาก `~/.openclaw/.env`

การยืนยันตัวตนโมเดลใน Podman:

- ใช้การยืนยันตัวตนที่ OpenClaw จัดการระหว่างการตั้งค่า: คีย์ Anthropic API สำหรับ Anthropic หรือการยืนยันตัวตนผ่าน browser OAuth/device-code ของ OpenAI Codex สำหรับ OpenAI ที่รองรับด้วย Codex
- ตัวเรียกใช้ Podman จะไม่ mount โฮมข้อมูลรับรอง CLI บนโฮสต์ เช่น `~/.claude` หรือ `~/.codex` เข้าไปในคอนเทนเนอร์ setup หรือ gateway
- การเข้าสู่ระบบ CLI บนโฮสต์ที่มีอยู่เป็นเส้นทางอำนวยความสะดวกบนโฮสต์เดียวกัน สำหรับการติดตั้งคอนเทนเนอร์ ให้เก็บการยืนยันตัวตนของ provider ไว้ในสถานะ `~/.openclaw` ที่ mount ไว้ซึ่ง setup จัดการ

ค่าเริ่มต้นของ CLI บนโฮสต์:

```bash
export OPENCLAW_CONTAINER=openclaw
```

จากนั้นคำสั่งต่อไปนี้จะทำงานภายในคอนเทนเนอร์นั้นโดยอัตโนมัติ:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

บน macOS เครื่อง Podman อาจทำให้เบราว์เซอร์ดูเหมือนไม่ใช่ local สำหรับ Gateway
หาก UI ควบคุมรายงานข้อผิดพลาด device-auth หลังจากเปิดใช้งาน ให้ใช้คำแนะนำ Tailscale ใน
[Podman และ Tailscale](#podman--tailscale)

<a id="podman--tailscale"></a>

## Podman และ Tailscale

สำหรับ HTTPS หรือการเข้าถึงเบราว์เซอร์จากระยะไกล ให้ทำตามเอกสารหลักของ Tailscale

หมายเหตุเฉพาะ Podman:

- คง host สำหรับ publish ของ Podman ไว้ที่ `127.0.0.1`
- แนะนำให้ใช้ `tailscale serve` ที่จัดการโดยโฮสต์แทน `openclaw gateway --tailscale serve`
- บน macOS หากบริบท device-auth ของเบราว์เซอร์ local ไม่น่าเชื่อถือ ให้ใช้การเข้าถึงผ่าน Tailscale แทนวิธีแก้อุโมงค์ local แบบเฉพาะกิจ

ดู:

- [Tailscale](/th/gateway/tailscale)
- [UI ควบคุม](/th/web/control-ui)

## Systemd (Quadlet, ไม่บังคับ)

หากคุณเรียกใช้ `./scripts/podman/setup.sh --quadlet` การตั้งค่าจะติดตั้งไฟล์ Quadlet ที่:

```bash
~/.config/containers/systemd/openclaw.container
```

คำสั่งที่มีประโยชน์:

- **เริ่ม:** `systemctl --user start openclaw.service`
- **หยุด:** `systemctl --user stop openclaw.service`
- **สถานะ:** `systemctl --user status openclaw.service`
- **ล็อก:** `journalctl --user -u openclaw.service -f`

หลังจากแก้ไขไฟล์ Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

เพื่อให้คงอยู่หลังบูตบนโฮสต์ SSH/ไม่มีหน้าจอ ให้เปิดใช้ lingering สำหรับผู้ใช้ปัจจุบันของคุณ:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## การกำหนดค่า, env และที่จัดเก็บ

- **ไดเรกทอรี config:** `~/.openclaw`
- **ไดเรกทอรี workspace:** `~/.openclaw/workspace`
- **ไฟล์โทเค็น:** `~/.openclaw/.env`
- **ตัวช่วยเรียกใช้:** `./scripts/run-openclaw-podman.sh`

สคริปต์เรียกใช้และ Quadlet จะ bind-mount สถานะโฮสต์เข้าไปในคอนเทนเนอร์:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

ตามค่าเริ่มต้น สิ่งเหล่านี้เป็นไดเรกทอรีบนโฮสต์ ไม่ใช่สถานะคอนเทนเนอร์แบบ anonymous ดังนั้น
`openclaw.json`, `auth-profiles.json` ต่อ agent, สถานะ channel/provider,
session และ workspace จะยังอยู่หลังเปลี่ยนคอนเทนเนอร์ใหม่
การตั้งค่า Podman ยัง seed `gateway.controlUi.allowedOrigins` สำหรับ `127.0.0.1` และ `localhost` บนพอร์ต Gateway ที่ publish เพื่อให้ dashboard local ทำงานกับ bind ที่ไม่ใช่ loopback ของคอนเทนเนอร์ได้

ตัวแปร env ที่มีประโยชน์สำหรับตัวเรียกใช้แบบ manual:

- `OPENCLAW_PODMAN_CONTAINER` -- ชื่อคอนเทนเนอร์ (`openclaw` ตามค่าเริ่มต้น)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- image ที่จะเรียกใช้
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- พอร์ตโฮสต์ที่ map ไปยังคอนเทนเนอร์ `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- พอร์ตโฮสต์ที่ map ไปยังคอนเทนเนอร์ `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- อินเทอร์เฟซโฮสต์สำหรับพอร์ตที่ publish; ค่าเริ่มต้นคือ `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- โหมด bind ของ Gateway ภายในคอนเทนเนอร์; ค่าเริ่มต้นคือ `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (ค่าเริ่มต้น), `auto` หรือ `host`

ตัวเรียกใช้แบบ manual จะอ่าน `~/.openclaw/.env` ก่อนสรุปค่าเริ่มต้นของคอนเทนเนอร์/image ดังนั้นคุณจึงสามารถเก็บค่าเหล่านี้ไว้ที่นั่นได้

หากคุณใช้ `OPENCLAW_CONFIG_DIR` หรือ `OPENCLAW_WORKSPACE_DIR` ที่ไม่ใช่ค่าเริ่มต้น ให้ตั้งค่าตัวแปรเดียวกันสำหรับทั้งคำสั่ง `./scripts/podman/setup.sh` และคำสั่ง `./scripts/run-openclaw-podman.sh launch` ในภายหลัง ตัวเรียกใช้ใน repo-local จะไม่คงค่า override path แบบกำหนดเองข้าม shell

หมายเหตุ Quadlet:

- บริการ Quadlet ที่สร้างขึ้นตั้งใจคงรูปแบบค่าเริ่มต้นที่ตายตัวและ harden แล้ว: พอร์ตที่ publish บน `127.0.0.1`, `--bind lan` ภายในคอนเทนเนอร์ และ namespace ผู้ใช้ `keep-id`
- ตรึง `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` และ `TimeoutStartSec=300`
- publish ทั้ง `127.0.0.1:18789:18789` (Gateway) และ `127.0.0.1:18790:18790` (bridge)
- อ่าน `~/.openclaw/.env` เป็น `EnvironmentFile` ของ runtime สำหรับค่าอย่าง `OPENCLAW_GATEWAY_TOKEN` แต่ไม่ใช้รายการอนุญาต override เฉพาะ Podman ของตัวเรียกใช้แบบ manual
- หากคุณต้องการพอร์ต publish, host สำหรับ publish หรือ flag อื่นของ container-run แบบกำหนดเอง ให้ใช้ตัวเรียกใช้แบบ manual หรือแก้ไข `~/.config/containers/systemd/openclaw.container` โดยตรง จากนั้น reload และ restart บริการ

## คำสั่งที่มีประโยชน์

- **ล็อกคอนเทนเนอร์:** `podman logs -f openclaw`
- **หยุดคอนเทนเนอร์:** `podman stop openclaw`
- **ลบคอนเทนเนอร์:** `podman rm -f openclaw`
- **เปิด URL dashboard จาก CLI บนโฮสต์:** `openclaw dashboard --no-open`
- **สุขภาพ/สถานะผ่าน CLI บนโฮสต์:** `openclaw gateway status --deep` (RPC probe + extra
  service scan)

## การแก้ไขปัญหา

- **Permission denied (EACCES) บน config หรือ workspace:** คอนเทนเนอร์ทำงานด้วย `--userns=keep-id` และ `--user <your uid>:<your gid>` ตามค่าเริ่มต้น ตรวจสอบให้แน่ใจว่า path config/workspace บนโฮสต์เป็นของผู้ใช้ปัจจุบันของคุณ
- **การเริ่ม Gateway ถูกบล็อก (ไม่มี `gateway.mode=local`):** ตรวจสอบให้แน่ใจว่า `~/.openclaw/openclaw.json` มีอยู่และตั้งค่า `gateway.mode="local"` แล้ว `scripts/podman/setup.sh` จะสร้างสิ่งนี้หากยังไม่มี
- **คำสั่ง CLI ของคอนเทนเนอร์ไปยังเป้าหมายผิด:** ใช้ `openclaw --container <name> ...` อย่างชัดเจน หรือ export `OPENCLAW_CONTAINER=<name>` ใน shell ของคุณ
- **`openclaw update` ล้มเหลวพร้อม `--container`:** เป็นไปตามที่คาดไว้ ให้ rebuild/pull image จากนั้น restart คอนเทนเนอร์หรือบริการ Quadlet
- **บริการ Quadlet ไม่เริ่ม:** เรียกใช้ `systemctl --user daemon-reload` จากนั้น `systemctl --user start openclaw.service` บนระบบแบบไม่มีหน้าจอ คุณอาจต้องใช้ `sudo loginctl enable-linger "$(whoami)"` ด้วย
- **SELinux บล็อก bind mount:** คงพฤติกรรม mount ค่าเริ่มต้นไว้ ตัวเรียกใช้จะเพิ่ม `:Z` อัตโนมัติบน Linux เมื่อ SELinux อยู่ในโหมด enforcing หรือ permissive

## ที่เกี่ยวข้อง

- [Docker](/th/install/docker)
- [กระบวนการเบื้องหลังของ Gateway](/th/gateway/background-process)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
