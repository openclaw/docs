---
read_when:
    - การตั้งค่า OpenClaw บน Oracle Cloud
    - กำลังมองหาโฮสติ้ง VPS ฟรีสำหรับ OpenClaw
    - ต้องการใช้งาน OpenClaw ตลอด 24 ชั่วโมงทุกวันบนเซิร์ฟเวอร์ขนาดเล็ก
summary: โฮสต์ OpenClaw บนแพ็กเกจ ARM แบบ Always Free ของ Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-07-12T16:19:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e1eb95b6bc8ad73e1492a03d8ebe32d89c80e58347614e6ae12d2d3d926d577
    source_path: install/oracle.md
    workflow: 16
---

เรียกใช้ OpenClaw Gateway แบบถาวรบนระดับ ARM แบบ **Always Free** ของ Oracle Cloud (สูงสุด 4 OCPU, RAM 24 GB, พื้นที่จัดเก็บข้อมูล 200 GB) โดยไม่มีค่าใช้จ่าย

## ข้อกำหนดเบื้องต้น

- บัญชี Oracle Cloud ([สมัครใช้งาน](https://www.oracle.com/cloud/free/)) -- หากพบปัญหา โปรดดู[คู่มือการสมัครใช้งานจากชุมชน](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- บัญชี Tailscale (ใช้งานฟรีที่ [tailscale.com](https://tailscale.com))
- คู่กุญแจ SSH
- เวลาประมาณ 30 นาที

## การตั้งค่า

<Steps>
  <Step title="สร้างอินสแตนซ์ OCI">
    1. เข้าสู่ระบบ [Oracle Cloud Console](https://cloud.oracle.com/)
    2. ไปที่ **Compute > Instances > Create Instance**
    3. กำหนดค่า:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (หรือสูงสุด 4)
       - **Memory:** 12 GB (หรือสูงสุด 24 GB)
       - **Boot volume:** 50 GB (ฟรีสูงสุด 200 GB)
       - **SSH key:** เพิ่มกุญแจสาธารณะของคุณ
    4. คลิก **Create** และจดที่อยู่ IP สาธารณะไว้

    <Tip>
    หากสร้างอินสแตนซ์ไม่สำเร็จพร้อมข้อความ "Out of capacity" ให้ลองใช้โดเมนความพร้อมใช้งานอื่น หรือลองอีกครั้งในภายหลัง ความจุของระดับฟรีมีจำกัด
    </Tip>

  </Step>

  <Step title="เชื่อมต่อและอัปเดตระบบ">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    ต้องใช้ `build-essential` เพื่อคอมไพล์การขึ้นต่อกันบางรายการสำหรับ ARM

  </Step>

  <Step title="กำหนดค่าผู้ใช้และชื่อโฮสต์">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    การเปิดใช้งาน linger ช่วยให้บริการของผู้ใช้ทำงานต่อไปหลังจากออกจากระบบ

  </Step>

  <Step title="ติดตั้ง Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    จากนี้ไป ให้เชื่อมต่อผ่าน Tailscale: `ssh ubuntu@openclaw`

  </Step>

  <Step title="ติดตั้ง OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    เมื่อระบบถาม "How do you want to hatch your bot?" ให้เลือก **Do this later**

  </Step>

  <Step title="กำหนดค่า Gateway">
    ใช้การยืนยันตัวตนด้วยโทเค็นร่วมกับ Tailscale Serve เพื่อให้เข้าถึงจากระยะไกลได้อย่างปลอดภัย

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` ในที่นี้ใช้เฉพาะสำหรับการจัดการ IP ที่ส่งต่อ/ไคลเอนต์ภายในเครื่องของพร็อกซี Tailscale Serve ภายในเครื่องเท่านั้น ซึ่ง **ไม่ใช่** `gateway.auth.mode: "trusted-proxy"` เส้นทางตัวแสดงผลส่วนต่างจะยังคงปฏิเสธโดยค่าเริ่มต้นในการตั้งค่านี้: คำขอตัวแสดงผลจาก `127.0.0.1` โดยตรงที่ไม่มีส่วนหัวพร็อกซีส่งต่อจะส่งคืน `Diff not found` ใช้ `mode=file` / `mode=both` สำหรับไฟล์แนบ หรือเปิดใช้งานตัวแสดงผลระยะไกลโดยตั้งใจและตั้งค่า `plugins.entries.diffs.config.viewerBaseUrl` (หรือส่ง `baseUrl` ของพร็อกซี) หากคุณต้องการลิงก์ตัวแสดงผลที่แชร์ได้

  </Step>

  <Step title="จำกัดความปลอดภัยของ VCN">
    บล็อกการรับส่งข้อมูลทั้งหมดที่ขอบเขตเครือข่าย ยกเว้น Tailscale:

    1. ไปที่ **Networking > Virtual Cloud Networks** ใน OCI Console
    2. คลิก VCN ของคุณ จากนั้นไปที่ **Security Lists > Default Security List**
    3. **Remove** กฎขาเข้าทั้งหมด ยกเว้น `0.0.0.0/0 UDP 41641` (Tailscale)
    4. คงกฎขาออกเริ่มต้นไว้ (อนุญาตการรับส่งข้อมูลขาออกทั้งหมด)

    การดำเนินการนี้จะบล็อก SSH บนพอร์ต 22, HTTP, HTTPS และทุกอย่างอื่นที่ขอบเขตเครือข่าย จากจุดนี้เป็นต้นไป คุณจะเชื่อมต่อได้ผ่าน Tailscale เท่านั้น

  </Step>

  <Step title="ตรวจสอบ">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    เข้าถึง UI ควบคุมจากอุปกรณ์ใดก็ได้บน tailnet ของคุณ:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    แทนที่ `<tailnet-name>` ด้วยชื่อ tailnet ของคุณ (ดูได้ใน `tailscale status`)

  </Step>
</Steps>

## ตรวจสอบสถานะความปลอดภัย

เมื่อจำกัด VCN แล้ว (เปิดเฉพาะ UDP 41641) และผูก Gateway กับ local loopback การรับส่งข้อมูลสาธารณะจะถูกบล็อกที่ขอบเขตเครือข่าย และการเข้าถึงสำหรับผู้ดูแลระบบจะทำได้ผ่าน tailnet เท่านั้น จึงไม่จำเป็นต้องดำเนินการเพิ่มความปลอดภัย VPS แบบดั้งเดิมหลายรายการ:

| ขั้นตอนแบบดั้งเดิม                     | จำเป็นหรือไม่ | เหตุผล                                                                      |
| -------------------------------------- | ------------- | ---------------------------------------------------------------------------- |
| ไฟร์วอลล์ UFW                          | ไม่           | VCN บล็อกการรับส่งข้อมูลก่อนที่จะมาถึงอินสแตนซ์                            |
| fail2ban                               | ไม่           | พอร์ต 22 ถูกบล็อกที่ VCN จึงไม่มีพื้นผิวสำหรับการโจมตีแบบลองรหัสซ้ำ ๆ     |
| การเพิ่มความปลอดภัยให้ sshd            | ไม่           | Tailscale SSH ไม่ได้ใช้ sshd                                                 |
| ปิดใช้งานการเข้าสู่ระบบด้วย root       | ไม่           | Tailscale ยืนยันตัวตนด้วยข้อมูลประจำตัวของ tailnet ไม่ใช่ผู้ใช้ระบบ        |
| ยืนยันตัวตน SSH ด้วยกุญแจเท่านั้น      | ไม่           | เช่นเดียวกัน -- ข้อมูลประจำตัวของ tailnet ใช้แทนกุญแจ SSH ของระบบ          |
| การเพิ่มความปลอดภัยให้ IPv6            | โดยปกติไม่    | ขึ้นอยู่กับการตั้งค่า VCN/ซับเน็ต โปรดตรวจสอบสิ่งที่ถูกกำหนด/เปิดเผยจริง |

ยังคงแนะนำให้ทำดังต่อไปนี้:

- ใช้ `chmod 700 ~/.openclaw` เพื่อจำกัดสิทธิ์ของไฟล์ข้อมูลรับรอง
- ใช้ `openclaw security audit` เพื่อตรวจสอบสถานะความปลอดภัยเฉพาะของ OpenClaw
- เรียกใช้ `sudo apt update && sudo apt upgrade` เป็นประจำเพื่อติดตั้งแพตช์ระบบปฏิบัติการ
- ตรวจสอบอุปกรณ์ใน[คอนโซลผู้ดูแลระบบ Tailscale](https://login.tailscale.com/admin) เป็นระยะ

คำสั่งตรวจสอบอย่างรวดเร็ว:

```bash
# ยืนยันว่าไม่มีพอร์ตสาธารณะกำลังรอรับการเชื่อมต่อ
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# ตรวจสอบว่า Tailscale SSH ทำงานอยู่
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# ไม่บังคับ: ปิดใช้งาน sshd อย่างสมบูรณ์เมื่อยืนยันแล้วว่า Tailscale SSH ทำงานได้
sudo systemctl disable --now ssh
```

## หมายเหตุเกี่ยวกับ ARM

ระดับ Always Free ใช้ ARM (`aarch64`) ฟีเจอร์ส่วนใหญ่ของ OpenClaw ทำงานได้ตามปกติ แต่ไบนารีเนทีฟบางรายการจำเป็นต้องมีรุ่นที่สร้างสำหรับ ARM:

- Node.js, Telegram, WhatsApp (Baileys): เป็น JavaScript ล้วน จึงไม่มีปัญหา
- แพ็กเกจ npm ส่วนใหญ่ที่มีโค้ดเนทีฟ: มีอาร์ติแฟกต์ `linux-arm64` ที่สร้างไว้ล่วงหน้า
- เครื่องมือช่วย CLI ที่เลือกใช้ได้ (เช่น ไบนารี Go/Rust ที่มาพร้อมกับ Skills): ตรวจสอบว่ามีรุ่น `aarch64` / `linux-arm64` ก่อนติดตั้ง

ตรวจสอบสถาปัตยกรรมด้วย `uname -m` (ควรแสดง `aarch64`) สำหรับไบนารีที่ไม่มีรุ่น ARM ให้ติดตั้งจากซอร์สหรือข้ามไป

## การคงอยู่ของข้อมูลและการสำรองข้อมูล

สถานะของ OpenClaw อยู่ภายใต้:

- `~/.openclaw/` -- `openclaw.json`, `auth-profiles.json` ของแต่ละเอเจนต์, สถานะช่องทาง/ผู้ให้บริการ และข้อมูลเซสชัน
- `~/.openclaw/workspace/` -- พื้นที่ทำงานของเอเจนต์ (SOUL.md, หน่วยความจำ, อาร์ติแฟกต์)

ข้อมูลเหล่านี้จะยังคงอยู่หลังรีบูต หากต้องการสร้างสแนปช็อตแบบพกพา:

```bash
openclaw backup create
```

## วิธีสำรอง: อุโมงค์ SSH

หาก Tailscale Serve ไม่ทำงาน ให้ใช้อุโมงค์ SSH จากเครื่องภายในของคุณ:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

จากนั้นเปิด `http://localhost:18789`

## การแก้ไขปัญหา

**สร้างอินสแตนซ์ไม่สำเร็จ ("Out of capacity")** -- อินสแตนซ์ ARM ระดับฟรีเป็นที่นิยม ให้ลองใช้โดเมนความพร้อมใช้งานอื่น หรือลองอีกครั้งในช่วงเวลาที่มีการใช้งานน้อย

**Tailscale ไม่เชื่อมต่อ** -- เรียกใช้ `sudo tailscale up --ssh --hostname=openclaw --reset` เพื่อยืนยันตัวตนอีกครั้ง

**Gateway ไม่เริ่มทำงาน** -- เรียกใช้ `openclaw doctor --non-interactive` และตรวจสอบบันทึกด้วย `journalctl --user -u openclaw-gateway.service -n 50`

**ปัญหาไบนารี ARM** -- แพ็กเกจ npm ส่วนใหญ่ทำงานบน ARM64 สำหรับไบนารีเนทีฟ ให้ค้นหารุ่น `linux-arm64` หรือ `aarch64` ตรวจสอบสถาปัตยกรรมด้วย `uname -m`

## ขั้นตอนถัดไป

- [ช่องทาง](/th/channels) -- เชื่อมต่อ Telegram, WhatsApp, Discord และอื่น ๆ
- [การกำหนดค่า Gateway](/th/gateway/configuration) -- ตัวเลือกการกำหนดค่าทั้งหมด
- [การอัปเดต](/th/install/updating) -- ดูแล OpenClaw ให้เป็นเวอร์ชันล่าสุดอยู่เสมอ

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [GCP](/th/install/gcp)
- [การโฮสต์ VPS](/th/vps)
