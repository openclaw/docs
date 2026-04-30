---
read_when:
    - คุณต้องการการปรับใช้เซิร์ฟเวอร์อัตโนมัติพร้อมการเสริมความปลอดภัย
    - คุณต้องมีการตั้งค่าที่แยกด้วยไฟร์วอลล์พร้อมการเข้าถึงผ่าน VPN
    - คุณกำลังปรับใช้ไปยังเซิร์ฟเวอร์ Debian/Ubuntu ระยะไกล
summary: การติดตั้ง OpenClaw แบบอัตโนมัติและเสริมความปลอดภัยด้วย Ansible, Tailscale VPN และการแยกกั้นด้วยไฟร์วอลล์
title: Ansible
x-i18n:
    generated_at: "2026-04-30T09:58:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbe42e3f83b02e436f0dc5111dda1e069c573b32fdde23ad50dbb2b147c6dd72
    source_path: install/ansible.md
    workflow: 16
---

# การติดตั้ง Ansible

ปรับใช้ OpenClaw ไปยังเซิร์ฟเวอร์โปรดักชันด้วย **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- ตัวติดตั้งอัตโนมัติที่มีสถาปัตยกรรมให้ความสำคัญกับความปลอดภัยเป็นอันดับแรก

<Info>
รีโป [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) คือแหล่งข้อมูลหลักสำหรับการปรับใช้ด้วย Ansible หน้านี้เป็นภาพรวมแบบย่อ
</Info>

## ข้อกำหนดเบื้องต้น

| ข้อกำหนด | รายละเอียด                                                |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ หรือ Ubuntu 20.04+                             |
| **การเข้าถึง** | สิทธิ์ Root หรือ sudo                                      |
| **เครือข่าย** | การเชื่อมต่ออินเทอร์เน็ตสำหรับการติดตั้งแพ็กเกจ             |
| **Ansible** | 2.14+ (ติดตั้งโดยอัตโนมัติผ่านสคริปต์เริ่มต้นอย่างรวดเร็ว) |

## สิ่งที่คุณจะได้รับ

- **ความปลอดภัยที่เริ่มจากไฟร์วอลล์** -- การแยก UFW + Docker (เข้าถึงได้เฉพาะ SSH + Tailscale)
- **Tailscale VPN** -- การเข้าถึงระยะไกลที่ปลอดภัยโดยไม่เปิดเผยบริการต่อสาธารณะ
- **Docker** -- คอนเทนเนอร์ sandbox ที่แยกกัน, ผูกกับ localhost เท่านั้น
- **การป้องกันหลายชั้น** -- สถาปัตยกรรมความปลอดภัย 4 ชั้น
- **การผสานกับ Systemd** -- เริ่มอัตโนมัติเมื่อบูตพร้อมการเสริมความปลอดภัย
- **ตั้งค่าด้วยคำสั่งเดียว** -- ปรับใช้เสร็จสมบูรณ์ในไม่กี่นาที

## เริ่มต้นอย่างรวดเร็ว

ติดตั้งด้วยคำสั่งเดียว:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## สิ่งที่จะถูกติดตั้ง

Ansible playbook จะติดตั้งและกำหนดค่า:

1. **Tailscale** -- mesh VPN สำหรับการเข้าถึงระยะไกลที่ปลอดภัย
2. **ไฟร์วอลล์ UFW** -- เฉพาะพอร์ต SSH + Tailscale เท่านั้น
3. **Docker CE + Compose V2** -- สำหรับ backend sandbox ของ agent เริ่มต้น
4. **Node.js 24 + pnpm** -- dependency สำหรับรันไทม์ (Node 22 LTS, ปัจจุบันคือ `22.14+`, ยังคงรองรับอยู่)
5. **OpenClaw** -- รันบนโฮสต์ ไม่ได้อยู่ในคอนเทนเนอร์
6. **บริการ Systemd** -- เริ่มอัตโนมัติพร้อมการเสริมความปลอดภัย

<Note>
gateway รันโดยตรงบนโฮสต์ (ไม่ได้รันใน Docker) การทำ sandbox สำหรับ agent เป็น
ตัวเลือกเสริม; playbook นี้ติดตั้ง Docker เพราะเป็น sandbox
backend เริ่มต้น ดูรายละเอียดและ backend อื่นได้ที่ [Sandboxing](/th/gateway/sandboxing)
</Note>

## การตั้งค่าหลังติดตั้ง

<Steps>
  <Step title="สลับไปเป็นผู้ใช้ openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="เรียกใช้ตัวช่วยตั้งค่า onboarding">
    สคริปต์หลังติดตั้งจะแนะนำคุณตลอดการกำหนดค่าการตั้งค่า OpenClaw
  </Step>
  <Step title="เชื่อมต่อผู้ให้บริการข้อความ">
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
    เข้าร่วม VPN mesh ของคุณเพื่อการเข้าถึงระยะไกลที่ปลอดภัย
  </Step>
</Steps>

### คำสั่งด่วน

```bash
# Check service status
sudo systemctl status openclaw

# View live logs
sudo journalctl -u openclaw -f

# Restart gateway
sudo systemctl restart openclaw

# Provider login (run as openclaw user)
sudo -i -u openclaw
openclaw channels login
```

## สถาปัตยกรรมความปลอดภัย

การปรับใช้นี้ใช้โมเดลการป้องกัน 4 ชั้น:

1. **ไฟร์วอลล์ (UFW)** -- เปิดเผยต่อสาธารณะเฉพาะ SSH (22) + Tailscale (41641/udp)
2. **VPN (Tailscale)** -- gateway เข้าถึงได้ผ่าน VPN mesh เท่านั้น
3. **การแยกด้วย Docker** -- chain iptables DOCKER-USER ป้องกันการเปิดเผยพอร์ตภายนอก
4. **การเสริมความปลอดภัยของ Systemd** -- NoNewPrivileges, PrivateTmp, ผู้ใช้ไม่มีสิทธิ์พิเศษ

หากต้องการตรวจสอบพื้นผิวการโจมตีจากภายนอก:

```bash
nmap -p- YOUR_SERVER_IP
```

ควรเปิดเฉพาะพอร์ต 22 (SSH) เท่านั้น บริการอื่นทั้งหมด (gateway, Docker) จะถูกล็อกไว้

Docker ถูกติดตั้งสำหรับ sandbox ของ agent (การเรียกใช้เครื่องมือแบบแยก) ไม่ใช่สำหรับรัน gateway เอง ดูการกำหนดค่า sandbox ได้ที่ [Multi-Agent Sandbox and Tools](/th/tools/multi-agent-sandbox-tools)

## การติดตั้งด้วยตนเอง

หากคุณต้องการควบคุมกระบวนการอัตโนมัติด้วยตนเอง:

<Steps>
  <Step title="ติดตั้งข้อกำหนดเบื้องต้น">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="โคลนที่เก็บ">
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
  <Step title="เรียกใช้ playbook">
    ```bash
    ./run-playbook.sh
    ```

    หรือเรียกใช้โดยตรงแล้วค่อยเรียกใช้สคริปต์ตั้งค่าด้วยตนเองภายหลัง:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## การอัปเดต

ตัวติดตั้ง Ansible จะตั้งค่า OpenClaw สำหรับการอัปเดตด้วยตนเอง ดูขั้นตอนการอัปเดตมาตรฐานได้ที่ [Updating](/th/install/updating)

หากต้องการเรียกใช้ Ansible playbook อีกครั้ง (เช่น สำหรับการเปลี่ยนแปลงการกำหนดค่า):

```bash
cd openclaw-ansible
./run-playbook.sh
```

การดำเนินการนี้เป็นแบบ idempotent และปลอดภัยที่จะเรียกใช้หลายครั้ง

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไฟร์วอลล์บล็อกการเชื่อมต่อของฉัน">
    - ตรวจสอบให้แน่ใจว่าคุณเข้าถึงผ่าน Tailscale VPN ได้ก่อน
    - การเข้าถึง SSH (พอร์ต 22) อนุญาตเสมอ
    - gateway เข้าถึงได้เฉพาะผ่าน Tailscale ตามการออกแบบ

  </Accordion>
  <Accordion title="บริการไม่เริ่มทำงาน">
    ```bash
    # Check logs
    sudo journalctl -u openclaw -n 100

    # Verify permissions
    sudo ls -la /opt/openclaw

    # Test manual start
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="ปัญหา Docker sandbox">
    ```bash
    # Verify Docker is running
    sudo systemctl status docker

    # Check sandbox image
    sudo docker images | grep openclaw-sandbox

    # Build sandbox image if missing
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="เข้าสู่ระบบผู้ให้บริการไม่สำเร็จ">
    ตรวจสอบให้แน่ใจว่าคุณกำลังรันในฐานะผู้ใช้ `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## การกำหนดค่าขั้นสูง

สำหรับสถาปัตยกรรมความปลอดภัยโดยละเอียดและการแก้ไขปัญหา โปรดดูรีโป openclaw-ansible:

- [สถาปัตยกรรมความปลอดภัย](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [รายละเอียดทางเทคนิค](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [คู่มือการแก้ไขปัญหา](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## ที่เกี่ยวข้อง

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- คู่มือการปรับใช้ฉบับเต็ม
- [Docker](/th/install/docker) -- การตั้งค่า gateway แบบคอนเทนเนอร์
- [Sandboxing](/th/gateway/sandboxing) -- การกำหนดค่า sandbox ของ agent
- [Multi-Agent Sandbox and Tools](/th/tools/multi-agent-sandbox-tools) -- การแยกต่อ agent
