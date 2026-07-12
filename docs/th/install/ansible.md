---
read_when:
    - คุณต้องการปรับใช้เซิร์ฟเวอร์โดยอัตโนมัติพร้อมเสริมความปลอดภัยให้แข็งแกร่ง
    - คุณต้องตั้งค่าการแยกด้วยไฟร์วอลล์พร้อมการเข้าถึงผ่าน VPN
    - คุณกำลังปรับใช้บนเซิร์ฟเวอร์ Debian/Ubuntu ระยะไกล
summary: การติดตั้ง OpenClaw แบบอัตโนมัติและเสริมความปลอดภัยด้วย Ansible, VPN ของ Tailscale และการแยกด้วยไฟร์วอลล์
title: Ansible
x-i18n:
    generated_at: "2026-07-12T16:14:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d3626ab364169609f92f636cb6b86cb980dca2b235500e748296128765444ae
    source_path: install/ansible.md
    workflow: 16
---

ปรับใช้ OpenClaw บนเซิร์ฟเวอร์ที่ใช้งานจริงด้วย **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** ซึ่งเป็นโปรแกรมติดตั้งอัตโนมัติที่ใช้สถาปัตยกรรมซึ่งให้ความสำคัญกับความปลอดภัยเป็นอันดับแรก

<Info>
รีโพ [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) เป็นแหล่งข้อมูลหลักสำหรับการปรับใช้ด้วย Ansible หน้านี้เป็นภาพรวมโดยย่อ
</Info>

## ข้อกำหนดเบื้องต้น

| ข้อกำหนด | รายละเอียด                                                   |
| ----------- | --------------------------------------------------------- |
| ระบบปฏิบัติการ          | Debian 11+ หรือ Ubuntu 20.04+                               |
| สิทธิ์การเข้าถึง      | สิทธิ์ root หรือ sudo                                   |
| เครือข่าย     | การเชื่อมต่ออินเทอร์เน็ตสำหรับติดตั้งแพ็กเกจ              |
| Ansible     | 2.14+ (สคริปต์เริ่มต้นอย่างรวดเร็วจะติดตั้งให้โดยอัตโนมัติ) |

## สิ่งที่คุณจะได้รับ

- การรักษาความปลอดภัยที่ให้ไฟร์วอลล์เป็นด่านแรก: UFW + การแยก Docker (เข้าถึงได้เฉพาะ SSH + Tailscale)
- VPN ของ Tailscale สำหรับการเข้าถึงจากระยะไกลโดยไม่เปิดเผยบริการต่อสาธารณะ
- Docker สำหรับคอนเทนเนอร์แซนด์บ็อกซ์แบบแยกส่วนที่ผูกอยู่กับ localhost เท่านั้น
- การผสานรวมกับ systemd พร้อมการเพิ่มความแข็งแกร่งด้านความปลอดภัยและการเริ่มต้นอัตโนมัติเมื่อบูต
- การตั้งค่าด้วยคำสั่งเดียว

## เริ่มต้นอย่างรวดเร็ว

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## สิ่งที่จะได้รับการติดตั้ง

1. Tailscale (VPN แบบเมชสำหรับการเข้าถึงจากระยะไกลอย่างปลอดภัย)
2. ไฟร์วอลล์ UFW (เฉพาะพอร์ต SSH + Tailscale)
3. Docker CE + Compose V2 (แบ็กเอนด์แซนด์บ็อกซ์เริ่มต้นของเอเจนต์)
4. Node.js และ pnpm (OpenClaw ต้องใช้ Node 22.19+ หรือ 23.11+; แนะนำ Node 24)
5. OpenClaw ซึ่งติดตั้งบนโฮสต์โดยตรง ไม่ได้อยู่ในคอนเทนเนอร์
6. บริการ systemd พร้อมการเพิ่มความแข็งแกร่งด้านความปลอดภัย

<Note>
Gateway ทำงานโดยตรงบนโฮสต์ ไม่ได้ทำงานใน Docker การใช้แซนด์บ็อกซ์สำหรับเอเจนต์เป็น
ทางเลือก Playbook นี้ติดตั้ง Docker เนื่องจากเป็นแบ็กเอนด์แซนด์บ็อกซ์
เริ่มต้น โปรดดูแบ็กเอนด์อื่นที่ [การใช้แซนด์บ็อกซ์](/th/gateway/sandboxing)
</Note>

## การตั้งค่าหลังการติดตั้ง

<Steps>
  <Step title="สลับไปใช้ผู้ใช้ openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="เรียกใช้ตัวช่วยเริ่มต้นใช้งาน">
    สคริปต์หลังการติดตั้งจะแนะนำคุณตลอดขั้นตอนการกำหนดค่า OpenClaw
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
    เข้าร่วมเมช VPN ของคุณเพื่อการเข้าถึงจากระยะไกลอย่างปลอดภัย
  </Step>
</Steps>

### คำสั่งด่วน

```bash
# ตรวจสอบสถานะบริการ
sudo systemctl status openclaw

# ดูบันทึกแบบสด
sudo journalctl -u openclaw -f

# เริ่ม Gateway ใหม่
sudo systemctl restart openclaw

# เข้าสู่ระบบช่องทาง (เรียกใช้ในฐานะผู้ใช้ openclaw)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## สถาปัตยกรรมความปลอดภัย

รูปแบบการป้องกันสี่ชั้น:

1. ไฟร์วอลล์ (UFW): เปิดเผยต่อสาธารณะเฉพาะ SSH (22) และ Tailscale (41641/udp)
2. VPN (Tailscale): เข้าถึง Gateway ได้ผ่านเมช VPN เท่านั้น
3. การแยก Docker: เชน iptables `DOCKER-USER` ป้องกันการเปิดเผยพอร์ตภายนอก
4. การเพิ่มความแข็งแกร่งให้ systemd: `NoNewPrivileges`, `PrivateTmp`, ผู้ใช้ที่ไม่มีสิทธิ์พิเศษ

ตรวจสอบพื้นผิวการโจมตีจากภายนอกของคุณ:

```bash
nmap -p- YOUR_SERVER_IP
```

ควรเปิดเฉพาะพอร์ต 22 (SSH) เท่านั้น Gateway และ Docker จะยังคงถูกจำกัดการเข้าถึง

Docker ได้รับการติดตั้งสำหรับแซนด์บ็อกซ์ของเอเจนต์ (การเรียกใช้เครื่องมือแบบแยกส่วน) ไม่ใช่สำหรับการเรียกใช้ Gateway โปรดดูการกำหนดค่าแซนด์บ็อกซ์ที่ [แซนด์บ็อกซ์และเครื่องมือแบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)

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
  <Step title="เรียกใช้ Playbook">
    ```bash
    ./run-playbook.sh
    ```

    หรือเรียกใช้ Playbook โดยตรง แล้วเรียกใช้สคริปต์ตั้งค่าด้วยตนเอง:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # จากนั้นเรียกใช้: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## การอัปเดต

โปรแกรมติดตั้ง Ansible ตั้งค่า OpenClaw ให้รองรับการอัปเดตด้วยตนเอง โปรดดูขั้นตอนมาตรฐานที่ [การอัปเดต](/th/install/updating)

หากต้องการเรียกใช้ Playbook อีกครั้ง (เช่น หลังจากเปลี่ยนแปลงการกำหนดค่า):

```bash
cd openclaw-ansible
./run-playbook.sh
```

กระบวนการนี้มีคุณสมบัติ idempotent และสามารถเรียกใช้ซ้ำได้อย่างปลอดภัย

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไฟร์วอลล์บล็อกการเชื่อมต่อของฉัน">
    - เชื่อมต่อผ่าน VPN ของ Tailscale ก่อน เนื่องจาก Gateway ได้รับการออกแบบให้เข้าถึงได้ด้วยวิธีนี้เท่านั้น
    - อนุญาต SSH (พอร์ต 22) เสมอ

  </Accordion>
  <Accordion title="บริการไม่เริ่มทำงาน">
    ```bash
    # ตรวจสอบบันทึก
    sudo journalctl -u openclaw -n 100

    # ตรวจสอบสิทธิ์
    sudo ls -la /opt/openclaw

    # ทดสอบการเริ่มต้นด้วยตนเอง
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="ปัญหาแซนด์บ็อกซ์ Docker">
    ```bash
    # ตรวจสอบว่า Docker กำลังทำงาน
    sudo systemctl status docker

    # ตรวจสอบอิมเมจแซนด์บ็อกซ์
    sudo docker images | grep openclaw-sandbox

    # สร้างอิมเมจแซนด์บ็อกซ์หากไม่มี (ต้องมีการเช็กเอาต์ซอร์สโค้ด)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # สำหรับการติดตั้งด้วย npm โดยไม่มีการเช็กเอาต์ซอร์สโค้ด โปรดดู
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="การเข้าสู่ระบบช่องทางล้มเหลว">
    ตรวจสอบให้แน่ใจว่าคุณกำลังเรียกใช้ในฐานะผู้ใช้ `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## การกำหนดค่าขั้นสูง

สำหรับรายละเอียดเกี่ยวกับสถาปัตยกรรมความปลอดภัยและการแก้ไขปัญหา โปรดดูรีโพ openclaw-ansible:

- [สถาปัตยกรรมความปลอดภัย](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [รายละเอียดทางเทคนิค](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [คู่มือการแก้ไขปัญหา](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## เนื้อหาที่เกี่ยวข้อง

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): คู่มือการปรับใช้งานฉบับเต็ม
- [Docker](/th/install/docker): การตั้งค่า Gateway แบบคอนเทนเนอร์
- [การใช้แซนด์บ็อกซ์](/th/gateway/sandboxing): การกำหนดค่าแซนด์บ็อกซ์ของเอเจนต์
- [แซนด์บ็อกซ์และเครื่องมือแบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools): การแยกส่วนสำหรับแต่ละเอเจนต์
