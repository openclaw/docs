---
read_when:
    - คุณต้องใช้วิธีติดตั้งอื่นที่ไม่ใช่คู่มือเริ่มต้นใช้งานแบบรวดเร็ว
    - คุณต้องการนำไปปรับใช้บนแพลตฟอร์มคลาวด์
    - คุณจำเป็นต้องอัปเดต ย้ายข้อมูล หรือถอนการติดตั้ง
summary: ติดตั้ง OpenClaw - สคริปต์ตัวติดตั้ง, npm/pnpm/bun, จากซอร์ส, Docker และอื่น ๆ
title: ติดตั้ง
x-i18n:
    generated_at: "2026-05-06T09:19:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d5b38787ad80f91c82aa1fd4020a11c99f440ccbf2e9b9309da336dd5883462
    source_path: install/index.md
    workflow: 16
---

## ข้อกำหนดของระบบ

- **Node 24** (แนะนำ) หรือ Node 22.14+ - สคริปต์ตัวติดตั้งจะจัดการเรื่องนี้ให้อัตโนมัติ
- **macOS, Linux หรือ Windows** - รองรับทั้ง Windows แบบเนทีฟและ WSL2; WSL2 เสถียรกว่า ดู [Windows](/th/platforms/windows)
- ต้องใช้ `pnpm` เฉพาะเมื่อคุณสร้างจากซอร์ส

## แนะนำ: สคริปต์ตัวติดตั้ง

วิธีติดตั้งที่เร็วที่สุด ระบบจะตรวจหา OS ของคุณ ติดตั้ง Node หากจำเป็น ติดตั้ง OpenClaw และเริ่มขั้นตอนเริ่มต้นใช้งาน

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

หากต้องการติดตั้งโดยไม่เรียกใช้ขั้นตอนเริ่มต้นใช้งาน:

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

สำหรับ flag ทั้งหมดและตัวเลือก CI/ระบบอัตโนมัติ ดู [รายละเอียดภายในของตัวติดตั้ง](/th/install/installer)

## วิธีติดตั้งทางเลือก

### ตัวติดตั้ง prefix ภายในเครื่อง (`install-cli.sh`)

ใช้วิธีนี้เมื่อคุณต้องการเก็บ OpenClaw และ Node ไว้ใต้ prefix ภายในเครื่อง เช่น
`~/.openclaw` โดยไม่ต้องพึ่งพาการติดตั้ง Node แบบทั้งระบบ:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

โดยค่าเริ่มต้น วิธีนี้รองรับการติดตั้งผ่าน npm รวมถึงการติดตั้งแบบ git-checkout ภายใต้ flow
prefix เดียวกัน อ้างอิงฉบับเต็ม: [รายละเอียดภายในของตัวติดตั้ง](/th/install/installer#install-clish)

ติดตั้งไว้แล้วใช่ไหม? สลับระหว่างการติดตั้งแบบแพ็กเกจและแบบ git ด้วย
`openclaw update --channel dev` และ `openclaw update --channel stable` ดู
[การอัปเดต](/th/install/updating#switch-between-npm-and-git-installs)

### npm, pnpm หรือ bun

หากคุณจัดการ Node เองอยู่แล้ว:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm ต้องได้รับการอนุมัติอย่างชัดเจนสำหรับแพ็กเกจที่มีสคริปต์ build ให้เรียกใช้ `pnpm approve-builds -g` หลังการติดตั้งครั้งแรก
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    รองรับ Bun สำหรับเส้นทางติดตั้ง CLI แบบ global สำหรับ runtime ของ Gateway ยังคงแนะนำให้ใช้ Node เป็น daemon runtime
    </Note>

  </Tab>
</Tabs>

<Accordion title="การแก้ปัญหา: ข้อผิดพลาด build ของ sharp (npm)">
  หาก `sharp` ล้มเหลวเนื่องจาก libvips ที่ติดตั้งแบบ global:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### จากซอร์ส

สำหรับผู้ร่วมพัฒนาหรือผู้ที่ต้องการเรียกใช้จาก checkout ภายในเครื่อง:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

หรือข้ามการ link แล้วใช้ `pnpm openclaw ...` จากภายใน repo ดู [การตั้งค่า](/th/start/setup) สำหรับ workflow การพัฒนาแบบเต็ม

### ติดตั้งจาก GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### คอนเทนเนอร์และตัวจัดการแพ็กเกจ

<CardGroup cols={2}>
  <Card title="Docker" href="/th/install/docker" icon="container">
    การปรับใช้แบบคอนเทนเนอร์หรือแบบไม่มีหน้าจอ
  </Card>
  <Card title="Podman" href="/th/install/podman" icon="container">
    ทางเลือกคอนเทนเนอร์แบบ rootless แทน Docker
  </Card>
  <Card title="Nix" href="/th/install/nix" icon="snowflake">
    การติดตั้งแบบประกาศผ่าน Nix flake
  </Card>
  <Card title="Ansible" href="/th/install/ansible" icon="server">
    การจัดเตรียมเครื่องจำนวนมากแบบอัตโนมัติ
  </Card>
  <Card title="Bun" href="/th/install/bun" icon="zap">
    การใช้งานเฉพาะ CLI ผ่าน Bun runtime
  </Card>
</CardGroup>

## ตรวจสอบการติดตั้ง

```bash
openclaw --version      # ยืนยันว่า CLI พร้อมใช้งาน
openclaw doctor         # ตรวจหาปัญหาการกำหนดค่า
openclaw gateway status # ตรวจสอบว่า Gateway กำลังทำงาน
```

หากคุณต้องการให้เริ่มทำงานแบบมีการจัดการหลังติดตั้ง:

- macOS: LaunchAgent ผ่าน `openclaw onboard --install-daemon` หรือ `openclaw gateway install`
- Linux/WSL2: systemd user service ผ่านคำสั่งเดียวกัน
- Windows แบบเนทีฟ: ใช้ Scheduled Task ก่อน พร้อม fallback เป็นรายการ login ในโฟลเดอร์ Startup ต่อผู้ใช้ หากการสร้าง task ถูกปฏิเสธ

## การโฮสต์และการปรับใช้

ปรับใช้ OpenClaw บนเซิร์ฟเวอร์คลาวด์หรือ VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/th/vps">VPS Linux ใดก็ได้</Card>
  <Card title="Docker VM" href="/th/install/docker-vm-runtime">ขั้นตอน Docker ที่ใช้ร่วมกัน</Card>
  <Card title="Kubernetes" href="/th/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/th/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/th/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/th/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/th/install/azure">Azure</Card>
  <Card title="Railway" href="/th/install/railway">Railway</Card>
  <Card title="Render" href="/th/install/render">Render</Card>
  <Card title="Northflank" href="/th/install/northflank">Northflank</Card>
</CardGroup>

## อัปเดต ย้าย หรือถอนการติดตั้ง

<CardGroup cols={3}>
  <Card title="การอัปเดต" href="/th/install/updating" icon="refresh-cw">
    รักษา OpenClaw ให้เป็นเวอร์ชันล่าสุด
  </Card>
  <Card title="การย้าย" href="/th/install/migrating" icon="arrow-right">
    ย้ายไปยังเครื่องใหม่
  </Card>
  <Card title="ถอนการติดตั้ง" href="/th/install/uninstall" icon="trash-2">
    ลบ OpenClaw ออกทั้งหมด
  </Card>
</CardGroup>

## การแก้ปัญหา: ไม่พบ `openclaw`

หากการติดตั้งสำเร็จแล้วแต่ไม่พบ `openclaw` ในเทอร์มินัลของคุณ:

```bash
node -v           # ติดตั้ง Node แล้วหรือไม่?
npm prefix -g     # แพ็กเกจ global อยู่ที่ใด?
echo "$PATH"      # ไดเรกทอรี bin แบบ global อยู่ใน PATH หรือไม่?
```

หาก `$(npm prefix -g)/bin` ไม่อยู่ใน `$PATH` ให้เพิ่มลงในไฟล์เริ่มต้นของ shell (`~/.zshrc` หรือ `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

จากนั้นเปิดเทอร์มินัลใหม่ ดู [การตั้งค่า Node](/th/install/node) สำหรับรายละเอียดเพิ่มเติม
