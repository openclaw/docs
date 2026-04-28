---
read_when:
    - คุณต้องการการปรับใช้เซิร์ฟเวอร์แบบอัตโนมัติพร้อมการเสริมความแข็งแรงด้านความปลอดภัย
    - คุณต้องการการตั้งค่าที่แยกด้วยไฟร์วอลล์พร้อมการเข้าถึงผ่าน VPN
    - คุณกำลังปรับใช้ไปยังเซิร์ฟเวอร์ Debian/Ubuntu ระยะไกล
summary: การติดตั้ง OpenClaw แบบอัตโนมัติและเสริมความแข็งแรงด้วย Ansible, Tailscale VPN และการแยกด้วยไฟร์วอลล์
title: Ansible
x-i18n:
    generated_at: "2026-04-23T05:38:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2a23374c971a1f3163dd18c32e553ebaad55b2542c1f25f49bcc9ae464d679e8
    source_path: install/ansible.md
    workflow: 15
---

# การติดตั้งด้วย Ansible

ปรับใช้ OpenClaw ไปยังเซิร์ฟเวอร์ production ด้วย **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- ตัวติดตั้งอัตโนมัติที่มีสถาปัตยกรรมแบบเน้นความปลอดภัยเป็นอันดับแรก

<Info>
repo [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) คือแหล่งข้อมูลจริงสำหรับการปรับใช้ด้วย Ansible หน้านี้เป็นเพียงภาพรวมแบบรวดเร็ว
</Info>

## ข้อกำหนดเบื้องต้น

| ข้อกำหนด | รายละเอียด                                                 |
| --------- | ---------------------------------------------------------- |
| **OS**    | Debian 11+ หรือ Ubuntu 20.04+                              |
| **การเข้าถึง** | สิทธิ์ root หรือ sudo                                   |
| **เครือข่าย** | การเชื่อมต่ออินเทอร์เน็ตสำหรับติดตั้งแพ็กเกจ              |
| **Ansible** | 2.14+ (สคริปต์ quick-start จะติดตั้งให้อัตโนมัติ)        |

## สิ่งที่คุณจะได้รับ

- **ความปลอดภัยแบบ firewall-first** -- UFW + Docker isolation (เข้าถึงได้เฉพาะ SSH + Tailscale)
- **Tailscale VPN** -- การเข้าถึงระยะไกลอย่างปลอดภัยโดยไม่เปิดเผยบริการสู่สาธารณะ
- **Docker** -- container sandbox แบบแยก พร้อมการ bind แบบ localhost-only
- **การป้องกันหลายชั้น** -- สถาปัตยกรรมความปลอดภัย 4 ชั้น
- **Systemd integration** -- เริ่มอัตโนมัติเมื่อบูต พร้อมการเสริมความแข็งแรง
- **การตั้งค่าด้วยคำสั่งเดียว** -- ปรับใช้ครบถ้วนภายในไม่กี่นาที

## เริ่มต้นอย่างรวดเร็ว

ติดตั้งด้วยคำสั่งเดียว:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## สิ่งที่จะถูกติดตั้ง

playbook ของ Ansible จะติดตั้งและกำหนดค่า:

1. **Tailscale** -- mesh VPN สำหรับการเข้าถึงระยะไกลอย่างปลอดภัย
2. **UFW firewall** -- เปิดเฉพาะ SSH + พอร์ตของ Tailscale
3. **Docker CE + Compose V2** -- สำหรับ backend sandbox ของเอเจนต์ค่าเริ่มต้น
4. **Node.js 24 + pnpm** -- dependency ของรันไทม์ (Node 22 LTS ซึ่งปัจจุบันคือ `22.14+` ยังคงรองรับอยู่)
5. **OpenClaw** -- รันบนโฮสต์ ไม่ได้อยู่ใน container
6. **บริการ Systemd** -- เริ่มอัตโนมัติพร้อมการเสริมความแข็งแรงด้านความปลอดภัย

<Note>
gateway ทำงานโดยตรงบนโฮสต์ (ไม่ใช่ใน Docker) การใช้ sandbox สำหรับเอเจนต์เป็น
ตัวเลือก; playbook นี้ติดตั้ง Docker เพราะมันเป็น backend sandbox
ค่าเริ่มต้น ดู [Sandboxing](/th/gateway/sandboxing) สำหรับรายละเอียดและ backend อื่น ๆ
</Note>

## การตั้งค่าหลังติดตั้ง

<Steps>
  <Step title="สลับไปเป็นผู้ใช้ openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="รันวิซาร์ด onboarding">
    สคริปต์หลังการติดตั้งจะนำคุณผ่านการกำหนดค่าของ OpenClaw
  </Step>
  <Step title="เชื่อมต่อผู้ให้บริการส่งข้อความ">
    เข้าสู่ระบบ WhatsApp, Telegram, Discord หรือ Signal:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="ตรวจสอบการติดตั้ง">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="เชื่อมต่อกับ Tailscale">
    เข้าร่วม VPN mesh ของคุณเพื่อการเข้าถึงระยะไกลอย่างปลอดภัย
  </Step>
</Steps>

### คำสั่งด่วน

```bash
# ตรวจสอบสถานะบริการ
sudo systemctl status openclaw

# ดูล็อกแบบสด
sudo journalctl -u openclaw -f

# รีสตาร์ต gateway
sudo systemctl restart openclaw

# ล็อกอินผู้ให้บริการ (รันในฐานะผู้ใช้ openclaw)
sudo -i -u openclaw
openclaw channels login
```

## สถาปัตยกรรมความปลอดภัย

การปรับใช้นี้ใช้โมเดลการป้องกัน 4 ชั้น:

1. **Firewall (UFW)** -- เปิดสู่สาธารณะเฉพาะ SSH (22) + Tailscale (41641/udp)
2. **VPN (Tailscale)** -- เข้าถึง gateway ได้เฉพาะผ่าน VPN mesh
3. **Docker isolation** -- iptables chain `DOCKER-USER` ป้องกันการเปิดเผยพอร์ตภายนอก
4. **Systemd hardening** -- NoNewPrivileges, PrivateTmp, ผู้ใช้แบบไม่มีสิทธิ์พิเศษ

เพื่อตรวจสอบพื้นผิวการโจมตีจากภายนอกของคุณ:

```bash
nmap -p- YOUR_SERVER_IP
```

ควรเปิดเพียงพอร์ต 22 (SSH) เท่านั้น บริการอื่นทั้งหมด (gateway, Docker) ถูกล็อกไว้

Docker ถูกติดตั้งสำหรับ sandbox ของเอเจนต์ (การรัน tool แบบแยก) ไม่ใช่สำหรับรัน gateway เอง ดู [Multi-Agent Sandbox and Tools](/th/tools/multi-agent-sandbox-tools) สำหรับการกำหนดค่า sandbox

## การติดตั้งแบบ manual

หากคุณต้องการควบคุมระบบอัตโนมัติด้วยตนเอง:

<Steps>
  <Step title="ติดตั้งข้อกำหนดเบื้องต้น">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="โคลน repository">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="ติดตั้ง Ansible collections">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="รัน playbook">
    ```bash
    ./run-playbook.sh
    ```

    หรือรันโดยตรง แล้วค่อยรัน setup script ด้วยตนเองภายหลัง:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # จากนั้นรัน: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## การอัปเดต

ตัวติดตั้ง Ansible จะตั้งค่า OpenClaw ให้พร้อมสำหรับการอัปเดตแบบ manual ดู [Updating](/th/install/updating) สำหรับโฟลว์การอัปเดตมาตรฐาน

หากต้องการรัน Ansible playbook ซ้ำ (เช่น สำหรับการเปลี่ยนแปลงการกำหนดค่า):

```bash
cd openclaw-ansible
./run-playbook.sh
```

สิ่งนี้เป็น idempotent และปลอดภัยที่จะรันหลายครั้ง

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไฟร์วอลล์บล็อกการเชื่อมต่อของฉัน">
    - ตรวจสอบให้แน่ใจว่าคุณเข้าถึงผ่าน Tailscale VPN ได้ก่อน
    - การเข้าถึง SSH (พอร์ต 22) ถูกอนุญาตเสมอ
    - gateway เข้าถึงได้เฉพาะผ่าน Tailscale ตามการออกแบบ

  </Accordion>
  <Accordion title="บริการไม่ยอมเริ่มทำงาน">
    ```bash
    # ตรวจสอบล็อก
    sudo journalctl -u openclaw -n 100

    # ตรวจสอบสิทธิ์
    sudo ls -la /opt/openclaw

    # ทดสอบการเริ่มด้วยตนเอง
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="ปัญหา sandbox ของ Docker">
    ```bash
    # ตรวจสอบว่า Docker กำลังทำงานอยู่
    sudo systemctl status docker

    # ตรวจสอบ sandbox image
    sudo docker images | grep openclaw-sandbox

    # build sandbox image หากไม่มี
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="การล็อกอินผู้ให้บริการล้มเหลว">
    ตรวจสอบให้แน่ใจว่าคุณกำลังรันในฐานะผู้ใช้ `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## การกำหนดค่าขั้นสูง

สำหรับรายละเอียดเชิงลึกเกี่ยวกับสถาปัตยกรรมความปลอดภัยและการแก้ไขปัญหา ดู repo openclaw-ansible:

- [Security Architecture](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Technical Details](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Troubleshooting Guide](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## ที่เกี่ยวข้อง

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- คู่มือการปรับใช้ฉบับเต็ม
- [Docker](/th/install/docker) -- การตั้งค่า gateway แบบ containerized
- [Sandboxing](/th/gateway/sandboxing) -- การกำหนดค่า sandbox ของเอเจนต์
- [Multi-Agent Sandbox and Tools](/th/tools/multi-agent-sandbox-tools) -- การแยกแบบต่อเอเจนต์
