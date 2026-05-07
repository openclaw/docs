---
read_when:
    - คุณต้องการวิธีติดตั้งอื่นนอกเหนือจากคู่มือเริ่มต้นใช้งานแบบรวดเร็ว
    - คุณต้องการปรับใช้บนแพลตฟอร์มคลาวด์
    - คุณจำเป็นต้องอัปเดต ย้ายข้อมูล หรือถอนการติดตั้ง
summary: ติดตั้ง OpenClaw - สคริปต์ติดตั้ง, npm/pnpm/bun, จากซอร์สโค้ด, Docker และอื่นๆ
title: ติดตั้ง
x-i18n:
    generated_at: "2026-05-07T13:21:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a5dc92d262710cc96a160b7cac2b93ee1e25f994ddcd45e274ad96c026b7d72
    source_path: install/index.md
    workflow: 16
---

## ข้อกำหนดของระบบ

- **Node 24** (แนะนำ) หรือ Node 22.16+ - สคริปต์ติดตั้งจัดการเรื่องนี้ให้อัตโนมัติ
- **macOS, Linux หรือ Windows** - รองรับทั้ง Windows แบบเนทีฟและ WSL2; WSL2 มีความเสถียรมากกว่า ดู [Windows](/th/platforms/windows)
- จำเป็นต้องใช้ `pnpm` เฉพาะเมื่อคุณ build จากซอร์ส

## แนะนำ: สคริปต์ติดตั้ง

วิธีติดตั้งที่เร็วที่สุด โดยจะตรวจหา OS ของคุณ ติดตั้ง Node หากจำเป็น ติดตั้ง OpenClaw และเริ่ม onboarding

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

สำหรับ flags ทั้งหมดและตัวเลือก CI/automation ดู [รายละเอียดภายในของตัวติดตั้ง](/th/install/installer)

## วิธีติดตั้งทางเลือก

### ตัวติดตั้งแบบ local prefix (`install-cli.sh`)

ใช้วิธีนี้เมื่อคุณต้องการเก็บ OpenClaw และ Node ไว้ใต้ local prefix เช่น
`~/.openclaw` โดยไม่ต้องพึ่งการติดตั้ง Node ระดับทั้งระบบ:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

โดยค่าเริ่มต้นรองรับการติดตั้งผ่าน npm รวมถึงการติดตั้งแบบ git-checkout ภายใต้ flow
prefix เดียวกัน อ้างอิงฉบับเต็ม: [รายละเอียดภายในของตัวติดตั้ง](/th/install/installer#install-clish)

ติดตั้งไว้แล้วใช่ไหม สลับระหว่างการติดตั้งแบบ package และ git ด้วย
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
    pnpm ต้องได้รับการอนุมัติอย่างชัดเจนสำหรับ packages ที่มี build scripts รัน `pnpm approve-builds -g` หลังการติดตั้งครั้งแรก
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    รองรับ Bun สำหรับเส้นทางการติดตั้ง CLI แบบ global สำหรับรันไทม์ของ Gateway ยังแนะนำให้ใช้ Node เป็นรันไทม์ daemon
    </Note>

  </Tab>
</Tabs>

<Accordion title="การแก้ไขปัญหา: ข้อผิดพลาดการ build ของ sharp (npm)">
  หาก `sharp` ล้มเหลวเนื่องจาก libvips ที่ติดตั้งแบบ global:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### จากซอร์ส

สำหรับผู้ร่วมพัฒนาหรือใครก็ตามที่ต้องการรันจาก checkout ภายในเครื่อง:

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

### Containers และ package managers

<CardGroup cols={2}>
  <Card title="Docker" href="/th/install/docker" icon="container">
    การ deploy แบบ containerized หรือ headless
  </Card>
  <Card title="Podman" href="/th/install/podman" icon="container">
    ทางเลือก container แบบ rootless แทน Docker
  </Card>
  <Card title="Nix" href="/th/install/nix" icon="snowflake">
    การติดตั้งแบบ declarative ผ่าน Nix flake
  </Card>
  <Card title="Ansible" href="/th/install/ansible" icon="server">
    การ provision fleet แบบอัตโนมัติ
  </Card>
  <Card title="Bun" href="/th/install/bun" icon="zap">
    การใช้งานเฉพาะ CLI ผ่านรันไทม์ Bun
  </Card>
</CardGroup>

## ตรวจสอบการติดตั้ง

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

หากคุณต้องการ managed startup หลังติดตั้ง:

- macOS: LaunchAgent ผ่าน `openclaw onboard --install-daemon` หรือ `openclaw gateway install`
- Linux/WSL2: systemd user service ผ่านคำสั่งเดียวกัน
- Windows แบบเนทีฟ: ใช้ Scheduled Task ก่อน โดยมีรายการ login ใน Startup-folder ต่อผู้ใช้เป็น fallback หากการสร้าง task ถูกปฏิเสธ

## Hosting และ deployment

Deploy OpenClaw บน cloud server หรือ VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/th/vps">VPS Linux ใดก็ได้</Card>
  <Card title="Docker VM" href="/th/install/docker-vm-runtime">ขั้นตอน Docker ร่วมกัน</Card>
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
    ทำให้ OpenClaw เป็นปัจจุบันอยู่เสมอ
  </Card>
  <Card title="การย้าย" href="/th/install/migrating" icon="arrow-right">
    ย้ายไปยังเครื่องใหม่
  </Card>
  <Card title="ถอนการติดตั้ง" href="/th/install/uninstall" icon="trash-2">
    ลบ OpenClaw ออกทั้งหมด
  </Card>
</CardGroup>

## การแก้ไขปัญหา: ไม่พบ `openclaw`

หากติดตั้งสำเร็จแล้วแต่ไม่พบ `openclaw` ใน terminal ของคุณ:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

หาก `$(npm prefix -g)/bin` ไม่อยู่ใน `$PATH` ของคุณ ให้เพิ่มลงในไฟล์ startup ของ shell (`~/.zshrc` หรือ `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

จากนั้นเปิด terminal ใหม่ ดู [การตั้งค่า Node](/th/install/node) สำหรับรายละเอียดเพิ่มเติม
