---
read_when:
    - คุณต้องการการปรับใช้เซิร์ฟเวอร์แบบอัตโนมัติพร้อมการเสริมความปลอดภัย
    - คุณต้องใช้การตั้งค่าที่แยกกั้นด้วยไฟร์วอลล์พร้อมการเข้าถึงผ่าน VPN
    - คุณกำลังปรับใช้ไปยังเซิร์ฟเวอร์ Debian/Ubuntu ระยะไกล
summary: การติดตั้ง OpenClaw แบบอัตโนมัติและเสริมความปลอดภัยด้วย Ansible, Tailscale VPN และการแยกกั้นด้วยไฟร์วอลล์
title: Ansible
x-i18n:
    generated_at: "2026-05-02T10:20:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 789763c82483f4eec0963f4dccb06f2daa22d470a5e69e275f38c70a00a10ba4
    source_path: install/ansible.md
    workflow: 16
---

# การติดตั้ง Ansible

ปรับใช้ OpenClaw ไปยังเซิร์ฟเวอร์ production ด้วย **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- ตัวติดตั้งอัตโนมัติที่มีสถาปัตยกรรมเน้นความปลอดภัยเป็นอันดับแรก.

<Info>
รีโป [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) คือแหล่งข้อมูลหลักสำหรับการปรับใช้ด้วย Ansible หน้านี้เป็นภาพรวมแบบรวดเร็ว.
</Info>

## ข้อกำหนดเบื้องต้น

| ข้อกำหนด | รายละเอียด                                                   |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ หรือ Ubuntu 20.04+                               |
| **การเข้าถึง**  | สิทธิ์ root หรือ sudo                                   |
| **เครือข่าย** | การเชื่อมต่ออินเทอร์เน็ตสำหรับการติดตั้งแพ็กเกจ              |
| **Ansible** | 2.14+ (ติดตั้งอัตโนมัติโดยสคริปต์เริ่มต้นด่วน) |

## สิ่งที่คุณจะได้รับ

- **ความปลอดภัยเริ่มจากไฟร์วอลล์** -- การแยก UFW + Docker (เข้าถึงได้เฉพาะ SSH + Tailscale)
- **Tailscale VPN** -- การเข้าถึงระยะไกลที่ปลอดภัยโดยไม่เปิดเผยบริการสู่สาธารณะ
- **Docker** -- คอนเทนเนอร์ sandbox ที่แยกจากกัน, ผูกกับ localhost เท่านั้น
- **การป้องกันหลายชั้น** -- สถาปัตยกรรมความปลอดภัย 4 ชั้น
- **การผสานรวม Systemd** -- เริ่มอัตโนมัติเมื่อบูตพร้อมการเสริมความปลอดภัย
- **ตั้งค่าด้วยคำสั่งเดียว** -- ปรับใช้ครบถ้วนภายในไม่กี่นาที

## เริ่มต้นด่วน

ติดตั้งด้วยคำสั่งเดียว:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## สิ่งที่จะถูกติดตั้ง

Ansible playbook จะติดตั้งและกำหนดค่า:

1. **Tailscale** -- mesh VPN สำหรับการเข้าถึงระยะไกลที่ปลอดภัย
2. **ไฟร์วอลล์ UFW** -- เฉพาะพอร์ต SSH + Tailscale เท่านั้น
3. **Docker CE + Compose V2** -- สำหรับแบ็กเอนด์ sandbox เริ่มต้นของเอเจนต์
4. **Node.js 24 + pnpm** -- dependency สำหรับรันไทม์ (Node 22 LTS, ปัจจุบันคือ `22.14+`, ยังรองรับอยู่)
5. **OpenClaw** -- ทำงานบนโฮสต์, ไม่ได้อยู่ในคอนเทนเนอร์
6. **บริการ Systemd** -- เริ่มอัตโนมัติพร้อมการเสริมความปลอดภัย

<Note>
Gateway ทำงานโดยตรงบนโฮสต์ (ไม่ใช่ใน Docker) การทำ sandbox สำหรับเอเจนต์เป็น
ตัวเลือกเสริม; playbook นี้ติดตั้ง Docker เพราะเป็นแบ็กเอนด์ sandbox
เริ่มต้น ดูรายละเอียดและแบ็กเอนด์อื่นได้ที่ [การทำ Sandbox](/th/gateway/sandboxing).
</Note>

## การตั้งค่าหลังติดตั้ง

<Steps>
  <Step title="สลับไปยังผู้ใช้ openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="เรียกใช้ตัวช่วยเริ่มต้นใช้งาน">
    สคริปต์หลังติดตั้งจะแนะนำคุณในการกำหนดค่าการตั้งค่า OpenClaw.
  </Step>
  <Step title="เชื่อมต่อผู้ให้บริการส่งข้อความ">
    เข้าสู่ระบบ WhatsApp, Telegram, Discord, หรือ Signal:
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
    เข้าร่วม VPN mesh ของคุณเพื่อการเข้าถึงระยะไกลที่ปลอดภัย.
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
2. **VPN (Tailscale)** -- เข้าถึง Gateway ได้เฉพาะผ่าน VPN mesh
3. **การแยกด้วย Docker** -- chain iptables ของ DOCKER-USER ป้องกันการเปิดเผยพอร์ตภายนอก
4. **การเสริมความปลอดภัย Systemd** -- NoNewPrivileges, PrivateTmp, ผู้ใช้ที่ไม่มีสิทธิ์พิเศษ

หากต้องการตรวจสอบพื้นผิวการโจมตีจากภายนอกของคุณ:

```bash
nmap -p- YOUR_SERVER_IP
```

ควรเปิดเฉพาะพอร์ต 22 (SSH) เท่านั้น บริการอื่นทั้งหมด (Gateway, Docker) จะถูกล็อกไว้.

Docker ถูกติดตั้งสำหรับ sandbox ของเอเจนต์ (การรันเครื่องมือแบบแยกส่วน) ไม่ใช่สำหรับรัน Gateway เอง ดูการกำหนดค่า sandbox ได้ที่ [Sandbox และเครื่องมือแบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools).

## การติดตั้งด้วยตนเอง

หากคุณต้องการควบคุมการทำงานอัตโนมัติด้วยตนเอง:

<Steps>
  <Step title="ติดตั้งข้อกำหนดเบื้องต้น">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="โคลนรีโพสิทอรี">
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

    อีกทางหนึ่ง ให้รันโดยตรง แล้วจึงสั่งสคริปต์ตั้งค่าด้วยตนเองภายหลัง:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## การอัปเดต

ตัวติดตั้ง Ansible จะตั้งค่า OpenClaw สำหรับการอัปเดตด้วยตนเอง ดูขั้นตอนการอัปเดตมาตรฐานได้ที่ [การอัปเดต](/th/install/updating).

หากต้องการรัน Ansible playbook อีกครั้ง (เช่น สำหรับการเปลี่ยนแปลงการกำหนดค่า):

```bash
cd openclaw-ansible
./run-playbook.sh
```

คำสั่งนี้เป็น idempotent และปลอดภัยที่จะรันหลายครั้ง.

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไฟร์วอลล์บล็อกการเชื่อมต่อของฉัน">
    - ตรวจสอบให้แน่ใจว่าคุณสามารถเข้าถึงผ่าน Tailscale VPN ได้ก่อน
    - อนุญาตการเข้าถึง SSH (พอร์ต 22) เสมอ
    - Gateway เข้าถึงได้เฉพาะผ่าน Tailscale ตามการออกแบบ

  </Accordion>
  <Accordion title="บริการเริ่มไม่ได้">
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
  <Accordion title="เข้าสู่ระบบผู้ให้บริการไม่สำเร็จ">
    ตรวจสอบให้แน่ใจว่าคุณกำลังรันในฐานะผู้ใช้ `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## การกำหนดค่าขั้นสูง

สำหรับสถาปัตยกรรมความปลอดภัยและการแก้ไขปัญหาโดยละเอียด ดูรีโป openclaw-ansible:

- [สถาปัตยกรรมความปลอดภัย](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [รายละเอียดทางเทคนิค](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [คู่มือการแก้ไขปัญหา](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## ที่เกี่ยวข้อง

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- คู่มือการปรับใช้ฉบับเต็ม
- [Docker](/th/install/docker) -- การตั้งค่า Gateway แบบคอนเทนเนอร์
- [การทำ Sandbox](/th/gateway/sandboxing) -- การกำหนดค่า sandbox ของเอเจนต์
- [Sandbox และเครื่องมือแบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) -- การแยกแบบต่อเอเจนต์
