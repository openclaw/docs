---
read_when:
    - คุณต้องการแยก OpenClaw ออกจากสภาพแวดล้อม macOS หลักของคุณ
    - คุณต้องการการผสานรวม iMessage (BlueBubbles) ในแซนด์บ็อกซ์
    - คุณต้องการสภาพแวดล้อม macOS ที่รีเซ็ตได้ซึ่งคุณสามารถโคลนได้
    - คุณต้องการเปรียบเทียบตัวเลือก VM macOS แบบโลคัลกับแบบโฮสต์
summary: เรียกใช้ OpenClaw ใน macOS VM แบบแซนด์บ็อกซ์ (ภายในเครื่องหรือแบบโฮสต์) เมื่อคุณต้องการการแยกสภาพแวดล้อมหรือ iMessage
title: เครื่องเสมือน macOS
x-i18n:
    generated_at: "2026-04-30T10:01:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49cd3d420db02bcdb80378c3a91a1c1243e7be2012525c31de1dd49db397d560
    source_path: install/macos-vm.md
    workflow: 16
---

# OpenClaw บน macOS VM (การแซนด์บ็อกซ์)

## ค่าเริ่มต้นที่แนะนำ (ผู้ใช้ส่วนใหญ่)

- **Linux VPS ขนาดเล็ก** สำหรับ Gateway ที่เปิดตลอดเวลาและมีค่าใช้จ่ายต่ำ ดู [การโฮสต์ VPS](/th/vps)
- **ฮาร์ดแวร์เฉพาะ** (Mac mini หรือเครื่อง Linux) หากคุณต้องการควบคุมเต็มรูปแบบและมี **IP ที่พักอาศัย** สำหรับระบบอัตโนมัติบนเบราว์เซอร์ หลายเว็บไซต์บล็อก IP ของศูนย์ข้อมูล ดังนั้นการเรียกดูจากเครื่องภายในมักทำงานได้ดีกว่า
- **แบบไฮบริด:** เก็บ Gateway ไว้บน VPS ราคาถูก แล้วเชื่อมต่อ Mac ของคุณเป็น **Node** เมื่อต้องใช้ระบบอัตโนมัติบนเบราว์เซอร์/UI ดู [Nodes](/th/nodes) และ [Gateway ระยะไกล](/th/gateway/remote)

ใช้ macOS VM เมื่อคุณต้องการความสามารถเฉพาะของ macOS โดยเฉพาะ (iMessage/BlueBubbles) หรือต้องการแยกสภาพแวดล้อมออกจาก Mac ที่ใช้ประจำวันอย่างเข้มงวด

## ตัวเลือก macOS VM

### VM ภายในเครื่องบน Apple Silicon Mac ของคุณ (Lume)

เรียกใช้ OpenClaw ใน macOS VM แบบแซนด์บ็อกซ์บน Apple Silicon Mac ที่คุณมีอยู่โดยใช้ [Lume](https://cua.ai/docs/lume)

สิ่งนี้ให้คุณ:

- สภาพแวดล้อม macOS เต็มรูปแบบที่แยกออกมา (โฮสต์ของคุณยังคงสะอาด)
- รองรับ iMessage ผ่าน BlueBubbles (ทำไม่ได้บน Linux/Windows)
- รีเซ็ตได้ทันทีโดยการโคลน VM
- ไม่ต้องใช้ฮาร์ดแวร์เพิ่มเติมหรือมีค่าใช้จ่ายคลาวด์

### ผู้ให้บริการ Mac แบบโฮสต์ (คลาวด์)

หากคุณต้องการ macOS ในคลาวด์ ผู้ให้บริการ Mac แบบโฮสต์ก็ใช้ได้เช่นกัน:

- [MacStadium](https://www.macstadium.com/) (Mac แบบโฮสต์)
- ผู้ให้บริการ Mac แบบโฮสต์รายอื่นก็ใช้ได้เช่นกัน ให้ทำตามเอกสาร VM + SSH ของผู้ให้บริการนั้น

เมื่อคุณเข้าถึง macOS VM ผ่าน SSH ได้แล้ว ให้ไปต่อที่ขั้นตอน 6 ด้านล่าง

---

## เส้นทางลัด (Lume, ผู้ใช้ที่มีประสบการณ์)

1. ติดตั้ง Lume
2. `lume create openclaw --os macos --ipsw latest`
3. ทำ Setup Assistant ให้เสร็จ เปิดใช้งาน Remote Login (SSH)
4. `lume run openclaw --no-display`
5. SSH เข้าไป ติดตั้ง OpenClaw และกำหนดค่าช่องทาง
6. เสร็จสิ้น

---

## สิ่งที่คุณต้องมี (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia หรือใหม่กว่าบนโฮสต์
- พื้นที่ดิสก์ว่างประมาณ 60 GB ต่อ VM
- ประมาณ 20 นาที

---

## 1) ติดตั้ง Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

หาก `~/.local/bin` ไม่อยู่ใน PATH ของคุณ:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

ตรวจสอบ:

```bash
lume --version
```

เอกสาร: [การติดตั้ง Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) สร้าง macOS VM

```bash
lume create openclaw --os macos --ipsw latest
```

คำสั่งนี้จะดาวน์โหลด macOS และสร้าง VM หน้าต่าง VNC จะเปิดขึ้นโดยอัตโนมัติ

<Note>
การดาวน์โหลดอาจใช้เวลาสักพักขึ้นอยู่กับการเชื่อมต่อของคุณ
</Note>

---

## 3) ทำ Setup Assistant ให้เสร็จ

ในหน้าต่าง VNC:

1. เลือกภาษาและภูมิภาค
2. ข้าม Apple ID (หรือลงชื่อเข้าใช้หากต้องการใช้ iMessage ในภายหลัง)
3. สร้างบัญชีผู้ใช้ (จำชื่อผู้ใช้และรหัสผ่านไว้)
4. ข้ามฟีเจอร์เสริมทั้งหมด

หลังจากตั้งค่าเสร็จแล้ว ให้เปิดใช้งาน SSH:

1. เปิด System Settings → General → Sharing
2. เปิดใช้งาน "Remote Login"

---

## 4) รับที่อยู่ IP ของ VM

```bash
lume get openclaw
```

มองหาที่อยู่ IP (โดยปกติคือ `192.168.64.x`)

---

## 5) SSH เข้า VM

```bash
ssh youruser@192.168.64.X
```

แทนที่ `youruser` ด้วยบัญชีที่คุณสร้าง และแทนที่ IP ด้วย IP ของ VM ของคุณ

---

## 6) ติดตั้ง OpenClaw

ภายใน VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

ทำตามพรอมต์การเริ่มต้นใช้งานเพื่อตั้งค่าผู้ให้บริการโมเดลของคุณ (Anthropic, OpenAI เป็นต้น)

---

## 7) กำหนดค่าช่องทาง

แก้ไขไฟล์กำหนดค่า:

```bash
nano ~/.openclaw/openclaw.json
```

เพิ่มช่องทางของคุณ:

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

จากนั้นเข้าสู่ระบบ WhatsApp (สแกน QR):

```bash
openclaw channels login
```

---

## 8) เรียกใช้ VM แบบไม่มีหน้าจอ

หยุด VM แล้วเริ่มใหม่โดยไม่มีจอแสดงผล:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM จะทำงานอยู่เบื้องหลัง daemon ของ OpenClaw จะคอยให้ Gateway ทำงานต่อไป

เพื่อตรวจสอบสถานะ:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## เพิ่มเติม: การผสานรวม iMessage

นี่คือฟีเจอร์เด่นของการเรียกใช้บน macOS ใช้ [BlueBubbles](https://bluebubbles.app) เพื่อเพิ่ม iMessage ให้กับ OpenClaw

ภายใน VM:

1. ดาวน์โหลด BlueBubbles จาก bluebubbles.app
2. ลงชื่อเข้าใช้ด้วย Apple ID ของคุณ
3. เปิดใช้งาน Web API และตั้งรหัสผ่าน
4. ชี้ BlueBubbles webhooks ไปที่ gateway ของคุณ (ตัวอย่าง: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

เพิ่มลงในค่ากำหนด OpenClaw ของคุณ:

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

รีสตาร์ท Gateway ตอนนี้เอเจนต์ของคุณสามารถส่งและรับ iMessages ได้แล้ว

รายละเอียดการตั้งค่าแบบเต็ม: [ช่องทาง BlueBubbles](/th/channels/bluebubbles)

---

## บันทึกอิมเมจต้นแบบ

ก่อนปรับแต่งเพิ่มเติม ให้ snapshot สถานะสะอาดของคุณ:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

รีเซ็ตได้ทุกเมื่อ:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## เรียกใช้ตลอด 24/7

ให้ VM ทำงานต่อไปโดย:

- เสียบปลั๊ก Mac ของคุณไว้
- ปิดโหมดพักเครื่องใน System Settings → Energy Saver
- ใช้ `caffeinate` หากจำเป็น

สำหรับการเปิดตลอดเวลาอย่างแท้จริง ให้พิจารณา Mac mini เฉพาะเครื่องหรือ VPS ขนาดเล็ก ดู [การโฮสต์ VPS](/th/vps)

---

## การแก้ไขปัญหา

| ปัญหา                  | วิธีแก้ไข                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| SSH เข้า VM ไม่ได้        | ตรวจสอบว่าเปิดใช้งาน "Remote Login" ใน System Settings ของ VM แล้ว                            |
| IP ของ VM ไม่แสดง        | รอให้ VM บูตเสร็จสมบูรณ์ แล้วเรียกใช้ `lume get openclaw` อีกครั้ง                           |
| ไม่พบคำสั่ง Lume   | เพิ่ม `~/.local/bin` ลงใน PATH ของคุณ                                                    |
| สแกน QR ของ WhatsApp ไม่ได้ | ตรวจสอบว่าคุณเข้าสู่ระบบใน VM (ไม่ใช่โฮสต์) เมื่อเรียกใช้ `openclaw channels login` |

---

## เอกสารที่เกี่ยวข้อง

- [การโฮสต์ VPS](/th/vps)
- [Nodes](/th/nodes)
- [Gateway ระยะไกล](/th/gateway/remote)
- [ช่องทาง BlueBubbles](/th/channels/bluebubbles)
- [เริ่มต้นใช้งาน Lume อย่างรวดเร็ว](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [ข้อมูลอ้างอิง Lume CLI](https://cua.ai/docs/lume/reference/cli-reference)
- [การตั้งค่า VM แบบไม่ต้องดูแล](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (ขั้นสูง)
- [การแซนด์บ็อกซ์ด้วย Docker](/th/install/docker) (แนวทางแยกสภาพแวดล้อมทางเลือก)
