---
read_when:
    - คุณต้องการปรับใช้เซิร์ฟเวอร์โดยอัตโนมัติพร้อมเสริมความมั่นคงปลอดภัย
    - คุณต้องการการตั้งค่าที่แยกด้วยไฟร์วอลล์และเข้าถึงผ่าน VPN ได้
    - คุณกำลังปรับใช้บนเซิร์ฟเวอร์ Debian/Ubuntu ระยะไกล
summary: การติดตั้ง OpenClaw แบบอัตโนมัติและเสริมความปลอดภัยด้วย Ansible, Tailscale VPN และการแยกด้วยไฟร์วอลล์
title: Ansible
x-i18n:
    generated_at: "2026-07-16T19:16:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f6b473cd5a8b80389b5ed746c4e2f2729d95bb15a2daaaa183fbdfbe144e647
    source_path: install/ansible.md
    workflow: 16
---

ปรับใช้ OpenClaw บนเซิร์ฟเวอร์ที่ใช้งานจริงด้วย **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** ซึ่งเป็นตัวติดตั้งอัตโนมัติที่ใช้สถาปัตยกรรมซึ่งให้ความสำคัญกับความปลอดภัยเป็นอันดับแรก

<Info>
รีโพ [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) เป็นแหล่งข้อมูลหลักสำหรับการปรับใช้ด้วย Ansible หน้านี้เป็นภาพรวมโดยย่อ
</Info>

## ข้อกำหนดเบื้องต้น

| ข้อกำหนด | รายละเอียด                                                   |
| ----------- | --------------------------------------------------------- |
| ระบบปฏิบัติการ          | Debian 11+ หรือ Ubuntu 20.04+                               |
| สิทธิ์เข้าถึง      | สิทธิ์ root หรือ sudo                                   |
| เครือข่าย     | การเชื่อมต่ออินเทอร์เน็ตสำหรับติดตั้งแพ็กเกจ              |
| Ansible     | 2.14+ (ติดตั้งโดยอัตโนมัติด้วยสคริปต์เริ่มต้นอย่างรวดเร็ว) |

## สิ่งที่จะได้รับ

- ความปลอดภัยที่เริ่มต้นจากไฟร์วอลล์: UFW + การแยก Docker (เข้าถึงได้เฉพาะ SSH + Tailscale)
- Tailscale VPN สำหรับการเข้าถึงจากระยะไกลโดยไม่เปิดเผยบริการต่อสาธารณะ
- Docker สำหรับคอนเทนเนอร์แซนด์บ็อกซ์ที่แยกจากกัน โดยผูกการเชื่อมต่อไว้เฉพาะกับ localhost
- การผสานรวมกับ systemd พร้อมการเพิ่มความปลอดภัยและเริ่มทำงานอัตโนมัติเมื่อบูต
- ตั้งค่าได้ด้วยคำสั่งเดียว

## เริ่มต้นอย่างรวดเร็ว

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## สิ่งที่ได้รับการติดตั้ง

1. Tailscale (mesh VPN สำหรับการเข้าถึงจากระยะไกลอย่างปลอดภัย)
2. ไฟร์วอลล์ UFW (เฉพาะพอร์ต SSH + Tailscale)
3. Docker CE + Compose V2 (แบ็กเอนด์แซนด์บ็อกซ์เริ่มต้นของเอเจนต์)
4. Node.js และ pnpm (OpenClaw ต้องใช้ Node 22.22.3+, 24.15+ หรือ 25.9+; แนะนำให้ใช้ Node 24)
5. OpenClaw ซึ่งติดตั้งโดยตรงบนโฮสต์ ไม่ได้ทำงานในคอนเทนเนอร์
6. บริการ systemd พร้อมการเพิ่มความปลอดภัย

<Note>
Gateway ทำงานโดยตรงบนโฮสต์ ไม่ได้ทำงานใน Docker การใช้แซนด์บ็อกซ์สำหรับเอเจนต์เป็น
ทางเลือก; playbook นี้ติดตั้ง Docker เนื่องจากเป็นแบ็กเอนด์แซนด์บ็อกซ์
เริ่มต้น ดูแบ็กเอนด์อื่นได้ที่ [การใช้แซนด์บ็อกซ์](/th/gateway/sandboxing)
</Note>

## การตั้งค่าหลังติดตั้ง

<Steps>
  <Step title="สลับไปยังผู้ใช้ openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="เรียกใช้ตัวช่วยการเริ่มต้นใช้งาน">
    สคริปต์หลังติดตั้งจะแนะนำขั้นตอนการกำหนดค่า OpenClaw
  </Step>
  <Step title="เชื่อมต่อช่องทางการรับส่งข้อความ">
    เข้าสู่ระบบ WhatsApp, Telegram, Discord หรือ Signal:
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="ตรวจสอบการติดตั้ง">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="เชื่อมต่อกับ Tailscale">
    เข้าร่วม mesh VPN เพื่อการเข้าถึงจากระยะไกลอย่างปลอดภัย
  </Step>
</Steps>

### คำสั่งด่วน

```bash
# ตรวจสอบสถานะบริการ
sudo systemctl status openclaw

# ดูบันทึกแบบเรียลไทม์
sudo journalctl -u openclaw -f

# เริ่ม Gateway ใหม่
sudo systemctl restart openclaw

# เข้าสู่ระบบช่องทาง (เรียกใช้ในฐานะผู้ใช้ openclaw)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## สถาปัตยกรรมความปลอดภัย

โมเดลการป้องกันสี่ชั้น:

1. ไฟร์วอลล์ (UFW): เปิดเผยต่อสาธารณะเฉพาะ SSH (22) และ Tailscale (41641/udp)
2. VPN (Tailscale): เข้าถึง Gateway ได้เฉพาะผ่าน mesh VPN
3. การแยกด้วย Docker: เชน iptables `DOCKER-USER` ป้องกันไม่ให้พอร์ตถูกเปิดเผยต่อภายนอก
4. การเพิ่มความปลอดภัยของ systemd: `NoNewPrivileges`, `PrivateTmp`, ผู้ใช้ที่ไม่มีสิทธิ์พิเศษ

ตรวจสอบพื้นผิวการโจมตีจากภายนอก:

```bash
nmap -p- YOUR_SERVER_IP
```

ควรเปิดเฉพาะพอร์ต 22 (SSH) เท่านั้น Gateway และ Docker จะยังคงถูกปิดกั้นอย่างปลอดภัย

Docker ได้รับการติดตั้งเพื่อใช้กับแซนด์บ็อกซ์ของเอเจนต์ (การเรียกใช้เครื่องมือแบบแยกจากกัน) ไม่ได้ใช้เพื่อเรียกใช้ Gateway ดูการกำหนดค่าแซนด์บ็อกซ์ได้ที่ [แซนด์บ็อกซ์และเครื่องมือแบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)

## การติดตั้งด้วยตนเอง

<Steps>
  <Step title="ติดตั้งข้อกำหนดเบื้องต้น">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="โคลนรีโพ">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="ติดตั้งคอลเลกชัน Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="เรียกใช้ playbook">
    ```bash
    ./run-playbook.sh
    ```

    หรือเรียกใช้ playbook โดยตรง แล้วเรียกใช้สคริปต์ตั้งค่าด้วยตนเอง:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # จากนั้นเรียกใช้: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## การอัปเดต

ตัวติดตั้ง Ansible ตั้งค่า OpenClaw สำหรับการอัปเดตด้วยตนเอง ดูขั้นตอนมาตรฐานได้ที่ [การอัปเดต](/th/install/updating)

หากต้องการเรียกใช้ playbook อีกครั้ง (เช่น หลังจากเปลี่ยนแปลงการกำหนดค่า):

```bash
cd openclaw-ansible
./run-playbook.sh
```

กระบวนการนี้มีคุณสมบัติ idempotent และสามารถเรียกใช้ซ้ำได้อย่างปลอดภัย

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไฟร์วอลล์ปิดกั้นการเชื่อมต่อ">
    - เชื่อมต่อผ่าน Tailscale VPN ก่อน; Gateway ได้รับการออกแบบให้เข้าถึงได้ด้วยวิธีนี้เท่านั้น
    - อนุญาต SSH (พอร์ต 22) เสมอ

  </Accordion>
  <Accordion title="บริการไม่เริ่มทำงาน">
    ```bash
    # ตรวจสอบบันทึก
    sudo journalctl -u openclaw -n 100

    # ตรวจสอบสิทธิ์
    sudo ls -la /opt/openclaw

    # ทดสอบการเริ่มทำงานด้วยตนเอง
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="ปัญหาเกี่ยวกับแซนด์บ็อกซ์ Docker">
    ```bash
    # ตรวจสอบว่า Docker กำลังทำงาน
    sudo systemctl status docker

    # ตรวจสอบอิมเมจแซนด์บ็อกซ์
    sudo docker images | grep openclaw-sandbox

    # สร้างอิมเมจแซนด์บ็อกซ์หากไม่มี (ต้องมีการเช็กเอาต์ซอร์ส)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # สำหรับการติดตั้งด้วย npm โดยไม่มีการเช็กเอาต์ซอร์ส โปรดดู
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="เข้าสู่ระบบช่องทางไม่สำเร็จ">
    ตรวจสอบให้แน่ใจว่ากำลังเรียกใช้ในฐานะผู้ใช้ `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## การกำหนดค่าขั้นสูง

ดูรายละเอียดเกี่ยวกับสถาปัตยกรรมความปลอดภัยและการแก้ไขปัญหาได้ในรีโพ openclaw-ansible:

- [สถาปัตยกรรมความปลอดภัย](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [รายละเอียดทางเทคนิค](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [คู่มือการแก้ไขปัญหา](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## เนื้อหาที่เกี่ยวข้อง

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): คู่มือการปรับใช้ฉบับสมบูรณ์
- [Docker](/th/install/docker): การตั้งค่า Gateway แบบคอนเทนเนอร์
- [การใช้แซนด์บ็อกซ์](/th/gateway/sandboxing): การกำหนดค่าแซนด์บ็อกซ์ของเอเจนต์
- [แซนด์บ็อกซ์และเครื่องมือแบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools): การแยกสำหรับแต่ละเอเจนต์
