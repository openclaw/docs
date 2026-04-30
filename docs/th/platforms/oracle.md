---
read_when:
    - การตั้งค่า OpenClaw บน Oracle Cloud
    - มองหาโฮสติ้ง VPS ราคาประหยัดสำหรับ OpenClaw
    - ต้องการใช้งาน OpenClaw ตลอด 24/7 บนเซิร์ฟเวอร์ขนาดเล็ก
summary: OpenClaw บน Oracle Cloud (Always Free ARM)
title: Oracle Cloud (แพลตฟอร์ม)
x-i18n:
    generated_at: "2026-04-30T10:04:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: d86af91bd924ad08535a21fa481ce551e8c19f1a6cd82b61c335da7a068a09f0
    source_path: platforms/oracle.md
    workflow: 16
---

# OpenClaw บน Oracle Cloud (OCI)

## เป้าหมาย

เรียกใช้ OpenClaw Gateway แบบถาวรบนระดับ ARM **Always Free** ของ Oracle Cloud

ระดับฟรีของ Oracle อาจเหมาะกับ OpenClaw มาก (โดยเฉพาะถ้าคุณมีบัญชี OCI อยู่แล้ว) แต่มีข้อแลกเปลี่ยนบางอย่าง:

- สถาปัตยกรรม ARM (ส่วนใหญ่ใช้งานได้ แต่ไบนารีบางตัวอาจมีเฉพาะ x86)
- ความจุและการสมัครใช้งานอาจไม่ราบรื่นนัก

## การเปรียบเทียบค่าใช้จ่าย (2026)

| ผู้ให้บริการ | แผน | สเปก | ราคา/เดือน | หมายเหตุ |
| ------------ | --------------- | ---------------------- | -------- | --------------------- |
| Oracle Cloud | Always Free ARM | สูงสุด 4 OCPU, RAM 24GB | $0 | ARM, ความจุจำกัด |
| Hetzner | CX22 | 2 vCPU, RAM 4GB | ~ $4 | ตัวเลือกแบบเสียเงินที่ถูกที่สุด |
| DigitalOcean | Basic | 1 vCPU, RAM 1GB | $6 | UI ใช้ง่าย, เอกสารดี |
| Vultr | Cloud Compute | 1 vCPU, RAM 1GB | $6 | มีหลายตำแหน่งที่ตั้ง |
| Linode | Nanode | 1 vCPU, RAM 1GB | $5 | ตอนนี้เป็นส่วนหนึ่งของ Akamai |

---

## ข้อกำหนดเบื้องต้น

- บัญชี Oracle Cloud ([สมัครใช้งาน](https://www.oracle.com/cloud/free/)) — ดู [คู่มือสมัครใช้งานจากชุมชน](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) หากคุณพบปัญหา
- บัญชี Tailscale (ฟรีที่ [tailscale.com](https://tailscale.com))
- ประมาณ 30 นาที

## 1) สร้างอินสแตนซ์ OCI

1. เข้าสู่ระบบ [Oracle Cloud Console](https://cloud.oracle.com/)
2. ไปที่ **Compute → Instances → Create Instance**
3. กำหนดค่า:
   - **ชื่อ:** `openclaw`
   - **อิมเมจ:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPUs:** 2 (หรือสูงสุด 4)
   - **หน่วยความจำ:** 12 GB (หรือสูงสุด 24 GB)
   - **Boot volume:** 50 GB (ฟรีสูงสุด 200 GB)
   - **คีย์ SSH:** เพิ่มคีย์สาธารณะของคุณ
4. คลิก **Create**
5. จดที่อยู่ IP สาธารณะไว้

**เคล็ดลับ:** หากการสร้างอินสแตนซ์ล้มเหลวด้วยข้อความ "Out of capacity" ให้ลอง availability domain อื่น หรือลองใหม่ภายหลัง ความจุของระดับฟรีมีจำกัด

## 2) เชื่อมต่อและอัปเดต

```bash
# Connect via public IP
ssh ubuntu@YOUR_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**หมายเหตุ:** จำเป็นต้องใช้ `build-essential` สำหรับการคอมไพล์ ARM ของ dependency บางรายการ

## 3) กำหนดค่าผู้ใช้และชื่อโฮสต์

```bash
# Set hostname
sudo hostnamectl set-hostname openclaw

# Set password for ubuntu user
sudo passwd ubuntu

# Enable lingering (keeps user services running after logout)
sudo loginctl enable-linger ubuntu
```

## 4) ติดตั้ง Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

วิธีนี้เปิดใช้ Tailscale SSH เพื่อให้คุณเชื่อมต่อผ่าน `ssh openclaw` ได้จากอุปกรณ์ใดก็ได้บน tailnet ของคุณ — ไม่ต้องใช้ IP สาธารณะ

ตรวจสอบ:

```bash
tailscale status
```

**จากนี้ไป ให้เชื่อมต่อผ่าน Tailscale:** `ssh ubuntu@openclaw` (หรือใช้ IP ของ Tailscale)

## 5) ติดตั้ง OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

เมื่อระบบถามว่า "How do you want to hatch your bot?" ให้เลือก **"Do this later"**

> หมายเหตุ: หากคุณพบปัญหาการ build แบบ ARM-native ให้เริ่มจากแพ็กเกจระบบ (เช่น `sudo apt install -y build-essential`) ก่อนจะใช้ Homebrew

## 6) กำหนดค่า Gateway (loopback + token auth) และเปิดใช้ Tailscale Serve

ใช้ token auth เป็นค่าเริ่มต้น วิธีนี้คาดเดาได้และไม่ต้องใช้แฟล็ก “insecure auth” ใด ๆ ของ Control UI

```bash
# Keep the Gateway private on the VM
openclaw config set gateway.bind loopback

# Require auth for the Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Expose over Tailscale Serve (HTTPS + tailnet access)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` ในที่นี้ใช้เฉพาะสำหรับการจัดการ forwarded-IP/local-client ของพร็อกซี Tailscale Serve ภายในเครื่องเท่านั้น และ **ไม่ใช่** `gateway.auth.mode: "trusted-proxy"` เส้นทาง diff viewer จะยังคงมีพฤติกรรมแบบ fail-closed ในการตั้งค่านี้: คำขอ viewer แบบดิบจาก `127.0.0.1` ที่ไม่มี forwarded proxy headers อาจส่งคืน `Diff not found` ใช้ `mode=file` / `mode=both` สำหรับไฟล์แนบ หรือเปิดใช้ remote viewers โดยตั้งใจและตั้งค่า `plugins.entries.diffs.config.viewerBaseUrl` (หรือส่งพร็อกซี `baseUrl`) หากคุณต้องการลิงก์ viewer ที่แชร์ได้

## 7) ตรวจสอบ

```bash
# Check version
openclaw --version

# Check daemon status
systemctl --user status openclaw-gateway.service

# Check Tailscale Serve
tailscale serve status

# Test local response
curl http://localhost:18789
```

## 8) ล็อกดาวน์ความปลอดภัยของ VCN

เมื่อทุกอย่างทำงานแล้ว ให้ล็อกดาวน์ VCN เพื่อบล็อกทราฟฟิกทั้งหมด ยกเว้น Tailscale Virtual Cloud Network ของ OCI ทำหน้าที่เป็นไฟร์วอลล์ที่ขอบเครือข่าย — ทราฟฟิกจะถูกบล็อกก่อนถึงอินสแตนซ์ของคุณ

1. ไปที่ **Networking → Virtual Cloud Networks** ใน OCI Console
2. คลิก VCN ของคุณ → **Security Lists** → Default Security List
3. **ลบ** กฎ ingress ทั้งหมด ยกเว้น:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. คงกฎ egress เริ่มต้นไว้ (อนุญาต outbound ทั้งหมด)

วิธีนี้จะบล็อก SSH บนพอร์ต 22, HTTP, HTTPS และทุกอย่างอื่นที่ขอบเครือข่าย จากนี้ไป คุณจะเชื่อมต่อได้ผ่าน Tailscale เท่านั้น

---

## เข้าถึง Control UI

จากอุปกรณ์ใดก็ได้บนเครือข่าย Tailscale ของคุณ:

```
https://openclaw.<tailnet-name>.ts.net/
```

แทนที่ `<tailnet-name>` ด้วยชื่อ tailnet ของคุณ (ดูได้ใน `tailscale status`)

ไม่ต้องใช้ SSH tunnel Tailscale ให้สิ่งต่อไปนี้:

- การเข้ารหัส HTTPS (ใบรับรองอัตโนมัติ)
- การยืนยันตัวตนผ่านข้อมูลประจำตัว Tailscale
- การเข้าถึงจากอุปกรณ์ใดก็ได้บน tailnet ของคุณ (แล็ปท็อป, โทรศัพท์ ฯลฯ)

---

## ความปลอดภัย: VCN + Tailscale (ค่าพื้นฐานที่แนะนำ)

เมื่อ VCN ถูกล็อกดาวน์ (เปิดเฉพาะ UDP 41641) และ Gateway ผูกกับ loopback คุณจะได้การป้องกันหลายชั้นที่แข็งแรง: ทราฟฟิกสาธารณะถูกบล็อกที่ขอบเครือข่าย และการเข้าถึงสำหรับผู้ดูแลระบบเกิดขึ้นผ่าน tailnet ของคุณ

การตั้งค่านี้มักลด _ความจำเป็น_ ในการมีกฎไฟร์วอลล์ระดับโฮสต์เพิ่มเติมเพื่อหยุดการ brute force SSH จากทั่วอินเทอร์เน็ตโดยเฉพาะ — แต่คุณยังควรอัปเดต OS ให้สม่ำเสมอ, เรียกใช้ `openclaw security audit`, และตรวจสอบว่าคุณไม่ได้เผลอฟังอยู่บนอินเทอร์เฟซสาธารณะ

### ได้รับการป้องกันแล้ว

| ขั้นตอนแบบดั้งเดิม | จำเป็นหรือไม่ | เหตุผล |
| ------------------ | ----------- | ---------------------------------------------------------------------------- |
| ไฟร์วอลล์ UFW | ไม่ | VCN บล็อกก่อนที่ทราฟฟิกจะถึงอินสแตนซ์ |
| fail2ban | ไม่ | ไม่มี brute force หากพอร์ต 22 ถูกบล็อกที่ VCN |
| การทำให้ sshd แข็งแรงขึ้น | ไม่ | Tailscale SSH ไม่ใช้ sshd |
| ปิดการเข้าสู่ระบบ root | ไม่ | Tailscale ใช้ข้อมูลประจำตัว Tailscale ไม่ใช่ผู้ใช้ระบบ |
| SSH key-only auth | ไม่ | Tailscale ยืนยันตัวตนผ่าน tailnet ของคุณ |
| การทำให้ IPv6 แข็งแรงขึ้น | โดยปกติไม่ | ขึ้นอยู่กับการตั้งค่า VCN/subnet ของคุณ; ตรวจสอบสิ่งที่ถูกกำหนด/เปิดเผยจริง |

### ยังแนะนำให้ทำ

- **สิทธิ์ของข้อมูลประจำตัว:** `chmod 700 ~/.openclaw`
- **Security audit:** `openclaw security audit`
- **การอัปเดตระบบ:** `sudo apt update && sudo apt upgrade` เป็นประจำ
- **ตรวจสอบ Tailscale:** ตรวจทานอุปกรณ์ใน [Tailscale admin console](https://login.tailscale.com/admin)

### ตรวจสอบสถานะความปลอดภัย

```bash
# Confirm no public ports listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely
sudo systemctl disable --now ssh
```

---

## ทางเลือกสำรอง: SSH Tunnel

หาก Tailscale Serve ไม่ทำงาน ให้ใช้ SSH tunnel:

```bash
# From your local machine (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

จากนั้นเปิด `http://localhost:18789`

---

## การแก้ปัญหา

### การสร้างอินสแตนซ์ล้มเหลว ("Out of capacity")

อินสแตนซ์ ARM ระดับฟรีได้รับความนิยม ลองทำดังนี้:

- ใช้ availability domain อื่น
- ลองใหม่ในช่วงเวลาที่ใช้งานน้อย (เช้าตรู่)
- ใช้ตัวกรอง "Always Free" เมื่อเลือก shape

### Tailscale ไม่เชื่อมต่อ

```bash
# Check status
sudo tailscale status

# Re-authenticate
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway ไม่เริ่มทำงาน

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### เข้าถึง Control UI ไม่ได้

```bash
# Verify Tailscale Serve is running
tailscale serve status

# Check gateway is listening
curl http://localhost:18789

# Restart if needed
systemctl --user restart openclaw-gateway.service
```

### ปัญหาไบนารี ARM

เครื่องมือบางตัวอาจไม่มี build สำหรับ ARM ตรวจสอบ:

```bash
uname -m  # Should show aarch64
```

แพ็กเกจ npm ส่วนใหญ่ใช้งานได้ดี สำหรับไบนารี ให้มองหา release แบบ `linux-arm64` หรือ `aarch64`

---

## ความคงอยู่ของข้อมูล

สถานะทั้งหมดอยู่ใน:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` ต่อ agent, สถานะ channel/provider, และข้อมูล session
- `~/.openclaw/workspace/` — workspace (SOUL.md, memory, artifacts)

สำรองข้อมูลเป็นระยะ:

```bash
openclaw backup create
```

---

## ที่เกี่ยวข้อง

- [การเข้าถึง Gateway จากระยะไกล](/th/gateway/remote) — รูปแบบการเข้าถึงจากระยะไกลอื่น ๆ
- [การผสานรวม Tailscale](/th/gateway/tailscale) — เอกสาร Tailscale ฉบับเต็ม
- [การกำหนดค่า Gateway](/th/gateway/configuration) — ตัวเลือกการกำหนดค่าทั้งหมด
- [คู่มือ DigitalOcean](/th/install/digitalocean) — หากคุณต้องการแบบเสียเงิน + สมัครง่ายกว่า
- [คู่มือ Hetzner](/th/install/hetzner) — ทางเลือกที่ใช้ Docker
