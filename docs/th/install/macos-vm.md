---
read_when:
    - คุณต้องการแยก OpenClaw ออกจากสภาพแวดล้อม macOS หลักของคุณ
    - คุณต้องการผสานการทำงานกับ iMessage ในแซนด์บ็อกซ์
    - คุณต้องการสภาพแวดล้อม macOS ที่รีเซ็ตและโคลนได้
    - คุณต้องการเปรียบเทียบตัวเลือก VM สำหรับ macOS แบบภายในเครื่องกับแบบโฮสต์ไว้ภายนอก
summary: เรียกใช้ OpenClaw ใน VM macOS แบบแซนด์บ็อกซ์ (ภายในเครื่องหรือแบบโฮสต์) เมื่อคุณต้องการการแยกสภาพแวดล้อมหรือ iMessage
title: VM ของ macOS
x-i18n:
    generated_at: "2026-07-12T16:18:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e6b963faaf40f65adce1081715bc295059b8bed278a8c71a05a86e04ad7a7a5
    source_path: install/macos-vm.md
    workflow: 16
---

## ค่าเริ่มต้นที่แนะนำ (สำหรับผู้ใช้ส่วนใหญ่)

- **VPS Linux ขนาดเล็ก** สำหรับ Gateway ที่ทำงานตลอดเวลาและมีค่าใช้จ่ายต่ำ ดู [การโฮสต์บน VPS](/th/vps)
- **ฮาร์ดแวร์เฉพาะ** (Mac mini หรือเครื่อง Linux) หากคุณต้องการควบคุมได้อย่างเต็มที่และมี **IP สำหรับที่พักอาศัย** สำหรับระบบอัตโนมัติของเบราว์เซอร์ เว็บไซต์จำนวนมากบล็อก IP ของศูนย์ข้อมูล ดังนั้นการเรียกดูจากเครื่องภายในจึงมักทำงานได้ดีกว่า
- **แบบไฮบริด**: ให้ Gateway ทำงานบน VPS ราคาประหยัด และเชื่อมต่อ Mac ของคุณเป็น **Node** เมื่อต้องการระบบอัตโนมัติของเบราว์เซอร์/UI ดู [Node](/th/nodes) และ [Gateway ระยะไกล](/th/gateway/remote)

ใช้ VM ของ macOS เฉพาะเมื่อคุณต้องการความสามารถที่มีเฉพาะใน macOS เช่น iMessage หรือต้องการแยกสภาพแวดล้อมออกจาก Mac ที่คุณใช้ประจำอย่างเคร่งครัด

## ตัวเลือก VM ของ macOS

### VM ภายในเครื่องบน Apple Silicon Mac ของคุณ (Lume)

เรียกใช้ OpenClaw ใน VM ของ macOS ที่แยกอยู่ในแซนด์บ็อกซ์บน Apple Silicon Mac ที่มีอยู่โดยใช้ [Lume](https://cua.ai/docs/lume) ซึ่งให้สิ่งต่อไปนี้:

- สภาพแวดล้อม macOS เต็มรูปแบบที่แยกออกจากกัน (เครื่องโฮสต์ของคุณยังคงสะอาด)
- รองรับ iMessage ผ่าน `imsg` ซึ่งเส้นทางภายในเครื่องที่เป็นค่าเริ่มต้นไม่สามารถใช้งานได้บน Linux/Windows
- รีเซ็ตได้ทันทีด้วยการโคลน VM
- ไม่ต้องมีฮาร์ดแวร์เพิ่มเติมหรือเสียค่าใช้จ่ายระบบคลาวด์

### ผู้ให้บริการ Mac แบบโฮสต์ (ระบบคลาวด์)

หากคุณต้องการ macOS บนระบบคลาวด์ ผู้ให้บริการ Mac แบบโฮสต์ก็ใช้งานได้เช่นกัน:

- [MacStadium](https://www.macstadium.com/) (Mac แบบโฮสต์)
- ผู้ให้บริการ Mac แบบโฮสต์รายอื่นก็ใช้งานได้เช่นกัน ให้ทำตามเอกสาร VM + SSH ของผู้ให้บริการนั้น

เมื่อคุณเข้าถึง VM ของ macOS ผ่าน SSH ได้แล้ว ให้ดำเนินการต่อที่ [ติดตั้ง OpenClaw](#6-install-openclaw) ด้านล่าง

## วิธีลัด (Lume สำหรับผู้ใช้ที่มีประสบการณ์)

1. ติดตั้ง Lume
2. `lume create openclaw --os macos --ipsw latest`
3. ดำเนินการ Setup Assistant ให้เสร็จสิ้น แล้วเปิดใช้งาน Remote Login (SSH)
4. `lume run openclaw --no-display`
5. เชื่อมต่อผ่าน SSH ติดตั้ง OpenClaw และกำหนดค่าช่องทาง
6. เสร็จสิ้น

## สิ่งที่จำเป็น (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia หรือใหม่กว่าบนเครื่องโฮสต์
- พื้นที่ว่างบนดิสก์ประมาณ 60 GB ต่อ VM
- เวลาประมาณ 20 นาที

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

## 2) สร้าง VM ของ macOS

```bash
lume create openclaw --os macos --ipsw latest
```

คำสั่งนี้จะดาวน์โหลด macOS และสร้าง VM หน้าต่าง VNC จะเปิดขึ้นโดยอัตโนมัติ

<Note>
การดาวน์โหลดอาจใช้เวลาสักครู่ โดยขึ้นอยู่กับการเชื่อมต่อของคุณ
</Note>

## 3) ดำเนินการ Setup Assistant ให้เสร็จสิ้น

ในหน้าต่าง VNC:

1. เลือกภาษาและภูมิภาค
2. ข้าม Apple ID (หรือลงชื่อเข้าใช้หากคุณต้องการใช้ iMessage ในภายหลัง)
3. สร้างบัญชีผู้ใช้ (จดจำชื่อผู้ใช้และรหัสผ่านไว้)
4. ข้ามคุณสมบัติเสริมทั้งหมด

หลังจากตั้งค่าเสร็จสิ้น:

1. เปิดใช้งาน SSH: System Settings -> General -> Sharing แล้วเปิดใช้งาน "Remote Login"
2. สำหรับการใช้ VM แบบไม่มีจอแสดงผล ให้เปิดใช้งานการเข้าสู่ระบบอัตโนมัติ: System Settings -> Users & Groups เลือก "Automatically log in as:" แล้วเลือกผู้ใช้ของ VM

## 4) รับที่อยู่ IP ของ VM

```bash
lume get openclaw
```

มองหาที่อยู่ IP (โดยทั่วไปคือ `192.168.64.x`)

## 5) เชื่อมต่อกับ VM ผ่าน SSH

```bash
ssh youruser@192.168.64.X
```

แทนที่ `youruser` ด้วยบัญชีที่คุณสร้าง และแทนที่ IP ด้วย IP ของ VM

## 6) ติดตั้ง OpenClaw

ภายใน VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

ทำตามข้อความแจ้งการเริ่มต้นใช้งานเพื่อตั้งค่าผู้ให้บริการโมเดลของคุณ (Anthropic, OpenAI เป็นต้น)

## 7) กำหนดค่าช่องทาง

แก้ไขไฟล์การกำหนดค่า:

```bash
nano ~/.openclaw/openclaw.json
```

เพิ่มช่องทางของคุณ:

```json5
{
  channels: {
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
  },
}
```

จากนั้นเข้าสู่ระบบ WhatsApp (สแกน QR):

```bash
openclaw channels login
```

## 8) เรียกใช้ VM แบบไม่มีจอแสดงผล

หยุด VM แล้วเริ่มต้นใหม่โดยไม่มีจอแสดงผล:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM จะทำงานอยู่เบื้องหลัง โดยดีมอนของ OpenClaw จะทำให้ Gateway ทำงานต่อไป หากต้องการตรวจสอบสถานะ:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

## เพิ่มเติม: การผสานการทำงานกับ iMessage

นี่คือคุณสมบัติเด่นของการทำงานบน macOS ใช้ [iMessage](/th/channels/imessage) ร่วมกับ `imsg` เพื่อเพิ่ม Messages ลงใน OpenClaw

ภายใน VM:

1. ลงชื่อเข้าใช้ Messages
2. ติดตั้ง `imsg`
3. ให้สิทธิ์ Full Disk Access และ Automation แก่กระบวนการที่เรียกใช้ OpenClaw/`imsg`
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

เริ่ม Gateway ใหม่ ขณะนี้เอเจนต์ของคุณสามารถส่งและรับ iMessage ได้แล้ว รายละเอียดการตั้งค่าฉบับเต็ม: [ช่องทาง iMessage](/th/channels/imessage)

## บันทึกอิมเมจต้นแบบ

ก่อนปรับแต่งเพิ่มเติม ให้สร้างสแนปช็อตของสถานะเริ่มต้นที่สะอาด:

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

## การทำงานตลอด 24 ชั่วโมงทุกวัน

ทำให้ VM ทำงานต่อเนื่องโดย:

- เสียบปลั๊ก Mac ของคุณไว้
- ปิดใช้งานโหมดพักเครื่องใน System Settings -> Energy Saver
- ใช้ `caffeinate` หากจำเป็น

สำหรับการทำงานตลอดเวลาอย่างแท้จริง ให้พิจารณาใช้ Mac mini โดยเฉพาะหรือ VPS ขนาดเล็ก ดู [การโฮสต์บน VPS](/th/vps)

## การแก้ไขปัญหา

| ปัญหา                       | วิธีแก้ไข                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| ไม่สามารถ SSH เข้า VM ได้   | ตรวจสอบว่าเปิดใช้งาน "Remote Login" ใน System Settings ของ VM แล้ว                              |
| IP ของ VM ไม่แสดง           | รอให้ VM บูตเสร็จสมบูรณ์ แล้วเรียกใช้ `lume get openclaw` อีกครั้ง                               |
| ไม่พบคำสั่ง Lume            | เพิ่ม `~/.local/bin` ลงใน PATH ของคุณ                                                            |
| สแกน QR ของ WhatsApp ไม่ได้ | ตรวจสอบว่าคุณเข้าสู่ระบบใน VM (ไม่ใช่เครื่องโฮสต์) ขณะเรียกใช้ `openclaw channels login`        |

## เอกสารที่เกี่ยวข้อง

- [การโฮสต์บน VPS](/th/vps)
- [Node](/th/nodes)
- [Gateway ระยะไกล](/th/gateway/remote)
- [ช่องทาง iMessage](/th/channels/imessage)
- [คู่มือเริ่มต้นฉบับย่อของ Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [เอกสารอ้างอิง CLI ของ Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [การตั้งค่า VM แบบไม่ต้องมีผู้ดูแล](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (ขั้นสูง)
- [การแยกสภาพแวดล้อมด้วย Docker](/th/install/docker) (แนวทางการแยกสภาพแวดล้อมทางเลือก)
