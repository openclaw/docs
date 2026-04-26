---
read_when:
    - คุณต้องการวิธีติดตั้งที่นอกเหนือจากการเริ่มต้นใช้งานแบบรวดเร็วใน Getting Started
    - คุณต้องการปรับใช้ไปยังแพลตฟอร์มคลาวด์
    - คุณต้องการอัปเดต ย้ายระบบ หรือถอนการติดตั้ง
summary: ติดตั้ง OpenClaw — สคริปต์ติดตั้ง, npm/pnpm/bun, จากซอร์ส, Docker และอื่น ๆ
title: ติดตั้ง
x-i18n:
    generated_at: "2026-04-26T11:34:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8dc6b9511be6bf9060cc150a7c51daf3b6d556dab4a85910094b4b892145cd7
    source_path: install/index.md
    workflow: 15
---

## ข้อกำหนดของระบบ

- **Node 24** (แนะนำ) หรือ Node 22.14+ — สคริปต์ติดตั้งจะจัดการส่วนนี้ให้อัตโนมัติ
- **macOS, Linux หรือ Windows** — รองรับทั้ง Windows แบบ native และ WSL2; WSL2 มีความเสถียรกว่า ดู [Windows](/th/platforms/windows)
- ต้องใช้ `pnpm` เฉพาะเมื่อคุณ build จากซอร์ส

## แนะนำ: สคริปต์ติดตั้ง

วิธีติดตั้งที่เร็วที่สุด โดยจะตรวจจับระบบปฏิบัติการของคุณ ติดตั้ง Node หากจำเป็น ติดตั้ง OpenClaw และเริ่มขั้นตอน onboarding

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

หากต้องการติดตั้งโดยไม่รัน onboarding:

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

สำหรับ flags ทั้งหมดและตัวเลือกสำหรับ CI/automation ดู [รายละเอียดภายในของตัวติดตั้ง](/th/install/installer)

## วิธีติดตั้งทางเลือก

### ตัวติดตั้งแบบ local prefix (`install-cli.sh`)

ใช้วิธีนี้เมื่อคุณต้องการให้ OpenClaw และ Node อยู่ภายใต้ local prefix เช่น
`~/.openclaw` โดยไม่ต้องพึ่งพา Node ที่ติดตั้งทั้งระบบ:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

ค่าเริ่มต้นรองรับการติดตั้งผ่าน npm และรองรับการติดตั้งจาก git checkout ภายใต้
prefix flow เดียวกันด้วย เอกสารฉบับเต็ม: [รายละเอียดภายในของตัวติดตั้ง](/th/install/installer#install-clish)

ติดตั้งอยู่แล้วใช่ไหม? สลับระหว่างการติดตั้งแบบ package และ git ได้ด้วย
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
    pnpm ต้องการการอนุมัติอย่างชัดเจนสำหรับแพ็กเกจที่มี build scripts ให้รัน `pnpm approve-builds -g` หลังการติดตั้งครั้งแรก
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    รองรับ Bun สำหรับเส้นทางการติดตั้ง CLI แบบ global สำหรับรันไทม์ของ Gateway ยังคงแนะนำให้ใช้ Node เป็น daemon runtime
    </Note>

  </Tab>
</Tabs>

<Accordion title="การแก้ไขปัญหา: ข้อผิดพลาดการ build ของ sharp (npm)">
  หาก `sharp` ล้มเหลวเนื่องจากมี libvips แบบติดตั้ง global อยู่:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### จากซอร์ส

สำหรับผู้ร่วมพัฒนาหรือผู้ที่ต้องการรันจาก local checkout:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

หรือข้ามการ link แล้วใช้ `pnpm openclaw ...` จากภายใน repo ก็ได้ ดู [Setup](/th/start/setup) สำหรับเวิร์กโฟลว์การพัฒนาแบบเต็ม

### ติดตั้งจาก GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Containers และ package managers

<CardGroup cols={2}>
  <Card title="Docker" href="/th/install/docker" icon="container">
    การปรับใช้แบบ containerized หรือแบบ headless
  </Card>
  <Card title="Podman" href="/th/install/podman" icon="container">
    ทางเลือกแบบ rootless container แทน Docker
  </Card>
  <Card title="Nix" href="/th/install/nix" icon="snowflake">
    การติดตั้งแบบ declarative ผ่าน Nix flake
  </Card>
  <Card title="Ansible" href="/th/install/ansible" icon="server">
    การ provision แบบอัตโนมัติสำหรับหลายเครื่อง
  </Card>
  <Card title="Bun" href="/th/install/bun" icon="zap">
    การใช้งานแบบ CLI เท่านั้นผ่านรันไทม์ Bun
  </Card>
</CardGroup>

## ตรวจสอบการติดตั้ง

```bash
openclaw --version      # ยืนยันว่า CLI พร้อมใช้งาน
openclaw doctor         # ตรวจสอบปัญหาของ config
openclaw gateway status # ยืนยันว่า Gateway กำลังทำงานอยู่
```

หากคุณต้องการให้เริ่มทำงานแบบมีการจัดการหลังติดตั้ง:

- macOS: LaunchAgent ผ่าน `openclaw onboard --install-daemon` หรือ `openclaw gateway install`
- Linux/WSL2: systemd user service ผ่านคำสั่งเดียวกัน
- Windows แบบ native: ใช้ Scheduled Task ก่อน โดยมี fallback เป็น login item ใน Startup folder ต่อผู้ใช้ หากการสร้าง task ถูกปฏิเสธ

## การโฮสต์และการปรับใช้

ปรับใช้ OpenClaw บนเซิร์ฟเวอร์คลาวด์หรือ VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/th/vps">Linux VPS ใดก็ได้</Card>
  <Card title="Docker VM" href="/th/install/docker-vm-runtime">ขั้นตอน Docker แบบใช้ร่วมกัน</Card>
  <Card title="Kubernetes" href="/th/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/th/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/th/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/th/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/th/install/azure">Azure</Card>
  <Card title="Railway" href="/th/install/railway">Railway</Card>
  <Card title="Render" href="/th/install/render">Render</Card>
  <Card title="Northflank" href="/th/install/northflank">Northflank</Card>
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

หากติดตั้งสำเร็จแล้วแต่ไม่พบ `openclaw` ในเทอร์มินัลของคุณ:

```bash
node -v           # ติดตั้ง Node แล้วหรือยัง?
npm prefix -g     # แพ็กเกจ global อยู่ที่ไหน?
echo "$PATH"      # global bin dir อยู่ใน PATH หรือไม่?
```

หาก `$(npm prefix -g)/bin` ไม่ได้อยู่ใน `$PATH` ให้เพิ่มลงในไฟล์เริ่มต้นของ shell (`~/.zshrc` หรือ `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

จากนั้นเปิดเทอร์มินัลใหม่ ดู [การตั้งค่า Node](/th/install/node) สำหรับรายละเอียดเพิ่มเติม
