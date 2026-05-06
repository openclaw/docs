---
read_when:
    - คุณต้องการแยก OpenClaw ออกจากสภาพแวดล้อม macOS หลักของคุณ
    - คุณต้องการการผสานการทำงานกับ iMessage (BlueBubbles) ในแซนด์บ็อกซ์
    - คุณต้องการสภาพแวดล้อม macOS ที่รีเซ็ตได้และสามารถโคลนได้
    - คุณต้องการเปรียบเทียบตัวเลือก VM macOS แบบภายในเครื่องกับแบบโฮสต์
summary: เรียกใช้ OpenClaw ในเครื่องเสมือน macOS แบบแซนด์บ็อกซ์ (ในเครื่องหรือแบบโฮสต์) เมื่อคุณต้องการการแยกสภาพแวดล้อมหรือ iMessage
title: เครื่องเสมือน macOS
x-i18n:
    generated_at: "2026-05-06T09:20:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2b6841f66e63606346f364bb1b1b9ca4a3d52558e3d8c6f129c5b89387c6968
    source_path: install/macos-vm.md
    workflow: 16
---

## ค่าเริ่มต้นที่แนะนำ (ผู้ใช้ส่วนใหญ่)

- **VPS Linux ขนาดเล็ก** สำหรับ Gateway ที่เปิดตลอดเวลาและมีต้นทุนต่ำ ดู [การโฮสต์ VPS](/th/vps)
- **ฮาร์ดแวร์เฉพาะ** (Mac mini หรือเครื่อง Linux) หากคุณต้องการควบคุมได้เต็มที่และใช้ **IP ที่พักอาศัย** สำหรับการทำ browser automation เว็บไซต์จำนวนมากบล็อก IP ของศูนย์ข้อมูล ดังนั้นการท่องเว็บภายในเครื่องมักทำงานได้ดีกว่า
- **แบบไฮบริด:** เก็บ Gateway ไว้บน VPS ราคาถูก แล้วเชื่อมต่อ Mac ของคุณเป็น **Node** เมื่อคุณต้องการ browser/UI automation ดู [Node](/th/nodes) และ [Gateway ระยะไกล](/th/gateway/remote)

ใช้ macOS VM เมื่อคุณต้องการความสามารถเฉพาะของ macOS (iMessage/BlueBubbles) หรืออยากแยกสภาพแวดล้อมออกจาก Mac ที่ใช้ประจำอย่างเข้มงวด

## ตัวเลือก macOS VM

### VM ภายในเครื่องบน Apple Silicon Mac ของคุณ (Lume)

เรียกใช้ OpenClaw ใน macOS VM แบบแซนด์บ็อกซ์บน Apple Silicon Mac ที่คุณมีอยู่โดยใช้ [Lume](https://cua.ai/docs/lume)

สิ่งนี้ให้คุณ:

- สภาพแวดล้อม macOS เต็มรูปแบบแบบแยกส่วน (โฮสต์ของคุณยังคงสะอาด)
- รองรับ iMessage ผ่าน BlueBubbles (ทำไม่ได้บน Linux/Windows)
- รีเซ็ตได้ทันทีด้วยการโคลน VM
- ไม่มีค่าใช้จ่ายฮาร์ดแวร์หรือคลาวด์เพิ่มเติม

### ผู้ให้บริการ Mac แบบโฮสต์ (คลาวด์)

หากคุณต้องการ macOS ในคลาวด์ ผู้ให้บริการ Mac แบบโฮสต์ก็ใช้ได้เช่นกัน:

- [MacStadium](https://www.macstadium.com/) (Mac แบบโฮสต์)
- ผู้ให้บริการ Mac แบบโฮสต์รายอื่นก็ใช้ได้เช่นกัน ให้ทำตามเอกสาร VM + SSH ของพวกเขา

เมื่อคุณมีสิทธิ์เข้าถึง macOS VM ผ่าน SSH แล้ว ให้ทำต่อที่ขั้นตอนที่ 6 ด้านล่าง

---

## เส้นทางด่วน (Lume, ผู้ใช้ที่มีประสบการณ์)

1. ติดตั้ง Lume
2. `lume create openclaw --os macos --ipsw latest`
3. ทำ Setup Assistant ให้เสร็จ เปิดใช้งาน Remote Login (SSH)
4. `lume run openclaw --no-display`
5. SSH เข้าไป ติดตั้ง OpenClaw กำหนดค่าช่องทาง
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

หาก `~/.local/bin` ไม่ได้อยู่ใน PATH ของคุณ:

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

คำสั่งนี้จะดาวน์โหลด macOS และสร้าง VM หน้าต่าง VNC จะเปิดโดยอัตโนมัติ

<Note>
การดาวน์โหลดอาจใช้เวลาสักพัก ขึ้นอยู่กับการเชื่อมต่อของคุณ
</Note>

---

## 3) ทำ Setup Assistant ให้เสร็จ

ในหน้าต่าง VNC:

1. เลือกภาษาและภูมิภาค
2. ข้าม Apple ID (หรือเข้าสู่ระบบหากคุณต้องการใช้ iMessage ภายหลัง)
3. สร้างบัญชีผู้ใช้ (จำชื่อผู้ใช้และรหัสผ่านไว้)
4. ข้ามฟีเจอร์เสริมทั้งหมด

หลังจากตั้งค่าเสร็จ ให้เปิดใช้งาน SSH:

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

ทำตามพรอมต์การเริ่มใช้งานเพื่อตั้งค่าผู้ให้บริการโมเดลของคุณ (Anthropic, OpenAI ฯลฯ)

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

VM จะทำงานในพื้นหลัง daemon ของ OpenClaw จะคอยให้ gateway ทำงานอยู่

เพื่อตรวจสอบสถานะ:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## โบนัส: การผสานรวม iMessage

นี่คือฟีเจอร์เด่นของการรันบน macOS ใช้ [BlueBubbles](https://bluebubbles.app) เพื่อเพิ่ม iMessage ให้กับ OpenClaw

ภายใน VM:

1. ดาวน์โหลด BlueBubbles จาก bluebubbles.app
2. เข้าสู่ระบบด้วย Apple ID ของคุณ
3. เปิดใช้งาน Web API และตั้งรหัสผ่าน
4. ชี้ Webhook ของ BlueBubbles ไปยัง gateway ของคุณ (ตัวอย่าง: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

เพิ่มลงในการกำหนดค่า OpenClaw ของคุณ:

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

รีสตาร์ต gateway ตอนนี้ agent ของคุณสามารถส่งและรับ iMessages ได้แล้ว

รายละเอียดการตั้งค่าฉบับเต็ม: [ช่องทาง BlueBubbles](/th/channels/bluebubbles)

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

## การรัน 24/7

ให้ VM ทำงานต่อเนื่องโดย:

- เสียบปลั๊ก Mac ของคุณไว้
- ปิด sleep ใน System Settings → Energy Saver
- ใช้ `caffeinate` หากจำเป็น

สำหรับการเปิดตลอดเวลาอย่างแท้จริง ให้พิจารณา Mac mini เฉพาะหรือ VPS ขนาดเล็ก ดู [การโฮสต์ VPS](/th/vps)

---

## การแก้ไขปัญหา

| ปัญหา                  | วิธีแก้ไข                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| SSH เข้า VM ไม่ได้        | ตรวจสอบว่าเปิดใช้งาน "Remote Login" ใน System Settings ของ VM แล้ว                            |
| IP ของ VM ไม่แสดง        | รอให้ VM บูตเสร็จสมบูรณ์ แล้วรัน `lume get openclaw` อีกครั้ง                           |
| ไม่พบคำสั่ง Lume   | เพิ่ม `~/.local/bin` ลงใน PATH ของคุณ                                                    |
| WhatsApp QR สแกนไม่ได้ | ตรวจสอบว่าคุณเข้าสู่ระบบใน VM (ไม่ใช่โฮสต์) เมื่อรัน `openclaw channels login` |

---

## เอกสารที่เกี่ยวข้อง

- [การโฮสต์ VPS](/th/vps)
- [Node](/th/nodes)
- [Gateway ระยะไกล](/th/gateway/remote)
- [ช่องทาง BlueBubbles](/th/channels/bluebubbles)
- [คู่มือเริ่มต้นใช้งาน Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [ข้อมูลอ้างอิง Lume CLI](https://cua.ai/docs/lume/reference/cli-reference)
- [การตั้งค่า VM แบบไม่ต้องเฝ้าดู](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (ขั้นสูง)
- [การแซนด์บ็อกซ์ด้วย Docker](/th/install/docker) (แนวทางแยกสภาพแวดล้อมอีกแบบ)
