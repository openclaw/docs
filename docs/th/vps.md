---
read_when:
    - คุณต้องการเรียกใช้ Gateway บนเซิร์ฟเวอร์ Linux หรือ VPS บนคลาวด์
    - คุณต้องการแผนผังคร่าว ๆ ของคู่มือการโฮสต์
    - คุณต้องการการปรับแต่งเซิร์ฟเวอร์ Linux ทั่วไปสำหรับ OpenClaw
sidebarTitle: Linux Server
summary: เรียกใช้ OpenClaw บนเซิร์ฟเวอร์ Linux หรือ VPS บนคลาวด์ — ตัวช่วยเลือกผู้ให้บริการ สถาปัตยกรรม และการปรับแต่ง
title: เซิร์ฟเวอร์ Linux
x-i18n:
    generated_at: "2026-04-30T10:23:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e8535af0b6d14123acd46436c2e942008cdb8485ae680fb42e9b175723b2232
    source_path: vps.md
    workflow: 16
---

เรียกใช้ OpenClaw Gateway บนเซิร์ฟเวอร์ Linux หรือ VPS บนคลาวด์ใดก็ได้ หน้านี้ช่วยคุณ
เลือกผู้ให้บริการ อธิบายว่าการดีพลอยบนคลาวด์ทำงานอย่างไร และครอบคลุมการปรับแต่ง Linux
ทั่วไปที่ใช้ได้ทุกที่

## เลือกผู้ให้บริการ

<CardGroup cols={2}>
  <Card title="Railway" href="/th/install/railway">ตั้งค่าผ่านเบราว์เซอร์ด้วยคลิกเดียว</Card>
  <Card title="Northflank" href="/th/install/northflank">ตั้งค่าผ่านเบราว์เซอร์ด้วยคลิกเดียว</Card>
  <Card title="DigitalOcean" href="/th/install/digitalocean">VPS แบบชำระเงินที่เรียบง่าย</Card>
  <Card title="Oracle Cloud" href="/th/install/oracle">เทียร์ ARM Always Free</Card>
  <Card title="Fly.io" href="/th/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/th/install/hetzner">Docker บน Hetzner VPS</Card>
  <Card title="Hostinger" href="/th/install/hostinger">VPS พร้อมการตั้งค่าด้วยคลิกเดียว</Card>
  <Card title="GCP" href="/th/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/th/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/th/install/exe-dev">VM พร้อม HTTPS proxy</Card>
  <Card title="Raspberry Pi" href="/th/install/raspberry-pi">โฮสต์เองบน ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** ก็ทำงานได้ดีเช่นกัน
มีวิดีโอแนะนำแบบทีละขั้นตอนจากชุมชนที่
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(ทรัพยากรจากชุมชน -- อาจไม่พร้อมใช้งานในภายหลัง)

## การตั้งค่าบนคลาวด์ทำงานอย่างไร

- **Gateway ทำงานบน VPS** และเป็นเจ้าของสถานะ + พื้นที่ทำงาน
- คุณเชื่อมต่อจากแล็ปท็อปหรือโทรศัพท์ผ่าน **Control UI** หรือ **Tailscale/SSH**
- ถือว่า VPS เป็นแหล่งข้อมูลจริง และ **สำรองข้อมูล** สถานะ + พื้นที่ทำงานเป็นประจำ
- ค่าเริ่มต้นที่ปลอดภัย: ให้ Gateway อยู่บน loopback และเข้าถึงผ่าน SSH tunnel หรือ Tailscale Serve
  หากคุณ bind ไปที่ `lan` หรือ `tailnet` ให้กำหนด `gateway.auth.token` หรือ `gateway.auth.password`

หน้าที่เกี่ยวข้อง: [การเข้าถึง Gateway จากระยะไกล](/th/gateway/remote), [ศูนย์รวมแพลตฟอร์ม](/th/platforms)

## ทำให้การเข้าถึงสำหรับผู้ดูแลระบบปลอดภัยก่อน

ก่อนติดตั้ง OpenClaw บน VPS สาธารณะ ให้ตัดสินใจก่อนว่าคุณต้องการดูแลจัดการ
เครื่องนั้นอย่างไร

- หากคุณต้องการการเข้าถึงสำหรับผู้ดูแลระบบเฉพาะผ่าน Tailnet ให้ติดตั้ง Tailscale ก่อน เข้าร่วม VPS
  กับ tailnet ของคุณ ตรวจสอบ SSH session ที่สองผ่าน IP ของ Tailscale หรือ
  ชื่อ MagicDNS แล้วจำกัด SSH สาธารณะ
- หากคุณไม่ได้ใช้ Tailscale ให้ทำ hardening ที่เทียบเท่ากันสำหรับเส้นทาง SSH
  ของคุณก่อนเปิดเผยบริการเพิ่มเติม
- สิ่งนี้แยกจากการเข้าถึง Gateway คุณยังคงให้ OpenClaw bind อยู่กับ
  loopback และใช้ SSH tunnel หรือ Tailscale Serve สำหรับแดชบอร์ดได้

ตัวเลือก Gateway เฉพาะของ Tailscale อยู่ใน [Tailscale](/th/gateway/tailscale)

## เอเจนต์ของบริษัทร่วมกันบน VPS

การเรียกใช้เอเจนต์เดียวสำหรับทีมเป็นการตั้งค่าที่ใช้ได้ เมื่อผู้ใช้ทุกคนอยู่ในขอบเขตความไว้วางใจเดียวกันและเอเจนต์ใช้สำหรับงานธุรกิจเท่านั้น

- ให้ทำงานบน runtime เฉพาะ (VPS/VM/container + ผู้ใช้/บัญชี OS เฉพาะ)
- อย่า sign in runtime นั้นด้วยบัญชี Apple/Google ส่วนตัว หรือโปรไฟล์เบราว์เซอร์/ตัวจัดการรหัสผ่านส่วนตัว
- หากผู้ใช้มีความเป็นปฏิปักษ์ต่อกัน ให้แยกตาม gateway/host/OS user

รายละเอียดโมเดลความปลอดภัย: [ความปลอดภัย](/th/gateway/security)

## การใช้ nodes กับ VPS

คุณสามารถเก็บ Gateway ไว้บนคลาวด์และจับคู่ **nodes** บนอุปกรณ์ภายในเครื่องของคุณ
(Mac/iOS/Android/headless) Nodes ให้ความสามารถหน้าจอ/กล้อง/canvas ในเครื่องและ `system.run`
ขณะที่ Gateway ยังอยู่บนคลาวด์

เอกสาร: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes)

## การปรับแต่งการเริ่มต้นสำหรับ VM ขนาดเล็กและโฮสต์ ARM

หากคำสั่ง CLI รู้สึกช้าบน VM พลังต่ำ (หรือโฮสต์ ARM) ให้เปิดใช้ module compile cache ของ Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` ช่วยให้เวลาเริ่มต้นของคำสั่งที่รันซ้ำเร็วขึ้น
- `OPENCLAW_NO_RESPAWN=1` หลีกเลี่ยง overhead การเริ่มต้นเพิ่มเติมจากเส้นทาง self-respawn
- การรันคำสั่งครั้งแรกจะอุ่น cache; การรันครั้งถัดไปจะเร็วขึ้น
- สำหรับรายละเอียดเฉพาะของ Raspberry Pi ดู [Raspberry Pi](/th/install/raspberry-pi)

### รายการตรวจสอบการปรับแต่ง systemd (ไม่บังคับ)

สำหรับโฮสต์ VM ที่ใช้ `systemd` ให้พิจารณา:

- เพิ่ม service env สำหรับเส้นทางการเริ่มต้นที่เสถียร:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- กำหนดพฤติกรรมการ restart ให้ชัดเจน:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- ควรใช้ดิสก์ที่รองรับด้วย SSD สำหรับเส้นทาง state/cache เพื่อลดผลกระทบ cold-start จาก random I/O

สำหรับเส้นทางมาตรฐาน `openclaw onboard --install-daemon` ให้แก้ไข user unit:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

หากคุณตั้งใจติดตั้ง system unit แทน ให้แก้ไข
`openclaw-gateway.service` ผ่าน `sudo systemctl edit openclaw-gateway.service`

นโยบาย `Restart=` ช่วยการกู้คืนอัตโนมัติอย่างไร:
[systemd สามารถทำให้การกู้คืนบริการเป็นอัตโนมัติได้](https://www.redhat.com/en/blog/systemd-automate-recovery)

สำหรับพฤติกรรม Linux OOM การเลือก child process ที่เป็น victim และการวินิจฉัย `exit 137`
ดู [แรงกดดันหน่วยความจำของ Linux และ OOM kills](/th/platforms/linux#memory-pressure-and-oom-kills)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [DigitalOcean](/th/install/digitalocean)
- [Fly.io](/th/install/fly)
- [Hetzner](/th/install/hetzner)
