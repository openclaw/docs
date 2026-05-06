---
read_when:
    - คุณต้องการปรับใช้เซิร์ฟเวอร์แบบอัตโนมัติพร้อมการเสริมความปลอดภัย
    - คุณต้องมีการตั้งค่าที่แยกด้วยไฟร์วอลล์พร้อมการเข้าถึงผ่าน VPN
    - คุณกำลังปรับใช้ไปยังเซิร์ฟเวอร์ Debian/Ubuntu ระยะไกล
summary: การติดตั้ง OpenClaw แบบอัตโนมัติและเสริมความปลอดภัยด้วย Ansible, Tailscale VPN และการแยกส่วนด้วยไฟร์วอลล์
title: Ansible
x-i18n:
    generated_at: "2026-05-06T09:17:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7424e766619096f50fa0c83aa4e85e46adba11515b1871e58cf2406b7c8f815
    source_path: install/ansible.md
    workflow: 16
---

ปรับใช้ OpenClaw ไปยังเซิร์ฟเวอร์ production ด้วย **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- ตัวติดตั้งอัตโนมัติที่มีสถาปัตยกรรมเน้นความปลอดภัยเป็นอันดับแรก

<Info>
รีโป [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) คือแหล่งข้อมูลหลักสำหรับการปรับใช้ด้วย Ansible หน้านี้เป็นภาพรวมแบบสั้น
</Info>

## ข้อกำหนดเบื้องต้น

| ข้อกำหนด | รายละเอียด                                                   |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ หรือ Ubuntu 20.04+                               |
| **Access**  | สิทธิ์ root หรือ sudo                                   |
| **Network** | การเชื่อมต่ออินเทอร์เน็ตสำหรับการติดตั้งแพ็กเกจ              |
| **Ansible** | 2.14+ (ติดตั้งอัตโนมัติโดยสคริปต์ quick-start) |

## สิ่งที่คุณจะได้รับ

- **ความปลอดภัยแบบ firewall-first** -- การแยก UFW + Docker (เข้าถึงได้เฉพาะ SSH + Tailscale)
- **Tailscale VPN** -- การเข้าถึงระยะไกลที่ปลอดภัยโดยไม่เปิดเผยบริการสู่สาธารณะ
- **Docker** -- คอนเทนเนอร์ sandbox ที่แยกออกจากกัน, ผูกกับ localhost เท่านั้น
- **การป้องกันหลายชั้น** -- สถาปัตยกรรมความปลอดภัย 4 ชั้น
- **การผสานรวม Systemd** -- เริ่มอัตโนมัติเมื่อบูตพร้อมการ hardening
- **ตั้งค่าด้วยคำสั่งเดียว** -- ปรับใช้ให้เสร็จสมบูรณ์ในไม่กี่นาที

## เริ่มต้นอย่างรวดเร็ว

ติดตั้งด้วยคำสั่งเดียว:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## สิ่งที่จะถูกติดตั้ง

Ansible playbook จะติดตั้งและกำหนดค่า:

1. **Tailscale** -- mesh VPN สำหรับการเข้าถึงระยะไกลอย่างปลอดภัย
2. **UFW firewall** -- เฉพาะพอร์ต SSH + Tailscale เท่านั้น
3. **Docker CE + Compose V2** -- สำหรับแบ็กเอนด์ sandbox ของ agent เริ่มต้น
4. **Node.js 24 + pnpm** -- dependency สำหรับ runtime (Node 22 LTS, ปัจจุบันคือ `22.14+`, ยังคงรองรับอยู่)
5. **OpenClaw** -- ทำงานบนโฮสต์ ไม่ได้อยู่ในคอนเทนเนอร์
6. **บริการ Systemd** -- เริ่มอัตโนมัติพร้อม security hardening

<Note>
Gateway ทำงานโดยตรงบนโฮสต์ (ไม่ใช่ใน Docker) การทำ sandbox สำหรับ agent เป็น
ตัวเลือกเสริม; playbook นี้ติดตั้ง Docker เพราะเป็นแบ็กเอนด์ sandbox
เริ่มต้น ดูรายละเอียดและแบ็กเอนด์อื่น ๆ ได้ที่ [Sandboxing](/th/gateway/sandboxing)
</Note>

## การตั้งค่าหลังติดตั้ง

<Steps>
  <Step title="สลับไปเป็นผู้ใช้ openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="เรียกใช้ตัวช่วย onboarding">
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
    เข้าร่วม mesh VPN ของคุณเพื่อการเข้าถึงระยะไกลที่ปลอดภัย
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

1. **Firewall (UFW)** -- เปิดเผยสู่สาธารณะเฉพาะ SSH (22) + Tailscale (41641/udp)
2. **VPN (Tailscale)** -- Gateway เข้าถึงได้ผ่าน mesh VPN เท่านั้น
3. **การแยกด้วย Docker** -- เชน DOCKER-USER iptables ป้องกันการเปิดเผยพอร์ตภายนอก
4. **Systemd hardening** -- NoNewPrivileges, PrivateTmp, ผู้ใช้ที่ไม่มีสิทธิ์พิเศษ

เพื่อตรวจสอบพื้นผิวการโจมตีจากภายนอกของคุณ:

```bash
nmap -p- YOUR_SERVER_IP
```

ควรเปิดอยู่เฉพาะพอร์ต 22 (SSH) เท่านั้น บริการอื่นทั้งหมด (Gateway, Docker) จะถูกล็อกไว้

Docker ถูกติดตั้งสำหรับ sandbox ของ agent (การรันเครื่องมือแบบแยกส่วน) ไม่ใช่สำหรับเรียกใช้ Gateway เอง ดูการกำหนดค่า sandbox ได้ที่ [Multi-Agent Sandbox and Tools](/th/tools/multi-agent-sandbox-tools)

## การติดตั้งด้วยตนเอง

หากคุณต้องการควบคุมด้วยตนเองแทนระบบอัตโนมัติ:

<Steps>
  <Step title="ติดตั้งข้อกำหนดเบื้องต้น">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="โคลนที่เก็บโค้ด">
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

    อีกทางเลือกหนึ่ง ให้เรียกใช้โดยตรงแล้วจึงรันสคริปต์ตั้งค่าด้วยตนเองภายหลัง:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## การอัปเดต

ตัวติดตั้ง Ansible จะตั้งค่า OpenClaw สำหรับการอัปเดตด้วยตนเอง ดูขั้นตอนการอัปเดตมาตรฐานได้ที่ [Updating](/th/install/updating)

หากต้องการเรียกใช้ Ansible playbook อีกครั้ง (เช่น เพื่อเปลี่ยนการกำหนดค่า):

```bash
cd openclaw-ansible
./run-playbook.sh
```

คำสั่งนี้เป็นแบบ idempotent และสามารถรันได้หลายครั้งอย่างปลอดภัย

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="Firewall บล็อกการเชื่อมต่อของฉัน">
    - ตรวจสอบให้แน่ใจว่าคุณเข้าถึงผ่าน Tailscale VPN ได้ก่อน
    - อนุญาตการเข้าถึง SSH (พอร์ต 22) เสมอ
    - Gateway ถูกออกแบบมาให้เข้าถึงได้ผ่าน Tailscale เท่านั้น

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

    # Build sandbox image if missing (requires source checkout)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # For npm installs without a source checkout, see
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="การเข้าสู่ระบบผู้ให้บริการล้มเหลว">
    ตรวจสอบให้แน่ใจว่าคุณกำลังรันในฐานะผู้ใช้ `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## การกำหนดค่าขั้นสูง

สำหรับสถาปัตยกรรมความปลอดภัยและการแก้ไขปัญหาโดยละเอียด โปรดดูรีโป openclaw-ansible:

- [Security Architecture](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Technical Details](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Troubleshooting Guide](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## ที่เกี่ยวข้อง

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- คู่มือการปรับใช้ฉบับเต็ม
- [Docker](/th/install/docker) -- การตั้งค่า Gateway แบบคอนเทนเนอร์
- [Sandboxing](/th/gateway/sandboxing) -- การกำหนดค่า sandbox ของ agent
- [Multi-Agent Sandbox and Tools](/th/tools/multi-agent-sandbox-tools) -- การแยกแต่ละ agent ออกจากกัน
