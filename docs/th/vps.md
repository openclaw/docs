---
read_when:
    - คุณต้องการเรียกใช้ Gateway บนเซิร์ฟเวอร์ Linux หรือ VPS บนคลาวด์
    - คุณต้องการแผนผังคู่มือการโฮสต์แบบรวบรัด
    - คุณต้องการปรับแต่งเซิร์ฟเวอร์ Linux ทั่วไปสำหรับ OpenClaw
sidebarTitle: Linux Server
summary: ใช้งาน OpenClaw บนเซิร์ฟเวอร์ Linux หรือ VPS บนคลาวด์ — การเลือกผู้ให้บริการ สถาปัตยกรรม และการปรับแต่ง
title: เซิร์ฟเวอร์ Linux
x-i18n:
    generated_at: "2026-07-12T16:54:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

เรียกใช้ OpenClaw Gateway บนเซิร์ฟเวอร์ Linux หรือ VPS บนคลาวด์ใดก็ได้ หน้านี้ช่วยคุณ
เลือกผู้ให้บริการ อธิบายวิธีการทำงานของการติดตั้งใช้งานบนคลาวด์ และครอบคลุมการ
ปรับแต่ง Linux ทั่วไปที่ใช้ได้กับทุกสภาพแวดล้อม

## เลือกผู้ให้บริการ

<CardGroup cols={2}>
  <Card title="Azure" href="/th/install/azure">VM Linux</Card>
  <Card title="DigitalOcean" href="/th/install/digitalocean">VPS แบบชำระเงินที่ใช้งานง่าย</Card>
  <Card title="exe.dev" href="/th/install/exe-dev">VM พร้อมพร็อกซี HTTPS</Card>
  <Card title="Fly.io" href="/th/install/fly">Fly Machines</Card>
  <Card title="GCP" href="/th/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/th/install/hetzner">Docker บน Hetzner VPS</Card>
  <Card title="Hostinger" href="/th/install/hostinger">VPS พร้อมการตั้งค่าในคลิกเดียว</Card>
  <Card title="Northflank" href="/th/install/northflank">ตั้งค่าผ่านเบราว์เซอร์ในคลิกเดียว</Card>
  <Card title="Oracle Cloud" href="/th/install/oracle">ระดับ ARM ที่ใช้งานฟรีเสมอ</Card>
  <Card title="Railway" href="/th/install/railway">ตั้งค่าผ่านเบราว์เซอร์ในคลิกเดียว</Card>
  <Card title="Raspberry Pi" href="/th/install/raspberry-pi">โฮสต์เองบน ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / ระดับฟรี)** ก็ใช้งานได้ดีเช่นกัน
มีวิดีโอแนะนำทีละขั้นตอนจากชุมชนที่
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(ทรัพยากรจากชุมชน ซึ่งอาจไม่พร้อมใช้งานในภายหลัง)

## การตั้งค่าบนคลาวด์ทำงานอย่างไร

- **Gateway ทำงานบน VPS** และเป็นเจ้าของสถานะกับพื้นที่ทำงาน
- คุณเชื่อมต่อจากแล็ปท็อปหรือโทรศัพท์ผ่าน **ส่วนติดต่อควบคุม** หรือ **Tailscale/SSH**
- ถือว่า VPS เป็นแหล่งข้อมูลหลักที่ถูกต้อง และ**สำรองข้อมูล**สถานะกับพื้นที่ทำงานเป็นประจำ
- ค่าเริ่มต้นที่ปลอดภัย: ให้ Gateway อยู่บน local loopback และเข้าถึงผ่านอุโมงค์ SSH หรือ Tailscale Serve
  หากคุณผูกกับ `lan` หรือ `tailnet` Gateway จะกำหนดให้ใช้ข้อมูลลับที่ใช้ร่วมกัน
  (`gateway.auth.token` หรือ `gateway.auth.password`) เว้นแต่จะมอบหมายการยืนยันตัวตนให้
  พร็อกซีที่เชื่อถือได้

หน้าที่เกี่ยวข้อง: [การเข้าถึง Gateway จากระยะไกล](/th/gateway/remote), [ศูนย์รวมแพลตฟอร์ม](/th/platforms)

## เสริมความปลอดภัยให้การเข้าถึงของผู้ดูแลระบบก่อน

ก่อนติดตั้ง OpenClaw บน VPS สาธารณะ ให้ตัดสินใจก่อนว่าคุณต้องการดูแลระบบ
เครื่องนั้นด้วยวิธีใด

- สำหรับการเข้าถึงของผู้ดูแลระบบผ่าน Tailnet เท่านั้น: ติดตั้ง Tailscale ก่อน เชื่อม VPS เข้ากับ
  tailnet ของคุณ ตรวจสอบเซสชัน SSH ที่สองผ่านที่อยู่ IP ของ Tailscale หรือชื่อ MagicDNS
  จากนั้นจำกัด SSH สาธารณะ
- หากไม่ใช้ Tailscale: ใช้มาตรการเสริมความปลอดภัยที่เทียบเท่ากันกับเส้นทาง SSH ของคุณก่อน
  เปิดให้เข้าถึงบริการเพิ่มเติม
- ส่วนนี้แยกจากการเข้าถึง Gateway คุณยังคงผูก OpenClaw กับ
  local loopback และใช้อุโมงค์ SSH หรือ Tailscale Serve สำหรับแดชบอร์ดได้

ตัวเลือก Gateway ที่เฉพาะเจาะจงกับ Tailscale อยู่ใน [Tailscale](/th/gateway/tailscale)

## เอเจนต์ของบริษัทที่ใช้ร่วมกันบน VPS

การเรียกใช้เอเจนต์เดียวสำหรับทีมเป็นการตั้งค่าที่เหมาะสมเมื่อผู้ใช้ทุกคนอยู่ภายใน
ขอบเขตความไว้วางใจเดียวกัน และเอเจนต์ใช้สำหรับงานธุรกิจเท่านั้น

- ให้ทำงานบนสภาพแวดล้อมรันไทม์เฉพาะ (VPS/VM/คอนเทนเนอร์ + ผู้ใช้/บัญชีระบบปฏิบัติการเฉพาะ)
- อย่าลงชื่อเข้าใช้บัญชี Apple/Google ส่วนบุคคล หรือโปรไฟล์เบราว์เซอร์/ตัวจัดการรหัสผ่านส่วนบุคคลบนสภาพแวดล้อมรันไทม์นั้น
- หากผู้ใช้ไม่ไว้วางใจกัน ให้แยกตาม Gateway/โฮสต์/ผู้ใช้ระบบปฏิบัติการ

รายละเอียดโมเดลความปลอดภัย: [ความปลอดภัย](/th/gateway/security)

## การใช้ Node กับ VPS

คุณสามารถเก็บ Gateway ไว้บนคลาวด์และจับคู่ **Node** บนอุปกรณ์ภายในเครื่องของคุณ
(Mac/iOS/Android/แบบไม่มีส่วนติดต่อผู้ใช้) Node มอบความสามารถด้านหน้าจอ/กล้อง/แคนวาสภายในเครื่องและ `system.run`
ขณะที่ Gateway ยังคงอยู่บนคลาวด์

เอกสาร: [Node](/th/nodes), [CLI สำหรับ Node](/th/cli/nodes)

## การปรับแต่งการเริ่มต้นระบบสำหรับ VM ขนาดเล็กและโฮสต์ ARM

หากคำสั่ง CLI ทำงานช้าบน VM ที่มีกำลังประมวลผลต่ำ (หรือโฮสต์ ARM) ให้เปิดใช้แคชการคอมไพล์โมดูลของ Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` ช่วยลดเวลาเริ่มต้นของคำสั่งที่เรียกใช้ซ้ำ โดยการเรียกใช้ครั้งแรกจะเตรียมแคช
- `OPENCLAW_NO_RESPAWN=1` ทำให้การรีสตาร์ต Gateway ตามปกติยังคงอยู่ภายในโปรเซสเดิม ซึ่งช่วยหลีกเลี่ยงการส่งต่องานระหว่างโปรเซสเพิ่มเติม และทำให้การติดตาม PID บนโฮสต์ขนาดเล็กเป็นเรื่องง่าย
- สำหรับรายละเอียดเฉพาะของ Raspberry Pi โปรดดู [Raspberry Pi](/th/install/raspberry-pi)

### รายการตรวจสอบการปรับแต่ง systemd (ไม่บังคับ)

สำหรับโฮสต์ VM ที่ใช้ `systemd` ให้พิจารณา:

- ตัวแปรสภาพแวดล้อมของบริการเพื่อให้เส้นทางการเริ่มต้นระบบมีความเสถียร: `OPENCLAW_NO_RESPAWN=1` และ
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- กำหนดพฤติกรรมการรีสตาร์ตอย่างชัดเจน: `Restart=always`, `RestartSec=2`, `TimeoutStartSec=90`
- ใช้ดิสก์แบบ SSD สำหรับเส้นทางสถานะ/แคช เพื่อลดผลกระทบของการเริ่มต้นแบบเย็นจาก I/O แบบสุ่ม

เส้นทางมาตรฐาน `openclaw onboard --install-daemon` จะติดตั้งยูนิตผู้ใช้ของ systemd
แก้ไขด้วย:

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

หากคุณตั้งใจติดตั้งยูนิตระบบแทน ให้แก้ไขผ่าน
`sudo systemctl edit openclaw-gateway.service`

นโยบาย `Restart=` ช่วยในการกู้คืนอัตโนมัติได้อย่างไร:
[systemd สามารถทำให้การกู้คืนบริการเป็นอัตโนมัติ](https://www.redhat.com/en/blog/systemd-automate-recovery)

สำหรับพฤติกรรม OOM ของ Linux การเลือกโปรเซสลูกที่จะถูกยุติ และการวินิจฉัย `exit 137`
โปรดดู [ภาวะหน่วยความจำตึงตัวและการยุติโปรเซสเนื่องจาก OOM บน Linux](/th/platforms/linux#memory-pressure-and-oom-kills)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [DigitalOcean](/th/install/digitalocean)
- [Fly.io](/th/install/fly)
- [Hetzner](/th/install/hetzner)
