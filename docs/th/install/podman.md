---
read_when:
    - คุณต้องการ Gateway ที่ทำงานในคอนเทนเนอร์ด้วย Podman แทน Docker
summary: เรียกใช้ OpenClaw ในคอนเทนเนอร์ Podman แบบไม่ใช้สิทธิ์ root
title: Podman
x-i18n:
    generated_at: "2026-07-12T16:17:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

เรียกใช้ OpenClaw Gateway ในคอนเทนเนอร์ Podman แบบไม่ใช้สิทธิ์ root ซึ่งจัดการโดยผู้ใช้ปัจจุบันที่ไม่ใช่ root ของคุณ

รูปแบบการทำงาน:

- Podman เรียกใช้คอนเทนเนอร์ Gateway
- CLI `openclaw` บนโฮสต์ของคุณทำหน้าที่เป็นระนาบควบคุม
- โดยค่าเริ่มต้น สถานะถาวรจะอยู่บนโฮสต์ภายใต้ `~/.openclaw`
- การจัดการในแต่ละวันใช้ `openclaw --container <name> ...` แทน `sudo -u openclaw`, `podman exec` หรือผู้ใช้บริการแยกต่างหาก

## ข้อกำหนดเบื้องต้น

- **Podman** ในโหมดไม่ใช้สิทธิ์ root
- ติดตั้ง **OpenClaw CLI** บนโฮสต์แล้ว
- **ไม่บังคับ:** `systemd --user` หากต้องการให้ Quadlet จัดการการเริ่มทำงานอัตโนมัติ
- **ไม่บังคับ:** `sudo` เฉพาะเมื่อต้องการใช้ `loginctl enable-linger "$(whoami)"` เพื่อให้ทำงานต่อเนื่องหลังบูตบนโฮสต์แบบไม่มีหน้าจอ

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ตั้งค่าครั้งเดียว">
    จากรากของรีโพซิทอรี ให้เรียกใช้ `./scripts/podman/setup.sh`

    คำสั่งนี้จะสร้าง `openclaw:local` ในที่เก็บ Podman แบบไม่ใช้สิทธิ์ root ของคุณ (หรือดึง `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` หากกำหนดไว้) สร้าง `~/.openclaw/openclaw.json` พร้อม `gateway.mode: "local"` หากยังไม่มี และสร้าง `~/.openclaw/.env` พร้อม `OPENCLAW_GATEWAY_TOKEN` ที่สร้างขึ้นใหม่หากยังไม่มี

    ตัวแปรสภาพแวดล้อมขณะบิลด์ที่ไม่บังคับ:

    | ตัวแปร | ผลลัพธ์ |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | ใช้อิมเมจที่มีอยู่หรือดึงมาแทนการบิลด์ `openclaw:local` |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | ติดตั้งแพ็กเกจ apt เพิ่มเติมระหว่างการบิลด์อิมเมจ (รองรับ `OPENCLAW_DOCKER_APT_PACKAGES` แบบเดิมด้วย) |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | ติดตั้งแพ็กเกจ Python เพิ่มเติมระหว่างการบิลด์อิมเมจ โดยให้ตรึงเวอร์ชันและใช้เฉพาะดัชนีแพ็กเกจที่คุณเชื่อถือ |
    | `OPENCLAW_EXTENSIONS` | คอมไพล์/จัดแพ็กเกจ Plugin ที่รองรับและเลือกไว้ พร้อมติดตั้งการขึ้นต่อกันสำหรับรันไทม์ |
    | `OPENCLAW_INSTALL_BROWSER` | ติดตั้ง Chromium และ Xvfb ล่วงหน้าสำหรับระบบอัตโนมัติบนเบราว์เซอร์ (กำหนดเป็น `1`) |

    หากต้องการใช้การตั้งค่าที่จัดการโดย Quadlet แทน (เฉพาะ Linux + บริการผู้ใช้ systemd):

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    หรือกำหนด `OPENCLAW_PODMAN_QUADLET=1`

  </Step>

  <Step title="เริ่มคอนเทนเนอร์ Gateway">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    เริ่มคอนเทนเนอร์ด้วย uid/gid ปัจจุบันของคุณโดยใช้ `--userns=keep-id` และเมานต์แบบผูกสถานะ OpenClaw ของคุณเข้าไปในคอนเทนเนอร์

  </Step>

  <Step title="ดำเนินการเริ่มต้นใช้งานภายในคอนเทนเนอร์">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    จากนั้นเปิด `http://127.0.0.1:18789/` และใช้โทเค็นจาก `~/.openclaw/.env`

    การยืนยันตัวตนของโมเดล: ใช้การยืนยันตัวตนที่ OpenClaw จัดการระหว่างการตั้งค่า (คีย์ Anthropic API หรือ OAuth ผ่านเบราว์เซอร์/การยืนยันตัวตนด้วยรหัสอุปกรณ์ของ OpenAI Codex สำหรับ OpenAI ที่ใช้ Codex) ตัวเรียกใช้งาน Podman จะไม่เมานต์โฮมที่เก็บข้อมูลรับรอง CLI ของโฮสต์ เช่น `~/.claude` หรือ `~/.codex` เข้าไปในคอนเทนเนอร์สำหรับการตั้งค่าหรือ Gateway การเข้าสู่ระบบ CLI บนโฮสต์ที่มีอยู่เป็นเพียงช่องทางอำนวยความสะดวกเมื่อใช้โฮสต์เดียวกันเท่านั้น สำหรับการติดตั้งในคอนเทนเนอร์ ให้เก็บการยืนยันตัวตนของผู้ให้บริการไว้ในสถานะ `~/.openclaw` ที่เมานต์ไว้และจัดการโดยการตั้งค่า

  </Step>

  <Step title="จัดการคอนเทนเนอร์ที่กำลังทำงานจาก CLI บนโฮสต์">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    จากนั้นคำสั่ง `openclaw` ปกติจะทำงานภายในคอนเทนเนอร์นั้นโดยอัตโนมัติ:

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # includes extra service scan
    openclaw doctor
    openclaw channels login
    ```

    บน macOS เครื่อง Podman อาจทำให้เบราว์เซอร์ดูเหมือนไม่ได้อยู่ภายในเครื่องสำหรับ Gateway หาก Control UI รายงานข้อผิดพลาดการยืนยันตัวตนอุปกรณ์หลังจากเริ่มทำงาน ให้ใช้คำแนะนำเกี่ยวกับ Tailscale ใน [Podman และ Tailscale](#podman-and-tailscale)

  </Step>
</Steps>

ตัวเรียกใช้งานด้วยตนเองจะอ่านเฉพาะรายการคีย์ที่เกี่ยวข้องกับ Podman ซึ่งอนุญาตไว้จำนวนเล็กน้อยจาก `~/.openclaw/.env` และส่งตัวแปรสภาพแวดล้อมรันไทม์อย่างชัดเจนไปยังคอนเทนเนอร์ โดยจะไม่ส่งไฟล์สภาพแวดล้อมทั้งหมดให้ Podman

<a id="podman-and-tailscale"></a>

## Podman และ Tailscale

สำหรับ HTTPS หรือการเข้าถึงเบราว์เซอร์จากระยะไกล ให้ทำตามเอกสารหลักของ Tailscale

หมายเหตุเฉพาะสำหรับ Podman:

- ให้โฮสต์ที่ Podman เผยแพร่คงเป็น `127.0.0.1`
- ควรใช้ `tailscale serve` ที่จัดการโดยโฮสต์แทน `openclaw gateway --tailscale serve`
- บน macOS หากบริบทการยืนยันตัวตนอุปกรณ์ของเบราว์เซอร์ภายในเครื่องไม่น่าเชื่อถือ ให้ใช้การเข้าถึงผ่าน Tailscale แทนวิธีแก้ขัดด้วยทันเนลภายในเครื่องแบบเฉพาะกิจ

ดู [Tailscale](/th/gateway/tailscale) และ [Control UI](/th/web/control-ui)

## Systemd (Quadlet ไม่บังคับ)

หากคุณเรียกใช้ `./scripts/podman/setup.sh --quadlet` การตั้งค่าจะติดตั้งไฟล์ Quadlet ที่ `~/.config/containers/systemd/openclaw.container`

| การดำเนินการ | คำสั่ง                                     |
| ------------ | ------------------------------------------ |
| เริ่ม        | `systemctl --user start openclaw.service`  |
| หยุด         | `systemctl --user stop openclaw.service`   |
| สถานะ        | `systemctl --user status openclaw.service` |
| บันทึก       | `journalctl --user -u openclaw.service -f` |

หลังจากแก้ไขไฟล์ Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

เพื่อให้ทำงานต่อเนื่องหลังบูตบนโฮสต์ SSH/แบบไม่มีหน้าจอ ให้เปิดใช้งาน lingering สำหรับผู้ใช้ปัจจุบันของคุณ:

```bash
sudo loginctl enable-linger "$(whoami)"
```

บริการ Quadlet ที่สร้างขึ้นจะคงรูปแบบเริ่มต้นที่ตายตัวและเสริมความแข็งแกร่งด้านความปลอดภัย ได้แก่ พอร์ตที่เผยแพร่บน `127.0.0.1` (`18789` สำหรับ Gateway, `18790` สำหรับบริดจ์), `--bind lan` ภายในคอนเทนเนอร์, เนมสเปซผู้ใช้ `keep-id`, `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` และ `TimeoutStartSec=300` โดยจะอ่าน `~/.openclaw/.env` เป็น `EnvironmentFile` สำหรับรันไทม์เพื่อรับค่าต่างๆ เช่น `OPENCLAW_GATEWAY_TOKEN` แต่จะไม่ใช้รายการอนุญาตการแทนค่าที่เฉพาะเจาะจงกับ Podman ของตัวเรียกใช้งานด้วยตนเอง สำหรับพอร์ตที่เผยแพร่แบบกำหนดเอง โฮสต์ที่เผยแพร่ หรือแฟล็กอื่นๆ สำหรับการเรียกใช้คอนเทนเนอร์ ให้ใช้ตัวเรียกใช้งานด้วยตนเองแทน หรือแก้ไข `~/.config/containers/systemd/openclaw.container` โดยตรง แล้วโหลดใหม่และเริ่มบริการใหม่

## การกำหนดค่า สภาพแวดล้อม และพื้นที่จัดเก็บ

- **ไดเรกทอรีการกำหนดค่า:** `~/.openclaw`
- **ไดเรกทอรีพื้นที่ทำงาน:** `~/.openclaw/workspace`
- **ไฟล์โทเค็น:** `~/.openclaw/.env`
- **ตัวช่วยเรียกใช้งาน:** `./scripts/run-openclaw-podman.sh`

สคริปต์เรียกใช้งานและ Quadlet จะเมานต์แบบผูกสถานะบนโฮสต์เข้าไปในคอนเทนเนอร์: `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace` โดยค่าเริ่มต้น ตำแหน่งเหล่านี้เป็นไดเรกทอรีบนโฮสต์ ไม่ใช่สถานะคอนเทนเนอร์แบบไม่ระบุตัวตน ดังนั้น `openclaw.json`, `auth-profiles.json` ของแต่ละเอเจนต์, สถานะช่องทาง/ผู้ให้บริการ, เซสชัน และพื้นที่ทำงานจะยังคงอยู่เมื่อเปลี่ยนคอนเทนเนอร์ การตั้งค่ายังกำหนดค่าเริ่มต้นให้ `gateway.controlUi.allowedOrigins` สำหรับ `127.0.0.1` และ `localhost` บนพอร์ต Gateway ที่เผยแพร่ เพื่อให้แดชบอร์ดภายในเครื่องทำงานกับการผูกที่ไม่ใช่ลูปแบ็กของคอนเทนเนอร์

ตัวแปรสภาพแวดล้อมที่มีประโยชน์สำหรับตัวเรียกใช้งานด้วยตนเอง (บันทึกค่าเหล่านี้ไว้ใน `~/.openclaw/.env` โดยตัวเรียกใช้งานจะอ่านไฟล์นี้ก่อนกำหนดค่าเริ่มต้นสุดท้ายของคอนเทนเนอร์/อิมเมจ):

| ตัวแปร                                      | ค่าเริ่มต้น       | ผลลัพธ์                                      |
| ------------------------------------------ | ---------------- | -------------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`       | ชื่อคอนเทนเนอร์                              |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local` | อิมเมจที่จะเรียกใช้                          |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | พอร์ตโฮสต์ที่แมปกับพอร์ต `18789` ของคอนเทนเนอร์ |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | พอร์ตโฮสต์ที่แมปกับพอร์ต `18790` ของคอนเทนเนอร์ |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | อินเทอร์เฟซโฮสต์สำหรับพอร์ตที่เผยแพร่        |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`            | โหมดการผูก Gateway ภายในคอนเทนเนอร์          |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`        | `keep-id`, `auto` หรือ `host`                |

หากคุณใช้ `OPENCLAW_CONFIG_DIR` หรือ `OPENCLAW_WORKSPACE_DIR` ที่ไม่ใช่ค่าเริ่มต้น ให้กำหนดตัวแปรเดียวกันสำหรับทั้งคำสั่ง `./scripts/podman/setup.sh` และคำสั่ง `./scripts/run-openclaw-podman.sh launch` ที่เรียกใช้ในภายหลัง เพราะตัวเรียกใช้งานภายในรีโพซิทอรีจะไม่เก็บค่าตำแหน่งแบบกำหนดเองไว้ข้ามเชลล์

## การอัปเกรดอิมเมจ

หลังจากบิลด์ใหม่หรือดึงอิมเมจใหม่แล้ว ให้เริ่มคอนเทนเนอร์หรือบริการ Quadlet ใหม่
เมื่อเริ่มทำงานครั้งแรกสำหรับ OpenClaw เวอร์ชันใหม่ Gateway จะดำเนินการซ่อมแซมสถานะและ
Plugin อย่างปลอดภัยก่อนรายงานว่าพร้อมใช้งาน

หาก Gateway ออกจากการทำงานแทนที่จะพร้อมใช้งาน ให้เรียกใช้อิมเมจเดียวกันหนึ่งครั้งด้วย
`openclaw doctor --fix` กับสถานะ/การกำหนดค่าที่เมานต์ชุดเดียวกัน จากนั้นเริ่ม
Gateway ใหม่ตามปกติ:

```bash
OPENCLAW_CONFIG_DIR="${OPENCLAW_CONFIG_DIR:-$HOME/.openclaw}"
OPENCLAW_WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$OPENCLAW_CONFIG_DIR/workspace}"
OPENCLAW_PODMAN_IMAGE="${OPENCLAW_PODMAN_IMAGE:-${OPENCLAW_IMAGE:-openclaw:local}}"

podman run --rm -it \
  --userns=keep-id \
  --user "$(id -u):$(id -g)" \
  -e HOME=/home/node \
  -e NPM_CONFIG_CACHE=/home/node/.openclaw/.npm \
  -v "$OPENCLAW_CONFIG_DIR:/home/node/.openclaw:rw" \
  -v "$OPENCLAW_WORKSPACE_DIR:/home/node/.openclaw/workspace:rw" \
  "$OPENCLAW_PODMAN_IMAGE" \
  openclaw doctor --fix
```

บนโฮสต์ SELinux ให้เพิ่ม `,Z` ในการเมานต์แบบผูกทั้งสองรายการ หาก Podman ปิดกั้นการเข้าถึง
สถานะที่เมานต์ไว้

## คำสั่งที่มีประโยชน์

- **บันทึกคอนเทนเนอร์:** `podman logs -f openclaw`
- **หยุดคอนเทนเนอร์:** `podman stop openclaw`
- **ลบคอนเทนเนอร์:** `podman rm -f openclaw`
- **เปิด URL แดชบอร์ดจาก CLI บนโฮสต์:** `openclaw dashboard --no-open`
- **ตรวจสอบสถานภาพ/สถานะผ่าน CLI บนโฮสต์:** `openclaw gateway status --deep` (การตรวจสอบ RPC + การสแกนบริการเพิ่มเติม)

## การแก้ไขปัญหา

- **ถูกปฏิเสธสิทธิ์ (EACCES) ในการกำหนดค่าหรือพื้นที่ทำงาน:** โดยค่าเริ่มต้น คอนเทนเนอร์ทำงานด้วย `--userns=keep-id` และ `--user <your uid>:<your gid>` ตรวจสอบให้แน่ใจว่าตำแหน่งการกำหนดค่า/พื้นที่ทำงานบนโฮสต์เป็นของผู้ใช้ปัจจุบันของคุณ
- **การเริ่ม Gateway ถูกปิดกั้น (ไม่มี `gateway.mode=local`):** ตรวจสอบให้แน่ใจว่ามี `~/.openclaw/openclaw.json` และกำหนด `gateway.mode="local"` โดย `scripts/podman/setup.sh` จะสร้างให้หากยังไม่มี
- **คอนเทนเนอร์เริ่มใหม่หลังอัปเดตอิมเมจ:** เรียกใช้คำสั่ง `openclaw doctor --fix` แบบครั้งเดียวใน [การอัปเกรดอิมเมจ](#upgrading-images) แล้วเริ่ม Gateway อีกครั้ง
- **คำสั่ง CLI ของคอนเทนเนอร์ไปยังเป้าหมายผิด:** ใช้ `openclaw --container <name> ...` อย่างชัดเจน หรือส่งออก `OPENCLAW_CONTAINER=<name>` ในเชลล์ของคุณ
- **`openclaw update` ล้มเหลวเมื่อใช้ `--container`:** เป็นพฤติกรรมที่คาดไว้ ให้บิลด์ใหม่/ดึงอิมเมจ แล้วเริ่มคอนเทนเนอร์หรือบริการ Quadlet ใหม่
- **บริการ Quadlet ไม่เริ่มทำงาน:** เรียกใช้ `systemctl --user daemon-reload` แล้วจึงเรียกใช้ `systemctl --user start openclaw.service` บนระบบแบบไม่มีหน้าจอ คุณอาจต้องใช้ `sudo loginctl enable-linger "$(whoami)"` เพิ่มเติม
- **SELinux ปิดกั้นการเมานต์แบบผูก:** คงพฤติกรรมการเมานต์เริ่มต้นไว้ ตัวเรียกใช้งานจะเพิ่ม `:Z` โดยอัตโนมัติบน Linux เมื่อ SELinux อยู่ในโหมดบังคับใช้หรืออนุญาต

## เนื้อหาที่เกี่ยวข้อง

- [Docker](/th/install/docker)
- [กระบวนการเบื้องหลังของ Gateway](/th/gateway/background-process)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
