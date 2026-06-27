---
read_when:
    - คุณต้องการปรับใช้เซิร์ฟเวอร์อัตโนมัติพร้อมการเสริมความปลอดภัย
    - คุณต้องมีการตั้งค่าที่แยกด้วยไฟร์วอลล์พร้อมการเข้าถึงผ่าน VPN
    - คุณกำลังปรับใช้ไปยังเซิร์ฟเวอร์ Debian/Ubuntu ระยะไกล
summary: การติดตั้ง OpenClaw แบบอัตโนมัติและเสริมความปลอดภัยด้วย Ansible, Tailscale VPN และการแยก隔離ด้วยไฟร์วอลล์
title: Ansible
x-i18n:
    generated_at: "2026-06-27T17:43:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03eb6f40139d7e154eee92a7a1a67471da90b128cc90daf86fbc87e383a5297c
    source_path: install/ansible.md
    workflow: 16
---

ปรับใช้ OpenClaw ไปยังเซิร์ฟเวอร์ production ด้วย **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- ตัวติดตั้งอัตโนมัติที่ออกแบบสถาปัตยกรรมโดยให้ความสำคัญกับความปลอดภัยก่อน

<Info>
รีโป [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) คือแหล่งข้อมูลหลักสำหรับการปรับใช้ด้วย Ansible หน้านี้เป็นภาพรวมแบบรวดเร็ว
</Info>

## ข้อกำหนดเบื้องต้น

| ข้อกำหนด | รายละเอียด                                                   |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ หรือ Ubuntu 20.04+                               |
| **การเข้าถึง**  | สิทธิ์ Root หรือ sudo                                   |
| **เครือข่าย** | การเชื่อมต่ออินเทอร์เน็ตสำหรับการติดตั้งแพ็กเกจ              |
| **Ansible** | 2.14+ (ติดตั้งอัตโนมัติโดยสคริปต์ quick-start) |

## สิ่งที่คุณจะได้รับ

- **ความปลอดภัยแบบไฟร์วอลล์ก่อน** -- UFW + การแยกด้วย Docker (เข้าถึงได้เฉพาะ SSH + Tailscale)
- **Tailscale VPN** -- การเข้าถึงระยะไกลที่ปลอดภัยโดยไม่เปิดเผยบริการต่อสาธารณะ
- **Docker** -- คอนเทนเนอร์แซนด์บ็อกซ์ที่แยกออกจากกัน พร้อมการ bind เฉพาะ localhost
- **การป้องกันเชิงลึก** -- สถาปัตยกรรมความปลอดภัย 4 ชั้น
- **การผสานกับ Systemd** -- เริ่มอัตโนมัติเมื่อบูตพร้อมการเสริมความปลอดภัย
- **ตั้งค่าด้วยคำสั่งเดียว** -- ปรับใช้เสร็จสมบูรณ์ภายในไม่กี่นาที

## เริ่มต้นอย่างรวดเร็ว

ติดตั้งด้วยคำสั่งเดียว:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## สิ่งที่ถูกติดตั้ง

Ansible playbook จะติดตั้งและกำหนดค่า:

1. **Tailscale** -- mesh VPN สำหรับการเข้าถึงระยะไกลที่ปลอดภัย
2. **ไฟร์วอลล์ UFW** -- เฉพาะพอร์ต SSH + Tailscale เท่านั้น
3. **Docker CE + Compose V2** -- สำหรับ backend แซนด์บ็อกซ์เอเจนต์เริ่มต้น
4. **Node.js 24 + pnpm** -- dependency สำหรับ runtime (Node 22 LTS ซึ่งปัจจุบันคือ `22.19+` ยังรองรับอยู่)
5. **OpenClaw** -- ทำงานบนโฮสต์ ไม่ได้อยู่ในคอนเทนเนอร์
6. **บริการ Systemd** -- เริ่มอัตโนมัติพร้อมการเสริมความปลอดภัย

<Note>
Gateway ทำงานโดยตรงบนโฮสต์ (ไม่ใช่ใน Docker) การทำแซนด์บ็อกซ์ให้เอเจนต์เป็นทางเลือก
playbook นี้ติดตั้ง Docker เพราะเป็น backend แซนด์บ็อกซ์เริ่มต้น
ดูรายละเอียดและ backend อื่นๆ ได้ที่ [แซนด์บ็อกซ์](/th/gateway/sandboxing)
</Note>

## การตั้งค่าหลังติดตั้ง

<Steps>
  <Step title="สลับไปเป็นผู้ใช้ openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="เรียกใช้วิซาร์ด onboarding">
    สคริปต์หลังติดตั้งจะแนะนำคุณในการกำหนดค่าการตั้งค่า OpenClaw
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
2. **VPN (Tailscale)** -- Gateway เข้าถึงได้ผ่าน VPN mesh เท่านั้น
3. **การแยกด้วย Docker** -- เชน iptables แบบ DOCKER-USER ป้องกันการเปิดเผยพอร์ตภายนอก
4. **การเสริมความปลอดภัยของ Systemd** -- NoNewPrivileges, PrivateTmp, ผู้ใช้ที่ไม่มีสิทธิ์พิเศษ

เพื่อตรวจสอบพื้นผิวการโจมตีภายนอกของคุณ:

```bash
nmap -p- YOUR_SERVER_IP
```

ควรมีเฉพาะพอร์ต 22 (SSH) ที่เปิดอยู่ บริการอื่นทั้งหมด (Gateway, Docker) จะถูกล็อกไว้

Docker ถูกติดตั้งสำหรับแซนด์บ็อกซ์ของเอเจนต์ (การเรียกใช้เครื่องมือแบบแยกส่วน) ไม่ใช่สำหรับเรียกใช้ Gateway เอง ดูการกำหนดค่าแซนด์บ็อกซ์ได้ที่ [แซนด์บ็อกซ์และเครื่องมือแบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)

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

    หรือเรียกใช้โดยตรง แล้วจึงเรียกใช้สคริปต์ตั้งค่าด้วยตนเองภายหลัง:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## การอัปเดต

ตัวติดตั้ง Ansible จะตั้งค่า OpenClaw สำหรับการอัปเดตด้วยตนเอง ดูขั้นตอนการอัปเดตมาตรฐานได้ที่ [การอัปเดต](/th/install/updating)

หากต้องการเรียกใช้ Ansible playbook อีกครั้ง (เช่น สำหรับการเปลี่ยนแปลงการกำหนดค่า):

```bash
cd openclaw-ansible
./run-playbook.sh
```

คำสั่งนี้เป็นแบบ idempotent และปลอดภัยที่จะเรียกใช้หลายครั้ง

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไฟร์วอลล์บล็อกการเชื่อมต่อของฉัน">
    - ตรวจสอบให้แน่ใจว่าคุณเข้าถึงผ่าน Tailscale VPN ได้ก่อน
    - อนุญาตการเข้าถึง SSH (พอร์ต 22) เสมอ
    - Gateway เข้าถึงได้ผ่าน Tailscale เท่านั้นตามการออกแบบ

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
  <Accordion title="ปัญหาแซนด์บ็อกซ์ Docker">
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
    ตรวจสอบให้แน่ใจว่าคุณกำลังเรียกใช้ในฐานะผู้ใช้ `openclaw`:
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
- [แซนด์บ็อกซ์](/th/gateway/sandboxing) -- การกำหนดค่าแซนด์บ็อกซ์ของเอเจนต์
- [แซนด์บ็อกซ์และเครื่องมือแบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) -- การแยกต่อเอเจนต์
