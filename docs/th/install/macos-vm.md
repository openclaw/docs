---
read_when:
    - คุณต้องการแยก OpenClaw ออกจากสภาพแวดล้อม macOS หลักของคุณ
    - คุณต้องการผสานการทำงานกับ iMessage ในแซนด์บ็อกซ์
    - คุณต้องการสภาพแวดล้อม macOS ที่รีเซ็ตได้และโคลนได้
    - คุณต้องการเปรียบเทียบตัวเลือก macOS VM แบบภายในเครื่องกับแบบที่โฮสต์ให้บริการ
summary: เรียกใช้ OpenClaw ใน VM macOS แบบแซนด์บ็อกซ์ (ในเครื่องหรือแบบโฮสต์) เมื่อคุณต้องการการแยกสภาพแวดล้อมหรือ iMessage
title: เครื่องเสมือน macOS
x-i18n:
    generated_at: "2026-05-10T19:44:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3502ccaee51261573764440f9e782d2512e9da0332bd15eef3a5c4a83b0c2936
    source_path: install/macos-vm.md
    workflow: 16
---

## ค่าเริ่มต้นที่แนะนำ (ผู้ใช้ส่วนใหญ่)

- **Linux VPS ขนาดเล็ก** สำหรับ Gateway ที่เปิดใช้งานตลอดเวลาและมีต้นทุนต่ำ ดู [VPS hosting](/th/vps)
- **ฮาร์ดแวร์เฉพาะ** (Mac mini หรือเครื่อง Linux) หากคุณต้องการควบคุมได้เต็มที่และมี **IP สำหรับที่อยู่อาศัย** สำหรับการทำงานอัตโนมัติบนเบราว์เซอร์ หลายเว็บไซต์บล็อก IP ของศูนย์ข้อมูล ดังนั้นการท่องเว็บจากเครื่องในบ้านมักทำงานได้ดีกว่า
- **แบบไฮบริด:** เก็บ Gateway ไว้บน VPS ราคาถูก และเชื่อมต่อ Mac ของคุณเป็น **Node** เมื่อคุณต้องการการทำงานอัตโนมัติผ่านเบราว์เซอร์/UI ดู [Nodes](/th/nodes) และ [Gateway remote](/th/gateway/remote)

ใช้ macOS VM เมื่อคุณต้องการความสามารถเฉพาะของ macOS โดยเฉพาะ เช่น iMessage หรือต้องการแยกสภาพแวดล้อมออกจาก Mac ที่ใช้ประจำอย่างเข้มงวด

## ตัวเลือก macOS VM

### VM ภายในเครื่องบน Apple Silicon Mac ของคุณ (Lume)

เรียกใช้ OpenClaw ใน macOS VM แบบ sandbox บน Apple Silicon Mac ที่คุณมีอยู่โดยใช้ [Lume](https://cua.ai/docs/lume)

สิ่งนี้ให้คุณ:

- สภาพแวดล้อม macOS เต็มรูปแบบที่แยกออกมา (โฮสต์ของคุณยังคงสะอาด)
- รองรับ iMessage ผ่าน `imsg` (พาธภายในเครื่องเริ่มต้นเป็นไปไม่ได้บน Linux/Windows)
- รีเซ็ตได้ทันทีด้วยการโคลน VM
- ไม่ต้องใช้ฮาร์ดแวร์เพิ่มเติมหรือมีค่าใช้จ่ายคลาวด์

### ผู้ให้บริการ Mac แบบโฮสต์ (คลาวด์)

หากคุณต้องการ macOS ในคลาวด์ ผู้ให้บริการ Mac แบบโฮสต์ก็ใช้งานได้เช่นกัน:

- [MacStadium](https://www.macstadium.com/) (Mac แบบโฮสต์)
- ผู้ให้บริการ Mac แบบโฮสต์รายอื่นก็ใช้งานได้เช่นกัน ให้ทำตามเอกสาร VM + SSH ของพวกเขา

เมื่อคุณมีสิทธิ์เข้าถึง SSH ไปยัง macOS VM แล้ว ให้ดำเนินต่อที่ขั้นตอน 6 ด้านล่าง

---

## เส้นทางด่วน (Lume, ผู้ใช้ที่มีประสบการณ์)

1. ติดตั้ง Lume
2. `lume create openclaw --os macos --ipsw latest`
3. ทำ Setup Assistant ให้เสร็จ เปิดใช้ Remote Login (SSH)
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
การดาวน์โหลดอาจใช้เวลาสักพัก ขึ้นอยู่กับการเชื่อมต่อของคุณ
</Note>

---

## 3) ทำ Setup Assistant ให้เสร็จ

ในหน้าต่าง VNC:

1. เลือกภาษาและภูมิภาค
2. ข้าม Apple ID (หรือเข้าสู่ระบบหากคุณต้องการใช้ iMessage ในภายหลัง)
3. สร้างบัญชีผู้ใช้ (จำชื่อผู้ใช้และรหัสผ่านไว้)
4. ข้ามฟีเจอร์เสริมทั้งหมด

หลังจากตั้งค่าเสร็จแล้ว ให้เปิดใช้ SSH:

1. เปิด System Settings → General → Sharing
2. เปิดใช้ "Remote Login"

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

ทำตามพรอมป์การเริ่มต้นใช้งานเพื่อตั้งค่าผู้ให้บริการโมเดลของคุณ (Anthropic, OpenAI ฯลฯ)

---

## 7) กำหนดค่าช่องทาง

แก้ไขไฟล์การกำหนดค่า:

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

นี่คือฟีเจอร์เด่นของการรันบน macOS ใช้ [iMessage](/th/channels/imessage) กับ `imsg` เพื่อเพิ่ม Messages เข้าใน OpenClaw

ภายใน VM:

1. เข้าสู่ระบบ Messages
2. ติดตั้ง `imsg`
3. ให้สิทธิ์ Full Disk Access และ Automation สำหรับโปรเซสที่รัน OpenClaw/`imsg`
4. ตรวจสอบการรองรับ RPC ด้วย `imsg rpc --help`

เพิ่มลงในการกำหนดค่า OpenClaw ของคุณ:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
    },
  },
}
```

รีสตาร์ท Gateway ตอนนี้เอเจนต์ของคุณสามารถส่งและรับ iMessage ได้แล้ว

รายละเอียดการตั้งค่าแบบเต็ม: [ช่องทาง iMessage](/th/channels/imessage)

---

## บันทึกอิมเมจต้นแบบ

ก่อนปรับแต่งเพิ่มเติม ให้สร้าง snapshot ของสถานะสะอาดของคุณ:

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

## การรันตลอด 24/7

ทำให้ VM ทำงานต่อเนื่องโดย:

- เสียบปลั๊ก Mac ของคุณไว้
- ปิดโหมดพักเครื่องใน System Settings → Energy Saver
- ใช้ `caffeinate` หากจำเป็น

สำหรับการเปิดใช้งานตลอดเวลาอย่างแท้จริง ให้พิจารณา Mac mini เฉพาะหรือ VPS ขนาดเล็ก ดู [VPS hosting](/th/vps)

---

## การแก้ไขปัญหา

| ปัญหา                  | วิธีแก้ไข                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| ไม่สามารถ SSH เข้า VM ได้        | ตรวจสอบว่าเปิดใช้ "Remote Login" ใน System Settings ของ VM แล้ว                            |
| IP ของ VM ไม่แสดง        | รอให้ VM บูตจนเสร็จสมบูรณ์ แล้วรัน `lume get openclaw` อีกครั้ง                           |
| ไม่พบคำสั่ง Lume   | เพิ่ม `~/.local/bin` ลงใน PATH ของคุณ                                                    |
| สแกน QR ของ WhatsApp ไม่ได้ | ตรวจสอบว่าคุณเข้าสู่ระบบใน VM (ไม่ใช่โฮสต์) เมื่อรัน `openclaw channels login` |

---

## เอกสารที่เกี่ยวข้อง

- [VPS hosting](/th/vps)
- [Nodes](/th/nodes)
- [Gateway remote](/th/gateway/remote)
- [ช่องทาง iMessage](/th/channels/imessage)
- [เริ่มต้นใช้งาน Lume อย่างรวดเร็ว](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [ข้อมูลอ้างอิง Lume CLI](https://cua.ai/docs/lume/reference/cli-reference)
- [การตั้งค่า VM แบบไม่ต้องเฝ้าดู](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (ขั้นสูง)
- [Docker Sandboxing](/th/install/docker) (แนวทางการแยกสภาพแวดล้อมทางเลือก)
