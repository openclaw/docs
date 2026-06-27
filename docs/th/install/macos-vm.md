---
read_when:
    - คุณต้องการแยก OpenClaw ออกจากสภาพแวดล้อม macOS หลักของคุณ
    - คุณต้องการการผสานการทำงานกับ iMessage ใน sandbox
    - คุณต้องการสภาพแวดล้อม macOS ที่รีเซ็ตได้ซึ่งคุณสามารถโคลนได้
    - คุณต้องการเปรียบเทียบตัวเลือก VM ของ macOS แบบ local กับแบบโฮสต์
summary: เรียกใช้ OpenClaw ใน VM macOS แบบ sandboxed (ภายในเครื่องหรือโฮสต์ภายนอก) เมื่อคุณต้องการการแยกสภาพแวดล้อมหรือ iMessage
title: VM ของ macOS
x-i18n:
    generated_at: "2026-06-27T17:44:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aee2fa0651b711f29d7d092da931bd924bc8ce8a5ca389cf8f189725fa586f3f
    source_path: install/macos-vm.md
    workflow: 16
---

## ค่าเริ่มต้นที่แนะนำ (ผู้ใช้ส่วนใหญ่)

- **VPS Linux ขนาดเล็ก** สำหรับ Gateway ที่ทำงานตลอดเวลาและมีต้นทุนต่ำ ดู [โฮสติ้ง VPS](/th/vps)
- **ฮาร์ดแวร์เฉพาะ** (Mac mini หรือเครื่อง Linux) หากคุณต้องการควบคุมเต็มรูปแบบและใช้ **IP ที่พักอาศัย** สำหรับการทำงานอัตโนมัติบนเบราว์เซอร์ เว็บไซต์จำนวนมากบล็อก IP ของศูนย์ข้อมูล ดังนั้นการเรียกดูจากเครื่องภายในมักทำงานได้ดีกว่า
- **แบบไฮบริด:** เก็บ Gateway ไว้บน VPS ราคาถูก และเชื่อมต่อ Mac ของคุณเป็น **Node** เมื่อคุณต้องการการทำงานอัตโนมัติของเบราว์เซอร์/UI ดู [Node](/th/nodes) และ [Gateway ระยะไกล](/th/gateway/remote)

ใช้ VM macOS เมื่อคุณต้องการความสามารถที่มีเฉพาะบน macOS โดยเฉพาะ เช่น iMessage หรือต้องการแยกสภาพแวดล้อมออกจาก Mac ที่ใช้ประจำอย่างเข้มงวด

## ตัวเลือก VM macOS

### VM ภายในบน Apple Silicon Mac ของคุณ (Lume)

เรียกใช้ OpenClaw ใน VM macOS แบบแซนด์บ็อกซ์บน Apple Silicon Mac ที่คุณมีอยู่ โดยใช้ [Lume](https://cua.ai/docs/lume)

สิ่งนี้ให้คุณ:

- สภาพแวดล้อม macOS เต็มรูปแบบในพื้นที่แยก (โฮสต์ของคุณยังคงสะอาด)
- รองรับ iMessage ผ่าน `imsg` (เส้นทางภายในเครื่องเริ่มต้นทำบน Linux/Windows ไม่ได้)
- รีเซ็ตได้ทันทีด้วยการโคลน VM
- ไม่มีค่าใช้จ่ายฮาร์ดแวร์หรือคลาวด์เพิ่มเติม

### ผู้ให้บริการ Mac แบบโฮสต์ (คลาวด์)

หากคุณต้องการ macOS บนคลาวด์ ผู้ให้บริการ Mac แบบโฮสต์ก็ใช้งานได้เช่นกัน:

- [MacStadium](https://www.macstadium.com/) (Mac แบบโฮสต์)
- ผู้ให้บริการ Mac แบบโฮสต์รายอื่นก็ใช้งานได้เช่นกัน ให้ทำตามเอกสาร VM + SSH ของพวกเขา

เมื่อคุณมีสิทธิ์เข้าถึง SSH ไปยัง VM macOS แล้ว ให้ทำต่อที่ขั้นตอนที่ 6 ด้านล่าง

---

## เส้นทางด่วน (Lume, ผู้ใช้ที่มีประสบการณ์)

1. ติดตั้ง Lume
2. `lume create openclaw --os macos --ipsw latest`
3. ดำเนินการในผู้ช่วยตั้งค่าให้เสร็จ เปิดใช้การเข้าสู่ระบบระยะไกล (SSH)
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

## 2) สร้าง VM macOS

```bash
lume create openclaw --os macos --ipsw latest
```

คำสั่งนี้จะดาวน์โหลด macOS และสร้าง VM หน้าต่าง VNC จะเปิดขึ้นโดยอัตโนมัติ

<Note>
การดาวน์โหลดอาจใช้เวลาสักพัก ขึ้นอยู่กับการเชื่อมต่อของคุณ
</Note>

---

## 3) ดำเนินการในผู้ช่วยตั้งค่าให้เสร็จ

ในหน้าต่าง VNC:

1. เลือกภาษาและภูมิภาค
2. ข้าม Apple ID (หรือเข้าสู่ระบบหากคุณต้องการใช้ iMessage ภายหลัง)
3. สร้างบัญชีผู้ใช้ (จดจำชื่อผู้ใช้และรหัสผ่านไว้)
4. ข้ามคุณสมบัติเสริมทั้งหมด

หลังจากการตั้งค่าเสร็จสิ้น:

1. เปิดใช้ SSH: เปิดการตั้งค่าระบบ -> ทั่วไป -> การแชร์ และเปิดใช้ "การเข้าสู่ระบบระยะไกล"
2. สำหรับการใช้ VM แบบไม่มีหน้าจอ ให้เปิดใช้การเข้าสู่ระบบอัตโนมัติ: เปิดการตั้งค่าระบบ -> ผู้ใช้และกลุ่ม เลือก "เข้าสู่ระบบอัตโนมัติเป็น:" แล้วเลือกผู้ใช้ VM

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

ทำตามพรอมป์การเริ่มต้นใช้งานเพื่อตั้งค่าผู้ให้บริการโมเดลของคุณ (Anthropic, OpenAI และอื่น ๆ)

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

VM จะทำงานอยู่เบื้องหลัง เดมอนของ OpenClaw จะทำให้ Gateway ทำงานต่อไป

เพื่อตรวจสอบสถานะ:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## โบนัส: การผสานรวม iMessage

นี่คือคุณสมบัติเด่นของการทำงานบน macOS ใช้ [iMessage](/th/channels/imessage) ร่วมกับ `imsg` เพื่อเพิ่ม Messages เข้าไปใน OpenClaw

ภายใน VM:

1. เข้าสู่ระบบ Messages
2. ติดตั้ง `imsg`
3. ให้สิทธิ์การเข้าถึงดิสก์แบบเต็มและสิทธิ์การทำงานอัตโนมัติแก่กระบวนการที่เรียกใช้ OpenClaw/`imsg`
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

ก่อนปรับแต่งเพิ่มเติม ให้สร้างสแนปช็อตของสถานะสะอาดของคุณ:

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

## การทำงาน 24/7

ทำให้ VM ทำงานต่อเนื่องโดย:

- เสียบปลั๊ก Mac ของคุณไว้
- ปิดโหมดพักเครื่องในการตั้งค่าระบบ → การประหยัดพลังงาน
- ใช้ `caffeinate` หากจำเป็น

สำหรับการทำงานตลอดเวลาอย่างแท้จริง ให้พิจารณา Mac mini เฉพาะหรือ VPS ขนาดเล็ก ดู [โฮสติ้ง VPS](/th/vps)

---

## การแก้ไขปัญหา

| ปัญหา | วิธีแก้ไข |
| ------------------------ | ---------------------------------------------------------------------------------- |
| ไม่สามารถ SSH เข้า VM ได้ | ตรวจสอบว่าเปิดใช้ "การเข้าสู่ระบบระยะไกล" ในการตั้งค่าระบบของ VM แล้ว |
| IP ของ VM ไม่แสดง | รอให้ VM บูตเสร็จสมบูรณ์ แล้วเรียกใช้ `lume get openclaw` อีกครั้ง |
| ไม่พบคำสั่ง Lume | เพิ่ม `~/.local/bin` ลงใน PATH ของคุณ |
| สแกน QR ของ WhatsApp ไม่ได้ | ตรวจสอบว่าคุณเข้าสู่ระบบใน VM (ไม่ใช่โฮสต์) เมื่อเรียกใช้ `openclaw channels login` |

---

## เอกสารที่เกี่ยวข้อง

- [โฮสติ้ง VPS](/th/vps)
- [Node](/th/nodes)
- [Gateway ระยะไกล](/th/gateway/remote)
- [ช่องทาง iMessage](/th/channels/imessage)
- [เริ่มต้นอย่างรวดเร็วกับ Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [ข้อมูลอ้างอิง CLI ของ Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [การตั้งค่า VM แบบไม่ต้องมีผู้ดูแล](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (ขั้นสูง)
- [การแซนด์บ็อกซ์ด้วย Docker](/th/install/docker) (วิธีแยกสภาพแวดล้อมทางเลือก)
