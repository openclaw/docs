---
read_when:
    - คุณต้องการเรียกใช้ Gateway บนเซิร์ฟเวอร์ Linux หรือ VPS บนคลาวด์
    - คุณต้องการแผนที่แบบรวดเร็วของคู่มือการโฮสต์
    - คุณต้องการการปรับแต่งเซิร์ฟเวอร์ Linux ทั่วไปสำหรับ OpenClaw
sidebarTitle: Linux Server
summary: เรียกใช้ OpenClaw บนเซิร์ฟเวอร์ Linux หรือ cloud VPS — ตัวเลือกผู้ให้บริการ สถาปัตยกรรม และการปรับแต่ง
title: เซิร์ฟเวอร์ Linux
x-i18n:
    generated_at: "2026-06-27T18:34:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d32ca9cd62e99b340827f086602922eae3731d9b6cb42b1fd629917d604c549b
    source_path: vps.md
    workflow: 16
---

เรียกใช้ OpenClaw Gateway บนเซิร์ฟเวอร์ Linux หรือ VPS บนคลาวด์ใดก็ได้ หน้านี้ช่วยคุณ
เลือกผู้ให้บริการ อธิบายวิธีการทำงานของการปรับใช้บนคลาวด์ และครอบคลุมการปรับแต่ง Linux
ทั่วไปที่ใช้ได้ทุกที่

## เลือกผู้ให้บริการ

<CardGroup cols={2}>
  <Card title="Railway" href="/th/install/railway">ตั้งค่าผ่านเบราว์เซอร์ในคลิกเดียว</Card>
  <Card title="Northflank" href="/th/install/northflank">ตั้งค่าผ่านเบราว์เซอร์ในคลิกเดียว</Card>
  <Card title="DigitalOcean" href="/th/install/digitalocean">VPS แบบเสียเงินที่เรียบง่าย</Card>
  <Card title="Oracle Cloud" href="/th/install/oracle">ระดับ ARM Always Free</Card>
  <Card title="Fly.io" href="/th/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/th/install/hetzner">Docker บน Hetzner VPS</Card>
  <Card title="Hostinger" href="/th/install/hostinger">VPS พร้อมการตั้งค่าในคลิกเดียว</Card>
  <Card title="GCP" href="/th/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/th/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/th/install/exe-dev">VM พร้อมพร็อกซี HTTPS</Card>
  <Card title="Raspberry Pi" href="/th/install/raspberry-pi">โฮสต์เองบน ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** ก็ใช้งานได้ดีเช่นกัน
มีวิดีโอแนะนำแบบชุมชนให้ดูที่
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(ทรัพยากรจากชุมชน -- อาจไม่พร้อมใช้งานในอนาคต)

## การตั้งค่าบนคลาวด์ทำงานอย่างไร

- **Gateway ทำงานบน VPS** และเป็นเจ้าของสถานะ + workspace
- คุณเชื่อมต่อจากแล็ปท็อปหรือโทรศัพท์ผ่าน **Control UI** หรือ **Tailscale/SSH**
- ถือว่า VPS เป็นแหล่งข้อมูลหลัก และ**สำรองข้อมูล**สถานะ + workspace เป็นประจำ
- ค่าเริ่มต้นที่ปลอดภัย: ให้ Gateway อยู่บน loopback และเข้าถึงผ่าน SSH tunnel หรือ Tailscale Serve
  หากคุณ bind ไปที่ `lan` หรือ `tailnet` ให้บังคับใช้ `gateway.auth.token` หรือ `gateway.auth.password`

หน้าที่เกี่ยวข้อง: [การเข้าถึง Gateway จากระยะไกล](/th/gateway/remote), [ศูนย์รวมแพลตฟอร์ม](/th/platforms)

## ทำให้การเข้าถึงของผู้ดูแลปลอดภัยก่อน

ก่อนติดตั้ง OpenClaw บน VPS สาธารณะ ให้ตัดสินใจก่อนว่าคุณต้องการดูแล
เครื่องนั้นอย่างไร

- หากคุณต้องการให้ผู้ดูแลเข้าถึงได้เฉพาะผ่าน tailnet ให้ติดตั้ง Tailscale ก่อน เพิ่ม VPS
  เข้าสู่ tailnet ของคุณ ยืนยันเซสชัน SSH ที่สองผ่าน IP ของ Tailscale หรือ
  ชื่อ MagicDNS แล้วจึงจำกัด SSH สาธารณะ
- หากคุณไม่ได้ใช้ Tailscale ให้ใช้การ hardening ที่เทียบเท่ากันกับเส้นทาง SSH
  ของคุณก่อนเปิดเผยบริการเพิ่มเติม
- สิ่งนี้แยกจากการเข้าถึง Gateway คุณยังสามารถให้ OpenClaw bind กับ
  loopback และใช้ SSH tunnel หรือ Tailscale Serve สำหรับแดชบอร์ดได้

ตัวเลือก Gateway เฉพาะของ Tailscale อยู่ใน [Tailscale](/th/gateway/tailscale)

## เอเจนต์บริษัทแบบใช้ร่วมกันบน VPS

การเรียกใช้เอเจนต์เดียวสำหรับทีมเป็นการตั้งค่าที่ใช้ได้ เมื่อผู้ใช้ทุกคนอยู่ในขอบเขตความไว้วางใจเดียวกัน และเอเจนต์ใช้เพื่อธุรกิจเท่านั้น

- ให้ทำงานบน runtime เฉพาะ (VPS/VM/container + ผู้ใช้/บัญชี OS เฉพาะ)
- อย่า sign in runtime นั้นเข้าบัญชี Apple/Google ส่วนตัว หรือโปรไฟล์เบราว์เซอร์/ตัวจัดการรหัสผ่านส่วนตัว
- หากผู้ใช้มีความเป็นปฏิปักษ์ต่อกัน ให้แยกตาม gateway/host/ผู้ใช้ OS

รายละเอียดโมเดลความปลอดภัย: [ความปลอดภัย](/th/gateway/security)

## การใช้โหนดกับ VPS

คุณสามารถให้ Gateway อยู่บนคลาวด์ และจับคู่ **โหนด** บนอุปกรณ์ภายในเครื่องของคุณ
(Mac/iOS/Android/headless) โหนดให้ความสามารถด้านหน้าจอ/กล้อง/canvas ในเครื่อง และ `system.run`
ขณะที่ Gateway ยังอยู่บนคลาวด์

เอกสาร: [โหนด](/th/nodes), [CLI สำหรับโหนด](/th/cli/nodes)

## การปรับแต่งการเริ่มต้นสำหรับ VM ขนาดเล็กและโฮสต์ ARM

หากคำสั่ง CLI รู้สึกช้าบน VM กำลังต่ำ (หรือโฮสต์ ARM) ให้เปิดใช้แคชคอมไพล์โมดูลของ Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` ช่วยให้เวลาเริ่มต้นของคำสั่งที่เรียกซ้ำดีขึ้น
- `OPENCLAW_NO_RESPAWN=1` ทำให้การรีสตาร์ท Gateway ตามปกติอยู่ใน process เดิม ซึ่งหลีกเลี่ยงการส่งต่อ process เพิ่มเติม และทำให้การติดตาม PID เรียบง่ายบนโฮสต์ขนาดเล็ก
- การเรียกคำสั่งครั้งแรกจะอุ่นแคช การเรียกครั้งถัดไปจะเร็วขึ้น
- สำหรับรายละเอียดเฉพาะของ Raspberry Pi โปรดดู [Raspberry Pi](/th/install/raspberry-pi)

### เช็กลิสต์การปรับแต่ง systemd (ไม่บังคับ)

สำหรับโฮสต์ VM ที่ใช้ `systemd` ให้พิจารณา:

- เพิ่ม env ของ service เพื่อให้เส้นทางการเริ่มต้นเสถียร:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- ทำให้พฤติกรรมการรีสตาร์ทชัดเจน:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- เลือกดิสก์ที่รองรับด้วย SSD สำหรับเส้นทาง state/cache เพื่อลดโทษของการ cold start จาก random I/O

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
[systemd สามารถทำการกู้คืน service โดยอัตโนมัติได้](https://www.redhat.com/en/blog/systemd-automate-recovery)

สำหรับพฤติกรรม OOM ของ Linux การเลือก child process ที่เป็นเหยื่อ และการวินิจฉัย `exit 137`
โปรดดู [แรงกดดันหน่วยความจำของ Linux และการ kill โดย OOM](/th/platforms/linux#memory-pressure-and-oom-kills)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [DigitalOcean](/th/install/digitalocean)
- [Fly.io](/th/install/fly)
- [Hetzner](/th/install/hetzner)
