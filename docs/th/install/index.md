---
read_when:
    - คุณต้องการวิธีติดตั้งแบบอื่นนอกเหนือจากคู่มือเริ่มต้นฉบับย่อ
    - คุณต้องการนำไปใช้งานบนแพลตฟอร์มคลาวด์
    - คุณต้องอัปเดต ย้ายระบบ หรือถอนการติดตั้ง
summary: ติดตั้ง OpenClaw — สคริปต์ติดตั้ง, npm/pnpm/bun, จากซอร์สโค้ด, Docker และอื่น ๆ
title: ติดตั้ง
x-i18n:
    generated_at: "2026-07-12T16:18:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc819cc6c1d57af0739a7d11f0f2834479ddabbca0571b105b8cb9325e87b145
    source_path: install/index.md
    workflow: 16
---

## ข้อกำหนดของระบบ

- **Node 22.19+, 23.11+ หรือ 24+** - Node 24 เป็นเวอร์ชันเป้าหมายเริ่มต้น โดยสคริปต์ติดตั้งจะจัดการเรื่องนี้โดยอัตโนมัติ
- **macOS, Linux หรือ Windows** - ผู้ใช้ Windows สามารถเริ่มต้นด้วยแอป Windows Hub แบบเนทีฟ โปรแกรมติดตั้ง CLI สำหรับ PowerShell หรือ Gateway บน WSL2 ดูที่ [Windows](/th/platforms/windows)
- จำเป็นต้องใช้ `pnpm` เฉพาะเมื่อคุณสร้างจากซอร์สโค้ด

## แนะนำ: สคริปต์ติดตั้ง

วิธีติดตั้งที่รวดเร็วที่สุด โดยจะตรวจหาระบบปฏิบัติการของคุณ ติดตั้ง Node หากจำเป็น ติดตั้ง OpenClaw และเริ่มกระบวนการตั้งค่าเริ่มต้น

<Note>
ผู้ใช้เดสก์ท็อป Windows ยังสามารถติดตั้งแอปคู่หู [Windows Hub](/th/platforms/windows#recommended-windows-hub) แบบเนทีฟ ซึ่งมีการตั้งค่า สถานะในถาดระบบ แชต โหมด Node และโหมด MCP ภายในเครื่อง
</Note>

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

หากต้องการติดตั้งโดยไม่เรียกใช้กระบวนการตั้งค่าเริ่มต้น:

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

สำหรับแฟล็กทั้งหมดและตัวเลือก CI/ระบบอัตโนมัติ โปรดดู [รายละเอียดภายในของโปรแกรมติดตั้ง](/th/install/installer)

## วิธีติดตั้งทางเลือก

### โปรแกรมติดตั้งด้วยคำนำหน้าภายในเครื่อง (`install-cli.sh`)

ใช้วิธีนี้เมื่อคุณต้องการเก็บ OpenClaw และ Node ไว้ภายใต้คำนำหน้าภายในเครื่อง เช่น
`~/.openclaw` โดยไม่ต้องพึ่งพาการติดตั้ง Node ทั่วทั้งระบบ:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

โดยค่าเริ่มต้นรองรับการติดตั้งด้วย npm รวมถึงการติดตั้งจาก git checkout ภายใต้
กระบวนการคำนำหน้าเดียวกัน เอกสารอ้างอิงฉบับเต็ม: [รายละเอียดภายในของโปรแกรมติดตั้ง](/th/install/installer#install-clish)

ติดตั้งไว้แล้วใช่ไหม สลับระหว่างการติดตั้งแบบแพ็กเกจและ git ด้วย
`openclaw update --channel dev` และ `openclaw update --channel stable` ดูที่
[การอัปเดต](/th/install/updating#switch-between-npm-and-git-installs)

### npm, pnpm หรือ bun

หากคุณจัดการ Node ด้วยตนเองอยู่แล้ว:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    โปรแกรมติดตั้งที่ให้บริการผ่านโฮสต์จะล้างตัวกรองความใหม่ของ npm เช่น `min-release-age`
    สำหรับการติดตั้งแพ็กเกจ OpenClaw หากคุณติดตั้งด้วย npm ด้วยตนเอง
    นโยบาย npm ของคุณเองจะยังคงมีผล
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm กำหนดให้อนุมัติแพ็กเกจที่มีสคริปต์สร้างอย่างชัดเจน เรียกใช้ `pnpm approve-builds -g` หลังการติดตั้งครั้งแรก
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    รองรับ Bun สำหรับเส้นทางการติดตั้ง CLI แบบส่วนกลาง สำหรับรันไทม์ Gateway ยังคงแนะนำให้ใช้ Node เป็นรันไทม์ของดีมอน
    </Note>

  </Tab>
</Tabs>

### จากซอร์สโค้ด

สำหรับผู้ร่วมพัฒนาหรือผู้ที่ต้องการเรียกใช้จาก checkout ภายในเครื่อง:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

หรือข้ามการลิงก์แล้วใช้ `pnpm openclaw ...` จากภายในรีโพซิทอรี ดูขั้นตอนการพัฒนาแบบเต็มได้ที่ [การตั้งค่า](/th/start/setup)

### ติดตั้งจาก checkout ของสาขา main บน GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### คอนเทนเนอร์และตัวจัดการแพ็กเกจ

<CardGroup cols={2}>
  <Card title="Docker" href="/th/install/docker" icon="container">
    การปรับใช้แบบคอนเทนเนอร์หรือไม่มีส่วนติดต่อผู้ใช้
  </Card>
  <Card title="Podman" href="/th/install/podman" icon="container">
    ทางเลือกคอนเทนเนอร์แบบไม่ใช้สิทธิ์ root แทน Docker
  </Card>
  <Card title="Nix" href="/th/install/nix" icon="snowflake">
    การติดตั้งแบบประกาศผ่าน Nix flake
  </Card>
  <Card title="Ansible" href="/th/install/ansible" icon="server">
    การจัดเตรียมระบบหลายเครื่องแบบอัตโนมัติ
  </Card>
  <Card title="Bun" href="/th/install/bun" icon="zap">
    การใช้งานเฉพาะ CLI ผ่านรันไทม์ Bun
  </Card>
</CardGroup>

## ตรวจสอบการติดตั้ง

```bash
openclaw --version      # ยืนยันว่า CLI พร้อมใช้งาน
openclaw doctor         # ตรวจสอบปัญหาการกำหนดค่า
openclaw gateway status # ตรวจสอบว่า Gateway กำลังทำงาน
```

หากคุณต้องการให้ระบบจัดการการเริ่มทำงานหลังการติดตั้ง:

- macOS: ใช้ LaunchAgent ผ่าน `openclaw onboard --install-daemon` หรือ `openclaw gateway install`
- Linux/WSL2: ใช้บริการผู้ใช้ systemd ผ่านคำสั่งเดียวกัน
- Windows แบบเนทีฟ: ใช้ Scheduled Task ก่อน และใช้รายการเข้าสู่ระบบในโฟลเดอร์ Startup ของผู้ใช้เป็นทางเลือกสำรอง หากถูกปฏิเสธการสร้างงาน

## การโฮสต์และการปรับใช้

ปรับใช้ OpenClaw บนเซิร์ฟเวอร์คลาวด์หรือ VPS ดูตัวเลือกผู้ให้บริการทั้งหมดได้ที่ [เซิร์ฟเวอร์ Linux](/th/vps) (DigitalOcean, Hetzner, Hostinger, Fly.io, GCP, Azure, Railway,
Northflank, Oracle Cloud, Raspberry Pi และอื่นๆ) หรือปรับใช้แบบประกาศบน
[Render](/th/install/render)

<CardGroup cols={3}>
  <Card title="VPS" href="/th/vps">
    เลือกผู้ให้บริการ
  </Card>
  <Card title="Docker VM" href="/th/install/docker-vm-runtime">
    ขั้นตอน Docker ที่ใช้ร่วมกัน
  </Card>
  <Card title="Kubernetes" href="/th/install/kubernetes">
    การปรับใช้ K8s
  </Card>
</CardGroup>

## อัปเดต ย้ายระบบ หรือถอนการติดตั้ง

<CardGroup cols={3}>
  <Card title="การอัปเดต" href="/th/install/updating" icon="refresh-cw">
    ทำให้ OpenClaw เป็นเวอร์ชันล่าสุดอยู่เสมอ
  </Card>
  <Card title="การย้ายระบบ" href="/th/install/migrating" icon="arrow-right">
    ย้ายไปยังเครื่องใหม่
  </Card>
  <Card title="ถอนการติดตั้ง" href="/th/install/uninstall" icon="trash-2">
    ลบ OpenClaw ออกทั้งหมด
  </Card>
</CardGroup>

## การแก้ไขปัญหา: ไม่พบ `openclaw`

เกือบทุกกรณีเกิดจากปัญหา PATH กล่าวคือ ไดเรกทอรีไบนารีส่วนกลางของ npm ไม่ได้อยู่ใน `PATH` ของเชลล์ ดูวิธีแก้ไขทั้งหมด รวมถึงพาธของ Windows ได้ที่ [การแก้ไขปัญหา Node.js](/th/install/node#troubleshooting)

```bash
node -v           # ติดตั้ง Node แล้วหรือยัง?
npm prefix -g     # แพ็กเกจส่วนกลางอยู่ที่ใด?
echo "$PATH"      # ไดเรกทอรีไบนารีส่วนกลางอยู่ใน PATH หรือไม่?
```
